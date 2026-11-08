import { $ } from '../core/dom.ts';
import { emit } from '../core/events.ts';
import { session } from '../state/session.ts';

export const UI = {
  show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    session.screen = name;
    emit('screen', { name });                      // e.g. the music changes mood
  },
  toast(msg) {
    const d = document.createElement('div');
    d.className = 'toast'; d.textContent = msg;
    $('#toastLayer').appendChild(d);
    setTimeout(() => d.remove(), 2500);
  },
  starsHTML(n) {
    let s = '';
    for (let i = 1; i <= 3; i++) s += i <= n ? '★' : '<span class="off">★</span>';
    return s;
  }
};
