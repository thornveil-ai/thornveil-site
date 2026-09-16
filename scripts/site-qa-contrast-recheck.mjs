// Focused computed-contrast recheck for the four cofounder hero metadata labels.
// This script owns Chromium on CDP 9225 and never attaches to another port.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';

const CDP_PORT = 9225;
const PROFILE_DIR = '/tmp/qa-contrast';
const OUTPUT = 'docs/site-qa-evidence/contrast-recheck.json';
const ROUTE = '/cofounder';
const SELECTOR = '.cofounder-hero dt';
const EXPECTED_LABELS = ['Company', 'Location', 'Stage', 'Start'];
const VIEWPORTS = [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];
const STABILITY_WAIT_MS = 300;
const STABILITY_TIMEOUT_MS = 120000;

const origin = process.env.SITE_QA_ORIGIN || (
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null
);
if (!origin) throw new Error('REPLIT_DEV_DOMAIN (or SITE_QA_ORIGIN) is required');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const stabilityProbeSource = `(() => {
  const labels = [...document.querySelectorAll(${JSON.stringify(SELECTOR)})];
  const rows = labels.map(element => {
    const rect = element.getBoundingClientRect();
    const ancestors = [];
    let fullOpacity = true;
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      const opacity = Number(style.opacity);
      ancestors.push({ element: node.tagName.toLowerCase(), opacity });
      if (opacity !== 1) fullOpacity = false;
    }
    const targetNodes = new Set();
    for (let node = element; node; node = node.parentElement) targetNodes.add(node);
    const targetAnimations = document.getAnimations().filter(animation => {
      const target = animation.effect?.target;
      return targetNodes.has(target) && animation.playState === 'running';
    }).length;
    return {
      text: element.textContent.trim(),
      color: getComputedStyle(element).color,
      rect: {
        x: Number(rect.x.toFixed(3)),
        y: Number(rect.y.toFixed(3)),
        width: Number(rect.width.toFixed(3)),
        height: Number(rect.height.toFixed(3)),
      },
      inViewport: rect.width > 0 && rect.height > 0 &&
        rect.bottom > 0 && rect.right > 0 &&
        rect.top < innerHeight && rect.left < innerWidth,
      fullOpacity,
      targetAnimations,
      ancestors,
    };
  });
  const ready = document.readyState === 'complete' &&
    (document.fonts?.status ?? 'loaded') === 'loaded' &&
    labels.length === ${EXPECTED_LABELS.length} &&
    rows.every(row => row.inViewport && row.fullOpacity && row.targetAnimations === 0);
  return {
    ready,
    documentReadyState: document.readyState,
    fontsStatus: document.fonts?.status ?? null,
    labels: rows,
  };
})()`;

