---
name: Chromium keyboard and pointer checks
description: Headless Chromium input defaults that can invalidate interaction tests.
---

Use realistic CDP key events and explicitly configure pointer capabilities when checking desktop hover effects.

**Why:** CDP Enter without carriage-return text did not trigger native button activation. This environment's headless Chromium advertised no hover device until Blink pointer/hover settings were supplied, so correctly disabled effects looked broken.

**How to apply:** Include Enter text in keyDown and assert media-query capabilities before testing pointer effects. Wait for media-query handlers after viewport changes rather than assuming resizing completes those handlers synchronously.