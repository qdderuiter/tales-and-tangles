import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/data/levels.ts';
import { STORY_EXTRA, STORY_RAW } from '../../src/data/story.ts';
import { DEFAULT_STEPS } from '../../src/game/chapter-steps.ts';

/* The story parts a chapter needs follow from its steps: the story steps `intro`, `bridge` and `outro` each play their own part,
   and the notebook (`case`) opens with `caseIntro`. (story-builder.js merges STORY_EXTRA into STORY_RAW.) */
const needed = steps => [...steps.filter(id => ['intro', 'bridge', 'outro'].includes(id)), ...(steps.includes('case') ? ['caseIntro'] : [])];

describe.each(LEVELS.map(lv => [lv.n, lv]))('story of chapter %i', (_n, lv) => {
  const story = { ...STORY_RAW[lv.n], ...STORY_EXTRA[lv.n] };

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
