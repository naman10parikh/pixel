/** One ranked brain hit. */
export interface BrainHit {
    readonly file: string;
    readonly score: number;
    readonly snippet: string;
}
export interface BrainSearchResult {
    readonly query: string;
    readonly hits: BrainHit[];
    readonly note?: string;
}
/** Run a BM25 brain search (top hits) via the A5 script. Limit defaults to the script's own top-N. */
export declare function brainSearch(query: string, limit?: number): BrainSearchResult;
