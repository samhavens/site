/* Historical reconstruction UI. Numerical rules live in historical.js. */
(function(){
 'use strict';
 const H=window.HistoricalAncestry,host=document.getElementById('historical-widget');
 if(!H||!host)return;
 const $=id=>document.getElementById(id),pct=(x,d=1)=>(100*x).toFixed(d)+'%',year=x=>Number(x.toFixed(1)).toString(),count=x=>x.toLocaleString('en-US');
 const ORANGE='#b86b26',BLUE='#335b82',GRAY='#d9dcdf';
 let result=null,step=0,token=0,timer=null;
 const rangeFields=[
  ['startRange','Starting year',1877,1937,1,1],['generationRange','Years per generation',20,35,.1,1],
  ['fertilityJJ','Two Jewish parents',.1,3,.01,1],['fertilityMixed','One Jewish parent',.1,3,.01,1],
  ['fertilityDescendants','Descendants outside Jewish identity',.1,3,.01,1],
  ['retainJJ','Jewish identity with two Jewish parents (%)',0,100,.1,100],
  ['clusteringRange','Clustering among descendants (%)',0,100,1,100],
  ['immigrationScale','Arrival proxy multiplier',.1,3,.01,1]
 ];
 function rangeControl([key,label,min,max,step,scale],p){
  return `<fieldset class="range-field"><legend>${label}</legend><div class="range-pair">${['Minimum','Maximum'].map((side,i)=>`<label for="h-${key}-${i}"><span>${side}</span><input id="h-${key}-${i}" data-range="${key}" data-index="${i}" data-scale="${scale}" type="number" required min="${min}" max="${max}" step="${step}" value="${Number((p[key][i]*scale).toFixed(6))}"></label>`).join('<span class="range-to" aria-hidden="true">–</span>')}</div></fieldset>`;
 }
 function numberControl(key,label,min,max,step,value,scale=1){return `<label class="number-control" for="h-${key}"><span>${label}</span><input id="h-${key}" data-hkey="${key}" data-scale="${scale}" type="number" required min="${min}" max="${max}" step="${step}" value="${value}"></label>`;}
 function scaffold(){
  const p=H.defaults();
  host.innerHTML=`<div class="widget-head"><h3>Historical model</h3><p>Jewish identity is one group here. Each scenario draws a starting year and generation length, then runs to the same endpoint.</p></div>
  <form id="h-form" novalidate><fieldset id="h-inputs" class="historical-inputs">
   <div class="section setup-section historical-setup"><div class="historical-time">${rangeFields.slice(0,2).map(f=>rangeControl(f,p)).join('')}${numberControl('endYear','End year',2000,H.PRESENT_YEAR,1,p.endYear)}</div>
   <div class="toolbar"><button type="button" id="h-1925">Use a 1925 start</button><button type="button" id="h-reset">Restore historical sweep</button></div>
   <h3>Match the starting population</h3><p id="h-starting" class="matched-start"></p>
   ${numberControl('initialDescendants','Starting ancestry outside Jewish identity (%)',0,20,.1,0,100)}
   <p class="note">Zero begins counting with the historical Jewish population. It leaves earlier ancestry uncounted; it does not establish that no earlier ancestry existed.</p>
   <details id="h-assumptions"><summary>Fertility, identity, arrivals and the screening rule</summary>
    <p>Relative fertility: 1 means the same fertility as a pair with no counted ancestry. A range of 0.85–1.08 means 15% lower to 8% higher. Each scenario keeps its fertility assumptions through time.</p>
    <div class="historical-ranges">${rangeFields.slice(2,5).map(f=>rangeControl(f,p)).join('')}</div>
    <p class="note">The historical experiment has three groups: Jewish-identifying, descendants outside Jewish identity, and everyone else. Historical denomination shares were not fitted. <a href="#projection">The projection below breaks out denominations.</a></p>
    <div class="historical-ranges">${rangeFields.slice(5).map(f=>rangeControl(f,p)).join('')}${numberControl('immigrantJewishMax','Maximum Jewish share of arrivals (%)',0,100,1,60,100)}</div>
    <p class="note">At each step, solve for the Jewish share of arrivals needed to match the historical identity curve. Reject the whole scenario if that share is negative or exceeds the ceiling. The ceiling is a modeling choice, not a measured limit. The 8% claim plays no part in this screen.</p>
    <p class="note">Intermarriage and mixed-parent identity retention change with calendar year. Their ranges, the identity curve and the foreign-born-stock proxy for arrivals come from the recovered historical experiment; see <a href="METHODS.md">Methods</a>. Values after the final reference date are held fixed through 2026. These are not newly measured 2026 rates.</p>
   </details>
   <div class="toolbar">${numberControl('draws','Scenarios',100,100000,100,p.draws)}${numberControl('seed','Random seed',0,4294967295,1,p.seed)}</div>
  </div></fieldset><div class="section historical-run"><button type="submit" id="h-run">Run scenarios</button><p id="h-status" class="status" role="status" aria-live="polite"></p></div></form>
  <div id="h-results" hidden>
   <div class="section"><h3 id="h-result-heading">Screen the scenarios</h3><p id="h-screen-summary"></p><div id="h-filter-bar" class="filter-bar" aria-hidden="true"></div>
    <ul id="h-rejections" class="screen-counts"></ul><p class="note">Rejected scenarios contribute no endpoint to the histogram or quantiles.</p>
    <div id="h-distribution"><div class="historical-estimate"><div><span class="estimate-label">Retained median</span><strong id="h-median"></strong></div><div><span class="estimate-label">Middle 90% of retained scenarios</span><strong id="h-range"></strong></div></div>
    <p id="h-endpoint-note" class="note"></p><svg id="h-histogram" class="plot" role="img" aria-label="Histogram of ancestry among retained scenarios"></svg><p class="note">The dashed line marks the original 8% claim. This is a distribution of assumptions that pass the screen, not a confidence interval.</p></div>
   </div>
   <div class="section" id="h-path-section"><h3>Follow one retained scenario</h3><p id="h-path-description" class="note"></p>
    <div class="timeline-actions"><button id="h-play" aria-pressed="false">Play from the past</button><button id="h-next">Next step</button></div>
    <div class="scrub"><label for="h-step">Step</label><input type="range" id="h-step" min="0" max="5" step="1" value="0"><output id="h-step-value">0</output></div>
    <p id="h-clock" class="clock" aria-live="polite"></p><div class="metric-row"><div class="metric ancestry"><span class="value" id="h-ancestry"></span><span class="label">Jewish roots + descendants</span></div><div class="metric"><span class="value" id="h-identity"></span><span class="label">Jewish-identifying</span></div></div>
    <div class="line-legend historical-legend"><span>Roots + descendants</span><span>Jewish identity (matched)</span></div><svg id="h-path" class="plot" role="img" aria-label="One retained historical ancestry scenario"></svg><p id="h-step-note" class="note"></p>
    <details><summary>Every step in this scenario</summary><div id="h-path-table" class="table-scroll" role="region" aria-label="Historical scenario steps" tabindex="0"></div></details>
   </div>
   <div class="section"><details id="h-export"><summary>Export this historical run</summary><div class="toolbar"><button id="h-json">Export settings + results</button><button id="h-csv">Export every scenario as CSV</button></div><p class="note">Exports include the seed, screen and rejection counts. JSON also contains the sampled inputs for the displayed path. Historical engine ${H.VERSION}; calculations run in your browser.</p></details></div>
  </div>`;
 }
 function read(){
  const p=H.defaults();
  host.querySelectorAll('[data-range]').forEach(el=>{p[el.dataset.range][+el.dataset.index]=el.value.trim()===''?NaN:Number(el.value)/Number(el.dataset.scale);});
  host.querySelectorAll('[data-hkey]').forEach(el=>{p[el.dataset.hkey]=el.value.trim()===''?NaN:Number(el.value)/Number(el.dataset.scale);});
  return p;
 }
 function fill(p){
  host.querySelectorAll('[data-range]').forEach(el=>{el.value=Number((p[el.dataset.range][+el.dataset.index]*Number(el.dataset.scale)).toFixed(6));});
  host.querySelectorAll('[data-hkey]').forEach(el=>{el.value=p[el.dataset.hkey]*Number(el.dataset.scale);});
 }
 function starting(){
  const p=read();
  try{H.validate(p);const [lo,hi]=p.startRange;
   $('h-starting').textContent=`Jewish-identifying at the start: ${pct(H.jewishShare(lo),2)}${lo===hi?'':'–'+pct(H.jewishShare(hi),2)}, matched to ${lo===hi?'the '+lo+' reference':'each sampled starting year'}. Runs end in ${p.endYear}.`;
  }catch(e){$('h-starting').textContent='Enter valid ranges to match the historical starting share.';}
 }
 function status(message,error=false){$('h-status').textContent=message;$('h-status').classList.toggle('error',error);}
 function pause(){clearTimeout(timer);timer=null;$('h-play').textContent='Play from the past';$('h-play').setAttribute('aria-pressed','false');}
 function changed(){token++;pause();result=null;$('h-results').hidden=true;starting();status('Inputs changed. Run scenarios to update the results.');}
 function run(){
  let p;try{p=read();H.validate(p);}catch(e){status(e.message,true);return;}
  pause();result=null;const current=++token,records=[];$('h-inputs').disabled=true;$('h-run').disabled=true;$('h-results').hidden=true;
  function batch(){
   if(current!==token)return;
   try{
    const until=Math.min(p.draws,records.length+1000);
    while(records.length<until)records.push(H.record(H.trial(p,records.length)));
    status(`Screening ${count(records.length)} / ${count(p.draws)} scenarios…`);
    if(records.length<p.draws){setTimeout(batch,0);return;}
    result=H.summarize(p,records);step=0;render();
    status(`${count(p.draws)} scenarios complete. ${count(result.retained)} retained. Seed ${p.seed}.`);
   }catch(e){status(e.message,true);result=null;$('h-results').hidden=true;}
   $('h-inputs').disabled=false;$('h-run').disabled=false;
  }
  status(`Screening 0 / ${count(p.draws)} scenarios…`);setTimeout(batch,0);
 }
 function render(){
  $('h-results').hidden=false;const {parameters:p,retained,rejections}=result;
  $('h-result-heading').textContent=`Historical scenarios ending in ${p.endYear}`;
  $('h-screen-summary').textContent=`${count(retained)} of ${count(p.draws)} retained (${(100*retained/p.draws).toFixed(1)}%).`;
  $('h-filter-bar').innerHTML=`<span style="width:${100*retained/p.draws}%"></span><span style="width:${100*rejections.negative/p.draws}%"></span><span style="width:${100*rejections.ceiling/p.draws}%"></span>`;
  $('h-rejections').innerHTML=`<li><b>${count(retained)}</b> matched the identity curve with feasible arrivals</li><li><b>${count(rejections.negative)}</b> would require a negative Jewish share of arrivals</li><li><b>${count(rejections.ceiling)}</b> would require more than ${pct(p.immigrantJewishMax,0)} of arrivals to be Jewish</li>`;
  $('h-distribution').hidden=!retained;$('h-path-section').hidden=!retained;
  if(!retained){$('h-screen-summary').textContent+=' No ancestry estimate can be summarized from this run.';return;}
  $('h-median').textContent=pct(result.quantiles[1]);$('h-range').textContent=`${pct(result.quantiles[0])}–${pct(result.quantiles[2])}`;
  $('h-endpoint-note').textContent=`Jewish roots + descendants in the simplified ${p.endYear} endpoint population. This is not an age-weighted count of everyone alive that year.`;
  histogram();
  const path=result.representative;
  $('h-path-description').textContent=`Starts in ${year(path.start)}; ${path.generationYears.toFixed(1)} years per generation. This is an actual retained scenario near the median endpoint, not the median of separate time slices.`;
  $('h-step').max=path.rows.length-1;
  $('h-path-table').innerHTML='<table><caption>Shares of the modeled population; arrivals are a share of this step’s endpoint.</caption><thead><tr><th>Year</th><th>Elapsed generation</th><th>Roots + descendants</th><th>Jewish identity</th><th>Arrivals</th><th>Jewish share of arrivals</th></tr></thead><tbody>'+path.rows.map(r=>`<tr><td>${year(r.year)}</td><td>${r.fraction.toFixed(2)}</td><td>${pct(r.j+r.d,2)}</td><td>${pct(r.j,2)}</td><td>${pct(r.arrivalShare,2)}</td><td>${r.immigrantJewish===null?'—':pct(r.immigrantJewish,2)}</td></tr>`).join('')+'</tbody></table>';
  drawPath();
 }
 function histogram(){
  const el=$('h-histogram'),W=Math.max(260,el.clientWidth),Hh=250,L=42,R=18,T=27,B=38,w=W-L-R,h=Hh-T-B;
  const values=result.records.filter(r=>r.status==='accepted').map(r=>r.ancestry),max=Math.max(.10,Math.ceil(values.reduce((a,b)=>Math.max(a,b),0)/.02)*.02),bins=Array(24).fill(0);
  for(const v of values)bins[Math.min(23,Math.floor(v/max*24))]++;
  const peak=Math.max(1,...bins),x=v=>L+w*v/max,y=v=>T+h*(1-v/peak);
  el.setAttribute('viewBox',`0 0 ${W} ${Hh}`);
  let svg=`<title>${count(values.length)} retained scenarios; median ${pct(result.quantiles[1])}, middle 90% ${pct(result.quantiles[0])} to ${pct(result.quantiles[2])}</title><desc>Histogram counts only retained scenarios. The dashed reference is 8%, which was not used for screening.</desc>`;
  for(let i=0;i<=2;i++){const n=Math.round(peak*i/2);svg+=`<line x1="${L}" x2="${W-R}" y1="${y(n)}" y2="${y(n)}" stroke="${GRAY}"/><text x="${L-7}" y="${y(n)+4}" text-anchor="end">${n}</text>`;}
  bins.forEach((n,i)=>{svg+=`<rect x="${x(max*i/24)+1}" y="${y(n)}" width="${w/24-2}" height="${h*n/peak}" fill="${ORANGE}"><title>${pct(max*i/24,1)}–${pct(max*(i+1)/24,1)}: ${count(n)} retained scenarios</title></rect>`;});
  for(let i=0;i<=4;i++)svg+=`<text x="${x(max*i/4)}" y="${Hh-16}" text-anchor="middle">${pct(max*i/4,max<=.2?1:0)}</text>`;
  svg+=`<line x1="${x(.08)}" x2="${x(.08)}" y1="${T}" y2="${T+h}" stroke="${BLUE}" stroke-dasharray="5 4"/><text x="${x(.08)+5}" y="16">8% claim</text><text x="${L}" y="16">Scenarios</text><text x="${W-R}" y="${Hh-1}" text-anchor="end">Endpoint ancestry share</text>`;
  el.innerHTML=svg;
 }
 function drawPath(){
  if(!result?.representative)return;
  const rows=result.representative.rows,r=rows[step],el=$('h-path'),W=Math.max(260,el.clientWidth),Hh=245,L=42,R=20,T=16,B=36,w=W-L-R,h=Hh-T-B;
  const max=Math.ceil(Math.max(...rows.map(r=>r.j+r.d))/.02)*.02,x=v=>L+w*(v-rows[0].year)/(rows.at(-1).year-rows[0].year),y=v=>T+h*(1-v/max);
  const line=(rs,key)=>rs.map((r,i)=>`${i?'L':'M'}${x(r.year)},${y(key(r))}`).join(' ');
  $('h-step').value=step;$('h-step-value').textContent=step;
  $('h-clock').textContent=`${year(r.year)} · ${step===0?'Starting population':step===rows.length-1?'Present endpoint':'Historical step '+step}`;
  if(step===rows.length-1&&result.parameters.endYear!==H.PRESENT_YEAR)$('h-clock').textContent=`${year(r.year)} · Selected endpoint`;
  $('h-ancestry').textContent=pct(r.j+r.d);$('h-identity').textContent=pct(r.j);
  $('h-next').textContent=step===rows.length-1?'Back to the start':'Next: '+year(rows[step+1].year);
  $('h-step-note').textContent=step===0?'The starting Jewish share is matched to the historical reference curve. Outside ancestry is the assumption entered above.':r.fraction<.999999?`This final interval is ${((r.year-rows[step-1].year)).toFixed(1)} years, or ${(100*r.fraction).toFixed(0)}% of a generation. Only that fraction of the reproductive update and arrival share is applied.`:'One full generation; the Jewish share is recalibrated to the historical reference curve after arrivals.';
  el.setAttribute('viewBox',`0 0 ${W} ${Hh}`);
  let svg=`<title>${year(r.year)}: roots and descendants ${pct(r.j+r.d)}, Jewish identity ${pct(r.j)}</title><desc>The faint lines show the full retained path; colored lines show progress from the historical start. Exact steps are in the table.</desc>`;
  for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="${GRAY}"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${pct(v,0)}</text>`;}
  for(let i=0;i<=2;i++){const v=rows[0].year+(rows.at(-1).year-rows[0].year)*i/2;svg+=`<text x="${x(v)}" y="${Hh-12}" text-anchor="middle">${Math.round(v)}</text>`;}
  for(const [key,color] of [[r=>r.j+r.d,ORANGE],[r=>r.j,BLUE]])svg+=`<path d="${line(rows,key)}" fill="none" stroke="${color}" opacity=".2" stroke-width="2"/><path d="${line(rows.slice(0,step+1),key)}" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="${x(r.year)}" cy="${y(key(r))}" r="4" fill="${color}"/>`;
  svg+=`<line x1="${x(r.year)}" x2="${x(r.year)}" y1="${T}" y2="${T+h}" stroke="#232526" opacity=".3"/>`;el.innerHTML=svg;
 }
 function play(){
  if(timer){pause();return;}
  step=0;drawPath();$('h-play').textContent='Pause';$('h-play').setAttribute('aria-pressed','true');
  function tick(){step++;drawPath();if(step===result.representative.rows.length-1){pause();return;}timer=setTimeout(tick,1100);}
  timer=setTimeout(tick,1100);
 }
 function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 scaffold();starting();
 $('h-form').addEventListener('submit',e=>{e.preventDefault();run();});$('h-inputs').addEventListener('input',changed);
 $('h-1925').addEventListener('click',()=>{const p=read();p.startRange=[1925,1925];fill(p);changed();});
 $('h-reset').addEventListener('click',()=>{fill(H.defaults());changed();run();});
 $('h-step').addEventListener('input',()=>{pause();step=Number($('h-step').value);drawPath();});
 $('h-next').addEventListener('click',()=>{pause();step=(step+1)%result.representative.rows.length;drawPath();});$('h-play').addEventListener('click',play);
 $('h-json').addEventListener('click',()=>download('historical-ancestry.json',JSON.stringify(result,null,2),'application/json'));
 $('h-csv').addEventListener('click',()=>{
  const keys=['index','start','generationYears','status','ancestry','parentProxy','reason','rejectedYear','requiredImmigrantShare'];
  const text=`# Historical engine ${H.VERSION}; endpoint ${result.parameters.endYear}; seed ${result.parameters.seed}\n# Shares are fractions. Rejected endpoints are blank. Not a confidence interval.\n# Settings: ${JSON.stringify(result.parameters)}\n`+keys.join(',')+'\n'+result.records.map(r=>keys.map(k=>r[k]??'').join(',')).join('\n')+'\n';
  download('historical-scenarios.csv',text,'text/csv');
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 window.addEventListener('resize',()=>{if(result?.retained){histogram();drawPath();}});
 window.HistoricalDemo={getState:()=>({result:structuredClone(result),step})};
 run();
})();
