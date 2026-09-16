// Real-browser performance and computed text-contrast evidence.
// This script owns Chromium on CDP 9224; it never attaches to other ports.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const CDP_PORT = 9224;
const PROFILE_DIR = '/tmp/qa-performance';
const OUTPUT = 'docs/site-qa-evidence/performance.json';
const origin = process.env.SITE_QA_ORIGIN || (
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null
);
if (!origin) throw new Error('REPLIT_DEV_DOMAIN (or SITE_QA_ORIGIN) is required');

const performanceRoutes = ['/', '/mycelium'];
const publicRoutes = [
  '/', '/systems', '/defense', '/mycelium', '/research',
  '/about', '/cofounder', '/contact', '/privacy', '/404',
];
const samplesPerRoute = 3;
const stabilityWindowMs = 2000;
const mobileProfile = {
  viewport: { width: 390, height: 844, deviceScaleFactor: 1, mobile: true },
  network: {
    name: 'Slow 4G',
    downloadThroughputBytesPerSecond: 200000,
    uploadThroughputBytesPerSecond: 93750,
    latencyMs: 150,
    connectionType: 'cellular4g',
  },
  cpuThrottlingRate: 4,
};
const contrastViewports = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];

const observerSource = `(() => {
  const metric = { fcp: null, lcp: null, cls: 0, layoutShiftCount: 0 };
  window.__siteQaMetrics = metric;
  const first = (entries) => {
    for (const entry of entries) {
      if (entry.name === 'first-contentful-paint' && metric.fcp === null) {
        metric.fcp = entry.startTime;
      }
    }
  };
  const largest = (entries) => {
    for (const entry of entries) {
      const value = entry.renderTime > 0 ? entry.renderTime :
        (entry.loadTime > 0 ? entry.loadTime : entry.startTime);
      if (metric.lcp === null || value >= metric.lcp) metric.lcp = value;
    }
  };
  const shifts = (entries) => {
    for (const entry of entries) {
      metric.layoutShiftCount += 1;
      if (!entry.hadRecentInput) metric.cls += entry.value;
    }
  };
  try {
    if (PerformanceObserver.supportedEntryTypes.includes('paint')) {
      new PerformanceObserver(list => first(list.getEntries())).observe({
        type: 'paint', buffered: true,
      });
    }
  } catch {}
  try {
    if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
      new PerformanceObserver(list => largest(list.getEntries())).observe({
        type: 'largest-contentful-paint', buffered: true,
      });
    }
  } catch {}
  try {
    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      new PerformanceObserver(list => shifts(list.getEntries())).observe({
        type: 'layout-shift', buffered: true,
      });
    }
  } catch {}
  addEventListener('load', () => {
    metric.loadEventObservedAt = performance.now();
  }, { once: true });
})();`;

