#!/usr/bin/env node
// workflows/rsi.workflow.js — pixel's $0 DETERMINISTIC DSIP loop (RSI engine, A24 / PLAN §11).
// The tokenless half of the Darwin Self-Improvement Protocol (dsip.json). Runs nightly via
// .github/workflows/rsi.yml (D15, armed cron) and on demand. NO API key — `impeccable detect` and
// `npm view` are keyless; the Claude half (LLM brain-refresh) is DEFERRED to CLAUDE_CODE_OAUTH_TOKEN
// (D8, CHAIRMAN-CHECKLIST) and is NOT built here.
//
// The loop (dsip.json loop.steps, deterministic subset):
//   1. re-verify-tool-matrix — `npm view <pkg> version` for every pinned package, diff against the
//      pins in brain/TOOL-MATRIX.md; if a floor moved, write a BRAIN-DRIFT.md proposal (a `propose`
//      diff). Drift is INFORMATIONAL — it does not fail the run (the brain is updated by a human/
//      the Claude half, gated, snap-back-able). Offline → recorded "unverified", not a crash.
//   2. run-eval-pyramid — the L1 deterministic golden tasks (eval/eval.mjs --l1-only, E18). A
//      regression here DOES fail the run (evals gate merges — the whole point of the gate).
//   3. propose — summarise drift + eval into BRAIN-DRIFT.md when there is something to propose.
//
// Flags: --check / --dry — CI mode (re-verify + L1 eval, write the proposal, exit on the eval gate).
//        Both behave identically here (the loop is already side-effect-light: it only writes
//        BRAIN-DRIFT.md, never touches the brain itself — that's the human/Claude-gated step).

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(HERE, "..");

const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check") || args.has("--dry");

// ── The pinned tool matrix (npm package → expected floor, from brain/TOOL-MATRIX.md, 2026-06-11) ──
// These are the version FLOORS pixel designs against. The nightly re-verify diffs the live npm
// `latest` against them and flags a drift when npm has moved ahead — the #1 agent failure mode is
// emitting stale patterns (currency), so the loop's first job is to detect its own staleness.
const PINS = {
  next: "16.2.9",
  react: "19.2.7",
  "react-dom": "19.2.7",
  tailwindcss: "4.3.0",
  shadcn: "4.11.0",
  "@radix-ui/colors": "3.0.0",
  "lucide-react": "1.17.0",
  gsap: "3.15.0",
  motion: "12.40.0",
  lenis: "1.3.23",
  "@rive-app/react-canvas": "4.29.0",
  three: "0.184.0",
  impeccable: "2.3.2",
  "@lhci/cli": "0.15.1",
  "@axe-core/playwright": "4.11.3",
};

