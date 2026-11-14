import { bearMarkup } from '../characters/barnaby-svg.ts';
import type { SceneDef } from '../core/scenes.ts';
import { Store } from '../state/store.ts';

/* ---------- small pieces every character cinematic (island-scene, cats-scene) needs ---------- */

/* a CSS translate in px, with optional extra transform functions after it */
export const px = (x: number, y: number, extra = '') => 'translate(' + x + 'px,' + y + 'px)' + (extra ? ' ' + extra : '');

/* put Barnaby, in whatever the player dressed him in, into `art` as a 104 x 120 drawing */
export function dressBear(art: Element) {
  const markup = bearMarkup(Store.data.wardrobe.equipped);
  art.innerHTML = markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6);
  const bear = art.firstElementChild;
  if (!bear) return;
  bear.removeAttribute('class'); bear.removeAttribute('role'); bear.removeAttribute('aria-label');
  for (const [k, v] of Object.entries({ x: 0, y: 0, width: 104, height: 120 })) bear.setAttribute(k, String(v));
}

/* a cinematic as the scene registry wants it; one with no "case closed" part gets an empty caught() */
const none = async () => { /* this cinematic has no "case closed" part */ };
export const wrap = (intro: () => Promise<void>, caught: () => Promise<void> = none): SceneDef => ({ intro, caught });
