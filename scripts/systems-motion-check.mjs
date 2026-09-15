// Run against an existing Chromium --remote-debugging-port=9222 instance.
// No project dependencies required. Baseline: node scripts/systems-motion-check.mjs --baseline
import assert from 'node:assert/strict';
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
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const stats = () => evaluate(`(() => {
  const panels = [...document.querySelectorAll('.viz-panel')];
  return { panels: panels.length, overflow: document.documentElement.scrollWidth > innerWidth,
    rows: panels.map(p => {
      const r = p.getBoundingClientRect();
      const animations = p.getAnimations({subtree:true});
      return { name: p.closest('article').id, visible: r.bottom > 0 && r.top < innerHeight,
        running: animations.filter(a => a.playState === 'running').length,
        paused: animations.filter(a => a.playState === 'paused').length };
    }) };
})()`);
const navigate = async () => {
  await send('Page.navigate', { url: `${process.env.SYSTEMS_TEST_ORIGIN || `https://${process.env.REPLIT_DEV_DOMAIN}`}/systems` });
  await wait(3500);
};
await send('Page.enable');
await send('Performance.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await navigate();
assert.equal((await stats()).panels, 10, 'Systems page did not load');
await evaluate(`scrollTo({top:0,behavior:'instant'})`);
await wait(500);
const start = await send('Performance.getMetrics');
await wait(3000);
const end = await send('Performance.getMetrics');
const deltas = Object.fromEntries(['TaskDuration', 'LayoutDuration', 'RecalcStyleDuration'].map(name =>
  [name, end.metrics.find(m => m.name === name).value - start.metrics.find(m => m.name === name).value]));
console.log(JSON.stringify({ mode: baseline ? 'before' : 'after', top: await stats(), threeSecondMetrics: deltas }, null, 2));
if (!baseline) {
  for (const mobile of [false, true]) {
    await send('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
    for (let i = 0; i < 10; i++) {
      await evaluate(`document.querySelectorAll('.viz-panel')[${i}].scrollIntoView({block:'center',behavior:'instant'})`);
      await wait(750);
      const state = await stats();
      assert.equal(state.panels, 10);
      assert.equal(state.overflow, false);
      assert(state.rows[i].visible && state.rows[i].running > 0, `inactive visible panel ${i}`);
      assert(state.rows.filter(r => !r.visible).every(r => r.running === 0), 'offscreen animation');
    }
  }
  // Emulate a visibility event deterministically; Chromium headless tabs have no desktop tab UI.
  await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange'))`);
  await wait(100);
  assert((await stats()).rows.every(r => r.running === 0));
  const pausedTime = await evaluate(`document.querySelectorAll('.viz-panel')[9].getAnimations({subtree:true})[0].currentTime`);
  await wait(300);
  assert.equal(await evaluate(`document.querySelectorAll('.viz-panel')[9].getAnimations({subtree:true})[0].currentTime`), pausedTime);
  await evaluate(`delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))`);
  await wait(100);
  assert((await stats()).rows.some(r => r.running > 0));
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await wait(200);
  assert((await stats()).rows.every(r => r.running === 0));
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.au-hash-elem')).opacity`), '1');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.au-deny-flash')).opacity`), '0');
  await send('Emulation.setEmulatedMedia', { features: [] });
  // Exercise real Astro client-side navigation and return.
  await evaluate(`document.querySelector('a[href="/about"]').click()`);
  await wait(1500);
  assert.equal(await evaluate('location.pathname'), '/about');
  await evaluate(`document.querySelector('a[href="/systems"]').click()`);
  await wait(2000);
  assert.equal(await evaluate('location.pathname'), '/systems');
  await evaluate(`document.querySelectorAll('.viz-panel')[4].scrollIntoView({block:'center',behavior:'instant'})`);
  await wait(750);
  const returned = await stats();
  assert(returned.rows.some(r => r.visible && r.running > 0));
  assert(returned.rows.filter(r => !r.visible).every(r => r.running === 0));
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await navigate();
  assert.equal((await stats()).panels, 10);
  assert((await stats()).rows.every(r => r.running === 0));
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  const fallback = await send('Page.addScriptToEvaluateOnNewDocument', { source: 'delete window.IntersectionObserver' });
  await navigate();
  assert((await stats()).rows.every(r => r.running === 0));
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fallback.identifier });
  console.log('PASS: all ten panels, desktop/mobile scroll, hidden document and frozen timeline, reduced motion, Astro return, no-JS and no-observer static fallbacks');
}
socket.close();