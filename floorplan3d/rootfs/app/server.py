"""3D Floorplan – backend for the Home Assistant add-on.

- serves the frontend (static/)
- stores the floor plan layout, user settings and custom GLB models under DATA_DIR
- reads entities and calls services through the Supervisor proxy (or, without the Supervisor, Home Assistant itself: #489)
"""
import asyncio
import base64
import datetime
import hashlib
import hmac
import html
import json
import math
import logging
import os
import re
import secrets
import time
import types
from pathlib import Path
from urllib.parse import unquote

import aiohttp
from aiohttp import web

import alarmnotify as an
import boards
import guard as gd
import household as hh
import controls
import counters
import halogin as hl
import importer
import manifest as mf
import pages
import renames as rn
import timeline as tl
import voice as vc

STATIC_DIR = Path(__file__).parent / "static"
# the token for Home Assistant: the Supervisor's in the add-on; without the Supervisor (Home Assistant as a Docker container, #489) a
# long-lived access token (HA_TOKEN) and Home Assistant's address (HA_URL, e.g. http://192.168.1.10:8123)
SUPERVISOR_TOKEN = os.environ.get("SUPERVISOR_TOKEN") or os.environ.get("HA_TOKEN")
HA_URL = "" if os.environ.get("SUPERVISOR_TOKEN") else os.environ.get("HA_URL", "")
HA_API = os.environ.get("HA_API") or (hl.ha_base(HA_URL) + "/api" if HA_URL else "http://supervisor/core/api")
HA_LOGIN = bool(os.environ.get("HA_TOKEN")) and not os.environ.get("SUPERVISOR_TOKEN")   # no Ingress: who opens the page logs in with Home Assistant
HA_PUBLIC_URL = os.environ.get("HA_PUBLIC_URL", "")   # Home Assistant's address for the browser, when it is another than HA_URL
APP_URL = os.environ.get("APP_URL", "")               # the page's own address, when it is behind a proxy or in a folder
PORT = int(os.environ.get("PORT", "8099"))
OPTIONS_FILE = Path(os.environ.get("OPTIONS_FILE", "/data/options.json"))

MAX_MODEL_BYTES = 20 * 1024 * 1024
MAX_LAYOUT_BYTES = 10 * 1024 * 1024
MAX_BG_BYTES = 8 * 1024 * 1024

LANGUAGES = ("auto", "de", "en", "fr", "es", "it", "nl", "pl")
DEFAULT_SETTINGS = {
    "language": "auto",        # auto (language of the browser) | de | en | fr | es | it | nl | pl
    "langChosen": False,       # true once somebody picked a language; until then every start follows the browser (older installs had "de" stored by default)
    "theme": "dark",           # holo | dark | light
    "units": "metric",         # metric | imperial
    "grid": 0.25,              # meters
    "wallHeight": 2.6,
    "wallThickness": 0.2,
    "shadows": True,
    "autosaveSeconds": 1.5,
    "lowWalls": False,
    "cameraImages": True,       # still images of cameras in the room panel and the camera popup (a camera shows people: can be switched off)
    "labelMode": "important",   # value labels on devices: none | important (sensors, climate, covers) | all
    "cutaway": True,           # walls facing the camera sink down
    "earth": "solid",          # ground around the house: off | glass | solid (cut open on the camera's side)
    "earthMargin": 5.0,        # metres of lawn around the house when no plot (Grundstück) is drawn
    "wallStop": True,          # devices cannot be dragged through walls (doors let them pass)
    "seeThrough": False,       # walls between the camera and the room turn see-through instead of sinking down
    "placeSelect": True,       # a device that was just placed stays selected (movable at once); the next click on empty space deselects it
    "updateCheck": True,       # edit mode asks GitHub every few minutes whether a newer version exists (only the public manifest is fetched)
    "autoBackup": False,       # automatic backups into the backups folder of the add-on configuration (addon_configs/<...>_floorplan3d/backups)
    "backupEveryHours": 24.0,  # ... one backup this many hours after the last one (24 = daily)
    "backupKeepDays": 14.0,    # automatic backups older than this many days are deleted (the newest one always stays)
    "backupKeepCount": 30.0,   # ... and never more than this many automatic backups are kept
    "timelineOn": True,        # security view: record what switched in the house (timeline.py), one file per day in addon_configs/<...>/timeline
    "timelineKeepDays": 7.0,   # ... days kept before today (older ones are deleted)
    "alerts": True,            # smoke, gas, CO, water, alarm and windows open in the rain: banner + red room
    "alertJump": False,        # jump to the room of a new warning by itself (wall tablets)
    "weatherEntity": "",       # weather.* for "window open in the rain" and the weather in the sky (#419); empty = the first one
    "sky": "time",             # time: the sky behind the 3D view follows the sun and the weather (#418) | off: one colour
    "energyCard": True,        # live mode on wide screens: the energy flow as a picture instead of the line of numbers (#420)
    "roomTiles": True,         # live mode: a card per room at the bottom (#421)
    "roomLabels": True,        # live mode, wide screens: a label over every room in the 3D view (name, temperature, lights, somebody there, #430)
    "windowFrames": "white",   # white | anthracite: the colour of the window frames; anthracite with lighter walls (#428)
    "facade": "",              # the finish of the outside of the walls (#448): '' (their colour, as always) or a facade pattern (importer.FACADE_FINISHES)
    "facadeColor": "",         # ... its colour, '' for the pattern's own
    "idleReturn": 0.0,         # wall tablets: minutes without a touch until the start view returns (0 = off)
    "idleOrbit": False,        # ... and the house then turns slowly (screen saver)
    "nightDim": "off",         # off | sun | time: dim the live view at night
    "nightFrom": "22:00",
    "nightTo": "06:00",
    "belowMode": "dim",        # floors below the open one: dim (see-through, belowVisibility) | stacked (clearly visible) | hidden
    "belowLabels": True,       # room names and value labels of the floors below the open one (#249)
    "houseFloors": "normal",   # floors of the whole-house view: normal (as built) | apart (pulled apart) | stacked (like a real house)
    "belowVisibility": 0.5,    # how clearly floors below the current one shine through (0.05..1)
    "wallOpacity": 0.72,       # hologram walls: 0.2 (glass) .. 1 (solid)
    "glowRadius": 3.5,         # metres a lamp lights up
    "glowStrength": 1.0,
    "glowHeight": 1.6,         # metres the coloured glow climbs the walls
    "defaultLightColor": "#ffc861",
    "userRooms": {},           # Home Assistant user name -> room name (one tablet per room)
    "effectColors": {},        # light effect / scene name -> display colour (HA does not report what an effect looks like)
    "userViews": {},           # Home Assistant user name -> 3d | 2d | split | all (what that user sees in live mode)
    "userPresets": {},         # Home Assistant user name -> its own start values for the look (PRESET_FIELDS, #250)
    "userLocks": {},           # Home Assistant user name -> what that user may not use (LOCKS, static/userlocks.js)
    "startViews": {},          # Home Assistant user name or "*" (everybody) -> saved start view (static/startview.js, #315)
    "userBuildings": {},       # Home Assistant user name -> the building of a plan that user sees (several buildings in one plan, #409)
    "userTabs": {},            # Home Assistant user name -> {"hide": [tab], "start": tab, "variants": {page: version}}: the tab bar of that user
                               # (TABS, static/tabs.js, #479) and the own version of a page he sees (#507)
    "tabBar": True,            # the tab bar at the bottom of the live view (#479): the house and pages beside it
    "agendaCalendars": [],     # the calendars of the page ☀ Heute (#481); empty = all calendars of Home Assistant
    "wasteCalendar": "",       # the calendar of the waste collection (#481): its next dates stand apart on the page ☀ Heute
    "presence": {"rule": "ha", "ssids": []},   # who is really at home (#495, pages.clean_presence): {rule: ha | any | two, ssids: [the home Wi-Fi]}
    "routines": [],            # the buttons of the page ▶ Abläufe (#483): scenes, scripts, buttons; empty = every scene and script
    "routineLeave": "",        # the routine "Ich gehe" starts after its check (a scene, script or button, #483); "" = only the check
    "routineNight": "",        # the same for "Gute Nacht"
    "pageLayouts": {},         # the pages arranged by an admin (#484): {page: {"order", "hidden", "cards"}} (boards.py, static/pagelayout.js)
    "pageVariants": {},        # own versions of a page for some users (#507): {page: [{"id": "v_…", "name", "icon", "layout"}]} (static/pagevariants.js)
    "customTabs": [],          # own pages of the tab bar (#484): [{"id": "p_…", "name", "icon"}]
    "tabOrder": [],            # the order of the tab bar (#484): tab keys, the house always first
    "radioStations": [],       # the radio stations of the page 🎵 Musik & TV (#490): [{"name", "url"}] (pages.clean_stations)
    "shoppingList": "",        # the to-do list of the page 🧺 Haushalt (#490): a todo.*; "" = a shopping list of Home Assistant
    "appliances": {},          # the machines of 🧺 Haushalt an admin chose (#490): {washer|dryer|dishwasher: {"power", "status"}}; the rest by name
    "householdTell": False,    # 🔔 a message whenever a machine is done, not only when somebody tapped "Sag mir Bescheid" (#531)
    "favorites": [],           # entity ids of the favourites in front of the room tiles (#471, static/favorites.js)
    "lightGroups": [],         # groups of rooms for "lights off" (#471): [{"id", "name", "rooms": [room id]}] (static/lightgroups.js)
    "voice": {"engine": "auto", "aliases": []},   # the voice search (#509, voice.clean_voice): which recognition, the code words
    "doorbell": {"on": True, "sound": True, "bells": []},   # 🔔 the camera on every screen when somebody rings (pages.clean_doorbell, static/doorbell.js)
    "bgTop": "#0a3ba8",
    "bgBottom": "#031547",
    "bgGlow": "#28ebd2",
    "bgGlowStrength": 0.0,      # corner glow of the hologram backdrop, 0 = off (default), 1 = full
    "tempStops": [{"v": 16, "c": "#2a6bff"}, {"v": 20, "c": "#2ad0a0"}, {"v": 23, "c": "#ffd84a"},
                  {"v": 26, "c": "#ff8a2a"}, {"v": 30, "c": "#ff3a3a"}],
    "humidStops": [{"v": 30, "c": "#e8d9a0"}, {"v": 50, "c": "#4fd0c8"}, {"v": 65, "c": "#2a7bff"},
                   {"v": 80, "c": "#5a3aff"}],
    "co2Stops": [{"v": 400, "c": "#2ad0a0"}, {"v": 800, "c": "#ffd84a"}, {"v": 1200, "c": "#ff8a2a"},
                 {"v": 2000, "c": "#ff3a3a"}],
}
RANGES = {"idleReturn": (0.0, 240.0), "belowVisibility": (0.05, 1.0), "wallOpacity": (0.2, 1.0), "glowRadius": (0.5, 12.0), "glowStrength": (0.2, 3.0), "glowHeight": (0.2, 4.0), "bgGlowStrength": (0.0, 1.0), "earthMargin": (0.5, 100.0), "backupEveryHours": (1.0, 720.0), "backupKeepDays": (1.0, 3650.0), "backupKeepCount": (1.0, 500.0), "timelineKeepDays": (1.0, 31.0)}
VIEWS = ("3d", "2d", "split", "all")
# what a user preset may set and the values allowed (the same list as PRESET_FIELDS in static/viewprefs.js, #250)
PRESET_FIELDS = {"seeThrough": (True, False), "cutaway": (True, False), "lowWalls": (True, False),
                 "labelMode": ("important", "all", "none"), "belowMode": ("dim", "stacked", "hidden"), "belowLabels": (True, False),
                 "houseFloors": ("normal", "apart", "stacked"), "roomTiles": (True, False), "roomLabels": (True, False)}

# the tabs of the tab bar (the same keys as TABS in static/tabs.js, #479); the house is always there, the others can be hidden per user
TABS = boards.TABS            # own pages of an admin (#484) are "p_…" (boards.CUSTOM_ID)

# what can be locked for a user (the same list as LOCKS in static/userlocks.js); "control", "alarm" and "cameras" are refused here too;
# "fullscreen" keeps the screen in full screen, only the code ends it (#487, api/fullscreen)
LOCKS = ("control", "alarm", "guard", "details", "cameras", "energy", "colorModes", "viewMenu", "floorGap", "views", "houses", "building", "search", "voice", "settings",
         "timeline", "fullscreen", "doorbell")


def clean_locks(val) -> dict:
    """{user: [lock]}: at most 50 users, only known locks (each once, in the order of LOCKS), users without a lock dropped."""
    if not isinstance(val, dict):
        return {}
    out = {}
    for user, locks in list(val.items())[:50]:
        if not str(user) or not isinstance(locks, list):
            continue
        clean = [k for k in LOCKS if k in locks]
        if clean:
            out[str(user)[:80]] = clean
    return out


def clean_user_tabs(val) -> dict:
    """{user: {"hide": [tab], "start": tab, "variants": {page: id}}} like cleanUserTabs in static/tabs.js: at most 50 users, only known
    tabs, the house never hidden, a hidden or the house as start tab dropped, the versions of the pages (#507), users with nothing left out."""
    if not isinstance(val, dict):
        return {}
    out = {}
    for user, v in list(val.items())[:50]:
        u = str(user).strip()[:80]
        if not u or not isinstance(v, dict):
            continue
        hide = [k for k in TABS if k != "house" and isinstance(v.get("hide"), list) and k in v["hide"]]
        for k in v.get("hide") if isinstance(v.get("hide"), list) else []:          # own pages (#484)
            if isinstance(k, str) and boards.CUSTOM_ID.match(k) and k not in hide:
                hide.append(k)
        start = v.get("start") if boards.is_tab_key(v.get("start")) and v.get("start") != "house" and v.get("start") not in hide else ""
        picks = boards.clean_picks(v.get("variants"))
        if hide or start or picks:
            out[u] = {"hide": hide, **({"start": start} if start else {}), **({"variants": picks} if picks else {})}
    return out


def drop_gone_picks(user_tabs: dict, variants: dict) -> dict:
    """userTabs without the versions of pages that do not exist (any more, #507); users with nothing left out"""
    out = {}
    for user, e in user_tabs.items():
        picks = {k: v for k, v in (e.get("variants") or {}).items() if any(x["id"] == v for x in variants.get(k, []))}
        e = {k: v for k, v in e.items() if k != "variants"} | ({"variants": picks} if picks else {})
        if e["hide"] or e.get("start") or picks:
            out[user] = e
    return out


def user_locks(request) -> set:
    """The locks of the user looking (by Home Assistant user name or id); none in standalone mode."""
    ids = current_user(request)["ids"]
    if not ids:
        return set()
    locks = clean_locks(read_settings(request).get("userLocks", {}))
    return set(next((v for k, v in locks.items() if k.strip().lower() in ids), []))


def clean_start_view(v):
    """One saved start view (the same rules as cleanStartView in static/startview.js); None for junk."""
    def vec(x):
        ok = isinstance(x, list) and len(x) == 3 and all(isinstance(n, (int, float)) and not isinstance(n, bool) and math.isfinite(n) and abs(n) < 1e5 for n in x)
        return [round(float(n), 3) for n in x] if ok else None
    if not isinstance(v, dict):
        return None
    cam, target = vec(v.get("cam")), vec(v.get("target"))
    if not cam or not target:
        return None
    s = lambda k, n: v[k] if isinstance(v.get(k), str) and len(v[k]) <= n else ""
    idx = v.get("idx")
    return {"house": s("house", 32), "floor": s("floor", 40),
            "idx": idx if isinstance(idx, int) and not isinstance(idx, bool) and 0 <= idx < 100 else -1,
            "whole": v.get("whole") is True, "room": s("room", 40) or None, "cam": cam, "target": target}


def clean_start_views(val) -> dict:
    """{user or "*": start view}: at most 50, junk dropped."""
    if not isinstance(val, dict):
        return {}
    out = {}
    for user, v in list(val.items())[:50]:
        c = clean_start_view(v)
        if str(user) and c:
            out[str(user)[:80]] = c
    return out


def clean_presets(val) -> dict:
    """{user: {field: value}}: at most 50 users, only known fields with allowed values, users without any field dropped."""
    if not isinstance(val, dict):
        return {}
    out = {}
    for user, preset in list(val.items())[:50]:
        if not str(user) or not isinstance(preset, dict):
            continue
        clean = {k: v for k, v in preset.items() if k in PRESET_FIELDS and any(type(v) is type(a) and v == a for a in PRESET_FIELDS[k])}   # 1 never counts as True
        if clean:
            out[str(user)[:80]] = clean
    return out


HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
EMPTY_LAYOUT = {
    "version": 1,
    "floors": [{"id": "f1", "name": "Erdgeschoss", "walls": [], "rooms": [], "devices": []}],
}

log = logging.getLogger("floorplan3d")
KEY_DATA = web.AppKey("data_dir", Path)
KEY_CONFIG = web.AppKey("config_dir", Path)
KEY_SESSION = "fp3d.session"                    # on a request: who logged in with Home Assistant (login_gate, #489)
USERS_FILE = "users.json"       # in the add-on config folder of Home Assistant (addon_configs): survives updates and reinstalls


def data_dir(request) -> Path:
    return request.app[KEY_DATA]


def ha_headers():
    return {"Authorization": f"Bearer {SUPERVISOR_TOKEN}", "Content-Type": "application/json"}


def ha_ws_url() -> str:
    """Home Assistant's websocket: through the Supervisor at /core/websocket, Home Assistant itself (HA_URL, #489) at /api/websocket"""
    if HA_URL:
        return hl.ha_base(HA_URL) + "/api/websocket"
    return (HA_API[:-4] if HA_API.endswith("/api") else HA_API).rstrip("/") + "/websocket"


def write_json_atomic(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), "utf-8")
    tmp.replace(path)


def read_json(path: Path, default):
    if path.exists():
        try:
            return json.loads(path.read_text("utf-8"))
        except (OSError, ValueError):
            log.exception("%s unreadable, using default", path.name)
    return default


# ---------- who is allowed to edit ----------
def current_user(request) -> dict:
    """Home Assistant Ingress tells us who is looking through X-Remote-User-* headers; without the Supervisor (#489) the login cookie
    does (login_gate), and such headers count for nothing: anybody could send them."""
    if HA_LOGIN:
        return hl.who(request.get(KEY_SESSION))
    h = request.headers
    names = {v.strip().lower() for v in (h.get("X-Remote-User-Name"), h.get("X-Remote-User-Display-Name"),
                                         h.get("X-Remote-User-Id")) if v and v.strip()}
    return {"name": (h.get("X-Remote-User-Name") or h.get("X-Remote-User-Display-Name") or "").strip(),
            "display": (h.get("X-Remote-User-Display-Name") or h.get("X-Remote-User-Name") or "").strip(), "ids": names}


