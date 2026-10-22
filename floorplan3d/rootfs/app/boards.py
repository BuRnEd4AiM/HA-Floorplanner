"""The pages of the tab bar arranged by an admin like a Home Assistant dashboard (#484): own pages (customTabs), the order of the bar
(tabOrder) and per page the order of its cards, the hidden ones and own cards (pageLayouts). The same rules as static/tabs.js,
static/pagelayout.js and static/cards.js (unit tests: tests/test_boards.py compares the lists). Pure functions; server.py keeps them in
the settings. Also the history of an entity for a card "Verlauf" (Home Assistant's /api/history), cut down to what the card draws."""
import math
import re
from datetime import datetime

TABS = ("house", "today", "energy", "climate", "cameras", "media", "household", "routines", "family")   # the same as server.TABS (static/tabs.js)
CUSTOM_ID = re.compile(r"^p_[a-z0-9]{3,16}$")
OWN_ID = re.compile(r"^c_[a-z0-9]{3,16}$")
ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
KEY = re.compile(r"^[a-z0-9_:.-]{1,80}$")
CONTROL = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")
MAX_CUSTOM = 8
MAX_ORDER = 120
MAX_OWN = 40
MAX_ENTITIES = 12

CARD_TYPES = ("button", "switch", "value", "graph", "light", "thermostat", "cover", "camera", "entities", "room", "text", "builtin")
TYPE_DOMAINS = {
    "button": ("scene", "script", "button", "input_button", "light", "switch", "input_boolean", "fan", "cover", "media_player"),
    "switch": ("light", "switch", "input_boolean", "fan"),
    "value": None,
    "graph": ("sensor", "input_number", "number"),
    "light": ("light",),
    "thermostat": ("climate", "water_heater"),
    "cover": ("cover",),
    "camera": ("camera",),
}
BUILTINS = ("today:clock", "today:weather", "today:agenda", "today:waste", "today:people", "today:house", "today:power", "today:pinboard")
COLORS = ("blue", "orange", "green", "red")
HOURS = (6, 24, 168, 720)
SIZES = ("big", "small")   # a thermostat card, a built-in card that can be small (static/thermostat.js, #495)


def is_tab_key(k) -> bool:
    return isinstance(k, str) and (k in TABS or bool(CUSTOM_ID.match(k)))


def clean_custom_tabs(val) -> list:
    """own pages: [{"id", "name", "icon"}], ids each once, at most MAX_CUSTOM (cleanCustomTabs in static/tabs.js)"""
    out, ids = [], set()
    for x in val if isinstance(val, list) else []:
        if not isinstance(x, dict) or not isinstance(x.get("id"), str) or not CUSTOM_ID.match(x["id"]) or x["id"] in ids:
            continue
        ids.add(x["id"])
        name = x["name"].strip() if isinstance(x.get("name"), str) and x["name"].strip() else "?"
        icon = x["icon"].strip() if isinstance(x.get("icon"), str) and x["icon"].strip() and len(x["icon"].strip()) <= 8 else "⭐"
        out.append({"id": x["id"], "name": name[:30], "icon": icon})
        if len(out) >= MAX_CUSTOM:
            break
    return out


def clean_tab_order(val) -> list:
    """the order of the bar: tab keys each once, never the house, at most 30 (cleanTabOrder in static/tabs.js)"""
    out = []
    for k in val if isinstance(val, list) else []:
        if is_tab_key(k) and k != "house" and k not in out:
            out.append(k)
    return out[:30]


def _text(v, n) -> str:
    return CONTROL.sub("", v).strip()[:n] if isinstance(v, str) else ""


def _int(v, lo, hi, dflt):
    return v if isinstance(v, int) and not isinstance(v, bool) and lo <= v <= hi else dflt


def fits_type(kind, entity) -> bool:
    if not isinstance(entity, str) or len(entity) > 255 or not ENTITY.match(entity) or kind not in TYPE_DOMAINS:
        return False
    doms = TYPE_DOMAINS[kind]
    return doms is None or entity.split(".")[0] in doms


