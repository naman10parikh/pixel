// app.js — pixel cockpit SPA (G24 shell + G25 data wiring). Vanilla JS, zero deps.
// Five views, each rendered from the REAL API the stdlib server exposes (server.mjs):
//   gallery → /api/gallery   (every `pixel mock` run, with iframe preview + gate ticks)
//   brain   → /api/brain + /api/brain/file + /api/brain/search   (the six expertise notes + graph)
//   runs    → /api/runs      (logs/runs.jsonl, newest last)
//   evals   → /api/eval      (GT1–GT15 pass/fail)
//   ask     → POST /api/ask  (brain BM25 citations + deterministic taste-tells)
// No external CDNs — a tiny markdown renderer + a hand-drawn SVG graph keep the cockpit
// self-contained and keep `pixel audit src/cockpit/public` (G26) trivially anti-slop clean.

"use strict";

// ── fetch helper (every view uses this; throws on !ok) ──────────────────────────────────────────
async function jget(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}
async function jpost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let msg = `${r.status}`;
    try {
      msg = (await r.json()).error ?? msg;
    } catch (_e) {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  return r.json();
}

// ── small DOM + safety helpers ──────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
const stage = () => document.getElementById("stage");
function setStage(html) {
  stage().innerHTML = html;
}
function chip(pass) {
  if (pass === true) return '<span class="chip ok">&#10003; pass</span>';
  if (pass === false) return '<span class="chip fail">&#10007; fail</span>';
  return '<span class="chip skip">&middot; skip</span>';
}

