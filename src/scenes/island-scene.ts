import { IslandScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { bearMarkup } from '../characters/barnaby-svg.ts';
import { Larry, larryInner } from '../characters/larry.ts';
import { tigerInner } from '../characters/tiger.ts';
import { Worm, wormInner } from '../characters/worm.ts';
import { $, svgEl } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import type { SceneDef } from '../core/scenes.ts';
import { REDUCED, late, mulberry32 } from '../core/util.ts';
import { Store } from '../state/store.ts';
import { palmTree } from './film-art.ts';
import { Film } from './film.ts';

/* ---------- Chapter 10, the island: four cinematics on one stage ----------
   The crash (opens Case 10.1)      a little plane, three windows with three passengers, a cough, a long fall, a flash, and a quiet morning on a beach
   The tiger (opens Case 10.2)      Barnaby and Biscuit in the jungle, glowing eyes, a stalking tiger, a pounce, and Evil Larry's look: he swells
                                    into a giant black shape with burning eyes and the tiger flees
   The dig (opens Case 10.3)        the tiger is back and Larry's look no longer works; Biscuit tunnels in a ring, the ground gives way, and
                                    everybody tumbles into the hole while the tiger skids to the edge
   The rescue (after Case 10.4)     a fire on the beach, a flare, a ship's light blinking back
   All four play on one 400 x 700 SVG stage (index.html #ifArt, built in init()); every number here is in those units. A mode class on the svg
   (m-flight, m-beach, m-jungle, m-under, m-rescue) decides which backdrop pieces show. Every move is written as "the end state, plus an
   animation that leads to it" (move()), so a skipped or reduced-motion film simply shows the end states. The playback mechanics are shared: see film.ts. */
const TAU = Math.PI * 2;
type Mode = 'flight' | 'beach' | 'jungle' | 'under' | 'rescue';
const SKY: Record<Mode, string> = { flight: 'sky-dusk', beach: 'sky-dawn', jungle: 'sky-jungle', under: 'sky-under', rescue: 'sky-sunset' };

const EASE_OUT_BACK = 'cubic-bezier(.3,1.35,.5,1)';
const px = (x: number, y: number, extra = '') => 'translate(' + x + 'px,' + y + 'px)' + (extra ? ' ' + extra : '');

/* where everybody stands, per scene (the position of each character's box; their feet are at its bottom) */
type Pos = [number, number];
const SPOT: Record<'bear' | 'worm' | 'larry' | 'tiger', Record<string, Pos>> = {
  bear:   { jungle: [96, 438], dig: [70, 438], beach: [70, 438], under: [70, 480], rescue: [58, 438] },
  worm:   { jungle: [168, 450], dig: [168, 450], beach: [150, 450], under: [168, 492], rescue: [130, 450] },
  larry:  { jungle: [212, 446], dig: [128, 446], beach: [200, 446], under: [236, 488], rescue: [244, 446] },
  tiger:  { jungle: [250, 444], dig: [250, 444] }
};
/* the whole stage, in painter's order: backdrops of every scene first (each with its own `for-*` class), then the characters, then the foreground */
function artMarkup(): string {
  const rng = mulberry32(41);
  let stars = '';
  for (let i = 0; i < 40; i++) stars += '<circle class="if-twinkle" cx="' + (rng() * 400).toFixed(1) + '" cy="' + (rng() * 300).toFixed(1) + '" r="' + (0.7 + rng() * 1.4).toFixed(1) + '" fill="#fff6d0" style="animation-delay:-' + (rng() * 3).toFixed(2) + 's;opacity:' + (0.4 + (i % 3) * 0.25) + '"/>';
  const vine = (x: number, len: number, d: number) => '<g class="if-sway" style="animation-delay:-' + d + 's"><path d="M' + x + ' -20 Q' + (x + 8) + ' ' + len / 2 + ' ' + x + ' ' + len + '" fill="none" stroke="#2b6a38" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="' + (x + 7) + '" cy="' + (len * 0.4) + '" rx="9" ry="4" fill="#3f9a4e" transform="rotate(30 ' + (x + 7) + ' ' + len * 0.4 + ')"/><ellipse cx="' + (x - 6) + '" cy="' + (len * 0.7) + '" rx="9" ry="4" fill="#3f9a4e" transform="rotate(-30 ' + (x - 6) + ' ' + len * 0.7 + ')"/></g>';
  const lantern = (x: number, y: number) => '<line x1="' + x + '" y1="' + (y - 40) + '" x2="' + x + '" y2="' + (y - 12) + '" stroke="#5a3a24" stroke-width="3"/><circle cx="' + x + '" cy="' + y + '" r="70" fill="url(#ifLamp)"/>' +
    '<rect x="' + (x - 8) + '" y="' + (y - 12) + '" width="16" height="24" rx="5" fill="#ffd27a" stroke="#6a4a24" stroke-width="3"/>';
  return '' +
    '<defs>' +
      '<radialGradient id="ifLamp"><stop offset="0" stop-color="#ffbe6b" stop-opacity=".75"/><stop offset=".45" stop-color="#ffa95a" stop-opacity=".3"/><stop offset="1" stop-color="#ffa95a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ifGlow"><stop offset="0" stop-color="#fff1b0" stop-opacity=".85"/><stop offset="1" stop-color="#fff1b0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ifFireGlow"><stop offset="0" stop-color="#ffb14a" stop-opacity=".95"/><stop offset="1" stop-color="#ffb14a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ifSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#58c0d0"/><stop offset="1" stop-color="#2a8aae"/></linearGradient>' +
      '<linearGradient id="ifShaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe8a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe8a8" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ifBeam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff4c4" stop-opacity=".8"/><stop offset="1" stop-color="#fff4c4" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="ifHeadClip"><rect x="0" y="0" width="150" height="148"/></clipPath>' +
    '</defs>' +
    /* ---- the plane's sky ---- */
    '<g class="fm for-flight"><g>' + stars + '</g><circle cx="320" cy="400" r="120" fill="url(#ifGlow)" opacity=".7"/><circle cx="320" cy="400" r="34" fill="#fff4c4"/>' +
      '<g class="if-cloud" fill="#fff" opacity=".65"><ellipse cx="70" cy="250" rx="62" ry="16"/><ellipse cx="120" cy="238" rx="40" ry="14"/></g>' +
      '<g class="if-cloud" fill="#fff" opacity=".5" style="animation-direction:alternate-reverse"><ellipse cx="320" cy="320" rx="70" ry="16"/><ellipse cx="368" cy="308" rx="38" ry="13"/></g>' +
      '<rect x="-20" y="470" width="440" height="240" fill="url(#ifSea)"/><path d="M-20 470 q30 -8 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#fff" stroke-width="3" opacity=".5"/>' +
      '<path d="M264 470 Q290 444 320 446 Q352 444 372 470Z" fill="#2f7a4a" opacity=".9"/><path d="M296 446 l4 -22 l4 22 M330 446 l3 -18 l3 18" stroke="#2a6a3a" stroke-width="3" fill="none"/></g>' +
    /* ---- the beach (the morning after, and the rescue) ---- */
    '<g class="fm for-beach"><g class="if-cloud" fill="#fff" opacity=".6"><ellipse cx="90" cy="150" rx="70" ry="16"/><ellipse cx="150" cy="138" rx="44" ry="14"/></g>' +
      '<circle cx="320" cy="388" r="110" fill="url(#ifGlow)" opacity=".7"/><circle cx="320" cy="390" r="34" fill="#fff4c4"/>' +
      '<rect x="-20" y="392" width="440" height="140" fill="url(#ifSea)"/><path d="M-20 392 H420" stroke="#fff" stroke-width="2" opacity=".5"/>' +
      '<path d="M0 530 Q100 504 220 520 T420 512 V700 H0Z" fill="#f2d7a0"/><path d="M0 560 Q160 536 420 556 V700 H0Z" fill="#e8c88a"/>' +
      '<g id="ifWave"><path d="M-20 524 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#fff" stroke-width="5" opacity=".75"/></g>' +
      '<g transform="translate(274 436) rotate(-8) scale(.7)"><ellipse cx="60" cy="40" rx="130" ry="34" fill="#cfd6e0"/><path d="M-60 40 Q-76 4 -30 -2 L120 -4 Q172 4 164 40Z" fill="#e8edf3"/><rect x="26" y="6" width="22" height="16" rx="5" fill="#4aa8d8"/><rect x="62" y="6" width="22" height="16" rx="5" fill="#4aa8d8"/>' +
        '<path d="M-68 40 L-112 -62 L-76 -58 L-46 8Z" fill="#e8527a"/></g>' +
      '<g opacity=".5"><circle cx="310" cy="426" r="9" fill="#8a8a96"/><circle cx="318" cy="408" r="12" fill="#9a9aa6"/></g>' +
      palmTree(34, 530, 330, -22, 0.85) + palmTree(376, 522, 350, 14, 0.7, 1) + palmTree(330, 528, 400, -18, 0.5, 1) +
      '<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"><path d="M120 210 q8 -9 16 0 q8 -9 16 0"/><path d="M200 180 q7 -8 14 0 q7 -8 14 0"/></g></g>' +
    /* ---- the jungle (the tiger, and the dig) ---- */
    '<g class="fm for-jungle"><ellipse cx="200" cy="120" rx="260" ry="150" fill="#2f7a3a"/><ellipse cx="60" cy="220" rx="150" ry="130" fill="#3a8a44"/><ellipse cx="350" cy="230" rx="140" ry="140" fill="#34843f"/>' +
      '<path d="M-20 330 Q200 250 420 330 V520 H-20Z" fill="#2a6a36"/>' +
      '<rect x="22" y="80" width="18" height="460" fill="#6a4a30"/><rect x="354" y="60" width="16" height="480" fill="#5a3e28"/><rect x="190" y="150" width="12" height="380" fill="#6a4a30" opacity=".6"/>' +
      vine(70, 230, 0.2) + vine(150, 180, 1.6) + vine(270, 260, 0.9) + vine(320, 160, 2.4) +
      '<path class="if-ground" d="M-20 520 Q100 496 220 512 T420 504 V700 H-20Z" fill="#6d9a4a"/><path d="M-20 556 Q140 534 420 552 V700 H-20Z" fill="#b98c5a"/>' +
      '<g class="fm for-nodig"><circle cx="320" cy="140" r="60" fill="url(#ifGlow)" opacity=".5"/></g></g>' +
    /* ---- the cave under the hole ---- */
    '<g class="fm for-under"><path d="M-20 0 H420 V700 H-20Z" fill="#2b1b12"/><polygon points="130,36 270,36 372,640 28,640" fill="url(#ifShaft)"/>' +
      '<ellipse cx="200" cy="38" rx="84" ry="16" fill="#ffe8a8"/><path d="M-20 600 Q100 580 200 596 T420 590 V700 H-20Z" fill="#5a3a22"/><path d="M-20 640 H420 V700 H-20Z" fill="#3a2414"/>' +
      '<path d="M0 0 Q20 120 0 210 M400 0 Q380 140 400 250" stroke="#3a2414" stroke-width="40" fill="none"/>' +
      '<g stroke="#6a4a2a" stroke-width="4" fill="none" stroke-linecap="round"><path d="M120 40 q-10 40 -4 90"/><path d="M280 40 q10 50 2 100"/><path d="M60 0 q10 60 0 120"/></g>' +
      lantern(70, 330) + lantern(342, 360) + '<g fill="#8a6a4a"><ellipse cx="40" cy="610" rx="30" ry="18"/><ellipse cx="368" cy="616" rx="34" ry="20"/></g></g>' +
    /* ---- the rescue: a bonfire, a ship and its spotlight ---- */
    '<g class="fm for-rescue"><g id="ifShip" transform="translate(120 394)"><g id="ifShipBob"><path d="M-40 -4 L40 -4 L30 14 L-30 14Z" fill="#2b3d4f"/><rect x="-14" y="-24" width="28" height="20" fill="#e8edf3"/><rect x="-4" y="-38" width="9" height="14" fill="#e8527a"/>' +
      '<circle cx="0" cy="-14" r="30" fill="url(#ifGlow)"/><circle cx="0" cy="-14" r="4" fill="#fff4c4"/></g></g>' +
      '<polygon id="ifBeamPoly" points="120,380 330,520 330,590 120,392" fill="url(#ifBeam)" opacity="0"/>' +
      '<g transform="translate(184 548)"><circle cx="0" cy="-10" r="74" fill="url(#ifFireGlow)"/><g stroke="#5a3a24" stroke-width="10" stroke-linecap="round"><path d="M-30 8 L30 -4"/><path d="M-30 -4 L30 8"/></g>' +
        '<g class="if-fire"><path d="M0 0 Q-26 -20 -8 -52 Q-2 -34 12 -46 Q22 -20 0 0Z" fill="#ff8a2a"/><path d="M0 0 Q-12 -14 -2 -30 Q8 -16 0 0Z" fill="#ffe27a"/></g></g></g>' +
    /* ---- the plane ---- */
    '<g id="ifPlane" class="if-hid fm for-flight"><g id="ifPlaneTilt">' +
      '<path d="M6 24 L-16 -6 L20 -4 L34 18Z" fill="#e8527a"/><path d="M70 52 L36 96 L96 92 L106 54Z" fill="#c9d0da"/>' +
      '<path d="M0 40 Q0 16 40 14 L130 16 Q150 24 150 40 Q150 54 130 58 L40 60 Q0 62 0 40Z" fill="#f4f7fb"/><rect x="4" y="38" width="142" height="6" fill="#e8527a"/>' +
      '<ellipse class="if-prop" cx="152" cy="38" rx="4" ry="22" fill="#9aa8b8" opacity=".7"/>' +
      '<g id="ifW0"><circle cx="62" cy="32" r="10" fill="#4aa8d8"/><circle cx="62" cy="33" r="6" fill="#a8764e"/><circle cx="58" cy="28" r="2.4" fill="#a8764e"/><circle cx="66" cy="28" r="2.4" fill="#a8764e"/></g>' +
      '<g id="ifW1"><circle cx="88" cy="32" r="10" fill="#4aa8d8"/><circle cx="88" cy="33" r="6" fill="#f2c98e"/><path d="M84 38 l8 0 l-4 5Z" fill="#e8506a"/></g>' +
      '<g id="ifW2"><circle cx="114" cy="32" r="10" fill="#4aa8d8"/><circle cx="114" cy="33" r="6" fill="#3a3442"/><circle cx="111" cy="33" r="1.6" fill="#e8f04a"/><circle cx="117" cy="33" r="1.6" fill="#e8f04a"/></g>' +
      '<g id="ifSmoke" opacity="0"><circle cx="118" cy="10" r="10" fill="#555"/><circle cx="102" cy="-6" r="14" fill="#666"/><circle cx="82" cy="-24" r="18" fill="#777"/><circle cx="56" cy="-46" r="22" fill="#888"/></g>' +
    '</g></g>' +
    /* ---- everybody (feet down; the pos groups are moved by place(), the inner groups by move()) ---- */
    '<g class="fm for-jungle"><g id="ifCracks" class="if-hid" fill="none" stroke="#5a3a22" stroke-width="3" stroke-linecap="round"><path d="M230 548 l-40 -10 l-18 6"/><path d="M230 548 l34 -14 l30 4"/><path d="M230 548 l-30 16 l-26 -2"/><path d="M230 548 l30 18 l34 4"/><path d="M230 548 l2 -30 l-8 -14"/></g>' +
      '<g id="ifHole" class="if-hid"><ellipse cx="230" cy="552" rx="70" ry="17" fill="#b98c4c"/><ellipse cx="230" cy="554" rx="58" ry="12" fill="#2a1c12"/><ellipse cx="230" cy="557" rx="38" ry="7" fill="#120c08"/></g>' +
      '<g id="ifBump" class="if-hid"><ellipse cx="0" cy="0" rx="22" ry="9" fill="#e8c88a"/><ellipse cx="-3" cy="-3" rx="14" ry="6" fill="#f3d9a0"/></g></g>' +
    '<g id="ifTigPos" transform="translate(250 444)"><g id="ifTig" class="if-hid"><g transform="scale(.62)">' + tigerInner() + '</g></g></g>' +
    '<g id="ifGiantHost" class="if-hid"><g id="ifGiant" transform="translate(54 120) scale(1.5)"><g class="if-giant">' + larryInner() + '</g><ellipse cx="76" cy="101" rx="14" ry="10" fill="#fff36a"/><ellipse cx="124" cy="101" rx="14" ry="10" fill="#fff36a"/></g></g>' +
    '<g id="ifLarPos" transform="translate(212 446)"><g id="ifLar" class="if-hid"><g transform="scale(.45)"><g class="larry l-smug" id="ifLarEmo">' + larryInner() + '</g></g></g></g>' +
    '<g id="ifBisPos" transform="translate(168 450)"><g id="ifBis" class="if-hid"><g transform="scale(.5)"><g class="biscuit b-happy" id="ifBisEmo">' + wormInner() + '</g></g></g></g>' +
    '<g id="ifBPos" transform="translate(96 438)"><g id="ifB" class="if-hid"><g id="ifBArt"></g></g></g>' +
    '<g id="ifSweat" class="if-hid"><path d="M0 0 Q-6 10 0 14 Q6 10 0 0Z" fill="#8fd8ff"/></g>' +
    '<g id="ifPeek" class="if-hid fm for-under"><g transform="translate(138 -4) scale(.55)"><g clip-path="url(#ifHeadClip)">' + tigerInner() + '</g></g></g>' +
    '<g id="ifFlare" class="if-hid fm for-rescue"><circle r="9" fill="url(#ifFireGlow)"/><circle r="3" fill="#ffe2a8"/></g>' +
    '<g id="ifBurst" class="if-hid fm for-rescue" transform="translate(150 150)"></g>' +
    '<g id="ifPuffs"></g>' +
    '<g class="fm for-jungle"><g class="if-sway" style="animation-delay:-.7s"><path d="M392 -10 Q404 150 390 300" fill="none" stroke="#2b6a38" stroke-width="7" stroke-linecap="round"/></g></g>' +
    '<g id="ifBush" class="fm for-jungle"><ellipse cx="372" cy="520" rx="62" ry="40" fill="#2f7a3a"/><ellipse cx="344" cy="534" rx="46" ry="30" fill="#3a8a44"/><ellipse cx="392" cy="540" rx="40" ry="26" fill="#2a6a36"/>' +
      '<path d="M332 500 q-4 -22 8 -30 q2 16 10 22Z M368 486 q-2 -24 12 -32 q0 18 6 28Z" fill="#3f9a4e"/></g>' +
    '<g id="ifEyes" class="if-hid fm for-jungle"><circle cx="340" cy="506" r="16" fill="url(#ifGlow)"/><ellipse cx="334" cy="506" rx="6" ry="5" fill="#ffe45a"/><ellipse cx="352" cy="505" rx="6" ry="5" fill="#ffe45a"/><ellipse cx="334" cy="506" rx="1.8" ry="4.6" fill="#2a1a0a"/><ellipse cx="352" cy="505" rx="1.8" ry="4.6" fill="#2a1a0a"/></g>' +
    '<g class="fm for-jungle"><ellipse cx="404" cy="546" rx="38" ry="30" fill="#2a6a36"/></g>';
}

export const IslandScene = {
  els: {} as Record<string, HTMLElement>, film: late<Film>(),

  init() {
    const e = this.els;
    ['islandFilm', 'ifStage', 'ifArt', 'ifDim', 'ifBlack', 'ifCap', 'ifTitle', 'ifTitleSmall', 'ifTitleMain', 'ifTitleSub', 'ifFlash', 'ifSkip'].forEach(id => { e[id] = $('#' + id); });
    this.film = new Film({ root: e.islandFilm, skip: e.ifSkip, cap: e.ifCap, flash: e.ifFlash });
  },

  /* the stage is built the first time a cinematic plays, so players who never reach chapter 10 never pay for it */
  built: false,
  ensure() {
    if (this.built) return;
    this.built = true;
    const e = this.els;
    e.ifArt.innerHTML = artMarkup();
    ['ifPlane', 'ifPlaneTilt', 'ifSmoke', 'ifW0', 'ifW1', 'ifW2', 'ifWave',
      'ifBPos', 'ifB', 'ifBArt', 'ifBisPos', 'ifBis', 'ifBisEmo', 'ifLarPos', 'ifLar', 'ifLarEmo', 'ifTigPos', 'ifTig', 'ifGiantHost',
      'ifCracks', 'ifHole', 'ifBump', 'ifSweat', 'ifPeek', 'ifEyes', 'ifBush', 'ifFlare', 'ifBurst', 'ifPuffs', 'ifShip', 'ifShipBob', 'ifBeamPoly'].forEach(id => { e[id] = $('#' + id); });
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
  feelWorm(emotion: string) { const c = this.els.ifBisEmo.classList; Worm.EMOS.forEach(x => c.remove('b-' + x)); c.add('b-' + emotion); },
  feelLarry(emotion: string) { const c = this.els.ifLarEmo.classList; Larry.EMOS.forEach(x => c.remove('l-' + x)); c.add('l-' + emotion); },
  place(who: 'bear' | 'worm' | 'larry' | 'tiger', at: Pos) {
    const id = { bear: 'ifBPos', worm: 'ifBisPos', larry: 'ifLarPos', tiger: 'ifTigPos' }[who];
    this.els[id].style.transform = px(at[0], at[1]);
  },
  title(small: string, main: string, sub: string) { const e = this.els; e.ifTitleSmall.textContent = small; e.ifTitleMain.textContent = main; e.ifTitleSub.textContent = sub; e.ifTitle.classList.add('on'); },
  shake(ms = 700, amp = 6) {
    this.film.anim(this.els.ifArt, [{ transform: 'translate(0,0)' }, { transform: 'translate(' + amp + 'px,' + amp / 3 + 'px)', offset: 0.15 }, { transform: 'translate(-' + amp + 'px,-' + amp / 3 + 'px)', offset: 0.35 },
      { transform: 'translate(' + amp * 0.7 + 'px,0)', offset: 0.55 }, { transform: 'translate(-' + amp * 0.4 + 'px,0)', offset: 0.78 }, { transform: 'translate(0,0)' }], { duration: ms, easing: 'ease-out' });
  },

  /* Barnaby, in whatever the player dressed him in */
  dressBear() {
    const art = this.els.ifBArt, markup = bearMarkup(Store.data.wardrobe.equipped);
    art.innerHTML = markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6);
    const bear = art.firstElementChild;
    if (!bear) return;
    bear.removeAttribute('class'); bear.removeAttribute('role'); bear.removeAttribute('aria-label');
    for (const [k, v] of Object.entries({ x: 0, y: 0, width: 104, height: 120 })) bear.setAttribute(k, String(v));
  },

  /* a puff of dust or sand at (x, y) */
  puff(x: number, y: number, n = 6, color = '#f6dcae') {
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (0.1 + 0.8 * (k / Math.max(1, n - 1))), d = 18 + (k % 3) * 9;
      const c = svgEl('circle', { cx: x, cy: y, r: 4 + (k % 3) * 2, fill: color });
      c.style.transformBox = 'fill-box';
      this.els.ifPuffs.appendChild(c);
      const anim = this.film.anim(c, [{ transform: 'translate(0,0) scale(.5)', opacity: 0.95 }, { transform: 'translate(' + Math.round(Math.cos(a) * d * 1.5) + 'px,' + Math.round(-Math.sin(a) * d) + 'px) scale(1.7)', opacity: 0 }],
        { duration: 650 + k * 40, easing: 'ease-out', fill: 'forwards' });
      if (anim) anim.onfinish = () => c.remove(); else c.remove();
    }
  },

  /* a clean stage in a mode */
  reset(mode: Mode, extra = '') {
    const e = this.els;
    this.film.clearAnimations();
    e.ifArt.setAttribute('class', 'if-art m-' + mode + (extra ? ' ' + extra : ''));
    e.ifStage.className = 'if-stage ' + SKY[mode];
    ['ifStage', 'ifArt', 'ifPlane', 'ifPlaneTilt', 'ifSmoke', 'ifB', 'ifBis', 'ifLar', 'ifTig', 'ifGiantHost', 'ifCracks', 'ifHole', 'ifBump', 'ifSweat', 'ifPeek', 'ifEyes', 'ifFlare', 'ifBurst', 'ifBeamPoly', 'ifShip', 'ifBlack', 'ifDim']
      .forEach(id => { e[id].style.transform = ''; e[id].style.opacity = ''; });
    e.ifPuffs.textContent = ''; e.ifBurst.textContent = '';
    e.ifTigPos.classList.remove('roar', 'scared'); e.ifLarPos.classList.remove('if-look');
    this.place('bear', SPOT.bear[mode === 'flight' ? 'jungle' : mode]);
    this.feelWorm('happy'); this.feelLarry('smug');
    e.ifTitle.classList.remove('on');
    this.film.caption('');
  },

  /* ============================================ 1. THE CRASH (opens Case 10.1) ============================================ */
  settleCrash() {
    this.reset('beach');
    this.place('bear', [96, 438]);
    this.show('ifB');
  },

  async crash(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.crash;
    this.reset('flight'); this.dressBear(); f.open(first);
    if (REDUCED) {
      this.reset('beach'); this.place('bear', [96, 438]); this.show('ifB');
      this.title('CHAPTER 10', 'CASTAWAYS', 'a very small island'); await f.wait(2800); await f.close();
    } else {
      IslandScore.start();
      // 1. a little plane over a very big ocean
      this.show('ifPlane');
      f.caption('A little plane, a long way over a very big ocean.');
      this.move(e.ifPlane, [{ transform: px(-190, 168) }, { transform: px(120, 150) }], { duration: 5200, easing: 'linear' });
      f.snd(() => IslandScore.engine());
      f.anim(e.ifPlaneTilt, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-2deg)', offset: 0.5 }, { transform: 'rotate(0deg)' }], { duration: 2600, iterations: 2, easing: 'ease-in-out' });
      await f.wait(3600);
      // 2. three windows, three passengers
      f.caption('Three very different passengers.');
      f.anim(e.ifStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.5) translate(-6%,3%)' }], { duration: 3200, easing: 'ease-in-out', fill: 'forwards' });
      ['ifW0', 'ifW1', 'ifW2'].forEach((id, i) => {
        const w = e[id] as HTMLElement | SVGElement;
        w.style.transformBox = 'fill-box'; w.style.transformOrigin = '50% 50%';
        f.anim(w, [{ transform: 'scale(1)' }, { transform: 'scale(1.5)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 520, delay: 700 + i * 760, easing: 'ease-out' });
      });
      await f.wait(700); f.snd(() => IslandScore.eep());
      await f.wait(760); f.snd(() => IslandScore.eep());
      await f.wait(760); f.snd(() => IslandScore.growl());
      await f.wait(1500);
      // 3. the engine coughs
      f.caption('Then the engine coughed.');
      f.snd(() => { IslandScore.cough(); Haptics.buzz([20, 40, 30]); });
      this.move(e.ifSmoke, [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0.9 }], { duration: 800, easing: 'ease-out' });
      this.move(e.ifPlaneTilt, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(3deg)', offset: 0.3 }, { transform: 'rotate(-2deg)', offset: 0.6 }, { transform: 'rotate(12deg)' }], { duration: 1700, easing: 'ease-in-out' });
      this.shake(1200, 4);
      await f.wait(2300);
      // 4. the fall
      f.caption('Mayday! Mayday!');
      f.snd(() => { IslandScore.fall(); Haptics.buzz([30, 30, 30, 30, 30]); });
      f.anim(e.ifStage, [{ transform: 'scale(1.5) translate(-6%,3%)' }, { transform: 'scale(1.1) translate(-2%,-3%)' }], { duration: 2400, easing: 'ease-in', fill: 'forwards' });
      this.move(e.ifPlaneTilt, [{ transform: 'rotate(12deg)' }, { transform: 'rotate(46deg)' }], { duration: 2300, easing: 'ease-in' });
      this.move(e.ifPlane, [{ transform: px(120, 150) }, { transform: px(250, 410, 'scale(.8)') }], { duration: 2300, easing: 'cubic-bezier(.5,0,.9,.6)' });
      await f.wait(2200);
      // 5. impact
      f.flashScreen(0.95, 800, 0.1);
      f.snd(() => { IslandScore.crash(); Haptics.buzz([60, 40, 80]); });
      this.shake(900, 12);
      this.show('ifPlane', false);
      this.puff(284, 470, 8, '#9fe0f0');
      f.caption('');
      await f.wait(500);
      this.move(e.ifBlack, [{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: 'ease-in' });
      await f.wait(1700);
      // 6. morning on a beach
      e.ifStage.style.transform = ''; e.ifArt.classList.remove('m-flight'); e.ifArt.classList.add('m-beach'); e.ifStage.className = 'if-stage sky-dawn';
      this.show('ifB'); this.place('bear', [96, 470]);
      e.ifB.style.transform = 'rotate(-90deg)';
      f.snd(() => IslandScore.surf());
      f.anim(e.ifWave, [{ transform: 'translateY(0)' }, { transform: 'translateY(12px)' }], { duration: 2800, iterations: 8, direction: 'alternate', easing: 'ease-in-out' });
      this.move(e.ifBlack, [{ opacity: 1 }, { opacity: 0 }], { duration: 2400, easing: 'ease-out' });
      f.anim(e.ifStage, [{ transform: 'scale(1.18) translate(2%,3%)' }, { transform: 'scale(1.05)' }], { duration: 12000, easing: 'ease-in-out', fill: 'forwards' });
      f.caption('Morning. Sand. Salt. Silence.');
      await f.wait(3600);
      // 7. Barnaby wakes
      f.snd(() => IslandScore.eep());
      this.place('bear', [96, 438]);
      this.move(e.ifB, [{ transform: 'rotate(-90deg)' }, { transform: 'rotate(-24deg)', offset: 0.5 }, { transform: 'rotate(0deg)' }], { duration: 1400, easing: EASE_OUT_BACK });
      f.caption('Barnaby wakes up. Alone.');
      await f.wait(2800);
      f.caption('Somewhere on this island, a worm and a thief are waking up too.');
      await f.wait(3400);
      // 8. the title card
      f.caption('');
      this.title('CHAPTER 10', 'CASTAWAYS', 'a very small island');
      f.snd(() => { IslandScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleCrash();
      IslandScore.stop();
      await f.close();
    }
    Store.data.seen.crash = true; Store.save();
  },

  /* ============================================ 2. THE TIGER (opens Case 10.2) ============================================ */
  settleTiger() {
    const e = this.els;
    this.reset('jungle');
    this.place('bear', SPOT.bear.jungle); this.place('worm', SPOT.worm.jungle); this.place('larry', [190, 446]);
    this.show('ifB'); this.show('ifBis'); this.show('ifLar');
    this.feelLarry('smug');
    e.ifTigPos.classList.add('scared');
  },

  async tiger(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.tiger;
    this.reset('jungle'); this.dressBear(); f.open(first);
    if (REDUCED) {
      this.settleTiger(); this.title('EVIL LARRY', 'THE LOOK', 'the scariest thing on the island'); await f.wait(2800); await f.close();
    } else {
      IslandScore.start();
      this.place('larry', [190, 446]); this.place('tiger', [330, 444]);
      // 1. into the jungle
      this.show('ifB'); this.show('ifBis');
      f.caption('Deep in the jungle, the birds go quiet.');
      f.anim(e.ifStage, [{ transform: 'scale(1.18) translate(3%,0)' }, { transform: 'scale(1)' }], { duration: 9000, easing: 'ease-out', fill: 'backwards' });
      this.move(e.ifBPos, [{ transform: px(SPOT.bear.jungle[0] - 130, SPOT.bear.jungle[1]) }, { transform: px(...SPOT.bear.jungle) }], { duration: 3200, easing: 'ease-out' });
      this.move(e.ifBisPos, [{ transform: px(SPOT.worm.jungle[0] - 150, SPOT.worm.jungle[1]) }, { transform: px(...SPOT.worm.jungle) }], { duration: 3400, easing: 'ease-out' });
      for (let i = 0; i < 4; i++) {
        f.anim(e.ifB, [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)' }, { transform: 'translateY(0)' }], { duration: 620, delay: i * 700, easing: 'ease-out' });
        f.anim(e.ifBis, [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: 480, delay: i * 700 + 200, easing: 'ease-out' });
      }
      f.snd(() => IslandScore.steps(5));
      await f.wait(3600);
      // 2. something is watching
      this.feelWorm('surprised');
      f.caption('Something is watching.');
      f.snd(() => IslandScore.rustle());
      this.move(e.ifBush, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)', offset: 0.25 }, { transform: 'translateX(3px)', offset: 0.5 }, { transform: 'translateX(0)' }], { duration: 700, easing: 'ease-in-out' });
      await f.wait(900);
      this.move(e.ifEyes, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
      f.snd(() => IslandScore.growl());
      f.anim(e.ifStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.12) translate(-3%,0)' }], { duration: 3200, easing: 'ease-in-out', fill: 'forwards' });
      await f.wait(2600);
      // 3. the tiger steps out, and stalks
      this.show('ifEyes', false); this.show('ifTig');
      f.caption('A tiger.');
      this.move(e.ifTigPos, [{ transform: px(330 + 90, 444) }, { transform: px(330, 444) }], { duration: 2600, easing: 'ease-out' });
      f.snd(() => IslandScore.steps(5));
      this.move(e.ifTig, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px) scaleY(.96)' }, { transform: 'translateY(0)' }, { transform: 'translateY(4px) scaleY(.96)' }, { transform: 'translateY(2px) scaleY(.9)' }], { duration: 2600, easing: 'ease-in-out' });
      await f.wait(1400);
      this.move(e.ifB, [{ transform: 'translateX(0)' }, { transform: 'translateX(-14px)' }], { duration: 900, easing: 'ease-out' });
      this.feelWorm('sad');
      f.snd(() => IslandScore.eep());
      await f.wait(1500);
      // 4. the pounce
      f.caption('ROAR!');
      e.ifTigPos.classList.add('roar');
      f.snd(() => { IslandScore.roar(); Haptics.buzz([40, 30, 60]); });
      f.flashScreen(0.18, 500, 0.1);
      this.shake(600, 5);
      f.anim(e.ifStage, [{ transform: 'scale(1.12) translate(-3%,0)' }, { transform: 'scale(1.32) translate(-9%,0)' }], { duration: 900, easing: 'ease-in', fill: 'forwards' });
      await f.wait(850);
      f.snd(() => IslandScore.pounce());
      this.move(e.ifTig, [{ transform: 'translate(0,4px) scaleY(.9)' }, { transform: 'translate(-90px,-68px) rotate(-14deg)', offset: 0.55 }, { transform: 'translate(-150px,-30px) rotate(8deg)' }], { duration: 760, easing: 'cubic-bezier(.3,0,.6,1)' });
      this.move(e.ifBis, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(40px) scale(.7,.3)' }], { duration: 420, easing: 'ease-in' });
      f.snd(() => IslandScore.dive());
      await f.wait(560);
      // 5. freeze, and the look
      e.ifTigPos.classList.add('roar');
      f.caption('');
      f.snd(() => IslandScore.zap());
      f.flashScreen(0.9, 650, 0.12);
      this.move(e.ifDim, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
      await f.wait(350);
      this.show('ifLar'); this.place('larry', [158, 446]);
      this.feelLarry('angry');
      f.snd(() => { IslandScore.menace(); Haptics.buzz([20, 40, 80, 40, 20]); });
      e.ifLarPos.classList.add('if-look');
      this.move(e.ifLar, [{ transform: 'scale(.1)', opacity: 0 }, { transform: 'scale(.45)', opacity: 1, offset: 0.25 }, { transform: 'scale(1.4)', opacity: 1, offset: 0.6 }, { transform: 'scale(2.5)', opacity: 1 }], { duration: 1700, easing: 'cubic-bezier(.4,0,.2,1)' });
      this.move(e.ifGiantHost, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 1500, delay: 400, easing: 'ease-in' });
      f.caption('Evil Larry gave it his look.');
      this.shake(1200, 3);
      await f.wait(1900);
      // 6. the tiger flees
      f.flashScreen(0.55, 500, 0.15);
      e.ifTigPos.classList.remove('roar'); e.ifTigPos.classList.add('scared');
      f.snd(() => IslandScore.yelp());
      this.move(e.ifTig, [{ transform: 'translate(-150px,-30px) rotate(8deg)' }, { transform: 'translate(-110px,-96px) rotate(-30deg) scaleX(-1)', offset: 0.3 }, { transform: 'translate(260px,-10px) rotate(-6deg) scaleX(-1)' }], { duration: 900, easing: 'cubic-bezier(.5,0,.9,.4)' });
      f.caption('YELP!');
      this.puff(330, 540, 8, '#c9a56a');
      await f.wait(1200);
      this.move(e.ifDim, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' });
      this.move(e.ifGiantHost, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 700 });
      this.move(e.ifLar, [{ transform: 'scale(2.5)' }, { transform: 'scale(1)' }], { duration: 900, easing: 'cubic-bezier(.3,1.3,.5,1)' });
      e.ifLarPos.classList.remove('if-look');
      this.feelLarry('smug');
      this.show('ifBis'); this.feelWorm('surprised');
      this.move(e.ifBis, [{ opacity: 0, transform: 'translateY(40px) scale(.6,.2)' }, { opacity: 1, transform: 'translateY(-14px) scale(.95,1.1)', offset: 0.55 }, { opacity: 1, transform: 'none' }], { duration: 700, easing: EASE_OUT_BACK });
      f.snd(() => IslandScore.hero());
      f.caption('...and for once, the scariest thing on the island was on their side.');
      await f.wait(3600);
      this.feelWorm('happy');
      f.caption('');
      this.title('EVIL LARRY', 'THE LOOK', 'the scariest thing on the island');
      f.snd(() => { IslandScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleTiger();
      IslandScore.stop();
      await f.close();
    }
    Store.data.seen.tiger = true; Store.save();
  },

  /* ============================================ 3. THE DIG (opens Case 10.3) ============================================ */
  settleDig() {
    this.reset('under');
    this.place('bear', SPOT.bear.under); this.place('worm', SPOT.worm.under); this.place('larry', SPOT.larry.under);
    this.show('ifB'); this.show('ifBis'); this.show('ifLar');
    this.feelLarry('smug'); this.feelWorm('happy');
  },

  async dig(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.dig;
    this.reset('jungle', 'dig'); this.dressBear(); f.open(first);
    if (REDUCED) {
      this.settleDig(); this.title('BISCUIT', 'DIGS IN', 'a very small plan'); await f.wait(2800); await f.close();
    } else {
      IslandScore.start();
      const dust = '#e9c98a';
      this.place('bear', SPOT.bear.dig); this.place('worm', SPOT.worm.dig); this.place('larry', SPOT.larry.dig); this.place('tiger', SPOT.tiger.dig);
      this.show('ifB'); this.show('ifBis'); this.show('ifLar');
      // 1. the tiger is back
      f.caption('But tigers do not give up that easily.');
      f.anim(e.ifStage, [{ transform: 'scale(1.16) translate(2%,0)' }, { transform: 'scale(1)' }], { duration: 9000, easing: 'ease-out', fill: 'backwards' });
      f.snd(() => IslandScore.rustle());
      this.move(e.ifBush, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)', offset: 0.3 }, { transform: 'translateX(3px)', offset: 0.6 }, { transform: 'translateX(0)' }], { duration: 700, easing: 'ease-in-out' });
      await f.wait(900);
      this.move(e.ifEyes, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
      f.snd(() => IslandScore.growl());
      await f.wait(1800);
      this.show('ifEyes', false); this.show('ifTig');
      this.move(e.ifTigPos, [{ transform: px(SPOT.tiger.dig[0] + 100, SPOT.tiger.dig[1]) }, { transform: px(...SPOT.tiger.dig) }], { duration: 2200, easing: 'ease-out' });
      f.snd(() => IslandScore.steps(4));
      this.feelWorm('surprised');
      await f.wait(2300);
      // 2. Larry tries the look again
      f.caption('Evil Larry stepped up and gave it his look.');
      this.feelLarry('angry');
      f.snd(() => IslandScore.menace());
      e.ifLarPos.classList.add('if-look');
      this.move(e.ifLar, [{ transform: 'scale(1)' }, { transform: 'scale(1.7)' }], { duration: 1200, easing: 'ease-out' });
      this.move(e.ifDim, [{ opacity: 0 }, { opacity: 0.7 }], { duration: 600, easing: 'ease-out' });
      await f.wait(1700);
      f.caption('This time, the look did not work.');
      this.move(e.ifDim, [{ opacity: 0.7 }, { opacity: 0 }], { duration: 500 });
      this.feelLarry('caught');
      this.move(e.ifTig, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-5deg) translateY(2px)' }], { duration: 700, easing: 'ease-in-out' });
      e.ifTigPos.classList.add('roar');
      f.snd(() => IslandScore.growl());
      await f.wait(1000);
      this.move(e.ifLar, [{ transform: 'scale(1.7)' }, { transform: 'scale(1)' }], { duration: 700, easing: 'ease-in' });
      e.ifLarPos.classList.remove('if-look');
      this.move(e.ifSweat, [{ transform: 'translate(150px,470px)', opacity: 0 }, { transform: 'translate(150px,480px)', opacity: 1, offset: 0.3 }, { transform: 'translate(150px,520px)', opacity: 0 }], { duration: 1200, easing: 'ease-in' });
      await f.wait(1400);
      // 3. Biscuit has a very small plan
      f.caption('Biscuit had a very small plan.');
      this.feelWorm('wiggle');
      f.snd(() => IslandScore.eep());
      await f.wait(900);
      f.snd(() => { IslandScore.dive(); Haptics.buzz(10); });
      this.move(e.ifBis, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-14px) scale(.94,1.1)', opacity: 1, offset: 0.35 }, { transform: 'translateY(44px) scale(.8,.3)', opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.5,0,.8,.4)' });
      await f.wait(460);
      this.puff(218, 556, 6, dust);
      this.show('ifBump');
      f.snd(() => IslandScore.dig());
      // a ring of tunnelling around the three of them
      const ring: Pos[] = [[190, 548], [100, 560], [150, 570], [270, 566], [306, 550], [250, 540], [190, 548]];
      const frames: Keyframe[] = ring.map(([x, y], k) => ({ transform: 'translate(' + x + 'px,' + y + 'px) ' + (k % 2 ? 'scale(1.15,.85)' : 'scale(.95,1.1)'), opacity: 1 }));
      this.move(e.ifBump, frames, { duration: 2600, easing: 'ease-in-out' });
      this.shake(2600, 3);
      await f.wait(1400);
      this.move(e.ifCracks, [{ opacity: 0 }, { opacity: 1 }], { duration: 1400, easing: 'ease-in' });
      await f.wait(1300);
      // 4. the pounce, and the ground gives way
      this.show('ifBump', false);
      f.caption('...and a very deep one.');
      e.ifTigPos.classList.add('roar');
      f.snd(() => { IslandScore.roar(); IslandScore.pounce(); });
      this.move(e.ifTig, [{ transform: 'translate(0,4px) scaleY(.92)' }, { transform: 'translate(-92px,-64px) rotate(-14deg)', offset: 0.5 }, { transform: 'translate(-124px,0) rotate(6deg)' }], { duration: 800, easing: 'cubic-bezier(.3,0,.6,1)' });
      await f.wait(560);
      f.snd(() => { IslandScore.cave(); Haptics.buzz([50, 40, 80, 40, 120]); });
      this.shake(1500, 9);
      this.move(e.ifHole, [{ opacity: 1, transform: 'scale(.1)' }, { opacity: 1, transform: 'scale(1.25)' }], { duration: 900, easing: 'ease-out' });
      this.puff(230, 552, 10, dust);
      await f.wait(260);
      f.snd(() => IslandScore.tumble());
      this.move(e.ifB, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translate(40px,90px) scale(.6) rotate(24deg)', opacity: 0 }], { duration: 760, easing: 'ease-in' });
      this.move(e.ifLar, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'translate(40px,90px) scale(.5) rotate(-24deg)', opacity: 0 }], { duration: 760, delay: 140, easing: 'ease-in' });
      this.move(e.ifTig, [{ transform: 'translate(-124px,0) rotate(6deg)' }, { transform: 'translate(-124px,10px) rotate(-18deg)', offset: 0.5 }, { transform: 'translate(-124px,4px) rotate(2deg)' }], { duration: 900, easing: 'ease-out' });
      f.caption('...and everybody fell in.');
      await f.wait(1800);
      // 5. underground
      this.move(e.ifBlack, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-in' });
      f.snd(() => IslandScore.thud());
      await f.wait(750);
      e.ifArt.setAttribute('class', 'if-art m-under'); e.ifStage.className = 'if-stage sky-under';
      e.ifPuffs.textContent = '';
      this.place('bear', SPOT.bear.under); this.place('worm', SPOT.worm.under); this.place('larry', SPOT.larry.under);
      e.ifBis.style.transform = '';
      this.show('ifB'); this.show('ifBis'); this.show('ifLar'); this.show('ifTig', false);
      this.feelLarry('caught'); this.feelWorm('happy');
        this.move(e.ifBlack, [{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' });
      f.snd(() => IslandScore.thud());
      this.move(e.ifB, [{ transform: 'translateY(-60px) rotate(-14deg)', opacity: 0 }, { transform: 'translateY(0) rotate(0deg)', opacity: 1 }], { duration: 520, easing: EASE_OUT_BACK });
      this.move(e.ifLar, [{ transform: 'translateY(-90px) rotate(10deg)', opacity: 0 }, { transform: 'translateY(0) rotate(0deg)', opacity: 1 }], { duration: 520, delay: 200, easing: EASE_OUT_BACK });
      this.puff(200, 590, 10, '#b9966a');
      f.caption('Down in the dark, three friends sat very still.');
      await f.wait(2400);
      this.move(e.ifPeek, [{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 800, easing: 'ease-out' });
      f.snd(() => IslandScore.growl());
      f.caption('Above them, a very big face peered in.');
      await f.wait(2300);
      this.move(e.ifPeek, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-40px)' }], { duration: 900, easing: 'ease-in' });
      f.snd(() => IslandScore.yelp());
      await f.wait(1100);
      this.feelWorm('shy'); this.feelLarry('smug');
      f.caption('It could not reach them. And down here, there was a way on.');
      await f.wait(2800);
      f.caption('');
      this.title('BISCUIT', 'DIGS IN', 'a very small plan');
      f.snd(() => { IslandScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleDig();
      IslandScore.stop();
      await f.close();
    }
    Store.data.seen.dig = true; Store.save();
  },

  /* ============================================ 4. THE RESCUE (after Case 10.4) ============================================ */
  settleRescue() {
    this.reset('rescue');
    this.place('bear', SPOT.bear.rescue); this.place('worm', SPOT.worm.rescue); this.place('larry', SPOT.larry.rescue);
    this.show('ifB'); this.show('ifBis'); this.show('ifLar');
    this.feelWorm('happy'); this.feelLarry('smug');
    this.els.ifBeamPoly.style.opacity = '1';
  },

  async rescue(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els;
    this.reset('rescue'); this.dressBear(); f.open(false);
    this.place('bear', SPOT.bear.rescue); this.place('worm', SPOT.worm.rescue); this.place('larry', SPOT.larry.rescue);
    this.show('ifB'); this.show('ifBis'); this.show('ifLar'); this.show('ifShip', false);
    if (REDUCED) {
      this.settleRescue(); this.show('ifShip');
      f.caption('A ship answers the signal.'); await f.wait(2800); await f.close(); return;
    }
    IslandScore.start();
    // 1. a fire, just before sunset
    f.caption('Just before sunset, a fire on the beach.');
    f.anim(e.ifStage, [{ transform: 'scale(1.18) translateY(3%)' }, { transform: 'scale(1)' }], { duration: 12000, easing: 'ease-out', fill: 'backwards' });
    f.snd(() => IslandScore.surf());
    await f.wait(3000);
    // 2. the flare
    f.caption('One last flare, lit by a bear, a worm and a thief.');
    this.feelWorm('wiggle');
    await f.wait(1700);
    this.show('ifFlare');
    f.snd(() => { IslandScore.flare(); Haptics.buzz([30, 30]); });
    this.move(e.ifFlare, [{ transform: 'translate(112px,430px) scale(.6)', opacity: 1 }, { transform: 'translate(150px,150px) scale(1)', opacity: 1, offset: 0.85 }, { transform: 'translate(150px,140px) scale(.6)', opacity: 0 }], { duration: 1300, easing: 'cubic-bezier(.3,.6,.4,1)' });
    await f.wait(1250);
    f.flashScreen(0.55, 900, 0.1);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU, len = 54 + (k % 3) * 14;
      const l = svgEl('line', { x1: 0, y1: 0, x2: Math.round(Math.cos(a) * len), y2: Math.round(Math.sin(a) * len), stroke: k % 2 ? '#ff6a4a' : '#ffd27a', 'stroke-width': 4, 'stroke-linecap': 'round' });
      e.ifBurst.appendChild(l);
    }
    this.move(e.ifBurst, [{ transform: 'translate(150px,150px) scale(.1)', opacity: 1 }, { transform: 'translate(150px,150px) scale(1)', opacity: 1, offset: 0.4 }, { transform: 'translate(150px,170px) scale(1.15)', opacity: 0 }], { duration: 2200, easing: 'ease-out' });
    await f.wait(1900);
    // 3. a light blinks back
    f.caption('And far out on the water, a light blinked back.');
    this.show('ifShip');
    this.move(e.ifShip, [{ opacity: 0, transform: px(80, 394) }, { opacity: 1, transform: px(120, 394) }], { duration: 1600, easing: 'ease-out' });
    f.anim(e.ifShipBob, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }], { duration: 2000, iterations: 6, direction: 'alternate', easing: 'ease-in-out' });
    f.snd(() => IslandScore.horn());
    this.move(e.ifBeamPoly, [{ opacity: 0 }, { opacity: 1 }], { duration: 1600, delay: 900 });
    this.feelWorm('surprised');
    await f.wait(3400);
    // 4. cheers
    f.caption('Rescue!');
    this.feelWorm('wiggle'); this.feelLarry('smug');
    f.snd(() => { IslandScore.hero(); Haptics.win(); });
    f.flashScreen(0.18, 900, 0.3);
    [e.ifB, e.ifBis, e.ifLar].forEach((el, i) => f.anim(el, [{ transform: 'translateY(0)' }, { transform: 'translateY(-26px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-16px)' }, { transform: 'translateY(0)' }], { duration: 1400, delay: i * 140, easing: 'ease-out' }));
    f.anim(e.ifStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.1) translate(-2%,0)' }], { duration: 8000, easing: 'ease-in-out', fill: 'forwards' });
    await f.wait(3200);
    f.caption('Thank you, Barnaby, Biscuit and Larry!');
    await f.wait(3200);
    if (f.fast) this.settleRescue();
    IslandScore.stop();
    await f.close();
  }
};

const none = async () => { /* this cinematic has no "case closed" part */ };
const wrap = (intro: () => Promise<void>, caught: () => Promise<void> = none): SceneDef => ({ intro, caught });

/* levels reach these cinematics through core/scenes.ts: scenes.crash opens 10.1 and its caught() is the rescue that follows 10.4 */
scenes.crash = wrap(() => IslandScene.crash(), () => IslandScene.rescue());
scenes.tiger = wrap(() => IslandScene.tiger());
scenes.dig = wrap(() => IslandScene.dig());
