# Thornveil Site Revamp — Master Plan

**As of:** 2026-05-21
**Status:** Plan locked. Awaiting execution go.
**Scope:** Full site rebuild aligned with VALUATION.md and trade-secret-only policy.

---

## Strategic position (one-sentence anchor)

> Thornveil is 10 production-grade systems for sovereign federal AI infrastructure, built solo while on active duty in the USMC. Review the work. Inquiries welcome. Direct contracts open post-separation. Co-founder applications open now.

Every page choice serves this.

---

## Site-wide audit findings (from automated scan)

| Page | LOC | Patent refs | Pricing refs | jeranaias refs | Status |
|---|---|---|---|---|---|
| 404 | 22 | 0 | 0 | 0 | clean |
| about | 117 | **2** | 0 | 0 | needs rewrite |
| contact | 95 | **1** | 0 | **2** | scrub + reframe |
| defense | 353 | **39** | 0 | **4** | heaviest rebuild |
| docs | 557 | 0 | **6** | 0 | strip Founding Access section |
| dronebane | 407 | 1 | 1 | 0 | **DELETE** |
| index | 304 | **2** | 2* | 0 | hero + Mycelium card scrub |
| mycelium | 415 | **14** | 1* | **3** | scrub patent claim + GH links |
| privacy | 40 | 0 | 0 | 0 | freshness pass |
| products | 1202 | **10** | **9** | **3** | full rebuild → /systems |
| research | 161 | **7** | 0 | 0 | scrub + arXiv-status update |
| technology | 380 | 0 | 1* | **1** | metric updates |

*Asterisked pricing hits include false positives ("AU-9 Audit" matched on `/`).

**Net:** 76 patent references + 17 real pricing references + 13 stale jeranaias references across the site. Two pages need full rebuild (/defense, /products). One delete (/dronebane). One new (/cofounder).

---

## Navigation transformation

### Current Nav.astro navLinks
```
Products / Docs / Technology / Defense / Research / About / Contact
```

### New Nav.astro navLinks
```
Systems / Technology / Defense / Research / Cofounder / About / Contact
```

Changes:
- **Products → Systems** (broader, more credibility-focused, less commercial)
- **Drop /docs from nav** (move to footer; current /docs page mixes pricing in with API spec — keep page but de-emphasize)
- **Add /cofounder** between Research and About
- **Drop /mycelium and /dronebane from any nav** — Mycelium becomes a /systems subtab + a deep section on /systems; DroneBane is deleted

### Footer additions
- Add `Docs` link in footer
- Add `Privacy` link in footer
- Add `github.com/thornveil-ai` org link in footer

---

## Per-page transformation plan

### 1. `/index` (home) — Hero + 4-pillar + CTA

**Status:** Strong structure; needs voice + content reframe.

| Element | Current | New |
|---|---|---|
| Hero headline | "Own your AI. Stop renting it." | "10 systems. One sovereign AI infrastructure. Built solo while active-duty USMC." |
| Hero subhead | "Run frontier models on hardware you control. No per-token fees, no data leaving your building..." | "Federal IL5-ready, ECCN-aware, governance-first. Direct contracts open post-separation. Review the work." |
| Hero tagline strip | "Runs on your hardware /// Your data never leaves /// No token fees, ever" | "Active-duty USMC founder /// 1.3M LOC across 10 systems /// Built since January 2026" |
| Hero CTAs | "View Products" + "See the Technology" | "Browse Systems" + "Apply to Co-found" |
| 4-pillar section title | "Four systems. One stack." | "Ten systems. One stack." (with link to full /systems page) |
| Pyros card metric | "7 pillars" | "17K Go LOC, race-clean" |
| **Mycelium card description** | "...substitute-on-failure dispatch (USPTO THRN-2026-022)..." | "...substitute-on-failure dispatch with Day-27 cryptographic reduction-to-practice..." |
| Mycelium card metric | "v1.0.0 cosign-signed" | keep |
| Metrics bar | "Zero / Your data / Unlimited / One binary" (sales tone) | "10 / Systems shipped"; "1.3M / LOC since Jan 2026"; "0 / Customer contracts (active-duty)"; "1 / Filed provisional with RTP" |
| Agent Catalog Preview section | "Off-the-shelf experts for your team" | Keep concept but restructure as "Sample agents from the Navigator factory" |
| Bottom CTA | "Ready to own your AI stack?" → email link | "Want to review the work, or co-found?" → email + cofounder link |

