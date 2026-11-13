import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels.ts';
import { EPILOGUE } from '../../src/data/ending.ts';
import { STORY_EXTRA, STORY_RAW } from '../../src/data/story.ts';
import type { RawLine } from '../../src/data/types.ts';
import { DEFAULT_STEPS } from '../../src/game/level-steps.ts';

/* The story parts a chapter needs follow from its steps: the story steps `intro`, `bridge` and `outro` each play their own part,
   and the notebook (`case`) opens with `caseIntro`. (story-builder.ts merges STORY_EXTRA into STORY_RAW.) */
const needed = (steps: string[]): string[] => [...steps.filter(id => ['intro', 'bridge', 'outro'].includes(id)), ...(steps.includes('case') ? ['caseIntro'] : [])];

describe.each(LEVELS.map(lv => [lv.n, lv]))('story of chapter %i', (_n, lv) => {
  const story: Record<string, RawLine[]> = { ...STORY_RAW[lv.n], ...STORY_EXTRA[lv.n] };

  it('has every part its steps play, each a non-empty list of lines with text and an emotion', () => {
    for (const part of needed(lv.steps || DEFAULT_STEPS)) {
      expect(Array.isArray(story[part]), `${part} exists`).toBe(true);
      expect(story[part].length, `${part} has lines`).toBeGreaterThan(0);
      for (const line of story[part]) {
        expect(typeof line.t, `${part} line text`).toBe('string');
        expect(line.t.length).toBeGreaterThan(0);
        expect(typeof line.e, `${part} line emotion`).toBe('string');
      }
    }
  });
});

describe('the epilogue closes the game', () => {
  it('lives in data/ending.ts, and no level carries it in its own outro (story-builder adds it to the last level)', () => {
    expect(EPILOGUE.length).toBeGreaterThan(0);
    EPILOGUE.forEach(l => { expect(l.t.length).toBeGreaterThan(0); expect(l.e.length).toBeGreaterThan(0); });
    const spoken = new Set(EPILOGUE.map(l => l.t));
    LEVELS.forEach(lv => STORY_RAW[lv.n].outro.forEach(l => expect(spoken.has(l.t), 'level ' + lv.n).toBe(false)));
  });
});

describe('outro reveals match each case', () => {
  it.each(LEVELS.map(lv => [lv.n, lv] as const))('level %i outro names the real culprit, and nobody else', (_n, lv) => {
    const c = lv.case, text = STORY_RAW[lv.n].outro[0].t;
    c.suspects.forEach((name, i) => { if (i !== c.culprit) expect(text, 'names ' + name).not.toContain(name); });
    if (lv.n >= 14) {
      expect(text).toContain(c.suspects[c.culprit]);
      expect(text).toContain(c.places[c.crimePlace].name);
    }
  });
});
