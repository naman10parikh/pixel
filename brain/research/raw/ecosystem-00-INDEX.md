# Ecosystem Research — pixel (Frontend/Web flagship) — INDEX

Researcher: ECOSYSTEM (CP123 Wave-R)
Started: 2026-06-11
Repo: ~/pixel
Scope: June-2026 SOTA for web app shell + design. NOT React Native (pebble owns that).

## Taste baseline (from energy read-only corpus)
- Warm black #141312 (NOT #000/#09090b); Instrument Serif (display) + Poppins (body)
- Bento/asymmetric layouts; serif+sans pairing = #1 anti-AI-slop move
- Animation stack: CSS > Lenis > GSAP ScrollTrigger > Motion > Rive > Three (lowest layer that works)
- Radix Colors 12-step scales; Phosphor + Lucide (weight = hierarchy)
- Timing 200-500ms; animate transform+opacity only; 60fps
- Anti: AI purple/pink gradients, symmetric grids, pure-white-on-dark, placeholder gray boxes
- shadcn/ui base, elevate w/ 21st.dev; React (energy/react.md currently says Next 15 — pixel targets 16)

## Files in this research set (11 files, ~1,044 lines, 72 unique source URLs)
- ecosystem-00-INDEX.md            (this file)
- ecosystem-01-nextjs16.md         Next.js 16.2 (Turbopack default, Cache Components/use cache, DevTools MCP, 5 silent-failure gotchas)
- ecosystem-02-tailwind-v4.md      Tailwind v4.3 (Oxide engine, CSS-first @theme, v4.1/4.2/4.3 deltas, @config escape hatch)
- ecosystem-03-shadcn-radix.md     shadcn CLI v4.11 + unified radix-ui pkg + Base UI watch + Radix colors + Lucide/Phosphor
- ecosystem-04-animation-stack.md  CSS>Lenis>GSAP>Motion>Rive>Three (versions, GSAP free, Lenis rename, autoRaf:false)
- ecosystem-05-rsc-patterns.md     RSC/App Router flows + 19 real high-engagement GitHub bug issues + 5 boundary mistakes
- ecosystem-06-mockup-v0-tools.md  v0/Lovable/Bolt + v0 Platform API/SDK + Figma Dev Mode MCP + ICP discovery (design-systems skill)
- ecosystem-07-quality-cwv-a11y.md impeccable (37.4k★ anti-slop) + CWV 2026 (LCP 2.0s) + WCAG 2.2 + Lighthouse/axe
- ecosystem-08-starter-repos.md    5 best current starters (stars+freshness) + stale-trap blacklist + scaffold-not-fork
- ecosystem-09-agent-operating.md  What an AGENT (not human) needs: MCPs/CLIs/APIs + silent-failure asserts + 6-step loop
- ecosystem-10-tradeoffs-matrix.md 10 honest decision matrices (Turbopack, cacheComponents, Radix/BaseUI, icons, v0, ...)
- ecosystem-99-REPORT.md           Summary, top 10 findings, gaps & disputes, source count
- ecosystem-99-REPORT.md           Summary, top findings, gaps
