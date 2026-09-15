# Thornveil public-copy review

Review date: September 15, 2026. Original status: editorial proposals for owner review, not approved publication copy. The owner subsequently approved EDIT proposals only, leaving HOLD proposals unchanged; see the application record below.

Factual reconciliation update: [Product claim evidence and owner decisions](product-claim-evidence.md) records the dated owner responses and delegated conservative publication decisions for F1–F11 and F13. Its dispositions take precedence over held factual assertions in proposals below; it does not verify unsupported claims or cover F12.

## Scope and method

Audience: technical evaluators, prospective defense partners and cofounders. The target register is specific landing-page copy with technical-documentation precision. Keep the founder's first person, contractions and direct invitations. Explain what a system does before naming its procurement relevance.

Only this document is delivered. No site source, data, links, policies, layout or behavior was changed. Contact/privacy suggestions below are subordinate to the separate contact/privacy work; reconcile against that work before applying anything.

Read the uploaded `attached_assets/juliusbrussee-skills-fuck-slop_1789512397816.zip` by listing its members and streaming the three named Markdown files with `unzip -p`. No archive content was installed, executed or extracted over the project. Read `SKILL.md`, `references/tells.md` and `references/voices.md`. Followed scan → diagnosis → meaning-based proposals → mechanical rescan → cadence and register review. These are editorial patterns, not evidence of AI authorship.

Coverage: all ten public page files; `src/data/metrics.json`; public prose in BaseLayout, Nav, Footer, AudienceIntake, FounderCard, MomentumStrip and ShippingLog. Reviewed diagram labels through a read-only component inventory; diagrams primarily contain technical labels, not prose requiring stylistic replacement. Paper titles are bibliographic records and are retained. This review does not verify the papers, private repositories, benchmarks, legal posture or external certifications.

Counts exclude scripts, comments, CSS, URLs, package names and technical identifiers. Public descriptions stored in frontmatter and JSON are prose and are included. A repeated phrase at two source locations counts twice; shared components count once at source, not once per rendered route. Retained text is not implicitly fact-checked.

### Source snapshot and reconciliation

Baseline commit: `0069d3ac0d369d32783b0c0c42dbacf634ef9a0c`. Locations below refer to the inspected snapshot, before parallel functional work. Original blocks are exact text excerpts with HTML removed and whitespace joined; `{m.…}` denotes the existing data substitution, not proposed literal copy. A proposal replaces only its quoted excerpt unless expressly labeled a whole-section replacement. Unquoted surrounding text stays.

SHA-256 snapshots:

| File under `src/` | SHA-256 |
|---|---|
| pages/index.astro | `81529f9c469665ab223c13ced17ead14bd34e9f6004c718201eb375155a9bf43` |
| pages/systems.astro | `fb266e1915ff85c57477e0fc30a6c8c231c5df83bc8008d1fb451cd9c6170318` |
| pages/defense.astro | `1df96d92019fe685db6b99b267f87828606c797526786115694cd0ee6e9309cd` |
| pages/about.astro | `e17c73d6c335831aab586f18d669a64e188da7e64598e14c35d6575f27068e88` |
| pages/mycelium.astro | `82f06b15ce1aa1eaa7f3176da8dea04c8f0e7d5ac01017ac13ae17d4fe9341c3` |
| pages/research.astro | `70f2fda52833a69b424a08917666c2fa89fc1780086d920c8caea4568a7072e3` |
| pages/cofounder.astro | `7c069569c8134a7548cb756eb41bd0e42dd6a285e49d8c54529d6940b8796c01` |
| pages/contact.astro | `6a17a7ccd80e2c6ba41b39043dfca31bdd5611b897bb82661d9da5b87e3fe17c` |
| pages/privacy.astro | `ccf8fd8cf2fa5dad332fc3bf17466c9839e4b9df18fba01e465352cefa871766` |
| pages/404.astro | `9e5cbc1b7a00eb1ec7cf143cfafbab6e85f2a6d8d12ab15ca3a4479d7a02797d` |
| data/metrics.json | `7de76fff682f01699a10a50b132579cafad73637f69a8f3660b61fad19d2d98e` |

Before applying: compare the current file with this snapshot, locate the quoted original, resolve the factual holds, then replace only approved text. Do not overwrite concurrent accessibility, navigation or contact/privacy changes. Analytics event identifiers containing old wording are code and were excluded from this review.

## Diagnosis before rewrites

Initial mechanical reconnaissance used case-insensitive GNU `grep -Ein` with every pattern in catalog sections 1–4 against a conservative, source-line prose extraction. It included 499 records (3,938 whitespace-separated words); multiline prose and expressions make this a reconnaissance corpus, not a complete rendered-site word count. The exact-excerpt rescan below is the reproducible comparison corpus.

| Pattern category | Initial count and unit | Example and disposition |
|---|---:|---|
| Negative-parallelism regex | 0 matching records | Regex misses “Evidence, not adjectives” and the reversed contrast “architectural narrowing, not runtime policy.” Manual review remains necessary. |
| Catalog puffery | 3 matching records | “Deep dive” in index:85, systems:204, defense:124. Name the destination. |
| Hedging/throat-clearing regex | 0 matching records | Keep genuine qualifications such as “Pending 3PAO review.” |
| Range/triplet regex | 6 matching records | Canopy hardware prices twice; research:40; systems:148; index:179; about:25. Prices are real ranges; technical lists can contain distinct information. |
| Em dashes | 39 characters in reconnaissance corpus | Approximately one per 101 words, above the guide's one-per-150 heuristic. Many join independent claims or add emphasis. |
| Repeated readiness contrast, manual | 2 locations | index:180 and defense:95: “on day one — not retrofitted.” Both require a factual hold as well as an editorial change. |
| Promotional negation/contrast, manual selected examples | 6 locations | research:38; mycelium:116, 148, 180; about:49–52; ShippingLog:23. Replace slogans; preserve material implementation distinctions. |
| Uniform short-sentence runs, manual selected examples | 4 passages | Mycelium:77 and :148; systems:115; systems:227. Separate stock rhythm from useful authorization sequencing. |
| Scattered emphasis, manual | 2 Mycelium passages | :74–78 and :176–180 mix bold/italics with promotional claims. Use ordinary prose for the replacement paragraphs. |

Manual counts describe the listed examples, not exhaustive site-wide prevalence. The lack of a regex hit does not make a claim specific or substantiated.

## Publication gates

**HOLD** means the owner must resolve a fact or approve a substantive narrowing. Such proposals are explicitly conditional; do not publish their smoother wording as proof. **EDIT** means a meaning-preserving wording proposal, still subject to normal owner approval. **KEEP** means useful specificity or a necessary qualification survives the style review.

