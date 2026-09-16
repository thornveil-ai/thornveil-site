# Published-site mobile loading baseline

## Target and release identity

**Live-version baseline, not verification of the pending local release.**
Measured `https://thornveil.ai` on 2026-09-16, from
05:39:02.757Z through 05:39:51.973Z. Nothing was pushed or published.

The deployment guidance's `getDeploymentInfo()` returned `success: true`,
`isDeployed: false`, and an empty production URL. This means no Replit deployment,
not that the existing external site is unpublished. The owner-confirmed Netlify
primary domain is recorded in `docs/privacy-operations-review.md`, “Reported
settings and limits.” Live document responses corroborated `server: Netlify`.
The development hostname was not used or converted into a production URL.
No hosting settings or archived metadata/privacy review work was changed.

Local reference at measurement time: `485ddab1f502a7292e429bfd5c016d49e4607581`.
This is **not** the verified deployed commit. No authenticated Netlify release
record was available, so deployed commit identity remains unknown. Pending changes
are not assumed present. The three document responses per route had stable SHA-256
fingerprints (decoded response bodies) and ETags:

| Final live route | SHA-256 | ETag |
| --- | --- | --- |
| `/` | `92fee769cf303c085d7d7c822a86b1ffba851e5ef96506de42b4fd909d7e14cd` | `"74fc402b965eb89cc720ae0272ac3226-ssl-df"` |
| `/mycelium/` | `a66e46e5912f270fd751d9b71b6c5eb122c0858406a20ebc6dd363016cb0fd33` | `"0399177ff62ed19a5034ac55c73f8648-ssl-df"` |

These identify sampled content, not a Git release. Asset URLs, response statuses,
cache headers, browser identity and every measurement are in
[published-performance-evidence.json](published-performance-evidence.json).

## Repeatable profile

- Linux x64 headless **Chrome/140.0.7339.16**, CDP 1.3, V8 14.0.365.1.
- 390 × 844 CSS pixels, device scale 1, mobile layout and touch enabled.
  Android 13 mobile Chrome user-agent override; this is emulation, not a phone.
- CDP CPU slowdown: **4×** relative to this shared host, not a calibrated device.
- CDP network emulation: **150 ms latency, 200,000 B/s download (1.6 Mbps),
  93,750 B/s upload (750 kbps), cellular4g**. These are browser-emulator settings,
  not an independently enforced physical-link bandwidth cap.
- Three samples per route, interleaved home → Mycelium for each iteration.
  A **new Chromium process and unique temporary profile for every sample**;
  browser cache disabled and service workers bypassed. Cookies/storage start empty.
  OS DNS and CDN caches are not flushed. CDN documents included both hits and misses.
- Each process uses its own automatically assigned CDP port and is terminated
  afterward. No other browser is attached to or stopped. No existing Chromium
  processes were detected before the run; shared host activity is not controlled.
  Per-sample host load averages are retained in the JSON.
- Observation window: navigation start through load plus **5 seconds**, no scroll
  or interaction. Actual window end is recorded per sample.
- FCP/LCP are browser-observed milliseconds after navigation start. CLS is the
  maximum session-window sum (under 1-second gaps, maximum 5 seconds), excluding
  shifts with recent input. It is not an all-session guarantee.
- Bytes sum completed `Network.loadingFinished.encodedDataLength` responses.
  They exclude incomplete/failed transfers and redirect response bodies, not an
  estimate of source asset sizes or total physical network traffic.
  `/mycelium` redirects to `/mycelium/`; its timing includes that redirect.

The first setup attempt rejected Mycelium's trailing-slash redirect. After allowing
only that same-origin route normalization, the entire six-sample run was restarted;
the table does not mix samples from the setup attempt.

## Actual results

| Route requested | Sample | FCP ms | LCP ms | CLS | Completed response bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 1 | 1,376 | 2,372 | 0.017824 | 582,006 |
| `/` | 2 | 956 | 2,876 | 0.017958 | 581,281 |
| `/` | 3 | 1,072 | 2,924 | 0.017958 | 582,294 |
| `/mycelium` | 1 | 1,256 | 1,508 | 0.133424 | 445,727 |
| `/mycelium` | 2 | 1,232 | 1,496 | 0.133424 | 445,680 |
| `/mycelium` | 3 | 1,212 | 1,496 | 0.133424 | 445,724 |

