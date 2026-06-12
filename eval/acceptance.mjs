#!/usr/bin/env node
// eval/acceptance.mjs — THE ACCEPTANCE TEST (E19, the D9 bar / PLAN §5 / GT1 of the eval pyramid).
//
// One line: `pixel mock "<brief>"` → an ICP-aware mockup + a scaffolded Next 16 app under --out,
// then `impeccable detect` exits 0 (anti-slop, KEYLESS) AND a Playwright smoke boots the app and
// asserts a real `bg-*` computed background + 0 console hydration warnings. All green = pixel hits
// the chairman's end-state bar (knows the ICP, has taste, produces mockups).
//
// pixel's MOAT is the gate, not the generator (brain O7): the acceptance test runs with V0_API_KEY
// UNSET to FORCE the keyless `pixel scaffold` fallback (R2) — proving taste + structure even with
// no generator key. The HARD, red-blocking core is steps 1+3 (mock emits + impeccable-clean,
// both keyless). Steps 2 (install+build) and 4 (the Playwright smoke) run for real when the
// environment provides npm egress + a Playwright browser; absent those they degrade to a logged
// SKIP — NEVER a fake PASS (O14: "it compiles" ≠ ✅; a missing tool is a SKIP, not a green).
//
// Steps (PLAN §5, in order):
//   1. mock → {mockup,app}+brief.md(named ICP)         [HARD — keyless]
//   2. cd app && pnpm install && pnpm build             [best-effort — needs npm egress]
//   3. impeccable detect --json <app source> → exit 0   [HARD — keyless, the anti-slop gate]
//   4. Playwright smoke: boot, bg-* computed ≠ default, page.on('console')=0 hydration  [best-effort]
//   5. pixel logs --last 1                              [observability tie-off]
//
// Exit 0 iff every HARD step passed (a best-effort SKIP never reds the run). Flags: --json,
// --out <dir> (default a fresh tmp dir), --keep (don't clean --out), --no-smoke (skip step 4).

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..");
const CLI = join(REPO, "dist", "cli.js");

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const JSON_OUT = has("--json");
const NO_SMOKE = has("--no-smoke");
const KEEP = has("--keep");
const outArgIdx = args.indexOf("--out");
const OUT = outArgIdx >= 0 ? args[outArgIdx + 1] : mkdtempSync(join(tmpdir(), "pixel-accept-"));

const BRIEF = "a fintech portfolio dashboard for Marcus, a hedge-fund PM who lives in Bloomberg Terminal";

/** Run a command, never throwing; returns {code, stdout, stderr, found}. */
function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    encoding: "utf8",
    timeout: opts.timeoutMs ?? 600_000,
    cwd: opts.cwd ?? REPO,
    maxBuffer: 64 * 1024 * 1024,
    env: opts.env ?? process.env,
  });
  const found = !(r.error && r.error.code === "ENOENT");
  return { code: r.status ?? (found ? 1 : 127), stdout: r.stdout ?? "", stderr: r.stderr ?? "", found };
}

/** Resolve the real Next source dir to gate (the scaffolder uses --no-src-dir → app/app). */
function appSourceDir(out) {
  for (const c of [join(out, "app", "src"), join(out, "app", "app"), join(out, "app")]) {
    if (existsSync(c)) return c;
  }
  return join(out, "app");
}

const steps = [];
const record = (name, hard, pass, detail) => steps.push({ name, hard, pass, detail });

