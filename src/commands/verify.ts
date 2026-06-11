// src/commands/verify.ts — `pixel verify [DIR]` (B9 / JOB 6, the agent's blind-spot check).
// The silent-failure assertion set: (1) the §0 grep-set (src/lib/grep-set) → catches stale
// patterns that compile green and misbehave; (2) a build if the tree is a buildable app
// (pnpm/npm build) → green build is necessary-not-sufficient; (3) the visual/console proof
// (Playwright screenshot + console=0-hydration) is recorded as SKIP unless an app is booted
// (the acceptance smoke / cockpit E2E boots it for real). O14: never call a green build "done".
// Every run logs gate_results to logs/runs.jsonl (Observability — E16 dependency satisfied).

import chalk from "chalk";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { run } from "../lib/exec.js";
import { logRun, startTimer } from "../lib/logger.js";
import { runGrepSet } from "../lib/grep-set.js";
import type { GateResult } from "../lib/logger.js";

/** Detect whether `dir` looks like a buildable JS app (has a package.json with a build script). */
function buildScriptDir(dir: string): string | null {
  for (const c of [dir, join(dir, "app")]) {
    const pkg = join(c, "package.json");
    if (existsSync(pkg)) {
      try {
        const json = JSON.parse(readFileSync(pkg, "utf8")) as { scripts?: Record<string, string> };
        if (json.scripts?.build) return c;
      } catch {
        /* unreadable package.json — fall through */
      }
    }
  }
  return null;
}

export async function runVerify(dir: string): Promise<number> {
  const elapsed = startTimer();
  const target = resolve(dir);
  const gates: GateResult[] = [];
  let toolCalls = 0;
  let exit = 0;

  if (!existsSync(target)) {
    console.error(chalk.red(`pixel verify: directory not found: ${target}`));
    logRun({ cmd: "verify", model: null, duration_ms: elapsed(), tool_calls: 0, gate_results: [{ gate: "grep-set", pass: false, detail: "dir not found" }], exit: 1, dir: target });
    return 1;
  }

  // ── 1 · the §0 silent-failure grep-set ─────────────────────────────────────────────────────
  const findings = runGrepSet(target);
  if (findings.length === 0) {
    gates.push({ gate: "grep-set", pass: true, detail: "no stale patterns" });
    console.log(chalk.green("✓ §0 grep-set clean"), chalk.dim("(no sync params / dead middleware / @studio-freight / @tailwind directive / images.domains)"));
  } else {
    gates.push({ gate: "grep-set", pass: false, detail: `${findings.length} stale pattern(s)` });
    exit = 1;
    console.error(chalk.red(`✗ §0 grep-set: ${findings.length} finding(s)`));
    for (const f of findings) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      console.error(`  ${chalk.yellow(f.id)} ${chalk.dim(loc)}\n    ${f.message}`);
    }
  }

  // ── 2 · build (necessary, not sufficient) ──────────────────────────────────────────────────
  const appDir = buildScriptDir(target);
  if (appDir) {
    console.log(chalk.dim(`  building ${appDir} …`));
    const built = run("pnpm", ["build"], { cwd: appDir, timeoutMs: 300_000 });
    toolCalls++;
    if (!built.found) {
      gates.push({ gate: "build", pass: null, detail: "pnpm not found — skipped" });
    } else if (built.ok) {
      gates.push({ gate: "build", pass: true });
      console.log(chalk.green("✓ build passed"));
    } else {
      gates.push({ gate: "build", pass: false, detail: `exit ${built.code}` });
      exit = 1;
      console.error(chalk.red("✗ build failed"), chalk.dim(`(exit ${built.code})`));
    }
  } else {
    gates.push({ gate: "build", pass: null, detail: "no buildable app in tree — grep-set only" });
    console.log(chalk.dim("  (no package.json build script here — grep-set-only verify)"));
  }

  // ── 3 · visual + console proof (needs a running app → recorded as SKIP here) ────────────────
  gates.push({ gate: "visual", pass: null, detail: "Playwright screenshot + console=0-hydration — run via the acceptance smoke" });
  console.log(chalk.dim("  visual/console proof deferred to the acceptance smoke (needs a booted app)"));

  logRun({ cmd: "verify", model: null, duration_ms: elapsed(), tool_calls: toolCalls, gate_results: gates, exit, dir: target });
  return exit;
}
