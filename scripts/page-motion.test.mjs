import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('page motion cleans up round trips, anchors, counts and preference changes', () => {
  class Events {
    listeners = new Map();
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set());
      this.listeners.get(name).add(fn);
    }
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
    emit(name, event = {}) { for (const fn of this.listeners.get(name) ?? []) fn(event); }
    count(name) { return this.listeners.get(name)?.size ?? 0; }
  }
  class Element {
    attrs = new Map();
    dataset = {};
    isConnected = true;
    textContent = '';
    closest() { return this; }
    getAttribute(key) { return this.attrs.get(key) ?? null; }
    hasAttribute(key) { return this.attrs.has(key); }
    setAttribute(key, value) { this.attrs.set(key, value); }
    removeAttribute(key) { this.attrs.delete(key); }
    focus() { this.focused = true; }
  }
  const document = new Events();
  const motion = new Events();
  motion.matches = false;
  const window = new Events();
  window.location = { pathname: '/', hash: '' };
  window.history = { state: { astro: true }, pushState(state, _, hash) {
    assert.deepEqual(state, { astro: true });
    window.location.hash = hash;
  } };
  window.matchMedia = () => motion;
  const target = new Element();
  const stat = new Element();
  stat.dataset.countup = '1.2K';
  document.querySelectorAll = () => [stat];
  document.getElementById = (id) => id === 'valid:id' ? target : null;
  const instances = [];
  class Lenis {
    frames = 0;
    scrolls = [];
    constructor() { instances.push(this); }
    raf() { assert.ok(!this.destroyed); this.frames++; }
    destroy() { assert.ok(!this.destroyed); this.destroyed = true; }
    scrollTo(el) { this.scrolls.push(el); }
  }
  let nextFrame = 0;
  const frames = new Map();
  const context = vm.createContext({
    window, document, Element, Lenis, performance: { now: () => 0 },
    requestAnimationFrame(fn) { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  const source = readFileSync(new URL('../src/scripts/page-motion.js', import.meta.url), 'utf8');
  vm.runInContext(source.replace('export function', 'function') + '\ninstallPageMotion(Lenis);', context);
  function load(path) {
    window.location.pathname = path;
    document.emit('astro:page-load');
  }
  function click(href, extra = {}) {
    const anchor = new Element();
    anchor.setAttribute('href', href);
    const event = { target: anchor, button: 0, preventDefault() { this.defaultPrevented = true; }, ...extra };
    document.emit('click', event);
    return event;
  }
  load('/');
  assert.equal(instances.length, 1);
  assert.equal(document.count('click'), 1);
  assert.equal(click('#valid%3Aid').defaultPrevented, true);
  assert.equal(instances[0].scrolls.length, 1);
  assert.equal(target.focused, true);
  assert.equal(target.hasAttribute('tabindex'), false);
  for (const href of ['#', '#missing', '#%ZZ', '/about', 'https://example.com/#valid']) {
    assert.ok(!click(href).defaultPrevented);
  }
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey']) {
    assert.ok(!click('#valid%3Aid', { [modifier]: true }).defaultPrevented);
  }
  for (let i = 0; i < 4; i++) {
    const old = instances.at(-1);
    const staleCallbacks = [...frames.values()];
    document.emit('astro:before-swap');
    assert.ok(old.destroyed);
    assert.equal(frames.size, 0);
    assert.equal(document.count('click'), 0);
    assert.equal(motion.count('change'), 0);
    for (const fn of staleCallbacks) fn(100);
    assert.equal(frames.size, 0);
    load('/about/');
    assert.equal(instances.at(-1), old);
    document.emit('astro:before-swap');
    assert.equal(frames.size, 0);
    load('/systems');
    assert.equal(document.count('click'), 0);
    load('/');
    assert.equal(document.count('click'), 1);
    assert.equal(motion.count('change'), 1);
    assert.equal(click('#valid%3Aid').defaultPrevented, true);
  }
  motion.matches = true;
  motion.emit('change');
  assert.ok(instances.at(-1).destroyed);
  assert.equal(frames.size, 0);
  assert.equal(stat.textContent, '1.2K');
  assert.ok(!click('#valid%3Aid').defaultPrevented);
  load('/');
  assert.equal(frames.size, 0);
  motion.matches = false;
  motion.emit('change');
  assert.equal(frames.size, 1, 'only scrolling restarts, not counts');
  load('/');
  assert.equal(document.count('click'), 1, 'repeated load stays idempotent');
  window.emit('pagehide');
  assert.equal(frames.size, 0);
  window.emit('pageshow', { persisted: true });
  assert.equal(document.count('click'), 1);
  document.emit('astro:before-swap');
  load('/about');
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, fn] of pending) fn(800);
  assert.equal(stat.textContent, '1.2K');
  assert.equal(frames.size, 0);
});