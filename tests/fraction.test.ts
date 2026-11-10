import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, add, sum, eq, frac, toDecimal, toFractionString, toTrimmed, ONE } from '../src/lib/fraction.ts';

test('parses fractions, decimals and mixed numbers exactly', () => {
  assert.deepEqual(parse('1/2'), frac(1n, 2n));
  assert.deepEqual(parse(' 3 / 16 '), frac(3n, 16n));
  assert.deepEqual(parse('0.125'), frac(1n, 8n));
  assert.deepEqual(parse('.5'), frac(1n, 2n));
  assert.deepEqual(parse('62.40'), frac(312n, 5n));
  assert.deepEqual(parse('1,280'), frac(1280n));
  assert.deepEqual(parse('1 1/2'), frac(3n, 2n));
  for (const bad of ['', 'abc', '1/0', '-1/2', '1/2/3', '1..2', '.', 'one half']) assert.equal(parse(bad), null, bad);
});

test('thirds add to exactly one, with no rounding', () => {
  const third = parse('1/3')!;
  assert.ok(eq(sum([third, third, third]), ONE));
  assert.equal(toDecimal(third), '0.33333333');
  assert.equal(toDecimal(parse('2/3')!), '0.66666667');
});

test('decimals round half up at 8 places', () => {
  assert.equal(toDecimal(frac(25n, 5120n)), '0.00488281'); // 0.0048828125
  assert.equal(toDecimal(frac(1n, 24n)), '0.04166667');
  assert.equal(toDecimal(frac(1n, 12n)), '0.08333333');
  assert.equal(toDecimal(ONE), '1.00000000');
  assert.equal(toDecimal(frac(5n, 1000000000n)), '0.00000001'); // exactly half rounds up
});

test('fraction and trimmed decimal strings', () => {
  assert.equal(toFractionString(add(frac(1n, 4n), frac(1n, 4n))), '1/2');
  assert.equal(toFractionString(frac(4n, 4n)), '1');
  assert.equal(toTrimmed(frac(25n)), '25');
  assert.equal(toTrimmed(parse('20.8')!), '20.8');
});
