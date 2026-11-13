/* ---------- the island tiger: a big, stripy, not-quite-as-fierce-as-it-thinks cat ----------
   Drawn as inline SVG, like Evil Larry and Biscuit: `tigerInner()` is the drawing alone, a 280 x 180 box in side view, facing LEFT, so the island
   cinematic (scenes/island-scene.ts) can place and flip it. The scene styles these pieces (styles/island.css): .tg-tail (the swish), .tg-mouth and
   .tg-smile (the roar), .tg-ear and .tg-eye (a frightened look). */
const ORANGE = '#f28c28', DEEP = '#d96d14', BELLY = '#ffe2b0', STRIPE = '#3a2416', PINK = '#e58fa0', EYE = '#ffe45a';

const stripes = (xs: number[], y0: number, y1: number, lean = 8) =>
  xs.map(x => '<path d="M' + x + ' ' + y0 + ' Q' + (x + lean) + ' ' + (y0 + (y1 - y0) / 2) + ' ' + (x - 2) + ' ' + y1 + '" stroke="' + STRIPE + '" stroke-width="7" stroke-linecap="round" fill="none"/>').join('');

export function tigerInner(): string {
  const leg = (x: number) =>
    '<g><rect x="' + x + '" y="108" width="26" height="62" rx="12" fill="' + ORANGE + '"/><ellipse cx="' + (x + 13) + '" cy="170" rx="19" ry="9" fill="' + BELLY + '"/>' +
    '<path d="M' + (x + 3) + ' 128 L' + (x + 23) + ' 128 M' + (x + 4) + ' 144 L' + (x + 22) + ' 144" stroke="' + STRIPE + '" stroke-width="5" stroke-linecap="round"/></g>';
  return '' +
    '<ellipse cx="150" cy="176" rx="116" ry="9" fill="rgba(30,20,10,.28)"/>' +
    '<g class="tg-tail"><path d="M232 96 Q276 84 264 30" fill="none" stroke="' + ORANGE + '" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M247 87 L249 74 M259 70 L270 74 M265 50 L276 52" stroke="' + STRIPE + '" stroke-width="6" stroke-linecap="round"/><circle cx="264" cy="28" r="9" fill="' + STRIPE + '"/></g>' +
    leg(196) + leg(168) +
    '<ellipse cx="152" cy="96" rx="96" ry="48" fill="' + ORANGE + '"/><ellipse cx="148" cy="122" rx="74" ry="22" fill="' + BELLY + '"/>' +
    stripes([112, 134, 156, 178, 200], 52, 100, 6) +
    leg(100) + leg(72) +
    '<g>' +
      '<g class="tg-ear"><path d="M40 52 L28 18 L66 38 Z" fill="' + DEEP + '"/><path d="M42 47 L36 28 L56 40 Z" fill="' + PINK + '"/></g>' +
      '<g class="tg-ear"><path d="M92 40 L108 8 L124 48 Z" fill="' + DEEP + '"/><path d="M99 40 L108 20 L116 44 Z" fill="' + PINK + '"/></g>' +
      '<ellipse cx="80" cy="84" rx="56" ry="48" fill="' + ORANGE + '"/>' +
      '<path d="M58 48 L62 62 M76 42 L78 58 M96 44 L94 60" stroke="' + STRIPE + '" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<path d="M26 82 L38 86 M24 96 L38 96 M136 82 L124 86 M138 96 L124 96" stroke="' + STRIPE + '" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="62" cy="108" rx="34" ry="26" fill="' + BELLY + '"/>' +
      '<g><ellipse class="tg-eye" cx="62" cy="76" rx="11" ry="9" fill="' + EYE + '"/><ellipse class="tg-eye" cx="100" cy="74" rx="11" ry="9" fill="' + EYE + '"/>' +
        '<ellipse cx="60" cy="76" rx="3" ry="8" fill="' + STRIPE + '"/><ellipse cx="98" cy="74" rx="3" ry="8" fill="' + STRIPE + '"/></g>' +
      '<path d="M34 90 L46 90 L40 99 Z" fill="' + PINK + '"/>' +
      '<path class="tg-smile" d="M40 99 Q42 112 54 112 M40 99 Q36 112 24 110" fill="none" stroke="' + STRIPE + '" stroke-width="3.5" stroke-linecap="round"/>' +
      '<g class="tg-mouth"><path d="M26 104 Q40 140 66 112 Q50 106 26 104 Z" fill="#7a1f2a"/><path d="M34 106 L37 117 L41 108 Z M56 110 L58 120 L63 112 Z" fill="#fff"/></g>' +
    '</g>';
}
