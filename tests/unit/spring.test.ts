import { describe, expect, it } from 'vitest';
import { SPRING_NAV, project, releaseVelocity, stepSpring } from '../../src/core/spring.ts';
import type { SpringOpts, SpringState } from '../../src/core/spring.ts';

/* run a spring in small fixed frames, returning every sample */
function run(from: SpringState, target: number, o: SpringOpts, seconds: number, dt = 1 / 120): SpringState[] {
  const out = [from];
  let s = from;
  for (let t = 0; t < seconds; t += dt) { s = stepSpring(s, target, dt, o); out.push(s); }
  return out;
}

describe('stepSpring', () => {
  it('a critically damped spring arrives without overshooting', () => {
    const xs = run({ x: 0, v: 0 }, 100, SPRING_NAV, 2).map(s => s.x);
    expect(Math.max(...xs)).toBeLessThanOrEqual(100 + 1e-9);
    expect(xs[xs.length - 1]).toBeCloseTo(100, 2);
  });

  it('an under-damped spring overshoots, then settles', () => {
    const xs = run({ x: 0, v: 0 }, 100, { damping: 0.8, response: 0.35 }, 3).map(s => s.x);
    expect(Math.max(...xs)).toBeGreaterThan(100);
    expect(xs[xs.length - 1]).toBeCloseTo(100, 2);
  });

  it('an over-damped spring creeps in without overshooting', () => {
    const xs = run({ x: 0, v: 0 }, 100, { damping: 2, response: 0.35 }, 4).map(s => s.x);
    expect(Math.max(...xs)).toBeLessThanOrEqual(100 + 1e-9);
    expect(xs[xs.length - 1]).toBeCloseTo(100, 1);
  });

  it('is frame-rate independent: one big step equals many small ones', () => {
    for (const o of [SPRING_NAV, { damping: 0.8, response: 0.35 }, { damping: 2, response: 0.5 }]) {
      const small = run({ x: 10, v: 200 }, -30, o, 0.4, 1 / 1000).pop()!;
      const big = stepSpring({ x: 10, v: 200 }, -30, 0.4, o);
      expect(big.x).toBeCloseTo(small.x, 1);
    }
  });

  it('starts from the given velocity: a push away from the target moves away first', () => {
    const first = stepSpring({ x: 0, v: -500 }, 100, 1 / 120, SPRING_NAV);
    expect(first.x).toBeLessThan(0);
  });

  it('re-targeting keeps position and velocity continuous (no jump)', () => {
    const mid = run({ x: 0, v: 0 }, 100, SPRING_NAV, 0.15).pop()!;
    const next = stepSpring(mid, -50, 1e-6, SPRING_NAV);             // a new target an instant later
    expect(next.x).toBeCloseTo(mid.x, 3);
    expect(Math.abs(next.v - mid.v)).toBeLessThan(1);               // vs. a velocity of hundreds: no brick wall
  });

  it('dt <= 0 changes nothing', () => {
    const s = { x: 3, v: 4 };
    expect(stepSpring(s, 10, 0, SPRING_NAV)).toEqual(s);
  });
});

describe('project (momentum)', () => {
  it('matches the exponential-decay form: v/1000 * d / (1 - d)', () => {
    expect(project(1000)).toBeCloseTo(0.998 / 0.002, 6);
    expect(project(-1000)).toBeCloseTo(-499, 6);
    expect(project(0)).toBe(0);
    expect(project(1000, 0.99)).toBeCloseTo(0.99 / 0.01, 6);
  });
});

describe('releaseVelocity', () => {
  it('uses only the last ~100 ms, so pausing before release means no flick', () => {
    expect(releaseVelocity([{ x: 0, t: 0 }, { x: 100, t: 50 }, { x: 100, t: 400 }, { x: 100, t: 450 }])).toBe(0);
  });
  it('reads px per second over the window', () => {
    expect(releaseVelocity([{ x: 0, t: 0 }, { x: 10, t: 50 }, { x: 20, t: 100 }])).toBeCloseTo(200, 6);
  });
  it('needs two samples', () => {
    expect(releaseVelocity([])).toBe(0);
    expect(releaseVelocity([{ x: 5, t: 1 }])).toBe(0);
  });
});
