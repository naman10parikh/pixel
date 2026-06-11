// src/lib/exec.ts — a tiny synchronous command runner shared by the command cores.
// Wraps spawnSync so callers get { code, stdout, stderr, ok } without each re-deriving it.
// Synchronous on purpose: pixel's verbs are short ordered pipelines, not servers, and a
// deterministic sequential gate is easier to reason about than interleaved async output.

import { spawnSync } from "node:child_process";

export interface ExecResult {
  readonly code: number; // exit code (127 if the binary was not found)
  readonly stdout: string;
  readonly stderr: string;
  readonly ok: boolean; // code === 0
  readonly found: boolean; // false when the executable itself is missing
}

export interface ExecOptions {
  readonly cwd?: string;
  readonly timeoutMs?: number;
  readonly env?: NodeJS.ProcessEnv;
}

/**
 * Run `cmd args...` and return its result. Never throws — a missing binary or non-zero exit
 * is reported in the result, so the audit gate can decide pass/skip/fail itself.
 */
export function run(
  cmd: string,
  args: readonly string[],
  opts: ExecOptions = {},
): ExecResult {
  const res = spawnSync(cmd, args as string[], {
    cwd: opts.cwd,
    timeout: opts.timeoutMs,
    env: opts.env ?? process.env,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const found = !(res.error && (res.error as NodeJS.ErrnoException).code === "ENOENT");
  const code = res.status ?? (found ? 1 : 127);
  return {
    code,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
    ok: code === 0,
    found,
  };
}
