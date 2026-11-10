import { COLS, ROWS } from '../../core/grid.ts';
import type { Cell } from '../../core/types.ts';
import type { WordEntry } from '../../data/types.ts';

export interface GridCell { ch: string; w: number }
export type Trace = { r: number; c: number }[];
export type WordLevel = { words: WordEntry[] };

/* The pure rules of the Words puzzle (no DOM, no saved data), so they can be tested on their own.
     level    { words: [{ w: 'HONEY', p: [[r, c], ...], gold }] }   (see data/levels.ts)
     grid     ROWS x COLS cells { ch, w } (letter, index of the word it belongs to)
     found    Set of word indexes already found
     trace    the player's swipe: [{ r, c }, ...] */

/* the letter grid, DERIVED from the words' paths so a level can never contradict itself */
export function buildGrid(level: WordLevel): GridCell[][] {
  const grid = Array.from({ length: ROWS }, () => Array<GridCell>(COLS));
  level.words.forEach((w, i) => w.p.forEach(([r, c], k) => { grid[r][c] = { ch: w.w[k], w: i }; }));
  return grid;
}

export const samePath = (a: Trace, b: Cell[]) => a.length === b.length && a.every((q, k) => q.r === b[k][0] && q.c === b[k][1]);

/* which not-yet-found word the swipe spells (either direction), or -1 */
export function matchWord(level: WordLevel, found: Set<number>, trace: Trace): number {
  for (let i = 0; i < level.words.length; i++) {
    if (found.has(i)) continue;
    const p = level.words[i].p;
    if (samePath(trace, p) || samePath(trace, p.slice().reverse())) return i;
  }
  return -1;
}

/* the letters under a swipe */
export const spell = (grid: GridCell[][], trace: Trace) => trace.map(p => grid[p.r][p.c].ch).join('');

/* about a wrong swipe: `near` = it spells a clue word you haven't found yet (just drawn the wrong way);
   `isClue` = it spells a clue word (even an already-found one), which is never a hidden bonus word */
export function attemptInfo(level: WordLevel, found: Set<number>, spelled: string) {
  const rev = spelled.split('').reverse().join('');
  return {
    near: level.words.some((w, i) => !found.has(i) && (w.w === spelled || w.w === rev)),
    isClue: level.words.some(w => w.w === spelled || w.w === rev)
  };
}

/* win-state validation: found words must tile the grid exactly once, with matching letters */
export function isSolved(level: WordLevel, found: Set<number>, grid: GridCell[][]): boolean {
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

/* ---- how hard a layout is (used by tests and by scripts/lay-words.mjs) ---- */

/* one step apart, horizontally or vertically (never diagonally) */
export const orthogonal = (a: Cell, b: Cell) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

/* direction changes along a path */
export function turns(path: Cell[]): number {
  let n = 0;
  for (let k = 2; k < path.length; k++) {
    if (path[k][0] - path[k - 1][0] !== path[k - 1][0] - path[k - 2][0] || path[k][1] - path[k - 1][1] !== path[k - 1][1] - path[k - 2][1]) n++;
  }
  return n;
}

/* share of the possible bends the level's words use, 0 (all straight) to 1 (bend at every letter) */
export function twist(level: WordLevel): number {
  let t = 0, max = 0;
  for (const w of level.words) { t += turns(w.p); max += Math.max(0, w.p.length - 2); }
  return max ? t / max : 0;
}

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/* how many self-avoiding up/down/left/right paths in the grid spell the word (a swipe only counts on the exact path, so this must be 1) */
export function countSpellings(grid: GridCell[][], word: string): number {
  const seen = new Set<number>();
  const walk = (r: number, c: number, k: number): number => {
    if (grid[r][c].ch !== word[k]) return 0;
    if (k === word.length - 1) return 1;
    seen.add(r * COLS + c);
    let n = 0;
    for (const [dr, dc] of STEPS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS || seen.has(nr * COLS + nc)) continue;
      n += walk(nr, nc, k + 1);
    }
    seen.delete(r * COLS + c);
    return n;
  };
  let total = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) total += walk(r, c, 0);
  return total;
}

/* per word: the touching cell pairs that spell its first two letters (and its last two, reversed) but are not its real first/last step */
export function falseStarts(level: WordLevel, grid: GridCell[][]): number[] {
  const pairs = (a: string, b: string) => {
    const found: [Cell, Cell][] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c].ch !== a) continue;
      for (const [dr, dc] of STEPS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < ROWS && nc < COLS && grid[nr][nc].ch === b) found.push([[r, c], [nr, nc]]);
      }
    }
    return found;
  };
  const same = (x: [Cell, Cell], y: Cell[]) => x[0][0] === y[0][0] && x[0][1] === y[0][1] && x[1][0] === y[1][0] && x[1][1] === y[1][1];
  return level.words.map(({ w, p }) => {
    const n = w.length;
    const head = pairs(w[0], w[1]).filter(x => !same(x, [p[0], p[1]])).length;
    const tail = pairs(w[n - 1], w[n - 2]).filter(x => !same(x, [p[n - 1], p[n - 2]])).length;
    return head + tail;
  });
}
