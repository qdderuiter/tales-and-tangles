import { bearMarkup } from '../characters/barnaby-svg.ts';
import { CAT_COATS, MICE, YARN, catInner, mouseInner, yarnBall } from '../characters/cats.ts';
import { mittensInner } from '../characters/mittens.ts';
import { rocketInner } from '../characters/pup.ts';
import { HERD, boingBall, dinoInner } from '../characters/dino.ts';
import { elephantInner, starBall } from '../characters/elephant.ts';
import { larryInner } from '../characters/larry.ts';
import { rockyInner } from '../characters/rocky.ts';
import { tigerInner } from '../characters/tiger.ts';
import { wormInner } from '../characters/worm.ts';
import { FILM_LAYERS } from '../data/chapters.ts';
import type { Motif } from '../data/types.ts';
import { mulberry32 } from '../core/util.ts';
import { Store } from '../state/store.ts';
import type { Film } from './film.ts';

/* ---------- the stage art for the chapter films, and the picture on each chapter card of the map ----------
   A stage is a stack of layers (ids listed per motif in data/chapters.ts, back to front). Each layer is one inline SVG on a shared
   800 x 1000 canvas, so a camera move can pan / zoom every layer by its own depth (far layers move less: parallax).
   Everything moves with CSS (transform / opacity only). The same layers drawn static and cropped to a wide strip are the card art on the map. */

const VIEW = '0 0 800 1000';
/* the crop each motif's card shows (the whole hero scene; the sky, hills and sea run past it, so a wide card has no empty sides) */
const BAND_VIEWS: Record<Motif, string> = { meadow: '120 470 600 330', night: '150 400 600 400', sea: '150 360 600 420', lantern: '120 450 600 360', space: '130 380 600 400', desert: '110 400 620 440', bigtop: '110 400 580 560', meteor: '110 420 600 520', island: '110 430 600 430', underground: '110 560 640 380', cats: '200 520 400 410' };

/* how far each layer follows the camera (0 = fixed, 1 = full) */
const DEPTH: Record<string, number> = {
  sky: 0.1, sun: 0.15, moon: 0.15, stars: 0.18, clouds: 0.3, hills: 0.4, sea: 0.5, town: 0.5, lighthouse: 0.6, beam: 0.6, library: 0.7,
  garden: 0.85, flowers: 0.9, lamps: 0.75, bees: 0.8, lanterns: 0.8, rooftop: 1, larry: 1, barnaby: 1, cake: 1, candles: 1, snow: 1, globe: 0, planet: 0.2, home: 0.2, trail: 0.6, rocket: 0.6,
  dunes: 0.8, caravan: 0.82, palms: 0.85, pool: 0.85, house: 0.85,
  tent: 0.7, flags: 0.72, lights: 0.75, crowd: 0.9, ring: 0.95, ball: 1, pippy: 1,
  dinos: 0.95, burst: 0.3,
  crystals: 0.35, rubble: 0.9, drill: 0.85, crew: 0.9, rocky: 1,
  island: 0.7, wreck: 0.85, tiger: 0.95, hole: 0.9, fire: 0.95, ship: 0.55,
  yarn: 0.92, mice: 0.95, cats: 0.95, kittens: 1
};

/* what the map card shows for each motif: the finished-scene layers only */
export const BAND_LAYERS: Record<Motif, string[]> = {
  meadow: ['sky', 'sun', 'hills', 'library', 'lamps'],
  night: ['sky', 'stars', 'moon', 'town'],
  sea: ['sky', 'sea', 'lighthouse', 'beam'],
  lantern: ['sky', 'stars', 'town', 'lanterns'],
  space: ['sky', 'stars', 'planet', 'hills', 'home', 'rocket'],
  desert: ['sky', 'stars', 'moon', 'dunes', 'palms', 'pool', 'house'],
  bigtop: ['sky', 'stars', 'tent', 'flags', 'lights', 'crowd', 'ring', 'ball', 'pippy'],
  meteor: ['sky', 'sun', 'stars', 'hills', 'dinos', 'burst', 'ball'],
  underground: ['sky', 'crystals', 'house', 'lamps', 'rocky'],
  island: ['sky', 'sea', 'island', 'palms', 'wreck'],
  cats: ['sky', 'sun', 'hills', 'town', 'lanterns', 'cats']
};


/* a palm tree: a leaning trunk, a crown of fronds and a few coconuts */
export function palmTree(x: number, base: number, top: number, bend: number, scale: number, shade = 0): string {
  const cx = x + bend * 0.4, g1 = shade ? '#2a7a58' : '#3aa07a', g2 = shade ? '#226a4a' : '#2f8a6a';
  let fronds = '';
  for (let k = 0; k < 7; k++) fronds += '<path d="M0 0 Q42 -34 100 -6 Q46 -16 0 0Z" fill="' + (k % 2 ? g2 : g1) + '" transform="rotate(' + (-160 + k * 22) + ')"/>';
  return '<path d="M' + x + ' ' + base + ' Q' + (x + bend) + ' ' + r1(base - (base - top) * 0.55) + ' ' + r1(cx) + ' ' + top + '" fill="none" stroke="#6b4a3a" stroke-width="' + r1(12 * scale + 4) + '" stroke-linecap="round"/>' +
    '<g transform="translate(' + r1(cx) + ' ' + top + ') scale(' + scale + ')"><g class="cf-sway">' + fronds + '<circle cx="-4" cy="8" r="7" fill="#6b4a2a"/><circle cx="8" cy="10" r="7" fill="#7a5532"/></g></g>';
}

let uid = 0;
const svg = (inner: string, vb: string) => '<svg viewBox="' + vb + '" preserveAspectRatio="' + (vb === VIEW ? 'xMidYMid slice' : 'xMidYMid meet') + '" aria-hidden="true">' + inner + '</svg>';
const grad = (id: string, stops: [number, string][], dir = 'x1="0" y1="0" x2="0" y2="1"') =>
  '<linearGradient id="' + id + '" ' + dir + '>' + stops.map(([o, c]) => '<stop offset="' + o + '" stop-color="' + c + '"/>').join('') + '</linearGradient>';
const r1 = (n: number) => Math.round(n * 10) / 10;
/* a soft pool of light (flat discs would show their edges): define the gradient once per layer, then paint circles with it */
const glowDef = (id: string, color: string, opacity: number) =>
  '<radialGradient id="' + id + '"><stop offset="0" stop-color="' + color + '" stop-opacity="' + opacity + '"/><stop offset=".55" stop-color="' + color + '" stop-opacity="' + r1(opacity * 0.35) + '"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient>';
const glow = (id: string, cx: number, cy: number, r: number) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + id + ')"/>';
/* a sky that runs well past the canvas, so panning and zooming never show an edge */
const skyRect = (id: string) => '<rect x="-300" y="-300" width="1400" height="1700" fill="url(#' + id + ')"/>';

/* a row of buildings along a baseline: rooftops, and some lit windows */
function skyline(rng: () => number, color: string, base: number, minH: number, maxH: number, lit: number): string {
  let out = '', x = -10;
  while (x < 810) {
    const w = 46 + rng() * 40, h = minH + rng() * (maxH - minH), top = base - h;
    out += '<rect x="' + r1(x) + '" y="' + r1(top) + '" width="' + r1(w) + '" height="' + (h + 40) + '" fill="' + color + '"/>';
    if (rng() < 0.55) out += '<path d="M' + r1(x - 4) + ' ' + r1(top) + ' L' + r1(x + w / 2) + ' ' + r1(top - w * 0.4) + ' L' + r1(x + w + 4) + ' ' + r1(top) + 'Z" fill="' + color + '"/>';
    for (let wy = top + 14; wy < base - 8; wy += 22) for (let wx = x + 9; wx < x + w - 12; wx += 20) {
      if (rng() < lit) out += '<rect x="' + r1(wx) + '" y="' + r1(wy) + '" width="9" height="12" rx="2" fill="#ffd98a"/>';
    }
    x += w + 2 + rng() * 6;
  }
  return out;
}

function starField(count: number, seed: number, maxY: number): string {
  const rng = mulberry32(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    out += '<circle class="cf-star" style="--i:' + i + '" cx="' + r1(20 + rng() * 760) + '" cy="' + r1(30 + rng() * maxY) + '" r="' + r1(1.4 + rng() * 2.2) + '" fill="#fff6d0"/>';
  }
  return out;
}

