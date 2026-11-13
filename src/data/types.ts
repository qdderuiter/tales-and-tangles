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
export type SceneId = 'larry' | 'pup' | 'worm' | 'elephant' | 'dino' | 'crash' | 'tiger' | 'dig';
export interface Level {
  n: number; title: string; blurb: string; theme: string; scene: [string, string];
  words: WordEntry[];
  steps?: string[];
  introScene?: () => Promise<void>;
  caughtScene?: () => Promise<void>;
  sceneId?: SceneId;                         // whose cinematic this level carries (the chapter view offers a rewatch once it has been seen)
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

/* ---- Chapters ----
   A chapter groups several levels ("cases") under one theme and ends with a short film (scenes/chapter-film.ts plays it).
   The film is data: a list of beats. Each beat can move the camera, show / hide stage layers (named in FILM_LAYERS), set a caption,
   fire an audio cue and flash the screen, then holds. The chapter's id is also the key of its synthesized score (audio/film-score.ts). */
export type Motif = 'meadow' | 'night' | 'sea' | 'lantern' | 'space' | 'desert' | 'bigtop' | 'meteor' | 'underground' | 'island';
export type FilmCue = 'swell' | 'sparkle' | 'chime' | 'whoosh' | 'bell' | 'finale';
export interface FilmBeat {
  caption?: string;
  cam?: { x: number; y?: number; scale?: number; ms: number };     // x / y in % of the stage; layers pan by their own depth
  show?: string[]; hide?: string[];
  cue?: FilmCue; flash?: number;                                     // flash: peak opacity 0..1
  hold: number;                                                      // ms the beat lasts
}
export interface FilmScript { start: string[]; beats: FilmBeat[]; reducedCaption: string }
export interface Chapter {
  id: string; n: number; title: string; tagline: string;
  levels: number[];                                                  // level numbers, in play order
  palette: { a: string; b: string; ink: string; glow: string };
  motif: Motif; ending: FilmScript;
  track?: string;                                                    // the background music of this chapter's levels (a key of TRACKS in audio/music.ts); the shared case track when absent
}

/* ---- Badges ----
   test() gets just the slice of the save and of the Store it reads, as structural types, so data/ imports no state code. */
export interface BadgeSave { daily: { best: number; results: Record<string, unknown> }; bonusWords: string[] }
export interface BadgeStore {
  level(n: number): { solved: boolean };
  stars(n: number): number;
  evilCount(): number;
  owns(id: string): boolean;
}
export interface BadgeEvent { type: 'puzzle'; kind: string; result: PuzzleResult }
export interface Badge { id: string; icon: string; name: string; desc: string; test: (d: BadgeSave, ev: BadgeEvent | undefined, S: BadgeStore) => boolean }

/* ---- Wardrobe ---- */
export type Slot = 'hat' | 'face' | 'neck';
export interface WardrobeItem { id: string; slot: Slot; name: string; cost: number; svg: string; unlock?: number }
