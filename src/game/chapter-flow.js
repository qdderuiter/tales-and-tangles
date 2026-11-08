import { AudioFX } from '../audio/sfx.js';
import { emit } from '../core/events.js';
import { LEVELS } from '../data/levels.js';
import { STORY } from '../dialogue/story-builder.js';
import { CaseScreen } from '../puzzles/case/case-screen.js';
import { PUZZLE_KINDS } from '../puzzles/registry.js';
import { currentLevel, session } from '../state/session.js';
import { Store } from '../state/store.js';
import { StoryScreen } from '../ui/story-screen.js';
import { UI } from '../ui/ui.js';
import { Victory } from '../ui/victory.js';
import { DEFAULT_STEPS, STEPS, stepLabel } from './chapter-steps.js';
import { toMap } from './nav.js';
import { Noir } from './noir-flow.js';

/* ---------- a chapter (a "case") ----------
   A chapter is a list of steps (chapter-steps.js): by default intro -> Words -> bridge -> Scent Trail -> Suspects -> outro.
   run = { n, replay, freeHints, earned, notes, steps, step }; replay runs (from the map pips) skip the story and return to the map.
   The steps call back into this object: lv(), playStory(), toCase(); a step that finishes calls advance(). */
export const Chapter = {
  lv: currentLevel,

  newRun(n, replay) {
    const steps = ((LEVELS[n - 1] && LEVELS[n - 1].steps) || DEFAULT_STEPS).slice();
    const earned = {}; steps.forEach(id => { if (PUZZLE_KINDS[id]) earned[id] = false; });      // each puzzle step earns one clue
    return { n, replay: !!replay, freeHints: 0, earned, notes: null, steps, step: 0 };
  },
  earnedText(kind) { const c = this.lv().case.clues.find(x => x.earned === kind); return CaseScreen.highlight(c ? c.t : ''); },

  start(n) {
    session.run = this.newRun(n, false);
    this.runStep();
  },

  /* run the current step of the chapter; past the last step the chapter is over */
  runStep() {
    const run = session.run, id = run.steps[run.step], step = STEPS[id];
    if (!id) toMap();
    else if (step) step.run(this);
    else this.startPuzzle(id);
  },
  advance() { session.run.step++; this.runStep(); },
  goto(id) { session.run.step = session.run.steps.indexOf(id); this.runStep(); },

  /* replay one step from the map pips; a solved chapter has already earned every clue */
  playStep(n, kind) {
    const run = session.run = this.newRun(n, true);
    run.step = run.steps.indexOf(kind);
    if (PUZZLE_KINDS[kind]) { this.startPuzzle(kind); return; }
    Object.keys(run.earned).forEach(k => { run.earned[k] = true; });
    this.toCase();
  },

  /* a story step: Barnaby talks, then on to the next step. `before` (optional) is a cinematic that plays first and returns a promise. */
  playStory(part, title, before) {
    const lv = this.lv();
    StoryScreen.show(lv, title);
    const begin = () => StoryScreen.play(STORY[lv.n][part], {
      onChoice: ch => { if (ch.gift) { session.run.freeHints++; UI.toast('+1 free hint added to your notebook'); AudioFX.chime(6); } },
      onDone: () => this.advance()
    });
    if (before) before().then(begin); else begin();
  },

  /* kind: a puzzle id registered in puzzles/registry.js */
  startPuzzle(kind) {
    const k = PUZZLE_KINDS[kind];
    UI.show(k.screen);
    k.obj.load(this.lv(), { freeHints: session.run.freeHints, onWin: r => this.onPuzzleWin(kind, r) });
    k.obj.start();
  },

  onPuzzleWin(kind, result) {
    const run = session.run, k = PUZZLE_KINDS[kind];
    run.freeHints = k.obj.freeHints; run.earned[kind] = true;
    const rec = Store.recordPuzzle(run.n, kind, result);
    emit('puzzle:won', { kind, result, fresh: true });
    const bw = result.bonusWords | 0;
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
    CaseScreen.load(this.lv(), session.run, penalty => this.onSolved(penalty));
  },

  onSolved(penalty) {
    const run = session.run, n = run.n, next = LEVELS[n];  // LEVELS[n] is chapter n+1
    Store.recordSolved(n, penalty);
    session.justUnlocked = next ? next.n : 0;
    const result = { stars: Store.stars(n), score: Store.score(n) };
    const card = () => { emit('progress'); Victory.show({          // badges after any cinematic, so their toasts don't land mid-scene
      title: 'Case Solved!', result, rec: { isBest: false, prevBest: 0 },
      unlock: next ? 'Story unlocked<b>Chapter ' + next.n + ': ' + next.title + '</b>' : 'Every mystery solved<b>You are a true detective!</b>',
      continueLabel: run.replay ? 'Back to case files' : (next ? 'Continue the story' : 'Hear the ending'), replayLabel: 'Replay case',
      onContinue: () => run.replay ? toMap() : this.advance(),
      onReplay: () => { session.run = this.newRun(n, false); this.goto(session.run.steps.find(id => PUZZLE_KINDS[id])); }
    }); };
    const lv = LEVELS[n - 1];
    if (lv.caughtScene) lv.caughtScene().then(card); else card();   // e.g. Evil Larry is caught red-pawed first
  }
};
