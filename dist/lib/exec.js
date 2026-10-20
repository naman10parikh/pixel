// src/lib/exec.ts — a tiny synchronous command runner shared by the command cores.
// Wraps spawnSync so callers get { code, stdout, stderr, ok } without each re-deriving it.
// Synchronous on purpose: pixel's verbs are short ordered pipelines, not servers, and a
// deterministic sequential gate is easier to reason about than interleaved async output.
import { spawnSync } from "node:child_process";
/**
 * Run `cmd args...` and return its result. Never throws — a missing binary or non-zero exit
 * is reported in the result, so the audit gate can decide pass/skip/fail itself.
 */
export function run(cmd, args, opts = {}) {
    // npx exports its own flags as npm_config_* variables. A nested `npx` (create-next-app,
    // impeccable) that inherits npm_config_package looks for its command inside pixel's package
    // and fails with "command not found" when pixel itself was started with `npx -p`, so drop it.
    const env = { ...(opts.env ?? process.env) };
    delete env.npm_config_package;
    const res = spawnSync(cmd, args, {
        cwd: opts.cwd,
        timeout: opts.timeoutMs,
        env,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
    });
    const found = !(res.error && res.error.code === "ENOENT");
    const code = res.status ?? (found ? 1 : 127);
    return {
        code,
        stdout: res.stdout ?? "",
        stderr: res.stderr ?? "",
        ok: code === 0,
        found,
    };
}
