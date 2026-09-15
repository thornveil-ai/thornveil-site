import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readdir } from 'node:fs/promises';
import { Script, SourceTextModule } from 'node:vm';
import { setTimeout as delay } from 'node:timers/promises';

// No browser or extra packages required. Parse modules without executing DOM code.
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--url')) {
  throw new Error('Usage: npm run check:smoke [-- --url http://host:port]');
}
const base = new URL(args[1] || 'http://127.0.0.1:5055');
let server;
let logs = '';
const checked = new Set();

async function request(url, status = 200) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  if (response.status === 504 && /Outdated Optimize Dep/i.test(response.statusText)) {
    const error = new Error(`${url}: Vite optimized dependencies changed`);
    error.code = 'STALE_VITE_DEPS';
    throw error;
  }
  if (response.status !== status) {
    throw new Error(`${url}: expected HTTP ${status}, got ${response.status}\n${body.slice(0, 1000)}`);
  }
  if ((response.headers.get('content-type') || '').includes('text/html') &&
      /<vite-error-overlay\b|<title>Internal Server Error<\/title>/i.test(body)) {
    throw new Error(`${url}: dev-server error page returned`);
  }
  return { body, type: response.headers.get('content-type') || '' };
}

async function moduleSource(source, url) {
  let module;
  try {
    module = new SourceTextModule(source, { identifier: url.href });
  } catch (error) {
    throw new Error(`Invalid browser JavaScript at ${url}: ${error.message}`);
  }
  for (const specifier of module.dependencySpecifiers) {
    if (!/^(\/|\.\/|\.\.\/|https?:)/.test(specifier)) {
      throw new Error(`Unresolved browser import "${specifier}" at ${url}`);
    }
    await checkModule(new URL(specifier, url));
  }
}

async function checkModule(url) {
  if (url.origin !== base.origin || checked.has(url.href)) return;
  checked.add(url.href);
  const { body, type } = await request(url);
  if (!/javascript/.test(type)) {
    throw new Error(`${url}: expected JavaScript, got ${type}`);
  }
  await moduleSource(body, url);
}

function attribute(attributes, name) {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]).replaceAll('&amp;', '&') : undefined;
}

async function checkPage(path, status = 200) {
  const url = new URL(path, base);
  const { body, type } = await request(url, status);
  if (!type.includes('text/html') || !/<html[\s>]/i.test(body)) {
    throw new Error(`${path}: expected an HTML document`);
  }
  let index = 0;
  for (const match of body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const [, attributes, source] = match;
    const kind = attribute(attributes, 'type');
    if (kind && !['module', 'text/javascript', 'application/javascript'].includes(kind)) continue;
    const src = attribute(attributes, 'src');
    const scriptUrl = new URL(src || `#inline-${++index}`, url);
    if (src) await checkModule(scriptUrl);
    else if (kind === 'module') await moduleSource(source, scriptUrl);
    else {
      try {
        new Script(source, { filename: scriptUrl.href });
      } catch (error) {
        throw new Error(`Invalid inline browser JavaScript at ${scriptUrl}: ${error.message}`);
      }
    }
  }
  // Hydrated Astro islands load these modules dynamically rather than via imports.
  for (const match of body.matchAll(/<astro-island\b([^>]*)>/gi)) {
    for (const name of ['component-url', 'renderer-url']) {
      const src = attribute(match[1], name);
      if (src) await checkModule(new URL(src, url));
    }
  }
  console.log(`PASS ${path} (HTTP ${status})`);
}

async function startServer() {
  server = spawn(process.execPath, [
    'node_modules/astro/bin/astro.mjs', 'dev',
    '--host', '127.0.0.1', '--port', '5055',
  ], {
    env: { ...process.env, ASTRO_DEV_BACKGROUND: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.on('error', error => { logs += error.message; });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on('data', chunk => { logs = (logs + chunk).slice(-30000); });
  }
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null || server.signalCode) throw new Error(`Dev server exited:\n${logs}`);
    if (/EADDRINUSE|already in use/i.test(logs)) throw new Error('Smoke port 5055 is busy. Stop its owner or use --url.');
    // Wait for this process, not an unrelated server already listening on the port.
    if (/Local\s+http/.test(logs)) return;
    await delay(500);
  }
  throw new Error(`Dev server did not become ready:\n${logs}`);
}

try {
  if (!args.length) await startServer();
  const pages = await readdir(new URL('../src/pages/', import.meta.url), { recursive: true });
  const routes = pages.filter(page => page.endsWith('.astro') && !page.includes('[') && page !== '404.astro')
    .map(page => '/' + page.replace(/\.astro$/, '').replace(/(^|\/)index$/, '$1'));
  for (const route of routes.sort()) {
    for (let attempt = 0; ; attempt++) {
      try {
        await checkPage(route);
        break;
      } catch (error) {
        // Like a browser reload after Vite's initial dependency optimization.
        // Never retry actual transform, syntax, or HTTP failures.
        if (error.code !== 'STALE_VITE_DEPS' || attempt >= 2) throw error;
        checked.clear();
        await delay(1000);
      }
    }
  }
  await checkPage('/__smoke_missing_page__', 404);
  console.log(`Smoke check passed: ${routes.length} public routes, custom 404, ${checked.size} local JavaScript modules.`);
} catch (error) {
  console.error(`Smoke check FAILED: ${error.message}`);
  if (server) console.error(logs);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null && !server.signalCode) {
    const exited = once(server, 'exit');
    server.kill('SIGTERM');
    const timer = setTimeout(() => server.kill('SIGKILL'), 5000);
    await exited;
    clearTimeout(timer);
  }
}