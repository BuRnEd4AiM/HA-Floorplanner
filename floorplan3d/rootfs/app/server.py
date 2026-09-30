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
import time
import os
import re
import secrets
from pathlib import Path
from urllib.parse import unquote

import aiohttp
from aiohttp import web

STATIC_DIR = Path(__file__).parent / "static"
SUPERVISOR_TOKEN = os.environ.get("SUPERVISOR_TOKEN")
HA_API = os.environ.get("HA_API", "http://supervisor/core/api")
PORT = int(os.environ.get("PORT", "8099"))
OPTIONS_FILE = Path(os.environ.get("OPTIONS_FILE", "/data/options.json"))

MAX_MODEL_BYTES = 20 * 1024 * 1024
MAX_LAYOUT_BYTES = 10 * 1024 * 1024
MAX_BG_BYTES = 8 * 1024 * 1024
ALLOWED_DOMAINS = {"light", "switch", "cover", "fan", "media_player", "climate", "lock", "scene", "script", "input_boolean"}
SERVICES = {"toggle", "turn_on", "turn_off", "open_cover", "close_cover", "stop_cover", "lock", "unlock", "set_cover_position"}

DEFAULT_SETTINGS = {
    "language": "de",          # de | en
    "theme": "holo",           # holo | dark | light
    "units": "metric",         # metric | imperial
    "grid": 0.25,              # meters
    "wallHeight": 2.6,
    "wallThickness": 0.2,
    "shadows": True,
    "autosaveSeconds": 1.5,
    "lowWalls": False,
    "showLabels": True,
    "cutaway": True,           # walls facing the camera sink down
    "wallStop": True,          # devices cannot be dragged through walls (doors let them pass)
    "belowVisibility": 0.5,    # how clearly floors below the current one shine through (0.05..1)
    "wallOpacity": 0.72,       # hologram walls: 0.2 (glass) .. 1 (solid)
    "glowRadius": 3.5,         # metres a lamp lights up
    "glowStrength": 1.0,
    "glowHeight": 1.6,         # metres the coloured glow climbs the walls
    "defaultLightColor": "#ffc861",
    "userRooms": {},           # Home Assistant user name -> room name (one tablet per room)
    "userViews": {},           # Home Assistant user name -> 3d | 2d | split | all (what that user sees in live mode)
    "bgTop": "#0a3ba8",
    "bgBottom": "#031547",
    "bgGlow": "#28ebd2",
    "tempStops": [{"v": 16, "c": "#2a6bff"}, {"v": 20, "c": "#2ad0a0"}, {"v": 23, "c": "#ffd84a"},
                  {"v": 26, "c": "#ff8a2a"}, {"v": 30, "c": "#ff3a3a"}],
    "humidStops": [{"v": 30, "c": "#e8d9a0"}, {"v": 50, "c": "#4fd0c8"}, {"v": 65, "c": "#2a7bff"},
                   {"v": 80, "c": "#5a3aff"}],
}
RANGES = {"belowVisibility": (0.05, 1.0), "wallOpacity": (0.2, 1.0), "glowRadius": (0.5, 12.0), "glowStrength": (0.2, 3.0), "glowHeight": (0.2, 4.0)}
VIEWS = ("3d", "2d", "split", "all")
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
EMPTY_LAYOUT = {
    "version": 1,
    "floors": [{"id": "f1", "name": "Erdgeschoss", "walls": [], "rooms": [], "devices": []}],
}

