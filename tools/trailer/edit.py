"""Cuts the trailer (tools/make_trailer.py) from the filmed shots: every picture of the film (30 a second) is drawn here.

  - the shots follow each other on the beat of the music (their length in beats: tools/trailer/shots.py), a recording that is longer
    than its place runs faster (at most 2.4 times)
  - "cine": the 3D house full screen, a soft dark edge; "ui": the app in a floating window with round corners and a shadow, on a dark
    background with slowly moving colours; "phone": a phone beside the caption; the upright film (9x16) shows every shot as a card
  - the captions come up word by word, from below, and go before the next shot
  - from shot to shot a short zoom through (the old one grows and fades, the new one settles); short shots under one caption
    (keep=True, the sky of a day) are hard cuts with a little flash, on the beat
  - the title at the start (the house of the add-on's icon, drawn big) and the end with the address of the demo
The music (music.py) is made for exactly these cuts, ffmpeg puts both into one MP4 (H.264 + AAC: plays everywhere, also in
WhatsApp, Instagram, YouTube and on GitHub)."""
import math
import re
import subprocess
import sys
import tempfile
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "guide"))
sys.path.insert(0, str(ROOT / "tools"))

import shots as S  # noqa: E402
from compose import Film  # noqa: E402  (the video guide's pictures of a recording: the screen, the pointer, the clicks, the zooms)

FPS = 30
SIZES = {"16x9": (1920, 1080), "9x16": (1080, 1920)}
UP_CARD = (60, 470, 960, 1080)    # the upright film: where the card with the shot is (x, y, w, h), 8:9 (half the app's width)
UP_TITLE = 255                    # … and the middle of the caption above it
UP_APP = (24, 520, 1032, 580)     # an app shot upright: the whole app (16:9) …
UP_LENS = (84, 1150, 912, 560)    # … and under it a magnifier of the part where things happen
UP_LENS_PART = 0.44               # how much of the app's width the magnifier shows
UP_ALONE = (12, 1050, 1056)       # an app shot without a magnifier (up=False): the whole app, as wide as it goes, around this middle (x, y, w)
UP_FOOT = 1774                    # the top of the small name under everything
TR = 0.4                          # seconds of the zoom from one shot to the next (half before the cut, half after it)
MAX_SPEED = 2.4
ACCENT = (86, 168, 255)
SOFT = (176, 190, 214)
INK = (8, 11, 22)

FONT_DIRS = ["/usr/share/fonts/opentype/inter", "/usr/share/fonts/truetype/inter", "/usr/local/share/fonts", str(Path.home() / ".fonts")]
FONT_FILES = {"title": ["InterDisplay-Bold.otf", "Inter-Bold.otf", "Inter-Bold.ttf"],
              "semi": ["Inter-SemiBold.otf", "Inter-SemiBold.ttf", "Inter-Bold.otf"],
              "text": ["Inter-Medium.otf", "Inter-Medium.ttf", "Inter-Regular.otf"]}
FALLBACK = {"title": "DejaVuSans-Bold.ttf", "semi": "DejaVuSans-Bold.ttf", "text": "DejaVuSans.ttf"}


@lru_cache(maxsize=64)
def font(kind, size):
    for d in FONT_DIRS:
        for f in FONT_FILES[kind]:
            p = Path(d) / f
            if p.exists():
                return ImageFont.truetype(str(p), size)
    try:
        return ImageFont.truetype(FALLBACK[kind], size)
    except OSError:                                         # no DejaVu either: Pillow's own font
        return ImageFont.load_default(size)


