import { AudioFX } from '../audio/sfx.js';

/* Typewriter: the not-yet-typed remainder stays in layout (hidden) so text never reflows */
export class Typer {
  constructor(el, bear) {
    this.el = el; this.bear = bear;
    el.textContent = '';
    this.a = document.createElement('span'); this.a.className = 'ty-a';
    this.b = document.createElement('span'); this.b.className = 'ty-b';
    el.appendChild(this.a); el.appendChild(this.b);
    this.typing = false; this.timer = 0; this.onDone = null; this.text = ''; this.chars = []; this.i = 0; this.off = 0; this.ms = 26;
  }
  start(text, opts) {
    this.cancel();
    opts = opts || {};
    this.text = text; this.chars = Array.from(text); this.i = 0; this.off = 0; this.ms = opts.ms || 26; this.onDone = opts.onDone || null;
    this.a.textContent = ''; this.b.textContent = text;
    this.typing = true;
    if (this.bear) this.bear.talk(true);
    this.step();
  }
  step() {
    if (!this.typing) return;
    if (!this.chars.length) { this.finishNow(); return; }
    const ch = this.chars[this.i++];
    this.off += ch.length;                            // string offset (a char may be a surrogate pair)
    this.a.textContent = this.text.slice(0, this.off);
    this.b.textContent = this.text.slice(this.off);
    if (/\S/.test(ch) && this.i % 2 === 0) AudioFX.talk();
    if (this.i >= this.chars.length) { this.finishNow(); return; }
    let d = this.ms;
    if ('.!?'.indexOf(ch) >= 0) d *= 7; else if (',;:'.indexOf(ch) >= 0) d *= 4;
    this.timer = setTimeout(() => this.step(), d);
  }
  finishNow() {
    clearTimeout(this.timer);
    this.a.textContent = this.text; this.b.textContent = '';
    this.typing = false;
    if (this.bear) this.bear.talk(false);
    const cb = this.onDone; this.onDone = null;
    if (cb) cb();
  }
  skip() { if (!this.typing) return false; this.finishNow(); return true; }
  cancel() {
    clearTimeout(this.timer);
    this.typing = false; this.onDone = null;
    if (this.bear) this.bear.talk(false);
  }
}
