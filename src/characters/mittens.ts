/* ---------- Queen Mittens, ruler of the Whisker Isles ----------
   Drawn as inline SVG, like Rocky and Pippy: a plump cream cat with a tiny gold crown, big shiny eyes, whiskers and a curled tail.
   `mittensInner()` is one drawing alone (a 200 x 220 box, feet at y 208), so the cat films can place her on their own stage;
   `mittensMarkup()` wraps it as the portrait for the story screen. */

export interface MittensPalette { fur: string; deep: string; chest: string; pink: string; gold: string }
export const MITTENS: MittensPalette = { fur: '#f7e1c4', deep: '#e3c196', chest: '#fff8ee', pink: '#f4a3b5', gold: '#f5c84a' };
const INK = '#3a2a2e';

export function mittensInner(p: MittensPalette = MITTENS): string {
  const whisk = (sx: number, dir: number) =>
    [[-6, -10], [0, 0], [6, 10]].map(([a, b]) => '<path d="M' + sx + ' ' + (118 + a) + ' Q' + (sx + dir * 20) + ' ' + (116 + b) + ' ' + (sx + dir * 40) + ' ' + (118 + b * 1.6) + '" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>').join('');
  return '' +
    '<ellipse cx="100" cy="208" rx="62" ry="7" fill="#000" opacity=".14"/>' +
    '<g class="mm-tail"><path d="M150 196 Q198 190 190 150 Q186 128 166 134" fill="none" stroke="' + p.fur + '" stroke-width="20" stroke-linecap="round"/><path d="M150 196 Q198 190 190 150 Q186 128 166 134" fill="none" stroke="' + p.deep + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 14" opacity=".7"/></g>' +
    '<g class="mm-body">' +
      '<path d="M46 190 Q40 142 70 124 L130 124 Q160 142 154 190 Q150 208 100 208 Q50 208 46 190Z" fill="' + p.fur + '"/>' +
      '<ellipse cx="100" cy="170" rx="30" ry="34" fill="' + p.chest + '"/>' +
      '<ellipse cx="74" cy="204" rx="17" ry="9" fill="' + p.chest + '"/><ellipse cx="126" cy="204" rx="17" ry="9" fill="' + p.chest + '"/>' +
      '<path d="M66 160 q6 10 0 20 M134 160 q-6 10 0 20" fill="none" stroke="' + p.deep + '" stroke-width="3.4" stroke-linecap="round" opacity=".6"/>' +
    '</g>' +
    '<g class="mm-head">' +
      '<path d="M54 84 L52 34 L88 58Z" fill="' + p.fur + '"/><path d="M146 84 L148 34 L112 58Z" fill="' + p.fur + '"/>' +
      '<path d="M60 76 L59 46 L81 60Z" fill="' + p.pink + '"/><path d="M140 76 L141 46 L119 60Z" fill="' + p.pink + '"/>' +
      '<ellipse cx="100" cy="98" rx="52" ry="44" fill="' + p.fur + '"/>' +
      '<path d="M86 60 Q100 52 114 60" fill="none" stroke="' + p.deep + '" stroke-width="3" stroke-linecap="round" opacity=".6"/>' +
      '<path d="M78 56 L82 36 L92 46 L100 30 L108 46 L118 36 L122 56Z" fill="' + p.gold + '" stroke="#c9962a" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="100" cy="42" r="3.4" fill="#e8527a"/><circle cx="84" cy="46" r="2.4" fill="#4aa8d8"/><circle cx="116" cy="46" r="2.4" fill="#4aa8d8"/>' +
      '<circle class="mm-blush" cx="68" cy="112" r="9" fill="' + p.pink + '" opacity=".55"/><circle class="mm-blush" cx="132" cy="112" r="9" fill="' + p.pink + '" opacity=".55"/>' +
      whisk(66, -1) + whisk(134, 1) +
      '<g class="mm-eyes"><ellipse cx="80" cy="96" rx="9" ry="12" fill="' + INK + '"/><ellipse cx="120" cy="96" rx="9" ry="12" fill="' + INK + '"/>' +
      '<circle cx="76.5" cy="90" r="3.8" fill="#fff"/><circle cx="116.5" cy="90" r="3.8" fill="#fff"/><circle cx="83" cy="101" r="1.8" fill="#fff" opacity=".8"/><circle cx="123" cy="101" r="1.8" fill="#fff" opacity=".8"/></g>' +
      '<path class="mm-brow" d="M68 80 L92 86 M132 80 L108 86" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M94 110 L106 110 L100 118Z" fill="' + p.pink + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path class="mm-mouth smile" d="M100 118 Q100 128 90 128 M100 118 Q100 128 110 128" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path class="mm-mouth frown" d="M100 120 Q100 112 92 112 M100 120 Q100 112 108 112" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
    '</g>';
}

/* the portrait: Queen Mittens sitting on her cushion (viewBox 200 x 240) */
export function mittensMarkup(): string {
  return '<svg viewBox="0 0 200 240" class="mm-svg" aria-hidden="true"><g transform="translate(0 6)">' + mittensInner() + '</g></svg>';
}

export interface MittensPortrait { root: HTMLElement; react(e: string): void }

export const Mittens = {
  EMOS: ['happy', 'shy', 'wiggle', 'surprised', 'sad', 'proud'],
  create(host: HTMLElement): MittensPortrait {
    host.innerHTML = '<div class="mittens b-happy">' + mittensMarkup() + '</div>';
    const root = host.firstElementChild as HTMLElement;
    return { root, react(e: string) { Mittens.EMOS.forEach(c => root.classList.remove('b-' + c)); root.classList.add('b-' + (Mittens.EMOS.includes(e) ? e : 'happy')); } };
  }
};
