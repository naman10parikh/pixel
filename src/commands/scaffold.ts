// src/commands/scaffold.ts — `pixel scaffold [DIR] [--base radix]` (B9 / JOB 8.4, O10).
// SCAFFOLD, NEVER FORK (O10): forking a "popular" starter inherits stale deps (precedent/old-t3
// are 12-20mo behind Next 16 / Tailwind v4) + a generic identity. pixel emits a clean Next 16 app
// via the official scaffolder, then wires its Tailwind v4 @theme house tokens (warm-black,
// Instrument Serif + Poppins, one amber OKLCH accent — src/lib/tokens). The base flag selects the
// component primitives (radix now; Base UI on the watch-list, O3). After scaffolding it does NOT
// claim "done" on the generator's word — it writes the @theme and reports the dir to build/verify.
//
// Mechanism note: `create-next-app` is the deterministic way to materialize a buildable Next 16
// app in a NEW dir (App Router + TS + Tailwind + ESLint). `shadcn init -t next --base radix` then
// wires shadcn/Radix on top — we run it when shadcn is reachable, and degrade gracefully if not
// (the app is still buildable from create-next-app alone, which is what the verify line asserts).

import chalk from "chalk";
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { run } from "../lib/exec.js";
import { logRun, startTimer } from "../lib/logger.js";
import { HOUSE_THEME_CSS } from "../lib/tokens.js";
import type { GateResult } from "../lib/logger.js";

/** Find the app's global stylesheet to append the @theme into. */
function findGlobalCss(appDir: string): string {
  for (const c of [join(appDir, "app", "globals.css"), join(appDir, "src", "app", "globals.css"), join(appDir, "styles", "globals.css")]) {
    if (existsSync(c)) return c;
  }
  // Default location for App-Router scaffolds.
  return join(appDir, "app", "globals.css");
}

export async function runScaffold(dir: string, opts: { base: string }): Promise<number> {
  const elapsed = startTimer();
  const target = resolve(dir);
  const gates: GateResult[] = [];
  let toolCalls = 0;

  const name = basename(target);
  const parentExistsNonEmpty = existsSync(target) && readdirSync(target).length > 0;
  if (parentExistsNonEmpty) {
    console.error(chalk.red(`pixel scaffold: ${target} exists and is not empty — choose a fresh directory (scaffold, don't overwrite).`));
    logRun({ cmd: "scaffold", model: null, duration_ms: elapsed(), tool_calls: 0, gate_results: [{ gate: "create-next-app", pass: false, detail: "target not empty" }], exit: 1, dir: target });
    return 1;
  }

  console.log(chalk.bold(`pixel scaffold ${target}`), chalk.dim(`(base: ${opts.base}) — scaffold-not-fork (O10)`));

  // ── 1 · create-next-app (the buildable Next 16 base, non-interactive). ──────────────────────
  // Flags chosen to be fully non-interactive: App Router + TS + Tailwind + ESLint, no src dir,
  // no import alias prompt, use pnpm, skip git. --yes prevents any prompt from blocking the agent.
  console.log(chalk.dim("  scaffolding Next 16 app via create-next-app …"));
  const cna = run(
    "npx",
    [
      "--yes",
      "create-next-app@latest",
      target,
      "--ts",
      "--tailwind",
      "--eslint",
      "--app",
      "--no-src-dir",
      "--no-import-alias",
      "--use-pnpm",
      "--skip-install",
      "--yes",
    ],
    { timeoutMs: 420_000 },
  );
  toolCalls++;
  if (!cna.found) {
    console.error(chalk.red("pixel scaffold: npx/create-next-app not available (offline?) — cannot scaffold."));
    gates.push({ gate: "create-next-app", pass: null, detail: "create-next-app unavailable (offline?)" });
    logRun({ cmd: "scaffold", model: null, duration_ms: elapsed(), tool_calls: toolCalls, gate_results: gates, exit: 1, dir: target });
    return 1;
  }
  if (!cna.ok) {
    console.error(chalk.red("pixel scaffold: create-next-app failed."), chalk.dim(`exit ${cna.code}`));
    console.error(chalk.dim((cna.stderr || cna.stdout).split("\n").slice(-6).join("\n")));
    gates.push({ gate: "create-next-app", pass: false, detail: `exit ${cna.code}` });
    logRun({ cmd: "scaffold", model: null, duration_ms: elapsed(), tool_calls: toolCalls, gate_results: gates, exit: 1, dir: target });
    return 1;
  }
  gates.push({ gate: "create-next-app", pass: true });
  console.log(chalk.green("✓ Next 16 app scaffolded"));

  // ── 2 · wire the Tailwind v4 @theme house tokens (O8). ──────────────────────────────────────
  if (!existsSync(target)) mkdirSync(target, { recursive: true });
  const cssPath = findGlobalCss(target);
  try {
    // Replace the scaffolder's default stylesheet head with the house @theme. We write the house
    // block as the canonical globals.css so the warm-black/serif/amber tokens are the app's base.
    writeFileSync(cssPath, HOUSE_THEME_CSS, "utf8");
    gates.push({ gate: "house-theme", pass: true, detail: cssPath });
    console.log(chalk.green("✓ wired Tailwind v4 @theme house tokens →"), chalk.dim(cssPath));
  } catch (err) {
    gates.push({ gate: "house-theme", pass: false, detail: err instanceof Error ? err.message : String(err) });
    console.error(chalk.red("pixel scaffold: failed to write @theme tokens:"), chalk.dim(err instanceof Error ? err.message : String(err)));
  }

  // ── 3 · shadcn init on top (Radix primitives) — best-effort; app is buildable without it. ────
  console.log(chalk.dim(`  initializing shadcn (--base ${opts.base}) …`));
  const shadcn = run("npx", ["--yes", "shadcn@latest", "init", "--base", opts.base, "--yes", "-d"], { cwd: target, timeoutMs: 300_000 });
  toolCalls++;
  gates.push({
    gate: "shadcn-init",
    pass: shadcn.found ? shadcn.ok : null,
    detail: shadcn.found ? (shadcn.ok ? `base ${opts.base}` : `exit ${shadcn.code} (app still buildable)`) : "shadcn unavailable — app still buildable from create-next-app",
  });

  console.log(chalk.bold(`\npixel scaffold done → ${target}`));
  console.log(chalk.dim(`  next: cd ${name} && pnpm install && pnpm build  (then \`pixel verify ${name}\`)`));

  logRun({ cmd: "scaffold", model: null, duration_ms: elapsed(), tool_calls: toolCalls, gate_results: gates, exit: 0, dir: target, base: opts.base });
  return 0;
}
