import { BADGES } from '../data/badges.ts';
import type { Slot } from '../data/types.ts';
import { LEVELS } from '../data/levels.ts';
import { OUTFIT_DEFAULT, SLOTS, WARDROBE_BY_ID } from '../data/wardrobe.ts';
import { BONUS_DICT } from '../data/words.ts';

/* The save-file upgrade and clean-up, pure (no localStorage, no Store), so a bad edit here is caught by tests/unit/store.test.js
   instead of silently erasing a player's progress.
     migrate(saved, readOld)   the v2 save as stored, or, when there is none, a v1 save upgraded to the v2 shape (readOld() returns the v1 object or null)
     sanitize(saved, defaults) copy only the valid, still-existing fields of a saved object onto `defaults`, and return it */

export interface PuzzleRecord { done: boolean; stars: number; best: number }
export interface ChapterRecord { word: PuzzleRecord; zip: PuzzleRecord; solved: boolean; penalty: number }
export interface DailyResult { stars: number; score: number; secs: number; squares: string }
export interface Settings { sound: boolean; voice: boolean; music: boolean; autocross?: boolean }

/* the v2 save file, as held in Store.data */
export interface SaveData {
  unlocked: number;
  chapters: Record<string, ChapterRecord>;
  settings: Settings;
  wardrobe: { owned: string[]; equipped: Record<Slot, string> };
  daily: { lastDate: string | null; streak: number; best: number; results: Record<string, DailyResult> };
  perfect: { streak: number };
  evil: { cleared: Record<string, boolean> };
  seen: { larry: boolean };
  badges: Record<string, string>;
  bonusWords: string[];
}

/* untyped JSON from localStorage: every field is checked before it is trusted */
type Json = Record<string, any>;

export const blankChapter = (): ChapterRecord => ({ word: { done: false, stars: 0, best: 0 }, zip: { done: false, stars: 0, best: 0 }, solved: false, penalty: 0 });

/* owned outright, or a Noir item unlocked by enough cleared evil levels */
export const ownsItem = (data: SaveData, id: string): boolean => {
  const it = WARDROBE_BY_ID[id];
  return data.wardrobe.owned.includes(id) || !!(it && it.unlock && Object.keys(data.evil.cleared).length >= it.unlock);
};

export function migrate(saved: Json | null, readOld: () => Json | null): Json | null {
  if (saved) return saved;
  // v1 -> v2: a v1 chapter record was the word puzzle only; keep its stars/score and the unlock progress
  const old = readOld();
  if (!old) return null;
  const upgraded: Json = { unlocked: old.unlocked, settings: old.settings, chapters: {} };
  Object.keys(old.chapters || {}).forEach(n => {
    const o = old.chapters[n], ch = blankChapter();
    if (o && o.done) ch.word = { done: true, stars: o.stars | 0, best: o.best | 0 };
    upgraded.chapters[n] = ch;
  });
  return upgraded;
}

export function sanitize(saved: Json | null, d: SaveData): SaveData {
  if (!saved) return d;
  if (saved.settings && typeof saved.settings === 'object') Object.assign(d.settings, saved.settings);
  if (saved.chapters && typeof saved.chapters === 'object') {
    Object.keys(saved.chapters).forEach(n => {
      const s = saved.chapters[n] || {}, ch = blankChapter();
      (['word', 'zip'] as const).forEach(k => { if (s[k]) ch[k] = { done: !!s[k].done, stars: s[k].stars | 0, best: s[k].best | 0 }; });
      ch.solved = !!s.solved; ch.penalty = s.penalty | 0;
      d.chapters[n] = ch;
    });
  }
  const u = parseInt(saved.unlocked, 10);
  if (u >= 1) d.unlocked = Math.min(u, LEVELS.length);
  const w = saved.wardrobe;
  if (w && Array.isArray(w.owned)) {                       // keep only items that still exist; free items are always owned
    w.owned.forEach((id: string) => { const it = WARDROBE_BY_ID[id]; if (it && !it.unlock && !d.wardrobe.owned.includes(id)) d.wardrobe.owned.push(id); });   // Noir items are unlocked by evil clears, never by an old owned list
    SLOTS.forEach(slot => {
      const id = w.equipped && w.equipped[slot], it = id && WARDROBE_BY_ID[id];
      if (it && it.slot === slot) d.wardrobe.equipped[slot] = id;    // ownership is checked at the end of sanitize
    });
  }
  const dl = saved.daily;
  if (dl && typeof dl === 'object') {
    d.daily.lastDate = typeof dl.lastDate === 'string' ? dl.lastDate : null;
    d.daily.streak = dl.streak | 0; d.daily.best = dl.best | 0;
    if (dl.results && typeof dl.results === 'object') d.daily.results = dl.results;
  }
  if (saved.perfect && typeof saved.perfect === 'object') d.perfect.streak = saved.perfect.streak | 0;
  if (saved.evil && saved.evil.cleared && typeof saved.evil.cleared === 'object') d.evil.cleared = saved.evil.cleared;
  if (saved.seen && typeof saved.seen === 'object') d.seen.larry = !!saved.seen.larry;
  if (saved.badges && typeof saved.badges === 'object') {          // keep only badges that still exist
    BADGES.forEach(b => { if (typeof saved.badges[b.id] === 'string') d.badges[b.id] = saved.badges[b.id]; });
  }
  if (Array.isArray(saved.bonusWords)) d.bonusWords = [...new Set(saved.bonusWords.filter(w => typeof w === 'string' && BONUS_DICT.has(w)))];
  SLOTS.forEach(slot => { if (!ownsItem(d, d.wardrobe.equipped[slot])) d.wardrobe.equipped[slot] = OUTFIT_DEFAULT[slot]; });
  return d;
}
