// The division-order arithmetic behind the decimal calculator on Mineral Owners:
//   net mineral acres = your share of the minerals × tract acres
//   decimal interest  = (net mineral acres ÷ unit acres) × royalty rate
// Exact fractions throughout; the decimal is only rounded (to 8 places) when it is shown.
import { parse, mul, div, cmp, ZERO, ONE, type Fraction } from './fraction.ts';

export type FieldKey = 'share' | 'tract' | 'unit' | 'royalty';
export type Result =
  | { ok: true; share: Fraction; tract: Fraction; unit: Fraction; royalty: Fraction; nma: Fraction; decimal: Fraction }
  | { ok: false; errors: Partial<Record<FieldKey, 'invalid' | 'range' | 'unit_small'>> };

/**
 * Checks the four inputs and works out the result. Error codes, not wording, come back, so
 * the page can show the messages written in Studio.
 * - share: more than 0 and no more than 1
 * - tract and unit acres: more than 0
 * - royalty: more than 0 and less than 1
 * - unit acres can't be smaller than the net mineral acres (the decimal would then be larger
 *   than the royalty itself)
 */
export function calculate(input: Record<FieldKey, string>): Result {
  const errors: Partial<Record<FieldKey, 'invalid' | 'range' | 'unit_small'>> = {};
  const share = parse(input.share);
  const tract = parse(input.tract);
  const unit = parse(input.unit);
  const royalty = parse(input.royalty);

  if (!share) errors.share = 'invalid';
  else if (cmp(share, ZERO) <= 0 || cmp(share, ONE) > 0) errors.share = 'range';
  if (!tract) errors.tract = 'invalid';
  else if (cmp(tract, ZERO) <= 0) errors.tract = 'range';
  if (!unit) errors.unit = 'invalid';
  else if (cmp(unit, ZERO) <= 0) errors.unit = 'range';
  if (!royalty) errors.royalty = 'invalid';
  else if (cmp(royalty, ZERO) <= 0 || cmp(royalty, ONE) >= 0) errors.royalty = 'range';

  if (Object.keys(errors).length) return { ok: false, errors };

  const nma = mul(share!, tract!);
  if (cmp(unit!, nma) < 0) return { ok: false, errors: { unit: 'unit_small' } };
  const decimal = mul(div(nma, unit!), royalty!);
  return { ok: true, share: share!, tract: tract!, unit: unit!, royalty: royalty!, nma, decimal };
}
