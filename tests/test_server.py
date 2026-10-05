import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import server  # noqa: E402


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path))


def glb(size=32):
    return b"glTF" + b"\x00" * size


async def test_layout_default_and_roundtrip(client):
    r = await client.get("/api/layout")
    assert r.status == 200
    assert (await r.json())["floors"][0]["name"] == "Erdgeschoss"

    layout = {"version": 1, "floors": [{"id": "a", "name": "OG", "walls": [], "rooms": [], "devices": []}]}
    assert (await client.put("/api/layout", json=layout)).status == 200
    assert (await (await client.get("/api/layout")).json()) == layout


async def test_layout_rejects_garbage(client):
    assert (await client.put("/api/layout", data="not json")).status == 400
    assert (await client.put("/api/layout", json={"nope": 1})).status == 400
    assert (await client.put("/api/layout", json=[1, 2])).status == 400


async def test_settings_defaults_and_validation(client):
    s = await (await client.get("/api/settings")).json()
    assert s["language"] == "auto" and s["theme"] == "dark" and s["grid"] == 0.25      # a new install follows the browser language and starts dark

    r = await client.put("/api/settings", json={"language": "en", "grid": 0.5, "theme": "neon", "evil": 1, "shadows": "yes"})
    s = await r.json()
    assert s["language"] == "en"
    assert s["grid"] == 0.5
    assert s["theme"] == "dark"       # invalid value falls back to the default
    assert s["shadows"] is True       # wrong type ignored
    assert "evil" not in s
    assert (await (await client.get("/api/settings")).json()) == s


async def test_model_upload_list_get_delete(client):
    from aiohttp import FormData
    fd = FormData()
    fd.add_field("file", glb(), filename="My Sofa!.glb", content_type="model/gltf-binary")
    r = await client.post("/api/models", data=fd)
    assert r.status == 201
    name = (await r.json())["name"]
    assert name == "my-sofa"

    fd = FormData()
    fd.add_field("file", glb(), filename="My Sofa!.glb")
    assert (await (await client.post("/api/models", data=fd)).json())["name"] == "my-sofa-2"

    assert len([m for m in await (await client.get("/api/models")).json() if not m.get("builtin")]) == 2
    r = await client.get(f"/api/models/{name}")
    assert r.status == 200 and (await r.read()).startswith(b"glTF")
    assert (await client.delete(f"/api/models/{name}")).status == 200
    assert (await client.get(f"/api/models/{name}")).status == 404


async def test_shipped_models_listed_readable_not_deletable(client):
    items = await (await client.get("/api/models")).json()
    shipped = [m for m in items if m.get("builtin")]
    assert len(shipped) > 50 and all(server.MODEL_NAME.match(m["name"]) for m in shipped)
    name = shipped[0]["name"]
    r = await client.get(f"/api/models/{name}")
    assert r.status == 200 and (await r.read()).startswith(b"glTF")
    assert (await client.delete(f"/api/models/{name}")).status == 404       # not in the user's folder

    from aiohttp import FormData
    fd = FormData()
    fd.add_field("file", glb(), filename=f"{name}.glb")                      # own upload of the same name wins
    assert (await (await client.post("/api/models", data=fd)).json())["name"] == name
    items = await (await client.get("/api/models")).json()
    assert [m for m in items if m["name"] == name] == [{"name": name, "size": 36, "url": f"api/models/{name}"}]


async def test_model_upload_validation(client):
    from aiohttp import FormData
    fd = FormData(); fd.add_field("file", b"hello", filename="x.glb")
    assert (await client.post("/api/models", data=fd)).status == 400       # no glTF magic
    fd = FormData(); fd.add_field("file", glb(), filename="x.obj")
    assert (await client.post("/api/models", data=fd)).status == 400       # wrong extension


async def test_model_path_traversal_blocked(client):
    assert (await client.get("/api/models/..%2Fsettings")).status == 404
    assert (await client.delete("/api/models/..%2Flayout")).status == 404


async def test_entities_and_service_without_supervisor(client):
    assert await (await client.get("/api/entities")).json() == []
    r = await client.post("/api/service", json={"domain": "light", "service": "toggle", "entity_id": "light.x"})
    assert r.status == 503
    assert await (await client.get("/api/areas")).json() == []


