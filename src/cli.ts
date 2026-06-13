#!/usr/bin/env node
// src/cli.ts — pixel's hands. The §4 command tree (PLAN.md): mock/scaffold/design/generate/
// audit/verify/migrate/cockpit/logs. commander.js + chalk per npm-package-conventions. Every
// command appends to logs/runs.jsonl (src/lib/logger). Exit 0 success / non-zero on failure or
// refusal — these verbs are CI-usable exit-code gates. The command CORES live in
// src/commands/*; `mock` is the D14 flagship pipeline (separate stream) — this file wires the
// parser + dispatch and the stubs that stream owns.

import { Command } from "commander";
import chalk from "chalk";

import { runScaffold } from "./commands/scaffold.js";
import { runDesign } from "./commands/design.js";
import { runGenerate } from "./commands/generate.js";
import { runAudit } from "./commands/audit.js";
import { runVerify } from "./commands/verify.js";
import { runMigrate } from "./commands/migrate.js";
import { runMock } from "./commands/mock.js";
import { runCockpit } from "./commands/cockpit.js";
import { runLogs } from "./commands/logs.js";

// Resolve version from package.json without a JSON import assertion (portable across Node).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
function pkgVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8"),
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const program = new Command();

program
  .name("pixel")
  .description(
    "The Energy fleet's frontend employee — scaffolds, designs-to-taste, generates-then-gates, and verifies Next.js 16 / Tailwind v4 / shadcn UI. Generated UI is an untrusted draft until it passes the ship gate.",
  )
  .version(pkgVersion(), "-v, --version", "print the pixel version")
  .showHelpAfterError();

// pixel mock "<brief>" — THE FLAGSHIP (D14 owns the pipeline; flags declared here per B8 spec).
program
  .command("mock")
  .description("flagship: discovery brief → first-pass draft → 7-step gate → ICP-aware mockup + scaffolded Next app")
  .argument("<brief>", "a one-line product brief naming the ICP (a specific person, not a demographic)")
  .option("--out <dir>", "output directory for the mockup + scaffolded app")
  .option("--no-sandbox", "skip the E2B sandbox build/gate (run the gate locally)")
  .option("--json", "emit a machine-readable JSON result")
  .action(async (brief: string, opts: { out?: string; sandbox?: boolean; json?: boolean }) => {
    process.exitCode = await runMock(brief, opts);
  });

// pixel scaffold [DIR] — clean Next 16 app (scaffold-not-fork, O10).
program
  .command("scaffold")
  .description("clean Next 16 app via shadcn init -t next --base radix; wires Tailwind v4 @theme + house tokens")
  .argument("[dir]", "target directory", ".")
  .option("--base <base>", "component primitive base (radix|base-ui)", "radix")
  .action(async (dir: string, opts: { base: string }) => {
    process.exitCode = await runScaffold(dir, opts);
  });

// pixel design "<brief>" — discovery only; NO BRIEF = NO DESIGN (O11).
program
  .command("design")
  .description("discovery: 6-section brief + FIRST/SECOND/THIRD hierarchy map; refuses an empty brief")
  .argument("[brief]", "the product brief (empty → refusal)")
  .option("--vertical <v>", "vertical profile (fintech|health|devtools|consumer|...)")
  .option("--out <dir>", "write the brief to <dir>/brief.md (default: stdout)")
  .action(async (brief: string | undefined, opts: { vertical?: string; out?: string }) => {
    process.exitCode = await runDesign(brief ?? "", opts);
  });

// pixel generate "<prompt>" — v0 draft, always tagged untrusted (O7).
program
  .command("generate")
  .description("v0 Platform API first-pass draft (untrusted — must pass `pixel audit`)")
  .argument("<prompt>", "the generation prompt")
  .option("--model <m>", "v0 model (v0-1.5-md|v0-1.5-lg)", "v0-1.5-md")
  .option("--out <dir>", "output directory for the draft")
  .action(async (prompt: string, opts: { model: string; out?: string }) => {
    process.exitCode = await runGenerate(prompt, opts);
  });

// pixel audit [DIR] — the 7-step ship gate (exit-code gate).
program
  .command("audit")
  .description("the 7-step ship gate in order: impeccable (keyless CLI gate) → axe · lhci · 12-dim · manual-a11y · security · visual (run in the live smoke / energy skill — shown as SKIP here, never a fake pass, O14)")
  .argument("[dir]", "directory to audit", ".")
  .option("--sandbox", "run the build + gate inside an E2B sandbox (E17)")
  .option("--fix", "apply auto-fixes where a gate supports it")
  .action(async (dir: string, opts: { sandbox?: boolean; fix?: boolean }) => {
    process.exitCode = await runAudit(dir, opts);
  });

// pixel verify [DIR] — the silent-failure assertion set (§0 grep-set + build + console).
program
  .command("verify")
  .description("the silent-failure assertion set: §0 grep-set + build + screenshot + console=0-hydration")
  .argument("[dir]", "directory to verify", ".")
  .action(async (dir: string) => {
    process.exitCode = await runVerify(dir);
  });

// pixel migrate [DIR] — codemod-then-grep upgrade (O13).
program
  .command("migrate")
  .description("codemod-then-grep upgrade (@next/codemod + @tailwindcss/upgrade), then `pixel verify` for the gap")
  .argument("[dir]", "directory to migrate", ".")
  .option("--from <ver>", "the major version migrating from (e.g. 15)")
  .action(async (dir: string, opts: { from?: string }) => {
    process.exitCode = await runMigrate(dir, opts);
  });

// pixel cockpit — serve the localhost cockpit (G cluster owns the server impl).
program
  .command("cockpit")
  .description("serve the localhost cockpit (brain browser · run log · eval scores · ask-the-employee · mockup gallery)")
  .option("--port <port>", "port", "7780")
  .action(async (opts: { port: string }) => {
    process.exitCode = await runCockpit(opts);
  });

// pixel logs — aggregate logs/runs.jsonl (E16 observability).
program
  .command("logs")
  .description("aggregate logs/runs.jsonl — cost/latency/gate-results per run")
  .option("--last <n>", "show only the last N runs", (v) => parseInt(v, 10))
  .option("--json", "emit raw JSON")
  .action(async (opts: { last?: number; json?: boolean }) => {
    process.exitCode = await runLogs(opts);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(chalk.red("pixel: fatal:"), err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
