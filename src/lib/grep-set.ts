// src/lib/grep-set.ts — the §0 SILENT-FAILURE ASSERTION GREP-SET (KNOWN-PITFALLS §0).
// The single highest-leverage habit in this stack: after ANY codemod/upgrade or Tailwind
// change, compile-green ≠ working. These checks catch the class that passes `tsc`/`next build`
// then misbehaves at runtime. Reused by `pixel verify` (post-change blind-spot check) and the
// `.claude/hooks/pixel-grep-set.js` PreCommit hook (B10, separate stream — this lib is the
// shared source of truth for the patterns so the two never drift).

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

/** One silent-failure finding in a scanned tree. */
export interface GrepFinding {
  readonly id: string; // the §0 rule id, e.g. "params-sync", "stale-lenis"
  readonly file: string; // path of the offending file
  readonly line?: number; // 1-based line number when matched in content
  readonly message: string; // the pitfall message (what's wrong + the fix)
}

const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

/** Recursively collect scannable source files under `root`. */
function collectFiles(root: string): string[] {
  const out: string[] = [];
  if (!existsSync(root)) return out;
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue; // dangling symlink etc. — skip, don't abort the scan
      }
      if (st.isDirectory()) {
        if (!SKIP_DIRS.has(entry)) walk(full);
      } else if (SCAN_EXTS.has(extname(entry))) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}

// Content-level patterns. Each = { id, regex, message, exts? }. Kept verbatim-faithful to the
// KNOWN-PITFALLS §0 grep lines so the harness asserts exactly what the brain says to assert.
interface Pattern {
  readonly id: string;
  readonly regex: RegExp;
  readonly message: string;
  readonly exts?: ReadonlySet<string>;
}

// Patterns are anchored to real USAGE (imports, CSS directives, config keys, calls) — not bare
// substring mentions — so a comment/doc that NAMES a stale pattern doesn't fail the scan, and
// only an app that actually USES it does. Lines carrying the "PITFALL §" message marker are
// skipped (that marker only appears in this harness's own messages, never in a scanned app).
const PATTERNS: readonly Pattern[] = [
  {
    // §0 #3 — stale Lenis package (retired April 2026). Match a real import/require, not a mention.
    id: "stale-lenis",
    regex: /(?:from|require\(|import\()\s*['"`]@studio-freight\//,
    message:
      "PITFALL §4.1: '@studio-freight/*' Lenis packages were retired April 2026 — use 'lenis' / 'lenis/react'.",
  },
  {
    // §0 #4 — stale Tailwind directive at line start (a real CSS directive, not a sentence).
    id: "stale-tailwind-directive",
    regex: /^\s*@tailwind\s+(base|components|utilities)\b/,
    message:
      "PITFALL §2.5: '@tailwind base/components/utilities' directives were removed in v4 — use @import \"tailwindcss\".",
  },
  {
    // §0 #5 — stale image API: a `domains:` config key under images, or a next/legacy/image import.
    id: "stale-image-api",
    regex: /(?:from|require\(|import\()\s*['"`]next\/legacy\/image['"`]|^\s*domains\s*:/,
    message:
      "PITFALL §1.7: images.domains is deprecated and next/legacy/image is gone — use remotePatterns / next/image.",
  },
  {
    // §1.4 — single-arg revalidateTag call (drops SWR in 16). String-literal arg, no 2nd profile arg.
    id: "revalidatetag-1arg",
    regex: /\brevalidateTag\(\s*['"`][\w.-]+['"`]\s*\)/,
    message:
      "PITFALL §1.4: single-arg revalidateTag(tag) silently loses SWR in Next 16 — add a profile e.g. revalidateTag(tag,'max'), or use updateTag(tag).",
  },
];

/**
 * Run the silent-failure grep-set over a tree. Returns every finding (empty = clean).
 * File-existence checks (#1 sync-params target dirs, #2 dead middleware) are handled
 * separately below because they assert on paths, not file content.
 */
export function runGrepSet(root: string): GrepFinding[] {
  const findings: GrepFinding[] = [];

  // §0 #2 — leftover middleware.ts (must be proxy.ts in Next 16). A path assertion.
  for (const dir of [root, join(root, "src"), join(root, "app")]) {
    const mw = join(dir, "middleware.ts");
    if (existsSync(mw)) {
      findings.push({
        id: "dead-middleware",
        file: mw,
        message:
          "PITFALL §1.1: middleware.ts is dead code in Next 16 — rename file to proxy.ts and export `proxy`.",
      });
    }
  }

  // Content patterns across the source tree.
  const files = collectFiles(root);
  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    for (const pat of PATTERNS) {
      if (pat.exts && !pat.exts.has(extname(file))) continue;
      for (let i = 0; i < lines.length; i++) {
        // Skip a line that carries the harness's own pitfall-message marker — it appears only in
        // pixel's own source (this scanner's messages), never in a scanned app tree.
        if (lines[i].includes("PITFALL §")) continue;
        if (pat.regex.test(lines[i])) {
          findings.push({
            id: pat.id,
            file,
            line: i + 1,
            message: pat.message,
          });
        }
      }
    }

    // §0 #1 — residual SYNC params/searchParams access (Next 16 made them Promises). We flag a
    // `params.` / `searchParams.` member access only when it is NOT preceded by `await ` on the
    // same line and not destructured-from-await — a heuristic, faithful to the §0 comment that
    // expects "only awaited or destructured-from-await" usages to remain.
    if ([".ts", ".tsx"].includes(extname(file))) {
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        if (!/\b(params|searchParams)\s*\./.test(ln)) continue;
        if (/\bawait\b/.test(ln)) continue; // awaited on this line — fine
        findings.push({
          id: "params-sync",
          file,
          line: i + 1,
          message:
            "PITFALL §1.2: params/searchParams are Promises in Next 16 — `await` them (the sync form was removed, not warned).",
        });
      }
    }
  }

  return findings;
}

/** The pattern ids, exported so the B10 hook can reuse the exact same set. */
export const GREP_SET_RULES = PATTERNS.map((p) => p.id).concat([
  "dead-middleware",
  "params-sync",
]);
