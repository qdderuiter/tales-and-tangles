# Tales & Tangles

A cosy detective game: Barnaby Bear solves thirteen cases with a word-search, a scent trail and a murdle-style notebook. The cases are grouped into five themed **chapters**, and each chapter ends with a short film. Strict TypeScript ES modules under `src/` (no framework); Vite builds them into **one self-contained `dist/index.html`**.

**Words used in the code:** a *level* is one case (`LEVELS`, `Store.level(n)`, shown to players as "Case 1.2"); a *chapter* is a group of levels with a theme and an ending film (`data/chapters.ts`). Story line ids keep the old `ch<n>_...` prefix because voice clips attach to them by file name.

## Run it

```
npm install
npm run dev          # dev server with hot reload (http://localhost:5173)
npm run build        # writes dist/index.html: open that file in a browser, or host it anywhere
npm run check        # lint + typecheck + unit tests + build + browser playthrough: run this before you commit
```

| Command | What it does |
|---|---|
| `npm run lint` | Biome (`biome.json`): undefined names, unused variables, duplicate keys, import reassignment |
| `npm run typecheck` | `tsc` twice, strict: `tsconfig.json` (`src/`, DOM types) and `tsconfig.node.json` (`tests/unit/` and `vite.config.ts`, Node types). Vite itself does not type-check |
| `npm test` | Vitest unit tests in `tests/unit/`: pure logic and content, **no browser or DOM** |
| `npm run test:e2e` | Playwright playthrough of the built game (`tests/e2e/playthrough.mjs`). Needs `npm run build` first and an installed Edge (or `E2E_BROWSER_CHANNEL=chrome`). `-- --dev` plays the dev server and adds scenarios E and G. `-- A C` runs only those scenarios. Screenshots land in `tests/e2e/out/` |
| `npm run check` | all of the above, in order |

## Folder map (`src/`)

| Folder | What lives there |
|---|---|
| `main.ts` | entry point: styles, then boot |
| `core/` | tiny helpers with no game knowledge: `util`, `grid`, `dom`, `events` (publish/subscribe bus), `layout`, `scenes`, `spring` (pure spring / momentum / rubber-band maths) |
| `data/` | **content only, no code**: `chapters` (the five chapters and their film scripts), `levels`, `zips`, `cases`, `hints`, `story`, `badges`, `wardrobe`, `words`, `palette`, `critters` |
| `puzzles/` | the three puzzles. `*-rules.ts` and `*-generator.ts` are **pure** (testable in Node); `*-puzzle.ts` / `case-screen.ts` add the DOM. `registry.ts` lists the puzzle kinds, `evil.ts` the Barnaby Noir remix, `daily*.js` the Daily Case |
| `game/` | the flow between screens: `level-flow` runs a level (and plays a chapter's film after its last level), `level-steps` defines the step order, plus `noir-flow`, `daily-flow`, `nav`, `evil-mode` |
| `state/` | `store.ts` (the save file and everything derived from it), `migrations.ts` (pure save upgrade and clean-up), `session.ts` (what is happening right now) |
| `ui/` | screens: map (chapter cards), `chapter-view` (the sheet that grows out of a card), `motion` (the spring frame loop), story, wardrobe, badges, victory card, settings |
| `scenes/`, `fx/` | cutscenes (Noir, Evil Larry, Pickle the space pup, the chapter films) and confetti / sparks. `film` is the shared playback engine, `film-art` draws the layered stages (also the art on the map cards), `chapter-film` plays a chapter's script |
| `dialogue/`, `characters/`, `audio/` | dialogue engine and story lines, Barnaby and the cast, sound / music / voice / haptics. `film-score` holds the chapter films' synthesized music and cues |
| `styles/` | CSS, one file per area |

Rules the tests enforce (`tests/unit/architecture.test.ts`): no import cycles; `data/` imports only `data/`, `core/` and `puzzles/*-rules.ts`; `core/` imports only `core/`; `*-rules.ts` and `*-generator.ts` import nothing from `ui/`, `audio/`, `characters/` or `game/`.

## Recipes

### Add a chapter
A chapter is an entry in `CHAPTERS` (`data/chapters.ts`): the level numbers it groups (consecutive, and together all levels exactly once), its palette, a `motif` and an `ending` film script. A script lists the `start` layers on stage and a list of beats (caption, camera move, layers to `show` / `hide`, an audio `cue`, a `flash`, how long to `hold`); layer ids come from `FILM_LAYERS`. A new motif needs its layers drawn in `scenes/film-art.ts` and its crop in `BAND_VIEWS`; the chapter's id needs a score in `audio/film-score.ts` (`SCORES`). `npm test` (`chapters.test.ts`) checks the grouping, the layer ids, the cues and the film length. Watch the film with `ChapterFilm.play(id)` from the dev console, or from its card on the map once seen.

### Add a level
A level (case) *n* is spread over a few data files, all indexed by position (so keep them in step), and then belongs to a chapter above:
1. `data/levels.ts`: a `LEVELS` entry. Words are `[WORD, 'rc rc rc']` paths that must tile the 6×5 grid exactly once; `theme` is the gold word.
2. `data/zips.ts`: a `ZIPS` entry and an `EVIL_ZIPS` entry (the Scent Trail: one solution, checkpoint letters spell `word`).
3. `data/cases.ts`: a `CASES` entry (the clues must leave exactly one solution, and need each of the two `earned` clues to do it; the unit tests also check the case can be solved by hand).
4. `data/hints.ts`: a `THEME_HINTS` entry, and a `TRAIL_HINTS` entry keyed by the trail word.
5. `data/story.ts`: a `STORY_RAW` entry (`intro`, `outro`) and a `STORY_EXTRA` entry (`bridge`, `caseIntro`).

Then `npm test`: `levels`, `zips`, `cases`, `case-hints` and `story` tell you which rule you broke. Run `npm run test:e2e` to see it play.

### Add a puzzle type
1. Write the engine in `puzzles/<kind>/` (extend `PuzzleBase`; keep the rules in a pure `*-rules.ts`, with a unit test).
2. End the file with `registerPuzzle('<kind>', { obj, screen, board, tileSel, title, evil })` (see `puzzles/registry.ts`).
3. Put its id in a level's `steps` list (`data/levels.ts`; the default order is `DEFAULT_STEPS` in `game/level-steps.ts`).
4. Add its id to the list in `tests/unit/registry.test.ts` (`word`, `zip`) and a scenario to `tests/e2e/playthrough.mjs`. `registry.test.ts` fails on an unknown step id.

### Add a badge, a wardrobe item or a setting
- **Badge**: `data/badges.ts` (`id`, `name`, `desc`, and a `test(d, ev, S)` function). Covered by: nothing yet beyond `store.test.ts` (unknown badge ids are dropped on load) and e2e scenario A (the first badge). Add a case to `store.test.ts` when a badge has real logic.
- **Wardrobe item**: `data/wardrobe.ts` (`id`, `slot`, `cost`, or `unlock` for a Noir reward). Covered by: `store.test.ts` (buy, equip, unknown ids, Noir locks).
- **Setting**: the key and its button in `ui/settings.ts`, the default in `Store.defaults()`, and the title-screen button in `index.html`. Covered by: `store.test.ts` (settings merge over defaults).

### Change the save format
Edit `state/migrations.ts` and cover the change in `tests/unit/store.test.ts` (a bad edit there silently erases progress). Only add a `version` field when a real v3 change needs one. Level records are saved under `levels`; saves written before chapters existed call that key `chapters`, and `sanitize` still reads it.
