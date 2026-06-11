# Tailwind CSS v4 — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11 · Versions verified against npm.

## CURRENT VERSION (npm ground truth 2026-06-11)
- `tailwindcss` **4.3.0** (modified 2026-06-10)
- `@tailwindcss/postcss` **4.3.0**, `@tailwindcss/vite` **4.3.0**
- v4 release line: **4.0.0 → 2025-01-21**, **4.1.0 → 2025-04-01**, **4.2.0 → 2026-02-18**, **4.3.0 → 2026-05-08**.
Source: `npm view tailwindcss time --json` run 2026-06-11.

---

## THE ARCHITECTURE SHIFT (v3 → v4) — what actually changed

### 1. Oxide engine (Rust rewrite) — real perf numbers
Official benchmarks (https://tailwindcss.com/blog/tailwindcss-v4, 2025-01-21):
- Full builds: **3.78× faster** (378ms → 100ms)
- Incremental rebuild *with* new CSS: **8.8× faster** (44ms → 5ms)
- Incremental rebuild *with no* new CSS: **182× faster** (35ms → **192µs**, microseconds)
Biggest win when reusing existing classes (`flex`, `col-span-2`, `font-bold`).

### 2. CSS-first config — `tailwind.config.js` is GONE (mostly)
v3 had a JS config + `@tailwind base/components/utilities`. v4:
```css
@import "tailwindcss";          /* single directive, replaces 3 @tailwind lines */

@theme {
  --font-display: "Satoshi", "sans-serif";
  --breakpoint-3xl: 1920px;
  --color-avocado-500: oklch(0.84 0.18 117.33);
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
}
```
All `@theme` tokens are **auto-exposed as native CSS custom properties** on `:root` → runtime access from JS-free CSS *and* from React via `var(--color-...)`. This is the mechanism pixel's BRAND.md → theme-tokens flow should target (energy/design.md "BRAND.md → theme-tokens.json → tailwind.config.ts" must update: the sink is now `@theme` in CSS, not `tailwind.config.ts`).

**GOTCHA — naming convention is strict:** custom colors MUST be `--color-primary-500`, NOT `--primary-500`. Wrong prefix = the utility silently won't generate. (Source: pockit migration guide 2026; designrevision.com.)

### 3. New plugins
```js
// postcss.config.js
export default { plugins: ["@tailwindcss/postcss"] };
```
```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [tailwindcss()] });
```
Vite plugin = tighter integration + faster than PostCSS. **For Next.js**, v4.2 added a **first-class webpack plugin** for "a huge performance boost in frameworks like Next.js" — but note Next 16 defaults to **Turbopack**, not webpack, so confirm which Tailwind integration path Next 16 + Turbopack uses (Next's `create-next-app` wires Tailwind for you; see GAP below).

### 4. Automatic content detection — no more `content: []`
Heuristics auto-discover templates, auto-ignore `.gitignore`'d files and binaries. Escape hatch for excluded/3rd-party sources:
```css
@source "../node_modules/@my-company/ui-lib";
```
**GOTCHA:** classes living in files Tailwind's heuristic skips (e.g. a CMS string, a lib outside the project) won't generate until you add `@source`.

---

## BROWSER FLOOR (DISPUTED — flag for GAPS)
v4 targets modern CSS (`@property`, `color-mix()`, cascade layers). Stated floors **conflict across sources**:
- Tailwind blog/upgrade guide: **Safari 16.4, Chrome 111, Firefox 128** (https://tailwindcss.com/docs/upgrade-guide — note **Firefox 128**, higher than Chrome).
- Some 2026 secondary write-ups quote Firefox **111**.
Next.js 16's own floor is Chrome/Edge/Firefox 111, Safari 16.4. **The binding constraint for pixel = whichever is higher; treat Firefox 128 as the safe floor for Tailwind v4.** "If you need older browsers, stick with v3.4." (Tailwind upgrade guide.)
→ This is a real GAP: I could not reconcile the Firefox floor (111 vs 128) from primary sources alone.

---

## v4.x CHANGELOG DELTAS (last ~6 months that matter for taste)

**v4.1 (2025-04-01)** — https://tailwindcss.com/blog/tailwindcss-v4-1
- `text-shadow-*` utilities (finally — text shadows were never first-class).
- `mask-*` utilities (image + gradient masking, ergonomic API). **Big for editorial/asymmetric design** — gradient-mask fades on images instead of gray boxes (aligns with anti-slop "no placeholder gray boxes").
- Colored `drop-shadow` support; `overflow-wrap` for fine text wrapping; better old-browser compat.

**v4.2 (2026-02-18)** — 
- 4 new color palettes: **mauve, olive, mist, taupe** (muted/editorial-friendly — complements the warm-black taste better than the loud default palette).
- First-class **webpack plugin** (Next.js perf).
- More logical-property utilities (`pbs-*`, `mbs-*`, `inline-*`, `block-*`, logical inset).
- `font-features-*` (low-level OpenType control — useful for Instrument Serif ligatures / tabular nums; energy/make-interfaces skill wants tabular numbers).

**v4.3 (2026-05-08)** — https://tailwindcss.com/blog/tailwindcss-v4-3
- **Scrollbar utilities** (style scrollbars without the half-supported APIs).
- `@container-size` utility (height-aware container queries).
- Stacked + compound `@variant` directly in CSS.
- Default values for functional utilities; new colors.
- "Two releases' worth of stuff" (so it folds in interim work).

Other v4.0 headline features still relevant: container queries first-class (`@container`, `@sm:`, `@max-md:`, stacked ranges `@min-md:@max-xl:hidden`), `@starting-style` (animate on first paint, JS-free — pairs with the "enter animations" requirement in make-interfaces skill), `not-*` variant, dynamic utility values (`grid-cols-15` w/o config), **oklch P3 palette** (vivid wide-gamut — matches energy/design "OKLCH colors" in design-systems skill), 3D transforms (`rotate-x-*`, `translate-z-*`), conic/radial gradients (`bg-conic-*`, `bg-radial-*`) + interpolation modifiers (`/oklch`).

---

## REAL-WORLD MIGRATION BREAKAGE (GitHub signal)

`tailwindlabs/tailwindcss` Discussion **#16642** "Migration from V3 to V4 - still need tailwind.config.js" (4 participants, 3 replies — recurring pain). Maintainer (wongjn, collaborator): *"If the upgrade tool sees some configuration it can't port, it will keep your JS config file."* You still get pinned to a JS config (`@config '../../tailwind.config.js';`) when you have:
- **Function-based theme extensions** (e.g. `theme.extend.typography` using a function — the `@tailwindcss/typography` "prose" plugin) — no CSS equivalent.
- Custom screen configs like `xs: { max: '360px' }`.
- **Even empty** `extend`/`plugins`/`variants` properties trigger retention.
- Any plugin dependency.

Workarounds (exact syntax):
```css
@custom-variant xs (@media (max-width: 360px));     /* custom breakpoint */
@theme { --breakpoint-xs: 22.5rem; }                 /* or as a theme var */
```
Discussion **#15809** "Error while Migrate ... using `npx @tailwindcss/upgrade`": migration errors are "mainly caused by existing/added plugins in tailwind.config.ts — when removed, migration works perfectly." DaisyUI and other theming plugins needed v4-specific updates.

**Upgrade tool:** `npx @tailwindcss/upgrade`. "Most projects 1–2 hours; complex/custom-plugin projects up to a day." Run on a clean branch so you can revert+redo. (https://tailwindcss.com/docs/upgrade-guide.)

### Other named v3→v4 breaking behaviors
- Gradients: in v3, overriding part of a gradient with a variant **reset the whole gradient**; in v4 the other stops are **preserved** (behavioral change — can surprise existing hover-gradient code).
- `container` utility lost its `center`/`padding` config options (must replicate manually).
- `@tailwind` directives removed → must be `@import "tailwindcss"`.

---

## AGENT NOTES (operating Tailwind v4 as a bot)
- There is **no Tailwind MCP** specifically; the v4 IntelliSense/LSP is the editor-time aid. An agent edits `@theme` blocks in CSS, not a JS config — so the agent must know the `--color-*`/`--breakpoint-*`/`--font-*`/`--ease-*` token namespaces.
- `npx @tailwindcss/upgrade` is the deterministic migration entrypoint; `@tailwindcss/cli` exists for standalone builds.
- To verify a class actually generates: build and grep the output CSS (the heuristic content-detection means "it's in my JSX" ≠ "it generated").

## PIXEL IMPLICATIONS
- energy/react.md "no CSS modules, Tailwind utilities" stays valid. But the token-flow doc must change: tokens live in `@theme` (CSS), auto-exposed as CSS vars — perfect for the per-agent BRAND.md color story without a JS config.
- Pair v4.1 `mask-*` + v4.0 gradient utilities to kill gray-box placeholders (anti-slop).
- Use v4.2 muted palettes (mauve/taupe/olive) as candidates next to warm-black #141312 instead of loud defaults.
- `@starting-style` gives JS-free enter animations (lowest layer in pixel's animation stack).

## SOURCES
- https://tailwindcss.com/blog/tailwindcss-v4 (2025-01-21) — engine, CSS-first, plugins, perf numbers.
- https://tailwindcss.com/blog/tailwindcss-v4-1 (2025-04-01) — text-shadow, masks.
- https://tailwindcss.com/blog/tailwindcss-v4-3 (2026-05-08) — scrollbars, container-size.
- https://tailwindcss.com/docs/upgrade-guide — browser floors, upgrade tool, breaking behaviors.
- https://github.com/tailwindlabs/tailwindcss/discussions/16642 — JS-config-still-needed reality (maintainer quote).
- https://github.com/tailwindlabs/tailwindcss/discussions/15809 — plugin-driven migration errors.
- pockit.tools / designrevision.com migration guides (2026) — naming-convention + plugin gotchas.
- npm registry run 2026-06-11 — versions + dates.