def editors() -> set:
    """Add-on option `editors`: extra user names (or ids) that may edit besides the Home Assistant administrators; in a Docker
    container (#489) also the variable EDITORS ("anna,ben")."""
    data = read_json(OPTIONS_FILE, {})
    raw = data.get("editors") if isinstance(data, dict) else None
    out = {str(x).strip().lower() for x in raw if str(x).strip()} if isinstance(raw, list) else set()
    return out | {x.strip().lower() for x in os.environ.get("EDITORS", "").split(",") if x.strip()}


_admin_cache = {"at": float("-inf"), "ids": None, "users": [], "active": None, "byid": {}}


async def load_admin_ids():
    """Ids and login names of all Home Assistant administrators (owner or group system-admin), or None if they cannot be read.
    Asks Home Assistant's websocket API (config/auth/list) with the Supervisor token; cached for a minute."""
    now = time.monotonic()
    if now - _admin_cache["at"] < 60:
        return _admin_cache["ids"]
    ids = None
    try:
        async with aiohttp.ClientSession() as sess:
            async with sess.ws_connect(ha_ws_url(), timeout=aiohttp.ClientWSTimeout(ws_close=5) if hasattr(aiohttp, "ClientWSTimeout") else 5) as ws:
                await asyncio.wait_for(ws.receive_json(), 5)                                   # auth_required
                await ws.send_json({"type": "auth", "access_token": SUPERVISOR_TOKEN})
                if (await asyncio.wait_for(ws.receive_json(), 5)).get("type") == "auth_ok":
                    await ws.send_json({"id": 1, "type": "config/auth/list"})
                    res = await asyncio.wait_for(ws.receive_json(), 5)
                    if res.get("success") and isinstance(res.get("result"), list):
                        ids, users, active, byid = set(), [], set(), {}
                        for u in res["result"]:
                            admin = bool(u.get("is_owner") or "system-admin" in (u.get("group_ids") or []))
                            if admin:
                                ids |= {str(v).strip().lower() for v in (u.get("id"), u.get("username")) if v}
                            if u.get("is_active", True) and not u.get("system_generated") and u.get("username"):
                                users.append({"username": u["username"], "name": u.get("name") or u["username"], "admin": admin})
                            if u.get("is_active", True) and isinstance(u.get("id"), str):
                                active.add(u["id"])
                                byid[u["id"]] = u.get("username") or ""
                        _admin_cache.update(users=users, active=active, byid=byid)
    except Exception as err:  # noqa: BLE001 - any failure means "unknown"
        log.warning("Could not read the Home Assistant administrators (%s); only users listed in `editors` may edit", err)
    _admin_cache.update(at=now, ids=ids)
    return ids


async def can_edit(request) -> bool:
    """Administrators and users named in `editors` may edit; everybody else gets the read-only live view."""
    if not SUPERVISOR_TOKEN:          # standalone/dev mode: no Home Assistant, no users
        return True
    ids = current_user(request)["ids"]
    if editors() & ids:
        return True
    admins = await load_admin_ids()
    if admins is None and HA_LOGIN:     # the token is not an administrator's: what Home Assistant said at the login
        return bool((request.get(KEY_SESSION) or {}).get("admin"))
    return bool(admins and admins & ids)


def forbidden():
    return web.json_response({"error": "editing is not allowed for this user"}, status=403)


async def get_me(request):
    user = current_user(request)
    rooms = read_settings(request).get("userRooms", {})
    room = None
    if isinstance(rooms, dict):
        room = next((v for k, v in rooms.items() if str(k).strip().lower() in user["ids"]), None)
    edit = await can_edit(request)
    views = read_settings(request).get("userViews", {})
    view = next((v for k, v in views.items() if str(k).strip().lower() in user["ids"] and v in VIEWS), "3d") if isinstance(views, dict) else "3d"
    presets = clean_presets(read_settings(request).get("userPresets", {}))
    preset = next((v for k, v in presets.items() if k.strip().lower() in user["ids"]), {})
    starts = clean_start_views(read_settings(request).get("startViews", {}))
    start = next((v for k, v in starts.items() if k != "*" and k.strip().lower() in user["ids"]), starts.get("*"))   # own start view, else everybody's
    buildings = read_settings(request).get("userBuildings", {})
    building = next((v for k, v in buildings.items() if str(k).strip().lower() in user["ids"]), None) if isinstance(buildings, dict) else None
    tabs = next((v for k, v in clean_user_tabs(read_settings(request).get("userTabs", {})).items() if k.strip().lower() in user["ids"]), {})
    return web.json_response({"user": user["name"], "canEdit": edit, "room": room, "view": view, "preset": preset, "start": start, "building": building, "tabs": tabs,
                              "locks": [k for k in LOCKS if k in user_locks(request)],
                              "adminCheck": (not SUPERVISOR_TOKEN) or HA_LOGIN or _admin_cache["ids"] is not None, "login": HA_LOGIN})


async def get_users(request):
    """Home Assistant users for the user pickers in the settings (editors only)."""
    if not await can_edit(request):
        return forbidden()
    if SUPERVISOR_TOKEN:
        await load_admin_ids()
    return web.json_response(_admin_cache["users"] if SUPERVISOR_TOKEN else [])


# ---------- without the Supervisor (Home Assistant as a Docker container, #489): log in with Home Assistant ----------
_login_keys: dict = {}


def login_key(request) -> bytes:
    """the add-on's own key for its login cookies: made once, kept in the data folder (not in a backup)"""
    path = data_dir(request) / ".login_key"
    if path not in _login_keys:
        try:
            key = bytes.fromhex(path.read_text("utf-8").strip())
        except (OSError, ValueError):
            key = b""
        if len(key) < 32:
            key = secrets.token_bytes(32)
            path.parent.mkdir(parents=True, exist_ok=True)
            with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w", encoding="utf-8") as f:
                f.write(key.hex())
        _login_keys[path] = key
    return _login_keys[path]


def is_https(request) -> bool:
    return APP_URL.startswith("https:") or request.scheme == "https" or \
        request.headers.get("X-Forwarded-Proto", "").split(",")[0].strip().lower() == "https"


def set_session(request, resp, sess: dict) -> None:
    resp.set_cookie(hl.SESSION_COOKIE, hl.sign(sess, login_key(request)), max_age=hl.SESSION_DAYS * 86400, path="/",
                    httponly=True, samesite="Lax", secure=is_https(request))


@web.middleware
async def login_gate(request, handler):
    """Without Ingress only who logged in with Home Assistant gets the page and its data: the page itself is sent to the login, a
    request of its data gets 401 (login.js then goes to the login). A user removed or switched off in Home Assistant is out at once.
    A change (or the live channel) only from the page itself: another page in the same browser gets 403."""
    if not HA_LOGIN or request.path.startswith("/auth/"):
        return await handler(request)
    if (request.method not in ("GET", "HEAD", "OPTIONS") or request.headers.get("Upgrade", "").lower() == "websocket") and \
            not hl.same_origin(request.headers.get("Origin"), request.host, APP_URL):
        return web.json_response({"error": "not from this page"}, status=403)
    now = time.time()
    sess = hl.unsign(request.cookies.get(hl.SESSION_COOKIE), login_key(request), now)
    if sess:
        await load_admin_ids()
        if _admin_cache["active"] is not None and sess.get("id") not in _admin_cache["active"]:
            sess = None
    if not sess:
        if hl.is_page(request.method, request.path):
            query = f"?{request.rel_url.raw_query_string}" if request.rel_url.raw_query_string else ""
            return web.Response(status=302, headers={"Location": "auth/login" + query, "Cache-Control": "no-store"})
        return web.json_response({"error": "login required"}, status=401, headers={"X-Login": "1"})
    request[KEY_SESSION] = sess
    resp = await handler(request)
    fresh = hl.renewed(sess, now)
    if fresh and not resp.prepared:
        set_session(request, resp, fresh)
    return resp


def auth_page(status: int, de: str, en: str, link: str, link_de: str, link_en: str):
    """a small page of the login (in German and English: the language setting is only known after it)"""
    body = (f"<p>{html.escape(de)}</p><p lang=en>{html.escape(en)}</p>"
            f"<p><a href=\"{html.escape(link)}\">{html.escape(link_de)} / {html.escape(link_en)}</a></p>")
    return web.Response(status=status, content_type="text/html", headers={"Cache-Control": "no-store"},
                        text="<!doctype html><html lang=de><meta charset=utf-8><meta name=viewport content=\"width=device-width\">"
                             "<title>3D Floorplan</title><body style=\"font-family:system-ui,sans-serif;margin:2em;line-height:1.5\">"
                             f"<h2>3D Floorplan</h2>{body}</body></html>")


async def auth_login(request):
    """to Home Assistant's login page; it comes back to auth/callback (the page's address is the client id)"""
    if not HA_LOGIN:
        raise web.HTTPNotFound()
    state = secrets.token_urlsafe(24)
    cid = hl.app_base(APP_URL, "https" if is_https(request) else "http", request.host)
    resp = web.Response(status=302, headers={"Cache-Control": "no-store",
                                             "Location": hl.authorize_url(hl.browser_ha(HA_URL or HA_API, HA_PUBLIC_URL, request.host), cid, state)})
    login = {"state": state, "cid": cid, "q": request.rel_url.raw_query_string[:1000], "exp": int(time.time()) + hl.LOGIN_SECONDS}
    resp.set_cookie(hl.LOGIN_COOKIE, hl.sign(login, login_key(request)),
                    max_age=hl.LOGIN_SECONDS, path="/", httponly=True, samesite="Lax", secure=is_https(request))
    return resp


async def ha_login_user(code: str, client_id: str):
    """who logged in: Home Assistant's code for an access token, with it auth/current_user ({"id", "name", "is_admin", …}); the
    token is given back at once (the add-on works with its own), None when it did not work"""
    base = hl.ha_base(HA_URL or HA_API)
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as s:
            async with s.post(f"{base}/auth/token", data={"grant_type": "authorization_code", "code": code, "client_id": client_id}) as r:
                tok = await r.json(content_type=None) if r.status == 200 else None
            if not isinstance(tok, dict) or not isinstance(tok.get("access_token"), str):
                log.warning("Login: Home Assistant did not take the code")
                return None
            user = None
            async with s.ws_connect(ha_ws_url()) as ws:
                await asyncio.wait_for(ws.receive_json(), 5)                                   # auth_required
                await ws.send_json({"type": "auth", "access_token": tok["access_token"]})
                if (await asyncio.wait_for(ws.receive_json(), 5)).get("type") == "auth_ok":
                    await ws.send_json({"id": 1, "type": "auth/current_user"})
                    res = await asyncio.wait_for(ws.receive_json(), 5)
                    user = res.get("result") if res.get("success") else None
            if isinstance(tok.get("refresh_token"), str):
                try:
                    async with s.post(f"{base}/auth/revoke", data={"token": tok["refresh_token"]}):
                        pass
                except (aiohttp.ClientError, asyncio.TimeoutError):
                    pass
            return user
    except Exception as err:  # noqa: BLE001 - not reachable, an odd answer: no login
        log.warning("Login with Home Assistant failed (%s)", err)
        return None


async def auth_callback(request):
    """back from Home Assistant's login page: only with the state of this browser's own login (auth/login), then the cookie"""
    if not HA_LOGIN:
        raise web.HTTPNotFound()
    login = hl.unsign(request.cookies.get(hl.LOGIN_COOKIE), login_key(request))
    code, state = request.query.get("code", ""), request.query.get("state", "")
    again = ("login", "Erneut anmelden", "Log in again")
    if not login or not hl.STATE.match(state) or not hmac.compare_digest(str(login.get("state")), state) or not 0 < len(code) <= 512:
        return auth_page(400, "Die Anmeldung ist abgelaufen oder kam nicht von hier.", "The login ran out or did not start here.", *again)
    user = await ha_login_user(code, str(login.get("cid")))
    await load_admin_ids()
    sess = hl.new_session(user, _admin_cache["byid"].get((user or {}).get("id")), time.time())
    if not sess:
        return auth_page(502, "Home Assistant hat die Anmeldung nicht bestätigt.", "Home Assistant did not confirm the login.", *again)
    resp = web.Response(status=302, headers={"Location": hl.back_to(login.get("q")), "Cache-Control": "no-store"})
    set_session(request, resp, sess)
    resp.del_cookie(hl.LOGIN_COOKIE, path="/")
    log.info("%s logged in", sess["user"] or sess["name"] or sess["id"])
    return resp


async def auth_logout(request):
    if not HA_LOGIN:
        raise web.HTTPNotFound()
    resp = auth_page(200, "Abgemeldet.", "Logged out.", "login", "Wieder anmelden", "Log in")
    resp.del_cookie(hl.SESSION_COOKIE, path="/")
    return resp


# ---------- houses (several floor plans) ----------
HOUSE_ID = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")
DEFAULT_HOUSE = "main"          # the original single layout.json, so existing installs keep their plan


def houses_index(request) -> list:
    data = read_json(data_dir(request) / "houses.json", None)
    houses = [h for h in (data or {}).get("houses", []) if isinstance(h, dict) and HOUSE_ID.match(str(h.get("id", ""))) and str(h.get("name", "")).strip()]
    if not houses:
        houses = [{"id": DEFAULT_HOUSE, "name": "Haus"}]
    return houses


def save_houses(request, houses: list) -> None:
    write_json_atomic(data_dir(request) / "houses.json", {"houses": houses})


def house_file(request, hid: str) -> Path:
    return data_dir(request) / ("layout.json" if hid == DEFAULT_HOUSE else f"layouts/{hid}.json")


def pick_house(request):
    """The house named by ?house= (id), else the first one; None if it does not exist."""
    houses = houses_index(request)
    wanted = request.query.get("house")
    if not wanted:
        return houses[0]["id"]
    return wanted if any(h["id"] == wanted for h in houses) else None


async def get_houses(request):
    return web.json_response(houses_index(request))


async def post_house(request):
    """Create a house (empty, or a copy of another one with {"copyFrom": id})."""
    if not await can_edit(request):
        return forbidden()
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    name = str((body or {}).get("name", "")).strip()[:60]
    if not name:
        return web.json_response({"error": "name missing"}, status=400)
    houses = houses_index(request)
    if len(houses) >= 20:
        return web.json_response({"error": "too many houses"}, status=400)
    hid = secrets.token_hex(4)
    src = (body or {}).get("copyFrom")
    if src and any(h["id"] == src for h in houses):
        layout = read_json(house_file(request, src), EMPTY_LAYOUT)
    else:
        layout = EMPTY_LAYOUT
    write_json_atomic(house_file(request, hid), layout)
    houses.append({"id": hid, "name": name})
    save_houses(request, houses)
    return web.json_response({"id": hid, "name": name})


async def patch_house(request):
    if not await can_edit(request):
        return forbidden()
    hid = request.match_info["id"]
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    name = str((body or {}).get("name", "")).strip()[:60]
    houses = houses_index(request)
    h = next((x for x in houses if x["id"] == hid), None)
    if not h or not name:
        return web.json_response({"error": "unknown house or name missing"}, status=404 if not h else 400)
    h["name"] = name
    save_houses(request, houses)
    return web.json_response({"ok": True})


async def delete_house(request):
    if not await can_edit(request):
        return forbidden()
    hid = request.match_info["id"]
    houses = houses_index(request)
    if len(houses) < 2 or not any(h["id"] == hid for h in houses):
        return web.json_response({"error": "cannot delete"}, status=400)
    save_houses(request, [h for h in houses if h["id"] != hid])
    try:
        house_file(request, hid).unlink()
    except OSError:
        pass
    return web.json_response({"ok": True})


# ---------- layout ----------
def layout_rev(path: Path) -> str:
    """A version tag of a stored plan (#403): a browser that loaded an older state must not overwrite a plan saved meanwhile on another
    screen. Taken from the content (not the file time, which some file systems keep in whole seconds only)."""
    try:
        return f'"{hashlib.sha1(path.read_bytes()).hexdigest()[:16]}"'
    except OSError:
        return '"0"'


async def get_layout(request):
    hid = pick_house(request)
    if hid is None:
        return web.json_response({"error": "unknown house"}, status=404)
    p = house_file(request, hid)
    return web.json_response(read_json(p, EMPTY_LAYOUT), headers={"ETag": layout_rev(p)})


async def put_layout(request):
    if not await can_edit(request):
        return forbidden()
    hid = pick_house(request)
    if hid is None:
        return web.json_response({"error": "unknown house"}, status=404)
    try:
        data = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    if not isinstance(data, dict) or not isinstance(data.get("floors"), list):
        return web.json_response({"error": "floors missing"}, status=400)
    p = house_file(request, hid)
    have = request.headers.get("If-Match")                 # no tag (an older browser, a script): saved as before
    if have and have.removeprefix("W/") != layout_rev(p):
        return web.json_response({"error": "the plan was changed on another screen meanwhile", "conflict": True}, status=409)
    watch = request.app[KEY_RENAMES]
    if watch.get("history") and rn.fix_stale(data, watch["history"], watch["current"], time.time()):
        log.info("A browser saved the plan with entity ids renamed in Home Assistant meanwhile: the new ids were put in")
    write_json_atomic(p, data)
    if hid == DEFAULT_HOUSE and not (data_dir(request) / "houses.json").exists():
        save_houses(request, houses_index(request))
    return web.json_response({"ok": True}, headers={"ETag": layout_rev(p)})


# ---------- settings ----------
def clean_stops(val, default):
    """Colour stops: [{"v": number, "c": "#rrggbb"}], 2..10 entries, sorted by value."""
    if not isinstance(val, list):
        return default
    stops = []
    for item in val[:10]:
        if isinstance(item, dict) and isinstance(item.get("c"), str) and HEX.match(item["c"]) \
                and isinstance(item.get("v"), (int, float)) and not isinstance(item["v"], bool):
            stops.append({"v": float(item["v"]), "c": item["c"].lower()})
    return sorted(stops, key=lambda x: x["v"]) if len(stops) >= 2 else default


FAV_DOMAINS = ("light", "switch", "input_boolean", "fan", "cover", "media_player", "scene", "script", "button", "input_button")
ENTITY_ID = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")


def clean_favorites(val) -> list:
    """The favourites (#471): entity ids of a domain that one tap switches or starts (static/favorites.js FAV_SERVICE), each once, at most 16."""
    out = []
    for e in val if isinstance(val, list) else []:
        if isinstance(e, str) and len(e) <= 255 and ENTITY_ID.match(e) and e.split(".")[0] in FAV_DOMAINS and e not in out:
            out.append(e)
    return out[:16]


ROUTINE_DOMAINS = ("scene", "script", "button", "input_button")


def clean_routines(val) -> list:
    """The buttons of the page ▶ Abläufe (#483, cleanRoutines in static/routines.js): scenes, scripts and buttons, each once, at most 24."""
    out = []
    for e in val if isinstance(val, list) else []:
        if isinstance(e, str) and len(e) <= 255 and ENTITY_ID.match(e) and e.split(".")[0] in ROUTINE_DOMAINS and e not in out:
            out.append(e)
    return out[:24]


