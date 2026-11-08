import type { PuzzleResult } from '../core/types.ts';

export const Scoring = {
  compute(o: { elapsedMs: number; wrongs: number; hints: number; bonus?: number; wrongs3?: number; wrongs2?: number }): PuzzleResult {
    const secs = Math.round(o.elapsedMs / 1000);
    const timeBonus = Math.max(0, 300 - secs * 2);
    const score = Math.max(100, 1000 + timeBonus + 100 + (o.bonus || 0) - o.wrongs * 50 - o.hints * 150);
    let stars = 1;
    const w3 = o.wrongs3 === undefined ? 2 : o.wrongs3, w2 = o.wrongs2 === undefined ? 5 : o.wrongs2;
    if (o.hints === 0 && o.wrongs <= w3) stars = 3;
    else if (o.hints <= 1 || o.wrongs <= w2) stars = 2;
    return { score, stars, secs, wrongs: o.wrongs, hints: o.hints };
  }
};
