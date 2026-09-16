import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readdir } from 'node:fs/promises';
import vm from 'node:vm';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
const { Script, SourceTextModule } = vm;

// No browser or extra packages required. Parse modules without executing DOM code.
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--url')) {
  throw new Error('Usage: npm run check:smoke [-- --url http://host:port]');
}
const base = new URL(args[1] || 'http://127.0.0.1:5055');
let server;
const checked = new Set();

async function request(url, status = 200) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  if (response.status === 504 && (
    /\bOutdated Optimize Dep\b/i.test(response.statusText) ||
    /\bOutdated Optimize Dep\b|\bERR_OUTDATED_OPTIMIZED_DEP\b/.test(body) ||
    /There is a new version of the pre-bundle for "[^"\n]+", a page reload is going to ask for it\./.test(body)
  )) {
    const error = new Error(`${url}: Vite optimized dependencies changed (HTTP 504; stale retry limit may be exhausted)`);
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

export async function startServer({
  command = process.execPath,
  argv = [
    'node_modules/astro/bin/astro.mjs', 'dev',
    '--ignore-lock', '--host', '127.0.0.1', '--port', '5055',
  ],
  readyTimeout = 60000,
  killTimeout = 5000,
} = {}) {
  let logs = '';
  let spawnError;
  const child = spawn(command, argv, {
    env: { ...process.env, ASTRO_DEV_BACKGROUND: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.on('error', error => { spawnError = error; });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', chunk => { logs = (logs + chunk).slice(-30000); });
  }
  let stopping;
  const stop = () => stopping ??= (async () => {
    if (!child.pid || child.exitCode !== null || child.signalCode) return;
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), killTimeout);
    try { await exited; } finally { clearTimeout(timer); }
  })();
  const onSignal = signal => {
    void stop().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  const cleanup = async () => {
    await stop();
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
  };
  try {
    const deadline = Date.now() + readyTimeout;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode) throw new Error(`Dev server exited:\n${logs}`);
      if (/EADDRINUSE|already in use/i.test(logs)) throw new Error(`Smoke port 5055 is busy. Stop its owner or use --url.\n${logs}`);
      // Require our exact port: Astro can otherwise silently choose another.
      if (/Local\s+http:\/\/127\.0\.0\.1:5055(?:\/|\s|$)/.test(logs)) {
        return { stop: cleanup, getLogs: () => logs, pid: child.pid };
      }
      await delay(100);
    }
    throw new Error(`Dev server did not become ready:\n${logs}`);
  } catch (error) {
    await cleanup();
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
try {
  if (!args.length) server = await startServer();
  const pages = await readdir(new URL('../src/pages/', import.meta.url), { recursive: true });
  const routes = pages.filter(page => page.endsWith('.astro') && !page.includes('[') && page !== '404.astro')
    .map(page => '/' + page.replace(/\.astro$/, '').replace(/(^|\/)index$/, '$1'));
  for (const [route, status] of [...routes.sort().map(route => [route, 200]), ['/__smoke_missing_page__', 404]]) {
    for (let attempt = 0; ; attempt++) {
      try {
        await checkPage(route, status);
        break;
      } catch (error) {
        // Like a browser reload after Vite's initial dependency optimization.
        // Never retry actual transform, syntax, or HTTP failures.
        if (error.code !== 'STALE_VITE_DEPS' || attempt >= 2) throw error;
        console.warn(`Retrying ${route}: outdated optimized dependency (${attempt + 1}/2)`);
        checked.clear();
        await delay(1000);
      }
    }
  }
  console.log(`Smoke check passed: ${routes.length} public routes, custom 404, ${checked.size} local JavaScript modules.`);
} catch (error) {
  console.error(`Smoke check FAILED: ${error.message}`);
  if (server) console.error(server.getLogs());
  process.exitCode = 1;
} finally {
  await server?.stop();
}
}