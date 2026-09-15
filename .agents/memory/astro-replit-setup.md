---
name: Astro Replit setup
description: Package-firewall and runtime constraints encountered when bringing imported Astro sites into Replit.
---

Imported frontend projects may reference package versions that Replit’s security firewall blocks. Do not bypass the firewall; use an approved compatible release and align the runtime with the selected release and its integrations.

**Why:** Security-approved dependency versions can have newer runtime and peer-integration requirements than the imported lockfile.

**How to apply:** When setup fails at package installation, check the firewall result and peer engine requirements before changing application structure or forcing package resolution.