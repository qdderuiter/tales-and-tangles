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
  | { type: 'deduce'; ks: number[]; elim: boolean; link: boolean; target: [NoteKind, number, number, boolean] }
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
    case 'notEitherPlace': return place[c[1]] !== c[2] && place[c[1]] !== c[3];
    case 'notEitherItem': return item[c[1]] !== c[2] && item[c[1]] !== c[3];
    case 'notLinkEither': { const p = place[item.indexOf(c[1])]; return p !== c[2] && p !== c[3]; }
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

/* ---------- step-by-step solver: the reasoning a player does by hand ----------
   Domains say which cells are still possible on each page (true = possible). The only moves are the ones the notebook offers:
   a clue read on the page it talks about, a row/column with one choice left, and carrying a certain fact over to the other pages. */
export type Domains = Record<NoteKind, boolean[][]>;
type Cell = [NoteKind, number, number, boolean];                                             // [page, row, column, isCheck]

const copyDomains = (d: Domains): Domains => ({ items: d.items.map(r => r.slice()), places: d.places.map(r => r.slice()), itemPlaces: d.itemPlaces.map(r => r.slice()) });

/* the player's crosses and checks as domains (a check also rules out the rest of its row and column; auto-crosses follow from checks) */
export function notesToDomains(N: number, notes: Notes): Domains {
  const d = { items: [], places: [], itemPlaces: [] } as unknown as Domains;
  NOTE_KINDS.forEach(kind => { d[kind] = notes[kind].map(row => row.map(st => st !== 1)); });
  NOTE_KINDS.forEach(kind => {
    for (let s = 0; s < N; s++) for (let v = 0; v < N; v++) if (notes[kind][s][v] === 2) {
      for (let x = 0; x < N; x++) { if (x !== v) d[kind][s][x] = false; if (x !== s) d[kind][x][v] = false; }
    }
  });
  return d;
}

/* everything that follows from the marks plus the clues ks, using only the moves above (returns a new Domains). links = false skips carrying facts between pages */
export function propagate(c: Case, start: Domains, ks: number[], links = true): Domains {
  const N = c.N, d = copyDomains(start), SI = d.items, SP = d.places, IP = d.itemPlaces, R = [...Array(N).keys()];
  let changed = true;
  const kill = (M: boolean[][], a: number, b: number) => { if (M[a][b]) { M[a][b] = false; changed = true; } };
  const only = (cells: boolean[]) => { let at = -1; for (let i = 0; i < N; i++) if (cells[i]) { if (at >= 0) return -1; at = i; } return at; };
  const col = (M: boolean[][], v: number) => M.map(r => r[v]);
  const unary = (M: boolean[][], a: number, ok: (v: number) => boolean) => R.forEach(v => { if (M[a][v] && !ok(v)) kill(M, a, v); });
  const binary = (M: boolean[][], a: number, b: number, ok: (x: number, y: number) => boolean) => {
    R.forEach(x => { if (M[a][x] && !R.some(y => y !== x && M[b][y] && ok(x, y))) kill(M, a, x); });
    R.forEach(y => { if (M[b][y] && !R.some(x => x !== y && M[a][x] && ok(x, y))) kill(M, b, y); });
  };
  const apply = (t: ClueConstraint) => {
    switch (t[0]) {
      case 'next': binary(SP, t[1], t[2], caseAdj); break;
      case 'notNext': binary(SP, t[1], t[2], (x, y) => !caseAdj(x, y)); break;
      case 'left': binary(SP, t[1], t[2], (x, y) => x < y); break;
      case 'end': unary(SP, t[1], v => v === 0 || v === N - 1); break;
      case 'eitherPlace': unary(SP, t[1], v => v === t[2] || v === t[3]); break;
      case 'notPlace': unary(SP, t[1], v => v !== t[2]); break;
      case 'isPlace': unary(SP, t[1], v => v === t[2]); break;
      case 'eitherItem': unary(SI, t[1], v => v === t[2] || v === t[3]); break;
      case 'notItem': unary(SI, t[1], v => v !== t[2]); break;
      case 'isItem': unary(SI, t[1], v => v === t[2]); break;
      case 'linkIP': unary(IP, t[1], v => v === t[2]); break;
      case 'notLinkIP': unary(IP, t[1], v => v !== t[2]); break;
      case 'linkEither': unary(IP, t[1], v => v === t[2] || v === t[3]); break;
      case 'notEitherPlace': unary(SP, t[1], v => v !== t[2] && v !== t[3]); break;
      case 'notEitherItem': unary(SI, t[1], v => v !== t[2] && v !== t[3]); break;
      case 'notLinkEither': unary(IP, t[1], v => v !== t[2] && v !== t[3]); break;
      case 'itemNext': binary(IP, t[1], t[2], caseAdj); break;
    }
  };
  while (changed) {
    changed = false;
    ks.forEach(k => apply(c.clues[k].c));
    [SI, SP, IP].forEach(M => R.forEach(a => {                                              // a row / column with one choice left settles that choice
      const r = only(M[a]); if (r >= 0) R.forEach(x => { if (x !== a) kill(M, x, r); });
      const q = only(col(M, a)); if (q >= 0) R.forEach(x => { if (x !== a) kill(M, q, x); });
    }));
    if (!links) continue;
    R.forEach(s => {                                                                         // carry certain facts between the pages
      const i = only(SI[s]), p = only(SP[s]);
      if (i >= 0) R.forEach(q => { if (!SP[s][q]) kill(IP, i, q); if (!IP[i][q]) kill(SP, s, q); });
      if (p >= 0) R.forEach(j => { if (!SI[s][j]) kill(IP, j, p); if (!IP[j][p]) kill(SI, s, j); });
    });
    R.forEach(i => {
      const p = only(IP[i]);
      if (p >= 0) R.forEach(s => { if (!SI[s][i]) kill(SP, s, p); if (!SP[s][p]) kill(SI, s, i); });
    });
  }
  return d;
}