/** Compare two semver-ish strings; returns >0 if a>b, <0 if a<b, 0 if equal (numeric, part-wise). */
function semverCmp(a, b) {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** `npm view <pkg> version` → { ok, version } | { ok:false } on offline/missing/timeout. */
function npmLatest(pkg) {
  const r = spawnSync("npm", ["view", pkg, "version"], { encoding: "utf8", timeout: 30_000 });
  if (r.error || r.status !== 0) return { ok: false };
  const version = (r.stdout ?? "").trim();
  return version ? { ok: true, version } : { ok: false };
}

// ── Step 1 · re-verify-tool-matrix ───────────────────────────────────────────────────────────────
function reVerifyToolMatrix() {
  console.log("─ re-verify-tool-matrix — diffing the live npm `latest` against the brain pins …");
  const drifts = [];
  const unverified = [];
  for (const [pkg, pin] of Object.entries(PINS)) {
    const live = npmLatest(pkg);
    if (!live.ok) {
      unverified.push(pkg);
      console.log(`   · ${pkg.padEnd(26)} pin ${pin.padEnd(10)} → (unverified — offline / not found)`);
      continue;
    }
    const cmp = semverCmp(live.version, pin);
    if (cmp > 0) {
      drifts.push({ pkg, pin, latest: live.version });
      console.log(`   ⚠ ${pkg.padEnd(26)} pin ${pin.padEnd(10)} → npm ${live.version}  (DRIFT — floor moved ahead)`);
    } else {
      console.log(`   ✓ ${pkg.padEnd(26)} pin ${pin.padEnd(10)} → npm ${live.version}`);
    }
  }
  return { drifts, unverified, checked: Object.keys(PINS).length };
}

// ── Step 2 · run-eval-pyramid (the L1 deterministic golden tasks; a regression FAILS the run) ─────
function runEvalPyramid() {
  console.log("\n─ run-eval-pyramid — the L1 deterministic golden tasks (eval/eval.mjs --l1-only) …");
  const r = spawnSync("node", [join(REPO, "eval", "eval.mjs"), "--l1-only"], {
    encoding: "utf8",
    timeout: 120_000,
    cwd: REPO,
  });
  process.stdout.write(r.stdout ?? "");
  if (r.stderr) process.stderr.write(r.stderr);
  return { pass: r.status === 0, code: r.status ?? 1 };
}

// ── Step 3 · propose (write BRAIN-DRIFT.md when there is a drift to propose) ───────────────────────
function writeProposal({ drifts, unverified, checked }) {
  if (drifts.length === 0) {
    console.log("\n─ propose — no version drift; brain pins are current. (No BRAIN-DRIFT.md written.)");
    return null;
  }
  const lines = [];
  lines.push("# BRAIN-DRIFT — tool-matrix version drift (auto-proposed by the deterministic DSIP loop)");
  lines.push("");
  lines.push(`> Generated ${new Date().toISOString()} by \`workflows/rsi.workflow.js\` (A24, $0 tokenless half).`);
  lines.push("> This is a PROPOSAL, not an applied change. The brain (brain/TOOL-MATRIX.md, EXPERTISE-MAP,");
  lines.push("> OPINIONS) is updated by a human or the gated Claude half (D8) with Git snap-back — never");
  lines.push("> auto-edited. Re-verify each drift, then bump the pin + re-test the golden tasks before merging.");
  lines.push("");
  lines.push(`Checked ${checked} pinned packages · ${drifts.length} drifted · ${unverified.length} unverified (offline/not-found).`);
  lines.push("");
  lines.push("| package | brain pin | npm latest | action |");
  lines.push("| --- | --- | --- | --- |");
  for (const d of drifts) {
    lines.push(`| \`${d.pkg}\` | ${d.pin} | ${d.latest} | re-verify changelog, bump pin, re-run \`npm run eval\` |`);
  }
  if (unverified.length > 0) {
    lines.push("");
    lines.push(`Unverified (no npm answer — offline or renamed): ${unverified.map((p) => "`" + p + "`").join(", ")}.`);
  }
  const out = join(REPO, "BRAIN-DRIFT.md");
  writeFileSync(out, lines.join("\n") + "\n", "utf8");
  console.log(`\n─ propose — ${drifts.length} drift(s) → wrote ${out}`);
  return out;
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────
function main() {
  console.log(`pixel RSI — deterministic DSIP loop ($0, tokenless)${CHECK ? "  [--check]" : ""}`);
  console.log("the Claude half (LLM brain-refresh) is DEFERRED to CLAUDE_CODE_OAUTH_TOKEN (D8).\n");

  const matrix = reVerifyToolMatrix();
  const eval_ = runEvalPyramid();
  writeProposal(matrix);

  // The GATE: the eval pyramid must be green (a golden-task regression fails the run). Version
  // drift is informational (proposed, not applied) and never fails the run on its own.
  if (!eval_.pass) {
    console.error("\n✗ RSI: the L1 eval pyramid regressed — gate FAILED (a golden task went red).");
    process.exit(1);
  }
  console.log(
    `\n✓ RSI deterministic loop done — eval green` +
      `${matrix.drifts.length ? `, ${matrix.drifts.length} drift(s) proposed in BRAIN-DRIFT.md` : ", no drift"}` +
      `${matrix.unverified.length ? ` (${matrix.unverified.length} unverified — offline)` : ""}.`,
  );
  process.exit(0);
}

main();
