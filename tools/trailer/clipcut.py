"""Cuts one short clip (clips.py, tools/make_clips.py) with the trailer's cutter (edit.py): the same backdrop, cards, captions, zooms and
music, only

  - upright (9:16) and out of the places TikTok, Reels and Shorts cover with their own things: the top (the tabs, about 150 px), the
    bottom (the name, the text and the music, about the last 420 px) and the buttons on the right; so the caption sits a little lower,
    the card and the magnifier end at about 1500 px and there is no small name at the foot
  - the hook (clips.CLIPS[...]["hook"]) at once and big over the first shot, no fade from black (the first picture already counts)
  - at the end the name, "Kostenlos · Open Source", a button "Demo: Link im Profil" and the address of the demo, and only a short
    fade, because the apps play a clip again and again
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import clips as C  # noqa: E402
import edit  # noqa: E402
import shots as S  # noqa: E402
from edit import ACCENT, INK, SOFT, Image, ImageDraw, ease_out, faded, font, house_mark, word_img  # noqa: E402

SAFE_TOP, SAFE_BOTTOM = 150, 1500            # what the apps leave free (y, of 1920)
HOOK_LEAD = 0.35                             # seconds the hook's words are already on their way at the first picture


class ClipCutter(edit.Cutter):
    UP = {"card": (90, 520, 900, 980), "title": 300, "app": (24, 500, 1032, 580), "lens": (84, 1104, 912, 396),
          "alone": (12, 1000, 1056), "foot": None, "phone": 920}
    FADE_IN, FADE_OUT, TAIL = 0.0, 0.4, 0.5

    def __init__(self, takes, clip, lang):
        self.clip = clip
        super().__init__(takes, lang, "9x16", order=C.order(clip))
        first = self.items[0]
        t1 = self.caps[0].t1 if self.caps and self.caps[0].t0 == first.t0 else first.t1
        # the hook starts a little before the clip: in its first picture the first words are already coming up
        hook = edit.Caption(clip["hook"][lang], first.t0 - HOOK_LEAD, t1, "hook", (self.W, self.H), self.UP["title"])
        if self.caps and self.caps[0].t0 == first.t0:
            self.caps[0] = hook                                  # the hook instead of the first shot's caption
        else:
            self.caps.insert(0, hook)

    def shot_frame(self, it, t):
        if it.shot is C.END:
            return self.end_card(t - it.t0, t)
        return super().shot_frame(it, t)

    def end_card(self, u, t):
        """the end: the house of the icon, the name, the line, the button and the address, one after the other"""
        W = self.W
        out = self.bg.frame(t).convert("RGBA")
        txt = C.END_TEXT[self.lang]
        size, cy = 300, 650
        p = ease_out(u / 0.6)
        if p > 0.01:
            out.alpha_composite(faded(house_mark(size), p), (round(W / 2 - size / 2), round(cy - size / 2 + 24 * (1 - p))))
        top = cy + size * 0.52
        rows = [("3D Floorplan", "title", 104, (255, 255, 255), 0.2, 0, 0),
                (("für Home Assistant" if self.lang == "de" else "for Home Assistant").upper(), "semi", 32, ACCENT, 0.35, 8, 150),
                (txt["line"], "text", 38, SOFT, 0.5, 0, 214)]
        for text, kind, s, rgb, start, track, dy in rows:
            q = ease_out((u - start) / 0.5)
            if q > 0.01:
                im, pad = word_img(text, kind, s, rgb, True, track)
                out.alpha_composite(faded(im, q), (round(W / 2 - im.width / 2), round(top + dy - pad + 20 * (1 - q))))
        q = ease_out((u - 0.75) / 0.5)                           # the button
        if q > 0.01:
            f = font("semi", 46)
            label = txt["pill"]
            pw, ph = round(f.getlength(label) + 96), 92
            pill = Image.new("RGBA", (pw * 3, ph * 3), (0, 0, 0, 0))
            ImageDraw.Draw(pill).rounded_rectangle((0, 0, pw * 3 - 1, ph * 3 - 1), ph * 3 // 2, fill=ACCENT + (255,))
            pill = pill.resize((pw, ph), Image.LANCZOS)
            ImageDraw.Draw(pill).text((pw / 2, ph / 2), label, font=f, fill=INK + (255,), anchor="mm")
            sc = 0.9 + 0.1 * q
            pill = pill.resize((round(pw * sc), round(ph * sc)), Image.LANCZOS)
            out.alpha_composite(faded(pill, q), (round(W / 2 - pill.width / 2), round(top + 300 + (ph - pill.height) / 2 + 16 * (1 - q))))
        q = ease_out((u - 0.95) / 0.5)                           # the address under it
        if q > 0.01:
            im, pad = word_img(S.DEMO_URL, "text", 32, SOFT, True)
            out.alpha_composite(faded(im, q), (round(W / 2 - im.width / 2), round(top + 420 - pad)))
        return out.convert("RGB")


def make(takes, clip, lang, mp4, music=True):
    """write one clip (and its picture, the hook over the first shot); returns its length"""
    cut = ClipCutter(takes, clip, lang)
    return edit.make(takes, lang, "9x16", mp4, music=music, poster_at=1.8, cut=cut, crf=22)
