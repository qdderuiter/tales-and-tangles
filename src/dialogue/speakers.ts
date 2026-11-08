import { VoiceClipManifest, VoiceManager } from '../audio/voice.ts';
import type { Bear } from '../characters/barnaby.ts';
import { clamp } from '../core/util.ts';
import type { Choice } from '../data/types.ts';
import { DEFAULT_VOICE } from './babble-rules.ts';
import { stripEmphasis } from './emphasis-rules.ts';
import type { BabbleVoice } from './babble-rules.ts';
import type { Typer } from './typer.ts';

/* a spoken line: an id (voice clip), the text and the face Barnaby pulls */
export interface Reaction { id: string; e: string; t: string }

export const DEFAULT_SPEAKER = 'Barnaby';

/* speakers other than Barnaby: nameClass styles the name tag; portrait = their own face on the story screen (Barnaby's does not react to their lines) */
export const SPEAKERS: Record<string, { nameClass: string; portrait?: string }> = {
  'Evil Larry': { nameClass: 'larry', portrait: 'larry' },
  'Pickle': { nameClass: 'pup', portrait: 'pup' }
};

export const SPEAKER_CLASSES = Object.values(SPEAKERS).map(s => s.nameClass).filter(Boolean);

/* each speaker's babble voice; anyone not listed (Barnaby) uses DEFAULT_VOICE */
const VOICES: Record<string, BabbleVoice> = {
  'Evil Larry': { base: 330, wave: 'square', spread: 12, every: 2, vol: 0.07 },
  'Pickle': { base: 620, wave: 'sine', spread: 18, every: 2, vol: 0.08 },
  'Barnaby Noir': { base: 150, wave: 'sawtooth', spread: 6, every: 3, vol: 0.08 }
};
export const voiceFor = (who: string): BabbleVoice => VOICES[who] || DEFAULT_VOICE;

/* typewriter speed for a line: follow the recorded clip's length when there is one */
export const lineMs = (r: { id: string; t: string }, fallback: number) => { const c = VoiceClipManifest.clips[r.id]; return c && c.durationMs ? clamp(c.durationMs / Math.max(1, stripEmphasis(r.t).length), 12, 90) : fallback; };

/* Barnaby says a line: face, voice clip, typed text */
export function speak(bear: Bear, typer: Typer, r: Reaction, fallback: number) { bear.react(r.e); VoiceManager.play(r.id); typer.start(r.t, { ms: lineMs(r, fallback) }); }

/* register each line (and each choice reply as id_cN) with the voice manifest; returns the lines */
export function registerLines<L extends { id: string; t: string; e: string; choices?: Choice[] }>(lines: L[]): L[] {
  lines.forEach(l => {
    VoiceClipManifest.register(l.id, stripEmphasis(l.t), l.e);
    (l.choices || []).forEach((c, k) => VoiceClipManifest.register(l.id + '_c' + k, stripEmphasis(c.reply.t), c.reply.e));
  });
  return lines;
}
