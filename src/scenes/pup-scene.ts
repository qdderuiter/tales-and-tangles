import { PupScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { AudioFX } from '../audio/sfx.ts';
import { Pup, rocketMarkup } from '../characters/pup.ts';
import type { PupPortrait } from '../characters/pup.ts';
import { $ } from '../core/dom.ts';
import { emit } from '../core/events.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, late, mulberry32 } from '../core/util.ts';
import { Store } from '../state/store.ts';
import { Film } from './film.ts';

/* ---------- Pickle, the space pup: his crash landing (Case 5.1) and his lift-off (after Case 5.3) ----------
   Drawn live like Evil Larry's cinematics: a starry sky, a signpost that points the wrong way, a sausage-bun rocket that zooms by, sputters
   and bumps down into the meadow; later the countdown, the lift-off and a heart of stardust. Skippable (the Skip button appears after
   1.5 s the first time), and reduced motion gets the finished picture. The playback mechanics are shared with the other films: see film.ts. */
const TAU = Math.PI * 2;

export const PupScene = {
  els: {} as Record<string, HTMLElement>, pup: late<PupPortrait>(), film: late<Film>(),

  init() {
    const e = this.els;
    ['pupFilm', 'pfStage', 'pfStars', 'pfSign', 'pfShip', 'pfPup', 'pfCount', 'pfHeart', 'pfCap', 'pfTitle', 'pfFlash', 'pfSkip'].forEach(id => { e[id] = $('#' + id); });
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
  },

  /* the stage size, and the pose of the rocket (top-left corner + tilt) where it landed in the clover, or stands on the launch pad */
  geo() {
    const e = this.els, W = e.pfStage.clientWidth, H = e.pfStage.clientHeight, sw = e.pfShip.offsetWidth, sh = e.pfShip.offsetHeight;
    return {
      W, H,
      landed: { x: W * 0.07, y: H * 0.625, r: -12 },
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
    e.pfShip.classList.remove('open'); e.pfShip.style.transform = this.pose({ x: -9999, y: 0, r: 0 });
    e.pfPup.style.opacity = '0'; e.pfPup.style.transform = '';
    e.pfCount.style.opacity = ''; e.pfCount.style.transform = ''; e.pfCount.textContent = '';
    e.pfHeart.style.opacity = ''; e.pfHeart.style.transform = '';
    e.pfTitle.classList.remove('on');
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
    e.pfShip.classList.add('open');
    e.pfPup.style.opacity = '1';
    this.pup.react('happy');
  },

  async intro(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.pup;
    this.reset(); f.open(first);
    emit('film', { on: true });                                   // the game music steps aside for the film's own score
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
      e.pfSign.classList.add('on');
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
      await f.wait(1700);
      await f.wait(500);
      // 4. plop
      f.snd(() => { PupScore.boing(); Haptics.buzz(30); });
      f.flashScreen(0.35, 500, 0.2);
      f.anim(e.pfStage, [{ transform: 'translateY(0)' }, { transform: 'translateY(8px)', offset: 0.3 }, { transform: 'translateY(-3px)', offset: 0.6 }, { transform: 'translateY(0)' }], { duration: 520, easing: 'ease-out' });
      this.puff(landed.x + W * 0.05, landed.y + H * 0.085); this.puff(landed.x + W * 0.17, landed.y + H * 0.1, 80); this.puff(landed.x + W * 0.28, landed.y + H * 0.085, 160);
      await f.wait(1300);
      // 5. the hatch pops open
      e.pfShip.classList.add('open');
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
    PupScore.stop();
    emit('film', { on: false });
    Store.data.seen.pup = true; Store.save();
  },

  /* after Case 5.3: the countdown, the lift-off and a heart of stardust */
  async caught(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els;
    this.reset(); f.open(false);
    emit('film', { on: true });
    e.pfStage.classList.add('lift');
    e.pfSign.classList.add('on');
    e.pfShip.classList.add('open');
    const { W, H, pad } = this.geo();
    e.pfShip.style.transform = this.pose(pad);
    if (REDUCED) {
      e.pfShip.style.transform = this.pose({ x: pad.x, y: -H, r: 90 });
      e.pfHeart.style.opacity = '1'; e.pfHeart.style.transform = 'translate(-50%,-50%)';
      f.caption('Safe travels, Pickle!'); await f.wait(2400); await f.close(); emit('film', { on: false }); return;
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
    f.snd(() => { for (let i = 0; i < 6; i++) AudioFX.chime(4 + i * 2, i * 0.09, 0.09); });
    f.anim(e.pfHeart, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.5)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.08)', offset: 0.6 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 1100, easing: 'ease-out', fill: 'forwards' });
    if (f.fast) { e.pfHeart.style.opacity = '1'; e.pfHeart.style.transform = 'translate(-50%,-50%)'; }
    await f.wait(3000);
    PupScore.stop();
    await f.close();
    emit('film', { on: false });
  }
};

scenes.pup = PupScene;   // levels reach these cinematics through core/scenes.ts
