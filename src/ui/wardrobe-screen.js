import { Haptics } from '../audio/haptics.js';
import { AudioFX } from '../audio/sfx.js';
import { Outfit } from '../characters/barnaby-svg.js';
import { Barnaby } from '../characters/barnaby.js';
import { $, replayClass } from '../core/dom.js';
import { emit } from '../core/events.js';
import { WARDROBE } from '../data/wardrobe.js';
import { toMap } from '../game/nav.js';
import { Store } from '../state/store.js';
import { UI } from './ui.js';

export const Wardrobe = {
  bear: null, from: 'title',
  SLOTS: [['hat', 'Hats', '40 -2 120 86'], ['face', 'Glasses', '52 64 96 52'], ['neck', 'Neckwear', '58 136 84 78']],
  init(bear) {
    this.bear = bear;
    $('#btnWBack').addEventListener('click', () => { if (this.from === 'map') toMap(); else UI.show('title'); });
  },
  open(from) { this.from = from; this.render(); UI.show('wardrobe'); },
  render() {
    $('#wStars').textContent = '★ ' + Store.availableStars();
    const box = $('#wSlots');
    box.innerHTML = '';
    const worn = Store.data.wardrobe.equipped;
    this.SLOTS.forEach(([slot, label, vb]) => {
      const l = document.createElement('div'); l.className = 'wlabel'; l.textContent = label; box.appendChild(l);
      const row = document.createElement('div'); row.className = 'wrow'; box.appendChild(row);
      WARDROBE.filter(i => i.slot === slot).forEach(item => {
        const owned = Store.owns(item.id), isWorn = worn[slot] === item.id;
        const b = document.createElement('button');
        b.className = 'witem' + (isWorn ? ' worn' : '') + (owned ? '' : ' locked');
        b.dataset.id = item.id;
        const thumb = item.svg ? '<svg class="wthumb" viewBox="' + vb + '" aria-hidden="true">' + item.svg + '</svg>' : '<svg class="wthumb" viewBox="0 0 10 5" aria-hidden="true"></svg>';
        b.innerHTML = thumb + '<b>' + item.name + '</b><small>' + (isWorn ? 'Wearing' : owned ? 'Tap to wear' : item.unlock ? '\uD83D\uDE08 Clear ' + item.unlock + ' evil' : '★ ' + item.cost) + '</small>';
        b.addEventListener('click', () => this.tap(item, b));
        row.appendChild(b);
      });
    });
  },
  tap(item, card) {
    const r = Store.buy(item.id);                                    // already owned -> ok; Noir items -> reason 'unlock'
    if (!r.ok) {
      replayClass(card, 'shake');
      AudioFX.thud(); Haptics.tangle();
      UI.toast(r.reason === 'unlock' ? 'Clear ' + r.need + ' more Noir level' + (r.need === 1 ? '' : 's') + ' to unlock this'
                                     : 'Need ' + r.need + ' more ★ — solve cases or the daily to earn stars');
      return;
    }
    if (!r.already) { AudioFX.chime(5); AudioFX.chime(7, 0.1); AudioFX.chime(9, 0.2); }
    Store.equip(item.id);
    if (!r.already) emit('progress');
    Outfit.current = Object.assign({}, Store.data.wardrobe.equipped);
    Barnaby.dressAll(Outfit.current);
    this.bear.bounce(); this.bear.react('happy', false);
    AudioFX.chime(3);
    this.render();
    const fresh = $('#wSlots').querySelector('[data-id="' + item.id + '"]');
    if (fresh) fresh.classList.add('fresh');
  }
};
