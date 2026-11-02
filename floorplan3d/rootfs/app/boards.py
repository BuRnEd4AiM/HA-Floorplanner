"""The pages of the tab bar arranged by an admin like a Home Assistant dashboard (#484): own pages (customTabs), the order of the bar
(tabOrder) and per page the order of its cards, the hidden ones and own cards (pageLayouts), and own versions of a page for some users
(pageVariants, #507). The same rules as static/tabs.js,
static/pagelayout.js and static/cards.js (unit tests: tests/test_boards.py compares the lists). Pure functions; server.py keeps them in
the settings. Also the history of an entity for a card "Verlauf" (Home Assistant's /api/history), cut down to what the card draws."""
import math
import re
from datetime import datetime

TABS = ("house", "today", "energy", "climate", "cameras", "media", "household", "routines", "family", "log")   # the same as server.TABS (static/tabs.js)
CUSTOM_ID = re.compile(r"^p_[a-z0-9]{3,16}$")
OWN_ID = re.compile(r"^c_[a-z0-9]{3,16}$")
ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
KEY = re.compile(r"^[a-z0-9_:.-]{1,80}$")
CONTROL = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")
MAX_CUSTOM = 8
MAX_ORDER = 120
MAX_OWN = 40
MAX_ENTITIES = 12
MAX_SERIES = 6           # sensors of one history card (static/cards.js, #495)

