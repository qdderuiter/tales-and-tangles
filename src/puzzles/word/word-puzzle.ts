import { Haptics } from '../../audio/haptics.ts';
import { AudioFX } from '../../audio/sfx.ts';
import { $, flashClass, replayClass } from '../../core/dom.ts';
import { emit } from '../../core/events.ts';
import { COLS, ROWS } from '../../core/grid.ts';
import type { PuzzleResult } from '../../core/types.ts';
import { late, pick } from '../../core/util.ts';
import type { TempLevel } from '../../data/types.ts';
import { GOLD_FILL, GOLD_LINE, WORD_FILL, WORD_LINE } from '../../data/palette.ts';
import { REACT } from '../../data/story.ts';
import { BONUS_DICT } from '../../data/words.ts';
import type { Bear } from '../../characters/barnaby.ts';
import { Typer } from '../../dialogue/typer.ts';
import { Sparks } from '../../fx/sparks.ts';
import type { SparkEmitter } from '../../fx/sparks.ts';
import { Evil } from '../evil.ts';
import { definePuzzle } from '../puzzle-base.ts';
import type { Pt } from '../puzzle-base.ts';
import { registerPuzzle } from '../registry.ts';
import type { LoadOpts } from '../registry.ts';
import { Scoring } from '../scoring.ts';
import { attemptInfo, buildGrid, isSolved, matchWord, spell } from './word-rules.ts';
import type { GridCell } from './word-rules.ts';
import { Store } from '../../state/store.ts';

interface WordEls {
  grid: HTMLElement; trace: SVGElement; bad: SVGElement; zips: SVGElement; tray: HTMLElement; sparks: SparkEmitter; combo: HTMLElement; theme: HTMLElement;
  preview: HTMLElement; found: HTMLElement; time: HTMLElement; title: HTMLElement; badge: HTMLElement;
}
type Step = { r: number; c: number };

