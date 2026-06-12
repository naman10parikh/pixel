// GT9 fixture (S15) — CWV default-emit done right. The hero image carries fetchpriority="high"
// + explicit width/height and is NOT lazy (it's the LCP element); below-fold images ARE lazy.
// GT9 (L1) asserts: hero has fetchpriority="high" + width/height + NOT loading="lazy"; below-fold
// imgs ARE loading="lazy".
import Image from "next/image";

export default function Page() {
  return (
    <main>
      {/* hero / LCP element — eager, prioritised, sized to reserve layout (no CLS) */}
      <Image
        src="/hero.webp"
        alt="portfolio overview"
        width={1200}
        height={600}
        fetchPriority="high"
        priority
      />

      {/* below the fold — lazily loaded so it doesn't compete with the LCP */}
      <Image src="/chart-1.webp" alt="returns chart" width={800} height={400} loading="lazy" />
      <Image src="/chart-2.webp" alt="exposure chart" width={800} height={400} loading="lazy" />
    </main>
  );
}
