# Tales & Tangles

Strict TypeScript ES modules in `src/`, built by Vite into one `dist/index.html`. See `README.md` for the folder map and recipes.

## Before you finish a change
Run `npm run check` (lint, typecheck, unit tests, build, browser playthrough). For a quick loop, `npm run lint`, `npm run typecheck` and `npm test` need no browser. `npm run test:e2e` needs `npm run build` first and an installed Edge (or `E2E_BROWSER_CHANNEL=chrome`).

## Rules
- **Data has no code.** `src/data/` holds content only; it may import other `data/` files, `core/` and `puzzles/*-rules.ts`, nothing else.
- **Rules files are pure.** `*-rules.ts`, `*-generator.ts` and `state/migrations.ts` use no DOM, no `window`, no `localStorage`, and import nothing from `ui/`, `audio/`, `characters/` or `game/`. Tests for them run in Node. If a test needs a DOM, extract more pure code; don't add jsdom.
- **No import cycles.** Modules talk through `core/events.ts` (`emit` / `on`) and the puzzle registry instead of importing each other.
- **Content is checked by tests.** After editing `data/levels.ts`, `chapters.ts`, `zips.ts`, `cases.ts`, `hints.ts` or `story.ts`, `npm test` says which rule broke (tiling, trail validity, unique case solution, step ids, story parts, chapter grouping and film scripts).
- **Level vs chapter.** A *level* is one case (`LEVELS`, `Store.level(n)`); a *chapter* groups levels and ends with a film (`data/chapters.ts`). Players see "Case 1.2" (`caseLabel`).
- **Save format.** Changes to `state/migrations.ts` or `Store.load` need a case in `tests/unit/store.test.ts`; a bad edit erases players' progress.

## Conventions
- TypeScript is `strict`. No `any` except `Json` in `state/migrations.ts` (parsed save data). Import with the `.ts` extension. `erasableSyntaxOnly` is on (no enums, namespaces or constructor parameter properties) because `tests/e2e/playthrough.mjs` imports `src/*.ts` straight into Node.
- Puzzles are built with `definePuzzle()` (`puzzles/puzzle-base.ts`), which types `this`. A field that is filled in by `init()` / `load()` before use is written `late<T>()` (`core/util.ts`).
- Linting is Biome (`biome.json`), not ESLint. Unused `catch` bindings are written `catch {`.
- `window.__LEVELS` in `main.ts` exists only under `import.meta.env.DEV`, for e2e scenario E.
- Git commits end with the Co-Authored-By line given by the session.
