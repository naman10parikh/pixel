---
title: "pixel — Expertise Map"
type: synthesis
created: 2026-06-11
updated: 2026-06-11
tags: [expertise, frontend, nextjs, tailwind, shadcn, taste, flagship]
sources: ["research/raw/ecosystem-00-INDEX.md", "research/raw/ecosystem-01-nextjs16.md", "research/raw/ecosystem-02-tailwind-v4.md", "research/raw/ecosystem-03-shadcn-radix.md", "research/raw/ecosystem-04-animation-stack.md", "research/raw/ecosystem-05-rsc-patterns.md", "research/raw/ecosystem-06-mockup-v0-tools.md", "research/raw/ecosystem-07-quality-cwv-a11y.md", "research/raw/ecosystem-08-starter-repos.md", "research/raw/ecosystem-09-agent-operating.md", "research/raw/ecosystem-10-tradeoffs-matrix.md"]
related: ["[[BATTLE-TESTED-SCENARIOS]]", "[[KNOWN-PITFALLS]]", "[[OPINIONS]]", "[[TOOL-MATRIX]]", "[[GAPS-AND-DISPUTES]]", "[[MOC - pixel]]"]
summary: "Everything pixel (Frontend/Web flagship) must master, organized by job-to-be-done — scaffold, architect, design-to-taste, animate, generate-then-gate, verify, ship — each node cited to raw research."
---

# pixel — Expertise Map

> pixel is **the Frontend (web) employee — the flagship** (chairman D9). Stack as of **2026-06-11**:
> Next **16.2.9** · React/react-dom **19.2.7** · Tailwind **4.3.0** · shadcn CLI **4.11.0** ·
> @radix-ui/colors **3.0.0** · Lucide **1.17.0** · GSAP **3.15.0** · Motion **12.40.0** · Lenis **1.3.23**.
> All versions verified directly against the npm registry (`npm view`) on 2026-06-11 — ground truth, not blog claims.
> Floors: Node **20.9+**, TS **5.1+**, browsers Chrome/Edge **111+**, Safari **16.4+**, Firefox **128** (Tailwind-v4 safe floor; disputed vs 111 — see [[GAPS-AND-DISPUTES]] §1).
>
> **What makes pixel dangerous is NOT "knows Next.js."** It is: (a) knows the *silent-failure* class that compiles green and misbehaves; (b) knows the *live bug clusters* in the volatile surfaces (Cache Components, Turbopack); (c) carries an *executable taste gate* (impeccable + design-systems DFS) so generated UI is an untrusted draft, not the deliverable. This map is organized by **job-to-be-done**, not by tool — a fresh Claude session reading `brain/` alone should be able to do each job correctly on the first pass.

---

## How to read this map

Eight jobs, in the order a pixel agent executes them (the loop is in `research/raw/ecosystem-09-agent-operating.md` §"THE PIXEL AGENT LOOP" and reproduced as JOB 8). Each node = **what to master** + **why it bites** + **[source]**. Where a node has a hard gotcha it points to [[KNOWN-PITFALLS]]; where it's a taste/decision stance it points to [[OPINIONS]]; the tools live in [[TOOL-MATRIX]]; the eval-able failures live in [[BATTLE-TESTED-SCENARIOS]].

---

## JOB 1 — Discover the ICP and lock the brief (the gate before any pixel is drawn)

pixel does NOT invent a discovery process — it **inherits energy's `design-systems` skill V3 DFS pipeline** (`~/energy/.claude/skills/design-systems/`, quoted in `ecosystem-06` §B). The discovery brief is a **HARD GATE: "NO BRIEF = NO DESIGN."**