async def test_service_whitelist(client, monkeypatch):
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    bad = [
        {"domain": "shell_command", "service": "toggle", "entity_id": "shell_command.x"},
        {"domain": "light", "service": "reload", "entity_id": "light.x"},
        {"domain": "light", "service": "toggle", "entity_id": "switch.x"},
        {"domain": "light", "service": "toggle"},
    ]
    for body in bad:
        assert (await client.post("/api/service", json=body)).status == 400


async def test_index_served(client):
    r = await client.get("/")
    assert r.status == 200 and "3D Floorplan" in await r.text()


async def test_service_data_validation(client, monkeypatch):
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    bad = [
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"brightness_pct": 150}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"evil": 1}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"position": 5}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"rgb_color": [300, 0, 0]}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"rgb_color": [1, 2]}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"color_temp_kelvin": 100}},
        {"domain": "cover", "service": "turn_on", "entity_id": "cover.x", "data": {"rgb_color": [1, 2, 3]}},
        {"domain": "cover", "service": "set_cover_position", "entity_id": "cover.x"},
        {"domain": "cover", "service": "set_cover_position", "entity_id": "cover.x", "data": {"position": True}},
    ]
    for body in bad:
        assert (await client.post("/api/service", json=body)).status == 400


async def test_climate_service_validation(client, monkeypatch):
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    bad = [
        {"domain": "climate", "service": "set_temperature", "entity_id": "climate.x"},
        {"domain": "climate", "service": "set_temperature", "entity_id": "climate.x", "data": {"temperature": 100}},
        {"domain": "climate", "service": "set_temperature", "entity_id": "climate.x", "data": {"temperature": True}},
        {"domain": "climate", "service": "set_temperature", "entity_id": "climate.x", "data": {"temperature": "21"}},
        {"domain": "climate", "service": "set_hvac_mode", "entity_id": "climate.x"},
        {"domain": "climate", "service": "set_hvac_mode", "entity_id": "climate.x", "data": {"hvac_mode": "explode"}},
        {"domain": "light", "service": "set_temperature", "entity_id": "light.x", "data": {"temperature": 20}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"temperature": 20}},
        {"domain": "light", "service": "set_hvac_mode", "entity_id": "light.x", "data": {"hvac_mode": "heat"}},
    ]
    for body in bad:
        assert (await client.post("/api/service", json=body)).status == 400, body


def test_slim_state_climate_fields():
    st = {"entity_id": "climate.wohnzimmer", "state": "heat", "attributes": {
        "friendly_name": "Wohnzimmer", "current_temperature": 20.5, "temperature": 21, "hvac_action": "heating",
        "min_temp": 7, "max_temp": 30, "target_temp_step": 0.5, "hvac_modes": ["off", "heat", {"x": 1}]}}
    s = server.slim_state(st)
    assert s["hvac"] == "heating" and s["tt"] == 21 and s["tmin"] == 7 and s["tmax"] == 30 and s["tstep"] == 0.5
    assert s["modes"] == ["off", "heat"] and s["ct"] == 20.5
    lamp = server.slim_state({"entity_id": "light.x", "state": "on", "attributes": {"temperature": 5}})
    assert "hvac" not in lamp and "tt" not in lamp          # only thermostats carry the heating fields


async def test_settings_look_and_stops(client):
    r = await client.put("/api/settings", json={
        "wallOpacity": 5, "glowRadius": 0.01, "bgTop": "#ABCDEF", "bgBottom": "red",
        "tempStops": [{"v": 25, "c": "#ff0000"}, {"v": 10, "c": "#0000ff"}, {"v": "x", "c": "#000000"}],
        "humidStops": [{"v": 1, "c": "#ffffff"}],
    })
    s = await r.json()
    assert s["wallOpacity"] == 1.0 and s["glowRadius"] == 0.5
    assert s["bgTop"] == "#abcdef" and s["bgBottom"] == "#031547"
    assert [x["v"] for x in s["tempStops"]] == [10.0, 25.0]
    assert len(s["humidStops"]) == 4            # too few valid stops -> defaults


