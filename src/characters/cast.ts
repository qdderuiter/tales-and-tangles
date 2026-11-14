import { $ } from '../core/dom.ts';
import { Barnaby } from './barnaby.ts';
import type { Bear } from './barnaby.ts';
import { Larry } from './larry.ts';
import type { LarryPortrait } from './larry.ts';
import { Pup } from './pup.ts';
import type { PupPortrait } from './pup.ts';
import { Worm } from './worm.ts';
import type { WormPortrait } from './worm.ts';
import { Elephant } from './elephant.ts';
import type { ElephantPortrait } from './elephant.ts';
import { Dino } from './dino.ts';
import type { DinoPortrait } from './dino.ts';
import { Rocky } from './rocky.ts';
import type { RockyPortrait } from './rocky.ts';
import { Mittens } from './mittens.ts';
import type { MittensPortrait } from './mittens.ts';

/* The recurring characters that live on the screens, created once at boot (createCast).
     title / story / pz / z / c / v / w   Barnaby on the title, story, Words, Trail, notebook, victory and wardrobe screens
     larry                                Evil Larry's portrait on the story screen */
export const cast = {} as { title: Bear; story: Bear; pz: Bear; z: Bear; k: Bear; c: Bear; v: Bear; w: Bear; larry: LarryPortrait; pup: PupPortrait; worm: WormPortrait; elephant: ElephantPortrait; dino: DinoPortrait; rocky: RockyPortrait; mittens: MittensPortrait };   // filled by createCast() at boot

/* the bears that switch to their Noir look while Barnaby Noir is on (the others are on screens Noir never shows) */
const NOIR_SKINNED = ['pz', 'z', 'c', 'v'] as const;

export function createCast() {
  cast.title = Barnaby.create($('#titleBear'));
  cast.story = Barnaby.create($('#storyBear'));
  cast.pz = Barnaby.create($('#pzBear'));
  cast.z = Barnaby.create($('#zBear'));
  cast.k = Barnaby.create($('#kBear'));
  cast.c = Barnaby.create($('#cBear'));
  cast.v = Barnaby.create($('#vBear'));
  cast.w = Barnaby.create($('#wBear'));
  [cast.title, cast.pz, cast.z, cast.k, cast.c, cast.v, cast.w].forEach(b => Barnaby.makePokeable(b));
  cast.larry = Larry.create($('#storyLarry'));
  cast.pup = Pup.create($('#storyPup'));
  cast.worm = Worm.create($('#storyWorm'));
  cast.elephant = Elephant.create($('#storyElephant'));
  cast.dino = Dino.create($('#storyDino'));
  cast.rocky = Rocky.create($('#storyRocky'));
  cast.mittens = Mittens.create($('#storyMittens'));
}

export function setNoirSkin(on: boolean) {
  NOIR_SKINNED.forEach(k => { if (cast[k]) cast[k].setSkin(on); });
}
