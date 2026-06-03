/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          raised: 'var(--bg-raised)',
          inset: 'var(--bg-inset)',
        },
        text: {
          DEFAULT: 'var(--text)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        signal: {
          DEFAULT: 'var(--signal)',
          text: 'var(--signal-text)',
          dim: 'var(--signal-dim)',
          line: 'var(--signal-line)',
        },
        warn: 'var(--warn)',
        live: 'var(--live)',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        body: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'step--1': 'var(--step--1)',
        'step-0':  'var(--step-0)',
        'step-1':  'var(--step-1)',
        'step-2':  'var(--step-2)',
        'step-3':  'var(--step-3)',
        'step-4':  'var(--step-4)',
      },
      spacing: {
        's-1':  'var(--s-1)',
        's-2':  'var(--s-2)',
        's-3':  'var(--s-3)',
        's-4':  'var(--s-4)',
        's-5':  'var(--s-5)',
        's-6':  'var(--s-6)',
        's-7':  'var(--s-7)',
        's-8':  'var(--s-8)',
        's-9':  'var(--s-9)',
        's-10': 'var(--s-10)',
        's-11': 'var(--s-11)',
      },
      maxWidth: {
        container: 'var(--container)',
        prose: '66ch',
        hero: '18ch',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      transitionDuration: {
        fast: '180ms',
        DEFAULT: '420ms',
        slow: '720ms',
      },
    },
  },
  plugins: [],
};
