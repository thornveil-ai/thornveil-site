// Standalone CDP tests: no package changes and no shared browser/profile/port.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.env.REVEAL_TEST_ORIGIN || (process.env.REPLIT_DEV_DOMAIN && `https://${process.env.REPLIT_DEV_DOMAIN}`);
assert(origin, 'Set REVEAL_TEST_ORIGIN or REPLIT_DEV_DOMAIN');
assert(process.argv.slice(2).every(arg => arg === '--lifecycle-only'), 'Unknown argument');
const lifecycleOnly = process.argv.includes('--lifecycle-only');
const routes = ['/', '/systems', '/defense', '/mycelium', '/research', '/about', '/cofounder', '/contact', '/privacy', '/404'];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return; await sleep(100); }
  throw Error(`Timed out: ${label}`);
}
const profile = await mkdtemp(join(tmpdir(), 'reveal-regression-'));
const child = spawn(process.env.CHROMIUM_BIN || 'chromium', [
  '--headless', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let launchError, browserLog = '';
child.on('error', error => { launchError = error; });
child.stderr.on('data', chunk => { browserLog = (browserLog + chunk).slice(-4000); });
let socket, id = 0, blockedScripts = 0;
const pending = new Map();
const requestURLs = new Map();
const report = { capturedAt: new Date().toISOString(), scope: lifecycleOnly ? 'lifecycle-only' : 'full', origin, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), rows: [] };
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const key = ++id;
  const timer = setTimeout(() => { pending.delete(key); reject(Error(`CDP timeout: ${method}`)); }, 25000);
  pending.set(key, { resolve, reject, timer });
  socket.send(JSON.stringify({ id: key, method, params }));
});
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

// Installed before application modules. Does not change classes, opacity or CSS.
function instrument(mode) {
  const state = window.__revealTest = { observers: [], frames: [], swaps: 0, loads: 0, hold: false, injections: 0 };
  document.addEventListener('astro:after-swap', () => state.swaps++);
  document.addEventListener('astro:page-load', () => state.loads++);
  const NativeObserver = window.IntersectionObserver;
  if (mode === 'missing-observer') {
    delete window.IntersectionObserver;
    state.injections++;
  } else {
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options) {
        if (mode === 'throwing-constructor') { state.injections++; throw Error('Injected observer constructor failure'); }
        super(callback, options);
        this.record = { reveal: false, disconnected: false, targets: new Set() };
        state.observers.push(this.record);
      }
      observe(target) {
        this.record.reveal ||= target.matches('.reveal, .line-reveal');
        this.record.disconnected = false;
        this.record.targets.add(target);
        if (mode === 'throwing-observe' && this.record.reveal) {
          state.injections++;
          throw Error('Injected observe failure');
        }
        return super.observe(target);
      }
      unobserve(target) { this.record.targets.delete(target); return super.unobserve(target); }
      disconnect() { this.record.disconnected = true; this.record.targets.clear(); return super.disconnect(); }
    };
  }
  const raf = window.requestAnimationFrame.bind(window);
  const cancel = window.cancelAnimationFrame.bind(window);
  let insideRevealFrame = false;
  window.requestAnimationFrame = callback => {
    // Both the current nested paint callbacks and named reveal helpers are
    // recognized. A missing match fails coverage rather than silently passing.
    const reveal = insideRevealFrame || /reveal|no-transitions/i.test(String(callback) + new Error().stack);
    if (!reveal) return raf(callback);
    const record = { id: 0, nativeId: 0, cancelled: false, fired: false, held: state.hold };
    const invoke = time => {
      // Defer, rather than discard, the application callback. Keep a genuine
      // native frame pending until released or cancelled via the public ID.
      if (state.hold) { record.nativeId = raf(invoke); return; }
      record.fired = true;
      insideRevealFrame = true;
      try { callback(time); } finally { insideRevealFrame = false; }
    };
    record.id = record.nativeId = raf(invoke);
    state.frames.push(record);
    return record.id;
  };
  window.cancelAnimationFrame = id => {
    const record = state.frames.find(frame => frame.id === id);
    if (record && !record.fired) {
      record.cancelled = true;
      cancel(record.nativeId);
    } else cancel(id);
  };
}

