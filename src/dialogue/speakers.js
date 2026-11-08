import { VoiceClipManifest, VoiceManager } from '../audio/voice.js';
import { clamp } from '../core/util.js';

export const DEFAULT_SPEAKER = 'Barnaby';

/* speakers other than Barnaby: nameClass styles the name tag, ownPortrait = Barnaby's face does not react to their lines */
export const SPEAKERS = { 'Evil Larry': { nameClass: 'larry', ownPortrait: true } };

export const SPEAKER_CLASSES = Object.values(SPEAKERS).map(s => s.nameClass).filter(Boolean);

/* typewriter speed for a line: follow the recorded clip's length when there is one */
export const lineMs = (r, fallback) => { const c = VoiceClipManifest.clips[r.id]; return c && c.durationMs ? clamp(c.durationMs / Math.max(1, r.t.length), 12, 90) : fallback; };

/* Barnaby says a line: face, voice clip, typed text */
export function speak(bear, typer, r, fallback) { bear.react(r.e); VoiceManager.play(r.id); typer.start(r.t, { ms: lineMs(r, fallback) }); }

/* register each line (and each choice reply as id_cN) with the voice manifest; returns the lines */
export function registerLines(lines) {
  lines.forEach(l => {
    VoiceClipManifest.register(l.id, l.t, l.e);
    (l.choices || []).forEach((c, k) => VoiceClipManifest.register(l.id + '_c' + k, c.reply.t, c.reply.e));
  });
  return lines;
}
