#!/usr/bin/env python3
"""Short clips for TikTok, Instagram Reels and YouTube Shorts: one thing the add-on does, upright (9:16), 14 to 22 seconds, with big words
at the start, the trailer's captions and music, and "Demo: Link im Profil" at the end. The owner's wish (2026-11-05): "in TikTok noch
bewerben … gerne mehr Menschen erreichen".

The clips are cut from the shots of the trailer (tools/trailer/shots.py), which are filmed once for both (--work, the same folder as
tools/make_trailer.py): a shot that is not filmed yet is filmed first. What is in a clip, its first words, the text for under the video
and its hashtags: tools/trailer/clips.py.

  python3 tools/make_clips.py                   every clip, German: /tmp/clips/<id>-de.mp4 (+ .jpg) and clips.json
  python3 tools/make_clips.py licht fenster     only these
  python3 tools/make_clips.py --lang de,en      both languages
  python3 tools/make_clips.py --edit-only       film nothing, only cut (what is not filmed: the clip is left out)
  python3 tools/make_clips.py --list            the clips, their shots and how long they are
  python3 tools/make_clips.py --texts [--lang en]   the plan of the posts: week, first words, text and hashtags (Markdown)
The workflow "Trailer" makes them after the trailer and puts them on its page: https://burned4aim.github.io/HA-Floorplanner/trailer/
"""
import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "tools" / "guide"))
sys.path.insert(0, str(ROOT / "tools" / "trailer"))

import clips as C  # noqa: E402
import make_trailer as T  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clips", nargs="*", help="ids of clips (none: all)")
    ap.add_argument("--lang", default="de", help="de, en or de,en")
    ap.add_argument("--out", default="/tmp/clips")
    ap.add_argument("--work", default="/tmp/trailer-work", help="where the filmed shots are kept (the same as the trailer's)")
    ap.add_argument("--edit-only", action="store_true", help="film nothing, only cut")
    ap.add_argument("--no-music", action="store_true")
    ap.add_argument("--slow", type=float, default=4, help="how much slower the page runs while a shot is filmed (a shot can say more)")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--texts", action="store_true", help="print the plan of the posts (Markdown)")
    a = ap.parse_args()
    langs = [x for x in a.lang.split(",") if x]
    bad = [c for c in a.clips if c not in C.BY_ID]
    if bad:
        sys.exit("unknown clips: " + " ".join(bad) + " (there are: " + " ".join(C.BY_ID) + ")")
    chosen = [C.BY_ID[c] for c in a.clips] if a.clips else C.CLIPS
    if a.list:
        for c in chosen:
            print(f"{c['id']:10} {C.seconds(c):5.1f} s  {C.when(c):22} {' '.join(C.shot_ids(c))}")
        return
    if a.texts:
        print(C.texts_markdown(langs[0]))
        return
    need = list(dict.fromkeys(s for c in chosen for s in C.shot_ids(c)))
    failed = []
    if not a.edit_only:
        ids = [s for s in need if any(T.load(a.work, lang, s) is None for lang in langs)]
        if ids:
            failed = T.film_all(ids, langs, a.work, a.slow)
    import clipcut
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "clips.json").write_text(json.dumps({"clips": [C.meta(c) for c in C.CLIPS]}, ensure_ascii=False, indent=1) + "\n")
    for lang in langs:
        takes = {sid: T.load(a.work, lang, sid) for sid in need}
        for c in chosen:
            missing = [s for s in C.shot_ids(c) if takes[s] is None]
            if missing:
                print(f"[{lang}] {c['id']}: not filmed: {' '.join(missing)} (the clip is left out)")
                failed.append(f"{lang}/{c['id']}")
                continue
            t = time.time()
            mp4 = out / f"{c['id']}-{lang}.mp4"
            info = clipcut.make(takes, c, lang, mp4, music=not a.no_music)
            print(f"[{lang}] {mp4.name}: {info['seconds']:.1f} s, {mp4.stat().st_size / 1e6:.1f} MB, {time.time() - t:.0f} s", flush=True)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