CARD_TYPES = ("button", "switch", "value", "graph", "light", "lights", "thermostat", "cover", "camera", "calendar", "entities", "room", "text", "builtin", "train")
HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
TYPE_DOMAINS = {
    "button": ("scene", "script", "button", "input_button", "light", "switch", "input_boolean", "fan", "cover", "media_player", "climate", "water_heater",
               "lock", "vacuum"),   # #495: a thermostat, a lock or a vacuum opens the window with its controls
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
SECTION_ID = re.compile(r"^s_[a-z0-9]{3,16}$")
VARIANT_ID = re.compile(r"^v_[a-z0-9]{3,16}$")   # an own version of a page (#507, static/pagevariants.js)
MAX_VARIANTS = 6         # per page, besides "Für alle"
MAX_PICKS = 30           # the versions one user gets (static/tabs.js cleanPicks)
MAX_SECTIONS = 12
MAX_TITLE = 40
COVER_PRESETS = [0, 50, 75, 100]   # the quick positions of a roller shutter card (cleanPresets in static/cards.js)
MAX_PRESETS = 6
SIZES = ("big", "small")   # a thermostat card, a built-in card that can be small (static/thermostat.js, #495)
# the calendar card (static/calcard.js, #495): its calendars each in a colour, the days, the view
CAL_VIEWS = ("week", "list", "month", "next")
CAL_DAYS = (2, 7, 14, 31)
CAL_COLORS = ("blue", "orange", "green", "red", "purple", "grey")
CALENDAR_ID = re.compile(r"^calendar\.[a-z0-9_]{1,200}$")
MAX_CALS = 10
# the card "Lichtsteuerung" (static/lightslider.js, #597): a bar per lamp, light group or switch
ROW_DOMAINS = ("light", "switch")
MAX_ROWS = 16
MAX_LAMPS = 16                                          # lamps in one bar (a bar can hold several: a group of the card)
# the cards of a page on a grid where an admin put them ("Frei anordnen", static/freegrid.js): [x, y, w, h] in cells
FREE_COLS = 12
FREE_MAX_Y = 400
FREE_MAX_H = 60
MAX_PLACES = 120
# how a button card looks and what it does (static/buttonlook.js, #495)
BTN_ICONS = ("💡", "🛋", "🛏", "📺", "🎵", "🔥", "❄️", "🪟", "🚪", "🔒", "🌙", "☀️", "🍳", "🧺", "🚗", "🌱", "🎮", "🎬", "⚡", "🏠")
BTN_COLORS = ("amber", "orange", "red", "purple", "blue", "green", "grey", "lamp")
BTN_SHAPES = ("tile", "round", "pill", "icon")
BTN_SIZES = ("s", "m", "l", "xl")
BTN_SHOW = ("name", "state", "bar", "since")
BTN_TAP = ("toggle", "more", "page", "lights", "none")
BTN_HOLD = ("none", "more", "details")


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


def _chars(v, n) -> str:
    """a text without control characters, at most n characters (code points, like [...v] in the browser)"""
    return re.sub(r"[\x00-\x1f\x7f]", "", v).strip()[:n] if isinstance(v, str) else ""


def _int(v, lo, hi, dflt):
    return v if isinstance(v, int) and not isinstance(v, bool) and lo <= v <= hi else dflt


def fits_type(kind, entity) -> bool:
    if not isinstance(entity, str) or len(entity) > 255 or not ENTITY.match(entity) or kind not in TYPE_DOMAINS:
        return False
    doms = TYPE_DOMAINS[kind]
    return doms is None or entity.split(".")[0] in doms


def clean_cals(v) -> list:
    """the calendars of a calendar card: [{"id", "color"}], each once, at most MAX_CALS; no colour: the next one (cleanCals in static/calcard.js)"""
    out = []
    for c in v if isinstance(v, list) else []:
        cid = c if isinstance(c, str) else c.get("id") if isinstance(c, dict) else None
        if not isinstance(cid, str) or not CALENDAR_ID.match(cid) or any(x["id"] == cid for x in out) or len(out) >= MAX_CALS:
            continue
        color = c.get("color") if isinstance(c, dict) and c.get("color") in CAL_COLORS else CAL_COLORS[len(out) % len(CAL_COLORS)]
        out.append({"id": cid, "color": color})
    return out


def clean_look(v) -> dict:
    """the look of a button card: symbol, colour when on, shape, size, what it shows, tap, long press, the page a tap opens (cleanLook in
    static/buttonlook.js)"""
    v = v if isinstance(v, dict) else {}
    show = [k for k in BTN_SHOW if k in v["show"]] if isinstance(v.get("show"), list) else ["name", "state"]
    page = v["page"] if isinstance(v.get("page"), str) and is_tab_key(v["page"]) else ""
    card = v["card"] if isinstance(v.get("card"), str) and OWN_ID.match(v["card"]) else ""
    tap = v["tap"] if v.get("tap") in BTN_TAP else "toggle"
    if (tap == "page" and not page) or (tap == "lights" and not card):     # a tap that opens a light card (#597)
        tap = "toggle"
    pick = lambda k, allowed, dflt: v[k] if v.get(k) in allowed else dflt
    return {"icon": pick("icon", BTN_ICONS, ""), "onColor": pick("onColor", BTN_COLORS, "amber"), "shape": pick("shape", BTN_SHAPES, "tile"),
            "bsize": pick("bsize", BTN_SIZES, "m"), "show": [] if v.get("shape") == "icon" else show, "tap": tap,
            "hold": pick("hold", BTN_HOLD, "more"), "page": page if tap == "page" else "", **({"card": card} if tap == "lights" else {})}


def clean_presets(v) -> list:
    """the quick positions of a roller shutter card: whole numbers 0 … 100, each once, small to big, at most six; none given: COVER_PRESETS"""
    if not isinstance(v, list):
        return list(COVER_PRESETS)
    return sorted({x for x in v if isinstance(x, int) and not isinstance(x, bool) and 0 <= x <= 100})[:MAX_PRESETS]


def clean_card(c):
    """an own card made safe, or None (cleanCard in static/cards.js)"""
    if not isinstance(c, dict) or not isinstance(c.get("id"), str) or not OWN_ID.match(c["id"]) or c.get("type") not in CARD_TYPES:
        return None
    kind = c["type"]
    out = {"id": c["id"], "type": kind, "name": _text(c.get("name"), 60),
           "width": _int(c.get("width"), 1, 4, 3 if kind == "calendar" else 2 if kind in ("graph", "text", "train") else 1)}
    if kind in TYPE_DOMAINS:
        if not fits_type(kind, c.get("entity")):
            return None
        out["entity"] = c["entity"]
    if kind == "graph":
        out["hours"] = c["hours"] if c.get("hours") in HOURS and not isinstance(c.get("hours"), bool) else 24
        more = []
        for e in c.get("more") if isinstance(c.get("more"), list) else []:
            if e != out["entity"] and e not in more and fits_type("graph", e):
                more.append(e)
        if more:
            out["more"] = more[:MAX_SERIES - 1]
    if kind in ("graph", "value"):
        out["color"] = c["color"] if c.get("color") in COLORS else "blue"
    if kind == "thermostat":
        out["size"] = c["size"] if c.get("size") in SIZES else "big"
    if kind == "cover":                                 # 0 % · 50 % · 75 % · 100 % under ▲ ■ ▼ (the owner, 2026-11-01)
        out["presets"] = clean_presets(c.get("presets"))
    if kind == "button":
        out.update(clean_look(c))
    if kind == "calendar":
        out["cals"] = clean_cals(c.get("cals"))
        if not out["cals"]:
            return None
        out["days"] = c["days"] if c.get("days") in CAL_DAYS and not isinstance(c.get("days"), bool) else 7
        out["view"] = c["view"] if c.get("view") in CAL_VIEWS else "week"
        out["add"] = c.get("add") is not False
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
    if kind == "lights":                                # 🎚 a bar per lamp (#597): the rows, "Alle aus", groups open, as a window
        def fits(e):
            return isinstance(e, str) and len(e) <= 255 and bool(ENTITY.match(e)) and e.split(".")[0] in ROW_DOMAINS
        rows, seen = [], set()
        for r in c.get("rows") if isinstance(c.get("rows"), list) else []:
            if not isinstance(r, dict) or not fits(r.get("e")) or len(rows) >= MAX_ROWS:
                continue
            lamps = list(dict.fromkeys(e for e in [r["e"], *(r.get("more") if isinstance(r.get("more"), list) else [])] if fits(e)))[:MAX_LAMPS]
            if ",".join(lamps) in seen:                 # a bar with the same lamps once; a lamp may be in several bars
                continue
            seen.add(",".join(lamps))
            rows.append({"e": lamps[0], **({"more": lamps[1:]} if len(lamps) > 1 else {}), "name": _chars(r.get("name"), 30), "icon": _chars(r.get("icon"), 8)})
        if not rows:
            return None
        out.update({"rows": rows, "allOff": c.get("allOff") is True, "expand": c.get("expand") is not False, "popup": c.get("popup") is True,
                    "hook": c.get("popup") is True and c.get("hook") is True})
    if kind == "train":                                 # 🚆 the departures of a station, "mein Zug" (#550)
        out["station"] = _text(c.get("station"), 60)
        out["via"] = _text(c.get("via"), 60)
        out["mine"] = c["mine"] if isinstance(c.get("mine"), str) and HHMM.match(c["mine"]) else ""
        out["count"] = _int(c.get("count"), 2, 8, 4)
        sensor = c.get("sensor")
        out["sensor"] = sensor if isinstance(sensor, str) and len(sensor) <= 255 and ENTITY.match(sensor) and sensor.startswith("sensor.") else ""
        if not out["station"] and not out["sensor"]:
            return None
    return out


def clean_layout(v) -> dict:
    """one page: {"order": [key], "hidden": [key], "sizes": {key: size}, "sections", "widths", "cards": [card], "free": True and "places" only
    when there are} (cleanLayout in static/pagelayout.js)"""
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
    widths = o.get("widths") if isinstance(o.get("widths"), dict) else {}
    widths = dict([(k, v) for k, v in widths.items() if isinstance(k, str) and KEY.match(k) and isinstance(v, int) and not isinstance(v, bool)
                   and 1 <= v <= 4][:MAX_ORDER])
    places = clean_places(o.get("places"))
    return {"order": keys(o.get("order")), "hidden": keys(o.get("hidden")), "sizes": sizes, "sections": clean_sections(o.get("sections")),
            "widths": widths, "cards": cards, **({"free": True} if o.get("free") is True else {}), **({"places": places} if places else {})}


def clean_places(val) -> dict:
    """the places of the cards of a page on the grid: {key: [x, y, w, h]} inside the grid, at most MAX_PLACES (cleanPlaces in
    static/freegrid.js)"""
    out = {}
    for k, p in (val.items() if isinstance(val, dict) else []):
        if not isinstance(k, str) or not KEY.match(k) or not isinstance(p, list) or len(p) != 4 or len(out) >= MAX_PLACES:
            continue
        if not all(isinstance(n, int) and not isinstance(n, bool) for n in p):
            continue
        x, y, w, h = p
        if x >= 0 and w >= 1 and x + w <= FREE_COLS and 0 <= y <= FREE_MAX_Y and 1 <= h <= FREE_MAX_H:
            out[k] = [x, y, w, h]
    return out


def clean_sections(val) -> list:
    """the sections of a page (#495): [{"id", "title", "icon", "wide", "keys"}], ids once, a key in one section only (cleanSections in
    static/sections.js)"""
    out, ids, seen = [], set(), set()
    for s in val if isinstance(val, list) else []:
        if not isinstance(s, dict) or not isinstance(s.get("id"), str) or not SECTION_ID.match(s["id"]) or s["id"] in ids or len(out) >= MAX_SECTIONS:
            continue
        ids.add(s["id"])
        keys = []
        for k in s.get("keys") if isinstance(s.get("keys"), list) else []:
            if isinstance(k, str) and KEY.match(k) and k not in seen and len(keys) < MAX_ORDER:
                seen.add(k)
                keys.append(k)
        title = re.sub(r"[\x00-\x1f\x7f]", "", s["title"]).strip()[:MAX_TITLE] if isinstance(s.get("title"), str) else ""
        icon = re.sub(r"[\x00-\x1f\x7f]", "", s["icon"]).strip()[:8] if isinstance(s.get("icon"), str) else ""
        out.append({"id": s["id"], "title": title, "icon": icon, "wide": s.get("wide") is True, "keys": keys})
    return out


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
        if lay["order"] or lay["hidden"] or lay["cards"] or lay["sizes"] or lay["sections"] or lay["widths"] or lay.get("free") or lay.get("places"):
            out[page] = lay
    return out


def clean_variant(v):
    """one version of a page (#507): {"id", "name", "icon", "layout"}, or None (cleanVariant in static/pagevariants.js)"""
    if not isinstance(v, dict) or not isinstance(v.get("id"), str) or not VARIANT_ID.match(v["id"]):
        return None
    name = re.sub(r"[\x00-\x1f\x7f]", "", v["name"]).strip() if isinstance(v.get("name"), str) else ""
    icon = re.sub(r"[\x00-\x1f\x7f]", "", v["icon"]).strip() if isinstance(v.get("icon"), str) else ""
    return {"id": v["id"], "name": name[:30] if name else "?", "icon": icon if icon and len(icon) <= 8 else "🗂", "layout": clean_layout(v.get("layout"))}


def clean_page_variants(val, custom_tabs) -> dict:
    """{page: [version]} for the built-in pages (not the house) and the own pages that exist, ids once, at most MAX_VARIANTS, empty lists
    left out (cleanVariants in static/pagevariants.js)"""
    if not isinstance(val, dict):
        return {}
    pages = [k for k in TABS if k != "house"] + [c["id"] for c in custom_tabs]
    out = {}
    for page, lst in list(val.items())[:40]:
        if page not in pages or not isinstance(lst, list):
            continue
        ids, vs = set(), []
        for v in lst:
            x = clean_variant(v)
            if x and x["id"] not in ids and len(vs) < MAX_VARIANTS:
                ids.add(x["id"])
                vs.append(x)
        if vs:
            out[page] = vs
    return out


def clean_picks(val) -> dict:
    """the versions of the pages one user gets: {page: id}, pages other than the house, at most MAX_PICKS (cleanPicks in static/tabs.js)"""
    if not isinstance(val, dict):
        return {}
    return dict([(k, v) for k, v in val.items() if is_tab_key(k) and k != "house" and isinstance(v, str) and VARIANT_ID.match(v)][:MAX_PICKS])


# the scene bar over the tab bar (#597, static/scenebar.js): one list for every page, a page or a version of it with its own list or none
BAR_DOMAINS = ("scene", "script")
BAR_COLORS = ("amber", "orange", "red", "purple", "blue", "green", "grey")
BAR_MODES = ("own", "off")
MAX_BAR_ITEMS = 24
MAX_BAR_PAGES = 40


def clean_bar_items(val) -> list:
    """the tiles of the scene bar: [{"e", "name", "icon", "color"}], each entity once, at most MAX_BAR_ITEMS (cleanItems in static/scenebar.js)"""
    out, seen = [], set()
    for v in val if isinstance(val, list) else []:
        e = v.get("e") if isinstance(v, dict) else None
        if not isinstance(e, str) or len(e) > 255 or not ENTITY.match(e) or e.split(".")[0] not in BAR_DOMAINS or e in seen:
            continue
        seen.add(e)
        out.append({"e": e, "name": _chars(v.get("name"), 30), "icon": _chars(v.get("icon"), 8), "color": v["color"] if v.get("color") in BAR_COLORS else ""})
        if len(out) >= MAX_BAR_ITEMS:
            break
    return out


def bar_key(k):
    """'today' or 'today@v_kids01' -> (page, version) or None (splitKey in static/scenebar.js)"""
    if not isinstance(k, str):
        return None
    parts = k.split("@")
    page, version = parts[0], parts[1] if len(parts) == 2 else ""
    if len(parts) > 2 or not is_tab_key(page) or (version and (page == "house" or not VARIANT_ID.match(version))):
        return None
    return page, version


def clean_scene_bar(val, custom_tabs=None, variants=None) -> dict:
    """the scene bar: {"on", "items", "pages": {key: {"mode", "items"}}} (cleanSceneBar in static/scenebar.js); with the own pages and the
    versions (clean_page_variants) a key of a page or a version that is gone is left out"""
    o = val if isinstance(val, dict) else {}
    pages = {}
    known = None if custom_tabs is None else list(TABS) + [c["id"] for c in custom_tabs]
    for k, p in list(o["pages"].items())[:MAX_BAR_PAGES] if isinstance(o.get("pages"), dict) else []:
        at = bar_key(k)
        if not at or not isinstance(p, dict) or p.get("mode") not in BAR_MODES:
            continue
        if known is not None and (at[0] not in known or (at[1] and at[1] not in [v["id"] for v in (variants or {}).get(at[0], [])])):
            continue
        pages[k] = {"mode": p["mode"], "items": clean_bar_items(p.get("items"))}
    return {"on": o.get("on") is not False, "items": clean_bar_items(o.get("items")), "pages": pages}


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
