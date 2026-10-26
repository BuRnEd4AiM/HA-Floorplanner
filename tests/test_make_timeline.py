"""The timeline page of the project (tools/make_timeline.py): reading CHANGELOG.md, the bit of Markdown, the pictures, the page."""
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
    assert mt.pictures(tmp_path) == {"4.3.0": ["ideen/4.3/1b-c.png", "ideen/4.3/2-a.jpg", "ideen/4.3/10-b.jpg"]}


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
            assert (tmp_path / p).is_file()
    assert (tmp_path / "img" / "3d.jpg").is_file()