function flower(x: number, y: number, i: number, color: string): string {
  let petals = '';
  for (let k = 0; k < 5; k++) { const a = (k * 72 - 90) * Math.PI / 180; petals += '<circle cx="' + r1(Math.cos(a) * 11) + '" cy="' + r1(Math.sin(a) * 11) + '" r="8" fill="' + color + '"/>'; }
  return '<g transform="translate(' + x + ' ' + y + ')"><g class="cf-fl" style="--i:' + i + '"><path d="M0 0 V40" stroke="#5f8f4a" stroke-width="4" stroke-linecap="round"/>' + petals + '<circle r="7" fill="#fff2c0"/></g></g>';
}

type LayerFn = (u: string, vb: string) => string;

const ART: Record<Motif, Record<string, LayerFn>> = {
  /* ---- a sunset meadow: Honeywick ---- */
  meadow: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.2, '#ffd9a8'], [0.62, '#ffb995'], [0.9, '#f29f9d']]) + '</defs>' + skyRect(u + 's'), vb),
    sun: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#fff0b8', 0.8) + '</defs>' + glow(u + 'g', 280, 610, 340) + '<circle cx="280" cy="610" r="78" fill="#fff6d2"/>', vb),
    hills: (_u, vb) => svg('<path d="M-300 700 Q150 600 330 680 T620 650 T1100 690 V1300 H-300Z" fill="#e8a27c"/><path d="M-300 775 Q220 680 470 760 T1100 730 V1300 H-300Z" fill="#b5c47f"/><path d="M-300 855 Q260 790 560 842 T1100 830 V1300 H-300Z" fill="#8fb36a"/><rect x="-300" y="900" width="1400" height="400" fill="#79a35e"/>', vb),
    garden: (_u, vb) => {
      let posts = '';
      for (let x = 150; x <= 650; x += 70) posts += '<rect x="' + x + '" y="805" width="14" height="74" rx="5"/>';
      return svg('<g fill="#c8956a">' + posts + '<rect x="140" y="822" width="534" height="9" rx="4"/><rect x="140" y="850" width="534" height="9" rx="4"/></g><ellipse cx="400" cy="930" rx="300" ry="30" fill="#7a5638"/><ellipse cx="400" cy="930" rx="276" ry="22" fill="#8a6342"/>', vb);
    },
    flowers: (_u, vb) => {
      const rng = mulberry32(5), colors = ['#f4a3b8', '#ffd36b', '#b9a7ea', '#ff9f80'];
      let out = '';
      for (let i = 0; i < 14; i++) out += flower(r1(150 + (i / 13) * 500 + (rng() - 0.5) * 16), r1(884 + rng() * 26), i, colors[i % colors.length]);
      return svg(out, vb);
    },
    bees: (_u, vb) => {                      // one loose trail of bees, flying home together
      let out = '';
      for (let i = 0; i < 6; i++) out += '<text class="cf-bee" x="0" y="' + (500 + (i % 3) * 52 + i * 12) + '" font-size="30" style="animation-delay:-' + r1(i * 0.9) + 's">🐝</text>';
      return svg(out, vb);
    },
    library: (_u, vb) => svg('<rect x="485" y="640" width="150" height="140" rx="8" fill="#d79a74"/><path d="M468 646 L560 584 L652 646Z" fill="#9b5f45"/><rect x="518" y="676" width="40" height="52" rx="6" fill="#8a6a52" stroke="#7a4a35" stroke-width="5"/><rect x="576" y="692" width="36" height="88" rx="18" fill="#8a5a3c"/>', vb),
    lamps: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#ffe29a', 0.8) + '</defs>' + glow(u + 'g', 538, 702, 120) + '<rect x="518" y="676" width="40" height="52" rx="6" fill="#ffe29a" stroke="#7a4a35" stroke-width="5"/>' +
      [200, 410].map(x => '<rect x="' + (x - 3) + '" y="694" width="6" height="96" fill="#6b4a35"/><g class="cf-halo">' + glow(u + 'g', x, 684, 86) + '</g><circle cx="' + x + '" cy="684" r="15" fill="#ffe6a0"/>').join(''), vb)
  },

  /* ---- a night sky coming back to life: the moon and the cake ---- */
  night: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.2, '#231d5a'], [0.62, '#5a3f8f'], [0.92, '#e68f9f']]) + '</defs>' + skyRect(u + 's'), vb),
    stars: (_u, vb) => svg(starField(46, 11, 560), vb),
    moon: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#fff1c0', 0.55) + '</defs>' + glow(u + 'g', 500, 500, 300) + '<circle cx="500" cy="500" r="96" fill="#fff5d3"/><circle cx="472" cy="476" r="16" fill="#f1dca6" opacity=".7"/><circle cx="528" cy="522" r="22" fill="#f1dca6" opacity=".6"/><circle cx="490" cy="540" r="9" fill="#f1dca6" opacity=".7"/>', vb),
    clouds: (_u, vb) => svg('<g class="cf-cloud" fill="#8f78b8" opacity=".5"><ellipse cx="230" cy="380" rx="120" ry="26"/><ellipse cx="310" cy="362" rx="80" ry="24"/></g><g class="cf-cloud b" fill="#8f78b8" opacity=".42"><ellipse cx="600" cy="300" rx="110" ry="22"/><ellipse cx="660" cy="286" rx="70" ry="20"/></g>', vb),
    town: (u, vb) => {
      const rng = mulberry32(21);
      return svg('<defs>' + glowDef(u + 'g', '#ffe9a8', 0.7) + '</defs>' + skyline(rng, '#3b2d72', 790, 50, 130, 0.35) + skyline(rng, '#261c52', 860, 40, 110, 0.4) +
        '<rect x="326" y="560" width="68" height="320" fill="#2a2058"/><path d="M318 562 L360 500 L402 562Z" fill="#2a2058"/>' + glow(u + 'g', 360, 606, 70) + '<circle cx="360" cy="606" r="22" fill="#ffe9a8"/><path d="M360 606 V592 M360 606 L370 612" stroke="#2a2058" stroke-width="3" stroke-linecap="round"/><rect x="-300" y="860" width="1400" height="400" fill="#1b1440"/>', vb);
    },
    cake: (_u, vb) => svg('<ellipse cx="400" cy="852" rx="182" ry="22" fill="#f3e7ff"/><rect x="300" y="786" width="200" height="66" rx="14" fill="#f9c6d4"/><rect x="330" y="738" width="140" height="52" rx="12" fill="#fbe0e8"/><rect x="362" y="698" width="76" height="44" rx="10" fill="#f9c6d4"/>' +
      '<path d="M300 800 q12 22 24 0 q12 24 24 0 q12 20 24 0 q12 24 24 0 q12 20 24 0 q12 24 24 0 q12 20 24 0 q12 24 24 0" fill="#fff5f8"/>' +
      [372, 400, 428].map(x => '<circle cx="' + x + '" cy="698" r="8" fill="#e5484d"/>').join(''), vb),
    candles: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#ffd98a', 0.7) + '</defs>' + [374, 387, 400, 413, 426].map((x, i) => '<rect x="' + (x - 3) + '" y="662" width="6" height="30" rx="2" fill="' + (i % 2 ? '#8fd0f0' : '#ffd36b') + '"/><ellipse class="cf-flame" style="animation-delay:-' + i * 0.07 + 's" cx="' + x + '" cy="652" rx="5" ry="10" fill="#ffb347"/>' + glow(u + 'g', x, 652, 34)).join(''), vb)
  },

  /* ---- dusk over the sea, then a snow globe: the lighthouse and the snow ---- */
  sea: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.2, '#2f4b78'], [0.58, '#6f8fc0'], [0.92, '#f4b99a']]) + '</defs>' + skyRect(u + 's'), vb),
    sea: (u, vb) => {
      const wave = (y: number, c: string, o: number, cls: string) => '<path class="cf-wave ' + cls + '" d="M-300 ' + y + ' Q-240 ' + (y - 14) + ' -180 ' + y + ' T-60 ' + y + ' T60 ' + y + ' T180 ' + y + ' T300 ' + y + ' T420 ' + y + ' T540 ' + y + ' T660 ' + y + ' T780 ' + y + ' T900 ' + y + ' T1020 ' + y + ' T1140 ' + y + ' V1300 H-300Z" fill="' + c + '" opacity="' + o + '"/>';
      return svg('<defs>' + grad(u + 'w', [[0, '#2d628f'], [1, '#17375a']]) + '</defs><rect x="-300" y="700" width="1400" height="600" fill="url(#' + u + 'w)"/>' +
        wave(738, '#3b78a8', 0.55, 'w1') + wave(792, '#3b78a8', 0.45, 'w2') + wave(856, '#4a8dbd', 0.4, 'w3') +
        '<path d="M380 718 h60 M330 738 h40 M470 726 h50" stroke="#fff3c8" stroke-width="3" stroke-linecap="round" opacity=".5"/>', vb);
    },
    lighthouse: (_u, vb) => {
      const xl = (y: number) => 598 - 13 * (y - 470) / 235, xr = (y: number) => 642 + 13 * (y - 470) / 235;
      const band = (a: number, b: number) => '<path d="M' + r1(xl(a)) + ' ' + a + ' H' + r1(xr(a)) + ' L' + r1(xr(b)) + ' ' + b + ' H' + r1(xl(b)) + 'Z" fill="#d94f4f"/>';
      return svg('<g transform="translate(-130 0)"><path d="M500 790 Q550 700 620 700 Q700 700 740 790Z" fill="#3a3550"/><path d="M585 705 L598 470 H642 L655 705Z" fill="#f6efe6"/>' + band(520, 560) + band(600, 640) +
        '<rect x="580" y="452" width="80" height="12" rx="4" fill="#4a4568"/><rect x="598" y="404" width="44" height="48" rx="6" fill="#8d97ad"/><rect x="606" y="412" width="28" height="32" rx="4" fill="#5d6781"/><path d="M590 408 L620 372 L650 408Z" fill="#d94f4f"/></g>', vb);
    },
    beam: (u, vb) => svg('<g transform="translate(-130 0)"><defs><linearGradient id="' + u + 'b" gradientUnits="userSpaceOnUse" x1="620" y1="0" x2="-200" y2="0"><stop offset="0" stop-color="#fff4be" stop-opacity=".9"/><stop offset="1" stop-color="#fff4be" stop-opacity="0"/></linearGradient>' + glowDef(u + 'g', '#fff4be', 0.7) + '</defs>' +
      '<g class="cf-sweep"><path d="M620 428 L-240 330 L-240 540Z" fill="url(#' + u + 'b)"/></g>' + glow(u + 'g', 620, 428, 130) + '<rect x="606" y="412" width="28" height="32" rx="4" fill="#fff6c8"/></g>', vb),
    snow: (_u, vb) => {
      const rng = mulberry32(31);
      let out = '';
      for (let i = 0; i < 38; i++) out += '<circle class="cf-flake" cx="' + r1(rng() * 800) + '" cy="0" r="' + r1(2 + rng() * 3.4) + '" fill="#fff" style="--sw:' + Math.round((rng() - 0.5) * 120) + 'px;animation-duration:' + r1(6 + rng() * 5) + 's;animation-delay:-' + r1(rng() * 11) + 's"/>';
      return svg(out, vb);
    },
    globe: () => '<div class="cf-globe"><div class="gl-glass"></div><div class="gl-base"></div></div>'
  },

  /* ---- paper lanterns over the market and the carnival: Larry's night ---- */
  lantern: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.2, '#1a1740'], [0.62, '#4a2f6b'], [0.93, '#e07d5a']]) + '</defs>' + skyRect(u + 's'), vb),
    stars: (_u, vb) => svg(starField(30, 7, 480), vb),
    town: (_u, vb) => {
      const rng = mulberry32(44), stripes = (cx: number, apexY: number, baseY: number, half: number, n: number) => {
        let out = '';
        for (let k = 0; k < n; k++) out += '<path d="M' + cx + ' ' + apexY + ' L' + r1(cx - half + (2 * half / n) * k) + ' ' + baseY + ' L' + r1(cx - half + (2 * half / n) * (k + 1)) + ' ' + baseY + 'Z" fill="' + (k % 2 ? '#f3d9b0' : '#d96b4a') + '"/>';
        return out;
      };
      let stalls = '';
      for (let s = 0; s < 3; s++) {
        const x = 400 + s * 100;
        stalls += '<rect x="' + (x + 6) + '" y="740" width="5" height="46" fill="#3a2a55"/><rect x="' + (x + 79) + '" y="740" width="5" height="46" fill="#3a2a55"/>' + stripes(x + 45, 722, 752, 48, 6) + '<rect x="' + (x + 14) + '" y="760" width="62" height="26" rx="4" fill="#ffd98a" opacity=".85"/>';
      }
      return svg(skyline(rng, '#342558', 770, 40, 120, 0.3) +
        '<rect x="190" y="716" width="120" height="68" fill="#d96b4a"/>' + [0, 1, 2, 3, 4, 5].map(k => '<rect x="' + (190 + k * 20) + '" y="716" width="10" height="68" fill="#f3d9b0"/>').join('') + stripes(250, 640, 718, 84, 8) + '<path d="M250 640 V612" stroke="#3a2a55" stroke-width="3"/><path d="M250 612 L278 622 L250 632Z" fill="#e5484d"/>' +
        stalls + '<rect x="-300" y="780" width="1400" height="420" fill="#1d1438"/>' +
        '<path d="M300 700 Q360 740 420 704 T540 704" fill="none" stroke="#3a2a55" stroke-width="2"/>' + [330, 370, 410, 470, 520].map(x => '<circle cx="' + x + '" cy="' + (x < 430 ? 724 : 708) + '" r="6" fill="#ffd98a"/>').join(''), vb);
    },
    rooftop: (_u, vb) => svg('<path d="M-300 920 L260 840 L1100 840 V1300 H-300Z" fill="#150f2b"/><rect x="620" y="740" width="64" height="110" fill="#1d1438"/><rect x="612" y="730" width="80" height="16" rx="3" fill="#251a47"/><path d="M-300 920 L260 840 M-300 955 L260 878" stroke="#251a47" stroke-width="3"/>', vb),
    lanterns: (u, vb) => {
      const rng = mulberry32(61);
      let out = '<defs>' + glowDef(u + 'g', '#ffb347', 0.6) + '</defs>';
      for (let i = 0; i < 16; i++) {
        const x = r1(70 + rng() * 660), y = r1(560 + rng() * 400), s = r1(0.7 + rng() * 0.7);
        out += '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="cf-plan" style="animation-duration:' + r1(20 + rng() * 10) + 's;animation-delay:-' + r1(rng() * 4) + 's">' + glow(u + 'g', 0, 0, 62) + '<ellipse rx="17" ry="23" fill="#ffb347"/><ellipse rx="10" ry="19" fill="#ffd98a"/><rect x="-9" y="22" width="18" height="5" rx="2" fill="#8a4a2a"/><rect x="-7" y="-27" width="14" height="5" rx="2" fill="#8a4a2a"/></g></g>';
      }
      return svg(out, vb);
    },
    /* Evil Larry as a silhouette with glowing eyes and a curled tail, sitting on the roof ridge */
    larry: (_u, vb) => svg('<g fill="#05030a"><ellipse cx="470" cy="822" rx="26" ry="20"/><circle cx="470" cy="790" r="15"/><path d="M458 782 L460 764 L469 777Z M482 782 L480 764 L471 777Z"/><path d="M494 832 Q530 830 522 800 Q518 786 506 790" fill="none" stroke="#05030a" stroke-width="8" stroke-linecap="round"/></g><ellipse cx="464" cy="789" rx="3.5" ry="2.5" fill="#e8f04a"/><ellipse cx="476" cy="789" rx="3.5" ry="2.5" fill="#e8f04a"/>', vb),
    barnaby: () => '<div class="cf-bear"><div class="cf-bear-glow"></div>' + bearMarkup(Store.data.wardrobe.equipped) + '</div>'
  },

  /* ---- a night sky over Honeywick, and a small planet far away: Pickle goes home ---- */
  space: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.2, '#120f3a'], [0.6, '#3a2a78'], [0.92, '#c96aa0']]) + '</defs>' + skyRect(u + 's'), vb),
    stars: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#fff6d0', 0.8) + '</defs>' + starField(60, 91, 600) + glow(u + 'g', 250, 470, 60) + '<path d="M250 440 L255 465 L280 470 L255 475 L250 500 L245 475 L220 470 L245 465Z" fill="#fff6d0"/>', vb),
    planet: (u, vb) => svg('<defs>' + grad(u + 'p', [[0, '#8fe9cf'], [1, '#3f8fae']], 'x1="0" y1="0" x2="1" y2="1"') + glowDef(u + 'g', '#9ff3d0', 0.4) + '</defs>' + glow(u + 'g', 540, 500, 220) +
      '<ellipse cx="540" cy="500" rx="190" ry="34" fill="none" stroke="#c9b8ff" stroke-width="10" opacity=".55" transform="rotate(-14 540 500)"/><circle cx="540" cy="500" r="120" fill="url(#' + u + 'p)"/>' +
      '<circle cx="500" cy="462" r="16" fill="#6cc9b0" opacity=".7"/><circle cx="580" cy="540" r="22" fill="#6cc9b0" opacity=".6"/><circle cx="520" cy="552" r="9" fill="#6cc9b0" opacity=".7"/>' +
      '<path d="M350 520 Q540 560 730 480" fill="none" stroke="#c9b8ff" stroke-width="10" opacity=".55" transform="rotate(-14 540 500)" clip-path="inset(50% 0 0 0)"/>', vb),
    hills: (_u, vb) => svg('<path d="M-300 800 Q100 720 330 770 T700 750 T1100 790 V1300 H-300Z" fill="#2a2766"/><path d="M-300 880 Q200 810 470 860 T1100 850 V1300 H-300Z" fill="#1c1a52"/><rect x="-300" y="930" width="1400" height="400" fill="#14123f"/>' +
      '<rect x="560" y="770" width="70" height="56" rx="6" fill="#3b3580"/><path d="M552 774 L595 738 L638 774Z" fill="#241f60"/><rect x="584" y="790" width="22" height="30" rx="4" fill="#ffd98a"/>', vb),
    home: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#ffe29a', 0.7) + '</defs>' + [[500, 470], [535, 486], [566, 466], [520, 520], [558, 524], [588, 500]].map(([x, y], i) =>
      '<g class="cf-halo">' + glow(u + 'g', x, y, 26) + '</g><rect x="' + (x - 5) + '" y="' + (y - 7) + '" width="10" height="14" rx="2" fill="#ffe6a0" style="animation-delay:-' + i * 0.4 + 's"/>').join(''), vb),
    barnaby: () => '<div class="cf-bear sp"><div class="cf-bear-glow"></div>' + bearMarkup(Store.data.wardrobe.equipped) + '</div>',
    trail: (_u, vb) => {
      let out = '';
      for (let i = 0; i < 18; i++) {
        const t = i / 17, x = r1(60 + t * 290), y = r1(700 - t * 120 - Math.sin(t * Math.PI) * 90);
        out += '<circle class="cf-star" style="--i:' + i + '" cx="' + x + '" cy="' + y + '" r="' + r1(2 + (1 - t) * 3) + '" fill="#fff0a8"/>';
      }
      return svg(out, vb);
    },
    rocket: (u, vb) => svg('<g transform="translate(300 520) scale(.62)"><g class="cf-fly"><g class="open">' + rocketInner(u) + '</g></g></g>', vb)
  },

  /* ---- a midnight desert: a sleeping caravan, an oasis, and Biscuit's little round house ---- */
  desert: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.2, '#16123d'], [0.55, '#4a3480'], [0.8, '#b86aa0'], [0.95, '#f2a97c']]) + '</defs>' + skyRect(u + 's'), vb),
    stars: (_u, vb) => svg(starField(64, 61, 440), vb),
    moon: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#fff1c0', 0.5) + '</defs>' + glow(u + 'g', 230, 470, 300) + '<circle cx="230" cy="470" r="88" fill="#fff3cf"/><circle cx="204" cy="448" r="15" fill="#f1dca6" opacity=".7"/><circle cx="256" cy="494" r="21" fill="#f1dca6" opacity=".6"/><circle cx="262" cy="440" r="8" fill="#f1dca6" opacity=".6"/>', vb),
    dunes: (_u, vb) => svg('<path d="M-300 690 Q-60 610 200 660 T560 650 T1100 680 V1300 H-300Z" fill="#6b4a88"/><path d="M-300 760 Q120 690 420 750 T1100 740 V1300 H-300Z" fill="#a35f7e"/>' +
      '<path d="M-300 850 Q200 790 520 840 T1100 830 V1300 H-300Z" fill="#d98c6e"/><path d="M-300 930 Q260 880 600 925 T1100 915 V1300 H-300Z" fill="#c97a5e"/>' +
      '<path d="M-300 850 Q200 790 520 840 T1100 830" fill="none" stroke="#ffd9a8" stroke-width="5" opacity=".35"/><path d="M-300 760 Q120 690 420 750 T1100 740" fill="none" stroke="#ffc6b0" stroke-width="4" opacity=".28"/>', vb),
    caravan: (u, vb) => {
      const camel = (x: number, y: number, s: number, f: number) => '<g transform="translate(' + x + ' ' + y + ') scale(' + r1(s * f) + ' ' + s + ')" fill="#2c1f4d"><ellipse cx="0" cy="-24" rx="46" ry="19"/><ellipse cx="-8" cy="-46" rx="14" ry="14"/>' +
        '<path d="M30 -32 Q54 -46 52 -76" fill="none" stroke="#2c1f4d" stroke-width="12" stroke-linecap="round"/><ellipse cx="58" cy="-80" rx="15" ry="9" transform="rotate(-12 58 -80)"/><circle cx="52" cy="-90" r="4"/>' +
        '<ellipse cx="-26" cy="-4" rx="22" ry="8"/><ellipse cx="22" cy="-4" rx="22" ry="8"/></g>';
      return svg('<defs>' + glowDef(u + 'g', '#ffb866', 0.8) + '</defs>' + camel(330, 712, 0.6, 1) + camel(392, 718, 0.55, -1) + camel(530, 714, 0.6, 1) +
        '<path d="M432 718 L462 676 L492 718Z" fill="#7a4a6a"/><path d="M462 690 L452 718 H472Z" fill="#ffd98a"/><g class="cf-halo">' + glow(u + 'g', 462, 708, 40) + '</g>' +
        '<g class="cf-halo">' + glow(u + 'g', 500, 716, 30) + '</g><path class="cf-flame" d="M500 718 Q491 706 500 692 Q509 706 500 718Z" fill="#ffc45a"/>', vb);
    },
    palms: (_u, vb) => {
      const palm = (x: number, y: number, h: number, lean: number, i: number) => {
        const tx = x + lean, ty = y - h;
        let fronds = '';
        for (let k = 0; k < 7; k++) { const a = -160 + k * 22; fronds += '<path d="M0 0 Q42 -34 100 -6 Q46 -16 0 0Z" fill="' + (k % 2 ? '#2f8a6a' : '#3aa07a') + '" transform="rotate(' + a + ')"/>'; }
        return '<path d="M' + x + ' ' + y + ' Q' + (x + lean * 0.2) + ' ' + (y - h * 0.55) + ' ' + tx + ' ' + ty + '" fill="none" stroke="#5a3a3a" stroke-width="15" stroke-linecap="round"/>' +
          '<g transform="translate(' + tx + ' ' + ty + ')"><g class="cf-sway" style="animation-delay:-' + i * 0.9 + 's">' + fronds + '<circle cx="-6" cy="8" r="8" fill="#6b4a2a"/><circle cx="8" cy="10" r="8" fill="#7a5532"/></g></g>';
      };
      return svg(palm(610, 806, 190, 26, 0) + palm(700, 800, 270, -24, 1) + palm(752, 808, 200, 30, 2) + '<path d="M580 812 Q600 780 626 812Z M726 806 Q744 782 764 806Z" fill="#3a8a5a"/>', vb);
    },
    pool: (u, vb) => {
      let flies = '';
      const rng = mulberry32(44);
      for (let i = 0; i < 12; i++) {
        const x = r1(470 + rng() * 290), y = r1(790 + rng() * 120);
        flies += '<g class="cf-halo">' + glow(u + 'g', x, y, 14) + '</g><circle class="cf-star" style="--i:' + i + '" cx="' + x + '" cy="' + y + '" r="3.4" fill="#e8ff8a"/>';
      }
      return svg('<defs>' + grad(u + 'w', [[0, '#5fc8c8'], [1, '#2b6f98']]) + glowDef(u + 'g', '#e8ff8a', 0.7) + '</defs>' +
        '<ellipse cx="610" cy="892" rx="176" ry="36" fill="#f1c690"/><ellipse cx="610" cy="890" rx="158" ry="28" fill="url(#' + u + 'w)"/>' +
        '<ellipse cx="560" cy="884" rx="62" ry="9" fill="#fff3cf" opacity=".28"/>' +
        '<ellipse cx="566" cy="896" rx="20" ry="7" fill="#4fae7a"/><ellipse cx="654" cy="902" rx="22" ry="8" fill="#4fae7a"/><ellipse cx="700" cy="886" rx="16" ry="6" fill="#4fae7a"/><circle cx="566" cy="893" r="6" fill="#ff9fc0"/><circle cx="654" cy="899" r="6" fill="#ffc0d8"/>' + flies, vb);
    },
    house: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#ffe29a', 0.8) + '</defs><ellipse cx="340" cy="856" rx="122" ry="14" fill="#6a3f4f" opacity=".35"/>' +
      '<path d="M236 852 Q236 724 340 724 Q444 724 444 852Z" fill="#e3a876"/><path d="M258 804 Q296 756 346 748" fill="none" stroke="#f5c896" stroke-width="9" stroke-linecap="round" opacity=".5"/>' +
      '<g class="cf-halo">' + glow(u + 'g', 284, 786, 46) + glow(u + 'g', 398, 786, 46) + '</g><circle cx="284" cy="786" r="12" fill="#ffe6a0" stroke="#a0653f" stroke-width="4"/><circle cx="398" cy="786" r="12" fill="#ffe6a0" stroke="#a0653f" stroke-width="4"/>' +
      '<circle cx="341" cy="818" r="36" fill="#7a4a35"/><circle cx="341" cy="818" r="29" fill="#a0653f"/><path d="M341 790 V846 M313 818 H369" stroke="#7a4a35" stroke-width="4" opacity=".6"/><circle cx="356" cy="822" r="4.5" fill="#ffd36b"/>' +
      '<path d="M341 770 L321 760 Q317 770 321 780Z M341 770 L361 760 Q365 770 361 780Z" fill="#e8506a"/><rect x="335" y="764" width="12" height="12" rx="4" fill="#c23a57"/>' +
      '<g transform="translate(414 812) scale(.3)"><g class="cf-peek">' + wormInner() + '</g></g>', vb),
    barnaby: () => '<div class="cf-bear ds"><div class="cf-bear-glow"></div>' + bearMarkup(Store.data.wardrobe.equipped) + '</div>'
  },

  /* ---- the big top at night: a striped tent, string lights, a crowd, and Pippy on his star ball ---- */
  bigtop: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.2, '#1d0f34'], [0.6, '#5a2060'], [0.92, '#c9605f']]) + '</defs>' + skyRect(u + 's'), vb),
    stars: (_u, vb) => svg(starField(60, 83, 420), vb),
    tent: (u, vb) => {
      let walls = '', roof = '', scallops = '';
      for (let i = 0; i < 8; i++) walls += '<rect x="' + r1(210 + i * 47.5) + '" y="650" width="47.5" height="240" fill="' + (i % 2 ? '#e8506a' : '#f6e8df') + '"/>';
      for (let i = 0; i < 6; i++) roof += '<polygon points="400,440 ' + r1(170 + i * 76.7) + ',650 ' + r1(170 + (i + 1) * 76.7) + ',650" fill="' + (i % 2 ? '#e8506a' : '#f6e8df') + '"/>';
      for (let i = 0; i < 12; i++) scallops += '<circle cx="' + r1(189 + i * 38.3) + '" cy="650" r="19.5" fill="' + (i % 2 ? '#ffd24a' : '#9a8cf0') + '"/>';
      return svg('<defs>' + glowDef(u + 'g', '#ffe29a', 0.9) + '</defs>' +
        '<path d="M-300 880 Q200 846 400 868 T1100 866 V1300 H-300Z" fill="#4a1a38"/><path d="M-300 880 Q200 846 400 868 T1100 866" fill="none" stroke="#c9605f" stroke-width="4" opacity=".35"/>' +
        '<ellipse cx="400" cy="892" rx="260" ry="20" fill="#2a0f33" opacity=".4"/>' + walls + roof + scallops +
        '<path d="M356 890 V770 Q400 700 444 770 V890Z" fill="#2a0f33"/><path d="M356 890 V770 Q400 700 444 770 V890Z" fill="url(#' + u + 'g)" opacity=".8"/>' +
        '<g class="cf-halo">' + glow(u + 'g', 400, 820, 80) + '</g>', vb);
    },
    flags: (_u, vb) => {
      const flag = (x: number, y: number, h: number, c: string, i: number) => '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y - h) + '" stroke="#f6e8df" stroke-width="5" stroke-linecap="round"/>' +
        '<g class="cf-sway" style="animation-delay:-' + i * 0.7 + 's"><path d="M' + x + ' ' + (y - h) + ' L' + (x + 54) + ' ' + (y - h + 14) + ' L' + x + ' ' + (y - h + 28) + 'Z" fill="' + c + '"/></g>';
      return svg(flag(400, 442, 54, '#ffd24a', 0) + flag(172, 652, 40, '#9a8cf0', 1) + flag(628, 652, 40, '#6fd3c8', 2), vb);
    },
    lights: (u, vb) => {
      let out = '<defs>' + glowDef(u + 'g', '#ffe29a', 0.9) + '</defs>';
      const colors = ['#ff6f91', '#ffd24a', '#6fd3c8', '#9a8cf0', '#ff9f5a'];
      for (let i = 0; i < 12; i++) { const x = r1(189 + i * 38.3); out += '<g class="cf-halo" style="animation-delay:-' + r1(i * 0.4) + 's">' + glow(u + 'g', x, 674, 20) + '</g><circle class="cf-star" style="--i:' + i + '" cx="' + x + '" cy="674" r="5" fill="' + colors[i % 5] + '"/>'; }
      for (let i = 0; i < 9; i++) { const t = i / 8, x = r1(356 + 88 * t), y = r1(776 - 70 * Math.sin(Math.PI * t)); out += '<circle class="cf-star" style="--i:' + i + '" cx="' + x + '" cy="' + y + '" r="3.6" fill="' + colors[(i + 2) % 5] + '"/>'; }
      return svg(out, vb);
    },
    crowd: (_u, vb) => {
      const rng = mulberry32(19);
      let out = '';
      [70, 140, 215, 590, 665, 735].forEach((x, i) => {
        const y = 960 + (i % 2) * 8, c = i % 2 ? '#2a0f33' : '#3b1647';
        out += '<g fill="' + c + '"><ellipse cx="' + x + '" cy="' + y + '" rx="21" ry="26"/><circle cx="' + x + '" cy="' + (y - 34) + '" r="16"/>' +
          (i % 3 === 0 ? '<path d="M' + (x - 14) + ' ' + (y - 42) + ' L' + (x - 9) + ' ' + (y - 60) + ' L' + (x - 2) + ' ' + (y - 46) + 'Z M' + (x + 14) + ' ' + (y - 42) + ' L' + (x + 9) + ' ' + (y - 60) + ' L' + (x + 2) + ' ' + (y - 46) + 'Z"/>' : '<circle cx="' + (x - 15) + '" cy="' + (y - 42) + '" r="7"/><circle cx="' + (x + 15) + '" cy="' + (y - 42) + '" r="7"/>') + '</g>';
        if (i % 2 === 0) { const bc = ['#ff6f91', '#ffd24a', '#6fd3c8'][Math.floor(rng() * 3)]; out += '<g class="cf-sway" style="animation-delay:-' + i * 0.6 + 's"><path d="M' + (x + 14) + ' ' + (y - 6) + ' L' + (x + 24) + ' ' + (y - 100) + '" stroke="#f6e8df" stroke-width="2" fill="none"/><ellipse cx="' + (x + 24) + '" cy="' + (y - 118) + '" rx="15" ry="19" fill="' + bc + '"/></g>'; }
      });
      return svg(out, vb);
    },
    ring: (_u, vb) => svg('<polygon points="380,420 420,420 540,920 260,920" fill="#fff6c8" opacity=".14"/>' +
      '<ellipse cx="400" cy="928" rx="170" ry="26" fill="#e9c288"/><ellipse cx="400" cy="924" rx="138" ry="17" fill="#f3d5a0"/>' +
      '<ellipse cx="400" cy="928" rx="170" ry="26" fill="none" stroke="#fff4e0" stroke-width="6"/><ellipse cx="400" cy="928" rx="170" ry="26" fill="none" stroke="#e8506a" stroke-width="6" stroke-dasharray="20 20"/>', vb),
    ball: (_u, vb) => svg('<g class="cf-peek">' + starBall(400, 900, 38) + '</g>', vb),
    pippy: (_u, vb) => svg('<g transform="translate(350 760) scale(.5)"><g class="cf-peek">' + elephantInner() + '</g></g>', vb),
    barnaby: () => '<div class="cf-bear bt"><div class="cf-bear-glow"></div>' + bearMarkup(Store.data.wardrobe.equipped) + '</div>'
  },

  /* ---- the meadow after the meteor: a sunny sky of new stars, rolling hills and the whole dino herd ---- */
  meteor: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.2, '#5fb8ea'], [0.62, '#a9def4'], [0.92, '#ffe9b8']]) + '</defs>' + skyRect(u + 's'), vb),
    sun: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#fff2b0', 0.95) + '</defs><g class="cf-halo">' + glow(u + 'g', 640, 250, 180) + '</g><circle cx="640" cy="250" r="54" fill="#ffe27a"/>', vb),
    stars: (_u, vb) => svg(starField(46, 91, 360), vb),
    hills: (_u, vb) => svg('<path d="M-300 760 Q100 640 420 730 T1100 700 V1300 H-300Z" fill="#8fd68a"/><path d="M-300 820 Q150 730 520 800 T1100 780 V1300 H-300Z" fill="#6cc474"/>' +
      '<path d="M-300 900 Q300 840 700 900 T1100 880 V1300 H-300Z" fill="#4fae60"/>', vb),
    dinos: (_u, vb) => {
      const herd = [['Dilly', 170, 720, 0.74], ['Stella', 310, 750, 0.5], ['Penny', 690, 720, 0.5], ['Trixie', 570, 770, 0.56], ['Rexy', 440, 800, 0.42]] as const;
      return svg(herd.map(([n, x, y, k], i) => '<g transform="translate(' + (x - 100 * k) + ' ' + (y - 208 * k) + ') scale(' + k + ')"><g class="cf-peek" style="animation-delay:-' + i * 0.5 + 's">' + dinoInner(HERD[n].kind, HERD[n].pal) + '</g></g>').join(''), vb);
    },
    burst: (_u, vb) => {
      const rng = mulberry32(37), cols = ['#fff6c8', '#ffd24a', '#ff9fb4', '#9be7ff', '#c8a8ff'];
      let out = '';
      for (let i = 0; i < 26; i++) {
        const x = r1(120 + rng() * 560), y = r1(80 + rng() * 300), s = r1(0.6 + rng() * 1.1);
        out += '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path class="cf-star" style="--i:' + i + '" d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3Z" fill="' + cols[i % cols.length] + '"/></g>';
      }
      return svg(out, vb);
    },
    ball: (_u, vb) => svg('<g class="cf-peek">' + boingBall(300, 880, 44) + '</g>', vb),
    barnaby: () => '<div class="cf-bear mt"><div class="cf-bear-glow"></div>' + bearMarkup(Store.data.wardrobe.equipped) + '</div>'
  },

  /* ---- deep underground: a dim cave of crystals, the drill rig and its crew, and Rocky's little brick house ---- */
  underground: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.15, '#2b2038'], [0.6, '#4b3a55'], [0.92, '#7a5a52']]) + '</defs>' + skyRect(u + 's') + starField(26, 53, 520), vb),
    crystals: (u, vb) => {
      const spike = (x: number, y: number, h: number, w: number, c: string, i: number) =>
        '<g class="cf-halo" style="animation-delay:-' + r1(i * 0.6) + 's">' + glow(u + 'g', x, y - h * 0.5, h * 0.9) + '</g><polygon points="' + (x - w) + ',' + y + ' ' + r1(x - w * 0.3) + ',' + (y - h) + ' ' + r1(x + w * 0.5) + ',' + (y - h * 0.8) + ' ' + (x + w) + ',' + y + '" fill="' + c + '"/>' +
        '<polygon points="' + r1(x - w * 0.3) + ',' + (y - h) + ' ' + r1(x + w * 0.5) + ',' + (y - h * 0.8) + ' ' + r1(x + w * 0.1) + ',' + y + '" fill="#fff" opacity=".22"/>';
      return svg('<defs>' + glowDef(u + 'g', '#c8a8ff', 0.7) + '</defs>' +
        '<path d="M-300 760 Q60 700 220 760 T600 740 T1100 770 V1300 H-300Z" fill="#3a2c46"/>' +
        spike(90, 800, 150, 34, '#9a7aea', 0) + spike(160, 806, 96, 24, '#6fd3c8', 1) + spike(700, 802, 170, 38, '#ff9fc0', 2) + spike(640, 808, 100, 22, '#9a7aea', 3) + spike(30, 810, 80, 22, '#ff9fc0', 4), vb);
    },
    rubble: (_u, vb) => svg('<ellipse cx="360" cy="900" rx="200" ry="22" fill="#000" opacity=".25"/>' +
      '<path d="M170 900 L200 836 L250 856 L300 800 L350 846 L410 820 L460 866 L520 900Z" fill="#8a7e76"/>' +
      '<polygon points="214,884 240,860 270,880 250,900" fill="#b0a398"/><polygon points="330,884 362,858 394,880 372,900" fill="#6f655e"/>' +
      '<rect x="262" y="838" width="44" height="22" rx="3" fill="#c0674f" transform="rotate(-14 284 849)"/><rect x="404" y="850" width="40" height="20" rx="3" fill="#c0674f" transform="rotate(12 424 860)"/>' +
      '<path d="M300 800 L318 760 L334 800Z" fill="#b8472f" opacity=".7"/>', vb),
    drill: (_u, vb) => svg('<ellipse cx="690" cy="900" rx="110" ry="14" fill="#000" opacity=".28"/>' +
      '<g stroke="#5c5560" stroke-width="10" stroke-linecap="round"><line x1="610" y1="900" x2="650" y2="560"/><line x1="770" y1="900" x2="730" y2="560"/><line x1="624" y1="760" x2="756" y2="760"/><line x1="636" y1="660" x2="744" y2="660"/></g>' +
      '<rect x="640" y="540" width="100" height="36" rx="8" fill="#e8a23a"/><rect x="676" y="576" width="28" height="270" fill="#8d8793"/>' +
      '<g class="cf-peek"><polygon points="662,846 718,846 690,910" fill="#c9c3d0"/><path d="M668 856 L712 868 M672 876 L706 886" stroke="#6a6475" stroke-width="5"/></g>' +
      '<circle cx="690" cy="522" r="14" fill="#ff6f5a"/>', vb),
    crew: (_u, vb) => {
      const guy = (x: number, c: string, i: number) => '<g class="cf-peek" style="animation-delay:-' + r1(i * 0.7) + 's"><ellipse cx="' + x + '" cy="900" rx="22" ry="5" fill="#000" opacity=".25"/>' +
        '<ellipse cx="' + x + '" cy="866" rx="22" ry="28" fill="' + c + '"/><circle cx="' + x + '" cy="824" r="19" fill="' + c + '"/>' +
        '<path d="M' + (x - 22) + ' 820 Q' + x + ' 790 ' + (x + 22) + ' 820Z" fill="#ffd24a"/><rect x="' + (x - 24) + '" y="818" width="48" height="6" rx="3" fill="#e8a23a"/>' +
        '<circle cx="' + (x - 7) + '" cy="828" r="3" fill="#2f2b33"/><circle cx="' + (x + 7) + '" cy="828" r="3" fill="#2f2b33"/></g>';
      return svg(guy(560, '#9a8a7a', 0) + guy(612, '#8d8a94', 1) + guy(786, '#b08560', 2), vb);
    },
    house: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#ffe29a', 0.85) + '</defs><ellipse cx="360" cy="902" rx="168" ry="16" fill="#000" opacity=".28"/>' +
      '<rect x="250" y="780" width="220" height="120" rx="6" fill="#c0674f"/>' +
      Array.from({ length: 5 }, (_, i) => '<path d="M250 ' + (804 + i * 24) + ' H470" stroke="#e7b9a4" stroke-width="3" opacity=".5"/>').join('') +
      '<path d="M236 784 L360 690 L484 784Z" fill="#7a3d33"/><path d="M252 782 L360 704" stroke="#a65a49" stroke-width="6" opacity=".6" stroke-linecap="round"/>' +
      '<rect x="420" y="700" width="30" height="62" rx="4" fill="#8a4a3c"/><rect x="414" y="692" width="42" height="12" rx="4" fill="#5c5560"/>' +
      '<path class="cf-sway" d="M435 690 Q425 668 440 654 Q452 640 440 622" fill="none" stroke="#e8e0f0" stroke-width="7" stroke-linecap="round" opacity=".55"/>' +
      '<rect x="318" y="824" width="52" height="76" rx="26" fill="#6a3f35"/><circle cx="360" cy="866" r="4" fill="#ffd36b"/>' +
      '<circle cx="290" cy="826" r="22" fill="#ffe29a" stroke="#7a3d33" stroke-width="6"/><path d="M290 804 V848 M268 826 H312" stroke="#7a3d33" stroke-width="4"/>' +
      '<circle cx="402" cy="868" r="7" fill="#ffd24a" stroke="#8a6a1a" stroke-width="2"/>', vb),
    lamps: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#ffe29a', 0.9) + '</defs><g class="cf-halo">' + glow(u + 'g', 290, 826, 110) + glow(u + 'g', 360, 880, 90) + '</g>' +
      '<circle cx="290" cy="826" r="16" fill="#fff2b8"/>' +
      [200, 520].map(x => '<rect x="' + (x - 3) + '" y="850" width="6" height="52" fill="#5c5560"/><g class="cf-halo">' + glow(u + 'g', x, 842, 60) + '</g><circle cx="' + x + '" cy="842" r="11" fill="#ffe6a0"/>').join(''), vb),
    rocky: (_u, vb) => svg('<g transform="translate(494 788) scale(.56)"><g class="cf-peek">' + rockyInner() + '</g></g>', vb),
    barnaby: () => '<div class="cf-bear ug"><div class="cf-bear-glow"></div>' + bearMarkup(Store.data.wardrobe.equipped) + '</div>'
  },
  /* ---- a small island at sunset: the sea, sand and jungle, palms, the crashed plane, the tiger, a hole, a bonfire, the rescue ship ---- */
  island: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.1, '#4c5fb0'], [0.45, '#e58fa0'], [0.78, '#ffc58a'], [1, '#ffe2b0']]) + glowDef(u + 'g', '#fff1b0', 0.8) + '</defs>' + skyRect(u + 's') +
      '<g class="cf-halo">' + glow(u + 'g', 560, 690, 230) + '</g><circle cx="560" cy="690" r="46" fill="#fff4c4"/>' +
      '<g fill="#fff" opacity=".55"><ellipse cx="170" cy="280" rx="84" ry="22"/><ellipse cx="230" cy="264" rx="58" ry="18"/><ellipse cx="640" cy="370" rx="96" ry="20"/><ellipse cx="700" cy="354" rx="54" ry="16"/></g>', vb),
    stars: (u, vb) => svg(starField(34, 71, 400), vb),
    sea: (u, vb) => svg('<defs>' + grad(u + 'w', [[0, '#4fb8cc'], [1, '#1d6a93']]) + '</defs><rect x="-300" y="700" width="1400" height="700" fill="url(#' + u + 'w)"/>' +
      '<g class="cf-sway" fill="none" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"><path d="M40 730 q30 -8 60 0 t60 0"/><path d="M420 742 q30 -8 60 0 t60 0"/><path d="M640 724 q30 -8 60 0 t60 0"/><path d="M200 758 q30 -8 60 0 t60 0"/></g>' +
      '<path d="M470 700 L650 700 L610 780 L520 780Z" fill="#fff4c4" opacity=".22"/>', vb),
    island: (_u, vb) => svg('<ellipse cx="400" cy="830" rx="420" ry="86" fill="#000" opacity=".12"/>' +
      '<path d="M-60 840 Q60 770 220 790 T460 770 T760 800 T900 850 V900 H-60Z" fill="#f2d7a0"/><path d="M-60 856 Q120 810 300 828 T620 820 T900 860 V900 H-60Z" fill="#e8c88a"/>' +
      '<path d="M470 780 Q520 690 600 700 Q690 700 740 786 Z" fill="#3f9a5a"/><path d="M500 786 Q560 722 624 726 Q700 732 726 786 Z" fill="#2f8a4a"/>' +
      '<g fill="#fff" opacity=".6"><path d="M-40 868 q40 -10 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/></g>', vb),
    palms: (_u, vb) => svg(palmTree(150, 840, 610, -28, 0.9) + palmTree(246, 846, 660, 18, 0.7, 1) + palmTree(700, 800, 600, 20, 0.8, 1), vb),
    wreck: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#8a8a96', 0.5) + '</defs>' +
      '<g transform="translate(210 800) rotate(-9)"><ellipse cx="60" cy="40" rx="150" ry="40" fill="#cfd6e0"/><path d="M-80 40 Q-100 0 -40 -6 L140 -8 Q200 0 190 40 Z" fill="#e8edf3"/>' +
      '<rect x="20" y="4" width="26" height="18" rx="6" fill="#4aa8d8"/><rect x="62" y="4" width="26" height="18" rx="6" fill="#4aa8d8"/><rect x="104" y="4" width="26" height="18" rx="6" fill="#4aa8d8"/>' +
      '<path d="M-90 40 L-140 -70 L-96 -66 L-60 8Z" fill="#e8527a"/><path d="M-70 24 L-130 22 L-120 40 L-60 40Z" fill="#c9d0da"/></g>' +
      '<g class="cf-halo">' + glow(u + 'g', 420, 740, 70) + '</g><g class="cf-peek" opacity=".5"><circle cx="372" cy="760" r="12" fill="#8a8a96"/><circle cx="388" cy="738" r="16" fill="#9a9aa6"/></g>', vb),
    tiger: (_u, vb) => svg('<g transform="translate(470 700) scale(.55)"><g class="cf-peek">' + tigerInner() + '</g></g>', vb),
    hole: (_u, vb) => svg('<ellipse cx="560" cy="836" rx="86" ry="22" fill="#b98c4c"/><ellipse cx="560" cy="838" rx="72" ry="16" fill="#2a1c12"/><ellipse cx="560" cy="842" rx="46" ry="9" fill="#120c08"/>', vb),
    fire: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#ffb14a', 0.95) + '</defs><g class="cf-halo">' + glow(u + 'g', 360, 806, 150) + '</g>' +
      '<g stroke="#5a3a24" stroke-width="12" stroke-linecap="round"><path d="M320 836 L398 812"/><path d="M322 812 L400 836"/></g>' +
      '<g class="cf-peek"><path d="M360 818 Q330 790 350 756 Q356 774 372 760 Q380 790 360 818Z" fill="#ff8a2a"/><path d="M360 818 Q346 800 358 780 Q368 796 360 818Z" fill="#ffe27a"/></g>', vb),
    ship: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#fff4c4', 0.9) + '</defs><g class="cf-sway"><path d="M570 704 L720 704 L700 726 L592 726Z" fill="#2b3d4f"/><rect x="620" y="672" width="40" height="32" fill="#e8edf3"/><rect x="636" y="654" width="12" height="18" fill="#e8527a"/>' +
      '<g class="cf-halo">' + glow(u + 'g', 648, 690, 70) + '</g><circle cx="648" cy="690" r="7" fill="#fff4c4"/></g>', vb),
    crew: (_u, vb) => svg('<g transform="translate(250 700) scale(.4)">' + larryInner() + '</g><g transform="translate(176 774) scale(.4)"><g class="biscuit b-happy">' + wormInner() + '</g></g>', vb),
    barnaby: () => '<div class="cf-bear is"><div class="cf-bear-glow"></div>' + bearMarkup(Store.data.wardrobe.equipped) + '</div>'
  },
  /* ---- the Whisker Isles: pastel cushion hills, a cat town with lantern fish, a harbour, balls of yarn, cats, kittens and the mice of the old mill ----
     A phone screen shows only the middle of the 800-wide canvas (about x 210 to 590 before the camera moves), so the tableau is composed in that window. */
  cats: {
    sky: (u, vb) => svg('<defs>' + grad(u + 's', [[0.1, '#c9b6f0'], [0.46, '#ffcfe0'], [0.8, '#ffe6bc']]) + '</defs>' + skyRect(u + 's') +
      '<g fill="#fff" opacity=".6"><ellipse cx="270" cy="300" rx="92" ry="24"/><ellipse cx="334" cy="282" rx="60" ry="20"/><ellipse cx="520" cy="380" rx="104" ry="22"/><ellipse cx="584" cy="362" rx="56" ry="17"/></g>' +
      '<g fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 9" opacity=".7"><path d="M200 300 H340"/><path d="M440 380 H600"/></g>', vb),
    sun: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#fff0b8', 0.85) + '</defs><g class="cf-halo">' + glow(u + 'g', 470, 610, 280) + '</g><circle cx="470" cy="610" r="54" fill="#fff6d2"/>', vb),
    hills: (u, vb) => svg('<defs>' + grad(u + 'w', [[0, '#8fd8e0'], [1, '#4aa8c4']]) + '</defs>' +
      '<rect x="-300" y="720" width="1400" height="700" fill="url(#' + u + 'w)"/><g class="cf-sway" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"><path d="M180 752 q30 -8 60 0 t60 0 t60 0"/><path d="M260 778 q30 -8 60 0 t60 0"/></g>' +
      '<path d="M200 800 Q420 690 640 760 T1100 780 V1300 H200Z" fill="#f2b6c8"/><path d="M-300 836 Q60 740 360 820 T740 800 T1100 830 V1300 H-300Z" fill="#cdb6ec"/>' +
      '<path d="M-300 900 Q200 820 520 888 T1100 880 V1300 H-300Z" fill="#a8dcb8"/>' +
      '<g fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="7 10" opacity=".6"><path d="M180 872 Q330 836 460 874"/><path d="M470 862 Q600 836 700 868"/></g>' +
      '<g fill="#fff" opacity=".7"><circle cx="262" cy="862" r="7"/><circle cx="420" cy="868" r="7"/><circle cx="560" cy="856" r="7"/></g>', vb),
    town: (_u, vb) => {
      const house = (x: number, y: number, w: number, h: number, wall: string, roof: string, lit: boolean) =>
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + wall + '"/>' +
        '<path d="M' + (x - 8) + ' ' + y + ' L' + (x + 4) + ' ' + Math.round(y - w * 0.46) + ' L' + Math.round(x + w * 0.5) + ' ' + Math.round(y - w * 0.12) + ' L' + (x + w - 4) + ' ' + Math.round(y - w * 0.46) + ' L' + (x + w + 8) + ' ' + y + 'Z" fill="' + roof + '"/>' +
        '<circle cx="' + (x + w / 2) + '" cy="' + Math.round(y + h * 0.42) + '" r="' + Math.round(w * 0.16) + '" fill="' + (lit ? '#ffe29a' : '#fff6e0') + '" stroke="#fff" stroke-width="3"/>' +
        '<rect x="' + (x + w / 2 - 7) + '" y="' + (y + h - 26) + '" width="14" height="26" rx="7" fill="#7a5a66"/>';
      return svg(house(204, 744, 88, 82, '#fff0d8', '#e58fa6', true) + house(302, 712, 104, 114, '#e6f4ee', '#8fb8d8', true) + house(416, 748, 80, 78, '#ffe9e2', '#f2a07a', false) +
        house(504, 728, 90, 98, '#f0e8ff', '#b79ae0', true) +
        '<path d="M354 650 L354 616" stroke="#7a5a66" stroke-width="4"/><path d="M334 622 Q354 606 376 622 Q354 636 334 622Z" fill="#f5c84a" class="cf-sway"/>', vb);
    },
    lanterns: (u, vb) => {
      const fish = (x: number, y: number, c: string) => '<g class="cf-peek"><circle cx="' + x + '" cy="' + y + '" r="40" fill="url(#' + u + 'g)" class="cf-halo"/><path d="M' + (x - 14) + ' ' + y + ' Q' + x + ' ' + (y - 14) + ' ' + (x + 12) + ' ' + y + ' Q' + x + ' ' + (y + 14) + ' ' + (x - 14) + ' ' + y + 'Z" fill="' + c + '"/><path d="M' + (x + 10) + ' ' + y + ' L' + (x + 22) + ' ' + (y - 8) + ' L' + (x + 22) + ' ' + (y + 8) + 'Z" fill="' + c + '"/><circle cx="' + (x - 7) + '" cy="' + (y - 2) + '" r="2" fill="#6a4a24"/></g>';
      return svg('<defs>' + glowDef(u + 'g', '#ffd27a', 0.9) + '</defs><path d="M200 700 Q290 750 380 704 T560 700 T620 716" fill="none" stroke="#7a5a66" stroke-width="3"/>' +
        fish(262, 736, '#ffd27a') + fish(352, 730, '#ffb0c4') + fish(446, 726, '#ffd27a') + fish(540, 728, '#b8e0f0'), vb);
    },
    yarn: (_u, vb) => svg(YARN.map(([c, d], i) => '<g transform="translate(' + [268, 336, 404, 472][i] + ' ' + [880, 894, 884, 896][i] + ') scale(' + [1, 1.15, 0.95, 1.05][i] + ')"><g class="cf-peek" style="animation-delay:-' + i * 0.5 + 's">' + yarnBall(c, d) + '</g></g>').join('') +
      '<path d="M200 920 Q330 884 470 916 T640 906" fill="none" stroke="#e8527a" stroke-width="5" stroke-linecap="round" opacity=".8"/>', vb),
    mice: (_u, vb) => svg([['grey', 470, 806], ['brown', 502, 818], ['dusk', 534, 808]].map(([k, x, y]) => '<g transform="translate(' + x + ' ' + y + ') scale(.5)"><g class="cf-peek">' + mouseInner(MICE[k as string]) + '</g></g>').join(''), vb),
    cats: (_u, vb) => svg([['ginger', 232, 770, 0.66], ['grey', 292, 790, 0.6]].map(([k, x, y, sc]) => '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><g class="cf-peek">' + catInner(CAT_COATS[k as string]) + '</g></g>').join('') +
      '<g transform="translate(356 768) scale(.68)"><g class="cf-peek">' + mittensInner() + '</g></g>', vb),
    kittens: (_u, vb) => svg([[304, 838, 0.38, 'cream'], [372, 846, 0.36, 'ginger'], [440, 842, 0.38, 'night']].map(([x, y, sc, k]) => '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><g class="cf-peek">' + catInner(CAT_COATS[k as string]) + '</g></g>').join(''), vb),
    ship: (u, vb) => svg('<defs>' + glowDef(u + 'g', '#fff4c4', 0.9) + '</defs><g class="cf-sway"><path d="M236 760 L346 760 L326 786 L254 786Z" fill="#5a4a6a"/><rect x="288" y="718" width="6" height="42" fill="#7a5a66"/>' +
      '<path d="M294 722 L336 752 L294 752Z" fill="#fff6e8"/><path d="M288 722 L288 710 L306 716Z" fill="#e8527a"/><g class="cf-halo">' + glow(u + 'g', 292, 770, 40) + '</g></g>', vb),
    barnaby: () => '<div class="cf-bear cat"><div class="cf-bear-glow"></div>' + bearMarkup(Store.data.wardrobe.equipped) + '</div>'
  }
};

