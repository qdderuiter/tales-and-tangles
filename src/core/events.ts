/* A tiny publish/subscribe bus. Modules announce what happened (emit) and other modules react (on), so they don't have to import each other.
   Events in use:
     screen            { name }                a screen was shown (UI.show)
     evil:changed      { on }                  Barnaby Noir mode switched on/off (game/evil-mode.ts)
     settings:changed  { key, on }             a title-screen toggle flipped (ui/settings.ts)
     puzzle:won        { kind, result, fresh } a puzzle was solved; fresh = counts toward the perfect streak (badges and Noir listen)
     progress          (nothing)               something that can earn a badge changed: case solved, bonus word found, wardrobe purchase
     audio:duck        { ms }                  dip the music for ms (fanfares)
     film              { on }                  a chapter film started / ended: the music steps aside for its score
   Handlers run synchronously, in the order they were registered. */
import type { PuzzleKind, PuzzleResult } from './types.ts';

export interface EventMap {
  screen: { name: string };
  'evil:changed': { on: boolean };
  'settings:changed': { key: string; on: boolean };
  'puzzle:won': { kind: PuzzleKind; result: PuzzleResult; fresh: boolean };
  progress: undefined;
  'audio:duck': { ms: number };
  film: { on: boolean };
}
type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void;

const handlers = new Map<keyof EventMap, Handler<never>[]>();

export function on<K extends keyof EventMap>(name: K, fn: Handler<K>): () => void {
  if (!handlers.has(name)) handlers.set(name, []);
  handlers.get(name)!.push(fn as Handler<never>);
  return () => off(name, fn);
}

export function off<K extends keyof EventMap>(name: K, fn: Handler<K>): void {
  const list = handlers.get(name);
  const i = list ? list.indexOf(fn as Handler<never>) : -1;
  if (i >= 0) list!.splice(i, 1);
}

export function emit<K extends keyof EventMap>(name: K, ...payload: EventMap[K] extends undefined ? [] : [EventMap[K]]): void {
  const list = handlers.get(name);
  if (list) list.slice().forEach(fn => (fn as (p: unknown) => void)(payload[0]));     // copy: a handler may unsubscribe while we iterate
}
