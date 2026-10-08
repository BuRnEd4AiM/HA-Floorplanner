import json
from aiohttp import web
STATE = {"climate.wohnzimmer": "heat", "light.wohnzimmer": "on", "sensor.temp": "21.5", "cover.rollo": "closed", "switch.garage": "off", "binary_sensor.rauch": "off", "sensor.co2": "850", "sensor.leistung": "95.4", "camera.flur": "idle"}
CALLS = []
CALL_DATA = []      # the data of the climate calls (set_temperature / set_hvac_mode)
CLIMATE = {"temperature": 21.0, "hvac_action": "heating"}
SUBS = []          # websocket subscribers of state_changed (the add-on's live channel)
NAMES = {"climate.wohnzimmer": "Heizung Wohnzimmer", "light.wohnzimmer": "Wohnzimmer Licht", "sensor.temp": "Temperatur", "cover.rollo": "Rollo", "switch.garage": "Garage", "binary_sensor.rauch": "Rauchmelder", "sensor.co2": "CO2 Wohnzimmer", "sensor.leistung": "Leistung Waschmaschine", "camera.flur": "Kamera Flur"}
def state_of(e):
    attrs = {"friendly_name": NAMES[e]}
    if e == "climate.wohnzimmer":
        attrs.update({"current_temperature": 20.5, "temperature": CLIMATE["temperature"], "hvac_action": CLIMATE["hvac_action"] if STATE[e] != "off" else "off",
                      "hvac_modes": ["off", "heat", "auto"], "min_temp": 7, "max_temp": 30, "target_temp_step": 0.5})
    if e == "sensor.temp": attrs["unit_of_measurement"] = "°C"
    if e == "binary_sensor.rauch": attrs["device_class"] = "smoke"
    if e == "sensor.co2": attrs.update({"unit_of_measurement": "ppm", "device_class": "carbon_dioxide"})
    if e == "sensor.leistung": attrs.update({"unit_of_measurement": "W", "device_class": "power"})
    return {"entity_id": e, "state": STATE[e], "attributes": attrs}
async def states(r):
    return web.json_response([state_of("light.wohnzimmer"), state_of("sensor.temp"),
      {"entity_id":"scene.gaming","state":"unknown","attributes":{"friendly_name":"Gaming","entity_id":["light.wohnzimmer","light.andere"]}},
      state_of("cover.rollo"), state_of("switch.garage"), state_of("binary_sensor.rauch"), state_of("sensor.co2"), state_of("sensor.leistung"), state_of("camera.flur"), state_of("climate.wohnzimmer")])
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
    if e in STATE: await push(e)
    return web.json_response([])
async def set_state(r):          # test helper: a change that happens outside the floor plan (wall switch, automation)
    e, s = r.query["e"], r.query["s"]
    STATE[e] = s
    await push(e)
    return web.json_response({"ok": True, "subscribers": len(SUBS)})
async def websocket(r):          # Home Assistant's websocket API: auth, then state_changed events
    ws = web.WebSocketResponse(); await ws.prepare(r)
    await ws.send_json({"type": "auth_required"})
    await ws.receive_json()
    await ws.send_json({"type": "auth_ok"})
    async for msg in ws:
        m = json.loads(msg.data)
        if m.get("type") == "subscribe_events":
            SUBS.append((ws, m["id"]))
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": None})
        elif m.get("type") == "get_states":         # the time travel recorder starts with all states
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": [state_of(e) for e in STATE]})
        elif "id" in m:
            await ws.send_json({"id": m["id"], "type": "result", "success": False, "error": {"code": "unknown_command"}})
    SUBS[:] = [x for x in SUBS if x[0] is not ws]
    return ws
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000" "1f15c4890000000d49444154789c6360f8ffff3f0005fe02fea75a3c260000000049454e44ae426082")
async def camera_proxy(r): return web.Response(body=PNG, content_type="image/png")
async def calls(r): return web.json_response(CALLS)
async def call_data(r): return web.json_response(CALL_DATA)
async def template(r):
    return web.Response(text=json.dumps([{"id": "wz", "name": "Wohnzimmer", "entities": ["light.wohnzimmer", "cover.rollo"]}]))
app = web.Application()
app.add_routes([web.get("/states", states), web.post("/services/{d}/{s}", service), web.get("/_calls", calls), web.get("/_calldata", call_data), web.get("/_set", set_state),
                web.get("/websocket", websocket), web.post("/template", template), web.get("/camera_proxy/{e}", camera_proxy)])
web.run_app(app, port=8123, print=None)
