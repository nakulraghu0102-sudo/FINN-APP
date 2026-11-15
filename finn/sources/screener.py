"""screener.in company pages -> structured, primary-source fundamentals.

Screener republishes exchange data: standardised P&L / balance sheet / cash-flow tables
built from filings, plus links to the filings themselves (annual reports, concall
transcripts, exchange announcements). We use the numbers and the document links; we do
not use its editorial content (pros/cons, AI summaries of concalls).
"""
from __future__ import annotations

import re
from datetime import datetime

from bs4 import BeautifulSoup

from .. import store
from . import http

BASE = "https://www.screener.in"
PAGE_TTL = 12 * 3600
ANN_TTL = 20 * 60

# Canonical keys for the rows we reason about. Banks/NBFCs use different labels.
LABELS = {
    "sales": "revenue", "revenue": "revenue",
    "yoy sales growth": "rev_yoy", "yoy revenue growth": "rev_yoy",
    "sales growth": "rev_growth", "revenue growth": "rev_growth",
    "expenses": "expenses",
    "operating profit": "op_profit", "financing profit": "op_profit",
    "opm %": "opm", "financing margin %": "opm",
    "other income": "other_income", "interest": "interest", "depreciation": "depreciation",
    "profit before tax": "pbt", "tax %": "tax_pct", "net profit": "pat", "eps in rs": "eps",
    "dividend payout %": "payout", "gross npa %": "gnpa", "net npa %": "nnpa",
    "equity capital": "equity_capital", "reserves": "reserves", "borrowings": "borrowings",
    "borrowing": "borrowings", "deposits": "deposits", "other liabilities": "other_liabilities",
    "total liabilities": "total_liabilities", "fixed assets": "fixed_assets", "cwip": "cwip",
    "investments": "investments", "other assets": "other_assets", "total assets": "total_assets",
    "cash from operating activity": "cfo", "cash from investing activity": "cfi",
    "cash from financing activity": "cff", "net cash flow": "net_cash", "free cash flow": "fcf",
    "debtor days": "debtor_days", "inventory days": "inventory_days", "days payable": "payable_days",
    "cash conversion cycle": "ccc", "working capital days": "wc_days", "roce %": "roce", "roe %": "roe",
    "promoters": "promoters", "fiis": "fii", "diis": "dii", "public": "public",
    "government": "government", "no. of shareholders": "shareholders",
}


def _num(s: str) -> float | None:
    s = (s or "").replace(",", "").replace("%", "").replace("+", "").strip()
    if not s or s in {"-", "--"}:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _label(raw: str) -> str:
    raw = re.sub(r"\s*\+\s*$", "", raw.strip()).strip().lower()
    if raw.startswith("cfo/ebitda"):
        return "cfo_ebitda"
    return LABELS.get(raw, re.sub(r"[^a-z0-9]+", "_", raw).strip("_"))


def _table(soup: BeautifulSoup, section_id: str) -> dict | None:
    sec = soup.find("section", id=section_id)
    if not sec or not sec.find("table"):
        return None
    t = sec.find("table")
    cols = [th.get_text(strip=True) for th in t.find("thead").find_all("th")][1:]
    rows: dict[str, list[float | None]] = {}
    for tr in t.find("tbody").find_all("tr"):
        tds = tr.find_all("td")
        if not tds:
            continue
        key = _label(tds[0].get_text(" ", strip=True))
        if key in ("raw_pdf",):
            continue
        rows[key] = [_num(td.get_text(" ", strip=True)) for td in tds[1:]]
    return {"cols": cols, "rows": rows}


def _top_ratios(soup: BeautifulSoup) -> dict:
    out = {}
    ul = soup.find("ul", id="top-ratios")
    if not ul:
        return out
    for li in ul.find_all("li"):
        name = li.find("span", class_="name")
        val = li.find("span", class_="nowrap")
        if not name or not val:
            continue
        n = name.get_text(strip=True)
        v = val.get_text(" ", strip=True)
        if n == "High / Low":
            parts = [_num(x) for x in v.replace("₹", "").split("/")]
            out["high_52w"], out["low_52w"] = (parts + [None, None])[:2]
        else:
            key = {"Market Cap": "mcap_cr", "Current Price": "price", "Stock P/E": "pe",
                   "Book Value": "book_value", "Dividend Yield": "div_yield", "ROCE": "roce",
                   "ROE": "roe", "Face Value": "face_value"}.get(n, n)
            out[key] = _num(v.replace("₹", "").replace("Cr.", ""))
    return out


def _announcements(node, symbol: str) -> list[dict]:
    out = []
    if node is None:
        return out
    for li in node.select("ul.list-links li"):
        a = li.find("a")
        if not a:
            continue
        t = a.find("time")
        sub = a.find("div")
        gist = ""
        if sub:
            gist = sub.get_text(" ", strip=True)
            if t:
                gist = gist.replace(t.get_text(strip=True), "", 1).strip(" -–")
            sub.extract()
        title = a.get_text(" ", strip=True)
        ts = t["datetime"] if t and t.has_attr("datetime") else None
        if not ts:
            continue
        out.append({
            "symbol": symbol, "ts": datetime.fromisoformat(ts).isoformat(), "title": title,
            "gist": gist, "url": a.get("href", ""), "source": "bse via screener",
        })
    return out


