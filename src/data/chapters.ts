import type { Chapter, Motif } from './types.ts';

/* The chapters: which levels belong together, their look, and the film that ends each one.
   Levels are 1-based and stay in one flat list (data/levels.ts); a chapter only names them. */

/* the stage layers each motif draws (scenes/film-art.ts), back to front; a film's `start`, `show` and `hide` use these ids */
export const FILM_LAYERS: Record<Motif, string[]> = {
  meadow:  ['sky', 'sun', 'hills', 'garden', 'flowers', 'bees', 'library', 'lamps'],
  night:   ['sky', 'stars', 'moon', 'clouds', 'town', 'cake', 'candles'],
  sea:     ['sky', 'sea', 'lighthouse', 'beam', 'snow', 'globe'],
  lantern: ['sky', 'stars', 'town', 'rooftop', 'lanterns', 'larry', 'barnaby'],
  space:   ['sky', 'stars', 'planet', 'hills', 'barnaby', 'trail', 'rocket', 'home'],
  desert:  ['sky', 'stars', 'moon', 'dunes', 'caravan', 'palms', 'pool', 'house', 'barnaby'],
  bigtop:  ['sky', 'stars', 'tent', 'flags', 'lights', 'crowd', 'ring', 'ball', 'pippy', 'barnaby'],
  meteor:  ['sky', 'sun', 'stars', 'hills', 'dinos', 'burst', 'ball', 'barnaby']
};

