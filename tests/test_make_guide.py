"""🎬 The video guide (tools/make_guide.py, tools/guide/): every clip is complete (both languages, a group, steps that say what
happens), the page of the guide is built from the recorded videos, and the page needs nothing from elsewhere."""
import inspect
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import make_guide as mg  # noqa: E402


def test_every_clip_is_complete():
    clips = mg.load_clips()
    assert len(clips) >= 40
    cats = {c["id"] for c in mg.CATS}
    for c in clips.values():
        assert re.fullmatch(r"[a-z0-9-]+", c.id) and c.cat in cats, c.id
        for k in ("title", "desc"):
            assert set(getattr(c, k)) == {"de", "en"} and all(len(v) > 5 for v in getattr(c, k).values()), (c.id, k)
        assert len(c.keys.split()) >= 4, c.id                                   # words the search finds it by
        src = inspect.getsource(c.fn)
        assert src.count("r.say(") >= 2, c.id                                   # it says what happens (subtitles, chapters)
        assert "r.poster()" in src, c.id                                       # its picture in the list
        assert c.device in ("desktop", "phone")
    assert {c.cat for c in clips.values()} == cats                             # no empty group


def test_the_site_has_every_recorded_clip(tmp_path):
    vids = tmp_path / "videos"
    (vids / "de").mkdir(parents=True)
    for ext in mg.EXTS:
        (vids / "de" / f"light{ext}").write_bytes(b"x" * 2048)
    (vids / "de" / "light.json").write_text(json.dumps({"steps": [{"t": 0.4, "de": "Tippe …", "en": "Tap …"}], "duration": 12.5, "version": "4.52.0", "date": "2026-11-02"}))
    (vids / "de" / "orbit.json").write_text("{}")                             # no video: left out
    data = mg.build_site(tmp_path / "site", vids)
    assert [c["id"] for c in data["clips"]] == ["light"] and data["cats"] == mg.CATS
    v = data["clips"][0]["v"]
    assert list(v) == ["de"] and v["de"]["duration"] == 12.5 and v["de"]["kb"] == 2 and v["de"]["steps"][0]["en"] == "Tap …"
    site = tmp_path / "site"
    assert (site / "index.html").read_text() == mg.PAGE.read_text()
    assert all((site / "de" / f"light{ext}").exists() for ext in mg.EXTS)
    assert json.loads((site / "guide.json").read_text())["clips"][0]["title"]["de"]


def test_the_page_needs_nothing_from_elsewhere():
    page = mg.PAGE.read_text()
    assert not re.search(r"<script[^>]+src=|<link[^>]+href=\"http", page)       # works offline as the add-on's copy
    for key in re.findall(r'data-t="([a-zA-Z]+)"', page):
        assert re.search(rf"\b{key}:", page.split("en: {")[0]) and re.search(rf"\b{key}:", page.split("en: {")[1]), key
