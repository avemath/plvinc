// Every step of the chain-of-title explorer (Studio: Sample Work Page → Chain of Title
// Explorer) must list shares that add up to exactly 1, and every "What makes a file hard"
// link must name one of that section's titles. The build runs this file, so a mistake saved
// in Studio stops the site publishing and the last good version stays live.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkStep } from '../src/lib/chain.ts';
import { parse, sum, eq, ONE, frac } from '../src/lib/fraction.ts';

const page = JSON.parse(readFileSync(new URL('../src/data/pages/sample-work.json', import.meta.url), 'utf8'));
const steps = page.chain_explorer?.steps ?? [];
const hardTitles = new Set((page.hard_files?.items ?? []).map((i: { title: string }) => i.title));

test('the explorer has 8 to 12 steps', () => {
  assert.ok(steps.length >= 8 && steps.length <= 12, `has ${steps.length}`);
});

for (const [i, step] of steps.entries()) {
  test(`step ${i + 1} (${step.title}): shares add up to exactly 1`, () => {
    const r = checkStep(step);
    assert.deepEqual(r.problems, [], r.problems.join('; '));
  });
  if (step.hard_file) {
    test(`step ${i + 1} (${step.title}): its hard-file link exists`, () => {
      assert.ok(hardTitles.has(step.hard_file), `"${step.hard_file}" is not a title under What Makes a File Hard`);
    });
  }
}

test('the check catches shares that do not add up', () => {
  const bad = checkStep({ title: 'x', owners: [{ name: 'A', share: '1/2' }, { name: 'B', share: '1/3' }] });
  assert.ok(bad.problems.some((p) => p.includes('5/6')));
  const junk = checkStep({ title: 'y', owners: [{ name: 'A', share: 'half' }] });
  assert.ok(junk.problems.length > 0);
});

test('the last step matches the supplemental report', () => {
  const last = steps.at(-1);
  const quarter = last.owners.filter((o: { name: string }) => o.name !== 'Daniel W. Hallbeck').map((o: { share: string }) => parse(o.share)!);
  assert.ok(eq(sum(quarter), frac(1n, 4n)));
  assert.ok(eq(sum(last.owners.map((o: { share: string }) => parse(o.share)!)), ONE));
});
