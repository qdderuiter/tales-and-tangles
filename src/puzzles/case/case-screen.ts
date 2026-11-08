import { Haptics } from '../../audio/haptics.ts';
import { AudioFX } from '../../audio/sfx.ts';
import { VoiceManager } from '../../audio/voice.ts';
import type { Bear } from '../../characters/barnaby.ts';
import { critterSvg } from '../../characters/critter-svg.ts';
import { $, flashClass, replayClass } from '../../core/dom.ts';
import { REDUCED, late } from '../../core/util.ts';
import type { Level } from '../../data/types.ts';
import { REACT } from '../../data/story.ts';
import { speak } from '../../dialogue/speakers.ts';
import type { Reaction } from '../../dialogue/speakers.ts';
import { STORY } from '../../dialogue/story-builder.ts';
import { Typer } from '../../dialogue/typer.ts';
import { NOTE_KINDS, blankNotes, planCaseHint } from './case-logic.ts';
import type { CaseHint, NoteKind, Notes } from './case-logic.ts';
import type { LevelRun } from '../../state/session.ts';
import { Store } from '../../state/store.ts';
import { UI } from '../../ui/ui.ts';

export const CELL_MARK = ['', '✕', '✓', '✕'];                           // cell state: 0 blank, 1 cross, 2 check, 3 auto-cross

export const LOCKED_MSG: Record<string, string> = { word: 'Solve the Words puzzle', zip: 'Follow the Scent Trail' };

/* Barnaby's hint lines for the notebook (dynamic text, so no pre-recorded voice id) */
export const HINT_PAGE: Record<NoteKind, string> = { items: 'Items', places: 'Rooms', itemPlaces: 'Item ↔ Room' };

export const CASE_HINT = {
  clue:   { id: '', e: 'thinking', t: 'Look at the clue I lit up. Read it again, slowly.' },
  pair:   { id: '', e: 'thinking', t: 'No single clue is enough here. Read the two I lit up side by side.' },
  elim:   (kind: NoteKind) => ({ id: '', e: 'neutral', t: 'On the ' + HINT_PAGE[kind] + ' page, a row or a column has only one choice left.' }),
  link:   (kind: NoteKind) => ({ id: '', e: 'thinking', t: 'What you already know on one page settles something on another. Look at the ' + HINT_PAGE[kind] + ' page.' }),
  combo:  { id: '', e: 'thinking', t: 'Nothing jumps out from one clue alone. Put several clues together.' },
  locked: { id: '', e: 'sad',      t: 'I need more clues first. Solve the other puzzles to open the locked ones!' },
  focus:  (kind: NoteKind, name: string) => ({ id: '', e: 'happy', t: kind === 'items' ? 'Think about what ' + name + ' could have been holding.' : kind === 'places' ? 'Think about where ' + name + ' could have been.' : 'Think about which room the ' + name + ' could be in.' }),
  fixRow: (kind: NoteKind, name: string) => ({ id: '', e: 'thinking', t: 'Hmm, something on the ' + HINT_PAGE[kind] + ' page does not add up. Check the row for ' + (kind === 'itemPlaces' ? 'the ' : '') + name + ' again.' }),
  fixCol: (name: string) => ({ id: '', e: 'thinking', t: 'Look closely at the ' + name + ' column in that row.' }),
  fixed:  { id: '', e: 'proud', t: 'There. I wiped the wrong mark away. The rest is up to you!' }
};

interface CaseEls {
  crime: HTMLElement; tabs: HTMLElement; grid: HTMLElement; hall: HTMLElement; clues: HTMLElement;
  sus: HTMLElement; items: HTMLElement; btn: HTMLButtonElement; auto: HTMLElement;
}
type HintPlan = CaseHint & { sig: string; stage: number; charged: boolean };

