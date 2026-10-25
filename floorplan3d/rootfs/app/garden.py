"""🚗 The car and 🌱 the garden on 🧺 Haushalt (#533): what an admin chose in ⚙ (the car's entities, the watering zones), and the timers of
"💧 10 min gießen": the add-on opens a zone and closes it again by itself when the time is up, also after a restart (garden.json in the
data folder). Pure functions (unit test: tests/test_garden.py); server.py asks Home Assistant and keeps the timers."""
import re

ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]{1,200}$")
ZONE = re.compile(r"^(valve|switch)\.[a-z0-9_]{1,200}$")
CAR_ROLES = ("battery", "range", "charging", "power", "ends", "mode")
MAX_ZONES = 6
MINUTES = (5, 10, 15, 20, 30, 45, 60)
MAX_MINUTES = 120


def clean_car(val) -> dict:
    """the car's entities an admin chose: {role: entity, "name"} (static/car.js cleanCar does the same)"""
    v = val if isinstance(val, dict) else {}
    out = {r: v[r] for r in CAR_ROLES if isinstance(v.get(r), str) and ENTITY.match(v[r])}
    if isinstance(v.get("name"), str) and v["name"].strip():
        out["name"] = v["name"].strip()[:40]
    return out


def clean_garden(val) -> dict:
    """{"zones": the watering zones (valves or switches, each once, at most MAX_ZONES), "minutes": how long "💧 gießen" waters}"""
    v = val if isinstance(val, dict) else {}
    zones = []
    for z in v.get("zones") if isinstance(v.get("zones"), list) else []:
        if isinstance(z, str) and ZONE.match(z) and z not in zones and len(zones) < MAX_ZONES:
            zones.append(z)
    m = v.get("minutes")
    return {"zones": zones, "minutes": m if isinstance(m, int) and not isinstance(m, bool) and m in MINUTES else 10}


def service(entity: str, on: bool):
    """(domain, service) that opens or closes a zone: a valve open_valve / close_valve, a switch turn_on / turn_off"""
    dom = entity.split(".")[0]
    if dom == "valve":
        return dom, "open_valve" if on else "close_valve"
    return dom, "turn_on" if on else "turn_off"


def clean_timers(val, now: float) -> dict:
    """{zone: until (seconds)}: the zones the add-on closes when their time is up; one long past is kept until it was closed"""
    out = {}
    for k, v in (val.items() if isinstance(val, dict) else []):
        if isinstance(k, str) and ZONE.match(k) and isinstance(v, (int, float)) and not isinstance(v, bool) and 0 < v < now + MAX_MINUTES * 60 + 60:
            out[k] = float(v)
    return out


def due(timers: dict, now: float) -> list:
    """the zones whose time is up"""
    return sorted(k for k, v in timers.items() if v <= now)


def water_request(body, zones) -> tuple:
    """a request of the page {"entity", "minutes"} (or {"entity", "stop": true}) -> (entity, minutes or 0 to stop, None) or (.., .., error);
    only a zone of the garden (zones: those found or chosen), 1 to MAX_MINUTES minutes"""
    if not isinstance(body, dict):
        return None, 0, "entity and minutes"
    e = body.get("entity")
    if not isinstance(e, str) or not ZONE.match(e) or e not in zones:
        return None, 0, "not a watering zone of the garden"
    if body.get("stop") is True:
        return e, 0, None
    m = body.get("minutes")
    if not isinstance(m, (int, float)) or isinstance(m, bool) or not 1 <= m <= MAX_MINUTES:
        return e, 0, f"1 to {MAX_MINUTES} minutes"
    return e, int(m), None


WATER_WORDS = ("bewasserung", "bewässerung", "bewaesserung", "beregnung", "rasen", "garten", "sprinkler", "irrigation", "regner", "giess", "gieß",
               "tropf", "hochbeet", "beet", "watering", "arrosage", "riego", "irrigazione", "sproei", "podlew", "gardena")
NOT_WATER = ("licht", "light", "lampe", "lamp", "beleuchtung", "steckdose", "socket", "pool")


def find_zones(states, chosen) -> list:
    """the zones like static/garden.js findZones: the chosen ones, else every valve and every switch named like watering"""
    own = clean_garden({"zones": chosen})["zones"] if chosen else []
    if own:
        return own
    out = []
    for st in states if isinstance(states, list) else []:
        e = st.get("entity_id") if isinstance(st, dict) else None
        if not isinstance(e, str) or not ZONE.match(e):
            continue
        text = (e + " " + str((st.get("attributes") or {}).get("friendly_name") or "")).lower()
        if e.startswith("valve.") or (any(w in text for w in WATER_WORDS) and not any(w in text for w in NOT_WATER)):
            out.append(e)
    return out[:MAX_ZONES]