export const CHAPTERS: Chapter[] = [
  { id: 'village', n: 1, title: 'Village Days', tagline: 'Honey, books and a very muddy garden.', levels: [1, 2, 3], motif: 'meadow',
    palette: { a: '#fdeccb', b: '#f9cfa6', ink: '#6b4a2b', glow: '#ffd27a' },
    ending: {
      start: ['sky', 'sun', 'hills'],
      reducedCaption: 'Evening settles over Honeywick. Every mystery is solved.',
      beats: [
        { caption: 'Evening settles over Honeywick.', cam: { x: 0, scale: 1, ms: 0 }, cue: 'swell', hold: 2400 },
        { caption: 'The bees fly home in one buzzing line.', show: ['bees'], cam: { x: -8, ms: 3000 }, cue: 'chime', hold: 2800 },
        { caption: 'The garden wakes up, petal by petal.', show: ['garden', 'flowers'], cam: { x: -16, scale: 1.08, ms: 3200 }, cue: 'sparkle', hold: 2800 },
        { caption: 'And in the library, a lamp glows warm.', show: ['library', 'lamps'], cam: { x: -26, scale: 1.15, ms: 3200 }, cue: 'bell', flash: 0.3, hold: 2800 },
        { caption: 'Three mysteries. Three friends. One cozy village.', cam: { x: -10, scale: 1, ms: 3000 }, cue: 'swell', hold: 2600 }
      ] } },
  { id: 'dreams', n: 2, title: 'Sweet Dreams', tagline: 'A stolen moon and a cake gone missing.', levels: [4, 5], motif: 'night',
    palette: { a: '#d9d2f5', b: '#f3c4dc', ink: '#3d3566', glow: '#ffe9a8' },
    ending: {
      start: ['sky', 'town'],
      reducedCaption: 'The moon is home, the stars are out, and the cake is ready.',
      beats: [
        { caption: 'The sky is empty. No moon, no stars.', cam: { x: 0, scale: 1, ms: 0 }, cue: 'swell', hold: 2400 },
        { caption: 'But a silver glow rises over the clocktower.', show: ['moon'], cam: { x: 0, y: -6, scale: 1.1, ms: 3200 }, cue: 'whoosh', hold: 2800 },
        { caption: 'The moon is home.', flash: 0.4, cue: 'bell', hold: 1800 },
        { caption: 'One by one, the stars light up.', show: ['stars', 'clouds'], cue: 'sparkle', hold: 3000 },
        { caption: 'Down below, the cake is ready.', show: ['cake'], cam: { x: 0, y: 6, scale: 1.2, ms: 3000 }, hold: 2200 },
        { caption: 'Make a wish.', show: ['candles'], cue: 'chime', flash: 0.3, hold: 2800 }
      ] } },
  { id: 'sea-snow', n: 3, title: 'Sea & Snow', tagline: 'A dark lighthouse and a vanished snow globe.', levels: [6, 7], motif: 'sea',
    palette: { a: '#d8ecf5', b: '#a9d3e8', ink: '#1f4a63', glow: '#fff6c9' },
    ending: {
      start: ['sky', 'sea', 'lighthouse'],
      reducedCaption: 'The lighthouse shines again, and snow falls on the snow globe.',
      beats: [
        { caption: 'The lighthouse is dark, and the sea is waiting.', cam: { x: 0, scale: 1, ms: 0 }, cue: 'swell', hold: 2400 },
        { caption: 'Then, the beam returns.', show: ['beam'], flash: 0.45, cue: 'bell', hold: 2600 },
        { caption: 'It sweeps across the water, guiding ships home.', cam: { x: -12, ms: 3600 }, cue: 'whoosh', hold: 3000 },
        { caption: 'Far away, it begins to snow.', show: ['snow'], cue: 'sparkle', hold: 2800 },
        { caption: 'Wait... the whole scene is so small.', show: ['globe'], cam: { x: 0, scale: 0.8, ms: 3600 }, cue: 'swell', hold: 2600 },
        { caption: 'A snow globe on a shelf. Safe again.', cue: 'chime', hold: 2800 }
      ] } },
  { id: 'larry', n: 4, title: "Larry's Night", tagline: 'Lanterns, a carnival and one striped thief.', levels: [8, 9, 10], motif: 'lantern',
    palette: { a: '#fbd9a6', b: '#e8975a', ink: '#5a2f1d', glow: '#ffcf6b' },
    ending: {
      start: ['sky', 'town', 'rooftop'],
      reducedCaption: 'The last lantern is lit. High above, a star begins to fall.',
      beats: [
        { caption: 'The last lantern is lit.', show: ['lanterns'], cam: { x: 0, scale: 1, ms: 0 }, cue: 'bell', hold: 2200 },
        { caption: 'Lanterns rise over the market, the carnival, the whole sleepy town.', cam: { x: 0, y: 8, ms: 4200 }, cue: 'swell', hold: 3400 },
        { caption: 'Somewhere, a striped tail slips over the rooftops. For now.', show: ['larry'], cue: 'whoosh', hold: 3000 },
        { caption: 'Barnaby watches the lights from the rooftop.', show: ['barnaby', 'stars'], hide: ['larry'], cam: { x: -14, y: -4, scale: 1.2, ms: 3600 }, cue: 'chime', hold: 3000 },
        { caption: 'But what is that, falling from the sky?', flash: 0.5, cue: 'sparkle', hold: 2800 }
      ] } },
  { id: 'space', n: 5, title: 'Lost in Space', tagline: 'A very small visitor took a wrong turn.', levels: [11, 12, 13], motif: 'space',
    palette: { a: '#d6d2f7', b: '#9aa7e6', ink: '#2b2a63', glow: '#9ff3d0' },
    ending: {
      start: ['sky', 'stars', 'hills', 'barnaby'],
      reducedCaption: 'Pickle is home, and a new star shines over Honeywick.',
      beats: [
        { caption: 'Honeywick, a quiet night. One new star hangs in the sky.', cam: { x: 0, scale: 1, ms: 0 }, cue: 'swell', hold: 2600 },
        { caption: 'Far, far away, a little rocket zips past the moon.', show: ['rocket'], cam: { x: -6, y: -8, scale: 1.1, ms: 3200 }, cue: 'whoosh', hold: 3000 },
        { caption: 'Sparkles trail behind it, all the way home.', show: ['trail'], cam: { x: -12, y: -12, scale: 1.15, ms: 3200 }, cue: 'sparkle', hold: 2800 },
        { caption: 'A small planet is waiting.', show: ['planet'], cam: { x: -18, y: -14, scale: 1.25, ms: 3600 }, cue: 'bell', hold: 2600 },
        { caption: 'Window by window, it lights up. Pickle is home. Bork!', show: ['home'], flash: 0.35, cue: 'chime', hold: 3000 },
        { caption: 'And down in the meadow, Barnaby waves back.', cam: { x: 0, y: 4, scale: 1, ms: 3400 }, cue: 'chime', flash: 0.4, hold: 2800 },
        { caption: 'Far to the south, under a midnight moon, a little dune begins to wiggle...', cam: { x: 8, y: 2, scale: 1.04, ms: 3200 }, cue: 'swell', hold: 3200 }
      ] } },
  { id: 'oasis', n: 6, title: 'Midnight Oasis', tagline: 'A very small worm in a very big desert.', levels: [14, 15, 16], motif: 'desert', track: 'oasis',
    palette: { a: '#f9e3c4', b: '#e9a77a', ink: '#33295e', glow: '#ffd98a' },
    ending: {
      start: ['sky', 'stars', 'moon', 'dunes'],
      reducedCaption: 'Midnight in the desert. Under the palms, one little window glows: Biscuit is home.',
      beats: [
        { caption: 'Midnight in the desert. The sand is still warm.', cam: { x: 0, scale: 1, ms: 0 }, cue: 'swell', hold: 2800 },
        { caption: 'A sleepy caravan rests under the stars.', show: ['caravan'], cam: { x: -6, scale: 1.06, ms: 3200 }, cue: 'chime', hold: 3000 },
        { caption: 'Beyond the last dune, the palms sway.', show: ['palms', 'pool'], cam: { x: -14, y: -2, scale: 1.14, ms: 3400 }, cue: 'sparkle', hold: 3000 },
        { caption: 'A little round window glows. Biscuit is home.', show: ['house'], cam: { x: -20, y: -4, scale: 1.24, ms: 3400 }, cue: 'bell', flash: 0.35, hold: 3200 },
        { caption: 'And beyond the last dune, a striped tent begins to glow...', show: ['barnaby'], cam: { x: -6, y: 0, scale: 1, ms: 3600 }, cue: 'chime', hold: 3200 }
      ] } },
  { id: 'circus', n: 7, title: 'The Big Top', tagline: 'A very small clown and one missing star ball.', levels: [17, 18, 19], motif: 'bigtop',                                         // add track: 'circus' here once public/music/big-top.mp3 exists
    palette: { a: '#fbd9d9', b: '#f09aa8', ink: '#4a2147', glow: '#ffe08a' },
    ending: {
      start: ['sky', 'stars', 'tent'],
      reducedCaption: 'The curtain is up, the lights are bright, and a very small clown takes a very big bow.',
      beats: [
        { caption: 'Night falls on the big top. Every flag is flying.', show: ['flags'], cam: { x: 0, scale: 1, ms: 0 }, cue: 'swell', hold: 2800 },
        { caption: 'One by one, the string lights come on.', show: ['lights'], cam: { x: -6, scale: 1.06, ms: 3200 }, cue: 'sparkle', hold: 3000 },
        { caption: 'The whole town has come to the show.', show: ['crowd'], cam: { x: -12, y: -2, scale: 1.14, ms: 3400 }, cue: 'chime', hold: 3000 },
        { caption: 'A spotlight finds the ring, and a golden star ball rolls in.', show: ['ring', 'ball'], cam: { x: -18, y: -4, scale: 1.24, ms: 3400 }, cue: 'whoosh', flash: 0.3, hold: 3200 },
        { caption: 'On top of it, a very small clown. Pippy bows!', show: ['pippy'], cue: 'bell', flash: 0.4, hold: 3000 },
        { caption: 'And in the front row, a bear is clapping very loudly.', show: ['barnaby'], cam: { x: -6, y: 0, scale: 1, ms: 3600 }, cue: 'chime', hold: 3200 },
        { caption: 'Far away, over a sunny meadow, a tiny red light begins to fall...', cam: { x: 8, y: -4, scale: 1.04, ms: 3400 }, cue: 'swell', hold: 3200 }
      ] } },
  { id: 'dino', n: 8, title: 'Dino Strikes Back', tagline: 'A herd of friendly dinos and one very big rock.', levels: [20, 21, 22], motif: 'meteor', track: 'dino',
    palette: { a: '#d8f3c9', b: '#8fd68a', ink: '#27472f', glow: '#ffe08a' },
    ending: {
      start: ['sky', 'hills', 'dinos'],
      reducedCaption: 'The meteor is stardust, the meadow is safe, and a very small T. rex gives a very big roar.',
      beats: [
        { caption: 'The sky is quiet. The dust settles over the meadow.', cam: { x: 0, scale: 1, ms: 0 }, cue: 'swell', hold: 2800 },
        { caption: 'Where the meteor was, a thousand new stars begin to glow.', show: ['stars', 'burst'], cam: { x: 0, y: -6, scale: 1.06, ms: 3400 }, cue: 'sparkle', flash: 0.35, hold: 3200 },
        { caption: 'The sun comes out, and the dinos come out to play.', show: ['sun'], cam: { x: -8, y: 0, scale: 1.1, ms: 3400 }, cue: 'chime', hold: 3000 },
        { caption: 'The Boing Ball bounces home, higher than ever.', show: ['ball'], cam: { x: -16, y: 2, scale: 1.18, ms: 3400 }, cue: 'whoosh', hold: 3000 },
        { caption: 'And a very small T. rex gives a very big roar. Thank you, Barnaby!', show: ['barnaby'], cam: { x: -6, y: 0, scale: 1, ms: 3600 }, cue: 'bell', flash: 0.3, hold: 3400 }
      ] } }
];

/* the layers on stage when the film has finished (what reduced motion shows instead of the whole film) */
export function endingLayers(c: Chapter): string[] {
  const on = new Set(c.ending.start);
  c.ending.beats.forEach(b => { (b.show || []).forEach(id => on.add(id)); (b.hide || []).forEach(id => on.delete(id)); });
  return FILM_LAYERS[c.motif].filter(id => on.has(id));
}

export const chapterOf =(levelN: number): Chapter | undefined => CHAPTERS.find(c => c.levels.includes(levelN));
export const isChapterEnd = (levelN: number): boolean => { const c = chapterOf(levelN); return !!c && c.levels[c.levels.length - 1] === levelN; };
/* a chapter opens when the player has unlocked its first level */
export const chapterUnlocked = (c: Chapter, unlocked: number): boolean => unlocked >= c.levels[0];
export const chapterSolved = (c: Chapter, isSolved: (n: number) => boolean): boolean => c.levels.every(isSolved);
/* "Case 2.1": the chapter number, then the level's place inside its chapter */
export const caseLabel = (levelN: number): string => { const c = chapterOf(levelN); return c ? 'Case ' + c.n + '.' + (c.levels.indexOf(levelN) + 1) : 'Case ' + levelN; };