/* fields marked late() are filled by init() / load() before anything reads them */
export const CaseScreen = {
  lvl: late<Level>(), run: late<LevelRun>(), notes: late<Notes>(), tab: 'items' as NoteKind, bear: late<Bear>(), typer: late<Typer>(), onSolved: null as ((penalty: number) => void) | null,
  wrong: 0, hints: 0, done: false, selS: -1, selI: -1, els: {} as CaseEls, hintPlan: null as HintPlan | null, hintTimer: 0, cellEls: [] as HTMLButtonElement[],

  init(bear: Bear) {
    this.bear = bear;
    this.typer = new Typer($('#cBubble'), bear);
    const e = this.els;
    e.crime = $('#cCrime'); e.tabs = $('#cTabs'); e.grid = $('#cGrid'); e.hall = $('#cHall'); e.clues = $('#cClues');
    e.sus = $('#cSus'); e.items = $('#cItems'); e.btn = $<HTMLButtonElement>('#btnAccuse'); e.auto = $('#cAuto');
    e.tabs.addEventListener('click', ev => { const b = (ev.target as Element).closest<HTMLElement>('button[data-tab]'); if (b) this.setTab(b.dataset.tab as NoteKind); });
    e.grid.addEventListener('click', ev => { const b = (ev.target as Element).closest<HTMLElement>('button.nbc'); if (b) this.tapCell(Number(b.dataset.s), Number(b.dataset.i)); });
    e.clues.addEventListener('click', ev => { const b = (ev.target as Element).closest<HTMLElement>('.clue-item'); if (b) this.tapClue(Number(b.dataset.k)); });
    e.sus.addEventListener('click', ev => { const b = (ev.target as Element).closest<HTMLElement>('button.chip'); if (b && !this.done) { this.selS = Number(b.dataset.s); AudioFX.tick(this.selS); this.renderAccuse(); } });
    e.items.addEventListener('click', ev => { const b = (ev.target as Element).closest<HTMLElement>('button.chip'); if (b && !this.done) { this.selI = Number(b.dataset.i); AudioFX.tick(this.selI + 3); this.renderAccuse(); } });
    e.auto.addEventListener('click', () => {
      Store.data.settings.autocross = !this.autoOn(); Store.save();
      if (this.notes) NOTE_KINDS.forEach(k => this.recompute(this.notes[k]));
      this.render();
    });
    e.btn.addEventListener('click', () => this.accuse());
    $('#btnCHint').addEventListener('click', () => this.hint());
  },
  autoOn() { return Store.data.settings.autocross !== false; },
  say(r: Reaction) { speak(this.bear, this.typer, r, 17); },

  load(lvl: Level, run: LevelRun, onSolved: (penalty: number) => void) {
    this.lvl = lvl; this.run = run; this.onSolved = onSolved;
    this.done = false; this.wrong = 0; this.hints = 0; this.selS = -1; this.selI = -1; this.tab = 'items'; this.hintPlan = null; clearTimeout(this.hintTimer);
    const c = lvl.case, N = c.N;
    if (!run.notes) run.notes = blankNotes(N);
    if (!run.earned) run.earned = { word: false, zip: false };
    this.notes = run.notes;
    this.els.crime.innerHTML = '<small>The crime</small>' + c.crime + ' Who was there — and what were they holding?';
    this.els.hall.innerHTML = '<small>Rooms, left to right</small>' + c.places.map(p => '<span class="hallchip">' + p.emoji + ' ' + p.name + '</span>').join('<i>›</i>');
    this.render();
    this.say(STORY[lvl.n].caseIntro[0]);
  },

  render() { this.renderTabs(); this.renderGrid(); this.renderClues(); this.renderAccuse(true); },
  setTab(t: NoteKind) { this.tab = t; AudioFX.tick(2 + 2 * NOTE_KINDS.indexOf(t)); this.renderTabs(); this.renderGrid(); },
  renderTabs() {
    this.els.tabs.querySelectorAll<HTMLElement>('button[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === this.tab));
    this.els.auto.textContent = 'Auto-cross: ' + (this.autoOn() ? 'On' : 'Off');
  },

  renderGrid() {
    const c = this.lvl.case, N = c.N, kind = this.tab, cols = kind === 'items' ? c.items : c.places, M = this.notes[kind];
    const g = this.els.grid;
    g.style.gridTemplateColumns = 'minmax(92px,1.7fr) repeat(' + N + ',minmax(0,1fr))';
    let h = '<div class="nbh corner"></div>' + cols.map(x => '<div class="nbh"><span>' + x.emoji + '</span><small>' + x.name + '</small></div>').join('');
    const rows = kind === 'itemPlaces' ? c.items.map(x => ({ name: x.name, icon: '<span>' + x.emoji + '</span>' })) : c.suspects.map(n => ({ name: n, icon: critterSvg(n) }));
    rows.forEach(({ name, icon }, s) => {
      h += '<div class="nbl">' + icon + '<b>' + name + '</b></div>';
      for (let i = 0; i < N; i++) {
        const st = M[s][i];
        h += '<button class="nbc s' + st + '" data-s="' + s + '" data-i="' + i + '" aria-label="' + name + ' / ' + cols[i].name + '">' + CELL_MARK[st] + '</button>';
      }
    });
    g.innerHTML = h;
    this.cellEls = Array.from(g.querySelectorAll<HTMLButtonElement>('button.nbc'));      // row-major, N per row
  },
  /* repaint the existing cell buttons from the matrix (no rebuild) */
  paintCells() {
    const M = this.notes[this.tab], N = M.length;
    this.cellEls.forEach((b, k) => { const st = M[Math.floor(k / N)][k % N]; b.className = 'nbc s' + st; b.textContent = CELL_MARK[st]; });
  },
  cellEl(s: number, i: number) { return this.cellEls[s * this.notes[this.tab].length + i]; },
  /* ✓ crosses out the rest of its row and column (state 3) when auto-cross is on */
  recompute(M: number[][]) {
    const N = M.length;
    for (let s = 0; s < N; s++) for (let i = 0; i < N; i++) if (M[s][i] === 3) M[s][i] = 0;
    if (!this.autoOn()) return;
    for (let s = 0; s < N; s++) for (let i = 0; i < N; i++) if (M[s][i] === 2) {
      for (let j = 0; j < N; j++) if (j !== i && M[s][j] === 0) M[s][j] = 3;
      for (let t = 0; t < N; t++) if (t !== s && M[t][i] === 0) M[t][i] = 3;
    }
  },
  tapCell(s: number, i: number) {
    if (this.done) return;
    const M = this.notes[this.tab];
    const next = [1, 2, 0, 1][M[s][i]];                               // blank -> X -> check -> blank; an auto-cross becomes a manual cross when tapped
    M[s][i] = next;
    this.recompute(M);
    AudioFX.tick(next === 2 ? 7 : next === 1 ? 3 : 1);
    this.paintCells();
    replayClass(this.cellEl(s, i), 'pressed');
  },

  highlight(t: string) { return t.replace(/\b([A-Z]{3,})\b/g, '<b>$1</b>'); },
  renderClues() {
    const c = this.lvl.case, earned = this.run.earned, struck = this.notes.struck;
    const isStruck = (k: number) => { const cl = c.clues[k]; return !!struck[k] && !(cl.earned && !earned[cl.earned]); };
    const order = c.clues.map((_, k) => k);
    const open = order.filter(k => !isStruck(k));
    const crossed = order.filter(isStruck).sort((a, b) => (Number(struck[a]) || 1) - (Number(struck[b]) || 1) || a - b);
    this.els.clues.innerHTML = open.concat(crossed).map(k => {
      const cl = c.clues[k];
      const locked = cl.earned && !earned[cl.earned];
      const body = locked ? '🔒 ' + LOCKED_MSG[cl.earned as string] + ' to reveal this clue.' : this.highlight(cl.t);
      return '<div class="clue-item' + (locked ? ' locked' : '') + (struck[k] && !locked ? ' done' : '') + (cl.earned && !locked ? ' earned' : '') + '" data-k="' + k + '">' + body + '</div>';
    }).join('');
  },
  tapClue(k: number) {
    const cl = this.lvl.case.clues[k];
    if (cl.earned && !this.run.earned[cl.earned]) { UI.toast(LOCKED_MSG[cl.earned as string] + ' to reveal it'); AudioFX.bump(); return; }
    const st = this.notes.struck;                    // value = strike order, so the newest strike sits at the very bottom
    st[k] = st[k] ? 0 : Object.values(st).reduce((m, v) => Math.max(m, Number(v) || 0), 0) + 1;
    AudioFX.tick(st[k] ? 5 : 2);
    const before: Record<string, number> = {};
    this.els.clues.querySelectorAll<HTMLElement>('.clue-item').forEach(el => { before[el.dataset.k!] = el.getBoundingClientRect().top; });
    this.renderClues();
    if (REDUCED) return;
    const moved: HTMLElement[] = [];                                // FLIP: slide each clue from its old spot to the new one
    this.els.clues.querySelectorAll<HTMLElement>('.clue-item').forEach(el => {
      const d = before[el.dataset.k!] - el.getBoundingClientRect().top;
      if (d) { el.style.transition = 'none'; el.style.transform = 'translateY(' + d + 'px)'; moved.push(el); }
    });
    if (moved.length) requestAnimationFrame(() => requestAnimationFrame(() => moved.forEach(el => { el.style.transition = ''; el.style.transform = ''; })));
  },

  /* the chips are built once per case (rebuild); a selection change only toggles .sel */
  renderAccuse(rebuild?: boolean) {
    const c = this.lvl.case, e = this.els;
    if (rebuild) {
      e.sus.innerHTML = c.suspects.map((n, s) => '<button class="chip sus" data-s="' + s + '">' + critterSvg(n) + '<b>' + n + '</b></button>').join('');
      e.items.innerHTML = c.items.map((x, i) => '<button class="chip it" data-i="' + i + '"><span>' + x.emoji + '</span><b>' + x.name + '</b></button>').join('');
    }
    Array.from(e.sus.children).forEach((b, s) => b.classList.toggle('sel', s === this.selS));
    Array.from(e.items.children).forEach((b, i) => b.classList.toggle('sel', i === this.selI));
    e.btn.disabled = this.done || this.selS < 0 || this.selI < 0;
  },

  accuse() {
    if (this.done || this.selS < 0 || this.selI < 0) return;
    const c = this.lvl.case;
    if (this.selS === c.culprit && this.selI === c.culpritItem) {
      this.done = true;
      AudioFX.chime(7); AudioFX.chime(9, 0.12);
      this.say(REACT.caseRight);
      this.els.btn.disabled = true;
      const penalty = this.wrong >= 2 || this.hints >= 2 ? 1 : 0;       // two wrong accusations (or two hints) cost the case a star
      setTimeout(() => { if (this.onSolved) this.onSolved(penalty); }, 1300);
    } else {
      this.wrong++;
      AudioFX.thud(); Haptics.tangle();
      [this.els.sus, this.els.items].forEach(box => box.querySelectorAll('.sel').forEach(el => replayClass(el, 'shake')));
      this.say(this.wrong === 2 ? REACT.caseWarn : REACT.caseWrongA);
      this.selS = -1; this.selI = -1;
      setTimeout(() => this.renderAccuse(), 450);
    }
  },

  /* hint ladder, indirect on purpose. Repeating it without changing the notebook goes one step further each time:
       1 (free)  light up the clue (or the two clues) that lets you make progress, or say which page/row holds a wrong mark
       2         name the row to think about and open its page
       3         fill in one cell (a ✕ when possible), or wipe the wrong mark
     Steps 2-3 together cost one hint (two hints cost the case a star). Changing any mark starts a fresh ladder. */
  hint() {
    if (this.done) return;
    const c = this.lvl.case, { earned } = this.run, { struck } = this.notes;
    // everything the plan depends on: the player's marks, which clues are unlocked, which are crossed out
    const sig = NOTE_KINDS.map(k => this.notes[k].map(r => r.map(st => (st === 1 || st === 2 ? st : 0)).join('')).join('.')).join('|')
      + '#' + !!earned.word + !!earned.zip + '#' + c.clues.map((_, k) => struck[k] ? 1 : 0).join('');
    let plan = this.hintPlan;
    if (plan && plan.sig === sig) plan.stage = Math.min(3, plan.stage + 1);
    else plan = this.hintPlan = Object.assign(planCaseHint(c, this.notes, earned), { sig, stage: 1, charged: false });

    if (plan.type === 'done') { this.say(REACT.caseNoHint); return; }
    if (plan.type === 'none') { this.say(CASE_HINT.locked); return; }
    if (plan.stage >= 2 && !plan.charged) { plan.charged = true; this.hints++; }

    const names = (kind: NoteKind, i: number) => kind === 'items' ? c.items[i].name : c.places[i].name;     // column label
    const rowName = (kind: NoteKind, s: number) => kind === 'itemPlaces' ? c.items[s].name : c.suspects[s];
    const showTab = (kind: NoteKind) => { this.tab = kind; this.renderTabs(); this.renderGrid(); };
    const setCell = (kind: NoteKind, s: number, v: number, mark: number, line: Reaction) => {                 // step 3: change one cell, show it, and say so
      this.notes[kind][s][v] = mark; this.recompute(this.notes[kind]);
      showTab(kind); flashClass(this.cellEl(s, v), 'hinted', 2200); AudioFX.chime(4);
      this.say(line);
    };

    if (plan.type === 'fix') {
      const { kind, s, v } = plan;
      if (plan.stage === 1) { showTab(kind); this.say(CASE_HINT.fixRow(kind, rowName(kind, s))); }
      else if (plan.stage === 2) { showTab(kind); this.say(CASE_HINT.fixCol(names(kind, v))); }
      else setCell(kind, s, v, 0, CASE_HINT.fixed);
      return;
    }

    const [kind, s, v, isCheck] = plan.target;
    if (plan.stage === 1) {
      this.glowClues(plan.ks);
      this.say(plan.ks.length === 2 ? CASE_HINT.pair : plan.ks.length === 1 ? CASE_HINT.clue : plan.elim ? (plan.link ? CASE_HINT.link(kind) : CASE_HINT.elim(kind)) : CASE_HINT.combo);
    } else if (plan.stage === 2) {
      this.glowClues(plan.ks);
      showTab(kind);
      this.say(CASE_HINT.focus(kind, rowName(kind, s)));
    } else setCell(kind, s, v, isCheck ? 2 : 1, REACT.caseHint);
  },
  /* pulse the given clue rows in the list and scroll the first into view */
  glowClues(ks: number[]) {
    clearTimeout(this.hintTimer);
    this.els.clues.querySelectorAll('.clue-item.hinted').forEach(el => el.classList.remove('hinted'));
    const els = ks.map(k => this.els.clues.querySelector('.clue-item[data-k="' + k + '"]')).filter((el): el is Element => !!el);
    els.forEach(el => el.classList.add('hinted'));
    if (els[0]) els[0].scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
    this.hintTimer = setTimeout(() => els.forEach(el => el.classList.remove('hinted')), 4500);
  },
  stop() { this.typer.cancel(); VoiceManager.stop(); clearTimeout(this.hintTimer); }
};
