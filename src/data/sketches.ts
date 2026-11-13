import type { RawSketch } from './types.ts';

/* Sketch Artist pictures, keyed by level number (Chapter 10, Castaways: levels 26-29).
   '#' is a filled cell, '.' an empty one. Level 26 is 8x8, the rest 10x10.
   Each picture must be solvable with line logic alone (tests/unit/sketches.test.ts checks it; `node scripts/check-sketch.mjs` shows the clues). */
export const SKETCHES: Record<number, RawSketch> = {
  26: { name: 'A little plane', color: '#5b9bd5',
    witness: 'A passenger saw it come down: a small plane, nose to the sky. Draw what the witness describes.',
    rows: [
      '...##...',
      '...##...',
      '..####..',
      '#.####.#',
      '########',
      '...##...',
      '..####..',
      '...##...'] },
  27: { name: 'A tiger paw', color: '#e08a2e',
    witness: 'Fresh prints by the water: four toes and a big round pad. Draw the paw.',
    rows: [
      '..#....#..',
      '.###..###.',
      '.###..###.',
      '..#....#..',
      '....##....',
      '##.####.##',
      '##.####.##',
      '.########.',
      '..######..',
      '...####...'] },
  28: { name: 'A tiny spade', color: '#8a6a3b',
    witness: 'Biscuit left his digging tool behind: a handle on top, a long shaft, and a small pile of dirt. Draw the spade.',
    rows: [
      '.######...',
      '.#....#...',
      '.######...',
      '....##....',
      '....##....',
      '....##....',
      '..#.##.#..',
      '.##.##.##.',
      '##########',
      '##########'] },
  29: { name: 'A signal flame', color: '#e8573a',
    witness: 'The castaways lit it on the beach so a ship would see: a tall flame on a pile of logs. Draw the fire.',
    rows: [
      '....#.....',
      '....##....',
      '...###..#.',
      '..####.##.',
      '..#####.#.',
      '.#######..',
      '.#######..',
      '.#######..',
      '..######..',
      '##########'] }
};
