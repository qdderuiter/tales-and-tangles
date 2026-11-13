import { Haptics } from '../../audio/haptics.ts';
import { AudioFX } from '../../audio/sfx.ts';
import type { Bear } from '../../characters/barnaby.ts';
import { $, flashClass, replayClass } from '../../core/dom.ts';
import type { PuzzleResult } from '../../core/types.ts';
import { late } from '../../core/util.ts';
import type { Level, ParsedSketch } from '../../data/types.ts';
import { REACT } from '../../data/story.ts';
import { Typer } from '../../dialogue/typer.ts';
import { definePuzzle } from '../puzzle-base.ts';
import type { Pt } from '../puzzle-base.ts';
import { registerPuzzle } from '../registry.ts';
import type { LoadOpts } from '../registry.ts';
import { Scoring } from '../scoring.ts';
import { correctKnowledge, isSolved, lineDone, nextDeduction } from './sketch-rules.ts';
import type { Deduction, Mark } from './sketch-rules.ts';

interface SketchEls {
  grid: HTMLElement; frame: HTMLElement; cols: HTMLElement; rows: HTMLElement; theme: HTMLElement; prog: HTMLElement; time: HTMLElement;
  title: HTMLElement; badge: HTMLElement; mode: HTMLElement;
}

/* Sketch Artist: a nonogram. Tap or drag to fill; cross mode (or the right mouse button) rules squares out.
   Outside Noir, a square that does not belong is corrected on the spot (a wrong); in Noir nothing is checked until the picture matches. */
