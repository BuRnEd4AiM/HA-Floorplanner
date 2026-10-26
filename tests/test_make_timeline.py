"""The timeline page of the project (tools/make_timeline.py): reading CHANGELOG.md and its German twin docs/CHANGELOG.de.md, the bit
of Markdown, the photos and example pictures, the tokens, the page. And the two rules that keep it growing: every version is also in
German, and every new <major>.<minor>.0 version has a picture (tools/timeline_photo.py)."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import make_timeline as mt  # noqa: E402

LOG = """# Changelog

## [Unreleased]
- not a version yet

## [1.1.0] - 2026-10-02
### Added
- **Big thing** (#12): it does a lot.
  - first detail
  - second detail
    goes on here
- Small thing. More text
  that goes on.
### Fixed
- A fix
Found while testing:

## [1.0.1] - 2026-10-01
Only a line under the heading.

## [1.0.0] - 2026-10-01
### Changed
- First stable version number
"""


def test_parse_versions_sections_and_items():
    vs = mt.parse_changelog(LOG)
    assert [v["version"] for v in vs] == ["1.1.0", "1.0.1", "1.0.0"]
    assert (vs[0]["major"], vs[0]["minor"], vs[0]["patch"], vs[0]["date"]) == (1, 1, 0, "2026-10-02")
    added, fixed = vs[0]["sections"]
    assert added["name"] == "Added" and fixed["name"] == "Fixed"
    assert added["items"][0] == {"md": "**Big thing** (#12): it does a lot.", "subs": ["first detail", "second detail goes on here"]}
    assert added["items"][1]["md"] == "Small thing. More text that goes on."
    assert [i["md"] for i in fixed["items"]] == ["A fix", "Found while testing:"]
    assert vs[1]["sections"] == [{"name": "Notes", "items": [{"md": "Only a line under the heading.", "subs": []}]}]


def test_unreleased_is_left_out():
    assert all("not a version" not in json.dumps(v) for v in mt.parse_changelog(LOG))


def test_markdown_is_escaped_and_linked():
    out = mt.md_inline("**Bold** `a<b>` *it* <script> [#13](https://x.y/?a=1&b=2) #138 and [guide](docs/IMPORT.md)")
    assert "<strong>Bold</strong>" in out and "<em>it</em>" in out
    assert "<code>a&lt;b&gt;</code>" in out and "&lt;script&gt;" in out and "<script>" not in out
    assert '<a href="https://x.y/?a=1&amp;b=2">#13</a>' in out          # the label "#13" is not linked a second time
    assert f'<a href="{mt.REPO_URL}/issues/138">#138</a>' in out
    assert f'<a href="{mt.REPO_URL}/blob/main/docs/IMPORT.md">guide</a>' in out
    assert mt.md_inline("`#5` stays code") == "<code>#5</code> stays code"


def test_headline():
    assert mt.headline("**🏡 The plot** (#538, wish): more") == "🏡 The plot"
    assert mt.headline("**Lived-in attic (#265)**:") == "Lived-in attic (#265)"
    assert mt.headline("Plain text first. Second sentence.") == "Plain text first."
    assert mt.headline("x" * 200, limit=20) == "x" * 19 + "…"


def test_pictures_belong_to_the_version_of_their_folder(tmp_path):
    (tmp_path / "docs" / "ideen-4.3").mkdir(parents=True)
    for name in ["10-b.jpg", "2-a.jpg", "mockup.js", "1b-c.png"]:
        (tmp_path / "docs" / "ideen-4.3" / name).write_text("x")
    (tmp_path / "docs" / "ideen-alt").mkdir()
    (tmp_path / "docs" / "ideen-alt" / "1.jpg").write_text("x")
    (tmp_path / "docs" / "timeline" / "4.3.0").mkdir(parents=True)
    (tmp_path / "docs" / "timeline" / "4.3.0" / "1-demo.jpg").write_text("x")
    (tmp_path / "docs" / "timeline" / "4.3.2").mkdir()
    (tmp_path / "docs" / "timeline" / "4.3.2" / "1-fix.jpg").write_text("x")
    (tmp_path / "docs" / "timeline" / "neu").mkdir()
    (tmp_path / "docs" / "timeline" / "neu" / "1.jpg").write_text("x")
    pics = mt.pictures(tmp_path)
    assert [(p["src"], p["kind"]) for p in pics["4.3.0"]] == [          # the photo of the version first, then the example pictures
        ("photos/4.3.0/1-demo.jpg", "photo"), ("ideen/4.3/1b-c.png", "idea"), ("ideen/4.3/2-a.jpg", "idea"), ("ideen/4.3/10-b.jpg", "idea")]
    assert pics["4.3.0"][0]["from"] == "docs/timeline/4.3.0/1-demo.jpg"
    assert [p["src"] for p in pics["4.3.2"]] == ["photos/4.3.2/1-fix.jpg"]
    assert set(pics) == {"4.3.0", "4.3.2"}


def test_german_changelog_is_read_like_the_english_one():
    de = mt.parse_changelog(LOG.replace("### Added", "### Neu").replace("### Fixed", "### Repariert").replace("### Changed", "### Verbessert"))
    assert [s["name"] for s in de[0]["sections"]] == ["Added", "Fixed"]
    en = mt.parse_changelog(LOG)
    data = mt.page_data(en, {}, de)
    assert all(v["de"] is not None for v in data)
    assert data[-1]["de"][0]["items"][0]["h"] == "Big thing"
    other = mt.parse_changelog(LOG.replace("  - second detail\n    goes on here\n", ""))   # one bullet less: the English texts are shown
    data = mt.page_data(en, {}, other)
    assert data[-1]["de"] is None and data[0]["de"] is not None


def test_tokens_per_day(tmp_path):
    folder = tmp_path / "docs" / "tokens"
    folder.mkdir(parents=True)
    rec = lambda **kw: json.dumps({"input": 0, "cache_write": 0, "cache_read": 0, "output": 0, **kw})
    (folder / "a.json").write_text(rec(start="2026-10-03", updated="2026-10-05T10:00:00Z", source="counted", input=300, output=30))
    (folder / "b.json").write_text(rec(start="2026-10-05", updated="2026-10-05T12:00:00Z", source="session list", cache_read=100))
    (folder / "estimate.json").write_text(rec(start="2026-10-01", updated="2026-10-18", source="estimate", cache_read=1000))
    (folder / "broken.json").write_text("{")
    tok = mt.tokens(tmp_path, {"2026-10-01": 3, "2026-10-02": 1})
    # the estimate until the first measured session, by the versions of each day; a session evenly from its start to its last update
    assert tok["days"] == {"2026-10-01": 750, "2026-10-02": 250, "2026-10-03": 110, "2026-10-04": 110, "2026-10-05": 210}
    assert (tok["total"], tok["written"], tok["estimated"], tok["estimatedUntil"]) == (1430, 30, 1000, "2026-10-03")


def test_build_writes_the_page_with_the_data(tmp_path):
    data = mt.build(ROOT, tmp_path)
    html = (tmp_path / "timeline.html").read_text(encoding="utf-8")
    assert "__DATA__" not in html
    raw = re.search(r'<script id="data" type="application/json">(.*?)</script>', html, re.S)[1]
    assert "<" not in raw                                                 # nothing in the data can end the script early
    page = json.loads(raw)
    versions = page["versions"]
    assert len(versions) == len(re.findall(r"^## \[\d+\.\d+\.\d+\]", (ROOT / "CHANGELOG.md").read_text(encoding="utf-8"), re.M))
    assert versions == data and versions[0]["v"] == "0.1.0"               # oldest first
    assert [v["date"] for v in versions] == sorted(v["date"] for v in versions)
    for v in versions:
        for p in v["pics"]:
            assert (tmp_path / p["src"]).is_file()
    assert (tmp_path / "img" / "3d.jpg").is_file()
    assert page["tokens"]["total"] > 0 and page["tokens"]["days"]


def test_every_version_is_also_in_german():
    """docs/CHANGELOG.de.md has every version of CHANGELOG.md with the same date, sections and bullets (the timeline page shows it
    when someone switches to German). A new version: write its entry in both files."""
    en = mt.parse_changelog((ROOT / "CHANGELOG.md").read_text(encoding="utf-8"))
    de = {v["version"]: v for v in mt.parse_changelog((ROOT / mt.GERMAN).read_text(encoding="utf-8"))}
    missing = [v["version"] for v in en if v["version"] not in de]
    assert not missing, f"not in {mt.GERMAN} yet: {missing}"
    for v in en:
        g = de[v["version"]]
        assert g["date"] == v["date"], v["version"]
        assert mt._shape(g["sections"]) == mt._shape(v["sections"]), \
            f"{v['version']}: the German entry needs the same sections, bullets and sub-bullets as the English one"
        refs = lambda sections: sorted(re.findall(r"#\d+", json.dumps(sections)))
        assert refs(g["sections"]) == refs(v["sections"]), f"{v['version']}: the German entry names other issues than the English one"
    assert set(de) == {v["version"] for v in en}, "a version in German that is not in CHANGELOG.md"


PHOTOS_SINCE = (4, 26)          # the rule began with 4.26.1; older versions have the photos tools/timeline_photo.py took from the history


def test_every_new_minor_version_has_a_picture():
    """Every <major>.<minor>.0 after 4.26 needs a picture for the timeline page: a photo in docs/timeline/<version>/ (python3
    tools/timeline_photo.py takes one of the demo) or the example pictures in docs/ideen-<major>.<minor>/."""
    pics = mt.pictures(ROOT)
    for v in mt.parse_changelog((ROOT / "CHANGELOG.md").read_text(encoding="utf-8")):
        if v["patch"] == 0 and (v["major"], v["minor"]) > PHOTOS_SINCE:
            assert pics.get(v["version"]), f"{v['version']}: no picture, run python3 tools/timeline_photo.py"
