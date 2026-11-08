/* ---------- Pickle, the little alien dachshund (and his sausage-bun rocket) ----------
   Drawn as inline SVG, like Evil Larry: a long mint-green body on four stubby legs, big shiny eyes, floppy ears and two glowing antennae.
   `pupMarkup()` is the full-body portrait (story screen, cutscenes); `rocketInner()` is his rocket, pointing LEFT, with a porthole he peeks out of. */

const GREEN = '#8fdc9f', DEEP = '#4fb673', BELLY = '#d9f9e0', INK = '#2b2a63', GLOW = '#ffe27a', BLUSH = '#ff9fb8';

export function pupMarkup(): string {
  return '<svg viewBox="0 0 260 200" class="pup-svg" aria-hidden="true">' +
    '<g class="pup-tail"><path d="M222 118 Q252 112 250 78" fill="none" stroke="' + DEEP + '" stroke-width="12" stroke-linecap="round"/><circle cx="250" cy="76" r="7" fill="' + GLOW + '"/></g>' +
    '<rect x="186" y="146" width="20" height="36" rx="10" fill="' + DEEP + '"/><rect x="146" y="148" width="20" height="34" rx="10" fill="' + GREEN + '"/>' +
    '<rect x="112" y="148" width="20" height="34" rx="10" fill="' + DEEP + '"/><rect x="84" y="146" width="22" height="36" rx="11" fill="' + GREEN + '"/>' +
    '<g fill="' + BELLY + '"><ellipse cx="95" cy="181" rx="13" ry="6"/><ellipse cx="122" cy="181" rx="12" ry="5.5"/><ellipse cx="156" cy="181" rx="12" ry="5.5"/><ellipse cx="196" cy="181" rx="13" ry="6"/></g>' +
    '<rect x="64" y="92" width="170" height="68" rx="34" fill="' + GREEN + '"/>' +
    '<path d="M86 138 Q150 164 220 140 Q214 158 190 160 L100 160 Q86 154 86 138Z" fill="' + BELLY + '" opacity=".85"/>' +
    '<circle cx="136" cy="112" r="9" fill="#7ad08f"/><circle cx="182" cy="122" r="7" fill="#7ad08f"/><circle cx="208" cy="106" r="5" fill="#7ad08f"/>' +
    '<g class="pup-ant a1"><path d="M54 46 Q46 26 40 10" fill="none" stroke="' + DEEP + '" stroke-width="5" stroke-linecap="round"/><circle cx="39" cy="9" r="13" fill="' + GLOW + '" opacity=".35"/><circle cx="39" cy="9" r="7" fill="' + GLOW + '"/></g>' +
    '<g class="pup-ant a2"><path d="M84 46 Q92 24 100 8" fill="none" stroke="' + DEEP + '" stroke-width="5" stroke-linecap="round"/><circle cx="101" cy="7" r="13" fill="' + GLOW + '" opacity=".35"/><circle cx="101" cy="7" r="7" fill="' + GLOW + '"/></g>' +
    '<g class="pup-ear e1"><ellipse cx="26" cy="92" rx="16" ry="35" transform="rotate(10 26 92)" fill="' + DEEP + '"/></g>' +
    '<g class="pup-ear e2"><ellipse cx="114" cy="92" rx="16" ry="35" transform="rotate(-10 114 92)" fill="' + DEEP + '"/></g>' +
    '<circle cx="70" cy="84" r="46" fill="' + GREEN + '"/>' +
    '<circle cx="40" cy="62" r="3" fill="#7ad08f"/><circle cx="94" cy="60" r="2.4" fill="#7ad08f"/><circle cx="76" cy="48" r="2.2" fill="#7ad08f"/>' +
    '<ellipse cx="70" cy="104" rx="25" ry="18" fill="' + BELLY + '"/>' +
    '<circle cx="39" cy="99" r="8" fill="' + BLUSH + '" opacity=".55"/><circle cx="101" cy="99" r="8" fill="' + BLUSH + '" opacity=".55"/>' +
    '<g class="pup-eyes"><ellipse cx="51" cy="78" rx="10.5" ry="13" fill="' + INK + '"/><ellipse cx="89" cy="78" rx="10.5" ry="13" fill="' + INK + '"/>' +
    '<circle cx="47.5" cy="72" r="4.2" fill="#fff"/><circle cx="85.5" cy="72" r="4.2" fill="#fff"/><circle cx="55" cy="84" r="2" fill="#fff"/><circle cx="93" cy="84" r="2" fill="#fff"/></g>' +
    '<ellipse cx="70" cy="95" rx="9" ry="6.5" fill="' + INK + '"/><ellipse cx="67" cy="93" rx="2.6" ry="1.6" fill="#fff" opacity=".8"/>' +
    '<path d="M70 101 V107 M58 108 Q70 118 82 108" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path class="pup-tongue" d="M66 112 Q70 128 76 112Z" fill="' + BLUSH + '"/>' +
    '<path d="M32 124 Q70 146 108 124 L106 134 Q70 156 34 134Z" fill="#6c7bff"/><path d="M70 138 l3.4 7 7.6 1 -5.6 5.2 1.4 7.6 -6.8 -3.8 -6.8 3.8 1.4 -7.6 -5.6 -5.2 7.6 -1Z" fill="' + GLOW + '"/>' +
    '</svg>';
}

