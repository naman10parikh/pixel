---
name: pixel-anti-slop
description: pixel's anti-slop taste gate. Use when generating OR reviewing any web UI — the deterministic "does my own output look AI-made?" check. Encodes the house-style stances (O-HS1..7), the indigo/purple override (O-F1), and the impeccable 41-rule detector. Fires before calling any generated mockup "done."
trigger: generating or reviewing any UI; "does this look AI-generated"; "is this hero slop"; before emitting a mockup; after a v0/Lovable/Bolt draft; styling/beautifying any web surface
allowed-tools: Bash(npx impeccable:*), Read, Grep
---

# pixel-anti-slop — the taste gate (O-HS1..7 + O-F1 + impeccable)

> **Stance:** ~40–45% of generated UI is slop until it survives this gate. pixel's moat is the gate, not the generator (OPINIONS O7). Run this on your OWN output too — an agent that emits AI-purple and a rounded-icon-tile-above-every-heading and calls it done has lost the plot.

## trigger
- generating or reviewing ANY web UI (a hero, a card, a page, a component)
- a fresh v0 / Lovable / Bolt draft landed (untrusted — O7)
- "does this look AI-generated?" / "is this hero slop?"
- before you call a mockup "done" (the §0-of-taste check)

## The stance this encodes (named, not generic)

**The machine-detectable slop tells — BLOCK on sight (impeccable flags these deterministically):**
1. **Pure/near-black** `#000`/`#09090b` → use **warm-black `#141312`** (O-HS1). Untinted black is a top slop tell.
2. **Inter-for-everything** → pair a **serif display + sans body (Instrument Serif + Poppins)** (O-HS2/O-F6). **Chairman override, 11 October 2026: on every page he reads (a brain, a plan, a report, an approach page), no serif or stretched display face; it is [removed]'s look, Instrument Sans alone on light paper (`pixel-brain-page`). The pairing holds for product interfaces only.** Serif+sans is the single highest-impact anti-AI change. Inter is "the black t-shirt of fonts" (Mantz) — neutral-by-design, not safe-by-default.
3. **AI purple/indigo (or purple→blue gradients)** → **warm-black + ONE non-purple OKLCH accent** (O-HS4/O-F1). This is NOT a taste choice the model makes — it's a training-data artifact: Wathan made every Tailwind UI button `bg-indigo-500`, it saturated the corpus, the model now emits it as "statistically correct." **O-F1 HARD-OVERRIDES energy `react.md`'s "Purple theme #6b21a8".**
4. **Symmetric card grids** → **asymmetric / bento** (O-HS3). Symmetric = the AI pattern.
5. **Cards-nested-in-cards, dark glows, bounce/elastic easing, a rounded-square icon tile above every heading** → all literal impeccable rules (O-HS4).
6. **Placeholder gray boxes / pure-white text on dark** → use a gradient/`mask-*`/icon instead of a gray box; **zinc-100/200, never `#fff`** on dark (O-HS5).
7. **A loading spinner with no context** → **stream a rich card** ("Searching restaurants…") (O-HS7). Generative UI is the signature.

**The restraint rules:**
- **ONE brand color-moment per page**, OKLCH, on **Radix 12-step scales** with a purpose-per-step (1-2 bg · 3-5 component · 6-8 borders · 9-10 solid · 11-12 text) (O-HS6).
- **Commit to ONE aesthetic direction within a surface**, match intensity to purpose (marketing = spectacle ok; dashboard/a11y-first = restraint). NEVER ship *averaged* or *unmotivated* maximalism (O-F8).

## steps
1. **Run the deterministic gate FIRST** (keyless, exit-code, $0):
   ```bash
   npx impeccable detect --json <dir>/src   # exit 0 = 0 slop violations; non-zero = blocked
   ```
   This is the cheapest, most objective check — it encodes the 41 rules above. A non-zero exit is a BLOCK, not a warning.
2. **Apply the human-eye pass** the linter can't fully cover: is there ONE color-moment (not three)? Is the layout asymmetric? Is the type a serif+sans pair? Are tool-states rich cards, not spinners?
3. **If any tell is present → fix it, re-run.** Do not rationalize "it's close enough" — O11: NEVER accept "7/10"; either the dimension meets the bar or the fix is explicit.

## output
- `impeccable detect` exit code (0 = pass) + the list of any slop rules hit.
- For each violation: the OPINIONS stance it breaks (O-HS#/O-F#) + the one-line fix.
- Verdict: **SHIP** (0 violations + human pass) or **DRAFT — must fix** (the named tells).

## verify
`npx impeccable detect --json <dir>/src` exits 0 AND no `#000`/`#09090b`/`bg-indigo`/`font-inter`-as-sole-face in the emitted tokens.

## sources
brain/OPINIONS.md O-HS1..7, O-F1, O-F6, O-F8, O7, O11 · brain/KNOWN-PITFALLS.md §7.4 · `impeccable` (npm, keyless, 41 rules).
