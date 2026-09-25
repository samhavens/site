'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../historical.js');
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-12, `${a} != ${b}`);
const state = {j:.035,d:.007,parentProxy:.04};
const rates = {m:.40,rjj:.97,rm:.55,fjj:.96,fmix:.94,fd:1.02,c:.2};

test('default experiment begins in history and ends in the present, without an 8% target', () => {
  const p=H.defaults();
  assert.deepEqual(p.startRange,[1877,1927]);
  assert.deepEqual(p.generationRange,[24,30]);
  assert.equal(p.endYear,2026);
  assert.equal(p.initialDescendants,0);
  close(H.jewishShare(1927),.0358);
  close(H.jewishShare(2026),.024);
});

test('a short last interval advances only its elapsed fraction of a generation', () => {
  const full=H.advance(state,rates,1),partial=H.advance(state,rates,1/27);
  close(partial.j,state.j+(full.j-state.j)/27);
  close(partial.d,state.d+(full.d-state.d)/27);
  close(H.advance(state,rates,0).d,state.d);
  assert.ok(partial.d<full.d);
});

test('calibration exactly matches identity and retains only feasible arrival composition', () => {
  const result=H.calibrate({j:.025,d:.04,parentProxy:.035},.12,.024,.60);
  assert.equal(result.status,'accepted');
  close(result.state.j,.024);
  close(result.state.d,.04*.88);
  assert.equal(H.calibrate({j:.05,d:0,parentProxy:.05},.01,.024,.60).reason,'negative');
  assert.equal(H.calibrate({j:0,d:0,parentProxy:0},.01,.024,.60).reason,'ceiling');
});

test('historical paths end exactly at the requested date and record a partial final step', () => {
  const p={...H.defaults(),startRange:[1925,1925],generationRange:[27,27]};
  const run=H.ensemble({...p,draws:500}).representative;
  assert.equal(run.status,'accepted');
  assert.deepEqual(run.rows.map(r=>r.year),[1925,1952,1979,2006,2026]);
  close(run.rows.at(-1).fraction,20/27);
  for(const r of run.rows){close(r.j,H.jewishShare(r.year));assert.ok(r.d>=0&&r.j+r.d<=1);}
});

test('full generations conserve valid population states', () => {
  for(const j of [.005,.02,.04])for(const d of [0,.02,.15])for(const m of [0,.4,.7]) {
    const next=H.advance({j,d,parentProxy:j},{...rates,m},1);
    assert.ok(next.j>=0&&next.d>=0&&next.j+next.d<=1);
    assert.ok(next.parentProxy>=next.j&&next.parentProxy<=next.j+next.d+1e-12);
  }
});

test('decimal generation lengths remain valid despite floating-point date subtraction', () => {
  for(const generationRange of [[24.1,30.1],[20.2,20.2],[27.2,27.2],[27.3,27.3]]) {
    const p={...H.defaults(),generationRange,draws:200};
    const result=H.ensemble(p);
    assert.equal(result.records.length,p.draws);
    if(result.representative)for(const row of result.representative.rows)assert.ok(row.fraction>=0&&row.fraction<=1);
  }
});

test('screen accounting, retained-only quantiles and representative replay are deterministic', () => {
  const p={...H.defaults(),draws:200};
  const a=H.ensemble(p),b=H.ensemble(p);
  assert.deepEqual(a,b);
  assert.equal(a.retained+a.rejections.negative+a.rejections.ceiling,p.draws);
  assert.equal(a.records.filter(r=>r.status==='accepted').length,a.retained);
  const values=a.records.filter(r=>r.status==='accepted').map(r=>r.ancestry).sort((a,b)=>a-b);
  close(a.quantiles[1],H.quantile(values,.5));
  close(a.representative.rows.at(-1).j+a.representative.rows.at(-1).d,H.trial(p,a.representative.index).ancestry);
});

test('an empty screen has no invented zero-valued ancestry result', () => {
  const result=H.ensemble({...H.defaults(),draws:100,immigrantJewishMax:0});
  assert.equal(result.retained,0);
  assert.equal(result.quantiles,null);
  assert.equal(result.representative,null);
});

test('invalid ranges, future endpoints and malformed runs are rejected before computation', () => {
  for(const patch of [{startRange:[1927,1877]},{generationRange:[0,27]},{endYear:2030},{draws:0},{seed:-1},{initialDescendants:1},{fertilityJJ:[-1,1]},{immigrantJewishMax:1.2}]) {
    assert.throws(()=>H.ensemble({...H.defaults(),...patch}));
  }
});
