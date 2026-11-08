import { Haptics } from '../audio/haptics.ts';
import { AudioFX } from '../audio/sfx.ts';
import { $ } from '../core/dom.ts';
import { REDUCED, late } from '../core/util.ts';
import { BADGES } from '../data/badges.ts';
import { CHAPTERS, chapterUnlocked } from '../data/chapters.ts';
import { LEVELS } from '../data/levels.ts';
import type { Chapter } from '../data/types.ts';
import { Daily } from '../puzzles/daily.ts';
import { Stage } from '../scenes/film-art.ts';
import { session } from '../state/session.ts';
import { Store } from '../state/store.ts';
import { Badges } from './badges-screen.ts';
import { ChapterView } from './chapter-view.ts';
import type { ChapterHandlers } from './chapter-view.ts';
import { animateSpring } from './motion.ts';
import { UI } from './ui.ts';

/* The case-files map: a poster card for each chapter. It only draws and reports taps: what a tap DOES is handed in by whoever sets it up (see game/game.ts):
     handlers = { level(n), step(n, kind), intro(lv), ending(chapterId), daily(done) }
   level: play a level from the start    step: replay one step ('word' | 'zip' | 'case') of a solved level
   intro: rewatch a level's cinematic    ending: rewatch a chapter's film    daily: open today's Daily Case (done = today's saved result, if any)
   Tapping a chapter card opens the chapter view (chapter-view.ts), a sheet that grows out of the card and lists its cases.
   Coming back from a level reopens the chapter you were in; coming back from a chapter's ending shows the next card unlocking. */
export interface MapHandlers extends ChapterHandlers {
  daily(done: ReturnType<typeof Daily.result>): void;
}

const RING = 2 * Math.PI * 22;      // circumference of the progress ring (r = 22)

