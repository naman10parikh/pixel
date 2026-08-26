import { type GrepFinding } from "./grep-set.js";
/** One slop-tell hit in a snippet (the OPINIONS half, beyond the §0 grep-set). */
export interface SlopHit {
    readonly rule: string;
    readonly message: string;
}
export interface TasteCheckResult {
    readonly slop_rules_hit: string[];
    readonly findings: GrepFinding[];
    readonly slop_tells: SlopHit[];
    readonly suggestions: string[];
    readonly clean: boolean;
}
/** Run the snippet taste-check: §0 grep-set (reused) + the OPINIONS slop-tells. */
export declare function tasteCheck(code: string): TasteCheckResult;
