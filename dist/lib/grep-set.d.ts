/** One silent-failure finding in a scanned tree. */
export interface GrepFinding {
    readonly id: string;
    readonly file: string;
    readonly line?: number;
    readonly message: string;
}
/**
 * Run the silent-failure grep-set over a tree. Returns every finding (empty = clean).
 * File-existence checks (#1 sync-params target dirs, #2 dead middleware) are handled
 * separately below because they assert on paths, not file content.
 */
export declare function runGrepSet(root: string): GrepFinding[];
/** The pattern ids, exported so the B10 hook can reuse the exact same set. */
export declare const GREP_SET_RULES: string[];
