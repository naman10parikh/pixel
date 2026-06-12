// GT8 fixture (S14) — the unified radix-ui import shape, not the old per-package react primitive
// imports. GT8 asserts: zero old-style per-package radix imports in src AND radix-ui is the single
// dep. (The comment avoids the literal grepped token so the assertion measures the import line.)
"use client";

import { Dialog as DialogPrimitive } from "radix-ui";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = DialogPrimitive.Content;
