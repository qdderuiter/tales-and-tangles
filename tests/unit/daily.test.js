import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Daily } from '../../src/puzzles/daily.js';
import { formatDate, generateDaily, shiftDate } from '../../src/puzzles/daily-generator.js';
import { Store } from '../../src/state/store.js';
import { buildGrid, isSolved } from '../../src/puzzles/word/word-rules.js';
import { allFound } from './helpers/word-level.js';

describe('dates', () => {
  it('formatDate pads month and day', () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe('2024-01-05');
    expect(formatDate(new Date(2024, 11, 25))).toBe('2024-12-25');
  });
  it('shiftDate crosses month and year ends, including leap years', () => {
    expect(shiftDate('2024-01-31', 1)).toBe('2024-02-01');
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftDate('2023-02-28', 1)).toBe('2023-03-01');
    expect(shiftDate('2023-12-31', 1)).toBe('2024-01-01');
    expect(shiftDate('2024-01-01', -1)).toBe('2023-12-31');
    expect(shiftDate('2024-03-01', -1)).toBe('2024-02-29');
    expect(shiftDate('2024-05-10', 0)).toBe('2024-05-10');
  });
});

describe('generateDaily', () => {
  const dates = ['2024-01-01', '2024-02-29', '2025-07-04', '2026-11-08'];

  it('is deterministic', () => {
    for (const d of dates) expect(generateDaily(d)).toEqual(generateDaily(d));
  });
  it('different dates give different puzzles', () => {
    const keys = dates.map(d => JSON.stringify(generateDaily(d).words));
    expect(new Set(keys).size).toBe(dates.length);
  });
  it('always tiles the grid, with words 3-5 letters long, no repeats and one gold word', () => {
    for (let day = 1; day <= 40; day++) {
      const lv = generateDaily(shiftDate('2025-01-01', day));
      expect(isSolved(lv, allFound(lv), buildGrid(lv)), lv.date).toBe(true);
      for (const w of lv.words) {
        expect(w.w.length).toBeGreaterThanOrEqual(3);
        expect(w.w.length).toBeLessThanOrEqual(5);
        expect(w.p.length).toBe(w.w.length);
      }
      expect(new Set(lv.words.map(w => w.w)).size).toBe(lv.words.length);
      expect(lv.words.filter(w => w.gold).length).toBe(1);
      expect(lv.theme).toBe(lv.words.find(w => w.gold).w);
    }
  });
});

describe('Daily streak and record (stubbed Store)', () => {
  beforeEach(() => {
    Store.data = { daily: { lastDate: null, streak: 0, best: 0, results: {} } };
    Store.save = vi.fn();
  });
  const result = { stars: 3, score: 1400, secs: 40, squares: 'GGY' };

  it('a first ever completion starts a streak of 1 and saves', () => {
    const r = Daily.record('2025-03-10', result);
    expect(r).toMatchObject({ first: true, streak: 1 });
    expect(Store.data.daily).toMatchObject({ lastDate: '2025-03-10', streak: 1, best: 1 });
    expect(Store.save).toHaveBeenCalledTimes(1);
  });
  it('the next day extends the streak, across a month end', () => {
    Daily.record('2025-01-31', result);
    expect(Daily.record('2025-02-01', result).streak).toBe(2);
    expect(Store.data.daily.best).toBe(2);
  });
  it('skipping a day restarts at 1 but keeps the best', () => {
    Daily.record('2025-03-10', result);
    Daily.record('2025-03-11', result);
    expect(Daily.record('2025-03-14', result).streak).toBe(1);
    expect(Store.data.daily.best).toBe(2);
  });
  it('replaying a finished date is practice: nothing changes', () => {
    Daily.record('2025-03-10', result);
    const again = Daily.record('2025-03-10', { ...result, stars: 1 });
    expect(again.first).toBe(false);
    expect(Store.data.daily.results['2025-03-10'].stars).toBe(3);
    expect(Store.save).toHaveBeenCalledTimes(1);
  });
  it('streak(today) counts if you played today or yesterday, else is 0', () => {
    Daily.record('2025-03-10', result);
    Daily.record('2025-03-11', result);
    expect(Daily.streak('2025-03-11')).toBe(2);
    expect(Daily.streak('2025-03-12')).toBe(2);
    expect(Daily.streak('2025-03-13')).toBe(0);
  });
  it('shareText shows stars, time and squares, and is empty before a result exists', () => {
    expect(Daily.shareText('2025-03-10')).toBe('');
    Daily.record('2025-03-10', result);
    expect(Daily.shareText('2025-03-10')).toBe('Tales & Tangles Daily 2025-03-10\n★★★ 0:40\n🟩🟩🟨');
  });
});
