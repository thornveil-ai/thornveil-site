---
name: Astro component scripts in development
description: Build success does not guarantee inline component TypeScript works in the dev transform pipeline.
---

Check an Astro component's browser script through the running dev server as well as the production build. Prefer plain JavaScript for small inline component scripts until the development transform pipeline supports TypeScript consistently.

**Why:** This project's Astro/Vite combination built a typed class field successfully for production but rejected the same field as JavaScript during development, returning a 500 for the component script.

**How to apply:** When adding TypeScript-only syntax inside an Astro script, verify its actual development module response rather than relying on build success.

Direct Chromium debugging-protocol tests need focus emulation and complete native key payloads.

**Why:** Headless Chromium can set document.activeElement without firing focus handlers when the page lacks browser focus. Enter's default button activation also needs its carriage-return text payload.

**How to apply:** Enable focus emulation before testing keyboard events; distinguish browser harness setup from application interaction failures.