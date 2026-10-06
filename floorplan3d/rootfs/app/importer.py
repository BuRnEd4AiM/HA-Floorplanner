"""Property JSON  ->  3D Floorplan layout (and back).

Pure functions, no I/O besides reading models.js once for the list of device types.
The format is documented in docs/IMPORT.md and described by property.schema.json.

    build_layout(data)      -> (layout, report)      data = property JSON (dict)
    geojson_to_property()   -> property JSON         GeoJSON polygons (lat/lon) -> local metres
    layout_to_property()    -> property JSON         export of an existing layout
"""
from __future__ import annotations

import math
import re
from pathlib import Path

SCHEMA_VERSION = 1
MAX_FLOORS = 20
MAX_ROOMS = 200
MAX_POINTS = 100
MAX_ITEMS = 2000
COORD_LIMIT = 1000.0
EDGE = 0.05                         # solid wall that must remain next to an opening (same as the editor)

OPENING_PRESETS = {                 # same table as OPENING_DEFAULTS in static/walls.js
    "door":        {"type": "door",   "style": "single",  "width": 0.9, "height": 2.05, "sill": 0},
    "doorEntry":   {"type": "door",   "style": "single",  "width": 1.1, "height": 2.15, "sill": 0},
    "doorGlass":   {"type": "door",   "style": "glass",   "width": 0.9, "height": 2.05, "sill": 0},
    "doorDouble":  {"type": "door",   "style": "double",  "width": 1.6, "height": 2.05, "sill": 0},
    "doorSlide":   {"type": "door",   "style": "sliding", "width": 1.8, "height": 2.1,  "sill": 0},
    "doorOpen":    {"type": "door",   "style": "open",    "width": 1.0, "height": 2.05, "sill": 0},
    "doorGap":     {"type": "door",   "style": "gap",     "width": 1.0, "height": 2.1,  "sill": 0},
    "doorGarage":  {"type": "door",   "style": "garage",  "width": 2.5, "height": 2.1,  "sill": 0},
    "window":      {"type": "window", "style": "single",  "width": 1.0, "height": 1.2,  "sill": 0.9},
    "window2":     {"type": "window", "style": "double",  "width": 1.8, "height": 1.2,  "sill": 0.9},
    "window3":     {"type": "window", "style": "triple",  "width": 2.4, "height": 1.2,  "sill": 0.9},
    "windowTall":  {"type": "window", "style": "double",  "width": 1.8, "height": 2.1,  "sill": 0},
    "windowBath":  {"type": "window", "style": "single",  "width": 0.6, "height": 0.6,  "sill": 1.5},
    "windowFixed": {"type": "window", "style": "fixed",   "width": 1.6, "height": 1.4,  "sill": 0.6},
}
DOOR_STYLES = {"single", "glass", "double", "sliding", "open", "gap", "garage"}
WINDOW_STYLES = {"single", "double", "triple", "fixed"}
ROOF_TYPES = {"gable", "hip", "flat"}
FLOOR_KINDS = {"floor", "basement", "roof"}
ROOM_COLORS = ["#b89b74", "#c9c2b4", "#8fb1c2", "#a99bb8", "#9db39a", "#c2a58f", "#9fb0c9", "#b7b08f"]
# optional device fields that are copied when they have the right type
DEVICE_NUMBERS = ("y", "rot", "scale", "sx", "sy", "sz", "tiltX", "tiltZ", "w", "ar", "fov", "range", "len")
DEVICE_STRINGS = ("name", "entity", "ledEntity", "motionEntity", "img", "batPower")
DEVICE_FLAGS = ("mirror", "locked", "hideModel", "batInvert", "noRail")
CABLE_ROUTES = ("floor", "through", "air")
CABLE_KINDS = ("grid", "solar", "battery", "load")
STAIR_TYPES = ("straight", "L", "U", "spiral", "wall")           # same as STAIR_TYPES in static/stairs.js
STAIR_MAX_FLOORS = 6                                              # MAX_FLOORS in static/stairs.js
STAIR_TREAD = (0.1, 0.45)                                         # MIN_TREAD / MAX_TREAD in static/stairs.js
STAIR_MAX_LANDING = 3                                             # MAX_LANDING in static/stairs.js
MAX_STAIR_POINTS = 30
SOLAR_MAX_FIELD = 12                                              # MAX_FIELD in static/solarroof.js
SOLAR_MOUNTS = ("auto", "flat", "stand")                          # MOUNTS in static/solarroof.js
MAX_PER_FLOOR = 100                                               # stairs, blocks and floor openings per floor
KITCHEN_MODULES = ("base", "drawers", "sink", "stove", "dish", "fridge", "tall", "gap")   # same as MOD_W in static/kitchen.js (checked by a test)


def _load_device_types() -> dict:
    """type -> default height, read from the frontend's models.js so the two never drift apart."""
    types = {}
    try:
        text = (Path(__file__).parent / "static" / "models.js").read_text(encoding="utf-8")
        for m in re.finditer(r"^\s+(\w+):\s*\{\s*label:\s*'[^']*',\s*y:\s*([\d.]+)(,\s*hidden:\s*true)?\s*\}", text, re.M):
            if not m.group(3):
                types[m.group(1)] = float(m.group(2))
    except OSError:
        pass
    return types


DEVICE_TYPES = _load_device_types()


class Report:
    def __init__(self):
        self.errors: list[dict] = []
        self.warnings: list[dict] = []

    def error(self, path: str, msg: str):
        self.errors.append({"path": path, "message": msg})

    def warn(self, path: str, msg: str):
        self.warnings.append({"path": path, "message": msg})


# ---------------------------------------------------------------- small geometry helpers
def _num(v, lo=-math.inf, hi=math.inf):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and lo <= v <= hi


def _pt(p) -> bool:
    return isinstance(p, (list, tuple)) and len(p) == 2 and all(_num(c, -COORD_LIMIT, COORD_LIMIT) for c in p)


def _area(poly) -> float:
    return sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1] for i in range(len(poly))) / 2


