// Checks for the chain-of-title explorer on Sample Work. Each step lists who owns the oil and
// gas after that document, as fractions that must add up to exactly 1. The build runs
// tests/chain.test.ts, so a step saved in Studio with shares that do not add up stops the
// site from publishing until it is fixed, rather than showing a wrong table.
import { parse, sum, eq, ONE, ZERO, cmp, toFractionString, type Fraction } from './fraction.ts';

export type ChainOwner = { name: string; share: string };
export type ChainStep = { title: string; owners: ChainOwner[]; hard_file?: string | null };

export type StepCheck = { title: string; total: Fraction | null; problems: string[] };

export function checkStep(step: ChainStep): StepCheck {
  const problems: string[] = [];
  const shares: Fraction[] = [];
  if (!step.owners?.length) problems.push('has no owners');
  for (const o of step.owners ?? []) {
    if (!o.name?.trim()) problems.push('has an owner with no name');
    const f = parse(o.share);
    if (!f) problems.push(`share "${o.share}" for ${o.name} is not a fraction like 1/4`);
    else if (cmp(f, ZERO) <= 0) problems.push(`share for ${o.name} must be more than 0`);
    else shares.push(f);
  }
  const total = shares.length === (step.owners ?? []).length ? sum(shares) : null;
  if (total && !eq(total, ONE)) problems.push(`shares add up to ${toFractionString(total)}, not 1`);
  return { title: step.title, total, problems };
}
