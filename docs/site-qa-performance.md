# Site QA performance evidence

Captured from the current managed development origin, not from production:

- **Origin:** `https://12314fdd-e2ee-47bf-a166-866792b8671c-00-1vsg61hrl2ay4-2d4n7szp.reed.replit.dev` (the current `REPLIT_DEV_DOMAIN`)
- **Run:** `2026-09-16T00:19:02.755Z` through `2026-09-16T00:22:03.252Z`
- **Browser control:** an owned headless Chromium instance on CDP port `9224`, profile `/tmp/qa-performance`
- **Isolation:** this run did not contact CDP ports `9222` or `9223`
- **Evidence:** [`docs/site-qa-evidence/performance.json`](site-qa-evidence/performance.json)

This is development-host evidence, not a production measurement and not a Lighthouse-style performance score. No performance target or synthetic score is inferred from these observations.

## Profile and sampling

The browser used a deliberately explicit mobile profile:

| Setting | Value |
| --- | --- |
| Viewport | 390 × 844 CSS px, device scale factor 1, mobile emulation and touch enabled |
| CPU | 4× CDP CPU throttling |
| Network | “Slow 4G”: 150 ms latency, 200,000 B/s down (1.6 Mbps), 93,750 B/s up (750 kbps), `cellular4g` |
| Cache | HTTP cache and cookies cleared before every sample; origin storage cleared where supported; CDP cache disabled |
| Routes | `/` and `/mycelium` |
| Samples | Three cold-cache samples per route |

“Cold cache” here means browser HTTP/storage state was cleared. DNS, TLS session, and network connection reuse were **not** claimed to be cold. The browser’s profile and throttling configuration are recorded in the JSON rather than inferred from a score.

The workflow restart reported at `2026-09-16T00:14:30Z` preceded this run; the six performance samples were collected after that restart. The existing site-qa matrix browser was concurrently scrolling routes during the run. Shared host CPU, memory, and network contention can therefore inflate the observations; this run does not claim an isolated host. That contention and the isolation statement are recorded in the raw report.

## Observed load and layout metrics

The metric window starts at the navigation’s `navigationStart` and ends at the actual read taken after the `load` event plus a 2,000 ms stability wait. FCP and LCP are milliseconds after `navigationStart`. CLS is the sum of `layout-shift` values without recent input during that window. “Transferred bytes” is the sum of each navigation request’s `Network.loadingFinished.encodedDataLength` when it finished by the read; it is not an invented asset-size estimate.

| Route | Sample | FCP (ms) | LCP (ms) | CLS | Layout-shift entries | Transferred bytes | Requests | Failed requests | HTTP errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 1 | 660 | 712 | 0 | 0 | 1,334,190 | 57 | 1 | 1 |
| `/` | 2 | 868 | 868 | 0 | 0 | 1,333,712 | 59 | 3 | 1 |
| `/` | 3 | 772 | 772 | 0 | 0 | 1,333,503 | 58 | 2 | 1 |
| `/mycelium` | 1 | 736 | 736 | 0 | 0 | 1,072,250 | 40 | 1 | 1 |
| `/mycelium` | 2 | 596 | 596 | 0 | 0 | 1,072,388 | 40 | 2 | 1 |
| `/mycelium` | 3 | 636 | 636 | 0 | 0 | 1,072,313 | 40 | 2 | 1 |

Every sample reached `document.readyState === "complete"` and `document.fonts.status === "loaded"` before the metric read. The observed CLS was zero for all six windows; that is an observation under this profile/window, not a guarantee about every device, state, or longer session.

Actual navigation `loadEventEnd` times, from the same raw samples:

| Route | Sample 1 | Sample 2 | Sample 3 |
| --- | ---: | ---: | ---: |
| `/` | 7,003 ms | 7,069 ms | 6,922 ms |
| `/mycelium` | 6,316 ms | 6,154 ms | 6,918 ms |

These load-event timings include development resources and must not be confused with the earlier first-contentful-paint timings.

### Baseline preservation

The performance table and the corresponding samples in [`docs/site-qa-evidence/performance.json`](site-qa-evidence/performance.json) are retained unchanged as the **pre-layout-target-fix baseline**. This correction did not rerun the expensive performance workflow or replace any FCP, LCP, CLS, transfer-byte, request, or error values.

