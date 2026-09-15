// Run against the dev workflow: node --test scripts/shared-nav-accessibility.test.mjs
// Uses Chromium's built-in debugging protocol; no added test dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import test from 'node:test';

test('shared navigation survives routes, keyboard use, resizing, and pointer effects', { timeout: 120000 }, async () => {
  const profile = await mkdtemp(join(tmpdir(), 'shared-nav-'));
  const browser = spawn(process.env.CHROMIUM_BIN || 'chromium', [
    '--headless', '--no-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=0',
    '--blink-settings=availablePointerTypes=4,primaryPointerType=4,availableHoverTypes=2,primaryHoverType=2',
    `--user-data-dir=${profile}`, 'about:blank',
  ]);
  let socket;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(new Error('Chromium did not start')), 15000);
      browser.once('error', reject);
      browser.stderr.on('data', chunk => {
        output += chunk;
        const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
    });
    const debugOrigin = endpoint.replace('ws:', 'http:').split('/devtools/')[0];
    const targets = await (await fetch(`${debugOrigin}/json/list`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await once(socket, 'open');
    let id = 0;
    const pending = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') console.error(JSON.stringify(message.params));
      if (pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const wait = async expression => {
      for (let n = 0; n < 150; n++) {
        if (await evaluate(expression)) return;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert.fail(`Timed out: ${expression}; page: ${await evaluate('location.href + " " + document.body?.innerText.slice(0, 600)')}`);
    };
    const key = async (key, code = key) => {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, text: key === 'Enter' ? '\r' : undefined, windowsVirtualKeyCode: { Tab: 9, Enter: 13, Escape: 27 }[key] });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
    };
    const resize = width => send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    const origin = process.env.NAV_TEST_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
    await send('Page.enable');
    await send('Runtime.enable');
    for (const width of [360, 768, 1280]) {
      await resize(width);
      await send('Page.navigate', { url: `${origin}/about` });
      await wait(`document.readyState === 'complete' && !!document.getElementById('mobile-toggle')`);
      await evaluate(`window.__navigationDocument = 'same-document'; window.__loads = 0; document.addEventListener('astro:page-load', () => window.__loads++)`);
      await key('Tab');
      assert.equal(await evaluate(`document.activeElement.classList.contains('skip-link')`), true);
      assert.equal(await evaluate(`document.activeElement.getBoundingClientRect().top >= 0`), true);
      await key('Enter');
      await wait(`document.activeElement.id === 'main-content'`);
      assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, `overflow at ${width}`);
      assert.equal(await evaluate(`getComputedStyle(document.getElementById('mobile-toggle')).display !== 'none'`), width < 768);

      for (const route of ['/research', '/systems', '/about']) {
        assert.equal(await evaluate(`document.getElementById('mobile-menu').inert`), true);
        await evaluate(`document.querySelector('#mobile-menu a').focus()`);
        assert.notEqual(await evaluate(`document.activeElement.closest('#mobile-menu')?.id`), 'mobile-menu');
        if (width < 768) {
          await evaluate(`document.getElementById('mobile-toggle').focus()`);
          assert.equal(await evaluate(`document.activeElement.id`), 'mobile-toggle');
          await key('Enter');
          await wait(`document.getElementById('mobile-toggle').getAttribute('aria-expanded') === 'true'`);
          await key('Tab');
          assert.equal(await evaluate(`document.activeElement.getAttribute('href')`), '/systems');
          await key('Escape');
          assert.equal(await evaluate(`document.activeElement.id`), 'mobile-toggle');
          assert.equal(await evaluate(`document.getElementById('mobile-menu').inert`), true);
          await key('Enter');
        }
        const previous = await evaluate('window.__loads');
        await evaluate(`document.querySelector('${width < 768 ? '#mobile-menu' : '#nav nav'} a[href="${route}"]').click()`);
        await wait(`location.pathname === '${route}' && window.__loads > ${previous}`);
        assert.equal(await evaluate('window.__navigationDocument'), 'same-document');
        assert.equal(await evaluate(`document.getElementById('mobile-toggle').getAttribute('aria-expanded')`), 'false');
        await evaluate('window.scrollTo(0, 250)');
        await wait(`window.scrollY > 24 && document.getElementById('nav').style.backdropFilter === 'blur(12px)'`);
        await evaluate('window.scrollTo(0, 0)');
        await wait(`window.scrollY === 0 && document.getElementById('nav').style.background === 'transparent'`);
      }
    }

    await resize(360);
    await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
    await evaluate(`document.getElementById('mobile-toggle').click(); document.querySelector('#mobile-menu a').focus()`);
    await resize(768);
    await wait(`document.getElementById('mobile-menu').inert`);
    assert.equal(await evaluate(`document.activeElement.getAttribute('href')`), '/systems');
    await resize(360);
    await wait(`document.activeElement.id === 'mobile-toggle'`);

    await resize(1280);
    await send('Emulation.setEmulatedMedia', { features: [
      { name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'hover', value: 'hover' },
      { name: 'pointer', value: 'fine' },
    ] });
    await evaluate(`document.querySelector('.tv-btn').scrollIntoView({block:'center'})`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const point = await evaluate(`(() => {const r = document.querySelector('.tv-btn').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
    assert.equal(await evaluate(`matchMedia('(hover: none), (pointer: coarse)').matches`), false);
    // Exact coordinates avoid rounding away the divide-by-zero regression.
    await evaluate(`window.dispatchEvent(new PointerEvent('pointermove', {clientX:${point.x},clientY:${point.y},pointerType:'mouse'}))`);
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(await evaluate(`document.querySelector('.tv-btn').style.transform`), '');
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + 20, y: point.y });
    await wait(`document.querySelector('.tv-btn').style.transform.startsWith('translate(')`);
    assert.equal(await evaluate(`document.querySelector('.tv-btn').getAttribute('style').includes('NaN')`), false);
    await evaluate(`document.documentElement.dispatchEvent(new PointerEvent('pointerleave'))`);
    assert.equal(await evaluate(`document.querySelector('.tv-btn').style.transform`), '');
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + 25, y: point.y });
    await wait(`document.querySelector('.tv-btn').style.transform !== ''`);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await wait(`document.querySelector('.tv-btn').style.transform === ''`);
    await evaluate(`window.dispatchEvent(new PointerEvent('pointermove', {clientX:${point.x + 20},clientY:${point.y},pointerType:'touch'}))`);
    assert.equal(await evaluate(`document.querySelector('.tv-btn').style.transform`), '');
  } finally {
    socket?.close();
    browser.kill();
    await once(browser, 'exit');
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});