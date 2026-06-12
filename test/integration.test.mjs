// test/integration.test.mjs — §9 INTEGRATION layer (node --test, child-process).
// Exercises `pixel scaffold` as a real subprocess. The HEAVY assertion — scaffold → a buildable
// Next 16 app (pnpm install + build) — needs npm + shadcn-registry egress (~2 min); it is gated
// behind PIXEL_TEST_INTEGRATION=1 so the default `pnpm test` stays fast + offline-safe (a
// network-blocked runner must not RED for infra reasons — Wave-V note). The always-on assertions
// check the deterministic, offline contract: the command is wired and its refusal/exit-code
// behaviour holds. The acceptance pipeline (eval/acceptance.mjs) is where the full scaffold→build
// runs red-blocking in CI.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "..", "dist", "cli.js");
const BUILT = existsSync(CLI);
const skip = BUILT ? false : "dist not built — run `pnpm build` first";
const FULL = process.env.PIXEL_TEST_INTEGRATION === "1";

function pixel(args, opts = {}) {
  return spawnSync("node", [CLI, ...args], { encoding: "utf8", timeout: opts.timeoutMs ?? 600_000, maxBuffer: 64 * 1024 * 1024 });
}

// ── always-on: scaffold REFUSES a non-empty target (scaffold, don't overwrite — O10). ───────────
test("scaffold refuses a non-empty target dir (exit non-zero)", { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), "pixel-int-nonempty-"));
  writeFileSync(join(dir, "existing.txt"), "i am here\n");
  const r = pixel(["scaffold", dir, "--base", "radix"], { timeoutMs: 30_000 });
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(r.status, 0, "scaffold into a non-empty dir must refuse with a non-zero exit");
  assert.match(r.stderr + r.stdout, /not empty|fresh directory/i, "must explain the refusal");
});

// ── always-on: the scaffold command is registered with its --base flag. ─────────────────────────
test("scaffold --help lists the --base flag", { skip }, () => {
  const r = pixel(["scaffold", "--help"], { timeoutMs: 30_000 });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /--base/, "scaffold --help should list --base");
});

// ── gated FULL integration: scaffold → a buildable Next 16 app (install + build). ───────────────
test(
  "scaffold → buildable Next 16 app (pnpm install + build)",
  { skip: skip || (!FULL && "set PIXEL_TEST_INTEGRATION=1 to run the network scaffold+build") },
  () => {
    const dir = mkdtempSync(join(tmpdir(), "pixel-int-build-"));
    rmSync(dir, { recursive: true, force: true }); // scaffold wants a fresh (non-existent) dir
    const scaffold = pixel(["scaffold", dir, "--base", "radix"], { timeoutMs: 480_000 });
    assert.equal(scaffold.status, 0, `scaffold should exit 0, got ${scaffold.status}: ${(scaffold.stderr || "").slice(-200)}`);
    assert.ok(existsSync(join(dir, "package.json")), "scaffolded app must have a package.json");

    const install = spawnSync("pnpm", ["install", "--prefer-offline"], { cwd: dir, encoding: "utf8", timeout: 480_000 });
    assert.equal(install.status, 0, `pnpm install should exit 0: ${(install.stderr || "").slice(-200)}`);
    const build = spawnSync("pnpm", ["build"], { cwd: dir, encoding: "utf8", timeout: 480_000, maxBuffer: 64 * 1024 * 1024 });
    rmSync(dir, { recursive: true, force: true });
    assert.equal(build.status, 0, `pnpm build should exit 0 (buildable Next 16 app): ${(build.stderr || "").slice(-200)}`);
  },
);
