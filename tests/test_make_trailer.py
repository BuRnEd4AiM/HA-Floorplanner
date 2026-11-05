"""🎞 The trailer (tools/make_trailer.py, tools/trailer/): the shots are complete in both languages, the parts of the film start on a
full bar of the music, the captions fit on the screen (landscape and upright), the film is put together on the beats, the zooms stay
inside the picture, and the music is as long as the film, loud enough and never clips."""
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "tools" / "guide"))
sys.path.insert(0, str(ROOT / "tools" / "trailer"))

import shots as S  # noqa: E402


def test_every_shot_is_complete():
    assert len(S.ORDER) == len(set(S.ORDER)) and set(S.ORDER) <= set(S.SHOTS)
    assert S.SHOTS[S.ORDER[0]].kind == "card" and S.ORDER[-1] == "outro"
    total = sum(S.SHOTS[s].seconds for s in S.ORDER)
    assert 60 <= total <= 120, total                                            # about a minute and a half
    for i, sid in enumerate(S.ORDER):
        sh = S.SHOTS[sid]
        assert sh.kind in ("card", "cine", "ui", "phone") and sh.part in S.PART, sid
        assert sh.beats >= 4 and sh.beats % 2 == 0, sid                         # cut on the beat
        if sh.caption:
            assert set(sh.caption) == {"de", "en"}, sid
            for lang in ("de", "en"):
                kicker, title, sub = sh.caption[lang]
                assert title and len(title) <= 60, (sid, lang)
        if sh.keep:                                                             # a short shot under the caption of the one before
            assert i and (S.SHOTS[S.ORDER[i - 1]].caption or S.SHOTS[S.ORDER[i - 1]].keep), sid
        if sh.kind not in ("card",) and sid != "outro":
            assert sh.caption or sh.keep, sid                                   # every shot says what it shows
    assert "/" not in S.DEMO_URL[:8] and "github.io" in S.DEMO_URL


def test_the_parts_begin_on_a_full_bar():
    """the music changes with the part (more drums, a hit when it starts): that must be on the first beat of a bar"""
    beats, last = 0, None
    for sid in S.ORDER:
        sh = S.SHOTS[sid]
        if last is not None and sh.part != last and sh.part != "hero":
            assert beats % 4 == 0, f"{sid} starts the part {sh.part} on beat {beats}, not on a bar"
        last = sh.part
        beats += sh.beats


def test_the_film_and_its_zooms():
    pytest.importorskip("PIL")
    import edit
    items, total = edit.plan({})                                                # nothing filmed: only the title card
    assert [it.shot.id for it in items] == ["intro"] and total == S.SHOTS["intro"].seconds
    for sid in S.ORDER:
        sh = S.SHOTS[sid]
        it = edit.Item(sh, 10.0, None)
        for u in (0, 0.2, 0.5, 0.99, 1.3):
            x, y, z = it.view(10.0 + u * sh.seconds)
            assert 0 <= x <= 1 and 0 <= y <= 1 and 1.0 <= z <= 1.6, (sid, u, x, y, z)
    for fx, fy, z, aspect in ((0, 0, 1.4, None), (1, 1, 1.4, None), (0.5, 0.5, 1.0, None), (0.9, 0.2, 1.2, 0.8), (0.5, 0.5, 1.0, 0.8)):
        x0, y0, x1, y1 = edit.crop(_Pic(1920, 1080), fx, fy, z, aspect)
        assert 0 <= x0 < x1 <= 1920 and 0 <= y0 < y1 <= 1080
        assert abs((x1 - x0) / (y1 - y0) - (aspect or 16 / 9)) < 0.01


class _Pic:
    def __init__(self, w, h):
        self.size = (w, h)


def test_every_caption_fits_on_the_screen():
    pytest.importorskip("PIL")
    import edit
    for fmt, (W, H) in edit.SIZES.items():
        for sid in S.ORDER:
            sh = S.SHOTS[sid]
            if not sh.caption:
                continue
            style = sh.kind if fmt == "16x9" else "upright"
            style = "side" if style == "phone" else style
            for lang in ("de", "en"):
                c = edit.Caption(sh.caption[lang], 0, 4, style, (W, H))
                L, rows = c.layout()
                assert len([r for r in rows if r[0] == "title"]) <= 3, (fmt, sid, lang)
                for kind, size, _, words, y, track in rows:
                    f = edit.font(kind, size)
                    w = sum(f.getlength(x) for x in words) + f.getlength(" ") * (len(words) - 1)
                    assert w <= L["maxw"] + 2 or len(words) == 1, (fmt, sid, lang, words)
                    assert 0 <= y and y + size * 1.3 <= H, (fmt, sid, lang, y)
                if fmt == "16x9" and style == "ui":                             # above the window
                    assert rows[-1][4] + rows[-1][1] * 1.3 <= H - 810 - 42, (sid, lang)


