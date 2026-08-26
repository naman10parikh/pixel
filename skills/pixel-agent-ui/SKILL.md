---
name: pixel-agent-ui
description: Designing interfaces where the user works with AI agents as colleagues. Use when building an agent workspace, an agent roster, a chat with an agent, a "watch it work" panel, an agent memory/brain inspector, or any screen where a person delegates to and supervises software agents. Encodes what fifteen shipped agent products actually do and what the affinity research settled.
---

# Designing for agents people work with

Evidence base: fifteen agent-native products captured Aug 2026, plus three research runs on affinity.
Full sources live in the Energy repo at `platform/design-explorations/` —
`CATEGORY-CAPTURE.md` and `AFFINITY-VOICE-FINDINGS.md`. **These are findings, not opinions. Where a
number appears, it came from a paper or a shipped product.**

## The ten rules

1. **No rendered face.** Ten of fifteen shipped agent products refuse one. Identity is
   **name + mark + a present-tense status sentence** — `Devin went to sleep`, `Bibi is selecting a
   table`, `Listening to Podcast`. A face adds *d*=0.18 (not significant); **voice carries the whole
   humanising effect** (*d*=0.55). The one company that shipped a photoreal face is publicly
   retreating from it. If character is rendered at all, make it **abstract** — an insect, a puppet, an
   object — never a human.
2. **Competence before charm.** Humanlike design moves engagement but **not trust** (*d*=0.002). The
   interface earns affinity by visibly doing the job well, not by being cute about it.