def clean_light_groups(val) -> list:
    """The light groups (#471): [{"id", "name", "rooms": [room id]}], at most 12, like cleanGroups in static/lightgroups.js."""
    out, ids = [], set()
    for i, g in enumerate([g for g in val if isinstance(g, dict)][:12] if isinstance(val, list) else []):
        gid = g.get("id") if isinstance(g.get("id"), str) and g.get("id") else f"g{i + 1}"
        gid = gid[:40]
        while gid in ids:
            gid += "_"
        ids.add(gid)
        name = g.get("name").strip()[:40] if isinstance(g.get("name"), str) else ""
        rooms = []
        for r in g.get("rooms") if isinstance(g.get("rooms"), list) else []:
            if isinstance(r, str) and r and len(r) <= 80 and r not in rooms:
                rooms.append(r)
        out.append({"id": gid, "name": name or f"#{i + 1}", "rooms": rooms[:200]})
    return out


def validate_settings(data: dict) -> dict:
    """Keep only known keys with the right type; unknown keys are dropped."""
    out = dict(DEFAULT_SETTINGS)
    if "labelMode" not in data and data.get("showLabels") is False:     # settings saved before the three label modes existed
        data = {**data, "labelMode": "none"}
    for key, default in DEFAULT_SETTINGS.items():
        if key not in data:
            continue
        val = data[key]
        if key == "userPresets":
            out[key] = clean_presets(val)
        elif key == "userLocks":
            out[key] = clean_locks(val)
        elif key == "startViews":
            out[key] = clean_start_views(val)
        elif key == "favorites":
            out[key] = clean_favorites(val)
        elif key == "lightGroups":
            out[key] = clean_light_groups(val)
        elif key == "userTabs":
            out[key] = clean_user_tabs(val)
        elif key == "agendaCalendars":
            out[key] = pages.clean_calendars(val)
        elif key == "routines":
            out[key] = clean_routines(val)
        elif key == "customTabs":
            out[key] = boards.clean_custom_tabs(val)
        elif key == "tabOrder":
            out[key] = boards.clean_tab_order(val)
        elif key in ("pageLayouts", "pageVariants"):
            pass                                                      # after the loop: they need the own pages
        elif key == "radioStations":
            out[key] = pages.clean_stations(val)
        elif key == "appliances":
            out[key] = hh.clean_chosen(val)
        elif key == "presence":
            out[key] = pages.clean_presence(val)
        elif key == "voice":
            out[key] = vc.clean_voice(val)
        elif key == "doorbell":
            out[key] = pages.clean_doorbell(val)
        elif isinstance(default, dict):
            out[key] = ({str(k)[:80]: v[:80] for k, v in list(val.items())[:50] if isinstance(v, str) and v and str(k)}
                        if isinstance(val, dict) else {})
        elif isinstance(default, list):
            out[key] = clean_stops(val, default)
        elif isinstance(default, str) and HEX.match(default):
            if isinstance(val, str) and HEX.match(val):
                out[key] = val.lower()
        elif isinstance(default, bool):
            if isinstance(val, bool):
                out[key] = val
        elif isinstance(default, (int, float)):
            if isinstance(val, (int, float)) and not isinstance(val, bool) and val > 0:
                out[key] = float(val)
        elif isinstance(val, str):
            out[key] = val
    out["userViews"] = {k: v for k, v in out["userViews"].items() if v in VIEWS}
    for key, (lo, hi) in RANGES.items():
        out[key] = min(hi, max(lo, out[key]))
    if out["language"] not in LANGUAGES:
        out["language"] = DEFAULT_SETTINGS["language"]
    if out["theme"] not in ("holo", "dark", "light"):
        out["theme"] = DEFAULT_SETTINGS["theme"]
    if out["units"] not in ("metric", "imperial"):
        out["units"] = DEFAULT_SETTINGS["units"]
    if out["labelMode"] not in ("none", "important", "all"):
        out["labelMode"] = DEFAULT_SETTINGS["labelMode"]
    if out["belowMode"] not in ("dim", "stacked", "hidden"):
        out["belowMode"] = DEFAULT_SETTINGS["belowMode"]
    if out["houseFloors"] not in PRESET_FIELDS["houseFloors"]:
        out["houseFloors"] = DEFAULT_SETTINGS["houseFloors"]
    if out["earth"] not in ("off", "glass", "solid"):
        out["earth"] = DEFAULT_SETTINGS["earth"]
    if out["sky"] not in ("time", "off"):
        out["sky"] = DEFAULT_SETTINGS["sky"]
    if out["windowFrames"] not in ("white", "anthracite"):
        out["windowFrames"] = DEFAULT_SETTINGS["windowFrames"]
    if out["facade"] not in importer.FACADE_FINISHES:
        out["facade"] = ""
    if not (out["facade"] and re.fullmatch(r"#[0-9a-fA-F]{6}", out["facadeColor"] or "")):
        out["facadeColor"] = ""
    out["facadeColor"] = out["facadeColor"].lower()
    if out["nightDim"] not in ("off", "sun", "time"):
        out["nightDim"] = DEFAULT_SETTINGS["nightDim"]
    for key in ("nightFrom", "nightTo"):
        if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", out[key]):
            out[key] = DEFAULT_SETTINGS[key]
    if out["weatherEntity"] and not re.match(r"^weather\.[a-z0-9_]+$", out["weatherEntity"]):
        out["weatherEntity"] = ""
    if out["wasteCalendar"] and not pages.CALENDAR_ID.match(out["wasteCalendar"]):
        out["wasteCalendar"] = ""
    if out["shoppingList"] and not hh.TODO_ID.match(out["shoppingList"]):
        out["shoppingList"] = ""
    out["pageLayouts"] = boards.clean_page_layouts(data.get("pageLayouts"), out["customTabs"])
    out["pageVariants"] = boards.clean_page_variants(data.get("pageVariants"), out["customTabs"])
    out["userTabs"] = drop_gone_picks(out["userTabs"], out["pageVariants"])
    for key in ("routineLeave", "routineNight"):
        if out[key] and not clean_routines([out[key]]):
            out[key] = ""
    return out


def settings_path(request) -> Path:
    return data_dir(request) / "settings.json"


def settings_rev(request) -> str:
    """A version tag of the stored settings: a browser that loaded an older state must not overwrite newer settings."""
    p = settings_path(request)
    return f'"{p.stat().st_mtime_ns:x}"' if p.is_file() else '"0"'


def read_settings(request) -> dict:
    """Stored settings; if the file is damaged, the newest safety copy is used instead of silently falling back to defaults."""
    p = settings_path(request)
    stored = read_json(p, None)
    if not isinstance(stored, dict):
        copies = sorted((data_dir(request) / "backups").glob("settings-*.json")) if (data_dir(request) / "backups").is_dir() else []
        for c in reversed(copies):
            stored = read_json(c, None)
            if isinstance(stored, dict):
                break
        else:
            stored = {}
    if not p.is_file() and not stored:                 # fresh install: the users and tablets come back from the config folder
        stored = {**(read_users_file(request) or {})}
    return stored


def backup_settings(request) -> None:
    """Keep the last 10 distinct versions of the settings (tablet assignments included) in /data/backups."""
    p = settings_path(request)
    if not p.is_file():
        return
    d = data_dir(request) / "backups"
    d.mkdir(parents=True, exist_ok=True)
    cur = p.read_bytes()
    copies = sorted(d.glob("settings-*.json"))
    if copies and copies[-1].read_bytes() == cur:
        return
    (d / f"settings-{time.strftime('%Y%m%d-%H%M%S')}-{secrets.token_hex(2)}.json").write_bytes(cur)
    for old in copies[:-9]:
        old.unlink(missing_ok=True)


# ---------- users and tablets in a file of the add-on config folder ----------
USER_KEYS = ("userRooms", "userViews", "userPresets", "userLocks", "startViews", "userBuildings", "userTabs")   # what users.json in the config folder holds
NEWER_USER_KEYS = ("startViews", "userBuildings", "userTabs")   # a file written before these existed keeps the stored ones


def users_file(request) -> Path:
    return request.app[KEY_CONFIG] / USERS_FILE


def read_users_file(request) -> dict | None:
    """{"userRooms": ..., "userViews": ...} from the config folder, cleaned like the settings; None if there is no usable file."""
    data = read_json(users_file(request), None)
    if not isinstance(data, dict):
        return None
    clean = validate_settings({k: data.get(k) for k in USER_KEYS})
    return {k: clean[k] for k in USER_KEYS if k in data or k not in NEWER_USER_KEYS}   # a file from before the start views (#315) keeps them


def write_users_file(request, settings: dict) -> bool:
    """Mirror the users and tablets into the config folder (a readable file); never lets a settings save fail."""
    payload = {"version": 1, **{k: settings.get(k, {}) for k in USER_KEYS}}
    try:
        write_json_atomic(users_file(request), payload)
        return True
    except OSError:
        log.warning("could not write %s", users_file(request))
        return False


async def seed_users_file(app: web.Application) -> None:
    """After an update from a version without the file: create users.json from the stored settings (never overwrites)."""
    shim = types.SimpleNamespace(app=app)
    if users_file(shim).exists():
        return
    stored = read_json(app[KEY_DATA] / "settings.json", None)
    if isinstance(stored, dict):
        clean = validate_settings(stored)
        if any(clean[k] for k in USER_KEYS):
            write_users_file(shim, clean)


async def get_users_file(request):
    if not await can_edit(request):
        return forbidden()
    file = read_users_file(request)
    cur = validate_settings(read_settings(request))
    mine = {k: cur[k] for k in USER_KEYS}
    names = lambda d: set().union(*(d.get(k, {}) for k in USER_KEYS)) - {"*"}   # "*": the start view of everybody, not a user
    return web.json_response({"file": USERS_FILE, "exists": file is not None, "fileUsers": len(names(file)) if file else 0,
                              "users": len(names(mine)), "inSync": file is not None and {k: file.get(k, {}) for k in USER_KEYS} == mine})


async def sync_users_file(request):
    """Home Assistant folder -> add-on ("load", default) or add-on -> folder ("save")."""
    if not await can_edit(request):
        return forbidden()
    try:
        body = await request.json() if request.can_read_body else {}
    except ValueError:
        body = {}
    direction = body.get("direction", "load") if isinstance(body, dict) else "load"
    cur = validate_settings(read_settings(request))
    if direction == "save":
        if not write_users_file(request, cur):
            return web.json_response({"error": "config folder is not writable"}, status=500)
        return web.json_response(cur, headers={"ETag": settings_rev(request)})
    file = read_users_file(request)
    if file is None:
        return web.json_response({"error": f"{USERS_FILE} not found in the add-on config folder"}, status=404)
    backup_settings(request)
    clean = validate_settings({**cur, **file})
    write_json_atomic(settings_path(request), clean)
    backup_settings(request)
    return web.json_response(clean, headers={"ETag": settings_rev(request)})


async def get_settings(request):
    s = validate_settings(read_settings(request))
    if not s["langChosen"]:
        s["language"] = "auto"                         # nobody picked a language: follow the browser (also for settings stored before "auto" was the default)
    return web.json_response(s, headers={"ETag": settings_rev(request)})


async def put_settings(request):
    if not await can_edit(request):
        return forbidden()
    have = request.headers.get("If-Match")
    if have and have != settings_rev(request):
        return web.json_response({"error": "settings were changed elsewhere, reload the page"}, status=409)
    try:
        data = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    if not isinstance(data, dict):
        return web.json_response({"error": "object expected"}, status=400)
    clean = validate_settings(data)
    clean["langChosen"] = bool(data.get("langChosen")) or "language" in data and data["language"] != "auto" or bool(read_settings(request).get("langChosen"))
    if not clean["langChosen"]:
        clean["language"] = "auto"
    backup_settings(request)                       # the previous state stays recoverable
    write_json_atomic(settings_path(request), clean)
    backup_settings(request)
    write_users_file(request, clean)                # users and tablets also live in a file of the add-on config folder
    return web.json_response(clean, headers={"ETag": settings_rev(request)})


# ---------- custom GLB models ----------
MODEL_NAME = re.compile(r"^[a-z0-9][a-z0-9_-]{0,47}$")


def models_dir(request) -> Path:
    return data_dir(request) / "models"


LIBRARY_DIR = Path(__file__).parent / "library"      # models shipped with the add-on (CC0, see CREDITS.md), read-only


def find_model(request, name: str):
    """The user's own upload wins over a shipped model of the same name."""
    if not MODEL_NAME.match(name):
        return None
    for d in (models_dir(request), LIBRARY_DIR):
        p = d / f"{name}.glb"
        if p.is_file():
            return p
    return None


async def list_models(request):
    d = models_dir(request)
    items = []
    if d.exists():
        for p in sorted(d.glob("*.glb")):
            items.append({"name": p.stem, "size": p.stat().st_size, "url": f"api/models/{p.stem}"})
    own = {i["name"] for i in items}
    if LIBRARY_DIR.is_dir():
        for p in sorted(LIBRARY_DIR.glob("*.glb")):
            if p.stem not in own:
                items.append({"name": p.stem, "size": p.stat().st_size, "url": f"api/models/{p.stem}", "builtin": True})
    return web.json_response(items)


async def upload_model(request):
    if not await can_edit(request):
        return forbidden()
    reader = await request.multipart()
    field = await reader.next()
    if field is None or field.name != "file":
        return web.json_response({"error": "file field missing"}, status=400)
    filename = unquote(field.filename or "model.glb")
    if not filename.lower().endswith(".glb"):
        return web.json_response({"error": "only .glb files are supported"}, status=400)
    data = bytearray()
    while True:
        chunk = await field.read_chunk(64 * 1024)
        if not chunk:
            break
        data.extend(chunk)
        if len(data) > MAX_MODEL_BYTES:
            return web.json_response({"error": "file too large (max 20 MB)"}, status=413)
    if bytes(data[:4]) != b"glTF":
        return web.json_response({"error": "not a valid GLB file"}, status=400)
    stem = re.sub(r"[^a-z0-9_-]+", "-", Path(filename).stem.lower()).strip("-")[:40] or "model"
    d = models_dir(request)
    d.mkdir(parents=True, exist_ok=True)
    name, n = stem, 2
    while (d / f"{name}.glb").exists():
        name, n = f"{stem}-{n}", n + 1
    (d / f"{name}.glb").write_bytes(bytes(data))
    return web.json_response({"name": name, "size": len(data), "url": f"api/models/{name}"}, status=201)


async def get_model(request):
    p = find_model(request, request.match_info["name"])
    if p is None:
        raise web.HTTPNotFound()
    return web.FileResponse(p, headers={"Content-Type": "model/gltf-binary", "Cache-Control": "max-age=3600"})


async def delete_model(request):
    if not await can_edit(request):
        return forbidden()
    name = request.match_info["name"]
    p = models_dir(request) / f"{name}.glb"
    if not MODEL_NAME.match(name) or not p.is_file():
        raise web.HTTPNotFound()
    p.unlink()
    return web.json_response({"ok": True})


# ---------- background images (floor plan templates for tracing) ----------
BG_NAME = re.compile(r"^[a-f0-9]{12}\.(png|jpg|webp)$")
BG_TYPES = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}


def bg_dir(request) -> Path:
    return data_dir(request) / "backgrounds"


def sniff_image(data: bytes):
    """Return 'png' | 'jpg' | 'webp' from the magic bytes, else None (SVG etc. are refused on purpose)."""
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:3] == b"\xff\xd8\xff":
        return "jpg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


async def upload_background(request):
    if not await can_edit(request):
        return forbidden()
    reader = await request.multipart()
    field = await reader.next()
    if field is None or field.name != "file":
        return web.json_response({"error": "file field missing"}, status=400)
    data = bytearray()
    while True:
        chunk = await field.read_chunk(64 * 1024)
        if not chunk:
            break
        data.extend(chunk)
        if len(data) > MAX_BG_BYTES:
            return web.json_response({"error": "file too large (max 8 MB)"}, status=413)
    ext = sniff_image(bytes(data))
    if not ext:
        return web.json_response({"error": "only PNG, JPG or WebP images are supported"}, status=400)
    d = bg_dir(request)
    d.mkdir(parents=True, exist_ok=True)
    name = f"{secrets.token_hex(6)}.{ext}"
    (d / name).write_bytes(bytes(data))
    return web.json_response({"name": name, "size": len(data), "url": f"api/backgrounds/{name}"}, status=201)


async def get_background(request):
    name = request.match_info["name"]
    p = bg_dir(request) / name
    if not BG_NAME.match(name) or not p.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(p, headers={"Content-Type": BG_TYPES[name.rsplit(".", 1)[1]], "Cache-Control": "max-age=3600",
                                        "X-Content-Type-Options": "nosniff"})


async def delete_background(request):
    if not await can_edit(request):
        return forbidden()
    name = request.match_info["name"]
    p = bg_dir(request) / name
    if not BG_NAME.match(name) or not p.is_file():
        raise web.HTTPNotFound()
    p.unlink()
    return web.json_response({"ok": True})


# ---------- Home Assistant ----------
def _pct(v, scale):
    return round(v * 100 / scale) if isinstance(v, (int, float)) else None


def _effects(attrs):
    """Effect / scene names of a light (Nanoleaf, WLED, Hue ...), capped."""
    lst = attrs.get("effect_list")
    return [str(x)[:64] for x in lst[:60]] if isinstance(lst, list) else None


def _members(st):
    """Entities a scene sets (its `entity_id` attribute), so the UI can offer the scenes a light belongs to."""
    if not st["entity_id"].startswith("scene."):
        return None
    ids = st.get("attributes", {}).get("entity_id")
    return [str(x) for x in ids[:200]] if isinstance(ids, list) else None


async def get_entities(request):
    """Slim list of all entities (id, name, domain, state)."""
    if not SUPERVISOR_TOKEN:
        return web.json_response([])
    async with aiohttp.ClientSession() as s:
        async with s.get(f"{HA_API}/states", headers=ha_headers()) as r:
            if r.status != 200:
                return web.json_response({"error": f"HA answered {r.status}"}, status=502)
            states = await r.json()
    return web.json_response([slim_state(st) for st in states])


def _climate(st, a):
    """What the heating panel needs of a thermostat: what it is doing now, the target temperature and what it may be set to."""
    if st["entity_id"].startswith("water_heater."):           # a heat pump's hot water (the page 🌡 Klima, #483): only its target
        return {"tt": a.get("temperature"), "tmin": a.get("min_temp"), "tmax": a.get("max_temp")}
    if not st["entity_id"].startswith("climate."):
        return {}
    modes = a.get("hvac_modes")
    return {
        "hvac": a.get("hvac_action"),                         # heating | cooling | idle | off ...
        "tt": a.get("temperature"),                           # target temperature
        "tmin": a.get("min_temp"), "tmax": a.get("max_temp"), "tstep": a.get("target_temp_step"),
        "modes": [m for m in modes if isinstance(m, str)][:12] if isinstance(modes, list) else None,
    }


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else None