| ID | Owner question / evidence needed | Locations affected |
|---|---|---|
| F1 | What is actually authorized, assessed or merely targeted? Supply the scope and issuer for any SCIF, IL5, FedRAMP, R2I or “cleared” assertion. Distinguish security authorization from an export classification. Confirm Auspex's EAR ECCN 4D004 classification and distribution restrictions separately. | index:37, 69–75, 180; defense:19, 30, 85–96; systems:65, 75, 115; mycelium:51, 232; BaseLayout:16 |
| F2 | Confirm the exact contract-opening/separation date (December 10, 2026), permitted activities before separation, active evaluation engagements, and whether “contracts open” means availability rather than a legal conclusion. “Five months” is a historical May 2026 claim, not a current duration. Confirm January 12, 2026 first commit. | metrics company/portfolio; systems:227–233; about:8, 49–52; all date-bearing CTAs; MomentumStrip |
| F3 | Provide the Mycelium replay and test conditions: one RTX PRO 6000 with six simulated workers versus six physical computers/GPU workers. Confirm model spelling/version, three-second timing, worker-loss method, token continuity and output-quality measurements. Do not turn simulation into evidence of jamming/destruction tolerance. “Coherence degrades proportionally” needs a defined metric and measured relationship. “No pause” and “user never noticed” need latency/user evidence. | mycelium:9, 37, 59, 71–78, 139–148, 174–221, 299; index:75; systems:65; defense:11 |
| F4 | Confirm control denominator and meaning. Mycelium says “41 of 44 in-scope controls met (2 partial, 1 N/A)” and “Author's interpretation…Pending 3PAO review.” Is an N/A control in scope? RigRun's 44 implemented code paths are not proof of authorization. FIPS cipher selection is not module validation. | mycelium:36–38; metrics:33, 57–58, 136; systems:65, 75; defense:29 |
| F5 | Reconcile release/status values: RigRun v1.0.0/production in JSON versus v0.9 in systems/defense; Alchemist “live/public OSS” in JSON versus research prototype; Meridian hardware bring-up versus “H7 firmware flying”; Canopy “architecture validated” versus pending integration/stubbed classifiers. Define “live,” which also appears in visual panel chrome. | metrics systems; systems status/stat fields; defense:47–59; systems:187 |
| F6 | Reconcile HawkStack: five domains versus six listed in defense (including ECG); “sub-million” versus JSON `params: 1.77M`; 15 checkpoints and R²=0.9895 need dataset/split, baseline, parameter-count convention and run provenance. “Match SOTA” needs named comparisons. | metrics:98–104; systems:85–87; defense:37–40; research:18 |
| F7 | Supply dated code-count/test-count methodology (generated/vendor/test exclusions), audit author and audit artifacts for “audit-verified,” “race-clean,” “validated,” “production,” 1.3M LOC, endpoint counts, 10K/10K comparisons and all release claims. LOC is inventory, not evidence of correctness. | metrics; systems descriptions/stats; research evidence/totals; cofounder proof points; ShippingLog |
| F8 | Substantiate novelty and legal/IP implications: “no other autopilot,” “not in any chaos-engineering catalog,” MITRE/NIST comparisons, “trade-secret-grade,” “what's actually defensible.” Preserve as held claims until owner approves deletion/narrowing or provides a bounded comparison. | systems:95; defense:47; mycelium:148, 180; research:20, 33, 82–86 |
| F9 | Which report is preparing arXiv submission? The five listed titles do not name HawkStack, while the surrounding text does. Confirm publication status, PDF titles/pages, authorship and 2026 date; arXiv submission is not peer review. | research:5–9, 40–54, 69; systems/defense HawkStack |
| F10 | Confirm founder credentials, clearance disclosure, service/deployment history, education and hiring/offer terms. Preserve qualification exceptions, compensation/vesting terms and conditional language rather than “simplifying” them away. | about:7–14, 28–46; FounderCard:58–75; cofounder:6–46 |
| F11 | Confirm procurement references and relationships. “Program fit” must not imply adoption, sponsorship or endorsement. Confirm SAM registration, data-rights language, planned vehicles and FAR/DFARS applicability with the owner. | defense:12–79; contact:77–109 |
| F12 | Contact/privacy owner owns destination accuracy, processing disclosures, retention, hosting, analytics configuration, cookies/storage and product-mode claims. Confirm effective date and avoid unverified GDPR assurances. Accessibility/performance targets are not achieved results. | contact; privacy; BaseLayout:75–76; Footer:47; metrics accessibility |
| F13 | Verify compatibility and packaging boundaries: “any client,” “any model,” “any laptop,” no vendor lock-in, five-minute install, supported hardware/model sizes, signed artifacts and reproducible builds. A synthetic UI evaluator is not real inference. | mycelium:14, 24–38, 41–47, 255–300; metrics Pyros |

## Page-by-page proposals

Each `Original:` / `Proposed:` pair is a bounded replacement unit for the scan. Editorial notes and factual holds are not intended site copy.

### Home — `src/pages/index.astro`

**H1 · :37; also BaseLayout default description :16 · HOLD F1/F2/F5.**

Original: Ten engineering systems for sovereign federal AI infrastructure. IL5-ready, ECCN-aware, governance-first. Built solo while active-duty USMC. Direct contracts open December 10, 2026.

Proposed: Ten systems for local AI inference, agent authorization and related infrastructure. Built solo while active-duty USMC; direct contracts open December 10, 2026.

This explicitly proposes removing unverified readiness adjectives, not silently treating them as false. Date remains held. “Sovereign” may remain in the brand/title if the owner defines it through deployment and data-control mechanisms.

**H2 · :69–75 · HOLD F1/F3/F5.**

Original: Sovereign AI you can run in a SCIF.

Proposed: AI infrastructure for local deployment.

This is a substantive narrowing for approval, not an equivalent claim of SCIF suitability. In the lead, hold “Ten federally-fit systems shipped solo” pending release/readiness definitions. Suggested replacement for the demonstration sentence:

Original: The mesh on this page is one of them — Mycelium, surviving when half its workers die.

Proposed: Mycelium continues generating tokens when workers become unreachable. Its coordinator substitutes zero vectors for missing expert outputs.

The mechanism is from Mycelium's page, not independently verified. Keep the test conditions close to any half-worker-loss claim; the homepage animation itself is illustrative.

**H3 · :85 · EDIT.**

Original: Mycelium deep dive ↗

Proposed: How Mycelium handles worker loss ↗

**H4 · :102, 150 · EDIT.**

Original: Four flagship systems. Six more on the org.

Proposed: Start with these four systems.

The ten-system count stays in the adjacent catalog link. “On the org” is unclear and could imply all ten have public repositories.

Original: Ten systems. One integrated graph.

Proposed: Dependencies across the ten systems

Keep :152's distinction between independent systems and their composition only after F5 is resolved. The hover instruction at :153 belongs to the touch/keyboard task; do not prescribe interaction wording here.

**H5 · :174, 180 · HOLD F1.**

Original: A patient build, in the open.

Proposed: What Thornveil is building

Original: Built ground-up to clear FedRAMP, IL5, and ECCN review on day one — not retrofitted.

Proposed: RigRun gates routing by classification; Mycelium records tamper-evident audit logs. Their individual pages describe implementation status and pending reviews.

