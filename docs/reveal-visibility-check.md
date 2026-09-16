# Reveal visibility verification

## Result

**Pass for the requested content-visibility checks.** The run used an owned
headless Chromium instance through CDP on the managed `REPLIT_DEV_DOMAIN`
origin. It covered all ten routes at both `1280×900` and `390×844`.

| Check | Coverage | Result |
| --- | ---: | --- |
| Normal motion + ordinary scrolling | 20 route/viewport rows | 20/20 had no hidden rendered headings |
| JavaScript disabled | 20 route/viewport rows | 20/20 had no hidden rendered headings |
| `prefers-reduced-motion: reduce` | 20 route/viewport rows | 20/20 had no hidden rendered headings; 0 running animations |
| `IntersectionObserver` absent | 20 route/viewport rows | 20/20 had no hidden rendered headings; 0 observer constructions |
| `IntersectionObserver` constructor throws | 20 route/viewport rows | 20/20 had no hidden rendered headings; the fallback stayed readable |
| Repeated Astro navigation | 5 in-document swaps | 5/5 clicked successfully; 5 `astro:before-swap` and 6 `astro:page-load` events; no hidden headings |

Normal motion was allowed to run and was then scrolled in viewport-sized
steps. The harness did not add `.visible`, set opacity, or otherwise force
content to appear. Persistent visualization animations are expected in the
normal/no-JS rows and were not treated as reveal failures.

## Lifecycle instrumentation

The injected CDP probe counted observer construction, observation,
`unobserve`, `disconnect`, requestAnimationFrame scheduling/cancellation, and
Astro lifecycle events. In the repeated sequence
`/ → /systems → /defense → /systems → /about → /`, every destination loaded
through an Astro navigation. Observer disconnect totals increased at every
swap (`3, 5, 6, 8, 9`), and the tracked active frame count was zero after
the first four swaps; the final sample retained two frames scheduled by the
new document. The initial swap cancelled two tracked frames, providing direct
evidence that cleanup can cancel pending frame work.

## Targeted follow-up

The passed matrix above was not rerun. A separate targeted CDP run covered the
remaining lifecycle cases:

* **BaseLayout module blocked:** CDP
  `Network.setBlockedURLs(["*BaseLayout.astro?astro&type=script*"])` was
  enabled before navigation. All 20 route/viewport rows (ten routes at both
  widths) issued a matching
  `/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts` request,
  and all 20 produced a `Network.loadingFailed` event with
  `blockedReason: "inspector"`. All 20 rows still had zero hidden rendered
  headings. The request URL, blocked-event request ID, and blocked-event result
  are paired per row in the `followup.blockedModule.rows` evidence.
* **Mobile repeated navigation with stack-filtered instrumentation:** At
  `390×844`, five real Astro swaps (`/ → /systems → /defense → /systems →
  /about → /`) all clicked and had zero hidden headings. The probe classified
  only constructor stacks containing `BaseLayout.astro` or
  `bindRevealObserver`, excluding system-visualization and Mycelium observers.
  At the `astro:before-swap` handler's cleanup microtask, the
  BaseLayout-specific active observer and tracked-frame counts were both zero
  for all five swaps. Some swaps had one active observer before the cleanup
  handler, and later task samples can show a new observer/frame from the
  destination page; those are not counted as stale pre-swap work.
* **Persisted restore simulation:** On the final mobile route, the harness
  dispatched synthetic `pagehide` and `pageshow` events whose `persisted`
  property was `true`. This is explicitly **not** a browser BFCache
  traversal. After synthetic pagehide, reveal observers and frames were zero;
  after synthetic pageshow, headings remained visible, there were zero
  `.reveal-animate` targets, and the reveal-animation-add delta was zero.
  Persisted flags observed were `pagehide: true` and `pageshow: true` (the
  initial non-persisted pageshow is also retained in raw evidence).

## Pre-change no-JavaScript comparison

Before this task’s source changes could be exercised live, the existing matrix
provided a useful reproduction: captured at
`2026-09-16T00:23:13.308Z` from baseline
`4d851255332733170d3e52a76d96cde654113f27`, its no-JS rows reported hidden
headings on `/`, `/systems`, `/defense`, `/mycelium`, `/research`, and
`/privacy` (the other four routes reported none). The post-change run reports
zero hidden rendered headings on all twenty no-JS route/viewport rows.

## Evidence and limitations

Raw compact row data is in
[`reveal-visibility-evidence.json`](reveal-visibility-evidence.json).
Responsive `display:none` branches are excluded from heading counts. Observer
constructor counts include observers from other components, so they are
evidence of the content fallback under absent/throwing observer conditions,
not an isolated BaseLayout-only count. This is CDP metric evidence rather
than a screenshot set; the harness did not modify app code, smoke tooling, or
CSS at runtime.