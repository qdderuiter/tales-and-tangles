import { AudioFX } from '../audio/sfx.ts';
import { emit } from '../core/events.ts';
import type { PuzzleResult } from '../core/types.ts';
import { scenes } from '../core/scenes.ts';
import { CHAPTERS, caseLabel, chapterOf, isChapterEnd } from '../data/chapters.ts';
import { LEVELS } from '../data/levels.ts';
import type { Level, StoryPart } from '../data/types.ts';
import { STORY } from '../dialogue/story-builder.ts';
import { CaseScreen } from '../puzzles/case/case-screen.ts';
import { PUZZLE_KINDS } from '../puzzles/registry.ts';
import { levelRun, currentLevel, session } from '../state/session.ts';
import type { LevelRun } from '../state/session.ts';
import { Store } from '../state/store.ts';
import { StoryScreen } from '../ui/story-screen.ts';
import { UI } from '../ui/ui.ts';
import { Victory } from '../ui/victory.ts';
import { DEFAULT_STEPS, STEPS, stepLabel } from './level-steps.ts';
import { toMap } from './nav.ts';
import { Noir } from './noir-flow.ts';

/* ---------- a level (a "case"; chapters group several of them: data/chapters.ts) ----------
   A level is a list of steps (level-steps.ts): by default intro -> Words -> bridge -> Scent Trail -> Suspects -> outro.
   run = { n, replay, freeHints, earned, notes, steps, step }; replay runs (from the map pips) skip the story and return to the map.
   The steps call back into this object: lv(), playStory(), toCase(); a step that finishes calls advance().
   After the last step of a chapter's last level, the chapter's ending film plays (once) before the map opens. */
export const LevelFlow = {
  lv(): Level { return currentLevel() as Level; },

  newRun(n: number, replay?: boolean): LevelRun {
    const steps = ((LEVELS[n - 1] && LEVELS[n - 1].steps) || DEFAULT_STEPS).slice();
    const earned: Record<string, boolean> = {}; steps.forEach(id => { if (PUZZLE_KINDS[id]) earned[id] = false; });      // each puzzle step earns one clue
    return { n, replay: !!replay, freeHints: 0, earned, notes: null, steps, step: 0 };
  },
  earnedText(kind: string) { const c = this.lv().case.clues.find(x => x.earned === kind); return CaseScreen.highlight(c ? c.t : ''); },

  start(n: number) {
    session.run = this.newRun(n, false);
    session.openChapter = chapterOf(n)?.id ?? '';              // the map reopens this chapter when the level is over
    this.runStep();
  },

  /* run the current step of the level; past the last step the level is over */
  runStep() {
    const run = levelRun(), id = run.steps[run.step], step = STEPS[id];
    if (!id) this.finish(run);
    else if (step) step.run(this);
    else this.startPuzzle(id);
  },

  /* the level is over. The closing level of a chapter plays the chapter's film the first time, then the map shows the next chapter unlocking. */
  finish(run: LevelRun) {
    const ch = run.replay ? undefined : chapterOf(run.n);
    if (ch && isChapterEnd(run.n) && scenes.chapterEnd && !Store.data.seen.endings[ch.id]) {
      const next = CHAPTERS[ch.n];                           // chapters are numbered 1..N, so index n is the one after
      scenes.chapterEnd.play(ch.id).then(() => {
        session.openChapter = '';                            // back out to the chapter list, where the next card unlocks
        session.justUnlockedChapter = next ? next.id : '';
        toMap();
      });
      return;
    }
    toMap();
  },
  advance() { levelRun().step++; this.runStep(); },
  goto(id: string) { const run = levelRun(); run.step = run.steps.indexOf(id); this.runStep(); },

  /* replay one step from the map pips; a solved chapter has already earned every clue */
  playStep(n: number, kind: string) {
    const run = session.run = this.newRun(n, true);
    session.openChapter = chapterOf(n)?.id ?? '';
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
      onChoice: ch => { if (ch.gift) { levelRun().freeHints++; UI.toast('+1 free hint added to your notebook'); AudioFX.chime(6); } },
      onDone: () => this.advance()
    });
    if (before) before().then(begin); else begin();
  },

  /* kind: a puzzle id registered in puzzles/registry.ts */
  startPuzzle(kind: string) {
    const k = PUZZLE_KINDS[kind];
    UI.show(k.screen);
    k.obj.load(this.lv(), { freeHints: levelRun().freeHints, onWin: r => this.onPuzzleWin(kind, r) });
    k.obj.start();
  },

  onPuzzleWin(kind: string, result: PuzzleResult) {
    const run = levelRun(), k = PUZZLE_KINDS[kind];
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
    CaseScreen.load(this.lv(), levelRun(), penalty => this.onSolved(penalty));
  },

  onSolved(penalty: number) {
    const run = levelRun(), n = run.n, next = LEVELS[n];  // LEVELS[n] is level n+1
    const ch = chapterOf(n), chapterDone = !!ch && isChapterEnd(n);
    Store.recordSolved(n, penalty);
    session.justUnlocked = next ? next.n : 0;
    const result = { stars: Store.stars(n), score: Store.score(n) };
    const card = () => { emit('progress'); Victory.show({          // badges after any cinematic, so their toasts don't land mid-scene
      title: 'Case Solved!', result, rec: { isBest: false, prevBest: 0 },
      unlock: !next ? 'Every mystery solved<b>You are a true detective!</b>'
        : chapterDone ? 'Chapter complete<b>' + ch!.title + '</b>'
        : 'Next case<b>' + caseLabel(next.n) + ': ' + next.title + '</b>',
      continueLabel: run.replay ? 'Back to case files' : (next ? 'Continue the story' : 'Hear the ending'), replayLabel: 'Replay case',
      onContinue: () => run.replay ? toMap() : this.advance(),
      onReplay: () => { session.run = this.newRun(n, false); this.goto(levelRun().steps.find(id => PUZZLE_KINDS[id])!); }
    }); };
    const lv = LEVELS[n - 1];
    if (lv.caughtScene) lv.caughtScene().then(card); else card();   // e.g. Evil Larry is caught red-pawed first
  }
};
