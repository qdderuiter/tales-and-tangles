/* End-to-end playthrough in a real browser (Playwright). Not part of `npm test`: it needs a browser and a built (or running) game.

     npm run build && npm run test:e2e         play the built dist/index.html (file://)
     npm run test:e2e -- --dev                 start `vite` and play http://localhost:5173 (also runs scenario E)
     E2E_URL=http://host/ npm run test:e2e     play any URL
     E2E_BROWSER_CHANNEL=chrome ...            installed browser to drive (default: msedge). No browser is downloaded.
     npm run test:e2e -- A C                   run only the named scenarios

   Scenarios
     A  chapter 1 start to finish, then the side screens (wardrobe, badges) and the first badge
     B  chapter 8: Evil Larry's opening cinematic, then the chapter's puzzle
     C  Barnaby Noir interrupts after three perfect results in a row
     D  replay a single puzzle from the map pips
     E  a chapter with a custom `steps` list (dev server only: it needs the dev hook in src/main.js)
     F  Reset progress (two taps) erases the save

   Answers (word paths, trail, culprit, item) are read from src/data, so the test follows the content. Anything logged with
   console.error, or any uncaught page error, fails the scenario. Screenshots go to tests/e2e/out/ (git-ignored). */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { LEVELS } from '../../src/data/levels.js';
import { Store } from '../../src/state/store.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'tests/e2e/out');
const args = process.argv.slice(2);
const DEV = args.includes('--dev');
const ONLY = args.filter(a => /^[A-Z]$/.test(a));
const CHANNEL = process.env.E2E_BROWSER_CHANNEL || 'msedge';
const PORT = 5173;
const COLS = 6, ROWS = 5;

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

async function solveWords(page, lv) {
  await onScreen(page, 'puzzle');
  await page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 30);
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
const chapterButton = (page, n) => page.locator('#mapList .chwrap').nth(n - 1).locator('.chapter');

/* ---------- scenarios ---------- */
const lv1 = LEVELS[0], lv8 = LEVELS[7];

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

    const save = await readSave(page);
    expect(save.chapters[1].solved, 'chapter 1 solved').toBe(true);
    expect(save.unlocked, 'chapter 2 unlocked').toBe(2);
    expect(save.chapters[1].word.done && save.chapters[1].zip.done, 'both puzzles recorded').toBe(true);
    expect(save.badges.rookie, 'the "Rookie Detective" badge is saved').toBeTruthy();

    await page.click('#btnMapWardrobe');                            // side screens, and back
    await onScreen(page, 'wardrobe');
    await shot('wardrobe');
    await page.click('#btnWBack');
    await onScreen(page, 'map');
    await page.click('#mapList .chapter.badges');
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
    await chapterButton(page, 8).click();
    await page.waitForSelector('#larryFilm.show');                  // Evil Larry's cinematic opens the chapter
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
    await page.locator('#mapList .chwrap').nth(0).locator('.pip', { hasText: 'Words' }).click();
    await solveWords(page, lv1);                                    // a perfect result: no hints, no mistakes
    await victory(page, 'Clue Found!', 'Back to case files');
    await pressContinue(page);
    await page.waitForSelector('#noir.show');                       // the third perfect result in a row summons Barnaby Noir
    await shot('noir');
    const accept = page.locator('#noirChoices .choice', { hasText: 'Bring it on.' });
    for (let i = 0; i < 40 && !await accept.count(); i++) { await tapNoir(page); await page.waitForTimeout(300); }   // tap through his first lines
    await page.waitForTimeout(450);                                 // a choice ignores taps for a moment after it appears
    await accept.click();
    for (let i = 0; i < 40 && await page.locator('#noir.show').count(); i++) { await tapNoir(page); await page.waitForTimeout(300); }   // and his reply
    await onScreen(page, 'puzzle');
    await page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 30);
    expect(await page.evaluate(() => document.body.classList.contains('evil')), 'Noir skin on').toBe(true);
    expect((await readSave(page)).perfect.streak, 'the streak starts again').toBe(0);
    await shot('noir-board');
  },

  async D({ page, shot }) {
    await page.click('#btnPlay');
    await onScreen(page, 'map');
    const pips = page.locator('#mapList .chwrap').nth(0).locator('.pip');
    expect(await pips.count(), 'pips on chapter 1').toBeGreaterThan(2);
    expect(await page.locator('#mapList .chwrap').nth(0).locator('.pip.done').count(), 'ticked pips').toBe(3);
    expect(await pips.nth(0).isEnabled(), 'Words pip enabled once solved').toBe(true);
    await shot('pips');
    await pips.nth(1).click();                                      // Trail
    await solveTrail(page, lv1);
    await victory(page, 'Trail Followed!', 'Back to case files');
    await pressContinue(page);
    await onScreen(page, 'map');
    await pips.nth(0).click();                                      // Words
    await solveWords(page, lv1);
    await victory(page, 'Clue Found!', 'Back to case files');
    await pressContinue(page);
    await onScreen(page, 'map');
  },

  async E({ page, shot }) {
    // chapter 1 with its own steps: no intro, no bridge, no Scent Trail, no outro
    await page.waitForFunction(() => !!window.__LEVELS);
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
    expect((await readSave(page)).chapters[1].solved, 'a seeded save to erase').toBe(true);
    const reset = page.locator('#btnReset');
    await reset.click();
    expect(await reset.textContent(), 'first tap arms the button').toBe('Tap again to erase all progress');
    expect((await readSave(page)).chapters[1].solved, 'one tap erases nothing').toBe(true);
    await reset.click();
    await page.waitForSelector('.toast');
    const save = await readSave(page);
    expect(!save || (save.unlocked === 1 && Object.keys(save.chapters).length === 0), 'the save is back to defaults').toBe(true);
    expect(await reset.textContent(), 'button resets its label').toBe('Reset progress');
    await shot('reset');
    await page.click('#btnPlay');                                   // no progress again: a new game starts at the story
    await onScreen(page, 'story');
  }
};

/* which save each scenario starts from (none = a brand-new player) */
const seeds = {
  A: null,
  B: makeSave({ unlocked: 8, chapters: { 1: solvedChapter } }),
  C: makeSave({ unlocked: 2, chapters: { 1: solvedChapter }, perfect: { streak: 2 } }),
  D: makeSave({ unlocked: 2, chapters: { 1: solvedChapter } }),
  E: null,
  F: makeSave({ unlocked: 2, chapters: { 1: solvedChapter } })
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
    if (id === 'E' && !target.dev) { console.log('- E skipped: needs the dev server (use --dev)'); continue; }
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
