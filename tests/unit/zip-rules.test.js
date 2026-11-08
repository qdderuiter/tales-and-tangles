import { describe, expect, it } from 'vitest';
import { checkpointMap, isSolvedTrail, prefixLength, zipAdjacent, zipCode, zipRC, zipSolution, zipWallBetween } from '../../src/puzzles/zip/zip-rules.js';

/* A made-up 2x2 trail:   0 1      codes are row*2+col, so the solution is 0 -> 1 -> 3 -> 2
                          2 3      checkpoint 1 on code 0, checkpoint 2 on code 2 */
const trail = (walls = []) => ({
  size: 2, word: 'AB', walls: new Set(walls),
  path: [[0, 0], [0, 1], [1, 1], [1, 0]],
  cps: [{ idx: 0, num: 1, letter: 'A', r: 0, c: 0 }, { idx: 3, num: 2, letter: 'B', r: 1, c: 0 }]
});

describe('cell codes', () => {
  it('zipCode and zipRC are inverses', () => {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) expect(zipRC(3, zipCode(3, r, c))).toEqual([r, c]);
  });
  it('zipAdjacent: one orthogonal step only (no diagonals, no wrapping onto the next row)', () => {
    expect(zipAdjacent(3, 0, 1)).toBe(true);
    expect(zipAdjacent(3, 0, 3)).toBe(true);
    expect(zipAdjacent(3, 0, 4)).toBe(false);
    expect(zipAdjacent(3, 2, 3)).toBe(false);   // (0,2) and (1,0) are one apart as numbers, but not neighbours
    expect(zipAdjacent(3, 4, 4)).toBe(false);
  });
  it('zipWallBetween ignores the order of the two cells', () => {
    const z = trail(['0-1']);
    expect(zipWallBetween(z, 0, 1)).toBe(true);
    expect(zipWallBetween(z, 1, 0)).toBe(true);
    expect(zipWallBetween(z, 1, 3)).toBe(false);
  });
});

describe('solution helpers', () => {
  it('zipSolution turns the path into codes; checkpointMap keys checkpoints by code', () => {
    const z = trail();
    expect(zipSolution(z)).toEqual([0, 1, 3, 2]);
    const m = checkpointMap(z);
    expect(m.get(0).num).toBe(1);
    expect(m.get(2).num).toBe(2);
    expect(m.has(1)).toBe(false);
  });
  it('prefixLength counts matching cells from the start', () => {
    expect(prefixLength([], [0, 1, 3, 2])).toBe(0);
    expect(prefixLength([0, 1], [0, 1, 3, 2])).toBe(2);
    expect(prefixLength([0, 2, 3], [0, 1, 3, 2])).toBe(1);
    expect(prefixLength([0, 1, 3, 2], [0, 1, 3, 2])).toBe(4);
  });
});

describe('isSolvedTrail', () => {
  it('accepts the solution', () => {
    expect(isSolvedTrail(trail(), [0, 1, 3, 2])).toBe(true);
  });
  it('rejects a short trail, a repeated cell and a diagonal jump', () => {
    expect(isSolvedTrail(trail(), [0, 1, 3])).toBe(false);
    expect(isSolvedTrail(trail(), [0, 1, 1, 2])).toBe(false);
    expect(isSolvedTrail(trail(), [0, 3, 1, 2])).toBe(false);
  });
  it('rejects a trail that crosses a wall, wherever the wall is written', () => {
    expect(isSolvedTrail(trail(['0-1']), [0, 1, 3, 2])).toBe(false);
    expect(isSolvedTrail(trail(['1-3']), [0, 1, 3, 2])).toBe(false);
  });
  it('rejects checkpoints met out of order or an ending that is not the last checkpoint', () => {
    expect(isSolvedTrail(trail(), [2, 3, 1, 0])).toBe(false);
    const z = trail(); z.cps.push({ idx: 2, num: 3, letter: 'C', r: 1, c: 1 });
    expect(isSolvedTrail(z, [0, 1, 3, 2])).toBe(false);
  });
});
