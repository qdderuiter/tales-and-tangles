/* End-to-end playthrough in a real browser (Playwright). Not part of `npm test`: it needs a browser and a built (or running) game.

     npm run build && npm run test:e2e         play the built dist/index.html (file://)
     npm run test:e2e -- --dev                 start `vite` and play http://localhost:5173 (also runs scenario E)
     E2E_URL=http://host/ npm run test:e2e     play any URL
     E2E_BROWSER_CHANNEL=chrome ...            installed browser to drive (default: msedge). No browser is downloaded.
     npm run test:e2e -- A C                   run only the named scenarios
     E2E_WORKERS=1 npm run test:e2e            scenarios run 4 at a time by default; set how many

   Scenarios ("level" = one case; a chapter groups several levels and ends with a film)
     A  level 1 start to finish, the chapter view it returns to, then the side screens (wardrobe, badges) and the first badge
     B  level 8: Evil Larry's opening cinematic, then the level's puzzle
     C  Barnaby Noir interrupts after EVIL_STREAK (10) perfect results
     D  replay a single puzzle from the map pips
     E  a level with a custom `steps` list (dev server only: it needs the dev hook in src/main.ts)
     F  Reset progress (two taps) erases the save
     G  the last level of chapter 1: its ending film plays, the next chapter unlocks, the film can be rewatched (dev server only)
     H  the chapter view: opens from its card, closes with Escape and the back button, and a locked card stays shut
     I  declining Barnaby Noir mid-level: the dark theme stays off and the level carries on
     J  chapter 5, case 1: Pickle's crash-landing film, Pickle speaking with his own portrait, then the whole case
     K  chapter 5, case 3: the whole case, Pickle's lift-off, and the chapter's closing film (an ordinary chapter end: the story goes on)
     L  the LAST case of the game (chapter 10, case 4): the whole case, the rescue, "Hear the ending", the last film with The End and the credits
     M  chapter 6, case 1: Biscuit pops out of the dunes, speaks with his own portrait, then the whole case
     N  chapter 7, case 1: Pippy loses his star ball, speaks with his own portrait, then the whole case
     O  chapter 6, case 3: the whole case, Biscuit's homecoming, and the chapter's closing film (an ordinary chapter end: the story goes on)

     P  chapter 7, case 3: the whole case, Pippy's show, and the chapter's closing film (an ordinary chapter end: the dinos are next)
     Q  chapter 8, case 1: the meteor appears over the meadow, Rexy speaks with her own portrait, then the whole case
     R  chapter 8, case 3: the whole case, the stomp-launch that smashes the meteor, and the closing film (an ordinary chapter end: Rocky is next)
     S  chapter 9, case 1: Rocky speaks with his own portrait, then the whole case
     T  chapter 9, case 3: the whole case and the closing film (an ordinary chapter end: the castaways are next)
     U  chapter 10, case 1: the plane crash opens it, then the whole case
     V  chapter 10, case 2: the tiger and Evil Larry's look open it, then Evil Larry speaks with his own portrait
     W  chapter 10, case 3: Biscuit's dig opens it

   Answers (word paths, trail, culprit, item) are read from src/data, so the test follows the content. Anything logged with
   console.error, or any uncaught page error, fails the scenario. Screenshots go to tests/e2e/out/ (git-ignored). */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { COLS, ROWS } from '../../src/core/grid.ts';
import { CHAPTERS } from '../../src/data/chapters.ts';
import { LEVELS } from '../../src/data/levels.ts';
import { EVIL_STREAK } from '../../src/puzzles/evil.ts';
import { Store } from '../../src/state/store.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'tests/e2e/out');
const args = process.argv.slice(2);
const DEV = args.includes('--dev');
const ONLY = args.filter(a => /^[A-Z]$/.test(a));
const CHANNEL = process.env.E2E_BROWSER_CHANNEL || 'msedge';
const PORT = 5173;

/* ---------- where the game is ---------- */
let devServer = null;

async function startDevServer() {
  devServer = spawn(`npm run dev -- --port ${PORT} --strictPort`, { cwd: ROOT, shell: true, stdio: 'ignore' });
  const url = `http://localhost:${PORT}/`;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) return url; } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('the vite dev server did not start on ' + url);
}

function stopDevServer() {
  if (!devServer) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(devServer.pid), '/T', '/F'], { stdio: 'ignore' });   // synchronous: we exit right after
  else devServer.kill();
}

async function resolveTarget() {
  if (process.env.E2E_URL) return { url: process.env.E2E_URL, dev: DEV };
  if (DEV) return { url: await startDevServer(), dev: true };
  const file = resolve(ROOT, 'dist/index.html');
  if (!existsSync(file)) throw new Error('dist/index.html is missing: run `npm run build` first (or use --dev)');
  return { url: pathToFileURL(file).href, dev: false };
}

