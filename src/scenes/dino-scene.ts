import { DinoScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { bearMarkup } from '../characters/barnaby-svg.ts';
import { HERD, boingBall, dinoInner } from '../characters/dino.ts';
import { $ } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, late, mulberry32 } from '../core/util.ts';
import { Store } from '../state/store.ts';
import { Film } from './film.ts';

/* ---------- Rexy and the meteor: the afternoon a rock fell out of the sky (Case 8.1) and the stomp-launch that smashed it (after Case 8.3) ----------
   Both scenes play on one SVG stage (index.html #dfArt, a 400 x 700 canvas; every number here is in those units). The stage is a small world
   seen through a CAMERA: four layers (sky, far, mid, world) that cam() pans and zooms by their own depth, so a scene can cut to a close-up,
   tilt up to the sky or follow the ball. The letterbox bars cover the top and bottom 11%, so the middle of the picture is (200, 420).

   The intro: the herd plays piggy-in-the-middle, and Rexy (the smallest, with the shortest arms) never once catches the ball. A shadow falls,
   the camera tilts up to a meteor, the herd panics, Rexy roars at it (the meteor does not notice), and a bear with a magnifying glass walks in.
   The finale is the plan: the drum beats, the herd stomps three times, Trixie leaps onto the Great Spring Plank, the Boing Ball flies up... not
   quite far enough, so Rexy (on top of Dilly's head) bats it with her tail. It hits, the meteor cracks, cracks, and bursts into stars. One last
   little star drifts down, and Rexy catches it: her very first catch.

   Every move is written as "the end state, plus an animation that leads to it" (move()), so a skipped or reduced-motion film simply
   shows the end states. Skippable (the Skip button appears after 1.5 s the first time). The playback mechanics are shared: see film.ts. */
const SVG_NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;

interface Cam { x: number; y: number; z: number }
const MID = { x: 200, y: 420 };                                   // the middle of the visible picture
const WIDE: Cam = { x: 200, y: 420, z: 1 };
const LAYERS: [string, number][] = [['dfSky', 0.2], ['dfFar', 0.45], ['dfMid', 0.75], ['dfWorld', 1]];   // how far each layer follows the camera
const EASE = 'cubic-bezier(.45,.05,.25,1)';
const OUT_QUAD = 'cubic-bezier(.5,1,.89,1)', IN_QUAD = 'cubic-bezier(.11,0,.5,0)';    // the two halves of a thrown thing's arc

type Name = 'Dilly' | 'Penny' | 'Stella' | 'Rexy' | 'Trixie';
type Spot = [x: number, y: number, flip: number];                 // where the feet stand, and the facing (-1 = left)
const NAMES: Name[] = ['Dilly', 'Penny', 'Stella', 'Rexy', 'Trixie'];           // also the drawing order, back to front
const SIZE: Record<Name, number> = { Dilly: 0.72, Penny: 0.5, Stella: 0.5, Rexy: 0.42, Trixie: 0.56 };
const EMOS = ['look', 'scared', 'surprised', 'sad', 'proud', 'wiggle'];

/* the intro: piggy in the middle. Trixie and Stella head the ball to each other over Rexy */
const INTRO_AT: Record<Name, Spot> = { Dilly: [84, 576, 1], Penny: [152, 548, 1], Stella: [312, 584, -1], Rexy: [212, 618, 1], Trixie: [112, 626, 1] };
const HEAD_T = [140, 525], HEAD_S = [290, 498];                   // where the ball meets Trixie's and Stella's heads
const REXY_FRONT: Spot = [180, 622, 1];                           // Rexy steps up to roar
const INTRO_BEAR = [262, 626];
const MET_FAR = [322, 200, 0.3], MET_NEAR = [266, 224, 1.15];

/* the finale: Stella and the drum on the left, Dilly in the middle with Rexy on her head, the plank in front */
const SHOW_AT: Record<Name, Spot> = { Dilly: [250, 580, -1], Penny: [330, 548, -1], Stella: [120, 552, 1], Rexy: [214, 439, 1], Trixie: [470, 612, -1] };
const SHOW_BEAR = [326, 618];
const PLANK = [140, 628];
const PLANK_READY = 'rotate(-14deg)', PLANK_SNAP = 'rotate(14deg)';         // ready: the left end is down, with the ball on it
const BALL_REST = [66, 619];                                      // on the low end of the plank
const BALL_APEX = [128, 236], BALL_BAT = [182, 414], BALL_HIT = [239, 279], BALL_HOME = [165, 606];
const TRIXIE_RUN: Spot = [330, 612, -1], TRIXIE_LAND: Spot = [214, 607, -1], TRIXIE_DOWN = 36;
const MET_SHOW = [262, 226, 1.5];
const STAR_FROM = [236, 250], STAR_HANDS = [238, 421];
const COLORS = ['#ff6f91', '#ffd24a', '#6fd3c8', '#9a8cf0', '#ff9f5a', '#8ee07a'];
const STAR = 'M0 -9 L2.6 -2.6 L9 0 L2.6 2.6 L0 9 L-2.6 2.6 L-9 0 L-2.6 -2.6Z';

const r1 = (n: number) => Math.round(n * 10) / 10;
const svgEl = (tag: string, attrs: Record<string, string | number>): SVGElement => {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};
const at = (x: number, y: number) => 'translate(' + r1(x) + 'px,' + r1(y) + 'px)';
const tr = (n: Name, [x, y, flip]: Spot) => at(x, y) + ' scale(' + flip * SIZE[n] + ',' + SIZE[n] + ')';
const camT = (c: Cam, d: number) => {
  const s = 1 + (c.z - 1) * d;
  return at(MID.x, MID.y) + ' scale(' + Math.round(s * 1000) / 1000 + ') ' + at(-(MID.x + (c.x - MID.x) * d), -(MID.y + (c.y - MID.y) * d));
};

/* ----- the painted world ----- */
function palm(x: number, y: number, h: number, lean: number): string {
  const tx = x + lean, ty = y - h;
  let out = '<path d="M' + x + ' ' + y + ' Q' + (x + lean * 0.3) + ' ' + (y - h * 0.55) + ' ' + tx + ' ' + ty + '" fill="none" stroke="#a9805a" stroke-width="9" stroke-linecap="round"/>';
  [-158, -118, -76, -34, 8, 196].forEach((deg, i) => {
    const a = deg * Math.PI / 180, ex = tx + Math.cos(a) * 46, ey = ty + Math.sin(a) * 40 + 20, cx = tx + Math.cos(a) * 30, cy = ty + Math.sin(a) * 30 - 16;
    out += '<path d="M' + tx + ' ' + ty + ' Q' + r1(cx) + ' ' + r1(cy) + ' ' + r1(ex) + ' ' + r1(ey) + '" fill="none" stroke="' + (i % 2 ? '#3f9a58' : '#57b36a') + '" stroke-width="8" stroke-linecap="round"/>';
  });
  return out + '<circle cx="' + (tx - 4) + '" cy="' + (ty + 6) + '" r="5" fill="#8a6a4a"/><circle cx="' + (tx + 5) + '" cy="' + (ty + 8) + '" r="5" fill="#7a5a3c"/>';
}
const fern = (x: number, y: number, s: number) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="none" stroke="#4fae60" stroke-width="5" stroke-linecap="round">' +
  '<path d="M0 0 Q-4 -22 -22 -30"/><path d="M0 0 Q0 -26 2 -40"/><path d="M0 0 Q6 -22 24 -28"/><path d="M0 0 Q-10 -10 -30 -10"/><path d="M0 0 Q10 -10 30 -8"/></g>';
