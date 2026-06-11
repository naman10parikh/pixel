---
title: "pixel — Gaps and Disputes"
type: synthesis
created: 2026-06-11
updated: 2026-06-11
tags: [gaps, disputes, unconfirmed, experiments, open-questions]
sources: ["research/raw/ecosystem-02-tailwind-v4.md", "research/raw/ecosystem-03-shadcn-radix.md", "research/raw/ecosystem-05-rsc-patterns.md", "research/raw/ecosystem-06-mockup-v0-tools.md", "research/raw/ecosystem-07-quality-cwv-a11y.md", "research/raw/ecosystem-99-REPORT.md", "research/raw/ecosystem-00-INDEX.md"]
related: ["[[EXPERTISE-MAP]]", "[[OPINIONS]]", "[[KNOWN-PITFALLS]]", "[[TOOL-MATRIX]]", "[[MOC - pixel]]"]
summary: "Where sources disagree (both sides given), where no good source exists (the employee must form its own view via experiments), and what could NOT be confirmed — including the absence of a second FIELD-practitioner research pass."
---

# pixel — Gaps and Disputes

> Intellectual honesty layer. Three kinds of entry: **[DISPUTE]** sources conflict — both sides stated, with pixel's working posture; **[UNCONFIRMED]** a claim pixel acts on but could NOT pin to a primary source; **[GAP]** no good source exists — pixel must form its own view **via experiment** (the DSIP loop's job). Each experiment-gap has a concrete probe a pixel agent can run to close it. Resolve these in the nightly `refresh-brain` + `re-verify-tool-matrix` DSIP step and write results back to [[KNOWN-PITFALLS]]/[[OPINIONS]].

---

