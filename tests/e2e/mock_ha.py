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
LEVELS_ASKED = []  # the charge of batteries asked for (types mean, min, max; #515): [ids, period]
EXTRA = {}         # more entities with their attributes (#406: music, vacuum, fan, alarm ...): POST /_extra {entity: {state, attributes[, platform][, device]}}, {} takes them away; with "platform" or "device" also in the entity registry (#460, #483: a phone and its battery)
FLOWS = []         # #501: the config flows started and their steps ("＋ Zähler anlegen": Home Assistant's Integral helper), GET /_flows
CAL_NEW = {}       # #495: the events "＋ Termin" of the calendar card made: {calendar: [event]}; GET /_calreset forgets them
TODO = {}          # #490: the to-do lists: {entity: [{"uid", "summary", "status"}]}, POST /_todo; changed by todo.add_item / update_item / remove_completed_items
VOICE = {"assist": True, "text": "Welche Fenster sind offen", "heard": []}   # #509: Assist with speech-to-text (POST /_voice {assist, text}); heard: bytes of audio per run
HIST = {}          # #490: the history of some entities (a machine's power): {entity: [[iso time, state]]}, POST /_hist; others get the hourly numbers
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
    if dom == "todo" and e in TODO:   # #490: the shopping list
        items = TODO[e]
        CALL_DATA.append([svc, e, {k: v for k, v in body.items() if k != "entity_id"}])
        if svc == "add_item": items.append({"uid": f"u{len(items) + 1}_{len(CALLS)}", "summary": body["item"], "status": "needs_action"})
        if svc == "update_item":
            for it in items:
                if it["uid"] == body["item"]: it["status"] = body["status"]
        if svc == "remove_completed_items": TODO[e] = [it for it in items if it["status"] != "completed"]
        return web.json_response([])
    if dom == "calendar" and svc == "create_event":     # #495: "＋ Termin" of the calendar card: kept, in the calendar's events from now on
        CALL_DATA.append([svc, e, {k: v for k, v in body.items() if k != "entity_id"}])
        when = lambda k: {"dateTime": body[k + "_date_time"]} if k + "_date_time" in body else {"date": body[k + "_date"]}
        CAL_NEW.setdefault(e, []).append({"start": when("start"), "end": when("end"), "summary": body["summary"]})
        return web.json_response([])
    if dom == "notify":           # #414: a message of the add-on; #460: notify.send_message to notify entities
        NOTIFIED.append(["ha_entity", ",".join(e), body.get("message")] if svc == "send_message" and isinstance(e, list) else ["ha", svc, body.get("message")])
        return web.json_response([])
    if isinstance(e, list):       # several at once (homeassistant.turn_on of the holiday alarm's sirens, #456): only noted
        return web.json_response([])
    if e in EXTRA:                # #406: what the device does with the call, the data kept for the test
        x, a = EXTRA[e], EXTRA[e].setdefault("attributes", {})
        CALL_DATA.append([svc, e, {k: v for k, v in body.items() if k != "entity_id"}])
        flips = {"media_play_pause": "paused" if x["state"] == "playing" else "playing", "start": "cleaning", "pause": "paused", "return_to_base": "returning",
                 "alarm_arm_home": "armed_home", "alarm_arm_away": "armed_away", "turn_on": "on", "turn_off": "off",
                 "play_media": "playing", "media_pause": "paused"}
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
    run = None                    # #509: the Assist run that takes audio: [id, bytes heard]
    async for msg in ws:
        if msg.type == web.WSMsgType.BINARY:      # audio of an Assist run: the first byte is the handler id; that byte alone ends it
            if run and msg.data[:1] == b"\x01":
                if len(msg.data) > 1: run[1] += len(msg.data) - 1
                else:
                    VOICE["heard"].append(run[1])
                    await ws.send_json({"id": run[0], "type": "event", "event": {"type": "stt-start", "data": {"engine": "stt.mock"}}})
                    await ws.send_json({"id": run[0], "type": "event", "event": {"type": "stt-end", "data": {"stt_output": {"text": VOICE["text"] if run[1] else ""}}}})
                    await ws.send_json({"id": run[0], "type": "event", "event": {"type": "run-end", "data": None}})
                    run = None
            continue
        m = json.loads(msg.data)
        if m.get("type") == "assist_pipeline/pipeline/list":    # #509: one pipeline, with speech-to-text while VOICE["assist"]
            p = {"id": "p1", "name": "Home Assistant", "language": "de", "stt_engine": "stt.mock" if VOICE["assist"] else None, "stt_language": "de-DE"}
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": {"pipelines": [p], "preferred_pipeline": "p1"}})
            continue
        if m.get("type") == "assist_pipeline/run":
            ok = VOICE["assist"] and m.get("start_stage") == "stt" and (m.get("input") or {}).get("sample_rate") == 16000
            await ws.send_json({"id": m["id"], "type": "result", "success": ok, "result": None, **({} if ok else {"error": {"code": "stt-provider-missing"}})})
            if ok:
                run = [m["id"], 0]
                await ws.send_json({"id": m["id"], "type": "event", "event": {"type": "run-start", "data": {"pipeline": "p1", "language": "de",
                                    "runner_data": {"stt_binary_handler_id": 1, "timeout": 300}}}})
            continue
        if m.get("type") == "camera/stream":
            ok = m.get("entity_id") == "camera.flur"
            await ws.send_json({"id": m["id"], "type": "result", "success": ok, "result": {"url": f"/api/hls/{HLS_TOKEN}/master_playlist.m3u8"} if ok else None,
                                "error": None if ok else {"code": "start_stream_failed", "message": "no stream"}})
            continue
        if m.get("type") == "subscribe_events":
            (SUBS if m.get("event_type", "state_changed") == "state_changed" else REG_SUBS).append((ws, m["id"]))
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": None})
        elif m.get("type") == "todo/item/list":     # #490: the items of a to-do list
            ok = m.get("entity_id") in TODO
            await ws.send_json({"id": m["id"], "type": "result", "success": ok, "result": {"items": TODO.get(m.get("entity_id"), [])} if ok else None,
                                **({} if ok else {"error": {"code": "not_found"}})})
        elif m.get("type") == "get_states":         # the security view recorder starts with all states
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": [state_of(e) for e in STATE]})
        elif m.get("type") == "config/entity_registry/list":    # the watch for renamed entities (and the devices of the energy meters, #407)
            await ws.send_json({"id": m["id"], "type": "result", "success": True,
                                "result": [{"entity_id": e, "platform": "mock", "unique_id": u, "device_id": DEVICES.get(u)} for e, u in REGISTRY.items()]
                                + [{"entity_id": e, "platform": "mock", "unique_id": "energy_" + e, "device_id": d} for e, d in ENERGY["registry"].items()]
                                + [{"entity_id": e, "platform": v.get("platform", "mock"), "unique_id": "extra_" + e, "device_id": v.get("device"), "config_entry_id": v.get("entry")}
                                   for e, v in EXTRA.items() if "platform" in v or "device" in v or "entry" in v]})
        elif m.get("type") == "energy/get_prefs":               # the energy dashboard (#407): "not_found" while it is not set up
            ok = ENERGY["prefs"] is not None
            await ws.send_json({"id": m["id"], "type": "result", "success": ok, "result": ENERGY["prefs"] if ok else None,
                                **({} if ok else {"error": {"code": "not_found", "message": "No prefs"}})})
        elif m.get("type") == "recorder/statistics_during_period" and "change" not in (m.get("types") or []):   # #515: the charge of batteries
            LEVELS_ASKED.append([m.get("statistic_ids"), m.get("period")])
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": level_rows(m)})
        elif m.get("type") == "recorder/statistics_during_period":   # #479: the history of the page "Energie": a little per period
            STATS_ASKED.append([m.get("statistic_ids"), m.get("period")])
            await ws.send_json({"id": m["id"], "type": "result", "success": True, "result": stat_rows(m)})
        elif m.get("type") == "recorder/get_statistics_metadata":
            await ws.send_json({"id": m["id"], "type": "result", "success": True,
                                "result": [{"statistic_id": i, "unit_class": "power" if is_power(i) else "volume" if "wasser" in i or "gas" in i else "energy",
                                            "statistics_unit_of_measurement": "W" if is_power(i) else "m³" if "wasser" in i or "gas" in i else "kWh"}
                                           for i in m.get("statistic_ids") or []]})
        elif "id" in m:
            await ws.send_json({"id": m["id"], "type": "result", "success": False, "error": {"code": "unknown_command"}})
    SUBS[:] = [x for x in SUBS if x[0] is not ws]
    REG_SUBS[:] = [x for x in REG_SUBS if x[0] is not ws]
    return ws
