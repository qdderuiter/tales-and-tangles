import { SpaghettiScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { larryInner } from '../characters/larry.ts';
import { pasqualeInner } from '../characters/pasquale.ts';
import { $, svgEl } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, late, mulberry32 } from '../core/util.ts';
import { NOIR_OUTFIT } from '../data/wardrobe.ts';
import { Store } from '../state/store.ts';
import { palmTree } from './film-art.ts';
import { Film } from './film.ts';
import { dressBear, px, wrap } from './film-kit.ts';

/* ---------- Chapter 12, Spaghetti Chronicles: four cinematics on one stage ----------
   The camp kitchen (opens Case 12.1)  sunset over three pyramids; Chef Pasquale's pot steams and his recipe page is gone.  TAP the pot to pop its lid
   The Sphinx (opens 12.2)             moonlight; the second page vanished from between her paws.  TAP her eye: she opens it, the sand slides off and a lantern shows
   The tomb (opens 12.3)               a dark chamber and a sleeping mummy.  TAP the three torches to light them; bear-sized footprints appear in the dust
   The unmasking (after 12.4)          the chef's tent at dusk; Larry points at the detective.  TAP the fedora: the disguise comes off and Barnaby Noir stands there
   All four play on one 400 x 700 SVG stage (index.html #spArt, built in ensure()); every number here is in those units. A mode class on the svg
   (m-camp, m-sphinx, m-tomb, m-unmask) decides which backdrop pieces show. Every move is "the end state, plus an animation that leads to it" (move()),
   so a skipped or reduced-motion film simply shows the end states. A tap moment is Film.tap(): it never blocks, it times out and the film goes on. */
type Mode = 'camp' | 'sphinx' | 'tomb' | 'unmask';
type Pos = [number, number];

const GLIDE = 'cubic-bezier(.22,1,.36,1)';
const SPRING = 'cubic-bezier(.3,1.35,.5,1)';

/* where everybody stands, per scene: the top-left of each character's box (their feet are at its bottom, about y 565) */
const SPOT = {
  bear: { camp: [10, 448], sphinx: [40, 503], tomb: [20, 490], unmask: [150, 448] } as Record<Mode, Pos>,
  pas:  { camp: [105, 447], sphinx: [240, 506], tomb: [270, 493], unmask: [30, 447] } as Record<Mode, Pos>,
  lar:  { camp: [310, 464], sphinx: [150, 520], tomb: [150, 520], unmask: [275, 464] } as Record<Mode, Pos>
};
const TORCHES: Pos[] = [[60, 360], [200, 340], [340, 360]];
const DARK = [0.84, 0.58, 0.32, 0.04];                                  // how dark the tomb is with 0, 1, 2 and 3 torches lit

const pyr = (l: number, b: number, x: number, y: number) => {
  const r = x * 2 - l;
  return '<g class="sp-pyr"><path d="M' + l + ' ' + b + ' L' + x + ' ' + y + ' L' + r + ' ' + b + 'Z" fill="#f0b878"/><path d="M' + x + ' ' + y + ' L' + r + ' ' + b + ' L' + x + ' ' + b + 'Z" fill="#c98a5a"/></g>';
};
const person = (id: string, art: string, s: number, at: Pos, cls = 'sp-char') =>
  '<g id="' + id + 'Pos" transform="translate(' + at[0] + ' ' + at[1] + ')"><g id="' + id + '" class="sp-hid"><g transform="scale(' + s + ')"><g class="' + cls + '">' + art + '</g></g></g></g>';
const flameShape = (cx: number, cy: number) => '<path class="sp-flame" d="M' + cx + ' ' + (cy + 4) + ' Q' + (cx - 11) + ' ' + (cy - 10) + ' ' + cx + ' ' + (cy - 30) + ' Q' + (cx + 11) + ' ' + (cy - 10) + ' ' + cx + ' ' + (cy + 4) + 'Z" fill="#ffb347"/><path class="sp-flame" d="M' + cx + ' ' + (cy + 2) + ' Q' + (cx - 5) + ' ' + (cy - 6) + ' ' + cx + ' ' + (cy - 16) + ' Q' + (cx + 5) + ' ' + (cy - 6) + ' ' + cx + ' ' + (cy + 2) + 'Z" fill="#fff0a0"/>';

