// src/lib/logger.ts — append-only run observability for every `pixel` invocation.
// Component 10 (Observability) per HARNESS-OVERRIDES: logs/runs.jsonl records per run
// { ts, cmd, model, duration_ms, tool_calls, gate_results, exit } — gate results, not just
// duration. OTel-GenAI-shaped field names (gen_ai.*) are added where cheap so a future
// collector can ingest without a re-map. This module is imported by EVERY command core
// (B8/B9) and by the mock pipeline (D14), which also writes per-step lines via `step`.
import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
// The log lives at <repo-root>/logs/runs.jsonl. We resolve relative to this compiled file
// (dist/lib/logger.js → ../../logs) so the path is stable no matter the process cwd.
const LOG_PATH = resolve(import.meta.dirname, "..", "..", "logs", "runs.jsonl");
function ensureLogDir() {
    const dir = dirname(LOG_PATH);
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
}
/**
 * Append one JSON line to logs/runs.jsonl. Never throws into the caller — observability
 * must not crash a command (energy typescript.md: every catch logs context, never swallows).
 */
export function logRun(input) {
    const record = { ts: new Date().toISOString(), ...input };
    // OTel-GenAI-shaped aliases, added only when cheap/available — a collector can read these
    // without re-mapping pixel's native field names.
    const otel = {
        "gen_ai.operation.name": input.cmd,
        "gen_ai.response.model": input.model,
    };
    const line = JSON.stringify({ ...record, ...otel }) + "\n";
    try {
        ensureLogDir();
        appendFileSync(LOG_PATH, line, "utf8");
    }
    catch (err) {
        console.warn("[logger] failed to append run record:", err instanceof Error ? err.message : String(err));
    }
}
/**
 * Append a single pipeline-step line (D14's discover/generate/gate/emit). Each step is its
 * OWN line carrying a distinct `step` key — NOT one summary record listing all four.
 */
export function logStep(cmd, step, fields = {}) {
    logRun({
        cmd,
        step,
        model: fields.model ?? null,
        duration_ms: fields.duration_ms ?? 0,
        tool_calls: fields.tool_calls ?? 0,
        gate_results: fields.gate_results ?? [],
        exit: fields.exit ?? 0,
        ...fields,
    });
}
/** A small timer so commands report real wall-clock duration_ms. */
export function startTimer() {
    const t0 = Date.now();
    return () => Date.now() - t0;
}
/** Read every record back (used by `pixel logs`). Returns [] if the log is absent/empty. */
export function readRuns() {
    if (!existsSync(LOG_PATH))
        return [];
    const raw = readFileSync(LOG_PATH, "utf8");
    const out = [];
    for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        try {
            out.push(JSON.parse(trimmed));
        }
        catch (err) {
            // A corrupt half-written line (e.g. SIGTERM mid-append) must not abort aggregation.
            console.warn("[logger] skipping unparseable log line:", err instanceof Error ? err.message : String(err));
        }
    }
    return out;
}
export { LOG_PATH };
