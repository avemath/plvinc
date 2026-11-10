// Exact fractions for ownership and decimal-interest arithmetic. Every value is a pair of
// BigInts kept in lowest terms with a positive denominator, so 1/3 + 1/3 + 1/3 is exactly 1
// and nothing is lost to floating-point rounding. Used by the decimal calculator on Mineral
// Owners and the chain-of-title explorer on Sample Work, and checked by tests/*.test.ts.
//
// Written with plain type annotations only, so Node can run the tests on this file directly.

export type Fraction = { n: bigint; d: bigint };

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export function frac(n: bigint, d: bigint = 1n): Fraction {
  if (d === 0n) throw new Error('Denominator cannot be zero');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

export const ZERO = frac(0n);
export const ONE = frac(1n);

export const add = (a: Fraction, b: Fraction) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const mul = (a: Fraction, b: Fraction) => frac(a.n * b.n, a.d * b.d);
export const div = (a: Fraction, b: Fraction) => {
  if (b.n === 0n) throw new Error('Cannot divide by zero');
  return frac(a.n * b.d, a.d * b.n);
};
export const eq = (a: Fraction, b: Fraction) => a.n === b.n && a.d === b.d;
export const cmp = (a: Fraction, b: Fraction) => {
  const l = a.n * b.d, r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
};
export const sum = (xs: Fraction[]) => xs.reduce(add, ZERO);

/**
 * Reads what a person types: "1/2", "3/16", "0.125", ".5", "62.40", "640", "1 1/2".
 * Spaces and thousands commas are ignored. Returns null for anything else, including a zero
 * denominator, so the caller can show its own message.
 */
export function parse(input: string | null | undefined): Fraction | null {
  if (input == null) return null;
  const s = String(input).trim().replace(/,/g, '');
  if (!s) return null;
  let m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/); // mixed number, "1 1/2"
  if (m) {
    const d = BigInt(m[3]);
    if (d === 0n) return null;
    return frac(BigInt(m[1]) * d + BigInt(m[2]), d);
  }
  m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const d = BigInt(m[2]);
    if (d === 0n) return null;
    return frac(BigInt(m[1]), d);
  }
  m = s.match(/^(\d*)(?:\.(\d+))?$/);
  if (m && (m[1] || m[2])) {
    const whole = m[1] || '0';
    const dec = m[2] || '';
    return frac(BigInt(whole + dec), 10n ** BigInt(dec.length));
  }
  return null;
}

/** "3/4", "1/24", "1". */
export function toFractionString(f: Fraction): string {
  return f.d === 1n ? `${f.n}` : `${f.n}/${f.d}`;
}

/**
 * Fixed decimal places, rounded half up, the way division orders print a decimal:
 * 25/5120 = 0.0048828125 → "0.00488281" at 8 places.
 */
export function toDecimal(f: Fraction, places = 8): string {
  const neg = f.n < 0n;
  const n = neg ? -f.n : f.n;
  const scale = 10n ** BigInt(places);
  let q = (n * scale) / f.d;
  const r = (n * scale) % f.d;
  if (r * 2n >= f.d) q += 1n;
  const str = q.toString().padStart(places + 1, '0');
  const out = places > 0 ? `${str.slice(0, -places)}.${str.slice(-places)}` : str;
  return (neg && q !== 0n ? '-' : '') + out;
}

/** Up to `places` decimals with trailing zeros removed: 25 → "25", 20.8 → "20.8". */
export function toTrimmed(f: Fraction, places = 8): string {
  const s = toDecimal(f, places);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

/** True when the fraction ends in a finite decimal (only 2s and 5s in the denominator). */
export function terminates(f: Fraction): boolean {
  let d = f.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n;
}
