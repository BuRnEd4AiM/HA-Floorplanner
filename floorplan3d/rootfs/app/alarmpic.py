"""📸 Bild bei Alarm (5.16.0, the owner's choice 2026-11-17, docs/ideen-5.15 pictures 4 and 5: "wäre cool wenn das auch gehen würde über
Telegram das mit dem Bild"; his choice: his own Telegram bot, the plan and a camera): when water, smoke, gas or the alarm goes off, the
message carries a picture of the floor from above with the room in red and a ring where the sensor is, and the picture of a camera in that
room. The add-on has no browser on the server, so the plan is drawn with Pillow (rooms, walls, doors and windows as lines, names), not the
3D view.

place_of finds where a sensor is (as alarmnotify.where_of), cameras_near the cameras in its room, plan_png draws the floor. Pure but for
Pillow (unit test: tests/test_alarmpic.py)."""
import io
import re

from alarmnotify import _inside, _spots
from roommap import roof_windows

WORDS = {   # the word in the ring (no emoji: the plain font of the server has none)
    "de": {"alarm": "ALARM", "smoke": "RAUCH", "gas": "GAS", "co": "CO", "water": "WASSER", "test": "TEST"},
    "en": {"alarm": "ALARM", "smoke": "SMOKE", "gas": "GAS", "co": "CO", "water": "WATER", "test": "TEST"},
    "fr": {"alarm": "ALARME", "smoke": "FUMÉE", "gas": "GAZ", "co": "CO", "water": "EAU", "test": "TEST"},
    "es": {"alarm": "ALARMA", "smoke": "HUMO", "gas": "GAS", "co": "CO", "water": "AGUA", "test": "PRUEBA"},
    "it": {"alarm": "ALLARME", "smoke": "FUMO", "gas": "GAS", "co": "CO", "water": "ACQUA", "test": "PROVA"},
    "nl": {"alarm": "ALARM", "smoke": "ROOK", "gas": "GAS", "co": "CO", "water": "WATER", "test": "TEST"},
    "pl": {"alarm": "ALARM", "smoke": "DYM", "gas": "GAZ", "co": "CO", "water": "WODA", "test": "TEST"},
}
SIZE = 1000          # px of the longer side of the picture
RED = (226, 62, 52)
NEAR = 4.0           # m: a camera this close to the sensor counts when the sensor is in no room


def place_of(houses, eid):
    """where entity eid is: {house, floor (the floor dict), x, z, room (the room dict or None)}, None when it is not in a plan.
    houses: [(house name, layout)]"""
    for hname, lay in houses:
        floors = (lay or {}).get("floors") or []
        roofwin = roof_windows(floors)
        for f in floors:
            if not isinstance(f, dict):
                continue
            for pts in _spots(f, eid, roofwin.get(f.get("id"), [])):
                room = next((r for x, z in pts for r in f.get("rooms") or [] if isinstance(r, dict) and len(r.get("points") or []) >= 3
                             and _inside(x, z, r["points"])), None)
                x = sum(p[0] for p in pts) / len(pts)
                z = sum(p[1] for p in pts) / len(pts)
                return {"house": hname, "floor": f, "x": float(x), "z": float(z), "room": room}
    return None


def cameras_near(place) -> list:
    """the cameras (camera.*) on the floor of `place` in its room, else within NEAR metres; the nearest first"""
    if not place:
        return []
    out = []
    for d in place["floor"].get("devices") or []:
        e = d.get("entity") if isinstance(d, dict) else None
        if not (isinstance(e, str) and e.startswith("camera.")):
            continue
        x, z = float(d.get("x") or 0), float(d.get("z") or 0)
        dist = ((x - place["x"]) ** 2 + (z - place["z"]) ** 2) ** 0.5
        inside = place["room"] is not None and _inside(x, z, place["room"]["points"])
        if inside or (place["room"] is None and dist <= NEAR):
            out.append((dist, e))
    return list(dict.fromkeys(e for _d, e in sorted(out)))


def _plain(s) -> str:
    """a text the plain font can draw: no emoji, no symbols outside the usual letters"""
    return re.sub(r"[^\w\s.,:;·()/+&'’\-–°%]", "", str(s or ""), flags=re.UNICODE).strip()


