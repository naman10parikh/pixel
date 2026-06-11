# Operating the Stack as an AGENT (not a human) — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11.
The mission's hardest question: *what does a bot operating these tools need that a human doesn't?* Humans get GUIs, hover-tooltips, and visual feedback for free; an agent needs **CLIs, MCP servers, structured APIs, and deterministic verification**. This file is the agent's operating manual.

## THE AGENT TOOLBELT (CLIs / MCPs / APIs that EXIST for this stack)

### MCP servers an agent should wire (pixel's .mcp.json today has github/context7/memory/obsidian — ADD these)
| MCP | What it gives the agent | Source |
|---|---|---|
| **Next.js DevTools MCP** | Framework-native debugging: routing/caching/rendering knowledge, **unified browser+server logs**, automatic error stack traces, active-route awareness. Ships in Next 16. 16.2 adds Agent DevTools (terminal access to React DevTools + diagnostics) + Browser Log Forwarding. **THE single most important agent surface for a Next app.** | https://nextjs.org/docs/app/guides/mcp |
| **shadcn registry MCP** | Search/list/view/add components from any shadcn-compatible registry (official + 3rd-party + GitHub) over MCP — no special setup. Lets the agent discover + install UI programmatically. | https://ui.shadcn.com/docs/registry/mcp |
| **Figma Dev Mode MCP** | Read a selected frame's node tree, variants, layout constraints, **design tokens/variables**, asset refs; generate code from a frame; push code back as editable layers (bidirectional, 2026). Caveat: roundtrip loses business logic/handlers. | https://www.figma.com/blog/introducing-claude-code-to-figma/ |
| **Context7 MCP** (already wired) | Live, version-correct framework docs (Next/React/Tailwind) injected at the right version — counters the agent's training-cutoff staleness. | `@upstash/context7-mcp` |
| **Magic UI MCP / SVGMaker MCP** | Animated-component + AI-SVG generation (gate through anti-slop audit). | frontend-bible-2026.md |

### CLIs an agent drives (Bash-invokable — the energy way: skills/CLIs > MCPs for token cost)
| CLI | Command shape | Purpose |
|---|---|---|
| **create-next-app** | `npx create-next-app@latest` | Scaffold (App Router + TS + Tailwind + ESLint). 16.2: agent-ready scaffold. |
| **shadcn** | `shadcn init -t next --base radix` · `shadcn add <c> --dry-run/--diff/--view` · `shadcn info` · `shadcn docs <c>` · `shadcn build` · `shadcn migrate radix` | Component gen + introspection. v4 added the inspect flags + `info`/`docs` (agent self-serve). |
| **@next/codemod** | `npx @next/codemod@canary upgrade latest` | Deterministic version migration (then grep for what it misses). |
| **@tailwindcss/upgrade** | `npx @tailwindcss/upgrade` | v3→v4 migration (run on clean branch; may pin a `@config`). |
| **impeccable** | `npx impeccable detect --json src/` · `npx impeccable skills install` · `/impeccable critique` | Anti-slop + design-quality gate (41 deterministic rules, exit codes). |
| **Lighthouse CI** | `lhci autorun` (`@lhci/cli`) | Perf/a11y budgets in CI (fail on LCP/score regression). |
| **Playwright CLI** | `npx playwright screenshot/test` + `@axe-core/playwright` | Visual proof + programmatic a11y assertions. **(energy bans Playwright MCP; uses CLI.)** |
| **v0 SDK** | `v0.chats.create({message, system})` (`v0-sdk` / `@v0-sdk/ai-tools`) | Programmatic mockup generation, models `v0-1.5-md`/`-lg`. |

### APIs (REST/SDK) an agent calls
- **v0 Platform API** — REST + TS SDK; lifecycle prompt→project→code→deploy. (ecosystem-06.)
- **Vercel AI SDK** (`@ai-sdk/vercel`) — generative-UI streaming, the v0 model provider.
- No first-party MCP for Tailwind, GSAP, Motion, Lenis, Rive, Three — the agent operates these **by editing code + verifying visually**. (Community `motion` Claude skill exists — ingest it.)

## WHAT AN AGENT MUST KNOW THAT A HUMAN GETS FOR FREE

