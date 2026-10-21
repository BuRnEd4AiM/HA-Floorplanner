import json, os
from aiohttp import web
STATE = {"climate.wohnzimmer": "heat", "light.wohnzimmer": "on", "sensor.temp": "21.5", "cover.rollo": "closed", "switch.garage": "off", "binary_sensor.rauch": "off", "sensor.co2": "850", "sensor.leistung": "95.4", "camera.flur": "idle", "sensor.rauch_battery": "15"}
CALLS = []
CALL_DATA = []      # the data of the climate calls (set_temperature / set_hvac_mode) and of set_cover_position
CLIMATE = {"temperature": 21.0, "hvac_action": "heating"}
SUBS = []          # websocket subscribers of state_changed (the add-on's live channel)
REG_SUBS = []      # websocket subscribers of the registry events (the add-on's watch for renamed entities)
REGISTRY = {e: "u_" + e for e in STATE}     # entity id -> unique id of its registry entry
DEVICES = {"u_binary_sensor.rauch": "dev_rauch", "u_sensor.rauch_battery": "dev_rauch"}   # unique id -> device: the smoke alarm and its battery (#376)
ALIAS = {}         # entity id the tests know -> its id after a rename (/_rename)
COVER_POS = {}     # covers with a position (current_position), from set_cover_position on; /_set takes it away again
ENERGY = {"prefs": None, "registry": {}}   # the energy dashboard (energy/get_prefs, #407) and more registry entries (entity -> device): POST /_energy
NOTIFIED = []      # messages sent (#414): ["ha", service, message] through notify.*, ["ha_entity", "notify.a,notify.b", message] through notify.send_message (#460), ["callmebot", phone, text, apikey] through /_callmebot
STATS_ASKED = []   # the statistics the add-on asked for (#479): [ids, period]
EXTRA = {}         # more entities with their attributes (#406: music, vacuum, fan, alarm ...): POST /_extra {entity: {state, attributes[, platform][, device]}}, {} takes them away; with "platform" or "device" also in the entity registry (#460, #483: a phone and its battery)
def cur(e): return ALIAS.get(e, e)
NAMES = {"climate.wohnzimmer": "Heizung Wohnzimmer", "light.wohnzimmer": "Wohnzimmer Licht", "sensor.temp": "Temperatur", "cover.rollo": "Rollo", "switch.garage": "Garage", "binary_sensor.rauch": "Rauchmelder", "sensor.co2": "CO2 Wohnzimmer", "sensor.leistung": "Leistung Waschmaschine", "camera.flur": "Kamera Flur", "sensor.rauch_battery": "Rauchmelder Batterie"}
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
    if e == "sensor.rauch_battery": attrs.update({"unit_of_measurement": "%", "device_class": "battery"})
    return {"entity_id": e, "state": STATE[e], "attributes": attrs}
async def states(r):
    return web.json_response([state_of(cur("light.wohnzimmer")), state_of(cur("sensor.temp")),
      {"entity_id":"scene.gaming","state":"unknown","attributes":{"friendly_name":"Gaming","entity_id":["light.wohnzimmer","light.andere"]}},
      state_of(cur("cover.rollo")), state_of(cur("switch.garage")), state_of(cur("binary_sensor.rauch")), state_of(cur("sensor.co2")), state_of(cur("sensor.leistung")), state_of(cur("camera.flur")), state_of(cur("climate.wohnzimmer")), state_of(cur("sensor.rauch_battery"))]
      + [{"entity_id": e, **v} for e, v in EXTRA.items()])
async def push(e):
    for ws, sid in list(SUBS):
        try: await ws.send_json({"id": sid, "type": "event", "event": {"event_type": "state_changed", "data": {"entity_id": e, "new_state": {"entity_id": e, **EXTRA[e]} if e in EXTRA else state_of(e)}}})
        except Exception: SUBS.remove((ws, sid))