/* the blank notebook cells that d settles: a cross where the cell is ruled out, a check where its row has one choice left */
export function decided(N: number, notes: Notes, d: Domains): Cell[] {
  const out: Cell[] = [];
  NOTE_KINDS.forEach(kind => { for (let s = 0; s < N; s++) {
    const left = d[kind][s].filter(Boolean).length;
    for (let v = 0; v < N; v++) {
      if (notes[kind][s][v] !== 0) continue;
      if (!d[kind][s][v]) out.push([kind, s, v, false]);
      else if (left === 1) out.push([kind, s, v, true]);
    }
  } });
  return out;
}

/* Decide what the next hint points at, from the player's own marks (✕ = 1, ✓ = 2; auto-crosses are derived, so ignored):
     { type:'fix',    kind, s, v }                          a mark that contradicts the solution
     { type:'done' }                                        every answer is already checked
     { type:'deduce', ks, elim, target }                    clue indices ks (empty = plain elimination) force the blank cell target = [kind,s,v,isCheck]
     { type:'none' }                                        nothing can be deduced yet (clues still locked)
   Hints come from the step-by-step solver above, so the lit clue(s) really lead to the cell by moves a player can make.
   Only if that finds nothing does it fall back to brute force over every arrangement (the cell is still certain, just harder to explain). */
export function planCaseHint(c: Case, notes: Notes, earned: Record<string, boolean>): CaseHint {
  const N = c.N, sol = c.solution;
  const marks: [NoteKind, number, number, boolean][] = [];
  NOTE_KINDS.forEach(kind => notes[kind].forEach((row, s) => row.forEach((st, v) => { if (st === 1 || st === 2) marks.push([kind, s, v, st === 2]); })));
  const wrong = marks.filter(([kind, s, v, on]) => caseCell(sol, kind, s, v) !== on);
  if (wrong.length) { const [kind, s, v] = pick(wrong); return { type: 'fix', kind, s, v }; }
  const answers: [NoteKind, number, number][] = [];
  for (let s = 0; s < N; s++) answers.push(['items', s, sol.item[s]], ['places', s, sol.place[s]], ['itemPlaces', sol.item[s], sol.place[s]]);
  if (answers.every(([kind, s, v]) => notes[kind][s][v] === 2)) return { type: 'done' };

  const d0 = notesToDomains(N, notes);
  const byElimination = decided(N, notes, propagate(c, d0, [])), known = new Set(byElimination.map(([kind, s, v]) => kind + s + v));
  const forced = (ks: number[]) => decided(N, notes, propagate(c, d0, ks)).filter(([kind, s, v]) => !known.has(kind + s + v));
  const visible = c.clues.map((_, k) => k).filter(k => !(c.clues[k].earned && !earned[c.clues[k].earned]));
  const plan = (ks: number[], cells: Cell[], elim?: boolean, link = false): CaseHint => { const crosses = cells.filter(x => !x[3]); return { type: 'deduce', ks, elim: !!elim, link, target: pick(crosses.length ? crosses : cells) }; };
  const pairs = () => visible.flatMap((a, i) => visible.slice(i + 1).map(b => [a, b]));

  // one clue alone, then a clue the player already crossed out, then two together (each group is only built if the one before found nothing)
  const groups = [() => visible.filter(k => !notes.struck[k]).map(k => [k]), () => visible.filter(k => notes.struck[k]).map(k => [k]), pairs];
  for (const group of groups) {
    let best: { ks: number[]; cells: Cell[] } | null = null;
    for (const ks of group()) {
      const cells = forced(ks);
      if (cells.length && (!best || cells.length > best.cells.length || (cells.length === best.cells.length && Math.random() < 0.5))) best = { ks, cells };
    }
    if (best) return plan(best.ks, best.cells);
  }
  if (byElimination.length) {                                                              // prefer a cell one page settles by itself; otherwise say it comes from another page
    const local = decided(N, notes, propagate(c, d0, [], false));
    return local.length ? plan([], local, true) : plan([], byElimination, true, true);
  }
  const together = forced(visible);
  if (together.length) return plan([], together);

  // last resort: every arrangement that fits the marks and all open clues (certain, but not a step a player can name)
  const base = caseAssignments(N).filter(a => marks.every(([kind, s, v, on]) => caseCell(a, kind, s, v) === on) && visible.every(k => caseFits(N, a.item, a.place, c.clues[k].c)));
  if (!base.length) return { type: 'none' };
  const out: Cell[] = [];
  NOTE_KINDS.forEach(kind => { for (let s = 0; s < N; s++) for (let v = 0; v < N; v++) {
    if (notes[kind][s][v] !== 0 || known.has(kind + s + v)) continue;
    const n = base.filter(a => caseCell(a, kind, s, v)).length;
    if (n === 0 || n === base.length) out.push([kind, s, v, n > 0]);
  } });
  return out.length ? plan([], out) : { type: 'none' };
}
/* HINT-ENGINE-END */
