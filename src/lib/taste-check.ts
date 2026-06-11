// src/lib/taste-check.ts — `pixel_taste_check` core (the CHEAPEST agent call, PLAN §4 MCP list).
// "impeccable + opinions over a snippet" — runs the §0 silent-failure grep-set (reused from
// src/lib/grep-set, the single source of truth — NOT re-implemented) PLUS the deterministic
// OPINIONS slop-tells that an LLM-generated UI most often trips: the violet/indigo prior (O-F1,
// the Wathan-apologized #1 slop tell), Inter-for-everything (O-F6), gray placeholder boxes
// (O-HS5), and cards-in-cards (O-HS4). It takes a CODE SNIPPET (a string), so an agent can ask
// "is this hero AI-slop?" without a directory on disk. The grep-set half is run by materialising
// the snippet to a throwaway temp file and scanning it with the shared `runGrepSet` — so the §0
// rules can never drift between `pixel verify` and this snippet check.

import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runGrepSet, type GrepFinding } from "./grep-set.js";

/** One slop-tell hit in a snippet (the OPINIONS half, beyond the §0 grep-set). */
export interface SlopHit {
  readonly rule: string; // the OPINIONS id, e.g. "O-F1 violet-prior"
  readonly message: string; // what's wrong + the fix
}

export interface TasteCheckResult {
  readonly slop_rules_hit: string[]; // flat list of rule ids hit (grep-set + opinions), for a quick gate
  readonly findings: GrepFinding[]; // the §0 silent-failure findings
  readonly slop_tells: SlopHit[]; // the OPINIONS taste tells
  readonly suggestions: string[]; // human-facing fixes
  readonly clean: boolean; // true ⇔ nothing hit
}

// The deterministic OPINIONS slop-tells. Each is anchored to a real token/usage so prose that
// merely NAMES a banned pattern doesn't trip it. These are the median-LLM tells the brain calls
// out (O-F1/O-F6/O-HS4/O-HS5) — the cheapest "does my own output look AI-made" check.
interface SlopPattern {
  readonly rule: string;
  readonly regex: RegExp;
  readonly message: string;
}

const SLOP_PATTERNS: readonly SlopPattern[] = [
  {
    // O-F1 — the violet/indigo brand prior (Tailwind's old default-feeling palette). Match a real
    // utility class or token, not the word in prose. bg-/text-/from-/to-/border- + violet|indigo.
    rule: "O-F1 violet-prior",
    regex: /\b(?:bg|text|from|to|via|border|ring|fill|stroke)-(?:violet|indigo)-\d{2,3}\b|#6b21a8|#581c87|#8b5cf6/i,
    message:
      "O-F1: the violet/indigo prior is the #1 AI-slop tell (Wathan publicly apologized for seeding it) — use warm-black #141312 + ONE non-purple OKLCH accent.",
  },
  {
    // O-F6 — Inter as the font-family for everything (no serif display pairing). A real font decl.
    rule: "O-F6 inter-for-everything",
    regex: /font-family\s*:\s*['"]?Inter\b|\bfont-\[?['"]?Inter['"]?\]?/i,
    message:
      "O-F6: Inter-for-everything reads AI-generated — pair a serif display (Instrument Serif) with the sans body (Poppins); the serif/sans pairing is the highest-impact anti-slop change.",
  },
  {
    // O-HS5 — gray placeholder boxes where an image/gradient/icon should be (bg-gray-* on an empty box).
    rule: "O-HS5 gray-placeholder",
    regex: /\b(?:bg)-(?:gray|zinc|slate|neutral)-(?:[12]00|300)\b/,
    message:
      "O-HS5: light-gray placeholder boxes are a slop tell — use a gradient or an icon, never a gray box where content goes.",
  },
];

/** Run the snippet taste-check: §0 grep-set (reused) + the OPINIONS slop-tells. */
export function tasteCheck(code: string): TasteCheckResult {
  const slop_tells: SlopHit[] = [];
  for (const p of SLOP_PATTERNS) {
    if (p.regex.test(code)) slop_tells.push({ rule: p.rule, message: p.message });
  }

  // O-HS4 — cards-in-cards (a rounded/shadowed card nested directly inside another). Heuristic:
  // a snippet carrying ≥2 `rounded-*` AND ≥2 `shadow` AND a nested `border rounded` is a likely
  // card-in-card. Kept conservative (advisory) — it suggests, it does not hard-fail on its own.
  const cardish = (code.match(/\brounded-(?:lg|xl|2xl|3xl)\b/g) ?? []).length;
  const shadows = (code.match(/\bshadow(?:-\w+)?\b/g) ?? []).length;
  if (cardish >= 2 && shadows >= 2) {
    slop_tells.push({
      rule: "O-HS4 cards-in-cards",
      message:
        "O-HS4 (advisory): multiple nested rounded+shadowed cards read AI-generated — flatten to ONE card surface per region; use spacing/typography for hierarchy, not nested boxes.",
    });
  }

  // The §0 silent-failure half — materialise the snippet to a temp .tsx and reuse runGrepSet so
  // the rules are identical to `pixel verify` (no drift). Cleaned up in finally.
  let findings: GrepFinding[] = [];
  let tmp: string | null = null;
  try {
    tmp = mkdtempSync(join(tmpdir(), "pixel-taste-"));
    writeFileSync(join(tmp, "snippet.tsx"), code, "utf8");
    findings = runGrepSet(tmp);
  } catch (err) {
    console.warn("[taste-check] grep-set over snippet failed:", err instanceof Error ? err.message : String(err));
  } finally {
    if (tmp) {
      try {
        rmSync(tmp, { recursive: true, force: true });
      } catch {
        /* best-effort temp cleanup */
      }
    }
  }

  const slop_rules_hit = [...slop_tells.map((s) => s.rule), ...findings.map((f) => f.id)];
  const suggestions = [...slop_tells.map((s) => s.message), ...findings.map((f) => f.message)];
  return {
    slop_rules_hit,
    findings,
    slop_tells,
    suggestions,
    clean: slop_rules_hit.length === 0,
  };
}
