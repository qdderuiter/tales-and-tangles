/* How much work does the game do while nobody touches it? (Playwright, on demand: not part of `npm run check`.)

     npm run build && npm run perf

   For each screen it waits IDLE_MS with motion allowed, then prints
     anims     animations that are running (document.getAnimations(), playState 'running'): should be a handful, on-screen only
     recalc/s  style recalculations per second       layout/s  layouts per second       cpu%  main-thread task time
   The numbers come from Chromium (Edge). Safari on an iPhone does more work for the same page (it repaints animated SVG parts on the
   main thread), so read them as a comparison between two builds, not as a verdict: the phone is the real test. */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { COLS, ROWS } from '../../src/core/grid.ts';
import { LEVELS } from '../../src/data/levels.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CHANNEL = process.env.E2E_BROWSER_CHANNEL || 'msedge';
const IDLE_MS = Number(process.env.PERF_IDLE_MS) || 5000;

const file = resolve(ROOT, 'dist/index.html');
if (!existsSync(file)) { console.error('dist/index.html is missing: run `npm run build` first'); process.exit(2); }

const browser = await chromium.launch({ channel: CHANNEL });
const context = await browser.newContext({ viewport: { width: 430, height: 900 }, reducedMotion: 'no-preference' });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');

const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const rows = [];
async function measure(name) {
  await page.waitForTimeout(1500);                                   // let the screen change and its entrance animations finish
  const a = await metrics();
  await page.waitForTimeout(IDLE_MS);
  const b = await metrics(), sec = IDLE_MS / 1000;
  const anims = await page.evaluate(() => document.getAnimations().filter(x => x.playState === 'running').length);
  rows.push({
    screen: name, anims,
    'recalc/s': +((b.RecalcStyleCount - a.RecalcStyleCount) / sec).toFixed(1),
    'layout/s': +((b.LayoutCount - a.LayoutCount) / sec).toFixed(1),
    'cpu%': +((b.TaskDuration - a.TaskDuration) / sec * 100).toFixed(1)
  });
}

const onScreen = name => page.waitForSelector(`#screen-${name}.active`);
const lv = LEVELS[0];

await page.goto(pathToFileURL(file).href);
await page.waitForSelector('#titleBear > *', { state: 'attached' });
await measure('title');

await page.click('#btnPlay');                                        // a new player goes straight into the first case
await onScreen('story');
await measure('story');

for (let i = 0; i < 40 && await page.locator('#screen-story.active').count(); i++) {
  await page.evaluate(() => document.getElementById('btnSkip').click());
  await page.waitForTimeout(150);
}
await onScreen('puzzle');
await page.waitForFunction(n => document.querySelectorAll('#grid .tile').length === n, ROWS * COLS);
await measure('puzzle');

const box = await page.locator('#grid').boundingBox();
const at = ([r, c]) => ({ x: box.x + (c + 0.5) * box.width / COLS, y: box.y + (r + 0.5) * box.height / ROWS });
for (const w of lv.words) {
  const first = at(w.p[0]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const cell of w.p.slice(1)) { const p = at(cell); await page.mouse.move(p.x, p.y, { steps: 6 }); }
  await page.mouse.up();
}
await page.waitForSelector('#victory.show');
await page.waitForTimeout(6000);                                     // the confetti and the star count-up are a one-off, not idle cost
await measure('victory');

await page.click('#vMap');                                          // back to the case files
await onScreen('map');
await measure('map');

console.table(rows);
await browser.close();
