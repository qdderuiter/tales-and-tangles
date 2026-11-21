import type { RawLine } from './types.ts';

/* The ending of the whole game. It belongs to no chapter: it follows whichever level is the LAST one (dialogue/story-builder.ts adds the
   epilogue to that level's outro) and whichever chapter is the LAST one (scenes/chapter-film.ts adds the finale sting, "The End" and the
   credits). Adding a chapter later therefore moves the ending to it, and nothing here needs to change. */

/* Barnaby's goodbye, after the last case's own outro */
export const EPILOGUE: RawLine[] = [
  { e: 'proud', t: 'Honey jars, moons, lighthouses, lanterns, a space pup, a very brave little worm and a clown on a star ball, a meadow of dinosaurs with a meteor to smash, a very small stone with a brand new home, a desert island with a worm, a thief and a tiger, a faraway land of cats with a whole lot of yarn to play with, and a pyramid full of spaghetti. What a journey, partner.' },
  { e: 'happy', t: 'Every case is solved, and everyone is home. Thank you for walking it with me.' }
];

/* the credit line under "The End" */
export const CREDITS = ['Thank you for playing!'];
