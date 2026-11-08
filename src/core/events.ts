/* A tiny publish/subscribe bus. Modules announce what happened (emit) and other modules react (on), so they don't have to import each other.
   Events in use:
     screen            { name }                a screen was shown (UI.show)
     evil:changed      { on }                  Barnaby Noir mode switched on/off (game/evil-mode.js)
     settings:changed  { key, on }             a title-screen toggle flipped (ui/settings.js)
     puzzle:won        { kind, result, fresh } a puzzle was solved; fresh = counts toward the perfect streak (badges and Noir listen)
     progress          (nothing)               something that can earn a badge changed: case solved, bonus word found, wardrobe purchase
     audio:duck        { ms }                  dip the music for ms (fanfares)
   Handlers run synchronously, in the order they were registered. */
const handlers = new Map();

export function on(name, fn) {
  if (!handlers.has(name)) handlers.set(name, []);
  handlers.get(name).push(fn);
  return () => off(name, fn);
}

export function off(name, fn) {
  const list = handlers.get(name);
  const i = list ? list.indexOf(fn) : -1;
  if (i >= 0) list.splice(i, 1);
}

export function emit(name, payload) {
  const list = handlers.get(name);
  if (list) list.slice().forEach(fn => fn(payload));     // copy: a handler may unsubscribe while we iterate
}
