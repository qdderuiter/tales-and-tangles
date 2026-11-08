import { AudioFX } from '../audio/sfx.ts';
import { $ } from '../core/dom.ts';
import { late } from '../core/util.ts';
import { BADGES } from '../data/badges.ts';
import type { Level } from '../data/types.ts';
import { LEVELS } from '../data/levels.ts';
import { Daily } from '../puzzles/daily.ts';
import { Evil } from '../puzzles/evil.ts';
import { session } from '../state/session.ts';
import { Store } from '../state/store.ts';
import { Badges } from './badges-screen.ts';
import { UI } from './ui.ts';

/* The case-files map. It only draws and reports taps: what a tap DOES is handed in by whoever sets it up (see game/game.js):
     handlers = { chapter(n), step(n, kind), daily(done), intro(lv) }
   chapter: play a chapter from the start    step: replay one step ('word' | 'zip' | 'case') of a solved chapter
   daily: open today's Daily Case (done = today's saved result, if any)    intro: rewatch a chapter's cinematic */
export interface MapHandlers {
  chapter(n: number): void;
  step(n: number, kind: string): void;
  daily(done: ReturnType<typeof Daily.result>): void;
  intro(lv: Level): void;
}

export const MapScreen = {
  handlers: late<MapHandlers>(),

  init(handlers: MapHandlers) { this.handlers = handlers; },

  open() {
    this.render();
    UI.show('map');
    session.justUnlocked = 0;
  },

  render() {
    const h = this.handlers, list = $('#mapList');
    list.innerHTML = '';
    $('#starCount').textContent = '★ ' + Store.totalStars() + '/' + (LEVELS.length * 3);
    const today = Daily.today(), done = Daily.result(today), streak = Daily.streak(today);
    const dc = document.createElement('button');
    dc.className = 'chapter daily' + (done ? ' done' : '');
    dc.innerHTML = '<span class="ch-num">🔥</span><span class="ch-info"><b>Daily Case</b><small>' +
      (done ? 'Solved today &middot; tap to share' : 'A fresh puzzle every day') + (streak ? ' &middot; ' + streak + '-day streak' : '') + '</small></span>' +
      '<span class="ch-stars">' + (done ? UI.starsHTML(done.stars) : '') + '</span>';
    dc.addEventListener('click', () => { AudioFX.unlock(); h.daily(done); });
    list.appendChild(dc);
    const bc = document.createElement('button');
    bc.className = 'chapter badges';
    bc.innerHTML = '<span class="ch-num">🏅</span><span class="ch-info"><b>Detective Badges</b><small>' +
      Badges.count() + '/' + BADGES.length + ' earned &middot; hidden words found: ' + Store.data.bonusWords.length + '</small></span>';
    bc.addEventListener('click', () => { AudioFX.unlock(); Badges.open(); });
    list.appendChild(bc);
    LEVELS.forEach(lv => {
      const ch = Store.chapter(lv.n), locked = lv.n > Store.data.unlocked, fresh = session.justUnlocked === lv.n;
      const wrap = document.createElement('div');
      wrap.className = 'chwrap';
      const b = document.createElement('button');
      b.className = 'chapter' + (locked ? ' locked' : '') + (ch.solved ? ' done' : '') + (fresh ? ' fresh' : '');
      b.style.setProperty('--ca', lv.scene[0]);
      b.disabled = locked;
      b.innerHTML = '<span class="ch-num">' + (locked ? '🔒' : lv.n) + '</span>' +
        '<span class="ch-info"><b>' + lv.title + (Store.data.evil.cleared[Evil.key('word', lv)] || Store.data.evil.cleared[Evil.key('zip', lv)] ? ' 😈' : '') + (fresh ? '<span class="newtag">NEW</span>' : '') + '</b><small>' +
        (locked ? 'Solve the previous case to unlock' : lv.blurb + (ch.solved ? ' &middot; best ' + Store.score(lv.n) : '')) + '</small></span>' +
        '<span class="ch-stars">' + (locked ? '' : UI.starsHTML(Store.stars(lv.n))) + '</span>';
      b.addEventListener('click', () => { AudioFX.unlock(); h.chapter(lv.n); });
      wrap.appendChild(b);
      if (!locked) {
        const pips = document.createElement('div');
        pips.className = 'pips';
        ([['word', 'Words', ch.word.done], ['zip', 'Trail', ch.zip.done], ['case', 'Case', ch.solved]] as [string, string, boolean][]).forEach(([kind, label, done]) => {
          const p = document.createElement('button');
          p.className = 'pip' + (done ? ' done' : '');
          p.textContent = (done ? '✓ ' : '') + label;
          p.disabled = !ch.solved;      // single-puzzle replays unlock once the whole case is solved
          p.addEventListener('click', () => { AudioFX.unlock(); h.step(lv.n, kind); });
          pips.appendChild(p);
        });
        if (lv.introScene && Store.data.seen.larry) {             // rewatch the chapter's cinematic once it has been seen
          const p = document.createElement('button');
          p.className = 'pip';
          p.textContent = '🎬 Larry';
          p.addEventListener('click', () => { AudioFX.unlock(); h.intro(lv); });
          pips.appendChild(p);
        }
        wrap.appendChild(pips);
      }
      list.appendChild(wrap);
    });
    if (LEVELS.every(lv => Store.chapter(lv.n).solved)) {
      const n = document.createElement('div');
      n.className = 'endnote';
      n.textContent = 'Every mystery solved! Replay any puzzle for more stars.';
      list.appendChild(n);
    }
  }
};
