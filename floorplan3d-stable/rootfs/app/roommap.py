"""Which thermostats, windows and other devices belong to which room of the plans (#546): the add-on's own heating rules and
routines run without a browser, so the server works it out from the saved layouts the same way the page does (roomEntityIds in
static/roomtiles.js: a device inside the room's outline, and the entities of the room's Home Assistant area; roomOpenings in
static/roompanel.js: a door or window within 35 cm of the outline; a door to the outside as levels.js outerDoors sees it, a side of it in
no room). Pure (unit test: tests/test_roommap.py)."""

EDGE = 0.35          # a door or window this close to a room's outline belongs to it (roompanel.js)
SIDE = 0.25          # m beyond the wall's face where a door's side is looked at (more than levels.js: an outline a little inside the wall)
ROOM_DOMAINS = ("climate", "light", "cover", "switch", "fan", "media_player")


def point_in_poly(x: float, z: float, pts) -> bool:
    inside, n = False, len(pts)
    for i in range(n):
        (xi, zi), (xj, zj) = pts[i], pts[i - 1]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi:
            inside = not inside
    return inside


def dist_to_poly(x: float, z: float, pts) -> float:
    best = float("inf")
    for i in range(len(pts)):
        (ax, az), (bx, bz) = pts[i], pts[(i + 1) % len(pts)]
        dx, dz = bx - ax, bz - az
        l2 = dx * dx + dz * dz or 1.0
        k = max(0.0, min(1.0, ((x - ax) * dx + (z - az) * dz) / l2))
        best = min(best, ((x - ax - dx * k) ** 2 + (z - az - dz * k) ** 2) ** 0.5)
    return best


def _pts(room):
    pts = room.get("points") if isinstance(room, dict) else None
    if not isinstance(pts, list) or len(pts) < 3:
        return None
    try:
        return [(float(p[0]), float(p[1])) for p in pts]
    except (TypeError, ValueError, IndexError):
        return None


def _num(v):
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def opening_entities(o) -> list:
    """the contact sensors of a door or window: its own, those of its panes and the tilt contact of a window (#624; openings.js
    openingEntities): a tilted window is not shut, it counts for the window rule like an open one"""
    out = []
    tilt = o.get("tiltEntity") if o.get("type") == "window" and o.get("style") != "fixed" else None
    for e in [o.get("entity"), *(o.get("paneEntities") or []), tilt]:
        if isinstance(e, str) and e and e not in out:
            out.append(e)
    return out


def roof_windows(floors) -> dict:
    """{floor id: [(x, z, window)]}: the windows of the dormers and the roof windows (#643) of every roof floor, by the floor they belong to.
    They are no walls of the plan: the editor keeps where each lies (o.at: its middle in the plan, o.floor: the id of its floor, dormerwin.js)."""
    out = {}
    for f in floors if isinstance(floors, list) else []:
        roof = f.get("roof") if isinstance(f, dict) and f.get("kind") == "roof" else None
        if not isinstance(roof, dict):
            continue
        for spec in [roof, *[p for p in roof.get("parts") or [] if isinstance(p, dict)]]:
            items = [d for d in spec.get("dormers") or [] if isinstance(d, dict) and d.get("win") is not False]
            items += [s for s in spec.get("skylights") or [] if isinstance(s, dict)] if spec.get("type") != "flat" else []
            for it in items:
                o = it.get("window")
                at = o.get("at") if isinstance(o, dict) else None
                if isinstance(at, list) and len(at) >= 2 and _num(at[0]) is not None and _num(at[1]) is not None and isinstance(o.get("floor"), str):
                    out.setdefault(o["floor"], []).append((float(at[0]), float(at[1]), o))
    return out


def _openings(floor, extra=()):
    """(x, z, sides, opening) of every door and window of a floor, on its walls and dormer walls, and extra: [(x, z, window)] (the windows
    of the dormers and the roof windows on it, roof_windows); sides: the two points just beside it, across the wall (as levels.js
    besideOpening)"""
    out = [(x, z, ((x, z), (x, z)), o) for x, z, o in extra]
    for w in [*(floor.get("walls") or []), *(floor.get("dormerWalls") or [])]:
        try:
            ax, az, bx, bz = float(w["a"][0]), float(w["a"][1]), float(w["b"][0]), float(w["b"][1])
        except (KeyError, TypeError, ValueError, IndexError):
            continue
        length = ((bx - ax) ** 2 + (bz - az) ** 2) ** 0.5 or 1.0
        nx, nz = -(bz - az) / length, (bx - ax) / length
        t = (_num(w.get("thickness")) or 0.2) / 2 + SIDE
        for o in w.get("openings") or []:
            pos = _num(o.get("pos")) if isinstance(o, dict) else None
            if pos is None:
                continue
            k = pos / length
            x, z = ax + (bx - ax) * k, az + (bz - az) * k
            out.append((x, z, ((x + nx * t, z + nz * t), (x - nx * t, z - nz * t)), o))
    return out


