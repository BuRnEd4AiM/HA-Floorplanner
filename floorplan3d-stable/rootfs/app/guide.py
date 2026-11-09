"""🎬 The video guide in the add-on (4.52.0).

The videos are on GitHub Pages next to the demo (tools/make_guide.py records them in the demo after every update). The
add-on itself stays small: its button opens that page. An admin can save a smaller copy into the add-on
("📥 Für ohne Internet speichern": the 960 × 540 videos and pictures of one language, about 20 MB) into DATA_DIR/guide;
then the add-on serves it under guide/ and the videos also play without internet.

Pure parts (files_of, local_json, allowed, status) are tested in tests/test_guide.py; download() fetches with aiohttp.
"""
import asyncio
import json
import os
import re
import shutil
import time
from pathlib import Path

URL = os.environ.get("GUIDE_URL", "https://burned4aim.github.io/HA-Floorplanner/guide/")
LANGS = ("de", "en")
# the only files the add-on keeps and serves: the page, its list and per clip the small video and its picture
_NAME = re.compile(r"^(index\.html|guide\.json|(de|en)/[a-z0-9-]+\.(jpg|small\.mp4))$")


def allowed(name: str) -> bool:
    return bool(_NAME.match(name or ""))


def files_of(data: dict, lang: str) -> list:
    """the files of the saved copy in one language: every clip that has a video in it (small video and picture)"""
    out = []
    for c in data.get("clips", []):
        if lang in (c.get("v") or {}) and allowed(f"{lang}/{c.get('id')}.jpg"):
            out += [f"{lang}/{c['id']}.small.mp4", f"{lang}/{c['id']}.jpg"]
    return out


def size_kb(data: dict, lang: str) -> int:
    """how big the saved copy gets (the small videos; the pictures add a little)"""
    return sum(int((c.get("v") or {}).get(lang, {}).get("kb") or 0) + 60 for c in data.get("clips", []) if lang in (c.get("v") or {}))


def local_json(data: dict, lang: str, now: float | None = None) -> dict:
    """guide.json of the saved copy: only this language, marked local (the page then plays the .small.mp4)"""
    clips = [{**c, "v": {lang: c["v"][lang]}} for c in data.get("clips", []) if lang in (c.get("v") or {}) and allowed(f"{lang}/{c.get('id')}.jpg")]
    return {**data, "clips": clips, "local": True, "lang": lang, "saved": int(now if now is not None else time.time())}


class Job:
    """the download that runs (one at a time)"""
    def __init__(self):
        self.state, self.lang, self.done, self.total, self.error, self.task = "idle", None, 0, 0, None, None

    def start(self, lang):
        self.state, self.lang, self.done, self.total, self.error = "loading", lang, 0, 0, None

    def running(self) -> bool:
        return self.state == "loading"


def status(folder: Path, job: Job) -> dict:
    """what the page needs to know: is there a saved copy (which language, how big, from when), is a download running"""
    info = {"local": False, "url": URL, "state": job.state, "done": job.done, "total": job.total, "error": job.error, "lang": job.lang}
    j = folder / "guide.json"
    if j.exists():
        try:
            d = json.loads(j.read_text())
            size = sum(f.stat().st_size for f in folder.rglob("*") if f.is_file())
            info.update(local=True, localLang=d.get("lang"), saved=d.get("saved"), version=d.get("version"), clips=len(d.get("clips", [])),
                        mb=max(0.1, round(size / 1e6, 1)))
        except (OSError, ValueError):
            pass
    return info


async def download(folder: Path, lang: str, job: Job, session_factory, url: str = URL):
    """fetch the copy into <folder>.new, then put it in place of the old one (a broken download leaves the old copy)"""
    folder = Path(folder)
    tmp = folder.with_name(folder.name + ".new")
    shutil.rmtree(tmp, ignore_errors=True)
    try:
        async with session_factory() as s:
            async def get(name):
                async with s.get(url + name) as r:
                    if r.status != 200:
                        raise RuntimeError(f"{name}: HTTP {r.status}")
                    p = tmp / name
                    p.parent.mkdir(parents=True, exist_ok=True)
                    with open(p, "wb") as f:
                        async for chunk in r.content.iter_chunked(1 << 16):
                            f.write(chunk)
            async with s.get(url + "guide.json") as r:
                if r.status != 200:
                    raise RuntimeError(f"guide.json: HTTP {r.status}")
                data = json.loads(await r.text())
            files = ["index.html"] + files_of(data, lang)
            if len(files) < 2:
                raise RuntimeError(f"no videos in {lang}")
            job.total = len(files)
            for name in files:
                await get(name)
                job.done += 1
        (tmp / "guide.json").write_text(json.dumps(local_json(data, lang), ensure_ascii=False))
        old = folder.with_name(folder.name + ".old")
        shutil.rmtree(old, ignore_errors=True)
        if folder.exists():
            folder.rename(old)
        tmp.rename(folder)
        shutil.rmtree(old, ignore_errors=True)
        job.state = "done"
    except asyncio.CancelledError:
        shutil.rmtree(tmp, ignore_errors=True)
        job.state = "idle"
        raise
    except Exception as e:      # noqa: BLE001 (any failure: say it on the page, keep the old copy)
        shutil.rmtree(tmp, ignore_errors=True)
        job.state, job.error = "error", str(e)[:200]
