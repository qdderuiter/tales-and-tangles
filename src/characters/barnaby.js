import { Music } from '../audio/music.js';
import { AudioFX } from '../audio/sfx.js';
import { BROWS, MOUTHS, Outfit, bearMarkup } from './barnaby-svg.js';
import { replayClass } from '../core/dom.js';
import { REDUCED, clamp, pick, rand } from '../core/util.js';
import { NOIR_OUTFIT, SLOTS } from '../data/wardrobe.js';
import { UI } from '../ui/ui.js';

export const FLOAT_COLORS = { '♪': '#7b6bd6', '♥': '#e55a8a', z: '#6f9fd0' };

export const Barnaby = {
  instances: [], lastInput: 0,
  create(host, opts) {
    host.innerHTML = bearMarkup(opts && opts.noir ? NOIR_OUTFIT : Outfit.current);
    const root = host.querySelector('.bear');
    const inst = {
      host, root, emotion: 'neutral', talkTimer: 0, blinkTimer: 0,
      lastInput: performance.now(), nextAct: performance.now() + rand(8000, 14000),
      asleep: false, busy: false, purring: false, zTimer: 0, heartTimer: 0, purrStop: null, noir: false,
      browL: root.querySelector('.brow-l'), browR: root.querySelector('.brow-r'),
      mClosed: root.querySelector('.mouth-closed'), mOpen: root.querySelector('.mouth-open'),
      pupils: Array.from(root.querySelectorAll('.pupil-g')), svg: root.querySelector('.bear-svg'),
      react(emo, bounce) {
        const e = BROWS[emo] ? emo : 'neutral';
        this.emotion = e;
        this.browL.setAttribute('d', BROWS[e][0]); this.browR.setAttribute('d', BROWS[e][1]);
        this.mClosed.setAttribute('d', MOUTHS[e][0]); this.mOpen.setAttribute('d', MOUTHS[e][1]);
        if (!this.talkTimer) this.rest();
        if (bounce !== false) this.bounce();
      },
      rest() { this.root.classList.toggle('open', this.emotion === 'surprised'); },
      talk(on) {
        clearInterval(this.talkTimer); this.talkTimer = 0;
        if (on) {
          this.root.classList.add('open');
          this.talkTimer = setInterval(() => this.root.classList.toggle('open'), 115);
        } else this.rest();
      },
      bounce() { replayClass(this.root, 'bounce'); },
      blink() {
        this.root.classList.add('blink');
        setTimeout(() => this.root.classList.remove('blink'), 140);
      },
      scheduleBlink() {
        this.blinkTimer = setTimeout(() => {
          if (!document.hidden && !this.asleep) {
            this.blink();
            if (Math.random() < 0.22) setTimeout(() => this.blink(), 260);
          }
          this.scheduleBlink();
        }, rand(2200, 5200));
      },
      /* eye tracking is split into a read (rect) and a write so all bears are measured before any is changed */
      lookAt(r, x, y) {
        if (!r.width) return;
        const dx = clamp((x - (r.left + r.width / 2)) / (r.width * 1.2), -1, 1);
        const dy = clamp((y - (r.top + r.height * 0.42)) / (r.height * 1.2), -1, 1);
        this.pupils.forEach(p => { p.style.transform = 'translate(' + (dx * 3).toFixed(2) + 'px,' + (dy * 2.4).toFixed(2) + 'px)'; });
      },

      /* ---- outfit ---- */
      dress(outfit) {
        SLOTS.forEach(slot => { this.root.querySelector('.slot-' + slot).innerHTML = Outfit.svg(slot, outfit[slot]); });
      },

      setSkin(on) {                                      // Barnaby Noir: darker coat, red eyes, fedora and cape
        this.noir = !!on; this.root.classList.toggle('noirskin', this.noir);
        this.dress(this.noir ? NOIR_OUTFIT : Outfit.current);
      },
      /* ---- idle life ---- */
      visible() {
        const s = this.host.closest('.screen, .overlay, .noir');
        return !s || s.classList.contains('active') || s.classList.contains('show');
      },
      touch(now) {                                      // pointer input (seen by idleTick): he notices you
        this.lastInput = now;
        this.nextAct = now + rand(8000, 14000);
        if (this.asleep) this.wake();
      },
      float(glyph) {
        const s = document.createElement('span');
        s.className = 'bfloat'; s.textContent = glyph; s.style.color = FLOAT_COLORS[glyph] || '#8b5a3c';
        s.style.setProperty('--dx', Math.round(rand(-22, 22)) + 'px'); s.style.left = Math.round(rand(46, 68)) + '%';
        this.root.appendChild(s);
        setTimeout(() => s.remove(), 2300);
      },
      endAct(ms, fn) {
        this.busy = true;
        setTimeout(() => { this.busy = false; if (fn) fn(); if (!this.talkTimer) this.rest(); }, ms);
      },
      act(name) {
        if (this.asleep || this.busy) return;
        const r = this.root.classList;
        if (name === 'yawn') {
          r.add('yawn', 'open'); this.endAct(1700, () => r.remove('yawn'));
        } else if (name === 'look') {
          r.add('looking');
          const sweep = [[0, -3, 0], [550, 3, 0], [1100, 0, 1]];
          sweep.forEach(([t, x, y]) => setTimeout(() => this.pupils.forEach(p => { p.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }), t));
          this.endAct(2000, () => r.remove('looking'));
        } else if (name === 'hum') {
          const prev = this.emotion; this.react('happy', false); r.add('sway');
          [0, 750, 1500].forEach(t => setTimeout(() => this.float('♪'), t));
          this.endAct(2500, () => { r.remove('sway'); this.react(prev, false); });
        }
      },
      idleTick() {
        if (Barnaby.lastInput > this.lastInput) this.touch(Barnaby.lastInput);
        if (REDUCED || this.talkTimer || !this.visible()) return;
        const now = performance.now();
        if (!this.asleep && now - this.lastInput > 40000) { this.sleep(); return; }
        if (this.asleep || this.busy) return;
        if (now > this.nextAct) { this.nextAct = now + rand(9000, 15000); this.act(pick(['yawn', 'look', 'hum'])); }
      },
      sleep() {
        if (this.asleep) return;
        this.asleep = true; this.root.classList.add('asleep');
        this.float('z');
        this.zTimer = setInterval(() => this.float('z'), 1800);
      },
      wake() {
        if (!this.asleep) return;
        this.asleep = false; this.root.classList.remove('asleep');
        clearInterval(this.zTimer); this.zTimer = 0;
        this.react('surprised');
        setTimeout(() => this.react('happy', false), 700);
      },
      bob(q) {
        if (REDUCED || this.asleep) return;
        this.svg.classList.remove('bobL', 'bobR'); void this.svg.offsetWidth; this.svg.classList.add(q % 2 ? 'bobL' : 'bobR');
      },

      /* ---- pokes ---- */
      tipHat() {
        replayClass(this.root, 'tip');
        AudioFX.chime(2); AudioFX.chime(5, 0.1);
        setTimeout(() => this.root.classList.remove('tip'), 900);
      },
      purrOn() {
        if (this.purring) return;
        this.purring = true; this.root.classList.add('purr'); this.react('happy', false);
        this.purrStop = AudioFX.purr();
        this.float('♥'); this.heartTimer = setInterval(() => this.float('♥'), 600);
      },
      purrOff() {
        if (!this.purring) return;
        this.purring = false; this.root.classList.remove('purr');
        clearInterval(this.heartTimer); this.heartTimer = 0;
        if (this.purrStop) { this.purrStop(); this.purrStop = null; }
      }
    };
    inst.scheduleBlink();
    if (opts && opts.noir) inst.setSkin(true);
    this.instances.push(inst);
    return inst;
  },
  dressAll(outfit) { this.instances.forEach(b => b.dress(b.noir ? NOIR_OUTFIT : outfit)); },
  init() {
    let pending = null, raf = 0;
    document.addEventListener('pointermove', e => {
      pending = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!pending) return;
        const bears = this.instances.filter(b => !b.busy && b.visible());
        const rects = bears.map(b => b.root.getBoundingClientRect());           // all reads first, then all writes
        bears.forEach((b, i) => b.lookAt(rects[i], pending.clientX, pending.clientY));
      });
    }, { passive: true });
    /* pointer input keeps him awake: down is handled at once; moves only stamp the time (idleTick catches up), except to wake a sleeper */
    document.addEventListener('pointerdown', () => { const now = performance.now(); this.instances.forEach(b => b.touch(now)); }, { passive: true, capture: true });
    document.addEventListener('pointermove', () => {
      const now = this.lastInput = performance.now();
      this.instances.forEach(b => { if (b.asleep) b.touch(now); });
    }, { passive: true, capture: true });
    setInterval(() => this.instances.forEach(b => b.idleTick()), 1000);
    Music.onBeat(q => this.instances.forEach(b => { if (b.visible()) b.bob(q); }));    // nod along to the lofi
  },
  /* tap = startled chime, double-tap = tips his hat, hold = purrs, ten quick pokes = grumbles */
  makePokeable(inst) {
    const h = inst.host;
    let pid = null, holdTimer = 0, lastTap = 0, pokes = [];
    h.addEventListener('pointerdown', e => {
      pid = e.pointerId; clearTimeout(holdTimer);
      holdTimer = setTimeout(() => inst.purrOn(), 600);
    });
    const end = (e, cancelled) => {
      if (e.pointerId !== pid) return;
      pid = null; clearTimeout(holdTimer);
      if (inst.purring) { inst.purrOff(); return; }
      if (cancelled) return;
      const now = performance.now();
      if (now - lastTap < 340) { lastTap = 0; inst.tipHat(); }
      else {
        lastTap = now;
        AudioFX.chime(Math.floor(rand(0, 6)));
        inst.react('surprised');
        setTimeout(() => inst.react('happy', false), 800);
      }
      pokes = pokes.filter(t => now - t < 10000); pokes.push(now);
      if (pokes.length >= 10) { pokes = []; UI.toast("Hey! I'm working here!"); inst.react('sad'); }
    };
    h.addEventListener('pointerup', e => end(e, false));
    h.addEventListener('pointercancel', e => end(e, true));
    h.addEventListener('pointerleave', e => end(e, true));
  }
};
