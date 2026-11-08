import { AudioFX } from '../audio/sfx.ts';
import { VoiceManager } from '../audio/voice.ts';
import { DEFAULT_VOICE } from './babble-rules.ts';
import type { BabbleVoice } from './babble-rules.ts';
import { parseEmphasis } from './emphasis-rules.ts';

/* Typewriter: the not-yet-typed remainder stays in layout (hidden) so text never reflows.
   *Stressed* words in the text become <span class="ty-em">; they type slower and babble higher. */
export interface TyperBear { talk(on: boolean): void }

/* a real voice recording is audible, so the made-up babble stays quiet */
const recordedClipPlaying = () => { const a = VoiceManager.current; return !!a && !a.paused && !a.ended; };

const emSpan = (text: string) => { const sp = document.createElement('span'); sp.className = 'ty-em'; sp.textContent = text; return sp; };

/* fill node with chars[from..to), wrapping runs of stressed characters in .ty-em */
function renderRange(node: HTMLElement, chars: string[], em: boolean[], from: number, to: number) {
  node.replaceChildren();
  let k = from;
  while (k < to) {
    const on = em[k], start = k;
    while (k < to && em[k] === on) k++;
    const run = chars.slice(start, k).join('');
    node.appendChild(on ? emSpan(run) : document.createTextNode(run));
  }
}

/* drop the first `n` UTF-16 units from node's text (the character just typed), removing its run once it is empty */
function shiftText(node: HTMLElement, n: number) {
  const first = node.firstChild;
  if (!first) return;
  const text = first instanceof Text ? first : first.firstChild instanceof Text ? first.firstChild : null;
  if (text) text.deleteData(0, n);
  if (!first.textContent) first.remove();
}

export class Typer {
  el: HTMLElement; bear: TyperBear | null; a: HTMLSpanElement; b: HTMLSpanElement;
  typing = false; timer: number = 0; onDone: (() => void) | null = null; chars: string[] = []; em: boolean[] = []; i = 0; ms = 26; voice: BabbleVoice = DEFAULT_VOICE;
  constructor(el: HTMLElement, bear?: TyperBear | null) {
    this.el = el; this.bear = bear || null;
    el.textContent = '';
    this.a = document.createElement('span'); this.a.className = 'ty-a';
    this.b = document.createElement('span'); this.b.className = 'ty-b';
    el.appendChild(this.a); el.appendChild(this.b);
  }
  start(text: string, opts?: { ms?: number; onDone?: () => void; voice?: BabbleVoice }) {
    this.cancel();
    opts = opts || {};
    this.voice = opts.voice || DEFAULT_VOICE;
    const parsed = parseEmphasis(text);
    this.chars = Array.from(parsed.plain); this.em = parsed.em; this.i = 0; this.ms = opts.ms || 26; this.onDone = opts.onDone || null;
    this.a.replaceChildren();
    renderRange(this.b, this.chars, this.em, 0, this.chars.length);
    this.typing = true;
    if (this.bear) this.bear.talk(true);
    this.step();
  }
  step() {
    if (!this.typing) return;
    if (!this.chars.length) { this.finishNow(); return; }
    const k = this.i++, ch = this.chars[k], stressed = this.em[k];
    this.appendTyped(ch, stressed);
    shiftText(this.b, ch.length);
    if (this.i % this.voice.every === 0 && !recordedClipPlaying()) AudioFX.babble(ch, this.voice, stressed);
    if (this.i >= this.chars.length) { this.finishNow(); return; }
    let d = stressed ? this.ms * 1.4 : this.ms;
    if ('.!?'.indexOf(ch) >= 0) d *= 7; else if (',;:'.indexOf(ch) >= 0) d *= 4;
    this.timer = setTimeout(() => this.step(), d);
  }
  /* add one typed character to the visible part, extending the current run so a stressed word's span (and its pop) stays put */
  appendTyped(ch: string, stressed: boolean) {
    const last = this.a.lastChild;
    const lastStressed = last instanceof HTMLElement;
    if (stressed) {
      if (lastStressed) { last.textContent += ch; return; }
      this.a.appendChild(emSpan(ch));
    } else if (last instanceof Text) last.data += ch;
    else this.a.appendChild(document.createTextNode(ch));
  }
  finishNow() {
    clearTimeout(this.timer);
    if (this.i < this.chars.length) renderRange(this.a, this.chars, this.em, 0, this.chars.length);   // skipped: show it all (a natural finish already has)
    this.b.replaceChildren();
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
