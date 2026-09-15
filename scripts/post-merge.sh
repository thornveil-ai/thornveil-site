#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

# Reconciliation restarts the existing workflows after setup; do not start servers here.
echo "Post-merge setup: installing dependencies from package-lock.json"
CI=true npm ci --include=dev --no-audit --no-fund </dev/null
echo "Post-merge setup: dependencies installed successfully"