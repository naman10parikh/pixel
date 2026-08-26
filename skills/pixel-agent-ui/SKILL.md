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