def _seg_cross(a, b, c, d) -> bool:
    def o(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    d1, d2, d3, d4 = o(c, d, a), o(c, d, b), o(a, b, c), o(a, b, d)
    return d1 * d2 < -1e-9 and d3 * d4 < -1e-9


def _self_intersects(poly) -> bool:
    n = len(poly)
    for i in range(n):
        for j in range(i + 1, n):
            if j == i + 1 or (i == 0 and j == n - 1):
                continue
            if _seg_cross(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n]):
                return True
    return False


def _polygon(rep: Report, path: str, value, name="polygon", min_area=0.5):
    """Validated list of [x, z] points or None."""
    if not isinstance(value, list) or not 3 <= len(value) <= MAX_POINTS or not all(_pt(p) for p in value):
        rep.error(path, f"{name} needs 3 to {MAX_POINTS} points [x, z] in metres (numbers within +-{int(COORD_LIMIT)})")
        return None
    poly = [[round(float(p[0]), 3), round(float(p[1]), 3)] for p in value]
    if len(poly) > 3 and poly[0] == poly[-1]:
        poly.pop()                                   # a repeated closing point is fine
    if _self_intersects(poly):
        rep.error(path, f"{name} crosses itself (edges intersect, check the order of the points)")
        return None
    if abs(_area(poly)) < min_area:
        rep.error(path, f"{name} is too small or degenerate (area under {min_area} m²)")
        return None
    return poly


def _dist_seg(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]
    l2 = dx * dx + dz * dz or 1e-9
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2))
    return math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dz * t)), t * math.sqrt(l2)


def _on_segment(p, a, b, tol=0.015) -> bool:
    d, along = _dist_seg(p, a, b)
    return d <= tol and tol < along < math.hypot(b[0] - a[0], b[1] - a[1]) - tol


# ---------------------------------------------------------------- walls from footprint + rooms
def derive_walls(footprint, rooms, outer_t, inner_t, height):
    """Wall centre lines from the outline and the room polygons. Shared edges become ONE wall, T-junctions split walls."""
    key = lambda p: (round(p[0], 2), round(p[1], 2))
    sources = []                                    # (polygon, source id)
    if footprint:
        sources.append((footprint, "foot"))
    for i, r in enumerate(rooms):
        sources.append((r, i))
    verts = {key(p) for poly, _ in sources for p in poly}
    segs: dict = {}
    for poly, src in sources:
        for i in range(len(poly)):
            a, b = key(poly[i]), key(poly[(i + 1) % len(poly)])
            if a == b:
                continue
            pts = [a, b] + [v for v in verts if v != a and v != b and _on_segment(v, a, b)]
            pts.sort(key=lambda q: (q[0] - a[0]) ** 2 + (q[1] - a[1]) ** 2)
            for u, v in zip(pts, pts[1:]):
                segs.setdefault(tuple(sorted((u, v))), set()).add(src)
    walls = []
    for (a, b), src in sorted(segs.items()):
        outer = ("foot" in src) if footprint else (len(src) == 1)
        walls.append({"a": [a[0], a[1]], "b": [b[0], b[1]], "thickness": outer_t if outer else inner_t, "height": height, "openings": []})
    return walls


# ---------------------------------------------------------------- openings
def _opening_from(rep: Report, path: str, spec: dict):
    """Resolve preset + overrides into a clean opening dict (without id/pos) or None."""
    preset = spec.get("preset")
    typ = spec.get("type")
    base = None
    if preset is not None:
        base = OPENING_PRESETS.get(preset)
        if base is None:
            rep.error(path, f"unknown preset '{preset}' (use one of: {', '.join(OPENING_PRESETS)})")
            return None
    elif typ in ("door", "window"):
        base = OPENING_PRESETS[typ]
    else:
        rep.error(path, "opening needs \"type\": \"door\" or \"window\" (or a \"preset\")")
        return None
    o = dict(base)
    for k, lo, hi in (("width", 0.2, 6), ("height", 0.2, 4), ("sill", 0, 3)):
        if k in spec:
            if not _num(spec[k], lo, hi):
                rep.error(f"{path}.{k}", f"{k} must be a number between {lo} and {hi} (metres)")
                return None
            o[k] = float(spec[k])
    if "style" in spec:
        ok = DOOR_STYLES if o["type"] == "door" else WINDOW_STYLES
        if spec["style"] not in ok:
            rep.warn(f"{path}.style", f"unknown style '{spec['style']}' for a {o['type']}, using '{o['style']}'")
        else:
            o["style"] = spec["style"]
    for k in ("entity", "name"):
        if isinstance(spec.get(k), str) and spec[k]:
            o[k] = spec[k][:120]
    if isinstance(spec.get("paneEntities"), list):
        o["paneEntities"] = [str(x)[:120] if isinstance(x, str) else "" for x in spec["paneEntities"][:4]]
    return o


def _place_opening(rep: Report, path: str, walls: list, o: dict, spec: dict, ids) -> bool:
    """Put opening `o` on the wall named by spec['at'] (nearest wall) – returns True when placed."""
    if "pos" in spec and "at" not in spec:
        return False
    at = spec.get("at")
    if not _pt(at):
        rep.error(f"{path}.at", "opening needs \"at\": [x, z], a point on the wall where it should sit")
        return True
    best = None
    for w in walls:
        d, along = _dist_seg(at, w["a"], w["b"])
        if best is None or d < best[0]:
            best = (d, along, w)
    if best is None or best[0] > max(0.4, best[2]["thickness"] / 2 + 0.25):
        rep.warn(path, f"no wall near {list(at)} (closest is {best[0]:.2f} m away): opening skipped" if best else "no walls on this floor: opening skipped")
        return True
    _, pos, w = best
    return _put(rep, path, w, o, pos, ids)


