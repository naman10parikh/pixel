// src/lib/brain-search.ts — `pixel_brain_search` core (the Memory layer over MCP, A5 → C11).
// WRAPS the A5 BM25 search script (scripts/memory-search.sh, whose FILES array globs brain/*.md)
// rather than re-implement ranking — one source of truth for "search the brain" (Karpathy
// Surgical). It shells out to the script, parses the `[N] <file> (score:N)` + indented-snippet
// blocks it prints, and returns them as structured hits an agent/cockpit can render. If the
// script is absent/unrunnable, it returns an empty hit set with a note (never throws).
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { run } from "./exec.js";
// The A5 search script lives at <repo-root>/scripts/memory-search.sh. Resolve relative to this
// compiled file (dist/lib/brain-search.js → ../../scripts) so it's stable regardless of cwd.
const SCRIPT = resolve(import.meta.dirname, "..", "..", "scripts", "memory-search.sh");
/**
 * Parse the memory-search.sh stdout. Format per hit:
 *   [N] <file> (score: <n>)
 *       ---
 *       <snippet lines, indented>
 *       ---
 */
function parseHits(stdout) {
    const hits = [];
    const headerRe = /^\[\d+\]\s+(\S+)\s+\(score:\s*(\d+)\)/;
    const lines = stdout.split("\n");
    let current = null;
    const flush = () => {
        if (current) {
            // Trim the leading/trailing `---` fence lines and surrounding blanks from the snippet.
            const body = current.buf.join("\n").replace(/^\s*---\s*$/gm, "").trim();
            hits.push({ file: current.file, score: current.score, snippet: body });
            current = null;
        }
    };
    for (const ln of lines) {
        const m = headerRe.exec(ln.trim());
        if (m) {
            flush();
            current = { file: m[1], score: Number(m[2]), buf: [] };
        }
        else if (current) {
            current.buf.push(ln);
        }
    }
    flush();
    return hits;
}
/** Run a BM25 brain search (top hits) via the A5 script. Limit defaults to the script's own top-N. */
export function brainSearch(query, limit = 5) {
    if (!query || query.trim().length === 0) {
        return { query: query ?? "", hits: [], note: "empty query" };
    }
    if (!existsSync(SCRIPT)) {
        return { query, hits: [], note: `search script not found at ${SCRIPT}` };
    }
    const res = run("bash", [SCRIPT, query], { timeoutMs: 30_000 });
    if (!res.found) {
        return { query, hits: [], note: "bash not available to run the brain search script" };
    }
    const hits = parseHits(res.stdout).slice(0, limit);
    return { query, hits };
}
