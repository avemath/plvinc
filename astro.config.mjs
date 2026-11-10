import fs from 'node:fs';

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// While the insights folder is empty the index redirects home, so it should not be
// advertised in the sitemap. Writing the first post brings it back automatically.
const hasInsights = fs
  .readdirSync(new URL('./src/content/insights', import.meta.url))
  .some((f) => f.endsWith('.md'));

export default defineConfig({
  output: 'static',
  site: 'https://plvinc.com',
  trailingSlash: 'never',
  // Emit about.html rather than about/index.html. Cloudflare Pages serves a .html file at its
  // extensionless path, so /about resolves directly. With directory output it instead 308s
  // /about to /about/, which contradicts trailingSlash: 'never' and meant every internal link,
  // canonical tag and sitemap entry pointed at a URL that redirected.
  build: { format: 'file' },
  // Astro 7 switched the default to JSX whitespace rules, which drop the space between two
  // tags written on separate lines ("Learn more" and its arrow, words either side of a
  // link). The templates are written as ordinary HTML, so keep ordinary HTML whitespace.
  compressHTML: true,
  // Each interactive feature carries its own small stylesheet (about 4.5 KB), loaded only on
  // its page. Inlining it in that page saves a separate request before the page can draw.
  // The shared stylesheet, at 85 KB, is far over this and stays a cached file. Nothing in
  // src imports an image or font, so this limit changes nothing else.
  vite: { build: { assetsInlineLimit: 6144 } },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/studio') &&
        !page.includes('/message-sent') &&
        (hasInsights || !page.includes('/insights')),
    }),
  ],
});