async def test_settings_co2_labels_and_floors_below(client):
    s = await (await client.get("/api/settings")).json()
    assert [x["v"] for x in s["co2Stops"]] == [400.0, 800.0, 1200.0, 2000.0]
    assert s["labelMode"] == "important" and s["belowMode"] == "dim"
    r = await client.put("/api/settings", json={"labelMode": "all", "belowMode": "hidden",
                                                 "co2Stops": [{"v": 500, "c": "#00ff00"}, {"v": 1500, "c": "#ff0000"}]})
    s = await r.json()
    assert s["labelMode"] == "all" and s["belowMode"] == "hidden"
    assert [x["v"] for x in s["co2Stops"]] == [500.0, 1500.0]
    s = await (await client.put("/api/settings", json={"labelMode": "bogus", "belowMode": "bogus"})).json()
    assert s["labelMode"] == "important" and s["belowMode"] == "dim"       # unknown values fall back


async def test_settings_old_show_labels_off_becomes_label_mode_none(client):
    s = await (await client.put("/api/settings", json={"showLabels": False})).json()
    assert s["labelMode"] == "none"
    assert "showLabels" not in s


async def test_camera_image_is_checked_before_anything_is_asked(client, monkeypatch):
    assert (await client.get("/api/camera/light.kueche")).status == 400          # only cameras
    assert (await client.get("/api/camera/camera.../x")).status in (400, 404)
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "")
    assert (await client.get("/api/camera/camera.flur")).status == 503           # no Home Assistant behind it
    await client.put("/api/settings", json={"cameraImages": False})
    assert (await client.get("/api/camera/camera.flur")).status == 403           # switched off in the settings


async def test_editors_permissions(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["Admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    server._admin_cache.update(at=float("-inf"), ids=None)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    layout = {"version": 1, "floors": []}
    tablet, admin = {"X-Remote-User-Name": "tablet_wz"}, {"X-Remote-User-Name": "admin"}
    assert (await client.put("/api/layout", json=layout, headers=tablet)).status == 403
    assert (await client.put("/api/settings", json={"grid": 0.5}, headers=tablet)).status == 403
    assert (await client.put("/api/layout", json=layout)).status == 403                 # no user header at all
    assert (await client.put("/api/layout", json=layout, headers=admin)).status == 200
    assert (await client.get("/api/layout", headers=tablet)).status == 200              # reading is always allowed
    me = await (await client.get("/api/me", headers=tablet)).json()
    assert me["canEdit"] is False and me["user"] == "tablet_wz"
    assert (await (await client.get("/api/me", headers=admin)).json())["canEdit"] is True


async def _no_admins():
    return None


async def test_admins_may_edit_everyone_else_is_read_only(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": []}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)

    async def admins():
        return {"abc123", "admin"}
    monkeypatch.setattr(server, "load_admin_ids", admins)
    layout = {"version": 1, "floors": []}
    by_id, by_name, tablet = {"X-Remote-User-Id": "ABC123"}, {"X-Remote-User-Name": "Admin"}, {"X-Remote-User-Name": "tablet_wz", "X-Remote-User-Id": "zzz"}
    assert (await client.put("/api/layout", json=layout, headers=by_id)).status == 200
    assert (await client.put("/api/layout", json=layout, headers=by_name)).status == 200
    assert (await client.put("/api/layout", json=layout, headers=tablet)).status == 403
    assert (await client.put("/api/layout", json=layout)).status == 403
    assert (await (await client.get("/api/me", headers=tablet)).json())["canEdit"] is False


async def test_unknown_admins_fail_closed_but_editors_still_work(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    layout = {"version": 1, "floors": []}
    assert (await client.put("/api/layout", json=layout, headers={"X-Remote-User-Name": "admin"})).status == 200
    assert (await client.put("/api/layout", json=layout, headers={"X-Remote-User-Name": "other"})).status == 403


async def test_room_mapping(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    admin = {"X-Remote-User-Name": "admin"}
    r = await client.put("/api/settings", json={"userRooms": {"Tablet_WZ": "Wohnzimmer", "x": 5}}, headers=admin)
    assert (await r.json())["userRooms"] == {"Tablet_WZ": "Wohnzimmer"}
    me = await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet_wz"})).json()
    assert me["room"] == "Wohnzimmer" and me["canEdit"] is False
    assert (await (await client.get("/api/me", headers=admin)).json())["room"] is None


async def test_load_admin_ids_via_websocket(aiohttp_server, monkeypatch):
    from aiohttp import web

    async def ws_handler(request):
        ws = web.WebSocketResponse(); await ws.prepare(request)
        await ws.send_json({"type": "auth_required"})
        auth = await ws.receive_json()
        assert auth["access_token"] == "tok"
        await ws.send_json({"type": "auth_ok"})
        msg = await ws.receive_json()
        assert msg["type"] == "config/auth/list"
        await ws.send_json({"id": msg["id"], "type": "result", "success": True, "result": [
            {"id": "AAA", "username": "Admin", "group_ids": ["system-admin"], "is_owner": False},
            {"id": "bbb", "username": "tablet", "group_ids": ["system-users"], "is_owner": False},
            {"id": "ccc", "username": "owner", "group_ids": [], "is_owner": True}]})
        await ws.close(); return ws
    app = web.Application(); app.add_routes([web.get("/websocket", ws_handler)])
    srv = await aiohttp_server(app)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "tok")
    server._admin_cache.update(at=float("-inf"), ids=None)
    ids = await server.load_admin_ids()
    assert ids == {"aaa", "admin", "ccc", "owner"}


async def test_load_admin_ids_unreachable_is_none(monkeypatch):
    monkeypatch.setattr(server, "HA_API", "http://localhost:9")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "tok")
    server._admin_cache.update(at=float("-inf"), ids=None)
    assert await server.load_admin_ids() is None


async def test_user_views_validation_and_me_view(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    admin = {"X-Remote-User-Name": "admin"}
    r = await client.put("/api/settings", json={"userViews": {"tablet_wz": "split", "kid": "hologram", "x": 5}}, headers=admin)
    assert (await r.json())["userViews"] == {"tablet_wz": "split"}
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet_wz"})).json())["view"] == "split"
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "someone"})).json())["view"] == "3d"


