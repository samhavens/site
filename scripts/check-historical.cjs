'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const browsers=require('playwright');
const H=require('../content/modeling-jewish-ancestry/historical.js');
const root=path.resolve(__dirname,'..'),artifacts=path.join(root,'artifacts/blog');
const origin=process.env.BLOG_TEST_URL||'http://127.0.0.1:8765';
const url=origin+'/blog/modeling-jewish-ancestry/';
const report=[],failures=[];
async function run(name){
 const browser=await browsers[name].launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const check=(label,ok)=>{assert.ok(ok,`${name}: ${label}`);report.push({browser:name,check:label});};
 const text=id=>page.locator('#'+id).innerText();
 const state=()=>page.evaluate(()=>window.HistoricalDemo.getState());
 const done=()=>page.waitForFunction(()=>document.querySelector('#h-status').textContent.includes('scenarios complete'));
 const enter=async(id,value)=>{await page.locator('#h-'+id).fill(String(value));await page.locator('#h-'+id).press('Tab');};
 const rerun=async()=>{await page.locator('#h-run').click();await done();};
 const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 try{
  await page.goto(url);await done();
  const baseline=(await state()).result,expected=H.ensemble(H.defaults());
  check('historical sweep is the main visible model',await page.locator('#h-startRange-0').inputValue()==='1877'&&await page.locator('#h-startRange-1').inputValue()==='1927'&&await page.locator('#h-endYear').inputValue()==='2026'&&!(await page.locator('#denomination-extension').evaluate(el=>el.open)));
  check('default retained screen matches the engine and static output',baseline.retained===1335&&JSON.stringify(baseline.quantiles)===JSON.stringify(expected.quantiles)&&(await text('h-screen-summary')).includes('1,335')&&(await page.locator('.static-results').textContent()).includes('1,335'));
  check('all rejected draws have a reason rather than zero ancestry',baseline.records.filter(r=>r.status==='rejected').every(r=>r.reason&&r.ancestry===undefined));
  check('every initial input satisfies its browser constraints',await page.locator('#historical-widget input').evaluateAll(inputs=>inputs.every(el=>el.checkValidity())));
  check('historical controls and explanation fit the desktop',!(await overflow())&&(await text('h-starting')).includes('0.52%–3.58%'));
  check('all ids and local article anchors resolve uniquely',await page.evaluate(()=>{
   const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
   return new Set(ids).size===ids.length&&[...document.querySelectorAll('a[href^="#"]')].every(a=>!a.hash||document.getElementById(decodeURIComponent(a.hash.slice(1))));
  }));
  await page.screenshot({path:path.join(artifacts,`${name}-historical-opening.png`)});
  await page.locator('#historical-widget').screenshot({path:path.join(artifacts,`${name}-historical-default.png`)});
  await page.locator('#h-next').click();
  check('historical timeline advances through a real retained path',(await state()).step===1&&Number((await text('h-clock')).split(' · ')[0])<2026);
  const finalStep=baseline.representative.rows.length-1;
  await page.locator('#h-step').fill(String(finalStep));await page.locator('#h-step').dispatchEvent('input');
  check('timeline ends exactly in the present with a fractional final step',(await text('h-clock')).startsWith('2026')&&(await text('h-step-note')).includes('fraction')&&baseline.representative.rows.at(-1).fraction<1);
  await page.locator('#h-step').press('ArrowLeft');
  check('timeline supports keyboard scrubbing',(await state()).step===finalStep-1);
  await page.locator('#h-play').click();await page.waitForFunction(()=>window.HistoricalDemo.getState().step===1);await page.locator('#h-play').click();
  check('play starts in the past and can be paused',await text('h-play')==='Play from the past'&&(await state()).step===1);
  await page.locator('#h-1925').click();
  check('editing the start clears stale results and rematches the starting share',!(await page.locator('#h-results').isVisible())&&(await text('h-starting')).includes('3.52%')&&(await text('h-status')).includes('Inputs changed'));
  await enter('draws',2000);await enter('generationRange-0',25);await enter('generationRange-1',25);await enter('endYear',2025);await rerun();
  let r=(await state()).result;
  check('fixed 1925 and 25-year generations reach 2025 in four actual steps',r.representative.start===1925&&r.representative.generationYears===25&&JSON.stringify(r.representative.rows.map(r=>r.year))===JSON.stringify([1925,1950,1975,2000,2025]));
  const fixedMedian=r.quantiles[1];
  await enter('generationRange-1',30);await enter('generationRange-0',30);await rerun();r=(await state()).result;
  check('generation length changes reproduction as well as calendar labels',r.quantiles[1]!==fixedMedian&&Math.abs(r.representative.rows.at(-1).fraction-1/3)<1e-12);
  await enter('generationRange-0',27.2);await enter('generationRange-1',27.2);await rerun();r=(await state()).result;
  check('decimal generation lengths complete without a rounding error',r.representative.rows.at(-1).year===2025&&r.representative.generationYears===27.2);
  const noOutside=r.quantiles[1];await enter('initialDescendants',1);await rerun();r=(await state()).result;
  check('existing ancestry is additional to matched Jewish identity',r.representative.rows[0].d===.01&&r.quantiles[1]>noOutside);
  await enter('startRange-0',1930);await page.locator('#h-run').click();
  check('reversed ranges show an accessible error and no stale estimate',(await text('h-status')).includes('ordered range')&&await page.locator('#h-status.error').isVisible()&&!(await page.locator('#h-results').isVisible()));
  await page.locator('#h-reset').click();await done();await enter('draws',2000);await rerun();
  await page.locator('#h-export > summary').click();
  const download=page.waitForEvent('download');await page.locator('#h-json').click();
  const file=path.join(artifacts,`${name}-historical-export.json`);await(await download).saveAs(file);
  const exported=JSON.parse(await fs.readFile(file,'utf8'));
  check('JSON exports full screen accounting, settings and the sampled path',exported.records.length===2000&&exported.modelVersion===H.VERSION&&exported.parameters.seed===106&&exported.representative.rows[1].rates&&exported.retained+exported.rejections.negative+exported.rejections.ceiling===2000);
  const csvDownload=page.waitForEvent('download');await page.locator('#h-csv').click();
  const csvFile=path.join(artifacts,`${name}-historical-export.csv`);await(await csvDownload).saveAs(csvFile);const csv=await fs.readFile(csvFile,'utf8');
  check('CSV includes each accepted and rejected draw with units',csv.includes('# Shares are fractions.')&&csv.split('\n').filter(s=>/^\d+,/.test(s)).length===2000&&csv.includes(',rejected,,,'));
  await page.locator('#h-assumptions > summary').click();await enter('immigrantJewishMax',0);await rerun();
  check('empty screen reports no estimate and keeps export available',(await state()).result.retained===0&&(await text('h-screen-summary')).includes('No ancestry estimate')&&!(await page.locator('#h-distribution').isVisible())&&!(await page.locator('#h-path-section').isVisible())&&await page.locator('#h-json').isVisible());
  await page.locator('#h-reset').click();await done();
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   check(`${width}px layout keeps controls and chart inside the viewport`,!(await overflow())&&await page.getByLabel('End year',{exact:true}).isVisible());
   // Resize replaces the SVG children. Query and measure within one browser task
   // so a redraw cannot detach the previously queried text nodes between calls.
   await page.waitForFunction(()=>{
    const boxes=[...document.querySelectorAll('#h-path text')].filter(t=>/^\d{4}$/.test(t.textContent)).map(t=>t.getBoundingClientRect()).sort((a,b)=>a.left-b.left);
    return boxes.length===3&&boxes.every((b,i)=>b.width>0&&(i===0||b.left>=boxes[i-1].right+2));
   });
   check(`${width}px historical axes do not overlap`,true);
   if(!(await page.locator('#h-assumptions').evaluate(el=>el.open)))await page.locator('#h-assumptions > summary').click();
   check(`${width}px assumptions and screen controls remain usable`,!(await overflow())&&await page.locator('#h-fertilityJJ-0').isVisible());
   await page.locator('#h-assumptions > summary').click();
   await page.locator('#historical-widget').screenshot({path:path.join(artifacts,`${name}-historical-${width}.png`)});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  check('animation remains optional and respects reduced motion styles',await page.locator('#h-path').evaluate(el=>getComputedStyle(el).animationName)==='none');
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),staticPage=await nojs.newPage();await staticPage.goto(url);
  check('without JavaScript the historical table, two screens and citations remain readable',(await staticPage.locator('.static-results').textContent()).includes('1,335')&&(await staticPage.locator('main').textContent()).includes('34,503')&&await staticPage.locator('.footnotes').count()===1);
  await nojs.close();
  const offline=await context.newPage(),network=[];offline.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await offline.goto(pathToFileURL(path.join(root,'blog/modeling-jewish-ancestry/standalone.html')).href);await offline.waitForFunction(()=>document.querySelector('#h-status').textContent.includes('scenarios complete'));
  check('offline HTML runs the same historical screen without network access',(await offline.locator('#h-screen-summary').innerText()).includes('1,335')&&network.length===0);
  check('no browser JavaScript errors',errors.length===0);
 }finally{await browser.close();}
}
(async()=>{
 await fs.mkdir(artifacts,{recursive:true});
 for(const name of ['chromium','firefox','webkit'])try{await run(name);console.log(`${name}: historical checks passed`);}catch(e){failures.push({browser:name,error:e.stack});console.error(`${name}: ${e.message}`);}
 await fs.writeFile(path.join(artifacts,'historical-checks.json'),JSON.stringify({checks:report,failures},null,2)+'\n');
 console.log(`${report.length} historical checks passed; ${failures.length} browser runs failed.`);if(failures.length)process.exitCode=1;
})();
