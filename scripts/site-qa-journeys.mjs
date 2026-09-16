// End-to-end browser journeys for the public site.
//
// The script owns its Chromium process, fixed debugging port, and profile so it
// can run beside the older checks that use port 9222. It intentionally uses
// Chromium's CDP directly rather than adding a browser-test dependency.
//
// Run with:
//   node scripts/site-qa-journeys.mjs
//
// REPLIT_DEV_DOMAIN is required. The browser is started on port 9223 with the
// profile /tmp/qa-journeys and screenshots are written to
// docs/site-qa-evidence/journeys.

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { join } from 'node:path';

const domain = process.env.REPLIT_DEV_DOMAIN;
if (!domain) {
  throw new Error('REPLIT_DEV_DOMAIN is required (the origin is https://${process.env.REPLIT_DEV_DOMAIN})');
}

const origin = `https://${domain}`.replace(/\/+$/, '');
const port = 9223;
const debugOrigin = `http://127.0.0.1:${port}`;
const profile = '/tmp/qa-journeys';
const evidenceDir = 'docs/site-qa-evidence/journeys';
const downloadDir = join(profile, 'downloads');

function which(name) {
  try {
    return execFileSync('sh', ['-lc', `command -v ${name}`], { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

const chromium = process.env.CHROMIUM_BIN || which('chromium') || 'chromium';
const browserAvailability = {
  chromium: which(process.env.CHROMIUM_BIN || 'chromium') || chromium,
  firefox: which('firefox') || which('firefox-esr') || null,
  webkit: which('webkit2png') || which('MiniBrowser') || which('WebKitTestRunner') || null,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDebugger() {
  const deadline = Date.now() + 15_000;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${debugOrigin}/json/version`);
      if (response.ok) {
        const version = await response.json();
        if (version.webSocketDebuggerUrl) return version.webSocketDebuggerUrl;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await wait(100);
  }
  throw new Error(`Chromium did not expose CDP on ${port}: ${lastError}`);
}

async function pageTarget() {
  const response = await fetch(`${debugOrigin}/json/list`);
  const targets = await response.json();
  const target = targets.find((item) => item.type === 'page');
  if (!target) throw new Error(`Chromium has no page target: ${JSON.stringify(targets)}`);
  return target;
}

function createCdpSocket(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let sequence = 0;
  const pending = new Map();
  const events = [];

  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) {
      events.push(message);
      return;
    }
    const callback = pending.get(message.id);
    if (!callback) return;
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
    else callback.resolve(message.result);
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result?.value;
  };

  return { socket, events, send, evaluate };
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  await rm(profile, { recursive: true, force: true });
  await mkdir(downloadDir, { recursive: true });

  console.log(`Origin: ${origin}`);
  console.log(`Browser availability: ${JSON.stringify(browserAvailability)}`);
  if (!browserAvailability.firefox) console.log('Firefox: unavailable in this environment');
  if (!browserAvailability.webkit) console.log('WebKit: unavailable in this environment');

  const browser = spawn(chromium, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--ignore-certificate-errors',
    '--window-size=1440,1000',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const browserExit = once(browser, 'exit');
  let socket;
  const results = [];
  const screenshots = [];

  try {
    const browserEndpoint = await waitForDebugger();
    const target = await pageTarget();
    socket = createCdpSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.socket.addEventListener('open', resolve, { once: true });
      socket.socket.addEventListener('error', reject, { once: true });
    });

    const { send, evaluate, events } = socket;
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadDir,
      eventsEnabled: true,
    });

    async function waitFor(expression, label, timeout = 15_000) {
      const deadline = Date.now() + timeout;
      let last;
      while (Date.now() < deadline) {
        last = await evaluate(expression);
        if (last) return last;
        await wait(100);
      }
      const context = await evaluate('location.href + "\\n" + document.body?.innerText.slice(0, 500)');
      throw new Error(`Timed out waiting for ${label}: ${expression}\n${context}\nLast value: ${last}`);
    }

    async function setViewport(width, height = 900, mobile = width < 768) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile,
      });
      await send('Emulation.setTouchEmulationEnabled', {
        enabled: mobile,
        configuration: 'mobile',
      });
    }

    async function navigate(path) {
      const expected = new URL(path, origin).pathname;
      await send('Page.navigate', { url: new URL(path, origin).href });
      await waitFor(
        `location.pathname === ${JSON.stringify(expected)} && document.readyState === 'complete'`,
        `navigation to ${expected}`,
      );
      await wait(250);
    }

    async function key(key, code = key) {
      const keyCode = {
        Tab: 9,
        Enter: 13,
        Escape: 27,
        Space: 32,
        ArrowRight: 39,
      }[key];
      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key,
        code,
        text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined,
        windowsVirtualKeyCode: keyCode,
      });
      await send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code,
        windowsVirtualKeyCode: keyCode,
      });
    }

    async function focus(selector) {
      const focused = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element) return false;
        element.focus();
        return document.activeElement === element;
      })()`);
      assert.equal(focused, true, `could not focus ${selector}`);
    }

    async function touch(selector) {
      const point = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element) return null;
        element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`);
      assert(point, `could not find touch target ${selector}`);
      const touchPoint = { ...point, id: 1, radiusX: 1, radiusY: 1, force: 1 };
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }

    async function click(selector) {
      const clicked = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element) return false;
        element.click();
        return true;
      })()`);
      assert.equal(clicked, true, `could not click ${selector}`);
    }

    async function capture(name) {
      const screenshot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
      const path = join(evidenceDir, `${name}.png`);
      await writeFile(path, Buffer.from(screenshot.data, 'base64'));
      screenshots.push(path);
      console.log(`  screenshot ${path}`);
    }

    async function step(name, callback) {
      try {
        const details = await callback();
        results.push({ name, status: 'PASS', details: details ?? null });
        console.log(`PASS ${name}`);
        return details;
      } catch (error) {
        results.push({ name, status: 'FAIL', error: error.message });
        console.error(`FAIL ${name}: ${error.message}`);
        throw error;
      }
    }

    await step('mobile menu keyboard and touch', async () => {
      await setViewport(390, 844, true);
      await navigate('/about');
      assert.equal(await evaluate(`document.querySelector('#mobile-toggle').getAttribute('aria-expanded')`), 'false');
      assert.equal(await evaluate('document.querySelector("#mobile-menu").inert'), true);

      await focus('#mobile-toggle');
      await key('Enter');
      await waitFor(
        `document.querySelector('#mobile-toggle').getAttribute('aria-expanded') === 'true' &&
         !document.querySelector('#mobile-menu').inert`,
        'keyboard menu open',
      );
      await key('Tab');
      assert.equal(await evaluate('document.activeElement.getAttribute("href")'), '/systems');
      await key('Escape');
      assert.equal(await evaluate('document.querySelector("#mobile-toggle").getAttribute("aria-expanded")'), 'false');
      assert.equal(await evaluate('document.activeElement.id'), 'mobile-toggle');

      await touch('#mobile-toggle');
      await waitFor(
        `document.querySelector('#mobile-toggle').getAttribute('aria-expanded') === 'true'`,
        'touch menu open',
      );
      await capture('menu-mobile-keyboard-touch');
      await touch('#mobile-toggle');
      assert.equal(await evaluate('document.querySelector("#mobile-toggle").getAttribute("aria-expanded")'), 'false');
      return {
        viewport: '390x844',
        keyboard: 'open → Tab to Systems → Escape restores toggle focus',
        touch: 'open and close toggle',
      };
    });

    await step('home details, destination, and browser back', async () => {
      await setViewport(390, 844, true);
      await navigate('/');
      await waitFor('document.querySelector("homepage-graph .homepage-constellation") !== null', 'home graph');
      assert.equal(await evaluate('document.querySelector(".homepage-constellation").open'), false);
      await focus('.audience-disclosure summary');
      await key('Enter');
      assert.equal(await evaluate('document.querySelector(".audience-disclosure").open'), true);
      assert(await evaluate('document.querySelector(".audience-disclosure > div").getBoundingClientRect().height > 0'));

      await evaluate(`document.querySelector('a[href="/systems"]').scrollIntoView({ block: 'center' })`);
      await click('a[href="/systems"]');
      await waitFor('location.pathname === "/systems" && !!document.querySelector("h1")', 'systems destination');
      await evaluate('history.back()');
      await waitFor('location.pathname === "/" && !!document.querySelector("homepage-graph")', 'back to home');
      assert.equal(await evaluate('document.querySelector("h1").textContent.includes("Sovereign AI")'), true);
      await capture('home-details-back-mobile');
      return {
        destination: '/systems',
        recovery: 'history.back() returned to / with homepage heading and graph',
        detailsAfterBack: await evaluate('document.querySelector(".audience-disclosure").open'),
      };
    });

    await step('graph controls keyboard, touch, clear, and horizontal scroll', async () => {
      await setViewport(390, 844, true);
      await navigate('/');
      await focus('.homepage-constellation > summary');
      await key('Enter');
      await waitFor('document.querySelector("systems-constellation") !== null', 'graph disclosure open');
      assert.equal(await evaluate('document.querySelectorAll("systems-constellation [data-system]").length'), 10);

      await focus('systems-constellation [data-system="signet"]');
      await key('Enter');
      assert.equal(await evaluate('document.querySelector(\'[data-system="signet"]\').getAttribute("aria-pressed")'), 'true');
      assert.match(await evaluate('document.querySelector("[data-hud-relationships]").textContent'), /Signet → Auspex/);
      await key('Escape');
      assert.equal(await evaluate('document.querySelector(\'[data-system="signet"]\').getAttribute("aria-pressed")'), 'false');

      await touch('systems-constellation [data-system="navigator"]');
      await waitFor(
        `document.querySelector('systems-constellation [data-system="navigator"]').getAttribute('aria-pressed') === 'true'`,
        'touch graph selection',
      );
      assert.match(await evaluate('document.querySelector("[data-hud-relationships]").textContent'), /Navigator/);
      await click('systems-constellation [data-clear]');
      assert.equal(await evaluate('document.querySelector(\'[data-system="navigator"]\').getAttribute("aria-pressed")'), 'false');

      await focus('.constellation-scroll');
      await key('ArrowRight');
      await waitFor('document.querySelector(".constellation-scroll").scrollLeft > 0', 'keyboard graph scroll');
      await focus('systems-constellation [data-system="navigator"]');
      await key('Enter');
      await capture('graph-controls-mobile');
      return {
        controls: '10 system buttons',
        keyboard: 'Signet select → Escape clear',
        touch: 'Navigator select → Clear selection',
        scroll: 'ArrowRight advanced the graph scroll region',
      };
    });

    await step('mobile disclosures by keyboard and touch', async () => {
      await setViewport(390, 844, true);
      await navigate('/');
      const disclosureGroups = [
        ['audience', '.audience-disclosure'],
        ['founder', '.founder-disclosure'],
        ['shipping', '.shipping-disclosure'],
      ];
      const counts = {};
      for (const [name, selector] of disclosureGroups) {
        counts[name] = await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
        assert(counts[name] > 0, `${name} disclosures missing`);
        const summary = `${selector} summary`;
        await focus(summary);
        await key('Enter');
        assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).open`), true, `${name} keyboard open`);
        await key('Enter');
        assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).open`), false, `${name} keyboard close`);
      }
      await touch('.audience-disclosure summary');
      assert.equal(await evaluate('document.querySelector(".audience-disclosure").open'), true);
      await touch('.founder-disclosure summary');
      assert.equal(await evaluate('document.querySelector(".founder-disclosure").open'), true);
      await touch('.shipping-disclosure summary');
      assert.equal(await evaluate('document.querySelector(".shipping-disclosure").open'), true);
      await capture('disclosures-mobile');
      return { viewport: '390x844', counts, keyboard: 'all groups opened and closed', touch: 'one disclosure in each group opened' };
    });

    await step('PDF open/save actions and email actions', async () => {
      await setViewport(1280, 900, false);
      await navigate('/research');
      await waitFor('document.querySelectorAll(".paper-card").length === 5', 'research cards');
      const papers = await evaluate(`[...document.querySelectorAll('.paper-card')].map((card) => {
        const [open, save] = card.querySelectorAll('.paper-actions a');
        return {
          title: card.querySelector('h3').textContent.trim(),
          open: { href: open.getAttribute('href'), target: open.target, rel: open.rel, label: open.getAttribute('aria-label') },
          save: { href: save.getAttribute('href'), download: save.getAttribute('download'), label: save.getAttribute('aria-label') },
        };
      })`);
      assert.equal(papers.length, 5);
      for (const paper of papers) {
        assert.equal(paper.open.target, '_blank');
        assert(paper.open.rel.includes('noopener'));
        assert.equal(paper.save.href, paper.open.href);
        assert.equal(paper.save.download, paper.open.href.split('/').pop());
        const response = await fetch(`${origin}${paper.open.href}`);
        assert.equal(response.status, 200, `${paper.title}: PDF status`);
        assert.match(response.headers.get('content-type') || '', /^application\/pdf\b/);
        const bytes = Buffer.from(await response.arrayBuffer());
        assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', `${paper.title}: PDF signature`);
      }

      // Exercise the first "Open PDF" with the keyboard. The opener reports the
      // new tab in Page.windowOpen without taking the QA page away from research.
      await focus('.paper-actions a[target="_blank"]');
      const openEventStart = events.length;
      await key('Enter');
      await waitFor(
        `Array.from(document.querySelectorAll('.paper-actions a[target="_blank"]')).length === 5`,
        'research page after PDF open',
      );
      await wait(500);
      const opened = events.slice(openEventStart).find((event) => event.method === 'Page.windowOpen');
      assert(opened, 'Open PDF did not report a new tab');
      assert.equal(opened.params.url, `${origin}${papers[0].open.href}`);

      const saved = [];
      for (let index = 0; index < papers.length; index += 1) {
        await focus(`.paper-card:nth-of-type(${index + 1}) .paper-actions a[download]`);
        const eventStart = events.length;
        await key('Enter');
        await waitFor(
          `Array.from(document.querySelectorAll('.paper-actions a[download]')).length === 5`,
          `research page after saving ${index + 1}`,
        );
        const deadline = Date.now() + 15_000;
        let completed;
        while (Date.now() < deadline && !completed) {
          completed = events.slice(eventStart).find(
            (event) => event.method === 'Browser.downloadProgress' && event.params.state === 'completed',
          );
          if (!completed) await wait(100);
        }
        const begun = events.slice(eventStart).find((event) => event.method === 'Browser.downloadWillBegin');
        assert(begun, `Save PDF ${index + 1} did not begin a download`);
        assert(completed, `Save PDF ${index + 1} did not complete a download`);
        assert.equal(begun.params.suggestedFilename, papers[index].save.download);
        const bytes = await readFile(join(downloadDir, begun.params.suggestedFilename));
        assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
        saved.push(begun.params.suggestedFilename);
      }
      await capture('research-pdfs');

      await setViewport(390, 844, true);
      await navigate('/');
      await waitFor('document.querySelectorAll(".audience-disclosure").length === 3', 'home email disclosures');
      await focus('.audience-disclosure summary');
      await key('Enter');
      await evaluate(`window.__qaEmailClicks = [];
        window.__qaEmailGuard = (event) => {
          const link = event.target.closest?.('a[href^="mailto:"]');
          if (link) { event.preventDefault(); window.__qaEmailClicks.push(link.href); }
        };
        document.addEventListener('click', window.__qaEmailGuard, true);`);
      await touch('.audience-disclosure a[data-track="federal"]');
      await waitFor('window.__qaEmailClicks.length === 1', 'touch email action');
      assert.match(await evaluate('window.__qaEmailClicks[0]'), /^mailto:jesse@thornveil\.ai\?/);

      await setViewport(1280, 900, false);
      await navigate('/');
      const emailLinks = await evaluate(`[...document.querySelectorAll('a[data-track], footer a[href^="mailto:"]')].map((link) => ({
        track: link.dataset.track || 'footer',
        href: link.href,
      }))`);
      const federal = emailLinks.find((link) => link.track === 'federal');
      const prime = emailLinks.find((link) => link.track === 'prime');
      const cofounder = emailLinks.find((link) => link.track === 'cofounder');
      assert(federal && prime && cofounder);
      assert.equal(new URL(federal.href).pathname, 'jesse@thornveil.ai');
      assert.equal(new URL(federal.href).searchParams.get('subject'), 'Federal evaluation inquiry');
      assert.equal(new URL(prime.href).searchParams.get('subject'), 'Prime / SI integration inquiry');
      assert.equal(cofounder.href, `${origin}/cofounder`);
      assert(emailLinks.some((link) => link.track === 'footer' && link.href === 'mailto:jesse@thornveil.ai'));

      await evaluate(`window.__qaEmailClicks = [];
        window.__qaEmailGuard = (event) => {
          const link = event.target.closest?.('a[href^="mailto:"]');
          if (link) { event.preventDefault(); window.__qaEmailClicks.push(link.href); }
        };
        document.addEventListener('click', window.__qaEmailGuard, true);`);
      await click('a[data-track="federal"]');
      await click('a[data-track="prime"]');
      await waitFor('window.__qaEmailClicks.length === 2', 'desktop generated email actions');
      await click('a[data-track="cofounder"]');
      await waitFor('location.pathname === "/cofounder" && !!document.querySelector(".cofounder-email")', 'co-founder profile action');
      assert.match(await evaluate('document.querySelector(".cofounder-email").getAttribute("href")'), /^mailto:jesse@thornveil\.ai\?subject=Co-founder%20application$/);
      await capture('email-actions');
      return {
        pdfs: `${papers.length} HTTP PDFs; keyboard open event; ${saved.length} completed downloads`,
        email: 'federal and prime mailto drafts intercepted after actual touch/click; co-founder action reached /cofounder',
        screenshot: 'research-pdfs and email-actions',
      };
    });

    await step('404 recovery', async () => {
      await setViewport(1280, 900, false);
      const missingPath = '/qa-journeys-missing-page';
      const missingResponse = await fetch(`${origin}${missingPath}`);
      assert.equal(missingResponse.status, 404);
      await navigate(missingPath);
      assert.match(await evaluate('document.querySelector("h1").textContent'), /Page not found/);
      assert.match(await evaluate('document.body.innerText'), /Return to home/i);
      assert.match(await evaluate('document.querySelector(\'main a[href="/"]\').textContent'), /Return to home/i);
      await capture('404-recovery');
      await click('main a[href="/"]');
      await waitFor('location.pathname === "/" && !!document.querySelector("h1")', '404 return home');
      assert.match(await evaluate('document.querySelector("h1").textContent'), /Sovereign AI/);
      await capture('404-recovery-home');
      return { missingPath, status: missingResponse.status, recovery: 'Return to home reached /' };
    });

    console.log(`Completed ${results.length} QA journeys.`);
    console.log(JSON.stringify({
      origin,
      cdpPort: port,
      profile,
      browserAvailability,
      screenshots,
      results,
    }, null, 2));

    // Keep the endpoint in the launch path observable to make accidental
    // fallback to the shared 9222 browser obvious in a command transcript.
    void browserEndpoint;
  } finally {
    socket?.socket.close();
    browser.kill();
    await browserExit;
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

await main();