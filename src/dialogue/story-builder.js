import { VoiceClipManifest } from '../audio/voice.js';
import { pad2 } from '../core/util.js';
import { REACT, STORY_EXTRA, STORY_RAW } from '../data/story.js';
import { DEFAULT_SPEAKER, registerLines } from './speakers.js';

/* Build the story with stable ids and register every line (story + reactions + victory) */
export const STORY = {};

(function buildStory() {
  Object.keys(STORY_RAW).forEach(n => {
    STORY[n] = {};
    Object.assign(STORY_RAW[n], STORY_EXTRA[n]);
    ['intro', 'bridge', 'caseIntro', 'outro'].forEach(part => {
      STORY[n][part] = registerLines(STORY_RAW[n][part].map((line, i) => Object.assign({ id: 'ch' + n + '_' + part + '_' + pad2(i + 1), who: DEFAULT_SPEAKER }, line)));
    });
  });
  (function walk(v) {                                   // every { id, t } anywhere inside REACT is a spoken line
    if (v && typeof v === 'object') { if (v.id && v.t) VoiceClipManifest.register(v.id, v.t, v.e); else Object.values(v).forEach(walk); }
  })(REACT);
})();