| Route | FCP median (min–max), ms | LCP median (min–max), ms | CLS median (min–max) | Bytes median (min–max) |
| --- | --- | --- | --- | --- |
| `/` | 1,072 (956–1,376) | 2,876 (2,372–2,924) | 0.017958 (0.017824–0.017958) | 582,006 (581,281–582,294) |
| `/mycelium` | 1,232 (1,212–1,256) | 1,496 (1,496–1,508) | 0.133424 (0.133424–0.133424) | 445,724 (445,680–445,727) |

All six final documents returned 200 and had complete document state and loaded
fonts at collection. No observed request failed or returned HTTP 4xx/5xx.
This does not audit console errors, graphics correctness or later interactions.
Homepage LCP spread was 552 ms; Mycelium LCP spread was 12 ms.
Three samples establish a small baseline, not a population percentile or
statistical confidence interval.

## Prioritized evidence, not assumed causes

1. **Investigate Mycelium's repeatable layout shift first.** All three windows
   measured CLS 0.133424, with a shift near 2.84–2.86 seconds. Its repeatability
   warrants targeted attribution before modifying layout or fonts. This script
   records shift timing/value, not affected DOM nodes, so it does not establish
   whether font swapping, image sizing or another behavior caused the shift.
2. **Investigate homepage text LCP and download cost.** The LCP element was the
   hero text “you can run in a SCIF.” Largest completed resources included
   `three-core.5dCn27cT.js` (~181 KB), the logo PNG (~130 KB), Archivo font
   (~90 KB), React client (~55 KB) and react-three (~53 KB).
   These are prioritization clues, not proof that any one resource delayed LCP.
   Evaluate deferment/compression only with an attributed trace and visual checks.
3. **Review Mycelium image/font payload if further loading work is authorized.**
   The logo (~130 KB), Archivo (~90 KB), and two dashboard PNGs (~82/76 KB)
   dominate completed bytes. Do not remove content or change visual behavior
   based on byte counts alone.

The old development report uses another release, cache lifecycle, observation
window and CLS summation method. Do not present differences as a measured
improvement/regression from local changes. No synthetic score, field Core Web
Vitals certification or production-readiness decision is supplied here.

## Exact post-release rerun procedure

1. After the owner separately authorizes and completes their normal external
   release, reconfirm the primary production URL using deployment guidance and
   the Netlify domain settings. Do not deploy as part of this procedure.
2. Record the successful Netlify deploy ID, linked commit and publish timestamp
   from the host's release record if accessible. Keep it alongside the new report;
   do not substitute local `git rev-parse HEAD` for deployed identity.
3. Use Node 22+ (native WebSocket) and the same Chromium version above. If the
   browser or host differs, label the comparison accordingly. Avoid running other
   browser tests concurrently. No package installation or development server is
   needed. From the repository:

   ```sh
   node --check scripts/published-performance.mjs
   PUBLISHED_PERFORMANCE_ORIGIN=https://thornveil.ai \
   PUBLISHED_PERFORMANCE_OUTPUT=docs/published-performance-post-release.json \
   node scripts/published-performance.mjs
   ```

   Set `CHROMIUM_BIN` to an existing browser executable if `chromium` is not on
   PATH. Use a new output filename for each release/run to preserve this baseline.
   The command performs public navigations; normal site analytics may receive
   those visits. It does not submit forms or change account/site settings.
4. Require a `completedAt`, no report `error`, six samples, valid final documents,
   FCP/LCP values, and inspect failed/unfinished requests. Compare per-route
   fingerprints across repetitions; if a release changes mid-run, discard that
   comparison and repeat after it stabilizes. Preserve failed runs separately.
5. Confirm the sampled content corresponds to the host release record. Report
   per-sample FCP/LCP/CLS/bytes and median/min/max using the same definitions.
   Recheck the Mycelium shift and homepage LCP specifically; do not call local
   fixes verified until measured against their confirmed published release.

## Scope and verification

Only the separately named script, raw evidence and this report were added.
Shared performance scripts/reports, app assets, dependencies and host settings
were untouched. The script completed the six real browser navigations, and a
separate unthrottled desktop screenshot confirmed the live homepage was visibly
rendered. That screenshot is a visual sanity check, not mobile performance data.