---
name: Reveal enhancement safety
description: Keep content readable independently of observer and animation lifecycles.
---

Reveal effects must never put not-yet-observed content into a hidden waiting state. Prefer finite movement-only animations triggered on intersection, with a readable static base.

**Why:** Observer availability does not guarantee delivery: module failures, very tall targets, navigation cancellation, or stalled callbacks can strand hidden content. Movement-only animation also preserves readability if animation execution stalls.

**How to apply:** Future reveal changes should preserve visibility before initialization, during delays, after cancellation, and on restored navigation entries. Do not restore opacity-zero defaults or use backwards fill to conceal pending content.