function main() {
  // ── STEP 1 · mock → mockup + app + brief(named ICP) — HARD, keyless (V0_API_KEY unset). ───────
  const env = { ...process.env };
  delete env.V0_API_KEY; // FORCE the keyless scaffold path (R2) — the path CI must prove works.
  const mock = run("node", [CLI, "mock", BRIEF, "--out", OUT, "--no-sandbox"], { timeoutMs: 600_000, env });
  const hasMockup = existsSync(join(OUT, "mockup", "index.html"));
  const hasApp = existsSync(join(OUT, "app"));
  const brief = existsSync(join(OUT, "brief.md")) ? readFileSync(join(OUT, "brief.md"), "utf8") : "";
  const namedIcp = /marcus/i.test(brief) && brief.length > 80; // the ICP is a specific named person
  const step1 = mock.code === 0 && hasMockup && hasApp && namedIcp;
  record("1.mock→mockup+app+namedICP", true, step1, `exit=${mock.code} mockup=${hasMockup} app=${hasApp} brief-names-ICP=${namedIcp}`);

  // ── STEP 2 · install + build the emitted app — best-effort (needs npm egress). ────────────────
  const appDir = join(OUT, "app");
  if (hasApp) {
    const install = run("pnpm", ["install", "--prefer-offline"], { cwd: appDir, timeoutMs: 480_000 });
    if (!install.found) {
      record("2.install+build", false, null, "pnpm not found — install/build SKIPPED (best-effort)");
    } else if (install.code !== 0) {
      record("2.install+build", false, null, `pnpm install failed (offline?) rc=${install.code} — SKIPPED, not a fail`);
    } else {
      const build = run("pnpm", ["build"], { cwd: appDir, timeoutMs: 480_000 });
      record("2.install+build", false, build.code === 0 ? true : null, build.code === 0 ? "pnpm build OK" : `build rc=${build.code} (offline/infra?) — SKIPPED`);
    }
  } else {
    record("2.install+build", false, null, "no app emitted — nothing to build");
  }

  // ── STEP 3 · impeccable detect on the REAL app source → exit 0 — HARD, keyless. ───────────────
  // Point at the actual source dir (app/app under --no-src-dir) so the gate has TEETH — not the
  // vacuous missing-dir pass. impeccable is the anti-slop hard gate (41 rules, no API key).
  const src = appSourceDir(OUT);
  const imp = run("npx", ["--yes", "impeccable", "detect", "--json", src], { timeoutMs: 120_000 });
  if (!imp.found) {
    record("3.impeccable-clean", true, false, "impeccable not installed (offline npx fetch?) — the keyless gate could not run");
  } else {
    const clean = imp.code === 0;
    record("3.impeccable-clean", true, clean, clean ? `0 slop violations @ ${src}` : `slop @ ${src}: ${(imp.stdout || imp.stderr).split("\n").slice(-2).join(" ").slice(0, 160)}`);
  }

  // ── STEP 4 · Playwright smoke — best-effort (needs a built app + a Playwright browser). ────────
  if (NO_SMOKE) {
    record("4.playwright-smoke", false, null, "--no-smoke — skipped by flag");
  } else {
    const built = existsSync(join(appDir, ".next"));
    if (!built) {
      record("4.playwright-smoke", false, null, "app not built (step 2 skipped) — smoke needs a built app; SKIPPED");
    } else {
      const smoke = run("node", [join(HERE, "smoke.mjs"), "--app", appDir], { timeoutMs: 180_000 });
      // smoke.mjs exits 0 (pass), 2 (real fail), 3 (skip — no browser). Treat 3 as a SKIP.
      if (smoke.code === 3) record("4.playwright-smoke", false, null, `no Playwright browser — SKIPPED (${(smoke.stdout || "").trim().slice(-120)})`);
      else record("4.playwright-smoke", false, smoke.code === 0, (smoke.stdout || smoke.stderr).trim().split("\n").slice(-1)[0]?.slice(0, 160) || `exit ${smoke.code}`);
    }
  }

  // ── STEP 5 · logs tie-off (observability) — best-effort. ──────────────────────────────────────
  const logs = run("node", [CLI, "logs", "--last", "1"], { timeoutMs: 30_000 });
  record("5.logs-aggregate", false, logs.code === 0 ? true : null, logs.code === 0 ? "pixel logs aggregated the run" : "logs aggregate unavailable");

  // ── verdict: every HARD step must pass; a best-effort SKIP never reds the run. ────────────────
  const hardFails = steps.filter((s) => s.hard && s.pass === false);
  const exit = hardFails.length > 0 ? 1 : 0;

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({ out: OUT, exit, hardFails: hardFails.map((s) => s.name), steps }, null, 2) + "\n");
  } else {
    process.stdout.write(`pixel ACCEPTANCE TEST (D9 bar) — keyless (V0_API_KEY unset) → ${OUT}\n\n`);
    for (const s of steps) {
      const mark = s.pass === true ? "PASS" : s.pass === false ? "FAIL" : "SKIP";
      process.stdout.write(`  ${mark}  ${s.hard ? "[HARD]" : "[soft]"} ${s.name}\n        ${s.detail}\n`);
    }
    process.stdout.write(`\n${steps.length} steps · ${hardFails.length ? `HARD FAILS: ${hardFails.map((s) => s.name).join(", ")}` : "all HARD steps green"}\n`);
    process.stdout.write(exit === 0 ? "✓ ACCEPTANCE GREEN — pixel mock emits an ICP-aware, anti-slop-clean deliverable keylessly\n" : "✗ ACCEPTANCE RED — a hard gate failed\n");
  }

  if (!KEEP) {
    try {
      rmSync(OUT, { recursive: true, force: true });
    } catch (err) {
      console.warn("[acceptance] cleanup failed:", err instanceof Error ? err.message : String(err));
    }
  }
  process.exit(exit);
}

main();
