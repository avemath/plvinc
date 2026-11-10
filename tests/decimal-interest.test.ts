import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/lib/decimal-interest.ts';
import { toDecimal, toTrimmed, toFractionString } from '../src/lib/fraction.ts';

const run = (share: string, tract: string, unit: string, royalty: string) => calculate({ share, tract, unit, royalty });

test('1/2 of 50 acres is 25 net mineral acres', () => {
  const r = run('1/2', '50', '640', '1/8');
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(toTrimmed(r.nma), '25');
    assert.equal(toFractionString(r.nma), '25');
  }
});

test('25 NMA in a 640-acre unit at 1/8 royalty is 0.00488281', () => {
  const r = run('1/2', '50', '640', '1/8');
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(toFractionString(r.decimal), '5/1024');
    assert.equal(toDecimal(r.decimal), '0.00488281');
  }
});

test('the same answer from decimals instead of fractions', () => {
  const r = run('0.5', '50.0', '640', '0.125');
  assert.ok(r.ok);
  if (r.ok) assert.equal(toDecimal(r.decimal), '0.00488281');
});

test('more worked examples', () => {
  // Whole tract, 3/16 royalty: 80/640 × 3/16 = 0.0234375
  let r = run('1', '80', '640', '3/16');
  assert.ok(r.ok); if (r.ok) assert.equal(toDecimal(r.decimal), '0.02343750');
  // A third of 62.40 acres in a 1,280-acre unit at 1/5: 20.8/1280 × 1/5 = 0.00325
  r = run('1/3', '62.40', '1,280', '1/5');
  assert.ok(r.ok); if (r.ok) { assert.equal(toTrimmed(r.nma), '20.8'); assert.equal(toDecimal(r.decimal), '0.00325000'); }
  // The sample file's 3/4 of 62.40 acres at 18%: 46.8 NMA; in a 640-acre unit, 0.0131625
  r = run('3/4', '62.40', '640', '0.18');
  assert.ok(r.ok); if (r.ok) { assert.equal(toTrimmed(r.nma), '46.8'); assert.equal(toDecimal(r.decimal), '0.01316250'); }
});

test('rejects what cannot be right, field by field', () => {
  let r = run('', 'x', '0', '1');
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(r.errors, { share: 'invalid', tract: 'invalid', unit: 'range', royalty: 'range' });
  r = run('3/2', '50', '640', '1/8');
  assert.ok(!r.ok && r.errors.share === 'range');
  r = run('1', '700', '640', '1/8');
  assert.ok(!r.ok && r.errors.unit === 'unit_small');
  r = run('1/2', '50', '640', '1/0');
  assert.ok(!r.ok && r.errors.royalty === 'invalid');
});
