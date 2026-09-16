// Whole-site browser evidence; run against the managed dev server, not production.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
const origin = process.env.SITE_QA_ORIGIN || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const out = 'docs/site-qa-evidence';
await mkdir(out, { recursive: true });
const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => socket.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map(), events = [];
socket.addEventListener('message', ({ data }) => {
  const m = JSON.parse(data);
  if (!m.id) return events.push(m);
  const p = pending.get(m.id); pending.delete(m.id);
  m.error ? p.reject(m.error) : p.resolve(m.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const pause = ms => new Promise(r => setTimeout(r, ms));
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
const routes = ['/', '/systems', '/defense', '/mycelium', '/research', '/about', '/cofounder', '/contact', '/privacy', '/404'];
const profiles = [
  ...[320, 360, 390, 430, 768, 1280].map(width => ({ name: `${width}`, width, height: 900 })),
  { name: 'landscape', width: 640, height: 360 },
  { name: 'zoom-reflow', width: 640, height: 450 },
  { name: 'no-js', width: 390, height: 844, noJS: true },
  { name: 'reduced-motion', width: 390, height: 844, reduce: true },
];
const report = process.env.SITE_QA_ROUTES
  ? JSON.parse(await readFile(`${out}/matrix.json`, 'utf8'))
  : { baseline: execSync('git rev-parse HEAD').toString().trim(), browser: await send('Browser.getVersion'), captured: new Date().toISOString(), origin, rows: [] };
report.workingTree = execSync('git diff -- src/pages').toString();
try {
  for (const profile of profiles.filter(p => !process.env.SITE_QA_PROFILES || process.env.SITE_QA_PROFILES.split(',').includes(p.name))) {
    await send('Emulation.setDeviceMetricsOverride', { width: profile.width, height: profile.height, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setScriptExecutionDisabled', { value: !!profile.noJS });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: profile.reduce ? 'reduce' : 'no-preference' }] });
    for (const route of routes.filter(r => !process.env.SITE_QA_ROUTES || process.env.SITE_QA_ROUTES.split(',').includes(r))) {
      events.length = 0;
      await send('Page.navigate', { url: origin + route });
      await pause(1600);
      for (let i = 0; i < 100; i++) {
        if (await evaluate('document.readyState === "complete" && !!document.querySelector("main")')) break;
        await pause(100);
      }
      // Reveal content by scrolling every viewport, never overriding site CSS.
      const height = await evaluate('document.documentElement.scrollHeight');
      for (let y = 0; y < height; y += profile.height * .8) {
        await evaluate(`scrollTo({top:${y},behavior:'instant'})`); await pause(220);
      }
      await pause(800);
      const data = await evaluate(`(() => {
        const visible = el => { for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;} return !!el.getClientRects().length; };
        const headings=[...document.querySelectorAll('main h1, main h2, main h3')].filter(h=>!h.classList.contains('sr-only')&&!h.closest('details:not([open])'));
        const clipped=headings.filter(h=>visible(h)).filter(h=>{const r=document.createRange();r.selectNodeContents(h);return [...r.getClientRects()].some(b=>b.left < -1 || b.right > innerWidth+1);}).map(h=>h.textContent.trim());
        const rendered = el => {for(let p=el;p;p=p.parentElement){if(getComputedStyle(p).display==='none')return false;}return true;};
        const hidden=headings.filter(rendered).filter(h=>!visible(h)).map(h=>h.textContent.trim());
        const small=[...document.querySelectorAll('a,button,summary')].filter(visible).filter(e=>!e.closest('p')).map(e=>({label:e.textContent.trim().slice(0,65),w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})).filter(e=>e.w<24||e.h<24);
        return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,banner:document.querySelectorAll('header').length,footer:document.querySelectorAll('footer').length,clipped,hidden,smallTargets:small,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')),runningAnimations:document.getAnimations().filter(a=>a.playState==='running').length};
      })()`);
      await evaluate('scrollTo(0,0)'); await pause(350);
      const file = `${profile.name}-${route === '/' ? 'home' : route.slice(1)}.jpg`;
      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 55, captureBeyondViewport: true, clip: { x: 0, y: 0, width: profile.width, height: await evaluate('document.documentElement.scrollHeight'), scale: 1 } });
      await writeFile(`${out}/${file}`, Buffer.from(shot.data, 'base64'));
      const errors = events.filter(e=>e.method==='Runtime.exceptionThrown'||e.method==='Network.loadingFailed'||(e.method==='Network.responseReceived'&&e.params.response.status>=400)).map(e=>({type:e.method,detail:e.method==='Network.responseReceived'?{url:e.params.response.url,status:e.params.response.status}:e.params}));
      const row = { route, profile: profile.name, capturedAt: new Date().toISOString(), ...data, errors, screenshot:file };
      const existing = report.rows.findIndex(r => r.route === route && r.profile === profile.name);
      if (existing < 0) report.rows.push(row);
      else report.rows[existing] = row;
      console.log(profile.name, route, JSON.stringify({clipped:data.clipped, hidden:data.hidden.length, overflow:data.scrollWidth>data.width,errors:errors.length}));
      await writeFile(`${out}/matrix.json`, JSON.stringify(report,null,2));
    }
  }
} finally { socket.close(); }