Owner approval required to replace the readiness claim with these already-described mechanisms. Preserve :177–179's system categories. Do not suggest FedRAMP, IL5 and ECCN are interchangeable reviews.

**KEEP:** direct founder email, cofounder link, system names and useful catalog navigation. :183–200's availability dates remain F2 holds; “post-uniform defense-AI startup rotation” should use the precise role criteria from cofounder rather than inventing a tenure requirement.

### Systems — `src/pages/systems.astro`

**S1 · :143, 146–148 · HOLD F7 for audit wording.**

Original: Ten engineering systems. One sovereign AI stack.

Proposed: Ten systems for AI inference, safety checks and related infrastructure

Original: Each tile below carries audit-verified codebase metrics and a link to the public companion repository for review. Source for the proprietary systems lives behind licensing; the public companions hold marketing-grade documentation, architecture overviews, and API contracts that evaluators can read.

Proposed: The entries below list codebase metrics and available public repositories. Proprietary source requires licensing; its public companion repositories provide architecture documentation and API contracts for evaluators.

Explicitly proposes removing “audit-verified” until F7 supplies provenance. “Available” accommodates Navigator's internal-only entry; do not imply every tile has a repository.

**S2 · Signet :35 · EDIT.**

Original: The Signet vocabulary that Auspex extends with engagement-specific checks.

Proposed: Auspex extends Signet's check vocabulary with checks specific to each engagement.

Keep the four stage names, 11-check count, Apache-2.0 license, PyPI package name and HMAC/RFC 3161 distinctions. Those are useful technical specifics, with counts held under F7.

**S3 · Alchemist :45 · HOLD F11 for regulatory characterization.**

Original: Built for the CISA / DoD / ONCD memory-safe regulatory tide.

Proposed: The translation pipeline targets migration from C to memory-safe Rust.

Owner must approve dropping the broad regulatory characterization or provide named applicable guidance. Keep all five gates, 10K/10K differential comparison, refusal without differential configuration and local-LLM-only restriction. Do not upgrade a prototype to production.

**S4 · Pyros :54–55 · EDIT, evidence F7.**

Original: Self-sustaining inference engine.

Proposed: Adaptive controls for inference backends.

Original: 24 adaptive subsystems organized into 7 conceptual pillars. PID homeostasis + Holt forecaster + UCB1 bandit + epsilon-greedy variant evolution wired into one orchestrator.

Proposed: One orchestrator coordinates 24 adaptive subsystems in seven groups. It combines PID control with Holt forecasting, a UCB1 bandit and epsilon-greedy variant evolution.

Keep PAVA/sklearn validation and Linux/macOS/Windows race-check qualifications. Retain the actual supported backend list. Do not merge this inference-control description into JSON's “safety perimeter” claim without F13 clarification.

**S5 · Mycelium :65 · HOLD F1/F3/F4.**

Original: When workers drop, substitute-on-failure dispatch keeps generation continuing — Day-27 cryptographic reduction-to-practice. R2I-aligned MOSA surface with 50-endpoint OpenAPI 3.1 published. 41 of 44 in-scope NIST 800-53 controls met with file-path traceability.

Proposed: When a worker becomes unreachable, the coordinator substitutes zero vectors for its missing expert outputs so generation can continue. Reduction-to-practice was recorded on May 8, 2026. The published OpenAPI 3.1 specification describes 50 endpoints. The author's NIST 800-53 mapping reports 41 of 44 in-scope controls met, with file-path traceability; 3PAO review is pending.

Keep mTLS and per-request HMAC audit description. This brings forward the existing author/pending-review qualification; it does not establish compliance. Owner must reconcile the scope denominator and approve removal or definition of “R2I-aligned MOSA.”

**S6 · RigRun :75 · EDIT, evidence F1/F4.**

Original: Classification gate enforced at the type-system level — CUI+ queries hard-blocked from cloud routing as architectural narrowing, not runtime policy.

Proposed: The type system excludes cloud routing for CUI+ queries.

This contrast contains a real implementation distinction. Preserve it through the named mechanism, rather than a slogan about policy. Keep three apps/one Go backend, the eight-signal pipeline and IR-9 detection's Unicode normalization/entropy thresholding. “CUI+” needs an owner-defined classification boundary; it is not a new authorization claim.

**S7 · HawkStack :85 · HOLD F6.**

Original: Topology-driven recipe that turns (dataset, domain) into (architecture, training config) and produces sub-million-parameter models that match SOTA in their weight class.

Proposed: Given a dataset and domain, HawkStack produces a model architecture and training configuration.

This deliberately holds the size/performance clause for evidence and owner approval; no replacement benchmark is invented. Retain the 15 checkpoints, named domains, 16 runs, R²=0.9895 and paper status as held source facts rather than delete their qualifications.

**S8 · Meridian :95 · HOLD F8.**

Original: Phase 10 trade-secret primitives no other autopilot ships:

Proposed: Phase 10 features include:

The colon introduces the existing feature list; retain ed25519 attestation, each adversarial-detection case, beacon, dynamics identification and Black Box taxonomy. Approval required to remove the exclusive competitor comparison and trade-secret characterization. Keep hardware bring-up status and parity-audit counts (F5/F7); “airworthiness attestation” must not become “airworthiness certification.”

**S9 · Canopy :105 · EDIT, evidence F5.**

Original: Real Kalman tracking + Dempster-Shafer evidence fusion + bearing-intersection geolocation (tested). Mesh networking + decision engine scaffolded; ML classifiers stubbed. Honest Phase 0 framing — designed to replace DragonOS/WarDragon with mesh-aware open architecture.

Proposed: Kalman tracking, Dempster-Shafer evidence fusion and bearing-intersection geolocation have been tested. With mesh networking and the decision engine scaffolded and ML classifiers still stubbed, this Phase 0 project is intended to replace DragonOS/WarDragon with an open architecture that supports mesh networking.

Keep intent distinct from achieved replacement. Keep the five sensing inputs and $270–$1,650 range; prices have a meaningful numeric midpoint, so the range is not a style problem.

**S10 · Auspex :115 · KEEP with light consolidation available, evidence F1/F7.**

Original: The model proposes. Signet authorizes. Auspex executes only what is allowed.

Proposed: The model proposes actions for Signet to authorize. Auspex executes only authorized actions.

The original three-step sequence is also an acceptable intentional cadence exception: it assigns three distinct responsibilities. Preserve “federal-only,” 13 authority checks, engagement compilation, Active Directory replay validation and the HMAC/RFC 3161 distinction.

**S11 · Navigator :124–125 · EDIT.**

Original: Internal AI ops center.

Proposed: Internal agent-production pipeline.

Keep “Not for external sale.” Keep 14 steps as the claimed total and the source's parenthetical as a selection of stages, not a complete enumeration: it visibly lists fewer than 14. Preserve 9 agents, 80 MCP-exposed tools and 9 domains pending F7. The agent roles are distinct and do not need a decorative rewrite.

**S12 · :204, 227 · EDIT / HOLD F2.**

