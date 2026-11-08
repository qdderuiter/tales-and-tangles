# Phase 4: tests, linting and a safety net

## Where we are
Phases 1–3 are done: the game is 64 small ES modules under `src/` (Vite builds them into one `dist/index.html`), with an event bus, a puzzle registry, data-driven chapter steps, and no import cycles.

During Phases 2–3 I built throwaway checks in a scratch folder outside the repo. They proved the refactor, but they will be lost, and anyone adding a chapter or puzzle will want them. **Phase 4 moves them into the repo** so the next feature change is protected.

| Scratch script (outside the repo) | Becomes |
|---|---|
| `pure-check.mjs` (levels, trails, cases, daily, scoring) | `tests/unit/*.test.js` (Vitest) |
| `smoke2.mjs` (4 browser scenarios) | `tests/e2e/playthrough.mjs` (Playwright) |
| `eslint.config.mjs` + `check.ps1` | `eslint.config.js`, `npm run lint`, `npm run check` |
| `cycles.mjs` | `tests/unit/architecture.test.js` |

Already in place: `vitest` is installed and `npm test` runs `vitest run` (no tests yet). The pure modules import in plain Node, since `core/util.js` no longer touches `window` at load time.

## Goals
1. A content mistake in new chapters, trails or cases fails a test, not a player.
2. A broken import, a leftover `Game.` call or an import cycle fails `npm run lint` or `npm test`.
3. One command, `npm run check`, runs everything a change needs.
4. The save-file upgrade code is isolated and tested (a bad migration would wipe a player's progress).

## 4.1 Lint (about 15 min)
- Add `eslint` and `globals` as devDependencies; commit `eslint.config.js` (same rules as the scratch config: `no-undef`, `no-unused-vars` warn with `args: 'none'`, `no-import-assign`, `no-dupe-keys`; browser globals; `sourceType: module`; add `import.meta` support via `ecmaVersion: 2022`).
- Scripts: `"lint": "eslint src tests"`.
- Why: a mechanical move can leave a name used but not imported; that only throws when the path runs. Lint finds all of them statically (it caught the real `LEVELS` miss in Phase 2).

## 4.2 Unit tests, pure logic (Vitest, node environment)
Create `tests/unit/`. Vitest's default environment is `node`; **none of these tests may need a DOM**. If one does, that's a signal to extract more pure code.

| File | What it checks |
|---|---|
| `levels.test.js` | For every `LEVELS` entry: words tile the 6×5 grid exactly once (`buildGrid`, `isSolved`); every word matches its own path forwards and backwards (`matchWord`) and is ignored once found; each level has `zip`, `evilZip`, `case`, `hint`, `trailHint`; `theme` matches a gold word |
| `zips.test.js` | For every trail (`zip` and `evilZip`): `zipSolution` passes `isSolvedTrail`; a reversed trail, a trail with a repeated cell and one crossing a wall are rejected; checkpoint numbers run 1..K in path order and the letters spell `word` |
| `cases.test.js` | For every case: exactly one assignment satisfies all clues (`caseAssignments` + `caseFits`) and it equals `solution`; it is **not** unique without the two `earned` clues (the comment in `data/cases.js` promises this); `culprit`/`culpritItem` agree with `solution`; every `earned` clue's `key` is the level's word / trail word |
| `case-hints.test.js` | `planCaseHint` never suggests a wrong cell on a solvable board, and finishes a case when followed repeatedly |
| `daily.test.js` | `generateDaily(date)` is deterministic; different dates differ; always tiles the grid; word lengths are 3–5; `shiftDate`/`formatDate` handle month and year ends (use `new Date(y, m, d)`, avoid timezone traps); `Daily.streak`/`record` logic with a stubbed Store |
| `evil.test.js` | `Evil.word(level)` keeps the same words but a different layout, still tiles the grid, and is hidden-length-safe (word lengths from `lens`) |
| `scoring.test.js` | `Scoring.compute` boundaries: star thresholds, hint and wrong penalties, floor of 100 |
| `word-rules.test.js` / `zip-rules.test.js` | Small hand-made boards for the edge cases the content tests don't reach (`attemptInfo` near / isClue, adjacency, wall keys, `prefixLength`) |
| `registry.test.js` | `registerPuzzle` adds a kind; every id in every level's `steps` is a registered puzzle or a `STEPS` entry |
| `events.test.js` | `on`/`emit` order, `off`, unsubscribing during emit, no payload |
| `architecture.test.js` | No import cycles in `src/` (port `cycles.mjs`); `data/**` imports only other `data/` files, `core/` and `puzzles/*-rules.js`; `*-rules.js` / `*-generator.js` import nothing from `ui/`, `audio/`, `characters/`, `game/` |

Notes:
- Importing `puzzles/registry.js` alone works; to test step ids you must also import `puzzles/word/word-puzzle.js` and `zip-puzzle.js`, and those touch `document` only when called. If importing them in Node fails, **don't use jsdom to paper over it**: add a `tests/unit/helpers/puzzle-ids.js` that lists the registered ids from the source text, or move `registerPuzzle(...)` calls into tiny `register.js` files. Decide when we hit it.
- Keep helper data (e.g. a made-up 2×2 zip) inside the test files so tests don't depend on shipped content when they test rules.

## 4.3 Save-data tests and `state/migrations.js`
`Store.load` mixes reading `localStorage`, the v1→v2 upgrade, and sanitising every field. A bad edit here silently erases progress.
1. **Extract** (no behaviour change): `state/migrations.js` exports `migrate(saved, readOld)` (v1 → v2) and `sanitize(saved, defaults)` (the field-by-field cleaning now inside `Store.load`). `Store.load` becomes: read → migrate → sanitize → set `this.data`.
2. **Test** (`tests/unit/store.test.js`, stub `localStorage` with a plain object in `beforeEach`):
   - empty storage gives defaults; `hasProgress()` false
   - a v1 save upgrades: word stars/best kept, `unlocked` kept, `zip` blank, `solved` false
   - garbage JSON, wrong types, unknown wardrobe ids, unknown badge ids, bonus words not in `BONUS_DICT`: all dropped, nothing throws
   - `buy`: not enough stars / already owned / Noir-locked / success; `equip` refuses unowned items
   - `recordPuzzle` keeps the best score and stars; `recordSolved` keeps the lower penalty; `stars(n)` formula
   - `notePerfect` counts 3-star results in a row and resets on anything less
   - round trip: `save()` then `load()` gives equal data
3. Guard rail: add a `version` field only if a real v3 change needs it; don't invent one now.

## 4.4 End-to-end playthrough in the repo
Move `smoke2.mjs` to `tests/e2e/playthrough.mjs` and make it portable:
- Add `playwright-core` as a devDependency. **Browser**: the scratch version drives the installed Edge (`channel: 'msedge'`). Make it `process.env.E2E_BROWSER_CHANNEL || 'msedge'` (try `chrome` too) and print a clear message if no browser is found. Don't download browsers automatically.
- **Target**: `E2E_URL` env var, defaulting to `file://…/dist/index.html` (needs `npm run build` first) with `--dev` option to start `vite` and use `http://localhost:5173`. In dev mode, wait for `#titleBear > *` before clicking (the HTML is visible before modules run: this tripped the first run).
- Keep the four scenarios (A full chapter 1 + side screens + badge assertion, B Larry cinematic, C Noir cutscene, D replay pips). Read the chapter-1 answers (word paths, zip path, culprit, item) from `src/data` instead of hard-coding them, so the test follows the content. Seed saves through `localStorage` key `tales_tangles_v2` (export `Store.KEY` use, or keep the literal in one place).
- Treat any `pageerror` or `console.error` as a failure (already done).
- Add scenarios as features land. Two worth adding now: **E** a level with a custom `steps` list (e.g. skip the bridge), by seeding a temporary test level through a dev-only hook, to prove the data-driven steps; **F** Reset progress (two taps) clears the save.
- Screenshots go to `tests/e2e/out/` (git-ignored).
- Scripts: `"test:e2e": "node tests/e2e/playthrough.mjs"`.

## 4.5 One command and a note for future you
- `"check": "npm run lint && npm test && npm run build && npm run test:e2e"`.
- `README.md` (short): how to run (`npm run dev`, `npm run build`, open `dist/index.html`), the folder map from Phase 2–3, and three recipes:
  1. **Add a chapter**: a `LEVELS` entry, a `ZIPS`/`EVIL_ZIPS` entry, a `CASES` entry, a `THEME_HINTS` / `TRAIL_HINTS` entry, a `STORY_RAW` entry; then `npm test` tells you which rule you broke.
  2. **Add a puzzle type**: engine file, `registerPuzzle`, put its id in `steps`.
  3. **Add a badge, wardrobe item or setting**: which data file, and which test covers it.
- Optional: `CLAUDE.md` pointing at `npm run check` and the rule "data has no code, rules files are pure".

## Order of work and sizing
1. 4.1 lint, then run it (should be clean). *Small.*
2. 4.2 content tests first (`levels`, `zips`, `cases`: they mirror the scratch script, so low risk), then the rest. *Medium.*
3. 4.3 extract migrations, then test. *Medium; the only refactor in this phase, so run the e2e before and after.*
4. 4.4 move the e2e. *Medium.*
5. 4.5 scripts and README. *Small.*

## Done when
- `npm run check` passes from a clean checkout (after `npm install`).
- Deliberately breaking things makes the right check fail. Try each once and revert:
  - delete an import → lint fails
  - change a level word so the grid no longer tiles → `levels.test.js` fails
  - add a clue that makes a case ambiguous → `cases.test.js` fails
  - import `ui/` from a `*-rules.js` file → `architecture.test.js` fails
  - corrupt the v1→v2 mapping → `store.test.js` fails
- No test needs a browser, a DOM library, or network, except `test:e2e`.

## Risks and open questions
- **No git in this shell.** Please commit after Phase 3 and again after each sub-step here, so a bad refactor of `Store.load` is one revert away.
- **Vitest 5 + Node 26** are new; if a config quirk appears, pin to what works and note it.
- **Browser availability.** The e2e needs Edge or Chrome installed; it is intentionally not part of `npm test`, so CI-less use is not blocked.
- **Known data issue to decide on:** `FLOAT_COLORS` keys in `characters/barnaby.js` look like mojibake (`â™ª`, `â™¥`), so Barnaby's floating note and heart colours probably never apply. Fix it (and add a one-line test) or leave it? Needs your call.
- **Out of scope for now:** TypeScript, a UI framework, per-screen component tests, performance budgets.
