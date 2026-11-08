import { describe, expect, it } from 'vitest';
import { Scoring } from '../../src/puzzles/scoring.js';

const run = (o) => Scoring.compute({ elapsedMs: 0, wrongs: 0, hints: 0, ...o });

describe('Scoring.compute', () => {
  it('a perfect instant run scores 1000 + 300 time bonus + 100', () => {
    expect(run({}).score).toBe(1400);
  });

  it('the time bonus drops 2 points a second and stops at zero after 150s', () => {
    expect(run({ elapsedMs: 10_000 }).score).toBe(1380);
    expect(run({ elapsedMs: 150_000 }).score).toBe(1100);
    expect(run({ elapsedMs: 600_000 }).score).toBe(1100);
  });

  it('seconds are rounded and reported', () => {
    expect(run({ elapsedMs: 1_499 }).secs).toBe(1);
    expect(run({ elapsedMs: 1_500 }).secs).toBe(2);
  });

  it('wrong swipes cost 50 and hints cost 150; the bonus is added', () => {
    expect(run({ wrongs: 2 }).score).toBe(1300);
    expect(run({ hints: 1 }).score).toBe(1250);
    expect(run({ bonus: 75 }).score).toBe(1475);
  });

  it('never drops below 100', () => {
    expect(run({ wrongs: 100, hints: 10 }).score).toBe(100);
  });

  describe('stars', () => {
    it('3: no hints and at most 2 wrongs', () => {
      expect(run({ wrongs: 2 }).stars).toBe(3);
      expect(run({ wrongs: 3 }).stars).toBe(2);
      expect(run({ hints: 1 }).stars).toBe(2);
    });

    it('2: at most one hint, or at most 5 wrongs', () => {
      expect(run({ hints: 1, wrongs: 9 }).stars).toBe(2);
      expect(run({ hints: 4, wrongs: 5 }).stars).toBe(2);
    });

    it('1: otherwise', () => {
      expect(run({ hints: 2, wrongs: 6 }).stars).toBe(1);
    });

    it('thresholds can be overridden per puzzle', () => {
      expect(run({ wrongs: 4, wrongs3: 4 }).stars).toBe(3);
      expect(run({ hints: 2, wrongs: 8, wrongs2: 8 }).stars).toBe(2);
      expect(run({ wrongs: 0, wrongs3: 0 }).stars).toBe(3);
      expect(run({ wrongs: 1, wrongs3: 0 }).stars).toBe(2);
    });
  });
});
