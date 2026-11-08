import { VoiceManager } from '../audio/voice.ts';
import type { Bear } from '../characters/barnaby.ts';
import { layout } from '../core/layout.ts';
import { fmtClock } from '../core/util.ts';
import { speak } from '../dialogue/speakers.ts';
import type { Reaction } from '../dialogue/speakers.ts';
import type { Typer } from '../dialogue/typer.ts';

export interface Pt { x: number; y: number }

/* What PuzzleBase reads from the puzzle it is mixed into: its geometry, timer and input state, plus the two hooks it calls.
   Each puzzle supplies cols/rows/hitR2, its own onDown/visit/refresh, and els.{grid,time,badge}; visit() returns true when the trace changed. */
export interface PuzzleHost {
  cols: number; rows: number; hitR2: number;
  running: boolean; lastTick: number; timerId: number; elapsed: number; shownSec: number;
  tracing: boolean; pointerId: number | null; lastPt: Pt; rect: DOMRect; rectEpoch: number;
  hints: number; freeHints: number; lastSay: number;
  bear: Bear; bubble: Typer;
  els: { grid: HTMLElement; time: HTMLElement; badge: HTMLElement };
  visit(p: Pt): boolean;
  refresh(): void;
}

export interface PuzzleMethods {
  start(): void; tickClock(): void; stop(): void; updateBadge(): void; spend(): void; say(r: Reaction): void;
  measure(): void; toCell(e: PointerEvent): Pt; cellAt(p: Pt, loose?: boolean): { r: number; c: number } | null;
  capture(e: PointerEvent, p: Pt): void; onMove(e: PointerEvent): void;
}

/* Shared by WordPuzzle and ZipPuzzle: timer, hint badge, Barnaby's bubble and drag input. */
export const PuzzleBase: PuzzleMethods & ThisType<PuzzleHost & PuzzleMethods> = {
  start() {
    this.running = true; this.lastTick = performance.now();
    clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      const now = performance.now();
      if (this.running && !document.hidden) this.elapsed += Math.min(now - this.lastTick, 1000);
      this.lastTick = now;
      this.tickClock();
    }, 250);
  },
  tickClock() {                                         // only touch the DOM when the shown second changes
    const s = Math.floor(this.elapsed / 1000);
    if (s !== this.shownSec) { this.shownSec = s; this.els.time.textContent = fmtClock(s); }
  },
  stop() { this.running = false; clearInterval(this.timerId); this.timerId = 0; this.tracing = false; if (this.bubble) this.bubble.cancel(); VoiceManager.stop(); },
  updateBadge() { this.els.badge.textContent = String(this.freeHints); this.els.badge.classList.toggle('hide', this.freeHints <= 0); },
  spend() { if (this.freeHints > 0) { this.freeHints--; this.updateBadge(); } else this.hints++; },
  say(r: Reaction) { this.lastSay = performance.now(); speak(this.bear, this.bubble, r, 17); },

  /* grid coordinates in cell units; the grid's rect is measured once per drag (in onDown) */
  measure() { this.rect = this.els.grid.getBoundingClientRect(); this.rectEpoch = layout.epoch; },
  toCell(e: PointerEvent): Pt { if (this.rectEpoch !== layout.epoch) this.measure(); const rc = this.rect; return { x: (e.clientX - rc.left) / rc.width * this.cols, y: (e.clientY - rc.top) / rc.height * this.rows }; },
  cellAt(p: Pt, loose?: boolean): { r: number; c: number } | null {
    const c = Math.floor(p.x), r = Math.floor(p.y);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    if (!loose) { const dx = p.x - c - 0.5, dy = p.y - r - 0.5; if (dx * dx + dy * dy > this.hitR2) return null; }   // forgiving circle: corners are dead zones
    return { r, c };
  },
  capture(e: PointerEvent, p: Pt) {
    this.pointerId = e.pointerId;
    try { this.els.grid.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    this.tracing = true; this.lastPt = p;
  },
  onMove(e: PointerEvent) {
    if (!this.tracing || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    const p = this.toCell(e), a = this.lastPt;
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - a.x, p.y - a.y) / 0.2));  // no skipped cells on fast swipes
    let changed = false;
    for (let s = 1; s <= steps && this.tracing; s++) changed = this.visit({ x: a.x + (p.x - a.x) * s / steps, y: a.y + (p.y - a.y) * s / steps }) || changed;
    this.lastPt = p;
    if (changed) this.refresh();
  }
};

/* Mix the shared base into a puzzle's own object. Same runtime result as Object.assign({}, PuzzleBase, own), but `this` in the
   puzzle's methods is typed as everything it has (its own fields and methods, plus the base's). */
export function definePuzzle<T extends PuzzleHost>(own: T & ThisType<T & PuzzleMethods>): T & PuzzleMethods {
  return Object.assign({}, PuzzleBase, own);
}
