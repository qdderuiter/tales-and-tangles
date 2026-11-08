import { setShown } from '../core/dom.ts';
import { REDUCED } from '../core/util.ts';

/* ---------- the shared engine for scripted films (Evil Larry's cinematics, the chapter endings) ----------
   A film is a full-screen overlay driven by timed steps. This class owns the parts every film needs:
     wait(ms)        a pause that skip() cuts short; once skipped, every later wait returns at once
     snd(fn)         run an audio cue, unless the film is being skipped
     anim(el, ...)   a Web Animation, or nothing when skipped / reduced motion (so the end state is simply the CSS state)
     caption(text)   the lower-third line         flashScreen(peak, ms)   a white flash
     open / close    fade the overlay in and out; the Skip button appears after a delay (long the first time, short on a rewatch)
   The overlay's own look (letterbox, art) is CSS; the film script decides what happens when. */
export interface FilmEls { root: HTMLElement; skip: HTMLElement; cap: HTMLElement; flash: HTMLElement }

export class Film {
  els: FilmEls;
  running = false;
  fast = false;
  canSkip = false;
  private pending: (() => void) | null = null;
  private skipTimer = 0;

  constructor(els: FilmEls) {
    this.els = els;
    els.skip.addEventListener('click', () => this.skip());
    els.root.addEventListener('pointerdown', ev => { if (this.canSkip && !(ev.target as Element).closest('button')) this.skip(); });
  }

  skip() {
    if (!this.running) return;
    this.fast = true;
    if (this.pending) { const r = this.pending; this.pending = null; r(); }
  }
  wait(ms: number) {
    return new Promise<void>(res => {
      if (this.fast) { res(); return; }
      const t = setTimeout(() => { this.pending = null; res(); }, ms);
      this.pending = () => { clearTimeout(t); res(); };
    });
  }
  snd(fn: () => void) { if (!this.fast) { try { fn(); } catch { /* audio is optional */ } } }
  anim(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) { return (this.fast || REDUCED) ? null : el.animate(frames, opts); }
  caption(text: string) { const c = this.els.cap; c.textContent = text; c.classList.toggle('on', !!text); }
  /* rise: how far into the flash the peak lands (0.2 = a sharp lightning flash, 0.4 = a gentler glow) */
  flashScreen(peak: number, ms: number, rise = 0.2) { if (!this.fast && !REDUCED) this.els.flash.animate([{ opacity: 0 }, { opacity: peak, offset: rise }, { opacity: 0 }], { duration: ms, easing: 'ease-out' }); }

  /* cancel every running animation inside the overlay (a film starts from a clean slate) */
  clearAnimations() { if (this.els.root.getAnimations) this.els.root.getAnimations({ subtree: true }).forEach(a => a.cancel()); }

  open(first: boolean) {
    this.running = true; this.fast = false; this.canSkip = false;
    this.els.skip.classList.remove('on');
    setShown(this.els.root, true);
    clearTimeout(this.skipTimer);
    this.skipTimer = window.setTimeout(() => { this.canSkip = true; this.els.skip.classList.add('on'); }, first ? 1500 : 300);
  }
  async close() {
    clearTimeout(this.skipTimer);
    setShown(this.els.root, false);
    this.els.skip.classList.remove('on'); this.canSkip = false;
    await new Promise<void>(r => setTimeout(r, 520));
    this.running = false; this.fast = false; this.pending = null;
  }
}