/* ---------- saves ---------- */
const solvedChapter = { word: { done: true, stars: 3, best: 1400 }, zip: { done: true, stars: 3, best: 1400 }, solved: true, penalty: 0 };

/* chapter 1 solved, chapter 2 open: the starting point of scenarios B, C, D and F */
const ch1Done = { unlocked: 2, levels: { 1: solvedChapter } };

/* the first n cases solved, the next one open (the starting point of the chapter 5 scenarios) */
const solvedUpTo = n => ({ unlocked: n + 1, levels: Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, solvedChapter])) });

/* a v2 save built from the real defaults, so it can't drift from the game; `over` replaces top-level fields */
const makeSave = over => JSON.stringify({ ...Store.defaults(), ...over });

/* ---------- a browser page with error tracking ---------- */
async function openPage(browser, target, { save, name }) {
  const context = await browser.newContext({ viewport: { width: 430, height: 900 }, reducedMotion: 'reduce' });
  if (save) {
    await context.addInitScript(([key, value]) => {
      try { if (!sessionStorage.getItem('e2e-seeded')) { sessionStorage.setItem('e2e-seeded', '1'); localStorage.setItem(key, value); } } catch { /* storage blocked */ }
    }, [Store.KEY, save]);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.goto(target.url);
  await page.waitForSelector('#titleBear > *', { state: 'attached' });   // the HTML shows before the modules have run
  return { context, page, errors, shot: step => page.screenshot({ path: resolve(OUT, `${name}-${step}.png`) }) };
}

const readSave = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), Store.KEY);
const onScreen = (page, name) => page.waitForSelector(`#screen-${name}.active`);

/* ---------- playing ---------- */
/* Skip does nothing until the dialogue has started, so keep pressing it until the story screen is gone */
async function skipStory(page) {
  await onScreen(page, 'story');
  for (let i = 0; i < 40; i++) {
    if (!await page.locator('#screen-story.active').count()) return;
    await page.evaluate(() => document.getElementById('btnSkip').click());
    await page.waitForTimeout(150);
  }
  throw new Error('the story did not end');
}

/* press on the first cell of a path, drag through the rest, release */
async function dragPath(page, boardSel, cells, rows, cols) {
  const box = await page.locator(boardSel).boundingBox();
  const at = ([r, c]) => ({ x: box.x + (c + 0.5) * box.width / cols, y: box.y + (r + 0.5) * box.height / rows });
  const first = at(cells[0]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) { const p = at(cell); await page.mouse.move(p.x, p.y, { steps: 6 }); }
  await page.mouse.up();
}

const waitForGrid = page => page.waitForFunction(n => document.querySelectorAll('#grid .tile').length === n, ROWS * COLS);

async function solveWords(page, lv) {
  await onScreen(page, 'puzzle');
  await waitForGrid(page);
  for (const w of lv.words) await dragPath(page, '#grid', w.p, ROWS, COLS);
}

async function solveTrail(page, lv) {
  await onScreen(page, 'zip');
  await page.waitForFunction(n => document.querySelectorAll('#zGrid .zt').length === n * n, lv.zip.size);
  await dragPath(page, '#zGrid', lv.zip.path, lv.zip.size, lv.zip.size);
}

async function accuse(page, lv) {
  await onScreen(page, 'case');
  await page.click(`#cSus button.chip[data-s="${lv.case.culprit}"]`);
  await page.click(`#cItems button.chip[data-i="${lv.case.culpritItem}"]`);
  await page.click('#btnAccuse');
}

/* the victory card: check its title, then press Continue (a label check proves the next step the chapter's `steps` list chose) */
async function victory(page, title, continueLabel) {
  await page.waitForSelector('#victory.show');
  if (title) expect(await page.textContent('#vTitle'), 'victory title').toBe(title);
  if (continueLabel) expect(await page.textContent('#vContinue'), 'continue label').toBe(continueLabel);
}
const pressContinue = page => page.click('#vContinue');

function expect(actual, label) {
  const is = (cond, msg) => { if (!cond) throw new Error(`${label}: ${msg}`); };
  return {
    toBe: want => is(Object.is(actual, want), `expected ${JSON.stringify(want)}, got ${JSON.stringify(actual)}`),
    toBeTruthy: () => is(!!actual, `expected a truthy value, got ${JSON.stringify(actual)}`),
    toBeGreaterThan: n => is(actual > n, `expected > ${n}, got ${actual}`)
  };
}

const tapNoir = page => page.locator('#noirDlg').dispatchEvent('pointerdown').catch(() => {});
/* the map is a list of chapter cards; tapping one opens its chapter view, a sheet listing that chapter's cases */
const openChapter = async (page, id) => { await page.click(`#mapList .chcard-main[data-ch="${id}"]`); await page.waitForSelector('#chView.open'); };
const closeChapter = async page => { await page.click('.chv-back'); await page.waitForSelector('#chView:not(.open)', { state: 'attached' }); };
const caseRow = (page, n) => page.locator(`#chvSheet .cnode:has([data-level="${n}"])`);
const caseButton = (page, n) => page.locator(`#chvSheet [data-level="${n}"]`);