const contrastSource = `(() => {
  const parseColor = (value) => {
    if (!value || value === 'transparent') return null;
    const match = value.match(/^rgba?\\((.*)\\)$/i);
    if (!match) return null;
    const values = match[1].replace('/', ' ').split(/[ ,]+/).filter(Boolean);
    if (values.length < 3) return null;
    const channel = (part) => part.endsWith('%')
      ? Number.parseFloat(part) * 2.55 : Number.parseFloat(part);
    const alpha = values[3] === undefined ? 1 :
      (values[3].endsWith('%') ? Number.parseFloat(values[3]) / 100 : Number.parseFloat(values[3]));
    const color = { r: channel(values[0]), g: channel(values[1]), b: channel(values[2]), a: alpha };
    return [color.r, color.g, color.b, color.a].every(Number.isFinite) ? color : null;
  };
  const luminance = (color) => {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  };
  const contrastRatio = (foreground, background) => {
    const light = Math.max(luminance(foreground), luminance(background));
    const dark = Math.min(luminance(foreground), luminance(background));
    return (light + 0.05) / (dark + 0.05);
  };
  const blend = (foreground, background, alpha) => ({
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  });
  const pathFor = (element) => {
    const parts = [];
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      let part = node.tagName.toLowerCase();
      if (node.id) part += '#' + node.id;
      else if (node.classList.length) {
        part += '.' + [...node.classList].slice(0, 2).join('.');
      }
      parts.unshift(part);
    }
    return parts.join(' > ') || 'body';
  };
  const visibleTextNode = (node) => {
    if (!node.textContent.trim()) return false;
    const range = document.createRange();
    range.selectNode(node);
    if (![...range.getClientRects()].some(rect => rect.width > 0 && rect.height > 0)) return false;
    for (let element = node.parentElement; element; element = element.parentElement) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
        return false;
      }
    }
    return true;
  };
  const opaqueBackground = (element) => {
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.filter !== 'none' || Number(style.opacity) !== 1) return null;
      const color = parseColor(style.backgroundColor);
      if (color && color.a >= 0.999) {
        return { color, css: style.backgroundColor, element: pathFor(node) };
      }
    }
    return null;
  };
  const rows = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!visibleTextNode(node)) continue;
    const element = node.parentElement;
    const style = getComputedStyle(element);
    const background = opaqueBackground(element);
    const text = node.textContent.trim().replace(/\\s+/g, ' ').slice(0, 180);
    const source = parseColor(style.color);
    const ancestorOpacity = [...(function* () {
      for (let parent = element; parent; parent = parent.parentElement) yield parent;
    })()].reduce((value, parent) => value * Number(getComputedStyle(parent).opacity), 1);
    const row = {
      text,
      element: pathFor(element),
      color: style.color,
      background: background?.css ?? null,
      backgroundElement: background?.element ?? null,
      fontSizePx: Number.parseFloat(style.fontSize),
      fontWeight: Number.parseInt(style.fontWeight, 10) || 400,
    };
    if (!source) {
      row.status = 'unresolved';
      row.reason = 'unsupported-computed-foreground-color';
    } else if (!background) {
      row.status = 'unresolved';
      row.reason = 'no-opaque-computed-background';
    } else if (!Number.isFinite(ancestorOpacity) || ancestorOpacity <= 0) {
      row.status = 'unresolved';
      row.reason = 'non-opaque-ancestor';
    } else {
      const foreground = blend(source, background.color, source.a * ancestorOpacity);
      const ratio = contrastRatio(foreground, background.color);
      const large = row.fontSizePx >= 24 || (row.fontSizePx >= 18.66 && row.fontWeight >= 700);
      row.effectiveForeground = 'rgb(' + Math.round(foreground.r) + ', ' +
        Math.round(foreground.g) + ', ' + Math.round(foreground.b) + ')';
      row.ratio = Number(ratio.toFixed(3));
      row.largeText = large;
      row.threshold = large ? 3 : 4.5;
      row.status = ratio >= row.threshold ? 'pass' : 'fail';
    }
    rows.push(row);
  }
  const analyzed = rows.filter(row => row.status !== 'unresolved');
  return {
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    visibleTextNodes: rows.length,
    analyzedTextNodes: analyzed.length,
    unresolvedTextNodes: rows.length - analyzed.length,
    passingTextNodes: analyzed.filter(row => row.status === 'pass').length,
    failingTextNodes: analyzed.filter(row => row.status === 'fail').length,
    minimumRatio: analyzed.length ? Math.min(...analyzed.map(row => row.ratio)) : null,
    rows,
  };
})()`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForEndpoint(browser) {
  let lastError = '';
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (browser.exitCode !== null) {
      throw new Error(`Chromium exited before CDP was ready: ${lastError}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error.message;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for CDP ${CDP_PORT}: ${lastError}`);
}

function createConnection(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const events = [];
  let id = 0;
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) {
      events.push(message);
      return;
    }
    const callback = pending.get(message.id);
    if (!callback) return;
    pending.delete(message.id);
    message.error ? callback.reject(new Error(JSON.stringify(message.error))) : callback.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, userGesture: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result?.value;
  };
  return { socket, events, send, evaluate };
}

async function waitForLoad(connection, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (connection.events.some(event => event.method === 'Page.loadEventFired')) {
      return { timedOut: false, waitedMs: Date.now() - started };
    }
    try {
      if (await connection.evaluate('document.readyState === "complete"')) {
        return { timedOut: false, waitedMs: Date.now() - started };
      }
    } catch {}
    await sleep(100);
  }
  return { timedOut: true, waitedMs: Date.now() - started };
}

async function clearColdState(connection) {
  await connection.send('Network.clearBrowserCache');
  await connection.send('Network.clearBrowserCookies');
  try {
    await connection.send('Storage.clearDataForOrigin', { origin, storageTypes: 'all' });
  } catch {
    // Storage.clearDataForOrigin is not available in a few older Chromium builds.
    // The HTTP cache and cookies are still cleared above and cache is disabled below.
  }
}

