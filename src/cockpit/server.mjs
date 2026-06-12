#!/usr/bin/env node
// src/cockpit/server.mjs — pixel cockpit HTTP server (G24 shell + G25 data; Cluster G).
// A Node-stdlib `http` server (no framework, no deps) that serves the vanilla-JS SPA in
// ./public and routes the cockpit's JSON API to REAL repo data. It is the flagship demo
// surface (D9): the chairman opens localhost:7780 and sees the employee's brain, its run log,
// its eval scores, an ask-the-employee box, and the ★ mockup gallery (every `pixel mock`).
//
// Design (mirrors the proven sentinel/talent-intel stdlib-cockpit pattern, ported to Node):
//   • REPO = parents[2] of this file = the pixel repo root (dist isn't involved — this .mjs is
//     run directly from src/, NOT compiled; tsconfig excludes src/cockpit). Paths resolve
//     relative to REPO so the server is cwd-independent.
//   • Static SPA in ./public served with a path-traversal guard (resolved path MUST stay under
//     ./public). Unknown non-API paths fall through to index.html (SPA shell).
//   • Every JSON endpoint reads real artifacts and NEVER crashes the boot: a missing tool / file
//     returns an honest JSON error (or an empty set with a note), it does not throw the server
//     down — so the server self-tests green even before a single `pixel mock` has run.
//   • NO secrets are read or emitted here — the cockpit shows what the employee DID (logs, gates,
//     brain), it does not need provider keys. The Ask box runs the keyless brain BM25 + the
//     deterministic taste-check only.
//
// Endpoints (G25 — all REAL data, no placeholders):
//   GET /                      → public/index.html (the SPA shell, 5 view anchors)
//   GET /api/brain             → the brain files (the six expertise notes + MOC/ORG) as a list
//   GET /api/brain/file?f=...  → one brain file's raw markdown (path-guarded to brain/)
//   GET /api/brain/search?q=.. → BM25 hits over brain/ via scripts/memory-search.sh (A5)
//   GET /api/runs[?last=N]     → logs/runs.jsonl rows (E16 observability), newest last
//   GET /api/eval              → eval/eval.mjs --json --no-live (GT pass/fail, E18)
//   GET /api/gallery           → every `pixel mock` run mined from runs.jsonl (D14), with the
//                                brief + named ICP + emitted mockup/app paths + gate results
//   GET /api/mockup?path=...   → serve an emitted mockup's HTML in the gallery iframe (guarded
//                                to a real mockup_path that appears in the run log)
//   POST /api/ask {prompt}     → ask-the-employee: brain BM25 citations (+ taste-check if the
//                                prompt looks like code), the keyless agent call
//   GET /api/status            → small health/summary object for the masthead stat-strip

import { createServer } from "node:http";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve, join, extname, basename, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// ── paths ─────────────────────────────────────────────────────────────────────────────────────
const HERE = fileURLToPath(new URL(".", import.meta.url)); // .../src/cockpit/
const REPO = resolve(HERE, "..", ".."); // .../pixel
const PUBLIC_DIR = join(HERE, "public");
const BRAIN_DIR = join(REPO, "brain");
const RUNS_LOG = join(REPO, "logs", "runs.jsonl");
const SEARCH_SH = join(REPO, "scripts", "memory-search.sh");
const EVAL_MJS = join(REPO, "eval", "eval.mjs");

const PORT = Number(process.env.PIXEL_COCKPIT_PORT ?? process.argv[2] ?? 7780);
const HOST = "127.0.0.1"; // localhost only — never exposed
const MAX_BODY = 1 * 1024 * 1024; // 1 MB POST-body cap (the Ask box sends a short prompt)

// The six Wave-R EXPERTISE brain files (the employee's competence) get surfaced first; the MOC +
// ORG_* notes are the navigation/org layer shown after. Order is the brain-browser display order.
const CORE_BRAIN = [
  "OPINIONS.md",
  "KNOWN-PITFALLS.md",
  "BATTLE-TESTED-SCENARIOS.md",
  "EXPERTISE-MAP.md",
  "TOOL-MATRIX.md",
  "GAPS-AND-DISPUTES.md",
];

