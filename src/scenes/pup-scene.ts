import { PupScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { Pup, rocketMarkup } from '../characters/pup.ts';
import type { PupPortrait } from '../characters/pup.ts';
import { $ } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, clamp, late, mulberry32 } from '../core/util.ts';
import { Store } from '../state/store.ts';
import { Film } from './film.ts';

/* ---------- Pickle, the space pup: his crash landing (Case 5.1) and his lift-off (after Case 5.3) ----------
   Drawn live like Evil Larry's cinematics: a starry sky, a signpost that points the wrong way, a sausage-bun rocket that zooms by, sputters
   and bumps down into the meadow; later the countdown, the lift-off and a heart of stardust. Skippable (the Skip button appears after
   1.5 s the first time), and reduced motion gets the finished picture. The playback mechanics are shared with the other films: see film.ts. */
const TAU = Math.PI * 2;
const HILLS_H = 0.36;      // the height of the hills svg as a fraction of the stage (.pf-hills in pup.css)
const SHIP_BELLY = 0.86;   // where the rocket's underside is, as a fraction of its height
const PUP_FOOT = 0.95;     // where Pickle's paws are, as a fraction of his height
const HEART_SHOWN = 'translate(-50%,-50%)';

type HillId = 'pfGround' | 'pfRidge';

/* the top outline of a hill path in viewBox units: y at x = 0, 1, ... 400, sampled once along the path, ignoring its straight edges
   (the x = 0 / 400 verticals and the base line). The paths never change and the viewBox does not depend on the stage size. */
function outline(path: SVGPathElement): Float32Array {
  const len = path.getTotalLength(), n = 120, pts: DOMPoint[] = [];
  for (let i = 0; i <= n; i++) { const p = path.getPointAtLength((len * i) / n); if (p.y < 199.5) pts.push(p); }
  const ys = new Float32Array(401);
  for (let x = 0; x <= 400; x++) {
    let best = 200, bestDx = Infinity;
    for (const p of pts) { const dx = Math.abs(p.x - x); if (dx < bestDx) { bestDx = dx; best = p.y; } }
    ys[x] = best;
  }
  return ys;
}

