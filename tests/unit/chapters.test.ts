import { describe, expect, it } from 'vitest';
import { CHAPTERS, FILM_LAYERS, caseLabel, chapterOf, chapterUnlocked, isChapterEnd } from '../../src/data/chapters.ts';
import { SCORES } from '../../src/audio/film-score.ts';
import { LEVELS } from '../../src/data/levels.ts';

const CUES = ['swell', 'sparkle', 'chime', 'whoosh', 'bell', 'finale'];

describe('chapters group the levels', () => {
  it('cover every level exactly once, in order', () => {
    const all = CHAPTERS.flatMap(c => c.levels);
    expect(all).toEqual(LEVELS.map(lv => lv.n));
  });

  it('are numbered 1..N and have unique ids', () => {
    expect(CHAPTERS.map(c => c.n)).toEqual(CHAPTERS.map((_, i) => i + 1));
    expect(new Set(CHAPTERS.map(c => c.id)).size).toBe(CHAPTERS.length);
  });

  it('each hold consecutive levels', () => {
    CHAPTERS.forEach(c => c.levels.forEach((n, i) => { if (i) expect(n, c.id).toBe(c.levels[i - 1] + 1); }));
  });

  it.each(CHAPTERS.map(c => [c.id, c] as const))('%s has a title, a tagline and a palette', (_id, c) => {
    expect(c.title.length).toBeGreaterThan(0);
    expect(c.tagline.length).toBeGreaterThan(0);
    (['a', 'b', 'ink', 'glow'] as const).forEach(k => expect(c.palette[k], k).toMatch(/^#[0-9a-f]{6}$/i));
  });
});

describe('chapter endings (the films)', () => {
  it.each(CHAPTERS.map(c => [c.id, c] as const))('%s is a well-formed script', (_id, c) => {
    const layers = FILM_LAYERS[c.motif], e = c.ending;
    expect(layers, 'a known motif').toBeDefined();
    expect(e.beats.length).toBeGreaterThanOrEqual(3);
    expect(e.reducedCaption.length).toBeGreaterThan(0);
    e.start.forEach(id => expect(layers, 'start layer ' + id).toContain(id));
    e.beats.forEach((b, i) => {
      [...(b.show || []), ...(b.hide || [])].forEach(id => expect(layers, 'beat ' + i + ' layer ' + id).toContain(id));
      if (b.cue) expect(CUES, 'beat ' + i + ' cue').toContain(b.cue);
      if (b.flash !== undefined) { expect(b.flash).toBeGreaterThan(0); expect(b.flash).toBeLessThanOrEqual(1); }
      expect(b.hold, 'beat ' + i + ' hold').toBeGreaterThan(0);
    });
  });

  it('every chapter has a synthesized score under its id', () => {
    CHAPTERS.forEach(c => {
      const sc = SCORES[c.id];
      expect(sc, c.id).toBeDefined();
      expect(sc.chords.length, c.id).toBeGreaterThanOrEqual(2);
      expect(sc.melody.every(bar => bar.length === 8), c.id + ' melody bars are 8 slots').toBe(true);
    });
  });

  it('a film runs a sensible length (10 to 30 seconds)', () => {
    CHAPTERS.forEach(c => {
      const ms = c.ending.beats.reduce((s, b) => s + b.hold, 0);
      expect(ms, c.id).toBeGreaterThanOrEqual(10000);
      expect(ms, c.id).toBeLessThanOrEqual(30000);
    });
  });
});

describe('chapter helpers', () => {
  it('chapterOf and isChapterEnd', () => {
    expect(chapterOf(1)?.id).toBe('village');
    expect(chapterOf(5)?.id).toBe('dreams');
    expect(chapterOf(99)).toBeUndefined();
    expect(LEVELS.filter(lv => isChapterEnd(lv.n)).map(lv => lv.n)).toEqual(CHAPTERS.map(c => c.levels[c.levels.length - 1]));
  });

  it('a chapter unlocks with its first level', () => {
    expect(chapterUnlocked(CHAPTERS[0], 1)).toBe(true);
    expect(chapterUnlocked(CHAPTERS[1], 3)).toBe(false);
    expect(chapterUnlocked(CHAPTERS[1], 4)).toBe(true);
  });

  it('caseLabel numbers a level inside its chapter', () => {
    expect(caseLabel(1)).toBe('Case 1.1');
    expect(caseLabel(3)).toBe('Case 1.3');
    expect(caseLabel(4)).toBe('Case 2.1');
    expect(caseLabel(10)).toBe('Case 4.3');
  });
});
