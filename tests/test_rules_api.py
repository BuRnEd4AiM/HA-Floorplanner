"""The add-on's heating rules and routines over its API (#546): reading, saving (only editors, every value cleaned), the wishes of a page
(boost, "Trotzdem heizen", a routine's button, "Jetzt ausprobieren"), who uses a device without Home Assistant, the backup."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import server  # noqa: E402

FLOWS = [{"id": "f_kino", "name": "Kino", "lanes": [{"id": "l1", "blocks": [{"k": "button"}, {"k": "switch", "ents": ["light.wz"], "do": "off"}]}]},
         {"id": "f_fenster", "name": "Fenster", "lanes": [{"id": "l1", "blocks": [{"k": "state", "ents": ["binary_sensor.fenster"], "to": "open"},
                                                                                  {"k": "heat", "same": True, "do": "off"}]}]}]
LAYOUT = {"version": 1, "floors": [{"id": "eg", "name": "EG", "walls": [{"a": [0, 0], "b": [4, 0], "openings": [{"type": "window", "pos": 2, "width": 1, "entity": "binary_sensor.fenster"}]}],
                                    "rooms": [{"id": "r1", "name": "Wohnzimmer", "points": [[0, 0], [4, 0], [4, 3], [0, 3]]}],
                                    "devices": [{"id": "d1", "type": "thermostat", "x": 1, "z": 1, "entity": "climate.wz"}]}]}


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path))


async def _no_admins():
    return None


async def test_rules_start_off_and_are_cleaned_when_saved(client, tmp_path):
    r = await (await client.get("/api/rules")).json()
    assert r["heat"]["window"]["on"] is False and r["flows"] == [] and r["active"] is False and r["running"] is False and r["ha"] is False
    body = {"heat": {"window": {"on": True, "delay": 500}, "schedule": {"on": True, "rooms": {"h1/r1": {"days": [[[0, "eco"], [420, "comfort"]]]}}}},
            "flows": FLOWS + [{"id": "f_bad", "lanes": [{"blocks": [{"k": "switch", "ents": ["light.wz"]}]}]}]}
    r = await (await client.put("/api/rules", json=body)).json()
    assert r["heat"]["window"] == {"on": True, "delay": 60, "doors": True, "skip": []} and [f["id"] for f in r["flows"]] == ["f_kino", "f_fenster"]
    assert r["active"] is True and (tmp_path / "rules.json").is_file()
    again = await (await client.put("/api/rules", json={"flows": []})).json()   # one part alone: the other stays
    assert again["flows"] == [] and again["heat"]["window"]["on"] is True
    assert (await client.put("/api/rules", json={"flows": "x"})).status == 400 and (await client.put("/api/rules", json=[1])).status == 400


async def test_only_editors_save_and_test_but_everybody_may_press_a_button(client, monkeypatch, tmp_path):
    await client.put("/api/rules", json={"flows": FLOWS})
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    server._admin_cache.update(at=float("-inf"), ids=None)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    tablet, admin = {"X-Remote-User-Name": "tablet_wz"}, {"X-Remote-User-Name": "admin"}
    assert (await client.put("/api/rules", json={"flows": []}, headers=tablet)).status == 403
    assert (await (await client.get("/api/rules", headers=tablet)).json())["canEdit"] is False
    assert (await client.post("/api/rules/run", json={"flow": "f_kino", "lane": "l1"}, headers=tablet)).status == 200    # its button
    assert (await client.post("/api/rules/run", json={"flow": "f_kino", "lane": "l1", "test": True}, headers=tablet)).status == 403
    assert (await client.post("/api/rules/run", json={"flow": "f_fenster", "lane": "l1"}, headers=tablet)).status == 403   # no button: only to try
    assert (await client.post("/api/rules/run", json={"flow": "f_fenster", "lane": "l1", "test": True}, headers=admin)).status == 200
    assert (await client.post("/api/rules/run", json={"flow": "f_x", "lane": "l1"}, headers=admin)).status == 404
    rules = server.rules_store(server._AppCtx(client.server.app))
    asked = []
    while not rules.queue.empty():
        asked.append(rules.queue.get_nowait())
    assert [a for a in asked if a[0] == "run"] == [("run", "f_kino", "l1", False), ("run", "f_fenster", "l1", True)]


async def test_boost_and_heat_anyway_from_a_room(client, monkeypatch):
    assert (await client.post("/api/rules/room", json={"room": "h1/r1", "act": "boost"})).status == 200
    assert (await client.post("/api/rules/room", json={"room": "bad key", "act": "boost"})).status == 400
    assert (await client.post("/api/rules/room", json={"room": "h1/r1", "act": "explode"})).status == 400
    monkeypatch.setattr(server, "user_locks", lambda request: {"control"})
    assert (await client.post("/api/rules/room", json={"room": "h1/r1", "act": "skip"})).status == 403
    assert (await client.post("/api/rules/run", json={"flow": "f_x", "lane": "l1"})).status == 404


async def test_who_uses_a_device_without_home_assistant(client):
    h = (await (await client.get("/api/houses")).json())[0]["id"]
    await client.put("/api/layout", json=LAYOUT)
    await client.put("/api/rules", json={"heat": {"window": {"on": True}}, "flows": FLOWS})
    r = await (await client.get("/api/related?entity=climate.wz")).json()
    assert r["rows"] == [] and r["ha"] is False
    assert r["own"] == [{"kind": "heat", "rule": "window", "room": f"{h}/r1"}, {"kind": "flow", "id": "f_fenster", "name": "Fenster", "on": True}]
    assert (await client.get("/api/related?entity=nope")).status == 400
    assert (await (await client.get("/api/automations")).json()) == {"rows": []}


async def test_rules_go_into_the_backup_and_come_back(client):
    await client.put("/api/rules", json={"heat": {"night": {"on": True, "temp": 16}}, "flows": FLOWS})
    data = await (await client.get("/api/backup?files=0")).json()
    assert data["extras"]["rules"]["heat"]["night"]["temp"] == 16.0 and len(data["extras"]["rules"]["flows"]) == 2
    await client.put("/api/rules", json={"heat": {}, "flows": []})
    assert (await client.post("/api/backup", json=data)).status == 200
    r = await (await client.get("/api/rules")).json()
    assert r["heat"]["night"]["on"] is True and [f["id"] for f in r["flows"]] == ["f_kino", "f_fenster"]


async def test_special_days_are_kept_cleaned_and_in_the_backup(client, tmp_path):
    """📅 Besondere Tage (specialdays.py): saved on their own (the routines stay), cleaned, in the backup, put back with it"""
    days = [{"id": "d_xmas", "kind": "date", "name": "Heiligabend", "icon": "🎄", "md": "12-24"}, {"id": "d_bad", "kind": "date", "md": "13-01"},
            {"id": "d_ft", "kind": "holidays", "region": "BW"}]
    await client.put("/api/rules", json={"flows": FLOWS})
    r = await (await client.put("/api/rules", json={"days": days})).json()
    assert [d["id"] for d in r["days"]] == ["d_xmas", "d_ft"] and len(r["flows"]) == 2 and "haSync" in r
    assert (await (await client.get("/api/rules")).json())["days"][0] == {"id": "d_xmas", "kind": "date", "name": "Heiligabend", "icon": "🎄", "md": "12-24"}
    assert (await client.put("/api/rules", json={"days": "x"})).status == 400
    data = await (await client.get("/api/backup?files=0")).json()
    assert [d["id"] for d in data["extras"]["rules"]["days"]] == ["d_xmas", "d_ft"]
    await client.put("/api/rules", json={"days": []})
    assert (await client.post("/api/backup", json=data)).status == 200
    assert [d["id"] for d in (await (await client.get("/api/rules")).json())["days"]] == ["d_xmas", "d_ft"]


async def test_routines_become_automations_of_home_assistant(client, monkeypatch, aiohttp_server, tmp_path):
    """#548: a routine with ha: true is written through Home Assistant's own editor (fp3d_… ids only), not again when unchanged, not over
    a change made in Home Assistant unless the page says so (the old one kept), switched off with the routine and deleted with it"""
    import json as js
    import re
    from aiohttp import web
    autos = {"heizung_morgens": {"id": "heizung_morgens", "alias": "Heizung morgens"}}
    states = {"automation.heizung_morgens": {"entity_id": "automation.heizung_morgens", "state": "on", "attributes": {"id": "heizung_morgens"}},
              "light.flur": {"entity_id": "light.flur", "state": "off", "attributes": {}}}
    asked, services = [], []

    async def ws(request):
        w = web.WebSocketResponse(); await w.prepare(request)
        await w.send_json({"type": "auth_required"}); await w.receive_json(); await w.send_json({"type": "auth_ok"})
        async for msg in w:
            m = js.loads(msg.data)
            await w.send_json({"id": m["id"], "type": "result", "success": True, "result": list(states.values()) if m["type"] == "get_states" else None})
        return w

    async def config(request):
        cid = request.match_info["id"]
        asked.append((request.method, cid))
        if request.method == "GET":
            return web.json_response(autos[cid]) if cid in autos else web.json_response({"message": "Resource not found"}, status=404)
        if request.method == "DELETE":
            autos.pop(cid, None)
            states.pop(next((e for e, s in states.items() if s["attributes"].get("id") == cid), ""), None)
            return web.json_response({"result": "ok"})
        autos[cid] = await request.json()
        e = "automation." + re.sub(r"[^a-z0-9]+", "_", autos[cid]["alias"].lower()).strip("_")
        states[e] = {"entity_id": e, "state": "on", "attributes": {"id": cid, "friendly_name": autos[cid]["alias"]}}
        return web.json_response({"result": "ok"})

    async def service(request):
        data = await request.json()
        services.append((request.match_info["svc"], data))
        if request.match_info["svc"] in ("turn_on", "turn_off"):
            states[data["entity_id"]]["state"] = request.match_info["svc"][5:]
        return web.json_response([])

    async def template(request):
        return web.Response(text="[]")
    fake = web.Application()
    fake.router.add_get("/websocket", ws)
    fake.router.add_route("*", "/config/automation/config/{id}", config)
    fake.router.add_post("/services/automation/{svc}", service)
    fake.router.add_post("/template", template)
    srv = await aiohttp_server(fake)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")

    async def editor(request):
        return True
    monkeypatch.setattr(server, "can_edit", editor)
    flow = {"id": "f_licht", "name": "Flurlicht", "ha": True, "lanes": [{"id": "l1", "blocks": [{"k": "button"}, {"k": "switch", "ents": ["light.flur"], "do": "on"}]}]}
    local = {"id": "f_hier", "name": "Im Add-on", "lanes": [{"id": "l1", "blocks": [{"k": "button"}, {"k": "switch", "ents": ["light.flur"], "do": "off"}]}]}
    r = await (await client.put("/api/rules", json={"flows": [flow, local]})).json()
    assert r["haSync"] == {"f_licht": {"ok": True, "ids": ["fp3d_licht_l1"], "problems": []}}
    assert autos["fp3d_licht_l1"]["alias"] == "Flurlicht" and autos["fp3d_licht_l1"]["actions"][0]["action"] == "light.turn_on"
    assert "fp3d_hier_l1" not in autos and ("POST", "heizung_morgens") not in asked                 # the add-on's own stays the add-on's
    assert (await client.post("/api/rules/run", json={"flow": "f_licht", "lane": "l1"})).status == 200
    assert services[-1] == ("trigger", {"entity_id": "automation.flurlicht"})                         # its button: Home Assistant runs it
    n = len([a for a in asked if a[0] == "POST"])
    await client.put("/api/rules", json={"flows": [flow, local]})
    assert len([a for a in asked if a[0] == "POST"]) == n                                            # unchanged: not written again
    autos["fp3d_licht_l1"] = {**autos["fp3d_licht_l1"], "alias": "Im Home Assistant geändert"}       # somebody changes it there
    renamed = {**flow, "name": "Flur"}
    r = await (await client.put("/api/rules", json={"flows": [renamed]})).json()
    assert r["haSync"] == {"f_licht": {"conflict": ["fp3d_licht_l1"]}} and autos["fp3d_licht_l1"]["alias"] == "Im Home Assistant geändert"
    r = await (await client.put("/api/rules", json={"flows": [{**renamed, "on": False}], "force": ["f_licht"]})).json()
    assert r["haSync"]["f_licht"]["ok"] and autos["fp3d_licht_l1"]["alias"] == "Flur"
    assert any("Im Home Assistant geändert" in p.read_text() for p in (tmp_path / "ha-backup").glob("*.json"))   # the old one kept
    assert ("turn_off", {"entity_id": "automation.flur"}) in services                               # off as the routine says
    r = await (await client.put("/api/rules", json={"flows": [{**flow, "lanes": [{"id": "l1", "blocks": [{"k": "button"}, {"k": "if_outside", "v": 3}, {"k": "notify", "text": "kalt"}]}]}]})).json()
    assert r["haSync"] == {"f_licht": {"problems": [{"lane": "l1", "block": 1, "why": "weather"}]}} and autos["fp3d_licht_l1"]["alias"] == "Flur"
    await client.put("/api/rules", json={"flows": [local]})
    assert "fp3d_licht_l1" not in autos and "heizung_morgens" in autos and ("DELETE", "fp3d_licht_l1") in asked
    assert not any(a[1] == "heizung_morgens" and a[0] != "GET" for a in asked)                      # never touched
    assert js.loads((tmp_path / "ha-sync.json").read_text()) == {}


async def test_the_journal_of_the_heating_and_every_room_as_the_add_on_sees_it(client, tmp_path):
    """🩺 Wer steuert was (#579): without Home Assistant the rooms of the plans and the journal kept before"""
    import json
    (tmp_path / "layout.json").write_text(json.dumps(LAYOUT))
    (tmp_path / "rules-trace.json").write_text(json.dumps([{"t": 5, "k": "contact", "ent": "binary_sensor.fenster", "s": "on", "was": "off",
                                                            "rooms": [["main/r1", "window"]]}, {"t": 6, "x": 1}]))
    r = await (await client.get("/api/rules/trace")).json()
    assert r["rooms"] == [{"key": "main/r1", "house": "main", "name": "Wohnzimmer", "floor": 0, "climates": ["climate.wz"],
                           "windows": ["binary_sensor.fenster"], "outer": [], "counted": [], "inner": []}]
    assert [x["k"] for x in r["trace"]] == ["contact"] and r["running"] is False and r["ha"] is False and r["houses"] == {"main": "Haus"}
    assert r["states"] == {"binary_sensor.fenster": None, "climate.wz": None} and r["loose"] == []
