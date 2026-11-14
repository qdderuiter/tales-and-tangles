/* A playthrough you can WATCH: a visible browser plays the whole happy flow (all chapters, every case) from a brand-new save.
   Not part of `npm run check`.

     npm run build && npm run watch            play dist/index.html
     npm run watch -- --dev                    use the vite dev server instead
     E2E_BROWSER_CHANNEL=chrome npm run watch  pick another installed browser (default msedge)
     WATCH_SPEED=8 npm run watch               pause lengths are divided by this (default 12)
     WATCH_FROM=14 npm run watch               start at case 14 (Case 6.1) with every earlier case already solved

   The play is fast (12x by default) but the cutscenes (Evil Larry's films Biscuit's films and the chapter endings) always run at regular speed,
   to the end, never skipped. Stories are tapped through (not skipped). Answers come from src/data. */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { COLS, ROWS } from '../../src/core/grid.ts';
import { CHAPTERS, chapterOf } from '../../src/data/chapters.ts';
import { LEVELS } from '../../src/data/levels.ts';
import { Store } from '../../src/state/store.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DEV = process.argv.includes('--dev');
const CHANNEL = process.env.E2E_BROWSER_CHANNEL || 'msedge';
const SPEED = Number(process.env.WATCH_SPEED) || 40;
const FROM = Math.max(1, Math.min(LEVELS.length, Number(process.env.WATCH_FROM) || 1));   // the first case to play; earlier ones are solved in the starting save
const PORT = 5173;

let devServer = null;
async function target() {
  if (process.env.E2E_URL) return process.env.E2E_URL;
  if (DEV) {
    devServer = spawn(`npm run dev -- --port ${PORT} --strictPort`, { cwd: ROOT, shell: true, stdio: 'ignore' });
    const url = `http://localhost:${PORT}/`;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(url)).ok) return url; } catch { /* not up yet */ }
      await new Promise(r => setTimeout(r, 200));
    }
    throw new Error('the vite dev server did not start');
  }
  const file = resolve(ROOT, 'dist/index.html');
  if (!existsSync(file)) throw new Error('dist/index.html is missing: run `npm run build` first (or use --dev)');
  return pathToFileURL(file).href;
}
function stopDevServer() {
  if (!devServer) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(devServer.pid), '/T', '/F'], { stdio: 'ignore' });
  else devServer.kill();
}

const log = msg => console.log(msg);
const sleep = (page, ms) => page.waitForTimeout(ms / SPEED);
const has = (page, sel) => page.locator(sel).count().then(n => n > 0);
const isEvil = page => page.evaluate(() => document.body.classList.contains('evil'));
const readSave = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), Store.KEY);

async function dragPath(page, boardSel, cells, rows, cols) {
  const box = await page.locator(boardSel).boundingBox();
  const at = ([r, c]) => ({ x: box.x + (c + 0.5) * box.width / cols, y: box.y + (r + 0.5) * box.height / rows });
  const first = at(cells[0]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const cell of cells.slice(1)) { const p = at(cell); await page.mouse.move(p.x, p.y, { steps: 12 }); }
  await page.mouse.up();
}

/* tap through a dialogue, picking the first choice, until the story screen is gone */
async function playStory(page) {
  for (let i = 0; i < 200 && await has(page, '#screen-story.active'); i++) {
    const choice = page.locator('#dlgChoices .choice, #dlgChoices button').first();
    if (await choice.count()) { await sleep(page, 700); await choice.click({ timeout: 2000 }).catch(() => {}); }
    else await page.locator('#screen-story').dispatchEvent('pointerdown').catch(() => {});
    await sleep(page, 900);
  }
  if (await has(page, '#screen-story.active')) await page.evaluate(() => document.getElementById('btnSkip').click());
}

/* Noir's remix re-lays the words on a random grid, so read the letters off the page and search for disjoint 4-neighbour paths */
async function solveEvilWords(page, words) {
  const letters = await page.$$eval('#grid .tile span', els => els.map(e => e.textContent));
  const pathsFor = w => {
    const out = [];
    const walk = (i, r, c, path, seen) => {
      const k = r * COLS + c;
      if (seen.has(k) || letters[k] !== w[i]) return;
      path.push([r, c]); seen.add(k);
      if (i === w.length - 1) out.push(path.slice());
      else for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < ROWS && nc < COLS) walk(i + 1, nr, nc, path, seen);
      }
      path.pop(); seen.delete(k);
    };
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) walk(0, r, c, [], new Set());
    return out;
  };
  const cands = words.map(w => pathsFor(w.w));
  const taken = new Set(), chosen = [];
  const pick = i => {
    if (i === words.length) return true;
    for (const p of cands[i]) {
      const ks = p.map(([r, c]) => r * COLS + c);
      if (ks.some(k => taken.has(k))) continue;
      ks.forEach(k => taken.add(k)); chosen[i] = p;
      if (pick(i + 1)) return true;
      ks.forEach(k => taken.delete(k));
    }
    return false;
  };
  if (!pick(0)) throw new Error('could not solve the Noir remix grid');
  for (const p of chosen) { await dragPath(page, '#grid', p, ROWS, COLS); await sleep(page, 500); }
}

