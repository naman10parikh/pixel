export interface ExecResult {
    readonly code: number;
    readonly stdout: string;
    readonly stderr: string;
    readonly ok: boolean;
    readonly found: boolean;
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
export declare function run(cmd: string, args: readonly string[], opts?: ExecOptions): ExecResult;
