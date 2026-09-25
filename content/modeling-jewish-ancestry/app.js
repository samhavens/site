/* Browser-only presentation. All calculations live in model.js. */
(function(){
 'use strict';
 const M=window.AncestryModel, S=window.AncestrySetup;
 if(!M||!S)return;
 const $=id=>document.getElementById(id), fmt=(v,d=1)=>(100*v).toFixed(d)+'%',num=(v,d=1)=>Number(v).toFixed(d);
 const COLORS=['#725c96','#3d7291','#438678','#b15f74','#697491','#9d9d97','#deded7'];
 const INK='#232526',LINE='#d9dcdf',J='#335b82',A='#b86b26';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let params=S.historical(),result,selected=0,sensitivity=null,sweepToken=0,playing=false,timer=null;
 function status(id,msg,error=false){$(id).textContent=msg;$(id).classList.toggle('error',error);}
 function slider(key,title,min,max,step,value,explanation,scale=1){
   return `<label class="control" for="p-${key}"><span class="labelrow"><span>${title}</span><output id="o-${key}"></output></span><input id="p-${key}" data-key="${key}" data-scale="${scale}" type="range" min="${Math.min(min,value)}" max="${Math.max(max,value)}" step="${step}" value="${value}"><span class="note">${explanation}</span></label>`;
 }
 function field(key,title,min,max,step,value,scale=1){
  return `<label class="number-control" for="p-${key}"><span>${title}</span><input id="p-${key}" data-key="${key}" data-scale="${scale}" type="number" min="${min}" max="${max}" step="${step}" value="${Number(value.toFixed(4))}"></label>`;
 }
 function scaffold(){
  $('sim-widget').innerHTML=`
  <div class="widget-head"><h2>set up the starting population</h2><p class="note">edit the inputs, then play the timeline below. each step follows one new generation.</p></div>
  <div class="section setup-section">
   <div class="time-controls" id="time-controls"></div>
   <div class="baseline-row"><p id="baseline-status" class="note"></p><button id="reset-baseline">load 2013 starting values</button></div>
   <h3>who is here at the start?</h3><div class="population-controls" id="population-controls"></div>
   <p class="note" id="starting-total"></p>
   <p class="note">shares of the whole starting population. zero outside ancestry means counting begins here; older ancestry is unknown.</p>
   <h3>denominations and fertility</h3>
   <div class="table-scroll"><table class="starting-table"><thead><tr><th>group</th><th>share of jews (%)</th><th>children per pairing</th></tr></thead><tbody id="starting-rows"></tbody></table></div>
   <p class="note" id="background-note"></p><p class="note">“other jewish” fills the remainder and includes unaffiliated and secular jews. fertility includes childlessness.</p>
   <details class="source-note"><summary>where these starting values come from</summary><p class="note">the 2013 reference uses <a href="${S.REFERENCES[0]}">Pew’s adult population estimate</a> and <a href="${S.REFERENCES[1]}">denomination shares</a>. the haredi share is derived from <a href="${S.REFERENCES[3]}">Pew’s breakdown of orthodoxy</a>. these are survey estimates, applied here to a simplified cohort.</p><p class="note"><a href="${S.REFERENCES[2]}">fertility reports for ages 40–59</a> supply the orthodox, conservative and reform references. both orthodox groups receive the reported 4.1 average; a separate haredi rate is not measured here. other-jewish fertility (1.6) is assumed; 2.2 for both non-jewish groups is a general-public proxy. moving respondent averages into pairing units is also an assumption. older ancestry outside identity is unmeasured.</p></details>
   <p class="status" id="main-status" role="status" aria-live="polite"></p>
  </div>
  <div class="section results-section">
   <div class="results-heading"><h3>follow the generations</h3><div class="timeline-actions"><button id="play" aria-pressed="false">play timeline</button><button id="next">next generation</button></div></div>
   <div class="scrub"><label for="generation">generation</label><input type="range" min="0" max="6" step="1" value="0" id="generation"><output id="generation-value">0</output></div>
   <p class="clock" id="clock" aria-live="polite"></p>
   <div class="metric-row"><div class="metric ancestry"><span class="value" id="a-value"></span><span class="label">jewish roots + descendants</span></div><div class="metric"><span class="value" id="j-value"></span><span class="label">jewish-identifying</span></div></div>
   <p class="note">shares of this generation, not everyone alive in the labeled year.</p>
   <div class="comparison-toggle"><label><input type="checkbox" id="compare"> compare with frozen starting averages</label></div>
   <div id="comparison-note" hidden><div class="line-legend"><span>subgroups evolve</span><span class="dashed">starting averages stay fixed</span></div><p class="note" id="comparison-description"></p></div>
   <div class="chart-pair"><div class="plotwrap"><p class="plot-title ancestry">jewish roots + descendants</p><svg id="connection-plot" class="plot" role="img" aria-label="share of successive generations with jewish roots or ancestry"></svg></div><div class="plotwrap"><p class="plot-title">jewish-identifying</p><svg id="identity-plot" class="plot" role="img" aria-label="jewish-identifying share of successive generations"></svg></div></div>
   <p class="note">the charts use different vertical scales. click a point on either timeline to inspect that generation.</p>
   <h3 class="composition-heading">denominations within jewish identity</h3><svg id="composition" class="composition" role="img" aria-label="denominational composition within jewish identity"></svg><div class="group-legend" id="group-legend"></div><p class="note" id="composition-description"></p>
  </div>
  <div class="section"><details id="group-settings"><summary>pairing, identity and arrivals</summary><p class="note">starting shares and fertility are above. these additional rules determine who pairs with whom, the identity children reach as adults, and arrivals in each generation.</p><div class="table-scroll"><table class="parameter-table"><thead><tr><th>group</th><th>non-jewish<br>partner (%)</th><th>stays in<br>same group (%)</th><th>jewish identity with<br>one jewish parent (%)</th><th>reserve own<br>subgroup (%)</th></tr></thead><tbody id="parameter-rows"></tbody></table></div><p class="note">the 2013 marriage references concern intact marriages, not all reproductive pairings. “stays in group” concerns children of two parents in that group; leavers can join another jewish group. identity transitions and subgroup reservation are assumptions.</p><div class="advanced-grid" id="advanced-controls"></div><p class="note">arrivals use a separately specified denomination mix, initially matching the 2013 starting mix. editing the initial mix does not change it; the full json editor exposes both.</p></details></div>
  <div class="section"><details><summary>full results table</summary><div class="table-scroll" id="cohort-table"></div></details></div>
  <div class="section"><details id="sensitivity-settings"><summary>how much do the assumptions matter?</summary><p class="note">sample inputs around your settings. the shaded middle 90% describes the sampled scenarios, not a forecast probability. the solid line keeps your selected inputs.</p><div class="toolbar"><label for="draws">draws <input id="draws" type="number" min="100" max="5000" step="100" value="500"></label><label for="seed">seed <input id="seed" class="seed" type="number" min="0" max="4294967295" step="1" value="20260924"></label><label for="width">range width <input id="width" type="number" min="0" max="2" step=".25" value="1"></label><button id="run-sweep">run sensitivity</button><button id="cancel-sweep" disabled>cancel</button></div><p class="status" id="sweep-status" role="status" aria-live="polite">no sensitivity results yet.</p><div class="table-scroll" id="sweep-table"></div><details><summary>sampling ranges</summary><p class="note">independent uniform intervals, clipped to valid values: each fertility input ±20%; intermarriage half-ranges: haredi 1 percentage point, other orthodox 3.5 points, conservative 15 points, reform 13 points, other jewish 10 points; same-group retention ±8 points; mixed-parent identity retention ±15 points; clustering ±15 points; arrival share ±5 points; jewish share of arrivals ±1 point; starting roots + descendants ±2 points, bounded below by jewish identity. width multiplies these ranges; zero reproduces your scenario. non-jewish fertility uses a shared multiplier. dates, generation length, mixes, reservation and convergence stay fixed. these ranges are assumptions.</p></details></details></div>
  <div class="section"><details id="export-settings"><summary>save, share or inspect the model</summary><div class="toolbar"><button id="export-json">export model + results</button><button id="export-csv">export csv</button><button id="share">copy state link</button><button id="show-config">edit / import full json</button></div><p class="status" id="export-status" role="status" aria-live="polite"></p><div id="config-panel" hidden><label for="config" class="note">complete parameters, including identity transitions and arrival composition</label><textarea id="config" spellcheck="false"></textarea><div class="toolbar"><button id="apply-config">validate and apply</button><button id="close-config">close editor</button></div><p id="config-status" class="status configerror" role="status"></p></div><p class="note">engine ${M.VERSION}; starting setup ${S.VERSION}. calculations run locally.</p></details></div>`;
  $('group-legend').innerHTML=M.SHORT.slice(0,5).map((n,i)=>`<span><i class="swatch" style="--swatch:${COLORS[i]}"></i>${n}</span>`).join('');
 }
 function groupInput(i,key,title,value,min,max,step,scale=1){
  const remainder=i===4&&key==='jewishMix';
  return `<input type="number" aria-label="${M.SHORT[i]}: ${title}" data-group="${i}" data-field="${key}" data-scale="${scale}" value="${Number(value.toFixed(4))}" min="${min}" max="${max}" step="${step}" ${remainder?'readonly id="remainder-mix"':''}>`;
 }
 function renderControls(){
  $('time-controls').innerHTML=[
   field('referenceYear','start year',1500,2500,1,params.referenceYear),
   field('generationYears','years per generation',15,50,1,params.generationYears),
   field('generations','generations to follow',1,16,1,params.generations)
  ].join('');
  $('population-controls').innerHTML=[
   field('initialJewish','jewish-identifying (%)',0,100,.1,params.initialJewish*100,100),
   field('initialDescendants','ancestry outside jewish identity (%)',0,100,.1,(params.initialConnection-params.initialJewish)*100,100)
  ].join('');
  $('starting-rows').innerHTML=M.SHORT.slice(0,5).map((n,i)=>`<tr><th scope="row"><i class="swatch" style="--swatch:${COLORS[i]}"></i>${n}</th><td>${groupInput(i,'jewishMix','share of jews (%)',params.jewishMix[i]*100,0,100,.1,100)}</td><td>${groupInput(i,'fertility','children per pairing',params.fertility[i],0,15,.1)}</td></tr>`).join('')+`<tr><th scope="row">not jewish-identifying</th><td>outside this mix</td><td><input type="number" id="p-backgroundFertility" aria-label="not jewish-identifying: children per pairing" data-key="backgroundFertility" data-scale="1" min="0" max="15" step=".1" value="${params.fertility[6]}"></td></tr>`;
  $('parameter-rows').innerHTML=M.SHORT.slice(0,5).map((n,i)=>`<tr><th scope="row">${n}</th>${[
   ['intermarriage','non-jewish partner (%)',params.intermarriage[i]],
   ['retention','same-group retention (%)',params.sameGroupTransitions[i][i]],
   ['mixedRetention','mixed-parent jewish identity (%)',params.mixedRetention[i]],
   ['selfPair','own-subgroup reservation (%)',params.selfPair[i]]
  ].map(([key,label,v])=>`<td>${groupInput(i,key,label,v*100,0,100,.1,100)}</td>`).join('')}</tr>`).join('');
  $('advanced-controls').innerHTML=[
   slider('clustering','ancestry clustering',0,100,1,params.clustering*100,'0 = random pairing among non-jewish groups; 100 = only within the same ancestry category.',100),
   slider('arrivalShare','arrivals in each generation',0,40,1,params.arrivalShare*100,'share of the new cohort, not an annual immigration rate.',100),
   slider('mixedFertility','mixed-pair fertility multiplier',0,100,1,params.mixedFertility*100,'applied to jewish/non-jewish pairings.',100),
   slider('arrivalJewish','jewish share of arrivals',0,25,.1,params.arrivalJewish*100,'assumed composition of arrivals.',100),
   slider('arrivalDescendant','ancestry outside identity in arrivals',0,50,.1,params.arrivalDescendant*100,'an additional share, beyond jewish arrivals.',100),
   slider('fertilityHalfLife','orthodox fertility-gap half-life',0,10,.5,params.fertilityHalfLife,'0 = fixed fertility; otherwise the excess halves over this many generations.')
  ].join('');
  updateOutputs();
 }
 function updateOutputs(){
  document.querySelectorAll('[data-key]').forEach(el=>{
    const key=el.dataset.key,scale=+el.dataset.scale,v=key==='backgroundFertility'?params.fertility[6]:key==='initialDescendants'?params.initialConnection-params.initialJewish:params[key];
    if(document.activeElement!==el)el.value=Number((v*scale).toFixed(6));
    const o=$('o-'+key);if(o)o.textContent=scale===100?fmt(v):key==='fertilityHalfLife'&&v===0?'off':num(v,['generations','generationYears'].includes(key)?0:1);
  });
 }
 function render(){
  const row=result.rows[selected];$('generation').max=params.generations;$('generation').value=selected;$('generation-value').textContent=selected;
  $('a-value').textContent=fmt(row.connection);$('j-value').textContent=fmt(row.identity);
  $('clock').textContent=selected===0?`${params.referenceYear} · starting population`:`${row.illustrativeYear} · generation ${selected} · ${selected*params.generationYears} years after the start`;
  $('next').textContent=selected===params.generations?'back to the start':`next: ${params.referenceYear+(selected+1)*params.generationYears}`;
  $('baseline-status').textContent=S.isHistorical(params)?'2013 reference loaded; future rules are assumptions.':params.referenceYear===2013?'custom starting values for 2013. reload the reference to restore the linked inputs.':`custom scenario beginning in ${params.referenceYear}. changing the year does not supply historical population data; review the starting values below.`;
  $('starting-total').textContent=`total roots + descendants: ${fmt(params.initialConnection)} = ${fmt(params.initialJewish)} jewish + ${fmt(params.initialConnection-params.initialJewish)} outside ancestry.`;
  $('comparison-note').hidden=!$('compare').checked;
  $('comparison-description').textContent='both models produce the same first generation. later differences reflect '+(params.fertilityHalfLife>0?'changing group composition and the chosen fertility convergence.':'changing group composition.');
  $('background-note').hidden=params.fertility[5]===params.fertility[6];
  $('background-note').textContent=`imported settings: outside-identity descendants use ${params.fertility[5]} children per pairing. the field above shows ${params.fertility[6]} for people with no counted connection; editing it sets both groups to that value.`;
  plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);composition();
  $('cohort-table').innerHTML=`<table><caption>conditional shares of each generation (%)</caption><thead><tr><th>generation / year</th><th>roots + descendants</th><th>jewish identity</th><th>ancestry outside identity</th><th>frozen: ancestry</th><th>frozen: identity</th><th>haredi share of jews</th><th>intermarriage among jews</th></tr></thead><tbody>${result.rows.map(r=>`<tr class="${r.generation===selected?'selected':''}"><td>${r.generation} / ${r.illustrativeYear}</td>${['connection','identity','descendants','controlConnection','controlIdentity','harediShare','aggregateIntermarriage'].map(k=>`<td>${fmt(r[k],2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  updateOutputs();
 }
 function plot(id,key,control,color){
  const W=Math.max(260,$(id).clientWidth||680),H=240,L=44,R=24,T=14,B=38,w=W-L-R,h=H-T-B;
  $(id).setAttribute('viewBox',`0 0 ${W} ${H}`);
  const compare=$('compare').checked;
  let maximum=Math.max(.01,...result.rows.flatMap(r=>compare?[r[key],r[control]]:[r[key]]));
  if(sensitivity)maximum=Math.max(maximum,...sensitivity.rows.map(r=>r[key][2]));
  const yMax=Math.min(1,Math.ceil(maximum*1.08*20)/20||.05),x=g=>L+g/params.generations*w,y=v=>T+h*(1-v/yMax);
  const line=arr=>arr.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  let s=`<title>${key==='connection'?'jewish roots and descendants':'jewish identity'}: conditional cohort scenarios</title><desc>${compare?'solid: subgroups evolve. dashed: frozen starting averages.':'subgroups evolve under the stated assumptions.'} exact values are in the results table.</desc>`;
  for(let k=0;k<5;k++){const v=yMax*k/4,yy=y(v);s+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="${LINE}" stroke-width=".7"/><text x="${L-8}" y="${yy+4}" text-anchor="end">${(100*v).toFixed(yMax<=.1?1:0)}%</text>`;}
  for(let g=0;g<=params.generations;g++)if(g%Math.max(1,Math.ceil(params.generations/Math.max(2,Math.floor(W/85))))===0||g===params.generations)s+=`<text x="${x(g)}" y="${H-15}" text-anchor="middle">${params.referenceYear+g*params.generationYears}</text>`;
  if(sensitivity){const upper=sensitivity.rows.map(r=>r[key][2]),lower=sensitivity.rows.map(r=>r[key][0]);const d=line(upper)+' '+lower.map((_,ii)=>{const i=lower.length-1-ii;return `L${x(i)},${y(lower[i])}`;}).join(' ')+' Z';s+=`<path d="${d}" fill="${color}" opacity=".12"/>`;}
  if(compare)s+=`<path d="${line(result.rows.map(r=>r[control]))}" stroke="${color}" fill="none" stroke-width="1.8" stroke-dasharray="6 4" opacity=".65"/>`;
  s+=`<path d="${line(result.rows.map(r=>r[key]))}" stroke="${color}" fill="none" stroke-width="2.6"/><line x1="${x(selected)}" x2="${x(selected)}" y1="${T}" y2="${T+h}" stroke="${INK}" stroke-width=".8" opacity=".5"/><circle cx="${x(selected)}" cy="${y(result.rows[selected][key])}" r="4" fill="${color}"/><text x="${W-R}" y="${H-1}" text-anchor="end" class="axis-title">year (whole generations)</text>`;
  $(id).innerHTML=s;
 }
 function composition(){
  const W=Math.max(260,$('composition').clientWidth||980),H=204,L=15,R=12,T=12,B=25,n=params.generations+1,gap=W<500?6:12,bw=Math.min(100,(W-L-R-(n-1)*gap)/n),left=(W-(n*bw+(n-1)*gap))/2;
  $('composition').setAttribute('viewBox',`0 0 ${W} ${H}`);
  let s='<title>composition inside jewish identity</title><desc>five-group stacked bars. the denominator is the jewish-identifying population only.</desc>';
  result.full.forEach((x,g)=>{
   const total=x.slice(0,5).reduce((a,b)=>a+b,0),xx=left+g*(bw+gap);let y=H-B;
   if(total===0){s+=`<text x="${xx+bw/2}" y="90" text-anchor="middle">none</text>`;}
   else for(let i=0;i<5;i++){const hh=(H-T-B)*x[i]/total;y-=hh;s+=`<rect x="${xx}" y="${y}" width="${bw}" height="${hh}" fill="${COLORS[i]}"><title>${params.referenceYear+g*params.generationYears}, ${M.SHORT[i]}: ${fmt(x[i]/total)}</title></rect>`;}
   if(g===selected)s+=`<rect x="${xx-3}" y="${T-3}" width="${bw+6}" height="${H-T-B+6}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
   if(g%Math.max(1,Math.ceil(params.generations/Math.max(2,Math.floor(W/85))))===0||g===params.generations)s+=`<text x="${xx+bw/2}" y="${H-6}" text-anchor="middle">${params.referenceYear+g*params.generationYears}</text>`;
  });
  $('composition').innerHTML=s;
  const row=result.rows[selected];$('composition-description').textContent=`${row.illustrativeYear}: haredi ${fmt(row.harediShare)} of jewish identity; all orthodox ${fmt(row.orthodoxShare)}. each bar sums to 100% of jewish identity, not the whole population.`;
 }
 function cancelSweep(message){sweepToken++;$('run-sweep').disabled=false;$('cancel-sweep').disabled=true;if(message)status('sweep-status',message);}
 function rerun(){
  M.validate(params);stopPlaying();cancelSweep(sensitivity||$('run-sweep').disabled?'settings changed; run sensitivity again.':undefined);sensitivity=null;$('sweep-table').innerHTML='';
  result=M.simulate(params);selected=Math.min(selected,params.generations);render();status('main-status','');
 }
 function stopPlaying(){playing=false;if(timer)clearTimeout(timer);timer=null;$('play').textContent='play timeline';$('play').setAttribute('aria-pressed','false');}
 function nextGeneration(){selected=selected>=params.generations?0:selected+1;render();}
 function play(){
  if(playing){stopPlaying();return;}playing=true;if(selected>=params.generations)selected=0;$('play').textContent='pause';$('play').setAttribute('aria-pressed','true');render();
  const tick=()=>{if(!playing)return;if(selected>=params.generations){stopPlaying();return;}selected++;render();timer=setTimeout(tick,2300);};timer=setTimeout(tick,2300);
 }
 function handleInput(e){
  const el=e.target;if(!el.dataset.key)return;
  if(el.type==='range'&&e.type!=='input'||el.type!=='range'&&e.type!=='change')return;
  const old=M.clone(params),v=Number(el.value)/(+el.dataset.scale||1),key=el.dataset.key;
  try{
   if(el.value.trim()===''||!Number.isFinite(v))throw Error('enter a valid number');
   if(key==='referenceYear'&&!Number.isInteger(v))throw Error('start year must be a whole year');
   if(key==='backgroundFertility')params.fertility[5]=params.fertility[6]=v;
   else if(key==='initialDescendants')params.initialConnection=params.initialJewish+v;
   else if(key==='initialJewish'){const outside=params.initialConnection-params.initialJewish;params.initialJewish=v;params.initialConnection=v+outside;}
   else params[key]=v;
   rerun();
  }catch(err){params=old;renderControls();status('main-status',err.message,true);}
 }
 function handleGroup(e){
  const el=e.target;if(el.dataset.field===undefined)return;
  const old=M.clone(params),i=+el.dataset.group,key=el.dataset.field,v=Number(el.value)/(+el.dataset.scale||1);
  try{if(el.value.trim()===''||!Number.isFinite(v))throw Error('enter a valid number');
   if(key==='retention')M.setRetention(params,i,v);else params[key][i]=v;
   if(key==='jewishMix'){params.jewishMix[4]=1-params.jewishMix.slice(0,4).reduce((a,b)=>a+b,0);if(params.jewishMix[4]<0)throw Error('the first four initial subgroup shares must sum to at most 100%');$('remainder-mix').value=(params.jewishMix[4]*100).toFixed(2);}
   rerun();
  }catch(err){params=old;renderControls();status('main-status',err.message,true);}
 }
 function sensitivitySweep(){
  const draws=+$('draws').value,seed=+$('seed').value,width=+$('width').value;
  if(!Number.isInteger(draws)||draws<100||draws>5000||!Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isFinite(width)||width<0||width>2){status('sweep-status','use 100–5000 integer draws, a uint32 integer seed, and width 0–2.',true);return;}
  stopPlaying();cancelSweep();const token=++sweepToken,base=M.clone(params),rng=M.rng(seed),runs=[];sensitivity=null;$('sweep-table').innerHTML='';$('run-sweep').disabled=true;$('cancel-sweep').disabled=false;status('sweep-status',`running 0 / ${draws} input scenarios…`);
  function batch(){if(token!==sweepToken)return;try{
   const stop=Math.min(draws,runs.length+25);while(runs.length<stop)runs.push(M.simulate(M.sampleParameters(base,rng,width)));
   status('sweep-status',`running ${runs.length} / ${draws} input scenarios…`);
   if(runs.length<draws){setTimeout(batch,0);return;}
   sensitivity={seed,draws,width,baseParameters:base,rows:M.summarizeRuns(runs)};$('run-sweep').disabled=false;$('cancel-sweep').disabled=true;
   status('sweep-status',`${draws} scenarios complete. shaded: middle 90% of the chosen input draws. seed ${seed}. not forecast probabilities.`);
   $('sweep-table').innerHTML=`<table><caption>final cohort ${params.generations}; sensitivity quantiles (%)</caption><thead><tr><th>quantity</th><th>5th</th><th>median</th><th>95th</th></tr></thead><tbody>${[['connection','roots + descendants'],['identity','jewish identity'],['controlConnection','frozen: roots + descendants'],['controlIdentity','frozen: jewish identity']].map(([k,n])=>`<tr><td>${n}</td>${sensitivity.rows.at(-1)[k].map(v=>`<td>${fmt(v,2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
   plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);
  }catch(err){cancelSweep();status('sweep-status',err.message,true);}}
  setTimeout(batch,0);
 }
 function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function exportJson(){download('ancestry-scenario.json',JSON.stringify({modelVersion:M.VERSION,setupVersion:S.VERSION,sourceReferences:S.REFERENCES,historicalStartingValues:S.isHistorical(params),warning:'conditional successive-cohort scenarios; initial ancestry unvalidated; no all-age calendar forecast, DNA estimate, or halakhic status',parameters:params,results:result,sensitivity},null,2),'application/json');status('export-status','exported parameters, model version, full outputs, and any completed sensitivity run.');}
 function exportCsv(){const keys=['generation','illustrativeYear','connection','identity','descendants','controlConnection','controlIdentity','harediShare','orthodoxShare','aggregateIntermarriage'];const text='# conditional successive cohorts, not all-age calendar forecasts\n# shares are fractions of 1, not percent\n# model '+M.VERSION+'\n# start year '+params.referenceYear+'; years per generation '+params.generationYears+'\n'+keys.join(',')+'\n'+result.rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n';download('ancestry-cohorts.csv',text,'text/csv');status('export-status','exported cohort shares as fractions (0.08 means 8%). export json too to preserve the inputs.');}
 async function share(){
  const state={v:M.VERSION,p:params,g:selected,c:$('compare').checked},hash=btoa(JSON.stringify(state));const url=location.href.split('#')[0]+'#sim='+encodeURIComponent(hash);
  try{await navigator.clipboard.writeText(url);status('export-status',location.protocol==='file:'?'copied a local-file state link. it works with this file path; use an exported json to move between computers.':'copied a link containing the complete scenario.');}
  catch(e){$('config-panel').hidden=false;$('config').value=url;$('config').focus();$('config').select();status('export-status','clipboard unavailable. the full state link is selected in the editor; copy it manually.');}
 }
 function loadHash(){
  if(!location.hash.startsWith('#sim='))return;
  try{const s=JSON.parse(atob(decodeURIComponent(location.hash.slice(5))));if(s.v!==M.VERSION)throw Error('saved state uses a different model version');M.validate(s.p);params=M.clone(s.p);$('compare').checked=s.c===true;selected=Math.max(0,Math.min(params.generations,Number.isInteger(s.g)?s.g:0));}
  catch(e){$('export-settings').open=true;status('export-status','could not load saved state: '+e.message,true);}
 }
 function bind(){
  $('sim-widget').addEventListener('input',handleInput);$('sim-widget').addEventListener('change',handleInput);
  $('starting-rows').addEventListener('change',handleGroup);$('parameter-rows').addEventListener('change',handleGroup);
  $('reset-baseline').addEventListener('click',()=>{const years=params.generationYears,steps=params.generations;params=S.historical();params.generationYears=years;params.generations=steps;selected=0;renderControls();rerun();});
  $('generation').addEventListener('input',()=>{stopPlaying();selected=+$('generation').value;render();});
  ['connection-plot','identity-plot'].forEach(id=>$(id).addEventListener('click',e=>{const r=$(id).getBoundingClientRect(),vw=$(id).viewBox.baseVal.width,xx=(e.clientX-r.left)/r.width*vw;selected=Math.round(Math.max(0,Math.min(1,(xx-44)/(vw-68)))*params.generations);stopPlaying();render();}));
  $('play').addEventListener('click',play);$('next').addEventListener('click',()=>{stopPlaying();nextGeneration();});
  $('compare').addEventListener('change',render);
  $('run-sweep').addEventListener('click',sensitivitySweep);$('cancel-sweep').addEventListener('click',()=>cancelSweep('cancelled; incomplete runs are not reported.'));
  ['draws','seed','width'].forEach(id=>$(id).addEventListener('change',()=>{cancelSweep('sensitivity settings changed; run again to update the bands.');sensitivity=null;$('sweep-table').innerHTML='';plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);}));
  $('export-json').addEventListener('click',exportJson);$('export-csv').addEventListener('click',exportCsv);$('share').addEventListener('click',share);
  $('show-config').addEventListener('click',()=>{$('config-panel').hidden=false;$('config').value=JSON.stringify(params,null,2);status('config-status','');});$('close-config').addEventListener('click',()=>{$('config-panel').hidden=true;});
  $('apply-config').addEventListener('click',()=>{try{const s=JSON.parse($('config').value),p=s.parameters||s;M.validate(p);params=M.clone(p);renderControls();rerun();status('config-status','valid settings applied.');}catch(e){status('config-status',e.message,true);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlaying();});
  window.addEventListener('resize',()=>{if(result){plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);composition();}});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#sim=')){loadHash();renderControls();rerun();}});
 }
 function toyInit(){
  $('toy-widget').innerHTML=`<div class="toy-inner"><div class="kicker">equal fertility, no arrivals</div><h3>random-pairing example</h3><label class="control" for="toy-start"><span class="labelrow"><span>starting ancestry share</span><output id="toy-start-label">2%</output></span><input id="toy-start" type="range" min=".1" max="10" step=".1" value="2"></label><div class="scrub"><label for="toy-g">generations</label><input id="toy-g" type="range" min="0" max="8" step="1" value="0"><output id="toy-g-label">0</output></div><svg id="toy-dots" class="toy-dots" viewBox="0 0 640 204" role="img" aria-label="any-ancestry share in a random-pairing toy model"></svg><div class="toy-footer"><button id="toy-play">play generations</button><span>any ancestry from the starting group: <b id="toy-any"></b><br><span class="note">mean contribution from the starting group: <b id="toy-mean"></b> (unchanged)</span></span></div><p class="note">each square is 0.1 percentage points; squares are a display of the distribution, not individual people. the colored area is rounded to the nearest square. exact values use the equation above.</p><div id="toy-steps" class="mini-results"></div></div>`;
  let timer=null,playing=false;
  function draw(){const p=+$('toy-start').value/100,g=+$('toy-g').value,a=M.toy(p,g);$('toy-start-label').textContent=fmt(p);$('toy-g-label').textContent=g;$('toy-any').textContent=fmt(a,2);$('toy-mean').textContent=fmt(p,2);let s=`<title>${fmt(a,2)} with any ancestry from the starting group after ${g} generations; mean contribution ${fmt(p,2)}</title>`;const n=Math.round(a*1000);for(let i=0;i<1000;i++){const x=(i%50)*12.5+9,y=Math.floor(i/50)*9.8+5;s+=`<rect x="${x}" y="${y}" width="8.5" height="6" rx="1" fill="${i<n?A:'#e6e7e4'}"/>`;}if(!$('toy-dots').querySelector('rect'))$('toy-dots').innerHTML=s;else{$('toy-dots').querySelector('title').textContent=`${fmt(a,2)} with any ancestry after ${g} generations; mean contribution ${fmt(p,2)}`;$('toy-dots').querySelectorAll('rect').forEach((rect,i)=>{rect.style.transitionDelay=reduced.matches?'0ms':`${(i%50)*5}ms`;rect.setAttribute('fill',i<n?A:'#e6e7e4');});}$('toy-steps').innerHTML=Array.from({length:7},(_,i)=>`<span>cohort ${i}<b>${fmt(M.toy(p,i),1)}</b></span>`).join('');}
  function stop(){playing=false;clearTimeout(timer);$('toy-play').textContent='play generations';}
  function tick(){if(!playing)return;let g=+$('toy-g').value;if(g>=8){stop();return;}$('toy-g').value=g+1;draw();timer=setTimeout(tick,900);}
  $('toy-play').addEventListener('click',()=>{if(playing){stop();return;}playing=true;if(+$('toy-g').value>=8)$('toy-g').value=0;$('toy-play').textContent='pause';draw();timer=setTimeout(tick,900);});
  ['toy-start','toy-g'].forEach(id=>$(id).addEventListener('input',()=>{stop();draw();}));document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});draw();
 }
 scaffold();document.querySelectorAll('.table-scroll').forEach(el=>{el.tabIndex=0;el.setAttribute('role','region');if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',el.id==='cohort-table'?'full cohort results':'model assumptions or results table');});loadHash();renderControls();bind();result=M.simulate(params);render();toyInit();
 // Deliberate development surface for browser smoke tests and local agent audits.
 window.AncestryDemo={getState:()=>({parameters:M.clone(params),result:M.clone(result),selected,sensitivity:M.clone(sensitivity)}),setScenario:p=>{M.validate(p);params=M.clone(p);renderControls();rerun();}};
})();
