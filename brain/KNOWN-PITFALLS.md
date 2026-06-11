---
title: "pixel — Known Pitfalls"
type: synthesis
created: 2026-06-11
updated: 2026-06-11
tags: [pitfalls, gotchas, silent-failures, version-specific, detection]
sources: ["research/raw/ecosystem-01-nextjs16.md", "research/raw/ecosystem-02-tailwind-v4.md", "research/raw/ecosystem-03-shadcn-radix.md", "research/raw/ecosystem-04-animation-stack.md", "research/raw/ecosystem-05-rsc-patterns.md", "research/raw/ecosystem-06-mockup-v0-tools.md", "research/raw/ecosystem-07-quality-cwv-a11y.md", "research/raw/ecosystem-09-agent-operating.md", "research/raw/field-02-migration-war-stories.md", "research/raw/field-03-production-failures-cwv-a11y.md", "research/raw/field-craft-03-migration-war-stories.md", "research/raw/field-craft-06-2026-invalidates-2025.md", "research/raw/field-craft-07-production-postmortems.md"]
related: ["[[BATTLE-TESTED-SCENARIOS]]", "[[EXPERTISE-MAP]]", "[[OPINIONS]]", "[[TOOL-MATRIX]]", "[[MOC - pixel]]"]
summary: "The version-keyed gotcha list — each pitfall has a detection (how an agent catches it) + an avoidance. The silent-failure ones (compile green, misbehave) are the agent's blind spot — run the grep-set in §0. §10–§12 add the field-sourced silent failures (Tailwind @apply no-op, the 'use cache' bill spike, dev-passes/prod-fails context, the a11y overlay trap)."
---

# pixel — Known Pitfalls

> Version-specific gotchas as of **2026-06-11** (Next 16.2.9 · Tailwind 4.3 · shadcn CLI 4.11 · React 19.2 · Lenis 1.3 · GSAP 3.15 · Motion 12.40). The **most dangerous class is SILENT FAILURE** — compiles, `tsc` passes, `next build` passes, then misbehaves at runtime. A human notices; an agent sees green and moves on. Each entry = **DETECT** (how a bot catches it) + **AVOID** (the fix). Severity: 🔴 silent/high-blast · 🟠 loud-but-easy-to-miss · 🟡 perf/taste.

---

## §0 — THE SILENT-FAILURE ASSERTION GREP-SET (run post-upgrade, pre-commit)
This is the single highest-leverage habit. Wire it as a hook. After ANY codemod/upgrade or Tailwind change:
```bash
# 1. residual sync params/searchParams access (Next 16 made them Promises)
grep -rn 'params\.' --include=*.tsx --include=*.ts app/ src/        # expect: only `await`ed or destructured-from-await
# 2. leftover middleware (must be proxy.ts now)
test -f middleware.ts && echo "PITFALL: middleware.ts is dead code in 16 — rename to proxy.ts"
# 3. stale Lenis import
grep -rn '@studio-freight' src/ app/ && echo "PITFALL: stale Lenis pkg — use lenis / lenis/react"
# 4. stale Tailwind directives / JS config
grep -rn '@tailwind ' .                                              # expect: none — should be @import "tailwindcss"
# 5. stale image API
grep -rn 'images.domains\|next/legacy/image' .                       # expect: none — use remotePatterns / next/image
# 6. Tailwind class actually generated (build first, then grep the OUTPUT css, not the JSX)
#    "it's in my JSX" ≠ "it generated" — content-detection is heuristic
# 7. console after load = zero hydration warnings (read via Playwright page.on('console') or 16.2 Browser Log Forwarding)
```
[ecosystem-09, ecosystem-01]

---

## §1 — Next.js 16 (the silent-failure capital)

