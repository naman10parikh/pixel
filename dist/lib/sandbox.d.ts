import type { GateResult } from "./logger.js";
export interface SandboxAuditResult {
    readonly steps: GateResult[];
    readonly coldStartMs: number;
    readonly rc: number;
}
/**
 * Boot an E2B sandbox, upload `dir`'s source, run install+build+impeccable inside, return results.
 * Degrades to a SKIP-shaped result (rc 0, steps=null) on missing key / SDK / network — never a fake
 * PASS. An in-envelope OOM is recorded honestly (pass=false with the cause), not swallowed.
 */
export declare function auditInSandbox(dir: string): Promise<SandboxAuditResult>;
