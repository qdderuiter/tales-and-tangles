/* ---------- the cats, mice and yarn of the Whisker Isles (Chapter 11) ----------
   Small inline-SVG drawings, like Rocky and Pippy, shared by the chapter film (scenes/film-art.ts) and the cinematics (scenes/cats-scene.ts).
   Each `*Inner()` is one drawing alone in a box about 120 wide, feet at y = 124, so a scene can place it by its feet. Pure strings: no DOM. */

export interface CatPalette { fur: string; belly: string; ear: string; stripes?: boolean }
export const CAT_COATS: Record<string, CatPalette> = {
  ginger: { fur: '#e9a35c', belly: '#fbe3c0', ear: '#f4a3b5', stripes: true },
  grey:   { fur: '#a9b3c2', belly: '#eef1f5', ear: '#f4a3b5' },
  cream:  { fur: '#f3e3cf', belly: '#ffffff', ear: '#f4a3b5' },
  night:  { fur: '#5a5466', belly: '#9a94a8', ear: '#e58fa6', stripes: true }
};
const INK = '#3a2a2e';

/* a sitting cat, seen from the front. `cat-tail` and `cat-eyes` are animated by film.css / cats.css */
export function catInner(p: CatPalette = CAT_COATS.ginger): string {
  const stripe = p.stripes ? '<path d="M52 36 L53 44 M60 34 L60 43 M68 36 L67 44" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round" opacity=".32"/>' : '';
  return '' +
    '<ellipse cx="60" cy="124" rx="36" ry="5" fill="#000" opacity=".14"/>' +
    '<g class="cat-tail"><path d="M88 114 Q118 110 112 78" fill="none" stroke="' + p.fur + '" stroke-width="10" stroke-linecap="round"/></g>' +
    '<path d="M32 118 Q28 84 48 72 L72 72 Q92 84 88 118 Q86 126 60 126 Q34 126 32 118Z" fill="' + p.fur + '"/>' +
    '<ellipse cx="60" cy="104" rx="16" ry="20" fill="' + p.belly + '"/>' +
    '<ellipse cx="46" cy="122" rx="9" ry="5" fill="' + p.belly + '"/><ellipse cx="74" cy="122" rx="9" ry="5" fill="' + p.belly + '"/>' +
    '<path d="M35 47 L33 19 L53 34Z" fill="' + p.fur + '"/><path d="M85 47 L87 19 L67 34Z" fill="' + p.fur + '"/>' +
    '<path d="M38 43 L37 27 L49 36Z" fill="' + p.ear + '"/><path d="M82 43 L83 27 L71 36Z" fill="' + p.ear + '"/>' +
    '<ellipse cx="60" cy="54" rx="28" ry="24" fill="' + p.fur + '"/>' + stripe +
    '<g class="cat-eyes"><ellipse cx="49" cy="52" rx="4.4" ry="5.8" fill="' + INK + '"/><ellipse cx="71" cy="52" rx="4.4" ry="5.8" fill="' + INK + '"/>' +
    '<circle cx="47.6" cy="49.6" r="1.7" fill="#fff"/><circle cx="69.6" cy="49.6" r="1.7" fill="#fff"/></g>' +
    '<path d="M57 60 L63 60 L60 64Z" fill="' + p.ear + '"/>' +
    '<path d="M60 64 Q60 69 55 69 M60 64 Q60 69 65 69" fill="none" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M40 60 L24 57 M40 64 L25 66 M80 60 L96 57 M80 64 L95 66" stroke="' + INK + '" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>';
}

export interface MousePalette { fur: string; belly: string; scarf: string }
export const MICE: Record<string, MousePalette> = {
  grey:  { fur: '#bdb6b0', belly: '#f6f1eb', scarf: '#e8527a' },
  brown: { fur: '#c9a88a', belly: '#f6e8d8', scarf: '#4aa8d8' },
  dusk:  { fur: '#a7a1ad', belly: '#efeaf3', scarf: '#f5c84a' }
};

