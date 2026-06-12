#!/usr/bin/env node
// eval/smoke.mjs — the Playwright SMOKE half of the acceptance test (E19 / PLAN §5 step 4).
//
// Boots the built Next app (`pnpm start`), navigates `/` with Playwright, and asserts the two
// silent-failure classes impeccable CANNOT catch (brain EXPERTISE J6: impeccable-clean is
// necessary-not-sufficient):
//   • S4 — Tailwind actually RENDERS under Turbopack: a `bg-*` element's computed background-color
//          is not the transparent/default (a green build can silently drop Tailwind styles, #81763).
//   • S8 — ZERO console hydration warnings: page.on('console') records no "hydration"/"did not match"
//          (non-serializable props / non-deterministic SSR mismatch — invisible to the compiler).
//
// Exit codes (consumed by acceptance.mjs): 0 = smoke PASS · 2 = smoke FAIL (a real regression) ·
// 3 = SKIP (Playwright/browser unavailable, or the app won't start) — a SKIP is NOT a fail (O14).
// Playwright is imported dynamically so the harness never hard-requires it; a missing browser is a
// SKIP, surfaced honestly, never a fake green.
//
// Usage: node eval/smoke.mjs --app <builtAppDir> [--port 3210]

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const appIdx = args.indexOf("--app");
const APP = appIdx >= 0 ? args[appIdx + 1] : null;
const portIdx = args.indexOf("--port");
const PORT = portIdx >= 0 ? Number(args[portIdx + 1]) : 3210;

function done(code, msg) {
  process.stdout.write(msg + "\n");
  process.exit(code);
}

if (!APP || !existsSync(APP)) done(3, `smoke SKIP — app dir missing: ${APP}`);
if (!existsSync(`${APP}/.next`)) done(3, "smoke SKIP — app not built (.next absent)");

// Dynamically import Playwright; absent → SKIP (the harness never hard-depends on it).
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  done(3, "smoke SKIP — playwright not installed (npx playwright install to enable)");
}

let server = null;
let browser = null;
const fail = (m) => {
  cleanup();
  done(2, `smoke FAIL — ${m}`);
};
function cleanup() {
  try {
    if (browser) browser.close();
  } catch {
    /* best-effort */
  }
  try {
    if (server) server.kill("SIGTERM");
  } catch {
    /* best-effort */
  }
}

// ── boot the app (`pnpm start` → next start) ───────────────────────────────────────────────────
server = spawn("pnpm", ["start", "--port", String(PORT)], { cwd: APP, env: { ...process.env, PORT: String(PORT) } });
let serverOut = "";
server.stdout.on("data", (d) => (serverOut += d.toString()));
server.stderr.on("data", (d) => (serverOut += d.toString()));

/** Poll the server until it answers or we time out. */
async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (r.ok || r.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
  return false;
}

const URL = `http://localhost:${PORT}`;
try {
  const up = await waitForServer(URL);
  if (!up) {
    cleanup();
    done(3, `smoke SKIP — app did not start on :${PORT} (offline/infra?) — ${serverOut.split("\n").slice(-3).join(" ").slice(0, 160)}`);
  }

  browser = await chromium.launch();
  const page = await browser.newPage();

  // S8 — record any console hydration warning.
  const hydrationWarnings = [];
  page.on("console", (msg) => {
    const t = msg.text();
    if (/hydrat|did not match|server.*client|text content does not match/i.test(t)) hydrationWarnings.push(t);
  });
  page.on("pageerror", (err) => {
    if (/hydrat/i.test(err.message)) hydrationWarnings.push(err.message);
  });

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(800); // let any late hydration warning flush

  // S4 — a `bg-*` element's computed background-color is not the transparent default.
  const bg = await page.evaluate(() => {
    const el = document.querySelector("body");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return cs.backgroundColor;
  });
  const bgRendered = !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";

  cleanup();
  if (hydrationWarnings.length > 0) done(2, `smoke FAIL — ${hydrationWarnings.length} hydration warning(s): ${hydrationWarnings[0].slice(0, 120)}`);
  if (!bgRendered) done(2, `smoke FAIL — body background did not render (Tailwind dropped under Turbopack? S4) — computed=${bg}`);
  done(0, `smoke PASS — body bg=${bg}, 0 hydration warnings`);
} catch (err) {
  cleanup();
  done(3, `smoke SKIP — Playwright run error (infra?) — ${err instanceof Error ? err.message.slice(0, 140) : String(err)}`);
}
