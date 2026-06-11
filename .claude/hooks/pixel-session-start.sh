#!/bin/bash
# pixel — SessionStart context injection.
# Injects the stack pins + the operating discipline so a coding agent starts
# with the version-correct surface in context (counters the agent's #1 failure
# mode: emitting stale patterns — KNOWN-PITFALLS §9.1).
#
# Wired in .claude/settings.json under hooks.SessionStart.
# Deliberately NOT the energy session-start-context.sh (that is hardcoded to
# ~/energy + globs dirs/`pnpm --filter @energy/web` that don't exist
# here — it would error under `set -euo pipefail`). This is pixel-native.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

echo "=== pixel — frontend employee · SESSION CONTEXT ==="
echo "$(date '+%Y-%m-%d') · read brain/ first (the 8-job loop + the taste stances)."
echo ""

echo "=== STACK PINS (npm-verified 2026-06-11 — emit THESE, not training-data defaults) ==="
echo "Next 16.2.9 · React 19.2.7 · Tailwind 4.3.0 · shadcn CLI 4.11.0 · Radix (unified radix-ui)"
echo "Lucide 1.17.0 · GSAP 3.15.0 (free) · Motion 12.40.0 · Lenis 1.3.23 · impeccable 2.3.2"
echo "@lhci/cli 0.15.1 · @axe-core/playwright 4.11.3"
echo ""

echo "=== §0 SILENT-FAILURE GREP-SET (the hook blocks these on Edit/Write) ==="
echo "BLOCKED: @studio-freight/* (retired Lenis → lenis/react) · sync params./searchParams. (now Promises)"
echo "         @tailwind directives (→ @import \"tailwindcss\") · middleware.ts (→ proxy.ts) · images.domains (→ remotePatterns)"
echo ""

echo "=== OPERATING DISCIPLINE ==="
echo "• Generated UI (v0/Lovable/Bolt) is an UNTRUSTED DRAFT — must pass the 7-step ship gate (O7)."
echo "• NO BRIEF = NO DESIGN (O11). The ICP is a NAMED person, not a demographic."
echo "• warm-black #141312 + ONE non-purple OKLCH accent (O-F1 overrides energy react.md purple)."
echo "• Lowest animation layer that works (O6); frequency-gate motion, sub-300ms ease-out (O-F2/O-F3)."
echo "• 'It compiles' means nothing — verify visually + 0 hydration warnings (O14)."
echo "• pixel REFUSES: mobile-native (→pebble), backend/DB/auth/payments/deploy (→turbo/acorn/badge/penny/rocket)."
echo ""

# If the bootstrap memory exists, surface its first lines (single source of truth).
if [ -f "$PROJECT_DIR/identity/MEMORY.md" ]; then
  echo "=== identity/MEMORY.md (bootstrap — head) ==="
  head -24 "$PROJECT_DIR/identity/MEMORY.md"
  echo ""
fi

echo "=== READY. Read brain/MOC - pixel.md for the knowledge graph. ==="
exit 0
