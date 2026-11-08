/* a word's [row, col] path as the {r, c} trace the board produces while dragging */
export const toTrace = p => p.map(([r, c]) => ({ r, c }));

/* the set of word indexes found when every word of the level has been found */
export const allFound = lv => new Set(lv.words.map((_, i) => i));
