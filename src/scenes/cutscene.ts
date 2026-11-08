import { Haptics } from '../audio/haptics.ts';
import { AudioFX } from '../audio/sfx.ts';
import { Barnaby } from '../characters/barnaby.ts';
import type { Bear } from '../characters/barnaby.ts';
import { $, fitCanvas, setShown } from '../core/dom.ts';
import { REDUCED, clamp, late, rand } from '../core/util.ts';
import type { Choice } from '../data/types.ts';
import { Dialogue } from '../dialogue/dialogue.ts';
import { NOIR_LINES } from './noir-lines.ts';

/* ---------- the interactive cutscene engine ----------
   Dialogue -> break three seals (tap) -> the board shatters into 3D shards you can fling -> the shards spring back as the remixed level.
   Everything is driven by the pointer: parallax tilt, cracks, shard flicks. Always skippable; reduced-motion gets a plain dissolve. */
export interface CutsceneOpts { boardEl: HTMLElement; tileSel: string; prepare(): void }
interface Shard {
  el: HTMLElement; f: HTMLElement; b: HTMLElement; w: number; h: number; cx: number; cy: number;
  x: number; y: number; z: number; vx: number; vy: number; vz: number; rx: number; ry: number; rz: number; vrx: number; vry: number; vrz: number;
}
interface Ember { x: number; y: number; vx: number; vy: number; life: number; max: number; s: number }
/* what measureTiles() reads off one tile */
interface TileBox { left: number; top: number; w: number; h: number; bg: string; shadow: string; radius: string; text: string | null; color: string | null; fontSize: string | null }

