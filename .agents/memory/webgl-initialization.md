---
name: WebGL initialization failures
description: Why the hero owns asynchronous renderer setup instead of relying on a Canvas error boundary.
---

Catch renderer construction and asynchronous R3F root configuration explicitly, in addition to scene render errors.

**Why:** R3F's Canvas starts an asynchronous configuration function without handling its rejection. A React error boundary around Canvas cannot catch that rejection when WebGL creation fails.

**How to apply:** Preserve explicit async error handling when changing the graphics wrapper or upgrading R3F. Keep the static illustration server-rendered underneath it so failures do not depend on successful React initialization to produce a useful hero.