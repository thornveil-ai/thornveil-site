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

A passing local screenshot does not prove the Replit proxied preview is reachable.

**Why:** Browser verification found the development domain returning Vite's “host is not allowed” response while the same running app worked through the local screenshot endpoint.

**How to apply:** Check the development-domain response separately when verifying preview access; distinguish a host-allowlist rejection from page-script failures.

Astro's current development transform can reject TypeScript annotations in a
processed `.astro` script even when the production build succeeds.

**Why:** The development Vite/Oxc transform was observed parsing an annotated
script variable as JavaScript and rejecting a non-null assertion despite a passing
production build; the equivalent plain JavaScript worked.

**How to apply:** Keep `.astro` script wiring as plain JavaScript and put typed
logic in imported `.ts` files. Check the running development route as well as
the production build after changing page scripts.

When isolated verification needs a second Astro server, check the installed CLI's supported lock-bypass behavior; never use a replacement flag.

**Why:** Development tools may enforce a project-wide single-server lock, independent of port availability. Astro's `--force` can replace the user's preview, whereas its supported foreground `--ignore-lock` mode leaves that server's lock untouched.

**How to apply:** Use the existing server URL when isolation is unnecessary. For isolated checks, confirm foreground mode and lock-bypass support in the installed version, own and clean up only the child process, and verify the normal preview survives.
