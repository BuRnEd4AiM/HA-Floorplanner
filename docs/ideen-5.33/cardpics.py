"""Grundrisse für die Beispiel-Bildkarten (docs/ideen-5.33, 2026-11-23): so, wie das Add-on sie ohne Browser mit Pillow malen könnte
(wie alarmpic.py), aber ohne eigene Kopfzeile, weil die Karte ihre eigene hat. Nur fürs Foto; nichts davon ist gebaut.
    plan(layout, floor, room=None, ring=None, marks=(), theme="light", box=None) -> PNG-Bytes
room: der Name des roten Raums; ring: (x, z, Wort) für den roten Ring; marks: [(x, z, Farbe, Wort)] kleine Punkte mit Schild;
box: (x0, z0, x1, z1) ein Ausschnitt statt der ganzen Etage."""
import io

from PIL import Image, ImageDraw, ImageFont

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
RED = (226, 62, 52)
THEMES = {
    "light": {"bg": (246, 247, 250), "room": (214, 219, 227), "line": (150, 156, 166), "wall": (52, 58, 70), "text": (60, 66, 78),
              "win": (110, 175, 230), "door": (246, 247, 250)},
    "dark": {"bg": (24, 29, 40), "room": (44, 52, 68), "line": (78, 88, 108), "wall": (196, 204, 220), "text": (186, 196, 214),
             "win": (96, 170, 236), "door": (24, 29, 40)},
}


def _font(n):
    return ImageFont.truetype(FONT, n)


def plan(layout, floor, room=None, ring=None, marks=(), theme="light", box=None, width=1000, ratio=None):
    th = THEMES[theme]
    f = layout["floors"][floor]
    xs = [p[0] for r in f["rooms"] for p in r["points"]] + [c for w in f["walls"] for c in (w["a"][0], w["b"][0])]
    zs = [p[1] for r in f["rooms"] for p in r["points"]] + [c for w in f["walls"] for c in (w["a"][1], w["b"][1])]
    x0, z0, x1, z1 = box or (min(xs), min(zs), max(xs), max(zs))
    pad = 0.8
    x0, z0, x1, z1 = x0 - pad, z0 - pad, x1 + pad, z1 + pad
    if ratio:                                             # the picture's height / width: the box grows to fit
        want = (x1 - x0) * ratio
        if want > z1 - z0:
            m = (want - (z1 - z0)) / 2; z0, z1 = z0 - m, z1 + m
        else:
            m = ((z1 - z0) / ratio - (x1 - x0)) / 2; x0, x1 = x0 - m, x1 + m
    s = width / (x1 - x0)
    W, H = width, int((z1 - z0) * s)
    im = Image.new("RGB", (W, H), th["bg"])
    d = ImageDraw.Draw(im, "RGBA")
    P = lambda x, z: ((x - x0) * s, (z - z0) * s)   # noqa: E731
    for r in f["rooms"]:
        pts = [P(*p) for p in r["points"]]
        mine = r["name"] == room
        d.polygon(pts, fill=RED + (110,) if mine else th["room"], outline=RED if mine else th["line"], width=5 if mine else 2)
    for w in f["walls"]:
        a, c = P(*w["a"]), P(*w["b"])
        d.line([a, c], fill=th["wall"], width=max(4, int(float(w.get("thickness") or 0.2) * s * 0.8)))
        L = ((w["b"][0] - w["a"][0]) ** 2 + (w["b"][1] - w["a"][1]) ** 2) ** 0.5 or 1
        for o in w.get("openings") or []:
            k0 = max(0, (o.get("pos", 0) - o.get("width", 0.9) / 2) / L); k1 = min(1, (o.get("pos", 0) + o.get("width", 0.9) / 2) / L)
            p0 = (a[0] + (c[0] - a[0]) * k0, a[1] + (c[1] - a[1]) * k0); p1 = (a[0] + (c[0] - a[0]) * k1, a[1] + (c[1] - a[1]) * k1)
            d.line([p0, p1], fill=th["win"] if o.get("type") == "window" else th["door"], width=max(4, int(0.13 * s)))
    small = _font(max(15, int(s * 0.34)))
    for r in f["rooms"]:
        pts = r["points"]
        cx, cz = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
        if ring and abs(cx - ring[0]) < 1.2 and abs(cz - ring[1]) < 0.8:
            cx += 2.2
        tx, tz = P(cx, cz)
        if 0 < tx < W and 0 < tz < H:
            d.text((tx, tz), r["name"], font=small, fill=(150, 20, 20) if r["name"] == room else th["text"], anchor="mm")
    for x, z, col, word in marks:
        px, pz = P(x, z)
        rr = max(12, int(s * 0.28))
        d.ellipse([px - rr - 6, pz - rr - 6, px + rr + 6, pz + rr + 6], fill=col + (70,))
        d.ellipse([px - rr, pz - rr, px + rr, pz + rr], fill=col, outline=(255, 255, 255), width=3)
        if word:
            f2 = _font(max(14, int(s * 0.26)))
            l, t, r_, b = d.textbbox((0, 0), word, font=f2)
            bx, by = px - (r_ - l) / 2 - 8, pz - rr - (b - t) - 22
            d.rounded_rectangle([bx, by, bx + r_ - l + 16, by + b - t + 12], radius=7, fill=col)
            d.text((bx + 8 - l, by + 6 - t), word, font=f2, fill=(255, 255, 255))
    if ring:
        x, z, word = ring
        px, pz = P(x, z)
        rr = max(28, int(s * 0.75))
        d.ellipse([px - rr - 11, pz - rr - 11, px + rr + 11, pz + rr + 11], outline=RED + (90,), width=11)
        d.ellipse([px - rr, pz - rr, px + rr, pz + rr], outline=RED, width=7)
        f2 = _font(max(18, int(s * 0.36)))
        l, t, r_, b = d.textbbox((0, 0), word, font=f2)
        bx, by = px - (r_ - l) / 2 - 12, max(4, pz - rr - (b - t) - 34)
        d.rounded_rectangle([bx, by, bx + r_ - l + 24, by + b - t + 16], radius=10, fill=RED)
        d.text((bx + 12 - l, by + 8 - t), word, font=f2, fill=(255, 255, 255))
    out = io.BytesIO()
    im.save(out, "PNG", optimize=True)
    return out.getvalue()
