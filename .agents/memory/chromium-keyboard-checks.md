---
name: Chromium keyboard and pointer checks
description: Headless Chromium input defaults that can invalidate interaction tests.
---

Use realistic CDP key events and explicitly configure pointer capabilities when checking desktop hover effects.

**Why:** CDP Enter without carriage-return text did not trigger native button activation. This environment's headless Chromium advertised no hover device until Blink pointer/hover settings were supplied, so correctly disabled effects looked broken.

**How to apply:** Include Enter text in keyDown and assert media-query capabilities before testing pointer effects. Wait for media-query handlers after viewport changes rather than assuming resizing completes those handlers synchronously.

Distinguish root-font enlargement from browser text-only zoom when reporting checks.

**Why:** Doubling the root font also doubles rem-based spacing and logo dimensions; it is a useful stress test, but not an exact simulation of text-only zoom.

**How to apply:** State the zoom mechanism used in verification reports and measure shell overflow separately from page-content overflow so unrelated content defects are not attributed to navigation.

Validate focus before asserting keyboard activation on responsive pages.

**Why:** A global selector can select a hidden desktop duplicate of a visible mobile link. Native `focus()` silently does nothing on that element, so the subsequent Enter timeout is a harness defect, not evidence of a broken link.

**How to apply:** Scope actions to the visible responsive region and assert `document.activeElement` is the intended control before sending keyboard events.