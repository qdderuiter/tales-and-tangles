import { LEVELS } from '../data/levels.ts';
import { OUTFIT_DEFAULT, WARDROBE, WARDROBE_BY_ID } from '../data/wardrobe.ts';
import { blankChapter, migrate, ownsItem, sanitize } from './migrations.ts';

export const Store = {
  KEY: 'tales_tangles_v2',
  OLD_KEY: 'tales_tangles_v1',
  data: null,
  defaults() {
    return {
      unlocked: 1, chapters: {}, settings: { sound: true, voice: true, music: true },
      wardrobe: { owned: WARDROBE.filter(i => i.cost === 0 && !i.unlock).map(i => i.id), equipped: Object.assign({}, OUTFIT_DEFAULT) },
      daily: { lastDate: null, streak: 0, best: 0, results: {} },
      perfect: { streak: 0 }, evil: { cleared: {} }, seen: { larry: false },
      badges: {}, bonusWords: []
    };
  },
  read(key) { try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : null; } catch { return null; } },
  load() {
    this.data = sanitize(migrate(this.read(this.KEY), () => this.read(this.OLD_KEY)), this.defaults());
  },
  /* ---- stars as currency for the wardrobe: earned (cases + dailies) minus the price of everything owned ---- */
  dailyStars() { return Object.keys(this.data.daily.results).reduce((s, k) => s + (this.data.daily.results[k].stars | 0), 0); },
  spentStars() { return this.data.wardrobe.owned.reduce((s, id) => { const it = WARDROBE_BY_ID[id]; return s + (it ? it.cost : 0); }, 0); },
  availableStars() { return Math.max(0, this.totalStars() + this.dailyStars() + this.evilStars() - this.spentStars()); },
  owns(id) { return ownsItem(this.data, id); },
  evilCount() { return Object.keys(this.data.evil.cleared).length; },
  evilStars() { return this.evilCount() * 2; },                 // each cleared Noir level is worth 2 bonus stars
  markEvil(key) { this.data.evil.cleared[key] = true; this.save(); },
  noteBonusWord(w) { if (!this.data.bonusWords.includes(w)) { this.data.bonusWords.push(w); this.save(); } },
  /* three perfect (3-star) puzzle results in a row summon Barnaby Noir; anything less resets the count */
  notePerfect(stars) { this.data.perfect.streak = stars === 3 ? this.data.perfect.streak + 1 : 0; this.save(); return this.data.perfect.streak; },
  buy(id) {
    const it = WARDROBE_BY_ID[id];
    if (!it) return { ok: false, reason: 'unknown' };
    if (this.owns(id)) return { ok: true, already: true };
    if (it.unlock) return { ok: false, reason: 'unlock', need: it.unlock - this.evilCount() };
    const have = this.availableStars();
    if (have < it.cost) return { ok: false, reason: 'stars', need: it.cost - have };
    this.data.wardrobe.owned.push(id); this.save();
    return { ok: true };
  },
  equip(id) {
    const it = WARDROBE_BY_ID[id];
    if (!it || !this.owns(id)) return false;
    this.data.wardrobe.equipped[it.slot] = id; this.save();
    return true;
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch { /* private mode: play on without saving */ } },
  chapter(n) { return this.data.chapters[n] || blankChapter(); },
  /* kind: 'word' | 'zip' */
  recordPuzzle(n, kind, result) {
    const ch = this.chapter(n), prev = ch[kind];
    const isBest = result.score > prev.best;
    ch[kind] = { done: true, stars: Math.max(prev.stars, result.stars), best: Math.max(prev.best, result.score) };
    this.data.chapters[n] = ch;
    this.save();
    return { isBest, prevBest: prev.best };
  },
  recordSolved(n, penalty) {                    // penalty 0/1: a star lost to wrong accusations / hints; a later cleaner solve can improve it
    const ch = this.chapter(n);
    ch.penalty = ch.solved ? Math.min(ch.penalty | 0, penalty | 0) : (penalty | 0);
    ch.solved = true;
    this.data.chapters[n] = ch;
    this.data.unlocked = Math.max(this.data.unlocked, Math.min(n + 1, LEVELS.length));
    this.save();
  },
  stars(n) { const ch = this.chapter(n); return ch.solved ? Math.max(1, Math.round((ch.word.stars + ch.zip.stars) / 2) - (ch.penalty | 0)) : 0; },
  score(n) { const ch = this.chapter(n); return ch.word.best + ch.zip.best; },
  totalStars() { return LEVELS.reduce((s, lv) => s + this.stars(lv.n), 0); },
  hasProgress() { return Object.keys(this.data.chapters).length > 0; },
  reset() { this.data = this.defaults(); this.save(); }
};