function summarizeNetwork(events) {
  const current = new Map();
  const records = [];
  for (const event of events) {
    const params = event.params || {};
    const requestId = params.requestId;
    if (!requestId) continue;
    if (event.method === 'Network.requestWillBeSent') {
      const previous = current.get(requestId);
      const record = {
        requestId,
        url: params.request?.url,
        method: params.request?.method,
        resourceType: params.type || null,
        status: null,
        mimeType: null,
        fromDiskCache: false,
        fromServiceWorker: false,
        transferBytes: null,
        finished: false,
        failed: false,
      };
      if (previous?.finished) records.push(previous);
      current.set(requestId, record);
    } else if (event.method === 'Network.responseReceived') {
      const record = current.get(requestId);
      if (!record) continue;
      record.status = params.response?.status ?? null;
      record.mimeType = params.response?.mimeType ?? null;
      record.fromDiskCache = Boolean(params.response?.fromDiskCache);
      record.fromServiceWorker = Boolean(params.response?.fromServiceWorker);
    } else if (event.method === 'Network.loadingFinished') {
      const record = current.get(requestId);
      if (!record) continue;
      record.transferBytes = Number(params.encodedDataLength) || 0;
      record.finished = true;
    } else if (event.method === 'Network.loadingFailed') {
      const record = current.get(requestId);
      if (!record) continue;
      record.failed = true;
      record.errorText = params.errorText || null;
    }
  }
  records.push(...current.values());
  const finished = records.filter(record => record.finished);
  return {
    transferredBytes: finished.reduce((sum, record) => sum + record.transferBytes, 0),
    requests: records.length,
    finishedRequests: finished.length,
    failedRequests: records.filter(record => record.failed).length,
    httpErrors: records.filter(record => record.status >= 400).map(record => ({
      url: record.url, status: record.status, resourceType: record.resourceType,
    })),
    records,
  };
}

async function collectLoad(connection, route, sample) {
  await clearColdState(connection);
  connection.events.length = 0;
  const url = `${origin}${route}`;
  const navigation = await connection.send('Page.navigate', { url });
  const loadWait = await waitForLoad(connection);
  await sleep(stabilityWindowMs);
  const observed = await connection.evaluate(`(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByName('first-contentful-paint')[0];
    const lcpEntry = performance.getEntriesByType('largest-contentful-paint').at(-1);
    const observedUntilMs = performance.now();
    const metric = window.__siteQaMetrics || {};
    return {
      navigationStartMs: navigationEntry?.startTime ?? 0,
      loadEventEndMs: navigationEntry?.loadEventEnd ?? null,
      observedUntilMs,
      fcpMs: metric.fcp ?? paint?.startTime ?? null,
      lcpMs: metric.lcp ?? (lcpEntry ? (lcpEntry.renderTime || lcpEntry.loadTime || lcpEntry.startTime) : null),
      cls: Number(metric.cls ?? 0),
      layoutShiftCount: metric.layoutShiftCount ?? 0,
      documentReadyState: document.readyState,
      fontsStatus: document.fonts?.status ?? null,
      href: location.href,
    };
  })()`);
  const network = summarizeNetwork(connection.events);
  return {
    route,
    sample,
    url,
    navigationId: navigation?.frameId ?? null,
    navigationError: navigation?.errorText ?? null,
    loadWait,
    metricWindow: {
      startsAt: 'navigationStart',
      endsAt: 'observedUntilMs',
      stabilityAfterLoadMs: stabilityWindowMs,
      note: 'Metrics are observed from navigationStart through the actual read taken after load plus the stability window.',
    },
    ...observed,
    load: network,
  };
}

async function navigateForContrast(connection, route) {
  await clearColdState(connection);
  connection.events.length = 0;
  const navigation = await connection.send('Page.navigate', { url: `${origin}${route}` });
  const loadWait = await waitForLoad(connection);
  await sleep(500);
  try {
    await connection.evaluate('document.fonts?.ready');
  } catch {}
  const contrast = await connection.evaluate(contrastSource);
  return {
    route,
    url: `${origin}${route}`,
    navigationError: navigation?.errorText ?? null,
    loadWait,
    ...contrast,
  };
}

const browserPath = process.env.CHROMIUM_BIN ||
  process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'chromium';
const measurementStartedAt = new Date().toISOString();
await mkdir('docs/site-qa-evidence', { recursive: true });
await rm(PROFILE_DIR, { recursive: true, force: true });
await mkdir(PROFILE_DIR, { recursive: true });

