"""Makes the MP4 of a clip from what tools/guide/recorder.py logged: the screen pictures, the moves and clicks of the
pointer, the zooms. Every picture of the video (30 a second) is drawn here: the screen at that moment, the pointer on a
smooth curve, a ring where it clicked; ffmpeg turns them into H.264 (plays in every browser, also on phones and TVs)."""
import bisect
import subprocess
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from recorder import FPS, H, W, curve, ease

SS = 4                                   # draw small things 4 times bigger, then shrink: smooth edges
ACCENT = (64, 156, 255)                  # the ring of a click (blue), a right click is orange
ACCENT_R = (255, 159, 64)
RING_S = 0.55                            # how long the ring of a click grows (seconds of the video)


def ffmpeg():
    return "ffmpeg"


# ---------- the pointer, the finger, the ring ----------

@lru_cache(maxsize=8)
def arrow(scale, pressed=False):
    """the mouse pointer (white with a dark edge and a soft shadow); returns the picture and where its tip is in it"""
    pts = [(0, 0), (0, 17.5), (4.3, 13.6), (7.2, 20.4), (10.3, 19.1), (7.5, 12.4), (13, 12.2)]
    k = scale * (0.86 if pressed else 1.0)
    pad = 8
    size = (int((14 + pad * 2) * k * SS), int((22 + pad * 2) * k * SS))
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    poly = [((x + pad) * k * SS, (y + pad) * k * SS) for x, y in pts]
    sh = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).polygon([(x + 1.2 * k * SS, y + 2.0 * k * SS) for x, y in poly], fill=(0, 0, 0, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(1.6 * k * SS))
    im.alpha_composite(sh)
    d = ImageDraw.Draw(im)
    d.polygon(poly, fill=(255, 255, 255, 255), outline=(20, 22, 28, 255), width=max(1, int(1.25 * k * SS)))
    im = im.resize((size[0] // SS, size[1] // SS), Image.LANCZOS)
    return im, (pad * k, pad * k)


@lru_cache(maxsize=8)
def finger(scale):
    """a finger on a touch screen: a soft grey dot"""
    r = 21 * scale
    n = int((r * 2 + 8) * SS)
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = n / 2
    d.ellipse((c - r * SS, c - r * SS, c + r * SS, c + r * SS), fill=(255, 255, 255, 105), outline=(255, 255, 255, 200), width=int(2 * scale * SS))
    im = im.resize((n // SS, n // SS), Image.LANCZOS)
    return im, (n / SS / 2, n / SS / 2)


@lru_cache(maxsize=64)
def ring(scale, step, right=False):
    """the ring of a click at step 0..15 of its growing"""
    u = step / 15
    e = ease(u * 1.15)
    r = (7 + 30 * e) * scale
    a = (1 - u) ** 1.4
    n = int((37 * scale * 2 + 8) * SS)
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = n / 2
    col = ACCENT_R if right else ACCENT
    d.ellipse((c - r * SS, c - r * SS, c + r * SS, c + r * SS), fill=col + (int(70 * a),), outline=col + (int(235 * a),), width=int(3.2 * scale * SS))
    im = im.resize((n // SS, n // SS), Image.LANCZOS)
    return im, (n / SS / 2, n / SS / 2)


@lru_cache(maxsize=8)
def ff_badge(times):
    """the sign of fast forward: two triangles and "8×" on a dark pill"""
    from PIL import ImageFont
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 30 * SS)
    except OSError:
        font = ImageFont.load_default(30 * SS)
    text = f"{times:g}×"
    tw = int(ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=font))
    w, h = 74 * SS + tw, 56 * SS
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=(10, 13, 20, 200), outline=(255, 255, 255, 60), width=SS)
    x, cy = 20 * SS, h // 2
    for k in range(2):
        d.polygon([(x + k * 17 * SS, cy - 11 * SS), (x + k * 17 * SS + 17 * SS, cy), (x + k * 17 * SS, cy + 11 * SS)], fill=(255, 255, 255, 255))
    d.text((62 * SS, cy), text, font=font, fill=(255, 255, 255, 255), anchor="lm")
    return im.resize((w // SS, h // SS), Image.LANCZOS)


# ---------- the phone ----------

PH_SCREEN_H = 940


@lru_cache(maxsize=2)
def phone_parts(vw, vh):
    """the background, the phone around the screen, the mask of the screen's round corners, where the screen sits"""
    sh = PH_SCREEN_H
    sw = round(sh * vw / vh)
    sx, sy = (W - sw) // 2, (H - sh) // 2
    bg = Image.new("RGB", (W, H))
    top, bot = (24, 30, 44), (10, 12, 18)
    for y in range(H):
        u = y / (H - 1)
        ImageDraw.Draw(bg).line([(0, y), (W, y)], fill=tuple(round(top[i] + (bot[i] - top[i]) * u) for i in range(3)))
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W / 2 - 700, H / 2 - 520, W / 2 + 700, H / 2 + 520), fill=60)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    bg = Image.composite(Image.new("RGB", (W, H), (60, 90, 150)), bg, glow)
    pad, rad = 15, 62
    body = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((sx - pad + 6, sy - pad + 18, sx + sw + pad + 6, sy + sh + pad + 18), rad + pad, fill=(0, 0, 0, 150))
    body.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)))
    d.rounded_rectangle((sx - pad - 3, sy - pad - 3, sx + sw + pad + 3, sy + sh + pad + 3), rad + pad + 3, fill=(92, 98, 112, 255))
    d.rounded_rectangle((sx - pad, sy - pad, sx + sw + pad, sy + sh + pad), rad + pad, fill=(14, 15, 19, 255))
    bg = bg.convert("RGBA")
    bg.alpha_composite(body)
    mask = Image.new("L", (sw * SS, sh * SS), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw * SS - 1, sh * SS - 1), rad * SS, fill=255)
    mask = mask.resize((sw, sh), Image.LANCZOS)
    return bg.convert("RGB"), mask, (sx, sy, sw, sh)


