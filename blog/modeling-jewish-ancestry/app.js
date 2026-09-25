/* Browser-only presentation. All calculations live in model.js. */
(function(){
 'use strict';
 const M=window.AncestryModel, S=window.AncestrySetup;
 if(!M||!S)return;
 const $=id=>document.getElementById(id), fmt=(v,d=1)=>(100*v).toFixed(d)+'%',num=(v,d=1)=>Number(v).toFixed(d);
 const GROUP_LABELS=['Haredi','Other Orthodox','Conservative','Reform','Other Jewish'];
 const COLORS=['#725c96','#3d7291','#438678','#b15f74','#697491','#9d9d97','#deded7'];
 const INK='#232526',LINE='#d9dcdf',J='#335b82',A='#b86b26';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let params=S.historical(),result,selected=0,sensitivity=null,sweepToken=0,playing=false,timer=null;
 function status(id,msg,error=false){$(id).textContent=msg.charAt(0).toUpperCase()+msg.slice(1);$(id).classList.toggle('error',error);}
 function slider(key,title,min,max,step,value,explanation,scale=1){
   return `<label class="control" for="p-${key}"><span class="labelrow"><span>${title}</span><output id="o-${key}"></output></span><input id="p-${key}" data-key="${key}" data-scale="${scale}" type="range" min="${Math.min(min,value)}" max="${Math.max(max,value)}" step="${step}" value="${value}"><span class="note">${explanation}</span></label>`;
 }
 function field(key,title,min,max,step,value,scale=1){
  return `<label class="number-control" for="p-${key}"><span>${title}</span><input id="p-${key}" data-key="${key}" data-scale="${scale}" type="number" min="${min}" max="${max}" step="${step}" value="${Number(value.toFixed(4))}"></label>`;
 }
 function scaffold(){
  $('sim-widget').innerHTML=`
  <div class="widget-head"><h2>Set up the starting population</h2><p class="note">Edit the inputs, then play the timeline below. Each step follows one new generation.</p></div>
  <div class="section setup-section">
   <div class="time-controls" id="time-controls"></div>
   <div class="baseline-row"><p id="baseline-status" class="note"></p><button id="reset-baseline">Load 2013 starting values</button></div>
   <h3>Who is here at the start?</h3><div class="population-controls" id="population-controls"></div>
   <p class="note" id="starting-total"></p>
   <p class="note">Shares of the whole starting population. Zero outside ancestry means counting begins here; older ancestry is unknown.</p>
   <h3>Denominations and fertility</h3>
   <div class="table-scroll"><table class="starting-table"><thead><tr><th>Group</th><th>Share of Jews (%)</th><th>Children per pairing</th></tr></thead><tbody id="starting-rows"></tbody></table></div>
   <p class="note" id="background-note"></p><p class="note">“Other Jewish” fills the remainder and includes unaffiliated and secular Jews. Fertility includes childlessness.</p>
   <details class="source-note"><summary>Where these starting values come from</summary><p class="note">The 2013 reference uses <a href="${S.REFERENCES[0]}">Pew’s adult population estimate</a> and <a href="${S.REFERENCES[1]}">denomination shares</a>. The Haredi share is derived from <a href="${S.REFERENCES[3]}">Pew’s breakdown of Orthodoxy</a>. These are survey estimates, applied here to a simplified cohort.</p><p class="note"><a href="${S.REFERENCES[2]}">Fertility reports for ages 40–59</a> supply the Orthodox, Conservative and Reform references. Both Orthodox groups receive the reported 4.1 average; a separate Haredi rate is not measured here. Other-Jewish fertility (1.6) is assumed; 2.2 for both non-Jewish groups is a general-public proxy. Moving respondent averages into pairing units is also an assumption. Older ancestry outside identity is unmeasured.</p></details>
   <p class="status" id="main-status" role="status" aria-live="polite"></p>
  </div>
  <div class="section results-section">
   <div class="results-heading"><h3>Follow the generations</h3><div class="timeline-actions"><button id="play" aria-pressed="false">Play timeline</button><button id="next">Next generation</button></div></div>
   <div class="scrub"><label for="generation">Generation</label><input type="range" min="0" max="6" step="1" value="0" id="generation"><output id="generation-value">0</output></div>
   <p class="clock" id="clock" aria-live="polite"></p>
   <div class="metric-row"><div class="metric ancestry"><span class="value" id="a-value"></span><span class="label">Jewish roots + descendants</span></div><div class="metric"><span class="value" id="j-value"></span><span class="label">Jewish-identifying</span></div></div>
   <p class="note">Shares of this generation, not everyone alive in the labeled year.</p>
   <div class="comparison-toggle"><label><input type="checkbox" id="compare"> Compare with frozen starting averages</label></div>
   <div id="comparison-note" hidden><div class="line-legend"><span>Subgroups evolve</span><span class="dashed">Starting averages stay fixed</span></div><p class="note" id="comparison-description"></p></div>
   <div class="chart-pair"><div class="plotwrap"><p class="plot-title ancestry">Jewish roots + descendants</p><svg id="connection-plot" class="plot" role="img" aria-label="Share of successive generations with Jewish roots or ancestry"></svg></div><div class="plotwrap"><p class="plot-title">Jewish-identifying</p><svg id="identity-plot" class="plot" role="img" aria-label="Jewish-identifying share of successive generations"></svg></div></div>
   <p class="note">The charts use different vertical scales. Click a point on either timeline to inspect that generation.</p>
   <h3 class="composition-heading">Denominations within Jewish identity</h3><svg id="composition" class="composition" role="img" aria-label="Denominational composition within Jewish identity"></svg><div class="group-legend" id="group-legend"></div><p class="note" id="composition-description"></p>
  </div>
  <div class="section"><details id="group-settings"><summary>Pairing, identity and arrivals</summary><p class="note">Starting shares and fertility are above. These additional rules determine who pairs with whom, the identity children reach as adults, and arrivals in each generation.</p><div class="table-scroll"><table class="parameter-table"><thead><tr><th>Group</th><th>Non-Jewish<br>partner (%)</th><th>Stays in<br>same group (%)</th><th>Jewish identity with<br>one Jewish parent (%)</th><th>Reserve own<br>subgroup (%)</th></tr></thead><tbody id="parameter-rows"></tbody></table></div><p class="note">The 2013 marriage references concern intact marriages, not all reproductive pairings. “Stays in group” concerns children of two parents in that group; leavers can join another Jewish group. Identity transitions and subgroup reservation are assumptions.</p><div class="advanced-grid" id="advanced-controls"></div><p class="note">Arrivals use a separately specified denomination mix, initially matching the 2013 starting mix. Editing the initial mix does not change it; the full JSON editor exposes both.</p></details></div>
  <div class="section"><details><summary>Full results table</summary><div class="table-scroll" id="cohort-table"></div></details></div>
  <div class="section"><details id="sensitivity-settings"><summary>How much do the assumptions matter?</summary><p class="note">Sample inputs around your settings. The shaded middle 90% describes the sampled scenarios, not a forecast probability. The solid line keeps your selected inputs.</p><div class="toolbar"><label for="draws">Draws <input id="draws" type="number" min="100" max="5000" step="100" value="500"></label><label for="seed">Seed <input id="seed" class="seed" type="number" min="0" max="4294967295" step="1" value="20260924"></label><label for="width">Range width <input id="width" type="number" min="0" max="2" step=".25" value="1"></label><button id="run-sweep">Run sensitivity</button><button id="cancel-sweep" disabled>Cancel</button></div><p class="status" id="sweep-status" role="status" aria-live="polite">No sensitivity results yet.</p><div class="table-scroll" id="sweep-table"></div><details><summary>Sampling ranges</summary><p class="note">Independent uniform intervals, clipped to valid values: each fertility input ±20%; intermarriage half-ranges: Haredi 1 percentage point, other Orthodox 3.5 points, Conservative 15 points, Reform 13 points, other Jewish 10 points; same-group retention ±8 points; mixed-parent identity retention ±15 points; clustering ±15 points; arrival share ±5 points; Jewish share of arrivals ±1 point; starting roots + descendants ±2 points, bounded below by Jewish identity. Width multiplies these ranges; zero reproduces your scenario. Non-Jewish fertility uses a shared multiplier. Dates, generation length, mixes, reservation and convergence stay fixed. These ranges are assumptions.</p></details></details></div>
  <div class="section"><details id="export-settings"><summary>Save, share or inspect the model</summary><div class="toolbar"><button id="export-json">Export model + results</button><button id="export-csv">Export CSV</button><button id="share">Copy state link</button><button id="show-config">Edit / import full JSON</button></div><p class="status" id="export-status" role="status" aria-live="polite"></p><div id="config-panel" hidden><label for="config" class="note">Complete parameters, including identity transitions and arrival composition</label><textarea id="config" spellcheck="false"></textarea><div class="toolbar"><button id="apply-config">Validate and apply</button><button id="close-config">Close editor</button></div><p id="config-status" class="status configerror" role="status"></p></div><p class="note">Engine ${M.VERSION}; starting setup ${S.VERSION}. Calculations run locally.</p></details></div>`;
  $('group-legend').innerHTML=GROUP_LABELS.map((n,i)=>`<span><i class="swatch" style="--swatch:${COLORS[i]}"></i>${n}</span>`).join('');
 }
 function groupInput(i,key,title,value,min,max,step,scale=1){
  const remainder=i===4&&key==='jewishMix';
  return `<input type="number" aria-label="${GROUP_LABELS[i]}: ${title}" data-group="${i}" data-field="${key}" data-scale="${scale}" value="${Number(value.toFixed(4))}" min="${min}" max="${max}" step="${step}" ${remainder?'readonly id="remainder-mix"':''}>`;
 }
 function renderControls(){
  $('time-controls').innerHTML=[
   field('referenceYear','Start year',1500,2500,1,params.referenceYear),
   field('generationYears','Years per generation',15,50,1,params.generationYears),
   field('generations','Generations to follow',1,16,1,params.generations)
  ].join('');
  $('population-controls').innerHTML=[
   field('initialJewish','Jewish-identifying (%)',0,100,.1,params.initialJewish*100,100),
   field('initialDescendants','Ancestry outside Jewish identity (%)',0,100,.1,(params.initialConnection-params.initialJewish)*100,100)
  ].join('');
  $('starting-rows').innerHTML=GROUP_LABELS.map((n,i)=>`<tr><th scope="row"><i class="swatch" style="--swatch:${COLORS[i]}"></i>${n}</th><td>${groupInput(i,'jewishMix','share of Jews (%)',params.jewishMix[i]*100,0,100,.1,100)}</td><td>${groupInput(i,'fertility','children per pairing',params.fertility[i],0,15,.1)}</td></tr>`).join('')+`<tr><th scope="row">Not Jewish-identifying</th><td>Outside this mix</td><td><input type="number" id="p-backgroundFertility" aria-label="Not Jewish-identifying: children per pairing" data-key="backgroundFertility" data-scale="1" min="0" max="15" step=".1" value="${params.fertility[6]}"></td></tr>`;
  $('parameter-rows').innerHTML=GROUP_LABELS.map((n,i)=>`<tr><th scope="row">${n}</th>${[
   ['intermarriage','non-Jewish partner (%)',params.intermarriage[i]],
   ['retention','same-group retention (%)',params.sameGroupTransitions[i][i]],
   ['mixedRetention','mixed-parent Jewish identity (%)',params.mixedRetention[i]],
   ['selfPair','own-subgroup reservation (%)',params.selfPair[i]]
  ].map(([key,label,v])=>`<td>${groupInput(i,key,label,v*100,0,100,.1,100)}</td>`).join('')}</tr>`).join('');
  $('advanced-controls').innerHTML=[
   slider('clustering','Ancestry clustering',0,100,1,params.clustering*100,'0 = random pairing among non-Jewish groups; 100 = only within the same ancestry category.',100),
   slider('arrivalShare','Arrivals in each generation',0,40,1,params.arrivalShare*100,'Share of the new cohort, not an annual immigration rate.',100),
   slider('mixedFertility','Mixed-pair fertility multiplier',0,100,1,params.mixedFertility*100,'Applied to Jewish/non-Jewish pairings.',100),
   slider('arrivalJewish','Jewish share of arrivals',0,25,.1,params.arrivalJewish*100,'Assumed composition of arrivals.',100),
   slider('arrivalDescendant','Ancestry outside identity in arrivals',0,50,.1,params.arrivalDescendant*100,'An additional share, beyond Jewish arrivals.',100),
   slider('fertilityHalfLife','Orthodox fertility-gap half-life',0,10,.5,params.fertilityHalfLife,'0 = fixed fertility; otherwise the excess halves over this many generations.')
  ].join('');
  updateOutputs();
 }
 function updateOutputs(){
  document.querySelectorAll('[data-key]').forEach(el=>{
    const key=el.dataset.key,scale=+el.dataset.scale,v=key==='backgroundFertility'?params.fertility[6]:key==='initialDescendants'?params.initialConnection-params.initialJewish:params[key];
    if(document.activeElement!==el)el.value=Number((v*scale).toFixed(6));
    const o=$('o-'+key);if(o)o.textContent=scale===100?fmt(v):key==='fertilityHalfLife'&&v===0?'Off':num(v,['generations','generationYears'].includes(key)?0:1);
  });
 }
 function render(){
  const row=result.rows[selected];$('generation').max=params.generations;$('generation').value=selected;$('generation-value').textContent=selected;
  $('a-value').textContent=fmt(row.connection);$('j-value').textContent=fmt(row.identity);
  $('clock').textContent=selected===0?`${params.referenceYear} · Starting population`:`${row.illustrativeYear} · Generation ${selected} · ${selected*params.generationYears} years after the start`;
  $('next').textContent=selected===params.generations?'Back to the start':`Next: ${params.referenceYear+(selected+1)*params.generationYears}`;
  $('baseline-status').textContent=S.isHistorical(params)?'2013 reference loaded; future rules are assumptions.':params.referenceYear===2013?'Custom starting values for 2013. Reload the reference to restore the linked inputs.':`Custom scenario beginning in ${params.referenceYear}. Changing the year does not supply historical population data; review the starting values below.`;
  $('starting-total').textContent=`Total roots + descendants: ${fmt(params.initialConnection)} = ${fmt(params.initialJewish)} Jewish + ${fmt(params.initialConnection-params.initialJewish)} outside ancestry.`;
  $('comparison-note').hidden=!$('compare').checked;
  $('comparison-description').textContent='Both models produce the same first generation. Later differences reflect '+(params.fertilityHalfLife>0?'changing group composition and the chosen fertility convergence.':'changing group composition.');
  $('background-note').hidden=params.fertility[5]===params.fertility[6];
  $('background-note').textContent=`Imported settings: outside-identity descendants use ${params.fertility[5]} children per pairing. The field above shows ${params.fertility[6]} for people with no counted connection; editing it sets both groups to that value.`;
  plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);composition();
  $('cohort-table').innerHTML=`<table><caption>Conditional shares of each generation (%)</caption><thead><tr><th>Generation / year</th><th>Roots + descendants</th><th>Jewish identity</th><th>Ancestry outside identity</th><th>Frozen: ancestry</th><th>Frozen: identity</th><th>Haredi share of Jews</th><th>Intermarriage among Jews</th></tr></thead><tbody>${result.rows.map(r=>`<tr class="${r.generation===selected?'selected':''}"><td>${r.generation} / ${r.illustrativeYear}</td>${['connection','identity','descendants','controlConnection','controlIdentity','harediShare','aggregateIntermarriage'].map(k=>`<td>${fmt(r[k],2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
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
  let s=`<title>${key==='connection'?'Jewish roots and descendants':'Jewish identity'}: conditional cohort scenarios</title><desc>${compare?'Solid: subgroups evolve. Dashed: frozen starting averages.':'Subgroups evolve under the stated assumptions.'} Exact values are in the results table.</desc>`;
  for(let k=0;k<5;k++){const v=yMax*k/4,yy=y(v);s+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="${LINE}" stroke-width=".7"/><text x="${L-8}" y="${yy+4}" text-anchor="end">${(100*v).toFixed(yMax<=.1?1:0)}%</text>`;}
  for(let g=0;g<=params.generations;g++)if(g%Math.max(1,Math.ceil(params.generations/Math.max(2,Math.floor(W/85))))===0||g===params.generations)s+=`<text x="${x(g)}" y="${H-15}" text-anchor="middle">${params.referenceYear+g*params.generationYears}</text>`;
  if(sensitivity){const upper=sensitivity.rows.map(r=>r[key][2]),lower=sensitivity.rows.map(r=>r[key][0]);const d=line(upper)+' '+lower.map((_,ii)=>{const i=lower.length-1-ii;return `L${x(i)},${y(lower[i])}`;}).join(' ')+' Z';s+=`<path d="${d}" fill="${color}" opacity=".12"/>`;}
  if(compare)s+=`<path d="${line(result.rows.map(r=>r[control]))}" stroke="${color}" fill="none" stroke-width="1.8" stroke-dasharray="6 4" opacity=".65"/>`;
  s+=`<path d="${line(result.rows.map(r=>r[key]))}" stroke="${color}" fill="none" stroke-width="2.6"/><line x1="${x(selected)}" x2="${x(selected)}" y1="${T}" y2="${T+h}" stroke="${INK}" stroke-width=".8" opacity=".5"/><circle cx="${x(selected)}" cy="${y(result.rows[selected][key])}" r="4" fill="${color}"/><text x="${W-R}" y="${H-1}" text-anchor="end" class="axis-title">Year (whole generations)</text>`;
  $(id).innerHTML=s;
 }
 function composition(){
  const W=Math.max(260,$('composition').clientWidth||980),H=204,L=15,R=12,T=12,B=25,n=params.generations+1,gap=W<500?6:12,bw=Math.min(100,(W-L-R-(n-1)*gap)/n),left=(W-(n*bw+(n-1)*gap))/2;
  $('composition').setAttribute('viewBox',`0 0 ${W} ${H}`);
  let s='<title>Composition inside Jewish identity</title><desc>Five-group stacked bars. The denominator is the Jewish-identifying population only.</desc>';
  result.full.forEach((x,g)=>{
   const total=x.slice(0,5).reduce((a,b)=>a+b,0),xx=left+g*(bw+gap);let y=H-B;
   if(total===0){s+=`<text x="${xx+bw/2}" y="90" text-anchor="middle">None</text>`;}
   else for(let i=0;i<5;i++){const hh=(H-T-B)*x[i]/total;y-=hh;s+=`<rect x="${xx}" y="${y}" width="${bw}" height="${hh}" fill="${COLORS[i]}"><title>${params.referenceYear+g*params.generationYears}, ${GROUP_LABELS[i]}: ${fmt(x[i]/total)}</title></rect>`;}
   if(g===selected)s+=`<rect x="${xx-3}" y="${T-3}" width="${bw+6}" height="${H-T-B+6}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
   if(g%Math.max(1,Math.ceil(params.generations/Math.max(2,Math.floor(W/85))))===0||g===params.generations)s+=`<text x="${xx+bw/2}" y="${H-6}" text-anchor="middle">${params.referenceYear+g*params.generationYears}</text>`;
  });
  $('composition').innerHTML=s;
  const row=result.rows[selected];$('composition-description').textContent=`${row.illustrativeYear}: Haredi ${fmt(row.harediShare)} of Jewish identity; all Orthodox ${fmt(row.orthodoxShare)}. Each bar sums to 100% of Jewish identity, not the whole population.`;
 }
 function cancelSweep(message){sweepToken++;$('run-sweep').disabled=false;$('cancel-sweep').disabled=true;if(message)status('sweep-status',message);}
 function rerun(){
  M.validate(params);stopPlaying();cancelSweep(sensitivity||$('run-sweep').disabled?'Settings changed; run sensitivity again.':undefined);sensitivity=null;$('sweep-table').innerHTML='';
  result=M.simulate(params);selected=Math.min(selected,params.generations);render();status('main-status','');
 }
 function stopPlaying(){playing=false;if(timer)clearTimeout(timer);timer=null;$('play').textContent='Play timeline';$('play').setAttribute('aria-pressed','false');}
 function nextGeneration(){selected=selected>=params.generations?0:selected+1;render();}
 function play(){
  if(playing){stopPlaying();return;}playing=true;if(selected>=params.generations)selected=0;$('play').textContent='Pause';$('play').setAttribute('aria-pressed','true');render();
  const tick=()=>{if(!playing)return;if(selected>=params.generations){stopPlaying();return;}selected++;render();timer=setTimeout(tick,2300);};timer=setTimeout(tick,2300);
 }
 function handleInput(e){
  const el=e.target;if(!el.dataset.key)return;
  if(el.type==='range'&&e.type!=='input'||el.type!=='range'&&e.type!=='change')return;
  const old=M.clone(params),v=Number(el.value)/(+el.dataset.scale||1),key=el.dataset.key;
  try{
   if(el.value.trim()===''||!Number.isFinite(v))throw Error('Enter a valid number');
   if(key==='referenceYear'&&!Number.isInteger(v))throw Error('Start year must be a whole year');
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
  try{if(el.value.trim()===''||!Number.isFinite(v))throw Error('Enter a valid number');
   if(key==='retention')M.setRetention(params,i,v);else params[key][i]=v;
   if(key==='jewishMix'){params.jewishMix[4]=1-params.jewishMix.slice(0,4).reduce((a,b)=>a+b,0);if(params.jewishMix[4]<0)throw Error('The first four initial subgroup shares must sum to at most 100%');$('remainder-mix').value=(params.jewishMix[4]*100).toFixed(2);}
   rerun();
  }catch(err){params=old;renderControls();status('main-status',err.message,true);}
 }
 function sensitivitySweep(){
  const draws=+$('draws').value,seed=+$('seed').value,width=+$('width').value;
  if(!Number.isInteger(draws)||draws<100||draws>5000||!Number.isInteger(seed)||seed<0||seed>4294967295||!Number.isFinite(width)||width<0||width>2){status('sweep-status','Use 100–5000 integer draws, a uint32 integer seed, and width 0–2.',true);return;}
  stopPlaying();cancelSweep();const token=++sweepToken,base=M.clone(params),rng=M.rng(seed),runs=[];sensitivity=null;$('sweep-table').innerHTML='';$('run-sweep').disabled=true;$('cancel-sweep').disabled=false;status('sweep-status',`Running 0 / ${draws} input scenarios…`);
  function batch(){if(token!==sweepToken)return;try{
   const stop=Math.min(draws,runs.length+25);while(runs.length<stop)runs.push(M.simulate(M.sampleParameters(base,rng,width)));
   status('sweep-status',`Running ${runs.length} / ${draws} input scenarios…`);
   if(runs.length<draws){setTimeout(batch,0);return;}
   sensitivity={seed,draws,width,baseParameters:base,rows:M.summarizeRuns(runs)};$('run-sweep').disabled=false;$('cancel-sweep').disabled=true;
   status('sweep-status',`${draws} scenarios complete. Shaded: middle 90% of the chosen input draws. Seed ${seed}. Not forecast probabilities.`);
   $('sweep-table').innerHTML=`<table><caption>Final cohort ${params.generations}; sensitivity quantiles (%)</caption><thead><tr><th>Quantity</th><th>5th</th><th>Median</th><th>95th</th></tr></thead><tbody>${[['connection','Roots + descendants'],['identity','Jewish identity'],['controlConnection','Frozen: roots + descendants'],['controlIdentity','Frozen: Jewish identity']].map(([k,n])=>`<tr><td>${n}</td>${sensitivity.rows.at(-1)[k].map(v=>`<td>${fmt(v,2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
   plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);
  }catch(err){cancelSweep();status('sweep-status',err.message,true);}}
  setTimeout(batch,0);
 }
 function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function exportJson(){download('ancestry-scenario.json',JSON.stringify({modelVersion:M.VERSION,setupVersion:S.VERSION,sourceReferences:S.REFERENCES,historicalStartingValues:S.isHistorical(params),warning:'Conditional successive-cohort scenarios; initial ancestry unvalidated; no all-age calendar forecast, DNA estimate, or halakhic status',parameters:params,results:result,sensitivity},null,2),'application/json');status('export-status','Exported parameters, model version, full outputs, and any completed sensitivity run.');}
 function exportCsv(){const keys=['generation','illustrativeYear','connection','identity','descendants','controlConnection','controlIdentity','harediShare','orthodoxShare','aggregateIntermarriage'];const text='# Conditional successive cohorts, not all-age calendar forecasts\n# Shares are fractions of 1, not percent\n# Model '+M.VERSION+'\n# Start year '+params.referenceYear+'; years per generation '+params.generationYears+'\n'+keys.join(',')+'\n'+result.rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n';download('ancestry-cohorts.csv',text,'text/csv');status('export-status','Exported cohort shares as fractions (0.08 means 8%). Export JSON too to preserve the inputs.');}
 async function share(){
  const state={v:M.VERSION,p:params,g:selected,c:$('compare').checked},hash=btoa(JSON.stringify(state));const url=location.href.split('#')[0]+'#sim='+encodeURIComponent(hash);
  try{await navigator.clipboard.writeText(url);status('export-status',location.protocol==='file:'?'Copied a local-file state link. It works with this file path; use an exported JSON to move between computers.':'Copied a link containing the complete scenario.');}
  catch(e){$('config-panel').hidden=false;$('config').value=url;$('config').focus();$('config').select();status('export-status','Clipboard unavailable. The full state link is selected in the editor; copy it manually.');}
 }
 function loadHash(){
  if(!location.hash.startsWith('#sim='))return;
  $('denomination-extension').open=true;
  try{const s=JSON.parse(atob(decodeURIComponent(location.hash.slice(5))));if(s.v!==M.VERSION)throw Error('Saved state uses a different model version');M.validate(s.p);params=M.clone(s.p);$('compare').checked=s.c===true;selected=Math.max(0,Math.min(params.generations,Number.isInteger(s.g)?s.g:0));}
  catch(e){$('export-settings').open=true;status('export-status','Could not load saved state: '+e.message,true);}
 }
 function bind(){
  $('sim-widget').addEventListener('input',handleInput);$('sim-widget').addEventListener('change',handleInput);
  $('starting-rows').addEventListener('change',handleGroup);$('parameter-rows').addEventListener('change',handleGroup);
  $('reset-baseline').addEventListener('click',()=>{const years=params.generationYears,steps=params.generations;params=S.historical();params.generationYears=years;params.generations=steps;selected=0;renderControls();rerun();});
  $('generation').addEventListener('input',()=>{stopPlaying();selected=+$('generation').value;render();});
  ['connection-plot','identity-plot'].forEach(id=>$(id).addEventListener('click',e=>{const r=$(id).getBoundingClientRect(),vw=$(id).viewBox.baseVal.width,xx=(e.clientX-r.left)/r.width*vw;selected=Math.round(Math.max(0,Math.min(1,(xx-44)/(vw-68)))*params.generations);stopPlaying();render();}));
  $('play').addEventListener('click',play);$('next').addEventListener('click',()=>{stopPlaying();nextGeneration();});
  $('compare').addEventListener('change',render);
  $('run-sweep').addEventListener('click',sensitivitySweep);$('cancel-sweep').addEventListener('click',()=>cancelSweep('Cancelled; incomplete runs are not reported.'));
  ['draws','seed','width'].forEach(id=>$(id).addEventListener('change',()=>{cancelSweep('Sensitivity settings changed; run again to update the bands.');sensitivity=null;$('sweep-table').innerHTML='';plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);}));
  $('export-json').addEventListener('click',exportJson);$('export-csv').addEventListener('click',exportCsv);$('share').addEventListener('click',share);
  $('show-config').addEventListener('click',()=>{$('config-panel').hidden=false;$('config').value=JSON.stringify(params,null,2);status('config-status','');});$('close-config').addEventListener('click',()=>{$('config-panel').hidden=true;});
  $('apply-config').addEventListener('click',()=>{try{const s=JSON.parse($('config').value),p=s.parameters||s;M.validate(p);params=M.clone(p);renderControls();rerun();status('config-status','Valid settings applied.');}catch(e){status('config-status',e.message,true);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlaying();});
  window.addEventListener('resize',()=>{if(result){plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);composition();}});
  $('denomination-extension').addEventListener('toggle',()=>{if($('denomination-extension').open&&result)render();else stopPlaying();});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#sim=')){loadHash();renderControls();rerun();}});
 }
 function toyInit(){
  $('toy-widget').innerHTML=`<div class="toy-inner"><div class="kicker">Equal fertility, no arrivals</div><h3>Random-pairing example</h3><label class="control" for="toy-start"><span class="labelrow"><span>Starting ancestry share</span><output id="toy-start-label">2%</output></span><input id="toy-start" type="range" min=".1" max="10" step=".1" value="2"></label><div class="scrub"><label for="toy-g">Generations</label><input id="toy-g" type="range" min="0" max="8" step="1" value="0"><output id="toy-g-label">0</output></div><svg id="toy-dots" class="toy-dots" viewBox="0 0 640 204" role="img" aria-label="Any-ancestry share in a random-pairing toy model"></svg><div class="toy-footer"><button id="toy-play">Play generations</button><span>Any ancestry from the starting group: <b id="toy-any"></b><br><span class="note">Mean contribution from the starting group: <b id="toy-mean"></b> (unchanged)</span></span></div><p class="note">Each square is 0.1 percentage points; squares are a display of the distribution, not individual people. The colored area is rounded to the nearest square. Exact values use the equation above.</p><div id="toy-steps" class="mini-results"></div></div>`;
  let timer=null,playing=false;
  function draw(){const p=+$('toy-start').value/100,g=+$('toy-g').value,a=M.toy(p,g);$('toy-start-label').textContent=fmt(p);$('toy-g-label').textContent=g;$('toy-any').textContent=fmt(a,2);$('toy-mean').textContent=fmt(p,2);let s=`<title>${fmt(a,2)} with any ancestry from the starting group after ${g} generations; mean contribution ${fmt(p,2)}</title>`;const n=Math.round(a*1000);for(let i=0;i<1000;i++){const x=(i%50)*12.5+9,y=Math.floor(i/50)*9.8+5;s+=`<rect x="${x}" y="${y}" width="8.5" height="6" rx="1" fill="${i<n?A:'#e6e7e4'}"/>`;}if(!$('toy-dots').querySelector('rect'))$('toy-dots').innerHTML=s;else{$('toy-dots').querySelector('title').textContent=`${fmt(a,2)} with any ancestry after ${g} generations; mean contribution ${fmt(p,2)}`;$('toy-dots').querySelectorAll('rect').forEach((rect,i)=>{rect.style.transitionDelay=reduced.matches?'0ms':`${(i%50)*5}ms`;rect.setAttribute('fill',i<n?A:'#e6e7e4');});}$('toy-steps').innerHTML=Array.from({length:7},(_,i)=>`<span>Cohort ${i}<b>${fmt(M.toy(p,i),1)}</b></span>`).join('');}
  function stop(){playing=false;clearTimeout(timer);$('toy-play').textContent='Play generations';}
  function tick(){if(!playing)return;let g=+$('toy-g').value;if(g>=8){stop();return;}$('toy-g').value=g+1;draw();timer=setTimeout(tick,900);}
  $('toy-play').addEventListener('click',()=>{if(playing){stop();return;}playing=true;if(+$('toy-g').value>=8)$('toy-g').value=0;$('toy-play').textContent='Pause';draw();timer=setTimeout(tick,900);});
  ['toy-start','toy-g'].forEach(id=>$(id).addEventListener('input',()=>{stop();draw();}));document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});draw();
 }
 scaffold();document.querySelectorAll('.table-scroll').forEach(el=>{el.tabIndex=0;el.setAttribute('role','region');if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',el.id==='cohort-table'?'Full cohort results':'Model assumptions or results table');});loadHash();renderControls();bind();result=M.simulate(params);render();toyInit();
 // Deliberate development surface for browser smoke tests and local agent audits.
 window.AncestryDemo={getState:()=>({parameters:M.clone(params),result:M.clone(result),selected,sensitivity:M.clone(sensitivity)}),setScenario:p=>{M.validate(p);params=M.clone(p);renderControls();rerun();}};
})();