def ease(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def ease_out(u):
    u = min(1.0, max(0.0, u))
    return 1 - (1 - u) ** 3


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


# ---------- the house of the icon (tools/make_addon_icons.py), drawn at any size ----------

def _mark_parts():
    src = (ROOT / "tools" / "make_addon_icons.py").read_text()
    mark = src[src.index('MARK = """'):]
    mark = mark[:mark.index('"""', 10)]
    parts = []
    for m in re.finditer(r'<polygon points="([^"]+)" fill="(#[0-9a-f]{6})"(?: opacity="([.\d]+)")?', mark):
        pts = [tuple(map(float, p.split(","))) for p in m.group(1).split()]
        rgb = tuple(int(m.group(2)[i:i + 2], 16) for i in (1, 3, 5))
        parts.append((pts, rgb, float(m.group(3) or 1)))
    return parts


@lru_cache(maxsize=4)
def house_mark(size):
    """the house of the add-on's icon as a picture size × size (with its blue glow), drawn 3 times bigger, then made smaller"""
    k = 3
    n = size * k
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    glow = Image.new("L", (n, n), 0)
    s = n / 512
    ImageDraw.Draw(glow).ellipse(((256 - 200) * s, (400 - 70) * s, (256 + 200) * s, (400 + 70) * s), fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(40 * s))
    im.paste(Image.new("RGBA", (n, n), (61, 155, 255, 255)), (0, 0), glow)
    for pts, rgb, a in _mark_parts():
        layer = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        ImageDraw.Draw(layer).polygon([(x * s, (y - 20) * s) for x, y in pts], fill=rgb + (round(255 * a),))
        im.alpha_composite(layer)
    d = ImageDraw.Draw(im)
    d.line([(136 * s, 270 * s), (256 * s, 330 * s), (376 * s, 270 * s)], fill=(255, 255, 255, 90), width=max(1, round(3 * s)))
    return im.resize((size, size), Image.LANCZOS)


# ---------- the background: dark, with slowly moving soft colours ----------

class Backdrop:
    BLOBS = [((52, 120, 255), 0.42, 0.55, (0.22, 0.30), (0.07, 0.05), 0.11),
             ((132, 84, 255), 0.30, 0.50, (0.80, 0.70), (0.06, 0.07), 0.09),
             ((24, 190, 210), 0.16, 0.42, (0.60, 0.15), (0.08, 0.04), 0.13)]

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.sw, self.sh = w // 4, h // 4
        base = Image.new("RGB", (self.sw, self.sh))
        top, bot = (13, 18, 36), (5, 7, 14)
        d = ImageDraw.Draw(base)
        for y in range(self.sh):
            u = y / (self.sh - 1)
            d.line([(0, y), (self.sw, y)], fill=tuple(round(top[i] + (bot[i] - top[i]) * u) for i in range(3)))
        self.base = base.convert("RGBA")
        self.blobs = []
        for rgb, a, r, *_ in self.BLOBS:
            n = round(max(self.sw, self.sh) * r * 2)
            m = Image.new("L", (n, n), 0)
            ImageDraw.Draw(m).ellipse((n * 0.2, n * 0.2, n * 0.8, n * 0.8), fill=round(255 * a))
            m = m.filter(ImageFilter.GaussianBlur(n * 0.14))
            b = Image.new("RGBA", (n, n), rgb + (0,))
            b.putalpha(m)
            self.blobs.append(b)

    def frame(self, t):
        im = self.base.copy()
        for b, (_, _, _, (cx, cy), (ax, ay), sp) in zip(self.blobs, self.BLOBS):
            x = (cx + ax * math.sin(t * sp * 2 * math.pi)) * self.sw - b.width / 2
            y = (cy + ay * math.cos(t * sp * 1.6 * math.pi)) * self.sh - b.height / 2
            im.alpha_composite(b, (round(x), round(y)))
        return im.convert("RGB").resize((self.w, self.h), Image.BICUBIC)


# ---------- a window, a card, a phone ----------

@lru_cache(maxsize=16)
def rounded_mask(w, h, r):
    k = 3
    m = Image.new("L", (w * k, h * k), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * k - 1, h * k - 1), r * k, fill=255)
    return m.resize((w, h), Image.LANCZOS)


@lru_cache(maxsize=16)
def shadow(w, h, r, blur=34, alpha=170, grow=6):
    pad = blur * 3
    im = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((pad - grow, pad - grow + blur // 2, pad + w + grow, pad + h + grow + blur // 2), r + grow, fill=(0, 0, 0, alpha))
    return im.filter(ImageFilter.GaussianBlur(blur)), pad


@lru_cache(maxsize=16)
def rim(w, h, r):
    """a thin light edge around a window (glass)"""
    k = 3
    im = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, w * k - 1, h * k - 1), r * k, outline=(255, 255, 255, 46), width=2 * k)
    return im.resize((w, h), Image.LANCZOS)


def put_window(out, img, box, r=20):
    """img in a window with round corners and a shadow at box (x, y, w, h) of out (RGB)"""
    x, y, w, h = box
    if img.size != (w, h):
        img = img.resize((w, h), Image.LANCZOS)
    sh, pad = shadow(w, h, r)
    o = out.convert("RGBA")
    o.alpha_composite(sh, (x - pad, y - pad))
    o.paste(img.convert("RGBA"), (x, y), rounded_mask(w, h, r))
    o.alpha_composite(rim(w, h, r), (x, y))
    return o.convert("RGB")


PH_PAD, PH_R = 16, 64