def _sky(st, a):
    """What the sky needs (#418, #419): of sun.sun its elevation and the next sunrise / sunset, of a weather entity temperature and wind."""
    eid = st["entity_id"]
    if eid == "sun.sun":
        return {"sun": {"elev": _num(a.get("elevation")), "rising": a.get("rising") if isinstance(a.get("rising"), bool) else None,
                        "rise": a.get("next_rising") if isinstance(a.get("next_rising"), str) else None,
                        "set": a.get("next_setting") if isinstance(a.get("next_setting"), str) else None}}
    if eid.startswith("weather."):
        def unit(k):
            return a.get(k)[:12] if isinstance(a.get(k), str) else None
        return {"wx": {"t": _num(a.get("temperature")), "tu": unit("temperature_unit"), "w": _num(a.get("wind_speed")), "wu": unit("wind_speed_unit")}}
    return {}


def slim_state(st):
    """The few fields of a Home Assistant state the floor plan uses (same shape for /api/entities and the live channel)."""
    a = st.get("attributes") or {}
    return {
        "entity_id": st["entity_id"],
        "name": a.get("friendly_name", st["entity_id"]),
        "domain": st["entity_id"].split(".")[0],
        "state": st["state"],
        "unit": a.get("unit_of_measurement"),
        "brightness": _pct(a.get("brightness"), 255),
        "position": a.get("current_position"),
        "rgb": a.get("rgb_color"),
        "dc": a.get("device_class"),
        "ct": a.get("current_temperature"),
        "bat": a.get("battery_level") if isinstance(a.get("battery_level"), (int, float)) and not isinstance(a.get("battery_level"), bool) else None,   # a vacuum ... reports its battery itself (#376)
        **_climate(st, a),
        "ch": a.get("current_humidity"),
        "app": a.get("app_name") if st["entity_id"].startswith("media_player.") else None,
        "fx": _effects(a),
        "fxc": a.get("effect"),
        "members": _members(st),
        "ctl": controls.extras(st),                          # what the live card needs to control it (#406): volume, fan speed, presets ...
        **_sky(st, a),                                       # sun.sun and weather.* for the sky (#418, #419)
        "since": st.get("last_changed") if st["state"] in ("unavailable", "unknown") else None,   # for the offline list
        "lc": _epoch(st.get("last_changed")),                # when the state last changed, in seconds: "seit wann" of a button (#495)
    }


def _epoch(v):
    """an ISO time of Home Assistant -> whole seconds since 1970, None when it is none"""
    try:
        return int(datetime.datetime.fromisoformat(v.replace("Z", "+00:00")).timestamp()) if isinstance(v, str) else None
    except ValueError:
        return None


class LiveHub:
    """One websocket to Home Assistant for every open view: each state change is pushed to all browsers the moment it
    happens, instead of every browser asking for all states every few seconds. Runs only while a browser is connected;
    when Home Assistant cannot be reached the browsers are told so and fall back to polling."""

    BATCH = 0.05                          # a scene switches many lights at once: they go out as one message
    GRACE = 60                            # keep Home Assistant's websocket a minute after the last view closed (page reloads)
    SEND_TIMEOUT = 5                      # a browser that takes longer to take a message is stuck (tablet asleep, network gone)
    BACKLOG = 20                          # messages waiting for one browser before it counts as stuck

    def __init__(self):
        self.clients: dict = {}           # browser websocket -> (its queue, the task that sends it)
        self.ok = False
        self.task = None
        self.flush_task = None
        self.pending: dict = {}
        self.empty_since = 0.0

    async def add(self, ws):
        q = asyncio.Queue(self.BACKLOG)
        q.put_nowait({"type": "upstream", "ok": self.ok})
        self.clients[ws] = (q, asyncio.create_task(self.send_loop(ws, q)))
        if SUPERVISOR_TOKEN and (self.task is None or self.task.done()):
            self.task = asyncio.create_task(self.run())

    def remove(self, ws):
        entry = self.clients.pop(ws, None)
        if entry and entry[1] is not asyncio.current_task():
            entry[1].cancel()
        if not self.clients:
            self.empty_since = time.monotonic()

    def idle(self):
        return not self.clients and time.monotonic() - self.empty_since > self.GRACE

    async def send_loop(self, ws, q):
        """Every browser gets its messages from its own task: one that does not take them (a tablet asleep, a phone that lost the network)
        used to hold up all the others until the heartbeat noticed it, up to half a minute (#323). A stuck one is dropped; it reconnects
        and fetches the full list again."""
        try:
            while True:
                msg = await q.get()
                await asyncio.wait_for(ws.send_json(msg), self.SEND_TIMEOUT)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001 - a browser that went away or got stuck
            self.drop(ws)

    def drop(self, ws):
        self.remove(ws)
        asyncio.create_task(self.close_quietly(ws))

    @staticmethod
    async def close_quietly(ws):
        try:
            await asyncio.wait_for(ws.close(), 2)
        except Exception:  # noqa: BLE001 - it is gone anyway
            pass

    async def broadcast(self, msg):
        for ws, (q, _) in list(self.clients.items()):
            try:
                q.put_nowait(msg)
            except asyncio.QueueFull:
                self.drop(ws)

    def queue(self, entity_id, st):
        self.pending[entity_id] = st
        if self.flush_task is None or self.flush_task.done():
            self.flush_task = asyncio.create_task(self.flush())

    async def flush(self):
        await asyncio.sleep(self.BATCH)
        batch, self.pending = self.pending, {}
        await self.broadcast({"type": "states", "list": [v for v in batch.values() if v],
                              "removed": [k for k, v in batch.items() if v is None]})

    async def set_ok(self, ok):
        if ok != self.ok:
            self.ok = ok
            await self.broadcast({"type": "upstream", "ok": ok})

    async def run(self):
        delay = 1
        while not self.idle():
            try:
                async with aiohttp.ClientSession() as sess:
                    async with sess.ws_connect(ha_ws_url(), heartbeat=30) as ws:
                        await asyncio.wait_for(ws.receive_json(), 10)                       # auth_required
                        await ws.send_json({"type": "auth", "access_token": SUPERVISOR_TOKEN})
                        if (await asyncio.wait_for(ws.receive_json(), 10)).get("type") != "auth_ok":
                            raise RuntimeError("authentication failed")
                        await ws.send_json({"id": 1, "type": "subscribe_events", "event_type": "state_changed"})
                        if not (await asyncio.wait_for(ws.receive_json(), 10)).get("success"):
                            raise RuntimeError("subscription refused")
                        await self.set_ok(True)
                        delay = 1
                        async for msg in ws:
                            if self.idle():
                                break
                            if msg.type != aiohttp.WSMsgType.TEXT:
                                continue
                            data = json.loads(msg.data)
                            ev = data.get("event") if data.get("type") == "event" else None
                            d = (ev or {}).get("data") or {}
                            if d.get("entity_id"):
                                self.queue(d["entity_id"], slim_state(d["new_state"]) if d.get("new_state") else None)
            except asyncio.CancelledError:
                raise
            except Exception as err:  # noqa: BLE001 - try again later, the browsers poll meanwhile
                log.info("Live updates from Home Assistant interrupted (%s), retrying in %ss", err, delay)
            await self.set_ok(False)
            if self.idle():
                break
            await asyncio.sleep(delay)
            delay = min(30, delay * 2)


KEY_LIVE = web.AppKey("live", LiveHub)


async def live_ws(request):
    """Websocket for the browser: pushes {type: states, list, removed} and {type: upstream, ok}. It only listens."""
    ws = web.WebSocketResponse(heartbeat=30)
    await ws.prepare(request)
    hub = request.app[KEY_LIVE]
    await hub.add(ws)
    try:
        async for _ in ws:
            pass
    finally:
        hub.remove(ws)
    return ws


async def stop_live(app):
    hub = app[KEY_LIVE]
    for t in (hub.task, hub.flush_task, *(task for _, task in hub.clients.values())):
        if t and not t.done():
            t.cancel()


AREA_TEMPLATE = (
    "{% set ns = namespace(o=[]) %}"
    "{% for a in areas() %}"
    "{% set ns.o = ns.o + [{'id': a, 'name': area_name(a), 'entities': area_entities(a)}] %}"
    "{% endfor %}{{ ns.o | tojson }}"
)


def area_list(data, side=(), parts=None) -> list:
    """The areas as the template gives them, cleaned and sorted by name. The entities Home Assistant keeps off its dashboards (side:
    diagnostic, config and hidden ones, from the registry, #368) are not among an area's "entities" (the room panel, the room's entity
    list and placing a whole area use those, so a relay's signal or IP is not listed in its room) but under "side" (the entity picker
    still sorts them into their area). "parts": {entity: its thermostat} for the entities of a thermostat's device (parts: from the
    registry, #370): the room panel shows them with the heating."""
    side, parts = set(side), parts or {}

    def one(a):
        ids = [e for e in a.get("entities", []) if isinstance(e, str)]
        return {"id": str(a["id"]), "name": str(a.get("name") or a["id"]),
                "entities": [e for e in ids if e not in side], "side": [e for e in ids if e in side],
                "parts": {e: parts[e] for e in ids if e in parts}}
    out = [one(a) for a in data if isinstance(a, dict) and "id" in a] if isinstance(data, list) else []
    return sorted(out, key=lambda a: a["name"].lower())


async def get_areas(request):
    """Home Assistant areas with their entity ids (via the template API), without the side entities; empty list if unavailable."""
    if not SUPERVISOR_TOKEN:
        return web.json_response([])
    try:
        async with aiohttp.ClientSession() as s:
            async with s.post(f"{HA_API}/template", headers=ha_headers(), json={"template": AREA_TEMPLATE}) as r:
                if r.status != 200:
                    return web.json_response([])
                data = json.loads(await r.text())
    except (aiohttp.ClientError, ValueError):
        return web.json_response([])
    watch = request.app[KEY_RENAMES]
    return web.json_response(area_list(data, watch.get("side") or (), watch.get("parts") or {}))


async def get_batteries(request):
    """{entity id: the battery entity of its device} from Home Assistant's registries (#376): the device overview shows the battery level
    next to each device. Empty without Home Assistant or before the registry was read."""
    return web.json_response(request.app[KEY_RENAMES].get("battery") or {})


async def call_service(request):
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no supervisor token"}, status=503)
    if "control" in user_locks(request):
        return web.json_response({"error": "switching is locked for this user"}, status=403)
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    domain, service, payload, err = controls.check(body)          # the domain, its service and every value it carries (#406)
    if err:
        return web.json_response({"error": err}, status=400)
    if domain == "alarm_control_panel" and "alarm" in user_locks(request):
        return web.json_response({"error": "the alarm panel is locked for this user"}, status=403)
    if domain == "automation" and not await can_edit(request):      # an automation on / off (▶ Abläufe, #483): only who may edit
        return forbidden()
    async with aiohttp.ClientSession() as s:
        async with s.post(f"{HA_API}/services/{domain}/{service}", headers=ha_headers(),
                          json=payload) as r:
            ok = r.status == 200
    if ok and domain == "calendar":                                 # a new event (#495): the calendar pages ask Home Assistant again
        cache = request.app[KEY_PAGES]
        for k in [k for k in cache if isinstance(k, tuple) and k and k[0] in ("calendar", "agenda")]:
            cache.pop(k, None)
    return web.json_response({"ok": ok}, status=200 if ok else 502)


CAMERA_ID = re.compile(r"^camera\.[a-z0-9_]{1,64}$")
CAMERA_TYPES = ("image/jpeg", "image/png", "image/gif", "image/webp")
MAX_CAMERA_BYTES = 8 * 1024 * 1024


async def read_all(resp, limit: int):
    """The whole body of an answer from Home Assistant, or None when it is bigger than limit. (content.read(n) is not that: it gives
    what has arrived so far, and through the Supervisor a picture or a video piece arrives in several pieces, #385.)"""
    body = bytearray()
    async for piece in resp.content.iter_chunked(64 * 1024):
        body += piece
        if len(body) > limit:
            return None
    return bytes(body)


def camera_refused(request, entity: str):
    """why a camera picture may not be fetched (the answer to send), None when it may"""
    if not CAMERA_ID.match(entity):
        return web.json_response({"error": "not a camera"}, status=400)
    if not validate_settings(read_settings(request))["cameraImages"]:
        return web.json_response({"error": "camera images are switched off"}, status=403)
    if "cameras" in user_locks(request):
        return web.json_response({"error": "cameras are locked for this user"}, status=403)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no supervisor token"}, status=503)
    return None


