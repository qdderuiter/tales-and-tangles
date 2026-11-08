import { AudioFX } from '../audio/sfx.ts';
import { Outfit } from '../characters/barnaby-svg.ts';
import { Barnaby } from '../characters/barnaby.ts';
import { $ } from '../core/dom.ts';
import { emit } from '../core/events.ts';
import { DEFAULT_VOICE } from '../dialogue/babble-rules.ts';
import { Store } from '../state/store.ts';
import { Badges } from './badges-screen.ts';
import { UI } from './ui.ts';

/* title-screen toggles: Store.data.settings key -> button, label. Flipping one emits 'settings:changed' ({ key, on }); the audio modules listen for it. */
export type SettingKey = 'music' | 'sound' | 'autocross';
export const SETTINGS: Record<SettingKey, { btn: string; label: string; blip?: boolean }> = {
  music: { btn: '#btnMusic', label: 'Music', blip: true },
  sound: { btn: '#btnSound', label: 'Sound', blip: true },
  autocross: { btn: '#btnAuto', label: 'Auto-cross', blip: true }
};
/* autocross is stored only once changed, so a missing value means on */
const isOn = (key: SettingKey): boolean => key === 'autocross' ? Store.data.settings.autocross !== false : Store.data.settings[key];

export const TOPBAR_MUSIC = ['#btnPzSound', '#btnZSound'];

export const Settings = {
  init() {
    (Object.keys(SETTINGS) as SettingKey[]).forEach(key => $(SETTINGS[key].btn).addEventListener('click', () => this.toggle(key)));
    TOPBAR_MUSIC.forEach(sel => $(sel).addEventListener('click', () => this.toggle('music', true)));   // the topbar note button = music on/off
    $('#btnSettings').addEventListener('click', () => UI.show('settings'));
    $('#btnSBack').addEventListener('click', () => UI.show('title'));
    this.initSpeech();
    this.initReset();
    this.sync();
  },

  toggle(key: SettingKey, announce?: boolean) {
    const s = Store.data.settings, cfg = SETTINGS[key];
    const on = !isOn(key); s[key] = on; Store.save(); this.sync();
    emit('settings:changed', { key, on });
    if (announce) UI.toast(cfg.label + ' ' + (on ? 'on' : 'off'));
    if (cfg.blip) AudioFX.blip();
  },

  /* make the buttons show what is saved */
  sync() {
    const s = Store.data.settings;
    (Object.keys(SETTINGS) as SettingKey[]).forEach(key => $(SETTINGS[key].btn).setAttribute('aria-checked', String(isOn(key))));
    const rng = $<HTMLInputElement>('#rngSpeech');
    rng.value = String(Math.round(s.speech * 100)); this.showSpeech(rng);
    TOPBAR_MUSIC.forEach(sel => { $(sel).style.opacity = s.music ? '1' : '0.5'; });
  },

  showSpeech(rng: HTMLInputElement) { rng.style.setProperty('--p', rng.value + '%'); $('#outSpeech').textContent = rng.value + '%'; },

  /* the speech slider scales the characters' babble and any recorded voice; a sample plays when you let go */
  initSpeech() {
    const rng = $<HTMLInputElement>('#rngSpeech');
    rng.addEventListener('input', () => { Store.data.settings.speech = Number(rng.value) / 100; this.showSpeech(rng); });
    rng.addEventListener('change', () => {
      Store.save();
      if (Store.data.settings.speech > 0) ['h', 'e', 'l', 'o'].forEach((ch, i) => setTimeout(() => AudioFX.babble(ch, DEFAULT_VOICE), i * 90));
    });
  },

  /* "Reset progress" asks twice: the second tap within 3 seconds erases everything */
  initReset() {
    let armed = 0;
    $('#btnReset').addEventListener('click', e => {
      const btn = e.target as HTMLElement;
      if (!armed) {
        btn.textContent = 'Tap again to erase all progress';
        armed = setTimeout(() => { armed = 0; btn.textContent = 'Reset progress'; }, 3000);
      } else {
        clearTimeout(armed); armed = 0;
        Store.reset(); Badges.queue.length = 0; Badges.fresh.clear(); this.sync(); btn.textContent = 'Reset progress'; UI.toast('Progress erased');
        Outfit.current = Object.assign({}, Store.data.wardrobe.equipped); Barnaby.dressAll(Outfit.current);
      }
    });
  }
};
