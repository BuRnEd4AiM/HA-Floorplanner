"""📱 The short clips for TikTok, Reels and Shorts (tools/make_clips.py, tools/trailer/clips.py, clipcut.py): every clip is complete in
both languages, uses shots of the trailer, is 14 to 22 seconds long with its parts on full bars, its words fit on the screen and stay
out of what TikTok covers, the end is drawn, and the workflow "Trailer" makes them and its page shows them."""
import json
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "tools" / "guide"))
sys.path.insert(0, str(ROOT / "tools" / "trailer"))

import clips as C  # noqa: E402
import shots as S  # noqa: E402

LANGS = ("de", "en")


def test_every_clip_is_complete():
    assert len(C.BY_ID) == len(C.CLIPS) >= 8
    seen = set()
    for c in C.CLIPS:
        cid = c["id"]
        assert re.fullmatch(r"[a-z][a-z0-9-]*", cid), cid
        assert set(C.shot_ids(c)) <= set(S.SHOTS), cid
        first = S.SHOTS[C.shot_ids(c)[0]]
        assert first.kind != "card" and not first.keep and first.caption, cid           # the hook takes the place of its caption
        assert all(S.SHOTS[s].kind != "card" and s != "outro" for s in C.shot_ids(c)), cid
        for i, s in enumerate(C.shot_ids(c)):
            if S.SHOTS[s].keep:                                                          # a short shot under the caption before
                assert i and (S.SHOTS[C.shot_ids(c)[i - 1]].caption or S.SHOTS[C.shot_ids(c)[i - 1]].keep), (cid, s)
        assert 14 <= C.seconds(c) <= 22, (cid, C.seconds(c))
        for lang in LANGS:
            kicker, title, sub = c["hook"][lang]
            assert title and len(title) <= 48 and len(sub) <= 56 and len(kicker) <= 16, (cid, lang)
            assert 60 <= len(c["text"][lang]) <= 300, (cid, lang)
            assert ("Link im Profil" if lang == "de" else "link in bio") in c["text"][lang], (cid, lang)
            tags = c["tags"][lang]
            assert 3 <= len(tags) <= 5 and "homeassistant" in tags and len(set(tags)) == len(tags), (cid, lang)
            assert all(re.fullmatch(r"[a-z0-9]+", t) for t in tags), (cid, lang)
            assert C.post_text(c, lang).endswith(C.hashtags(c, lang)) and len(C.post_text(c, lang)) <= 2200
            assert "  " not in C.hook_line(c, lang) and "… …" not in C.hook_line(c, lang)
        week, day = c["when"]
        assert 1 <= week <= 4 and day in (0, 1, 2) and (week, day) not in seen, cid
        seen.add((week, day))
    assert C.order(C.CLIPS[0])[-1] is C.END and C.END.id == "outro" and C.END.kind == "card"


def test_a_shot_with_another_length_is_a_copy():
    c = C.BY_ID["haus"]
    hero = C.order(c)[0]
    assert hero.id == "hero" and hero.beats == 12 and S.SHOTS["hero"].beats == 14     # the trailer keeps its own length


def test_the_parts_begin_on_a_full_bar():
    """as in the trailer: the music changes with the part, that must be on the first beat of a bar"""
    for c in C.CLIPS:
        beats, last = 0, None
        for sh in C.order(c):
            assert sh.beats % 2 == 0, (c["id"], sh.id)
            if last is not None and sh.part != last:
                assert beats % 4 == 0, f"{c['id']}: {sh.id} starts the part {sh.part} on beat {beats}, not on a bar"
            last = sh.part
            beats += sh.beats


def test_the_texts_for_the_plan():
    md = C.texts_markdown("de")
    for c in C.CLIPS:
        assert C.post_text(c, "de") in md and C.when(c) in md
    assert "Woche 1, Dienstag" in md and "Week 1, Tuesday" in C.texts_markdown("en")
    m = C.meta(C.CLIPS[0])
    assert set(m) == {"id", "week", "day", "seconds", "hook", "text"} and set(m["text"]) == set(LANGS)
    json.dumps([C.meta(c) for c in C.CLIPS])


