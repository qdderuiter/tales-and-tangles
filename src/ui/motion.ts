import { stepSpring } from '../core/spring.ts';
import type { SpringOpts } from '../core/spring.ts';

/* ---------- a spring you can drive by hand ----------
   animateSpring runs one number from `from` towards `to` on the display clock, calling onFrame(x, velocity) every frame.
   It never locks anything out: `target(to)` re-aims the live spring from wherever it is, at the speed it has (no jump),
   and `grab()` stops it so a finger can take over. Callers turn the number into transform / opacity, which keeps frames cheap.
   The maths is in core/spring.ts (pure, tested); this file only owns the frame loop. */
export interface SpringHandle {
  target(to: number, velocity?: number): void;     // re-aim; pass a velocity to hand a gesture's release speed to the spring
  grab(): { x: number; v: number };                // stop right now, returning where it was
  value(): number;
  finished: Promise<void>;                         // resolves when it settles (or is grabbed / replaced)
}

export function animateSpring(from: number, to: number, opts: SpringOpts, onFrame: (x: number, v: number) => void, velocity = 0): SpringHandle {
  let s = { x: from, v: velocity }, goal = to, raf = 0, last = 0, live = true, resolve: () => void = () => {};
  const finished = new Promise<void>(r => { resolve = r; });
  const end = () => { live = false; cancelAnimationFrame(raf); resolve(); };
  const frame = (now: number) => {
    if (!live) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);          // a stalled tab must not fling the spring
    last = now;
    s = stepSpring(s, goal, dt, opts);
    if (Math.abs(s.x - goal) < 0.0005 && Math.abs(s.v) < 0.005) { s = { x: goal, v: 0 }; onFrame(goal, 0); end(); return; }
    onFrame(s.x, s.v);
    raf = requestAnimationFrame(frame);
  };
  last = performance.now();
  raf = requestAnimationFrame(frame);
  return {
    target(next, v) {
      goal = next;
      if (v !== undefined) s = { x: s.x, v };
      if (!live) { live = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    grab() { const at = { ...s }; end(); return at; },
    value: () => s.x,
    finished
  };
}
