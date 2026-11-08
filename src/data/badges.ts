import type { Badge } from './types.ts';
import { LEVELS } from './levels.ts';
import { WARDROBE } from './wardrobe.ts';

/* ---------- detective badges ----------
   test(d, ev, S): d = S.data; ev = the puzzle result event { type:'puzzle', kind, result } when one just happened (else undefined); S = the Store (handed in so this file imports no code). */
export const BADGES: Badge[] = [
  { id: 'rookie',     icon: '🔎', name: 'Rookie Detective',   desc: 'Solve your first case.',                       test: (d, ev, S) => S.level(1).solved },
  { id: 'master',     icon: '🕵️', name: 'Master Detective',   desc: 'Solve every case.',                            test: (d, ev, S) => LEVELS.every(lv => S.level(lv.n).solved) },
  { id: 'sharp',      icon: '👁️', name: 'Sharp Eyes',         desc: 'Win a puzzle with no hints and no mistakes.',  test: (d, ev) => !!ev && ev.result.hints === 0 && ev.result.wrongs === 0 },
  { id: 'chain',      icon: '⛓️', name: 'Chain Reaction',     desc: 'Reach a ×5 combo in a Words puzzle.',          test: (d, ev) => !!ev && ev.kind === 'word' && (ev.result.maxCombo ?? 0) >= 5 },
  { id: 'quick',      icon: '⚡', name: 'Quick Paws',         desc: 'Finish a Words puzzle in under a minute.',     test: (d, ev) => !!ev && ev.kind === 'word' && ev.result.secs < 60 },
  { id: 'bythebook',  icon: '📖', name: 'By the Book',        desc: 'Solve a whole case with three stars.',         test: (d, ev, S) => LEVELS.some(lv => S.stars(lv.n) === 3) },
  { id: 'daily1',     icon: '📰', name: 'Morning Paper',      desc: 'Solve a Daily Case.',                          test: d => Object.keys(d.daily.results).length > 0 },
  { id: 'streak7',    icon: '🔥', name: 'Week of Wonders',    desc: 'Reach a 7-day Daily streak.',                  test: d => d.daily.best >= 7 },
  { id: 'noir1',      icon: '🌑', name: 'Into the Shadows',   desc: 'Clear a Barnaby Noir level.',                  test: (d, ev, S) => S.evilCount() >= 1 },
  { id: 'noir5',      icon: '😈', name: 'Noir Nemesis',       desc: 'Clear five Barnaby Noir levels.',              test: (d, ev, S) => S.evilCount() >= 5 },
  { id: 'larry',      icon: '🐱', name: 'Gotcha, Larry!',     desc: 'Catch Evil Larry at the Midnight Market.',     test: (d, ev, S) => S.level(8).solved },
  { id: 'sniffer',    icon: '🐽', name: 'Word Sniffer',       desc: 'Find a hidden bonus word.',                    test: d => d.bonusWords.length >= 1 },
  { id: 'dictionary', icon: '📚', name: 'Walking Dictionary', desc: 'Find 25 different hidden words.',              test: d => d.bonusWords.length >= 25 },
  { id: 'dapper',     icon: '🎩', name: 'Dapper Bear',        desc: 'Own every item in the Wardrobe shop.',         test: (d, ev, S) => WARDROBE.filter(i => i.cost > 0).every(i => S.owns(i.id)) }
];