def _put(rep: Report, path: str, w: dict, o: dict, pos: float, ids) -> bool:
    length = math.hypot(w["b"][0] - w["a"][0], w["b"][1] - w["a"][1])
    half = o["width"] / 2
    if length < o["width"] + 2 * EDGE:
        rep.warn(path, f"wall is only {length:.2f} m long, a {o['width']} m {o['type']} does not fit: skipped")
        return True
    pos = max(half + EDGE, min(length - half - EDGE, pos))
    for e in w["openings"]:
        if abs(e["pos"] - pos) < (e["width"] + o["width"]) / 2:
            rep.warn(path, "overlaps another opening on the same wall: skipped")
            return True
    w["openings"].append({"id": ids("o"), **o, "pos": round(pos, 3)})
    return True


# ---------------------------------------------------------------- devices
def _device(rep: Report, path: str, spec, ids):
    if not isinstance(spec, dict):
        rep.error(path, "device must be an object")
        return None
    typ = spec.get("type")
    if not isinstance(typ, str) or typ not in DEVICE_TYPES:
        rep.warn(path, f"unknown device type '{typ}': skipped (known: {', '.join(sorted(DEVICE_TYPES))})")
        return None
    if not _num(spec.get("x"), -COORD_LIMIT, COORD_LIMIT) or not _num(spec.get("z"), -COORD_LIMIT, COORD_LIMIT):
        rep.error(path, "device needs numeric \"x\" and \"z\" (metres)")
        return None
    d = {"id": ids("d"), "type": typ, "x": round(float(spec["x"]), 3), "z": round(float(spec["z"]), 3),
         "y": DEVICE_TYPES[typ], "rot": 0, "scale": 1, "name": "", "entity": ""}
    for k in DEVICE_NUMBERS:
        if k in spec:
            if _num(spec[k], -10000, 10000):
                d[k] = float(spec[k]) if k != "rot" else float(spec[k])
            else:
                rep.warn(f"{path}.{k}", f"{k} must be a number: ignored")
    for k in DEVICE_STRINGS:
        if isinstance(spec.get(k), str):
            d[k] = spec[k][:120]
    for k in DEVICE_FLAGS:
        if spec.get(k) is True:
            d[k] = True
    if typ == "nanoleaf" and isinstance(spec.get("panels"), list):
        panels = []
        for p in spec["panels"][:300]:
            if isinstance(p, dict) and p.get("s") in ("tri", "tri2", "hex", "sq", "bar") and _num(p.get("x"), -5, 5) and _num(p.get("y"), -5, 5) and _num(p.get("r", 0), -360, 720):
                panels.append({"s": p["s"], "x": float(p["x"]), "y": float(p["y"]), "r": float(p.get("r", 0))})
        if panels:
            d["panels"] = panels
    if isinstance(spec.get("id"), str) and spec["id"]:
        d["_key"] = spec["id"][:60]                      # only to resolve "feeds" below, never kept
    raw = [c for c in (spec.get("cables") or [])[:20] if isinstance(c, dict) and isinstance(c.get("to"), str) and c["to"]]
    if isinstance(spec.get("feeds"), str) and spec["feeds"]:
        raw.append({"to": spec["feeds"]})                # first version of the format: one cable, hanging in the air
        raw[-1]["route"] = "air"
    if raw:
        d["_cables"] = [{"to": c["to"][:60], "route": c["route"] if c.get("route") in CABLE_ROUTES else "floor",
                         **({"kind": c["kind"]} if c.get("kind") in CABLE_KINDS else {}),
                         **({"entity": c["entity"][:120]} if isinstance(c.get("entity"), str) and c["entity"] else {})} for c in raw]
    if typ == "kitchenrun":
        def module(m):                                   # a name, or {"m": name, "w": width in metres} for a resized module
            if isinstance(m, str):
                return m if m in KITCHEN_MODULES else None
            if isinstance(m, dict) and m.get("m") in KITCHEN_MODULES and _num(m.get("w"), 0.3, 2.4):
                return {"m": m["m"], "w": round(float(m["w"]), 2)}
            return None
        legs = [[x for x in map(module, leg) if x is not None][:16] for leg in (spec.get("legs") or [])[:3] if isinstance(leg, list)]
        d["legs"] = [lg for lg in legs if lg] or [["base", "sink", "dish", "base", "stove", "base", "fridge"]]
        d["upper"] = spec.get("upper") is not False
        if _num(spec.get("depth"), 0.4, 1.2):
            d["depth"] = float(spec["depth"])
    if typ == "solarpanel":                              # a field of panels (#176), same limits as static/solarroof.js
        for k in ("cols", "rows"):
            if k in spec:
                if isinstance(spec[k], (int, float)) and not isinstance(spec[k], bool) and 1 <= spec[k] <= SOLAR_MAX_FIELD:
                    if int(round(spec[k])) > 1:
                        d[k] = int(round(spec[k]))
                else:
                    rep.warn(f"{path}.{k}", f"{k} must be a whole number from 1 to {SOLAR_MAX_FIELD}: ignored")
        if spec.get("mount") in SOLAR_MOUNTS and spec["mount"] != "auto":
            d["mount"] = spec["mount"]
    if typ == "ledring":
        pts = [[float(q[0]), float(q[1])] for q in (spec.get("pts") or [])[:200]
               if isinstance(q, (list, tuple)) and len(q) == 2 and _num(q[0], -COORD_LIMIT, COORD_LIMIT) and _num(q[1], -COORD_LIMIT, COORD_LIMIT)]
        if len(pts) < 2:
            rep.warn(f"{path}.pts", "ledring needs \"pts\" (at least two [x, z] points relative to the device): a 2 x 2 m square is used")
            pts = [[-1.0, -1.0], [1.0, -1.0], [1.0, 1.0], [-1.0, 1.0]]
        d["pts"] = pts
        d["closed"] = spec.get("closed") is not False
        n = len(pts) if d["closed"] else len(pts) - 1
        segs = [sg if isinstance(sg, dict) else {} for sg in (spec.get("segs") if isinstance(spec.get("segs"), list) else [])][:200]
        ranged = any(_num(sg.get("from"), 0, 100000) and _num(sg.get("to"), 0, 100000) for sg in segs)

        def seg(sg):
            o = {"entity": sg["entity"][:120]} if isinstance(sg.get("entity"), str) and sg["entity"] else {}
            if ranged:                                   # own start / end in metres along the band
                if not (_num(sg.get("from"), 0, 100000) and _num(sg.get("to"), 0, 100000)) or float(sg["to"]) <= float(sg["from"]):
                    return None
                o.update({"from": round(float(sg["from"]), 3), "to": round(float(sg["to"]), 3)})
            return o
        d["segs"] = [o for o in map(seg, segs if ranged else segs[:n]) if o is not None]
        if ranged and len(d["segs"]) < len(segs):
            rep.warn(f"{path}.segs", "sections need numeric \"from\" < \"to\" (metres along the band): broken ones skipped")
        if not ranged:
            d["segs"] += [{} for _ in range(n - len(d["segs"]))]
        elif not d["segs"]:
            d["segs"] = [{} for _ in range(n)]
        if _num(spec.get("inset"), 0, 2):
            d["inset"] = float(spec["inset"])
    return d


