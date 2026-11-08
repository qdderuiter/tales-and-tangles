import { AudioFX } from '../audio/sfx.ts';
import { $ } from '../core/dom.ts';
import { SPRING_NAV, project, releaseVelocity } from '../core/spring.ts';
import { REDUCED, clamp, late } from '../core/util.ts';
import { caseLabel, chapterSolved } from '../data/chapters.ts';
import { LEVELS } from '../data/levels.ts';
import type { Chapter, Level } from '../data/types.ts';
import { Evil } from '../puzzles/evil.ts';
import { Stage } from '../scenes/film-art.ts';
import { session } from '../state/session.ts';
import { Store } from '../state/store.ts';
import { animateSpring } from './motion.ts';
import type { SpringHandle } from './motion.ts';
import { UI } from './ui.ts';

/* ---------- the chapter view: one chapter's cases, as a sheet that grows out of its card ----------
   `p` is how open the sheet is, 0 (it is the card) to 1 (full screen). Everything on screen is a function of p (apply), so the same
   code draws the opening, the closing and a finger dragging it:
     - it opens from the tapped card's own rectangle and closes back into the same card (same path both ways);
     - a spring moves p, so it can be grabbed or reversed at any instant, and a swipe down on the hero hands its release speed to the spring;
     - while it is open the map behind steps back (smaller, dimmer) and is inert, so keys and taps cannot reach it.
   Reduced motion: no growing, just a cross-fade. */
/* what a tap inside the chapter view can ask the game to do (the map's handlers add the Daily Case) */
export interface ChapterHandlers { level(n: number): void; step(n: number, kind: string): void; intro(lv: Level): void; ending(chapterId: string): void }

const CORNER = 26;       // the card's corner radius, which the sheet starts with

interface Geom { top: number; left: number; right: number; height: number; H: number }
interface Drag { id: number; y0: number; p0: number; samples: { x: number; t: number }[]; moved: boolean }

