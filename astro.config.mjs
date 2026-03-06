import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: true }), sitemap()],
  site: 'https://thornveil.ai',
});
