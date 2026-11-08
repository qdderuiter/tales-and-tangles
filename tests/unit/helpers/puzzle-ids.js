import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* The puzzle kinds the game registers. The *-puzzle.js files touch `window` at load, so they can't be imported in Node
   (and a DOM library would only hide that). Read the ids from their source text instead: each file ends with registerPuzzle('<id>', ...).
   The files are found by name, so a new puzzle kind is picked up without editing this list. */
const PUZZLES = fileURLToPath(new URL('../../../src/puzzles/', import.meta.url));

export function registeredPuzzleIds() {
  return readdirSync(PUZZLES, { recursive: true })
    .map(String)
    .filter(f => /-puzzle\.js$/.test(f))
    .flatMap(f => [...readFileSync(PUZZLES + f, 'utf8').matchAll(/registerPuzzle\(\s*'([\w-]+)'/g)].map(m => m[1]));
}
