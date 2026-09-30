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
    assert s["language"] == "de" and s["grid"] == 0.25

    r = await client.put("/api/settings", json={"language": "en", "grid": 0.5, "theme": "neon", "evil": 1, "shadows": "yes"})
    s = await r.json()
    assert s["language"] == "en"
    assert s["grid"] == 0.5
    assert s["theme"] == "holo"       # invalid value falls back to the default
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

    assert len(await (await client.get("/api/models")).json()) == 2
    r = await client.get(f"/api/models/{name}")
    assert r.status == 200 and (await r.read()).startswith(b"glTF")
    assert (await client.delete(f"/api/models/{name}")).status == 200
    assert (await client.get(f"/api/models/{name}")).status == 404


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


async def test_editors_permissions(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["Florian"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    server._admin_cache.update(at=0.0, ids=None)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    layout = {"version": 1, "floors": []}
    tablet, admin = {"X-Remote-User-Name": "tablet_wz"}, {"X-Remote-User-Name": "florian"}
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
        return {"abc123", "florian"}
    monkeypatch.setattr(server, "load_admin_ids", admins)
    layout = {"version": 1, "floors": []}
    by_id, by_name, tablet = {"X-Remote-User-Id": "ABC123"}, {"X-Remote-User-Name": "Florian"}, {"X-Remote-User-Name": "tablet_wz", "X-Remote-User-Id": "zzz"}
    assert (await client.put("/api/layout", json=layout, headers=by_id)).status == 200
    assert (await client.put("/api/layout", json=layout, headers=by_name)).status == 200
    assert (await client.put("/api/layout", json=layout, headers=tablet)).status == 403
    assert (await client.put("/api/layout", json=layout)).status == 403
    assert (await (await client.get("/api/me", headers=tablet)).json())["canEdit"] is False


async def test_unknown_admins_fail_closed_but_editors_still_work(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["florian"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    layout = {"version": 1, "floors": []}
    assert (await client.put("/api/layout", json=layout, headers={"X-Remote-User-Name": "florian"})).status == 200
    assert (await client.put("/api/layout", json=layout, headers={"X-Remote-User-Name": "other"})).status == 403


async def test_room_mapping(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["florian"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    admin = {"X-Remote-User-Name": "florian"}
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
            {"id": "AAA", "username": "Florian", "group_ids": ["system-admin"], "is_owner": False},
            {"id": "bbb", "username": "tablet", "group_ids": ["system-users"], "is_owner": False},
            {"id": "ccc", "username": "owner", "group_ids": [], "is_owner": True}]})
        await ws.close(); return ws
    app = web.Application(); app.add_routes([web.get("/websocket", ws_handler)])
    srv = await aiohttp_server(app)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "tok")
    server._admin_cache.update(at=0.0, ids=None)
    ids = await server.load_admin_ids()
    assert ids == {"aaa", "florian", "ccc", "owner"}


async def test_load_admin_ids_unreachable_is_none(monkeypatch):
    monkeypatch.setattr(server, "HA_API", "http://localhost:9")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "tok")
    server._admin_cache.update(at=0.0, ids=None)
    assert await server.load_admin_ids() is None


async def test_user_views_validation_and_me_view(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["florian"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    admin = {"X-Remote-User-Name": "florian"}
    r = await client.put("/api/settings", json={"userViews": {"tablet_wz": "split", "kid": "hologram", "x": 5}}, headers=admin)
    assert (await r.json())["userViews"] == {"tablet_wz": "split"}
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet_wz"})).json())["view"] == "split"
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "someone"})).json())["view"] == "3d"


async def test_users_endpoint_editors_only(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["florian"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    server._admin_cache["users"] = [{"username": "florian", "name": "Florian", "admin": True}]
    assert (await client.get("/api/users", headers={"X-Remote-User-Name": "tablet"})).status == 403
    us = await (await client.get("/api/users", headers={"X-Remote-User-Name": "florian"})).json()
    assert us == [{"username": "florian", "name": "Florian", "admin": True}]
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
