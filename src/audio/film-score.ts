import type { FilmCue } from '../data/types.ts';
import { AudioFX } from './sfx.ts';

/* ---------- the music and sound cues of the chapter films (all synthesized, like the rest of the audio) ----------
   Each chapter has a short score: a chord progression, a slow pad, and a bell melody on top. `start(id)` schedules one bar at a time,
   a moment ahead, so `stop()` can end it at once (a skipped film) or let it resolve (a film that ran its course).
   Cues are the small stings on top (a sparkle as the stars appear, a bell as the lamp lights...); a film fires one on the same tick as its picture. */

interface Score {
  bpm: number;
  chords: number[][];            // semitones from middle C, one chord per bar
  pad: { type: OscillatorType; lp: number; vol: number };
  melody: (number | null)[][];   // per bar, 8 eighth-note slots: a semitone from middle C, or null for a rest
  bell: { type: OscillatorType; vol: number; dur: number };
  color?: (bar: number, t: number, barSec: number) => void;   // extra texture per bar (the sea wash...)
}

const hz = (semi: number) => AudioFX.hz(semi);

export const SCORES: Record<string, Score> = {
  /* Village Days: warm, rocking, a music box over C - Am - F - G */
  village: {
    bpm: 84, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 5]],
    pad: { type: 'triangle', lp: 1500, vol: 0.05 },
    melody: [[12, null, 16, null, 19, null, 16, null], [12, null, 15, null, 19, null, 21, null], [17, null, 21, null, 24, null, 21, null], [19, 17, 19, null, 14, null, 11, null]],
    bell: { type: 'sine', vol: 0.085, dur: 0.7 }
  },
  /* Sweet Dreams: slow and floaty, celesta bells high above a soft pad */
  dreams: {
    bpm: 62, chords: [[-7, -3, 0, 4], [-2, 2, 5, 9], [-3, 0, 4, 7], [0, 4, 7, 14]],
    pad: { type: 'sine', lp: 1000, vol: 0.06 },
    melody: [[19, null, null, 24, null, 23, null, null], [22, null, 26, null, 24, null, null, null], [21, null, 24, null, 28, null, 24, null], [26, null, 24, null, 19, null, null, null]],
    bell: { type: 'sine', vol: 0.075, dur: 1.1 }
  },
  /* Sea & Snow: a low string pad and a wash of surf under glassy bells */
  'sea-snow': {
    bpm: 68, chords: [[-10, -7, -3, 0], [-14, -7, -2, 2], [-7, -3, 0, 4], [-5, 0, 2, 7]],
    pad: { type: 'sawtooth', lp: 520, vol: 0.035 },
    melody: [[14, null, null, 17, null, 21, null, null], [14, null, 17, null, 19, null, null, null], [16, null, 19, null, 24, null, 21, null], [19, null, 17, null, 14, null, null, null]],
    bell: { type: 'triangle', vol: 0.06, dur: 0.9 },
    color: (_bar, _t, barSec) => AudioFX.noise(barSec * 0.95, 520, 0.06, 0)
  },
  /* Larry's Night: the thief's sneaky motif from the Midnight Market, turned major and triumphant */
  larry: {
    bpm: 96, chords: [[-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 5], [0, 4, 7, 12]],
    pad: { type: 'triangle', lp: 1700, vol: 0.055 },
    melody: [[9, null, 13, 16, 13, null, 21, 19], [9, null, 12, 16, 12, null, 19, 16], [11, null, 14, 17, 14, null, 23, 21], [12, null, 16, 19, 24, null, null, null]],
    bell: { type: 'triangle', vol: 0.09, dur: 0.6 }
  },
  /* Lost in Space: a floaty, lydian lullaby, glassy bells drifting over a wide pad */
  space: {
    bpm: 72, chords: [[0, 4, 7, 11], [2, 6, 9, 12], [-3, 0, 4, 7], [-5, -1, 2, 6]],
    pad: { type: 'sine', lp: 1400, vol: 0.06 },
    melody: [[19, null, 23, null, 26, null, 23, null], [21, null, 26, null, 30, null, 26, null], [19, null, 24, null, 28, null, 24, null], [23, null, 26, 23, 19, null, null, null]],
    bell: { type: 'sine', vol: 0.08, dur: 1.0 }
  }
};

