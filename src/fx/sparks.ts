import { fitCanvas } from '../core/dom.ts';
import { REDUCED, late, pick, rand } from '../core/util.ts';

/* ---------- sparks: small particle bursts layered over a board ----------
   Points are normalised (0..1) within the canvas, so they stay correct at any board size. */
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; s: number; c: string }
export interface SparkEmitter {
  cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D; parts: Particle[]; raf: number; w: number; h: number;
  fit(): boolean;
  burst(points: { x: number; y: number }[], colors: string[], perPoint: number): void;
  loop(): void;
}

export const Sparks = {
  create(canvas: HTMLCanvasElement): SparkEmitter {
    const em: SparkEmitter = {
      cv: canvas, ctx: late<CanvasRenderingContext2D>(), parts: [], raf: 0, w: 0, h: 0,   // ctx is made by the first fit()
      fit() {
        const w = this.cv.clientWidth, h = this.cv.clientHeight;
        if (!w || !h) return false;
        if (this.w !== w || this.h !== h) { this.w = w; this.h = h; this.ctx = fitCanvas(this.cv, w, h).ctx; }
        return true;
      },
      burst(points, colors, perPoint) {
        if (REDUCED || !this.fit()) return;
        points.forEach(p => {
          for (let i = 0; i < perPoint; i++) {
            const a = rand(0, Math.PI * 2), sp = rand(1.2, 4.2);
            this.parts.push({ x: p.x * this.w, y: p.y * this.h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2, life: 0, max: rand(26, 48), s: rand(2, 4.6), c: pick(colors) });
          }
        });
        if (this.parts.length > 400) this.parts.splice(0, this.parts.length - 400);
        if (!this.raf) this.raf = requestAnimationFrame(this.loop);
      },
      loop() {
        const ctx = this.ctx, ps = this.parts;
        ctx.clearRect(0, 0, this.w, this.h);
        let k = 0;
        for (let i = 0; i < ps.length; i++) {                            // update, draw and compact in place
          const p = ps[i];
          if (p.life >= p.max) continue;
          ps[k++] = p;
          p.life++; p.vy += 0.09; p.vx *= 0.985; p.x += p.vx; p.y += p.vy;
          ctx.globalAlpha = 1 - p.life / p.max; ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 - p.life / p.max * 0.5), 0, Math.PI * 2); ctx.fill();
        }
        ps.length = k;
        ctx.globalAlpha = 1;
        this.raf = k ? requestAnimationFrame(this.loop) : 0;
        if (!k) ctx.clearRect(0, 0, this.w, this.h);
      }
    };
    em.loop = em.loop.bind(em);                                          // one bound callback, not a new closure per frame
    return em;
  }
};