export const MapScreen = {
  handlers: late<MapHandlers>(),

  init(handlers: MapHandlers) {
    this.handlers = handlers;
    ChapterView.init(handlers);
    const head = $('#mapHead');                                                            // the header turns translucent once content scrolls under it
    $('#mapList').addEventListener('scroll', e => head.classList.toggle('stuck', (e.target as HTMLElement).scrollTop > 28), { passive: true });
  },

  open() {
    $('#mapHead').classList.remove('stuck');
    this.render();
    UI.show('map');
    const arriving = session.justUnlockedChapter;
    const back = !arriving && session.openChapter ? CHAPTERS.find(c => c.id === session.openChapter) : undefined;
    if (back) ChapterView.open(back, this.card(back.id), true); else ChapterView.reset();
    session.justUnlocked = 0;
    if (arriving) { session.justUnlockedChapter = ''; this.playUnlock(arriving); }
  },

  card(id: string): HTMLElement | null { return document.querySelector<HTMLElement>('#mapList .chcard-main[data-ch="' + id + '"]'); },

  render() {
    const h = this.handlers, list = $('#mapList');
    list.innerHTML = '';
    list.scrollTop = 0;
    const total = LEVELS.length * 3, today = Daily.today(), done = Daily.result(today), streak = Daily.streak(today);

    const hero = document.createElement('header');
    hero.className = 'map-hero';
    hero.innerHTML = '<h1>Case Files</h1><p id="starCount">&#9733; ' + Store.totalStars() + ' / ' + total + '</p>';
    list.appendChild(hero);

    const chips = document.createElement('div');
    chips.className = 'mapchips';
    chips.innerHTML =
      '<button class="mapchip daily' + (done ? ' done' : '') + '"><span class="ci" aria-hidden="true">🔥</span><span><b>Daily Case</b><small>' +
        (done ? 'Solved today' : 'A fresh puzzle every day') + (streak ? ' &middot; ' + streak + '-day streak' : '') + '</small></span></button>' +
      '<button class="mapchip badges"><span class="ci" aria-hidden="true">🏅</span><span><b>Badges</b><small>' + Badges.count() + '/' + BADGES.length + ' earned</small></span></button>';
    chips.querySelector('.daily')!.addEventListener('click', () => { AudioFX.unlock(); h.daily(done); });
    chips.querySelector('.badges')!.addEventListener('click', () => { AudioFX.unlock(); Badges.open(); });
    list.appendChild(chips);

    CHAPTERS.forEach(ch => list.appendChild(this.chapterCard(ch)));

    if (LEVELS.every(lv => Store.level(lv.n).solved)) {
      const n = document.createElement('div');
      n.className = 'endnote';
      n.textContent = 'Every mystery solved! Replay any puzzle for more stars.';
      list.appendChild(n);
    }
  },

  chapterCard(ch: Chapter): HTMLElement {
    const levels = ch.levels.map(n => LEVELS[n - 1]);
    const solved = levels.filter(lv => Store.level(lv.n).solved).length, stars = levels.reduce((s, lv) => s + Store.stars(lv.n), 0);
    const arriving = session.justUnlockedChapter === ch.id;                                  // drawn locked first, so the unlock can play
    const locked = arriving || !chapterUnlocked(ch, Store.data.unlocked);
    const prev = CHAPTERS[ch.n - 2];
    const card = document.createElement('article');
    card.className = 'chcard' + (locked ? ' locked' : '') + (solved === levels.length ? ' done' : '');
    (['a', 'b', 'ink', 'glow'] as const).forEach(k => card.style.setProperty('--ch-' + k, ch.palette[k]));
    card.innerHTML =
      '<button class="chcard-main" data-ch="' + ch.id + '"' + (locked ? ' aria-disabled="true"' : '') + '>' +
        '<span class="chcard-art" aria-hidden="true"><span class="chcard-lock">🔒</span></span>' +
        '<span class="chcard-body"><span class="chcard-text"><small>Chapter ' + ch.n + '</small><b>' + ch.title + '</b>' +
          '<em>' + (locked && prev ? 'Finish ' + prev.title + ' to unlock' : ch.tagline) + '</em></span>' +
          '<span class="chcard-prog" role="img" aria-label="' + solved + ' of ' + levels.length + ' cases solved, ' + stars + ' stars">' +
            '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="trk" cx="26" cy="26" r="22"/>' +
              (solved ? '<circle class="bar" cx="26" cy="26" r="22" stroke-dasharray="' + (RING * solved / levels.length).toFixed(1) + ' ' + RING.toFixed(1) + '"/>' : '') + '</svg>' +
            '<span aria-hidden="true">' + solved + '/' + levels.length + '</span></span></span></button>';
    card.querySelector('.chcard-art')!.prepend(new Stage(ch.motif, { band: true }).root);
    const main = card.querySelector<HTMLElement>('.chcard-main')!;
    main.addEventListener('click', () => {
      AudioFX.unlock();
      if (card.classList.contains('locked')) { this.nudge(card); UI.toast(prev ? 'Finish ' + prev.title + ' to unlock' : 'Not yet'); return; }
      ChapterView.open(ch, main);
    });
    if (Store.data.seen.endings[ch.id]) {                                                    // rewatch the chapter's film once it has been seen
      const film = document.createElement('button');
      film.className = 'chcard-film';
      film.setAttribute('aria-label', 'Watch the ending of ' + ch.title);
      film.innerHTML = '<span aria-hidden="true">🎬</span> Ending';
      film.addEventListener('click', () => { AudioFX.unlock(); this.handlers.ending(ch.id); });
      card.appendChild(film);
    }
    return card;
  },

  /* a locked card was tapped: a small sideways shake, so the tap is acknowledged and the reason is on screen */
  nudge(card: HTMLElement) {
    if (REDUCED) return;
    card.classList.remove('nudge'); void card.offsetWidth; card.classList.add('nudge');
  },

  /* the next chapter has just opened: the lock lifts, a shine crosses the art, the card springs up, and the chime lands on that same frame */
  playUnlock(id: string) {
    const main = this.card(id), card = main?.closest<HTMLElement>('.chcard');
    if (!main || !card) return;
    card.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    setTimeout(() => {
      card.classList.remove('locked'); card.classList.add('unlocking');
      main.removeAttribute('aria-disabled');
      const nowOpen = CHAPTERS.find(c => c.id === id);
      const em = card.querySelector('.chcard-text em'); if (em && nowOpen) em.textContent = nowOpen.tagline;
      AudioFX.chime(7, 0, 0.14); AudioFX.chime(11, 0.1, 0.12); Haptics.win();
      if (!REDUCED) animateSpring(0.94, 1, { damping: 0.75, response: 0.5 }, x => { card.style.transform = x === 1 ? '' : 'scale(' + x + ')'; });
    }, REDUCED ? 0 : 750);
  }
};