/* ---------- Evil Larry's cinematics: a minor-key noir score instead of the game's bright chimes ----------
   A low drone under the whole scene (the only long-lived sound, so a skip can fade it out), then one-shot hits timed by scenes/larry-scene.ts:
   the midnight bell tolls, each lantern snuffed with a falling pluck, lightning, the sneaky motif over a walking bass, and the WANTED sting.
   Everything sits around A minor, with a tritone and a falling semitone for the menace. */
const bellStrike = (semi: number, t: number, vol: number, len = 2.4) =>
  [[1, 1, 1], [2.4, 0.5, 0.7], [4.1, 0.25, 0.45]].forEach(([m, v, d]) =>
    AudioFX.note(hz(semi) * m, { t, dur: len * d, vol: vol * v, type: 'sine', attack: 0.005 }));

/* a held chord under a whole cinematic (the only long-lived sound in a character's score, so a skip can fade it out): oscillators
   [semitone, wave, level] through a lowpass, swelling to `vol` over `rise` s; `lfo` makes the filter breathe. Returns the fade-out. */
function heldPad(voices: [number, OscillatorType, number][], o: { lp: number; vol: number; rise: number; lfo?: { hz: number; depth: number } }): (() => void) | null {
  const ctx = AudioFX.enabled ? AudioFX.ensure() : null;
  if (!ctx) return null;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(), now = ctx.currentTime;
  lp.type = 'lowpass'; lp.frequency.value = o.lp;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(o.vol, now + o.rise);
  const oscs = voices.map(([s, type, v]) => {
    const osc = ctx.createOscillator(), og = ctx.createGain();
    osc.type = type; osc.frequency.value = hz(s); og.gain.value = v;
    osc.connect(og); og.connect(lp); osc.start(); return osc;
  });
  if (o.lfo) {
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = o.lfo.hz; lg.gain.value = o.lfo.depth;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); oscs.push(lfo);
  }
  lp.connect(g); g.connect(AudioFX.master);
  return () => {
    const n = ctx.currentTime;
    g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), n); g.gain.linearRampToValueAtTime(0.0001, n + 0.6);
    oscs.forEach(osc => osc.stop(n + 0.7));
  };
}

/* the start / stop pair of a character score around its held pad */
function padControl(voices: [number, OscillatorType, number][], o: Parameters<typeof heldPad>[1]) {
  let fade: (() => void) | null = null;
  const stop = () => { if (fade) { try { fade(); } catch { /* already stopped */ } fade = null; } };
  return { start() { stop(); fade = heldPad(voices, o); }, stop };
}

/* a run of rising chimes, the sparkle on a happy ending */
const sparkleRun = (t0: number, gap: number, vol: number) => { for (let i = 0; i < 6; i++) AudioFX.chime(4 + i * 2, t0 + i * gap, vol); };

