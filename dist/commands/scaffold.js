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
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { run } from "../lib/exec.js";
import { logRun, startTimer } from "../lib/logger.js";
import { HOUSE_THEME_CSS } from "../lib/tokens.js";
/**
 * After `shadcn init`, the scaffolder rewrites globals.css with its OWN `:root`/`.dark`
 * `--background`/`--foreground` defaults (`oklch(1 0 0)` white / `oklch(0.145 0 0)` near-black).
 * The `body` uses `bg-background`, so those WIN — the house warm-black @theme tokens become dead.
 * `oklch(0.145 0 0)` is exactly the near-black O-HS1 BANS. This patch points `--background`/
 * `--foreground` at the house warm-black palette so the emitted app's body is genuinely warm-black,
 * not shadcn's near-black default. Surgical: it touches only the four shadcn default value lines.
 */
function patchHouseBackground(cssPath) {
    if (!existsSync(cssPath))
        return false;
    const before = readFileSync(cssPath, "utf8");
    // House warm-black (O-HS1, never #000/oklch(0.145)) + warm off-white text — mirrors tokens.ts.
    const after = before
        .replace(/(:root\s*\{[^}]*?--background:\s*)oklch\(1 0 0\)/, "$1#141312")
        .replace(/(:root\s*\{[^}]*?--foreground:\s*)oklch\(0\.145 0 0\)/, "$1#f2efe9")
        .replace(/(\.dark\s*\{[^}]*?--background:\s*)oklch\(0\.145 0 0\)/, "$1#141312")
        .replace(/(\.dark\s*\{[^}]*?--foreground:\s*)oklch\(0\.985 0 0\)/, "$1#f2efe9");
    if (after === before)
        return false;
    writeFileSync(cssPath, after, "utf8");
    return true;
}
/** Find the app's global stylesheet to append the @theme into. */
function findGlobalCss(appDir) {
    for (const c of [join(appDir, "app", "globals.css"), join(appDir, "src", "app", "globals.css"), join(appDir, "styles", "globals.css")]) {
        if (existsSync(c))
            return c;
    }
    // Default location for App-Router scaffolds.
    return join(appDir, "app", "globals.css");
}
/** Find the App-Router `layout.tsx`/`page.tsx` pair (handles --no-src-dir `app/` and `src/app/`). */
function findAppPair(appDir) {
    for (const root of [join(appDir, "app"), join(appDir, "src", "app")]) {
        if (existsSync(join(root, "page.tsx")) || existsSync(join(root, "layout.tsx"))) {
            return { layout: join(root, "layout.tsx"), page: join(root, "page.tsx") };
        }
    }
    return { layout: join(appDir, "app", "layout.tsx"), page: join(appDir, "app", "page.tsx") };
}
/**
 * Replace the create-next-app boilerplate `layout.tsx` + `page.tsx` (the Geist-font, Vercel-logo
 * "Get started by editing page.tsx" wall) with a minimal page that REFERENCES the house @theme
 * tokens wired into globals.css — so the emitted app a dev builds on actually carries the taste
 * (warm-black, serif display + Poppins body, one amber accent), not generic boilerplate with the
 * house CSS sitting dead. Authored to pass `impeccable detect` itself (the same bar as the mockup,
 * GT14): no #000 / no purple / no gray placeholder boxes / no hero-eyebrow chip / ≤2 em-dashes /
 * a display font OFF impeccable 2.3.2's OVERUSED_FONTS set — so we load **Spectral** (a distinctive
 * editorial serif NOT flagged) for display + Poppins for body via next/font, honoring O-HS2/O-F6's
 * serif+sans PRINCIPLE while clearing the gate (mirrors the mockup's documented font choice).
 * Returns true iff at least one file was rewritten. Surgical: it touches only these two files.
 */
