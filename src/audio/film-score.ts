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
