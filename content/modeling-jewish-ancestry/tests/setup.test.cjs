'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../model.js');
const S = require('../setup.js');

test('2013 setup loads a coherent survey-year reference and explicit ancestry horizon', () => {
  const p = S.historical();
  assert.equal(p.referenceYear, 2013);
  assert.equal(p.initialJewish, .022);
  assert.equal(p.initialConnection, .022);
  assert.deepEqual(p.jewishMix, [.062, .038, .18, .35, .37]);
  assert.deepEqual(p.fertility, [4.1, 4.1, 1.8, 1.7, 1.6, 2.2, 2.2]);
  assert.deepEqual(p.intermarriage, [.02, .02, .27, .5, .69]);
  assert.equal(p.arrivalJewish, p.initialJewish);
  assert.deepEqual(p.arrivalMix, p.jewishMix);
  assert.equal(S.isHistorical(p), true);
  M.validate(p);
});

test('historical setup preserves conservation and the matched first reproductive step', () => {
  const result = M.simulate(S.historical());
  for (const row of result.full) assert.ok(Math.abs(row.reduce((a, b) => a + b) - 1) < 1e-12);
  for (const key of ['Connection', 'Identity']) {
    assert.ok(Math.abs(result.rows[1][key.toLowerCase()] - result.rows[1]['control' + key]) < 1e-12);
  }
});

test('custom population, date, and fertility cannot retain a historical-baseline label', () => {
  for (const change of [p => {p.referenceYear = 1900;}, p => {p.initialJewish = .02;}, p => {p.initialConnection = .08;}, p => {p.fertility[0] = 6;}]) {
    const p = S.historical(); change(p); assert.equal(S.isHistorical(p), false);
  }
  const p = S.historical(); p.generationYears = 30; p.generations = 8;
  assert.equal(S.isHistorical(p), true);
});

test('clock changes preserve reproductive states and label every whole step', () => {
  const p = S.historical(), original = M.simulate(p);
  p.referenceYear = 1900; p.generationYears = 25;
  const changed = M.simulate(p);
  assert.deepEqual(changed.full, original.full);
  changed.rows.forEach((r, i) => assert.equal(r.illustrativeYear, 1900 + 25 * i));
});
