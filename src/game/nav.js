import { MapScreen } from '../ui/map-screen.js';
import { setEvil } from './evil-mode.js';

/* go to the case-files map (always in the light: Barnaby Noir's look is switched off on the way) */
export function toMap() {
  setEvil(false);
  MapScreen.open();
}
