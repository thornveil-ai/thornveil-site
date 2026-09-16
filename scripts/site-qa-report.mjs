// Render the release-readiness matrix from recorded browser evidence.
import { readFile, writeFile } from 'node:fs/promises';
const evidence = JSON.parse(await readFile('docs/site-qa-evidence/matrix.json', 'utf8'));
if (evidence.rows.length !== 100) throw Error(`Incomplete matrix: ${evidence.rows.length}/100`);
const routes = [...new Set(evidence.rows.map(r => r.route))];
const profiles = [...new Set(evidence.rows.map(r => r.profile))];
const failures = row => [
  ...(row.scrollWidth > row.width ? ['horizontal document overflow'] : []),
  ...(row.clipped.length ? [`clipped headings: ${row.clipped.join('; ')}`] : []),
  ...(row.hidden.length ? [`hidden headings: ${row.hidden.join('; ')}`] : []),
  ...(row.brokenImages.length ? ['broken images'] : []),
  ...(row.h1 !== 1 || row.main !== 1 ? ['heading/landmark count'] : []),
  ...(row.profile === 'reduced-motion' && row.runningAnimations ? ['running animations with reduced motion'] : []),
];
const table = [
  `| Route | ${profiles.join(' | ')} |`,
  `| --- | ${profiles.map(() => '---').join(' | ')} |`,
  ...routes.map(route => `| ${route} | ${profiles.map(profile => {
    const row = evidence.rows.find(r => r.route === route && r.profile === profile);
    return `[${failures(row).length ? 'FAIL' : 'PASS'}](site-qa-evidence/${row.screenshot})`;
  }).join(' | ')} |`),
].join('\n');
const failList = evidence.rows.filter(r => failures(r).length).map(r => `- **${r.route}, ${r.profile}:** ${failures(r).join(' / ')}`).join('\n');
await writeFile('docs/site-qa-report.md', `# Site release-readiness QA

## Decision: NOT READY for unconditional release

The browser audit is complete for the recorded Chromium emulation coverage. This is not a claim that the site is accessible without JavaScript, that all browser engines work, or that the live host is ready. Known content-visibility failures and unavailable coverage remain below.

Recorded ${evidence.captured}, with subsequent scoped recheck timestamps in the raw rows. Baseline commit: \`${evidence.baseline}\`. The raw JSON includes the page working-tree diff, including the final co-founder reveal recheck. The baseline includes the separate page-polish work; this QA adds only narrowly scoped wrapping, target-size, contrast, and visibility corrections. Privacy text and operating facts were not edited.

## Coverage and reproducibility

- Matrix browser: ${evidence.browser.product}; supplemental performance, structure, and contrast evidence records Chromium 140.0.7339.16. All are Linux headless Chromium, **emulation only**, no physical phones/tablets; these are not Safari/Firefox results.
- Ten public pages, six CSS widths: **320, 360, 390, 430, 768, 1280**, each at 900px height.
- Every route additionally checked at **640×360 short landscape**, **640×450 zoom-reflow**, **390×844 no JavaScript / normal motion**, and **390×844 reduced motion**: 100 recorded route/profile combinations.
- Zoom-reflow is the CSS viewport equivalent of a 1280×900 desktop at 200% browser zoom, not a test of the browser's native zoom UI or text-only zoom. Matrix profiles use desktop layout emulation at these widths; the separate journeys use touch/mobile emulation.
- Full-page screenshots follow a viewport-by-viewport instant-scroll sweep without overriding site opacity. Intentional responsive display-none branches and closed disclosures are excluded from hidden-heading failures.
- Firefox and WebKit executables were unavailable; neither was run. Physical iOS Safari, Android Chrome, screen readers, native email-client handoff, PDF viewer rendering, and true browser/text-only zoom remain unverified.
- No production host is inferred from the development domain. Live metadata/404 verification remains task **#33**; privacy operations remain **#23/#24**. Graphics fallback cross-browser work stays **#22**, not reimplemented here.

### Run again

Start the existing **Start application** workflow, then in a separate shell:

\`\`\`sh
chromium --headless --no-sandbox --disable-dev-shm-usage \\
  --remote-debugging-port=9222 --user-data-dir=/tmp/site-qa-chromium about:blank
\`\`\`

In another shell, with REPLIT_DEV_DOMAIN available:

\`\`\`sh
node scripts/site-qa-matrix.mjs
node scripts/site-qa-report.mjs
node scripts/site-qa-journeys.mjs
node scripts/site-qa-structure.mjs
node scripts/site-qa-performance.mjs
node scripts/site-qa-contrast-recheck.mjs
\`\`\`

The matrix records findings rather than exiting unsuccessfully for known accessibility failures. This report renderer requires all 100 records. Stop the manually launched Chromium after the matrix; other scripts own separate browser processes/ports. SITE_QA_ORIGIN can override the matrix/performance origin. Do not run two matrix processes against the same port.

## Layout and content matrix

Each result links to its full-page screenshot. **PASS here means only**: no measured document overflow, no measured visible heading clipping, no rendered heading hidden after traversal, one H1 and main landmark, no broken images; reduced-motion rows also require zero running browser animations. It does **not** mean a complete accessibility, graphics, network, or production pass.

${table}

### Recorded failures

${failList || 'None within these limited matrix criteria.'}

No-JavaScript reveal failures belong to existing task **#15** (content must remain visible when animation/browser support is unavailable). The readable dependency-graph fallback remains **#17**. Observer lifecycle follow-up **#16** remains separate; this audit does not claim a leak test.

## Behavioral journeys, accessibility, and network

See [journey steps and screenshots](site-qa-journeys.md) and [structure, keyboard focus, and console results](site-qa-structure.md).

- Chromium menu keyboard/touch, home details → systems → Back, graph selection/clear/keyboard scrolling, and all mobile disclosure groups passed.
- Five PDF URLs returned valid PDF responses; all five Save actions completed. Open PDF generated a new-tab event. Native PDF viewer content was not visually audited.
- Email recipient/subject drafts and activation paths passed using a temporary mailto click guard. No email was sent and external mail applications were not launched.
- An arbitrary missing route returned HTTP 404 in development; Return to home worked. This is not live-host verification.
- Isolated small controls found by the first matrix were expanded: systems-card footer links and the Mycelium comparison caption link now have 44px minimum height. Inline text links are not automatically judged against the isolated-target rule.
- Contrast sampling initially found four co-founder metadata labels at 4.159:1. The scoped correction rechecked at **7.258:1** at both 1280 and 1440px. Other sampled opaque-background text passed; unresolved gradients/transparency, unvisited offscreen text, pseudo-elements, and interactive states are not a complete WCAG contrast certification.
- The development toolbar module returns **HTTP 504** across this environment's run, with associated aborted requests. This remains a development-check failure, not a clean network pass. Expected /404 responses are not broken-route regressions. Full request/exception observations are retained in the evidence and supplemental reports.

## Measured loading and layout stability

See [performance profile, results, limits, and correction recheck](site-qa-performance.md), including raw evidence.

Three browser-cold samples per route, 390×844 touch/mobile emulation, 4× CPU throttling, 150ms network latency, 1.6Mbps down / 750kbps up:

| Route | FCP range | LCP range | Load-event range | Observed CLS |
| --- | ---: | ---: | ---: | ---: |
| / | 660–868ms | 712–868ms | 6,922–7,069ms | 0 in all three windows |
| /mycelium | 596–736ms | 596–736ms | 6,154–6,918ms | 0 in all three windows |

Metrics were sampled through load + 2 seconds on the development host, with shared-host contention, before the final below-fold target-size/contrast corrections. These are actual observations, not a production score, core-web-vitals certification, or an isolated-device benchmark.

## Narrow fixes and existing checks

- Home dependency-section H2 and research H1 could overflow at 320px; added local word wrapping.
- Expanded the isolated link targets noted above.
- Increased contrast only for co-founder hero metadata labels.
- The co-founder substrate list stayed invisible at 360px when its very tall reveal wrapper could not reach the observer threshold. Stacked card content and badges on phones so text cannot shrink into a very narrow column, and made that list static, leaving the shared observer and known fallback tasks untouched; reran all ten profiles for that route. See [investigation and screenshots](site-qa-reveal-investigation.md).
- Production build passed: \`npm run build\`.
- Existing test glob: seven tests passed; the WebGL test failed to start because Playwright is not installed. This is unavailable coverage assigned to #22, not a graphics pass.
- Existing route/module smoke check reached a persistent dev-toolbar 504 and failed. Keep this visible; do not loosen or duplicate the existing smoke/dependency checks (#20/#5).

## Evidence files

- [Raw 100-row matrix](site-qa-evidence/matrix.json)
- [Journey screenshots and reproducible steps](site-qa-journeys.md)
- [Heading, landmark, focus, and console audit](site-qa-structure.md)
- [Performance samples and contrast methods](site-qa-performance.md)
- [Focused corrected contrast measurements](site-qa-evidence/contrast-recheck.json)

Remaining limitations must be resolved or explicitly accepted before a release decision. Completing this QA task records the evidence and blockers; it does not approve release.

Proposed follow-ups: **#36**, non-graphics physical-device/Firefox/native-handler checks; **#37**, production-host mobile loading measurements. These do not replace the existing fallback, privacy, or live-metadata tasks.
`);