# ---------------------------------------------------------------- main entry
def _stair(rep: Report, path: str, spec, ids, ox, oz):
    """One stair of a floor. Returns the stair for the layout or None. (x, z) and a wall stair's path are in metres; x and z shift by the building origin,
    the path is relative to (x, z) and starts at [0, 0] (a path that starts elsewhere is moved there)."""
    if not isinstance(spec, dict):
        rep.error(path, "stair must be an object")
        return None
    typ = spec.get("type")
    if typ not in STAIR_TYPES:
        rep.warn(path, f"unknown stair type '{typ}': skipped (known: {', '.join(STAIR_TYPES)})")
        return None
    if not _num(spec.get("x"), -COORD_LIMIT, COORD_LIMIT) or not _num(spec.get("z"), -COORD_LIMIT, COORD_LIMIT):
        rep.error(path, "stair needs numeric \"x\" and \"z\" (metres)")
        return None
    st = {"id": ids("s"), "type": typ, "x": float(spec["x"]), "z": float(spec["z"]), "rot": 0.0, "w": 0.9 if typ in ("spiral", "wall") else 1.0,
          "tread": 0.27, "turn": "right", "dir": "up", "floors": 1, "name": ""}
    if "rot" in spec:
        if _num(spec["rot"], -3600, 3600):
            st["rot"] = float(spec["rot"]) % 360
        else:
            rep.warn(f"{path}.rot", "rot must be a number (degrees): ignored")
    if "w" in spec:
        if _num(spec["w"], 0.4, 4):
            st["w"] = float(spec["w"])
        else:
            rep.warn(f"{path}.w", "w (width, or radius of a spiral) must be between 0.4 and 4 m: ignored")
    if "tread" in spec:
        if _num(spec["tread"], STAIR_TREAD[0], STAIR_TREAD[1]):
            st["tread"] = float(spec["tread"])
        else:
            rep.warn(f"{path}.tread", f"tread (depth of a step) must be between {STAIR_TREAD[0]} and {STAIR_TREAD[1]} m: ignored")
    for key, allowed in (("turn", ("left", "right")), ("dir", ("up", "down"))):
        if key in spec:
            if spec[key] in allowed:
                st[key] = spec[key]
            else:
                rep.warn(f"{path}.{key}", f"{key} must be {' or '.join(allowed)}: ignored")
    if "floors" in spec:
        v = spec["floors"]
        if isinstance(v, int) and not isinstance(v, bool) and 1 <= v <= STAIR_MAX_FLOORS:
            st["floors"] = v
        else:
            rep.warn(f"{path}.floors", f"floors must be a whole number from 1 to {STAIR_MAX_FLOORS}: ignored")
    if isinstance(spec.get("name"), str):
        st["name"] = spec["name"][:60]
    if typ == "wall":
        raw = spec.get("path")
        if not isinstance(raw, list) or not 2 <= len(raw) <= MAX_STAIR_POINTS or not all(_pt(p) and _num(p[0], -COORD_LIMIT, COORD_LIMIT) and _num(p[1], -COORD_LIMIT, COORD_LIMIT) for p in raw):
            rep.error(f"{path}.path", f"a wall stair needs a \"path\": 2 to {MAX_STAIR_POINTS} points [x, z] along the wall")
            return None
        p0 = raw[0]
        pts = [[round(float(p[0]) - float(p0[0]), 3), round(float(p[1]) - float(p0[1]), 3)] for p in raw]
        if any(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) < 0.01 for i in range(len(pts) - 1)):
            rep.error(f"{path}.path", "two neighbouring points of the path are the same")
            return None
        st["x"], st["z"] = st["x"] + float(p0[0]), st["z"] + float(p0[1])
        st["path"] = pts
        if "landing" in spec:                            # flat after every bend for this long (#210)
            if _num(spec["landing"], 0, STAIR_MAX_LANDING):
                if float(spec["landing"]) > 0:
                    st["landing"] = round(float(spec["landing"]), 2)
            else:
                rep.warn(f"{path}.landing", f"landing must be between 0 and {STAIR_MAX_LANDING} m: ignored")
    st["x"], st["z"] = round(st["x"] + ox, 3), round(st["z"] + oz, 3)
    return st


def _stairs_of_floor(rep: Report, fp: str, raw, ids, ox, oz):
    if raw is None:
        return []
    if not isinstance(raw, list) or len(raw) > MAX_PER_FLOOR:
        rep.error(f"{fp}.stairs", f"\"stairs\" must be a list (max {MAX_PER_FLOOR})")
        return []
    return [st for st in (_stair(rep, f"{fp}.stairs[{i}]", spec, ids, ox, oz) for i, spec in enumerate(raw)) if st is not None]