export interface PupPortrait { root: HTMLElement; react(e: string): void }

export const Pup = {
  EMOS: ['happy', 'wiggle', 'surprised', 'sad', 'sleepy'],
  create(host: HTMLElement): PupPortrait {
    host.innerHTML = '<div class="pup p-happy">' + pupMarkup() + '</div>';
    const root = host.firstElementChild as HTMLElement;
    return { root, react(e: string) { Pup.EMOS.forEach(c => root.classList.remove('p-' + c)); root.classList.add('p-' + (Pup.EMOS.includes(e) ? e : 'happy')); } };
  }
};

/* ---------- the rocket: a bun-coloured sausage with a mustard zig-zag, a red nose and a porthole ----------
   Pointing left (so it flies right to left across the sky), the flame at the right. Put `open` on an ancestor and the lid slides off the
   porthole, Pickle's head rises into it and his antennae pop up. `u` makes the clip-path id unique when several rockets are on the page. */
export function rocketInner(u: string): string {
  return '<defs><clipPath id="' + u + 'rk"><circle cx="112" cy="58" r="18"/></clipPath></defs>' +
    '<g class="rk-flame"><path d="M190 50 Q226 56 244 65 Q226 74 190 80Z" fill="#ff9a2e"/><path d="M192 56 Q214 60 226 65 Q214 70 192 74Z" fill="#fff2a0"/></g>' +
    '<path d="M136 32 L176 2 L184 34Z" fill="#ff7a59"/><path d="M136 98 L176 128 L184 96Z" fill="#ff7a59"/>' +
    '<rect x="40" y="30" width="154" height="70" rx="35" fill="#f5d6a4"/><rect x="40" y="30" width="154" height="70" rx="35" fill="none" stroke="#d9a96a" stroke-width="3"/>' +
    '<path d="M64 30 Q4 40 4 65 Q4 90 64 100Z" fill="#ff6b6b"/><path d="M16 56 Q18 46 30 42" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".6"/>' +
    '<path d="M70 86 l11 -7 11 7 11 -7 11 7 11 -7 11 7 11 -7 11 7 11 -7" fill="none" stroke="#ffc43d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g class="rk-ants"><path d="M104 40 Q98 22 92 8" fill="none" stroke="' + DEEP + '" stroke-width="4" stroke-linecap="round"/><circle cx="91" cy="7" r="6" fill="' + GLOW + '"/>' +
    '<path d="M122 40 Q128 20 136 6" fill="none" stroke="' + DEEP + '" stroke-width="4" stroke-linecap="round"/><circle cx="137" cy="5" r="6" fill="' + GLOW + '"/></g>' +
    '<circle cx="112" cy="58" r="23" fill="#6c7bff"/><circle cx="112" cy="58" r="18" fill="#cfeeff"/>' +
    '<g clip-path="url(#' + u + 'rk)"><g class="rk-pup">' +
      '<ellipse cx="94" cy="68" rx="6" ry="13" fill="' + DEEP + '"/><ellipse cx="130" cy="68" rx="6" ry="13" fill="' + DEEP + '"/>' +
      '<circle cx="112" cy="62" r="16" fill="' + GREEN + '"/><ellipse cx="112" cy="68" rx="8" ry="6" fill="' + BELLY + '"/>' +
      '<ellipse cx="105" cy="58" rx="3.4" ry="4.4" fill="' + INK + '"/><ellipse cx="119" cy="58" rx="3.4" ry="4.4" fill="' + INK + '"/>' +
      '<circle cx="104" cy="56" r="1.3" fill="#fff"/><circle cx="118" cy="56" r="1.3" fill="#fff"/><ellipse cx="112" cy="65" rx="3" ry="2.2" fill="' + INK + '"/>' +
      '<circle cx="100" cy="66" r="2.6" fill="' + BLUSH + '" opacity=".6"/><circle cx="124" cy="66" r="2.6" fill="' + BLUSH + '" opacity=".6"/></g></g>' +
    '<g class="rk-lid"><circle cx="112" cy="58" r="18" fill="#f5d6a4" stroke="#d9a96a" stroke-width="3"/><circle cx="112" cy="58" r="5" fill="#ffc43d"/></g>' +
    '<path d="M98 46 Q104 40 112 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>';
}

export function rocketMarkup(u: string): string {
  return '<svg viewBox="-4 -4 256 138" class="rk-svg" aria-hidden="true" style="overflow:visible">' + rocketInner(u) + '</svg>';
}
