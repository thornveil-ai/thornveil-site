# Physical-device verification — owner checklist

## Evidence status

No physical device is attached to this environment. **Every row below is
UNVERIFIED.** Linux Chromium emulation and Linux WebKit (if available later)
are not iOS Safari or Android Chrome evidence. No OS, browser, assistive
technology version, or native handoff result is inferred.

Owner decision, recorded 2026-09-16: **“Leave device checks unverified for a
later retest.”** No device observations were provided. Physical verification
is explicitly deferred at the owner's request; this is not a pass or release
approval.

For the later retest, run this checklist on an iPhone in Safari and
an Android phone in Chrome. Return only observed results; “not tested” is valid.
Do not send any draft email. Screenshots should exclude personal information.

| Device | Model | OS version | Browser version | Test date / URL / commit | Result |
| --- | --- | --- | --- | --- | --- |
| Physical iPhone, Safari | Not provided | Not provided | Not provided | Not observed | UNVERIFIED |
| Physical Android, Chrome | Not provided | Not provided | Not provided | Not observed | UNVERIFIED |

For each device, record PASS / FAIL / NOT TESTED for each row:

| Journey | Expected behavior | iOS Safari | Android Chrome |
| --- | --- | --- | --- |
| Navigation and Back | Home → Systems → Research → About → Contact; Back returns to previous page with usable controls. Also open Defense, Mycelium, Co-founder and Privacy. | UNVERIFIED | UNVERIFIED |
| Portrait menu | Toggle announces and displays open/closed state; each link opens the right page; closed links are not focusable. | UNVERIFIED | UNVERIFIED |
| Short landscape | Rotate with menu open; scroll menu to Contact; all five links remain readable and tappable without being covered by browser chrome. Close/reopen and navigate. | UNVERIFIED | UNVERIFIED |
| Disclosures | Home: open/close each audience (3), founder (1), and shipping (5) disclosure; text and links remain readable after rotation and Back. | UNVERIFIED | UNVERIFIED |
| PDF open | Research: open each of five PDFs; actual viewer displays legible pages; pinch/scroll, return to Research without losing navigation. Note viewer/app name. | UNVERIFIED | UNVERIFIED |
| PDF save | Save each PDF, find it in Files/Downloads and reopen it; record actual filenames, viewer and any prompts. | UNVERIFIED | UNVERIFIED |
| Email handoff | Federal and prime links open a draft in configured mail app with intended recipient and respective “Federal evaluation inquiry” / “Prime / SI integration inquiry” subject. Footer has recipient and no preset subject. Cancel, do not send. Note app/version. | UNVERIFIED | UNVERIFIED |
| Co-founder action | Home co-founder action reaches `/cofounder`, not a mail draft. | UNVERIFIED | UNVERIFIED |
| Zoom | Use native page zoom to 200% where available, and pinch zoom; verify menus, disclosures and research actions stay usable. Separately try OS/browser enlarged text and record exact setting. | UNVERIFIED | UNVERIFIED |
| Screen reader | With VoiceOver / TalkBack enabled, traverse headings, landmarks, menu, disclosures, PDF/email links. Confirm meaningful names, expanded states, logical order and no focus traps. Record screen-reader version/settings and spoken failures. | UNVERIFIED | UNVERIFIED |
| Keyboard, if available | Tab to skip link, activate it; traverse menu links; Escape closes menu and returns focus to toggle. Note external keyboard and Safari keyboard settings; otherwise NOT TESTED. | UNVERIFIED | UNVERIFIED |
| Error recovery | Open a nonexistent path; activate Return to home; verify useful content and navigation. | UNVERIFIED | UNVERIFIED |

## Return format

```text
Date / tested URL / build or commit:
Device model / OS version / browser version:
Screen reader and version/settings (or not tested):
Mail app / PDF viewer and versions (or not tested):
Journey row: PASS / FAIL / NOT TESTED
Failure: exact steps, expected vs actual, orientation, zoom/text setting
Evidence: screenshot or short recording, with private information removed
```

## Defect severity and ownership

- **High:** navigation or essential content inaccessible; focus trap; native
  PDF/email action consistently unusable.
- **Medium:** a control, orientation, or zoom mode fails but a practical
  alternative remains.
- **Low:** visual issue without loss of readability or operation.
- Mark a dependency/tooling problem **BLOCKED**, not an application defect.
- Check existing reveal-visibility, observer cleanup, dependency readability,
  preview-smoke and graphics owners before assigning a fix. Record “covered by
  existing owner” only when the same reproduction matches their scope.

## Post-merge retest

1. Record the merged commit and exact URL. Do not treat the development URL as
   proof of published-host behavior.
2. Reload without an old cached page, then repeat all rows on both phones.
3. Repeat any failed row after its owner’s fix; keep the original evidence and
   add a dated retest rather than replacing an earlier failure with an assumption.
4. Run `node scripts/site-qa-browser-engines.mjs` after the browser-setup owner
   makes Firefox/WebKit available. Keep automated results separate from this
   physical-device table.
5. A release decision must explicitly accept or resolve remaining UNVERIFIED
   rows; this checklist is not an accessibility certification.