def _blocks_and_holes(rep: Report, fp: str, f: dict, out: dict, ids):
    """Placeholder blocks ("a house part without detail") and floor openings of a floor; the points are shifted by the origin later, like rooms."""
    for key, label, prefix in (("blocks", "block", "b"), ("holes", "floor opening", "h")):
        raw = f.get(key)
        if raw is None:
            continue
        if not isinstance(raw, list) or len(raw) > MAX_PER_FLOOR:
            rep.error(f"{fp}.{key}", f"\"{key}\" must be a list (max {MAX_PER_FLOOR})")
            continue
        for i, spec in enumerate(raw):
            sp = f"{fp}.{key}[{i}]"
            if not isinstance(spec, dict):
                rep.error(sp, f"{label} must be an object")
                continue
            poly = _polygon(rep, f"{sp}.points", spec.get("points"), f"{label} polygon")
            if poly is None:
                continue
            item = {"id": ids(prefix), "points": poly}
            if key == "blocks":
                item["name"] = str(spec.get("name") or f"Block {i + 1}")[:60]
                if "h" in spec:
                    if _num(spec["h"], 0.5, 30):
                        item["h"] = float(spec["h"])
                    else:
                        rep.warn(f"{sp}.h", "h (height) must be between 0.5 and 30 m: ignored")
            out[key].append(item)


