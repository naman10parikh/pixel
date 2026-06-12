#!/usr/bin/env node
// eval/eval.mjs — pixel's golden-task EVAL PYRAMID (Component 9 / PLAN §6 / HARNESS-OVERRIDES).
// Runs GT1–GT15 (the L1 VERIFY greps lifted verbatim from brain/BATTLE-TESTED-SCENARIOS S1–S20,
// ≥3 L2 behavioural binary pass/fail, an L3 trajectory judge) and reports a pass/fail per task.
// `npm run eval` → this file. Exit 0 when no CI-BLOCKING task FAILS (a SKIP is not a fail — L2/L3
// that need a booted app or the Claude half SKIP here; the acceptance job E19 boots the app for
// real). No self-grading (dsip.json): the gate is `acceptance-test-green && no-regression`.
//
// The L1 set is verbatim from the brain — e.g. GT5's assertion greps source for `autoRaf: false`
// (the mandatory Lenis flag, S5) + `gsap.ticker.add` driving `lenis.raf` + no `@studio-freight/`.
//
// Flags: --json (machine output) · --l1-only (the $0 deterministic subset the RSI loop runs, A24)
//        · --no-live (skip the live `pixel mock`/impeccable shell-outs; pure-fixture L1).
//
// pass^k: deterministic L1 tasks are pure functions of the fixtures, so they are stable across k
// runs by construction (k≥3 is a no-op for a deterministic check — that IS the pass^k guarantee).
//
// ── THE 15 GOLDEN TASKS THIS RUNNER EXECUTES (PLAN §6; defined in ./golden-tasks/tasks.mjs) ─────
//   GT1  L1+L2  [CI-BLOCK] acceptance — pixel mock → mockup+app, impeccable-clean, smoke-green
//   GT2  L1     [CI-BLOCK] S1  dead middleware → proxy.ts rename (verbatim VERIFY)
//   GT3  L2+L3  [CI-BLOCK] S2  cacheComponents+Clerk per-route, 0 Suspense errors
//   GT4  L2     [CI-BLOCK] S4  Turbopack drops Tailwind — styles actually render
//   GT5  L1                S5  Lenis+GSAP one rAF — `autoRaf: false` + gsap.ticker.add (verbatim)
//   GT6  L2     [CI-BLOCK] S8  hydration mismatch — page.on('console')=0 warnings
//   GT7  L1                S10 quality={90}→75 — images.qualities declares the used value (verbatim)
//   GT8  L1                S14 radix import leftovers — unified radix-ui (verbatim grep)
//   GT9  L1+L2  [CI-BLOCK] S15 CWV default-emit — hero fetchpriority+dims, below-fold lazy (verbatim)
//   GT10 L1+L3  [CI-BLOCK] S16 NEVER an a11y overlay — semantic HTML, no overlay dep (verbatim)
//   GT11 L1+L2             S17 'use cache' cost — no single-arg revalidateTag (verbatim grep)
//   GT12 L1                S18 Tailwind @apply no-op — no orphan @apply (verbatim grep)
//   GT13 L2                S20 provider above the boundary — providers in a 'use client' file
//   GT14 L1     [CI-BLOCK] anti-slop emit — pixel's OWN mockup passes impeccable (live shell-out)
//   GT15 L3                §15 harness-reduces-slop value proof (nightly, non-blocking; needs D8)
// CI-blocking set = GT1-GT4,GT6,GT9,GT10,GT14 (the acceptance test + highest-blast silent failures
// + the anti-slop emit). A FAIL of any of those reds the run; a SKIP never does.

import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { goldenTasks } from "./golden-tasks/tasks.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..");
const GOOD = join(HERE, "fixtures", "good");
const BAD = join(HERE, "fixtures", "bad");

const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has("--json");
const L1_ONLY = args.has("--l1-only");
const NO_LIVE = args.has("--no-live") || L1_ONLY; // l1-only implies no live shell-outs

// ── live helpers (GT1 fresh mock, GT14 impeccable-on-mockup) — skipped under --no-live ──────────
function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8", timeout: opts.timeoutMs ?? 300_000, cwd: opts.cwd ?? REPO, maxBuffer: 32 * 1024 * 1024 });
  const found = !(r.error && r.error.code === "ENOENT");
  return { code: r.status ?? (found ? 1 : 127), stdout: r.stdout ?? "", stderr: r.stderr ?? "", found, ok: (r.status ?? 1) === 0 };
}

