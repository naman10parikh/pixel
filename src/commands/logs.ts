// src/commands/logs.ts — `pixel logs [--last N]` (Component 10 / E16 aggregator).
// Reads logs/runs.jsonl and prints a per-run table: cmd · model · duration · gate-results · exit.
// Gate results (impeccable/axe/lhci pass-fail) are surfaced, not just duration — that is the
// whole point of the override (a green build with no gate evidence is not ✅). `--json` emits raw.

import chalk from "chalk";
import { readRuns, startTimer, logRun } from "../lib/logger.js";
import type { GateResult } from "../lib/logger.js";

function gateSummary(gates: GateResult[]): string {
  if (!gates || gates.length === 0) return chalk.dim("—");
  return gates
    .map((g) => {
      const mark = g.pass === true ? chalk.green("✓") : g.pass === false ? chalk.red("✗") : chalk.dim("·");
      return `${mark}${g.gate}`;
    })
    .join(" ");
}

export async function runLogs(opts: { last?: number; json?: boolean }): Promise<number> {
  const elapsed = startTimer();
  const all = readRuns();
  const rows = typeof opts.last === "number" && opts.last > 0 ? all.slice(-opts.last) : all;

  if (opts.json) {
    process.stdout.write(JSON.stringify(rows, null, 2) + "\n");
    // Reading the log is itself a (tiny) run; record it so `logs` is observable too.
    logRun({ cmd: "logs", model: null, duration_ms: elapsed(), tool_calls: 0, gate_results: [], exit: 0, rows: rows.length });
    return 0;
  }

  if (rows.length === 0) {
    console.log(chalk.dim("no runs recorded yet — run a pixel command to populate logs/runs.jsonl"));
    return 0;
  }

  console.log(chalk.bold(`pixel runs (${rows.length}${rows.length < all.length ? ` of ${all.length}` : ""})`));
  for (const r of rows) {
    const cmd = String(r.cmd ?? "?").padEnd(10);
    const dur = `${r.duration_ms ?? 0}ms`.padStart(8);
    const model = r.model ? String(r.model) : chalk.dim("deterministic");
    const step = r.step ? chalk.cyan(` [${r.step}]`) : "";
    const exit = r.exit === 0 ? chalk.green("exit 0") : chalk.red(`exit ${r.exit}`);
    console.log(
      `  ${chalk.dim(String(r.ts).slice(11, 19))}  ${chalk.bold(cmd)}${step}  ${dur}  ${model}  ${gateSummary(r.gate_results)}  ${exit}`,
    );
  }

  // Aggregate footer: count, total tool calls, mean duration.
  const total = rows.length;
  const toolCalls = rows.reduce((n, r) => n + (Number(r.tool_calls) || 0), 0);
  const meanDur = Math.round(rows.reduce((n, r) => n + (Number(r.duration_ms) || 0), 0) / total);
  console.log(chalk.dim(`  — ${total} runs · ${toolCalls} tool calls · ${meanDur}ms mean`));

  logRun({ cmd: "logs", model: null, duration_ms: elapsed(), tool_calls: 0, gate_results: [], exit: 0, rows: rows.length });
  return 0;
}