def clean_card(c):
    """an own card made safe, or None (cleanCard in static/cards.js)"""
    if not isinstance(c, dict) or not isinstance(c.get("id"), str) or not OWN_ID.match(c["id"]) or c.get("type") not in CARD_TYPES:
        return None
    kind = c["type"]
    out = {"id": c["id"], "type": kind, "name": _text(c.get("name"), 60), "width": _int(c.get("width"), 1, 4, 2 if kind in ("graph", "text") else 1)}
    if kind in TYPE_DOMAINS:
        if not fits_type(kind, c.get("entity")):
            return None
        out["entity"] = c["entity"]
    if kind == "graph":
        out["hours"] = c["hours"] if c.get("hours") in HOURS and not isinstance(c.get("hours"), bool) else 24
    if kind in ("graph", "value"):
        out["color"] = c["color"] if c.get("color") in COLORS else "blue"
    if kind == "thermostat":
        out["size"] = c["size"] if c.get("size") in SIZES else "big"
    if kind == "entities":
        ents = []
        for e in c.get("entities") if isinstance(c.get("entities"), list) else []:
            if isinstance(e, str) and len(e) <= 255 and ENTITY.match(e) and e not in ents:
                ents.append(e)
        out["entities"] = ents[:MAX_ENTITIES]
        if not ents:
            return None
    if kind == "room":
        out["room"] = _text(c.get("room"), 80)
        if not out["room"]:
            return None
    if kind == "text":
        out["text"] = _text(c.get("text"), 500)
        if not out["text"] and not out["name"]:
            return None
    if kind == "builtin":
        if c.get("builtin") not in BUILTINS:
            return None
        out["builtin"] = c["builtin"]
    return out


def clean_layout(v) -> dict:
    """one page: {"order": [key], "hidden": [key], "sizes": {key: size}, "cards": [card]} (cleanLayout in static/pagelayout.js)"""
    o = v if isinstance(v, dict) else {}

    def keys(lst):
        out = []
        for k in lst if isinstance(lst, list) else []:
            if isinstance(k, str) and KEY.match(k) and k not in out:
                out.append(k)
        return out[:MAX_ORDER]
    cards, ids = [], set()
    for c in o.get("cards") if isinstance(o.get("cards"), list) else []:
        x = clean_card(c)
        if x and x["id"] not in ids and len(cards) < MAX_OWN:
            ids.add(x["id"])
            cards.append(x)
    sizes = o.get("sizes") if isinstance(o.get("sizes"), dict) else {}
    sizes = dict([(k, v) for k, v in sizes.items() if isinstance(k, str) and KEY.match(k) and v in SIZES][:MAX_ORDER])
    return {"order": keys(o.get("order")), "hidden": keys(o.get("hidden")), "sizes": sizes, "cards": cards}


def clean_page_layouts(val, custom_tabs) -> dict:
    """{page: layout} for the built-in pages (not the house) and the own pages that exist; empty ones left out"""
    if not isinstance(val, dict):
        return {}
    pages = [k for k in TABS if k != "house"] + [c["id"] for c in custom_tabs]
    out = {}
    for page, v in list(val.items())[:40]:
        if page not in pages:
            continue
        lay = clean_layout(v)
        if lay["order"] or lay["hidden"] or lay["cards"] or lay["sizes"]:
            out[page] = lay
    return out


MAX_POINTS = 240


def _num(v):
    try:
        n = float(v)
    except (TypeError, ValueError):
        return None
    return n if math.isfinite(n) else None


def _ms(v):
    if not isinstance(v, str):
        return None
    try:
        d = datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        return None
    return int(d.timestamp() * 1000) if d.tzinfo else None


def slim_history(data, entity: str) -> list:
    """Home Assistant's /api/history/period answer ([[{state, last_changed}, ...]], minimal_response: only the first row has the
    entity) -> [[ms, value]] of the numbers, at most MAX_POINTS (evenly picked, the last one always kept)"""
    rows = []
    for series in data if isinstance(data, list) else []:
        if not isinstance(series, list) or not series:
            continue
        first = series[0] if isinstance(series[0], dict) else {}
        if first.get("entity_id") not in (None, entity):
            continue
        for r in series:
            if not isinstance(r, dict):
                continue
            t, v = _ms(r.get("last_changed") or r.get("last_updated")), _num(r.get("state"))
            if t is not None and v is not None:
                rows.append([t, round(v, 3)])
        break
    if len(rows) > MAX_POINTS:
        step = len(rows) / (MAX_POINTS - 1)
        rows = [rows[int(i * step)] for i in range(MAX_POINTS - 1)] + [rows[-1]]
    return rows