Original: Deep dive →

Proposed: Mycelium mechanism and test status →

Original: Five months. Solo. Active duty.

Proposed: Built solo while on active duty

Keep the following paragraph's January-to-May 2026 measurement window; do not update its duration by counting forward from today's date. “Soft engagements” at :232 should become “Technical conversations” only if F2 confirms that is what the owner means. Keep exact date substitutions.

### Defense — `src/pages/defense.astro`

**D1 · :85, 91–96 · HOLD F1/F2/F11.**

Original: Cleared for the next federal procurement window.

Proposed: Systems for federal technical evaluation

Original: Seven of Thornveil's ten systems are directly defense-procurement adjacent. Each is built ground-up to clear FedRAMP, IL5, or ECCN review on day one — not retrofitted after the customer asks.

Proposed: Seven systems are described below for federal evaluators. Each entry identifies its mechanism, development status and potential program relevance.

Explicit owner-approved narrowing of clearance/readiness implications. Keep “Evaluation engagements active now; direct contracts open {m.company.directContractsOpen}” held under F2. Metadata :85 also needs approval to characterize the named programs as potential relevance rather than established relationships.

**D2 · :11 · HOLD F3.**

Original: When workers drop, substitute-on-failure dispatch keeps generation continuing — validated end-to-end on 2026-05-08 with HMAC-chained tamper-evident audit log.

Proposed: Substitute-on-failure dispatch continued generation in the May 8, 2026 demonstration, recorded in a tamper-evident HMAC-chained audit log.

Use only with the confirmed simulated-worker conditions stated alongside it. DDIL means denied, degraded, intermittent or limited connectivity; retain it as the intended environment, not proof of field testing.

**D3 · :29, 38, 47, 56, 65 · cross-page proposals.**

Apply S6 to the identical RigRun classification-gate sentence; S7 to HawkStack's dataset/architecture sentence while separately holding its defense-specific performance claim; S9 to the identical Canopy passage; S2 to Signet's identical vocabulary sentence. These are separately occurring original/proposed pairs by reference, not new claims. Preserve defense-only details: Auspex's May 16 validation date, Meridian's H7/F4/F7 distinction, exact Canopy hardware configurations, FreeTSA/DigiCert backends, and planned program references. F5/F6/F8/F11 gate those details.

Meridian's differently ordered “that no other autopilot ships” at :47 is held for the same owner-approved removal as S8; do not treat H7 flying as proven from “bring-up active.”

**D4 · :119, 124, 79, 161–162 · EDIT / HOLD F2/F11.**

Original: Program fit

Proposed: Potential program relevance

This is an explicit narrowing requiring approval; none of the named programs should read as an endorsement.

Original: Deep dive

Proposed: Mycelium mechanism and test status

Original: Active-duty USMC · conversations compound to signed paper

Proposed: Active-duty USMC · technical conversations open

Original: Conversations now compound into signed paper post-DD-214 ({m.company.directContractsOpen}). Review the public companions; the substrate is ready.

Proposed: Review the public companion repositories or ask for an evaluation walkthrough. Direct contracts open {m.company.directContractsOpen}.

Drops a readiness assertion and implied guaranteed conversion to contracts, subject to owner approval. Preserve the procurement table's specific terms as F11 holds, not editorially invented substitutes.

### About — `src/pages/about.astro`

**A1 · :25 · EDIT.**

Original: The shift from analyst to builder happened gradually, then all at once.

Proposed: I started building the tools I wanted as an analyst.

Supported by the next paragraph. Keep “I'm Jesse Morgan” and the first-person narrative. Do not invent an anecdote to make it sound personal.

**A2 · :28–31 · EDIT.**

Original: I founded Thornveil to build the AI infrastructure I wanted to use as an analyst — local, data-sovereign, accountable to the people running it.

Proposed: I founded Thornveil to build AI infrastructure that analysts can run locally and control themselves.

The deployment/control meaning survives; the service history that follows stays, subject to F10. Keep the overnight-watches/weekends/deployments sentence at :41: it is a concrete founder detail, not a disposable triplet.

**A3 · :49–52 · HOLD F2.**

Original: That's a regulatory constraint, not an execution constraint — the work keeps shipping. What it means for federal evaluators: we can start the technical conversation today, walk you through the substrate today, sign an evaluation NDA today. Direct contracts queue for December.

Proposed: I can discuss the systems with evaluators, provide a walkthrough and sign an evaluation NDA before separation. Direct contracts open December 10, 2026.

The preceding active-duty sentence remains. Confirm permissions/date; this is not legal advice. Avoid promising a queue or signing outcome. This retains a useful timing distinction without the repeated “today” sales rhythm.

**A4 · :86–87 · EDIT.**

Original: Tell me what you're working on; the substrate is already there to compound onto.

Proposed: Tell me what you're working on and which system you want to evaluate.

**KEEP/HOLD:** credential labels and specific biographical facts, F10; firsthand problem list, including the 3PAO claim at :45, needs owner confirmation rather than a rewrite implying successful third-party assessment.

### Mycelium — `src/pages/mycelium.astro`

**M1 · :71–78 · HOLD F3; whole headline and lead replacements.**

Original: AI that keeps thinking when half the team goes dark.

Proposed: Token generation continues after worker loss.

Original: Picture six computers working together on one conversation — like teammates sharing the load. Now picture three of them getting unplugged, jammed, or destroyed mid-sentence. With Mycelium, the conversation just keeps going. No pause. No restart. No "something went wrong." That's the breakthrough — and you can watch it happen in three seconds, just below.

Proposed: In the recorded demonstration, six simulated worker processes ran on an RTX PRO 6000. When three became unreachable, Mycelium continued producing tokens by substituting zero vectors for their missing expert outputs. Physical ruggedized-tablet validation is still pending.

This reconciles the hero to the existing status note :37, pending owner's confirmation that the note describes this demonstration. It deliberately removes physical-destruction, uninterrupted-latency and breakthrough claims rather than presenting them as proven.

**M2 · :9 · HOLD F3.**

Original: Substitute-on-failure dispatch at the per-token MoE expert dimension. When half the mesh becomes unreachable mid-token, the coordinator substitutes a zero vector for the missing expert and the dense MLP keeps producing. Output coherence degrades proportionally to loss, not catastrophically.

Proposed: For each token, the coordinator substitutes a zero vector for an unreachable mixture-of-experts (MoE) expert. The dense multilayer perceptron (MLP) path continues producing tokens.

Hold the proportional-coherence claim pending measurements; owner approval needed to omit it. Do not replace it with a new claim of unchanged quality. This is not task rescheduling to a healthy worker.

**M3 · :13–14 · EDIT / HOLD F13 for universal compatibility.**

Original: OpenAI-compatible surface.

Proposed: OpenAI-compatible chat endpoint.

Original: Any client that speaks /v1/chat/completions works without code changes. The mesh is an implementation detail your operators never see — they get the same interface their tooling already targets.

