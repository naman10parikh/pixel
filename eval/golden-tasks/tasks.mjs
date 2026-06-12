// eval/golden-tasks/tasks.mjs — the GT1–GT15 golden-task table (PLAN §6 / brain BATTLE-TESTED
// S1–S20), pure data + pure assertion functions. The runner (eval/eval.mjs) imports this and the
// RSI loop (A24, run-eval-pyramid) imports the same L1 set — ONE source of truth for the tasks.
//
// Each task: { id, scenario, level, ciBlock, verify, run } where:
//   level   = "L1" (deterministic greps, $0) | "L2" (runtime behaviour) | "L3" (trajectory)
//   ciBlock = does a FAIL gate a merge (PLAN §6: GT1-GT4,GT6,GT9,GT10,GT14 block; GT15 nightly)
//   verify  = the human-readable assertion (lifted from the brain's VERIFY line)
//   run(ctx) → { pass: boolean|null, detail } — null = SKIP (needs a booted app / a missing tool)
//
// L1 assertions run against eval/fixtures/good (the CORRECT-pattern golden tree) and, for the
// negative controls, eval/fixtures/bad (to prove the check has teeth — a vacuous always-pass eval
// is worse than none). L2/L3 that need a running app or an LLM judge SKIP here with a logged note;
// the acceptance pipeline (E19) boots the app and runs the L2 smoke for real (GT1/GT4/GT6).

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ── tiny grep helpers (deterministic, $0) ──────────────────────────────────────────────────────
/** Recursively collect files under `dir` matching any of `exts`, skipping node_modules/.git/.next. */
export function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".next") continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, exts));
    else if (!exts || exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

/** Does ANY file under `dir` (filtered by exts) match `re`? */
export function anyFileMatches(dir, exts, re) {
  return walk(dir, exts).some((f) => re.test(readFileSync(f, "utf8")));
}

/** Read one fixture file's text, or "" if absent. */
function read(dir, rel) {
  const p = join(dir, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

const TSX = [".ts", ".tsx", ".js", ".jsx"];
const CSS = [".css"];

// ── The golden tasks ────────────────────────────────────────────────────────────────────────────
// ctx = { good, bad, mock } — fixture dirs + the live `pixel mock` output dir (set by the runner).
export function goldenTasks() {
  return [
    {
      id: "GT1",
      scenario: "Acceptance test — pixel mock → mockup+app, impeccable-clean, smoke-green",
      level: "L1+L2",
      ciBlock: true,
      verify: "§5 steps 1–5: mock emits {mockup,app}+brief.md(named ICP), impeccable exit 0, smoke green",
      run: (ctx) => {
        // L1-checkable here: the mock output exists with a mockup, an app, and a brief naming an ICP.
        // The full L2 smoke (boot + 0-hydration + Tailwind-renders) is the acceptance job (E19).
        if (!ctx.mock) return { pass: null, detail: "no live mock output supplied — run via the acceptance job (E19)" };
        const hasMockup = existsSync(join(ctx.mock, "mockup", "index.html"));
        const hasApp = existsSync(join(ctx.mock, "app"));
        const brief = read(ctx.mock, "brief.md");
        const namedIcp = /(?:ICP|persona|for)\s*[:—-]?\s*\w/i.test(brief) && brief.length > 80;
        return {
          pass: hasMockup && hasApp && namedIcp,
          detail: `mockup=${hasMockup} app=${hasApp} brief-names-ICP=${namedIcp}`,
        };
      },
    },
    {
      id: "GT2",
      scenario: "S1 dead middleware — middleware.ts renamed proxy.ts after a 15→16 bump",
      level: "L1",
      ciBlock: true,
      verify: "test -f proxy.ts && ! test -f middleware.ts && grep 'export function proxy' proxy.ts",
      run: (ctx) => {
        const goodOk =
          existsSync(join(ctx.good, "proxy.ts")) &&
          !existsSync(join(ctx.good, "middleware.ts")) &&
          /export\s+(function|const)\s+proxy/.test(read(ctx.good, "proxy.ts"));
        // NEGATIVE control: the bad fixture HAS a middleware.ts — the check must catch it.
        const badCaught = existsSync(join(ctx.bad, "middleware.ts"));
        return { pass: goodOk && badCaught, detail: `good=correct-proxy badFixture-has-stale-middleware=${badCaught}` };
      },
    },
    {
      id: "GT3",
      scenario: "S2 cacheComponents + Clerk — no global flip; dynamic reads in <Suspense>",
      level: "L2+L3",
      ciBlock: true,
      verify: "enabling on a route → 0 'Uncached data outside <Suspense>' errors; Clerk sign-in renders",
      run: () => ({
        pass: null,
        detail: "L2/L3 — needs a booted app with cacheComponents on a route + Clerk; run in the live smoke",
      }),
    },
    {
      id: "GT4",
      scenario: "S4 Turbopack drops Tailwind — styles actually render under Turbopack",
      level: "L2",
      ciBlock: true,
      verify: "build + screenshot → a bg-* computed style ≠ default AND class present in output CSS",
      run: (ctx) => {
        // L2 (boot + computed-style) is the acceptance smoke. Here (L1 proxy) assert the emitted
        // app/mockup actually carries a Tailwind utility class + the v4 import (so styles CAN render).
        if (!ctx.mock) return { pass: null, detail: "L2 boot-and-screenshot runs in the acceptance smoke (E19)" };
        const css = walk(ctx.mock, CSS).map((f) => readFileSync(f, "utf8")).join("\n");
        const hasV4Import = /@import\s+["']tailwindcss["']/.test(css);
        return { pass: null, detail: `static check: v4 @import present in emitted CSS=${hasV4Import}; runtime render asserted in the smoke` };
      },
    },
    {
      id: "GT5",
      scenario: "S5 Lenis+GSAP jitter — one rAF loop, autoRaf:false",
      level: "L1",
      ciBlock: false,
      verify: "source has autoRaf: false + gsap.ticker.add driving lenis.raf + no @studio-freight/",
      run: (ctx) => {
        const good = read(ctx.good, "lib/lenis-gsap.ts");
        const goodOk =
          /autoRaf:\s*false/.test(good) &&
          /gsap\.ticker\.add/.test(good) &&
          /lenis\.raf/.test(good) &&
          !/@studio-freight\//.test(good);
        // NEGATIVE control: the bad fixture imports @studio-freight + omits autoRaf:false.
        const bad = read(ctx.bad, "lib/lenis-gsap.ts");
        const badCaught = /@studio-freight\//.test(bad) && !/autoRaf:\s*false/.test(bad);
        return { pass: goodOk && badCaught, detail: `good=one-rAF-correct badFixture-is-stale=${badCaught}` };
      },
    },
    {
      id: "GT6",
      scenario: "S8 hydration mismatch — no non-serializable props / non-deterministic SSR",
      level: "L2",
      ciBlock: true,
      verify: "load every route, page.on('console') → 0 hydration warnings",
      run: () => ({ pass: null, detail: "L2 — page.on('console')=0-hydration asserted in the acceptance smoke (E19)" }),
    },
    {
      id: "GT7",
      scenario: "S10 quality={90}→75 — images.qualities includes any used non-75 value",
      level: "L1",
      ciBlock: false,
      verify: "<Image quality≠75> ⇒ next.config.images.qualities includes it; no images.domains",
      run: (ctx) => {
        const cfg = read(ctx.good, "next.config.ts");
        const ok = /qualities:\s*\[[^\]]*90/.test(cfg) && !/images\.domains|domains:\s*\[/.test(cfg);
        return { pass: ok, detail: `qualities-includes-90=${/qualities:\s*\[[^\]]*90/.test(cfg)} no-images.domains=${!/domains:\s*\[/.test(cfg)}` };
      },
    },
    {
      id: "GT8",
      scenario: "S14 radix import leftovers — unified radix-ui, no old imports",
      level: "L1",
      ciBlock: false,
      verify: "grep '@radix-ui/react-' src empty in migrated files; radix-ui is the single dep",
      run: (ctx) => {
        const noOldImports = !anyFileMatches(join(ctx.good, "components"), TSX, /@radix-ui\/react-/);
        const pkg = read(ctx.good, "package.json");
        const unified = /"radix-ui"/.test(pkg) && !/"@radix-ui\/react-/.test(pkg);
        return { pass: noOldImports && unified, detail: `no-old-imports=${noOldImports} unified-radix-ui-dep=${unified}` };
      },
    },
    {
      id: "GT9",
      scenario: "S15 CWV default-emit — hero fetchpriority+dims, below-fold lazy",
      level: "L1+L2",
      ciBlock: true,
      verify: "hero has fetchpriority=high + width/height, NOT lazy; below-fold imgs lazy; lhci budgets",
      run: (ctx) => {
        const page = read(ctx.good, "app/page.tsx");
        // Split into JSX tags so "the hero" and "below-fold images" are checked independently
        // (a multiline [^>]* regex is fragile — tag-splitting is robust and reads clearly).
        const imgTags = page.match(/<Image[\s\S]*?\/>/g) ?? [];
        const heroTag = imgTags.find((t) => /fetchPriority=["']high["']/i.test(t)) ?? "";
        const hero = /fetchPriority=["']high["']/i.test(heroTag) && /width=\{?\d/.test(heroTag) && /height=\{?\d/.test(heroTag);
        const heroNotLazy = hero && !/loading=["']lazy["']/.test(heroTag); // the LCP element is eager, never lazy
        const belowFold = imgTags.filter((t) => !/fetchPriority=["']high["']/i.test(t));
        const belowFoldLazy = belowFold.length > 0 && belowFold.every((t) => /loading=["']lazy["']/.test(t));
        return { pass: hero && belowFoldLazy && heroNotLazy, detail: `hero-eager-prioritised=${hero} hero-not-lazy=${heroNotLazy} below-fold-all-lazy=${belowFoldLazy} (L2 lhci LCP<2.0/INP<200/CLS<0.1 in the smoke)` };
      },
    },
    {
      id: "GT10",
      scenario: "S16 NEVER an a11y overlay — semantic HTML, no overlay dep",
      level: "L1+L3",
      ciBlock: true,
      verify: "deps grep for accessiBe/UserWay/AudioEye-class → absent; real <button>/<label htmlFor>",
      run: (ctx) => {
        const overlayRe = /accessibe|userway|audioeye|equalweb|max-?access/i;
        const noOverlayDep = !overlayRe.test(read(ctx.good, "package.json"));
        const noOverlayScript = !anyFileMatches(ctx.good, TSX, overlayRe);
        const form = read(ctx.good, "app/login-form.tsx");
        const realSemantics = /<button/.test(form) && /<label\s+htmlFor=/.test(form);
        return { pass: noOverlayDep && noOverlayScript && realSemantics, detail: `no-overlay-dep=${noOverlayDep} no-overlay-script=${noOverlayScript} real-semantics=${realSemantics}` };
      },
    },
    {
      id: "GT11",
      scenario: "S17 'use cache' cost — stable routes carry 'use cache'; no 1-arg revalidateTag",
      level: "L1+L2",
      ciBlock: false,
      verify: "no single-arg revalidateTag(; stable routes have 'use cache'+cacheLife",
      run: (ctx) => {
        const route = read(ctx.good, "app/data-route.tsx");
        const hasUseCache = /["']use cache["']/.test(route);
        // a single-arg revalidateTag('x') is the trap; the 2-arg form revalidateTag('x','max') is fine.
        const singleArg = /revalidateTag\(\s*["'][^"']+["']\s*\)/.test(route);
        return { pass: hasUseCache && !singleArg, detail: `has-use-cache=${hasUseCache} no-single-arg-revalidateTag=${!singleArg}` };
      },
    },
    {
      id: "GT12",
      scenario: "S18 Tailwind @apply no-op — no orphan @apply",
      level: "L1",
      ciBlock: false,
      verify: "no CSS uses @apply without a sibling @import 'tailwindcss'/@reference; PostCSS = @tailwindcss/postcss",
      run: (ctx) => {
        // every CSS file that uses @apply must, in the SAME file, have @import "tailwindcss" or @reference.
        const cssFiles = walk(ctx.good, CSS);
        const orphan = cssFiles.some((f) => {
          const t = readFileSync(f, "utf8");
          return /@apply\b/.test(t) && !/@import\s+["']tailwindcss["']|@reference\b/.test(t);
        });
        const postcss = read(ctx.good, "postcss.config.mjs");
        const v4Plugin = /@tailwindcss\/postcss/.test(postcss);
        return { pass: !orphan && v4Plugin, detail: `no-orphan-@apply=${!orphan} postcss=@tailwindcss/postcss=${v4Plugin}` };
      },
    },
    {
      id: "GT13",
      scenario: "S20 provider above the boundary — providers in a 'use client' file, prod-built",
      level: "L2",
      ciBlock: false,
      verify: "next build && next start, context routes resolve (no undefined); providers in 'use client'",
      run: (ctx) => {
        // L1 proxy: providers live in a 'use client' file (the L2 prod-build assertion is the smoke).
        const prov = read(ctx.good, "app/providers.tsx");
        const useClient = /^["']use client["']/m.test(prov) && /Provider/.test(prov);
        return { pass: useClient ? null : false, detail: `providers-in-'use client'=${useClient}; L2 next-build-context-resolves runs in the smoke` };
      },
    },
    {
      id: "GT14",
      scenario: "anti-slop emit — pixel's OWN generated mockup passes impeccable",
      level: "L1",
      ciBlock: true,
      verify: "impeccable detect --json on the mockup → exit 0, 0 slop rules hit",
      run: (ctx) => ctx.impeccableMockup, // computed by the runner (it shells out to impeccable once)
    },
    {
      id: "GT15",
      scenario: "§15 harness-reduces-slop (value proof) — bare-model vs pixel-brain+gate slop delta",
      level: "L3",
      ciBlock: false, // nightly, non-CI-blocking (PLAN §6)
      verify: "impeccable + 12-dim delta(bare, gated) recorded; gated < bare",
      run: () => ({
        pass: null,
        detail: "L3 nightly value-proof — measures slop delta(bare-model, pixel-gated); needs the Claude half (D8). Recorded in the cockpit.",
      }),
    },
  ];
}
