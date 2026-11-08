import { MapScreen } from '../ui/map-screen.ts';
import { setEvil } from './evil-mode.ts';

/* go to the case-files map (always in the light: Barnaby Noir's look is switched off on the way) */
export function toMap() {
  setEvil(false);
  MapScreen.open();
}
