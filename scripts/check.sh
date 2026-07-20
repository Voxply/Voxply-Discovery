#!/usr/bin/env bash
# Local CI mirror for Wavvon-discovery.
# Run from the repo root, or let the pre-push hook call it automatically.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

pass() { echo "  ✓ $*"; }
fail() { echo "  ✗ $*" >&2; exit 1; }
header() { echo; echo "==> $*"; }

if [ ! -d "$ROOT/node_modules" ]; then
  fail "node_modules missing — run 'npm ci' first."
fi

# ── TypeScript ────────────────────────────────────────────────────────────────
header "TypeScript (tsc --noEmit)"
(cd "$ROOT" && npx tsc --noEmit)
pass "tsc --noEmit"

# ── ESLint ────────────────────────────────────────────────────────────────────
header "ESLint"
(cd "$ROOT" && npm run lint)
pass "eslint"

echo
echo "All checks passed."