/* tap Noir's dialogue (up to 40 times, 300 ms apart) until done() is true */
async function tapNoirUntil(page, done) {
  for (let i = 0; i < 40 && !await done(); i++) { await tapNoir(page); await page.waitForTimeout(300); }
}

/* ---------- shared steps for the chapter scenarios ---------- */
/* from the title screen into a case of a chapter */
async function startCase(page, chapterId, n) {
  await page.click('#btnPlay');
  await onScreen(page, 'map');
  await openChapter(page, chapterId);
  await caseButton(page, n).click();
}

/* a whole ordinary case: intro, Words, bridge, Scent Trail, the accusation (it stops on the victory card of the case, or on a film before it) */
async function playCase(page, lv) {
  await skipStory(page);                                            // intro
  await solveWords(page, lv);
  await victory(page, 'Clue Found!', 'Follow the trail');
  await pressContinue(page);
  await skipStory(page);                                            // bridge
  await solveTrail(page, lv);
  await victory(page, 'Trail Followed!', 'To the suspects');
  await pressContinue(page);
  await accuse(page, lv);
}

/* the victory card of an ordinary case, then its outro, then the map */
async function finishCase(page) {
  await victory(page, 'Case Solved!', 'Continue the story');
  await pressContinue(page);
  await skipStory(page);                                            // outro
  await onScreen(page, 'map');
}

async function expectSolved(page, n, { unlocked, ending, seen } = {}) {
  await onScreen(page, 'map');
  const save = await readSave(page);
  expect(save.levels[n].solved, `case ${n} solved`).toBe(true);
  if (unlocked) expect(save.unlocked, `case ${unlocked} unlocked`).toBe(unlocked);
  if (ending) expect(save.seen.endings[ending], 'the ending is marked as seen').toBe(true);
  if (seen) expect(save.seen[seen], `${seen} is marked as seen`).toBe(true);
}

/* each film: the overlay's element id and its id prefix (index.html) */
const FILMS = { pup: ['pupFilm', 'pf'], worm: ['wormFilm', 'wf'], elephant: ['elephantFilm', 'ef'], dino: ['dinoFilm', 'df'], island: ['islandFilm', 'if'] };

/* a film that opens a case: title card (reduced motion shows the finished scene, then the card), Skip, and the save keeps `seen` */
async function openingFilm({ page, shot }, film, { title, titleSel, seen, shot: shotName }) {
  const [root, p] = FILMS[film];
  await page.waitForSelector(`#${root}.show`);
  await page.waitForSelector(`#${p}Title.on`);
  expect(await page.textContent(titleSel), 'the title card').toBe(title);
  await shot(shotName);
  await page.waitForSelector(`#${p}Skip.on`);
  await page.click(`#${p}Skip`);
  await page.waitForSelector(`#${root}:not(.show)`);
  await page.waitForFunction(([key, k]) => JSON.parse(localStorage.getItem(key) || '{}').seen?.[k] === true, [Store.KEY, seen]);   // saved once the film has faded out
}

/* a film that plays after the accusation, before the victory card */
async function closingFilm({ page, shot }, film, shotName) {
  const [root, p] = FILMS[film];
  await page.waitForSelector(`#${root}.show`);
  await shot(shotName);
  await page.waitForSelector(`#${p}Skip.on`);
  await page.click(`#${p}Skip`);
  await page.waitForSelector(`#${root}:not(.show)`);
}

/* tap on through the story until `name` speaks, with their portrait up and Barnaby stepped aside */
async function speakerAppears({ page, shot }, name, portraitId, shotName) {
  await onScreen(page, 'story');
  for (let i = 0; i < 14 && await page.textContent('#dlgName') !== name; i++) {
    await page.click('#screen-story', { position: { x: 200, y: 300 } });
    await page.waitForTimeout(300);
  }
  expect(await page.textContent('#dlgName'), `${name} speaks`).toBe(name);
  if (portraitId) {
    expect(await page.evaluate(id => document.getElementById(id).classList.contains('on'), portraitId), `${name}'s portrait is up`).toBe(true);
    expect(await page.evaluate(() => document.getElementById('storyBear').classList.contains('away')), 'Barnaby steps aside').toBe(true);
  }
  await shot(shotName);
}

