// Requires an existing Chromium instance with --remote-debugging-port=9222.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = process.env.TECHNICAL_TEST_ORIGIN || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(message.error) : resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
await send('Page.enable');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await mkdir('/tmp/technical-screenshots', { recursive: true });
try {
  for (const width of (process.env.TECHNICAL_TEST_WIDTHS || '320,390,768,1440,640').split(',').map(Number)) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    for (const route of ['systems', 'defense', 'mycelium']) {
      await send('Page.navigate', { url: `${origin}/${route}` });
      await wait(1800);
      // 640 CSS pixels represents a 1280px desktop viewport at 200% browser zoom.
      assert.equal(await evaluate('document.querySelectorAll("h1").length'), 1, route);
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `${route} overflow at ${width}`);
      assert(await evaluate(`Array.from(document.querySelectorAll('main h1, main h2, main h3')).filter(h=>!h.classList.contains('sr-only')).every(h => {const r=document.createRange();r.selectNodeContents(h);return [...r.getClientRects()].every(b=>b.right<=innerWidth+1 && b.left>=-1)})`), `${route}: clipped heading`);
      const links = await evaluate(`Array.from(document.querySelectorAll('main nav a[href^="#"]')).map(a => a.getAttribute('href'))`);
      assert(links.length >= 3, `${route}: section navigation missing`);
      for (const href of links) {
        assert(await evaluate(`!!document.getElementById(${JSON.stringify(href.slice(1))})`), `missing ${href}`);
      }
      const href = links.at(-1);
      await evaluate(`document.querySelector('main nav a[href="${href}"]').focus()`);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r' });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter' });
      await wait(350);
      assert.equal(await evaluate('location.hash'), href, `${route}: keyboard hash link`);
      if (route === 'systems') {
        assert(await evaluate(`Array.from(document.querySelectorAll('.system-card')).every(c => c.querySelector('h2').compareDocumentPosition(c.querySelector('svg')) & Node.DOCUMENT_POSITION_FOLLOWING)`));
        assert.equal(await evaluate(`document.querySelectorAll('[data-system-viz]').length`), 10);
        assert.equal(await evaluate(`document.querySelectorAll('[data-system-viz]')[0].getAnimations({subtree:true}).filter(a=>a.playState==='running').length`), 0);
      }
      if (route === 'mycelium') {
        assert.equal(await evaluate(`document.querySelectorAll('table th[scope="col"]').length`), 4);
        assert.equal(await evaluate(`document.querySelectorAll('table th[scope="row"]').length`), 5);
        assert(await evaluate(`!!document.querySelector('table caption')`));
        if (width < 768) {
          assert(await evaluate(`(() => {const t=document.querySelector('table').parentElement;t.focus();t.scrollLeft=100;return t.scrollLeft>0 && document.activeElement===t})()`), 'table keyboard-accessible local scroll');
          await evaluate(`document.querySelector('table').parentElement.scrollLeft=0`);
          await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
          await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
          await wait(250);
          assert(await evaluate(`document.querySelector('table').parentElement.scrollLeft>0`), 'arrow-key table scrolling');
          if (width === 320) {
            await send('Emulation.setTouchEmulationEnabled', { enabled: true });
            const point = await evaluate(`(() => {const t=document.querySelector('table').parentElement;t.scrollLeft=0;t.scrollIntoView({block:'center',behavior:'instant'});const b=t.getBoundingClientRect();return {x:Math.min(b.right-30,innerWidth-30),y:Math.max(150,Math.min(b.top+150,innerHeight-100))}})()`);
            await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
            for (const offset of [30, 70, 110, 150]) {
              await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x - offset, y: point.y }] });
              await wait(50);
            }
            await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await wait(200);
            assert(await evaluate(`document.querySelector('table').parentElement.scrollLeft>0`), 'touch table scrolling');
            await send('Emulation.setTouchEmulationEnabled', { enabled: false });
          }
          assert(await evaluate(`(() => {const p=document.querySelector('pre');p.focus();return (innerWidth>390 || p.scrollWidth>p.clientWidth) && document.activeElement===p && p.getBoundingClientRect().right<=innerWidth})()`), 'code locally scrollable when needed');
        }
      }
      await evaluate(`scrollTo({top:0,behavior:'instant'})`);
      await wait(150);
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(`/tmp/technical-screenshots/${route}-${width}.png`, Buffer.from(shot.data, 'base64'));
      const section = route === 'systems' ? 'mycelium' : route === 'defense' ? 'procurement-posture' : 'hardware-tiers';
      await evaluate(`document.getElementById('${section}').scrollIntoView({behavior:'instant',block:'start'})`);
      await wait(200);
      const detail = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(`/tmp/technical-screenshots/${route}-detail-${width}.png`, Buffer.from(detail.data, 'base64'));
      console.log(`PASS ${route} at ${width}px: containment, section targets, keyboard navigation`);
    }
  }
} finally {
  socket.close();
}