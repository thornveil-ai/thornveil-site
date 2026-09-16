# Retention and privacy-request procedure — review draft

Status: development for review authorized; policy adoption, legal review and
deletion authorization outstanding. No effective date. Not a legal opinion.

Evidence and unresolved provider checks are recorded in
[privacy-operations-review.md](privacy-operations-review.md). The public notice
at `src/pages/privacy.astro` remains provisional and unchanged by this draft.
This document covers website/contact operations, not unverified product,
customer-environment or classified-data practices.

## Proposed retention schedule

These are proposed business limits, not statutory requirements or verified
provider capabilities. The owner is the proposed responsible reviewer.

| Category | Proposed period and trigger | Purpose and limits |
| --- | --- | --- |
| Ordinary inquiries not becoming a business relationship | 12 months after last substantive exchange | Allows follow-up; automated messages do not restart the clock. |
| Essential contract records | 7 years after contract termination/closure | Supports contractual claims; counsel must confirm the appropriate period. Keep only material correspondence, not every attachment. |
| Essential accounting/tax records | 7 years after the relevant financial year ends | Proposed accounting evidence window, subject to accountant/legal advice and exceptions for records requiring longer retention. |
| Aggregate website analytics, only if collection is verified | Rolling 13 months from collection/report period end | Supports year-over-year comparisons. Confirm whether the service permits this; exported reports follow the same limit. Do not assume identifiers are anonymous. |
| Routine access/error logs | 30 days from event | Supports troubleshooting with limited exposure. Minimize query strings, message bodies and identifiers. |
| Security logs | 90 days from event | Allows delayed incident detection. Document which logs qualify rather than retaining all logs as security records. |
| Selected incident/dispute evidence | Review every 90 days while open; proposed 12 months after closure absent a longer documented requirement | Preserve only evidence needed for investigation or claims. Counsel determines any longer hold; not a justification for retaining entire log archives. |
| Minimal privacy-request case record | 24 months after closure | Records receipt, action and basis for decisions, subject to applicable recordkeeping law. Do not retain a duplicate of the full disclosure package. |
| Additional verification material | Delete within 30 days of verification or case closure if genuinely required until then | Prefer not collecting documents at all. Keep the verification result rather than copies of identity evidence, except where a documented obligation requires otherwise. |

If an inquiry becomes a contract, reclassify only necessary business evidence.
Use the longest *documented applicable* requirement for a record in multiple
categories, not indefinite retention of an entire mailbox.

### Backups, provider delays and legal holds

- Proposed maximum expiry for owner-controlled backup copies: 90 days after
  backup creation. Confirm feasibility, recovery needs and coverage before adoption.
  No new backup is authorized by this draft.
- Inventory mailbox trash, Vault, forwarding, local downloads, exports, devices,
  backup services and provider logs. Record actual provider-controlled retention
  and deletion delays separately; never promise that provider copies follow the
  owner-controlled target unless verified.
- Where immediate selective backup deletion is not possible, document restrictions
  on use and the expiry date. Following restoration, reapply completed deletions
  before ordinary use. Do not describe an inaccessible copy as already erased.
- A legal/preservation hold suspends deletion only for relevant records. Record
  its basis, scope, custodian, review date and release authority without exposing
  privileged content in this repository. Review every 90 days and with counsel
  before release. Once released, delete records already past their normal period.
- Proposed monthly review: identify due records, check holds and exceptions,
  review a non-destructive candidate list, then obtain explicit authorization
  before any deletion. Keep a minimal action record, not copies of deleted data.

## Proposed privacy-request process

1. **Intake:** retain the existing contact, `jesse@thornveil.ai`. Accept plain-language
   requests without requiring a special subject line. Owner monitors the mailbox
   each business day. Record receipt date, requested action, scope and a case
   reference in a restricted register outside the repository.
2. **Triage and deadlines:** proposed internal targets are acknowledgment within
   five business days and resolution within 30 calendar days. These are not
   adopted promises or legal deadlines. Promptly determine applicable law,
   request type, receipt-based due date, authorized-agent rules and any shorter
   acknowledgment deadline. Track appeals separately. Do not pause or restart
   statutory clocks for clarification unless the applicable law permits it.
3. **Identity:** for a low-risk inquiry, reply to the originating address.
   For access, correction or deletion, assess account/email control and existing
   information proportionately to disclosure/deletion risk. Email control alone
   does not prove entitlement to every record. Verify agent authority separately.
   Do not routinely request government ID, passwords or sensitive data. If
   verification fails, explain safe alternatives without disclosing records.
4. **Scope and search:** clarify only when necessary. Search verified systems,
   including mailbox, relevant exports, logs and processors; document systems
   checked. Separate another person's information and privileged or protected
   records. Do not claim to locate an individual in aggregate analytics if the
   service cannot do so, or collect new identifiers merely to enable lookup.
5. **Decision/action:** determine available access, correction, deletion and
   opt-out rights and any exception under applicable law. Obtain owner approval
   for destructive actions and check holds before execution. Processor requests
   must be tracked through confirmation; sending one is not proof of deletion.
   Avoid discrimination or unnecessary barriers to exercising applicable rights.
6. **Response:** use the existing email thread for non-sensitive status updates.
   For sensitive disclosure, establish an appropriate secure delivery method
   before sending; no secure portal is assumed to exist. Describe completed
   actions, scope, retained categories and lawful reasons, backup limitations,
   and any applicable appeal or complaint route. Do not assert completion for
   systems not checked. Record the response date and outcome.
7. **Extensions, refusals and appeals:** legal review must establish whether an
   extension is allowed, its maximum length and required notice timing. Notify
   before the original deadline when required; workload alone does not grant
   an extension. Explain refusals and applicable appeal rights. The owner handles
   appeals with qualified advice when appropriate; do not promise independent
   staff review for this single-owner operation.

### Response outlines — internal only

- Acknowledgment: confirm receipt date and understood scope; state any necessary
  clarification or proportionate verification step. Give a response date only
  after checking the applicable deadline.
- Completion: identify action taken and systems/categories covered, exclusions
  and their lawful basis, and any verified backup expiry limitations. Include
  applicable appeal instructions and deadline.
- Extension/refusal: give the permitted reason, revised date where lawful, and
  applicable review/appeal route. Do not invent an exemption or statutory citation.

## Approval and evidence gates

All items below remain pending unless separately evidenced:

- Confirm exact registered operator through an authoritative registration record,
  and approve its public presentation.
- Obtain owner revenue and annual personal-data volume ranges; verify business,
  audience and sale/sharing facts beyond site copy. Limited traffic and Florida
  location do not determine legal coverage.
- Obtain qualified assessment of applicable state, federal, sector, contractual
  and tax obligations. Produce an operational deadline matrix: applicable law,
  rights, verification rules, acknowledgment/response periods, extensions,
  appeals, exceptions and request-record retention. Do not label generic internal
  targets as legal deadlines.
- Complete the existing live-provider verification work before asserting actual
  analytics, logging, backup, Vault or deletion practices.
- Owner explicitly approves each category, period, trigger, backup limitation,
  hold procedure and request workflow after reviewing the evidence. The current
  approval is only to develop this draft.
- Separately approve any destructive setting/action after reviewing exact
  systems, affected records, exceptions and permanence. Policy adoption alone
  is not permission to purge.
- Verify the approved procedure with a synthetic request and non-destructive
  retention review. Store no real request data or sensitive evidence here.
- Only then reconcile the public notice with verified practices. Publishing
  requires separate authorization; this draft authorizes no deployment.