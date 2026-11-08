/* Small shared types with no game knowledge beyond the shape of a puzzle result. */

/* a [row, col] grid cell */
export type Cell = [number, number];

/* what a finished puzzle reports (Scoring.compute, plus whatever the puzzle adds) */
export interface PuzzleResult {
  score: number;
  stars: number;
  secs: number;
  wrongs: number;
  hints: number;
  maxCombo?: number;
  squares?: string;
  bonusWords?: number;
}

export type PuzzleKind = 'word' | 'zip' | (string & {});
