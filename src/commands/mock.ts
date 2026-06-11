// src/commands/mock.ts — STUB (B8 wires the parser; the real pipeline is D14).
// `pixel mock` is THE flagship: discover → generate → gate → emit, logged per step. D14
// (cluster D, separate stream) implements src/lib/pipeline.ts and replaces this body. Until
// then this stub does NOT fake success — it logs the invocation and exits non-zero so nothing
// downstream mistakes it for a working pipeline. The brief gate (NO BRIEF = NO DESIGN, O11) is
// honored here so even the stub refuses an empty brief, matching the chaos-2 contract.

import chalk from "chalk";
import { logRun, startTimer } from "../lib/logger.js";

export async function runMock(
  brief: string,
  opts: { out?: string; sandbox?: boolean; json?: boolean },
): Promise<number> {
  const elapsed = startTimer();

  if (!brief || brief.trim().length === 0) {
    console.error(chalk.red("pixel mock: NO BRIEF = NO DESIGN — provide a one-line brief naming the ICP (O11)."));
    logRun({ cmd: "mock", model: null, duration_ms: elapsed(), tool_calls: 0, gate_results: [], exit: 2, brief: "" });
    return 2;
  }

  console.error(
    chalk.yellow("pixel mock: pipeline not yet wired in this build (owned by cluster D / D14)."),
  );
  console.error(chalk.dim("  Run `pixel scaffold`, `pixel design`, then `pixel audit` for the underlying cores (B9)."));
  logRun({
    cmd: "mock",
    model: null,
    duration_ms: elapsed(),
    tool_calls: 0,
    gate_results: [],
    exit: 1,
    brief,
    out: opts.out ?? null,
    sandbox: opts.sandbox !== false,
    stub: true,
  });
  return 1;
}