const contrastMeasurementSource = `(() => {
  const parseColor = value => {
    if (!value || value === 'transparent') return null;
    const match = value.match(/^rgba?\\((.*)\\)$/i);
    if (!match) return null;
    const values = match[1].replace('/', ' ').split(/[ ,]+/).filter(Boolean);
    if (values.length < 3) return null;
    const channel = part => part.endsWith('%')
      ? Number.parseFloat(part) * 2.55
      : Number.parseFloat(part);
    const alpha = values[3] === undefined ? 1 :
      (values[3].endsWith('%')
        ? Number.parseFloat(values[3]) / 100
        : Number.parseFloat(values[3]));
    const color = {
      r: channel(values[0]),
      g: channel(values[1]),
      b: channel(values[2]),
      a: alpha,
    };
    return [color.r, color.g, color.b, color.a].every(Number.isFinite) ? color : null;
  };
  const luminance = color => {
    const channel = value => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(color.r) +
      0.7152 * channel(color.g) +
      0.0722 * channel(color.b);
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
  const pathFor = element => {
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
  const opaqueBackground = element => {
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
  const text2 = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-2').trim();
  const labels = [...document.querySelectorAll(${JSON.stringify(SELECTOR)})];
  const rows = labels.map(element => {
    const style = getComputedStyle(element);
    const source = parseColor(style.color);
    const background = opaqueBackground(element);
    const ancestors = [];
    let ancestorOpacity = 1;
    for (let node = element; node; node = node.parentElement) {
      const opacity = Number(getComputedStyle(node).opacity);
      ancestors.push({ element: node.tagName.toLowerCase(), opacity });
      ancestorOpacity *= opacity;
    }
    const rect = element.getBoundingClientRect();
    const row = {
      text: element.textContent.trim(),
      element: pathFor(element),
      color: style.color,
      customProperty: '--text-2',
      customPropertyValue: text2,
      background: background?.css ?? null,
      backgroundElement: background?.element ?? null,
      fontSizePx: Number.parseFloat(style.fontSize),
      fontWeight: Number.parseInt(style.fontWeight, 10) || 400,
      fullOpacity: ancestorOpacity === 1,
      ancestorOpacity,
      ancestorOpacities: ancestors,
      inViewport: rect.width > 0 && rect.height > 0 &&
        rect.bottom > 0 && rect.right > 0 &&
        rect.top < innerHeight && rect.left < innerWidth,
    };
    if (!source) {
      row.status = 'unresolved';
      row.reason = 'unsupported-computed-foreground-color';
    } else if (!background) {
      row.status = 'unresolved';
      row.reason = 'no-opaque-computed-background';
    } else if (!row.fullOpacity) {
      row.status = 'unresolved';
      row.reason = 'non-opaque-ancestor';
    } else {
      const foreground = blend(source, background.color, source.a * ancestorOpacity);
      const ratio = contrastRatio(foreground, background.color);
      const large = row.fontSizePx >= 24 ||
        (row.fontSizePx >= 18.66 && row.fontWeight >= 700);
      row.effectiveForeground = 'rgb(' + Math.round(foreground.r) + ', ' +
        Math.round(foreground.g) + ', ' + Math.round(foreground.b) + ')';
      row.ratio = ratio;
      row.largeText = large;
      row.threshold = large ? 3 : 4.5;
      row.status = ratio >= row.threshold ? 'pass' : 'fail';
    }
    return row;
  });
  const analyzed = rows.filter(row => row.status !== 'unresolved');
  return {
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    text2,
    selector: ${JSON.stringify(SELECTOR)},
    expectedLabels: ${JSON.stringify(EXPECTED_LABELS)},
    visibleTargetLabels: rows.filter(row => row.inViewport).length,
    fullOpacityTargetLabels: rows.filter(row => row.fullOpacity).length,
    analyzedTargetLabels: analyzed.length,
    unresolvedTargetLabels: rows.length - analyzed.length,
    passingTargetLabels: analyzed.filter(row => row.status === 'pass').length,
    failingTargetLabels: analyzed.filter(row => row.status === 'fail').length,
    rows,
  };
})()`;

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
  let id = 0;
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const callback = pending.get(message.id);
    if (!callback) return;
    pending.delete(message.id);
    message.error
      ? callback.reject(new Error(JSON.stringify(message.error)))
      : callback.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails));
    }
    return result.result?.value;
  };
  return { socket, send, evaluate };
}

