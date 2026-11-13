import { WormScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { bearMarkup } from '../characters/barnaby-svg.ts';
import { wormInner } from '../characters/worm.ts';
import { $, svgEl } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, late, mulberry32 } from '../core/util.ts';
import { Store } from '../state/store.ts';
import { Film } from './film.ts';

/* ---------- Biscuit, the little sand worm: the night he got lost (Case 6.1) and his homecoming (after Case 6.3) ----------
   Both scenes play on one SVG stage (index.html #wfArt, a 400 x 700 canvas; every number here is in those units).

   The intro tells why he is lost: he sits on a dune counting stars, yawns, dives under the sand to tunnel home, and then the wind
   rearranges the desert (the dunes slide, the signpost sinks). He wanders, pops up somewhere he has never seen, sheds one tear, and then a
   lantern comes over the dune: Barnaby. The homecoming is the answer to it: the key, the round door, three hops inside, the windows
   lighting up one by one, the kettle, a wave from the doorstep, and the fireflies gathering into a heart.

   Every move is written as "the end state, plus an animation that leads to it" (move()), so a skipped or reduced-motion film simply
   shows the end states. Skippable (the Skip button appears after 1.5 s the first time). The playback mechanics are shared: see film.ts. */
const TAU = Math.PI * 2;

const ON_DUNE = 'translate(130 449)';      // Biscuit's box while he counts the stars
const LOST = 'translate(100 445)';         // ... where he pops up after the wind
const AT_HOME = 'translate(181 448)';      // ... and in front of his house
const SIGN_SUNK = 'translateY(58px) rotate(-22deg)';
const DUNES_MOVED = { wfDuneFar: 'translateX(54px)', wfDuneMid: 'translateX(-64px)' };
const DOOR_OPEN = 'scaleX(.12)';
const KEY_HELD = 'translate(112px,-62px) rotate(-28deg)';    // the key above Biscuit's head, relative to the lock
const IN_DOORWAY = 'translate(-122px,-16px) scale(.4)';      // Biscuit, relative to AT_HOME
const ON_DOORSTEP = 'translate(-36px,4px) scale(.94)';
const LIGHTS = ['wfGlowDoor', 'wfInsideOn', 'wfSpill', 'wfWin0', 'wfWin1'];     // the doorway first (as the door opens), then the two windows
const HEART = { x: 214, y: 392, size: 3.5, count: 18 };
const EASE_OUT_BACK = 'cubic-bezier(.3,1.35,.5,1)';

