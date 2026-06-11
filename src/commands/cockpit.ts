// src/commands/cockpit.ts — STUB (B8 wires the parser; the real server is G24).
// `pixel cockpit` serves the localhost SPA (brain browser · run log · eval scores ·
// ask-the-employee · mockup gallery). G24 (cluster G, separate stream) implements
// src/cockpit/server.mjs + public/* and replaces this body. The stub logs the invocation and
// exits non-zero so it is not mistaken for a live server.

import chalk from "chalk";
import { logRun, startTimer } from "../lib/logger.js";

export async function runCockpit(opts: { port: string }): Promise<number> {
  const elapsed = startTimer();
  console.error(
    chalk.yellow(`pixel cockpit: server not yet wired in this build (owned by cluster G / G24); requested port ${opts.port}.`),
  );
  logRun({
    cmd: "cockpit",
    model: null,
    duration_ms: elapsed(),
    tool_calls: 0,
    gate_results: [],
    exit: 1,
    port: opts.port,
    stub: true,
  });
  return 1;
}