export const ChapterView = {
  handlers: late<ChapterHandlers>(), view: late<HTMLElement>(), sheet: late<HTMLElement>(), scrim: late<HTMLElement>(), list: late<HTMLElement>(), head: late<HTMLElement>(),
  ch: null as Chapter | null, origin: null as HTMLElement | null,
  p: 0, goal: 0, spring: null as SpringHandle | null, drag: null as Drag | null,
  geom: { top: 0, left: 0, right: 0, height: 0, H: 0 } as Geom,

  init(handlers: ChapterHandlers) {
    this.handlers = handlers;
    this.view = $('#chView'); this.sheet = $('#chvSheet'); this.scrim = $('#chvScrim'); this.list = $('#mapList'); this.head = $('#mapHead');
    this.scrim.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.isOpen()) { e.preventDefault(); this.close(); } });
    window.addEventListener('resize', () => { if (this.isOpen()) { this.measure(); this.apply(this.p); } });
    this.sheet.addEventListener('click', e => this.onClick(e));
    this.sheet.addEventListener('pointerdown', e => this.onDown(e));
    this.sheet.addEventListener('pointermove', e => this.onMove(e));
    this.sheet.addEventListener('pointerup', e => this.onUp(e));
    this.sheet.addEventListener('pointercancel', e => this.onUp(e));
  },

  isOpen() { return this.view.classList.contains('open') && this.goal === 1; },

  /* ----- the sheet is a function of p ----- */
  measure() {
    const screen = this.view.parentElement as HTMLElement, sr = screen.getBoundingClientRect(), o = this.origin?.getBoundingClientRect();
    this.geom = o
      ? { top: o.top - sr.top, left: o.left - sr.left, right: sr.right - o.right, height: o.height, H: sr.height }
      : { top: sr.height * 0.4, left: 20, right: 20, height: sr.height * 0.2, H: sr.height };
  },
  apply(p: number) {
    const q = clamp(p, 0, 1), g = this.geom, s = this.sheet.style;
    if (REDUCED) { s.opacity = String(q); s.transform = 'none'; s.clipPath = 'none'; }
    else {
      // the hero starts exactly over the card's art (translateY), and the visible window grows from the card's rectangle to the whole screen (clip-path)
      const bottom = Math.max(0, g.H - (g.height * (1 - q) + g.H * q));
      s.transform = q >= 1 ? 'none' : 'translate3d(0,' + g.top * (1 - q) + 'px,0)';
      s.clipPath = q >= 1 ? 'none' : 'inset(0px ' + g.right * (1 - q) + 'px ' + bottom + 'px ' + g.left * (1 - q) + 'px round ' + CORNER * (1 - q) + 'px)';
      s.opacity = String(clamp(q / 0.3, 0, 1));
    }
    this.scrim.style.opacity = String(q * 0.3);
    this.list.style.transform = REDUCED || q === 0 ? '' : 'scale(' + (1 - 0.035 * q) + ')';
    this.list.style.opacity = q === 0 ? '' : String(1 - 0.4 * q);
  },

  /* ----- moving p: always from where it is now, never locking input out ----- */
  go(target: number, velocity?: number) {
    this.goal = target;
    if (REDUCED) { this.spring?.grab(); this.spring = null; this.p = target; this.apply(target); this.settle(); return; }
    if (this.spring) { this.spring.target(target, velocity); return; }          // a live spring is re-aimed at the speed it has
    const h = this.spring = animateSpring(this.p, target, SPRING_NAV, x => { this.p = x; this.apply(x); }, velocity ?? 0);
    h.finished.then(() => { if (this.spring === h) { this.spring = null; this.settle(); } });
  },
  settle() { if (this.goal === 0) this.hideNow(); },

  open(ch: Chapter, origin: HTMLElement | null, instant = false) {
    this.drag = null;
    this.spring?.grab(); this.spring = null;
    this.ch = ch; this.origin = origin;
    this.render();
    this.view.classList.add('open'); this.view.setAttribute('aria-hidden', 'false');
    this.list.inert = true; this.head.inert = true;
    this.measure();
    session.openChapter = ch.id;
    if (instant) { this.goal = 1; this.p = 1; this.apply(1); } else { this.p = 0; this.apply(0); this.go(1); }
    ($('.chv-back', this.sheet) as HTMLElement).focus({ preventScroll: true });
  },
  close() {
    if (!this.ch || this.goal === 0) return;
    this.go(0);
  },
  hideNow() {
    const origin = this.origin;
    this.view.classList.remove('open'); this.view.setAttribute('aria-hidden', 'true');
    this.list.inert = false; this.head.inert = false;
    this.list.style.transform = ''; this.list.style.opacity = '';
    this.sheet.textContent = '';
    this.ch = null; this.origin = null; this.p = 0; this.goal = 0;
    session.openChapter = '';
    origin?.focus({ preventScroll: true });
  },
  /* back to the plain map with no animation (the map is opening fresh) */
  reset() { if (this.view.classList.contains('open') || this.ch) { this.spring?.grab(); this.spring = null; this.origin = null; this.hideNow(); } },

  /* ----- a finger on the hero: swipe down to put the sheet back ----- */
  onDown(e: PointerEvent) {
    const t = e.target as Element;
    if (!t.closest('.chv-hero') || t.closest('button') || !this.ch) return;
    if (this.spring) { const at = this.spring.grab(); this.p = at.x; this.spring = null; }        // grab it mid-flight: start from where it is on screen
    this.drag = { id: e.pointerId, y0: e.clientY, p0: this.p, samples: [{ x: e.clientY, t: e.timeStamp }], moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  },
  onMove(e: PointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dy) < 6) return;                                                    // a small hysteresis before it counts as a drag
    d.moved = true;
    d.samples.push({ x: e.clientY, t: e.timeStamp }); if (d.samples.length > 8) d.samples.shift();
    this.p = clamp(d.p0 - dy / (this.geom.H * 0.55), 0, 1);                                      // 1:1 with the finger, from where it was grabbed
    this.apply(this.p);
  },
  onUp(e: PointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (!d.moved) { this.go(this.goal); return; }                                                // only a touch: carry on to wherever it was heading
    const dist = this.geom.H * 0.55, v = releaseVelocity(d.samples);                             // px/s, positive = downward
    const end = this.p + project(-v) / dist;                                                     // where the flick would carry it
    this.go(end < 0.5 ? 0 : 1, -v / dist);                                                       // choose by the projected end, hand the speed over
  },

  /* ----- the content ----- */
  render() {
    const ch = this.ch!, S = Store, levels = ch.levels.map(n => LEVELS[n - 1]);
    const stars = levels.reduce((s, lv) => s + S.stars(lv.n), 0);
    (['a', 'b', 'ink', 'glow'] as const).forEach(k => this.sheet.style.setProperty('--ch-' + k, ch.palette[k]));
    const nodes = levels.map((lv, i) => {
      const rec = S.level(lv.n), locked = lv.n > S.data.unlocked, done = rec.solved, fresh = session.justUnlocked === lv.n;
      const noir = S.data.evil.cleared[Evil.key('word', lv)] || S.data.evil.cleared[Evil.key('zip', lv)];
      const pips = locked ? '' : '<div class="cnode-pips">' +
        ([['word', 'Words', rec.word.done], ['zip', 'Trail', rec.zip.done], ['case', 'Case', rec.solved]] as [string, string, boolean][]).map(([kind, label, ok]) =>
          '<button class="pip' + (ok ? ' done' : '') + '" data-step="' + lv.n + ':' + kind + '"' + (rec.solved ? '' : ' disabled') + '>' + (ok ? '✓ ' : '') + label + '</button>').join('') +
        (lv.introScene && S.data.seen.larry ? '<button class="pip" data-intro="' + lv.n + '">🎬 Larry</button>' : '') + '</div>';       // rewatch the cinematic once it has been seen
      return '<li class="cnode' + (done ? ' done' : '') + (locked ? ' locked' : '') + (!locked && !done ? ' current' : '') + (fresh ? ' fresh' : '') + '" style="--i:' + i + '">' +
        '<button class="cnode-main" data-level="' + lv.n + '"' + (locked ? ' disabled' : '') + '>' +
        '<span class="cnode-dot" aria-hidden="true">' + (locked ? '🔒' : done ? '✓' : i + 1) + '</span>' +
        '<span class="cnode-info"><small>' + caseLabel(lv.n) + '</small><b>' + lv.title + (noir ? ' 😈' : '') + (fresh ? '<span class="newtag">NEW</span>' : '') + '</b>' +
        '<em>' + (locked ? 'Solve the previous case to unlock' : lv.blurb + (done ? ' &middot; best ' + S.score(lv.n) : '')) + '</em></span>' +
        '<span class="ch-stars">' + (locked ? '' : UI.starsHTML(S.stars(lv.n))) + '</span></button>' + pips + '</li>';
    }).join('');
    const open = chapterSolved(ch, n => S.level(n).solved), seen = !!S.data.seen.endings[ch.id];
    const ending = '<li class="cnode ending' + (open ? '' : ' locked') + (open && !seen ? ' fresh' : '') + '" style="--i:' + levels.length + '">' +
      '<button class="cnode-main" data-ending="1"' + (open ? '' : ' disabled') + '><span class="cnode-dot" aria-hidden="true">' + (open ? '🎬' : '🔒') + '</span>' +
      '<span class="cnode-info"><small>Chapter ending</small><b>' + (open ? (seen ? 'Watch it again' : 'Watch the ending') : 'Solve every case to unlock') + '</b></span></button></li>';
    this.sheet.innerHTML =
      '<div class="chv-hero"><div class="chv-art" id="chvArt"></div><div class="chv-fade"></div>' +
      '<button class="chv-back" data-act="back" aria-label="Back to case files"><span aria-hidden="true">&#8249;</span> Case Files</button>' +
      '<div class="chv-titles"><small>Chapter ' + ch.n + '</small><h2 id="chvTitle">' + ch.title + '</h2><p>' + levels.length + ' cases &middot; &#9733; ' + stars + '/' + levels.length * 3 + '</p></div></div>' +
      '<ol class="chv-path">' + nodes + ending + '</ol>';
    $('#chvArt').appendChild(new Stage(ch.motif, { band: true }).root);
  },

  onClick(e: MouseEvent) {
    const b = (e.target as Element).closest('button');
    if (!b || b.disabled || !this.ch) return;
    AudioFX.unlock();
    const h = this.handlers, d = b.dataset;
    if (d.act === 'back') this.close();
    else if (d.level) h.level(+d.level);
    else if (d.step) { const [n, kind] = d.step.split(':'); h.step(+n, kind); }
    else if (d.intro) h.intro(LEVELS[+d.intro - 1]);
    else if (d.ending) h.ending(this.ch.id);
  }
};
