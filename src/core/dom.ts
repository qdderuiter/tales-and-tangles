export const $ = <T extends Element = HTMLElement>(sel: string, root?: ParentNode): T => (root || document).querySelector(sel) as T;

/* restart a CSS animation class (remove, force reflow, re-add) */
export const replayClass = (el: Element, ...cls: string[]) => { el.classList.remove(...cls); void el.getBoundingClientRect(); el.classList.add(...cls); };   // works for SVG too

/* add a class, drop it again after ms; the timer id is pushed into `timers` when given */
export const flashClass = (el: Element, cls: string, ms: number, timers?: ReturnType<typeof setTimeout>[]) => { el.classList.add(cls); const t = setTimeout(() => el.classList.remove(cls), ms); if (timers) timers.push(t); return t; };

export const setShown = (el: Element, on: boolean) => { el.classList.toggle('show', on); el.setAttribute('aria-hidden', on ? 'false' : 'true'); };

/* size a canvas (to w x h CSS px, default: its own box) at device pixel ratio; drawing then uses CSS pixels */
export function fitCanvas(cv: HTMLCanvasElement, w?: number, h?: number) {
  const dpr = window.devicePixelRatio || 1;
  w = w || cv.clientWidth; h = h || cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

/* an SVG element with attributes (the cinematic stages are built with it) */
export const svgEl = (tag: string, attrs: Record<string, string | number>): SVGElement => {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};
