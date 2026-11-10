/* ---------- Biscuit, the little sand worm in the red bow tie ----------
   Drawn as inline SVG, like Evil Larry and Pickle: a plump, sand-coloured worm made of soft round segments, a big round head, shiny eyes,
   rosy cheeks and a tiny smile. `wormInner()` is the drawing alone (a 200 x 220 box), so the desert cinematic can place it in its own scene;
   `wormMarkup()` wraps it as the full-body portrait for the story screen. He sits in a small mound of sand. */

const SAND = '#f2c98e', SAND_DEEP = '#e2ab68', LIGHT = '#fbe5bf', INK = '#3a2a4a', BLUSH = '#ff8fab', TIE = '#e8506a', TIE_DEEP = '#c23a57', MOUND = '#e8c288';

export function wormInner(): string {
  return '' +
    '<ellipse cx="100" cy="208" rx="88" ry="15" fill="' + MOUND + '"/><ellipse cx="100" cy="204" rx="70" ry="9" fill="#f3d5a0"/>' +
    '<g class="worm-body">' +
      '<circle cx="102" cy="190" r="37" fill="' + SAND_DEEP + '"/><circle cx="98" cy="164" r="35" fill="' + SAND + '"/><circle cx="102" cy="140" r="33" fill="' + SAND_DEEP + '"/>' +
      '<path d="M72 176 Q98 188 126 176 M70 152 Q98 164 128 152" fill="none" stroke="' + SAND_DEEP + '" stroke-width="3" stroke-linecap="round" opacity=".55"/>' +
      '<ellipse cx="86" cy="168" rx="10" ry="14" fill="' + LIGHT + '" opacity=".35"/>' +
    '</g>' +
    '<g class="worm-head">' +
      '<circle cx="100" cy="88" r="52" fill="' + SAND + '"/>' +
      '<ellipse cx="100" cy="106" rx="35" ry="25" fill="' + LIGHT + '"/>' +
      '<circle cx="62" cy="62" r="3.2" fill="' + SAND_DEEP + '"/><circle cx="138" cy="60" r="3" fill="' + SAND_DEEP + '"/><circle cx="104" cy="45" r="2.6" fill="' + SAND_DEEP + '"/><circle cx="82" cy="49" r="2.2" fill="' + SAND_DEEP + '"/>' +
      '<circle class="worm-blush" cx="58" cy="104" r="9" fill="' + BLUSH + '" opacity=".5"/><circle class="worm-blush" cx="142" cy="104" r="9" fill="' + BLUSH + '" opacity=".5"/>' +
      '<g class="worm-eyes"><ellipse cx="78" cy="86" rx="10.5" ry="13.5" fill="' + INK + '"/><ellipse cx="122" cy="86" rx="10.5" ry="13.5" fill="' + INK + '"/>' +
      '<circle cx="74.5" cy="80" r="4.4" fill="#fff"/><circle cx="118.5" cy="80" r="4.4" fill="#fff"/><circle cx="82" cy="92" r="2" fill="#fff"/><circle cx="126" cy="92" r="2" fill="#fff"/></g>' +
      '<path class="worm-brow" d="M62 72 L92 62 M138 72 L108 62" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/>' +
      '<path class="worm-mouth smile" d="M90 107 Q95 116 100 108 Q105 116 110 107" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path class="worm-mouth frown" d="M90 118 Q100 107 110 118" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/>' +
      '<ellipse class="worm-mouth o" cx="100" cy="114" rx="6" ry="7.5" fill="' + INK + '"/>' +
    '</g>' +
    '<g class="worm-tie"><path d="M100 140 L66 124 Q58 140 66 158Z" fill="' + TIE + '"/><path d="M100 140 L134 124 Q142 140 134 158Z" fill="' + TIE + '"/>' +
      '<circle cx="80" cy="134" r="2.6" fill="#fff" opacity=".75"/><circle cx="84" cy="148" r="2.2" fill="#fff" opacity=".75"/><circle cx="120" cy="134" r="2.6" fill="#fff" opacity=".75"/><circle cx="116" cy="148" r="2.2" fill="#fff" opacity=".75"/>' +
      '<rect x="89" y="130" width="22" height="22" rx="8" fill="' + TIE_DEEP + '"/><path d="M94 135 Q100 132 106 135" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".5"/></g>';
}

export function wormMarkup(): string {
  return '<svg viewBox="0 0 200 220" class="worm-svg" aria-hidden="true">' + wormInner() + '</svg>';
}

export interface WormPortrait { root: HTMLElement; react(e: string): void }

export const Worm = {
  EMOS: ['happy', 'shy', 'wiggle', 'surprised', 'sad', 'sleepy'],
  create(host: HTMLElement): WormPortrait {
    host.innerHTML = '<div class="biscuit b-happy">' + wormMarkup() + '</div>';
    const root = host.firstElementChild as HTMLElement;
    return { root, react(e: string) { Worm.EMOS.forEach(c => root.classList.remove('b-' + c)); root.classList.add('b-' + (Worm.EMOS.includes(e) ? e : 'happy')); } };
  }
};
