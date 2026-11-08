import { on } from '../core/events.js';
import { Store } from '../state/store.js';

/* ---------- 5. voice clips ----------
   HOW TO ADD REAL VOICE ACTING (e.g. ElevenLabs .mp3 exports):
   1. Every spoken line already has an entry in VoiceClipManifest.clips, keyed by id
      (ch1_intro_01, ch1_intro_03_c0, puzzle_found_02, victory_3, ...). Call
      VoiceClipManifest.ids() in the console to list them all with their text.
   2. Put the .mp3 files in a "voices/" folder next to index.html, then EITHER
        - name each file after its id (ch1_intro_01.mp3) and run
          VoiceClipManifest.attachByConvention();
        - or map ids explicitly:
          VoiceClipManifest.attach({ ch1_intro_01: 'barnaby_hello.mp3',
                                     ch1_intro_02: { src: 'x.mp3', durationMs: 4200 } });
      Call it once at the bottom of this script (see "voice hookup" in boot()).
   3. durationMs (optional) makes the typewriter finish in time with the recording.
   Lines without a src stay silent (text only). A missing or unplayable file fails silently. */
export const VoiceClipManifest = {
  basePath: 'voices/',
  format: 'mp3',
  clips: {},
  register(id, text, emotion) {
    if (!this.clips[id]) this.clips[id] = { src: null, text, emotion: emotion || 'neutral', durationMs: null };
    return this.clips[id];
  },
  attach(map) {
    Object.keys(map).forEach(id => {
      const clip = this.clips[id];
      if (!clip) { console.warn('[VoiceClipManifest] unknown clip id:', id); return; }
      const v = map[id];
      if (typeof v === 'string') clip.src = v; else Object.assign(clip, v);
    });
  },
  attachByConvention() { Object.keys(this.clips).forEach(id => { this.clips[id].src = id + '.' + this.format; }); },
  resolve(id) {
    const c = this.clips[id];
    if (!c || !c.src) return null;
    return /^(https?:|data:|blob:|\/)/.test(c.src) ? c.src : this.basePath + c.src;
  },
  ids() { return Object.keys(this.clips).map(id => ({ id, text: this.clips[id].text, hasAudio: !!this.clips[id].src })); }
};

export const VoiceManager = {
  current: null,
  play(id) {
    this.stop();
    if (!Store.data.settings.voice) return null;
    const url = VoiceClipManifest.resolve(id);
    if (!url) return null;
    try {
      const a = new Audio(url);
      this.current = a;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
      return a;
    } catch (e) { return null; }
  },
  stop() {
    if (this.current) { try { this.current.pause(); } catch (e) { /* ignore */ } this.current = null; }
  }
};

on('settings:changed', ({ key, on: enabled }) => { if (key === 'voice' && !enabled) VoiceManager.stop(); });
