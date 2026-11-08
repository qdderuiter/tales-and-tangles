import { COLS, ROWS } from '../../core/grid.ts';

/* The pure rules of the Words puzzle (no DOM, no saved data), so they can be tested on their own.
     level    { words: [{ w: 'HONEY', p: [[r, c], ...], gold }] }   (see data/levels.js)
     grid     ROWS x COLS cells { ch, w } (letter, index of the word it belongs to)
     found    Set of word indexes already found
     trace    the player's swipe: [{ r, c }, ...] */

/* the letter grid, DERIVED from the words' paths so a level can never contradict itself */
export function buildGrid(level) {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  level.words.forEach((w, i) => w.p.forEach(([r, c], k) => { grid[r][c] = { ch: w.w[k], w: i }; }));
  return grid;
}

export const samePath = (a, b) => a.length === b.length && a.every((q, k) => q.r === b[k][0] && q.c === b[k][1]);

/* which not-yet-found word the swipe spells (either direction), or -1 */
export function matchWord(level, found, trace) {
  for (let i = 0; i < level.words.length; i++) {
    if (found.has(i)) continue;
    const p = level.words[i].p;
    if (samePath(trace, p) || samePath(trace, p.slice().reverse())) return i;
  }
  return -1;
}

/* the letters under a swipe */
export const spell = (grid, trace) => trace.map(p => grid[p.r][p.c].ch).join('');

/* about a wrong swipe: `near` = it spells a clue word you haven't found yet (just drawn the wrong way);
   `isClue` = it spells a clue word (even an already-found one), which is never a hidden bonus word */
export function attemptInfo(level, found, spelled) {
  const rev = spelled.split('').reverse().join('');
  return {
    near: level.words.some((w, i) => !found.has(i) && (w.w === spelled || w.w === rev)),
    isClue: level.words.some(w => w.w === spelled || w.w === rev)
  };
}

/* win-state validation: found words must tile the grid exactly once, with matching letters */
export function isSolved(level, found, grid) {
  const seen = new Set();
  for (const i of found) {
    const w = level.words[i];
    for (let k = 0; k < w.p.length; k++) {
      const [r, c] = w.p[k], key = r * COLS + c;
      if (seen.has(key) || grid[r][c].ch !== w.w[k]) return false;
      seen.add(key);
    }
  }
  return found.size === level.words.length && seen.size === COLS * ROWS;
}