async def service(r):
    body = await r.json(); dom, svc = r.match_info["d"], r.match_info["s"]
    CALLS.append([dom, svc, body.get("entity_id")])
    e = body.get("entity_id")
    if dom == "weather" and svc == "get_forecasts":    # #479: the forecast of the page "Heute" (with ?return_response)
        import datetime as dt
        day0 = dt.datetime.now(dt.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        rows = [{"datetime": (day0 + dt.timedelta(days=i)).isoformat(), "condition": ["sunny", "rainy", "cloudy", "partlycloudy", "snowy"][i % 5],
                 "temperature": 14 - i, "templow": 5 - i, "precipitation": i * 1.5, "precipitation_probability": i * 20} for i in range(5)]
        return web.json_response({"changed_states": [], "service_response": {e: {"forecast": rows}}})
    if dom == "notify":           # #414: a message of the add-on; #460: notify.send_message to notify entities
        NOTIFIED.append(["ha_entity", ",".join(e), body.get("message")] if svc == "send_message" and isinstance(e, list) else ["ha", svc, body.get("message")])
        return web.json_response([])
    if isinstance(e, list):       # several at once (homeassistant.turn_on of the holiday alarm's sirens, #456): only noted
        return web.json_response([])
    if e in EXTRA:                # #406: what the device does with the call, the data kept for the test
        x, a = EXTRA[e], EXTRA[e].setdefault("attributes", {})
        CALL_DATA.append([svc, e, {k: v for k, v in body.items() if k != "entity_id"}])
        flips = {"media_play_pause": "paused" if x["state"] == "playing" else "playing", "start": "cleaning", "pause": "paused", "return_to_base": "returning",
                 "alarm_arm_home": "armed_home", "alarm_arm_away": "armed_away", "turn_on": "on", "turn_off": "off"}
        if svc in flips: x["state"] = flips[svc]
        if svc == "toggle": x["state"] = "off" if x["state"] == "on" else "on"      # a favourite (#471)
        if svc == "alarm_disarm":
            if body.get("code") != "4711": return web.json_response({"message": "Invalid code"}, status=400)
            x["state"] = "disarmed"
        for key, attr in (("volume_level", "volume_level"), ("is_volume_muted", "is_volume_muted"), ("source", "source"), ("fan_speed", "fan_speed"),
                          ("percentage", "percentage"), ("oscillating", "oscillating"), ("preset_mode", "preset_mode"), ("fan_mode", "fan_mode")):
            if key in body: a[attr] = body[key]
        if svc == "select_option": x["state"] = body["option"]
        await push(e)
        return web.json_response([])
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
    if e in EXTRA:                # one of the added entities (#456: a door contact of the holiday alarm)
        EXTRA[e]["state"] = s
        await push(e)
        return web.json_response({"ok": True, "subscribers": len(SUBS)})
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
        if m.get("type") == "camera/stream":
            ok = m.get("entity_id") == "camera.flur"
            await ws.send_json({"id": m["id"], "type": "result", "success": ok, "result": {"url": f"/api/hls/{HLS_TOKEN}/master_playlist.m3u8"} if ok else None,
                                "error": None if ok else {"code": "start_stream_failed", "message": "no stream"}})
            continue
        if m.get("type") == "subscribe_events":
            (SUBS if m.get("event_type", "state_changed") == "state_changed" else REG_SUBS).append((ws, m["id"]))
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": None})
        elif m.get("type") == "get_states":         # the security view recorder starts with all states
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": [state_of(e) for e in STATE]})
        elif m.get("type") == "config/entity_registry/list":    # the watch for renamed entities (and the devices of the energy meters, #407)
            await ws.send_json({"id": m["id"], "type": "result", "success": True,
                                "result": [{"entity_id": e, "platform": "mock", "unique_id": u, "device_id": DEVICES.get(u)} for e, u in REGISTRY.items()]
                                + [{"entity_id": e, "platform": "mock", "unique_id": "energy_" + e, "device_id": d} for e, d in ENERGY["registry"].items()]
                                + [{"entity_id": e, "platform": v.get("platform", "mock"), "unique_id": "extra_" + e, "device_id": v.get("device")} for e, v in EXTRA.items() if "platform" in v or "device" in v]})
        elif m.get("type") == "energy/get_prefs":               # the energy dashboard (#407): "not_found" while it is not set up
            ok = ENERGY["prefs"] is not None
            await ws.send_json({"id": m["id"], "type": "result", "success": ok, "result": ENERGY["prefs"] if ok else None,
                                **({} if ok else {"error": {"code": "not_found", "message": "No prefs"}})})
        elif m.get("type") == "recorder/statistics_during_period":   # #479: the history of the page "Energie": a little per period
            STATS_ASKED.append([m.get("statistic_ids"), m.get("period")])
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": stat_rows(m)})
        elif m.get("type") == "recorder/get_statistics_metadata":
            await ws.send_json({"id": m["id"], "type": "result", "success": True,
                                "result": [{"statistic_id": i, "unit_class": "volume" if "wasser" in i or "gas" in i else "energy",
                                            "statistics_unit_of_measurement": "m³" if "wasser" in i or "gas" in i else "kWh"} for i in m.get("statistic_ids") or []]})
        elif "id" in m:
            await ws.send_json({"id": m["id"], "type": "result", "success": False, "error": {"code": "unknown_command"}})
    SUBS[:] = [x for x in SUBS if x[0] is not ws]
    REG_SUBS[:] = [x for x in REG_SUBS if x[0] is not ws]
    return ws
def stat_rows(m):
    """the change of every statistic in every hour / day / week / month between start and end: a fixed amount per meter (#479)"""
    import datetime as dt
    a, b = dt.datetime.fromisoformat(m["start_time"]), dt.datetime.fromisoformat(m["end_time"])
    step = {"hour": dt.timedelta(hours=1), "day": dt.timedelta(days=1), "week": dt.timedelta(days=7), "month": dt.timedelta(days=30)}[m["period"]]
    per = {"hour": 1, "day": 24, "week": 168, "month": 720}[m["period"]]
    base = lambda i: 0.4 if "bezug" in i else 0.3 if "einspeis" in i else 0.6 if "pv" in i else 0.05 if "wasser" in i else 0.25
    out = {}
    for i in m.get("statistic_ids") or []:
        rows, t = [], a
        while t < b:
            rows.append({"start": t.timestamp() * 1000, "end": (t + step).timestamp() * 1000, "change": round(base(i) * per, 3)})
            t += step
        out[i] = rows
    return out
async def calendars(r):           # #479: Home Assistant's calendars and their events (page "Heute")
    return web.json_response([{"entity_id": "calendar.familie", "name": "Familie"}, {"entity_id": "calendar.muell", "name": "Müllabfuhr"}])
async def calendar_events(r):
    import datetime as dt
    start = dt.datetime.fromisoformat(r.query["start"].replace("Z", "+00:00")).astimezone()
    day = start.date() + dt.timedelta(days=1) if start.hour >= 12 else start.date()        # the first day asked for (local)
    if r.match_info["id"] == "calendar.muell":
        return web.json_response([{"start": {"date": (day + dt.timedelta(days=1)).isoformat()}, "end": {"date": (day + dt.timedelta(days=2)).isoformat()}, "summary": "Gelber Sack"}])
    at = dt.datetime.combine(day, dt.time(15, 0)).astimezone()
    return web.json_response([{"start": {"dateTime": at.isoformat()}, "end": {"dateTime": (at + dt.timedelta(hours=1)).isoformat()}, "summary": "Zahnarzt"}])
async def stats_asked(r): return web.json_response(STATS_ASKED)
async def one_state(r):           # #483: one state (a person's picture is looked up there)
    e = r.match_info["e"]
    if e in EXTRA: return web.json_response({"entity_id": e, **EXTRA[e]})
    if e in STATE: return web.json_response(state_of(e))
    return web.json_response({"message": "Entity not found."}, status=404)
async def image_serve(r): return web.Response(body=PNG, content_type="image/png")   # #483: an uploaded picture of a person
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000" "1f15c4890000000d49444154789c6360f8ffff3f0005fe02fea75a3c260000000049454e44ae426082")
async def in_two(r, body, ctype):
    """an answer in two pieces with a pause between them, as pictures and video pieces come through the Supervisor (#385)"""
    import asyncio
    res = web.StreamResponse(); res.content_type = ctype
    await res.prepare(r)
    await res.write(body[:len(body) // 2]); await asyncio.sleep(0.1); await res.write(body[len(body) // 2:])
    return res
async def camera_proxy(r): return await in_two(r, PNG, "image/png")
# Home Assistant's HLS stream of camera.flur (#383): websocket camera/stream gives the address, then playlists, init and segments.
# A tiny VP9 test video (tests/e2e/hls, 3 x 1 s, made with ffmpeg) as a finished playlist: the page plays it, it ends, the page starts again.
HLS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hls")
HLS_TOKEN = "0123456789abcdef0123456789abcdef"
HLS_SEEN = []      # the HLS files asked for (through the add-on)
def hls_file(name): return open(os.path.join(HLS_DIR, name), "rb").read()
async def hls(r):
    if r.match_info["token"] != HLS_TOKEN: return web.Response(status=404)
    name = r.match_info["name"]; HLS_SEEN.append(name)
    if name == "master_playlist.m3u8":
        return web.Response(text='#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=60000,CODECS="vp09.00.10.08"\nplaylist.m3u8\n', content_type="application/vnd.apple.mpegurl")
    if name == "playlist.m3u8":
        segs = "".join(f"#EXTINF:1.000,\n./segment/{i}.m4s\n" for i in range(3))
        return web.Response(text=f'#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-TARGETDURATION:1\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-MAP:URI="init.mp4"\n{segs}#EXT-X-ENDLIST\n',
                            content_type="application/vnd.apple.mpegurl")
    if name == "init.mp4": return await in_two(r, hls_file("init.mp4"), "video/mp4")
    if name.startswith("segment/") and name[8:-4].isdigit() and int(name[8:-4]) < 3:
        return await in_two(r, hls_file(f"seg{int(name[8:-4])}.m4s"), "video/iso.segment")
    return web.Response(status=404)
async def hls_seen(r): return web.json_response(HLS_SEEN)
async def calls(r): return web.json_response(CALLS)
async def call_data(r): return web.json_response(CALL_DATA)
async def set_energy(r):          # test helper (#407): the energy dashboard's settings and the devices of its sensors; {} sets it back
    body = await r.json()
    ENERGY["prefs"], ENERGY["registry"] = body.get("prefs"), body.get("registry") or {}
    return web.json_response({"ok": True})
async def set_extra(r):           # test helper (#406): more entities with their attributes; {} takes them away
    EXTRA.clear(); EXTRA.update(await r.json())
    return web.json_response({"ok": True})
async def services_list(r):       # Home Assistant's services: the notify ones the alarm message can use (#414)
    return web.json_response([{"domain": "light", "services": {"turn_on": {}}}, {"domain": "notify", "services": {"mobile_app_test": {}, "whatsapp": {}, "send_message": {}}}])
async def callmebot(r):           # the free WhatsApp gateway (#414): "bad" is a wrong key
    q = r.query
    NOTIFIED.append(["callmebot", q.get("phone"), q.get("text"), q.get("apikey")])
    if q.get("apikey") == "bad": return web.Response(text="<p>APIKey is invalid. You need to get a new one.</p>", content_type="text/html")
    return web.Response(text="<p>Message queued. You will receive it in a few seconds.</p>", content_type="text/html")
async def cmb_tg_user(r):         # Telegram to users through CallMeBot (#456)
    NOTIFIED.append(["tg_user", r.query.get("user"), r.query.get("text")])
    return web.Response(text="<p>Message to: " + r.query.get("user", "") + " sent</p>", content_type="text/html")
async def cmb_tg_group(r):        # ... into a group with its key; "bad" is a wrong key
    NOTIFIED.append(["tg_group", r.query.get("apikey"), r.query.get("text")])
    if r.query.get("apikey") == "bad": return web.Response(text="<p>Error: wrong apikey</p>", content_type="text/html")
    return web.Response(text="<p>Message sent to the group</p>", content_type="text/html")
async def notified(r): return web.json_response(NOTIFIED)
async def template(r):
    return web.Response(text=json.dumps([{"id": "wz", "name": "Wohnzimmer", "entities": ["light.wohnzimmer", "cover.rollo"]}]))
app = web.Application()
app.add_routes([web.get("/states", states), web.post("/services/{d}/{s}", service), web.get("/_calls", calls), web.get("/_calldata", call_data), web.get("/_set", set_state), web.get("/_rename", rename), web.post("/_energy", set_energy), web.post("/_extra", set_extra), web.get("/services", services_list), web.get("/_callmebot", callmebot), web.get("/_notified", notified),
                web.get("/_cmb/text.php", cmb_tg_user), web.get("/_cmb/telegram/group.php", cmb_tg_group),
                web.get("/websocket", websocket), web.post("/template", template), web.get("/camera_proxy/{e}", camera_proxy),
                web.get("/hls/{token}/{name:.+}", hls), web.get("/_hls", hls_seen),
                web.get("/calendars", calendars), web.get("/calendars/{id}", calendar_events), web.get("/_stats", stats_asked),
                web.get("/states/{e}", one_state), web.get("/api/image/serve/{id}/{size}", image_serve)])
web.run_app(app, port=int(os.environ.get("MOCK_PORT", "8123")), print=None)
