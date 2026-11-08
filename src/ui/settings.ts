import { AudioFX } from '../audio/sfx.ts';
import { VoiceClipManifest } from '../audio/voice.ts';
import { Outfit } from '../characters/barnaby-svg.ts';
import { Barnaby } from '../characters/barnaby.ts';
import { $ } from '../core/dom.ts';
import { emit } from '../core/events.ts';
import { Store } from '../state/store.ts';
import { Badges } from './badges-screen.ts';
import { UI } from './ui.ts';

/* title-screen toggles: Store.data.settings key -> button, label. Flipping one emits 'settings:changed' ({ key, on }); the audio modules listen for it. */
export const SETTINGS = {
  music: { btn: '#btnMusic', label: 'Music', blip: true },
  sound: { btn: '#btnSound', label: 'Sound', blip: true },
  voice: { btn: '#btnVoice', label: 'Voice' }
};

export const TOPBAR_MUSIC = ['#btnPzSound', '#btnZSound'];

export const Settings = {
  init() {
    Object.keys(SETTINGS).forEach(key => $(SETTINGS[key].btn).addEventListener('click', () => this.toggle(key)));
    TOPBAR_MUSIC.forEach(sel => $(sel).addEventListener('click', () => this.toggle('music', true)));   // the topbar note button = music on/off
    this.initReset();
    this.sync();
  },

  toggle(key, announce) {
    const s = Store.data.settings, cfg = SETTINGS[key];
    s[key] = !s[key]; Store.save(); this.sync();
    emit('settings:changed', { key, on: s[key] });
    if (announce) UI.toast(cfg.label + ' ' + (s[key] ? 'on' : 'off'));
    if (cfg.blip) AudioFX.blip();
  },

  /* make the buttons show what is saved */
  sync() {
    const s = Store.data.settings;
    Object.keys(SETTINGS).forEach(key => { $(SETTINGS[key].btn).textContent = SETTINGS[key].label + ': ' + (s[key] ? 'On' : 'Off'); });
    $('#btnVoice').hidden = !Object.values(VoiceClipManifest.clips).some(c => c.src);   // no voice clips shipped yet -> nothing to toggle
    TOPBAR_MUSIC.forEach(sel => { $(sel).style.opacity = s.music ? 1 : 0.5; });
  },

  /* "Reset progress" asks twice: the second tap within 3 seconds erases everything */
  initReset() {
    let armed = 0;
    $('#btnReset').addEventListener('click', e => {
      if (!armed) {
        e.target.textContent = 'Tap again to erase all progress';
        armed = setTimeout(() => { armed = 0; e.target.textContent = 'Reset progress'; }, 3000);
      } else {
        clearTimeout(armed); armed = 0;
        Store.reset(); Badges.queue.length = 0; Badges.fresh.clear(); this.sync(); e.target.textContent = 'Reset progress'; UI.toast('Progress erased');
        Outfit.current = Object.assign({}, Store.data.wardrobe.equipped); Barnaby.dressAll(Outfit.current);
      }
    });
  }
};
