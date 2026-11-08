import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels.js';
import { caseAssignments, caseFits } from '../../src/puzzles/case/case-logic.js';

const solutions = (c, clues) => caseAssignments(c.N).filter(a => clues.every(cl => caseFits(c.N, a.item, a.place, cl.c)));

describe.each(LEVELS.map(lv => [lv.n, lv]))('case of chapter %i', (_n, lv) => {
  const c = lv.case, sol = c.solution;

  it('is shaped consistently', () => {
    const idx = [...Array(c.N).keys()];
    expect(c.suspects.length).toBe(c.N);
    expect(c.items.length).toBe(c.N);
    expect(c.places.length).toBe(c.N);
    expect([...sol.item].sort()).toEqual(idx);
    expect([...sol.place].sort()).toEqual(idx);
  });

  it('exactly one assignment satisfies every clue, and it is the stored solution', () => {
    const all = solutions(c, c.clues);
    expect(all.length).toBe(1);
    expect(all[0]).toEqual(sol);
  });

  it('is NOT unique without the two earned clues', () => {
    expect(c.clues.filter(cl => cl.earned).length).toBe(2);
    expect(solutions(c, c.clues.filter(cl => !cl.earned)).length).toBeGreaterThan(1);
  });

  it('the culprit and their item agree with the solution', () => {
    expect(sol.place[c.culprit]).toBe(c.crimePlace);
    expect(sol.item[c.culprit]).toBe(c.culpritItem);
  });

  it('each earned clue is keyed by the level word (Words) or the trail word (Trail), one of each', () => {
    const earned = c.clues.filter(cl => cl.earned);
    expect(earned.map(cl => cl.earned).sort()).toEqual(['word', 'zip']);
    expect(earned.find(cl => cl.earned === 'word').key).toBe(lv.theme);
    expect(earned.find(cl => cl.earned === 'zip').key).toBe(lv.zip.word);
  });

  it('every clue has text and a constraint', () => {
    for (const cl of c.clues) {
      expect(cl.t).toBeTruthy();
      expect(Array.isArray(cl.c)).toBe(true);
    }
  });
});
