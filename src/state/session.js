import { LEVELS } from '../data/levels.js';

/* Where the player is right now. Not saved (see Store for that): it resets on every page load.
     screen         the visible screen name ('title', 'map', 'puzzle', ...), set by UI.show
     run            the chapter or daily being played, or null:
                    { n, replay, freeHints, earned, notes, steps, step }  for a chapter (see game/chapter-flow.js)
                    { n: 0, replay: true, daily, date, moodChapter }       for the Daily Case
                    run.evil is true while Barnaby Noir's remix is on
     justUnlocked   chapter number to flag as NEW on the map, or 0 */
export const session = { screen: 'title', run: null, justUnlocked: 0 };

/* the level object of the current run (a chapter from LEVELS, or the generated Daily level) */
export const currentLevel = () => session.run.daily || LEVELS[session.run.n - 1];
