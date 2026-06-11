---
title: "pixel — Opinions (Taste Stances)"
type: synthesis
created: 2026-06-11
updated: 2026-06-11
tags: [opinions, taste, anti-slop, stances, decisions]
sources: ["research/raw/ecosystem-02-tailwind-v4.md", "research/raw/ecosystem-03-shadcn-radix.md", "research/raw/ecosystem-04-animation-stack.md", "research/raw/ecosystem-05-rsc-patterns.md", "research/raw/ecosystem-06-mockup-v0-tools.md", "research/raw/ecosystem-07-quality-cwv-a11y.md", "research/raw/ecosystem-08-starter-repos.md", "research/raw/ecosystem-10-tradeoffs-matrix.md", "research/raw/ecosystem-00-INDEX.md"]
related: ["[[EXPERTISE-MAP]]", "[[KNOWN-PITFALLS]]", "[[GAPS-AND-DISPUTES]]", "[[TOOL-MATRIX]]", "[[MOC - pixel]]"]
summary: "Explicit always-X / never-Y taste stances with the why + source — the anti-slop layer. Where a stance is a judgment call (not vendor-stated), it says so and points to GAPS."
---

# pixel — Opinions (Taste Stances)

> These are pixel's **opinionated defaults** — the stances that make output *not look AI-generated* and *not break in production*. Each is **ALWAYS X / NEVER Y — because Z [source]**. Some are inherited-and-confirmed energy taste (house style); some are reasoned verdicts from the trade-off matrix (flagged as judgment calls → [[GAPS-AND-DISPUTES]]). A stance without a "because" is just a preference — every one here earns its place. **Hold the line on these; the chairman's flagship is judged on taste, not feature count.**

---

## The house style (inherited from energy, CONFIRMED current by the research)

