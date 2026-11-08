import { critterOf } from '../data/critters.ts';

export function critterMarkup(s) {
  const dark = '#3b2a1e', pink = '#f2b6a8', c = s.color;
  let ears;
  if (s.ear === 'round') ears = '<circle cx="24" cy="26" r="13" fill="' + c + '"/><circle cx="76" cy="26" r="13" fill="' + c + '"/><circle cx="24" cy="26" r="6.5" fill="' + pink + '"/><circle cx="76" cy="26" r="6.5" fill="' + pink + '"/>';
  else if (s.ear === 'point') ears = '<path d="M16 42 L22 8 L45 27 Z" fill="' + c + '"/><path d="M84 42 L78 8 L55 27 Z" fill="' + c + '"/><path d="M23 31 L25 17 L36 27 Z" fill="' + pink + '"/><path d="M77 31 L75 17 L64 27 Z" fill="' + pink + '"/>';
  else ears = '<ellipse cx="34" cy="14" rx="8" ry="23" fill="' + c + '"/><ellipse cx="66" cy="14" rx="8" ry="23" fill="' + c + '"/><ellipse cx="34" cy="15" rx="3.8" ry="16" fill="' + pink + '"/><ellipse cx="66" cy="15" rx="3.8" ry="16" fill="' + pink + '"/>';
  let acc = '';
  if (s.acc === 'antennae') acc = '<path d="M40 30 Q34 12 24 7 M60 30 Q66 12 76 7" stroke="' + dark + '" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="24" cy="7" r="4" fill="' + dark + '"/><circle cx="76" cy="7" r="4" fill="' + dark + '"/>';
  else if (s.acc === 'glasses') acc = '<circle cx="37" cy="53" r="10" fill="rgba(255,255,255,.35)" stroke="' + dark + '" stroke-width="2.6"/><circle cx="63" cy="53" r="10" fill="rgba(255,255,255,.35)" stroke="' + dark + '" stroke-width="2.6"/><path d="M47 53 L53 53" stroke="' + dark + '" stroke-width="2.6"/>';
  else if (s.acc === 'hat') acc = '<ellipse cx="50" cy="30" rx="28" ry="5.5" fill="#6d4a30"/><path d="M33 30 Q35 7 50 7 Q65 7 67 30 Z" fill="#8f6b3f"/><rect x="34" y="23" width="32" height="4" fill="#6d4a30"/>';
  else if (s.acc === 'bandit') acc = '<path d="M16 50 Q50 38 84 50 L82 60 Q50 50 18 60 Z" fill="#121018"/><ellipse cx="37" cy="53" rx="6.5" ry="5" fill="#f0e24a"/><ellipse cx="63" cy="53" rx="6.5" ry="5" fill="#f0e24a"/><path d="M26 28 Q50 8 74 28 L70 32 Q50 20 30 32 Z" fill="#2a2433"/><ellipse cx="50" cy="31" rx="27" ry="4" fill="#1b1622"/>';
  else if (s.acc === 'stripes') acc = '<path d="M36 36 Q50 29 64 36 M32 44 Q50 36 68 44" stroke="' + dark + '" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".7"/>';
  return '<svg viewBox="0 0 100 92" class="critter" aria-hidden="true">' + ears +
    '<ellipse cx="50" cy="57" rx="36" ry="30" fill="' + c + '"/>' + acc +
    '<ellipse cx="50" cy="68" rx="17" ry="11.5" fill="' + s.belly + '"/>' +
    '<ellipse cx="25" cy="64" rx="6" ry="4" fill="' + pink + '" opacity=".55"/><ellipse cx="75" cy="64" rx="6" ry="4" fill="' + pink + '" opacity=".55"/>' +
    '<circle cx="37" cy="53" r="4.4" fill="' + dark + '"/><circle cx="63" cy="53" r="4.4" fill="' + dark + '"/>' +
    '<circle cx="38.4" cy="51.6" r="1.4" fill="#fff"/><circle cx="64.4" cy="51.6" r="1.4" fill="#fff"/>' +
    '<ellipse cx="50" cy="62" rx="4.6" ry="3.3" fill="' + dark + '"/>' +
    '<path d="M44 71 Q50 76 56 71" stroke="' + dark + '" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
}

export const CRITTER_SVG = {};

export const critterSvg = name => CRITTER_SVG[name] || (CRITTER_SVG[name] = critterMarkup(critterOf(name)));   // portraits are cached per name
