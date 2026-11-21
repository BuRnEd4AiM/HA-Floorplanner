"""📡 Matter in the Funk-Karte (5.28.3, matterlinks.py): the best link of each Matter device from Home Assistant's Matter map
(matter/network_topology), for every entity of the device; a Matter server too old for the map, or no Matter at all."""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import matterlinks as ml  # noqa: E402
import renames as rn  # noqa: E402
import server  # noqa: E402

# a Thread lamp with two neighbours (the border router strong, a plug weak), a Thread sensor far out, a Wi-Fi plug at its access point,
# a Thread node Home Assistant does not know, an unavailable one
TOPO = {"collected_at": 1, "nodes": [
    {"id": "n1", "kind": "matter", "network_type": "thread", "node_id": 1, "available": True, "ha_device_id": "lampe"},
    {"id": "n2", "kind": "matter", "network_type": "thread", "node_id": 2, "available": True, "ha_device_id": "sensor"},
    {"id": "n3", "kind": "matter", "network_type": "wifi", "node_id": 3, "available": True, "ha_device_id": "dose"},
    {"id": "n4", "kind": "matter", "network_type": "thread", "node_id": 4, "available": True, "ha_device_id": None},
    {"id": "n5", "kind": "matter", "network_type": "thread", "node_id": 5, "available": False, "ha_device_id": "weg"},
    {"id": "br", "kind": "border_router", "network_type": "thread"}, {"id": "ap", "kind": "wifi_ap", "network_type": "wifi"}],
    "connections": [
    {"source": "n1", "target": "br", "network": "thread", "strength": "strong",
     "source_to_target": {"strength": "strong", "lqi": 3, "rssi": -52}, "target_to_source": {"strength": "medium", "lqi": 2, "rssi": -61}},
    {"source": "n4", "target": "n1", "network": "thread", "strength": "weak", "source_to_target": {"strength": "weak", "rssi": -88}},
    {"source": "n2", "target": "n4", "network": "thread", "strength": "weak", "target_to_source": {"strength": "weak", "lqi": 1, "rssi": -90}},
    {"source": "n3", "target": "ap", "network": "wifi", "strength": "medium", "source_to_target": {"strength": "medium", "rssi": -71}},
    {"source": "n5", "target": "br", "network": "thread", "strength": "strong"},
    {"source": "n2", "target": "br", "network": "thread", "strength": "bogus"}]}


def test_device_links_takes_the_best_link_of_each_device():
    links = ml.device_links(TOPO)
    assert links == {
        "lampe": {"q": "good", "strength": "strong", "network": "thread", "rssi": -52, "lqi": 3},      # the border router, not the weak plug
        "sensor": {"q": "bad", "strength": "weak", "network": "thread", "rssi": -90, "lqi": 1},
        "dose": {"q": "mid", "strength": "medium", "network": "wifi", "rssi": -71, "lqi": None}}
    assert "weg" not in links                                                                       # unavailable: no link now
    assert ml.device_links({}) == {} and ml.device_links(None) == {} and ml.device_links({"nodes": "x", "connections": 5}) == {}


def test_entity_links_points_every_entity_of_the_device_to_it():
    entries = [{"entity_id": "light.lampe", "device_id": "lampe"}, {"entity_id": "sensor.lampe_thread_channel", "device_id": "lampe"},
               {"entity_id": "sensor.temp", "device_id": "sensor_teil"}, {"entity_id": "light.zigbee", "device_id": "z2m"}]
    devices = [{"id": "sensor"}, {"id": "sensor_teil", "parent_device_id": "sensor"}]           # a part of a device (2026.11)
    out = ml.entity_links(ml.device_links(TOPO), entries, devices)
    assert set(out) == {"light.lampe", "sensor.lampe_thread_channel", "sensor.temp"}
    assert out["light.lampe"]["q"] == "good" and out["sensor.temp"]["q"] == "bad"


