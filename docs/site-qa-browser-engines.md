# Non-graphics browser-engine journeys

This is a separate supplement, not an update to the shared release QA report.
Application source, dependencies, existing journey tests and graphics tests
are unchanged.

## Reproduce

Start the existing **Start application** workflow, then:

```sh
node scripts/site-qa-browser-engines.mjs
```

The default origin is `https://${REPLIT_DEV_DOMAIN}`; `SITE_QA_ORIGIN` can
explicitly select another host. Record that host and build when retesting.
The runner does not infer a production URL.

Configuration:

- `JOURNEY_ENGINES=chromium,firefox,webkit` is the default requested matrix.
- Chromium uses its own CDP process, OS-assigned debugging port and unique
  temporary profile. It does not borrow the shared browser or fixed QA ports.
- `JOURNEY_CHROMIUM_BIN` (or `CHROMIUM_BIN`) selects an existing Chromium binary.
- Firefox/WebKit use an **already installed** Playwright module;
  `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs` may select it.
  `JOURNEY_FIREFOX_BIN` and `JOURNEY_WEBKIT_BIN` may select compatible binaries.
- `JOURNEY_USE_PLAYWRIGHT=1` also selects the Playwright Chromium adapter.
- Browser provisioning belongs to the existing graphics/browser-setup owner.
  This suite does not install packages, download engines or edit lockfiles.
- `JOURNEY_EVIDENCE_DIR` selects a separate output directory for a dated retest.
  The default is `docs/site-qa-evidence/browser-engines`.

Exit codes: **0** means all requested checks passed; **1** means a check or its
evidence capture failed; **2** means at least one requested engine was unavailable
and the runnable checks had no failures. Unavailable engines are never green skips.
Each journey catches its own failure so later journeys still run.

## Coverage and boundaries

The same journeys run in each available engine:

1. Main/H1 presence on ten routes, actual Home → Systems link activation and Back.
2. Menu keyboard order (Systems, Defense, Research, About, Contact), visible and
   unobscured focused controls, Escape focus return, and pointer navigation at
   390×844 and 640×360.
3. All audience/founder/shipping disclosures opened and closed with Enter; one
   pointer activation in each group.
4. Five research PDFs: status, content type, file signature, link contract and
   keyboard-triggered completed downloads with filename/signature checks.
5. Open PDF keyboard activation observed as new-window/popup/download event.
6. Federal and prime keyboard email activation, footer pointer activation,
   recipient/subject checks, and the separate co-founder route action.
7. First Tab to an onscreen, unobscured skip link and Enter moving focus to
   the existing `#main-content` target.
8. Ten routes at 640×450 without document horizontal overflow: the **layout
   equivalent** of 1280×900 at 200% zoom, not native browser zoom.

Normal motion is retained. Viewport sizes are desktop-layout emulation, not
physical phones; pointer actions are mouse actions, not claimed native touches.
Checks do not certify all text visibility, contrast, focus order throughout every
page, PDF rendering, screen-reader speech, or browser/text-only zoom.
Email links are intercepted in the test page; no mail application is opened and
no email is sent. Engine versions and timestamps are in the raw report.

## Evidence and result interpretation

Recorded **2026-09-16, 05:45:39–05:46:06 UTC** against the development origin.

| Engine / device | Observed version | Result |
| --- | --- | --- |
| Linux headless Chromium | Chrome/152.0.7977.64 | **PASS**, all 10 journeys |
| Firefox | Not available | **UNAVAILABLE** — Playwright module missing; no journey executed |
| WebKit | Not available | **UNAVAILABLE** — Playwright module missing; no journey executed |
| Physical iOS Safari | Not observed | **UNVERIFIED**, owner deferred to later retest |
| Physical Android Chrome | Not observed | **UNVERIFIED**, owner deferred to later retest |

The default three-engine command exited **2**, correctly retaining incomplete
coverage. Both new scripts passed `node --check`. No reproducible application
defect was established by the completed non-graphics journeys; this does not
clear the already-owned failures in the shared QA report.

See [machine-readable results](site-qa-evidence/browser-engines/results.json)
and [physical-device checklist](site-qa-physical-devices.md).
Every executed journey records a viewport screenshot path. A screenshot capture
error remains a failed evidence row rather than silently passing.

The initial development workflow start encountered a stale Astro server record
for a nonexistent process. `astro dev stop` cleared the stale record; the
existing workflow then started successfully. No workflow command or application
configuration was edited.

### Harness findings, not application defects

- An initial email test selected a hidden desktop duplicate at a phone width.
  Focusing it silently failed. The test now scopes to the mobile disclosure and
  verifies focus before pressing Enter. This is not a native email-handoff result
  and is not assigned as an application defect.
- Initial evidence captures occasionally timed out after PDF popup activation.
  Captures now bring the owned page to the foreground first. A future capture
  timeout still fails its row.
- One run completed its assertions but hit `ENOTEMPTY` during Chromium profile
  cleanup. Cleanup now retries transient directory races and reports any
  remaining cleanup error without discarding the journey results.
- The preview screenshot showed an `Outdated Optimize Dep` HTTP 504. Preview
  smoke reliability is already owned separately; this suite does not classify
  its successful behavioral assertions as a clean network audit.

## Physical evidence and post-merge gate

No physical phones, native mail clients or screen readers were available.
On 2026-09-16 the owner explicitly chose **“Leave device checks unverified for
a later retest”** and provided no observations. Physical-device verification
is therefore deferred by owner decision, rather than awaiting a response.
Device model, OS/browser versions,
native PDF/email, zoom and screen-reader results remain **UNVERIFIED**, not
fabricated. Use the separate checklist for return format and post-merge retest.

The separate browser-setup task was subsequently cancelled; compatible
Firefox/WebKit tooling remains unavailable, with no new setup work undertaken
in this scoped task. Retest those engines if compatible tooling is provided
later. Do not substitute Linux WebKit results for iOS Safari. Preserve the
current evidence by selecting a new output directory on post-merge runs.
This supplement does not approve unconditional release.