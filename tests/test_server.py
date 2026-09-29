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
        {"domain": "cover", "service": "set_cover_position", "entity_id": "cover.x"},
        {"domain": "cover", "service": "set_cover_position", "entity_id": "cover.x", "data": {"position": True}},
    ]
    for body in bad:
        assert (await client.post("/api/service", json=body)).status == 400
