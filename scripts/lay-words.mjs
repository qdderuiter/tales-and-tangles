/* Dev tool: re-lays every level's words as horizontal/vertical paths and prints the `words: [...]` lines to paste into src/data/levels.ts.
     node scripts/lay-words.mjs [tries] [level numbers...]
   Each candidate is a random Hamiltonian path of the 6x5 grid cut into the level's word lengths (in shuffled order). It is rejected unless
   every word can be spelled along exactly one up/down/left/right path (otherwise the swipe the player finds might not be the stored one).
   Among the rest it keeps the one nearest the level's twist target and decoy target. */
import { COLS, ROWS } from '../src/core/grid.ts';
import { mulberry32, shuffle } from '../src/core/util.ts';
import { LEVELS } from '../src/data/levels.ts';
import { chunk, hamiltonian } from '../src/puzzles/daily-generator.ts';
import { buildGrid, countSpellings, falseStarts, twist } from '../src/puzzles/word/word-rules.ts';

/* per level: [twist floor, decoy floor]; level 1 is also capped at twist 0.40 and takes the fewest decoys its words allow (BEAR/BEE/BUZZ/HIVE
   share letters, so about 6 is the least any layout can have) */
export const FLOORS = [
  [0.25, 0], [0.45, 1], [0.55, 2],
  [0.60, 3], [0.60, 3],
  [0.65, 4], [0.65, 4],
  [0.70, 5], [0.70, 5], [0.70, 5],
  [0.80, 6], [0.80, 6], [0.80, 6],
  [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8],
  [0.85, 8], [0.85, 8], [0.85, 8]
];
const ITERS = [0, 3, 8, 20, 60, 200, 2500];

const tries = Number(process.argv[2]) || 100000;
const only = process.argv.slice(3).map(Number);
const fmt = p => p.map(([r, c]) => `${r}${c}`).join(' ');

for (const lv of LEVELS) {
  if (only.length && !only.includes(lv.n)) continue;
  const [tFloor, dFloor] = FLOORS[lv.n - 1];
  const tTarget = lv.n === 1 ? 0.33 : tFloor + 0.05, first = lv.n === 1;
  const rand = mulberry32(lv.n * 104729 + 7);
  let best = null, bestScore = -Infinity;
  for (let s = 0; s < tries; s++) {
    const order = shuffle(lv.words.map((_, i) => i), rand);
    const path = hamiltonian(ROWS, COLS, rand, ITERS[s % ITERS.length]);
    const parts = chunk(path, order.map(i => lv.words[i].w.length));
    const words = lv.words.map(w => ({ w: w.w, p: null, gold: w.gold }));
    order.forEach((wi, k) => { words[wi].p = parts[k]; });
    const level = { words };
    const t = twist(level);
    if (t < tFloor || (first && t > 0.40)) continue;
    const grid = buildGrid(level);
    if (!words.every(w => countSpellings(grid, w.w) === 1)) continue;
    const d = falseStarts(level, grid).reduce((a, b) => a + b, 0);
    if (d < dFloor) continue;
    const score = -Math.abs(t - tTarget) * 10 + -0.2 * Math.abs(d - (first ? 0 : dFloor + 2));
    if (score > bestScore) { bestScore = score; best = { words, t, d }; }
  }
  if (!best) { console.log(`// level ${lv.n}: NO candidate reached twist >= ${tFloor}, decoys >= ${dFloor}`); continue; }
  console.log(`// level ${lv.n}: twist ${best.t.toFixed(2)}, decoys ${best.d}`);
  console.log(`words: [${best.words.map(w => `['${w.w}','${fmt(w.p)}']`).join(',')}]`);
}
