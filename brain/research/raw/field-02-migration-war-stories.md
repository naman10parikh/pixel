# Field Intel 02 — Migration War Stories (What Actually Broke)

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · Started 2026-06-11 · Repo ~/pixel
Scope: Real migration failures — Tailwind v3→v4, Next 15→16, Radix→Base UI. What broke in
PRODUCTION, root cause, fix. Every claim cited (URL + date + author). Bias: GitHub
issues/discussions/changelogs/postmortems over listicles.

> Why this file exists: pixel's ecosystem pass (ecosystem-01..10) covers the *target* stack. This
> file covers the *transition pain* — the stuff that bites teams who already shipped on the old
> version. Encode these as "when migrating X→Y, check Z first" rules + as reasons NOT to chase the
> bleeding edge blindly.

---

## 1. Next.js 15 → 16 — the SILENT breaks are the dangerous ones

### 1a. The four silent breaks (zero errors, zero warnings)
Source: "Next.js 16 Upgrade: 4 Surprising Silent Breaks To Fix Now", SquaredTech, **2026-05-28**
(https://www.squaredtech.co/nextjs-16-upgrade-broke-4-things-no-errors-no-warnings)

The thesis that makes this the single most important migration note for 2026:
> *"Several of its most significant breaking changes produce zero errors, zero warnings, and zero
> indication that anything is amiss until real traffic hits real routes."*

1. **`middleware.ts` → `proxy.ts` rename.** Old `middleware.ts` STILL COMPILES and passes tsc — so
   nothing flags it — but it no longer runs. Symptom (verbatim): *"Routes that should be intercepted
   aren't. Redirects that should fire don't."* Fix: rename file to `proxy.ts`, rename export
   `middleware`→`proxy`. NOTE: proxy runtime is **nodejs only — edge runtime is NOT supported in
   proxy** (cross-confirmed by the Next.js v16 upgrade guide).
2. **`revalidateTag()` single-arg falls back to legacy silently.** Only errors under tsconfig
   `strict:true`, which most legacy projects lack. Symptom: pages serve stale data after mutations,
   no error. Fix: `revalidateTag('products', 'max')` + enable strict mode.
3. **`next lint` removed → CI passes green while shipping unlinted code.** The codemod updates
   package.json but cannot touch CI YAML. Fix: replace `next lint` with `eslint .` in CI manually.
4. **Async `params` accessed synchronously still runs.** Compiles clean even though `params` is now a
   Promise. Symptom (verbatim): *"The problem only appeared on the first real request to that route in
   staging."* Fix: grep for synchronous `params.` access, await it.

→ PIXEL RULE: On any Next 15→16 bump, the migration checklist must include a GREP pass for
`middleware`, single-arg `revalidateTag`, `next lint` in CI, and sync `params.`/`searchParams.`
access. The codemod is NOT sufficient — these are the gaps it leaves.

### 1b. Production failures with time-cost receipts
Source: "Migrating to Next.js 16: What Broke in Production", amillionmonkeys, **2025-09-18**
(https://www.amillionmonkeys.co.uk/blog/migrating-to-nextjs-16-production-guide)
(Older — flagged. Still trusted: it's a concrete first-person postmortem with reproducible causes,
and the failures it names match the 2026 SquaredTech list. Treat as corroborating, not currency.)

- **SVG imports returned `undefined` in production.** Root cause: Next 16 **ignores custom webpack
  config when Turbopack is the default bundler**; the app used `@svgr/webpack`, which lacks full
  Turbopack support. Fix: switched to built-in image optimization + inline SVGs. Cost: *"Half a day to
  debug, research, and implement the workaround."*
- **React Compiler auto-opt-in flagged context with inline object creation.** Fix: `useMemo` the
  context value, or disable React Compiler in config. Cost: ~3.5h.
- **`revalidatePath` stopped triggering re-render** under Turbopack's changed module graph. Fix:
  switch to `revalidateTag` with tagged fetches. Cost: ~4h.
- **`next.config.ts` type errors** from changed `NextConfig` inference. Fix: explicit
  `const config: NextConfig = {...}`. Cost: 15 min.

### 1c. The caching model flip is the biggest cost driver
Source: Next.js v16 upgrade guide + "Next.js 15 vs 16: What actually changed", devanddeliver, 2026
(https://nextjs.org/docs/app/guides/upgrading/version-16)
(https://devanddeliver.com/blog/frontend/next-js-15-vs-16-what-actually-changed-and-should-you-upgrade-your-production-app)

> *"After upgrading, any Server Component or data function that relied on implicit caching in v15 will
> run uncached in v16 by default. This can spike your API request volumes dramatically. Nothing is
> cached unless you add `'use cache'`."*

A real GitHub report — vercel/next.js Issue #85470, "Server requests and latency increased after
upgrading from Next.js 15 to 16" — documents request-count + latency spikes post-upgrade (→ direct
cloud-bill impact). This is the revenue-adjacent regression: explicit-caching default means the
upgrade can silently 2–3x your origin traffic.
(https://github.com/vercel/next.js/issues/85470)

→ PIXEL RULE: "Audit your data-fetching layer BEFORE upgrading" (devanddeliver). The v16 model is
*explicit caching* — every fetch that was implicitly cached is now uncached until you opt in with
`'use cache'`. Budget for this as a cost regression, not just a code change.

---

## 2. Tailwind v3 → v4 — the upgrade tool lies to confident teams

### 2a. The downgrade-back-to-v3 postmortem (the cautionary tale)
Source: Pradeep Gudipati, "Downgrading from Tailwind CSS v4 to v3", Medium, **2025-04-15** (older —
flagged; kept because it's a rare *reverse*-migration postmortem and the failure modes still recur in
2026 v4 migration threads).
(https://medium.com/@pradeepgudipati/...downgrading-from-tailwind-css-v4-to-v3...)

Concrete v4 failures, verbatim:
- *"Our custom global styles were not applied."*
- *"Many utility classes silently failed or were purged due to changes in JIT compilation."*
- v4 *"removed support for older PostCSS plugins and certain configuration patterns (e.g., @theme,
  legacy safelist, etc.)."*
- *"Sourcemaps and HTML build artifacts behaved differently in turbopack, causing confusion during
  debugging."*
- *"Turbopack builds were bloated and unpredictable for production."*

After **48 hours** of trying the official upgrade path, reinstalls, config edits, build-tool swaps:
> *"Tailwind v4 is still evolving. Unless you're building something from scratch or are fully aligned
> with its changes, v3 is still the safer bet."*
> *"Custom global CSS, older PostCSS tooling, and frameworks like Next.js (especially with Turbopack)
> are not always v4-ready."*

### 2b. The recurring v4 migration failure modes (multi-thread consensus)
Sources: tailwindlabs/tailwindcss Discussions #16642 ("still need tailwind.config.js") and #15809
("Error while Migrate ... using `npx @tailwindcss/upgrade`"); Tailwind upgrade guide.
(https://github.com/tailwindlabs/tailwindcss/discussions/16642)
(https://github.com/tailwindlabs/tailwindcss/discussions/15809)
(https://tailwindcss.com/docs/upgrade-guide)

- **Plugin incompatibility is the #1 cause of failed auto-upgrades.** Existing plugins in
  `tailwind.config.ts` break the `npx @tailwindcss/upgrade` run; removing them lets it complete. Many
  third-party npm packages still don't support v4.
- **PostCSS plugin moved to a separate package** — must install `@tailwindcss/postcss` and rewrite the
  PostCSS config; the old inline plugin reference silently does nothing.
- **Custom styles silently dropped / purged** — `@theme`, legacy `safelist`, older config patterns no
  longer apply; utilities can silently fail with no build error.
- **Browser-support floor moved up:** v4.0 targets **Safari 16.4+, Chrome 111+, Firefox 128+**. If you
  must support older browsers, the guide itself says **stay on v3.4.** This is a hard product
  constraint, not a preference.
- **The auto-upgrade tool does NOT handle custom setups well** — and when manual migration fails,
  there's no clear signal *why* a utility class stopped working (silent purge).

→ PIXEL RULE: For greenfield, v4 is correct (energy bible says v4 is the standard, and it is). For a
migration of an existing app: (1) strip plugins before running the codemod, (2) expect to rewrite
PostCSS config + `@theme`, (3) verify browser-support floor against the product's analytics, (4)
diff the built CSS, don't trust "it compiled." The codemod is a starting point, not a finish line.

---

## 3. Radix UI → Base UI (shadcn Feb-2026 unified package) — the `asChild` reckoning

Context: shadcn shipped a unified Radix package and a Base UI migration path in **Feb 2026**.
Source: shadcn/ui changelog "February 2026 — Unified Radix UI Package"
(https://ui.shadcn.com/docs/changelog/2026-02-radix-ui); shadcn-ui/ui Discussion #9562 "Migrating from
Radix UI to Base UI"; Issue #9547 "After migration to new radix style, components are still added as
old"; shadcnstudio "Migrate from Radix UI to Base UI in 9 Easy Steps".
(https://github.com/shadcn-ui/ui/discussions/9562)
(https://github.com/shadcn-ui/ui/issues/9547)
(https://shadcnstudio.com/blog/migrate-from-radix-ui-to-base-ui)

What breaks (API-level, not cosmetic):
- **`asChild` is REMOVED in Base UI.** You must globally strip `asChild`; Base UI uses **render props**
  (`render={...}`) instead. This is the single biggest mechanical change — every `<X asChild>` site
  must be rewritten.
- **Select is NOT a drop-in refactor.** `Select.Content` / `Select.Viewport` do **not** map onto Base
  UI's `Select.Positioner` / `Select.Popup`. You must reorganize WHERE styles live, not just rename
  imports. (Same shape-shift applies to other popover-family components.)
- **`checked` now strictly requires a boolean**; partial state must use the new `indeterminate` prop
  (was looser in Radix).
- **Positioning engine = Floating UI.** Custom-positioned components must move to `@floating-ui/react`.
- **Custom CSS selectors break:** you must grep for `data-[state=...]` / `.radix-...` keywords in your
  styles — Base UI's data-attribute surface differs.
- **Migration-script bug:** after running the migrate command, newly-added components sometimes still
  pull the OLD specific imports + re-add the old dependency (Issue #9547). Don't trust the script's
  output blindly; verify imports after each `add`.

The maintainers' own guidance (Discussion #9562 / #6248): do a **gradual, component-by-component**
replacement, **NOT a "big-bang" global swap** — "Base UI and Radix UI implement Select differently
enough that it's more than a simple refactor."

The strategic question (is Radix dying?): "Is Your Shadcn UI Project at Risk? A Deep Dive into Radix's
Future", Mashuk Tamim, Medium — frames the risk that drove shadcn to Base UI. tldraw is independently
investigating the same move (tldraw/tldraw Issue #7584), so this is an ecosystem-wide shift, not just
shadcn.
(https://mashuktamim.medium.com/is-your-shadcn-ui-project-at-risk-a-deep-dive-into-radixs-future-91af267c4bec)
(https://github.com/tldraw/tldraw/issues/7584)

→ PIXEL RULE: For greenfield in mid-2026, default to whatever shadcn's current default primitive is
(Base UI on the new registry), so you never pay the `asChild`→render-prop migration. For existing
Radix apps: do NOT big-bang. The `asChild` removal + Select restructure mean a per-component port with
visual verification each step. This is the 2026 analog of the v3→v4 lesson: the migration TOOL gets
you 70% there and lies about the rest.

> UPDATES energy bible: frontend-bible-2026.md lists "shadcn/ui (Radix primitives)" as the settled,
> non-negotiable component layer. As of **Feb 2026** that's stale — shadcn's default primitive is
> moving to **Base UI**, and `asChild` (which the bible's whole compose-with-Radix mental model
> assumes) is gone in Base UI. pixel should track "shadcn-on-Base-UI" as the current truth and treat
> the bible's "Radix primitives" line as a 2025 snapshot.

---

## Sources (this file)
- https://www.squaredtech.co/nextjs-16-upgrade-broke-4-things-no-errors-no-warnings — 2026-05-28 (PRIMARY, currency)
- https://nextjs.org/docs/app/guides/upgrading/version-16 — Next.js official, 2026
- https://github.com/vercel/next.js/issues/85470 — request/latency spike after 15→16 (PRIMARY)
- https://devanddeliver.com/blog/frontend/next-js-15-vs-16-what-actually-changed... — 2026
- https://www.amillionmonkeys.co.uk/blog/migrating-to-nextjs-16-production-guide — 2025-09-18 (corroborating, flagged older)
- https://medium.com/@pradeepgudipati/...downgrading-from-tailwind-css-v4-to-v3... — 2025-04-15 (reverse-migration, flagged older)
- https://github.com/tailwindlabs/tailwindcss/discussions/16642 — v4 still needs config (PRIMARY)
- https://github.com/tailwindlabs/tailwindcss/discussions/15809 — `npx @tailwindcss/upgrade` errors (PRIMARY)
- https://tailwindcss.com/docs/upgrade-guide — browser-support floor (Safari 16.4+/Chrome 111+/FF 128+)
- https://ui.shadcn.com/docs/changelog/2026-02-radix-ui — shadcn unified Radix package, Feb 2026 (PRIMARY)
- https://github.com/shadcn-ui/ui/discussions/9562 — Radix→Base UI migration guide (PRIMARY)
- https://github.com/shadcn-ui/ui/issues/9547 — migration script re-adds old imports (PRIMARY)
- https://github.com/tldraw/tldraw/issues/7584 — tldraw investigating Radix→Base UI
- https://mashuktamim.medium.com/is-your-shadcn-ui-project-at-risk... — Radix future risk
