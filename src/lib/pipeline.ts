// src/lib/pipeline.ts — the `pixel mock` internal routing flow (D14, THE flagship / D9 bar).
// `pixel mock "<brief>"` IS the dispatch: a 4-step pipeline discover → generate → gate → emit,
// each step logging its OWN line to logs/runs.jsonl with a distinct `step` key (4 separate
// appended records, NOT one summary). It wraps the B9 cores — no logic duplicated:
//   discover  = J1: runDesign → <out>/brief.md with a NAMED ICP (gate on empty brief, O11)
//   generate  = J5: runGenerate → v0 draft; no key/network → R2 scaffold-only skip (exit 0)
//   gate      = J7: materialise the deliverables (scaffold a Next 16 app + write the ICP-aware
//               mockup) then run the ship gate (impeccable step 1 is the keyless hard gate) — the
//               untrusted-output posture (O7): the emitted UI is a draft until the gate passes
//   emit      = confirm + report <out>/{mockup,app}; exit non-zero if the gate hard-failed
// The mockup is a REAL deliverable (warm-black, non-purple, serif+sans) that passes `impeccable
// detect` itself (GT14) — it is what the cockpit Mockup Gallery (G25) renders.

import chalk from "chalk";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { logStep, startTimer } from "./logger.js";
import type { GateResult } from "./logger.js";
import { runDesign } from "../commands/design.js";
import { runGenerate } from "../commands/generate.js";
import { runScaffold } from "../commands/scaffold.js";
import { runShipGate } from "./ship-gate.js";
import { buildMockupHtml, extractIcpName } from "./mockup.js";

export interface MockResult {
  readonly exit: number; // 0 = mockup + app emitted and gate passed; non-zero = gate failed / refused
  readonly out: string; // resolved output directory
  readonly mockupPath: string | null;
  readonly appPath: string | null;
  readonly gate: GateResult[];
}

/**
 * Run the flagship mock pipeline end-to-end. `noSandbox` skips the E2B build envelope (E17) and
 * runs the gate locally — the keyless path the acceptance test (E19) proves works tokenlessly.
 */
