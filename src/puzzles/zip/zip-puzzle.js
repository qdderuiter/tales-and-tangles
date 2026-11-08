import { Haptics } from '../../audio/haptics.js';
import { AudioFX } from '../../audio/sfx.js';
import { $, flashClass, replayClass } from '../../core/dom.js';
import { ZIP_COLORS } from '../../data/palette.js';
import { REACT } from '../../data/story.js';
import { Typer } from '../../dialogue/typer.js';
import { Sparks } from '../../fx/sparks.js';
import { PuzzleBase } from '../puzzle-base.js';
import { registerPuzzle } from '../registry.js';
import { Scoring } from '../scoring.js';
import { checkpointMap, isSolvedTrail, prefixLength, zipAdjacent, zipCode, zipRC, zipWallBetween } from './zip-rules.js';

export const ZipPuzzle = Object.assign({}, PuzzleBase, {
  cols: 5, rows: 5, hitR2: 0.2116,
  lvl: null, z: null, n: 5, K: 0, path: [], cpAt: new Map(), cpList: [], tracing: false, pointerId: null, lastPt: null,
  hints: 0, freeHints: 0, hintStage: 0, backtracks: 0, elapsed: 0, running: false, lastTick: 0, timerId: 0,
  tiles: [], hintTimers: [], onWin: null, bear: null, bubble: null, els: {}, lastBump: 0, lastSay: 0, shownLetters: 0,

  init(bear) {
    this.bear = bear;
    const e = this.els;
    e.grid = $('#zGrid'); e.svg = $('#zLines'); e.clue = $('#zClue'); e.prog = $('#zProg'); e.time = $('#zTime');
    e.title = $('#zTitle'); e.badge = $('#zHintBadge'); e.sparks = Sparks.create($('#zSparks')); e.theme = $('#zTheme');
    this.bubble = new Typer($('#zBubble'), bear);
    e.grid.addEventListener('pointerdown', ev => this.onDown(ev));
    e.grid.addEventListener('pointermove', ev => this.onMove(ev));
    e.grid.addEventListener('pointerup', ev => this.onUp(ev));
    e.grid.addEventListener('pointercancel', ev => this.onUp(ev));
    $('#btnZHint').addEventListener('click', () => this.hint());
    $('#btnZReset').addEventListener('click', () => this.resetTrail());
  },

  code(r, c) { return zipCode(this.n, r, c); },
  rc(code) { return zipRC(this.n, code); },
  wallBetween(a, b) { return zipWallBetween(this.z, a, b); },
  adjacent(a, b) { return zipAdjacent(this.n, a, b); },
  cpsReached() { let k = 0; this.path.forEach(c => { if (this.cpAt.has(c)) k++; }); return k; },

  load(lvl, opts) {
    this.stop();
    this.lvl = lvl; this.z = lvl.zip; this.n = this.cols = this.rows = this.z.size; this.K = this.z.cps.length;
    this.sol = this.z.path.map(([r, c]) => this.code(r, c));
    this.drawn = []; this.headEl = null; this.shownReached = -1; this.shownSec = -1;
    this.freeHints = (opts && opts.freeHints) || 0;
    this.onWin = (opts && opts.onWin) || null;
    this.path = []; this.tracing = false; this.pointerId = null;
    this.hints = 0; this.hintStage = 0; this.backtracks = 0; this.elapsed = 0; this.shownLetters = 0;
    this.hintTimers.forEach(clearTimeout); this.hintTimers = [];
    this.cpAt = checkpointMap(this.z);
    const n = this.n, g = this.els.grid;
    g.style.gridTemplateColumns = 'repeat(' + n + ',1fr)'; g.style.gridTemplateRows = 'repeat(' + n + ',1fr)';
    g.querySelectorAll('.zt').forEach(t => t.remove());
    this.tiles = [];
    for (let i = 0; i < n * n; i++) {
      const t = document.createElement('div');
      t.className = 'zt'; t.innerHTML = '<div class="zf"></div>';
      g.insertBefore(t, this.els.svg);
      this.tiles.push(t);
    }
    const svg = this.els.svg;
    svg.setAttribute('viewBox', '0 0 ' + n * 100 + ' ' + n * 100);
    let walls = '', cps = '';
    this.z.walls.forEach(w => {
      const [a, b] = w.split('-').map(Number), [ar, ac] = this.rc(a), [br] = this.rc(b);
      if (ar === br) { const x = (ac + 1) * 100; walls += '<line x1="' + x + '" y1="' + ar * 100 + '" x2="' + x + '" y2="' + (ar + 1) * 100 + '"/>'; }
      else { const y = (ar + 1) * 100; walls += '<line x1="' + ac * 100 + '" y1="' + y + '" x2="' + (ac + 1) * 100 + '" y2="' + y + '"/>'; }
    });
    this.z.cps.forEach(cp => {
      cps += '<g class="zcp" data-n="' + cp.num + '"><circle cx="' + (cp.c * 100 + 50) + '" cy="' + (cp.r * 100 + 50) + '" r="31"/><text x="' + (cp.c * 100 + 50) + '" y="' + (cp.r * 100 + 52) + '">' + cp.num + '</text></g>';
    });
    svg.innerHTML = '<polyline id="zLine" points=""/><g class="zcps">' + cps + '</g><g class="zwalls">' + walls + '</g>';
    this.els.line = svg.querySelector('#zLine');
    this.els.cps = Array.from(svg.querySelectorAll('.zcp'));
    const color = ZIP_COLORS[(lvl.n - 1) % ZIP_COLORS.length];
    this.els.line.style.stroke = color;
    g.style.setProperty('--zc', color + '55');
    this.els.clue.innerHTML = this.z.word.split('').map(() => '<span class="zl">?</span>').join('');
    this.els.theme.innerHTML = '<b>Trail word</b> (' + this.z.word.length + ' letters): ' + (lvl.trailHint || 'follow the numbers');
    this.els.title.textContent = (lvl.evil ? 'Noir Trail' : 'Scent Trail') + ' · ' + lvl.title;
    this.refresh(); this.updateBadge();
    this.say(REACT.zipStart);
  },

  /* ---- input (pointer capture, interpolated onMove and cellAt come from PuzzleBase) ---- */
  hit(p, loose) { const h = this.cellAt(p, loose); return h ? h.r * this.n + h.c : -1; },
  onDown(e) {
    if (!this.running || this.tracing || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    this.measure();
    const p = this.toCell(e), code = this.hit(p, true);
    if (code < 0) return;
    if (!this.path.length) {
      const cp = this.cpAt.get(code);
      if (!cp || cp.num !== 1) { this.nudgeStart(); return; }
      this.path = [code]; AudioFX.tick(0);
    } else {
      const idx = this.path.indexOf(code);
      if (idx < 0) return;                                   // must grab your own trail
      this.rewindTo(idx);
    }
    this.hintStage = 0;
    this.capture(e, p);
    this.refresh();
  },
  onUp(e) {
    if (!this.tracing || e.pointerId !== this.pointerId) return;
    this.tracing = false; this.pointerId = null;
  },
  rewindTo(idx) {
    const removed = this.path.length - 1 - idx;
    if (removed <= 0) return;
    if (removed >= 3) this.backtracks++;
    this.path.length = idx + 1;
  },
  visit(p) {
    const code = this.hit(p, false);
    if (code < 0) return false;
    const path = this.path, last = path[path.length - 1];
    if (code === last) return false;
    const idx = path.indexOf(code);
    if (idx >= 0) { this.rewindTo(idx); AudioFX.tick(this.path.length - 1); this.hintStage = 0; return true; }
    if (!this.adjacent(last, code)) return false;
    if (this.wallBetween(last, code)) { this.bump(false); return false; }
    const cp = this.cpAt.get(code);
    if (cp) {
      if (cp.num !== this.cpsReached() + 1) { this.bump(true); return false; }
      if (cp.num === this.K && path.length + 1 !== this.n * this.n) { this.bump(true); return false; }   // the last number must be the last tile
    }
    path.push(code);
    this.hintStage = 0;
    AudioFX.tick(path.length - 1);
    const now = performance.now();
    if (now - (this.lastSpark || 0) > 70) {                 // a little spark trail off the head
      this.lastSpark = now;
      const [hr, hc] = this.rc(code);
      this.els.sparks.burst([{ x: (hc + 0.5) / this.n, y: (hr + 0.5) / this.n }], [this.els.line.style.stroke || '#e8836a', '#fff'], 3);
    }
    if (cp) this.onCheckpoint(cp);
    if (path.length === this.n * this.n && cp && cp.num === this.K) { this.tracing = false; this.finish(); }
    return true;
  },
  bump(orderMsg) {
    const now = performance.now();
    if (now - this.lastBump > 350) { AudioFX.bump(); this.lastBump = now; }
    if (orderMsg && now - this.lastSay > 5000) this.say(REACT.zipOrder);
  },
  nudgeStart() {
    const cp1 = this.z.cps[0], t = this.tiles[this.code(cp1.r, cp1.c)];
    replayClass(t, 'hint');
    this.hintTimers.push(setTimeout(() => t.classList.remove('hint'), 1600));
    AudioFX.bump();
  },
  onCheckpoint(cp) {
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');       // expanding ripple on the checkpoint
    ring.setAttribute('class', 'zring'); ring.setAttribute('cx', cp.c * 100 + 50); ring.setAttribute('cy', cp.r * 100 + 50); ring.setAttribute('r', 31);
    this.els.svg.appendChild(ring);
    setTimeout(() => ring.remove(), 850);
    this.els.sparks.burst([{ x: (cp.c + 0.5) / this.n, y: (cp.r + 0.5) / this.n }], ['#f7c948', '#fff', '#ffb347'], 12);
    AudioFX.chime(cp.num - 1);
    if (cp.letter) { Haptics.found(); this.bear.react('happy'); }
  },

  /* incremental redraw: only tiles past the common prefix with the last drawn path change; checkpoints/clue only when the count changes */
  refresh() {
    const n = this.n, path = this.path, prev = this.drawn;
    let k = 0;
    while (k < prev.length && k < path.length && prev[k] === path[k]) k++;
    for (let i = k; i < prev.length; i++) this.tiles[prev[i]].classList.remove('on');
    for (let i = k; i < path.length; i++) this.tiles[path[i]].classList.add('on');
    if (this.headEl) this.headEl.classList.remove('head');
    this.headEl = path.length ? this.tiles[path[path.length - 1]] : null;
    if (this.headEl) this.headEl.classList.add('head');
    this.drawn = path.slice();
    this.els.line.setAttribute('points', path.map(c => { const [r, cc] = this.rc(c); return (cc * 100 + 50) + ',' + (r * 100 + 50); }).join(' '));
    this.els.prog.textContent = path.length + '/' + n * n;
    const reached = this.cpsReached();
    if (reached === this.shownReached) return;
    this.shownReached = reached;
    this.els.cps.forEach(g => g.classList.toggle('got', Number(g.dataset.n) <= reached));
    const letters = this.z.cps.filter(cp => cp.letter && cp.num <= reached).map(cp => cp.letter);
    const slots = this.els.clue.children;
    for (let i = 0; i < slots.length; i++) {
      const has = i < letters.length;
      slots[i].textContent = has ? letters[i] : '?';
      slots[i].classList.toggle('on', has);
      if (has && i >= this.shownLetters) replayClass(slots[i], 'pop');
    }
    this.shownLetters = letters.length;
  },

  /* ---- validation ---- */
  validateSolved() { return isSolvedTrail(this.z, this.path); },
  finish() {
    if (!this.validateSolved()) return;
    this.running = false;
    clearInterval(this.timerId);
    const result = Scoring.compute({ elapsedMs: this.elapsed, wrongs: this.backtracks, hints: this.hints, wrongs3: 6, wrongs2: 12 });
    this.refresh();
    setTimeout(() => { if (this.onWin) this.onWin(result); }, 1000);
  },

  /* ---- hint ladder: nudge (free) -> highlight next tiles -> extend the trail ---- */
  prefixLen() { return prefixLength(this.path, this.sol); },
  hint() {
    if (!this.running) return;
    if (this.lvl.evil && (this.hints >= 2 || this.hintStage >= 2)) { this.say(REACT.evilNoHelp); return; }
    const sol = this.sol, m = this.prefixLen();
    if (this.hintStage === 0) {
      this.hintStage = 1;
      this.say(this.path.length > m ? REACT.zipHint1Off : REACT.zipHint1Go);
      return;
    }
    this.spend();
    if (this.hintStage === 1) {
      this.hintStage = 2;
      sol.slice(m, m + 2).forEach(c => flashClass(this.tiles[c], 'hint', 3200, this.hintTimers));
      AudioFX.chime(4);
      this.say(REACT.zipHint2);
      return;
    }
    // stage 2: rewind to the last correct tile and lay down 3 correct steps
    if (this.path.length > m) this.path.length = m;
    const from = this.path.length;
    for (let i = from; i < Math.min(from + (from ? 3 : 4), sol.length); i++) {
      this.path.push(sol[i]);
      const cp = this.cpAt.get(sol[i]);
      if (cp) this.onCheckpoint(cp);
    }
    this.hintStage = 0;
    AudioFX.chime(6);
    this.say(REACT.zipHint3);
    this.refresh();
    if (this.path.length === this.n * this.n) this.finish();
  },
  resetTrail() {
    if (!this.running || !this.path.length) return;
    this.path = []; this.hintStage = 0; this.tracing = false;
    AudioFX.bump();
    this.refresh();
  }
});

registerPuzzle('zip', { obj: ZipPuzzle, screen: 'zip', board: '#zGrid', tileSel: '.zt', title: 'Trail Followed!',
                        evil: base => Object.assign({}, base, { zip: base.evilZip, evil: true }) });
