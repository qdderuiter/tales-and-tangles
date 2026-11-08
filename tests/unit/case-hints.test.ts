import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels.ts';
import type { Case } from '../../src/data/types.ts';
import { NOTE_KINDS, blankNotes, caseCell, decided, notesToDomains, planCaseHint, propagate } from '../../src/puzzles/case/case-logic.ts';
import type { CaseHint, Notes } from '../../src/puzzles/case/case-logic.ts';

/* notes: per grid kind an N x N board of 0 (blank) / 1 (cross) / 2 (check); `struck` = clues the player crossed out */
const allEarned = { word: true, zip: true };

/* the hinted cell must follow from the lit clue(s) plus ordinary grid moves (empty ks = grid moves alone; a combo hint may use every clue) */
function expectExplainable(c: Case, notes: Notes, hint: CaseHint, label: string) {
  if (hint.type !== 'deduce') return;
  const ks = hint.ks.length || hint.elim ? hint.ks : c.clues.map((_, k) => k);
  const cells = decided(c.N, notes, propagate(c, notesToDomains(c.N, notes), ks));
  const [kind, s, v, check] = hint.target;
  expect(cells.some(x => x[0] === kind && x[1] === s && x[2] === v && x[3] === check), `${label}: ${kind} ${s} ${v} from clues [${hint.ks}]`).toBe(true);
}

/* do what the hint says, like a player would */
function follow(notes: Notes, hint: CaseHint) {
  if (hint.type === 'fix') notes[hint.kind][hint.s][hint.v] = 0;
  else if (hint.type === 'deduce') { const [kind, s, v, check] = hint.target; notes[kind][s][v] = check ? 2 : 1; }
}

describe.each(LEVELS.map(lv => [lv.n, lv.case]))('notebook hints for chapter %i', (_n, c) => {
  it('never suggests a wrong cell, and finishes the case when followed repeatedly', () => {
    const notes = blankNotes(c.N);
    let steps = 0;
    for (;;) {
      const hint = planCaseHint(c, notes, allEarned);
      if (hint.type === 'done') break;
      expect(hint.type, 'step ' + steps).toBe('deduce');
      if (hint.type !== 'deduce') throw new Error('unreachable: checked above');
      const [kind, s, v, check] = hint.target;
      expect(caseCell(c.solution, kind, s, v), `${kind} ${s} ${v} at step ${steps}`).toBe(check);
      expect(notes[kind][s][v]).toBe(0);
      expectExplainable(c, notes, hint, 'step ' + steps);
      follow(notes, hint);
      expect(++steps).toBeLessThan(200);
    }
    for (let s = 0; s < c.N; s++) {
      expect(notes.items[s][c.solution.item[s]]).toBe(2);
      expect(notes.places[s][c.solution.place[s]]).toBe(2);
    }
  });

  it('every hint from a half-filled notebook can be followed from the clues it lights up', () => {
    for (let trial = 0; trial < 25; trial++) {
      const notes = blankNotes(c.N);
      NOTE_KINDS.forEach(kind => { for (let s = 0; s < c.N; s++) for (let v = 0; v < c.N; v++) if ((s * 7 + v * 3 + trial) % 4 === 0) notes[kind][s][v] = caseCell(c.solution, kind, s, v) ? 2 : 1; });
      const hint = planCaseHint(c, notes, allEarned);
      if (hint.type === 'deduce') expectExplainable(c, notes, hint, 'trial ' + trial);
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
