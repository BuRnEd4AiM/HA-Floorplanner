"""☀ Sonnenschutz (5.15.0, the owner's choice 2026-11-17 from docs/ideen-5.15, pictures 1 and 2): roller shutters go down only where the
sun shines on their window. The plan knows which way every window looks (window_bearing: the side of its wall that is in no room is
outside; north is -z, east +x, as compass.js), Home Assistant knows where the sun is (sun.sun: azimuth and elevation). A shutter goes down
to a position an admin chose while the sun is high enough, shines on its window (the angle between the sun and the window's outward
direction is small enough) and it is warm (outside or in the room, as an admin chose; no limit: always), optionally only while the weather
says sun; it goes back up to where it was when the sun has been off the window for some minutes. A window that is open is left up (and a
shutter that is down goes up at once when its window opens, to air). Turned by hand while down: the add-on leaves it alone until the sun
has gone (and does not put it back). A shutter that is already lower stays as it is. Only covers that report a position are moved.

Pure (unit test: tests/test_sunshade.py): clean_sun, clean_mem, window_bearing, hits, step. rulesrun.py feeds it the states, the shutters
of the rooms (roommap.rooms_of) and the clock and makes the calls it returns."""
import math

DEFAULT = {"on": False, "elev": 15, "angle": 75, "out": 22.0, "inside": 24.0, "pos": 30, "back": 20, "open": True, "clouds": True, "skip": []}
SUNNY = {"sunny", "clear", "partlycloudy", "exceptional", "windy"}   # weather states with sun (Home Assistant's conditions)
SETTLE = 120          # s a shutter may take to get where it was sent: a position that differs after that was set by hand
NEAR = 3              # % that still count as the same position
MAX_SKIP = 200


def _bool(v, d):
    return v if isinstance(v, bool) else d


def _int(v, lo, hi, d):
    return max(lo, min(hi, int(v))) if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else d


def _temp(v, d):
    """a temperature limit, or None for "no limit" (null)"""
    if v is None:
        return None
    return round(max(-20.0, min(45.0, float(v))) * 2) / 2 if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else d


def clean_sun(data) -> dict:
    """the settings as an admin set them, every value checked"""
    d = data if isinstance(data, dict) else {}
    D = DEFAULT
    skip = [e for e in d.get("skip") or [] if isinstance(e, str) and e.startswith("cover.")][:MAX_SKIP] if isinstance(d.get("skip"), list) else []
    return {"on": _bool(d.get("on"), D["on"]), "elev": _int(d.get("elev"), 0, 60, D["elev"]), "angle": _int(d.get("angle"), 30, 90, D["angle"]),
            "out": _temp(d.get("out"), D["out"]) if "out" in d else D["out"], "inside": _temp(d.get("inside"), D["inside"]) if "inside" in d else D["inside"],
            "pos": _int(d.get("pos"), 0, 90, D["pos"]), "back": _int(d.get("back"), 1, 240, D["back"]),
            "open": _bool(d.get("open"), D["open"]), "clouds": _bool(d.get("clouds"), D["clouds"]), "skip": list(dict.fromkeys(skip))}


def clean_mem(m) -> dict:
    """{cover: {at (when it went down), set (the position sent), before (where it was), last (the sun last wanted it down), hand}}"""
    out = {}
    for e, v in (m if isinstance(m, dict) else {}).items():
        if isinstance(e, str) and e.startswith("cover.") and isinstance(v, dict) and isinstance(v.get("at"), (int, float)):
            out[e] = {"at": float(v["at"]), "set": _int(v.get("set"), 0, 100, None), "before": _int(v.get("before"), 0, 100, None),
                      "last": float(v["last"]) if isinstance(v.get("last"), (int, float)) else float(v["at"]), "hand": v.get("hand") is True}
    return out


def window_bearing(ax, az, bx, bz, outside) -> float | None:
    """the compass direction a window on the wall a → b looks to (degrees clockwise from north, north = -z, east = +x); outside: +1 / -1,
    which normal of the wall (+1: (-dz, dx)) is outside; None when unknown"""
    if outside not in (1, -1):
        return None
    length = math.hypot(bx - ax, bz - az)
    if length < 1e-6:
        return None
    nx, nz = -(bz - az) / length * outside, (bx - ax) / length * outside
    return round(math.degrees(math.atan2(nx, -nz)) % 360, 1)


