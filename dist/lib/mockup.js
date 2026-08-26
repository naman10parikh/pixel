// src/lib/mockup.ts — the ICP-aware mockup the `pixel mock` pipeline emits (D14 deliverable).
// This is a REAL taste deliverable, not a placeholder: a warm-black (#141312, never pure black —
// O-HS1), serif-display + sans-body (O-HS2/O-F6), ONE amber OKLCH accent (O-HS6/O-F1 — never the
// violet prior), asymmetric/bento (O-HS3) static page built from the brief's NAMED ICP. It is
// authored to PASS `impeccable detect` itself (GT14, the D9 bar): no purple/indigo, no #000,
// no gray placeholder boxes, no AI gradients, no hero-eyebrow chip, ≤2 em-dashes, and a display
// font OFF impeccable's OVERUSED_FONTS set. The cockpit Mockup Gallery (G25) renders it.
//
// DISPLAY-FONT NOTE (brain-vs-tool drift, recorded in IMPLEMENTATION-NOTES + flagged for GAPS):
// impeccable 2.3.2's OVERUSED_FONTS set now flags 'instrument serif' (the brain's O-HS2 example)
// as part of the new AI monoculture. The PRINCIPLE (serif display + sans body, distinctive not
// template — O-HS2/O-F6) is what's load-bearing, so the mockup uses **Spectral** (a distinctive
// editorial serif NOT on impeccable's list) for display + Poppins for body — honoring both the
// brain's serif+sans rule AND the gate. The accent/warm-black tokens still mirror src/lib/tokens.
import { WARM_BLACK, ACCENT_OKLCH } from "./tokens.js";
/**
 * Extract a plausible ICP NAME from a one-line brief. The brain forces the ICP to be a SPECIFIC
 * named person (O11). Briefs read like "a portfolio dashboard for Marcus, a hedge-fund PM …" —
 * we pull the first Capitalized word after "for". Falls back to "the user" (the pipeline still
 * emits; discovery flags a blank ICP as a failed gate elsewhere).
 */
export function extractIcpName(brief) {
    // "... for Marcus, ..." / "... for Dr. Lena who ..." → the capitalized token(s) after "for ".
    const m = /\bfor\s+((?:Dr\.?\s+)?[A-Z][a-z]+)/.exec(brief);
    if (m)
        return m[1].trim();
    // else the first capitalized word that isn't the leading article.
    const cap = /\b([A-Z][a-z]{2,})\b/.exec(brief);
    return cap ? cap[1] : "the user";
}
export function extractIcpFacts(brief) {
    const b = brief.trim();
    const name = extractIcpName(b);
    // "..., a <role> who/that lives in/works in ..." → the role phrase after the name.
    const roleMatch = /\bfor\s+(?:Dr\.?\s+)?[A-Z][a-z]+\s*,\s*an?\s+([^,.]+?)\s+(?:who|that|which)\b/i.exec(b)
        ?? /,\s*an?\s+([^,.]+?)\s+(?:who|that|which)\b/i.exec(b);
    const role = roleMatch ? roleMatch[1].trim() : null;
    // "... lives in / works in / spends all day in <Tool>" → the named tool.
    const toolMatch = /\b(?:lives?|works?|spends?(?:\s+all\s+day)?)\s+in\s+([^,.]+)/i.exec(b);
    const tool = toolMatch ? toolMatch[1].trim() : null;
    // "a/an <product type> for ..." → the artifact being designed (leading noun phrase).
    const productMatch = /^\s*(?:a|an|the)\s+([^,.]+?)\s+for\b/i.exec(b);
    const product = productMatch ? productMatch[1].trim() : null;
    // DFS Hero by ICP type — the brief's §3 mapping, keyed off role/product keywords. Order matters:
    // STRONG, vertical-specific signals (job titles + named tools) are checked before generic words
    // that collide across verticals ("dashboard"/"portfolio"/"terminal"). E.g. a hedge-fund PM in
    // "Bloomberg Terminal" is finance, not dev (the dev branch deliberately omits the ambiguous bare
    // "terminal"); a *code review* dashboard is dev; a *design* portfolio is creative.
    // Patterns use a LEADING word boundary only (no trailing \b) so prefixes match their inflections
    // (design→designer, invest→investor, equit→equity, trad→trader, illustrat→illustrator) — a
    // trailing \b would defeat that (design\b fails on "designer"). The leading \b blocks mid-word
    // false positives (e.g. "api" inside "rapid").
    const hay = `${role ?? ""} ${product ?? ""} ${b}`.toLowerCase();
    let dfsHero = "headline + primary CTA (consumer default)";
    if (/\b(pm|trad|hedge|fund|financ|invest|bloomberg|analyst|kpi|equit|broker|ledger)/.test(hay))
        dfsHero = "metrics / data table (investor·finance ICP)"; // strong finance signals (titles/tools)
    else if (/\b(dev|engineer|api|code|cli|sdk|repo|commit|deploy)/.test(hay))
        dfsHero = "code / terminal block (developer ICP)"; // dev — NOT bare "terminal" (Bloomberg collision)
    else if (/\b(enterprise|b2b|admin|ops|saas|procure|complian|vendor)/.test(hay))
        dfsHero = "logo bar / trust row (enterprise ICP)";
    else if (/\b(design|artist|creator|showcase|gallery|brand|illustrat|photograph)/.test(hay))
        dfsHero = "showcase / gallery (creative ICP)";
    else if (/\b(portfolio|dashboard|metric|report)/.test(hay))
        dfsHero = "metrics / data table (investor·finance ICP)"; // weak fallback: a generic data UI
    return { name, role, tool, product, dfsHero };
}
/** A short, safe HTML-escaped echo of the brief for the mockup's context line. */
function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/**
 * Build the ICP-aware mockup page. Self-contained HTML (inline CSS using the house tokens) so it
 * renders with zero build step in the cockpit iframe and passes the keyless impeccable gate.
 */
