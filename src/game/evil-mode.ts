import { setNoirSkin } from '../characters/cast.ts';
import { emit } from '../core/events.ts';
import { session } from '../state/session.ts';

/* Barnaby Noir's dark look on/off: the page theme, the bears' skin, the run flag, and a notice for whoever cares (the music). */
export function setEvil(on: boolean) {
  document.body.classList.toggle('evil', on);
  if (session.run) session.run.evil = on;
  setNoirSkin(on);
  emit('evil:changed', { on });
}
