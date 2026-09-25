/* End-to-end checks on the served page, including editing, real exports, and offline use. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const browsers = require('playwright');
const M = require('../content/modeling-jewish-ancestry/model.js');
const S = require('../content/modeling-jewish-ancestry/setup.js');
const root = path.resolve(__dirname, '..');
const origin = process.env.BLOG_TEST_URL || 'http://127.0.0.1:8765';
const articlePath = '/blog/modeling-jewish-ancestry/';
const artifacts = path.join(root, 'artifacts/blog');
const report = [], failures = [];
const pct = x => (x * 100).toFixed(1) + '%';
async function range(page, id, value) {
  await page.locator('#' + id).evaluate((el, next) => {
    el.value = String(next); el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}
async function enter(locator, value) { await locator.fill(String(value)); await locator.press('Tab'); }

async function run(name) {
  const browser = await browsers[name].launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (label, ok) => { assert.ok(ok, `${name}: ${label}`); report.push({ browser: name, check: label }); };
  const text = id => page.locator('#' + id).innerText();
  const state = () => page.evaluate(() => window.AncestryDemo.getState());
  const noOverflow = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const field = id => page.locator('#p-' + id);
  try {
    await page.goto(origin);
    check('homepage has no link to the blog', await page.locator('a[href="/blog"], a[href^="/blog/"]').count() === 0);
    await page.goto(origin + '/blog/');
    check('blog lists the publication date without draft metadata', (await page.locator('.post-meta').innerText()).includes('September 24, 2026') && await page.locator('meta[name="robots"]').count() === 0);
    await page.getByRole('link', { name: 'Modeling Jewish Ancestry', exact: true }).click();
    await page.locator('#a-value').waitFor();
    check('direct blog → article navigation', page.url() === origin + articlePath);
    check('article has its final title, publication date and public metadata', await page.title() === 'Modeling Jewish Ancestry · Sam Havens' && (await page.locator('.post-meta').innerText()).includes('September 24, 2026') && await page.locator('meta[name="robots"]').count() === 0);
    check('projection is open at its independent 2013 reference', await page.locator('#denomination-extension').evaluate(el => el.open) && await text('a-value') === '2.2%' && await text('j-value') === '2.2%' && await text('clock') === '2013 · Starting population');
    check('projection date, generation length and fertility are visible', await field('referenceYear').isVisible() && await field('generationYears').isVisible() && await page.getByLabel('Haredi: children per pairing', { exact: true }).isVisible());
    check('parent-child samples are removed', await page.locator('#birth-canvas, #sample-details, #birth-filter').count() === 0 && !(await page.locator('main').innerText()).includes('parent and child samples'));
    check('initial form values satisfy browser constraints', await page.locator('#sim-widget input').evaluateAll(inputs => inputs.every(el => el.checkValidity())));
    check('desktop has no viewport overflow', await noOverflow(page));
    await page.screenshot({ path: path.join(artifacts, `${name}-opening.png`) });
    await page.locator('#sim-widget .setup-section').screenshot({ path: path.join(artifacts, `${name}-setup.png`) });

    check('comparison is optional on first load', await page.locator('#sim-widget path[stroke-dasharray]').count() === 0);
    await page.locator('#compare').check();
    check('comparison shows both matched controls', await page.locator('#sim-widget path[stroke-dasharray]').count() === 2 && await page.locator('#comparison-note').isVisible());
    await page.locator('#next').click();
    check('next advances by one configured generation', await text('generation-value') === '1' && (await text('clock')).startsWith('2040'));
    const first = (await state()).result.rows[1];
    check('the frozen comparison matches the first generation', Math.abs(first.connection - first.controlConnection) < 1e-12 && Math.abs(first.identity - first.controlIdentity) < 1e-12);
    const beforeDates = await state();
    await enter(field('referenceYear'), 1900); await enter(field('generationYears'), 25);
    const afterDates = await state();
    check('custom year and interval change dates without changing reproductive states', JSON.stringify(beforeDates.result.full) === JSON.stringify(afterDates.result.full) && (await text('clock')).startsWith('1925'));
    check('a custom date is never described as loaded historical data', (await text('baseline-status')).includes('does not supply historical population data'));
    await page.getByText('Full results table', { exact: true }).click();
    check('charts and table carry the configured years', (await page.locator('#connection-plot').textContent()).includes('1900') && (await text('cohort-table')).includes('1 / 1925'));
    await page.getByText('Full results table', { exact: true }).click();

    await enter(field('initialJewish'), 3); await enter(field('initialDescendants'), 5);
    await range(page, 'generation', 0);
    check('existing outside ancestry adds to jewish identity', await text('a-value') === '8.0%' && await text('j-value') === '3.0%');
    await enter(field('initialJewish'), 4);
    check('editing jewish identity preserves the entered outside ancestry', await text('a-value') === '9.0%' && await field('initialDescendants').inputValue() === '5');
    await enter(field('initialDescendants'), 99);
    check('invalid combined population restores the last valid scenario', await text('a-value') === '9.0%' && await field('initialDescendants').inputValue() === '5' && (await text('main-status')).length > 0);
    await page.locator('#reset-baseline').click();
    let p = (await state()).parameters;
    check('historical reset restores linked population, mix, fertility and marriage inputs', S.isHistorical(p) && p.generationYears === 25 && await text('generation-value') === '0');
    const mix = page.getByLabel('Haredi: share of Jews (%)', { exact: true });
    await enter(mix, 10);
    p = (await state()).parameters;
    check('denomination editing balances the visible remainder', Math.abs(p.jewishMix.reduce((a, b) => a + b) - 1) < 1e-12 && await page.locator('#remainder-mix').inputValue() === '33.20');
    await enter(mix, 95);
    check('impossible denomination mix is rejected', (await state()).parameters.jewishMix[0] === .1 && (await text('main-status')).includes('at most 100%'));
    await page.locator('#reset-baseline').click();
    await range(page, 'generation', 4);
    const referenceIdentity = (await state()).result.rows[4].identity;
    await enter(page.getByLabel('Haredi: children per pairing', { exact: true }), 6.2);
    check('fertility edit changes later identity and composition', (await state()).result.rows[4].identity > referenceIdentity && (await text('baseline-status')).startsWith('Custom'));
    await page.locator('#reset-baseline').click();
    await range(page, 'generation', 4);
    check('reference result returns after reset', await text('j-value') === pct(referenceIdentity));
    await page.locator('#group-settings summary').click();
    await range(page, 'p-fertilityHalfLife', 3);
    check('comparison explains imposed fertility convergence', (await text('comparison-note')).includes('fertility convergence'));
    await range(page, 'p-fertilityHalfLife', 0);
    await page.locator('#group-settings summary').click();
    await page.locator('#export-settings summary').click();
    await page.locator('#show-config').click(); await page.locator('#config').fill('{"bad":true}'); await page.locator('#apply-config').click();
    check('invalid import leaves the prior scenario intact', (await text('config-status')).length > 0 && await text('j-value') === pct(referenceIdentity));
    const differentBackground = (await state()).parameters;
    differentBackground.fertility[5] = 3.1;
    await page.locator('#config').fill(JSON.stringify(differentBackground)); await page.locator('#apply-config').click();
    check('imported unequal background fertility is visible', (await page.locator('#sim-widget .setup-section').innerText()).includes('descendants use 3.1'));
    await page.locator('#reset-baseline').click(); await range(page, 'generation', 4);
    await page.locator('#close-config').click();
    await page.locator('#sensitivity-settings > summary').click();
    await enter(page.locator('#draws'), 100); await page.locator('#run-sweep').click();
    await page.waitForFunction(() => document.querySelector('#sweep-status').textContent.includes('100 scenarios complete'));
    check('sensitivity produces bands and quantiles', await page.locator('#sweep-table tbody tr').count() === 4 && await page.locator('#connection-plot path[opacity=".12"]').count() === 1);
    await page.getByRole('link', { name: 'Historical to present', exact: true }).click();
    await page.locator('#compare').uncheck();
    check('article navigation and comparison toggle preserve sensitivity', (await text('sweep-status')).includes('100 scenarios complete'));
    const jsonDownload = page.waitForEvent('download'); await page.locator('#export-json').click();
    const jsonPath = path.join(artifacts, `${name}-scenario.json`); await (await jsonDownload).saveAs(jsonPath);
    const exported = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    check('real JSON export preserves dates, baseline sources and sensitivity', exported.modelVersion === '4.0.0' && exported.setupVersion === '1.0.0' && exported.parameters.referenceYear === 2013 && exported.parameters.generationYears === 25 && exported.results.rows[4].illustrativeYear === 2113 && exported.sensitivity.draws === 100 && exported.sourceReferences.length === 4);
    const csvDownload = page.waitForEvent('download'); await page.locator('#export-csv').click();
    const csvPath = path.join(artifacts, `${name}-cohorts.csv`); await (await csvDownload).saveAs(csvPath);
    const csv = await fs.readFile(csvPath, 'utf8');
    check('real CSV export carries dates and units', csv.includes('Shares are fractions of 1') && csv.includes('generation,illustrativeYear,connection,identity') && csv.includes('\n4,2113,'));

    const saved = { v: M.VERSION, p: exported.parameters, g: 4, c: true };
    saved.p.referenceYear = 1900; saved.p.initialConnection = .08;
    const savedUrl = origin + articlePath + '#sim=' + encodeURIComponent(Buffer.from(JSON.stringify(saved)).toString('base64'));
    await page.goto(savedUrl);
    check('saved link restores dates, ancestry and comparison', (await text('clock')).startsWith('2000') && (await state()).parameters.initialConnection === .08 && await page.locator('#compare').isChecked());
    await page.reload();
    check('saved state survives full reload', (await text('clock')).startsWith('2000') && (await state()).parameters.referenceYear === 1900);
    const legacy = { v: M.VERSION, p: M.defaults(), g: 4 };
    await page.goto(origin + articlePath + '#sim=' + encodeURIComponent(Buffer.from(JSON.stringify(legacy)).toString('base64')));
    check('previously shared v4 links keep their original values', await text('a-value') === '12.4%' && await text('j-value') === '5.4%' && (await text('clock')).startsWith('2134'));
    await page.goto(origin + articlePath + '#sim=invalid');
    check('bad state links show an accessible error', await page.locator('#export-status').isVisible() && (await text('export-status')).includes('Could not load saved state'));
    await page.goto(origin + articlePath); await page.reload();
    await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('#generation-value').textContent === '1');
    await page.locator('#play').click();
    check('timeline play advances and pauses', await text('generation-value') === '1' && await text('play') === 'Play timeline');
    await range(page, 'generation', 4); await page.locator('#generation').press('ArrowLeft');
    check('timeline works by keyboard', await text('generation-value') === '3');
    await page.locator('.results-section').screenshot({ path: path.join(artifacts, `${name}-results.png`) });
    await page.locator('#a-simple-model > summary').click(); await range(page, 'toy-g', 5);
    check('optional simple model preserves ancestry versus contribution', await text('toy-any') === '47.61%' && await text('toy-mean') === '2.00%');

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await enter(field('generations'), 16);
      await range(page, 'generation', 15);
      check(`mobile ${width}px composition years do not collide`, await page.locator('#composition text').evaluateAll(labels => {
        const boxes = labels.map(label => label.getBoundingClientRect()).sort((a, b) => a.left - b.left);
        return boxes.every((box, i) => i === 0 || box.left >= boxes[i - 1].right + 2);
      }));
      check(`mobile ${width}px has accessible starting inputs`, await noOverflow(page) && await field('referenceYear').isVisible() && await page.getByLabel('Haredi: children per pairing', { exact: true }).isVisible());
      await page.locator('#group-settings summary').click();
      check(`mobile ${width}px contains the advanced table`, await noOverflow(page));
      await page.locator('#group-settings summary').click();
      if (width === 390) {
        await page.locator('#sim-widget .setup-section').screenshot({ path: path.join(artifacts, `${name}-mobile-setup.png`) });
        await page.locator('.results-section').screenshot({ path: path.join(artifacts, `${name}-mobile-results.png`) });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    check('reduced motion removes optional toy transitions', await page.locator('#toy-dots rect').first().evaluate(el => getComputedStyle(el).transitionDuration) === '0s');
    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await staticContext.newPage(); await staticPage.goto(origin + articlePath);
    check('no-JavaScript version has historical results and citations', await staticPage.locator('h1').count() === 1 && await staticPage.locator('.static-results tbody tr').count() === 8 && (await staticPage.locator('.static-results').textContent()).includes('1877–1927') && await staticPage.locator('.footnotes').count() === 1);
    check('no-JavaScript mobile stays inside viewport', await noOverflow(staticPage)); await staticContext.close();
    const offline = await context.newPage(), external = [];
    offline.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
    await offline.goto(pathToFileURL(path.join(root, 'blog/modeling-jewish-ancestry/standalone.html')).href);
    check('offline file runs the same starting setup without network dependencies', await offline.locator('#a-value').textContent() === '2.2%' && await offline.locator('#p-referenceYear').inputValue() === '2013' && external.length === 0);
    check('no browser JavaScript errors', errors.length === 0);
  } finally { await browser.close(); }
}
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  for (const name of ['chromium', 'firefox', 'webkit']) {
    try { await run(name); console.log(`${name}: passed`); }
    catch (error) { failures.push({ browser: name, error: error.stack }); console.error(`${name}: ${error.message}`); }
  }
  await fs.writeFile(path.join(artifacts, 'checks.json'), JSON.stringify({ checks: report, failures }, null, 2) + '\n');
  console.log(`${report.length} browser checks passed; ${failures.length} browser runs failed.`);
  if (failures.length) process.exitCode = 1;
})();