async function playNoir(page) {
  for (let i = 0; i < 200 && await has(page, '#noir.show'); i++) {
    const seal = page.locator('#noirSeals .seal:not([data-broken])').first();   // the glowing dots: break all three
    if (await seal.count()) { log('    breaking a seal'); await sleep(page, 600); await seal.click({ timeout: 3000 }).catch(() => {}); await sleep(page, 500); continue; }
    const begin = page.locator('#noirBegin.on');                               // "begin" button after the level reassembles
    if (await begin.count()) { await sleep(page, 800); await begin.click({ timeout: 3000 }).catch(() => {}); await sleep(page, 700); continue; }
    const choice = page.locator('#noirChoices .choice').first();
    if (await choice.count()) { await sleep(page, 900); await choice.click({ timeout: 2000 }).catch(() => {}); }
    else await page.locator('#noirDlg').dispatchEvent('pointerdown').catch(() => {});
    await sleep(page, 700);
  }
}

/* a cutscene runs at regular speed and closes itself when it ends: wait for that, in real time, without skipping */
async function watchFilm(page, root) {
  await page.waitForSelector(`${root}.show`);
  await page.waitForSelector(`${root}:not(.show)`, { state: 'attached', timeout: 180000 });
}

async function main() {
  const url = await target();
  // viewport: null makes the page fill the real window, so nothing is cut off on a short screen
  const browser = await chromium.launch({ channel: CHANNEL, headless: false, slowMo: Math.round(120 / SPEED), args: ['--window-size=480,820', '--window-position=40,20'] });
  const context = await browser.newContext({ viewport: null });
  if (FROM > 1) {                                                    // earlier cases solved, their chapter films and cinematics already seen
    const done = { word: { done: true, stars: 3, best: 1400 }, zip: { done: true, stars: 3, best: 1400 }, solved: true, penalty: 0 };
    const d = Store.defaults();
    const save = JSON.stringify({ ...d, unlocked: FROM, levels: Object.fromEntries(Array.from({ length: FROM - 1 }, (_, i) => [i + 1, done])),
      seen: { ...d.seen, larry: FROM > 8, pup: FROM > 11, endings: Object.fromEntries(CHAPTERS.filter(c => c.levels[c.levels.length - 1] < FROM).map(c => [c.id, true])) } });
    await context.addInitScript(([key, value]) => { try { if (!sessionStorage.getItem('watch-seeded')) { sessionStorage.setItem('watch-seeded', '1'); localStorage.setItem(key, value); } } catch { /* storage blocked */ } }, [Store.KEY, save]);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.goto(url);
  await page.waitForSelector('#titleBear > *', { state: 'attached' });
  await sleep(page, 2000);

  let current = FROM;         // the case being played
  let doneWith = '';          // "screen:case" we already solved, so we don't drag twice
  const last = LEVELS.length;
  log(FROM > 1 ? `Playing cases ${FROM} to ${last}...` : 'Playing all ' + last + ' cases from a new save...');
  await page.click('#btnPlay');

  for (let tick = 0; tick < 4000; tick++) {
    await sleep(page, 400);
    const lv = LEVELS[current - 1];

    if (await has(page, '#chapterFilm.show')) { log('  chapter film'); await watchFilm(page, '#chapterFilm'); continue; }
    if (await has(page, '#larryFilm.show')) { log('  Evil Larry cinematic'); await watchFilm(page, '#larryFilm'); continue; }
    if (await has(page, '#pupFilm.show')) { log('  Pickle cinematic'); await watchFilm(page, '#pupFilm'); continue; }
    if (await has(page, '#wormFilm.show')) { log('  Biscuit cinematic'); await watchFilm(page, '#wormFilm'); continue; }
    if (await has(page, '#elephantFilm.show')) { log('  Pippy cinematic'); await watchFilm(page, '#elephantFilm'); continue; }
    if (await has(page, '#dinoFilm.show')) { log('  Rexy cinematic'); await watchFilm(page, '#dinoFilm'); continue; }
    if (await has(page, '#islandFilm.show')) { log('  Island cinematic'); await watchFilm(page, '#islandFilm'); continue; }
    if (await has(page, '#catsFilm.show')) { log('  Whisker Isles cinematic'); await watchFilm(page, '#catsFilm'); continue; }
    if (await has(page, '#noir.show')) { log('  Barnaby Noir interrupts'); await playNoir(page); continue; }

    if (await has(page, '#victory.show')) {
      const title = (await page.textContent('#vTitle')) || '';
      log(`  ${title}`);
      await sleep(page, 2200);
      await page.click('#vContinue');
      doneWith = '';
      if (title === 'Case Solved!' && current === last) { /* the outro and ending film still follow */ }
      continue;
    }

    if (await has(page, '#screen-story.active')) { log('  story'); await playStory(page); continue; }

    if (await has(page, '#screen-puzzle.active') && doneWith !== 'word' + current + await isEvil(page)) {
      await page.waitForFunction(n => document.querySelectorAll('#grid .tile').length === n, ROWS * COLS);
      log(`${caseLabelOf(current)}: finding the words`);
      await sleep(page, 1200);
      if (await page.evaluate(() => document.body.classList.contains('evil'))) { log('  solving Noir’s remix'); await solveEvilWords(page, lv.words); }
      else for (const w of lv.words) { await dragPath(page, '#grid', w.p, ROWS, COLS); await sleep(page, 500); }
      doneWith = 'word' + current + await isEvil(page);
      continue;
    }

    if (await has(page, '#screen-zip.active') && doneWith !== 'zip' + current + await isEvil(page)) {
      const z = (await page.evaluate(() => document.body.classList.contains('evil'))) ? lv.evilZip : lv.zip;
      await page.waitForFunction(n => document.querySelectorAll('#zGrid .zt').length === n * n, z.size);
      log(`${caseLabelOf(current)}: following the trail`);
      await sleep(page, 1200);
      await dragPath(page, '#zGrid', z.path, z.size, z.size);
      doneWith = 'zip' + current + await isEvil(page);
      continue;
    }

    if (await has(page, '#screen-case.active') && doneWith !== 'case' + current) {
      log(`${caseLabelOf(current)}: accusing the culprit`);
      await sleep(page, 2000);
      await page.click(`#cSus button.chip[data-s="${lv.case.culprit}"]`);
      await sleep(page, 900);
      await page.click(`#cItems button.chip[data-i="${lv.case.culpritItem}"]`);
      await sleep(page, 1200);
      await page.click('#btnAccuse');
      doneWith = 'case' + current;
      continue;
    }

    if (await has(page, '#screen-map.active')) {
      const save = await readSave(page);
      const allDone = LEVELS.every((_, i) => save?.levels?.[i + 1]?.solved);
      const filmsSeen = CHAPTERS.every(c => save?.seen?.endings?.[c.id]);   // (a start from WATCH_FROM marks the earlier chapters' films as seen)
      if (allDone && filmsSeen) { log('All cases solved, all films seen.'); await sleep(page, 4000); break; }
      const next = LEVELS.findIndex((_, i) => !save?.levels?.[i + 1]?.solved) + 1;
      if (next === 0) { await sleep(page, 1000); continue; }
      current = next;
      const ch = chapterOf(next);
      if (!await has(page, '#chView.open')) {
        log(`Opening chapter ${ch.n}: ${ch.title}`);
        await sleep(page, 1200);
        await page.click(`#mapList .chcard-main[data-ch="${ch.id}"]`);
        await page.waitForSelector('#chView.open');
      }
      await sleep(page, 1200);
      log(`Starting ${caseLabelOf(next)}`);
      doneWith = '';
      await page.click(`#chvSheet [data-level="${next}"]`);
    }
  }

  if (errors.length) log('\nThe page logged errors:\n  ' + errors.join('\n  '));
  else log('\nNo page errors.');
  await browser.close();
  return errors.length ? 1 : 0;
}

function caseLabelOf(n) {
  const c = chapterOf(n);
  return c ? `Case ${c.n}.${c.levels.indexOf(n) + 1}` : `Case ${n}`;
}

let code = 1;
try { code = await main(); } catch (e) { console.error(e.message); code = 2; } finally { stopDevServer(); }
process.exit(code);
