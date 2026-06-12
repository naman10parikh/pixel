# AGENTS.md — pixel (the Energy fleet's frontend employee)

> This file tells a coding agent (Claude Code, the energy hub, sibling employees) what pixel is, how to
> call it, and where its competence lives. **Read `brain/` first** — `brain/MOC - pixel.md` is the map.
> pixel is a TOOL-employee, not a SaaS: the surfaces are the CLI, the MCP server, and the local cockpit.

## What pixel does

pixel is a highly opinionated frontend web designer-engineer for the 2026 Next.js / React / Tailwind /
shadcn stack. It **treats every generated UI as an untrusted draft** and ships only what survives the
taste gates. Given a product brief it runs discovery → generates a first-pass draft → gates it through
the 7-step ship stack → emits an **ICP-aware mockup + a scaffolded Next.js 16 app**. pixel's moat is the
**audit/taste gate, not the generator** (OPINIONS O7).

Stack pins (npm-verified 2026-06-11): Next **16.2.9** · React **19.2.7** · Tailwind **4.3.0** · shadcn
CLI **4.11.0** · Radix · Lucide · GSAP **3.15** · Motion **12.40** · Lenis **1.3.23** · impeccable
**2.3.2**.

## The hands — `pixel <cmd>` CLI

```
pixel mock "<brief>" [--out DIR] [--no-sandbox] [--json]
        THE FLAGSHIP: discovery brief → first-pass draft → 7-step gate → ICP-aware mockup + scaffolded Next app. Exit non-0 if the gate fails.
pixel scaffold [DIR] [--base radix]
        clean Next 16 app via `shadcn init -t next --base radix` (scaffold-not-fork, O10); wires Tailwind v4 @theme + house tokens.
pixel design "<brief>" [--vertical fintech|health|…]
        discovery: 6-section brief + FIRST/SECOND/THIRD hierarchy map. NO BRIEF = NO DESIGN (O11). Emits brief.md, draws nothing.
pixel generate "<prompt>" [--model v0-1.5-md|-lg] [--out DIR]
        v0 Platform API draft (untrusted). Tags output "DRAFT — must pass `pixel audit`."
pixel audit [DIR] [--sandbox] [--fix]
        the 7-step ship gate in order: impeccable → axe → lhci → 12-dim → manual-a11y → security → visual. Exit-code gate.
pixel verify [DIR]
        the silent-failure assertion set: §0 grep-set + build + screenshot + console=0-hydration.
pixel migrate [DIR] [--from 15]
        codemod-then-grep upgrade (@next/codemod + @tailwindcss/upgrade), then `pixel verify` for the gap (O13).
pixel cockpit [--port 7780]
        serve the localhost cockpit (brain browser · run log · eval scores · ask-the-employee · MOCKUP GALLERY).
pixel logs [--last N]
        aggregate logs/runs.jsonl — cost/latency/gate-results per run.
pixel --help | --version
```

**Contract:** every command appends to `logs/runs.jsonl`; every command that emits/changes files runs
`pixel verify` before claiming done; `mock`/`audit` are exit-code gates (CI-usable).

## The MCP tools — `pixel-mcp` (JSON-RPC, mirrors the CLI verbs)

Server: `node dist/mcp-server.js` (stdio, no live keys). Wired in `.mcp.json` as `pixel-mcp`.

- `pixel_mock(brief, out?)` — the flagship over MCP → `{mockup_path, app_path, gate_report}`.
- `pixel_scaffold(dir, base?)` — clean Next 16 app.
- `pixel_design(brief, vertical?)` — discovery only (brief + hierarchy map).
- `pixel_generate(prompt, model?)` — v0 draft (untrusted).
- `pixel_audit(dir, sandbox?)` — the 7-step gate.
- `pixel_verify(dir)` — silent-failure check.
- `pixel_taste_check(code)` — impeccable + opinions over a snippet (the cheapest call).
- `pixel_brain_search(query)` — BM25 over `brain/` (the Memory layer over MCP).

## What pixel REFUSES (the hard boundary)

- **Mobile-native** (RN/Expo/EAS/`.native.tsx`/native modules) → that's **pebble**.
- **Backend/API/DB/auth-provider/payments/deploy internals** → turbo/acorn/badge/penny/rocket. pixel
  *consumes* Clerk on the web shell (knows it breaks under global `cacheComponents`) but does NOT own auth.
- **Shipping generated UI un-gated** → ~40–45% of v0/Lovable/Bolt output is vulnerable (O7); it's a draft
  until the ship gate passes.
- **Designing without a brief** → "NO BRIEF = NO DESIGN" (O11).
- **Emitting a stale pattern** → refuses `@studio-freight/*`, sync `params`, `@tailwind` directives,
  leftover `middleware.ts`, `images.domains`, the indigo prior (O-F1), an a11y overlay widget (S16).

## The brain (read first)

`brain/MOC - pixel.md` is the hub. The six expertise files:

- `brain/EXPERTISE-MAP.md` — the 8-job pixel loop (discover → ship → self-improve) + mastery checklist.
- `brain/BATTLE-TESTED-SCENARIOS.md` — S1–S20, each with a verbatim `VERIFY` line (the eval L1 set).
- `brain/KNOWN-PITFALLS.md` — the silent-failure class (§0–§12) that compiles green and misbehaves.
- `brain/OPINIONS.md` — the ALWAYS-X/NEVER-Y taste stances (O-HS, O-F, O1–O15) with the *because*.
- `brain/GAPS-AND-DISPUTES.md` — where the field disagrees + where the brain is honestly thin.
- `brain/TOOL-MATRIX.md` — default-vs-alt per concern + the §8 ecosystem watch (RSI fuel).

Query it: `bash scripts/memory-search.sh "<query>"` (BM25 over `brain/`) or the `pixel_brain_search` MCP
tool. The `obsidian` MCP is wired to `VAULT_PATH=./brain`.

## Self-improvement (RSI)

pixel improves its own taste/currency nightly — `node workflows/rsi.workflow.js --check` re-verifies the
pinned package versions (`npm view`), runs the L1 eval pyramid, and writes a `BRAIN-DRIFT.md` proposal if
a floor moved. Deterministic + $0 today; the Claude half lights up when `CLAUDE_CODE_OAUTH_TOKEN` is set
(see `CHAIRMAN-CHECKLIST.md`). `dsip.json` is the contract; `node scripts/darwin-check.mjs dsip.json`
grades it ≥ L1.

## Acceptance test (the bar)

`pixel mock "<brief>"` → an ICP-aware mockup + a scaffolded Next 16 app that passes `npx impeccable
detect` (anti-slop, keyless, exit-0) + a Playwright smoke (0 console hydration warnings, a `bg-*` style
actually applied). Run by the `acceptance` job in `.github/workflows/ci.yml`, red-blocking.

---

*pixel — powered by Energy. Frontend taste you can put in CI.*
