# Site structure and shell accessibility evidence

This is a focused browser check of the public site structure. It is evidence
from the managed development origin, not a production audit.

- **Origin:** `https://12314fdd-e2ee-47bf-a166-866792b8671c-00-1vsg61hrl2ay4-2d4n7szp.reed.replit.dev`
- **Initial run:** `2026-09-16T00:27:12.581Z` through `2026-09-16T00:28:08.718Z`
- **Targeted follow-up passes:** the shared desktop shell geometry was
  rechecked only on `/` at 1280 px (the final pass was
  `2026-09-16T00:34:21.178Z` through `2026-09-16T00:34:24.958Z`); the
  measurement was applied to all desktop route rows without rerunning the
  other 19 route/viewport combinations
- **Routes:** `/`, `/systems`, `/defense`, `/mycelium`, `/research`, `/about`,
  `/cofounder`, `/contact`, `/privacy`, `/404`
- **Viewports:** 390 × 844 (mobile emulation and touch) and 1280 × 900
- **Browser control:** owned headless Chromium 140 via CDP port `9226`,
  profile `/tmp/qa-structure`
- **Isolation:** the run did not contact CDP port `9222` (or any other
  DevTools port)
- **Raw evidence:** [`docs/site-qa-evidence/structure.json`](site-qa-evidence/structure.json)

The check was run with:

```sh
node scripts/site-qa-structure.mjs
```

The final geometry refresh used only the shared shell source route rather than
rerunning all 20 rows:

```sh
SITE_QA_VIEWPORTS=desktop-1280 SITE_QA_ROUTES=/ \
  SITE_QA_UPDATE_EXISTING=1 node scripts/site-qa-structure.mjs
```

## Method

Each route was loaded at both viewports, then the page was scrolled through
its full document before structural data was read. Scrolling is important for
this site because reveal animations otherwise leave below-the-fold headings
temporarily transparent. The evaluator counts only elements with a rendered
client rect and excludes `display:none`, hidden, invisible, zero-opacity, and
`aria-hidden` responsive branches.

The script records:

- the visible heading sequence, visible `h1` count, and every skipped heading
  level;
- visible banner, main, contentinfo, navigation, and region landmarks,
  including explicit navigation accessible names. An unnamed primary
  navigation is assessed as distinguishable when it is the only unnamed
  navigation and all other visible navigation landmarks have unique names;
- a real CDP `Tab` to focus the skip link, its visible focus state, and a real
  `Enter` activation of `#main-content`;
- bounding boxes for visible header/footer links and the mobile menu after it
  is intentionally opened. The comfort goal is 44 × 44 CSS px at both
  viewports; the WCAG 2.5.8 minimum floor used for the desktop spacing check
  is 24 × 24 CSS px. At 1280 px it also tests a 24 px diameter circle
  centered on each below-floor target against every other shell target
  rectangle and centered target circle, which records whether the spacing
  exception is available;
- console `error`/`warning` messages, runtime exceptions, failed requests,
  and HTTP responses at or above 400. These are retained in the raw report
  rather than discarded.

This is **not a screen-reader audit**. In particular, the explicit-name
inspection does not replace testing with a screen reader and accessibility
tree on supported assistive technology.

## Results

The raw report now classifies all 20 route/viewport rows as passing the
requested structure and interaction checks. The two advisory columns below
keep explicit-name and comfort-goal observations visible without treating
them as failures.

| Check | 390 × 844 | 1280 × 900 |
| --- | ---: | ---: |
| Routes loaded | 10/10 | 10/10 |
| Visible `h1` count exactly one | 10/10 | 10/10 |
| No skipped visible heading levels | 10/10 | 10/10 |
| Required banner/main/contentinfo counts | 10/10 | 10/10 |
| Navigation landmarks distinguishable (explicit names preferred) | 10/10 | 10/10 |
| Navigation landmarks with explicit names | 0/10 | 0/10 |
| Skip link: Tab focus, visible focus, Enter activation | 10/10 | 10/10 |
| Shell targets meet 44 px comfort goal | 10/10 | 0/10 |
| Shell targets meet 24 px floor or spacing exception | 10/10 | 10/10 |

### Findings

1. **The primary header navigation has no explicit label, but it is
   distinguishable rather than ambiguous.** The footer navigation is named
   `Footer`; local navigation landmarks are named `On this page` or
   `Systems on this page`. The global `<header>` navigation is the only
   unnamed navigation in each row, so the raw report records
   `pass-unambiguous-unnamed-primary`. Adding an explicit primary-navigation
   label remains a clarity preference, not a scoped failure here.

2. **15 of 17 desktop shell targets are below the 44 px comfort goal, while
   the ten 20.58 px-high footer links are below the 24 px floor without
   measured spacing collisions.** The header logo and primary links meet the
   24 × 24 floor at 1280 px, although the five primary text links are below
   the 44 px comfort goal. The seven footer navigation links and three footer
   external/contact links measured approximately 20.58 px high. A targeted
   1280 px shell measurement found no collision between any centered 24 px
   circle and another shell target rectangle or centered target circle, so
   those below-floor links are classified as
   `advisory-under-44-comfort`, not as WCAG 2.5.8 failures. The advisory is
   to consider the 44 px comfort goal, not evidence of a collision. All 18
   measured mobile shell targets on every mobile route meet 44 × 44,
   including the open mobile-menu links, footer links, logo links, and
   navigation toggle.

No heading-outline or skip-link finding was observed. The direct `/404`
response returned HTTP 404 at both viewports and rendered the expected
not-found page; those two document responses are classified as expected
`expected-404-route` in the raw evidence.

## Console and request classification

The run recorded no runtime exceptions and no unexpected diagnostics. The
50 retained diagnostics are classified in the raw report as expected
development/headless conditions:

- 20 development-toolbar `entrypoint.js` HTTP 504 responses, plus their
  canceled request events (`expected-dev-toolbar-504`);
- 2 expected `/404` document responses (`expected-404-route`);
- 8 headless Chromium WebGL errors/warnings on the home route, where the
  static graphics fallback reports `expected-headless-webgl-fallback`;

The WebGL console messages and toolbar 504s remain present in
`structure.json`; their classification prevents known environment behavior
from being reported as an application runtime exception. No exception event
was emitted. These development-host classifications should not be read as a
production health claim.
