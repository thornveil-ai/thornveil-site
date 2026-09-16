# Reveal visibility and navigation regression tests

This suite owns tests only. It does not fix reveal behavior, change page styles,
install packages, reuse shared browser harnesses, or update the historical QA report.

## Run

Start the existing **Start application** workflow, then:

```sh
node --check scripts/reveal-failure-regression.mjs
node scripts/reveal-failure-regression.mjs
```

Requires Node 22+ (native fetch/WebSocket) and an installed `chromium` executable.
`CHROMIUM_BIN` may name a different Chromium executable. Missing browsers, failed
startup, protocol timeouts, absent injections and failed assertions return nonzero;
there is no browser-install or silent-skip fallback.

The default origin is `https://$REPLIT_DEV_DOMAIN`. To test a separately served
production build, explicitly set `REVEAL_TEST_ORIGIN` to that server's URL. The
suite does not build or start a server itself. It starts its own headless Chromium
with a temporary profile and an OS-selected debugging port, and removes both at
the end. It can run beside the older QA scripts without reusing their browser.

Default evidence: `/tmp/reveal-failure-regression.json`. To retain a run elsewhere:

```sh
REVEAL_TEST_REPORT=/tmp/reveal-post-merge.json \
  node scripts/reveal-failure-regression.mjs
```

For a focused cleanup recheck only:

```sh
REVEAL_TEST_REPORT=/tmp/reveal-lifecycle-final.json \
  node scripts/reveal-failure-regression.mjs --lifecycle-only
```

Its report is explicitly marked `lifecycle-only`; it does not replace the full
release command.

Allow several minutes. Exit **0** means every assertion passed; exit **1** means
at least one regression or unavailable prerequisite. Expected baseline failures
are never converted to passes. Each row has a name, result and evidence or error.

## Observable checks

- Ten routes: `/`, `/systems`, `/defense`, `/mycelium`, `/research`, `/about`,
  `/cofounder`, `/contact`, `/privacy`, `/404`, at 390 × 844 CSS pixels.
- Normal motion; JavaScript disabled with normal motion; blocked module requests;
  missing IntersectionObserver; throwing observer constructor; throwing
  `observe()` after reveal-target registration; reduced motion.
- Scroll through the normal-motion page without overriding opacity, classes,
  transitions or styles. Fallback modes must expose content without scrolling.
  Inspect reveal wrappers, individual line-reveal children and headings,
  including ancestor opacity/visibility. Exempt responsive display-none branches,
  screen-reader-only headings and closed disclosure content. This is not a full
  accessibility or visual-clipping audit.
- Module failure blocks script URL patterns before navigation and requires an
  observed blocked same-origin Astro/application Script request (not analytics)
  and absence of Astro page-load events. This
  models module delivery failure, not just disabling all JavaScript. Stylesheets
  remain enabled. Observer injections are installed before page modules.
- Reduced-motion checks run before scrolling: the media query must match,
  reveal content must be opaque, reveal observer registration must be absent,
  and reveal transition durations must be negligible.
- Eight same-document transitions exercise links plus repeated Back and Forward.
  Require actual Astro swap/page-load events, exact destinations, disconnection
  of old reveal observers, and cancellation of deliberately pending reveal frames.
  Require new destination reveal observers and pending paint frames as well.
  A hard page reload cannot satisfy the retained event counters.

For the cleanup race, dispatch one additional `astro:page-load` before each
navigation, with reveal RAF callbacks held. The shim continually defers those
callbacks using real native RAF requests, preserving a cancellable pending
request; cancellation is credited only before the application callback fires.
Releasing the hold allows remaining destination-page frames to run. This
deterministically exercises idempotent re-binding and pending-work cleanup without
depending on network speed. Frame attribution recognizes reveal/no-transitions
callback text and stacks. If a future refactor changes those names, missing frame
coverage fails explicitly and the harness must be updated; it must not be skipped.
Each rebind must create new observer/frame coverage. Only frame IDs actually
pending at navigation start are required to be cancelled; historical callbacks
that already fired are not counted as pending work.

Observers are classified when they observe a `.reveal` or `.line-reveal` target,
not by counting unrelated component observers. This checks explicit lifecycle
cleanup rather than inferring garbage collection from browser heap size.

## Baseline and release gate

Baseline: commit `485ddab1f502a7292e429bfd5c016d49e4607581`, Chromium
`152.0.7977.64`, development origin, full run started
**2026-09-16T05:53:31.314Z**. Exit **1**: **43 of 71 rows failed**.

| Profile | Passed / total | Baseline failures |
| --- | --- | --- |
| Normal | 10 / 10 | None |
| No JavaScript | 4 / 10 | Home, systems, defense, mycelium, research, privacy |
| Module failure | 1 / 10 | Every route except 404 |
| Missing observer | 1 / 10 | Every route except 404 |
| Throwing constructor | 1 / 10 | Every route except 404 |
| Throwing observe | 1 / 10 | Every route except 404 |
| Reduced motion | 10 / 10 | None |
| Navigation cleanup | 0 / 1 | Undisconnected observers and uncancelled frames |

The final destination-initialization assertions were then verified with
`--lifecycle-only`, started **2026-09-16T05:56:23.734Z**, same baseline and browser.
All eight expected destinations were reached and each destination installed one
reveal observer and one pending frame. Cleanup still failed: retained observer
counts rose **3, 5, 7, 9, 11, 13, 15, 17**; each transition left **one** source
frame uncancelled. The visibility matrix was unchanged by those added assertions.
Evidence for these runs is in the default full report and the focused report
paths above; `/tmp` evidence is temporary, so retain a new report for release.

Syntax validation passed. An explicit missing-executable run using
`CHROMIUM_BIN=/nonexistent/reveal-chromium` returned exit 1 with a harness
availability failure, not a skip. An earlier long full rerun was interrupted
(exit 143) and is not counted as completed coverage; the completed run above
replaced it.

A baseline failure is not approval to release. The complete suite must be rerun after the production
reveal fix is merged, using the exact commands above, and must exit 0. Retain the
JSON with its commit, browser version and timestamp. Also run against a freshly
built, served production output before release; a development pass does not prove
production module delivery works.

Only Chromium emulation is covered. Firefox, WebKit, physical devices and broad
navigation/accessibility checks remain with their existing verification tasks.