Proposed: Mycelium exposes /v1/chat/completions for OpenAI-compatible clients.

Explicitly narrows “any” and “without code changes”; owner should publish tested compatibility boundaries if the stronger promise is intended. Endpoint spelling remains exact.

**M4 · :19 · EDIT, evidence F4/F7.**

Original: Every chat HMAC-chained into a canonical-JSON ledger, RFC 3161 trusted-timestamp anchored. Replay package available under evaluation NDA. A 3PAO can verify the chain end-to-end.

Proposed: Each chat is recorded in a canonical-JSON ledger with an HMAC chain and RFC 3161 trusted timestamps. A replay package is available under an evaluation NDA for end-to-end chain verification by a 3PAO.

This describes review capability, not completed review. Keep “tamper-evident”; never substitute “tamper-proof.”

**M5 · :103–104, 116–118, 139 · EDIT.**

Original: Six workers running · one shared brain ·

Proposed: Six workers generating one response ·

Original: watch what happens when three die →

Proposed: see the three-worker-loss comparison →

Original: Substrate properties, not marketing claims. Each one is observable in the public companion repo or in a 30-minute walkthrough.

Proposed: Review the mechanisms in the public companion repository or request a 30-minute walkthrough.

The walkthrough duration remains a service expectation for owner confirmation.

Original: What survives when half the mesh dies.

Proposed: How zero-vector substitution works

**M6 · :141–148 · HOLD F3/F8.**

Original: Distributed inference frameworks don't document what happens when an inference worker becomes unreachable mid-token. Most options are catastrophic: hang, error, drop the request.

Proposed: Mycelium handles an unreachable worker at the MoE expert level.

Keep the following coordinator/zero-vector/dense-MLP explanation, using M2's terminology. Remove the universal competitor claim only on owner approval. :144's proportional-coherence assertion remains held.

Original: Not in any chaos-engineering catalog. Not in MITRE's experiment-process methodology. Not in NIST SP 800-204.

Proposed: The May 8, 2026 reduction-to-practice record includes HMAC-chained evidence.

Owner approval required to replace novelty assertions; consolidate with the preceding dated sentence rather than repeat it. “Day-27” can remain in an evidence chronology if its starting event is defined; a calendar date is clearer to a new evaluator.

**M7 · :174–180 · HOLD F3/F8; replace comparison heading/paragraph.**

Original: Same screen. Three seconds apart.

Proposed: Before and after three workers become unreachable

Original: On the left: six computers, all green, working together on one answer. On the right: three are dead — and the answer is still coming through. Nobody hit a button. Nothing was rerouted. The system simply kept going. Substitute-on-failure dispatch at the MoE expert dimension — not in any chaos-engineering catalog, not in MITRE, not in NIST SP 800-204.

Proposed: The first screenshot shows six available workers. In the second, three are unreachable and token generation continues as the coordinator substitutes zero vectors for missing expert outputs. The demonstration used simulated worker processes; physical hardware validation is pending.

Use “first/second” rather than left/right because images stack on narrower screens. Do not present screenshots as an interactive or continuous video. Keep the t=0s/t=3s labels and dated evidence line only after F3 confirmation.

**M8 · :197, 210, 213, 219 · HOLD F3.**

Original: BEFORE · All six computers working together.

Proposed: BEFORE · Six worker processes available.

Original: Three workers dead, substituted with zero vector — the team is still thinking

Proposed: Dashboard showing three unreachable workers and continued token generation

Alt text describes the image, without claiming human cognition.

Original: AFTER · Three are dead. The answer is still coming through.

Proposed: AFTER · Three workers unreachable; token generation continues.

Original: The user typing the question never noticed anything happened.

Proposed: Token generation continued after worker loss in this demonstration.

This replaces an unverified subjective experience claim with the already stated observation, conditional on evidence. Consolidate with the preceding caption if redundant.

**M9 · :232 and :41–47 · HOLD F1/F13.**

Original: R2I-compliant by design.

Proposed: Published interfaces and integration documentation

Keep the attributed Driscoll quotation exactly as a quotation, including its word “ecosystem”; owner must verify wording, attribution, date and source. A quotation does not establish Mycelium compliance.

Original: No vendor lock-in — cosign-signed binaries (Linux + Windows + macOS, RPM + DEB + .exe + .dmg)

Proposed: Cosign-signed binaries are available for Linux, Windows and macOS, with RPM, DEB, .exe and .dmg packages.

Signing/packaging does not itself prove absence of lock-in; this removal needs approval. Keep the concrete API paths, OpenAPI version, runbook/threat-model/control-map/STIG-lite list, coordinator/worker separation and pluggable fallback model. “Vendor-neutral”/“without code changes” has the same hold as M3.

**M10 · :255, 292–296 · EDIT / HOLD F13.**

Original: Auto-tiered to whatever you've got.

Proposed: Hardware detection assigns a tier.

Keep first-run detection, peer aggregation and all five hardware/capacity rows, with F13 evidence boundaries.

Original: Operator UX on any laptop. No GPU.

Proposed: Try the evaluator UI without a GPU

Original: The evaluator stack is a brand-coherent replica of the operator chat + ops dashboard with synthetic-but-interactive worker state. Kill workers from the dashboard and watch the headline rewrite itself. ~50 MB image. Zero GPU. Zero model checkpoint.

Proposed: The evaluator stack provides operator chat and dashboard interfaces with simulated worker state; disable workers in the dashboard to see its display update. The image is approximately 50 MB and requires neither a GPU nor a model checkpoint.

Keep the following separate production-stack description and real-model requirement, pending F3/F13. Do not turn UI simulation into inference evidence. Commands are excluded from the style review and left untouched.

**M11 · :34, 319–321, 346–347 · EDIT, date F2.**

Original: Brand-coherent web UIs. 5-minute evaluator stack via Docker.

Proposed: Web interfaces for operators and evaluators. The Docker evaluator stack is described in the quickstart.

Owner approval required to omit the five-minute installation promise; retain it only with a tested starting environment.

Original: Today vs. roadmap.

Proposed: Implementation status and pending validation

Original: A pitch lives or dies on candor. Here's what's shipped and what's still ahead.

Proposed: The status below separates released components from work awaiting validation.

Original: Standards seat. Licensing terms. Live demo. Whatever shape the conversation needs to take, the door is open. Direct contracts open {m.company.directContractsOpen}.

Proposed: Contact Jesse to discuss standards participation, licensing or a live demonstration. Direct contracts open {m.company.directContractsOpen}.

**KEEP:** author's interpretation, 2 partial/1 N/A, pending 3PAO review, simulated worker note and FIPS module validation not pursued. These are material limits, not removable hedges. Keep SBOM and reproducible-build claims as F7/F13 holds.

### Research — `src/pages/research.astro`

**R1 · :33, 38–41 · HOLD F7/F8/F9.**

Original: Trade-secret-grade subsystems with cryptographic reduction-to-practice evidence.

Proposed: Subsystem descriptions with references to implementation and test evidence.

Owner approval required to drop the IP characterization.

