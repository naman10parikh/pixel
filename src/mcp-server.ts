#!/usr/bin/env node
// src/mcp-server.ts — `pixel-mcp`, pixel's OWN MCP server (Component 7, C11).
// Exposes the frontend verbs over JSON-RPC (MCP 2024-11-05) so energy + sibling employees can
// call pixel as an agent tool, not just as a CLI. The 8 tools MIRROR the CLI verbs and DELEGATE
// to the B9 command cores — no logic is duplicated (Karpathy Surgical: one source of truth for
// each capability; the CLI and the MCP are two front-doors onto the same cores).
//
// Transport = stdio (local, no network, no keys — env refs only). CRITICAL stdio discipline:
// MCP frames JSON-RPC on STDOUT, so the cores' human-facing `console.log` (which also writes
// stdout) would CORRUPT the protocol. We therefore redirect console.log → console.error (stderr)
// for the duration of a core call and CAPTURE the text into the tool's response, keeping stdout
// clean for the protocol. (console.error already goes to stderr in the cores, so it is safe.)
//
// No SDK dependency: the wire protocol is a tiny line-delimited JSON-RPC over stdin/stdout, which
// we implement directly (≈120 lines) rather than pull in @modelcontextprotocol/sdk — pixel ships
// tokenless + dep-light (Karpathy Simplicity: no dependency we don't need). `tools/list` and
// `tools/call` are the only methods a caller needs; `initialize` completes the handshake.

import { runScaffold } from "./commands/scaffold.js";
import { runDesign } from "./commands/design.js";
import { runGenerate } from "./commands/generate.js";
import { runAudit } from "./commands/audit.js";
import { runVerify } from "./commands/verify.js";
import { runMock } from "./commands/mock.js";
import { tasteCheck } from "./lib/taste-check.js";
import { brainSearch } from "./lib/brain-search.js";

// ── Capture a core's console output while keeping stdout clean for the JSON-RPC channel. ────────
// During a core call we monkey-patch console.log/console.error to push into a buffer (and also
// echo to the REAL stderr so an operator watching the server still sees progress). stdout is
// never written by the cores under this guard — only our framed responses go to stdout.
interface CoreOutcome {
  readonly exit: number;
  readonly output: string;
}

async function captureCore(fn: () => Promise<number>): Promise<CoreOutcome> {
  const lines: string[] = [];
  const realLog = console.log;
  const realErr = console.error;
  const sink = (...args: unknown[]): void => {
    const text = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
    lines.push(stripAnsi(text));
    // Echo to the real stderr (NOT stdout) so the protocol channel stays clean.
    realErr(...args);
  };
  console.log = sink;
  console.error = sink;
  let exit = 1;
  try {
    exit = await fn();
  } catch (err) {
    lines.push(`[pixel-mcp] core threw: ${err instanceof Error ? err.message : String(err)}`);
    exit = 1;
  } finally {
    console.log = realLog;
    console.error = realErr;
  }
  return { exit, output: lines.join("\n") };
}

/** chalk colour codes would clutter a tool-result string; strip them for the JSON payload. */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

// ── The 8 tools — names + JSON Schemas mirror the CLI verbs (PLAN §4 MCP tool list). ────────────
interface ToolDef {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly run: (args: Record<string, unknown>) => Promise<{ text: string; isError: boolean }>;
}

const str = (a: Record<string, unknown>, k: string): string =>
  typeof a[k] === "string" ? (a[k] as string) : "";
const optStr = (a: Record<string, unknown>, k: string): string | undefined =>
  typeof a[k] === "string" ? (a[k] as string) : undefined;

