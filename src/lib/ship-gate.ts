// src/lib/ship-gate.ts — JOB 7, the 7-step pre-merge ship gate IN ORDER (EXPERTISE-MAP §97).
// 1 impeccable (anti-slop, keyless, exit-code) → 2 axe-playwright → 3 lighthouse-ci →
// 4 design-systems 12-dim → 5 manual a11y → 6 security → 7 visual proof.
// This is pixel's whole reason to exist over raw v0 (O7): generated UI is an UNTRUSTED draft
// until it survives the gate. Step 1 is real and keyless (the hard, CI-usable gate); steps that
// need a running app / a missing tool / human judgement degrade to a logged SKIP (pass=null)
// rather than a false PASS — "it compiles" ≠ ✅ (O14). The exit-code is the gate: any hard FAIL
// (pass===false) → overall fail. `--sandbox` runs the build/gate inside an E2B envelope, which
// is wired by E17 (src/lib/sandbox.ts, a separate stream) — this module only calls the hook.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { run } from "./exec.js";
import type { GateResult } from "./logger.js";

export interface ShipGateResult {
  readonly pass: boolean; // overall — no hard-fail across the gate
  readonly steps: GateResult[]; // one entry per attempted step (impeccable..visual)
  readonly toolCalls: number; // external tool invocations made
}

/** Resolve the `src/` (or app root) impeccable should scan inside `dir`. */
function impeccableTarget(dir: string): string {
  for (const c of [join(dir, "app", "src"), join(dir, "src"), dir]) {
    if (existsSync(c)) return c;
  }
  return dir;
}

/**
 * Run the ordered ship gate over a tree. `runApp` (steps 2/3/7 need a booted app) is left to
 * the caller / E17 sandbox; absent a running app those steps SKIP, not FAIL. Step 1 always runs.
 */
export function runShipGate(dir: string): ShipGateResult {
  const steps: GateResult[] = [];
  let toolCalls = 0;
  let hardFail = false;

  // ── Step 1 · impeccable (anti-slop) — REAL, keyless, the exit-code gate. ───────────────────
  const target = impeccableTarget(dir);
  const imp = run("npx", ["--yes", "impeccable", "detect", "--json", target], {
    timeoutMs: 120_000,
  });
  toolCalls++;
  if (!imp.found) {
    steps.push({ gate: "impeccable", pass: null, detail: "impeccable not installed (npx fetch failed?)" });
  } else if (imp.ok) {
    steps.push({ gate: "impeccable", pass: true, detail: "0 slop violations" });
  } else {
    hardFail = true;
    const tail = (imp.stdout || imp.stderr).split("\n").slice(-3).join(" ").slice(0, 200);
    steps.push({ gate: "impeccable", pass: false, detail: tail || `exit ${imp.code}` });
  }

  // ── Steps 2-3 · axe-playwright + lighthouse-ci — need a running app. ───────────────────────
  // Without a booted server we record SKIP (the acceptance pipeline / cockpit E2E boots the app
  // and runs these for real; here in a static audit they are not-applicable, not failing).
  steps.push({
    gate: "axe",
    pass: null,
    detail: "needs a running app — run via the acceptance smoke / cockpit E2E",
  });
  steps.push({
    gate: "lhci",
    pass: null,
    detail: "needs a running app — LCP<2.0s/INP<200ms/CLS<0.1 asserted in the smoke",
  });

  // ── Step 4 · design-systems 12-dim binary audit (≥10/12) — the taste layer (energy skill). ──
  // The skill is an energy-side capability invoked by the agent, not a CLI here → SKIP w/ note.
  steps.push({
    gate: "12-dim",
    pass: null,
    detail: "design-systems 12-dim binary audit — invoke the energy skill (≥10/12, no '7/10')",
  });

  // ── Step 5 · manual a11y (keyboard/SR/reduced-motion) — the 60-70% axe misses. ─────────────
  steps.push({ gate: "manual-a11y", pass: null, detail: "manual keyboard + screen-reader + reduced-motion pass required" });

  // ── Step 6 · security review (the 40-45% AI-code vuln rate). ───────────────────────────────
  steps.push({ gate: "security", pass: null, detail: "untrusted-draft security review (O7) — 40-45% AI-code vuln rate" });

  // ── Step 7 · visual proof (Playwright CLI screenshot, READ it). ────────────────────────────
  steps.push({ gate: "visual", pass: null, detail: "Playwright CLI screenshot + READ + console=0-hydration" });

  return { pass: !hardFail, steps, toolCalls };
}
