import { describe, expect, it } from 'vitest';
import { parseEmphasis, stripEmphasis } from '../../src/dialogue/emphasis-rules.ts';

const stressed = (raw: string) => { const r = parseEmphasis(raw); return Array.from(r.plain).filter((_, k) => r.em[k]).join(''); };

describe('parseEmphasis', () => {
  it('leaves plain text alone', () => {
    const r = parseEmphasis('Hello there.');
    expect(r.plain).toBe('Hello there.');
    expect(r.em.every(e => !e)).toBe(true);
  });

  it('strips the markers and flags the stressed characters', () => {
    expect(parseEmphasis('Seven *flawless* finds').plain).toBe('Seven flawless finds');
    expect(stressed('Seven *flawless* finds')).toBe('flawless');
  });

  it('handles several words and phrases', () => {
    expect(stressed('*Wait*, this is *very odd*!')).toBe('Waitvery odd');
  });

  it('keeps em aligned with characters, emoji included', () => {
    const r = parseEmphasis('a 🐻 *b* c');
    expect(r.em).toHaveLength(Array.from(r.plain).length);
    expect(stressed('a 🐻 *🐾* c')).toBe('🐾');
  });

  it('keeps a stray or empty marker as a normal character', () => {
    expect(parseEmphasis('5 * 3').plain).toBe('5 * 3');
    expect(parseEmphasis('a ** b').plain).toBe('a ** b');
    expect(stressed('a ** b')).toBe('');
  });

  it('stripEmphasis returns just the text', () => {
    expect(stripEmphasis('*Seven* flawless finds.')).toBe('Seven flawless finds.');
  });
});
