// src/commands/cockpit.ts — `pixel cockpit [--port 7780]` (Cluster G / G24).
// Launches the localhost cockpit: the stdlib Node server in src/cockpit/server.mjs serving the
// vanilla-JS SPA (brain browser · run log · eval scores · ask-the-employee · ★ mockup gallery).
// The server is an UNCOMPILED .mjs (tsconfig excludes src/cockpit) — it is the same source whether
// run from src or from a published dist, so we resolve it relative to the repo root, not dist.
//
// We exec the server in the foreground (replacing this process's event loop with the server's):
// `pixel cockpit` is a long-running serve command, so it blocks until Ctrl-C. The run is logged
// to logs/runs.jsonl BEFORE the server takes over (the boot is the observable event); the server
// then prints its own ready line. Exit code mirrors the child (0 on clean SIGINT, non-zero on a
// bind error like EADDRINUSE).

import chalk from "chalk";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { logRun, startTimer } from "../lib/logger.js";

export async function runCockpit(opts: { port: string }): Promise<number> {
  const elapsed = startTimer();
  const port = String(opts.port ?? "7780");

  // Resolve src/cockpit/server.mjs relative to this compiled file: dist/commands/cockpit.js →
  // ../../src/cockpit/server.mjs. (The server is never compiled; it ships as source.)
  const server = resolve(import.meta.dirname, "..", "..", "src", "cockpit", "server.mjs");
  if (!existsSync(server)) {
    console.error(chalk.red(`pixel cockpit: server not found at ${server}`));
    logRun({ cmd: "cockpit", model: null, duration_ms: elapsed(), tool_calls: 0, gate_results: [{ gate: "cockpit-server", pass: false, detail: "server.mjs missing" }], exit: 1, port });
    return 1;
  }

  // Log the boot as the observable run BEFORE handing off to the server's event loop.
  logRun({
    cmd: "cockpit",
    model: null,
    duration_ms: elapsed(),
    tool_calls: 0,
    gate_results: [{ gate: "cockpit-boot", pass: true, detail: `serving on :${port}` }],
    exit: 0,
    port,
  });

  // Spawn the stdlib server, inheriting stdio so its ready line + logs reach the user's terminal.
  // PIXEL_COCKPIT_PORT is the server's port source (it also accepts argv[2]); pass both for clarity.
  return await new Promise<number>((resolveExit) => {
    const child = spawn(process.execPath, [server, port], {
      stdio: "inherit",
      env: { ...process.env, PIXEL_COCKPIT_PORT: port },
    });
    // Forward Ctrl-C to the child so it shuts down gracefully, then resolve with its exit code.
    const onSig = (): void => {
      child.kill("SIGINT");
    };
    process.on("SIGINT", onSig);
    process.on("SIGTERM", onSig);
    child.on("exit", (code) => {
      process.off("SIGINT", onSig);
      process.off("SIGTERM", onSig);
      resolveExit(code ?? 0);
    });
    child.on("error", (err) => {
      console.error(chalk.red("pixel cockpit: failed to launch server:"), err.message);
      resolveExit(1);
    });
  });
}
