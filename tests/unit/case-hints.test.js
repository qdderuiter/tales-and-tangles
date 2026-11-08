import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels.js';
import { blankNotes, caseCell, planCaseHint } from '../../src/puzzles/case/case-logic.js';

/* notes: per grid kind an N x N board of 0 (blank) / 1 (cross) / 2 (check); `struck` = clues the player crossed out */
const allEarned = { word: true, zip: true };

/* do what the hint says, like a player would */
function follow(notes, hint) {
  if (hint.type === 'fix') notes[hint.kind][hint.s][hint.v] = 0;
  else { const [kind, s, v, check] = hint.target; notes[kind][s][v] = check ? 2 : 1; }
}

describe.each(LEVELS.map(lv => [lv.n, lv.case]))('notebook hints for chapter %i', (_n, c) => {
  it('never suggests a wrong cell, and finishes the case when followed repeatedly', () => {
    const notes = blankNotes(c.N);
    let steps = 0;
    for (;;) {
      const hint = planCaseHint(c, notes, allEarned);
      if (hint.type === 'done') break;
      expect(hint.type, 'step ' + steps).toBe('deduce');
      const [kind, s, v, check] = hint.target;
      expect(caseCell(c.solution, kind, s, v), `${kind} ${s} ${v} at step ${steps}`).toBe(check);
      expect(notes[kind][s][v]).toBe(0);
      follow(notes, hint);
      expect(++steps).toBeLessThan(200);
    }
    for (let s = 0; s < c.N; s++) {
      expect(notes.items[s][c.solution.item[s]]).toBe(2);
      expect(notes.places[s][c.solution.place[s]]).toBe(2);
    }
  });

  it('with the earned clues still locked it never suggests a wrong cell either', () => {
    const notes = blankNotes(c.N);
    for (let steps = 0; steps < 60; steps++) {
      const hint = planCaseHint(c, notes, { word: false, zip: false });
      if (hint.type === 'done' || hint.type === 'none') break;
      if (hint.type === 'deduce') {
        const [kind, s, v, check] = hint.target;
        expect(caseCell(c.solution, kind, s, v)).toBe(check);
        hint.ks.forEach(k => expect(c.clues[k].earned, 'a locked clue was used').toBeFalsy());
      }
      follow(notes, hint);
    }
  });

  it('points at a wrong mark first, and fixing it is what the hint asks for', () => {
    const notes = blankNotes(c.N);
    const wrongItem = (c.solution.item[0] + 1) % c.N;
    notes.items[0][wrongItem] = 2;                         // a check on an item suspect 0 did not hold
    expect(planCaseHint(c, notes, allEarned)).toEqual({ type: 'fix', kind: 'items', s: 0, v: wrongItem });
  });
});
