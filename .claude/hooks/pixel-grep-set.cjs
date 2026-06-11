#!/usr/bin/env node
/**
 * pixel-grep-set — the §0 SILENT-FAILURE grep-set, as a hook.
 * Blocks a coding agent from committing/writing the stale patterns that compile
 * green and misbehave at runtime (brain/KNOWN-PITFALLS.md §0).
 *
 * DUAL MODE:
 *   1. STDIN / Claude Code PreToolUse hook (no path arg):
 *        reads the tool payload from stdin, scans Edit|Write content + the target
 *        file_path, and on a hit emits a `permissionDecision: deny` so the write is
 *        BLOCKED before it lands. No hit → "{}" (allow).
 *   2. STANDALONE / PreCommit lint (one-or-more file path args):
 *        `node .claude/hooks/pixel-grep-set.js path [path...]`
 *        scans each file on disk, prints the pitfall to stderr, exits NON-ZERO on a hit.
 *        This is the form used by the B10 verify line and a git pre-commit hook.
 *
 * Wired in .claude/settings.json under hooks.PreToolUse (matcher "Edit|Write").
 *
 * The §0 patterns (KNOWN-PITFALLS §0 + §1.1/§4.1/§2.5/§1.7):
 *   - @studio-freight/*           → retired Lenis pkg (April 2026); use lenis / lenis/react
 *   - sync params. access         → Next 16 made params/searchParams Promises; sync form removed
 *   - @tailwind directive         → removed in Tailwind v4; use @import "tailwindcss"
 *   - middleware.ts               → dead code in Next 16; rename to proxy.ts (+ export proxy)
 *   - images.domains              → deprecated; use remotePatterns
 *   - next/legacy/image           → use next/image
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(
  process.env.HOME || "/tmp",
  ".claude",
  "hooks-logs",
);

// Each rule: id, a content regex, a one-line pitfall message (cites the § / fix).
// `fileOnly` rules match on the file PATH rather than its content (e.g. middleware.ts).
const RULES = [
  {
    id: "stale-lenis",
    regex: /@studio-freight\//,
    msg: "PITFALL (§4.1): @studio-freight/* is the RETIRED Lenis pkg (April 2026). Use `lenis` / `lenis/react`.",
  },
  {
    id: "sync-params",
    // `params.` or `searchParams.` NOT preceded by `await ` on the same access —
    // Next 16 made them Promises; the sync form was REMOVED (compiles, broken).
    regex: /(?<!await\s)(?<!await )\b(?:params|searchParams)\.[A-Za-z_$]/,
    msg: "PITFALL (§1.2): `params`/`searchParams` are Promises in Next 16 — the sync `.prop` access compiles but is broken. `await` them first.",
  },
  {
    id: "tailwind-directive",
    regex: /@tailwind\s+(?:base|components|utilities)/,
    msg: 'PITFALL (§2.5): `@tailwind base/components/utilities` directives were removed in Tailwind v4. Use a single `@import "tailwindcss"`.',
  },
  {
    id: "images-domains",
    regex: /images\.domains\b|["']domains["']\s*:/,
    msg: "PITFALL (§1.7): `images.domains` is deprecated in Next 16. Use `images.remotePatterns`.",
  },
  {
    id: "legacy-image",
    regex: /next\/legacy\/image/,
    msg: "PITFALL (§1.7): `next/legacy/image` is stale. Use `next/image`.",
  },
  {
    id: "dead-middleware",
    fileOnly: true,
    // basename is exactly middleware.ts / middleware.js at the project/src/app root
    regex: /(^|\/)middleware\.(ts|js|tsx|mjs)$/,
    msg: "PITFALL (§1.1): `middleware.ts` is DEAD CODE in Next 16 — Edge middleware is gone. Rename the file to `proxy.ts` and the export to `proxy`.",
  },
];

function log(data) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const file = path.join(
      LOG_DIR,
      `${new Date().toISOString().slice(0, 10)}.jsonl`,
    );
    fs.appendFileSync(
      file,
      JSON.stringify({ ts: new Date().toISOString(), hook: "pixel-grep-set", ...data }) + "\n",
    );
  } catch {
    /* never fatal */
  }
}

/**
 * Scan content + path against the §0 rules. Returns the FIRST hit {id, msg} or null.
 * `content` may be empty (path-only scan); `filePath` may be "" (content-only scan).
 */
function scan(content, filePath) {
  for (const r of RULES) {
    if (r.fileOnly) {
      if (filePath && r.regex.test(filePath)) return { id: r.id, msg: r.msg };
    } else if (content && r.regex.test(content)) {
      return { id: r.id, msg: r.msg };
    }
  }
  return null;
}

// ── MODE 2: standalone / PreCommit (path args) ──────────────────────────────
function runStandalone(paths) {
  let hits = 0;
  for (const p of paths) {
    let content = "";
    try {
      content = fs.readFileSync(p, "utf8");
    } catch {
      // path may not exist on disk yet (e.g. a staged-but-deleted check) —
      // still scan the path itself for fileOnly rules.
    }
    const hit = scan(content, p);
    if (hit) {
      hits++;
      process.stderr.write(`✗ ${p}\n  [${hit.id}] ${hit.msg}\n`);
      log({ level: "BLOCKED", mode: "standalone", id: hit.id, file: p });
    }
  }
  process.exit(hits > 0 ? 1 : 0);
}

// ── MODE 1: stdin / Claude Code PreToolUse ──────────────────────────────────
async function runStdin() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  try {
    const data = JSON.parse(input || "{}");
    const { tool_name, tool_input, session_id, cwd } = data;
    if (tool_name !== "Edit" && tool_name !== "Write" && tool_name !== "MultiEdit") {
      return console.log("{}");
    }
    // Edit → new_string; Write → content; MultiEdit → join all edits' new_string.
    const filePath = tool_input?.file_path || "";
    let content = "";
    if (typeof tool_input?.content === "string") content = tool_input.content;
    else if (typeof tool_input?.new_string === "string") content = tool_input.new_string;
    else if (Array.isArray(tool_input?.edits))
      content = tool_input.edits.map((e) => e?.new_string || "").join("\n");

    const hit = scan(content, filePath);
    if (hit) {
      log({ level: "BLOCKED", mode: "PreToolUse", id: hit.id, file: filePath, session_id, cwd });
      return console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: `⛔ pixel §0 grep-set [${hit.id}] ${hit.msg}`,
          },
        }),
      );
    }
    console.log("{}");
  } catch (e) {
    log({ level: "ERROR", error: e.message });
    console.log("{}"); // fail-open: never wedge a session on a parse error
  }
}

if (require.main === module) {
  const pathArgs = process.argv.slice(2);
  if (pathArgs.length > 0) runStandalone(pathArgs);
  else runStdin();
} else {
  module.exports = { scan, RULES };
}