/* the outro (and any epilogue) is skipped until the chapter's film shows; check its card, then Skip */
async function chapterEndFilm({ page, shot }, { kicker, title, next, check, shot: shotName }) {
  await onScreen(page, 'story');
  for (let i = 0; i < 40 && !await page.locator('#chapterFilm.show').count(); i++) {
    await page.evaluate(() => document.getElementById('btnSkip').click());
    await page.waitForTimeout(200);
  }
  await page.waitForSelector('#chapterFilm.show');
  await page.waitForSelector('#cfCard.on');
  expect(await page.textContent('#cfKicker'), 'film card kicker').toBe(kicker);
  if (title) expect(await page.textContent('#cfTitle'), 'film card title').toBe(title);
  if (next) expect(await page.textContent('#cfNext'), 'the card points to the next chapter').toBe(next);
  if (check) await check();
  await shot(shotName);
  await page.waitForSelector('#cfSkip.on');
  await page.click('#cfSkip');
  await page.waitForSelector('#chapterFilm:not(.show)');
}

/* ---------- scenarios ---------- */
const lv1 = LEVELS[0], lv8 = LEVELS[7], lv11 = LEVELS[10], lv13 = LEVELS[12], lv14 = LEVELS[13], lv16 = LEVELS[15], lv17 = LEVELS[16], lv19 = LEVELS[18], lv20 = LEVELS[19], lv22 = LEVELS[21], lv23 = LEVELS[22], lv25 = LEVELS[24], lv26 = LEVELS[25];
const lvLast = LEVELS[LEVELS.length - 1];                          // the ending always follows the last level, however many there are
const chLast = CHAPTERS[CHAPTERS.length - 1];

