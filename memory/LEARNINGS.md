# pixel — LEARNINGS (append-only)

Every error → root cause → rule. Auto-compressed when >500 lines (memory-compress.sh).

## 2026-08-26 — designed the Energy platform workspace
The brain inspector is the differentiator: an agent's memory is just files in a git repo, so browse + timeline + revert come free. Lead with it.

## 2026-10-19 — the gate moved under us (CI red since 12 October)
**What broke:** the acceptance job failed: `pixel mock` exited 1 although the mockup, the app and the named user were all there.
**Root cause:** the ship gate runs `npx --yes impeccable` unpinned. impeccable 4.7.0 added the `italic-serif-display` rule, and pixel's own mockup set the user's name in an italic serif headline. The pinned 2.3.2 passed it; 4.7.0 did not.
**Rule:** pixel's own output must pass the newest detector, so the gate stays unpinned and the output changes: the mockup headline is roman now. When CI goes red after an upstream release, fix pixel's output first, and pin only if the detector itself is wrong.

## 2026-10-19 — vendored skills loaded with no description
**What broke:** `claude plugin validate .` showed 24 vendored skills with "no frontmatter", and `pixel-ship-gate` with a YAML parse error, so at runtime their names and descriptions were silently dropped.
**Root cause:** the vendoring step put its `<!-- source: ... -->` line above the `---` frontmatter, which must be the first line; and a `trigger:` value began with a quoted string followed by more text.
**Rule:** frontmatter is always line 1; credit lines go below it. A `trigger:` value never starts with a quote. Run `claude plugin validate .` after adding any skill.

## 2026-10-19 — what a plugin hook may do to a stranger
**Rule:** the plugin's `hooks/hooks.json` carries only the SessionStart context hook. The §0 grep-set denies writes and assumes a Next.js 16 project (its `params.` rule would block `req.params.id` in an Express app), so it stays in this repo's own `.claude/settings.json`.
