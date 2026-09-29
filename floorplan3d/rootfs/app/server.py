"""3D Floorplan – backend for the Home Assistant add-on.

- serves the frontend (static/)
- stores the floor plan layout, user settings and custom GLB models under DATA_DIR
- reads entities and calls services through the Supervisor proxy
"""
import json
import logging
import os
import re
from pathlib import Path
from urllib.parse import unquote

import aiohttp
from aiohttp import web

STATIC_DIR = Path(__file__).parent / "static"
SUPERVISOR_TOKEN = os.environ.get("SUPERVISOR_TOKEN")
HA_API = os.environ.get("HA_API", "http://supervisor/core/api")
PORT = int(os.environ.get("PORT", "8099"))

MAX_MODEL_BYTES = 20 * 1024 * 1024
MAX_LAYOUT_BYTES = 10 * 1024 * 1024
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
    "belowVisibility": 0.5,    # how clearly floors below the current one shine through (0.05..1)
    "wallOpacity": 0.72,       # hologram walls: 0.2 (glass) .. 1 (solid)
    "glowRadius": 3.5,         # metres a lamp lights up
    "glowStrength": 1.0,
    "glowHeight": 1.6,         # metres the coloured glow climbs the walls
    "defaultLightColor": "#ffc861",
    "bgTop": "#0a3ba8",
    "bgBottom": "#031547",
    "bgGlow": "#28ebd2",
    "tempStops": [{"v": 16, "c": "#2a6bff"}, {"v": 20, "c": "#2ad0a0"}, {"v": 23, "c": "#ffd84a"},
                  {"v": 26, "c": "#ff8a2a"}, {"v": 30, "c": "#ff3a3a"}],
    "humidStops": [{"v": 30, "c": "#e8d9a0"}, {"v": 50, "c": "#4fd0c8"}, {"v": 65, "c": "#2a7bff"},
                   {"v": 80, "c": "#5a3aff"}],
}
RANGES = {"belowVisibility": (0.05, 1.0), "wallOpacity": (0.2, 1.0), "glowRadius": (0.5, 12.0), "glowStrength": (0.2, 3.0), "glowHeight": (0.2, 4.0)}
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


# ---------- layout ----------
async def get_layout(request):
    return web.json_response(read_json(data_dir(request) / "layout.json", EMPTY_LAYOUT))


async def put_layout(request):
    try:
        data = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    if not isinstance(data, dict) or not isinstance(data.get("floors"), list):
        return web.json_response({"error": "floors missing"}, status=400)
    write_json_atomic(data_dir(request) / "layout.json", data)
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
        if isinstance(default, list):
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
    for key, (lo, hi) in RANGES.items():
        out[key] = min(hi, max(lo, out[key]))
    if out["language"] not in ("de", "en"):
        out["language"] = DEFAULT_SETTINGS["language"]
    if out["theme"] not in ("holo", "dark", "light"):
        out["theme"] = DEFAULT_SETTINGS["theme"]
    if out["units"] not in ("metric", "imperial"):
        out["units"] = DEFAULT_SETTINGS["units"]
    return out


async def get_settings(request):
    stored = read_json(data_dir(request) / "settings.json", {})
    return web.json_response(validate_settings(stored if isinstance(stored, dict) else {}))


async def put_settings(request):
    try:
        data = await request.json()
    except ValueError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    if not isinstance(data, dict):
        return web.json_response({"error": "object expected"}, status=400)
    clean = validate_settings(data)
    write_json_atomic(data_dir(request) / "settings.json", clean)
    return web.json_response(clean)


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
    name = request.match_info["name"]
    p = models_dir(request) / f"{name}.glb"
    if not MODEL_NAME.match(name) or not p.is_file():
        raise web.HTTPNotFound()
    p.unlink()
    return web.json_response({"ok": True})


# ---------- Home Assistant ----------
def _pct(v, scale):
    return round(v * 100 / scale) if isinstance(v, (int, float)) else None


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
        }
        for st in states
    ])


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


def make_app(data_path: Path | None = None) -> web.Application:
    app = web.Application(client_max_size=MAX_LAYOUT_BYTES)
    app[KEY_DATA] = Path(data_path or os.environ.get("DATA_DIR", "./data"))
    app.add_routes([
        web.get("/", index),
        web.get("/api/layout", get_layout),
        web.put("/api/layout", put_layout),
        web.get("/api/settings", get_settings),
        web.put("/api/settings", put_settings),
        web.get("/api/models", list_models),
        web.post("/api/models", upload_model),
        web.get("/api/models/{name}", get_model),
        web.delete("/api/models/{name}", delete_model),
        web.get("/api/entities", get_entities),
        web.post("/api/service", call_service),
        web.static("/", STATIC_DIR, show_index=False),
    ])
    return app


if __name__ == "__main__":
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "info").upper())
    web.run_app(make_app(), host="0.0.0.0", port=PORT)
