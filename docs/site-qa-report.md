# Site release-readiness QA

## Decision: NOT READY for unconditional release

The browser audit is complete for the recorded Chromium emulation coverage. This is not a claim that the site is accessible without JavaScript, that all browser engines work, or that the live host is ready. Known content-visibility failures and unavailable coverage remain below.

Recorded 2026-09-16T00:23:13.308Z, with subsequent scoped recheck timestamps in the raw rows. Baseline commit: `4d851255332733170d3e52a76d96cde654113f27`. The raw JSON includes the page working-tree diff, including the final co-founder reveal recheck. The baseline includes the separate page-polish work; this QA adds only narrowly scoped wrapping, target-size, contrast, and visibility corrections. Privacy text and operating facts were not edited.

## Coverage and reproducibility

- Matrix browser: Chrome/152.0.7977.64; supplemental performance, structure, and contrast evidence records Chromium 140.0.7339.16. All are Linux headless Chromium, **emulation only**, no physical phones/tablets; these are not Safari/Firefox results.
- Ten public pages, six CSS widths: **320, 360, 390, 430, 768, 1280**, each at 900px height.
- Every route additionally checked at **640×360 short landscape**, **640×450 zoom-reflow**, **390×844 no JavaScript / normal motion**, and **390×844 reduced motion**: 100 recorded route/profile combinations.
- Zoom-reflow is the CSS viewport equivalent of a 1280×900 desktop at 200% browser zoom, not a test of the browser's native zoom UI or text-only zoom. Matrix profiles use desktop layout emulation at these widths; the separate journeys use touch/mobile emulation.
- Full-page screenshots follow a viewport-by-viewport instant-scroll sweep without overriding site opacity. Intentional responsive display-none branches and closed disclosures are excluded from hidden-heading failures.
- Firefox and WebKit executables were unavailable; neither was run. Physical iOS Safari, Android Chrome, screen readers, native email-client handoff, PDF viewer rendering, and true browser/text-only zoom remain unverified.
- No production host is inferred from the development domain. Live metadata/404 verification remains task **#33**; privacy operations remain **#23/#24**. Graphics fallback cross-browser work stays **#22**, not reimplemented here.

### Run again

Start the existing **Start application** workflow, then in a separate shell:

```sh
chromium --headless --no-sandbox --disable-dev-shm-usage \
  --remote-debugging-port=9222 --user-data-dir=/tmp/site-qa-chromium about:blank
```

In another shell, with REPLIT_DEV_DOMAIN available:

```sh
node scripts/site-qa-matrix.mjs
node scripts/site-qa-report.mjs
node scripts/site-qa-journeys.mjs
node scripts/site-qa-structure.mjs
node scripts/site-qa-performance.mjs
node scripts/site-qa-contrast-recheck.mjs
```

The matrix records findings rather than exiting unsuccessfully for known accessibility failures. This report renderer requires all 100 records. Stop the manually launched Chromium after the matrix; other scripts own separate browser processes/ports. SITE_QA_ORIGIN can override the matrix/performance origin. Do not run two matrix processes against the same port.

## Layout and content matrix

### Shared reveal correction recheck

The historical matrix and failure list below are preserved as baseline evidence.
The shared reveal correction was subsequently checked at 390×844 and 1280×900
on all ten routes: normal scrolling, JavaScript disabled, reduced motion,
IntersectionObserver absent, and observer construction throwing all retained
readable rendered headings. See the [scoped reveal verification](reveal-visibility-check.md)
and its raw evidence for additional module-blocking and lifecycle checks and
coverage limitations. This correction does not establish graph fallback,
cross-browser, physical-device, or production-host readiness.

Each result links to its full-page screenshot. **PASS here means only**: no measured document overflow, no measured visible heading clipping, no rendered heading hidden after traversal, one H1 and main landmark, no broken images; reduced-motion rows also require zero running browser animations. It does **not** mean a complete accessibility, graphics, network, or production pass.