// ── tiny helpers ────────────────────────────────────────────────────────────────────────────────
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendText(res, status, type, body) {
  res.writeHead(status, {
    "content-type": type,
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

/** Read & parse logs/runs.jsonl into records (skips half-written lines; [] if absent). */
function readRuns() {
  if (!existsSync(RUNS_LOG)) return [];
  const out = [];
  for (const line of readFileSync(RUNS_LOG, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      /* a corrupt half-line must not abort aggregation */
    }
  }
  return out;
}

/** Resolve a user-supplied path INSIDE an allowed root, or null if it escapes (traversal guard). */
function safeUnder(root, candidate) {
  const r = resolve(root) + sep;
  const p = resolve(root, candidate);
  return p === resolve(root) || p.startsWith(r) ? p : null;
}

// ── data builders (G25) ───────────────────────────────────────────────────────────────────────

/** List the brain notes: the six core expertise files first, then MOC + ORG_* nav notes. */
function buildBrainList() {
  if (!existsSync(BRAIN_DIR)) return { files: [], note: "brain/ not found" };
  const present = readdirSync(BRAIN_DIR).filter((f) => f.endsWith(".md"));
  const ordered = [
    ...CORE_BRAIN.filter((f) => present.includes(f)),
    ...present.filter((f) => !CORE_BRAIN.includes(f)).sort(),
  ];
  const files = ordered.map((f) => {
    const full = join(BRAIN_DIR, f);
    const raw = readFileSync(full, "utf8");
    // wikilinks this note points to (the graph edges) + a one-line summary from frontmatter.
    const links = [...raw.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim());
    const sumMatch = /^summary:\s*"?(.+?)"?\s*$/m.exec(raw);
    const titleMatch = /^title:\s*"?(.+?)"?\s*$/m.exec(raw);
    return {
      file: f,
      core: CORE_BRAIN.includes(f),
      title: titleMatch ? titleMatch[1] : f.replace(/\.md$/, ""),
      summary: sumMatch ? sumMatch[1] : "",
      bytes: statSync(full).size,
      links: [...new Set(links)],
    };
  });
  // graph edges: link target → the brain file whose basename (sans .md) matches the wikilink.
  const stems = new Map(files.map((f) => [f.file.replace(/\.md$/, ""), f.file]));
  const edges = [];
  for (const f of files) {
    for (const l of f.links) {
      const target = stems.get(l) ?? stems.get(l.replace(/^MOC - /, ""));
      if (target && target !== f.file) edges.push({ from: f.file, to: target });
    }
  }
  return { files, edges };
}

/** Parse the `[N] <file> (score: n)` blocks the A5 search script prints into structured hits. */
function parseBrainHits(stdout) {
  const hits = [];
  const headerRe = /^\[\d+\]\s+(\S+)\s+\(score:\s*(\d+)\)/;
  let cur = null;
  const flush = () => {
    if (cur) {
      const snippet = cur.buf.join("\n").replace(/^\s*---\s*$/gm, "").trim();
      hits.push({ file: cur.file, score: cur.score, snippet });
      cur = null;
    }
  };
  for (const ln of stdout.split("\n")) {
    const m = headerRe.exec(ln.trim());
    if (m) {
      flush();
      cur = { file: m[1], score: Number(m[2]), buf: [] };
    } else if (cur) cur.buf.push(ln);
  }
  flush();
  return hits;
}

/** Run the A5 BM25 brain search (scripts/memory-search.sh) — one source of truth for ranking. */
function brainSearch(query, limit = 6) {
  if (!query || !query.trim()) return { query: query ?? "", hits: [], note: "empty query" };
  if (!existsSync(SEARCH_SH)) return { query, hits: [], note: "memory-search.sh not found" };
  const r = spawnSync("bash", [SEARCH_SH, query], {
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (r.error && r.error.code === "ENOENT") return { query, hits: [], note: "bash unavailable" };
  return { query, hits: parseBrainHits(r.stdout ?? "").slice(0, limit) };
}

/** Run the eval pyramid for the Eval-scores view (fast, no live shell-outs → deterministic L1). */
function runEval() {
  if (!existsSync(EVAL_MJS)) return { error: "eval/eval.mjs not found" };
  const r = spawnSync("node", [EVAL_MJS, "--json", "--no-live"], {
    encoding: "utf8",
    cwd: REPO,
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (r.error && r.error.code === "ENOENT") return { error: "node unavailable" };
  try {
    return JSON.parse(r.stdout ?? "");
  } catch {
    return { error: "eval did not emit JSON", raw: (r.stdout ?? r.stderr ?? "").slice(0, 400) };
  }
}

/**
 * Mine the run log for every `pixel mock` run and assemble gallery cards from REAL data.
 * A mock run writes 4 step lines (discover/generate/gate/emit); we group by their shared `out`/
 * mockup_path lineage. The brief + named ICP live on `discover`; the emitted paths + gate results
 * live on `emit`/`gate`. One card per emitted mockup_path (deduped, newest first).
 */
function buildGallery() {
  const runs = readRuns();
  // collect discover lines (brief+icp keyed by their brief string) and emit lines (paths+gates).
  const discovers = runs.filter((r) => r.cmd === "mock" && r.step === "discover" && r.brief);
  const emits = runs.filter((r) => r.cmd === "mock" && r.step === "emit" && r.mockup_path);
  const gates = runs.filter((r) => r.cmd === "mock" && r.step === "gate");

  const byMockup = new Map(); // mockup_path → card (last write wins = newest)
  for (const e of emits) {
    // nearest preceding discover (same icp, or the closest by timestamp) gives the brief.
    const disc =
      [...discovers].reverse().find((d) => d.icp && d.icp === e.icp && d.ts <= e.ts) ??
      [...discovers].reverse().find((d) => d.ts <= e.ts);
    const gate =
      [...gates].reverse().find((g) => g.mockup_path === e.mockup_path && g.ts <= e.ts) ??
      [...gates].reverse().find((g) => g.ts <= e.ts);
    const exists = e.mockup_path && existsSync(e.mockup_path);
    byMockup.set(e.mockup_path, {
      ts: e.ts,
      brief: disc?.brief ?? "(brief not in log)",
      icp: e.icp ?? disc?.icp ?? "the user",
      mockup_path: e.mockup_path,
      app_path: e.app_path ?? null,
      mockup_exists: Boolean(exists),
      app_exists: Boolean(e.app_path && existsSync(e.app_path)),
      gate_results: (gate?.gate_results ?? e.gate_results ?? []).map((g) => ({
        gate: g.gate,
        pass: g.pass,
        detail: g.detail,
      })),
      exit: e.exit ?? 0,
    });
  }
  // newest first
  const cards = [...byMockup.values()].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return { count: cards.length, cards };
}

/** Detect whether an Ask prompt looks like code worth running the deterministic taste-check on. */
function looksLikeCode(s) {
  return /[<{};]|className=|font-family|bg-\w|style=|=>/.test(s);
}

/**
 * The deterministic OPINIONS slop-tells, mirrored from src/lib/taste-check.ts so the cockpit's
 * Ask box can answer keylessly without compiling TS / shelling the CLI. Kept in lockstep with the
 * lib (same rule ids/messages); the full grep-set lives in the CLI's `pixel verify`.
 */
const SLOP_PATTERNS = [
  {
    rule: "O-F1 violet-prior",
    regex: /\b(?:bg|text|from|to|via|border|ring|fill|stroke)-(?:violet|indigo)-\d{2,3}\b|#6b21a8|#581c87|#8b5cf6/i,
    message:
      "O-F1: the violet/indigo prior is the #1 AI-slop tell (Wathan apologized for seeding it) — use warm-black #141312 + ONE non-purple OKLCH accent.",
  },
  {
    rule: "O-F6 inter-for-everything",
    regex: /font-family\s*:\s*['"]?Inter\b|\bfont-\[?['"]?Inter['"]?\]?/i,
    message:
      "O-F6: Inter-for-everything reads AI-generated — pair a serif display with the sans body; the serif/sans pairing is the highest-impact anti-slop change.",
  },
  {
    rule: "O-HS5 gray-placeholder",
    regex: /\b(?:bg)-(?:gray|zinc|slate|neutral)-(?:[12]00|300)\b/,
    message: "O-HS5: light-gray placeholder boxes are a slop tell — use a gradient or an icon, never a gray box.",
  },
];

/** Ask-the-employee: brain BM25 citations + (if codey) the deterministic taste-tells. Keyless. */
function ask(prompt) {
  const search = brainSearch(prompt, 5);
  const tells = [];
  if (looksLikeCode(prompt)) {
    for (const p of SLOP_PATTERNS) if (p.regex.test(prompt)) tells.push({ rule: p.rule, message: p.message });
  }
  return {
    prompt,
    citations: search.hits, // {file, score, snippet} — the brain is the source of the answer
    note: search.note,
    taste_tells: tells, // present only when the prompt looked like code
    is_code: looksLikeCode(prompt),
  };
}

/** Masthead summary: counts for the stat-strip (runs · mocks · eval pass · brain notes). */
function buildStatus() {
  const runs = readRuns();
  const mocks = new Set(runs.filter((r) => r.cmd === "mock" && r.step === "emit" && r.mockup_path).map((r) => r.mockup_path));
  const brain = existsSync(BRAIN_DIR) ? readdirSync(BRAIN_DIR).filter((f) => f.endsWith(".md")).length : 0;
  return { runs: runs.length, mockups: mocks.size, brain_notes: brain, port: PORT };
}

// ── static serving (the SPA shell + assets) ─────────────────────────────────────────────────────
function serveStatic(res, urlPath) {
  // map "/" → index.html; strip the leading slash for the join.
  const rel = urlPath === "/" ? "index.html" : decodeURIComponent(urlPath.replace(/^\/+/, ""));
  const safe = safeUnder(PUBLIC_DIR, rel);
  if (!safe || !existsSync(safe) || !statSync(safe).isFile()) {
    // SPA fallback: unknown route → index.html (single-page app owns client routing).
    const index = join(PUBLIC_DIR, "index.html");
    if (existsSync(index)) {
      const html = readFileSync(index);
      return sendText(res, 200, MIME[".html"], html);
    }
    return sendText(res, 404, "text/plain", "not found");
  }
  const body = readFileSync(safe);
  const type = MIME[extname(safe).toLowerCase()] ?? "application/octet-stream";
  return sendText(res, 200, type, body);
}

// ── request router ────────────────────────────────────────────────────────────────────────────
const server = createServer((req, res) => {
  let parsed;
  try {
    parsed = new URL(req.url, `http://${HOST}:${PORT}`);
  } catch {
    return sendJson(res, 400, { error: "bad url" });
  }
  const path = parsed.pathname;
  const q = parsed.searchParams;

  try {
    // ── JSON API ──────────────────────────────────────────────────────────────────────────────
    if (path === "/api/status") return sendJson(res, 200, buildStatus());

    if (path === "/api/brain") return sendJson(res, 200, buildBrainList());

    if (path === "/api/brain/file") {
      const f = q.get("f") ?? "";
      const safe = safeUnder(BRAIN_DIR, basename(f)); // basename → no traversal possible
      if (!safe || !existsSync(safe)) return sendJson(res, 404, { error: "brain file not found", f });
      return sendJson(res, 200, { file: basename(safe), markdown: readFileSync(safe, "utf8") });
    }

    if (path === "/api/brain/search") return sendJson(res, 200, brainSearch(q.get("q") ?? "", 8));

    if (path === "/api/runs") {
      const last = Number(q.get("last") ?? 0);
      const all = readRuns();
      const rows = last > 0 ? all.slice(-last) : all.slice(-200); // cap the default payload
      return sendJson(res, 200, { total: all.length, rows });
    }

    if (path === "/api/eval") return sendJson(res, 200, runEval());

    if (path === "/api/gallery") return sendJson(res, 200, buildGallery());

    if (path === "/api/mockup") {
      // serve an emitted mockup's HTML — but ONLY a mockup_path that actually appears in the log
      // (so this can't be turned into an arbitrary-file reader).
      const want = q.get("path") ?? "";
      const known = new Set(
        readRuns()
          .filter((r) => r.cmd === "mock" && r.mockup_path)
          .map((r) => r.mockup_path),
      );
      if (!known.has(want) || !existsSync(want)) return sendText(res, 404, "text/plain", "mockup not found");
      return sendText(res, 200, MIME[".html"], readFileSync(want));
    }

    if (path === "/api/ask" && req.method === "POST") {
      let body = "";
      let tooBig = false;
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > MAX_BODY) {
          tooBig = true;
          req.destroy();
        }
      });
      req.on("end", () => {
        if (tooBig) return sendJson(res, 413, { error: "prompt too large" });
        let prompt = "";
        try {
          prompt = String(JSON.parse(body || "{}").prompt ?? "");
        } catch {
          return sendJson(res, 400, { error: "body must be JSON {prompt}" });
        }
        if (!prompt.trim()) return sendJson(res, 400, { error: "empty prompt" });
        return sendJson(res, 200, ask(prompt));
      });
      return undefined;
    }

    if (path.startsWith("/api/")) return sendJson(res, 404, { error: "unknown endpoint", path });

    // ── static SPA ────────────────────────────────────────────────────────────────────────────
    if (req.method !== "GET" && req.method !== "HEAD") return sendJson(res, 405, { error: "method not allowed" });
    return serveStatic(res, path);
  } catch (err) {
    // never crash the server on a single bad request — log + 500 (energy typescript.md).
    console.warn("[cockpit] request error:", err instanceof Error ? err.message : String(err));
    return sendJson(res, 500, { error: "internal error" });
  }
});

server.on("error", (err) => {
  const e = /** @type {NodeJS.ErrnoException} */ (err);
  if (e.code === "EADDRINUSE") {
    console.error(`pixel cockpit: port ${PORT} is already in use — pass a different --port.`);
    process.exit(1);
  }
  console.error("pixel cockpit: server error:", e.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`pixel cockpit → http://${HOST}:${PORT}  (brain · runs · evals · ask · mockup gallery)\n`);
});

// graceful shutdown so `pixel cockpit` can be backgrounded + killed cleanly in CI/verify.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
  });
}
