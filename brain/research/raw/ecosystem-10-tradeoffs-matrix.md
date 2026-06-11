# Competing-Tools Honest Trade-off Matrix — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11.
Every row is a *real* decision pixel faces, with the honest "when X loses." Verdicts are reasoned recommendations for a *Next-16 agent-native flagship*, flagged where they're judgment calls (see GAPS).

================================================================
## DECISION 1 — Bundler: Turbopack vs webpack (Next 16)
================================================================
| | **Turbopack (default)** | webpack (`--webpack`) |
|---|---|---|
| Speed | 2-5× prod, up to 10× Fast Refresh, ~400% faster dev start | baseline |
| Maturity | default since 16, but live bug cluster | battle-tested, 10+ yrs |
| Honest downside | **RAM/CPU heavy in dev (#81161, 88👍)**; **can drop Tailwind/DaisyUI styles (#81763)**; hash-mismatch on some deps (#87737); no `@next/bundle-analyzer` (#77482); standalone build omits `serverExternalPackages` (#88844) | slower; being deprecated as default |
**VERDICT:** **Turbopack** (it's the default and the speed is real) — BUT pixel must *verify Tailwind v4 renders under Turbopack* before declaring green, and keep `--webpack` as the documented escape hatch for the bundle-analyzer / standalone-Docker / low-RAM cases. Not a free win; a default with caveats.

================================================================
## DECISION 2 — Caching: cacheComponents ON vs OFF (Next 16)
================================================================
| | **cacheComponents: true** | leave off (default request-time) |
|---|---|---|
| Model | explicit `use cache`, PPR static-shell + dynamic holes | everything dynamic at request time |
| Perf ceiling | higher (instant nav, cached shells) | lower (no caching) |
| Honest downside | **live bug cluster: breaks Clerk auth without Suspense (#85490), React Portals (#85390), CSP nonce (#89754), `<Activity>` (#86577), router cache on dup search params (#92152)** | leaves perf on the table |
**VERDICT:** **Opt-in per-route, not globally**, mid-2026. Adopt `use cache` deliberately on stable read-heavy routes; wrap ALL dynamic/uncached reads in `<Suspense>` from day one; pin the bug issues. Flipping it on globally and assuming it's free is the trap. Re-evaluate as the cluster resolves.

================================================================
## DECISION 3 — Primitives: Radix vs Base UI (shadcn)
================================================================
| | **Radix (`--base radix`)** | Base UI (`--base base-ui`) |
|---|---|---|
| Status | de-facto default, most-tested shadcn surface | shadcn's intended future; community-led migration (#9562, 34👍, 0 official) |
| `asChild` | yes (composition everywhere) | **REMOVED — global refactor** |
| Positioning | Radix positioner | Floating UI (popover behavior differs) |
| Forms | mature | new `Field` (significant logic changes) |
**VERDICT:** **Radix now** (stability + unified `radix-ui` pkg = clean deps); **Base UI on the watch-list.** The `asChild` removal is the migration tripwire — don't pay it until shadcn makes Base UI the *default style*. Judgment call (flagged).

================================================================
## DECISION 4 — Icons: Lucide vs Phosphor
================================================================
| | **Lucide** | **Phosphor** |
|---|---|---|
| Bundle | ~1× source (tiny) | **16-18× overhead** (6 weights, Next16-Turbopack benchmark) |
| Ecosystem | shadcn default, 16× more popular, active (2026-05) | strict design-system; npm **~13mo stale** |
| Strength | smallest, refined outline | weight = hierarchy (Thin..Fill..Duotone) |
**VERDICT:** **Lucide as the default/base** (bundle + ecosystem); **Phosphor gated to deliberate weight-hierarchy moments** only (not app-wide). Refines energy's "use both" with a bundle reason.

================================================================
## DECISION 5 — UI animation: Motion vs GSAP vs CSS-native
================================================================
| Layer | Use when | Don't use when |
|---|---|---|
| **CSS native** (View Transitions, scroll-timeline, `@starting-style`) | simple page transitions, reveals, enter-on-paint | complex orchestration, scrubbing |
| **Motion** (`LazyMotion`+`m`, 4.6KB) | UI state, layout, exit/enter, gestures | you only need a fade (use CSS); you need scroll-pin (use GSAP) |
| **GSAP ScrollTrigger** (free) | scroll pin/scrub/snap, timelines, SplitText | simple state animation (use Motion/CSS) |
**VERDICT:** **Lowest layer that works** (energy mandate). Default page transitions → React 19.2 `<ViewTransition>` (native). State/layout → `LazyMotion`. Scroll effects → GSAP+Lenis (`autoRaf:false`). Full `motion` import (34KB) only when you need everything. Don't reach for GSAP for a fade or Motion for a scroll-pin.

================================================================
## DECISION 6 — Interactive/branded animation: Rive vs Lottie
================================================================
| | **Rive** | **Lottie / dotLottie** |
|---|---|---|
| Interactivity | **state machines** (no JS keyframes) | none in classic; dotLottie added state machines late-2025 |
| File size | 50-80% smaller (.riv) | dotLottie ZIP cuts 40-70% |
| When it loses | overkill for non-interactive motion (use CSS/Motion) | when you need true input-driven states |
**VERDICT:** **Rive for branded interactive moments** (mascot, interactive logo, multi-state button); **never for generic UI motion.** Lottie only if you have an existing .json pipeline.

================================================================
## DECISION 7 — Mockup generation: v0 vs Lovable vs Bolt vs hand-code
================================================================
| | **v0** | **Lovable** | **Bolt.new** | hand-code (design-systems skill) |
|---|---|---|---|---|
| Output | React/Tailwind/shadcn (aligned!) | full-stack app | in-browser app | exact house taste |
| Backend | none | Supabase built-in | none | n/a |
| Fit for pixel | **best (matches stack, has API/SDK)** | reference only | reference only | the finishing layer |
| Honest downside | UI-only; **40-45% vuln rate** | owns whole stack; vuln rate | token-burn; vuln rate | slow (but pixel automates it) |
**VERDICT:** **v0 Platform API for the first-pass draft** (programmatic, stack-aligned) → **finish with design-systems DFS + house style** → **mandatory security + 12-dim + a11y audit** before merge. Lovable/Bolt = throwaway validation / references, not codebase contributors. pixel's moat = the audit/taste gates, not the generator.

================================================================
## DECISION 8 — Styling config: Tailwind v4 CSS-first vs keep JS config
================================================================
| | **`@theme` CSS-first (v4)** | `@config tailwind.config.js` (escape hatch) |
|---|---|---|
| When | new project, token-driven, agent-edited | function-based theme extends (typography `prose`), custom-screen objects, plugin deps |
| Upside | tokens auto-exposed as CSS vars, no JS | back-compat for un-portable config |
**VERDICT:** **CSS-first `@theme`** for pixel (clean, agent-friendly, tokens-as-CSS-vars feeds the per-agent BRAND story). Accept a pinned `@config` only where a plugin (e.g. `@tailwindcss/typography`) forces it. Update energy's "BRAND.md → theme-tokens.json → tailwind.config.ts" flow → sink is `@theme` now.

================================================================
## DECISION 9 — a11y/quality gate: automated-only vs automated+manual
================================================================
| | **automated (axe/Lighthouse/impeccable)** | **+ manual** |
|---|---|---|
| Coverage | impeccable 41 deterministic rules; **axe ~30-40% of WCAG** | the other 60-70% (keyboard, SR, cognitive) |
**VERDICT:** **Both, gated.** impeccable (exit-code) + axe-playwright (0 violations) + lhci budgets are the *necessary* CI floor; manual keyboard/screen-reader/reduced-motion + 12-dim binary is the *sufficient* taste/a11y layer. Automated-only ships inaccessible UIs that pass CI.

================================================================
## DECISION 10 — Reference repos: fork a starter vs scaffold + mine
================================================================
**VERDICT:** **Scaffold (`shadcn init -t next --base radix`) + mine reference repos** (next-app-router-playground for patterns, ai-chatbot for generative UI, next-forge for monorepo shape, ixartz boilerplate for tooling). **Don't fork** — forking inherits stale deps (precedent/old-t3 are 12-20mo behind) + a generic visual identity. pixel is hand-crafted.

================================================================
## TOP-LEVEL POSTURE (the one-liner)
================================================================
**Track the bleeding edge (Next 16.2 / Tailwind 4.3 / shadcn 4.11 / React 19.2) but be DISCIPLINED about the volatile bits** (cacheComponents per-route + Suspense, Turbopack-Tailwind verification, Radix-not-Base-UI-yet). **Generate fast with v0/Figma-MCP, but the deliverable is gated by taste (design-systems DFS + impeccable) and security.** That gating is pixel's reason to exist over raw v0/Lovable.

## SOURCES
- All claims trace to ecosystem-01..09 in this set (which cite the primary URLs + GitHub issue numbers + npm dates). Key external anchors: nextjs.org/blog/next-16, tailwindcss.com/blog/tailwindcss-v4(-1/-3), ui.shadcn.com/docs/changelog, github.com/pbakaus/impeccable, github.com/vercel/v0-sdk, motion.dev, rive.app, GitHub vercel/next.js issues (#81161/#81763/#85490/#86577 etc.), corewebvitals.io, w3.org/TR/WCAG22. npm registry run 2026-06-11.
