# Scroll-reveal investigation

## Scope and method

This is a focused follow-up to the full-scroll matrix. It used an owned
headless Chromium instance on CDP `9227` (Chrome `152.0.7977.64`) and did not
attach to the shared `9222` browser. The checks used the dev origin at
`REPLIT_DEV_DOMAIN`, `prefers-reduced-motion: no-preference`, and the source
currently in the working tree.

The reveal implementation under test is the observer in
`src/layouts/BaseLayout.astro`:

```js
{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
```

The CSS starts `.reveal` at `opacity: 0` and only makes it opaque after
`.visible` is added. The run instrumented `IntersectionObserver` before page
navigation, recording target rectangles, intersection ratios, and callback
state. It also recorded effective visibility through ancestors (the card
headings themselves can have computed opacity `1` while their unrevealed
parent remains opacity `0`).

Two scroll modes were compared:

* **Matrix reproduction:** instant scrolls every `720px` (`80%` of the
  `900px` viewport), with the existing `220ms` pause and final `800ms` wait.
* **Deliberate scroll:** instant scrolls every `180px`, with `300ms` between
  positions and a final `900ms` wait. This is intentionally slow enough to
  give observer callbacks and CSS transitions time to run; it does not alter
  site CSS or force visibility.

Raw observer/rectangle data and the four comparison captures are in
`docs/site-qa-evidence/reveal-investigation.json` and:

* `reveal-cofounder-360-fast.jpg`
* `reveal-cofounder-360-slow.jpg`
* `reveal-mycelium-768-fast.jpg`
* `reveal-mycelium-768-slow.jpg`

## Findings

| Route / viewport | Matrix reproduction | Deliberate scroll | Evidence |
| --- | --- | --- | --- |
| `/cofounder` `360×900` | **Four hidden headings:** `Auspex`, `Mycelium`, `RigRun`, `Signet` | The fresh/cold run remained hidden; a repeated cached run became visible only after a layout reflow reduced the wrapper height | The substrate wrapper was `top 1591.47`, `height 9242.23`; the effective observer root ended at `860px`. Its initial callback was `isIntersecting:false`, `ratio:0`, and no later `true` callback occurred in the hidden run. |
| `/mycelium` `768×900` | No hidden later `h2` reproduced | No hidden later `h2` | All later headings reached `visible`; no remaining `/mycelium` heading defect was observed in this controlled run. |

The co-founder cards are all inside one target:
`.space-y-s-3.reveal.reveal-delay-3`. At the narrow viewport that target is
over `9,242px` tall. A `0.1` threshold therefore requires at least about
`924px` of intersection. The observer root, after the `-40px` bottom margin,
is only `860px` tall. The target cannot satisfy the threshold at any scroll
position in that layout, so its opacity stays `0`; the four descendant `h3`
elements are consequently effectively hidden even though their own computed
opacity is `1`.

The repeated run shows why this can look like a harness-only failure: after a
later layout/font reflow, the same wrapper measured `5,192.31px`, reached
ratio `0.1076` at a slow-scroll position, received an `isIntersecting:true`
callback, and all four headings became visible. That is a timing-sensitive
layout outcome, not evidence that the `220ms` pause is intrinsically too
short. In the cold run, deliberate scrolling did not help because the target
never reached the threshold.

## Conclusion and narrow recommendation

This is a real, narrow integration defect in the `/cofounder` substrate
markup: a single reveal target wraps a long mobile list and is larger than
the observer root divided by its threshold. The instant-scroll harness makes
the defect deterministic and exposes it in the matrix, but it is not solely a
harness artifact. The `/mycelium` report does not remain reproducible with
the controlled `9227` run.

Do **not** change the shared no-JavaScript fallback or observer lifecycle
work covered by tasks 15/16. If this route is to be fixed separately, the
smallest scoped change is to avoid observing the oversized substrate wrapper:
reveal each substrate card independently (with its own safe-sized target), or
make only this list non-reveal/static. Retain the shared observer threshold
and lifecycle behavior.

## Applied QA correction

The release QA kept the substrate list static and stacked each card's content
and badge below 768px. The latter prevents the flexible text column from
shrinking beside a nonshrinking badge and producing extreme list heights.
Shared observer setup and lifecycle were not changed. The final matrix
rechecks `/cofounder` across all ten profiles, with corrected screenshots
replacing the route's matrix screenshots; the four investigation screenshots
above remain pre-correction evidence.