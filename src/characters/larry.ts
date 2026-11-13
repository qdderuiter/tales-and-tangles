/* the drawing alone (a 200 x 250 box), so a cinematic can place Evil Larry on its own stage; larryMarkup() wraps it as the portrait */
export function larryInner() {
  const fur = '#3a3442', body = '#2a2433', dark = '#121018', stripe = '#e9e1f2', pink = '#e58fa0';
  const bands = [[160, 39], [175, 47], [190, 50], [205, 47], [220, 39]].map(([y, hw]) =>
    '<line x1="' + (100 - hw) + '" y1="' + y + '" x2="' + (100 + hw) + '" y2="' + y + '" stroke="' + stripe + '" stroke-width="6"/>').join('');
  return '<g class="larry-tail"><path d="M148 222 Q196 214 190 164 Q186 140 166 144" fill="none" stroke="' + fur + '" stroke-width="16" stroke-linecap="round"/><path d="M168 144 Q184 146 188 162" fill="none" stroke="' + stripe + '" stroke-width="16" stroke-linecap="round"/></g>' +
    '<ellipse cx="100" cy="190" rx="52" ry="50" fill="' + body + '"/>' + bands +
    '<path d="M62 168 Q44 184 46 208" fill="none" stroke="' + body + '" stroke-width="14" stroke-linecap="round"/>' +
    '<g class="larry-sack"><path d="M18 206 Q16 238 40 242 Q66 238 62 206 Q40 196 18 206 Z" fill="#8a6a42"/><path d="M26 204 Q40 192 54 204 Q40 210 26 204 Z" fill="#6d5233"/><text x="40" y="232" text-anchor="middle" font-size="22" font-weight="900" fill="#f7d98a" font-family="sans-serif">$</text></g>' +
    '<path d="M138 168 Q156 182 154 204" fill="none" stroke="' + body + '" stroke-width="14" stroke-linecap="round"/>' +
    '<circle cx="154" cy="206" r="8" fill="' + fur + '"/><circle cx="46" cy="208" r="8" fill="' + fur + '"/>' +
    '<path d="M52 84 L42 8 L90 54 Z" fill="' + fur + '"/><path d="M148 84 L158 8 L110 54 Z" fill="' + fur + '"/>' +
    '<path d="M54 64 L49 28 L76 54 Z" fill="' + pink + '" opacity=".7"/><path d="M146 64 L151 28 L124 54 Z" fill="' + pink + '" opacity=".7"/>' +
    '<ellipse cx="100" cy="98" rx="54" ry="46" fill="' + fur + '"/>' +
    '<path d="M47 92 Q100 72 153 92 L151 114 Q100 96 49 114 Z" fill="' + dark + '"/>' +
    '<g class="larry-eyes"><ellipse class="glow" cx="76" cy="101" rx="11" ry="8" fill="#e8f04a"/><ellipse class="glow" cx="124" cy="101" rx="11" ry="8" fill="#e8f04a"/>' +
    '<ellipse cx="76" cy="101" rx="2.8" ry="7.5" fill="' + dark + '"/><ellipse cx="124" cy="101" rx="2.8" ry="7.5" fill="' + dark + '"/></g>' +
    '<ellipse cx="100" cy="124" rx="22" ry="15" fill="#cfc6d8"/><path d="M94 115 L106 115 L100 123 Z" fill="' + pink + '"/>' +
    '<path d="M84 130 Q98 140 118 126" fill="none" stroke="' + dark + '" stroke-width="3" stroke-linecap="round"/><path d="M110 131 L115 128 L113 136 Z" fill="#fff"/>' +
    '<path d="M70 120 L44 114 M70 126 L42 128 M130 120 L156 114 M130 126 L158 128" stroke="#cfc6d8" stroke-width="2" stroke-linecap="round"/>' +
    '<g class="larry-cap"><g transform="rotate(-8 100 60)"><path d="M52 62 Q54 22 100 22 Q146 22 148 62 Z" fill="' + body + '"/><ellipse cx="100" cy="62" rx="52" ry="9" fill="#1b1622"/><circle cx="100" cy="20" r="5" fill="#8a6a42"/></g></g>' +
    '';
}

export function larryMarkup() {
  return '<svg viewBox="0 0 200 250" class="larry-svg" aria-hidden="true">' + larryInner() + '</svg>';
}

export interface LarryPortrait { root: HTMLElement; react(e: string): void }

export const Larry = {
  EMOS: ['smug', 'sneaky', 'angry', 'caught'],
  create(host: HTMLElement): LarryPortrait {
    host.innerHTML = '<div class="larry l-smug">' + larryMarkup() + '</div>';
    const root = host.firstElementChild as HTMLElement;
    return { root, react(e: string) { Larry.EMOS.forEach(c => root.classList.remove('l-' + c)); root.classList.add('l-' + (Larry.EMOS.includes(e) ? e : 'smug')); } };
  }
};