- **O-HS1 — ALWAYS warm black `#141312`. NEVER pure black `#000` or near-black `#09090b`.** Because pure/untinted black is a top AI-slop tell (impeccable flags it deterministically); warm-black reads editorial and intentional. [ecosystem-00, ecosystem-07]
- **O-HS2 — ALWAYS pair a serif display with a sans body (Instrument Serif + Poppins). NEVER Inter-for-everything.** Because serif+sans pairing is *the single highest-impact anti-AI-generated-look change*; "Inter for everything" is an explicit impeccable slop rule. [ecosystem-00, ecosystem-07]
- **O-HS3 — ALWAYS asymmetric / bento layouts. NEVER symmetric card grids.** Because symmetric grids are the AI-generated pattern; asymmetry reads as designed-by-a-human. [ecosystem-00, ecosystem-07]
- **O-HS4 — NEVER generic AI purple/pink (or purple→blue) gradients, dark glows, bounce/elastic easing, cards-nested-in-cards, or a rounded-square icon tile above every heading.** Because these are the literal impeccable detector rules and energy anti-patterns — a deterministic CI gate now fails the build on them. [ecosystem-07]
- **O-HS5 — NEVER placeholder gray boxes; NEVER pure-white text on dark.** Because gray-box placeholders and untinted gray-on-color are slop tells; use a gradient/mask/icon instead of a gray box, and zinc-100/200 (not #fff) on dark. Tailwind v4.1 `mask-*` + gradient utilities exist precisely to fade images instead of boxing them. [ecosystem-00, ecosystem-02, ecosystem-07]
- **O-HS6 — ALWAYS ONE brand color-moment per page, OKLCH, on Radix 12-step scales.** Because restraint reads premium; OKLCH gives wide-gamut vividness; the 12-step scale has a *purpose per step* (1-2 bg, 3-5 component, 6-8 borders, 9-10 solid, 11-12 text) — that semantic discipline is what makes color systems not-amateur. [ecosystem-00, ecosystem-03]
- **O-HS7 — ALWAYS stream rich cards for tool calls; NEVER a loading spinner without context.** Because "Searching restaurants..." beats a bare spinner — generative UI is the energy design signature and the anti-slop "no spinners without context" rule. [ecosystem-00, ecosystem-05]

## Stack & architecture stances (reasoned verdicts from the trade-off matrix)

- **O1 — ALWAYS target the bleeding edge (Next 16.2 / Tailwind 4.3 / shadcn 4.11 / React 19.2), but be DISCIPLINED about the volatile bits. NEVER ship a stale pattern.** Because currency is the agent's #1 failure mode; but the volatile surfaces (Cache Components, Turbopack) have live bug clusters, so "track the edge" ≠ "trust the edge blindly." This is the top-level posture. [ecosystem-10, ecosystem-09]

- **O2 — NEVER set `cacheComponents: true` globally. ALWAYS adopt `use cache` per-route, with `<Suspense>` around every dynamic read from day one.** Because (mid-2026) it has a live bug cluster — breaks Clerk auth (#85490), React Portals (#85390), CSP nonce (#89754), `<Activity>` (#86577), router cache on dup search-params (#92152). Flipping it on globally and assuming it's free is *the trap*. Re-evaluate as the cluster resolves. *Judgment call (vendor doesn't state "per-route") → [[GAPS-AND-DISPUTES]] §5.* [ecosystem-05, ecosystem-10 Decision 2]

- **O3 — ALWAYS choose Radix (`--base radix`) for a new project now. NEVER migrate to Base UI yet.** Because Radix is the de-facto default, the most-tested shadcn surface, and the unified `radix-ui` package gives clean deps; Base UI removes `asChild` (a global refactor tripwire), changes forms (`Field`) and positioning (Floating UI). Keep Base UI on the watch-list; pay the migration only when shadcn makes it the *default style*. *Judgment call (Base UI is shadcn's signaled future) → [[GAPS-AND-DISPUTES]] §2.* [ecosystem-03, ecosystem-10 Decision 3]

- **O4 — ALWAYS default to Lucide. NEVER ship Phosphor app-wide.** Because Lucide is the shadcn default with ~1× bundle footprint; Phosphor carries **16-18× per-icon overhead** on Next16+Turbopack (6-weight component logic) and its npm is ~13 months stale. Reserve Phosphor for *deliberate weight-hierarchy moments* (a hero where Fill vs Thin conveys state). This refines energy's "use both" with a bundle reason. [ecosystem-03, ecosystem-10 Decision 4]

- **O5 — ALWAYS default Motion to `LazyMotion` + `m` (~4.6KB). NEVER import bare `motion` (~34KB) unless you need everything.** Because the declarative `motion` API can't tree-shake; `LazyMotion` loads feature sets on demand (`domAnimation` +15KB, `domMax` +25KB). Use `useAnimate` mini (2.3KB) for the smallest case. INP budget depends on shipping less JS. [ecosystem-04, ecosystem-10 Decision 5]

- **O6 — ALWAYS use the lowest animation layer that works (CSS > Lenis > GSAP > Motion > Rive > Three). NEVER reach for GSAP for a fade or Motion for a scroll-pin.** Because every layer up costs bundle + complexity. Simple page transition → React 19.2 `<ViewTransition>` (native, zero JS). State/layout → `LazyMotion`. Scroll pin/scrub/snap → GSAP+Lenis (`autoRaf:false`). Branded interactive moment → Rive. 3D only when the brand demands it. [ecosystem-04, ecosystem-10 Decision 5/6]

- **O7 — ALWAYS treat v0/Lovable/Bolt output as an untrusted draft. NEVER merge generated UI without the full ship gate.** Because all three ship **~40-45% vulnerable code**; "light review" ≠ "no review." Generate fast with the v0 Platform API, then finish with design-systems DFS + house style + security + 12-dim + a11y/CWV. **pixel's entire reason to exist over raw v0 is the audit/taste gates, not the generator.** [ecosystem-06, ecosystem-10 Decision 7]

- **O8 — ALWAYS put design tokens in Tailwind v4 `@theme` (CSS), auto-exposed as CSS vars. NEVER reach for `tailwind.config.js` except when a plugin forces a pinned `@config`.** Because `@theme` tokens auto-expose on `:root` and read from React via `var(--color-...)` — perfect for the per-agent BRAND.md color story without JS. This SUPERSEDES energy's "BRAND.md → theme-tokens.json → tailwind.config.ts" flow (the sink is `@theme` now). Use the strict `--color-`/`--font-`/`--breakpoint-` prefixes or the utility silently won't generate. [ecosystem-02, ecosystem-10 Decision 8]

- **O9 — ALWAYS gate every UI on BOTH automated AND manual a11y. NEVER ship on a green axe alone.** Because axe/Lighthouse catch only **~30-40% of WCAG**; impeccable (exit-code) + axe-playwright (0 violations) + lhci budgets are the *necessary* floor, but keyboard + screen-reader + reduced-motion + the 12-dim binary audit are the *sufficient* layer. Automated-only ships inaccessible UIs that pass CI. [ecosystem-07, ecosystem-10 Decision 9]

- **O10 — ALWAYS scaffold + mine reference repos. NEVER fork a starter.** Because forking inherits stale deps (precedent/old-t3 are 12-20mo behind Next 16 / Tailwind v4.3) AND a generic visual identity. Scaffold `shadcn init -t next --base radix`, then mine next-app-router-playground (patterns), ai-chatbot (generative UI/tool-cards), next-forge (monorepo shape), ixartz boilerplate (test/CI/a11y tooling). pixel is hand-crafted. [ecosystem-08, ecosystem-10 Decision 10]

## Quality-bar stances (the binary discipline)

- **O11 — ALWAYS audit on a binary pass/fail (≥10/12 on the design-systems 12-dimension audit). NEVER accept "7/10".** Because "good enough" is how slop ships — either a dimension meets the bar or the fix is explicit. The DFS discovery brief is a HARD GATE: **NO BRIEF = NO DESIGN**; the ICP is a *specific named person*, not a demographic. [ecosystem-06, ecosystem-07]
- **O12 — ALWAYS perfect ONE hero component to 100% before scaling (DFS Hero). NEVER scale a half-baked component across the page.** Because the hero carries ~60% of emotional weight; getting it to 100% first sets the bar everything else inherits. [ecosystem-06]
- **O13 — ALWAYS prefer the codemod/CLI to hand-edits; the agent's job is the GAP the codemod misses. NEVER hand-redo mechanical migration.** Because determinism beats cleverness (Karpathy "surgical changes"); and `shadcn add --dry-run`/`--diff` before writing, because a bad multi-file write can't easily be undone. [ecosystem-09]
- **O14 — ALWAYS verify visually (screenshot + READ it) and read the console (0 hydration warnings). NEVER call a green build "done".** Because "it compiles means nothing" — the silent-failure class (dead middleware, dropped Tailwind styles, hydration mismatch) is invisible to the compiler and to an agent that doesn't look. [ecosystem-09, ecosystem-05]
- **O15 — ALWAYS randomize animation timing delays; keep motion 200-500ms, transform+opacity only, 60fps. NEVER use fixed identical intervals or animate layout properties.** Because fixed 100ms intervals feel robotic (the Stripe CEO literally rewrote code to randomize typing delays); animating non-composited properties drops frames. Respect `prefers-reduced-motion` by *minimizing* non-essential motion, not killing all of it. [ecosystem-04]

## Sources
Stances trace to the verdicts in `research/raw/ecosystem-10-tradeoffs-matrix.md` (10 honest decision matrices) and the house-style baseline confirmed across `ecosystem-00/02/03/04/07` (energy `design.md` + `frontend-bible-2026.md`, quoted and confirmed current). Judgment-call stances (O2 per-route, O3 Radix-not-Base-UI) are reasoned recommendations, NOT vendor-stated defaults — see [[GAPS-AND-DISPUTES]].
