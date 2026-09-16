---
name: Disclosure fallback checks
description: Avoid false confidence in no-JavaScript disclosure tests.
---

Test native disclosure visibility with scripts disabled and normal motion preferences, including ancestor opacity.

**Why:** Reduced-motion overrides can make reveal-animated wrappers visible and hide a genuine no-JavaScript failure. Successful native toggling alone does not mean users can see the control.

**How to apply:** Check actual visibility and keyboard/touch toggling for every new disclosure without scripts; keep fallback-critical controls independent of reveal animation.