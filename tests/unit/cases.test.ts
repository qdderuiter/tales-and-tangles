import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels.ts';
import type { Case, Clue } from '../../src/data/types.ts';
import { blankNotes, caseAssignments, caseFits, notesToDomains, propagate } from '../../src/puzzles/case/case-logic.ts';

const solutions = (c: Case, clues: Clue[]) => caseAssignments(c.N).filter(a => clues.every(cl => caseFits(c.N, a.item, a.place, cl.c)));

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

  it('can be solved step by step without guessing', () => {
    const d = propagate(c, notesToDomains(c.N, blankNotes(c.N)), c.clues.map((_, k) => k));
    for (let s = 0; s < c.N; s++) {
      expect(d.items[s].map((ok, v) => ok ? v : -1).filter(v => v >= 0), 'items row ' + s).toEqual([sol.item[s]]);
      expect(d.places[s].map((ok, v) => ok ? v : -1).filter(v => v >= 0), 'rooms row ' + s).toEqual([sol.place[s]]);
      expect(d.itemPlaces[s].map((ok, v) => ok ? v : -1).filter(v => v >= 0), 'item-room row ' + s).toEqual([sol.place[sol.item.indexOf(s)]]);
    }
  });

  it('is NOT unique without the two earned clues', () => {
    expect(c.clues.filter(cl => cl.earned).length).toBe(2);
    expect(solutions(c, c.clues.filter(cl => !cl.earned)).length).toBeGreaterThan(1);
  });

  it('needs each earned clue: dropping either one alone leaves more than one solution', () => {
    for (const earned of c.clues.filter(cl => cl.earned)) {
      expect(solutions(c, c.clues.filter(cl => cl !== earned)).length, 'without the ' + earned.earned + ' clue').toBeGreaterThan(1);
    }
  });

  it('the culprit and their item agree with the solution', () => {
    expect(sol.place[c.culprit]).toBe(c.crimePlace);
    expect(sol.item[c.culprit]).toBe(c.culpritItem);
  });

  it('each earned clue is keyed by the level word (Words) or the trail word (Trail), one of each', () => {
    const earned = c.clues.filter(cl => cl.earned);
    expect(earned.map(cl => cl.earned).sort()).toEqual(['word', 'zip']);
    expect(earned.find(cl => cl.earned === 'word')!.key).toBe(lv.theme);
    expect(earned.find(cl => cl.earned === 'zip')!.key).toBe(lv.zip.word);
  });

  it('no two items or rooms share an emoji, so the notebook grid never shows the same picture twice (Chapter 11 on; cases 24 and 28 predate this rule)', () => {
    if (lv.n < 30) return;
    const all = [...c.items, ...c.places].map(x => x.emoji);
    expect(new Set(all).size).toBe(all.length);
  });

  it('every clue has text and a constraint', () => {
    for (const cl of c.clues) {
      expect(cl.t).toBeTruthy();
      expect(Array.isArray(cl.c)).toBe(true);
    }
  });
});

describe('"neither" clue kinds', () => {
  const item = [0, 1, 2], place = [2, 0, 1];                    // suspect s holds item[s] in place[s]
  it('notEitherPlace, notEitherItem and notLinkEither rule out two values at once', () => {
    expect(caseFits(3, item, place, ['notEitherPlace', 0, 0, 1])).toBe(true);
    expect(caseFits(3, item, place, ['notEitherPlace', 0, 2, 1])).toBe(false);
    expect(caseFits(3, item, place, ['notEitherItem', 1, 0, 2])).toBe(true);
    expect(caseFits(3, item, place, ['notEitherItem', 1, 0, 1])).toBe(false);
    expect(caseFits(3, item, place, ['notLinkEither', 2, 0, 2])).toBe(true);
    expect(caseFits(3, item, place, ['notLinkEither', 2, 0, 1])).toBe(false);
  });
});

/* each clue's wording must name exactly the suspects, items and rooms its constraint points at */
describe.each(LEVELS.map(lv => [lv.n, lv.case] as const))('clue wording of case %i', (_n, c) => {
  it('mentions every suspect, item and room its constraint refers to', () => {
    const S = (i: number) => c.suspects[i], I = (i: number) => c.items[i].name, P = (i: number) => c.places[i].name;
    c.clues.forEach(cl => {
      const [k, ...a] = cl.c;
      const need: Record<string, () => string[]> = {
        next: () => [S(a[0]), S(a[1])], left: () => [S(a[0]), S(a[1])], notNext: () => [S(a[0]), S(a[1])],
        end: () => [S(a[0])],
        eitherPlace: () => [S(a[0]), P(a[1]), P(a[2])], notEitherPlace: () => [S(a[0]), P(a[1]), P(a[2])], notPlace: () => [S(a[0]), P(a[1])], isPlace: () => [S(a[0]), P(a[1])],
        eitherItem: () => [S(a[0]), I(a[1]), I(a[2])], notEitherItem: () => [S(a[0]), I(a[1]), I(a[2])], notItem: () => [S(a[0]), I(a[1])], isItem: () => [S(a[0]), I(a[1])],
        linkIP: () => [I(a[0]), P(a[1])], notLinkIP: () => [I(a[0]), P(a[1])],
        linkEither: () => [I(a[0]), P(a[1]), P(a[2])], notLinkEither: () => [I(a[0]), P(a[1]), P(a[2])],
        itemNext: () => [I(a[0]), I(a[1])]
      };
      expect(need[k], 'unknown clue kind ' + k).toBeDefined();
      need[k]().forEach(name => expect(cl.t, cl.t).toContain(name));
    });
  });
});
