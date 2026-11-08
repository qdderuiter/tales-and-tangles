import { LarryScore } from '../audio/film-score.ts';
import { AudioFX } from '../audio/sfx.ts';
import { Larry } from '../characters/larry.ts';
import type { LarryPortrait } from '../characters/larry.ts';
import { $ } from '../core/dom.ts';
import { emit } from '../core/events.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, late } from '../core/util.ts';
import { Cutscene } from './cutscene.ts';
import { Film } from './film.ts';
import { Store } from '../state/store.ts';

/* ---------- Evil Larry: scripted cinematic (the "intro video") + the "caught" scene ----------
   Drawn live (no video file): letterbox, a camera pan over the market, lanterns going out, lightning, the silhouette reveal and a WANTED title card.
   Skippable (the Skip button appears after 1.5 s the first time), and reduced-motion gets just the title card.
   The playback mechanics (wait / skip / caption / flash / open / close) are shared with the chapter films: see film.ts. */
export const LarryScene = {
  els: {} as Record<string, HTMLElement> & { lanterns: HTMLElement[] }, larry: late<LarryPortrait>(), film: late<Film>(),

  init() {
    const e = this.els;
    ['larryFilm', 'lfStage', 'lfCat', 'lfCap', 'lfTitle', 'lfFlash', 'lfSkip', 'lfGold', 'lfSpot', 'lfC1', 'lfC2'].forEach(id => { e[id] = $('#' + id); });
    e.lanterns = Array.from(e.larryFilm.querySelectorAll<HTMLElement>('.lf-lan'));
    this.larry = Larry.create(e.lfCat);
    this.film = new Film({ root: e.larryFilm, skip: e.lfSkip, cap: e.lfCap, flash: e.lfFlash });
  },

  reset(mode: string) {
    const e = this.els;
    this.film.clearAnimations();
    e.lfStage.style.transform = '';
    e.lfCat.style.opacity = ''; e.lfCat.style.transform = '';
    e.lanterns.forEach(l => l.classList.toggle('off', mode === 'caught'));
    e.lfC1.classList.remove('cover'); e.lfC2.classList.remove('cover');
    e.lfGold.classList.remove('on'); e.lfSpot.classList.remove('on'); e.lfTitle.classList.remove('on');
    e.larryFilm.classList.toggle('calm', REDUCED);
    this.film.caption('');
    this.larry.root.classList.remove('sil', 'tip');
    this.larry.react('sneaky');
  },
  /* screen-space offset (in the gold lantern's own units) from the lantern to Larry's sack */
  sackOffset() {
    const g = this.els.lfGold, s = this.larry.root.querySelector('.larry-sack')!;
    const a = g.getBoundingClientRect(), b = s.getBoundingClientRect(), k = (a.width / (g.offsetWidth || 1)) || 1;
    return { dx: (b.left + b.width / 2 - a.left - a.width / 2) / k, dy: (b.top + b.height / 2 - a.top - a.height / 2) / k };
  },

  async intro(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, root = this.larry.root, first = !Store.data.seen.larry;
    this.reset('intro'); f.open(first);
    emit('film', { on: true });                                   // the game music steps aside for the film's own score
    if (REDUCED) {
      f.caption(''); e.lfTitle.classList.add('on');
      await f.wait(2400); await f.close();
    } else {
      root.classList.add('sil'); e.lfCat.style.opacity = '0';
      f.snd(() => { LarryScore.start(); LarryScore.midnight(); });
      // 1. the market at midnight
      f.anim(e.lfStage, [{ transform: 'translateX(0)' }, { transform: 'translateX(-18%)' }], { duration: 5000, easing: 'ease-in-out', fill: 'forwards' });
      f.caption('Midnight at the market...');
      await f.wait(2300);
      // 2. the lights go out, one by one
      f.caption('...and one by one, the lights go out.');
      for (const [i, l] of e.lanterns.entries()) { if (f.fast) break; l.classList.add('off'); f.snd(() => LarryScore.lanternOut(i)); await f.wait(420); }
      e.lfC1.classList.add('cover'); e.lfC2.classList.add('cover');
      await f.wait(900);
      // 3. lightning, and a silhouette on the rooftop
      f.caption('');
      const cur = getComputedStyle(e.lfStage).transform;
      f.anim(e.lfStage, [{ transform: cur }, { transform: 'translateX(-41.17%)' }], { duration: 1500, easing: 'ease-in-out', fill: 'forwards' });
      await f.wait(1300);
      f.flashScreen(0.95, 380); f.snd(() => LarryScore.lightning());
      e.lfCat.style.opacity = '1';
      f.caption('Someone is on the rooftop...');
      await f.wait(1300);
      // 4. the reveal: he steals the golden lantern
      f.flashScreen(1, 420); f.snd(() => AudioFX.thud());
      root.classList.remove('sil'); this.larry.react('smug');
      f.anim(e.lfStage, [{ transform: 'translateX(-41.17%) scale(1)' }, { transform: 'translateX(-41.17%) scale(1.35)' }], { duration: 4600, easing: 'ease-in-out', fill: 'forwards' });
      e.lfGold.classList.add('on');
      f.caption('Evil Larry. Thief of lanterns.');
      f.snd(() => LarryScore.sneak());
      await f.wait(1500);
      root.classList.add('tip');
      await f.wait(800);
      const o = this.sackOffset();
      f.anim(e.lfGold, [{ transform: 'none', opacity: 1 }, { transform: 'translate(' + o.dx + 'px,' + o.dy + 'px) scale(.25)', opacity: 0 }], { duration: 600, easing: 'ease-in', fill: 'forwards' });
      f.anim(root.querySelector('.larry-sack')!, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 700, delay: 450 });
      f.snd(() => LarryScore.stolen());
      await f.wait(1300);
      // 5. the WANTED title card
      f.caption('');
      e.lfTitle.classList.add('on');
      f.snd(() => LarryScore.wanted());
      if (!f.fast) Cutscene.glitch(700);
      await f.wait(2800);
      LarryScore.stop();                                           // the drone fades (at once if the film was skipped)
      await f.close();
    }
    LarryScore.stop();
    emit('film', { on: false });
    Store.data.seen.larry = true; Store.save();
  },

  async caught(): Promise<void> {
    const f = this.film;
    if (f.running) return;
    const e = this.els, root = this.larry.root;
    this.reset('caught'); f.open(false);
    emit('film', { on: true });
    e.lfStage.style.transform = 'translateX(-41.17%) scale(1.25)';
    e.lfCat.style.opacity = '1';
    if (REDUCED) {
      e.lanterns.forEach(l => l.classList.remove('off')); e.lfGold.classList.add('on'); this.larry.react('caught');
      f.caption('Caught red-pawed!'); await f.wait(2200); await f.close(); emit('film', { on: false }); return;
    }
    await f.wait(600);
    // spotlight snaps on
    f.snd(() => AudioFX.thud()); f.flashScreen(0.9, 300);
    e.lfSpot.classList.add('on'); this.larry.react('sneaky');
    f.caption('Caught red-pawed!');
    await f.wait(1000);
    // the sack drops open and the golden lantern rolls out
    this.larry.react('caught');
    e.lfGold.classList.add('on');
    const o = this.sackOffset();
    f.anim(e.lfGold, [{ transform: 'translate(' + o.dx + 'px,' + o.dy + 'px) scale(.25) rotate(0)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: 'cubic-bezier(.2,1.3,.4,1)', fill: 'backwards' });
    f.anim(root.querySelector('.larry-sack')!, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.8)' }, { transform: 'scaleY(1)' }], { duration: 500 });
    f.snd(() => AudioFX.chime(9, 0, 0.1));
    await f.wait(900);
    // the market relights, one lantern at a time
    for (let i = 0; i < e.lanterns.length; i++) {
      if (f.fast) break;
      e.lanterns[i].classList.remove('off'); f.snd(() => AudioFX.chime(i * 2, 0, 0.09)); await f.wait(260);
    }
    e.lanterns.forEach(l => l.classList.remove('off'));
    // Larry hisses and bolts across the rooftops
    f.snd(() => AudioFX.noise(0.4, 3200, 0.12));
    f.caption('Hssss! You have not seen the last of me!');
    await f.wait(1000);
    f.anim(e.lfCat, [{ transform: 'none' }, { transform: 'translateX(180%)' }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
    await f.wait(800);
    await f.close();
    emit('film', { on: false });
  }
};

scenes.larry = LarryScene;   // levels reach this cinematic through core/scenes.ts