/* the transform a layer wears for a camera position: far layers move less (parallax) and zoom less */
export function layerTransform(depth: number, cam: { x: number; y: number; scale: number }): string {
  const s = 1 + (cam.scale - 1) * depth;
  return 'translate(' + r1(cam.x * depth * 0.5) + '%, ' + r1(cam.y * depth * 0.5) + '%) scale(' + r1(s * 1000) / 1000 + ')';
}

export interface StageOpts { band?: boolean }

export class Stage {
  root: HTMLElement;
  layers: Record<string, HTMLElement> = {};
  cam = { x: 0, y: 0, scale: 1 };
  motif: Motif;

  constructor(motif: Motif, opts: StageOpts = {}) {
    this.motif = motif;
    const u = 'cf' + (++uid), vb = opts.band ? BAND_VIEWS[motif] : VIEW;
    this.root = document.createElement('div');
    this.root.className = 'cf-stage' + (opts.band ? ' band' : '');
    this.root.setAttribute('aria-hidden', 'true');
    FILM_LAYERS[motif].forEach(id => {
      const layer = document.createElement('div');
      layer.className = 'cf-layer';
      layer.dataset.layer = id;
      layer.innerHTML = ART[motif][id](u + id, vb);
      this.layers[id] = layer;
      if (opts.band && BAND_LAYERS[motif].includes(id)) layer.classList.add('on');
      if (!opts.band) layer.style.transform = layerTransform(DEPTH[id] ?? 1, this.cam);
      this.root.appendChild(layer);
    });
  }

  show(ids: string[] = []) { ids.forEach(id => this.layers[id]?.classList.add('on')); }
  hide(ids: string[] = []) { ids.forEach(id => this.layers[id]?.classList.remove('on')); }

  /* jump to a camera position, or glide there (a Web Animation from where each layer is now; the film decides if it may animate) */
  camera(to: { x: number; y?: number; scale?: number }, ms: number, film?: Film) {
    this.cam = { x: to.x, y: to.y ?? this.cam.y, scale: to.scale ?? this.cam.scale };
    for (const id of Object.keys(this.layers)) {
      const el = this.layers[id], next = layerTransform(DEPTH[id] ?? 1, this.cam), from = getComputedStyle(el).transform;
      el.style.transform = next;
      if (ms > 0 && film) film.anim(el, [{ transform: from === 'none' ? next : from }, { transform: next }], { duration: ms, easing: 'cubic-bezier(.45,.05,.25,1)' });
    }
  }
}
