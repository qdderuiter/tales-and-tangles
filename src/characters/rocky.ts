/* ---------- Rocky, the very cute stone ----------
   Drawn as inline SVG, like Rexy and Pippy: a lumpy grey pebble with big shiny eyes, rosy cheeks, two stubby arms, a crack across one side and a
   tuft of moss on top. `rockyInner()` is one drawing alone (a 200 x 220 box, base at y 208), so the underground film can place it on its own
   stage; `rockyMarkup()` wraps it as the portrait for the story screen. */

export interface RockyPalette { body: string; deep: string; belly: string; moss: string }
export const ROCKY: RockyPalette = { body: '#aaa39b', deep: '#7f776f', belly: '#d9d3c9', moss: '#7bbf6a' };
const INK = '#2f2b33', BLUSH = '#ff8fab';

export function rockyInner(p: RockyPalette = ROCKY): string {
  return '' +
    '<ellipse cx="100" cy="208" rx="66" ry="7" fill="#000" opacity=".14"/>' +
    '<g class="rk-body">' +
      '<path d="M32 176 Q22 112 62 76 Q100 50 142 74 Q182 108 168 176 Q160 208 100 208 Q42 208 32 176Z" fill="' + p.body + '"/>' +
      '<path d="M44 168 Q38 118 70 90 Q96 70 124 80" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".28"/>' +
      '<path d="M138 82 Q150 110 142 134 L152 150 L140 170" fill="none" stroke="' + p.deep + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>' +
      '<ellipse cx="102" cy="172" rx="46" ry="30" fill="' + p.belly + '" opacity=".7"/>' +
      '<circle cx="58" cy="150" r="6" fill="' + p.deep + '" opacity=".45"/><circle cx="150" cy="176" r="5" fill="' + p.deep + '" opacity=".45"/><circle cx="76" cy="190" r="4" fill="' + p.deep + '" opacity=".45"/>' +
      '<g class="rk-arm l"><path d="M38 140 Q22 146 24 160" fill="none" stroke="' + p.deep + '" stroke-width="9" stroke-linecap="round"/></g>' +
      '<g class="rk-arm r"><path d="M162 140 Q178 146 176 160" fill="none" stroke="' + p.deep + '" stroke-width="9" stroke-linecap="round"/></g>' +
    '</g>' +
    '<g class="rk-moss"><path d="M84 62 Q80 44 90 50 Q92 34 102 46 Q112 36 112 54 Q122 48 118 66Z" fill="' + p.moss + '"/><circle cx="100" cy="50" r="3" fill="#ffe29a"/></g>' +
    '<g class="rk-face">' +
      '<circle class="rk-blush" cx="68" cy="138" r="9" fill="' + BLUSH + '" opacity=".5"/><circle class="rk-blush" cx="132" cy="138" r="9" fill="' + BLUSH + '" opacity=".5"/>' +
      '<g class="rk-eyes"><ellipse cx="78" cy="118" rx="12" ry="15" fill="' + INK + '"/><ellipse cx="122" cy="118" rx="12" ry="15" fill="' + INK + '"/>' +
      '<circle cx="73" cy="111" r="5" fill="#fff"/><circle cx="117" cy="111" r="5" fill="#fff"/><circle cx="83" cy="124" r="2.4" fill="#fff" opacity=".8"/><circle cx="127" cy="124" r="2.4" fill="#fff" opacity=".8"/></g>' +
      '<path class="rk-brow" d="M62 106 L90 98 M138 106 L110 98" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/>' +
      '<path class="rk-mouth smile" d="M90 146 Q100 158 110 146" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/>' +
      '<path class="rk-mouth frown" d="M90 154 Q100 142 110 154" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/>' +
    '</g>';
}

/* the portrait: Rocky sitting on the cave floor (viewBox 200 x 240) */
export function rockyMarkup(): string {
  return '<svg viewBox="0 0 200 240" class="rk-svg" aria-hidden="true"><g transform="translate(0 6)">' + rockyInner() + '</g></svg>';
}

export interface RockyPortrait { root: HTMLElement; react(e: string): void }

export const Rocky = {
  EMOS: ['happy', 'shy', 'wiggle', 'surprised', 'sad', 'proud'],
  create(host: HTMLElement): RockyPortrait {
    host.innerHTML = '<div class="rocky b-happy">' + rockyMarkup() + '</div>';
    const root = host.firstElementChild as HTMLElement;
    return { root, react(e: string) { Rocky.EMOS.forEach(c => root.classList.remove('b-' + c)); root.classList.add('b-' + (Rocky.EMOS.includes(e) ? e : 'happy')); } };
  }
};