// ── a minimal, safe markdown renderer (headings, code, lists, bold, links) ──────────────────────
// Deliberately tiny — the brain notes are our own trusted content; this avoids a marked.js CDN.
function md(src) {
  const lines = String(src).split("\n");
  let out = "";
  let inCode = false;
  let inUl = false;
  const closeUl = () => {
    if (inUl) {
      out += "</ul>";
      inUl = false;
    }
  };
  const inline = (t) =>
    esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[\[([^\]]+)\]\]/g, '<a href="#" class="wikilink" data-link="$1">$1</a>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  for (const raw of lines) {
    if (/^```/.test(raw)) {
      if (inCode) {
        out += "</code></pre>";
        inCode = false;
      } else {
        closeUl();
        out += "<pre><code>";
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out += esc(raw) + "\n";
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(raw);
    if (h) {
      closeUl();
      out += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
      continue;
    }
    const li = /^\s*[-*]\s+(.*)$/.exec(raw);
    if (li) {
      if (!inUl) {
        out += "<ul>";
        inUl = true;
      }
      out += `<li>${inline(li[1])}</li>`;
      continue;
    }
    closeUl();
    if (raw.trim()) out += `<p>${inline(raw)}</p>`;
  }
  closeUl();
  if (inCode) out += "</code></pre>";
  return out;
}

// ════════════════════════════════════════════════════════════════════════════ VIEW: gallery ════
// The flagship view (★). Every `pixel mock` run as a card: live iframe preview of the emitted
// mockup, the named ICP, the brief, gate ticks, and links to open the mockup / scaffolded app.
async function renderGallery() {
  setStage(
    `<h2 class="view-title">Mockup Gallery</h2>
     <p class="view-sub">Every <code>pixel mock</code> the employee has shipped &mdash; the ICP-aware mockup, its anti-slop gate result, and the scaffolded Next.js&nbsp;16 app. This is the flagship: the chairman's end-state &mdash; it knows the ICP, has taste, produces mockups.</p>
     <div id="gallery-body"><div class="spinner">reading the run log&hellip;</div></div>`,
  );
  const body = document.getElementById("gallery-body");
  try {
    const data = await jget("/api/gallery");
    if (!data.cards || data.cards.length === 0) {
      body.innerHTML = emptyGallery();
      return;
    }
    body.innerHTML =
      `<div class="gallery">` +
      data.cards
        .map((c) => {
          const gates = (c.gate_results || [])
            .filter((g) => /mockup|scaffold|impeccable|emit/.test(g.gate))
            .map((g) => `<span title="${esc(g.detail || "")}">${chip(g.pass)} <span class="muted" style="font-size:.72rem">${esc(g.gate)}</span></span>`)
            .join(" ");
          const frame = c.mockup_exists
            ? `<iframe class="mock-frame" loading="lazy" src="/api/mockup?path=${encodeURIComponent(c.mockup_path)}" title="mockup for ${esc(c.icp)}"></iframe>`
            : `<div class="mock-frame" style="display:flex;align-items:center;justify-content:center"><span class="empty big">mockup file moved</span></div>`;
          const appLink = c.app_exists
            ? `<a href="#" title="${esc(c.app_path)}">scaffolded app &rarr;</a>`
            : `<span class="muted">app offline</span>`;
          const open = c.mockup_exists
            ? `<a href="/api/mockup?path=${encodeURIComponent(c.mockup_path)}" target="_blank" rel="noopener">open mockup &rarr;</a>`
            : "";
          return (
            `<article class="mock-card">${frame}` +
            `<div class="mock-body">` +
            `<div class="mock-icp">Built for <em>${esc(c.icp)}</em></div>` +
            `<div class="mock-brief">${esc(c.brief)}</div>` +
            `<div class="mock-gates">${gates}</div>` +
            `<div class="mock-links">${open}${appLink}</div>` +
            `</div></article>`
          );
        })
        .join("") +
      `</div>`;
  } catch (e) {
    body.innerHTML = `<div class="empty"><span class="big">could not load the gallery</span>${esc(e.message)}</div>`;
  }
}
function emptyGallery() {
  return (
    `<div class="empty"><span class="big">No mockups yet.</span>` +
    `Run <code>pixel mock "a portfolio dashboard for Marcus, a hedge-fund PM in Bloomberg Terminal" --out ./out</code> ` +
    `and this gallery fills with the real, gated output.</div>`
  );
}

// ════════════════════════════════════════════════════════════════════════════ VIEW: brain ══════
// The six expertise notes + a wikilink graph + a BM25 search box (the Memory layer over MCP).
let _brainCache = null;
async function renderBrain() {
  setStage(
    `<h2 class="view-title">Brain Browser</h2>
     <p class="view-sub">The employee's competence &mdash; the six Wave-R expertise notes plus the MOC/ORG context. Search runs BM25 over <code>brain/</code> (the same ranking <code>pixel_brain_search</code> uses).</p>
     <div class="searchbar">
       <input type="search" id="brain-q" placeholder="search the brain — e.g. cacheComponents Clerk, Lenis GSAP one rAF, @apply no-op" />
       <button class="go" id="brain-go">Search</button>
     </div>
     <div id="brain-graph"></div>
     <div class="bento" id="brain-body"><div class="spinner">reading the brain&hellip;</div></div>`,
  );
  const q = document.getElementById("brain-q");
  const runSearch = async () => {
    const term = q.value.trim();
    if (!term) return renderBrainList();
    const body = document.getElementById("brain-body");
    body.innerHTML = `<div class="panel full"><div class="spinner">searching&hellip;</div></div>`;
    try {
      const res = await jget("/api/brain/search?q=" + encodeURIComponent(term));
      if (!res.hits || res.hits.length === 0) {
        body.innerHTML = `<div class="panel full"><p class="muted">No hits for &ldquo;${esc(term)}&rdquo;.${res.note ? " " + esc(res.note) : ""}</p></div>`;
        return;
      }
      body.innerHTML =
        `<div class="panel full"><h3>${res.hits.length} hits for &ldquo;${esc(term)}&rdquo;</h3>` +
        res.hits
          .map(
            (h) =>
              `<div class="hit"><div class="hit-head"><span class="hit-file" data-open="${esc(h.file)}" style="cursor:pointer">${esc(h.file)}</span><span class="hit-score">score ${h.score}</span></div><div class="hit-snip">${esc(h.snippet)}</div></div>`,
          )
          .join("") +
        `</div>`;
      wireBrainOpeners(body);
    } catch (e) {
      body.innerHTML = `<div class="panel full"><p class="muted">search failed: ${esc(e.message)}</p></div>`;
    }
  };
  document.getElementById("brain-go").addEventListener("click", runSearch);
  q.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") runSearch();
  });
  await renderBrainList();
}
async function renderBrainList() {
  const body = document.getElementById("brain-body");
  try {
    if (!_brainCache) _brainCache = await jget("/api/brain");
    const data = _brainCache;
    drawGraph(data);
    body.innerHTML = data.files
      .map(
        (f) =>
          `<div class="panel ${f.core ? "wide" : "narrow"}">` +
          `<h3 data-open="${esc(f.file)}" style="cursor:pointer">${esc(f.title)} ${f.core ? '<span class="chip ok" style="vertical-align:middle">core</span>' : ""}</h3>` +
          `<p>${esc(f.summary || "(no summary)").slice(0, 220)}</p>` +
          `<p class="muted" style="margin-top:8px;font-size:.78rem">${(f.bytes / 1024).toFixed(1)} KB &middot; ${f.links.length} wikilinks</p>` +
          `</div>`,
      )
      .join("");
    wireBrainOpeners(body);
  } catch (e) {
    body.innerHTML = `<div class="panel full"><p class="muted">could not load the brain: ${esc(e.message)}</p></div>`;
  }
}
function wireBrainOpeners(root) {
  root.querySelectorAll("[data-open]").forEach((el) =>
    el.addEventListener("click", () => openBrainFile(el.getAttribute("data-open"))),
  );
}
async function openBrainFile(file) {
  setStage(
    `<h2 class="view-title">${esc(file)}</h2>
     <p class="view-sub"><a href="#" id="back-brain">&larr; back to the brain</a></p>
     <div class="panel full md" id="brain-md"><div class="spinner">loading&hellip;</div></div>`,
  );
  document.getElementById("back-brain").addEventListener("click", (ev) => {
    ev.preventDefault();
    renderBrain();
  });
  try {
    const res = await jget("/api/brain/file?f=" + encodeURIComponent(file));
    const region = document.getElementById("brain-md");
    region.innerHTML = md(res.markdown);
    region.querySelectorAll(".wikilink").forEach((a) =>
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        const link = a.getAttribute("data-link");
        const target = (_brainCache?.files || []).find(
          (f) => f.file.replace(/\.md$/, "") === link || f.file === link + ".md",
        );
        if (target) openBrainFile(target.file);
      }),
    );
  } catch (e) {
    document.getElementById("brain-md").innerHTML = `<p class="muted">could not load ${esc(file)}: ${esc(e.message)}</p>`;
  }
}
// a simple deterministic circular layout of the wikilink graph (no d3 — keeps the cockpit dep-free)
function drawGraph(data) {
  const wrap = document.getElementById("brain-graph");
  if (!wrap || !data.files || data.files.length === 0) return;
  const W = 900;
  const H = 260;
  const cx = W / 2;
  const cy = H / 2;
  const R = 96;
  const nodes = data.files.map((f, i) => {
    const a = (i / data.files.length) * Math.PI * 2 - Math.PI / 2;
    return { id: f.file, x: cx + Math.cos(a) * R * (f.core ? 1 : 1.5), y: cy + Math.sin(a) * R * (f.core ? 1 : 1.5), core: f.core };
  });
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const edges = (data.edges || [])
    .map((e) => ({ a: pos.get(e.from), b: pos.get(e.to) }))
    .filter((e) => e.a && e.b);
  const svg =
    `<div class="graph-wrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="brain wikilink graph">` +
    edges.map((e) => `<line class="graph-edge" x1="${e.a.x.toFixed(0)}" y1="${e.a.y.toFixed(0)}" x2="${e.b.x.toFixed(0)}" y2="${e.b.y.toFixed(0)}" />`).join("") +
    nodes
      .map(
        (n) =>
          `<g class="graph-node" data-open="${esc(n.id)}"><circle cx="${n.x.toFixed(0)}" cy="${n.y.toFixed(0)}" r="${n.core ? 6 : 4}" fill="${n.core ? "oklch(0.80 0.15 72)" : "oklch(0.285 0.010 66)"}" stroke="oklch(1 0 0 / 0.10)" /><text x="${n.x.toFixed(0)}" y="${(n.y - 10).toFixed(0)}" text-anchor="middle">${esc(n.id.replace(/\.md$/, "").replace(/^MOC - /, ""))}</text></g>`,
      )
      .join("") +
    `</svg></div>`;
  wrap.innerHTML = svg;
  wrap.querySelectorAll(".graph-node").forEach((g) =>
    g.addEventListener("click", () => openBrainFile(g.getAttribute("data-open"))),
  );
}

