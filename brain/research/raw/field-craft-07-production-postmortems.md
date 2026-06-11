# Field Intel 07 — Production Postmortems & Real Failures (with numbers)

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · 2026-06-11 · ~/pixel
Scope: Real engineers describing real failures in production frontend, with metrics where available.
These are the concrete "this broke at scale, here's the fix" stories — outrank any listicle.

---

## POSTMORTEM A — Wix: hydration killed INP for hundreds of millions of sessions

Source: Wix Engineering, "40% Faster Interaction: How Wix Solved React's Hydration Problem with
Selective Hydration and Suspense", wix.engineering, **2025-11-09**. Field data from *"hundreds of
millions of real user sessions"* — one of the highest-N production datapoints in this set.

**The failure (verbatim/near-verbatim):**
- Hydration = browser downloads JS, reconnects to server-rendered HTML. As pages grew heavier, *"the
  browser had to hydrate every component immediately, even those below the fold that users couldn't
  yet interact with."*
- Production symptom: *"less than 40% of Wix sites achieved a 'good' INP score"* and INP was *"the
  lowest among all our competitors."* ← INP, not LCP, was the competitive gap.

**What worked:** Selective hydration via Suspense boundaries — pause hydration on the client, resume
on viewport entry (Intersection Observer). Below-fold components cost *"zero JavaScript and zero CPU
until the user scrolls to them."* Plus main-thread work: fewer long tasks, smarter script scheduling.

**Numbers:** JS payloads −20%; INP ~40% faster.

**React-version note:** in React 18 this required the undocumented *"throw a promise inside a Suspense
boundary"* hack; **React 19's `use()` API officially supports it.** → pixel on React 19 gets this
cleanly.

**PIXEL TAKEAWAY:** Do NOT hydrate the whole page. Default to RSC (server components ship zero JS) +
client islands hydrated on interaction/viewport. INP is won or lost here. This is the single most
actionable production lesson in the set.

## POSTMORTEM B — "Context works in dev, breaks in production" (RSC boundary trap)

Sources: vercel/next.js discussion #42301; nextauthjs/next-auth discussion #11093;
facebook/react issue #35397; dev.to React Context gotchas (2025–2026).

**The failure:** Context providers placed wrong relative to the server/client boundary work in `next
dev` but **fail in production on Vercel** — *"context values are not accessible"* — hitting custom
providers AND third-party ones (`ClerkProvider`, `SessionProvider`). Error: *"React Context is
unavailable in Server Components."* Root cause: context only works inside client components; a
provider rendered in a server component (or above the `"use client"` boundary incorrectly) silently
yields undefined in prod.

**The React 19 regression (issue #35397, React 19.0–19.2.3):** nested providers for the *same*
context now trigger *"over 1000 unnecessary component function calls"* — the inner consumer re-renders
even when ITS context value didn't change, whereas React 18.3.1 only re-ran consumers whose value
changed. → perf regression + breaks render-counting tests. **Version-coupled gotcha.**

**PIXEL TAKEAWAY:**
1. All context providers go in a dedicated `"use client"` `providers.tsx`, mounted high in the client
   tree — never rendered from a server component body.
2. Test context-dependent UI in a **production build** (`next build && next start`), not just dev —
   this is a dev-only-passes silent failure (matches the agent "assert on silent failures" rule).
3. On React 19, avoid redundant nested same-context providers (perf regression #35397).

## POSTMORTEM C — App Router caching: stale data after deploy (e-commerce class bug)

Source: 2026 round-ups (meisteritsystems.com "App Router in 2026: ready for production?"; dev.to
guides) summarizing recurring team reports.

**The failure (named, recurring):** teams migrate product pages to App Router expecting speed, then
*"discover stale inventory data because route caching persisted longer than expected."* Next stacked
multiple caching layers (request memoization, Data Cache, Full Route Cache, Router Cache) that
*"interact differently depending on fetch settings, rendering mode, and navigation state"* — so cache
behavior is non-obvious and the default is often "more cached than you think."

**PIXEL TAKEAWAY:** Treat caching as EXPLICIT per route. For dynamic data (inventory, prices, user
state) set `cache: 'no-store'` / `revalidate` deliberately (or Next 16 `use cache` with explicit
lifetimes). Add a post-deploy check: "does fresh data actually show?" — stale-after-deploy is an
expected bug class, not an edge case.

## POSTMORTEM D — The AI "it's done" / broken-layout loop (process failure)

Source: Adam Argyle, nerdy.dev (field-craft-01), 2026-04-12; corroborated across slop critiques.

**The failure:** AI generates UI, claims completion, human opens browser → layout broken (overlap,
overflow, missing icons, broken combined hover+focus state). AI *"can't see"* (no rendering engine),
so it can't self-verify. Loop repeats, burning iterations.

**PIXEL TAKEAWAY (process, not code):** pixel's loop MUST include a real browser screenshot/DOM check
(Playwright CLI / Chrome MCP) before declaring done. Self-reported "looks good" from a model is
*evidence of nothing*. This validates energy's `test-before-build.md` + QA-zero-tolerance at the
mechanistic level: the model literally cannot verify visual output, so the harness must.

## Cross-cutting pattern: the dangerous failures are SILENT
Four of these (Tailwind `@apply` no-op, context undefined-in-prod, over-caching, AI "done") share a
shape: **no error is thrown; the output is just wrong.** A frontend harness's highest-value asserts
target silent-wrong, not crashes:
- `@apply` present without `@import`/`@reference` → flag.
- Context consumed but provider above a server boundary → flag (or test in prod build).
- Dynamic route with default caching and no explicit `revalidate`/`no-store` → flag for review.
- "Done" with no screenshot artifact → reject.

## Sources (this file)
- https://www.wix.engineering/post/40-faster-interaction-how-wix-solved-react-s-hydration-problem-with-selective-hydration-and-suspen — 2025-11-09
- github.com/vercel/next.js/discussions/42301 ; github.com/nextauthjs/next-auth/discussions/11093 ; github.com/facebook/react/issues/35397
- https://meisteritsystems.com/news/next-js-app-router-in-2026-is-it-ready-for-production/ — 2026
- https://nerdy.dev/why-ai-sucks-at-front-end — Adam Argyle, 2026-04-12
