/**
 * One observer per systems page. CSS owns the animation timelines; toggling
 * play-state preserves their position and the diagram's readable SVG content.
 */
export function observeSystemDiagrams(): () => void {
  const panels = [...document.querySelectorAll<HTMLElement>('[data-system-viz]')];
  if (!panels.length || !('IntersectionObserver' in window)) return () => {};

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set<Element>();
  const update = () => {
    for (const panel of panels) {
      panel.toggleAttribute('data-viz-active',
        visible.has(panel) && !document.hidden && !motion.matches);
    }
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    update();
  // A positive threshold also notifies after a zero-area edge intersection.
  }, { threshold: 0.001 });

  for (const panel of panels) {
    panel.setAttribute('data-viz-managed', '');
    observer.observe(panel);
  }
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);
  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', update);
    motion.removeEventListener('change', update);
    visible.clear();
    for (const panel of panels) {
      panel.removeAttribute('data-viz-active');
      panel.removeAttribute('data-viz-managed');
    }
  };
}