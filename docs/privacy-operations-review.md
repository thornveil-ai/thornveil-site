# Privacy operations review

Reviewed September 15, 2026. This is an evidence record and proposed next steps,
not an adopted retention policy or legal opinion.

## Owner-confirmed facts

- The owner personally operates Thornveil in Florida, describes it as registered
  in Florida, and targets a US audience. The subsequent response identifies
  Thornveil LLC, a Florida limited liability company, based on the Workspace
  organization name. The exact registered identity still needs independent
  confirmation; a Workspace name is not registration evidence.
- Google Workspace provides the contact mailbox. Only the owner has mailbox access.
- The owner has not set up a Plausible account.
- The owner does not know the provider settings or retention practices and wants
  to establish a policy. Netlify was initially tentative; the later account
  findings below identify it as the live host.


## Owner-reported live verification — September 15, 2026

Source: the owner's written report of live-account and network checks. No
screenshots, exports, or authorized dashboard access were supplied to this
reviewer. These findings are attributed, not independently audited.

The owner subsequently confirmed that no screenshots, exports or provider support
responses are available. Vault failed with a session/account-switch error on both
attempts; forwarding, OAuth grants and delegation/admin-role details remain
blocked by access or reauthentication. The owner now reports that no Plausible
account exists for this site. That statement is recorded as an owner report, not
independent confirmation of account absence or of how the provider handles event
requests. No accounts were created or settings changed during these attempts.
The original live-provider verification remains incomplete; the notice must stay
provisional while these evidence gaps remain.


## Approved review scope

The owner explicitly approved limiting this review to the available evidence
record and provisional notice, deferring the remaining live-provider verification.
Completion of this limited review does not finalize the notice or verify actual
retention and access settings. The unresolved evidence checklist below remains
the handoff for future verification when account access or supporting evidence
becomes available. This approval does not authorize analytics changes, account
settings changes, or deployment.

## Subsequent owner response — evidence limits

- The response describes a single-owner AI infrastructure business serving a
  US-wide audience, including positioning for restricted/offline environments.
  Website positioning is not proof of actual customer deployments or data handling.
- The response reports no knowing collection of children's, health, financial
  or biometric data based on site content and forms. This does not establish
  what arrives in unsolicited email or what separate products process.
- It reports no personal-data sale/sharing, targeted advertising or affiliates.
  “No sharing” must not be used as a blanket public claim: Workspace and other
  service providers process data, and statutory sale/sharing definitions need review.
- Revenue and annual numbers of people whose data is processed remain unknown.
  A reported few hundred Netlify requests per week is not a count of people,
  proof of legal thresholds, or independent verification of the live host.
- No legal or retention advice has been obtained. Applicable requirements need
  qualified review; no coverage or exemption determination has been made.
- The owner approved developing the proposal for review only, not adoption or
  deletion. See [the draft schedule and procedure](privacy-retention-request-draft.md).

## Documentation checked

