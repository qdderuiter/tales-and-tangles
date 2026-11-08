import { AudioFX } from '../audio/sfx.ts';
import { $ } from '../core/dom.ts';
import { on } from '../core/events.ts';
import { BADGES } from '../data/badges.ts';
import { Daily } from '../puzzles/daily.ts';
import { Store } from '../state/store.ts';
import { UI } from './ui.ts';

export const Badges = {
  queue: [], busy: false, fresh: new Set(),
  earned(id) { return !!Store.data.badges[id]; },
  count() { return BADGES.filter(b => this.earned(b.id)).length; },
  /* award every badge whose test passes; silent = no toasts (used once at startup so old saves catch up quietly) */
  check(ev, silent) {
    let any = false;
    BADGES.forEach(b => {
      if (this.earned(b.id)) return;
      if (!b.test(Store.data, ev, Store)) return;
      Store.data.badges[b.id] = Daily.today(); any = true;
      if (!silent) { this.fresh.add(b.id); this.queue.push(b); }
    });
    if (any) Store.save();
    if (this.queue.length && !this.busy) this.drain(1500);
  },
  drain(delay) {                                       // one toast at a time, starting after any victory fanfare
    this.busy = true;
    setTimeout(() => {
      const b = this.queue.shift();
      if (!b) { this.busy = false; return; }
      UI.toast('🏅 Badge earned: ' + b.name);
      AudioFX.chime(6);
      this.drain(1800);
    }, delay);
  },
  open() { this.render(); UI.show('badges'); },
  render() {
    $('#bCount').textContent = '🏅 ' + this.count() + '/' + BADGES.length;
    const grid = $('#bGrid');
    grid.innerHTML = '';
    BADGES.forEach(b => {
      const got = Store.data.badges[b.id], c = document.createElement('div');
      c.className = 'bcard' + (got ? '' : ' locked') + (this.fresh.has(b.id) ? ' new' : '');
      c.innerHTML = '<span class="bicon" aria-hidden="true">' + b.icon + '</span><b></b><small></small>' + (got ? '<span class="bdate"></span>' : '');
      c.querySelector('b').textContent = b.name;
      c.querySelector('small').textContent = b.desc;
      if (got) c.querySelector('.bdate').textContent = 'Earned ' + got;
      grid.appendChild(c);
    });
    this.fresh.clear();
  }
};

/* badges are awarded by listening, so the code that earns progress doesn't need to know about them */
on('puzzle:won', ev => Badges.check({ type: 'puzzle', kind: ev.kind, result: ev.result }));
on('progress', () => Badges.check());