def build_layout(data):
    """Return (layout, plot, report, summary). `layout` is None when there are errors."""
    rep = Report()
    seq: dict = {}

    def ids(prefix):
        seq[prefix] = seq.get(prefix, 0) + 1
        return f"{prefix}{seq[prefix]}"

    summary = {"floors": 0, "rooms": 0, "walls": 0, "openings": 0, "devices": 0, "stairs": 0}
    if not isinstance(data, dict):
        rep.error("$", "the file must contain one JSON object")
        return None, None, rep, summary
    ver = data.get("schemaVersion")
    if ver is None:
        rep.warn("schemaVersion", f"missing, assuming {SCHEMA_VERSION}")
    elif ver != SCHEMA_VERSION:
        rep.error("schemaVersion", f"unsupported version {ver!r}, this add-on reads version {SCHEMA_VERSION}")
        return None, None, rep, summary
    b = data.get("building")
    if not isinstance(b, dict):
        rep.error("building", "\"building\" object missing")
        return None, None, rep, summary

    def opt(path, key, default, lo, hi):
        v = b.get(key, default)
        if not _num(v, lo, hi):
            rep.error(f"{path}.{key}", f"{key} must be a number between {lo} and {hi} (metres)")
            return default
        return float(v)
    height = opt("building", "wallHeight", 2.6, 1.8, 10)
    outer_t = opt("building", "outerWall", 0.3, 0.05, 1.5)
    inner_t = opt("building", "innerWall", 0.12, 0.03, 1)
    origin = b.get("origin", [0, 0])
    if not _pt(origin):
        rep.error("building.origin", "origin must be [x, z] in metres")
        origin = [0, 0]
    ox, oz = float(origin[0]), float(origin[1])
    default_foot = _polygon(rep, "building.footprint", b["footprint"], "footprint", 4) if "footprint" in b else None

    floors_in = b.get("floors")
    if not isinstance(floors_in, list) or not 1 <= len(floors_in) <= MAX_FLOORS:
        rep.error("building.floors", f"\"floors\" must be a list of 1 to {MAX_FLOORS} floors")
        floors_in = []
    floors = []
    input_ids = {}                                       # index in building.floors -> floor id (for the "level" of further roofs)
    for fi, f in enumerate(floors_in):
        fp = f"building.floors[{fi}]"
        if not isinstance(f, dict):
            rep.error(fp, "floor must be an object")
            continue
        kind = f.get("kind", "floor")
        if kind not in FLOOR_KINDS:
            rep.error(f"{fp}.kind", "kind must be floor, basement or roof")
            continue
        name = str(f.get("name") or {"floor": f"Etage {fi + 1}", "basement": "Keller", "roof": "Dach"}[kind])[:60]
        out = {"id": ids("f"), "name": name, "kind": kind, "walls": [], "rooms": [], "devices": [], "blocks": [], "stairs": [], "holes": []}
        input_ids[fi] = out["id"]
        if kind == "roof":
            out["roof"] = _roof(rep, f"{fp}.roof", f.get("roof", {}))
            floors.append(out)
            continue
        # rooms
        rooms = []
        raw_rooms = f.get("rooms", [])
        if not isinstance(raw_rooms, list) or len(raw_rooms) > MAX_ROOMS:
            rep.error(f"{fp}.rooms", f"\"rooms\" must be a list (max {MAX_ROOMS})")
            raw_rooms = []
        for ri, r in enumerate(raw_rooms):
            rp = f"{fp}.rooms[{ri}]"
            if not isinstance(r, dict):
                rep.error(rp, "room must be an object")
                continue
            poly = _polygon(rep, f"{rp}.points", r.get("points"), "room polygon")
            if poly is None:
                continue
            room = {"id": ids("r"), "name": str(r.get("name") or f"Raum {ri + 1}")[:60],
                    "color": r["color"] if isinstance(r.get("color"), str) and re.fullmatch(r"#[0-9a-fA-F]{6}", r["color"]) else ROOM_COLORS[ri % len(ROOM_COLORS)],
                    "points": poly}
            if isinstance(r.get("area"), str) and r["area"]:
                room["area"] = r["area"][:80]
            if r.get("terrace") is True:
                room["terrace"] = True                          # roof terrace: open area with a railing
            out["rooms"].append(room)
            rooms.append(poly)
        # walls: explicit list wins, otherwise derived from outline + rooms
        foot = _polygon(rep, f"{fp}.footprint", f["footprint"], "footprint", 4) if "footprint" in f else default_foot
        if "walls" in f:
            if not isinstance(f["walls"], list) or len(f["walls"]) > MAX_ITEMS:
                rep.error(f"{fp}.walls", "\"walls\" must be a list")
            else:
                for wi, w in enumerate(f["walls"]):
                    wp = f"{fp}.walls[{wi}]"
                    if not isinstance(w, dict) or not _pt(w.get("a")) or not _pt(w.get("b")):
                        rep.error(wp, "wall needs \"a\": [x, z] and \"b\": [x, z]")
                        continue
                    wall = {"id": ids("w"), "a": [float(w["a"][0]), float(w["a"][1])], "b": [float(w["b"][0]), float(w["b"][1])],
                            "thickness": float(w["thickness"]) if _num(w.get("thickness"), 0.03, 1.5) else outer_t,
                            "height": float(w["height"]) if _num(w.get("height"), 0.5, 10) else height, "openings": []}
                    if math.hypot(wall["b"][0] - wall["a"][0], wall["b"][1] - wall["a"][1]) < 0.05:
                        rep.warn(wp, "wall shorter than 5 cm: skipped")
                        continue
                    out["walls"].append(wall)
                    for oi, spec in enumerate(w.get("openings") or []):
                        op = f"{wp}.openings[{oi}]"
                        o = _opening_from(rep, op, spec) if isinstance(spec, dict) else None
                        if o is None:
                            continue
                        if "pos" in spec:
                            if _num(spec["pos"], 0, 1000):
                                _put(rep, op, wall, o, float(spec["pos"]), ids)
                            else:
                                rep.error(f"{op}.pos", "pos must be the distance from point a in metres")
                        else:
                            _place_opening(rep, op, [wall], o, spec, ids)
        elif foot or rooms:
            for w in derive_walls(foot, rooms, outer_t, inner_t, height):
                out["walls"].append({"id": ids("w"), **w})
        # openings given at floor level, placed on the nearest wall
        for oi, spec in enumerate(f.get("openings") or []):
            op = f"{fp}.openings[{oi}]"
            o = _opening_from(rep, op, spec) if isinstance(spec, dict) else None
            if o is not None:
                _place_opening(rep, op, out["walls"], o, spec, ids)
        for di, spec in enumerate(f.get("devices") or []):
            d = _device(rep, f"{fp}.devices[{di}]", spec, ids)
            if d is not None:
                d["x"], d["z"] = round(d["x"] + ox, 3), round(d["z"] + oz, 3)
                out["devices"].append(d)
        out["stairs"] = _stairs_of_floor(rep, fp, f.get("stairs"), ids, ox, oz)
        _blocks_and_holes(rep, fp, f, out, ids)
        floors.append(out)

    if "roof" in b and not any(x["kind"] == "roof" for x in floors):
        floors.append({"id": ids("f"), "name": "Dach", "kind": "roof", "walls": [], "rooms": [], "devices": [], "blocks": [], "stairs": [],
                       "roof": _roof(rep, "building.roof", b["roof"])})
    for x in floors:                                      # "level" of a further roof: the index becomes the id of that floor
        for p in (x.get("roof") or {}).get("parts", []):
            idx = p.pop("levelIndex", None)
            if idx is not None:
                if idx in input_ids and next((y for y in floors if y["id"] == input_ids[idx]), {}).get("kind") != "roof":
                    p["level"] = input_ids[idx]
                else:
                    rep.warn("building.roof.parts", f"level {idx} is not a floor of the building, the roof sits on top")
    # basements first, the roof last, the rest keeps its order
    floors = [x for x in floors if x["kind"] == "basement"] + [x for x in floors if x["kind"] == "floor"] + [x for x in floors if x["kind"] == "roof"]
    if not any(x["kind"] != "roof" for x in floors) and not rep.errors:
        rep.error("building.floors", "needs at least one floor with rooms or walls")

    # plot: boundary + garden objects (objects go to the first floor above ground)
    plot = None
    pl = data.get("plot")
    if pl is not None:
        if not isinstance(pl, dict):
            rep.error("plot", "\"plot\" must be an object")
        else:
            boundary = _polygon(rep, "plot.boundary", pl.get("boundary"), "plot boundary", 4)
            plot = {"boundary": boundary} if boundary else None
            ground = next((x for x in floors if x["kind"] == "floor"), None)
            for oi, spec in enumerate(pl.get("objects") or []):
                d = _device(rep, f"plot.objects[{oi}]", spec, ids)
                if d is not None and ground is not None:
                    ground["devices"].append(d)

    # cables of the power add-on: "feeds" names the "id" of another device of the file
    keyed = {d["_key"]: d["id"] for fl in floors for d in fl["devices"] if "_key" in d}
    for fl in floors:
        for d in fl["devices"]:
            wanted = d.pop("_cables", [])
            d.pop("_key", None)
            for c in wanted:
                if c["to"] in keyed and keyed[c["to"]] != d["id"]:
                    d.setdefault("cables", []).append({"id": ids("c"), "to": keyed[c["to"]], **{k: v for k, v in c.items() if k != "to"}})
                else:
                    rep.warn("devices.cables", f"cable to '{c['to']}': no other device with that \"id\" in the file, skipped")

    # shift walls and rooms by the building origin (devices were shifted above, the plot keeps the plot frame)
    if ox or oz:
        for fl in floors:
            for w in fl["walls"]:
                w["a"] = [round(w["a"][0] + ox, 3), round(w["a"][1] + oz, 3)]
                w["b"] = [round(w["b"][0] + ox, 3), round(w["b"][1] + oz, 3)]
            for r in fl["rooms"] + fl.get("blocks", []) + fl.get("holes", []):
                r["points"] = [[round(p[0] + ox, 3), round(p[1] + oz, 3)] for p in r["points"]]
    for fl in floors:
        summary["rooms"] += len(fl["rooms"])
        summary["walls"] += len(fl["walls"])
        summary["openings"] += sum(len(w["openings"]) for w in fl["walls"])
        summary["devices"] += len(fl["devices"])
        summary["stairs"] += len(fl["stairs"])
    summary["floors"] = len(floors)
    if rep.errors:
        return None, None, rep, summary
    layout = {"version": 1, "floors": floors}
    if plot:
        layout["plot"] = plot
    return layout, plot, rep, summary


MAX_ROOF_PARTS = 8