export const LarryScore = {
  /* the drone: A1 + E2 + a soft A2 an octave up, slowly swelling, the filter breathing slowly; `stop()` fades it */
  ...padControl([[-27, 'sawtooth', 1], [-20, 'sawtooth', 0.6], [-15, 'triangle', 0.5]], { lp: 340, vol: 0.085, rise: 2.5, lfo: { hz: 0.25, depth: 90 } }),

  /* "Midnight at the market...": three slow, low bell tolls and gusts of wind */
  midnight() {
    [0.3, 2.0, 3.7].forEach(t => bellStrike(-15, t, 0.12));
    [0, 1.3, 2.7, 4].forEach(t => AudioFX.noise(1, 450, 0.035, t));
  },
  /* a lantern goes out: a falling muted pluck and a little puff */
  lanternOut(i: number) {
    const fall = [-3, -5, -8, -10, -12, -15, -17, -20], s = fall[Math.min(i, fall.length - 1)];
    AudioFX.note(hz(s), { dur: 0.55, vol: 0.11, type: 'triangle', lp: 900, attack: 0.006, slideTo: hz(s) * 0.94 });
    AudioFX.noise(0.12, 900, 0.05);
  },
  /* lightning: crack, rumble and a tritone stab */
  lightning() {
    AudioFX.noise(0.45, 5200, 0.22); AudioFX.noise(1.1, 650, 0.2, 0.06); AudioFX.thud();
    [-15, -9].forEach(s => AudioFX.note(hz(s), { dur: 1.3, vol: 0.06, type: 'sawtooth', lp: 750, attack: 0.02 }));   // A2 + Eb3
  },
  /* the reveal: a sneaky pizzicato motif (A C Eb C Ab G) over a low walking bass */
  sneak() {
    [-3, 0, 3, 0, 8, 7].forEach((s, i) => AudioFX.note(hz(s), { t: i * 0.2, type: 'triangle', vol: 0.1, dur: 0.17, lp: 1800 }));
    [-15, -15, -14, -15].forEach((s, i) => AudioFX.note(hz(s), { t: i * 0.3, type: 'triangle', vol: 0.12, dur: 0.26, lp: 520 }));
  },
  /* the golden lantern drops into the sack */
  stolen() {
    AudioFX.note(560, { dur: 0.42, vol: 0.1, type: 'triangle', slideTo: 170, lp: 1600 });
    AudioFX.noise(0.18, 1400, 0.05, 0.3);
  },
  /* the WANTED card: a crash, two heavy brass-like stabs a semitone apart (A minor, then G# minor), glitchy static and a tolling bell that settles on the drone */
  wanted() {
    AudioFX.thud(); AudioFX.noise(0.9, 3200, 0.2);
    [[-15, -3, 0, 4], [-16, -4, -1, 3]].forEach((chord, k) =>
      chord.forEach(s => AudioFX.note(hz(s), { t: k * 0.5, dur: k ? 2.2 : 0.9, vol: 0.065, type: 'sawtooth', lp: 1300, attack: 0.02 })));
    AudioFX.note(hz(15), { t: 0.5, dur: 1.6, vol: 0.03, type: 'sine', attack: 0.04 });                          // a thin high Eb above the second stab
    [0.04, 0.3, 0.62].forEach(t => AudioFX.noise(0.12, 6500, 0.08, t));                                         // matches the glitch on the card
    bellStrike(-15, 1.35, 0.14, 3);
  }
};

/* ---------- Pickle's cinematics (scenes/pup-scene.ts): soft, bouncy and bright where Larry's are menacing ----------
   A warm pad under the whole scene (the only long-lived sound, so a skip can fade it out), then one-shot sounds timed by the scene:
   the rocket zooming by, sputtering, falling, a soft bounce, the hatch popping, Pickle's "bork", the countdown and the lift-off. */
