# Next.js 16 — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11 · All version numbers verified against npm registry directly.

## CURRENT VERSIONS (npm ground truth, 2026-06-11)

| Package | Latest | npm `modified` |
|---|---|---|
| `next` | **16.2.9** | 2026-06-10 |
| `react` / `react-dom` | **19.2.7** | 2026-06-08 |
| `@next/codemod` | 16.2.9 | — |

Source: `npm view next version` / `npm view next time --json` run 2026-06-11.

### Next.js 16.x release timeline (npm `time` field — authoritative)
- **16.0.0 → 2025-10-22** (stable; announced Oct 21 ahead of Next.js Conf 2025)
- **16.1.0 → 2025-12-18**
- **16.2.0 → 2026-03-18**
- **16.2.9 → 2026-06-09** (current patch line)

So as of June 2026 the stable major is **16**, on the **16.2** minor. Next.js 15 → 16 stable was Oct 21 2025.
Source: npm `time` for `next`; https://nextjs.org/blog/next-16 (2025-10-21).

---

## THE FIVE THINGS THAT BREAK (real silent-failure gotchas)

These compile cleanly, pass `tsc`, and pass `next build` — then misbehave at runtime. This is the dangerous class. Source: https://www.squaredtech.co/nextjs-16-upgrade-broke-4-things-no-errors-no-warnings + https://www.salmanizhar.com/blog/nextjs-16-migration-guide (both 2026), corroborated by the official upgrade guide https://nextjs.org/docs/app/guides/upgrading/version-16.

1. **`middleware.ts` is now dead code unless renamed to `proxy.ts`.** If you bump the version manually (without the codemod), the old `middleware.ts` "still sits there, compiles without issue, passes TypeScript checks, and does absolutely nothing at runtime." You must rename the file → `proxy.ts` AND rename the exported function → `proxy`. **Runtime change:** `proxy.ts` runs on the **Node.js runtime only** — Edge-runtime middleware is gone. If you relied on Edge for low-latency interception (geo-routing at the edge, A/B at the edge), this is a real regression. `middleware.ts` is retained-but-deprecated solely for the Edge case and will be removed. (Source: official blog "proxy.ts (formerly middleware.ts)"; salmanizhar migration guide.)

2. **`params` / `searchParams` are now `Promise`s — and the sync form was fully REMOVED, not just warned.** Any `params.id` access without `await` is "technically broken even though it compiles cleanly." Highest file-count blast radius of the whole migration — touches every page, layout, route handler, AND metadata image routes (`generateImageMetadata` `id` is now `Promise<string>`). Same applies to `cookies()`, `headers()`, `draftMode()` — all async now. (Official Removals table; salmanizhar.)

3. **`next lint` was DELETED.** `next build` no longer runs ESLint. CI that relied on `next lint` "can report green while shipping un-linted code." Migrate with `npx @next/codemod@canary next-lint-to-eslint-cli .` and run Biome or ESLint directly in CI. (Official Removals table.)

4. **`revalidateTag(tag)` single-arg form is deprecated/changed semantics.** It now *requires* a `cacheLife` profile as 2nd arg for stale-while-revalidate: `revalidateTag('blog-posts', 'max')`. The 1-arg form still parses but you lose SWR behavior — a silent perf/correctness shift. For read-your-writes (forms, settings) use the new `updateTag(tag)` in a Server Action instead. (Official "Improved Caching APIs".)

5. **Parallel routes now REQUIRE explicit `default.js` in every slot — builds FAIL without them.** Previous implicit behavior gone. Add a `default.js` that calls `notFound()` or returns `null`. This one at least fails loudly (build error), unlike 1–4. (Official Behavior Changes table.)

Bonus codemod caveat: "The codemod updates most files correctly. But it can miss files." Documented case — a layout file was left untouched and only blew up on the first real staging request. **Implication for an agent: after running the codemod, grep the tree for residual sync `params.` access and a leftover `middleware.ts`.**

---

## CACHE COMPONENTS + `use cache` (the headline architecture shift)

The mental-model inversion that matters most for pixel:

