import { LEVELS } from '../data/levels.ts';
import type { Level, TempLevel } from '../data/types.ts';
import type { Notes } from '../puzzles/case/case-logic.ts';

/* Where the player is right now. Not saved (see Store for that): it resets on every page load.
     screen         the visible screen name ('title', 'map', 'puzzle', ...), set by UI.show
     run            the chapter or daily being played, or null:
                    { n, replay, freeHints, earned, notes, steps, step }  for a chapter (see game/chapter-flow.ts)
                    { n: 0, replay: true, daily, date, moodChapter }       for the Daily Case
                    run.evil is true while Barnaby Noir's remix is on
     justUnlocked   chapter number to flag as NEW on the map, or 0 */

export interface ChapterRun {
  n: number; replay: boolean; freeHints: number;
  earned: Record<string, boolean>; notes: Notes | null; steps: string[]; step: number;
  evil?: boolean; daily?: undefined; moodChapter?: undefined;
}
export interface DailyRun {
  n: 0; replay: true; freeHints: number; daily?: TempLevel; date?: string; moodChapter: number;
  evil?: boolean;
}
export type Run = ChapterRun | DailyRun;

export const session: { screen: string; run: Run | null; justUnlocked: number } = { screen: 'title', run: null, justUnlocked: 0 };

/* the chapter run in progress (chapter flow only calls this while one is) */
export const chapterRun = (): ChapterRun => session.run as ChapterRun;

/* the level object of the current run (a chapter from LEVELS, or the generated Daily level) */
export const currentLevel = (): Level | TempLevel => session.run!.daily || LEVELS[session.run!.n - 1];
