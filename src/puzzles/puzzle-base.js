import { VoiceManager } from '../audio/voice.js';
import { layout } from '../core/layout.js';
import { fmtClock } from '../core/util.js';
import { speak } from '../dialogue/speakers.js';

/* Shared by WordPuzzle and ZipPuzzle: timer, hint badge, Barnaby's bubble and drag input.
   Each puzzle supplies cols/rows/hitR2, its own onDown/visit/refresh, and els.{grid,time,badge}; visit() returns true when the trace changed. */
export const PuzzleBase = {
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
  updateBadge() { this.els.badge.textContent = this.freeHints; this.els.badge.classList.toggle('hide', this.freeHints <= 0); },
  spend() { if (this.freeHints > 0) { this.freeHints--; this.updateBadge(); } else this.hints++; },
  say(r) { this.lastSay = performance.now(); speak(this.bear, this.bubble, r, 17); },

  /* grid coordinates in cell units; the grid's rect is measured once per drag (in onDown) */
  measure() { this.rect = this.els.grid.getBoundingClientRect(); this.rectEpoch = layout.epoch; },
  toCell(e) { if (this.rectEpoch !== layout.epoch) this.measure(); const rc = this.rect; return { x: (e.clientX - rc.left) / rc.width * this.cols, y: (e.clientY - rc.top) / rc.height * this.rows }; },
  cellAt(p, loose) {
    const c = Math.floor(p.x), r = Math.floor(p.y);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    if (!loose) { const dx = p.x - c - 0.5, dy = p.y - r - 0.5; if (dx * dx + dy * dy > this.hitR2) return null; }   // forgiving circle: corners are dead zones
    return { r, c };
  },
  capture(e, p) {
    this.pointerId = e.pointerId;
    try { this.els.grid.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    this.tracing = true; this.lastPt = p;
  },
  onMove(e) {
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
