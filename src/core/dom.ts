export const $ = (sel, root) => (root || document).querySelector(sel);

/* restart a CSS animation class (remove, force reflow, re-add) */
export const replayClass = (el, ...cls) => { el.classList.remove(...cls); void el.getBoundingClientRect(); el.classList.add(...cls); };   // works for SVG too

/* add a class, drop it again after ms; the timer id is pushed into `timers` when given */
export const flashClass = (el, cls, ms, timers) => { el.classList.add(cls); const t = setTimeout(() => el.classList.remove(cls), ms); if (timers) timers.push(t); return t; };

export const setShown = (el, on) => { el.classList.toggle('show', on); el.setAttribute('aria-hidden', on ? 'false' : 'true'); };

/* size a canvas (to w x h CSS px, default: its own box) at device pixel ratio; drawing then uses CSS pixels */
export function fitCanvas(cv, w, h) {
  const dpr = window.devicePixelRatio || 1;
  w = w || cv.clientWidth; h = h || cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}
