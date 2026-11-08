/* ---------- springs, momentum and rubber-banding (pure maths: no DOM, so tests run in Node) ----------
   A spring is described the way Apple's designers do it, with two numbers instead of mass / stiffness / damping:
     damping   1 = critically damped (settles, never overshoots); below 1 it overshoots and wobbles
     response  seconds for the motion to "arrive" (not a duration: a spring has no fixed end)
   `stepSpring` is the exact solution of the damped oscillator, so it is stable at any frame time,
   and it takes the CURRENT position and velocity: re-targeting a moving spring keeps the motion continuous. */

export interface SpringOpts { damping: number; response: number }
export interface SpringState { x: number; v: number }          // position and velocity (units per second)

/* house styles: navigation never bounces; a flick or a celebration may */
export const SPRING_NAV: SpringOpts = { damping: 1, response: 0.35 };
export const SPRING_FLICK: SpringOpts = { damping: 0.8, response: 0.35 };

export function stepSpring(s: SpringState, target: number, dt: number, o: SpringOpts): SpringState {
  if (dt <= 0) return s;
  const w = (2 * Math.PI) / Math.max(o.response, 0.001), z = Math.max(o.damping, 0.001);
  const d = s.x - target, v = s.v;
  if (Math.abs(z - 1) < 1e-4) {                                 // critically damped
    const e = Math.exp(-w * dt), k = v + w * d;
    return { x: target + e * (d + k * dt), v: e * (v - w * k * dt) };
  }
  if (z < 1) {                                                  // under-damped: overshoots
    const wd = w * Math.sqrt(1 - z * z), e = Math.exp(-z * w * dt), c = Math.cos(wd * dt), n = Math.sin(wd * dt), k = (v + z * w * d) / wd;
    const dd = e * (d * c + k * n);
    return { x: target + dd, v: -z * w * dd + e * (-d * wd * n + (v + z * w * d) * c) };
  }
  const q = w * Math.sqrt(z * z - 1), r1 = -z * w + q, r2 = -z * w - q;    // over-damped: slow creep
  const c2 = (v - r1 * d) / (r2 - r1), c1 = d - c2, e1 = Math.exp(r1 * dt), e2 = Math.exp(r2 * dt);
  return { x: target + c1 * e1 + c2 * e2, v: c1 * r1 * e1 + c2 * r2 * e2 };
}

/* close enough to stop animating: within half a unit-thousandth of the target and nearly still */
export const isSettled = (s: SpringState, target: number, eps = 0.001): boolean => Math.abs(s.x - target) < eps && Math.abs(s.v) < eps * 10;

/* where a flick at `velocity` (px/s) would come to rest if it simply decelerated like scrolling (Apple's exponential-decay form) */
export const project = (velocity: number, deceleration = 0.998): number => (velocity / 1000) * deceleration / (1 - deceleration);

/* the further past a bound you drag, the less the content follows: continuous resistance instead of a hard stop */
export const rubberband = (overshoot: number, dimension: number, constant = 0.55): number =>
  (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));

/* velocity from the last few pointer samples [{ x, t(ms) }]: a short window, so a pause before release reads as zero */
export function releaseVelocity(samples: { x: number; t: number }[], windowMs = 100): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  const first = samples.find(s => last.t - s.t <= windowMs) ?? last;
  const dt = (last.t - first.t) / 1000;
  return dt > 0 ? (last.x - first.x) / dt : 0;
}
