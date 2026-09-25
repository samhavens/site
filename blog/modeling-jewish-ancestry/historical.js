/* Historical experiment recovered from jewish_ancestry_sensitivity_v2.py.
   Shares are fractions. This is a sensitivity model, not a survey estimate. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.HistoricalAncestry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='1.0.0',PRESENT_YEAR=2026;
 const J=[[1877,.0052],[1897,.0131],[1907,.0200],[1917,.0327],[1927,.0358],[1937,.0370],[1957,.0320],[1970,.0270],[1990,.0220],[2013,.0220],[2020,.0240],[2025,.0240]];
 const FB=[[1900,.137],[1910,.146],[1920,.127],[1930,.113],[1940,.085],[1950,.069],[1960,.056],[1970,.048],[1980,.062],[1990,.082],[2000,.114],[2010,.127],[2018,.141],[2025,.145]];
 const M=[[1877,.01],[1897,.015],[1907,.02],[1935,.055],[1957,.038],[1975,.18],[1985,.42],[1995,.37],[2005,.45],[2015,.61],[2025,.63]];
 const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
 function interp(points,year){
  if(year<=points[0][0])return points[0][1];
  for(let i=1;i<points.length;i++)if(year<=points[i][0]){
   const [x0,y0]=points[i-1],[x1,y1]=points[i];return y0+(y1-y0)*(year-x0)/(x1-x0);
  }
  return points.at(-1)[1];
 }
 const jewishShare=year=>interp(J,year);
 function defaults(){return {
  startRange:[1877,1927],generationRange:[24,30],endYear:PRESENT_YEAR,
  initialDescendants:0,clusteringRange:[0,.5],fertilityJJ:[.85,1.08],
  fertilityMixed:[.82,1.06],fertilityDescendants:[.90,1.06],retainJJ:[.94,.995],
  immigrationScale:[.65,1.45],immigrantJewishMax:.60,draws:30000,seed:106
 };}
 function validate(p){
  if(!p||typeof p!=='object')throw Error('Supply a complete historical configuration.');
  const ranges={startRange:[1877,1937],generationRange:[20,35],clusteringRange:[0,1],fertilityJJ:[.1,3],fertilityMixed:[.1,3],fertilityDescendants:[.1,3],retainJJ:[0,1],immigrationScale:[.1,3]};
  for(const [key,[lo,hi]] of Object.entries(ranges)){
   const r=p[key];if(!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||r[0]<lo||r[1]>hi||r[0]>r[1])throw Error(`${key}: enter an ordered range within ${lo}–${hi}.`);
  }
  if(!Number.isInteger(p.endYear)||p.endYear<2000||p.endYear>PRESENT_YEAR)throw Error(`End year must be 2000–${PRESENT_YEAR}.`);
  if(!Number.isFinite(p.initialDescendants)||p.initialDescendants<0||p.initialDescendants>.20)throw Error('Starting ancestry outside identity must be 0–20%.');
  if(!Number.isFinite(p.immigrantJewishMax)||p.immigrantJewishMax<0||p.immigrantJewishMax>1)throw Error('The Jewish share ceiling for arrivals must be 0–100%.');
  if(!Number.isInteger(p.draws)||p.draws<1||p.draws>100000)throw Error('Use 1–100,000 scenarios.');
  if(!Number.isInteger(p.seed)||p.seed<0||p.seed>4294967295)throw Error('Seed must be a whole number from 0 to 4294967295.');
  return p;
 }
 function rng(seed){return function(){
  let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);
  return ((t^t>>>14)>>>0)/4294967296;
 };}
 const uniform=(random,range)=>range[0]+(range[1]-range[0])*random();
 function advance(state,p,fraction){
  if(!Number.isFinite(fraction)||fraction<0||fraction>1)throw Error('Elapsed generation fraction must be 0–1.');
  const {j,d}=state,n=1-j-d,jj=j*(1-p.m),jd=2*j*p.m*d/(1-j),jn=2*j*p.m*n/(1-j);
  const h=1-j-j*p.m,z=d/(1-j);
  const dd=h*(p.c*z+(1-p.c)*z*z),dn=h*(1-p.c)*2*z*(1-z),nn=h*(p.c*(1-z)+(1-p.c)*(1-z)**2);
  const norm=jj*p.fjj+(jd+jn)*p.fmix+(dd+dn)*p.fd+nn;
  const fullJ=(jj*p.fjj*p.rjj+(jd+jn)*p.fmix*p.rm)/norm,fullD=1-nn/norm-fullJ;
  const fullProxy=(jj*p.fjj+(jd+jn)*p.fmix)/norm;
  return {j:j+fraction*(fullJ-j),d:d+fraction*(fullD-d),parentProxy:state.parentProxy+fraction*(fullProxy-state.parentProxy)};
 }
 function calibrate(pre,arrivalShare,targetJewish,ceiling){
  const required=(targetJewish-(1-arrivalShare)*pre.j)/arrivalShare;
  if(required<0)return {status:'rejected',reason:'negative',required};
  if(required>ceiling)return {status:'rejected',reason:'ceiling',required};
  return {status:'accepted',required,state:{j:targetJewish,d:(1-arrivalShare)*pre.d,parentProxy:(1-arrivalShare)*pre.parentProxy+arrivalShare*required}};
 }
 function trial(p,index,{legacyTiming=false}={}){
  // One stream per draw makes chunking, cancellation and representative replay agree.
  const random=rng((p.seed+Math.imul(index,0x9e3779b9))>>>0);
  const start=uniform(random,p.startRange),generationYears=uniform(random,p.generationRange);
  const rates={c:uniform(random,p.clusteringRange),fjj:uniform(random,p.fertilityJJ),fmix:uniform(random,p.fertilityMixed),fd:uniform(random,p.fertilityDescendants),rjj:uniform(random,p.retainJJ)};
  let year=start,state={j:jewishShare(start),d:p.initialDescendants,parentProxy:jewishShare(start)};
  const rows=[{year,...state,fraction:0,arrivalShare:0,arrivalScale:null,immigrantJewish:null,rates:null}];
  while(year<p.endYear-1e-9){
   // Subtracting decimal dates can put a whole step a few ulps above one.
   const next=Math.min(year+generationYears,p.endYear),fraction=Math.min(1,(next-year)/generationYears),mid=(year+next)/2;
   const mRange=mid<1960?[.55,1.65]:mid<1980?[.75,1.35]:[.88,1.12];
   const retentionRange=mid<1940?[.12,.45]:mid<1970?[.15,.50]:mid<2000?[.25,.62]:[.48,.75];
   const stepRates={...rates,m:clamp(interp(M,mid)*uniform(random,mRange),.001,.80),rm:uniform(random,retentionRange)};
   const pre=advance(state,stepRates,legacyTiming?1:fraction),arrivalScale=uniform(random,p.immigrationScale);
   const arrivalShare=legacyTiming?clamp(interp(FB,next)*(next-year)/25*arrivalScale,.01,.35):fraction*clamp(interp(FB,next)*generationYears/25*arrivalScale,.01,.35);
   const calibrated=calibrate(pre,arrivalShare,jewishShare(next),p.immigrantJewishMax);
   if(calibrated.status==='rejected')return {index,start,generationYears,status:'rejected',reason:calibrated.reason,rejectedYear:next,requiredImmigrantShare:calibrated.required};
   state=calibrated.state;year=next;
   rows.push({year,...state,fraction,arrivalShare,arrivalScale,immigrantJewish:calibrated.required,rates:stepRates});
  }
  return {index,start,generationYears,status:'accepted',ancestry:state.j+state.d,parentProxy:state.parentProxy,rows};
 }
 function record(run){
  if(run.status==='rejected')return run;
  const {rows,...summary}=run;return summary;
 }
 function quantile(sorted,p){
  if(!sorted.length)return null;
  const at=(sorted.length-1)*p,lo=Math.floor(at),hi=Math.ceil(at);return sorted[lo]+(sorted[hi]-sorted[lo])*(at-lo);
 }
 function summarize(p,records,options={}){
  const accepted=records.filter(r=>r.status==='accepted').sort((a,b)=>a.ancestry-b.ancestry||a.index-b.index);
  const values=accepted.map(r=>r.ancestry),middle=accepted[Math.floor((accepted.length-1)/2)];
  return {modelVersion:VERSION,timing:options.legacyTiming?'original-full-final-step':'fractional-final-step',parameters:structuredClone(p),
   retained:accepted.length,rejections:{negative:records.filter(r=>r.reason==='negative').length,ceiling:records.filter(r=>r.reason==='ceiling').length},
   quantiles:values.length?[.05,.5,.95].map(q=>quantile(values,q)):null,
   representative:middle?trial(p,middle.index,options):null,records,
   warning:'Selected historical sensitivity scenarios, not a confidence interval or a validated all-age ancestry estimate. Identity anchors mix definitions; arrivals use a stock proxy; final partial cohort is interpolated.'};
 }
 function ensemble(p,options={}){
  validate(p);const records=[];
  for(let i=0;i<p.draws;i++)records.push(record(trial(p,i,options)));
  return summarize(p,records,options);
 }
 return {VERSION,PRESENT_YEAR,defaults,validate,jewishShare,advance,calibrate,trial,record,quantile,summarize,ensemble};
});
