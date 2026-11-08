import { BADGES } from '../data/badges.js';
import { LEVELS } from '../data/levels.js';
import { OUTFIT_DEFAULT, SLOTS, WARDROBE, WARDROBE_BY_ID } from '../data/wardrobe.js';
import { BONUS_DICT } from '../data/words.js';

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
  blankChapter() { return { word: { done: false, stars: 0, best: 0 }, zip: { done: false, stars: 0, best: 0 }, solved: false, penalty: 0 }; },
  read(key) { try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } },
  load() {
    let saved = this.read(this.KEY);
    const d = this.defaults();
    if (!saved) {
      // v1 -> v2: a v1 chapter record was the word puzzle only; keep its stars/score and the unlock progress
      const old = this.read(this.OLD_KEY);
      if (old) {
        saved = { unlocked: old.unlocked, settings: old.settings, chapters: {} };
        Object.keys(old.chapters || {}).forEach(n => {
          const o = old.chapters[n], ch = this.blankChapter();
          if (o && o.done) ch.word = { done: true, stars: o.stars | 0, best: o.best | 0 };
          saved.chapters[n] = ch;
        });
      }
    }
    if (saved) {
      if (saved.settings && typeof saved.settings === 'object') Object.assign(d.settings, saved.settings);
      if (saved.chapters && typeof saved.chapters === 'object') {
        Object.keys(saved.chapters).forEach(n => {
          const s = saved.chapters[n] || {}, ch = this.blankChapter();
          ['word', 'zip'].forEach(k => { if (s[k]) ch[k] = { done: !!s[k].done, stars: s[k].stars | 0, best: s[k].best | 0 }; });
          ch.solved = !!s.solved; ch.penalty = s.penalty | 0;
          d.chapters[n] = ch;
        });
      }
      const u = parseInt(saved.unlocked, 10);
      if (u >= 1) d.unlocked = Math.min(u, LEVELS.length);
      const w = saved.wardrobe;
      if (w && Array.isArray(w.owned)) {                       // keep only items that still exist; free items are always owned
        w.owned.forEach(id => { const it = WARDROBE_BY_ID[id]; if (it && !it.unlock && !d.wardrobe.owned.includes(id)) d.wardrobe.owned.push(id); });   // Noir items are unlocked by evil clears, never by an old owned list
        SLOTS.forEach(slot => {
          const id = w.equipped && w.equipped[slot], it = id && WARDROBE_BY_ID[id];
          if (it && it.slot === slot) d.wardrobe.equipped[slot] = id;    // ownership is checked once below, after this.data is set
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
    }
    this.data = d;
    SLOTS.forEach(slot => { if (!this.owns(d.wardrobe.equipped[slot])) d.wardrobe.equipped[slot] = OUTFIT_DEFAULT[slot]; });
  },
  /* ---- stars as currency for the wardrobe: earned (cases + dailies) minus the price of everything owned ---- */
  dailyStars() { return Object.keys(this.data.daily.results).reduce((s, k) => s + (this.data.daily.results[k].stars | 0), 0); },
  spentStars() { return this.data.wardrobe.owned.reduce((s, id) => { const it = WARDROBE_BY_ID[id]; return s + (it ? it.cost : 0); }, 0); },
  availableStars() { return Math.max(0, this.totalStars() + this.dailyStars() + this.evilStars() - this.spentStars()); },
  owns(id) { const it = WARDROBE_BY_ID[id]; return this.data.wardrobe.owned.includes(id) || !!(it && it.unlock && this.evilCount() >= it.unlock); },
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
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* private mode: play on without saving */ } },
  chapter(n) { return this.data.chapters[n] || this.blankChapter(); },
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