const scenarios = {
  async A({ page, shot }) {
    await page.click('#btnPlay');                                   // a new player goes straight into chapter 1
    await skipStory(page);                                          // intro
    await solveWords(page, lv1);
    await victory(page, 'Clue Found!', 'Follow the trail');
    await shot('words-won');
    await pressContinue(page);
    await skipStory(page);                                          // bridge
    await solveTrail(page, lv1);
    await victory(page, 'Trail Followed!', 'To the suspects');
    await pressContinue(page);
    await accuse(page, lv1);
    await victory(page, 'Case Solved!', 'Continue the story');
    await shot('case-solved');
    await pressContinue(page);
    await skipStory(page);                                          // outro
    await onScreen(page, 'map');
    await page.waitForSelector('#chView.open');                     // the map reopens the chapter you were playing
    expect(await caseButton(page, 2).isEnabled(), 'case 1.2 is open').toBe(true);
    expect(await caseRow(page, 1).locator('.pip.done').count(), 'case 1.1 pips ticked').toBe(3);
    await shot('chapter-view');
    await closeChapter(page);

    const save = await readSave(page);
    expect(save.levels[1].solved, 'chapter 1 solved').toBe(true);
    expect(save.unlocked, 'chapter 2 unlocked').toBe(2);
    expect(save.levels[1].word.done && save.levels[1].zip.done, 'both puzzles recorded').toBe(true);
    expect(save.badges.rookie, 'the "Rookie Detective" badge is saved').toBeTruthy();

    await page.click('#btnMapWardrobe');                            // side screens, and back
    await onScreen(page, 'wardrobe');
    await shot('wardrobe');
    await page.click('#btnWBack');
    await onScreen(page, 'map');
    await page.click('#mapList .mapchip.badges');
    await onScreen(page, 'badges');
    await page.waitForSelector('#bGrid > *');
    expect(await page.textContent('#bCount'), 'badge counter').toBeTruthy();
    await shot('badges');
    await page.click('#btnBBack');
    await onScreen(page, 'map');
    await page.click('#btnMapBack');
    await onScreen(page, 'title');
  },

  async B({ page, shot }) {
    await page.click('#btnPlay');
    await onScreen(page, 'map');
    await openChapter(page, 'larry');
    await caseButton(page, 8).click();
    await page.waitForSelector('#larryFilm.show');                  // Evil Larry's cinematic opens the level
    await shot('larry');
    await page.waitForSelector('#lfSkip.on');                       // Skip appears after a moment
    await page.click('#lfSkip');
    await page.waitForSelector('#larryFilm:not(.show)');
    await skipStory(page);
    await solveWords(page, lv8);
    await victory(page, 'Clue Found!');
    expect((await readSave(page)).seen.larry, 'Larry marked as seen').toBe(true);
  },

  async C({ page, shot }) {
    await page.click('#btnPlay');
    await onScreen(page, 'map');
    await openChapter(page, 'village');
    await caseRow(page, 1).locator('.pip', { hasText: 'Words' }).click();
    await solveWords(page, lv1);                                    // a perfect result: no hints, no mistakes
    await victory(page, 'Clue Found!', 'Back to case files');
    await pressContinue(page);
    await page.waitForSelector('#noir.show');                       // the EVIL_STREAK-th perfect result summons Barnaby Noir
    await shot('noir');
    const accept = page.locator('#noirChoices .choice', { hasText: 'Bring it on.' });
    await tapNoirUntil(page, () => accept.count());                 // tap through his first lines
    await page.waitForTimeout(450);                                 // a choice ignores taps for a moment after it appears
    await accept.click();
    await tapNoirUntil(page, async () => !await page.locator('#noir.show').count());   // and his reply
    await onScreen(page, 'puzzle');
    await waitForGrid(page);
    expect(await page.evaluate(() => document.body.classList.contains('evil')), 'Noir skin on').toBe(true);
    expect((await readSave(page)).perfect.streak, 'the streak starts again').toBe(0);
    await shot('noir-board');
  },

  async I({ page, shot }) {
    // declining Barnaby Noir mid-level: the level carries on where it was, in the light
    await page.click('#btnPlay');
    await skipStory(page);
    await solveWords(page, lv1);
    await victory(page, 'Clue Found!');
    await pressContinue(page);
    await page.waitForSelector('#noir.show');
    const decline = page.locator('#noirChoices .choice', { hasText: 'Not today.' });
    await tapNoirUntil(page, () => decline.count());
    await page.waitForTimeout(450);
    await decline.click();
    await tapNoirUntil(page, async () => !await page.locator('#noir.show').count());
    await page.waitForTimeout(800);
    const state = await page.evaluate(() => ({ evil: document.body.classList.contains('evil'), screen: document.querySelector('.screen.active')?.id, victory: !!document.querySelector('#victory.show') }));
    expect(state.evil, 'the dark theme stays off').toBe(false);
    expect(state.screen, 'the level carries on to its next step').toBe('screen-story');
    const save = await readSave(page);
    expect(save.levels[1].word.done, 'the cleared Words puzzle is kept').toBe(true);
    expect(save.perfect.streak, 'the streak starts again').toBe(0);
    await shot('noir-declined');
  },

  async D({ page, shot }) {
    await page.click('#btnPlay');
    await onScreen(page, 'map');
    await openChapter(page, 'village');
    const pips = caseRow(page, 1).locator('.pip');
    expect(await pips.count(), 'pips on level 1').toBeGreaterThan(2);
    expect(await caseRow(page, 1).locator('.pip.done').count(), 'ticked pips').toBe(3);
    expect(await pips.nth(0).isEnabled(), 'Words pip enabled once solved').toBe(true);
    await shot('pips');
    await pips.nth(1).click();                                      // Trail
    await solveTrail(page, lv1);
    await victory(page, 'Trail Followed!', 'Back to case files');
    await pressContinue(page);
    await onScreen(page, 'map');
    await page.waitForSelector('#chView.open');                     // back in the chapter it came from
    await pips.nth(0).click();                                      // Words
    await solveWords(page, lv1);
    await victory(page, 'Clue Found!', 'Back to case files');
    await pressContinue(page);
    await onScreen(page, 'map');
  },

  async E({ page, shot }) {
    // chapter 1 with its own steps: no intro, no bridge, no Scent Trail, no outro
    await page.evaluate(() => { window.__LEVELS[0].steps = ['word', 'case']; });
    await page.click('#btnPlay');
    await solveWords(page, lv1);                                    // straight into the puzzle
    await victory(page, 'Clue Found!', 'To the suspects');          // the next step is the notebook, not the bridge
    await pressContinue(page);
    await onScreen(page, 'case');
    expect(await page.locator('#cClues .clue-item.locked').count(), 'the trail clue stays locked').toBe(1);
    await shot('custom-steps');
    await accuse(page, lv1);
    await victory(page, 'Case Solved!');
    await pressContinue(page);
    await onScreen(page, 'map');                                    // and no outro story
  },

  async F({ page, shot }) {
    expect((await readSave(page)).levels[1].solved, 'a seeded save to erase').toBe(true);
    await page.click('#btnSettings');
    await onScreen(page, 'settings');
    const reset = page.locator('#btnReset');
    await reset.click();
    expect(await reset.textContent(), 'first tap arms the button').toBe('Tap again to erase all progress');
    expect((await readSave(page)).levels[1].solved, 'one tap erases nothing').toBe(true);
    await reset.click();
    await page.waitForSelector('.toast');
    const save = await readSave(page);
    expect(!save || (save.unlocked === 1 && Object.keys(save.levels).length === 0), 'the save is back to defaults').toBe(true);
    expect(await reset.textContent(), 'button resets its label').toBe('Reset progress');
    await shot('reset');
    await page.click('#btnSBack');
    await onScreen(page, 'title');
    await page.click('#btnPlay');                                   // no progress again: a new game starts at the story
    await onScreen(page, 'story');
  },

  async G({ page, shot }) {
    // the last level of chapter 1, trimmed to a word puzzle and the notebook (dev hook), so the chapter's ending film follows
    const lv3 = LEVELS[2];
    await page.evaluate(() => { window.__LEVELS[2].steps = ['word', 'case']; });
    await page.click('#btnPlay');
    await onScreen(page, 'map');
    await openChapter(page, 'village');
    await caseButton(page, 3).click();
    await solveWords(page, lv3);
    await victory(page, 'Clue Found!', 'To the suspects');
    await pressContinue(page);
    await accuse(page, lv3);
    await victory(page, 'Case Solved!');
    expect(await page.textContent('#vUnlock'), 'the card announces the chapter').toBe('Chapter completeVillage Days');
    await pressContinue(page);
    await page.waitForSelector('#chapterFilm.show');                // the chapter's ending film
    await shot('chapter-film');
    await page.waitForSelector('#cfSkip.on');
    await page.waitForSelector('#cfCard.on');                       // (reduced motion: the finished scene, then the card)
    expect(await page.textContent('#cfTitle'), 'film card title').toBe('Village Days');
    await page.click('#cfSkip');
    await page.waitForSelector('#chapterFilm:not(.show)');
    await onScreen(page, 'map');
    expect((await readSave(page)).seen.endings.village, 'the ending is marked as seen').toBe(true);
    await page.waitForSelector('#mapList .chcard-main[data-ch="dreams"]:not([aria-disabled])');   // chapter 2 unlocks
    expect(await page.locator('#chView.open').count(), 'the chapter list, not the chapter view, after an ending').toBe(0);
    await shot('chapter-unlocked');
    await page.click('#mapList .chcard-film');                      // and the film can be watched again from its card
    await page.waitForSelector('#chapterFilm.show');
    await page.waitForSelector('#cfSkip.on');
    await page.click('#cfSkip');
    await page.waitForSelector('#chapterFilm:not(.show)');
  },

  async H({ page, shot }) {
    await page.click('#btnPlay');
    await onScreen(page, 'map');
    await openChapter(page, 'village');                             // Escape and the back button both close the sheet
    expect(await page.evaluate(() => document.getElementById('mapList').inert), 'the map behind is inert').toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForSelector('#chView:not(.open)', { state: 'attached' });
    expect(await page.evaluate(() => document.getElementById('mapList').inert), 'the map is live again').toBe(false);
    await openChapter(page, 'village');
    await closeChapter(page);
    await page.click('#mapList .chcard-main[data-ch="larry"]', { force: true });     // chapter 4 is locked: a tap explains, it does not open
    await page.waitForSelector('.toast');
    expect(await page.locator('#chView.open').count(), 'a locked chapter stays shut').toBe(0);
    await shot('locked-chapter');
  },

  async J(s) {
    const { page } = s;
    await startCase(page, 'space', 11);
    await openingFilm(s, 'pup', { title: 'PICKLE', titleSel: '#pfTitle b', seen: 'pup', shot: 'pickle-landing' });
    await speakerAppears(s, 'Pickle', 'storyPup', 'pickle-speaks');
    await playCase(page, lv11);
    await finishCase(page);
    await expectSolved(page, 11, { unlocked: 12 });
    await page.click('.chv-back').catch(() => {});                  // the pip to watch Pickle's arrival again appears once it has been seen
    await openChapter(page, 'space');
    expect(await page.locator('#chvSheet [data-intro="11"]').count(), 'a replay button for the landing').toBe(1);
  },

  async K(s) {
    const { page } = s;
    await startCase(page, 'space', 13);
    await playCase(page, lv13);
    await closingFilm(s, 'pup', 'pickle-liftoff');                  // Pickle lifts off before the victory card
    await victory(page, 'Case Solved!', 'Continue the story');
    expect(await page.textContent('#vUnlock'), 'a chapter end, not the end of the game').toBe('Chapter completeLost in Space');
    await pressContinue(page);
    await chapterEndFilm(s, { kicker: 'Chapter 5 complete', title: 'Lost in Space', next: 'Next: Chapter 6 · Midnight Oasis', shot: 'space-film' });
    await expectSolved(page, 13, { ending: 'space', unlocked: 14 });
  },

  async L(s) {
    const { page } = s;
    await startCase(page, chLast.id, lvLast.n);
    await playCase(page, lvLast);
    await closingFilm(s, 'island', 'island-rescue');                // the rescue plays before the victory card
    await victory(page, 'Case Solved!', 'Hear the ending');
    expect(await page.textContent('#vUnlock'), 'the last case closes the whole story').toBe('Every mystery solvedYou are a true detective!');
    await pressContinue(page);
    await chapterEndFilm(s, {
      kicker: 'The End', title: chLast.title, shot: 'castaways-film',
      check: async () => {
        const credits = await page.textContent('#cfCredits');
        for (const who of ['Pippy', 'Rexy', 'Rocky', 'castaways']) expect(credits.includes(who), `the credits thank ${who}`).toBe(true);
      }
    });
    await expectSolved(page, lvLast.n, { ending: chLast.id });
  },

  async M(s) {
    const { page } = s;
    await startCase(page, 'oasis', 14);
    await openingFilm(s, 'worm', { title: 'BISCUIT', titleSel: '#wfTitle b', seen: 'worm', shot: 'biscuit-intro' });
    await speakerAppears(s, 'Biscuit', 'storyWorm', 'biscuit-speaks');
    await playCase(page, lv14);
    await finishCase(page);
    await expectSolved(page, 14, { unlocked: 15 });
  },

  async N(s) {
    const { page } = s;
    await startCase(page, 'circus', 17);
    await openingFilm(s, 'elephant', { title: 'PIPPY', titleSel: '#efTitle b', seen: 'elephant', shot: 'pippy-intro' });
    await speakerAppears(s, 'Pippy', 'storyElephant', 'pippy-speaks');
    await playCase(page, lv17);
    await finishCase(page);
    await expectSolved(page, 17, { unlocked: 18 });
  },

  async Q(s) {
    const { page } = s;
    await startCase(page, 'dino', 20);
    await openingFilm(s, 'dino', { title: 'DINO STRIKES BACK', titleSel: '#dfTitle b', seen: 'dino', shot: 'dino-intro' });
    await speakerAppears(s, 'Rexy', 'storyDino', 'rexy-speaks');
    await playCase(page, lv20);
    await finishCase(page);
    await expectSolved(page, 20, { unlocked: 21 });
  },

  async O(s) {
    const { page } = s;
    await startCase(page, 'oasis', 16);
    await playCase(page, lv16);
    await closingFilm(s, 'worm', 'biscuit-homecoming');             // Biscuit's homecoming plays before the victory card
    await victory(page, 'Case Solved!', 'Continue the story');
    expect(await page.textContent('#vUnlock'), 'a chapter end, not the end of the game').toBe('Chapter completeMidnight Oasis');
    await pressContinue(page);
    await chapterEndFilm(s, { kicker: 'Chapter 6 complete', next: 'Next: Chapter 7 · The Big Top', shot: 'oasis-film' });
    await expectSolved(page, 16, { ending: 'oasis', unlocked: 17 });
  },

  async P(s) {
    const { page } = s;
    await startCase(page, 'circus', 19);
    await playCase(page, lv19);
    await closingFilm(s, 'elephant', 'pippy-show');                 // Pippy's show plays before the victory card
    await victory(page, 'Case Solved!', 'Continue the story');
    expect(await page.textContent('#vUnlock'), 'a chapter end, not the end of the game').toBe('Chapter completeThe Big Top');
    await pressContinue(page);
    await chapterEndFilm(s, { kicker: 'Chapter 7 complete', title: 'The Big Top', next: 'Next: Chapter 8 · Dino Strikes Back', shot: 'circus-film' });
    await expectSolved(page, 19, { ending: 'circus', unlocked: 20 });
  },

  async R(s) {
    const { page } = s;
    await startCase(page, 'dino', 22);
    await playCase(page, lv22);
    await closingFilm(s, 'dino', 'dino-finale');                    // the stomp-launch plays before the victory card
    await victory(page, 'Case Solved!', 'Continue the story');
    expect(await page.textContent('#vUnlock'), 'a chapter end, not the end of the game').toBe('Chapter completeDino Strikes Back');
    await pressContinue(page);
    await chapterEndFilm(s, { kicker: 'Chapter 8 complete', title: 'Dino Strikes Back', next: 'Next: Chapter 9 · Rocky Rebuilds', shot: 'dino-film' });
    await expectSolved(page, 22, { ending: 'dino', unlocked: 23 });
  },

  async S(s) {
    const { page } = s;
    await startCase(page, 'rocky', 23);
    await onScreen(page, 'story');
    await speakerAppears(s, 'Rocky', 'storyRocky', 'rocky-speaks');
    await playCase(page, lv23);
    await finishCase(page);
    await expectSolved(page, 23, { unlocked: 24 });
  },

  async T(s) {
    const { page } = s;
    await startCase(page, 'rocky', 25);
    await playCase(page, lv25);
    await victory(page, 'Case Solved!', 'Continue the story');
    expect(await page.textContent('#vUnlock'), 'a chapter end, not the end of the game').toBe('Chapter completeRocky Rebuilds');
    await pressContinue(page);
    await chapterEndFilm(s, { kicker: 'Chapter 9 complete', title: 'Rocky Rebuilds', next: 'Next: Chapter 10 · Castaways', shot: 'rocky-film' });
    await expectSolved(page, 25, { ending: 'rocky', unlocked: 26 });
  },

  async U(s) {
    const { page } = s;
    await startCase(page, 'castaways', 26);
    await openingFilm(s, 'island', { title: 'CASTAWAYS', titleSel: '#ifTitleMain', seen: 'crash', shot: 'island-crash' });
    await playCase(page, lv26);
    await finishCase(page);
    await expectSolved(page, 26, { unlocked: 27, seen: 'crash' });
  },

  async V(s) {
    const { page } = s;
    await startCase(page, 'castaways', 27);
    await openingFilm(s, 'island', { title: 'THE LOOK', titleSel: '#ifTitleMain', seen: 'tiger', shot: 'island-tiger' });
    await speakerAppears(s, 'Evil Larry', null, 'island-larry-speaks');
    expect((await readSave(page)).seen.tiger, 'the tiger scene is marked as seen').toBe(true);
  },

  async W(s) {
    const { page } = s;
    await startCase(page, 'castaways', 28);
    await openingFilm(s, 'island', { title: 'DIGS IN', titleSel: '#ifTitleMain', seen: 'dig', shot: 'island-dig' });
    await onScreen(page, 'story');
    expect((await readSave(page)).seen.dig, 'the dig is marked as seen').toBe(true);
  }
};