async def get_camera(request):
    """Still image of one camera (Home Assistant's camera proxy). Only jpeg / png / gif / webp, never cached."""
    entity = request.match_info["entity"]
    if (refused := camera_refused(request, entity)) is not None:
        return refused
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
            async with s.get(f"{HA_API}/camera_proxy/{entity}", headers=ha_headers()) as r:
                if r.status != 200:
                    return web.json_response({"error": f"HA answered {r.status}"}, status=502)
                ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
                body = await read_all(r, MAX_CAMERA_BYTES)
    except (aiohttp.ClientError, asyncio.TimeoutError):
        return web.json_response({"error": "camera not reachable"}, status=502)
    if ctype not in CAMERA_TYPES or body is None:
        return web.json_response({"error": "unexpected answer from the camera"}, status=502)
    return web.Response(body=body, content_type=ctype, headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


HLS_TOKEN = re.compile(r"^[a-f0-9]{16,128}$")
HLS_FILE = re.compile(r"^(?:master_playlist\.m3u8|playlist\.m3u8|init\.mp4|segment/\d{1,12}(?:\.\d{1,6})?\.m4s)$")
HLS_QUERY = ("_HLS_msn", "_HLS_part")              # the blocking playlist reload of low latency HLS
HLS_TYPES = ("application/vnd.apple.mpegurl", "video/mp4", "video/iso.segment")
MAX_HLS_BYTES = 32 * 1024 * 1024


async def get_camera_hls(request):
    """Live picture of one camera (#381, #383): asks Home Assistant for its own HLS stream of the camera (websocket camera/stream, the
    stream its live view plays) and answers the address of the playlist under this add-on (api/hls/...). Home Assistant runs one such
    stream per camera for every viewer. An MJPEG stream (camera_proxy_stream) cannot be used: the Supervisor passes an answer from
    Home Assistant on only when it is complete, and that stream never ends. 404: the camera has no stream (the page shows still images)."""
    entity = request.match_info["entity"]
    if (refused := camera_refused(request, entity)) is not None:
        return refused
    try:
        async with _HaSocket() as ws:
            await ws.send_json({"id": 1, "type": "camera/stream", "entity_id": entity, "format": "hls"})
            while True:
                res = await asyncio.wait_for(ws.receive_json(), 30)       # Home Assistant may need a while to open the camera's stream
                if res.get("id") == 1:
                    break
    except Exception as err:  # noqa: BLE001 - no websocket, no answer: no live picture
        log.warning("Camera %s: no HLS stream from Home Assistant (%s)", entity, err)
        return web.json_response({"error": "Home Assistant not reachable"}, status=502)
    m = re.match(r"^/api/hls/([a-f0-9]+)/master_playlist\.m3u8$", str((res.get("result") or {}).get("url") or "")) if res.get("success") else None
    if not m or not HLS_TOKEN.match(m.group(1)):
        log.info("Camera %s has no HLS stream: %s", entity, (res.get("error") or {}).get("message") or res.get("result"))
        return web.json_response({"error": "the camera has no stream"}, status=404)
    return web.json_response({"url": f"api/hls/{m.group(1)}/master_playlist.m3u8"}, headers={"Cache-Control": "no-store"})


async def get_hls(request):
    """One file of a camera's HLS stream (playlist, init, segment), passed through from Home Assistant. Each one is a complete answer,
    so it also comes through the Supervisor. Only Home Assistant's own HLS file names; the token comes from get_camera_hls."""
    token, name = request.match_info["token"], request.match_info["name"]
    if not HLS_TOKEN.match(token) or not HLS_FILE.match(name):
        return web.json_response({"error": "not an HLS file"}, status=400)
    if not validate_settings(read_settings(request))["cameraImages"] or "cameras" in user_locks(request):
        return web.json_response({"error": "camera images are switched off or locked"}, status=403)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no supervisor token"}, status=503)
    query = {k: v for k, v in request.query.items() if k in HLS_QUERY and v.isdigit()}
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as s:
            async with s.get(f"{HA_API}/hls/{token}/{name}", headers=ha_headers(), params=query) as r:
                ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
                body = await read_all(r, MAX_HLS_BYTES)
                status = r.status
    except (aiohttp.ClientError, asyncio.TimeoutError):
        return web.json_response({"error": "camera not reachable"}, status=502)
    if status != 200:
        return web.Response(status=status if status in (404, 416) else 502)       # 404 / 416: a part that is not there yet
    if ctype not in HLS_TYPES or body is None:
        return web.json_response({"error": "unexpected answer"}, status=502)
    return web.Response(body=body, content_type=ctype, headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


async def index(request):
    return web.FileResponse(STATIC_DIR / "index.html")


async def no_stale_files(request, response):
    """The interface files (index.html, *.js, style.css) are always checked with the server before use (a cheap 304 when nothing
    changed). Without this header the browser may keep some old files after an update and load them together with new ones: app.js
    then fails as a whole and the page stays empty (#328)."""
    if not request.path.startswith("/api/") and "Cache-Control" not in response.headers:
        response.headers["Cache-Control"] = "no-cache"


# ---------- backup: export / import everything (houses, settings, models, pictures) ----------
BACKUP_FORMAT = "floorplan3d-backup"
MAX_BACKUP_BYTES = 200 * 1024 * 1024
MAX_HOUSES = 20


def build_backup(request, with_files: bool = True) -> dict:
    houses = []
    for h in houses_index(request):
        houses.append({"id": h["id"], "name": h["name"], "layout": read_json(house_file(request, h["id"]), EMPTY_LAYOUT)})
    out = {"format": BACKUP_FORMAT, "version": 1, "exported": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
           "houses": houses, "settings": read_settings(request), "backgrounds": {}, "models": {}, "extras": backup_extras(request)}
    if with_files:
        for d, key, pat in ((bg_dir(request), "backgrounds", "*.*"), (models_dir(request), "models", "*.glb")):
            if d.is_dir():
                for f in sorted(d.glob(pat)):
                    if f.is_file() and (BG_NAME.match(f.name) if key == "backgrounds" else MODEL_NAME.match(f.stem)):
                        out[key][f.name] = base64.b64encode(f.read_bytes()).decode("ascii")
    return out


def backup_extras(request) -> dict:
    """What else the add-on keeps (#500): the notes of the pinboard, the settings of the holiday alarm and of the alarm messages, read from
    their files (the automatic backup runs in a thread). The alarm's code and the CallMeBot keys stay out: a backup put back keeps them."""
    g = read_json(guard_path(request), {})
    g = g if isinstance(g, dict) else {}
    n = read_json(notify_path(request), {})
    return {"pinboard": read_notes(request),
            "guard": {k: v for k, v in gd.clean_cfg(g.get("cfg"), g.get("cfg")).items() if k != "code"},
            "notify": {k: v for k, v in an.clean(n, n).items() if k not in an.SECRETS}}


def apply_extras(request, extras) -> list:
    """Put the extras of a backup back (#500); the alarm's code and the CallMeBot keys stay as they are now. -> the parts put back"""
    done = []
    if not isinstance(extras, dict):
        return done
    if isinstance(extras.get("pinboard"), list):
        write_json_atomic(pinboard_path(request), {"notes": pages.clean_notes(extras["pinboard"])})
        done.append("pinboard")
    if isinstance(extras.get("guard"), dict):
        store = guard_store(request)
        store["cfg"] = gd.clean_cfg({k: v for k, v in extras["guard"].items() if k not in ("code", "removeCode")}, store["cfg"])
        guard_save(request)
        done.append("guard")
    if isinstance(extras.get("notify"), dict):
        cfg = an.clean({k: v for k, v in extras["notify"].items() if k not in an.SECRETS}, notify_cfg(request))
        write_json_atomic(notify_path(request), cfg)
        app_state(request)[KEY_NOTIFY]["cfg"] = cfg
        done.append("notify")
    return done


async def get_backup(request):
    if not await can_edit(request):
        return forbidden()
    data = build_backup(request, request.query.get("files", "1") != "0")
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M")
    return web.Response(text=json.dumps(data), content_type="application/json",
                        headers={"Content-Disposition": f'attachment; filename="floorplan3d-backup-{stamp}.json"'})


def validate_backup(data):
    """Return (houses, settings, backgrounds, models) as clean python values, or raise ValueError."""
    if not isinstance(data, dict) or data.get("format") != BACKUP_FORMAT:
        raise ValueError("not a 3D Floorplan backup file")
    raw = data.get("houses")
    if not isinstance(raw, list) or not 1 <= len(raw) <= MAX_HOUSES:
        raise ValueError("no houses in backup")
    houses, seen = [], set()
    for h in raw:
        if not isinstance(h, dict) or not HOUSE_ID.match(str(h.get("id", ""))) or h["id"] in seen:
            raise ValueError("invalid house id")
        lay = h.get("layout")
        if not isinstance(lay, dict) or not isinstance(lay.get("floors"), list):
            raise ValueError("invalid layout")
        name = str(h.get("name", "")).strip()[:60] or "Haus"
        seen.add(h["id"])
        houses.append({"id": h["id"], "name": name, "layout": lay})
    settings = data.get("settings")
    settings = validate_settings(settings) if isinstance(settings, dict) and settings else {}
    files = {}
    for key, kind in (("backgrounds", "bg"), ("models", "model")):
        items = {}
        src = data.get(key) or {}
        if not isinstance(src, dict):
            raise ValueError(f"invalid {key}")
        for name, b64 in src.items():
            try:
                raw_bytes = base64.b64decode(b64, validate=True)
            except (ValueError, TypeError):
                raise ValueError(f"invalid file {name}")
            if kind == "bg":
                ext = sniff_image(raw_bytes)
                if not BG_NAME.match(name) or ext is None or not name.endswith("." + ext) or len(raw_bytes) > MAX_BG_BYTES:
                    raise ValueError(f"invalid picture {name}")
            else:
                if not name.endswith(".glb") or not MODEL_NAME.match(name[:-4]) or raw_bytes[:4] != b"glTF" or len(raw_bytes) > MAX_MODEL_BYTES:
                    raise ValueError(f"invalid model {name}")
            items[name] = raw_bytes
        files[key] = items
    return houses, settings, files["backgrounds"], files["models"]


async def post_backup(request):
    if not await can_edit(request):
        return forbidden()
    try:
        data = await request.json()
        result = apply_backup(request, data)
    except ValueError as err:
        return web.json_response({"error": str(err)}, status=400)
    return web.json_response(result)


def apply_backup(request, data) -> dict:
    """Replace the current data with a backup (after a safety copy). Raises ValueError for an invalid backup."""
    houses, settings, bgs, models = validate_backup(data)
    root = data_dir(request)
    # safety copy of the current state (layouts and settings only), the last 5 are kept
    bdir = root / "backups"
    bdir.mkdir(parents=True, exist_ok=True)
    write_json_atomic(bdir / f"before-restore-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}.json", build_backup(request, False))
    for old in sorted(bdir.glob("before-restore-*.json"))[:-5]:
        old.unlink()
    old_ids = {h["id"] for h in houses_index(request)}
    for h in houses:
        write_json_atomic(house_file(request, h["id"]), h["layout"])
    for gone in old_ids - {h["id"] for h in houses}:
        house_file(request, gone).unlink(missing_ok=True)
    save_houses(request, [{"id": h["id"], "name": h["name"]} for h in houses])
    if settings:
        write_json_atomic(root / "settings.json", settings)
    for d, items in ((bg_dir(request), bgs), (models_dir(request), models)):
        if items:
            d.mkdir(parents=True, exist_ok=True)
            for name, b in items.items():
                (d / name).write_bytes(b)
    extras = apply_extras(request, data.get("extras"))         # pinboard, holiday alarm, alarm messages (#500); an older backup has none
    return {"ok": True, "houses": len(houses), "pictures": len(bgs), "models": len(models), "extras": extras}


# ---------- automatic backups: a folder in the add-on configuration, daily (or every n hours), cleaned up by age and number ----------
BACKUP_NAME = re.compile(r"^floorplan3d-backup-\d{8}-\d{6}(-auto|-manual)?\.json$")
BACKUP_CHECK_SECONDS = float(os.environ.get("BACKUP_CHECK_SECONDS", "300"))


class _AppCtx:
    """The backup helpers take a request; the background task has none, only the app."""
    def __init__(self, app):
        self.app = app


def backups_dir(request) -> Path:
    return request.app[KEY_CONFIG] / "backups"


def backup_items(request) -> list:
    """The backup files of the backups folder, newest first."""
    d = backups_dir(request)
    items = []
    if d.is_dir():
        for f in d.iterdir():
            if f.is_file() and BACKUP_NAME.match(f.name):
                st = f.stat()
                kind = "auto" if f.name.endswith("-auto.json") else "manual" if f.name.endswith("-manual.json") else "other"
                items.append({"name": f.name, "size": st.st_size, "mtime": st.st_mtime, "kind": kind,
                              "created": datetime.datetime.fromtimestamp(st.st_mtime).isoformat(timespec="seconds")})
    return sorted(items, key=lambda i: (i["mtime"], i["name"]), reverse=True)


def create_backup(request, kind: str = "manual") -> str:
    """Write a full backup (houses, settings, pictures, 3D models, pinboard and alarm settings) into the backups folder and return its
    file name."""
    d = backups_dir(request)
    d.mkdir(parents=True, exist_ok=True)
    name = f"floorplan3d-backup-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}-{'auto' if kind == 'auto' else 'manual'}.json"
    tmp = d / (name + ".tmp")
    tmp.write_text(json.dumps(build_backup(request, True)), "utf-8")
    tmp.replace(d / name)
    return name


def prune_backups(request, keep_days: float, keep_count: float) -> list:
    """Delete automatic backups older than keep_days and beyond the newest keep_count. The newest one always stays; manual ones are never touched."""
    autos = [i for i in backup_items(request) if i["kind"] == "auto"]
    cutoff = time.time() - keep_days * 86400
    removed = []
    for n, item in enumerate(autos):
        if n == 0:
            continue
        if n >= int(keep_count) or item["mtime"] < cutoff:
            (backups_dir(request) / item["name"]).unlink(missing_ok=True)
            removed.append(item["name"])
    return removed


def backup_due(request, settings: dict, now: float | None = None) -> bool:
    """An automatic backup is due when switched on and the newest backup (of any kind) is older than the interval."""
    if not settings.get("autoBackup"):
        return False
    items = backup_items(request)
    if not items:
        return True
    return (now or time.time()) - items[0]["mtime"] >= settings["backupEveryHours"] * 3600


def run_backup_cycle(request, now: float | None = None):
    """One look of the scheduler: back up when due, then clean up. Returns the new file name or None."""
    settings = validate_settings(read_settings(request))
    name = None
    if backup_due(request, settings, now):
        name = create_backup(request, "auto")
        log.info("automatic backup written: %s", name)
    if settings["autoBackup"]:
        for gone in prune_backups(request, settings["backupKeepDays"], settings["backupKeepCount"]):
            log.info("old backup deleted: %s", gone)
    return name


async def backup_scheduler(app):
    ctx = _AppCtx(app)

    async def loop():
        await asyncio.sleep(min(60.0, BACKUP_CHECK_SECONDS))
        while True:
            try:
                await asyncio.to_thread(run_backup_cycle, ctx)
            except Exception:                      # a failing backup must never stop the add-on
                log.exception("automatic backup failed")
            await asyncio.sleep(BACKUP_CHECK_SECONDS)

    task = asyncio.create_task(loop())
    yield
    task.cancel()


def check_backup_file(request, name: str | None = None) -> dict:
    """Check a backup like a restore would, without changing anything: readable, valid, what it contains."""
    items = backup_items(request)
    if name is None:
        if not items:
            raise ValueError("no backup yet")
        name = items[0]["name"]
    if not BACKUP_NAME.match(name):
        raise ValueError("invalid backup name")
    f = backups_dir(request) / name
    if not f.is_file():
        raise ValueError("backup not found")
    try:
        data = json.loads(f.read_text("utf-8"))
    except (ValueError, OSError):
        raise ValueError("the file is not readable or not valid JSON")
    houses, settings, bgs, models = validate_backup(data)
    return {"ok": True, "name": name, "size": f.stat().st_size, "exported": data.get("exported", ""),
            "houses": [h["name"] for h in houses], "pictures": len(bgs), "models": len(models), "hasSettings": bool(settings)}


async def get_backups(request):
    if not await can_edit(request):
        return forbidden()
    s = validate_settings(read_settings(request))
    return web.json_response({"items": backup_items(request), "folder": "addon_configs/…_floorplan3d/backups",
                              "autoBackup": s["autoBackup"], "everyHours": s["backupEveryHours"]})


async def post_backups(request):
    if not await can_edit(request):
        return forbidden()
    try:
        name = await asyncio.to_thread(create_backup, request, "manual")
    except OSError as err:
        return web.json_response({"error": f"could not write the backup: {err}"}, status=500)
    return web.json_response({"ok": True, "name": name})


async def post_backups_test(request):
    if not await can_edit(request):
        return forbidden()
    try:
        body = await request.json() if request.can_read_body else {}
        result = await asyncio.to_thread(check_backup_file, request, (body or {}).get("name"))
    except ValueError as err:
        return web.json_response({"ok": False, "error": str(err)}, status=400)
    return web.json_response(result)


async def post_backups_restore(request):
    if not await can_edit(request):
        return forbidden()
    try:
        body = await request.json()
        name = str((body or {}).get("name", ""))
        check_backup_file(request, name)                      # only restore what passes the check
        data = json.loads((backups_dir(request) / name).read_text("utf-8"))
        result = apply_backup(request, data)
    except ValueError as err:
        return web.json_response({"ok": False, "error": str(err)}, status=400)
    return web.json_response(result)


async def get_backup_file(request):
    if not await can_edit(request):
        return forbidden()
    name = request.match_info["name"]
    f = backups_dir(request) / name
    if not BACKUP_NAME.match(name) or not f.is_file():
        return web.json_response({"error": "not found"}, status=404)
    return web.FileResponse(f, headers={"Content-Disposition": f'attachment; filename="{name}"'})


async def delete_backup_file(request):
    if not await can_edit(request):
        return forbidden()
    name = request.match_info["name"]
    f = backups_dir(request) / name
    if not BACKUP_NAME.match(name) or not f.is_file():
        return web.json_response({"error": "not found"}, status=404)
    f.unlink()
    return web.json_response({"ok": True})


# ---------- security view (timeline.py): a recorder of every switch, one file per day ----------
def timeline_dir(request) -> Path:
    return request.app[KEY_CONFIG] / "timeline"


async def ha_time_zone():
    """The time zone of Home Assistant (its days are the days of the files); the add-on's own when it cannot be asked."""
    try:
        from zoneinfo import ZoneInfo
        async with aiohttp.ClientSession() as s:
            async with s.get(f"{HA_API}/config", headers=ha_headers(), timeout=aiohttp.ClientTimeout(total=10)) as r:
                name = (await r.json()).get("time_zone") if r.status == 200 else None
        return ZoneInfo(name) if name else None
    except Exception:  # noqa: BLE001 - no tzdata, no answer: local time of the add-on
        return None


class _HaSocket:
    """async with: an authenticated websocket to Home Assistant (for the recorder)."""
    async def __aenter__(self):
        self.sess = aiohttp.ClientSession()
        try:
            self.ws = await self.sess.ws_connect(ha_ws_url(), heartbeat=30, max_msg_size=64 * 1024 * 1024)
            await asyncio.wait_for(self.ws.receive_json(), 10)                       # auth_required
            await self.ws.send_json({"type": "auth", "access_token": SUPERVISOR_TOKEN})
            if (await asyncio.wait_for(self.ws.receive_json(), 10)).get("type") != "auth_ok":
                raise RuntimeError("authentication failed")
        except BaseException:
            await self.sess.close()
            raise
        return self.ws

    async def __aexit__(self, *exc):
        await self.ws.close()
        await self.sess.close()


def timeline_tracked(request, cache: dict) -> set:
    """Entity ids of every house; a layout file is only read again when it changed."""
    ids = set()
    for h in houses_index(request):
        p = house_file(request, h["id"])
        try:
            key = p.stat().st_mtime_ns
        except OSError:
            continue
        if cache.get(p, (None,))[0] != key:
            cache[p] = (key, tl.layout_entities(read_json(p, {})))
        ids |= cache[p][1]
    return ids


async def timeline_recorder(app):
    """Background task: records while the add-on runs (also with no browser open). Only with Home Assistant (a token)."""
    task = None
    if SUPERVISOR_TOKEN:
        ctx, cache = _AppCtx(app), {}

        def settings():
            s = validate_settings(read_settings(ctx))
            return s["timelineOn"], s["timelineKeepDays"]

        async def start():
            await asyncio.sleep(5)
            rec = tl.Recorder(timeline_dir(ctx), await ha_time_zone())
            app[KEY_TIMELINE]["rec"] = rec
            await tl.run_recorder(rec, connect=_HaSocket, slim_state=slim_state, tracked=lambda: timeline_tracked(ctx, cache), settings=settings)

        task = asyncio.create_task(start())
    yield
    if task:
        task.cancel()


KEY_TIMELINE = web.AppKey("timeline", dict)     # {"rec": the running Recorder}


# ---------- entities renamed in Home Assistant: the plans follow (renames.py) ----------
KEY_RENAMES = web.AppKey("renames", dict)       # {"history": {old: [new, when]}, "current": set of entity ids} for put_layout, "side": set of ids get_areas leaves out, "parts": {id: its thermostat}, "battery": {id: the battery entity of its device}


def apply_renames(app, ids: dict, names: dict) -> dict:
    """New entity ids (and Home Assistant's new names of devices not named by hand) into every house, the settings and users.json."""
    ctx = _AppCtx(app)
    houses, revs = [], {}
    for h in houses_index(ctx):
        p = house_file(ctx, h["id"])
        data = read_json(p, None)
        if isinstance(data, dict) and rn.rewrite(data, ids, names):
            before = layout_rev(p)
            write_json_atomic(p, data)
            houses.append(h["id"])
            revs[h["id"]] = [before, layout_rev(p)]     # an open view does the same rewrite and takes the new tag (#403)
    stored = read_json(settings_path(ctx), None)
    settings = isinstance(stored, dict) and bool(ids) and rn.rewrite(stored, ids) > 0
    if settings:
        backup_settings(ctx)                       # the previous state stays recoverable
        write_json_atomic(settings_path(ctx), stored)
    users = read_json(users_file(ctx), None)
    if isinstance(users, dict) and ids and rn.rewrite(users, ids):
        try:
            write_json_atomic(users_file(ctx), users)
        except OSError:
            log.warning("could not write %s", users_file(ctx))
    return {"houses": houses, "revs": revs, "settings": bool(settings)}


async def rename_watcher(app):
    """Background task: follows entities renamed in Home Assistant (also with no browser open). Only with Home Assistant (a token)."""
    app[KEY_RENAMES] = {}
    task = None
    if SUPERVISOR_TOKEN:
        path = app[KEY_DATA] / "renames.json"

        def keep(state):
            app[KEY_RENAMES].update(history=state.get("history") or {}, current=set(state.get("current") or ()),
                                    side=set(state.get("side") or ()),      # kept off the area lists (#368)
                                    parts=dict(state.get("parts") or {}),   # the entities of a thermostat's device (#370)
                                    battery=dict(state.get("battery") or {}))   # the battery entity of each entity's device (#376)

        def load():
            state = read_json(path, {})
            state = state if isinstance(state, dict) else {}
            keep(state)
            return state

        def save(state):
            keep(state)
            write_json_atomic(path, state)

        async def apply(ids, names):
            done = apply_renames(app, ids, names)      # in the loop like put_layout, so a save of a browser cannot slip in between
            log.info("Renamed in Home Assistant: %s; new names: %s; houses updated: %s%s",
                     ", ".join(f"{a} -> {b}" for a, b in ids.items()) or "-", ", ".join(f"{e}: {n[1]}" for e, n in names.items()) or "-",
                     ", ".join(done["houses"]) or "-", " (and the settings)" if done["settings"] else "")
            await app[KEY_LIVE].broadcast({"type": "renamed", "ids": ids, "names": names, "settings": done["settings"], "revs": done["revs"]})

        async def start():
            await asyncio.sleep(5)
            await rn.run_watch(connect=_HaSocket, load=load, save=save, apply=apply)

        task = asyncio.create_task(start())
    yield
    if task:
        task.cancel()


# ---------- the energy dashboard of Home Assistant (#407): what it knows, to take over in the power editor ----------
def energy_stat_ids(prefs) -> set:
    """Every entity the energy preferences name (stat_energy_from, stat_rate, stat_soc ... in every source, also in the older nested
    form flow_from / flow_to / power / power_config); statistics of other kinds ("domain:name") are left out."""
    out = set()

    def walk(v):
        if isinstance(v, dict):
            for k, x in v.items():
                if k.startswith("stat_") and isinstance(x, str) and re.match(r"^[a-z_]+\.[^\s:]+$", x):
                    out.add(x)
                else:
                    walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
    walk(prefs)
    return out


def energy_siblings(prefs, registry: list) -> dict:
    """{entity of the preferences: the other sensors of the same device}: an energy meter (kWh) usually has its power sensor (W) next
    to it, which the power editor needs."""
    by_device, device_of = {}, {}
    for r in registry or []:
        e, d = r.get("entity_id"), r.get("device_id")
        if isinstance(e, str) and d:
            device_of[e] = d
            by_device.setdefault(d, []).append(e)
    return {e: sorted(x for x in by_device.get(device_of[e], []) if x != e and x.startswith("sensor."))
            for e in sorted(energy_stat_ids(prefs)) if e in device_of}


async def get_energy_prefs(request):
    """The energy dashboard's settings and, for every sensor in them, the other sensors of its device (editors only). prefs is null
    while the energy dashboard is not set up."""
    if not await can_edit(request):
        return forbidden()
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no Home Assistant (standalone mode)"}, status=503)
    try:
        async with _HaSocket() as ws:
            more = []
            try:
                prefs = await rn.ask(ws, 1, {"type": "energy/get_prefs"}, more)
            except LookupError:
                prefs = None                                     # "not_found": the energy dashboard is not set up yet
            registry = await rn.ask(ws, 2, {"type": "config/entity_registry/list"}, more) if prefs else []
    except (OSError, RuntimeError, ConnectionError, asyncio.TimeoutError, aiohttp.ClientError, LookupError) as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)
    return web.json_response({"prefs": prefs, "siblings": energy_siblings(prefs, registry) if prefs else {}})


# ---------- the pages of the tab bar (#481, pages.py): ⚡ Energie (meters and statistics) and ☀ Heute (forecast, calendars) ----------
KEY_PAGES = web.AppKey("pages", dict)          # short-lived answers of Home Assistant (forecasts, calendar days): key -> (time, answer)
HA_DOWN = (OSError, RuntimeError, ConnectionError, asyncio.TimeoutError, aiohttp.ClientError, LookupError, ValueError)


def pages_cached(request, key, ttl):
    hit = request.app[KEY_PAGES].get(key)
    return hit[1] if hit and time.time() - hit[0] < ttl else None


def pages_keep(request, key, answer):
    cache = request.app[KEY_PAGES]
    if len(cache) > 200:                        # a long-running add-on: forget the old ones
        cache.clear()
    cache[key] = (time.time(), answer)
    return answer


async def get_energy_counters(request):
    """The kWh counters of the power editor's sensors (?from=&to=&solar=&batIn=&batOut=, counters.py): "⤵ Von oben übernehmen" of the
    meters of the page ⚡ Energie (#501). Editors only."""
    if not await can_edit(request):
        return forbidden()
    sources = counters.clean_sources(request.query)
    if not sources:
        return web.json_response({"error": "no power sensors"}, status=400)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"found": {}})
    try:
        states = {x["entity_id"]: x for x in await ha_states() if isinstance(x, dict) and isinstance(x.get("entity_id"), str)}
        async with _HaSocket() as ws:
            registry = await rn.ask(ws, 1, {"type": "config/entity_registry/list"}, [])
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)
    return web.json_response({"found": counters.find_counters(sources, states, registry if isinstance(registry, list) else [])})