async function waitForPageReady(connection) {
  const started = Date.now();
  while (Date.now() - started < STABILITY_TIMEOUT_MS) {
    const state = await connection.evaluate(stabilityProbeSource);
    if (
      state.documentReadyState === 'complete' &&
      state.fontsStatus !== 'loading' &&
      state.labels.length === EXPECTED_LABELS.length
    ) {
      return state;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${ROUTE} document readiness`);
}

async function waitForStableLabels(connection) {
  const started = Date.now();
  let scrollAdjustment = false;
  while (Date.now() - started < STABILITY_TIMEOUT_MS) {
    const state = await connection.evaluate(stabilityProbeSource);
    if (state.labels.length === EXPECTED_LABELS.length &&
        state.labels.some(row => !row.inViewport)) {
      await connection.evaluate(`document.querySelector(${JSON.stringify(SELECTOR)})?.scrollIntoView({ block: 'center', inline: 'nearest' })`);
      scrollAdjustment = true;
      await sleep(100);
      continue;
    }
    if (state.ready) {
      await sleep(STABILITY_WAIT_MS);
      const settled = await connection.evaluate(stabilityProbeSource);
      if (settled.ready &&
          JSON.stringify(settled.labels) === JSON.stringify(state.labels)) {
        return {
          elapsedMs: Date.now() - started,
          stabilityWaitMs: STABILITY_WAIT_MS,
          scrollAdjustment,
          state: settled,
        };
      }
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for stable full opacity on ${SELECTOR}`);
}

const browserPath = process.env.CHROMIUM_BIN ||
  process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'chromium';
const capturedAt = new Date().toISOString();
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

const report = {
  schemaVersion: 1,
  purpose: 'Focused recheck of the corrected four cofounder hero dt labels at desktop widths.',
  capturedAt,
  completedAt: null,
  gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  origin,
  originKind: 'managed development origin',
  production: false,
  browserControl: {
    protocol: 'CDP',
    port: CDP_PORT,
    profile: PROFILE_DIR,
    ownedChromium: true,
    otherDevToolsPortsTouched: [],
  },
  target: {
    route: ROUTE,
    selector: SELECTOR,
    labels: EXPECTED_LABELS,
    cssCorrection: 'color: var(--text-2)',
    normalTextThreshold: 4.5,
    backgroundMethod: 'nearest computed solid opaque ancestor background',
    fullOpacityRequirement: 'All target ancestors must have computed opacity 1; target animations must be idle.',
  },
  viewports: VIEWPORTS,
  methodology: {
    waitFor: [
      'document.readyState === complete',
      'document.fonts.status === loaded',
      'all four target labels are rendered in the viewport',
      'all target ancestors have computed opacity 1',
      'target animations are idle',
    ],
    stabilityWaitMs: STABILITY_WAIT_MS,
    note: 'Only the four .cofounder-hero dt labels are measured; this is not a whole-site contrast audit.',
  },
  browser: null,
  results: [],
  limits: [
    'This focused check measures only the four cofounder hero metadata labels at the two recorded desktop widths.',
    'It does not count or assess other text, pseudo-elements, canvas/WebGL text, focus/hover-only states, or responsive branches outside these viewports.',
    'The contrast ratio uses computed CSS colors and the nearest computed solid opaque ancestor background; complex compositing is not guessed.',
  ],
};

let connection;
try {
  await waitForEndpoint(browser);
  const targets = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then(response => response.json());
  const target = targets.find(item => item.type === 'page');
  if (!target?.webSocketDebuggerUrl) {
    throw new Error('No page target was exposed by the owned Chromium');
  }
  connection = createConnection(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    connection.socket.addEventListener('open', resolve, { once: true });
    connection.socket.addEventListener('error', reject, { once: true });
  });
  await connection.send('Page.enable');
  await connection.send('Runtime.enable');
  await connection.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  report.browser = await connection.send('Browser.getVersion');

  for (const viewport of VIEWPORTS) {
    await connection.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const navigation = await connection.send('Page.navigate', {
      url: `${origin}${ROUTE}`,
    });
    await waitForPageReady(connection);
    await connection.evaluate('document.fonts?.ready');
    await connection.evaluate('scrollTo({ top: 0, left: 0, behavior: "instant" })');
    const stable = await waitForStableLabels(connection);
    const measurement = await connection.evaluate(contrastMeasurementSource);
    const labelsMatch = JSON.stringify(measurement.rows.map(row => row.text)) ===
      JSON.stringify(EXPECTED_LABELS);
    const allPassed = measurement.rows.length === EXPECTED_LABELS.length &&
      measurement.rows.every(row => row.status === 'pass' &&
        row.color === 'rgb(152, 164, 176)' &&
        row.fullOpacity &&
        row.inViewport);
    const result = {
      viewport,
      url: `${origin}${ROUTE}`,
      navigationError: navigation?.errorText ?? null,
      stable,
      measurement,
      labelsMatch,
      allPassed,
    };
    report.results.push(result);
    await writeFile(OUTPUT, JSON.stringify(report, null, 2));
    console.log(`${viewport.name}: labels=${measurement.rows.length} ratios=${measurement.rows.map(row => row.ratio).join(',')} passed=${allPassed}`);
    if (!labelsMatch || !allPassed) {
      throw new Error(`Contrast recheck failed at ${viewport.name}`);
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