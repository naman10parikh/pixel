# Field Intel 05 — Explicit TASTE (Opinions Great Practitioners Hold That Average Ones Don't)

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · 2026-06-11 · ~/pixel
Scope: Verbatim opinions from the people whose work IS the reference standard. These are the
"never X / always Y, here's why" judgments that average devs don't internalize. Heavy quoting so
pixel can cite the authority, not just assert.

---

## 1. Emil Kowalski (animations.dev, ex-Vercel; built Sonner + Vaul) — "Great Animations"

Source: https://emilkowal.ski/ui/great-animations (essay; course "Animations on the Web", 11,000+
participants since Jan 2024). The most-cited modern web-animation taste source. Verbatim:

- **Easing — ease-out is the default, NOT ease-in-out or linear.** *"ease-out … starts fast and slows
  down at the end, which gives the impression of a quick response."* For elegance specifically he uses
  plain `ease` (e.g. in Sonner) — *"feels more elegant."* ← AVERAGE devs default to `ease-in-out` or
  the browser `linear`; GREAT devs reach for `ease-out` for responsiveness.
  → ANTI-PATTERN implied: `ease-in` on entering elements (slow start = feels laggy); `linear` on UI
  (feels mechanical).
- **Duration — under 300ms.** *"shorter than 300ms"* is the sweet spot. A 500ms enter (his Raycast
  counter-example) *"would feel frustrating."*
- **Spring > duration-based.** *"I highly suggest playing around with spring animations."* Duration-
  based motion feels *"artificial and unfamiliar"*; springs feel natural.
- **NEVER animate keyboard-initiated actions.** VERBATIM: *"These actions are repeated sometimes
  hundreds of times a day, an animation would make them feel slow."* ← THE taste rule average devs
  miss: frequency determines whether to animate. (Converges exactly with Rauno's "avoid animation on
  frequent, low-novelty actions.")
- **Interruptibility is mandatory.** Animations should be *"interruptible"* — user can change state
  mid-animation *"while maintaining a smooth transition."* A non-interruptible animation that blocks
  re-trigger is a tell of low craft.
- **Don't over-animate.** *"the user then becomes overwhelmed."* Restraint, again.
- **60fps non-negotiable; `transform`+`opacity` only**, avoid padding/margin (triggers layout).
  Respect `prefers-reduced-motion` — *"Animations can make people feel sick or get distracted."*

**Two-source convergence (Emil + Rauno) — the strongest signal in this whole research set:**
Both independently say *animate the novel, never the frequent/repeated*. This is the single highest-
confidence taste rule pixel can adopt. Frequency-gating motion is what separates craft from "animate
everything because Framer Motion makes it easy."

## 2. Rauno Freiberg (Staff Design Engineer, Vercel) — taste beyond the rules in field-craft-02

- **Robustness over polish.** (ui.land interview) *"most interactions are brittle and fail under
  real-world stress. Core interactions like scrolling, text input, and navigation must always work
  perfectly."* ← TASTE INVERSION: average devs add a flashy hero animation; great devs first guarantee
  scroll/input/nav never break. Craft = the boring core is bulletproof.
- **Disney's "Follow-Through and Overlapping Action" applied to UI** — his favorite principle. Motion
  has physical continuation; elements don't stop instantly. (Why springs > linear.)
- **Outline vs box-shadow focus ring** (field-craft-02) is his most-quoted micro-taste: `outline` clips
  square on rounded corners; use `box-shadow`. A reviewer can spot taste in 2 seconds by this alone.

## 3. Stripe — "the detail standard" (energy bible, corroborated)

- Spends *"20x more time on design details"* than typical companies.
- CEO rewrote code to make typing-indicator delays RANDOM, not uniform 100ms, because uniform felt
  *"too automatic."* ← TASTE: fixed intervals read as robotic; randomized timing reads as alive. pixel
  rule: jitter repeated/sequential delays (stagger), never fixed identical intervals.
- Custom CIELAB tooling for perceptually-uniform accessible color (→ why OKLCH, not raw HSL).

## 4. The cross-cutting taste principles (synthesized, each with a "because")

1. **Frequency-gate motion.** Animate novel transitions; never animate hundreds-of-times-a-day
   actions. *Because* repetition turns delight into drag. (Emil + Rauno — 2-source.)
2. **ease-out for response, spring for life, never linear/ease-in on UI.** *Because* perceived
   responsiveness comes from a fast start. (Emil.)
3. **The boring core must be unbreakable before any flourish.** *Because* a broken scroll destroys
   trust no animation can buy back. (Rauno.)
4. **Randomize/stagger repeated timings.** *Because* uniform intervals read as machine-made. (Stripe.)
5. **Optical > mathematical alignment; box-shadow focus rings; tabular nums on changing numbers.**
   *Because* the eye, not the pixel grid, judges "right." (Rauno + Vercel guidelines.)
6. **Commit to ONE aesthetic direction.** *Because* AI/averaging produces median mush; taste is
   commitment. (anti-slop consensus — see field-craft-01/04.)
7. **Generated/curated imagery, never gray placeholder boxes.** *Because* placeholders signal
   unfinished/auto-generated. (energy design.md + Gonzalez.)

## 4b. Vercel Design Engineering — the craft role, in their own words

Source: vercel.com/blog/design-engineering-at-vercel (Hitchcock, Heffernan, Phamous, Freiberg,
Pessoa; orig. 2024-03-29, still Vercel's canonical statement). The "design engineer" is the role
that *owns* the taste layer. Verbatim standards:
- Quality bar: *"Polished interactions, no dropped frames, no cross-browser inconsistencies, and
  accessibility."* ← four-part, non-negotiable.
- *"Delightful user interactions and affordances"*, *"support for inclusive input modes"* (touch/
  keyboard/mouse — matches Rauno's `@media (hover:hover)` discipline).
- Anti-perfectionism, FOR shipping: *"Iterate to Greatness … balance business goals with craft"*;
  avoid *"the perfection trap"* — *"what we ship is never in a perfect state."* ← TASTE TENSION pixel
  must hold: obsess the last 10%, but SHIP. Craft ≠ never-finishing.
- Role definition (Vercel + hiring discourse, 2026): a design engineer = *"a designer who ships
  production React, owns motion and microinteractions, and treats the last 10% of UI polish as their
  actual job."* Only ~5,000–8,000 people meet the senior bar (Linear/Vercel/Stripe level) in 2026.
  → pixel IS the agent embodiment of this role: ship production React AND own the last-10% polish that
  average frontend devs hand off / skip. That seam is pixel's entire reason to exist.

## 5. Where pixel's energy baseline should EXTEND (taste gaps in current rules)
- energy `react.md` still says *"Purple theme #6b21a8 primary"* — DIRECTLY contradicts the anti-slop
  consensus (purple is THE #1 slop tell). pixel must override: warm-black + a non-purple accent.
  (Flagged for GAPS-AND-DISPUTES: the energy harness's own react.md prescribes the slop color.)
- energy bible says 200–500ms; Emil says <300ms and Rauno says ≤200ms for interactions. pixel's
  motion rule should bias SHORTER than the bible for direct interactions.

## Sources (this file)
- https://emilkowal.ski/ui/great-animations — Emil Kowalski (PRIMARY taste source)
- https://animations.dev/ — course landing (corroborating)
- https://ui.land/interviews/rauno-freiberg — Rauno Freiberg interview
- https://interfaces.rauno.me/ — Rauno's Web Interface Guidelines
- energy read-only: frontend-bible-2026.md (Stripe/Pentagram/Linear standards), react.md (purple gap)
