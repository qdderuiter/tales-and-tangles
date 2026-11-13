import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_STEPS, STEPS, stepLabel } from '../../src/game/level-steps.ts';
import { LEVELS } from '../../src/data/levels.ts';
import { PUZZLE_KINDS, registerPuzzle } from '../../src/puzzles/registry.ts';
import type { PuzzleDef } from '../../src/puzzles/registry.ts';
import { registeredPuzzleIds } from './helpers/puzzle-ids.ts';

describe('registerPuzzle', () => {
  afterEach(() => { delete PUZZLE_KINDS.test_kind; });

  it('adds a kind, and registering the same kind again replaces it', () => {
    registerPuzzle('test_kind', { title: 'one' } as PuzzleDef);
    expect(PUZZLE_KINDS.test_kind.title).toBe('one');
    registerPuzzle('test_kind', { title: 'two' } as PuzzleDef);
    expect(PUZZLE_KINDS.test_kind.title).toBe('two');
  });
});

describe('chapter steps', () => {
  const puzzleIds = registeredPuzzleIds();   // see helpers/puzzle-ids.ts for why this reads the source text

  it('the game registers the word, zip and sketch puzzles', () => {
    expect(puzzleIds.sort()).toEqual(['sketch', 'word', 'zip']);
  });

  it('puzzle ids and story-step ids never clash', () => {
    for (const id of puzzleIds) expect(STEPS[id], id).toBeUndefined();
  });

  it('the default order only uses known steps', () => {
    for (const id of DEFAULT_STEPS) expect(STEPS[id] || puzzleIds.includes(id), id).toBeTruthy();
  });

  it.each(LEVELS.map(lv => [lv.n, lv]))('chapter %i only uses known steps, and has at least one puzzle and the notebook', (_n, lv) => {
    const steps = lv.steps || DEFAULT_STEPS;
    for (const id of steps) expect(STEPS[id] || puzzleIds.includes(id), `unknown step "${id}"`).toBeTruthy();
    expect(steps.some(id => puzzleIds.includes(id))).toBe(true);
    expect(steps).toContain('case');
    expect(new Set(steps).size).toBe(steps.length);
  });

  it('the Sketch Artist is a step of Chapter 10 only, after the Scent Trail and before the notebook', () => {
    const withSketch = LEVELS.filter(lv => (lv.steps || DEFAULT_STEPS).includes('sketch')).map(lv => lv.n);
    expect(withSketch).toEqual([26, 27, 28, 29]);
    for (const lv of LEVELS.filter(l => withSketch.includes(l.n))) {
      const steps = lv.steps!;
      expect(steps.indexOf('sketch')).toBe(steps.indexOf('zip') + 1);
      expect(steps.indexOf('case')).toBe(steps.indexOf('sketch') + 1);
    }
  });

  it('every step has a button label (falls back to Continue)', () => {
    expect(stepLabel('word')).toBe('Continue');
    expect(stepLabel('sketch')).toBe('Draw the sketch');
    for (const id of Object.keys(STEPS)) expect(stepLabel(id)).toBeTruthy();
  });
});
