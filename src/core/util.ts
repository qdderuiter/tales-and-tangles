export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const rand = (a: number, b: number) => a + Math.random() * (b - a);

export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const pad2 = (n: number) => String(n).padStart(2, '0');

export function mulberry32(a: number): () => number {                       // small seeded RNG: same seed -> same sequence
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export const REDUCED = typeof window !== 'undefined' && !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export const fmtClock = (secs: number) => Math.floor(secs / 60) + ':' + pad2(secs % 60);

export const blankMatrix = (N: number): number[][] => Array.from({ length: N }, () => Array<number>(N).fill(0));

export function shuffle<T>(arr: T[], rng?: () => number): T[] { rng = rng || Math.random; for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

/* a field that starts empty and is filled in (by init() / load() / boot) before anything reads it; typed as already filled */
export const late = <T>(): T => null as unknown as T;
