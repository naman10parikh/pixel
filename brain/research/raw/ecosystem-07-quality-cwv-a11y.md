# Quality Gates — impeccable, Lighthouse, CWV, a11y — Ecosystem Research (pixel)

Researcher: ECOSYSTEM · Captured 2026-06-11 · Versions verified against npm.
These are the **audit gates** that make pixel a harness (taste-enforcing) rather than a code generator. The mission explicitly names `npx impeccable detect`.

## CURRENT VERSIONS (npm 2026-06-11)
- `impeccable` **2.3.2**; `lighthouse` **13.4.0**; `@lhci/cli` **0.15.1**; `@axe-core/playwright` **4.11.3**.

================================================================
## 1. IMPECCABLE — the anti-AI-slop detector (THE headline tool)
================================================================
`impeccable` by Paul Bakaus (@pbakaus) — *"The design language that makes your AI harness better at design."* **37.4k GitHub stars.** Site: https://impeccable.style. Repo: https://github.com/pbakaus/impeccable.

### What it is (multi-format)
**One skill, 23 commands**, deployable as: (a) a **Claude Code skill/plugin**, (b) a **standalone CLI** (deterministic, no LLM/API key), (c) a **browser extension**. Supports Claude Code, Cursor, OpenCode, Gemini CLI, Codex, VS Code Copilot, Kiro, Trae, etc.

### Install as a skill (agent path)
```bash
npx impeccable skills install     # auto-detects harness, installs the skill
```
→ **pixel should install this skill** — it's the executable form of energy/design.md's anti-pattern list, maintained externally and far more comprehensive.

### CLI commands (the build-gate surface)
```bash
npx impeccable detect src/                 # scan a directory
npx impeccable detect index.html           # scan a file (HTML/CSS/JSX/TSX/Vue/Svelte)
npx impeccable detect https://example.com  # scan a LIVE URL (via Puppeteer)
npx impeccable detect --json src/          # JSON output for CI
npx impeccable detect --fast .             # regex-only (skips jsdom; faster, less accurate)
npx impeccable pin <command>               # standalone shortcut
/impeccable <command> <target>             # in-harness (skill) usage
/impeccable critique                       # LLM-only richer critique (needs model)
/impeccable audit                          # LLM audit
```
- **41 deterministic detector rules** run with **no LLM, no API key**; provides **JSON output + exit codes for build gates**. The `/impeccable critique` + `/impeccable audit` commands add LLM-based analysis on top.
- Scans HTML, CSS, JSX, TSX, Vue, Svelte (jsdom for accuracy; `--fast` for regex-only).

### What it detects (maps 1:1 to energy anti-slop rules)
**AI-slop tells:** Inter-for-everything, **purple→blue gradients**, bounce/elastic easing, **dark glows**, **cards nested in cards**, **rounded-square icon tiles above every heading**, gray text on colored backgrounds, side-tab borders, **pure black/untinted gray**.
**General design-quality:** line length, cramped padding, small touch targets, skipped heading hierarchy.

> This is **exactly** energy/design.md's anti-patterns ("No generic AI purple/pink gradients", "warm black NOT pure black", "no symmetric card grids", "Phosphor weight hierarchy") — now a deterministic CI gate with an exit code. The single highest-leverage tool to wire into pixel's harness.

### pixel rule
- `npx impeccable detect --json src/` as a **pre-commit + CI gate** (fail the build on slop).
- Install `/impeccable` as a skill; run `/impeccable critique` in the design loop.
- Sources: https://github.com/pbakaus/impeccable ; https://impeccable.style ; https://x.com/pbakaus/status/2044505743144194514 (CLI announcement); https://www.claudepluginhub.com/plugins/pbakaus-impeccable. (All 2026.)

================================================================
## 2. CORE WEB VITALS — 2026 thresholds (CHANGED — flag the LCP tightening)
================================================================
Source: https://www.corewebvitals.io/core-web-vitals ; https://web.dev/articles/defining-core-web-vitals-thresholds ; digitalapplied/w3era/rivuletiq 2026 guides; https://developers.google.com/search/docs/appearance/core-web-vitals.

| Metric | Measures | "Good" (2026) | Note |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | loading | **< 2.0s** | **TIGHTENED from 2.5s → 2.0s in Google's March 2026 core update.** Most current write-ups still cite 2.5s — pixel should target **2.0s**. |
| **INP** (Interaction to Next Paint) | responsiveness | **< 200ms** | **INP fully replaced FID (FID is dead).** This is the one Next 16's React-Compiler memoization + leaf-`use client` directly help. |
| **CLS** (Cumulative Layout Shift) | visual stability | **< 0.1** | next/font (zero CLS), explicit image dimensions, reserve space for dynamic content. |

- Evaluated at the **75th percentile** of **real-user (field)** data — lab Lighthouse is a proxy, not the pass/fail. "Needs improvement" / "Poor" bands sit above each "good" line.
- **Caveat:** the 2.0s LCP tightening was reported by multiple 2026 SEO sources but I could not pin it to a single primary Google doc URL on 2026-06-11 — treat 2.0s as the safe target, 2.5s as the old floor. (FLAGGED in GAPS.)

