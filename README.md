# pixel

<!-- fleet:header:start -->
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE) [![Agent-native](https://img.shields.io/badge/agent--native-yes-2f5d8a?style=flat-square)](AGENTS.md) [![MCP server](https://img.shields.io/badge/MCP-server-1e3f60?style=flat-square)](#use-it-from-any-coding-agent) [![Skills](https://img.shields.io/badge/skills-7-2f6b4f?style=flat-square)](skills/)

**Frontend taste you can put in CI: it scaffolds Next.js 16 apps and blocks UI that looks AI-made.**

Pixel is an agent employee, a packaged specialist agent with its own skills, memory and tests. It owns one job: frontend. Coding agents use it through its skills, its MCP server and its command line. A scheduled job runs its evals and proposes fixes. A person makes every change.

_Pixel is part of an agent-native play for agent-native systems that can eventually be recursively self-improving and evolving, operated by agent employees._

[AGENTS.md](AGENTS.md) · [llms.txt](llms.txt) · [Skills](skills/) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [All projects](https://github.com/naman10parikh)
<!-- fleet:header:end -->

Pixel is a frontend designer-engineer for coding agents. Give it a one-line product brief and it hands back a
mockup written for a named user and a clean Next.js 16 app on Tailwind v4 and shadcn, checked so it does not look
AI-made. It is for people and agents who ship web UI and want a taste gate in CI rather than another generator:
every generated screen is an untrusted draft until it passes the gate. Its edge is that gate (`impeccable detect`
plus a 12-dimension design audit), not the generator.

<!-- fleet:use:start -->
## Use it from any coding agent

**Claude Code**: the plugin brings the skills, sub-agents, hooks and MCP server.

```
/plugin marketplace add naman10parikh/pixel
/plugin install pixel@pixel
```

<details><summary>Its MCP server, Codex, Cursor, Gemini CLI, one skill and the command line</summary>

**Its MCP server**, in any MCP client:

```bash
claude mcp add --transport stdio pixel -- npx -y -p github:naman10parikh/pixel pixel-mcp
codex mcp add pixel -- npx -y -p github:naman10parikh/pixel pixel-mcp
```

Cursor (`.cursor/mcp.json`), Gemini CLI (`.gemini/settings.json`) and most other clients take the same command as JSON:

```json
{
  "mcpServers": {
    "pixel": {
      "command": "npx",
      "args": [
        "-y",
        "-p",
        "github:naman10parikh/pixel",
        "pixel-mcp"
      ]
    }
  }
}
```

**Gemini CLI**: the extension brings the context and the MCP server.

```bash
gemini extensions install https://github.com/naman10parikh/pixel
```

**One skill** (7 in all, in [skills/](skills/)), in any agent that reads Agent Skills:

```bash
gemini skills install https://github.com/naman10parikh/pixel --path skills/pixel-anti-slop
git clone --depth 1 https://github.com/naman10parikh/pixel /tmp/pixel && cp -r /tmp/pixel/skills/pixel-anti-slop ~/.claude/skills/
```

**The command line:**

```bash
npx -y -p github:naman10parikh/pixel pixel --help
```

</details>

Codex, Cursor, OpenCode, GitHub Copilot and other agents read [AGENTS.md](AGENTS.md); Claude Code reads [CLAUDE.md](CLAUDE.md) and Gemini CLI reads [GEMINI.md](GEMINI.md), which import it. [llms.txt](llms.txt) maps every surface for agents that read first.
<!-- fleet:use:end -->

## Quick start

In one step, straight from GitHub:

```bash
npx -y -p github:naman10parikh/pixel pixel --help
```

From a clone:

```bash
git clone https://github.com/naman10parikh/pixel && cd pixel
pnpm install && pnpm build
node dist/cli.js --version
node dist/cli.js mock "a fintech portfolio dashboard for Marcus, a hedge-fund PM who lives in Bloomberg Terminal" --out /tmp/pixel-demo --no-sandbox
pnpm test && npm run eval
```

`mock` needs no API key. It writes the discovery brief with the named user (`brief.md`), the mockup
(`mockup/index.html`) and a scaffolded app (`app/`), and exits 0 only when the anti-slop gate passes. Set `V0_API_KEY`
to add a v0 first draft, and `E2B_API_KEY` to run the gate inside a sandbox. `pnpm link --global` puts the `pixel`
command on your path, so every command below is also `pixel <cmd>`.

## How it works

`pixel mock` runs four steps and logs each one to `logs/runs.jsonl`:

1. **Discover.** A six-section brief and a first, second and third hierarchy map, built around a named person. No
   brief, no design.
2. **Generate.** An optional v0 first draft, tagged untrusted. Without a key it skips straight to the scaffold.
3. **Gate.** It writes the mockup, scaffolds a Next.js 16 app with `shadcn init` and the house tokens in Tailwind v4
   `@theme`, then runs the ship gate.
4. **Emit.** It reports the mockup and the app, and exits non-zero if the gate failed.

The ship gate always runs in the same order: impeccable (anti-slop), axe, Lighthouse CI, the 12-dimension design
audit, manual accessibility, security, and visual proof. `pixel audit` runs it on any app. `pixel verify` adds the
silent-failure checks: a build, a screenshot, zero hydration warnings, and the §0 grep-set for stale Next.js and
Tailwind patterns.

Each night a loop (`.github/workflows/rsi.yml`) checks the 15 pinned packages against npm and runs the L1 evals. A
moved pin becomes a `BRAIN-DRIFT.md` proposal, kept as a run artifact for a person to review; the loop never edits
the brain and never merges. A failing eval turns the run red.

Its knowledge lives in `brain/`: the 8-job loop, 20 battle-tested scenarios, the known pitfalls, the opinions with
their reasons, the open disputes and the tool matrix. `bash scripts/memory-search.sh "<query>"` and the
`pixel_brain_search` tool search it with BM25.

- **CLI** (`pixel <cmd>`): `mock`, `scaffold`, `design`, `generate`, `audit`, `verify`, `migrate`, `cockpit`, `logs`.
  [AGENTS.md](AGENTS.md) lists every command and its contract.
- **MCP server** (`pixel-mcp`): the same verbs over JSON-RPC for agents (`pixel_mock`, `pixel_taste_check`,
  `pixel_brain_search` and five more). The root `.mcp.json` starts it from GitHub; `.mcp.dev.json` starts your local
  build.
- **Cockpit** (`pixel cockpit --port 7780`): a local page with the brain browser, the run log, eval scores,
  ask-the-employee and the mockup gallery.
- **Skills and personas**: 7 skills written for pixel's own job (anti-slop, the ship gate, the RSC boundary,
  animation, the Next 16 migration, agent UI, reading pages), 24 vendored design skills, and two sub-agents
  (`pixel-taste-critic`, `pixel-migration-pilot`).

Stack pins (npm-verified 2026-06-11): Next **16.2.9**, React **19.2.7**, Tailwind **4.3.0**, shadcn CLI **4.11.0**,
Radix, Lucide, GSAP **3.15**, Motion **12.40**, Lenis **1.3.23**, impeccable **2.3.2**.

Read first: [AGENTS.md](AGENTS.md) (what pixel does, its tools, what it refuses), [CLAUDE.md](CLAUDE.md) (the pins,
the 8-job loop, the §0 grep-set), [`brain/MOC - pixel.md`](brain/MOC%20-%20pixel.md) (the six expertise files) and
[llms.txt](llms.txt) (the map of every surface).

<!-- fleet:anatomy:start -->
## What it is made of

Every project in this fleet is graded on the same 11 harness components and on self-improvement. Each mark is backed by a file you can open.

| Component | Grade | Where |
| --- | --- | --- |
| Identity | ✅ | identity/SOUL.md:3 |
| Memory | ✅ | scripts/memory-search.sh:2 |
| Skills | ✅ | skills/pixel-ship-gate/SKILL.md:1 |
| Tools/CLIs | ✅ | package.json:7 |
| Hooks | ✅ | .claude/settings.json:14 |
| Sub-agents | ✅ | .claude/agents/pixel-taste-critic.md:2 |
| MCPs | ✅ | src/mcp-server.ts:83 |
| Dispatch | ✅ | src/lib/pipeline.ts:2 |
| Evals | ✅ | .github/workflows/ci.yml:65 |
| Observability | ✅ | src/lib/logger.ts:3 |
| Sandbox/Infra | ✅ | src/lib/sandbox.ts:154 |
| Self-improvement | ✅ | dsip.json:27 |

✅ real and tested · 🟡 partial, with the reason in the row · ❌ absent
<!-- fleet:anatomy:end -->

A recursively self-improving, agent-native harness, built on the Energy harness formula. Powered by Energy.

<!-- fleet:footer:start -->
## How it improves itself

It carries its own evals and a self-improvement contract, [`dsip.json`](dsip.json), which says what it may change and how a change is judged. A scheduled job runs its evals and proposes fixes. A person makes every change. Lessons it learns are kept as rules in its memory files.

## Part of a fleet

One of the projects by [Naman Parikh](https://github.com/naman10parikh). Each owns one part of an agent's harness, or of the product around an agent, and all of them follow one standard.

Siblings: [agentdial](https://github.com/naman10parikh/agentdial) (identity) · [wikimem](https://github.com/naman10parikh/wikimem) (memory) · [skillsmith](https://github.com/naman10parikh/skillsmith) (skills) · [agent-booster](https://github.com/naman10parikh/agent-booster) (tools / CLIs) · [armory](https://github.com/naman10parikh/armory) (MCPs and the component registry) · [agentgrid](https://github.com/naman10parikh/agentgrid) (dispatch) · [agentswarm](https://github.com/naman10parikh/agentswarm) (dispatch) · [agentbench](https://github.com/naman10parikh/agentbench) (evals) · [agentmoney](https://github.com/naman10parikh/agentmoney) (observability) · [claude-harness](https://github.com/naman10parikh/claude-harness) (the whole harness, as a template).

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md). AI-assisted pull requests are welcome. Report a vulnerability privately, as [SECURITY.md](SECURITY.md) explains.

## License

MIT, © 2026 Naman Parikh. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
<!-- fleet:footer:end -->
