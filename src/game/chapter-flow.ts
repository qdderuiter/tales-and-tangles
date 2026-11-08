import { AudioFX } from '../audio/sfx.ts';
import { emit } from '../core/events.ts';
import type { PuzzleResult } from '../core/types.ts';
import { LEVELS } from '../data/levels.ts';
import type { Level, StoryPart } from '../data/types.ts';
import { STORY } from '../dialogue/story-builder.ts';
import { CaseScreen } from '../puzzles/case/case-screen.ts';
import { PUZZLE_KINDS } from '../puzzles/registry.ts';
import { chapterRun, currentLevel, session } from '../state/session.ts';
import type { ChapterRun } from '../state/session.ts';
import { Store } from '../state/store.ts';
import { StoryScreen } from '../ui/story-screen.ts';
import { UI } from '../ui/ui.ts';
import { Victory } from '../ui/victory.ts';
import { DEFAULT_STEPS, STEPS, stepLabel } from './chapter-steps.ts';
import { toMap } from './nav.ts';
import { Noir } from './noir-flow.ts';

/* ---------- a chapter (a "case") ----------
   A chapter is a list of steps (chapter-steps.ts): by default intro -> Words -> bridge -> Scent Trail -> Suspects -> outro.
   run = { n, replay, freeHints, earned, notes, steps, step }; replay runs (from the map pips) skip the story and return to the map.
   The steps call back into this object: lv(), playStory(), toCase(); a step that finishes calls advance(). */
export const Chapter = {
  lv(): Level { return currentLevel() as Level; },

  newRun(n: number, replay?: boolean): ChapterRun {
    const steps = ((LEVELS[n - 1] && LEVELS[n - 1].steps) || DEFAULT_STEPS).slice();
    const earned: Record<string, boolean> = {}; steps.forEach(id => { if (PUZZLE_KINDS[id]) earned[id] = false; });      // each puzzle step earns one clue
    return { n, replay: !!replay, freeHints: 0, earned, notes: null, steps, step: 0 };
  },
  earnedText(kind: string) { const c = this.lv().case.clues.find(x => x.earned === kind); return CaseScreen.highlight(c ? c.t : ''); },

  start(n: number) {
    session.run = this.newRun(n, false);
    this.runStep();
  },

  /* run the current step of the chapter; past the last step the chapter is over */
  runStep() {
    const run = chapterRun(), id = run.steps[run.step], step = STEPS[id];
    if (!id) toMap();
    else if (step) step.run(this);
    else this.startPuzzle(id);
  },
  advance() { chapterRun().step++; this.runStep(); },
  goto(id: string) { const run = chapterRun(); run.step = run.steps.indexOf(id); this.runStep(); },

  /* replay one step from the map pips; a solved chapter has already earned every clue */
  playStep(n: number, kind: string) {
    const run = session.run = this.newRun(n, true);
    run.step = run.steps.indexOf(kind);
    if (PUZZLE_KINDS[kind]) { this.startPuzzle(kind); return; }
    Object.keys(run.earned).forEach(k => { run.earned[k] = true; });
    this.toCase();
  },

  /* a story step: Barnaby talks, then on to the next step. `before` (optional) is a cinematic that plays first and returns a promise. */
  playStory(part: StoryPart, title: string, before?: (() => Promise<void>) | null) {
    const lv = this.lv();
    StoryScreen.show(lv, title);
    const begin = () => StoryScreen.play(STORY[lv.n][part], {
      onChoice: ch => { if (ch.gift) { chapterRun().freeHints++; UI.toast('+1 free hint added to your notebook'); AudioFX.chime(6); } },
      onDone: () => this.advance()
    });
    if (before) before().then(begin); else begin();
  },

  /* kind: a puzzle id registered in puzzles/registry.ts */
  startPuzzle(kind: string) {
    const k = PUZZLE_KINDS[kind];
    UI.show(k.screen);
    k.obj.load(this.lv(), { freeHints: chapterRun().freeHints, onWin: r => this.onPuzzleWin(kind, r) });
    k.obj.start();
  },

  onPuzzleWin(kind: string, result: PuzzleResult) {
    const run = chapterRun(), k = PUZZLE_KINDS[kind];
    run.freeHints = k.obj.freeHints; run.earned[kind] = true;
    const rec = Store.recordPuzzle(run.n, kind as 'word' | 'zip', result);
    emit('puzzle:won', { kind, result, fresh: true });
    const bw = result.bonusWords || 0;
    Victory.show({
      title: k.title, result, rec, unlock: 'New clue in your notebook<b>' + this.earnedText(kind) + '</b>' +
        (bw ? '<small class="note">+' + bw + ' hidden word' + (bw === 1 ? '' : 's') + ' found</small>' : ''),
      continueLabel: run.replay ? 'Back to case files' : stepLabel(run.steps[run.step + 1]), replayLabel: 'Replay',
      onContinue: () => Noir.gate(kind, () => run.replay ? toMap() : this.advance()),
      onReplay: () => this.startPuzzle(kind)
    });
  },

  toCase() {
    UI.show('case');
    CaseScreen.load(this.lv(), chapterRun(), penalty => this.onSolved(penalty));
  },

  onSolved(penalty: number) {
    const run = chapterRun(), n = run.n, next = LEVELS[n];  // LEVELS[n] is chapter n+1
    Store.recordSolved(n, penalty);
    session.justUnlocked = next ? next.n : 0;
    const result = { stars: Store.stars(n), score: Store.score(n) };
    const card = () => { emit('progress'); Victory.show({          // badges after any cinematic, so their toasts don't land mid-scene
      title: 'Case Solved!', result, rec: { isBest: false, prevBest: 0 },
      unlock: next ? 'Story unlocked<b>Chapter ' + next.n + ': ' + next.title + '</b>' : 'Every mystery solved<b>You are a true detective!</b>',
      continueLabel: run.replay ? 'Back to case files' : (next ? 'Continue the story' : 'Hear the ending'), replayLabel: 'Replay case',
      onContinue: () => run.replay ? toMap() : this.advance(),
      onReplay: () => { session.run = this.newRun(n, false); this.goto(chapterRun().steps.find(id => PUZZLE_KINDS[id])!); }
    }); };
    const lv = LEVELS[n - 1];
    if (lv.caughtScene) lv.caughtScene().then(card); else card();   // e.g. Evil Larry is caught red-pawed first
  }
};
