import { $ } from '../core/dom.ts';
import { emit, on } from '../core/events.ts';
import type { PuzzleResult } from '../core/types.ts';
import { late } from '../core/util.ts';
import type { Level, TempLevel } from '../data/types.ts';
import { WARDROBE } from '../data/wardrobe.ts';
import { Daily } from '../puzzles/daily.ts';
import { EVIL_STREAK, Evil } from '../puzzles/evil.ts';
import { PUZZLE_KINDS } from '../puzzles/registry.ts';
import { Cutscene } from '../scenes/cutscene.ts';
import { currentLevel, session } from '../state/session.ts';
import { Store } from '../state/store.ts';
import { UI } from '../ui/ui.ts';
import { Victory } from '../ui/victory.ts';
import { setEvil } from './evil-mode.ts';
import { toMap } from './nav.ts';

/* ---------- Barnaby Noir: EVIL_STREAK (10) perfect results -> an evil remix of the puzzle you just solved ----------
   pending    Noir is due: the next "Continue" is interrupted by his cutscene
   returnTo   what to do after the remix (the Continue action he interrupted)
   kind/base  which puzzle kind and level the current remix is built from */
export const Noir = {
  pending: false, returnTo: null as (() => void) | null, kind: late<string>(), base: late<Level | TempLevel>(),

  noteResult(stars: number) {                                            // call once per fresh puzzle result
    this.pending = Store.notePerfect(stars) >= EVIL_STREAK;
  },

  /* wraps a "Continue" action: when Noir is due he interrupts first; declining carries on with next() */
  gate(kind: string, next: () => void) {
    if (!this.pending || (session.run && session.run.evil)) return next();
    this.pending = false;
    Store.data.perfect.streak = 0; Store.save();
    const run = session.run!, base = run.daily || (run.n ? currentLevel() : Daily.generate(Daily.today())), k = PUZZLE_KINDS[kind];
    Cutscene.play({
      boardEl: $(k.board), tileSel: k.tileSel,
      prepare: () => this.begin(kind, base)
    }).then(res => {
      if (res === 'declined') { next(); return; }
      this.returnTo = next;
      k.obj.start();
    });
  },

  begin(kind: string, base: Level | TempLevel) {
    this.kind = kind; this.base = base;
    setEvil(true);
    PUZZLE_KINDS[kind].obj.load(PUZZLE_KINDS[kind].evil(base), { freeHints: 0, onWin: r => this.onWin(r) });
  },

  onWin(result: PuzzleResult) {
    const base = this.base, kind = this.kind, key = Evil.key(kind, base);
    const first = !Store.data.evil.cleared[key];
    Store.markEvil(key);
    emit('puzzle:won', { kind, result, fresh: false });
    const count = Store.evilCount(), item = WARDROBE.find(i => i.unlock === count);
    if (first && item) setTimeout(() => UI.toast('New Noir item unlocked: ' + item.name), 1400);
    Victory.show({
      title: 'Noir Defeated!', result, rec: { isBest: false, prevBest: 0 },
      unlock: first ? 'Evil level cleared<b>+2 bonus stars for the wardrobe</b>' : 'Evil level<b>Already cleared — this was practice</b>',
      continueLabel: 'Back to the light', replayLabel: 'Another remix',
      onContinue: () => this.leave(),
      onReplay: () => { this.begin(this.kind, this.base); PUZZLE_KINDS[this.kind].obj.start(); }
    });
  },

  leave() {
    Cutscene.light(() => setEvil(false)).then(() => {
      const next = this.returnTo; this.returnTo = null;
      if (next) next(); else toMap();
    });
  }
};

/* every fresh puzzle result feeds the perfect-streak counter */
on('puzzle:won', ev => { if (ev.fresh) Noir.noteResult(ev.result.stars); });
