# Field Intelligence Research — pixel (Frontend/Web flagship) — INDEX

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · 2026-06-11 · Repo ~/pixel
Mission: mine what practitioners learned the HARD WAY (June-2026 currency) — postmortems, migration
war stories, explicit taste, live disputes, 2026-invalidates-2025. Distinct from the ECOSYSTEM
research set (`ecosystem-*`, versions/tooling/tradeoffs). This is the *field intelligence* layer:
failures, opinions, "never X — here's why."

> RECONCILED INDEX (CP123 Wave-R synthesis): **two** FIELD-INTELLIGENCE passes ran in parallel and both
> wrote here. To avoid prefix collisions, one pass namespaced its files **`field-craft-NN-*`** (committed
> as untracked alongside this index); the other kept **`field-NN-*`** (committed `9a127ff`, on top of the
> brain seed `23ad8c1`). The two sets are COMPLEMENTARY — same five topic areas (migrations, production
> failures, taste, disputes, 2026-deltas), DIFFERENT primary sources, lightly overlapping. **Read across
> both for full coverage.** This index lists every file with its distinct angle so neither set is lost.
> Both sets are woven into the brain artifacts (OPINIONS/BATTLE-TESTED-SCENARIOS/KNOWN-PITFALLS/
> GAPS-AND-DISPUTES) by the SYNTHESIS pass; this raw corpus is the citation backstop.

## Taste baseline mined (energy read-only corpus)
- design.md / react.md / frontend-bible-2026.md: warm-black #141312, Instrument Serif + Poppins,
  bento/asymmetric, animation stack CSS>Lenis>GSAP>Motion>Rive>Three, 200–500ms, anti-slop list.
- FLAGGED (both passes independently): energy `react.md` prescribes "Purple theme #6b21a8" — which is
  THE #1 slop tell. pixel must override (field-05 §5, field-04 Dispute 3, field-craft-05 §5,
  field-craft-04 Dispute 3, field-craft-01 §3b Wathan apology). Woven as OPINIONS O-F1.

---

## SET A — the `field-craft-*` pass (8 files incl. this index) — MECHANISM + GREPPABLE CRAFT
- **field-craft-01-ai-slop-tells-and-why.md** — Slop tells + MECHANISTIC *why* AI produces them (Argyle
  "Why AI Sucks At Front End", nerdy.dev, high authority); Adam Wathan's `bg-indigo-500` apology (X,
  ~684K views) as the named root cause of AI-purple; YC design-review credibility stakes (Schaad quote);
  925studios (2026-06-10) 9-item tell→fix catalog.
- **field-craft-02-micro-interaction-signals.md** — Rauno Freiberg Web Interface Guidelines verbatim;
  12-point greppable craft checklist (box-shadow focus rings not `outline`, `@media (hover:hover)`, 16px
  input, ≤200ms interaction ceiling, no dead zones in lists, tabular-nums, optical alignment).
- **field-craft-03-migration-war-stories.md** — Tailwind v3→v4 `@apply`/CSS-module SILENT-FAILURE (GitHub
  discussions #16429 etc.); Next App Router→TanStack Start (paperclover, HN 119 pts); shadcn Radix→Base UI
  (asChild gone, Floating UI, forwardRef-on-React-19 trap, cmdk/vaul still Radix).
- **field-craft-04-gaps-and-disputes.md** — 5 live disputes BOTH SIDES verbatim (RSC over-engineering via
  HN #45755911, animation timing, pick-ONE vs maximalism, Tailwind OSS-funding risk, shadcn-copy vs
  MUI-installed) + 3 could-not-confirm gaps (harness slop-mitigation benchmark, Base-UI-at-scale, TanStack
  Start regret story).
- **field-craft-05-explicit-taste-quotes.md** — Emil Kowalski "Great Animations" verbatim (ease-out,
  <300ms, NEVER animate keyboard-initiated actions, spring>duration, interruptible); Rauno robustness-
  over-polish; Stripe randomized timing; Vercel design-engineer "last 10% is the job" role definition.
- **field-craft-06-2026-invalidates-2025.md** — CSS-replaces-JS table w/ browser-support %; INP is THE
  failed CWV (43% fail 200ms); selective hydration is the default; `tailwind.config.js` gone; shadcn
  Radix→Base-UI; OSS funding crack; App Router contested.
- **field-craft-07-production-postmortems.md** — Wix hydration→INP (hundreds of millions of sessions,
  real numbers); context-in-RSC dev-works-prod-breaks (#42301/#35397); App Router stale-cache after
  deploy; AI "it's done" broken-layout loop. Cross-cut thesis: the dangerous failures are SILENT.

## SET B — the `field-*` pass (5 files) — REVENUE/LEGAL STAKES + ATTRIBUTION
- **field-02-migration-war-stories.md** — migrations with TIME-COST + cloud-BILL receipts: Next 15→16 four
  SILENT breaks (SquaredTech 2026-05-28: `middleware.ts`→`proxy.ts`, single-arg `revalidateTag`, `next
  lint` removed, sync `params`); `'use cache'` flip can 2–3x origin traffic (vercel/next.js #85470);
  Tailwind v4 48h-then-downgraded postmortem; Radix→Base UI `asChild` reckoning + migrate-script bug #9547.
- **field-03-production-failures-cwv-a11y.md** — CWV regressions that cost REVENUE (Shopify +17% conv /
  $1.2M / 34× ROI, A/B-validated; Rakuten/Vodafone) + accessibility is LAW (8,667 ADA suits 2025; Fashion
  Nova ~$2.43M settlement) + THE OVERLAY TRAP (accessiBe $1M FTC fine; sued-despite-overlay) + hydration
  prod-only disasters with conversion impact.
- **field-04-explicit-taste-verbatim.md** — attributed taste quotes (Emil Kowalski, Rauno Freiberg,
  Mariana Castilho, Adam Wathan utility-first origin, the Vercel Web Interface Guidelines 100-rule
  MUST/NEVER set machine-consumable). Pairs with field-craft-05.
- **field-05-where-sources-disagree.md** — 4 disputes both-sides (utility-first vs vanilla CSS resurgence;
  spring vs easing — Salaja "To Spring or Not To Spring" with the time-bounded-vs-not distinction; RSC
  fit; maximalism vs restraint resolved by surface). Pairs with field-craft-04.
- **field-06-what-changed-2026-invalidates-2025.md** — 6 deltas (native CSS replaces JS libs; Inter is now
  a SAMENESS TELL; Radix→Base UI; Next caching implicit→explicit; RSC contested; AI builders matured, v0
  full-stack, Figma-as-input-not-workflow). Pairs with field-craft-06.

## How pixel should use this (both sets together)
1. field-craft-01 + craft-05 + field-04 = anti-slop + taste RULES with the *why* and the *attribution*
   (encoded as OPINIONS O-F1..O-F8; the WIG set as a hard lint pass).
2. field-craft-02 = micro-interaction lint checklist (the greppable craft signals).
3. field-craft-03 + craft-07 + field-02 + field-03 = the landmine map + silent-failure asserts + the
   revenue/legal STAKES (encoded as BATTLE-TESTED-SCENARIOS S15..S20 and KNOWN-PITFALLS §10–§12).
4. field-craft-04 + field-05 = OPEN decisions; hold as choices-with-defaults, not dogma (GAPS-AND-DISPUTES
   §11–§14 disputes + §15–§17 could-not-confirm).
5. field-craft-06 + field-06 = "don't encode 2025 defaults" guardrail (folded into the above).
