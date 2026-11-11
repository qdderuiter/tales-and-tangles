import { AudioFX } from '../audio/sfx.ts';
import { Outfit } from '../characters/barnaby-svg.ts';
import { Barnaby } from '../characters/barnaby.ts';
import { cast, createCast } from '../characters/cast.ts';
import { $ } from '../core/dom.ts';
import { scenes } from '../core/scenes.ts';
import { CaseScreen } from '../puzzles/case/case-screen.ts';
import { WordPuzzle } from '../puzzles/word/word-puzzle.ts';
import { ZipPuzzle } from '../puzzles/zip/zip-puzzle.ts';
import { ChapterFilm } from '../scenes/chapter-film.ts';
import { Cutscene } from '../scenes/cutscene.ts';
import { LarryScene } from '../scenes/larry-scene.ts';
import { PupScene } from '../scenes/pup-scene.ts';
import { ElephantScene } from '../scenes/elephant-scene.ts';
import { WormScene } from '../scenes/worm-scene.ts';
import { Store } from '../state/store.ts';
import { Badges } from '../ui/badges-screen.ts';
import { MapScreen } from '../ui/map-screen.ts';
import { Settings } from '../ui/settings.ts';
import { StoryScreen } from '../ui/story-screen.ts';
import { UI } from '../ui/ui.ts';
import { Victory } from '../ui/victory.ts';
import { Wardrobe } from '../ui/wardrobe-screen.ts';
import { LevelFlow } from './level-flow.ts';
import { DailyFlow } from './daily-flow.ts';
import { toMap } from './nav.ts';

/* Start the game: load the save, build the screens and characters, and wire the buttons to the flows.
   The flows themselves live in level-flow.ts, daily-flow.ts and noir-flow.ts. */
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
  PupScene.init();
  WormScene.init();
  ElephantScene.init();
  ChapterFilm.init();
  StoryScreen.init(cast.story, { larry: { host: $('#storyLarry'), portrait: cast.larry }, pup: { host: $('#storyPup'), portrait: cast.pup }, worm: { host: $('#storyWorm'), portrait: cast.worm }, elephant: { host: $('#storyElephant'), portrait: cast.elephant } });

  // title
  $('#btnPlay').addEventListener('click', () => {
    AudioFX.unlock();
    if (!Store.hasProgress()) LevelFlow.start(1); else toMap();
  });
  Settings.init();

  // map: what a tap on each part does
  MapScreen.init({
    level: n => LevelFlow.start(n),
    step: (n, kind) => LevelFlow.playStep(n, kind),
    daily: done => DailyFlow.open(done),
    intro: lv => { lv.introScene?.(); },
    ending: id => { scenes.chapterEnd?.play(id); }
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
