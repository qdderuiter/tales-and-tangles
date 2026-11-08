import { emit } from '../core/events.ts';
import { Daily } from '../puzzles/daily.ts';
import { WordPuzzle } from '../puzzles/word/word-puzzle.ts';
import { session } from '../state/session.ts';
import { UI } from '../ui/ui.ts';
import { Victory } from '../ui/victory.ts';
import { Noir } from './noir-flow.ts';

/* ----- the Daily Case: one generated word puzzle per day ----- */
export const DailyFlow = {
  /* map tap: show today's result when already solved, otherwise play */
  open(done) { if (done) this.showResult(); else this.start(); },

  start() {
    const date = Daily.today(), lvl = Daily.generate(date);
    session.run = { n: 0, replay: true, freeHints: 0, daily: lvl, date, moodChapter: 1 + Daily.seed(date) % 5 };
    UI.show('puzzle');
    WordPuzzle.load(lvl, { freeHints: 0, onWin: r => this.onWin(r) });
    WordPuzzle.start();
  },

  card(date, stored, streak, first) {
    const stars = stored.stars;
    Victory.show({
      title: 'Daily Case Solved!', result: { stars, score: stored.score }, rec: { isBest: false, prevBest: 0 },
      unlock: '🔥 Streak<b>' + streak + (streak === 1 ? ' day' : ' days') + '</b>' + (first ? '' : '<small class="note">Already counted today — this was practice</small>'),
      continueLabel: 'Share result', replayLabel: 'Practice again', keepOpen: true,
      onContinue: () => Daily.share(date),
      onReplay: () => Noir.gate('word', () => this.start())
    });
  },

  onWin(result) {
    const date = session.run.date, rec = Daily.record(date, result);
    emit('puzzle:won', { kind: 'word', result, fresh: rec.first });      // only the first Daily result of a day counts toward the perfect streak
    this.card(date, rec.stored, rec.streak, rec.first);
  },

  showResult() {
    const date = Daily.today();
    session.run = { n: 0, replay: true, freeHints: 0, moodChapter: 0 };
    this.card(date, Daily.result(date), Daily.streak(date), true);
  }
};
