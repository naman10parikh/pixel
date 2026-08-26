/**
 * Extract a plausible ICP NAME from a one-line brief. The brain forces the ICP to be a SPECIFIC
 * named person (O11). Briefs read like "a portfolio dashboard for Marcus, a hedge-fund PM …" —
 * we pull the first Capitalized word after "for". Falls back to "the user" (the pipeline still
 * emits; discovery flags a blank ICP as a failed gate elsewhere).
 */
export declare function extractIcpName(brief: string): string;
/** The ICP facts pulled deterministically from a one-line brief, for the discovery brief's
 *  section-1 ICP line (J1) — the SAME extraction `pixel mock` already runs for the mockup, so the
 *  headline deliverable's brief carries the named person instead of a blank `_____`. The brain
 *  forces a SPECIFIC named person (O11); briefs read "a <artifact> for <Name>, a <role> who lives
 *  in <tool>". We parse name + role + tool + the implied product type; fields we cannot extract
 *  stay null (the brief renders those as an honest fill-prompt — a blank means discovery isn't
 *  done, never a fabricated guess). `dfsHero` maps the role/product to the DFS Hero by ICP type
 *  (the brief's own §3 heuristic: enterprise→logo bar · dev→code/terminal · …). */
export interface IcpFacts {
    readonly name: string;
    readonly role: string | null;
    readonly tool: string | null;
    readonly product: string | null;
    readonly dfsHero: string;
}
export declare function extractIcpFacts(brief: string): IcpFacts;
/**
 * Build the ICP-aware mockup page. Self-contained HTML (inline CSS using the house tokens) so it
 * renders with zero build step in the cockpit iframe and passes the keyless impeccable gate.
 */
export declare function buildMockupHtml(brief: string): string;
