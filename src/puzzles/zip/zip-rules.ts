import type { Checkpoint, ParsedZip } from '../../data/types.ts';

/* The pure rules of the Scent Trail (no DOM, no saved data), so they can be tested on their own.
     z      a parsed trail: { size, word, path: [[r, c], ...], cps: [{ idx, num, letter, r, c }], walls: Set('a-b') }   (see parseZip in data/zips.js)
     path   the player's trail as cell codes: row * size + col
   A trail wins when it visits every cell once, moves one step at a time, crosses no wall, and reaches the numbered checkpoints in order, ending on the last. */

export const zipCode = (n: number, r: number, c: number) => r * n + c;
export const zipRC = (n: number, code: number): [number, number] => [Math.floor(code / n), code % n];
export const zipAdjacent = (n: number, a: number, b: number) => { const [ar, ac] = zipRC(n, a), [br, bc] = zipRC(n, b); return Math.abs(ar - br) + Math.abs(ac - bc) === 1; };
export const zipWallBetween = (z: ParsedZip, a: number, b: number) => z.walls.has(a < b ? a + '-' + b : b + '-' + a);

/* checkpoint cells: code -> checkpoint */
export function checkpointMap(z: ParsedZip) {
  const m = new Map<number, Checkpoint>();
  z.cps.forEach(cp => m.set(zipCode(z.size, cp.r, cp.c), cp));
  return m;
}

/* the one solution, as cell codes */
export const zipSolution = (z: ParsedZip) => z.path.map(([r, c]) => zipCode(z.size, r, c));

/* how many cells of `path` match the solution from the start */
export function prefixLength(path: number[], solution: number[]): number {
  let m = 0;
  while (m < path.length && path[m] === solution[m]) m++;
  return m;
}

export function isSolvedTrail(z: ParsedZip, path: number[]): boolean {
  const n = z.size, total = n * n, K = z.cps.length, cpAt = checkpointMap(z);
  if (path.length !== total || new Set(path).size !== total) return false;
  let expected = 1;
  for (let i = 0; i < total; i++) {
    if (i > 0 && (!zipAdjacent(n, path[i - 1], path[i]) || zipWallBetween(z, path[i - 1], path[i]))) return false;
    const cp = cpAt.get(path[i]);
    if (cp) { if (cp.num !== expected) return false; expected++; }
  }
  const lastCp = cpAt.get(path[total - 1]);
  return expected === K + 1 && !!lastCp && lastCp.num === K;
}
