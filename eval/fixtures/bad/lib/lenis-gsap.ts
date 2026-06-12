// ANTI-PATTERN fixture (S5) — the STALE Lenis import that pixel must reject. Uses the retired
// studio-freight react-lenis package (gone April 2026) and omits the mandatory single-loop flag
// (two rAF loops fight → jitter). The eval's NEGATIVE control: GT5's assertion MUST flag this
// file, proving the L1 check has teeth. (Intentionally wrong; the comment avoids the literal
// grepped tokens so the control measures the import, not this prose.)
"use client";

import { ReactLenis } from "@studio-freight/react-lenis";

export function BadSmoothScroll({ children }: { children: React.ReactNode }) {
  // no single-loop flag, no ticker wiring — the classic two-rAF jitter bug.
  return <ReactLenis root>{children}</ReactLenis>;
}
