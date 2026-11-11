"""A fingerprint in the address of every interface file, so the browser may keep it (idea list 2026-11-11, step 3: a faster start).

Without it the add-on sends the interface files with "no-cache" (#328): at every start the browser asks for each of its ~320 files
whether it changed (one request each, through Home Assistant's ingress). With it the page names every file with the start of its
checksum (`app.js?v=1a2b3c4d5e6f`): the browser keeps such a file for good and asks nothing; after an update only the files that
really changed have a new address. Old and new files cannot mix (#328): an address with a checksum is only sent as "keep" when the
checksum is the file's own (`fits`), and index.html itself is still checked at every start.

The modules import each other as './name.js'; an import map in index.html points every such address to its fingerprinted one (browsers
since 2023; an older browser ignores the map and loads the plain addresses with "no-cache", as before). Pure: no aiohttp, tests in
tests/test_assetver.py; server.py uses it for "/" and in `no_stale_files`.
"""
import hashlib
import json
import re
import time
from pathlib import Path

EXTS = (".js", ".mjs", ".css")
LEN = 12                                   # hex digits of the sha256 in the address: enough to tell two versions of one file apart
KEEP = "private, max-age=31536000, immutable"


class Versions:
    """the checksum of every interface file below root, read once and again only when a file changes (size or time)"""

    def __init__(self, root: Path):
        self.root = Path(root)
        self._cache = {}                   # rel -> (mtime_ns, size, short)
        self._table = (0.0, None)          # (when, table): looking at every file takes a few ms, a page start needs it once

    def of(self, rel: str):
        """the short checksum of one file (forward slashes, relative to root), None for anything that is no interface file"""
        if not rel or not rel.endswith(EXTS) or ".." in rel.split("/"):
            return None
        f = self.root / rel
        try:
            st = f.stat()
        except OSError:
            return None
        hit = self._cache.get(rel)
        if hit and hit[0] == st.st_mtime_ns and hit[1] == st.st_size:
            return hit[2]
        short = hashlib.sha256(f.read_bytes()).hexdigest()[:LEN]
        self._cache[rel] = (st.st_mtime_ns, st.st_size, short)
        return short

    def table(self, max_age: float = 0) -> dict:
        """every interface file -> its short checksum; max_age: the last answer is good for that many seconds (the files of an
        installed add-on do not change while it runs; a changed file still never gets the old fingerprint, see fits)"""
        at, last = self._table
        if last is not None and time.monotonic() - at < max_age:
            return last
        out = {}
        for f in sorted(self.root.rglob("*")):
            if f.is_file() and f.suffix in EXTS:
                rel = f.relative_to(self.root).as_posix()
                v = self.of(rel)
                if v:
                    out[rel] = v
        self._table = (time.monotonic(), out)
        return out

    def fits(self, rel: str, v: str) -> bool:
        """is v the checksum of this file now? Only then may the browser keep it (otherwise it would keep new content under an old address)"""
        return bool(v) and self.of(rel) == v


def import_map(table: dict) -> dict:
    """'./x.js' -> './x.js?v=…' for every module (not the stylesheets): relative, so it works below Home Assistant's ingress address"""
    return {"imports": {f"./{rel}": f"./{rel}?v={v}" for rel, v in sorted(table.items()) if not rel.endswith(".css")}}


def page(html: str, table: dict) -> str:
    """index.html with the fingerprinted addresses: the import map before the first script, and the files index.html names itself
    (style.css, bootguard.js, app.js). A file that is not in the table keeps its plain address."""
    def addr(m):
        attr, rel = m.group(1), m.group(2)
        v = table.get(rel)
        return f'{attr}="{rel}?v={v}"' if v else m.group(0)
    out = re.sub(r'\b(src|href)="([^":?#]+\.(?:js|mjs|css))"', addr, html)
    tag = '<script type="importmap">' + json.dumps(import_map(table), separators=(",", ":")) + "</script>\n"
    i = out.find("<script")
    return out[:i] + tag + out[i:] if i >= 0 else out
