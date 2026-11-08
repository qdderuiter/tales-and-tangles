import type { Case, CaseAssignment, ClueConstraint } from '../../data/types.ts';
import { blankMatrix, pick } from '../../core/util.ts';

/* ---------- the notebook: a Murdle-style logic grid ----------
   Rows = suspects, columns = items (tab 1) or rooms (tab 2). Tap a cell: blank -> X -> check -> blank.
   A check optionally auto-crosses the rest of its row and column (shown fainter, and removed again with the check).
   The crime names only the ROOM; the player works out who was there and what they held, then accuses (suspect + item). */
export const NOTE_KINDS = ['items', 'places', 'itemPlaces'] as const;           // the notebook's three grids (tab order)
/* a fresh notebook for an N-suspect case: an N x N board of 0 per grid kind, and no clues struck out */
export type NoteKind = (typeof NOTE_KINDS)[number];
export type Notes = Record<NoteKind, number[][]> & { struck: Record<number, number> };
export const blankNotes = (N: number): Notes => ({ items: blankMatrix(N), places: blankMatrix(N), itemPlaces: blankMatrix(N), struck: {} });

/* ---------- notebook hint engine (pure logic; CaseScreen drives the UI) ----------
   An "assignment" is { item[s], place[s] }: the item suspect s held and the room they were in. */
/* HINT-ENGINE-START */
export type CaseHint =
  | { type: 'fix'; kind: NoteKind; s: number; v: number }
  | { type: 'done' }
  | { type: 'deduce'; ks: number[]; elim: boolean; target: [NoteKind, number, number, boolean] }
  | { type: 'none' };

export const caseAdj = (a: number, b: number) => Math.abs(a - b) === 1;

export function caseFits(N: number, item: number[], place: number[], c: ClueConstraint): boolean {
  switch (c[0]) {
    case 'next': return caseAdj(place[c[1]], place[c[2]]);
    case 'left': return place[c[1]] < place[c[2]];
    case 'end': return place[c[1]] === 0 || place[c[1]] === N - 1;
    case 'notNext': return !caseAdj(place[c[1]], place[c[2]]);
    case 'eitherPlace': return place[c[1]] === c[2] || place[c[1]] === c[3];
    case 'notPlace': return place[c[1]] !== c[2];
    case 'eitherItem': return item[c[1]] === c[2] || item[c[1]] === c[3];
    case 'notItem': return item[c[1]] !== c[2];
    case 'linkIP': return place[item.indexOf(c[1])] === c[2];
    case 'notLinkIP': return place[item.indexOf(c[1])] !== c[2];
    case 'linkEither': { const p = place[item.indexOf(c[1])]; return p === c[2] || p === c[3]; }
    case 'itemNext': return caseAdj(place[item.indexOf(c[1])], place[item.indexOf(c[2])]);
    case 'isPlace': return place[c[1]] === c[2];
    case 'isItem': return item[c[1]] === c[2];
  }
  return true;
}

/* is notebook cell (kind, row s, column v) true in assignment a? rows of 'itemPlaces' are items */
export const caseCell = (a: CaseAssignment, kind: NoteKind, s: number, v: number) => kind === 'items' ? a.item[s] === v : kind === 'places' ? a.place[s] === v : a.place[a.item.indexOf(s)] === v;

export const CASE_ASSIGN: Record<number, CaseAssignment[]> = {};

export function caseAssignments(N: number): CaseAssignment[] {                                   // every item arrangement x every room arrangement (576 for 4, 14400 for 5)
  if (CASE_ASSIGN[N]) return CASE_ASSIGN[N];
  const perms: number[][] = [], rec = (a: number[], used: number[]) => { if (a.length === N) { perms.push(a.slice()); return; } for (let i = 0; i < N; i++) if (!used[i]) { used[i] = 1; a.push(i); rec(a, used); a.pop(); used[i] = 0; } };
  rec([], []);
  const out: CaseAssignment[] = [];
  perms.forEach(item => perms.forEach(place => out.push({ item, place })));
  return (CASE_ASSIGN[N] = out);
}