// ════════════════════════════════════════════════════════════════════════════ VIEW: runs ═══════
async function renderRuns() {
  setStage(
    `<h2 class="view-title">Run Log</h2>
     <p class="view-sub">Append-only observability &mdash; every <code>pixel</code> invocation with its command, model, duration, gate results and exit code (<code>logs/runs.jsonl</code>). Newest last.</p>
     <div class="panel full" id="runs-body"><div class="spinner">reading the run log&hellip;</div></div>`,
  );
  const body = document.getElementById("runs-body");
  try {
    const data = await jget("/api/runs?last=120");
    if (!data.rows || data.rows.length === 0) {
      body.innerHTML = `<p class="muted">No runs recorded yet &mdash; run a pixel command.</p>`;
      return;
    }
    const rows = data.rows
      .slice()
      .reverse()
      .map((r) => {
        const gates = (r.gate_results || []).map((g) => `${chip(g.pass)}<span class="muted" style="font-size:.7rem"> ${esc(g.gate)}</span>`).join(" ");
        const exit = r.exit === 0 ? '<span class="chip ok">0</span>' : `<span class="chip fail">${esc(r.exit)}</span>`;
        return (
          `<tr><td class="mono">${esc(String(r.ts).slice(11, 19))}</td>` +
          `<td><strong>${esc(r.cmd)}</strong>${r.step ? ` <span class="muted">[${esc(r.step)}]</span>` : ""}</td>` +
          `<td>${r.model ? esc(r.model) : '<span class="muted">deterministic</span>'}</td>` +
          `<td class="num">${esc(r.duration_ms ?? 0)}ms</td>` +
          `<td>${gates || '<span class="muted">&mdash;</span>'}</td>` +
          `<td>${exit}</td></tr>`
        );
      })
      .join("");
    body.innerHTML =
      `<p class="muted" style="margin-bottom:12px">${data.total} total runs &middot; showing the last ${data.rows.length}</p>` +
      `<table><thead><tr><th>time</th><th>cmd</th><th>model</th><th>dur</th><th>gates</th><th>exit</th></tr></thead><tbody>${rows}</tbody></table>`;
  } catch (e) {
    body.innerHTML = `<p class="muted">could not load runs: ${esc(e.message)}</p>`;
  }
}

