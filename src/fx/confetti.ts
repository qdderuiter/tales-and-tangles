import { fitCanvas } from '../core/dom.ts';
import { REDUCED, pick, rand } from '../core/util.ts';
import { WORD_FILL } from '../data/palette.ts';

export const Confetti = {
  raf: 0,
  burst(canvas: HTMLCanvasElement) {
    if (REDUCED) return;
    cancelAnimationFrame(this.raf);
    const { ctx, w, h, dpr } = fitCanvas(canvas);
    const colors = WORD_FILL.slice(0, 6);
    const parts = Array.from({ length: 120 }, () => ({
      x: w / 2 + rand(-w * 0.15, w * 0.15), y: h * 0.38, vx: rand(-5, 5), vy: rand(-13, -4),
      s: rand(6, 11), r: rand(0, 6), vr: rand(-0.3, 0.3), c: pick(colors)
    }));
    const t0 = performance.now();
    const loop = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      parts.forEach(p => {
        p.vy += 0.3; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y >= h + 20) return;                                     // fallen off the bottom: nothing to draw
        alive = true;
        const cos = Math.cos(p.r) * dpr, sin = Math.sin(p.r) * dpr;   // one setTransform instead of save/translate/rotate/restore
        ctx.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6);
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (alive && now - t0 < 5000) this.raf = requestAnimationFrame(loop); else ctx.clearRect(0, 0, w, h);
    };
    this.raf = requestAnimationFrame(loop);
  },
  stop(canvas: HTMLCanvasElement) { cancelAnimationFrame(this.raf); const c = canvas.getContext('2d')!; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height); }
};
