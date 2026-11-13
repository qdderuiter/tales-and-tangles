import { ElephantScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { bearMarkup } from '../characters/barnaby-svg.ts';
import { elephantInner, starBall } from '../characters/elephant.ts';
import { $, svgEl } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, late, mulberry32 } from '../core/util.ts';
import { Store } from '../state/store.ts';
import { Film } from './film.ts';

/* ---------- Pippy, the little clown elephant: the night his star ball vanished (Case 7.1) and his show (after Case 7.3) ----------
   Both scenes play on one SVG stage (index.html #efArt, a 400 x 700 canvas; every number here is in those units).

   The intro tells why he is sad: alone in the big top he trots to his lucky star ball, climbs on, wobbles, balances, spins and bows to the empty
   seats. A drum roll, the lights go out, and when they come back the ball is gone. He sheds one tear, and then a lantern comes through the tent
   flap: Barnaby. The show is the answer to it: the curtains open, Pippy rolls in on the (freshly golden) ball, hops three times, toots, the
   confetti falls, the crowd claps and he takes a very big bow.

   Every move is written as "the end state, plus an animation that leads to it" (move()), so a skipped or reduced-motion film simply
   shows the end states. Skippable (the Skip button appears after 1.5 s the first time). The playback mechanics are shared: see film.ts. */
const TAU = Math.PI * 2;

/* Pippy's group sits on the ring floor, at the ball's centre column; these are offsets from there */
const OFF_STAGE = 'translate(-260px,0px)';
const BESIDE_BALL = 'translate(-64px,0px)';
const FLOOR = 'translate(0px,0px)';
const ON_BALL = 'translate(0px,-68px)';                  // the ball is 68 across, so his feet are 68 above the floor
const BALL_HOME = 'translate(0px,0px) rotate(0deg)';
const BALL_AWAY = 'translate(-250px,0px) rotate(-420deg)';
const CURTAIN_L = 'translateX(-300px)';
const CURTAIN_R = 'translateX(300px)';
const INTRO_BEAR = { x: 14, y: 534, width: 104, height: 120 };     // Barnaby at the tent flap, in the lantern light
const SHOW_BEAR = { x: 286, y: 548, width: 92, height: 106 };      // ... and in the front row for the show
const CONFETTI = ['#ff6f91', '#ffd24a', '#6fd3c8', '#9a8cf0', '#ff9f5a', '#8ee07a'];
const EASE_OUT_BACK = 'cubic-bezier(.3,1.35,.5,1)';

