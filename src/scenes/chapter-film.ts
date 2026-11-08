import { FilmScore } from '../audio/film-score.ts';
import { Haptics } from '../audio/haptics.ts';
import { $ } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, late } from '../core/util.ts';
import { CHAPTERS, endingLayers } from '../data/chapters.ts';
import type { Chapter } from '../data/types.ts';
import { Store } from '../state/store.ts';
import { Film } from './film.ts';
import { Stage } from './film-art.ts';

const CREDITS = ['Tales & Tangles', 'Barnaby, detective bear', 'Evil Larry, thief of lanterns', 'Pickle, space pup', 'Thank you for playing'];

/* ---------- the film that ends a chapter ----------
   Plays the chapter's `ending` script (data/chapters.ts) on a layered stage (film-art.ts) with its own score (audio/film-score.ts):
   for each beat the picture, the caption and the sound change on the same tick, then it holds. It finishes on a title card with the
   stars earned in the chapter and a teaser for the next one (the last chapter gets "The End" and credits). Skippable; reduced motion
   gets the finished scene, one caption and the card. */
export const ChapterFilm = {
  film: late<Film>(), art: late<HTMLElement>(), els: {} as Record<string, HTMLElement>, stage: null as Stage | null,

  init() {
    const e = this.els;
    ['chapterFilm', 'cfCap', 'cfFlash', 'cfSkip', 'cfCard', 'cfKicker', 'cfTitle', 'cfStars', 'cfNext', 'cfCredits'].forEach(id => { e[id] = $('#' + id); });
    this.art = $('#cfArt');
    this.film = new Film({ root: e.chapterFilm, skip: e.cfSkip, cap: e.cfCap, flash: e.cfFlash });
  },

  /* swap the caption with a short fade out and in; returns the ms it spent */
  async say(text: string): Promise<number> {
    const f = this.film, e = this.els.cfCap;
    if (f.fast || !e.classList.contains('on')) { f.caption(text); return 0; }
    f.caption(''); await f.wait(240); f.caption(text);
    return 240;
  },

  fillCard(ch: Chapter) {
    const e = this.els, last = ch.n === CHAPTERS.length, next = CHAPTERS[ch.n];
    const total = ch.levels.length * 3, earned = ch.levels.reduce((s, n) => s + Store.stars(n), 0);
    e.cfKicker.textContent = last ? 'The End' : 'Chapter ' + ch.n + ' complete';
    e.cfTitle.textContent = ch.title;
    e.cfStars.textContent = '★ ' + earned + ' / ' + total;
    e.cfNext.textContent = next ? 'Next: Chapter ' + next.n + ' · ' + next.title : '';
    e.cfCredits.innerHTML = last ? CREDITS.map(c => '<span>' + c + '</span>').join('') : '';
  },

  async play(id: string): Promise<void> {
    const ch = CHAPTERS.find(c => c.id === id), f = this.film;
    if (!ch || f.running) return;
    const e = this.els, first = !Store.data.seen.endings[ch.id], last = ch.n === CHAPTERS.length;

    this.art.textContent = '';
    const stage = this.stage = new Stage(ch.motif);
    this.art.appendChild(stage.root);
    (['a', 'b', 'ink', 'glow'] as const).forEach(k => e.chapterFilm.style.setProperty('--ch-' + k, ch.palette[k]));
    e.cfCard.classList.remove('on'); e.cfCredits.classList.remove('on');
    e.cfCredits.querySelectorAll('span').forEach(s => s.classList.remove('on'));
    f.caption('');
    this.fillCard(ch);
    e.chapterFilm.classList.toggle('calm', REDUCED);

    f.open(first);
    FilmScore.start(ch.id);

    if (REDUCED) {
      stage.show(endingLayers(ch));
      f.caption(ch.ending.reducedCaption);
      await f.wait(2800);
    } else {
      stage.show(ch.ending.start);
      for (const b of ch.ending.beats) {
        const spent = b.caption !== undefined ? await this.say(b.caption) : 0;
        // the picture, the sound and the flash all change on this one tick
        if (b.show) stage.show(b.show);
        if (b.hide) stage.hide(b.hide);
        if (b.cam) stage.camera(b.cam, f.fast ? 0 : b.cam.ms, f);
        if (b.cue) { const cue = b.cue; f.snd(() => FilmScore.cue(cue)); }
        if (b.flash) f.flashScreen(b.flash, 1100, 0.4);
        await f.wait(Math.max(0, b.hold - spent));
      }
    }

    // the title card
    f.caption('');
    e.cfCard.classList.add('on');
    f.snd(() => { FilmScore.cue('chime'); Haptics.win(); });
    await f.wait(3200);
    if (last) {
      e.cfCard.classList.add('credits');
      for (const s of Array.from(e.cfCredits.querySelectorAll('span'))) { s.classList.add('on'); await f.wait(1300); }
      await f.wait(1200);
    }

    FilmScore.stop(!f.fast);
    await f.close();
    e.cfCard.classList.remove('credits');
    this.art.textContent = ''; this.stage = null;
    Store.data.seen.endings[ch.id] = true; Store.save();
  }
};

scenes.chapterEnd = ChapterFilm;   // the game flow reaches this film through core/scenes.ts
