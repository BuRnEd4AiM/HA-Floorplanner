"""Wall tablets beyond on / off (5.12.0, the owner: "mehr Einstellungen für Tablets … nicht nur ein und aus").

- A tablet's own wall tablet values ("userKiosk": {user: {...}}): the same checks as static/kioskprefs.js (KIOSK_FIELDS), so the add-on
  keeps only what the page understands; the Fully Kiosk entities of the tablet and its brightness by day and at night are among them.
- What a user may switch per kind of device ("userRights": {user: {kind: level}}): ✋ only look ("view"), 💡 only on / off ("onoff"),
  everything (no entry). The same rules as static/userrights.js; api/service refuses what the level does not allow.
- `fully_calls`: the service calls that make a tablet's Fully Kiosk app bright, dim or dark (api/tablet/screen).

Pure (no aiohttp, no Home Assistant): unit tests in tests/test_tablets.py.
"""
import math
import re

SAVERS = ("off", "orbit", "floors", "clock", "black")
SPEEDS = ("slow", "mid", "fast")
TIME = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
WAKE = re.compile(r"^(binary_sensor|input_boolean)\.[a-z0-9_]{1,200}$")
BRIGHT = re.compile(r"^number\.[a-z0-9_]{1,200}$")
SCREEN = re.compile(r"^(switch|light)\.[a-z0-9_]{1,200}$")


def _num(lo, hi):
    return lambda v: v if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and lo <= v <= hi else None


def _one_of(*xs):
    return lambda v: v if isinstance(v, str) and v in xs else None


def _re(r):
    return lambda v: v if isinstance(v, str) and r.match(v) else None


def _bool(v):
    return v if isinstance(v, bool) else None


def _reload(v):
    return v if v == "" or (isinstance(v, str) and TIME.match(v)) else None


# what a tablet may set for itself (static/kioskprefs.js KIOSK_FIELDS, the same order)
KIOSK_FIELDS = {
    "idleReturn": _num(0, 240), "saver": _one_of(*SAVERS), "saverSpeed": _one_of(*SPEEDS), "saverAfter": _num(0, 240),
    "nightDim": _one_of("off", "sun", "time"), "nightFrom": _re(TIME), "nightTo": _re(TIME), "nightLevel": _num(10, 95), "nightAfter": _num(1, 60),
    "nightClock": _bool, "wakeSensor": _re(WAKE), "reloadAt": _reload, "cleanBtn": _bool, "cleanSecs": _num(10, 300),
    "fullyBright": _re(BRIGHT), "fullyScreen": _re(SCREEN), "brightDay": _num(1, 100), "brightNight": _num(0, 100), "screenOff": _bool,
}


def clean_kiosk(entry) -> dict:
    """one tablet's own values: only known keys with a good value"""
    if not isinstance(entry, dict):
        return {}
    out = {}
    for k, check in KIOSK_FIELDS.items():
        v = check(entry.get(k))
        if v is not None:
            out[k] = v
    return out


def clean_user_kiosk(val) -> dict:
    """{user: own values}: at most 50 users, users without a value left out"""
    if not isinstance(val, dict):
        return {}
    out = {}
    for user, entry in list(val.items())[:50]:
        u, c = str(user).strip()[:80], clean_kiosk(entry)
        if u and c:
            out[u] = c
    return out


# ---------- switching per kind of device ----------
KINDS = (("light", 3), ("cover", 3), ("climate", 3), ("media", 3), ("switch", 3), ("gate", 2), ("scene", 2))   # static/userrights.js RIGHT_KINDS
LEVELS = ("view", "onoff", "all")
GATES = {"garage", "gate", "door"}
KIND_OF = {
    "light": "light", "lock": "gate", "climate": "climate", "water_heater": "climate", "humidifier": "climate", "media_player": "media", "remote": "media",
    "scene": "scene", "script": "scene", "switch": "switch", "input_boolean": "switch", "fan": "switch", "valve": "switch", "vacuum": "switch",
    "button": "switch", "input_button": "switch", "select": "switch", "input_select": "switch",
}
ONOFF = {"turn_on", "turn_off", "toggle", "open_cover", "close_cover", "stop_cover", "lock", "unlock", "open_valve", "close_valve", "media_play",
         "media_pause", "media_play_pause", "media_stop", "press", "start", "pause", "stop", "return_to_base", "set_hvac_mode"}


def kind_of(domain: str, dc=None):
    """the kind of an entity's domain; a cover that is a garage door, gate or door counts as a gate. None: not one of the kinds"""
    if domain == "cover":
        return "gate" if dc in GATES else "cover"
    return KIND_OF.get(domain)


def level_of(rights: dict, kind) -> str:
    v = (rights or {}).get(kind) if kind else None
    return v if v in LEVELS else "all"


def allows(rights: dict, domain: str, service: str, payload: dict, dc=None) -> bool:
    """may this call go through for a user with these rights? payload: what goes to Home Assistant (the entity and its values)"""
    level = level_of(rights, kind_of(domain, dc))
    if level == "all":
        return True
    if level == "view" or service not in ONOFF:
        return False
    keys = [k for k in (payload or {}) if k != "entity_id"]
    return all(k == "hvac_mode" for k in keys) if service == "set_hvac_mode" else not keys


def needs_class(rights: dict, domain: str) -> bool:
    """a cover's device class tells a gate from a blind: only needed when the two have different levels"""
    return domain == "cover" and level_of(rights, "cover") != level_of(rights, "gate")


def clean_rights(r) -> dict:
    """one user's rights: only known kinds, only what is less than everything; a kind with two levels has no "onoff\""""
    if not isinstance(r, dict):
        return {}
    return {k: r[k] for k, n in KINDS if r.get(k) == "view" or (r.get(k) == "onoff" and n == 3)}


def clean_user_rights(val) -> dict:
    """{user: rights}: at most 50 users, users with every right left out"""
    if not isinstance(val, dict):
        return {}
    out = {}
    for user, r in list(val.items())[:50]:
        u, c = str(user).strip()[:80], clean_rights(r)
        if u and c:
            out[u] = c
    return out


# ---------- Fully Kiosk: the real brightness of a tablet ----------
SCREEN_MODES = ("day", "night", "off")


def fully_calls(entry: dict, mode: str, bright_max=255) -> list:
    """[(domain, service, data)] that make the tablet's Fully Kiosk app bright ("day"), dim ("night") or dark ("off": its screen switched
    off, only when a screen switch is set; without one it is as dim as at night). bright_max: the brightness entity's highest value
    (Fully: 255)"""
    e = clean_kiosk(entry)
    bright, screen = e.get("fullyBright"), e.get("fullyScreen")
    if mode not in SCREEN_MODES or not (bright or screen):
        return []
    if mode == "off" and screen:
        return [(screen.split(".")[0], "turn_off", {"entity_id": screen})]
    out = [(screen.split(".")[0], "turn_on", {"entity_id": screen})] if screen else []
    if bright:
        pct = e.get("brightNight", 10) if mode in ("night", "off") else e.get("brightDay", 80)
        top = bright_max if isinstance(bright_max, (int, float)) and not isinstance(bright_max, bool) and math.isfinite(bright_max) and bright_max > 0 else 255
        out.append(("number", "set_value", {"entity_id": bright, "value": round(top * pct / 100)}))
    return out
