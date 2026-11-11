/* ---------- Pippy, the very small clown elephant ----------
   Drawn as inline SVG, like Biscuit, Pickle and Evil Larry: a round blue-grey elephant with big pink-lined ears, a curled trunk, shiny eyes,
   rosy cheeks, a ruffled clown collar and a little party hat. `elephantInner()` is the drawing alone (a 200 x 220 box, feet at y 208), so the
   circus cinematic can put him on its own stage; `starBall()` is his lucky ball; `elephantMarkup()` wraps both as the portrait for the story
   screen, with Pippy balancing on the ball. */

const BODY = '#b9c6dd', BODY_DEEP = '#9aa9c6', LIGHT = '#dde5f2', EAR = '#f6b3c4', INK = '#3a2a4a', BLUSH = '#ff8fab', RUFF = '#ff6f91', RUFF_DEEP = '#e8506a', HAT = '#ffd24a', HAT_STRIPE = '#e8506a';

/* the lucky star ball: a golden ball with a big red star. Centred on (cx, cy). The star group turns, so a rolling ball can be seen rolling. */
export function starBall(cx: number, cy: number, r: number): string {
  const k = r / 50;
  return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + k + ')">' +
    '<circle r="50" fill="#e9a21c"/><circle r="47" fill="#ffd24a"/>' +
    '<g class="ele-ballstar"><path d="M0 -34 L9 -11 L34 -10 L14 6 L21 31 L0 17 L-21 31 L-14 6 L-34 -10 L-9 -11Z" fill="' + RUFF_DEEP + '" stroke="#fff6d0" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="-26" cy="-26" r="3.2" fill="#fff6d0"/><circle cx="28" cy="-22" r="2.6" fill="#fff6d0"/><circle cx="-4" cy="40" r="3" fill="#fff6d0"/></g>' +
    '<ellipse cx="-20" cy="-26" rx="14" ry="8" fill="#fff" opacity=".45" transform="rotate(-35 -20 -26)"/></g>';
}

export function elephantInner(): string {
  return '' +
    '<ellipse cx="100" cy="210" rx="62" ry="7" fill="#000" opacity=".12"/>' +
    '<g class="ele-body">' +
      '<rect x="56" y="168" width="32" height="40" rx="14" fill="' + BODY_DEEP + '"/><rect x="112" y="168" width="32" height="40" rx="14" fill="' + BODY_DEEP + '"/>' +
      '<path d="M62 204 h20 M118 204 h20" stroke="' + LIGHT + '" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
      '<ellipse cx="100" cy="150" rx="60" ry="46" fill="' + BODY + '"/>' +
      '<ellipse cx="100" cy="162" rx="36" ry="28" fill="' + LIGHT + '" opacity=".7"/>' +
      '<path d="M158 150 Q176 150 176 166" fill="none" stroke="' + BODY_DEEP + '" stroke-width="7" stroke-linecap="round"/>' +
    '</g>' +
    '<g class="ele-ruff">' + [0, 1, 2, 3, 4, 5, 6].map(i => '<circle cx="' + (58 + i * 14.7) + '" cy="' + (134 + (i === 0 || i === 6 ? 4 : i === 3 ? -1 : 1)) + '" r="11" fill="' + (i % 2 ? RUFF_DEEP : RUFF) + '"/>').join('') +
      '<circle cx="76" cy="132" r="2.4" fill="#fff" opacity=".8"/><circle cx="106" cy="134" r="2.4" fill="#fff" opacity=".8"/><circle cx="128" cy="132" r="2.4" fill="#fff" opacity=".8"/></g>' +
    '<g class="ele-head">' +
      '<g class="ele-ear l"><circle cx="44" cy="86" r="36" fill="' + BODY_DEEP + '"/><circle cx="46" cy="88" r="25" fill="' + EAR + '"/></g>' +
      '<g class="ele-ear r"><circle cx="156" cy="86" r="36" fill="' + BODY_DEEP + '"/><circle cx="154" cy="88" r="25" fill="' + EAR + '"/></g>' +
      '<circle cx="100" cy="88" r="50" fill="' + BODY + '"/>' +
      '<ellipse cx="100" cy="108" rx="34" ry="24" fill="' + LIGHT + '" opacity=".75"/>' +
      '<circle class="ele-blush" cx="66" cy="104" r="9" fill="' + BLUSH + '" opacity=".5"/><circle class="ele-blush" cx="134" cy="104" r="9" fill="' + BLUSH + '" opacity=".5"/>' +
      '<g class="ele-eyes"><ellipse cx="78" cy="82" rx="8" ry="11" fill="' + INK + '"/><ellipse cx="122" cy="82" rx="8" ry="11" fill="' + INK + '"/>' +
      '<circle cx="75.5" cy="77" r="3.4" fill="#fff"/><circle cx="119.5" cy="77" r="3.4" fill="#fff"/><circle cx="80" cy="87" r="1.6" fill="#fff"/><circle cx="124" cy="87" r="1.6" fill="#fff"/></g>' +
      '<path class="ele-brow" d="M66 66 L90 60 M134 66 L110 60" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path class="ele-mouth smile" d="M70 112 Q75 122 86 119 M130 112 Q125 122 114 119" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path class="ele-mouth frown" d="M70 123 Q76 114 86 118 M130 123 Q124 114 114 118" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<g transform="translate(100 96)"><g class="ele-trunk"><path d="M0 0 Q0 48 -24 52 Q-38 54 -36 38" fill="none" stroke="' + BODY_DEEP + '" stroke-width="26" stroke-linecap="round"/>' +
      '<path d="M0 0 Q0 48 -24 52 Q-38 54 -36 38" fill="none" stroke="' + BODY + '" stroke-width="20" stroke-linecap="round"/>' +
      '<path d="M-5 14 q9 3 12 0 M-6 28 q9 3 12 0" fill="none" stroke="' + BODY_DEEP + '" stroke-width="2.6" stroke-linecap="round" opacity=".7"/></g></g>' +
      '<g class="ele-hat"><path d="M80 44 L100 4 L120 44Z" fill="' + HAT + '" stroke="' + HAT_STRIPE + '" stroke-width="0"/><path d="M86 32 L114 32 M91 20 L109 20" stroke="' + HAT_STRIPE + '" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="100" cy="4" r="8" fill="' + RUFF + '"/></g>' +
    '</g>';
}

/* the portrait: Pippy standing on his star ball (viewBox 200 x 300; the ball is centred at y 252) */
export function elephantMarkup(): string {
  return '<svg viewBox="0 0 200 300" class="ele-svg" aria-hidden="true"><g class="ele-ball">' + starBall(100, 252, 46) + '</g><g transform="translate(0 -8)">' + elephantInner() + '</g></svg>';
}

export interface ElephantPortrait { root: HTMLElement; react(e: string): void }

export const Elephant = {
  EMOS: ['happy', 'shy', 'wiggle', 'surprised', 'sad', 'proud'],
  create(host: HTMLElement): ElephantPortrait {
    host.innerHTML = '<div class="pippy b-happy">' + elephantMarkup() + '</div>';
    const root = host.firstElementChild as HTMLElement;
    return { root, react(e: string) { Elephant.EMOS.forEach(c => root.classList.remove('b-' + c)); root.classList.add('b-' + (Elephant.EMOS.includes(e) ? e : 'happy')); } };
  }
};
