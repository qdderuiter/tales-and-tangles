import { describe, expect, it } from 'vitest';
import { DEFAULT_VOICE, babbleNote } from '../../src/dialogue/babble-rules.ts';
import type { BabbleVoice } from '../../src/dialogue/babble-rules.ts';

describe('babbleNote', () => {
  it('is silent for spaces, punctuation and digits', () => {
    for (const ch of [' ', '.', ',', '!', '?', "'", '1']) expect(babbleNote(ch, DEFAULT_VOICE, 0.5)).toBeNull();
  });

  it('gives the same note for the same letter and wobble, whatever the case', () => {
    expect(babbleNote('B', DEFAULT_VOICE, 0.3)).toEqual(babbleNote('b', DEFAULT_VOICE, 0.3));
  });

  it('makes vowels longer than consonants', () => {
    const a = babbleNote('a', DEFAULT_VOICE, 0.5), t = babbleNote('t', DEFAULT_VOICE, 0.5);
    expect(a && t && a.dur > t.dur).toBe(true);
  });

  it('keeps every letter within the voice range, wobble included', () => {
    const top = DEFAULT_VOICE.base * Math.pow(2, (DEFAULT_VOICE.spread + 2.5) / 12);
    for (const ch of 'abcdefghijklmnopqrstuvwxyzéü') {
      for (const r of [0, 0.5, 1]) {
        const n = babbleNote(ch, DEFAULT_VOICE, r);
        expect(n).not.toBeNull();
        expect(n && n.hz).toBeGreaterThanOrEqual(DEFAULT_VOICE.base * Math.pow(2, -0.5 / 12) - 1e-9);
        expect(n && n.hz).toBeLessThanOrEqual(top);
      }
    }
  });

  it('stressed letters sound higher, longer and louder', () => {
    const plain = babbleNote('o', DEFAULT_VOICE, 0.5), loud = babbleNote('o', DEFAULT_VOICE, 0.5, true);
    expect(plain && loud && loud.hz > plain.hz && loud.dur > plain.dur && loud.vol > plain.vol).toBe(true);
  });

  it('a higher voice babbles higher', () => {
    const high: BabbleVoice = { ...DEFAULT_VOICE, base: DEFAULT_VOICE.base * 2 };
    const lo = babbleNote('m', DEFAULT_VOICE, 0.5), hi = babbleNote('m', high, 0.5);
    expect(lo && hi && hi.hz > lo.hz).toBe(true);
  });
});
