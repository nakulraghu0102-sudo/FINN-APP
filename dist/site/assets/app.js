/* FINN — mobile-first investor agent. Vanilla JS, no build step.
   Talks to the FINN API when served by it (live), else reads the frozen snapshot in data/. */
"use strict";

// ---------------------------------------------------------------- utilities
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem("finn." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("finn." + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const IC = {
  brief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18.5" cy="16.5" r="2.5"/></svg>',
  trip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 3 4-7 5 6"/><path d="M3 21h18" opacity=".5"/></svg>',
  ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 15l3-3 2 2 3-4"/></svg>',
  spark: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0l1.6 5.2L15 7l-5.4 1.8L8 14l-1.6-5.2L1 7l5.4-1.8z"/></svg>',
  ext: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>',
  plus: '<svg class="i" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M8 3.5v9M3.5 8h9"/></svg>',
  minus: '<svg class="i" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3.5 8h9"/></svg>',
  dot: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="2.5"/></svg>',
  alert: '<svg class="i" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 2.5l6 11H2z"/><path d="M8 6.5v3.2M8 11.6v.01"/></svg>',
};
for (const k of ["spark", "ext", "check", "arrow"]) IC[k] = IC[k].replace("<svg ", '<svg class="i" ');

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
function cr(v) {
  if (v == null || isNaN(v)) return "—";
  const a = Math.abs(v);
  if (a >= 100000) return `₹${(v / 100000).toFixed(2)}L cr`;
  return `₹${inr.format(v)} cr`;
}
function pct(v, dp = 1, sign = true) {
  if (v == null || isNaN(v)) return "—";
  return `${sign && v > 0 ? "+" : ""}${Number(v).toFixed(dp)}%`;
}
const cls = (v) => (v == null ? "" : v > 0 ? "up" : v < 0 ? "down" : "");
const initials = (n) => n.replace(/^(Shri|Smt\.?|Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
function parseTs(ts) { return new Date(ts.length <= 19 ? ts : ts); }
function ago(ts) {
  const ms = state.now - parseTs(ts);
  const h = ms / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(ms / 6e4))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
const dfmt = (d, o = { day: "numeric", month: "short" }) => new Date(d).toLocaleDateString("en-IN", o);

// ---------------------------------------------------------------- state
const state = {
  mode: "snapshot", meta: null, portfolio: [], eod: {}, digest: null, research: {}, now: new Date(),
  view: "brief", win: store.get("win", { hours: 24 }), done: new Set(store.get("done", [])),
  rules: null, lens: "overview", symbol: null, names: {},
};
const LABEL = { results: "Results", m_and_a: "M&A", management_change: "Management", fund_raise: "Fund raise",
  litigation: "Legal / regulatory", pledging: "Pledge", insider_trading: "Insider trade", credit_rating: "Credit rating",
  capex: "Capex", press_release: "Update", earnings_call: "Concall", dividend: "Dividend", bonus_split: "Bonus / split",
  investor_meetings: "Investor meet", postal_ballot: "Postal ballot", agm_egm: "AGM / EGM", unclassified: "Routine" };

async function fetchJSON(url, ms = 20000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw Object.assign(new Error(`${r.status}`), { status: r.status, body: await r.text().catch(() => "") });
    return await r.json();
  } finally { clearTimeout(t); }
}

async function boot() {
  try {
    state.meta = await fetchJSON("/api/meta", 2500);
    state.mode = "live";
  } catch { state.mode = "snapshot"; }
  if (state.mode === "live") {
    const [port, eod, dig] = await Promise.all([fetchJSON("/api/portfolio"), fetchJSON("/api/eod"), fetchJSON("/api/digest?days=30", 90000)]);
    Object.assign(state, { portfolio: port, eod, digest: dig, now: new Date() });
    state.portfolio.forEach((p) => (state.names[p.symbol] = p.name));
    startStream();
  } else {
    const snap = await fetchJSON("data/snapshot.json");
    Object.assign(state, { meta: snap.meta, portfolio: snap.portfolio, eod: snap.eod, digest: snap.digest, now: new Date(snap.meta.now) });
    Object.assign(state.names, snap.meta.names || {});
  }
  state.rules = { ...state.meta.rules, breakouts: true, ...store.get("rules", {}) };
  const qw = new URLSearchParams(location.search).get("win");  // dev/demo link: ?win=168
  if (qw && +qw > 0) state.win = { hours: +qw };
  const last = store.get("lastVisit", null);
  state.lastVisit = last;
  store.set("lastVisit", state.now.toISOString());
  renderChrome();
  route();
  window.addEventListener("hashchange", route);
}

function route() {
  const h = (location.hash || "#brief").slice(1);
  if (h.startsWith("ask-")) { state.view = "ask"; openDossier(h.slice(4).toUpperCase(), false); }
  else { state.view = ["brief", "tripwires", "ask", "book"].includes(h) ? h : "brief"; render(); }
  $$(".tab").forEach((t) => t.setAttribute("aria-current", t.dataset.view === state.view ? "page" : "false"));
  window.scrollTo({ top: 0 });
}
function go(view) { location.hash = view; }

// ---------------------------------------------------------------- chrome
function renderChrome() {
  const live = state.mode === "live";
  $("#mode").outerHTML = `<span id="mode" class="pill ${live ? "live" : ""}"><span class="dot"></span>${live ? "Live" : `Snapshot · ${dfmt(state.now)} ${state.now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}</span>`;
  $("#tabs").innerHTML = [["brief", "Brief", IC.brief], ["tripwires", "Tripwires", IC.trip], ["ask", "Research", IC.ask], ["book", "Holdings", IC.book]]
    .map(([v, l, i]) => `<button class="tab" data-view="${v}" aria-current="false">${i}<span>${l}</span>${v === "brief" ? '<span class="badge" id="briefBadge" hidden></span>' : ""}</button>`).join("");
  $$(".tab").forEach((t) => t.addEventListener("click", () => go(t.dataset.view)));
  $("#about").addEventListener("click", showAbout);
  window.addEventListener("scroll", () => $(".topbar").classList.toggle("scrolled", window.scrollY > 4), { passive: true });
}

function render() {
  const v = $("#view");
  if (state.view === "brief") v.innerHTML = viewBrief();
  else if (state.view === "tripwires") v.innerHTML = viewTrip();
  else if (state.view === "ask") v.innerHTML = viewAsk();
  else v.innerHTML = viewBook();
  bind(v);
  updateBadge();
}

// ---------------------------------------------------------------- digest windowing
function allCards() { const d = state.digest; return d ? [...d.act, ...d.know, ...d.routine] : []; }
function windowBounds() {
  const w = state.win;
  if (w.start) return [new Date(w.start), w.end ? new Date(w.end + "T23:59:59") : state.now];
  if (w.since) return [new Date(w.since), state.now];
  return [new Date(state.now - w.hours * 36e5), state.now];
}
function windowed() {
  const [s, e] = windowBounds();
  const cards = allCards().filter((c) => { const t = parseTs(c.ts); return t >= s && t <= e; });
  const t = { act: [], know: [], routine: [] };
  cards.forEach((c) => t[c.tier].push(c));
  const groups = {};
  t.routine.forEach((c) => { const k = c.why || c.label; groups[k] = (groups[k] || 0) + 1; });
  const active = new Set(cards.map((c) => c.symbol));
  return { ...t, groups: Object.entries(groups).sort((a, b) => b[1] - a[1]), quiet: state.portfolio.filter((p) => !active.has(p.symbol)) };
}
function updateBadge() {
  const b = $("#briefBadge");
  if (!b) return;
  const n = windowed().act.filter((c) => !state.done.has(c.id)).length;
  b.hidden = !n; b.textContent = n;
}

// price reaction to a filing: first session on/after the filing day
function reaction(sym, ts) {
  const s = state.eod[sym], idx = state.eod["^NSEI"];
  if (!s) return null;
  const day = ts.slice(0, 10);
  const afterClose = parseTs(ts).getHours() >= 15 && parseTs(ts).getMinutes() >= 30 || parseTs(ts).getHours() >= 16;
  let k = s.dates.findIndex((d) => (afterClose ? d > day : d >= day));
  if (k < 1) return null;
  const ret = (s.close[k] / s.close[k - 1] - 1) * 100;
  const ik = idx ? idx.dates.indexOf(s.dates[k]) : -1;
  const mkt = ik > 0 ? (idx.close[ik] / idx.close[ik - 1] - 1) * 100 : 0;
  const v = s.volume.slice(Math.max(0, k - 20), k);
  const avg = v.reduce((a, b) => a + b, 0) / (v.length || 1);
  return { date: s.dates[k], ret, ex: ret - mkt, vm: avg ? s.volume[k] / avg : null };
}

// ---------------------------------------------------------------- BRIEF
const WINDOWS = [["24h", { hours: 24 }], ["3 days", { hours: 72 }], ["7 days", { hours: 168 }], ["30 days", { hours: 720 }]];
function winLabel() {
  const w = state.win;
  if (w.since) return "since your last visit";
  if (w.start) return `${dfmt(w.start)} – ${w.end ? dfmt(w.end) : "now"}`;
  return { 24: "in the last 24 hours", 72: "in the last 3 days", 168: "in the last 7 days", 720: "in the last 30 days" }[w.hours] || `in the last ${w.hours}h`;
}
function viewBrief() {
  const w = windowed();
  const actOpen = w.act.filter((c) => !state.done.has(c.id));
  const total = w.act.length + w.know.length;
  const cleared = [...w.act, ...w.know].filter((c) => state.done.has(c.id)).length;
  const dateLine = state.now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const weekend = [0, 6].includes(state.now.getDay());
  const n = actOpen.length;
  const flip = state.prevAct != null && n !== state.prevAct;
  state.prevAct = n;
  const word = n ? "need you" : w.know.length ? "nothing urgent" : "all quiet";
  const board = `<section class="board ${n ? "" : "clear"}" aria-label="${n} ${n === 1 ? "thing needs" : "things need"} you ${esc(winLabel())}">
    <div class="board-in">
      <h1 class="count">${n ? `<span class="flap${flip ? " flip" : ""}">${n}</span>` : ""}<span class="word">${esc(word.toUpperCase())}</span></h1>
      <div class="rule"></div>
      <div class="stats"><span><b>${w.know.length}</b>worth a glance</span><span><b>${w.routine.length}</b>routine filed</span><span><b>${w.quiet.length}</b>of ${state.portfolio.length} quiet</span></div>
      <p class="line2">${esc(dateLine)} · ${esc(winLabel())}</p></div></section>`;
  const lv = state.lastVisit && (state.now - new Date(state.lastVisit)) > 36e5;
  const chips = [
    lv ? `<button class="chip" data-win="since" aria-pressed="${!!state.win.since}">Since last visit</button>` : "",
    ...WINDOWS.map(([l, w2]) => `<button class="chip" data-win='${JSON.stringify(w2)}' aria-pressed="${!state.win.since && !state.win.start && state.win.hours === w2.hours}">${l}</button>`),
    `<button class="chip" data-win="custom" aria-pressed="${!!state.win.start}">${state.win.start ? esc(winLabel()) : "Custom…"}</button>`,
  ].join("");

  const all = w.act.length + w.know.length + w.routine.length || 1;
  const tier = (label, arr) => {
    const done = arr.filter((c) => state.done.has(c.id)).length;
    const blocks = sortDone(arr).map((c) => `<i class="${state.done.has(c.id) ? "off" : ""}"></i>`).join("");
    return `<div class="tierhead"><h2 class="head">${label} <span class="n">${arr.length}</span></h2>
      <span class="coaches" aria-hidden="true">${blocks}</span><span class="meta">${done}/${arr.length} cleared</span></div>`;
  };
  let body = "";
  if (!total && !w.routine.length) {
    body = `<div class="empty"><p><b>Nothing filed ${esc(winLabel())}.</b> ${weekend && state.win.hours === 24 ? "Exchanges were shut for the weekend." : ""}</p>
      <button class="btn primary" data-win='{"hours":72}'>Widen to 3 days</button></div>`;
  } else {
    if (w.act.length) body += tier("Needs you", w.act) + `<div class="stack">${sortDone(w.act).map(cardAct).join("")}</div>`;
    if (w.know.length) body += tier("Worth a glance", w.know) + `<div class="stack">${sortDone(w.know).map(cardKnow).join("")}</div>`;
    if (!w.act.length && w.know.length === 0 && w.routine.length) body += `<div class="empty"><p>Only routine paperwork ${esc(winLabel())}. FINN filed it away below.</p></div>`;
    if (w.routine.length) body += routineBlock(w);
  }
  return `<section class="view">${board}
    <div class="chips" role="group" aria-label="Time window">${chips}</div>
    ${body}
    ${w.quiet.length && total ? `<p class="quiet">Quiet: ${w.quiet.map((p) => esc(p.symbol)).join(", ")}</p>` : ""}
  </section>`;
}
const sortDone = (arr) => [...arr].sort((a, b) => state.done.has(a.id) - state.done.has(b.id));

function headlineFor(c) {
  if (c.results) {
    const L = c.results.lines;
    return `${c.results.label} results: revenue ${pct(L[0].yoy, 0)} YoY, PAT ${pct(L[3].yoy, 0)} YoY`;
  }
  if (c.person && c.person.people && c.person.people.length) {
    const p = c.person.people[0].name.replace(/^(Shri|Smt\.?|Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+/i, "");
    return `${p} ${c.person.action || "changes role"}${c.person.role ? ` as ${c.person.role}` : ""}`;
  }
  return c.gist || c.headline;
}
function proof(c, withReaction) {
  if (c.size) return c.size;
  if (c.results) {
    const L = c.results.lines, m = c.results.margin;
    return `revenue ${pct(L[0].yoy, 0)} YoY${m ? `, EBITDA margin ${m.now}%` : ""}`;
  }
  if (withReaction) { const r = reaction(c.symbol, c.ts); if (r) return `stock ${pct(r.ret)} next session (${pct(r.ex)} vs Nifty)`; }
  return "";
}
function whyLine(c, withReaction = true) {
  const parts = [c.why, proof(c, withReaction)].filter(Boolean);
  if (!parts.length) return "";
  return `<p class="why">${parts.map((p, i) => (i === 0 ? `<b>${esc(p)}</b>` : esc(p))).join(" · ")}</p>`;
}
// five-step emphasis ramp, driven by the materiality score
const step = (c) => (c.score >= 85 ? 5 : c.score >= 70 ? 4 : c.score >= 55 ? 3 : c.score >= 40 ? 2 : 1);
function reactLine(c) {
  const r = reaction(c.symbol, c.ts);
  if (!r) return "";
  return `<div class="react"><span>Stock on ${dfmt(r.date, { day: "numeric", month: "short" })}:</span>
    <b class="${cls(r.ret)}">${pct(r.ret)}</b><span class="muted">(${pct(r.ex)} vs Nifty)</span>${r.vm ? `<span>· ${r.vm.toFixed(1)}× avg volume</span>` : ""}</div>`;
}
function digLens(c) {
  return { results: "promises", earnings_call: "promises", fund_raise: "balance", litigation: "balance", management_change: "business",
    m_and_a: "business", credit_rating: "balance", pledging: "balance" }[c.category] || "overview";
}
function timeCol(c) {
  const d = parseTs(c.ts);
  const hm = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `<div class="tcol" aria-label="Filed ${esc(d.toLocaleString("en-IN"))}"><b>${d.getDate()}</b>${d.toLocaleDateString("en-IN", { month: "short" })}<br>${hm}</div>`;
}
function cardTop(c) {
  return `<div class="row"><button class="tick" data-dig="${esc(c.symbol)}" aria-label="Research ${esc(c.company)}">${esc(c.symbol)}</button><span class="co">${esc(c.company)} · ${ago(c.ts)}</span><span class="stamp e${step(c)}">${esc(c.label)}</span></div>`;
}
function cardActions(c) {
  return `<div class="actions">
    ${c.url ? `<a class="btn" href="${esc(c.url)}" target="_blank" rel="noopener">Filing ${IC.ext}</a>` : ""}
    <button class="btn" data-dig="${esc(c.symbol)}" data-lens="${digLens(c)}">Dig in ${IC.arrow}</button>
    <button class="btn ghost right" data-done="${esc(c.id)}">${state.done.has(c.id) ? "Undo" : `${IC.check} Done`}</button></div>`;
}
function cardAct(c) {
  const showFiled = (c.gist || c.results || c.person) && c.headline !== headlineFor(c);
  return `<article class="card e${step(c)} ${state.done.has(c.id) ? "done" : ""}" data-card="${esc(c.id)}">${timeCol(c)}<div class="body">
    ${cardTop(c)}
    <h3>${esc(headlineFor(c))}</h3>
    ${showFiled ? `<p class="filed">${esc(c.headline)}</p>` : ""}
    ${whyLine(c, !proof(c, false))}
    ${c.results ? resultsBlock(c.results, c.filing_check) : ""}
    ${c.person ? personBlock(c.person) : ""}
    ${c.related && c.related.length ? `<p class="related">+${c.related.length} related ${c.related.length === 1 ? "filing" : "filings"}: ${c.related.map((r) => esc(r.headline)).join("; ")}</p>` : ""}
    ${proof(c, false) ? reactLine(c) : ""}${cardActions(c)}</div></article>`;
}
function cardKnow(c) {
  return `<article class="card compact e${step(c)} ${state.done.has(c.id) ? "done" : ""}" data-card="${esc(c.id)}">${timeCol(c)}<div class="body">
    ${cardTop(c)}
    <h3>${esc(headlineFor(c))}</h3>${whyLine(c)}
    ${c.person ? personBlock(c.person) : ""}
    ${cardActions(c)}</div></article>`;
}
function resultsBlock(r, fc) {
  const rows = r.lines.map((l) => `<tr><td>${esc(l.metric)}</td><td class="v">${l.cur == null ? "—" : inr.format(l.cur)}</td>
    <td class="delta ${cls(l.qoq)}">${pct(l.qoq, 0)}</td><td class="delta ${cls(l.yoy)}">${pct(l.yoy, 0)}</td></tr>`).join("");
  const m = r.margin ? `<li>EBITDA margin ${r.margin.now}%${r.margin.bps != null ? ` (${r.margin.bps > 0 ? "+" : ""}${r.margin.bps} bps YoY)` : ""}</li>` : "";
  const reads = (r.read || []).filter((x) => !/EBITDA margin (expanded|compressed)/.test(x)).map((x) => `<li>${esc(x)}</li>`).join("");
  const check = fc && fc.agrees != null ? `<span class="check">${fc.agrees ? `${IC.check} Matches the filing PDF` : `${IC.alert} Differs from the filing PDF: check basis`}</span>` : "";
  return `<div><table class="qtable"><thead><tr><th>${esc(r.label)} · ₹ cr</th><th></th><th>QoQ</th><th>YoY</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${m || reads ? `<ul class="read">${m}${reads}</ul>` : ""}
    <p class="srcline">vs ${esc(r.prev_label)} and ${esc(r.year_ago_label || "")} · ${esc(r.basis)} · ${esc(r.source)} ${check}</p>`;
}
function personBlock(p) {
  if (!p.people || !p.people.length) return "";
  const x = p.people[0];
  const bio = p.bio;
  const facts = (bio && bio.facts && bio.facts.length ? bio.facts : p.facts) || [];
  return `<div class="person"><div class="avatar" aria-hidden="true">${esc(initials(x.name))}</div>
    <div><div class="nm">${esc(x.name)}</div><div class="rl">${esc([p.action, p.role].filter(Boolean).join(" · "))}${p.effective ? ` · w.e.f. ${esc(p.effective)}` : ""}</div>
    ${bio && bio.headline ? `<div class="rl"><b>${esc(bio.headline)}</b></div>` : ""}</div>
    ${facts.length ? `<dl class="facts">${facts.map((f) => `<div><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd></div>`).join("")}</dl>` : ""}
    ${p.profile ? `<details><summary>Profile from the filing</summary><p>${esc(p.profile)}</p></details>` : ""}
    <div class="links">${!p.profile && !(bio && bio.headline) ? `<span class="srcline">No profile in this filing.</span>` : ""}
      <a class="btn" href="${esc(x.linkedin)}" target="_blank" rel="noopener">Find on LinkedIn ${IC.ext}</a></div></div>`;
}
function routineBlock(w) {
  const items = w.routine.slice(0, 60).map((c) => `<li><span class="s">${esc(c.symbol)}</span><span class="t">${esc(c.gist || c.headline)}</span><span class="when">${ago(c.ts)}</span></li>`).join("");
  return `<details class="routine"><summary><span class="stamp routine">Handled</span><b>${w.routine.length} routine ${w.routine.length === 1 ? "filing" : "filings"}</b><span class="spacer"></span><span class="btn ghost">Show</span></summary>
    <div class="groups">${w.groups.map(([k, n]) => `<span class="g">${esc(k)}<b>${n}</b></span>`).join("")}</div>
    <ul class="rlist">${items}</ul></details>`;
}

// ---------------------------------------------------------------- TRIPWIRES (alert engine mirrors finn/engine/alerts.py)
function evaluate(rules, sessions = 60) {
  const idx = state.eod["^NSEI"], idxRet = {};
  if (idx) for (let k = 1; k < idx.close.length; k++) idxRet[idx.dates[k]] = (idx.close[k] / idx.close[k - 1] - 1) * 100;
  const n = rules.volume_lookback, out = [];
  for (const [sym, s] of Object.entries(state.eod)) {
    if (sym.startsWith("^")) continue;
    const c = s.close, v = s.volume, d = s.dates;
    for (let k = Math.max(n + 1, c.length - sessions); k < c.length; k++) {
      const ret = (c[k] / c[k - 1] - 1) * 100, mkt = idxRet[d[k]] || 0;
      const judged = rules.relative_to_index ? ret - mkt : ret;
      let sum = 0; for (let j = k - n; j < k; j++) sum += v[j];
      const avg = sum / n, vm = avg ? v[k] / avg : null;
      const why = [];
      if (Math.abs(judged) >= rules.price_move_pct) why.push("price");
      if (vm != null && vm >= rules.volume_multiple && v[k] > 0) why.push("volume");
      if (rules.breakouts && k >= 121) {
        const win = c.slice(Math.max(0, k - 250), k), hi = Math.max(...win), lo = Math.min(...win);
        const fresh = (dir) => { for (let j = Math.max(1, k - 5); j < k; j++) { const w2 = c.slice(Math.max(0, j - 250), j); if (dir > 0 ? c[j] > Math.max(...w2) : c[j] < Math.min(...w2)) return false; } return true; };
        if (c[k] > hi && fresh(1)) why.push("high52"); else if (c[k] < lo && fresh(-1)) why.push("low52");
      }
      if (why.length) out.push({ symbol: sym, date: d[k], close: c[k], ret, mkt, ex: ret - mkt, vm, why });
    }
  }
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : Math.abs(b.ex) - Math.abs(a.ex)));
  return out;
}
function likelyWhy(e) {
  const end = new Date(e.date + "T23:59:59"), start = new Date(end - 3.5 * 864e5);
  return allCards().filter((c) => c.symbol === e.symbol && c.tier !== "routine" && parseTs(c.ts) >= start && parseTs(c.ts) <= end)
    .sort((a, b) => b.score - a.score)[0];
}
const CAT_CHOICES = ["results", "m_and_a", "management_change", "fund_raise", "litigation", "credit_rating", "pledging", "insider_trading", "capex", "dividend", "earnings_call", "press_release"];
function viewTrip() {
  const r = state.rules;
  const ev = evaluate(r);
  const weeks = 12, perWeek = ev.length / (60 / 5);
  const bins = Array(weeks).fill(0);
  const lastDate = new Date((state.eod.RELIANCE || Object.values(state.eod)[0]).dates.slice(-1)[0]);
  ev.forEach((e) => { const wk = Math.floor((lastDate - new Date(e.date)) / (7 * 864e5)); if (wk < weeks) bins[weeks - 1 - wk]++; });
  const advice = perWeek > 10 ? ["warn", "Noisy. At this pace alerts become wallpaper. Raise the price or volume bar."]
    : perWeek < 0.75 ? ["warn", "Very quiet. You may miss genuine moves. Consider lowering a threshold."]
    : ["ok", "A pace you can act on."];
  const filingAlerts = allCards().filter((c) => r.categories.includes(c.category) && c.tier !== "routine" && (state.now - parseTs(c.ts)) < 7 * 864e5);
  const recent = ev.slice(0, 30);
  return `<section class="view">
    <div class="stack" style="gap:6px"><h1 class="page-title">You decide what <em>unusual</em> means.</h1>
      <p class="lede">FINN watches end-of-day prices and every filing, and only taps you when a rule trips.</p></div>
    <div class="panel"><h2 class="head">Price and volume</h2>
      <div class="rule"><label for="rPrice">Price move in a day <output id="oPrice">±${r.price_move_pct.toFixed(1)}%</output></label>
        <input id="rPrice" type="range" min="1" max="10" step="0.5" value="${r.price_move_pct}"></div>
      <label class="switch"><span>Judge moves net of the Nifty<small>A market-wide fall shouldn't page you 18 times.</small></span><input id="rRel" type="checkbox" ${r.relative_to_index ? "checked" : ""}></label>
      <div class="rule"><label for="rVol">Volume vs ${r.volume_lookback}-day average <output id="oVol">${r.volume_multiple.toFixed(2)}×</output></label>
        <input id="rVol" type="range" min="1.25" max="5" step="0.25" value="${r.volume_multiple}"></div>
      <label class="switch"><span>52-week high / low breaks<small>First break in a week only.</small></span><input id="rBrk" type="checkbox" ${r.breakouts ? "checked" : ""}></label>
      <div class="meter"><h3 class="head">Last 60 sessions with these rules</h3>
        <div class="rate"><b>${ev.length}</b><span>alerts · ≈${perWeek.toFixed(1)} a week across ${state.portfolio.length} holdings</span></div>
        ${barMini(bins)}
        <p class="advice ${advice[0]}">${advice[0] === "ok" ? IC.check : IC.alert}${advice[1]}</p></div>
    </div>
    <div class="panel"><h2 class="head">Filings that trip an alert</h2>
      <div class="chips wrap">${CAT_CHOICES.map((k) => `<button class="chip" data-cat="${k}" aria-pressed="${r.categories.includes(k)}">${LABEL[k]}</button>`).join("")}</div>
      <p class="srcline">${filingAlerts.length} filing ${filingAlerts.length === 1 ? "alert" : "alerts"} in the last 7 days with this selection.</p>
      ${notifyRow()}</div>
    <h2 class="head">Tripped <span class="n">${recent.length}${ev.length > recent.length ? ` of ${ev.length}` : ""}</span></h2>
    ${filingAlerts.length || recent.length ? `<ul class="chartlist">${filingAlerts.slice(0, 6).map(filingEv).join("")}${recent.map(priceEv).join("")}</ul>`
      : '<div class="empty"><p>No price or volume rule tripped in 60 sessions. Your thresholds may be too strict.</p></div>'}
  </section>`;
}
function notifyRow() {
  if (!("Notification" in window)) return "";
  const on = store.get("notify", false) && Notification.permission === "granted";
  return `<label class="switch"><span>Notify this device<small>${state.mode === "live" ? "New material filings arrive as notifications while FINN is open." : "Available when FINN runs live."}</small></span><input id="rNotify" type="checkbox" ${on ? "checked" : ""} ${state.mode === "live" ? "" : "disabled"}></label>`;
}
function priceEv(e) {
  const tags = e.why.map((w) => ({ price: `${pct(e.ret)} move`, volume: `${e.vm.toFixed(1)}× volume`, high52: "52-week high", low52: "52-week low" }[w]));
  const f = likelyWhy(e);
  const d = new Date(e.date + "T15:30:00");
  return `<li class="crow"><div class="tcol"><b>${d.getDate()}</b>${d.toLocaleDateString("en-IN", { month: "short" })}<br>close</div><div class="cbody">
    <div class="l1"><button class="tick" data-dig="${esc(e.symbol)}">${esc(e.symbol)}</button><b class="fig ${cls(e.ret)}">${pct(e.ret)}</b><span class="vs">${pct(e.ex)} vs Nifty</span></div>
    <div class="l2"><span class="k">Tripped</span>${tags.map(esc).join(" · ")}</div>
    ${f ? `<div class="l2"><span class="k">Likely why</span>${esc(f.label)} · ${esc(headlineFor(f))} <span class="muted">(${dfmt(f.ts)})</span></div>` : ""}</div></li>`;
}
function filingEv(c) {
  return `<li class="crow e${step(c)}">${timeCol(c)}<div class="cbody"><div class="l1"><button class="tick" data-dig="${esc(c.symbol)}">${esc(c.symbol)}</button><span class="stamp e${step(c)}">${esc(c.label)}</span></div>
    <div class="l2">${esc(headlineFor(c))}</div></div></li>`;
}
function barMini(bins) {
  const W = 320, H = 46, bw = W / bins.length, max = Math.max(1, ...bins);
  const bars = bins.map((b, i) => `<rect x="${i * bw + 2}" y="${H - 14 - (b / max) * (H - 18)}" width="${bw - 4}" height="${Math.max(1, (b / max) * (H - 18))}" rx="2" class="b1"/>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Alerts per week, last 12 weeks">${bars}
    <text x="0" y="${H - 2}">12 weeks ago</text><text x="${W}" y="${H - 2}" text-anchor="end">this week</text></svg>`;
}

// ---------------------------------------------------------------- ASK / RESEARCH
const LENSES = [["overview", "Overview"], ["snapshot", "Numbers"], ["trajectory", "Trajectory"], ["balance", "Balance sheet"], ["cash", "Cash quality"], ["promises", "Promise vs delivery"], ["bullbear", "Bull / bear"], ["business", "Business"]];
const LENS_WORDS = [[/cash|convert|fcf|free cash/i, "cash"], [/debt|leverage|balance|working capital|receivable|borrow/i, "balance"],
  [/promise|guid|deliver|credib|management (said|say)|narrative|concall/i, "promises"], [/bull|bear|case|thesis|risk/i, "bullbear"],
  [/grow|trajectory|trend|margin|history|cagr/i, "trajectory"], [/business|segment|what does|about|mix/i, "business"], [/number|valuation|p\/?e|snapshot|ratio/i, "snapshot"]];
function viewAsk() {
  if (state.symbol && state.research[state.symbol]) return dossier(state.research[state.symbol]);
  const port = state.portfolio.map((p) => `<button class="chip" data-dig="${esc(p.symbol)}">${esc(p.symbol)}</button>`).join("");
  const demo = (state.meta.research_demo || []).map((s) => `<button class="chip" data-dig="${esc(s)}">${esc(s)}</button>`).join("");
  return `<section class="view">
    <div class="stack" style="gap:6px"><h1 class="page-title">Ask about <em>any</em> NSE company.</h1>
      <p class="lede">A first-hour analyst dossier built only from filings, annual reports and concall transcripts.</p></div>
    ${askBox()}
    <div class="panel"><h2 class="head">Try</h2>
      <div class="chips wrap">
        <button class="chip plain" data-q="Is KPIT delivering on its guidance?">Is KPIT delivering on its guidance?</button>
        <button class="chip plain" data-q="Asian Paints cash quality">Asian Paints cash quality</button>
        <button class="chip plain" data-q="Polycab promise vs delivery">Polycab promise vs delivery</button>
        <button class="chip plain" data-q="HDFC Bank balance sheet">HDFC Bank balance sheet</button></div>
      <h2 class="head">Outside your portfolio</h2><div class="chips wrap">${demo}</div>
      <h2 class="head">Your holdings</h2><div class="chips wrap">${port}</div>
      ${state.mode === "snapshot" ? `<p class="srcline">This snapshot carries dossiers for the 22 companies above. Run FINN live to research any other NSE symbol.</p>` : ""}</div>
  </section>`;
}
function askBox(val = "") {
  const voice = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  return `<form class="askbox" id="askForm" role="search"><input id="askInput" autocomplete="off" placeholder="e.g. Is Dixon delivering on guidance?" value="${esc(val)}" aria-label="Ask about a company">
    ${voice ? `<button type="button" class="iconbtn" id="mic" aria-label="Ask by voice">${IC.mic}</button>` : ""}
    <button class="btn primary" type="submit">Ask</button></form>`;
}
function resolveQuery(q) {
  const lens = (LENS_WORDS.find(([re]) => re.test(q)) || [null, "overview"])[1];
  const words = q.toUpperCase().replace(/[^A-Z0-9& ]/g, " ").split(/\s+/).filter(Boolean);
  const syms = Object.keys(state.names);
  let sym = words.find((w) => syms.includes(w));
  if (!sym) {
    const ql = q.toLowerCase();
    let best = null, bestLen = 0;
    for (const [s, n] of Object.entries(state.names)) {
      const core = n.toLowerCase().replace(/\b(ltd|limited|india|industries|company|the|\(india\)|\(i\))\b/g, "").replace(/[^a-z& ]/g, " ").trim();
      const tokens = core.split(/\s+/).filter((t) => t.length > 2);
      const first2 = tokens.slice(0, 2).join(" ");
      if (first2 && ql.includes(first2) && first2.length > bestLen) { best = s; bestLen = first2.length; }
      else if (tokens[0] && tokens[0].length > 3 && new RegExp(`\\b${tokens[0]}\\b`).test(ql) && tokens[0].length > bestLen) { best = s; bestLen = tokens[0].length; }
    }
    sym = best;
  }
  if (!sym) sym = words.find((w) => w.length >= 3 && !/^(IS|THE|AND|ITS|HOW|WHAT|ON|OF|CASH|DEBT|BULL|BEAR|CASE|GUIDANCE|QUALITY|DELIVERING|PROMISE|VS|DELIVERY|BALANCE|SHEET|SHOW|ME|MANAGEMENT|WHY|DOES)$/.test(w));
  return { sym, lens };
}
async function ask(q) {
  const { sym, lens } = resolveQuery(q);
  if (!sym) return toast("Name a company or NSE symbol, e.g. TITAN.");
  if (state.mode === "live" && !state.names[sym]) {
    try {
      const hits = await fetchJSON(`/api/search?q=${encodeURIComponent(q.replace(/(cash|quality|debt|guidance|promise|delivery|bull|bear|balance sheet)/gi, ""))}`, 8000);
      if (hits.length && !hits.some((h) => h.symbol === sym)) { state.names[hits[0].symbol] = hits[0].name; return openDossier(hits[0].symbol, true, lens); }
    } catch { /* fall through */ }
  }
  openDossier(sym, true, lens);
}
async function openDossier(sym, push = true, lens = "overview") {
  state.symbol = sym; state.lens = lens; state.view = "ask";
  if (push && location.hash !== `#ask-${sym}`) { history.replaceState(null, "", `#ask-${sym}`); }
  $$(".tab").forEach((t) => t.setAttribute("aria-current", t.dataset.view === "ask" ? "page" : "false"));
  if (!state.research[sym]) {
    $("#view").innerHTML = `<section class="view">${askBox(sym)}<div class="panel loading"><h2 class="head">Building the ${esc(sym)} dossier</h2>
      <p class="srcline">Reading the last four concall transcripts and 10+ years of filed financials…</p><div class="skel"></div><div class="skel" style="width:70%"></div><div class="skel" style="width:85%"></div></div></section>`;
    bind($("#view"));
    try {
      state.research[sym] = await fetchJSON(state.mode === "live" ? `/api/research/${sym}` : `data/research/${sym}.json`, 240000);
      state.names[sym] = state.research[sym].name;
    } catch (e) {
      const msg = state.mode === "live" ? (e.status === 404 ? `Couldn't find ${sym}. Use the NSE symbol, e.g. ASIANPAINT.` : `Research failed (${e.message}). Try again.`)
        : `${sym} isn't in this snapshot. Run FINN live (README → Run) to research any NSE symbol.`;
      $("#view").innerHTML = `<section class="view">${askBox(sym)}<div class="empty"><p>${esc(msg)}</p><button class="btn" data-go="ask">Back to suggestions</button></div></section>`;
      state.symbol = null; bind($("#view"));
      return;
    }
  }
  render();
}

function dossier(R) {
  const S = R.lenses.snapshot, port = state.portfolio.find((p) => p.symbol === R.symbol);
  const eod = state.eod[R.symbol];
  const chg = eod && eod.close.length > 1 ? (eod.close.at(-1) / eod.close.at(-2) - 1) * 100 : null;
  const nar = R.lenses.narrative;
  const head = `<div class="dhead"><h1>${esc(R.name)}</h1>
    <div class="meta"><span class="tick">${esc(R.symbol)}</span><span class="stamp ${port ? "e3" : "routine"}">${port ? "In your portfolio" : "Not held"}</span><span>${esc(R.basis)} figures</span></div>
    <div class="meta"><span class="px">₹${S.price != null ? inr2.format(S.price) : "—"}</span>${chg != null ? `<span class="${cls(chg)}" style="font-weight:700">${pct(chg)}</span>` : ""}
      <span>Mcap ${cr(S.mcap_cr)}</span><span>P/E ${S.pe ?? "—"}</span><span>Latest: ${esc(R.quarter || "—")}</span></div></div>`;
  const lensbar = `<div class="lensbar"><div class="chips" role="tablist" aria-label="Lenses">${LENSES.map(([k, l]) => `<button class="chip" role="tab" data-lens-tab="${k}" aria-pressed="${state.lens === k}">${l}</button>`).join("")}</div></div>`;
  return `<section class="view">${askBox()}${head}${lensbar}<div id="lens">${lensBody(R, state.lens)}</div>
    <div class="sources"><h2 class="head">Primary sources used</h2>${R.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ${IC.ext}</a>`).join("")}
    <p class="srcline">Built ${esc(R.as_of.replace("T", " "))} · ${nar ? "Narrative by the reasoning model, grounded in the facts above." : "Rules tier only: every line is computed from reported numbers."}</p></div></section>`;
}
const glyph = (t) => `<span class="tone ${t === "+" ? "p" : t === "-" ? "n" : "z"}" role="img" aria-label="${t === "+" ? "positive" : t === "-" ? "negative" : "neutral"}">${t === "+" ? IC.plus : t === "-" ? IC.minus : IC.dot}</span>`;
const sigList = (arr) => (arr.length ? `<ul class="siglist">${arr.map((s) => `<li>${glyph(s.tone)}<span>${esc(s.text)}</span></li>`).join("")}</ul>` : "");
function lensBody(R, lens) {
  const L = R.lenses, sig = (name) => R.signals.filter((s) => s.lens === name);
  if (lens === "overview") {
    const nar = L.narrative;
    const q = L.snapshot.latest_quarter;
    return `<div class="stack">
      ${nar && nar.what_matters ? `<div class="panel"><h2 class="head">What matters</h2><p style="margin:0;font-size:16px">${esc(nar.what_matters)}</p></div>` : ""}
      <div class="panel"><h2 class="head">The strongest signals</h2><ul class="matters">${R.verdict.map((s) => `<li>${glyph(s.tone)}<span>${esc(s.text)} <span><span class="lens">${esc(lensName(s.lens))}</span></span></li>`).join("") || "<li>Not enough reported history to call anything strongly.</li>"}</ul></div>
      ${q ? `<div class="panel"><h2 class="head">Latest quarter · ${esc(q.label)}</h2>${resultsBlock(q)}</div>` : ""}
      ${promiseTeaser(L.promises)}
    </div>`;
  }
  if (lens === "snapshot") {
    const S = L.snapshot, t = S.ttm || {};
    const tiles = [["Revenue TTM", cr(t.revenue)], [R.is_financial ? "PAT margin" : "EBITDA margin", R.is_financial ? pct(t.pat_margin, 1, false) : pct(t.opm, 1, false)], ["PAT TTM", cr(t.pat)],
      ["ROCE", S.roce != null ? `${S.roce}%` : "—"], ["ROE", S.roe != null ? `${S.roe}%` : "—"], [R.is_financial ? "Assets ÷ equity" : "Debt / equity", R.is_financial ? (L.balance.assets_to_equity ?? "—") + "×" : S.de ?? "—"],
      ["P/E", S.pe ?? "—"], ["P/B", S.pb ?? "—"], ["Div. yield", S.div_yield != null ? `${S.div_yield}%` : "—"]];
    return `<div class="stack"><div class="tiles">${tiles.map(([k, v]) => `<div class="tile"><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div>
      ${S.range_pos != null ? `<div class="figure"><h3>52-week range <small>${S.range_pos}% of the way up</small></h3><div class="rangebar"><i style="left:${S.range_pos}%"></i></div>
        <div class="legend" style="justify-content:space-between"><span>₹${inr.format(S.low_52w)}</span><span>₹${inr.format(S.high_52w)}</span></div></div>` : ""}
      ${S.latest_quarter ? `<div class="panel"><h2 class="head">Latest quarter · ${esc(S.latest_quarter.label)}</h2>${resultsBlock(S.latest_quarter)}</div>` : ""}
      ${sigList(sig("snapshot"))}</div>`;
  }
  if (lens === "trajectory") {
    const T = L.trajectory, c = T.cagr, Q = T.quarterly;
    const cagr = [["Revenue 3y", c.rev3], ["Revenue 5y", c.rev5], ["PAT 3y", c.pat3], ["PAT 5y", c.pat5]];
    return `<div class="stack"><div class="tiles four">${cagr.map(([k, v]) => `<div class="tile"><span>${k}</span><b class="${cls(v)}">${v == null ? "—" : pct(v, 0)}</b><small>CAGR</small></div>`).join("")}</div>
      ${sigList(sig("trajectory"))}
      <div class="figure"><h3>Revenue and profit <small>₹ cr, fiscal years</small></h3>${bars(T.years, [T.revenue, T.pat], ["b1", "b2"])}
        <div class="legend"><span><i style="background:var(--accent)"></i>Revenue</span><span><i style="background:var(--know);opacity:.55"></i>PAT</span></div></div>
      ${T.opm ? `<div class="figure"><h3>Operating (EBITDA) margin <small>% of revenue</small></h3>${line(T.years, T.opm, "%")}</div>` : ""}
      ${Q ? `<div class="figure"><h3>Revenue growth, quarter by quarter <small>YoY %</small></h3>${bars(Q.labels.slice(-9), [Q.rev_yoy.slice(-9)], ["signed"], "%")}</div>` : ""}
      ${Q && Q.opm ? `<div class="figure"><h3>Quarterly EBITDA margin <small>%</small></h3>${line(Q.labels.slice(-9), Q.opm.slice(-9), "%")}</div>` : ""}</div>`;
  }
  if (lens === "balance") {
    const B = L.balance, W = B.wc, SH = L.shareholding;
    const wcRows = [["Debtor days", W.debtor_days], ["Inventory days", W.inventory_days], ["Payable days", W.payable_days], ["Cash conversion cycle", W.ccc], ["ROCE %", W.roce], ["ROE %", W.roe]]
      .filter(([, v]) => v && v.some((x) => x != null));
    return `<div class="stack">${sigList(sig("balance"))}${B.note ? `<p class="note">${esc(B.note)}</p>` : ""}
      ${!B.is_financial ? `<div class="figure"><h3>Borrowings vs net worth <small>₹ cr</small></h3>${bars(B.cols, [B.equity, B.borrowings], ["b2", "b1"])}
        <div class="legend"><span><i style="background:var(--know);opacity:.55"></i>Net worth</span><span><i style="background:var(--accent)"></i>Borrowings</span></div>
        <p class="srcline">Debt / equity: ${B.de.map((x) => (x == null ? "—" : x.toFixed(2))).join(" → ")}</p></div>` : ""}
      ${wcRows.length ? `<div class="figure"><h3>Working capital and returns</h3><div class="scroll-x">${table(B.wc_cols, wcRows)}</div></div>` : ""}
      ${SH ? `<div class="figure"><h3>Who owns it <small>% of shares</small></h3><div class="scroll-x">${table(SH.cols, [["Promoters", SH.promoters], ["FIIs", SH.fii], ["DIIs", SH.dii], ["Public", SH.public]].filter(([, v]) => v.some((x) => x != null)), 2)}</div></div>` : ""}</div>`;
  }
  if (lens === "cash") {
    const C = L.cash;
    if (C.is_financial) return `<div class="stack"><p class="note">${esc(C.note)}</p>${sigList(sig("cash"))}</div>`;
    return `<div class="stack">${sigList(sig("cash"))}
      <div class="tiles"><div class="tile"><span>CFO ÷ PAT, 5y</span><b>${C.conversion_5y != null ? C.conversion_5y + "%" : "—"}</b><small>cash conversion</small></div>
        <div class="tile"><span>FCF yield</span><b>${C.fcf_yield != null ? C.fcf_yield + "%" : "—"}</b><small>latest FY</small></div>
        <div class="tile"><span>FCF &lt; 0</span><b>${C.fcf_negative_years ?? "—"}</b><small>of last 5 yrs</small></div></div>
      <div class="figure"><h3>Profit vs operating cash flow <small>₹ cr</small></h3>${bars(C.years, [C.pat, C.cfo], ["b2", "b1"])}
        <div class="legend"><span><i style="background:var(--know);opacity:.55"></i>PAT</span><span><i style="background:var(--accent)"></i>Cash from operations</span></div></div>
      <div class="figure"><h3>Free cash flow <small>₹ cr</small></h3>${bars(C.years, [C.fcf], ["signed"])}</div></div>`;
  }
  if (lens === "promises") return promisesLens(L.promises, R);
  if (lens === "bullbear") {
    const nar = L.narrative, B = L.bullbear;
    const bull = nar && nar.bull && nar.bull.length ? nar.bull : B.bull.map((s) => s.text);
    const bear = nar && nar.bear && nar.bear.length ? nar.bear : B.bear.map((s) => s.text);
    return `<div class="stack"><div class="bb"><div class="side"><h3>${IC.plus} Bull</h3><ul>${bull.map((x) => `<li>${esc(x)}</li>`).join("") || "<li>No strong positive signal.</li>"}</ul></div>
      <div class="side"><h3>${IC.minus} Bear</h3><ul>${bear.map((x) => `<li>${esc(x)}</li>`).join("") || "<li>No strong negative signal.</li>"}</ul></div></div>
      <p class="srcline">${nar && nar.bull ? "Written by the reasoning model from the computed facts and the latest call's prepared remarks." : esc(B.method) + ". No price targets, no outside opinion."}</p></div>`;
  }
  if (lens === "business") {
    const Bz = L.business;
    return `<div class="stack"><div class="panel"><h2 class="head">What it does</h2><p style="margin:0">${esc(Bz.about || "—")}</p><p class="srcline">${esc(Bz.about_source)}</p></div>
      ${Bz.segments && Bz.segments.length ? `<div class="figure"><h3>Segments <small>as stated on the latest call</small></h3>${table(["Share", "Note"], Bz.segments.map((s) => [s.name, [s.share, s.note]]), 0, true)}</div>`
        : `<p class="note">Segment mix is read from the latest concall by the model tier. ${state.meta.llm && state.meta.llm.provider ? "" : "It isn't configured in this build, so FINN shows only what the filings state directly."}</p>`}
      ${L.promises && L.promises.opening ? `<details class="panel"><summary class="head" style="cursor:pointer">Management's own framing (latest call, opening remarks)</summary><p style="margin:0;font-size:13.5px;color:var(--ink-2)">${esc(L.promises.opening.slice(0, 1600))}…</p></details>` : ""}</div>`;
  }
  return "";
}
const lensName = (k) => ({ snapshot: "valuation", trajectory: "trajectory", balance: "balance sheet", cash: "cash quality", promises: "promise vs delivery" }[k] || k);
function promiseTeaser(P) {
  if (!P) return "";
  const s = P.score || {}, judged = (s.delivered || 0) + (s.beat || 0) + (s.missed || 0);
  if (!P.calls || !P.calls.length) return `<div class="panel"><h2 class="head">Promise vs delivery</h2><p class="note">No concall transcripts on file. Some companies (ITC is one) don't hold earnings calls, so there is no guidance to audit.</p></div>`;
  return `<div class="panel"><h2 class="head">Promise vs delivery · last ${P.calls.length} calls</h2>
    ${P.verdict && P.verdict.headline ? `<p style="margin:0;font-weight:650">${esc(P.verdict.headline)}</p>` : ""}
    <div class="score">${scoreBadges(s)}</div>
    <p class="srcline">${judged ? `${judged} ${judged === 1 ? "commitment" : "commitments"} could be checked against the reported quarters.` : "No commitment could be scored against reported numbers yet."}</p>
    <button class="btn" data-lens-tab="promises">See every promise ${IC.arrow}</button></div>`;
}
function scoreBadges(s) {
  const lab = { delivered: "Delivered", beat: "Beat", missed: "Missed", pending: "Pending", "long-dated": "Long-dated", untracked: "Context only" };
  return Object.entries(lab).filter(([k]) => s[k]).map(([k, l]) => `<span class="badge ${k}">${l} <b class="mono">${s[k]}</b></span>`).join("");
}
function promisesLens(P, R) {
  if (!P) return `<p class="note">Transcripts unavailable.</p>`;
  if (!P.calls.length) return `<p class="note">No concall transcripts on file for ${esc(R.name)}. Some companies don't hold earnings calls, so there is no spoken guidance to audit. FINN won't invent one.</p>`;
  const model = P.mode === "model";
  const byCall = {};
  P.claims.forEach((c) => (byCall[c.call] = byCall[c.call] || []).push(c));
  const threads = (P.threads || []).filter((t) => t.times >= 2 || t.drift);
  return `<div class="stack">
    <div class="panel"><h2 class="head">Last ${P.calls.length} earnings calls · ${P.calls.map((c) => esc(c.label)).join(", ")}</h2>
      ${P.verdict && P.verdict.headline ? `<p style="margin:0;font-size:16px;font-weight:650">${esc(P.verdict.headline)}</p>${P.verdict.points ? `<ul class="read">${P.verdict.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}` : ""}
      <div class="score">${scoreBadges(P.score)}</div>
      <p class="note">${model ? "Claims classified by the extraction model from management's own sentences; outcomes are computed from reported quarters, never by the model."
        : "Rules tier: management sentences with a number and a forward-looking verb. Only explicit company-level margin or revenue commitments are scored; the rest are shown as context. Add an API key to let the extraction model classify every statement."}</p>
      ${sigList(R.signals.filter((s) => s.lens === "promises"))}</div>
    ${threads.length ? `<div class="figure"><h3>Repeated themes</h3><ul class="siglist">${threads.slice(0, 5).map((t) => `<li>${glyph(t.drift ? (t.drift.dir === "raised" ? "+" : "-") : "0")}<span>${esc(themeText(t))}</span></li>`).join("")}</ul></div>` : ""}
    ${Object.entries(byCall).map(([call, cs]) => `<div class="callhead"><b>${esc(call)} call</b><a href="${esc((P.calls.find((c) => c.label === call) || {}).url || "#")}" target="_blank" rel="noopener" class="btn ghost">Transcript ${IC.ext}</a></div>
      ${cs.slice(0, 6).map(claimCard).join("")}`).join("")}
  </div>`;
}
function themeText(t) {
  const u = t.unit, rng = (a, b) => (b == null ? `${a}+` : a === b ? `${a}` : `${a}–${b}`);
  const what = `${t.metric === "margin" ? "Margin" : t.metric === "growth" ? "Revenue growth" : t.metric === "capex" ? "Capex" : "Target"}${t.segment ? ` (${t.segment})` : ""}`;
  if (t.drift) return `${what} guidance ${t.drift.dir}: ${rng(t.drift.from[1], t.drift.from[2])}${u} in ${t.drift.from[0]} → ${rng(t.drift.to[1], t.drift.to[2])}${u} in ${t.drift.to[0]}`;
  return `${what} of ${rng(t.latest.low, t.latest.high)}${u} repeated on ${t.times} of the calls`;
}
function claimCard(c) {
  const ch = c.check || {}, st = ch.status || "untracked";
  const lab = { delivered: "Delivered", beat: "Beat", missed: "Missed", pending: "Pending", "long-dated": "Long-dated", untracked: "Context" }[st];
  const rng = c.high == null ? `${c.low}+` : c.low === c.high ? `${c.low}` : `${c.low}–${c.high}`;
  const acts = (ch.actuals || []).map(([q, v]) => `${q} ${v}%`).join(" · ");
  return `<div class="claim">${c.promise ? `<div class="promise">${esc(c.promise)}</div>` : ""}
    <blockquote>“${esc(c.quote)}”</blockquote>
    <div class="meta"><span class="badge ${st}">${lab}</span><span>${esc(c.metric)} · ${esc(rng)}${esc(c.unit)}</span><span>${esc(c.scope === "segment" ? `segment${c.segment ? ": " + c.segment : ""}` : "company")}</span><span>${esc(c.horizon_label)}</span><span>${esc(c.speaker)} · p.${c.page}</span></div>
    ${ch.note ? `<div class="res">${esc(ch.note)}${acts ? ` <span class="muted">(${esc(acts)})</span>` : ""}</div>` : ""}</div>`;
}

// ---------------------------------------------------------------- charts (hand-drawn SVG, theme tokens)
function niceMax(v) { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); return Math.ceil(v / p) * p; }
function shortNum(v) { const a = Math.abs(v); return a >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : a >= 1000 ? `${(v / 1000).toFixed(a >= 1e4 ? 0 : 1)}k` : `${Math.round(v)}`; }
function bars(labels, series, kinds, unit = "") {
  const W = 340, H = 150, padL = 34, padB = 20, padT = 10;
  const vals = series.flat().filter((x) => x != null);
  if (!vals.length) return `<p class="srcline">No data.</p>`;
  const mx = Math.max(0, ...vals), mn = Math.min(0, ...vals);
  const top = niceMax(mx), bot = mn < 0 ? -niceMax(-mn) : 0, span = top - bot || 1;
  const y = (v) => padT + (H - padT - padB) * (1 - (v - bot) / span);
  const n = labels.length, gw = (W - padL) / n, bw = Math.min(22, (gw - 6) / series.length);
  let g = "";
  [top, (top + bot) / 2, bot].forEach((t) => (g += `<line class="grid" x1="${padL}" x2="${W}" y1="${y(t)}" y2="${y(t)}"/><text x="${padL - 4}" y="${y(t) + 3}" text-anchor="end">${shortNum(t)}${unit}</text>`));
  let b = "";
  series.forEach((s, si) => s.forEach((v, i) => {
    if (v == null) return;
    const x = padL + i * gw + (gw - bw * series.length) / 2 + si * bw;
    const k = kinds[si] === "signed" ? (v >= 0 ? "bp" : "bn") : kinds[si];
    b += `<rect class="${k}" x="${x}" y="${Math.min(y(v), y(0))}" width="${bw - 1}" height="${Math.max(1, Math.abs(y(v) - y(0)))}" rx="2"><title>${esc(labels[i])}: ${unit ? v + unit : inr.format(v)}</title></rect>`;
  }));
  const step = Math.ceil(n / 7);
  const xl = labels.map((l, i) => (i % step === 0 || i === n - 1 ? `<text x="${padL + i * gw + gw / 2}" y="${H - 5}" text-anchor="middle">${esc(l)}</text>` : "")).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}${b}${xl}</svg>`;
}
function line(labels, vals, unit = "") {
  const W = 340, H = 120, padL = 34, padB = 20, padT = 12;
  const pts = vals.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return `<p class="srcline">Not enough data.</p>`;
  const vs = pts.map(([, v]) => v), mx = Math.max(...vs), mn = Math.min(...vs), pad = (mx - mn) * 0.15 || 1;
  const top = mx + pad, bot = Math.max(mn < 0 ? mn - pad : 0, mn - pad);
  const x = (i) => padL + (W - padL - 8) * (i / (labels.length - 1)), y = (v) => padT + (H - padT - padB) * (1 - (v - bot) / (top - bot));
  const d = pts.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = `${d}L${x(pts.at(-1)[0])},${H - padB}L${x(pts[0][0])},${H - padB}Z`;
  const last = pts.at(-1);
  const step = Math.ceil(labels.length / 7);
  const xl = labels.map((l, i) => (i % step === 0 || i === labels.length - 1 ? `<text x="${x(i)}" y="${H - 5}" text-anchor="middle">${esc(l)}</text>` : "")).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    <line class="grid" x1="${padL}" x2="${W}" y1="${y(top - pad)}" y2="${y(top - pad)}"/><text x="${padL - 4}" y="${y(top - pad) + 3}" text-anchor="end">${(top - pad).toFixed(0)}${unit}</text>
    <line class="grid" x1="${padL}" x2="${W}" y1="${y(mn)}" y2="${y(mn)}"/><text x="${padL - 4}" y="${y(mn) + 3}" text-anchor="end">${mn.toFixed(0)}${unit}</text>
    <path class="ar" d="${area}"/><path class="ln" d="${d}"/><circle class="pt" cx="${x(last[0])}" cy="${y(last[1])}" r="3.5"/>
    <text class="lbl" x="${Math.min(x(last[0]), W - 4)}" y="${y(last[1]) - 8}" text-anchor="end">${last[1].toFixed(1)}${unit}</text>${xl}</svg>`;
}
function table(cols, rows, dp = 0, textMode = false) {
  const f = (v) => (v == null ? "—" : typeof v === "number" ? (dp ? v.toFixed(dp) : inr.format(v)) : esc(v));
  if (textMode) return `<div class="scroll-x"><table class="dtable"><thead><tr><th>Segment</th>${cols.map((c) => `<th style="text-align:left">${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td>${v.map((x) => `<td style="text-align:left;white-space:normal">${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  return `<table class="dtable"><thead><tr><th></th>${cols.map((c) => `<th>${esc(c.replace("Mar ", "FY").replace(/^(\w{3}) 20(\d\d)$/, "$1 '$2"))}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td>${v.map((x) => `<td>${f(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function spark(vals) {
  const W = 76, H = 28, mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (W - 4) + 2, H - 3 - ((v - mn) / sp) * (H - 6)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const c = "var(--ink-2)";
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path class="a" fill="${c}" d="${d}L${W - 2},${H}L2,${H}Z"/><path class="l" stroke="${c}" d="${d}"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="2" fill="${c}"/></svg>`;
}

// ---------------------------------------------------------------- BOOK
function viewBook() {
  const ev = evaluate(state.rules, 3);
  const w7 = allCards().filter((c) => c.tier === "act" && (state.now - parseTs(c.ts)) < 7 * 864e5);
  const idx = state.eod["^NSEI"];
  const nifty = idx ? (idx.close.at(-1) / idx.close.at(-2) - 1) * 100 : null;
  const rows = state.portfolio.map((p) => {
    const s = state.eod[p.symbol];
    const chg = s ? (s.close.at(-1) / s.close.at(-2) - 1) * 100 : null;
    const acts = w7.filter((c) => c.symbol === p.symbol && !state.done.has(c.id)).length;
    const trips = ev.filter((e) => e.symbol === p.symbol).length;
    return { p, s, chg, acts, trips, rank: acts * 10 + trips * 3 + Math.abs(chg || 0) / 10 };
  }).sort((a, b) => b.rank - a.rank);
  const avg = rows.reduce((a, r) => a + (r.chg || 0), 0) / rows.length;
  const lastDay = idx ? dfmt(idx.dates.at(-1), { day: "numeric", month: "short" }) : "";
  return `<section class="view">
    <div class="stack" style="gap:6px"><h1 class="page-title">Your ${rows.length} holdings</h1><p class="lede">Sorted by what needs you: open filings first, then tripwires, then the size of the day's move.</p></div>
    <div class="dayline"><div><span>Portfolio</span><b class="${cls(avg)}">${pct(avg, 2)}</b></div><div><span>Nifty 50</span><b class="${cls(nifty)}">${pct(nifty, 2)}</b></div><div><span>Close</span><b>${esc(lastDay)}</b></div></div>
    <ul class="holdings">${rows.map(({ p, s, chg, acts, trips }) => `<li class="holding" data-dig="${esc(p.symbol)}" tabindex="0" role="button" aria-label="Open ${esc(p.name)}">
      <div class="nm"><b>${esc(p.symbol)}</b><span>${esc(p.name)} · ${esc(p.sector)}</span>
        ${acts || trips ? `<div class="flags">${acts ? `<span class="stamp act">${acts} need${acts === 1 ? "s" : ""} you</span>` : ""}${trips ? `<span class="stamp e3">Tripwire</span>` : ""}</div>` : ""}</div>
      ${s ? spark(s.close.slice(-63)) : "<span></span>"}
      <div class="px">₹${s ? inr2.format(s.close.at(-1)) : "—"}<small class="${cls(chg)}">${pct(chg, 2)}</small></div></li>`).join("")}</ul>
    <p class="srcline">Sparklines: last 3 months of closes. Prices: end-of-day, Yahoo Finance.</p></section>`;
}

// ---------------------------------------------------------------- events
function bind(root) {
  root.querySelectorAll("[data-win]").forEach((b) => b.addEventListener("click", () => {
    const v = b.dataset.win;
    if (v === "custom") return customWindow();
    state.win = v === "since" ? { since: state.lastVisit } : JSON.parse(v);
    store.set("win", state.win); render();
  }));
  root.querySelectorAll("[data-done]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggleDone(b.dataset.done); }));
  root.querySelectorAll("[data-dig]").forEach((b) => {
    const open = (e) => { e.stopPropagation(); openDossier(b.dataset.dig, true, b.dataset.lens || "overview"); window.scrollTo({ top: 0 }); };
    b.addEventListener("click", open);
    if (b.tagName === "LI") b.addEventListener("keydown", (e) => { if (e.key === "Enter") open(e); });
  });
  root.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => { state.symbol = null; go(b.dataset.go); render(); }));
  root.querySelectorAll("[data-lens-tab]").forEach((b) => b.addEventListener("click", () => {
    state.lens = b.dataset.lensTab;
    $$("[data-lens-tab]").forEach((x) => x.getAttribute("aria-pressed") != null && x.setAttribute("aria-pressed", x.dataset.lensTab === state.lens));
    $("#lens").innerHTML = lensBody(state.research[state.symbol], state.lens); bind($("#lens"));
    const lb = $(".lensbar"); if (lb && lb.getBoundingClientRect().top < 60) lb.scrollIntoView({ block: "start" });
  }));
  root.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => ask(b.dataset.q)));
  const f = root.querySelector("#askForm");
  if (f) f.addEventListener("submit", (e) => { e.preventDefault(); const q = $("#askInput").value.trim(); if (q) ask(q); });
  const mic = root.querySelector("#mic");
  if (mic) mic.addEventListener("click", listen);
  // tripwire controls
  const rp = root.querySelector("#rPrice");
  if (rp) {
    const upd = (k, v) => { state.rules[k] = v; store.set("rules", state.rules); };
    rp.addEventListener("input", () => { $("#oPrice").textContent = `±${(+rp.value).toFixed(1)}%`; });
    rp.addEventListener("change", () => { upd("price_move_pct", +rp.value); render(); });
    const rv = root.querySelector("#rVol");
    rv.addEventListener("input", () => { $("#oVol").textContent = `${(+rv.value).toFixed(2)}×`; });
    rv.addEventListener("change", () => { upd("volume_multiple", +rv.value); render(); });
    root.querySelector("#rRel").addEventListener("change", (e) => { upd("relative_to_index", e.target.checked); render(); });
    root.querySelector("#rBrk").addEventListener("change", (e) => { upd("breakouts", e.target.checked); render(); });
    root.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.cat, cats = new Set(state.rules.categories);
      cats.has(k) ? cats.delete(k) : cats.add(k); upd("categories", [...cats]); render();
    }));
    const nt = root.querySelector("#rNotify");
    if (nt) nt.addEventListener("change", async () => {
      if (nt.checked) {
        try { const p = await Notification.requestPermission(); store.set("notify", p === "granted"); if (p !== "granted") { nt.checked = false; toast("Notifications are blocked for this site."); } }
        catch { nt.checked = false; toast("This browser won't show notifications here."); }
      } else store.set("notify", false);
    });
  }
  // swipe right to clear a card
  root.querySelectorAll("[data-card]").forEach((card) => {
    let x0 = null, y0 = null, dx = 0;
    card.addEventListener("pointerdown", (e) => { if (e.target.closest("a,button,summary,details")) return; x0 = e.clientX; y0 = e.clientY; dx = 0; });
    card.addEventListener("pointermove", (e) => {
      if (x0 == null) return; dx = e.clientX - x0;
      if (Math.abs(e.clientY - y0) > 24 && Math.abs(dx) < 24) { x0 = null; card.style.transform = ""; return; }
      if (dx > 0) card.style.transform = `translateX(${Math.min(dx, 140)}px)`;
    });
    const end = () => { if (x0 == null) return; x0 = null; card.style.transform = ""; if (dx > 100) toggleDone(card.dataset.card); };
    card.addEventListener("pointerup", end); card.addEventListener("pointercancel", end); card.addEventListener("pointerleave", end);
  });
}
function toggleDone(id) {
  const clearing = !state.done.has(id);
  clearing ? state.done.add(id) : state.done.delete(id);
  store.set("done", [...state.done]);
  const card = document.querySelector(`[data-card="${CSS.escape(id)}"]`);
  const redraw = () => { const y = window.scrollY; render(); window.scrollTo({ top: y }); };
  if (clearing && card && !matchMedia("(prefers-reduced-motion: reduce)").matches) { card.classList.add("leaving"); setTimeout(redraw, 220); }
  else redraw();
  const w = windowed(), left = [...w.act, ...w.know].filter((c) => !state.done.has(c.id)).length;
  if (!left && state.done.has(id)) toast("Brief cleared. Nothing else needs you.");
}
function customWindow() {
  const today = state.now.toISOString().slice(0, 10), wk = new Date(state.now - 7 * 864e5).toISOString().slice(0, 10);
  sheet(`<h2>Pick a window</h2><div class="daterow"><label for="dFrom">From<input id="dFrom" type="date" value="${state.win.start || wk}" max="${today}"></label>
    <label for="dTo">To<input id="dTo" type="date" value="${state.win.end || today}" max="${today}"></label></div>
    <p class="srcline">${state.mode === "snapshot" ? "The snapshot holds the 30 days before it was taken." : "FINN keeps every filing it has seen."}</p>
    <button class="btn primary" id="dApply">Show filings</button>`, (el) => el.querySelector("#dApply").addEventListener("click", () => {
    state.win = { start: el.querySelector("#dFrom").value, end: el.querySelector("#dTo").value }; store.set("win", state.win); closeSheet(); render();
  }));
}
function sheet(html, onMount) {
  closeSheet();
  const back = Object.assign(document.createElement("div"), { className: "sheet-back" });
  const s = Object.assign(document.createElement("div"), { className: "sheet", innerHTML: html });
  s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true");
  back.addEventListener("click", closeSheet);
  document.body.append(back, s);
  onMount && onMount(s);
  const first = s.querySelector("input,button,a"); first && first.focus();
}
function closeSheet() { $$(".sheet, .sheet-back").forEach((x) => x.remove()); }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
let toastT;
function toast(msg) {
  let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 3800);
}
function showAbout() {
  const L = state.meta.llm || {}, led = L.ledger || {};
  const theme = document.documentElement.dataset.theme || "system";
  sheet(`<h2>How FINN decides</h2>
    <p>Every filing is classified by rules into the exchange's categories, then scored for materiality: who changed, which direction a rating moved, and how big any rupee amount is against the company's market cap. Above 70 it <b>needs you</b>; 40–69 is <b>worth a glance</b>; the rest is filed away.</p>
    <dl><div><dt>Mode</dt><dd>${state.mode === "live" ? "Live: polling NSE every 10 minutes" : `Snapshot taken ${esc(state.now.toLocaleString("en-IN"))}`}</dd></div>
      <div><dt>Filings</dt><dd>NSE announcements RSS + BSE feed (via screener.in); PDFs read from the exchange</dd></div>
      <div><dt>Prices</dt><dd>End-of-day close and volume, Yahoo Finance</dd></div>
      <div><dt>Fundamentals</dt><dd>Filed financials, annual reports and concall transcripts. No news, no broker notes.</dd></div>
      <div><dt>Models</dt><dd>${L.provider ? `${esc(L.provider)}: extract ${esc(L.models.extract)}, reason ${esc(L.models.reason)}` : "None. This build runs on the rules tier: zero model calls, zero cost."}</dd></div>
      <div><dt>Model spend</dt><dd>${led.calls || 0} calls (${led.cache_hits || 0} served from cache) · $${(led.cost_usd || 0).toFixed(4)}</dd></div></dl>
    <div class="chips" role="group" aria-label="Theme">${["system", "light", "dark"].map((t) => `<button class="chip" data-theme-set="${t}" aria-pressed="${theme === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
    <button class="btn" id="closeSheet">Close</button>`, (el) => {
    el.querySelector("#closeSheet").addEventListener("click", closeSheet);
    el.querySelectorAll("[data-theme-set]").forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.themeSet; if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
      store.set("theme", t); el.querySelectorAll("[data-theme-set]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    }));
  });
}
function listen() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  try {
    const r = new SR(); r.lang = "en-IN"; r.interimResults = false;
    r.onresult = (e) => { const q = e.results[0][0].transcript; $("#askInput").value = q; ask(q); };
    r.onerror = () => toast("Voice input isn't available here. Type instead.");
    r.start(); toast("Listening… say a company and what you want to know.");
  } catch { toast("Voice input isn't available here. Type instead."); }
}
function startStream() {
  if (!("EventSource" in window)) return;
  const es = new EventSource("/api/stream");
  es.addEventListener("filing", async (e) => {
    const f = JSON.parse(e.data);
    toast(`${f.symbol}: ${f.label} — ${f.headline}`);
    if (store.get("notify", false) && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(`FINN · ${f.symbol} · ${f.label}`, { body: `${f.headline}\n${f.why}` }); } catch { /* ignore */ }
    }
    try { state.digest = await fetchJSON("/api/digest?days=30", 90000); state.now = new Date(); if (state.view === "brief") render(); else updateBadge(); } catch { /* keep old */ }
  });
}

// theme preference (per viewer)
(() => { const t = store.get("theme", "system"); if (t !== "system") document.documentElement.dataset.theme = t; })();
boot().catch((e) => {
  $("#view").innerHTML = `<div class="empty"><p><b>FINN couldn't load its data.</b> ${esc(e.message)}. Check the server is running, or that data/snapshot.json exists.</p></div>`;
});