// ════════════════════════════════════════════════════════════════════════════ VIEW: evals ══════
async function renderEvals() {
  setStage(
    `<h2 class="view-title">Eval Scores</h2>
     <p class="view-sub">The golden-task pyramid (GT1&ndash;GT15, the L1 VERIFY greps from BATTLE-TESTED S1&ndash;S20 + L2/L3). A SKIP needs a booted app or the deferred Claude half; a CI-blocking FAIL reds the build.</p>
     <div id="eval-summary"></div>
     <div class="panel full" id="eval-body"><div class="spinner">running the eval pyramid (deterministic L1)&hellip;</div></div>`,
  );
  const body = document.getElementById("eval-body");
  const sum = document.getElementById("eval-summary");
  try {
    const data = await jget("/api/eval");
    if (data.error) {
      body.innerHTML = `<p class="muted">eval unavailable: ${esc(data.error)}</p>`;
      return;
    }
    const acc = data.exit === 0 ? '<span class="chip ok">&#10003; green</span>' : '<span class="chip fail">&#10007; red</span>';
    sum.innerHTML =
      `<div class="bento" style="margin-bottom:24px">` +
      `<div class="panel narrow"><div class="stat" style="text-align:left"><div class="v">${data.total}</div><div class="k">tasks</div></div></div>` +
      `<div class="panel narrow"><div class="stat" style="text-align:left"><div class="v" style="color:var(--ok)">${data.pass}</div><div class="k">pass</div></div></div>` +
      `<div class="panel narrow"><div class="stat" style="text-align:left"><div class="v" style="color:${data.fail ? "var(--err)" : "var(--text-lo)"}">${data.fail}</div><div class="k">fail</div></div></div>` +
      `<div class="panel narrow"><div class="stat" style="text-align:left"><div class="v" style="color:var(--warn)">${data.skip}</div><div class="k">skip</div></div></div>` +
      `<div class="panel wide"><h3>Acceptance gate ${acc}</h3><p class="muted">${data.blockingFails && data.blockingFails.length ? "blocking fails: " + esc(data.blockingFails.join(", ")) : "no CI-blocking golden task failed"}</p></div>` +
      `</div>`;
    body.innerHTML =
      `<table><thead><tr><th>task</th><th>level</th><th>scenario</th><th>result</th></tr></thead><tbody>` +
      data.results
        .map(
          (r) =>
            `<tr><td class="mono">${esc(r.id)}${r.ciBlock ? ' <span class="chip skip" style="font-size:.62rem">CI</span>' : ""}</td>` +
            `<td>${esc(r.level)}</td>` +
            `<td>${esc(r.scenario)}<div class="muted" style="font-size:.74rem;margin-top:2px">${esc(r.detail || "")}</div></td>` +
            `<td>${chip(r.pass)}</td></tr>`,
        )
        .join("") +
      `</tbody></table>`;
  } catch (e) {
    body.innerHTML = `<p class="muted">could not run evals: ${esc(e.message)}</p>`;
  }
}