Original: Evidence, not adjectives.

Proposed: Technical reports and subsystem evidence

Original: Every claim is backed by working code, measured benchmarks, and where appropriate cryptographically auditable reduction-to-practice. Five technical reports below — one preparing arXiv submission.

Proposed: Five technical reports are listed below. The subsystem entries identify implementation details and recorded results for review.

This holds the universal evidence claim and ambiguous arXiv statement instead of quietly inventing support. Keep the source-access distinction from S1 when describing the GitHub organization.

**R2 · :53–54 · HOLD F9.**

Original: Internal write-ups documenting the algorithms behind Thornveil's systems. Not yet peer-reviewed; HawkStack topology paper is preparing arXiv submission. Read at your own pace.

Proposed: These internal technical reports document algorithms used in Thornveil's systems and have not been peer-reviewed. The HawkStack topology paper is being prepared for arXiv submission.

Keep this proposal held until the owner clarifies whether HawkStack is separate from the five linked reports. Do not rename paper titles or imply arXiv acceptance.

**R3 · :82–86 · HOLD F8.**

Original: What's actually defensible.

Proposed: Subsystems and their evidence

Original: Each Thornveil system carries one or more subsystems where the engineering work materially differentiates it from open-source alternatives. Named subsystem, the differentiator, and the empirical evidence behind each.

Proposed: The entries below pair named subsystems with implementation details or recorded test results.

This proposes removing the universal differentiation/legal implication; it is not an opinion about IP validity. Keep the nine entries' technical distinctions, dates and numeric values as F3–F9 holds. A code-count entry is implementation inventory; do not relabel it a benchmark. Meridian's competitor absence claim at :20 needs a bounded comparison or approved removal under F8.

### Cofounder — `src/pages/cofounder.astro`

**C1 · :98–101 · EDIT, release claims F5.**

Original: Ten engineering systems shipped solo. Federal sales motion: not yet. That gap is the co-founder seat.

Proposed: I've built ten engineering systems solo. I'm looking for a cofounder to lead federal sales.

Does not redefine the full responsibilities below; “built” is an explicit proposed narrowing of the disputed shipped status. Keep the concrete responsibility list, pilot/relationship targets and commercial terms with F10 confirmation.

**C2 · :110–112 · EDIT.**

Original: Verify the work before deciding to take the seat. The public companion repositories are organized for evaluator review.

Proposed: Review the public companion repositories before deciding whether to join.

Do not imply that public summaries expose all proprietary source. Preserve per-system proof-point limits.

**C3 · :150–152 · EDIT.**

Original: Required are hard. Preferred are advantages.

Proposed: Start with the required qualifications. The preferred list describes additional experience we'd value.

Keep the immediately following exception language in full; do not turn “required” into an absolute exclusion or change eligibility. The concrete qualifications, compensation, vesting, $0 base and Q1 2027 statements stay held under F10, not rewritten into a different offer.

**C4 · :229–230 · KEEP.**

Original: 1–2 paragraphs is plenty. No resume needed at first contact.

Proposed: 1–2 paragraphs is plenty. No resume needed at first contact.

Already plain and actionable. Keep the actual prompts above it. No need to manufacture variety.

### Contact — `src/pages/contact.astro`

Editorial suggestions only. The separate contact/privacy work owns page content accuracy and destinations; none of the following overrides it.

**CT1 · :57 · EDIT.**

Original: Federal-AI capability questions answered in plain English. Email below.

Proposed: Email Jesse with the system you want to evaluate and the decision you need to make.

No response-time guarantee added. For :14–18's repeated invitations, suggest consolidating after the authoritative task confirms the available inquiry paths. Retain the exact contract date, response expectation, entity identifiers and procurement terms only after F2/F11/F12 confirmation.

### Privacy — `src/pages/privacy.astro`

Editorial suggestions only; not a substitute privacy policy or legal assurance.

**P1 · :29 · HOLD F12.**

Original: a lightweight, privacy-focused, cookie-free, GDPR-compliant alternative to Google Analytics.

Proposed: an analytics service used to count page views.

This explicitly proposes removing unverified privacy/compliance assurances; the authoritative privacy work must determine what disclosures are accurate. Keep the service name/link. Do not replace categorical claims with another unverified promise.

**KEEP/HOLD:** “Questions about this policy” is clear. Summary :17–20, analytics fields/hosting :30–36, cookies/storage :42 and product-data :48–50 are factual policy assertions. No stylistic rewrite can reconcile “no sharing with third parties” with provider processing, verify the deployment host, establish email retention, or guarantee that every local product mode has no outbound routing/telemetry. The contact/privacy task must resolve those facts first.

### Not found — `src/pages/404.astro`

**N1 · :10 · EDIT.**

Original: The path you requested is not declared in the Thornveil scope.

Proposed: That URL does not match a published Thornveil page.

Keep the existing recovery links. “Scope” here is an unnecessary borrowing from the product vocabulary.

## Shared prose and data-backed descriptions

### Shared components

**SH1 · AudienceIntake.astro :65–66 · EDIT, availability F2.**

Original: Conversations now compound. Choose the track that fits and we'll route you cleanly from there.

Proposed: Choose the inquiry type that matches your role.

Does not promise a form behavior, reply or workflow beyond the available choice. Keep the distinct evaluator/partner/cofounder paths; their destinations belong to functional work.

**SH2 · ShippingLog.astro :22–23 · EDIT.**

Original: What's actually shipped, dated. The federal AI substrate is built in commits, not in decks.

Proposed: A dated record of releases and engineering milestones.

Review log headlines as F3/F5/F7 claims; linked releases and internal milestones are not all independently verified releases. Keep names, dates and versions instead of rewriting history to match current dates.

**SH3 · MomentumStrip.astro :34 · HOLD F7/F8.**

Original: first autonomous AD takeover · 2026-05-16

Proposed: Auspex Active Directory takeover demonstration · 2026-05-16

Explicit proposal to remove ambiguous “first,” not deny it; owner must define first for whom and supply scope. Preserve “autonomous” if the owner confirms what human supervision/authorization was present. Expand AD for newcomers.

**SH4 · Footer.astro :47 · HOLD F12.**

Original: 508 {a11y.section508} · Lighthouse {a11y.lighthouseTarget}+ · last updated {buildDate}

Proposed: Section 508 target: {a11y.section508} · Lighthouse target: {a11y.lighthouseTarget}+ · generated {buildDate}

Owner must confirm that `section508` is a target and what AA standard it references; Section 508 and WCAG conformance should not be conflated. A generated date is not evidence of a policy/content review. Preserve identifiers and source substitutions. BaseLayout's analytics/privacy comment is excluded from counts; any rendered assurances require the same F12 reconciliation.

**KEEP:** Nav's destination names and functional labels. FounderCard's specific first-person/service/build facts remain, with F2/F7/F10 holds; do not rephrase credentials for effect. Technical diagram labels (MoE, HMAC, PID, model names, node identifiers) remain. Do not convert “LIVE” into a verified deployment assertion; F5 applies wherever that label is shown.

