import { describe, expect, it } from 'vitest';
import { DEFAULT_STEPS } from '../../src/game/level-steps.ts';
import { LEVELS } from '../../src/data/levels.ts';
import { SKETCHES } from '../../src/data/sketches.ts';
import { REACT } from '../../src/data/story.ts';
import { isSolved, solveByLines } from '../../src/puzzles/sketch/sketch-rules.ts';

const sketchLevels = LEVELS.filter(lv => (lv.steps || DEFAULT_STEPS).includes('sketch'));

describe('Sketch Artist content', () => {
  it('exactly the levels with a sketch step have a picture, and no other', () => {
    expect(Object.keys(SKETCHES).map(Number).sort((a, b) => a - b)).toEqual(sketchLevels.map(lv => lv.n));
    for (const lv of LEVELS) expect(!!lv.sketch, 'level ' + lv.n).toBe(sketchLevels.includes(lv));
  });

  it('the first sketch players meet is the small one', () => {
    expect(sketchLevels[0].sketch!.size).toBe(8);
    sketchLevels.slice(1).forEach(lv => expect(lv.sketch!.size, 'level ' + lv.n).toBe(10));
  });

  describe.each(sketchLevels.map(lv => [lv.n, lv.sketch!, SKETCHES[lv.n]] as const))('level %i', (_n, sk, raw) => {
    it('is a square of # and . with a name, a witness line and a colour', () => {
      expect(raw.rows.length).toBe(sk.size);
      raw.rows.forEach(row => expect(row).toMatch(new RegExp('^[#.]{' + sk.size + '}$')));
      expect(sk.name.length).toBeGreaterThan(3);
      expect(sk.witness.length).toBeGreaterThan(20);
      expect(sk.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('has a clue for every line, and every row and column has something filled', () => {
      expect(sk.rowClues.length).toBe(sk.size);
      expect(sk.colClues.length).toBe(sk.size);
      for (const cl of [...sk.rowClues, ...sk.colClues]) expect(cl.length).toBeGreaterThan(0);
    });

    it('is not mostly empty or mostly full', () => {
      const filled = sk.solution.flat().reduce((a, v) => a + v, 0), all = sk.size * sk.size;
      expect(filled / all).toBeGreaterThan(0.3);
      expect(filled / all).toBeLessThan(0.75);
    });

    it('can be solved by line logic alone, so it has exactly one solution and never needs a guess', () => {
      const res = solveByLines(sk.rowClues, sk.colClues);
      expect(res.solved).toBe(true);
      expect(res.grid.map(row => row.map(v => (v === 1 ? 1 : 0)))).toEqual(sk.solution);
      expect(isSolved(res.grid.map(row => row.map(v => (v === 1 ? 1 : 0))), sk.solution)).toBe(true);
    });

    it('takes a few passes of the solver (not a giveaway)', () => {
      expect(solveByLines(sk.rowClues, sk.colClues).passes).toBeGreaterThanOrEqual(2);
    });
  });

  it('Barnaby has a line for each part of the ladder and for Noir', () => {
    for (const k of ['sketchTeach', 'sketchStart', 'sketchStartNoir', 'sketchWrong', 'sketchHint1', 'sketchHint2', 'sketchHint3', 'sketchDone'] as const) {
      expect(REACT[k].t.length, k).toBeGreaterThan(10);
    }
  });
});