## §1 — [DISPUTE] Tailwind v4 Firefox browser floor: 111 vs 128
- **Side A (Tailwind's own upgrade guide):** Safari 16.4 / Chrome 111 / **Firefox 128** — note Firefox is *higher* than Chrome.
- **Side B (multiple 2026 secondary write-ups):** Firefox **111** (matching Next 16's own floor of Chrome/Edge/Firefox 111).
- **Why unresolved:** the ECOSYSTEM researcher could not reconcile this from a single authoritative Tailwind page cleanly quotable on 2026-06-11.
- **pixel's working posture:** treat **Firefox 128 as the safe Tailwind-v4 floor** (the stricter number); if older Firefox support is required, stay on Tailwind v3.4. The binding constraint across the stack = whichever floor is higher.
- **Probe to close:** test a representative pixel build (uses `@property`, `color-mix()`, cascade layers) on Firefox 111 vs 128; if it renders correctly on 111, downgrade the floor claim. [ecosystem-02, ecosystem-99]

## §2 — [DISPUTE / JUDGMENT] shadcn primitives: Radix (now) vs Base UI (the signaled future)
- **Side A (stay Radix):** de-facto default, most-tested shadcn surface, unified `radix-ui` package = clean deps, `asChild` composition intact. Community migration guide #9562 has **34 👍 but 0 official comments** — momentum, not an official default.
- **Side B (go Base UI):** it's shadcn's *intended future* (CLI v4 already ships `--base base-ui`), from overlapping Radix/Floating-UI/MUI authors. But the move **removes `asChild`** (global refactor), changes forms (`Field`), and positioning (Floating UI → popover/tooltip behavior differs).
- **Why unresolved:** shadcn has signaled Base UI as the direction but has NOT made it the default style; the verdict is a reasoned recommendation, not a vendor default.
- **pixel's working posture (→ [[OPINIONS]] O3):** **Radix now, Base UI on the watch-list.** Re-evaluate the instant shadcn flips the *default* style to Base UI.
- **Probe to close:** watch `ui.shadcn.com/docs/changelog` for "Base UI is now the default style"; when it lands, scope the `asChild` migration cost (`grep -rc asChild src/`) before adopting. [ecosystem-03, ecosystem-10]

## §3 — [UNCONFIRMED] The LCP 2.5s → 2.0s tightening (Google March 2026 core update)
- **Claim pixel acts on:** "Good" LCP tightened from **2.5s → 2.0s** in Google's March 2026 core update.
- **Evidence quality:** reported consistently across several 2026 SEO sources (corewebvitals.io, digitalapplied, w3era, rivuletiq) BUT could NOT be pinned to a single primary Google/web.dev doc URL on 2026-06-11 — web.dev's threshold-definition article still frames 2.5s.
- **pixel's working posture (→ [[KNOWN-PITFALLS]] §7.2):** target **2.0s** (the safe, stricter number); treat 2.5s as the old floor. INP 200ms and CLS 0.1 are NOT disputed; FID is dead (fully replaced by INP).
- **Probe to close:** re-fetch web.dev/articles/defining-core-web-vitals-thresholds + Google Search Central CWV docs; if a primary source confirms 2.0s, promote it from UNCONFIRMED to fact in KNOWN-PITFALLS. [ecosystem-07, ecosystem-99]

## §4 — [GAP] Which Tailwind-v4 integration path does `create-next-app` wire under Next 16 + Turbopack?
- **The gap:** Tailwind v4.2 shipped a first-class **webpack plugin** for "a huge perf boost in frameworks like Next.js" — but Next 16 defaults to **Turbopack, not webpack**. It's unclear from the research whether `create-next-app`/`shadcn init` wire Tailwind via PostCSS, the webpack plugin, or a Turbopack-native path — and issue **#81763** ("Turbopack removes styles from Tailwind/DaisyUI") means the answer is load-bearing.
- **No good source:** neither the Tailwind nor Next docs cleanly state the Turbopack+Tailwind-v4 wiring as of 2026-06-11.
- **pixel must form its own view — EXPERIMENT:** scaffold `pnpm dlx shadcn@latest init -t next --base radix`, inspect what got wired (`postcss.config.*` vs `@tailwindcss/vite` vs webpack-plugin), then **build under Turbopack and assert a Tailwind utility actually applied** (computed style + grep output CSS). Record the working wiring in [[TOOL-MATRIX]] + [[KNOWN-PITFALLS]] §6.1. This is a Wave-S golden task ([[BATTLE-TESTED-SCENARIOS]] S4). [ecosystem-02, ecosystem-05]

## §5 — [JUDGMENT] cacheComponents per-route posture is a recommendation, not a vendor default
- **The gap:** "adopt `cacheComponents` per-route + Suspense-wrap, never global" is pixel's reasoned verdict ([[OPINIONS]] O2) driven by the live bug cluster (#85490/#85390/#89754/#86577/#92152) — Vercel does NOT document "use it per-route." The vendor framing is "turn it on."
- **pixel's working posture:** hold the per-route + mandatory-`<Suspense>` line until the bug cluster demonstrably resolves; pin the issues.
- **Probe to close:** track issue status on the five pinned issues; when the cluster closes on a patch line pixel runs, re-test a *global* `cacheComponents: true` against the Clerk/Portal/CSP/Activity cases and, if clean, relax O2. [ecosystem-05, ecosystem-10]

## §6 — [GAP] No official v0 MCP server; exact v0 model id/tier unconfirmed
- **The gap:** the agent interface for v0 is the **`v0-sdk`** (`v0.chats.create`); there is **no official v0 MCP server** as of 2026-06-11. Model ids `v0-1.5-md`/`v0-1.5-lg` come from the AI-SDK Vercel provider docs, NOT the `v0-sdk` readme — the precise current model version string and whether a `-sm` tier exists could not be confirmed from primary docs.
- **pixel's working posture:** drive v0 via the SDK (not an MCP); pin model ids loosely and re-verify. Treat any v0 output as untrusted draft regardless of model ([[OPINIONS]] O7).
- **Probe to close:** `npm view v0-sdk` + re-read the v0 Platform API changelog for an MCP announcement and the current model list; update [[TOOL-MATRIX]] if either appears. [ecosystem-06, ecosystem-99]

## §7 — [GAP — STRUCTURAL] No independent FIELD-practitioner research pass exists
- **The gap (most important meta-gap):** the Wave-R brief named **two** researchers — an ECOSYSTEM pass (`ecosystem-*.md`, 12 files, present) **and** a FIELD pass (`field-*.md`). As of synthesis (2026-06-11) **no `field-*.md` files were written** — only the ECOSYSTEM set exists. So this brain is grounded in: official docs/changelogs, the npm registry, and **GitHub-issue engagement** (reactions/comments) — which is excellent for *what breaks* — but it is **NOT** grounded in independent first-person practitioner field reports (real teams describing what they actually do day-to-day: folder structure conventions, when they reach for a server action vs a route handler in practice, how they actually organize a large App Router app, real-world INP regressions from specific component patterns, designer↔dev handoff friction beyond the Figma-MCP caveat).
- **Consequence:** the scenarios in [[BATTLE-TESTED-SCENARIOS]] skew toward *framework bugs* (GitHub issues) rather than *human-process* failure modes. The taste stances in [[OPINIONS]] are well-sourced; the *organizational/architectural* opinions (how to structure a 200-route app, monorepo boundaries in practice) are thinner.
- **pixel must form its own view — EXPERIMENT/INTAKE:** (a) run the JOB-8 nightly ecosystem watch on X/HN/Reddit for first-person practitioner threads and feed `research/raw/field-*.md`; (b) mine the four reference repos (next-app-router-playground, ai-chatbot, next-forge, ixartz boilerplate) for *actual* folder/structure conventions and record them as field evidence; (c) every real bug pixel hits in its own builds becomes a new battle-tested scenario. This is exactly the DSIP `externalIntelligence` + self-improve loop's job.
- **Verdict driver:** this is the single biggest reason the research-quality verdict is **good-enough-but-needs-deepening** rather than fully complete. [ecosystem-00, ecosystem-99]

## §8 — [GAP] Tailwind has no MCP; the animation stack has no first-party MCPs
- **The gap:** there is no Tailwind MCP, and no first-party MCP for GSAP/Motion/Lenis/Rive/Three — an agent operates all of these by **editing code + verifying visually**. The only agent aids are the Tailwind IntelliSense/LSP (editor-time, not agent-usable) and a *community* `motion` Claude skill (secondsky/jezweb claude-skills on Tessl/agentskills registries).
- **pixel's working posture:** accept "edit-code + screenshot-verify" as the operating mode for these; ingest the community `motion` skill into `skills/`. There is no gap to *fix* here — it's a constraint to *encode* (see [[TOOL-MATRIX]] "no-MCP" column).
- **Probe to close:** monthly check for a first-party Tailwind/Motion MCP; ingest the community motion skill now. [ecosystem-04, ecosystem-09]

## §9 — [GAP] design-systems skill + impeccable rule overlap not de-duplicated
- **The gap:** energy's `design.md` anti-patterns, the `frontend-bible-2026.md` taste rules, AND impeccable's 41 detector rules **overlap heavily** (purple gradients, pure-black, cards-in-cards, rounded-icon-tiles all appear in multiple places). The research notes the 1:1 mapping but does not say which is *authoritative* when they drift, or what impeccable's 41 rules are *beyond* the ~9 named slop tells.
- **pixel must form its own view:** treat **impeccable as the executable enforcer** (it has exit codes and is externally maintained) and the design-systems 12-dim binary audit as the *taste* layer machines can't catch; when they disagree, the human-facing 12-dim audit wins on subjective calls, impeccable wins on the deterministic ones. Enumerate impeccable's full rule set by running `npx impeccable detect` on a known-slop fixture and reading the JSON.
- **Probe to close:** run `npx impeccable detect --json` against an intentionally-sloppy component, capture the full rule list, and reconcile it against `design.md` in [[OPINIONS]]. [ecosystem-07]

## §10 — [UNCONFIRMED] Whether pixel's `.mcp.json` additions actually load in this harness
- **The gap:** the research recommends adding **Next DevTools MCP + shadcn registry MCP + Figma Dev Mode MCP** to pixel's `.mcp.json` (currently only github/context7/memory/obsidian). It is unconfirmed that these MCP servers exist as installable packages with the exact config shape the harness expects (the research cites docs URLs, not npm package names for the Next DevTools / Figma MCPs).
- **pixel's working posture:** treat the three additions as **Wave-P intake tasks** (verify the package/command, add to `.mcp.json`, test the connection) — not assumed-working. The Figma MCP also needs the Figma desktop app + Dev Mode; the Next DevTools MCP ships *with* Next 16 (per `nextjs.org/docs/app/guides/mcp`) so it's the most likely to "just work."
- **Probe to close:** for each, find the actual install command, add to `.mcp.json`, and confirm the server connects (list its tools). Record env/secret needs in [[TOOL-MATRIX]]. [ecosystem-09]

---

## Disposition for Wave P / Wave S
- **Block a secret/wiring task (Wave P):** §6 (v0 SDK key), §10 (3 MCP installs + Figma/GitHub tokens).
- **Become a golden eval task (Wave S):** §4 (Turbopack+Tailwind renders), §9 (impeccable rule reconciliation).
- **Stay on the nightly watch (DSIP):** §1, §2, §3, §5, §8 — re-verify and promote/relax as primary sources land.
- **Drive a research re-spawn:** §7 — commission the missing FIELD pass; it's the biggest single quality lever.

## Sources
All entries trace to the ECOSYSTEM researcher's own flagged uncertainties (`ecosystem-99-REPORT.md` "3 THINGS I COULD NOT CONFIRM" + in-file GAP/JUDGMENT flags in `ecosystem-02/03/05/06/07`) plus the structural observation that the `field-*.md` set was never produced. Honesty over completeness — see [[OPINIONS]] for the stances pixel holds *despite* these gaps.
