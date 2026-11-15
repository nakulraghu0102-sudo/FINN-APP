"""NSE's public 'Latest Announcements' RSS feed — the live push source.

It is a rolling window (~a day of filings, every listed company), refreshed every few
minutes. Each poll is merged into our ledger, so history accumulates while FINN runs.
The attachment URL usually starts with the NSE symbol, which is how we map items to
holdings; company-name matching is the fallback.
"""
from __future__ import annotations

import hashlib
import re
from datetime import datetime
from xml.etree import ElementTree as ET

from . import http

FEED = "https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml"


def _norm(name: str) -> str:
    name = name.lower().replace("&", "and")
    name = re.sub(r"\b(limited|ltd|the|india|of)\b", " ", name)
    return re.sub(r"[^a-z0-9]", "", name)


def fetch(symbol_names: dict[str, str], max_age: float = 5 * 60) -> list[dict]:
    """Items for the given {symbol: company name} universe."""
    body, _ = http.get(FEED, max_age=max_age)
    root = ET.fromstring(body)
    by_name = {_norm(n): s for s, n in symbol_names.items() if n}
    out = []
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        desc = (it.findtext("description") or "").strip()
        pub = (it.findtext("pubDate") or "").strip()
        sym = None
        m = re.search(r"/corporate/([A-Z0-9&\-]+)_\d{8}", link)
        if m and m.group(1) in symbol_names:
            sym = m.group(1)
        if not sym:
            sym = by_name.get(_norm(title))
        if not sym:
            continue
        subject = ""
        sm = re.search(r"\|\s*SUBJECT:\s*(.*)$", desc)
        if sm:
            subject = sm.group(1).strip()
            desc = desc[: sm.start()].strip()
        try:
            ts = datetime.strptime(pub, "%d-%b-%Y %H:%M:%S").isoformat()
        except ValueError:
            continue
        # "X has informed the Exchange about Y" -> "Y"
        text = re.sub(r"^.*?has informed the Exchange (?:about|regarding|that)\s*", "", desc, flags=re.I)
        out.append({
            "symbol": sym, "ts": ts, "title": subject or text[:120], "subject": subject,
            "gist": text if text and text.lower() != subject.lower() else "",
            "url": link, "source": "nse rss",
        })
    return out


def make_id(row: dict) -> str:
    """Same filing seen via NSE and BSE should collapse: key on symbol + minute-ish + topic."""
    day = row["ts"][:10]
    topic = re.sub(r"[^a-z]", "", (row.get("subject") or row["title"]).lower())[:40]
    return hashlib.sha1(f"{row['symbol']}|{day}|{topic}|{row.get('url','')}".encode()).hexdigest()[:16]
