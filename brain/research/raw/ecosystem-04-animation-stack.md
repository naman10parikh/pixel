# Animation Stack — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11 · Versions verified against npm.
The energy mandate (design.md + frontend-bible-2026.md): **CSS > Lenis > GSAP ScrollTrigger > Motion > Rive > Three** — "use the lowest layer that solves the problem."

## CURRENT VERSIONS (npm 2026-06-11)
| Tool | Package | Latest | modified |
|---|---|---|---|
| Lenis | `lenis` | **1.3.23** | 2026-04-15 |
| GSAP | `gsap` | **3.15.0** | 2026-04-13 |
| Motion | `motion` | **12.40.0** | 2026-05-21 |
| (alias) | `framer-motion` | 12.40.0 | 2026-06-03 |
| Rive | `@rive-app/react-canvas` | **4.29.0** | 2026-06-05 |
| Three.js | `three` | **0.184.0** (r184) | 2026-04-16 |
Source: `npm view <pkg> version/time` run 2026-06-11.

---

## LAYER 1 — CSS NATIVE (do this first, always)
- **View Transitions API** — Baseline since Oct 2025 (same-document everywhere; cross-document Chrome/Edge/Safari). In Next 16 this is also exposed via **React 19.2 `<ViewTransition>`** (see ecosystem-01). For page/route transitions the energy design rule "Framer Motion for page transitions" should now prefer **native View Transitions** for the simple case (zero JS) and reserve Motion/GSAP for complex orchestration. (frontend-bible-2026.md lines 18, 74; React 19.2.)
- **CSS scroll-driven animations** — `animation-timeline: scroll()` / `view()` run on the compositor thread = no jank, zero JS. Production-ready. Use before reaching for GSAP for simple reveals. (bible line 73.)
- `@starting-style` (Tailwind v4 has utilities) — animate elements on first paint, JS-free (enter animations).
- **GOTCHA (Next 16):** automatic `scroll-behavior: smooth` was REMOVED — add `data-scroll-behavior="smooth"` to `<html>` to opt back in, OR drive it with Lenis. (ecosystem-01.)

