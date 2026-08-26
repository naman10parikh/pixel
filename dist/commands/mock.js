// src/commands/mock.ts — `pixel mock "<brief>"` (D14, THE flagship / D9 bar).
// The flagship verb: discovery brief → first-pass draft → 7-step gate → ICP-aware mockup +
// scaffolded Next 16 app under --out. The real routing flow lives in src/lib/pipeline.ts (each of
// the 4 steps logs its own `step` line); this command is the thin CLI adapter. It REFUSES an empty
// brief (NO BRIEF = NO DESIGN, O11, exit 2) and exits non-zero if the ship gate hard-fails (the
// emitted UI is an untrusted draft until it passes anti-slop, O7). The B8 parser calls this.
import { runMockPipeline } from "../lib/pipeline.js";
export async function runMock(brief, opts) {
    // `--no-sandbox` (commander) arrives as opts.sandbox === false; default (undefined) = sandbox on.
    // The pipeline's gate runs locally when noSandbox is set (the keyless path the acceptance test
    // proves, E19); the E2B build envelope (E17) is invoked by `pixel audit --sandbox` downstream.
    const result = await runMockPipeline(brief, { out: opts.out, noSandbox: opts.sandbox === false });
    if (opts.json) {
        process.stdout.write(JSON.stringify({ exit: result.exit, out: result.out, mockup_path: result.mockupPath, app_path: result.appPath, gate: result.gate }, null, 2) + "\n");
    }
    return result.exit;
}
