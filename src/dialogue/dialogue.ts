import { VoiceManager } from '../audio/voice.ts';
import { DEFAULT_SPEAKER, SPEAKERS, SPEAKER_CLASSES, lineMs } from './speakers.ts';
import { Typer } from './typer.ts';

export class Dialogue {
  constructor(o) {
    this.nameEl = o.nameEl; this.choicesEl = o.choicesEl; this.caret = o.caret; this.bear = o.bear;
    this.typer = new Typer(o.textEl, o.bear);
    this.lines = []; this.i = -1; this.active = false; this.waiting = false;
    this.onChoice = null; this.onDone = null;
  }
  play(lines, opts) {
    opts = opts || {};
    this.lines = lines.slice(); this.i = -1;
    this.onChoice = opts.onChoice || null; this.onDone = opts.onDone || null; this.onSpeaker = opts.onSpeaker || this.defaultSpeaker || null;
    this.active = true;
    this.next();
  }
  next() {
    this.i++;
    if (this.i >= this.lines.length) { this.end(); return; }
    this.show(this.lines[this.i]);
  }
  show(line) {
    this.waiting = false;
    this.choicesEl.innerHTML = '';
    this.caret.classList.remove('on');
    const who = line.who || DEFAULT_SPEAKER, sp = SPEAKERS[who] || {};
    this.nameEl.textContent = who;
    SPEAKER_CLASSES.forEach(c => this.nameEl.classList.toggle(c, c === sp.nameClass));
    if (this.onSpeaker) this.onSpeaker(who, line.e || 'neutral');
    if (!sp.ownPortrait) this.bear.react(line.e || 'neutral');
    VoiceManager.play(line.id);
    this.typer.start(line.t, { ms: lineMs(line, 26), onDone: () => this.afterType(line) });
  }
  afterType(line) {
    if (line.choices) {
      this.waiting = true;
      const armedAt = performance.now() + 380;   // the tap that skipped typing must not also pick a choice that appears under the finger
      line.choices.forEach((ch, idx) => {
        const b = document.createElement('button');
        b.className = 'btn choice';
        b.textContent = ch.label;
        b.style.animationDelay = (idx * 90) + 'ms';
        b.addEventListener('click', ev => { ev.stopPropagation(); if (performance.now() >= armedAt) this.choose(line, ch, idx); });
        this.choicesEl.appendChild(b);
      });
    } else this.caret.classList.add('on');
  }
  choose(line, ch, idx) {
    if (!this.waiting) return;
    this.choicesEl.innerHTML = '';
    this.waiting = false;
    if (this.onChoice) this.onChoice(ch);
    this.lines.splice(this.i + 1, 0, Object.assign({ id: line.id + '_c' + idx, who: DEFAULT_SPEAKER }, ch.reply));
    this.next();
  }
  tap() {
    if (!this.active) return;
    if (this.typer.typing) { this.typer.skip(); return; }
    if (this.waiting) return;
    this.next();
  }
  end() {
    if (!this.active) return;
    this.active = false; this.waiting = false;
    this.typer.cancel();
    VoiceManager.stop();
    this.choicesEl.innerHTML = '';
    this.caret.classList.remove('on');
    if (this.onSpeaker) this.onSpeaker(DEFAULT_SPEAKER, 'neutral', true);
    const cb = this.onDone; this.onDone = null;
    if (cb) cb();
  }
}
