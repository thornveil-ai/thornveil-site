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

## Verification before preview and dependency upgrades

Run both checks after changing dependencies or page scripts:

```bash
npm run build
npm run check:smoke
```

The smoke check starts an isolated Astro dev server on port 5055 and stops it
afterward, including on failure. It discovers static `.astro` public routes in
`src/pages/`, checks HTML responses and the missing-page 404, then requests and
syntax-checks local browser scripts, their static imports, and Astro island
entry modules. This catches lazy Vite transform failures that a successful
production build or an HTML-only request can miss. Failures exit nonzero and
identify the route or script. Keep port 5055 free for this command.

To check an already-running dev server (or `astro preview` after a build):

```bash
npm run check:smoke -- --url https://YOUR-DEV-DOMAIN
```

No browser installation is needed. Node's experimental VM-module parser is used
only for syntax checks; scripts are not executed. This is not a browser
interaction test: runtime errors, computed dynamic imports, third-party
scripts, and visual behavior still need a browser check. Dynamic routes must
be given concrete test URLs when they are added.

`npm run test:smoke` tests the checker itself against isolated HTTP fixtures,
including failed routes, failed script transforms, and TypeScript accidentally
left inside an inline browser script.