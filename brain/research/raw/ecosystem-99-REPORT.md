# ECOSYSTEM Research — FINAL REPORT (pixel · Frontend/Web flagship)

Researcher: ECOSYSTEM (CP123 Wave-R) · 2026-06-11 · 11 files, ~1,044 lines, 72 unique sources.
All version numbers verified directly against the npm registry (`npm view`) on 2026-06-11 — ground truth, not blog claims.

## CANONICAL VERSION SNAPSHOT (npm, 2026-06-11)
Next **16.2.9** · React/react-dom **19.2.7** · Tailwind **4.3.0** · shadcn CLI **4.11.0** · @radix-ui/colors **3.0.0** · Lucide **1.17.0** · Phosphor **2.1.10** (stale ~13mo) · Lenis **1.3.23** · GSAP **3.15.0** · Motion/framer-motion **12.40.0** · Rive react-canvas **4.29.0** · three **0.184.0 (r184)** · impeccable **2.3.2** · Lighthouse **13.4.0** · @lhci/cli **0.15.1** · @axe-core/playwright **4.11.3**.
Floors: Node **20.9+**, TS **5.1+**, browsers Chrome/Edge **111+** / Safari **16.4+** / Firefox **111 (Next) vs 128 (Tailwind v4) — disputed**.

## TOP 10 FINDINGS (one line each)
1. **Next 16's danger is SILENT failures, not errors:** `middleware.ts`→`proxy.ts` (Node-only, Edge gone) becomes dead code if you skip the codemod; sync `params`/`cookies()` removed but compiles; `next lint` deleted (green CI ships unlinted); `revalidateTag` needs a 2nd `cacheLife` arg. Agents must grep-assert after upgrading.
2. **Cache Components inverts caching (nothing cached unless `use cache`) and has a LIVE bug cluster** — `cacheComponents:true` breaks Clerk auth (#85490, needs Suspense), React Portals (#85390), CSP nonce (#89754), `<Activity>` (#86577). Adopt per-route + Suspense-wrap, never global.
3. **Turbopack is default + fast (2-5× build) but RAM-heavy (#81161, 88👍) and can DROP Tailwind/DaisyUI styles (#81763)** — verify Tailwind renders under Turbopack before declaring green; `--webpack` is the escape hatch.
4. **Tailwind v4 = CSS-first `@theme` (tokens auto-exposed as CSS vars), no `tailwind.config.js`** — but plugins (typography `prose`), function-extends, or even empty config props pin you back to `@config`. v4.1 added text-shadow+mask, v4.2 muted palettes+webpack plugin, v4.3 scrollbars.
5. **shadcn moved to a single `radix-ui` package (Feb 2026, `migrate radix`) and CLI v4 lets you pick `--base radix` OR `--base base-ui`** — Base UI is shadcn's future but community-led and **removes `asChild`** (global refactor); choose Radix now, watch Base UI.
6. **`impeccable` (37.4k★, pbakaus) is the executable anti-AI-slop gate pixel needs** — a Claude Code skill + CLI with 41 deterministic rules (purple gradients, pure-black, cards-in-cards, rounded-icon-tiles) + exit codes; `npx impeccable skills install`. Highest-value single ingest.
7. **CWV thresholds tightened in 2026: LCP 2.5s→2.0s (March 2026), INP (200ms) fully replaced FID, CLS 0.1.** WCAG **2.2 AA** is the legal baseline (9 new criteria incl. 24px Target Size, Accessible Authentication = no cognitive test to log in); WCAG 3.0 not until ~2029. axe catches only ~30-40% → manual a11y mandatory.
8. **v0 Platform API + `v0-sdk` (`v0.chats.create`, models v0-1.5-md/-lg) is how an agent generates mockups programmatically** — stack-aligned (React/Tailwind/shadcn) — but v0/Lovable/Bolt all ship **40-45% vulnerable code**, so generated output is an untrusted draft that must pass pixel's audit gates.
9. **Animation stack confirmed (CSS>Lenis>GSAP>Motion>Rive>Three): GSAP is 100% free (incl. SplitText/ScrollTrigger), Lenis renamed `@studio-freight/*`→`lenis`/`lenis/react`, the Lenis↔GSAP integration REQUIRES `autoRaf:false` (one rAF loop), Motion = LazyMotion+m (4.6KB) not bare motion (34KB).** React 19.2 `<ViewTransition>` now handles simple page transitions natively (lower layer than Motion).
10. **Don't fork a starter — scaffold (`shadcn init -t next --base radix`) + mine reference repos** (next-app-router-playground, ai-chatbot, next-forge, ixartz boilerplate); the "popular" picks (precedent 5.1k★, old t3 29k★) are 12-20mo stale (pre-async-params/Tailwind-v4). Add Next DevTools MCP + shadcn registry MCP + Figma Dev Mode MCP to pixel's `.mcp.json`.

## 3 THINGS I COULD NOT CONFIRM (for GAPS-AND-DISPUTES)
1. **Tailwind v4 Firefox floor: 111 vs 128.** Tailwind's own upgrade guide states **Firefox 128** (higher than its Chrome 111), but multiple 2026 secondary write-ups quote Firefox 111, and Next 16's floor is 111. I could not reconcile this from primary sources alone — treat **Firefox 128 as the safe Tailwind-v4 floor**, but it's unverified against a single authoritative Tailwind page I could quote cleanly.
2. **The LCP 2.5s→2.0s tightening (March 2026 Google core update).** Reported consistently across several 2026 SEO sources (corewebvitals.io, digitalapplied, rivuletiq), but I could NOT pin it to a single primary Google/web.dev doc URL on 2026-06-11 — web.dev's threshold-definition article still frames 2.5s. Recommend targeting 2.0s (safe) but flag that the official Google primary source for the change wasn't located.
3. **Exact current v0 model id/tier and whether a v0 MCP exists.** The AI-SDK Vercel provider docs name `v0-1.5-md`/`v0-1.5-lg`, but the `v0-sdk` readme itself does not list models, and I found **no official v0 MCP server** as of 2026-06-11 (only the SDK). The precise current model version string and any `-sm` tier / future MCP are unconfirmed. (Secondary judgment calls also flagged in-file: Radix-vs-Base-UI verdict and cacheComponents-per-route posture are reasoned recommendations, not vendor-stated defaults.)

## FILES WRITTEN (paths + line counts)
- ~/pixel/brain/research/raw/ecosystem-00-INDEX.md (~40)
- ~/pixel/brain/research/raw/ecosystem-01-nextjs16.md (169)
- ~/pixel/brain/research/raw/ecosystem-02-tailwind-v4.md (135)
- ~/pixel/brain/research/raw/ecosystem-03-shadcn-radix.md (109)
- ~/pixel/brain/research/raw/ecosystem-04-animation-stack.md (89)
- ~/pixel/brain/research/raw/ecosystem-05-rsc-patterns.md (73)
- ~/pixel/brain/research/raw/ecosystem-06-mockup-v0-tools.md (96)
- ~/pixel/brain/research/raw/ecosystem-07-quality-cwv-a11y.md (115)
- ~/pixel/brain/research/raw/ecosystem-08-starter-repos.md (47)
- ~/pixel/brain/research/raw/ecosystem-09-agent-operating.md (77)
- ~/pixel/brain/research/raw/ecosystem-10-tradeoffs-matrix.md (106)
- ~/pixel/brain/research/raw/ecosystem-99-REPORT.md (this file)

## HOW THIS UPDATES THE ENERGY BASELINE (deltas pixel must encode)
- energy/react.md says "Next.js 15 App Router" → pixel = **16.2** (async params, proxy.ts, cacheComponents, Node 20.9+).
- energy/design.md "BRAND.md → theme-tokens.json → tailwind.config.ts" → sink is now **`@theme` in CSS** (auto CSS vars).
- energy "Framer Motion for page transitions" → prefer **React 19.2 `<ViewTransition>`** for simple cases.
- Lenis import = **`lenis`/`lenis/react`** (NOT `@studio-freight/*`).
- Add **impeccable** as the executable form of energy's anti-slop anti-patterns.
- frontend-bible-2026.md taste baseline (warm-black #141312, Instrument Serif + Poppins, bento/asymmetric, OKLCH, Radix 12-step) is CONFIRMED current and load-bearing — keep it.

SOURCE COUNT: 72 unique URLs cited across the 11 files (primary docs, official changelogs, 19 GitHub issues with reaction/comment counts, maintainer threads, npm registry) + 4 read-only internal energy references quoted (design.md, react.md, frontend-bible-2026.md, design-systems SKILL.md + brief-template.md).
