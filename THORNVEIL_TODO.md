# Thornveil site — external-input checklist

> Items the site is waiting on from outside the codebase. Each item lists
> **what's needed**, **why it matters**, and **where it plugs in** (file path
> or section). Sorted by impact.

---

## P0 — biggest conversion lift

### 1. Calendar booking URL (Cal.com or Calendly)
- **What:** One or three 30-min meeting types. Suggested: `Federal evaluation call`, `Prime walkthrough`, optionally `Press inquiry`.
- **Why:** Right now every `Schedule a federal eval call` button is `mailto:` with a structured-body template. A calendar URL converts ~3–5× higher than mailto for a federal-evaluator audience that already lives in Outlook.
- **Plug in:** `src/components/AudienceIntake.astro` — the `mailtoHref(t)` function. Replace return value with `https://cal.com/jeranaias/federal-eval` (or whatever URL).
- **Cost:** Free on Cal.com personal plan or Calendly free tier.
- **Time:** 15 minutes.

### 2. Founder photo
- **What:** Hi-res photo of Jesse. Color or B&W. In or out of uniform (uniform is stronger but per DoD instructions on commercial use, double-check before publishing).
- **Why:** Cursor leads with founder/operator photos (Karpathy, Huang, Collison). The `JM` monogram patch we have is a stand-in. A real face is 10× the conversion signal.
- **Plug in:** `src/components/FounderCard.astro` — replace the `<div class="founder-sigil">` block with an `<img src="/founder.jpg">`. Recommend ~1200×1500 minimum, saved as `public/founder.jpg`.
- **Time:** 30 minutes once you have the photo.

### 3. One named or anonymized federal evaluator / operator quote
- **What:** Even *one* sentence from a real federal evaluator who's looked at the work. Best if attributable (rank + branch + role). Acceptable if anonymized ("a USCYBERCOM evaluator," "a SOCOM PM").
- **Why:** Conversion ceiling without it. The research summary said it explicitly: Cursor's homepage wins on Jensen Huang's quote, not on its WebGL. Even an anonymized federal-AI evaluator's quote breaks the "solo guy talking about himself" frame.
- **Plug in:** New section between the hero and audience intake on the homepage. I can stub the component once you have the quote — `src/components/EvaluatorQuote.astro`.
- **Risk:** None if anonymized + signed off by the source.

---

## P1 — credibility multipliers

### 4. Real GitHub release tags
- **What:** Tag `v1.0.0` on `thornveil-ai/mycelium-overview`. Tag `v0.5.3` on `auspex-contact`. Tag `v0.1.10.1` on `signet`. (May already be done — verify in each repo.)
- **Why:** The shipping log now links to each repo with a `verify ↗` button. If the linked page is `/releases/tag/v1.0.0` with a real release notes section, evaluator confidence jumps. If it's just the repo home, weaker.
- **Plug in:** `src/data/shipping-log.json` — change `href` from `github.com/thornveil-ai/foo` to `github.com/thornveil-ai/foo/releases/tag/vX.Y.Z`.
- **Time:** 15 minutes per tag if not already in place.

### 5. Verify Apache-2.0 LICENSE files exist
- **What:** `signet` repo and `alchemist` repo must have an `Apache-2.0` LICENSE file at root. We claim Apache-2.0 OSS for both.
- **Why:** First thing a sophisticated evaluator checks. If the file is missing, the OSS claim is unsupported.
- **Plug in:** GitHub. `LICENSE` file at the repo root.
- **Time:** 5 minutes per repo. Use GitHub's "Add license" flow.

### 6. UEI from SAM.gov
- **What:** Get the Unique Entity Identifier (UEI) for Thornveil LLC. It's free, takes 2–10 business days.
- **Why:** Site currently says `CAGE / UEI / SAM.gov pursued Q4 2026`. If you have a UEI sooner, you can publish it on `/defense` immediately and it removes a "this company isn't real yet" smell for federal procurement officers.
- **Plug in:** `src/pages/defense.astro` — `posture` array. Replace `Federal registration: CAGE / UEI / SAM.gov pursued Q4 2026` with `Federal registration: UEI <number> · CAGE pursued Q3 2026`.
- **Time:** ~30 minutes to file at sam.gov, then 2–10 days waiting.

### 7. Plausible custom-event goals
- **What:** Log into plausible.io for the `thornveil.ai` site. Goals → New custom event goal. Create:
  - `Federal Eval Call`
  - `Prime Walkthrough`
  - `Cofounder Open`
  - `Mycelium Deep Dive`
  - `Browse GitHub`
- **Why:** The site code already emits these events (added in the Plausible event-tracking polish). When you create the goals in Plausible, the conversion tracking lights up. Lets you see which audience track converts.
- **Plug in:** plausible.io dashboard. No code change.
- **Time:** 10 minutes.

---

## P2 — polish

### 8. Customer-style logos OR a "trusted by" anonymized strip
- **What:** Even three placeholder grey-logo silhouettes labeled "federal program office," "defense prime," "AI red-team operator" would beat zero. If/when you sign anything (even an MOU or letter of intent), add it.
- **Plug in:** New optional component `src/components/TrustStrip.astro`. Stub it when you're ready.

