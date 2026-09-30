import json
from aiohttp import web
STATE = {"light.wohnzimmer": "on", "sensor.temp": "21.5", "cover.rollo": "closed"}
CALLS = []
async def states(r):
    return web.json_response([
      {"entity_id":"light.wohnzimmer","state":STATE["light.wohnzimmer"],"attributes":{"friendly_name":"Wohnzimmer Licht"}},
      {"entity_id":"sensor.temp","state":STATE["sensor.temp"],"attributes":{"friendly_name":"Temperatur","unit_of_measurement":"°C"}},
      {"entity_id":"scene.gaming","state":"unknown","attributes":{"friendly_name":"Gaming","entity_id":["light.wohnzimmer","light.andere"]}},
      {"entity_id":"cover.rollo","state":STATE["cover.rollo"],"attributes":{"friendly_name":"Rollo"}}])
async def service(r):
    body = await r.json(); dom, svc = r.match_info["d"], r.match_info["s"]
    CALLS.append([dom, svc, body.get("entity_id")])
    if svc == "toggle": STATE[body["entity_id"]] = "off" if STATE[body["entity_id"]] == "on" else "on"
    if svc == "turn_off": STATE[body["entity_id"]] = "off"
    if svc == "turn_on": STATE[body["entity_id"]] = "on"
    return web.json_response([])
async def calls(r): return web.json_response(CALLS)
async def template(r):
    return web.Response(text=json.dumps([{"id": "wz", "name": "Wohnzimmer", "entities": ["light.wohnzimmer", "cover.rollo"]}]))
app = web.Application()
app.add_routes([web.get("/states", states), web.post("/services/{d}/{s}", service), web.get("/_calls", calls), web.post("/template", template)])
web.run_app(app, port=8123, print=None)
