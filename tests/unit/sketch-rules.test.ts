import { describe, expect, it } from 'vitest';
import { SKETCHES } from '../../src/data/sketches.ts';
import { cluesOf, correctKnowledge, isSolved, lineClues, lineDone, nextDeduction, parseSketch, solveByLines, solveLine } from '../../src/puzzles/sketch/sketch-rules.ts';
import type { Tri } from '../../src/puzzles/sketch/sketch-rules.ts';

const U: Tri = -1;

describe('lineClues', () => {
  it('lists the runs of filled cells', () => {
    expect(lineClues([1, 1, 0, 1, 0, 0, 1, 1, 1])).toEqual([2, 1, 3]);
    expect(lineClues([0, 0, 0])).toEqual([]);
    expect(lineClues([1, 1, 1])).toEqual([3]);
    expect(lineClues([0, 1])).toEqual([1]);
  });

  it('cluesOf reads rows and columns', () => {
    expect(cluesOf([[1, 0, 1], [1, 1, 0]])).toEqual({ rowClues: [[1, 1], [2]], colClues: [[2], [1], [1]] });
  });

  it('parseSketch reads # as filled', () => {
    const p = parseSketch({ name: 'x', witness: 'y', color: '#000000', rows: ['#.', '##'] });
    expect(p.size).toBe(2);
    expect(p.solution).toEqual([[1, 0], [1, 1]]);
    expect(p.rowClues).toEqual([[1], [2]]);
    expect(p.colClues).toEqual([[2], [1]]);
  });
});

describe('solveLine', () => {
  it('fills the overlap of a long run, and leaves the rest unknown', () => {
    expect(solveLine([4], [U, U, U, U, U, U])).toEqual([U, U, 1, 1, U, U]);
    expect(solveLine([3], [U, U, U, U, U])).toEqual([U, U, 1, U, U]);
  });

  it('a line that is exactly full is fully known', () => {
    expect(solveLine([2, 1], [U, U, U, U])).toEqual([1, 1, 0, 1]);
    expect(solveLine([5], [U, U, U, U, U])).toEqual([1, 1, 1, 1, 1]);
  });

  it('an empty clue means every cell is empty', () => {
    expect(solveLine([], [U, U, U])).toEqual([0, 0, 0]);
  });

  it('uses what is already known', () => {
    expect(solveLine([2], [1, U, U, U, U])).toEqual([1, 1, 0, 0, 0]);
    expect(solveLine([2], [U, U, U, 1, U])).toEqual([0, 0, U, 1, U]);
    expect(solveLine([1, 1], [U, 0, U, U, U])).toEqual([U, 0, U, U, U]);
    expect(solveLine([2], [0, U, U, U, 0])).toEqual([0, U, 1, U, 0]);
    expect(solveLine([3], [0, U, U, U, 0])).toEqual([0, 1, 1, 1, 0]);
  });

  it('a filled cell can never be left outside every block', () => {
    expect(solveLine([1], [1, U, U, 1])).toBeNull();
    expect(solveLine([2], [U, 1, 0, 1, U])).toBeNull();
  });

  it('returns null when the clue cannot fit at all', () => {
    expect(solveLine([3], [U, U])).toBeNull();
    expect(solveLine([2, 2], [U, U, U, U])).toBeNull();
    expect(solveLine([2], [0, 0, 0])).toBeNull();
  });
});

describe('solveByLines', () => {
  it('solves an easy picture and counts passes', () => {
    const { rowClues, colClues } = cluesOf([[1, 1], [0, 1]]);
    const res = solveByLines(rowClues, colClues);
    expect(res.solved).toBe(true);
    expect(res.grid).toEqual([[1, 1], [0, 1]]);
  });

  it('reports a picture that needs guessing as not solved (two solutions)', () => {
    const res = solveByLines([[1], [1]], [[1], [1]]);       // a diagonal, either way round
    expect(res.solved).toBe(false);
  });

  it('reports clues that contradict each other as not solved', () => {
    expect(solveByLines([[2], [2]], [[1], [1]]).solved).toBe(false);
  });
});

describe('lineDone / isSolved', () => {
  it('lineDone is true when the filled runs match the clue exactly, crosses ignored', () => {
    expect(lineDone([2, 1], [1, 1, 2, 1, 2])).toBe(true);
    expect(lineDone([2, 1], [1, 1, 1, 1, 0])).toBe(false);
    expect(lineDone([2, 1], [1, 1, 0, 0, 0])).toBe(false);
    expect(lineDone([], [0, 2, 0])).toBe(true);
  });

  it('isSolved wants every filled cell and nothing extra; crosses do not matter', () => {
    const sol = [[1, 0], [1, 1]];
    expect(isSolved([[1, 2], [1, 1]], sol)).toBe(true);
    expect(isSolved([[1, 0], [1, 1]], sol)).toBe(true);
    expect(isSolved([[1, 0], [1, 0]], sol)).toBe(false);
    expect(isSolved([[1, 1], [1, 1]], sol)).toBe(false);
  });
});

describe('correctKnowledge and nextDeduction', () => {
  const sk = parseSketch(SKETCHES[26]);

  it('correctKnowledge keeps only marks that agree with the picture', () => {
    const marks = sk.solution.map(row => row.map(() => 0));
    marks[0][3] = 1;      // right (filled)
    marks[0][0] = 1;      // wrong (empty cell filled)
    marks[0][1] = 2;      // right (empty cell crossed)
    marks[0][4] = 2;      // wrong (filled cell crossed)
    const k = correctKnowledge(marks, sk.solution);
    expect(k[0]).toEqual([U, 0, U, 1, U, U, U, U]);
  });

  it('suggests only squares that are really in the picture, from any starting point', () => {
    const marks = sk.solution.map(row => row.map(() => 0));
    for (let guard = 0; guard < 200; guard++) {
      const d = nextDeduction(sk.rowClues, sk.colClues, correctKnowledge(marks, sk.solution));
      if (!d) break;
      expect(d.cells.length).toBeGreaterThan(0);
      for (const { r, c, v } of d.cells) {
        expect(sk.solution[r][c], `${d.kind} ${d.index} (${r},${c})`).toBe(v);
        expect(d.kind === 'row' ? r : c).toBe(d.index);
        marks[r][c] = v === 1 ? 1 : 2;
      }
    }
    expect(isSolved(marks, sk.solution)).toBe(true);
  });

  it('is null once the picture is finished', () => {
    const marks = sk.solution.map(row => row.map(v => (v === 1 ? 1 : 2)));
    expect(nextDeduction(sk.rowClues, sk.colClues, correctKnowledge(marks, sk.solution))).toBeNull();
  });

  it('ignores wrong marks: a wrong fill does not mislead the hint', () => {
    const marks = sk.solution.map(row => row.map(() => 0));
    marks[7][0] = 1;      // wrong
    const d = nextDeduction(sk.rowClues, sk.colClues, correctKnowledge(marks, sk.solution))!;
    for (const { r, c, v } of d.cells) expect(sk.solution[r][c]).toBe(v);
  });
});
