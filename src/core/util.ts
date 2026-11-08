export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const rand = (a, b) => a + Math.random() * (b - a);

export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export const pad2 = n => String(n).padStart(2, '0');

export function mulberry32(a) {                       // small seeded RNG: same seed -> same sequence
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export const REDUCED = typeof window !== 'undefined' && !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export const fmtClock = secs => Math.floor(secs / 60) + ':' + pad2(secs % 60);

export const blankMatrix = N => Array.from({ length: N }, () => Array(N).fill(0));

export function shuffle(arr, rng) { rng = rng || Math.random; for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
