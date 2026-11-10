import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../../src/data/levels.ts';
import { blankLevel, migrate, sanitize } from '../../src/state/migrations.ts';
import type { SaveData } from '../../src/state/migrations.ts';
import { Store } from '../../src/state/store.ts';

/* localStorage is a plain object here: no DOM, no jsdom */
let disk: Record<string, string>;
beforeEach(() => {
  disk = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in disk ? disk[k] : null),
    setItem: (k: string, v: unknown) => { disk[k] = String(v); },
    removeItem: (k: string) => { delete disk[k]; }
  });
  Store.data = null as unknown as SaveData;
});
afterEach(() => { vi.unstubAllGlobals(); });

const put = (key: string, value: unknown) => { disk[key] = typeof value === 'string' ? value : JSON.stringify(value); };
const load = () => { Store.load(); return Store.data; };
const solved = (word: number, zip: number, penalty = 0) => ({ word: { done: true, stars: word, best: 1000 }, zip: { done: true, stars: zip, best: 1000 }, solved: true, penalty });

describe('loading', () => {
  it('empty storage gives the defaults, and no progress', () => {
    expect(load()).toEqual(Store.defaults());
    expect(Store.hasProgress()).toBe(false);
  });

  it('a v1 save is upgraded: word stars and best kept, unlocked kept, trail blank, not solved', () => {
    put(Store.OLD_KEY, {
      unlocked: 3, settings: { sound: false, voice: true, music: true },
      chapters: { 1: { done: true, stars: 3, best: 1200 }, 2: { done: true, stars: 2, best: 900 }, 3: { done: false, stars: 1, best: 400 } }
    });
    const d = load();
    expect(d.unlocked).toBe(3);
    expect(d.settings.sound).toBe(false);
    expect(d.levels[1]).toEqual({ word: { done: true, stars: 3, best: 1200 }, zip: { done: false, stars: 0, best: 0 }, solved: false, penalty: 0 });
    expect(d.levels[2].word).toEqual({ done: true, stars: 2, best: 900 });
    expect(d.levels[3].word).toEqual({ done: false, stars: 0, best: 0 });   // a v1 level that was not finished keeps nothing
    expect(Store.hasProgress()).toBe(true);
  });

  it('a v2 save wins over a leftover v1 save', () => {
    put(Store.OLD_KEY, { unlocked: 9, chapters: {} });
    put(Store.KEY, { unlocked: 2 });
    expect(load().unlocked).toBe(2);
  });

  it('the upgrade does not rewrite the old save', () => {
    put(Store.OLD_KEY, { unlocked: 2, chapters: { 1: { done: true, stars: 1, best: 100 } } });
    const before = disk[Store.OLD_KEY];
    load();
    expect(disk[Store.OLD_KEY]).toBe(before);
  });

  it.each([['broken JSON', '{not json'], ['a JSON string', '"hello"'], ['a number', '42'], ['null', 'null'], ['an array', '[1,2]'], ['an empty object', '{}']])(
    'garbage (%s) loads as the defaults and does not throw', (_name, text) => {
      put(Store.KEY, text);
      expect(load()).toEqual(Store.defaults());
    });

  it('wrong types in every field are dropped', () => {
    put(Store.KEY, {
      unlocked: 'abc', levels: 'x', settings: 5, wardrobe: 'no', daily: 7, perfect: 'x', evil: 3, seen: 'y', badges: [], bonusWords: 'str'
    });
    expect(load()).toEqual(Store.defaults());
  });

  it('level records with the wrong shape become blank levels; numbers are coerced to whole numbers', () => {
    put(Store.KEY, { levels: { 1: null, 2: 'x', 3: { word: { done: 1, stars: '2', best: 12.9 }, zip: 'no', solved: 'yes', penalty: 1.7 } } });
    const d = load();
    expect(d.levels[1]).toEqual(blankLevel());
    expect(d.levels[2]).toEqual(blankLevel());
    expect(d.levels[3].word).toEqual({ done: true, stars: 2, best: 12 });
    expect(d.levels[3].solved).toBe(true);
    expect(d.levels[3].penalty).toBe(1);
  });

  it('a v2 save written before the rename (records under `chapters`) loads into `levels`', () => {
    put(Store.KEY, { unlocked: 2, chapters: { 1: solved(3, 2, 1) } });
    const d = load();
    expect(d.levels[1].solved).toBe(true);
    expect(d.levels[1].penalty).toBe(1);
    expect(d.unlocked).toBe(2);
    expect('chapters' in d).toBe(false);
  });

  it('when a save has both keys, `levels` wins', () => {
    put(Store.KEY, { levels: { 1: solved(3, 3) }, chapters: { 2: solved(1, 1) } });
    const d = load();
    expect(d.levels[1].solved).toBe(true);
    expect(d.levels[2]).toBeUndefined();
  });

  it('seen chapter endings are kept for real chapters only, and only when exactly true', () => {
    put(Store.KEY, { seen: { larry: true, endings: { village: true, dreams: 'yes', nope: true } } });
    const d = load();
    expect(d.seen.larry).toBe(true);
    expect(d.seen.endings).toEqual({ village: true });
  });

  it('the Pickle cinematic flag survives a load, and an older save without it reads as not seen', () => {
    put(Store.KEY, { seen: { larry: true, pup: true } });
    expect(load().seen.pup).toBe(true);
    put(Store.KEY, { seen: { larry: true } });
    expect(load().seen.pup).toBe(false);
  });

  it("Biscuit's cinematic flag survives a load, and an older save without it reads as not seen", () => {
    put(Store.KEY, { seen: { larry: true, pup: true, worm: true } });
    expect(load().seen.worm).toBe(true);
    put(Store.KEY, { seen: { larry: true, pup: true } });
    expect(load().seen.worm).toBe(false);
    expect(load().seen.pup).toBe(true);
  });

  it('a save from before endings existed gets an empty endings record', () => {
    put(Store.KEY, { seen: { larry: true } });
    expect(load().seen.endings).toEqual({});
  });

  it('unlocked is clamped to the number of levels and ignored below 1', () => {
    put(Store.KEY, { unlocked: 999 });
    expect(load().unlocked).toBe(LEVELS.length);
    put(Store.KEY, { unlocked: 0 });
    expect(load().unlocked).toBe(1);
    put(Store.KEY, { unlocked: '3' });
    expect(load().unlocked).toBe(3);
  });

  it('unknown wardrobe ids are dropped, free items kept, Noir items never granted by an old list', () => {
    put(Store.KEY, { wardrobe: { owned: ['party', 'nope', 'fedora', 'party'], equipped: { hat: 'nope', face: 'sunglasses', neck: 'tie' } } });
    const d = load();
    expect(d.wardrobe.owned).toContain('party');
    expect(d.wardrobe.owned).not.toContain('nope');
    expect(d.wardrobe.owned).not.toContain('fedora');
    expect(d.wardrobe.owned.filter(id => id === 'party').length).toBe(1);
    expect(d.wardrobe.equipped.hat).toBe('deerstalker');            // unknown id: the default stays
    expect(d.wardrobe.equipped.face).toBe('none');                  // known item but not owned: back to the default
  });

  it('an item in the wrong slot is not equipped', () => {
    put(Store.KEY, { wardrobe: { owned: ['party', 'bowtie'], equipped: { hat: 'bowtie' } } });
    expect(load().wardrobe.equipped.hat).toBe('deerstalker');
  });

  it('an owned item stays equipped', () => {
    put(Store.KEY, { wardrobe: { owned: ['party'], equipped: { hat: 'party' } } });
    expect(load().wardrobe.equipped.hat).toBe('party');
  });

  it('a Noir item stays equipped only while enough evil levels are cleared', () => {
    put(Store.KEY, { wardrobe: { owned: [], equipped: { hat: 'fedora' } }, evil: { cleared: { word1: true } } });
    expect(load().wardrobe.equipped.hat).toBe('fedora');
    put(Store.KEY, { wardrobe: { owned: [], equipped: { hat: 'fedora' } } });
    expect(load().wardrobe.equipped.hat).toBe('deerstalker');
  });

  it('unknown badge ids and non-string badge dates are dropped', () => {
    put(Store.KEY, { badges: { rookie: '2025-01-01', nope: '2025-01-01', sharp: 5 } });
    expect(load().badges).toEqual({ rookie: '2025-01-01' });
  });

  it('bonus words not in the dictionary are dropped, and duplicates collapse', () => {
    put(Store.KEY, { bonusWords: ['BEE', 'BEE', 'ZZZZZQ', 7, null, 'JAR'] });
    expect(load().bonusWords).toEqual(['BEE', 'JAR']);
  });

  it('settings merge over the defaults instead of replacing them', () => {
    put(Store.KEY, { settings: { music: false } });
    expect(load().settings).toEqual({ sound: true, voice: true, music: false, speech: 1 });
  });

  it('the speech volume is kept within 0..1 and falls back to full for junk', () => {
    put(Store.KEY, { settings: { speech: 0.4 } });
    expect(load().settings.speech).toBe(0.4);
    put(Store.KEY, { settings: { speech: 7 } });
    expect(load().settings.speech).toBe(1);
    put(Store.KEY, { settings: { speech: -2 } });
    expect(load().settings.speech).toBe(0);
    put(Store.KEY, { settings: { speech: 'loud' } });
    expect(load().settings.speech).toBe(1);
  });

  it('daily results, streak, perfect streak, evil clears and the Larry flag are kept', () => {
    put(Store.KEY, {
      daily: { lastDate: '2025-03-10', streak: 4, best: 6, results: { '2025-03-10': { stars: 3, score: 1, secs: 2, squares: 'G' } } },
      perfect: { streak: 2 }, evil: { cleared: { word1: true } }, seen: { larry: true }
    });
    const d = load();
    expect(d.daily).toMatchObject({ lastDate: '2025-03-10', streak: 4, best: 6 });
    expect(d.daily.results['2025-03-10'].stars).toBe(3);
    expect(d.perfect.streak).toBe(2);
    expect(d.evil.cleared).toEqual({ word1: true });
    expect(d.seen.larry).toBe(true);
  });
});

