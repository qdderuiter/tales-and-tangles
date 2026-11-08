# Tales & Tangles

Plain ES modules in `src/`, built by Vite into one `dist/index.html`. See `README.md` for the folder map and recipes.

## Before you finish a change
Run `npm run check` (lint, unit tests, build, browser playthrough). For a quick loop, `npm run lint` and `npm test` need no browser. `npm run test:e2e` needs `npm run build` first and an installed Edge (or `E2E_BROWSER_CHANNEL=chrome`).

## Rules
- **Data has no code.** `src/data/` holds content only; it may import other `data/` files, `core/` and `puzzles/*-rules.js`, nothing else.
- **Rules files are pure.** `*-rules.js`, `*-generator.js` and `state/migrations.js` use no DOM, no `window`, no `localStorage`, and import nothing from `ui/`, `audio/`, `characters/` or `game/`. Tests for them run in Node. If a test needs a DOM, extract more pure code; don't add jsdom.
- **No import cycles.** Modules talk through `core/events.js` (`emit` / `on`) and the puzzle registry instead of importing each other.
- **Content is checked by tests.** After editing `data/levels.js`, `zips.js`, `cases.js`, `hints.js` or `story.js`, `npm test` says which rule broke (tiling, trail validity, unique case solution, step ids, story parts).
- **Save format.** Changes to `state/migrations.js` or `Store.load` need a case in `tests/unit/store.test.js`; a bad edit erases players' progress.

## Conventions
- Linting is Biome (`biome.json`), not ESLint. Unused `catch` bindings are written `catch {`.
- `window.__LEVELS` in `main.js` exists only under `import.meta.env.DEV`, for e2e scenario E.
- Git commits end with the Co-Authored-By line given by the session.
