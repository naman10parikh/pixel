---
title: "pixel — Battle-Tested Scenarios"
type: synthesis
created: 2026-06-11
updated: 2026-06-11
tags: [scenarios, golden-tasks, eval, failure-modes, migration, production]
sources: ["research/raw/ecosystem-01-nextjs16.md", "research/raw/ecosystem-02-tailwind-v4.md", "research/raw/ecosystem-03-shadcn-radix.md", "research/raw/ecosystem-04-animation-stack.md", "research/raw/ecosystem-05-rsc-patterns.md", "research/raw/ecosystem-06-mockup-v0-tools.md", "research/raw/ecosystem-07-quality-cwv-a11y.md", "research/raw/field-02-migration-war-stories.md", "research/raw/field-03-production-failures-cwv-a11y.md", "research/raw/field-craft-03-migration-war-stories.md", "research/raw/field-craft-07-production-postmortems.md"]
related: ["[[EXPERTISE-MAP]]", "[[KNOWN-PITFALLS]]", "[[OPINIONS]]", "[[MOC - pixel]]"]
summary: "≥20 real, specific failure/migration/production scenarios with root cause + resolution + a verifiable assertion — these are the golden eval tasks for Wave S (Hamel L1/L2/L3). S1–S14 are GitHub-issue-sourced; S15–S20 are the field-practitioner scenarios (postmortems + revenue/legal stakes) the ecosystem pass lacked."
---

# pixel — Battle-Tested Scenarios

> These are **real** scenarios pulled from the research: live Next.js GitHub issues (reaction/comment counts shown), documented migration field reports, and maintainer threads — not invented. Each is shaped as a **golden eval task** for the DSIP eval pyramid (`dsip.json`): a **trigger** (the situation), the **symptom** (what the user/CI sees), the **root cause**, the **resolution** (what a competent pixel agent does), and a **VERIFY** assertion (the L1/L2 check that proves it). The `eval/` rubric (`brain/BATTLE-TESTED-SCENARIOS.md → golden tasks`) should encode the VERIFY lines.
>
> Difficulty is tagged. The high-value ones for pixel are the **silent-failure** class (compiles green, misbehaves) — an agent's blind spot — and the **Cache-Components live-bug** cluster.

---

## S1 — The middleware that silently became dead code [migration · silent-failure · HIGH]
- **Trigger:** Agent bumps a Next 13–15 app to 16 by editing `package.json` manually (skips the codemod), or runs the codemod and it misses a file. App has `middleware.ts` doing auth/geo-routing.
- **Symptom:** Build is green, `tsc` passes, `next build` passes. In production, auth/geo logic **does nothing** — `middleware.ts` "still sits there, compiles without issue, passes TypeScript checks, and does absolutely nothing at runtime." No error, no warning.
- **Root cause:** Next 16 renamed the file → `proxy.ts` and the export → `proxy`, and moved it to the **Node.js runtime only** (Edge middleware is gone). The old `middleware.ts` is retained-but-deprecated *solely* for the Edge case and is otherwise inert.
- **Resolution:** Rename `middleware.ts` → `proxy.ts`, rename `export function middleware` → `export function proxy`. If the logic relied on Edge low-latency interception (edge geo-routing, edge A/B), recognize that as a **real regression** and re-architect. Prefer `npx @next/codemod@canary upgrade latest`, then grep for the leftover.
- **VERIFY:** `test -f app/proxy.ts && ! test -f middleware.ts` (or at root) AND `grep -q 'export function proxy\|export const proxy' proxy.ts` AND the proxy's effect is observable on a request (e.g. redirect/header present). [ecosystem-01 gotcha #1]

