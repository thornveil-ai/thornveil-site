// Shared by the home/about entry scripts; Astro executes this module only once.
export function installPageMotion(Lenis) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dispose = () => {};

  function initialize() {
    dispose();
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/' && path !== '/about') return;

    let active = true;
    let lenis = null;
    let scrollFrame = null;
    const countFrames = new Map();
    const stats = [...document.querySelectorAll('[data-countup]')];

    function stopScrolling() {
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
      lenis?.destroy();
      lenis = null;
    }

    function finishCounts() {
      for (const frame of countFrames.values()) cancelAnimationFrame(frame);
      countFrames.clear();
      for (const el of stats) el.textContent = el.dataset.countup ?? '';
    }

    function startScrolling() {
      if (!active || path !== '/' || motion.matches || lenis) return;
      lenis = new Lenis({
        duration: 1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      function frame(time) {
        if (!active || !lenis) return;
        lenis.raf(time);
        scrollFrame = requestAnimationFrame(frame);
      }
      scrollFrame = requestAnimationFrame(frame);
    }

    function onMotionChange() {
      if (motion.matches) {
        stopScrolling();
        finishCounts();
      } else {
        // Count-ups never restart when a preference changes.
        startScrolling();
      }
    }

    function onAnchorClick(event) {
      if (!lenis || event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor || anchor.hasAttribute('download') ||
          (anchor.target && anchor.target !== '_self')) return;
      const href = anchor.getAttribute('href');
      if (!href?.startsWith('#') || href === '#') return;
      let id;
      try {
        id = decodeURIComponent(href.slice(1));
      } catch {
        return;
      }
      // IDs are not CSS selectors: punctuation and encoded IDs are valid.
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (window.location.hash !== href) {
        window.history.pushState(window.history.state, '', href);
      }
      // Match native fragment focus without jumping ahead of the animation.
      const temporaryTabIndex = !target.hasAttribute('tabindex');
      if (temporaryTabIndex) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (temporaryTabIndex) target.removeAttribute('tabindex');
      lenis.scrollTo(target);
    }

    startScrolling();
    if (motion.matches) finishCounts();
    else for (const el of stats) {
      const target = el.dataset.countup ?? '';
      if (!/^\d+(\.\d+)?[KMB]?$/.test(target)) continue;
      const suffix = (target.match(/[KMB]$/) ?? [''])[0];
      const final = parseFloat(target);
      const start = performance.now();
      function tick(time) {
        if (!active || motion.matches || !el.isConnected) return;
        const progress = Math.min(1, (time - start) / 720);
        const value = final * (1 - Math.pow(1 - progress, 3));
        el.textContent = `${Number.isInteger(final) ? Math.round(value) : value.toFixed(1)}${suffix}`;
        if (progress < 1) countFrames.set(el, requestAnimationFrame(tick));
        else {
          el.textContent = target;
          countFrames.delete(el);
        }
      }
      countFrames.set(el, requestAnimationFrame(tick));
    }

    document.addEventListener('click', onAnchorClick);
    motion.addEventListener('change', onMotionChange);
    dispose = () => {
      active = false;
      stopScrolling();
      finishCounts();
      document.removeEventListener('click', onAnchorClick);
      motion.removeEventListener('change', onMotionChange);
      dispose = () => {};
    };
  }

  document.addEventListener('astro:page-load', initialize);
  document.addEventListener('astro:before-swap', () => dispose());
  window.addEventListener('pagehide', () => dispose());
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) initialize();
  });
}