async def make_energy_counter(request):
    """"＋ Zähler anlegen": Home Assistant's "Integral" helper made from a power sensor ({"source": "sensor.…"}), W -> kWh, through its
    config flow; -> {"entity_id", "name"}. Editors only."""
    if not await can_edit(request):
        return forbidden()
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    source = body.get("source") if isinstance(body, dict) else None
    if not isinstance(source, str) or not counters.SENSOR.match(source):
        return web.json_response({"error": "source: a sensor"}, status=400)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no Home Assistant (standalone mode)"}, status=503)
    try:
        st = next((x for x in await ha_states() if isinstance(x, dict) and x.get("entity_id") == source), None)
        if not st or (st.get("attributes") or {}).get("unit_of_measurement") not in counters.POWER_UNITS:
            return web.json_response({"error": "not a power sensor (W, kW)"}, status=400)
        name = counters.helper_name((st.get("attributes") or {}).get("friendly_name") or source)
        async with aiohttp.ClientSession() as s:
            async with s.post(f"{HA_API}/config/config_entries/flow", headers=ha_headers(), json={"handler": "integration", "show_advanced_options": False}) as r:
                flow = await r.json() if r.status == 200 else {}
            if flow.get("type") != "form" or not isinstance(flow.get("flow_id"), str):
                return web.json_response({"error": "Home Assistant did not start the helper"}, status=502)
            async with s.post(f"{HA_API}/config/config_entries/flow/{flow['flow_id']}", headers=ha_headers(), json=counters.helper_input(source, name)) as r:
                done = await r.json() if r.status == 200 else {}
        if done.get("type") != "create_entry":
            return web.json_response({"error": "Home Assistant did not make the helper", "errors": done.get("errors")}, status=502)
        entry = (done.get("result") or {}).get("entry_id")
        for _ in range(10):                                  # the sensor of the new helper: in the entity registry by its config entry
            async with _HaSocket() as ws:
                registry = await rn.ask(ws, 1, {"type": "config/entity_registry/list"}, [])
            eid = next((x.get("entity_id") for x in registry if isinstance(x, dict) and entry and x.get("config_entry_id") == entry), None)
            if eid:
                return web.json_response({"entity_id": eid, "name": name})
            await asyncio.sleep(0.5)
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)
    return web.json_response({"error": "the new helper has no sensor yet"}, status=502)


async def get_energy_meters(request):
    """The meters of Home Assistant's energy dashboard by kind, its devices and fixed prices (the page ⚡ Energie; anybody who may
    see the energy)."""
    if "energy" in user_locks(request):
        return web.json_response({"error": "the energy is locked for this user"}, status=403)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no Home Assistant (standalone mode)"}, status=503)
    try:
        async with _HaSocket() as ws:
            try:
                prefs = await rn.ask(ws, 1, {"type": "energy/get_prefs"}, [])
            except LookupError:
                prefs = None                                     # the energy dashboard is not set up
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)
    return web.json_response(pages.energy_meters(prefs))


async def post_energy_stats(request):
    """How much each meter counted per hour / day / week / month of a span (Home Assistant's long-term statistics, kWh and m³; a power
    sensor's mean as kWh, #503)."""
    if "energy" in user_locks(request):
        return web.json_response({"error": "the energy is locked for this user"}, status=403)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no Home Assistant (standalone mode)"}, status=503)
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    q, err = pages.clean_stats_request(body)
    if err:
        return web.json_response({"error": err}, status=400)
    try:
        async with _HaSocket() as ws:
            res = await rn.ask(ws, 1, {"type": "recorder/statistics_during_period", "start_time": q["start"], "end_time": q["end"],
                                       "statistic_ids": q["ids"], "period": q["period"], "types": ["change", "mean"],
                                       "units": {"energy": "kWh", "volume": "m³", "power": "kW"}}, [])   # a power sensor as a meter: its mean (#503)
            try:
                meta = await rn.ask(ws, 2, {"type": "recorder/get_statistics_metadata", "statistic_ids": q["ids"]}, [])
            except LookupError:
                meta = []
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)
    return web.json_response(pages.slim_stats(res, meta, q["period"]))


async def post_energy_levels(request):
    """The charge of batteries (%) through a span (#515, the card "🔋 Ladestand" of ⚡ Energie): Home Assistant's statistics (mean, min,
    max per 5 minutes, hour or day); a sensor without statistics (no state_class) from its history, when the span is a week or less.
    Kept 2 minutes."""
    if "energy" in user_locks(request):
        return web.json_response({"error": "the energy is locked for this user"}, status=403)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no Home Assistant (standalone mode)"}, status=503)
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    q, err = pages.clean_levels_request(body)
    if err:
        return web.json_response({"error": err}, status=400)
    key = ("levels", tuple(q["ids"]), q["start"], q["end"], q["period"])
    hit = pages_cached(request, key, 120)
    if hit is not None:
        return web.json_response(hit)
    try:
        async with _HaSocket() as ws:
            res = await rn.ask(ws, 1, {"type": "recorder/statistics_during_period", "start_time": q["start"], "end_time": q["end"],
                                       "statistic_ids": q["ids"], "period": q["period"], "types": ["mean", "min", "max"]}, [])
        stats, hist = pages.slim_levels(res), {}
        missing = [i for i in q["ids"] if i not in stats]
        if missing and q["history"]:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as s:
                async with s.get(f"{HA_API}/history/period/{q['start']}", headers=ha_headers(),
                                 params={"filter_entity_id": ",".join(missing), "end_time": q["end"], "minimal_response": "", "no_attributes": ""}) as r:
                    hist = pages.slim_level_history(await r.json(), missing) if r.status == 200 else {}
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)
    return web.json_response(pages_keep(request, key, {"stats": stats, "hist": hist}))


async def get_forecast(request):
    """The forecast of a weather entity (daily or hourly), kept for 15 minutes."""
    entity, kind = request.query.get("entity", ""), request.query.get("type", "daily")
    if not pages.WEATHER_ID.match(entity) or kind not in ("daily", "hourly"):
        return web.json_response({"error": "a weather entity and daily or hourly"}, status=400)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"forecast": []})
    key = ("wx", entity, kind)
    hit = pages_cached(request, key, 900)
    if hit is not None:
        return web.json_response(hit)
    try:
        async with aiohttp.ClientSession() as s:
            async with s.post(f"{HA_API}/services/weather/get_forecasts?return_response", headers=ha_headers(),
                              json={"entity_id": entity, "type": kind}) as r:
                if r.status != 200:
                    return web.json_response({"error": f"HA answered {r.status}", "forecast": []}, status=502)
                data = await r.json()
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}", "forecast": []}, status=502)
    return web.json_response(pages_keep(request, key, {"forecast": pages.slim_forecast(data, entity)}))


async def ha_calendars() -> list:
    """[{"entity_id", "name"}] of Home Assistant's calendars"""
    async with aiohttp.ClientSession() as s:
        async with s.get(f"{HA_API}/calendars", headers=ha_headers()) as r:
            data = await r.json() if r.status == 200 else []
    return [{"entity_id": c["entity_id"], "name": (c.get("name") or c["entity_id"])[:80]} for c in data if isinstance(c, dict)
            and isinstance(c.get("entity_id"), str) and pages.CALENDAR_ID.match(c["entity_id"])][:50]


async def get_calendars(request):
    """Home Assistant's calendars, for choosing those of the page ☀ Heute."""
    if not SUPERVISOR_TOKEN:
        return web.json_response([])
    try:
        return web.json_response(await ha_calendars())
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)


async def get_agenda(request):
    """The events of the chosen calendars (all when none is chosen) and of the waste calendar between start and end (?start=&end=,
    at most 14 days), kept for 5 minutes."""
    win = pages.agenda_window(request.query.get("start"), request.query.get("end"))
    if not win:
        return web.json_response({"error": "start and end: dates with a time zone, at most 14 days apart"}, status=400)
    st = validate_settings(read_settings(request))
    if not SUPERVISOR_TOKEN:
        return web.json_response({"events": [], "waste": st["wasteCalendar"]})
    try:
        ids = st["agendaCalendars"] or [c["entity_id"] for c in await ha_calendars()]
        if st["wasteCalendar"] and st["wasteCalendar"] not in ids:
            ids = ids + [st["wasteCalendar"]]
        key = ("agenda", win, tuple(ids))
        hit = pages_cached(request, key, 300)
        if hit is None:
            events = []
            async with aiohttp.ClientSession() as s:
                for cal in ids[:21]:
                    async with s.get(f"{HA_API}/calendars/{cal}", headers=ha_headers(), params={"start": win[0], "end": win[1]}) as r:
                        if r.status == 200:
                            events += pages.slim_events(await r.json(), cal)
            hit = pages_keep(request, key, events)
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}", "events": []}, status=502)
    return web.json_response({"events": hit, "waste": st["wasteCalendar"]})


MAX_CARD_CALENDARS = 10


async def get_calendar_events(request):
    """The events of the calendars of a calendar card (#495, ?ids=calendar.a,calendar.b&start=&end=, at most 10 calendars and 42 days: a
    month), kept for 5 minutes (a new event made through the card forgets them, call_service)."""
    win = pages.agenda_window(request.query.get("start"), request.query.get("end"), 42)
    ids = pages.clean_calendars(request.query.get("ids", "").split(","))[:MAX_CARD_CALENDARS]
    if not win or not ids:
        return web.json_response({"error": "ids: calendars; start and end: dates with a time zone, at most 42 days apart"}, status=400)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"events": []})
    key = ("calendar", win, tuple(ids))
    hit = pages_cached(request, key, 300)
    if hit is None:
        events, failed = [], []
        try:
            async with aiohttp.ClientSession() as s:
                for cal in ids:
                    async with s.get(f"{HA_API}/calendars/{cal}", headers=ha_headers(), params={"start": win[0], "end": win[1]}) as r:
                        if r.status == 200:
                            events += pages.slim_events(await r.json(), cal, 150)
                        else:
                            failed.append(cal)
        except HA_DOWN as err:
            return web.json_response({"error": f"Home Assistant not reachable: {err}", "events": []}, status=502)
        hit = pages_keep(request, key, {"events": events, "failed": failed})
    return web.json_response(hit)


# ---------- the card "Verlauf" of a page (#484, boards.py): the history of one entity ----------
HISTORY_HOURS = (6, 24, 168, 720)


async def get_history(request):
    """The numbers of one entity over the last hours (?entity=&hours=6|24|168|720) for a card "Verlauf", kept 2 minutes."""
    entity, hours = request.query.get("entity", ""), request.query.get("hours", "24")
    if not boards.ENTITY.match(entity) or not hours.isdigit() or int(hours) not in HISTORY_HOURS:
        return web.json_response({"error": "an entity and hours 6, 24, 168 or 720"}, status=400)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"points": []})
    key = ("history", entity, int(hours))
    hit = pages_cached(request, key, 120)
    if hit is not None:
        return web.json_response(hit)
    start = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=int(hours))).isoformat()
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as s:
            async with s.get(f"{HA_API}/history/period/{start}", headers=ha_headers(),
                             params={"filter_entity_id": entity, "minimal_response": "", "no_attributes": "", "significant_changes_only": ""}) as r:
                if r.status != 200:
                    return web.json_response({"error": f"HA answered {r.status}", "points": []}, status=502)
                data = await r.json()
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}", "points": []}, status=502)
    return web.json_response(pages_keep(request, key, {"points": boards.slim_history(data, entity)}))


# ---------- 👨‍👩‍👧 Familie (#483, pages.py): the people with their phone's battery, their pictures, the pinboard ----------
MAX_PICTURE_BYTES = 2 * 1024 * 1024


async def ha_states() -> list:
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
        async with s.get(f"{HA_API}/states", headers=ha_headers()) as r:
            data = await r.json() if r.status == 200 else []
    return data if isinstance(data, list) else []


async def get_family(request):
    """Home Assistant's people: where, since when, a picture or not, the battery of the phone (kept for a minute)."""
    if not SUPERVISOR_TOKEN:
        return web.json_response({"people": []})
    hit = pages_cached(request, ("family",), 60)
    if hit is not None:
        return web.json_response(hit)
    try:
        states = await ha_states()
        registry = []
        if any(isinstance(x, dict) and str(x.get("entity_id", "")).startswith("person.") for x in states):
            async with _HaSocket() as ws:                     # the phone's battery: a sensor of the device of the person's tracker
                registry = await rn.ask(ws, 1, {"type": "config/entity_registry/list"}, [])
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}", "people": []}, status=502)
    return web.json_response(pages_keep(request, ("family",), {"people": pages.family(states, registry)}))


async def get_family_picture(request):
    """The picture of a person (its entity_picture in Home Assistant: an uploaded one or one of its www folder), never from elsewhere."""
    entity = request.match_info["entity"]
    if not pages.PERSON_ID.match(entity):
        return web.json_response({"error": "not a person"}, status=400)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no supervisor token"}, status=503)
    base = HA_API[:-4] if HA_API.endswith("/api") else HA_API
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
            async with s.get(f"{HA_API}/states/{entity}", headers=ha_headers()) as r:
                path = pages.person_picture(await r.json()) if r.status == 200 else None
            if not path:
                return web.json_response({"error": "no picture"}, status=404)
            async with s.get(base.rstrip("/") + path, headers=ha_headers()) as r:
                ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
                body = await read_all(r, MAX_PICTURE_BYTES) if r.status == 200 else None
    except (aiohttp.ClientError, asyncio.TimeoutError, ValueError):
        return web.json_response({"error": "Home Assistant not reachable"}, status=502)
    if ctype not in CAMERA_TYPES or body is None:
        return web.json_response({"error": "unexpected answer"}, status=502)
    return web.Response(body=body, content_type=ctype, headers={"Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff"})


def pinboard_path(request) -> Path:
    return data_dir(request) / "pinboard.json"


def read_notes(request) -> list:
    stored = read_json(pinboard_path(request), {})
    return pages.clean_notes(stored.get("notes") if isinstance(stored, dict) else [])


def pinboard_answer(request, notes, **more):
    """the notes and whether a note can also go to the phones (the channel of "Benachrichtigung bei Alarm" is set up)"""
    return web.json_response({"notes": notes, "canSend": an.ready(notify_cfg(request)) is None, **more})


async def get_pinboard(request):
    """The notes of the pinboard, the same for everybody (newest first)."""
    return pinboard_answer(request, read_notes(request))


async def post_pinboard(request):
    """A new note ({"text", "color", "send"}): with the name of who wrote it; "send": also as a message to the phones."""
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    by = current_user(request)["display"]
    note, err = pages.new_note(body, by, datetime.datetime.now(datetime.timezone.utc), secrets.token_hex(8))
    if err:
        return web.json_response({"error": err}, status=400)
    notes = pages.add_note(read_notes(request), note)
    write_json_atomic(pinboard_path(request), {"notes": notes})
    sent, why = None, None
    if body.get("send") is True:
        cfg = notify_cfg(request)
        sent, why = await send_notify(cfg, f"📌 {note['by'] or '3D Floorplan'}: {note['text']}") if an.ready(cfg) is None else (False, "not set up")
    return pinboard_answer(request, notes, sent=sent, **({"error": why} if why else {}))


async def delete_pinboard(request):
    """A note taken off (anybody may, like on a real pinboard at home)."""
    nid = request.match_info["id"]
    notes = read_notes(request)
    left = [n for n in notes if n["id"] != nid]
    if len(left) != len(notes):
        write_json_atomic(pinboard_path(request), {"notes": left})
    return pinboard_answer(request, left)