def is_power(i):                  # #503: an added entity in W is a power sensor in the statistics
    return (EXTRA.get(i, {}).get("attributes") or {}).get("unit_of_measurement") in ("W", "kW")
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
            if is_power(i):           # #503: a power sensor has its time-weighted mean (in kW: the add-on asks for that unit), no change
                rows.append({"start": t.timestamp() * 1000, "end": (t + step).timestamp() * 1000, "mean": 0.5})
            else:
                rows.append({"start": t.timestamp() * 1000, "end": (t + step).timestamp() * 1000, "change": round(base(i) * per, 3)})
            t += step
        out[i] = rows
    return out
def level_rows(m):
    """#515: the charge (%) of every sensor in every 5 minutes / hour / day between start and end (not after now): mean, min and max,
    up and down through the rows; a sensor with "nostat" in its name has no statistics (no state_class: the add-on reads its history)"""
    import datetime as dt
    a, b = dt.datetime.fromisoformat(m["start_time"]), min(dt.datetime.fromisoformat(m["end_time"]), dt.datetime.now(dt.timezone.utc))
    step = {"5minute": dt.timedelta(minutes=5), "hour": dt.timedelta(hours=1), "day": dt.timedelta(days=1)}[m["period"]]
    out = {}
    for i in m.get("statistic_ids") or []:
        if "nostat" in i:
            continue
        rows, t, k = [], a, 0
        while t + step <= b:
            v = 20 + (k % 13) * 6
            rows.append({"start": t.timestamp() * 1000, "end": (t + step).timestamp() * 1000, "mean": v, "min": v - 4, "max": v + 4})
            t += step; k += 1
        out[i] = rows
    return out
