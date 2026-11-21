/* ---------- Chef Pasquale, the very small chef rat ----------
   Drawn as inline SVG, like Mittens and Rocky: a plump, round little rat with huge shiny eyes, big pink ears, tiny buck teeth,
   a puffy white chef's hat, a floury apron and a wooden spoon. The portrait is a 200 x 240 box, feet at y 208. */

const FUR = '#c9b09c', DEEP = '#a98f7b', CREAM = '#f8ebdd', PINK = '#f4a3b5', INK = '#3a2a2e', HAT = '#ffffff', HAT_EDGE = '#e6dccf';

export function pasqualeInner(): string {
  const whisk = (sx: number, dir: number) =>
    [[-6, -9], [0, 0], [6, 9]].map(([a, b]) => '<path d="M' + sx + ' ' + (116 + a) + ' Q' + (sx + dir * 18) + ' ' + (114 + b) + ' ' + (sx + dir * 36) + ' ' + (116 + b * 1.5) + '" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>').join('');
  return '' +
    '<ellipse cx="100" cy="208" rx="58" ry="7" fill="#000" opacity=".14"/>' +
    '<g class="pq-tail"><path d="M146 198 Q198 202 190 160 Q186 140 168 148" fill="none" stroke="' + PINK + '" stroke-width="9" stroke-linecap="round"/></g>' +
    '<g>' +
      '<path d="M50 192 Q44 146 74 128 L126 128 Q156 146 150 192 Q146 208 100 208 Q54 208 50 192Z" fill="' + FUR + '"/>' +
      '<ellipse cx="100" cy="172" rx="30" ry="32" fill="' + CREAM + '"/>' +
      '<path d="M74 142 L126 142 L132 200 Q100 212 68 200Z" fill="#fff" stroke="' + HAT_EDGE + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<rect x="88" y="168" width="24" height="16" rx="4" fill="none" stroke="' + HAT_EDGE + '" stroke-width="2.4"/>' +
      '<path d="M100 138 L86 130 L88 146Z M100 138 L114 130 L112 146Z" fill="#e8527a"/><circle cx="100" cy="138" r="4" fill="#d63d66"/>' +
      '<ellipse cx="76" cy="205" rx="16" ry="8" fill="' + CREAM + '"/><ellipse cx="124" cy="205" rx="16" ry="8" fill="' + CREAM + '"/>' +
    '</g>' +
    '<g class="pq-spoon"><path d="M48 168 L40 118" fill="none" stroke="#c98d4e" stroke-width="5" stroke-linecap="round"/><ellipse cx="38" cy="110" rx="9" ry="12" fill="#d9a066" stroke="#b27838" stroke-width="2" transform="rotate(-8 38 110)"/><circle cx="50" cy="168" r="9" fill="' + FUR + '"/></g>' +
    '<circle cx="144" cy="170" r="9" fill="' + FUR + '"/>' +
    '<g class="pq-head">' +
      '<circle cx="58" cy="68" r="25" fill="' + FUR + '"/><circle cx="142" cy="68" r="25" fill="' + FUR + '"/>' +
      '<circle cx="58" cy="68" r="16" fill="' + PINK + '"/><circle cx="142" cy="68" r="16" fill="' + PINK + '"/>' +
      '<ellipse cx="100" cy="102" rx="50" ry="42" fill="' + FUR + '"/>' +
      '<ellipse cx="100" cy="116" rx="26" ry="19" fill="' + CREAM + '"/>' +
      '<path d="M82 66 Q100 58 118 66" fill="none" stroke="' + DEEP + '" stroke-width="3" stroke-linecap="round" opacity=".6"/>' +
      '<rect x="76" y="50" width="48" height="17" rx="5" fill="' + HAT + '" stroke="' + HAT_EDGE + '" stroke-width="2.4"/>' +
      '<circle cx="82" cy="40" r="14" fill="' + HAT + '" stroke="' + HAT_EDGE + '" stroke-width="2.4"/><circle cx="118" cy="40" r="14" fill="' + HAT + '" stroke="' + HAT_EDGE + '" stroke-width="2.4"/><circle cx="100" cy="32" r="17" fill="' + HAT + '" stroke="' + HAT_EDGE + '" stroke-width="2.4"/>' +
      '<rect x="78" y="46" width="44" height="18" rx="5" fill="' + HAT + '"/><path d="M84 58 L116 58" stroke="' + HAT_EDGE + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle class="pq-blush" cx="66" cy="112" r="9" fill="' + PINK + '" opacity=".6"/><circle class="pq-blush" cx="134" cy="112" r="9" fill="' + PINK + '" opacity=".6"/>' +
      whisk(70, -1) + whisk(130, 1) +
      '<g class="pq-eyes"><ellipse cx="81" cy="98" rx="10.5" ry="13.5" fill="' + INK + '"/><ellipse cx="119" cy="98" rx="10.5" ry="13.5" fill="' + INK + '"/>' +
      '<circle cx="77" cy="91" r="4.4" fill="#fff"/><circle cx="115" cy="91" r="4.4" fill="#fff"/><circle cx="85" cy="104" r="2" fill="#fff" opacity=".85"/><circle cx="123" cy="104" r="2" fill="#fff" opacity=".85"/></g>' +
      '<path class="pq-brow" d="M68 86 L92 78 M132 86 L108 78" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<ellipse cx="100" cy="112" rx="6.5" ry="5" fill="' + PINK + '" stroke="' + INK + '" stroke-width="1.6"/>' +
      '<path class="pq-mouth smile" d="M100 117 Q100 127 90 127 M100 117 Q100 127 110 127" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
      '<g class="pq-mouth smile"><rect x="94.5" y="124" width="11" height="9" rx="2.6" fill="#fff" stroke="' + INK + '" stroke-width="1.6"/><path d="M100 124 L100 133" stroke="' + INK + '" stroke-width="1.2"/></g>' +
      '<path class="pq-mouth frown" d="M100 121 Q100 113 92 113 M100 121 Q100 113 108 113" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse class="pq-mouth oh" cx="100" cy="126" rx="5" ry="6" fill="' + INK + '"/>' +
    '</g>';
}

/* the portrait: Chef Pasquale (viewBox 200 x 240) */
export function pasqualeMarkup(): string {
  return '<svg viewBox="0 0 200 240" class="pq-svg" aria-hidden="true"><g transform="translate(0 6)">' + pasqualeInner() + '</g></svg>';
}

export interface PasqualePortrait { root: HTMLElement; react(e: string): void }

const EMOS = ['happy', 'shy', 'wiggle', 'surprised', 'sad', 'proud'];

export const Pasquale = {
  create(host: HTMLElement): PasqualePortrait {
    host.innerHTML = '<div class="pasquale b-happy">' + pasqualeMarkup() + '</div>';
    const root = host.firstElementChild as HTMLElement;
    return { root, react(e: string) { EMOS.forEach(c => root.classList.remove('b-' + c)); root.classList.add('b-' + (EMOS.includes(e) ? e : 'happy')); } };
  }
};