/* which save each scenario starts from (none = a brand-new player) */
const seeds = {
  A: null,
  B: makeSave({ ...ch1Done, unlocked: 8 }),
  C: makeSave({ ...ch1Done, perfect: { streak: EVIL_STREAK - 1 } }),
  D: makeSave(ch1Done),
  I: makeSave({ perfect: { streak: EVIL_STREAK - 1 } }),
  E: null,
  F: makeSave(ch1Done),
  G: makeSave({ unlocked: 3, levels: { 1: solvedChapter, 2: solvedChapter } }),
  H: makeSave(ch1Done),
  J: makeSave(solvedUpTo(10)),
  K: makeSave(solvedUpTo(12)),
  L: makeSave(solvedUpTo(lvLast.n - 1)),
  M: makeSave(solvedUpTo(13)),
  N: makeSave(solvedUpTo(16)),
  O: makeSave(solvedUpTo(15)),
  P: makeSave(solvedUpTo(18)),
  Q: makeSave(solvedUpTo(19)),
  R: makeSave(solvedUpTo(21)),
  S: makeSave(solvedUpTo(22)),
  T: makeSave(solvedUpTo(24)),
  U: makeSave(solvedUpTo(25)),
  V: makeSave(solvedUpTo(26)),
  W: makeSave(solvedUpTo(27))
};

