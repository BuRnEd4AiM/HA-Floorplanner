import json
from aiohttp import web
STATE = {"light.wohnzimmer": "on", "sensor.temp": "21.5", "cover.rollo": "closed", "switch.garage": "off"}
CALLS = []
SUBS = []          # websocket subscribers of state_changed (the add-on's live channel)
NAMES = {"light.wohnzimmer": "Wohnzimmer Licht", "sensor.temp": "Temperatur", "cover.rollo": "Rollo", "switch.garage": "Garage"}
def state_of(e):
    attrs = {"friendly_name": NAMES[e]}
    if e == "sensor.temp": attrs["unit_of_measurement"] = "°C"
    return {"entity_id": e, "state": STATE[e], "attributes": attrs}
async def states(r):
    return web.json_response([state_of("light.wohnzimmer"), state_of("sensor.temp"),
      {"entity_id":"scene.gaming","state":"unknown","attributes":{"friendly_name":"Gaming","entity_id":["light.wohnzimmer","light.andere"]}},
      state_of("cover.rollo"), state_of("switch.garage")])
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
        elif "id" in m:
            await ws.send_json({"id": m["id"], "type": "result", "success": False, "error": {"code": "unknown_command"}})
    SUBS[:] = [x for x in SUBS if x[0] is not ws]
    return ws
async def calls(r): return web.json_response(CALLS)
async def template(r):
    return web.Response(text=json.dumps([{"id": "wz", "name": "Wohnzimmer", "entities": ["light.wohnzimmer", "cover.rollo"]}]))
app = web.Application()
app.add_routes([web.get("/states", states), web.post("/services/{d}/{s}", service), web.get("/_calls", calls), web.get("/_set", set_state),
                web.get("/websocket", websocket), web.post("/template", template)])
web.run_app(app, port=8123, print=None)