describe('migrate / sanitize on their own', () => {
  it('migrate returns a stored save untouched and never reads the old one', () => {
    const readOld = vi.fn();
    const saved = { unlocked: 4 };
    expect(migrate(saved, readOld)).toBe(saved);
    expect(readOld).not.toHaveBeenCalled();
  });
  it('migrate returns null when there is nothing at all', () => {
    expect(migrate(null, () => null)).toBeNull();
  });
  it('sanitize of nothing is the defaults, unchanged', () => {
    expect(sanitize(null, Store.defaults())).toEqual(Store.defaults());
  });
  it('sanitize alone resets an unowned equipped item to the default', () => {
    const d = sanitize({ wardrobe: { owned: [], equipped: { hat: 'party', face: 'none', neck: 'tie' } } }, Store.defaults());
    expect(d.wardrobe.equipped.hat).toBe('deerstalker');
  });
  it('sanitize alone keeps a Noir item once the evil-clear count meets its unlock', () => {
    const saved = (hat: string) => ({ wardrobe: { owned: [], equipped: { hat } }, evil: { cleared: { word1: true } } });
    expect(sanitize(saved('fedora'), Store.defaults()).wardrobe.equipped.hat).toBe('fedora');
    expect(sanitize({ wardrobe: { owned: [], equipped: { hat: 'fedora' } } }, Store.defaults()).wardrobe.equipped.hat).toBe('deerstalker');
  });
});