function artMarkup(): string {
  const rng = mulberry32(12);
  let stars = '';
  for (let i = 0; i < 28; i++) stars += '<circle class="sp-twinkle' + (i % 4 === 0 ? ' tw' : '') + '" cx="' + (rng() * 400).toFixed(1) + '" cy="' + (rng() * 330).toFixed(1) + '" r="' + (0.7 + rng() * 1.3).toFixed(1) + '" fill="#fff6d0" style="animation-delay:-' + (rng() * 3).toFixed(2) + 's;opacity:' + (0.4 + (i % 3) * 0.25) + '"/>';
  let prints = '';
  for (let i = 0; i < 7; i++) {
    const x = 50 + i * 44, y = 636 + (i % 2 ? 16 : 0);
    prints += '<g class="sp-print" transform="translate(' + x + ' ' + y + ')"><ellipse cx="0" cy="0" rx="9" ry="7" fill="#1a1020" opacity=".6"/>' +
      [-9, -3, 3, 9].map(dx => '<circle cx="' + dx + '" cy="-11" r="2.6" fill="#1a1020" opacity=".6"/>').join('') + '</g>';
  }
  const bricks = (() => { let s = ''; for (let r = 0; r < 9; r++) { const y = 20 + r * 70; s += '<path d="M-20 ' + y + ' H420"/>'; for (let c = 0; c < 6; c++) s += '<path d="M' + (c * 80 + (r % 2 ? 40 : 0)) + ' ' + y + ' v70"/>'; } return s; })();
  const torch = (i: number) => {
    const [x, y] = TORCHES[i];
    return '<g id="spT' + i + '" transform="translate(' + x + ' ' + y + ')"><circle id="spG' + i + '" class="sp-hid" r="90" cy="-14" fill="url(#spFire)"/>' +
      '<path d="M-5 -4 L5 -4 L9 40 L-9 40Z" fill="#6a4a2a"/><path d="M-12 -4 H12 L8 6 H-8Z" fill="#8a6a3a"/>' +
      '<g id="spF' + i + '" class="sp-hid">' + flameShape(0, -6) + '</g><circle class="film-hit" cy="-12" r="34" fill="transparent"/></g>';
  };
  return '' +
    '<defs>' +
      '<radialGradient id="spGlow"><stop offset="0" stop-color="#fff1b0" stop-opacity=".85"/><stop offset="1" stop-color="#fff1b0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="spFire"><stop offset="0" stop-color="#ffb347" stop-opacity=".75"/><stop offset=".5" stop-color="#ff9a3c" stop-opacity=".25"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="spRed"><stop offset="0" stop-color="#e0213d" stop-opacity=".5"/><stop offset="1" stop-color="#e0213d" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="spNile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0e0"/><stop offset="1" stop-color="#3a9ab8"/></linearGradient>' +
    '</defs>' +
    /* ---- the camp at sunset (and, darker, at dusk) ---- */
    '<g class="fm for-camp for-unmask"><g class="for-camp-only"><circle cx="300" cy="430" r="120" fill="url(#spGlow)"/><circle cx="300" cy="438" r="34" fill="#ffe9a8"/></g>' +
      '<g class="for-unmask-only"><circle cx="90" cy="150" r="60" fill="url(#spGlow)" opacity=".5"/><circle cx="90" cy="150" r="22" fill="#fff0d0"/></g>' +
      '<g fill="#fff" opacity=".5"><ellipse cx="90" cy="170" rx="64" ry="14"/><ellipse cx="330" cy="230" rx="58" ry="12"/></g>' +
      pyr(20, 490, 95, 405) + pyr(260, 490, 335, 415) + pyr(110, 490, 220, 330) +
      '<rect x="-20" y="486" width="440" height="30" fill="url(#spNile)"/><path d="M-20 490 H420" stroke="#fff" stroke-width="2" opacity=".5"/>' +
      '<rect x="-20" y="512" width="440" height="190" fill="#e9c487"/><path d="M-20 600 Q100 580 220 596 T420 590 V700 H-20Z" fill="#d9a066"/>' +
      '<path d="M-14 540 L60 424 L134 540Z" fill="#fff0d4"/><path d="M60 424 L134 540 L60 540Z" fill="#e8d4b0"/><path d="M42 540 L60 484 L78 540Z" fill="#6a4a3a"/>' +
      '<g transform="translate(250 524)"><rect x="-34" y="0" width="68" height="8" rx="2" fill="#8a5a3a"/><rect x="-28" y="8" width="5" height="40" fill="#6a4a2a"/><rect x="23" y="8" width="5" height="40" fill="#6a4a2a"/></g></g>' +
    /* ---- the Sphinx by moonlight ---- */
    '<g class="fm for-sphinx"><circle cx="90" cy="140" r="90" fill="url(#spGlow)" opacity=".5"/><circle cx="90" cy="140" r="30" fill="#fff4d0"/><g>' + stars + '</g>' +
      pyr(250, 470, 300, 410).replace('#f0b878', '#6a5a8a').replace('#c98a5a', '#4a3a6a') + pyr(-20, 480, 40, 430).replace('#f0b878', '#6a5a8a').replace('#c98a5a', '#4a3a6a') +
      '<path d="M-20 490 Q120 460 240 484 T420 478 V700 H-20Z" fill="#7a6a8a"/><rect x="-20" y="520" width="440" height="180" fill="#8a7898"/><path d="M-20 590 Q100 570 220 586 T420 580 V700 H-20Z" fill="#76668a"/>' +
      '<g transform="translate(-46 0)"><path d="M70 522 Q58 452 120 442 Q200 430 252 452 L292 476 L352 510 L352 524 L70 524Z" fill="#c9a06a"/><rect x="266" y="498" width="86" height="26" rx="12" fill="#d9b07a"/><path d="M296 498 V524 M322 498 V524" stroke="#a9804a" stroke-width="2"/>' +
      '<path d="M246 340 Q292 296 338 340 L356 456 L246 470Z" fill="#a9804a"/><path d="M262 346 L252 464 M278 336 L270 466 M326 340 L338 460" stroke="#d9b07a" stroke-width="5" opacity=".7"/>' +
      '<ellipse cx="294" cy="402" rx="34" ry="44" fill="#e0b47a"/><path d="M290 410 Q282 424 296 432" fill="none" stroke="#a9804a" stroke-width="3" stroke-linecap="round"/><path d="M280 438 Q296 446 312 436" fill="none" stroke="#a9804a" stroke-width="3" stroke-linecap="round"/>' +
      '<g id="spEye" transform="translate(308 392)"><ellipse rx="11" ry="7" fill="#fff6e0"/><circle r="4.4" fill="#33295e"/><circle id="spEyeGlow" class="sp-hid" r="22" fill="url(#spGlow)"/>' +
        '<path id="spLidE" d="M-12 -2 Q0 -12 12 -2 L12 8 Q0 10 -12 8Z" fill="#e0b47a" stroke="#a9804a" stroke-width="2"/><circle class="film-hit" r="24" fill="transparent"/></g>' +
      '<g id="spLantern" class="sp-hid" transform="translate(326 508)"><circle r="34" cy="-4" fill="url(#spGlow)"/><path d="M-9 -16 Q0 -26 9 -16" fill="none" stroke="#6a4a2a" stroke-width="2"/><rect x="-8" y="-16" width="16" height="22" rx="4" fill="#ffcf6b" stroke="#6a4a2a" stroke-width="2"/>' +
        '<text x="0" y="-2" text-anchor="middle" font-size="5.2" font-weight="900" fill="#5a2f1d">LARRY</text></g>' +
      '<ellipse id="spSand" cx="326" cy="518" rx="34" ry="13" fill="#d9b88a"/></g></g>' +
    /* ---- the tomb ---- */
    '<g class="fm for-tomb"><rect x="-20" y="0" width="440" height="700" fill="#4a3a55"/><g stroke="#38294a" stroke-width="3" opacity=".8">' + bricks + '</g>' +
      '<rect x="-20" y="560" width="440" height="140" fill="#3a2d3f"/><path d="M-20 560 H420" stroke="#2a1d30" stroke-width="5"/>' +
      '<g fill="none" stroke="#d9b36a" stroke-width="3" opacity=".7"><ellipse cx="130" cy="230" rx="22" ry="12"/><circle cx="130" cy="230" r="5" fill="#d9b36a"/><path d="M104 244 Q120 262 136 250"/><path d="M270 200 l14 -28 l14 28 z M270 232 h30 M276 250 h18"/></g>' +
      '<rect x="96" y="474" width="210" height="76" rx="8" fill="#8a6a3a"/><rect x="96" y="474" width="210" height="10" fill="#d9b36a"/><path d="M96 520 H306" stroke="#d9b36a" stroke-width="4"/>' +
      '<ellipse cx="204" cy="464" rx="100" ry="20" fill="#efe3c8"/><path d="M130 470 Q150 450 170 468 M178 474 Q200 452 222 472 M230 474 Q250 452 270 470" fill="none" stroke="#cdbb98" stroke-width="3"/>' +
      '<circle cx="124" cy="458" r="22" fill="#efe3c8"/><path d="M110 456 q6 5 12 0 M128 456 q6 5 12 0" fill="none" stroke="#6a5a48" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g class="sp-zzz" fill="#d9d2f5" font-weight="900" font-size="15"><text x="148" y="430">z</text><text x="162" y="416" font-size="12">z</text></g>' +
      '<g id="spPrints">' + prints + '</g><rect id="spDark" x="-20" y="0" width="440" height="700" fill="#05030c" opacity="' + DARK[0] + '" pointer-events="none"/></g>' +
    '<g class="fm for-tomb">' + torch(0) + torch(1) + torch(2) + '</g>' +
    /* ---- everybody ---- */
    person('spLar', larryInner(), 0.42, SPOT.lar.camp) + person('spPas', pasqualeInner(), 0.55, SPOT.pas.camp) +
    '<g id="spBearPos" transform="translate(150 448)"><g id="spBear" class="sp-hid"><g id="spBearArt"></g>' +
      '<g id="spHat" transform="translate(0 2)"><path d="M18 22 Q52 34 86 22 Q86 14 52 14 Q18 14 18 22Z" fill="#3a3347"/><path d="M34 18 Q34 -8 52 -8 Q70 -8 70 18 Q52 24 34 18Z" fill="#4a4258"/><path d="M34 14 Q52 20 70 14 L70 18 Q52 24 34 18Z" fill="#e0213d"/><circle class="film-hit" cx="52" cy="8" r="38" fill="transparent"/></g></g></g>' +
    '<g id="spNoirPos" transform="translate(150 448)"><g id="spNoir" class="sp-hid"><circle cx="52" cy="70" r="78" fill="url(#spRed)"/><g id="spNoirArt" class="bear noirskin"></g></g></g>' +
    '<g class="fm for-camp for-unmask">' + palmTree(362, 565, 440, 10, 0.9) + '</g>' +
    /* ---- props that play a part ---- */
    '<g class="fm for-camp"><g id="spPot" transform="translate(268 524)"><g id="spSteam" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".7"><path class="sp-steam" d="M-8 -48 q-8 -14 0 -26"/><path class="sp-steam" style="animation-delay:-.8s" d="M8 -48 q8 -14 0 -26"/></g>' +
      '<path d="M-24 0 Q-30 -30 -20 -40 H20 Q30 -30 24 0Z" fill="#6a6a78"/><path d="M-30 -30 q-10 2 -6 10 M30 -30 q10 2 6 10" fill="none" stroke="#4a4a58" stroke-width="4" stroke-linecap="round"/>' +
      '<g id="spLid"><ellipse cx="0" cy="-42" rx="23" ry="6" fill="#8a8a9a"/><circle cx="0" cy="-49" r="4" fill="#4a4a58"/></g><circle class="film-hit" cx="0" cy="-26" r="40" fill="transparent"/></g>' +
      '<g id="spPage" transform="translate(214 524)"><path d="M-22 0 L-22 -14 L0 -10 L22 -14 L22 0Z" fill="#fff6e0" stroke="#8a5a3a" stroke-width="2"/><path d="M0 -10 L0 0" stroke="#8a5a3a" stroke-width="2"/>' +
        '<path d="M4 -10 L20 -12 L18 -6 L12 -8 L8 -3Z" fill="#d9a066" opacity=".55"/></g></g>' +
    '<g id="spEyes" class="sp-hid"><circle cx="350" cy="650" r="22" fill="url(#spGlow)"/><circle cx="342" cy="648" r="4.2" fill="#fff4c4"/><circle cx="358" cy="648" r="4.2" fill="#fff4c4"/></g>' +
    '<g id="spPuffs"></g>';
}

