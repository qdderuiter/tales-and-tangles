import { describe, expect, it } from 'vitest';
import { COLS, ROWS } from '../../src/core/grid.ts';
import type { Level } from '../../src/data/types.ts';
import { LEVELS } from '../../src/data/levels.ts';
import { buildGrid, countSpellings, falseStarts, isSolved, matchWord, orthogonal, twist } from '../../src/puzzles/word/word-rules.ts';
import { allFound, toTrace } from './helpers/word-level.ts';

/* [twist floor, decoy floor] per case, a gentle-to-hard ramp (see scripts/lay-words.mjs). Case 1 also has a twist cap. */
const FLOORS: [number, number][] = [
  [0.25, 0], [0.45, 1], [0.55, 2], [0.60, 3], [0.60, 3], [0.65, 4], [0.65, 4], [0.70, 5], [0.70, 5], [0.70, 5],
  [0.80, 6], [0.80, 6], [0.80, 6], [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8], [0.85, 8]
];

describe.each(LEVELS.map(lv => [lv.n, lv]))('level %i', (_n, lv) => {
  it('has the extra fields every chapter needs', () => {
    for (const key of ['zip', 'evilZip', 'case', 'hint', 'trailHint', 'title', 'blurb']) expect(lv[key as keyof Level], key).toBeTruthy();
  });

  it('words tile the grid exactly once', () => {
    const cells = lv.words.flatMap(w => w.p.map(([r, c]) => r * COLS + c));
    expect(cells.length).toBe(ROWS * COLS);
    expect(new Set(cells).size).toBe(ROWS * COLS);
    const grid = buildGrid(lv);
    expect(grid.flat().every(Boolean)).toBe(true);
    expect(isSolved(lv, allFound(lv), grid)).toBe(true);
  });

  it('every word is as long as its path, inside the grid, and each step is up, down, left or right (no diagonals)', () => {
    for (const w of lv.words) {
      expect(w.p.length, w.w).toBe(w.w.length);
      for (const [r, c] of w.p) {
        expect(r).toBeGreaterThanOrEqual(0); expect(r).toBeLessThan(ROWS);
        expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThan(COLS);
      }
      for (let k = 1; k < w.p.length; k++) expect(orthogonal(w.p[k - 1], w.p[k]), `${w.w} step ${k}`).toBe(true);
    }
  });

  it('every word matches its own path forwards and backwards, and is ignored once found', () => {
    lv.words.forEach((w, i) => {
      expect(matchWord(lv, new Set(), toTrace(w.p)), `${w.w} forwards`).toBe(i);
      expect(matchWord(lv, new Set(), toTrace(w.p).reverse()), `${w.w} backwards`).toBe(i);
      expect(matchWord(lv, new Set([i]), toTrace(w.p)), `${w.w} once found`).toBe(-1);
    });
  });

  it('every word can be spelled along exactly one path, so the swipe the player finds is the stored one', () => {
    const grid = buildGrid(lv);
    for (const w of lv.words) expect(countSpellings(grid, w.w), w.w).toBe(1);
  });

  it('is twisty and has decoy starts at least as much as its place in the ramp asks', () => {
    const [tFloor, dFloor] = FLOORS[lv.n - 1];
    expect(twist(lv)).toBeGreaterThanOrEqual(tFloor);
    expect(falseStarts(lv, buildGrid(lv)).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(dFloor);
    if (lv.n === 1) expect(twist(lv)).toBeLessThanOrEqual(0.40);
  });

  it('the theme is exactly one gold word', () => {
    const gold = lv.words.filter(w => w.gold);
    expect(gold.length).toBe(1);
    expect(gold[0].w).toBe(lv.theme);
  });
});

it('chapters are numbered 1..N in order', () => {
  expect(LEVELS.map(l => l.n)).toEqual(LEVELS.map((_, i) => i + 1));
});

it('the ramp never gets easier', () => {
  for (let i = 1; i < FLOORS.length; i++) {
    expect(FLOORS[i][0]).toBeGreaterThanOrEqual(FLOORS[i - 1][0]);
    expect(FLOORS[i][1]).toBeGreaterThanOrEqual(FLOORS[i - 1][1]);
  }
  expect(FLOORS.length).toBe(LEVELS.length);
});