describe('the wardrobe', () => {
  beforeEach(() => { load(); });
  const earn = (n: number) => { Store.data.levels[1] = solved(n, n); };    // chapter 1 solved at n stars = n stars to spend

  it('buy: unknown item', () => { expect(Store.buy('nope')).toEqual({ ok: false, reason: 'unknown' }); });
  it('buy: not enough stars', () => { expect(Store.buy('party')).toEqual({ ok: false, reason: 'stars', need: 3 }); });
  it('buy: already owned', () => { expect(Store.buy('deerstalker')).toEqual({ ok: true, already: true }); });
  it('buy: a Noir item is locked until enough evil levels are cleared', () => {
    earn(3);
    expect(Store.buy('fedora')).toEqual({ ok: false, reason: 'unlock', need: 1 });
  });
  it('buy: success spends the stars, saves, and a second buy is "already"', () => {
    earn(3);
    expect(Store.availableStars()).toBe(3);
    expect(Store.buy('party')).toEqual({ ok: true });
    expect(Store.data.wardrobe.owned).toContain('party');
    expect(Store.availableStars()).toBe(0);
    expect(JSON.parse(disk[Store.KEY]).wardrobe.owned).toContain('party');
    expect(Store.buy('party')).toEqual({ ok: true, already: true });
  });
  it('equip refuses an unowned item and accepts an owned one', () => {
    expect(Store.equip('party')).toBe(false);
    expect(Store.equip('nope')).toBe(false);
    expect(Store.data.wardrobe.equipped.hat).toBe('deerstalker');
    earn(3); Store.buy('party');
    expect(Store.equip('party')).toBe(true);
    expect(Store.data.wardrobe.equipped.hat).toBe('party');
  });
  it('a Noir item can be equipped once an evil level is cleared', () => {
    expect(Store.equip('fedora')).toBe(false);
    Store.markEvil('word1');
    expect(Store.equip('fedora')).toBe(true);
  });
  it('evil clears are worth 2 bonus stars each', () => {
    Store.markEvil('word1'); Store.markEvil('zip1');
    expect(Store.evilStars()).toBe(4);
    expect(Store.availableStars()).toBe(4);
  });
});

