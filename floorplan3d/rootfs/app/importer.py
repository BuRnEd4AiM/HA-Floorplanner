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
    "window":      {"type": "window", "style": "single",  "width": 1.0, "height": 1.2,  "sill": 0.9},
    "window2":     {"type": "window", "style": "double",  "width": 1.8, "height": 1.2,  "sill": 0.9},
    "window3":     {"type": "window", "style": "triple",  "width": 2.4, "height": 1.2,  "sill": 0.9},
    "windowTall":  {"type": "window", "style": "double",  "width": 1.8, "height": 2.1,  "sill": 0},
    "windowBath":  {"type": "window", "style": "single",  "width": 0.6, "height": 0.6,  "sill": 1.5},
    "windowFixed": {"type": "window", "style": "fixed",   "width": 1.6, "height": 1.4,  "sill": 0.6},
}
DOOR_STYLES = {"single", "glass", "double", "sliding", "open"}
WINDOW_STYLES = {"single", "double", "triple", "fixed"}
ROOF_TYPES = {"gable", "hip", "flat"}
FLOOR_KINDS = {"floor", "basement", "roof"}
ROOM_COLORS = ["#b89b74", "#c9c2b4", "#8fb1c2", "#a99bb8", "#9db39a", "#c2a58f", "#9fb0c9", "#b7b08f"]
# optional device fields that are copied when they have the right type
DEVICE_NUMBERS = ("y", "rot", "scale", "sx", "sy", "sz", "tiltX", "tiltZ", "w", "ar")
DEVICE_STRINGS = ("name", "entity", "ledEntity", "img", "group")
DEVICE_FLAGS = ("mirror", "locked", "hideModel")


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
    if abs(_area(poly)) < min_area:
        rep.error(path, f"{name} is too small or degenerate (area under {min_area} m²)")
        return None
    if _self_intersects(poly):
        rep.error(path, f"{name} crosses itself")
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
    return d


# ---------------------------------------------------------------- main entry
def build_layout(data):
    """Return (layout, plot, report, summary). `layout` is None when there are errors."""
    rep = Report()
    seq: dict = {}

    def ids(prefix):
        seq[prefix] = seq.get(prefix, 0) + 1
        return f"{prefix}{seq[prefix]}"

    summary = {"floors": 0, "rooms": 0, "walls": 0, "openings": 0, "devices": 0}
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
        out = {"id": ids("f"), "name": name, "kind": kind, "walls": [], "rooms": [], "devices": [], "blocks": [], "stairs": []}
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
        floors.append(out)

    if "roof" in b and not any(x["kind"] == "roof" for x in floors):
        floors.append({"id": ids("f"), "name": "Dach", "kind": "roof", "walls": [], "rooms": [], "devices": [], "blocks": [], "stairs": [],
                       "roof": _roof(rep, "building.roof", b["roof"])})
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

    # shift walls and rooms by the building origin (devices were shifted above, the plot keeps the plot frame)
    if ox or oz:
        for fl in floors:
            for w in fl["walls"]:
                w["a"] = [round(w["a"][0] + ox, 3), round(w["a"][1] + oz, 3)]
                w["b"] = [round(w["b"][0] + ox, 3), round(w["b"][1] + oz, 3)]
            for r in fl["rooms"]:
                r["points"] = [[round(p[0] + ox, 3), round(p[1] + oz, 3)] for p in r["points"]]
    for fl in floors:
        summary["rooms"] += len(fl["rooms"])
        summary["walls"] += len(fl["walls"])
        summary["openings"] += sum(len(w["openings"]) for w in fl["walls"])
        summary["devices"] += len(fl["devices"])
    summary["floors"] = len(floors)
    if rep.errors:
        return None, None, rep, summary
    layout = {"version": 1, "floors": floors}
    if plot:
        layout["plot"] = plot
    return layout, plot, rep, summary


def _roof(rep, path, spec):
    spec = spec if isinstance(spec, dict) else {}
    typ = spec.get("type", "gable")
    if typ not in ROOF_TYPES:
        rep.warn(f"{path}.type", f"unknown roof type '{typ}', using gable")
        typ = "gable"
    roof = {"type": typ, "pitch": float(spec["pitch"]) if _num(spec.get("pitch"), 5, 70) else 35.0,
            "overhang": float(spec["overhang"]) if _num(spec.get("overhang"), 0, 3) else 0.4}
    if spec.get("ridge") in ("x", "z"):
        roof["ridge"] = spec["ridge"]
    return roof


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
    """Existing layout -> property JSON (walls explicit, so importing it again reproduces the plan). Stairs, blocks and
    background pictures are not part of the format."""
    floors = []
    for f in layout.get("floors", []):
        kind = f.get("kind") if f.get("kind") in FLOOR_KINDS else "floor"
        item = {"name": f.get("name", ""), "kind": kind}
        if kind == "roof":
            item["roof"] = f.get("roof") or {"type": "gable", "pitch": 35, "overhang": 0.4}
            floors.append(item)
            continue
        item["rooms"] = [{k: r[k] for k in ("name", "points", "color", "area") if k in r} for r in f.get("rooms", [])]
        item["walls"] = []
        for w in f.get("walls", []):
            ow = {"a": w["a"], "b": w["b"], "thickness": w.get("thickness", 0.2), "height": w.get("height", 2.6), "openings": []}
            for o in w.get("openings", []):
                oo = {k: o[k] for k in ("type", "style", "width", "height", "sill", "pos", "entity", "name", "paneEntities") if k in o}
                ow["openings"].append(oo)
            item["walls"].append(ow)
        item["devices"] = []
        for d in f.get("devices", []):
            od = {k: d[k] for k in ("type", "x", "z") + DEVICE_NUMBERS + DEVICE_STRINGS + DEVICE_FLAGS + ("panels",) if k in d and d[k] not in (None, "")}
            item["devices"].append(od)
        floors.append(item)
    out = {"schemaVersion": SCHEMA_VERSION, "name": name, "building": {"floors": floors}}
    if layout.get("plot", {}).get("boundary"):
        out["plot"] = {"boundary": layout["plot"]["boundary"]}
    return out
