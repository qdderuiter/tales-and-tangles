/* ---------- 2. levels ----------
   Each word is [WORD, "rc rc rc ..."]: the exact path of cells (row digit, column digit).
   The grid letters are DERIVED from these paths, so a level can never contradict itself.
   Every cell of the 6x5 grid belongs to exactly one word. */
export const COLS = 6, ROWS = 5;

import type { Cell } from './types.ts';

export const P = (s: string): Cell[] => s.trim().split(/\s+/).map(t => [Number(t[0]), Number(t[1])] as Cell);