describe('recording results', () => {
  beforeEach(() => { load(); });

  it('recordPuzzle keeps the best score and the best stars', () => {
    expect(Store.recordPuzzle(1, 'word', { score: 1000, stars: 2 })).toEqual({ isBest: true, prevBest: 0 });
    expect(Store.recordPuzzle(1, 'word', { score: 800, stars: 3 })).toEqual({ isBest: false, prevBest: 1000 });
    expect(Store.level(1).word).toEqual({ done: true, stars: 3, best: 1000 });
    expect(Store.recordPuzzle(1, 'word', { score: 1200, stars: 1 })).toEqual({ isBest: true, prevBest: 1000 });
    expect(Store.level(1).word).toEqual({ done: true, stars: 3, best: 1200 });
  });

  it('recordPuzzle keeps word and zip apart, and saves', () => {
    Store.recordPuzzle(2, 'zip', { score: 500, stars: 1 });
    expect(Store.level(2).zip.done).toBe(true);
    expect(Store.level(2).word.done).toBe(false);
    expect(JSON.parse(disk[Store.KEY]).levels[2].zip.best).toBe(500);
  });

  it('recordSolved keeps the lower penalty and unlocks the next chapter', () => {
    Store.recordSolved(1, 1);
    expect(Store.level(1)).toMatchObject({ solved: true, penalty: 1 });
    expect(Store.data.unlocked).toBe(2);
    Store.recordSolved(1, 0);
    expect(Store.level(1).penalty).toBe(0);
    Store.recordSolved(1, 1);
    expect(Store.level(1).penalty).toBe(0);
  });

  it('recordSolved never unlocks past the last chapter, nor re-locks', () => {
    Store.recordSolved(LEVELS.length, 0);
    expect(Store.data.unlocked).toBe(LEVELS.length);
    Store.data.unlocked = 5;
    Store.recordSolved(1, 0);
    expect(Store.data.unlocked).toBe(5);
  });

  it('stars(n): 0 until solved, then the rounded average of both puzzles minus the penalty, never below 1', () => {
    expect(Store.stars(1)).toBe(0);
    Store.data.levels[1] = solved(3, 3); expect(Store.stars(1)).toBe(3);
    Store.data.levels[1] = solved(3, 2); expect(Store.stars(1)).toBe(3);      // 2.5 rounds up
    Store.data.levels[1] = solved(3, 3, 1); expect(Store.stars(1)).toBe(2);
    Store.data.levels[1] = solved(1, 1, 1); expect(Store.stars(1)).toBe(1);
    Store.data.levels[1] = solved(0, 0, 1); expect(Store.stars(1)).toBe(1);
  });

  it('score(n) adds both best scores, and totalStars sums every chapter', () => {
    Store.data.levels[1] = solved(3, 3); Store.data.levels[2] = solved(1, 1);
    expect(Store.score(1)).toBe(2000);
    expect(Store.totalStars()).toBe(4);
  });

  it('notePerfect counts 3-star results and ignores anything less', () => {
    expect(Store.notePerfect(3)).toBe(1);
    expect(Store.notePerfect(3)).toBe(2);
    expect(Store.notePerfect(2)).toBe(2);
    expect(Store.notePerfect(3)).toBe(3);
    expect(Store.notePerfect(1)).toBe(3);
    expect(Store.notePerfect(0)).toBe(3);
  });

  it('noteBonusWord records a word once', () => {
    Store.noteBonusWord('BEE'); Store.noteBonusWord('BEE'); Store.noteBonusWord('JAR');
    expect(Store.data.bonusWords).toEqual(['BEE', 'JAR']);
  });
});

describe('saving', () => {
  it('save() then load() gives equal data (round trip)', () => {
    load();
    Store.data.levels[1] = solved(3, 2, 1);
    Store.recordPuzzle(2, 'word', { score: 700, stars: 2 });
    Store.data.unlocked = 3;
    Store.data.settings.music = false;
    Store.data.levels[1] = solved(3, 3); Store.buy('party'); Store.equip('party');
    Store.data.daily = { lastDate: '2025-03-10', streak: 2, best: 5, results: { '2025-03-10': { stars: 2, score: 1300, secs: 33, squares: 'GY' } } };
    Store.data.perfect.streak = 2;
    Store.markEvil('word1');
    Store.data.seen.larry = true;
    Store.data.badges.rookie = '2025-03-10';
    Store.noteBonusWord('BEE');
    Store.save();
    const before = JSON.parse(JSON.stringify(Store.data));
    Store.data = null as unknown as SaveData;
    expect(load()).toEqual(before);
  });

  it('save() does not throw when storage is unavailable', () => {
    load();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('quota'); } });
    expect(() => Store.save()).not.toThrow();
  });

  it('reset() goes back to the defaults and saves them', () => {
    load();
    Store.recordSolved(1, 0);
    Store.reset();
    expect(Store.data).toEqual(Store.defaults());
    expect(JSON.parse(disk[Store.KEY])).toEqual(Store.defaults());
    expect(Store.hasProgress()).toBe(false);
  });
});
