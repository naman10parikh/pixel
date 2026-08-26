declare const LOG_PATH: string;
/** One pass/fail (or skipped) result from a single audit gate step. */
export interface GateResult {
    readonly gate: string;
    readonly pass: boolean | null;
    readonly detail?: string;
}
/** The required, precisely-typed fields of every run record (no index signature). */
export interface RunFields {
    readonly cmd: string;
    readonly model: string | null;
    readonly duration_ms: number;
    readonly tool_calls: number;
    readonly gate_results: GateResult[];
    readonly exit: number;
}
/** Fields a caller supplies; `ts` is stamped here. Extras (step, cold_start_ms, out, …) allowed. */
export interface RunInput extends RunFields {
    readonly [extra: string]: unknown;
}
/** A single appended record = the input fields + the stamped timestamp. */
export interface RunRecord extends RunInput {
    readonly ts: string;
}
/**
 * Append one JSON line to logs/runs.jsonl. Never throws into the caller — observability
 * must not crash a command (energy typescript.md: every catch logs context, never swallows).
 */
export declare function logRun(input: RunInput): void;
/**
 * Append a single pipeline-step line (D14's discover/generate/gate/emit). Each step is its
 * OWN line carrying a distinct `step` key — NOT one summary record listing all four.
 */
export declare function logStep(cmd: string, step: string, fields?: Partial<RunInput>): void;
/** A small timer so commands report real wall-clock duration_ms. */
export declare function startTimer(): () => number;
/** Read every record back (used by `pixel logs`). Returns [] if the log is absent/empty. */
export declare function readRuns(): RunRecord[];
export { LOG_PATH };
