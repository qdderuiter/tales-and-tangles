import type { PuzzleResult } from '../core/types.ts';
import type { Level, TempLevel } from '../data/types.ts';

/* The puzzle kinds a chapter can use. Each puzzle module registers itself at the bottom of its file:
     registerPuzzle('word', { obj, screen, board, tileSel, title, evil })
   obj      the engine: load(level, { freeHints, onWin }), start(), stop(), and a freeHints count
   screen   name of the screen it plays on (UI.show)
   board    selector of the board element, and tileSel its tiles (the Barnaby Noir cutscene shatters them)
   title    heading on the victory card
   evil     (level) => the harder Barnaby Noir version of that level
   What comes after a puzzle is NOT decided here: a chapter's `steps` list does that (see game/chapter-steps.ts). */
export interface LoadOpts { freeHints?: number; onWin?: (result: PuzzleResult) => void }
export interface PuzzleEngine { load(lvl: Level | TempLevel, opts?: LoadOpts): void; start(): void; stop(): void; freeHints: number }
export interface PuzzleDef {
  obj: PuzzleEngine; screen: string; board: string; tileSel: string; title: string;
  evil(base: Level | TempLevel): Level | TempLevel;
}

export const PUZZLE_KINDS: Record<string, PuzzleDef> = {};

export function registerPuzzle(kind: string, def: PuzzleDef) { PUZZLE_KINDS[kind] = def; }