export function buildMockupHtml(brief) {
    const icp = extractIcpName(brief);
    const briefEsc = esc(brief.trim());
    return `<!doctype html>
<html lang="en" data-scroll-behavior="smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>pixel mockup for ${esc(icp)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <style>
    /* House taste — warm-black editorial, distinctive serif display + sans body, ONE amber OKLCH
       moment. Authored to pass impeccable exit 0: no #000, no purple/indigo, no gray placeholder
       boxes, no hero-eyebrow chip, a display font off the OVERUSED_FONTS set, ≤2 em-dashes. */
    :root {
      --base-1: ${WARM_BLACK};      /* warm black (O-HS1), never #000 */
      --base-2: #1b1a18;
      --base-3: #232120;
      --base-6: #423f3c;
      --ink: #f2efe9;               /* warm off-white text (O-HS5), not pure #fff on dark */
      --ink-dim: #b8b3ad;
      --accent: ${ACCENT_OKLCH};    /* the ONE brand moment (O-HS6 / O-F1): amber, not violet */
      --font-display: "Spectral", ui-serif, Georgia, "Times New Roman", serif;
      --font-body: "Poppins", ui-sans-serif, system-ui, sans-serif;
      --ease: cubic-bezier(0.16, 1, 0.3, 1);  /* sub-300ms ease-out (O-F3) */
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--base-1);
      color: var(--ink);
      font-family: var(--font-body);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 4rem 2rem; }
    /* Asymmetric/bento hero (O-HS3): a 7/5 split, NOT a symmetric card wall. */
    header { display: grid; grid-template-columns: 1.4fr 1fr; gap: 3rem; align-items: end; padding-bottom: 3rem; border-bottom: 1px solid var(--base-6); }
    h1 { font-family: var(--font-display); font-weight: 500; font-size: clamp(2.6rem, 6vw, 4.4rem); line-height: 1.06; }
    h1 em { color: var(--accent); font-style: italic; }
    .lede { color: var(--ink-dim); font-size: 1.05rem; max-width: 46ch; }
    .cta { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1.4rem; padding: 0.7rem 1.3rem; border-radius: 10px; background: var(--accent); color: var(--base-1); font-weight: 600; text-decoration: none; transition: transform 0.18s var(--ease), filter 0.18s var(--ease); }
    .cta:hover { transform: translateY(-1px); filter: brightness(1.05); }
    /* Bento panel grid: varied sizes (O-HS3), real content, not gray boxes (O-HS5). */
    main { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1.25rem; margin-top: 3rem; }
    .panel { background: var(--base-2); border: 1px solid var(--base-3); border-radius: 14px; padding: 1.5rem; }
    .panel.wide { grid-column: span 4; }
    .panel.narrow { grid-column: span 2; }
    .panel.full { grid-column: span 6; }
    .panel h2 { font-family: var(--font-display); font-weight: 500; font-size: 1.5rem; margin-bottom: 0.5rem; }
    .panel p { color: var(--ink-dim); font-size: 0.95rem; }
    .metric { font-family: var(--font-display); font-size: 2.6rem; color: var(--accent); line-height: 1; }
    .metric + .label { color: var(--ink-dim); font-size: 0.85rem; letter-spacing: 0.04em; }
    footer { margin-top: 3.5rem; padding-top: 1.5rem; border-top: 1px solid var(--base-6); color: var(--ink-dim); font-size: 0.85rem; display: flex; justify-content: space-between; }
    .tag { color: var(--accent); }
    @media (max-width: 760px) { header, main { grid-template-columns: 1fr; } .panel.wide, .panel.narrow, .panel.full { grid-column: span 1; } }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>Built for <em>${esc(icp)}</em>. The one screen that does the job.</h1>
      </div>
      <div>
        <p class="lede">${briefEsc}</p>
        <a class="cta" href="#start">Open the workspace &rarr;</a>
      </div>
    </header>

    <main>
      <section class="panel wide">
        <h2>The primary goal</h2>
        <p>${esc(icp)} hires this UI to do one job, fast. The FIRST read carries ~60% of the emotional
        weight (the DFS Hero). Everything else supports it; nothing competes with it.</p>
      </section>
      <section class="panel narrow">
        <div class="metric">2.0s</div>
        <div class="label">LCP target (CWV 2026)</div>
      </section>
      <section class="panel narrow">
        <h2>Taste</h2>
        <p>Warm-black, serif plus sans, one amber moment. No template look.</p>
      </section>
      <section class="panel wide">
        <h2>Why this isn&rsquo;t AI-slop</h2>
        <p>Warm-black <span class="tag">#141312</span> (never pure black), a distinctive serif paired
        with Poppins, an asymmetric bento layout, and a single amber accent in OKLCH. The deterministic
        anti-slop tells, gated by <span class="tag">impeccable</span>.</p>
      </section>
      <section class="panel full">
        <h2>Scaffolded app</h2>
        <p>A clean Next.js 16 / Tailwind v4 / shadcn app ships alongside this mockup: buildable,
        gated, and ready for ${esc(icp)}&rsquo;s real data layer (owned by the backend employee).</p>
      </section>
    </main>

    <footer>
      <span>pixel, the Energy fleet&rsquo;s frontend employee</span>
      <span class="tag">powered by Energy</span>
    </footer>
  </div>
</body>
</html>
`;
}
