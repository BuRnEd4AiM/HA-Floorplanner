"""3D Floorplan – backend for the Home Assistant add-on.

- serves the frontend (static/)
- stores the floor plan layout, user settings and custom GLB models under DATA_DIR
- reads entities and calls services through the Supervisor proxy
"""
import asyncio
import base64
import datetime
import json
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

import importer
import manifest as mf

STATIC_DIR = Path(__file__).parent / "static"
SUPERVISOR_TOKEN = os.environ.get("SUPERVISOR_TOKEN")
HA_API = os.environ.get("HA_API", "http://supervisor/core/api")
PORT = int(os.environ.get("PORT", "8099"))
OPTIONS_FILE = Path(os.environ.get("OPTIONS_FILE", "/data/options.json"))

MAX_MODEL_BYTES = 20 * 1024 * 1024
MAX_LAYOUT_BYTES = 10 * 1024 * 1024
MAX_BG_BYTES = 8 * 1024 * 1024
ALLOWED_DOMAINS = {"light", "switch", "cover", "fan", "media_player", "climate", "lock", "scene", "script", "input_boolean"}
SERVICES = {"toggle", "turn_on", "turn_off", "open_cover", "close_cover", "stop_cover", "lock", "unlock", "set_cover_position",
            "set_temperature", "set_hvac_mode"}
HVAC_MODES = {"off", "heat", "cool", "heat_cool", "auto", "dry", "fan_only"}

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
    "alerts": True,            # smoke, gas, CO, water, alarm and windows open in the rain: banner + red room
    "alertJump": False,        # jump to the room of a new warning by itself (wall tablets)
    "weatherEntity": "",       # weather.* for "window open in the rain"; empty = the first one
    "idleReturn": 0.0,         # wall tablets: minutes without a touch until the start view returns (0 = off)
    "idleOrbit": False,        # ... and the house then turns slowly (screen saver)
    "nightDim": "off",         # off | sun | time: dim the live view at night
    "nightFrom": "22:00",
    "nightTo": "06:00",
    "belowMode": "dim",        # floors below the open one: dim (see-through, belowVisibility) | stacked (clearly visible) | hidden
    "belowLabels": True,       # room names and value labels of the floors below the open one (#249)
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
RANGES = {"idleReturn": (0.0, 240.0), "belowVisibility": (0.05, 1.0), "wallOpacity": (0.2, 1.0), "glowRadius": (0.5, 12.0), "glowStrength": (0.2, 3.0), "glowHeight": (0.2, 4.0), "bgGlowStrength": (0.0, 1.0), "earthMargin": (0.5, 100.0), "backupEveryHours": (1.0, 720.0), "backupKeepDays": (1.0, 3650.0), "backupKeepCount": (1.0, 500.0)}
VIEWS = ("3d", "2d", "split", "all")
# what a user preset may set and the values allowed (the same list as PRESET_FIELDS in static/viewprefs.js, #250)
PRESET_FIELDS = {"seeThrough": (True, False), "cutaway": (True, False), "lowWalls": (True, False),
                 "labelMode": ("important", "all", "none"), "belowMode": ("dim", "stacked", "hidden"), "belowLabels": (True, False)}


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
USERS_FILE = "users.json"       # in the add-on config folder of Home Assistant (addon_configs): survives updates and reinstalls


def data_dir(request) -> Path:
    return request.app[KEY_DATA]


def ha_headers():
    return {"Authorization": f"Bearer {SUPERVISOR_TOKEN}", "Content-Type": "application/json"}


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
    """Home Assistant Ingress tells us who is looking through X-Remote-User-* headers."""
    h = request.headers
    names = {v.strip().lower() for v in (h.get("X-Remote-User-Name"), h.get("X-Remote-User-Display-Name"),
                                         h.get("X-Remote-User-Id")) if v and v.strip()}
    return {"name": (h.get("X-Remote-User-Name") or h.get("X-Remote-User-Display-Name") or "").strip(), "ids": names}


def editors() -> set:
    """Add-on option `editors`: extra user names (or ids) that may edit besides the Home Assistant administrators."""
    data = read_json(OPTIONS_FILE, {})
    raw = data.get("editors") if isinstance(data, dict) else None
    return {str(x).strip().lower() for x in raw if str(x).strip()} if isinstance(raw, list) else set()


_admin_cache = {"at": float("-inf"), "ids": None, "users": []}


