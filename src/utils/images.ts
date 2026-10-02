import fs from 'node:fs';

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

// Smaller WebP copies are written to public/images/variants by scripts/image-variants.mjs
// before each build. This lists the ones that exist for an upload, plus the original at
// its own width, as a srcset. With no copies it returns undefined and the page simply
// uses the original.
const VARIANT_WIDTHS = [160, 320, 480, 640];

export function srcsetFor(path: string | undefined | null, originalWidth?: number): string | undefined {
  if (!path || !path.startsWith('/images/uploads/')) return undefined;
  const base = path.slice('/images/uploads/'.length).replace(/\.[^.]+$/, '');
  const parts = VARIANT_WIDTHS
    .filter((w) => fs.existsSync(`public/images/variants/${base}-${w}.webp`))
    .map((w) => `/images/variants/${base}-${w}.webp ${w}w`);
  if (parts.length === 0) return undefined;
  if (originalWidth) parts.push(`${path} ${originalWidth}w`);
  return parts.join(', ');
}
