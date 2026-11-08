import { Store } from '../state/store.js';

/* Haptics: fired on the same frame as the sound/visual, only for meaningful moments (find, tangle, win) */
export const Haptics = {
  buzz(p) { try { if (Store.data.settings.sound && navigator.vibrate) navigator.vibrate(p); } catch { /* unsupported */ } },
  found() { this.buzz(12); },
  tangle() { this.buzz([22, 40, 22]); },
  win() { this.buzz([18, 50, 18, 50, 40]); }
};
