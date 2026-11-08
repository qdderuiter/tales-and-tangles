import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../src');

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []));
const rel = f => relative(SRC, f).split(sep).join('/');

/* static imports and re-exports: `import x from './a.js'`, `import './a.js'`, `export { x } from './a.js'` (dynamic import() is not followed) */
const IMPORT = /(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?['"](\.[^'"]+)['"]/g;
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');

const graph = new Map();
for (const f of walk(SRC)) {
  const text = stripComments(readFileSync(f, 'utf8'));
  graph.set(rel(f), [...text.matchAll(IMPORT)].map(m => rel(resolve(dirname(f), m[1]))));
}

describe('module graph', () => {
  it('finds the modules (guards against the scan silently matching nothing)', () => {
    expect(graph.size).toBeGreaterThan(40);
    expect([...graph.values()].flat().length).toBeGreaterThan(100);
  });

  it('every import points at a file that exists', () => {
    const missing = [];
    for (const [file, deps] of graph) for (const d of deps) if (!existsSync(join(SRC, d))) missing.push(`${file} -> ${d}`);
    expect(missing).toEqual([]);
  });

  it('has no import cycles', () => {
    const state = new Map(), stack = [], cycles = [];
    const visit = n => {
      if (state.get(n) === 2) return;
      if (state.get(n) === 1) { cycles.push([...stack.slice(stack.indexOf(n)), n].join(' -> ')); return; }
      state.set(n, 1); stack.push(n);
      for (const d of graph.get(n) || []) visit(d);
      stack.pop(); state.set(n, 2);
    };
    for (const n of graph.keys()) visit(n);
    expect(cycles).toEqual([]);
  });
});

describe('layers', () => {
  const importsOf = pred => [...graph].filter(([f]) => pred(f));

  it('data/ imports only other data/ files, core/, and puzzles/*-rules.js', () => {
    const ok = d => d.startsWith('data/') || d.startsWith('core/') || /^puzzles\/.*-rules\.js$/.test(d);
    const bad = importsOf(f => f.startsWith('data/')).flatMap(([f, deps]) => deps.filter(d => !ok(d)).map(d => `${f} -> ${d}`));
    expect(bad).toEqual([]);
  });

  it('core/ imports only core/', () => {
    const bad = importsOf(f => f.startsWith('core/')).flatMap(([f, deps]) => deps.filter(d => !d.startsWith('core/')).map(d => `${f} -> ${d}`));
    expect(bad).toEqual([]);
  });

  it('*-rules.js and *-generator.js stay pure: nothing from ui/, audio/, characters/ or game/', () => {
    const forbidden = /^(ui|audio|characters|game)\//;
    const files = importsOf(f => /-(rules|generator)\.js$/.test(f));
    expect(files.length).toBeGreaterThanOrEqual(3);
    const bad = files.flatMap(([f, deps]) => deps.filter(d => forbidden.test(d)).map(d => `${f} -> ${d}`));
    expect(bad).toEqual([]);
  });
});
