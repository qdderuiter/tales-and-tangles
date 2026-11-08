import { AudioFX } from '../audio/sfx.ts';
import { Larry } from '../characters/larry.ts';
import { $, setShown } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import { REDUCED, rand } from '../core/util.ts';
import { Cutscene } from './cutscene.ts';
import { Store } from '../state/store.ts';

/* ---------- Evil Larry: scripted cinematic (the "intro video") + the "caught" scene ----------
   Drawn live (no video file): letterbox, a camera pan over the market, lanterns going out, lightning, the silhouette reveal and a WANTED title card.
   Skippable (the Skip button appears after 1.5 s the first time), and reduced-motion gets just the title card. */
export const LarryScene = {
  els: {}, larry: null, running: false, fast: false, canSkip: false, _pending: null, _skipTimer: 0,

  init() {
    const e = this.els;
    ['larryFilm', 'lfStage', 'lfCat', 'lfCap', 'lfTitle', 'lfFlash', 'lfSkip', 'lfGold', 'lfSpot', 'lfC1', 'lfC2'].forEach(id => { e[id] = $('#' + id); });
    e.lanterns = Array.from(e.larryFilm.querySelectorAll('.lf-lan'));
    this.larry = Larry.create(e.lfCat);
    e.lfSkip.addEventListener('click', () => this.skip());
    e.larryFilm.addEventListener('pointerdown', ev => { if (this.canSkip && !ev.target.closest('#lfSkip')) this.skip(); });
  },

  skip() {
    if (!this.running) return;
    this.fast = true;
    if (this._pending) { const r = this._pending; this._pending = null; r(); }
  },
  wait(ms) {
    return new Promise(res => {
      if (this.fast) { res(); return; }
      const t = setTimeout(() => { this._pending = null; res(); }, ms);
      this._pending = () => { clearTimeout(t); res(); };
    });
  },
  snd(fn) { if (!this.fast) { try { fn(); } catch { /* audio is optional */ } } },
  anim(el, frames, opts) { return (this.fast || REDUCED) ? null : el.animate(frames, opts); },
  caption(text) { const c = this.els.lfCap; c.textContent = text; c.classList.toggle('on', !!text); },
  flash(peak, ms) { if (!this.fast && !REDUCED) this.els.lfFlash.animate([{ opacity: 0 }, { opacity: peak, offset: 0.2 }, { opacity: 0 }], { duration: ms }); },
  sneak() { [220, 261.6, 311.1, 261.6, 415.3, 392].forEach((f, i) => AudioFX.note(f, { t: i * 0.2, type: 'triangle', vol: 0.09, dur: 0.16, lp: 1800 })); },

  reset(mode) {
    const e = this.els;
    if (e.larryFilm.getAnimations) e.larryFilm.getAnimations({ subtree: true }).forEach(a => a.cancel());
    e.lfStage.style.transform = '';
    e.lfCat.style.opacity = ''; e.lfCat.style.transform = '';
    e.lanterns.forEach(l => l.classList.toggle('off', mode === 'caught'));
    e.lfC1.classList.remove('cover'); e.lfC2.classList.remove('cover');
    e.lfGold.classList.remove('on'); e.lfSpot.classList.remove('on'); e.lfTitle.classList.remove('on');
    e.larryFilm.classList.toggle('calm', REDUCED);
    this.caption('');
    this.larry.root.classList.remove('sil', 'tip');
    this.larry.react('sneaky');
  },
  open(first) {
    const e = this.els;
    this.running = true; this.fast = false; this.canSkip = false;
    e.lfSkip.classList.remove('on');
    setShown(e.larryFilm, true);
    clearTimeout(this._skipTimer);
    this._skipTimer = setTimeout(() => { this.canSkip = true; e.lfSkip.classList.add('on'); }, first ? 1500 : 300);
  },
  async close() {
    const e = this.els;
    clearTimeout(this._skipTimer);
    setShown(e.larryFilm, false);
    e.lfSkip.classList.remove('on'); this.canSkip = false;
    await new Promise(r => setTimeout(r, 520));
    this.running = false; this.fast = false; this._pending = null;
  },
  /* screen-space offset (in the gold lantern's own units) from the lantern to Larry's sack */
  sackOffset() {
    const g = this.els.lfGold, s = this.larry.root.querySelector('.larry-sack');
    const a = g.getBoundingClientRect(), b = s.getBoundingClientRect(), k = (a.width / (g.offsetWidth || 1)) || 1;
    return { dx: (b.left + b.width / 2 - a.left - a.width / 2) / k, dy: (b.top + b.height / 2 - a.top - a.height / 2) / k };
  },

  async intro() {
    if (this.running) return;
    const e = this.els, root = this.larry.root, first = !Store.data.seen.larry;
    this.reset('intro'); this.open(first);
    if (REDUCED) {
      this.caption(''); e.lfTitle.classList.add('on');
      await this.wait(2400); await this.close();
    } else {
      root.classList.add('sil'); e.lfCat.style.opacity = '0';
      this.snd(() => AudioFX.chime(0, 0, 0.06));
      // 1. the market at midnight
      this.anim(e.lfStage, [{ transform: 'translateX(0)' }, { transform: 'translateX(-18%)' }], { duration: 5000, easing: 'ease-in-out', fill: 'forwards' });
      this.caption('Midnight at the market...');
      await this.wait(2300);
      // 2. the lights go out, one by one
      this.caption('...and one by one, the lights go out.');
      for (const l of e.lanterns) { if (this.fast) break; l.classList.add('off'); this.snd(() => AudioFX.tick(Math.floor(rand(0, 5)))); await this.wait(420); }
      e.lfC1.classList.add('cover'); e.lfC2.classList.add('cover');
      await this.wait(900);
      // 3. lightning, and a silhouette on the rooftop
      this.caption('');
      const cur = getComputedStyle(e.lfStage).transform;
      this.anim(e.lfStage, [{ transform: cur }, { transform: 'translateX(-41.17%)' }], { duration: 1500, easing: 'ease-in-out', fill: 'forwards' });
      await this.wait(1300);
      this.flash(0.95, 380); this.snd(() => AudioFX.thud());
      e.lfCat.style.opacity = '1';
      this.caption('Someone is on the rooftop...');
      await this.wait(1300);
      // 4. the reveal: he steals the golden lantern
      this.flash(1, 420); this.snd(() => AudioFX.thud());
      root.classList.remove('sil'); this.larry.react('smug');
      this.anim(e.lfStage, [{ transform: 'translateX(-41.17%) scale(1)' }, { transform: 'translateX(-41.17%) scale(1.35)' }], { duration: 4600, easing: 'ease-in-out', fill: 'forwards' });
      e.lfGold.classList.add('on');
      this.caption('Evil Larry. Thief of lanterns.');
      this.snd(() => this.sneak());
      await this.wait(1500);
      root.classList.add('tip');
      await this.wait(800);
      const o = this.sackOffset();
      this.anim(e.lfGold, [{ transform: 'none', opacity: 1 }, { transform: 'translate(' + o.dx + 'px,' + o.dy + 'px) scale(.25)', opacity: 0 }], { duration: 600, easing: 'ease-in', fill: 'forwards' });
      this.anim(root.querySelector('.larry-sack'), [{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 700, delay: 450 });
      this.snd(() => AudioFX.chime(7, 0.5, 0.1));
      await this.wait(1300);
      // 5. the title card
      this.caption('');
      e.lfTitle.classList.add('on');
      this.snd(() => { AudioFX.thud(); AudioFX.note(110, { type: 'sawtooth', vol: 0.07, dur: 1.1, lp: 500 }); });
      if (!this.fast) Cutscene.glitch(700);
      await this.wait(2800);
      await this.close();
    }
    Store.data.seen.larry = true; Store.save();
  },

  async caught() {
    if (this.running) return;
    const e = this.els, root = this.larry.root;
    this.reset('caught'); this.open(false);
    e.lfStage.style.transform = 'translateX(-41.17%) scale(1.25)';
    e.lfCat.style.opacity = '1';
    if (REDUCED) {
      e.lanterns.forEach(l => l.classList.remove('off')); e.lfGold.classList.add('on'); this.larry.react('caught');
      this.caption('Caught red-pawed!'); await this.wait(2200); await this.close(); return;
    }
    await this.wait(600);
    // spotlight snaps on
    this.snd(() => AudioFX.thud()); this.flash(0.9, 300);
    e.lfSpot.classList.add('on'); this.larry.react('sneaky');
    this.caption('Caught red-pawed!');
    await this.wait(1000);
    // the sack drops open and the golden lantern rolls out
    this.larry.react('caught');
    e.lfGold.classList.add('on');
    const o = this.sackOffset();
    this.anim(e.lfGold, [{ transform: 'translate(' + o.dx + 'px,' + o.dy + 'px) scale(.25) rotate(0)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: 'cubic-bezier(.2,1.3,.4,1)', fill: 'backwards' });
    this.anim(root.querySelector('.larry-sack'), [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.8)' }, { transform: 'scaleY(1)' }], { duration: 500 });
    this.snd(() => AudioFX.chime(9, 0, 0.1));
    await this.wait(900);
    // the market relights, one lantern at a time
    for (let i = 0; i < e.lanterns.length; i++) {
      if (this.fast) break;
      e.lanterns[i].classList.remove('off'); this.snd(() => AudioFX.chime(i * 2, 0, 0.09)); await this.wait(260);
    }
    e.lanterns.forEach(l => l.classList.remove('off'));
    // Larry hisses and bolts across the rooftops
    this.snd(() => AudioFX.noise(0.4, 3200, 0.12));
    this.caption('Hssss! You have not seen the last of me!');
    await this.wait(1000);
    this.anim(e.lfCat, [{ transform: 'none' }, { transform: 'translateX(180%)' }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
    await this.wait(800);
    await this.close();
  }
};

scenes.larry = LarryScene;   // levels reach this cinematic through core/scenes.js
