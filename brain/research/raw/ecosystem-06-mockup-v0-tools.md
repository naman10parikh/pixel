# Mockup Generation (v0-class) + ICP-Driven Design Discovery — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11.
Two halves: (A) external v0-class tools an agent can drive to GENERATE mockups; (B) the ICP-driven DISCOVERY process — pixel already inherits a world-class one from energy's design-systems skill.

================================================================
## A. v0-CLASS MOCKUP-GENERATION TOOLS (honest comparison)
================================================================

### The big three — what each actually is (2026)
Source: nxcode.io / weavai / getmocha / lovable.dev guides (all 2026); reconfirmed against Vercel changelog.

| Tool | What it is | Backend? | Best for | Pricing (2026) |
|---|---|---|---|---|
| **v0 (Vercel)** | Polished React/Tailwind/shadcn component generator; Figma import (Premium) | **No** backend/DB/auth — UI only | **Design-to-code in the Vercel/Next ecosystem**; component quality is best-in-class | credit/token, monthly reset |
| **Lovable** | NL → full-stack app in one browser tab (UI + Supabase backend + schema + auth + deploy) | **Yes** (Supabase built-in) | Non-coders validating a full app fastest; $20M ARR in 2mo | Pro $25/mo, Business $50/mo (as of 2026-05-22) |
| **Bolt.new** | Browser WebContainer IDE, zero local setup | No built-in DB | Technical users wanting in-browser control/logic; $40M ARR in 6mo | credit/token |