- **§1.1 🔴 `middleware.ts` is dead code unless renamed `proxy.ts` (+ export renamed `proxy`).** Runs Node-runtime only now; Edge middleware is gone (a real regression if you relied on edge interception). **DETECT:** §0 grep #2; assert the proxy effect is observable on a request. **AVOID:** rename file + export; prefer `@next/codemod`. → [[BATTLE-TESTED-SCENARIOS]] S1. [ecosystem-01]
- **§1.2 🔴 `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` are now `Promise`s — the sync form was REMOVED, not warned.** `params.id` without `await` "is technically broken even though it compiles cleanly." Highest file-count blast radius — touches every page/layout/route-handler AND `generateImageMetadata` (`id` is now `Promise<string>`). **DETECT:** §0 grep #1. **AVOID:** `await params` / `await cookies()` everywhere. → S8 adjacency. [ecosystem-01]
- **§1.3 🔴 `next lint` was DELETED; `next build` no longer runs ESLint.** Green CI ships unlinted code. **DETECT:** is a linter invoked as its own CI step? **AVOID:** `npx @next/codemod@canary next-lint-to-eslint-cli .` + run Biome/ESLint directly. → S12. [ecosystem-01]
- **§1.4 🔴 `revalidateTag(tag)` 1-arg form silently loses SWR.** Now needs a `cacheLife` profile: `revalidateTag('blog-posts', 'max')`. 1-arg parses but drops stale-while-revalidate (silent perf/correctness shift). For read-your-writes use `updateTag(tag)` in a Server Action instead. **DETECT:** grep for single-arg `revalidateTag(`. **AVOID:** add the profile, or switch to `updateTag`. [ecosystem-01]
- **§1.5 🟠 Parallel routes now REQUIRE explicit `default.js` per slot — build FAILS without it.** (This one fails loudly.) **AVOID:** add `default.js` returning `null`/`notFound()` to every `@slot`. → S11. [ecosystem-01]
- **§1.6 🔴 The codemod misses files.** "It updates most files correctly. But it can miss files" — a documented case left a layout untouched, blew up on first staging request. **DETECT:** run §0 grep-set AFTER the codemod. **AVOID:** never trust the codemod alone; grep the residue. [ecosystem-01]
- **§1.7 🟡 `<Image quality={90}>` silently becomes 75.** `images.qualities` default `[1..100]`→`[75]`; prop coerced to nearest allowed. Also `minimumCacheTTL` 60s→4h, `imageSizes` dropped 16, `domains` deprecated→`remotePatterns`, `maximumRedirects` ∞→3, local `src` w/ query-string needs `images.localPatterns`. **DETECT:** grep `<Image` for `quality=` not in `images.qualities`. **AVOID:** declare the qualities you use. → S10. [ecosystem-01]
- **§1.8 🟡 Automatic `scroll-behavior: smooth` was REMOVED.** **AVOID:** add `data-scroll-behavior="smooth"` to `<html>`, or drive scroll with Lenis. [ecosystem-01, ecosystem-04]
- **§1.9 🟠 Turbopack auto-enables Babel if a babel config exists (previously hard-errored) → slower builds.** React Compiler (`reactCompiler: true`) is Babel-based → expect higher compile times. **AVOID:** drop unneeded babel config; accept slower builds when React Compiler is on. [ecosystem-01]
- **§1.10 🟠 Turbopack config moved (breaking): `experimental.turbopack` → top-level `turbopack`.** **DETECT:** build error / config-ignored. **AVOID:** move the key. [ecosystem-01]
- **§1.11 🟠 Removed: AMP, `serverRuntimeConfig`/`publicRuntimeConfig` (→ env vars), `experimental.ppr`/`dynamicIO`/`experimental_ppr` route export, `devIndicators` legacy options.** **AVOID:** migrate per the Removals table. [ecosystem-01]

## §2 — Tailwind CSS v4 (the CSS-first traps)

