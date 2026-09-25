/* Integration checks against the actual local site, including real downloads. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const browsers = require('playwright');

const root = path.resolve(__dirname, '..');
const origin = process.env.BLOG_TEST_URL || 'http://127.0.0.1:8765';
const articlePath = '/blog/modeling-jewish-ancestry/';
const artifacts = path.join(root, 'artifacts/blog');
const report = [];
const failures = [];

async function range(page, id, value) {
  await page.locator('#' + id).evaluate((el, next) => {
    el.value = String(next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function run(name) {
  const browser = await browsers[name].launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (label, ok) => { assert.ok(ok, `${name}: ${label}`); report.push({ browser: name, check: label }); };
  const text = id => page.locator('#' + id).innerText();
  const noOverflow = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  try {
    await page.goto(origin);
    await page.getByRole('link', { name: 'Essays and interactive models', exact: true }).click();
    await page.getByRole('link', { name: 'modeling jewish ancestry', exact: true }).click();
    await page.locator('#a-value').waitFor();
    check('home → blog → article navigation', page.url() === origin + articlePath);
    check('default cohort-four outputs', await text('a-value') === '12.4%' && await text('j-value') === '5.4%');
    check('desktop layout stays inside viewport', await noOverflow(page));
    await page.screenshot({ path: path.join(artifacts, `${name}-opening.png`) });

    await page.locator('[data-preset="legacy"]').click();
    check('8% assumption changes ancestry but preserves identity', await text('a-value') === '31.9%' && await text('j-value') === '5.4%');
    await page.locator('.more-presets summary').click();
    await page.locator('[data-preset="stop"]').click();
    check('impossible family filter shows no fabricated samples', (await page.locator('#sample-details').textContent()).includes('zero probability'));
    await page.locator('[data-preset="roots"]').click();
    await page.locator('#group-settings summary').click();
    const fertility = page.getByLabel('haredi: offspring per same-group pairing', { exact: true });
    await fertility.fill('6.2');
    await fertility.press('Tab');
    check('editing subgroup fertility changes the result', await text('j-value') !== '5.4%');
    await page.locator('[data-preset="roots"]').click();
    await page.locator('#group-settings summary').click();

    await page.locator('#export-settings summary').click();
    await page.locator('#show-config').click();
    await page.locator('#config').fill('{"bad":true}');
    await page.locator('#apply-config').click();
    check('invalid import explains failure and retains the prior scenario', (await text('config-status')).length > 0 && await text('a-value') === '12.4%');
    await page.locator('#close-config').click();

    await page.locator('#sensitivity-settings > summary').click();
    await page.locator('#draws').fill('100');
    await page.locator('#draws').press('Tab');
    await page.locator('#run-sweep').click();
    await page.waitForFunction(() => document.querySelector('#sweep-status').textContent.includes('100 scenarios complete'));
    check('sensitivity produces bands and quantiles', await page.locator('#sweep-table tbody tr').count() === 4 && await page.locator('#connection-plot path[opacity=".12"]').count() === 1);
    await page.getByRole('link', { name: 'limits', exact: true }).click();
    check('article anchor navigation preserves sensitivity results', (await text('sweep-status')).includes('100 scenarios complete'));

    const jsonDownload = page.waitForEvent('download');
    await page.locator('#export-json').click();
    const downloaded = await jsonDownload;
    const jsonPath = path.join(artifacts, `${name}-scenario.json`);
    await downloaded.saveAs(jsonPath);
    const exported = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    check('actual JSON download preserves model, assumptions, and sensitivity', exported.modelVersion === '4.0.0' && exported.sensitivity.draws === 100 && exported.parameters.initialConnection === .024);
    const csvDownload = page.waitForEvent('download');
    await page.locator('#export-csv').click();
    const csvPath = path.join(artifacts, `${name}-cohorts.csv`);
    await (await csvDownload).saveAs(csvPath);
    const csv = await fs.readFile(csvPath, 'utf8');
    check('actual CSV download labels its units', csv.includes('shares are fractions of 1') && csv.includes('generation,connection,identity'));

    const saved = { v: exported.modelVersion, p: exported.parameters, g: 4 };
    saved.p.initialConnection = .08;
    await page.goto(origin + articlePath + '#sim=' + encodeURIComponent(Buffer.from(JSON.stringify(saved)).toString('base64')));
    check('saved scenario survives real URL navigation', await text('a-value') === '31.9%' && await text('generation-value') === '4');
    await page.goto(origin + articlePath + '#sim=invalid');
    check('invalid state link shows an accessible error', await page.locator('#export-status').isVisible() && (await text('export-status')).includes('could not load saved state'));
    await page.goto(origin + articlePath);
    await page.reload(); // A fragment-only navigation intentionally preserves current state.
    await range(page, 'generation', 0);
    await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('#generation-value').textContent === '1');
    await page.locator('#play').click();
    check('play advances the cohort and can pause', await text('generation-value') === '1' && await text('play') === 'play generations');
    await range(page, 'generation', 4);
    await page.locator('#generation').press('ArrowLeft');
    check('generation scrubber works by keyboard', await text('generation-value') === '3');
    await range(page, 'toy-g', 5);
    check('toy area and fractional contribution remain distinct', await text('toy-any') === '47.61%' && await text('toy-mean') === '2.00%');
    await range(page, 'generation', 4);
    await page.locator('#sim-widget').screenshot({ path: path.join(artifacts, `${name}-model.png`) });

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('#group-settings summary').click();
      check(`mobile ${width}px contains the settings table`, await noOverflow(page));
      await page.locator('#group-settings summary').click();
      if (width === 390) {
        await page.locator('#sim-widget').screenshot({ path: path.join(artifacts, `${name}-mobile-model.png`) });
        await page.goto(origin + articlePath);
        await page.screenshot({ path: path.join(artifacts, `${name}-mobile-opening.png`) });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    check('reduced motion removes area transitions', await page.locator('#toy-dots rect').first().evaluate(el => getComputedStyle(el).transitionDuration) === '0s');
    check('animation has a complete text alternative', await page.locator('#sample-details tbody tr').count() === 12);

    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(origin + articlePath);
    check('no-JavaScript essay, default results, and citations', await staticPage.locator('h1').count() === 1 && await staticPage.locator('.static-results tbody tr').count() === 5 && await staticPage.locator('.footnotes').count() === 1);
    check('no-JavaScript mobile page has no overflow', await noOverflow(staticPage));
    await staticContext.close();

    const offline = await context.newPage();
    const external = [];
    offline.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
    await offline.goto(pathToFileURL(path.join(root, 'blog/modeling-jewish-ancestry/standalone.html')).href);
    check('offline file runs without network dependencies', await offline.locator('#a-value').innerText() === '12.4%' && external.length === 0);
    check('no browser JavaScript errors', errors.length === 0);
  } finally {
    await browser.close();
  }
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
