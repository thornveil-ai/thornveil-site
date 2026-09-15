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

Scope development host allowances to the workspace's Replit hostname, rather than allowing every host.

**Why:** Unrestricted host acceptance on a network-exposed Vite server removes DNS-rebinding protection. A successful preview does not justify disabling that protection.

**How to apply:** Use the exact development hostname provided by Replit, preserve defaults outside Replit, and verify both proxy access and rejection of an unrelated Host header.