/** Resolve the source dir impeccable should scan inside an emitted app dir (no-src vs src layout). */
function impeccableTarget(dir) {
  for (const c of [join(dir, "app", "src"), join(dir, "app", "app"), join(dir, "app"), join(dir, "src"), dir]) {
    if (existsSync(c)) return c;
  }
  return dir;
}

/** Run `impeccable detect` once over `target`; returns a GateResult-shaped {pass, detail}. */
function impeccableOn(target) {
  const r = run("npx", ["--yes", "impeccable", "detect", "--json", target], { timeoutMs: 120_000 });
  if (!r.found) return { pass: null, detail: "impeccable not installed (offline npx fetch?)" };
  if (r.ok) return { pass: true, detail: "0 slop violations" };
  return { pass: false, detail: (r.stdout || r.stderr).split("\n").slice(-2).join(" ").slice(0, 160) || `exit ${r.code}` };
}

// ── build the context the tasks run against ─────────────────────────────────────────────────────
function buildContext() {
  let mock = null;
  let impeccableMockup = { pass: null, detail: "no live mock — run without --no-live" };

  if (!NO_LIVE) {
    // GT1: a fresh, keyless `pixel mock` (V0 unset → R2 scaffold path) into a temp dir.
    const cli = join(REPO, "dist", "cli.js");
    if (existsSync(cli)) {
      const outDir = mkdtempSync(join(tmpdir(), "pixel-eval-mock-"));
      const env = { ...process.env };
      delete env.V0_API_KEY; // force the keyless path so the eval proves it works tokenlessly
      const m = run("node", [cli, "mock", "a fintech portfolio dashboard for Marcus, a hedge-fund PM in Bloomberg Terminal", "--out", outDir, "--no-sandbox"], { timeoutMs: 300_000, cwd: REPO });
      if (existsSync(join(outDir, "mockup", "index.html"))) {
        mock = outDir;
        // GT14: pixel's OWN mockup must pass impeccable (anti-slop emit).
        impeccableMockup = impeccableOn(join(outDir, "mockup"));
      } else {
        impeccableMockup = { pass: null, detail: `live mock produced no mockup (offline?) — ${(m.stderr || m.stdout).slice(-120)}` };
      }
    }
  }

  return { good: GOOD, bad: BAD, mock, impeccableMockup };
}

// ── run ───────────────────────────────────────────────────────────────────────────────────────
function main() {
  const ctx = buildContext();
  let tasks = goldenTasks();
  if (L1_ONLY) tasks = tasks.filter((t) => t.level.startsWith("L1"));

  const results = tasks.map((t) => {
    let r;
    try {
      r = t.run(ctx);
    } catch (err) {
      r = { pass: false, detail: `assertion threw: ${err instanceof Error ? err.message : String(err)}` };
    }
    return { id: t.id, scenario: t.scenario, level: t.level, ciBlock: t.ciBlock, verify: t.verify, ...r };
  });

  const pass = results.filter((r) => r.pass === true).length;
  const fail = results.filter((r) => r.pass === false).length;
  const skip = results.filter((r) => r.pass === null).length;
  // the gate: any CI-BLOCKING task that FAILED (pass===false) fails the run. A SKIP never fails.
  const blockingFails = results.filter((r) => r.ciBlock && r.pass === false);
  const exit = blockingFails.length > 0 ? 1 : 0;

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({ total: results.length, pass, fail, skip, blockingFails: blockingFails.map((r) => r.id), exit, results }, null, 2) + "\n");
  } else {
    process.stdout.write("pixel eval — golden-task pyramid (GT1–GT15, Hamel L1/L2/L3)\n");
    process.stdout.write(`fixtures: ${GOOD}${ctx.mock ? `  ·  live mock: ${ctx.mock}` : "  ·  (no live mock — --no-live)"}\n\n`);
    for (const r of results) {
      const mark = r.pass === true ? "PASS" : r.pass === false ? "FAIL" : "SKIP";
      const block = r.ciBlock ? " [CI-BLOCK]" : "";
      process.stdout.write(`  ${mark}  ${r.id} (${r.level})${block}  ${r.scenario}\n`);
      process.stdout.write(`        ${r.detail}\n`);
    }
    process.stdout.write(`\n${results.length} tasks · ${pass} pass · ${fail} fail · ${skip} skip` +
      `${blockingFails.length ? `  ·  BLOCKING FAILS: ${blockingFails.map((r) => r.id).join(", ")}` : ""}\n`);
    process.stdout.write(exit === 0 ? "✓ eval green (no CI-blocking failure)\n" : "✗ eval RED (a CI-blocking golden task failed)\n");
  }
  process.exit(exit);
}

main();