def test_the_title_says_what_is_inside():
    """the title at the start names what the add-on does besides the floor plan (the owner, 2026-11-05: "dass es nicht nur ein
    Floorplan ist"): the same number of words in both languages, each with its emoji and colour, all of them on the screen (landscape in
    at most two rows, upright three),
    and the last one is there a good second before the film goes on"""
    pytest.importorskip("PIL")
    import edit
    assert len(S.INTRO_CHIPS["de"]) == len(S.INTRO_CHIPS["en"]) == len(S.CHIP_COLOURS) == len(S.CHIP_ICONS) >= 5
    last = S.INTRO_CHIPS_AT + (len(S.CHIP_COLOURS) - 1) * S.BEAT / 2 + 0.4
    assert last <= S.SHOTS["intro"].seconds - 1.2, last
    for fmt, (W, H) in edit.SIZES.items():
        for lang in ("de", "en"):
            cut = edit.Cutter({}, lang, fmt)
            chips = cut.chip_layout(H * 0.55)
            assert len(chips) == len(S.INTRO_CHIPS[lang])
            assert len({round(y) for _, _, y, _ in chips}) <= (2 if fmt == "16x9" else 3), (fmt, lang)
            for im, x, y, _ in chips:
                assert 40 <= x and x + im.width <= W - 40 and y + im.height <= H * 0.85, (fmt, lang)


def test_a_frame_of_every_kind_is_drawn():
    pytest.importorskip("PIL")
    import edit
    for fmt, (W, H) in edit.SIZES.items():
        cut = edit.Cutter({}, "de", fmt)
        for t in (0.1, 1.0, 2.5):
            im = cut.frame(t)
            assert im.size == (W, H) and im.mode == "RGB"
        assert max(cut.frame(1.5).convert("L").getextrema()) > 200           # the title is there
    m = edit.house_mark(200)
    assert m.size == (200, 200) and m.getchannel("A").getextrema()[1] == 255


def test_the_music():
    np = pytest.importorskip("numpy")
    import music
    cues = [{"t0": 0, "t1": 3, "part": "intro", "hard": False, "id": "intro"},
            {"t0": 3, "t1": 7, "part": "live", "hard": False, "id": "light"},
            {"t0": 7, "t1": 9, "part": "live", "hard": True, "id": "sky-day"},
            {"t0": 9, "t1": 13, "part": "outro", "hard": False, "id": "outro"}]
    x = music.render(cues, 14.0)
    assert x.shape == (int(14.0 * music.SR), 2)
    assert np.abs(x).max() <= 0.9 and np.abs(x).max() > 0.5                   # loud, never clipping
    sr = music.SR
    rms = lambda a, b: float(np.sqrt((x[int(a * sr):int(b * sr)] ** 2).mean()))  # noqa: E731
    assert rms(4, 6) > rms(0.5, 2.5) * 1.5                                     # the drop is louder than the start
    assert rms(13.6, 14.0) < rms(4, 6) * 0.2                                   # it fades out with the film
    assert abs(rms(4, 6)) > 0 and not np.isnan(x).any()
    c = music.plan_cues()
    assert [k["id"] for k in c] == S.ORDER and c[-1]["t1"] == pytest.approx(sum(S.SHOTS[s].seconds for s in S.ORDER))


def test_the_import_shot_builds_the_show_house():
    """the shot "import": the add-on's own importer builds the show house of the import dialog, and the demo opens it as a new
    house without the entities it does not have (else the red "offline" pill)"""
    import json
    import re
    a = S.SHOTS["import"].answers()
    imp = a["api/import"]
    assert imp["ok"] and not imp["errors"] and imp["id"], imp
    assert imp["summary"]["floors"] >= 3 and imp["summary"]["devices"] > 100, imp["summary"]
    layout = a[f"api/layout?house={imp['id']}"]
    assert len(layout["floors"]) == imp["summary"]["floors"] and layout.get("plot")
    assert not re.search(r'"[a-z_]+\.[a-z0-9_]+"', json.dumps(layout))
