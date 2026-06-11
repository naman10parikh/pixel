# shadcn/ui + Radix + Icons — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11 · Versions verified against npm.

## CURRENT VERSIONS (npm 2026-06-11)
- `shadcn` (CLI) **4.11.0** (modified 2026-06-08) — note: very fast cadence, 4.0→4.11 in ~3 months.
- `@radix-ui/colors` **3.0.0** (2025-12-24); `@radix-ui/themes` **3.3.0** (2026-01-31).
- `lucide-react` **1.17.0** (2026-05-28) — note Lucide hit 1.0 (stable).
- `@phosphor-icons/react` **2.1.10** (2025-05-22 — has NOT been updated in ~13 months; flag staleness).
Source: `npm view <pkg> version/time` run 2026-06-11.

### shadcn CLI v4 release cadence (npm `time`)
4.0.0 → 2026-03-06, 4.1.0 → 2026-03-19, … 4.10.0 → 2026-06-01, 4.11.0 → 2026-06-08. Roughly weekly minors.

---

## shadcn IS NOT A DEPENDENCY — it's a code-gen CLI (still true, more so)
shadcn copies component source into your repo; you own it. The CLI is the surface that matters for an agent. Big 2026 changes below.

## shadcn CLI v4 (March 2026) — the commands an agent needs
Source: https://ui.shadcn.com/docs/changelog/2026-03-cli-v4 (fetched 2026-06-11).

| Command / flag | What it does |
|---|---|
| `shadcn init -t next --monorepo` | Scaffold from template: **next, vite, laravel, react-router, astro, tanstack-start** (+ optional monorepo). |
| `shadcn init --base radix` / `--base base-ui` | **Choose the primitive library** — Radix UI OR Base UI — at init. |
| `shadcn init --preset <id>` | Start from a saved design-system preset. |
| `shadcn add button --dry-run` | Preview file changes, no write. |
| `shadcn add button --diff` | Show diff vs current. |
| `shadcn add button --view` | Inspect the registry item before install. |
| `shadcn info` | Framework, version, CSS vars, installed components (agent introspection). |
| `shadcn docs [component]` | Pull docs/API for a component (agent can self-serve API refs). |
| `shadcn build` | Resolve included registries → flattened `registry.json` (for publishing your own registry). |
| `shadcn migrate radix` | One-command migrate to unified `radix-ui` package (see below). |

New registry item types: **`registry:base`** (ship a whole design system — components + deps + CSS vars + fonts + config — as ONE install) and **`registry:font`** (fonts as first-class registry items). This is the mechanism pixel could use to publish the Energy design system (warm-black + Poppins/Instrument-Serif + tokens) as a single `registry:base` payload an agent installs with one command. (Source: CLI v4 changelog; designzig registries guide.)

