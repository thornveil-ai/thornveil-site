---
name: Astro Replit setup
description: Package-firewall and runtime constraints encountered when bringing imported Astro sites into Replit.
---

Imported frontend projects may reference package versions that Replit’s security firewall blocks. Do not bypass the firewall; use an approved compatible release and align the runtime with the selected release and its integrations.

**Why:** Security-approved dependency versions can have newer runtime and peer-integration requirements than the imported lockfile.

**How to apply:** When setup fails at package installation, check the firewall result and peer engine requirements before changing application structure or forcing package resolution.

Keep Tailwind 3 on PostCSS when aligning Astro integrations rather than reintroducing the legacy Tailwind integration or migrating styling as part of dependency maintenance.

**Why:** The official Tailwind integration's latest release declares compatibility only through Astro 5. PostCSS preserves the existing site's styling without that incompatible peer dependency.

**How to apply:** Recheck official package metadata before adding an Astro Tailwind integration; keep any Tailwind major-version migration separately scoped.