### How pixel's stack helps each
- **LCP:** Next 16 streaming/PPR (static shell), `next/image` (defaults changed — quality now 75, minimumCacheTTL 4h), priority hints, Turbopack faster builds.
- **INP:** React Compiler memoization, push `'use client'` to leaves (ship less JS), `LazyMotion` (4.6KB not 34KB), avoid long tasks.
- **CLS:** `next/font` self-host, width/height on images, `@starting-style`/reserved space for late content.

================================================================
## 3. LIGHTHOUSE + AXE (the lab tools an agent runs)
================================================================
- **Lighthouse 13.4.0** — categories: Performance, Accessibility, Best Practices, SEO. Uses **axe-core** under the hood for a11y. **Hard limit:** Lighthouse/axe catch only **~30–40% of accessibility issues** — automation is necessary, NOT sufficient. (Source: accessibility-test.org; GoogleChrome/lighthouse#9507.)
- **Lighthouse CI** (`@lhci/cli` 0.15.1) — run Lighthouse in CI with **assertions + budgets** (fail build if LCP/score regresses). This is the perf gate.
- **`@axe-core/playwright` 4.11.3** — programmatic a11y assertions inside Playwright (energy bans Playwright *MCP*, allows Playwright *CLI*). An agent injects `axe` into a page and asserts zero violations.
- The **vercel-web-design** / **vercel-react-practices** Claude skills + energy's a11y skills (contrast-checker, use-of-color, link-purpose, refactor) cover the 60-70% axe can't.

================================================================
## 4. ACCESSIBILITY STANDARD — WCAG 2.2 (current legal baseline)
================================================================
Source: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ ; https://www.w3.org/TR/WCAG22/ ; testparty/deque 2026.

- **WCAG 2.2 Level AA is the operative legal standard** (ADA Title II, Section 508, EU Accessibility Act/EAA). Released 2023-10-05; superseded 2.1. **WCAG 3.0 is a Working Draft (latest March 2026), not a Recommendation until ~2029** — do NOT build to 3.0 yet; it will coexist with, not replace, 2.2.
- **9 new criteria in 2.2** pixel must add to its checklist (beyond energy's existing 44px-touch / focus-ring rules):
  - **2.5.8 Target Size (Min) (AA): ≥ 24×24 CSS px** for pointer targets (energy says 44px for mobile — 24px is the WCAG floor; keep 44px as the stricter house rule).
  - **2.5.7 Dragging Movements (AA):** any drag action must have a single-pointer non-drag alternative.
  - **2.4.11 Focus Not Obscured (Min) (AA):** focused element not fully hidden behind sticky headers/footers.
  - **2.4.13 Focus Appearance (AAA):** focus indicator sufficient size + contrast.
  - **3.2.6 Consistent Help (A):** help in consistent location across pages.
  - **3.3.7 Redundant Entry (A):** don't make users re-enter info already given.
  - **3.3.8 Accessible Authentication (Min) (AA):** **no cognitive-function test** (e.g. solving a puzzle, transcribing) required to log in — allow password managers/passkeys. Directly affects pixel's auth screens.
- These primarily help **cognitive disabilities + mobile**.

================================================================
## 5. THE PIXEL QUALITY-GATE STACK (synthesis — wire all of these)
================================================================
Pre-merge gate for any UI pixel ships (in order):
1. **`npx impeccable detect --json src/`** → exit-code gate (anti-slop + design-quality).
2. **`@axe-core/playwright`** on the running page → zero WCAG-2.2-AA violations (the ~30-40% machines catch).
3. **Lighthouse CI (`@lhci/cli`)** with budgets → LCP < 2.0s, INP < 200ms, CLS < 0.1, a11y ≥ 95.
4. **energy design-systems 12-dimension binary audit** → ≥ 10/12 (the taste layer machines can't).
5. **Manual a11y** (keyboard nav, screen reader, reduced-motion) for the 60-70% axe misses.
6. **Security review** (the 40-45% AI-code vuln rate from ecosystem-06).
7. **Visual proof** via Playwright CLI screenshots, read them (energy "test as a user").

## PIXEL IMPLICATIONS
- `impeccable` is the missing executable enforcer for energy's anti-slop taste — install the skill + wire the CLI gate. This is arguably the highest-value single ingest from this whole research set.
- Encode CWV targets at the **2026** values (LCP **2.0s**, INP 200ms, CLS 0.1) — not the stale 2.5s LCP.
- Encode **WCAG 2.2** (keep 44px touch as stricter-than-floor; add Accessible Authentication, Dragging, Focus-Not-Obscured to the checklist).
- Remember axe ≈ 30-40% coverage → manual a11y is mandatory, not optional.

## SOURCES
- https://github.com/pbakaus/impeccable (37.4k★) + https://impeccable.style + https://x.com/pbakaus/status/2044505743144194514 — impeccable skill/CLI, 41 rules.
- https://www.corewebvitals.io/core-web-vitals + web.dev/defining-core-web-vitals-thresholds + digitalapplied/rivuletiq (2026) — CWV thresholds, LCP 2.0s tightening, INP replaces FID.
- https://www.w3.org/TR/WCAG22/ + https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ + testparty/deque (2026) — WCAG 2.2 9 new criteria, legal status, 3.0 timeline.
- accessibility-test.org + GoogleChrome/lighthouse#9507 — axe ~30-40% coverage limit.
- npm registry run 2026-06-11.
