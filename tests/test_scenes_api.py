"""The scene editor's addresses (#549) against a stand-in Home Assistant: a new scene is written as fp3d_…, read back, changed (the old one
kept), tried without saving, deleted; only editors save. Since #564 one made in Home Assistant is changed in place (what the editor cannot
show stays) and deleted, each time after a backup, and "↶ Wiederherstellen" writes it back; so are automations made in Home Assistant
(never the add-on's own, never one that is not in Home Assistant's editor)."""
import json
import re
import sys
from pathlib import Path

import pytest
from aiohttp import web

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import server  # noqa: E402


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path))


async def test_scenes_are_written_only_when_ours(client, monkeypatch, aiohttp_server, tmp_path):
    scenes = {"1700000000": {"id": "1700000000", "name": "Abend", "entities": {"light.wz": {"state": "on", "brightness": 128},
                                                                               "media_player.tv": {"state": "on", "source": "HDMI 1"}}}}
    autos = {"1600000000": {"id": "1600000000", "alias": "Flurlicht", "triggers": [], "actions": []}}
    states = {"scene.abend": {"entity_id": "scene.abend", "state": "unknown", "attributes": {"id": "1700000000", "friendly_name": "Abend"}}}
    asked, applied = [], []

    async def ws(request):
        w = web.WebSocketResponse(); await w.prepare(request)
        await w.send_json({"type": "auth_required"}); await w.receive_json(); await w.send_json({"type": "auth_ok"})
        async for msg in w:
            m = json.loads(msg.data)
            await w.send_json({"id": m["id"], "type": "result", "success": True, "result": list(states.values()) if m["type"] == "get_states" else None})
        return w

    async def config(request):
        cid = request.match_info["id"]
        asked.append((request.method, cid))
        if request.method == "GET":
            return web.json_response(scenes[cid]) if cid in scenes else web.json_response({"message": "Resource not found"}, status=404)
        if request.method == "DELETE":
            scenes.pop(cid, None)
            return web.json_response({"result": "ok"})
        scenes[cid] = await request.json()
        e = "scene." + re.sub(r"[^a-z0-9]+", "_", scenes[cid]["name"].lower()).strip("_")
        states[e] = {"entity_id": e, "state": "unknown", "attributes": {"id": cid, "friendly_name": scenes[cid]["name"]}}
        return web.json_response({"result": "ok"})

    async def auto_config(request):
        cid = request.match_info["id"]
        asked.append((request.method, cid))
        if request.method == "GET":
            return web.json_response(autos[cid]) if cid in autos else web.json_response({"message": "Resource not found"}, status=404)
        if request.method == "DELETE":
            autos.pop(cid, None)
            return web.json_response({"result": "ok"})
        autos[cid] = await request.json()
        return web.json_response({"result": "ok"})

    async def apply(request):
        applied.append(await request.json())
        return web.json_response([])
    fake = web.Application()
    fake.router.add_get("/websocket", ws)
    fake.router.add_route("*", "/config/scene/config/{id}", config)
    fake.router.add_route("*", "/config/automation/config/{id}", auto_config)
    fake.router.add_post("/services/scene/apply", apply)
    srv = await aiohttp_server(fake)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    editor = {"ok": True}

    async def can_edit(request):
        return editor["ok"]
    monkeypatch.setattr(server, "can_edit", can_edit)
    kino = {"name": "Kino", "ents": {"light.led": {"on": True, "pct": 30, "rgb": [120, 0, 255], "fx": "Rainbow"}, "cover.wz": {"pos": 20}}}
    r = await (await client.put("/api/scenes/new", json=kino)).json()
    cid = r["id"]
    assert r["ok"] and cid.startswith("fp3d_s") and r["entity"] == "scene.kino" and not r["missing"]
    assert scenes[cid]["entities"]["light.led"] == {"state": "on", "brightness": 76, "color_mode": "rgb", "rgb_color": [120, 0, 255], "effect": "Rainbow"}
    back = await (await client.get(f"/api/scenes/{cid}")).json()
    assert back["ours"] and back["scene"]["ents"]["cover.wz"] == {"on": True, "pos": 20}
    assert (await (await client.put(f"/api/scenes/{cid}", json={**kino, "name": "Kino 2"})).json())["ok"] and scenes[cid]["name"] == "Kino 2"
    assert any('"Kino"' in p.read_text() for p in (tmp_path / "ha-backup").glob("*-scene-*.json"))     # the old one kept
    other = await (await client.get("/api/scenes/1700000000")).json()
    assert other["ours"] is False and other["scene"]["ents"]["light.wz"] == {"on": True, "pct": 50} and other["kept"] == 1
    # #564: one made in Home Assistant changed in place: the TV the editor cannot show stays, the old version is kept first
    changed = {**other["scene"], "ents": {**other["scene"]["ents"], "switch.kaffee": {"on": True}}}
    r = await (await client.put("/api/scenes/1700000000", json=changed)).json()
    assert r["ok"] and r["id"] == "1700000000" and scenes["1700000000"]["entities"] == {
        "light.wz": {"state": "on", "brightness": 128}, "media_player.tv": {"state": "on", "source": "HDMI 1"}, "switch.kaffee": {"state": "on"}}
    assert any("HDMI 1" in p.read_text() and "kaffee" not in p.read_text() for p in (tmp_path / "ha-backup").glob("*-scene-1700000000.json"))
    # deleted, then "↶ Wiederherstellen" writes the newest backup back
    assert (await (await client.delete("/api/scenes/1700000000")).json())["ok"] and "1700000000" not in scenes
    assert (await (await client.post("/api/ha-restore", json={"kind": "scene", "id": "1700000000"})).json())["ok"]
    assert "switch.kaffee" in scenes["1700000000"]["entities"] and scenes["1700000000"]["name"] == "Abend"
    # a scene that is not in Home Assistant's editor (its own YAML file) is never written anew or deleted
    assert (await client.put("/api/scenes/1500000000", json=kino)).status == 404 and (await client.delete("/api/scenes/1500000000")).status == 404
    assert not any(a[0] != "GET" and a[1] == "1500000000" for a in asked)
    # automations: one made in Home Assistant deleted (backup first) and restored; the add-on's own and bad ids are refused
    assert (await (await client.delete("/api/automations/1600000000")).json())["ok"] and not autos
    assert list((tmp_path / "ha-backup").glob("*-automation-1600000000.json"))
    assert (await (await client.post("/api/ha-restore", json={"kind": "automation", "id": "1600000000"})).json())["ok"] and autos["1600000000"]["alias"] == "Flurlicht"
    assert (await client.delete("/api/automations/fp3d_abc_l1")).status == 403 and (await client.delete("/api/automations/x.y")).status in (400, 404)
    assert (await client.delete("/api/automations/1400000000")).status == 404                          # not in the editor
    assert (await client.post("/api/ha-restore", json={"kind": "automation", "id": "fp3d_abc_l1"})).status == 400
    assert (await client.post("/api/ha-restore", json={"kind": "script", "id": "1600000000"})).status == 400
    assert (await client.post("/api/ha-restore", json={"kind": "scene", "id": "1300000000"})).status == 404  # nothing kept of it
    assert (await client.put("/api/scenes/new", json={"name": "", "ents": {}})).status == 400
    assert (await (await client.post("/api/scenes/try", json=kino)).json())["ok"] and applied[-1]["entities"]["cover.wz"]["current_position"] == 20
    assert (await (await client.delete(f"/api/scenes/{cid}")).json())["ok"] and cid not in scenes
    editor["ok"] = False
    assert (await client.put("/api/scenes/new", json=kino)).status == 403 and (await client.get(f"/api/scenes/{cid}")).status == 403
    assert (await client.delete("/api/scenes/1700000000")).status == 403 and (await client.delete("/api/automations/1600000000")).status == 403
    assert (await client.post("/api/ha-restore", json={"kind": "scene", "id": "1700000000"})).status == 403
    monkeypatch.setattr(server, "user_locks", lambda request: {"control"})
    assert (await client.post("/api/scenes/try", json=kino)).status == 403