const browser = spawn(browserPath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${PROFILE_DIR}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let browserStderr = '';
browser.stderr.on('data', data => { browserStderr += data.toString(); });

let connection;
try {
  const endpoint = await waitForEndpoint(browser);
  const targets = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then(response => response.json());
  const target = targets.find(item => item.type === 'page');
  if (!target?.webSocketDebuggerUrl) throw new Error('No page target was exposed by the owned Chromium');
  connection = createConnection(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    connection.socket.addEventListener('open', resolve, { once: true });
    connection.socket.addEventListener('error', reject, { once: true });
  });
  await connection.send('Page.enable');
  await connection.send('Runtime.enable');
  await connection.send('Network.enable');
  await connection.send('Performance.enable');
  await connection.send('Page.addScriptToEvaluateOnNewDocument', { source: observerSource });
  await connection.send('Network.setCacheDisabled', { cacheDisabled: true });
  await connection.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: mobileProfile.network.latencyMs,
    downloadThroughput: mobileProfile.network.downloadThroughputBytesPerSecond,
    uploadThroughput: mobileProfile.network.uploadThroughputBytesPerSecond,
    connectionType: mobileProfile.network.connectionType,
  });
  await connection.send('Emulation.setCPUThrottlingRate', {
    rate: mobileProfile.cpuThrottlingRate,
  });
  await connection.send('Emulation.setDeviceMetricsOverride', mobileProfile.viewport);
  await connection.send('Emulation.setTouchEmulationEnabled', { enabled: true });

  const browserVersion = await connection.send('Browser.getVersion');
  const report = {
    schemaVersion: 1,
    capturedAt: measurementStartedAt,
    completedAt: null,
    gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    origin,
    originKind: 'managed development origin',
    production: false,
    productionDisclaimer: 'This is dev-origin evidence, not a production measurement or performance score.',
    hostContention: {
      workflowRestart: {
        at: '2026-09-16T00:14:30Z',
        note: 'The workflow restart reported by the operator preceded this measurement run; samples were not intentionally carried across that restart.',
      },
      concurrentBrowser: {
        note: 'The existing site-qa-matrix browser was concurrently scrolling routes during this run.',
        impact: 'Shared host CPU, memory, and network contention may inflate observed timings; this run does not claim an isolated host.',
      },
      isolation: 'This script used only owned Chromium CDP port 9224 and did not contact ports 9222 or 9223.',
    },
    browser: browserVersion,
    browserControl: {
      protocol: 'CDP',
      port: CDP_PORT,
      profile: PROFILE_DIR,
      ownedChromium: true,
      otherDevToolsPortsTouched: [],
    },
    performance: {
      routes: performanceRoutes,
      samplesPerRoute,
      coldCache: {
        beforeEverySample: ['Network.clearBrowserCache', 'Network.clearBrowserCookies', 'Storage.clearDataForOrigin'],
        cacheDisabled: true,
        note: 'Each sample starts with a cleared HTTP/browser storage cache; DNS/TLS/connection reuse is not claimed to be cold.',
      },
      profile: mobileProfile,
      metrics: {
        fcp: 'first-contentful-paint startTime, milliseconds after navigationStart',
        lcp: 'last observed largest-contentful-paint renderTime/loadTime/startTime, milliseconds after navigationStart',
        cls: 'sum of layout-shift values without recent input during the observation window',
        transferredBytes: 'sum of Network.loadingFinished.encodedDataLength for requests started by this navigation and finished by the observation read',
        observationWindow: `navigationStart through the actual read after load plus ${stabilityWindowMs}ms`,
      },
      samples: [],
    },
    contrast: {
      routes: publicRoutes,
      viewports: contrastViewports,
      tool: existsSync('node_modules/axe-core') ? 'computed-style browser evaluation; axe-core installed but not run' : 'computed-style browser evaluation; axe-core not installed',
      limits: [
        'Only visible text nodes rendered at the recorded viewport are included.',
        'The nearest computed solid opaque background is used; gradients, images, transparency, filters, and text over complex compositing are unresolved rather than guessed.',
        'The calculation uses computed CSS colors and WCAG 2.x relative luminance thresholds (4.5 normal text, 3 large text); it is not an axe-core audit.',
        'Pseudo-elements, canvas/WebGL text, focus/hover-only states, and unrendered responsive branches are not covered.',
      ],
      results: [],
    },
  };

  for (const route of performanceRoutes) {
    for (let sample = 1; sample <= samplesPerRoute; sample += 1) {
      const result = await collectLoad(connection, route, sample);
      report.performance.samples.push(result);
      console.log(`${route} sample ${sample}: FCP=${result.fcpMs} LCP=${result.lcpMs} CLS=${result.cls} bytes=${result.load.transferredBytes}`);
      await writeFile(OUTPUT, JSON.stringify(report, null, 2));
    }
  }

  for (const viewport of contrastViewports) {
    await connection.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });
    for (const route of publicRoutes) {
      const result = await navigateForContrast(connection, route);
      report.contrast.results.push({ viewport: viewport.name, ...result });
      console.log(`${viewport.name} ${route}: contrast rows=${result.visibleTextNodes} unresolved=${result.unresolvedTextNodes} failing=${result.failingTextNodes}`);
      await writeFile(OUTPUT, JSON.stringify(report, null, 2));
    }
  }
  report.completedAt = new Date().toISOString();
  await writeFile(OUTPUT, JSON.stringify(report, null, 2));
} finally {
  connection?.socket.close();
  browser.kill();
  await new Promise(resolve => {
    if (browser.exitCode !== null) resolve();
    else browser.once('exit', resolve);
  });
  if (browserStderr && process.env.SITE_QA_DEBUG) console.error(browserStderr);
}