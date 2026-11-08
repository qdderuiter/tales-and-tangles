import { AudioFX } from './sfx.ts';
import { on } from '../core/events.ts';
import { mulberry32 } from '../core/util.ts';
import { session } from '../state/session.ts';
import { Store } from '../state/store.ts';

/* ---------- 6b. lofi music (synthesized live: electric piano, bass, soft swung drums; no crackle) ----------
   Each chapter has its own key / tempo / chord loop. "calm" = chords + bass + brushed hat (title, map, story);
   "play" adds soft kick / snare / hats (puzzles, trail, suspects). Mood changes land on the next bar line.
   The voice functions take an explicit audio context so the exact same code can render offline for tests. */
export const CHORD_Q = { maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], min9: [0, 3, 7, 10, 14], dom7: [0, 4, 7, 10] };

export const MOODS = {   // chords: [root pitch class (C=0), quality], one chord per bar
  title: { bpm: 72, chords: [[0, 'maj7'], [9, 'min7'], [2, 'min7'], [7, 'dom7']] },
  ch1:   { bpm: 76, chords: [[5, 'maj7'], [2, 'min7'], [7, 'min7'], [0, 'dom7']] },     // honey: F
  ch2:   { bpm: 70, chords: [[9, 'min9'], [2, 'min9'], [4, 'min7'], [9, 'min9']] },     // library: A minor
  ch3:   { bpm: 80, chords: [[7, 'maj7'], [4, 'min7'], [0, 'maj7'], [2, 'dom7']] },     // garden: G
  ch4:   { bpm: 66, chords: [[2, 'min9'], [10, 'maj7'], [7, 'min9'], [9, 'dom7']] },    // moon: D minor
  ch5:   { bpm: 84, chords: [[3, 'maj7'], [0, 'min7'], [8, 'maj7'], [10, 'dom7']] },    // cake: Eb
  ch6:   { bpm: 74, chords: [[2, 'maj7'], [11, 'min7'], [4, 'min7'], [9, 'dom7']] },    // lighthouse: D
  ch7:   { bpm: 68, chords: [[10, 'maj7'], [7, 'min7'], [3, 'maj7'], [5, 'dom7']] },    // snow: Bb
  ch8:   { bpm: 78, chords: [[4, 'min9'], [9, 'min7'], [2, 'dom7'], [7, 'maj7']] },     // night market: E minor
  ch9:   { bpm: 86, chords: [[7, 'dom7'], [0, 'maj7'], [7, 'dom7'], [2, 'min7']] },     // carnival: jazzy G7
  ch10:  { bpm: 70, chords: [[0, 'maj7'], [9, 'min7'], [5, 'maj7'], [7, 'dom7']] },     // finale: warm C
  evil:  { bpm: 62, heavy: true, drone: true, chords: [[0, 'min9'], [5, 'min7'], [8, 'maj7'], [7, 'dom7']] }   // Barnaby Noir: slow, minor, heavy
};

export const KICK  = [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0];

export const SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];

