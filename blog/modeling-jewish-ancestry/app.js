/* Browser-only presentation. All calculations live in model.js. */
(function(){
 'use strict';
 const M=window.AncestryModel;
 if(!M)return;
 const $=id=>document.getElementById(id), fmt=(v,d=1)=>(100*v).toFixed(d)+'%',num=(v,d=1)=>Number(v).toFixed(d);
 const COLORS=['#725c96','#3d7291','#438678','#b15f74','#697491','#9d9d97','#deded7'];
 const INK='#232526',MUTED='#62676b',LINE='#d9dcdf',J='#335b82',A='#b86b26';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let params=M.defaults(),result,selected=4,sensitivity=null,sweepToken=0,playing=false,timer=null,animFrame=null,animStart=0,sample=null;
 let animationSeed=20260924;
 const presetFns={
   roots:p=>p,
   legacy:p=>{p.initialConnection=.08;return p;},
   closed:p=>{p.arrivalShare=0;return p;},
   stop:p=>{p.initialConnection=.08;p.intermarriage.fill(0);return p;},
   equal:p=>{p.fertility.fill(2);return p;},
   converge:p=>{p.fertilityHalfLife=3;return p;},
   exit:p=>{M.setRetention(p,0,.70);return p;}
 };
 function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function status(id,msg,error=false){$(id).textContent=msg;$(id).classList.toggle('error',error);}
 function slider(key,title,min,max,step,value,explanation,scale=1){
   return `<label class="control" for="p-${key}"><span class="labelrow"><span>${title}</span><output id="o-${key}"></output></span><input id="p-${key}" data-key="${key}" data-scale="${scale}" type="range" min="${Math.min(min,value)}" max="${Math.max(max,value)}" step="${step}" value="${value}"><span class="note">${explanation}</span></label>`;
 }
 function scaffold(){
  $('sim-widget').innerHTML=`
  <div class="widget-head"><div class="kicker">experiment 02 / subgroup dynamics</div><h2>jewish identity and ancestry</h2><p class="note">change the inputs to calculate successive cohorts. these settings have not been fitted to the u.s. population. start by comparing the solid and dashed lines at cohort 4. presets reset the parameters; calculations run locally.</p></div>
  <div class="presets" role="group" aria-label="scenario presets">
   <button data-preset="roots" aria-pressed="true">start with jewish roots only</button><button data-preset="legacy" aria-pressed="false">start with 8% roots + descendants</button></div><details class="more-presets"><summary>more scenarios</summary><div class="presets"><button data-preset="closed" aria-pressed="false">no arrivals</button><button data-preset="stop" aria-pressed="false">no new intermarriage; start at 8%</button><button data-preset="equal" aria-pressed="false">equal fertility</button><button data-preset="converge" aria-pressed="false">shrinking orthodox fertility gap</button><button data-preset="exit" aria-pressed="false">lower haredi retention</button>
  </div></details>
  <div class="sim-layout"><div class="controls" id="primary-controls"></div><div class="plots">
    <div class="line-legend"><span>subgroups evolve</span><span class="dashed">initial averages frozen</span></div><p class="note">each chart uses its own y-axis scale.</p>
    <div class="plotwrap"><p class="plot-title ancestry">jewish roots + their descendants</p><svg id="connection-plot" class="plot" viewBox="0 0 680 214" role="img" aria-label="share of successive cohorts with a modeled jewish connection"></svg></div>
    <div class="plotwrap"><p class="plot-title">jewish-identifying</p><svg id="identity-plot" class="plot" viewBox="0 0 680 214" role="img" aria-label="jewish-identifying share of successive cohorts"></svg></div>
    <div class="scrub"><label for="generation">inspect cohort</label><input type="range" min="0" max="6" step="1" value="0" id="generation"><output id="generation-value">0</output></div>
    <div class="metric-row"><div class="metric"><span class="value" id="a-value"></span><span class="label">roots + descendants</span></div><div class="metric"><span class="value" id="j-value"></span><span class="label">jewish-identifying</span></div><div class="metric"><span class="value" id="m-value"></span><span class="label">aggregate intermarriage*</span></div></div>
    <p class="note">*among this cohort's modeled jewish parents. the two models match at cohort 1 by construction.</p>
    <p class="note clock" id="clock"></p><p class="status" id="main-status" role="status" aria-live="polite"></p>
  </div></div>
  <div class="section"><h3>subgroup shares</h3><p class="note">each bar shows the composition of that cohort's jewish-identifying population and sums to 100%.</p><svg id="composition" class="composition" viewBox="0 0 980 204" role="img" aria-label="denominational composition within jewish identity"></svg><div class="group-legend" id="group-legend"></div><p class="note" id="composition-description"></p></div>
  <div class="section"><h3>parent and child samples</h3><p class="note explain">fill shows identity; the <span class="ring-key"></span> ring marks a jewish root or descendant. each step samples new parent–child outcomes. it does not follow the same families across generations. arrivals have no simulated parents.</p>
   <div class="animation-controls"><button id="play" class="primary" aria-pressed="false">play generations</button><button id="next">next cohort</button><button id="replay">resample this cohort</button><label for="birth-filter">sample</label><select id="birth-filter"><option value="all">all next-cohort members</option><option value="mixed" selected>one jewish-identifying parent</option><option value="descendants">non-jewish parents with ancestry</option><option value="haredi">two haredi parents</option></select></div>
   <p class="sample-mass" id="sample-label"></p><canvas id="birth-canvas" class="birth-canvas" role="img" aria-label="sampled parent and child identities; equivalent descriptions are available in the sample details below"></canvas>
   <details><summary>read the sampled outcomes</summary><div id="sample-details"></div></details>
  </div>
  <div class="section"><details id="group-settings"><summary>edit the subgroup assumptions</summary><p class="note">these are editable assumptions. “stays in group” refers to children of two parents in the same group. children who leave can join another jewish group or stop identifying as jewish.</p><div class="table-scroll"><table class="parameter-table"><thead><tr><th>subgroup</th><th>initial share<br>of jews (%)</th><th>offspring per<br>same-group pairing</th><th>non-jewish<br>partner (%)</th><th>stays in<br>same group (%)</th><th>jewish identity with<br>one jewish parent (%)</th><th>reserve own<br>subgroup (%)</th></tr></thead><tbody id="parameter-rows"></tbody></table></div><p class="note">the last initial share is the remainder. subgroup reservation applies within the jewish in-marriage pool, not to all pairings. changing initial jewish composition does not change the separately specified arrival composition.</p><div class="advanced-grid" id="advanced-controls"></div></details></div>
  <div class="section"><details><summary>full cohort table</summary><div class="table-scroll" id="cohort-table"></div><p class="note">the table reports cohort shares, with within-jewish shares labeled separately. it does not calculate absolute counts or the population of all ages in a future year.</p></details></div>
  <div class="section"><details id="sensitivity-settings"><summary>sensitivity to the inputs</summary><p class="note sweep-note">sample inputs around the settings above. shading shows the middle 90% of sampled outcomes; it is not a forecast confidence interval. the solid line continues to show your selected scenario.</p><div class="toolbar"><label for="draws">draws <input id="draws" type="number" min="100" max="5000" step="100" value="500"></label><label for="seed">seed <input id="seed" class="seed" type="number" min="0" max="4294967295" step="1" value="20260924"></label><label for="width">range width <input id="width" type="number" min="0" max="2" step=".25" value="1"></label><button id="run-sweep">run sensitivity</button><button id="cancel-sweep" disabled>cancel</button></div><p class="status" id="sweep-status" role="status" aria-live="polite">no sensitivity results yet.</p><div class="table-scroll" id="sweep-table"></div><details><summary>sampling ranges</summary><p class="note">independent uniform intervals, clipped to valid values: each fertility input ±20%; intermarriage half-ranges: haredi 1 percentage point, other orthodox 3.5 points, conservative 15 points, reform 13 points, other jewish 10 points; same-group retention ±8 points; mixed-parent jewish identity retention ±15 points; ancestry clustering ±15 points; arrival cohort share ±5 points; jewish share of arrivals ±1 point; initial roots-plus-descendants share ±2 points, bounded below by initial jewish identity. width multiplies these half-ranges; zero reproduces the selected scenario. fertility in the two non-jewish groups uses a shared multiplicative factor. mixes, subgroup reservation, convergence, and other transmission destinations stay fixed. the destinations among leavers are rescaled when retention changes. correlations and interval widths are modeling choices.</p></details></details></div>
  <div class="section"><details id="export-settings"><summary>export and import</summary><div class="toolbar"><button id="export-json">export model + results</button><button id="export-csv">export cohort csv</button><button id="share">copy state link</button><button id="show-config">edit / import full json</button></div><p class="status" id="export-status" role="status" aria-live="polite"></p><div id="config-panel" hidden><label for="config" class="note">complete parameters, including the 5 × 7 identity transition matrix</label><textarea id="config" spellcheck="false"></textarea><div class="toolbar"><button id="apply-config">validate and apply</button><button id="close-config">close editor</button></div><p id="config-status" class="status configerror" role="status"></p></div><p class="note">model ${M.VERSION}. charts use expected values; the animation samples outcomes with a separate seed.</p></details></div>`;
  $('group-legend').innerHTML=M.SHORT.slice(0,5).map((n,i)=>`<span><i class="swatch" style="--swatch:${COLORS[i]}"></i>${n}</span>`).join('');
 }
 function renderControls(){
  $('primary-controls').innerHTML=[
    slider('initialConnection','initial roots + descendants',params.initialJewish*100,50,.1,params.initialConnection*100,'includes jewish-identifying roots and any descendants outside jewish identity. this is an assumed starting share.',100),
    slider('clustering','ancestry clustering',0,100,1,params.clustering*100,'among remaining non-jewish parents: 0 = random pairing; 100 = pair only within the same ancestry category.',100),
    slider('arrivalShare','arrivals in each new cohort',0,40,1,params.arrivalShare*100,'share added through arrivals to each new cohort. not an annual immigration rate or a foreign-born population share.',100),
    slider('generations','whole generations',1,16,1,params.generations,'each step replaces the parent cohort with its descendants and arrivals.'),
    '<div class="assumption">initial jewish identity: '+fmt(params.initialJewish)+'. the default counts descendants from this starting cohort and sets pre-existing outside ancestry to zero.</div>'
  ].join('');
  $('parameter-rows').innerHTML=M.SHORT.slice(0,5).map((n,i)=>`<tr><td><i class="swatch" style="--swatch:${COLORS[i]}"></i>${n}</td>${[
    [params.jewishMix[i]*100,'jewishMix',0,100,.1,100],
    [params.fertility[i],'fertility',.1,15,.1,1],
    [params.intermarriage[i]*100,'intermarriage',0,100,.1,100],
    [params.sameGroupTransitions[i][i]*100,'retention',0,100,.1,100],
    [params.mixedRetention[i]*100,'mixedRetention',0,100,.1,100],
    [params.selfPair[i]*100,'selfPair',0,100,.1,100]
  ].map(([v,key,min,max,step,scale],c)=>`<td><input type="number" aria-label="${n}: ${['initial share among jews','offspring per same-group pairing','non-jewish partner percent','same-group retention percent','mixed-parent jewish identity percent','own-subgroup reservation percent'][c]}" data-group="${i}" data-field="${key}" data-scale="${scale}" value="${Number(v.toFixed(4))}" min="${min}" max="${max}" step="${step}" ${i===4&&key==='jewishMix'?'readonly id="remainder-mix"':''}></td>`).join('')}</tr>`).join('');
  $('advanced-controls').innerHTML=[
    slider('backgroundFertility','non-jewish offspring per pairing',.5,5,.1,params.fertility[6],'applies to both non-jewish groups: descendants and people with no modeled connection.'),
    slider('mixedFertility','mixed-pair fertility multiplier',0,100,1,params.mixedFertility*100,'multiplies geometric-mean fertility for jewish/non-jewish pairings.',100),
    slider('arrivalJewish','jewish share of arrivals',0,25,.1,params.arrivalJewish*100,'the arrival composition is an assumption.',100),
    slider('arrivalDescendant','non-jewish descendants in arrivals',0,50,.1,params.arrivalDescendant*100,'older imported ancestry, outside jewish identity.',100),
    slider('fertilityHalfLife','orthodox fertility-gap half-life',0,10,.5,params.fertilityHalfLife,'0 = no convergence; otherwise half-life in reproductive steps.'),
    slider('generationYears','years per generation',20,35,1,params.generationYears,'changes the illustrative dates only. there is no age structure in this model.')
  ].join('');
  updateOutputs();
 }
 function updateOutputs(){
  document.querySelectorAll('[data-key]').forEach(el=>{
    const key=el.dataset.key,scale=+el.dataset.scale,v=key==='backgroundFertility'?params.fertility[6]:params[key];
    if(document.activeElement!==el)el.value=v*scale;
    const o=$('o-'+key);if(o)o.textContent=scale===100?fmt(v):key==='fertilityHalfLife'&&v===0?'off':num(v,['generations','generationYears'].includes(key)?0:1);
  });
 }
 function render(){
  const row=result.rows[selected];$('generation').max=params.generations;$('generation').value=selected;$('generation-value').textContent=selected;
  $('a-value').textContent=fmt(row.connection);$('j-value').textContent=fmt(row.identity);$('m-value').textContent=fmt(row.aggregateIntermarriage);
  $('clock').textContent=`cohort ${selected}: ${selected*params.generationYears} illustrative years after the reference cohort (${row.illustrativeYear}). this is not the population alive in that year.`;
  plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);composition();
  $('cohort-table').innerHTML=`<table><caption>shares of each successive cohort (%)</caption><thead><tr><th>cohort</th><th>roots + descendants</th><th>jewish identity</th><th>descendants outside identity</th><th>frozen: connection</th><th>frozen: identity</th><th>haredi share of jews</th><th>intermarriage among jews</th></tr></thead><tbody>${result.rows.map(r=>`<tr class="${r.generation===selected?'selected':''}"><td>${r.generation}</td>${['connection','identity','descendants','controlConnection','controlIdentity','harediShare','aggregateIntermarriage'].map(k=>`<td>${fmt(r[k],2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  updateOutputs();updateSamples();
 }
 function plot(id,key,control,color){
  const W=Math.max(260,$(id).clientWidth||680),H=214,L=48,R=12,T=14,B=34,w=W-L-R,h=H-T-B;
  $(id).setAttribute('viewBox',`0 0 ${W} ${H}`);
  let maximum=Math.max(.01,...result.rows.flatMap(r=>[r[key],r[control]]));
  if(sensitivity)maximum=Math.max(maximum,...sensitivity.rows.map(r=>r[key][2]));
  const yMax=Math.min(1,Math.ceil(maximum*1.08*20)/20||.05),x=g=>L+g/params.generations*w,y=v=>T+h*(1-v/yMax);
  const line=arr=>arr.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  let s=`<title>${key==='connection'?'jewish roots and descendants':'jewish identity'}: conditional cohort scenarios</title><desc>solid is the subgroup model; dashed is the initially matched frozen-average control. exact values are in the cohort table.</desc>`;
  for(let k=0;k<5;k++){const v=yMax*k/4,yy=y(v);s+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="${LINE}" stroke-width=".7"/><text x="${L-8}" y="${yy+4}" text-anchor="end">${(100*v).toFixed(yMax<=.1?1:0)}%</text>`;}
  for(let g=0;g<=params.generations;g++)if(g%Math.max(1,Math.ceil(params.generations/8))===0||g===params.generations)s+=`<text x="${x(g)}" y="${H-15}" text-anchor="middle">${g}</text>`;
  if(sensitivity){const upper=sensitivity.rows.map(r=>r[key][2]),lower=sensitivity.rows.map(r=>r[key][0]);const d=line(upper)+' '+lower.map((_,ii)=>{const i=lower.length-1-ii;return `L${x(i)},${y(lower[i])}`;}).join(' ')+' Z';s+=`<path d="${d}" fill="${color}" opacity=".12"/>`;}
  s+=`<path d="${line(result.rows.map(r=>r[control]))}" stroke="${color}" fill="none" stroke-width="1.8" stroke-dasharray="6 4" opacity=".65"/><path d="${line(result.rows.map(r=>r[key]))}" stroke="${color}" fill="none" stroke-width="2.6"/><line x1="${x(selected)}" x2="${x(selected)}" y1="${T}" y2="${T+h}" stroke="${INK}" stroke-width=".8" opacity=".5"/><circle cx="${x(selected)}" cy="${y(result.rows[selected][key])}" r="4" fill="${color}"/><text x="${W-R}" y="${H-1}" text-anchor="end" class="axis-title">generations elapsed</text>`;
  $(id).innerHTML=s;
 }
 function composition(){
  const W=Math.max(260,$('composition').clientWidth||980),H=204,L=15,R=12,T=12,B=25,n=params.generations+1,gap=W<500?6:12,bw=Math.min(100,(W-L-R-(n-1)*gap)/n),left=(W-(n*bw+(n-1)*gap))/2;
  $('composition').setAttribute('viewBox',`0 0 ${W} ${H}`);
  let s='<title>composition inside jewish identity</title><desc>five-group stacked bars. the denominator is the jewish-identifying population only.</desc>';
  result.full.forEach((x,g)=>{
   const total=x.slice(0,5).reduce((a,b)=>a+b,0),xx=left+g*(bw+gap);let y=H-B;
   if(total===0){s+=`<text x="${xx+bw/2}" y="90" text-anchor="middle">none</text>`;}
   else for(let i=0;i<5;i++){const hh=(H-T-B)*x[i]/total;y-=hh;s+=`<rect x="${xx}" y="${y}" width="${bw}" height="${hh}" fill="${COLORS[i]}"><title>cohort ${g}, ${M.SHORT[i]}: ${fmt(x[i]/total)}</title></rect>`;}
   if(g===selected)s+=`<rect x="${xx-3}" y="${T-3}" width="${bw+6}" height="${H-T-B+6}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
   if(g%Math.max(1,Math.ceil(params.generations/8))===0||g===params.generations||g===selected)s+=`<text x="${xx+bw/2}" y="${H-6}" text-anchor="middle">${g}</text>`;
  });
  $('composition').innerHTML=s;
  const row=result.rows[selected];$('composition-description').textContent=`cohort ${selected}: haredi ${fmt(row.harediShare)} of jewish identity; all orthodox ${fmt(row.orthodoxShare)}. these are modeled composition changes, not forecasts.`;
 }
 function updateSamples(){
  const g=Math.min(selected,params.generations-1),filter=$('birth-filter').value;
  sample=M.sampleBirths(result,g,(animationSeed+g*997)>>>0,12,filter);
  $('sample-label').textContent=`parents: cohort ${g} → next adult cohort ${g+1}. ${filter==='all'?'unconditional sample.':`conditional sample covering ${fmt(sample.mass,3)} of the next cohort.`} 12 draws; chart values use exact expected shares.`;
  $('sample-details').innerHTML=sample.events.length?`<table><thead><tr><th>example</th><th>parents / source</th><th>next-cohort identity</th><th>connection flag</th></tr></thead><tbody>${sample.events.map((e,i)=>`<tr><td>${i+1}</td><td>${e.arrival?'arrival (parents not modeled)':escape(M.SHORT[e.i]+' + '+M.SHORT[e.j])}</td><td>${escape(M.SHORT[e.k])}</td><td>${e.k<6?'root or descendant':'no modeled connection'}</td></tr>`).join('')}</tbody></table>`:'<p class="note">this outcome has zero probability under these settings. there are no examples to sample.</p>';
  animStart=performance.now();if(animFrame)cancelAnimationFrame(animFrame);animateBirths(animStart);
 }
 function animateBirths(now){
  const t=reduced.matches?1:Math.min(1,(now-animStart)/1600);drawBirths(t);
  if(t<1&&!document.hidden)animFrame=requestAnimationFrame(animateBirths);else animFrame=null;
 }
 function drawBirths(t){
  const canvas=$('birth-canvas'),width=canvas.clientWidth;if(width<1)return;
  const cols=width<650?2:3,rows=Math.ceil(Math.max(1,sample.events.length)/cols),cellH=128,height=rows*cellH+12,dpr=window.devicePixelRatio||1;
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.height=height+'px';}
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);c.textAlign='center';
  if(!sample.events.length){c.fillStyle=MUTED;c.font='13px system-ui';c.fillText('no outcomes of this type under these assumptions',width/2,70);return;}
  const cellW=width/cols;
  function dot(x,y,k,alpha=1){c.globalAlpha=alpha;c.beginPath();c.arc(x,y,8,0,Math.PI*2);c.fillStyle=COLORS[k];c.fill();if(k<6){c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.strokeStyle=A;c.lineWidth=1.8;c.stroke();}c.globalAlpha=1;}
  function path(x1,y1,x2,y2,k){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=LINE;c.lineWidth=1.4;c.stroke();const u=Math.min(1,t/.8);if(u<1){c.beginPath();c.arc(x1+(x2-x1)*u,y1+(y2-y1)*u,2.5,0,Math.PI*2);c.fillStyle=k<6?A:MUTED;c.fill();}}
  sample.events.forEach((e,i)=>{
   const ox=(i%cols)*cellW,oy=Math.floor(i/cols)*cellH+8,x1=ox+cellW*.24,x2=ox+cellW*.76,y1=oy+28,cx=ox+cellW*.5,cy=oy+82;
   c.strokeStyle=LINE;c.lineWidth=.5;c.strokeRect(ox+7,oy+3,cellW-14,cellH-9);
   c.fillStyle=MUTED;c.font='10px system-ui';c.textAlign='left';c.fillText(String(i+1),ox+14,oy+15);c.textAlign='center';
   if(e.arrival){c.fillText('arrival; no simulated parents',cx,oy+35);c.beginPath();c.setLineDash([3,3]);c.moveTo(cx,oy+42);c.lineTo(cx,cy-15);c.stroke();c.setLineDash([]);}
   else {path(x1,y1+12,cx,cy-12,e.i);path(x2,y1+12,cx,cy-12,e.j);dot(x1,y1,e.i);dot(x2,y1,e.j);c.fillStyle=MUTED;c.font=(cellW<190?'9':'10')+'px system-ui';c.fillText(M.SHORT[e.i],x1,oy+53,cellW*.44);c.fillText(M.SHORT[e.j],x2,oy+53,cellW*.44);}
   dot(cx,cy,e.k,.15+.85*Math.min(1,t/.85));c.fillStyle=INK;c.font='11px system-ui';c.fillText(M.SHORT[e.k],cx,oy+107,cellW-26);
  });
 }
 function markCustom(){document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));}
 function cancelSweep(message){sweepToken++;$('run-sweep').disabled=false;$('cancel-sweep').disabled=true;if(message)status('sweep-status',message);}
 function rerun(){
  M.validate(params);stopPlaying();cancelSweep(sensitivity||$('run-sweep').disabled?'settings changed; run sensitivity again.':undefined);sensitivity=null;$('sweep-table').innerHTML='';
  result=M.simulate(params);selected=Math.min(selected,params.generations);render();status('main-status','');
 }
 function stopPlaying(){playing=false;if(timer)clearTimeout(timer);timer=null;$('play').textContent='play generations';$('play').setAttribute('aria-pressed','false');}
 function nextGeneration(){selected=selected>=params.generations?0:selected+1;render();}
 function play(){
  if(playing){stopPlaying();return;}playing=true;if(selected>=params.generations)selected=0;$('play').textContent='pause';$('play').setAttribute('aria-pressed','true');render();
  const tick=()=>{if(!playing)return;if(selected>=params.generations){stopPlaying();return;}selected++;render();timer=setTimeout(tick,2300);};timer=setTimeout(tick,2300);
 }
 function handleInput(e){
  const el=e.target;if(el.dataset.key){
   const old=M.clone(params),v=Number(el.value)/(+el.dataset.scale||1),key=el.dataset.key;
   if(key==='backgroundFertility')params.fertility[5]=params.fertility[6]=v;else params[key]=v;
   try{rerun();markCustom();}catch(err){params=old;renderControls();status('main-status',err.message,true);}
  }
 }
 function handleGroup(e){
  const el=e.target;if(el.dataset.field===undefined)return;
  const old=M.clone(params),i=+el.dataset.group,key=el.dataset.field,v=Number(el.value)/(+el.dataset.scale||1);
  try{if(el.value.trim()===''||!Number.isFinite(v))throw Error('enter a valid number');
   if(key==='retention')M.setRetention(params,i,v);else params[key][i]=v;
   if(key==='jewishMix'){params.jewishMix[4]=1-params.jewishMix.slice(0,4).reduce((a,b)=>a+b,0);if(params.jewishMix[4]<0)throw Error('the first four initial subgroup shares must sum to at most 100%');$('remainder-mix').value=(params.jewishMix[4]*100).toFixed(2);}
   rerun();markCustom();
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
 function exportJson(){download('ancestry-scenario.json',JSON.stringify({modelVersion:M.VERSION,warning:'conditional successive-cohort scenarios; initial ancestry unvalidated; no all-age calendar forecast, DNA estimate, or halakhic status',parameters:params,results:result,sensitivity},null,2),'application/json');status('export-status','exported parameters, model version, full outputs, and any completed sensitivity run.');}
 function exportCsv(){const keys=['generation','connection','identity','descendants','controlConnection','controlIdentity','harediShare','orthodoxShare','aggregateIntermarriage'];const text='# conditional successive cohorts, not all-age calendar forecasts\n# shares are fractions of 1, not percent\n# model '+M.VERSION+'\n'+keys.join(',')+'\n'+result.rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n';download('ancestry-cohorts.csv',text,'text/csv');status('export-status','exported cohort shares as fractions (0.08 means 8%). export json too to preserve the inputs.');}
 async function share(){
  const state={v:M.VERSION,p:params,g:selected},hash=btoa(JSON.stringify(state));const url=location.href.split('#')[0]+'#sim='+encodeURIComponent(hash);
  try{await navigator.clipboard.writeText(url);status('export-status',location.protocol==='file:'?'copied a local-file state link. it works with this file path; use an exported json to move between computers.':'copied a link containing the complete scenario.');}
  catch(e){$('config-panel').hidden=false;$('config').value=url;$('config').focus();$('config').select();status('export-status','clipboard unavailable. the full state link is selected in the editor; copy it manually.');}
 }
 function loadHash(){
  if(!location.hash.startsWith('#sim='))return;
  try{const s=JSON.parse(atob(decodeURIComponent(location.hash.slice(5))));if(s.v!==M.VERSION)throw Error('saved state uses a different model version');M.validate(s.p);params=M.clone(s.p);selected=Math.max(0,Math.min(params.generations,Number.isInteger(s.g)?s.g:0));markCustom();}
  catch(e){$('export-settings').open=true;status('export-status','could not load saved state: '+e.message,true);}
 }
 function bind(){
  $('sim-widget').addEventListener('input',handleInput);$('parameter-rows').addEventListener('change',handleGroup);
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{params=presetFns[b.dataset.preset](M.defaults());selected=4;renderControls();rerun();document.querySelectorAll('[data-preset]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));}));
  $('generation').addEventListener('input',()=>{stopPlaying();selected=+$('generation').value;render();});
  ['connection-plot','identity-plot'].forEach(id=>$(id).addEventListener('click',e=>{const r=$(id).getBoundingClientRect(),vw=$(id).viewBox.baseVal.width,xx=(e.clientX-r.left)/r.width*vw;selected=Math.round(Math.max(0,Math.min(1,(xx-48)/(vw-60)))*params.generations);stopPlaying();render();}));
  $('play').addEventListener('click',play);$('next').addEventListener('click',()=>{stopPlaying();nextGeneration();});$('replay').addEventListener('click',()=>{animationSeed=(animationSeed+1)>>>0;updateSamples();});$('birth-filter').addEventListener('change',updateSamples);
  $('run-sweep').addEventListener('click',sensitivitySweep);$('cancel-sweep').addEventListener('click',()=>cancelSweep('cancelled; incomplete runs are not reported.'));
  ['draws','seed','width'].forEach(id=>$(id).addEventListener('change',()=>{cancelSweep('sensitivity settings changed; run again to update the bands.');sensitivity=null;$('sweep-table').innerHTML='';plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);}));
  $('export-json').addEventListener('click',exportJson);$('export-csv').addEventListener('click',exportCsv);$('share').addEventListener('click',share);
  $('show-config').addEventListener('click',()=>{$('config-panel').hidden=false;$('config').value=JSON.stringify(params,null,2);status('config-status','');});$('close-config').addEventListener('click',()=>{$('config-panel').hidden=true;});
  $('apply-config').addEventListener('click',()=>{try{const s=JSON.parse($('config').value),p=s.parameters||s;M.validate(p);params=M.clone(p);renderControls();rerun();markCustom();status('config-status','valid settings applied.');}catch(e){status('config-status',e.message,true);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPlaying();if(animFrame)cancelAnimationFrame(animFrame);}else drawBirths(1);});
  if(window.ResizeObserver)new ResizeObserver(()=>{if(sample)drawBirths(1);}).observe($('birth-canvas'));
  window.addEventListener('resize',()=>{if(result){plot('connection-plot','connection','controlConnection',A);plot('identity-plot','identity','controlIdentity',J);composition();}});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#sim=')){loadHash();renderControls();rerun();}});
 }
 function toyInit(){
  $('toy-widget').innerHTML=`<div class="toy-inner"><div class="kicker">experiment 01 / equal fertility, no arrivals</div><h3>random-pairing example</h3><label class="control" for="toy-start"><span class="labelrow"><span>starting ancestry share</span><output id="toy-start-label">2%</output></span><input id="toy-start" type="range" min=".1" max="10" step=".1" value="2"></label><div class="scrub"><label for="toy-g">generations</label><input id="toy-g" type="range" min="0" max="8" step="1" value="0"><output id="toy-g-label">0</output></div><svg id="toy-dots" class="toy-dots" viewBox="0 0 640 204" role="img" aria-label="any-ancestry share in a random-pairing toy model"></svg><div class="toy-footer"><button id="toy-play">play generations</button><span>any ancestry from the starting group: <b id="toy-any"></b><br><span class="note">mean contribution from the starting group: <b id="toy-mean"></b> (unchanged)</span></span></div><p class="note">each square is 0.1 percentage points; squares are a display of the distribution, not individual people. the colored area is rounded to the nearest square. exact values use the equation above.</p><div id="toy-steps" class="mini-results"></div></div>`;
  let timer=null,playing=false;
  function draw(){const p=+$('toy-start').value/100,g=+$('toy-g').value,a=M.toy(p,g);$('toy-start-label').textContent=fmt(p);$('toy-g-label').textContent=g;$('toy-any').textContent=fmt(a,2);$('toy-mean').textContent=fmt(p,2);let s=`<title>${fmt(a,2)} with any ancestry from the starting group after ${g} generations; mean contribution ${fmt(p,2)}</title>`;const n=Math.round(a*1000);for(let i=0;i<1000;i++){const x=(i%50)*12.5+9,y=Math.floor(i/50)*9.8+5;s+=`<rect x="${x}" y="${y}" width="8.5" height="6" rx="1" fill="${i<n?A:'#e6e7e4'}"/>`;}if(!$('toy-dots').querySelector('rect'))$('toy-dots').innerHTML=s;else{$('toy-dots').querySelector('title').textContent=`${fmt(a,2)} with any ancestry after ${g} generations; mean contribution ${fmt(p,2)}`;$('toy-dots').querySelectorAll('rect').forEach((rect,i)=>{rect.style.transitionDelay=reduced.matches?'0ms':`${(i%50)*5}ms`;rect.setAttribute('fill',i<n?A:'#e6e7e4');});}$('toy-steps').innerHTML=Array.from({length:7},(_,i)=>`<span>cohort ${i}<b>${fmt(M.toy(p,i),1)}</b></span>`).join('');}
  function stop(){playing=false;clearTimeout(timer);$('toy-play').textContent='play generations';}
  function tick(){if(!playing)return;let g=+$('toy-g').value;if(g>=8){stop();return;}$('toy-g').value=g+1;draw();timer=setTimeout(tick,900);}
  $('toy-play').addEventListener('click',()=>{if(playing){stop();return;}playing=true;if(+$('toy-g').value>=8)$('toy-g').value=0;$('toy-play').textContent='pause';draw();timer=setTimeout(tick,900);});
  ['toy-start','toy-g'].forEach(id=>$(id).addEventListener('input',()=>{stop();draw();}));document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});draw();
 }
 scaffold();document.querySelectorAll('.table-scroll').forEach(el=>{el.tabIndex=0;el.setAttribute('role','region');if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',el.id==='cohort-table'?'full cohort results':'model assumptions or results table');});loadHash();renderControls();bind();result=M.simulate(params);render();toyInit();
 // Deliberate development surface for browser smoke tests and local agent audits.
 window.AncestryDemo={getState:()=>({parameters:M.clone(params),result:M.clone(result),selected,sensitivity:M.clone(sensitivity)}),setScenario:p=>{M.validate(p);params=M.clone(p);renderControls();rerun();markCustom();}};
})();