## S2 — Enabling cacheComponents broke Clerk sign-in [production · live-bug #85490 · HIGH]
- **Trigger:** Agent sets `cacheComponents: true` globally in `next.config.ts` to "turn on caching for perf." App uses Clerk for auth.
- **Symptom:** The Clerk sign-in route throws **`Uncached data outside <Suspense>`**; sign-in is broken. (Issue **#85490**, +10, 13 comments, OPEN.)
- **Root cause:** With Cache Components on, *nothing* is cached unless marked, and any **dynamic/uncached read not wrapped in `<Suspense>`** errors. Clerk reads dynamic request data (auth state) outside a Suspense boundary.
- **Resolution:** Do NOT flip `cacheComponents` on globally. Adopt it **per-route** on stable read-heavy routes only, and wrap ALL dynamic/uncached reads (auth, headers, cookies) in `<Suspense>` from the start. Pin/watch #85490, #85672 (`use cache: private` on soft-nav), #74158 (cacheLife forces unexpected Suspense).
- **VERIFY:** With `cacheComponents` enabled on a route, loading every route produces **zero** "Uncached data outside <Suspense>" console/server errors AND the Clerk sign-in route renders and authenticates. [ecosystem-05, ecosystem-01]

## S3 — Modal stays stuck on screen after navigation [production · live-bug #85390 · MEDIUM]
- **Trigger:** App with `cacheComponents: true` uses a React Portal for a modal/tooltip; user opens it, then navigates to another route.
- **Symptom:** The portaled content (modal/tooltip) **stays stuck on screen after the route change** — portal cleanup leaks across navigations. (Issue **#85390**, +13, 13 comments, CLOSED — so a fix/workaround exists; verify against the installed patch line.)
- **Root cause:** Cache Components + route preservation interferes with React Portal unmount/cleanup; the portal's effect cleanup doesn't fire on soft navigation. Related: `<Activity>` + cacheComponents route-preservation (#86577, 74 comments, OPEN).
- **Resolution:** Confirm the installed Next patch includes the #85390 fix; if portals still leak, gate portal teardown on `pathname` change (e.g. close-on-route-change via the router) and avoid `<Activity>`-wrapped portaled UI until #86577 resolves.
- **VERIFY:** Open a portaled modal, navigate away, assert the modal node is **removed from the DOM** (`document.querySelector('[role=dialog]') === null`) after navigation. [ecosystem-05]

## S4 — Turbopack silently dropped the Tailwind styles [migration · silent-failure · #81763 · HIGH]
- **Trigger:** Agent scaffolds/upgrades to Next 16 (Turbopack is now the DEFAULT bundler) with Tailwind v4 (and/or a plugin like DaisyUI). Declares the scaffold "green" because it builds.
- **Symptom:** The build succeeds but the rendered page is **unstyled / missing Tailwind styles** — "Turbopack removes styles from TailwindCSS/DaisyUI." (Issue **#81763**, +30, 16 comments, OPEN.)
- **Root cause:** Certain Tailwind/plugin setups lose styles under Turbopack's CSS handling. The agent's blind spot: "it's in my JSX and it built" ≠ "it rendered."
- **Resolution:** After any Tailwind work under Turbopack, **build and visually verify Tailwind actually renders** (screenshot + read it). If styles drop, fall back `next dev --webpack` / `next build --webpack` (the documented escape hatch) until the Tailwind-v4 + Turbopack path is confirmed for the specific plugin set. Verify which Tailwind integration path `create-next-app` wired (PostCSS vs webpack-plugin vs Vite) — see [[GAPS-AND-DISPUTES]] §4.
- **VERIFY:** Build under Turbopack, take a Playwright screenshot, assert a known Tailwind utility actually applied (e.g. computed `background-color` of a `bg-` element ≠ default) AND grep the output CSS for the class. [ecosystem-05, ecosystem-02, ecosystem-09]

## S5 — Jittery scroll after wiring Lenis + GSAP [integration · #1-gotcha · HIGH]
- **Trigger:** Agent adds smooth scroll (Lenis) and scroll-triggered animation (GSAP ScrollTrigger) to a Next page, following a typical tutorial.
- **Symptom:** Scroll is **janky/jittery**, animations fight the scroll, frame drops.
- **Root cause:** Two requestAnimationFrame loops running simultaneously (Lenis's own rAF + GSAP's ticker) fight each other. The canonical fix requires exactly ONE rAF loop.
- **Resolution:** `const lenis = new Lenis({ autoRaf: false })` (**`autoRaf: false` is mandatory**), then `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add((time) => lenis.raf(time * 1000))`, `gsap.ticker.lagSmoothing(0)`. Run client-side (`'use client'` + `useGSAP()` from `@gsap/react`; `gsap.registerPlugin(ScrollTrigger)`). ALSO ensure the import is `lenis`/`lenis/react`, NOT `@studio-freight/*` (stale).
- **VERIFY:** Source contains `autoRaf: false` AND `gsap.ticker.add` driving `lenis.raf` AND no `@studio-freight/` import; visually, scroll is smooth at 60fps (manual/observed). [ecosystem-04]

## S6 — The Tailwind v4 migration that still demanded a JS config [migration · maintainer-confirmed · MEDIUM]
- **Trigger:** Agent runs `npx @tailwindcss/upgrade` on a v3 project that uses the `@tailwindcss/typography` (`prose`) plugin, or a custom screen like `xs: { max: '360px' }`, or even just leftover empty `extend`/`plugins` props.
- **Symptom:** The upgrade tool **keeps `tailwind.config.js`** and emits `@config '../../tailwind.config.js';` — the "CSS-first, no JS config" promise didn't fully land. Confusion: "still need tailwind.config.js?" (Discussion **#16642**, maintainer wongjn: *"If the upgrade tool sees some configuration it can't port, it will keep your JS config file."*)
- **Root cause:** Function-based theme extensions (the typography plugin uses one), custom-screen objects, plugin dependencies, and even *empty* config props have **no CSS equivalent**, so the tool pins you to `@config`.
- **Resolution:** Accept the pinned `@config` ONLY where a plugin forces it (it's the documented escape hatch). Otherwise port to CSS: custom breakpoint → `@custom-variant xs (@media (max-width: 360px));` or `@theme { --breakpoint-xs: 22.5rem; }`. Remove empty `extend`/`plugins`/`variants` props (they trigger retention). Run on a clean branch so you can revert+redo (Discussion #15809: migration errors are "mainly caused by existing/added plugins … when removed, migration works perfectly").
- **VERIFY:** Either no `tailwind.config.*` exists AND `@import "tailwindcss"` is present, OR a `@config` line exists *and* is justified by a named plugin in `package.json`. No leftover `@tailwind base/components/utilities` directives. [ecosystem-02]

## S7 — The v0-generated UI that shipped a vulnerability [production · security · HIGH]
- **Trigger:** Agent generates a UI via the v0 Platform API (`v0.chats.create`) and, seeing it "look right," moves it toward main with light review ("customer teams now routinely move v0-generated UIs straight into production with light review").
- **Symptom:** The merged code carries a security vulnerability (XSS, exposed endpoint, missing auth check, etc.). Statistically, v0/Lovable/Bolt output has a **~40-45% vulnerability rate**.
- **Root cause:** v0-class generators optimize for visual correctness, not security; "light review" ≠ "no review." Generated code is an **untrusted draft**.
- **Resolution:** Treat ALL v0/Lovable/Bolt output as untrusted draft. Before it touches main: run the security review + `@axe-core/playwright` + Lighthouse-CI + impeccable + 12-dim binary audit (the JOB 7 ship gate). pixel's moat = the audit/taste gates, not the generator.
- **VERIFY:** No v0-sourced diff merges without a passing security review recorded; the 7-step ship gate ran (impeccable exit 0, axe 0 violations, lhci budgets met). [ecosystem-06, ecosystem-07]

## S8 — Hydration mismatch from a non-serializable prop / non-deterministic render [production · RSC · HIGH]
- **Trigger:** A Server Component passes a `Date` object (or a class instance, or a function) to a Client Component, OR a component renders `Math.random()`/`Date.now()`/`window`/`localStorage` during SSR.
- **Symptom:** Console: **"Hydration failed"** / text-content mismatch; UI flickers or resets on hydrate. An agent can't *see* this without reading the console.
- **Root cause:** (a) Anything that doesn't survive `JSON.stringify` across the Server→Client serialization boundary arrives different on the client; (b) non-deterministic values differ between server-render and client-render → server HTML ≠ client HTML. (Issue #45047 is the canonical "interact before full load → hydration failed" case.)
- **Resolution:** Pass primitives/plain objects across the boundary; reconstruct `Date` client-side. Guard browser APIs with `useEffect` or `dynamic(() => import(...), { ssr: false })`. For DOM mutated by extensions/password-managers pre-hydration, use `suppressHydrationWarning` *narrowly*. Push `'use client'` to the leaves.
- **VERIFY:** Load every route, read the browser console (Next 16.2 Browser Log Forwarding or Playwright `page.on('console')`), assert **zero hydration warnings**. [ecosystem-05]

## S9 — Setting a cookie in a Server Action reloaded the whole app [production · UX-wart · #50163 · MEDIUM]
- **Trigger:** Agent implements a login/session/preference flow that calls `cookies().set()` inside a Server Action.
- **Symptom:** The action triggers a **full app reload** instead of a smooth update — jarring UX on auth/session flows. (Issue **#50163**, +57, 27 comments, OPEN — long-standing.)
- **Root cause:** Known Next behavior: mutating cookies in a Server Action reloads the entire app. Related: `updateTag`/`refresh` exist precisely to give finer-grained, in-request freshness.
- **Resolution:** Where a smooth update matters, prefer `updateTag(tag)` for read-your-writes (expire + read fresh in the same request) and `refresh()` for uncached side-data, rather than relying on a cookie-set side effect to drive the UI. Accept the reload only where a hard session boundary is acceptable. Audit unused Server Actions — they still expose endpoints (#63804).
- **VERIFY:** The post-mutation UX is the intended one (no unexpected full reload where a soft update was specified); behavior matches the spec for the flow. [ecosystem-05, ecosystem-01]

## S10 — quality={90} silently downgraded to 75 [migration · silent-failure · MEDIUM]
- **Trigger:** Agent upgrades to Next 16; existing `<Image quality={90} />` usages remain.
- **Symptom:** Images render at **quality 75**, not 90 — subtly softer. No error. (Also: `minimumCacheTTL` 60s→4h, `imageSizes` dropped 16, `domains` deprecated → `remotePatterns`, `maximumRedirects` unlimited→3.)
- **Root cause:** Next 16 changed `images.qualities` default `[1..100]` → **`[75]`**; the `quality` prop is coerced to the nearest *allowed* value, so 90 → 75 unless you opt back in.
- **Resolution:** Add `images: { qualities: [75, 90] }` (or the needed set) to `next.config.ts` if you intend non-75 quality. Migrate `images.domains` → `images.remotePatterns`; for local `src` with query strings add `images.localPatterns`.
- **VERIFY:** If any `<Image>` uses `quality` ≠ 75, `next.config` `images.qualities` includes that value; no `images.domains` remains. [ecosystem-01]

## S11 — Parallel route build failed for want of a default.js [migration · loud-fail · MEDIUM]
- **Trigger:** App uses parallel routes (`@slot` folders); agent upgrades to 16.
- **Symptom:** **Build FAILS** (this one fails loudly, unlike S1/S4/S10) — every parallel-route slot now REQUIRES an explicit `default.js`.
- **Root cause:** Next 16 removed the implicit default behavior for parallel-route slots.
- **Resolution:** Add a `default.js` to every slot that returns `null` or calls `notFound()`.
- **VERIFY:** Every `@slot` directory contains a `default.{js,tsx}`; `next build` succeeds. [ecosystem-01]

## S12 — Green CI shipped unlinted code after next lint was deleted [migration · silent-failure · CI · MEDIUM]
- **Trigger:** CI pipeline relied on `next lint` (or `next build` running ESLint). Agent upgrades to 16.
- **Symptom:** CI is **green while shipping un-linted code** — `next build` no longer runs ESLint and `next lint` was DELETED.
- **Root cause:** Next 16 removed `next lint`; linting is no longer part of the build.
- **Resolution:** `npx @next/codemod@canary next-lint-to-eslint-cli .` and run Biome or ESLint directly in CI as a separate step.
- **VERIFY:** CI config invokes a linter directly (eslint/biome) as its own step; `next lint` appears nowhere; lint failures fail the build. [ecosystem-01]

## S13 — Turbopack dev server ate all the RAM [production · dev-env · #81161 · MEDIUM]
- **Trigger:** Large app, developer/agent runs `next dev` (Turbopack default) on a memory-constrained machine.
- **Symptom:** Dev server uses **excessive RAM/CPU**, machine thrashes. (Issue **#81161**, +88 — the most-reacted Turbopack issue — 45 comments, OPEN.)
- **Root cause:** Turbopack dev memory usage on large apps.
- **Resolution:** Enable Turbopack FS caching: `experimental: { turbopackFileSystemCacheForDev: true }` ("all internal Vercel apps already use this"); if still constrained, fall back `next dev --webpack`. Note: `--bundle-analyzer` (#77482) and standalone `serverExternalPackages` (#88844) are also weaker on Turbopack — use `--webpack` for those specific tasks.
- **VERIFY:** With FS cache on, dev memory stays workable; `--webpack` documented as the escape hatch for bundle-analysis and standalone-Docker builds. [ecosystem-05, ecosystem-01]

## S14 — shadcn radix migration left old imports behind [migration · #9547 · MEDIUM]
- **Trigger:** Agent runs `pnpm dlx shadcn@latest migrate radix` to move to the unified `radix-ui` package, OR scaffolds and gets old-style imports.
- **Symptom:** Components are **still added with old-style `@radix-ui/react-*` imports** after switching style. (Issue **#9547**, "still old imports" friction.)
- **Root cause:** CLI friction between the chosen style and the migration; the rewrite is per-file and can miss/regress.
- **Resolution:** Run `migrate radix` (for non-default dirs: `... migrate radix src/components/custom`), **review the diff** (every UI file is rewritten), then remove unused `@radix-ui/react-*` deps. Import shape after: `import { Dialog as DialogPrimitive } from "radix-ui"` (not `import * as DialogPrimitive from "@radix-ui/react-dialog"`).
- **VERIFY:** `grep -r '@radix-ui/react-' src/` returns nothing in migrated files; `radix-ui` is the single dep; components render. [ecosystem-03]

---

## Field-practitioner scenarios (postmortems + revenue/legal stakes — the non-GitHub-issue layer)

> S15–S20 come from the two FIELD-INTELLIGENCE passes — first-person production postmortems with **numbers**, and failures with **money or litigation** attached. They close the gap the ecosystem set named in its own Sources line ("the absence of independent FIELD-practitioner scenarios beyond GitHub issues") and [[GAPS-AND-DISPUTES]] §7. Citation chain preserved: `field file → original author/URL/date`. These shift the eval set from *what framework bug fires* toward *what costs revenue, gets you sued, or silently 2–3x's your bill*.

## S15 — The CWV fix that moved $1.2M / the perf moves AI omits by default [production · revenue · A/B-validated · HIGH]
- **Trigger:** Agent ships a Shopify-class product/collection page. By default it emits the "heaviest, jankiest solution" (Argyle): unsized hero `<img>`, no `fetchpriority`, all images eager, third-party chat/review widgets loaded on page-load, fonts in 5 weights, no `aspect-ratio` reservations.
- **Symptom:** LCP 4.1s, INP 520ms, CLS 0.28. Mobile conversion stuck at 1.4%, bounce 58%. The build is "green" and "looks right" — but the field number (75th-pct RUM) is failing and money is leaking. Product pages at 4–5s LCP convert **40–50% lower** than at 2s.
- **Root cause:** AI optimizes for visual correctness, not the CWV physics; the exact perf moves are the ones it skips unless told. This is a *revenue* regression hiding behind a green build.
- **Resolution (encode as pixel's DEFAULT emit, not an afterthought):** hero gets `fetchpriority="high"` + responsive `srcset`/`sizes` (400/600/800/1200w) + explicit `width`/`height`; everything below the fold `loading="lazy"`; image payload target −78% (1.8MB→390KB). **Facade pattern** for chat/review widgets (load on click), consolidate third-party JS (1.2MB→340KB). CLS: CSS `aspect-ratio` + `min-height: 52px` on variant selectors + `contain: layout` + fixed-height placeholders; fonts cut 5→2 weights, self-hosted via `next/font`, `font-display: swap`, **size-adjusted fallback fonts**. Verbatim rationale: *"Reserve consistent space for variant buttons…min-height: 52px…Fixed dimensions prevent reflow when availability changes."*
- **Outcome (proof this is causal, not correlation):** LCP −61% (→1.6s), INP −63% (→190ms), CLS −86% (→0.04); **+17% mobile conversion (1.4%→1.64%), −24% bounce, +$1.2M annualized on a $28M base, 34× ROI** — validated via a **90-day A/B holdout**. (Corroborated: Rakuten 24 +53% rev/visitor; Vodafone Italy 31% LCP → +8% sales.)
- **VERIFY (L1):** hero element has `fetchpriority="high"` AND explicit `width`/`height` AND is NOT `loading="lazy"`; every below-fold `<img>` IS `loading="lazy"`; third-party widget mount is gated behind an interaction (facade), not module-top. **(L2/field):** lhci LCP<2.0s, INP<200ms, CLS<0.1 on the built page (lab proxy); the real gate is RUM/field-INP, not just Lighthouse. [field-03 §1 (webvitals.tools 2026-05-12, A/B-validated) + field-craft-01 §3a (Argyle "heaviest, jankiest solution")]

## S16 — The accessibility OVERLAY that got the client sued anyway [production · legal · FTC-backed · HIGH]
- **Trigger:** To "fix accessibility fast," an agent (or a vendor it recommends) installs an automated accessibility-overlay widget (accessiBe-class JS) and calls a11y done — instead of fixing the underlying HTML.
- **Symptom:** The site STILL fails real users and STILL gets sued. In H1-2025, **456 lawsuits (22.6%) targeted sites *with* an overlay installed**; >1,000 businesses (>25% of all digital-accessibility suits) were sued *despite* having one; **>40% of suits target previously-sued companies** — often the overlay users. Screen readers conflict with the overlay; automated scanners evaluate the *underlying* HTML (not the overlay-modified DOM), so it fails the audit too. Verbatim (a customer): *"It's like putting a post-it on a bandit instead of a Band-Aid."*
- **Root cause:** Overlays add a JS layer but **cannot fix** heading structure, keyboard navigation, missing form labels, semantic HTML, captions, PDF a11y, or modal focus management. The **FTC fined accessiBe $1M (Jan 2025)** for false "makes your site WCAG-compliant" claims. This is a11y *theater* — the most expensive slop, because it carries litigation (8,667 ADA web suits in 2025; Fashion Nova settled for ~$2.43M + a mandated policy within 180 days). For US public-sector sites, WCAG 2.1 AA became a hard ADA Title II deadline (population 50k+, April 24 2026).
- **Resolution:** NEVER use an overlay. Emit *semantically correct* HTML by default (real `<button>`, `<label for>`, heading order, focus management) and remediate the source (~2–4 weeks to WCAG 2.2 AA). The top-8 real fixes: alt text (1.1.1), contrast (1.4.3), form labels (1.3.1/4.1.2), keyboard nav (2.1.1/2.1.2), skip links (2.4.1), heading hierarchy (1.3.1), link purpose (2.4.4), ARIA on custom elements (4.1.2). This is the legal teeth behind Argyle's *"AI throws `aria-hidden='true'` at a wall and hopes it sticks."*
- **VERIFY (L3 trajectory):** the agent never recommends/installs an overlay package (grep deps for accessiBe/UserWay/AudioEye-class scripts → must be absent); it runs `@axe-core/playwright` AND adds manual keyboard/screen-reader checks (axe alone catches only ~30-40%). **(L1):** real `<button>`/`<label htmlFor>` used instead of `<div onClick>` for controls/labels. [field-03 §2 (TestParty 2026-01-01 overlay trap + FTC; WCAGsafe/EcomBack 2025 lawsuit stats + Fashion Nova settlement)]

## S17 — The Next 16 bump that silently 2–3x'd the cloud bill ['use cache' flip · cost regression · HIGH]
- **Trigger:** Agent bumps a Next 15 app to 16 (runs the codemod, build is green) on an app whose Server Components / data functions relied on **implicit** v15 caching.
- **Symptom:** No error, no warning — but origin/API request volume and latency **spike dramatically** after deploy (vercel/next.js **#85470**, "Server requests and latency increased after upgrading from 15 to 16"). The cloud bill follows. This is a *revenue-adjacent* regression with zero code-level signal.
- **Root cause:** Next 16 flipped the caching model from implicit → **explicit**. Verbatim (v16 upgrade guide): *"any Server Component or data function that relied on implicit caching in v15 will run uncached in v16 by default… Nothing is cached unless you add `'use cache'`."* Every fetch that *was* implicitly cached is now uncached.
- **Resolution:** Audit the data-fetching layer BEFORE upgrading (devanddeliver). Re-introduce caching deliberately: add `'use cache'` (with a `cacheLife` profile) to stable read-heavy data; budget this as a **cost regression**, not just a code change. Pair with the §0/[[KNOWN-PITFALLS]] grep for single-arg `revalidateTag` (which silently drops SWR) and `middleware.ts`→`proxy.ts` (which silently dead-codes interception). Note the related trap (S2): flipping `cacheComponents: true` on globally instead errors "Uncached data outside `<Suspense>`" — the two failure modes bracket the same inversion.
- **VERIFY (L2):** post-upgrade, measure request count / origin traffic against a pre-upgrade baseline and assert it didn't regress unexpectedly; stable data routes carry an explicit `'use cache'` + lifetime, not an implicit assumption. **(L1):** no single-arg `revalidateTag(` remains; no `middleware.ts` remains (must be `proxy.ts`). [field-02 §1c (Next v16 upgrade guide + vercel/next.js #85470 + devanddeliver) + field-02 §1a (SquaredTech 2026-05-28, the four silent breaks)]

## S18 — The Tailwind v4 migration that ran 48h then got rolled back [migration · silent-purge · MEDIUM]
- **Trigger:** Agent runs `npx @tailwindcss/upgrade` on an existing v3 app (Next.js + Turbopack, custom global CSS, older PostCSS plugins, `@apply` in CSS modules) and trusts "it compiled."
- **Symptom:** SILENT failures, no build error: *"Our custom global styles were not applied"*; *"Many utility classes silently failed or were purged due to changes in JIT compilation"*; `@apply` in a component-scoped CSS module = `"Cannot apply unknown utility class"` or just **does nothing**: *"All `@apply` directives in my stylesheets are silently ignored… they just don't do anything."* Borders/rings visually break (default border `gray-200`→`currentColor`; `ring` 3px-blue→1px-currentColor).
- **Root cause:** v4 moved config from `tailwind.config.js` into the CSS (`@theme`), so a global config is no longer available to every independently-processed stylesheet. The PostCSS plugin split into `@tailwindcss/postcss` (old inline reference silently no-ops); the browser floor moved to **Safari 16.4 / Chrome 111 / Firefox 128**. After **48 hours** of the official upgrade path + reinstalls + config edits + build-tool swaps, the team downgraded back to v3: *"Unless you're building something from scratch or are fully aligned with its changes, v3 is still the safer bet."*
- **Resolution:** Greenfield → v4 from day 1 and **never use `@apply`** (maintainer Wathan's own guidance — compose with classes-in-markup or `cva`/`tv`). Existing-app migration: (1) strip plugins before running the codemod (plugin incompatibility is the #1 auto-upgrade failure), (2) expect to rewrite the PostCSS config + `@theme`, (3) verify the browser floor against the product's analytics, (4) **diff the built CSS** — don't trust "it compiled"; an `@apply` in a CSS file with no `@import`/`@reference` is a lint-catchable bug. The codemod gets you ~70% and lies about the rest.
- **VERIFY (L1):** no CSS file uses `@apply` without a sibling `@import "tailwindcss"` or `@reference`; PostCSS config references `@tailwindcss/postcss` (not the old inline plugin); build the CSS and grep the OUTPUT for an expected utility (presence in JSX ≠ generated). [field-02 §2 (Gudipati downgrade postmortem 2025-04-15 + tailwindlabs discussions #16642/#15809) + field-craft-03 §A (the `@apply` silent-ignore + `@reference` cost, discussions #16429/#18711)]

## S19 — The Radix→Base UI swap that broke every composed component [migration · API-removal · HIGH]
- **Trigger:** Agent "modernizes" an existing shadcn/Radix app to Base UI as a **big-bang** global swap (rename imports, run the migrate command, ship).
- **Symptom:** Compiles in places, breaks pervasively: every `<X asChild>` site is now wrong (the prop is gone); `Select` renders incorrectly because `Select.Content`/`Select.Viewport` don't map onto Base UI's `Select.Positioner`/`Select.Popup`; custom CSS keyed on `data-[state=...]`/`.radix-...` selectors stops matching; partial-checkbox state throws (`checked` now strictly boolean — needs `indeterminate`). After running the migrate command, newly-added components sometimes **re-add the OLD imports + the old dependency** (shadcn-ui/ui #9547). And `cmdk`/`vaul` still pull Radix, so the tree carries BOTH primitive libs.
- **Root cause:** Base UI is an API-level break, not a cosmetic rename. `asChild` is **removed** (Base UI uses render props: `render={...}`); positioning moved to **Floating UI**; the Select family restructured *where styles live*. The maintainers' own guidance: this is "more than a simple refactor." (Ecosystem-wide: tldraw is independently investigating the same move, tldraw #7584.)
- **Resolution:** Greenfield mid-2026 → pick ONE primitive at `create` time (Radix is still the safe default — more mature, cmdk/vaul still need it) and never mix; you then never pay the `asChild`→render-prop tax. Existing Radix app → do NOT big-bang; do a **gradual, component-by-component** port (atomic → composite) with **visual verification each step**, grep for `data-[state=...]`/`.radix-` in custom CSS, and verify imports after each `add` (the migrate script lies). pixel targets React 19 so the related `forwardRef` removal (#7926, breaks ref-passing in Storybook/non-React-19) is moot — but document the assumption. This is the 2026 analog of the v3→v4 lesson: the migration TOOL gets you 70% there.
- **VERIFY (L3 trajectory):** the agent does NOT issue a global `asChild`-strip + import-rename in one shot; it ports one component, verifies visually, then proceeds. **(L1):** if on Base UI, `grep -r 'asChild' src/` returns nothing AND no `Select.Content`/`Select.Viewport` remain; if mixed-tree, the dual Radix+Base-UI dependency is acknowledged (cmdk/vaul). [field-02 §3 + field-craft-03 §C (shadcn changelog 2026-02 / 2026-01 + discussion #9562 + issues #9547/#7926/#9191)]

## S20 — Context that worked in dev and broke in production [production · RSC-boundary · silent · HIGH]
- **Trigger:** Agent places a context provider (`ClerkProvider`/`SessionProvider`/a custom one) rendered from a Server Component body, or above the `"use client"` boundary incorrectly. `next dev` works, so the agent ships.
- **Symptom:** In `next dev` everything works; in a **production build on Vercel** the context value is silently `undefined` — *"React Context is unavailable in Server Components"* / *"context values are not accessible."* Hits both custom and third-party providers. (React 19 adds a *second* trap, issue #35397: nested providers for the *same* context now trigger *"over 1000 unnecessary component function calls"* — the inner consumer re-renders even when its value didn't change, a perf regression vs React 18.3.1 that also breaks render-count tests.) Separately, a top-level `<SignedIn>/<SignedOut>` in the root layout without a Server-Component auth check produced a *"weird flash"* of signed-out UI that dropped a B2B SaaS's NPS by 8 points.
- **Root cause:** Context only works inside client components; a provider rendered in (or above) a server boundary yields `undefined` at runtime — and this is a **dev-passes / prod-fails silent failure**, the agent's exact blind spot.
- **Resolution:** Put ALL context providers in a dedicated `"use client"` `providers.tsx`, mounted high in the *client* tree — never rendered from a server component body. **Test context-dependent UI in a production build** (`next build && next start`), not just `next dev`. On React 19, avoid redundant nested same-context providers (#35397). For auth-conditional UI, do the check in a Server Component, not a client flash.
- **VERIFY (L2):** run `next build && next start` (not just dev), load every context-dependent route, assert the context value resolves (no `undefined`/"unavailable" console error) AND no signed-out→signed-in flash. **(L1):** providers live in a `'use client'` file, not in a server component body. [field-craft-07 §B (vercel/next.js #42301, nextauthjs #11093, react #35397) + field-03 §3 (B2B-SaaS NPS-drop hydration/auth-flash incident)]

---

## How these feed Wave S (eval pyramid)
- **L1 (assertions):** the `VERIFY` greps/file-checks above (deterministic, $0) — e.g. S1 file-rename check, S10 config check, S14 import grep.
- **L2 (behavior):** run the app and assert runtime behavior — S2 zero Suspense errors, S4 Tailwind actually rendered, S8 zero hydration warnings.
- **L3 (trajectory):** did the agent *reach for the right tool in the right order* — e.g. did it run the codemod before hand-editing (S1, S6), treat v0 output as untrusted and run the ship gate (S7), adopt cacheComponents per-route not globally (S2)?

These are the golden tasks; the gate is `acceptance-test-green && no-regression`, **no self-grading** (`dsip.json`).

## Sources
S1–S14 trace to a primary artifact in `research/raw/ecosystem-*`: Next.js GitHub issues pulled via `gh api search/issues` 2026-06-11 (#85490, #85390, #86577, #81763, #81161, #50163, #63804, #45047, #9547, #16642, #15809 — with the reaction/comment counts shown), the official Next 16 upgrade guide + Removals/Behavior tables, the salmanizhar/squaredtech migration field reports, the Lenis↔GSAP gsap.com forum threads, and the nxcode.io v0/Lovable/Bolt vulnerability-rate review. **S15–S20 trace to the two FIELD-INTELLIGENCE passes** — `research/raw/field-02/03` (committed `9a127ff`) and `research/raw/field-craft-03/07` — first-person production postmortems (Wix/Shopify-class) and failures with revenue/legal stakes (webvitals.tools A/B case study, TestParty overlay-trap + FTC fine, vercel/next.js #85470 origin-traffic spike, the Tailwind-v4 48h-downgrade postmortem, the Radix→Base-UI `asChild` reckoning, dev-passes/prod-fails context). This **closes** the gap the original Sources line flagged ("the absence of independent FIELD-practitioner scenarios beyond GitHub issues") — see [[GAPS-AND-DISPUTES]] §7 (now resolved). See [[KNOWN-PITFALLS]] for the version-keyed gotcha index (incl. the field-sourced §10–§12).
