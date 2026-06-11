# Field Intel 03 — Migration War Stories (What Actually Broke)

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · 2026-06-11 · ~/pixel
Scope: Real provider/version migrations and what broke. Version-specific gotchas, regret threads,
maintainer responses. These are the landmines pixel must route around. Primary sources = GitHub
discussions, HN threads, war-story blogs (NOT vendor migration guides).

---

## WAR STORY A — Tailwind v3 → v4: the `@apply` / CSS-modules breakage

**Sources:** github.com/tailwindlabs/tailwindcss discussions #16429, #16346, #16517, #16758, #18711,
#16349 (all Feb 2025, still the canonical pain thread referenced in 2026 migrations).

**What broke (root cause, per Adam Wathan in #16429):** v4 moved config from `tailwind.config.js`
into the CSS itself (`@theme`). This broke the assumption that a global config is available to every
stylesheet. VERBATIM (Wathan): *"If these files are conceptually processed independently … you'll get
an error when compiling because the theme variable does not exist."*

**Symptoms engineers hit:**
- `@apply` in a CSS module / component-scoped CSS = error `"Cannot apply unknown utility class:
  tw-transform"` or silently does nothing.
- VERBATIM (Rails dev): *"All `@apply` directives in my stylesheets are silently ignored … they just
  don't do anything."* ← SILENT FAILURE — the worst kind; no error, just unstyled output.
- Default border color changed `gray-200` → `currentColor`; `ring` changed from 3px blue →
  1px currentColor. Borders/rings visually broke across whole apps.
- Legacy aliases removed: `bg-gradient-to-r`, `flex-shrink-0`, `overflow-ellipsis` — gone.
- Custom prefix syntax changed `tw-bg-slate-100` → `tw:bg-slate-100`.

**The official workaround (`@reference`) and its cost:**
```css
/* component.css */
@reference "./app.css";   /* must re-declare theme context per file */
.foo { @apply bg-potato; }
```
VERBATIM frustration (5+ year user, #18711): had to *"add `@reference` to hundreds of files and
rewrite every single line where `@apply` was used with responsive modifiers"*; spent *"over three
hours"*; *"any migration attempt has been problematic."* Developers report `@reference` causes
**build performance degradation**.

**Maintainer's actual position:** Wathan advises *avoiding `@apply` entirely* — use Tailwind classes
directly in markup. So the "fix" is partly "stop doing the thing you did in v3."

**PIXEL TAKEAWAY:**
1. Greenfield pixel projects → Tailwind v4 from day 1, **never use `@apply`** (no migration debt,
   matches maintainer guidance). Compose with classes-in-markup or `cva`/`tv` variants.
2. If a component truly needs `@apply`, keep it in the SAME file that does `@import "tailwindcss"`,
   never in a separate module without `@reference`.
3. Assert on the silent-failure mode: a CSS file with `@apply` but no `@import`/`@reference` is a
   bug pixel's lint should catch.

## WAR STORY B — Next.js App Router → moving OFF it (TanStack Start)

**Primary:** Clover Caruso, "One Year with Next.js App Router – Why We're Moving On",
paperclover.net/blog/webdev/one-year-next-app-router, **2025-10-21** (HN 119 pts, id 45755911).

**Specific production pains (verbatim/near-verbatim):**
1. **Optimistic-update impossibility:** *"Components rendered by the React Server, by design, can not
   be modified after mounting."* → state must live in client components → *"nearly every page becomes
   entirely `\"use client\"`"* — defeating the RSC premise.
2. **Redundant fetch on every nav:** *"a navigation to a new page has to fetch the Next.js server,
   regardless of what data the client already has available!"* Even revisiting cached pages re-fetches.
3. **RSC payload doubling:** content ships twice — HTML for paint + serialized RSC JSON. *"This
   solution doubles the size of the initial HTML payload … a much less efficient format than HTML."*
4. **Turbopack DX:** unhelpful errors, mangled variable names, dev-server hangs; an async-client-
   component error showed *only a server stack trace without location info*.
5. **Per-layout refetch:** *"any data fetching has to be re-done per layout … you must rely on their
   monkey-patched `fetch` to cache."*

**Migrated TO:** TanStack Start + Vite. Reported outcome: faster dev, faster prod loads, better soft
navigation, lower infra cost, and *"got easier to understand for all engineers"* by dropping RSC
complexity.

**2026 corroboration (the complexity, not instability, is the problem):** by 2026 the App Router is
*stable* but teams "struggle with caching behavior" because Next stacked multiple caching layers that
interact differently by fetch/render/nav mode. Named real failure: e-commerce teams migrate product
pages, then *"discover stale inventory data because route caching persisted longer than expected."*
(dev.to / meisteritsystems 2026 round-ups.) Smart 2026 migrations are **incremental** — keep
auth/legacy in Pages Router, move new surfaces to App Router.

**PIXEL TAKEAWAY:** App Router is the energy-bible default and remains viable, but the *caching model
is the #1 production footgun*. If pixel ships App Router: (a) make caching decisions explicit per
route (`fetch` cache opts / `revalidate` / Next 16 `use cache`), (b) treat "stale data after deploy"
as an expected class of bug to test for, (c) know the escape hatch (TanStack Start + Vite) exists for
highly-dynamic, client-state-heavy apps where RSC fights you. See field-craft-04 for the full dispute.

## WAR STORY C — shadcn/ui: Radix → Base UI (the in-progress 2026 migration)

**Sources:** shadcn-ui/ui discussion #9562 (2026-02-05), ui.shadcn.com/docs/changelog/2026-01-base-ui,
shadcnstudio.com Base UI guide, shadcn-ui/ui issues #7926 (forwardRef) and #9191 (cmdk/vaul).

**Context:** Dec 2025 shadcn added a *choice* of Radix OR Base UI; Jan 2026 shipped full Base UI docs.
`npx shadcn@latest create` lets you pick the primitive lib. So this is an *opt-in* migration, not a
forced break — but it's non-trivial.

**Breaking deltas (verbatim from #9562 / guide):**
- **`asChild` is gone.** *"Base UI handles component rendering differently; you must globally remove
  the `asChild` keyword from your components."* Base UI uses a `render` prop instead. This touches
  almost every composed component.
- **Positioning engine swap:** Radix's positioning → **Floating UI**. Must grep the project for
  `radix` selectors in custom CSS and refactor positioning.
- **Stricter types:** Checkbox `checked` now strictly `boolean` (+ new `indeterminate`); ToggleGroup
  `value` now strictly an array (+ explicit `multiple`).
- **Form redesign:** Base UI pushes deprecating the existing Form for its `Field` component =
  *"significant logic changes."*
- **Still-Radix deps:** `cmdk` (command palette) and `vaul` (drawer) still use Radix even under the
  Base UI setup (#9191) → you end up with BOTH primitive libs in the tree until those port.

**forwardRef landmine (#7926):** a shadcn change removing `forwardRef` (banking on React 19 auto-ref-
forwarding) *works in React 19 but breaks in Storybook / non-React-19 environments*. ← VERSION-COUPLED
GOTCHA: shadcn components increasingly assume React 19; older toolchains silently break ref passing.

**Official guidance:** *do NOT big-bang*; migrate component-by-component, atomic → composite. Most
teams should **stay on Radix** unless they specifically need Base UI features.

**PIXEL TAKEAWAY:** Greenfield → pick ONE primitive at `create` time and don't mix. Radix is the safe
default in mid-2026 (more mature, cmdk/vaul still need it). Base UI only if you want Floating-UI
positioning / its Field model and can live without `asChild`. Either way, pixel targets React 19 so
the forwardRef trap is moot — but document the assumption.

## Sources (this file)
- github.com/tailwindlabs/tailwindcss discussions #16429 #16346 #16517 #18711 #16349 — Feb 2025
- paperclover.net/blog/webdev/one-year-next-app-router — Clover Caruso, 2025-10-21
- news.ycombinator.com/item?id=45755911 — HN thread, 119 pts (Oct 2025)
- github.com/shadcn-ui/ui discussion #9562 — 2026-02-05; issues #7926, #9191
- ui.shadcn.com/docs/changelog/2026-01-base-ui — Jan 2026
