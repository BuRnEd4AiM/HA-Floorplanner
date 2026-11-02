#!/usr/bin/env python3
"""The video guide: a short video for every feature, filmed automatically in the demo, and a page to search them.

Record (needs the demo: cd demo && npm ci && node build.mjs; pip install playwright pillow; ffmpeg):
  python3 tools/make_guide.py --list                      the clips (id, group, title)
  python3 tools/make_guide.py lights rooms                record these clips (German) into /tmp/guide-videos
  python3 tools/make_guide.py --lang de,en --out DIR      record every clip in both languages into DIR/<lang>/
  python3 tools/make_guide.py --shard 2/4 ...             only every 4th clip, starting with the 2nd (CI runs 4 at once)
  python3 tools/make_guide.py --slow 1 lights             a quick try (choppier video: the page is filmed in real time)
Build the page (GitHub Pages, workflow "Video guide" and "Demo"):
  python3 tools/make_guide.py --site _site/guide --videos DIR
      writes DIR's videos, guide.json (titles, steps, search words of every clip that has a video) and index.html there.

A clip is a function in tools/guide/clips_*.py (see tools/guide/README.md): it says what happens (r.say), moves and clicks
(r.click, r.drag, r.type ...). Every new feature of the add-on gets a clip there (.claude/CLAUDE.md).
"""
import argparse
import datetime
import importlib
import json
import os
import re
import shutil
import sys
import tempfile
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools" / "guide"))

import recorder  # noqa: E402  (after the path above)

PAGE = ROOT / "tools" / "guide" / "page.html"
EXTS = (".mp4", ".jpg", ".prev.mp4", ".small.mp4")     # the files of a clip: the video, its picture, the preview, the copy for the add-on
LANGS = ("de", "en")

# the groups of the page, in this order
CATS = [
    {"id": "start", "de": "Erste Schritte", "en": "First steps", "icon": "🧭"},
    {"id": "live", "de": "Bedienen", "en": "Control", "icon": "💡"},
    {"id": "pages", "de": "Seiten", "en": "Pages", "icon": "🗂️"},
    {"id": "edit", "de": "Plan zeichnen", "en": "Drawing the plan", "icon": "✏️"},
    {"id": "dash", "de": "Seiten gestalten", "en": "Designing pages", "icon": "🧩"},
    {"id": "settings", "de": "Einstellungen", "en": "Settings", "icon": "⚙️"},
    {"id": "phone", "de": "Handy und Tablet", "en": "Phone and tablet", "icon": "📱"},
]


def load_clips():
    for f in sorted((ROOT / "tools" / "guide").glob("clips_*.py")):
        importlib.import_module(f.stem)
    cats = [c["id"] for c in CATS]
    for c in recorder.CLIPS.values():
        assert c.cat in cats, f"clip {c.id}: unknown group {c.cat}"
        assert re.fullmatch(r"[a-z0-9-]+", c.id), f"clip {c.id}: only a-z, 0-9 and - in an id"
        for k in ("title", "desc"):
            assert set(getattr(c, k)) == set(LANGS), f"clip {c.id}: {k} needs {LANGS}"
    return recorder.CLIPS


def load_features():
    """every feature of the add-on and its clips (tools/guide/features.py)"""
    import features
    return features.F


def version():
    m = re.search(r'^version:\s*"?([\d.]+)', (ROOT / "floorplan3d" / "config.yaml").read_text(), re.M)
    return m.group(1) if m else "?"


