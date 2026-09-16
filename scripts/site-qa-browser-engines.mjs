// Non-graphics journeys only; no dependencies installed and no shared reports overwritten.
// node scripts/site-qa-browser-engines.mjs
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { launchEngine, until, delay } from './journey-browser-adapter.mjs';

const origin = (process.env.SITE_QA_ORIGIN || `https://${process.env.REPLIT_DEV_DOMAIN || ''}`).replace(/\/+$/, '');
assert(new URL(origin).hostname, 'SITE_QA_ORIGIN or REPLIT_DEV_DOMAIN required');
const engines = (process.env.JOURNEY_ENGINES || 'chromium,firefox,webkit').split(',');
assert(engines.length && engines.every(engine => ['chromium', 'firefox', 'webkit'].includes(engine)), 'Unknown engine');
const output = process.env.JOURNEY_EVIDENCE_DIR || 'docs/site-qa-evidence/browser-engines';
await mkdir(output, { recursive: true });
const report = {
  capturedAt: new Date().toISOString(), origin,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  physicalDevices: 'UNVERIFIED', nativeZoom: 'UNVERIFIED', nativeHandlers: 'UNVERIFIED',
  scope: 'Linux headless engines, normal motion, CSS viewport emulation; no graphics assertions',
  engines: [],
};
const routes = ['/', '/systems', '/defense', '/mycelium', '/research', '/about', '/cofounder', '/contact', '/privacy', '/404'];
for (const engine of engines) {
  const result = { engine, status: 'RUNNING', checks: [] };
  report.engines.push(result);
  let browser;
  try {
    browser = await launchEngine(engine);
  } catch (error) {
    Object.assign(result, { status: 'UNAVAILABLE', error: error.message });
    console.error(`${engine}: UNAVAILABLE: ${error.message}`);
    continue;
  }
  result.version = browser.version;
  result.control = browser.control;
  const { evaluate, key } = browser;
  const focus = async selector => {
    assert(await evaluate(`(() => {
      const el=document.querySelector(${JSON.stringify(selector)});
      el?.focus(); return !!el && document.activeElement === el;
    })()`), `Could not focus ${selector}`);
  };
  const nav = async path => {
    await browser.navigate(`${origin}${path}`);
    await until(async () => {
      try { return await evaluate(`location.pathname === ${JSON.stringify(path)} && !!document.querySelector('main') && document.readyState !== 'loading'`); }
      catch { return false; }
    }, `navigation ${path}`);
    await delay(500);
  };
  const check = async (name, callback) => {
    const row = { name };
    try {
      row.details = await callback();
      row.status = 'PASS';
    } catch (error) {
      row.status = 'FAIL';
      row.error = error.message;
    }
    row.screenshot = join(output, `${engine}-${name}.png`);
    try { await browser.capture(row.screenshot); }
    catch (error) { row.screenshotError = error.message; row.status = 'FAIL'; }
    result.checks.push(row);
    console.log(`${engine}: ${row.status} ${name}${row.error ? `: ${row.error}` : ''}`);
  };
  try {
    await check('navigation-and-back', async () => {
      await browser.viewport(1280, 900);
      for (const route of routes) {
        await nav(route);
        assert.equal(await evaluate(`document.querySelectorAll('main').length`), 1, route);
        assert.equal(await evaluate(`document.querySelectorAll('h1').length`), 1, route);
      }
      await nav('/');
      await browser.click('header a[href="/systems"]');
      await until(async () => await evaluate('location.pathname === "/systems"'), 'Systems link');
      await evaluate('history.back()');
      await until(async () => {
        try { return await evaluate('location.pathname === "/" && !!document.querySelector("h1")'); } catch { return false; }
      }, 'browser Back');
      return { routes, journey: 'Home → Systems → browser Back' };
    });
    for (const [width, height] of [[390, 844], [640, 360]]) {
      await check(`menu-${width}x${height}`, async () => {
        await browser.viewport(width, height);
        await nav('/about');
        assert.equal(await evaluate('document.querySelector("#mobile-menu").inert'), true);
        await focus('#mobile-toggle');
        await key('Enter');
        await until(async () => await evaluate('document.querySelector("#mobile-toggle").getAttribute("aria-expanded") === "true"'), 'menu open');
        const hrefs = ['/systems', '/defense', '/research', '/about', '/contact'];
        for (const href of hrefs) {
          await key('Tab');
          await delay(100);
          assert.equal(await evaluate('document.activeElement.getAttribute("href")'), href);
          assert(await evaluate(`(() => { const el=document.activeElement,r=el.getBoundingClientRect();
            return r.top>=0 && r.bottom<=innerHeight+1 && el.matches(':focus-visible') &&
              el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })()`), `${href}: focused menu link clipped or occluded`);
        }
        await key('Escape');
        assert.equal(await evaluate('document.activeElement.id'), 'mobile-toggle');
        assert.equal(await evaluate('document.querySelector("#mobile-menu").inert'), true);
        await browser.click('#mobile-toggle');
        await browser.click('#mobile-menu a[href="/contact"]');
        await until(async () => await evaluate('location.pathname === "/contact"'), 'menu Contact destination');
        return { focusOrder: hrefs, escape: 'restores toggle', pointer: 'Contact navigated' };
      });
    }
    await check('disclosures', async () => {
      await browser.viewport(390, 844);
      await nav('/');
      const counts = {};
      for (const group of ['audience', 'founder', 'shipping']) {
        const selector = `.${group}-disclosure`;
        const count = await evaluate(`document.querySelectorAll('${selector}').length`);
        assert(count > 0);
        counts[group] = count;
        for (let index = 0; index < count; index++) {
          await evaluate(`document.querySelectorAll('${selector}')[${index}].querySelector('summary').focus()`);
          await key('Enter');
          assert.equal(await evaluate(`document.querySelectorAll('${selector}')[${index}].open`), true);
          await key('Enter');
          assert.equal(await evaluate(`document.querySelectorAll('${selector}')[${index}].open`), false);
        }
        await browser.click(`${selector} summary`);
        assert.equal(await evaluate(`document.querySelector('${selector}').open`), true);
      }
      return counts;
    });
    await check('pdf-responses-and-save', async () => {
      await browser.viewport(1280, 900);
      await nav('/research');
      const papers = await evaluate(`Array.from(document.querySelectorAll('.paper-actions')).map(el => {
        const open=el.querySelector('a[target="_blank"]'),save=el.querySelector('a[download]');
        return {href:open.getAttribute('href'),rel:open.rel,save:save.getAttribute('href'),filename:save.download};
      })`);
      assert.equal(papers.length, 5);
      for (let index = 0; index < papers.length; index++) {
        const paper = papers[index];
        assert(paper.rel.includes('noopener'));
        assert.equal(paper.href, paper.save);
        const response = await fetch(new URL(paper.href, origin));
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type'), /^application\/pdf/);
        assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
        const start = browser.events.length;
        await evaluate(`document.querySelectorAll('.paper-actions a[download]')[${index}].focus()`);
        await key('Enter');
        if (browser.control === 'CDP') {
          await until(() => browser.events.slice(start).some(event => event.method === 'Browser.downloadProgress' && event.params.state === 'completed'), 'PDF download');
          const event = browser.events.slice(start).find(event => event.method === 'Browser.downloadWillBegin');
          assert.equal(event.params.suggestedFilename, paper.filename);
          assert.equal((await readFile(join(browser.downloadPath, paper.filename))).subarray(0, 5).toString(), '%PDF-');
        } else {
          await until(() => browser.events.slice(start).some(event => event.kind === 'download'), 'PDF download');
          const download = browser.events.slice(start).find(event => event.kind === 'download').download;
          assert.equal(await download.failure(), null);
          assert.equal(download.suggestedFilename(), paper.filename);
          assert.equal((await readFile(await download.path())).subarray(0, 5).toString(), '%PDF-');
        }
      }
      return { papers, limitation: 'Native viewer rendering not asserted' };
    });
    await check('pdf-open', async () => {
      await nav('/research');
      const href = await evaluate(`document.querySelector('.paper-actions a[target="_blank"]').href`);
      const start = browser.events.length;
      await focus('.paper-actions a[target="_blank"]');
      await key('Enter');
      await until(() => browser.events.slice(start).some(event =>
        event.method === 'Page.windowOpen' && event.params.url === href ||
        event.kind === 'popup' && event.popup.url() === href ||
        event.kind === 'download' && event.download.url() === href), 'matching PDF open event');
      for (const event of browser.events.slice(start).filter(event => event.kind === 'download' && event.download.url() === href)) {
        assert.equal(await event.download.failure(), null, 'Open PDF download failed');
        assert.equal((await readFile(await event.download.path())).subarray(0, 5).toString(), '%PDF-');
      }
      return { href, events: browser.events.slice(start).filter(event => event.method === 'Page.windowOpen' || event.kind).map(event => ({ kind: event.kind || event.method, url: event.popup?.url() || event.download?.url() || event.params?.url })), limitation: 'Matching popup/download event only, not native PDF viewer' };
    });
    await check('email-activation', async () => {
      await nav('/');
      await browser.viewport(390, 844);
      await delay(250);
      await evaluate(`window.__journeyMail = []; document.addEventListener('click', event => {
        const link=event.target.closest('a[href^="mailto:"]');
        if(link){event.preventDefault();window.__journeyMail.push(link.href);}
      },true)`);
      for (const [index, track] of ['federal', 'prime'].entries()) {
        await evaluate(`document.querySelector('.audience-disclosure a[data-track="${track}"]').closest('details').querySelector('summary').focus()`);
        await key('Enter');
        await focus(`.audience-disclosure a[data-track="${track}"]`);
        await key('Enter');
        await until(async () => await evaluate(`window.__journeyMail.length === ${index + 1}`), `${track} email activation`);
      }
      await browser.click('footer a[href^="mailto:"]');
      await until(async () => await evaluate('window.__journeyMail.length === 3'), 'footer email activation');
      const mails = await evaluate('window.__journeyMail');
      assert.equal(mails.length, 3);
      assert.equal(new URL(mails[0]).searchParams.get('subject'), 'Federal evaluation inquiry');
      assert.equal(new URL(mails[1]).searchParams.get('subject'), 'Prime / SI integration inquiry');
      assert(mails.every(mail => new URL(mail).pathname === 'jesse@thornveil.ai'));
      assert.equal(new URL(mails[2]).searchParams.get('subject'), null);
      return { mails, limitation: 'Intercepted; no mail client opened or email sent' };
    });
    await check('cofounder-action', async () => {
      await browser.viewport(390, 844);
      await nav('/');
      await evaluate(`document.querySelector('.audience-disclosure a[data-track="cofounder"]').closest('details').querySelector('summary').focus()`);
      await key('Enter');
      await browser.click('.audience-disclosure a[data-track="cofounder"]');
      await until(async () => await evaluate('location.pathname === "/cofounder"'), 'co-founder destination');
      return { destination: '/cofounder' };
    });
    await check('skip-link-focus', async () => {
      await browser.viewport(1280, 900);
      await nav('/about');
      await key('Tab');
      assert(await evaluate('document.activeElement.matches(".skip-link:focus-visible")'));
      assert(await evaluate(`(() => {
        const el=document.activeElement,r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return r.width>0 && r.height>0 && r.top>=0 && r.bottom<=innerHeight &&
          r.left>=0 && r.right<=innerWidth && s.visibility==='visible' &&
          Number(s.opacity)>0 && el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
      })()`), 'Skip link must be visibly onscreen and unobscured');
      assert(await evaluate('!!document.getElementById("main-content")'), 'Skip target exists');
      await key('Enter');
      assert.equal(await evaluate('location.hash'), '#main-content');
      assert.equal(await evaluate('document.activeElement.id'), 'main-content');
      return { firstTab: 'skip link', target: '#main-content' };
    });
    await check('zoom-reflow', async () => {
      // Explicitly CSS reflow equivalence, NOT browser/native text-only zoom.
      await browser.viewport(640, 450);
      for (const route of routes) {
        await nav(route);
        assert(await evaluate('document.documentElement.scrollWidth <= innerWidth+1'), `${route}: horizontal overflow`);
      }
      return { viewport: '640×450', equivalent: '1280×900 at 200% layout zoom', nativeZoom: 'UNVERIFIED', routes };
    });
  } finally {
    try { await browser.close(); }
    catch (error) { result.cleanupError = error.message; }
  }
  result.status = result.cleanupError || result.checks.some(row => row.status !== 'PASS') ? 'FAIL' : 'PASS';
}
report.completedAt = new Date().toISOString();
await writeFile(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
// An unavailable requested engine is incomplete coverage, never a green skip.
process.exitCode = report.engines.some(engine => engine.status === 'FAIL') ? 1 :
  report.engines.some(engine => engine.status === 'UNAVAILABLE') ? 2 : 0;