/* fields marked late() are filled by init() / play() before anything reads them */
export const Cutscene = {
  els: {} as Record<string, HTMLElement>, dlg: late<Dialogue>(), bear: late<Bear>(), running: false, fast: false, phase: '', opts: late<CutsceneOpts>(), prepared: false,
  tilt: { rx: 0, ry: 0, trx: 0, try: 0, wrx: Infinity, wry: Infinity },   // w* = last values written to the stage
  ptr: { x: 0, y: 0, vx: 0, vy: 0, t: 0 }, shards: [] as Shard[], embers: [] as Ember[], raf: 0, W: 0, H: 0,
  _pending: null as (() => void) | null, _beginRes: null as (() => void) | null,
  ctx: late<CanvasRenderingContext2D>(), nr: null as DOMRect | null,

  init() {
    const e = this.els;
    ['noir', 'noirBg', 'noirFog', 'noirStage', 'noirShards', 'noirBear', 'noirCracks', 'noirSeals', 'noirEmbers', 'noirHint', 'noirDlg', 'noirBegin', 'noirSkip', 'noirFlash']
      .forEach(id => { e[id] = $('#' + id); });
    this.bear = Barnaby.create(e.noirBear, { noir: true });
    this.dlg = new Dialogue({ nameEl: $('#noirName'), textEl: $('#noirText'), choicesEl: $('#noirChoices'), caret: $('#noirCaret'), bear: this.bear });
    e.noirDlg.addEventListener('pointerdown', ev => { if (!(ev.target as Element).closest('.dlg-choices')) this.dlg.tap(); });
    e.noirSkip.addEventListener('click', () => this.skip());
    e.noirBegin.addEventListener('click', () => { if (this._beginRes) this._beginRes(); });
    e.noir.addEventListener('pointermove', ev => this.onMove(ev));
    e.noir.addEventListener('pointerdown', ev => this.onDown(ev));
    window.addEventListener('resize', () => { if (this.running) this.sizeCanvas(); });   // keep the cached rect fresh on rotate / URL-bar collapse
  },

  /* opts: { boardEl, tileSel, prepare() }  ->  Promise<'declined' | 'done'> */
  async play(opts: CutsceneOpts): Promise<'declined' | 'done'> {
    if (this.running) return 'declined';
    this.running = true; this.fast = false; this.opts = opts; this.prepared = false; this.phase = 'dialog';
    const e = this.els;
    e.noirSeals.innerHTML = ''; e.noirCracks.innerHTML = ''; e.noirShards.innerHTML = ''; this.shards = [];
    e.noirBegin.classList.remove('on'); e.noirHint.classList.remove('on');
    this.tilt.trx = this.tilt.try = 0;
    this.sizeCanvas();
    setShown(e.noir, true);
    this.loop();
    if (!REDUCED) e.noirBear.animate([{ transform: 'translate3d(0,110%,-260px) rotateX(40deg)', opacity: 0 }, { transform: 'translate3d(0,0,70px) rotateX(0)', opacity: 1 }],
      { duration: 1100, easing: 'cubic-bezier(.2,1.25,.3,1)', fill: 'forwards' });
    this.bear.react('happy');
    AudioFX.thud();

    const accepted = await this.runDialog();
    if (!accepted) { await this.close(); return 'declined'; }
    if (REDUCED) { this.prepareOnce(); await this.wait(500); await this.close(); return 'done'; }
    await this.breakSeals();
    await this.shatter();
    await this.reassemble();
    await this.waitBegin();
    await this.close();
    return 'done';
  },

  prepareOnce() { if (!this.prepared) { this.prepared = true; this.opts.prepare(); } },
  wait(ms: number) { return new Promise<void>(res => { if (this.fast) { res(); return; } this._pending = res; setTimeout(() => { if (this._pending === res) this._pending = null; res(); }, ms); }); },

  runDialog() {
    return new Promise<boolean>(res => {
      let accepted = false;
      this.els.noirDlg.classList.add('on');
      this.dlg.play(NOIR_LINES, { onChoice: (ch: Choice) => { accepted = !!ch.evil; }, onDone: () => { this.els.noirDlg.classList.remove('on'); res(accepted); } });
    });
  },

  /* ---- 1. break the seals (interactive) ---- */
  boardRects() {
    const nr = this.els.noir.getBoundingClientRect();
    return { nr, br: this.opts.boardEl.getBoundingClientRect() };
  },
  /* read every tile's box and look in one pass (no writes in between, so layout is computed once) */
  measureTiles(nr: { left: number; top: number }): TileBox[] {
    return Array.from(this.opts.boardEl.querySelectorAll(this.opts.tileSel)).map(t => {
      const face: Element = t.firstElementChild || t, r = face.getBoundingClientRect(), cs = getComputedStyle(face), sp = face.querySelector('span'), ss = sp && getComputedStyle(sp);
      return { left: r.left - nr.left, top: r.top - nr.top, w: r.width, h: r.height, bg: cs.backgroundColor, shadow: cs.boxShadow, radius: cs.borderRadius,
               text: sp ? sp.textContent : null, color: ss && ss.color, fontSize: ss && ss.fontSize };
    });
  },
  buildShards() {
    const { nr } = this.boardRects(), e = this.els, frag = document.createDocumentFragment();
    this.shards = this.measureTiles(nr).map(m => {
      const el = document.createElement('div'); el.className = 'shard';
      el.style.cssText = 'left:' + m.left + 'px;top:' + m.top + 'px;width:' + m.w + 'px;height:' + m.h + 'px';
      const f = document.createElement('div'); f.className = 'sf';
      f.style.cssText = 'background:' + m.bg + ';box-shadow:' + m.shadow + ';border-radius:' + m.radius;
      if (m.text !== null) { f.textContent = m.text; f.style.color = m.color!; f.style.fontSize = m.fontSize!; }
      const b = document.createElement('div'); b.className = 'sb';
      el.appendChild(f); el.appendChild(b); frag.appendChild(el);
      return { el, f, b, w: m.w, h: m.h, cx: m.left + m.w / 2, cy: m.top + m.h / 2, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, vrx: 0, vry: 0, vrz: 0 };
    });
    e.noirShards.appendChild(frag);
    this.opts.boardEl.style.visibility = 'hidden';
  },
  breakSeals() {
    return new Promise<void>(res => {
      this.phase = 'seals';
      const e = this.els;
      this.buildShards();
      e.noirHint.textContent = 'Tap the glowing seals to break the level!'; e.noirHint.classList.add('on');
      const { nr, br } = this.boardRects();
      const pts = [[0.2, 0.3], [0.78, 0.45], [0.45, 0.8]].map(([fx, fy]) => ({ x: br.left - nr.left + fx * br.width, y: br.top - nr.top + fy * br.height }));
      let left = pts.length;
      this._pending = res;
      pts.forEach((p, k) => {
        const s = document.createElement('button');
        s.className = 'seal'; s.style.left = p.x + 'px'; s.style.top = p.y + 'px'; s.setAttribute('aria-label', 'Break seal ' + (k + 1));
        s.addEventListener('pointerdown', ev => ev.stopPropagation());
        s.addEventListener('click', () => {
          if (s.dataset.broken) return;
          s.dataset.broken = '1';
          this.hitSeal(s, p, pts.length - left);
          left--;
          if (!left) setTimeout(() => { e.noirHint.classList.remove('on'); this._pending = null; res(); }, 520);
        });
        e.noirSeals.appendChild(s);
      });
    });
  },
  hitSeal(s: HTMLElement, p: { x: number; y: number }, index: number) {
    const e = this.els;
    AudioFX.thud(); AudioFX.chime(2 + index * 2, 0.02, 0.12); Haptics.tangle();
    this.crack(p.x, p.y);
    this.flash('#ffd9ff', 0.45, 320);
    e.noirStage.animate([{ translate: '0 0' }, { translate: '-9px 5px' }, { translate: '8px -6px' }, { translate: '-4px 3px' }, { translate: '0 0' }], { duration: 300 });
    s.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.9)', opacity: 0 }], { duration: 360, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => s.remove(), 380);
    this.bear.react(index === 2 ? 'surprised' : 'happy');
    this.addEmbers(p.x, p.y, 26);
  },
  crack(px: number, py: number) {
    const nr = this.els.noir.getBoundingClientRect(), cx = px / nr.width * 100, cy = py / nr.height * 100, svg = this.els.noirCracks;
    for (let b = 0; b < 7; b++) {
      let a = rand(0, Math.PI * 2), x = cx, y = cy;
      const pts = [x.toFixed(1) + ',' + y.toFixed(1)];
      for (let s = 0; s < 4; s++) { a += rand(-0.7, 0.7); const len = rand(5, 12); x += Math.cos(a) * len; y += Math.sin(a) * len * 0.8; pts.push(x.toFixed(1) + ',' + y.toFixed(1)); }
      const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      pl.setAttribute('class', 'crack'); pl.setAttribute('pathLength', '1'); pl.setAttribute('points', pts.join(' '));
      svg.appendChild(pl);
      pl.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 240 + b * 25, easing: 'ease-out', fill: 'forwards' });
    }
  },

  /* ---- 2. the shatter: 3D shards with simple physics; drag through them to fling them ---- */
  shatter() {
    return new Promise<void>(res => {
      this.phase = 'shatter';
      const e = this.els;
      e.noirSeals.innerHTML = '';
      this.flash('#ffffff', 0.95, 520);
      AudioFX.fanfare(); AudioFX.thud(); Haptics.win();
      this.glitch(900);
      this.bear.react('surprised');
      e.noirHint.textContent = 'Fling the pieces!'; e.noirHint.classList.add('on');
      const { br, nr } = this.boardRects();
      const ox = br.left - nr.left + br.width / 2, oy = br.top - nr.top + br.height / 2;
      this.shards.forEach(s => {
        const dx = s.cx - ox, dy = s.cy - oy, d = Math.hypot(dx, dy) || 1, sp = rand(5, 12);
        s.vx = dx / d * sp + rand(-2, 2); s.vy = dy / d * sp * 0.8 - rand(1, 5); s.vz = rand(5, 26);
        s.vrx = rand(-5, 5); s.vry = rand(-7, 7); s.vrz = rand(-6, 6);
      });
      this.addEmbers(ox, oy, 70);
      const t0 = performance.now();
      this._pending = res;
      const step = (now: number) => {
        if (this.phase !== 'shatter') return;
        if (now - t0 > 3000 || this.fast) { e.noirHint.classList.remove('on'); this._pending = null; res(); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  },
  physics(dt: number) {                                                      // shards only move while shattered (reassembly is driven by WAAPI)
    if (this.phase !== 'shatter') return;
    const gravity = 0.16;
    this.shards.forEach(s => {
      s.vy += gravity * dt; s.vx *= 0.993; s.vy *= 0.996; s.vz *= 0.99;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      s.rx += s.vrx * dt; s.ry += s.vry * dt; s.rz += s.vrz * dt;
      s.vrx *= 0.99; s.vry *= 0.99; s.vrz *= 0.99;
      const ax = s.cx + s.x, ay = s.cy + s.y;                         // keep the pieces on screen: soft walls
      if (ax < 10 || ax > this.W - 10) { s.vx *= -0.6; s.x = clamp(ax, 10, this.W - 10) - s.cx; }
      if (ay < 10 || ay > this.H - 10) { s.vy *= -0.6; s.y = clamp(ay, 10, this.H - 10) - s.cy; }
      s.z = clamp(s.z, -200, 260);
      s.el.style.transform = 'translate3d(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px,' + s.z.toFixed(1) + 'px) rotateX(' + s.rx.toFixed(1) + 'deg) rotateY(' + s.ry.toFixed(1) + 'deg) rotateZ(' + s.rz.toFixed(1) + 'deg)';
    });
  },
  /* flick: a moving finger pushes nearby shards; a tap sends a shock wave */
  onMove(ev: PointerEvent) {
    const nr = this.nr || this.els.noir.getBoundingClientRect(), x = ev.clientX - nr.left, y = ev.clientY - nr.top, now = performance.now(), p = this.ptr;
    const dtp = Math.max(1, now - p.t);
    p.vx = (x - p.x) / dtp * 16.7; p.vy = (y - p.y) / dtp * 16.7; p.x = x; p.y = y; p.t = now;
    this.tilt.try = clamp((x / nr.width - 0.5) * 2, -1, 1) * 9;
    this.tilt.trx = clamp((y / nr.height - 0.5) * 2, -1, 1) * -7;
    if (this.phase === 'shatter') {
      this.shards.forEach(s => {
        const dx = s.cx + s.x - x, dy = s.cy + s.y - y;
        if (dx * dx + dy * dy < 80 * 80) { s.vx += clamp(p.vx, -30, 30) * 0.18; s.vy += clamp(p.vy, -30, 30) * 0.18; s.vz += 2.5; s.vrz += rand(-3, 3); s.vry += rand(-3, 3); }
      });
    }
  },
  onDown(ev: PointerEvent) {
    if (this.phase !== 'shatter') return;
    const nr = this.els.noir.getBoundingClientRect(), x = ev.clientX - nr.left, y = ev.clientY - nr.top;
    AudioFX.tick(Math.floor(rand(2, 9)));
    this.shards.forEach(s => {
      const dx = s.cx + s.x - x, dy = s.cy + s.y - y, d = Math.hypot(dx, dy) || 1;
      if (d < 150) { const k = (150 - d) / 150 * 9; s.vx += dx / d * k; s.vy += dy / d * k; s.vz += k * 1.4; s.vrx += rand(-6, 6); s.vry += rand(-8, 8); }
    });
    this.addEmbers(x, y, 14);
  },

  /* ---- 3. reassemble: shards spring into the NEW layout and flip to reveal the dark tiles ---- */
  reassemble() {
    return new Promise<void>(res => {
      this.phase = 'reassemble';
      const e = this.els;
      e.noirHint.classList.remove('on');
      this.flash('#c77dff', 0.8, 600);
      this.prepareOnce();                                            // loads the evil level and switches the theme (board stays hidden)
      this.opts.boardEl.style.visibility = 'hidden';
      const targets = this.measureTiles(e.noir.getBoundingClientRect());   // all reads first, then the writes below
      let maxEnd = 0;
      this.shards.forEach((s, i) => {
        const m = targets[i];
        if (!m) { s.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }); return; }
        const curX = s.cx + s.x, curY = s.cy + s.y;                    // current centre
        const tcx = m.left + m.w / 2, tcy = m.top + m.h / 2;
        s.el.style.left = m.left + 'px'; s.el.style.top = m.top + 'px'; s.el.style.width = m.w + 'px'; s.el.style.height = m.h + 'px';
        s.b.style.cssText = 'background:' + m.bg + ';border-radius:' + m.radius;
        s.b.textContent = m.text !== null ? m.text : '';
        if (m.text !== null) { s.b.style.fontSize = m.fontSize!; s.b.style.color = m.color!; }
        const norm = (a: number) => ((a % 360) + 540) % 360 - 180;
        const from = 'translate3d(' + (curX - tcx).toFixed(1) + 'px,' + (curY - tcy).toFixed(1) + 'px,' + s.z.toFixed(1) + 'px) rotateX(' + norm(s.rx).toFixed(1) + 'deg) rotateY(' + norm(s.ry).toFixed(1) + 'deg) rotateZ(' + norm(s.rz).toFixed(1) + 'deg)';
        const to = 'translate3d(0,0,0) rotateX(0deg) rotateY(180deg) rotateZ(0deg)';
        const dur = 900 + i * 14;
        maxEnd = Math.max(maxEnd, dur + i * 22);
        s.el.style.transform = from;
        s.el.animate([{ transform: from }, { transform: to }], { duration: dur, delay: i * 22, easing: 'cubic-bezier(.2,1.3,.35,1)', fill: 'forwards' });
      });
      this._pending = res;
      setTimeout(() => { this._pending = null; res(); }, maxEnd + 120);
      AudioFX.chime(4); AudioFX.chime(7, 0.15); AudioFX.chime(11, 0.3);
    });
  },
  waitBegin() {
    return new Promise<void>(res => {
      this.phase = 'begin';
      if (this.fast) { res(); return; }
      const e = this.els;
      this.bear.react('happy');
      e.noirHint.textContent = 'The level is not what it was...'; e.noirHint.classList.add('on');
      e.noirBegin.classList.add('on');
      this._beginRes = () => { this._beginRes = null; e.noirBegin.classList.remove('on'); e.noirHint.classList.remove('on'); res(); };
    });
  },
  async close() {
    const e = this.els;
    this.prepareOnce();
    this.opts.boardEl.style.visibility = '';
    setShown(e.noir, false);
    await new Promise<void>(r => setTimeout(r, 420));
    e.noirShards.innerHTML = ''; e.noirSeals.innerHTML = ''; e.noirCracks.innerHTML = ''; this.shards = [];
    this.running = false; this.phase = '';
    this.dlg.end();
  },
  skip() {
    if (!this.running) return;
    if (this.phase === 'dialog') { this.dlg.end(); return; }          // before accepting, skipping = "not today"
    this.fast = true;
    this.prepareOnce();
    if (this._pending) { const r = this._pending; this._pending = null; r(); }
    if (this._beginRes) this._beginRes();
  },

  /* ---- effects ---- */
  flash(color: string, peak: number, ms: number) {
    const f = this.els.noirFlash;
    f.style.background = color;
    f.animate([{ opacity: 0 }, { opacity: peak, offset: 0.25 }, { opacity: 0 }], { duration: ms });
  },
  glitch(ms: number) {                                                       // SVG displacement filter on the whole app for a moment
    const app = $('#app'), map = $('#glitchMap'), noise = $('#glitchNoise');
    if (!map || !noise) return;
    app.style.filter = 'url(#glitch)';
    const t0 = performance.now();
    const step = (now: number) => {
      const k = (now - t0) / ms;
      if (k >= 1) { app.style.filter = ''; map.setAttribute('scale', '0'); return; }
      map.setAttribute('scale', String(Math.round(Math.sin(k * Math.PI) * 46 * (0.5 + Math.random() * 0.5))));
      noise.setAttribute('baseFrequency', '0.002 ' + (0.04 + Math.random() * 0.06).toFixed(3));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
  sizeCanvas() {
    this.W = this.els.noir.clientWidth; this.H = this.els.noir.clientHeight;
    this.ctx = fitCanvas(this.els.noirEmbers as HTMLCanvasElement, this.W, this.H).ctx;
    this.nr = this.els.noir.getBoundingClientRect();                 // cached for pointer moves (the overlay is fixed)
  },
  addEmbers(x: number, y: number, n: number) {
    if (REDUCED) return;
    for (let i = 0; i < n; i++) this.embers.push({ x: x + rand(-14, 14), y: y + rand(-14, 14), vx: rand(-1.6, 1.6), vy: rand(-3.4, -0.6), life: 0, max: rand(40, 90), s: rand(1.5, 4) });
    if (this.embers.length > 260) this.embers.splice(0, this.embers.length - 260);
  },
  /* one rAF loop while the cutscene runs: parallax tilt, shard physics, embers */
  loop() {
    cancelAnimationFrame(this.raf);
    let last = performance.now();
    const frame = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(2.2, (now - last) / 16.7); last = now;
      const t = this.tilt;
      t.rx += (t.trx - t.rx) * 0.12 * dt; t.ry += (t.try - t.ry) * 0.12 * dt;
      if (Math.abs(t.rx - t.wrx) > 0.01 || Math.abs(t.ry - t.wry) > 0.01) {     // skip the restyle once the tilt has settled
        t.wrx = t.rx; t.wry = t.ry;
        this.els.noirStage.style.setProperty('--rx', t.rx.toFixed(2) + 'deg'); this.els.noirStage.style.setProperty('--ry', t.ry.toFixed(2) + 'deg');
      }
      this.physics(dt);
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.W, this.H);
      if (!REDUCED && this.phase !== 'dialog' && Math.random() < 0.7) this.embers.push({ x: rand(0, this.W), y: this.H + 6, vx: rand(-0.4, 0.4), vy: rand(-1.8, -0.7), life: 0, max: rand(90, 160), s: rand(1, 2.6) });
      const em = this.embers;
      let k = 0;
      for (let i = 0; i < em.length; i++) {                                   // update, draw and compact in place (no per-frame array)
        const p = em[i];
        if (p.life >= p.max) continue;
        em[k++] = p;
        p.life += dt; p.x += p.vx * dt + Math.sin(p.life * 0.1) * 0.3; p.y += p.vy * dt;
        const a = 1 - p.life / p.max;
        ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = a > 0.55 ? '#ffd29a' : '#ff6a5a';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (0.5 + a * 0.5), 0, Math.PI * 2); ctx.fill();
      }
      em.length = k;
      ctx.globalAlpha = 1;
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  },
  /* a quick bright wipe used when leaving the evil version ("back to the light") */
  light(fn: () => void) {
    return new Promise<void>(res => {
      const e = this.els;
      e.noir.classList.add('lightmode'); setShown(e.noir, true);
      e.noirFlash.style.background = '#fff6e0';
      setTimeout(fn, 260);
      e.noirFlash.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 720 }).onfinish = () => {
        e.noir.classList.remove('lightmode'); setShown(e.noir, false); res();
      };
      AudioFX.chime(9); AudioFX.chime(12, 0.1);
    });
  }
};
