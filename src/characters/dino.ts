/* ---------- Rexy, the very small T. rex (and her dinosaur friends) ----------
   Drawn as inline SVG, like Pippy, Biscuit and Pickle: a round green dino with a big friendly head, tiny arms, a swishy tail and rosy cheeks.
   `dinoInner(kind, palette)` is one drawing alone (a 200 x 220 box, feet at y 208, facing right), so the meadow cinematic can scatter a whole herd
   of friends on its own stage; `dinoMarkup()` wraps Rexy as the portrait for the story screen. The friends differ in colour and in one feature each:
   plates down the back (steg), a frill and three horns (tri), a long neck (diplo), a crest (para) or plain (rex). `boingBall()` is the big rubber ball
   the finale launches. */

export type DinoKind = 'rex' | 'steg' | 'tri' | 'diplo' | 'para';
export interface DinoPalette { body: string; deep: string; belly: string; spot: string }

export const REXY: DinoPalette = { body: '#6fcf7a', deep: '#4fae60', belly: '#e6f7c8', spot: '#4fae60' };
const INK = '#2f3b2d', BLUSH = '#ff8fab';

/* the whole friend herd: name -> kind and colours (used for the cinematic's cast) */
export const HERD: Record<string, { kind: DinoKind; pal: DinoPalette }> = {
  Rexy: { kind: 'rex', pal: REXY },
  Stella: { kind: 'steg', pal: { body: '#8fd0c4', deep: '#5aa99a', belly: '#e0f6ef', spot: '#ffb347' } },
  Trixie: { kind: 'tri', pal: { body: '#f4a6bd', deep: '#d9708e', belly: '#ffe3ec', spot: '#ffd24a' } },
  Dilly: { kind: 'diplo', pal: { body: '#8ab6ea', deep: '#5d8cc8', belly: '#e1eefb', spot: '#fff2a8' } },
  Penny: { kind: 'para', pal: { body: '#c9a3ea', deep: '#9b72c8', belly: '#f1e5fb', spot: '#ffd24a' } }
};

/* the giant rubber ball of the finale, centred on (cx, cy): big rainbow stripes and a shine */
export function boingBall(cx: number, cy: number, r: number): string {
  const k = r / 50, stripes = ['#ff6f91', '#ffd24a', '#6fd3c8', '#9a8cf0'];
  return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + k + ')"><clipPath id="dnBallClip"><circle r="50"/></clipPath>' +
    '<circle r="50" fill="#fff6e8"/>' +
    '<g class="dn-ballspin" clip-path="url(#dnBallClip)">' + stripes.map((c, i) => '<rect x="' + (-60 + i * 30) + '" y="-60" width="15" height="120" fill="' + c + '" transform="rotate(25)"/>').join('') + '</g>' +
    '<circle r="50" fill="none" stroke="#e9d4b8" stroke-width="3"/>' +
    '<ellipse cx="-20" cy="-26" rx="14" ry="8" fill="#fff" opacity=".55" transform="rotate(-35 -20 -26)"/></g>';
}

/* the head, by kind: all face right, centred around (128, 86) */
function head(kind: DinoKind, p: DinoPalette): string {
  const big = kind === 'rex';
  const r = big ? 46 : kind === 'diplo' ? 28 : 38;
  const hx = kind === 'diplo' ? 150 : 124, hy = kind === 'diplo' ? 40 : 88;
  let extra = '';
  if (kind === 'tri') {                                                    // a frill behind the head and three horns
    extra = '<path d="M96 70 Q70 40 98 22 Q130 20 138 50Z" fill="' + p.deep + '"/><circle cx="104" cy="34" r="5" fill="' + p.spot + '"/><circle cx="90" cy="52" r="5" fill="' + p.spot + '"/>' +
      '<path d="M138 56 L152 26 L158 58Z M120 52 L118 22 L132 52Z" fill="#fff3d6"/><path d="M158 100 L176 106 L160 112Z" fill="#fff3d6"/>';
  } else if (kind === 'para') {                                            // a long backwards crest
    extra = '<path d="M130 52 Q70 24 56 66 Q90 52 118 62Z" fill="' + p.deep + '"/>';
  } else if (kind === 'steg') {
    extra = '';
  }
  const neck = kind === 'diplo' ? '<path d="M104 140 Q120 60 148 52" fill="none" stroke="' + p.body + '" stroke-width="34" stroke-linecap="round"/>' : '';
  const snoutX = kind === 'diplo' ? hx + 18 : hx + r * 0.5;
  return '<g class="dn-head">' + neck + extra +
    '<circle cx="' + hx + '" cy="' + hy + '" r="' + r + '" fill="' + p.body + '"/>' +
    '<ellipse cx="' + snoutX + '" cy="' + (hy + r * 0.28) + '" rx="' + (r * 0.62) + '" ry="' + (r * 0.5) + '" fill="' + p.body + '"/>' +
    '<ellipse cx="' + (hx + 2) + '" cy="' + (hy + r * 0.52) + '" rx="' + (r * 0.8) + '" ry="' + (r * 0.4) + '" fill="' + p.belly + '" opacity=".75"/>' +
    '<circle class="dn-blush" cx="' + (hx - r * 0.32) + '" cy="' + (hy + r * 0.34) + '" r="' + (r * 0.2) + '" fill="' + BLUSH + '" opacity=".5"/>' +
    '<g class="dn-eyes"><ellipse cx="' + (hx + r * 0.22) + '" cy="' + (hy - r * 0.12) + '" rx="' + (r * 0.17) + '" ry="' + (r * 0.23) + '" fill="' + INK + '"/>' +
    '<circle cx="' + (hx + r * 0.17) + '" cy="' + (hy - r * 0.22) + '" r="' + (r * 0.07) + '" fill="#fff"/></g>' +
    '<path class="dn-brow" d="M' + (hx + r * 0.02) + ' ' + (hy - r * 0.45) + ' L' + (hx + r * 0.46) + ' ' + (hy - r * 0.36) + '" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path class="dn-mouth smile" d="M' + (snoutX - r * 0.2) + ' ' + (hy + r * 0.5) + ' Q' + (snoutX + r * 0.15) + ' ' + (hy + r * 0.78) + ' ' + (snoutX + r * 0.52) + ' ' + (hy + r * 0.46) + '" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path class="dn-mouth frown" d="M' + (snoutX - r * 0.2) + ' ' + (hy + r * 0.7) + ' Q' + (snoutX + r * 0.15) + ' ' + (hy + r * 0.45) + ' ' + (snoutX + r * 0.52) + ' ' + (hy + r * 0.66) + '" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
    '<circle cx="' + (snoutX + r * 0.32) + '" cy="' + (hy + r * 0.12) + '" r="' + (r * 0.05) + '" fill="' + p.deep + '"/>' +
    '</g>';
}

