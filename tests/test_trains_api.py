"""🚆 api/train (#550) against a stand-in of the departures service and of Home Assistant: a station's departures, asked once a minute
for every screen together, an unknown station, a sensor of DB Infoscreen."""
import json
import sys
from pathlib import Path

import pytest
from aiohttp import web

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import server  # noqa: E402


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path))


async def test_departures_of_a_station_and_of_a_sensor(client, monkeypatch, aiohttp_server):
    asked = []

    async def dbf(request):
        asked.append((request.match_info["station"], dict(request.query)))
        if request.match_info["station"] == "Nirgendwo":
            return web.json_response({"error": "Unknown station 'Nirgendwo'"}, status=300)
        return web.json_response({"departures": [{"scheduledDeparture": "07:12", "delayDeparture": 5, "platform": "4", "scheduledPlatform": "3",
                                                  "train": "RE 4711", "destination": "Frankfurt"}]})

    async def state(request):
        return web.json_response({"entity_id": "sensor.fulda", "state": "07:20", "attributes": {"next_departures": [
            {"scheduledDeparture": "07:20", "train": "ICE 1576", "destination": "Hamburg", "isCancelled": True}]}})
    fake = web.Application()
    fake.router.add_get("/dbf/{station}.json", dbf)
    fake.router.add_get("/states/{e}", state)
    srv = await aiohttp_server(fake)
    monkeypatch.setattr(server, "DBF_URL", f"http://localhost:{srv.port}/dbf")
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    server._TRAINS.clear()
    r = await (await client.get("/api/train?station=Fulda%20Test&via=Hanau")).json()
    assert r["rows"][0]["train"] == "RE 4711" and r["rows"][0]["planned"] == "3" and r["source"] == "dbf" and r["error"] == ""
    await client.get("/api/train?station=fulda%20test&via=hanau")                 # another screen a moment later: no second question
    assert asked == [("Fulda Test", {"via": "Hanau"})]
    bad = await (await client.get("/api/train?station=Nirgendwo")).json()
    assert bad["rows"] == [] and "Unknown station" in bad["error"]
    s = await (await client.get("/api/train?sensor=sensor.fulda")).json()
    assert s["source"] == "sensor" and s["rows"][0]["cancelled"] is True
    assert (await client.get("/api/train")).status == 400 and (await client.get("/api/train?sensor=light.x")).status == 400
    assert json.dumps(r)                                                       # plain JSON for the page
    mine = await (await client.get("/api/train?station=Fulda%20Test&via=Hanau&mine=07:10")).json()     # "mein Zug": remembered for later
    assert mine["seen"] == {"at": "07:12", "train": "RE 4711", "dest": "Frankfurt", "platform": "3", "t": mine["seen"]["t"]} and len(asked) == 2
    assert json.loads((client.server.app[server.KEY_DATA] / "trains-seen.json").read_text())["fulda test|hanau|07:10"]["train"] == "RE 4711"
    later = await (await client.get("/api/train?station=Fulda%20Test&via=Hanau&mine=05:00")).json()    # not listed (tomorrow morning)
    assert later["seen"] is None and "seen" not in r
    s2 = await (await client.get("/api/train?sensor=sensor.fulda&mine=07:20")).json()
    assert s2["seen"]["train"] == "ICE 1576"