# ---------- 🎵 Musik & TV (#490): the picture of a player ----------
async def get_media_picture(request):
    """The picture of what a player plays (Home Assistant's media proxy of that player), never anything else."""
    entity = request.match_info["entity"]
    if not controls.PLAYER.match(entity):
        return web.json_response({"error": "not a media player"}, status=400)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no supervisor token"}, status=503)
    base = HA_API[:-4] if HA_API.endswith("/api") else HA_API
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
            async with s.get(f"{HA_API}/states/{entity}", headers=ha_headers()) as r:
                path = pages.media_picture(await r.json()) if r.status == 200 else None
            if not path:
                return web.json_response({"error": "no picture"}, status=404)
            async with s.get(base.rstrip("/") + path, headers=ha_headers()) as r:
                ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
                body = await read_all(r, MAX_PICTURE_BYTES) if r.status == 200 else None
    except (aiohttp.ClientError, asyncio.TimeoutError, ValueError):
        return web.json_response({"error": "Home Assistant not reachable"}, status=502)
    if ctype not in CAMERA_TYPES or body is None:
        return web.json_response({"error": "unexpected answer"}, status=502)
    return web.Response(body=body, content_type=ctype, headers={"Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff"})


# ---------- 🧺 Haushalt (#490, household.py): the machines, "✓ Ausgeräumt" for everybody, the shopping list ----------
def household_path(request) -> Path:
    return data_dir(request) / "household.json"


async def household_answer(request) -> dict:
    """the machines found and what each does now (kept half a minute; the power sensors' last 24 hours from Home Assistant's history)"""
    hit = pages_cached(request, ("household",), 30)
    if hit is not None:
        return hit
    states = await ha_states()
    found = hh.find_appliances(states, read_settings(request).get("appliances"))
    power = sorted({r["power"] for r in found.values() if r.get("power")})
    history = {}
    if power:
        start = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)).isoformat()
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as s:
            async with s.get(f"{HA_API}/history/period/{start}", headers=ha_headers(),
                             params={"filter_entity_id": ",".join(power), "minimal_response": "", "no_attributes": ""}) as r:
                history = hh.history_points(await r.json()) if r.status == 200 else {}
    stored = read_json(household_path(request), {})
    acks = hh.clean_acks(stored.get("acks") if isinstance(stored, dict) else None)
    by_id = {st["entity_id"]: st for st in states if isinstance(st, dict) and isinstance(st.get("entity_id"), str)}
    now = time.time()
    return pages_keep(request, ("household",), {"appliances": [hh.appliance(k, found[k], by_id, history, acks.get(k), now) for k in hh.KINDS if k in found]})


def tell_ready(cfg) -> bool:
    """a message can go out: the way of ⚙ → Warnungen & Alarm is set up (also while "Nachricht bei Alarm senden" is off)"""
    return an.ready({**cfg, "on": True}) is None


def household_store(request) -> dict:
    """household.json: {"acks" (✓ Ausgeräumt), "tell" (🔔 who wants to be told, #531), "told" (the run told about last)}"""
    stored = read_json(household_path(request), {})
    stored = stored if isinstance(stored, dict) else {}
    return {"acks": hh.clean_acks(stored.get("acks")), "tell": hh.clean_tell(stored.get("tell"), time.time()), "told": hh.clean_told(stored.get("told"))}


async def household_tell(request, answer=None) -> None:
    """🔔 "Sag mir Bescheid" (#531): a message for every machine that is done and was asked for (or with "always" on). Runs every minute
    (household_teller) and after each look at the page; nothing without a set-up message channel."""
    store = household_store(request)
    always = validate_settings(read_settings(request)).get("householdTell")
    cfg = notify_cfg(request)
    if not (store["tell"] or always) or not tell_ready(cfg):
        return
    apps = (answer or await household_answer(request)).get("appliances")
    kinds, tell, told = hh.due_tells(apps, store["tell"], store["told"], bool(always), time.time())
    if tell == store["tell"] and told == store["told"]:
        return
    write_json_atomic(household_path(request), {**store, "tell": tell, "told": told})
    for kind in kinds:
        await send_notify(cfg, hh.tell_text(kind, notify_lang(request)))


async def get_household(request):
    if not SUPERVISOR_TOKEN:
        return web.json_response({"appliances": [], "tell": {}, "canTell": False})
    try:
        answer = await household_answer(request)
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}", "appliances": []}, status=502)
    try:
        await household_tell(request, answer)
    except Exception:  # noqa: BLE001 - the page shows the machines anyway; the minute's check tries again
        log.exception("household: telling failed")
    return web.json_response({**answer, "tell": {k: True for k in household_store(request)["tell"]}, "canTell": tell_ready(notify_cfg(request))})


async def post_household_tell(request):
    """🔔 "Sag mir Bescheid" for one machine, or not any more ({"kind", "on"}); anybody may, like "✓ Ausgeräumt" (#531)"""
    try:
        body = await request.json()
    except ValueError:
        body = {}
    kind = body.get("kind") if isinstance(body, dict) else None
    if kind not in hh.KINDS:
        return web.json_response({"error": "washer, dryer or dishwasher"}, status=400)
    store = household_store(request)
    tell = {k: v for k, v in store["tell"].items() if k != kind}
    if body.get("on") is not False:
        tell[kind] = {"at": time.time(), "by": current_user(request)["name"][:80]}
    write_json_atomic(household_path(request), {**store, "tell": tell})
    return await get_household(request)


async def household_teller(app):
    """Background task: 🔔 "Sag mir Bescheid" also while no screen is open (#531), every minute (only with Home Assistant)."""
    task = None
    if SUPERVISOR_TOKEN:
        ctx = _AppCtx(app)

        async def loop():
            while True:
                await asyncio.sleep(60)
                try:
                    await household_tell(ctx)
                except Exception:  # noqa: BLE001 - Home Assistant away or a message that did not go: next minute again
                    pass

        task = asyncio.create_task(loop())
    yield
    if task:
        task.cancel()


async def post_household_ack(request):
    """"✓ Ausgeräumt": the machine was emptied (anybody may, it is kept for every screen)."""
    try:
        body = await request.json()
    except ValueError:
        body = {}
    kind = body.get("kind") if isinstance(body, dict) else None
    if kind not in hh.KINDS:
        return web.json_response({"error": "washer, dryer or dishwasher"}, status=400)
    store = household_store(request)
    write_json_atomic(household_path(request), {**store, "acks": {**store["acks"], kind: time.time()}})
    request.app[KEY_PAGES].pop(("household",), None)
    return await get_household(request)


# ---------- the voice search (#509, voice.py): Home Assistant's Assist turns what was said into text ----------
async def voice_info(request) -> dict:
    """{"assist", "pipeline", "name", "language"}: an Assist pipeline with speech-to-text, asked at most once a minute"""
    hit = pages_cached(request, ("voice",), 60)
    if hit is not None:
        return hit
    async with _HaSocket() as ws:
        res = await rn.ask(ws, 1, {"type": "assist_pipeline/pipeline/list"}, [])
    return pages_keep(request, ("voice",), vc.pipeline_info(res))


async def get_voice(request):
    """Can Home Assistant turn speech into text (for the 🎤 of a browser without its own recognition)? And may this user use the voice
    search at all (the lock "voice")?"""
    locked = "voice" in user_locks(request)
    if not SUPERVISOR_TOKEN or locked:
        return web.json_response({"assist": False, "locked": locked})
    try:
        return web.json_response({**await voice_info(request), "locked": False})
    except HA_DOWN as err:
        return web.json_response({"assist": False, "locked": False, "error": f"Home Assistant not reachable: {err}"})


async def post_voice_stt(request):
    """What was said, as text: the body is 16-bit mono audio at 16 kHz (at most 15 s) -> {"text"}; Home Assistant's Assist does the work."""
    if "voice" in user_locks(request):
        return web.json_response({"error": "locked"}, status=403)
    audio = await request.read()
    if not vc.audio_ok(audio):
        return web.json_response({"error": "16-bit mono audio at 16 kHz, 0.25 to 15 seconds"}, status=400)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no_assist"}, status=409)
    try:
        info = await voice_info(request)
        if not info["assist"]:
            return web.json_response({"error": "no_assist"}, status=409)
        async with _HaSocket() as ws:
            text = await vc.transcribe(ws, audio, info["pipeline"])
        return web.json_response({"text": text})
    except LookupError as err:
        request.app[KEY_PAGES].pop(("voice",), None)          # the pipeline may have changed: ask again next time
        return web.json_response({"error": str(err)}, status=502)
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)


async def todo_answer(request, wanted=None) -> dict:
    """the to-do lists of Home Assistant and the items of the one shown"""
    lists = hh.todo_lists(await ha_states())
    entity = hh.pick_list(lists, wanted, read_settings(request).get("shoppingList"))
    items = []
    if entity:
        async with _HaSocket() as ws:
            items = hh.slim_items(await rn.ask(ws, 1, {"type": "todo/item/list", "entity_id": entity}, []))
    return {"lists": lists, "entity": entity, "items": items}


async def get_todo(request):
    """The shopping list (or another to-do list of Home Assistant, ?entity=)."""
    if not SUPERVISOR_TOKEN:
        return web.json_response({"lists": [], "entity": "", "items": []})
    try:
        return web.json_response(await todo_answer(request, request.query.get("entity")))
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}", "lists": [], "entity": "", "items": []}, status=502)


async def post_todo(request):
    """A change of the list: add an item, tick one off or back, clear the ticked ones (anybody may, like the pinboard)."""
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no supervisor token"}, status=503)
    try:
        body = await request.json()
    except ValueError:
        body = None
    call = hh.todo_call(body)
    if not call:
        return web.json_response({"error": "an entity todo.* and add (item), done / undo (uid) or clear"}, status=400)
    entity, service, data = call
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
            async with s.post(f"{HA_API}/services/todo/{service}", headers=ha_headers(), json={"entity_id": entity, **data}) as r:
                ok = r.status == 200
        answer = await todo_answer(request, entity)
    except HA_DOWN as err:
        return web.json_response({"error": f"Home Assistant not reachable: {err}"}, status=502)
    return web.json_response({**answer, "ok": ok}, status=200 if ok else 502)


# ---------- a message when something goes off: alarm panel, smoke, gas, CO, water (#414, alarmnotify.py) ----------
CALLMEBOT_URL = os.environ.get("CALLMEBOT_URL", "https://api.callmebot.com/whatsapp.php")
CALLMEBOT_TG = os.environ.get("CALLMEBOT_TG", "https://api.callmebot.com")   # Telegram: text.php (users), telegram/group.php (a group, #456)
KEY_NOTIFY = web.AppKey("notify", dict)         # {"cfg": the settings of the messages, "lang": Home Assistant's language}


def notify_path(request) -> Path:
    return data_dir(request) / "notify.json"      # not in the settings: every tablet reads those; the phone number and the key stay here


def app_state(request):
    """the add-on's state for a request: also from the backup's own small app (its upload may be larger, make_app), whose parent has it"""
    return getattr(request, "config_dict", None) or request.app


def notify_cfg(request) -> dict:
    store = app_state(request)[KEY_NOTIFY]
    if "cfg" not in store:
        stored = read_json(notify_path(request), {})
        store["cfg"] = an.clean(stored, stored)
    return store["cfg"]


def notify_lang(request) -> str:
    """the language of the messages: the one picked in the settings, else Home Assistant's, else English"""
    s = validate_settings(read_settings(request))
    if s["langChosen"] and s["language"] in an.TEXTS:
        return s["language"]
    ha = (request.app[KEY_NOTIFY].get("lang") or "")[:2]
    return ha if ha in an.TEXTS else "en"


async def send_notify(cfg: dict, message: str):
    """one message the way the settings say (WhatsApp or Telegram through CallMeBot, or notify services of Home Assistant): (ok, error
    text); with several services it is sent to each, an error names the ones that failed"""
    why = an.ready({**cfg, "on": True})
    if why:
        return False, f"not set up: {why}"
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as s:
            if cfg["via"] == "ha":
                if not SUPERVISOR_TOKEN:
                    return False, "no Home Assistant (standalone mode)"
                bad = []
                for svc in cfg["services"]:
                    async with s.post(f"{HA_API}/services/notify/{svc}", headers=ha_headers(),
                                      json={"title": "3D Floorplan", "message": message}) as r:
                        if r.status != 200:
                            bad.append(f"notify.{svc}: Home Assistant answered {r.status}")
                if cfg.get("entities"):                           # notify entities (#460): all in one notify.send_message
                    async with s.post(f"{HA_API}/services/notify/send_message", headers=ha_headers(),
                                      json={"entity_id": cfg["entities"], "title": "3D Floorplan", "message": message}) as r:
                        if r.status != 200:
                            bad.append(f"{', '.join(cfg['entities'])}: Home Assistant answered {r.status}")
                return (False, "; ".join(bad)) if bad else (True, None)
            if cfg["via"] == "telegram":
                group = cfg.get("tgMode") == "group"
                url = f"{CALLMEBOT_TG}/telegram/group.php" if group else f"{CALLMEBOT_TG}/text.php"
                params = {"apikey": cfg["tgkey"], "text": message, "html": "no"} if group else {"user": "|".join(cfg["tgUsers"]), "text": message}
            else:
                url, params = CALLMEBOT_URL, {"phone": cfg["phone"], "text": message, "apikey": cfg["apikey"]}
            async with s.get(url, params=params) as r:
                err = an.callmebot_failed(r.status, await r.text(), message)
                return (False, err) if err else (True, None)
    except Exception as err:  # noqa: BLE001 - no network, a timeout ...: said, never raised
        return False, str(err) or type(err).__name__


async def get_notify(request):
    """the settings of the messages (without the CallMeBot keys; "services" and "entities" are the ticked ones) and what Home Assistant can
    send through ("available": its notify services and notify entities, each with where it comes from, #460) (editors)"""
    if not await can_edit(request):
        return forbidden()
    available = []
    if SUPERVISOR_TOKEN:
        services, states, registry = [], [], []
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
                async with s.get(f"{HA_API}/services", headers=ha_headers()) as r:
                    services = await r.json() if r.status == 200 else []
                async with s.get(f"{HA_API}/states", headers=ha_headers()) as r:
                    states = await r.json() if r.status == 200 else []
            if any(isinstance(x, dict) and str(x.get("entity_id", "")).startswith("notify.") for x in states):
                async with _HaSocket() as ws:                     # which integration a notify entity belongs to (e.g. the Telegram bot)
                    registry = await rn.ask(ws, 1, {"type": "config/entity_registry/list"}, [])
        except Exception:  # noqa: BLE001 - the list is only a help, a name can be typed
            pass
        available = an.notify_targets(services, states, registry)
    cfg = notify_cfg(request)
    return web.json_response({**an.public(cfg), "ready": an.ready(cfg), "available": available})


async def put_notify(request):
    if not await can_edit(request):
        return forbidden()
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    if not isinstance(body, dict):
        return web.json_response({"error": "object expected"}, status=400)
    cfg = an.clean(body, notify_cfg(request))
    write_json_atomic(notify_path(request), cfg)
    request.app[KEY_NOTIFY]["cfg"] = cfg
    return web.json_response({**an.public(cfg), "ready": an.ready(cfg)})


async def test_notify(request):
    """send a test message the way it is set up now"""
    if not await can_edit(request):
        return forbidden()
    ok, err = await send_notify(notify_cfg(request), an.test_text(notify_lang(request)))
    return web.json_response({"ok": ok, "error": err}, status=200 if ok else 502)


def notify_places(request, cache: dict) -> list:
    """[(house name, layout)] of every house, for where a sensor is; a file is only read again when it changed"""
    out = []
    for h in houses_index(request):
        p = house_file(request, h["id"])
        try:
            key = p.stat().st_mtime_ns
        except OSError:
            continue
        if cache.get(p, (None,))[0] != key:
            cache[p] = (key, read_json(p, {}))
        out.append((h.get("name") or "", cache[p][1]))
    return out


async def alarm_notifier(app):
    """Background task: a message when something goes off (also with no browser open). Only with Home Assistant (a token)."""
    app[KEY_NOTIFY] = {}
    task = None
    if SUPERVISOR_TOKEN:
        ctx, cache = _AppCtx(app), {}

        async def start():
            await asyncio.sleep(5)
            tz = await ha_time_zone()
            try:
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
                    async with s.get(f"{HA_API}/config", headers=ha_headers()) as r:
                        app[KEY_NOTIFY]["lang"] = str((await r.json()).get("language") or "") if r.status == 200 else ""
            except Exception:  # noqa: BLE001 - English then
                pass
            await an.run_watch(connect=_HaSocket, config=lambda: notify_cfg(ctx), send=lambda msg: send_notify(notify_cfg(ctx), msg),
                               places=lambda: notify_places(ctx, cache), lang=lambda: notify_lang(ctx),
                               clock=lambda: datetime.datetime.now(tz).strftime("%d.%m. %H:%M"))

        task = asyncio.create_task(start())
    yield
    if task:
        task.cancel()


# ---------- the add-on's own holiday alarm: chosen sensors, a code, sirens and a message when it goes off (#456, guard.py) ----------
KEY_GUARD = web.AppKey("guard", dict)           # {"cfg", "state", "tries", "places", "tz"}


def guard_path(request) -> Path:
    return data_dir(request) / "guard.json"       # with the hashed code: not in the settings every tablet reads


def guard_store(request) -> dict:
    store = app_state(request)[KEY_GUARD]
    if "cfg" not in store:
        stored = read_json(guard_path(request), {})
        stored = stored if isinstance(stored, dict) else {}
        store["cfg"], store["state"] = gd.clean_cfg(stored.get("cfg"), stored.get("cfg")), gd.clean_state(stored.get("state"))
    return store


def guard_save(request, state=None) -> None:
    store = guard_store(request)
    if state is not None:
        store["state"] = state
    write_json_atomic(guard_path(request), {"cfg": store["cfg"], "state": store["state"]})


async def guard_act(request, events) -> None:
    """what the events say: the message (through the settings of alarmnotify), sirens and lights on at an alarm, off again after it"""
    store = guard_store(request)
    cfg = store["cfg"]
    when = datetime.datetime.now(store.get("tz")).strftime("%d.%m. %H:%M")
    for ev, data in events:
        if ev == "alarm" and cfg["actions"] and SUPERVISOR_TOKEN:
            await guard_switch(cfg["actions"], "turn_on")
        if ev == "disarmed" and data.get("alarm") and SUPERVISOR_TOKEN:
            off = [e for e in cfg["actions"] if e.split(".")[0] in gd.OFF_DOMAINS]
            if off:
                await guard_switch(off, "turn_off")
        where = an.where_of(await asyncio.to_thread(notify_places, request, store.setdefault("places", {})), data["entity"]) if ev == "alarm" else ""
        msg = gd.message(ev, data, cfg, notify_lang(request), where, when)
        if msg and cfg["notify"]:
            ok, err = await send_notify(notify_cfg(request), msg)
            log.info("holiday alarm message (%s): %s", ev, "sent" if ok else f"not sent: {err}")