export function dinoInner(kind: DinoKind = 'rex', p: DinoPalette = REXY): string {
  const plates = kind === 'steg'
    ? '<g class="dn-plates">' + [[60, 106, 30], [78, 96, 36], [98, 92, 40], [118, 96, 36], [136, 106, 30]].map(([x, y, h]) => '<path d="M' + (x - 11) + ' ' + (y + 6) + ' L' + x + ' ' + (y - h + 6) + ' L' + (x + 11) + ' ' + (y + 6) + 'Z" fill="' + p.spot + '"/>').join('') + '</g>'
    : '';
  const spots = kind === 'steg' ? '' : '<circle cx="66" cy="132" r="7" fill="' + p.spot + '" opacity=".55"/><circle cx="92" cy="122" r="5" fill="' + p.spot + '" opacity=".55"/><circle cx="78" cy="152" r="5" fill="' + p.spot + '" opacity=".55"/>';
  return '' +
    '<ellipse cx="100" cy="210" rx="64" ry="7" fill="#000" opacity=".12"/>' +
    '<g class="dn-tail"><path d="M52 150 Q12 150 6 190 Q4 204 18 196 Q36 184 58 176Z" fill="' + p.body + '"/>' +
      '<path d="M52 150 Q22 156 12 186" fill="none" stroke="' + p.deep + '" stroke-width="4" stroke-linecap="round" opacity=".6"/></g>' +
    '<g class="dn-body">' +
      '<rect x="62" y="166" width="30" height="42" rx="13" fill="' + p.deep + '"/><rect x="112" y="166" width="30" height="42" rx="13" fill="' + p.deep + '"/>' +
      '<path d="M66 204 h22 M116 204 h22" stroke="' + p.belly + '" stroke-width="5" stroke-linecap="round" opacity=".85"/>' +
      '<ellipse cx="98" cy="150" rx="58" ry="46" fill="' + p.body + '"/>' + plates + spots +
      '<ellipse cx="108" cy="162" rx="34" ry="28" fill="' + p.belly + '" opacity=".85"/>' +
      '<g class="dn-arm"><path d="M142 146 Q158 150 158 162" fill="none" stroke="' + p.deep + '" stroke-width="9" stroke-linecap="round"/><circle cx="158" cy="164" r="5" fill="' + p.deep + '"/></g>' +
    '</g>' + head(kind, p);
}

/* the portrait: Rexy on the grass (viewBox 200 x 240) */
export function dinoMarkup(): string {
  return '<svg viewBox="0 0 200 240" class="dn-svg" aria-hidden="true"><g transform="translate(0 6)">' + dinoInner('rex', REXY) + '</g></svg>';
}

export interface DinoPortrait { root: HTMLElement; react(e: string): void }

export const Dino = {
  EMOS: ['happy', 'shy', 'wiggle', 'surprised', 'sad', 'proud'],
  create(host: HTMLElement): DinoPortrait {
    host.innerHTML = '<div class="rexy b-happy">' + dinoMarkup() + '</div>';
    const root = host.firstElementChild as HTMLElement;
    return { root, react(e: string) { Dino.EMOS.forEach(c => root.classList.remove('b-' + c)); root.classList.add('b-' + (Dino.EMOS.includes(e) ? e : 'happy')); } };
  }
};
