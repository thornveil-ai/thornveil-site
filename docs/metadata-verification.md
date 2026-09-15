# Search metadata and recovery verification

Checked September 15, 2026. No deployment was performed.

## Scope and results

`npm run build` passes. `node scripts/check-metadata.mjs` checks the built
files; supplying a built-site preview URL also checks HTTP status and MIME types.
The HTTP run passed against Astro preview on port 5058.

- Content routes: `/`, `/about/`, `/cofounder/`, `/contact/`, `/defense/`,
  `/mycelium/`, `/privacy/`, `/research/`, `/systems/`: HTTP 200 HTML.
  Each has a unique title and description, matching Open Graph/Twitter copy,
  a canonical matching its sitemap URL, and an absolute social image URL.
- Canonical origin remains `https://thornveil.ai`. No development hostnames
  appear in the built head metadata. Queries are excluded from canonicals;
  directory routes normalize to trailing slashes.
- `/og-image.jpg`: HTTP 200 JPEG, 1200×630. Visually inspected. Reuses the
  existing brand artwork without the obsolete printed `.com` domain.
- `/favicon.png` (512), `/favicon-32.png` (32), `/favicon-192.png` (192),
  `/apple-touch-icon.png` (180): HTTP 200 PNG; actual square dimensions match
  declarations. Removed invalid PNG mask-icon and unverified maskable claim.
- `/site.webmanifest`: HTTP 200 manifest JSON; both referenced icons exist.
- `/papers/paper1-safety.pdf`, `/papers/paper2-training.pdf`,
  `/papers/paper3-turboquant.pdf`, `/papers/paper4-cascade.pdf`,
  `/papers/paper5-system.pdf`: HTTP 200 PDF with PDF file signatures.
- `/sitemap-index.xml` and `/sitemap-0.xml`: HTTP 200 XML. Build-generated;
  exactly the nine canonical content URLs, excluding 404 and legacy redirects.
- `/robots.txt`: HTTP 200 plain text. Crawler policy is unchanged.
- `/products/`, `/docs/`, `/technology/`: HTTP 200 HTML refresh redirects to
  `/systems`; `/dronebane/`: HTTP 200 HTML refresh to `/defense`.
  Generated pages contain target canonicals, noindex, and fallback links.
  These are Astro static redirects, **not verified HTTP 301/308 redirects**.
  Target pages return HTTP 200.
- `/metadata-check-missing-page`: HTTP 404 HTML in both Astro build preview
  and the Replit proxied development preview. Recovery content has a clear
  heading and ordinary home/contact links, with no animation visibility
  dependency. Both destinations were checked above. Desktop screenshot
  confirms visible recovery content.

## External limitations

Official Replit deployment discovery returned success with `isDeployed: false`
and no production URL. Therefore no live production requests were made, and
the configured domain is not evidence of current deployment ownership/routing.
Published unknown-route status, host redirects, canonical-host enforcement,
TLS, and live asset MIME headers remain unverified until a deployment exists.
Search-engine indexing and social-network cache/preview behavior are external
services and are not proven by correct local metadata.

The development screenshot initially encountered Vite's transient “Outdated
Optimize Dep” responses during dependency preparation; the server reloaded.
This is separate from the passing build-output checks.
Build warnings about Browserslist freshness and large JS chunks are unrelated
to this metadata scope. Shared browser scripts, crawler policy, existing
smoke/CI tooling, and site claims were not changed.