async def levels_asked(r): return web.json_response(LEVELS_ASKED)
async def calendars(r):           # #479: Home Assistant's calendars and their events (page "Heute")
    return web.json_response([{"entity_id": "calendar.familie", "name": "Familie"}, {"entity_id": "calendar.muell", "name": "Müllabfuhr"}])
async def calendar_events(r):
    import datetime as dt
    start = dt.datetime.fromisoformat(r.query["start"].replace("Z", "+00:00")).astimezone()
    day = start.date() + dt.timedelta(days=1) if start.hour >= 12 else start.date()        # the first day asked for (local)
    new = CAL_NEW.get(r.match_info["id"], [])
    if r.match_info["id"] == "calendar.muell":
        return web.json_response([{"start": {"date": (day + dt.timedelta(days=1)).isoformat()}, "end": {"date": (day + dt.timedelta(days=2)).isoformat()}, "summary": "Gelber Sack"}] + new)
    at = dt.datetime.combine(day, dt.time(15, 0)).astimezone()
    return web.json_response([{"start": {"dateTime": at.isoformat()}, "end": {"dateTime": (at + dt.timedelta(hours=1)).isoformat()}, "summary": "Zahnarzt"}] + new)
async def flow_start(r):          # #501: a config flow of Home Assistant (only the Integral helper is known here)
    body = await r.json()
    FLOWS.append(["start", body.get("handler")])
    if body.get("handler") != "integration": return web.json_response({"message": "Invalid handler specified"}, status=404)
    return web.json_response({"type": "form", "flow_id": f"f{len(FLOWS)}", "step_id": "user", "data_schema": []})
async def flow_step(r):           # the helper made: a counter in kWh that names its power sensor as its source (like Home Assistant's)
    import re as _re
    body = await r.json()
    FLOWS.append(["step", body])
    eid = "sensor." + _re.sub(r"[^a-z0-9]+", "_", body["name"].lower()).strip("_")
    EXTRA[eid] = {"state": "0.0", "entry": "e_" + eid, "attributes": {"friendly_name": body["name"], "unit_of_measurement": "kWh", "state_class": "total", "source": body["source"]}}
    return web.json_response({"type": "create_entry", "result": {"entry_id": "e_" + eid}, "title": body["name"]})
