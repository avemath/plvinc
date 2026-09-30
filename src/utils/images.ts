// The banner photos that ship with the site have their dark green tint built into the file,
// so white text reads cleanly over them. A photo uploaded later in the editor has no tint of
// its own, so the page lays one over it instead. Only these original files skip that, since
// tinting them again would make them too dark.
const PRE_TINTED = new Set([
  '/images/uploads/cta-rig-horizon.jpg',
  '/images/uploads/mineral-owners-lease-map.jpg',
]);

export function needsTint(path: string | undefined | null): boolean {
  return Boolean(path) && !PRE_TINTED.has(path!);
}