- **1.1 — ICP as a specific named person, not a demographic.** e.g. *"Marcus, 42, portfolio manager at a mid-size hedge fund, uses Bloomberg Terminal daily, frustrated by noisy consumer apps."* The brief template (`discovery/brief-template.md`) forces 6 sections: ICP, Primary Goal, Emotional Tone (the 3-second feeling test), Audience Problem (in their words), Competitive Context (3 named competitors + what to steal/avoid), Success Metrics (one KPI + target). [ecosystem-06]
- **1.2 — Core philosophy (verbatim).** *"What would a highly opinionated designer build to make this ICP resonate deeply with this vision?"* If you can't answer, Step 1 isn't done. [ecosystem-06]
- **1.3 — Step 1.5 Information-Hierarchy Map (also a gate).** FIRST/SECOND/THIRD/AMBIENT per section *before* any CSS. [ecosystem-06]
- **1.4 — Data-fed ICP (the 2026 refinement).** The external "AI ICP" trend says: enrich the brief with firmographic + technographic + **behavioral + intent** signals (analytics, the product's own usage, competitor teardowns) — "based on how people act, not just who they are on paper" — and refine continuously per win/loss. pixel should feed Step-1 with real signals, not guesses. This is the "domain-expert employee" behavior the flagship embodies. [ecosystem-06, sybill.ai/aurium/marketbetter 2026]
- **1.5 — 8 vertical profiles** (fintech/health/creative/devtools/consumer/enterprise/education/ecommerce) tune the brief per domain; the DFS Hero (JOB 3.1) is chosen by ICP type. [ecosystem-06]

## JOB 2 — Architect the rendering & data flow (RSC / App Router on Next 16)

The single highest-blast-radius knowledge area. **The boundary is the whole game** (`ecosystem-05`).

- **2.1 — The serialization boundary.** `'use client'` marks a **serialization boundary**, not "make it interactive." Server Components render on the server, ship zero JS, can be `async`, can touch the DB directly. [ecosystem-05]
- **2.2 — Caching inverted (Next 16 mental model).** In 13–15 `fetch()` was cached by default; in **16 nothing is cached** unless marked `"use cache"`. All dynamic code runs at request time by default. Opt in with `use cache` + a `cacheLife` profile (`'max'`/`'hours'`/`'days'` or inline `{ expire: 3600 }`). This inversion is the #1 migration-mental-model trap. [ecosystem-01, ecosystem-05]
- **2.3 — The mutation surface.** Mutate via Server Action (`'use server'`) called from a Client form/button. Read-your-writes → `updateTag(tag)` (Server-Actions-only). Refresh uncached side-data → `refresh()` (Server-Actions-only). SWR invalidation → `revalidateTag(tag, 'max')` (the 2nd profile arg is now required for SWR; 1-arg form silently loses SWR — [[KNOWN-PITFALLS]] §1.4). [ecosystem-01, ecosystem-05]
- **2.4 — Static shell + dynamic holes (PPR via Cache Components).** Static parts prerender and stream instantly; dynamic parts fill at request time inside `<Suspense>`. `experimental.ppr`/`experimental.dynamicIO` flags are GONE — `dynamicIO` renamed `cacheComponents`. [ecosystem-01]
- **2.5 — The 5 boundary mistakes (must internalize all 5).** (1) over-using `'use client'` (ships Markdown parsers/date-libs/DB-clients to browser → push it to the *leaves*); (2) non-serializable props across the boundary (`Date`, class instances, non-event-handler functions → hydration mismatch; pass primitives, reconstruct `Date` client-side); (3) browser APIs / non-deterministic output during SSR (`Math.random()`, `Date.now()`, `window`, `localStorage` → server HTML ≠ client HTML); (4) Suspense fallback divergence (fallback must render identically server+client); (5) cache-default inversion (see 2.2). [ecosystem-05]
- **2.6 — Client islands.** `dynamic(() => import(...), { ssr: false })` for browser-only widgets (maps, charts that touch `window`). [ecosystem-05]
- **2.7 — Cache Components is volatile — adopt per-route, never global.** Live bug cluster: breaks Clerk auth without `<Suspense>` (#85490), React Portals leak across nav (#85390), CSP nonce conflict (#89754), `<Activity>` route-preservation breakage (#86577, 74 comments), router-cache corruption on duplicate search-param names (#92152). → [[BATTLE-TESTED-SCENARIOS]] S2, S3; [[OPINIONS]] O2. [ecosystem-05, ecosystem-10 Decision 2]

## JOB 3 — Design to taste (the house style + the anti-slop discipline)

pixel's *moat* over raw v0/Lovable is **taste + audit gates, not the generator** (`ecosystem-06`, `ecosystem-10`). The taste baseline is **inherited from energy** (`design.md` + `frontend-bible-2026.md`) and confirmed current by the research.

- **3.1 — DFS Hero pattern.** Perfect ONE component (the one carrying ~60% of emotional weight) to 100% *before* scaling. Hero chosen by ICP type: enterprise→logo bar, dev→code/terminal, consumer→headline+CTA, investor→metrics, creative→showcase, finance→data table. [ecosystem-06]
- **3.2 — House style (load-bearing, confirmed current).** Warm black **#141312** (NOT #000 / #09090b / pure black); **Instrument Serif** (display) + **Poppins** (body) — serif+sans pairing is the #1 anti-AI-slop move; bento/asymmetric layouts; **OKLCH** color with ONE brand moment per page; Radix **12-step** scales (1-2 app bg, 3-5 component bg/hover/active, 6-8 borders, 9-10 solid, 11-12 text). [ecosystem-00, ecosystem-03, ecosystem-07]
- **3.3 — Tokens live in Tailwind v4 `@theme` (CSS), auto-exposed as CSS vars.** The energy flow "BRAND.md → theme-tokens.json → tailwind.config.ts" is SUPERSEDED — the sink is now `@theme` in CSS; every token (`--color-<name>-1..12`, `--font-*`, `--breakpoint-*`, `--ease-*`) is auto-exposed on `:root` and readable from React via `var(--color-...)`. This is the mechanism for the per-agent BRAND.md color story without a JS config. → [[OPINIONS]] O8, [[KNOWN-PITFALLS]] §2.1 (strict `--color-` prefix). [ecosystem-02]
- **3.4 — The anti-slop tells (now machine-detectable).** Inter-for-everything, purple→blue gradients, bounce/elastic easing, dark glows, **cards nested in cards**, **rounded-square icon tiles above every heading**, gray text on colored backgrounds, side-tab borders, pure-black/untinted-gray, placeholder gray boxes. `impeccable` detects these deterministically (41 rules, exit codes). → JOB 6.1, [[TOOL-MATRIX]] impeccable. [ecosystem-07]
- **3.5 — Information hierarchy before CSS.** Map FIRST/SECOND/THIRD/AMBIENT per section first (JOB 1.3). Generative UI: stream rich cards for tool calls (weather/venue/search cards), never plain text badges; "no spinners without context." [ecosystem-00, ecosystem-05]
- **3.6 — The 6-beat emotional arc for page composition.** Recognition → Awe → Trust → Continuity → Conviction → Action. [ecosystem-06]
- **3.7 — Icon hierarchy via weight.** Default **Lucide** (shadcn default, ~1× bundle); reserve **Phosphor** for deliberate weight-hierarchy moments only (Thin/Light/Regular/Bold/Fill/Duotone) — NOT app-wide (16-18× bundle overhead on Next16+Turbopack). → [[OPINIONS]] O4. [ecosystem-03]

## JOB 4 — Animate (the layered stack, lowest-layer-that-works)

The energy mandate, confirmed current: **CSS > Lenis > GSAP ScrollTrigger > Motion > Rive > Three** — "use the lowest layer that solves the problem." (`ecosystem-04`).

- **4.1 — Layer 1 CSS-native (always first).** View Transitions API (Baseline since Oct 2025; in Next 16 via React 19.2 `<ViewTransition>` — prefer this for *simple* page transitions, zero JS); CSS scroll-driven animations (`animation-timeline: scroll()`/`view()`, compositor-thread, no jank); `@starting-style` (animate on first paint, JS-free; Tailwind v4 has utilities). [ecosystem-04, ecosystem-01]
- **4.2 — Layer 2 Lenis (smooth-scroll, ~3KB).** Import is **`lenis` / `lenis/react`** (`import { ReactLenis, useLenis } from 'lenis/react'`). The `@studio-freight/*` packages were RETIRED April 2026 (Studio Freight → Darkroom Engineering) — any snippet importing them is stale. Lenis preserves `position:sticky`, scroll-snap, IntersectionObserver. → [[KNOWN-PITFALLS]] §4.1 (the single most common stale-tutorial error). [ecosystem-04]
- **4.3 — Layer 3 GSAP ScrollTrigger (free).** 100% free since April 2025 (Webflow acquisition) — incl. SplitText/MorphSVG/DrawSVG/ScrollSmoother/Flip/ScrollTrigger, commercial use covered. The **canonical Lenis+GSAP recipe (and #1 gotcha): exactly ONE rAF loop**, `new Lenis({ autoRaf: false })` is *mandatory*, then `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add(t => lenis.raf(t*1000))` + `gsap.ticker.lagSmoothing(0)`. Must run client-side (`'use client'` + `useGSAP()` from `@gsap/react`; `gsap.registerPlugin(ScrollTrigger)`). → [[BATTLE-TESTED-SCENARIOS]] S5, [[KNOWN-PITFALLS]] §4.2. [ecosystem-04]
- **4.4 — Layer 4 Motion (UI state animation).** `motion` and `framer-motion` are the same package; **`motion` is the preferred name** (`import { motion } from 'motion/react'`). **Default to `LazyMotion` + `m` (~4.6KB)** not bare `motion` (~34KB); load features on demand (`domAnimation` +15KB, `domMax` +25KB); `useAnimate` mini = 2.3KB. Use for UI state, layout, exit/enter, gestures. → [[OPINIONS]] O5. [ecosystem-04]
- **4.5 — Layer 5 Rive (branded interactive moments only).** `@rive-app/react-canvas` 4.29.0. State machines (idle/hover/pressed/loading/success/error) driven by input values — no JS keyframes; `.riv` is 50-80% smaller than Lottie `.json`. Use ONLY for deliberate brand moments (hero mascot, interactive logo, multi-state button) — never for generic UI motion. [ecosystem-04]
- **4.6 — Layer 6 Three.js / R3F (3D, only when justified).** `three` r184. WebGPU shippable broadly since r171 + Safari 26 (WebGL fallback). Highest-cost layer; lazy-load the whole bundle; R3F + `@react-three/drei` is the agent-friendly path. [ecosystem-04]
- **4.7 — Timing taste (non-negotiable).** 200-500ms sweet spot; animate `transform` + `opacity` ONLY (GPU-composited); 60fps; `prefers-reduced-motion` = minimize non-essential motion, don't kill all; **randomize timing delays** (Stripe lesson — fixed intervals feel robotic); fade-up (translateY+opacity) is the most effective scroll reveal; parallax 20-30% layer-speed, hero-only, auto-disable on mobile. [ecosystem-04]

## JOB 5 — Generate the first-pass draft (v0-class tools, treated as untrusted)

This is how pixel generates mockups *autonomously*, then **gates them** — the generated code is a **draft, not the deliverable** (`ecosystem-06`).

- **5.1 — v0 is the stack-aligned generator.** Emits React/Tailwind/shadcn matching pixel's stack. Programmatic via the **v0 Platform API + `v0-sdk`**: `v0.chats.create({ message, system })` wraps prompt→project→code→deploy; output includes a web URL + code files. Models `v0-1.5-md` (everyday UI) / `v0-1.5-lg` (advanced reasoning). Packages: `v0-sdk`, `@v0-sdk/react`, `@v0-sdk/ai-tools`. [ecosystem-06]
- **5.2 — Lovable/Bolt are references, not contributors.** Lovable = NL→full-stack (Supabase built-in); Bolt = in-browser WebContainer IDE. Both own the whole stack — useful for throwaway validation / references, but they do NOT slot into a hand-crafted Next 16 codebase the way v0's output does. [ecosystem-06]
- **5.3 — THE caveat, cited loudly: all three ship ~40-45% vulnerable code.** "Budget for a security review regardless of which you pick." → any generated code is an **untrusted draft** that MUST pass security + a11y/CWV + 12-dim gates before it touches main. This is exactly why pixel is a *harness*, not a v0 wrapper. → [[BATTLE-TESTED-SCENARIOS]] S7, [[OPINIONS]] O7. [ecosystem-06]
- **5.4 — Figma Dev Mode MCP (best path when a designer exists).** Structured read access to a frame: node tree, variants, layout constraints, **design tokens/variables**, asset refs; generate code from a frame; Code Connect aligns generated code to real components; bidirectional (push UI back as editable layers, 2026). **HONEST LIMIT:** the roundtrip isn't seamless — "business logic doesn't survive the trip, event handlers disappear, state management has to be re-implemented." Use for *initial* frame→code + token extraction, NOT continuous design↔code sync. [ecosystem-06]
- **5.5 — Other generators (gate hard).** Magic UI MCP, Aceternity UI (3D/parallax/aurora), SVGMaker MCP, Google Stitch, Nano Banana — registries/MCPs an agent pulls from, but Magic UI / Aceternity lean AI-slop → must pass the anti-pattern audit. [ecosystem-06, ecosystem-08]

## JOB 6 — Verify (deterministic + visual — the agent's blind spot)

A human notices "my middleware stopped working"; an agent sees a green build and moves on. So pixel runs **post-change assertions, not the compiler** (`ecosystem-09`). This is the most agent-specific job.

- **6.1 — impeccable detect (anti-slop, exit-code gate).** `npx impeccable detect --json src/` → 41 deterministic rules, no LLM/API key, JSON + exit codes for CI. The agent gets a deterministic read on whether its *own* output looks AI-generated (a human designer "just knows"). Install the skill: `npx impeccable skills install`; richer LLM critique via `/impeccable critique`. [ecosystem-07]
- **6.2 — axe-playwright (the ~30-40% machines catch).** `@axe-core/playwright` 4.11.3 injected into the running page → assert zero WCAG-2.2-AA violations. (energy bans Playwright *MCP*; uses Playwright *CLI*.) [ecosystem-07]
- **6.3 — Lighthouse CI budgets.** `@lhci/cli` 0.15.1 with assertions → fail build if LCP < **2.0s** / INP < **200ms** / CLS < **0.1** / a11y ≥ 95 regresses. Lighthouse 13.4.0 uses axe under the hood. [ecosystem-07]
- **6.4 — Visual proof.** Run the app, screenshot via Playwright CLI, and READ the image ("test as a USER, it compiles means nothing"). [ecosystem-09]
- **6.5 — Console = zero hydration warnings.** Read the browser console (Next 16.2 Browser Log Forwarding, or Playwright `page.on('console')`) → assert zero hydration warnings (the #1 RSC bug an agent can't otherwise *see*). [ecosystem-09, ecosystem-05]
- **6.6 — The silent-failure assertion grep-set (run post-codemod, pre-commit).** `grep -rn 'params\.' --include=*.tsx app/` for residual sync access; assert no leftover `middleware.ts` (must be `proxy.ts`); build + grep output CSS for a Tailwind class ("it's in my JSX" ≠ "it generated"); verify Tailwind renders under Turbopack (#81763 drops styles); `quality={90}` silently → 75 unless `images.qualities` set. → [[KNOWN-PITFALLS]] (whole file), [[BATTLE-TESTED-SCENARIOS]] S1, S4, S8. [ecosystem-09, ecosystem-01]

## JOB 7 — Ship (the pre-merge quality-gate stack, in order)

The synthesis gate from `ecosystem-07` §5 — wire ALL of these; this *is* the harness:

1. `npx impeccable detect --json src/` → exit-code gate (anti-slop + design quality).
2. `@axe-core/playwright` on the running page → zero WCAG-2.2-AA violations.
3. Lighthouse CI (`@lhci/cli`) with budgets → LCP<2.0s, INP<200ms, CLS<0.1, a11y≥95.
4. design-systems **12-dimension binary audit** → **≥10/12** (pass/fail per dimension; NO "7/10" — either it meets the bar or the fix is explicit; the taste layer machines can't catch). [ecosystem-06, ecosystem-07]
5. **Manual a11y** (keyboard nav, screen reader, reduced-motion) for the 60-70% axe misses. [ecosystem-07]
6. **Security review** (the 40-45% AI-code vuln rate). [ecosystem-06]
7. Visual proof via Playwright CLI screenshots, read them. [ecosystem-07]

- **7.1 — WCAG 2.2 AA is the operative legal baseline** (ADA Title II, Section 508, EU EAA). 9 new criteria over 2.1 incl. **2.5.8 Target Size ≥24×24px** (keep 44px as stricter house rule), **2.5.7 Dragging** (single-pointer alternative), **2.4.11 Focus Not Obscured**, **3.3.8 Accessible Authentication** (no cognitive test to log in → allow password managers/passkeys; directly affects auth screens). WCAG 3.0 is a Working Draft, NOT a Recommendation until ~2029 — do NOT build to it. → [[KNOWN-PITFALLS]] §7. [ecosystem-07]

## JOB 8 — Self-improve (the DSIP loop — pixel is recursively self-improving)

pixel's `dsip.json` contract: nightly `refresh-brain → re-verify-tool-matrix → run-eval-pyramid → propose → test-gate → commit`, eval-gated, **no self-grading**, snapback at component+repo granularity, external-intelligence = vertical ecosystem watch (changelogs/issues/X per [[TOOL-MATRIX]]).

- **8.1 — Currency is the agent's #1 failure mode** (training data is stale by construction). Mitigate with Context7 MCP (version-correct docs) + nightly TOOL-MATRIX re-verify (`npm view`). Stale patterns to never emit: sync `params`, `@tailwind` directives, `@studio-freight/react-lenis`, `tailwind.config.js`, `next/legacy/image`, FID-instead-of-INP. [ecosystem-09]
- **8.2 — Determinism beats cleverness.** Prefer `@next/codemod` / `@tailwindcss/upgrade` / `shadcn migrate radix` to hand-edits; the agent's job is the *gap the codemod misses*, not redoing it (Karpathy "surgical changes"). Use `shadcn add --dry-run`/`--diff` to preview before writing (an agent can't easily undo a bad multi-file write). [ecosystem-09]
- **8.3 — Eval pyramid (golden tasks from [[BATTLE-TESTED-SCENARIOS]]).** Hamel L1 assertions + L2 behavior + L3 trajectory; gate = acceptance-test-green && no-regression. [dsip.json]
- **8.4 — Scaffold, don't fork.** `pnpm dlx shadcn@latest init -t next --base radix` + **mine** reference repos (next-app-router-playground for patterns, ai-chatbot for generative-UI/tool-cards, next-forge for monorepo shape, ixartz boilerplate for test/CI/a11y tooling). Forking inherits stale deps + a generic identity. → [[OPINIONS]] O10, [[KNOWN-PITFALLS]] §8. [ecosystem-08]

---

## Mastery checklist (the "is this employee dangerous yet?" rollup)

A pixel agent is competent in this vertical when it can, from `brain/` alone:
- [ ] Refuse to design without the 6-section discovery brief (JOB 1).
- [ ] Explain why a `Date` prop across the RSC boundary causes a hydration mismatch, and fix it (JOB 2.5).
- [ ] Adopt Cache Components per-route with `<Suspense>` discipline AND name the 5 live bugs it triggers (JOB 2.7).
- [ ] Wire the Lenis+GSAP ticker with `autoRaf:false` from memory (JOB 4.3).
- [ ] Reach for `LazyMotion`+`m`, not bare `motion`, and say why (JOB 4.4).
- [ ] Treat v0 output as an untrusted draft and run the 7-step ship gate (JOB 5.3, JOB 7).
- [ ] Run the silent-failure grep-set after any upgrade (JOB 6.6).
- [ ] Quote the 2026 CWV targets (LCP 2.0s / INP 200ms / CLS 0.1) and WCAG 2.2 (not FID, not WCAG 3.0) (JOB 6.3, 7.1).
- [ ] Scaffold-not-fork, and blacklist precedent/old-t3 for a Next-16 project (JOB 8.4).

## Sources
All nodes trace to `research/raw/ecosystem-01..10` (which cite primary docs, official changelogs, 19 GitHub issues with reaction/comment counts, maintainer threads, and the npm registry run 2026-06-11) + the read-only energy references quoted therein (`design.md`, `react.md`, `frontend-bible-2026.md`, `design-systems` SKILL.md + brief-template.md). See [[GAPS-AND-DISPUTES]] for what the research could NOT confirm and where no FIELD-practitioner source exists.
