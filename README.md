# pixel

**Frontend taste you can put in CI.** pixel is the Energy fleet's frontend web designer-engineer — a
highly opinionated harness that scaffolds, designs-to-taste, generates-then-gates, and verifies
Next.js 16 / Tailwind v4 / shadcn UI. It treats every generated UI as an **untrusted draft** and ships
only what survives the anti-slop taste gate.

Give it a product brief and it hands back an **ICP-aware mockup + a clean Next.js 16 app**, checked so it
doesn't look AI-made. pixel's moat is the **audit/taste gate** (`impeccable detect` + the design-systems
12-dimension binary audit), not the generator.

## Quick start

```bash
pnpm install && pnpm build
node dist/cli.js --version
node dist/cli.js mock "a portfolio dashboard for Marcus, a hedge-fund PM who lives in Bloomberg Terminal" --out /tmp/pixel-demo
```

## The surfaces

- **CLI** (`pixel <cmd>`): `mock` · `scaffold` · `design` · `generate` · `audit` · `verify` · `migrate` ·
  `cockpit` · `logs`. See [AGENTS.md](AGENTS.md) for the full tool list + contracts.
- **MCP** (`pixel-mcp`): the same verbs over JSON-RPC for agent callers (`pixel_mock`, `pixel_taste_check`,
  `pixel_brain_search`, …). Wired in `.mcp.json`.
- **Cockpit** (`pixel cockpit --port 7780`): a local warm-black SPA — brain browser, run log, eval scores,
  ask-the-employee, and the mockup gallery.

## Read first

- [AGENTS.md](AGENTS.md) — what pixel does, the tool surface, the REFUSES boundary.
- [CLAUDE.md](CLAUDE.md) — the operating doc (stack pins, the 8-job loop, the §0 grep-set discipline).
- [`brain/MOC - pixel.md`](brain/MOC%20-%20pixel.md) — the employee's competence (the six expertise files).
- [llms.txt](llms.txt) — the agent-readable map of every surface.

## Stack pins (npm-verified 2026-06-11)

Next **16.2.9** · React **19.2.7** · Tailwind **4.3.0** · shadcn CLI **4.11.0** · Radix · Lucide ·
GSAP **3.15** · Motion **12.40** · Lenis **1.3.23** · impeccable **2.3.2**.

---

A recursively self-improving, agent-native harness — built on the Energy harness formula. Powered by Energy.
