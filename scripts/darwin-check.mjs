#!/usr/bin/env node
// scripts/darwin-check.mjs — a tiny, VENDORED DSIP-grade shim (A24).
// `darwin-check` (the Darwin/openendedness tool) is NOT on PATH and NOT in this repo, so the
// RSI-deterministic gate row in HARNESS-OVERRIDES cannot be proven by it. This shim is the
// falsifiable in-repo proof: it reads dsip.json and asserts the L1 contract — the level pixel
// targets NOW (evals gate merges; the Claude half is deferred, D8). It prints the achieved grade
// (`L1`) and exits 0 when ALL of these hold, non-zero (and prints WHY) otherwise:
//
//   1. dsip.json parses and declares a deterministic eval rubric (eval/) with noSelfGrading: true.
//   2. eval/eval.mjs exists (the golden-task engine, E18).
//   3. the L1 deterministic golden tasks actually RUN GREEN (eval/eval.mjs --l1-only exits 0) —
//      i.e. the evals that gate merges pass on the fixtures right now. This is the teeth: the grade
//      is earned by a real run, not asserted from metadata.
//
// Usage: `node scripts/darwin-check.mjs [dsip.json]`. A24's verify calls this unconditionally.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..");
const dsipPath = resolve(process.argv[2] ?? join(REPO, "dsip.json"));

function fail(msg) {
  console.error(`darwin-check: NOT L1 — ${msg}`);
  process.exit(1);
}

// ── 1 · dsip.json contract ─────────────────────────────────────────────────────────────────────
if (!existsSync(dsipPath)) fail(`dsip.json not found at ${dsipPath}`);
let dsip;
try {
  dsip = JSON.parse(readFileSync(dsipPath, "utf8"));
} catch (err) {
  fail(`dsip.json is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
}
if (!dsip.eval || typeof dsip.eval !== "object") fail("dsip.json has no `eval` block");
if (dsip.eval.noSelfGrading !== true) fail("dsip.eval.noSelfGrading must be true (no self-grading)");
if (!/eval\//.test(String(dsip.eval.rubric ?? ""))) fail("dsip.eval.rubric must point at the eval/ rubric");

// ── 2 · the eval engine exists ───────────────────────────────────────────────────────────────────
const evalEngine = join(REPO, "eval", "eval.mjs");
if (!existsSync(evalEngine)) fail("eval/eval.mjs (the golden-task engine) is missing");

// ── 3 · the L1 golden tasks RUN GREEN (the earned part of the grade) ─────────────────────────────
const r = spawnSync("node", [evalEngine, "--l1-only"], { encoding: "utf8", timeout: 120_000, cwd: REPO });
if (r.status !== 0) {
  process.stderr.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  fail("the L1 golden tasks did not run green (eval/eval.mjs --l1-only exited non-zero)");
}

// ── verdict ──────────────────────────────────────────────────────────────────────────────────────
// All three held: deterministic eval rubric + noSelfGrading + L1 greens. pixel is at DSIP level L1
// (evals gate merges). L2 (the nightly loop writes diffs) is wired via rsi.yml; L3 (the loop
// improves itself) is the Claude-half stretch (deferred, D8).
console.log("L1");
process.exit(0);