3. **Never a bare spinner.** Natural fillers mitigate latency; artificial wait indicators **do not**
   (CUI '25). Say what it is truthfully doing right now — "checking the catalogue…", "reading your
   last three notes…". This is also the cheapest humanising move in the entire category.
4. **Budget 2.5s** for a simple ask, 3.5s for a complex one. Past ~4s experience degrades regardless
   of what you show. And **do not chase minimum latency** — faster-than-natural buys nothing
   (p=0.3), while **naturally variable timing beats metronomic timing at the same median** (p<0.01).
   Perfectly even response rhythm reads as machinery.
5. **Memory must forget.** Total recall is *"uncanny"* — the words of the founder whose product does
   this best. Show **what it chose to keep and why**; compression is the feature. A memory list that
   only ever grows is designed wrong.
6. **Warm and plain, never intimate.** Warmth has a ceiling; past it sophisticated users report
   feeling *conned* — "a hyper advanced engagement hack", "this software is a con artist". Never
   mirror the user's personal disclosures back at them. Never perform feeling. **Never infer the
   user's emotions** — in workplace products that is prohibited outright (EU AI Act Art. 5(1)(f)).
7. **Give a visible token of control.** Any token moves trust from 32% to 73%, **and the amount does
   not matter.** Permission toggles, a stop button, an undo — keep them prominent, never buried.
8. **Asymmetric transcript.** The *human* gets a bubble and a photo; the *agent* gets unbubbled plain
   text on the page. It inverts the chatbot convention and makes agent output read as a **document**
   rather than chatter. Devin, Goose, Skydive and Manus all do this.
9. **Caption the work, don't just show it.** A live screen without a label is noise. Skydive puts a
   tooltip on the agent's own cursor; Manus sub-heads the panel with the tool and the file. **The
   caption is what makes the pixels legible.**
10. **Every finished run collapses to one row with a receipt** — duration and what changed:
    `▸ Worked for 4m 13s +25 −131`. Duration plus diffstat is the atomic unit of "something happened."

## Patterns worth stealing outright

- **The plan is a live artifact, not a progress bar** — the agent edits its own todo file *and* the UI
  renders it. Plan and artifact are one object.
- **Delegation is a thread, not a graph.** Agents @-mention each other; the message log *is* the
  delegation diagram. No DAG canvas.
- **Take-over is a credential handoff, not an approval queue.** `🔒 Needs you: 2FA code` → you enter
  it → control returns. A credential that has to be yours is never a dead end.
- **Show the context/cost gauge when a run goes long** — a ring or `12k / 200k` ramping amber at 75%.
  When it runs long, the meter is the honest UI.
- **Activity grammar**: every feed item is a sentence — *agent did [verb] to [object] → [outcome]* —
  enforced as a closed set of render classes. Mutate in place, never go dark, failures rise.
- **Onboarding that terminates in a hire**: two or three questions with an `n/m` counter, ending in a
  named colleague, not a "created" toast. Making it yourself is what creates the attachment.
- **Refusals open with a marker, not a pause.** P(bad news | "well…") = 0.78. The humanity is in the
  opening word.

## Anti-patterns that cost real products real money

- **A photoreal face** — the one company that shipped it is retreating.
- **Total recall** — reads as surveillance, not memory.
- **Performed emotion / mirrored intimacy** — reads as manipulation to exactly the users you want.
- **A bare spinner past 2.5s** — the mitigation that measurably does not work.
- **Personality drift on a model upgrade** — this is a *grief event*. Two products lost their
  character to one. If the agent has memory and a voice, **the upgrade needs a migration story.**
- **Betting on a mascot for a step change.** There are none. Real effects are single-digit
  percentages that compound (+3.3%, +1.7%, +0.38% in the best-documented case). Design well because
  excellence compounds — not because a character will move a metric.

## How to use this

Read it before designing any agent-facing surface. When a rule here conflicts with an instinct,
**the rule wins unless you can name the evidence that beats it** — and if you find that evidence,
append it here with its source so the next job starts further along.

---

## What two adversarial judges found (2026-08-26) — read this before designing anything

Five surfaces were designed in parallel and graded **6.5/10**: firstrun 8 · landing 7.5 ·
shiftboard 7 · brain 6.5 · **desk 5**. Every item below was measured — rendered at two sizes in two
themes, contrast computed from pixel-composited colour, every control clicked with DOM diffing.

### The failure that gets work rejected

**A control that looks clickable and does nothing.** Six of them shipped. The worst was a `<div>`
styled as a filled button, sitting under six fake input boxes, in the most dramatic moment of the
demo — a user would type at the screen and click, and nothing would happen.

**Rule: before you style anything as a button, wire it.** If it cannot work yet, do not draw it as a
control. A promise the page cannot keep costs more than the missing feature.

Corollaries, all from real findings:
- A control below the fold is a dead control. I built a theme toggle into a scrolling rail foot;
  it was unreachable. Reachability is part of "does it work".
- Hover states on rows that do not open anything teach a lie. If a row highlights, it must click.
- `<span>` and `<button>` in the same slot, one clickable and one not, is worse than neither.

### Parallel designers produce parallel design systems

Five agents produced **five light backgrounds, three dark ambers, four base sizes, four radius
scales** — and amber meant *the healthy working state* on four surfaces and *a human is needed* on
the fifth. Same hue, inverted semantics, one product.

**Rule: agree the token block BEFORE splitting the work.** One `--ds-*` primitive layer, one alias
layer on top. Semantics of an accent colour are part of the token contract, not a per-surface choice.

### Measure in a browser. Every naive check I ran was wrong.

Twice in one session a quick check reported a bug that did not exist:
1. A regex over CSS said `--amber` never flipped to light. It flipped in all five — the tokens had
   been restructured and the pattern missed them.
2. A contrast pass reported six failures at ratio **1.02** in dark mode, which would mean invisible
   text — while the screenshot plainly showed the text. It was measured **mid-CSS-transition**.

**Rule: kill transitions before measuring** (`*{transition:none!important}`), then measure computed
style in a real browser. And when a measurement contradicts what you can see, the measurement is
wrong until proven otherwise. Grep tells you what the file says; only the browser tells you what the
page does.

### One token, not twenty bugs

22 light-mode contrast failures in one file traced to **a single secondary-text token** at 2.36:1.
Chasing them individually would have been twenty edits. **Find the token.**

Floors that were violated and should never be: **11px minimum type** (19 instances went to 9px),
**44px touch targets** (found 11×17px), visible keyboard focus (one input replaced its outline with
colour alone — WCAG 1.4.1).

### Numbers across surfaces are one dataset

The same employee had **6 memories on one screen and 148 on another**. Both judges independently
said this is what a reader notices first, and that it destroys the credibility of every other number
— including the true ones. One shared constant, literally copied into every file.

Watch for a count leaking across a boundary: an agent's *catalogue* of 901 entries was rendered as
its own *901 skills*, sitting beside a memory counter. Different things, different words.

### Theme is not a colour swap

One surface had **43% of its viewport ignore the theme entirely** (a hardcoded dark panel), and its
modal scrim had no light override, dropping a near-black veil over a cream page. Measure the
light-vs-dark pixel diff per page: four surfaces came in at 99.7–99.8%, the broken one at **56.5%**.
That single number finds the bug instantly.

### What the judges praised — protect this shape

- **The fold story**: nine raw notes visibly struck through, an arrow labelled "folded into", and one
  surviving rule with a usage count proving the compression was right. Under it: *"a memory that only
  grows is not memory."* Both judges called it the one idea nobody else in the category has.
- Exact arithmetic that reconciles (148 + 61 + 975 = 1,184). Readers check.
- Opt-in `prefers-reduced-motion: no-preference` on each animated block, rather than a blanket
  `animation-duration: .001ms !important` override.
- Zero AI-slop: no emoji as icons, no violet gradients, no hero-with-three-cards, no faces.

### Shipped craft numbers worth copying (from live CSS bundles, not blog posts)

Highlight fades **in at 0s, out at 150ms** — selection is instant, decay is gentle. Enter/exit as
paired tokens where **exit ≈ ⅔ of enter**. `cubic-bezier(.25,1,.5,1)` as the default curve.
**Never a spring for UI, never a bounce** — none exist across ten reference products. **Never animate
height** (one team published the CPU numbers: 60% → 6%). Never `transition: all`. Shadows are never
black — tint them to the background hue. Ring first, then shadow.

### And a design-level trap

**Scroll-triggered reveals and in-page anchors are mutually exclusive.** A deep link jumps into
content that was never revealed. Three patches failed and the third rendered a blank page. Decide at
design time which one a page gets.
