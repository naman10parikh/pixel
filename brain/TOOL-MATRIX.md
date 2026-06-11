---
title: "pixel — Tool Matrix"
type: synthesis
created: 2026-06-11
updated: 2026-06-11
tags: [tools, mcp, cli, api, secrets, versions, agent-surface]
sources: ["research/raw/ecosystem-01-nextjs16.md", "research/raw/ecosystem-02-tailwind-v4.md", "research/raw/ecosystem-03-shadcn-radix.md", "research/raw/ecosystem-04-animation-stack.md", "research/raw/ecosystem-06-mockup-v0-tools.md", "research/raw/ecosystem-07-quality-cwv-a11y.md", "research/raw/ecosystem-08-starter-repos.md", "research/raw/ecosystem-09-agent-operating.md"]
related: ["[[EXPERTISE-MAP]]", "[[OPINIONS]]", "[[KNOWN-PITFALLS]]", "[[GAPS-AND-DISPUTES]]", "[[MOC - pixel]]"]
summary: "Canonical tools (default vs alts, when-to-use-which), each with its agent-access surface (CLI/API/MCP/code-only) and the env vars/secrets it needs — this feeds the Required-Secrets manifest in Wave P."
---

# pixel — Tool Matrix

> Canonical tool choices for the Frontend/Web flagship as of **2026-06-11** (all versions npm-verified). For each tool: **DEFAULT vs ALTS**, **WHEN to use which**, the **AGENT SURFACE** (how a bot drives it — CLI / API-SDK / MCP / code-only), and **SECRETS** (env vars it needs → feeds the Wave-P Required-Secrets manifest). The energy rule **Skills/CLIs > MCPs** (token cost) applies; **Playwright MCP is BANNED — use Playwright CLI.**
>
> Pin these version floors in memory: Node **20.9+** · TS **5.1+** · React **19.2.7** · Next **16.2.9** · Tailwind **4.3.0** · shadcn CLI **4.11.0** · @radix-ui/colors **3.0.0** · Lucide **1.17.0** · GSAP **3.15.0** · Motion **12.40.0** · Lenis **1.3.23** · Rive react-canvas **4.29.0** · three **0.184.0 (r184)** · impeccable **2.3.2** · Lighthouse **13.4.0** · @lhci/cli **0.15.1** · @axe-core/playwright **4.11.3**.

---

## §1 — CORE STACK (the framework + styling + components)