def _roof(rep, path, spec, part=False):
    spec = spec if isinstance(spec, dict) else {}
    typ = spec.get("type", "gable")
    if typ not in ROOF_TYPES:
        rep.warn(f"{path}.type", f"unknown roof type '{typ}', using gable")
        typ = "gable"
    roof = {"type": typ, "pitch": float(spec["pitch"]) if _num(spec.get("pitch"), 5, 70) else 35.0,
            "overhang": float(spec["overhang"]) if _num(spec.get("overhang"), 0, 3) else 0.4}
    if spec.get("ridge") in ("x", "z"):
        roof["ridge"] = spec["ridge"]
    box = spec.get("box")
    if isinstance(box, dict) and all(_num(box.get(k), -1000, 1000) for k in ("x0", "x1", "z0", "z1")):
        if box["x1"] > box["x0"] and box["z1"] > box["z0"]:
            roof["box"] = {k: float(box[k]) for k in ("x0", "x1", "z0", "z1")}
        else:
            rep.warn(f"{path}.box", "roof box must have x1 > x0 and z1 > z0, ignored")
    elif box is not None:
        rep.warn(f"{path}.box", "roof box needs numbers x0, x1, z0, z1 (metres), ignored")
    dormers = _dormers(rep, f"{path}.dormers", spec.get("dormers")) if typ != "flat" else []
    if spec.get("dormers") and typ == "flat":
        rep.warn(f"{path}.dormers", "a flat roof has no dormers, ignored")
    if dormers:
        roof["dormers"] = dormers
    if part:
        name = spec.get("name")
        if isinstance(name, str) and name.strip():
            roof["name"] = name.strip()[:40]
        lvl = spec.get("level")
        if lvl is not None:
            if isinstance(lvl, int) and not isinstance(lvl, bool) and 0 <= lvl < MAX_FLOORS:
                roof["levelIndex"] = lvl                          # an index into building.floors, turned into a floor id at the end
            else:
                rep.warn(f"{path}.level", "level must be the index of a floor in building.floors, ignored (the roof sits on top)")
        return roof
    parts = spec.get("parts")
    if parts is not None:
        if not isinstance(parts, list):
            rep.warn(f"{path}.parts", "parts must be a list of roofs, ignored")
        else:
            if len(parts) > MAX_ROOF_PARTS:
                rep.warn(f"{path}.parts", f"only the first {MAX_ROOF_PARTS} further roofs are used")
            out = []
            for pi, ps in enumerate(parts[:MAX_ROOF_PARTS]):
                p = _roof(rep, f"{path}.parts[{pi}]", ps, part=True)
                if "box" not in p:
                    rep.warn(f"{path}.parts[{pi}]", "a further roof needs a box (x0, x1, z0, z1 in metres), ignored")
                    continue
                p["id"] = f"rp{len(out) + 1}"
                out.append(p)
            if out:
                roof["parts"] = out
    return roof


DORMER_TYPES = {"gable", "flat"}
MAX_DORMERS = 20


