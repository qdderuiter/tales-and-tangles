import type { ParsedSketch, RawSketch } from '../../data/types.ts';

/* Sketch Artist: a nonogram. Pure rules, no DOM.
   A picture is a square grid of filled (1) and empty (0) cells. Each row and column has a clue: the lengths of its runs of filled cells, in order.
   While solving, a cell is a Mark: 0 blank, 1 filled, 2 crossed out (known empty). Only filled cells matter for the win.
   The line solver works on Tri values: -1 unknown, 0 empty, 1 filled. */

export type Mark = 0 | 1 | 2;
export type Tri = -1 | 0 | 1;
export interface Deduction { kind: 'row' | 'col'; index: number; cells: { r: number; c: number; v: 0 | 1 }[] }

/* the run lengths of the filled cells in a line (empty for a blank line) */
export function lineClues(line: readonly number[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const v of line) {
    if (v === 1) run++;
    else if (run) { out.push(run); run = 0; }
  }
  if (run) out.push(run);
  return out;
}

const column = <T>(g: readonly (readonly T[])[], c: number): T[] => g.map(row => row[c]);

export function cluesOf(grid: readonly (readonly number[])[]): { rowClues: number[][]; colClues: number[][] } {
  return { rowClues: grid.map(row => lineClues(row)), colClues: grid[0].map((_, c) => lineClues(column(grid, c))) };
}

/* '#' filled, anything else empty. Rows must form a square. */
export function parseSketch(raw: RawSketch): ParsedSketch {
  const solution = raw.rows.map(r => r.split('').map(ch => (ch === '#' ? 1 : 0)));
  return { name: raw.name, witness: raw.witness, color: raw.color, size: solution.length, solution, ...cluesOf(solution) };
}

/* every arrangement of `clue` that fits the cells already known; returns what all of them agree on, or null when none fit */
export function solveLine(clue: readonly number[], known: readonly Tri[]): Tri[] | null {
  const n = known.length;
  const line: number[] = new Array(n).fill(0);
  const sawFilled: boolean[] = new Array(n).fill(false), sawEmpty: boolean[] = new Array(n).fill(false);
  let any = false;
  const need = (from: number) => { let t = 0; for (let i = from; i < clue.length; i++) t += clue[i] + 1; return t - 1; };   // cells the blocks from..end need, with single gaps (-1 when none are left)
  const commit = () => { any = true; for (let i = 0; i < n; i++) { if (line[i] === 1) sawFilled[i] = true; else sawEmpty[i] = true; } };
  const rec = (ci: number, pos: number): void => {
    if (ci === clue.length) {
      for (let i = pos; i < n; i++) if (known[i] === 1) return;
      for (let i = pos; i < n; i++) line[i] = 0;
      commit();
      return;
    }
    const len = clue[ci], rest = need(ci + 1);
    for (let s = pos; s + len + (rest >= 0 ? rest + 1 : 0) <= n; s++) {
      if (s > pos && known[s - 1] === 1) break;                     // a filled cell would be left behind the block: no later start can fit either
      let ok = true;
      for (let i = s; i < s + len; i++) if (known[i] === 0) { ok = false; break; }
      const after = s + len;
      if (!ok || (after < n && known[after] === 1)) continue;
      for (let i = pos; i < s; i++) line[i] = 0;
      for (let i = s; i < after; i++) line[i] = 1;
      if (after < n) line[after] = 0;
      rec(ci + 1, Math.min(after + 1, n));
    }
  };
  rec(0, 0);
  if (!any) return null;
  return known.map((_, i): Tri => (sawFilled[i] && !sawEmpty[i] ? 1 : sawEmpty[i] && !sawFilled[i] ? 0 : -1));
}

export interface LineSolve { grid: Tri[][]; solved: boolean; passes: number }

/* solve with line logic alone (each pass: every row, then every column). `solved` also proves the picture has exactly one solution. */
export function solveByLines(rowClues: readonly (readonly number[])[], colClues: readonly (readonly number[])[]): LineSolve {
  const h = rowClues.length, w = colClues.length;
  const grid: Tri[][] = Array.from({ length: h }, () => new Array<Tri>(w).fill(-1));
  let passes = 0, changed = true;
  while (changed) {
    changed = false; passes++;
    for (let r = 0; r < h; r++) {
      const res = solveLine(rowClues[r], grid[r]);
      if (!res) return { grid, solved: false, passes };
      res.forEach((v, c) => { if (v !== grid[r][c]) { grid[r][c] = v; changed = true; } });
    }
    for (let c = 0; c < w; c++) {
      const res = solveLine(colClues[c], column(grid, c));
      if (!res) return { grid, solved: false, passes };
      res.forEach((v, r) => { if (v !== grid[r][c]) { grid[r][c] = v; changed = true; } });
    }
  }
  return { grid, solved: grid.every(row => row.every(v => v !== -1)), passes: passes - 1 };   // the last pass changed nothing
}

/* a line's clue is met when its filled cells form exactly the clue's runs (used to dim the clue numbers) */
export function lineDone(clue: readonly number[], marks: readonly number[]): boolean {
  const got = lineClues(marks);
  return got.length === clue.length && got.every((v, i) => v === clue[i]);
}

/* won when every filled cell of the picture is filled and nothing else is */
export function isSolved(marks: readonly (readonly number[])[], solution: readonly (readonly number[])[]): boolean {
  return solution.every((row, r) => row.every((v, c) => (v === 1) === (marks[r][c] === 1)));
}

/* what the player has right so far: filled cells that belong, crossed cells that are really empty. Wrong marks are ignored. */
export function correctKnowledge(marks: readonly (readonly number[])[], solution: readonly (readonly number[])[]): Tri[][] {
  return solution.map((row, r) => row.map((v, c): Tri => (marks[r][c] === 1 && v === 1 ? 1 : marks[r][c] === 2 && v === 0 ? 0 : -1)));
}

/* the line where the clue settles the most cells the player has not got yet; null when the picture is finished */
export function nextDeduction(rowClues: readonly (readonly number[])[], colClues: readonly (readonly number[])[], known: readonly (readonly Tri[])[]): Deduction | null {
  let best: Deduction | null = null;
  const consider = (kind: 'row' | 'col', index: number, clue: readonly number[], line: Tri[]) => {
    const res = solveLine(clue, line);
    if (!res) return;
    const cells: Deduction['cells'] = [];
    res.forEach((v, i) => {
      if (v === -1 || line[i] !== -1) return;
      cells.push(kind === 'row' ? { r: index, c: i, v } : { r: i, c: index, v });
    });
    if (cells.length && (!best || cells.length > best.cells.length)) best = { kind, index, cells };
  };
  rowClues.forEach((clue, r) => consider('row', r, clue, [...known[r]]));
  colClues.forEach((clue, c) => consider('col', c, clue, column(known, c)));
  return best;
}