- **§2.1 🔴 Custom-color naming is STRICT: `--color-primary-500`, NOT `--primary-500`.** Wrong prefix = the utility **silently won't generate**. Same for `--font-*`, `--breakpoint-*`, `--ease-*` namespaces. **DETECT:** build + grep output CSS for the utility; if absent, check the token prefix. **AVOID:** always use the `--color-`/`--font-`/`--breakpoint-` prefixes in `@theme`. [ecosystem-02]
- **§2.2 🔴 Classes in files the heuristic skips won't generate.** Auto content-detection misses CMS strings, libs outside the project, 3rd-party UI. **DETECT:** "it's in my JSX" ≠ "it generated" — build + grep output CSS. **AVOID:** `@source "../node_modules/@my-company/ui-lib";` for excluded sources. [ecosystem-02]
- **§2.3 🟠 The upgrade tool pins you to `@config tailwind.config.js` for un-portable config.** Triggered by function-based theme extends (the `@tailwindcss/typography` `prose` plugin), custom-screen objects (`xs: { max: '360px' }`), plugin deps, OR even *empty* `extend`/`plugins`/`variants` props. **DETECT:** post-upgrade, is `@config` present and is it justified? **AVOID:** remove empty props; port breakpoints to `@custom-variant`/`@theme`; accept `@config` only for a named plugin. → S6. [ecosystem-02]
- **§2.4 🟠 Gradient override behavior changed.** v3: overriding part of a gradient with a variant RESET the whole gradient; v4: other stops are PRESERVED. Can surprise existing hover-gradient code. **DETECT:** visual diff of hover-gradient states. **AVOID:** re-test gradient hover states after migration. [ecosystem-02]
- **§2.5 🟠 `@tailwind base/components/utilities` directives removed; `container` lost `center`/`padding` config.** **AVOID:** use single `@import "tailwindcss"`; replicate container center/padding manually. [ecosystem-02]
- **§2.6 🟡 Browser floor is higher than you think (and disputed).** v4 needs Safari 16.4 / Chrome 111 / **Firefox 128** per Tailwind's own guide (higher than Chrome). Some 2026 write-ups say Firefox 111. **AVOID:** treat **Firefox 128 as the safe floor**; if you need older, stay on v3.4. → [[GAPS-AND-DISPUTES]] §1. [ecosystem-02]

## §3 — shadcn / Radix / icons

