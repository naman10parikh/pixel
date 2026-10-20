# pixel — Heartbeat

pixel's pulse: what it checks on its own, how often, and what it does when a check fails. Every entry below is wired
to a real file; nothing here runs on a promise.

## Schedule

| Check | Frequency | Where it runs | Action on anomaly |
| --- | --- | --- | --- |
| Tool currency: `npm view` on the 15 pinned packages (Next, React, Tailwind, shadcn, impeccable and the rest), diffed against the brain's pins | Nightly, 07:17 UTC | `.github/workflows/rsi.yml` → `node workflows/rsi.workflow.js --check` | A moved pin writes `BRAIN-DRIFT.md`, a proposal kept as a run artifact for a person to review. The loop never edits the brain. |
| L1 golden tasks (the deterministic eval floor) | Nightly, in the same run | `node eval/eval.mjs --l1-only` | A regression fails the run red and GitHub notifies the owner. Nothing merges until it is green. |
| Build, unit tests, the acceptance test (`pixel mock` → impeccable clean → Playwright smoke) and the GT1–GT15 eval pyramid | Every push and pull request | `.github/workflows/ci.yml` | A red job blocks the merge. A new upstream slop rule shows up here first (October 2026: impeccable 4.7 flagged the italic mockup headline, so the headline went roman). |
| Stack pins in context, and the §0 silent-failure grep-set on every Edit or Write | Every coding-agent session | `.claude/settings.json` → `.claude/hooks/pixel-session-start.sh`, `.claude/hooks/pixel-grep-set.cjs` | A stale pattern (`@studio-freight/*`, sync `params.`, `@tailwind`, `middleware.ts`, `images.domains`) is denied before it lands. |
| Per-run trail: command, model, duration, tool calls, gate results | Every command | `logs/runs.jsonl`, read with `pixel logs` | A failed gate shows in the trail; a repeated failure becomes a rule in `memory/LEARNINGS.md`. |

## Health indicators

- **Healthy:** the last nightly run is green and under 26 hours old; CI is green on `main`; no drift has waited
  more than a week for review.
- **Warning:** a nightly run is missing, or `BRAIN-DRIFT.md` lists a drift nobody has reviewed for a week.
- **Critical:** the L1 eval floor or the acceptance test is red on `main`. Fix it before any new work.

## Recovery

1. Read the failed run: `gh run list --workflow "pixel RSI"`, or the red job in CI.
2. Check `memory/LEARNINGS.md` for a known fix.
3. Fix the cause, not the symptom: read the changelog, bump the pin, re-run `npm run eval`.
4. Write the lesson into `memory/LEARNINGS.md`, so the same failure becomes a rule.
