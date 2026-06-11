# Field Intel 06 — What Changed in 2026 That Invalidates 2025 Wisdom

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · Started 2026-06-11 · Repo ~/pixel
Scope: The deltas between the energy bible's snapshot (March 2026 / 700 sources) and the June-2026
field. Where a 2025 convention is now stale, dangerous, or actively a slop-tell. Each delta names the
OLD wisdom, the NEW reality, the source, and what pixel should do.

> Why this file exists: the energy frontend-bible-2026.md is excellent but it's a *snapshot*. A
> flagship harness that treats a snapshot as eternal will calcify. This file is the explicit
> "the bible is stale HERE" ledger — additive, with receipts, so pixel's brain knows what to override.

---

## DELTA 1 — Native CSS now does what JS libraries did (the "let the browser do the work" shift)
Sources: "CSS in 2026" LogRocket, **2026-01-21**; "CSS in 2026: 7 Features That Let the Browser Do
the Work", Southwell Media, 2026; "2026 CSS Features You Must Know", Riad Kilani, 2026; web.dev "New to
the web platform in May" 2026; MDN anchor-positioning / container-queries.
(https://blog.logrocket.com/css-in-2026/)
(https://www.southwellmedia.com/blog/css-2026-7-features-that-let-browsers-do-the-work)

**OLD wisdom (2025 / energy bible):** reach for JS — Floating UI/Popper for positioning, GSAP +
IntersectionObserver for scroll, custom React components for styled selects, manual `--index` for
stagger.

**NEW reality (mid-2026):**
- **Customizable `<select>`** (`appearance: base-select` + `::picker(select)`): verbatim — *"the native
  accessibility and semantics of a real `<select>` with the kind of styling flexibility we previously
  only got from JavaScript-powered components."* → eliminates ~150+ lines of dropdown JS, keyboard nav,
  focus mgmt, overflow, anchor-fallback all native.
- **`sibling-index()` / `sibling-count()`**: native staggered animations without hardcoded
  `:nth-child()` delays or manual `--index` props.
- **Typed `attr()`**: data-driven styling (color/length from HTML attrs) with no JS binding.
- **`@starting-style`**: clean enter transitions without JS transition-initialization.
- **CSS Anchor Positioning** (Chrome/Edge/Opera 125+, Safari behind flag early-2026): tether tooltips/
  popovers/menus declaratively with fallback positions → reduces (not yet fully replaces, pending
  Safari) the Floating-UI dependency. NOTE: this matters because Base UI (field-02) standardizes on
  Floating UI — native anchor positioning is the longer-term escape hatch.
- **Scroll-driven animations** (`animation-timeline: scroll()/view()`, compositor thread): already in
  the bible, but now joined by `@scope` (kill global-CSS leakage), container **scroll-state** queries
  (sticky/snap state), `::scroll-button()`/`::scroll-marker`. CSS `if()` adds conditional property
  values without JS.

CAVEAT (the honest part): LogRocket flags most of these as *"very new and still rolling out"* (Chrome
135+), and recommends *"conservative production rollout pending broader browser-support stabilization."*
Anchor positioning + customizable select are NOT yet Baseline across Safari.

→ PIXEL RULE: prefer the native CSS primitive when its support floor meets the product's browser matrix
(it often does for evergreen-Chrome internal tools; check Safari for public sites). This SHARPENS the
bible's "use the lowest layer that solves the problem" — in 2026 the lowest layer reaches *higher* than
it did in 2025. Don't reflexively `npm i @floating-ui/react` or pull GSAP for a stagger that
`sibling-index()` now does. But gate on Baseline status per surface — don't ship anchor-positioning to
a Safari-heavy audience yet.

## DELTA 2 — Inter is now a SAMENESS TELL, not a safe default (typography)
Sources: Juan Mantz, "Inter: how designers are slowly stripping away your brand's soul with a font",
Bootcamp/Medium, **2024-10-09** (flagged older but the thesis went mainstream in 2026 — corroborated by
Creative Boom "15 typefaces designers love in 2026" and madegooddesigns "Inter ... #1 UI typeface of
2026" which itself concedes the ubiquity problem).
(https://medium.com/design-bootcamp/inter-how-designers-are-slowly-stripping-away-your-brands-soul-with-a-font-fcf58ee1deaf)

**OLD wisdom (energy bible, §Typography):** lists Inter first among "Notable 2026 UI fonts" — i.e.,
treats it as a fine default.

**NEW reality:** Inter's ubiquity has become its liability. Verbatim (Mantz):
> *"Inter is the black t-shirt of fonts. It works well with almost anything, thanks for dulling it down
> for all of us."*
> *"I could actually wallpaper my office with SaaS screenshots, and it would create a homogeneous
> mosaic."*
> *"Versatility has two opposing aspects: being adaptable and flexible to your surroundings, but also
> failing to identify with any one thing distinctly."*
2026 consensus (Creative Boom et al.): two pulls — neutral grotesques that "get out of the way" for
docs/product, vs "a growing appetite for typefaces with genuine personality... texture, cultural
weight, and a point of view." When EVERY SaaS uses Inter, Inter reads "template," not "designed."

→ PIXEL RULE: this is the typography case of field-01's slop catalog. The bible's OWN "Anti-AI fonts"
list (Instrument Serif, Source Serif 4, Newsreader, Outfit, Sora) is the *correct* 2026 instinct, and
energy's design.md already mandates **Instrument Serif + Poppins** — which is RIGHT. pixel should treat
"Inter for everything" as a slop signal (consistent with field-01), reserve neutral grotesques for
get-out-of-the-way product/doc UI, and use a serif/personality face for display to break the SaaS
mosaic. UPDATE the bible's framing: Inter is a *neutral-by-design* choice, not a *distinctive* one —
and distinctiveness is the 2026 differentiator.

## DELTA 3 — shadcn's primitive moved Radix → Base UI (component layer)
(Full detail in field-02 §3.) **OLD:** bible says "shadcn/ui (Radix primitives)" is settled +
non-negotiable. **NEW (Feb 2026):** shadcn ships a unified Radix package AND a Base UI migration path;
`asChild` is GONE in Base UI (render props instead); Select restructures (`Positioner`/`Popup`);
positioning via Floating UI. Source: shadcn changelog 2026-02 + Discussion #9562.
→ PIXEL RULE: "Radix primitives" is a 2025 truth. Track "shadcn-on-Base-UI" as current; never write new
code assuming `asChild` exists on the new primitive.

## DELTA 4 — Next.js caching flipped from implicit → explicit (data layer)
(Full detail in field-02 §1c.) **OLD:** Next 14/15 cached aggressively by default. **NEW (Next 16):**
*nothing is cached unless you add `'use cache'`*; the upgrade can silently 2–3x origin traffic + cloud
bill (vercel/next.js #85470). `middleware.ts`→`proxy.ts` (nodejs-only, no edge). Source: Next v16 guide
+ SquaredTech 2026-05-28.
→ PIXEL RULE: on Next 16 surfaces, caching is opt-IN. Emit `'use cache'` deliberately on stable data;
never assume the old implicit cache. This is the single biggest behavioral change of the year.

## DELTA 5 — RSC is contested, not the assumed default (architecture)
(Full detail in field-05 §3.) **OLD:** "RSC is React's future, use it everywhere." **NEW (State of
React 2025, reported 2026-02-18, 3,700+ devs):** significant "completely not interested" sentiment;
Remix 3 dropped React over RSC/`use client`/hydration complexity; RSC is a *"poor fit for interfaces
dominated by continuous client-side interaction."* Source: devclass/The Register 2026-02.
→ PIXEL RULE: match RSC to interaction profile (content/nav-heavy = yes; realtime/design-tool/heavy
client = no). Not a dogma.

## DELTA 6 — AI builders matured; v0 went full-stack; Figma-to-code is a STEP, not the workflow
Sources: "2026 AI App Builder Guide: v0 vs Bolt vs Lovable", WeavAI **2026-05-12**; Lovable guides 2026;
Anna Arteeva "Choosing your AI prototyping stack" 2026.
(https://weavai.app/blog/en/2026/05/12/2026-ai-app-builder-guide-v0-vs-bolt-new-vs-lovable/)

**OLD wisdom (2025):** v0 = a UI component generator; design happens in Figma, then hand-off.
**NEW reality (2026):**
- **v0 rebranded v0.dev → v0.app (Jan 2026)**, now positioned around full-stack — but still
  **frontend-first** (polished React/Tailwind, Figma-to-code; no native backend/db/auth — you add
  those). v0 "dominates the frontend field with top-tier UI design quality."
- **Bolt Cloud** (mid-2025) added native hosting/db/auth/SEO to Bolt.
- **Lovable** hit **$20M ARR in 2 months** (fastest in European startup history) on full-stack
  React+Supabase with **Visual Edits that don't consume credits**.
- On Figma: NOT dead — the live pattern is *"convert my Figma into code with Figma MCP in Cursor, then
  continue building in Lovable."* Figma is an *input node*, not the destination.

→ PIXEL RULE (identity-relevant): pixel is a *code-emitting design-engineering* harness, which is
exactly the direction the whole tool category moved — design-in-code, Figma-as-input. The 2026 bar is
"v0-quality UI output." pixel should (a) treat Figma/MCP as an optional input, not a required step, and
(b) benchmark its visual output against v0's "top-tier UI design quality" bar, since that's now the
market's reference point for AI-generated frontend.

---

## Sources (this file)
- https://blog.logrocket.com/css-in-2026/ — 2026-01-21 (PRIMARY, native-replaces-JS)
- https://www.southwellmedia.com/blog/css-2026-7-features-that-let-browsers-do-the-work — 2026
- https://blog.riadkilani.com/2026-css-features-you-must-know/ — 2026
- https://web.dev/blog/web-platform-05-2026 — Baseline updates May 2026
- https://medium.com/design-bootcamp/inter-...-stripping-away-your-brands-soul... — Juan Mantz, 2024-10-09 (thesis mainstream in 2026)
- https://www.creativeboom.com/resources/15-typefaces-designers-cant-stop-using-or-admiring-in-2026/ — 2026
- https://ui.shadcn.com/docs/changelog/2026-02-radix-ui — Radix→Base UI (Feb 2026)
- https://nextjs.org/docs/app/guides/upgrading/version-16 — Next 16 caching flip
- https://www.devclass.com/development/2026/02/18/...react-is-here-to-stay/4091379 — State of React 2025
- https://weavai.app/blog/en/2026/05/12/2026-ai-app-builder-guide-v0-vs-bolt-new-vs-lovable/ — 2026-05-12 (PRIMARY, AI builders)
