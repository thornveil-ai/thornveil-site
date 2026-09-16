// Run with the dev workflow and Chromium --remote-debugging-port=9222.
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.env.RESEARCH_TEST_ORIGIN || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const events = [];
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id) return events.push(message);
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(message.error) : resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate, label) {
  for (let i = 0; i < 100; i++) {
    if (await predicate()) return;
    await wait(100);
  }
  throw new Error(`Timed out: ${label}`);
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
const key = async (key, code, extra = {}) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, ...extra });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
};
try {
  await send('Page.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const downloadPath = await mkdtemp(join(tmpdir(), 'research-downloads-'));
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
  await send('Page.navigate', { url: `${origin}/research` });
  await until(() => evaluate(`document.querySelectorAll('.paper-card').length === 5`), 'research page');
  const papers = await evaluate(`[...document.querySelectorAll('.paper-card')].map(c => ({
    title:c.querySelector('h3').textContent, links:[...c.querySelectorAll('a')].map(a=>({
      href:a.getAttribute('href'), label:a.getAttribute('aria-label'), target:a.target,
      download:a.getAttribute('download'), rel:a.rel
    }))
  }))`);
  assert.equal(papers.length, 5);
  for (const paper of papers) {
    assert.equal(paper.links.length, 2);
    const [open, save] = paper.links;
    assert.equal(open.target, '_blank');
    assert(open.rel.includes('noopener'));
    assert(open.label.includes(paper.title) && open.label.includes('new tab'));
    assert(save.label.includes(paper.title));
    assert.equal(save.href, open.href);
    assert.equal(save.download, open.href.split('/').pop());
    const response = await fetch(`${origin}${open.href}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^application\/pdf\b/);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.deepEqual(bytes, await readFile(`public${open.href}`));
    console.log(`${open.href}: 200 application/pdf, ${bytes.length} bytes`);
  }
  for (const width of [1440, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const fontSize of ['100%', '200%']) {
      await evaluate(`document.documentElement.style.fontSize = '${fontSize}'`);
      assert(await evaluate(`[...document.querySelectorAll('.paper-card, .paper-card h3, .paper-actions, .research-totals, .research-totals > div')].every(e => {
        const r=e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && e.scrollWidth <= e.clientWidth + 1;
      })`), `research content overflow at ${width}, root font ${fontSize}`);
    }
    await evaluate(`document.documentElement.style.fontSize = '100%'`);
    if (width === 320) continue;
    await evaluate(`document.querySelector('.paper-actions a').focus()`);
    for (let i = 0; i < 10; i++) {
      assert.equal(await evaluate(`[...document.querySelectorAll('.paper-actions a')].indexOf(document.activeElement)`), i);
      assert(await evaluate(`getComputedStyle(document.activeElement).outlineStyle !== 'none'`));
      await key('Tab', 'Tab', { windowsVirtualKeyCode: 9 });
    }
    for (let i = 0; i < 10; i++) {
      await send('Page.bringToFront');
      await evaluate(`document.querySelectorAll('.paper-actions a')[${i}].focus()`);
      if (i % 2 === 0) {
        const start = events.length;
        await key('Enter', 'Enter', { text: '\r', windowsVirtualKeyCode: 13 });
        await until(() => events.slice(start).some(e => e.method === 'Page.windowOpen'), 'PDF tab');
        const opened = events.slice(start).find(e => e.method === 'Page.windowOpen');
        assert.equal(opened.params.url, `${origin}${papers[i / 2].links[0].href}`);
      } else {
        const start = events.length;
        await key('Enter', 'Enter', { text: '\r', windowsVirtualKeyCode: 13 });
        await until(() => events.slice(start).some(e => e.method === 'Browser.downloadProgress' && e.params.state === 'completed'), 'saved PDF');
        const download = events.slice(start).find(e => e.method === 'Browser.downloadWillBegin');
        const paper = papers[(i - 1) / 2];
        assert.equal(download.params.suggestedFilename, paper.links[1].download);
        assert.deepEqual(await readFile(join(downloadPath, download.params.suggestedFilename)), await readFile(`public${paper.links[1].href}`));
      }
    }
    console.log(`${width}px: keyboard order, visible focus, all five open/save actions passed`);
  }
  console.log('Research layouts passed at 1440, 390, 320px and 200% root-font enlargement.');
} finally {
  socket.close();
}