def compass(bearing) -> str:
    """N, NO, O, SO, S, SW, W, NW (the page translates)"""
    return ("N", "NO", "O", "SO", "S", "SW", "W", "NW")[int(((bearing % 360) + 22.5) // 45) % 8]


def off_angle(a, b) -> float:
    """the angle between two compass directions, 0 … 180"""
    d = abs((a - b) % 360)
    return min(d, 360 - d)


def hits(cfg, bearing, sun) -> bool:
    """does the sun (azimuth, elevation) shine on a window looking to bearing"""
    if bearing is None or not sun:
        return False
    return sun["elev"] >= cfg["elev"] and off_angle(sun["az"], bearing) <= cfg["angle"]


def _f(v):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None


def sun_of(states) -> dict | None:
    """{az, elev} from sun.sun"""
    a = (states.get("sun.sun") or {}).get("attributes") or {}
    az, el = _f(a.get("azimuth")), _f(a.get("elevation"))
    return {"az": az, "elev": el} if az is not None and el is not None else None


def position(st) -> int | None:
    """a cover's position 0 (closed) … 100 (open), None when it reports none"""
    p = _f(((st or {}).get("attributes") or {}).get("current_position"))
    return None if p is None else int(round(max(0.0, min(100.0, p))))


def room_temp(room, states) -> float | None:
    """the temperature of a room: its thermostat's, else a temperature sensor in it"""
    for e in room.get("climates") or []:
        t = _f(((states.get(e) or {}).get("attributes") or {}).get("current_temperature"))
        if t is not None:
            return t
    for e in room.get("entities") or []:
        s = states.get(e) or {}
        a = s.get("attributes") or {}
        if e.startswith("sensor.") and (a.get("device_class") == "temperature" or a.get("unit_of_measurement") in ("°C", "°F")):
            t = _f(s.get("state"))
            if t is not None:
                return t
    return None


def _warm(cfg, out_t, in_t) -> bool:
    """warm enough: no limit set, or outside / in the room above its limit"""
    lims = [(cfg["out"], out_t), (cfg["inside"], in_t)]
    if all(lim is None for lim, _ in lims):
        return True
    return any(lim is not None and t is not None and t >= lim for lim, t in lims)


def _open(states, contacts) -> bool:
    return any((states.get(e) or {}).get("state") in ("on", "open", "tilted") for e in contacts)


def step(cfg, rooms, states, mem, now, weather=None):
    """one look: (mem, calls [(service, data)], status {cover: …}, lines for the log)"""
    mem = dict(mem)
    calls, status, lines = [], {}, []
    if not cfg["on"]:
        return {}, calls, status, lines
    sun = sun_of(states)
    wst = (states.get(weather) or {}) if weather else {}
    out_t = _f((wst.get("attributes") or {}).get("temperature"))
    sunny = not cfg["clouds"] or not wst or wst.get("state") in SUNNY
    seen = set()
    for room in rooms:
        in_t = None
        for sh in room.get("shutters") or []:
            c = sh["cover"]
            if c in seen:
                continue
            seen.add(c)
            st = states.get(c)
            cur, m = position(st), mem.get(c)
            on = hits(cfg, sh.get("bearing"), sun)
            if in_t is None:
                in_t = room_temp(room, states)
            opened = cfg["open"] and _open(states, sh.get("contacts") or [])
            warm = _warm(cfg, out_t, in_t)
            want = on and sunny and warm and not opened and c not in cfg["skip"] and st is not None and cur is not None
            why = ("skip" if c in cfg["skip"] else "none" if st is None else "nopos" if cur is None else "open" if opened and on else
                   "sun" if want else "cool" if on and not warm else "clouds" if on and not sunny else "shade")
            name = room.get("name") or ""
            if m is None:
                if want and cur > cfg["pos"] + NEAR:
                    calls.append(("set_cover_position", {"entity_id": c, "position": cfg["pos"]}))
                    lines.append({"act": "down", "ent": c, "room": name, "v": cfg["pos"], "from": cur})
                    m = mem[c] = {"at": now, "set": cfg["pos"], "before": cur, "last": now, "hand": False}
            else:
                if want:
                    m["last"] = now
                if not m["hand"] and cur is not None and m["set"] is not None and now - m["at"] > SETTLE and abs(cur - m["set"]) > NEAR:
                    m["hand"] = True
                    lines.append({"act": "hand", "ent": c, "room": name, "v": cur})
                if opened or now - m["last"] >= cfg["back"] * 60:
                    if not m["hand"] and cur is not None and m["set"] is not None and abs(cur - m["set"]) <= NEAR and m["before"] is not None:
                        calls.append(("set_cover_position", {"entity_id": c, "position": m["before"]}))
                        lines.append({"act": "up", "ent": c, "room": name, "v": m["before"], "why": "open" if opened else "gone"})
                    del mem[c]
                    m = None
            status[c] = {"room": room.get("key"), "name": name, "bearing": sh.get("bearing"), "dir": compass(sh["bearing"]) if sh.get("bearing") is not None else None,
                         "sun": on, "why": why, "pos": cur, "down": m is not None, "hand": bool(m and m["hand"]),
                         "until": round(m["last"] + cfg["back"] * 60) if m and not want else None}
    for c in [c for c in mem if c not in seen]:                  # a shutter no longer in a plan: forgotten
        del mem[c]
    return mem, calls, status, lines


def any_down(mem) -> bool:
    return bool(mem)