export const SketchPuzzle = definePuzzle({
  cols: 8, rows: 8, hitR2: 0.5,
  lvl: late<Level>(), sk: late<ParsedSketch>(), n: 8, marks: [] as Mark[][], total: 0,
  tracing: false, pointerId: null as number | null, lastPt: late<Pt>(),
  hints: 0, freeHints: 0, hintStage: 0, wrongs: 0, elapsed: 0, running: false, lastTick: 0, timerId: 0, shownSec: -1, rect: late<DOMRect>(), rectEpoch: -1,
  tiles: [] as HTMLElement[], shown: [] as Mark[], rowEls: [] as HTMLElement[], colEls: [] as HTMLElement[], hintTimers: [] as number[],
  onWin: null as ((r: PuzzleResult) => void) | null, bear: late<Bear>(), bubble: late<Typer>(), els: {} as SketchEls, lastSay: 0, lastBump: 0,
  mode: 'fill' as 'fill' | 'cross', paint: 0 as Mark, from: 0 as Mark, origin: { r: 0, c: 0 }, axis: null as 'row' | 'col' | null, rightButton: false, pending: null as Deduction | null,

  init(bear: Bear) {
    this.bear = bear;
    const e = this.els;
    e.grid = $('#kGrid'); e.frame = $('#kFrame'); e.cols = $('#kCols'); e.rows = $('#kRows'); e.theme = $('#kTheme'); e.prog = $('#kProg'); e.time = $('#kTime');
    e.title = $('#kTitle'); e.badge = $('#kHintBadge'); e.mode = $('#btnKMode');
    this.bubble = new Typer($('#kBubble'), bear);
    e.grid.addEventListener('pointerdown', ev => this.onDown(ev));
    e.grid.addEventListener('pointermove', ev => this.onMove(ev));
    e.grid.addEventListener('pointerup', ev => this.onUp(ev));
    e.grid.addEventListener('pointercancel', ev => this.onUp(ev));
    e.grid.addEventListener('contextmenu', ev => ev.preventDefault());       // the right mouse button paints crosses
    $('#btnKHint').addEventListener('click', () => this.hint());
    $('#btnKReset').addEventListener('click', () => this.clearGrid());
    e.mode.addEventListener('click', () => this.setMode(this.mode === 'fill' ? 'cross' : 'fill'));
  },

  setMode(m: 'fill' | 'cross') {
    this.mode = m;
    this.els.mode.textContent = m === 'fill' ? '■ Fill' : '✕ Cross';
    this.els.mode.setAttribute('aria-label', 'Mode: ' + (m === 'fill' ? 'fill squares' : 'cross out squares') + '. Tap to switch.');
    this.els.mode.classList.toggle('cross', m === 'cross');
    AudioFX.tick(m === 'fill' ? 2 : 5);
  },

  load(lvl: Level, opts?: LoadOpts) {
    this.stop();
    const sk = lvl.sketch;
    if (!sk) return;
    this.lvl = lvl; this.sk = sk; this.n = this.cols = this.rows = sk.size;
    this.total = sk.solution.reduce((s, row) => s + row.reduce((a, v) => a + v, 0), 0);
    this.marks = sk.solution.map(row => row.map((): Mark => 0));
    this.freeHints = (opts && opts.freeHints) || 0;
    this.onWin = (opts && opts.onWin) || null;
    this.tracing = false; this.pointerId = null; this.pending = null;
    this.hints = 0; this.hintStage = 0; this.wrongs = 0; this.elapsed = 0; this.shownSec = -1;
    this.hintTimers.forEach(clearTimeout); this.hintTimers = [];
    const n = this.n, e = this.els, maxLen = (cl: number[][]) => cl.reduce((m, c) => Math.max(m, c.length), 1);
    e.frame.style.setProperty('--n', String(n));
    e.frame.style.setProperty('--g', String(Math.max(1.5, maxLen(sk.rowClues) * 0.62 + 0.35)));      // clue gutters, in cell widths
    e.frame.style.setProperty('--h', String(Math.max(1.5, maxLen(sk.colClues) * 0.72 + 0.3)));
    e.frame.style.setProperty('--kcolor', sk.color);
    e.frame.classList.remove('won');
    e.grid.style.gridTemplateColumns = 'repeat(' + n + ',1fr)'; e.grid.style.gridTemplateRows = 'repeat(' + n + ',1fr)';
    e.grid.innerHTML = ''; this.tiles = [];
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n, t = document.createElement('div');
      t.className = 'kt' + (c % 5 === 4 && c < n - 1 ? ' gr' : '') + (r % 5 === 4 && r < n - 1 ? ' gb' : '');
      t.innerHTML = '<div class="kf"></div>';
      e.grid.appendChild(t); this.tiles.push(t);
    }
    const clueHTML = (cl: number[]) => (cl.length ? cl : [0]).map(v => '<i>' + v + '</i>').join('');
    e.cols.innerHTML = sk.colClues.map((cl, c) => '<div class="kc" data-c="' + c + '" aria-label="Column ' + (c + 1) + ': ' + (cl.join(', ') || '0') + '">' + clueHTML(cl) + '</div>').join('');
    e.rows.innerHTML = sk.rowClues.map((cl, r) => '<div class="kr" data-r="' + r + '" aria-label="Row ' + (r + 1) + ': ' + (cl.join(', ') || '0') + '">' + clueHTML(cl) + '</div>').join('');
    this.colEls = Array.from(e.cols.children) as HTMLElement[]; this.rowEls = Array.from(e.rows.children) as HTMLElement[];
    this.shown = this.marks.flat().map((): Mark => 0);
    e.theme.innerHTML = '<b>Witness:</b> ' + sk.witness;
    e.title.textContent = (lvl.evil ? 'Noir Sketch' : 'Sketch Artist') + ' · ' + lvl.title;
    this.setMode('fill');
    this.refresh(); this.updateBadge();
    this.say(lvl.evil ? REACT.sketchStartNoir : lvl.n === 26 ? REACT.sketchTeach : REACT.sketchStart);
  },

  /* ---- input: a tap toggles one square; a drag then paints along the row or column it started in ---- */
  onDown(e: PointerEvent) {
    if (!this.running || this.tracing) return;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    this.measure();
    const p = this.toCell(e), h = this.cellAt(p, true);
    if (!h) return;
    this.rightButton = e.button === 2;
    const want: Mark = this.rightButton || this.mode === 'cross' ? 2 : 1, cur = this.marks[h.r][h.c];
    this.from = cur; this.paint = cur === want ? 0 : want;         // tapping a filled square again clears it
    this.origin = h; this.axis = null;
    this.capture(e, p);
    this.set(h.r, h.c, true);
    this.refresh();
  },
  onUp(e: PointerEvent) {
    if (!this.tracing || e.pointerId !== this.pointerId) return;
    this.tracing = false; this.pointerId = null;
  },
  visit(p: Pt): boolean {
    const h = this.cellAt(p, false);
    if (!h || !this.running) return false;
    let { r, c } = h;
    const s = this.origin;
    if (r === s.r && c === s.c) return false;
    if (!this.axis) this.axis = Math.abs(c - s.c) >= Math.abs(r - s.r) ? 'row' : 'col';
    if (this.axis === 'row') r = s.r; else c = s.c;
    return this.set(r, c, false);
  },

  /* paint one square. The first square of a gesture always takes the paint; later ones only change blanks (or, when erasing, squares of the kind that was erased). */
  set(r: number, c: number, first: boolean): boolean {
    const cur = this.marks[r][c], v = this.paint;
    if (cur === v) return false;
    if (!first && (v === 0 ? cur !== this.from : cur !== 0)) return false;
    if (v !== 0 && !this.lvl.evil) {                                // outside Noir a wrong square is caught at once
      const filled = this.sk.solution[r][c] === 1;
      if (v === 1 && !filled) { this.marks[r][c] = 2; this.wrong(r, c); return true; }       // not part of the picture: it turns into a cross
      if (v === 2 && filled) { this.wrong(r, c); return false; }                             // this one is part of the picture: refuse the cross
    }
    this.marks[r][c] = v;
    this.hintStage = 0;
    AudioFX.tick(v === 1 ? 3 : v === 2 ? 6 : 0);
    return true;
  },
  wrong(r: number, c: number) {
    this.wrongs++; this.hintStage = 0;
    const t = this.tiles[r * this.n + c];
    replayClass(t, 'bad');
    this.hintTimers.push(setTimeout(() => t.classList.remove('bad'), 900));
    const now = performance.now();
    if (now - this.lastBump > 350) { AudioFX.bump(); this.lastBump = now; Haptics.found(); }
    if (now - this.lastSay > 6000) this.say(REACT.sketchWrong);
  },

  /* incremental redraw: only squares whose mark changed, then the clue numbers and the progress */
  refresh() {
    const n = this.n, flat = this.marks.flat();
    for (let i = 0; i < flat.length; i++) {
      if (flat[i] === this.shown[i]) continue;
      this.shown[i] = flat[i];
      const t = this.tiles[i];
      t.classList.toggle('f', flat[i] === 1); t.classList.toggle('x', flat[i] === 2);
      t.classList.remove('hint');
    }
    if (!this.lvl.evil) {                                            // Noir hides which lines are done
      for (let r = 0; r < n; r++) this.rowEls[r].classList.toggle('done', lineDone(this.sk.rowClues[r], this.marks[r]));
      for (let c = 0; c < n; c++) this.colEls[c].classList.toggle('done', lineDone(this.sk.colClues[c], this.marks.map(row => row[c])));
    }
    this.els.prog.textContent = flat.filter(v => v === 1).length + '/' + this.total;
    if (this.running && isSolved(this.marks, this.sk.solution)) { this.tracing = false; this.finish(); }
  },

  /* ---- finishing: the grid turns into the coloured picture, then the victory card ---- */
  finish() {
    this.running = false;
    clearInterval(this.timerId);
    const result = Scoring.compute({ elapsedMs: this.elapsed, wrongs: this.wrongs, hints: this.hints, wrongs3: 2, wrongs2: 5 });
    this.els.frame.classList.add('won');
    this.els.theme.innerHTML = '<b>' + this.sk.name + '!</b>';
    this.say(REACT.sketchDone);
    AudioFX.chime(7); Haptics.found(); this.bear.react('proud');
    setTimeout(() => { if (this.onWin) this.onWin(result); }, 1700);
  },

  /* ---- hint ladder: name a line (free) -> flash it -> fill one square for you ---- */
  deduce(): Deduction | null {
    return nextDeduction(this.sk.rowClues, this.sk.colClues, correctKnowledge(this.marks, this.sk.solution));
  },
  hint() {
    if (!this.running) return;
    if (this.lvl.evil && (this.hints >= 2 || this.hintStage >= 2)) { this.say(REACT.evilNoHelp); return; }
    const d = this.deduce();
    if (!d) return;
    const clueEl = d.kind === 'row' ? this.rowEls[d.index] : this.colEls[d.index];
    const lineTiles = (): HTMLElement[] => d.cells.map(({ r, c }) => this.tiles[r * this.n + c]);
    if (this.hintStage === 0) {
      this.hintStage = 1;
      flashClass(clueEl, 'hint', 3600, this.hintTimers);
      this.say(REACT.sketchHint1);
      return;
    }
    this.spend();
    if (this.hintStage === 1) {
      this.hintStage = 2;
      flashClass(clueEl, 'hint', 3600, this.hintTimers);
      lineTiles().forEach(t => flashClass(t, 'hint', 3200, this.hintTimers));
      AudioFX.chime(4);
      this.say(REACT.sketchHint2);
      return;
    }
    const { r, c, v } = d.cells[0];                                   // stage 2: fill in one square that the clues settle
    this.marks[r][c] = v === 1 ? 1 : 2;
    this.hintStage = 0;
    AudioFX.chime(6);
    this.say(REACT.sketchHint3);
    this.refresh();
  },

  clearGrid() {
    if (!this.running) return;
    this.marks = this.marks.map(row => row.map((): Mark => 0));
    this.hintStage = 0; this.tracing = false;
    AudioFX.bump();
    this.refresh();
  }
});

registerPuzzle('sketch', { obj: SketchPuzzle, screen: 'sketch', board: '#kGrid', tileSel: '.kt', title: 'Sketch Complete!',
                           evil: base => ({ ...(base as Level), evil: true }) });