export const PupScene = {
  els: {} as Record<string, HTMLElement>, pup: late<PupPortrait>(), film: late<Film>(), outlines: {} as Partial<Record<HillId, Float32Array>>,

  init() {
    const e = this.els;
    ['pupFilm', 'pfStage', 'pfStars', 'pfSign', 'pfShip', 'pfPup', 'pfCount', 'pfHeart', 'pfCap', 'pfTitle', 'pfFlash', 'pfSkip', 'pfShadowSign', 'pfShadowShip', 'pfShadowPup'].forEach(id => { e[id] = $('#' + id); });
    const rng = mulberry32(17);
    e.pfStars.innerHTML = Array.from({ length: 52 }, (_, i) =>
      '<i class="pf-star" style="left:' + (rng() * 100).toFixed(1) + '%;top:' + (rng() * 60).toFixed(1) + '%;animation-delay:-' + (rng() * 3).toFixed(2) + 's;opacity:' + (0.5 + (i % 3) * 0.25) + '"></i>').join('');
    // sparklers either side of the launch pad, shown during the lift-off
    for (const side of [0.34, 0.66]) for (let k = 0; k < 8; k++) {
      const s = document.createElement('i'), a = rng() * TAU, d = 26 + rng() * 34;
      s.className = 'pf-spark';
      s.style.cssText = 'left:' + side * 100 + '%;top:82.5%;--dx:' + Math.round(Math.cos(a) * d) + 'px;--dy:' + Math.round(-Math.abs(Math.sin(a)) * d - 6) + 'px;animation-delay:-' + (rng() * 0.9).toFixed(2) + 's';
      e.pfStage.appendChild(s);
    }
    e.pfShip.innerHTML = rocketMarkup('pf');
    this.pup = Pup.create(e.pfPup);
    this.film = new Film({ root: e.pupFilm, skip: e.pfSkip, cap: e.pfCap, flash: e.pfFlash });
    window.addEventListener('resize', () => {                      // keep the props on the hills after a rotate / resize
      if (!this.film.running) return;
      this.layoutGround();
      if (e.pfShip.classList.contains('landed')) e.pfShip.style.transform = this.pose(this.geo().landed);
    });
  },

  /* the sign, then the ship and Pickle, stand on the ground: their contact shadows fade in with them */
  shadows(sign: boolean, ship: boolean, pup: boolean) {
    const e = this.els;
    e.pfShadowSign.classList.toggle('on', sign); e.pfShadowShip.classList.toggle('on', ship); e.pfShadowPup.classList.toggle('on', pup);
  },

  /* the stage y (px) of a hill's outline at stage x: the hills svg is HILLS_H of the stage tall, sits on its bottom edge and is
     stretched over a 400 x 200 viewBox, so the outline is read off the path itself and scaled (works for any aspect ratio) */
  groundY(id: HillId, x: number): number {
    const W = this.els.pfStage.clientWidth, H = this.els.pfStage.clientHeight;
    const ys = this.outlines[id] ??= outline(document.getElementById(id) as unknown as SVGPathElement);
    const vx = clamp((x / W) * 400, 0, 400), i = Math.floor(vx), y = i >= 400 ? ys[400] : ys[i] + (ys[i + 1] - ys[i]) * (vx - i);
    return H * (1 - HILLS_H) + (y / 200) * H * HILLS_H;
  },

  /* plant the signpost, Pickle and the contact shadows on the hills (their bottoms, not their tops, touch the ground) */
  layoutGround() {
    const e = this.els, W = e.pfStage.clientWidth, H = e.pfStage.clientHeight;
    if (!W || !H) return;
    const shadow = (el: HTMLElement, cx: number, y: number, w: number) => {
      el.style.left = Math.round(cx - w / 2) + 'px'; el.style.top = Math.round(y - w * 0.09) + 'px'; el.style.width = Math.round(w) + 'px'; el.style.height = Math.round(w * 0.18) + 'px';
    };
    // the signpost stands on the far ridge, lower right
    const sw = e.pfSign.clientWidth || W * 0.3, sh = sw * (190 / 160), sx = W * 0.77;
    const sy = this.groundY('pfRidge', sx);
    e.pfSign.style.top = Math.round(sy - sh * 0.97) + 'px';
    e.pfSign.style.left = Math.round(sx - sw / 2) + 'px'; e.pfSign.style.right = 'auto';
    shadow(e.pfShadowSign, sx, sy, sw * 0.5);
    // Pickle stands on the near ground beside the rocket
    const pw = W * 0.38, ph = pw * (200 / 260), px = W * 0.54 + pw / 2;
    const py = this.groundY('pfGround', px);
    e.pfPup.style.top = Math.round(py - ph * PUP_FOOT) + 'px';
    shadow(e.pfShadowPup, px, py, pw * 0.55);
    // the rocket's contact shadow, under its belly
    const { landed, shipW } = this.shipLanding();
    shadow(e.pfShadowShip, landed.x + shipW / 2, this.groundY('pfGround', landed.x + shipW / 2), shipW * 0.9);
  },

  /* where the crashed rocket sits: its belly rests in the clover at the middle of the ship */
  shipLanding() {
    const e = this.els, W = e.pfStage.clientWidth, sw = e.pfShip.offsetWidth || W * 0.36, sh = e.pfShip.offsetHeight || sw * (138 / 256);
    const x = W * 0.07, ground = this.groundY('pfGround', x + sw / 2);
    return { landed: { x, y: ground - sh * SHIP_BELLY + sh * 0.03, r: -12 }, shipW: sw };
  },

  /* the stage size, and the pose of the rocket (top-left corner + tilt) where it landed in the clover, or stands on the launch pad */
  geo() {
    const e = this.els, W = e.pfStage.clientWidth, H = e.pfStage.clientHeight, sw = e.pfShip.offsetWidth, sh = e.pfShip.offsetHeight;
    return {
      W, H,
      landed: this.shipLanding().landed,
      pad: { x: W * 0.5 - sw / 2, y: H * 0.827 - sw / 2 - sh / 2 - 2, r: 90 }
    };
  },
  pose(p: { x: number; y: number; r: number }) { return 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px) rotate(' + p.r + 'deg)'; },

  reset() {
    const e = this.els;
    this.film.clearAnimations();
    e.pfStage.querySelectorAll('.pf-puff').forEach(p => p.remove());
    e.pfStage.classList.remove('lift'); e.pfStage.style.transform = '';
    e.pfSign.classList.remove('on');
    e.pfShip.classList.remove('open', 'landed'); e.pfShip.style.transform = this.pose({ x: -9999, y: 0, r: 0 });
    e.pfPup.style.opacity = '0'; e.pfPup.style.transform = '';
    e.pfCount.style.opacity = ''; e.pfCount.style.transform = ''; e.pfCount.textContent = '';
    e.pfHeart.style.opacity = ''; e.pfHeart.style.transform = '';
    e.pfTitle.classList.remove('on');
    this.shadows(false, false, false);
    this.layoutGround();
    this.film.caption('');
    this.pup.react('happy');
  },

  /* a puff of dust where the rocket touches down */
  puff(x: number, y: number, delay = 0) {
    const el = document.createElement('i');
    el.className = 'pf-puff'; el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
    this.els.pfStage.appendChild(el);
    const a = this.film.anim(el, [{ transform: 'scale(.4)', opacity: 0.9 }, { transform: 'scale(2.6) translateY(-16px)', opacity: 0 }], { duration: 1000, delay, easing: 'ease-out', fill: 'forwards' });
    if (a) setTimeout(() => el.remove(), 1000 + delay + 80); else el.remove();
  },

  /* the end state of the crash landing: the rocket in the clover with its hatch open, and Pickle beside it */
  settleIntro() {
    const e = this.els;
    e.pfSign.classList.add('on');
    e.pfShip.style.transform = this.pose(this.geo().landed);
    e.pfShip.classList.add('open', 'landed');
    e.pfPup.style.opacity = '1';
    this.shadows(true, true, true);
    this.pup.react('happy');
  },
  /* the end state of the lift-off: the heart of stardust in place */
  showHeart() { const h = this.els.pfHeart; h.style.opacity = '1'; h.style.transform = HEART_SHOWN; },

  async intro(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.pup;
    this.reset(); f.open(first);
    if (REDUCED) {
      this.settleIntro(); e.pfTitle.classList.add('on');
      await f.wait(2600); await f.close();
    } else {
      const { W, H, landed } = this.geo();
      PupScore.start();
      f.snd(() => PupScore.twinkle());
      // 1. a quiet night, and a signpost that points the wrong way
      f.anim(e.pfStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }], { duration: 15000, easing: 'ease-in-out', fill: 'forwards' });
      f.caption('A quiet night over Honeywick...');
      await f.wait(2500);
      e.pfSign.classList.add('on'); this.shadows(true, false, false);
      f.caption('Far past the moon, a signpost points the wrong way...');
      await f.wait(2000);
      // 2. a little rocket zooms by... and turns left
      f.snd(() => PupScore.zoom());
      const at = (x: number, y: number, r: number, offset: number, easing = 'ease-in-out'): Keyframe => ({ transform: this.pose({ x, y, r }), offset, easing });
      f.anim(e.pfShip, [
        at(W * 1.05, H * 0.1, -6, 0, 'ease-out'), at(W * 0.58, H * 0.2, 5, 0.26), at(W * 0.37, H * 0.26, -9, 0.44), at(W * 0.31, H * 0.29, 14, 0.58),
        at(W * 0.2, H * 0.47, -28, 0.82, 'ease-in'), at(landed.x, landed.y, landed.r, 1, 'cubic-bezier(.3,.8,.4,1)')
      ], { duration: 5600, fill: 'forwards' });
      f.caption('...and somebody takes the wrong turn.');
      await f.wait(2200);
      // 3. it sputters and tumbles into the meadow
      f.caption('Uh-oh.');
      f.snd(() => PupScore.sputter());
      await f.wait(1300);
      f.caption('');
      f.snd(() => PupScore.fall());
      await f.wait(2200);
      // 4. plop
      f.snd(() => { PupScore.boing(); Haptics.buzz(30); });
      f.flashScreen(0.35, 500, 0.2);
      f.anim(e.pfStage, [{ transform: 'translateY(0)' }, { transform: 'translateY(8px)', offset: 0.3 }, { transform: 'translateY(-3px)', offset: 0.6 }, { transform: 'translateY(0)' }], { duration: 520, easing: 'ease-out' });
      e.pfShip.classList.add('landed'); this.shadows(true, true, false);
      for (const [i, k] of [0.18, 0.5, 0.82].entries()) { const px = landed.x + e.pfShip.offsetWidth * k; this.puff(px, this.groundY('pfGround', px) - 4, i * 80); }
      await f.wait(1300);
      // 5. the hatch pops open
      e.pfShip.classList.add('open'); this.shadows(true, true, true);
      f.snd(() => { PupScore.pop(); Haptics.found(); });
      f.caption('A hatch pops open. Two little antennae wobble up...');
      await f.wait(2400);
      // 6. out hops Pickle
      this.pup.react('surprised');
      e.pfPup.style.opacity = '1';
      f.anim(e.pfPup, [{ transform: 'translate(-70%,18%) scale(.25)', opacity: 0 }, { transform: 'translate(-20%,-18%) scale(1.06)', opacity: 1, offset: 0.55 }, { transform: 'none', opacity: 1 }], { duration: 800, easing: 'cubic-bezier(.3,1.2,.5,1)', fill: 'backwards' });
      f.snd(() => PupScore.bork());
      f.caption('Bork!');
      await f.wait(1000);
      this.pup.react('wiggle');
      await f.wait(1500);
      // 7. the title card
      f.caption('');
      e.pfTitle.classList.add('on');
      f.snd(() => { PupScore.title(); Haptics.win(); });
      await f.wait(3200);
      PupScore.stop();                                             // the pad fades (at once if the film was skipped)
      await f.close();
    }
    Store.data.seen.pup = true; Store.save();
  },

  /* after Case 5.3: the countdown, the lift-off and a heart of stardust */
  async caught(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els;
    this.reset(); f.open(false);
    e.pfStage.classList.add('lift');
    e.pfSign.classList.add('on'); this.shadows(true, false, false);
    e.pfShip.classList.add('open');
    const { W, H, pad } = this.geo();
    e.pfShip.style.transform = this.pose(pad);
    if (REDUCED) {
      e.pfShip.style.transform = this.pose({ x: pad.x, y: -H, r: 90 });
      this.showHeart();
      f.caption('Safe travels, Pickle!'); await f.wait(2400); await f.close(); return;
    }
    PupScore.start();
    f.caption('The launch key turns. The sparklers fizz.');
    await f.wait(1900);
    // the countdown
    f.caption('');
    for (const [i, n] of ['3', '2', '1'].entries()) {
      e.pfCount.textContent = n;
      f.snd(() => { PupScore.countdown(i); Haptics.buzz(10); });
      f.anim(e.pfCount, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.5)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.05)', offset: 0.3 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.25)' }], { duration: 900, easing: 'ease-out' });
      if (i === 2) this.pup.react('wiggle');
      await f.wait(950);
    }
    // lift-off
    f.snd(() => { PupScore.countdown(3); PupScore.liftoff(); Haptics.buzz([40, 30, 60, 30, 90, 30, 120]); });
    f.flashScreen(0.6, 700, 0.15);
    f.caption('Lift-off!');
    f.anim(e.pfStage, [{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)', offset: 0.15 }, { transform: 'translate(3px,-2px)', offset: 0.3 }, { transform: 'translate(-2px,2px)', offset: 0.5 }, { transform: 'translate(0,0)' }], { duration: 900, easing: 'linear' });
    const flight = f.anim(e.pfShip, [
      { transform: this.pose(pad), easing: 'cubic-bezier(.5,0,.9,.6)' },
      { transform: this.pose({ x: pad.x, y: pad.y - H * 0.12, r: 90 }), offset: 0.28, easing: 'cubic-bezier(.4,0,.9,.5)' },
      { transform: this.pose({ x: pad.x + W * 0.06, y: -H * 0.45, r: 90 }) }
    ], { duration: 3000, fill: 'forwards' });
    if (!flight) e.pfShip.style.transform = this.pose({ x: pad.x, y: -H, r: 90 });
    await f.wait(3100);
    // a heart of stardust where it flew
    f.caption('Bork bork! (That means thank you.)');
    f.snd(() => PupScore.heart());
    f.anim(e.pfHeart, [{ opacity: 0, transform: HEART_SHOWN + ' scale(.5)' }, { opacity: 1, transform: HEART_SHOWN + ' scale(1.08)', offset: 0.6 }, { opacity: 1, transform: HEART_SHOWN + ' scale(1)' }], { duration: 1100, easing: 'ease-out', fill: 'forwards' });
    if (f.fast) this.showHeart();
    await f.wait(3000);
    PupScore.stop();
    await f.close();
  }
};

scenes.pup = PupScene;   // levels reach these cinematics through core/scenes.ts
