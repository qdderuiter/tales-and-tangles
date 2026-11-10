import { describe, expect, it } from 'vitest';
import { COLS, ROWS } from '../../src/core/grid.ts';
import type { Cell } from '../../src/core/types.ts';
import { attemptInfo, buildGrid, countSpellings, falseStarts, isSolved, matchWord, orthogonal, samePath, spell, turns, twist } from '../../src/puzzles/word/word-rules.ts';
import { allFound, toTrace } from './helpers/word-level.ts';

/* A made-up level on the real 6x5 grid: a snake through every cell, cut into six 5-letter "words". */
const snake: Cell[] = [];
for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) snake.push([r, r % 2 ? COLS - 1 - k : k]);
const level = {
  words: ['ALPHA', 'BRAVO', 'CHARM', 'DELTA', 'EAGLE', 'FROST'].map((w, i) => ({ w, p: snake.slice(i * 5, i * 5 + 5), gold: i === 0 }))
};


describe('buildGrid / spell', () => {
  const grid = buildGrid(level);
  it('puts each letter on its path cell and remembers which word owns it', () => {
    expect(grid[0][0]).toEqual({ ch: 'A', w: 0 });
    expect(grid[0][4]).toEqual({ ch: 'A', w: 0 });
    expect(grid[0][5]).toEqual({ ch: 'B', w: 1 });
  });
  it('spell reads the letters under a swipe', () => {
    expect(spell(grid, toTrace(level.words[1].p))).toBe('BRAVO');
    expect(spell(grid, toTrace(level.words[1].p).reverse())).toBe('OVARB');
  });
});

describe('samePath / matchWord', () => {
  it('samePath compares cell by cell and by length', () => {
    expect(samePath(toTrace([[0, 0], [0, 1]]), [[0, 0], [0, 1]])).toBe(true);
    expect(samePath(toTrace([[0, 0], [0, 1]]), [[0, 1], [0, 0]])).toBe(false);
    expect(samePath(toTrace([[0, 0]]), [[0, 0], [0, 1]])).toBe(false);
  });
  it('matches a swipe in either direction and ignores found words', () => {
    const p = level.words[2].p;
    expect(matchWord(level, new Set(), toTrace(p))).toBe(2);
    expect(matchWord(level, new Set(), toTrace(p).reverse())).toBe(2);
    expect(matchWord(level, new Set([2]), toTrace(p))).toBe(-1);
  });
  it('a partial swipe or a shifted swipe matches nothing', () => {
    expect(matchWord(level, new Set(), toTrace(level.words[0].p.slice(0, 4)))).toBe(-1);
    expect(matchWord(level, new Set(), toTrace(snake.slice(1, 6)))).toBe(-1);
  });
});

describe('attemptInfo', () => {
  it('near: spells a clue word not found yet (drawn the wrong way, or not through its cells)', () => {
    expect(attemptInfo(level, new Set(), 'BRAVO')).toEqual({ near: true, isClue: true });
    expect(attemptInfo(level, new Set(), 'OVARB')).toEqual({ near: true, isClue: true });
  });
  it('isClue stays true for a found word, but near does not', () => {
    expect(attemptInfo(level, new Set([1]), 'BRAVO')).toEqual({ near: false, isClue: true });
  });
  it('an ordinary word is neither', () => {
    expect(attemptInfo(level, new Set(), 'HONEY')).toEqual({ near: false, isClue: false });
  });
});

describe('isSolved', () => {
  const grid = buildGrid(level);
  it('is true only when every word is found', () => {
    expect(isSolved(level, allFound(level), grid)).toBe(true);
    const some = allFound(level); some.delete(3);
    expect(isSolved(level, some, grid)).toBe(false);
    expect(isSolved(level, new Set(), grid)).toBe(false);
  });
  it('is false if the found words overlap or the letters disagree with the grid', () => {
    const clash = { words: level.words.map((w, i) => (i === 1 ? { ...w, p: level.words[0].p } : w)) };
    expect(isSolved(clash, allFound(level), grid)).toBe(false);
    const wrongLetters = { words: level.words.map((w, i) => (i === 0 ? { ...w, w: 'ZZZZZ' } : w)) };
    expect(isSolved(wrongLetters, allFound(level), grid)).toBe(false);
  });
});

describe('orthogonal / turns / twist', () => {
  it('orthogonal is true only for a horizontal or vertical step of one', () => {
    expect(orthogonal([1, 1], [1, 2])).toBe(true);
    expect(orthogonal([1, 1], [0, 1])).toBe(true);
    expect(orthogonal([1, 1], [2, 2])).toBe(false);
    expect(orthogonal([1, 1], [1, 3])).toBe(false);
    expect(orthogonal([1, 1], [1, 1])).toBe(false);
  });
  it('turns counts direction changes', () => {
    expect(turns([[0, 0], [0, 1], [0, 2]])).toBe(0);
    expect(turns([[0, 0], [0, 1], [1, 1], [1, 2]])).toBe(2);
    expect(turns([[0, 0], [0, 1]])).toBe(0);
  });
  it('twist is the share of possible bends used', () => {
    expect(twist(level)).toBeGreaterThan(0);                 // the snake bends only at its ends
    expect(twist({ words: [{ w: 'ABC', p: [[0, 0], [0, 1], [0, 2]], gold: false }] })).toBe(0);
    expect(twist({ words: [{ w: 'ABC', p: [[0, 0], [0, 1], [1, 1]], gold: false }] })).toBe(1);
  });
});

describe('countSpellings / falseStarts', () => {
  it('counts one spelling when the word can be read along one path only', () => {
    expect(countSpellings(buildGrid(level), 'ALPHA')).toBe(1);
  });
  it('counts two when the letters can be read along two paths', () => {
    const grid = buildGrid(level), before = countSpellings(grid, 'AL');
    grid[1][1] = { ch: 'A', w: 9 };                 // another A touching the L at (0,1)
    expect(countSpellings(grid, 'AL')).toBe(before + 1);
  });
  it('falseStarts counts touching pairs that open a word like its real start but are not it', () => {
    const grid = buildGrid(level);
    const before = falseStarts(level, grid);
    grid[1][1] = { ch: 'A', w: 9 };
    expect(falseStarts(level, grid)[0]).toBeGreaterThan(before[0]);
  });
});
