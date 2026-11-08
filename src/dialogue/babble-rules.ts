/* Babble: the little made-up "speech" beeps that play while a line types out. Pure rules, no audio or DOM. */
export type BabbleWave = 'sine' | 'triangle' | 'square' | 'sawtooth';

/* base: lowest pitch in Hz. spread: semitones between the 'a' and 'z' beeps. every: one beep per this many letters. vol: loudness (0..1). */
export interface BabbleVoice { base: number; wave: BabbleWave; spread: number; every: number; vol: number }
export interface BabbleNote { hz: number; dur: number; vol: number }

export const DEFAULT_VOICE: BabbleVoice = { base: 250, wave: 'triangle', spread: 9, every: 2, vol: 0.22 };

const VOWELS = 'aeiouy';
export const STRESS_SEMITONES = 3;                  // stressed (*emphasised*) letters sound this much higher, longer and louder

/* the beep for one typed character, or null when it makes no sound (space, punctuation).
   The letter picks the pitch, so the same word always babbles the same tune; rand (0..1) only adds a little wobble. */
export function babbleNote(ch: string, voice: BabbleVoice, rand: number, stressed = false): BabbleNote | null {
  if (!/\p{L}/u.test(ch)) return null;
  const lower = ch.toLowerCase();
  const code = lower.codePointAt(0) ?? 97;
  const idx = code >= 97 && code <= 122 ? code - 97 : code % 26;       // 0..25
  const vowel = VOWELS.includes(lower);
  const semis = (idx / 25) * voice.spread + (vowel ? 2 : 0) + (stressed ? STRESS_SEMITONES : 0) + (rand - 0.5);
  return { hz: voice.base * Math.pow(2, semis / 12), dur: (vowel ? 0.11 : 0.07) * (stressed ? 1.4 : 1), vol: voice.vol * (vowel ? 1 : 0.7) * (stressed ? 1.3 : 1) };
}