- **Next 13–15:** `fetch()` was cached **by default**; you opted *out* with `{ cache: 'no-store' }` or `revalidate: 0`.
- **Next 16:** **nothing is cached** unless you mark it. All dynamic code runs at request time by default. You opt *in* with the `"use cache"` directive (caches pages, components, OR functions; the compiler auto-generates cache keys). (Sources: official blog "Cache Components"; https://www.infoq.com/news/2025/12/nextjs-16-release/.)

Enable in `next.config.ts`:
```ts
const nextConfig = { cacheComponents: true };
export default nextConfig;
```

Cache Components complete the **Partial Prerendering (PPR)** story: a static shell streams instantly, dynamic holes (wrapped in `<Suspense>`) fill at request time. The old `experimental.ppr` / `experimental.dynamicIO` flags are **removed** — `dynamicIO` was renamed to `cacheComponents`; `ppr` evolved into this model. (Official Removals table — note both the flag and the route-level `export const experimental_ppr` are gone.)

New cache control surface:
- `cacheLife` profiles: built-ins `'max'` (recommended for long-lived), `'hours'`, `'days'`; or inline `{ expire: 3600 }`; or custom profiles in `next.config`.
- `revalidateTag(tag, profile)` — SWR invalidation for tagged entries.
- `updateTag(tag)` — **new, Server-Actions-only** — read-your-writes (expire + immediately read fresh in same request). Use for forms/settings.
- `refresh()` — **new, Server-Actions-only** — refreshes **uncached** data only (e.g. a notification count fetched separately); complementary to client `router.refresh()`.

---

## TURBOPACK (now default + FS cache)

- **Turbopack is the DEFAULT bundler** for all apps in 16. Claimed: 2–5× faster prod builds, up to 10× faster Fast Refresh. Adoption pre-stable: >50% of dev sessions and >20% of prod builds on 15.3+ already used it. (Official "Turbopack (stable)".)
- **Opt out to webpack:** `next dev --webpack` / `next build --webpack` (for custom webpack setups). 16.2 cheat sheets report ~400% faster `next dev` startup and ~50% faster rendering. (https://techbytes.app/posts/nextjs-16-performance-optimization-2026-cheat-sheet/.)
- **Turbopack FS caching (beta)** — disk-persisted compiler artifacts between runs:
```ts
const nextConfig = { experimental: { turbopackFileSystemCacheForDev: true } };
```
"All internal Vercel apps are already using this." (Official.)
- Config moved: `experimental.turbopack` → top-level `turbopack` (breaking).
- Babel gotcha: Turbopack now auto-enables Babel if a babel config is found (previously hard-errored) — but Babel = slower builds; React Compiler relies on Babel so expect higher compile times when `reactCompiler: true`.

---

## VERSION REQUIREMENTS (hard floors)

| Requirement | Floor |
|---|---|
| **Node.js** | **20.9.0+** (LTS). Node 18 unsupported. |
| **TypeScript** | **5.1.0+** |
| **Browsers** | Chrome/Edge/Firefox **111+**, Safari **16.4+** |

Source: official Version Requirements table, https://nextjs.org/blog/next-16.

---

## REMOVALS (previously-deprecated → gone in 16)

- **AMP** — entirely removed (`useAmp`, `export const config = { amp: true }`).
- `next lint` (see gotcha #3).
- `devIndicators` options `appIsrStatus`, `buildActivity`, `buildActivityPosition`.
- `serverRuntimeConfig` / `publicRuntimeConfig` → use env vars.
- `experimental.turbopack` location, `experimental.dynamicIO` (→`cacheComponents`), `experimental.ppr`, route `export const experimental_ppr`.
- Automatic `scroll-behavior: smooth` — opt back in with `data-scroll-behavior="smooth"` on `<html>`. **Taste note:** if pixel wants smooth scroll it now must be explicit (or use Lenis — see animation file).
- Sync `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` (see gotcha #2).
- `next/image` local `src` with query strings now requires `images.localPatterns` (anti-enumeration).

### Image default changes (subtle, affect visual + cost)
- `images.minimumCacheTTL`: 60s → **4h (14400s)**.
- `images.imageSizes`: dropped `16` from defaults.
- `images.qualities`: `[1..100]` → **`[75]`**; `quality` prop coerced to nearest allowed value. **Gotcha:** if you hard-coded `quality={90}` you now silently get 75 unless you add `images.qualities`.
- `images.dangerouslyAllowLocalIP` (new, blocks local-IP optimization by default).
- `images.maximumRedirects`: unlimited → **3**.
- `images.domains` deprecated → use `images.remotePatterns`.

---

## DEPRECATIONS (still work, will be removed)
- `middleware.ts` filename → `proxy.ts`.
- `next/legacy/image` → `next/image`.
- `images.domains` → `images.remotePatterns`.
- `revalidateTag(tag)` 1-arg → `revalidateTag(tag, profile)` or `updateTag(tag)`.

---

## NEXT.JS DEVTOOLS MCP (agent-critical — see also ecosystem-08)

Shipped in 16. An MCP server that gives an AI agent:
- **Next.js knowledge** — routing, caching, rendering behavior (so the agent reasons about *this framework's* semantics, not generic React).
- **Unified logs** — browser + server logs in one place, no context switching.
- **Automatic error access** — full stack traces without manual copy-paste.
- **Page awareness** — knows the active route.
Docs: https://nextjs.org/docs/app/guides/mcp. This is the single most important agent-operability feature for pixel: it lets a coding agent debug a running Next app the way DevTools-in-browser lets a human.

16.2 added **Experimental Agent DevTools** (agent gets terminal access to React DevTools + Next diagnostics) and **Browser Log Forwarding** (browser errors → terminal, for agent-powered debugging) + a **Dev Server Lock File** (clear error when a 2nd dev server starts). Sources: https://nextjs.org/blog (16.2 summary, 2026-03-18); InfoQ.

---

## REACT 19.2 FEATURES NOW IN-FRAMEWORK (taste-relevant)
- **View Transitions** (`<ViewTransition>`) — animate elements that update inside a Transition/navigation. **Big for pixel:** native page-transition animation without GSAP for the simple case (aligns with "lowest layer that works").
- **`useEffectEvent`** — extract non-reactive logic from Effects.
- **`<Activity>`** — render background UI via `display:none` while keeping state + cleaning up Effects (think keep-alive tab panels).
- **React Compiler 1.0 (stable support)** — auto-memoization, `reactCompiler: true` (NOT on by default; Babel-based so slower builds). Install `babel-plugin-react-compiler@latest`.
Source: official "React 19.2 and Canary Features"; https://react.dev/blog/2025/10/01/react-19-2.

---

## UPGRADE COMMAND
```bash
npx @next/codemod@canary upgrade latest          # automated
# or manual:
npm install next@latest react@latest react-dom@latest
# new project:
npx create-next-app@latest
```
Upgrade guide for the gaps the codemod misses: https://nextjs.org/docs/app/guides/upgrading/version-16.

---

## PIXEL IMPLICATIONS (vs energy's current react.md, which still says "Next.js 15 App Router")
- energy/react.md line "React Server Components where possible (Next.js 15 App Router)" is now **a version behind**. pixel targets 16 → must encode async params, `proxy.ts`, `cacheComponents`, Node 20.9+.
- The "Framer Motion for page transitions" line in energy/design.md can, for simple cases, be replaced by React 19.2 **View Transitions** (native, lower layer) — keep Motion/GSAP for the complex cases. (See ecosystem-04.)
- An agent building pixel MUST wire the Next DevTools MCP — it is the framework-native debugging surface.

## SOURCES
- https://nextjs.org/blog/next-16 (2025-10-21) — primary release notes (Removals/Behavior/Deprecations tables quoted).
- https://nextjs.org/docs/app/guides/upgrading/version-16 — official upgrade guide.
- https://nextjs.org/blog (16.2 summary, 2026-03-18) — fetched 2026-06-11.
- https://www.infoq.com/news/2025/12/nextjs-16-release/ — InfoQ independent coverage.
- https://www.squaredtech.co/nextjs-16-upgrade-broke-4-things-no-errors-no-warnings (2026) — silent-break field report.
- https://www.salmanizhar.com/blog/nextjs-16-migration-guide (2026) — migration field report.
- https://techbytes.app/posts/nextjs-16-performance-optimization-2026-cheat-sheet/ (2026) — perf numbers.
- npm registry (`npm view`) run 2026-06-11 — version + date ground truth.
