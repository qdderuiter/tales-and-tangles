import { COLS, ROWS } from '../core/grid.ts';
import { mulberry32, shuffle } from '../core/util.ts';
import type { TempLevel, WordEntry } from '../data/types.ts';
import { chunk, hamiltonian } from './daily-generator.ts';

/* ---------- Barnaby Noir: the evil remix ----------
   Every EVIL_STREAK perfect (3-star) puzzle results (not necessarily in a row) summon Noir, who offers a harder, dark-themed REMIX of the puzzle you just solved.
   Evil.word re-lays the same words on a fresh snaking grid; the Scent Trail uses a pre-generated harder trail (lvl.evilZip). */
export const EVIL_STREAK = 10;

export const Evil = {
  key(kind: string, base: Partial<Pick<TempLevel, 'n' | 'daily' | 'date'>>) { return base.daily ? 'daily-' + base.date : kind + base.n; },   // Store.data.evil.cleared key
  word(base: TempLevel): TempLevel {
    const rand = mulberry32(((Date.now() ^ (base.n * 7919)) >>> 0) || 1);
    const lens = base.words.map(w => w.w.length);
    let best: { turns: number; words: WordEntry[] } | null = null;
    for (let t = 0; t < 14; t++) {                                   // keep the layout with the most turns (the twistiest paths)
      const path = hamiltonian(ROWS, COLS, rand, 2500);
      const order = shuffle(base.words.map((_, i) => i), rand);
      const pieces = chunk(path, order.map(i => lens[i]));
      let turns = 0;
      const words: WordEntry[] = order.map((i, k0) => {
        const p = pieces[k0];
        for (let k = 2; k < p.length; k++) if (p[k][0] - p[k - 1][0] !== p[k - 1][0] - p[k - 2][0] || p[k][1] - p[k - 1][1] !== p[k - 1][1] - p[k - 2][1]) turns++;
        return { w: base.words[i].w, gold: base.words[i].gold, p };
      });
      if (!best || turns > best.turns) best = { turns, words };
    }
    return { n: base.n, evil: true, daily: !!base.daily, date: base.date, title: base.title, theme: base.theme, hint: base.hint, scene: ['#2a1d3d', '#150f20'], words: best!.words };
  }
};