def _dormers(rep, path, raw):
    """Roof dormers (Gauben): side 0|1 (or "a"|"b"), pos 0..1 along the ridge, w/hw/eave in metres, type gable|flat, win bool."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        rep.warn(path, "dormers must be a list, ignored")
        return []
    out = []
    for i, d in enumerate(raw[:MAX_DORMERS]):
        dp = f"{path}[{i}]"
        if not isinstance(d, dict):
            rep.warn(dp, "dormer must be an object, ignored")
            continue
        side = d.get("side", 0)
        side = {"a": 0, "b": 1}.get(side.lower(), side) if isinstance(side, str) else side
        if side not in (0, 1) or isinstance(side, bool):
            rep.warn(f"{dp}.side", "side must be 0/1 (or \"a\"/\"b\"), using 0")
            side = 0
        typ = d.get("type", "gable")
        if typ not in DORMER_TYPES:
            rep.warn(f"{dp}.type", f"unknown dormer type '{typ}', using gable")
            typ = "gable"
        item = {"id": f"dm{i + 1}", "side": side, "type": typ, "win": d.get("win") is not False}
        for key, lo, hi, default in (("pos", 0, 1, 0.5), ("w", 0.6, 5, 1.6), ("hw", 0.4, 3, 1.2), ("eave", 0.2, 10, 0.8)):
            if key in d and not _num(d[key], lo, hi):
                rep.warn(f"{dp}.{key}", f"{key} must be a number between {lo} and {hi}, using {default}")
            item[key] = float(d[key]) if _num(d.get(key), lo, hi) else default
        out.append(item)
    if len(raw) > MAX_DORMERS:
        rep.warn(path, f"only the first {MAX_DORMERS} dormers are used")
    return out


# ---------------------------------------------------------------- GeoJSON
def geojson_to_property(data, name="Haus vom Grundstück"):
    """Polygons in lat/lon -> property JSON with plot + building outline in local metres (x east, z south)."""
    rings = []                                        # (ring, props)

    def add(geom, props):
        if not isinstance(geom, dict):
            return
        t = geom.get("type")
        if t == "Polygon" and geom.get("coordinates"):
            rings.append((geom["coordinates"][0], props))
        elif t == "MultiPolygon":
            for poly in geom.get("coordinates") or []:
                if poly:
                    rings.append((poly[0], props))
        elif t == "GeometryCollection":
            for g in geom.get("geometries") or []:
                add(g, props)

    t = data.get("type") if isinstance(data, dict) else None
    if t == "FeatureCollection":
        for f in data.get("features") or []:
            if isinstance(f, dict):
                add(f.get("geometry"), f.get("properties") or {})
    elif t == "Feature":
        add(data.get("geometry"), data.get("properties") or {})
    else:
        add(data, {})
    rings = [(r, p) for r, p in rings if isinstance(r, list) and len(r) >= 4 and all(isinstance(c, list) and len(c) >= 2 and _num(c[0], -180, 180) and _num(c[1], -90, 90) for c in r)]
    if not rings:
        raise ValueError("no polygons found in the GeoJSON")
    lat0 = sum(c[1] for r, _ in rings for c in r) / sum(len(r) for r, _ in rings)
    lon0 = sum(c[0] for r, _ in rings for c in r) / sum(len(r) for r, _ in rings)
    kx, kz = 111320.0 * math.cos(math.radians(lat0)), 110540.0

    def local(ring):
        pts = [[(c[0] - lon0) * kx, -(c[1] - lat0) * kz] for c in ring]
        if pts[0] == pts[-1]:
            pts.pop()
        return pts
    polys = [(local(r), p) for r, p in rings]
    by_role = {"plot": [], "building": []}
    for poly, props in polys:
        role = str(props.get("role", "")).lower()
        if role not in by_role:
            role = "building" if props.get("building") else ("plot" if props.get("landuse") or props.get("parcel") or props.get("plot") else "")
        if role:
            by_role[role].append(poly)
    rest = [p for p, pr in polys if not any(p is q for v in by_role.values() for q in v)]
    if rest:
        rest.sort(key=lambda q: -abs(_area(q)))
        if not by_role["plot"] and not by_role["building"] and len(rest) > 1:
            by_role["plot"].append(rest[0])
            by_role["building"] += rest[1:]
        elif not by_role["plot"] and by_role["building"] and abs(_area(rest[0])) > max(abs(_area(b)) for b in by_role["building"]):
            by_role["plot"].append(rest[0])       # unlabelled, bigger than the marked building -> the plot
            by_role["building"] += rest[1:]
        else:
            by_role["building"] += rest
    if not by_role["building"]:
        raise ValueError("no building polygon found (mark one with properties.building or role: \"building\")")
    building = max(by_role["building"], key=lambda q: abs(_area(q)))
    plot = max(by_role["plot"], key=lambda q: abs(_area(q))) if by_role["plot"] else None
    ref = plot or building
    mx, mz = min(p[0] for p in ref), min(p[1] for p in ref)
    sh = lambda poly: [[round(p[0] - mx, 2), round(p[1] - mz, 2)] for p in poly]
    foot = sh(building)
    out = {"schemaVersion": SCHEMA_VERSION, "name": name,
           "building": {"footprint": foot, "roof": {"type": "gable", "pitch": 35},
                        "floors": [{"name": "Erdgeschoss", "kind": "floor", "rooms": [{"name": "Haus", "points": foot}]}]}}
    if plot:
        out["plot"] = {"boundary": sh(plot)}
    return out


# ---------------------------------------------------------------- export
def layout_to_property(layout, name="Haus"):
    """Existing layout -> property JSON (walls explicit, so importing it again reproduces the plan). Background pictures are not part of the format."""
    all_ids = {d.get("id") for f in layout.get("floors", []) for d in f.get("devices", [])}

    def cables_of(d):                                   # `feeds` (first version) counts as one air cable
        cs = d.get("cables") if isinstance(d.get("cables"), list) else ([{"to": d["feeds"], "route": "air"}] if d.get("feeds") else [])
        return [c for c in cs if isinstance(c, dict) and c.get("to") in all_ids]
    feeding = {c["to"] for f in layout.get("floors", []) for d in f.get("devices", []) for c in cables_of(d)}    # devices a cable ends at keep their id
    floors = []
    index_of = {f.get("id"): i for i, f in enumerate(layout.get("floors", []))}      # a further roof names its floor by id, the format by index
    for f in layout.get("floors", []):
        kind = f.get("kind") if f.get("kind") in FLOOR_KINDS else "floor"
        item = {"name": f.get("name", ""), "kind": kind}
        if kind == "roof":
            item["roof"] = dict(f.get("roof") or {"type": "gable", "pitch": 35, "overhang": 0.4})
            if item["roof"].get("parts"):
                item["roof"]["parts"] = [{**{k: v for k, v in p.items() if k not in ("id", "level")},
                                          **({"level": index_of[p["level"]]} if p.get("level") in index_of else {})} for p in item["roof"]["parts"]]
            floors.append(item)
            continue
        item["rooms"] = [{k: r[k] for k in ("name", "points", "color", "area", "terrace") if k in r} for r in f.get("rooms", [])]
        item["walls"] = []
        for w in f.get("walls", []):
            ow = {"a": w["a"], "b": w["b"], "thickness": w.get("thickness", 0.2), "height": w.get("height", 2.6), "openings": []}
            for o in w.get("openings", []):
                oo = {k: o[k] for k in ("type", "style", "width", "height", "sill", "pos", "entity", "name", "paneEntities") if k in o}
                ow["openings"].append(oo)
            item["walls"].append(ow)
        item["devices"] = []
        for d in f.get("devices", []):
            od = {k: d[k] for k in ("type", "x", "z") + DEVICE_NUMBERS + DEVICE_STRINGS + DEVICE_FLAGS + ("panels", "pts", "closed", "segs", "inset", "legs", "upper", "depth", "cols", "rows", "mount") if k in d and d[k] not in (None, "")}
            cs = cables_of(d)
            if cs or d["id"] in feeding:
                od["id"] = d["id"]
            if cs:
                od["cables"] = [{"to": c["to"], "route": c.get("route") if c.get("route") in CABLE_ROUTES else "floor",
                                 **({"kind": c["kind"]} if c.get("kind") in CABLE_KINDS else {}),
                                 **({"entity": c["entity"]} if c.get("entity") else {})} for c in cs]
            item["devices"].append(od)
        stairs = []
        for st in f.get("stairs", []):
            if st.get("type") not in STAIR_TYPES or not (_num(st.get("x")) and _num(st.get("z"))):
                continue
            os_ = {k: st[k] for k in ("type", "x", "z", "rot", "w", "tread", "turn", "dir", "floors", "name") if k in st and st[k] not in (None, "")}
            if st["type"] == "wall" and isinstance(st.get("path"), list):
                os_["path"] = st["path"]
                if _num(st.get("landing")) and st["landing"] > 0:
                    os_["landing"] = st["landing"]
            stairs.append(os_)
        if stairs:
            item["stairs"] = stairs
        for key, keys in (("blocks", ("name", "points", "h")), ("holes", ("points",))):
            if f.get(key):
                item[key] = [{k: b[k] for k in keys if k in b} for b in f[key] if isinstance(b.get("points"), list)]
        floors.append(item)
    out = {"schemaVersion": SCHEMA_VERSION, "name": name, "building": {"floors": floors}}
    if layout.get("plot", {}).get("boundary"):
        out["plot"] = {"boundary": layout["plot"]["boundary"]}
    return out