export const PyramidsScene = {
  els: {} as Record<string, HTMLElement>, film: late<Film>(),

  init() {
    const e = this.els;
    ['spaghettiFilm', 'spStage', 'spArt', 'spCap', 'spTitle', 'spTitleSmall', 'spTitleMain', 'spTitleSub', 'spFlash', 'spSkip'].forEach(id => { e[id] = $('#' + id); });
    this.film = new Film({ root: e.spaghettiFilm, skip: e.spSkip, cap: e.spCap, flash: e.spFlash });
  },

  /* the stage is built the first time a cinematic plays, so players who never reach chapter 12 never pay for it */
  built: false,
  ensure() {
    if (this.built) return;
    this.built = true;
    const e = this.els;
    e.spArt.innerHTML = artMarkup();
    ['spLarPos', 'spLar', 'spPasPos', 'spPas', 'spBearPos', 'spBear', 'spBearArt', 'spHat', 'spNoirPos', 'spNoir', 'spNoirArt', 'spPot', 'spLid', 'spSteam', 'spPage',
      'spEye', 'spEyeGlow', 'spLidE', 'spLantern', 'spSand', 'spDark', 'spPrints', 'spT0', 'spT1', 'spT2', 'spF0', 'spF1', 'spF2', 'spG0', 'spG1', 'spG2', 'spEyes', 'spPuffs']
      .forEach(id => { e[id] = $('#' + id); });
  },

  /* ----- small helpers (the same ones the Whisker Isles use) ----- */
  move(el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    const last = frames[frames.length - 1], s = (el as HTMLElement | SVGElement).style;
    if (typeof last.transform === 'string') s.transform = last.transform;
    if (last.opacity !== undefined && last.opacity !== null) s.opacity = String(last.opacity);
    return this.film.anim(el, frames, { fill: 'backwards', ...opts });
  },
  rise(id: string, delay = 0, duration = 800, dy = 10) {
    this.move(this.els[id], [{ opacity: 0, transform: 'translateY(' + dy + 'px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration, delay, easing: GLIDE });
  },
  show(id: string, on = true) { this.els[id].style.opacity = on ? '1' : '0'; },
  place(id: string, at: Pos) { this.els[id].style.transform = px(at[0], at[1]); },
  title(small: string, main: string, sub: string) { const e = this.els; e.spTitleSmall.textContent = small; e.spTitleMain.textContent = main; e.spTitleSub.textContent = sub; e.spTitle.classList.add('on'); },
  /* a puff of dust, or a few sparkles in `color`, at (x, y) */
  puff(x: number, y: number, n = 6, color = '#fff1d6') {
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (0.1 + 0.8 * (k / Math.max(1, n - 1))), d = 18 + (k % 3) * 9;
      const c = svgEl('circle', { cx: x, cy: y, r: 3.5 + (k % 3) * 1.6, fill: color });
      c.style.transformBox = 'fill-box';
      this.els.spPuffs.appendChild(c);
      const anim = this.film.anim(c, [{ transform: 'translate(0,0) scale(.5)', opacity: 0.95 }, { transform: 'translate(' + Math.round(Math.cos(a) * d * 1.4) + 'px,' + Math.round(-Math.sin(a) * d * 1.2) + 'px) scale(1.5)', opacity: 0 }],
        { duration: 700 + k * 40, easing: 'ease-out', fill: 'forwards' });
      if (anim) anim.onfinish = () => c.remove(); else c.remove();
    }
  },
  /* a tap moment: wait for the player (or the timeout), and give a little feedback when they did tap */
  async tapped(el: Element, ms: number): Promise<boolean> {
    const hit = await this.film.tap(el, ms);
    if (hit) { this.film.snd(() => SpaghettiScore.tap()); Haptics.found(); }
    return hit;
  },
  dressBears() { dressBear(this.els.spBearArt); dressBear(this.els.spNoirArt, NOIR_OUTFIT); },

  /* a clean stage in a mode */
  reset(mode: Mode) {
    this.ensure();
    const e = this.els;
    this.film.clearAnimations();
    e.spArt.setAttribute('class', 'sp-art m-' + mode);
    e.spStage.className = 'sp-stage sky-' + mode;
    ['spStage', 'spArt', 'spLar', 'spPas', 'spBear', 'spNoir', 'spHat', 'spLid', 'spEye', 'spLidE', 'spEyeGlow', 'spSand', 'spLantern', 'spPrints', 'spEyes', 'spPage',
      ...[0, 1, 2].flatMap(i => ['spF' + i, 'spG' + i])].forEach(id => { e[id].style.transform = ''; e[id].style.opacity = ''; });
    e.spDark.style.opacity = String(DARK[0]);
    Array.from(e.spPrints.children).forEach(p => { (p as HTMLElement | SVGElement).style.opacity = ''; });
    e.spPuffs.textContent = '';
    this.place('spBearPos', SPOT.bear[mode]); this.place('spNoirPos', SPOT.bear[mode]);
    this.place('spPasPos', SPOT.pas[mode]); this.place('spLarPos', SPOT.lar[mode]);
    e.spTitle.classList.remove('on');
    this.film.caption('');
  },

  /* ============================================ 1. THE CAMP KITCHEN (opens Case 12.1) ============================================ */
  settleCamp() {
    this.reset('camp');
    ['spBear', 'spPas', 'spLar'].forEach(id => this.show(id));
    this.els.spLid.style.transform = 'translate(34px,6px) rotate(26deg)';
  },

  async camp(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.camp;
    this.reset('camp'); this.dressBears(); f.open(first);
    if (REDUCED) {
      this.settleCamp(); this.title('CHAPTER 12', 'SPAGHETTI', 'chronicles of a lost recipe'); await f.wait(2800); await f.close();
    } else {
      SpaghettiScore.start();
      // 1. a chef and his pot
      f.caption('In the shadow of three great pyramids, a very small chef was cooking.');
      f.anim(e.spStage, [{ transform: 'scale(1.18) translate(0,3%)' }, { transform: 'scale(1)' }], { duration: 12000, easing: GLIDE, fill: 'backwards' });
      f.snd(() => { SpaghettiScore.pluck(); SpaghettiScore.bubble(); });
      this.rise('spPas', 200, 900);
      this.show('spBear'); this.place('spBearPos', [-110, 448]);
      this.move(e.spBearPos, [{ transform: px(-110, 448) }, { transform: px(...SPOT.bear.camp) }], { duration: 2800, easing: GLIDE, delay: 600 });
      f.snd(() => SpaghettiScore.steps(5));
      await f.wait(3600);
      // 2. the empty page
      f.caption('But the page with the secret sauce had been torn out of his recipe book.');
      f.anim(e.spPage, [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)', offset: 0.3 }, { transform: 'translateY(0)' }], { duration: 700, easing: SPRING });
      await f.wait(3200);
      // 3. TAP the pot
      f.caption('Tap the pot. Maybe the page fell in!');
      const hit = await this.tapped(e.spPot, 6500);
      this.move(e.spLid, [{ transform: 'translate(0,0) rotate(0deg)' }, { transform: 'translate(0,-46px) rotate(-14deg)', offset: 0.4 }, { transform: 'translate(34px,6px) rotate(26deg)' }], { duration: 900, easing: SPRING });
      f.snd(() => SpaghettiScore.pop());
      this.puff(268, 470, 8, '#ffffff');
      f.flashScreen(0.15, 600, 0.3);
      f.caption(hit ? 'POP! Only sauce. The page was never in there.' : 'The lid popped by itself. Only sauce. No page.');
      await f.wait(3200);
      // 4. a suspect
      f.caption('And behind the palm tree, two yellow eyes. Evil Larry?');
      this.rise('spLar', 0, 1000, 14);
      f.snd(() => SpaghettiScore.purr());
      await f.wait(3400);
      // 5. the title card
      f.caption('');
      this.title('CHAPTER 12', 'SPAGHETTI', 'chronicles of a lost recipe');
      f.snd(() => { SpaghettiScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleCamp();
      SpaghettiScore.stop();
      await f.close();
    }
    Store.data.seen.camp = true; Store.save();
  },

  /* ============================================ 2. THE SPHINX (opens Case 12.2) ============================================ */
  settleSphinx() {
    this.reset('sphinx');
    ['spBear', 'spPas', 'spLantern'].forEach(id => this.show(id));
    this.els.spLidE.style.opacity = '0'; this.show('spEyeGlow');
    this.els.spSand.style.opacity = '0';
  },

  async sphinx(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.sphinx;
    this.reset('sphinx'); this.dressBears(); f.open(first);
    if (REDUCED) {
      this.settleSphinx(); this.title('CASE 12.2', 'THE SPHINX', 'a very old question'); await f.wait(2800); await f.close();
    } else {
      SpaghettiScore.start();
      // 1. moonlight
      f.caption('By moonlight, the Great Sphinx watched over the sand.');
      f.anim(e.spStage, [{ transform: 'scale(1.2) translate(-4%,0)' }, { transform: 'scale(1)' }], { duration: 12000, easing: GLIDE, fill: 'backwards' });
      f.snd(() => SpaghettiScore.pluck());
      this.rise('spBear', 300, 900); this.rise('spPas', 700, 900);
      await f.wait(3400);
      // 2. the second page
      f.caption('The second page had vanished from right between her paws.');
      f.anim(e.spStage, [{ transform: 'scale(1)' }, { transform: 'scale(1.18) translate(-6%,-2%)' }], { duration: 5200, easing: 'ease-in-out', fill: 'forwards' });
      await f.wait(3200);
      // 3. TAP the eye
      f.caption('Tap her eye. Maybe she saw something.');
      const hit = await this.tapped(e.spEye, 6500);
      this.move(e.spLidE, [{ opacity: 1 }, { opacity: 0 }], { duration: 700 });
      this.move(e.spEyeGlow, [{ opacity: 0 }, { opacity: 1 }], { duration: 900 });
      f.snd(() => SpaghettiScore.glow());
      f.flashScreen(0.2, 800, 0.3);
      f.caption(hit ? 'Her eye glowed, and the sand began to slide.' : 'Her eye opened by itself, and the sand began to slide.');
      await f.wait(2600);
      this.move(e.spSand, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(26px)' }], { duration: 1800, easing: 'ease-in' });
      f.snd(() => SpaghettiScore.rumble());
      this.puff(280, 512, 8, '#e9c487');
      await f.wait(1600);
      this.move(e.spLantern, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 900, easing: GLIDE });
      f.snd(() => SpaghettiScore.tap());
      f.caption('A lantern with Evil Larry\'s name on it, in very neat letters.');
      await f.wait(3600);
      // 4. the title card
      f.caption('');
      this.title('CASE 12.2', 'THE SPHINX', 'a very old question');
      f.snd(() => { SpaghettiScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleSphinx();
      SpaghettiScore.stop();
      await f.close();
    }
    Store.data.seen.sphinx = true; Store.save();
  },

  /* ============================================ 3. THE TOMB (opens Case 12.3) ============================================ */
  settleTomb() {
    this.reset('tomb');
    ['spBear', 'spPas', 'spPrints', 'spF0', 'spF1', 'spF2', 'spG0', 'spG1', 'spG2'].forEach(id => this.show(id));
    this.els.spDark.style.opacity = String(DARK[3]);
  },

  /* torch i catches: its flame and glow come up, and the tomb gets lighter */
  lightTorch(i: number, lit: number) {
    const e = this.els;
    this.move(e['spF' + i], [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 500, easing: SPRING });
    this.move(e['spG' + i], [{ opacity: 0 }, { opacity: 1 }], { duration: 800 });
    this.film.anim(e.spDark, [{ opacity: Number(e.spDark.style.opacity) }, { opacity: DARK[lit] }], { duration: 800, fill: 'backwards' });
    e.spDark.style.opacity = String(DARK[lit]);
    this.film.snd(() => SpaghettiScore.torch());
    this.puff(TORCHES[i][0], TORCHES[i][1] - 20, 5, '#ffd27a');
  },

  async tomb(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, first = !Store.data.seen.tomb;
    this.reset('tomb'); this.dressBears(); f.open(first);
    if (REDUCED) {
      this.settleTomb(); this.title('CASE 12.3', 'WRAPPED IN MYSTERY', 'something is not so sleepy'); await f.wait(2800); await f.close();
    } else {
      SpaghettiScore.start();
      // 1. darkness
      f.caption('Under the pyramid, a tomb as dark as a closed book.');
      f.anim(e.spStage, [{ transform: 'scale(1.16) translateY(2%)' }, { transform: 'scale(1)' }], { duration: 12000, easing: GLIDE, fill: 'backwards' });
      f.snd(() => SpaghettiScore.rumble());
      this.show('spBear'); this.place('spBearPos', [-110, 490]);
      this.move(e.spBearPos, [{ transform: px(-110, 490) }, { transform: px(...SPOT.bear.tomb) }], { duration: 2800, easing: GLIDE, delay: 300 });
      f.snd(() => SpaghettiScore.steps(5));
      this.rise('spPas', 800, 900);
      await f.wait(3400);
      // 2. TAP the torches
      f.caption('Tap the torches to light the way!');
      for (let i = 0; i < 3; i++) {
        await this.tapped(e['spT' + i], 3800);
        this.lightTorch(i, i + 1);
        await f.wait(500);
      }
      // 3. the mummy, and the footprints
      f.caption('The mummy slept on, wrapped up tight. But something had walked right past him.');
      await f.wait(2600);
      this.show('spPrints');
      Array.from(e.spPrints.children).forEach((p, i) => { f.anim(p, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: i * 360, easing: 'ease-out', fill: 'backwards' }); });
      f.snd(() => SpaghettiScore.steps(7));
      f.caption('Footprints in the dust. Bear-sized, and very hard to place.');
      await f.wait(4200);
      // 4. the title card
      f.caption('');
      this.title('CASE 12.3', 'WRAPPED IN MYSTERY', 'something is not so sleepy');
      f.snd(() => { SpaghettiScore.title(); Haptics.win(); });
      await f.wait(3400);
      if (f.fast) this.settleTomb();
      SpaghettiScore.stop();
      await f.close();
    }
    Store.data.seen.tomb = true; Store.save();
  },

  /* ============================================ 4. THE UNMASKING (after Case 12.4) ============================================ */
  settleUnmask() {
    this.reset('unmask');
    ['spNoir', 'spPas', 'spLar', 'spEyes'].forEach(id => this.show(id));
  },

  async unmask(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els;
    this.reset('unmask'); this.dressBears(); f.open(false);
    if (REDUCED) {
      this.settleUnmask(); f.caption('The last disguise comes off. Barnaby Noir!'); await f.wait(2800); await f.close(); return;
    }
    SpaghettiScore.start();
    // 1. the chef's tent at dusk
    f.caption('At the chef\'s tent, the last page was gone, and everybody wanted somebody to blame.');
    f.anim(e.spStage, [{ transform: 'scale(1.16) translateY(3%)' }, { transform: 'scale(1)' }], { duration: 12000, easing: GLIDE, fill: 'backwards' });
    f.snd(() => SpaghettiScore.pluck());
    this.rise('spPas'); this.rise('spBear', 300); this.rise('spLar', 600);
    await f.wait(3400);
    // 2. Larry points
    f.caption('Larry pointed a very striped paw at the detective.');
    f.anim(e.spLar, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px) rotate(-6deg)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: 700, iterations: 2, easing: SPRING });
    await f.wait(2800);
    // 3. TAP the fedora
    f.caption('Tap the fedora!');
    const hit = await this.tapped(e.spHat, 6500);
    f.caption(hit ? 'Off came the hat, and off came the disguise.' : 'The hat slipped by itself, and so did the disguise.');
    this.move(e.spHat, [{ transform: 'translate(0,2px) rotate(0deg)', opacity: 1 }, { transform: 'translate(60px,-120px) rotate(540deg)', opacity: 0 }], { duration: 1100, easing: 'ease-out' });
    f.snd(() => SpaghettiScore.zing());
    await f.wait(700);
    f.flashScreen(0.55, 1200, 0.2);
    f.snd(() => { SpaghettiScore.noir(); Haptics.win(); });
    this.move(e.spBear, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
    this.move(e.spNoir, [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 700, easing: SPRING });
    this.puff(202, 470, 8, '#e0213d');
    await f.wait(3000);
    // 4. a pair of eyes in the sand
    f.caption('And in the sand, two little eyes began to glow...');
    this.move(e.spEyes, [{ opacity: 0 }, { opacity: 1 }], { duration: 900 });
    f.snd(() => SpaghettiScore.purr());
    await f.wait(3200);
    // 5. the title card
    f.caption('');
    this.title('CASE 12.4', 'THE UNMASKING', 'the last disguise comes off');
    f.snd(() => { SpaghettiScore.title(); Haptics.win(); });
    await f.wait(3400);
    if (f.fast) this.settleUnmask();
    SpaghettiScore.stop();
    await f.close();
  }
};

/* levels reach these cinematics through core/scenes.ts: scenes.camp opens 12.1 and its caught() is the unmasking after 12.4 */
scenes.camp = wrap(() => PyramidsScene.camp(), () => PyramidsScene.unmask());
scenes.sphinx = wrap(() => PyramidsScene.sphinx());
scenes.tomb = wrap(() => PyramidsScene.tomb());