async def load_admin_ids():
    """Ids and login names of all Home Assistant administrators (owner or group system-admin), or None if they cannot be read.
    Asks Home Assistant's websocket API (config/auth/list) with the Supervisor token; cached for a minute."""
    now = time.monotonic()
    if now - _admin_cache["at"] < 60:
        return _admin_cache["ids"]
    ids = None
    base = HA_API[:-4] if HA_API.endswith("/api") else HA_API
    try:
        async with aiohttp.ClientSession() as sess:
            async with sess.ws_connect(base.rstrip("/") + "/websocket", timeout=aiohttp.ClientWSTimeout(ws_close=5) if hasattr(aiohttp, "ClientWSTimeout") else 5) as ws:
                await asyncio.wait_for(ws.receive_json(), 5)                                   # auth_required
                await ws.send_json({"type": "auth", "access_token": SUPERVISOR_TOKEN})
                if (await asyncio.wait_for(ws.receive_json(), 5)).get("type") == "auth_ok":
                    await ws.send_json({"id": 1, "type": "config/auth/list"})
                    res = await asyncio.wait_for(ws.receive_json(), 5)
                    if res.get("success") and isinstance(res.get("result"), list):
                        ids, users = set(), []
                        for u in res["result"]:
                            admin = bool(u.get("is_owner") or "system-admin" in (u.get("group_ids") or []))
                            if admin:
                                ids |= {str(v).strip().lower() for v in (u.get("id"), u.get("username")) if v}
                            if u.get("is_active", True) and not u.get("system_generated") and u.get("username"):
                                users.append({"username": u["username"], "name": u.get("name") or u["username"], "admin": admin})
                        _admin_cache["users"] = users
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
    return web.json_response({"user": user["name"], "canEdit": edit, "room": room, "view": view, "preset": preset,
                              "adminCheck": (not SUPERVISOR_TOKEN) or _admin_cache["ids"] is not None})


async def get_users(request):
    """Home Assistant users for the user pickers in the settings (editors only)."""
    if not await can_edit(request):
        return forbidden()
    if SUPERVISOR_TOKEN:
        await load_admin_ids()
    return web.json_response(_admin_cache["users"] if SUPERVISOR_TOKEN else [])


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
async def get_layout(request):
    hid = pick_house(request)
    if hid is None:
        return web.json_response({"error": "unknown house"}, status=404)
    return web.json_response(read_json(house_file(request, hid), EMPTY_LAYOUT))


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
    write_json_atomic(house_file(request, hid), data)
    if hid == DEFAULT_HOUSE and not (data_dir(request) / "houses.json").exists():
        save_houses(request, houses_index(request))
    return web.json_response({"ok": True})


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
    if out["earth"] not in ("off", "glass", "solid"):
        out["earth"] = DEFAULT_SETTINGS["earth"]
    if out["nightDim"] not in ("off", "sun", "time"):
        out["nightDim"] = DEFAULT_SETTINGS["nightDim"]
    for key in ("nightFrom", "nightTo"):
        if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", out[key]):
            out[key] = DEFAULT_SETTINGS[key]
    if out["weatherEntity"] and not re.match(r"^weather\.[a-z0-9_]+$", out["weatherEntity"]):
        out["weatherEntity"] = ""
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
def users_file(request) -> Path:
    return request.app[KEY_CONFIG] / USERS_FILE


def read_users_file(request) -> dict | None:
    """{"userRooms": ..., "userViews": ...} from the config folder, cleaned like the settings; None if there is no usable file."""
    data = read_json(users_file(request), None)
    if not isinstance(data, dict):
        return None
    clean = validate_settings({"userRooms": data.get("userRooms"), "userViews": data.get("userViews"), "userPresets": data.get("userPresets")})
    return {"userRooms": clean["userRooms"], "userViews": clean["userViews"], "userPresets": clean["userPresets"]}


def write_users_file(request, settings: dict) -> bool:
    """Mirror the users and tablets into the config folder (a readable file); never lets a settings save fail."""
    payload = {"version": 1, "userRooms": settings.get("userRooms", {}), "userViews": settings.get("userViews", {}),
               "userPresets": settings.get("userPresets", {})}
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
        if clean["userRooms"] or clean["userViews"] or clean["userPresets"]:
            write_users_file(shim, clean)


async def get_users_file(request):
    if not await can_edit(request):
        return forbidden()
    file = read_users_file(request)
    cur = validate_settings(read_settings(request))
    mine = {"userRooms": cur["userRooms"], "userViews": cur["userViews"], "userPresets": cur["userPresets"]}
    names = lambda d: set(d["userRooms"]) | set(d["userViews"]) | set(d["userPresets"])
    return web.json_response({"file": USERS_FILE, "exists": file is not None, "fileUsers": len(names(file)) if file else 0,
                              "users": len(names(mine)), "inSync": file == mine})


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
    if not st["entity_id"].startswith("climate."):
        return {}
    modes = a.get("hvac_modes")
    return {
        "hvac": a.get("hvac_action"),                         # heating | cooling | idle | off ...
        "tt": a.get("temperature"),                           # target temperature
        "tmin": a.get("min_temp"), "tmax": a.get("max_temp"), "tstep": a.get("target_temp_step"),
        "modes": [m for m in modes if isinstance(m, str)][:12] if isinstance(modes, list) else None,
    }


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
        **_climate(st, a),
        "ch": a.get("current_humidity"),
        "app": a.get("app_name") if st["entity_id"].startswith("media_player.") else None,
        "fx": _effects(a),
        "fxc": a.get("effect"),
        "members": _members(st),
        "since": st.get("last_changed") if st["state"] in ("unavailable", "unknown") else None,   # for the offline list
    }


