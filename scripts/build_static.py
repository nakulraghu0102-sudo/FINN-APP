"""Build static, host-anywhere copies of the app.

    python scripts/build_static.py

dist/site/      plain copy of web/ (GitHub Pages / Netlify / any static host)
dist/artifact/  single page with CSS and JS inlined (no <html>/<head>/<body> wrapper),
                plus data/ beside it, for hosts that wrap the page themselves.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB, DIST = ROOT / "web", ROOT / "dist"


def main() -> None:
    shutil.rmtree(DIST, ignore_errors=True)
    shutil.copytree(WEB, DIST / "site")

    html = (WEB / "index.html").read_text()
    css = (WEB / "assets" / "styles.css").read_text()
    js = (WEB / "assets" / "app.js").read_text()
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
    keep = [ln for ln in head.splitlines()
            if ln.strip() and not re.search(r'charset|name="viewport"|rel="manifest"|rel="icon"|assets/styles', ln)]
    body = re.sub(r'<script src="assets/app\.js[^"]*"></script>', lambda _m: f"<script>\n{js}\n</script>", body)
    page = "\n".join(keep) + f"\n<style>\n{css}\n</style>\n" + body.strip() + "\n"
    out = DIST / "artifact"
    out.mkdir(parents=True)
    (out / "index.html").write_text(page)
    shutil.copytree(WEB / "data", out / "data")
    print(f"dist/site and dist/artifact/index.html ({len(page)/1024:.0f} KB) written")


if __name__ == "__main__":
    main()
