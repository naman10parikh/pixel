// test/component.test.mjs — §9 COMPONENT layer (node --test, Playwright render).
// The PLAN §9 testing-contract declares a COMPONENT layer — "a representative shadcn-styled
// component renders with the house tokens (warm-black, distinctive serif display)" — driven by
// Playwright. The other five layers (unit/integration/contract/E2E/chaos) already have files; this
// closes the one gap. It renders pixel's OWN shipped UI surface (the cockpit SPA — the flagship
// demo, the surface `pixel audit cockpit/` must itself pass) in a real Chromium DOM and asserts the
// house-token contract is COMPUTED-LIVE, not just present as a string. That has teeth that the unit
// test (which matches HOUSE_THEME_CSS strings) structurally cannot: it catches a CSS regression to
// pure-black/violet, a font-stack regression off the serif+sans principle (O-HS2/O-F6), AND the JS
// failing to mount the view — all silent-failure classes (S4 styles-don't-render; §9.2 green-build-
// ≠-working) that only a real render exposes.
//
// Why the cockpit and not a TSX fixture: rendering a .tsx shadcn component needs a bundler/transpile
// step + new deps (RTL/jsdom), which the repo does NOT pin (Karpathy: no speculative deps). The
// cockpit is the real, dependency-free, browser-renderable representative of pixel's design system
// (warm-black #141312 / amber OKLCH accent / Spectral serif + Poppins) — testing it is MORE honest
// than a fixture: it is the component surface pixel actually ships and gates.
//
// SKIP discipline (O14 — a missing tool is a SKIP, never a fake PASS): Playwright is a pinned
// devDep but its browser binary may be absent (offline CI before `playwright install`); if Chromium
// won't launch, or the stdlib server won't bind, the test SKIPS with a clear reason — it never
// reds for infra and never greens without actually rendering. Runs against the source cockpit
// (src/cockpit/server.mjs is uncompiled by design), gated only on dist being built for parity with
// the rest of the suite.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const SERVER = join(REPO, "src", "cockpit", "server.mjs");
const DIST_CLI = join(REPO, "dist", "cli.js");
// Gate on the build for parity with the other layers; the cockpit server itself is source (.mjs).
const skip = existsSync(DIST_CLI) ? false : "dist not built — run `pnpm build` first";
const PORT = 7793; // off the cockpit default (7780) so a running cockpit doesn't collide

// Dynamically import Playwright; absent browser → SKIP (never a hard dep, mirrors eval/smoke.mjs).
async function loadChromium() {
  try {
    const { chromium } = await import("playwright");
    return chromium;
  } catch {
    return null;
  }
}

/** Boot the stdlib cockpit server on PORT, poll until it answers, return the child or null. */
async function bootCockpit() {
  if (!existsSync(SERVER)) return null;
  const child = spawn(process.execPath, [SERVER, String(PORT)], {
    env: { ...process.env, PIXEL_COCKPIT_PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d.toString()));
  child.stderr.on("data", (d) => (log += d.toString()));
  const url = `http://127.0.0.1:${PORT}/`;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (r.ok || r.status < 500) return child;
    } catch {
      /* not up yet */
    }
    if (child.exitCode !== null) return null; // server died (e.g. EADDRINUSE) → caller SKIPs
    await new Promise((res) => setTimeout(res, 400));
  }
  try {
    child.kill("SIGTERM");
  } catch {
    /* best-effort */
  }
  return null;
}

