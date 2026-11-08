import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels.ts';
import type { ParsedZip } from '../../src/data/types.ts';
import { isSolvedTrail, zipAdjacent, zipCode, zipSolution } from '../../src/puzzles/zip/zip-rules.ts';

const trails = LEVELS.flatMap((lv): [string, ParsedZip][] => [[`zip of chapter ${lv.n}`, lv.zip], [`evilZip of chapter ${lv.n}`, lv.evilZip]]);

describe.each(trails)('%s', (_name, z) => {
  const sol = zipSolution(z);

  it('the stored solution passes', () => {
    expect(sol.length).toBe(z.size * z.size);
    expect(isSolvedTrail(z, sol)).toBe(true);
  });

  it('a reversed trail is rejected', () => {
    expect(isSolvedTrail(z, sol.slice().reverse())).toBe(false);
  });

  it('a trail with a repeated cell is rejected', () => {
    const dup = sol.slice(); dup[dup.length - 1] = dup[0];
    expect(isSolvedTrail(z, dup)).toBe(false);
  });

  it('a trail that crosses a wall is rejected', () => {
    const a = sol[3], b = sol[4], crossed = new Set(z.walls);
    crossed.add(Math.min(a, b) + '-' + Math.max(a, b));
    expect(isSolvedTrail({ ...z, walls: crossed }, sol)).toBe(false);
  });

  it('a trail with a jump is rejected', () => {
    const jump = sol.slice(); [jump[1], jump[2]] = [jump[2], jump[1]];
    expect(zipAdjacent(z.size, jump[0], jump[1]) && zipAdjacent(z.size, jump[1], jump[2]) && zipAdjacent(z.size, jump[2], jump[3])).toBe(false);
    expect(isSolvedTrail(z, jump)).toBe(false);
  });

  it('checkpoints are numbered 1..K in path order, from the first cell to the last', () => {
    expect(z.cps.map(cp => cp.num)).toEqual(z.cps.map((_, k) => k + 1));
    expect(z.cps.map(cp => cp.idx)).toEqual(z.cps.map(cp => cp.idx).sort((a, b) => a - b));
    expect(z.cps[0].idx).toBe(0);
    expect(z.cps[z.cps.length - 1].idx).toBe(z.size * z.size - 1);
    for (const cp of z.cps) expect(zipCode(z.size, cp.r, cp.c)).toBe(sol[cp.idx]);
  });

  it('the checkpoint letters spell the clue word', () => {
    expect(z.cps.map(cp => cp.letter).join('')).toBe(z.word);
  });
});

it('each evil trail uses the same clue word as the normal one (trail hints are keyed by it)', () => {
  for (const lv of LEVELS) expect(lv.evilZip.word, `chapter ${lv.n}`).toBe(lv.zip.word);
});
