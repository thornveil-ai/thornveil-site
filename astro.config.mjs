import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: true }), sitemap()],
  site: 'https://thornveil.ai',
  redirects: {
    // Legacy routes: rename /products -> /systems; /dronebane -> /defense (page deleted)
    '/products': '/systems',
    '/dronebane': '/defense',
  },
});
