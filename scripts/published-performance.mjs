// Standalone live baseline. No application imports, builds, publishing, or dependencies.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir, loadavg, cpus } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const origin = new URL(process.env.PUBLISHED_PERFORMANCE_ORIGIN || 'https://thornveil.ai');
if (origin.protocol !== 'https:' || origin.hostname.endsWith('.replit.dev') ||
    origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
  throw new Error('Use a confirmed, public HTTPS production origin without credentials or path.');
}
const output = process.env.PUBLISHED_PERFORMANCE_OUTPUT || 'docs/published-performance-evidence.json';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const hash = text => createHash('sha256').update(text).digest('hex');
const profile = {
  viewport: { width: 390, height: 844, deviceScaleFactor: 1, mobile: true },
  network: { offline: false, latency: 150, downloadThroughput: 200000,
    uploadThroughput: 93750, connectionType: 'cellular4g' },
  cpuRate: 4, samplesPerRoute: 3, routes: ['/', '/mycelium'], afterLoadMs: 5000,
};
const observer = `(() => {
  const m = window.__publishedMetrics = { fcpMs: null, lcpMs: null, cls: 0, shifts: [], lcpElement: null };
  new PerformanceObserver(l => { for (const e of l.getEntries())
    if (e.name === 'first-contentful-paint') m.fcpMs = e.startTime;
  }).observe({ type: 'paint', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) {
    m.lcpMs = e.startTime;
    m.lcpElement = { tag: e.element?.tagName, id: e.element?.id,
      text: e.element?.textContent?.trim().slice(0, 180), url: e.url, size: e.size };
  }}).observe({ type: 'largest-contentful-paint', buffered: true });
  let start = 0, last = 0, value = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries()) {
    if (e.hadRecentInput) continue;
    if (e.startTime - last >= 1000 || e.startTime - start >= 5000) {
      start = e.startTime; value = 0;
    }
    value += e.value; last = e.startTime; m.cls = Math.max(m.cls, value);
    m.shifts.push({ at: e.startTime, value: e.value });
  }}).observe({ type: 'layout-shift', buffered: true });
})();`;

