import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels.ts';
import type { TempLevel } from '../../src/data/types.ts';
import { Evil } from '../../src/puzzles/evil.ts';
import { generateDaily } from '../../src/puzzles/daily-generator.ts';
import { buildGrid, isSolved, orthogonal } from '../../src/puzzles/word/word-rules.ts';
import { allFound } from './helpers/word-level.ts';

const sorted = (lv: TempLevel) => lv.words.map(w => w.w).sort();
const layout = (lv: TempLevel) => JSON.stringify(lv.words.map(w => w.p));

const bases: [string, TempLevel][] = [...LEVELS.map((lv): [string, TempLevel] => [`chapter ${lv.n}`, lv]), ['a daily', generateDaily('2025-06-01')]];

describe.each(bases)('Evil.word of %s', (_name, base) => {
  const evil = Evil.word(base);

  it('keeps the same words (and gold word) on a different layout', () => {
    expect(sorted(evil)).toEqual(sorted(base));
    expect(evil.words.find(w => w.gold)!.w).toBe(base.words.find(w => w.gold)!.w);
    expect(layout(evil)).not.toBe(layout(base));
    expect(evil.evil).toBe(true);
  });
  it('still tiles the grid', () => {
    expect(isSolved(evil, allFound(evil), buildGrid(evil))).toBe(true);
  });
  it('every path is as long as its word, so hidden-length mode cannot leak a wrong length', () => {
    for (const w of evil.words) expect(w.p.length).toBe(w.w.length);
  });
  it('never steps diagonally', () => {
    for (const w of evil.words) for (let k = 1; k < w.p.length; k++) expect(orthogonal(w.p[k - 1], w.p[k]), w.w).toBe(true);
  });
});

describe('Evil.key', () => {
  it('keys cleared remixes per chapter and per kind, or per date for a daily', () => {
    expect(Evil.key('word', { n: 3 })).toBe('word3');
    expect(Evil.key('zip', { n: 3 })).toBe('zip3');
    expect(Evil.key('word', { daily: true, date: '2025-06-01' })).toBe('daily-2025-06-01');
  });
});