@lru_cache(maxsize=4)
def phone_body(sw, sh):
    """the phone around a screen sw × sh: its body (RGBA) and where the screen sits in it"""
    w, h = sw + 2 * PH_PAD + 6, sh + 2 * PH_PAD + 6
    k = 3
    im = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w * k - 1, h * k - 1), (PH_R + PH_PAD + 3) * k, fill=(96, 102, 118, 255))
    d.rounded_rectangle((3 * k, 3 * k, (w - 3) * k - 1, (h - 3) * k - 1), (PH_R + PH_PAD) * k, fill=(14, 15, 19, 255))
    return im.resize((w, h), Image.LANCZOS), (PH_PAD + 3, PH_PAD + 3)


def put_phone(out, film, s, cx, cy, sh):
    """the phone's recording at its second s, as a phone sh pixels high (screen), its middle at (cx, cy)"""
    scr = film.screen(s)
    sw = round(sh * film.vw / film.vh)
    body, (ox, oy) = phone_body(sw, sh)
    x, y = round(cx - body.width / 2), round(cy - body.height / 2)
    o = out.convert("RGBA")
    shd, pad = shadow(body.width, body.height, PH_R + PH_PAD, blur=40, alpha=190)
    o.alpha_composite(shd, (x - pad, y - pad))
    o.alpha_composite(body, (x, y))
    o.paste(scr.resize((sw, sh), Image.LANCZOS), (x + ox, y + oy), rounded_mask(sw, sh, PH_R))
    k = sw / film.vw
    for c in film.r["clicks"]:              # a finger: a soft white dot where it taps
        if c["t"] - 0.05 <= s < max(c["t1"], c["t"] + 0.3):
            px, py = film.pointer(s)
            fx, fy = x + ox + px * k, y + oy + py * k
            rr = 22 * k * 1.6
            dot = Image.new("RGBA", o.size, (0, 0, 0, 0))
            ImageDraw.Draw(dot).ellipse((fx - rr, fy - rr, fx + rr, fy + rr), fill=(255, 255, 255, 110), outline=(255, 255, 255, 210), width=3)
            o.alpha_composite(dot)
            break
    return o.convert("RGB")


# ---------- text ----------