function connect(url) {
  const socket = new WebSocket(url), pending = new Map(), events = [];
  let id = 0;
  socket.addEventListener('message', ({ data }) => {
    const m = JSON.parse(data);
    if (!m.id) { events.push(m); return; }
    const p = pending.get(m.id);
    if (!p) return;
    pending.delete(m.id); clearTimeout(p.timer);
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    const timer = setTimeout(() => {
      pending.delete(key); reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
    pending.set(key, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  return { socket, send, evaluate, events };
}

async function sample(route, iteration) {
  const dir = await mkdtemp(join(tmpdir(), 'published-performance-'));
  const startedAt = new Date().toISOString(), hostLoad = loadavg();
  // A new process/profile per sample; ephemeral CDP port, never attach to another browser.
  const browser = spawn(process.env.CHROMIUM_BIN ||
    process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'chromium', [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '', spawnError;
  browser.stderr.on('data', d => { stderr += d; });
  browser.on('error', e => { spawnError = e; });
  let c;
  try {
    let endpoint;
    for (let i = 0; i < 150; i++) {
      if (spawnError) throw spawnError;
      if (browser.exitCode !== null) throw new Error(`Browser exited: ${stderr}`);
      endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
      if (endpoint) break;
      await sleep(100);
    }
    if (!endpoint) throw new Error('No owned browser endpoint');
    const base = new URL(endpoint);
    const targets = await fetch(`http://${base.host}/json`).then(r => r.json());
    c = connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      c.socket.addEventListener('open', resolve, { once: true });
      c.socket.addEventListener('error', reject, { once: true });
    });
    for (const domain of ['Page', 'Runtime', 'Network']) await c.send(`${domain}.enable`);
    const version = await c.send('Browser.getVersion');
    await c.send('Network.setUserAgentOverride', {
      userAgent: `Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version.product.split('/')[1]} Mobile Safari/537.36`,
      platform: 'Android',
    });
    await c.send('Network.setCacheDisabled', { cacheDisabled: true });
    await c.send('Network.setBypassServiceWorker', { bypass: true });
    await c.send('Network.emulateNetworkConditions', profile.network);
    await c.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate });
    await c.send('Emulation.setDeviceMetricsOverride', profile.viewport);
    await c.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: observer });
    c.events.length = 0;
    const nav = await c.send('Page.navigate', { url: new URL(route, origin).href });
    if (nav.errorText) throw new Error(nav.errorText);
    const deadline = Date.now() + 120000;
    while (!c.events.some(e => e.method === 'Page.loadEventFired')) {
      if (Date.now() > deadline) throw new Error('Navigation load timed out');
      await sleep(100);
    }
    await sleep(profile.afterLoadMs);
    const metrics = await c.evaluate(`({
      ...window.__publishedMetrics, observedUntilMs: performance.now(),
      href: location.href, title: document.title, readyState: document.readyState,
      fontsStatus: document.fonts.status, userAgent: navigator.userAgent,
      navigation: performance.getEntriesByType('navigation')[0].toJSON()
    })`);
    const requests = new Map();
    for (const { method, params: p } of c.events) {
      if (method === 'Network.responseReceived') requests.set(p.requestId, {
        url: p.response.url, type: p.type, status: p.response.status,
        mimeType: p.response.mimeType, fromDiskCache: p.response.fromDiskCache || false,
        fromServiceWorker: p.response.fromServiceWorker || false,
      });
      if (method === 'Network.loadingFinished' && requests.has(p.requestId))
        Object.assign(requests.get(p.requestId), { bytes: p.encodedDataLength, finished: true });
      if (method === 'Network.loadingFailed') {
        const r = requests.get(p.requestId) || {};
        Object.assign(r, { error: p.errorText }); requests.set(p.requestId, r);
      }
    }
    const documentResponse = c.events.find(e => e.method === 'Network.responseReceived' &&
      e.params.type === 'Document');
    if (!documentResponse || documentResponse.params.response.status !== 200 ||
        ![new URL(route, origin).href, new URL(`${route.replace(/\/$/, '')}/`, origin).href].includes(metrics.href) || metrics.fcpMs === null ||
        metrics.lcpMs === null) throw new Error('Invalid target response or missing paint metrics');
    const body = await c.send('Network.getResponseBody', { requestId: documentResponse.params.requestId });
    const headers = documentResponse.params.response.headers;
    const safeHeaders = Object.fromEntries(Object.entries(headers).filter(([k]) =>
      ['etag', 'last-modified', 'server', 'cache-control', 'cache-status', 'age', 'date'].includes(k.toLowerCase())));
    return { route, iteration, startedAt, version, hostLoad, ...metrics,
      documentIdentity: { sha256: hash(body.base64Encoded ? Buffer.from(body.body, 'base64') : body.body),
        headers: safeHeaders, releaseCommit: null },
      transferredBytes: [...requests.values()].reduce((n, r) => n + (r.bytes || 0), 0),
      requests: [...requests.values()],
      redirects: c.events.filter(e => e.method === 'Network.requestWillBeSent' && e.params.redirectResponse)
        .map(e => ({ url: e.params.redirectResponse.url, status: e.params.redirectResponse.status })),
    };
  } finally {
    c?.socket.close();
    browser.kill('SIGTERM');
    await Promise.race([new Promise(r => browser.once('exit', r)), sleep(3000)]);
    if (browser.exitCode === null) { browser.kill('SIGKILL'); await sleep(500); }
    await rm(dir, { recursive: true, force: true });
  }
}

const report = {
  startedAt: new Date().toISOString(), origin: origin.origin, profile,
  targetSource: 'Deployment service reports no Replit deployment; owner-confirmed external Netlify primary domain in docs/privacy-operations-review.md, Reported settings and limits.',
  identityWarning: 'Live-version baseline only. Document hashes/ETags are fingerprints, not verified release commits. Local changes are not assumed published.',
  localReferenceOnly: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  localStatus: execFileSync('git', ['status', '--short'], { encoding: 'utf8' }).trim(),
  host: { platform: process.platform, arch: process.arch, logicalCpus: cpus().length },
  cache: 'Fresh browser process and temporary profile for each sample; HTTP cache disabled, service workers bypassed. OS DNS and CDN cache are not flushed.',
  metricWindow: 'Navigation through load + 5000ms; no input/scroll. CLS is maximum session window (1s gap/5s maximum). Bytes sum completed CDP encodedDataLength, excluding incomplete/failed transfers and redirect bodies.',
  contention: 'Shared Replit host, not a calibrated phone. Host load averages recorded per sample; other work is not controlled.',
  samples: [],
};
await mkdir(dirname(output), { recursive: true });
async function save() { await writeFile(output, JSON.stringify(report, null, 2) + '\n'); }
try {
  for (let i = 1; i <= profile.samplesPerRoute; i++) {
    for (const route of profile.routes) {
      const row = await sample(route, i);
      report.samples.push(row); await save();
      console.log(JSON.stringify({ route, iteration: i, fcpMs: row.fcpMs,
        lcpMs: row.lcpMs, cls: row.cls, bytes: row.transferredBytes }));
    }
  }
  report.completedAt = new Date().toISOString();
  await save();
} catch (error) {
  report.error = error.message; await save(); throw error;
}