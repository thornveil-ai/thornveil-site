// Test-only adapters. Playwright is optional and is provisioned by the graphics
// browser-setup owner, not this suite. Chromium can run with built-in CDP.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function until(test, label, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await test()) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${label}`);
}

export async function launchEngine(engine) {
  if (engine !== 'chromium' || process.env.JOURNEY_USE_PLAYWRIGHT === '1') {
    const pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
    const browser = await pw[engine].launch({
      headless: true,
      executablePath: process.env[`JOURNEY_${engine.toUpperCase()}_BIN`] || undefined,
    });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, acceptDownloads: true });
    const page = await context.newPage();
    const events = [];
    page.on('popup', popup => events.push({ kind: 'popup', popup }));
    page.on('download', download => events.push({ kind: 'download', download }));
    return {
      version: browser.version(), control: 'Playwright', events,
      evaluate: expression => page.evaluate(expression),
      viewport: (width, height) => page.setViewportSize({ width, height }),
      navigate: url => page.goto(url, { waitUntil: 'domcontentloaded' }),
      key: key => page.keyboard.press(key),
      click: selector => page.locator(selector).click(),
      capture: async path => { await page.bringToFront(); await page.screenshot({ path }); },
      close: () => browser.close(),
    };
  }
  const profile = await mkdtemp(join(tmpdir(), 'non-graphics-journeys-'));
  const proc = spawn(process.env.JOURNEY_CHROMIUM_BIN || process.env.CHROMIUM_BIN || 'chromium', [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--ignore-certificate-errors', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '', launchError, socket;
  proc.stderr.on('data', data => { stderr += data; });
  proc.on('error', error => { launchError = error; });
  const close = async () => {
    socket?.close();
    if (proc.exitCode === null) {
      proc.kill('SIGTERM');
      await Promise.race([new Promise(resolve => proc.once('exit', resolve)), delay(3000)]);
      if (proc.exitCode === null) proc.kill('SIGKILL');
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  };
  try {
    await until(() => {
      if (launchError) throw launchError;
      if (proc.exitCode !== null) throw new Error(stderr);
      return /DevTools listening on (ws:\/\/[^\s]+)/.test(stderr);
    }, 'Chromium debugging endpoint');
    const endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)[1];
    const targets = await (await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    let sequence = 0;
    const pending = new Map(), events = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (!message.id) { events.push(message); return; }
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result?.value;
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: profile, eventsEnabled: true });
    return {
      version: (await send('Browser.getVersion')).product, control: 'CDP', events, downloadPath: profile,
      evaluate,
      viewport: (width, height) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }),
      navigate: url => send('Page.navigate', { url }),
      key: async key => {
        const codes = { Tab: 9, Enter: 13, Escape: 27 };
        for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', {
          type, key, code: key, windowsVirtualKeyCode: codes[key],
          text: type === 'keyDown' && key === 'Enter' ? '\r' : undefined,
        });
      },
      click: async selector => {
        await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
        await delay(250);
        const point = await evaluate(`(() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          const r = el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};
        })()`);
        for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', {
          type, ...point, button: 'left', clickCount: 1,
        });
      },
      capture: async path => {
        await send('Page.bringToFront');
        const image = await send('Page.captureScreenshot', { format: 'png' });
        await writeFile(path, Buffer.from(image.data, 'base64'));
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}