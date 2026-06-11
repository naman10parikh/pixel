# Field Intel 06 — What Changed in 2026 That Invalidates 2025 Conventional Wisdom

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · 2026-06-11 · ~/pixel
Scope: Where 2025 advice is now WRONG or obsolete. pixel must not encode last year's defaults. Each
item: the old wisdom → the 2026 reality → what pixel should do. Browser-support % cited where known.

---

## 1. "Reach for a JS library" is now OFTEN WRONG — native CSS replaced whole categories

Source: "The State of CSS in 2026", codercops.com, **2026-02-21**; corroborated by LogRocket
(blog.logrocket.com/container-queries-2026), DEV, CSS CodeLab (all 2026). Concrete before/after with
browser support:

| 2025 wisdom (install a lib) | 2026 reality (native CSS) | Browser support |
|---|---|---|
| Media queries + 23 component prop-variants | **Container queries** — component styles by container size | 95%+ |
| 300+ lines of JS toggling parent classes | **`:has()`** — "disable submit when any required field empty" in pure CSS | 93%+ |
| AOS / ScrollReveal / Locomotive (45KB JS + 200 lines config) | **Scroll-driven animations** (`animation-timeline: scroll()/view()`) | 85% |
| Framer Motion / GSAP for *basic page transitions* | **View Transitions API** | 83% |
| Popper.js / Floating UI / Tippy for tooltips/dropdowns | **CSS Anchor Positioning** (auto-reposition on overflow) | 78% |
| 900-line manual `--blue-100..900` color scales | **`oklch()` + `color-mix()`** → ~80 lines | 92% |
| Sass just for nesting | **Native CSS nesting** | 92% |
| JS height-equalization across cards | **Subgrid** | 93% |

**Reported aggregate gains (one design system, codercops):** 50–100KB JS removed per project, TTI
−0.8s on one e-commerce client, CSS −38% (84KB→52KB on a 47-component system).

**PIXEL TAKEAWAY — the new escalation ladder (extends energy's "lowest layer that works"):**
1. Native CSS FIRST (`:has`, container queries, scroll-driven, `color-mix`, subgrid, View Transitions,
   anchor positioning, `text-wrap: balance/pretty`).
2. Lenis only for *smooth-scroll feel* (not for triggering — scroll-driven CSS does triggers now).
3. GSAP/Motion only for *complex orchestration* CSS can't express (pinning, scrubbed timelines,
   layout/shared-element beyond View Transitions).
**The 2025 reflex "npm i framer-motion / floating-ui / aos" is now the SLOP default.** Each has a
native replacement for the common case. CAVEAT: anchor positioning (78%) and View Transitions (83%)
need fallbacks for the long tail; `:has`/container queries (93–95%) are safe to use unguarded.

## 2. INP (not FID) is the responsiveness Core Web Vital — and most sites FAIL it

Source: web.dev/articles/inp; digitalapplied.com "Core Web Vitals 2026"; corewebvitals.io.
- INP **replaced FID** as a Core Web Vital (March 2024) — but in 2026, **43% of sites still FAIL the
  200ms threshold**, making INP *the most commonly failed CWV in 2026*.
- INP = input delay + processing time + presentation delay. It measures *every* interaction's worst
  latency, not just the first. → heavy hydration / long main-thread tasks tank it.
- **2025 wisdom obsolete:** "optimize FID" / "TTI is the interactivity metric." 2026: optimize INP,
  which is far harder — it's about main-thread work on EVERY interaction.
- LCP target also tightened in 2026 guidance toward ~2.0s (energy ecosystem-07 notes this).

**PIXEL TAKEAWAY:** pixel's quality gate must measure INP (web-vitals lib, field data), not just
Lighthouse lab scores. Budget main-thread work; avoid hydrating everything (see §3). A green
Lighthouse with red field-INP is the trap.

## 3. "Hydrate the whole page" is dead — selective/partial hydration is the 2026 default

See field-craft-07 (Wix postmortem) for the production proof. Old: SSR then hydrate everything on load.
2026: hydrate on viewport-entry / interaction. React 19's `use()` API officially supports the
pattern that was an undocumented "throw a promise in Suspense" hack in React 18.

## 4. Tailwind `tailwind.config.js` is gone (v4) — and `@apply` is discouraged

(Full story in field-craft-03.) 2025 muscle memory — edit `tailwind.config.js`, lean on `@apply` for
component classes — is now actively wrong. v4 = CSS-first `@theme`; maintainer says avoid `@apply`.
pixel: never scaffold a `tailwind.config.js` for greenfield v4 work unless using the `@config` escape
hatch for a plugin that needs it.

## 5. shadcn is no longer "Radix-only" — Base UI is a first-class choice (Dec 2025+)

(field-craft-03.) The 2025 statement "shadcn = Radix primitives" is now incomplete. `npx shadcn create`
offers Radix OR Base UI. Doesn't change the *default* (Radix still safest mid-2026) but the framing
changed — pick a primitive explicitly at create time.

## 6. The OSS-funding model that made these tools cheap is cracking

(field-craft-04 Dispute 4.) 2025 assumption: popular OSS = healthy/sustained. 2026: Tailwind Labs cut 75%
of engineering despite record adoption because AI in-editor answers killed the docs→paid-product
funnel (Wathan: revenue −80% while usage grew). Not a "tool will die" claim, but the maintenance-
velocity and paid-tier assumptions of 2025 no longer hold. Re-check quarterly.

## 7. Next.js: App Router is stable, but the 2025 "always use App Router / RSC" is contested
(field-craft-04 Dispute 1.) In 2025 App Router was "the future, adopt it." In 2026 it's stable but
production teams cite the multi-layer caching model as the #1 footgun (stale data after deploy), and
credible engineers ship App-Router-OFF (TanStack Start) for client-heavy apps. The nuance: match
rendering model to surface; "App Router everywhere" is no longer unquestioned.

## Sources (this file)
- https://www.codercops.com/blog/state-of-css-2026 — 2026-02-21 (CSS-replaces-JS table)
- https://blog.logrocket.com/container-queries-2026/ — 2026 (container queries "not a silver bullet")
- https://web.dev/articles/inp ; https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide — 2026 (INP failure rate)
- https://www.wix.engineering/post/40-faster-interaction-... — 2025-11-09 (hydration → see field-craft-07)
- byteiota.com/tailwind-css-layoffs-... — 2026-05-17 (OSS funding)
