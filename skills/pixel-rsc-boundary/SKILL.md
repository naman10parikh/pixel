---
name: pixel-rsc-boundary
description: pixel's Server/Client boundary discipline for Next.js 16 + React 19.2. Use when writing Server/Client components, debugging hydration mismatches, or seeing "Context is unavailable"/undefined-in-prod. Encodes the 5 boundary mistakes (PITFALLS §5), the non-serializable-props trap (S8), and the provider-above-the-boundary trap (S20).
trigger: writing Server/Client components; a hydration mismatch / hydration warning in console; "Context is unavailable"; works in dev fails in prod; deciding where 'use client' goes; cacheComponents / use cache adoption
allowed-tools: Bash, Read, Grep
---

# pixel-rsc-boundary — the serialization-boundary discipline (PITFALLS §5 + S8/S20)

> **Stance:** the RSC boundary has the highest blast radius in the stack and its failures are SILENT — `tsc` passes, `next build` passes, then it hydration-mismatches or returns `undefined` in production. A human notices; an agent sees green and moves on (O14). This is the one to get right first.

## trigger
- writing a Server or Client component / deciding where `'use client'` goes
- a hydration mismatch or `Warning: Text content did not match` in the console
- `"React Context is unavailable in Server Components"` / a provider returns `undefined`
- "works in `next dev`, breaks in production"
- adopting `cacheComponents` / `'use cache'`

## The 5 boundary mistakes this encodes (named, from PITFALLS §5)

1. **Over-using `'use client'`** (§5.1) — ships Markdown parsers, date libs, DB clients to the browser ("pretends App Router is Pages Router"). **Push `'use client'` to the LEAVES**; keep data-fetching + heavy deps in Server Components. Default to RSC (zero JS) + client islands hydrated on interaction/viewport entry — below-fold eager hydration tanks INP (§12.1: Wix saw <40% good-INP with full hydration; islands → INP ~40% faster).
2. **Non-serializable props across the boundary** (§5.2 → S8) — a `Date`, a class instance, a non-event-handler function → hydration mismatch. **Pass primitives / plain objects; reconstruct `Date` client-side.**
3. **Non-deterministic SSR output** (§5.3) — `Math.random()`, `Date.now()`, `window`, `localStorage` in a component body → server HTML ≠ client HTML. **Guard with `useEffect` or `dynamic(…, { ssr: false })`**; `suppressHydrationWarning` ONLY narrowly for extension-mutated DOM.
4. **Provider rendered from/above a Server boundary** (§10.3 → S20) — React Context is unavailable in Server Components; a `ClerkProvider`/`SessionProvider` mounted from a server component body works in `next dev`, returns `undefined` in production (the dev-passes/prod-fails blind spot). **All providers in a dedicated `'use client'` `providers.tsx`, mounted high in the CLIENT tree.** On React 19, avoid redundant nested same-context providers (#35397 — 1000+ unnecessary calls).
5. **Cache-default inversion** (§5.5 → S2) — migrators from 13–15 assume fetches are cached; in 16 **nothing is cached without `use cache`**. The reverse trap: enabling `cacheComponents` and getting "Uncached data outside `<Suspense>`". **NEVER set `cacheComponents: true` globally** (it has a live bug cluster — Clerk #85490, Portals #85390, CSP nonce #89754, `<Activity>` #86577, dup-search-param router cache #92152); **adopt `'use cache'` per-route with `<Suspense>` around every dynamic read from day one** (O2).

## steps
1. **Place the boundary deliberately:** server by default; `'use client'` only at the leaf that needs interactivity/state/browser APIs.
2. **Audit props crossing the boundary** — primitives + plain objects only; no `Date`/class/function (except event handlers).
3. **Providers → `providers.tsx` (`'use client'`)**, mounted in the client tree — never from a server component body.
4. **`cacheComponents` → per-route + `<Suspense>`**, never the global flag. Use `updateTag(tag)` in a Server Action for read-your-writes (not single-arg `revalidateTag`, which silently drops SWR — §1.4).
5. **Prove it the way the compiler can't:** `next build && next start` (NOT just `next dev`), load every context-dependent route, assert **0 hydration warnings** via `page.on('console')` and no `undefined`/"unavailable".

## output
- The boundary decision (which file is `'use client'` and why it's the leaf).
- A grep report: `'use client'` density; any non-serializable prop; any provider in a server file.
- The prod proof: `next build && next start` + 0-hydration-warning console assertion.

## verify
`grep -rn "'use client'" src/` shows leaf-level placement (not page-top blanket) AND providers live in a `'use client'` file AND a prod build + console check records 0 hydration warnings.

## sources
brain/KNOWN-PITFALLS.md §5.1–§5.8, §10.3, §12.1 · brain/OPINIONS.md O2, O14 · BATTLE-TESTED S2, S8, S20.
