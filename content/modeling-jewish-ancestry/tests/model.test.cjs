'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const m=require('../model.js');
const near=(a,b,tol=2e-12)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const sum=a=>a.reduce((a,b)=>a+b,0);
function compare(a,b) {if(Array.isArray(a)){assert.equal(a.length,b.length);a.forEach((v,i)=>compare(v,b[i]));}else near(a,b);}
const fixtures=JSON.parse(fs.readFileSync(path.join(__dirname,'../fixtures/v3-parity.json')));
for(const f of fixtures) test(`python v3 parity: ${f.label}`,()=>{const r=m.simulate(f.parameters);compare(r.full,f.full);compare(r.control,f.control);});
test('pairing symmetry, marginals, nonnegative entries: 500 random populations',()=>{
 const rng=m.rng(319);for(let trial=0;trial<500;trial++){
  let x=Array.from({length:7},rng);x=x.map(v=>v/sum(x));const pp=m.pairing(x,Array.from({length:5},rng),rng(),Array.from({length:5},rng));
  pp.forEach((row,i)=>{near(sum(row),x[i]);row.forEach((v,j)=>{assert.ok(v>=0);near(v,pp[j][i]);});});
 }
});
test('degenerate and partner-scarcity populations conserve mass',()=>{
 for(const x of [[1,0,0,0,0,0,0],[0,0,0,0,0,0,1],[0,0,0,0,0,1,0],[.8,.1,.04,.02,.01,.01,.02]]){
  const p=m.pairing(x,[1,1,1,1,1],.5,[1,1,1,1,1]);p.forEach((r,i)=>near(sum(r),x[i]));
 }
});
test('all offspring distributions sum to 1 and ancestry cannot be lost',()=>{
 const T=m.childTensor(m.defaults());for(let i=0;i<7;i++)for(let j=0;j<7;j++){near(sum(T[i][j]),1);if(i<6||j<6)assert.equal(T[i][j][6],0);}
});
test('first-generation matched control is exact across 200 input draws',()=>{
 const rng=m.rng(8);for(let i=0;i<200;i++){const p=m.sampleParameters(m.defaults(),rng);const r=m.simulate(p);compare(m.collapse(r.full[1]),r.control[1]);}
});
test('cohort states stay on the simplex and identity <= connection',()=>{
 const rng=m.rng(7);for(let i=0;i<200;i++){const p=m.sampleParameters(m.defaults(),rng);p.generations=16;const r=m.simulate(p);for(const x of [...r.full,...r.control]){near(sum(x),1);assert.ok(x.every(v=>v>=-1e-14));const mm=m.metrics(x);assert.ok(mm.identity<=mm.connection+1e-12);}}
});
test('random-mating, equal-fertility closed limit equals exact ancestry recurrence',()=>{
 const p=m.defaults();p.initialJewish=0;p.initialConnection=.08;p.clustering=0;p.arrivalShare=0;p.fertility.fill(2);
 const r=m.simulate(p);r.rows.forEach((row,g)=>near(row.connection,m.toy(.08,g)));
});
test('complete ancestry separation with equal fertility and no arrivals preserves frequency',()=>{
 const p=m.defaults();p.initialJewish=0;p.initialConnection=.08;p.clustering=1;p.arrivalShare=0;p.fertility.fill(2);
 m.simulate(p).rows.forEach(row=>near(row.connection,.08));
});
test('zero starting lineage plus zero Jewish arrivals stays zero',()=>{
 const p=m.defaults();p.initialJewish=p.initialConnection=p.arrivalJewish=0;m.simulate(p).rows.forEach(r=>near(r.connection,0));
});
test('a 100%-arrival cohort equals arrival vector exactly',()=>{
 const p=m.defaults();p.arrivalShare=1;p.arrivalJewish=.10;p.arrivalDescendant=.20;
 const r=m.simulate(p);for(const x of r.full.slice(1))compare(x,m.arrivals(p));
});
test('closing new intermarriage does not stop existing outside ancestry spreading',()=>{
 const p=m.defaults();p.initialJewish=0;p.initialConnection=.08;p.intermarriage.fill(0);p.arrivalShare=0;p.clustering=0;
 assert.ok(m.simulate(p).rows[1].connection>.08);
});
test('with equal D and N fertility, extra outside ancestry does not change full-model identity',()=>{
 const a=m.defaults(),b=m.defaults();b.initialConnection=.2;
 compare(m.simulate(a).full.map(x=>x.slice(0,5)),m.simulate(b).full.map(x=>x.slice(0,5)));
});
test('reference date and common generation interval affect labels only',()=>{
 const a=m.defaults(),b=m.defaults();b.generationYears=20;b.referenceYear=1800;
 compare(m.simulate(a).full,m.simulate(b).full);assert.notEqual(m.simulate(a).rows[1].illustrativeYear,m.simulate(b).rows[1].illustrativeYear);
});
test('no fractional generation steps are accepted',()=>{const p=m.defaults();p.generations=3.8;assert.throws(()=>m.simulate(p),/whole steps/);});
test('invalid probabilities, mixtures, ancestry and non-finite inputs are rejected',()=>{
 for(const alter of [p=>p.clustering=NaN,p=>p.initialConnection=.001,p=>p.fertility[0]=-1,p=>p.jewishMix[0]=.8,p=>p.sameGroupTransitions[0][6]=.3,p=>{p.arrivalJewish=.9;p.arrivalDescendant=.5;}]){
  const p=m.defaults();alter(p);assert.throws(()=>m.simulate(p));
 }
});
test('simulation does not mutate parameters',()=>{const p=m.defaults(),copy=m.clone(p);m.simulate(p);assert.deepEqual(p,copy);});
test('retention slider preserves leaver destination ratios',()=>{
 const p=m.defaults(),r=p.sameGroupTransitions[0][1]/p.sameGroupTransitions[0][5];m.setRetention(p,0,.70);near(p.sameGroupTransitions[0][0],.7);near(sum(p.sameGroupTransitions[0]),1);near(p.sameGroupTransitions[0][1]/p.sameGroupTransitions[0][5],r);
});
test('fully exiting same-group row still yields normalized mixed-parent outcomes',()=>{
 const p=m.defaults();p.sameGroupTransitions[0]=[0,0,0,0,0,1,0];near(sum(m.childTensor(p)[0][6]),1);
});
test('all-jewish founders and no arrivals never lose the connection flag',()=>{
 const p=m.defaults();p.initialConnection=p.initialJewish=1;p.arrivalShare=0; m.simulate(p).rows.forEach(row=>near(row.connection,1));
});
test('zero-width sensitivity is exactly the chosen scenario, including custom background fertility',()=>{
 const p=m.defaults();p.fertility[5]=3;assert.deepEqual(m.sampleParameters(p,m.rng(1),0),p);
});
test('seeded input draws and illustrative births are reproducible',()=>{
 const a=m.rng(912),b=m.rng(912);for(let i=0;i<20;i++)assert.deepEqual(m.sampleParameters(m.defaults(),a),m.sampleParameters(m.defaults(),b));
 const r=m.simulate(m.defaults());assert.deepEqual(m.sampleBirths(r,2,117),m.sampleBirths(r,2,117));
});
test('sampled child frequencies agree with deterministic next-cohort shares',()=>{
 const p=m.defaults();p.initialConnection=.08;const r=m.simulate(p),s=m.sampleBirths(r,2,343,10000),counts=Array(7).fill(0);s.events.forEach(e=>counts[e.k]++);
 counts.forEach((n,i)=>near(n/10000,r.full[3][i],.022));
});
test('conditional birth filters report their mass, never manufacture impossible cases',()=>{
 const p=m.defaults();p.intermarriage.fill(0);const r=m.simulate(p);assert.equal(m.sampleBirths(r,0,2,12,'mixed').events.length,0);
 const s=m.sampleBirths(r,0,2,12,'haredi');assert.ok(s.mass>0&&s.mass<1);s.events.forEach(e=>{assert.equal(e.i,0);assert.equal(e.j,0);});
});
test('toy endpoints and known values',()=>{near(m.toy(.08,1),.1536);assert.equal(m.toy(0,10),0);assert.equal(m.toy(1,10),1);});
test('sensitivity quantiles use quantiles, not standard errors',()=>{
 const p=m.defaults(),runs=[m.simulate(p),m.simulate(p)];const q=m.summarizeRuns(runs);q.forEach((r,g)=>r.connection.forEach(v=>near(v,runs[0].rows[g].connection)));
});

test('zero-D control uses the continuous limit, not an arbitrary identity-loss rule',()=>{
 const p=m.defaults(),q=m.defaults();q.initialConnection+=1e-10;
 const a=m.simulate(p),b=m.simulate(q);
 a.control.forEach((x,g)=>x.forEach((v,k)=>near(v,b.control[g][k],1e-7)));
});
test('equal D/N fertility makes frozen-control identity independent of outside ancestry too',()=>{
 const p=m.defaults(),q=m.defaults();q.initialConnection=.08;
 compare(m.simulate(p).control.map(x=>x[0]),m.simulate(q).control.map(x=>x[0]));
});