export const WormScene = {
  els: {} as Record<string, HTMLElement>, film: late<Film>(),
  flies: [] as { el: SVGElement; idle: string }[], streaks: [] as SVGElement[],

  init() {
    const e = this.els;
    ['wormFilm', 'wfStage', 'wfArt', 'wfStars', 'wfShoot', 'wfDuneFar', 'wfDuneMid', 'wfSign', 'wfSteam', 'wfPalms', 'wfDoor', 'wfBear', 'wfBearArt', 'wfWind', 'wfBump', 'wfQ',
      'wfBiscuitPos', 'wfBiscuit', 'wfEmo', 'wfTear', 'wfKey', 'wfPuffs', 'wfFlies', 'wfCap', 'wfTitle', 'wfFlash', 'wfSkip',
      'wfC0', 'wfC1', 'wfC2', 'wfC3', 'wfN0', 'wfN1', 'wfN2', ...LIGHTS].forEach(id => { e[id] = $('#' + id); });
    e.wfEmo.innerHTML = wormInner();
    const rng = mulberry32(23);
    for (let i = 0; i < 54; i++) {
      e.wfStars.appendChild(svgEl('circle', { class: 'wf-star', cx: (rng() * 400).toFixed(1), cy: (rng() * 350).toFixed(1), r: (0.7 + rng() * 1.5).toFixed(1), fill: '#fff6d0',
        style: 'animation-delay:-' + (rng() * 3).toFixed(2) + 's;opacity:' + (0.45 + (i % 3) * 0.25) }));
    }
    // two palms behind the pool
    const palm = (x: number, base: number, top: number, bend: number, scale: number) => {
      const g = svgEl('g', {});
      g.appendChild(svgEl('path', { d: 'M' + x + ' ' + base + ' Q' + (x + bend) + ' ' + (base - (base - top) * 0.55) + ' ' + (x + bend * 0.4) + ' ' + top, fill: 'none', stroke: '#5a3a3a', 'stroke-width': 9, 'stroke-linecap': 'round' }));
      const crown = svgEl('g', { transform: 'translate(' + (x + bend * 0.4) + ' ' + top + ') scale(' + scale + ')' });
      for (let k = 0; k < 7; k++) crown.appendChild(svgEl('path', { d: 'M0 0 Q42 -34 100 -6 Q46 -16 0 0Z', fill: k % 2 ? '#2f8a6a' : '#3aa07a', transform: 'rotate(' + (-160 + k * 22) + ')' }));
      crown.appendChild(svgEl('circle', { cx: -4, cy: 6, r: 6, fill: '#6b4a2a' })); crown.appendChild(svgEl('circle', { cx: 7, cy: 8, r: 6, fill: '#7a5532' }));
      g.appendChild(crown);
      return g;
    };
    e.wfPalms.appendChild(palm(336, 562, 420, 12, 0.7));
    e.wfPalms.appendChild(palm(364, 560, 452, -8, 0.55));
    // streaks of wind, each parked off-stage until the gust
    for (let i = 0; i < 7; i++) {
      const g = svgEl('g', { transform: 'translate(0 ' + Math.round(372 + i * 40 + rng() * 16) + ')' });
      const p = svgEl('path', { class: 'wf-hid', d: 'M0 0 q26 -7 52 0 t52 0 t' + Math.round(30 + rng() * 40) + ' 0', fill: 'none', stroke: '#fff3dc', 'stroke-width': (1.6 + rng() * 1.4).toFixed(1), 'stroke-linecap': 'round' });
      g.appendChild(p); e.wfWind.appendChild(g); this.streaks.push(p);
    }
    // the fireflies: each one's home is a point of the heart; until the finale it idles somewhere over the pool (its `idle` offset)
    for (let i = 0; i < HEART.count; i++) {
      const t = (i / HEART.count) * TAU;
      const hx = HEART.x + 16 * Math.sin(t) ** 3 * HEART.size, hy = HEART.y - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * HEART.size;
      const ix = 190 + rng() * 165, iy = 520 + rng() * 62;
      const idle = 'translate(' + Math.round(ix - hx) + 'px,' + Math.round(iy - hy) + 'px)';
      const g = svgEl('g', { class: 'wf-fly', style: 'transform:' + idle });
      g.appendChild(svgEl('circle', { cx: hx.toFixed(1), cy: hy.toFixed(1), r: 9, fill: 'url(#wfGlow)', style: 'animation-delay:-' + (rng() * 2.6).toFixed(2) + 's' }));
      g.appendChild(svgEl('circle', { cx: hx.toFixed(1), cy: hy.toFixed(1), r: 2.6, fill: '#f4ffb0', style: 'animation-delay:-' + (rng() * 2.6).toFixed(2) + 's' }));
      e.wfFlies.appendChild(g); this.flies.push({ el: g, idle });
    }
    this.film = new Film({ root: e.wormFilm, skip: e.wfSkip, cap: e.wfCap, flash: e.wfFlash });
  },

  /* put an element in its end state (the last keyframe), and play the way there unless the film is skipped or motion is reduced */
  move(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    const last = frames[frames.length - 1], s = (el as HTMLElement | SVGElement).style;
    if (typeof last.transform === 'string') s.transform = last.transform;
    if (last.opacity !== undefined && last.opacity !== null) s.opacity = String(last.opacity);
    return this.film.anim(el, frames, { fill: 'backwards', ...opts });
  },
  show(id: string, on = true) { this.els[id].style.opacity = on ? '1' : '0'; },
  feel(emotion: string) { const c = this.els.wfEmo.classList; ['happy', 'shy', 'wiggle', 'surprised', 'sad', 'sleepy'].forEach(x => c.remove('b-' + x)); c.add('b-' + emotion); },
  lights(count: number) { LIGHTS.forEach((id, i) => this.els[id].classList.toggle('on', i < count)); },
  place(where: string) { this.els.wfBiscuitPos.setAttribute('transform', where); },

  /* a clean stage for one of the two scenes */
  reset(home: boolean) {
    const e = this.els;
    this.film.clearAnimations();
    e.wfArt.classList.toggle('home', home);
    ['wfStage', 'wfArt', 'wfShoot', 'wfDuneFar', 'wfDuneMid', 'wfSign', 'wfDoor', 'wfBear', 'wfBump', 'wfQ', 'wfBiscuit', 'wfTear', 'wfKey', 'wfC0', 'wfC1', 'wfC2', 'wfC3', 'wfN0', 'wfN1', 'wfN2']
      .forEach(id => { e[id].style.transform = ''; e[id].style.opacity = ''; });
    this.streaks.forEach(p => { p.style.transform = ''; p.style.opacity = ''; });
    this.flies.forEach(f => { f.el.style.transform = f.idle; });
    e.wfPuffs.textContent = '';
    e.wfSteam.classList.remove('on');
    e.wfEmo.classList.remove('wf-lookup');
    this.lights(0);
    this.place(home ? AT_HOME : ON_DUNE);
    e.wfTitle.classList.remove('on');
    this.film.caption('');
    this.feel('happy');
  },

  /* a puff of sand at (x, y): a few grains that fly up and out */
  puff(x: number, y: number, n = 6) {
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (0.15 + 0.7 * (k / (n - 1))), d = 20 + (k % 3) * 9;
      const c = svgEl('circle', { class: 'wf-p', cx: x, cy: y, r: 4 + (k % 3) * 2, fill: '#f6dcae' });
      this.els.wfPuffs.appendChild(c);
      const anim = this.film.anim(c, [{ transform: 'translate(0,0) scale(.5)', opacity: 0.95 }, { transform: 'translate(' + Math.round(Math.cos(a) * d * 1.5) + 'px,' + Math.round(-Math.sin(a) * d) + 'px) scale(1.7)', opacity: 0 }],
        { duration: 650 + k * 40, easing: 'ease-out', fill: 'forwards' });
      if (anim) anim.onfinish = () => c.remove(); else c.remove();
    }
  },

  /* the bump of sand over a tunnelling worm travels from one spot to another (offsets from where he dived), rippling as it goes */
  tunnel(from: [number, number], to: [number, number], ms: number) {
    const frames: Keyframe[] = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t, squash = k % 2 ? 'scale(1.12,.84)' : 'scale(.94,1.1)';
      frames.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) ' + (k === 6 ? 'scale(1)' : squash), opacity: 1 });
    }
    return this.move(this.els.wfBump, frames, { duration: ms, easing: 'ease-in-out' });
  },

  /* Barnaby, in whatever the player dressed him in, standing at the left edge with his lantern light */
  dressBear() {
    const art = this.els.wfBearArt, markup = bearMarkup(Store.data.wardrobe.equipped);
    art.innerHTML = markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6);
    const bear = art.firstElementChild;
    if (!bear) return;
    bear.removeAttribute('class'); bear.removeAttribute('role'); bear.removeAttribute('aria-label');    // the stage is decorative, and .bear-svg sizes itself for HTML
    for (const [k, v] of Object.entries({ x: 20, y: 438, width: 104, height: 120 })) bear.setAttribute(k, String(v));
  },

  /* the end state of the intro: the desert rearranged, Biscuit up and found, Barnaby's lantern at the edge of the picture */
  settleIntro() {
    const e = this.els;
    e.wfSign.style.transform = SIGN_SUNK;
    e.wfDuneFar.style.transform = DUNES_MOVED.wfDuneFar; e.wfDuneMid.style.transform = DUNES_MOVED.wfDuneMid;
    this.place(LOST); this.show('wfBiscuit'); this.show('wfBear');
    this.feel('happy');
  },

  async intro(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.worm;
    this.reset(false); this.dressBear(); f.open(first);
    if (REDUCED) {
      this.settleIntro(); e.wfTitle.classList.add('on');
      await f.wait(2600); await f.close();
    } else {
      WormScore.start();
      f.snd(() => WormScore.twinkle());
      // 1. a very small worm on a very big dune, looking up
      this.show('wfBiscuit'); e.wfEmo.classList.add('wf-lookup');
      f.anim(e.wfStage, [{ transform: 'scale(1.2) translateY(5%)' }, { transform: 'scale(1) translateY(0)' }], { duration: 9000, easing: 'cubic-bezier(.3,0,.3,1)', fill: 'backwards' });
      f.caption('Every night, a very small worm counts the stars.');
      await f.wait(2900);
      // 2. one, two, three...
      f.caption('');
      for (let i = 0; i < 3; i++) {
        f.snd(() => WormScore.count(i));
        this.move(e['wfC' + i], [{ transform: 'scale(1)' }, { transform: 'scale(2)', offset: 0.4 }, { transform: 'scale(1.3)' }], { duration: 520, easing: 'ease-out' });
        this.move(e['wfN' + i], [{ transform: 'translateY(8px) scale(.4)', opacity: 0 }, { transform: 'translateY(-3px) scale(1.15)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'ease-out' });
        f.anim(e.wfBiscuit, [{ transform: 'none' }, { transform: 'translateY(-5px) scale(.98,1.04)' }, { transform: 'none' }], { duration: 360, easing: 'ease-out' });
        await f.wait(780);
      }
      // ...ninety-nine, one hundred!
      f.caption('...ninety-nine, one hundred!');
      f.snd(() => WormScore.hundred());
      this.feel('wiggle');
      for (let i = 0; i < 4; i++) this.move(e['wfC' + i], [{ transform: 'scale(1.3)' }, { transform: 'scale(2.3)', offset: 0.35 }, { transform: 'scale(1.3)' }], { duration: 700, delay: i * 90, easing: 'ease-out' });
      for (let i = 0; i < 3; i++) this.move(e['wfN' + i], [{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 300 });
      this.move(e.wfShoot, [{ transform: 'translateX(-50px)', opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: 'translateX(190px)', opacity: 0 }], { duration: 900, delay: 350, easing: 'ease-in' });
      await f.wait(2300);
      // 3. bedtime: a yawn, and a dive under the sand
      e.wfEmo.classList.remove('wf-lookup'); this.feel('sleepy');
      f.snd(() => WormScore.yawn());
      f.caption('Time for bed. Home is just under the sand.');
      f.anim(e.wfBiscuit, [{ transform: 'none' }, { transform: 'scale(.96,1.07)', offset: 0.4 }, { transform: 'none' }], { duration: 1100, easing: 'ease-in-out' });
      await f.wait(2000);
      f.snd(() => { WormScore.dive(); Haptics.buzz(10); });
      this.move(e.wfBiscuit, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-16px) scale(.94,1.1)', opacity: 1, offset: 0.35 }, { transform: 'translateY(44px) scale(.8,.3)', opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.5,0,.8,.4)' });
      await f.wait(420);
      this.puff(230, 550);
      this.show('wfBump');
      f.snd(() => WormScore.rumble());
      this.tunnel([0, 0], [-120, -13], 1700);
      await f.wait(1500);
      // 4. the wind rearranges the desert
      f.caption('But tonight, the wind moved every dune in the desert.');
      f.snd(() => { WormScore.gust(); Haptics.buzz([20, 40, 30]); });
      this.streaks.forEach((p, i) => this.move(p, [{ transform: 'translateX(-240px)', opacity: 0 }, { opacity: 0.75, offset: 0.3 }, { transform: 'translateX(520px)', opacity: 0 }], { duration: 1150, delay: i * 190, easing: 'cubic-bezier(.5,0,.7,.6)' }));
      this.move(e.wfDuneFar, [{ transform: 'none' }, { transform: DUNES_MOVED.wfDuneFar }], { duration: 2500, easing: 'ease-in-out' });
      this.move(e.wfDuneMid, [{ transform: 'none' }, { transform: DUNES_MOVED.wfDuneMid }], { duration: 2500, easing: 'ease-in-out' });
      this.move(e.wfSign, [{ transform: 'none' }, { transform: 'translateY(6px) rotate(9deg)', offset: 0.25 }, { transform: 'translateY(30px) rotate(-14deg)', offset: 0.6 }, { transform: SIGN_SUNK }], { duration: 2300, delay: 200, easing: 'ease-in-out' });
      f.anim(e.wfArt, [{ transform: 'translate(0,0)' }, { transform: 'translate(5px,1px)', offset: 0.2 }, { transform: 'translate(-3px,-1px)', offset: 0.45 }, { transform: 'translate(4px,0)', offset: 0.7 }, { transform: 'translate(0,0)' }], { duration: 2200, easing: 'ease-in-out' });
      f.anim(e.wfBump, [{ transform: 'translate(-120px,-13px) scale(1)' }, { transform: 'translate(-112px,-13px) scale(1.2,.7)', offset: 0.3 }, { transform: 'translate(-124px,-13px) scale(.9,1.1)', offset: 0.7 }, { transform: 'translate(-120px,-13px) scale(1)' }], { duration: 2000, easing: 'ease-in-out' });
      await f.wait(3100);
      // 5. left? right? hm.
      f.caption('Left... no. Right... hmm.');
      f.snd(() => WormScore.rumble());
      this.tunnel([-120, -13], [70, 6], 1500);
      await f.wait(1650);
      f.snd(() => WormScore.wonder());
      this.move(e.wfQ, [{ transform: 'translateY(10px) scale(.3)', opacity: 0 }, { transform: 'translateY(-4px) scale(1.2)', opacity: 1, offset: 0.3 }, { transform: 'none', opacity: 1, offset: 0.7 }, { transform: 'translateY(-10px)', opacity: 0 }], { duration: 1000, easing: 'ease-out' });
      await f.wait(950);
      this.tunnel([70, 6], [-30, -5], 1100);
      await f.wait(1250);
      // 6. pop!
      this.show('wfBump', false); this.place(LOST);
      this.feel('surprised');
      f.snd(() => { WormScore.pop(); Haptics.found(); });
      f.flashScreen(0.16, 400, 0.2);
      this.puff(200, 546, 7);
      this.move(e.wfBiscuit, [{ transform: 'translateY(46px) scale(.6,.2)', opacity: 0 }, { transform: 'translateY(-20px) scale(.95,1.12)', opacity: 1, offset: 0.55 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: EASE_OUT_BACK });
      f.caption('Pop!');
      await f.wait(1100);
      // 7. nothing looks like home
      f.caption('Oh dear. Every dune looks exactly the same.');
      this.move(e.wfBiscuit, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-10deg)', offset: 0.2 }, { transform: 'rotate(-10deg)', offset: 0.42 }, { transform: 'rotate(10deg)', offset: 0.66 }, { transform: 'rotate(10deg)', offset: 0.86 }, { transform: 'rotate(0deg)' }], { duration: 2300, easing: 'ease-in-out' });
      await f.wait(2400);
      this.feel('sad');
      f.snd(() => WormScore.tear());
      this.move(e.wfTear, [{ transform: 'translateY(0) scale(.4)', opacity: 0 }, { transform: 'translateY(3px) scale(1)', opacity: 1, offset: 0.3 }, { transform: 'translateY(30px) scale(1)', opacity: 0 }], { duration: 1200, easing: 'ease-in' });
      await f.wait(1700);
      // 8. a lantern comes over the dune
      f.caption('But then: a lantern. And a bear with very kind eyes.');
      f.snd(() => WormScore.lantern());
      this.move(e.wfBear, [{ transform: 'translateX(-130px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1500, easing: 'cubic-bezier(.2,.8,.3,1)' });
      f.anim(e.wfStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.09)' }], { duration: 6500, easing: 'ease-in-out', fill: 'forwards' });
      await f.wait(900);
      this.feel('surprised');
      this.move(e.wfBiscuit, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-7deg)' }], { duration: 400, easing: 'ease-out' });
      await f.wait(1100);
      this.feel('shy');
      f.snd(() => WormScore.squeak());
      await f.wait(1300);
      // 9. the title card
      f.caption('');
      this.feel('happy');
      e.wfTitle.classList.add('on');
      f.snd(() => { WormScore.title(); Haptics.win(); });
      await f.wait(3200);
      if (f.fast) this.settleIntro();
      WormScore.stop();                                            // the pad fades (at once if the film was skipped)
      await f.close();
    }
    Store.data.seen.worm = true; Store.save();
  },

  /* the end state of the homecoming: the door open, every light on, the kettle steaming, Biscuit on his doorstep under a heart of fireflies */
  settleHome() {
    const e = this.els;
    e.wfDoor.style.transform = DOOR_OPEN;
    this.lights(LIGHTS.length);
    e.wfSteam.classList.add('on');
    this.show('wfBiscuit'); e.wfBiscuit.style.transform = ON_DOORSTEP;
    this.flies.forEach(fl => { fl.el.style.transform = 'translate(0px,0px)'; });
    this.feel('happy');
  },

  /* after Case 6.3: the key, the round door, the lights, the kettle, and a heart of fireflies */
  async caught(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els;
    this.reset(true); f.open(false);
    this.show('wfBiscuit');
    if (REDUCED) {
      this.settleHome();
      f.caption('Home, sweet home.'); await f.wait(2600); await f.close(); return;
    }
    WormScore.start();
    f.snd(() => WormScore.twinkle());
    // 1. home, and the key
    f.anim(e.wfStage, [{ transform: 'scale(1) translateX(0)' }, { transform: 'scale(1.12) translateX(3%)' }], { duration: 20000, easing: 'ease-in-out', fill: 'forwards' });
    this.show('wfKey'); e.wfKey.style.transform = KEY_HELD;
    f.anim(e.wfKey, [{ transform: KEY_HELD }, { transform: KEY_HELD + ' translateY(-5px)' }, { transform: KEY_HELD }], { duration: 1100, iterations: 2, easing: 'ease-in-out' });
    f.caption('Home at last. And one little key...');
    await f.wait(2300);
    f.snd(() => WormScore.swish());
    this.move(e.wfKey, [{ transform: KEY_HELD }, { transform: 'translate(40px,-58px) rotate(-200deg)', offset: 0.55 }, { transform: 'translate(0px,0px) rotate(-360deg)' }], { duration: 850, easing: 'cubic-bezier(.4,0,.3,1)' });
    await f.wait(1000);
    f.snd(() => { WormScore.key(); Haptics.found(); });
    f.caption('Click.');
    this.move(e.wfKey, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }], { duration: 320, easing: 'ease-in-out' });
    await f.wait(800);
    // 2. the round door swings open, and the light comes out to meet him
    this.move(e.wfKey, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
    f.snd(() => WormScore.creak());
    this.feel('surprised');
    this.move(e.wfDoor, [{ transform: 'scaleX(1)' }, { transform: DOOR_OPEN }], { duration: 1300, easing: 'cubic-bezier(.5,0,.2,1)' });
    f.caption('The little round door swings open.');
    await f.wait(500);
    this.lights(3);
    await f.wait(1500);
    // 3. hop, hop, hop
    this.feel('wiggle');
    f.caption('Hop, hop, hop...');
    const hops = [0, -30, -60, -90];
    for (let i = 0; i < 3; i++) {
      const a = hops[i], b = hops[i + 1];
      f.snd(() => WormScore.hop(i));
      this.move(e.wfBiscuit, [{ transform: 'translate(' + a + 'px,0px) scale(1.06,.9)' }, { transform: 'translate(' + (a + b) / 2 + 'px,-22px) scale(.95,1.08)', offset: 0.5 }, { transform: 'translate(' + b + 'px,0px) scale(1)' }], { duration: 400, easing: 'ease-in-out' });
      await f.wait(470);
    }
    f.snd(() => WormScore.dive());
    this.move(e.wfBiscuit, [{ transform: 'translate(-90px,0px) scale(1)', opacity: 1 }, { transform: 'translate(-112px,-24px) scale(.6)', opacity: 1, offset: 0.6 }, { transform: IN_DOORWAY, opacity: 0 }], { duration: 520, easing: 'ease-in' });
    await f.wait(1000);
    // 4. one by one, the windows glow
    f.caption('One by one, the windows glow.');
    for (let i = 0; i < 2; i++) { this.lights(4 + i); f.snd(() => WormScore.window(i)); await f.wait(650); }
    await f.wait(500);
    // 5. the kettle goes on
    e.wfSteam.classList.add('on');
    f.snd(() => WormScore.kettle());
    f.caption('The kettle is on.');
    await f.wait(2100);
    // 6. he comes back out to say it properly
    this.feel('happy');
    f.snd(() => WormScore.squeak());
    this.move(e.wfBiscuit, [{ transform: IN_DOORWAY, opacity: 0 }, { transform: 'translate(-56px,-14px) scale(.98)', opacity: 1, offset: 0.6 }, { transform: ON_DOORSTEP, opacity: 1 }], { duration: 650, easing: EASE_OUT_BACK });
    f.caption('Thank you, friends! Come in for tea!');
    await f.wait(700);
    this.feel('wiggle');
    await f.wait(2100);
    // 7. the fireflies have something to say too
    this.feel('happy');
    f.caption('');
    f.snd(() => { WormScore.heart(); Haptics.win(); });
    this.flies.forEach((fl, i) => this.move(fl.el, [{ transform: fl.idle }, { transform: 'translate(0px,0px)' }], { duration: 1500, delay: i * 70, easing: 'cubic-bezier(.4,0,.2,1)' }));
    this.move(e.wfShoot, [{ transform: 'translateX(-50px)', opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: 'translateX(190px)', opacity: 0 }], { duration: 900, delay: 2300, easing: 'ease-in' });
    await f.wait(2400);
    f.caption('Home, sweet home.');
    f.flashScreen(0.12, 900, 0.4);
    await f.wait(3400);
    if (f.fast) this.settleHome();
    WormScore.stop();
    await f.close();
  }
};

scenes.worm = WormScene;   // levels reach these cinematics through core/scenes.ts