### `src/data/metrics.json`

JSON strings can surface on the home tiles and diagrams. Keep field keys, values, numeric precision and identifiers untouched in this task. When applying approved text later, check every consumer and reconcile page-local copies.

**J1 · systems.rigrun.summary :38 · EDIT, evidence F4.**

Original: Classification-gated multi-domain LLM router. Three apps on one Go backend. NIST 800-53 controls implemented as discrete code paths.

Proposed: Three apps share one Go backend that routes LLM queries by classification. NIST 800-53 controls are implemented as discrete code paths.

Retains implementation language, not assessed compliance.

**J2 · systems.pyros.summary :49 · HOLD F13.**

Original: Pure-Go safety engine that wraps any model in a 7-pillar pipeline. No Python, no CGO, one binary.

Proposed: Pyros runs a seven-part pipeline in one Go binary, without Python or CGO.

Owner must reconcile safety-engine versus adaptive-inference descriptions and approve removing universal model support; do not substitute one claim for the other silently.

**J3 · systems.mycelium.tagline :53 and summary :64 · HOLD F3.**

Original: Keeps thinking when the mesh dies

Proposed: Token generation after worker loss

Original: Distributed mixture-of-experts inference. Substitute-on-failure dispatch keeps producing tokens when half the mesh goes dark.

Proposed: Distributed mixture-of-experts inference with zero-vector substitution for missing expert outputs.

This explicitly omits the quantitative loss claim until scoped evidence is approved; the detailed page should carry the demonstration conditions.

**J4 · systems.hawkstack.summary :104 · EDIT, evidence F6.**

Original: Compute-aware neural architecture topology theory + perception backbone family.

Proposed: A topology-based method for choosing neural architectures, with a family of perception models.

Keep the parameter/domain discrepancy visible in F6; never silently change 1.77M to a sub-million number.

**J5 · systems.navigator.summary :129 · EDIT, evidence F7.**

Original: Agent Factory + 9 production agents + adaptive subsystems.

Proposed: An internal pipeline for producing agents, with nine production agents and adaptive subsystems.

“Production” remains a held source claim, not newly verified readiness.

**KEEP/HOLD by entry:** Auspex's summary names scope-as-code, the Active Directory validation and HMAC replay (F1/F7). Signet's model-proposes/Signet-authorizes contrast names different responsibilities and can stay. Alchemist's local model and mandatory five gates are useful detail. Meridian's Rust/flight-control distinction can stay (F5). Canopy's sensor list carries five distinct inputs; expand RID to Remote ID for new readers if approved, without changing modality count. Preserve the two Apache-2.0 release identities.

Portfolio, company, hero metrics and homepage counters: retain source values for review, flag F2/F4/F5/F7 rather than inventing replacements. In particular “engineering systems shipped,” “months solo,” and “NIST 800-53 controls” need scope/date/status labels after owner confirmation. Unused data is not automatically public copy; check consumers before applying.

## Verification record

The comparison corpus is the text after every `Original:` and `Proposed:` label above. Cross-referenced repeated passages are counted at their primary pair only in this corpus. Notes, source paths, diagnosis tables, code identifiers outside prose, and factual questions are excluded. This is a review-excerpt rescan, not a claim that the unchanged live site is clean.

Reproduction procedure: read each Markdown file from the ZIP as text only; collect regex lines from the unlabelled fenced blocks in catalog sections 1–4; pass them as `-e` arguments to `grep -Ein` against newline-separated proposal blocks. Use the same procedure on original blocks. Check section 5's dash density and emphasis patterns separately. Review section 6's sentence-length/shape candidates within each paragraph, not across unrelated buttons or headings. Section 7 and `voices.md` require human register judgment.

### Recorded passes

| Check | Original excerpt corpus | Final proposed excerpt corpus |
|---|---:|---:|
| Bounded blocks | 84 | 84 |
| Whitespace-separated words | 1,232 | 1,059 |
| Section 1 negative-parallelism matching blocks | 0 | 0 |
| Section 2 puffery matching blocks | 3 | 0 |
| Section 3 hedging matching blocks | 0 | 0 |
| Section 4 range/triplet matching blocks | 4 | 0 |
| Em-dash characters | 17 | 0 |

Verification pass 1: all four lexical categories returned zero proposal matches. Cadence measurement flagged five proposal blocks (six overlapping three-sentence windows). Revised the metadata, Canopy, screenshot comparison, evaluator UI and research-report paragraphs to remove repeated sentence patterns while preserving their qualifications.

