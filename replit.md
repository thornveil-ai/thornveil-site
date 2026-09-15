# Replit setup

## Run locally

Install dependencies and start the Astro development server:

```bash
npm install
ASTRO_DEV_BACKGROUND=0 npm run dev -- --host 0.0.0.0 --port 5000
```

The Replit workflow uses the same command and serves the preview on port 5000.

## Environment notes

- The project uses Node.js 22 because the current Astro and React integration versions require Node 22.
- `ASTRO_DEV_BACKGROUND=0` keeps Astro attached to the Replit workflow instead of letting its agent-environment detection daemonize the server.
- `npm run build` creates the static site in `dist/`.