export const Music = {
  ctx: null, G: null, E: null, timer: 0, running: false, step: 0, bar: 0, nextTime: 0,
  mood: null, intensity: 'calm', pending: null, want: { mood: 'title', intensity: 'calm' },
  beatCbs: [], stats: { notes: 0, drums: 0 }, hiddenPause: false,

  mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  voicing(root, q) {                                   // close voicing around middle C, root left to the bass
    let iv = CHORD_Q[q]; if (iv.length >= 5) iv = iv.slice(1);
    const base = 48 + root;
    return iv.map(i => { let m = base + i; while (m < 57) m += 12; while (m > 74) m -= 12; return m; }).sort((a, b) => a - b);
  },

  /* shared graph: bus -> duck -> lowpass -> dest, plus tape-wobble LFO and a noise buffer for the drums */
  buildGraph(ctx, dest, rng, startGain) {
    const bus = ctx.createGain(); bus.gain.value = startGain;
    const duckG = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = 0.4;
    const comp = ctx.createDynamicsCompressor();                       // glue + makeup: keeps the soft parts audible without peaks
    comp.threshold.value = -30; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = 0.01; comp.release.value = 0.25;
    const makeup = ctx.createGain(); makeup.gain.value = 2.6;
    const sat = ctx.createWaveShaper();                                // soft tape-style saturation: warm, and caps peaks below 0.9
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(1.3 * x) * 0.9; }
    sat.curve = curve; sat.oversample = '2x';
    bus.connect(duckG); duckG.connect(lp); lp.connect(comp); comp.connect(makeup); makeup.connect(sat); sat.connect(dest);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.35;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 7;          // +-7 cents of slow tape wobble
    lfo.connect(lfoGain); lfo.start();
    const nlen = ctx.sampleRate, nb = ctx.createBuffer(1, nlen, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = rng() * 2 - 1;
    return { bus, duckG, lfoGain, noiseBuf: nb };
  },

  /* ----- voices (E = { ctx, bus, lfoGain, noiseBuf, stats }) ----- */
  ep(E, t, midi, dur, vel) {
    const ctx = E.ctx, f = this.mtof(midi);
    const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(vel, t + 0.012); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400 + vel * 6000; lp.Q.value = 0.5;
    [['sine', 1, 0.6, 0], ['triangle', 1.002, 0.32, 6], ['sine', 2, 0.14, 0]].forEach(([type, mul, gain, det]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mul; o.detune.value = det;
      E.lfoGain.connect(o.detune);
      const g = ctx.createGain(); g.gain.value = gain; o.connect(g); g.connect(lp);
      o.start(t); o.stop(t + dur + 0.05);
    });
    lp.connect(env); env.connect(E.bus);
    E.stats.notes++;
  },
  bass(E, t, midi, dur, vel) {
    const ctx = E.ctx, f = this.mtof(midi);
    const env = ctx.createGain(); env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(vel, t + 0.015); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    [['sine', 1, 1], ['triangle', 2, 0.18]].forEach(([type, mul, gain]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mul;
      const g = ctx.createGain(); g.gain.value = gain; o.connect(g); g.connect(lp);
      o.start(t); o.stop(t + dur + 0.05);
    });
    lp.connect(env); env.connect(E.bus);
    E.stats.notes++;
  },
  kick(E, t, vel) {
    const ctx = E.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.16);
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(E.bus); o.start(t); o.stop(t + 0.3);
    E.stats.drums++;
  },
  noiseHit(E, t, offset, type, freq, q, dur, vel) {
    const ctx = E.ctx, s = ctx.createBufferSource(); s.buffer = E.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(E.bus); s.start(t, offset); s.stop(t + dur + 0.02);
  },
  snare(E, t, vel, off) {
    this.noiseHit(E, t, off, 'bandpass', 1900, 0.8, 0.14, vel);
    const ctx = E.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    g.gain.setValueAtTime(vel * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(E.bus); o.start(t); o.stop(t + 0.12);
    E.stats.drums++;
  },
  hat(E, t, vel, off) { this.noiseHit(E, t, off, 'highpass', 7200, 0.7, 0.045, vel); E.stats.drums++; },
  bell(E, t, midi, vel) {
    const ctx = E.ctx, f = this.mtof(midi);
    [[1, 1], [2, 0.3]].forEach(([mul, gain]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * mul;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(g); g.connect(E.bus); o.start(t); o.stop(t + 1.15);
    });
    E.stats.notes++;
  },

  /* one 16th-note step of the groove */
  renderStep(E, mood, intensity, bar, step, t, rand, stepDur) {
    const ch = mood.chords[bar % 4], tones = ch.tones || (ch.tones = this.voicing(ch[0], ch[1])), bassM = 36 + ch[0];   // voicing cached per chord
    const swing = step % 4 === 2 ? stepDur * 0.3 : 0;                  // lazy off-beats
    const tt = t + swing + (rand() - 0.5) * 0.016;                     // humanise
    const play = intensity === 'play';
    if (step === 0) {
      tones.forEach((m, i) => this.ep(E, tt + i * 0.011, m, stepDur * 10, 0.075));
      this.bass(E, tt, bassM, stepDur * 6, 0.2);
      if (mood.drone) this.bass(E, tt, 24 + ch[0], stepDur * 16, 0.12);                 // sub-bass drone under the evil mood
    } else if (step === 10) {
      tones.forEach((m, i) => this.ep(E, tt + i * 0.011, m, stepDur * 5, 0.05));
      if (rand() < 0.6) this.bass(E, tt, bassM + (rand() < 0.5 ? 12 : 7), stepDur * 3, 0.11);
    }
    if (step % 4 === 2 && rand() < (play ? 0.1 : 0.07)) this.bell(E, tt, tones[Math.floor(rand() * tones.length)] + 12, 0.035);
    if (play) {
      if (KICK[step] || (mood.heavy && (step === 3 || step === 8)) || (step === 14 && bar % 4 === 3 && rand() < 0.5)) this.kick(E, tt, mood.heavy ? 0.46 : 0.34);
      if (SNARE[step]) this.snare(E, tt, 0.13, rand() * 0.5);
      if (step % 2 === 0) this.hat(E, tt, step % 4 === 0 ? 0.045 : 0.028, rand() * 0.5);
    } else if (step === 4 || step === 12) {
      this.hat(E, tt, 0.022, rand() * 0.5);                            // brushed hat only
    }
  },

  /* ----- live playback ----- */
  start() {
    if (!Store.data.settings.music) return;
    const ctx = AudioFX.ensure();
    if (!ctx) return;
    this.ctx = ctx;
    if (!this.G) { this.G = this.buildGraph(ctx, AudioFX.master, Math.random, 0); this.E = Object.assign({ ctx, stats: this.stats }, this.G); }
    this.G.bus.gain.cancelScheduledValues(ctx.currentTime);
    this.G.bus.gain.setTargetAtTime(0.62, ctx.currentTime, 0.5);   // sits under the sound effects
    if (this.running) return;
    this.running = true; this.step = 0; this.bar = 0; this.pending = null;
    this.nextTime = ctx.currentTime + 0.12;
    this.mood = MOODS[this.want.mood]; this.intensity = this.want.intensity;
    this.loop();
  },
  loop() { clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 25); },
  tick() {
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + 0.15) {
      const stepDur = 60 / this.mood.bpm / 4, t = this.nextTime;
      this.renderStep(this.E, this.mood, this.intensity, this.bar, this.step, t, Math.random, stepDur);
      if (this.step % 4 === 0 && this.beatCbs.length) {
        const q = this.step / 4;
        setTimeout(() => this.beatCbs.forEach(cb => cb(q)), Math.max(0, (t - ctx.currentTime) * 1000));
      }
      this.nextTime += stepDur; this.step = (this.step + 1) % 16;
      if (this.step === 0) {
        this.bar++;
        if (this.pending) { this.mood = this.pending.mood; this.intensity = this.pending.intensity; this.pending = null; this.bar = 0; }
      }
    }
  },
  stop() {
    this.running = false; clearInterval(this.timer); this.timer = 0;
    if (this.G) this.G.bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
  },
  setEnabled(on) { if (on) this.start(); else this.stop(); },
  scene(name, chapter, evil) {
    const play = name === 'puzzle' || name === 'zip' || name === 'case', inChapter = play || name === 'story';
    const key = evil && inChapter ? 'evil' : chapter > 0 && inChapter ? 'ch' + chapter : 'title';
    this.want = { mood: key, intensity: play ? 'play' : 'calm' };
    if (this.running) this.pending = { mood: MOODS[key], intensity: this.want.intensity };
  },
  duck(ms) {                                            // dip under fanfares
    if (!this.G) return;
    const ctx = this.ctx, g = this.G.duckG.gain;
    g.cancelScheduledValues(ctx.currentTime); g.setTargetAtTime(0.35, ctx.currentTime, 0.08);
    clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => g.setTargetAtTime(1, ctx.currentTime, 0.5), ms);
  },
  setHidden(h) {                                        // save battery in background tabs
    if (!this.running || !this.ctx) return;
    if (h) { clearInterval(this.timer); this.hiddenPause = true; this.ctx.suspend().catch(() => {}); }
    else if (this.hiddenPause) {
      this.hiddenPause = false;
      this.ctx.resume().then(() => { this.nextTime = this.ctx.currentTime + 0.12; this.loop(); }).catch(() => {});
    }
  },
  onBeat(cb) { this.beatCbs.push(cb); },

  /* ----- offline render (tests / preview wav): same voices, deterministic RNG ----- */
  async renderOffline(moodKey, intensity, seconds, sr) {
    sr = sr || 32000;
    const ctx = new OfflineAudioContext(1, Math.ceil(seconds * sr), sr);
    const G = this.buildGraph(ctx, ctx.destination, mulberry32(7), 0.9);
    const E = Object.assign({ ctx, stats: { notes: 0, drums: 0 } }, G);
    const mood = MOODS[moodKey], rand = mulberry32(99), stepDur = 60 / mood.bpm / 4;
    let step = 0, bar = 0, t = 0.05;
    while (t < seconds) { this.renderStep(E, mood, intensity, bar, step, t, rand, stepDur); t += stepDur; step++; if (step % 16 === 0) bar++; }
    const buf = await ctx.startRendering();
    return { data: buf.getChannelData(0), sr, stats: E.stats };
  }
};

/* the music follows the screen and the Noir switch (UI.show and setEvil just announce them) */
function syncScene() {
  const run = session.run;
  Music.scene(session.screen, run ? (run.moodChapter || run.n) : 0, !!(run && run.evil));
}
on('screen', syncScene);
on('evil:changed', syncScene);
on('audio:duck', ({ ms }) => Music.duck(ms));
on('settings:changed', ({ key, on: enabled }) => { if (key === 'music') Music.setEnabled(enabled); });
