/* End-to-end playthrough in a real browser (Playwright). Not part of `npm test`: it needs a browser and a built (or running) game.

     npm run build && npm run test:e2e         play the built dist/index.html (file://)
     npm run test:e2e -- --dev                 start `vite` and play http://localhost:5173 (also runs scenario E)
     E2E_URL=http://host/ npm run test:e2e     play any URL
     E2E_BROWSER_CHANNEL=chrome ...            installed browser to drive (default: msedge). No browser is downloaded.
     npm run test:e2e -- A C                   run only the named scenarios

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
     K  chapter 5, case 3: the whole case, Pickle's lift-off, the chapter's closing film with the credits

   Answers (word paths, trail, culprit, item) are read from src/data, so the test follows the content. Anything logged with
   console.error, or any uncaught page error, fails the scenario. Screenshots go to tests/e2e/out/ (git-ignored). */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { COLS, ROWS } from '../../src/core/grid.ts';
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

/* ---------- scenarios ---------- */
const lv1 = LEVELS[0], lv8 = LEVELS[7], lv11 = LEVELS[10], lv13 = LEVELS[12];

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

  async J({ page, shot }) {
    await page.click('#btnPlay');
    await onScreen(page, 'map');
    await openChapter(page, 'space');
    await caseButton(page, 11).click();
    await page.waitForSelector('#pupFilm.show');                    // Pickle's crash landing opens the case
    await page.waitForSelector('#pfTitle.on');                      // (reduced motion: the finished scene, then the title card)
    expect(await page.textContent('#pfTitle b'), 'title card names Pickle').toBe('PICKLE');
    await shot('pickle-landing');
    await page.waitForSelector('#pfSkip.on');
    await page.click('#pfSkip');
    await page.waitForSelector('#pupFilm:not(.show)');
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}').seen?.pup === true, Store.KEY);   // saved once the film has faded out
    await onScreen(page, 'story');
    for (let i = 0; i < 14 && await page.textContent('#dlgName') !== 'Pickle'; i++) {      // tap on to Pickle's first line
      await page.click('#screen-story', { position: { x: 200, y: 300 } });
      await page.waitForTimeout(300);
    }
    expect(await page.textContent('#dlgName'), 'Pickle speaks').toBe('Pickle');
    expect(await page.evaluate(() => document.getElementById('storyPup').classList.contains('on')), "Pickle's portrait is up").toBe(true);
    expect(await page.evaluate(() => document.getElementById('storyBear').classList.contains('away')), "Barnaby steps aside").toBe(true);
    await shot('pickle-speaks');
    await skipStory(page);                                          // intro
    await solveWords(page, lv11);
    await victory(page, 'Clue Found!', 'Follow the trail');
    await pressContinue(page);
    await skipStory(page);                                          // bridge
    await solveTrail(page, lv11);
    await victory(page, 'Trail Followed!', 'To the suspects');
    await pressContinue(page);
    await accuse(page, lv11);
    await victory(page, 'Case Solved!', 'Continue the story');
    await pressContinue(page);
    await skipStory(page);                                          // outro
    await onScreen(page, 'map');
    const save = await readSave(page);
    expect(save.levels[11].solved, 'case 5.1 solved').toBe(true);
    expect(save.unlocked, 'case 5.2 unlocked').toBe(12);
    await page.click('.chv-back').catch(() => {});                  // the pip to watch Pickle's arrival again appears once it has been seen
    await openChapter(page, 'space');
    expect(await page.locator('#chvSheet [data-intro="11"]').count(), 'a replay button for the landing').toBe(1);
  },

  async K({ page, shot }) {
    await page.click('#btnPlay');
    await onScreen(page, 'map');
    await openChapter(page, 'space');
    await caseButton(page, 13).click();
    await skipStory(page);                                          // intro
    await solveWords(page, lv13);
    await victory(page, 'Clue Found!');
    await pressContinue(page);
    await skipStory(page);                                          // bridge
    await solveTrail(page, lv13);
    await victory(page, 'Trail Followed!');
    await pressContinue(page);
    await accuse(page, lv13);
    await page.waitForSelector('#pupFilm.show');                    // Pickle lifts off before the victory card
    await shot('pickle-liftoff');
    await page.waitForSelector('#pupFilm:not(.show)');
    await victory(page, 'Case Solved!', 'Hear the ending');
    expect(await page.textContent('#vUnlock'), 'the last case closes the whole story').toBe('Every mystery solvedYou are a true detective!');
    await pressContinue(page);
    await onScreen(page, 'story');                                  // outro (Pickle on the radio): the film starts over the story screen, so skip until it shows
    for (let i = 0; i < 40 && !await page.locator('#chapterFilm.show').count(); i++) {
      await page.evaluate(() => document.getElementById('btnSkip').click());
      await page.waitForTimeout(200);
    }
    await page.waitForSelector('#chapterFilm.show');                // the last chapter's film
    await page.waitForSelector('#cfCard.on');
    expect(await page.textContent('#cfKicker'), 'the last chapter says The End').toBe('The End');
    expect(await page.textContent('#cfTitle'), 'film card title').toBe('Lost in Space');
    expect((await page.textContent('#cfCredits')).includes('Pickle'), 'the credits thank Pickle').toBe(true);
    await shot('space-film');
    await page.waitForSelector('#cfSkip.on');
    await page.click('#cfSkip');
    await page.waitForSelector('#chapterFilm:not(.show)');
    await onScreen(page, 'map');
    const save = await readSave(page);
    expect(save.levels[13].solved, 'case 5.3 solved').toBe(true);
    expect(save.seen.endings.space, 'the ending is marked as seen').toBe(true);
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
  K: makeSave(solvedUpTo(12))
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
  const results = [];
  for (const id of Object.keys(scenarios)) {
    if (ONLY.length && !ONLY.includes(id)) continue;
    if ((id === 'E' || id === 'G') && !target.dev) { console.log(`- ${id} skipped: needs the dev server (use --dev)`); continue; }
    const started = Date.now();
    const session = await openPage(browser, target, { save: seeds[id], name: id });
    try {
      await scenarios[id](session);
      if (session.errors.length) throw new Error('the page logged errors:\n    ' + session.errors.join('\n    '));
      results.push([id, true]);
      console.log(`✓ ${id} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    } catch (e) {
      results.push([id, false]);
      await session.shot('FAILED').catch(() => {});
      console.log(`✗ ${id}: ${e.message}${session.errors.length && !/logged errors/.test(e.message) ? '\n    page errors: ' + session.errors.join('; ') : ''}`);
    }
    await session.context.close();
  }
  await browser.close();
  const failed = results.filter(([, ok]) => !ok).length;
  console.log(failed ? `\n${failed} of ${results.length} scenarios failed (screenshots in tests/e2e/out/)` : `\nAll ${results.length} scenarios passed`);
  return failed ? 1 : 0;
}

let code = 1;
try { code = await main(); } catch (e) { console.error(e.message); code = 2; } finally { stopDevServer(); }
process.exit(code);