### 1. The silent-failure class (no error, wrong behavior) — the agent's blind spot
A human notices "my middleware stopped working." An agent sees a green build and moves on. So the agent MUST run **post-change assertions**, not trust the compiler:
- After `@next/codemod`: `grep -rn 'params\.' --include=*.tsx app/` for residual sync access; check no leftover `middleware.ts` (must be `proxy.ts`). (ecosystem-01 gotcha #1-2.)
- After Tailwind work: **build and grep the output CSS** for the class — content-detection means "it's in my JSX" ≠ "it generated." Verify Tailwind renders under **Turbopack** (issue #81763 drops Tailwind/DaisyUI styles). (ecosystem-02/05.)
- After enabling `cacheComponents`: load every route, assert no "Uncached data outside <Suspense>" (breaks Clerk #85490), no stuck portals (#85390). (ecosystem-05.)
- `quality={90}` silently becomes 75 unless `images.qualities` set (ecosystem-01).

### 2. Verification is visual — the agent can't "see" without taking a screenshot
- Run the app, **screenshot via Playwright CLI, and READ the image** (energy: "test as a USER," "it compiles means nothing").
- Read the **browser console** (Browser Log Forwarding in 16.2, or Playwright `page.on('console')`) → assert **zero hydration warnings** (the #1 RSC bug the agent can't otherwise detect).
- Run `npx impeccable detect` → the agent gets a deterministic read on whether its own output looks AI-generated (a human designer "just knows"; the agent needs the rule engine).

### 3. Currency — the agent's training data is stale by construction
- The single biggest agent failure mode here: emitting **stale patterns** (sync `params`, `@tailwind` directives, `@studio-freight/react-lenis`, `tailwind.config.js`, `next/legacy/image`, FID instead of INP). Mitigation: **Context7 MCP** for version-correct docs + **brain/TOOL-MATRIX.md** ecosystem watch (changelogs/issues/X) per pixel's DSIP `externalIntelligence`.
- Pin the canonical version floors in the brain: Node 20.9+, TS 5.1+, React 19.2, Next 16.2, Tailwind 4.3, shadcn CLI 4.11, browsers Chrome/FF/Safari 111/128?/16.4.

### 4. Determinism beats cleverness — prefer the codemod/CLI to hand-edits
- `@next/codemod` / `@tailwindcss/upgrade` / `shadcn migrate radix` do the mechanical migration; the agent's job is the **gap** the codemod misses, not re-doing the whole thing. (Karpathy "surgical changes" — energy rule.)
- Use `shadcn add --dry-run`/`--diff` to preview before writing (agent can't easily undo a bad multi-file write).

## THE PIXEL AGENT LOOP (synthesis — how a pixel agent should operate)
1. **Discover** (data-fed ICP) → fill design-systems Step-1 brief (gate).
2. **Scaffold/generate** → `create-next-app` / `shadcn init` / v0 SDK draft / Figma-MCP frame.
3. **Build to taste** → energy design-systems DFS + house style (warm-black/Instrument-Serif/Poppins); leaf-`use client`, Suspense-wrap dynamic, `LazyMotion`, Lenis+GSAP `autoRaf:false`.
4. **Verify (deterministic + visual)** → impeccable detect (exit-code) · axe-playwright (0 violations) · lhci budgets (LCP<2.0/INP<200/CLS<0.1) · Playwright screenshot READ · console = 0 hydration warns · grep residual stale patterns.
5. **Audit (taste + security)** → 12-dim binary (≥10/12) · security review (40-45% AI-vuln rate).
6. **Self-improve** → log gaps to brain; re-verify TOOL-MATRIX nightly (DSIP eval pyramid L1/L2/L3).

## PIXEL IMPLICATIONS
- **Add Next DevTools MCP + shadcn registry MCP + Figma Dev Mode MCP** to pixel's `.mcp.json` (currently only github/context7/memory/obsidian).
- Encode the **silent-failure assertion grep set** as a hook (post-codemod, pre-commit).
- Encode the **6-step agent loop** as pixel's primary skill; wire impeccable/axe/lhci as the verify-gate.
- Ingest the community **`motion` Claude skill**.

## SOURCES
- https://nextjs.org/docs/app/guides/mcp — Next DevTools MCP.
- https://ui.shadcn.com/docs/registry/mcp — shadcn registry MCP.
- https://www.figma.com/blog/introducing-claude-code-to-figma/ — Figma Dev Mode MCP (bidirectional).
- https://github.com/vercel/v0-sdk — v0 SDK / Platform API.
- https://github.com/pbakaus/impeccable — impeccable CLI/skill.
- Internal READ-ONLY: ~/pixel/{.mcp.json, dsip.json, AGENTS.md}; ~/energy/.claude/rules/{design.md, react.md} + frontend-bible-2026.md.
- Cross-refs: ecosystem-01..08 (this research set).
