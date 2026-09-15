---
name: Astro static metadata verification
description: Distinguish Astro route identities and generated files from hosting behavior.
---

Verify error metadata from generated HTML rather than assuming its route
pathname equals the output filename.

**Why:** Astro supplied `/404/` during generation while writing `404.html`;
normalizing only `/404` missed that case. Static redirect files also do not
establish server-side redirect status on a future hosting provider.

**How to apply:** Inspect build output for canonical/sitemap assertions and
test HTTP status separately against the actual serving environment. Never
report local Astro preview as proof of live-host behavior.