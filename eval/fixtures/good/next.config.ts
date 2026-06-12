// GT7 fixture (S10) — Next 16 image config done correctly. The qualities array includes the
// non-75 value (90) that a `<Image quality={90}>` uses (else Next silently coerces 90 to 75).
// The legacy domains-array field is GONE (deprecated in favour of remotePatterns). GT7 asserts:
// qualities includes the used value AND the legacy domains-array field is absent.
// (This comment intentionally avoids the literal grepped tokens so the negative control is real.)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // we use quality={90} on hero art, so we must declare it (Next 16 default is [75]).
    qualities: [75, 90],
    remotePatterns: [{ protocol: "https", hostname: "images.example.com" }],
  },
};

export default nextConfig;
