import { describe, expect, it } from 'vitest';
import { COLS, ROWS } from '../../src/core/grid.js';
import { attemptInfo, buildGrid, isSolved, matchWord, samePath, spell } from '../../src/puzzles/word/word-rules.js';

/* A made-up level on the real 6x5 grid: a snake through every cell, cut into six 5-letter "words". */
const snake = [];
for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) snake.push([r, r % 2 ? COLS - 1 - k : k]);
const level = {
  words: ['ALPHA', 'BRAVO', 'CHARM', 'DELTA', 'EAGLE', 'FROST'].map((w, i) => ({ w, p: snake.slice(i * 5, i * 5 + 5), gold: i === 0 }))
};
const trace = p => p.map(([r, c]) => ({ r, c }));
const all = () => new Set(level.words.map((_, i) => i));

describe('buildGrid / spell', () => {
  const grid = buildGrid(level);
  it('puts each letter on its path cell and remembers which word owns it', () => {
    expect(grid[0][0]).toEqual({ ch: 'A', w: 0 });
    expect(grid[0][4]).toEqual({ ch: 'A', w: 0 });
    expect(grid[0][5]).toEqual({ ch: 'B', w: 1 });
  });
  it('spell reads the letters under a swipe', () => {
    expect(spell(grid, trace(level.words[1].p))).toBe('BRAVO');
    expect(spell(grid, trace(level.words[1].p).reverse())).toBe('OVARB');
  });
});

describe('samePath / matchWord', () => {
  it('samePath compares cell by cell and by length', () => {
    expect(samePath(trace([[0, 0], [0, 1]]), [[0, 0], [0, 1]])).toBe(true);
    expect(samePath(trace([[0, 0], [0, 1]]), [[0, 1], [0, 0]])).toBe(false);
    expect(samePath(trace([[0, 0]]), [[0, 0], [0, 1]])).toBe(false);
  });
  it('matches a swipe in either direction and ignores found words', () => {
    const p = level.words[2].p;
    expect(matchWord(level, new Set(), trace(p))).toBe(2);
    expect(matchWord(level, new Set(), trace(p).reverse())).toBe(2);
    expect(matchWord(level, new Set([2]), trace(p))).toBe(-1);
  });
  it('a partial swipe or a shifted swipe matches nothing', () => {
    expect(matchWord(level, new Set(), trace(level.words[0].p.slice(0, 4)))).toBe(-1);
    expect(matchWord(level, new Set(), trace(snake.slice(1, 6)))).toBe(-1);
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
    expect(isSolved(level, all(), grid)).toBe(true);
    const some = all(); some.delete(3);
    expect(isSolved(level, some, grid)).toBe(false);
    expect(isSolved(level, new Set(), grid)).toBe(false);
  });
  it('is false if the found words overlap or the letters disagree with the grid', () => {
    const clash = { words: level.words.map((w, i) => (i === 1 ? { ...w, p: level.words[0].p } : w)) };
    expect(isSolved(clash, all(), grid)).toBe(false);
    const wrongLetters = { words: level.words.map((w, i) => (i === 0 ? { ...w, w: 'ZZZZZ' } : w)) };
    expect(isSolved(wrongLetters, all(), grid)).toBe(false);
  });
});