### 9. One short product video (10–30 seconds)
- **What:** Screen recording of the Mycelium ops dashboard during a swap event. OR a recording of the Auspex audit chain growing during an engagement.
- **Why:** Currently the only motion on the site is the WebGL mesh. Cursor / Modal both have real-product video loops. A real-product loop is more credible than a synthesized animation.
- **Plug in:** `public/demo-mycelium.mp4` (under 1MB ideally). Mount in `/mycelium` page replacing the static screenshot.

### 10. Pre-engagement with a 3PAO
- **What:** Reach out to a FedRAMP 3PAO firm (e.g., Coalfire, A-LIGN, KirkpatrickPrice, Schellman) for a pre-engagement / gap assessment quote. Doesn't have to be paid; the conversation itself is a credential.
- **Why:** Site currently says `Pending 3PAO review` on Mycelium. Once you have a firm name to associate with that conversation, the claim hardens.
- **Plug in:** `src/pages/mycelium.astro` — `honestStatus` array. Update `NIST 800-53 controls mapping` entry: `Pre-engagement discussion with [firm] underway.`
- **Cost:** Initial conversations are free. A formal gap assessment can run $15–40k but is not required for the site claim.

### 11. Custom og:image (Open Graph card)
- **What:** A 1200×630 image that shows up in LinkedIn / Twitter / Slack previews. Should have the Thornveil logo + hero headline + the shield mark + accent color.
- **Why:** Current `og-image.jpg` is the brand pack default. A custom one tied to the site positioning ("Sovereign AI you can run in a SCIF") converts on the share preview alone.
- **Plug in:** Save as `public/og-image.jpg`, overwriting the existing one. Referenced in `src/layouts/BaseLayout.astro`.
- **Time:** 30 min in Figma or via a tool like `og-image.vercel.app`.

### 12. SPF / DKIM / DMARC for thornveil.ai email
- **What:** DNS records that authenticate outgoing mail from `jesse@thornveil.ai`.
- **Why:** Without these, your responses to federal evaluator emails land in spam roughly half the time. Particularly painful for `.gov` and `.mil` recipients whose mail systems are strict.
- **Plug in:** DNS provider (whoever holds thornveil.ai — likely Netlify DNS or Cloudflare). Use Google Workspace's setup wizard if you're using Workspace, or Resend / Postmark / SES if you're forwarding.
- **Time:** 30 min to add records; 1–2 hours for propagation.

### 13. Confirm DD-214 date or hedge
- **What:** Confirm `December 10, 2026` is firm OR change site copy to `Q4 2026 / December 2026` if there's any chance it slips.
- **Why:** Currently the DD-214 date appears in metrics.json (`directContractsOpen: "December 10, 2026"`). If anything slips, the entire site countdown is wrong.
- **Plug in:** `src/data/metrics.json` — `company.directContractsOpen` and `company.directContractsOpenISO`.
- **Time:** Instant if you confirm; instant to hedge.

---

## P3 — nice-to-have

### 14. Press / public mention to feature
- **What:** Blog post, podcast appearance, conference talk, LinkedIn long-form, even a tweet thread from a defense-AI commentator.
- **Plug in:** New small footer line or homepage strip: `Featured: [Publication / podcast]`.

### 15. Evaluation NDA template (PDF)
- **What:** A one-page mutual NDA template that you'd sign with a federal evaluator.
- **Why:** Federal track says "evaluation NDA on request." If a PDF is downloadable directly, removes the back-and-forth.
- **Plug in:** `public/eval-nda-template.pdf`. Link from the federal track card and/or contact page.

### 16. Mycelium evaluator Docker compose — embed inline
- **What:** Currently the `/mycelium` page links to `github.com/thornveil-ai/mycelium-overview#install` for the 5-min Docker evaluator. Embed the actual `docker-compose.yaml` content in a `<pre>` block on the page.
- **Plug in:** `src/pages/mycelium.astro` — the "Try it in 5 minutes" section. Replace the link-out with a syntax-highlighted code block.

### 17. Brand video on `/about` or somewhere
- **What:** The `THORNVEIL Final.mp4` from the brand pack (~7s logo reveal on white). Re-encode with a dark/transparent background, then use as a 7-second cinematic moment on `/about`.
- **Time:** 30 min in DaVinci Resolve / ffmpeg.

### 18. LinkedIn company page polish
- **What:** Make sure the `linkedin.com/company/thornveil-llc` page has: the logo, a banner image, a tagline matching the site, the 10 systems described, current employee count (1).
- **Why:** Half of federal evaluators will check LinkedIn before clicking the site. The first impression of the company must match.

---

## Reference — current site state (auto-extracted)

- **Lighthouse desktop:** 100 / 100 / 100 / 100 (A11y · BP · SEO · Agentic)
- **Lighthouse mobile:** 100 / 100 / 100 / 100
- **LCP desktop:** 334ms · CLS 0.00
- **10 pages:** `/`, `/systems`, `/defense`, `/research`, `/cofounder`, `/about`, `/contact`, `/mycelium`, `/privacy`, `/404`
- **Conversion paths:** 3 audience cards (Federal / Prime / Cofounder) on homepage `#pick-your-track`, each goes to mailto for now
- **Public companion repos referenced:** `thornveil-ai/mycelium-overview`, `auspex-contact`, `rigrun-overview`, `signet`, `alchemist`, `meridian-core`, `canopy-preview`, `hawkstack-paper`, `pyros-overview`

---

*Last updated: synced with the codebase as of the most recent commit. Keep this file checked in so the next external collaborator (designer, federal-sales co-founder, etc.) can pick up where you left off.*
