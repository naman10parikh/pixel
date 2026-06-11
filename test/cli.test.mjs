// test/cli.test.mjs — B8 parser tests (node --test, zero-dep).
// Exercises the compiled CLI: --version exits 0, `mock --help` lists the flagship flags, the
// help text registers every §4 verb, and `design ""` refuses with NO BRIEF (the O11 gate).
// Runs against dist/cli.js (built by `pnpm build`); skips with a clear message if dist is absent
// so the suite never produces a false RED when the build step hasn't run.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(here, "..", "dist", "cli.js");
const BUILT = existsSync(CLI);

function pixel(args) {
  return spawnSync("node", [CLI, ...args], { encoding: "utf8" });
}

test("dist/cli.js is built", () => {
  assert.ok(BUILT, "dist/cli.js missing — run `pnpm build` first");
});

test("--version exits 0 and prints a semver", { skip: !BUILT }, () => {
  const r = pixel(["--version"]);
  assert.equal(r.status, 0, `--version should exit 0, got ${r.status}`);
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+/, "should print a semver");
});

test("--help registers every §4 verb", { skip: !BUILT }, () => {
  const r = pixel(["--help"]);
  assert.equal(r.status, 0);
  for (const verb of ["mock", "scaffold", "design", "generate", "audit", "verify", "migrate", "cockpit", "logs"]) {
    assert.match(r.stdout, new RegExp(`\\b${verb}\\b`), `help should list '${verb}'`);
  }
});

test("mock --help lists --out / --no-sandbox / --json", { skip: !BUILT }, () => {
  const r = pixel(["mock", "--help"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /--out/, "mock --help should list --out");
  assert.match(r.stdout, /--no-sandbox/, "mock --help should list --no-sandbox");
  assert.match(r.stdout, /--json/, "mock --help should list --json");
});

test("design \"\" refuses with NO BRIEF (O11) and exits non-zero", { skip: !BUILT }, () => {
  const r = pixel(["design", ""]);
  assert.notEqual(r.status, 0, "empty brief must be a non-zero exit (refusal)");
  assert.match(r.stderr + r.stdout, /NO BRIEF/, "refusal message must say NO BRIEF");
});

test("an unknown command exits non-zero", { skip: !BUILT }, () => {
  const r = pixel(["definitely-not-a-verb"]);
  assert.notEqual(r.status, 0, "unknown command should be a non-zero exit");
});