/* fields marked late() are filled by init() / load() before anything reads them */
export const WordPuzzle = definePuzzle({
  cols: COLS, rows: ROWS, hitR2: 0.2304,
  lvl: late<TempLevel>(), grid: [] as GridCell[][], found: new Set<number>(), locked: {} as Record<number, number>, trace: [] as Step[], tracing: false, pointerId: null as number | null, lastPt: late<Pt>(),
  wrongs: 0, hints: 0, freeHints: 0, hinted: new Set<number>(), elapsed: 0, running: false, lastTick: 0, timerId: 0, shownSec: -1, rect: late<DOMRect>(), rectEpoch: -1, lastSay: 0,
  tiles: [] as HTMLElement[], selEls: [] as HTMLElement[], hintTimers: [] as number[], order: [] as number[], onWin: null as ((r: PuzzleResult) => void) | null, bear: late<Bear>(), bubble: late<Typer>(),
  combo: 0, maxCombo: 0, bonus: 0, squares: [] as string[], sinceWrong: false, sinceHint: false, bonusFound: new Set<string>(),
  els: {} as WordEls,

  init(bear: Bear) {
    this.bear = bear;
    const e = this.els;
    e.grid = $('#grid'); e.trace = $('#traceLine'); e.bad = $('#badLine'); e.zips = $('#zips'); e.tray = $('#tray');
    e.sparks = Sparks.create($('#sparks')); e.combo = $('#combo'); e.theme = $('#pzTheme');
    e.preview = $('#preview'); e.found = $('#pzFound'); e.time = $('#pzTime'); e.title = $('#pzTitle'); e.badge = $('#hintBadge');
    this.bubble = new Typer($('#pzBubble'), bear);
    e.grid.addEventListener('pointerdown', ev => this.onDown(ev));
    e.grid.addEventListener('pointermove', ev => this.onMove(ev));
    e.grid.addEventListener('pointerup', ev => this.onUp(ev));
    e.grid.addEventListener('pointercancel', ev => this.onUp(ev, true));
    $('#btnHint').addEventListener('click', () => this.hint());
  },

  load(lvl: TempLevel, opts?: LoadOpts) {
    this.stop();
    this.lvl = lvl;
    this.freeHints = (opts && opts.freeHints) || 0;
    this.onWin = (opts && opts.onWin) || null;
    this.found = new Set(); this.locked = {}; this.trace = []; this.tracing = false; this.pointerId = null;
    this.wrongs = 0; this.hints = 0; this.hinted = new Set(); this.elapsed = 0; this.shownSec = -1; this.selEls = [];
    this.combo = 0; this.maxCombo = 0; this.bonus = 0; this.squares = []; this.sinceWrong = false; this.sinceHint = false;
    this.bonusFound = new Set();
    this.els.combo.classList.remove('on');
    this.els.theme.innerHTML = '<b>Theme:</b> ' + lvl.hint;
    this.grid = buildGrid(lvl);

    const g = this.els.grid;
    g.querySelectorAll('.tile').forEach(t => t.remove());
    this.tiles = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = document.createElement('div');
        t.className = 'tile';
        t.innerHTML = '<div class="face"><span></span></div>';
        t.querySelector('span')!.textContent = this.grid[r][c].ch;
        g.insertBefore(t, $('#lines'));
        this.tiles.push(t);
      }
    }
    this.els.zips.innerHTML = '';
    this.setLine(this.els.trace, []); this.setLine(this.els.bad, []);
    this.els.preview.classList.remove('on');
    this.els.title.textContent = lvl.evil ? 'Noir\u2019s remix \u00B7 ' + (lvl.daily ? 'Daily' : 'Chapter ' + lvl.n) : lvl.daily ? 'Daily Case · ' + lvl.date : 'Chapter ' + lvl.n + ': ' + lvl.title;
    this.order = lvl.words.map((_, i) => i).sort((a, b) => lvl.words[a].w.length - lvl.words[b].w.length || a - b);
    this.buildTray();
    this.updateStatus();
    this.updateBadge();
    this.hintTimers.forEach(clearTimeout); this.hintTimers = [];
    this.say(REACT.start);
  },

  tile(r: number, c: number) { return this.tiles[r * COLS + c]; },
  center(p: Step) { return ((p.c + 0.5) * 100).toFixed(1) + ',' + ((p.r + 0.5) * 100).toFixed(1); },
  setLine(el: Element, pts: Step[]) { el.setAttribute('points', pts.map(p => this.center(p)).join(' ')); },
  colorsFor(i: number) { return this.lvl.words[i].gold ? [GOLD_FILL, GOLD_LINE] : [WORD_FILL[i % WORD_FILL.length], WORD_LINE[i % WORD_LINE.length]]; },

  updateStatus() {
    this.els.found.textContent = this.found.size + '/' + (this.lvl ? this.lvl.words.length : 0);
    this.tickClock();
  },

  /* ---- tray ---- */
  buildTray() {
    if (this.lvl.evil) this.order = this.order.slice().sort(() => Math.random() - 0.5);
    const tray = this.els.tray;
    tray.innerHTML = '';
    this.order.forEach(i => {
      const s = document.createElement('div');
      s.className = 'slot' + (this.lvl.words[i].gold ? ' gold' : '');
      s.dataset.w = String(i);
      tray.appendChild(s);
      this.renderSlot(i);
    });
  },
  renderSlot(i: number) {
    const s = this.els.tray.querySelector<HTMLElement>('[data-w="' + i + '"]');
    if (!s) return;
    const w = this.lvl.words[i];
    if (this.found.has(i)) {
      s.textContent = w.w;
      s.classList.add('done');
      s.style.setProperty('--wc', this.colorsFor(i)[0]);
    } else {
      const chars = Array<string>(this.lvl.evil ? 3 : w.w.length).fill('•');
      if (this.hinted.has(i)) chars[0] = w.w[0];
      s.textContent = chars.join(' ');
    }
  },

  /* ---- input (onMove + cellAt come from PuzzleBase) ---- */
  onDown(e: PointerEvent) {
    if (!this.running || this.tracing || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    this.measure();
    const p = this.toCell(e), h = this.cellAt(p, true);
    if (!h || this.locked[h.r * COLS + h.c] !== undefined) return;
    this.capture(e, p);
    this.trace = [h];
    AudioFX.tick(0);
    this.refresh();
  },
  onUp(e: PointerEvent, cancelled?: boolean) {
    if (!this.tracing || e.pointerId !== this.pointerId) return;
    this.tracing = false; this.pointerId = null;
    const t = this.trace; this.trace = [];
    this.refresh();
    if (cancelled || t.length < 2) return;
    this.evaluate(t);
  },
  visit(p: Pt): boolean {
    const h = this.cellAt(p, false);
    if (!h) return false;
    if (this.locked[h.r * COLS + h.c] !== undefined) return false;
    const t = this.trace, last = t[t.length - 1];
    if (h.r === last.r && h.c === last.c) return false;
    if (t.length >= 2) {
      const prev = t[t.length - 2];
      if (prev.r === h.r && prev.c === h.c) { t.pop(); AudioFX.tick(t.length - 1); return true; }   // slide back = undo
    }
    if (t.some(q => q.r === h.r && q.c === h.c)) return false;
    if (Math.max(Math.abs(h.r - last.r), Math.abs(h.c - last.c)) !== 1) return false;           // 8-way adjacency
    t.push(h);
    AudioFX.tick(t.length - 1);
    return true;
  },
  refresh() {
    const next = this.trace.map(p => this.tile(p.r, p.c));
    this.selEls.forEach(el => { if (!next.includes(el)) el.classList.remove('sel'); });
    next.forEach(el => el.classList.add('sel'));
    this.selEls = next;
    this.setLine(this.els.trace, this.trace);
    const word = this.trace.map(p => this.grid[p.r][p.c].ch).join('');
    this.els.preview.textContent = word;
    this.els.preview.classList.toggle('on', this.trace.length > 1);
  },

  /* ---- validation ---- */
  evaluate(t: Step[]) {
    const idx = matchWord(this.lvl, this.found, t);
    if (idx >= 0) this.success(idx, t); else this.fail(t);
  },
  success(idx: number, t: Step[]) {
    const w = this.lvl.words[idx];
    this.found.add(idx);
    const [fill, line] = this.colorsFor(idx);
    const ordered = w.p.map(([r, c]) => ({ r, c }));
    ordered.forEach((p, k) => {
      this.locked[p.r * COLS + p.c] = idx;
      const el = this.tile(p.r, p.c);
      el.classList.remove('hint');
      el.style.setProperty('--i', String(k));
      el.querySelector<HTMLElement>('.face')!.style.setProperty('--wc', fill);
      el.classList.add('found');
    });
    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    pl.setAttribute('class', 'zip'); pl.setAttribute('pathLength', '1');
    pl.setAttribute('points', ordered.map(p => this.center(p)).join(' '));
    pl.style.stroke = line;
    this.els.zips.appendChild(pl);
    this.renderSlot(idx);
    this.updateStatus();
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    if (this.combo >= 2) this.bonus += 25 * (this.combo - 1);                  // combo bonus: score only, never stars
    this.squares.push(this.sinceHint ? 'B' : this.sinceWrong ? 'Y' : 'G');
    this.sinceHint = false; this.sinceWrong = false;
    AudioFX.wordFound(w.w.length, this.combo);
    Haptics.found();
    this.showCombo();
    this.els.sparks.burst(this.sparkPts(ordered), [fill, line, '#fff'], 7 + Math.min(this.combo, 5) * 2);
    this.toast(w.w, w.gold);
    this.say(w.gold ? REACT.gold : pick(REACT.found));
    if (this.found.size === this.lvl.words.length) this.finishIfSolved();
  },
  fail(t: Step[]) {
    const spelled = spell(this.grid, t);
    const { near, isClue } = attemptInfo(this.lvl, this.found, spelled);       // a clue word (even an already-found one) is never a hidden bonus
    if (t.length >= 3 && !isClue && BONUS_DICT.has(spelled)) {          // a real word that isn't a clue: bonus, never a mistake
      if (this.bonusFound.has(spelled)) { this.say(REACT.bonusAgain); this.toast('Already found!', false, 'bonus'); }
      else this.bonusWord(spelled, t);
      return;
    }
    if (t.length >= 3) { this.wrongs++; this.sinceWrong = true; }
    this.combo = 0; this.els.combo.classList.remove('on');
    AudioFX.thud();
    Haptics.tangle();
    t.forEach(p => {
      const el = this.tile(p.r, p.c);
      replayClass(el, 'shake');
      setTimeout(() => el.classList.remove('shake'), 450);
    });
    this.setLine(this.els.bad, t);
    replayClass(this.els.bad, 'flash');
    if (t.length >= 3 || near) this.say(near ? REACT.near : pick(REACT.wrong));
  },
  sparkPts(cells: Step[]) { return cells.map(p => ({ x: (p.c + 0.5) / COLS, y: (p.r + 0.5) / ROWS })); },
  /* a real word that is not one of the grid's clue words: score only (like the combo bonus), never stars */
  bonusWord(word: string, t: Step[]) {
    const pts = 30 * word.length;
    this.bonusFound.add(word);
    this.bonus += pts;
    this.els.sparks.burst(this.sparkPts(t), ['#d9d0f0', '#a3d1ee', '#fff'], 8);
    AudioFX.chime(5);
    Haptics.found();
    this.toast(word, false, 'bonus', '+' + pts + ' hidden word');
    this.say(pick(REACT.bonus));
    Store.noteBonusWord(word);
    emit('progress');
  },
  /* win-state validation: found words must tile the grid exactly once, with matching letters */
  validateSolved() { return isSolved(this.lvl, this.found, this.grid); },
  finishIfSolved() {
    if (!this.validateSolved()) return;
    this.running = false;
    clearInterval(this.timerId);
    const result = Scoring.compute({ elapsedMs: this.elapsed, wrongs: this.wrongs, hints: this.hints, bonus: this.bonus });
    result.squares = this.squares.join(''); result.maxCombo = this.maxCombo; result.bonusWords = this.bonusFound.size;
    setTimeout(() => { if (this.onWin) this.onWin(result); }, 1000);
  },

  /* ---- hint ---- */
  hint() {
    if (!this.running) return;
    if (this.lvl.evil && this.hints >= 1) { this.say(REACT.evilNoHelp); return; }
    const idx = this.order.find(i => !this.found.has(i));
    if (idx === undefined) { this.say(REACT.nohint); return; }
    this.spend();
    this.hinted.add(idx); this.sinceHint = true;
    this.renderSlot(idx);
    this.lvl.words[idx].p.slice(0, 2).forEach(([r, c]) => flashClass(this.tile(r, c), 'hint', 3200, this.hintTimers));
    AudioFX.chime(4);
    this.say(REACT.hint);
  },

  showCombo() {
    const c = this.els.combo;
    if (this.combo < 2) { c.classList.remove('on'); return; }
    c.textContent = 'Combo ×' + this.combo;
    replayClass(c, 'on');
  },

  toast(text: string, gold?: boolean, extra?: string, sub?: string) {
    const d = document.createElement('div');
    d.className = 'word-toast' + (gold ? ' gold' : '') + (extra ? ' ' + extra : '');
    d.textContent = text;
    if (sub) { const s = document.createElement('small'); s.textContent = sub; d.appendChild(s); }
    this.els.grid.appendChild(d);
    setTimeout(() => d.remove(), 1200);
  }
});

registerPuzzle('word', { obj: WordPuzzle, screen: 'puzzle', board: '#grid', tileSel: '.tile', title: 'Clue Found!', evil: base => Evil.word(base) });