| Concern | DEFAULT | ALTS / escape hatch | When to switch | Agent surface |
|---|---|---|---|---|
| Framework | **Next.js 16.2.9** (App Router, RSC) | — | — | CLI: `create-next-app`; **Next DevTools MCP** (ships w/ 16) |
| Bundler | **Turbopack** (default in 16) | `--webpack` | Tailwind-styles-drop (#81763), bundle-analyzer (#77482), standalone-Docker (#88844), low-RAM (#81161) | CLI flag on `next dev`/`next build` |
| Caching | **`use cache` per-route** + `<Suspense>` | leave `cacheComponents` off | perf-critical stable read-routes ON; auth/portal/CSP routes stay dynamic | code-only; debug via Next DevTools MCP |
| Styling | **Tailwind v4.3 CSS-first `@theme`** | `@config tailwind.config.js` | a plugin can't port (typography `prose`, custom-screen objects) | code-only (edit `@theme`); CLI `@tailwindcss/upgrade` |
| Components | **shadcn (CLI 4.11) + unified `radix-ui`** | Base UI (`--base base-ui`) | only when shadcn makes Base UI the *default style* (asChild tripwire) | CLI `shadcn`; **shadcn registry MCP** |
| Primitives | **Radix** (`--base radix`) | Base UI | see [[OPINIONS]] O3 / [[GAPS-AND-DISPUTES]] §2 | via shadcn |
| Color system | **Radix Colors 12-step** (`@radix-ui/colors` 3.0.0) + OKLCH | — | — | code-only (tokens in `@theme`) |
| Icons | **Lucide** (`lucide-react` 1.17.0) | **Phosphor** (`@phosphor-icons/react` 2.1.10) | Phosphor ONLY for deliberate weight-hierarchy moments (16-18× bundle) | code-only |
| Auth | **Clerk** (energy default, in `.env.example`) | — | NOTE: breaks under global `cacheComponents` (#85490) — keep auth routes dynamic | SDK `@clerk/nextjs` |

**Secrets (core):** Clerk → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (all in `.env.example`). Tailwind/shadcn/Radix/icons/Next = **no secrets**. [ecosystem-01/02/03]

## §2 — ANIMATION STACK (lowest-layer-that-works; all code-only, NO MCPs)

| Layer | DEFAULT tool | Package / version | When to use | When NOT |
|---|---|---|---|---|
| 1 CSS-native | **View Transitions / scroll-timeline / `@starting-style`** | React 19.2 `<ViewTransition>`; Tailwind v4 utils | simple page transitions, reveals, enter-on-paint | complex orchestration, scrubbing |
| 2 Smooth scroll | **Lenis** | `lenis` **1.3.23** (`lenis/react`) | smooth scroll foundation; preserves sticky/snap/IO | when CSS scroll-behavior suffices |
| 3 Scroll FX | **GSAP ScrollTrigger** (100% free) | `gsap` **3.15.0** (+ `@gsap/react` `useGSAP`) | pin/scrub/snap, timelines, SplitText | a fade (use CSS) or UI state (use Motion) |
| 4 UI state | **Motion** `LazyMotion`+`m` (~4.6KB) | `motion` **12.40.0** (`motion/react`) | UI state, layout, exit/enter, gestures | a fade (CSS) or scroll-pin (GSAP) |
| 5 Branded interactive | **Rive** | `@rive-app/react-canvas` **4.29.0** | mascot, interactive logo, multi-state button | generic UI motion |
| 6 3D | **Three.js / R3F** | `three` **0.184.0 (r184)** + `@react-three/drei` | brand demands 3D; WebGPU (r171+) w/ WebGL fallback | anything cheaper works |

- **AGENT SURFACE for the whole stack:** **code-only** — there is NO Tailwind/GSAP/Motion/Lenis/Rive/Three first-party MCP. The agent edits code and **verifies visually** (Playwright CLI screenshot). Ingest the *community* `motion` Claude skill (secondsky/jezweb claude-skills) into `skills/`. → [[GAPS-AND-DISPUTES]] §8.
- **#1 stale-import trap:** `lenis`/`lenis/react`, NEVER `@studio-freight/*` (retired April 2026). **#1 integration gotcha:** `new Lenis({ autoRaf: false })` + drive from `gsap.ticker` (one rAF loop). → [[KNOWN-PITFALLS]] §4.
- **Secrets:** none (all client-side libs). [ecosystem-04]

## §3 — MOCKUP GENERATION (v0-class — generated output is an UNTRUSTED draft)

| Tool | What it is | Fit for pixel | Agent surface | Secrets |
|---|---|---|---|---|
| **v0 (Vercel)** — DEFAULT generator | React/Tailwind/shadcn component generator | **best (stack-aligned, has API/SDK)** | **API + SDK:** `v0.chats.create({message, system})` via `v0-sdk` / `@v0-sdk/ai-tools`; models `v0-1.5-md`/`-lg`. **No official MCP.** | **v0 API key** (NOT yet in `.env.example` — add in Wave P; e.g. `V0_API_KEY`) |
| Vercel AI SDK | generative-UI streaming, v0 model provider | adjacent (chat/tool-card UIs) | SDK `@ai-sdk/vercel` | provider key (Vercel) |
| **Figma** — DEFAULT design→code | frame→code + token extraction | best when a designer exists | **Figma Dev Mode MCP** (read frame: nodes/variants/tokens/assets; bidirectional). Roundtrip loses business logic/handlers — initial pass only. | Figma account + Dev Mode + desktop app (OAuth/seat, not a simple env var) |
| Lovable | NL→full-stack (Supabase built-in) | **reference only** (owns whole stack) | web UI | n/a (not a codebase contributor) |
| Bolt.new | in-browser WebContainer IDE | **reference only** | web UI | n/a |
| Magic UI / Aceternity / SVGMaker | animated/3D component + AI-SVG registries | cherry-pick, **gate through anti-slop audit** (lean AI-slop) | **Magic UI MCP / SVGMaker MCP** | varies |

- **HARD RULE:** all v0/Lovable/Bolt output has **~40-45% vulnerability rate** → untrusted draft → must pass the §5 ship gate before merge. pixel's moat = the audit gates, not the generator. → [[OPINIONS]] O7, [[BATTLE-TESTED-SCENARIOS]] S7.
- **GAP:** exact v0 model id/tier + whether a v0 MCP exists is unconfirmed → [[GAPS-AND-DISPUTES]] §6. [ecosystem-06]

## §4 — MIGRATION / SCAFFOLD CLIs (determinism beats hand-edits)

| Tool | Command shape | Purpose | Secrets |
|---|---|---|---|
| **create-next-app** | `npx create-next-app@latest` | scaffold (App Router + TS + Tailwind + ESLint) | none |
| **shadcn** (CLI 4.11) | `shadcn init -t next --base radix` · `add <c> --dry-run/--diff/--view` · `info` · `docs <c>` · `build` · `migrate radix` | component gen + **agent introspection** (`info`/`docs` self-serve) | none |
| **@next/codemod** | `npx @next/codemod@canary upgrade latest` · `... next-lint-to-eslint-cli .` | deterministic version migration (then grep the gap) | none |
| **@tailwindcss/upgrade** | `npx @tailwindcss/upgrade` | v3→v4 migration (clean branch; may pin `@config`) | none |

- **Scaffold-not-fork** (→ [[OPINIONS]] O10): `shadcn init -t next --base radix` + mine `vercel/next-app-router-playground` (patterns), `vercel/ai-chatbot` (generative-UI/tool-cards), `vercel/next-forge` (monorepo shape), `ixartz/Next-js-Boilerplate` (test/CI/a11y tooling). **Blacklist** (Next-13/14/15 stale): `steven-tey/precedent`, old `t3-oss/create-t3-app`, `next-saas-starter`, `relivator`, `shadcn-ui/next-template`. [ecosystem-08]
- **Always `--dry-run`/`--diff` before a multi-file write** (an agent can't easily undo). [ecosystem-09]

## §5 — QUALITY / AUDIT GATES (the harness's reason to exist — wire ALL, in order)

| # | Tool | Command | Gate | Secrets |
|---|---|---|---|---|
| 1 | **impeccable 2.3.2** (37.4k★, anti-slop) | `npx impeccable detect --json src/` · `skills install` · `/impeccable critique` | exit-code: 41 deterministic slop+quality rules (no LLM/key for `detect`) | none for `detect`; LLM for `critique`/`audit` |
| 2 | **@axe-core/playwright 4.11.3** | inject `axe` into running page | **zero WCAG-2.2-AA violations** (~30-40% of WCAG) | none |
| 3 | **Lighthouse CI** (`@lhci/cli` 0.15.1; Lighthouse 13.4.0) | `lhci autorun` | budgets: LCP<2.0s · INP<200ms · CLS<0.1 · a11y≥95 | none (LHCI server token optional) |
| 4 | **design-systems 12-dim binary audit** | (energy skill) | **≥10/12** pass/fail, no "7/10" (the taste layer) | none |
| 5 | **Manual a11y** | keyboard + screen-reader + reduced-motion | the 60-70% axe misses | none |
| 6 | **Security review** | (the 40-45% AI-vuln rate) | no vuln merges | none |
| 7 | **Playwright CLI** (visual proof) | `npx playwright screenshot/test` | screenshot READ; console = 0 hydration warns | none |

- **Playwright: CLI only — MCP is BANNED** (energy rule). `@axe-core/playwright` rides the CLI. [ecosystem-07]
- These gates are JOB 7 in [[EXPERTISE-MAP]] and the spine of every Wave-S eval. [ecosystem-07]

## §6 — MCP SERVERS (agent surface) — current vs to-add

**Already wired in `pixel/.mcp.json`:** `github` (`@modelcontextprotocol/server-github`, needs `GITHUB_PERSONAL_ACCESS_TOKEN`) · `context7` (`@upstash/context7-mcp`, no key — **version-correct docs, counters training-cutoff staleness**) · `memory` (`@modelcontextprotocol/server-memory`, `MEMORY_FILE_PATH=./memory/MEMORY.md`) · `obsidian` (`@bitbonsai/mcpvault`, `VAULT_PATH=./brain`).

**To ADD (Wave-P intake — verify package+config, then test connect → [[GAPS-AND-DISPUTES]] §10):**

| MCP | Gives the agent | Secrets | Confidence |
|---|---|---|---|
| **Next DevTools MCP** | framework-native debug: routing/caching/rendering knowledge, **unified browser+server logs**, auto error stack traces, active-route awareness. 16.2 adds Agent DevTools + Browser Log Forwarding. **THE most important agent surface for a Next app.** | none (ships with Next 16) | high (docs: nextjs.org/docs/app/guides/mcp) |
| **shadcn registry MCP** | search/list/view/add components from any shadcn-compatible registry (official + 3rd-party + GitHub) | none | high (docs: ui.shadcn.com/docs/registry/mcp) |
| **Figma Dev Mode MCP** | read frame nodes/variants/**tokens**/assets; frame→code; bidirectional (loses logic/handlers) | Figma account + Dev Mode + desktop app | medium (needs Figma seat) |
| Magic UI MCP / SVGMaker MCP | animated-component / AI-SVG gen (gate through anti-slop audit) | varies | low (optional) |

[ecosystem-09]

## §7 — REQUIRED-SECRETS MANIFEST (the Wave-P feed — consolidated)

| Secret | Tool | Status | Notes |
|---|---|---|---|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | github MCP + Actions push | **in `.env.example`** | also add as repo secret `PAT_TOKEN` |
| `ANTHROPIC_API_KEY` | Claude (impeccable `critique`, agent itself) | **in `.env.example`** | LLM gates only; `impeccable detect` needs nothing |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (+ sign-in/up URLs) | Clerk auth | **in `.env.example`** | keep auth routes OUT of global `cacheComponents` |
| `V0_API_KEY` (name TBD) | v0 Platform API / `v0-sdk` | **MISSING — add in Wave P** | exact env name unconfirmed → [[GAPS-AND-DISPUTES]] §6 |
| Figma Dev Mode access | Figma MCP | **not an env var** | OAuth/seat + desktop app + Dev Mode |
| `LHCI_TOKEN` (optional) | Lighthouse CI server | optional | only if uploading to an LHCI server |
| (none) | Tailwind, shadcn, Radix, Lucide/Phosphor, Lenis, GSAP, Motion, Rive, Three, impeccable `detect`, axe-playwright, Playwright CLI, Next DevTools MCP, shadcn registry MCP, context7 | — | **the bulk of the stack needs NO secrets** |

**Already in `.env.example` but not pixel-frontend-critical** (inherited from energy, leave unless a feature needs them): `E2B_API_KEY`, `STRIPE_*`, `SUPABASE_*`, `BROWSERBASE_API_KEY`, `FIRECRAWL_API_KEY`, `GOOGLE_PLACES_API_KEY`, `TICKETMASTER_API_KEY`, Twilio/WhatsApp/Cronofy (commented).

## §8 — Ecosystem watch (the DSIP `externalIntelligence` source list)
Nightly `re-verify-tool-matrix` re-runs `npm view` on every pinned package and checks these changelogs/issue-trackers for drift (→ promote/relax [[GAPS-AND-DISPUTES]]):
- `nextjs.org/blog` + vercel/next.js GitHub issues (Cache Components / Turbopack clusters)
- `tailwindcss.com/blog` + tailwindlabs/tailwindcss discussions
- `ui.shadcn.com/docs/changelog` (Base-UI-default watch, weekly CLI minors)
- `github.com/pbakaus/impeccable` (rule additions) · motion.dev · rive.app · gsap.com
- `web.dev` / Google Search Central (CWV threshold confirmation) · w3.org WCAG
- X/HN/Reddit practitioner threads → feed `research/raw/field-*.md` (the missing pass, [[GAPS-AND-DISPUTES]] §7)

## Sources
Tool choices, versions, and agent surfaces trace to `research/raw/ecosystem-01..09` (npm-verified 2026-06-11) and `pixel/{.mcp.json, .env.example}` (read for the actual wired servers + secret names). Defaults vs alts mirror the verdicts in `ecosystem-10-tradeoffs-matrix.md`; see [[OPINIONS]] for the stances and [[GAPS-AND-DISPUTES]] for the unconfirmed v0 key name + the 3 to-add MCPs.
