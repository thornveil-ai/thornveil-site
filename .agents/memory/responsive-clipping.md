---
name: Responsive clipping checks
description: Avoid false confidence and false positives in narrow-screen text checks.
---
Check visible heading text ranges as well as document scroll width.

**Why:** Overflow containment can keep the document width correct while long heading words are visibly cut off. Conversely, intentionally clipped screen-reader-only headings have text ranges outside their tiny containers and must not be treated as visible overflow.

**How to apply:** Inspect screenshots and DOM Range client rectangles for visible headings at narrow viewport widths. Exclude screen-reader-only content. Require local scrolling only when content actually exceeds the container; a wider viewport may fit the same command without needing to scroll.