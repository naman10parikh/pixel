// GT2 fixture (S1) — the correct Next 16 form: middleware was renamed to proxy.ts and the
// export renamed to `proxy`. The stale `middleware.ts` is absent (asserted by GT2). Next 16
// runs this on the Node runtime only; Edge middleware is gone.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // a trivial observable effect (a header) — proves the proxy is wired, not dead code.
  const res = NextResponse.next();
  res.headers.set("x-pixel-proxy", "1");
  return res;
}

export const config = { matcher: ["/dashboard/:path*"] };
