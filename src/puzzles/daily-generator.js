import { COLS, ROWS } from '../core/grid.js';
import { mulberry32, pad2 } from '../core/util.js';
import { DAILY_WORDS } from '../data/words.js';

/* The pure half of the Daily Case: dates and the puzzle generator. No saved data, no DOM: the same date always gives the same puzzle. */

export const formatDate = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
export const todayString = () => formatDate(new Date());
export const shiftDate = (dateStr, days) => { const [y, m, d] = dateStr.split('-').map(Number); return formatDate(new Date(y, m - 1, d + days)); };
export const dateSeed = dateStr => Number(dateStr.replace(/-/g, ''));

/* random Hamiltonian path via "backbite" moves, starting from a snake */
export function hamiltonian(rows, cols, rand, iters) {
  const n = rows * cols, path = [], pos = new Array(n), nbs = [];      // cells as codes r*cols+c; pos[code] = index in path
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) path.push(r * cols + (r % 2 ? cols - 1 - k : k));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    nbs.push([[1, 0], [-1, 0], [0, 1], [0, -1]].map(d => [r + d[0], c + d[1]]).filter(([a, b]) => a >= 0 && b >= 0 && a < rows && b < cols).map(([a, b]) => a * cols + b));
  }
  path.forEach((v, i) => { pos[v] = i; });
  const rev = (i, j) => { for (; i < j; i++, j--) { const t = path[i]; path[i] = path[j]; path[j] = t; pos[path[i]] = i; pos[path[j]] = j; } };
  for (let it = 0; it < iters; it++) {
    if (rand() < 0.5) rev(0, n - 1);
    const nb = nbs[path[n - 1]];
    const j = pos[nb[Math.floor(rand() * nb.length)]];
    if (j === n - 2) continue;
    rev(j + 1, n - 1);
  }
  return path.map(v => [Math.floor(v / cols), v % cols]);
}

/* cut a path into consecutive pieces of the given lengths (cells copied) */
export const chunk = (path, lens) => { let at = 0; return lens.map(l => path.slice(at, at += l).map(q => q.slice())); };

/* a level object shaped exactly like LEVELS[i] (without zip/case) */
export function generateDaily(dateStr) {
  const rand = mulberry32(dateSeed(dateStr) * 7919 + 13);
  const total = ROWS * COLS;
  const path = hamiltonian(ROWS, COLS, rand, 2500);
  const lens = [];
  for (let left = total; left > 0;) {
    const opts = [3, 4, 5].filter(l => left - l === 0 || left - l >= 3);
    const l = opts[Math.floor(rand() * opts.length)];
    lens.push(l); left -= l;
  }
  const used = new Set();
  const words = chunk(path, lens).map(p => {
    const pool = DAILY_WORDS[p.length].filter(w => !used.has(w));
    const w = pool[Math.floor(rand() * pool.length)];
    used.add(w);
    return { w, p, gold: false };
  });
  let gi = 0; words.forEach((w, i) => { if (w.w.length > words[gi].w.length) gi = i; });
  words[gi].gold = true;
  return { n: 0, daily: true, date: dateStr, title: 'Daily Case', blurb: 'A fresh puzzle every day.', hint: 'cozy everyday words - nature, food, home and critters', theme: words[gi].w, scene: ['#e3f1fb', '#c4dcf0'], words };
}
