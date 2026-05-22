import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: true }), sitemap()],
  site: 'https://thornveil.ai',
  redirects: {
    // Legacy routes: /products and /technology subsumed by /systems; /docs subsumed
    // by /systems; /dronebane subsumed by /defense (deleted to keep scope to 10 systems).
    '/products': '/systems',
    '/dronebane': '/defense',
    '/docs': '/systems',
    '/technology': '/systems',
  },
});
