/* Watch the latest chapter being played in a visible browser: cutscenes and films play at their own pace (nothing is skipped),
   puzzles are solved instantly. Not part of `npm run check`.

     npm run build && node tests/e2e/watch-chapter.mjs [firstCase]      (default: the first case of the last chapter, 34)
     E2E_BROWSER_CHANNEL=chrome ...                                      (default: msedge)
     TAP_MS=2500 ...                                                     how long each dialogue line is left on screen
     FAST=1 ...                                                          fast dialogue (250 ms a line); films, and their tap moments, are never sped up or skipped */
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { COLS, ROWS } from '../../src/core/grid.ts';
import { CHAPTERS } from '../../src/data/chapters.ts';
import { LEVELS } from '../../src/data/levels.ts';
import { Store } from '../../src/state/store.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const URL_ = pathToFileURL(resolve(ROOT, 'dist/index.html')).href;
const CHANNEL = process.env.E2E_BROWSER_CHANNEL || 'msedge';
const TAP_MS = Number(process.env.TAP_MS) || 2500;
const FAST = process.env.FAST === '1';                              // FAST=1: dialogue and the puzzles run ~10x faster; the films still play at their own pace
const TAP = FAST ? 250 : TAP_MS;
const FIRST = Number(process.argv[2]) || 34;
const LAST = LEVELS[LEVELS.length - 1].n;
const chLast = CHAPTERS[CHAPTERS.length - 1];

const solvedChapter = { word: { done: true, stars: 3, best: 1400 }, zip: { done: true, stars: 3, best: 1400 }, solved: true, penalty: 0 };
const solvedUpTo = n => ({ unlocked: n + 1, levels: Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, solvedChapter])) });
const save = JSON.stringify({ ...Store.defaults(), ...solvedUpTo(FIRST - 1) });

let page;
const FILM_ROOTS = '#pupFilm.show, #wormFilm.show, #elephantFilm.show, #dinoFilm.show, #islandFilm.show, #catsFilm.show, #spaghettiFilm.show, #chapterFilm.show';
/* a film's tap moment: let the ring pulse for a moment so it can be seen, then tap it like a player would */
let tapping = false;
setInterval(async () => {
  if (tapping) return;
  const hit = page?.locator('.film-tap .film-hit').first();
  if (!hit || !await hit.count().catch(() => 0)) return;
  tapping = true;
  console.log('  tap moment');
  await page.waitForTimeout(1800);
  await hit.click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  tapping = false;
}, 400);
const onScreen = (page, name) => page.waitForSelector(`#screen-${name}.active`, { timeout: 60000 });

async function dragPath(page, sel, cells, rows, cols) {
  const box = await page.locator(sel).boundingBox();
  const at = ([r, c]) => ({ x: box.x + (c + 0.5) * box.width / cols, y: box.y + (r + 0.5) * box.height / rows });
  const first = at(cells[0]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) { const p = at(cell); await page.mouse.move(p.x, p.y, { steps: 2 }); }
  await page.mouse.up();
}

/* a cutscene: read each line, tap on, pick the first choice if there is one; films are left to play */
async function watchStory(page) {
  await onScreen(page, 'story');
  while (await page.locator('#screen-story.active').count()) {
    if (await page.locator(FILM_ROOTS).count()) { await page.waitForTimeout(500); continue; }
    const choice = page.locator('#dlgChoices .choice, .btn.choice').first();
    if (await choice.count() && await choice.isVisible()) { await page.waitForTimeout(FAST ? 200 : 1200); await choice.click().catch(() => {}); }
    else await page.click('#screen-story', { position: { x: 200, y: 300 } }).catch(() => {});
    await page.waitForTimeout(TAP);
  }
}

/* the Sketch Artist: tap every filled square of the picture */
async function sketchStep(page, lv) {
  const sk = lv.sketch, n = sk.size;
  await page.waitForSelector('#screen-sketch.active, #screen-story.active');
  if (await page.locator('#screen-story.active').count()) await watchStory(page);        // Barnaby explains the sketch
  await onScreen(page, 'sketch');
  await page.waitForFunction(k => document.querySelectorAll('#kGrid .kt').length === k, n * n);
  await page.waitForTimeout(FAST ? 300 : 1500);
  const box = await page.locator('#kGrid').boundingBox();
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (sk.solution[r][c]) await page.mouse.click(box.x + (c + 0.5) * box.width / n, box.y + (r + 0.5) * box.height / n);
  await page.waitForSelector('#kFrame.won'); await page.waitForTimeout(FAST ? 600 : 2500);
  await page.waitForSelector('#victory.show'); await page.waitForTimeout(1000); await page.click('#vContinue');
  await watchStory(page).catch(() => {});
}

async function solveCase(page, lv) {
  await onScreen(page, 'puzzle');
  await page.waitForFunction(n => document.querySelectorAll('#grid .tile').length === n, ROWS * COLS);
  for (const w of lv.words) await dragPath(page, '#grid', w.p, ROWS, COLS);
  await page.waitForSelector('#victory.show'); await page.waitForTimeout(1500); await page.click('#vContinue');
  await watchStory(page);                                            // bridge
  await onScreen(page, 'zip');
  await page.waitForFunction(n => document.querySelectorAll('#zGrid .zt').length === n * n, lv.zip.size);
  await dragPath(page, '#zGrid', lv.zip.path, lv.zip.size, lv.zip.size);
  await page.waitForSelector('#victory.show'); await page.waitForTimeout(1500); await page.click('#vContinue');
  await sketchStep(page, lv);
  await onScreen(page, 'case');
  await page.click(`#cSus button.chip[data-s="${lv.case.culprit}"]`);
  await page.click(`#cItems button.chip[data-i="${lv.case.culpritItem}"]`);
  await page.click('#btnAccuse');
  await page.waitForSelector('#victory.show', { timeout: 60000 }); await page.waitForTimeout(3000); await page.click('#vContinue');
}

const browser = await chromium.launch({ channel: CHANNEL, headless: process.env.HEADLESS === '1' });
const context = await browser.newContext({ viewport: { width: 430, height: 900 }, reducedMotion: 'no-preference' });
await context.addInitScript(([key, value]) => {
  try { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem(key, value); } } catch { /* storage blocked */ }
}, [Store.KEY, save]);
page = await context.newPage();
page.setDefaultTimeout(60000);
page.on('close', () => console.error('PAGE CLOSED'));
page.on('crash', () => console.error('PAGE CRASHED'));
page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
await page.goto(URL_);
await page.waitForSelector('#titleBear > *', { state: 'attached' });
await page.waitForTimeout(2500);                                      // the title screen

for (let n = FIRST; n <= LAST; n++) {
  if (n > FIRST) { await page.reload(); await page.waitForSelector('#titleBear > *', { state: 'attached' }); }
  await page.click('#btnPlay');
  await onScreen(page, 'map');
  await page.click(`#mapList .chcard-main[data-ch="${chLast.id}"]`);
  await page.waitForSelector('#chView.open');
  await page.waitForTimeout(800);
  await page.click(`#chvSheet [data-level="${n}"]`);
  console.log(`Case ${n}: intro`);
  await watchStory(page);                                            // intro
  await solveCase(page, LEVELS[n - 1]);
  console.log(`Case ${n}: solved`);
  if (n < LAST) await watchStory(page);                              // outro
}

/* the last case: "Hear the ending", then Noir and the closing film with its credits */
console.log('The ending');
await watchStory(page).catch(() => {});
await page.waitForSelector('#chapterFilm.show').catch(() => {});
console.log('Playing the closing film. Close the browser window when you are done.');
await new Promise(r => browser.on('disconnected', r));
