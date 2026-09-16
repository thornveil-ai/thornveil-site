// Browser checks against a running Chromium remote-debugging instance.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const baseline = process.argv.includes('--baseline');
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(message.error) : resolve(message.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
await send('Page.enable');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
for (const width of process.argv.includes('--no-js-only') ? [] : baseline ? [320] : [320, 390, 1280]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 600 });
  for (const route of ['about', 'cofounder', 'contact']) {
    await send('Page.navigate', { url: `https://${process.env.REPLIT_DEV_DOMAIN}/${route}` });
    await wait(1800);
    const state = await evaluate(`(() => {
      const h = document.querySelector('h1');
      const r = h.getBoundingClientRect();
      return { title: h.textContent.trim(), headingHeight:r.height, headingTop:r.top,
        font:getComputedStyle(h).fontSize, overflow:document.documentElement.scrollWidth>innerWidth,
        links:[...document.querySelectorAll('main a')].filter(a=>a.closest('.tv-btn')||a.classList.contains('tv-nav-link')).map(a=>({text:a.textContent.trim(),height:a.getBoundingClientRect().height,width:a.getBoundingClientRect().width})),
        mail:[...document.querySelectorAll('main a[href^="mailto:"]')].map(a=>a.getAttribute('href')) };
    })()`);
    console.log(width, route, JSON.stringify(state));
    const image = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(`/tmp/${route}-${width}-${baseline ? 'before' : 'after'}.png`, Buffer.from(image.data, 'base64'));
    if (!baseline) {
      assert(!state.overflow, `${route} overflows at ${width}`);
      assert(state.mail.every(href => new URL(href).pathname === 'jesse@thornveil.ai'));
      if (route === 'cofounder') assert.equal(new URL(state.mail[0]).searchParams.get('subject'), 'Co-founder application');
      for (const link of state.links) assert(link.height >= 44, `${route}: small target ${link.text}`);
      if (width === 320) assert(state.headingHeight < 240, `${route}: heading dominates screen`);
      if (route === 'cofounder' && width === 320) {
        await evaluate(`document.querySelector('a[href="#apply"]').focus()`);
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
        await wait(400);
        assert.equal(await evaluate('location.hash'), '#apply', 'keyboard application link');
        await evaluate(`history.replaceState(null,'',location.pathname); document.querySelector('a[href="#apply"]').scrollIntoView({block:'center',behavior:'instant'})`);
        await wait(200);
        const point = await evaluate(`(() => {const r=document.querySelector('a[href="#apply"]').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
        await send('Emulation.setTouchEmulationEnabled', { enabled: true });
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, radiusX: 1, radiusY: 1, force: 1, id: 1 }] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await wait(400);
        assert.equal(await evaluate('location.hash'), '#apply', 'touch application link');
        await send('Emulation.setTouchEmulationEnabled', { enabled: false });
      }
      // Root-font enlargement is a layout stress test, not browser text-only zoom.
      await evaluate(`document.documentElement.style.fontSize='200%'`);
      assert.equal(await evaluate(`document.querySelector('main').scrollWidth > innerWidth`), false, `${route}: 200% root-font overflow at ${width}`);
      await evaluate(`document.documentElement.style.fontSize=''`);
    }
  }
}
if (!baseline) {
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  for (const route of ['about', 'cofounder', 'contact']) {
    await send('Page.navigate', { url: `https://${process.env.REPLIT_DEV_DOMAIN}/${route}` });
    await wait(1500);
    // DevTools evaluation remains available while page scripts are disabled.
    const fallback = await evaluate(`(() => {
      const email=document.querySelector('main a[href^="mailto:"]');
      let visible=true;
      for(let e=email;e;e=e.parentElement) {const s=getComputedStyle(e);if(s.opacity==='0'||s.visibility==='hidden'||s.display==='none')visible=false;}
      const range=document.createRange();range.selectNodeContents(email);
      const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
      return {visible,selection:selection.toString().trim(),selectable:getComputedStyle(email).userSelect};
    })()`);
    assert(fallback.visible, `${route}: no-JS email invisible`);
    assert.equal(fallback.selection, 'jesse@thornveil.ai');
    assert.notEqual(fallback.selectable, 'none');
  }
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  console.log('Passed viewport, touch, keyboard, mailto, enlarged-font and no-JavaScript checks.');
}
socket.close();