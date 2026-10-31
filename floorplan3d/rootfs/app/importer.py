"""Property JSON  ->  3D Floorplan layout (and back).

Pure functions, no I/O besides reading models.js, scandi.js, leisure.js and garage.js once for the list of device types.
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
WINDOW_HINGES = {"bottom", "top", "left", "right"}
PANE_HINGES = WINDOW_HINGES | {"fixed"}
PANE_COUNTS = {"single": 1, "double": 2, "triple": 3, "fixed": 1}
SHUTTER_STYLES = {"roller", "left", "right", "split"}
MAX_PANES = 8
ROOF_TYPES = {"gable", "hip", "flat"}
FLOOR_KINDS = {"floor", "basement", "roof"}
ROOM_COLORS = ["#b89b74", "#c9c2b4", "#8fb1c2", "#a99bb8", "#9db39a", "#c2a58f", "#9fb0c9", "#b7b08f"]
# the finishes of floors, walls and the facade (#448): the same patterns as PATTERNS in static/finishes.js, with the places they go
# (tests/test_import.py checks it); the floor coverings of a room (#427) are the ones for floors
_F, _W, _A, _WA = ("floor",), ("wall",), ("facade",), ("wall", "facade")
FINISHES = {
    **{k: _F for k in ("parquet", "parquetLight", "parquetDark", "plankWide", "herringbone", "chevron", "basket", "laminate", "deck", "cork",
                       "tiles", "tilesSmall", "tilesDark", "tilesLarge", "tilesWood", "checker", "hexFloor", "mosaic", "cement", "terrazzo",
                       "marble", "slate", "stoneSlabs", "flagstone", "paving", "cobble", "concrete", "carpet", "carpetTiles")},
    "paint": _WA, "woodchip": _W, "plaster": _WA, "limewash": _W, "concreteWall": _WA,
    **{k: _W for k in ("wpStripes", "wpDamask", "wpDots", "wpDiamond", "wpLeaves", "wpScallop", "wpZigzag", "wpPlaid", "wpLinen",
                       "wTiles", "wTilesSmall", "wMetro", "wMetroHerring", "wTilesLarge", "wHex", "wMosaic", "wMarble", "wZellige")},
    **{k: _WA for k in ("brick", "brickWhite", "brickDark", "brickYellow", "stoneWall")},
    "woodPanel": _W, "woodSlats": _W,
    **{k: _A for k in ("woodCladding", "woodGrey", "shingles", "facadePanels")},
}
COVERINGS = tuple(k for k, on in FINISHES.items() if "floor" in on)
FACADE_FINISHES = tuple(k for k, on in FINISHES.items() if "facade" in on)
_HEX6 = re.compile(r"#[0-9a-fA-F]{6}")


def _isnum(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def clean_look(v):
    """the changes to a pattern (colour, second colour, size of one element in metres, angle): only what is valid; None when nothing is"""
    if not isinstance(v, dict):
        return None
    o = {k: v[k].lower() for k in ("color", "color2") if isinstance(v.get(k), str) and _HEX6.fullmatch(v[k])}
    if _isnum(v.get("size")):
        o["size"] = round(min(5.0, max(0.01, float(v["size"]))), 3)
    if _isnum(v.get("angle")):
        o["angle"] = round(float(v["angle"]) % 360, 1)
    return o or None


def clean_finish(v, where):
    """a finish {pattern, color, color2, size, angle} for a floor, wall, facade or side (one side of a wall: wall and facade patterns)"""
    if not isinstance(v, dict) or not isinstance(v.get("pattern"), str) or v["pattern"] not in FINISHES:
        return None
    on = FINISHES[v["pattern"]]
    if not (any(o != "floor" for o in on) if where == "side" else where in on):
        return None
    return {"pattern": v["pattern"], **(clean_look(v) or {})}


def clean_below(v):
    """the lower part of the walls of a room: a wall finish with its height (5 cm .. 3 m, 1.20 m when none is given)"""
    f = clean_finish(v, "wall")
    if f:
        f["height"] = round(min(3.0, max(0.05, float(v["height"]) if _isnum(v.get("height")) else 1.2)), 2)
    return f


def clean_faces(v):
    """the two sides of one wall (an accent wall): {left, right}, None when neither is valid"""
    if not isinstance(v, dict):
        return None
    o = {k: f for k in ("left", "right") if (f := clean_finish(v.get(k), "side"))}
    return o or None
# optional device fields that are copied when they have the right type
DEVICE_NUMBERS = ("y", "rot", "scale", "sx", "sy", "sz", "tiltX", "tiltZ", "w", "ar", "fov", "range", "len", "rise", "armSwing", "armReach", "armTilt", "h", "land")
DEVICE_STRINGS = ("name", "entity", "ledEntity", "motionEntity", "img", "batPower")
DEVICE_FLAGS = ("mirror", "locked", "hideModel", "batInvert", "noRail")
CABLE_ROUTES = ("floor", "through", "air")
ROOM_MAX_RAISE = 3                                                # LEVELS.maxRaise in static/levels.js (#566)
PLATEAU_MAX_RISE = 5                                              # LEVELS.maxRise
PLATEAU_EDGES = ("wall", "slope")                                 # EDGES
PLATEAU_WALLS = ("stone", "concrete", "brick", "gabion")          # WALL_KEYS
CABLE_KINDS = ("grid", "solar", "battery", "load")
STAIR_TYPES = ("straight", "L", "U", "spiral", "wall")           # same as STAIR_TYPES in static/stairs.js
STAIR_MAX_FLOORS = 6                                              # MAX_FLOORS in static/stairs.js
STAIR_TREAD = (0.1, 0.45)                                         # MIN_TREAD / MAX_TREAD in static/stairs.js
STAIR_MAX_LANDING = 3                                             # MAX_LANDING in static/stairs.js
MAX_STAIR_POINTS = 30
SOLAR_MAX_FIELD = 12                                              # MAX_FIELD in static/solarroof.js
SOLAR_MOUNTS = ("auto", "flat", "stand")                          # MOUNTS in static/solarroof.js
YARD_SURFACES = ("lawn", "paving", "cobble", "slabs", "flagstone", "deck", "gravel", "bed", "concrete", "asphalt", "sand", "water")   # SURFACE_KEYS in static/yard.js (#538)
YARD_MAX_AREAS = 60                                               # MAX_AREAS in static/yard.js
MAX_PER_FLOOR = 100                                               # stairs, blocks and floor openings per floor
MAX_LED_ZONES = 8                                                 # LED zones of a piece (leds in static/leisure.js, ledzones.js)
KITCHEN_MODULES = ("base", "drawers", "sink", "stove", "dish", "fridge", "tall", "gap")   # same as MOD_W in static/kitchen.js (checked by a test)
CLOSET_FILLS = ("rail", "rail2", "shelves", "drawers", "empty")   # the cabinet builder: same as FILLS, FRONTS, SIDES ... in static/closet.js (checked by a test)
CLOSET_FRONTS = ("door", "glass", "mirror", "open")
CLOSET_SIDES = ("left", "right", "back", "front")
CLOSET_HANDLES = ("bar", "knob", "long", "none")
CLOSET_METALS = ("steel", "black", "brass")
CLOSET_DOORS = ("hinged", "sliding")


def _load_device_types() -> dict:
    """type -> default height, read from the frontend's models.js (and scandi.js, the furniture in Scandinavian style, leisure.js: sauna,
    fitness, bar, cinema, PC, LED mirrors, and garage.js: vehicles, workshop, carport) so they never drift apart."""
    types = {}
    static = Path(__file__).parent / "static"
    try:
        text = (static / "models.js").read_text(encoding="utf-8")
        for m in re.finditer(r"^\s+(\w+):\s*\{\s*label:\s*'[^']*',\s*y:\s*([\d.]+)(,\s*hidden:\s*true)?\s*\}", text, re.M):
            if not m.group(3):
                types[m.group(1)] = float(m.group(2))
        for name in ("scandi.js", "leisure.js", "garage.js"):
            for m in re.finditer(r"^  (\w+): \{ cat: '\w+',(.*)$", (static / name).read_text(encoding="utf-8"), re.M):
                y = re.search(r"\by: ([\d.]+),", m.group(2))
                types[m.group(1)] = float(y.group(1)) if y else 0.0
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


def _closet(src: dict) -> dict:
    """a cabinet built in the editor ("cab" of type closet), cleaned like cleanCloset in static/closet.js: columns (width, inside, front,
    hinge), height, depth, plinth, up to two roof slopes (one per side) and the look; anything unknown back to its default"""
    def num(v, lo, hi, default):
        return round(min(hi, max(lo, float(v))), 3) if _num(v) else default
    cols = []
    for c in (src.get("cols") if isinstance(src.get("cols"), list) else [])[:12]:
        c = c if isinstance(c, dict) else {}
        fill = c.get("fill") if c.get("fill") in CLOSET_FILLS else "shelves"
        o = {"w": num(c.get("w"), 0.15, 2, 0.5), "fill": fill}
        if fill == "shelves":
            o["n"] = int(round(num(c.get("n"), 0, 12, 4)))
        if fill == "drawers":
            o["n"] = int(round(num(c.get("n"), 1, 10, 4)))
        else:
            low = int(round(num(c.get("low"), 0, 6, 0)))
            if low:
                o["low"] = low
            o["front"] = c.get("front") if c.get("front") in CLOSET_FRONTS else "door"
        if c.get("hinge") in ("l", "r"):
            o["hinge"] = c["hinge"]
        cols.append(o)
    if not cols:                                         # the three-door wardrobe a new cabinet starts as
        cols = [{"w": 0.5, "fill": "rail", "front": "door"}, {"w": 0.5, "fill": "shelves", "n": 3, "low": 2, "front": "door"}, {"w": 0.5, "fill": "rail", "front": "door"}]
    h = num(src.get("h"), 0.3, 3.5, 2.2)
    slopes, seen = [], set()
    for q in src.get("slopes") if isinstance(src.get("slopes"), list) else []:
        if isinstance(q, dict) and q.get("side") in CLOSET_SIDES and q["side"] not in seen and len(slopes) < 2:
            seen.add(q["side"])
            slopes.append({"side": q["side"], "low": min(num(q.get("low"), 0.1, 3.5, 1), h), "deg": num(q.get("deg"), 5, 75, 35)})
    colour = lambda v: v.lower() if isinstance(v, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", v) else "#f1efe9"
    pick = lambda v, opts: v if v in opts else opts[0]
    return {"cols": cols, "h": h, "d": num(src.get("d"), 0.2, 1.2, 0.6), "plinth": min(num(src.get("plinth"), 0, 0.25, 0.08), round(h / 3, 3)),
            "slopes": slopes, "body": colour(src.get("body")), "front": colour(src.get("front")), "handle": pick(src.get("handle"), CLOSET_HANDLES),
            "metal": pick(src.get("metal"), CLOSET_METALS), "doors": pick(src.get("doors"), CLOSET_DOORS), "led": src.get("led") is True}


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
def derive_walls(footprint, rooms, outer_t, inner_t, height, open_rooms=frozenset()):
    """Wall centre lines from the outline and the room polygons. Shared edges become ONE wall, T-junctions split walls.
    `open_rooms`: indices of roof terraces, open areas with a railing: an edge that only they touch gets no wall."""
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
        in_rooms = src - {"foot"}
        if in_rooms and in_rooms <= open_rooms:
            continue                                # the open side of a roof terrace: its railing, not a wall
        outer = ("foot" in src) if footprint else (len(in_rooms - open_rooms) == 1)
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
        o["paneEntities"] = [str(x)[:120] if isinstance(x, str) else "" for x in spec["paneEntities"][:MAX_PANES]]
    shutter_entity = spec.get("shutterEntity") if isinstance(spec.get("shutterEntity"), str) else ""
    cover = spec.get("shutter") is True or bool(shutter_entity)
    if cover:                                                     # cover of a window (#331), with its own entity
        if o["type"] != "window":
            rep.warn(f"{path}.shutter", "only windows have a cover, ignored")
        else:
            o["shutter"] = True
            if shutter_entity:
                o["shutterEntity"] = shutter_entity[:120]
    if "shutterStyle" in spec:
        style = spec["shutterStyle"]
        if o["type"] != "window":
            rep.warn(f"{path}.shutterStyle", "only windows have a curtain type, ignored")
        elif not cover:
            rep.warn(f"{path}.shutterStyle", "a curtain type needs a cover (shutter / shutterEntity), ignored")
        elif not isinstance(style, str) or style not in SHUTTER_STYLES:
            rep.warn(f"{path}.shutterStyle", f"unknown curtain type '{style}', using 'roller'")
        elif style != "roller":                                   # roller is the default and is not stored
            o["shutterStyle"] = style
    if o["type"] == "window":
        base_panes = PANE_COUNTS.get(o.get("style"), 2)
        pane_count = base_panes
        if o.get("style") == "fixed":
            o.pop("paneEntities", None)                           # fixed glazing has no contact per pane
        if "panes" in spec:
            panes = spec["panes"]
            whole = isinstance(panes, (int, float)) and not isinstance(panes, bool) and float(panes).is_integer()
            if not whole or not 1 <= int(panes) <= MAX_PANES:
                rep.warn(f"{path}.panes", f"panes must be a whole number between 1 and {MAX_PANES}, ignored")
            elif o.get("style") == "fixed":
                rep.warn(f"{path}.panes", "fixed glazing has one pane, panes ignored")
            else:
                pane_count = int(panes)
                if pane_count != base_panes:
                    o["panes"] = pane_count                       # the style's own count is the default and is not stored
        if "hinge" in spec:
            hinge = spec["hinge"]
            if not isinstance(hinge, str) or hinge not in WINDOW_HINGES:
                rep.warn(f"{path}.hinge", f"unknown hinge '{hinge}', using 'bottom'")
            elif hinge != "bottom":                               # bottom is the default and is not stored
                o["hinge"] = hinge
        if "paneHinges" in spec:
            hs = spec["paneHinges"]
            if not isinstance(hs, list):
                rep.warn(f"{path}.paneHinges", "paneHinges must be an array, ignored")
            elif o.get("style") == "fixed":
                rep.warn(f"{path}.paneHinges", "fixed glazing does not open, paneHinges ignored")
            elif pane_count <= 1:
                rep.warn(f"{path}.paneHinges", "a single-pane window has no per-pane hinges, ignored")
            else:
                if len(hs) > pane_count:
                    rep.warn(f"{path}.paneHinges", f"more entries than panes ({pane_count}), extra entries ignored")
                clean = []
                for i, h in enumerate(hs[:pane_count]):
                    if isinstance(h, str) and h in PANE_HINGES:
                        clean.append(h)
                    else:
                        rep.warn(f"{path}.paneHinges[{i}]", f"unknown hinge '{h}', using 'bottom'")
                        clean.append("bottom")
                if "paneEntities" in o:                           # a fixed pane has no contact of its own
                    for i, h in enumerate(clean):
                        if h == "fixed" and i < len(o["paneEntities"]):
                            o["paneEntities"][i] = ""
                    if not any(o["paneEntities"]):
                        del o["paneEntities"]
                if any(h != "bottom" for h in clean):
                    o["paneHinges"] = clean
        if "paneEntities" in o and len(o["paneEntities"]) > pane_count:   # no contacts of panes that do not exist
            o["paneEntities"] = o["paneEntities"][:pane_count]
            if not any(o["paneEntities"]):
                del o["paneEntities"]
        if spec.get("rainWarn") is False:                         # this window may stay open in the rain: no warning for it (#419)
            o["rainWarn"] = False
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
    if isinstance(spec.get("lightColor"), str) and re.fullmatch(r"#[0-9a-fA-F]{6}", spec["lightColor"]):
        d["lightColor"] = spec["lightColor"].lower()   # the colour of a lamp that reports none, e.g. one on a relay (#367)
    if isinstance(spec.get("finish"), str) and re.fullmatch(r"[a-z]{2,20}", spec["finish"]):
        d["finish"] = spec["finish"]                   # the finish of a piece in Scandinavian style (oak, white ...; scandi.js knows which)
    if isinstance(spec.get("variant"), str) and re.fullmatch(r"[a-z0-9]{2,20}", spec["variant"]):
        d["variant"] = spec["variant"]                 # how a piece is built (the PC desk: its monitors, MONITOR_LAYOUTS; a bar: what hangs over it, BAR_CEILINGS in leisure.js)
    if isinstance(spec.get("tvSize"), (str, int)) and re.fullmatch(r"[0-9]{2}", str(spec["tvSize"])):
        d["tvSize"] = str(spec["tvSize"])             # the size of a TV on a swivel arm in inches (tvmount.js: 43 ... 85, an unknown one shows 55)
    if isinstance(spec.get("leds"), list):            # the entities of the LED zones of a piece (a mirror, the bar ...; ledzones.js), "" follows "entity"
        leds = [e[:120] if isinstance(e, str) else "" for e in spec["leds"][:MAX_LED_ZONES]]
        while leds and not leds[-1]:
            leds.pop()
        if leds:
            d["leds"] = leds
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
        def module(m):                                   # a name, or {"m": name, "w": width in metres, "up": false} for a resized module
            if isinstance(m, str):                       # or one without a wall cabinet above it (#372)
                return m if m in KITCHEN_MODULES else None
            if not isinstance(m, dict) or m.get("m") not in KITCHEN_MODULES or ("w" in m and not _num(m.get("w"), 0.3, 2.4)):
                return None
            out = {"m": m["m"], **({"w": round(float(m["w"]), 2)} if "w" in m else {}), **({"up": False} if m.get("up") is False else {})}
            return out if len(out) > 1 else m["m"]
        legs = [[x for x in map(module, leg) if x is not None][:16] for leg in (spec.get("legs") or [])[:3] if isinstance(leg, list)]
        d["legs"] = [lg for lg in legs if lg] or [["base", "sink", "dish", "base", "stove", "base", "fridge"]]
        d["upper"] = spec.get("upper") is not False
        if _num(spec.get("depth"), 0.4, 1.2):
            d["depth"] = float(spec["depth"])
    if typ == "closet":                                  # a cabinet built in the editor (static/closet.js)
        d["cab"] = _closet(spec.get("cab") if isinstance(spec.get("cab"), dict) else {})
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
    if "landing" in spec and typ in ("wall", "L", "U"):     # wall: flat after every bend for this long (#210); L / U: a deeper landing at the turn (#229)
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
        if kind == "roof":                              # the roof, and what stands up here: solar panels on the roof, a loft's rooms and things
            out["roof"] = _roof(rep, f"{fp}.roof", f.get("roof", {}))
            for key in ("stairs", "blocks", "holes"):
                if f.get(key):
                    rep.warn(f"{fp}.{key}", f"a roof floor has no {key}: ignored")
        # rooms
        rooms = []
        open_rooms = set()
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
                open_rooms.add(len(rooms))
            if _num(r.get("raise"), -ROOM_MAX_RAISE, ROOM_MAX_RAISE) and abs(float(r["raise"])) >= 0.01:
                room["raise"] = round(float(r["raise"]), 2)     # its floor higher (or lower) than the storey (#566)
                if r.get("steps") is False:
                    room["steps"] = False                       # ... without steps at its doors
            elif "raise" in r:
                rep.warn(f"{rp}.raise", "raise must be a number from -%g to %g (m): ignored" % (ROOM_MAX_RAISE, ROOM_MAX_RAISE))
            if r.get("covering") in COVERINGS:
                room["covering"] = r["covering"]                # the floor: parquet, tiles, stone ... instead of one colour (#427)
                if (look := clean_look(r.get("floorLook"))):
                    room["floorLook"] = look                    # ... its colour, size and angle (#448)
            if (wl := clean_finish(r.get("wallLook"), "wall")):
                room["wallLook"] = wl                           # the walls: paint, woodchip, wallpaper, tiles ... (#448)
            if (wb := clean_below(r.get("wallBelow"))):
                room["wallBelow"] = wb                          # ... and below a height something else
            out["rooms"].append(room)
            rooms.append(poly)
        # walls: explicit list wins, otherwise derived from outline + rooms (the building's outline is not the roof floor's)
        foot = _polygon(rep, f"{fp}.footprint", f["footprint"], "footprint", 4) if "footprint" in f else (default_foot if kind != "roof" else None)
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
                    if (faces := clean_faces(w.get("faces"))):
                        wall["faces"] = faces                   # one side of this wall otherwise: an accent wall (#448)
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
            for w in derive_walls(foot, rooms, outer_t, inner_t, height, open_rooms):
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
        if kind != "roof":
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
            boundary = _polygon(rep, "plot.boundary", pl.get("boundary"), "plot boundary", 4) if pl.get("boundary") is not None else None
            plot = {"boundary": boundary} if boundary else {}
            areas, raw = [], pl.get("areas")
            if raw is not None and not isinstance(raw, list):
                rep.error("plot.areas", "\"areas\" must be a list of areas")
                raw = []
            for ai, a in enumerate(raw or []):
                if not isinstance(a, dict) or len(areas) >= YARD_MAX_AREAS:
                    rep.warn(f"plot.areas[{ai}]", "skipped: an area is an object, at most %d of them" % YARD_MAX_AREAS)
                    continue
                pts = _polygon(rep, f"plot.areas[{ai}].points", a.get("points"), "area", 0.05)
                if not pts:
                    continue
                surface = a.get("surface")
                if surface not in YARD_SURFACES:
                    rep.warn(f"plot.areas[{ai}].surface", f"unknown surface {surface!r}, paving used (known: {', '.join(YARD_SURFACES)})")
                    surface = "paving"
                area = {"id": ids("y"), "name": str(a.get("name") or "").strip()[:40], "surface": surface, "points": pts}
                if "rise" in a:                                 # a plateau (#566): its height over the lawn, its edge, the wall's look
                    if _num(a.get("rise"), 0.01, PLATEAU_MAX_RISE):
                        area["rise"] = round(float(a["rise"]), 2)
                        area["edge"] = a.get("edge") if a.get("edge") in PLATEAU_EDGES else "wall"
                        area["wall"] = a.get("wall") if a.get("wall") in PLATEAU_WALLS else "stone"
                    else:
                        rep.warn(f"plot.areas[{ai}].rise", "rise must be a number from 0.01 to %g (m): ignored" % PLATEAU_MAX_RISE)
                areas.append(area)
            if areas:
                plot["areas"] = areas
            plot = plot or None
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
            roof = fl.get("roof") or {}
            for box in [roof.get("box")] + [p.get("box") for p in roof.get("parts", [])]:     # a roof's base box is in building metres too
                if box:
                    box.update(x0=round(box["x0"] + ox, 3), x1=round(box["x1"] + ox, 3), z0=round(box["z0"] + oz, 3), z1=round(box["z1"] + oz, 3))
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
    if not part:
        steps = _steps(rep, f"{path}.steps", spec.get("steps"), typ)
        if steps:
            roof["steps"] = steps
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


MAX_STEPS = 20


def _steps(rep, path, raw, typ):
    """Steps in the eaves (#342, house narrower at the front): side 0|1 (or "a"|"b"), at = metres along the ridge from the gable at the
    low end of the ridge axis, out = metres the eave lies further out from there on (negative: in). Not on a hip roof."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        rep.warn(path, "steps must be a list, ignored")
        return []
    if typ == "hip":
        rep.warn(path, "a hip roof has no steps, ignored")
        return []
    out = []
    for i, st in enumerate(raw[:MAX_STEPS]):
        sp = f"{path}[{i}]"
        side = st.get("side", 0) if isinstance(st, dict) else None
        side = {"a": 0, "b": 1}.get(side.lower(), side) if isinstance(side, str) else side
        if not isinstance(st, dict) or side not in (0, 1) or isinstance(side, bool) or not _num(st.get("at"), 0, 1000) or not _num(st.get("out"), -20, 20):
            rep.warn(sp, "a step needs side 0/1 (or \"a\"/\"b\"), at (0 to 1000 m) and out (-20 to 20 m), ignored")
            continue
        out.append({"side": side, "at": float(st["at"]), "out": float(st["out"])})
    if len(raw) > MAX_STEPS:
        rep.warn(path, f"only the first {MAX_STEPS} steps are used")
    return out


DORMER_TYPES = {"gable", "flat", "shed"}
MAX_DORMERS = 20


def _dormers(rep, path, raw):
    """Roof dormers (Gauben): side 0|1 (or "a"|"b"), pos 0..1 along the ridge, w/hw/eave in metres, type gable|flat|shed, win bool;
    a shed dormer (Schleppgaube, #339) also has sp, the pitch of its roof in degrees. The app keeps a gable dormer at most 5 m wide."""
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
        nums = (("pos", 0, 1, 0.5), ("w", 0.6, 30, 1.6), ("hw", 0.4, 3, 1.2), ("eave", 0.2, 10, 0.8)) + ((("sp", 2, 60, 15),) if typ == "shed" else ())
        for key, lo, hi, default in nums:
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
            if not (f.get("rooms") or f.get("walls") or f.get("devices")):      # a plain roof; otherwise also its solar panels, a loft's rooms
                floors.append(item)
                continue
        item["rooms"] = [{k: r[k] for k in ("name", "points", "color", "area", "terrace", "raise", "steps", "covering", "floorLook", "wallLook", "wallBelow") if k in r} for r in f.get("rooms", [])]
        item["walls"] = []
        for w in f.get("walls", []):
            ow = {"a": w["a"], "b": w["b"], "thickness": w.get("thickness", 0.2), "height": w.get("height", 2.6), "openings": [], **({"faces": w["faces"]} if w.get("faces") else {})}
            for o in w.get("openings", []):
                oo = {k: o[k] for k in ("type", "style", "panes", "hinge", "paneHinges", "width", "height", "sill", "pos", "entity", "name", "paneEntities", "shutter", "shutterEntity", "shutterStyle", "rainWarn", "heat") if k in o}
                ow["openings"].append(oo)
            item["walls"].append(ow)
        item["devices"] = []
        for d in f.get("devices", []):
            od = {k: d[k] for k in ("type", "x", "z") + DEVICE_NUMBERS + DEVICE_STRINGS + DEVICE_FLAGS + ("lightColor", "finish", "variant", "tvSize", "leds", "panels", "pts", "closed", "segs", "inset", "legs", "upper", "depth", "cols", "rows", "mount", "cab") if k in d and d[k] not in (None, "")}
            cs = cables_of(d)
            if cs or d["id"] in feeding:
                od["id"] = d["id"]
            if cs:
                od["cables"] = [{"to": c["to"], "route": c.get("route") if c.get("route") in CABLE_ROUTES else "floor",
                                 **({"kind": c["kind"]} if c.get("kind") in CABLE_KINDS else {}),
                                 **({"entity": c["entity"]} if c.get("entity") else {})} for c in cs]
            item["devices"].append(od)
        if kind == "roof":                              # stairs, blocks and floor openings belong to the storeys
            floors.append(item)
            continue
        stairs = []
        for st in f.get("stairs", []):
            if st.get("type") not in STAIR_TYPES or not (_num(st.get("x")) and _num(st.get("z"))):
                continue
            os_ = {k: st[k] for k in ("type", "x", "z", "rot", "w", "tread", "turn", "dir", "floors", "name") if k in st and st[k] not in (None, "")}
            if st["type"] == "wall" and isinstance(st.get("path"), list):
                os_["path"] = st["path"]
            if st["type"] in ("wall", "L", "U") and _num(st.get("landing")) and st["landing"] > 0:
                os_["landing"] = st["landing"]
            stairs.append(os_)
        if stairs:
            item["stairs"] = stairs
        for key, keys in (("blocks", ("name", "points", "h")), ("holes", ("points",))):
            if f.get(key):
                item[key] = [{k: b[k] for k in keys if k in b} for b in f[key] if isinstance(b.get("points"), list)]
        floors.append(item)
    out = {"schemaVersion": SCHEMA_VERSION, "name": name, "building": {"floors": floors}}
    pl = layout.get("plot") or {}
    out_plot = {"boundary": pl["boundary"]} if pl.get("boundary") else {}
    areas = [{k: a[k] for k in ("name", "surface", "points", "rise", "edge", "wall") if a.get(k) not in (None, "")}
             for a in pl.get("areas") or [] if isinstance(a, dict) and isinstance(a.get("points"), list)]
    if areas:
        out_plot["areas"] = areas
    if out_plot:
        out["plot"] = out_plot
    return out
