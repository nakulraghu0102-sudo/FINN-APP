"""One SQLite file holds every cache and every piece of state.

- http:  raw responses keyed by URL (TTL decided by the caller)
- kv:    derived artefacts (parsed company pages, PDF text, LLM outputs) keyed by
         content hash + prompt version, so nothing is ever computed twice
- ann:   the announcement ledger (accumulates across polls; NSE RSS only shows ~1 day)
- llm:   a ledger of every model call, with tokens and cost, surfaced in the UI
"""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from typing import Any

from .config import DB_PATH

_lock = threading.RLock()
_conn: sqlite3.Connection | None = None


def conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=30)
        _conn.row_factory = sqlite3.Row
        _conn.execute("PRAGMA journal_mode=WAL")
        _conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS http (
                url TEXT PRIMARY KEY, fetched_at REAL, status INTEGER,
                content_type TEXT, body BLOB);
            CREATE TABLE IF NOT EXISTS kv (
                key TEXT PRIMARY KEY, updated_at REAL, value TEXT);
            CREATE TABLE IF NOT EXISTS ann (
                id TEXT PRIMARY KEY, symbol TEXT, ts TEXT, title TEXT, subject TEXT,
                gist TEXT, url TEXT, source TEXT, first_seen REAL);
            CREATE INDEX IF NOT EXISTS ann_ts ON ann(ts);
            CREATE TABLE IF NOT EXISTS llm (
                id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL, task TEXT, tier TEXT,
                provider TEXT, model TEXT, in_tokens INTEGER, out_tokens INTEGER,
                cost_usd REAL, cache_hit INTEGER);
            """
        )
    return _conn


def kv_get(key: str, max_age: float | None = None) -> Any | None:
    with _lock:
        row = conn().execute("SELECT updated_at, value FROM kv WHERE key=?", (key,)).fetchone()
    if not row:
        return None
    if max_age is not None and time.time() - row["updated_at"] > max_age:
        return None
    return json.loads(row["value"])


def kv_set(key: str, value: Any) -> None:
    with _lock:
        conn().execute(
            "INSERT OR REPLACE INTO kv(key, updated_at, value) VALUES (?,?,?)",
            (key, time.time(), json.dumps(value, default=str)),
        )
        conn().commit()


def http_get_cached(url: str, max_age: float) -> sqlite3.Row | None:
    with _lock:
        row = conn().execute("SELECT * FROM http WHERE url=?", (url,)).fetchone()
    if row and time.time() - row["fetched_at"] <= max_age:
        return row
    return None


def http_put(url: str, status: int, content_type: str, body: bytes) -> None:
    with _lock:
        conn().execute(
            "INSERT OR REPLACE INTO http(url, fetched_at, status, content_type, body) VALUES (?,?,?,?,?)",
            (url, time.time(), status, content_type, body),
        )
        conn().commit()


def ann_upsert(rows: list[dict]) -> int:
    """Insert announcements we have not seen; keep the richer gist if both sources have one."""
    new = 0
    with _lock:
        c = conn()
        for r in rows:
            cur = c.execute("SELECT gist FROM ann WHERE id=?", (r["id"],)).fetchone()
            if cur is None:
                c.execute(
                    "INSERT INTO ann(id, symbol, ts, title, subject, gist, url, source, first_seen)"
                    " VALUES (?,?,?,?,?,?,?,?,?)",
                    (r["id"], r["symbol"], r["ts"], r["title"], r.get("subject", ""),
                     r.get("gist", ""), r.get("url", ""), r["source"], time.time()),
                )
                new += 1
            elif r.get("gist") and not cur["gist"]:
                c.execute("UPDATE ann SET gist=? WHERE id=?", (r["gist"], r["id"]))
        c.commit()
    return new


def ann_between(start_iso: str, end_iso: str, symbols: list[str] | None = None) -> list[dict]:
    q = "SELECT * FROM ann WHERE ts>=? AND ts<=?"
    args: list[Any] = [start_iso, end_iso]
    if symbols:
        q += f" AND symbol IN ({','.join('?' * len(symbols))})"
        args += symbols
    q += " ORDER BY ts DESC"
    with _lock:
        return [dict(r) for r in conn().execute(q, args).fetchall()]


def llm_log(**row: Any) -> None:
    with _lock:
        conn().execute(
            "INSERT INTO llm(ts, task, tier, provider, model, in_tokens, out_tokens, cost_usd, cache_hit)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (time.time(), row.get("task"), row.get("tier"), row.get("provider"), row.get("model"),
             row.get("in_tokens", 0), row.get("out_tokens", 0), row.get("cost_usd", 0.0),
             int(row.get("cache_hit", False))),
        )
        conn().commit()


def llm_summary() -> dict:
    with _lock:
        r = conn().execute(
            "SELECT COUNT(*) n, SUM(cache_hit) hits, SUM(in_tokens) i, SUM(out_tokens) o,"
            " SUM(cost_usd) cost FROM llm"
        ).fetchone()
        by = conn().execute(
            "SELECT tier, provider, model, COUNT(*) n, SUM(cost_usd) cost FROM llm"
            " WHERE cache_hit=0 GROUP BY tier, provider, model"
        ).fetchall()
    return {
        "calls": r["n"] or 0, "cache_hits": r["hits"] or 0,
        "in_tokens": r["i"] or 0, "out_tokens": r["o"] or 0,
        "cost_usd": round(r["cost"] or 0.0, 5),
        "by_model": [dict(x) for x in by],
    }
