import states from '../data/us-states.json';

// The outline of one state, cut from the same paths the coverage map draws, with a
// viewBox fitted to that state alone so it can be drawn small beside its name. The paths
// are absolute move and line commands, so every number pair in them is a point.
export function stateShape(name: string | undefined | null): { d: string; viewBox: string } | undefined {
  const state = states.find((s) => s.name === name);
  if (!state) return undefined;
  const nums = state.d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length < 4) return undefined;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i], y = nums[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const pad = Math.max(maxX - minX, maxY - minY) * 0.04;
  const f = (n: number) => Math.round(n * 10) / 10;
  return {
    d: state.d,
    viewBox: `${f(minX - pad)} ${f(minY - pad)} ${f(maxX - minX + pad * 2)} ${f(maxY - minY + pad * 2)}`,
  };
}