async def test_users_endpoint_editors_only(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    server._admin_cache["users"] = [{"username": "admin", "name": "Admin", "admin": True}]
    assert (await client.get("/api/users", headers={"X-Remote-User-Name": "tablet"})).status == 403
    us = await (await client.get("/api/users", headers={"X-Remote-User-Name": "admin"})).json()
    assert us == [{"username": "admin", "name": "Admin", "admin": True}]
    server._admin_cache["users"] = []


async def test_light_effect_is_whitelisted(client, monkeypatch, aiohttp_server):
    from aiohttp import web
    seen = []

    async def svc(request):
        seen.append(await request.json()); return web.json_response([])
    app = web.Application(); app.add_routes([web.post("/services/{d}/{s}", svc)])
    srv = await aiohttp_server(app)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    ok = await client.post("/api/service", json={"domain": "light", "service": "turn_on", "entity_id": "light.a", "data": {"effect": "Nordlicht"}})
    assert ok.status == 200 and seen[0]["effect"] == "Nordlicht"
    bad = await client.post("/api/service", json={"domain": "switch", "service": "turn_on", "entity_id": "switch.a", "data": {"effect": "x"}})
    assert bad.status == 400
    bad2 = await client.post("/api/service", json={"domain": "light", "service": "turn_on", "entity_id": "light.a", "data": {"effect": 5}})
    assert bad2.status == 400


# ---------- background images ----------
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
WEBP = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 16


async def test_background_upload_get_delete(client):
    from aiohttp import FormData
    for data, ctype in ((PNG, "image/png"), (JPG, "image/jpeg"), (WEBP, "image/webp")):
        fd = FormData(); fd.add_field("file", data, filename="plan.whatever")
        r = await client.post("/api/backgrounds", data=fd)
        assert r.status == 201
        name = (await r.json())["name"]
        assert server.BG_NAME.match(name)
        g = await client.get(f"/api/backgrounds/{name}")
        assert g.status == 200 and g.headers["Content-Type"].startswith(ctype) and await g.read() == data
        assert (await client.delete(f"/api/backgrounds/{name}")).status == 200
        assert (await client.get(f"/api/backgrounds/{name}")).status == 404


async def test_background_validation_and_traversal(client):
    from aiohttp import FormData
    fd = FormData(); fd.add_field("file", b"<svg onload=alert(1)></svg>", filename="x.png")
    assert (await client.post("/api/backgrounds", data=fd)).status == 400       # SVG / not an image
    fd = FormData(); fd.add_field("file", PNG + b"0" * (server.MAX_BG_BYTES + 1), filename="big.png")
    assert (await client.post("/api/backgrounds", data=fd)).status == 413
    assert (await client.get("/api/backgrounds/..%2Flayout.json")).status == 404
    assert (await client.get("/api/backgrounds/aaaaaaaaaaaa.png")).status == 404
    assert (await client.delete("/api/backgrounds/..%2Fsettings.json")).status == 404


async def test_background_upload_needs_editor(client, monkeypatch, tmp_path):
    from aiohttp import FormData
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    fd = FormData(); fd.add_field("file", PNG, filename="a.png")
    assert (await client.post("/api/backgrounds", data=fd, headers={"X-Remote-User-Name": "tablet"})).status == 403
    fd = FormData(); fd.add_field("file", PNG, filename="a.png")
    r = await client.post("/api/backgrounds", data=fd, headers={"X-Remote-User-Name": "admin"})
    assert r.status == 201
    name = (await r.json())["name"]
    assert (await client.delete(f"/api/backgrounds/{name}", headers={"X-Remote-User-Name": "tablet"})).status == 403


async def test_houses_create_rename_delete(client):
    hs = await (await client.get("/api/houses")).json()
    assert len(hs) == 1 and hs[0]["id"] == "main"
    # the original plan stays the first house
    layout = {"version": 1, "floors": [{"id": "a", "name": "Mein Haus EG", "walls": [], "rooms": [], "devices": []}]}
    assert (await client.put("/api/layout", json=layout)).status == 200
    r = await client.post("/api/houses", json={"name": "Eltern"})
    assert r.status == 200
    hid = (await r.json())["id"]
    other = await (await client.get(f"/api/layout?house={hid}")).json()
    assert other["floors"][0]["name"] == "Erdgeschoss"                                  # new house starts empty
    other["floors"][0]["name"] = "Eltern EG"
    assert (await client.put(f"/api/layout?house={hid}", json=other)).status == 200
    assert (await (await client.get("/api/layout")).json()) == layout                    # the other house is untouched
    assert (await (await client.get(f"/api/layout?house={hid}")).json())["floors"][0]["name"] == "Eltern EG"
    assert (await client.patch(f"/api/houses/{hid}", json={"name": "Bei den Eltern"})).status == 200
    assert {h["name"] for h in await (await client.get("/api/houses")).json()} == {"Haus", "Bei den Eltern"}
    cp = await (await client.post("/api/houses", json={"name": "Kopie", "copyFrom": hid})).json()
    assert (await (await client.get(f"/api/layout?house={cp['id']}")).json())["floors"][0]["name"] == "Eltern EG"
    assert (await client.get("/api/layout?house=nope")).status == 404
    assert (await client.delete(f"/api/houses/{hid}")).status == 200
    assert (await client.get(f"/api/layout?house={hid}")).status == 404
    assert (await client.post("/api/houses", json={"name": " "})).status == 400


async def test_houses_cannot_delete_last(client):
    assert (await client.delete("/api/houses/main")).status == 400


async def test_houses_need_editor(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["Admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    server._admin_cache.update(at=float("-inf"), ids=None)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    tablet = {"X-Remote-User-Name": "tablet_wz"}
    assert (await client.post("/api/houses", json={"name": "X"}, headers=tablet)).status == 403
    assert (await client.delete("/api/houses/main", headers=tablet)).status == 403


async def test_backup_roundtrip(client):
    import base64
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 32
    layout = {"version": 1, "floors": [{"id": "a", "name": "Mein EG", "walls": [], "rooms": [], "devices": []}]}
    assert (await client.put("/api/layout", json=layout)).status == 200
    hid = (await (await client.post("/api/houses", json={"name": "Eltern"})).json())["id"]
    import aiohttp
    fd = aiohttp.FormData(); fd.add_field("file", png, filename="a.png")
    bg = (await (await client.post("/api/backgrounds", data=fd)).json())["name"]
    r = await client.get("/api/backup")
    assert r.status == 200 and "attachment" in r.headers["Content-Disposition"]
    backup = await r.json()
    assert backup["format"] == "floorplan3d-backup" and len(backup["houses"]) == 2 and bg in backup["backgrounds"]
    # wreck the data, then restore
    assert (await client.delete(f"/api/houses/{hid}")).status == 200
    assert (await client.delete(f"/api/backgrounds/{bg}")).status == 200
    assert (await client.put("/api/layout", json={"version": 1, "floors": []})).status == 200
    r = await client.post("/api/backup", json=backup)
    assert r.status == 200 and (await r.json())["houses"] == 2
    assert {h["name"] for h in await (await client.get("/api/houses")).json()} == {"Haus", "Eltern"}
    assert (await (await client.get("/api/layout")).json()) == layout
    assert (await client.get(f"/api/backgrounds/{bg}")).status == 200


async def test_backup_rejects_bad_input(client):
    assert (await client.post("/api/backup", json={"format": "x"})).status == 400
    bad = {"format": "floorplan3d-backup", "houses": [{"id": "main", "name": "H", "layout": {"floors": []}}], "backgrounds": {"../../etc.png": "AAAA"}}
    assert (await client.post("/api/backup", json=bad)).status == 400
    bad["backgrounds"] = {}
    bad["models"] = {"evil.glb": "AAAA"}
    assert (await client.post("/api/backup", json=bad)).status == 400


async def test_settings_stale_write_rejected_and_backup(client):
    r = await client.get("/api/settings")
    etag = r.headers["ETag"]
    body = await r.json()
    body["userRooms"] = {"tablet": "WZFL"}
    r = await client.put("/api/settings", json=body, headers={"If-Match": etag})
    assert r.status == 200
    new_etag = r.headers["ETag"]
    # a browser that still has the old state must not overwrite the newer settings
    stale = await client.put("/api/settings", json={"userRooms": {}}, headers={"If-Match": etag})
    assert stale.status == 409
    assert (await (await client.get("/api/settings")).json())["userRooms"] == {"tablet": "WZFL"}
    ok = await client.put("/api/settings", json=body | {"userViews": {"tablet": "2d"}}, headers={"If-Match": new_etag})
    assert ok.status == 200


async def test_settings_restored_from_backup_when_file_damaged(client, tmp_path):
    body = await (await client.get("/api/settings")).json()
    body["userRooms"] = {"tablet": "WZFL"}
    assert (await client.put("/api/settings", json=body)).status == 200
    for p in tmp_path.rglob("settings.json"):
        p.write_text("{ broken")
    assert (await (await client.get("/api/settings")).json())["userRooms"] == {"tablet": "WZFL"}


def test_addon_changelog_is_current():
    """Home Assistant shows floorplan3d/CHANGELOG.md in the update dialog - it must equal the root changelog."""
    root = Path(__file__).resolve().parent.parent
    assert (root / "floorplan3d" / "CHANGELOG.md").read_text() == (root / "CHANGELOG.md").read_text()


def test_effect_colors_setting_is_kept_and_cleaned():
    out = server.validate_settings({"effectColors": {"Gaming": "#aa50ff", "": "x", "Bad": 5}})
    assert out["effectColors"] == {"Gaming": "#aa50ff"}


async def test_language_setting_accepts_known_codes_only(client):
    for code, expected in (("fr", "fr"), ("auto", "auto"), ("klingon", "auto")):
        r = await client.put("/api/settings", json={"language": code})
        assert r.status == 200
        assert (await (await client.get("/api/settings")).json())["language"] == expected


async def test_background_glow_is_off_by_default_and_clamped(client):
    s = await (await client.get("/api/settings")).json()
    assert s["bgGlowStrength"] == 0
    await client.put("/api/settings", json={"bgGlowStrength": 5})
    assert (await (await client.get("/api/settings")).json())["bgGlowStrength"] == 1.0


async def test_live_channel_without_home_assistant_says_so(client):
    ws = await client.ws_connect("/api/live")
    assert await ws.receive_json() == {"type": "upstream", "ok": False}
    await ws.close()


async def test_live_channel_pushes_state_changes(aiohttp_client, aiohttp_server, monkeypatch, tmp_path):
    import asyncio
    from aiohttp import web
    go = asyncio.Event()

    async def ha_ws(request):
        ws = web.WebSocketResponse(); await ws.prepare(request)
        await ws.send_json({"type": "auth_required"})
        assert (await ws.receive_json())["access_token"] == "tok"
        await ws.send_json({"type": "auth_ok"})
        sub = await ws.receive_json()
        assert sub["type"] == "subscribe_events" and sub["event_type"] == "state_changed"
        await ws.send_json({"id": sub["id"], "type": "result", "success": True, "result": None})
        await go.wait()
        ev = lambda eid, new: {"id": sub["id"], "type": "event", "event": {"event_type": "state_changed", "data": {"entity_id": eid, "new_state": new}}}
        await ws.send_json(ev("light.a", {"entity_id": "light.a", "state": "on", "attributes": {"friendly_name": "A", "brightness": 128, "rgb_color": [255, 0, 0]}}))
        await ws.send_json(ev("light.a", {"entity_id": "light.a", "state": "on", "attributes": {"friendly_name": "A", "brightness": 255}}))   # same entity twice: last one wins
        await ws.send_json(ev("sensor.gone", None))
        await asyncio.sleep(1)
        await ws.close(); return ws
    ha = web.Application(); ha.add_routes([web.get("/websocket", ha_ws)])
    srv = await aiohttp_server(ha)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "tok")
    client = await aiohttp_client(server.make_app(tmp_path))
    ws = await client.ws_connect("/api/live")
    assert await ws.receive_json() == {"type": "upstream", "ok": False}
    assert await asyncio.wait_for(ws.receive_json(), 5) == {"type": "upstream", "ok": True}
    go.set()
    msg = await asyncio.wait_for(ws.receive_json(), 5)
    assert msg["type"] == "states" and msg["removed"] == ["sensor.gone"]
    assert [(e["entity_id"], e["state"], e["brightness"], e["rgb"]) for e in msg["list"]] == [("light.a", "on", 100, None)]
    assert await asyncio.wait_for(ws.receive_json(), 5) == {"type": "upstream", "ok": False}   # HA went away: browsers poll again
    await ws.close()


async def test_earth_setting_accepts_known_modes_only(client):
    s = await (await client.get("/api/settings")).json()
    assert s["earth"] == "solid"
    for mode in ("off", "glass", "solid"):
        assert (await (await client.put("/api/settings", json={**s, "earth": mode})).json())["earth"] == mode
        s = await (await client.get("/api/settings")).json()
    assert (await (await client.put("/api/settings", json={**s, "earth": "mud"})).json())["earth"] == "solid"


async def test_earth_margin_is_a_clamped_length(client):
    s = await (await client.get("/api/settings")).json()
    assert s["earthMargin"] == 5.0
    assert (await (await client.put("/api/settings", json={**s, "earthMargin": 12})).json())["earthMargin"] == 12.0
    s = await (await client.get("/api/settings")).json()
    assert (await (await client.put("/api/settings", json={**s, "earthMargin": 5000})).json())["earthMargin"] == 100.0


def test_slim_state_says_since_when_an_entity_is_offline():
    st = {"entity_id": "light.a", "state": "unavailable", "last_changed": "2026-10-01T10:00:00+00:00", "attributes": {}}
    assert server.slim_state(st)["since"] == "2026-10-01T10:00:00+00:00"
    assert server.slim_state({**st, "state": "on"})["since"] is None


def test_kiosk_and_alert_settings_are_validated():
    s = server.validate_settings({"idleReturn": 5, "nightDim": "time", "nightFrom": "23:30", "nightTo": "6:00",
                                  "weatherEntity": "weather.home", "alerts": False, "alertJump": True})
    assert s["idleReturn"] == 5.0 and s["nightDim"] == "time" and s["nightFrom"] == "23:30"
    assert s["nightTo"] == "06:00"            # not HH:MM: back to the default
    assert s["weatherEntity"] == "weather.home" and s["alerts"] is False and s["alertJump"] is True
    s = server.validate_settings({"idleReturn": 0, "nightDim": "always", "weatherEntity": "sensor.x", "idleReturn2": 1})
    assert s["idleReturn"] == 0.0 and s["nightDim"] == "off" and s["weatherEntity"] == ""
    assert server.validate_settings({"idleReturn": 999})["idleReturn"] == 240.0


async def test_users_and_tablets_are_mirrored_into_the_config_folder_and_synced_back(client, tmp_path):
    cfg = tmp_path / "addon_config" / "users.json"
    assert (await (await client.get("/api/users-file")).json())["exists"] is False
    await client.put("/api/settings", json={"userRooms": {"tablet_kueche": "Küche"}, "userViews": {"tablet_kueche": "2d", "tv": "bogus"}})
    import json
    assert json.loads(cfg.read_text("utf-8")) == {"version": 1, "userRooms": {"tablet_kueche": "Küche"}, "userViews": {"tablet_kueche": "2d"}}
    st = await (await client.get("/api/users-file")).json()
    assert st["exists"] and st["inSync"] and st["users"] == 1

    # the file in the HA folder is edited / restored: the sync button loads it into the add-on
    cfg.write_text(json.dumps({"userRooms": {"tablet_bad": "Bad"}, "userViews": {"tablet_bad": "3d", "x": "evil"}}), "utf-8")
    assert (await (await client.get("/api/users-file")).json())["inSync"] is False
    s = await (await client.post("/api/users-file/sync", json={})).json()
    assert s["userRooms"] == {"tablet_bad": "Bad"} and s["userViews"] == {"tablet_bad": "3d"} and s["language"]       # other settings stay
    assert (await (await client.get("/api/settings")).json())["userRooms"] == {"tablet_bad": "Bad"}

    # the other way: the add-on state is written into the folder
    await client.put("/api/settings", json={"userRooms": {"a": "Büro"}})
    cfg.unlink()
    assert (await client.post("/api/users-file/sync", json={"direction": "load"})).status == 404
    assert (await client.post("/api/users-file/sync", json={"direction": "save"})).status == 200
    assert json.loads(cfg.read_text("utf-8"))["userRooms"] == {"a": "Büro"}


async def test_fresh_install_gets_users_and_tablets_back_from_the_config_folder(aiohttp_client, tmp_path):
    import json
    (tmp_path / "cfg").mkdir()
    (tmp_path / "cfg" / "users.json").write_text(json.dumps({"userRooms": {"tab": "Flur"}, "userViews": {"tab": "split"}}), "utf-8")
    c = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    s = await (await c.get("/api/settings")).json()
    assert s["userRooms"] == {"tab": "Flur"} and s["userViews"] == {"tab": "split"}


async def test_update_from_an_older_version_creates_users_json_at_startup(aiohttp_client, tmp_path):
    import json
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "settings.json").write_text(json.dumps({"userRooms": {"tab": "WZ"}, "userViews": {"tab": "2d"}}), "utf-8")
    c = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    assert json.loads((tmp_path / "cfg" / "users.json").read_text("utf-8"))["userRooms"] == {"tab": "WZ"}
    st = await (await c.get("/api/users-file")).json()
    assert st["exists"] and st["inSync"]


async def test_startup_never_overwrites_an_existing_users_json(aiohttp_client, tmp_path):
    import json
    (tmp_path / "data").mkdir(); (tmp_path / "cfg").mkdir()
    (tmp_path / "data" / "settings.json").write_text(json.dumps({"userRooms": {"new": "A"}}), "utf-8")
    (tmp_path / "cfg" / "users.json").write_text(json.dumps({"userRooms": {"kept": "B"}}), "utf-8")
    await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    assert json.loads((tmp_path / "cfg" / "users.json").read_text("utf-8"))["userRooms"] == {"kept": "B"}


async def test_language_follows_the_browser_until_somebody_picks_one(aiohttp_client, tmp_path):
    """Settings stored before "auto" was the default (language "de" nobody chose) start with auto; a picked language stays."""
    import json
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "settings.json").write_text(json.dumps({"language": "de", "theme": "dark"}), "utf-8")
    client = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    get = lambda: client.get("/api/settings")
    assert (await (await get()).json())["language"] == "auto"
    r = await client.put("/api/settings", json={"grid": 0.5})                  # saving something else does not count as a choice
    assert r.status == 200 and (await (await get()).json())["language"] == "auto"
    r = await client.put("/api/settings", json={"language": "fr"})
    s = await (await get()).json()
    assert s["language"] == "fr" and s["langChosen"] is True
    r = await client.put("/api/settings", json={"language": "fr", "grid": 0.25})      # the page sends everything it knows: the choice stays
    assert (await (await get()).json())["language"] == "fr"
