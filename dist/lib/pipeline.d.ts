import type { GateResult } from "./logger.js";
export interface MockResult {
    readonly exit: number;
    readonly out: string;
    readonly mockupPath: string | null;
    readonly appPath: string | null;
    readonly gate: GateResult[];
}
/**
 * Run the flagship mock pipeline end-to-end. `noSandbox` skips the E2B build envelope (E17) and
 * runs the gate locally — the keyless path the acceptance test (E19) proves works tokenlessly.
 */
export declare function runMockPipeline(brief: string, opts: {
    out?: string;
    noSandbox?: boolean;
}): Promise<MockResult>;
