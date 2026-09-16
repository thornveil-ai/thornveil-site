---
name: Responsive clipping checks
description: Avoid false confidence and false positives in narrow-screen text checks.
---
Check visible heading text ranges as well as document scroll width.

**Why:** Overflow containment can keep the document width correct while long heading words are visibly cut off. Conversely, intentionally clipped screen-reader-only headings have text ranges outside their tiny containers and must not be treated as visible overflow.

**How to apply:** Inspect screenshots and DOM Range client rectangles for visible headings at narrow viewport widths. Exclude screen-reader-only content. Require local scrolling only when content actually exceeds the container; a wider viewport may fit the same command without needing to scroll.

Visibility audits must distinguish intentionally unrendered responsive branches and closed disclosures from rendered content hidden by opacity.

**Why:** Counting desktop-only headings on phones produces false no-JavaScript failures, while filtering out all invisible headings conceals real reveal-animation failures.

**How to apply:** Exclude display-none ancestors and closed disclosure bodies before checking opacity. Traverse long pages with instant scrolling and time for intersection observers, rather than assuming a rapid smooth-scroll sweep visited every section.

Do not treat absent horizontal overflow as proof of readable mobile cards.

**Why:** A flex child beside a nonshrinking badge can collapse to a near-single-character column without overflowing horizontally. The resulting very tall section can also prevent percentage-based reveal thresholds from being reached, especially during font reflow.

**How to apply:** Inspect text-column width and section height in narrow screenshots. Prefer stacked badge/content layouts on phones and avoid revealing an entire long list as one observer target.