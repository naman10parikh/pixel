---
name: pixel-animate
description: pixel's animation discipline. Use for any motion / scroll / transition work. Encodes the lowest-layer ladder (O6/O-F5), the Lenis+GSAP one-rAF recipe (autoRaf:false, S5), LazyMotion+m to avoid the 34KB bare-motion import (O5), frequency-gated sub-300ms ease-out (O-F2/O-F3), and interruptibility (O-F4).
trigger: any motion / scroll / transition / hover / micro-interaction work; "add an animation"; scroll-pin or scrub or parallax; a page transition; Lenis + GSAP integration; choosing easing vs spring
allowed-tools: Bash, Read, Grep
---

# pixel-animate — lowest-layer ladder + the one-rAF recipe (O5/O6/O-F2..F5/S5)

> **Stance:** the slop tells in motion are animating the WRONG actions, two-rAF jitter, and a 34KB bare-`motion` import. Great motion is the boring core being bulletproof BEFORE any flourish (O-F4). Reach for the LOWEST layer that does the job.

## trigger
- ANY motion / scroll / transition / hover / micro-interaction
- a scroll-pin / scrub / snap / parallax (the Lenis+GSAP territory)
- a page transition
- choosing easing vs spring
- a `framer-motion`/`@floating-ui`/`aos`/GSAP dep about to be added

## The stances this encodes (named)

**The ladder — ALWAYS the lowest layer that works (O6, sharpened by O-F5):**
`CSS native → Lenis → GSAP → Motion → Rive → Three`. NEVER GSAP for a fade or Motion for a scroll-pin.
- simple page transition → React 19.2 `<ViewTransition>` (native, zero JS)
- state/layout → `LazyMotion` + `m`
- scroll pin/scrub/snap → **GSAP + Lenis (`autoRaf: false`)**
- branded interactive moment → Rive · 3D only when the brand demands it
- **O-F5:** in 2026 native CSS reaches higher — `:has()` 93%+, container queries 95%+, scroll-driven animations 85%, View Transitions 83%, `sibling-index()` stagger. The 2025 reflex `npm i framer-motion/floating-ui/aos` is now the SLOP default; each has a native replacement for the common case. (Gate Anchor Positioning + View Transitions behind a Safari fallback; `:has`/container queries are safe unguarded.)

**The bundle stance (O5):** ALWAYS `LazyMotion` + `m` (~4.6KB); NEVER bare `motion` (~34KB, can't tree-shake) unless you need everything. `useAnimate` mini = 2.3KB for the smallest case.

**The one-rAF recipe (S5 / §4.2) — the single most common stale-tutorial bug:**
- `@studio-freight/react-lenis` + `@studio-freight/hamo` are **RETIRED (April 2026)** → use `lenis` + `lenis/react`.
- Two rAF loops → jitter. **`new Lenis({ autoRaf: false })` is MANDATORY when integrating GSAP**, then drive Lenis from ONE loop via `gsap.ticker.add((t) => lenis.raf(t * 1000))` and set `gsap.ticker.lagSmoothing(0)`.
- GSAP ScrollTrigger touches the DOM → `'use client'` + `useGSAP()` (from `@gsap/react`) + `gsap.registerPlugin(ScrollTrigger)` + cleanup (§4.4).

**The timing/easing stance (O15 sharpened by O-F2/O-F3/O-F4):**
- **O-F2 — frequency-gate motion: NEVER animate keyboard-initiated / repeated actions** ("animate the novel, never the hundreds-of-times-a-day action" — Emil Kowalski + Rauno Freiberg, the highest-confidence rule in the set). An animation on a repeated action makes it feel slow.
- **O-F3 — `ease-out`, sub-300ms** for entrances/feedback; reach for SPRINGS only when motion is attached to continuous input (drag/flick/gesture); NEVER `linear`/`ease-in` on UI, NEVER spring everything. The danger is a sluggish 350ms button splitting the difference. (page/hero transitions = 200–500ms; direct-manipulation feedback ≤300ms.)
- **O-F4 — animations must be interruptible**; the boring core (scroll, text input, navigation) is bulletproof BEFORE any hero flourish.
- transform + opacity ONLY (GPU-composited); randomize delays (fixed identical intervals feel robotic — the Stripe-CEO rule); respect `prefers-reduced-motion` by minimizing non-essential motion, not killing all of it; 60fps.

## steps
1. **Pick the layer** from the ladder — start at CSS/native, climb only if it can't express the motion.
2. **If Motion:** `LazyMotion` + `m`, load `domAnimation`/`domMax` on demand. Never bare `motion`.
3. **If Lenis+GSAP:** `lenis`/`lenis/react`, `autoRaf: false`, single `gsap.ticker` loop, `'use client'` + `useGSAP` + cleanup.
4. **Gate the action:** is this a frequent/keyboard action? If yes → no animation. Novel action → `ease-out` ≤300ms; continuous input → spring.
5. **Verify visually** — screenshot + assert 60fps, no jitter, `prefers-reduced-motion` honored.

## output
- The layer chosen + why it's the lowest that works.
- For Lenis+GSAP: the `autoRaf: false` + single-ticker recipe in place.
- The timing decision (ease-out ≤300ms vs spring) + the frequency-gate verdict.

## verify
source has `autoRaf: false` + a single `gsap.ticker.add` driving `lenis.raf` AND no `@studio-freight/` import AND no bare `import { motion }` where `LazyMotion`+`m` would do.

## sources
brain/OPINIONS.md O5, O6, O15, O-F2, O-F3, O-F4, O-F5 · brain/KNOWN-PITFALLS.md §4.1–§4.5, §12.2 · BATTLE-TESTED S5.