async function visibility(sweep) {
  const height = await evaluate('document.documentElement.scrollHeight');
  for (let y = 0; sweep && y < height; y += 650) {
    await evaluate(`scrollTo({top:${y},behavior:'instant'})`);
    await sleep(50);
  }
  await sleep(1000);
  return evaluate(`(() => {
    const targets = [...document.querySelectorAll('main .reveal, main .line-reveal, main .line-reveal > *, main h1, main h2, main h3')];
    const failures = [];
    let checked = 0;
    for (const el of targets) {
      if (el.closest('details:not([open])') && !el.closest('summary')) continue;
      if (el.classList.contains('sr-only')) continue;
      const ancestors = []; for (let p = el; p; p = p.parentElement) ancestors.push(p);
      // Responsive branches are intentional; opacity/visibility never exempt.
      if (ancestors.some(p => getComputedStyle(p).display === 'none')) continue;
      checked++;
      const hidden = ancestors.some(p => {
        const s = getComputedStyle(p);
        return +s.opacity < .99 || s.visibility !== 'visible' || s.contentVisibility === 'hidden';
      }) || !el.getClientRects().length;
      if (hidden) failures.push((el.textContent.trim() || el.className).slice(0, 100));
    }
    return { checked, failures };
  })()`);
}

let initScript;
async function load(mode, route) {
  blockedScripts = 0;
  if (initScript) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: initScript });
  initScript = (await send('Page.addScriptToEvaluateOnNewDocument', { source: `(${instrument})(${JSON.stringify(mode)})` })).identifier;
  await send('Emulation.setScriptExecutionDisabled', { value: mode === 'no-js' });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: mode === 'reduced-motion' ? 'reduce' : 'no-preference' }] });
  await send('Network.setBlockedURLs', { urls: mode === 'module-failure' ? ['*.js*', '*.mjs*', '*astro&type=script*'] : [] });
  await send('Page.navigate', { url: new URL(route, origin).href });
  await until(() => evaluate(`location.pathname.replace(/\\/$/,'') === ${JSON.stringify(route.replace(/\/$/, ''))} && document.readyState !== 'loading' && !!document.querySelector('main h1')`), `load ${route}`);
  await sleep(1200);
}
async function test(name, fn) {
  try { const evidence = await fn(); report.rows.push({ name, pass: true, evidence }); console.log(`PASS ${name}`); }
  catch (error) { report.rows.push({ name, pass: false, error: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}

try {
  let port;
  await until(async () => {
    if (launchError) throw launchError;
    if (child.exitCode !== null) throw Error(`Chromium exited: ${browserLog}`);
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; return !!port; } catch { return false; }
  }, 'Chromium startup');
  const targets = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json());
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Network.requestWillBeSent') requestURLs.set(message.params.requestId, message.params.request.url);
    if (message.method === 'Network.loadingFailed' && message.params.type === 'Script' && message.params.blockedReason) {
      const url = requestURLs.get(message.params.requestId);
      if (url && new URL(url).origin === new URL(origin).origin && /astro|\/_astro\/|\/src\//.test(url)) blockedScripts++;
    }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id); clearTimeout(request.timer);
    message.error ? request.reject(Error(JSON.stringify(message.error))) : request.resolve(message.result);
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  report.browser = await send('Browser.getVersion');
  for (const mode of lifecycleOnly ? [] : ['normal', 'no-js', 'module-failure', 'missing-observer', 'throwing-constructor', 'throwing-observe', 'reduced-motion']) {
    for (const route of routes) await test(`${mode} ${route}`, async () => {
      await load(mode, route);
      if (mode === 'reduced-motion') {
        const reduced = await evaluate(`(() => {
          const nodes = [...document.querySelectorAll('.reveal, .line-reveal > *')];
          return {
            matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
            observers: window.__revealTest.observers.filter(o => o.reveal).length,
            hidden: nodes.filter(el => getComputedStyle(el).opacity !== '1').length,
            moving: nodes.filter(el => getComputedStyle(el).transitionDuration.split(',').some(t => parseFloat(t) > .001)).length
          };
        })()`);
        assert(reduced.matches && reduced.observers === 0 && reduced.hidden === 0 && reduced.moving === 0, JSON.stringify(reduced));
      }
      if (mode === 'missing-observer') assert.equal(await evaluate("typeof window.IntersectionObserver"), 'undefined');
      const data = await visibility(mode === 'normal');
      assert(data.checked > 0, 'No content checked');
      if (mode.includes('observer') || mode.startsWith('throwing')) {
        const injections = await evaluate('window.__revealTest.injections');
        // Static routes need not construct an observer; reveal routes must.
        const count = await evaluate("document.querySelectorAll('.reveal,.line-reveal').length");
        assert(!count || injections > 0, 'Failure injection was not exercised');
      }
      if (mode === 'module-failure') {
        assert(blockedScripts > 0, 'No script request was blocked');
        assert.equal(await evaluate('window.__revealTest.loads'), 0, 'Application router module unexpectedly ran');
      }
      assert.deepEqual(data.failures, [], 'Hidden content: ' + JSON.stringify(data.failures));
      return data;
    });
  }
  await test('observer and pending-frame cleanup across links, Back and Forward', async () => {
    await load('normal', '/systems');
    const evidence = [];
    const journey = [
      ['/research', '/research'], ['/privacy', '/privacy'], ['back', '/research'], ['forward', '/privacy'],
      ['/systems', '/systems'], ['/research', '/research'], ['back', '/systems'], ['forward', '/research'],
    ];
    let sourceObserverStart = 0;
    for (const [action, expected] of journey) {
      const before = await evaluate(`(() => {
        const s = window.__revealTest;
        // Count this document's observers, not just observers created by the
        // duplicate event. Idempotent cleanup may reveal all pending targets.
        const observerStart = ${sourceObserverStart};
        const frameStart = s.frames.length;
        s.hold = true;
        document.dispatchEvent(new Event('astro:page-load'));
        return { swaps: s.swaps, loads: s.loads, observers: s.observers.length, frames: s.frames.length,
          observerStart,
          held: s.frames.slice(frameStart).filter(f => f.held && !f.fired && !f.cancelled).length,
          pendingIDs: s.frames.filter(f => !f.fired && !f.cancelled).map(f => f.id) };
      })()`);
      assert(before.held > 0, 'No pending reveal frame intercepted; update attribution if implementation changed');
      await evaluate(action === 'back' ? 'history.back()' : action === 'forward' ? 'history.forward()' : `(() => {
        const link = [...document.querySelectorAll('a[href]')].find(a => new URL(a.href).pathname.replace(/\\/$/,'') === ${JSON.stringify(action)});
        if (!link) throw Error('Missing route link'); link.click();
      })()`);
      await until(() => evaluate(`window.__revealTest?.swaps > ${before.swaps} && window.__revealTest.loads > ${before.loads}`), `client transition ${action}`);
      const result = await evaluate(`(() => {
        const s = window.__revealTest; s.hold = false;
        return { action: ${JSON.stringify(action)}, path: location.pathname,
          observed: s.observers.slice(${before.observerStart},${before.observers}).filter(o => o.reveal).length,
          leaks: s.observers.slice(0,${before.observers}).filter(o => o.reveal && !o.disconnected).length,
          expected: ${JSON.stringify(expected)},
          destinationObservers: s.observers.slice(${before.observers}).filter(o => o.reveal).length,
          destinationFrames: s.frames.slice(${before.frames}).filter(f => f.held && !f.fired && !f.cancelled).length,
          uncancelled: s.frames.filter(f => ${JSON.stringify(before.pendingIDs)}.includes(f.id) && !f.cancelled).length };
      })()`);
      evidence.push(result);
      sourceObserverStart = before.observers;
      await sleep(150);
      // Continue all transitions even on a lifecycle regression.
    }
    assert(evidence.every(e => e.observed > 0), 'No reveal observers exercised: ' + JSON.stringify(evidence));
    assert(evidence.every(e => e.destinationObservers > 0 && e.destinationFrames > 0), 'Destination reveal initialization missing: ' + JSON.stringify(evidence));
    assert(evidence.every(e => e.path.replace(/\/$/, '') === e.expected), JSON.stringify(evidence));
    assert(evidence.every(e => e.leaks === 0 && e.uncancelled === 0), JSON.stringify(evidence));
    return evidence;
  });
} catch (error) {
  report.rows.push({ name: 'harness availability', pass: false, error: error.message });
  console.error(error);
} finally {
  socket?.close();
  child.kill('SIGTERM');
  await sleep(300);
  if (child.exitCode === null) child.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
  const output = process.env.REVEAL_TEST_REPORT || '/tmp/reveal-failure-regression.json';
  await writeFile(output, JSON.stringify(report, null, 2));
  console.log(`Report: ${output}; ${report.rows.filter(r => !r.pass).length}/${report.rows.length} failed`);
  process.exitCode = report.rows.some(row => !row.pass) ? 1 : 0;
}