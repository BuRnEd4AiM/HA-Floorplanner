import json, os
from aiohttp import web
STATE = {"climate.wohnzimmer": "heat", "light.wohnzimmer": "on", "sensor.temp": "21.5", "cover.rollo": "closed", "switch.garage": "off", "binary_sensor.rauch": "off", "sensor.co2": "850", "sensor.leistung": "95.4", "camera.flur": "idle"}
CALLS = []
CALL_DATA = []      # the data of the climate calls (set_temperature / set_hvac_mode) and of set_cover_position
CLIMATE = {"temperature": 21.0, "hvac_action": "heating"}
SUBS = []          # websocket subscribers of state_changed (the add-on's live channel)
REG_SUBS = []      # websocket subscribers of the registry events (the add-on's watch for renamed entities)
REGISTRY = {e: "u_" + e for e in STATE}     # entity id -> unique id of its registry entry
ALIAS = {}         # entity id the tests know -> its id after a rename (/_rename)
COVER_POS = {}     # covers with a position (current_position), from set_cover_position on; /_set takes it away again
def cur(e): return ALIAS.get(e, e)
NAMES = {"climate.wohnzimmer": "Heizung Wohnzimmer", "light.wohnzimmer": "Wohnzimmer Licht", "sensor.temp": "Temperatur", "cover.rollo": "Rollo", "switch.garage": "Garage", "binary_sensor.rauch": "Rauchmelder", "sensor.co2": "CO2 Wohnzimmer", "sensor.leistung": "Leistung Waschmaschine", "camera.flur": "Kamera Flur"}
def state_of(e):
    attrs = {"friendly_name": NAMES[e]}
    if e == "climate.wohnzimmer":
        attrs.update({"current_temperature": 20.5, "temperature": CLIMATE["temperature"], "hvac_action": CLIMATE["hvac_action"] if STATE[e] != "off" else "off",
                      "hvac_modes": ["off", "heat", "auto"], "min_temp": 7, "max_temp": 30, "target_temp_step": 0.5})
    if e == "sensor.temp": attrs["unit_of_measurement"] = "°C"
    if e in COVER_POS: attrs["current_position"] = COVER_POS[e]
    if e == "binary_sensor.rauch": attrs["device_class"] = "smoke"
    if e == "sensor.co2": attrs.update({"unit_of_measurement": "ppm", "device_class": "carbon_dioxide"})
    if e == "sensor.leistung": attrs.update({"unit_of_measurement": "W", "device_class": "power"})
    return {"entity_id": e, "state": STATE[e], "attributes": attrs}
async def states(r):
    return web.json_response([state_of(cur("light.wohnzimmer")), state_of(cur("sensor.temp")),
      {"entity_id":"scene.gaming","state":"unknown","attributes":{"friendly_name":"Gaming","entity_id":["light.wohnzimmer","light.andere"]}},
      state_of(cur("cover.rollo")), state_of(cur("switch.garage")), state_of(cur("binary_sensor.rauch")), state_of(cur("sensor.co2")), state_of(cur("sensor.leistung")), state_of(cur("camera.flur")), state_of(cur("climate.wohnzimmer"))])
async def push(e):
    for ws, sid in list(SUBS):
        try: await ws.send_json({"id": sid, "type": "event", "event": {"event_type": "state_changed", "data": {"entity_id": e, "new_state": state_of(e)}}})
        except Exception: SUBS.remove((ws, sid))
async def service(r):
    body = await r.json(); dom, svc = r.match_info["d"], r.match_info["s"]
    CALLS.append([dom, svc, body.get("entity_id")])
    e = body.get("entity_id")
    if svc == "toggle": STATE[e] = "off" if STATE[e] == "on" else "on"
    if svc == "turn_off": STATE[e] = "off"
    if svc == "turn_on": STATE[e] = "on"
    if svc == "set_temperature": CLIMATE["temperature"] = body["temperature"]; CALL_DATA.append([svc, e, body["temperature"]])
    if svc == "set_hvac_mode": STATE[e] = body["hvac_mode"]; CALL_DATA.append([svc, e, body["hvac_mode"]])
    if svc == "set_cover_position": COVER_POS[e] = body.get("position"); STATE[e] = "open" if body.get("position", 0) > 0 else "closed"; CALL_DATA.append([svc, e, body.get("position")])
    if e in STATE: await push(e)
    return web.json_response([])