- [Netlify Log Drains](https://docs.netlify.com/manage/monitoring/log-drains/):
  sends traffic, function, edge-function, deploy and WAF logs to external services
  for processing and persistence. Disconnecting a drain does not delete copies
  already saved by the receiving service. Absence of a drain does not establish
  Netlify's internal retention or exclude other copies.
- [Netlify privacy statement, section 7](https://www.netlify.com/privacy/):
  retention depends on collection purpose and legal obligations; this is not a
  fixed site-log retention schedule. Obtain applicable periods from the account
  documentation or Netlify support before stating them in the notice.
- [Google Vault licensing](https://support.google.com/vault/answer/6051467?hl=en):
  Business Plus includes Vault licenses. Entitlement is not proof that a
  particular rule or hold exists.

- [Google Vault: retain Gmail messages](https://support.google.com/vault/answer/2535539?hl=en):
  retention rules and holds can prevent permanent deletion. This documents
  provider capabilities, not this mailbox's license, settings, or retention.
- [Plausible data policy](https://plausible.io/data-policy):
  describes aggregated measurement, daily identifiers, and EU processing.
  It describes account/site deletion without undue delay and unrecoverable
  deletion, but does not establish this site's retention period. It cannot prove
  an active account for this site, event ingestion or access to its reports.
- [Florida statute 501.702](https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String&URL=0500-0599%2F0501%2FSections%2F0501.702.html):
  the Digital Bill of Rights controller definition includes revenue and business
  activity criteria, plus controlled/controlling entities. Florida location alone
  does not establish coverage or exemption.
- [California Attorney General CCPA guidance](https://www.oag.ca.gov/privacy/ccpa):
  coverage depends on doing business in California and statutory thresholds.
  US-only targeting does not by itself exclude other states' laws.
  This is not an exhaustive US privacy-law analysis.

## Unresolved evidence needed before finalizing the notice

1. Netlify hosting/CDN and the domain are now supported by the owner's live
   findings. Still obtain enabled logging, actual provider retention/deletion,
   historical/manual exports and any additional services or access mechanisms.
2. Determine whether anyone else established analytics for the domain. Confirm
   collection, account ownership, report sharing, exports and deletion controls.
   Do not change or remove the existing script without authorization.
3. Business Plus Vault entitlement is established by the reported subscription
   and provider documentation. Still check administrative/delegated access,
   forwarding, connected tools, Vault rules and holds, backup services and
   current deletion settings after the owner resolves the sign-in issue.
4. Confirm the public legal operator identity, relevant business activities,
   audience categories, data volume and applicable statutory thresholds with
   qualified legal advice as needed. Do not claim a general legal exemption.

## Proposed policy design — not yet approved or implemented

- Separate ordinary inquiries from contractual, accounting, security and
  dispute-related records. Choose justified retention periods for each only
  after business and legal requirements are established.
- Identify the owner responsible for periodic review and deletion, including
  exports and backups. Explain provider deletion delays and legal holds rather
  than promising immediate erasure.
- For analytics and logs, inventory what actually exists before choosing
  retention. Record provider limits and separately retained exports.
- Route privacy requests through the unchanged contact address in the notice.
  Proposed process: owner receives and records the request, checks identity
  proportionately without routinely collecting identification documents,
  identifies applicable rights and deadlines, searches relevant systems,
  documents any lawful exception, and communicates the result securely.
  This process still needs owner approval and legal review where appropriate.
- Do not enable automatic purging until the owner approves its scope and
  understands that it can permanently delete records.

No account settings, analytics behavior, contact addresses or deployments were
changed as part of this review. The public notice remains explicitly provisional.

## Reported settings and limits

| System | Reported observation | What remains unverified |
| --- | --- | --- |
| Hosting/CDN | Netlify response headers and Edge cache; the Netlify project deploys from GitHub with Astro. The primary domain is thornveil.ai, Netlify DNS manages DNS, and www redirects to the primary domain. | Any additional proxy or service outside the inspected project; actual operational log categories and retention/deletion periods. |
| Hosting access and exports | One team member, the owner, with access to all projects. No Log Drains connected. | Other access mechanisms, historical/manual exports and separately retained copies. No Log Drains means no export through that feature, not no logging or no other exports. |
| Workspace | Active Business Plus subscription with one assigned license and one directory user. | A one-user directory does not independently establish absence of delegation, forwarding, third-party OAuth access, or backup services. The earlier owner statement about sole mailbox access remains an attestation. |
| Vault and deletion | Business Plus includes Vault; no separate subscription line item was seen. | Default/custom retention rules, scope, holds, deletion settings and backups. Vault access failed with a session/account-switch error; no settings were verified or changed. |
| Forwarding and connected apps | Checks stopped when reauthentication was required. | Gmail/admin routing and forwarding, OAuth grants, app access and retained copies. |
| Plausible | A live request loaded https://plausible.io/js/script.js. No account was logged in or created. | Event submission, ingestion and stored reports; account owner, report access/sharing, exports, retention and deletion controls. Loading JavaScript alone is not proof that analytics are recorded. |

No actual retention period has been established for this site's logs, email or
analytics. Provider capabilities and general policies below must not be substituted
for the missing account evidence. The Workspace display name is not evidence of
registered legal entity type.