async def flows(r): return web.json_response(FLOWS)
async def cal_reset(r):
    CAL_NEW.clear()
    return web.json_response({"ok": True})
async def stats_asked(r): return web.json_response(STATS_ASKED)
async def one_state(r):           # #483: one state (a person's picture is looked up there)
    e = r.match_info["e"]
    if e in EXTRA: return web.json_response({"entity_id": e, **EXTRA[e]})
    if e in STATE: return web.json_response(state_of(e))
    return web.json_response({"message": "Entity not found."}, status=404)
async def image_serve(r): return web.Response(body=PNG, content_type="image/png")   # #483: an uploaded picture of a person
HISTORY_ASKED = []    # #484: the histories the add-on asked for: [entity, start]
async def history(r):             # #484: Home Assistant's history of one entity (a card "Verlauf"): a value every hour, 10 to 20
    import datetime as dt
    e = r.query.get("filter_entity_id", ""); HISTORY_ASKED.append([e, r.match_info["start"]])
    if any(x in HIST for x in e.split(",")):         # #490: several entities, those set by the test as they were set
        return web.json_response([[{"entity_id": x, "state": HIST[x][0][1], "last_changed": HIST[x][0][0]}] + [{"state": v, "last_changed": t} for t, v in HIST[x][1:]]
                                  for x in e.split(",") if x in HIST])
    start = dt.datetime.fromisoformat(r.match_info["start"].replace(" ", "+").replace("Z", "+00:00"))
    now = dt.datetime.now(dt.timezone.utc)
    rows, t, i = [], start, 0
    while t < now:
        rows.append({"state": str(15 + 5 * ((i % 10) - 5) / 5), "last_changed": t.isoformat()}); t += dt.timedelta(hours=1); i += 1
    if rows: rows[0]["entity_id"] = e
    return web.json_response([rows] if rows else [])
async def history_asked(r): return web.json_response(HISTORY_ASKED)
async def set_todo(r): TODO.clear(); TODO.update(await r.json()); return web.json_response(TODO)
async def set_hist(r): HIST.clear(); HIST.update(await r.json()); return web.json_response(HIST)
async def media_proxy(r): return web.Response(body=PNG, content_type="image/png")   # #490: the picture of what a player plays
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
async def set_voice(r):           # test helper (#509): {"assist": false} = no speech-to-text, {"text": ...} = what is heard; answers what was heard
    VOICE.update({k: v for k, v in (await r.json()).items() if k in ("assist", "text")})
    return web.json_response(VOICE)
async def template(r):
    return web.Response(text=json.dumps([{"id": "wz", "name": "Wohnzimmer", "entities": ["light.wohnzimmer", "cover.rollo"]}]))
app = web.Application()
app.add_routes([web.get("/states", states), web.post("/services/{d}/{s}", service), web.get("/_calls", calls), web.get("/_calldata", call_data), web.get("/_set", set_state), web.get("/_rename", rename), web.post("/_energy", set_energy), web.post("/_extra", set_extra), web.get("/services", services_list), web.get("/_callmebot", callmebot), web.get("/_notified", notified), web.post("/_voice", set_voice),
                web.get("/_cmb/text.php", cmb_tg_user), web.get("/_cmb/telegram/group.php", cmb_tg_group),
                web.get("/websocket", websocket), web.post("/template", template), web.get("/camera_proxy/{e}", camera_proxy),
                web.get("/hls/{token}/{name:.+}", hls), web.get("/_hls", hls_seen),
                web.get("/calendars", calendars), web.get("/calendars/{id}", calendar_events), web.get("/_calreset", cal_reset), web.post("/config/config_entries/flow", flow_start), web.post("/config/config_entries/flow/{id}", flow_step), web.get("/_flows", flows), web.get("/_stats", stats_asked), web.get("/_levels", levels_asked),
                web.get("/states/{e}", one_state), web.get("/api/image/serve/{id}/{size}", image_serve),
                web.get("/history/period/{start}", history), web.get("/_history", history_asked),
                web.post("/_todo", set_todo), web.post("/_hist", set_hist), web.get("/api/media_player_proxy/{e}", media_proxy)])
web.run_app(app, port=int(os.environ.get("MOCK_PORT", "8123")), print=None)
