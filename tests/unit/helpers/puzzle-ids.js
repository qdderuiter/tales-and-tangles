import { readFileSync } from 'node:fs';

/* The puzzle kinds the game registers. word-puzzle.js and zip-puzzle.js touch `window` at load, so they can't be imported in Node
   (and a DOM library would only hide that). Read the ids from their source text instead: each file ends with registerPuzzle('<id>', ...). */
const FILES = ['../../../src/puzzles/word/word-puzzle.js', '../../../src/puzzles/zip/zip-puzzle.js'];

export function registeredPuzzleIds() {
  return FILES.flatMap(f => [...readFileSync(new URL(f, import.meta.url), 'utf8').matchAll(/registerPuzzle\(\s*'([\w-]+)'/g)].map(m => m[1]));
}