def record_all(ids, langs, out, slow, keep_going):
    from playwright.sync_api import sync_playwright
    from compose import make_video
    clips = load_clips()
    if not recorder.DEMO.exists():
        sys.exit(f"{recorder.DEMO} is missing: cd demo && npm ci && node build.mjs")
    failed = []
    chrome = os.environ.get("CHROME") or ("/opt/pw-browsers/chromium" if Path("/opt/pw-browsers/chromium").exists() else None)
    with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
        b = p.chromium.launch(**({"executable_path": chrome} if chrome else {}), args=recorder.ARGS)
        for lang in langs:
            d = Path(out) / lang
            d.mkdir(parents=True, exist_ok=True)
            for cid in ids:
                c = clips[cid]
                t = time.time()
                print(f"[{lang}] {cid} …", flush=True)
                try:
                    res = recorder.record(b, c, lang, slow, tmp)
                    dur = make_video(res, d / f"{cid}.mp4", d / f"{cid}.jpg", d / f"{cid}.prev.mp4", d / f"{cid}.small.mp4")
                    info = {"id": cid, "lang": lang, "steps": res["steps"], "duration": dur, "version": version(),
                            "date": datetime.date.today().isoformat(), "slow": slow}
                    (d / f"{cid}.json").write_text(json.dumps(info, ensure_ascii=False, indent=1) + "\n")
                    mb = (d / f"{cid}.mp4").stat().st_size / 1e6
                    print(f"[{lang}] {cid}: {dur:.1f} s video, {mb:.1f} MB, {len(res['frames'])} screen pictures, {time.time() - t:.0f} s", flush=True)
                except Exception:
                    traceback.print_exc()
                    failed.append(f"{lang}/{cid}")
                    if not keep_going:
                        break
                    try:  # the browser can be gone after a bad clip: a new one for the next
                        b.close()
                    except Exception:
                        pass
                    b = p.chromium.launch(**({"executable_path": chrome} if chrome else {}), args=recorder.ARGS)
        b.close()
    if failed:
        print("FAILED: " + " ".join(failed))
    return failed


def build_site(site, videos):
    """the page of the guide with every clip that has a video (in at least one language)"""
    clips = load_clips()
    site, videos = Path(site), Path(videos) if videos else None
    site.mkdir(parents=True, exist_ok=True)
    items = []
    for c in sorted(clips.values(), key=lambda c: ([x["id"] for x in CATS].index(c.cat), c.order)):
        it = {**c.meta(), "v": {}}
        for lang in LANGS:
            j = videos / lang / f"{c.id}.json" if videos else None
            if j and j.exists() and (videos / lang / f"{c.id}.mp4").exists():
                info = json.loads(j.read_text())
                small = videos / lang / f"{c.id}.small.mp4"
                it["v"][lang] = {"steps": info["steps"], "duration": info["duration"], "version": info.get("version"), "date": info.get("date"),
                                 "kb": round(small.stat().st_size / 1024) if small.exists() else 0}
                (site / lang).mkdir(exist_ok=True)
                for ext in EXTS:
                    src = videos / lang / f"{c.id}{ext}"
                    if src.exists() and src.resolve() != (site / lang / f"{c.id}{ext}").resolve():
                        shutil.copyfile(src, site / lang / f"{c.id}{ext}")
        if it["v"]:
            items.append(it)
    have = {it["id"] for it in items}
    feats = [{"id": x["id"], "group": x["group"], "de": x["de"], "en": x["en"], "clips": [c for c in x["clips"] if c in have], "why": x["why"]}
             for x in load_features()]
    data = {"cats": CATS, "clips": items, "features": feats,
            "built": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="minutes"), "version": version()}
    (site / "guide.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    shutil.copyfile(PAGE, site / "index.html")
    print(f"{site}: {len(items)} of {len(clips)} clips have a video")
    return data


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clips", nargs="*", help="clip ids (none: all)")
    ap.add_argument("--lang", default="de", help="de, en or de,en")
    ap.add_argument("--out", default="/tmp/guide-videos")
    ap.add_argument("--slow", type=float, default=float(os.environ.get("GUIDE_SLOW", 2)))
    ap.add_argument("--shard", help="i/n: only every n-th clip, starting with the i-th (1-based)")
    ap.add_argument("--keep-going", action="store_true", help="go on after a clip that failed")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--site")
    ap.add_argument("--videos")
    a = ap.parse_args()
    if a.site:
        build_site(a.site, a.videos)
        return
    clips = load_clips()
    if a.list:
        for c in clips.values():
            print(f"{c.id:22} {c.cat:9} {c.title['de']}")
        return
    ids = a.clips or list(clips)
    bad = [i for i in ids if i not in clips]
    if bad:
        sys.exit("unknown clips: " + " ".join(bad))
    if a.shard:
        i, n = map(int, a.shard.split("/"))
        ids = ids[i - 1::n]
    failed = record_all(ids, [x for x in a.lang.split(",") if x], a.out, a.slow, a.keep_going or len(ids) > 1)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
