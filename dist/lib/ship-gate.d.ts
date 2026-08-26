import type { GateResult } from "./logger.js";
export interface ShipGateResult {
    readonly pass: boolean;
    readonly steps: GateResult[];
    readonly toolCalls: number;
}
/**
 * Run the ordered ship gate over a tree. `runApp` (steps 2/3/7 need a booted app) is left to
 * the caller / E17 sandbox; absent a running app those steps SKIP, not FAIL. Step 1 always runs.
 */
export declare function runShipGate(dir: string): ShipGateResult;
