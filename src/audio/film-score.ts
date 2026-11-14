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
  },
  /* Midnight Oasis: a warm, slow desert lullaby, a plucked melody in a phrygian-dominant colour (D, E flat, F sharp) over a soft pad */
  oasis: {
    bpm: 76, chords: [[2, 6, 9, 12], [3, 7, 10, 14], [7, 10, 14, 17], [2, 6, 9, 14]],
    pad: { type: 'triangle', lp: 1300, vol: 0.05 },
    melody: [[21, null, 22, 21, 18, null, 15, null], [14, null, 15, null, 18, null, 19, null], [22, null, 21, null, 19, 18, 15, null], [14, null, 18, null, 21, null, null, null]],
    bell: { type: 'triangle', vol: 0.075, dur: 0.85 }
  },
  /* The Big Top: a bouncy little carousel march, bright bells over a light oom-pah pad (C - F - G - C) */
  circus: {
    bpm: 104, chords: [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [0, 4, 7, 12]],
    pad: { type: 'triangle', lp: 1900, vol: 0.05 },
    melody: [[12, null, 16, 12, 19, null, 16, null], [17, null, 21, 17, 24, null, 21, null], [19, 23, 19, null, 26, null, 23, 19], [24, null, 19, 16, 12, null, null, null]],
    bell: { type: 'triangle', vol: 0.085, dur: 0.5 }
  },
  /* Dino Strikes Back: a bouncy marimba stomp-along over a warm pad (C - Am - F - G) */
  dino: {
    bpm: 112, chords: [[0, 4, 7, 12], [-3, 0, 4, 9], [-7, -3, 0, 5], [-5, -1, 2, 7]],
    pad: { type: 'triangle', lp: 1700, vol: 0.05 },
    melody: [[12, null, 16, 19, 16, null, 12, null], [9, null, 12, 16, 12, null, 9, null], [5, null, 9, 12, 9, 12, 17, null], [7, 11, 14, null, 19, null, 14, null]],
    bell: { type: 'triangle', vol: 0.085, dur: 0.45 }
  },
  /* Rocky Rebuilds: a slow, warm cave lullaby, soft bells over a low pad (Cm - Ab - Eb - G) */
  rocky: {
    bpm: 78, chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [-9, -5, -2, 3], [-5, -1, 2, 7]],
    pad: { type: 'triangle', lp: 1200, vol: 0.055 },
    melody: [[15, null, 12, null, 14, null, 15, null], [12, null, 15, null, 17, null, 15, null], [19, null, 17, null, 15, 12, 14, null], [14, null, 11, null, 12, null, null, null]],
    bell: { type: 'sine', vol: 0.09, dur: 0.9 }
  },
  /* Castaways: warm and rolling, marimba-like bells over a sunny pad (C - F - Am - G) */
  castaways: {
    bpm: 96, chords: [[0, 4, 7, 12], [-7, -3, 0, 5], [-3, 0, 4, 9], [-5, -1, 2, 7]],
    pad: { type: 'triangle', lp: 1400, vol: 0.05 },
    melody: [[16, null, 19, null, 21, 19, 16, null], [17, null, 21, null, 24, 21, 17, null], [16, null, 19, null, 21, null, 19, 16], [14, null, 19, 17, 14, null, 12, null]],
    bell: { type: 'triangle', vol: 0.085, dur: 0.5 }
  },
  /* Whisker Isles: a soft, bouncy music-box waltz over a purring pad (G - Em - C - D) */
  cats: {
    bpm: 92, chords: [[-5, -1, 2, 7], [-8, -5, -1, 4], [0, 4, 7, 12], [2, 6, 9, 14]],
    pad: { type: 'triangle', lp: 1500, vol: 0.05 },
    melody: [[14, null, 19, null, 23, null, 19, null], [16, null, 19, null, 23, 21, 19, null], [12, null, 16, null, 19, null, 24, null], [18, null, 21, null, 14, null, null, null]],
    bell: { type: 'sine', vol: 0.085, dur: 0.8 }
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
/* the island and the Whisker Isles end their cinematics on the same two stings: a bright arpeggio for the heroes, a longer chord for the title card */
const heroSting = () => { [0, 4, 7, 12].forEach((s, i) => AudioFX.note(hz(s), { t: i * 0.09, dur: 0.9, vol: 0.07, type: 'triangle', attack: 0.02 })); sparkleRun(0.45, 0.07, 0.07); };
const titleSting = () => { [0, 4, 7, 12, 16].forEach((s, i) => AudioFX.note(hz(s), { t: i * 0.06, dur: 2.4, vol: 0.06, type: 'triangle', attack: 0.03 })); sparkleRun(0.5, 0.08, 0.08); };

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

/* ---------- Biscuit's cinematics (scenes/worm-scene.ts): a warm desert night, soft sand sounds and small, squeaky joy ----------
   A low pad under the whole scene (the only long-lived sound, so a skip can fade it out), then one-shot sounds timed by the scene. */
export const WormScore = {
  ...padControl([[-14, 'sine', 1], [-7, 'triangle', 0.5], [2, 'sine', 0.4], [9, 'sine', 0.3]], { lp: 800, vol: 0.055, rise: 2 }),

  /* a few high glassy notes: the stars over the dunes */
  twinkle() { [21, 28, 24, 33].forEach((n, i) => AudioFX.chime(n - 12, i * 0.4, 0.045)); },
  /* "one... two... three...": each counted star rings a step higher, with a tiny squeak under it */
  count(i: number) { AudioFX.chime(7 + i * 2, 0, 0.1); AudioFX.note(820 + i * 90, { t: 0.02, dur: 0.09, vol: 0.045, type: 'sine', slideTo: 980 + i * 90, attack: 0.004 }); },
  /* "...one hundred!": every star at once, and a shooting star on top */
  hundred() { sparkleRun(0, 0.07, 0.08); AudioFX.note(1500, { t: 0.35, dur: 0.9, vol: 0.035, type: 'sine', slideTo: 620, lp: 3000 }); },
  /* a very small yawn: up, then a long way down */
  yawn() { AudioFX.note(520, { dur: 0.35, vol: 0.06, type: 'sine', slideTo: 760, attack: 0.05 }); AudioFX.note(760, { t: 0.34, dur: 0.75, vol: 0.06, type: 'sine', slideTo: 330, lp: 1800 }); },
  /* diving into the sand: a soft plop and a hush of grains */
  dive() { AudioFX.note(420, { dur: 0.22, vol: 0.08, type: 'triangle', slideTo: 150, lp: 1400 }); AudioFX.noise(0.4, 1800, 0.06, 0.05); },
  /* tunnelling: a few soft, uneven thumps under a gritty hush */
  rumble() { [0, 0.3, 0.55, 0.95, 1.2].forEach(t => { AudioFX.note(110, { t, dur: 0.2, vol: 0.06, type: 'sine', slideTo: 72, lp: 300 }); AudioFX.noise(0.2, 600, 0.04, t); }); },
  /* the wind that moves the dunes: a long gust that swells and passes, with a low moan in it */
  gust() {
    AudioFX.noise(2.8, 520, 0.13); AudioFX.noise(2.4, 1700, 0.07, 0.25); AudioFX.noise(1.6, 3800, 0.03, 0.6);
    AudioFX.note(150, { dur: 2.6, attack: 0.9, vol: 0.05, type: 'sine', slideTo: 235, lp: 500 });
    AudioFX.note(236, { t: 1.5, dur: 1.3, attack: 0.3, vol: 0.035, type: 'sine', slideTo: 140, lp: 500 });
  },
  /* "hm?": two questioning notes, the second one up in the air */
  wonder() { AudioFX.note(hz(9), { dur: 0.16, vol: 0.07, type: 'triangle', lp: 2200 }); AudioFX.note(hz(14), { t: 0.2, dur: 0.3, vol: 0.07, type: 'triangle', slideTo: hz(16), lp: 2200 }); },
  /* out of the sand with a pop */
  pop() { AudioFX.noise(0.25, 2400, 0.06); AudioFX.note(300, { dur: 0.22, vol: 0.09, type: 'triangle', slideTo: 760, lp: 2400 }); [14, 19].forEach((n, i) => AudioFX.chime(n, 0.12 + i * 0.1, 0.08)); },
  /* "Eep!": two tiny squeaks */
  squeak() {
    AudioFX.note(900, { dur: 0.12, vol: 0.07, type: 'sine', slideTo: 1250, attack: 0.004 });
    AudioFX.note(1050, { t: 0.18, dur: 0.14, vol: 0.07, type: 'sine', slideTo: 1450, attack: 0.004 });
  },
  /* a single tear: one small, falling drop */
  tear() { AudioFX.note(1300, { dur: 0.3, vol: 0.05, type: 'sine', slideTo: 700, attack: 0.004 }); AudioFX.chime(4, 0.32, 0.05); },
  /* the lantern over the dune: a warm chord opening up, hope arriving */
  lantern() {
    [0, 7, 12, 16].forEach((n, i) => AudioFX.note(hz(n - 12), { t: i * 0.16, dur: 2.6, attack: 0.5, vol: 0.055, type: 'triangle', lp: 1800 }));
    AudioFX.chime(9, 0.9, 0.07); AudioFX.chime(12, 1.1, 0.07);
  },
  /* the title card: a warm chord and a sparkle */
  title() {
    [0, 4, 7, 12].forEach((n, i) => AudioFX.note(hz(n), { t: i * 0.05, dur: 2.2, vol: 0.07, type: 'triangle', attack: 0.03 }));
    sparkleRun(0.3, 0.08, 0.08);
  },
  /* the key sails to the lock, then turns: a bright swish, and later two metal chimes and a click */
  swish() { AudioFX.note(700, { dur: 0.5, vol: 0.04, type: 'sine', slideTo: 1500, attack: 0.1 }); AudioFX.noise(0.4, 4200, 0.03); },
  key() { AudioFX.chime(14, 0, 0.09); AudioFX.chime(19, 0.08, 0.09); AudioFX.note(1400, { t: 0.22, dur: 0.05, vol: 0.07, type: 'square', lp: 3000 }); AudioFX.note(180, { t: 0.24, dur: 0.12, vol: 0.07, type: 'sine', lp: 400 }); },
  /* the round door swings open: a long soft creak, then warm light */
  creak() { AudioFX.note(170, { dur: 0.9, vol: 0.05, type: 'sawtooth', slideTo: 290, lp: 600, attack: 0.1 }); AudioFX.noise(0.7, 900, 0.03, 0.05); AudioFX.note(hz(0), { t: 0.7, dur: 1.6, attack: 0.5, vol: 0.04, type: 'triangle', lp: 1600 }); },
  /* hop, hop, hop: each one a little higher */
  hop(i: number) { AudioFX.note(330 + i * 50, { dur: 0.16, vol: 0.07, type: 'triangle', slideTo: 560 + i * 60, lp: 2000, attack: 0.005 }); AudioFX.noise(0.08, 1400, 0.03, 0.15); },
  /* a window lights up, each a note higher than the one before */
  window(i: number) { AudioFX.chime(9 + i * 3, 0, 0.09); },
  /* the kettle: a soft hiss rising into a tiny whistle */
  kettle() { AudioFX.noise(1.2, 5200, 0.03); AudioFX.note(1500, { t: 0.3, dur: 1.0, attack: 0.4, vol: 0.03, type: 'sine', slideTo: 1900 }); },
  /* fireflies gather into a heart: a slow rising run, then a chord to rest on */
  heart() {
    for (let i = 0; i < 8; i++) AudioFX.chime(2 + i * 2, i * 0.16, 0.075);
    [0, 4, 7, 12].forEach(n => AudioFX.note(hz(n), { t: 1.4, dur: 2.6, attack: 0.2, vol: 0.05, type: 'triangle', lp: 2200 }));
  }
};

/* ---------- Pippy's cinematics (scenes/elephant-scene.ts): a lit circus tent, trunk toots, drum rolls and a happy fanfare ----------
   A soft pad under the whole scene (the only long-lived sound, so a skip can fade it out), then one-shot sounds timed by the scene. */
export const ElephantScore = {
  ...padControl([[-12, 'sine', 1], [-5, 'triangle', 0.5], [4, 'sine', 0.35], [12, 'sine', 0.25]], { lp: 900, vol: 0.05, rise: 1.6 }),

  /* a tiny music-box bar for the empty tent */
  twinkle() { [12, 16, 19, 16, 12].forEach((n, i) => AudioFX.chime(n - 12, i * 0.3, 0.05)); },
  /* a trunk toot: a bright squeaky horn that bends up */
  toot() {
    AudioFX.note(420, { dur: 0.28, vol: 0.08, type: 'sawtooth', slideTo: 520, lp: 1500, attack: 0.02 });
    AudioFX.note(630, { t: 0.02, dur: 0.26, vol: 0.04, type: 'square', slideTo: 780, lp: 2200, attack: 0.02 });
  },
  /* trotting to the ball: soft pats */
  trot() { [0, 0.18, 0.36, 0.54].forEach(t => { AudioFX.note(150, { t, dur: 0.09, vol: 0.06, type: 'sine', slideTo: 90, lp: 400 }); }); },
  /* climbing on: a springy boing */
  boing() { AudioFX.note(260, { dur: 0.4, vol: 0.08, type: 'sine', slideTo: 620, lp: 2400, attack: 0.004 }); AudioFX.note(520, { t: 0.1, dur: 0.3, vol: 0.04, type: 'triangle', slideTo: 280 }); },
  /* wobbling: a slide whistle that wavers */
  wobble(i: number) { AudioFX.note(500 + i * 40, { dur: 0.35, vol: 0.05, type: 'sine', slideTo: 380 + i * 40, lp: 2000, attack: 0.02 }); },
  /* the ball spins: a quick rising whirr and a sparkle */
  spin() { AudioFX.note(300, { dur: 0.8, vol: 0.04, type: 'triangle', slideTo: 1100, lp: 2600, attack: 0.1 }); sparkleRun(0.4, 0.06, 0.07); },
  /* the roll of a snare drum, building */
  drumroll() { for (let i = 0; i < 28; i++) AudioFX.noise(0.07, 1800 + i * 40, 0.035 + i * 0.002, i * 0.06); },
  /* the lights go out: a low thunk, a falling hum */
  blackout() { AudioFX.note(160, { dur: 0.6, vol: 0.09, type: 'sawtooth', slideTo: 40, lp: 500, attack: 0.005 }); AudioFX.noise(0.3, 400, 0.07); },
  /* the ball whisked away in the dark: a quick whoosh and a cymbal tick */
  whoosh() { AudioFX.noise(0.7, 1800, 0.1); AudioFX.noise(0.5, 4200, 0.04, 0.1); AudioFX.note(900, { dur: 0.5, vol: 0.04, type: 'sine', slideTo: 200, lp: 3000 }); },
  /* the lights come back on: a bright click and a held chord */
  lightsOn() { AudioFX.note(1200, { dur: 0.05, vol: 0.06, type: 'square', lp: 3000 }); [0, 4, 7].forEach((n, i) => AudioFX.note(hz(n - 12), { t: 0.1 + i * 0.05, dur: 1.4, attack: 0.2, vol: 0.04, type: 'triangle', lp: 1800 })); },
  /* "oh no": two sad falling notes, like a trombone */
  sadTrombone() { AudioFX.note(300, { dur: 0.35, vol: 0.07, type: 'sawtooth', slideTo: 280, lp: 900, attack: 0.04 }); AudioFX.note(240, { t: 0.4, dur: 0.9, vol: 0.07, type: 'sawtooth', slideTo: 170, lp: 800, attack: 0.04 }); },
  /* a single tear */
  tear() { AudioFX.note(1300, { dur: 0.3, vol: 0.05, type: 'sine', slideTo: 700, attack: 0.004 }); AudioFX.chime(4, 0.32, 0.05); },
  /* "hm?": two questioning notes */
  wonder() { AudioFX.note(hz(9), { dur: 0.16, vol: 0.07, type: 'triangle', lp: 2200 }); AudioFX.note(hz(14), { t: 0.2, dur: 0.3, vol: 0.07, type: 'triangle', slideTo: hz(16), lp: 2200 }); },
  /* the lantern at the tent flap: a warm chord opening up */
  lantern() {
    [0, 7, 12, 16].forEach((n, i) => AudioFX.note(hz(n - 12), { t: i * 0.16, dur: 2.6, attack: 0.5, vol: 0.055, type: 'triangle', lp: 1800 }));
    AudioFX.chime(9, 0.9, 0.07); AudioFX.chime(12, 1.1, 0.07);
  },
  /* the title card: a warm chord and a sparkle */
  title() {
    [0, 4, 7, 12].forEach((n, i) => AudioFX.note(hz(n), { t: i * 0.05, dur: 2.2, vol: 0.07, type: 'triangle', attack: 0.03 }));
    sparkleRun(0.3, 0.08, 0.08);
  },
  /* "Ladies and gentlemen!": a bright trumpet call, three rising notes */
  fanfare() {
    [[0, 0], [0, 0.16], [4, 0.32], [7, 0.55], [12, 0.8]].forEach(([n, t], i) => {
      AudioFX.note(hz(n), { t, dur: i === 4 ? 1.1 : 0.2, vol: 0.075, type: 'sawtooth', lp: 2400, attack: 0.02 });
      AudioFX.note(hz(n + 12), { t, dur: i === 4 ? 1.0 : 0.18, vol: 0.035, type: 'square', lp: 3000, attack: 0.02 });
    });
  },
  /* curtains drawing back: a soft swish */
  curtain() { AudioFX.noise(1.4, 900, 0.06); AudioFX.noise(1.1, 2600, 0.03, 0.15); },
  /* rolling the ball in: a gentle rumble */
  roll() { AudioFX.noise(1.6, 420, 0.06); AudioFX.note(95, { dur: 1.5, vol: 0.05, type: 'sine', slideTo: 120, lp: 300, attack: 0.2 }); },
  /* a hop on the ball: springy, each a bit higher */
  hop(i: number) { AudioFX.note(330 + i * 60, { dur: 0.18, vol: 0.075, type: 'triangle', slideTo: 600 + i * 70, lp: 2200, attack: 0.005 }); AudioFX.noise(0.08, 1400, 0.03, 0.18); },
  /* confetti pops and applause */
  applause() {
    AudioFX.note(260, { dur: 0.12, vol: 0.09, type: 'triangle', slideTo: 880, lp: 2800 }); sparkleRun(0.1, 0.05, 0.08);
    for (let i = 0; i < 40; i++) AudioFX.noise(0.06, 2400 + (i % 5) * 700, 0.04, 0.3 + i * 0.07);
  },
  /* the bow: a warm resolving chord */
  bow() { [0, 4, 7, 12, 16].forEach((n, i) => AudioFX.note(hz(n), { t: i * 0.06, dur: 2.8, attack: 0.1, vol: 0.055, type: 'triangle', lp: 2400 })); AudioFX.chime(19, 0.4, 0.08); AudioFX.chime(24, 0.55, 0.07); }
};

/* ---------- Rexy's cinematics (scenes/dino-scene.ts): a sunny meadow, a falling meteor, big stomps and one very big boom ----------
   A soft pad under the whole scene (the only long-lived sound, so a skip can fade it out), then one-shot sounds timed by the scene. */
export const DinoScore = {
  ...padControl([[-12, 'sine', 1], [-5, 'triangle', 0.5], [4, 'sine', 0.35], [7, 'sine', 0.25]], { lp: 1000, vol: 0.05, rise: 1.6 }),

  /* a sunny marimba bar for the playing dinos */
  sunny() { [12, 16, 19, 16, 21, 19, 16, 12].forEach((n, i) => AudioFX.note(hz(n), { t: i * 0.22, dur: 0.3, vol: 0.06, type: 'triangle', lp: 2600, attack: 0.005 })); },
  /* a happy little roar */
  roar() { AudioFX.note(210, { dur: 0.45, vol: 0.08, type: 'sawtooth', slideTo: 150, lp: 700, attack: 0.04 }); AudioFX.note(320, { t: 0.04, dur: 0.4, vol: 0.04, type: 'square', slideTo: 230, lp: 900, attack: 0.04 }); },
  /* a gasp: a quick rising squeak */
  gasp() { AudioFX.note(380, { dur: 0.22, vol: 0.07, type: 'sine', slideTo: 760, lp: 2400, attack: 0.01 }); },
  /* the meteor appears: a low ominous swell and a thin falling whistle */
  warning() { AudioFX.note(hz(-24), { dur: 2.6, attack: 1.4, vol: 0.07, type: 'sawtooth', lp: 380 }); AudioFX.note(hz(-17), { dur: 2.4, attack: 1.5, vol: 0.04, type: 'sawtooth', lp: 380 }); AudioFX.note(2200, { dur: 2.2, vol: 0.02, type: 'sine', slideTo: 1500, attack: 0.5 }); },
  /* it gets closer: a rumble and a whistle that falls */
  rumble(len = 2) { AudioFX.noise(len, 220, 0.1); AudioFX.note(70, { dur: len, vol: 0.07, type: 'sine', slideTo: 48, lp: 200, attack: 0.3 }); AudioFX.note(1800, { dur: len, vol: 0.03, type: 'sine', slideTo: 900, attack: 0.2 }); },
  /* Barnaby arrives with a friendly little chime */
  arrive() { AudioFX.chime(7, 0, 0.1); AudioFX.chime(12, 0.15, 0.1); AudioFX.chime(16, 0.3, 0.1); },
  /* the title card */
  title() { [0, 4, 7, 12].forEach((s, i) => AudioFX.note(hz(s), { t: i * 0.08, dur: 2.2, vol: 0.06, type: 'triangle', attack: 0.04, lp: 2400 })); sparkleRun(0.3, 0.07, 0.07); },
  /* a stomp that shakes the ground, each a bit heavier (i = 0, 1, 2...) */
  stomp(i: number) { AudioFX.note(110 - i * 8, { dur: 0.3, vol: 0.14 + i * 0.02, type: 'sine', slideTo: 45, lp: 260, attack: 0.003 }); AudioFX.noise(0.22, 180, 0.1 + i * 0.02); },
  /* the drum under it: a taiko-ish hit */
  drum(i: number) { AudioFX.note(180 - i * 10, { dur: 0.22, vol: 0.09, type: 'triangle', slideTo: 80, lp: 700, attack: 0.002 }); },
  /* a springy plank: the big dino lands and the plank snaps */
  spring() { AudioFX.note(140, { dur: 0.2, vol: 0.12, type: 'sine', slideTo: 60, lp: 300, attack: 0.003 }); AudioFX.note(300, { t: 0.05, dur: 0.5, vol: 0.08, type: 'sine', slideTo: 1200, lp: 2600, attack: 0.004 }); AudioFX.noise(0.25, 1600, 0.05, 0.05); },
  /* the ball whooshes up */
  launch() { AudioFX.noise(1.0, 900, 0.1); AudioFX.note(260, { dur: 1.0, vol: 0.06, type: 'sine', slideTo: 1400, lp: 3000, attack: 0.05 }); },
  /* the tail-bat: a whoosh, then a big WHACK */
  swing() { AudioFX.noise(0.4, 1500, 0.1); AudioFX.note(220, { dur: 0.3, vol: 0.05, type: 'sine', slideTo: 600, attack: 0.05 }); },
  whack() { AudioFX.note(210, { dur: 0.22, vol: 0.18, type: 'square', slideTo: 70, lp: 900, attack: 0.002 }); AudioFX.noise(0.2, 2200, 0.12); [0.02, 0.12].forEach(t => AudioFX.chime(12, t, 0.08)); },
  /* the meteor goes BOOM, then a tumble of sparkles */
  boom() {
    AudioFX.note(80, { dur: 1.6, vol: 0.2, type: 'sine', slideTo: 30, lp: 220, attack: 0.003 }); AudioFX.noise(1.5, 500, 0.18); AudioFX.noise(1.0, 2600, 0.08, 0.05);
    [0, 4, 7, 12, 16].forEach((s, i) => AudioFX.note(hz(s + 12), { t: 0.25 + i * 0.05, dur: 2.4, vol: 0.06, type: 'triangle', attack: 0.03 }));
    sparkleRun(0.35, 0.06, 0.09);
  },
  /* confetti and stars raining down, and cheering */
  cheer() { for (let i = 0; i < 36; i++) AudioFX.noise(0.06, 2400 + (i % 5) * 700, 0.04, 0.2 + i * 0.07); AudioFX.note(300, { dur: 0.15, vol: 0.08, type: 'triangle', slideTo: 880, lp: 2800 }); sparkleRun(0.15, 0.05, 0.08); },
  /* the ball bouncing off a head: a soft rubbery bop (i picks the pitch) */
  bop(i: number) { AudioFX.note(300 + i * 70, { dur: 0.16, vol: 0.07, type: 'sine', slideTo: 520 + i * 90, lp: 2200, attack: 0.004 }); },
  /* ... and off the wrong head: a hollow bonk */
  bonk() { AudioFX.note(240, { dur: 0.2, vol: 0.12, type: 'triangle', slideTo: 120, lp: 900, attack: 0.002 }); AudioFX.note(520, { t: 0.02, dur: 0.12, vol: 0.05, type: 'sine', slideTo: 300 }); },
  /* the meteor cracks: a dry snap, each one louder */
  crack(i: number) { AudioFX.noise(0.09, 3200, 0.1 + i * 0.03); AudioFX.note(900 - i * 120, { dur: 0.1, vol: 0.07 + i * 0.02, type: 'square', slideTo: 300, lp: 2600, attack: 0.001 }); AudioFX.noise(0.3, 400, 0.05 + i * 0.02, 0.04); },
  /* Rexy catches her star: a rising run of bells */
  catchStar() { [7, 12, 16, 19, 24].forEach((n, i) => AudioFX.chime(n, i * 0.09, 0.1)); AudioFX.note(hz(12), { t: 0.45, dur: 2, vol: 0.05, type: 'triangle', attack: 0.05, lp: 2400 }); },
  /* the last roar and a warm chord */
  bow() { DinoScore.roar(); [0, 4, 7, 12, 16].forEach((n, i) => AudioFX.note(hz(n), { t: 0.5 + i * 0.06, dur: 2.8, attack: 0.1, vol: 0.055, type: 'triangle', lp: 2400 })); AudioFX.chime(19, 0.9, 0.08); AudioFX.chime(24, 1.05, 0.07); }
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

/* ---------- the island cinematics (scenes/island-scene.ts): the crash, the tiger and Evil Larry's look, Biscuit's dig, and the rescue ----------
   A low, hopeful pad under each scene (the only long-lived sound), then one-shot hits timed by the scene: a plane's whine and falling slide,
   the crash, surf, a stalking tiger, a roar, the thunder-and-flash of Larry's look, a yelp, digging, a cave-in, and the rescue horn. */
export const IslandScore = {
  ...padControl([[-12, 'sine', 1], [-5, 'triangle', 0.6], [4, 'sine', 0.45], [9, 'sine', 0.3]], { lp: 800, vol: 0.055, rise: 2.5 }),

  /* the engines of a little plane: a steady drone that wobbles */
  engine() { [0, 0.5, 1].forEach(t => AudioFX.note(96 + t * 6, { t, dur: 0.7, vol: 0.05, type: 'sawtooth', lp: 420 })); AudioFX.noise(1.6, 900, 0.03); },
  /* one sputtering cough */
  cough() { [0, 0.22, 0.5].forEach((t, i) => AudioFX.note(130 - i * 22, { t, dur: 0.18, vol: 0.07, type: 'sawtooth', slideTo: 70, lp: 380 })); AudioFX.noise(0.5, 700, 0.06); },
  /* falling: a long whistle down */
  fall() { AudioFX.note(1500, { dur: 2.4, vol: 0.05, type: 'sine', slideTo: 180, lp: 3000 }); AudioFX.noise(2.2, 1800, 0.05, 0.1); },
  /* the crash: a heavy thud and a spray of rubble */
  crash() {
    AudioFX.note(95, { dur: 0.55, vol: 0.2, type: 'sine', slideTo: 38, lp: 420 }); AudioFX.noise(1.2, 900, 0.18); AudioFX.noise(0.9, 3000, 0.07, 0.05);
    [0.35, 0.55, 0.9].forEach(t => AudioFX.note(520, { t, dur: 0.1, vol: 0.03, type: 'triangle', slideTo: 220 }));
  },
  /* surf washing up and back */
  surf() { AudioFX.noise(3.2, 700, 0.07); AudioFX.noise(2.8, 2400, 0.03, 0.3); },
  /* a rustle in the leaves */
  rustle() { [0, 0.18, 0.4].forEach(t => AudioFX.noise(0.22, 3200, 0.05, t)); },
  /* soft padded paw steps */
  steps(n = 4) { for (let i = 0; i < n; i++) AudioFX.note(78, { t: i * 0.42, dur: 0.16, vol: 0.07, type: 'sine', slideTo: 52, lp: 260 }); },
  /* a low growl */
  growl() { AudioFX.note(70, { dur: 1.3, vol: 0.09, type: 'sawtooth', slideTo: 56, lp: 300, attack: 0.18 }); AudioFX.note(72, { t: 0.05, dur: 1.2, vol: 0.05, type: 'square', slideTo: 52, lp: 260 }); },
  /* the roar: a big rough blast */
  roar() {
    AudioFX.note(150, { dur: 1.1, vol: 0.12, type: 'sawtooth', slideTo: 82, lp: 900, attack: 0.05 }); AudioFX.note(110, { t: 0.04, dur: 1.0, vol: 0.09, type: 'square', slideTo: 60, lp: 700 });
    AudioFX.noise(1.0, 1400, 0.1);
  },
  /* the pounce: a quick whoosh */
  pounce() { AudioFX.noise(0.5, 1800, 0.1); AudioFX.note(220, { dur: 0.4, vol: 0.05, type: 'triangle', slideTo: 520 }); },
  /* a tiny squeak of fright */
  eep() { AudioFX.note(950, { dur: 0.1, vol: 0.07, type: 'sine', slideTo: 1400, attack: 0.004 }); AudioFX.note(1100, { t: 0.14, dur: 0.12, vol: 0.07, type: 'sine', slideTo: 1600, attack: 0.004 }); },
  /* Evil Larry's look: a thunderclap and a falling minor drone as his eyes blaze */
  menace() {
    AudioFX.noise(1.6, 500, 0.2); AudioFX.note(58, { dur: 1.8, vol: 0.14, type: 'sawtooth', slideTo: 44, lp: 260, attack: 0.04 });
    AudioFX.note(hz(-3), { t: 0.1, dur: 1.6, vol: 0.06, type: 'triangle', slideTo: hz(-9), lp: 700 }); AudioFX.note(hz(-9), { t: 0.1, dur: 1.6, vol: 0.05, type: 'square', lp: 500 });
  },
  /* a lightning crack */
  zap() { AudioFX.noise(0.5, 4200, 0.14); AudioFX.note(2200, { dur: 0.18, vol: 0.04, type: 'sawtooth', slideTo: 300 }); },
  /* the tiger's yelp as it flees */
  yelp() { AudioFX.note(620, { dur: 0.22, vol: 0.1, type: 'triangle', slideTo: 1050, attack: 0.01 }); AudioFX.note(900, { t: 0.2, dur: 0.3, vol: 0.09, type: 'triangle', slideTo: 380 }); },
  /* a little victory sting for the three heroes */
  hero() { heroSting(); },
  /* Biscuit's dive and tunnelling, as in the desert */
  dive() { AudioFX.note(420, { dur: 0.22, vol: 0.08, type: 'triangle', slideTo: 150, lp: 1400 }); AudioFX.noise(0.4, 1800, 0.06, 0.05); },
  dig() { [0, 0.28, 0.52, 0.9, 1.15, 1.5, 1.8].forEach(t => { AudioFX.note(105, { t, dur: 0.2, vol: 0.06, type: 'sine', slideTo: 70, lp: 300 }); AudioFX.noise(0.2, 700, 0.04, t); }); },
  /* the ground gives way */
  cave() { AudioFX.noise(1.6, 450, 0.18); AudioFX.note(82, { dur: 1.2, vol: 0.14, type: 'sine', slideTo: 36, lp: 300 }); [0.5, 0.8, 1.2].forEach(t => AudioFX.note(300, { t, dur: 0.1, vol: 0.03, type: 'triangle', slideTo: 120 })); },
  /* tumbling down: three falling squeaks */
  tumble() { [0, 0.16, 0.34].forEach((t, i) => AudioFX.note(780 - i * 120, { t, dur: 0.3, vol: 0.06, type: 'triangle', slideTo: 260 })); },
  /* a gentle thud and dust */
  thud() { AudioFX.note(90, { dur: 0.3, vol: 0.12, type: 'sine', slideTo: 45, lp: 280 }); AudioFX.noise(0.5, 900, 0.07); },
  /* a ship's far-off horn: two low, warm notes */
  horn() { AudioFX.note(hz(-17), { dur: 1.6, vol: 0.09, type: 'sawtooth', lp: 380, attack: 0.1 }); AudioFX.note(hz(-12), { t: 0.5, dur: 2.0, vol: 0.09, type: 'sawtooth', lp: 380, attack: 0.1 }); },
  /* the flare shoots up, and bursts */
  flare() { AudioFX.noise(0.9, 2600, 0.08); AudioFX.note(300, { dur: 0.9, vol: 0.05, type: 'triangle', slideTo: 1400 }); sparkleRun(0.9, 0.06, 0.08); },
  title() { titleSting(); }
};

/* ---------- the Whisker Isles cinematics (scenes/cats-scene.ts): the harbour, the red thread, the little footprints and the yarn coming home ----------
   A warm, slow pad under each scene (the only long-lived sound), then one-shot cues timed by the scene: a ship's horn, soft paw steps, a purr,
   a meow, a twang as a thread pulls tight, a mouse's squeak, a pounce, a springy bounce and a rolling-yarn whirr. */
export const CatScore = {
  ...padControl([[-12, 'sine', 1], [-5, 'triangle', 0.6], [4, 'sine', 0.45], [11, 'sine', 0.3]], { lp: 900, vol: 0.05, rise: 2.5 }),

  /* the ship's horn: two warm, low notes */
  horn() { AudioFX.note(hz(-17), { dur: 1.5, vol: 0.08, type: 'sawtooth', lp: 380, attack: 0.1 }); AudioFX.note(hz(-10), { t: 0.45, dur: 1.9, vol: 0.08, type: 'sawtooth', lp: 380, attack: 0.1 }); },
  /* waves lapping at the quay */
  lap() { AudioFX.noise(2.6, 650, 0.05); AudioFX.noise(2.2, 2200, 0.02, 0.3); },
  /* a sad little meow: a slide up and a longer fall */
  meow() { AudioFX.note(520, { dur: 0.16, vol: 0.07, type: 'triangle', slideTo: 880, attack: 0.01 }); AudioFX.note(880, { t: 0.14, dur: 0.4, vol: 0.07, type: 'triangle', slideTo: 440, attack: 0.01 }); },
  /* a happy trill of meows */
  mew() { [0, 0.16, 0.3].forEach((t, i) => AudioFX.note(700 + i * 120, { t, dur: 0.14, vol: 0.06, type: 'triangle', slideTo: 980 + i * 120, attack: 0.008 })); },
  /* a deep, slow purr */
  purr() { for (let i = 0; i < 14; i++) AudioFX.note(58, { t: i * 0.11, dur: 0.08, vol: 0.05, type: 'sawtooth', lp: 220 }); },
  /* soft padded paw steps */
  steps(n = 4) { for (let i = 0; i < n; i++) AudioFX.note(84, { t: i * 0.36, dur: 0.14, vol: 0.06, type: 'sine', slideTo: 56, lp: 260 }); },
  /* tiny scurrying feet */
  scurry(n = 8) { for (let i = 0; i < n; i++) AudioFX.note(1500 + (i % 3) * 120, { t: i * 0.06, dur: 0.04, vol: 0.03, type: 'square', lp: 2600 }); },
  /* a mouse's squeak */
  squeak() { AudioFX.note(1500, { dur: 0.1, vol: 0.06, type: 'sine', slideTo: 2100, attack: 0.004 }); AudioFX.note(1900, { t: 0.13, dur: 0.12, vol: 0.05, type: 'sine', slideTo: 2400, attack: 0.004 }); },
  /* a thread pulled tight: a plucked twang */
  twang() { AudioFX.note(330, { dur: 0.7, vol: 0.07, type: 'triangle', slideTo: 300, attack: 0.004 }); AudioFX.note(660, { dur: 0.5, vol: 0.03, type: 'sine', attack: 0.004 }); },
  /* a ball of yarn rolling: a whirr that fades */
  roll() { AudioFX.noise(1.2, 1500, 0.04, 0); AudioFX.note(180, { dur: 1.1, vol: 0.03, type: 'triangle', slideTo: 120, lp: 600 }); },
  /* a kitten's pounce: a quick whoosh and a soft thump */
  pounce() { AudioFX.noise(0.4, 1800, 0.08); AudioFX.note(240, { dur: 0.3, vol: 0.05, type: 'triangle', slideTo: 540 }); AudioFX.note(90, { t: 0.32, dur: 0.2, vol: 0.08, type: 'sine', slideTo: 50, lp: 260 }); },
  /* a springy bounce */
  boing() { AudioFX.note(220, { dur: 0.45, vol: 0.06, type: 'sine', slideTo: 520 }); AudioFX.note(520, { t: 0.2, dur: 0.3, vol: 0.04, type: 'sine', slideTo: 300 }); },
  /* a victory sting for the whole island */
  hero() { heroSting(); },
  title() { titleSting(); }
};
