// Writes smaller WebP copies of uploaded photos before each build, so a 140px team photo
// does not download an 800px original. The copies go in public/images/variants (not kept
// in git) and the pages only point at a copy that exists, so a missing one simply falls
// back to the original upload. If sharp is not installed, nothing is written.
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'public/images/uploads';
const OUT = 'public/images/variants';
export const WIDTHS = [160, 320, 480, 640];

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('[image-variants] sharp is not available; using original uploads.');
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
let written = 0;
for (const file of fs.readdirSync(SRC)) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  const src = path.join(SRC, file);
  const base = file.replace(/\.[^.]+$/, '');
  let meta;
  try {
    meta = await sharp(src).metadata();
  } catch {
    continue;
  }
  for (const w of WIDTHS) {
    // Never upscale, and leave logos and wide banners alone: only photos narrower than
    // twice the largest copy are worth shrinking this way.
    if (!meta.width || w >= meta.width || meta.width > 1200) continue;
    const out = path.join(OUT, `${base}-${w}.webp`);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
    await sharp(src).resize({ width: w }).webp({ quality: 76 }).toFile(out);
    written++;
  }
}
console.log(`[image-variants] ${written} file(s) written to ${OUT}`);