# ---------- one picture of the video ----------

class Film:
    def __init__(self, res):
        self.r = res
        self.times = [t for t, _ in res["frames"]]
        self.paths = [p for _, p in res["frames"]]
        self.dsf = res["dsf"]
        self.phone = res["phone"]
        self.vw, self.vh = res["view"]["width"], res["view"]["height"]
        self._img_i, self._img = -1, None
        self.end = max(res["end"], (self.times[-1] if self.times else 0) + 0.2)

    def screen(self, t):
        i = max(0, bisect.bisect_right(self.times, t) - 1)
        if i != self._img_i:
            im = Image.open(self.paths[i]).convert("RGB")
            fw, fh = round(self.vw * self.dsf), round(self.vh * self.dsf)
            if im.size != (fw, fh):
                im = im.resize((fw, fh), Image.LANCZOS)
            self._img_i, self._img = i, im
        return self._img

    def pointer(self, t):
        """where the pointer is at t (CSS px of the page)"""
        x, y = self.r["start"]
        for m in self.r["moves"]:
            if t < m["t0"]:
                break
            if t >= m["t1"]:
                x, y = m["x1"], m["y1"]
            else:
                u = (t - m["t0"]) / max(1e-6, m["t1"] - m["t0"])
                return curve(m["x0"], m["y0"], m["x1"], m["y1"], u)
        return x, y

    def zoom(self, t):
        """(centre x, centre y, scale) of the video's camera at t (CSS px)"""
        cur = (self.vw / 2, self.vh / 2, 1.0)
        for z in self.r["zooms"]:
            to = (z["cx"], z["cy"], z["s"])
            if t >= z["t1"]:
                cur = to
            elif t >= z["t0"]:
                u = ease((t - z["t0"]) / max(1e-6, z["t1"] - z["t0"]))
                return tuple(cur[i] + (to[i] - cur[i]) * u for i in range(3))
            else:
                break
        return cur

    def hidden(self, t):
        return any(a <= t < b for a, b in self.r["hidden"])

    def frame(self, t, cursor=True):
        src = self.screen(t)
        fw, fh = src.size
        cx, cy, s = self.zoom(t)
        cw, ch = fw / s, fh / s
        left = min(max(cx * self.dsf - cw / 2, 0), fw - cw)
        top = min(max(cy * self.dsf - ch / 2, 0), fh - ch)
        if self.phone:
            bg, mask, (sx, sy, sw, sh) = phone_parts(self.vw, self.vh)
            out = bg.copy()
            scr = src.resize((sw, sh), Image.LANCZOS, box=(left, top, left + cw, top + ch))
            out.paste(scr, (sx, sy), mask)
            to_out = lambda x, y: (sx + (x * self.dsf - left) * sw / cw, sy + (y * self.dsf - top) * sh / ch)
            k = sw / self.vw
        else:
            if s == 1.0 and (fw, fh) == (W, H):
                out = src.copy()
            else:
                out = src.resize((W, H), Image.BICUBIC, box=(left, top, left + cw, top + ch))
            to_out = lambda x, y: ((x * self.dsf - left) * W / cw, (y * self.dsf - top) * H / ch)
            k = W / self.vw
        if not cursor:
            return out
        out = out.convert("RGBA")
        for a, b, times in self.r.get("ff", []):
            if a <= t < b:
                im = ff_badge(times)
                out.alpha_composite(im, ((W - im.width) // 2, 96))
        for c in self.r["clicks"]:
            if c["t"] <= t < c["t"] + RING_S:
                step = min(15, int((t - c["t"]) / RING_S * 16))
                im, (ax, ay) = ring(round(k * 0.9, 2), step, c.get("right", False))
                px, py = to_out(c["x"], c["y"])
                out.alpha_composite(im, (int(px - ax), int(py - ay)))
        if not self.hidden(t):
            px, py = to_out(*self.pointer(t))
            if self.phone:
                if any(c["t"] - 0.05 <= t < max(c["t1"], c["t"] + 0.25) for c in self.r["clicks"]):
                    im, (ax, ay) = finger(round(k, 2))
                    out.alpha_composite(im, (int(px - ax), int(py - ay)))
            else:
                pressed = any(c["t"] <= t < max(c["t1"], c["t"] + 0.12) for c in self.r["clicks"])
                im, (ax, ay) = arrow(round(k * 1.25, 2), pressed)
                if -40 < px < W + 40 and -40 < py < H + 40:
                    out.alpha_composite(im, (int(px - ax), int(py - ay)))
        return out.convert("RGB")


def make_video(res, mp4, poster, preview, small=None):
    """write the MP4, the picture for the list, a small fast preview (shown while the mouse is over a clip) and a smaller
    copy for the add-on (📥 "save for without internet": 960 × 540, about a third of the size)"""
    film = Film(res)
    n = int(film.end * FPS) + 1
    mp4, poster, preview = Path(mp4), Path(poster), Path(preview)
    cmd = [ffmpeg(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-tune", "animation", "-pix_fmt", "yuv420p", "-profile:v", "high",
           "-movflags", "+faststart", "-g", str(FPS * 2), str(mp4)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    try:
        for i in range(n):
            p.stdin.write(film.frame(i / FPS).tobytes())
    finally:
        p.stdin.close()
    if p.wait():
        raise RuntimeError("ffmpeg failed")
    pt = res["poster"] if res["poster"] is not None else film.end * 0.6
    film.frame(min(pt, film.end - 0.05), cursor=False).resize((960, 540), Image.LANCZOS).save(poster, quality=84, optimize=True, progressive=True)
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(mp4), "-vf", "setpts=PTS/1.5,fps=24,scale=640:-2:flags=lanczos", "-an",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(preview)], check=True)
    if small:
        subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(mp4), "-vf", "scale=960:-2:flags=lanczos", "-an",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-tune", "animation", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart", str(small)], check=True)
    return round(film.end, 2)
