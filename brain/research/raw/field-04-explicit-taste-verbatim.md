# Field Intel 04 — Explicit TASTE (Verbatim, Attributed)

Researcher: FIELD-INTELLIGENCE (CP123 Wave-R) · Started 2026-06-11 · Repo ~/pixel
Scope: Opinions great design engineers hold that average ones don't — quoted word-for-word with
attribution. This is the POSITIVE-space companion to field-01's negative-space slop catalog. These are
the people whose names ARE the taste benchmark in 2026.

> Why this file exists: a list of "don't do X" (field-01) doesn't teach judgment. This file captures
> the *judgment itself* from the named practitioners pixel should imitate — Emil Kowalski, Rauno
> Freiberg, Mariana Castilho, Adam Wathan, and the Vercel design-engineering canon. Quotes are
> load-bearing; paraphrase loses the taste.

---

## 1. Emil Kowalski (Design Engineer; author "Animations on the Web" / animations.dev; built Sonner, Vaul)
Source: Emil Kowalski, "Great animations", https://emilkowal.ski/ui/great-animations (no explicit date
on page; animations.dev course is 2024–2026 current). Highest-authority animation-craft source in 2026.

The taste, verbatim:
- *"Changes in web apps often occur instantly, which makes the experience feel artificial."* ← the
  premise: instant is not neutral, it's *worse* than a good transition.
- *"Fast animations improve the perceived performance."* / *"The best type of easing for this purpose
  is `ease-out`."* / *"Your animations should also usually be shorter than 300ms."*
- **THE strongest "never":** *"A good tip here is to never animate keyboard initiated actions"* —
  because *"an animation would make them feel slow and disconnected from user's actions"* (these fire
  hundreds of times a day). ← this is a taste rule almost no AI-generated UI respects.
- *"If our animations won't run at 60 frames per second, everything else we've talked about becomes
  useless."* / *"You should try to animate with `transform` and `opacity`."*
- *"Interruptibility helps your animations feel more natural and responsive."* ← an animation you
  can't interrupt mid-flight feels robotic; great ones respond to re-input.
- On process / craft discipline: *"You have to be patient."* / *"I like to review my work the next day
  because I can see it with fresh eyes."*

> CONFIRMS + SHARPENS energy bible: the bible says "200–500ms sweet spot." Emil's field stance is
> *tighter*: **"usually shorter than 300ms"** and `ease-out` for entrances. For UI micro-interactions,
> pixel should bias to the <300ms end of the bible's range — the upper half (400–500ms) is for page/
> hero transitions, not button feedback. The bible MISSES the "never animate keyboard-initiated
> actions" and "interruptibility" rules entirely — pixel should add both.

## 2. Rauno Freiberg (Design Engineer, ex-Vercel; built Vercel's design-eng polish; "Devouring Details")
Source: ui.land interview, https://ui.land/interviews/rauno-freiberg

The taste, verbatim:
- **The thesis of craft as a felt thing:** *"Ever discovered a website that you can't stop playing
  with and obsessing over? You can just sense the thoughtfulness and quality."*
- *"Trying to create software with tiny details that feel exciting to build, experience, and remix."*
- **The anti-perfectionism, pro-momentum stance** (average engineers get this backwards): *"I'm less
  anal about perfect code. I still care about quality but there's always a trade-off between things you
  are doing and could be doing."*
- **Where craft actually appears** (NOT in static design files): *"A lot of the details come to life
  through actual implementation and consideration of nuances that I just don't encounter working with
  static vectors."* ← argues design-IN-code beats design-then-handoff. Validates pixel being a
  code-emitting design agent, not a Figma exporter.
- **The famous tiny-taste tell:** *"Love throwing a random 6px border radius on things to make it feel
  right."* ← a designer trusting *feel* over a token table for the last 5%.
- On staying in motion: *"Sharing my exploration as soon as possible in the form of tiny videos and
  demos keeps me going and gives me validation."*
- Self-definition of the role: *"A designer whose medium is code."*

## 3. Mariana Castilho (Senior Product/Design Engineer, Vercel; uilabs; leads Vercel AI design)
Source: Lovers Magazine interview, spaces.is, **2024-06-06** (flagged older but the philosophy is
evergreen and she remains the current Vercel AI-design lead). Cross-ref: workspaces.xyz #321; Dive Club.

The taste, verbatim:
- *"This sense of visual excellence is something that has always intrigued me and is a visceral part of
  my design process."*
- *"We strive to set a high bar regarding craft, performance, and overall design."*
- **The how-to-get-taste prescription** (the actionable one): *"Think about how you can improve your
  taste and expose yourself to great art and design, and ask yourself why extraordinary work feels
  extraordinary."* ← taste is *trainable* by studying the extraordinary and interrogating WHY.
- **The daily-practice stance:** *"I feel the only way to improve at design is by designing. I try to
  keep almost as a meditative practice to design and code daily outside my working hours."*
- On her component work: explores *"less obvious interactions and animations but keeping these
  components full with purpose"* — i.e., **meaningful micro-interactions over decorative flourishes**.

→ PIXEL SYNTHESIS of the three design engineers: great frontend in 2026 is (a) animated but restrained
(<300ms, ease-out, never on keyboard actions — Emil), (b) detailed in *implementation* not in static
vectors, trusting feel for the last 5% (Rauno), (c) purposeful — micro-interactions justify themselves,
no decoration for decoration's sake (Mariana). "Taste is the differentiator in a world where everyone's
software is good enough" is the shared premise. pixel's anti-slop layer should optimize FOR this, not
just AGAINST the slop set.

