import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    sitemap(),
    react(),
  ],
  site: 'https://thornveil.ai',
  redirects: {
    '/products':   '/systems',
    '/dronebane':  '/defense',
    '/docs':       '/systems',
    '/technology': '/systems',
  },
  vite: {
    ssr: {
      // three is a CJS module from npm; let Vite externalize it for SSR
      noExternal: ['three', '@react-three/fiber', '@react-three/drei'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split three.js + R3F into a dedicated chunk so it can be cached
            // independently across pages that reuse the WebGL stack.
            if (id.includes('node_modules/three/')) return 'three-core';
            if (id.includes('@react-three/')) return 'react-three';
          },
        },
      },
    },
  },
});
