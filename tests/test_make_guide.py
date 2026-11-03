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
    page = (site / "index.html").read_text()
    assert page == mg.page_html() and "<!-- search.js -->" not in page                              # the search is in the page,
    assert page.index("root.GuideSearch = api") < page.index("GuideSearch.index(")                  # before the page uses it
    it = data["clips"][0]
    assert it["tags"]["de"] and it["tags"]["en"] and it["feat"]["de"] and data["syn"]            # more search words, words with the same meaning
    assert all((site / "de" / f"light{ext}").exists() for ext in mg.EXTS)
    assert json.loads((site / "guide.json").read_text())["clips"][0]["title"]["de"]


def test_the_page_needs_nothing_from_elsewhere():
    page = mg.PAGE.read_text()
    assert not re.search(r"<script[^>]+src=|<link[^>]+href=\"http", page)       # works offline as the add-on's copy
    for key in re.findall(r'data-t="([a-zA-Z]+)"', page):
        assert re.search(rf"\b{key}:", page.split("en: {")[0]) and re.search(rf"\b{key}:", page.split("en: {")[1]), key


def test_the_player_fits_a_phone():
    """#619: under 900 px the player's column was "1fr", which grew to the width of the video and the title; on a phone the player
    was cut off left and right and could not be zoomed out (checked in Chromium at 360 and 390 px: now nothing is wider)"""
    page = mg.PAGE.read_text()
    narrow = page.split("@media (max-width: 900px) {")[1].split("}")[0]
    assert re.search(r"\.pIn\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)", narrow), narrow
    assert re.search(r"\.pIn\s*>\s*\*\s*\{\s*min-width:\s*0", page)


def test_every_feature_has_a_clip_or_a_reason():
    """the owner, 2026-11-02: "das Programm hat echt viele Funktionen … nicht dass man da was vergisst": tools/guide/features.py lists
    every feature; each has clips (that exist) or says why it cannot be filmed, and every clip shows at least one feature"""
    clips, feats = mg.load_clips(), mg.load_features()
    ids = [x["id"] for x in feats]
    assert len(ids) == len(set(ids)), "two features with the same id"
    groups = {c["id"] for c in mg.CATS}
    used = set()
    for x in feats:
        assert x["group"] in groups and x["de"] and x["en"], x["id"]
        assert x["clips"] or x["why"], f"feature {x['id']}: no clip and no reason (write a clip or say why it cannot be filmed)"
        for c in x["clips"]:
            assert c in clips, f"feature {x['id']}: no clip {c}"
        used.update(x["clips"])
    assert set(clips) <= used, f"clips no feature names: {sorted(set(clips) - used)}"


def test_every_new_version_adds_its_features_to_the_list():
    """from 4.52.0 on, a version that adds something (### Added in CHANGELOG.md) has a line in features.py with since=<version>:
    so a new feature cannot be forgotten in the guide"""
    text = (ROOT / "CHANGELOG.md").read_text()
    since = {x["since"] for x in mg.load_features() if x["since"]}
    for v, body in re.findall(r"^## \[(\d+\.\d+\.\d+)\][^\n]*\n(.*?)(?=^## \[|\Z)", text, re.M | re.S):
        if tuple(map(int, v.split("."))) >= (4, 52, 0) and "### Added" in body:
            assert v in since, f"{v} adds features: put them into tools/guide/features.py with since=\"{v}\" (and a clip)"
