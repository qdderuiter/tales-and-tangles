import { Haptics } from '../audio/haptics.ts';
import { AudioFX } from '../audio/sfx.ts';
import { VoiceManager } from '../audio/voice.ts';
import { $, setShown } from '../core/dom.ts';
import { REDUCED, clamp } from '../core/util.ts';
import { REACT } from '../data/story.ts';
import { speak } from '../dialogue/speakers.ts';
import { Typer } from '../dialogue/typer.ts';
import { Confetti } from '../fx/confetti.ts';

export const STAR_SVG = '<svg viewBox="0 0 24 24" class="star{on}" style="--d:{d}ms"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

export const Victory = {
  bear: null, typer: null, cb: null,
  init(bear) {
    this.bear = bear;
    this.typer = new Typer($('#vText'), bear);
    $('#vContinue').addEventListener('click', () => {
      const cb = this.cb;
      if (cb && cb.keepOpen) { if (cb.onContinue) cb.onContinue(); return; }       // e.g. "Share result" keeps the card up
      this.hide(); if (cb && cb.onContinue) cb.onContinue();
    });
    $('#vReplay').addEventListener('click', () => { const cb = this.cb; this.hide(); if (cb && cb.onReplay) cb.onReplay(); });
  },
  /* o: { title, result:{score,stars}, rec:{isBest,prevBest}, unlock (html), continueLabel, replayLabel, onContinue, onReplay } */
  show(o) {
    this.cb = o;
    const el = $('#victory'), result = o.result, rec = o.rec;
    $('#vTitle').textContent = o.title;
    $('#vStars').innerHTML = [1, 2, 3].map(i => STAR_SVG.replace('{on}', i <= result.stars ? ' on' : '').replace('{d}', 500 + i * 380)).join('');
    for (let i = 0; i < result.stars; i++) setTimeout(() => AudioFX.star(i), 500 + (i + 1) * 380);
    $('#vBest').innerHTML = rec.isBest && rec.prevBest > 0 ? '<span class="newbest">NEW BEST</span>' : (rec.prevBest > 0 ? '(best ' + rec.prevBest + ')' : '');
    $('#vUnlock').innerHTML = o.unlock;
    $('#vContinue').textContent = o.continueLabel;
    $('#vReplay').textContent = o.replayLabel || 'Replay';
    setShown(el, true);
    AudioFX.fanfare();
    Haptics.win();
    this.bear.react('proud');
    Confetti.burst($('#confetti'));
    // count the score up
    const out = $('#vScore'), t0 = performance.now(), dur = REDUCED ? 1 : 1100;
    const tick = now => {
      const k = clamp((now - t0) / dur, 0, 1);
      out.textContent = Math.round(result.score * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const line = REACT.victory[result.stars];
    setTimeout(() => {
      if (el.classList.contains('show')) speak(this.bear, this.typer, line, 22);
    }, 700);
  },
  hide() {
    setShown($('#victory'), false);
    this.typer.cancel(); VoiceManager.stop();
    Confetti.stop($('#confetti'));
  }
};
