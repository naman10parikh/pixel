// src/commands/migrate.ts — `pixel migrate [DIR] [--from 15]` (B9 / JOB 8.2, O13).
// Determinism beats cleverness: run the official codemods (@next/codemod, @tailwindcss/upgrade)
// FIRST, then run `pixel verify` for THE GAP the codemod misses (§1.6 — "the codemod misses
// files"). The agent's job is the gap, not re-doing mechanical work by hand. Each codemod runs
// non-destructively where the tool supports it; we never claim a migration "done" on a green
// codemod alone — the §0 grep-set via `pixel verify` is the proof. Logs the run.

import chalk from "chalk";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { run } from "../lib/exec.js";
import { logRun, startTimer } from "../lib/logger.js";
import { runVerify } from "./verify.js";
import type { GateResult } from "../lib/logger.js";

export async function runMigrate(dir: string, opts: { from?: string }): Promise<number> {
  const elapsed = startTimer();
  const target = resolve(dir);
  const gates: GateResult[] = [];
  let toolCalls = 0;

  if (!existsSync(target)) {
    console.error(chalk.red(`pixel migrate: directory not found: ${target}`));
    logRun({ cmd: "migrate", model: null, duration_ms: elapsed(), tool_calls: 0, gate_results: [], exit: 1, dir: target });
    return 1;
  }

  console.log(chalk.bold(`pixel migrate ${target}`), opts.from ? chalk.dim(`(from v${opts.from})`) : "", chalk.dim("— codemod first, then grep the gap (O13)"));

  // ── 1 · @next/codemod (Next version migration: dead middleware, async params, lint→eslint). ──
  console.log(chalk.dim("  running @next/codemod upgrade latest …"));
  const nextCodemod = run("npx", ["--yes", "@next/codemod@canary", "upgrade", "latest"], { cwd: target, timeoutMs: 300_000 });
  toolCalls++;
  gates.push({
    gate: "next-codemod",
    pass: nextCodemod.found ? nextCodemod.ok : null,
    detail: nextCodemod.found ? (nextCodemod.ok ? "applied" : `exit ${nextCodemod.code}`) : "@next/codemod unavailable (offline?) — skipped",
  });

  // ── 2 · @tailwindcss/upgrade (v3→v4: directives, @theme, may pin @config). ──────────────────
  console.log(chalk.dim("  running @tailwindcss/upgrade …"));
  const twUpgrade = run("npx", ["--yes", "@tailwindcss/upgrade"], { cwd: target, timeoutMs: 300_000 });
  toolCalls++;
  gates.push({
    gate: "tailwind-upgrade",
    pass: twUpgrade.found ? twUpgrade.ok : null,
    detail: twUpgrade.found ? (twUpgrade.ok ? "applied" : `exit ${twUpgrade.code}`) : "@tailwindcss/upgrade unavailable (offline?) — skipped",
  });

  for (const g of gates) {
    const mark = g.pass === true ? chalk.green("✓") : g.pass === false ? chalk.red("✗") : chalk.dim("·");
    console.log(`  ${mark} ${g.gate}${g.detail ? chalk.dim("  " + g.detail) : ""}`);
  }

  // ── 3 · grep the gap — `pixel verify` is the proof a codemod-green migration is actually clean. ──
  console.log(chalk.dim("  verifying the gap (§0 grep-set + build) …"));
  const verifyExit = await runVerify(target);
  gates.push({ gate: "verify-gap", pass: verifyExit === 0, detail: verifyExit === 0 ? "grep-set clean post-codemod" : "residual stale patterns — fix the gap" });

  const exit = verifyExit === 0 ? 0 : 1;
  logRun({ cmd: "migrate", model: null, duration_ms: elapsed(), tool_calls: toolCalls, gate_results: gates, exit, dir: target, from: opts.from ?? null });
  return exit;
}
