import type { RawLine } from './types.ts';

/* The ending of the whole game. It belongs to no chapter: it follows whichever level is the LAST one (dialogue/story-builder.ts adds the
   epilogue to that level's outro) and whichever chapter is the LAST one (scenes/chapter-film.ts adds the finale sting, "The End" and the
   credits). Adding a chapter later therefore moves the ending to it, and nothing here needs to change except the credits. */

/* Barnaby's goodbye, after the last case's own outro */
export const EPILOGUE: RawLine[] = [
  { e: 'proud', t: 'Honey jars, moons, lighthouses, lanterns, a space pup and one very brave little worm. What a journey, partner.' },
  { e: 'happy', t: 'Every case is solved, and everyone is home. Thank you for walking it with me.' }
];

/* the credit lines that scroll under "The End" */
export const CREDITS = ['Tales & Tangles', 'Barnaby, detective bear', 'Evil Larry, thief of lanterns', 'Pickle, space pup', 'Biscuit, little sand worm', 'Thank you for playing'];
