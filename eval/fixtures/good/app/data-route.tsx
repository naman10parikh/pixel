// GT11 fixture (S17) — stable read-heavy routes carry an explicit `'use cache'` + cacheLife
// (Next 16 caches NOTHING implicitly; the v15→v16 bump silently 2–3x's origin traffic + the bill
// without this). And there is NO single-arg `revalidateTag(` (the 1-arg form silently drops SWR —
// use the 2-arg `revalidateTag(tag, 'max')` form, or `updateTag` for read-your-writes). GT11 (L1)
// asserts: no single-arg revalidateTag AND stable routes have 'use cache'.
import { unstable_cacheLife as cacheLife } from "next/cache";

export async function getStableData() {
  "use cache";
  cacheLife("hours");
  const res = await fetch("https://api.example.com/positions");
  return res.json();
}

// when we DO invalidate, we use the 2-arg form with a cacheLife profile (never the 1-arg form).
export async function invalidate() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("positions", "max");
}