### Registry MCP server (agent-critical)
shadcn ships an **MCP server** that "works out of the box with any shadcn-compatible registry" — no special setup. It requests the registry index + a root `registry` item. An agent can search/list/add components from any registry (official + 3rd-party + GitHub) over MCP. Docs: https://ui.shadcn.com/docs/registry/mcp. → This is how a pixel agent discovers and installs components programmatically (see ecosystem-08).
- **June 2026:** add directly from **GitHub** registries via the `shadcn` CLI; plus `shadcn eject` and a "Rhea" style appeared (per changelog index). Namespaced registries use an `@namespace/item` syntax. (Source: https://ui.shadcn.com/docs/changelog — fetched 2026-06-11.)

---

## UNIFIED `radix-ui` PACKAGE (Feb 2026) — import shift
Source: https://ui.shadcn.com/docs/changelog/2026-02-radix-ui.
- `new-york` components now import from a **single `radix-ui`** package, not dozens of `@radix-ui/react-*`.
- **Import change:**
  - Before: `import * as DialogPrimitive from "@radix-ui/react-dialog"`
  - After: `import { Dialog as DialogPrimitive } from "radix-ui"`
- One-command migrate: `pnpm dlx shadcn@latest migrate radix` (rewrites imports + adds `radix-ui` dep; for non-default dirs: `... migrate radix src/components/custom`). Then remove unused `@radix-ui/react-*`.
- Marketed as **"no breaking changes"** (shadcn on X, post 1932819652524355998, 2026-06). Caveat: every UI file is rewritten — review the diff.
- Real-world bug: Issue **#9547** "After migration to new radix style, components are still added as old" — CLI added old-style imports even after switching style; a known friction point. (https://github.com/shadcn-ui/ui/issues/9547.)

---

## THE BIG OPEN DECISION: Radix vs Base UI (pixel must choose)
Discussion **#9562** "Migrating from Radix UI to Base UI" (community guide by @yluiop123, Feb 5 2026; **34 👍, 0 official comments** — community momentum, NOT yet an official default). Also Discussion **#6248** "migrate Radix to new Base UI".

**Why Base UI matters:** it's the successor primitive lib from (overlapping) Radix/Floating-UI/MUI authors. shadcn CLI v4 already supports it via `--base base-ui`, signaling it's the intended future direction.

**What BREAKS going Radix → Base UI (real, consumer-facing):**
- **`asChild` is REMOVED** — Base UI renders differently; any `asChild` composition needs a global refactor. (This is the single biggest blast-radius change — `asChild` is everywhere in shadcn code.)
- Stricter typing: Checkbox `checked` must be boolean; ToggleGroup `value` must be an array.
- New form system: Radix-era `Form` → Base UI **`Field`** (significant logic changes).
- Positioning: Base UI uses **Floating UI** (not Radix's positioner) → popover/tooltip behavior differs.
- Some components (Resizable) "may trigger errors in certain scenarios," need patches.

**RECOMMENDATION FOR PIXEL (new project, mid-2026):** Default to **Radix** (`--base radix`) for stability — it's still the de-facto default, has the most-tested shadcn surface, and the unified `radix-ui` package gives a clean `package.json`. Treat **Base UI as a watch-item**: it is where shadcn is heading, but as of June 2026 it is opt-in/community-led with a real `asChild` migration cost. Re-evaluate when shadcn makes Base UI the *default* style. (Synthesis from #9562/#6248 + CLI v4 changelog. This is a judgment call — flagged in GAPS.)

---

## RADIX COLORS (12-step scales) — taste-load-bearing
energy/design.md mandates "Radix Colors 12-step scales — each step has a specific purpose (bg → interactive → borders → solids → text)." Still the canonical accessible scale system; `@radix-ui/colors` 3.0.0 (2025-12-24). The 12-step semantic mapping (1-2 app bg, 3-5 component bg/hover/active, 6-8 borders, 9-10 solid, 11-12 text) is exactly what pairs with Tailwind v4 `@theme` tokens — define each step as `--color-<name>-1..12` and Tailwind exposes them. Radix also ships P3 wide-gamut variants which line up with v4's oklch palette.

---

## ICONS: Lucide vs Phosphor — pixel uses BOTH (energy mandate) but defaults Lucide
energy/design.md: "Phosphor icons alongside Lucide — 6 weight variants enable hierarchy through icon weight."

| | **Lucide** (`lucide-react` 1.17.0) | **Phosphor** (`@phosphor-icons/react` 2.1.10) |
|---|---|---|
| Style | Single refined outline, ~1,500 icons | 6 weights (Thin/Light/Regular/Bold/Fill/Duotone), hand-drawn; ~1,200 base, 7,700+ across weights |
| Weight | `strokeWidth` mathematical | weights hand-drawn (optical perfection at heavy) |
| Bundle | ~1 path/icon; Delta/Source ratio ~**1.0–1.2×** (footprint ≈ source gzip) | bundles all 6 weights' paths; Delta/Source **16–18×** overhead from multi-weight component logic, even with tree-shaking |
| Ecosystem | **Default for shadcn** (`shadcn add button` uses Lucide); ~16× more popular | strict design-system pick |
| Last npm publish | 2026-05-28 (active) | 2025-05-22 (**~13 months stale** — flag) |

**Real benchmark:** "The Hidden Bundle Cost of React Icons: A Next.js 16 Turbopack Benchmark" (medium.nkcroft.com, 2026) — on Next 16 + Turbopack, Phosphor's per-icon footprint carries 16–18× overhead vs Lucide's ~1×. **Implication:** use **Lucide as the default/base** (matches shadcn, smallest bundle), reserve **Phosphor for deliberate weight-hierarchy moments** (e.g. a hero where Fill vs Thin conveys state) — don't ship Phosphor app-wide. This refines the energy "use both" rule with a bundle-cost reason.
Sources: https://www.pkgpulse.com/guides/lucide-vs-heroicons-vs-phosphor-react-icon-libraries-2026 ; https://allsvgicons.com/compare/phosphor-vs-lucide/ ; https://medium.nkcroft.com/the-hidden-bundle-cost-of-react-icons-why-lucide-wins-in-2026-1ddb74c1a86c (2026).

---

## PIXEL IMPLICATIONS
- Encode `shadcn init --base radix -t next` as the scaffold; wire the **shadcn registry MCP** so a pixel agent can `add`/`search`/`view` components autonomously.
- Migrate to unified `radix-ui` import style from day one (`migrate radix` if scaffolding produces old style).
- Default **Lucide**; gate Phosphor to weight-hierarchy use only (bundle reason).
- Publish the Energy design system as a `registry:base` so any Energy agent installs tokens+fonts+components in one command.
- Keep Base UI on the watch-list; the `asChild` removal is the migration tripwire.

## SOURCES
- https://ui.shadcn.com/docs/changelog/2026-03-cli-v4 — CLI v4 commands/flags.
- https://ui.shadcn.com/docs/changelog/2026-02-radix-ui — unified radix-ui package + migrate command.
- https://ui.shadcn.com/docs/registry/mcp — registry MCP server.
- https://ui.shadcn.com/docs/changelog — June 2026 (GitHub registries, eject, Rhea).
- https://github.com/shadcn-ui/ui/discussions/9562 + /6248 — Base UI migration (asChild removal, 34👍).
- https://github.com/shadcn-ui/ui/issues/9547 — radix-migration "still old imports" bug.
- https://x.com/shadcn/status/1932819652524355998 — "no breaking changes" mono-package claim (2026-06).
- pkgpulse / allsvgicons / medium.nkcroft (2026) — icon comparison + Next16-Turbopack bundle benchmark.
- npm registry run 2026-06-11.
