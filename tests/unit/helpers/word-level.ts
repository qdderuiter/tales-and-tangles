import type { Cell } from '../../../src/core/types.ts';

/* a word's [row, col] path as the {r, c} trace the board produces while dragging */
export const toTrace = (p: Cell[]) => p.map(([r, c]) => ({ r, c }));

/* the set of word indexes found when every word of the level has been found */
export const allFound = (lv: { words: unknown[] }) => new Set(lv.words.map((_, i) => i));
