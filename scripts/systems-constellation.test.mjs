// Browser regression check: run with the dev workflow serving on port 5000.
// Uses Chromium's debugging protocol directly, without a test-only dependency.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import test from 'node:test';

test('constellation supports pointer, keyboard, touch, and returning navigation', async () => {
  const profile = await mkdtemp(`${tmpdir()}/constellation-`);
  const browser = spawn(process.env.CHROMIUM_BIN || 'chromium', [
    '--headless', '--no-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let socket;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let output = '';
      browser.on('error', reject);
      browser.stderr.on('data', (data) => {
        output += data;
        const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) resolve(match[1]);
      });
      setTimeout(() => reject(new Error('Chromium did not start')), 15000).unref();
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
    let sequence = 0;
    const pending = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') console.error(JSON.stringify(message.params));
      if (!message.id) return;
      const callbacks = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
      else callbacks.resolve(message.result);
    });
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
    const { targetInfos } = await send('Target.getTargets');
    const { sessionId } = await send('Target.attachToTarget', {
      targetId: targetInfos.find((target) => target.type === 'page').targetId, flatten: true,
    });
    const command = (method, params) => send(method, params, sessionId);
    await command('Runtime.enable');
    await command('Page.enable');
    await command('Page.bringToFront');
    await command('Emulation.setFocusEmulationEnabled', { enabled: true });
    const evaluate = async (expression) => {
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const waitFor = async (expression) => {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(expression)) return;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error(`Timed out: ${expression}; ${await evaluate('location.href + "\\n" + document.body.innerText.slice(0, 1500)')}`);
    };
    const base = process.env.GRAPH_TEST_BASE_URL || (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://127.0.0.1:5000');
    const root = `document.querySelector('systems-constellation')`;
    const button = (id) => `${root}.querySelector('[data-system="${id}"]')`;
    const active = () => evaluate(`${root}.querySelector('svg').getAttribute('data-active')`);
    const graph = JSON.parse(await readFile(new URL('../src/data/system-graph.json', import.meta.url), 'utf8'));
    // These checks own component-local visibility. Ancestor reveal failures are
    // covered by the shared reveal work, not repaired by this component.
    for (const mode of ['no-js', 'registration-blocked', 'setup-throws']) {
      await command('Emulation.setScriptExecutionDisabled', { value: mode === 'no-js' });
      let injection;
      if (mode !== 'no-js') {
        ({ identifier: injection } = await command('Page.addScriptToEvaluateOnNewDocument', {
          source: mode === 'registration-blocked'
            ? `const define = customElements.define.bind(customElements);
               customElements.define = (name, ...args) => { if (name !== 'systems-constellation') define(name, ...args); };`
            : `const add = EventTarget.prototype.addEventListener;
               EventTarget.prototype.addEventListener = function(type, ...args) {
                 if (this instanceof Element && this.matches('[data-system]') && type === 'click') {
                   window.graphSetupBlocked = true;
                   throw new Error('Injected graph setup failure');
                 }
                 return add.call(this, type, ...args);
               };`,
        }));
      }
      for (const width of [320, 1440]) {
        await command('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        await command('Page.navigate', { url: `${base}/?graph-fallback=${mode}-${width}` });
        await waitFor(`location.search === '?graph-fallback=${mode}-${width}' && document.readyState === 'complete' && ${root}`);
        await evaluate(`{
          const element = ${root};
          const disclosure = element.closest('details');
          if (disclosure && !disclosure.open) disclosure.querySelector('summary').click();
          for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
            ancestor.style.setProperty('opacity', '1', 'important');
            ancestor.style.setProperty('visibility', 'visible', 'important');
            ancestor.style.setProperty('transform', 'none', 'important');
          }
        }`);
        assert.equal(await evaluate(`${root}.querySelector('.constellation-fallback').hidden`), false, mode);
        assert.equal(await evaluate(`${root}.querySelector('.constellation-interactive').hidden`), true, mode);
        if (mode === 'setup-throws') assert.equal(await evaluate('window.graphSetupBlocked'), true);
        const entries = await evaluate(`Array.from(${root}.querySelectorAll('dt')).map(n => n.textContent)`);
        assert.deepEqual(entries, graph.nodes.map(n => `${n.name} ${n.stat}`));
        const text = await evaluate(`${root}.querySelector('.constellation-fallback').innerText`);
        for (const edge of graph.edges) {
          const from = graph.nodes.find(n => n.id === edge.from).name;
          const to = graph.nodes.find(n => n.id === edge.to).name;
          assert.ok(text.includes(`${from} → ${to} (${edge.label})`), `${mode}: ${from} → ${to}`);
        }
        assert.match(text, /No declared dependencies\./);
        assert.equal(await evaluate(`(() => {
          const fallback = ${root}.querySelector('.constellation-fallback');
          return Array.from(fallback.querySelectorAll('dt, dd')).every(el => {
            const style = getComputedStyle(el);
            const range = document.createRange(); range.selectNodeContents(el);
            return style.visibility === 'visible' && Number(style.opacity) > 0 &&
              Array.from(range.getClientRects()).every(r => r.width > 0 && r.left >= 0 && r.right <= innerWidth + 1);
          }) && getComputedStyle(fallback).display !== 'none';
        })()`), true, `${mode}: readable text at ${width}px`);
      }
      if (injection) await command('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection });
    }
    await command('Emulation.setScriptExecutionDisabled', { value: false });
    await command('Page.navigate', { url: base });
    await waitFor(`${root}?.controller !== undefined`);
    await waitFor(`document.readyState === 'complete'`);
    assert.equal(await evaluate(`${root}.querySelector('.constellation-fallback').hidden`), true);
    assert.equal(await evaluate(`${root}.querySelector('.constellation-interactive').hidden`), false);
    assert.equal(await evaluate(`${root}.querySelectorAll('[data-system]').length`), 10);
    await evaluate(`${button('signet')}.scrollIntoView({block:'center'})`);
    await waitFor(`getComputedStyle(${button('signet')}).visibility === 'visible'`);
    await evaluate(`${button('signet')}.focus()`);
    assert.equal(await active(), 'signet');
    assert.match(await evaluate(`${root}.innerText`), /Signet → Auspex \(extends\)/);
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    assert.equal(await evaluate(`${button('signet')}.getAttribute('aria-pressed')`), 'true');
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    assert.equal(await active(), null);
    await evaluate(`${button('alchemist')}.focus()`);
    assert.match(await evaluate(`${root}.innerText`), /No declared dependencies/);
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    assert.equal(await evaluate(`${button('alchemist')}.getAttribute('aria-pressed')`), 'true');
    await evaluate(`${root}.querySelector('[data-clear]').click()`);
    assert.equal(await active(), null);
    // Mouse previews include incoming as well as outgoing relationships.
    await evaluate(`${root}.querySelector('[data-id="rigrun"]').dispatchEvent(new PointerEvent('pointerenter', {pointerType:'mouse'}))`);
    assert.equal(await active(), 'rigrun');
    assert.match(await evaluate(`${root}.innerText`), /Pyros → RigRun \(inference\)/);
    await evaluate(`${root}.querySelector('[data-id="rigrun"]').dispatchEvent(new PointerEvent('pointerleave', {pointerType:'mouse'}))`);
    assert.equal(await active(), null);
    // Reconnect the same instance twice: a click must still toggle only once.
    await evaluate(`{ const element = ${root}; const parent = element.parentNode;
      element.remove(); parent.append(element); element.connectedCallback(); }`);
    await evaluate(`${button('signet')}.click()`);
    assert.equal(await evaluate(`${button('signet')}.getAttribute('aria-pressed')`), 'true');
    await evaluate(`${button('signet')}.click()`);
    assert.equal(await active(), null);
    // Actual Astro client navigation away and back.
    await evaluate(`{ const link = document.createElement('a'); link.href='/about/'; document.body.append(link); link.click(); }`);
    await waitFor(`location.pathname === '/about/' && !${root}`);
    await evaluate(`{ const link = document.createElement('a'); link.href='/'; document.body.append(link); link.click(); }`);
    await waitFor(`location.pathname === '/' && ${root}?.controller !== undefined`);
    await command('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    await command('Emulation.setTouchEmulationEnabled', { enabled: true });
    // Homepage presents the graph as an optional native disclosure on phones.
    await new Promise((resolve) => setTimeout(resolve, 100));
    await evaluate(`{ const disclosure = ${root}.closest('details'); if (disclosure) disclosure.open = true; }`);
    await evaluate(`${button('navigator')}.scrollIntoView({block:'center'})`);
    const bounds = await evaluate(`(() => { const r = ${button('navigator')}.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2,height:r.height}; })()`);
    assert.ok(bounds.height >= 44);
    await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x, y: bounds.y }] });
    await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await waitFor(`${button('navigator')}.getAttribute('aria-pressed') === 'true'`);
    assert.match(await evaluate(`${root}.innerText`), /Navigator → Mycelium \(builds\)/);
    assert.ok(await evaluate(`${root}.getBoundingClientRect().right <= innerWidth`), 'component fits mobile width');
    assert.ok(await evaluate(`(() => {const h=${root}.querySelector('.constellation-hud'); return h.scrollHeight <= h.clientHeight && h.scrollWidth <= h.clientWidth})()`), 'HUD is not clipped');
    await evaluate(`${root}.querySelector('.constellation-controls').scrollIntoView({block:'center'})`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const screenshot = await command('Page.captureScreenshot', { format: 'png' });
    await writeFile('/tmp/constellation-mobile.png', Buffer.from(screenshot.data, 'base64'));
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate(`${root}.scrollIntoView({block:'start'})`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const desktop = await command('Page.captureScreenshot', { format: 'png' });
    await writeFile('/tmp/constellation-desktop.png', Buffer.from(desktop.data, 'base64'));
  } finally {
    socket?.close();
    browser.kill();
    await new Promise((resolve) => browser.once('exit', resolve));
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});