"""The scene editor's addresses (#549) against a stand-in Home Assistant: a new scene is written as fp3d_…, read back, changed (the old one
kept), tried without saving, deleted; another scene is only read (to copy), never written or deleted; only editors save."""
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
    scenes = {"1700000000": {"id": "1700000000", "name": "Abend", "entities": {"light.wz": {"state": "on", "brightness": 128}}}}
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

    async def apply(request):
        applied.append(await request.json())
        return web.json_response([])
    fake = web.Application()
    fake.router.add_get("/websocket", ws)
    fake.router.add_route("*", "/config/scene/config/{id}", config)
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
    assert other["ours"] is False and other["scene"]["ents"]["light.wz"] == {"on": True, "pct": 50}       # to copy
    assert (await client.put("/api/scenes/1700000000", json=kino)).status == 403
    assert (await client.delete("/api/scenes/1700000000")).status == 403
    assert not any(a[0] != "GET" and a[1] == "1700000000" for a in asked)                               # never written or deleted
    assert (await client.put("/api/scenes/new", json={"name": "", "ents": {}})).status == 400
    assert (await (await client.post("/api/scenes/try", json=kino)).json())["ok"] and applied[-1]["entities"]["cover.wz"]["current_position"] == 20
    assert (await (await client.delete(f"/api/scenes/{cid}")).json())["ok"] and cid not in scenes
    editor["ok"] = False
    assert (await client.put("/api/scenes/new", json=kino)).status == 403 and (await client.get(f"/api/scenes/{cid}")).status == 403
    monkeypatch.setattr(server, "user_locks", lambda request: {"control"})
    assert (await client.post("/api/scenes/try", json=kino)).status == 403