| Route | 320 | 360 | 390 | 430 | 768 | 1280 | landscape | zoom-reflow | no-js | reduced-motion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| / | [PASS](site-qa-evidence/320-home.jpg) | [PASS](site-qa-evidence/360-home.jpg) | [PASS](site-qa-evidence/390-home.jpg) | [PASS](site-qa-evidence/430-home.jpg) | [PASS](site-qa-evidence/768-home.jpg) | [PASS](site-qa-evidence/1280-home.jpg) | [PASS](site-qa-evidence/landscape-home.jpg) | [PASS](site-qa-evidence/zoom-reflow-home.jpg) | [FAIL](site-qa-evidence/no-js-home.jpg) | [PASS](site-qa-evidence/reduced-motion-home.jpg) |
| /systems | [PASS](site-qa-evidence/320-systems.jpg) | [PASS](site-qa-evidence/360-systems.jpg) | [PASS](site-qa-evidence/390-systems.jpg) | [PASS](site-qa-evidence/430-systems.jpg) | [PASS](site-qa-evidence/768-systems.jpg) | [PASS](site-qa-evidence/1280-systems.jpg) | [PASS](site-qa-evidence/landscape-systems.jpg) | [PASS](site-qa-evidence/zoom-reflow-systems.jpg) | [FAIL](site-qa-evidence/no-js-systems.jpg) | [PASS](site-qa-evidence/reduced-motion-systems.jpg) |
| /defense | [PASS](site-qa-evidence/320-defense.jpg) | [PASS](site-qa-evidence/360-defense.jpg) | [PASS](site-qa-evidence/390-defense.jpg) | [PASS](site-qa-evidence/430-defense.jpg) | [PASS](site-qa-evidence/768-defense.jpg) | [PASS](site-qa-evidence/1280-defense.jpg) | [PASS](site-qa-evidence/landscape-defense.jpg) | [PASS](site-qa-evidence/zoom-reflow-defense.jpg) | [FAIL](site-qa-evidence/no-js-defense.jpg) | [PASS](site-qa-evidence/reduced-motion-defense.jpg) |
| /mycelium | [PASS](site-qa-evidence/320-mycelium.jpg) | [PASS](site-qa-evidence/360-mycelium.jpg) | [PASS](site-qa-evidence/390-mycelium.jpg) | [PASS](site-qa-evidence/430-mycelium.jpg) | [PASS](site-qa-evidence/768-mycelium.jpg) | [PASS](site-qa-evidence/1280-mycelium.jpg) | [PASS](site-qa-evidence/landscape-mycelium.jpg) | [PASS](site-qa-evidence/zoom-reflow-mycelium.jpg) | [FAIL](site-qa-evidence/no-js-mycelium.jpg) | [PASS](site-qa-evidence/reduced-motion-mycelium.jpg) |
| /research | [PASS](site-qa-evidence/320-research.jpg) | [PASS](site-qa-evidence/360-research.jpg) | [PASS](site-qa-evidence/390-research.jpg) | [PASS](site-qa-evidence/430-research.jpg) | [PASS](site-qa-evidence/768-research.jpg) | [PASS](site-qa-evidence/1280-research.jpg) | [PASS](site-qa-evidence/landscape-research.jpg) | [PASS](site-qa-evidence/zoom-reflow-research.jpg) | [FAIL](site-qa-evidence/no-js-research.jpg) | [PASS](site-qa-evidence/reduced-motion-research.jpg) |
| /about | [PASS](site-qa-evidence/320-about.jpg) | [PASS](site-qa-evidence/360-about.jpg) | [PASS](site-qa-evidence/390-about.jpg) | [PASS](site-qa-evidence/430-about.jpg) | [PASS](site-qa-evidence/768-about.jpg) | [PASS](site-qa-evidence/1280-about.jpg) | [PASS](site-qa-evidence/landscape-about.jpg) | [PASS](site-qa-evidence/zoom-reflow-about.jpg) | [PASS](site-qa-evidence/no-js-about.jpg) | [PASS](site-qa-evidence/reduced-motion-about.jpg) |
| /cofounder | [PASS](site-qa-evidence/320-cofounder.jpg) | [PASS](site-qa-evidence/360-cofounder.jpg) | [PASS](site-qa-evidence/390-cofounder.jpg) | [PASS](site-qa-evidence/430-cofounder.jpg) | [PASS](site-qa-evidence/768-cofounder.jpg) | [PASS](site-qa-evidence/1280-cofounder.jpg) | [PASS](site-qa-evidence/landscape-cofounder.jpg) | [PASS](site-qa-evidence/zoom-reflow-cofounder.jpg) | [PASS](site-qa-evidence/no-js-cofounder.jpg) | [PASS](site-qa-evidence/reduced-motion-cofounder.jpg) |
| /contact | [PASS](site-qa-evidence/320-contact.jpg) | [PASS](site-qa-evidence/360-contact.jpg) | [PASS](site-qa-evidence/390-contact.jpg) | [PASS](site-qa-evidence/430-contact.jpg) | [PASS](site-qa-evidence/768-contact.jpg) | [PASS](site-qa-evidence/1280-contact.jpg) | [PASS](site-qa-evidence/landscape-contact.jpg) | [PASS](site-qa-evidence/zoom-reflow-contact.jpg) | [PASS](site-qa-evidence/no-js-contact.jpg) | [PASS](site-qa-evidence/reduced-motion-contact.jpg) |
| /privacy | [PASS](site-qa-evidence/320-privacy.jpg) | [PASS](site-qa-evidence/360-privacy.jpg) | [PASS](site-qa-evidence/390-privacy.jpg) | [PASS](site-qa-evidence/430-privacy.jpg) | [PASS](site-qa-evidence/768-privacy.jpg) | [PASS](site-qa-evidence/1280-privacy.jpg) | [PASS](site-qa-evidence/landscape-privacy.jpg) | [PASS](site-qa-evidence/zoom-reflow-privacy.jpg) | [FAIL](site-qa-evidence/no-js-privacy.jpg) | [PASS](site-qa-evidence/reduced-motion-privacy.jpg) |
| /404 | [PASS](site-qa-evidence/320-404.jpg) | [PASS](site-qa-evidence/360-404.jpg) | [PASS](site-qa-evidence/390-404.jpg) | [PASS](site-qa-evidence/430-404.jpg) | [PASS](site-qa-evidence/768-404.jpg) | [PASS](site-qa-evidence/1280-404.jpg) | [PASS](site-qa-evidence/landscape-404.jpg) | [PASS](site-qa-evidence/zoom-reflow-404.jpg) | [PASS](site-qa-evidence/no-js-404.jpg) | [PASS](site-qa-evidence/reduced-motion-404.jpg) |

