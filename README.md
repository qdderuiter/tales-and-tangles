# Tales & Tangles

A cosy detective game: Barnaby Bear solves ten cases with a word-search, a scent trail and a murdle-style notebook. Plain ES modules under `src/`; Vite builds them into **one self-contained `dist/index.html`**.

## Run it

```
npm install
npm run dev          # dev server with hot reload (http://localhost:5173)
npm run build        # writes dist/index.html: open that file in a browser, or host it anywhere
npm run check        # lint + unit tests + build + browser playthrough: run this before you commit
```

| Command | What it does |
|---|---|
| `npm run lint` | Biome (`biome.json`): undefined names, unused variables, duplicate keys, import reassignment |
| `npm test` | Vitest unit tests in `tests/unit/`: pure logic and content, **no browser or DOM** |
| `npm run test:e2e` | Playwright playthrough of the built game (`tests/e2e/playthrough.mjs`). Needs `npm run build` first and an installed Edge (or `E2E_BROWSER_CHANNEL=chrome`). `-- --dev` plays the dev server and adds scenario E. `-- A C` runs only those scenarios. Screenshots land in `tests/e2e/out/` |
| `npm run check` | all of the above, in order |

## Folder map (`src/`)

| Folder | What lives there |
|---|---|
| `main.js` | entry point: styles, then boot |
| `core/` | tiny helpers with no game knowledge: `util`, `grid`, `dom`, `events` (publish/subscribe bus), `layout`, `scenes` |
| `data/` | **content only, no code**: `levels`, `zips`, `cases`, `hints`, `story`, `badges`, `wardrobe`, `words`, `palette`, `critters` |
| `puzzles/` | the three puzzles. `*-rules.js` and `*-generator.js` are **pure** (testable in Node); `*-puzzle.js` / `case-screen.js` add the DOM. `registry.js` lists the puzzle kinds, `evil.js` the Barnaby Noir remix, `daily*.js` the Daily Case |
| `game/` | the flow between screens: `chapter-flow` runs a chapter, `chapter-steps` defines the step order, plus `noir-flow`, `daily-flow`, `nav`, `evil-mode` |
| `state/` | `store.js` (the save file and everything derived from it), `migrations.js` (pure save upgrade and clean-up), `session.js` (what is happening right now) |
| `ui/` | screens: map, story, wardrobe, badges, victory card, settings |
| `scenes/`, `fx/` | cutscenes (Noir, Evil Larry) and confetti / sparks |
| `dialogue/`, `characters/`, `audio/` | dialogue engine and story lines, Barnaby and the cast, sound / music / voice / haptics |
| `styles/` | CSS, one file per area |

Rules the tests enforce (`tests/unit/architecture.test.js`): no import cycles; `data/` imports only `data/`, `core/` and `puzzles/*-rules.js`; `core/` imports only `core/`; `*-rules.js` and `*-generator.js` import nothing from `ui/`, `audio/`, `characters/` or `game/`.

## Recipes

### Add a chapter
Chapter *n* is spread over a few data files, all indexed by position (so keep them in step):
1. `data/levels.js`: a `LEVELS` entry. Words are `[WORD, 'rc rc rc']` paths that must tile the 6×5 grid exactly once; `theme` is the gold word.
2. `data/zips.js`: a `ZIPS` entry and an `EVIL_ZIPS` entry (the Scent Trail: one solution, checkpoint letters spell `word`).
3. `data/cases.js`: a `CASES` entry (the clues must leave exactly one solution, and need the two `earned` clues to do it).
4. `data/hints.js`: a `THEME_HINTS` entry, and a `TRAIL_HINTS` entry keyed by the trail word.
5. `data/story.js`: a `STORY_RAW` entry (`intro`, `outro`) and a `STORY_EXTRA` entry (`bridge`, `caseIntro`).

Then `npm test`: `levels`, `zips`, `cases`, `case-hints` and `story` tell you which rule you broke. Run `npm run test:e2e` to see it play.

### Add a puzzle type
1. Write the engine in `puzzles/<kind>/` (extend `PuzzleBase`; keep the rules in a pure `*-rules.js`, with a unit test).
2. End the file with `registerPuzzle('<kind>', { obj, screen, board, tileSel, title, evil })` (see `puzzles/registry.js`).
3. Put its id in a chapter's `steps` list (`data/levels.js`; the default order is `DEFAULT_STEPS` in `game/chapter-steps.js`).
4. Add its id to the list in `tests/unit/registry.test.js` (`word`, `zip`) and a scenario to `tests/e2e/playthrough.mjs`. `registry.test.js` fails on an unknown step id.

### Add a badge, a wardrobe item or a setting
- **Badge**: `data/badges.js` (`id`, `name`, `desc`, and a `test(d, ev, S)` function). Covered by: nothing yet beyond `store.test.js` (unknown badge ids are dropped on load) and e2e scenario A (the first badge). Add a case to `store.test.js` when a badge has real logic.
- **Wardrobe item**: `data/wardrobe.js` (`id`, `slot`, `cost`, or `unlock` for a Noir reward). Covered by: `store.test.js` (buy, equip, unknown ids, Noir locks).
- **Setting**: the key and its button in `ui/settings.js`, the default in `Store.defaults()`, and the title-screen button in `index.html`. Covered by: `store.test.js` (settings merge over defaults).

### Change the save format
Edit `state/migrations.js` and cover the change in `tests/unit/store.test.js` (a bad edit there silently erases progress). Only add a `version` field when a real v3 change needs one.
