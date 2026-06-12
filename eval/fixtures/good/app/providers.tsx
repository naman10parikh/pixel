// GT13 fixture (S20) — context providers live in a dedicated `'use client'` file, mounted high
// in the CLIENT tree, NEVER from a Server Component body (which returns `undefined` in a prod
// build while passing `next dev` — the dev-passes/prod-fails silent failure). GT13 (L1) asserts:
// providers in a 'use client' file. GT13 (L2) would run `next build && next start` and assert
// context resolves with no signed-out flash.
"use client";

import { createContext, useContext, type ReactNode } from "react";

const ThemeContext = createContext<{ accent: string }>({ accent: "amber" });

export function Providers({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={{ accent: "amber" }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