@lru_cache(maxsize=512)
def word_img(text, kind, size, rgb, glow=False, track=0):
    """one word (or a line) as a picture with a soft shadow; returns (picture, how far its letters start in it)"""
    f = font(kind, size)
    if track:
        w = sum(f.getlength(ch) for ch in text) + track * max(0, len(text) - 1)
    else:
        w = f.getlength(text)
    asc, desc = f.getmetrics()
    pad = round(size * 0.5)
    im = Image.new("RGBA", (round(w) + 2 * pad, asc + desc + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    def draw(dd, fill, dx=0, dy=0):
        if track:
            x = pad + dx
            for ch in text:
                dd.text((x, pad + dy), ch, font=f, fill=fill)
                x += f.getlength(ch) + track
        else:
            dd.text((pad + dx, pad + dy), text, font=f, fill=fill)

    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw(ImageDraw.Draw(sh), (0, 0, 0, 200 if glow else 120), 0, round(size * 0.04))
    sh = sh.filter(ImageFilter.GaussianBlur(size * (0.16 if glow else 0.08)))
    im.alpha_composite(sh)
    draw(d, rgb + (255,))
    return im, pad


def faded(im, a):
    if a >= 0.999:
        return im
    im = im.copy()
    im.putalpha(im.getchannel("A").point(lambda v: round(v * a)))
    return im


def lonely(before, last, f):
    """the last line is one word, much shorter than the line before it (it looks left behind)"""
    return len(last) == 1 and len(before) > 2 and f.getlength(last[0]) < 0.4 * f.getlength(" ".join(before))


def wrap(words, kind, size, maxw):
    f = font(kind, size)
    space = f.getlength(" ")
    lines, cur, cw = [], [], 0
    for wd in words:
        if wd == "|":                     # a line break the text asks for (a clip's hook: "Mein ganzes Zuhause | in der Hosentasche")
            if cur:
                lines.append(cur)
            cur, cw = [], 0
            continue
        w = f.getlength(wd)
        if cur and cw + space + w > maxw:
            lines.append(cur)
            cur, cw = [], 0
        cw += (space if cur else 0) + w
        cur.append(wd)
    if cur:
        lines.append(cur)
    if len(lines) > 1 and lonely(lines[-2], lines[-1], f):          # no short word alone on the last line ("… in" / "Stimmung")
        moved = [lines[-2][-1]] + lines[-1]
        if f.getlength(" ".join(moved)) <= maxw:
            lines[-2], lines[-1] = lines[-2][:-1], moved
    return lines


class Caption:
    """the caption of a shot (or a group of short shots): a small word above, the title, a line under it"""

    def __init__(self, texts, t0, t1, style, size, top=UP_TITLE):
        self.kicker, self.title, self.sub = texts
        self.t0, self.t1, self.style = t0, t1, style
        self.W, self.H = size
        self.top = top                     # the upright film: the middle of the caption (y)

    def look(self):
        """font sizes, where the block is, how it is aligned"""
        W, H, st = self.W, self.H, self.style
        if st == "cine":
            big = 92 if len(self.title) < 30 else 76
            return dict(ks=26, ts=big, ss=36, x=118, maxw=W * 0.62, align="left", anchor=("bottom", H - 112), glow=True)
        if st == "ui":
            return dict(ks=24, ts=56, ss=28, x=W / 2, maxw=W - 300, align="center", anchor=("top", 44), glow=False)
        if st == "side":
            return dict(ks=26, ts=74, ss=34, x=150, maxw=820, align="left", anchor=("middle", H / 2), glow=False)
        if st == "hook":                  # the first words of a short clip (tools/make_clips.py): bigger, they must stop the thumb
            return dict(ks=30, ts=80, ss=38, x=W / 2, maxw=W - 150, align="center", anchor=("middle", self.top), glow=True)
        # the upright film: centred above the card
        return dict(ks=28, ts=70, ss=34, x=W / 2, maxw=W - 140, align="center", anchor=("middle", self.top), glow=False)

    def layout(self):
        L = self.look()
        rows = []                          # (kind, size, colour, words, gap before, track)
        if self.kicker:
            rows.append(("semi", L["ks"], ACCENT, [self.kicker.upper()], 0, round(L["ks"] * 0.16)))
        for ln in wrap(self.title.split(), "title", L["ts"], L["maxw"]):
            rows.append(("title", L["ts"], (255, 255, 255), ln, round(L["ts"] * 0.18) if rows else 0, 0))
        if self.sub:
            for ln in wrap(self.sub.split(), "text", L["ss"], L["maxw"]):
                rows.append(("text", L["ss"], SOFT, [" ".join(ln)], round(L["ss"] * 0.45), 0))
        heights = [font(k, s).getmetrics()[0] + font(k, s).getmetrics()[1] for k, s, *_ in rows]
        total = sum(heights) + sum(r[4] for r in rows)
        side, v = L["anchor"]
        y = v if side == "top" else v - total if side == "bottom" else v - total / 2
        out = []
        for (k, s, rgb, words, gap, track), hh in zip(rows, heights):
            y += gap
            out.append((k, s, rgb, words, y, track))
            y += hh
        return L, out

    def draw(self, img, t):
        if not (self.t0 <= t < self.t1) or not self.title and not self.kicker:
            return img
        L, rows = self.layout()
        o = img.convert("RGBA")
        out_u = ease((t - (self.t1 - 0.32)) / 0.32)          # going
        n = 0
        for i, (k, s, rgb, words, y, track) in enumerate(rows):
            f = font(k, s)
            space = f.getlength(" ")
            if track:
                widths = [sum(f.getlength(ch) for ch in words[0]) + track * (len(words[0]) - 1)]
            else:
                widths = [f.getlength(w) for w in words]
            linew = sum(widths) + space * (len(words) - 1)
            x = L["x"] - linew / 2 if L["align"] == "center" else L["x"]
            for w, ww in zip(words, widths):
                start = self.t0 + 0.1 + (0.0 if k == "semi" else 0.12) + 0.05 * n + (0.18 if k == "text" else 0)
                p = ease_out((t - start) / 0.5)
                a = p * (1 - out_u)
                if a > 0.01:
                    im, pad = word_img(w, k, s, rgb, L["glow"], track)
                    dy = (1 - p) * s * 0.45 - out_u * 10
                    dx = -(1 - p) * 30 if k == "semi" else 0
                    o.alpha_composite(faded(im, a), (round(x - pad + dx), round(y - pad + dy)))
                x += ww + space
                n += 1
            if k == "semi" and L["align"] == "left":           # a short line before the small word
                p = ease_out((t - self.t0 - 0.05) / 0.5) * (1 - out_u)
                if p > 0.01:
                    bar = Image.new("RGBA", (max(1, round(46 * p)), 4), ACCENT + (round(255 * p),))
                    o.alpha_composite(bar, (round(L["x"] - 64), round(y + s * 0.62)))
        return o.convert("RGB")


# ---------- the film ----------

class Item:
    def __init__(self, shot, t0, take):
        self.shot, self.t0, self.t1 = shot, t0, t0 + shot.seconds
        self.film = Film(take) if take else None
        self.src0, self.speed = 0.3, 1.0
        if self.film:
            have = self.film.end - 0.3 - 0.8                   # without the moment before the start and the last picture held
            self.speed = clamp(have / shot.seconds, min(1.0, shot.speed), MAX_SPEED)
            mark = next((st["t"] for st in take.get("steps", []) if st.get("de") == "@beat"), None)
            if mark is not None and shot.beat is not None:               # that moment exactly shot.beat seconds into the shot: on a beat
                self.src0 = max(0.0, mark - shot.beat * self.speed)
                self.speed = clamp((self.film.end - 0.8 - self.src0) / shot.seconds, min(1.0, shot.speed), MAX_SPEED)
                self.src0 = max(0.0, mark - shot.beat * self.speed)

    def src(self, t):
        """the second of the recording at t of the film"""
        return clamp(self.src0 + (t - self.t0) * self.speed, 0, self.film.end - 0.05)

    def view(self, t):
        """(x, y, zoom) of the screen the film shows at t: the shot's keyframes (shots.Shot.focus), softly from one to the next"""
        f = self.shot.focus
        if not f:
            keys = [(0, 0.5, 0.5, 1.0)]                 # the whole app, standing still (the owner: the slow push in "sieht nicht so geil aus")
        elif len(f) == 2 and not isinstance(f[0], (tuple, list)):
            keys = [(0, f[0], f[1], 1.25)]
        else:
            keys = sorted(f)
        u = (t - self.t0) / max(1e-6, self.t1 - self.t0)
        if u <= keys[0][0]:
            return keys[0][1:]
        for a, b in zip(keys, keys[1:]):
            if u < b[0]:
                e = ease((u - a[0]) / max(1e-6, b[0] - a[0]))
                return tuple(a[i] + (b[i] - a[i]) * e for i in (1, 2, 3))
        return keys[-1][1:]


def lens_spot(film, s):
    """where the magnifier of an upright app shot looks at second s of the recording (0…1 of the screen): where the pointer is, a little
    ahead and behind averaged so it glides; the middle while there is no pointer"""
    if any(a <= s < b for a, b in film.r["hidden"]) or not film.r["moves"]:
        return 0.5, 0.5
    pts = [film.pointer(min(film.end, max(0.0, s + d))) for d in (-0.6, -0.3, 0, 0.3, 0.6)]
    x = sum(p[0] for p in pts) / len(pts) / film.vw
    y = sum(p[1] for p in pts) / len(pts) / film.vh
    return clamp(x, 0, 1), clamp(y, 0, 1)


def crop(src, fx, fy, z, aspect=None):
    """the part of src around (fx, fy) (0…1) that a zoom z shows (aspect: width / height of the part, else the picture's)"""
    w, h = src.size
    ch = h / max(1.0, z)
    cw = ch * (aspect or w / h)
    if cw > w:
        cw, ch = w, w / (aspect or w / h)
    x0 = clamp(fx * w - cw / 2, 0, w - cw)
    y0 = clamp(fy * h - ch / 2, 0, h - ch)
    return (x0, y0, x0 + cw, y0 + ch)


def plan(takes, order=None):
    """the shots that are there, one after the other on the beats; and the captions over them
    (order: ids of shots.SHOTS or Shot objects, default the trailer's shots.ORDER)"""
    items, t = [], 0.0
    for sh in order or S.ORDER:
        sh = S.SHOTS[sh] if isinstance(sh, str) else sh
        take = takes.get(sh.id)
        if sh.kind != "card" and take is None:
            continue
        items.append(Item(sh, t, take))
        t = items[-1].t1
    return items, t


class Cutter:
    # the upright film: where everything is (a short clip, tools/make_clips.py, keeps out of the places TikTok covers)
    UP = {"card": UP_CARD, "title": UP_TITLE, "app": UP_APP, "lens": UP_LENS, "alone": UP_ALONE, "foot": UP_FOOT, "phone": 1240}
    FADE_IN, FADE_OUT, TAIL = 0.35, 1.2, 1.6                 # seconds: from black, to black, the last picture held while the music ends

    def __init__(self, takes, lang, fmt, order=None):
        self.lang, self.fmt = lang, fmt
        self.W, self.H = SIZES[fmt]
        self.items, self.total = plan(takes, order)
        self.end = self.total + self.TAIL
        self.bg = Backdrop(self.W, self.H)
        self.vignette = self._vignette()
        self.caps = []
        for i, it in enumerate(self.items):
            sh = it.shot
            if sh.keep and self.caps:
                self.caps[-1].t1 = it.t1
                continue
            if sh.caption and sh.id != "outro":
                style = sh.kind if fmt == "16x9" else "upright"
                style = "side" if style == "phone" else style
                self.caps.append(Caption(sh.caption[lang], it.t0, it.t1, style, (self.W, self.H), self.UP["title"]))
        self.flashes = [it.t0 for it in self.items if it.shot.keep]

    def _vignette(self):
        W, H = self.W, self.H
        sw, sh = W // 4, H // 4
        m = Image.new("L", (sw, sh), 0)
        d = ImageDraw.Draw(m)
        for i in range(40):                                 # darker edges
            u = i / 40
            d.rounded_rectangle((-sw * 0.1 + u * sw * 0.2, -sh * 0.1 + u * sh * 0.2, sw * 1.1 - u * sw * 0.2, sh * 1.1 - u * sh * 0.2),
                                radius=sw * 0.2, outline=round(110 * (1 - u) ** 2), width=3)
        g = Image.new("L", (sw, sh), 0)                      # the bottom left darker for the caption
        ImageDraw.Draw(g).ellipse((-sw * 0.45, sh * 0.42, sw * 0.75, sh * 1.5), fill=150)
        g = g.filter(ImageFilter.GaussianBlur(sw * 0.08))
        m = ImageChops.lighter(m, g)
        m = m.filter(ImageFilter.GaussianBlur(4)).resize((W, H), Image.BICUBIC)
        v = Image.new("RGBA", (W, H), INK + (0,))
        v.putalpha(m)
        return v

    # one shot at t, without captions
    def shot_frame(self, it, t):
        W, H = self.W, self.H
        sh = it.shot
        if sh.kind == "card":
            return self.intro(t - it.t0)
        s = it.src(t)
        if self.fmt == "16x9":
            if sh.kind == "cine":
                im = it.film.frame(s, cursor=False).convert("RGBA")
                im.alpha_composite(self.vignette)
                im = im.convert("RGB")
                return self.outro(im, t - it.t0, it.t1 - it.t0) if sh.id == "outro" else im
            out = self.bg.frame(t)
            if sh.kind == "phone":
                return put_phone(out, it.film, s, W * 0.70, H / 2, 940)
            ww, wh = 1440, 810
            fx, fy, z = it.view(t)
            src = it.film.frame(s)
            img = src.resize((ww, wh), Image.LANCZOS, box=crop(src, fx, fy, z))
            return put_window(out, img, ((W - ww) // 2, H - wh - 42, ww, wh), r=20)
        # the upright film: every shot a card under the caption
        out = self.bg.frame(t)
        card_box = self.UP["card"]
        if sh.kind == "phone":
            return self.footer(put_phone(out, it.film, s, W / 2, card_box[1] + card_box[3] / 2, self.UP["phone"]))
        src = it.film.frame(s, cursor=sh.kind != "cine")
        fx, fy, z = it.view(t)
        if sh.up:
            fx, fy = sh.up
        if sh.kind == "ui" and sh.up is False:              # only the whole app, big (the owner: a magnifier of these pages shows nothing you can read)
            x, my, w = self.UP["alone"]
            h = round(w * src.height / src.width)
            out = put_window(out, src.resize((w, h), Image.LANCZOS), (x, my - h // 2, w, h), r=22)
        elif sh.kind == "ui":                                # the whole app, and under it a magnifier where things happen (the owner: not cut off)
            if not sh.up:
                fx, fy = lens_spot(it.film, s)
            out = self.upright_ui(out, src, fx, fy)
        else:
            cw, chh = card_box[2], card_box[3]
            card = src.resize((cw, chh), Image.LANCZOS, box=crop(src, fx, fy, max(1.0, z * 0.8), aspect=cw / chh))
            out = put_window(out, card, card_box, r=30)
        out = self.footer(out)
        return self.outro(out, t - it.t0, it.t1 - it.t0) if sh.id == "outro" else out

    def frame(self, t):
        items = self.items
        i = max(0, min(len(items) - 1, next((k for k, it in enumerate(items) if t < it.t1), len(items) - 1)))
        it = items[i]
        img = None
        for k in (i, i + 1):                                 # near a cut: the zoom through
            if 0 < k < len(items) and not items[k].shot.keep:
                b = items[k].t0
                if abs(t - b) < TR / 2:
                    p = ease((t - (b - TR / 2)) / TR)
                    a = zoomed(self.shot_frame(items[k - 1], t), 1 + 0.07 * p)
                    bb = zoomed(self.shot_frame(items[k], t), 1.07 - 0.07 * p)
                    img = Image.blend(a, bb, p)
                    break
        if img is None:
            img = self.shot_frame(it, t)
        for f in self.flashes:                               # a little flash on a hard cut
            if 0 <= t - f < 0.2:
                img = Image.blend(img, Image.new("RGB", img.size, (255, 255, 255)), 0.22 * (1 - (t - f) / 0.2))
        for c in self.caps:
            img = c.draw(img, t)
        if t < self.FADE_IN:
            img = Image.blend(Image.new("RGB", img.size), img, ease(t / self.FADE_IN))
        if self.FADE_OUT and t > self.end - self.FADE_OUT:
            img = Image.blend(img, Image.new("RGB", img.size), ease((t - (self.end - self.FADE_OUT)) / self.FADE_OUT))
        return img

    def upright_ui(self, out, src, fx, fy):
        """the upright film, an app shot: the whole app on top, a magnifier (twice as big) of the part around (fx, fy) under it, and a thin
        frame in the app around that part"""
        x, y, w, h = self.UP["app"]
        app = src.resize((w, h), Image.LANCZOS)
        mx, my, mw, mh = self.UP["lens"]
        bw = src.width * UP_LENS_PART
        box = crop(src, fx, fy, src.height / (bw * mh / mw), aspect=mw / mh)
        lens = src.resize((mw, mh), Image.LANCZOS, box=box)
        k = w / src.width                                     # the frame of the magnified part, drawn on the app
        a = app.convert("RGBA")
        ov = Image.new("RGBA", (w * 2, h * 2), (0, 0, 0, 0))
        ImageDraw.Draw(ov).rounded_rectangle((box[0] * k * 2, box[1] * k * 2, box[2] * k * 2, box[3] * k * 2), 12, outline=ACCENT + (255,), width=6)
        a.alpha_composite(ov.resize((w, h), Image.LANCZOS))
        out = put_window(out, a.convert("RGB"), self.UP["app"], r=22)
        return put_window(out, lens, self.UP["lens"], r=26)

    def footer(self, img):
        """the upright film: the house and the name small under the card (UP["foot"] None: not there)"""
        if self.UP["foot"] is None:
            return img
        o = img.convert("RGBA")
        m = house_mark(64)
        im, pad = word_img("3D Floorplan · Home Assistant", "semi", 30, SOFT, False)
        x = (self.W - (64 + 12 + im.width - 2 * pad)) / 2
        y = self.UP["foot"]
        o.alpha_composite(m, (round(x), round(y)))
        o.alpha_composite(im, (round(x + 76 - pad), round(y + 32 - im.height / 2)))
        return o.convert("RGB")

    # ---------- the start and the end ----------

    def intro(self, u):
        W, H = self.W, self.H
        out = self.bg.frame(u).convert("RGBA")
        size = round(min(W, H) * (0.36 if self.fmt == "16x9" else 0.5))
        p = ease_out(u / 0.9)
        m = house_mark(size)
        sc = 0.82 + 0.18 * p
        mm = m.resize((round(size * sc), round(size * sc)), Image.LANCZOS)
        cy = H * (0.40 if self.fmt == "16x9" else 0.42)
        out.alpha_composite(faded(mm, p), (round(W / 2 - mm.width / 2), round(cy - mm.height / 2 - 30 * (1 - p))))
        title = "3D Floorplan"
        ts = 120 if self.fmt == "16x9" else 110
        q = ease_out((u - 0.45) / 0.6)
        if q > 0.01:
            im, pad = word_img(title, "title", ts, (255, 255, 255), True)
            out.alpha_composite(faded(im, q), (round(W / 2 - im.width / 2), round(cy + size * 0.42 - pad + 30 * (1 - q))))
        sub = "für Home Assistant" if self.lang == "de" else "for Home Assistant"
        q2 = ease_out((u - 0.85) / 0.6)
        if q2 > 0.01:
            im, pad = word_img(sub.upper(), "semi", 34, ACCENT, True, track=8)
            out.alpha_composite(faded(im, q2), (round(W / 2 - im.width / 2), round(cy + size * 0.42 + ts * 1.25 - pad + 20 * (1 - q2))))
        return out.convert("RGB")

    def outro(self, img, u, length):
        W, H = self.W, self.H
        q = ease((u - 0.2) / 1.2)                            # the house goes soft and dark behind the name
        if q > 0.01:
            small = img.resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(1 + 5 * q))
            img = Image.blend(img, small.resize((W, H), Image.BICUBIC), min(1.0, q * 1.4))
        out = Image.blend(img, Image.new("RGB", img.size, INK), q * 0.7).convert("RGBA")
        big = self.fmt == "16x9"
        size = round(H * 0.24) if big else round(W * 0.34)
        cy = H * (0.30 if big else 0.30)
        p = ease_out((u - 0.5) / 0.8)
        if p > 0.01:
            m = house_mark(size)
            out.alpha_composite(faded(m, p), (round(W / 2 - size / 2), round(cy - size / 2 + 24 * (1 - p))))
        rows = [("3D Floorplan", "title", 112 if big else 104, (255, 255, 255), 0.75, 0, size * 0.52),
                (("für Home Assistant" if self.lang == "de" else "for Home Assistant").upper(), "semi", 32, ACCENT, 1.0, 8, size * 0.52 + 150),
                ("Kostenlos · Open Source · Live-Demo im Browser" if self.lang == "de" else "Free · Open source · Live demo in your browser",
                 "text", 34 if big else 36, SOFT, 1.35, 0, size * 0.52 + 222)]
        for text, kind, s, rgb, start, track, dy in rows:
            q = ease_out((u - start) / 0.6)
            if q > 0.01:
                if kind == "text" and not big and len(text) > 30:
                    s = 32
                im, pad = word_img(text, kind, s, rgb, True, track)
                out.alpha_composite(faded(im, q), (round(W / 2 - im.width / 2), round(cy + dy - pad + 20 * (1 - q))))
        q = ease_out((u - 1.8) / 0.6)                       # the address of the demo on a light pill
        if q > 0.01:
            url = S.DEMO_URL
            f = font("semi", 38 if big else 34)
            tw = f.getlength(url)
            pw, ph = round(tw + 84), 76
            pill = Image.new("RGBA", (pw * 3, ph * 3), (0, 0, 0, 0))
            ImageDraw.Draw(pill).rounded_rectangle((0, 0, pw * 3 - 1, ph * 3 - 1), ph * 3 // 2, fill=ACCENT + (255,))
            pill = pill.resize((pw, ph), Image.LANCZOS)
            ImageDraw.Draw(pill).text((pw / 2, ph / 2), url, font=f, fill=INK + (255,), anchor="mm")
            y = cy + size * 0.52 + 300
            out.alpha_composite(faded(pill, q), (round(W / 2 - pw / 2), round(y + 20 * (1 - q))))
        return out.convert("RGB")


def zoomed(img, s):
    """img s times bigger (s > 1) or smaller (s < 1), around its middle, same size"""
    if abs(s - 1) < 1e-3:
        return img
    w, h = img.size
    if s > 1:
        cw, ch = w / s, h / s
        return img.resize((w, h), Image.BICUBIC, box=((w - cw) / 2, (h - ch) / 2, (w + cw) / 2, (h + ch) / 2))
    small = img.resize((round(w * s), round(h * s)), Image.BICUBIC)
    out = Image.new("RGB", (w, h), INK)
    out.paste(small, ((w - small.width) // 2, (h - small.height) // 2))
    return out


def cues(items):
    """what the music needs to know: where every shot begins, its part and if it is a hard cut"""
    return [{"t0": it.t0, "t1": it.t1, "part": it.shot.part, "hard": bool(it.shot.keep), "id": it.shot.id,
             "accent": it.t0 + it.shot.beat if it.shot.beat is not None and it.film else None} for it in items]


def make(takes, lang, fmt, mp4, music=True, poster_at=None, cut=None, crf=19):
    """write the film; returns its length and the picture for a link (a moment of the first shot with its caption)
    (cut: another Cutter, e.g. a short clip's, clipcut.py; crf: the quality, higher is a smaller file)"""
    import music as M
    cut = cut or Cutter(takes, lang, fmt)
    n = int(cut.end * FPS)
    mp4 = Path(mp4)
    with tempfile.TemporaryDirectory() as tmp:
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{cut.W}x{cut.H}", "-r", str(FPS), "-i", "-"]
        if music:
            wav = Path(tmp) / "music.wav"
            M.write(cues(cut.items), cut.end, wav)
            cmd += ["-i", str(wav), "-c:a", "aac", "-b:a", "192k"]
        cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
                "-g", str(FPS * 2), "-shortest", str(mp4)]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        try:
            for i in range(n):
                p.stdin.write(cut.frame(i / FPS).tobytes())
        finally:
            p.stdin.close()
        if p.wait():
            raise RuntimeError("ffmpeg failed")
    hero = next((it for it in cut.items if it.shot.id == "hero"), cut.items[0])
    t = poster_at if poster_at is not None else hero.t0 + min(2.6, hero.shot.seconds * 0.6)
    poster = mp4.with_suffix(".jpg")
    cut.frame(t).save(poster, quality=88, optimize=True, progressive=True)
    return {"seconds": cut.end, "poster": poster}