async def guard_switch(entities, service) -> None:
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as s:
            async with s.post(f"{HA_API}/services/homeassistant/{service}", headers=ha_headers(), json={"entity_id": entities}) as r:
                log.info("holiday alarm: %s %s -> %s", service, ", ".join(entities), r.status)
    except Exception as err:  # noqa: BLE001 - said in the log, the message still goes out
        log.warning("holiday alarm: %s failed (%s)", service, err)


def guard_tick(request):
    """the time goes on also without the watcher (standalone, or between its looks): leaving time over -> armed, entry time over -> alarm"""
    store = guard_store(request)
    st, events = gd.tick(store["state"], store["cfg"], time.time())
    if events:
        guard_save(request, st)
        asyncio.create_task(guard_act(_AppCtx(request.app), events))


async def get_guard(request):
    """the state for every screen (the lock screen); for editors also the settings (without the code)"""
    store = guard_store(request)
    guard_tick(request)
    cfg, edit = store["cfg"], await can_edit(request)
    out = {"view": gd.view(store["state"], time.time()), "ready": gd.ready(cfg), "sensors": cfg["sensors"], "delay": cfg["delay"],
           "locked": "guard" in user_locks(request), "canEdit": edit}
    if edit:
        out["cfg"] = gd.public(cfg)
    return web.json_response(out)


async def put_guard(request):
    if not await can_edit(request):
        return forbidden()
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    if not isinstance(body, dict):
        return web.json_response({"error": "object expected"}, status=400)
    store = guard_store(request)
    old, new = store["cfg"], gd.clean_cfg(body, store["cfg"])
    if store["state"]["phase"] != "off":
        new = {**new, "code": new["code"] or old["code"], "sensors": new["sensors"] or old["sensors"]}   # armed: it must stay possible to switch it off
    store["cfg"] = new
    guard_save(request)
    return web.json_response({"cfg": gd.public(store["cfg"]), "ready": gd.ready(store["cfg"])})


async def guard_with_code(request, arm: bool):
    """arm or disarm with the code; locked users are refused, after a few wrong codes everybody waits (and a message goes out when armed)"""
    if "guard" in user_locks(request):
        return web.json_response({"error": "locked"}, status=403)
    store = guard_store(request)
    store.setdefault("tries", gd.Tries())
    try:
        body = await request.json()
    except ValueError:
        body = {}
    now = time.time()
    if arm and gd.ready(store["cfg"]):
        return web.json_response({"error": "not set up", "ready": gd.ready(store["cfg"])}, status=409)
    wait = store["tries"].wait(now)
    if wait:
        return web.json_response({"error": "wait", "wait": wait}, status=429)
    if not gd.check_code(store["cfg"], (body or {}).get("code") if isinstance(body, dict) else None):
        n = store["tries"].wrong(now)
        if n == gd.TRIES and store["state"]["phase"] != "off" and store["cfg"]["notify"]:
            asyncio.create_task(send_notify(notify_cfg(request), gd.text("tries", notify_lang(request), n=n)))
        return web.json_response({"error": "code", "left": max(0, gd.TRIES - n)}, status=403)
    store["tries"].right()
    who = current_user(request)["name"] or "?"
    st, events = (gd.arm if arm else lambda s, c, t, b: gd.disarm(s, t, b))(store["state"], store["cfg"], now, who)
    guard_save(request, st)
    if events:
        asyncio.create_task(guard_act(_AppCtx(request.app), events))
    return web.json_response({"view": gd.view(st, now)})


async def arm_guard(request):
    return await guard_with_code(request, True)


async def disarm_guard(request):
    return await guard_with_code(request, False)


# ---------- a full screen kept on for a user (lock "fullscreen", #487): only the code ends it; one code for every screen, set by an
# editor, stored salted and hashed like the holiday alarm's (never in the settings every tablet reads) ----------
KEY_FULL = web.AppKey("fullscreen", dict)       # {"code": {"salt", "hash"} | None, "tries": gd.Tries}


def full_path(request) -> Path:
    return data_dir(request) / "fullscreen.json"


def full_store(request) -> dict:
    store = request.app[KEY_FULL]
    if "code" not in store:
        stored = read_json(full_path(request), {})
        c = stored.get("code") if isinstance(stored, dict) else None
        store["code"] = c if isinstance(c, dict) and isinstance(c.get("salt"), str) and isinstance(c.get("hash"), str) else None
        store["tries"] = gd.Tries()
    return store


async def get_fullscreen(request):
    """whether the code is set (never the code itself)"""
    return web.json_response({"hasCode": full_store(request)["code"] is not None})


async def put_fullscreen(request):
    """editors set the code (4 to 8 digits) or take it away ("")"""
    if not await can_edit(request):
        return forbidden()
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    code = body.get("code") if isinstance(body, dict) else None
    new = gd.make_code(code)
    if not new and code != "":
        return web.json_response({"error": "the code needs 4 to 8 digits"}, status=400)
    store = full_store(request)
    store["code"] = new
    write_json_atomic(full_path(request), {"code": new})
    return web.json_response({"hasCode": new is not None})


async def unlock_fullscreen(request):
    """the code typed on a kept full screen: right, the screen may leave it; no code set: nobody can; after a few wrong codes everybody
    waits (like the holiday alarm)"""
    store = full_store(request)
    try:
        body = await request.json()
    except ValueError:
        body = {}
    if store["code"] is None:
        return web.json_response({"error": "no code"}, status=409)
    now = time.time()
    wait = store["tries"].wait(now)
    if wait:
        return web.json_response({"error": "wait", "wait": wait}, status=429)
    if not gd.check_code(store, body.get("code") if isinstance(body, dict) else None):
        n = store["tries"].wrong(now)
        return web.json_response({"error": "code", "left": max(0, gd.TRIES - n)}, status=403)
    store["tries"].right()
    return web.json_response({"ok": True})


async def guard_watcher(app):
    """Background task: while the holiday alarm is armed, watch its sensors (also with no browser open). Only with Home Assistant."""
    app[KEY_GUARD] = {}
    task = None
    if SUPERVISOR_TOKEN:
        ctx = _AppCtx(app)

        async def start():
            await asyncio.sleep(3)
            guard_store(ctx)["tz"] = await ha_time_zone()

            def put(st):
                guard_save(ctx, st)

            await gd.run_guard(connect=_HaSocket, get=lambda: (guard_store(ctx)["cfg"], guard_store(ctx)["state"]), put=put,
                               act=lambda events: guard_act(ctx, events))

        task = asyncio.create_task(start())
    yield
    if task:
        task.cancel()


async def timeline_allowed(request) -> bool:
    return "timeline" not in user_locks(request)


async def get_timeline(request):
    """The recorded days (newest first), whether recording is on and where the files are."""
    if not await timeline_allowed(request):
        return forbidden()
    s = validate_settings(read_settings(request))
    rec = request.app[KEY_TIMELINE].get("rec")
    return web.json_response({"days": await asyncio.to_thread(tl.list_days, timeline_dir(request)), "on": s["timelineOn"],
                              "keepDays": s["timelineKeepDays"], "recording": bool(rec and rec.day), "ha": bool(SUPERVISOR_TOKEN),
                              "folder": "addon_configs/…_floorplan3d/timeline"})


async def get_timeline_day(request):
    """One day: {day, start, end, lines} (start/end: epoch seconds of its midnights). ?download=1: the file itself."""
    if not await timeline_allowed(request):
        return forbidden()
    day = request.match_info["day"]
    if not tl.DAY.match(day):
        return web.json_response({"error": "bad day"}, status=400)
    folder = timeline_dir(request)
    p = folder / f"{day}.jsonl"
    if not p.is_file():
        return web.json_response({"error": "not recorded"}, status=404)
    if request.query.get("download"):
        return web.FileResponse(p, headers={"Content-Disposition": f'attachment; filename="floorplan3d-timeline-{day}.jsonl"',
                                            "Content-Type": "application/x-ndjson"})
    rec = request.app[KEY_TIMELINE].get("rec")
    tz = rec.tz if rec else None
    if rec:
        await asyncio.to_thread(rec.flush)              # what happened in the last seconds is in the file too
    lines = await asyncio.to_thread(tl.read_day, folder, day)
    resp = web.json_response({"day": day, "start": tl.day_start(day, tz), "end": tl.day_start(tl.next_day(day), tz), "now": time.time(), "lines": lines})
    resp.enable_compression()
    return resp


# ---------- version and checksums: is this really the version I think it is? ----------
MANIFEST_URL = os.environ.get("MANIFEST_URL", "https://raw.githubusercontent.com/BuRnEd4AiM/HA-Floorplanner/main/floorplan3d/rootfs/app/manifest.json")


async def get_version(request):
    """Version, build checksum, the check of the files that are really installed and the checksums of the files the browser loads."""
    m = mf.load_manifest(Path(__file__).parent)
    if not m:
        return web.json_response({"known": False, "version": "?", "buildHash": "", "short": "?"})
    server = await asyncio.to_thread(mf.compare, Path(__file__).parent, m)
    static = {k[len("static/"):]: v for k, v in m["files"].items() if k.startswith("static/") and not k.startswith("static/vendor/")}
    return web.json_response({"known": True, "version": m["version"], "buildHash": m["buildHash"], "short": m["buildHash"][:7],
                              "server": server, "staticFiles": static})


async def get_version_remote(request):
    """Compare this add-on with the manifest on GitHub (main). Only for editors: it makes a request to the internet."""
    if not await can_edit(request):
        return forbidden()
    local = mf.load_manifest(Path(__file__).parent)
    if not local:
        return web.json_response({"state": "unknown"})
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as sess:
            async with sess.get(MANIFEST_URL, headers={"Cache-Control": "no-cache"}) as r:
                if r.status != 200:
                    return web.json_response({"state": "unreachable", "status": r.status})
                remote = json.loads(await r.text())
        if not isinstance(remote, dict) or not isinstance(remote.get("buildHash"), str):
            return web.json_response({"state": "unreachable"})
    except (aiohttp.ClientError, asyncio.TimeoutError, ValueError, OSError):
        return web.json_response({"state": "unreachable"})
    return web.json_response({"state": mf.relation(local, remote), "version": str(remote.get("version", "")), "short": remote["buildHash"][:7]})


# ---------- property import (JSON / GeoJSON -> new house) and export ----------
APP_DIR = Path(__file__).parent
EXAMPLE_NAME = re.compile(r"^[a-z0-9_-]{1,40}$")
GEOJSON_TYPES = {"FeatureCollection", "Feature", "Polygon", "MultiPolygon", "GeometryCollection"}


def _import_response(report, summary, **extra):
    return {"summary": summary, "warnings": report.warnings, "errors": report.errors, **extra}


async def post_import(request):
    """Build a NEW house from a property description. ?dryRun=1 only checks and reports. Existing houses are never touched."""
    if not await can_edit(request):
        return forbidden()
    try:
        data = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON", "errors": [{"path": "$", "message": "not valid JSON"}], "warnings": []}, status=400)
    converted = False
    if isinstance(data, dict) and data.get("type") in GEOJSON_TYPES:
        try:
            data = importer.geojson_to_property(data, str(request.query.get("name") or "Haus vom Grundstück")[:60])
            converted = True
        except ValueError as err:
            return web.json_response({"error": str(err), "errors": [{"path": "$", "message": str(err)}], "warnings": []}, status=400)
    layout, plot, report, summary = importer.build_layout(data)
    if layout is None:
        return web.json_response(_import_response(report, summary, error="the description has errors", ok=False), status=400)
    name = str(request.query.get("name") or (data.get("name") if isinstance(data, dict) else "") or "Importiertes Haus").strip()[:60] or "Importiertes Haus"
    if request.query.get("dryRun") in ("1", "true"):
        return web.json_response(_import_response(report, summary, ok=True, dryRun=True, name=name, fromGeoJSON=converted))
    houses = houses_index(request)
    if len(houses) >= MAX_HOUSES:
        return web.json_response({"error": "too many houses", "errors": [{"path": "$", "message": f"at most {MAX_HOUSES} houses"}], "warnings": []}, status=400)
    hid = secrets.token_hex(4)
    write_json_atomic(house_file(request, hid), layout)
    houses.append({"id": hid, "name": name})
    save_houses(request, houses)
    return web.json_response(_import_response(report, summary, ok=True, id=hid, name=name, fromGeoJSON=converted))


async def get_export_property(request):
    """The house as property JSON (walls explicit), so it can be edited by hand or by a script and imported again."""
    if not await can_edit(request):
        return forbidden()
    hid = pick_house(request)
    if hid is None:
        return web.json_response({"error": "unknown house"}, status=404)
    name = next((h["name"] for h in houses_index(request) if h["id"] == hid), "Haus")
    data = importer.layout_to_property(read_json(house_file(request, hid), EMPTY_LAYOUT), name)
    return web.Response(text=json.dumps(data, ensure_ascii=False, indent=1), content_type="application/json",
                        headers={"Content-Disposition": f'attachment; filename="floorplan3d-property-{hid}.json"'})


async def get_import_schema(request):
    return web.FileResponse(APP_DIR / "property.schema.json")


async def get_import_example(request):
    name = request.match_info["name"]
    path = APP_DIR / "examples" / f"{name}.json"
    if not EXAMPLE_NAME.match(name) or not path.is_file():
        return web.json_response({"error": "unknown example"}, status=404)
    return web.FileResponse(path)


def make_app(data_path: Path | None = None, config_path: Path | None = None) -> web.Application:
    app = web.Application(client_max_size=max(MAX_LAYOUT_BYTES, MAX_BG_BYTES + 1024 * 1024), middlewares=[login_gate])
    app[KEY_DATA] = Path(data_path or os.environ.get("DATA_DIR", "./data"))
    app[KEY_CONFIG] = Path(config_path or os.environ.get("CONFIG_DIR") or ("/config" if Path("/config").is_dir() else app[KEY_DATA] / "addon_config"))
    app[KEY_LIVE] = LiveHub()
    app[KEY_TIMELINE] = {}
    app[KEY_PAGES] = {}
    app[KEY_FULL] = {}
    app.on_startup.append(seed_users_file)
    app.on_response_prepare.append(no_stale_files)
    app.on_cleanup.append(stop_live)
    app.cleanup_ctx.append(backup_scheduler)
    app.cleanup_ctx.append(timeline_recorder)
    app.cleanup_ctx.append(rename_watcher)
    app.cleanup_ctx.append(alarm_notifier)
    app.cleanup_ctx.append(guard_watcher)
    app.cleanup_ctx.append(household_teller)
    app.add_routes([
        web.get("/", index),
        web.get("/auth/login", auth_login),
        web.get("/auth/callback", auth_callback),
        web.get("/auth/logout", auth_logout),
        web.get("/api/users-file", get_users_file),
        web.post("/api/users-file/sync", sync_users_file),
        web.get("/api/layout", get_layout),
        web.put("/api/layout", put_layout),
        web.get("/api/houses", get_houses),
        web.post("/api/houses", post_house),
        web.patch("/api/houses/{id}", patch_house),
        web.delete("/api/houses/{id}", delete_house),
        web.get("/api/backup", get_backup),
        web.get("/api/version", get_version),
        web.get("/api/version/remote", get_version_remote),
        web.get("/api/backups", get_backups),
        web.post("/api/backups", post_backups),
        web.post("/api/backups/test", post_backups_test),
        web.post("/api/backups/restore", post_backups_restore),
        web.get("/api/timeline", get_timeline),
        web.get("/api/timeline/{day}", get_timeline_day),
        web.get("/api/backups/{name}", get_backup_file),
        web.delete("/api/backups/{name}", delete_backup_file),
        web.post("/api/import", post_import),
        web.get("/api/import/schema", get_import_schema),
        web.get("/api/import/examples/{name}", get_import_example),
        web.get("/api/export/property", get_export_property),
        web.get("/api/me", get_me),
        web.get("/api/users", get_users),
        web.get("/api/settings", get_settings),
        web.put("/api/settings", put_settings),
        web.get("/api/models", list_models),
        web.post("/api/models", upload_model),
        web.get("/api/models/{name}", get_model),
        web.delete("/api/models/{name}", delete_model),
        web.post("/api/backgrounds", upload_background),
        web.get("/api/backgrounds/{name}", get_background),
        web.delete("/api/backgrounds/{name}", delete_background),
        web.get("/api/entities", get_entities),
        web.get("/api/live", live_ws),
        web.get("/api/areas", get_areas),
        web.get("/api/batteries", get_batteries),
        web.get("/api/energy/prefs", get_energy_prefs),
        web.get("/api/energy/meters", get_energy_meters),
        web.get("/api/energy/counters", get_energy_counters), web.post("/api/energy/counter", make_energy_counter),
        web.post("/api/energy/stats", post_energy_stats),
        web.post("/api/energy/levels", post_energy_levels),
        web.get("/api/forecast", get_forecast),
        web.get("/api/calendars", get_calendars),
        web.get("/api/agenda", get_agenda),
        web.get("/api/calendar/events", get_calendar_events),
        web.get("/api/history", get_history),
        web.get("/api/family", get_family),
        web.get("/api/family/{entity}/picture", get_family_picture),
        web.get("/api/pinboard", get_pinboard),
        web.post("/api/pinboard", post_pinboard),
        web.delete("/api/pinboard/{id}", delete_pinboard),
        web.get("/api/media/{entity}/picture", get_media_picture),
        web.get("/api/household", get_household),
        web.post("/api/household/ack", post_household_ack),
        web.post("/api/household/tell", post_household_tell),
        web.get("/api/todo", get_todo),
        web.get("/api/voice", get_voice),
        web.post("/api/voice/stt", post_voice_stt),
        web.post("/api/todo", post_todo),
        web.get("/api/notify", get_notify),
        web.put("/api/notify", put_notify),
        web.post("/api/notify/test", test_notify),
        web.get("/api/guard", get_guard),
        web.put("/api/guard", put_guard),
        web.post("/api/guard/arm", arm_guard),
        web.post("/api/guard/disarm", disarm_guard),
        web.get("/api/fullscreen", get_fullscreen),
        web.put("/api/fullscreen", put_fullscreen),
        web.post("/api/fullscreen/unlock", unlock_fullscreen),
        web.post("/api/service", call_service),
        web.get("/api/camera/{entity}", get_camera),
        web.get("/api/camera/{entity}/hls", get_camera_hls),
        web.get("/api/hls/{token}/{name:.+}", get_hls),
        web.static("/", STATIC_DIR, show_index=False),
    ])
    sub = web.Application(client_max_size=MAX_BACKUP_BYTES)   # the restore upload may be far larger than any other request
    sub[KEY_DATA] = app[KEY_DATA]
    sub[KEY_CONFIG] = app[KEY_CONFIG]
    sub.add_routes([web.post("", post_backup)])
    app.add_subapp("/api/backup", sub)
    return app


if __name__ == "__main__":
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "info").upper())
    web.run_app(make_app(), host="0.0.0.0", port=PORT)
