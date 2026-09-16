# Site browser QA journeys

Checked **September 16, 2026 (00:17 UTC)** against the Replit development
origin. No workflow was started or restarted by this check, and no application
source or existing test was changed.

## Reproduce

The site must already be available at the development origin. The journey
script starts and owns its own headless Chromium process; it does **not** use
the shared browser on port 9222.

```sh
export REPLIT_DEV_DOMAIN=12314fdd-e2ee-47bf-a166-866792b8671c-00-1vsg61hrl2ay4-2d4n7szp.reed.replit.dev
node scripts/site-qa-journeys.mjs
```

The script uses:

- origin `https://${REPLIT_DEV_DOMAIN}`
- Chromium CDP port `9223`
- Chromium profile `/tmp/qa-journeys`
- evidence directory `docs/site-qa-evidence/journeys`

It removes its profile after Chromium exits so a repeat run starts clean. The
script prints a JSON summary containing the origin, port, profile,
browser-executable availability, journey statuses, and screenshot paths.

## Browser availability

The executable check was run in the same shell environment as the journey:

```text
chromium              /repl/tools/bin/chromium
firefox               unavailable
firefox-esr           unavailable
webkit2png            unavailable
MiniBrowser           unavailable
WebKitTestRunner      unavailable
playwright            unavailable
```

Only Chromium was run. Firefox and WebKit results are therefore **not
claimed**; they are unavailable in this environment. The existing WebGL
fallback/browser task is separate and was not duplicated here.

## Results

All six journeys passed in the completed run.

| Journey | Actual result | Viewport |
| --- | --- | --- |
| Mobile menu keyboard and touch | Keyboard opened the menu, `Tab` reached Systems, `Escape` restored focus to the toggle; touch opened and closed the menu. | 390 × 844 |
| Home details, destination, and browser back | Opened a home audience disclosure, navigated to `/systems`, then `history.back()` returned to `/`; the homepage heading and graph were present. The disclosure reset closed after the new page render (`detailsAfterBack: false`). | 390 × 844 |
| Graph controls | Found all 10 controls. Keyboard selected Signet and `Escape` cleared it; touch selected Navigator and Clear selection cleared it; `ArrowRight` moved the horizontal graph scroll region. | 390 × 844 |
| Mobile disclosures | Keyboard opened and closed all three audience, one founder, and five shipping disclosures. Touch opened one disclosure in each group. | 390 × 844 |
| PDFs and email actions | All five research PDF URLs returned HTTP 200 with `application/pdf` and `%PDF-` signatures. Keyboard opened the first PDF in a new-tab CDP event; all five Save PDF actions completed downloads. Federal and prime email links produced `mailto:` drafts for touch/click actions; the co-founder action reached `/cofounder`. | 1280 × 900 and 390 × 844 |
| 404 recovery | `/qa-journeys-missing-page` returned HTTP 404, rendered “Page not found”, and its Return to home action reached `/`. | 1280 × 900 |

Email actions were not sent. The QA page installed a temporary click guard
only for `mailto:` links so the browser could exercise the touch/click path
without launching an external mail client; the generated recipient and
subjects were asserted before the page was discarded.

## Evidence

Screenshots are stored alongside this record. PNG dimensions are shown to make
the viewport evidence reproducible:

- [Mobile menu — keyboard and touch, 390 × 844](site-qa-evidence/journeys/menu-mobile-keyboard-touch.png)
- [Home details and browser back, 390 × 844](site-qa-evidence/journeys/home-details-back-mobile.png)
- [Graph controls, 390 × 844](site-qa-evidence/journeys/graph-controls-mobile.png)
- [Mobile disclosures, 390 × 844](site-qa-evidence/journeys/disclosures-mobile.png)
- [Research PDF actions, 1280 × 900](site-qa-evidence/journeys/research-pdfs.png)
- [Email actions, 1280 × 900](site-qa-evidence/journeys/email-actions.png)
- [404 page and recovery links, 1280 × 900](site-qa-evidence/journeys/404-recovery.png)
- [404 Return to home result, 1280 × 900](site-qa-evidence/journeys/404-recovery-home.png)