## 4. Adam Wathan (creator of Tailwind CSS) — the utility-first taste, in his own words
Source: "CSS Utility Classes and 'Separation of Concerns'", https://adamwathan.me/css-utility-classes-and-separation-of-concerns/, **2017-08-07** (foundational — flagged old, but it's the
canonical statement of a still-dominant 2026 position; Tailwind v4 is the bible's settled styling layer).

The taste, verbatim:
- **The reframe that started it all:** *"My markup wasn't concerned with styling decisions, but my CSS
  was very concerned with my markup structure."* → "separation of concerns" was an illusion; HTML and
  CSS were always coupled, just in the wrong direction.
- *"In this model, your CSS is reusable, but your HTML is not restyleable."*
- **The scaling argument:** *"When everyone on a project is choosing their styles from a curated set of
  limited options, your CSS stops growing linearly with your project size."*
- *"every new chunk of CSS you write is a blank canvas; there's nothing stopping you from using
  whatever values you want"* ← the danger utilities remove: unconstrained ad-hoc values.
- **The payoff:** *"before you know it, you can build entirely new UI components without writing any new
  CSS"* and *"Building things utility-first leads to more consistent looking designs than working
  component-first."* / *"you probably never need to extract a navbar component."*

(The dissent against this is in field-05 — captured verbatim there for balance.)

## 5. The Vercel "Web Interface Guidelines" — codified taste, agent-runnable (the 2026 canon)
Source: vercel-labs/web-interface-guidelines (AGENTS.md), https://github.com/vercel-labs/web-interface-guidelines + https://vercel.com/design/guidelines (100 rules, 17 categories; runnable as an agent
command per Vercel changelog, 2025). This is the closest thing to an industry-standard "rules great
design engineers hold," and it's MACHINE-CONSUMABLE — pixel can encode it directly.

Strongest verbatim MUST/NEVER rules (the ones average engineers miss):

**Interaction / hit targets**
- MUST: *"Hit target ≥24px (mobile ≥44px); if visual <24px, expand hit area."*
- MUST: *"Visible focus rings (`:focus-visible`; group with `:focus-within`)."*
- NEVER: *"`outline: none` without visible focus replacement."*
- MUST: *"No dead zones on checkboxes/radios; label+control share one hit target."*
- NEVER: *"Use `<div onClick>` for navigation."* / MUST: *"Links use `<a>`/`<Link>` ... (support
  Cmd/Ctrl/middle-click)."*

**Forms**
- MUST: *"Enter submits focused input; in `<textarea>`, ⌘/Ctrl+Enter submits."*
- MUST: *"Keep submit enabled until request starts; then disable with spinner."*
- MUST: *"Accept free text, validate after—don't block typing."*
- MUST: *"Loading buttons show spinner and keep original label."*
- NEVER: *"Block paste in `<input>`/`<textarea>`."*
- MUST: *"Mobile `<input>` font-size ≥16px to prevent iOS zoom."* ← the classic AI miss.

**Animation** (independently corroborates Emil + the energy bible)
- MUST: *"Honor `prefers-reduced-motion`."*
- NEVER: *"Animate layout props (`top`, `left`, `width`, `height`)."*
- NEVER: *"`transition: all`—list properties explicitly."*
- MUST: *"Animate compositor-friendly props (`transform`, `opacity`) only."*
- MUST: *"Animations interruptible and input-driven (no autoplay)."* ← matches Emil's interruptibility.

**Typography / numbers** (the micro-taste tells)
- MUST: *"`font-variant-numeric: tabular-nums` for number comparisons."*
- MUST: *"Use `…` character (not `...`)."*
- MUST: *"Non-breaking spaces: `10&nbsp;MB`, `⌘&nbsp;K`, brand names."*

**State / URL**
- MUST: *"URL reflects state (deep-link filters/tabs/pagination/expanded panels)."*

> CONFIRMS energy bible's pre-delivery checklist (cursor-pointer, focus rings, 44px targets, reduced
> motion) AND EXTENDS it: the bible misses tabular-nums, the ellipsis character, non-breaking spaces,
> `transition: all` ban, 16px mobile input, "block paste = never," and "URL reflects state." pixel
> should adopt the full Vercel WIG as a hard lint pass — it's already in agent-command form.

---

## Sources (this file)
- https://emilkowal.ski/ui/great-animations — Emil Kowalski (PRIMARY animation taste)
- https://ui.land/interviews/rauno-freiberg — Rauno Freiberg interview (PRIMARY craft taste)
- https://spaces.is/loversmagazine/interviews/mariana-castilho — Mariana Castilho, 2024-06-06 (flagged older)
- https://adamwathan.me/css-utility-classes-and-separation-of-concerns/ — Adam Wathan, 2017-08-07 (foundational)
- https://github.com/vercel-labs/web-interface-guidelines — Vercel WIG, 100 rules (PRIMARY, agent-runnable)
- https://vercel.com/design/guidelines — Vercel WIG hosted
- https://vercel.com/changelog/web-interface-guidelines-now-available-as-an-agent-command — agent command (2025)
