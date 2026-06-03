# SWAPS — where each external item plugs in

> Companion to `THORNVEIL_TODO.md`. Once you have each external item ready
> (Cal.com URL, UEI, release tags, etc.), open this file, find the matching
> section, and follow the edit instructions. Each section lists the **exact**
> file + line + before/after string.

---

## SWAP 1 — Cal.com booking URLs

**Have:** Two Cal.com event-type URLs (federal-eval + prime-walkthrough).

**File:** `src/components/AudienceIntake.astro`

**Find this function:**
```js
function mailtoHref(t) {
  if (t.href) return t.href;
  const body = encodeURIComponent(`Hi Jesse,\n\n${t.template}\n\n— [name]`);
  return `mailto:jesse@thornveil.ai?subject=${encodeURIComponent(t.subject)}&body=${body}`;
}
```

**Replace with:**
```js
function mailtoHref(t) {
  if (t.href) return t.href;
  // Map each track to its calendar URL. Falls back to mailto if no URL set.
  const calMap = {
    federal: 'https://cal.com/thornveil/federal-eval',
    prime:   'https://cal.com/thornveil/prime-walkthrough',
  };
  if (calMap[t.id]) return calMap[t.id];
  const body = encodeURIComponent(`Hi Jesse,\n\n${t.template}\n\n— [name]`);
  return `mailto:jesse@thornveil.ai?subject=${encodeURIComponent(t.subject)}&body=${body}`;
}
```

Replace the two URLs with your actual ones. Save → dev server picks it up.

---

## SWAP 2 — SAM.gov UEI

**Have:** Your UEI (looks like `ABC123DEF456`).

**File:** `src/pages/defense.astro`

**Find:**
```ts
{ label: 'Federal registration',   value: 'CAGE / UEI / SAM.gov pursued Q4 2026' },
```

**Replace with:**
```ts
{ label: 'Federal registration',   value: 'UEI ABC123DEF456 · CAGE pursued Q3 2026 · SAM.gov registration Q4 2026' },
```

Also consider adding to `/contact` company-details card. File:
`src/pages/contact.astro` — add row after `NAICS`:
```astro
<div>
  <dt class="font-mono text-step--1 tracking-[0.12em] uppercase text-text-3">UEI</dt>
  <dd class="font-mono tabular">ABC123DEF456</dd>
</div>
```

---

## SWAP 3 — GitHub release URLs

**Have:** Three release URLs after tagging on the repos.

**File:** `src/data/shipping-log.json`

**Find each entry's `"href"` field** (currently the repo home) and replace with the `/releases/tag/vX.Y.Z` URL.

Example:
```json
{
  "date": "2026-05-14",
  "system": "Mycelium",
  "version": "v1.0.0",
  "headline": "Substitute-on-failure dispatch tagged + cosign-signed across Linux/Windows/macOS.",
  "href": "https://github.com/thornveil-ai/mycelium-overview/releases/tag/v1.0.0"
}
```

Three entries need updating: Mycelium v1.0.0, Auspex v0.5.3 + v0.4.29, Signet v0.1.10.1.

---

## SWAP 4 — Apache-2.0 LICENSE confirmation (no code change)

**Have:** Confirmed `LICENSE` files exist on `thornveil-ai/signet` and `thornveil-ai/alchemist`.

**No code change needed.** Just verify by visiting:
- `https://github.com/thornveil-ai/signet/blob/main/LICENSE`
- `https://github.com/thornveil-ai/alchemist/blob/main/LICENSE`

If either is missing, the "Apache-2.0 OSS" claims on the site are unsupported. Add the LICENSE file via GitHub's "Add file → Choose a license template" flow.

---

## SWAP 5 — Founder photo

**Have:** Hi-res photo of Jesse, saved as `public/founder.jpg` (or `.png`).

**File:** `src/components/FounderCard.astro`

**Find the sigil block:**
```astro
<div class="founder-sigil" aria-hidden="true">
  <div class="founder-sigil-chevron">...</div>
  <div class="founder-monogram-wrap">...</div>
  <div class="founder-sigil-meta">...</div>
</div>
```

