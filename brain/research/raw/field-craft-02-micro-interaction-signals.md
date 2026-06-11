# Field Intel 02 — Micro-Interaction Craft Signals (Explicit Taste)

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · 2026-06-11 · ~/pixel
Scope: The *specific, opinionated* craft rules that separate a design-engineer interface from a
generic one. These are the "invisible details" — the things average practitioners skip and great
ones obsess over. Heavy verbatim quoting so pixel can encode them as enforceable lint rules.

> This is the POSITIVE-SPACE complement to field-craft-01 (which lists what to avoid). Here: what to DO,
> from people whose interfaces are the reference standard (Rauno Freiberg/Vercel, Emil Kowalski/
> Vercel, the Vercel Web Interface Guidelines).

---

## 1. Rauno Freiberg — Web Interface Guidelines (interfaces.rauno.me)

Rauno is Staff Design Engineer at Vercel (prev. The Browser Company / Arc). His guidelines are the
single densest list of "invisible details" in the field. The Vercel team's official "Web Interface
Guidelines" descend from this work. VERBATIM rules worth encoding:

### Focus & hit targets
- *"Clicking the input label should focus the input field."* (use `<label htmlFor>` / wrap)
- *"Interactive elements in a vertical or horizontal list should have no dead areas between each
  element; instead, increase their padding."* ← the "no dead zones" rule. Average devs leave gaps
  with margin; craft devs use padding so the whole row is clickable.
- *"Box shadow should be used for focus rings, not outline which won't respect [border] radius."*
  ← CRAFT SIGNAL. `outline` ignores `border-radius` and clips square on rounded elements. Use
  `box-shadow: 0 0 0 2px <ring>` (or `:focus-visible` + ring). This is a top tell of taste.
- *"Focusable elements in a sequential list should be navigable with ↑ ↓"* and
  *"deletable with ⌘ Backspace."* ← keyboard-first list semantics.

### Animation timing (the heart of "feels good")
- *"Animation duration should not be more than 200ms for interactions to feel immediate."*
  ← TIGHTER than the energy bible's 200–500ms "sweet spot." Reconcile: 200ms is the ceiling for
  *direct-manipulation* feedback (button press, toggle); 200–500ms is for *transitions/reveals*
  (page/section). Use the lower bound for interaction, upper for transition.
- *"Animation values should be proportional to the trigger size"* — scale **dialogs from ~0.8**,
  **buttons from ~0.96–0.9**, not extreme ranges. ← a button that scales from 0 looks broken; a
  dialog that scales from 0.96 looks like nothing happened. Match the spring to the element.
- *"Avoid animations on frequent, low-novelty actions"* — right-click menus, list add/delete, trivial
  button hovers. ← MOTION RESTRAINT. Animate the novel, not the repeated. (Matches Pentagram's
  "deliberate restraint" in the energy bible.)

### Inputs (the iOS gotcha cluster — all real-device bugs)
- *"Font size for inputs should not be smaller than 16px to prevent iOS zooming on focus."*
  ← classic mobile bug: <16px input font triggers Safari auto-zoom. Encode as a hard min.
- *"Inputs should not auto focus on touch devices as it will open the keyboard and cover the screen."*
- *"Inputs should disable spellcheck and autocomplete attributes most of the time."* (emails, codes,
  usernames)
- *"Input prefix and suffix decorations (e.g. $, search icon) should be absolutely positioned on top
  of the text input with padding, not placed next to it."* ← so the actual `<input>` keeps full hit
  area and the caret aligns.

### Hover vs touch (don't ship desktop hover to phones)
- *"Hover states should not be visible on touch press; use `@media (hover: hover)`."* ← sticky-hover
  bug: on touch, `:hover` latches after tap. Gate ALL hover styling behind `@media (hover: hover)`.
- *"Disable the default iOS tap highlight with `-webkit-tap-highlight-color: rgba(0,0,0,0)`."*

### Disabled / submission states
- *"Buttons should be disabled after submission to avoid duplicate network requests."* ← double-submit
  is a real production bug; disable + show pending state.
- *"Disabled buttons should not have tooltips, they are not accessible."* (disabled elements don't
  receive focus/hover events reliably → tooltip never reachable by keyboard).

### Scroll
- *"Use `scroll-behavior: smooth` for navigating to in-page anchors, with an appropriate offset"*
  (offset so the target isn't hidden under a sticky header — `scroll-margin-top`).

## 2. The recurring "tells of craft" (synthesized into a checklist for pixel)

These are the binary signals a reviewer can grep for. Presence/absence separates craft from slop:

1. Focus rings via `box-shadow`/ring, NEVER raw `outline` on rounded elements.
2. Hover styles wrapped in `@media (hover: hover)`.
3. Input font-size ≥ 16px on mobile.
4. `-webkit-tap-highlight-color` neutralized.
5. Interaction feedback ≤ 200ms; transitions 200–500ms; only `transform`/`opacity`.
6. Spring/scale origin proportional to element (0.96 buttons, ~0.8 dialogs).
7. No animation on high-frequency low-novelty actions.
8. Buttons disable on submit; no tooltips on disabled controls.
9. Sticky-anchor scroll uses `scroll-margin-top` offset.
10. No dead zones in lists — pad the row, don't margin the gap.
11. `tabular-nums` / `font-variant-numeric: tabular-nums` on changing numbers (counters, timers,
    money) so digits don't jitter width. (Standard Vercel-guideline craft signal; cross-ref energy
    `make-interfaces-feel-better` skill which lists tabular numbers explicitly.)
12. Optical alignment over mathematical centering (icons inside buttons nudged, not geometric-center).

## 3. Where this DISAGREES with the energy bible (for GAPS-AND-DISPUTES)
- **Animation timing:** Rauno says **≤200ms** for interactions; energy bible says **200–500ms sweet
  spot**. Not a contradiction once split by *interaction vs transition*, but pixel's rule file should
  state BOTH bounds explicitly to avoid a worker splitting the difference at a sluggish 350ms button.
- **prefers-reduced-motion:** bible says "minimize, don't eliminate all"; Rauno's instinct ("avoid
  animation on frequent actions") pushes toward *less motion by default even without the pref*. Both
  agree restraint > maximalism.

## Sources (this file)
- https://interfaces.rauno.me/ — Rauno Freiberg, Web Interface Guidelines (living doc, Vercel-adjacent;
  underlies the official Vercel Web Interface Guidelines). Accessed 2026-06-11.
- https://ui.land/interviews/rauno-freiberg — interview (Disney follow-through principle, robustness)
- Cross-ref energy read-only: `.claude/skills/make-interfaces-feel-better` (tabular nums, optical
  alignment, stagger) and `vercel-web-design` skill (Web Interface Guidelines compliance).