## LAYER 2 — LENIS (smooth-scroll foundation, ~3KB)
- **PACKAGE RENAME (critical, April 2026):** `@studio-freight/react-lenis` and `@studio-freight/hamo` were **retired** when **Studio Freight → Darkroom Engineering**. Current: the `lenis` package with **`lenis/react`** imports (`import { ReactLenis, useLenis } from 'lenis/react'`). Any tutorial/snippet using `@studio-freight/*` is stale. (Source: https://github.com/darkroomengineering/lenis ; devdreaming.com 2026 guide.)
- Lerp interpolation; **preserves `position:sticky`, scroll-snap, and IntersectionObserver** (3KB, the reason it beats hand-rolled JS scroll listeners). Lenis 1.3.x supports React 19. Tested against Next 15/16 App Router. (bible line 71; gsap.com forums.)

## LAYER 3 — GSAP ScrollTrigger (scroll triggers, pin, scrub, snap)
- **GSAP IS 100% FREE since April 2025** (Webflow acquisition) — **including ALL former Club plugins: SplitText, MorphSVG, DrawSVG, ScrollSmoother, Flip, ScrollTrigger** — and the standard license now covers commercial use. No paywall. (Sources: https://webflow.com/blog/gsap-becomes-free ; https://gsap.com/pricing/ .) This validates the energy rule "GSAP ScrollTrigger — now FREE."
- **Lenis + GSAP integration — the canonical pattern (and the #1 gotcha):** drive Lenis from GSAP's ticker so there is exactly **ONE rAF loop**. Steps:
  1. `const lenis = new Lenis({ autoRaf: false })` — **`autoRaf: false` is mandatory** (else two rAF loops fight → jitter).
  2. `lenis.on('scroll', ScrollTrigger.update)`
  3. `gsap.ticker.add((time) => lenis.raf(time * 1000))`
  4. `gsap.ticker.lagSmoothing(0)` — disable lag smoothing.
  (Sources: https://gsap.com/community/forums/topic/40426 "Patterns for synchronizing ScrollTrigger and Lenis in React/Next"; ashar-dev "How to Fix Jittery Scroll".)
- **Next.js note:** ScrollTrigger touches the DOM → must run client-side. Use `'use client'` + `useGSAP()` (the `@gsap/react` hook) or `useEffect` with cleanup; register `gsap.registerPlugin(ScrollTrigger)`. The "scrollerProxy" setup is the classic break point when Lenis owns scroll. (gsap.com forums topic 34814.)

## LAYER 4 — MOTION (UI state animation; formerly Framer Motion)
- **Naming:** `motion` and `framer-motion` are **the same package, different entry points**; **`motion` is the current preferred name** (`import { motion } from 'motion/react'`). Both at 12.40.0. (Source: https://motion.dev/docs/react-lazy-motion ; logrocket 2026.)
- **Bundle reality (matters for pixel's perf budget):**
  - Full `motion` component ≈ **34KB** (declarative props API can't tree-shake smaller).
  - **`LazyMotion` + `m` component → ~4.6KB** initial; load feature sets on demand: `domAnimation` (+15KB: animations, variants, exit, tap/hover/focus) or `domMax` (+25KB: + pan/drag + layout animations).
  - **`useAnimate` mini → 2.3KB** — smallest animation primitive for React.
  (Source: https://motion.dev/docs/react-reduce-bundle-size .)
- **Use Motion for:** UI *state* animations, layout animations, exit/enter on mount-unmount, `useScroll` scroll-linked fallback (when CSS scroll-timeline isn't enough). Last tested w/ Motion 12.x + Next 16.x March 2026.
- **Pixel rule:** default to `LazyMotion + m` (not bare `motion`) to stay under budget; reserve the full `motion` import only where you need everything. This is a concrete refinement of energy/design's "Framer Motion for micro-interactions."

## LAYER 5 — RIVE (interactive branded moments; Lottie successor)
- `@rive-app/react-canvas` **4.29.0** (2026-06-05 — actively maintained).
- **Why Rive over Lottie:** **interactive state machines** (idle/hover/pressed/loading/success/error states + transitions on boolean/number/trigger inputs). App code sets input values; animation responds — **no JS animation logic, no keyframes** (Rive scripting = logic-driven interactivity). A single `.riv` holds all states for e.g. a button. (Sources: https://rive.app/blog/rive-as-a-lottie-alternative ; unicornicons 2026.)
- **File size:** `.riv` typically **50–80% smaller** than `.json` Lottie. (dotLottie `.lottie` ZIP-compresses Lottie 40–70%, narrowing but not closing the gap.) Rive has had GPU accel longer; both shipping WebGPU now.
- **Caveat:** Lottie caught up somewhat — dotLottie added state machines late 2025. But for *branded interactive* moments Rive is still the pick. **Pixel rule:** Rive only for deliberate brand moments (a hero mascot, an interactive logo) — not for generic UI motion (that's Motion/CSS).

## LAYER 6 — THREE.JS / R3F (3D, only when justified)
- `three` **r184 (0.184.0)**, 2026-04-16. React Three Fiber wraps it for React/Next teams (reusable components, hot reload).
- **WebGPU is now shippable to all users:** since **r171 (Sept 2025)** `WebGPURenderer` imports with zero config; **Safari 26 added WebGPU** → can ship WebGPU broadly (with WebGL fallback). Faster frame rates, better lighting, lower GPU load. (Sources: https://www.utsubo.com/blog/threejs-2026-what-changed ; https://www.utsubo.com/blog/webgpu-threejs-migration-guide .)
- **Pixel rule:** 3D is the highest-cost layer — only when the brand demands it. R3F + `@react-three/drei` is the agent-friendly path. Lazy-load the whole 3D bundle.

---

## TIMING & PERF RULES (from energy/bible — non-negotiable taste)
- **200–500ms** sweet spot.
- **Animate `transform` + `opacity` ONLY** (GPU-composited). `will-change` sparingly.
- **60fps** target.
- **`prefers-reduced-motion`:** minimize non-essential motion, don't kill all of it.
- **Randomize timing delays** (Stripe lesson — fixed 100ms intervals feel robotic). The CEO of Stripe literally rewrote code to randomize typing delays.
- Fade-up reveals (translateY + opacity) = most effective scroll pattern. Parallax 20–30% layer-speed diff, hero-only, auto-disable on mobile.

## AGENT NOTES (operating the animation stack as a bot)
- There's a community **`motion` Claude skill** (secondsky/claude-skills, jezweb/claude-skills on Tessl/agentskills registries) — structured Motion knowledge for agents. Worth ingesting into pixel's skills.
- No first-party "animation MCP." The agent operates these via code; verify visually with Playwright screenshots (energy bans Playwright *MCP*, allows Playwright *CLI*).
- Stale-source trap: any snippet importing `@studio-freight/react-lenis` is pre-April-2026 — rewrite to `lenis/react`.

## PIXEL IMPLICATIONS / DELTAS vs energy baseline
- bible/design.md say "Next.js 15+"; pixel = 16 → page transitions can use React 19.2 `<ViewTransition>` natively (lower layer than Motion).
- Encode Lenis package = `lenis` + `lenis/react` (NOT `@studio-freight/*`) — this is the single most common stale-tutorial error.
- Encode the 4-step Lenis↔GSAP ticker integration with `autoRaf:false` as the canonical recipe.
- Default Motion usage = `LazyMotion + m` for bundle budget.

## SOURCES
- ~/energy/.claude/skills/design-systems/knowledge/frontend-bible-2026.md (read-only; lines 9–37, 68–89, quoted).
- https://webflow.com/blog/gsap-becomes-free + https://gsap.com/pricing/ — GSAP 100% free incl. all plugins.
- https://github.com/darkroomengineering/lenis + https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap (2026) — package rename, Next integration.
- https://gsap.com/community/forums/topic/40426 + /34814 — Lenis↔ScrollTrigger sync (autoRaf:false, scrollerProxy).
- https://motion.dev/docs/react-reduce-bundle-size + /react-lazy-motion — bundle numbers, motion vs framer-motion.
- https://rive.app/blog/rive-as-a-lottie-alternative + unicornicons (2026) — state machines, .riv size.
- https://www.utsubo.com/blog/threejs-2026-what-changed + webgpu-migration (2026) — WebGPU r171+, Safari 26.
- npm registry run 2026-06-11.
