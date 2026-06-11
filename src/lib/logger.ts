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

/** One pass/fail (or skipped) result from a single audit gate step. */
export interface GateResult {
  readonly gate: string; // e.g. "impeccable", "axe", "lhci", "12-dim"
  readonly pass: boolean | null; // null = skipped (tool/app unavailable)
  readonly detail?: string; // short reason / violation count
}

/** The required, precisely-typed fields of every run record (no index signature). */
export interface RunFields {
  readonly cmd: string; // the pixel verb, e.g. "verify", "scaffold", "mock"
  readonly model: string | null; // LLM model if one was used, else null (deterministic run)
  readonly duration_ms: number;
  readonly tool_calls: number; // external tool invocations made (shadcn/impeccable/playwright/...)
  readonly gate_results: GateResult[];
  readonly exit: number; // process exit code this run resolved to
}

/** Fields a caller supplies; `ts` is stamped here. Extras (step, cold_start_ms, out, …) allowed. */
export interface RunInput extends RunFields {
  readonly [extra: string]: unknown;
}

/** A single appended record = the input fields + the stamped timestamp. */
export interface RunRecord extends RunInput {
  readonly ts: string; // ISO-8601 UTC
}

function ensureLogDir(): void {
  const dir = dirname(LOG_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Append one JSON line to logs/runs.jsonl. Never throws into the caller — observability
 * must not crash a command (energy typescript.md: every catch logs context, never swallows).
 */
export function logRun(input: RunInput): void {
  const record: RunRecord = { ts: new Date().toISOString(), ...input };
  // OTel-GenAI-shaped aliases, added only when cheap/available — a collector can read these
  // without re-mapping pixel's native field names.
  const otel: Record<string, unknown> = {
    "gen_ai.operation.name": input.cmd,
    "gen_ai.response.model": input.model,
  };
  const line = JSON.stringify({ ...record, ...otel }) + "\n";
  try {
    ensureLogDir();
    appendFileSync(LOG_PATH, line, "utf8");
  } catch (err) {
    console.warn(
      "[logger] failed to append run record:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Append a single pipeline-step line (D14's discover/generate/gate/emit). Each step is its
 * OWN line carrying a distinct `step` key — NOT one summary record listing all four.
 */
export function logStep(
  cmd: string,
  step: string,
  fields: Partial<RunInput> = {},
): void {
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
export function startTimer(): () => number {
  const t0 = Date.now();
  return () => Date.now() - t0;
}

/** Read every record back (used by `pixel logs`). Returns [] if the log is absent/empty. */
export function readRuns(): RunRecord[] {
  if (!existsSync(LOG_PATH)) return [];
  const raw = readFileSync(LOG_PATH, "utf8");
  const out: RunRecord[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as RunRecord);
    } catch (err) {
      // A corrupt half-written line (e.g. SIGTERM mid-append) must not abort aggregation.
      console.warn(
        "[logger] skipping unparseable log line:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
  return out;
}

export { LOG_PATH };