class Ws:
    """Home Assistant's websocket: answers matter/network_topology (or an error code), the entity and device registry"""
    def __init__(self, topo=None, error=None, entries=()):
        self.topo, self.error, self.entries, self.sent, self.queue = topo, error, list(entries), [], asyncio.Queue()

    async def send_json(self, obj):
        self.sent.append(obj["type"])
        if obj["type"] == "matter/network_topology" and self.error:
            msg = {"id": obj["id"], "type": "result", "success": False, "error": {"code": self.error}}
        else:
            res = {"matter/network_topology": self.topo, "config/entity_registry/list": self.entries, "config/device_registry/list": []}[obj["type"]]
            msg = {"id": obj["id"], "type": "result", "success": True, "result": res}
        await self.queue.put(type("M", (), {"type": 1, "data": json.dumps(msg)})())

    async def receive(self):
        return await self.queue.get()


async def test_fetch_asks_the_map_then_the_registries():
    ws = Ws(TOPO, entries=[{"entity_id": "light.lampe", "device_id": "lampe"}])
    state, links = await ml.fetch(ws, 1)
    assert state == "ok" and list(links) == ["light.lampe"] and links["light.lampe"]["rssi"] == -52
    assert ws.sent == ["matter/network_topology", "config/entity_registry/list", "config/device_registry/list"]


async def test_fetch_without_the_map():
    assert await ml.fetch(Ws(error="not_supported"), 1) == ("old", {})          # the Matter server is too old (schema < 13)
    assert await ml.fetch(Ws(error="unknown_command"), 1) == ("none", {})       # no Matter in this Home Assistant
    ws = Ws({"nodes": [], "connections": []})
    assert await ml.fetch(ws, 1) == ("ok", {}) and ws.sent == ["matter/network_topology"]   # nothing to map: the registry is not asked


def test_matters_wifi_rssi_is_a_signal_also_when_renamed():
    """Matter's "Wi-Fi RSSI" (translation_key wifi_rssi) ships switched off: found by its key, also with another entity id"""
    entries = [{"entity_id": "light.matter_dose", "device_id": "m"},
               {"entity_id": "sensor.dose_empfang", "device_id": "m", "translation_key": "wifi_rssi", "disabled_by": "integration"}]
    assert rn.signals_off(entries) == ["sensor.dose_empfang"]
    assert rn.signal_off_of(entries, None, {}) == {"light.matter_dose": "sensor.dose_empfang"}
    entries[1] = {**entries[1], "disabled_by": None}                     # switched on, no value yet
    assert rn.signal_of(entries, [])["light.matter_dose"] == "sensor.dose_empfang"


async def test_get_signals_hands_out_the_matter_links(aiohttp_client, aiohttp_server, tmp_path, monkeypatch):
    from aiohttp import web
    asked = []

    async def ws(request):
        w = web.WebSocketResponse(); await w.prepare(request)
        await w.send_json({"type": "auth_required"})
        await w.receive_json()
        await w.send_json({"type": "auth_ok"})
        async for msg in w:
            m = json.loads(msg.data)
            asked.append(m["type"])
            res = {"matter/network_topology": TOPO, "config/entity_registry/list": [{"entity_id": "light.lampe", "device_id": "lampe"}],
                   "config/device_registry/list": []}[m["type"]]
            await w.send_json({"id": m["id"], "type": "result", "success": True, "result": res})
        return w
    fake = web.Application()
    fake.router.add_get("/websocket", ws)
    srv = await aiohttp_server(fake)
    client = await aiohttp_client(server.make_app(tmp_path))
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    sg = await (await client.get("/api/signals")).json()
    assert sg["matter"] == "ok" and sg["links"]["light.lampe"] == {"q": "good", "strength": "strong", "network": "thread", "rssi": -52, "lqi": 3}
    n = len(asked)
    assert (await (await client.get("/api/signals")).json())["links"] == sg["links"] and len(asked) == n   # asked again only after 5 minutes