export const PupScore = {
  /* a warm major-seventh pad; `stop()` fades it */
  ...padControl([[-12, 'sine', 1], [-5, 'triangle', 0.6], [4, 'sine', 0.5], [11, 'sine', 0.3]], { lp: 900, vol: 0.06, rise: 2 }),

  /* twinkling stars at the start: a few high glassy notes */
  twinkle() { [19, 26, 23, 31].forEach((s, i) => AudioFX.chime(s - 12, i * 0.35, 0.05)); },
  /* the rocket zooms across the sky: a rising slide and a whoosh */
  zoom() {
    AudioFX.note(220, { dur: 1.4, attack: 0.3, vol: 0.05, type: 'triangle', slideTo: 1100, lp: 2600 });
    AudioFX.noise(1.1, 1500, 0.07, 0.1);
  },
  /* the engine coughs: four uneven blips that fall in pitch, with puffs */
  sputter() {
    [0, 0.22, 0.5, 0.95].forEach((t, i) => {
      AudioFX.note(190 - i * 28, { t, dur: 0.16, vol: 0.09, type: 'square', lp: 700, slideTo: 120 - i * 14 });
      AudioFX.noise(0.1, 500, 0.05, t);
    });
  },
  /* a long falling whistle */
  fall() { AudioFX.note(900, { dur: 1.7, vol: 0.05, type: 'sine', slideTo: 160, lp: 2400 }); },
  /* the soft landing: a thud and a springy boing */
  boing() {
    AudioFX.thud();
    AudioFX.note(210, { t: 0.04, dur: 0.5, vol: 0.09, type: 'triangle', slideTo: 560, lp: 1800 });
    AudioFX.note(560, { t: 0.5, dur: 0.35, vol: 0.05, type: 'triangle', slideTo: 330, lp: 1800 });
    AudioFX.noise(0.3, 900, 0.06, 0.02);
  },
  /* the hatch pops open: a hiss and a little rising chime */
  pop() {
    AudioFX.noise(0.35, 3200, 0.07);
    [12, 16, 19].forEach((s, i) => AudioFX.chime(s, 0.1 + i * 0.09, 0.09));
  },
  /* "Bork!": two quick yaps, the second a touch higher */
  bork() {
    AudioFX.note(560, { dur: 0.13, vol: 0.09, type: 'square', lp: 1500, slideTo: 380, attack: 0.004 });
    AudioFX.note(690, { t: 0.2, dur: 0.15, vol: 0.09, type: 'square', lp: 1500, slideTo: 450, attack: 0.004 });
  },
  /* the WELCOME card: a warm major chord and a sparkle */
  title() {
    [0, 4, 7, 12].forEach((s, i) => AudioFX.note(hz(s), { t: i * 0.05, dur: 2.2, vol: 0.07, type: 'triangle', attack: 0.03 }));
    sparkleRun(0.3, 0.08, 0.08);
  },
  /* the heart of stardust after the lift-off */
  heart() { sparkleRun(0, 0.09, 0.09); },
  /* the countdown: three equal beeps and a higher one for GO */
  countdown(i: number) { AudioFX.note(i < 3 ? 440 : 880, { dur: i < 3 ? 0.22 : 0.6, vol: 0.1, type: 'triangle', lp: 2400, attack: 0.005 }); },
  /* lift-off: a rumble that opens up, a rising tone and a sparkling finish */
  liftoff() {
    AudioFX.noise(2.8, 420, 0.2); AudioFX.noise(2.4, 1800, 0.08, 0.3);
    AudioFX.note(90, { dur: 2.6, attack: 0.4, vol: 0.09, type: 'sawtooth', slideTo: 520, lp: 900 });
    AudioFX.note(260, { t: 0.5, dur: 2.4, attack: 0.5, vol: 0.05, type: 'triangle', slideTo: 1500, lp: 3000 });
    for (let i = 0; i < 7; i++) AudioFX.chime(i * 2, 1.9 + i * 0.1, 0.08);
  }
};

