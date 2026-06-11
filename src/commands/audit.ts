// src/commands/audit.ts — `pixel audit [DIR] [--sandbox]` (B9 / JOB 7, the ship gate).
// Runs the 7-step gate IN ORDER via src/lib/ship-gate (impeccable step 1 is real + keyless).
// Exit-code gate: any hard FAIL → non-zero. `--sandbox` builds + gates inside an E2B envelope,
// which is wired by E17 (src/lib/sandbox.ts, a separate stream); when that module isn't present
// yet we run the gate locally and say so (we never silently claim the sandbox ran). Logs the
// per-gate results to logs/runs.jsonl.

import chalk from "chalk";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { logRun, startTimer } from "../lib/logger.js";
import { runShipGate } from "../lib/ship-gate.js";
import type { GateResult } from "../lib/logger.js";

/** Try to load the E17 sandbox module if it has shipped; null otherwise (graceful). */
async function loadSandbox(): Promise<
  | { auditInSandbox: (dir: string) => Promise<{ steps: GateResult[]; coldStartMs: number; rc: number }> }
  | null
> {
  try {
    // Dynamic import via a non-literal specifier so `tsc` does not statically resolve the E17
    // module (a separate stream) at build time; at runtime a missing module degrades to null.
    const spec = "../lib/sandbox.js";
    const mod = (await import(spec)) as unknown as {
      auditInSandbox?: (dir: string) => Promise<{ steps: GateResult[]; coldStartMs: number; rc: number }>;
    };
    return mod.auditInSandbox ? { auditInSandbox: mod.auditInSandbox } : null;
  } catch {
    return null;
  }
}

export async function runAudit(
  dir: string,
  opts: { sandbox?: boolean; fix?: boolean },
): Promise<number> {
  const elapsed = startTimer();
  const target = resolve(dir);

  if (!existsSync(target)) {
    console.error(chalk.red(`pixel audit: directory not found: ${target}`));
    logRun({ cmd: "audit", model: null, duration_ms: elapsed(), tool_calls: 0, gate_results: [], exit: 1, dir: target });
    return 1;
  }

  console.log(chalk.bold(`pixel audit ${target}`), chalk.dim("— the 7-step ship gate (untrusted-draft posture, O7)"));

  // ── --sandbox path (E17) — build + gate inside the envelope (untrusted v0 output is ~40-45% vuln). ──
  if (opts.sandbox) {
    const sandbox = await loadSandbox();
    if (sandbox) {
      const r = await sandbox.auditInSandbox(target);
      for (const s of r.steps) printGate(s);
      logRun({ cmd: "audit", model: null, duration_ms: elapsed(), tool_calls: r.steps.length, gate_results: r.steps, exit: r.rc, dir: target, sandbox: true, cold_start_ms: r.coldStartMs });
      return r.rc;
    }
    console.error(chalk.yellow("pixel audit --sandbox: E2B sandbox path (E17) not wired in this build — running the gate LOCALLY instead."));
  }

  // ── Local 7-step gate ───────────────────────────────────────────────────────────────────────
  const gate = runShipGate(target);
  for (const s of gate.steps) printGate(s);

  const exit = gate.pass ? 0 : 1;
  console.log(exit === 0 ? chalk.green("✓ ship gate passed (no hard fail)") : chalk.red("✗ ship gate FAILED"));
  logRun({ cmd: "audit", model: null, duration_ms: elapsed(), tool_calls: gate.toolCalls, gate_results: gate.steps, exit, dir: target });
  return exit;
}

function printGate(s: GateResult): void {
  const mark = s.pass === true ? chalk.green("✓") : s.pass === false ? chalk.red("✗") : chalk.dim("·");
  const label = s.pass === null ? chalk.dim(s.gate) : chalk.bold(s.gate);
  console.log(`  ${mark} ${label}${s.detail ? chalk.dim("  " + s.detail) : ""}`);
}