log = logging.getLogger("floorplan3d")
KEY_DATA = web.AppKey("data_dir", Path)


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
    return web.json_response({"user": user["name"], "canEdit": edit, "room": room, "view": view,
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
    for key, default in DEFAULT_SETTINGS.items():
        if key not in data:
            continue
        val = data[key]
        if isinstance(default, dict):
            out[key] = ({str(k)[:80]: v[:80] for k, v in list(val.items())[:50] if isinstance(v, str) and v}
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
    if out["language"] not in ("de", "en"):
        out["language"] = DEFAULT_SETTINGS["language"]
    if out["theme"] not in ("holo", "dark", "light"):
        out["theme"] = DEFAULT_SETTINGS["theme"]
    if out["units"] not in ("metric", "imperial"):
        out["units"] = DEFAULT_SETTINGS["units"]
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


async def get_settings(request):
    return web.json_response(validate_settings(read_settings(request)), headers={"ETag": settings_rev(request)})


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
    backup_settings(request)                       # the previous state stays recoverable
    write_json_atomic(settings_path(request), clean)
    backup_settings(request)
    return web.json_response(clean, headers={"ETag": settings_rev(request)})


# ---------- custom GLB models ----------
MODEL_NAME = re.compile(r"^[a-z0-9][a-z0-9_-]{0,47}$")


def models_dir(request) -> Path:
    return data_dir(request) / "models"


async def list_models(request):
    d = models_dir(request)
    items = []
    if d.exists():
        for p in sorted(d.glob("*.glb")):
            items.append({"name": p.stem, "size": p.stat().st_size, "url": f"api/models/{p.stem}"})
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
    name = request.match_info["name"]
    p = models_dir(request) / f"{name}.glb"
    if not MODEL_NAME.match(name) or not p.is_file():
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
    return web.json_response([
        {
            "entity_id": st["entity_id"],
            "name": st.get("attributes", {}).get("friendly_name", st["entity_id"]),
            "domain": st["entity_id"].split(".")[0],
            "state": st["state"],
            "unit": st.get("attributes", {}).get("unit_of_measurement"),
            "brightness": _pct(st.get("attributes", {}).get("brightness"), 255),
            "position": st.get("attributes", {}).get("current_position"),
            "rgb": st.get("attributes", {}).get("rgb_color"),
            "dc": st.get("attributes", {}).get("device_class"),
            "ct": st.get("attributes", {}).get("current_temperature"),
            "ch": st.get("attributes", {}).get("current_humidity"),
            "fx": _effects(st.get("attributes", {})),
            "fxc": st.get("attributes", {}).get("effect"),
            "members": _members(st),
        }
        for st in states
    ])


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
    async with aiohttp.ClientSession() as s:
        async with s.post(f"{HA_API}/services/{domain}/{service}", headers=ha_headers(),
                          json=payload) as r:
            ok = r.status == 200
            return web.json_response({"ok": ok}, status=200 if ok else 502)


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
        houses, settings, bgs, models = validate_backup(data)
    except ValueError as err:
        return web.json_response({"error": str(err)}, status=400)
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
    return web.json_response({"ok": True, "houses": len(houses), "pictures": len(bgs), "models": len(models)})


def make_app(data_path: Path | None = None) -> web.Application:
    app = web.Application(client_max_size=max(MAX_LAYOUT_BYTES, MAX_BG_BYTES + 1024 * 1024))
    app[KEY_DATA] = Path(data_path or os.environ.get("DATA_DIR", "./data"))
    app.add_routes([
        web.get("/", index),
        web.get("/api/layout", get_layout),
        web.put("/api/layout", put_layout),
        web.get("/api/houses", get_houses),
        web.post("/api/houses", post_house),
        web.patch("/api/houses/{id}", patch_house),
        web.delete("/api/houses/{id}", delete_house),
        web.get("/api/backup", get_backup),
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
        web.get("/api/areas", get_areas),
        web.post("/api/service", call_service),
        web.static("/", STATIC_DIR, show_index=False),
    ])
    sub = web.Application(client_max_size=MAX_BACKUP_BYTES)   # the restore upload may be far larger than any other request
    sub[KEY_DATA] = app[KEY_DATA]
    sub.add_routes([web.post("", post_backup)])
    app.add_subapp("/api/backup", sub)
    return app


if __name__ == "__main__":
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "info").upper())
    web.run_app(make_app(), host="0.0.0.0", port=PORT)