### Recorded failures

- **/, no-js:** hidden headings: Pick your track.; Start with these four systems.; RigRun; Pyros; Mycelium; Auspex; Dependencies across the ten systems; Shipping log.; A patient build, in the open.; Want to review, or co-found?
- **/systems, no-js:** hidden headings: Ten engineering systems. One sovereign AI stack.; Signet; Alchemist; Pyros; Mycelium; RigRun; HawkStack; Meridian; Canopy; Auspex; Navigator; Built solo while on active duty; Review the work. Reach out.
- **/defense, no-js:** hidden headings: Cleared for the next federal procurement window.; Mycelium; Auspex; RigRun; HawkStack; Meridian; Canopy; Signet; What's available, and when.; Federal program offices, primes, evaluators.
- **/mycelium, no-js:** hidden headings: AI that keeps thinkingwhen half the team goes dark.; Three things you can verify.; Survives worker loss.; OpenAI-compatible chat endpoint.; Tamper-evident audit chain.; How zero-vector substitution works; Same screen. Three seconds apart.; R2I-compliant by design.; Hardware detection assigns a tier.; Operator UX on any laptop. No GPU.; Implementation status and pending validation; v1.0.0 tagged; Operator UI + ops dashboard; Substitute-on-failure dispatch; NIST 800-53 controls mapping; Physical ruggedized-tablet validation; NIST FIPS 140-3 certification; Build the AI tier of your stack on Mycelium.
- **/research, no-js:** hidden headings: Evidence, not adjectives.; Technical reports; Selective-Buffer Streaming Safety for AI Coding Agents; Zeroth-Order Preference Optimization on 100B+ Quantized MoE Models via Live Inference API; Compressed KV Cache Attention as a Plugin Backend; Speculative Decoding Fails on Sparse MoE: A Negative Result and Practical Multi-Model Cascade; RigRun: Complete Local AI Infrastructure on a Single GPU; What's actually defensible.; Substitute-on-failure MoE expert dispatch; Scope-as-code engagement compilation + 13-check Signet gate; Compile-time classification-gated routing with cross-domain guard; 8-signal confidence pipeline with adversarial self-audit; HMAC-chained tamper-evident audit ledger with RFC 3161 anchoring; Compute-aware neural topology recipe (3-parameter); 24-layer adaptive control loop (PID + Holt + UCB1 + ε-greedy); Phase 10 trade-secret primitives — attest, secdef, beacon, vehicle-id, log; 14-step agent-production pipeline with Opus calibration + 5-probe adversarial hardening
- **/privacy, no-js:** hidden headings: Privacy Policy; Summary; Analytics; Hosting and fonts; Cookies and browser storage; Email contact and retention; Details awaiting owner confirmation; Contact

These historical no-JavaScript reveal failures were corrected by the shared
visible-default implementation; see the recheck above. The readable
dependency-graph fallback remains separately scoped to **#17**. Shared observer
lifecycle cleanup is included in **#15**; repeatable regression tests remain
separately owned by **#16**.

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
- Production build passed: `npm run build`.
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
