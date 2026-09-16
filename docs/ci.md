# Pull-request build and smoke checks

`.github/workflows/build-smoke.yml` runs on every pull request (no branch or
path filters). It can also be run manually after it reaches the default branch.
The separate label-sync workflow is unchanged.

## What runs

On a fresh Ubuntu runner with Node **22.22.0** (Astro requires at least 22.12.0):

1. A runner-only step maps the lockfile's Replit-internal tarball URL prefix to
   the public npm registry. It preserves every version and integrity hash, fails
   on missing hashes or unrecognized internal URLs, and never commits the
   resulting file. The repository's package and lock files remain unchanged.
2. `npm ci --registry=https://registry.npmjs.org` installs those locked packages.
3. `npm run build` builds the static site.
4. `npm run test:smoke` exercises the smoke checker's fixture tests.
5. `npm run check:smoke` starts its own isolated development server on port
   5055 and checks public routes, the missing-page response, and local browser
   modules using the existing script interface.

Only npm's download cache is restored, not `node_modules`, `dist`, or Vite's
optimized modules. No credentials, environment secrets, browser installation,
deployment, or externally running server are needed. Checkout credentials are
not persisted and the workflow token only has read access to repository contents.
Fork pull requests may need an owner's approval before GitHub runs them.
CI sets `NO_COLOR=1` and `FORCE_COLOR=0` for plain-text diagnostic output.
This also keeps ANSI styling from disrupting the existing checker's readiness
log matching; it does not skip or relax any route/module assertions.

## Failures, limits, and cleanup

- Every command must succeed. Explicit `shell: bash` gives GitHub Actions
  `-e -o pipefail`, so piping output through `tee` does not hide a failed command.
  Later checks are skipped after a failure; no `continue-on-error`, permissive
  fallback, or CI-only smoke bypass is used.
- Installation, build, and route checks each have a five-minute GNU `timeout`;
  unit tests have two minutes. A timeout returns nonzero, sends TERM to the
  command's process group, and escalates to KILL after ten seconds. Do not add
  `--foreground`, which would leave descendants outside this timeout behavior.
- The checker normally shuts down its own server in its existing cleanup block.
  The timeout also bounds a hung checker and its child server. The whole job is
  limited to twenty minutes; GitHub tears down the hosted runner afterward.
  New commits cancel obsolete runs of the same pull request.
- Output remains in the Actions step logs. An `always()` upload also preserves
  available `ci-logs/` files as `build-smoke-logs-<attempt>` for fourteen days.
  An early setup failure may leave no files; cancellation or a hard job timeout
  can prevent artifact upload, so use the step logs in those cases.

If the parallel smoke reliability repair has not merged, a smoke failure still
fails this job. Inspect its reported route/module and fix or merge the checker
repair rather than skipping the check or changing its expected result.

## Verify the first hosted run

Local checks are not proof of a passing GitHub-hosted run.

1. Push this workflow on a branch and open or update a pull request.
2. In the PR's **Checks** tab, open **Build and smoke (Node 22)**, or find
   **Build and smoke checks** under the repository's **Actions** tab.
3. Confirm the run corresponds to the latest PR commit, the runtime log reports
   Node 22.22.0, and installation, build, unit tests, and route/module checks all
   actually ran and passed (not merely skipped).
4. For any failure, open the first failed step and download the diagnostic
   artifact from the run summary. Record the run URL and commit with the result.
   Fix the cause and rerun; do not treat a local success as hosted evidence.
5. If desired, verify enforcement on a disposable PR by introducing a temporary
   build error and observing a red job, then remove it and confirm a green run.

This workflow reports a check; it does **not** prohibit merging by itself.
A repository owner must separately configure a branch protection rule or ruleset
to require **Build and smoke (Node 22)** after the check has appeared in GitHub.
No branch-protection settings are changed here.

These checks do not execute browser interactions, test physical phones, or
measure the published site. They also do not replace deployment verification.

## Local configuration validation

Before delivery, the workflow was parsed as YAML with duplicate-key checking,
its shell blocks passed `bash -n`, and the existing npm command names were
checked. With Actions-style Bash options, a failing command piped through `tee`
returned 1 and a timed-out command returned 124.

A second installation check applied the exact workflow normalization step in
the temporary checkout: 243 internal tarball URLs changed, and a structural
comparison confirmed every other lockfile field stayed identical. Installation
then passed against `https://registry.npmjs.org` with a fresh empty npm cache
and separate empty user/global npm configuration paths. This verifies public
registry portability locally, not GitHub Actions execution.

A clean temporary checkout on Node 22.22.0 passed installation, build, and all
four smoke unit tests. Initially, CI-colored Astro output caused the unchanged
checker to report `Dev server did not become ready`; no leftover Astro process
was observed. With the workflow's plain-text color settings, the route/module
check passed: nine public routes, the custom 404, and 62 local JavaScript modules.
No smoke assertions or scripts were changed. The first hosted run is still
unverified; use the procedure above after push.