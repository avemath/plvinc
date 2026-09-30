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
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/studio') &&
        (hasInsights || !page.includes('/insights')),
    }),
  ],
});
