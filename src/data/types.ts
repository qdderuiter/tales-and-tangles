import type { Cell, PuzzleResult } from '../core/types.ts';

/* ---- Words ---- */
export interface WordEntry { w: string; p: Cell[]; gold: boolean }

/* ---- Scent Trail ---- */
export interface RawZip { size: number; word: string; path: string; cps: [number, string][]; walls: string }
export interface Checkpoint { idx: number; num: number; letter: string; r: number; c: number }
export interface ParsedZip { size: number; word: string; path: Cell[]; cps: Checkpoint[]; walls: Set<string> }

/* ---- Cases (the notebook) ---- */
export type ClueConstraint = [kind: string, ...args: number[]];
export interface Clue { t: string; c: ClueConstraint; earned: 'word' | 'zip' | null; key?: string }
export interface NamedEmoji { name: string; emoji: string }
export interface CaseAssignment { item: number[]; place: number[] }
export interface Case {
  n: number; N: number;
  suspects: string[]; items: NamedEmoji[]; places: NamedEmoji[];
  crimePlace: number; crime: string;
  clues: Clue[];
  solution: CaseAssignment;
  culprit: number; culpritItem: number;
}

/* ---- Story ---- */
export interface Reply { e: string; t: string }
export interface Choice { label: string; gift?: boolean; evil?: boolean; reply: Reply }
export interface RawLine { e: string; t: string; choices?: Choice[]; who?: string }
export interface Line extends RawLine { id: string; who: string }
export type Story = Record<number, Record<StoryPart, Line[]>>
export type StoryPart = 'intro' | 'bridge' | 'caseIntro' | 'outro';

/* ---- Levels ---- */
export interface Level {
  n: number; title: string; blurb: string; theme: string; scene: [string, string];
  words: WordEntry[];
  steps?: string[];
  introScene?: () => Promise<void>;
  caughtScene?: () => Promise<void>;
  zip: ParsedZip; evilZip: ParsedZip;
  case: Case;
  hint: string; trailHint: string;
  evil?: boolean;
}

/* a generated level (the Daily Case, or a Barnaby Noir remix): a Level without the Scent Trail and the case */
export interface TempLevel {
  n: number; title: string; blurb?: string; theme: string; hint: string; scene: [string, string];
  words: WordEntry[];
  daily?: boolean; date?: string; evil?: boolean;
}

/* ---- Badges ----
   test() gets just the slice of the save and of the Store it reads, as structural types, so data/ imports no state code. */
export interface BadgeSave { daily: { best: number; results: Record<string, unknown> }; bonusWords: string[] }
export interface BadgeStore {
  chapter(n: number): { solved: boolean };
  stars(n: number): number;
  evilCount(): number;
  owns(id: string): boolean;
}
export interface BadgeEvent { type: 'puzzle'; kind: string; result: PuzzleResult }
export interface Badge { id: string; icon: string; name: string; desc: string; test: (d: BadgeSave, ev: BadgeEvent | undefined, S: BadgeStore) => boolean }

/* ---- Wardrobe ---- */
export type Slot = 'hat' | 'face' | 'neck';
export interface WardrobeItem { id: string; slot: Slot; name: string; cost: number; svg: string; unlock?: number }