const TOOLS: ToolDef[] = [
  {
    name: "pixel_mock",
    description:
      "THE FLAGSHIP: discovery brief → first-pass draft → 7-step ship gate → ICP-aware mockup + scaffolded Next 16 app under `out`. Exit-code gate (non-zero if the gate fails). Refuses an empty brief (NO BRIEF = NO DESIGN, O11).",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", description: "one-line product brief naming a SPECIFIC ICP (a person, not a demographic)" },
        out: { type: "string", description: "output directory for the mockup + scaffolded app" },
      },
      required: ["brief"],
    },
    run: async (a) => {
      const r = await captureCore(() => runMock(str(a, "brief"), { out: optStr(a, "out"), sandbox: false }));
      return { text: r.output, isError: r.exit !== 0 };
    },
  },
  {
    name: "pixel_scaffold",
    description: "Clean Next 16 app via `shadcn init -t next --base radix` + wired Tailwind v4 @theme house tokens (scaffold-not-fork, O10).",
    inputSchema: {
      type: "object",
      properties: {
        dir: { type: "string", description: "target directory (must be fresh/empty)" },
        base: { type: "string", enum: ["radix", "base-ui"], description: "component primitive base (default radix)" },
      },
      required: ["dir"],
    },
    run: async (a) => {
      const r = await captureCore(() => runScaffold(str(a, "dir"), { base: optStr(a, "base") ?? "radix" }));
      return { text: r.output, isError: r.exit !== 0 };
    },
  },
  {
    name: "pixel_design",
    description: "Discovery only: emits a 6-section brief + FIRST/SECOND/THIRD hierarchy map. Draws nothing. Refuses an empty brief (O11).",
    inputSchema: {
      type: "object",
      properties: {
        brief: { type: "string", description: "the product brief (empty → refusal)" },
        vertical: { type: "string", description: "vertical profile (fintech|health|devtools|consumer|...)" },
      },
      required: ["brief"],
    },
    run: async (a) => {
      const r = await captureCore(() => runDesign(str(a, "brief"), { vertical: optStr(a, "vertical") }));
      return { text: r.output, isError: r.exit !== 0 };
    },
  },
  {
    name: "pixel_generate",
    description: "v0 Platform API first-pass draft — UNTRUSTED (O7, ~40-45% vulnerable), tagged 'must pass pixel_audit'. No key/network → skipped (R2 fallback), not failed.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "the generation prompt" },
        model: { type: "string", description: "v0 model (v0-1.5-md|v0-1.5-lg)" },
        out: { type: "string", description: "output directory for the draft" },
      },
      required: ["prompt"],
    },
    run: async (a) => {
      const r = await captureCore(() => runGenerate(str(a, "prompt"), { model: optStr(a, "model") ?? "v0-1.5-md", out: optStr(a, "out") }));
      return { text: r.output, isError: r.exit !== 0 };
    },
  },
  {
    name: "pixel_audit",
    description: "The 7-step ship gate IN ORDER (impeccable → axe → lhci → 12-dim → manual-a11y → security → visual). Exit-code gate. `sandbox` runs build+gate inside an E2B envelope (E17).",
    inputSchema: {
      type: "object",
      properties: {
        dir: { type: "string", description: "directory to audit" },
        sandbox: { type: "boolean", description: "build + gate inside an E2B sandbox" },
      },
      required: ["dir"],
    },
    run: async (a) => {
      const r = await captureCore(() => runAudit(str(a, "dir"), { sandbox: a.sandbox === true }));
      return { text: r.output, isError: r.exit !== 0 };
    },
  },
  {
    name: "pixel_verify",
    description: "The silent-failure assertion set: §0 grep-set + build + console=0-hydration. The post-change blind-spot check (O14: a green build is not 'done').",
    inputSchema: {
      type: "object",
      properties: { dir: { type: "string", description: "directory to verify" } },
      required: ["dir"],
    },
    run: async (a) => {
      const r = await captureCore(() => runVerify(str(a, "dir")));
      return { text: r.output, isError: r.exit !== 0 };
    },
  },
  {
    name: "pixel_taste_check",
    description: "The CHEAPEST agent call: run the §0 grep-set + the OPINIONS slop tells over a CODE SNIPPET (no directory needed). Returns the slop rules hit + fixes. Use before committing any generated UI.",
    inputSchema: {
      type: "object",
      properties: { code: { type: "string", description: "the code/markup snippet to taste-check" } },
      required: ["code"],
    },
    run: async (a) => {
      const r = tasteCheck(str(a, "code"));
      return { text: JSON.stringify(r, null, 2), isError: r.slop_rules_hit.length > 0 };
    },
  },
  {
    name: "pixel_brain_search",
    description: "BM25 search over pixel's expertise brain (the six brain/ files: EXPERTISE-MAP, BATTLE-TESTED-SCENARIOS, KNOWN-PITFALLS, OPINIONS, GAPS, TOOL-MATRIX). The Memory layer over MCP (wraps scripts/memory-search.sh, A5).",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "the natural-language query" } },
      required: ["query"],
    },
    run: async (a) => {
      const r = brainSearch(str(a, "query"));
      return { text: JSON.stringify(r, null, 2), isError: r.hits.length === 0 };
    },
  },
];

// ── Minimal JSON-RPC 2.0 over stdio (line-delimited). ───────────────────────────────────────────
interface RpcRequest {
  readonly jsonrpc: "2.0";
  readonly id?: number | string | null;
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

function reply(id: number | string | null | undefined, result: unknown): void {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, result }) + "\n");
}
function replyError(id: number | string | null | undefined, code: number, message: string): void {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }) + "\n");
}

async function handle(req: RpcRequest): Promise<void> {
  switch (req.method) {
    case "initialize":
      reply(req.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "pixel-mcp", version: "0.1.0" },
      });
      return;
    case "notifications/initialized":
      return; // notification — no response
    case "tools/list":
      reply(
        req.id,
        { tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) },
      );
      return;
    case "tools/call": {
      const name = typeof req.params?.name === "string" ? req.params.name : "";
      const args = (req.params?.arguments as Record<string, unknown>) ?? {};
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) {
        replyError(req.id, -32602, `unknown tool: ${name}`);
        return;
      }
      const { text, isError } = await tool.run(args);
      reply(req.id, { content: [{ type: "text", text }], isError });
      return;
    }
    case "ping":
      reply(req.id, {});
      return;
    default:
      replyError(req.id, -32601, `method not found: ${req.method}`);
  }
}

function main(): void {
  let buf = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk: string) => {
    buf += chunk;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let req: RpcRequest;
      try {
        req = JSON.parse(line) as RpcRequest;
      } catch {
        // A malformed line must not crash the server — fail-open, skip it.
        process.stderr.write(`[pixel-mcp] dropped non-JSON line\n`);
        continue;
      }
      void handle(req);
    }
  });
  process.stdin.on("end", () => process.exit(0));
  process.stderr.write("[pixel-mcp] ready (stdio) — tools/list to enumerate the 8 verbs\n");
}

main();
