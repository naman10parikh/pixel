// src/lib/tokens.ts — pixel's house design tokens as a Tailwind v4 `@theme` block.
// OPINIONS O8: tokens live in @theme (CSS-first), auto-exposed as CSS vars — NOT in
// tailwind.config.js. PITFALL §2.1: the `--color-`/`--font-` prefixes are STRICT — a wrong
// prefix means the utility silently won't generate, so every token below uses the exact
// namespace. Values: warm-black #141312 (O-HS1, never pure black), Instrument Serif display +
// Poppins body (O-HS2, never Inter-for-everything), and ONE non-purple OKLCH accent — warm
// amber oklch(0.78 0.15 70) (O-HS6 one-brand-moment; O-F1 hard-override of the indigo prior),
// matching identity/BRAND.md. `pixel scaffold` writes this into the generated app's globals.css.
/** The CSS `@theme` block injected into a scaffolded app's stylesheet. */
export const HOUSE_THEME_CSS = `/* pixel house tokens — Tailwind v4 @theme (O8). Warm-black editorial, serif+sans, one amber moment. */
@import "tailwindcss";

@theme {
  /* Warm black base (O-HS1) — never #000 / #09090b. 12-step-shaped neutrals. */
  --color-base-1: #141312;
  --color-base-2: #1b1a18;
  --color-base-3: #232120;
  --color-base-4: #2b2927;
  --color-base-5: #34312f;
  --color-base-6: #423f3c;
  --color-base-11: #b8b3ad;
  --color-base-12: #f2efe9;

  /* The ONE brand moment (O-HS6 / O-F1) — warm amber in OKLCH, NOT a violet-family prior. */
  --color-accent-9: oklch(0.78 0.15 70);
  --color-accent-10: oklch(0.72 0.15 70);
  --color-accent-11: oklch(0.83 0.12 75);

  /* Type (O-HS2 / O-F6): serif display + sans body. Serif+sans is the #1 anti-slop move. */
  --font-display: "Instrument Serif", ui-serif, Georgia, serif;
  --font-body: "Poppins", ui-sans-serif, system-ui, sans-serif;

  /* Motion (O-F3): sub-300ms ease-out is the ceiling for direct-manipulation feedback. */
  --ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);
}
`;
/** The exact accent token, so other modules (cockpit, audit copy) reference one source. */
export const ACCENT_OKLCH = "oklch(0.78 0.15 70)";
/** Warm-black base, the value the anti-slop checks expect (never #000). */
export const WARM_BLACK = "#141312";
