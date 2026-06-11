# Starter / Template / Example Repos — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11 · Star counts + last-push via `gh api repos/<repo>` on 2026-06-11 (authoritative).
The bar: actively maintained (pushed 2026), Next-16-era, and a *reason* to use it — not a stale listicle pick.

## THE SHORTLIST (5 best, ranked by fit for pixel)

### 1. `vercel/next-forge` (a.k.a. `haydenbleasel/next-forge) — 7,091★, pushed 2026-05-28
**Production-grade Turborepo monorepo template for Next.js.** By Hayden Bleasel (now under vercel org). Opinionated, batteries-included: auth, db, payments, email, analytics, design system, observability wired as a monorepo. **Why for pixel:** it's the closest thing to a "serious production Next app shape" maintained into mid-2026, and pixel's harness already speaks monorepo (energy is a monorepo). Best *reference architecture* for how to structure a real app — even if pixel doesn't adopt it wholesale. Risk: heavyweight; lots of vendor choices baked in (strip what you don't need).

### 2. `vercel/next-app-router-playground` — 2,989★, pushed 2026-06-10
**The official App Router feature playground** (nested layouts, streaming, instant loading, parallel/intercepting routes, Server Actions). **Why for pixel:** it's Vercel's own canonical demonstration of the load-bearing App Router patterns from ecosystem-05 — the *reference implementation* for "how is this pattern actually wired." Pushed yesterday → tracks current Next. Use as a pattern dictionary, not a starter to fork.

### 3. `vercel/ai-chatbot` — 20,478★, pushed 2026-05-18
**Full-featured, hackable Next.js AI chatbot** by Vercel (AI SDK + RSC + generative UI + auth + persistence). **Why for pixel:** Energy builds agent UIs; this is the most-starred current reference for **streaming generative UI / tool-call cards** (exactly energy/design.md's "stream rich cards for tool calls"). The best starting point if pixel's first surface is an agent/chat UI. Actively maintained.

### 4. `ixartz/Next-js-Boilerplate` — 12,978★, pushed 2026-06-01
**Comprehensive DX-first boilerplate** — App Router, TypeScript strict, Tailwind, testing (Vitest/Playwright), i18n, Clerk auth, DrizzleORM, CI, commit hooks, Storybook. **Why for pixel:** the strongest *DX/tooling* reference (it wires the test + lint + CI + a11y discipline pixel cares about). Heavily opinionated; mine it for the tooling config, not the visual design (its UI is generic).

### 5. `shadcn-ui/ui` (the repo itself) — 116,275★, pushed 2026-06-10
Not a "starter" but **the canonical component source + registry + CLI** (ecosystem-03). `apps/www` is a reference for how shadcn structures its own registry/site. **Why for pixel:** pixel *is* a shadcn-stack expert; the source repo is the ground truth for component patterns, the registry schema, and the MCP server. Use `shadcn init -t next` rather than forking, but read the repo for registry-authoring patterns.

## HONORABLE MENTIONS / WATCH
- `magicuidesign/magicui` — 21,223★, pushed 2026-06-03. 150+ animated components (bento grids, marquees, shine borders). Has an MCP. **Caveat:** leans toward the AI-slop aesthetic energy/impeccable warn against — cherry-pick, gate through anti-pattern audit. Good for "make a landing pop" moments.
- `vercel/commerce` (Next.js Commerce) — 14,075★, pushed 2026-06-10. Reference if pixel ever does an ecommerce vertical.
- `pbakaus/impeccable` — 37,375★, pushed 2026-06-11. Not a starter — the anti-slop **skill/CLI** (ecosystem-07). Install it, don't fork it.

## STALE — DO NOT USE AS-IS (flag for anyone reaching for the "popular" pick)
- `steven-tey/precedent` — 5,102★ but **pushed 2024-10-02** (~20 months stale; Next 13/14 era, pre-Tailwind-v4, pre-async-params). Frequently recommended in old listicles — **avoid for a Next 16 project.**
- `t3-oss/create-t3-app` — 28,970★ but **pushed 2025-12-13**; `nextjs/saas-starter` (a.k.a. `leerob/next-saas-starter`) — 15,877★, **pushed 2025-12-11**; `blefnk/relivator` — 1,553★, **2025-10-04** (Next 15). These are 6-12 months behind the Next 16 / Tailwind v4.3 / shadcn v4.11 surface — usable but expect migration work (async params, proxy.ts, cacheComponents).
- `shadcn-ui/next-template` — 1,496★, **pushed 2025-07-28** ("Next.js 13 template") — superseded by `shadcn init -t next`.

## THE ACTUAL RECOMMENDATION FOR PIXEL (don't fork — scaffold + mine)
pixel is a hand-crafted harness, not a fork. The right move:
1. **Scaffold** with `pnpm dlx shadcn@latest init -t next --base radix` (gets Next 16 + Tailwind v4 + shadcn current, ecosystem-03) — or `npx create-next-app@latest` (App Router + TS + Tailwind + ESLint defaults, ecosystem-01).
2. **Mine** `next-app-router-playground` for App Router pattern recipes, `ai-chatbot` for generative-UI/tool-card patterns, `next-forge` for monorepo production shape, `ixartz/Next-js-Boilerplate` for test/CI/a11y tooling config.
3. **Install** `impeccable` skill + shadcn registry MCP.
4. Layer energy's design-systems house style on top.

This avoids inheriting a starter's stale deps or generic visual identity, while stealing the genuinely-good architecture patterns.

## PIXEL IMPLICATIONS
- Encode the scaffold command (`shadcn init -t next --base radix`) + the four "mine, don't fork" reference repos into pixel's brain/TOOL-MATRIX.md.
- Explicitly blacklist precedent/old-t3/old-saas-starter for Next-16 work (they're the popular-but-stale trap).

## SOURCES
- `gh api repos/<repo>` (stargazers_count + pushed_at), run 2026-06-11, for: vercel/next.js, shadcn-ui/ui, vercel/next-app-router-playground, vercel/ai-chatbot, ixartz/Next-js-Boilerplate, vercel/next-forge (haydenbleasel/next-forge), t3-oss/create-t3-app, nextjs/saas-starter, leerob/next-saas-starter, blefnk/relivator, steven-tey/precedent, magicuidesign/magicui, vercel/commerce, pbakaus/impeccable, shadcn-ui/next-template.
