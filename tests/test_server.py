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
    for code, expected in (("fr", "fr"), ("auto", "auto"), ("klingon", "de")):
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