The raw request records show a development-toolbar `entrypoint.js` response with status 504 in each sample. Some samples also contain an aborted external Plausible event request and/or an aborted Vite dependency request. These were retained in the raw evidence rather than silently removed; they are one reason this development run must not be presented as a production score.

## Computed text contrast

The script evaluated computed browser styles on every public route:

`/`, `/systems`, `/defense`, `/mycelium`, `/research`, `/about`, `/cofounder`, `/contact`, `/privacy`, `/404`

It ran at both 390 × 844 mobile and 1440 × 900 desktop viewports. For each visible text node, it used the nearest computed solid opaque background and calculated WCAG 2.x relative luminance contrast. Normal text uses the 4.5:1 threshold; large text uses 3:1. No axe-core package was installed or run.

| Viewport | Visible text nodes | Computed opaque-background rows | Unresolved rows | Failing rows |
| --- | ---: | ---: | ---: | ---: |
| 390 × 844 | 415 | 376 | 39 | 0 |
| 1440 × 900 | 449 | 353 | 96 | 4 |

The original desktop failure was the repeated `Company`, `Location`, `Stage`, and `Start` labels on `/cofounder`: computed `rgb(126, 139, 150)` over `rgb(11, 20, 36)`, observed at 4.159:1 against the normal-text 4.5:1 threshold. That row is retained as the pre-correction contrast finding. The four hero `dt` labels are now corrected to `color: var(--text-2)` in `src/pages/cofounder.astro`.

### Corrected cofounder hero recheck

The focused recheck measured only those four corrected hero labels at desktop `1280 × 900` and `1440 × 900`, using its own headless Chromium on CDP port `9225` with profile `/tmp/qa-contrast`. It waited for `document.readyState === "complete"`, loaded fonts, all four labels to be in the viewport, every target ancestor to reach computed opacity `1`, and target animations to become idle; it then held that state for a further 300 ms before measuring. The reproducible command is:

```sh
node scripts/site-qa-contrast-recheck.mjs
```

Raw rows are recorded in [`docs/site-qa-evidence/contrast-recheck.json`](site-qa-evidence/contrast-recheck.json). Both viewports returned the same actual computed values for all four labels:

| Viewport | Labels | Computed foreground (`--text-2`) | Computed background | Actual ratio | Threshold | Stable/full opacity |
| --- | ---: | --- | --- | ---: | ---: | --- |
| 1280 × 900 | 4/4 | `rgb(152, 164, 176)` (`#98A4B0`) | `rgb(11, 20, 36)` | 7.257784:1 | 4.5:1 | Yes |
| 1440 × 900 | 4/4 | `rgb(152, 164, 176)` (`#98A4B0`) | `rgb(11, 20, 36)` | 7.257784:1 | 4.5:1 | Yes |

`Company`, `Location`, `Stage`, and `Start` each passed at both widths. This is a targeted correction recheck, not a rerun or replacement of the performance baseline.

Unresolved rows are intentionally not guessed. They include text without a nearest opaque computed background, and cases involving transparency, filters, gradients/images, or unsupported compositing. The prior whole-site method's “visible text nodes” count was limited to nodes with non-zero client rects and no hidden/zero-opacity ancestor at the instant of the read. It did not scroll each route to activate offscreen reveals: opaque layout boxes outside the viewport could still be counted, while offscreen `.reveal` content remained omitted until revealed. Therefore the `415`/`449` counts are limited snapshots, not complete route coverage. The calculation also does not cover pseudo-elements, canvas/WebGL text, focus/hover-only states, or responsive branches that are not rendered at the recorded viewport. It is a targeted computed-style check, not a complete WCAG audit; an axe audit would require installing or otherwise supplying `axe-core`.

## Re-running

From the repository, with the managed dev origin available:

```sh
node scripts/site-qa-performance.mjs
```

The script owns and tears down its Chromium process, always uses port 9224 and `/tmp/qa-performance`, writes the raw report incrementally, and records the origin, browser, profile, metric definitions, request records, contrast rows, and known host-contention caveat. It does not attach to the matrix browser or any other DevTools port.