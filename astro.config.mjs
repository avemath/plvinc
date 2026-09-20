import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://plvinc.com',
  trailingSlash: 'never',
  // Emit about.html rather than about/index.html. Cloudflare Pages serves a .html file at its
  // extensionless path, so /about resolves directly. With directory output it instead 308s
  // /about to /about/, which contradicts trailingSlash: 'never' and meant every internal link,
  // canonical tag and sitemap entry pointed at a URL that redirected.
  build: { format: 'file' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/studio'),
    }),
  ],
});
