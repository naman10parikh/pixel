# RSC / App Router Patterns + Real Breakage — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11. Next 16.2, React 19.2. GitHub issue engagement = reactions(+) / comments(c), pulled via `gh api search/issues` 2026-06-11.

## THE MENTAL MODEL (the boundary is the whole game)
Server Components render on the server, ship zero JS, can be async and touch the DB directly. `'use client'` marks a **serialization boundary**, not just "make it interactive." The 4 errors below are the ones that bite in production.

---

## REAL-WORLD BREAKAGE — high-engagement Next.js issues (the agent MUST know these)

### Cache Components / `use cache` (the NEW surface, most volatile)
- **#86577** (+26, **74 comments**, OPEN): "[cacheComponents] Activity component route preservation causes significant breakage in app." React 19.2 `<Activity>` + cacheComponents interact badly on route preservation. The single hottest cacheComponents thread. https://github.com/vercel/next.js/issues/86577
- **#85490** (+10, c13, OPEN): "Setting cacheComponents=true breaks Clerk sign-in route with 'Uncached data outside <Suspense>'." → **enabling `cacheComponents` can break auth (Clerk)** unless you wrap uncached/dynamic reads in `<Suspense>`. Directly relevant: pixel will likely use Clerk. https://github.com/vercel/next.js/issues/85490
- **#85390** (+13, c13, CLOSED): "cacheComponents breaks React Portal cleanup — portaled content stays stuck after route change." Portals (modals/tooltips) leak across navigations. https://github.com/vercel/next.js/issues/85390
- **#86251** (+10, c7, CLOSED): "notFound breaks Suspense in layout with cacheComponents enabled." https://github.com/vercel/next.js/issues/86251
- **#74158** (+17, c1, OPEN): "`use cache` + `cacheLife` unexpectedly requires Suspense boundary" — using cacheLife forces you to add `<Suspense>` you didn't expect. https://github.com/vercel/next.js/issues/74158
- **#85672** (+26, c20, OPEN): "`use cache: private` not working during client-side navigation" — the private-cache variant is buggy on soft nav. https://github.com/vercel/next.js/issues/85672
- **#89754** (+8, OPEN): "Nonce-based CSP with inline <head> scripts is incompatible with cacheComponents" — **CSP + cacheComponents conflict** (security-relevant). https://github.com/vercel/next.js/issues/89754
- **#92152** (+16, c11, OPEN): "Next 16.2 router cache issue, if search param name is used multiple times" — repeated query-param names corrupt the router cache in 16.2. https://github.com/vercel/next.js/issues/92152

**TAKEAWAY for pixel:** `cacheComponents: true` is powerful but as of 16.2 has a live cluster of bugs around **Suspense, Clerk auth, Portals, CSP, and `<Activity>`**. Recommendation: adopt Cache Components **deliberately and incrementally** (per-route `use cache`), wrap all dynamic/uncached reads in `<Suspense>` from the start, and pin/watch these issues. Do NOT flip it on globally and assume it's free.

### Turbopack (now default → its bugs are everyone's bugs)
- **#81161** (+**88**, c45, OPEN): "Turbopack dev server uses too much RAM and CPU." The most-reacted Turbopack issue. Large apps see heavy memory use in dev. Mitigate with FS cache (`turbopackFileSystemCacheForDev`) and/or fall back `next dev --webpack` if a machine struggles. https://github.com/vercel/next.js/issues/81161
- **#81763** (+30, c16, OPEN): "**Turbopack removes styles from TailwindCSS/DaisyUI**." Directly hits pixel's stack — certain Tailwind/plugin setups lose styles under Turbopack. Verify the Tailwind v4 + Turbopack path renders before trusting it. https://github.com/vercel/next.js/issues/81763
- **#87737** (+27, c32, OPEN): "Turbopack generates external module references with hashes that don't match installed packages." Breaks some deps. https://github.com/vercel/next.js/issues/87737
- **#88844** (+29, c13, OPEN): "Turbopack standalone build in 16.1.x omits serverExternalPackages from .next/standalone." Breaks standalone Docker output. https://github.com/vercel/next.js/issues/88844
- **#77482** (+20, OPEN): "`next dev --turbopack` does not support `@next/bundle-analyzer`." Bundle analysis story is weaker on Turbopack.

### Server Actions (the data-mutation surface)
- **#50163** (+**57**, c27, OPEN): "**Setting Cookies Via Server Action Reloads Entire App**." Long-standing: `cookies().set()` in an action triggers a full reload — a known UX wart (auth/session flows). https://github.com/vercel/next.js/issues/50163
- **#49408** (+51, c30, CLOSED): "Server Actions 405 'Method Not Allowed' when using generateStaticParams." Actions on statically-generated routes 405'd. https://github.com/vercel/next.js/issues/49408
- **#63804** (+56, c11, CLOSED): "Unused server actions have endpoints created for them." Dead actions still expose endpoints (security surface — audit them). https://github.com/vercel/next.js/issues/63804
- **#69265** (+32, OPEN): "Parallel server action calls" — actions don't parallelize well (they queue). Don't fan out N actions expecting concurrency.
- **#54282** (+31, c26, OPEN): "Top-level await not working with Server Actions called from Client Components."