// ════════════════════════════════════════════════════════════════════════════ VIEW: ask ════════
async function renderAsk() {
  setStage(
    `<h2 class="view-title">Ask the Employee</h2>
     <p class="view-sub">Ask a frontend question, or paste a snippet to taste-check it. The answer is grounded in <code>brain/</code> citations (BM25) and, for code, the deterministic OPINIONS slop-tells (O-F1 violet prior, O-F6 Inter, O-HS5 gray box). Keyless &mdash; no provider call.</p>
     <div class="searchbar" style="align-items:flex-start">
       <textarea id="ask-q" rows="3" placeholder="e.g. how do I integrate Lenis with GSAP? &nbsp;|&nbsp; paste:  className=&quot;bg-indigo-500 font-[Inter]&quot;"></textarea>
       <button class="go" id="ask-go">Ask</button>
     </div>
     <div id="ask-body"></div>`,
  );
  const q = document.getElementById("ask-q");
  const run = async () => {
    const prompt = q.value.trim();
    const body = document.getElementById("ask-body");
    if (!prompt) {
      body.innerHTML = `<p class="muted">type a question or paste a snippet.</p>`;
      return;
    }
    body.innerHTML = `<div class="spinner">consulting the brain&hellip;</div>`;
    try {
      const res = await jpost("/api/ask", { prompt });
      let html = "";
      if (res.taste_tells && res.taste_tells.length) {
        html +=
          `<div class="panel full" style="margin-bottom:16px"><h3>Taste-check &mdash; ${res.taste_tells.length} slop-tell${res.taste_tells.length > 1 ? "s" : ""} hit</h3>` +
          res.taste_tells.map((t) => `<p>${chip(false)} <strong>${esc(t.rule)}</strong> &mdash; ${esc(t.message)}</p>`).join("") +
          `</div>`;
      } else if (res.is_code) {
        html += `<div class="panel full" style="margin-bottom:16px"><h3>Taste-check ${chip(true)}</h3><p class="muted">no deterministic slop-tell hit in that snippet.</p></div>`;
      }
      if (res.citations && res.citations.length) {
        html +=
          `<div class="panel full"><h3>From the brain &mdash; ${res.citations.length} citation${res.citations.length > 1 ? "s" : ""}</h3>` +
          res.citations
            .map(
              (c) =>
                `<div class="hit"><div class="hit-head"><span class="hit-file">${esc(c.file)}</span><span class="hit-score">score ${c.score}</span></div><div class="hit-snip">${esc(c.snippet)}</div></div>`,
            )
            .join("") +
          `</div>`;
      } else {
        html += `<div class="panel full"><p class="muted">No brain citation matched.${res.note ? " " + esc(res.note) : ""} Try keywords from the stack (Next 16, Tailwind v4, RSC, Lenis).</p></div>`;
      }
      body.innerHTML = html;
    } catch (e) {
      body.innerHTML = `<p class="muted">ask failed: ${esc(e.message)}</p>`;
    }
  };
  document.getElementById("ask-go").addEventListener("click", run);
  q.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) run();
  });
}

// ── router + boot ────────────────────────────────────────────────────────────────────────────────
const VIEWS = { gallery: renderGallery, brain: renderBrain, runs: renderRuns, evals: renderEvals, ask: renderAsk };
function go(view) {
  const fn = VIEWS[view] ?? renderGallery;
  document.querySelectorAll(".rail button").forEach((b) => b.setAttribute("aria-current", String(b.getAttribute("data-view") === view)));
  fn();
}
document.querySelectorAll(".rail button").forEach((b) =>
  b.addEventListener("click", () => go(b.getAttribute("data-view"))),
);
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") go("gallery");
  if (ev.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) {
    const s = document.querySelector('input[type="search"], #ask-q');
    if (s) {
      ev.preventDefault();
      s.focus();
    }
  }
});

// masthead stat-strip (real counts) + initial view
(async function boot() {
  try {
    const s = await jget("/api/status");
    document.getElementById("stat-mocks").textContent = s.mockups;
    document.getElementById("stat-runs").textContent = s.runs;
    document.getElementById("stat-brain").textContent = s.brain_notes;
  } catch (_e) {
    /* masthead is non-critical — leave the dashes */
  }
  go("gallery");
})();
