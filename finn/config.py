"""Static configuration: the demo portfolio, research demo set, and default watch rules.

Everything here is data, not code paths. The engine works for any NSE symbol that
screener.in covers; these lists only decide what the demo pre-loads.
"""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("FINN_DATA_DIR", ROOT / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "finn.db"

# 18 holdings: deliberately mixed by sector and size so the digest has texture
# (a bank, an NBFC, IT large + mid, a PSU, consumer, industrials, small/mid caps).
PORTFOLIO: list[dict] = [
    {"symbol": "RELIANCE",   "sector": "Conglomerate"},
    {"symbol": "HDFCBANK",   "sector": "Bank"},
    {"symbol": "TCS",        "sector": "IT services"},
    {"symbol": "ITC",        "sector": "FMCG"},
    {"symbol": "LT",         "sector": "Engineering & construction"},
    {"symbol": "BHARTIARTL", "sector": "Telecom"},
    {"symbol": "SUNPHARMA",  "sector": "Pharma"},
    {"symbol": "MARUTI",     "sector": "Autos"},
    {"symbol": "BAJFINANCE", "sector": "NBFC"},
    {"symbol": "TITAN",      "sector": "Consumer discretionary"},
    {"symbol": "ETERNAL",    "sector": "Internet / quick commerce"},
    {"symbol": "DIXON",      "sector": "Electronics manufacturing"},
    {"symbol": "POLYCAB",    "sector": "Cables & wires"},
    {"symbol": "PERSISTENT", "sector": "IT services (mid)"},
    {"symbol": "HAL",        "sector": "Defence PSU"},
    {"symbol": "TRENT",      "sector": "Retail"},
    {"symbol": "CDSL",       "sector": "Market infrastructure"},
    {"symbol": "DEEPAKNTR",  "sector": "Chemicals"},
]

# Ad-hoc research demo set — intentionally outside the portfolio.
RESEARCH_DEMO = ["ASIANPAINT", "KPITTECH", "ASTRAL", "IRCTC"]

INDEX_SYMBOL = "^NSEI"  # Nifty 50, used to separate stock-specific moves from market moves

DEFAULT_RULES = {
    "price_move_pct": 4.0,        # |daily % change| at or above this fires
    "volume_multiple": 2.0,       # volume / trailing average at or above this fires
    "volume_lookback": 20,        # sessions in the trailing average
    "relative_to_index": True,    # judge price moves net of the Nifty move
    "categories": [               # announcement categories that fire an alert
        "results", "m_and_a", "management_change", "fund_raise",
        "litigation", "credit_rating", "pledging",
    ],
}

USER_AGENT = os.environ.get(
    "FINN_USER_AGENT",
    "Mozilla/5.0 (compatible; FINN-prototype/0.1; research use)",
)
