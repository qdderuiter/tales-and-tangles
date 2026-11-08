import { OUTFIT_DEFAULT, WARDROBE_BY_ID } from '../data/wardrobe.js';

export const BROWS = {
  neutral:   ['M72 80 Q82 75 92 79',  'M108 79 Q118 75 128 80'],
  happy:     ['M72 78 Q82 72 92 77',  'M108 77 Q118 72 128 78'],
  proud:     ['M72 78 Q82 72 92 77',  'M108 77 Q118 72 128 78'],
  thinking:  ['M72 82 Q82 78 92 76',  'M108 73 Q118 69 128 75'],
  surprised: ['M72 74 Q82 68 92 73',  'M108 73 Q118 68 128 74'],
  sad:       ['M72 76 Q82 78 92 82',  'M108 82 Q118 78 128 76']
};

export const MOUTHS = {  // [closed, open]
  neutral:   ['M90 124 Q100 131 110 124', 'M90 123 Q100 140 110 123 Z'],
  happy:     ['M87 122 Q100 138 113 122', 'M88 122 Q100 146 112 122 Z'],
  proud:     ['M88 123 Q100 135 112 123', 'M88 122 Q100 146 112 122 Z'],
  thinking:  ['M91 128 Q100 125 109 125', 'M92 124 Q100 136 108 124 Z'],
  surprised: ['M94 126 a6 8 0 1 0 12 0 a6 8 0 1 0 -12 0 Z', 'M94 126 a6 8 0 1 0 12 0 a6 8 0 1 0 -12 0 Z'],
  sad:       ['M90 130 Q100 121 110 130', 'M92 128 Q100 138 108 128 Z']
};

export const Outfit = {
  current: Object.assign({}, OUTFIT_DEFAULT),
  item(slot, id) { const it = WARDROBE_BY_ID[id]; return it && it.slot === slot ? it : WARDROBE_BY_ID[OUTFIT_DEFAULT[slot]]; },
  svg(slot, id) { return this.item(slot, id).svg; }
};

export const bearEye = x => '<g class="eye" style="transform-origin:' + x + 'px 94px"><ellipse cx="' + x + '" cy="94" rx="7" ry="8.5" fill="#fff"/>' +
  '<g class="pupil-g"><circle class="iris" cx="' + x + '" cy="95" r="4.8" fill="#2d2118"/><circle cx="' + (x + 1.8) + '" cy="93" r="1.7" fill="#fff"/></g></g>';

export function bearMarkup(outfit) {
  outfit = outfit || Outfit.current;
  return '<div class="bear"><svg viewBox="0 0 200 230" class="bear-svg" role="img" aria-label="Barnaby the Detective Bear">' +
  '<ellipse cx="100" cy="224" rx="64" ry="7" fill="rgba(120,90,60,.18)"/>' +
  '<g class="bear-idle">' +
    '<path class="coatfill" d="M50 218 Q44 158 76 148 L124 148 Q156 158 150 218 Z" fill="url(#coat)"/>' +
    '<path d="M78 148 L100 186 L122 148 Z" fill="#fff6e8"/>' +
    '<path d="M76 148 L100 192 L82 150 Z" fill="#b78649"/><path d="M124 148 L100 192 L118 150 Z" fill="#b78649"/>' +
    '<g class="slot-neck">' + Outfit.svg('neck', outfit.neck) + '</g>' +
    '<circle cx="86" cy="204" r="3.2" fill="#7a5530"/><circle cx="114" cy="204" r="3.2" fill="#7a5530"/>' +
    '<ellipse cx="48" cy="182" rx="14" ry="27" fill="#c99a62" transform="rotate(10 48 182)"/>' +
    '<circle cx="44" cy="207" r="12" fill="#8b5a3c"/>' +
    '<g class="bear-arm">' +
      '<ellipse cx="152" cy="182" rx="14" ry="27" fill="#c99a62" transform="rotate(-12 152 182)"/>' +
      '<line x1="158" y1="203" x2="167" y2="170" stroke="#6d4a30" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="158" cy="205" r="12" fill="#8b5a3c"/>' +
      '<circle cx="171" cy="150" r="20" fill="rgba(205,236,255,.55)" stroke="#d9a441" stroke-width="6"/>' +
      '<path d="M160 144 Q163 136 172 134" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>' +
    '</g>' +
    '<circle cx="56" cy="58" r="18" fill="#8b5a3c"/><circle cx="56" cy="58" r="9" fill="#e8a99a"/>' +
    '<circle cx="144" cy="58" r="18" fill="#8b5a3c"/><circle cx="144" cy="58" r="9" fill="#e8a99a"/>' +
    '<circle class="fur" cx="100" cy="98" r="50" fill="url(#fur)"/>' +
    '<ellipse cx="100" cy="117" rx="26" ry="20" fill="#f3dcb8"/>' +
    '<ellipse cx="72" cy="115" rx="8" ry="5" fill="#f2a6a0" opacity=".55"/><ellipse cx="128" cy="115" rx="8" ry="5" fill="#f2a6a0" opacity=".55"/>' +
    bearEye(82) + bearEye(118) +
    '<path class="brow-l" d="' + BROWS.neutral[0] + '" stroke="#4a3326" stroke-width="4" stroke-linecap="round" fill="none"/>' +
    '<path class="brow-r" d="' + BROWS.neutral[1] + '" stroke="#4a3326" stroke-width="4" stroke-linecap="round" fill="none"/>' +
    '<g class="slot-face">' + Outfit.svg('face', outfit.face) + '</g>' +
    '<ellipse cx="100" cy="108" rx="8.5" ry="6" fill="#4a3326"/><ellipse cx="97.5" cy="106" rx="2.6" ry="1.5" fill="#8a6a55"/>' +
    '<path d="M100 114 L100 121" stroke="#4a3326" stroke-width="3" stroke-linecap="round"/>' +
    '<path class="mouth-closed" d="' + MOUTHS.neutral[0] + '" stroke="#4a3326" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
    '<path class="mouth-open" d="' + MOUTHS.neutral[1] + '" fill="#7a2f35" stroke="#4a3326" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<g class="slot-hat">' + Outfit.svg('hat', outfit.hat) + '</g>' +
  '</g></svg></div>';
}
