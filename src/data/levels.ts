import { P } from '../core/grid.ts';
import type { Level, SceneId } from './types.ts';
import { CASES } from './cases.ts';
import { THEME_HINTS, TRAIL_HINTS } from './hints.ts';
import { EVIL_ZIPS, ZIPS, parseZip } from './zips.ts';
import { scenes } from '../core/scenes.ts';

interface RawLevel { n: number; title: string; blurb: string; theme: string; scene: [string, string]; words: [string, string][]; introScene?: Level['introScene']; caughtScene?: Level['caughtScene']; sceneId?: SceneId }

const RAW_LEVELS: RawLevel[] = [
  { n: 1, title: 'The Missing Honey Jar', blurb: 'Sticky pawprints lead the way.', theme: 'HONEY', scene: ['#fdeccb', '#f9cfa6'],
    words: [['HONEY','04 05 15 14 13'],['BEAR','12 11 10 20'],['COMB','30 40 41 42'],['BUZZ','00 01 02 03'],['HIVE','34 33 32 31'],['JAR','24 25 35'],['PAW','21 22 23'],['BEE','43 44 45']] },
  { n: 2, title: 'The Muddled Library', blurb: 'Every title has run together.', theme: 'QUILL', scene: ['#e6e0f7', '#c9bdea'],
    words: [['SHELF','13 14 15 05 04'],['STORY','21 31 32 33 34'],['PAGE','41 40 30 20'],['LAMP','03 02 12 22'],['INK','44 43 42'],['BOOK','10 00 01 11'],['QUILL','45 35 25 24 23']] },
  { n: 3, title: 'The Wilted Garden', blurb: 'Who has been digging in the dark?', theme: 'TULIP', scene: ['#dff1dc', '#b6dcb0'],
    words: [['TULIP','14 04 05 15 25'],['DAISY','35 45 44 43 42'],['ROSE','23 33 34 24'],['SEED','01 02 03 13'],['RAIN','21 20 10 00'],['MOSS','41 40 30 31'],['LEAF','32 22 12 11']] },
  { n: 4, title: 'The Stolen Moon', blurb: 'The clocktower chimed thirteen.', theme: 'MOON', scene: ['#cfd9f3', '#9fb0e0'],
    words: [['DREAM','21 20 10 00 01'],['GLOW','32 22 12 11'],['COMET','05 15 14 13 23'],['OWL','02 03 04'],['NIGHT','42 41 40 30 31'],['STAR','24 25 35 45'],['MOON','33 34 44 43']] },
  { n: 5, title: 'The Great Cake Caper', blurb: 'One last, sweetest mystery.', theme: 'CAKE', scene: ['#fbdde6', '#f5b9cc'],
    words: [['ICING','44 43 33 23 13'],['SUGAR','34 24 25 35 45'],['PIE','01 00 10'],['BERRY','14 15 05 04 03'],['TEA','02 12 11'],['CREAM','42 32 22 21 31'],['CAKE','20 30 40 41']] },
  { n: 6, title: "The Vanishing Lamp", blurb: "The lighthouse has gone dark.", theme: 'BEACON', scene: ['#d8ecf5', '#a9d3e8'],
    words: [['ANCHOR','03 13 14 15 05 04'],['WAVE','22 21 20 10'],['GULL','23 24 25 35'],['PEARL','45 44 34 33 43'],['BEACON','42 41 40 30 31 32'],['SHELL','00 01 11 12 02']] },
  { n: 7, title: "The Snow Globe Heist", blurb: "Something sparkling slipped away.", theme: 'GLOBE', scene: ['#e8f0fb', '#c3d4ef'],
    words: [['COCOA','12 02 03 04 05'],['GLOBE','34 24 23 13 14'],['PINE','41 40 30 31'],['MITTEN','21 20 10 00 01 11'],['SKATE','22 32 33 43 42'],['FROST','15 25 35 45 44']] },
  { n: 8, title: "The Midnight Market", blurb: "Lanterns, spices and a striped stranger.", theme: 'SPICE', scene: ['#f9e3c9', '#eeb98a'],
    introScene: () => scenes.larry!.intro(), caughtScene: () => scenes.larry!.caught(), sceneId: 'larry',          // Evil Larry's cinematics open and close this level
    words: [['BASKET','00 01 11 12 02 03'],['CARPET','31 32 22 21 20 10'],['COIN','34 44 45 35'],['MANGO','43 42 41 40 30'],['SPICE','13 14 15 05 04'],['SILK','25 24 23 33']] },
  { n: 9, title: "The Carnival After Dark", blurb: "The big top is far too quiet.", theme: 'CIRCUS', scene: ['#f6d5e8', '#e1a6cf'],
    words: [['CLOWN','14 04 05 15 25'],['MAGIC','40 41 31 32 42'],['TENT','02 01 00 10'],['JUGGLE','24 23 22 12 13 03'],['DRUM','11 21 20 30'],['CIRCUS','43 44 45 35 34 33']] },
  { n: 10, title: "The Last Lantern", blurb: "The final light flickers.", theme: 'LIGHT', scene: ['#fdeec2', '#f4cc7b'],
    words: [['HEART','11 10 00 01 02'],['LIGHT','05 15 25 24 23'],['SMILE','31 32 42 41 40'],['FRIEND','33 43 44 34 35 45'],['HOME','03 13 14 04'],['STORY','30 20 21 22 12']] },
  { n: 11, title: 'The Falling Star', blurb: 'Something small and green just landed.', theme: 'COMET', scene: ['#dcd6f7', '#a99be0'],
    introScene: () => scenes.pup!.intro(), sceneId: 'pup',                                  // Pickle's crash landing opens this level
    words: [['ALIEN','02 12 11 21 22'],['COMET','05 04 14 13 03'],['BARK','23 24 25 15'],['PUPPY','32 31 41 40 30'],['BEAM','44 45 35 34'],['STAR','20 10 00 01'],['WAG','33 43 42']] },
  { n: 12, title: 'The Stardust Shortage', blurb: 'The little rocket has an empty tank.', theme: 'GALAXY', scene: ['#d3e0f7', '#8fa8e0'],
    words: [['GALAXY','43 42 32 33 23 22'],['ORBIT','21 31 41 40 30'],['LUNAR','12 02 03 13 14'],['PLANET','04 05 15 25 24 34'],['SOLAR','20 10 00 01 11'],['UFO','35 45 44']] },
  { n: 13, title: 'Countdown to Home', blurb: 'One key stands between Pickle and the stars.', theme: 'ROCKET', scene: ['#e7d6f7', '#c59be0'],
    caughtScene: () => scenes.pup!.caught(),                                                // Pickle's lift-off follows the solved case
    words: [['WAVE','02 03 13 14'],['HELMET','23 33 34 35 45 44'],['STARS','04 05 15 25 24'],['HOME','11 10 00 01'],['HEART','30 20 21 22 12'],['ROCKET','43 42 32 31 41 40']] },
  { n: 14, title: "The Lost Little Worm", blurb: "A tiny worm and a very big desert.", theme: 'DESERT', scene: ['#f9e3c4', '#e9b87a'],
    introScene: () => scenes.worm!.intro(), sceneId: 'worm',                                // Biscuit pops out of the dunes and opens this level
    words: [['DESERT','23 22 32 33 43 42'],['SCARAB','31 21 20 10 00 01'],['CACTUS','13 14 04 05 15 25'],['CAMEL','44 45 35 34 24'],['DUNE','11 12 02 03'],['SUN','41 40 30']] },
  { n: 15, title: "Stars Over the Dunes", blurb: "The sleepy caravan has lost its map.", theme: 'CARAVAN', scene: ['#e8d5f0', '#c8a2d8'],
    words: [['CARAVAN','44 45 35 34 24 25 15'],['STARRY','11 12 22 21 20 30'],['NOMAD','23 33 32 42 43'],['DATES','05 04 14 13 03'],['TENT','02 01 00 10'],['RUG','40 41 31']] },
  { n: 16, title: "The Midnight Oasis", blurb: "One little door key stands between Biscuit and home.", theme: 'OASIS', scene: ['#d4f0e4', '#8fd4c0'],
    caughtScene: () => scenes.worm!.caught(),                                                // Biscuit's homecoming follows the solved case
    words: [['FIREFLY','42 43 33 34 44 45 35'],['COCONUT','11 21 20 30 31 41 40'],['OASIS','05 04 03 13 12'],['PALM','25 24 14 15'],['LILY','02 01 00 10'],['KEY','23 22 32']] },
  { n: 17, title: 'The Vanished Star Ball', blurb: 'The lights blinked, and the lucky ball was gone.', theme: 'STAGE', scene: ['#fbd9d9', '#f09aa8'],
    introScene: () => scenes.elephant!.intro(), sceneId: 'elephant',                          // Pippy practises on his star ball, and it vanishes: this opens the level
    words: [['STAGE','10 00 01 11 12'],['PIPPY','22 32 33 43 42'],['TRUNK','25 35 45 44 34'],['BALLS','02 03 13 23 24'],['STAR','14 04 05 15'],['BOWTIE','41 40 30 31 21 20']] },
  { n: 18, title: 'High Wire Hush', blurb: 'Glitter on the ladder leads up to the roof of the tent.', theme: 'TRAPEZE', scene: ['#fde9c4', '#f2b66e'],
    words: [['TRAPEZE','44 45 35 25 24 34 33'],['ACROBAT','02 03 13 14 04 05 15'],['SWING','21 20 30 40 41'],['ROPE','11 10 00 01'],['FLIP','31 32 42 43'],['NET','23 22 12']] },
  { n: 19, title: 'The Greatest Little Show', blurb: 'The curtain rises in one hour.', theme: 'ENCORE', scene: ['#e6d9f7', '#b79be6'],
    caughtScene: () => scenes.elephant!.caught(),                                             // Pippy's show follows the solved case
    words: [['ENCORE','03 02 12 13 23 22'],['CURTAIN','43 33 34 44 45 35 25'],['CROWD','20 10 00 01 11'],['CHEER','24 14 15 05 04'],['HORN','40 30 31 21'],['BOW','32 42 41']] },
  { n: 20, title: 'The Missing Stomp Drum', blurb: 'Something fell from the sky, and the big drum is gone.', theme: 'MEADOW', scene: ['#e0f1d0', '#a9d98a'],
    introScene: () => scenes.dino!.intro(), sceneId: 'dino',                                  // the dinos are playing in the meadow when a meteor streaks into view: this opens the level
    words: [['MEADOW','23 24 34 44 45 35'],['DINOS','41 40 30 31 21'],['FERNS','25 15 05 04 14'],['GRASS','22 32 33 43 42'],['STOMP','20 10 11 01 00'],['EGGS','13 03 02 12']] },
  { n: 21, title: 'The Boing Ball Mix-up', blurb: 'A great big bouncy ball has rolled off.', theme: 'METEOR', scene: ['#f9e0c8', '#f0a878'],
    words: [['METEOR','41 40 30 31 21 20'],['CRATER','11 12 02 03 13 14'],['SPARKS','35 45 44 34 24 23'],['FLAME','22 32 33 43 42'],['DUST','04 05 15 25'],['SKY','10 00 01']] },
  { n: 22, title: 'The Great Spring Plank', blurb: 'The last piece of the plan has gone astray.', theme: 'LAUNCH', scene: ['#d9d2f5', '#9aa7e6'],
    caughtScene: () => scenes.dino!.caught(),                                                // the stomp-launch that smashes the meteor follows the solved case
    words: [['LAUNCH','00 10 11 21 20 30'],['STARS','05 15 25 24 14'],['STOMP','43 44 45 35 34'],['SPRING','04 03 13 12 02 01'],['SWING','40 41 31 32 42'],['SUN','33 23 22']] }
];

/* parse each word path, and attach the level's trail, evil trail, case and hints (all indexed by position) */
export const LEVELS: Level[] = RAW_LEVELS.map((lv, i) => ({
  ...lv,
  words: lv.words.map(([w, p]) => ({ w, p: P(p), gold: w === lv.theme })),
  zip: parseZip(ZIPS[i]), evilZip: parseZip(EVIL_ZIPS[i]), case: CASES[i], hint: THEME_HINTS[i], trailHint: TRAIL_HINTS[ZIPS[i].word]
}));
