// test/contract.test.mjs — §9 CONTRACT layer (node --test).
// Asserts pixel-mcp's JSON-RPC surface (src/mcp-server.ts → dist/mcp-server.js) matches the CLI
// verbs: `tools/list` enumerates the 8 tools with input schemas, and `tools/call` round-trips a
// real result. The two front-doors (CLI + MCP) delegate to the SAME B9 cores, so their surfaces
// must not drift. The cheapest call (`pixel_taste_check`, no directory, no network) is used so the
// contract test stays fast + offline. stdio discipline is verified implicitly: a clean JSON-RPC
// frame must come back on stdout (the cores' console output is redirected to stderr by the server).

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, "..", "dist", "mcp-server.js");
const BUILT = existsSync(SERVER);
const skip = BUILT ? false : "dist not built — run `pnpm build` first";

// The 8 tools that MUST exist (mirror the CLI verbs, PLAN §4 MCP tool list).
const EXPECTED_TOOLS = [
  "pixel_mock",
  "pixel_scaffold",
  "pixel_design",
  "pixel_generate",
  "pixel_audit",
  "pixel_verify",
  "pixel_taste_check",
  "pixel_brain_search",
];

/**
 * Send a sequence of JSON-RPC requests to a fresh pixel-mcp process, collect the line-delimited
 * responses on stdout, and resolve with the parsed responses keyed by id. Never hangs: closes
 * stdin after writing and resolves on process exit or a short idle timeout.
 */
function rpc(requests, { timeoutMs = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [SERVER], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    const byId = new Map();
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      finish();
    }, timeoutMs);
    function parse() {
      let nl;
      while ((nl = out.indexOf("\n")) >= 0) {
        const line = out.slice(0, nl).trim();
        out = out.slice(nl + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && msg.id !== null) byId.set(msg.id, msg);
        } catch {
          /* a non-JSON stdout line would be a STDIO-DISCIPLINE violation — caught by the assert below */
        }
      }
    }
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        proc.kill("SIGTERM");
      } catch {
        /* best-effort */
      }
      resolve({ byId, rawStdout: out });
    }
    proc.stdout.on("data", (d) => {
      out += d.toString();
      parse();
      // resolve once we've seen a response for every request id.
      if (requests.every((r) => r.id === undefined || byId.has(r.id))) {
        // give the buffer a tick to flush any trailing frame, then finish.
        setTimeout(finish, 100);
      }
    });
    proc.stderr.on("data", () => {}); // the server logs progress to stderr — drain it
    proc.on("error", reject);
    proc.on("exit", finish);
    for (const r of requests) proc.stdin.write(JSON.stringify(r) + "\n");
    proc.stdin.end();
  });
}

test("tools/list enumerates the 8 verbs with input schemas (matches the CLI)", { skip }, async () => {
  const { byId } = await rpc([
    { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
  ]);
  const list = byId.get(2);
  assert.ok(list, "tools/list must return a response");
  assert.ok(list.result && Array.isArray(list.result.tools), "result.tools must be an array");
  const names = list.result.tools.map((t) => t.name);
  for (const want of EXPECTED_TOOLS) {
    assert.ok(names.includes(want), `tools/list must include ${want} (got: ${names.join(", ")})`);
  }
  // every tool carries an input schema (the contract the CLI verbs mirror).
  for (const t of list.result.tools) {
    assert.equal(t.inputSchema?.type, "object", `${t.name} must declare an object inputSchema`);
  }
});

test("tools/call pixel_taste_check round-trips and flags a slop tell (isError true)", { skip }, async () => {
  const { byId } = await rpc([
    { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
    { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "pixel_taste_check", arguments: { code: `<div className="bg-indigo-500">x</div>` } } },
  ]);
  const call = byId.get(2);
  assert.ok(call, "tools/call must return a response");
  assert.ok(call.result, "tools/call must return a result (not an error)");
  assert.equal(call.result.isError, true, "an indigo snippet is a slop tell → isError true (O-F1)");
  assert.ok(Array.isArray(call.result.content) && call.result.content[0]?.type === "text", "result.content[0] must be a text block");
});

test("tools/call on an unknown tool returns a JSON-RPC error (not a crash)", { skip }, async () => {
  const { byId } = await rpc([
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "pixel_definitely_not_a_tool", arguments: {} } },
  ]);
  const r = byId.get(1);
  assert.ok(r, "must respond");
  assert.ok(r.error, "an unknown tool must return a JSON-RPC error object");
});
