/* The puzzle kinds a chapter can use. Each puzzle module registers itself at the bottom of its file:
     registerPuzzle('word', { obj, screen, board, tileSel, title, evil })
   obj      the engine: load(level, { freeHints, onWin }), start(), stop(), and a freeHints count
   screen   name of the screen it plays on (UI.show)
   board    selector of the board element, and tileSel its tiles (the Barnaby Noir cutscene shatters them)
   title    heading on the victory card
   evil     (level) => the harder Barnaby Noir version of that level
   What comes after a puzzle is NOT decided here: a chapter's `steps` list does that (see game/chapter-steps.js). */
export const PUZZLE_KINDS = {};

export function registerPuzzle(kind, def) { PUZZLE_KINDS[kind] = def; }
