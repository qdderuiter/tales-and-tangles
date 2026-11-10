import { P } from '../core/grid.ts';
import type { Level, SceneId } from './types.ts';
import { CASES } from './cases.ts';
import { THEME_HINTS, TRAIL_HINTS } from './hints.ts';
import { EVIL_ZIPS, ZIPS, parseZip } from './zips.ts';
import { scenes } from '../core/scenes.ts';

interface RawLevel { n: number; title: string; blurb: string; theme: string; scene: [string, string]; words: [string, string][]; introScene?: Level['introScene']; caughtScene?: Level['caughtScene']; sceneId?: SceneId }

const RAW_LEVELS: RawLevel[] = [
  { n: 1, title: 'The Missing Honey Jar', blurb: 'Sticky pawprints lead the way.', theme: 'HONEY', scene: ['#fdeccb', '#f9cfa6'],
    words: [['HONEY','00 01 02 03 04'],['BEAR','05 15 25 35'],['COMB','10 11 12 13'],['BUZZ','14 24 34 45'],
            ['HIVE','20 21 22 23'],['JAR','30 31 32'],['PAW','40 41 42'],['BEE','33 43 44']] },
  { n: 2, title: 'The Muddled Library', blurb: 'Every title has run together.', theme: 'QUILL', scene: ['#e6e0f7', '#c9bdea'],
    words: [['SHELF','00 01 02 03 04'],['STORY','05 15 25 35 45'],['PAGE','13 14 24 34'],['LAMP','44 43 33 23'],
            ['INK','12 22 32'],['BOOK','10 11 21 20'],['QUILL','30 40 41 31 42']] },
  { n: 3, title: 'The Wilted Garden', blurb: 'Who has been digging in the dark?', theme: 'TULIP', scene: ['#dff1dc', '#b6dcb0'],
    words: [['TULIP','00 10 20 30 40'],['DAISY','01 02 12 11 21'],['ROSE','03 04 05 15'],['SEED','13 14 25 35'],
            ['RAIN','45 44 43 42'],['MOSS','41 31 32 22'],['LEAF','23 24 34 33']] },
  { n: 4, title: 'The Stolen Moon', blurb: 'The clocktower chimed thirteen.', theme: 'MOON', scene: ['#cfd9f3', '#9fb0e0'],
    words: [['DREAM','00 01 02 12 13'],['GLOW','03 04 05 15'],['COMET','14 24 25 35 45'],['OWL','34 44 43'],
            ['NIGHT','40 41 42 32 33'],['STAR','23 22 11 10'],['MOON','20 21 31 30']] },
  { n: 5, title: 'The Great Cake Caper', blurb: 'One last, sweetest mystery.', theme: 'CAKE', scene: ['#fbdde6', '#f5b9cc'],
    words: [['ICING','05 04 03 13 12'],['SUGAR','02 01 00 10 20'],['PIE','14 15 25'],['BERRY','35 45 44 43 33'],
            ['TEA','34 24 23'],['CREAM','11 22 32 42 41'],['CAKE','21 31 30 40']] },
  { n: 6, title: "The Vanishing Lamp", blurb: "The lighthouse has gone dark.", theme: 'BEACON', scene: ['#d8ecf5', '#a9d3e8'],
    words: [['ANCHOR','02 03 13 14 04 05'],['WAVE','15 25 24 34'],['GULL','35 45 44 43'],['PEARL','42 41 40 30 31'],['BEACON','32 33 23 22 21 20'],['SHELL','10 00 01 11 12']] },
  { n: 7, title: "The Snow Globe Heist", blurb: "Something sparkling slipped away.", theme: 'GLOBE', scene: ['#e8f0fb', '#c3d4ef'],
    words: [['COCOA','05 04 03 02 01'],['GLOBE','00 10 20 21 11'],['PINE','12 13 14 15'],['MITTEN','25 35 45 44 43 42'],['SKATE','41 40 30 31 32'],['FROST','22 23 24 34 33']] },
  { n: 8, title: "The Midnight Market", blurb: "Lanterns, spices and a striped stranger.", theme: 'SPICE', scene: ['#f9e3c9', '#eeb98a'],
    introScene: () => scenes.larry!.intro(), caughtScene: () => scenes.larry!.caught(), sceneId: 'larry',          // Evil Larry's cinematics open and close this level
    words: [['BASKET','40 41 31 30 20 21'],['CARPET','11 10 00 01 02 03'],['COIN','04 05 15 14'],['MANGO','13 12 22 32 42'],['SPICE','43 44 45 35 34'],['SILK','33 23 24 25']] },
  { n: 9, title: "The Carnival After Dark", blurb: "The big top is far too quiet.", theme: 'CIRCUS', scene: ['#f6d5e8', '#e1a6cf'],
    words: [['CLOWN','20 30 40 41 42'],['MAGIC','32 31 21 11 10'],['TENT','00 01 02 12'],['JUGGLE','22 23 33 43 44 45'],['DRUM','35 34 24 25'],['CIRCUS','15 14 13 03 04 05']] },
  { n: 10, title: "The Last Lantern", blurb: "The final light flickers.", theme: 'LIGHT', scene: ['#fdeec2', '#f4cc7b'],
    words: [['HEART','03 02 01 00 10'],['LIGHT','11 12 13 14 04'],['SMILE','05 15 25 24 23'],['FRIEND','33 34 35 45 44 43'],['HOME','42 41 40 30'],['STORY','31 32 22 21 20']] },
  { n: 11, title: 'The Falling Star', blurb: 'Something small and green just landed.', theme: 'COMET', scene: ['#dcd6f7', '#a99be0'],
    introScene: () => scenes.pup!.intro(), sceneId: 'pup',                                  // Pickle's crash landing opens this level
    words: [['ALIEN','00 01 10 11 21'],['COMET','02 13 23 33 44'],['BARK','03 04 05 15'],['PUPPY','12 22 32 42 41'],['BEAM','14 24 34 43'],['STAR','20 31 30 40'],['WAG','25 35 45']] },
  { n: 12, title: 'The Stardust Shortage', blurb: 'The little rocket has an empty tank.', theme: 'GALAXY', scene: ['#d3e0f7', '#8fa8e0'],
    words: [['GALAXY','00 01 12 13 22 33'],['ORBIT','02 03 04 15 05'],['LUNAR','10 11 20 30 21'],['PLANET','14 24 25 34 23 32'],['SOLAR','31 40 41 42 43'],['UFO','35 44 45']] },
  { n: 13, title: 'Countdown to Home', blurb: 'One key stands between Pickle and the stars.', theme: 'ROCKET', scene: ['#e7d6f7', '#c59be0'],
    caughtScene: () => scenes.pup!.caught(),                                                // Pickle's lift-off follows the solved case
    words: [['WAVE','00 10 11 12'],['HELMET','01 02 13 04 15 05'],['STARS','03 14 25 24 33'],['HOME','20 31 22 32'],['HEART','21 30 40 41 42'],['ROCKET','23 34 43 44 45 35']] },
  { n: 14, title: "The Lost Little Worm", blurb: "A tiny worm and a very big desert.", theme: 'DESERT', scene: ['#f9e3c4', '#e9b87a'],
    introScene: () => scenes.worm!.intro(), sceneId: 'worm',                                // Biscuit pops out of the dunes and opens this level
    words: [['DESERT','12 03 14 25 15 24'],['SCARAB','35 34 43 32 23 22'],['CACTUS','41 30 40 31 20 21'],['CAMEL','11 02 13 04 05'],['DUNE','45 44 33 42'],['SUN','00 10 01']] },
  { n: 15, title: "Stars Over the Dunes", blurb: "The sleepy caravan has lost its map.", theme: 'CARAVAN', scene: ['#e8d5f0', '#c8a2d8'],
    words: [['CARAVAN','44 34 45 35 24 15 04'],['STARRY','21 22 33 42 31 30'],['NOMAD','23 12 01 10 20'],['DATES','13 03 02 11 00'],['TENT','43 32 41 40'],['RUG','05 14 25']] },
  { n: 16, title: "The Midnight Oasis", blurb: "One little door key stands between Biscuit and home.", theme: 'OASIS', scene: ['#d4f0e4', '#8fd4c0'],
    caughtScene: () => scenes.worm!.caught(),                                                // Biscuit's homecoming follows the solved case
    words: [['FIREFLY','33 34 23 32 43 42 31'],['COCONUT','00 11 20 10 01 12 02'],['OASIS','25 15 24 13 22'],['PALM','04 03 14 05'],['LILY','21 30 40 41'],['KEY','45 44 35']] }
];

/* parse each word path, and attach the level's trail, evil trail, case and hints (all indexed by position) */
export const LEVELS: Level[] = RAW_LEVELS.map((lv, i) => ({
  ...lv,
  words: lv.words.map(([w, p]) => ({ w, p: P(p), gold: w === lv.theme })),
  zip: parseZip(ZIPS[i]), evilZip: parseZip(EVIL_ZIPS[i]), case: CASES[i], hint: THEME_HINTS[i], trailHint: TRAIL_HINTS[ZIPS[i].word]
}));
