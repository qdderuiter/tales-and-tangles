/* Tales & Tangles: entry point. Styles, then boot. Everything else lives in the folders next to this file. */
import './styles/index.css';
import { Music } from './audio/music.js';
import { AudioFX } from './audio/sfx.js';
import { VoiceClipManifest, VoiceManager } from './audio/voice.js';
import { initGame } from './game/game.js';
import { PWA } from './pwa.js';


if (import.meta.env.DEV) window.VoiceClipManifest = VoiceClipManifest;   // dev console helper: VoiceClipManifest.ids()

function boot() {
  initGame();
  (window.requestIdleCallback || (fn => setTimeout(fn, 200)))(() => PWA.init());   // icon drawing + PNG encoding stays off the first frame

  // voice hookup: uncomment after adding files to ./voices/ (see VoiceClipManifest notes above)
  // VoiceClipManifest.attachByConvention();

  // iOS/Safari only allow audio after a user gesture: unlock on the first few touches
  const unlock = () => { AudioFX.unlock(); Music.start(); if (AudioFX.ctx && AudioFX.ctx.state === 'running') ['pointerdown', 'pointerup', 'touchend', 'click'].forEach(t => document.removeEventListener(t, unlock, true)); };
  ['pointerdown', 'pointerup', 'touchend', 'click'].forEach(t => document.addEventListener(t, unlock, true));

  // soft tap sound on every clay button
  document.addEventListener('click', e => { if (e.target.closest('.btn') && !e.target.closest('.choice')) AudioFX.blip(); });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden) VoiceManager.stop(); Music.setHidden(document.hidden); });
}

boot();