export const FilmScore = {
  timer: 0, bar: 0, id: '', t0: 0,

  start(id: string) {
    const sc = SCORES[id];
    this.stop();
    if (!sc || !AudioFX.enabled || !AudioFX.ensure()) return;
    this.id = id; this.bar = 0;
    const barSec = (60 / sc.bpm) * 4;
    const play = () => {
      this.playBar(sc, this.bar++, barSec);
    };
    play();
    this.timer = window.setInterval(play, barSec * 1000);
  },

  playBar(sc: Score, bar: number, barSec: number) {
    const chord = sc.chords[bar % sc.chords.length], mel = sc.melody[bar % sc.melody.length], eighth = barSec / 8;
    chord.forEach((s, i) => {                                      // the pad swells in over the bar and rings into the next
      AudioFX.note(hz(s - 12), { dur: barSec * 1.15, attack: barSec * 0.35, vol: sc.pad.vol, type: sc.pad.type, lp: sc.pad.lp });
      if (i === 0) AudioFX.note(hz(s - 24), { dur: barSec * 0.95, attack: 0.05, vol: sc.pad.vol * 1.2, type: 'sine' });   // a root an octave+ below
    });
    mel.forEach((s, i) => {
      if (s === null) return;
      const f = hz(s);
      AudioFX.note(f, { t: i * eighth, dur: sc.bell.dur, vol: sc.bell.vol, type: sc.bell.type, attack: 0.008 });
      AudioFX.note(f * 2, { t: i * eighth, dur: sc.bell.dur * 0.5, vol: sc.bell.vol * 0.28, type: 'sine', attack: 0.008 });
    });
    if (sc.color) sc.color(bar, 0, barSec);
  },

  /* stop the score. `resolve`: end on a soft tonic chord, as when the film ran its course; otherwise (skipped) just stop */
  stop(resolve = false) {
    clearInterval(this.timer); this.timer = 0;
    const sc = SCORES[this.id];
    if (resolve && sc && AudioFX.enabled) {
      const root = sc.chords[0];
      root.forEach(s => AudioFX.note(hz(s), { dur: 2.4, attack: 0.04, vol: 0.06, type: 'triangle', lp: 2200 }));
      AudioFX.note(hz(root[0] + 12), { t: 0.05, dur: 2.2, vol: 0.05, type: 'sine' });
    }
    this.id = '';
  },

  /* a short sting on top of the score */
  cue(name: FilmCue) {
    switch (name) {
      case 'swell':
        AudioFX.note(hz(-12), { dur: 2.4, attack: 1.4, vol: 0.06, type: 'sawtooth', lp: 500 });
        AudioFX.note(hz(0), { dur: 2.4, attack: 1.6, vol: 0.05, type: 'triangle', lp: 2400 });
        AudioFX.note(hz(7), { dur: 2.2, attack: 1.7, vol: 0.035, type: 'sine' });
        break;
      case 'sparkle':
        for (let i = 0; i < 7; i++) AudioFX.chime(i + 3, i * 0.075, 0.08);
        break;
      case 'chime':
        AudioFX.chime(7, 0, 0.12); AudioFX.chime(9, 0.14, 0.1);
        break;
      case 'whoosh':
        AudioFX.noise(1.0, 700, 0.12); AudioFX.noise(0.8, 2400, 0.08, 0.22);
        AudioFX.note(180, { dur: 0.9, attack: 0.5, vol: 0.04, type: 'sine', slideTo: 520 });
        break;
      case 'bell': {
        const f = hz(7);                                              // a struck bell: inharmonic partials ring out at different lengths
        [[1, 0.15, 2.2], [2.76, 0.07, 1.5], [5.4, 0.03, 0.9]].forEach(([m, v, d]) => AudioFX.note(f * m, { dur: d, vol: v, type: 'sine', attack: 0.004 }));
        break;
      }
      case 'finale':
        [0, 4, 7, 12, 16].forEach((s, i) => {                          // a bright major chord, then a tumble of bells
          AudioFX.note(hz(s), { t: i * 0.05, dur: 2.8, vol: 0.075, type: 'triangle', attack: 0.03 });
          AudioFX.note(hz(s + 12), { t: i * 0.05, dur: 2.4, vol: 0.03, type: 'sine', attack: 0.03 });
        });
        for (let i = 0; i < 6; i++) AudioFX.chime(5 + i * 2, 0.5 + i * 0.09, 0.09);
        break;
    }
  }
};