class LiveHub:
    """One websocket to Home Assistant for every open view: each state change is pushed to all browsers the moment it
    happens, instead of every browser asking for all states every few seconds. Runs only while a browser is connected;
    when Home Assistant cannot be reached the browsers are told so and fall back to polling."""

    BATCH = 0.05                          # a scene switches many lights at once: they go out as one message
    GRACE = 60                            # keep Home Assistant's websocket a minute after the last view closed (page reloads)

    def __init__(self):
        self.clients: set = set()
        self.ok = False
        self.task = None
        self.flush_task = None
        self.pending: dict = {}
        self.empty_since = 0.0

    async def add(self, ws):
        self.clients.add(ws)
        await ws.send_json({"type": "upstream", "ok": self.ok})
        if SUPERVISOR_TOKEN and (self.task is None or self.task.done()):
            self.task = asyncio.create_task(self.run())

    def remove(self, ws):
        self.clients.discard(ws)
        if not self.clients:
            self.empty_since = time.monotonic()

    def idle(self):
        return not self.clients and time.monotonic() - self.empty_since > self.GRACE

    async def broadcast(self, msg):
        for ws in list(self.clients):
            try:
                await ws.send_json(msg)
            except Exception:  # noqa: BLE001 - a browser that went away
                self.clients.discard(ws)

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
        base = HA_API[:-4] if HA_API.endswith("/api") else HA_API
        delay = 1
        while not self.idle():
            try:
                async with aiohttp.ClientSession() as sess:
                    async with sess.ws_connect(base.rstrip("/") + "/websocket", heartbeat=30) as ws:
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
    for t in (hub.task, hub.flush_task):
        if t and not t.done():
            t.cancel()


AREA_TEMPLATE = (
    "{% set ns = namespace(o=[]) %}"
    "{% for a in areas() %}"
    "{% set ns.o = ns.o + [{'id': a, 'name': area_name(a), 'entities': area_entities(a)}] %}"
    "{% endfor %}{{ ns.o | tojson }}"
)


async def get_areas(request):
    """Home Assistant areas with their entity ids (via the template API); empty list if unavailable."""
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
    out = [
        {"id": str(a["id"]), "name": str(a.get("name") or a["id"]),
         "entities": [e for e in a.get("entities", []) if isinstance(e, str)]}
        for a in data if isinstance(a, dict) and "id" in a
    ]
    return web.json_response(sorted(out, key=lambda a: a["name"].lower()))


async def call_service(request):
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no supervisor token"}, status=503)
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    domain, service, entity = body.get("domain"), body.get("service"), body.get("entity_id")
    if domain not in ALLOWED_DOMAINS or service not in SERVICES or not isinstance(entity, str) \
            or entity.split(".")[0] != domain:
        return web.json_response({"error": "domain/service/entity not allowed"}, status=400)
    payload = {"entity_id": entity}
    data = body.get("data")
    if data is not None:
        if not isinstance(data, dict):
            return web.json_response({"error": "data must be an object"}, status=400)
        for key, val in data.items():
            if domain == "climate" and key == "temperature":
                if isinstance(val, bool) or not isinstance(val, (int, float)) or not 4 <= val <= 40:
                    return web.json_response({"error": "data not allowed"}, status=400)
                payload[key] = round(float(val), 1)
                continue
            if domain == "climate" and key == "hvac_mode":
                if val not in HVAC_MODES:
                    return web.json_response({"error": "data not allowed"}, status=400)
                payload[key] = val
                continue
            if domain == "light" and key == "rgb_color":
                if (not isinstance(val, list) or len(val) != 3
                        or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not 0 <= v <= 255 for v in val)):
                    return web.json_response({"error": "data not allowed"}, status=400)
                payload[key] = [int(v) for v in val]
                continue
            if domain == "light" and key == "color_temp_kelvin":
                if isinstance(val, bool) or not isinstance(val, (int, float)) or not 1500 <= val <= 9000:
                    return web.json_response({"error": "data not allowed"}, status=400)
                payload[key] = int(val)
                continue
            if domain == "light" and key == "effect":
                if not isinstance(val, str) or not 0 < len(val) <= 64:
                    return web.json_response({"error": "data not allowed"}, status=400)
                payload[key] = val
                continue
            ok_key = (key, domain) in (("brightness_pct", "light"), ("position", "cover"))
            if not ok_key or isinstance(val, bool) or not isinstance(val, (int, float)) or not 0 <= val <= 100:
                return web.json_response({"error": "data not allowed"}, status=400)
            payload[key] = int(val)
    if service == "set_cover_position" and "position" not in payload:
        return web.json_response({"error": "position missing"}, status=400)
    if (service == "set_temperature" and "temperature" not in payload) or (service == "set_hvac_mode" and "hvac_mode" not in payload):
        return web.json_response({"error": "value missing"}, status=400)
    if (service in ("set_temperature", "set_hvac_mode")) != (domain == "climate" and service in ("set_temperature", "set_hvac_mode")):
        return web.json_response({"error": "domain/service/entity not allowed"}, status=400)
    async with aiohttp.ClientSession() as s:
        async with s.post(f"{HA_API}/services/{domain}/{service}", headers=ha_headers(),
                          json=payload) as r:
            ok = r.status == 200
            return web.json_response({"ok": ok}, status=200 if ok else 502)