### 2. `/about` — Founder narrative

**Status:** Has good founder bio but diluted by "27 patents" stats.

| Element | Current | New |
|---|---|---|
| Stat block: 27 Provisional patents | "27 / Provisional patents" | "10 / Production-grade systems" |
| Body: "The patents started piling up" | reference | "The systems started piling up — each one ships a verifiable artifact" |
| Add new section | none | **"Active duty, building patient"** — explains USMC constraint, DD-214 timing, why no pricing/no contracts yet |
| Add new section | none | **"Build velocity"** — January 2026 first commit → 10 systems by May 2026 → 1.3M LOC |
| Founder bio | keep | keep, lightly polished |

### 3. `/contact` — Inquiries welcome

**Status:** Clean structure; needs scrub + reframe.

| Element | Current | New |
|---|---|---|
| Title context | implies commercial | "Inquiries welcome. Co-founder applications welcome. Direct contracts post-DD-214." |
| IP summary line: "27 provisional patent applications filed" | references | **DELETE** entirely — no IP-count messaging |
| `github.com/jeranaias` profile link | external | Replace with `github.com/thornveil-ai` org link |
| LinkedIn link | personal LinkedIn | Keep (it's correctly personal) |
| Phone number | currently absent | **Add** 831-275-8979 (already public on auspex-contact) |
| Add CTA | none | "Co-founder applications: see /cofounder" |

### 4. `/defense` — Defense applicability (HEAVIEST REBUILD)

**Status:** Currently a patent-enumeration spreadsheet. Needs full rebuild.

| Element | Current | New |
|---|---|---|
| Per-system tiles list patent numbers (e.g. `patents: 8, patentNums: '001, 006, 007...'`) | enumerated patents | **Delete patents/patentNums fields entirely**. Replace with `programs: [...named programs of record]` |
| External links to `jeranaias.github.io/{CAIRN,aurora,TRAVERSE,EDD}` | 4 external project links | **Delete**. These are adjacent personal projects, not part of the 10-system org. |
| DroneBane section | references | **Delete**. DroneBane lives at jeranaias/dronebane by SplashOne NDA, not on the org. |
| Page narrative | "27 patents, 13 programs" | "10 systems, 6+ defense-procurement-adjacent. Program-of-record fits below." |
| Per-system tile content | description + patent count | description + program fit (Replicator, Roadrunner-M, FS-LIDS, NAVSEA USV-counter-USV, etc.) + public companion link + status badge |
| TRL claims | 13 mentions of "TRL-3" etc. | Keep TRL claims but verify each per the deep-dive valuation findings |

**Proposed defense-page systems list (after rebuild):**
- Mycelium → SOCPAC / R2I / DDIL ops
- Auspex → DoD AI Safety Institute / CYBERCOM red team
- RigRun → IL5-pathway AI chat (FedRAMP-Mod path)
- HawkStack → Replicator / Roadrunner-M / Coyote Block 3 / FS-LIDS / NAVSEA USV-counter-USV
- Meridian → DARPA HACMS / SOCOM USV firmware / FAA / CISA memory-safe roadmap
- Canopy → DHS/CBP CUAS / FAA Section 2209 (Phase 0 honesty)
- Signet → AI-RMF / NIST AI safety baseline

Out of scope on /defense:
- Alchemist (memory-safety adjacent but not directly defense procurement)
- Navigator (internal-only)

### 5. `/products` → **rename `/systems`** (full rebuild)

**Status:** 1202-LOC current page mixes 4-5 product tabs with Founding Access pricing, beta seats, etc. Full rebuild needed.

| Element | Current | New |
|---|---|---|
| Page name | /products | **/systems** |
| Hero | sales-toned ("four ways to deploy") | engineering-toned ("the 10 systems") |
| Founding Access pricing tier ($250/mo, 5 seats) | exists | **DELETE entirely** |
| All "Apply for Founding Access" CTAs | 4-5 buttons | **Replace** with "Review on GitHub" → public companion repo |
| RigRun pricing block | "tier: Founding Access" | "Available for federal evaluation post-DD-214. Source under license — `licensing@thornveil.ai`" |
| Pyros tab | exists | Keep, scrub pricing |
| Mycelium tab | exists | Keep, link to /mycelium deep page + public companion |
| Agent Factory tab | exists | Keep but reframe ("Navigator", not "Agent Factory"; surface 9 agents) |
| **NEW**: dedicated tiles for all 10 systems | only 4 tabs | Each gets a tile with: name, tagline, status badge, audit-verified metric, public-companion link |
| Per-system audit-verified metrics | mixed | Use exact numbers from VALUATION.md (250K Go LOC Mycelium, 496K total RigRun, 17K Pyros, etc.) |
| GitHub source links | `github.com/jeranaias/*` | `github.com/thornveil-ai/*-overview` (public companions) |

### 6. `/technology` — Deep technical

**Status:** Mostly clean. 1 jeranaias ref to update.

| Element | Current | New |
|---|---|---|
| GitHub link `github.com/jeranaias/...` (line 217) | jeranaias | thornveil-ai/*-overview |
| Pyros pillars section | based on README | Verify pillar names + descriptions match audit-verified Pyros structure (24 layers / 7 pillars) |
| AU-9 / IR-9 NIST control references | clean | Keep — these are legitimate compliance references |
| Add | none | Trade-secret-grade IP framing in 1-2 places where appropriate |

### 7. `/research` — Papers and findings

**Status:** Has 5 paper PDFs + 7 patent references. Needs reframing.

| Element | Current | New |
|---|---|---|
| HawkStack "CVPR 2025 Best Paper" mention | exists | **DELETE/reframe**: "Topology paper preparing arXiv submission" |
| Patent count references (7) | exists | Delete; reframe as "trade-secret IP across 10 systems" |
| 5 paper PDFs in /public/papers/ | linked | Keep links; verify each PDF is current |
| Add | none | Note about HawkStack's reproducibility infrastructure (28 model notes, 186 training logs, 15 zoo checkpoints) — credibility signal |

### 8. `/docs` — Operator documentation

**Status:** 557 LOC, has "Founding Access" pricing block.

| Element | Current | New |
|---|---|---|
| "Founding Access" section (lines 490, 492, 506) | pricing copy | **DELETE entirely** |
| Pricing references | "Email support included with every RigRun license" | "Federal evaluation contact: jesse@thornveil.ai (post-DD-214)" |
| API spec, endpoints | clean | Keep |
| Page becomes | mixed pricing+docs | Pure operator-doc reference |
| Nav position | top-level nav | Move to footer |

### 9. `/mycelium` — Deep-dive (recent /73ad74c, /830d844)

**Status:** Well-polished page; needs patent + claim scrub.

| Element | Current | New |
|---|---|---|
| Patent claim mentions (14 across page) | "patent claim", "USPTO THRN-2026-022", "40-claim provisional" | Reframe each: "Day-27 cryptographic reduction-to-practice", "filed provisional with cryptographic RTP" — strip THRN numbers + USPTO references |
| `github.com/jeranaias/mycelium` (3×) | jeranaias org | `github.com/thornveil-ai/mycelium-overview` for public links; or `licensing@thornveil.ai` for source inquiries |
| "Customer-deployed" claim | implies live deployment | Reframe: "v1.0 production-ready; SOCPAC engagement in motion. v1.1 is the deployment milestone." |
| "Seven phones" claim | aspirational | Reframe: "Six worker processes simulating ruggedized tablets on RTX PRO 6000 validation hardware" |
| R2I alignment section | strong | Keep — this is the federal procurement wedge |
| 5-min evaluator quickstart link | repo link | Update to thornveil-ai/mycelium-overview when public spec available, or licensed contact |

### 10. `/dronebane` — DELETE

**Status:** 407 LOC. Not in 10-system org scope.

**Action:** `git rm src/pages/dronebane.astro`. Verify no internal links break (likely the /defense page links to it — remove those links in defense rebuild).

### 11. `/cofounder` — NEW PAGE

**Action:** Build per the locked profile (senior offensive cyber operator + post-uniform defense-AI startup rotation). Content drafted in prior turn; finalize as Astro page.

Structure:
- Hero: "Co-founder, Thornveil"
- "The seat is for an operator" (filters profile)
- "What you'll have done before" (background bullets)
- "What you'll do at Thornveil" (role)
- "What you get" (equity, technical wedge already shipped)
- "What we are not" (NOT raising, NOT building 30-person team)
- "Apply" (paragraph to jesse@thornveil.ai with specific signal-of-fit prompts)

### 12. `/privacy` — Freshness pass

**Status:** 40 LOC. Likely fine.

**Action:** Verify dates current. Verify content matches operational reality (no tracking, no third-party cookies if Plausible/GoatCounter aren't installed).

### 13. `/404` — As-is

**Status:** 22 LOC. Clean.

**Action:** None.

---

## Phase ordering

### Phase A — Repo housekeeping (~15 min)
1. Transfer `jeranaias/thornveil-site` → `thornveil-ai/thornveil-site`
2. Rename `master` → `main` via API
3. Apply tier1-public-oss branch protection
4. Add `.github/CODEOWNERS` + `.github/workflows/label-sync.yml`
5. Trigger label-sync (38 labels)
6. Verify Netlify build picks up new repo location

### Phase B — Scope-down (~30 min)
1. `git rm src/pages/dronebane.astro`
2. Strip CAIRN/Aurora/TRAVERSE/EDD references from /defense
3. Patent verbiage scrub across all pages (regex sweep)
4. Pricing block deletion from /products and /docs
5. Replace stale jeranaias/* links with thornveil-ai/* public companion equivalents

### Phase C — Page rebuilds (~3 hours)
1. **/index** — hero + 4-pillar + metrics-bar updates per table above
2. **/products → /systems** — full rebuild with 10-tile grid + audit-verified metrics
3. **/defense** — full rebuild around program-of-record adjacency (no patents)
4. **/about** — active-duty narrative + build-velocity context
5. **/mycelium** — claim cleanup + GH-link updates
6. **/research** — arXiv-status update + patent-count scrub
7. **/docs** — strip Founding Access section, keep API reference
8. **/technology** — verify Pyros pillars + update 1 GH link
9. **/contact** — inquiries-welcome reframe + phone number + IP-summary delete

### Phase D — New /cofounder page (~30 min)
Build the new page per the locked profile draft.

### Phase E — Nav + visual polish (~30 min)
1. Update `Nav.astro` navLinks per new layout
2. Update `Footer.astro` to add Docs + Privacy + org link
3. Verify hero copy + 4-pillar copy align with new strategic position
4. Visual smoke-test in dev server (`npm run dev`)

### Phase F — Build + deploy (~30 min)
1. `npm run build` locally; fix any broken internal links
2. Commit + push to thornveil-ai/thornveil-site/main
3. Netlify auto-deploy
4. Live smoke-test thornveil.ai every page

**Total time estimate: 5-6 hours, single focused session.**

---

## Tracking and decisions

### Decisions locked (from prior turns)
- **Co-founder profile:** Senior offensive cyber operator + post-uniform defense-AI startup rotation
- **Adjacent projects (CAIRN/Aurora/TRAVERSE/EDD):** Delete from site (not in 10-system org)
- **Pricing:** Delete entirely
- **Sales CTAs:** Replace with "Review the work / Inquiries welcome"
- **Repo URL strategy:** Use thornveil-ai/*-overview public companions for all source links
- **DroneBane:** Delete page

### Decisions locked 2026-05-21
- **Phone number:** Stays on GitHub-side (auspex-contact). **Site is email-only** — no phone on /about or /contact.
- **DD-214 / availability:** **December 10, 2026** — surfaced explicitly on /about ("Direct contracts open Dec 10, 2026") and /contact ("Estimated availability: Dec 10, 2026").
- **Analytics:** **Plausible Analytics** (privacy-respecting, no cookies, GDPR-clean — single-script-tag, ~$9/mo hosted at plausible.io or free self-hosted). Federal-credible posture matches the rest of the site. Add `<script defer data-domain="thornveil.ai" src="https://plausible.io/js/script.js"></script>` to BaseLayout.astro. Privacy policy gets a line acknowledging Plausible.

### Risks
- **Netlify build may break** mid-revamp if internal links go stale. Test build often.
- **Logo files in /public** — verify they survive the repo transfer.
- **Sitemap** — astro/sitemap regenerates on build; should be automatic but worth verifying.

---

## Success criteria (what "perfect" looks like)

1. Zero patent references on any page
2. Zero pricing references on any page
3. Zero stale jeranaias/* links (LinkedIn personal link OK; everything else thornveil-ai)
4. All 10 systems represented on /systems with audit-verified metrics + public-companion links
5. New /cofounder page live with the locked profile
6. Active-duty USMC context surfaced on /about as a strength, not a liability
7. /defense rebuilt around program-of-record adjacency, zero patent enumeration
8. Repo lives at thornveil-ai/thornveil-site with tier1 protection + signed commits + 38 labels
9. Live thornveil.ai serves the new content with no broken links
10. Build + Netlify deploy verified end-to-end

---

*End of master plan. Execute Phase A on go.*