/* a sitting mouse in a knitted scarf */
export function mouseInner(p: MousePalette = MICE.grey): string {
  return '' +
    '<ellipse cx="56" cy="124" rx="26" ry="4.5" fill="#000" opacity=".14"/>' +
    '<g class="cat-tail"><path d="M76 114 Q106 114 100 88" fill="none" stroke="#f2b6a8" stroke-width="4" stroke-linecap="round"/></g>' +
    '<ellipse cx="56" cy="100" rx="22" ry="24" fill="' + p.fur + '"/><ellipse cx="56" cy="106" rx="12" ry="15" fill="' + p.belly + '"/>' +
    '<ellipse cx="44" cy="122" rx="7" ry="4" fill="' + p.belly + '"/><ellipse cx="68" cy="122" rx="7" ry="4" fill="' + p.belly + '"/>' +
    '<circle cx="39" cy="60" r="13" fill="' + p.fur + '"/><circle cx="73" cy="60" r="13" fill="' + p.fur + '"/>' +
    '<circle cx="39" cy="60" r="7" fill="#f2b6a8"/><circle cx="73" cy="60" r="7" fill="#f2b6a8"/>' +
    '<ellipse cx="56" cy="74" rx="21" ry="18" fill="' + p.fur + '"/>' +
    '<g class="cat-eyes"><circle cx="48" cy="72" r="3.4" fill="' + INK + '"/><circle cx="64" cy="72" r="3.4" fill="' + INK + '"/>' +
    '<circle cx="47" cy="70.8" r="1.1" fill="#fff"/><circle cx="63" cy="70.8" r="1.1" fill="#fff"/></g>' +
    '<circle cx="56" cy="80" r="3.2" fill="#f2a0b0"/>' +
    '<path d="M38 79 L24 76 M38 83 L25 85 M74 79 L88 76 M74 83 L87 85" stroke="' + INK + '" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>' +
    '<path d="M36 88 Q56 100 76 88 L76 95 Q56 107 36 95Z" fill="' + p.scarf + '"/><path d="M66 94 L76 96 L78 114 L68 112Z" fill="' + p.scarf + '"/>' +
    '<path d="M42 92 L44 98 M50 96 L52 102 M58 97 L60 103" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>';
}

/* a ball of yarn centred on (0, 0), radius 26, with a loose end curling out to the right */
export function yarnBall(color: string, dark: string): string {
  return '<circle r="26" fill="' + color + '"/>' +
    '<path d="M-22 -10 Q0 -24 22 -10 M-26 2 Q0 -16 26 2 M-24 14 Q0 -2 24 14 M-14 -22 Q-30 0 -14 22 M6 -25 Q26 -4 6 25" fill="none" stroke="' + dark + '" stroke-width="3" stroke-linecap="round" opacity=".55"/>' +
    '<path d="M-14 -18 Q-6 -24 4 -24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/>' +
    '<path d="M20 16 Q40 34 62 22 Q76 14 88 24" fill="none" stroke="' + color + '" stroke-width="4.5" stroke-linecap="round"/>';
}
export const YARN: [string, string][] = [['#e8527a', '#a82a52'], ['#f5c84a', '#b8861a'], ['#5aa6c9', '#2a6a8f'], ['#6fc48a', '#2f8a52']];

/* a pastel cat-town house: a wall, a roof with two pointed ears, a round window and a door. `k` scales the door and strokes (1 on the film
   canvas, a little less on the smaller cinematic stage) */
export function catHouse(x: number, y: number, w: number, h: number, wall: string, roof: string, lit: boolean, k = 1): string {
  const r = (n: number) => Math.round(n);
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + 6 * k + '" fill="' + wall + '"/>' +
    '<path d="M' + (x - 8 * k) + ' ' + y + ' L' + (x + 4 * k) + ' ' + r(y - w * 0.46) + ' L' + r(x + w * 0.5) + ' ' + r(y - w * 0.12) + ' L' + (x + w - 4 * k) + ' ' + r(y - w * 0.46) + ' L' + (x + w + 8 * k) + ' ' + y + 'Z" fill="' + roof + '"/>' +
    '<circle cx="' + (x + w / 2) + '" cy="' + r(y + h * 0.42) + '" r="' + r(w * 0.16) + '" fill="' + (lit ? '#ffe29a' : '#fff6e0') + '" stroke="#fff" stroke-width="' + 3 * k + '"/>' +
    '<rect x="' + (x + w / 2 - 7 * k) + '" y="' + (y + h - 26 * k) + '" width="' + 14 * k + '" height="' + 26 * k + '" rx="' + 7 * k + '" fill="#7a5a66"/>';
}
