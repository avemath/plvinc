# Source images

Full-resolution originals for the photographic bands on the site. They live
outside `public/` so they are never deployed — only the derived JPEGs in
`public/images/uploads/` are served.

Each derived file is blurred and slightly desaturated at build time rather than
in CSS. A `filter: blur()` on an image this size costs a full composited layer
on every paint, and a pre-blurred file compresses to a fraction of the sharp
one. The blur also means the JPEG can be compressed hard without it showing.

Regenerate with [sharp](https://sharp.pixelplumbing.com) (already a dependency):

| Source | Derived | Used by |
| --- | --- | --- |
| `workspace-window-monitors.png` | `workspace-hero-window.jpg` | Home hero |
| `workspace-rig-sunset.png` | `cta-rig-sunset.jpg` | Home closing band |
| `workspace-desk-map.png` | `mineral-owners-desk.jpg` | Mineral Owners header |

The hero keeps its green wash in CSS, because that wash is weighted to the left
to carry the headline and needs to follow the crop:

```js
sharp(src).resize({ width: 1672 }).blur(3.5)
  .modulate({ saturation: 0.85 })
  .jpeg({ quality: 62, mozjpeg: true })
  .toFile(out)
```

The other two sit behind centred text, so their wash is even and is composited
into the file instead — `#1B4332` then `#0B1F15`, at the opacities below:

```js
const solid = (hex, alpha) => sharp({ create: { width: 1672, height: 941, channels: 4,
  background: { r: ..., g: ..., b: ..., alpha } } }).png().toBuffer()

sharp(src).resize({ width: 1672, height: 941, fit: 'cover' }).blur(3.5)
  .modulate({ saturation: 0.85 })
  .composite([
    { input: await solid('#1B4332', greenAlpha) },  // .20 CTA, .18 header
    { input: await solid('#0B1F15', darkAlpha) },   // .58 CTA, .60 header
  ])
  .jpeg({ quality: 66, mozjpeg: true })
  .toFile(out)
```

If you swap a source, check white text still clears 4.5:1 against the brightest
point it covers — the current files measure 5.7:1 or better at their worst.
