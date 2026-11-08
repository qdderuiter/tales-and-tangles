import { LEVELS } from '../data/levels.ts';
import type { Level, TempLevel } from '../data/types.ts';
import type { Notes } from '../puzzles/case/case-logic.ts';

/* Where the player is right now. Not saved (see Store for that): it resets on every page load.
     screen         the visible screen name ('title', 'map', 'puzzle', ...), set by UI.show
     run            the level or daily being played, or null:
                    { n, replay, freeHints, earned, notes, steps, step }  for a level (see game/level-flow.ts)
                    { n: 0, replay: true, daily, date, moodLevel }       for the Daily Case
                    run.evil is true while Barnaby Noir's remix is on
     justUnlocked   level number to flag as NEW on the map, or 0
     justUnlockedChapter  id of a chapter whose card plays its unlock animation when the map opens, or ''
     openChapter    id of the chapter view the player is in (the map reopens it after a level), or '' */

export interface LevelRun {
  n: number; replay: boolean; freeHints: number;
  earned: Record<string, boolean>; notes: Notes | null; steps: string[]; step: number;
  evil?: boolean; daily?: undefined; moodLevel?: undefined;
}
export interface DailyRun {
  n: 0; replay: true; freeHints: number; daily?: TempLevel; date?: string; moodLevel: number;
  evil?: boolean;
}
export type Run = LevelRun | DailyRun;

export const session: { screen: string; run: Run | null; justUnlocked: number; justUnlockedChapter: string; openChapter: string } =
  { screen: 'title', run: null, justUnlocked: 0, justUnlockedChapter: '', openChapter: '' };

/* the level run in progress (the level flow only calls this while one is) */
export const levelRun = (): LevelRun => session.run as LevelRun;

/* the level object of the current run (a level from LEVELS, or the generated Daily level) */
export const currentLevel = (): Level | TempLevel => session.run!.daily || LEVELS[session.run!.n - 1];
