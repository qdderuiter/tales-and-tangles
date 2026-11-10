import { VoiceClipManifest } from '../audio/voice.ts';
import { pad2 } from '../core/util.ts';
import { EPILOGUE } from '../data/ending.ts';
import { LEVELS } from '../data/levels.ts';
import { REACT, STORY_EXTRA, STORY_RAW } from '../data/story.ts';
import type { Story, StoryPart } from '../data/types.ts';
import { DEFAULT_SPEAKER, registerLines } from './speakers.ts';

/* Build the story with stable ids and register every line (story + reactions + victory) */
export const STORY: Story = {};

const PARTS: StoryPart[] = ['intro', 'bridge', 'caseIntro', 'outro'];

(function buildStory() {
  Object.keys(STORY_RAW).map(Number).forEach(n => {
    const raw = { ...STORY_RAW[n], ...STORY_EXTRA[n] };
    STORY[n] = {} as Story[number];
    PARTS.forEach(part => {
      // the 'ch' prefix is historical (a level used to be called a chapter) and stays: voice clips attach to these ids by file name
      STORY[n][part] = registerLines(raw[part].map((line, i) => ({ id: 'ch' + n + '_' + part + '_' + pad2(i + 1), who: DEFAULT_SPEAKER, ...line })));
    });
  });
  // the epilogue closes the game: it follows the outro of whichever level is last, so adding levels never means moving it
  const last = LEVELS[LEVELS.length - 1].n;
  STORY[last].outro.push(...registerLines(EPILOGUE.map((line, i) => ({ id: 'epilogue_' + pad2(i + 1), who: DEFAULT_SPEAKER, ...line }))));
  (function walk(v: unknown) {                          // every { id, t } anywhere inside REACT is a spoken line
    if (v && typeof v === 'object') {
      const line = v as { id?: string; t?: string; e?: string };
      if (line.id && line.t) VoiceClipManifest.register(line.id, line.t, line.e); else Object.values(v).forEach(walk);
    }
  })(REACT);
})();
