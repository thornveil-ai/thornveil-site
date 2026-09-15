---
name: Astro smoke-check pitfalls
description: Distinguishing genuine transform errors from Vite's own client code and initial dependency optimization.
---

HTTP smoke checks must reload the parent page on Vite's specific “Outdated Optimize Dep” 504, with a bounded retry; do not retry arbitrary transform failures.

**Why:** Initial dependency optimization changes module URLs while the first page's import graph is being traversed, just as it triggers a browser reload.

**How to apply:** Re-fetch the page and clear visited modules only for that specific response, so stale URLs are replaced rather than repeatedly requested.

Do not search every response body for the plain string `vite-error-overlay`.

**Why:** Vite's healthy client JavaScript contains that name because it implements the overlay.

**How to apply:** Detect actual overlay HTML tags in HTML responses; check JavaScript using its HTTP status, content type, and syntax.