def _documents(soup: BeautifulSoup) -> dict:
    docs: dict = {"annual_reports": [], "concalls": []}
    ar = soup.select_one(".documents.annual-reports")
    if ar:
        for li in ar.find_all("li"):
            a = li.find("a")
            if a and a.get("href", "").lower().endswith(".pdf"):
                m = re.search(r"(20\d\d)", a.get_text())
                docs["annual_reports"].append({"year": int(m.group(1)) if m else None, "url": a["href"]})
    cc = soup.select_one(".documents.concalls")
    if cc:
        for li in cc.find_all("li"):
            date_div = li.find("div")
            label = date_div.get_text(" ", strip=True) if date_div else ""
            links = {a.get_text(strip=True).lower(): a.get("href") for a in li.find_all("a") if a.get("href")}
            item = {"label": label, "transcript": links.get("transcript"), "ppt": links.get("ppt"),
                    "rec": links.get("rec")}
            try:
                item["date"] = datetime.strptime(label, "%b %Y").strftime("%Y-%m")
            except ValueError:
                item["date"] = None
            docs["concalls"].append(item)
    return docs


def _parse(html: str, symbol: str, basis: str, url: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    h1 = soup.find("h1")
    name = h1.get_text(strip=True) if h1 else symbol
    m = re.search(r"/announcements/recent/(\d+)/", html)
    bse = re.search(r"bseindia\.com/stock-share-price/[^\"']+/(\d{6})/", html)
    about = soup.select_one(".company-profile .about") or soup.select_one(".about")
    data = {
        "symbol": symbol, "name": name, "basis": basis, "url": url,
        "company_id": m.group(1) if m else None, "bse_code": bse.group(1) if bse else None,
        "about": about.get_text(" ", strip=True) if about else "",
        "ratios_top": _top_ratios(soup),
        "quarters": _table(soup, "quarters"),
        "pnl": _table(soup, "profit-loss"),
        "balance": _table(soup, "balance-sheet"),
        "cashflow": _table(soup, "cash-flow"),
        "ratios": _table(soup, "ratios"),
        "shareholding": _table(soup, "shareholding"),
        "announcements": _announcements(soup.find(id="company-announcements-tab"), symbol),
        "fetched_at": datetime.now().isoformat(timespec="seconds"),
    }
    data.update(_documents(soup))
    qsec = soup.find("section", id="quarters")
    data["is_financial"] = bool(qsec and "Financing Profit" in qsec.get_text())
    return data


def _has_numbers(d: dict) -> bool:
    q = d.get("quarters")
    return bool(q and any(v is not None for v in q["rows"].get("revenue", [])))


class NotFound(LookupError):
    pass


def company(symbol: str, max_age: float = PAGE_TTL) -> dict:
    """Parsed company page. Prefers consolidated numbers, falls back to standalone."""
    symbol = symbol.upper().strip()
    key = f"screener:{symbol}"
    cached = store.kv_get(key, max_age)
    if cached:
        return cached
    last_err = None
    for basis, path in (("consolidated", f"/company/{symbol}/consolidated/"), ("standalone", f"/company/{symbol}/")):
        url = BASE + path
        try:
            body, _ = http.get(url, max_age=max_age)
        except http.FetchError as e:
            last_err = e
            continue
        d = _parse(body.decode("utf-8", "replace"), symbol, basis, url)
        if _has_numbers(d):
            store.kv_set(key, d)
            return d
    raise NotFound(f"{symbol}: not found on screener ({last_err})")


def recent_announcements(symbol: str) -> list[dict]:
    """Fresh copy of the 'recent' announcements list (cheap AJAX fragment)."""
    d = company(symbol)
    if not d.get("company_id"):
        return d.get("announcements", [])
    try:
        body, _ = http.get(f"{BASE}/announcements/recent/{d['company_id']}/", max_age=ANN_TTL)
    except Exception:
        return d.get("announcements", [])
    soup = BeautifulSoup(body.decode("utf-8", "replace"), "lxml")
    return _announcements(soup, symbol) or d.get("announcements", [])


def search(query: str) -> list[dict]:
    """Resolve free text ('asian paints') to symbols using screener's public search API."""
    import json
    from urllib.parse import quote
    try:
        body, _ = http.get(f"{BASE}/api/company/search/?q={quote(query)}&v=3", max_age=7 * 86400)
        items = json.loads(body)
    except Exception:
        return []
    out = []
    for it in items[:8]:
        m = re.match(r"/company/([^/]+)/", it.get("url", ""))
        if m and not m.group(1).isdigit():
            out.append({"symbol": m.group(1), "name": it.get("name", "")})
    return out