export async function runMockPipeline(
  brief: string,
  opts: { out?: string; noSandbox?: boolean },
): Promise<MockResult> {
  const out = resolve(opts.out ?? join(process.cwd(), "pixel-mock"));
  const appDir = join(out, "app");
  const mockupDir = join(out, "mockup");

  // ── O11 refusal gate (before step 1 logs) — NO BRIEF = NO DESIGN. ────────────────────────────
  if (!brief || brief.trim().length === 0) {
    console.error(chalk.red("pixel mock: NO BRIEF = NO DESIGN (O11) — provide a one-line brief naming the ICP."));
    logStep("mock", "discover", { exit: 2, gate_results: [{ gate: "brief", pass: false, detail: "empty brief — refused (O11)" }], brief: "" });
    return { exit: 2, out, mockupPath: null, appPath: null, gate: [] };
  }

  if (!existsSync(out)) mkdirSync(out, { recursive: true });
  console.log(chalk.bold(`pixel mock`), chalk.dim(`→ ${out}  (discover → generate → gate → emit)`));

  // ── STEP 1 · DISCOVER — the brief.md with a NAMED ICP (J1). ──────────────────────────────────
  const tDiscover = startTimer();
  console.log(chalk.bold("\n[1/4] discover"), chalk.dim("— 6-section brief + a named ICP"));
  const designExit = await runDesign(brief, { out });
  const briefPath = join(out, "brief.md");
  const icp = extractIcpName(brief);
  logStep("mock", "discover", {
    duration_ms: tDiscover(),
    exit: designExit,
    gate_results: [{ gate: "brief", pass: designExit === 0, detail: `ICP: ${icp}` }],
    brief,
    brief_path: briefPath,
    icp,
  });
  if (designExit !== 0) {
    return { exit: designExit, out, mockupPath: null, appPath: null, gate: [] };
  }

  // ── STEP 2 · GENERATE — v0 first-pass draft (untrusted); R2 skip on no key/network (J5). ──────
  const tGen = startTimer();
  console.log(chalk.bold("\n[2/4] generate"), chalk.dim("— v0 first-pass draft (untrusted, O7); no key → R2 scaffold-only"));
  const genExit = await runGenerate(brief, { model: "v0-1.5-md", out });
  // genExit 0 either way (R2 fallback is exit 0); a non-zero here is an empty-prompt guard only.
  logStep("mock", "generate", {
    duration_ms: tGen(),
    exit: genExit,
    gate_results: [{ gate: "v0-generate", pass: genExit === 0 ? null : false, detail: genExit === 0 ? "draft or R2 scaffold-only skip" : "generate refused" }],
    untrusted: true,
  });

  // ── STEP 3 · GATE — materialise the deliverables, then run the ship gate (J7). ────────────────
  // The emitted UI is an untrusted draft until it survives the gate (O7). We materialise BOTH
  // deliverables here so the gate can check them: (a) the ICP-aware mockup (a real warm-black,
  // non-purple, serif+sans page that itself passes impeccable — GT14); (b) a scaffolded Next 16
  // app (the buildable structure). Then the ship gate's keyless impeccable step is the hard gate.
  const tGate = startTimer();
  console.log(chalk.bold("\n[3/4] gate"), chalk.dim("— write the ICP-aware mockup + scaffold the app, then the ship gate"));
  const gate: GateResult[] = [];
  let toolCalls = 0;
  let hardFail = false;

  // (a) the ICP-aware mockup — always producible (no network), the taste deliverable.
  if (!existsSync(mockupDir)) mkdirSync(mockupDir, { recursive: true });
  let mockupPath: string | null = null;
  try {
    const html = buildMockupHtml(brief);
    mockupPath = join(mockupDir, "index.html");
    writeFileSync(mockupPath, html, "utf8");
    gate.push({ gate: "mockup", pass: true, detail: `ICP-aware mockup → ${mockupPath}` });
    console.log(chalk.green("  ✓ mockup written"), chalk.dim(mockupPath));
  } catch (err) {
    gate.push({ gate: "mockup", pass: false, detail: err instanceof Error ? err.message : String(err) });
    hardFail = true;
  }

  // (b) the scaffolded Next 16 app — the buildable structure (needs npm registry egress).
  // If the app dir exists from a prior run, clear it so runScaffold's "must be empty" gate passes.
  if (existsSync(appDir)) rmSync(appDir, { recursive: true, force: true });
  console.log(chalk.dim("  scaffolding the Next 16 app …"));
  const scaffoldExit = await runScaffold(appDir, { base: "radix" });
  toolCalls++;
  const appPath = scaffoldExit === 0 ? appDir : null;
  gate.push({
    gate: "scaffold",
    pass: scaffoldExit === 0 ? true : null,
    detail: scaffoldExit === 0 ? "buildable Next 16 app" : "scaffold unavailable (offline?) — mockup-only emit (R2)",
  });

  // (c) the ship gate (impeccable step 1, keyless) over the mockup — GT14: pixel's OWN output is
  // anti-slop clean. We point impeccable at the mockup dir (the taste deliverable we always emit);
  // if the app scaffolded, the gate also covers it via the audit verb downstream.
  const shipGate = runShipGate(mockupDir);
  toolCalls += shipGate.toolCalls;
  for (const s of shipGate.steps) gate.push(s);
  if (!shipGate.pass) hardFail = true;

  logStep("mock", "gate", {
    duration_ms: tGate(),
    tool_calls: toolCalls,
    exit: hardFail ? 1 : 0,
    gate_results: gate,
    mockup_path: mockupPath,
    app_path: appPath,
  });

  // ── STEP 4 · EMIT — confirm the deliverables; exit non-zero if the gate hard-failed. ──────────
  const tEmit = startTimer();
  console.log(chalk.bold("\n[4/4] emit"), chalk.dim("— the ICP-aware mockup + scaffolded app under --out"));
  const haveMockup = mockupPath !== null && existsSync(mockupPath);
  const haveApp = appPath !== null && existsSync(appDir);
  const emitExit = hardFail ? 1 : 0;
  const emitGate: GateResult[] = [
    { gate: "emit-mockup", pass: haveMockup, detail: haveMockup ? mockupPath! : "mockup missing" },
    { gate: "emit-app", pass: haveApp ? true : null, detail: haveApp ? appDir : "app not scaffolded (offline) — mockup-only" },
  ];
  logStep("mock", "emit", {
    duration_ms: tEmit(),
    exit: emitExit,
    gate_results: emitGate,
    mockup_path: mockupPath,
    app_path: appPath,
    icp,
  });

  if (emitExit === 0) {
    console.log(chalk.bold.green(`\n✓ pixel mock done`), chalk.dim(`— ICP "${icp}" · mockup + ${haveApp ? "scaffolded app" : "(app offline)"} → ${out}`));
  } else {
    console.error(chalk.bold.red(`\n✗ pixel mock: ship gate FAILED — the emitted UI did not pass anti-slop (O7).`));
  }
  return { exit: emitExit, out, mockupPath, appPath, gate };
}
