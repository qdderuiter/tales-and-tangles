import { describe, expect, it } from 'vitest';
import { COLS, ROWS } from '../../src/core/grid.ts';
import { LEVELS } from '../../src/data/levels.ts';
import { buildGrid, isSolved, matchWord } from '../../src/puzzles/word/word-rules.ts';
import { allFound, toTrace } from './helpers/word-level.ts';

const adjacent = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) === 1;   // words may run diagonally

describe.each(LEVELS.map(lv => [lv.n, lv]))('level %i', (_n, lv) => {
  it('has the extra fields every chapter needs', () => {
    for (const key of ['zip', 'evilZip', 'case', 'hint', 'trailHint', 'title', 'blurb']) expect(lv[key], key).toBeTruthy();
  });

  it('words tile the grid exactly once', () => {
    const cells = lv.words.flatMap(w => w.p.map(([r, c]) => r * COLS + c));
    expect(cells.length).toBe(ROWS * COLS);
    expect(new Set(cells).size).toBe(ROWS * COLS);
    const grid = buildGrid(lv);
    expect(grid.flat().every(Boolean)).toBe(true);
    expect(isSolved(lv, allFound(lv), grid)).toBe(true);
  });

  it('every word is as long as its path, inside the grid, and each step is to a neighbouring cell (diagonals allowed)', () => {
    for (const w of lv.words) {
      expect(w.p.length, w.w).toBe(w.w.length);
      for (const [r, c] of w.p) {
        expect(r).toBeGreaterThanOrEqual(0); expect(r).toBeLessThan(ROWS);
        expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThan(COLS);
      }
      for (let k = 1; k < w.p.length; k++) expect(adjacent(w.p[k - 1], w.p[k]), `${w.w} step ${k}`).toBe(true);
    }
  });

  it('every word matches its own path forwards and backwards, and is ignored once found', () => {
    lv.words.forEach((w, i) => {
      expect(matchWord(lv, new Set(), toTrace(w.p)), `${w.w} forwards`).toBe(i);
      expect(matchWord(lv, new Set(), toTrace(w.p).reverse()), `${w.w} backwards`).toBe(i);
      expect(matchWord(lv, new Set([i]), toTrace(w.p)), `${w.w} once found`).toBe(-1);
    });
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
