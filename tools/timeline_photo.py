#!/usr/bin/env python3
"""A photo of the demo for the timeline page: tools/make_timeline.py shows docs/timeline/<version>/*.jpg at that version.

    python3 tools/timeline_photo.py                    the demo as it is now, for the version in floorplan3d/config.yaml
                                                       (builds it into a temporary file; demo/floorplan3d-demo.html stays as it is)
    python3 tools/timeline_photo.py 3.40.0 4.1.0       the demo as it was at these versions, from the git history (old photos)

    --name <word>      the file name: docs/timeline/<version>/<n>-<word>.jpg (default "demo"; the same name again replaces it)
    --query "<query>"  what the demo opens with (default "mode=live": the house as a user sees it; "mode=edit", "view=2d" …)
    --out <folder>     somewhere else than docs/timeline (to look at a photo first)

Needs: pip install playwright==1.56.0 (it fits the preinstalled Chromium /opt/pw-browsers/chromium), node for the build.
A new <major>.<minor>.0 version needs a photo (or example pictures in docs/ideen-<major>.<minor>/): tests/test_make_timeline.py checks it."""
import argparse
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEMO = "demo/floorplan3d-demo.html"
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]


def version_of(config_yaml):
    m = re.search(r'^version:\s*"?([\d.]+)', config_yaml, re.M)
    return m[1] if m else None


def key(version):
    return tuple(int(p) for p in version.split("."))


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def demo_builds():
    """[(commit, version)] of every built demo in the history, newest first (the version is the one in config.yaml then)"""
    out = []
    for commit in git("log", "--format=%H", "--", DEMO).split():
        try:
            v = version_of(git("show", f"{commit}:floorplan3d/config.yaml"))
        except subprocess.CalledProcessError:
            continue
        if v:
            out.append((commit, v))
    return out


def pick(version, builds):
    """the newest build of exactly this version, else the first one after it (it has everything of the version), else None"""
    same = [b for b in builds if b[1] == version]
    if same:
        return same[0]
    later = [b for b in builds if key(b[1]) > key(version)]
    return later[-1] if later else None


def build_now(target):
    demo = ROOT / "demo"
    if not (demo / "node_modules" / "esbuild").exists():
        subprocess.run(["npm", "ci", "--no-audit", "--no-fund"], cwd=demo, check=True)
    subprocess.run(["node", "build.mjs", str(target)], cwd=demo, check=True)


def target_file(folder, name):
    """<n>-<name>.jpg: the same name again replaces that photo, a new name gets the next number"""
    folder.mkdir(parents=True, exist_ok=True)
    for f in folder.iterdir():
        if re.fullmatch(rf"\d+-{re.escape(name)}\.jpg", f.name):
            return f
    n = 1 + max((int(m[1]) for f in folder.iterdir() if (m := re.match(r"(\d+)-", f.name))), default=0)
    return folder / f"{n}-{name}.jpg"


def photo(page_file, target, query):
    from playwright.sync_api import sync_playwright
    chrome = os.environ.get("CHROME") or ("/opt/pw-browsers/chromium" if Path("/opt/pw-browsers/chromium").exists() else None)
    with sync_playwright() as p:
        b = p.chromium.launch(**({"executable_path": chrome} if chrome else {}), args=ARGS)
        ctx = b.new_context(viewport={"width": 1440, "height": 810}, locale="de-DE", timezone_id="Europe/Berlin")
        pg = ctx.new_page()
        # a fixed time of day for the sky (?skytime, older demos ignore it), so a photo does not depend on when it is taken
        pg.goto(f"{Path(page_file).resolve().as_uri()}?{query}&skytime=13:00&debug=1", wait_until="domcontentloaded", timeout=120000)
        try:                                                     # older demos have no __fp.ready(): then a few seconds are enough
            pg.wait_for_function("window.__fp && typeof window.__fp.ready === 'function'", timeout=10000)
            pg.wait_for_function("window.__fp.ready()", timeout=120000)
        except Exception:
            pg.wait_for_timeout(4000)
        pg.add_style_tag(content=".demo-badge{display:none!important}")
        pg.wait_for_timeout(4000)
        pg.screenshot(path=str(target), type="jpeg", quality=80)
        b.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("versions", nargs="*")
    ap.add_argument("--name", default="demo")
    ap.add_argument("--query", default="mode=live")
    ap.add_argument("--out", default=str(ROOT / "docs" / "timeline"))
    a = ap.parse_args()
    if not re.fullmatch(r"[a-z0-9-]+", a.name):
        sys.exit("--name: small letters, numbers and - only")
    with tempfile.TemporaryDirectory() as tmp:
        jobs = []
        if not a.versions:
            page = Path(tmp) / "demo.html"
            build_now(page)
            jobs.append((version_of((ROOT / "floorplan3d" / "config.yaml").read_text(encoding="utf-8")), page, "now"))
        else:
            builds = demo_builds()
            for v in a.versions:
                found = pick(v, builds)
                if not found:
                    print(f"{v}: no demo in the history at or after this version (the demo exists since 2.4.1)")
                    continue
                page = Path(tmp) / f"{v}.html"
                page.write_bytes(subprocess.run(["git", "show", f"{found[0]}:{DEMO}"], cwd=ROOT, capture_output=True, check=True).stdout)
                jobs.append((v, page, f"demo of {found[1]}, commit {found[0][:8]}"))
        for v, page, what in jobs:
            target = target_file(Path(a.out) / v, a.name)
            photo(page, target, a.query)
            print(f"{target} ({what}, {target.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