/* Decide what the next hint points at, from the player's own marks (✕ = 1, ✓ = 2; auto-crosses are derived, so ignored):
     { type:'fix',    kind, s, v }                          a mark that contradicts the solution
     { type:'done' }                                        every answer is already checked
     { type:'deduce', ks, elim, target }                    clue indices ks (empty = plain elimination) force the blank cell target = [kind,s,v,isCheck]
     { type:'none' }                                        nothing can be deduced yet (clues still locked) */
export function planCaseHint(c: Case, notes: Notes, earned: Record<string, boolean>): CaseHint {
  const N = c.N, sol = c.solution;
  const marks: [NoteKind, number, number, boolean][] = [];
  NOTE_KINDS.forEach(kind => notes[kind].forEach((row, s) => row.forEach((st, v) => { if (st === 1 || st === 2) marks.push([kind, s, v, st === 2]); })));
  const wrong = marks.filter(([kind, s, v, on]) => caseCell(sol, kind, s, v) !== on);
  if (wrong.length) { const [kind, s, v] = pick(wrong); return { type: 'fix', kind, s, v }; }
  const answers: [NoteKind, number, number][] = [];
  for (let s = 0; s < N; s++) answers.push(['items', s, sol.item[s]], ['places', s, sol.place[s]], ['itemPlaces', sol.item[s], sol.place[s]]);
  if (answers.every(([kind, s, v]) => notes[kind][s][v] === 2)) return { type: 'done' };

  const base = caseAssignments(N).filter(a => marks.every(([kind, s, v, on]) => caseCell(a, kind, s, v) === on));
  const masks: Record<number, boolean[]> = {};                                              // per clue: which assignments in base satisfy it (built only when a clue is tried)
  const maskOf = (k: number) => masks[k] || (masks[k] = base.map(a => caseFits(N, a.item, a.place, c.clues[k].c)));
  const forced = (ks: number[], skip?: Set<string>) => {                                 // blank cells that every assignment in base passing clues ks agrees on
    const ms = ks.map(maskOf), cnt = NOTE_KINDS.map(() => Array.from({ length: N }, () => new Array(N).fill(0)));
    let total = 0;
    base.forEach((a, i) => {
      if (!ms.every(m => m[i])) return;
      total++;
      for (let s = 0; s < N; s++) { cnt[0][s][a.item[s]]++; cnt[1][s][a.place[s]]++; cnt[2][a.item[s]][a.place[s]]++; }
    });
    const out: [NoteKind, number, number, boolean][] = [];
    if (!total) return out;
    NOTE_KINDS.forEach((kind, ki) => { for (let s = 0; s < N; s++) for (let v = 0; v < N; v++) {
      const n = cnt[ki][s][v];
      if ((n === total || n === 0) && notes[kind][s][v] === 0 && !(skip && skip.has(kind + s + v))) out.push([kind, s, v, n > 0]);
    } });
    return out;
  };
  const byElimination = forced([]), known = new Set(byElimination.map(([kind, s, v]) => kind + s + v));
  const visible = c.clues.map((_, k) => k).filter(k => !(c.clues[k].earned && !earned[c.clues[k].earned]));
  const plan = (ks: number[], cells: [NoteKind, number, number, boolean][], elim?: boolean): CaseHint => { const crosses = cells.filter(x => !x[3]); return { type: 'deduce', ks, elim: !!elim, target: pick(crosses.length ? crosses : cells) }; };
  const pairs = () => visible.flatMap((a, i) => visible.slice(i + 1).map(b => [a, b]));

  // one clue alone, then a clue the player already crossed out, then two together (each group is only built if the one before found nothing)
  const groups = [() => visible.filter(k => !notes.struck[k]).map(k => [k]), () => visible.filter(k => notes.struck[k]).map(k => [k]), pairs];
  for (const group of groups) {
    let best: { ks: number[]; cells: [NoteKind, number, number, boolean][] } | null = null;
    for (const ks of group()) {
      const cells = forced(ks, known);
      if (cells.length && (!best || cells.length > best.cells.length || (cells.length === best.cells.length && Math.random() < 0.5))) best = { ks, cells };
    }
    if (best) return plan(best.ks, best.cells);
  }
  if (byElimination.length) return plan([], byElimination, true);
  const all = forced(visible, known);
  return all.length ? plan([], all) : { type: 'none' };
}
/* HINT-ENGINE-END */
