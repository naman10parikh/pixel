// test/unit.test.mjs — §9 UNIT layer (node --test, zero-dep).
// Unit-tests the pure pieces of pixel's harness side per PLAN §9: the §0 grep-set logic
// (src/lib/grep-set), the house token-prefix validator (src/lib/tokens — the v4 @theme strict
// prefixes), and the taste-check core (src/lib/taste-check). These run against the COMPILED dist
// (built by `pnpm build`); each test SKIPS with a clear message if dist is absent so the suite
// never produces a false RED before the build step. (The CLI arg-parser unit tests live in
// test/cli.test.mjs — this file covers the lib internals.)

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, "..", "dist", "lib");
const BUILT = existsSync(join(DIST, "grep-set.js"));
const skip = BUILT ? false : "dist not built — run `pnpm build` first";

// ── §0 grep-set: the silent-failure linter must FLAG a stale pattern and PASS a clean tree. ──────
test("grep-set flags a stale @studio-freight Lenis import (§4.1)", { skip }, async () => {
  const { runGrepSet } = await import(join(DIST, "grep-set.js"));
  const dir = mkdtempSync(join(tmpdir(), "pixel-unit-grep-"));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "scroll.ts"), `import { ReactLenis } from "@studio-freight/react-lenis";\n`);
  const findings = runGrepSet(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(findings.some((f) => f.id === "stale-lenis"), "must flag the retired @studio-freight import");
});

test("grep-set flags leftover middleware.ts (§1.1 dead-middleware)", { skip }, async () => {
  const { runGrepSet } = await import(join(DIST, "grep-set.js"));
  const dir = mkdtempSync(join(tmpdir(), "pixel-unit-mw-"));
  writeFileSync(join(dir, "middleware.ts"), `export function middleware() {}\n`);
  const findings = runGrepSet(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(findings.some((f) => f.id === "dead-middleware"), "must flag a leftover middleware.ts");
});

test("grep-set passes a CLEAN tree (no false positives)", { skip }, async () => {
  const { runGrepSet } = await import(join(DIST, "grep-set.js"));
  const dir = mkdtempSync(join(tmpdir(), "pixel-unit-clean-"));
  mkdirSync(join(dir, "app"), { recursive: true });
  // correct patterns: lenis from the real pkg, awaited params, no stale directives.
  writeFileSync(join(dir, "app", "page.tsx"), `import { useLenis } from "lenis/react";\nexport default async function P({ params }) { const { id } = await params; return id; }\n`);
  const findings = runGrepSet(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(findings.length, 0, `clean tree should have 0 findings, got: ${JSON.stringify(findings)}`);
});

// ── token-prefix validator: the v4 @theme block must use the STRICT --color-/--font- prefixes. ───
test("house @theme uses the strict v4 prefixes (§2.1) — warm-black + non-purple accent", { skip }, async () => {
  const { HOUSE_THEME_CSS } = await import(join(DIST, "tokens.js"));
  assert.match(HOUSE_THEME_CSS, /@import\s+["']tailwindcss["']/, "must @import tailwindcss (v4)");
  assert.match(HOUSE_THEME_CSS, /--color-[a-z]/, "must use the strict --color- prefix (or the utility silently won't generate)");
  assert.match(HOUSE_THEME_CSS, /--font-[a-z]/, "must use the strict --font- prefix");
  assert.match(HOUSE_THEME_CSS, /#141312/, "must carry the warm-black base (O-HS1), never #000");
  assert.doesNotMatch(HOUSE_THEME_CSS, /#6b21a8|#581c87|#8B5CF6|\bindigo\b|\bpurple\b/i, "must NOT carry the violet-family slop prior (O-F1)");
});

// ── taste-check core: a snippet with a slop tell must be flagged; a clean snippet must pass. ──────
test("taste-check flags an indigo/purple slop tell (O-F1)", { skip }, async () => {
  const { tasteCheck } = await import(join(DIST, "taste-check.js"));
  const r = tasteCheck(`<div className="bg-indigo-500 text-white">hi</div>`);
  assert.ok(Array.isArray(r.slop_rules_hit), "taste-check returns a slop_rules_hit array");
  assert.ok(r.slop_rules_hit.length > 0, "an indigo class is a slop tell — must be flagged");
});
