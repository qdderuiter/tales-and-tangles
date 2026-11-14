import { AudioFX } from './sfx.ts';
import { on } from '../core/events.ts';
import { chapterOf } from '../data/chapters.ts';
import { session } from '../state/session.ts';
import { Store } from '../state/store.ts';

/* ---------- background music: three looping mp3 tracks in public/music/ ----------
   title = Village at Dusk (title and every menu), case = Curious Melody (story, puzzles, notebook), evil = Smoky Night Sketch (Barnaby Noir).
   Each track is an <audio> element routed through the Web Audio graph (track gain -> duck gain -> AudioFX.master), so it sits under the
   sound effects, ducks under fanfares and speech, and fades out under a chapter film. Changing screens crossfades. */
export type TrackKey = 'title' | 'case' | 'evil' | 'oasis' | 'circus' | 'dino' | 'cave' | 'island' | 'cats';

/* fallback: the track that plays instead while this one's file is missing (a chapter track can ship later) */
export const TRACKS: Record<TrackKey, { src: string; bpm: number; fallback?: TrackKey }> = {
  title: { src: 'music/village-at-dusk.mp3', bpm: 80 },
  case: { src: 'music/curious-melody.mp3', bpm: 80 },
  evil: { src: 'music/smoky-night-sketch.mp3', bpm: 70 },
  oasis: { src: 'music/midnight-oasis.mp3', bpm: 84, fallback: 'case' },     // Chapter 6 (data/chapters.ts: track: 'oasis')
  dino: { src: 'music/curious-whistle.mp3', bpm: 110, fallback: 'case' },      // Chapter 8 (data/chapters.ts: track: 'dino')
  cave: { src: 'music/cave-puzzle.mp3', bpm: 90, fallback: 'case' },          // Chapter 9 (data/chapters.ts: track: 'cave'); the bpm is a guess
  island: { src: 'music/island-puzzle.mp3', bpm: 100, fallback: 'case' },       // Chapter 10 (data/chapters.ts: track: 'island'); the bpm is a guess
  cats: { src: 'music/cat-paradise.mp3', bpm: 96, fallback: 'case' },        // Chapter 11: not used until public/music/cat-paradise.mp3 exists AND data/chapters.ts sets track: 'cats' on it
  circus: { src: 'music/big-top.mp3', bpm: 100, fallback: 'case' }          // Chapter 7: not used until public/music/big-top.mp3 exists AND data/chapters.ts sets track: 'circus' on it
};

const LEVEL = 0.62;     // sits under the sound effects
const FADE = 0.6;       // crossfade time constant, seconds

/* Opened straight from disk (file://) the browser treats the mp3 as cross-origin and mutes a media element that is routed through Web Audio.
   There the tracks play on the element's own volume instead (a small tween does the fades; iOS ignores element volume, but it never runs from disk). */
const DIRECT = typeof location !== 'undefined' && location.protocol === 'file:';

interface Player { el: HTMLAudioElement; gain: GainNode | null; pauseTimer: number; lvl: number; cur: number }

