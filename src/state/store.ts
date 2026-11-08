import { LEVELS } from '../data/levels.ts';
import { OUTFIT_DEFAULT, WARDROBE, WARDROBE_BY_ID } from '../data/wardrobe.ts';
import { blankLevel, migrate, ownsItem, sanitize } from './migrations.ts';
import type { Json, SaveData } from './migrations.ts';
import type { PuzzleResult } from '../core/types.ts';

export const Store = {
  KEY: 'tales_tangles_v2',
  OLD_KEY: 'tales_tangles_v1',
  data: null as unknown as SaveData,       // set by load() at boot, before anything reads it
  defaults(): SaveData {
    return {
      unlocked: 1, levels: {}, settings: { sound: true, voice: true, music: true, speech: 1 },
      wardrobe: { owned: WARDROBE.filter(i => i.cost === 0 && !i.unlock).map(i => i.id), equipped: Object.assign({}, OUTFIT_DEFAULT) },
      daily: { lastDate: null, streak: 0, best: 0, results: {} },
      perfect: { streak: 0 }, evil: { cleared: {} }, seen: { larry: false, pup: false, endings: {} },
      badges: {}, bonusWords: []
    };
  },
  read(key: string): Json | null { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; } },
  load() {
    this.data = sanitize(migrate(this.read(this.KEY), () => this.read(this.OLD_KEY)), this.defaults());
  },
  /* ---- stars as currency for the wardrobe: earned (cases + dailies) minus the price of everything owned ---- */
  dailyStars() { return Object.keys(this.data.daily.results).reduce((s, k) => s + (this.data.daily.results[k].stars | 0), 0); },
  spentStars() { return this.data.wardrobe.owned.reduce((s: number, id) => { const it = WARDROBE_BY_ID[id]; return s + (it ? it.cost : 0); }, 0); },
  availableStars() { return Math.max(0, this.totalStars() + this.dailyStars() + this.evilStars() - this.spentStars()); },
  owns(id: string) { return ownsItem(this.data, id); },
  evilCount() { return Object.keys(this.data.evil.cleared).length; },
  evilStars() { return this.evilCount() * 2; },                 // each cleared Noir level is worth 2 bonus stars
  markEvil(key: string) { this.data.evil.cleared[key] = true; this.save(); },
  noteBonusWord(w: string) { if (!this.data.bonusWords.includes(w)) { this.data.bonusWords.push(w); this.save(); } },
  /* every EVIL_STREAK-th perfect (3-star) puzzle result summons Barnaby Noir (puzzles/evil.ts); lesser results don't count but don't reset either */
  notePerfect(stars: number) { if (stars === 3) this.data.perfect.streak += 1; this.save(); return this.data.perfect.streak; },
  buy(id: string): { ok: boolean; reason?: string; need?: number; already?: boolean } {
    const it = WARDROBE_BY_ID[id];
    if (!it) return { ok: false, reason: 'unknown' };
    if (this.owns(id)) return { ok: true, already: true };
    if (it.unlock) return { ok: false, reason: 'unlock', need: it.unlock - this.evilCount() };
    const have = this.availableStars();
    if (have < it.cost) return { ok: false, reason: 'stars', need: it.cost - have };
    this.data.wardrobe.owned.push(id); this.save();
    return { ok: true };
  },
  equip(id: string) {
    const it = WARDROBE_BY_ID[id];
    if (!it || !this.owns(id)) return false;
    this.data.wardrobe.equipped[it.slot] = id; this.save();
    return true;
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch { /* private mode: play on without saving */ } },
  level(n: number) { return this.data.levels[n] || blankLevel(); },
  /* kind: 'word' | 'zip' */
  recordPuzzle(n: number, kind: 'word' | 'zip', result: Pick<PuzzleResult, 'score' | 'stars'>) {
    const ch = this.level(n), prev = ch[kind];
    const isBest = result.score > prev.best;
    ch[kind] = { done: true, stars: Math.max(prev.stars, result.stars), best: Math.max(prev.best, result.score) };
    this.data.levels[n] = ch;
    this.save();
    return { isBest, prevBest: prev.best };
  },
  recordSolved(n: number, penalty: number) {                    // penalty 0/1: a star lost to wrong accusations / hints; a later cleaner solve can improve it
    const ch = this.level(n);
    ch.penalty = ch.solved ? Math.min(ch.penalty | 0, penalty | 0) : (penalty | 0);
    ch.solved = true;
    this.data.levels[n] = ch;
    this.data.unlocked = Math.max(this.data.unlocked, Math.min(n + 1, LEVELS.length));
    this.save();
  },
  stars(n: number) { const ch = this.level(n); return ch.solved ? Math.max(1, Math.round((ch.word.stars + ch.zip.stars) / 2) - (ch.penalty | 0)) : 0; },
  score(n: number) { const ch = this.level(n); return ch.word.best + ch.zip.best; },
  totalStars() { return LEVELS.reduce((s, lv) => s + this.stars(lv.n), 0); },
  hasProgress() { return Object.keys(this.data.levels).length > 0; },
  reset() { this.data = this.defaults(); this.save(); }
};