async def set_state(r):          # test helper: a change that happens outside the floor plan (wall switch, automation)
    e, s = r.query["e"], r.query["s"]
    STATE[e] = s
    COVER_POS.pop(e, None)
    await push(e)
    return web.json_response({"ok": True, "subscribers": len(SUBS)})
async def rename(r):            # test helper: an entity renamed in Home Assistant (or by Zigbee2MQTT), with a new name
    old, new, name = r.query["from"], r.query["to"], r.query["name"]
    STATE[new], NAMES[new], REGISTRY[new] = STATE.pop(old), name, REGISTRY.pop(old)
    del NAMES[old]
    ALIAS.update({k: new for k, v in list(ALIAS.items()) if v == old}); ALIAS.setdefault(old, new)
    for ws, sid in list(REG_SUBS):
        try: await ws.send_json({"id": sid, "type": "event", "event": {"event_type": "entity_registry_updated",
                                 "data": {"action": "update", "entity_id": new, "old_entity_id": old, "changes": {"entity_id": old}}}})
        except Exception: REG_SUBS.remove((ws, sid))
    for ws, sid in list(SUBS):
        try: await ws.send_json({"id": sid, "type": "event", "event": {"event_type": "state_changed", "data": {"entity_id": old, "new_state": None}}})
        except Exception: SUBS.remove((ws, sid))
    await push(new)
    return web.json_response({"ok": True, "watchers": len(REG_SUBS)})
async def websocket(r):          # Home Assistant's websocket API: auth, then state_changed (and registry) events
    ws = web.WebSocketResponse(); await ws.prepare(r)
    await ws.send_json({"type": "auth_required"})
    await ws.receive_json()
    await ws.send_json({"type": "auth_ok"})
    async for msg in ws:
        m = json.loads(msg.data)
        if m.get("type") == "subscribe_events":
            (SUBS if m.get("event_type", "state_changed") == "state_changed" else REG_SUBS).append((ws, m["id"]))
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": None})
        elif m.get("type") == "get_states":         # the security view recorder starts with all states
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": [state_of(e) for e in STATE]})
        elif m.get("type") == "config/entity_registry/list":    # the watch for renamed entities
            await ws.send_json({"id": m["id"], "type": "result", "success": True,
                                "result": [{"entity_id": e, "platform": "mock", "unique_id": u} for e, u in REGISTRY.items()]})
        elif "id" in m:
            await ws.send_json({"id": m["id"], "type": "result", "success": False, "error": {"code": "unknown_command"}})
    SUBS[:] = [x for x in SUBS if x[0] is not ws]
    REG_SUBS[:] = [x for x in REG_SUBS if x[0] is not ws]
    return ws
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000" "1f15c4890000000d49444154789c6360f8ffff3f0005fe02fea75a3c260000000049454e44ae426082")
async def camera_proxy(r): return web.Response(body=PNG, content_type="image/png")
async def calls(r): return web.json_response(CALLS)
async def call_data(r): return web.json_response(CALL_DATA)
async def template(r):
    return web.Response(text=json.dumps([{"id": "wz", "name": "Wohnzimmer", "entities": ["light.wohnzimmer", "cover.rollo"]}]))
app = web.Application()
app.add_routes([web.get("/states", states), web.post("/services/{d}/{s}", service), web.get("/_calls", calls), web.get("/_calldata", call_data), web.get("/_set", set_state), web.get("/_rename", rename),
                web.get("/websocket", websocket), web.post("/template", template), web.get("/camera_proxy/{e}", camera_proxy)])
web.run_app(app, port=int(os.environ.get("MOCK_PORT", "8123")), print=None)