---

## THE 5 BOUNDARY MISTAKES (field-report synthesis, 2026)
Source: dev.to/thebitforge "I Stopped Fighting RSC"; loke.dev "Fix React 19 Hydration Errors"; joshwcomeau.com/react/server-components; xjavascript hydration debug.

1. **Over-using `'use client'`** — marking every file client "pretends App Router is Pages Router," shipping Markdown parsers, date libs, DB clients to the browser. **Rule:** push `'use client'` to the leaves; keep data-fetching + heavy deps in Server Components.
2. **Non-serializable props across the boundary** — passing a `Date`, a class instance, a function (non-event-handler), or anything that doesn't survive `JSON.stringify` from Server → Client = the client gets a different value → hydration mismatch. Pass primitives/plain objects; reconstruct `Date` client-side.
3. **Browser APIs / non-deterministic output during SSR** — `Math.random()`, `Date.now()`, `window`, `localStorage` in render → server HTML ≠ client HTML. Guard with `useEffect` or dynamic import `{ ssr: false }`. Note: ad-blockers/password-managers mutate the DOM pre-hydration → subtle mismatches you can't fully prevent (suppressHydrationWarning narrowly).
4. **Suspense fallback divergence** — Suspense fallback must render identically on server and client. Server Components can't contain nested Suspense unless the boundary is in a `'use client'` file. (Issue #45047 [AppDir] is the canonical example: interacting with a Client Component before full load → hydration failed.)
5. **Cache-default inversion (Next 16-specific)** — devs migrating from 13–15 assume fetches are cached; in 16 **nothing is cached** without `use cache`. The reverse mistake: enabling `cacheComponents` and getting "Uncached data outside <Suspense>" errors (see #85490). **Wrap dynamic reads in `<Suspense>`.**

---

## CANONICAL DATA-FLOW PATTERNS (what to actually do)
- **Read:** async Server Component fetches directly (DB/ORM/fetch). Mark cacheable parts with `use cache` + a `cacheLife` profile.
- **Mutate:** Server Action (`'use server'`), called from a Client Component form/button. For read-your-writes use `updateTag(tag)`; for refreshing uncached side-data use `refresh()`; for SWR invalidation use `revalidateTag(tag, 'max')`. (See ecosystem-01.)
- **Static shell + dynamic holes:** PPR via Cache Components — static parts prerender, dynamic parts stream inside `<Suspense>`.
- **Stream:** wrap slow data in `<Suspense fallback={...}>` with a fallback that matches SSR exactly (and shows *what* is loading — energy anti-slop: "no spinners without context").
- **Client islands:** `'use client'` only at interactivity leaves; `dynamic(() => import(...), { ssr: false })` for browser-only widgets (maps, charts that touch `window`).

## AGENT NOTES
- The **Next DevTools MCP** (ecosystem-01/08) is purpose-built to debug exactly these (routing/caching/rendering + unified logs + stack traces) — wire it.
- After any codemod/upgrade: grep for residual sync `params.`/`searchParams.` access and leftover `middleware.ts`.
- To catch hydration mismatches an agent can't "see": run the page, read the browser console via Playwright CLI / Browser Log Forwarding (16.2), and assert zero hydration warnings.

## PIXEL IMPLICATIONS
- energy/react.md "RSC where possible (Next.js 15 App Router)" → update to 16, and ADD the boundary rules above (serialization, leaf-`use client`, Suspense-wrap dynamic reads).
- Treat `cacheComponents` as opt-in-per-route with mandatory `<Suspense>` discipline, given the live bug cluster + Clerk interaction.
- Verify Tailwind v4 actually renders under Turbopack (issue #81763) before declaring the scaffold green.

## SOURCES
- GitHub issues via `gh api search/issues` (vercel/next.js), pulled 2026-06-11: #86577, #85490, #85390, #86251, #74158, #85672, #89754, #92152, #81161, #81763, #87737, #88844, #77482, #50163, #49408, #63804, #69265, #54282, #45047 (numbers + reaction/comment counts above).
- https://dev.to/thebitforge/i-stopped-fighting-react-server-components (2026) — boundary field report.
- https://loke.dev/blog/fix-react-19-hydration-errors-boundary-issues — React 19 hydration.
- https://www.joshwcomeau.com/react/server-components/ — RSC mental model.
- https://nextjs.org/docs/app/building-your-application/rendering/client-components — official boundary docs.
