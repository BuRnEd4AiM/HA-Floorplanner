#!/usr/bin/env python3
"""The trailer: a short film (about a minute and a half) of the best of the add-on, to show people what it can do.

The owner's wish (2026-11-03): "ein cooles Kurzvideo, wo alle Funktionen zeigt, in einem coolen Zusammenschnitt, wo auch wirklich
qualitativ gut aussieht … schick und modern … dass wenn man jetzt irgendwo einen Post macht … das hinschicken kann".

How it is made (needs the demo: cd demo && npm ci && node build.mjs; pip install playwright pillow numpy; ffmpeg):
  1. Every shot of tools/trailer/shots.py is filmed in the demo with the engine of the video guide (tools/guide/recorder.py).
     The pictures are kept (--work, default /tmp/trailer-work/<lang>/<shot>/), so a second run only films what is missing.
  2. tools/trailer/edit.py cuts them to the beat: captions that come up word by word, the app in a floating window, the 3D house
     full screen, soft zooms from shot to shot, the title at the start and the address of the demo at the end.
  3. tools/trailer/music.py writes the music for exactly these cuts (made here from numbers: no licence of anybody else).

  python3 tools/make_trailer.py                       German, landscape (1920 × 1080) and upright (1080 × 1920): /tmp/trailer/
  python3 tools/make_trailer.py --lang de,en          both languages
  python3 tools/make_trailer.py --shots light power   film these shots again (the others are taken from --work)
  python3 tools/make_trailer.py --edit-only           only cut again (after a change of a caption, the music or the look)
  python3 tools/make_trailer.py --list                the shots in their order
Files: trailer-<lang>.mp4 (landscape), trailer-<lang>-9x16.mp4 (upright, for Reels / TikTok / Shorts), trailer-<lang>.jpg (picture).
"""
import argparse
import json
import os
import shutil
import sys
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools" / "guide"))
sys.path.insert(0, str(ROOT / "tools" / "trailer"))

import recorder  # noqa: E402
import shots as S  # noqa: E402

LANGS = ("de", "en")


def film(browser, sh, lang, work, slow):
    """film one shot; its pictures and what happened (moves, clicks, zooms) go to work/<lang>/<id>/"""
    d = Path(work) / lang / sh.id
    if d.exists():
        shutil.rmtree(d)
    (d / "frames").mkdir(parents=True)
    r = recorder.Rec(browser, sh, lang, sh.slow or slow, d / "frames")
    r.open()
    if sh.prep:
        sh.prep(r)
        r.pg.wait_for_timeout(800)
        r.moves, r.clicks, r.steps = [], [], []
    r.pos_start = r.pos
    r.start()
    try:
        sh.fn(r)
        r.wait(max(0, sh.seconds * sh.speed * 1000 - r.now() * 1000) + 300)   # at least as long as the shot is in the film
    finally:
        r.stop()
    res = r.result()
    res["frames"] = [(t, Path(p).name) for t, p in res["frames"]]
    (d / "shot.json").write_text(json.dumps(res))
    return res


def load(work, lang, sid):
    """what film() kept of a shot (None: not filmed yet)"""
    d = Path(work) / lang / sid
    j = d / "shot.json"
    if not j.exists():
        return None
    res = json.loads(j.read_text())
    res["frames"] = [(t, d / "frames" / name) for t, name in res["frames"]]
    return res


def film_all(ids, langs, work, slow):
    from playwright.sync_api import sync_playwright
    if not recorder.DEMO.exists():
        sys.exit(f"{recorder.DEMO} is missing: cd demo && npm ci && node build.mjs")
    chrome = os.environ.get("CHROME") or ("/opt/pw-browsers/chromium" if Path("/opt/pw-browsers/chromium").exists() else None)
    failed = []
    with sync_playwright() as p:
        launch = lambda: p.chromium.launch(**({"executable_path": chrome} if chrome else {}), args=recorder.ARGS)  # noqa: E731
        b = launch()
        for lang in langs:
            for sid in ids:
                sh = S.SHOTS[sid]
                if sh.kind == "card":
                    continue
                t = time.time()
                print(f"[{lang}] {sid} …", flush=True)
                try:
                    res = film(b, sh, lang, work, slow)
                    print(f"[{lang}] {sid}: {len(res['frames'])} pictures, {res['end']:.1f} s, {time.time() - t:.0f} s", flush=True)
                except Exception:
                    traceback.print_exc()
                    failed.append(f"{lang}/{sid}")
                    try:
                        b.close()
                    except Exception:
                        pass
                    b = launch()
        b.close()
    return failed


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lang", default="de", help="de, en or de,en")
    ap.add_argument("--out", default="/tmp/trailer")
    ap.add_argument("--work", default="/tmp/trailer-work", help="where the filmed pictures are kept")
    ap.add_argument("--shots", nargs="*", help="film only these shots again (none given: every shot that is not filmed yet)")
    ap.add_argument("--edit-only", action="store_true", help="film nothing, only cut")
    ap.add_argument("--film-only", action="store_true", help="only film, do not cut")
    ap.add_argument("--formats", default="16x9,9x16", help="16x9 (landscape), 9x16 (upright) or both")
    ap.add_argument("--no-music", action="store_true")
    ap.add_argument("--slow", type=float, default=4, help="how much slower the page runs while it is filmed (a shot can say more)")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    langs = [x for x in a.lang.split(",") if x]
    if a.list:
        t = 0.0
        for sid in S.ORDER:
            sh = S.SHOTS[sid]
            title = (sh.caption or {}).get("de", ("", "", ""))[1]
            print(f"{t:6.1f} s  {sid:12} {sh.kind:6} {sh.beats:3} beats  {title}")
            t += sh.seconds
        print(f"{t:6.1f} s  in all")
        return
    bad = [s for s in (a.shots or []) if s not in S.SHOTS]
    if bad:
        sys.exit("unknown shots: " + " ".join(bad))
    failed = []
    if not a.edit_only:
        if a.shots:
            ids = a.shots
        else:
            ids = [s for s in S.ORDER if any(load(a.work, lang, s) is None for lang in langs)]
        if ids:
            failed = film_all(ids, langs, a.work, a.slow)
    if a.film_only:
        sys.exit(1 if failed else 0)
    import edit
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for lang in langs:
        takes = {sid: load(a.work, lang, sid) for sid in S.ORDER}
        missing = [sid for sid in S.ORDER if S.SHOTS[sid].kind != "card" and takes[sid] is None]
        if missing:
            print(f"[{lang}] not filmed: {' '.join(missing)} (they are left out)")
        for fmt in [x for x in a.formats.split(",") if x]:
            name = f"trailer-{lang}" + ("" if fmt == "16x9" else f"-{fmt}")
            t = time.time()
            info = edit.make(takes, lang, fmt, out / f"{name}.mp4", music=not a.no_music)
            print(f"[{lang}] {name}.mp4: {info['seconds']:.1f} s, {(out / f'{name}.mp4').stat().st_size / 1e6:.1f} MB, {time.time() - t:.0f} s")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