export const Music = {
  ctx: null as AudioContext | null, duckG: null as GainNode | null, players: {} as Partial<Record<TrackKey, Player>>,
  duckTimer: 0, duckLevel: 1, duckNow: 1, duckGoal: 1, tween: 0, duckStep: 0.1, inFilm: false, running: false, hiddenPause: false,
  want: 'title' as TrackKey, current: null as TrackKey | null,
  beatCbs: [] as ((q: number) => void)[], beatTimer: 0, beat: 0,

  /* the shared duck node, created together with the audio context */
  graph(ctx: AudioContext) {
    if (!this.duckG) { this.duckG = ctx.createGain(); this.duckG.connect(AudioFX.master); }
    return this.duckG;
  },
  player(key: TrackKey, ctx: AudioContext): Player | null {
    const have = this.players[key];
    if (have) return have;
    try {
      const el = new Audio(TRACKS[key].src);
      el.loop = true; el.preload = 'auto';
      const fb = TRACKS[key].fallback;
      if (fb) el.addEventListener('error', () => { if (this.current === key) this.switchTo(fb); });      // the file is not there: play the shared track
      let gain: GainNode | null = null;
      if (!DIRECT) { gain = ctx.createGain(); gain.gain.value = 0; ctx.createMediaElementSource(el).connect(gain); gain.connect(this.graph(ctx)); } else el.volume = 0;
      return (this.players[key] = { el, gain, pauseTimer: 0, lvl: 0, cur: 0 });
    } catch { return null; }
  },
  fadeIn(key: TrackKey) {
    const ctx = this.ctx!, p = this.player(key, ctx);
    if (!p) return;
    clearTimeout(p.pauseTimer);
    this.level(p, LEVEL, FADE / 2);
    const r = p.el.play(); if (r && r.catch) r.catch(() => {});
  },
  fadeOut(key: TrackKey, pauseAfter = true) {
    const p = this.players[key], ctx = this.ctx;
    if (!p || !ctx) return;
    this.level(p, 0, FADE / 3);
    if (pauseAfter) { clearTimeout(p.pauseTimer); p.pauseTimer = window.setTimeout(() => { try { p.el.pause(); } catch { /* ignore */ } }, FADE * 1500); }
  },
  /* ramp a track toward a level: a gain node normally, the element volume when opened from disk */
  level(p: Player, v: number, tc: number) {
    if (p.gain) { const g = p.gain.gain, t = this.ctx!.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(v, t, tc); return; }
    p.lvl = v; this.runTween();
  },
  runTween() {
    if (this.tween) return;
    this.tween = window.setInterval(() => {
      let moving = false;
      const dd = this.duckGoal - this.duckNow;
      this.duckNow = Math.abs(dd) < 0.004 ? this.duckGoal : this.duckNow + dd * this.duckStep;
      for (const p of Object.values(this.players)) {
        if (!p) continue;
        const goal = p.lvl * this.duckNow, d = goal - p.cur;
        p.cur = Math.abs(d) < 0.004 ? goal : p.cur + d * 0.12;
        p.el.volume = Math.min(1, Math.max(0, p.cur));
        if (p.cur !== goal) moving = true;
      }
      if (!moving && this.duckNow === this.duckGoal) { clearInterval(this.tween); this.tween = 0; }
    }, 40);
  },
  /* the duck / film level on the shared node (or, from disk, on every element) */
  duckTo(v: number, tc: number) {
    if (DIRECT) { this.duckGoal = v; this.duckStep = tc < 0.2 ? 0.3 : 0.1; this.runTween(); return; }
    const g = this.duckG!.gain, t = this.ctx!.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(v, t, tc);
  },
  /* play the wanted track, fading out whichever was playing */
  switchTo(key: TrackKey) {
    if (this.current === key) { this.fadeIn(key); return; }
    if (this.current) this.fadeOut(this.current);
    this.current = key; this.fadeIn(key);
    this.restartBeat();
  },

  start() {
    if (!Store.data.settings.music) return;
    const ctx = AudioFX.ensure();
    if (!ctx) return;
    this.ctx = ctx; this.graph(ctx);
    if (this.running) { this.fadeIn(this.current ?? this.want); return; }
    this.running = true;
    this.switchTo(this.want);
  },
  stop() {
    this.running = false; clearInterval(this.beatTimer); this.beatTimer = 0;
    (Object.keys(this.players) as TrackKey[]).forEach(k => this.fadeOut(k));
    this.current = null;
  },
  setEnabled(on: boolean) { if (on) this.start(); else this.stop(); },
  scene(name: string, level: number, evil: boolean) {
    const inLevel = name === 'puzzle' || name === 'zip' || name === 'sketch' || name === 'case' || name === 'story';
    const chapterTrack = chapterOf(level)?.track as TrackKey | undefined;          // a chapter may bring its own music
    this.want = evil && inLevel ? 'evil' : inLevel ? (chapterTrack && chapterTrack in TRACKS ? chapterTrack : 'case') : 'title';
    if (this.running) this.switchTo(this.want);
  },
  duck(ms: number, level = 0.35) {                              // dip under fanfares and speech; a shallower dip never cuts a deeper one short
    if (!this.duckG || this.inFilm) return;
    this.duckLevel = Math.min(this.duckLevel, level);
    this.duckTo(this.duckLevel, 0.08);
    clearTimeout(this.duckTimer);
    this.duckTimer = window.setTimeout(() => { this.duckLevel = 1; this.duckTo(1, 0.5); }, ms);
  },
  /* a chapter film brings its own score: the music fades out under it and back in after */
  setFilm(playing: boolean) {
    this.inFilm = playing;
    if (!this.duckG) return;
    clearTimeout(this.duckTimer); this.duckLevel = 1;
    this.duckTo(playing ? 0 : 1, playing ? 0.25 : 0.7);
  },
  setHidden(h: boolean) {                                        // save battery in background tabs
    if (!this.running || !this.current) return;
    const p = this.players[this.current];
    if (h) { this.hiddenPause = true; clearInterval(this.beatTimer); this.beatTimer = 0; try { p?.el.pause(); } catch { /* ignore */ } }
    else if (this.hiddenPause) {
      this.hiddenPause = false;
      this.ctx?.resume().catch(() => {});
      const r = p?.el.play(); if (r && r.catch) r.catch(() => {});
      this.restartBeat();
    }
  },

  /* Barnaby nods along: a steady pulse at the playing track's tempo, one tick per quarter note (0-3 within the bar) */
  onBeat(cb: (q: number) => void) { this.beatCbs.push(cb); if (this.running && !this.beatTimer && !this.hiddenPause) this.restartBeat(); },
  restartBeat() {
    clearInterval(this.beatTimer); this.beatTimer = 0; this.beat = 0;
    if (!this.current || !this.beatCbs.length) return;
    this.beatTimer = window.setInterval(() => { const q = this.beat++ % 4; this.beatCbs.forEach(cb => cb(q)); }, 60000 / TRACKS[this.current].bpm);
  }
};

/* the music follows the screen and the Noir switch (UI.show and setEvil just announce them) */
function syncScene() {
  const run = session.run;
  Music.scene(session.screen, run ? run.n : 0, !!(run && run.evil));
}
on('screen', syncScene);
on('evil:changed', syncScene);
on('audio:duck', ({ ms, level }) => Music.duck(ms, level));
on('film', ({ on: playing }) => Music.setFilm(playing));
on('settings:changed', ({ key, on: enabled }) => { if (key === 'music') Music.setEnabled(enabled); });