- **§3.1 🟠 `migrate radix` can leave old-style imports / add old imports after a style switch.** (Issue #9547.) **DETECT:** `grep -r '@radix-ui/react-' src/`. **AVOID:** run `migrate radix`, review the per-file diff, remove unused `@radix-ui/react-*`; target shape `import { Dialog as DialogPrimitive } from "radix-ui"`. → S14. [ecosystem-03]
- **§3.2 🔴 Switching Radix → Base UI removes `asChild` (global refactor).** `asChild` is everywhere in shadcn code; Base UI also changes Checkbox `checked` (must be boolean), ToggleGroup `value` (must be array), `Form`→`Field`, and positioning (Floating UI, not Radix positioner) → popover/tooltip behavior differs; Resizable may error. **DETECT:** count `asChild` usages before considering Base UI. **AVOID:** stay on Radix for now (it's still the default); treat Base UI as a watch-item. → [[OPINIONS]] O3, [[GAPS-AND-DISPUTES]] §2. [ecosystem-03]
- **§3.3 🟡 Phosphor app-wide bloats the bundle 16-18×.** On Next16+Turbopack, Phosphor's multi-weight component logic carries 16-18× per-icon overhead vs Lucide's ~1× (even with tree-shaking). Phosphor npm is also ~13 months stale (last publish 2025-05-22). **DETECT:** bundle-analyzer (note: `--bundle-analyzer` is weaker under Turbopack — use `--webpack`). **AVOID:** Lucide as default/base; Phosphor only for deliberate weight-hierarchy moments. → [[OPINIONS]] O4. [ecosystem-03]
- **§3.4 🟡 shadcn CLI cadence is ~weekly (4.0→4.11 in ~3 months).** Pinning to a stale CLI misses `info`/`docs`/`--dry-run`/`--diff`/GitHub-registry support. **AVOID:** use `pnpm dlx shadcn@latest`; re-verify in the nightly TOOL-MATRIX pass. [ecosystem-03]

## §4 — Animation stack

- **§4.1 🔴 `@studio-freight/react-lenis` / `@studio-freight/hamo` are RETIRED (April 2026).** Any tutorial/snippet using them is pre-April-2026 stale. Current: `lenis` + `lenis/react`. **DETECT:** §0 grep #3. **AVOID:** `import { ReactLenis, useLenis } from 'lenis/react'`. The single most common stale-tutorial error in this stack. [ecosystem-04]
- **§4.2 🔴 Two rAF loops → jitter. `new Lenis({ autoRaf: false })` is mandatory when integrating GSAP.** Then drive Lenis from `gsap.ticker` (one loop). **DETECT:** source has `autoRaf: false`? visual jitter? **AVOID:** the 4-step ticker recipe (EXPERTISE-MAP JOB 4.3). → S5. [ecosystem-04]
- **§4.3 🟡 Bare `motion` import is ~34KB; can't tree-shake smaller.** **DETECT:** bundle size of the animation chunk. **AVOID:** `LazyMotion` + `m` (~4.6KB), load `domAnimation`/`domMax` on demand; `useAnimate` mini = 2.3KB. → [[OPINIONS]] O5. [ecosystem-04]
- **§4.4 🟠 GSAP ScrollTrigger touches the DOM → must be client-side, with cleanup.** **AVOID:** `'use client'` + `useGSAP()` (from `@gsap/react`) or `useEffect` + cleanup; `gsap.registerPlugin(ScrollTrigger)`. The "scrollerProxy" setup is the classic break point when Lenis owns scroll. [ecosystem-04]
- **§4.5 🟡 Animating layout properties (not transform/opacity) drops frames.** **AVOID:** animate `transform` + `opacity` ONLY (GPU-composited); `will-change` sparingly; 200-500ms; 60fps. [ecosystem-04]

## §5 — RSC / App Router boundary

- **§5.1 🔴 Over-using `'use client'`** ships Markdown parsers, date libs, DB clients to the browser ("pretends App Router is Pages Router"). **DETECT:** grep `'use client'` density; check the client bundle for server-only deps. **AVOID:** push `'use client'` to the *leaves*; keep data-fetching + heavy deps in Server Components. [ecosystem-05]
- **§5.2 🔴 Non-serializable props across the boundary** (`Date`, class instance, non-event-handler function) → hydration mismatch. **DETECT:** zero-hydration-warning assertion (§0 #7). **AVOID:** pass primitives/plain objects; reconstruct `Date` client-side. → S8. [ecosystem-05]
- **§5.3 🔴 Browser APIs / non-deterministic output during SSR** (`Math.random()`, `Date.now()`, `window`, `localStorage`) → server HTML ≠ client HTML. **AVOID:** guard with `useEffect` or `dynamic(..., { ssr: false })`; `suppressHydrationWarning` narrowly for extension-mutated DOM. [ecosystem-05]
- **§5.4 🟠 Suspense fallback divergence** — fallback must render identically server+client; Server Components can't contain nested Suspense unless the boundary is in a `'use client'` file. **AVOID:** keep fallbacks deterministic; place Suspense boundaries deliberately. [ecosystem-05]
- **§5.5 🔴 Cache-default inversion** — migrators from 13-15 assume fetches are cached; in 16 **nothing is cached** without `use cache`; the reverse trap is enabling `cacheComponents` and getting "Uncached data outside <Suspense>". **AVOID:** wrap dynamic reads in `<Suspense>`; adopt `use cache` per-route. → S2. [ecosystem-05]
- **§5.6 🟠 `cookies().set()` in a Server Action reloads the whole app** (#50163). **AVOID:** prefer `updateTag`/`refresh` for soft updates. → S9. [ecosystem-05]
- **§5.7 🟠 Unused Server Actions still expose endpoints** (#63804, security surface) and **Server Actions don't parallelize** (#69265 — they queue). **AVOID:** audit/remove dead actions; don't fan out N actions expecting concurrency. [ecosystem-05]
- **§5.8 🔴 `cacheComponents` live-bug cluster: Clerk (#85490), Portals (#85390), CSP nonce (#89754), `<Activity>` (#86577), dup search-param router cache (#92152).** **AVOID:** per-route adoption + `<Suspense>` discipline + pin the issues; avoid `<Activity>`-wrapped portaled UI. → S2, S3. [ecosystem-05]

## §6 — Bundler (Turbopack, now default)

- **§6.1 🔴 Turbopack can DROP Tailwind/DaisyUI styles (#81763).** Build green, page unstyled. **DETECT:** build + screenshot + assert a utility applied + grep output CSS. **AVOID:** verify Tailwind renders under Turbopack before "green"; `--webpack` escape hatch. → S4. [ecosystem-05]
- **§6.2 🟠 Turbopack dev is RAM/CPU heavy (#81161, +88).** **AVOID:** `turbopackFileSystemCacheForDev: true`; `--webpack` on constrained machines. → S13. [ecosystem-05]
- **§6.3 🟠 Turbopack weak spots:** no `@next/bundle-analyzer` (#77482); standalone build omits `serverExternalPackages` (#88844); hash-mismatch external refs (#87737). **AVOID:** use `--webpack` for bundle-analysis and standalone-Docker output. [ecosystem-05]

## §7 — Quality / a11y / CWV

- **§7.1 🔴 Automated a11y catches only ~30-40% of WCAG.** axe/Lighthouse are necessary, NOT sufficient. **AVOID:** add manual keyboard + screen-reader + reduced-motion testing for the other 60-70%; never ship on a green axe alone. [ecosystem-07]
- **§7.2 🟡 Targeting stale CWV thresholds.** 2026 values: LCP **2.0s** (tightened from 2.5s, March 2026 — most write-ups still say 2.5s), INP **200ms** (FID is DEAD), CLS **0.1**. CWV pass/fail is the **75th-percentile field** number, not lab Lighthouse. **AVOID:** target 2.0s LCP; use lhci as a proxy, RUM as truth. → [[GAPS-AND-DISPUTES]] §3. [ecosystem-07]
- **§7.3 🟠 Building to WCAG 3.0 (it's not a Recommendation until ~2029).** **AVOID:** build to **WCAG 2.2 AA** (the operative legal baseline); add the 9 new criteria — esp. **3.3.8 Accessible Authentication** (no cognitive test to log in; allow password managers/passkeys), **2.5.8 Target Size ≥24px** (keep 44px house rule), **2.5.7 Dragging** (single-pointer alt), **2.4.11 Focus Not Obscured**. [ecosystem-07]
- **§7.4 🔴 Treating v0/Lovable/Bolt output as trustworthy.** ~40-45% vulnerability rate. **AVOID:** untrusted-draft posture → run the full ship gate (security + axe + lhci + impeccable + 12-dim). → S7. [ecosystem-06]

## §8 — Scaffolding / starters

- **§8.1 🟠 Forking a "popular" starter inherits stale deps.** `precedent` (5.1k★, pushed 2024-10 — ~20mo, Next 13/14, pre-Tailwind-v4, pre-async-params); old `create-t3-app` (pushed 2025-12, Next 15); `next-saas-starter`, `relivator`, `shadcn-ui/next-template` (Next 13). **AVOID:** scaffold `shadcn init -t next --base radix` + mine reference repos (next-app-router-playground, ai-chatbot, next-forge, ixartz boilerplate); don't fork. → [[OPINIONS]] O10. [ecosystem-08]

## §9 — Agent-operational (the meta-pitfalls)

- **§9.1 🔴 Emitting stale patterns is the agent's #1 failure mode** (training data is stale by construction): sync `params`, `@tailwind` directives, `@studio-freight/react-lenis`, `tailwind.config.js`, `next/legacy/image`, FID. **AVOID:** Context7 MCP for version-correct docs + nightly `npm view` re-verify + the §0 grep-set. [ecosystem-09]
- **§9.2 🟠 Trusting the compiler over assertions.** Green build ≠ working. **AVOID:** run post-change assertions (the §0 grep-set), read screenshots, read the console. [ecosystem-09]
- **§9.3 🟠 Bad multi-file writes can't easily be undone.** **AVOID:** `shadcn add --dry-run`/`--diff` before writing; let codemods do the mechanical work and only patch the gap. [ecosystem-09]

## §10 — Field-sourced silent failures (the prod-only / cost / legal class)

> These come from first-person practitioner postmortems (the two FIELD passes), not GitHub-issue triage. They share the same shape as §1's silent-failure capital — **no error is thrown; the output is just wrong, slow, expensive, or illegal.** A frontend harness's highest-value asserts target silent-wrong, not crashes.

- **§10.1 🔴 `@apply` in a CSS module / component-scoped file silently NO-OPS under Tailwind v4.** v4 moved config into the CSS (`@theme`), so a file processed independently has no theme context. Verbatim symptom (Rails dev): *"All `@apply` directives in my stylesheets are silently ignored… they just don't do anything"* — and `@apply bg-foo` may also throw `"Cannot apply unknown utility class"`. **DETECT:** grep for any `@apply` in a CSS file that lacks a sibling `@import "tailwindcss"` or `@reference "./app.css";` → flag. **AVOID:** greenfield → **never use `@apply`** (maintainer Wathan's own guidance; compose with classes-in-markup or `cva`/`tv`). If a component truly needs it, keep it in the SAME file that does `@import "tailwindcss"`, or add `@reference` (which costs build perf). → [[BATTLE-TESTED-SCENARIOS]] S18. [field-craft-03 §A (tailwindlabs discussions #16429/#18711) + field-02 §2]
- **§10.2 🔴 Next 16 `'use cache'` flip silently 2–3x's origin traffic + the cloud bill.** Implicit v15 caching → explicit v16: *"any Server Component or data function that relied on implicit caching in v15 will run uncached in v16 by default… Nothing is cached unless you add `'use cache'`."* No error; request volume + latency spike post-deploy (vercel/next.js #85470). **DETECT:** measure origin/API request count vs a pre-upgrade baseline; assert stable read-heavy routes carry an explicit `'use cache'` + `cacheLife`. **AVOID:** audit the data-fetching layer BEFORE upgrading; budget this as a cost regression. Pairs with §1.4 (single-arg `revalidateTag` drops SWR silently) and §1.1 (dead middleware). → S17; [[OPINIONS]] O2. [field-02 §1c (Next v16 guide + #85470) ; field-craft-06 §4]
- **§10.3 🔴 Context provider rendered from/above a Server boundary works in `next dev`, returns `undefined` in production.** *"React Context is unavailable in Server Components"* — hits custom AND third-party providers (`ClerkProvider`, `SessionProvider`); a dev-passes/prod-fails silent failure (the agent's blind spot). **DETECT:** run `next build && next start` (NOT just `next dev`), load context-dependent routes, assert no `undefined`/"unavailable" error. **AVOID:** all providers in a dedicated `'use client'` `providers.tsx`, mounted high in the *client* tree — never from a server component body. On React 19, avoid redundant nested same-context providers (#35397 — *"over 1000 unnecessary component function calls"*, a perf regression vs 18.3.1). → S20. [field-craft-07 §B (vercel/next.js #42301, react #35397)]
- **§10.4 🔴 The accessibility OVERLAY widget is a silent legal failure — it ships, looks "fixed," and gets the client sued.** Overlays (accessiBe-class JS) **cannot fix** heading structure, keyboard nav, form labels, semantic HTML, captions, or focus management; screen readers conflict with them; scanners audit the underlying HTML, not the overlay DOM. **FTC fined accessiBe $1M (Jan 2025)**; in H1-2025 **456 suits (22.6%) targeted sites *with* an overlay**. **DETECT:** grep deps/scripts for accessiBe/UserWay/AudioEye-class injectors → flag as a banned pattern, not an a11y solution. **AVOID:** emit semantically correct HTML by default + remediate the source to WCAG 2.2 AA; run `@axe-core/playwright` + manual keyboard/SR (axe catches only ~30-40%, per §7.1). → S16. [field-03 §2 (TestParty 2026-01-01 + FTC)]

## §11 — Field-sourced revenue/perf pitfalls (green build, leaking money)

- **§11.1 🟡 Emitting the "heaviest, jankiest solution" by default tanks CWV and conversions.** AI optimizes visual correctness, not the CWV physics — it omits exactly the moves that move money. Product pages at 4–5s LCP convert **40–50% lower** than at 2s; *"53% of sites lose between 8% and 35% of conversions… when they fail CWV in 2026."* **DETECT:** hero element missing `fetchpriority="high"`/explicit dims; below-fold images not `loading="lazy"`; third-party widgets mounted at module-top (not facade-gated); fonts in >2 weights. **AVOID:** make the S15 fix-set the DEFAULT emit (hero `fetchpriority`+srcset+dims; lazy below-fold; facade pattern for chat/review widgets; self-hosted `next/font` 2-weight + size-adjusted fallbacks; CSS `aspect-ratio`/`min-height`/`contain` to kill CLS). → S15; [[OPINIONS]] O-F5. [field-03 §1 (webvitals.tools 2026-05-12, +$1.2M A/B) + field-craft-01 §3a (Argyle)]
- **§11.2 🟡 Measuring CWV with Lighthouse-lab only — a green Lighthouse can hide a red field-INP.** INP **replaced FID** (March 2024) and in 2026 **43% of sites still FAIL the 200ms threshold** — it's the most-commonly-failed CWV. CWV pass/fail is the **75th-percentile field/RUM** number, not lab. **DETECT:** is INP measured from field data (web-vitals lib / CrUX), or only inferred from a Lighthouse score? **AVOID:** budget main-thread work; don't hydrate everything (§12.1); treat Lighthouse as a proxy, RUM as truth. Reinforces §7.2. [field-craft-06 §2 (web.dev INP, 43% fail) + field-06 §… INP-is-THE-CWV]

## §12 — Field-sourced "don't encode 2025 defaults" traps (stale-by-construction)

> The agent's #1 failure mode is emitting stale patterns (§9.1). The field set adds the 2026 deltas where a 2025 *reflex* is now the slop default.

- **§12.1 🟡 "Hydrate the whole page" is dead — below-fold eager hydration tanks INP.** Wix field data (hundreds of millions of sessions): with full hydration *"less than 40% of Wix sites achieved a 'good' INP score"* — INP was their worst competitive metric. **AVOID:** default to RSC (server components ship zero JS) + client islands hydrated on interaction/viewport entry; React 19's `use()` officially supports the selective-hydration pattern that was an undocumented Suspense hack in React 18. Result on Wix: JS −20%, INP ~40% faster. → cross-ref §5.1 (push `'use client'` to leaves). [field-craft-07 §A (wix.engineering 2025-11-09) + field-craft-06 §3]
- **§12.2 🟡 Reflexively `npm i framer-motion / @floating-ui/react / aos` is now the SLOP default — native CSS does the common case.** 2026 support floors: `:has()` 93%+, container queries 95%+, scroll-driven animations 85%, View Transitions 83%, Anchor Positioning 78%, `oklch()`+`color-mix()` 92%, native nesting 92%, subgrid 93%. One design system removed 50–100KB JS / −0.8s TTI / CSS −38% by switching. **DETECT:** a new `floating-ui`/`aos`/GSAP dep added for a job native CSS now does (a stagger, a basic page transition, a tooltip reposition). **AVOID:** native CSS FIRST (gate Anchor Positioning + View Transitions behind a Safari/long-tail fallback; `:has`/container queries are safe unguarded); Lenis only for smooth-scroll *feel*, GSAP/Motion only for orchestration CSS can't express. Sharpens the energy "lowest layer that works" ladder. → [[OPINIONS]] O-F5. [field-06 §1 (LogRocket 2026-01-21) + field-craft-06 §1 (codercops 2026-02-21)]

## Sources
§1–§9 are version-keyed to `research/raw/ecosystem-01..09` (npm-verified versions + the official Next 16 Removals/Behavior tables + 19 GitHub issues with engagement counts + maintainer quotes + migration field reports, all 2026-06-11). **§10–§12 are sourced to the two FIELD-INTELLIGENCE passes** — `research/raw/field-02/03` (committed `9a127ff`) and `research/raw/field-craft-03/06/07` — first-person postmortems (Wix INP, Shopify CWV→$1.2M), maintainer quotes (Tailwind `@apply`), cost regressions (vercel/next.js #85470), and the FTC-backed a11y-overlay trap (TestParty + accessiBe $1M fine). See [[BATTLE-TESTED-SCENARIOS]] S15–S20 for the eval-shaped versions and [[GAPS-AND-DISPUTES]] for the disputed floors (Firefox 111 vs 128, LCP 2.0 vs 2.5) and the field-sourced disputes (§11–§14).