Verification pass 2: all four lexical categories again returned zero proposal matches. Zero three-sentence windows had lengths spanning eight words or fewer (a conservative interpretation of the catalog's ±4-word rule). Section 5's emphasis, term-definition bullet, punchy em-dash and PCRE emoji-header patterns also returned zero matches in proposals. No proposal uses two em dashes in a sentence. All scans ran successfully; grep exit 1 means no matches, not a failed scan.

Cadence/register read-through: checked sentences within each replacement and their retained context. Short labels and two-sentence factual descriptions remain short; they are not padded to create artificial variance. The Canopy sentence retains its Phase 0 limitations and intended replacement goal; its length reflects those distinct qualifications. No uniform intro/three-points/conclusion structure was introduced. Product pages remain technical, founder pages retain first person, and calls to action name a next step. This was a silent read-through for spoken cadence, not an audio/user test.

Independent read-only verification compared the original excerpts and all eleven hashes with source, finding no materially inaccurate quotation or hash drift at that check. A potential portfolio-wide generalization in H5 was narrowed to name RigRun and Mycelium. No invented evidence was found. All substantive removals/narrowings remain expressly held for approval.

Minimal reproducible lexical scan (run from repository root; reads the ZIP without executing its contents):

```python
import pathlib, re, subprocess, zipfile

doc = pathlib.Path("docs/site-copy-review.md").read_text()
with zipfile.ZipFile(
    "attached_assets/juliusbrussee-skills-fuck-slop_1789512397816.zip"
) as archive:
    catalog = archive.read("references/tells.md").decode()

sections = re.split(r"^## ", catalog, flags=re.M)[1:5]
for kind in ("Original", "Proposed"):
    blocks = re.findall(r"^" + kind + r": (.*)$", doc, re.M)
    corpus = "\n".join(blocks) + "\n"
    print(kind, len(blocks), "blocks", len(corpus.split()), "words")
    for number, section in enumerate(sections, 1):
        patterns = [
            pattern
            for fence in re.findall(r"```\n(.*?)```", section, re.S)
            for pattern in fence.strip().splitlines()
        ]
        command = ["grep", "-Ein"]
        for pattern in patterns:
            command += ["-e", pattern]
        result = subprocess.run(
            command, input=corpus, text=True, capture_output=True
        )
        assert result.returncode in (0, 1), result.stderr
        print(number, len(result.stdout.splitlines()), result.stdout)
```

Document-only scope check: the delivery adds `docs/site-copy-review.md`; it does not apply proposals or modify source/data. Application builds and visual/browser tests do not validate an unapplied editorial review and were not used as evidence of copy accuracy.

### Intentional exceptions and register decisions

- Useful negation stays when it establishes a limit: no resume needed, no module validation, not peer-reviewed, classifiers remain stubs, internal/not for sale, and no Python/CGO. None is a rhetorical claim of superiority.
- Three technical stages, platform names or sensing methods are distinct information. They are not removed merely to satisfy a triplet detector. Auspex's original authorization sequence is explicitly offered as an acceptable keep.
- The Canopy price range is numeric. The hardware capacity bands are also real ranges, pending evidence about their boundaries.
- Technical terms remain when they specify behavior: MoE, dense MLP, canonical JSON, HMAC, mTLS, RFC 3161, PID, Holt, UCB1, epsilon-greedy, PAVA and Dempster-Shafer. Expand at first use where the proposed copy supplies it; do not replace these with general claims of intelligence or security.
- Headings, tables and cards are appropriate to a navigable technical site. The review document uses more headings for source mapping; that formatting is not proposed page prose. Mycelium's replacement body paragraphs require no scattered bold or italic emphasis. Arrow glyphs are navigation cues, not emoji decoration.
- Preserve first person on About/cofounder, second person in invitations and neutral technical descriptions on system/research pages. No invented anecdotes, forced slang, typos, evidence, dates or performance claims.
- Read-through checks focus on whether the founder could say the sentence to an evaluator. “Zero-vector substitution” stays because it answers a mechanism question. “Substrate ready” and “conversations compound” do not.

## Change summary and decisions still needed

The proposals replace stock link labels, abstract headings, repeated readiness contrasts and anthropomorphic demonstration language with named mechanisms or concrete destinations. They preserve implementation distinctions, genuine limitations and the founder's direct voice.

Highest-priority owner decisions: F1 readiness/export claims; F3 simulated versus physical Mycelium evidence; F4 control-mapping scope; F5/F6 release and HawkStack inconsistencies; F2 availability dates. The remaining questions cover evidence provenance, novelty, research status, credentials, procurement, privacy and compatibility. No held replacement should be applied simply because it reads more clearly.

After approval, apply the selected proposals in a separate change and rescan the complete rendered prose, including metadata and shared components. Reconcile contact/privacy suggestions with its authoritative work rather than applying this snapshot over it.

## Approved EDIT application — September 15, 2026

Owner selection: “Approve all EDIT proposals; leave HOLD proposals unchanged.” Evidence-qualified EDITs retain the original factual assertions and qualifications; applying them does not resolve their evidence holds.

Applied after matching originals against current source:

- H3/H4; S2/S4/S6/S9/S11 and S12's destination label. D3's references to S2/S6/S9 were applied consistently on Defense; D4's destination label only.
- A1/A2/A4; M3's chat-endpoint title only; M4/M5; M10's hardware-detection title and simulated-evaluator description; all M11 replacements, including its operator-interface detail, implementation-status heading, introduction and contact paragraph.
- C1/C2/C3; N1; SH1/SH2; J1/J4/J5. CT1 was initially matched, but omitted at merge because the authoritative contact work had replaced its original. Data keys, values other than these approved summaries, and technical identifiers were retained.

Mixed-unit exclusions: S12's engagement alternative; D4's program-relevance, founder-posture and closing CTA narrowings; M3's universal-compatibility body; M10's universal-laptop heading. These mixed EDIT/HOLD units require substantive approval beyond EDIT wording. M11 is classified EDIT, so the owner's EDIT approval includes replacing the five-minute promise with its quickstart reference. All other HOLD and KEEP blocks remain untouched.

Contact and Privacy retain the authoritative contact/privacy work. BaseLayout metadata, Footer, MomentumStrip and Research received no replacements because their proposals are held or retained. AudienceIntake retains the newer direct-contract date and email-draft/no-booking instructions alongside the approved inquiry-type sentence. Navigation, accessibility behavior, link destinations, analytics identifiers, commands and release/benchmark values were not changed.

### Application verification

After applying the remaining M11 operator-interface EDIT, the production build and whitespace check passed again. The rebuilt Mycelium HTML contains the exact approved quickstart wording and no five-minute installation claim. Its rendered prose and description/social metadata returned zero matches in each of catalog sections 1–4.

Final post-merge correction restored C3's complete near-qualified-applicant exception sentence immediately after the approved two-sentence replacement. A fresh production build and whitespace check passed. A new scan parsed all ten built HTML pages, excluding scripts/styles and including description/social metadata: 7,391 words, 42 em dashes. Catalog sections 1–3 again had zero matches; section 4 had eleven matches (the previous six plus five concrete lists in the authoritative updated privacy notice). Those privacy lists describe processing details and unresolved operating questions and were retained. The scan asserts the restored exception appears in rendered output. This static-render extraction differs from the earlier browser corpus and its counts are not directly comparable.

The rendered corpus and mobile observations below were captured before merging the concurrent functional changes. After conflict reconciliation, the production build passed again and the workflow restarted cleanly. The development domain then served the page (the earlier host rejection was resolved by incoming configuration), but live smoke traversal still stopped on a Vite dependency HTTP 504. CT1 was omitted and SH1 was combined with the newer contact instructions as recorded above; the earlier scan counts are not represented as a post-merge whole-site audit.

- Production build passed; all four smoke-check fixture tests passed; `git diff --check` passed.
- Chromium reviewed all ten public routes at a requested mobile width of 375px, including rendered body prose, metadata, shared components and data-backed descriptions. Each route rendered its expected title and heading. Edited destination labels were present with their original links; no visible “Deep dive” label remained. A desktop Mycelium screenshot also confirmed the page rendered.
- The full rendered scan corpus contained 7,468 whitespace-separated words, including repeated route-level shared text and metadata. Catalog sections 1–3 each returned zero matches. Section 4 returned six: two genuine hardware price ranges and four distinct technical-information lists, retained after manual review. Zero matches do not validate held claims.
- Body-only prose contained 39 em dashes across 5,855 words (approximately one per 150 words). Cadence review found varied paragraph lengths; uniform short runs were predominantly labels/card fragments. Founder parentheticals and meaningful technical distinctions remain. No emoji/header-style issue was identified. Held rhetorical claims remain intentionally unchanged.
- Edited prose and link labels wrapped in the mobile review. Existing ticker, diagram and comparison-table content has separate clipping/scrolling behavior. The captured Defense and Systems document widths were 417px and 380px respectively against a 375px client width, while screenshots remained 375px wide. This is recorded as an unresolved mobile-width observation, not a clean whole-site overflow result; mobile polish remains separate.
- Browser review recorded no runtime exceptions, but did encounter stale Vite dependency responses. Live smoke verification was not clean: the development-domain request returned a host-allowlist 403; a standalone smoke server was refused because the managed Astro server was already running; local smoke traversal stopped on `Outdated Optimize Dep`. These are preview/test-environment limitations, not passing route/script checks. No unrelated configuration changes were made.