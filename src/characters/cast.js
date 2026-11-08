import { $ } from '../core/dom.js';
import { Barnaby } from './barnaby.js';
import { Larry } from './larry.js';

/* The recurring characters that live on the screens, created once at boot (createCast).
     title / story / pz / z / c / v / w   Barnaby on the title, story, Words, Trail, notebook, victory and wardrobe screens
     larry                                Evil Larry's portrait on the story screen */
export const cast = { title: null, story: null, pz: null, z: null, c: null, v: null, w: null, larry: null };

/* the bears that switch to their Noir look while Barnaby Noir is on (the others are on screens Noir never shows) */
const NOIR_SKINNED = ['pz', 'z', 'c', 'v'];

export function createCast() {
  cast.title = Barnaby.create($('#titleBear'));
  cast.story = Barnaby.create($('#storyBear'));
  cast.pz = Barnaby.create($('#pzBear'));
  cast.z = Barnaby.create($('#zBear'));
  cast.c = Barnaby.create($('#cBear'));
  cast.v = Barnaby.create($('#vBear'));
  cast.w = Barnaby.create($('#wBear'));
  [cast.title, cast.pz, cast.z, cast.c, cast.v, cast.w].forEach(b => Barnaby.makePokeable(b));
  cast.larry = Larry.create($('#storyLarry'));
}

export function setNoirSkin(on) {
  NOIR_SKINNED.forEach(k => { if (cast[k]) cast[k].setSkin(on); });
}