export const ElephantScene = {
  els: {} as Record<string, HTMLElement>, film: late<Film>(),
  crowd: [] as SVGElement[], confetti: [] as SVGElement[],

  init() {
    const e = this.els;
    ['elephantFilm', 'efStage', 'efArt', 'efTent', 'efBulbs', 'efSeats', 'efCrowd', 'efBall', 'efPippy', 'efEmo', 'efQ', 'efTear', 'efBear', 'efBearArt', 'efBearShow', 'efBearShowArt',
      'efSparks', 'efConfetti', 'efCurL', 'efCurR', 'efDark', 'efCap', 'efTitle', 'efFlash', 'efSkip'].forEach(id => { e[id] = $('#' + id); });
    e.efEmo.innerHTML = elephantInner();
    e.efBall.innerHTML = starBall(0, -34, 34);
    const rng = mulberry32(71);
    // the tent wall: stripes fanning out from the top of the tent pole
    for (let x = -500, i = 0; x < 900; x += 100, i++) {
      e.efTent.appendChild(svgEl('polygon', { points: '200,-160 ' + x + ',520 ' + (x + 100) + ',520', fill: i % 2 ? '#7a2a55' : '#a8426a', opacity: 0.55 }));
    }
    // two swags of string lights
    [[70, 150], [124, 204]].forEach(([y0, mid]) => {
      e.efBulbs.appendChild(svgEl('path', { d: 'M-20 ' + y0 + ' Q200 ' + mid + ' 420 ' + y0, fill: 'none', stroke: '#3a1a40', 'stroke-width': 2 }));
      for (let k = 0; k <= 10; k++) {
        const t = k / 10, x = -20 + 440 * t, y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * mid + t * t * y0, c = CONFETTI[k % CONFETTI.length];
        const g = svgEl('g', { class: 'ef-bulb' });
        g.appendChild(svgEl('circle', { cx: x.toFixed(1), cy: (y + 6).toFixed(1), r: 14, fill: 'url(#efGlow)' }));
        g.appendChild(svgEl('circle', { cx: x.toFixed(1), cy: (y + 6).toFixed(1), r: 4.6, fill: c }));
        e.efBulbs.appendChild(g);
      }
    });
    // empty seats, three rows (the front row is the lowest)
    for (let row = 0; row < 3; row++) for (let k = 0; k < 14; k++) {
      e.efSeats.appendChild(svgEl('rect', { x: -14 + k * 32 + row * 10, y: 384 + row * 28, width: 26, height: 22, rx: 7, fill: row % 2 ? '#8e2a52' : '#a33262' }));
    }
    // the crowd of the show: dark little silhouettes along the seats, with round or pointed ears
    for (let k = 0; k < 11; k++) {
      const x = 18 + k * 36 + (k % 2) * 8, y = 470 + (k % 2) * 6;
      const g = svgEl('g', { transform: 'translate(' + x + ' ' + y + ')' }), fig = svgEl('g', { class: 'ef-fig' });
      fig.appendChild(svgEl('ellipse', { cx: 0, cy: 0, rx: 16, ry: 19, fill: k % 3 ? '#2a0f33' : '#3b1647' }));
      fig.appendChild(svgEl('circle', { cx: 0, cy: -24, r: 13, fill: k % 3 ? '#2a0f33' : '#3b1647' }));
      if (k % 3 === 0) fig.appendChild(svgEl('path', { d: 'M-12 -30 L-8 -46 L-2 -34Z M12 -30 L8 -46 L2 -34Z', fill: '#3b1647' }));
      else fig.appendChild(svgEl('circle', { cx: -11, cy: -31, r: 6, fill: '#2a0f33' })), fig.appendChild(svgEl('circle', { cx: 11, cy: -31, r: 6, fill: '#2a0f33' }));
      g.appendChild(fig); e.efCrowd.appendChild(g); this.crowd.push(fig);
    }
    // confetti, parked above the stage until the fanfare
    for (let i = 0; i < 54; i++) {
      const c = svgEl('rect', { class: 'ef-conf', x: (rng() * 400).toFixed(1), y: -20, width: 7, height: 11, rx: 1.5, fill: CONFETTI[i % CONFETTI.length], style: 'opacity:0' });
      e.efConfetti.appendChild(c); this.confetti.push(c);
    }
    this.film = new Film({ root: e.elephantFilm, skip: e.efSkip, cap: e.efCap, flash: e.efFlash });
  },

  /* put an element in its end state (the last keyframe), and play the way there unless the film is skipped or motion is reduced */
  move(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    const last = frames[frames.length - 1], s = (el as HTMLElement | SVGElement).style;
    if (typeof last.transform === 'string') s.transform = last.transform;
    if (last.opacity !== undefined && last.opacity !== null) s.opacity = String(last.opacity);
    return this.film.anim(el, frames, { fill: 'backwards', ...opts });
  },
  show(id: string, on = true) { this.els[id].style.opacity = on ? '1' : '0'; },
  feel(emotion: string) { const c = this.els.efEmo.classList; ['happy', 'shy', 'wiggle', 'surprised', 'sad', 'proud'].forEach(x => c.remove('b-' + x)); c.add('b-' + emotion); },

  /* a clean stage for one of the two scenes */
  reset(show: boolean) {
    const e = this.els;
    this.film.clearAnimations();
    e.efArt.classList.toggle('show', show);
    ['efStage', 'efPippy', 'efQ', 'efTear', 'efBear', 'efBearShow', 'efCurL', 'efCurR', 'efDark', 'efCrowd'].forEach(id => { e[id].style.transform = ''; e[id].style.opacity = ''; });
    e.efBall.style.transform = BALL_HOME; e.efBall.style.opacity = show ? '0' : '1';
    e.efPippy.style.transform = show ? OFF_STAGE : OFF_STAGE;
    e.efCrowd.style.opacity = '0';
    this.crowd.forEach(c => { c.style.transform = ''; });
    this.confetti.forEach(c => { c.style.transform = ''; c.style.opacity = '0'; });
    e.efSparks.textContent = '';
    e.efTitle.classList.remove('on');
    this.film.caption('');
    this.feel('happy');
  },

  /* Barnaby, in whatever the player dressed him in, drawn into one of the two bear slots */
  dressBear(slot: string, box: { x: number; y: number; width: number; height: number }) {
    const art = this.els[slot], markup = bearMarkup(Store.data.wardrobe.equipped);
    art.innerHTML = markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6);
    const bear = art.firstElementChild;
    if (!bear) return;
    bear.removeAttribute('class'); bear.removeAttribute('role'); bear.removeAttribute('aria-label');    // the stage is decorative, and .bear-svg sizes itself for HTML
    for (const [k, v] of Object.entries(box)) bear.setAttribute(k, String(v));
  },

  /* a burst of little golden stars at (x, y) */
  sparks(x: number, y: number, n = 9) {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU, d = 34 + (k % 3) * 12;
      const s = svgEl('path', { class: 'ef-spark', d: 'M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z', fill: k % 2 ? '#fff6c8' : '#ffd24a', transform: 'translate(' + x + ' ' + y + ')' });
      this.els.efSparks.appendChild(s);
      const anim = this.film.anim(s, [{ transform: 'translate(' + x + 'px,' + y + 'px) scale(.4)', opacity: 1 },
        { transform: 'translate(' + Math.round(x + Math.cos(a) * d) + 'px,' + Math.round(y + Math.sin(a) * d) + 'px) scale(1.2)', opacity: 0 }], { duration: 700 + k * 30, easing: 'ease-out', fill: 'forwards' });
      if (anim) anim.onfinish = () => s.remove(); else s.remove();
    }
  },

  /* the end state of the intro: the ball gone, Pippy on the floor with his ears down, Barnaby's lantern at the flap */
  settleIntro() {
    const e = this.els;
    this.show('efBall', false); this.show('efPippy'); e.efPippy.style.transform = FLOOR; this.show('efBear');
    this.feel('shy');
  },

  async intro(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.elephant;
    this.reset(false); this.dressBear('efBearArt', INTRO_BEAR); f.open(first);
    if (REDUCED) {
      this.settleIntro(); e.efTitle.classList.add('on');
      await f.wait(2600); await f.close();
    } else {
      ElephantScore.start();
      f.snd(() => ElephantScore.twinkle());
      // 1. an empty tent, and one spotlight
      f.anim(e.efStage, [{ transform: 'scale(1.18) translateY(4%)' }, { transform: 'scale(1) translateY(0)' }], { duration: 9000, easing: 'cubic-bezier(.3,0,.3,1)', fill: 'backwards' });
      f.caption('Every night, when the crowd has gone home, a very small clown practises.');
      await f.wait(3200);
      // 2. he trots in, and climbs onto the star ball
      f.caption('');
      this.show('efPippy'); this.feel('happy');
      f.snd(() => ElephantScore.trot());
      this.move(e.efPippy, [{ transform: OFF_STAGE, opacity: 1 }, { transform: 'translate(-170px,-8px)', opacity: 1, offset: 0.3 }, { transform: 'translate(-120px,0px)', offset: 0.5 }, { transform: 'translate(-90px,-8px)', offset: 0.75 }, { transform: BESIDE_BALL, opacity: 1 }], { duration: 1500, easing: 'ease-in-out' });
      await f.wait(1700);
      f.snd(() => ElephantScore.boing());
      this.move(e.efPippy, [{ transform: BESIDE_BALL }, { transform: 'translate(-30px,-122px) scale(.95,1.06)', offset: 0.5 }, { transform: ON_BALL }], { duration: 700, easing: 'ease-in-out' });
      f.anim(e.efBall, [{ transform: BALL_HOME }, { transform: 'translate(0px,0px) rotate(0deg)', offset: 0.6 }, { transform: 'translate(0px,6px) rotate(0deg) scale(1.06,.9)', offset: 0.75 }, { transform: BALL_HOME }], { duration: 700, easing: 'ease-out' });
      await f.wait(800);
      // 3. wobble, wobble...
      f.caption('Whoa... whoa... Balancing is very hard.');
      for (let i = 0; i < 3; i++) f.snd(() => setTimeout(() => ElephantScore.wobble(i), i * 520));
      f.anim(e.efPippy, [{ transform: ON_BALL + ' rotate(0deg)' }, { transform: ON_BALL + ' rotate(-15deg)', offset: 0.2 }, { transform: ON_BALL + ' rotate(13deg)', offset: 0.42 },
        { transform: ON_BALL + ' rotate(-9deg)', offset: 0.62 }, { transform: ON_BALL + ' rotate(5deg)', offset: 0.82 }, { transform: ON_BALL + ' rotate(0deg)' }], { duration: 2000, easing: 'ease-in-out' });
      f.anim(e.efBall, [{ transform: BALL_HOME }, { transform: 'translate(-9px,0px) rotate(-30deg)', offset: 0.25 }, { transform: 'translate(9px,0px) rotate(30deg)', offset: 0.5 }, { transform: 'translate(-4px,0px) rotate(-12deg)', offset: 0.75 }, { transform: BALL_HOME }], { duration: 2000, easing: 'ease-in-out' });
      await f.wait(2300);
      // 4. steady! a spin, a toot
      this.feel('proud');
      f.snd(() => { ElephantScore.toot(); ElephantScore.spin(); });
      f.caption('...but tonight, he is steady. Tomorrow is his very first show!');
      f.anim(e.efBall, [{ transform: BALL_HOME }, { transform: 'translate(0px,0px) rotate(540deg)' }], { duration: 1500, easing: 'cubic-bezier(.3,0,.3,1)' });
      f.anim(e.efPippy, [{ transform: ON_BALL + ' rotate(0deg)' }, { transform: ON_BALL + ' rotate(-6deg)', offset: 0.5 }, { transform: ON_BALL + ' rotate(0deg)' }], { duration: 1500, easing: 'ease-in-out' });
      this.sparks(200, 500, 10);
      await f.wait(3000);
      // 5. a bow to the empty seats
      this.feel('happy');
      f.snd(() => ElephantScore.bow());
      f.caption('He bows to the empty seats, just to be sure.');
      f.anim(e.efPippy, [{ transform: ON_BALL + ' rotate(0deg)' }, { transform: ON_BALL + ' rotate(20deg) translateY(4px)', offset: 0.4 }, { transform: ON_BALL + ' rotate(20deg) translateY(4px)', offset: 0.7 }, { transform: ON_BALL + ' rotate(0deg)' }], { duration: 2000, easing: 'ease-in-out' });
      await f.wait(2600);
      // 6. a drum roll... and the lights go out
      f.caption('Then, the lights blinked.');
      f.snd(() => ElephantScore.drumroll());
      this.feel('surprised');
      await f.wait(1700);
      f.snd(() => { ElephantScore.blackout(); Haptics.buzz([20, 40, 30]); });
      this.move(e.efDark, [{ opacity: 0 }, { opacity: 0.97 }], { duration: 220 });
      await f.wait(420);
      this.show('efBall', false); e.efPippy.style.transform = FLOOR;           // in the dark, the ball is gone and Pippy has dropped to the floor
      f.snd(() => ElephantScore.whoosh());
      await f.wait(1100);
      f.snd(() => ElephantScore.lightsOn());
      this.move(e.efDark, [{ opacity: 0.97 }, { opacity: 0 }], { duration: 450 });
      f.flashScreen(0.14, 400, 0.2);
      this.move(e.efPippy, [{ transform: 'translateY(-26px) scale(.96,1.06)' }, { transform: 'translateY(0px) scale(1.06,.9)', offset: 0.6 }, { transform: FLOOR }], { duration: 500, easing: 'ease-in' });
      await f.wait(900);
      // 7. where did it go?
      f.caption('Where did the star ball go?');
      f.snd(() => ElephantScore.wonder());
      this.move(e.efQ, [{ transform: 'translateY(10px) scale(.3)', opacity: 0 }, { transform: 'translateY(-4px) scale(1.2)', opacity: 1, offset: 0.3 }, { transform: 'none', opacity: 1, offset: 0.7 }, { transform: 'translateY(-10px)', opacity: 0 }], { duration: 1200, easing: 'ease-out' });
      this.move(e.efPippy, [{ transform: FLOOR }, { transform: 'translate(-14px,0px) rotate(-4deg)', offset: 0.3 }, { transform: 'translate(14px,0px) rotate(4deg)', offset: 0.65 }, { transform: FLOOR }], { duration: 1600, easing: 'ease-in-out' });
      await f.wait(2400);
      this.feel('sad');
      f.snd(() => { ElephantScore.sadTrombone(); ElephantScore.tear(); });
      f.caption('Without his lucky ball, he cannot do his best trick.');
      this.move(e.efTear, [{ transform: 'translateY(0) scale(.4)', opacity: 0 }, { transform: 'translateY(3px) scale(1)', opacity: 1, offset: 0.3 }, { transform: 'translateY(34px) scale(1)', opacity: 0 }], { duration: 1300, easing: 'ease-in' });
      await f.wait(2800);
      // 8. a lantern at the tent flap
      f.caption('But then: a lantern, and a bear with very kind eyes.');
      f.snd(() => ElephantScore.lantern());
      this.move(e.efBear, [{ transform: 'translateX(-140px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1500, easing: 'cubic-bezier(.2,.8,.3,1)' });
      f.anim(e.efStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }], { duration: 6500, easing: 'ease-in-out', fill: 'forwards' });
      await f.wait(1000);
      this.feel('surprised');
      await f.wait(1100);
      this.feel('shy');
      f.snd(() => ElephantScore.toot());
      await f.wait(1300);
      // 9. the title card
      f.caption('');
      this.feel('happy');
      e.efTitle.classList.add('on');
      f.snd(() => { ElephantScore.title(); Haptics.win(); });
      await f.wait(3200);
      if (f.fast) this.settleIntro();
      ElephantScore.stop();                                        // the pad fades (at once if the film was skipped)
      await f.close();
    }
    Store.data.seen.elephant = true; Store.save();
  },

  /* the end state of the show: the curtains open, the ball golden and Pippy on top of it, the crowd in its seats, Barnaby in the front row */
  settleShow() {
    const e = this.els;
    e.efCurL.style.transform = CURTAIN_L; e.efCurR.style.transform = CURTAIN_R;
    this.show('efBall'); e.efBall.style.transform = BALL_HOME;
    this.show('efPippy'); e.efPippy.style.transform = ON_BALL;
    this.show('efBearShow'); this.show('efCrowd');
    this.feel('happy');
  },

  /* after Case 7.3: the curtains, the ball rolling in, three hops, a toot, confetti, applause and a very big bow */
  async caught(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els;
    this.reset(true); this.dressBear('efBearShowArt', SHOW_BEAR); f.open(false);
    if (REDUCED) {
      this.settleShow();
      f.caption('Pippy takes a very big bow.'); await f.wait(2600); await f.close(); return;
    }
    ElephantScore.start();
    // 1. the curtains are closed. a drum roll, and a fanfare
    f.anim(e.efStage, [{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 18000, easing: 'ease-in-out', fill: 'forwards' });
    f.caption('Ladies and gentlemen... the Greatest Little Show!');
    f.snd(() => ElephantScore.drumroll());
    await f.wait(1900);
    f.snd(() => ElephantScore.fanfare());
    f.flashScreen(0.2, 600, 0.2);
    await f.wait(1100);
    // 2. the curtains open on a crowd
    f.snd(() => ElephantScore.curtain());
    this.move(e.efCurL, [{ transform: 'none' }, { transform: CURTAIN_L }], { duration: 1900, easing: 'cubic-bezier(.5,0,.2,1)' });
    this.move(e.efCurR, [{ transform: 'none' }, { transform: CURTAIN_R }], { duration: 1900, easing: 'cubic-bezier(.5,0,.2,1)' });
    this.move(e.efCrowd, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: 500 });
    this.move(e.efBearShow, [{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, delay: 900, easing: EASE_OUT_BACK });
    await f.wait(2200);
    // 3. in he rolls
    f.caption('And here comes Pippy, on his golden star ball.');
    f.snd(() => ElephantScore.roll());
    this.show('efPippy'); this.feel('happy');
    this.move(e.efBall, [{ transform: BALL_AWAY, opacity: 1 }, { transform: BALL_HOME, opacity: 1 }], { duration: 2100, easing: 'cubic-bezier(.2,.7,.3,1)' });
    this.move(e.efPippy, [{ transform: 'translate(-250px,-68px)', opacity: 1 }, { transform: ON_BALL, opacity: 1 }], { duration: 2100, easing: 'cubic-bezier(.2,.7,.3,1)' });
    await f.wait(2400);
    // 4. one trick, two tricks, three!
    f.caption('One trick... two tricks... three!');
    for (let i = 0; i < 3; i++) {
      f.snd(() => ElephantScore.hop(i));
      const up = 76 + i * 16;
      this.move(e.efPippy, [{ transform: ON_BALL + ' scale(1.06,.92)' }, { transform: 'translate(0px,' + -(68 + up) + 'px) scale(.96,1.07)', offset: 0.5 }, { transform: ON_BALL }], { duration: 520, easing: 'ease-in-out' });
      f.anim(e.efBall, [{ transform: BALL_HOME }, { transform: 'translate(0px,' + -(up * 0.32) + 'px) rotate(' + (i % 2 ? -90 : 90) + 'deg)', offset: 0.5 }, { transform: 'translate(0px,0px) rotate(' + (i % 2 ? -180 : 180) + 'deg)' }], { duration: 520, easing: 'ease-in-out' });
      await f.wait(620);
    }
    f.snd(() => ElephantScore.spin());
    f.anim(e.efBall, [{ transform: BALL_HOME }, { transform: 'translate(0px,0px) rotate(720deg)' }], { duration: 1300, easing: 'cubic-bezier(.3,0,.3,1)' });
    this.sparks(200, 500, 12);
    await f.wait(1600);
    // 5. a toot, confetti and applause
    this.feel('proud');
    f.caption('Toot! Toot-toot-toot!');
    f.snd(() => { ElephantScore.toot(); ElephantScore.applause(); Haptics.win(); });
    f.flashScreen(0.25, 900, 0.2);
    this.confetti.forEach((c, i) => this.move(c, [{ transform: 'translate(0px,-30px) rotate(0deg)', opacity: 1 }, { transform: 'translate(' + Math.round((i % 7 - 3) * 14) + 'px,760px) rotate(' + (i % 2 ? 540 : -540) + 'deg)', opacity: 0 }],
      { duration: 2800 + (i % 9) * 260, delay: (i % 13) * 90, easing: 'cubic-bezier(.3,.2,.6,1)' }));
    this.crowd.forEach((c, i) => f.anim(c, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-7px)' }, { transform: 'translateY(0px)' }], { duration: 380, iterations: 7, delay: i * 45, easing: 'ease-in-out' }));
    f.anim(e.efBearShow, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0deg)' }], { duration: 600, iterations: 4 });
    await f.wait(3300);
    // 6. a very big bow
    this.feel('happy');
    f.snd(() => ElephantScore.bow());
    f.caption('Pippy takes a very big bow.');
    f.anim(e.efPippy, [{ transform: ON_BALL + ' rotate(0deg)' }, { transform: ON_BALL + ' rotate(22deg) translateY(4px)', offset: 0.4 }, { transform: ON_BALL + ' rotate(22deg) translateY(4px)', offset: 0.75 }, { transform: ON_BALL + ' rotate(0deg)' }], { duration: 2400, easing: 'ease-in-out' });
    await f.wait(2800);
    this.feel('wiggle');
    f.caption('Thank you, friends!');
    f.flashScreen(0.12, 900, 0.4);
    await f.wait(3200);
    if (f.fast) this.settleShow();
    ElephantScore.stop();
    await f.close();
  }
};

scenes.elephant = ElephantScene;   // levels reach these cinematics through core/scenes.ts
