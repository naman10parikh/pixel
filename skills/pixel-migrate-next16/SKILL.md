---
name: pixel-migrate-next16
description: pixel's Next.js 15→16 + Tailwind v3→v4 migration discipline. Use when upgrading Next or Tailwind. Encodes the §0 silent-failure grep-set, codemod-then-grep (O13 — the agent's job is the GAP the codemod misses), and the named migration traps S1 (middleware→proxy), S17 ('use cache' cost), S18 (Tailwind @apply no-op).
trigger: upgrading Next.js or Tailwind; "migrate to Next 16"; "bump to Tailwind v4"; running @next/codemod or @tailwindcss/upgrade; post-upgrade verification; dead middleware / @apply no-op / silent cost spike
allowed-tools: Bash, Read, Grep
---

# pixel-migrate-next16 — codemod-then-grep (O13 + §0 grep-set + S1/S17/S18)

> **Stance:** determinism beats cleverness (Karpathy "surgical changes"). Let the codemod do the mechanical work; **the agent's job is the GAP the codemod misses** (O13). "The codemod misses files" is documented (§1.6) — a layout left untouched blew up on first staging request. NEVER hand-redo a mechanical migration; ALWAYS grep the residue after.

## trigger
- upgrading Next.js (15→16) or Tailwind (v3→v4)
- running `@next/codemod` / `@tailwindcss/upgrade`
- post-upgrade verification of any kind

## The §0 SILENT-FAILURE GREP-SET this encodes (run post-codemod, pre-commit)

The single highest-leverage habit. After ANY codemod/upgrade or Tailwind change:
```bash
# 1. residual sync params/searchParams (Next 16 made them Promises — sync form REMOVED, not warned)
grep -rn 'params\.' --include=*.tsx --include=*.ts app/ src/   # expect: only awaited / destructured-from-await
# 2. dead middleware — must be proxy.ts now (+ export renamed `proxy`)   → S1
test -f middleware.ts && echo "PITFALL: middleware.ts is dead code in 16 — rename to proxy.ts"
# 3. stale Lenis pkg (retired April 2026)
grep -rn '@studio-freight' src/ app/ && echo "PITFALL: use lenis / lenis/react"
# 4. stale Tailwind directives / JS config
grep -rn '@tailwind ' .          # expect: none — should be @import "tailwindcss"
# 5. stale image API
grep -rn 'images.domains\|next/legacy/image' .   # expect: none — remotePatterns / next/image
# 6. Tailwind class actually GENERATED (build first, grep the OUTPUT css, not the JSX — "in my JSX" ≠ "generated")
# 7. console after load = 0 hydration warnings (Playwright page.on('console') or 16.2 Browser Log Forwarding)
```

## The named migration traps (each maps to a battle-tested scenario)

- **S1 / §1.1 🔴 `middleware.ts` is dead code unless renamed `proxy.ts`** (export → `proxy`). Edge middleware is gone; Node-runtime only. DETECT: grep #2 + assert the proxy effect is observable. FIX: rename file + export; prefer the codemod.
- **§1.2 🔴 `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` are now `Promise`s** — `params.id` without `await` "is technically broken even though it compiles cleanly." Highest file-count blast radius (every page/layout/route-handler + `generateImageMetadata`). FIX: `await` everywhere.
- **S17 / §10.2 🔴 the `'use cache'` flip silently 2–3×'s origin traffic + the bill** — "nothing is cached unless you add `'use cache'`." No error; request volume + latency spike post-deploy (#85470). FIX: audit the data-fetching layer BEFORE upgrading; stable read routes carry explicit `'use cache'` + `cacheLife`; budget it as a cost regression. Pairs with §1.4 (single-arg `revalidateTag` drops SWR).
- **S18 / §10.1 🔴 `@apply` silently NO-OPS in a CSS-module/component-scoped file under Tailwind v4** — v4 moved config into the CSS, so a file with no theme context ignores `@apply` ("they just don't do anything") or throws "Cannot apply unknown utility class." FIX: greenfield → **never use `@apply`** (Wathan's own guidance — compose with classes / `cva` / `tv`); if truly needed, keep it in the SAME file that does `@import "tailwindcss"` or add `@reference` (costs build perf).
- **S6 / §2.3 🟠 the upgrade tool pins you to `@config tailwind.config.js`** for un-portable config (even *empty* `extend`/`plugins`/`variants`). FIX: remove empty props; port breakpoints to `@custom-variant`/`@theme`; accept `@config` only for a named plugin.
- **§2.1 🔴 Tailwind v4 token naming is STRICT** — `--color-primary-500`, NOT `--primary-500`; wrong prefix = the utility silently won't generate (same for `--font-*`/`--breakpoint-*`/`--ease-*`).
- **§1.6 🔴 the codemod misses files** — never trust it alone; run the grep-set after.

## steps
1. **Codemod first:** `npx @next/codemod@latest upgrade` and/or `npx @tailwindcss/upgrade`. Let it do the mechanical edits.
2. **Run the §0 grep-set** — every residual it printed is a file the codemod missed; fix those by hand (the GAP).
3. **Build + grep the OUTPUT CSS** (not the JSX) to confirm Tailwind classes actually generated under Turbopack (S4 territory).
4. **Cost/behavior check:** stable read routes have `'use cache'`; no single-arg `revalidateTag(`; no orphan `@apply`.
5. **Then `pixel verify`** for the silent-failure set (build + screenshot + 0-hydration console). NEVER call the green codemod "done" (O14).

## output
- The codemod command(s) run + the residue the §0 grep-set caught.
- Per trap (S1/S17/S18/S6): fixed / N/A, with the grep evidence.
- The `pixel verify` result on the migrated tree.

## verify
post-migration: `test -f proxy.ts && ! test -f middleware.ts` (S1) AND `grep -rn '@tailwind ' .` empty AND no orphan `@apply` without a sibling `@import "tailwindcss"`/`@reference` (S18) AND no single-arg `revalidateTag(`.

## sources
brain/KNOWN-PITFALLS.md §0, §1.1–§1.6, §2.1–§2.3, §10.1–§10.2 · brain/OPINIONS.md O13, O14 · BATTLE-TESTED S1, S6, S17, S18.
