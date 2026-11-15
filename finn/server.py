"""FINN API + static app. Run: uvicorn finn.server:app --port 8000

A background poller ingests filings every POLL_MINUTES while the server runs, and pushes
newly-seen material ('act') filings to open clients over Server-Sent Events.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import threading
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import llm, store
from .config import DEFAULT_RULES, INDEX_SYMBOL, PORTFOLIO, RESEARCH_DEMO, ROOT
from .engine import alerts, digest, research
from .sources import prices, screener

log = logging.getLogger("finn")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)

POLL_MINUTES = float(os.environ.get("FINN_POLL_MINUTES", "10"))
SYMBOLS = [p["symbol"] for p in PORTFOLIO]
WEB = ROOT / "web"

app = FastAPI(title="FINN", version="0.1")
app.add_middleware(GZipMiddleware, minimum_size=1000)

_events: list[dict] = []          # recent push events (newest last)
_state = {"last_ingest": None, "ingest": None}
_research_locks: dict[str, threading.Lock] = {}


def _ingest_and_detect() -> None:
    before = {c["id"] for c in digest.build(*digest.window(72), enrich=False)["act"]}
    res = digest.ingest()
    _state["last_ingest"] = datetime.now().isoformat(timespec="seconds")
    _state["ingest"] = res
    if res["new"]:
        now_act = digest.build(*digest.window(72), enrich=False)["act"]
        for c in now_act:
            if c["id"] not in before:
                _events.append({"t": time.time(), "symbol": c["symbol"], "headline": c["headline"],
                                "label": c["label"], "why": c["why"], "id": c["id"]})
        del _events[:-50]


def _poller() -> None:
    while True:
        try:
            _ingest_and_detect()
        except Exception as e:
            log.warning("poll failed: %s", e)
        time.sleep(POLL_MINUTES * 60)


@app.on_event("startup")
def _start() -> None:
    if os.environ.get("FINN_NO_POLL") != "1":
        threading.Thread(target=_poller, daemon=True).start()


def _eod() -> dict:
    return prices.eod(SYMBOLS + [INDEX_SYMBOL])


@app.get("/api/meta")
def meta():
    return {"portfolio": PORTFOLIO, "research_demo": RESEARCH_DEMO, "rules": DEFAULT_RULES,
            "llm": llm.status(), "last_ingest": _state["last_ingest"], "ingest": _state["ingest"],
            "now": datetime.now().isoformat(timespec="seconds"), "mode": "live"}


@app.get("/api/eod")
def eod():
    return _eod()


@app.get("/api/portfolio")
def portfolio():
    px = _eod()
    out = []
    for p in PORTFOLIO:
        s = p["symbol"]
        try:
            co = screener.company(s)
        except Exception:
            co = {}
        series = px.get(s) or {}
        c = series.get("close") or []
        out.append({**p, "name": co.get("name", s), "mcap_cr": (co.get("ratios_top") or {}).get("mcap_cr"),
                    "pe": (co.get("ratios_top") or {}).get("pe"),
                    "price": c[-1] if c else None,
                    "chg": round((c[-1] / c[-2] - 1) * 100, 2) if len(c) > 1 else None})
    return out


@app.get("/api/digest")
def get_digest(hours: float | None = None, start: str | None = None, end: str | None = None,
               days: float | None = None, refresh: bool = False):
    if refresh or not _state["last_ingest"]:
        _ingest_and_detect()
    if days:
        hours = days * 24
    s, e = digest.window(hours, start, end)
    return digest.build(s, e)


@app.get("/api/alerts")
def get_alerts(price: float = Query(DEFAULT_RULES["price_move_pct"]), vol: float = Query(DEFAULT_RULES["volume_multiple"]),
               lookback: int = 20, rel: bool = True, breakouts: bool = True, sessions: int = 60):
    rules = {"price_move_pct": price, "volume_multiple": vol, "volume_lookback": lookback,
             "relative_to_index": rel, "breakouts": breakouts}
    ev = alerts.evaluate(_eod(), rules, INDEX_SYMBOL, sessions)
    d = digest.build(datetime.now() - timedelta(days=sessions * 1.6), datetime.now(), enrich=False)
    by: dict[str, list] = {}
    for c in d["act"] + d["know"]:
        by.setdefault(c["symbol"], []).append(c)
    alerts.attach_filings(ev, by)
    return {"rules": rules, "events": ev}


@app.get("/api/research/{symbol}")
def get_research(symbol: str, refresh: bool = False):
    symbol = symbol.upper().strip()
    key = f"research:v3:{symbol}:{datetime.now():%Y-%m-%d}:{llm.status()['provider']}"
    if not refresh:
        hit = store.kv_get(key, 12 * 3600)
        if hit:
            return hit
    lock = _research_locks.setdefault(symbol, threading.Lock())
    with lock:
        hit = None if refresh else store.kv_get(key, 12 * 3600)
        if hit:
            return hit
        try:
            pack = research.build(symbol)
        except screener.NotFound:
            raise HTTPException(404, f"{symbol} not found. Try the NSE symbol, e.g. ASIANPAINT.")
        store.kv_set(key, pack)
        return pack


@app.get("/api/search")
def search(q: str):
    return screener.search(q)


@app.post("/api/refresh")
def refresh():
    _ingest_and_detect()
    return {"ok": True, **(_state["ingest"] or {})}


@app.get("/api/stream")
async def stream():
    async def gen():
        seen = time.time()
        yield "retry: 15000\n\n"
        while True:
            fresh = [e for e in _events if e["t"] > seen]
            for e in fresh:
                yield f"event: filing\ndata: {json.dumps(e)}\n\n"
            if fresh:
                seen = fresh[-1]["t"]
            yield ": keep-alive\n\n"
            await asyncio.sleep(15)
    return StreamingResponse(gen(), media_type="text/event-stream")


@app.get("/")
def index():
    return FileResponse(WEB / "index.html")


@app.get("/healthz")
def health():
    return JSONResponse({"ok": True})


app.mount("/", StaticFiles(directory=WEB), name="web")
