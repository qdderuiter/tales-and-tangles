import { fmtClock } from '../core/util.ts';
import { Store } from '../state/store.ts';
import { UI } from '../ui/ui.ts';
import { chunk, dateSeed, formatDate, generateDaily, hamiltonian, shiftDate, todayString } from './daily-generator.ts';

/* The Daily Case: one generated word puzzle per day. Dates and generation are pure (daily-generator.js); this adds the saved streak/results and sharing. */
export const Daily = {
  fmt: formatDate, today: todayString, shift: shiftDate, seed: dateSeed, hamiltonian, chunk, generate: generateDaily,

  streak(today) { const dl = Store.data.daily; return dl.lastDate === today || dl.lastDate === this.shift(today, -1) ? dl.streak : 0; },
  result(date) { return Store.data.daily.results[date] || null; },
  /* the first completion of a date counts (streak + stars); later runs are just practice */
  record(date, result) {
    const dl = Store.data.daily;
    if (dl.results[date]) return { first: false, streak: this.streak(date), stored: dl.results[date] };
    dl.streak = dl.lastDate === this.shift(date, -1) ? dl.streak + 1 : 1;
    dl.lastDate = date; dl.best = Math.max(dl.best, dl.streak);
    dl.results[date] = { stars: result.stars, score: result.score, secs: result.secs, squares: result.squares || '' };
    Store.save();
    return { first: true, streak: dl.streak, stored: dl.results[date] };
  },
  shareText(date) {
    const r = this.result(date);
    if (!r) return '';
    const sq = { G: '🟩', Y: '🟨', B: '🟦' };
    return 'Tales & Tangles Daily ' + date + '\n' + '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + ' ' + fmtClock(r.secs) +
      '\n' + r.squares.split('').map(c => sq[c] || '').join('');
  },
  share(date) {
    const text = this.shareText(date);
    if (!text) return '';
    const copied = () => UI.toast('Result copied — paste it anywhere!');
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-999px;top:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); copied(); } catch { UI.toast('Could not copy the result'); }
      ta.remove();
    };
    if (navigator.share && window.matchMedia && window.matchMedia('(pointer:coarse)').matches) navigator.share({ text }).catch(() => {});
    else if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(copied, fallback);
    else fallback();
    return text;
  }
};
