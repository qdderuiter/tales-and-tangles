import { P } from '../core/grid.js';
import { CASES } from './cases.js';
import { THEME_HINTS, TRAIL_HINTS } from './hints.js';
import { EVIL_ZIPS, ZIPS, parseZip } from './zips.js';
import { scenes } from '../core/scenes.js';

export const LEVELS = [
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
    introScene: () => scenes.larry.intro(), caughtScene: () => scenes.larry.caught(),          // Evil Larry's cinematics open and close this chapter
    words: [['BASKET','40 41 31 30 20 21'],['CARPET','11 10 00 01 02 03'],['COIN','04 05 15 14'],['MANGO','13 12 22 32 42'],['SPICE','43 44 45 35 34'],['SILK','33 23 24 25']] },
  { n: 9, title: "The Carnival After Dark", blurb: "The big top is far too quiet.", theme: 'CIRCUS', scene: ['#f6d5e8', '#e1a6cf'],
    words: [['CLOWN','20 30 40 41 42'],['MAGIC','32 31 21 11 10'],['TENT','00 01 02 12'],['JUGGLE','22 23 33 43 44 45'],['DRUM','35 34 24 25'],['CIRCUS','15 14 13 03 04 05']] },
  { n: 10, title: "The Last Lantern", blurb: "The final light flickers.", theme: 'LIGHT', scene: ['#fdeec2', '#f4cc7b'],
    words: [['HEART','03 02 01 00 10'],['LIGHT','11 12 13 14 04'],['SMILE','05 15 25 24 23'],['FRIEND','33 34 35 45 44 43'],['HOME','42 41 40 30'],['STORY','31 32 22 21 20']] }
];

LEVELS.forEach(lv => {
  lv.words = lv.words.map(([w, p]) => ({ w, p: P(p), gold: w === lv.theme }));
});

LEVELS.forEach((lv, i) => { lv.zip = parseZip(ZIPS[i]); lv.evilZip = parseZip(EVIL_ZIPS[i]); lv.case = CASES[i]; lv.hint = THEME_HINTS[i]; lv.trailHint = TRAIL_HINTS[lv.zip.word]; });
