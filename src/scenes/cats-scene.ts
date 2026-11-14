import { CatScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { bearMarkup } from '../characters/barnaby-svg.ts';
import { CAT_COATS, MICE, YARN, catInner, mouseInner, yarnBall } from '../characters/cats.ts';
import { mittensInner } from '../characters/mittens.ts';
import { $, svgEl } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import type { SceneDef } from '../core/scenes.ts';
import { REDUCED, late, mulberry32 } from '../core/util.ts';
import { Store } from '../state/store.ts';
import { Film } from './film.ts';

/* ---------- Chapter 11, the Whisker Isles: four cinematics on one stage ----------
   The arrival (opens Case 11.1)    a ship noses into a harbour of very sad cats; Queen Mittens waits on the quay
   The red thread (opens 11.2)      a long red thread winds through the town square, round the fountain and up the clock tower, into a giant tangle
   The footprints (opens 11.3)      night by the garden wall: tiny prints appear one by one and end at a mouse hole, where three pairs of eyes blink
   The yarn comes home (after 11.4) the palace garden at golden hour: balls of yarn roll in, the mice wear their scarves, the kittens pounce
   All four play on one 400 x 700 SVG stage (index.html #kfArt, built in ensure()); every number here is in those units. A mode class on the svg
   (m-harbor, m-town, m-wall, m-home) decides which backdrop pieces show. Every move is written as "the end state, plus an animation that leads
   to it" (move()), so a skipped or reduced-motion film simply shows the end states. Motion is transform and opacity only (the thread's draw-on
   is the one exception: a stroke-dashoffset on a single path). The playback mechanics are shared: see film.ts. */
type Mode = 'harbor' | 'town' | 'wall' | 'home';
const SKY: Record<Mode, string> = { harbor: 'sky-harbor', town: 'sky-town', wall: 'sky-wall', home: 'sky-home' };

/* critically damped for things that glide; a little overshoot only where something was thrown or pounced (the apple-design rule of thumb) */
const GLIDE = 'cubic-bezier(.22,1,.36,1)';
const SPRING = 'cubic-bezier(.3,1.35,.5,1)';
const TANGLE_AT = 232;                                               // the giant ball's centre x, by the fountain (Barnaby stands to its left)
const SHIP_DOCKED = 34;                                              // where the ship's top-left rests at the quay
const px = (x: number, y: number, extra = '') => 'translate(' + x + 'px,' + y + 'px)' + (extra ? ' ' + extra : '');
type Pos = [number, number];

/* where everybody stands, per scene: the top-left of each character's box (their feet are at its bottom) */
const SPOT = {
  bear:  { harbor: [150, 440], town: [50, 444], wall: [120, 442], home: [206, 436] } as Record<Mode, Pos>,
  queen: { harbor: [262, 424], town: [262, 424], wall: [262, 424], home: [134, 410] } as Record<Mode, Pos>
};

/* the cats, kittens and mice start each film where the markup puts them (a scene may move them; reset() puts them back) */
const HOME_AT: Record<string, Pos> = {
  kfC0: [44, 486], kfC1: [112, 508], kfC2: [284, 500], kfK0: [150, 564], kfK1: [240, 570], kfK2: [296, 562], kfM0: [40, 556], kfM1: [86, 566], kfM2: [132, 558]
};

/* the garden party after the last case: the cats on the left, the queen in front of the door, the mice in front of the bear, yarn along the bottom */
const HOME_SPOTS: Record<string, Pos> = { kfC0: [34, 458], kfC1: [86, 484], kfC2: [296, 494], kfM0: [150, 540], kfM1: [196, 548], kfM2: [242, 542], kfK0: [34, 562], kfK1: [262, 564], kfK2: [316, 560] };
const YARN_SPOTS: Pos[] = [[68, 600], [148, 608], [228, 602], [308, 610]];

function artMarkup(): string {
  const rng = mulberry32(11);
  let stars = '';
  for (let i = 0; i < 34; i++) stars += '<circle class="kf-twinkle" cx="' + (rng() * 400).toFixed(1) + '" cy="' + (rng() * 300).toFixed(1) + '" r="' + (0.7 + rng() * 1.3).toFixed(1) + '" fill="#fff6d0" style="animation-delay:-' + (rng() * 3).toFixed(2) + 's;opacity:' + (0.4 + (i % 3) * 0.25) + '"/>';
  const house = (x: number, y: number, w: number, h: number, wall: string, roof: string, lit: boolean) =>
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="' + wall + '"/>' +
    '<path d="M' + (x - 6) + ' ' + y + ' L' + (x + 3) + ' ' + Math.round(y - w * 0.45) + ' L' + Math.round(x + w / 2) + ' ' + Math.round(y - w * 0.12) + ' L' + (x + w - 3) + ' ' + Math.round(y - w * 0.45) + ' L' + (x + w + 6) + ' ' + y + 'Z" fill="' + roof + '"/>' +
    '<circle cx="' + (x + w / 2) + '" cy="' + Math.round(y + h * 0.4) + '" r="' + Math.round(w * 0.15) + '" fill="' + (lit ? '#ffe29a' : '#fff6e0') + '" stroke="#fff" stroke-width="2.5"/>' +
    '<rect x="' + (x + w / 2 - 6) + '" y="' + (y + h - 22) + '" width="12" height="22" rx="6" fill="#7a5a66"/>';
  const fish = (x: number, y: number, c: string, d: number) => '<g class="kf-bob" style="animation-delay:-' + d + 's"><circle cx="' + x + '" cy="' + y + '" r="30" fill="url(#kfLamp)"/><path d="M' + (x - 11) + ' ' + y + ' Q' + x + ' ' + (y - 11) + ' ' + (x + 9) + ' ' + y + ' Q' + x + ' ' + (y + 11) + ' ' + (x - 11) + ' ' + y + 'Z" fill="' + c + '"/><path d="M' + (x + 8) + ' ' + y + ' L' + (x + 18) + ' ' + (y - 7) + ' L' + (x + 18) + ' ' + (y + 7) + 'Z" fill="' + c + '"/><circle cx="' + (x - 5) + '" cy="' + (y - 2) + '" r="1.6" fill="#6a4a24"/></g>';
  let prints = '';
  for (let i = 0; i < 9; i++) {
    const x = 70 + i * 26, y = 556 - i * 3.5 + (i % 2 ? 7 : -3);
    prints += '<g class="kf-print" transform="translate(' + x + ' ' + y.toFixed(1) + ')"><ellipse cx="0" cy="0" rx="3.4" ry="4.6" fill="#3a2a3e" opacity=".55"/><circle cx="-4" cy="-6" r="1.5" fill="#3a2a3e" opacity=".55"/><circle cx="0" cy="-7.4" r="1.5" fill="#3a2a3e" opacity=".55"/><circle cx="4" cy="-6" r="1.5" fill="#3a2a3e" opacity=".55"/></g>';
  }
  const ball = (i: number) => '<g id="kfY' + i + 'Pos" transform="translate(-60 510)"><g id="kfY' + i + '" class="kf-hid"><g transform="scale(.7)">' + yarnBall(YARN[i][0], YARN[i][1]) + '</g></g></g>';
  const cat = (id: string, coat: string, x: number, y: number, s: number) => '<g id="' + id + 'Pos" transform="translate(' + x + ' ' + y + ')"><g id="' + id + '" class="kf-hid"><g transform="scale(' + s + ')"><g class="kf-cat">' + catInner(CAT_COATS[coat]) + '</g></g></g></g>';
  const mouse = (id: string, kind: string, x: number, y: number, s: number) => '<g id="' + id + 'Pos" transform="translate(' + x + ' ' + y + ')"><g id="' + id + '" class="kf-hid"><g transform="scale(' + s + ')"><g class="kf-cat">' + mouseInner(MICE[kind]) + '</g></g></g></g>';
  return '' +
    '<defs>' +
      '<radialGradient id="kfLamp"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset=".5" stop-color="#ffd27a" stop-opacity=".25"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="kfGlow"><stop offset="0" stop-color="#fff1b0" stop-opacity=".85"/><stop offset="1" stop-color="#fff1b0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="kfSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd8e0"/><stop offset="1" stop-color="#4aa8c4"/></linearGradient>' +
    '</defs>' +
    /* ---- the harbour at dusk ---- */
    '<g class="fm for-harbor"><g fill="#fff" opacity=".55"><ellipse cx="90" cy="150" rx="70" ry="16"/><ellipse cx="140" cy="138" rx="42" ry="13"/><ellipse cx="320" cy="210" rx="70" ry="14"/></g>' +
      '<circle cx="300" cy="330" r="110" fill="url(#kfGlow)" opacity=".8"/><circle cx="300" cy="332" r="34" fill="#fff4c4"/>' +
      '<rect x="-20" y="338" width="440" height="170" fill="url(#kfSea)"/><path d="M-20 338 H420" stroke="#fff" stroke-width="2" opacity=".5"/>' +
      '<g id="kfWave"><path d="M-20 420 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#fff" stroke-width="3" opacity=".5"/></g>' +
      '<path d="M0 392 Q70 352 150 380 T300 372 T430 396 V470 H0Z" fill="#cdb6ec"/>' +
      house(140, 394, 72, 66, '#fff0d8', '#e58fa6', true) + house(244, 380, 84, 80, '#e6f4ee', '#8fb8d8', true) + house(44, 404, 64, 56, '#ffe9e2', '#f2a07a', false) +
      '<path d="M20 372 Q150 408 280 372 T400 396" fill="none" stroke="#7a5a66" stroke-width="2.5"/>' + fish(90, 400, '#ffd27a', 0) + fish(190, 396, '#ffb0c4', 1.2) + fish(310, 384, '#ffd27a', 2.1) +
      '<path d="M-20 470 H420 V700 H-20Z" fill="#b98a5e"/><path d="M-20 470 H420" stroke="#8a6040" stroke-width="5"/>' +
      '<g stroke="#8a6040" stroke-width="2" opacity=".6"><path d="M0 520 H400"/><path d="M0 580 H400"/><path d="M0 640 H400"/><path d="M60 470 V700 M150 470 V700 M240 470 V700 M330 470 V700"/></g>' +
      '<g transform="translate(230 566)"><path d="M-26 0 L-20 -26 L20 -26 L26 0Z" fill="#c9a06a"/><path d="M-22 -26 Q0 -34 22 -26" fill="none" stroke="#8a6040" stroke-width="3"/></g></g>' +
    /* ---- the town square, by day ---- */
    '<g class="fm for-town"><g fill="#fff" opacity=".7"><ellipse cx="80" cy="130" rx="64" ry="15"/><ellipse cx="320" cy="180" rx="70" ry="14"/></g>' +
      '<path d="M-20 380 Q100 340 220 372 T420 366 V520 H-20Z" fill="#cdb6ec"/>' +
      house(40, 392, 70, 76, '#fff0d8', '#e58fa6', true) + house(122, 410, 62, 58, '#e6f4ee', '#8fb8d8', false) + house(206, 402, 64, 66, '#ffe9e2', '#f2a07a', true) +
      '<rect x="296" y="270" width="52" height="198" rx="4" fill="#fff6e8"/><path d="M290 270 L302 232 L322 252 L342 232 L354 270Z" fill="#8fb8d8"/>' +
      '<circle cx="322" cy="308" r="19" fill="#fff" stroke="#7a5a66" stroke-width="3"/><path d="M322 308 V296 M322 308 L331 312" stroke="#7a5a66" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M-20 466 H420 V700 H-20Z" fill="#e8d9ee"/>' +
      '<g fill="none" stroke="#c9b8d8" stroke-width="2"><path d="M0 500 H400 M0 540 H400 M0 590 H400 M0 650 H400"/><path d="M50 466 V700 M130 466 V700 M210 466 V700 M290 466 V700 M370 466 V700"/></g>' +
      '<ellipse cx="190" cy="500" rx="62" ry="16" fill="#9ccfe0"/><ellipse cx="190" cy="494" rx="62" ry="16" fill="#b8e0f0" stroke="#fff" stroke-width="4"/><rect x="184" y="452" width="12" height="42" fill="#fff"/>' +
      '<g class="kf-bob"><path d="M190 450 Q168 432 160 446 M190 450 Q212 432 220 446" fill="none" stroke="#9ccfe0" stroke-width="4" stroke-linecap="round"/></g></g>' +
    /* ---- night by the garden wall ---- */
    '<g class="fm for-wall"><g>' + stars + '</g><circle cx="320" cy="120" r="70" fill="url(#kfGlow)" opacity=".5"/><circle cx="320" cy="120" r="26" fill="#fff4d0"/>' +
      '<path d="M-20 400 Q120 372 240 392 T420 384 V560 H-20Z" fill="#2c3a5c"/>' +
      '<rect x="-20" y="410" width="440" height="140" fill="#9a6a5a"/><g stroke="#7a4e42" stroke-width="2" opacity=".7"><path d="M-20 440 H420 M-20 470 H420 M-20 500 H420 M-20 530 H420"/><path d="M30 410 V440 M110 440 V470 M60 470 V500 M180 410 V440 M260 440 V470 M330 470 V500 M220 500 V530 M390 410 V440"/></g>' +
      '<rect x="-20" y="402" width="440" height="12" fill="#b88072"/>' +
      '<path d="M268 548 V510 Q268 486 292 486 Q316 486 316 510 V548Z" fill="#1a1220"/><path d="M-20 548 H420 V700 H-20Z" fill="#35604a"/><path d="M-20 560 Q100 548 220 558 T420 552 V700 H-20Z" fill="#2c5640"/>' +
      '<g fill="#244a38"><ellipse cx="30" cy="560" rx="30" ry="14"/><ellipse cx="386" cy="566" rx="34" ry="16"/></g></g>' +
    /* ---- the palace garden at golden hour ---- */
    '<g class="fm for-home"><circle cx="70" cy="330" r="130" fill="url(#kfGlow)" opacity=".7"/><circle cx="70" cy="332" r="38" fill="#fff4c4"/>' +
      '<g fill="#fff" opacity=".55"><ellipse cx="300" cy="150" rx="70" ry="15"/><ellipse cx="350" cy="138" rx="40" ry="12"/></g>' +
      '<path d="M-20 410 Q120 380 240 404 T420 396 V500 H-20Z" fill="#cdb6ec"/>' +
      '<rect x="110" y="300" width="180" height="170" fill="#ffe3ec"/><path d="M104 300 L130 250 L154 280 L200 232 L246 280 L270 250 L296 300Z" fill="#e58fa6"/>' +
      '<rect x="80" y="338" width="40" height="132" fill="#fff0d8"/><path d="M74 338 L84 306 L100 322 L116 306 L126 338Z" fill="#8fb8d8"/><rect x="280" y="338" width="40" height="132" fill="#fff0d8"/><path d="M274 338 L284 306 L300 322 L316 306 L326 338Z" fill="#8fb8d8"/>' +
      '<path d="M176 470 V412 Q176 386 200 386 Q224 386 224 412 V470Z" fill="#7a5a66"/><circle cx="148" cy="372" r="12" fill="#ffe29a"/><circle cx="252" cy="372" r="12" fill="#ffe29a"/>' +
      '<path d="M-20 470 H420 V700 H-20Z" fill="#a8dcb8"/><path d="M-20 520 Q100 500 220 514 T420 506 V700 H-20Z" fill="#8fd0a6"/>' +
      '<g fill="#6fbf8a"><ellipse cx="40" cy="480" rx="56" ry="22"/><ellipse cx="370" cy="484" rx="60" ry="24"/></g>' +
      '<g fill="#ffb0c4"><circle cx="20" cy="470" r="5"/><circle cx="54" cy="478" r="5"/><circle cx="352" cy="474" r="5"/><circle cx="388" cy="480" r="5"/></g></g>' +
    /* ---- the red thread and the giant tangle (the town) ---- */
    '<g class="fm for-town"><path id="kfThread" d="M-20 600 C60 560 110 640 170 590 S250 520 206 482 S120 470 150 520 S260 580 300 520 S340 470 352 392 S330 330 352 320 S330 300 356 300" pathLength="1" fill="none" stroke="#e8527a" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>' +
      '<g id="kfTangle" class="kf-hid"><g transform="scale(1.7)">' + yarnBall('#e8527a', '#a82a52') + '</g></g></g>' +
    /* ---- the footprints, the hole and its watchers (the wall) ---- */
    '<g class="fm for-wall"><g id="kfPrints">' + prints + '</g>' +
      '<g id="kfEyes" class="kf-hid"><circle cx="292" cy="520" r="16" fill="url(#kfGlow)"/><circle cx="284" cy="518" r="3.2" fill="#fff4c4"/><circle cx="300" cy="518" r="3.2" fill="#fff4c4"/></g></g>' +
    /* ---- everybody (feet down; the Pos groups are moved by place(), the inner groups by move()) ---- */
    '<g id="kfShipPos" transform="translate(-170 330)"><g id="kfShip" class="kf-hid fm for-harbor"><g class="kf-bob"><path d="M10 120 L150 120 L132 148 L28 148Z" fill="#5a4a6a"/><rect x="76" y="48" width="6" height="72" fill="#7a5a66"/><path d="M82 52 L136 112 L82 112Z" fill="#fff6e8"/><path d="M76 52 L76 36 L98 44Z" fill="#e8527a"/>' +
      '<path d="M10 120 L150 120" stroke="#8a7a9a" stroke-width="4"/></g></g></g>' +
    cat('kfC0', 'ginger', ...HOME_AT.kfC0, 0.62) + cat('kfC1', 'grey', ...HOME_AT.kfC1, 0.6) + cat('kfC2', 'cream', ...HOME_AT.kfC2, 0.58) +
    cat('kfK0', 'ginger', ...HOME_AT.kfK0, 0.42) + cat('kfK1', 'night', ...HOME_AT.kfK1, 0.38) + cat('kfK2', 'cream', ...HOME_AT.kfK2, 0.4) +
    mouse('kfM0', 'grey', ...HOME_AT.kfM0, 0.46) + mouse('kfM1', 'brown', ...HOME_AT.kfM1, 0.42) + mouse('kfM2', 'dusk', ...HOME_AT.kfM2, 0.44) +
    '<g id="kfQPos" transform="translate(296 456)"><g id="kfQ" class="kf-hid"><g transform="scale(.58)"><g class="kf-cat">' + mittensInner() + '</g></g></g></g>' +
    '<g id="kfBPos" transform="translate(150 466)"><g id="kfB" class="kf-hid"><g id="kfBArt"></g></g></g>' +
    ball(0) + ball(1) + ball(2) + ball(3) +
    '<g id="kfPuffs"></g>';
}

export const CatsScene = {
  els: {} as Record<string, HTMLElement>, film: late<Film>(),

  init() {
    const e = this.els;
    ['catsFilm', 'kfStage', 'kfArt', 'kfDim', 'kfBlack', 'kfCap', 'kfTitle', 'kfTitleSmall', 'kfTitleMain', 'kfTitleSub', 'kfFlash', 'kfSkip'].forEach(id => { e[id] = $('#' + id); });
    this.film = new Film({ root: e.catsFilm, skip: e.kfSkip, cap: e.kfCap, flash: e.kfFlash });
  },

  /* the stage is built the first time a cinematic plays, so players who never reach chapter 11 never pay for it */
  built: false,
  ensure() {
    if (this.built) return;
    this.built = true;
    const e = this.els;
    e.kfArt.innerHTML = artMarkup();
    ['kfWave', 'kfShipPos', 'kfShip', 'kfThread', 'kfTangle', 'kfPrints', 'kfEyes', 'kfBPos', 'kfB', 'kfBArt', 'kfQPos', 'kfQ', 'kfPuffs',
      ...[0, 1, 2].flatMap(i => ['kfC' + i + 'Pos', 'kfC' + i, 'kfK' + i + 'Pos', 'kfK' + i, 'kfM' + i + 'Pos', 'kfM' + i]),
      ...[0, 1, 2, 3].flatMap(i => ['kfY' + i + 'Pos', 'kfY' + i])].forEach(id => { e[id] = $('#' + id); });
  },

  /* ----- small helpers ----- */
  /* put an element in its end state (the last keyframe), and play the way there unless the film is skipped or motion is reduced */
  move(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    const last = frames[frames.length - 1], s = (el as HTMLElement | SVGElement).style;
    if (typeof last.transform === 'string') s.transform = last.transform;
    if (last.opacity !== undefined && last.opacity !== null) s.opacity = String(last.opacity);
    return this.film.anim(el, frames, { fill: 'backwards', ...opts });
  },
  show(id: string, on = true) { this.els[id].style.opacity = on ? '1' : '0'; },
  place(id: string, at: Pos) { this.els[id].style.transform = px(at[0], at[1]); },
  title(small: string, main: string, sub: string) { const e = this.els; e.kfTitleSmall.textContent = small; e.kfTitleMain.textContent = main; e.kfTitleSub.textContent = sub; e.kfTitle.classList.add('on'); },

  /* Barnaby, in whatever the player dressed him in */
  dressBear() {
    const art = this.els.kfBArt, markup = bearMarkup(Store.data.wardrobe.equipped);
    art.innerHTML = markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6);
    const bear = art.firstElementChild;
    if (!bear) return;
    bear.removeAttribute('class'); bear.removeAttribute('role'); bear.removeAttribute('aria-label');
    for (const [k, v] of Object.entries({ x: 0, y: 0, width: 104, height: 120 })) bear.setAttribute(k, String(v));
  },

  /* a puff of dust, or a few hearts-and-sparkles in `color`, at (x, y) */
  puff(x: number, y: number, n = 6, color = '#fff1d6') {
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (0.1 + 0.8 * (k / Math.max(1, n - 1))), d = 18 + (k % 3) * 9;
      const c = svgEl('circle', { cx: x, cy: y, r: 3.5 + (k % 3) * 1.6, fill: color });
      c.style.transformBox = 'fill-box';
      this.els.kfPuffs.appendChild(c);
      const anim = this.film.anim(c, [{ transform: 'translate(0,0) scale(.5)', opacity: 0.95 }, { transform: 'translate(' + Math.round(Math.cos(a) * d * 1.4) + 'px,' + Math.round(-Math.sin(a) * d * 1.2) + 'px) scale(1.5)', opacity: 0 }],
        { duration: 700 + k * 40, easing: 'ease-out', fill: 'forwards' });
      if (anim) anim.onfinish = () => c.remove(); else c.remove();
    }
  },

  /* a clean stage in a mode */
  reset(mode: Mode) {
    this.ensure();
    const e = this.els;
    this.film.clearAnimations();
    e.kfArt.setAttribute('class', 'kf-art m-' + mode);
    e.kfStage.className = 'kf-stage ' + SKY[mode];
    ['kfStage', 'kfArt', 'kfShip', 'kfBlack', 'kfDim', 'kfB', 'kfQ', 'kfTangle', 'kfPrints', 'kfEyes',
      ...[0, 1, 2].flatMap(i => ['kfC' + i, 'kfK' + i, 'kfM' + i]), ...[0, 1, 2, 3].map(i => 'kfY' + i)]
      .forEach(id => { e[id].style.transform = ''; e[id].style.opacity = ''; });
    const thread = e.kfThread as unknown as SVGElement;
    thread.style.strokeDashoffset = '1';
    e.kfPuffs.textContent = '';
    this.place('kfBPos', SPOT.bear[mode]); this.place('kfQPos', SPOT.queen[mode]);
    this.place('kfShipPos', [-170, 330]);
    Object.entries(HOME_AT).forEach(([id, at]) => this.place(id + 'Pos', at));
    [0, 1, 2, 3].forEach(i => this.place('kfY' + i + 'Pos', [-60, 510]));
    e.kfTitle.classList.remove('on');
    this.film.caption('');
  },

  /* ============================================ 1. THE ARRIVAL (opens Case 11.1) ============================================ */
  settleHarbor() {
    this.reset('harbor');
    ['kfB', 'kfQ', 'kfC0', 'kfC1'].forEach(id => this.show(id));
    this.show('kfShip'); this.place('kfShipPos', [SHIP_DOCKED, 330]);
  },

  async harbor(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.harbor;
    this.reset('harbor'); this.dressBear(); f.open(first);
    if (REDUCED) {
      this.settleHarbor(); this.title('CHAPTER 11', 'WHISKER ISLES', 'a land of cats, and no yarn'); await f.wait(2800); await f.close();
    } else {
      CatScore.start();
      // 1. a harbour of very sad cats
      f.caption('At the far end of the map, a harbour full of very sad cats.');
      f.snd(() => CatScore.lap());
      f.anim(e.kfStage, [{ transform: 'scale(1.18) translate(0,3%)' }, { transform: 'scale(1)' }], { duration: 12000, easing: GLIDE, fill: 'backwards' });
      f.anim(e.kfWave, [{ transform: 'translateX(0)' }, { transform: 'translateX(-20px)' }], { duration: 2800, iterations: 8, direction: 'alternate', easing: 'ease-in-out' });
      ['kfC0', 'kfC1'].forEach((id, i) => this.move(e[id], [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 900, delay: i * 350, easing: GLIDE }));
      await f.wait(2400);
      f.snd(() => CatScore.meow());
      await f.wait(1400);
      // 2. a ship comes in
      f.caption('Then a ship came in, with a bear, a notebook and a letter in a bottle.');
      this.show('kfShip'); f.snd(() => CatScore.horn());
      this.move(e.kfShipPos, [{ transform: px(-170, 330) }, { transform: px(SHIP_DOCKED, 330) }], { duration: 5200, easing: GLIDE });
      ['kfC0', 'kfC1'].forEach((id, i) => f.anim(e[id], [{ transform: 'translateY(0)' }, { transform: 'translateY(-12px)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: 560, delay: 2600 + i * 180, easing: SPRING }));
      f.snd(() => CatScore.mew());
      await f.wait(4600);
      // 3. Barnaby steps ashore
      this.show('kfB');
      this.place('kfBPos', [80, 330]);
      this.move(e.kfBPos, [{ transform: px(80, 330) }, { transform: px(...SPOT.bear.harbor) }], { duration: 2600, easing: GLIDE });
      f.snd(() => CatScore.steps(4));
      f.caption('Barnaby stepped ashore, and every ear turned his way.');
      await f.wait(3000);
      // 4. Queen Mittens
      this.move(e.kfQ, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1000, easing: GLIDE });
      f.snd(() => CatScore.purr());
      f.caption('Queen Mittens waited at the end of the quay. Her ball of yarn was gone, and so was everybody else\'s.');
      await f.wait(3800);
      // 5. the title card
      f.caption('');
      this.title('CHAPTER 11', 'WHISKER ISLES', 'a land of cats, and no yarn');
      f.snd(() => { CatScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleHarbor();
      CatScore.stop();
      await f.close();
    }
    Store.data.seen.harbor = true; Store.save();
  },

  /* ============================================ 2. THE RED THREAD (opens Case 11.2) ============================================ */
  settleYarn() {
    this.reset('town');
    ['kfB', 'kfK0', 'kfK1', 'kfTangle'].forEach(id => this.show(id));
    (this.els.kfThread as unknown as SVGElement).style.strokeDashoffset = '0';
    this.place('kfBPos', SPOT.bear.town);
    this.els.kfTangle.style.transform = px(TANGLE_AT, 480);
  },

  async yarn(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.yarn;
    this.reset('town'); this.dressBear(); f.open(first);
    const thread = e.kfThread as unknown as SVGElement;               // only exists once reset() has built the stage
    if (REDUCED) {
      this.settleYarn(); this.title('CASE 11.2', 'THE GREAT TANGLE', 'a very long thread'); await f.wait(2800); await f.close();
    } else {
      CatScore.start();
      this.show('kfB');
      this.place('kfBPos', [-60, 444]);
      // 1. a thread across the square
      f.caption('In the town square, a long red thread led everywhere.');
      f.anim(e.kfStage, [{ transform: 'scale(1.2) translate(4%,0)' }, { transform: 'scale(1)' }], { duration: 12000, easing: GLIDE, fill: 'backwards' });
      f.snd(() => CatScore.twang());
      thread.style.strokeDashoffset = '0';
      f.anim(thread, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 5200, easing: 'ease-in-out', fill: 'backwards' });
      this.move(e.kfBPos, [{ transform: px(-60, 444) }, { transform: px(30, 444) }], { duration: 3200, easing: GLIDE });
      f.snd(() => CatScore.steps(6));
      await f.wait(3600);
      // 2. the kittens look on
      f.caption('It went under the arch, round the fountain, and up and down the clock tower.');
      this.move(e.kfK0, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 800, easing: GLIDE });
      this.move(e.kfK1, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 800, delay: 260, easing: GLIDE });
      f.snd(() => CatScore.mew());
      this.move(e.kfBPos, [{ transform: px(30, 444) }, { transform: px(...SPOT.bear.town) }], { duration: 3000, easing: GLIDE });
      f.anim(e.kfStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.14) translate(-4%,0)' }], { duration: 4600, easing: 'ease-in-out', fill: 'forwards' });
      await f.wait(4400);
      // 3. the tangle
      f.caption('And in the middle, a tangle the size of a house.');
      this.place('kfBPos', SPOT.bear.town);
      this.show('kfTangle'); this.els.kfTangle.style.transform = px(TANGLE_AT, 480);
      f.snd(() => CatScore.boing());
      f.anim(e.kfTangle, [{ transform: px(TANGLE_AT, 480, 'scale(.2)'), opacity: 0 }, { transform: px(TANGLE_AT, 480, 'scale(1.1)'), opacity: 1, offset: 0.6 }, { transform: px(TANGLE_AT, 480, 'scale(1)'), opacity: 1 }], { duration: 900, easing: SPRING, fill: 'backwards' });
      this.puff(TANGLE_AT, 500, 8, '#ffb0c4');
      await f.wait(2600);
      f.caption('A ball that big does not roll away by itself.');
      await f.wait(2800);
      // 4. the title card
      f.caption('');
      this.title('CASE 11.2', 'THE GREAT TANGLE', 'a very long thread');
      f.snd(() => { CatScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleYarn();
      CatScore.stop();
      await f.close();
    }
    Store.data.seen.yarn = true; Store.save();
  },

  /* ============================================ 3. THE FOOTPRINTS (opens Case 11.3) ============================================ */
  settleMice() {
    this.reset('wall');
    ['kfB', 'kfPrints', 'kfEyes', 'kfM0', 'kfM1', 'kfM2'].forEach(id => this.show(id));
    this.place('kfBPos', SPOT.bear.wall);
    this.place('kfM0Pos', [232, 484]); this.place('kfM1Pos', [272, 492]); this.place('kfM2Pos', [312, 486]);
  },

  async mice(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.mice;
    this.reset('wall'); this.dressBear(); f.open(first);
    if (REDUCED) {
      this.settleMice(); this.title('CASE 11.3', 'TINY FOOTPRINTS', 'a very small thief'); await f.wait(2800); await f.close();
    } else {
      CatScore.start();
      this.place('kfM0Pos', [232, 484]); this.place('kfM1Pos', [272, 492]); this.place('kfM2Pos', [312, 486]);
      // 1. night, and a garden wall
      this.show('kfB');
      f.caption('Night fell over the garden wall.');
      f.anim(e.kfStage, [{ transform: 'scale(1.18) translate(-3%,0)' }, { transform: 'scale(1)' }], { duration: 12000, easing: GLIDE, fill: 'backwards' });
      this.move(e.kfBPos, [{ transform: px(-80, 442) }, { transform: px(34, 442) }], { duration: 2800, easing: GLIDE });
      f.snd(() => CatScore.steps(5));
      await f.wait(3000);
      // 2. tiny footprints appear, one by one
      f.caption('Barnaby crouched down. Tiny footprints, no bigger than buttons.');
      this.show('kfPrints');
      Array.from(e.kfPrints.children).forEach((p, i) => { f.anim(p, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: i * 340, easing: 'ease-out', fill: 'backwards' }); });
      f.snd(() => CatScore.scurry(10));
      this.move(e.kfBPos, [{ transform: px(34, 442) }, { transform: px(...SPOT.bear.wall) }], { duration: 3200, easing: GLIDE, delay: 200 });
      f.anim(e.kfStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.2) translate(-6%,-2%)' }], { duration: 3800, easing: 'ease-in-out', fill: 'forwards' });
      await f.wait(3800);
      // 3. the hole, and eyes in the dark
      f.caption('They stopped at a hole in the wall, and the hole blinked back.');
      this.move(e.kfEyes, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
      f.snd(() => CatScore.squeak());
      await f.wait(2800);
      // 4. the mice peek out, in scarves
      f.caption('Three very small mice, in three very warm scarves.');
      [0, 1, 2].forEach(i => {
        this.move(e['kfM' + i], [{ opacity: 0, transform: 'translateY(22px) scale(.7)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 700, delay: i * 320, easing: SPRING });
        f.snd(() => CatScore.squeak());
      });
      await f.wait(3400);
      // 5. the title card
      f.caption('');
      this.title('CASE 11.3', 'TINY FOOTPRINTS', 'a very small thief');
      f.snd(() => { CatScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleMice();
      CatScore.stop();
      await f.close();
    }
    Store.data.seen.mice = true; Store.save();
  },

  /* ============================================ 4. THE YARN COMES HOME (after Case 11.4) ============================================ */
  settleHome() {
    this.reset('home');
    ['kfB', 'kfQ', 'kfC0', 'kfC1', 'kfC2', 'kfK0', 'kfK1', 'kfK2', 'kfM0', 'kfM1', 'kfM2', 'kfY0', 'kfY1', 'kfY2', 'kfY3'].forEach(id => this.show(id));
    Object.entries(HOME_SPOTS).forEach(([id, at]) => this.place(id + 'Pos', at));
    YARN_SPOTS.forEach(([x, y], i) => this.place('kfY' + i + 'Pos', [x, y]));
  },

  async home(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els;
    this.reset('home'); this.dressBear(); f.open(false);
    this.settleHome();
    ['kfB', 'kfQ', 'kfC0', 'kfC1', 'kfC2', 'kfK0', 'kfK1', 'kfK2', 'kfM0', 'kfM1', 'kfM2', 'kfY0', 'kfY1', 'kfY2', 'kfY3'].forEach(id => this.show(id, false));
    if (REDUCED) {
      this.settleHome(); f.caption('Scarves for the mice, and balls of yarn for the cats.'); await f.wait(2800); await f.close(); return;
    }
    CatScore.start();
    // 1. the garden, and a royal welcome
    f.caption('In the palace garden, at golden hour, everybody waited.');
    f.anim(e.kfStage, [{ transform: 'scale(1.18) translateY(3%)' }, { transform: 'scale(1)' }], { duration: 12000, easing: GLIDE, fill: 'backwards' });
    f.snd(() => CatScore.purr());
    this.move(e.kfB, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 800, easing: GLIDE });
    [0, 1, 2].forEach(i => {
      this.move(e['kfC' + i], [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 800, delay: i * 240, easing: GLIDE });
      this.move(e['kfM' + i], [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 800, delay: 500 + i * 240, easing: GLIDE });
    });
    await f.wait(3000);
    // 2. the yarn rolls in
    f.caption('Then the balls of yarn came rolling home, one by one.');
    YARN_SPOTS.forEach(([x, y], i) => {
      this.move(e['kfY' + i + 'Pos'], [{ transform: px(-60, y) }, { transform: px(x, y) }], { duration: 2200, delay: i * 450, easing: GLIDE });
      this.move(e['kfY' + i], [{ opacity: 1, transform: 'rotate(0deg)' }, { opacity: 1, transform: 'rotate(' + (540 + i * 90) + 'deg)' }], { duration: 2200, delay: i * 450, easing: GLIDE });
    });
    f.snd(() => CatScore.roll());
    await f.wait(3800);
    // 3. the kittens pounce
    f.caption('POUNCE! The kittens remembered how to play.');
    [0, 1, 2].forEach(i => {
      this.move(e['kfK' + i], [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 400, easing: GLIDE });
      f.anim(e['kfK' + i], [{ transform: 'translateY(0)' }, { transform: 'translateY(-34px) rotate(-8deg)', offset: 0.45 }, { transform: 'translateY(0)' }, { transform: 'translateY(-16px)', offset: 0.78 }, { transform: 'translateY(0)' }], { duration: 1100, delay: 400 + i * 260, easing: SPRING, iterations: 2 });
    });
    f.snd(() => { CatScore.pounce(); Haptics.win(); });
    f.flashScreen(0.18, 900, 0.3);
    this.puff(196, 600, 8, '#ffb0c4'); this.puff(296, 600, 8, '#ffd27a');
    f.snd(() => CatScore.mew());
    await f.wait(3400);
    // 4. the queen, and the deal
    this.move(e.kfQ, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 900, easing: GLIDE });
    f.caption('Scarves for the mice, and balls of yarn for the cats. Everybody shares.');
    f.snd(() => CatScore.hero());
    f.anim(e.kfStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.1) translate(-2%,0)' }], { duration: 8000, easing: 'ease-in-out', fill: 'forwards' });
    await f.wait(3600);
    f.caption('Thank you, Barnaby!');
    await f.wait(3000);
    if (f.fast) this.settleHome();
    CatScore.stop();
    await f.close();
  }
};

const none = async () => { /* this cinematic has no "case closed" part */ };
const wrap = (intro: () => Promise<void>, caught: () => Promise<void> = none): SceneDef => ({ intro, caught });

/* levels reach these cinematics through core/scenes.ts: scenes.harbor opens 11.1 and its caught() is the yarn coming home after 11.4 */
scenes.harbor = wrap(() => CatsScene.harbor(), () => CatsScene.home());
scenes.yarn = wrap(() => CatsScene.yarn());
scenes.mice = wrap(() => CatsScene.mice());