**Option A — full replacement (photo only):**
```astro
<div class="founder-sigil founder-sigil--photo" aria-hidden="true">
  <img src="/founder.jpg" alt="" class="founder-photo" />
  <div class="founder-sigil-meta">
    <div class="founder-sigil-line">
      <span class="founder-sigil-tag">RANK</span>
      <span>STAFF SGT · USMC</span>
    </div>
    <!-- keep the rest of the meta rows -->
  </div>
</div>
```

Then add to the CSS:
```css
.founder-photo {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  filter: grayscale(20%);
}
```

**Option B — keep the chevron + frame, just swap monogram for photo:**
Replace just the `.founder-monogram-wrap` contents with the `<img>`.

---

## SWAP 6 — Federal evaluator quote

**Have:** A signed-off quote, even anonymized.

**Create new component:** `src/components/EvaluatorQuote.astro`

```astro
---
const quote = {
  text: 'The replay package is the first time I\'ve seen an autonomous AI red team that I could re-run from a sealed log.',
  attribution: 'USCYBERCOM red-team lead',  // or specific name + rank
  context: 'after reviewing the Auspex v0.5.3 replay package',
};
---

<section class="tv-section pt-0" style="background: var(--bg-raised); border-top: 1px solid var(--line);">
  <div class="tv-container max-w-3xl">
    <blockquote class="evaluator-quote reveal">
      <p class="text-step-2 text-text leading-snug" style="font-variation-settings: 'wdth' 110;">
        "{quote.text}"
      </p>
      <footer class="font-mono text-step--1 tracking-[0.18em] uppercase text-text-3 mt-s-5">
        — {quote.attribution}<br/>
        <span class="text-text-3">{quote.context}</span>
      </footer>
    </blockquote>
  </div>
</section>
```

**Mount on homepage:** `src/pages/index.astro`. Insert immediately after the hero `</section>` and BEFORE `<AudienceIntake />`:

```astro
<EvaluatorQuote />
```

Don't forget the import:
```astro
import EvaluatorQuote from '../components/EvaluatorQuote.astro';
```

---

## SWAP 7 — DD-214 date hedge

**If the December 10, 2026 date is firm:** no change.

**If it might slip:** change two values in `src/data/metrics.json`:
```json
"directContractsOpen": "Q4 2026",
"directContractsOpenISO": "2026-12-31"
```

The momentum bar countdown will auto-update from the ISO date.

---

## SWAP 8 — Custom og:image

**Have:** 1200×630 image saved as `public/og-image.jpg` (overwriting the brand-pack default).

**No code change needed** — `BaseLayout.astro` already references `/og-image.jpg`.

---

## SWAP 9 — Press / public mention

**Have:** A specific URL to feature (podcast, blog post, conference talk).

**File:** `src/components/Footer.astro` — add a new row above the telemetry footer:

```astro
<div class="font-mono text-step--1 tracking-[0.12em] uppercase text-text-3 mb-s-3">
  Featured: <a href="URL" target="_blank" rel="noopener" class="text-signal-text">[Publication name]</a> · [date]
</div>
```

---

## SWAP 10 — Plausible custom events (no code change)

**Have:** Created the goals in plausible.io.

**No code change needed.** The site code already emits these events. Just confirm in Plausible Realtime → Goals after clicking one of the audience-intake cards on `thornveil.ai`.

---

## Quick-reference: external item → file map

| Item | File |
|---|---|
| Cal.com URLs | `src/components/AudienceIntake.astro` |
| UEI | `src/pages/defense.astro` + optional `/contact` |
| GitHub release tags | `src/data/shipping-log.json` |
| LICENSE files | (GitHub repos — no site change) |
| Founder photo | `src/components/FounderCard.astro` + `public/founder.jpg` |
| Evaluator quote | new `src/components/EvaluatorQuote.astro` + `index.astro` |
| DD-214 hedge | `src/data/metrics.json` |
| og:image | `public/og-image.jpg` |
| Press mention | `src/components/Footer.astro` |
| Plausible goals | (Plausible dashboard — no site change) |

---

*After any swap: run `npm run dev` to verify locally, then `npm run build` before deploying.*