function writeHousePage(appDir) {
    const { layout, page } = findAppPair(appDir);
    let wrote = false;
    // layout.tsx — house fonts via next/font + warm-black body (consumes the @theme via Tailwind).
    const layoutTsx = `import type { Metadata } from "next";
import { Spectral, Poppins } from "next/font/google";
import "./globals.css";

// House type (O-HS2 / O-F6): a distinctive serif display + a sans body — the #1 anti-slop move.
// Spectral (not Instrument Serif) keeps a display serif OFF impeccable's overused-font set.
const display = Spectral({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display-next" });
const body = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body-next" });

export const metadata: Metadata = {
  title: "pixel app",
  description: "A clean Next 16 / Tailwind v4 app, wired with the house warm-black taste tokens.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={\`\${display.variable} \${body.variable} min-h-dvh bg-base-1 text-base-12 antialiased\`}>
        {children}
      </body>
    </html>
  );
}
`;
    // page.tsx — a minimal warm-black house page that REFERENCES the tokens (not the Vercel logo wall).
    const pageTsx = `export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-sm tracking-wide text-base-11">pixel · the Energy fleet&rsquo;s frontend</p>
      <h1
        className="mt-4 text-balance text-5xl leading-tight text-base-12"
        style={{ fontFamily: "var(--font-display-next), var(--font-display)" }}
      >
        A clean start, already in <span className="text-accent-9">taste</span>.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-base-11">
        This page is wired with the house tokens from <code className="text-base-12">globals.css</code>:
        a warm-black base, a serif display paired with Poppins, and one amber accent in OKLCH. Build
        the real screen to your discovery brief; this is the buildable, gated foundation.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <section className="rounded-xl border border-base-3 bg-base-2 p-5">
          <div className="text-2xl text-accent-9" style={{ fontFamily: "var(--font-display-next), var(--font-display)" }}>2.0s</div>
          <div className="mt-1 text-sm text-base-11">LCP target (CWV 2026)</div>
        </section>
        <section className="rounded-xl border border-base-3 bg-base-2 p-5">
          <div className="text-2xl text-base-12" style={{ fontFamily: "var(--font-display-next), var(--font-display)" }}>warm-black</div>
          <div className="mt-1 text-sm text-base-11">base, never pure black</div>
        </section>
        <section className="rounded-xl border border-base-3 bg-base-2 p-5">
          <div className="text-2xl text-base-12" style={{ fontFamily: "var(--font-display-next), var(--font-display)" }}>serif + sans</div>
          <div className="mt-1 text-sm text-base-11">the anti-slop pairing</div>
        </section>
      </div>
      <a
        href="https://nextjs.org/docs"
        className="mt-10 inline-flex items-center rounded-lg bg-accent-9 px-5 py-2.5 font-medium text-base-1 transition hover:brightness-105"
      >
        Read the Next.js docs
      </a>
    </main>
  );
}
`;
    try {
        if (existsSync(layout)) {
            writeFileSync(layout, layoutTsx, "utf8");
            wrote = true;
        }
        if (existsSync(page)) {
            writeFileSync(page, pageTsx, "utf8");
            wrote = true;
        }
    }
    catch {
        return wrote;
    }
    return wrote;
}
export async function runScaffold(dir, opts) {
    const elapsed = startTimer();
    const target = resolve(dir);
    const gates = [];
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
    const cna = run("npx", [
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
    ], { timeoutMs: 420_000 });
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
    if (!existsSync(target))
        mkdirSync(target, { recursive: true });
    const cssPath = findGlobalCss(target);
    try {
        // Replace the scaffolder's default stylesheet head with the house @theme. We write the house
        // block as the canonical globals.css so the warm-black/serif/amber tokens are the app's base.
        writeFileSync(cssPath, HOUSE_THEME_CSS, "utf8");
        gates.push({ gate: "house-theme", pass: true, detail: cssPath });
        console.log(chalk.green("✓ wired Tailwind v4 @theme house tokens →"), chalk.dim(cssPath));
    }
    catch (err) {
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
    // ── 4 · re-assert the house warm-black over shadcn's white/near-black default (O-HS1). ────────
    // shadcn init clobbers `--background`/`--foreground`; without this the body ships near-black
    // oklch(0.145) — the exact value O-HS1 bans — so the flagship's OWN scaffold would fail its taste.
    if (shadcn.found && shadcn.ok) {
        const patched = patchHouseBackground(cssPath);
        gates.push({ gate: "house-background", pass: patched ? true : null, detail: patched ? "body → warm-black #141312 (O-HS1)" : "shadcn defaults not found to patch" });
        if (patched)
            console.log(chalk.green("✓ re-asserted house warm-black on the body"), chalk.dim("(O-HS1)"));
    }
    // ── 5 · replace the create-next-app boilerplate page with a house-token-consuming page (O-HS). ──
    // Without this the visible page is the Geist-font / Vercel-logo "edit page.tsx" wall and the house
    // @theme tokens sit DEAD (defined in globals.css, referenced by no JSX). This rewrites layout.tsx
    // (Spectral display + Poppins body via next/font) + page.tsx (a minimal warm-black house page that
    // references bg-base-1/text-base-12/text-accent-9) so the emitted app actually carries the taste.
    const housePage = writeHousePage(target);
    gates.push({ gate: "house-page", pass: housePage ? true : null, detail: housePage ? "layout.tsx + page.tsx → house tokens (Spectral+Poppins, warm-black)" : "app/page.tsx not found to rewrite" });
    if (housePage)
        console.log(chalk.green("✓ wrote a house-token page"), chalk.dim("(layout.tsx + page.tsx — no boilerplate, tokens referenced)"));
    console.log(chalk.bold(`\npixel scaffold done → ${target}`));
    console.log(chalk.dim(`  next: cd ${name} && pnpm install && pnpm build  (then \`pixel verify ${name}\`)`));
    logRun({ cmd: "scaffold", model: null, duration_ms: elapsed(), tool_calls: toolCalls, gate_results: gates, exit: 0, dir: target, base: opts.base });
    return 0;
}
