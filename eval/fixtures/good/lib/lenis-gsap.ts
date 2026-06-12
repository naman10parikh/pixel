// GT5 fixture (S5) — the canonical ONE-rAF Lenis+GSAP integration. `autoRaf: false` is
// MANDATORY (so Lenis does not run its own rAF), and GSAP's ticker drives lenis.raf — a single
// loop, no jitter. Imports are from the current lenis / lenis-react packages, never the retired
// studio-freight ones (gone April 2026). GT5 asserts: autoRaf:false present + gsap.ticker.add
// driving lenis.raf + no stale studio-freight import. (The comment avoids the literal grepped
// token so the assertion measures the import line, not this prose.)
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
      lenis.destroy();
    };
  }, []);
}