def rooms_of(houses, area_entities=None) -> list:
    """The rooms of every house: [{key: "<house>/<room id>", house, id, name, floor, climates, windows, doors, outer, counted, entities}].
    houses: [(house id, layout)]; area_entities: {area id: [entity ids]} (rooms linked to an area of Home Assistant).
    windows: the sensors of its windows; doors: of its doors; outer: of the doors that belong to this room only (to the outside, a
    terrace door), not a door between two rooms; a door with a side in no room, or only in an open area (a terrace drawn as a room), is
    one to the outside too (#577: the owner's door to the outside did not switch the heating off); counted: of the doors with the switch
    "Zählt für die Heizung" (o.heat), which the window rule counts for every room beside them like a window (the owner, 2026-10-28: his
    rooms' doors lead to the corridor, which has no heating); entities: every entity of the room (devices inside it and its area)."""
    areas = area_entities or {}
    out = []
    for hid, layout in houses:
        floors = layout.get("floors") if isinstance(layout, dict) else None
        roofwin = roof_windows(floors)
        for fi, f in enumerate(floors if isinstance(floors, list) else []):
            if not isinstance(f, dict):
                continue
            rooms = [(r, _pts(r)) for r in f.get("rooms") or [] if isinstance(r, dict) and r.get("id")]
            rooms = [(r, p) for r, p in rooms if p]
            ops = _openings(f, roofwin.get(f.get("id"), []))
            near = {id(o): [r["id"] for r, p in rooms if dist_to_poly(x, z, p) < EDGE or point_in_poly(x, z, p)] for x, z, _s, o in ops}
            indoor = [p for r, p in rooms if not r.get("terrace")]
            out_side = {id(o): any(not any(point_in_poly(sx, sz, p) for p in indoor) for sx, sz in sides) for _x, _z, sides, o in ops}
            devices = [d for d in f.get("devices") or [] if isinstance(d, dict) and isinstance(d.get("entity"), str) and d["entity"]]
            for r, p in rooms:
                ents = []
                for d in devices:
                    x, z = _num(d.get("x")), _num(d.get("z"))
                    if x is not None and z is not None and point_in_poly(x, z, p) and d["entity"] not in ents:
                        ents.append(d["entity"])
                if r.get("area"):
                    ents += [e for e in areas.get(r["area"], []) if isinstance(e, str) and e not in ents]
                windows, doors, outer, counted = [], [], [], []
                for _x, _z, _s, o in ops:
                    if r["id"] not in near[id(o)]:
                        continue
                    sensors = opening_entities(o)
                    if o.get("type") == "window":
                        windows += [e for e in sensors if e not in windows]
                    elif o.get("type") == "door":
                        doors += [e for e in sensors if e not in doors]
                        if len(near[id(o)]) == 1 or out_side[id(o)]:
                            outer += [e for e in sensors if e not in outer]
                        if o.get("heat") is True:
                            counted += [e for e in sensors if e not in counted]
                out.append({"key": f"{hid}/{r['id']}", "house": hid, "id": r["id"], "name": str(r.get("name") or "")[:60], "floor": fi,
                            "climates": sorted(e for e in ents if e.startswith("climate.")), "windows": windows, "doors": doors, "outer": outer, "counted": counted,
                            "entities": ents})
    return out


def room_index(rooms) -> dict:
    """entity -> the key of the room it is in (the first one; a window between two rooms belongs to both: the first)"""
    idx = {}
    for r in rooms:
        for e in [*r["entities"], *r["windows"], *r["doors"]]:
            idx.setdefault(e, r["key"])
    return idx


def in_room(rooms, key: str, domain: str) -> list:
    """the entities of one domain in room key (for "the heating in the same room")"""
    for r in rooms:
        if r["key"] == key:
            return [e for e in r["entities"] if e.startswith(domain + ".")]
    return []