/* ---------- run ---------- */
async function main() {
  mkdirSync(OUT, { recursive: true });
  const target = await resolveTarget();
  let browser;
  try {
    browser = await chromium.launch({ channel: CHANNEL });
  } catch (e) {
    console.error(`Could not start the "${CHANNEL}" browser: ${e.message.split('\n')[0]}\n` +
      'Install Microsoft Edge or Google Chrome, or set E2E_BROWSER_CHANNEL (msedge, chrome, chrome-beta, ...). No browser is downloaded for you.');
    return 2;
  }

  console.log(`Target: ${target.url}  (browser: ${CHANNEL})`);
  /* scenarios use isolated browser contexts, so a few run side by side; results print in scenario order */
  const WORKERS = Math.max(1, Number(process.env.E2E_WORKERS) || 4);
  const ids = Object.keys(scenarios).filter(id => !ONLY.length || ONLY.includes(id));
  const lines = {}, results = [];
  const runOne = async id => {
    if ((id === 'E' || id === 'G') && !target.dev) { lines[id] = `- ${id} skipped: needs the dev server (use --dev)`; return; }
    const started = Date.now();
    const session = await openPage(browser, target, { save: seeds[id], name: id });
    try {
      await scenarios[id](session);
      if (session.errors.length) throw new Error('the page logged errors:\n    ' + session.errors.join('\n    '));
      results.push([id, true]);
      lines[id] = `✓ ${id} (${((Date.now() - started) / 1000).toFixed(1)}s)`;
    } catch (e) {
      results.push([id, false]);
      await session.shot('FAILED').catch(() => {});
      lines[id] = `✗ ${id}: ${e.message}${session.errors.length && !/logged errors/.test(e.message) ? '\n    page errors: ' + session.errors.join('; ') : ''}`;
    }
    await session.context.close();
  };
  const queue = [...ids];
  await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length) }, async () => {
    for (let id = queue.shift(); id; id = queue.shift()) await runOne(id);
  }));
  for (const id of ids) console.log(lines[id]);
  await browser.close();
  const failed = results.filter(([, ok]) => !ok).length;
  console.log(failed ? `\n${failed} of ${results.length} scenarios failed (screenshots in tests/e2e/out/)` : `\nAll ${results.length} scenarios passed`);
  return failed ? 1 : 0;
}

let code = 1;
try { code = await main(); } catch (e) { console.error(e.message); code = 2; } finally { stopDevServer(); }
process.exit(code);
