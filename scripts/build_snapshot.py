"""Freeze a real snapshot of everything the app shows, for static hosting / offline demo.

    python scripts/build_snapshot.py            # portfolio + research demo set
    python scripts/build_snapshot.py TCS INFY   # add more research packs

Writes web/data/snapshot.json (meta, portfolio, EOD history, 30-day classified digest)
and web/data/research/<SYMBOL>.json (one dossier per company, loaded on demand).
"""
from __future__ import annotations

import json
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from finn import llm  # noqa: E402
from finn.config import DEFAULT_RULES, INDEX_SYMBOL, PORTFOLIO, RESEARCH_DEMO, ROOT  # noqa: E402
from finn.engine import digest, research  # noqa: E402
from finn.sources import prices, screener  # noqa: E402

OUT = ROOT / "web" / "data"
(OUT / "research").mkdir(parents=True, exist_ok=True)


def main(extra: list[str]) -> None:
    t0 = time.time()
    syms = [p["symbol"] for p in PORTFOLIO]
    print("ingest", digest.ingest())
    now = datetime.now()
    eod = prices.eod(syms + [INDEX_SYMBOL])
    d30 = digest.build(*digest.window(24 * 30, now=now))
    port = []
    for p in PORTFOLIO:
        co = screener.company(p["symbol"])
        top = co.get("ratios_top") or {}
        port.append({**p, "name": co["name"], "mcap_cr": top.get("mcap_cr"), "pe": top.get("pe"),
                     "bse_code": co.get("bse_code")})
    names = {p["symbol"]: p["name"] for p in port}
    for s in RESEARCH_DEMO + extra:
        try:
            names[s] = screener.company(s)["name"]
        except Exception:
            pass
    snap = {
        "meta": {"mode": "snapshot", "now": now.isoformat(timespec="seconds"), "portfolio": PORTFOLIO,
                 "research_demo": RESEARCH_DEMO, "rules": DEFAULT_RULES, "llm": llm.status(), "names": names},
        "portfolio": port, "eod": eod, "digest": d30,
    }
    (OUT / "snapshot.json").write_text(json.dumps(snap, default=str, separators=(",", ":")))
    print(f"snapshot.json {len(json.dumps(snap, default=str))/1024:.0f} KB  ({time.time()-t0:.0f}s)")
    for s in syms + RESEARCH_DEMO + extra:
        t = time.time()
        try:
            pack = research.build(s)
        except Exception as e:
            print("  research", s, "FAILED", e)
            continue
        (OUT / "research" / f"{s}.json").write_text(json.dumps(pack, default=str, separators=(",", ":")))
        pr = pack["lenses"].get("promises") or {}
        print(f"  research {s:11s} {time.time()-t:5.1f}s calls={len(pr.get('calls', []))} claims={len(pr.get('claims', []))} "
              f"score={pr.get('score')}")
    print(f"done in {time.time()-t0:.0f}s")


if __name__ == "__main__":
    main([a.upper() for a in sys.argv[1:]])
