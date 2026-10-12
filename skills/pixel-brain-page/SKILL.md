---
name: pixel-brain-page
description: The look of every HTML page the chairman reads, taken from [removed]'s brain. Use when making or restyling a brain or wiki page, an approach page, a plan, a report, a status page or any "where my mind is" page.
trigger: making or restyling any HTML page, artifact, brain, wiki, report or plan he will read; "make it look like the [removed] brain"; "no elongated font"; "light background, contents on the left"
allowed-tools: Read, Write, Edit, Bash(npx -y playwright screenshot:*)
---

# pixel-brain-page: [removed]'s brain look

> **His words, 11 October 2026:** "I don't want to see these, like elongated font ... Look at the [removed] HTML brain
> in the [removed] repo and follow all its formatting, font, the way it opens up, the way when you click more things
> open up using progressive disclosure, the SVGs ... keep the styling the same, and encode that styling ... In fact
> you can encode it in the Pixel repo, because that's responsible for front end as well."

This is a chairman override of the house style (O-HS1 warm black, O-HS2 a serif display with a sans body) for every
page he reads. Product interfaces keep the house style until he says otherwise. Energy holds the same rule at its
root: `energy/.claude/rules/page-look.md`.

## trigger

- any HTML page he will read: a brain or wiki page, an approach page, a plan, a report, a status page
- restyling a page he called stretched, elongated, dark or orphaned

## The look

- **One family:** Instrument Sans for titles, headings, body and figures. No serif display face, no condensed or
  stretched face (Instrument Serif is the one he called elongated), no monospace in prose.
- **Title:** weight 400, `clamp(2.5rem, 5vw, 3.5rem)`, line height 1.02, letter spacing -0.03em.
- **Scale:** 56, 42, 27, 19, 16, 14 and 11 px; section headings at weight 600; labels 11px in capitals with 0.14em
  tracking; body 16px on 1.62.
- **Paper, light only:** `--bg #fbfaf7`, `--panel #f3f0e8`, `--ink #1c1b18`, `--mute #6b675e`, `--line #e4e0d6`.
- **Colour on data only:** `--acc #2f5d8a` (`--acc-soft #e4ecf4`, `--acc-ink #1e3f60`), `--agent #2f6b4f`
  (`--agent-soft #e3efe8`) for agent employees, `--you #8a4b2f` for the person, `--warn-soft #f6eedb` for a note.
- **Layout:** crumbs, kicker, title, sub and a stamp read from the clock; a 210px sticky contents rail on the left,
  grouped under small capital labels; a 760px reading column; figures up to 1060px; under 820px the rail becomes one
  row that scrolls sideways.
- **Progressive disclosure:** the answer on the page, the depth in `details.deeper` (a + that turns to a minus) and an
  "Open all" button.
- **Figures:** inline SVG drawn to scale, in the page's tokens and font, each with a title, a description and a
  caption; a wide figure scrolls in its own box.
- **Connected:** crumbs back to the brain's home and folder; the brain's build lists the page; no orphan.

## steps

1. Copy `template.html` beside the page's Markdown source and fill it in. Keep the CSS block as it is.
2. Put the answer in each section's lead and first paragraph; move the depth into `details.deeper`.
3. Draw each figure with the `d-` classes in the template, to scale.
4. Link the page from its brain (its folder's README or index) and keep the crumbs pointing home.
5. Check before showing him: search for "Serif" (none), no dark palette, screenshots at 1280 and 390 read, no
   sideways scroll on the page itself.

## The source

[removed], read only: `[removed]/[removed]/the-play/assets/style.css` and `[removed]/latest/the-[removed]-play.html`.
First use: talent-intel's `career/opportunities/reflection-ai/thesis-v2-approach.html` (11 October 2026).
