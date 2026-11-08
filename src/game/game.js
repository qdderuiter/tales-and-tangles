import { AudioFX } from '../audio/sfx.js';
import { Outfit } from '../characters/barnaby-svg.js';
import { Barnaby } from '../characters/barnaby.js';
import { cast, createCast } from '../characters/cast.js';
import { $ } from '../core/dom.js';
import { CaseScreen } from '../puzzles/case/case-screen.js';
import { WordPuzzle } from '../puzzles/word/word-puzzle.js';
import { ZipPuzzle } from '../puzzles/zip/zip-puzzle.js';
import { Cutscene } from '../scenes/cutscene.js';
import { LarryScene } from '../scenes/larry-scene.js';
import { Store } from '../state/store.js';
import { Badges } from '../ui/badges-screen.js';
import { MapScreen } from '../ui/map-screen.js';
import { Settings } from '../ui/settings.js';
import { StoryScreen } from '../ui/story-screen.js';
import { UI } from '../ui/ui.js';
import { Victory } from '../ui/victory.js';
import { Wardrobe } from '../ui/wardrobe-screen.js';
import { Chapter } from './chapter-flow.js';
import { DailyFlow } from './daily-flow.js';
import { toMap } from './nav.js';

/* Start the game: load the save, build the screens and characters, and wire the buttons to the flows.
   The flows themselves live in chapter-flow.js, daily-flow.js and noir-flow.js. */
export function initGame() {
  Store.load();
  Badges.check(null, true);                                   // old saves catch up quietly, no toasts
  Outfit.current = Object.assign({}, Store.data.wardrobe.equipped);
  Barnaby.init();
  createCast();

  Wardrobe.init(cast.w);
  $('#btnWardrobe').addEventListener('click', () => Wardrobe.open('title'));
  $('#btnMapWardrobe').addEventListener('click', () => Wardrobe.open('map'));

  WordPuzzle.init(cast.pz);
  ZipPuzzle.init(cast.z);
  CaseScreen.init(cast.c);
  Victory.init(cast.v);
  Cutscene.init();
  LarryScene.init();
  StoryScreen.init(cast.story, cast.larry);

  // title
  $('#btnPlay').addEventListener('click', () => {
    AudioFX.unlock();
    if (!Store.hasProgress()) Chapter.start(1); else toMap();
  });
  Settings.init();

  // map: what a tap on each part does
  MapScreen.init({
    chapter: n => Chapter.start(n),
    step: (n, kind) => Chapter.playStep(n, kind),
    daily: done => DailyFlow.open(done),
    intro: lv => lv.introScene()
  });
  $('#btnMapBack').addEventListener('click', () => UI.show('title'));
  $('#btnBBack').addEventListener('click', () => toMap());

  // the three playing screens
  $('#btnPzBack').addEventListener('click', () => { WordPuzzle.stop(); toMap(); });
  $('#btnZBack').addEventListener('click', () => { ZipPuzzle.stop(); toMap(); });
  $('#btnCBack').addEventListener('click', () => { CaseScreen.stop(); toMap(); });

  // victory
  $('#vMap').addEventListener('click', () => { Victory.hide(); toMap(); });
}
