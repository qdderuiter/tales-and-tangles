/* Authoring aid for Sketch Artist pictures: prints each picture, its clues, and whether line logic alone solves it.
     node scripts/check-sketch.mjs                      every picture in src/data/sketches.ts
     node scripts/check-sketch.mjs "#..|.##|#.#"        one ad-hoc picture (rows separated by |) */
import { SKETCHES } from '../src/data/sketches.ts';
import { parseSketch, solveByLines } from '../src/puzzles/sketch/sketch-rules.ts';

const report = (label, raw) => {
  const s = parseSketch(raw), res = solveByLines(s.rowClues, s.colClues);
  console.log('\n' + label + ' (' + s.size + 'x' + s.size + ')  ' + (res.solved ? 'line-solvable in ' + res.passes + ' passes' : 'NOT line-solvable'));
  s.solution.forEach((row, r) => console.log('  ' + row.map(v => (v ? '#' : '.')).join('') + '   ' + (s.rowClues[r].join(' ') || '0')));
  console.log('  cols: ' + s.colClues.map(c => c.join('.') || '0').join('  '));
  if (!res.solved) {
    console.log('  what line logic reaches (? = stuck):');
    res.grid.forEach(row => console.log('  ' + row.map(v => (v === 1 ? '#' : v === 0 ? '.' : '?')).join('')));
  }
};

const adhoc = process.argv[2];
if (adhoc) report('ad hoc', { name: 'ad hoc', witness: '', color: '#000', rows: adhoc.split('|') });
else Object.entries(SKETCHES).forEach(([n, raw]) => report('Level ' + n + ': ' + raw.name, raw));
