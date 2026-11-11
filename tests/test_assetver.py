"""assetver.py: a fingerprint in the address of every interface file (idea list 2026-11-11, step 3: a faster start)."""
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import assetver as av  # noqa: E402

STATIC = Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app" / "static"


def tree(tmp_path):
    (tmp_path / "lang").mkdir()
    (tmp_path / "app.js").write_text("import './a.js';")
    (tmp_path / "a.js").write_text("export const a = 1;")
    (tmp_path / "lang" / "fr.js").write_text("export default {};")
    (tmp_path / "style.css").write_text("body{}")
    (tmp_path / "index.html").write_text("<p>x</p>")
    (tmp_path / "pic.png").write_bytes(b"\x89PNG")
    return av.Versions(tmp_path)


def test_every_interface_file_has_a_short_checksum(tmp_path):
    v = tree(tmp_path)
    t = v.table()
    assert set(t) == {"app.js", "a.js", "lang/fr.js", "style.css"}                       # not index.html, not pictures
    assert all(re.fullmatch(r"[0-9a-f]{12}", x) for x in t.values())
    assert v.of("pic.png") is None and v.of("nothere.js") is None and v.of("../server.py") is None and v.of("") is None


def test_a_changed_file_gets_a_new_checksum_and_the_old_one_does_not_fit(tmp_path):
    v = tree(tmp_path)
    old = v.of("a.js")
    assert v.fits("a.js", old) and not v.fits("a.js", "") and not v.fits("a.js", "0" * 12)
    (tmp_path / "a.js").write_text("export const a = 22;")                             # another size: read again
    os.utime(tmp_path / "a.js", ns=(1, 1))
    new = v.of("a.js")
    assert new != old and v.fits("a.js", new) and not v.fits("a.js", old)


def test_import_map_points_every_module_to_its_fingerprint(tmp_path):
    t = tree(tmp_path).table()
    m = av.import_map(t)["imports"]
    assert m["./app.js"] == f"./app.js?v={t['app.js']}" and m["./lang/fr.js"] == f"./lang/fr.js?v={t['lang/fr.js']}"
    assert "./style.css" not in m                                                          # a stylesheet is no module


def test_page_names_its_own_files_with_the_fingerprint_and_puts_the_map_first():
    html = ('<head><link rel="stylesheet" href="style.css"><link rel="icon" href="data:,"></head><body>'
            '<a href="https://x.org/y.js">y</a><script src="bootguard.js"></script>\n<script type="module" src="app.js"></script></body>')
    t = {"style.css": "aaaaaaaaaaaa", "bootguard.js": "bbbbbbbbbbbb", "app.js": "cccccccccccc"}
    out = av.page(html, t)
    assert 'href="style.css?v=aaaaaaaaaaaa"' in out and 'src="bootguard.js?v=bbbbbbbbbbbb"' in out and 'src="app.js?v=cccccccccccc"' in out
    assert 'href="https://x.org/y.js"' in out and 'href="data:,"' in out                 # other addresses stay
    m = re.search(r'<script type="importmap">(.*?)</script>', out)
    assert json.loads(m.group(1))["imports"]["./app.js"] == "./app.js?v=cccccccccccc"
    assert out.index("importmap") < out.index('src="bootguard.js')
    assert av.page('<script src="new.js"></script>', {}) .count('src="new.js"') == 1      # unknown file: plain address


def test_the_real_index_html():
    v = av.Versions(STATIC)
    t = v.table()
    out = av.page((STATIC / "index.html").read_text(encoding="utf-8"), t)
    assert f'src="app.js?v={t["app.js"]}"' in out and f'href="style.css?v={t["style.css"]}"' in out
    imports = json.loads(re.search(r'<script type="importmap">(.*?)</script>', out).group(1))["imports"]
    for rel in ("app.js", "i18n.js", "lang/zh.js", "vendor/three.module.min.js", "vendor/hls.light.module.min.js"):
        assert f"./{rel}" in imports, rel
    assert len(imports) > 300


def test_the_table_can_be_kept_a_moment(tmp_path):
    v = tree(tmp_path)
    first = v.table(max_age=60)
    (tmp_path / "b.js").write_text("export const b = 2;")
    assert v.table(max_age=60) is first                                                  # within the minute: the same answer
    assert "b.js" in v.table()                                                           # max_age 0 (default): looked at again
    assert v.fits("b.js", v.of("b.js"))