CAMERA_ID = re.compile(r"^camera\.[a-z0-9_]{1,64}$")
CAMERA_TYPES = ("image/jpeg", "image/png", "image/gif", "image/webp")
MAX_CAMERA_BYTES = 8 * 1024 * 1024


async def get_camera(request):
    """Still image of one camera (Home Assistant's camera proxy). Only jpeg / png / gif / webp, never cached."""
    entity = request.match_info["entity"]
    if not CAMERA_ID.match(entity):
        return web.json_response({"error": "not a camera"}, status=400)
    if not validate_settings(read_settings(request))["cameraImages"]:
        return web.json_response({"error": "camera images are switched off"}, status=403)
    if not SUPERVISOR_TOKEN:
        return web.json_response({"error": "no supervisor token"}, status=503)
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
            async with s.get(f"{HA_API}/camera_proxy/{entity}", headers=ha_headers()) as r:
                if r.status != 200:
                    return web.json_response({"error": f"HA answered {r.status}"}, status=502)
                ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
                body = await r.content.read(MAX_CAMERA_BYTES + 1)
    except (aiohttp.ClientError, asyncio.TimeoutError):
        return web.json_response({"error": "camera not reachable"}, status=502)
    if ctype not in CAMERA_TYPES or len(body) > MAX_CAMERA_BYTES:
        return web.json_response({"error": "unexpected answer from the camera"}, status=502)
    return web.Response(body=body, content_type=ctype, headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


async def index(request):
    return web.FileResponse(STATIC_DIR / "index.html")


# ---------- backup: export / import everything (houses, settings, models, pictures) ----------
BACKUP_FORMAT = "floorplan3d-backup"
MAX_BACKUP_BYTES = 200 * 1024 * 1024
MAX_HOUSES = 20


def build_backup(request, with_files: bool = True) -> dict:
    houses = []
    for h in houses_index(request):
        houses.append({"id": h["id"], "name": h["name"], "layout": read_json(house_file(request, h["id"]), EMPTY_LAYOUT)})
    out = {"format": BACKUP_FORMAT, "version": 1, "exported": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
           "houses": houses, "settings": read_settings(request), "backgrounds": {}, "models": {}}
    if with_files:
        for d, key, pat in ((bg_dir(request), "backgrounds", "*.*"), (models_dir(request), "models", "*.glb")):
            if d.is_dir():
                for f in sorted(d.glob(pat)):
                    if f.is_file() and (BG_NAME.match(f.name) if key == "backgrounds" else MODEL_NAME.match(f.stem)):
                        out[key][f.name] = base64.b64encode(f.read_bytes()).decode("ascii")
    return out


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
    return {"ok": True, "houses": len(houses), "pictures": len(bgs), "models": len(models)}


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
    """Write a full backup (houses, settings, pictures, 3D models) into the backups folder and return its file name."""
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
    app = web.Application(client_max_size=max(MAX_LAYOUT_BYTES, MAX_BG_BYTES + 1024 * 1024))
    app[KEY_DATA] = Path(data_path or os.environ.get("DATA_DIR", "./data"))
    app[KEY_CONFIG] = Path(config_path or os.environ.get("CONFIG_DIR") or ("/config" if Path("/config").is_dir() else app[KEY_DATA] / "addon_config"))
    app[KEY_LIVE] = LiveHub()
    app.on_startup.append(seed_users_file)
    app.on_cleanup.append(stop_live)
    app.cleanup_ctx.append(backup_scheduler)
    app.add_routes([
        web.get("/", index),
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
        web.post("/api/service", call_service),
        web.get("/api/camera/{entity}", get_camera),
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