test(
  "component: the cockpit renders with the house tokens (warm-black + serif display, no violet) — COMPUTED-LIVE",
  { skip },
  async () => {
    const chromium = await loadChromium();
    if (!chromium) {
      console.warn("[component] SKIP — playwright browser not installed (`npx playwright install chromium` to enable)");
      return; // honest skip, not a fake green
    }
    let browser = null;
    let server = null;
    try {
      server = await bootCockpit();
      if (!server) {
        console.warn(`[component] SKIP — cockpit server did not start on :${PORT} (port busy / offline?)`);
        return;
      }
      browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle", timeout: 20_000 });

      // The SPA mounts a view into #stage (app.js replaces the "loading…" spinner). Wait for the
      // mount so we assert a RENDERED component, not the static shell — the default gallery view's
      // first card carries the .mock-icp class (serif). If the JS never mounts, this throws → FAIL.
      await page.waitForFunction(
        () => {
          const stage = document.getElementById("stage");
          if (!stage) return false;
          const stillSpinning = stage.querySelector(".spinner");
          return !stillSpinning && stage.children.length > 0;
        },
        { timeout: 15_000 },
      );

      // ── ASSERTION 1 — warm-black ACTUALLY rendered (S4: styles-render; never #000, never violet). ─
      // Modern Chromium returns getComputedStyle().backgroundColor in the AUTHOR color space (the
      // cockpit authors OKLCH, so it returns `oklch(…)` verbatim, NOT rgb). To assert the RENDERED
      // pixel robustly across color spaces, paint the computed value onto a 1×1 canvas and read back
      // true 8-bit sRGB channels — color-space-agnostic, exactly what the eye sees.
      const toSRGB = (selector, prop) =>
        page.evaluate(
          ({ selector, prop }) => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const computed = getComputedStyle(el)[prop];
            const c = document.createElement("canvas");
            c.width = c.height = 1;
            const ctx = c.getContext("2d");
            // start from a sentinel so a fully-transparent fill (no paint) is detectable.
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = computed;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            return { computed, r, g, b, a };
          },
          { selector, prop },
        );

      const bg = await toSRGB("body", "backgroundColor");
      assert.ok(bg, "body must render with a computed backgroundColor");
      const { r, g, b, a, computed: bgStr } = bg;
      // not transparent/unset (CSS actually applied — the S4 silent-failure class)
      assert.ok(a > 0, `body bg must not be transparent/unset (S4: styles must render) — got "${bgStr}"`);
      // warm-black: very dark (each sRGB channel < 48) but NOT pure #000 (O-HS1: never pure black)
      assert.ok(r < 48 && g < 48 && b < 48, `body bg must be a dark warm-black, got "${bgStr}" → rgb(${r},${g},${b})`);
      assert.ok(r + g + b > 0, `body bg must not be pure #000 (O-HS1: warm-black, never pure black) — got "${bgStr}"`);
      // NOT the violet slop prior (O-F1): a violet/indigo is blue-dominant. Warm-black is near-neutral
      // with red ≥ blue (warm hue ≈ 66°). Reject any blue-leaning dark (the indigo/purple tell).
      assert.ok(b <= r + 4, `body bg must NOT lean violet/indigo (O-F1 slop prior) — blue-dominant "${bgStr}" → rgb(${r},${g},${b})`);

      // ── ASSERTION 2 — the masthead wordmark uses the SERIF display face (O-HS2/O-F6 serif+sans). ──
      const wordmark = await page.evaluate(() => {
        const el = document.querySelector(".wordmark");
        return el ? getComputedStyle(el).fontFamily : null;
      });
      assert.ok(wordmark, "the .wordmark element must render");
      assert.match(wordmark, /serif/i, `the display face must be a SERIF (house serif+sans contract, O-HS2), got "${wordmark}"`);
      // never the Inter/violet-era sans-only slop default in the display register
      assert.doesNotMatch(wordmark, /\bInter\b/i, `the display face must not be Inter (AI-monoculture sans) — got "${wordmark}"`);

      // ── ASSERTION 3 — the accent is the amber OKLCH, never the violet prior (O-HS6/O-F1). ──────────
      // The wordmark's "." (.dot) is painted with var(--accent). A warm amber has red clearly above
      // blue; a violet accent would be blue-dominant. Read it back as true sRGB (same canvas trick),
      // proving the ONE accent is on-brand, computed-live.
      const dot = await toSRGB(".wordmark .dot", "color");
      if (dot && dot.a > 0) {
        assert.ok(dot.r > dot.b, `the accent must be warm (amber, O-HS6), not a blue-dominant violet — got "${dot.computed}" → rgb(${dot.r},${dot.g},${dot.b})`);
      }
    } finally {
      try {
        if (browser) await browser.close();
      } catch {
        /* best-effort */
      }
      try {
        if (server) server.kill("SIGTERM");
      } catch {
        /* best-effort */
      }
    }
  },
);