def _font(size):
    from PIL import ImageFont
    for name in ("DejaVuSans-Bold.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size)        # Pillow 10.1 and newer
    except TypeError:
        return ImageFont.load_default()


def _bounds(f, extra=()):
    xs, zs = [], []
    for r in f.get("rooms") or []:
        for p in (r.get("points") or []) if isinstance(r, dict) else []:
            xs.append(float(p[0])); zs.append(float(p[1]))
    for w in f.get("walls") or []:
        for k in ("a", "b"):
            p = w.get(k) if isinstance(w, dict) else None
            if isinstance(p, list) and len(p) >= 2:
                xs.append(float(p[0])); zs.append(float(p[1]))
    for x, z in extra:
        xs.append(x); zs.append(z)
    if not xs:
        return None
    return min(xs), min(zs), max(xs), max(zs)


def plan_png(place, kind="water", lang="de", title="") -> bytes:
    """the floor of `place` from above as a PNG: rooms grey, its room red, the walls, room names, a red ring with the word of `kind` where
    the sensor is, `title` on top"""
    from PIL import Image, ImageDraw
    f = place["floor"]
    b = _bounds(f, [(place["x"], place["z"])])
    x0, z0, x1, z1 = b if b else (place["x"] - 5, place["z"] - 5, place["x"] + 5, place["z"] + 5)
    pad = 1.2
    x0, z0, x1, z1 = x0 - pad, z0 - pad, x1 + pad, z1 + pad
    w_m, h_m = max(x1 - x0, 4.0), max(z1 - z0, 4.0)
    head = 70
    scale = SIZE / max(w_m, h_m)
    W, H = int(w_m * scale), int(h_m * scale) + head
    im = Image.new("RGB", (W, H), (245, 246, 248))
    d = ImageDraw.Draw(im, "RGBA")
    P = lambda x, z: ((x - x0) * scale, (z - z0) * scale + head)   # noqa: E731
    room = place.get("room")
    for r in f.get("rooms") or []:
        pts = [P(float(p[0]), float(p[1])) for p in (r.get("points") or [])] if isinstance(r, dict) else []
        if len(pts) < 3:
            continue
        mine = r is room
        d.polygon(pts, fill=(RED + (95,)) if mine else (205, 210, 218, 255), outline=RED if mine else (150, 156, 166), width=4 if mine else 2)
    for w in f.get("walls") or []:
        try:
            a, c = P(float(w["a"][0]), float(w["a"][1])), P(float(w["b"][0]), float(w["b"][1]))
        except (KeyError, TypeError, ValueError, IndexError):
            continue
        d.line([a, c], fill=(55, 60, 70), width=max(3, int((float(w.get("thickness") or 0.2)) * scale * 0.7)))
        L = ((w["b"][0] - w["a"][0]) ** 2 + (w["b"][1] - w["a"][1]) ** 2) ** 0.5 or 1
        for o in w.get("openings") or []:
            if not isinstance(o, dict):
                continue
            k0 = max(0.0, (float(o.get("pos") or 0) - float(o.get("width") or 0.9) / 2) / L)
            k1 = min(1.0, (float(o.get("pos") or 0) + float(o.get("width") or 0.9) / 2) / L)
            p0 = (a[0] + (c[0] - a[0]) * k0, a[1] + (c[1] - a[1]) * k0)
            p1 = (a[0] + (c[0] - a[0]) * k1, a[1] + (c[1] - a[1]) * k1)
            d.line([p0, p1], fill=(120, 180, 230) if o.get("type") == "window" else (245, 246, 248), width=max(3, int(0.12 * scale)))
    small = _font(max(14, int(scale * 0.32)))
    sx, sz = P(place["x"], place["z"])
    ring = max(26, int(scale * 0.9))
    for r in f.get("rooms") or []:
        pts = (r.get("points") or []) if isinstance(r, dict) else []
        name = _plain(r.get("name")) if isinstance(r, dict) else ""
        if len(pts) < 3 or not name:
            continue
        cx = sum(float(p[0]) for p in pts) / len(pts)
        cz = sum(float(p[1]) for p in pts) / len(pts)
        tx, tz = P(cx, cz)
        anchor = "mm"
        if ((tx - sx) ** 2 + (tz - sz) ** 2) ** 0.5 < ring + 30:            # under the ring: the name goes beside it
            right = sx + ring + 24 + d.textlength(name, font=small) < W - 8
            tx, tz, anchor = (sx + ring + 24, sz, "lm") if right else (sx - ring - 24, sz, "rm")
        d.text((tx, tz), name, font=small, fill=(150, 20, 20) if r is room else (60, 66, 78), anchor=anchor)
    d.ellipse([sx - ring - 10, sz - ring - 10, sx + ring + 10, sz + ring + 10], outline=RED + (80,), width=10)
    d.ellipse([sx - ring, sz - ring, sx + ring, sz + ring], outline=RED, width=6)
    word = (WORDS.get(lang) or WORDS["en"]).get(kind, kind.upper())
    big = _font(max(18, int(scale * 0.38)))
    l, t, r_, bt = d.textbbox((0, 0), word, font=big)
    tw, th = r_ - l, bt - t
    bx, by = min(max(sx - tw / 2 - 12, 4), W - tw - 28), max(sz - ring - th - 34, head + 4)
    d.rounded_rectangle([bx, by, bx + tw + 24, by + th + 16], radius=10, fill=RED)
    d.text((bx + 12 - l, by + 8 - t), word, font=big, fill=(255, 255, 255))
    d.rectangle([0, 0, W, head], fill=(28, 34, 46))
    d.text((18, head / 2), _plain(title) or _plain(f.get("name")), font=_font(30), fill=(255, 255, 255), anchor="lm")
    out = io.BytesIO()
    im.save(out, "PNG", optimize=True)
    return out.getvalue()
