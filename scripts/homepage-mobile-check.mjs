// Run with Chromium listening on debugging port 9222.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
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
await send('Emulation.setEmulatedMedia', { features: [{name:'prefers-reduced-motion',value:'reduce'}] });
const baseline = process.argv.includes('--baseline');
await mkdir('/tmp/homepage-check', {recursive:true});
try {
  for (const width of [320, 390, 430, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height:width === 1440 ? 900 : 844,deviceScaleFactor:1,mobile:width < 768});
    await send('Page.navigate', {url:`https://${process.env.REPLIT_DEV_DOMAIN}/`});
    await wait(3000);
    const stats = await evaluate(`(() => {
      const hero = document.querySelector('main section');
      const cta = document.querySelector('a[href="#pick-your-track"]');
      return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
        heroHeight:hero?.getBoundingClientRect().height,ctaBottom:cta?.getBoundingClientRect().bottom,
        details:[...document.querySelectorAll('main details')].map(d=>({open:d.open,label:d.querySelector('summary')?.textContent.trim()}))};
    })()`);
    console.log(JSON.stringify(stats));
    if (stats.width !== width) console.log('Outlying elements', await evaluate(`[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>${width}+1 && getComputedStyle(e).position!=='absolute').slice(0,12).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))`));
    const shot = await send('Page.captureScreenshot', {format:'png'});
    await writeFile(`/tmp/homepage-check/${baseline?'before':'after'}-${width}.png`, Buffer.from(shot.data,'base64'));
    if (baseline) continue;
    assert.equal(stats.overflow,false);
    if (width < 721) assert(stats.ctaBottom < 650, 'Main action below first screen');
    if (width === 1440) assert.equal(await evaluate(`document.querySelector('.homepage-constellation').open`),true);
    await evaluate(`document.querySelector('a[href="#pick-your-track"]').click()`);
    await wait(400);
    assert.equal(await evaluate('location.hash'),'#pick-your-track');
    const count = await evaluate(`document.querySelectorAll('main details').length`);
    for (let i=0;i<count;i++) {
      await evaluate(`document.querySelectorAll('main details')[${i}].querySelector('summary').focus()`);
      const before = await evaluate(`document.querySelectorAll('main details')[${i}].open`);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
      if (width < 768) assert.equal(await evaluate(`document.querySelectorAll('main details')[${i}].open`),!before);
    }
    await evaluate(`document.querySelectorAll('main details').forEach(d=>d.open=true)`);
    await evaluate(`document.querySelector('[data-system]').focus()`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    assert.equal(await evaluate(`document.querySelector('[data-system]').getAttribute('aria-pressed')`),'true');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert.equal(await evaluate(`document.querySelector('[data-system]').getAttribute('aria-pressed')`),'false');
    const rect = await evaluate(`(()=>{const b=document.querySelector('[data-system]');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[rect]});
    await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await evaluate(`document.querySelector('[data-system]').getAttribute('aria-pressed')`),'true');
    await evaluate(`document.querySelector('[data-clear]').click()`);
    assert.equal(await evaluate(`document.querySelector('[data-system]').getAttribute('aria-pressed')`),'false');
    if (width < 768) {
      await evaluate(`document.querySelector('.constellation-scroll').focus()`);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
      await wait(300);
      assert(await evaluate(`document.querySelector('.constellation-scroll').scrollLeft > 0`));
    }
  }
  await evaluate(`document.querySelector('a[href="/about"]').click()`);
  await wait(1500);
  assert.equal(await evaluate('location.pathname'),'/about');
  await evaluate(`document.querySelector('a[href="/"]').click()`);
  await wait(1500);
  assert.equal(await evaluate('location.pathname'),'/');
  await evaluate(`document.querySelector('[data-system]').click()`);
  assert.equal(await evaluate(`document.querySelector('[data-system]').getAttribute('aria-pressed')`),'true');
  await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
  await wait(100);
  assert.equal(await evaluate(`document.querySelector('.homepage-constellation').open`),false);
  await send('Emulation.setScriptExecutionDisabled',{value:true});
  await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await send('Page.navigate',{url:`https://${process.env.REPLIT_DEV_DOMAIN}/`});
  await wait(2000);
  for (const selector of ['.audience-mobile details','.founder-disclosure','.shipping-mobile details','.homepage-constellation']) {
  assert.equal(await evaluate(`(()=>{let e=document.querySelector('${selector}');while(e){if(getComputedStyle(e).opacity==='0'||getComputedStyle(e).visibility==='hidden')return false;e=e.parentElement}return true})()`),true);
  const before = await evaluate(`document.querySelector('${selector}').open`);
  const summary = await evaluate(`(()=>{const e=document.querySelector('${selector} summary');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+20,y:r.y+20}})()`);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[summary]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await wait(300);
  assert.equal(await evaluate(`document.querySelector('${selector}').open`),!before);
  }
  await send('Emulation.setScriptExecutionDisabled',{value:false});
  console.log(baseline?'Baseline captured':'PASS: widths, hero action, overflow, disclosures, hash, graph keyboard/touch/clear/scroll');
} finally { socket.close(); }