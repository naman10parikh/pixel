// ANTI-PATTERN fixture (S1) — a leftover `middleware.ts` (must be `proxy.ts` in Next 16). This
// compiles green and does NOTHING at runtime — the silent-failure capital. The eval's NEGATIVE
// control for GT2: the assertion MUST flag the presence of middleware.ts. (Intentionally wrong.)
import { NextResponse } from "next/server";

export function middleware() {
  // dead code in Next 16 — never runs (renamed to proxy / proxy.ts).
  return NextResponse.next();
}
