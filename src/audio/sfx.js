import { emit } from '../core/events.js';
import { clamp } from '../core/util.js';
import { Store } from '../state/store.js';

export const AudioFX = {
  ctx: null, master: null, noiseBuf: null,
  get enabled() { return Store.data.settings.sound; },
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { this.ctx = new AC(); } catch (e) { return null; }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  },
  unlock() {
    const ctx = this.ensure();
    if (!ctx || this._unlocked) return;
    try { // silent buffer: required by iOS Safari to open the audio session
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
      if (ctx.state === 'running') this._unlocked = true;
    } catch (e) { /* ignore */ }
  },
  hz(semi) { return 261.63 * Math.pow(2, semi / 12); },
  scaleNote(step, base) {                       // C-major pentatonic, climbing octaves
    const pent = [0, 2, 4, 7, 9];
    const s = Math.max(0, step);
    return (base === undefined ? 12 : base) + pent[s % 5] + 12 * Math.min(2, Math.floor(s / 5));
  },
  note(freq, o) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    o = o || {};
    const t0 = ctx.currentTime + (o.t || 0), dur = o.dur || 0.4, vol = o.vol === undefined ? 0.15 : o.vol, atk = o.attack || 0.012;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    let out = g;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); out = f; }
    out.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },
  noise(dur, cutoff, vol, t) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (!this.noiseBuf) {
      this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = ctx.currentTime + (t || 0);
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  },
  /* soft bell: fundamental + octave + a hint of 3rd partial */
  chime(step, t, vol) {
    const f = this.hz(this.scaleNote(step));
    const v = vol === undefined ? 0.16 : vol;
    this.note(f, { t, type: 'sine', vol: v, dur: 0.75 });
    this.note(f * 2, { t, type: 'triangle', vol: v * 0.32, dur: 0.45 });
    this.note(f * 3.01, { t, type: 'sine', vol: v * 0.12, dur: 0.25 });
  },
  purr() {                                     // low rumble with a fast tremolo; returns a stop function
    if (!this.enabled) return null;
    const ctx = this.ensure();
    if (!ctx) return null;
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 72; lp.type = 'lowpass'; lp.frequency.value = 260;
    g.gain.value = 0.0001; lfo.frequency.value = 23; lg.gain.value = 0.035;
    lfo.connect(lg); lg.connect(g.gain); o.connect(lp); lp.connect(g); g.connect(this.master);
    g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.25);
    o.start(); lfo.start();
    return () => { const n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0.0001, n, 0.08); o.stop(n + 0.5); lfo.stop(n + 0.5); };
  },
  bump() { this.note(120, { type: 'sine', vol: 0.22, dur: 0.12, slideTo: 80 }); },
  tick(step) { this.note(this.hz(this.scaleNote(step)), { type: 'triangle', vol: 0.07, dur: 0.14, lp: 2400 }); },
  talk() { this.note(300 + Math.random() * 150, { type: 'sine', vol: 0.022, dur: 0.05, attack: 0.005 }); },
  blip() { this.note(540, { type: 'sine', vol: 0.07, dur: 0.09 }); this.note(810, { t: 0.04, type: 'sine', vol: 0.05, dur: 0.1 }); },
  thud() {
    this.note(150, { type: 'sine', vol: 0.5, dur: 0.3, slideTo: 52 });
    this.noise(0.14, 380, 0.22);
  },
  wordFound(len, combo) {                      // the chime climbs the scale with each chained find
    const s = clamp(len - 1, 0, 6) + clamp((combo || 1) - 1, 0, 5);
    this.chime(s, 0); this.chime(s + 2, 0.09); this.chime(s + 4, 0.18, 0.18);
  },
  star(i) { this.chime(5 + i * 2, 0, 0.17); },
  fanfare() {
    emit('audio:duck', { ms: 2800 });                   // the music dips under the fanfare
    const C5 =this.hz(12), E5 = this.hz(16), G5 = this.hz(19), C6 = this.hz(24);
    [C5, E5, G5, C6].forEach((f, i) => {
      this.note(f, { t: i * 0.13, type: 'triangle', vol: 0.17, dur: 0.38 });
      this.note(f * 2, { t: i * 0.13, type: 'sine', vol: 0.04, dur: 0.3 });
    });
    [C5, E5, G5, C6].forEach(f => {
      this.note(f, { t: 0.56, type: 'triangle', vol: 0.12, dur: 1.2, attack: 0.03 });
      this.note(f, { t: 0.56, type: 'sine', vol: 0.08, dur: 1.4, attack: 0.03 });
    });
    [this.hz(28), this.hz(31), this.hz(36)].forEach((f, i) => this.note(f, { t: 0.72 + i * 0.1, type: 'sine', vol: 0.05, dur: 0.5 }));
  }
};
