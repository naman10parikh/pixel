---
name: pixel-ship-gate
description: pixel's 7-step pre-merge ship gate (JOB-7). Use when asking "is this ready to merge / ship?" Encodes the gate IN ORDER (impeccable → axe → lhci → 12-dim → manual-a11y → security → visual), WCAG 2.2 AA (not 3.0), CWV 2026 (LCP 2.0s / INP 200ms / CLS 0.1), the +$1.2M CWV default-emit (S15), and the NEVER-an-a11y-overlay rule (S16, FTC-fined).
trigger: asked "is this ready to merge" or "ship it"; pre-merge review; final QA on a UI; a11y / CWV / security sign-off; before calling any UI done
allowed-tools: Bash(npx impeccable:*), Bash(npx playwright:*), Bash(npx lhci:*), Read, Grep
---

# pixel-ship-gate — the 7-step pre-merge gate (JOB-7 + O9 + S15/S16)

> **Stance:** "passes tests" ≠ accessible/secure/fast/non-slop. Automated a11y catches only ~30–40% of WCAG (O9) — green axe is the necessary FLOOR, not the sufficient gate. Run the 7 steps IN ORDER; a generated draft is untrusted until all 7 pass (O7).

## trigger
- "is this ready to merge / ship?"
- pre-merge review / final QA on any UI
- an a11y / CWV / security sign-off
- before you call ANY UI "done"

## The 7-step gate (IN ORDER — each is exit-code/binary)

1. **impeccable** — `npx impeccable detect --json <dir>/src` → exit 0, 0 slop violations (the anti-slop floor; keyless). See `pixel-anti-slop`.
2. **axe** — `@axe-core/playwright` injected on every route → **0 violations**.
3. **lhci** — `npx lhci autorun` against the **CWV 2026 budgets**: **LCP < 2.0s** (tightened from 2.5s, March 2026 — most write-ups still say 2.5), **INP < 200ms** (FID is DEAD), **CLS < 0.1**. CWV pass/fail is the **75th-percentile FIELD/RUM** number — treat Lighthouse as a proxy, RUM as truth (§7.2/§11.2: 43% of sites still fail INP).
4. **12-dim** — the design-systems V3 binary audit: **≥10/12**, NEVER "7/10" (O11). Either a dimension meets the bar or the fix is explicit.
5. **manual a11y** — keyboard nav + screen-reader + reduced-motion (the ~60–70% axe misses, O9). WCAG **2.2 AA** is the operative legal baseline (NOT WCAG 3.0 — not a Recommendation until ~2029). Add the new 2.2 criteria: **3.3.8 Accessible Authentication** (no cognitive test to log in; allow password managers/passkeys), **2.5.8 Target Size ≥24px** (keep the 44px house rule), **2.5.7 Dragging** (single-pointer alt), **2.4.11 Focus Not Obscured**.
6. **security** — generated UI is ~40–45% vulnerable (O7/§7.4): audit injected scripts, secrets, unused Server Actions exposing endpoints (§5.7), dependency surface.
7. **visual** — screenshot + READ it; `page.on('console')` → **0 hydration warnings** (O14/§0 #7). "It compiles" means nothing.

## The two NAMED traps the gate exists to catch

- **S15 / §11.1 🟡 the CWV default-emit (the money one).** AI emits the "heaviest, jankiest solution" — product pages at 4–5s LCP convert **40–50% lower** than at 2s; "53% of sites lose 8–35% of conversions when they fail CWV in 2026" (a documented +$1.2M A/B). Make the fix-set the DEFAULT emit: **hero `fetchpriority="high"` + explicit `width`/`height` + srcset, NOT lazy**; **below-fold images `loading="lazy"`**; **facade/lite pattern for chat/review/3rd-party widgets** (mount on interaction, not module-top); self-hosted `next/font` ≤2 weights + size-adjusted fallbacks; CSS `aspect-ratio`/`min-height`/`contain` to kill CLS.
- **S16 / §10.4 🔴 NEVER an accessibility OVERLAY widget — it's a silent LEGAL failure.** Overlays (accessiBe/UserWay/AudioEye-class JS) **cannot fix** heading structure, keyboard nav, form labels, semantic HTML, captions, or focus; screen readers conflict with them; scanners audit the underlying HTML. **FTC fined accessiBe $1M (Jan 2025)**; in H1-2025 **456 suits (22.6%) targeted sites *with* an overlay**. FIX: emit semantically correct HTML by default (`<button>`, `<label htmlFor>`) + remediate the source to WCAG 2.2 AA. Grep deps for overlay injectors → BLOCK.

## steps
1. Run steps 1–3 (the automated exit-code floor); any non-zero/violation = BLOCK.
2. Run the 12-dim binary audit (≥10/12) + the manual a11y pass.
3. Run the security audit + the visual/console proof.
4. Check the two named traps explicitly: hero has `fetchpriority`+dims & below-fold is lazy (S15); NO overlay dep present (S16).
5. **All 7 green → SHIP. Any fail → fix, re-run.** No "7/10".

## output
- A per-step pass/fail table (impeccable · axe · lhci-with-CWV-numbers · 12-dim score · manual-a11y · security · visual).
- The S15 check (hero priority + below-fold lazy + facade widgets) and S16 check (no overlay dep) explicitly marked.
- Verdict: **SHIP** (7/7) or **BLOCKED** (the failing step + the fix).

## verify
`npx impeccable detect --json <dir>/src` exits 0 AND deps grep for accessiBe/UserWay/AudioEye-class scripts is EMPTY (S16) AND the hero has `fetchpriority="high"`+`width`/`height` and is not lazy while below-fold images are `loading="lazy"` (S15).

## sources
brain/EXPERTISE-MAP.md JOB 7 · brain/OPINIONS.md O7, O9, O11, O14 · brain/KNOWN-PITFALLS.md §7.1–§7.4, §10.4, §11.1–§11.2 · BATTLE-TESTED S15, S16.