**Honest take for pixel:** pixel is the *Next.js component/shell* expert → **v0 is the aligned generator** (it emits React/Tailwind/shadcn that matches pixel's stack). Lovable/Bolt are full-app builders that own the whole stack — useful as *references* / for throwaway validation, but they don't slot into a hand-crafted Next 16 codebase the way v0's output does.

### ⚠️ THE honest caveat (cite this loudly)
**All three produce code with a ~40–45% vulnerability rate** — "budget for a security review regardless of which you pick." (nxcode.io 2026.) → pixel must treat any v0/Lovable/Bolt output as **untrusted draft**: run the security-scan + a11y/CWV gate (ecosystem-07) before it touches main. This is exactly why pixel is a *harness* (taste + audit gates), not just a wrapper around v0.

### THE AGENT-CRITICAL PIECE: v0 Platform API + SDK (generate mockups programmatically)
This is how pixel generates mockups *autonomously* (not via a human in the v0 web UI).
Source: https://vercel.com/blog/build-your-own-ai-app-builder-with-the-v0-platform-api ; https://vercel.com/changelog/v0-platform-api-now-in-beta ; https://github.com/vercel/v0-sdk (494★, 216 commits, active to 2026-03).

- **Packages:** `v0-sdk` (core), `@v0-sdk/react`, **`@v0-sdk/ai-tools`** (AI-SDK tool wrappers), `create-v0-sdk-app`. Install: `pnpm add v0-sdk`.
- **Core call (verbatim):**
  ```ts
  const chat = await v0.chats.create({
    message: 'Create a responsive navbar with Tailwind CSS',
    system: 'You are an expert React developer',
  })
  ```
  The API wraps the full lifecycle **prompt → project → code files → deployment** as REST endpoints + a TypeScript SDK. Output includes a web URL + generated code files you can pull into the repo.
- **Models** (from the AI-SDK Vercel provider `@ai-sdk/vercel`, not the SDK readme): **`v0-1.5-md`** (everyday UI generation), **`v0-1.5-lg`** (advanced reasoning). (Source: ai-sdk.dev/providers/ai-sdk-providers/vercel; weavai review 2026.) → GAP: exact current model id/version string and whether a `-sm` tier exists wasn't confirmable from primary docs on 2026-06-11.
- **No official v0 MCP server** found as of 2026-06-11 (the SDK is the agent interface). FLAG.
- **2026 status quote:** "Customer teams now routinely move v0-generated UIs straight into production with light review … common enough to have its own template marketplace." (Pair with the 40-45% vuln caveat — "light review" ≠ "no review.")

### Design-to-code from Figma — the **Figma Dev Mode MCP** (best agent path when a designer exists)
Source: https://help.figma.com/.../Claude-Code-and-Figma-Set-up-the-MCP-server ; https://www.figma.com/blog/introducing-claude-code-to-figma/ ; builder.io guides (2026).
- Gives an MCP client (Claude Code) **structured read access** to a selected Figma frame: node tree, **variant info, layout constraints, design tokens (variables), asset references**, FigJam + Make resources; can **generate code from a frame**; **Code Connect** keeps generated code aligned to real components.
- **Bidirectional (new 2026):** push a Claude-Code-built UI **back to Figma as editable layers** ("Claude Code → Figma").
- **HONEST LIMITATION (cite):** "The roundtrip isn't seamless. … When your designer tweaks those layers and you pull them back into code, things get messy. **Business logic doesn't survive the trip, event handlers disappear, and state management has to be re-implemented.**" → Use Figma MCP for *initial* frame→code and token extraction; do NOT rely on it as a continuous design↔code sync.

### Other generators worth knowing (from frontend-bible-2026.md)
- **Magic UI MCP** (animated components), **Aceternity UI** (3D/parallax/aurora — 200+), **SVGMaker MCP** (AI SVG). These are *registries/MCPs* an agent can pull from; energy bible lists them as 2026 additions. Magic UI / Aceternity are the "make a landing page pop" sources, but lean toward AI-slop aesthetics — gate them through pixel's anti-pattern audit.
- **Google Stitch** (Gemini) + **Nano Banana** (photoreal image gen) — energy/design.md already names these for prototyping + imagery.

================================================================
## B. ICP-DRIVEN DESIGN DISCOVERY (pixel's real differentiator)
================================================================
pixel does NOT need to invent this — it INHERITS energy's design-systems skill, which is already an ICP-first, world-class pipeline. The external "AI ICP" trend (below) confirms the approach; the internal pipeline is the implementation.

### The internal engine pixel inherits (READ-ONLY ref, quoted)
`~/energy/.claude/skills/design-systems/` — **V3 DFS pipeline, 12 steps, discovery brief is a HARD GATE.**
- **Step 1 DISCOVERY BRIEF (gate): "NO BRIEF = NO DESIGN."** Must define the ICP as a **specific named person**, not a demographic — e.g. *"Marcus, 42, portfolio manager at a mid-size hedge fund. Uses Bloomberg Terminal daily. Frustrated by noisy consumer apps."* The brief template (`discovery/brief-template.md`) forces 6 sections: **ICP, Primary Goal, Emotional Tone (3-second feeling test), Audience Problem (in their words), Competitive Context (3 named competitors + what to steal/avoid), Success Metrics (one KPI + target).**
- **Core philosophy (verbatim):** *"What would a highly opinionated designer build to make this ICP resonate deeply with this vision?"* — if you can't answer, you haven't done Step 1.
- **Step 1.5 INFORMATION HIERARCHY MAP (gate):** FIRST/SECOND/THIRD/AMBIENT per section before any CSS.
- **Step 2 Leading Questions** (Socratic): "If I remove all color/imagery, does the typography alone convey the brand?" etc.
- **Step 3 Visual Direction:** present 5, **kill 4**, no blending.
- **Step 4 DFS Hero:** perfect ONE component (the one carrying ~60% of emotional weight) to 100% before scaling — hero chosen by ICP type (enterprise→logo bar, dev→code/terminal, consumer→headline+CTA, investor→metrics, creative→showcase, finance→data table).
- **Steps 5–10:** decision log → 12-level type scale → OKLCH color (ONE brand moment per page) → 4px shape/concentric radius/4-layer shadows → component scaling → page composition (6-beat emotional arc: Recognition→Awe→Trust→Continuity→Conviction→Action).
- **Step 11 — 12-DIMENSION BINARY AUDIT (pass/fail, ship at 10+/12).** No "7/10." Either it meets the bar or the fix is explicit.
- **8 vertical profiles** (fintech/health/creative/devtools/consumer/enterprise/education/ecommerce) tune the brief per domain.
- **Council (6 personas)** for critique (`council/personas.md`, `scoring-rubric.md`).

### What the external "AI ICP 2026" trend adds (confirms the philosophy)
Source: sybill.ai / aurium / marketbetter / cleanlist (2026).
- **Dynamic ICP, not static demographics** — combine firmographic + technographic + **behavioral + intent** signals (content engagement, product usage, hiring patterns). "Based on how people act, not just who they are on paper."
- **Continuous refinement** — "build a continuously-learning ICP that gets sharper every time you win or lose a deal." Test/validate in weeks, not months.
- **Implication for pixel:** the design-systems Step-1 brief should be *fed by data*, not guessed. An agent can enrich the ICP from real signals (analytics, the product's own usage, competitor teardowns) before locking the brief — turning a static persona into a live, evidence-backed one. This is the "domain-expert employee" behavior the flagship is meant to embody.

### THE workflow pixel should encode (synthesis)
1. **Discover** (data-fed): research ICP from real signals → fill the design-systems Step-1 brief (named person + 6 sections). Gate: no brief, no design.
2. **Map**: Step 1.5 info-hierarchy per section.
3. **Generate draft fast**: drive **v0 Platform API** (`v0.chats.create`, model `v0-1.5-md`) or extract a **Figma frame via Dev Mode MCP** for the first-pass shell/components — *as a draft, not the deliverable*.
4. **Refine to taste**: run the draft through the design-systems DFS hero + decision log + OKLCH + warm-black/Instrument-Serif/Poppins house style; kill AI-slop (anti-patterns.md).
5. **Audit (hard gate)**: 12-dimension binary audit (≥10/12) + a11y/CWV (ecosystem-07) + **security review** (the 40-45% vuln rate) before merge.

## PIXEL IMPLICATIONS
- Wire **v0-sdk** (`@v0-sdk/ai-tools`) so a pixel agent can generate mockups programmatically — but mark all generated code "untrusted draft → must pass audits."
- Wire **Figma Dev Mode MCP** for frame→code + token extraction (one-way, initial pass).
- The ICP discovery engine is the design-systems skill — port/keep it; enrich Step-1 with live data signals.
- pixel's moat over raw v0/Lovable = the *taste + audit gates* (DFS, 12-dim binary, anti-slop, security), not the generator.

## SOURCES
- https://github.com/vercel/v0-sdk (494★) — SDK packages + `chats.create` API.
- https://vercel.com/blog/build-your-own-ai-app-builder-with-the-v0-platform-api + /changelog/v0-platform-api-now-in-beta — Platform API lifecycle.
- https://ai-sdk.dev/providers/ai-sdk-providers/vercel — v0-1.5-md / v0-1.5-lg models.
- https://www.nxcode.io/resources/news/v0-vs-bolt-vs-lovable-ai-app-builder-comparison-2025 (2026) — comparison + 40-45% vuln rate.
- https://lovable.dev/guides/best-ai-app-builders ; getmocha/weavai (2026) — full-stack builder framing + pricing.
- https://help.figma.com/.../Claude-Code-and-Figma-Set-up-the-MCP-server + figma.com/blog/introducing-claude-code-to-figma (2026) — Figma Dev Mode MCP + roundtrip caveat.
- sybill.ai / research.aurium.ai/icp-discovery / marketbetter.ai (2026) — AI ICP trend.
- READ-ONLY internal: ~/energy/.claude/skills/design-systems/{SKILL.md, discovery/brief-template.md} (quoted).
