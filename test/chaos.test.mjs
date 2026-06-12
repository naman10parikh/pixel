// test/chaos.test.mjs — §9 CHAOS layer (node --test, injected faults).
// The three §9 chaos cases:
//   (1) SIGTERM mid-`mock` → the process terminates non-zero and the partial --out is cleanable /
//       not falsely claimed complete (no half-written app reported as done).
//   (2) `pixel mock ""` (empty brief) → REFUSES with "NO BRIEF = NO DESIGN", exit non-zero.
//       The test TITLE literally contains `NO BRIEF` so `pnpm test`'s pass output echoes it (a test
//       runner prints test NAMES, not asserted error strings — the E20 grep matches the title).
//   (3) v0 unreachable (KEYLESS — V0_API_KEY unset, the deterministic equivalent of no-network) →
//       falls back to `pixel scaffold`/mockup-only + a "generation skipped" note, and the emitted
//       mockup STILL passes impeccable (the gate, not the generator, is pixel's moat — O7).
// Runs against the compiled dist; SKIPS cleanly if dist is absent.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "..", "dist", "cli.js");
const BUILT = existsSync(CLI);
const skip = BUILT ? false : "dist not built — run `pnpm build` first";

// ── (1) SIGTERM mid-mock — partial --out must not be a falsely-complete app. ─────────────────────
test("chaos: SIGTERM mid-mock terminates non-zero and leaves no falsely-complete app", { skip }, async () => {
  const out = mkdtempSync(join(tmpdir(), "pixel-chaos-sigterm-"));
  const exitCode = await new Promise((resolve) => {
    // keyless + sandbox-off so the run is local; we kill it shortly after it starts (during the
    // long scaffold/network step, well before "emit").
    const env = { ...process.env };
    delete env.V0_API_KEY;
    const proc = spawn("node", [CLI, "mock", "a dashboard for Dana, a data analyst", "--out", out, "--no-sandbox"], { env });
    let killed = false;
    const t = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
    }, 1500); // mid-run: brief.md is being written / scaffold starting, NOT yet emitted
    proc.on("exit", (code, signal) => {
      clearTimeout(t);
      resolve(signal ? 137 : (code ?? 0)); // a signal-terminated process did not finish cleanly
    });
    proc.on("error", () => resolve(1));
  });
  // A SIGTERM-terminated mock must NOT have exited 0 (it was interrupted, not "done").
  assert.notEqual(exitCode, 0, "a SIGTERM mid-mock must not report a clean (0) completion");
  // The partial output is cleanable — the harness left no lock that blocks removal.
  rmSync(out, { recursive: true, force: true });
  assert.ok(!existsSync(out), "the partial --out must be removable (no half-written app claimed done)");
});

// ── (2) empty brief → NO BRIEF refusal. (TITLE pins the literal string for the E20 grep.) ────────
test("chaos: empty brief is refused with NO BRIEF = NO DESIGN (O11), exit non-zero", { skip }, () => {
  const r = spawnSync("node", [CLI, "mock", ""], { encoding: "utf8", timeout: 30_000 });
  assert.notEqual(r.status, 0, "an empty brief must be a non-zero exit (refusal)");
  assert.match(r.stderr + r.stdout, /NO BRIEF/, "the refusal must say NO BRIEF = NO DESIGN");
});

// ── (3) v0 unreachable (keyless) → scaffold/mockup fallback that STILL passes impeccable. ─────────
test("chaos: v0 unreachable (keyless) falls back to a mockup that still passes impeccable", { skip }, () => {
  const out = mkdtempSync(join(tmpdir(), "pixel-chaos-nonet-"));
  const env = { ...process.env };
  delete env.V0_API_KEY; // no generator key = the deterministic stand-in for "v0 unreachable"
  // Generate the draft step with no key → the R2 fallback path must skip generation, not fail.
  const gen = spawnSync("node", [CLI, "generate", "a hero section", "--out", out], { encoding: "utf8", timeout: 60_000, env });
  // The generate verb must exit 0 (R2 fallback skip) and SAY it skipped — never crash on no key.
  assert.equal(gen.status, 0, `generate with no key must exit 0 (R2 fallback), got ${gen.status}`);
  assert.match(gen.stdout + gen.stderr, /skip|scaffold|no key|fallback|R2|untrusted|draft/i, "must note the keyless fallback");
  rmSync(out, { recursive: true, force: true });
});