def test_the_words_fit_and_stay_out_of_what_tiktok_covers():
    pytest.importorskip("PIL")
    import clipcut
    import edit
    U = clipcut.ClipCutter.UP
    W, H = edit.SIZES["9x16"]
    top_of_card = min(U["card"][1], U["app"][1])
    for c in C.CLIPS:
        for lang in LANGS:
            caps = [("hook", c["hook"][lang])] + [("upright", S.SHOTS[s].caption[lang]) for s in C.shot_ids(c)[1:] if S.SHOTS[s].caption]
            for style, texts in caps:
                cap = edit.Caption(texts, 0, 4, style, (W, H), U["title"])
                L, rows = cap.layout()
                assert len([r for r in rows if r[0] == "title"]) <= 2, (c["id"], lang, texts)
                for kind in ("title", "text"):                                           # no short word alone on the last line
                    lines = [" ".join(r[3]).split() for r in rows if r[0] == kind]
                    size = next((r[1] for r in rows if r[0] == kind), 40)
                    if len(lines) > 1:
                        assert not edit.lonely(lines[-2], lines[-1], edit.font(kind, size)), (c["id"], lang, kind, lines[-1])
                for kind, size, _, words, y, track in rows:
                    f = edit.font(kind, size)
                    w = sum(f.getlength(x) for x in words) + f.getlength(" ") * (len(words) - 1)
                    assert w <= L["maxw"] + 2 or len(words) == 1, (c["id"], lang, words)
                    assert y >= clipcut.SAFE_TOP - 30, (c["id"], lang, texts, y)            # (y is the top of the line's box)
                    assert y + size * 1.25 <= top_of_card - 4, (c["id"], lang, texts, y)
    for name in ("card", "app", "lens"):
        x, y, w, h = U[name]
        assert 0 <= x and x + w <= W and clipcut.SAFE_TOP <= y and y + h <= clipcut.SAFE_BOTTOM, name
    x, my, w = U["alone"]
    h = w * 9 / 16
    assert my - h / 2 >= clipcut.SAFE_TOP and my + h / 2 <= clipcut.SAFE_BOTTOM
    cy = U["card"][1] + U["card"][3] / 2
    assert cy - U["phone"] / 2 - 22 >= clipcut.SAFE_TOP and cy + U["phone"] / 2 + 22 <= clipcut.SAFE_BOTTOM   # the body of the phone around it
    assert U["foot"] is None and clipcut.ClipCutter.FADE_IN == 0                       # the first picture already counts


def test_a_clip_and_its_end_are_drawn():
    pytest.importorskip("PIL")
    import clipcut
    import edit
    for lang in LANGS:
        cut = clipcut.ClipCutter({}, C.BY_ID["licht"], lang)                           # nothing filmed: only the end, with the hook
        assert [it.shot.id for it in cut.items] == ["outro"] and cut.caps[0].style == "hook"
        for t in (0.05, 1.0, 2.0, 3.9, cut.end - 0.01):
            im = cut.frame(t)
            assert im.size == (1080, 1920) and im.mode == "RGB"
        im = cut.frame(3.0)
        assert max(im.convert("L").getextrema()) > 200                                 # the name and the button are there
        band = im.crop((0, 1800, 1080, 1920)).convert("L")
        assert band.getextrema()[1] < 120                                              # nothing at the foot (TikTok's text goes there)
        f = edit.font("semi", 46)
        assert f.getlength(C.END_TEXT[lang]["pill"]) + 96 <= 1080 - 160


def test_the_workflow_and_the_page():
    wf = (ROOT / ".github" / "workflows" / "trailer.yml").read_text()
    assert "tools/make_clips.py" in wf and "--out trailer-out/clips" in wf
    page = (ROOT / "tools" / "trailer" / "page.html").read_text()
    assert "clips/clips.json" in page and "navigator.clipboard" in page