const flower = (x: number, y: number, c: string) => '<path d="M' + x + ' ' + y + ' v-11" stroke="#4fae60" stroke-width="2.4" stroke-linecap="round"/><circle cx="' + x + '" cy="' + (y - 13) + '" r="5" fill="' + c + '"/><circle cx="' + x + '" cy="' + (y - 13) + '" r="2" fill="#fff6c8"/>';
const cloud = (x: number, y: number, s: number, i: number) => '<g class="df-cloud" style="animation-delay:-' + i * 7 + 's"><g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#fff" opacity=".92">' +
  '<ellipse cx="0" cy="0" rx="46" ry="15"/><ellipse cx="24" cy="-10" rx="30" ry="14"/><ellipse cx="-20" cy="-7" rx="22" ry="11"/></g></g>';

function meteorArt(): string {
  let embers = '';
  for (let i = 0; i < 7; i++) embers += '<circle class="df-ember" style="animation-delay:-' + r1(i * 0.17) + 's" cx="' + (10 + (i % 3) * 9) + '" cy="' + (-18 - (i % 4) * 7) + '" r="' + (2 + (i % 3)) + '" fill="' + (i % 2 ? '#ffe08a' : '#ff9a3c') + '"/>';
  return '<circle r="66" fill="url(#dfFire)"/>' +
    '<path class="df-flame" d="M-12 -24 Q60 -92 152 -170 Q86 -60 26 14Z" fill="#ff8a3c"/>' +
    '<path class="df-flame f2" d="M-8 -18 Q46 -66 114 -124 Q66 -44 20 8Z" fill="#ffb347"/>' +
    '<path class="df-flame f3" d="M-2 -12 Q32 -46 78 -84 Q48 -30 14 4Z" fill="#ffe08a"/>' + embers +
    '<circle r="30" fill="url(#dfRock)"/><path d="M-30 0 A30 30 0 0 0 0 30" fill="none" stroke="#ffd24a" stroke-width="5" stroke-linecap="round" opacity=".85"/>' +
    '<circle cx="-9" cy="-8" r="7" fill="#5f4234" opacity=".8"/><circle cx="11" cy="9" r="6" fill="#5f4234" opacity=".8"/><circle cx="8" cy="-13" r="4" fill="#5f4234" opacity=".8"/><circle cx="-12" cy="12" r="3" fill="#5f4234" opacity=".8"/>' +
    ['M-6 -28 L2 -12 L-8 0 L4 14 L-2 28', 'M2 -12 L18 -6 L27 8', 'M-8 0 L-21 7 L-26 16 M4 14 L16 22'].map((d, i) =>
      '<g class="df-hid" id="dfCrack' + i + '" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '" stroke="#ff9a3c" stroke-width="7" opacity=".6"/><path d="' + d + '" stroke="#fff6c8" stroke-width="2.6"/></g>').join('');
}

function worldArt(): string {
  const dino = (n: Name) => '<g id="dfP_' + n + '"><g class="df-fig df-idle" id="dfF_' + n + '"><g transform="translate(-100 -208)">' + dinoInner(HERD[n].kind, HERD[n].pal) + '</g></g></g>';
  const big = 'x="-700" y="-900" width="1800" height="2400"';
  return '<defs>' +
      '<linearGradient id="dfSkyG" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="620"><stop offset="0" stop-color="#4fb0ec"/><stop offset=".55" stop-color="#a8e0f6"/><stop offset=".88" stop-color="#fdf0c8"/><stop offset="1" stop-color="#ffe0a8"/></linearGradient>' +
      '<linearGradient id="dfDangerG" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="620"><stop offset="0" stop-color="#4a1436"/><stop offset=".5" stop-color="#c2443c"/><stop offset="1" stop-color="#ffab4a"/></linearGradient>' +
      '<radialGradient id="dfSunG"><stop offset="0" stop-color="#fff6c0" stop-opacity=".95"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dfFire"><stop offset="0" stop-color="#ffe08a" stop-opacity=".95"/><stop offset=".55" stop-color="#ff9a3c" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a2c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dfRock" cx=".36" cy=".34" r=".75"><stop offset="0" stop-color="#b08a70"/><stop offset="1" stop-color="#6d4b3c"/></radialGradient>' +
      '<radialGradient id="dfStarG"><stop offset="0" stop-color="#fff6c0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd24a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="dfPlankG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6f91"/><stop offset=".33" stop-color="#ffd24a"/><stop offset=".66" stop-color="#6fd3c8"/><stop offset="1" stop-color="#9a8cf0"/></linearGradient>' +
    '</defs>' +
    /* sky */
    '<g id="dfSky"><rect ' + big + ' fill="url(#dfSkyG)"/><rect class="df-hid" id="dfDanger" ' + big + ' fill="url(#dfDangerG)"/>' +
      '<circle cx="72" cy="208" r="88" fill="url(#dfSunG)"/><circle cx="72" cy="208" r="31" fill="#ffe27a"/><g class="df-hid" id="dfStars"></g></g>' +
    /* far: mountains, a sleepy volcano, clouds */
    '<g id="dfFar">' + cloud(292, 300, 1, 0) + cloud(120, 352, 0.8, 1) + cloud(-60, 270, 0.9, 2) + cloud(470, 380, 0.7, 3) +
      '<path d="M-300 560 L-190 462 L-120 520 L-30 438 L40 506 L96 470 L170 548 L700 560 V1200 H-300Z" fill="#b8c9ea"/>' +
      '<path d="M-30 438 L-8 458 L-22 462 L-40 452Z M-190 462 L-172 480 L-186 484 L-204 476Z" fill="#fff" opacity=".8"/>' +
      '<circle class="df-smoke" cx="300" cy="398" r="9" fill="#fff" opacity=".75"/><circle class="df-smoke s2" cx="306" cy="398" r="7" fill="#fff" opacity=".7"/>' +
      '<path d="M226 552 L284 420 Q300 410 316 420 L380 552Z" fill="#a99bd0"/><path d="M284 420 Q300 410 316 420 L311 434 L303 425 L296 437 L289 428Z" fill="#ff9a5a"/>' +
      '<path d="M-300 552 Q-100 506 60 536 T420 524 T700 544 V1200 H-300Z" fill="#b9e3a8"/></g>' +
    /* mid: a hill, palms and giant ferns */
    '<g id="dfMid"><path d="M-300 574 Q-120 524 60 550 T380 538 T700 554 V1200 H-300Z" fill="#9ddc8f"/>' +
      palm(26, 556, 112, 16) + palm(378, 546, 128, -20) + palm(-90, 560, 100, 10) + palm(500, 552, 110, 14) + fern(64, 552, 0.9) + fern(338, 544, 1) + fern(176, 548, 0.7) + '</g>' +
    /* world: the meadow and everything that happens on it */
    '<g id="dfWorld">' +
      '<g id="dfMetP"><g class="df-hid" id="dfMet">' + meteorArt() + '</g></g>' +
      '<path d="M-300 568 Q-140 542 40 558 T360 554 T700 562 V1200 H-300Z" fill="#7ccb78"/>' +
      '<path d="M-300 664 Q0 640 200 654 T700 652 V1200 H-300Z" fill="#62b96a"/>' +
      [[46, 600, 0], [150, 668, 1], [304, 660, 2], [372, 604, 3], [236, 668, 4], [92, 672, 5], [396, 668, 0], [18, 660, 2]].map(([x, y, c]) => flower(x, y, COLORS[c])).join('') +
      '<g fill="#4fae60" opacity=".7">' + [[60, 650], [200, 676], [330, 640], [276, 600], [128, 592], [384, 650]].map(([x, y]) => '<path d="M' + x + ' ' + y + ' q-4 -18 -12 -22 q10 4 12 14 q2 -14 12 -20 q-8 8 -12 28Z"/>').join('') + '</g>' +
      '<ellipse class="df-hid" id="dfShade" cx="205" cy="606" rx="200" ry="50" fill="#16321f"/>' +
      '<g class="df-hid" id="dfProps"><g transform="translate(62 566)"><g class="df-fig" id="dfDrum"><ellipse cx="0" cy="0" rx="27" ry="7" fill="#7a4a2c"/><rect x="-27" y="-32" width="54" height="32" fill="#c9764a"/>' +
        '<path d="M-27 -30 L-18 -4 L-9 -30 L0 -4 L9 -30 L18 -4 L27 -30" fill="none" stroke="#ffd24a" stroke-width="3" stroke-linejoin="round"/><ellipse cx="0" cy="-32" rx="27" ry="8" fill="#fff0d0" stroke="#7a4a2c" stroke-width="3"/></g></g></g>' +
      NAMES.slice(0, 4).map(dino).join('') +
      '<g class="df-hid" id="dfPlankP"><g transform="translate(' + PLANK[0] + ' ' + PLANK[1] + ')"><path d="M-22 24 Q-18 0 0 -4 Q18 0 22 24Z" fill="#9a8f86"/><path d="M-10 6 Q-4 0 4 2" fill="none" stroke="#c9c0b6" stroke-width="3" stroke-linecap="round"/>' +
        '<g class="df-plank" id="dfPlank"><rect x="-80" y="-11" width="160" height="12" rx="5" fill="url(#dfPlankG)"/><rect x="-80" y="-11" width="160" height="4" rx="2" fill="#fff" opacity=".4"/></g></g></g>' +
      '<g id="dfBearP"><g class="df-fig df-hid" id="dfBear"><g id="dfBearArt"></g></g></g>' +
      dino('Trixie') +
      '<g id="dfBallX"><g id="dfBallY"><g class="df-ball df-hid" id="dfBall"><path class="df-hid" id="dfStreak" d="M0 -16 L-14 150 L0 120 L14 150Z" fill="#fff6c8" opacity=".8"/>' + boingBall(0, 0, 21) + '</g></g></g>' +
      '<g id="dfStarX"><g id="dfStarY"><g class="df-ball df-hid" id="dfStar"><circle r="26" fill="url(#dfStarG)"/><path class="df-tw" d="' + STAR + '" fill="#ffd24a" stroke="#fff6c8" stroke-width="1.5" transform="scale(1.5)"/></g></g></g>' +
      '<g id="dfShower"></g><g id="dfFx"></g></g>' +
    '<rect class="df-hid" id="dfTint" ' + big + ' fill="#ff5a3c"/>';
}

export const DinoScene = {
  els: {} as Record<string, HTMLElement>, film: late<Film>(),
  figs: {} as Record<Name, HTMLElement>, spots: {} as Record<Name, HTMLElement>, where: {} as Record<Name, Spot>,
  shower: [] as SVGElement[], camNow: WIDE, ball: [0, 0], run: 0,

  init() {
    const e = this.els;
    ['dinoFilm', 'dfStage', 'dfArt', 'dfCap', 'dfTitle', 'dfFlash', 'dfSkip'].forEach(id => { e[id] = $('#' + id); });
    e.dfArt.innerHTML = worldArt();
    ['dfSky', 'dfFar', 'dfMid', 'dfWorld', 'dfDanger', 'dfStars', 'dfTint', 'dfShade', 'dfMetP', 'dfMet', 'dfCrack0', 'dfCrack1', 'dfCrack2', 'dfProps', 'dfDrum', 'dfPlankP', 'dfPlank',
      'dfBearP', 'dfBear', 'dfBearArt', 'dfBallX', 'dfBallY', 'dfBall', 'dfStreak', 'dfStarX', 'dfStarY', 'dfStar', 'dfShower', 'dfFx'].forEach(id => { e[id] = $('#' + id); });
    NAMES.forEach(n => { this.figs[n] = $('#dfF_' + n); this.spots[n] = $('#dfP_' + n); });
    const rng = mulberry32(83);
    // the new stars the meteor leaves in the sky, and the shower that falls on the meadow
    for (let i = 0; i < 34; i++) {
      const s = svgEl('g', { transform: 'translate(' + r1(-40 + rng() * 480) + ' ' + r1(130 + rng() * 300) + ') scale(' + r1(0.35 + rng() * 0.6) + ')' });
      s.appendChild(svgEl('path', { class: 'df-tw', style: 'animation-delay:-' + r1(rng() * 2) + 's', d: STAR, fill: i % 4 ? '#fff6c8' : COLORS[i % COLORS.length] }));
      e.dfStars.appendChild(s);
    }
    for (let i = 0; i < 40; i++) {
      const s = svgEl('path', { class: 'df-spark', d: STAR, fill: i % 3 ? '#ffd24a' : COLORS[i % COLORS.length], style: 'opacity:0' });
      e.dfShower.appendChild(s); this.shower.push(s);
    }
    this.film = new Film({ root: e.dinoFilm, skip: e.dfSkip, cap: e.dfCap, flash: e.dfFlash });
  },

  /* ----- the basics ----- */
  /* put an element in its end state (the last keyframe), and play the way there unless the film is skipped or motion is reduced */
  move(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    const last = frames[frames.length - 1], s = (el as HTMLElement | SVGElement).style;
    if (typeof last.transform === 'string') s.transform = last.transform;
    if (last.opacity !== undefined && last.opacity !== null) s.opacity = String(last.opacity);
    return this.film.anim(el, frames, { fill: 'backwards', ...opts });
  },
  show(id: string, on: boolean | number = true) { this.els[id].style.opacity = on === true ? '1' : on === false ? '0' : String(on); },
  fade(id: string, from: number, to: number, ms: number, delay = 0) { this.move(this.els[id], [{ opacity: from }, { opacity: to }], { duration: ms, delay }); },
  /* something for later in the same shot (dropped when the film is skipped or has moved on to another run) */
  later(ms: number, fn: () => void) { const run = this.run; setTimeout(() => { if (run === this.run && this.film.running && !this.film.fast) fn(); }, ms); },
  /* a one-off effect: added to the stage, animated, removed */
  fx(el: SVGElement, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    if (this.film.fast || REDUCED) return;
    this.els.dfFx.appendChild(el);
    el.animate(frames, { fill: 'both', ...opts }).onfinish = () => el.remove();
  },

  /* the camera: look at (x, y) with zoom z, at once or gliding there */
  cam(to: Cam, ms = 0, easing = EASE) {
    this.camNow = to;
    LAYERS.forEach(([id, d]) => {
      const el = this.els[id], next = camT(to, d), from = ms > 0 ? getComputedStyle(el).transform : '';
      el.style.transform = next;
      if (ms > 0) this.film.anim(el, [{ transform: from && from !== 'none' ? from : next }, { transform: next }], { duration: ms, easing });
    });
  },
  /* the ground shakes: a quick judder of the whole stage */
  shake(px = 5, ms = 260) {
    this.film.anim(this.els.dfStage, [{ transform: 'translate(0,0)' }, { transform: at(px, -px) }, { transform: at(-px, px * 0.6) }, { transform: at(px * 0.5, 0) }, { transform: 'translate(0,0)' }], { duration: ms, easing: 'ease-out' });
  },

  /* ----- the cast ----- */
  place(n: Name, s: Spot) { this.where[n] = s; this.spots[n].style.transform = tr(n, s); },
  go(n: Name, to: Spot, ms: number, easing = 'ease-in-out') { const from = this.where[n]; this.where[n] = to; this.move(this.spots[n], [{ transform: tr(n, from) }, { transform: tr(n, to) }], { duration: ms, easing }); },
  feel(emotion: string, who: Name[] = NAMES) { who.forEach(n => { const c = this.figs[n].classList; EMOS.forEach(x => c.remove('b-' + x)); if (emotion !== 'happy') c.add('b-' + emotion); }); },
  still(on: boolean, who: Name[] = NAMES) { who.forEach(n => this.figs[n].classList.toggle('df-idle', !on)); },
  hopEl(el: Element, h: number, ms: number) {
    this.film.anim(el, [{ transform: 'translateY(0) scale(1.05,.94)' }, { transform: 'translateY(' + -h + 'px) scale(.97,1.04)', offset: 0.45 }, { transform: 'translateY(0) scale(1.06,.93)', offset: 0.9 }, { transform: 'translateY(0) scale(1,1)' }], { duration: ms, easing: 'ease-out' });
  },
  hop(n: Name, h = 16, ms = 380) { this.hopEl(this.figs[n], h, ms); },
  squash(el: Element, ms = 320) { this.film.anim(el, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.16,.8)', offset: 0.3 }, { transform: 'scale(.96,1.05)', offset: 0.7 }, { transform: 'scale(1,1)' }], { duration: ms, easing: 'ease-out' }); },
  tail(n: Name) { return this.figs[n].querySelector<SVGElement>('.dn-tail'); },

  /* Barnaby, in whatever the player dressed him in */
  dressBear(w: number, h: number) {
    const art = this.els.dfBearArt, markup = bearMarkup(Store.data.wardrobe.equipped);
    art.innerHTML = markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6);
    const bear = art.firstElementChild;
    if (!bear) return;
    bear.removeAttribute('class'); bear.removeAttribute('role'); bear.removeAttribute('aria-label');    // the stage is decorative, and .bear-svg sizes itself for HTML
    for (const [k, v] of Object.entries({ x: -w / 2, y: -h, width: w, height: h })) bear.setAttribute(k, String(v));
  },

  /* ----- the ball, the meteor and the effects ----- */
  ballAt(x: number, y: number) { this.ball = [x, y]; this.els.dfBallX.style.transform = 'translateX(' + x + 'px)'; this.els.dfBallY.style.transform = 'translateY(' + y + 'px)'; },
  /* fly the ball to (x, y): straight sideways, eased up or down, so two of these make a thrown arc */
  fly(x: number, y: number, ms: number, easeY: string, spin = 360) {
    const [x0, y0] = this.ball, f = this.film, e = this.els;
    this.ballAt(x, y);
    f.anim(e.dfBallX, [{ transform: 'translateX(' + x0 + 'px)' }, { transform: 'translateX(' + x + 'px)' }], { duration: ms, easing: 'linear', fill: 'backwards' });
    f.anim(e.dfBallY, [{ transform: 'translateY(' + y0 + 'px)' }, { transform: 'translateY(' + y + 'px)' }], { duration: ms, easing: easeY, fill: 'backwards' });
    f.anim(e.dfBall, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + spin + 'deg)' }], { duration: ms, easing: 'linear' });
  },
  /* a whole arc in one go: up to the apex, down to (x, y) */
  toss(x: number, y: number, apex: number, ms: number, spin = 360) {
    const [x0, y0] = this.ball, f = this.film, e = this.els;
    const up = Math.sqrt(Math.max(1, y0 - apex)), down = Math.sqrt(Math.max(1, y - apex)), t = up / (up + down);
    this.ballAt(x, y);
    f.anim(e.dfBallX, [{ transform: 'translateX(' + x0 + 'px)' }, { transform: 'translateX(' + x + 'px)' }], { duration: ms, easing: 'linear', fill: 'backwards' });
    f.anim(e.dfBallY, [{ transform: 'translateY(' + y0 + 'px)', easing: OUT_QUAD }, { transform: 'translateY(' + apex + 'px)', offset: t, easing: IN_QUAD }, { transform: 'translateY(' + y + 'px)' }], { duration: ms, fill: 'backwards' });
    f.anim(e.dfBall, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + spin + 'deg)' }], { duration: ms, easing: 'linear' });
  },
  metT: ([x, y, s]: number[]) => at(x, y) + ' scale(' + s + ')',
  wobble(px: number, ms = 280) { this.film.anim(this.els.dfMet, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + px + 'px)' }, { transform: 'translateX(' + -px * 0.6 + 'px)' }, { transform: 'translateX(0)' }], { duration: ms }); },

  /* a comic-book word that pops up over the action */
  word(text: string, x: number, y: number, size: number, fill: string, rot = 0) {
    const g = svgEl('g', { style: 'transform:' + at(x, y) + ' rotate(' + rot + 'deg)' }), t = svgEl('text', { class: 'df-word', 'text-anchor': 'middle', 'font-size': size, fill });
    t.textContent = text; g.appendChild(t);
    if (this.film.fast || REDUCED) return;
    this.els.dfFx.appendChild(g);
    t.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.3)', opacity: 1, offset: 0.2 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.04)', opacity: 1, offset: 0.8 }, { transform: 'scale(1.3)', opacity: 0 }],
      { duration: 950, easing: 'ease-out', fill: 'both' }).onfinish = () => g.remove();
  },
  /* puffs of dust where something heavy lands */
  dust(x: number, y: number, n = 5) {
    for (let k = 0; k < n; k++) {
      const dx = (k - (n - 1) / 2) * 13;
      this.fx(svgEl('circle', { class: 'df-spark', r: 6, fill: '#f1e6c8' }), [{ transform: at(x + dx * 0.3, y) + ' scale(.4)', opacity: 0.85 }, { transform: at(x + dx, y - 10 - (k % 2) * 7) + ' scale(1.9)', opacity: 0 }], { duration: 520 + k * 40, easing: 'ease-out' });
    }
  },
  /* a burst of stars flying out from (x, y) and drifting down */
  burst(x: number, y: number, n: number, reach = 70) {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + (k % 3) * 0.2, d = reach + (k % 4) * reach * 0.5;
      this.fx(svgEl('path', { class: 'df-spark', d: STAR, fill: k % 2 ? '#fff6c8' : COLORS[k % COLORS.length] }),
        [{ transform: at(x, y) + ' scale(.4) rotate(0deg)', opacity: 1 }, { transform: at(x + Math.cos(a) * d, y + Math.sin(a) * d + reach * 0.3) + ' scale(1.5) rotate(180deg)', opacity: 1, offset: 0.6 },
          { transform: at(x + Math.cos(a) * d * 1.15, y + Math.sin(a) * d + reach * 1.2) + ' scale(.8) rotate(300deg)', opacity: 0 }], { duration: 1100 + reach * 6 + k * 25, easing: 'ease-out' });
    }
  },
  /* a ring racing outwards */
  ring(x: number, y: number, to: number, ms: number, delay = 0) {
    this.fx(svgEl('circle', { class: 'df-spark', r: 30, fill: 'none', stroke: '#fff6c8', 'stroke-width': 6 }), [{ transform: at(x, y) + ' scale(.2)', opacity: 1 }, { transform: at(x, y) + ' scale(' + to + ')', opacity: 0 }], { duration: ms, delay, easing: 'ease-out' });
  },
  /* shooting stars streaking away from (x, y) */
  streaks(x: number, y: number, n: number) {
    for (let k = 0; k < n; k++) {
      const deg = (k / n) * 360 + 14, g = svgEl('g', {});
      g.appendChild(svgEl('path', { d: 'M0 0 L-46 0', stroke: '#fff6c8', 'stroke-width': 3.4, 'stroke-linecap': 'round', opacity: 0.8 }));
      g.appendChild(svgEl('path', { d: STAR, fill: k % 2 ? '#ffd24a' : '#fff6c8', transform: 'scale(.8)' }));
      this.fx(g, [{ transform: at(x, y) + ' rotate(' + deg + 'deg) translateX(24px)', opacity: 1 }, { transform: at(x, y) + ' rotate(' + deg + 'deg) translateX(' + (240 + (k % 3) * 60) + 'px)', opacity: 0 }], { duration: 900 + (k % 4) * 140, delay: 80, easing: 'cubic-bezier(.1,.6,.3,1)' });
    }
  },
  /* the lines of a roar, flying from a mouth */
  roarLines(x: number, y: number, deg: number, n: number, size: number) {
    for (let k = 0; k < n; k++) {
      this.fx(svgEl('path', { d: 'M0 -12 Q10 0 0 12', fill: 'none', stroke: '#fff', 'stroke-width': 3.6, 'stroke-linecap': 'round' }),
        [{ transform: at(x, y) + ' rotate(' + deg + 'deg) translateX(4px) scale(.5)', opacity: 0.95 }, { transform: at(x, y) + ' rotate(' + deg + 'deg) translateX(' + 56 * size + 'px) scale(' + 1.7 * size + ')', opacity: 0 }], { duration: 720, delay: k * 150, easing: 'ease-out' });
    }
  },
  /* the star shower after the boom: little stars drifting down over the whole meadow */
  starShower() {
    this.shower.forEach((s, i) => {
      const x = -20 + ((i * 53) % 440), y0 = 110 + (i % 7) * 26, sc = 0.5 + (i % 4) * 0.2;
      this.move(s, [{ transform: at(x, y0) + ' scale(' + sc + ') rotate(0deg)', opacity: 0 }, { transform: at(x - 6, y0 + 40) + ' scale(' + sc + ') rotate(60deg)', opacity: 1, offset: 0.12 },
        { transform: at(x + ((i % 5) - 2) * 16, 560 + (i % 6) * 18) + ' scale(' + sc + ') rotate(' + (i % 2 ? 420 : -420) + 'deg)', opacity: 0 }], { duration: 3400 + (i % 9) * 420, delay: 500 + (i % 13) * 190, easing: 'cubic-bezier(.3,.3,.6,1)' });
    });
  },

  /* a clean stage for one of the two scenes */
  reset(show: boolean) {
    const e = this.els;
    this.run++;
    this.film.clearAnimations();
    ['dfStage', 'dfDanger', 'dfStars', 'dfTint', 'dfShade', 'dfMet', 'dfCrack0', 'dfCrack1', 'dfCrack2', 'dfDrum', 'dfBear', 'dfBall', 'dfStreak', 'dfStar'].forEach(id => { e[id].style.transform = ''; e[id].style.opacity = ''; });
    NAMES.forEach(n => { this.figs[n].style.transform = ''; this.figs[n].style.opacity = ''; this.place(n, (show ? SHOW_AT : INTRO_AT)[n]); const t = this.tail(n); if (t) t.style.transform = ''; });
    this.still(false); this.feel('happy');
    this.show('dfProps', show); this.show('dfPlankP', show); e.dfPlank.style.transform = PLANK_READY;
    this.show('dfBall'); this.ballAt(show ? BALL_REST[0] : HEAD_T[0], show ? BALL_REST[1] : HEAD_T[1]);
    e.dfMetP.style.transform = this.metT(show ? MET_SHOW : MET_FAR);
    const [bx, by] = show ? SHOW_BEAR : [470, INTRO_BEAR[1]];
    e.dfBearP.style.transform = at(bx, by); this.show('dfBear', show);
    e.dfStarX.style.transform = 'translateX(' + STAR_FROM[0] + 'px)'; e.dfStarY.style.transform = 'translateY(' + STAR_FROM[1] + 'px)';
    this.shower.forEach(s => { s.style.transform = ''; s.style.opacity = '0'; });
    e.dfFx.textContent = '';
    e.dfTitle.classList.remove('on');
    this.film.caption('');
    this.cam(WIDE);
  },

  /* ---------- Case 8.1: the meteor appears ---------- */
  /* the end state of the intro: the meteor close and glowing, the sky red, the herd staring up, Rexy out in front and Barnaby beside her */
  settleIntro() {
    const e = this.els;
    this.cam(WIDE);
    this.show('dfMet'); e.dfMetP.style.transform = this.metT(MET_NEAR); this.show('dfDanger', 0.75); this.show('dfTint', 0.14); this.show('dfShade', 0.28);
    this.show('dfBall', false);
    this.still(true); this.feel('look'); this.place('Rexy', REXY_FRONT); this.place('Stella', [334, 572, -1]);
    this.show('dfBear'); e.dfBearP.style.transform = at(INTRO_BEAR[0], INTRO_BEAR[1]);
  },

  /* Trixie and Stella head the ball to each other, and Rexy jumps for it in the middle (and misses) */
  pass(to: 'S' | 'T', ms = 1000) {
    const [x, y] = to === 'S' ? HEAD_S : HEAD_T, from: Name = to === 'S' ? 'Trixie' : 'Stella', dest: Name = to === 'S' ? 'Stella' : 'Trixie';
    this.hop(from, 14, 300);
    this.film.snd(() => DinoScore.bop(to === 'S' ? 0 : 1));
    this.toss(x, y, 418, ms, to === 'S' ? 300 : -300);
    this.later(ms * 0.22, () => this.hop('Rexy', 50, 640));
    this.later(ms - 140, () => this.hop(dest, 9, 260));
  },

  async intro(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.dino;
    this.reset(false); this.dressBear(84, 96); f.open(first);
    if (REDUCED) {
      this.settleIntro(); e.dfTitle.classList.add('on');
      await f.wait(2600); await f.close();
    } else {
      DinoScore.start();
      // 1. down from the sun to the meadow: a game of piggy in the middle
      this.cam({ x: 150, y: 290, z: 1.35 }); this.cam(WIDE, 3600);
      f.snd(() => DinoScore.sunny());
      f.caption('Far beyond the big top lies a meadow where the ferns grow as tall as trees.');
      await f.wait(1900);
      this.pass('S'); await f.wait(1150);
      this.pass('T'); await f.wait(1300);
      f.caption('Here, the dinosaurs play all day long.');
      f.snd(() => DinoScore.roar());
      this.hop('Penny', 20, 460); this.later(300, () => this.hop('Dilly', 12, 460));
      this.cam({ x: 208, y: 505, z: 1.28 }, 2400);
      this.pass('S'); await f.wait(1150);
      this.pass('T'); await f.wait(1400);
      // 2. a close-up: Rexy has never caught the ball. This time it lands on her head
      this.cam({ x: 208, y: 556, z: 1.9 }, 700);
      f.caption('Rexy is the smallest. She has never caught the ball. Not once.');
      await f.wait(1500);
      this.hop('Trixie', 14, 300); f.snd(() => DinoScore.bop(0));
      this.feel('proud', ['Rexy']);
      this.toss(222, 527, 440, 820, 240);
      await f.wait(820);
      f.snd(() => DinoScore.bonk());
      this.word('BONK!', 252, 500, 17, '#ffd24a', 8);
      this.squash(this.figs.Rexy, 420); this.feel('sad', ['Rexy']);
      this.toss(470, 612, 468, 1100, 500);
      await f.wait(2300);
      // 3. a shadow falls, and everybody looks up
      this.show('dfBall', false);
      this.cam(WIDE, 1100);
      f.caption('Then a shadow falls over the meadow.');
      f.snd(() => DinoScore.warning());
      this.fade('dfShade', 0, 0.28, 1900); this.fade('dfTint', 0, 0.07, 1900);
      await f.wait(1300);
      this.still(true);
      NAMES.forEach((n, i) => this.later(i * 130, () => this.feel('look', [n])));
      await f.wait(1500);
      // 4. tilt up: a star is falling. A big one
      this.show('dfMet');
      this.cam({ x: 296, y: 214, z: 2.3 }, 1300);
      f.caption('High above, a star is falling. A big one. A very, very big one.');
      f.snd(() => DinoScore.rumble(3.6));
      this.move(e.dfMetP, [{ transform: this.metT(MET_FAR) }, { transform: this.metT(MET_NEAR) }], { duration: 3700, easing: 'cubic-bezier(.6,0,.8,.6)', delay: 500 });
      this.fade('dfDanger', 0, 0.75, 3700, 500); this.fade('dfTint', 0.07, 0.14, 3700, 500);
      await f.wait(4300);
      // 5. panic in the meadow
      this.cam(WIDE, 650);
      this.shake(6, 320);
      f.snd(() => { DinoScore.gasp(); DinoScore.rumble(2.8); Haptics.buzz([20, 40, 30]); });
      f.caption('A meteor! And it is heading straight for the meadow!');
      this.feel('scared'); this.feel('sad', ['Dilly']);
      this.move(this.spots.Penny, [{ transform: tr('Penny', [152, 548, 1]) }, { transform: tr('Penny', [290, 556, 1]), offset: 0.3 }, { transform: tr('Penny', [290, 556, -1]), offset: 0.34 },
        { transform: tr('Penny', [150, 556, -1]), offset: 0.66 }, { transform: tr('Penny', [150, 556, 1]), offset: 0.7 }, { transform: tr('Penny', [250, 552, 1]), offset: 0.9 }, { transform: tr('Penny', [250, 552, -1]), offset: 0.93 }, { transform: tr('Penny', INTRO_AT.Penny) }], { duration: 2800, easing: 'linear' });
      this.go('Stella', [334, 572, -1], 700);
      [0, 520, 1040, 1560].forEach(t => this.later(t, () => this.hop('Trixie', 18, 420)));
      await f.wait(3300);
      // 6. Rexy roars at it
      this.cam({ x: 205, y: 560, z: 1.85 }, 800);
      this.feel('look', ['Rexy']); this.go('Rexy', REXY_FRONT, 700);
      [0, 240, 480].forEach(t => this.later(t, () => this.hop('Rexy', 7, 220)));
      await f.wait(1000);
      f.caption('Rexy roars at it as loudly as she can.');
      f.snd(() => DinoScore.roar());
      this.squash(this.figs.Rexy, 500);
      this.roarLines(204, 574, -52, 3, 0.8); this.word('roar!', 246, 520, 15, '#ffffff', -10);
      await f.wait(2300);
      f.caption('The meteor does not seem to notice.');
      this.feel('sad', ['Rexy']);
      await f.wait(2200);
      // 7. a bear with a magnifying glass
      f.caption('Just then, a bear with a magnifying glass walks into the meadow.');
      this.cam({ x: 226, y: 548, z: 1.5 }, 1300);
      this.show('dfBear');
      this.move(e.dfBearP, [{ transform: at(470, INTRO_BEAR[1]) }, { transform: at(INTRO_BEAR[0], INTRO_BEAR[1]) }], { duration: 2000, easing: 'cubic-bezier(.3,.6,.4,1)' });
      f.anim(e.dfBear, [{ transform: 'translateY(0) rotate(-2deg)' }, { transform: 'translateY(-6px) rotate(2deg)' }], { duration: 250, iterations: 8, direction: 'alternate', easing: 'ease-in-out' });
      await f.wait(2100);
      f.snd(() => DinoScore.arrive());
      this.feel('surprised'); this.feel('surprised', ['Rexy']);
      await f.wait(900);
      f.caption('"A falling rock? Hmm. I have a plan. But we will need three things."');
      this.hopEl(e.dfBear, 10, 360); this.feel('proud', ['Rexy']);
      await f.wait(3300);
      // 8. the title card
      f.caption('');
      this.cam(WIDE, 1500);
      this.feel('look');
      e.dfTitle.classList.add('on');
      f.snd(() => { DinoScore.title(); Haptics.win(); });
      await f.wait(3300);
      if (f.fast) this.settleIntro();
      DinoScore.stop();                                        // the pad fades (at once if the film was skipped)
      await f.close();
    }
    Store.data.seen.dino = true; Store.save();
  },

  /* ---------- after Case 8.3: the stomp-launch ---------- */
  /* the end state of the finale: a clear sky full of new stars, the plank sprung, the ball home, and Rexy with her star */
  settleShow() {
    const e = this.els;
    this.cam(WIDE);
    this.show('dfMet', false); this.show('dfDanger', false); this.show('dfTint', false); this.show('dfShade', false); this.show('dfStars');
    e.dfPlank.style.transform = PLANK_SNAP;
    this.show('dfBall'); this.show('dfStreak', false); this.ballAt(BALL_HOME[0], BALL_HOME[1]);
    this.place('Trixie', [TRIXIE_LAND[0], TRIXIE_LAND[1] + TRIXIE_DOWN, -1]);
    this.still(false); this.feel('happy'); this.feel('proud', ['Rexy']);
    this.show('dfStar'); e.dfStarX.style.transform = 'translateX(' + STAR_HANDS[0] + 'px)'; e.dfStarY.style.transform = 'translateY(' + STAR_HANDS[1] + 'px)';
  },

  /* one stomp: the drum, the jump, the landing */
  stomp(i: number) {
    const f = this.film, e = this.els, tail = this.tail('Stella'), who: Name[] = ['Stella', 'Penny', 'Dilly', 'Rexy'];
    if (tail) f.anim(tail, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(34deg)', offset: 0.35 }, { transform: 'rotate(-12deg)', offset: 0.6 }, { transform: 'rotate(0deg)' }], { duration: 420 });
    who.forEach(n => this.hop(n, n === 'Dilly' ? 9 + i * 3 : 16 + i * 6, 340));
    this.hopEl(e.dfBear, 14 + i * 5, 340);
    this.later(250, () => {
      f.snd(() => { DinoScore.stomp(i); DinoScore.drum(i); Haptics.buzz([14 + i * 10]); });
      this.shake(3 + i * 3.5, 300);
      this.squash(e.dfDrum, 280);
      [[120, 552], [330, 548], [250, 580], [326, 618]].forEach(([x, y]) => this.dust(x, y, 3 + i));
      this.word('STOMP!', [108, 300, 196][i], [470, 462, 500][i], 19 + i * 9, COLORS[i], [-8, 7, -4][i]);
      this.wobble(4 + i * 3);
      f.anim(e.dfPlank, [{ transform: PLANK_READY }, { transform: 'rotate(-10deg)', offset: 0.35 }, { transform: PLANK_READY }], { duration: 300 });
      f.anim(e.dfBallY, [{ transform: 'translateY(' + BALL_REST[1] + 'px)' }, { transform: 'translateY(' + (BALL_REST[1] - 8 - i * 5) + 'px)', offset: 0.4 }, { transform: 'translateY(' + BALL_REST[1] + 'px)' }], { duration: 300 });
    });
  },

  async caught(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els;
    this.reset(true); this.dressBear(84, 96); f.open(false);
    if (REDUCED) {
      this.settleShow();
      f.caption('BOOM! The meteor bursts into a thousand sparkling stars.'); await f.wait(2800); await f.close(); return;
    }
    DinoScore.start();
    const rexTail = this.tail('Rexy'), [mx, my] = MET_SHOW;
    // 1. the meteor, very close. Then down to the meadow, where everything is ready
    this.show('dfMet'); this.show('dfDanger', 0.75); this.show('dfTint', 0.14); this.show('dfShade', 0.28);
    this.feel('look'); this.still(true);
    this.cam({ x: mx - 4, y: my + 8, z: 2.2 });
    this.cam({ x: mx - 8, y: my + 14, z: 2.45 }, 2400, 'linear');
    f.caption('The meteor is almost here.');
    f.snd(() => DinoScore.rumble(4));
    await f.wait(2400);
    this.cam(WIDE, 1500);
    f.caption('But down in the meadow, everything is ready.');
    await f.wait(2000);
    f.caption('The Stomp Drum. The Boing Ball. The Great Spring Plank.');
    this.squash(e.dfDrum, 360); f.snd(() => DinoScore.drum(0));
    this.later(750, () => { f.snd(() => DinoScore.bop(1)); this.squash(e.dfBall, 360); });
    this.later(1500, () => { f.snd(() => DinoScore.bop(2)); f.anim(e.dfPlank, [{ transform: PLANK_READY }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(-17deg)' }, { transform: PLANK_READY }], { duration: 420 }); });
    await f.wait(2700);
    // 2. Barnaby counts down
    this.cam({ x: 292, y: 548, z: 1.75 }, 800);
    this.feel('happy'); this.feel('proud', ['Rexy']);
    f.caption('"On my count," says Barnaby. "One... two... three!"');
    [900, 1500, 2100].forEach((t, i) => this.later(t, () => { this.hopEl(e.dfBear, 8 + i * 4, 300); f.snd(() => DinoScore.bop(i)); }));
    await f.wait(2900);
    // 3. stomp, stomp, STOMP: each one heavier, the camera punching in
    this.cam(WIDE, 500);
    await f.wait(520);
    f.caption('Stomp... stomp... STOMP!');
    for (let i = 0; i < 3; i++) {
      this.stomp(i);
      this.later(250, () => this.cam({ x: 200, y: 428, z: 1.04 + i * 0.05 }, 160, 'ease-out'));
      await f.wait(780);
    }
    await f.wait(250);
    // 4. here comes Trixie: a run, a leap, and BOING
    f.caption('Here comes Trixie!');
    this.cam({ x: 230, y: 505, z: 1.3 }, 700);
    this.go('Trixie', TRIXIE_RUN, 700, 'linear');
    [0, 230, 460].forEach(t => this.later(t, () => this.hop('Trixie', 12, 230)));
    await f.wait(720);
    this.where.Trixie = TRIXIE_LAND;
    this.move(this.spots.Trixie, [{ transform: tr('Trixie', TRIXIE_RUN), easing: OUT_QUAD }, { transform: tr('Trixie', [268, 452, -1]), offset: 0.52, easing: IN_QUAD }, { transform: tr('Trixie', TRIXIE_LAND) }], { duration: 820 });
    f.anim(this.figs.Trixie, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], { duration: 820, easing: 'ease-in-out' });
    await f.wait(820);
    f.snd(() => { DinoScore.spring(); DinoScore.stomp(3); DinoScore.launch(); Haptics.buzz([30, 20, 30]); });
    this.shake(9, 340); f.flashScreen(0.2, 360, 0.2);
    this.dust(TRIXIE_LAND[0], TRIXIE_LAND[1] + 20, 6);
    this.word('BOING!', 146, 548, 34, '#ffd24a', -8);
    this.move(e.dfPlank, [{ transform: PLANK_READY }, { transform: 'rotate(19deg)', offset: 0.35 }, { transform: PLANK_SNAP }], { duration: 520, easing: 'ease-out' });
    this.move(this.spots.Trixie, [{ transform: tr('Trixie', TRIXIE_LAND) }, { transform: tr('Trixie', [TRIXIE_LAND[0], TRIXIE_LAND[1] + TRIXIE_DOWN + 6, -1]), offset: 0.35 }, { transform: tr('Trixie', [TRIXIE_LAND[0], TRIXIE_LAND[1] + TRIXIE_DOWN, -1]) }], { duration: 520, easing: 'ease-out' });
    this.squash(this.figs.Trixie, 420);
    // 5. up goes the ball, and the camera with it... not quite far enough
    f.caption('Up goes the Boing Ball... up... up...');
    this.feel('look');
    this.fly(BALL_APEX[0], BALL_APEX[1], 1150, OUT_QUAD, 720);
    this.cam({ x: 140, y: 318, z: 1.5 }, 1150, 'cubic-bezier(.3,.6,.4,1)');
    await f.wait(1350);
    f.caption('...and not quite far enough.');
    f.snd(() => DinoScore.gasp());
    f.anim(e.dfBallY, [{ transform: 'translateY(' + BALL_APEX[1] + 'px)' }, { transform: 'translateY(' + (BALL_APEX[1] + 5) + 'px)' }], { duration: 400, iterations: 2, direction: 'alternate', easing: 'ease-in-out' });
    await f.wait(900);
    // 6. but Rexy is ready: a wind-up, and WHACK
    f.caption('But Rexy is ready.');
    this.cam({ x: 204, y: 398, z: 2.2 }, 850);
    this.feel('proud', ['Rexy']);
    this.fly(BALL_BAT[0], BALL_BAT[1], 850, IN_QUAD, 300);
    f.snd(() => DinoScore.swing());
    if (rexTail) f.anim(rexTail, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-60deg)' }], { duration: 800, easing: 'ease-out', fill: 'forwards' });
    f.anim(this.figs.Rexy, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(14deg)' }], { duration: 800, easing: 'ease-out', fill: 'forwards' });
    await f.wait(850);
    f.caption('');
    f.snd(() => { DinoScore.whack(); Haptics.buzz([40]); });
    f.flashScreen(0.4, 320, 0.12); this.shake(7, 260);
    if (rexTail) f.anim(rexTail, [{ transform: 'rotate(-60deg)' }, { transform: 'rotate(85deg)', offset: 0.3 }, { transform: 'rotate(0deg)' }], { duration: 520, easing: 'ease-out' });
    f.anim(this.figs.Rexy, [{ transform: 'rotate(14deg)' }, { transform: 'rotate(-18deg)', offset: 0.3 }, { transform: 'rotate(0deg)' }], { duration: 520, easing: 'ease-out' });
    this.word('WHACK!', 150, 372, 25, '#ff6f91', -10);
    this.burst(BALL_BAT[0], BALL_BAT[1], 7, 26);
    f.anim(e.dfBall, [{ transform: 'scale(1.3,.75)' }, { transform: 'scale(1.3,.75)' }], { duration: 240 });
    await f.wait(240);                                         // the impact frame: everything holds for a moment
    this.show('dfStreak'); e.dfBall.style.transform = 'rotate(23deg)';
    this.fly(BALL_HIT[0], BALL_HIT[1], 400, 'linear', 23);
    f.anim(e.dfBall, [{ transform: 'rotate(23deg)' }, { transform: 'rotate(23deg)' }], { duration: 400 });
    this.cam({ x: mx - 14, y: my + 30, z: 2.15 }, 520, 'cubic-bezier(.2,.7,.3,1)');
    await f.wait(410);
    // 7. it hits. Crack... crack...
    this.show('dfStreak', false); e.dfBall.style.transform = '';
    f.snd(() => DinoScore.bonk());
    f.flashScreen(0.25, 260, 0.2); this.wobble(7, 320); this.squash(e.dfBall, 300);
    this.burst(BALL_HIT[0] + 6, BALL_HIT[1] - 10, 6, 22);
    await f.wait(700);
    f.caption('Crack...');
    for (let i = 0; i < 3; i++) {
      this.show('dfCrack' + i);
      f.snd(() => DinoScore.crack(i));
      this.wobble(3 + i * 2, 220); this.shake(2 + i, 180);
      if (i === 1) f.caption('Crack... crack...');
      await f.wait(i === 2 ? 800 : 560);
    }
    // 8. BOOM
    f.caption('BOOM! The meteor bursts into a thousand sparkling stars.');
    f.snd(() => { DinoScore.boom(); Haptics.win(); });
    this.show('dfBall', false); this.show('dfMet', false);
    f.flashScreen(0.95, 1300, 0.1); this.shake(13, 560);
    this.word('BOOM!', mx - 6, my + 16, 50, '#fff6c8', -6);
    this.ring(mx, my, 9, 1100); this.ring(mx, my, 6, 1300, 180);
    this.burst(mx, my, 30, 80); this.streaks(mx, my, 11);
    this.fade('dfDanger', 0.75, 0, 1700, 150); this.fade('dfTint', 0.14, 0, 1700, 150); this.fade('dfShade', 0.28, 0, 1700, 150);
    this.fade('dfStars', 0, 1, 2200, 500);
    this.starShower();
    this.feel('surprised');
    this.cam({ x: 200, y: 396, z: 0.95 }, 2000, 'cubic-bezier(.2,.7,.3,1)');
    await f.wait(3400);
    // 9. hooray! (and the ball comes home)
    f.snd(() => DinoScore.cheer());
    this.feel('happy'); this.still(false);
    f.caption('Hooray! The meadow is safe.');
    (['Stella', 'Penny', 'Dilly', 'Trixie', 'Rexy'] as Name[]).forEach((n, i) => { [0, 620, 1240].forEach(t => this.later(t + i * 150, () => this.hop(n, n === 'Dilly' ? 10 : 24, 460))); });
    f.anim(e.dfBear, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-6deg) translateY(-8px)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0deg)' }], { duration: 620, iterations: 4 });
    this.ballAt(96, 120); this.show('dfBall');
    this.fly(110, BALL_HOME[1], 800, IN_QUAD, 300);
    this.later(800, () => { f.snd(() => DinoScore.bop(0)); this.toss(145, BALL_HOME[1], 520, 640, 200); });
    this.later(1440, () => { f.snd(() => DinoScore.bop(1)); this.toss(BALL_HOME[0], BALL_HOME[1], 572, 420, 120); });
    await f.wait(2900);
    // 10. one last little star, and Rexy's very first catch
    this.cam({ x: 224, y: 392, z: 2.15 }, 1200);
    f.caption('One last little star drifts down, down, down...');
    this.feel('look', ['Rexy']);
    this.show('dfStar');
    this.move(e.dfStarX, [{ transform: 'translateX(' + STAR_FROM[0] + 'px)' }, { transform: 'translateX(262px)', offset: 0.25 }, { transform: 'translateX(222px)', offset: 0.55 }, { transform: 'translateX(250px)', offset: 0.8 }, { transform: 'translateX(' + STAR_HANDS[0] + 'px)' }], { duration: 3200, easing: 'ease-in-out' });
    this.move(e.dfStarY, [{ transform: 'translateY(' + STAR_FROM[1] + 'px)' }, { transform: 'translateY(' + STAR_HANDS[1] + 'px)' }], { duration: 3200, easing: 'cubic-bezier(.3,.2,.6,1)' });
    await f.wait(3300);
    f.snd(() => { DinoScore.catchStar(); Haptics.win(); });
    f.caption('...and Rexy catches it. Her very first catch!');
    this.feel('proud', ['Rexy']);
    this.burst(STAR_HANDS[0], STAR_HANDS[1], 8, 20);
    this.squash(e.dfStar, 400);
    f.anim(this.figs.Rexy, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(0deg)' }], { duration: 500, iterations: 3 });
    await f.wait(3000);
    // 11. the biggest roar the meadow has ever heard
    this.cam({ x: 200, y: 410, z: 1 }, 1300);
    f.caption('Then she gives the biggest roar the meadow has ever heard.');
    await f.wait(700);
    f.snd(() => DinoScore.bow());
    this.shake(4, 400); f.flashScreen(0.12, 900, 0.4);
    this.roarLines(232, 398, -30, 5, 1.7);
    this.word('ROAR!', 300, 352, 30, '#8ee07a', 8);
    (['Stella', 'Penny', 'Trixie'] as Name[]).forEach((n, i) => this.later(250 + i * 120, () => this.hop(n, 22, 480)));
    this.later(300, () => this.hopEl(e.dfBear, 16, 480));
    await f.wait(3300);
    if (f.fast) this.settleShow();
    DinoScore.stop();
    await f.close();
  }
};

scenes.dino = DinoScene;   // levels reach these cinematics through core/scenes.ts
