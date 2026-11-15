"""Smoke-test every data source for the configured portfolio."""
import sys, time
sys.path.insert(0, '.')
from finn.config import PORTFOLIO, RESEARCH_DEMO, INDEX_SYMBOL
from finn.sources import screener, prices, nse_rss

syms = [p['symbol'] for p in PORTFOLIO]
t = time.time()
px = prices.eod(syms + [INDEX_SYMBOL])
print(f"EOD: {len(px)}/{len(syms)+1} symbols in {time.time()-t:.1f}s; last date", {s: v['dates'][-1] for s, v in list(px.items())[:3]})
missing = [s for s in syms + [INDEX_SYMBOL] if s not in px]
print("EOD missing:", missing)
names = {}
for s in syms + RESEARCH_DEMO:
    try:
        d = screener.company(s)
        names[s] = d['name']
        q = d['quarters']
        print(f"{s:11s} {d['basis']:12s} fin={d['is_financial']!s:5s} q={q['cols'][-1]} rev={q['rows'].get('revenue',[None])[-1]} ann={len(d['announcements'])} cc={len(d['concalls'])} ar={len(d['annual_reports'])} name={d['name'][:30]}")
    except Exception as e:
        print(s, 'ERR', e)
items = nse_rss.fetch(names)
print('NSE RSS matched', len(items))
for it in items[:10]: print('  ', it['symbol'], it['ts'], it['subject'][:50], '|', it['gist'][:60])
