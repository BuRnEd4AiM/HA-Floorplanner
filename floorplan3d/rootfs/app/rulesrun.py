"""The add-on running its own heating rules (heatrules.py) and routines (flows.py) (#546), also with no screen open: one websocket to Home
Assistant while a rule is on (all states, then every change), a look every few seconds for the clock, and what the pages ask (🚀 boost,
"Trotzdem heizen", a routine's button, "Jetzt ausprobieren"). The calls go to Home Assistant through env.call (REST, server.py); what was
done goes into a log the page ▶ Abläufe shows; the state of every room and lane goes to the open pages (env.publish). What the heating
rules saw and did (a window opened, a thermostat changed and by whom, the calls and whether Home Assistant took them, the connection) goes
into a journal of its own (heatlog.py, #579), the page 🌡 Klima → 🩺 Protokoll shows it.

server.py makes one Rules and runs run_rules as a background task; the rules themselves stay pure and are tested on their own. The loop
is tested with a stand-in websocket (tests/test_rulesrun.py)."""
import asyncio
import json
import logging
import time

import flows as fl
import heatlog as hl
import heatrules as hr
import roommap as rm
import roomsensors as rs

log = logging.getLogger("floorplan3d.rules")

MAX_LOG = 200
CHECK = 15.0           # seconds between two looks at the clock
SAVE_EVERY = 5.0       # the memory is written at most this often
TRACE_EVERY = 60.0     # the journal of the heating (🩺 Protokoll, #579) at most this often (it is bigger)
HEAT_DOMAINS = ("person.", "weather.", "climate.")
NOTIFY_EVENT = "fp3d_notify"   # an automation of the add-on (#548) asks it to send a message its own way


class Rules:
    """what the server and the loop share: the rules as an admin set them, the memory of both engines and the log, what the pages see"""
    def __init__(self, cfg=None, mem=None, trace=None):
        cfg = cfg if isinstance(cfg, dict) else {}
        mem = mem if isinstance(mem, dict) else {}
        self.cfg = {"heat": hr.clean_rules(cfg.get("heat")), "flows": fl.clean_flows(cfg.get("flows"))}
        self.mem = {"heat": hr.clean_mem(mem.get("heat")), "flows": fl.clean_mem(mem.get("flows")),
                    "sensors": rs.clean_mem(mem.get("sensors")),             # 🌡 Raumfühler (roomsensors.py, #573)
                    "log": [x for x in mem.get("log") or [] if isinstance(x, dict)][-MAX_LOG:]}
        self.status = {"rooms": {}, "lanes": {}, "sensors": {}, "cal": {}, "plat": {}}
        self.trace = [x for x in trace if isinstance(x, dict) and x.get("k")][-hl.MAX:] if isinstance(trace, list) else []   # 🩺 (#579)
        self.dirty = False                 # the journal has something not written yet
        self.sent = {}                     # {thermostat: what the add-on sent it lately} (heatlog.remember)
        self.me = None                     # the add-on's own user id in Home Assistant, once seen
        self.states, self.rooms, self.since = {}, None, None   # what the running loop sees (the page 🩺 asks), connected since
        self.connected = False
        self.queue: asyncio.Queue | None = None
        self.wake: asyncio.Event | None = None

    def bind(self):
        """the queue and the wake-up belong to the running loop"""
        if self.queue is None:
            self.queue, self.wake = asyncio.Queue(), asyncio.Event()

    def ask(self, *req):
        """a wish of a page for the loop ("room", key, act) | ("run", flow, lane, test) | ("cfg",) | ("wish", thermostat, temperature)"""
        self.bind()
        self.queue.put_nowait(req)
        self.wake.set()

    def local(self) -> list:
        """the routines the add-on runs itself; one with ha: true is an automation of Home Assistant (#548), Home Assistant runs it"""
        return [f for f in self.cfg["flows"] if not f["ha"]]

    def listen(self) -> bool:
        """an automation of the add-on sends a message the add-on's own way (WhatsApp, Telegram): it fires fp3d_notify (haflows.py)"""
        return any(f["ha"] and f["on"] and any(b["k"] == "notify" for x in f["lanes"] for b in x["blocks"]) for f in self.cfg["flows"])

    def active(self) -> bool:
        """is there anything to do: a rule or routine on, a sensor in a room, a boost or routine running, a thermostat still to put back, a
        wish waiting"""
        h, f = self.mem["heat"], self.mem["flows"]
        return (hr.any_on(self.cfg["heat"]) or rs.any_on(self.cfg["heat"]["sensors"]) or bool(self.mem["sensors"]["t"])
                or any(x["on"] for x in self.local()) or self.listen() or bool(h["boost"]) or bool(f["runs"])
                or any(t.get("ov") or t.get("level") for t in h["t"].values()) or bool(self.queue and not self.queue.empty()))

    def note(self, entries, now):
        for x in entries:
            self.mem["log"].append({"t": round(now), **x})
        del self.mem["log"][:-MAX_LOG]

    def journal(self, entries):
        """entries for the journal of the heating (heatlog.py)"""
        if hl.add(self.trace, entries):
            self.dirty = True

    def link(self, on, err=None):
        now = time.time()
        if hl.link(self.trace, on, now, err, quick=self.since is not None and now - self.since < 120):
            self.dirty = True


class _Msg:
    """a text message of the websocket, kept for later"""
    type = 1

    def __init__(self, data):
        self.data = data


async def _ask_ws(ws, msg_id, msg, pending):
    """one command over the websocket: its result (events coming in meanwhile are kept in pending)"""
    await ws.send_json({"id": msg_id, **msg})
    while True:
        m = await asyncio.wait_for(ws.receive_json(), 30)
        if m.get("id") == msg_id and m.get("type") == "result":
            return m.get("result") if m.get("success") else None
        pending.append(m)


async def run_rules(rules: Rules, *, connect, env, check: float = CHECK, idle: float = 5.0):
    """Runs while the add-on runs; never raises. env: async rooms() (roommap.rooms_of of every house), local() (the time of day in Home
    Assistant's zone), call(domain, service, data) -> bool, notify(text), save(mem), publish(status), guard_armed(), weather(states) (the
    weather entity)"""
    rules.bind()
    rules.journal([{"t": round(time.time()), "k": "start", "v": getattr(env, "version", None)}])
    delay = 1
    while True:
        try:
            if not rules.active():
                rules.connected = False
                rules.wake.clear()
                try:
                    await asyncio.wait_for(rules.wake.wait(), idle)
                except asyncio.TimeoutError:
                    pass
                continue
            async with connect() as ws:
                pending = []
                states = {s["entity_id"]: s for s in (await _ask_ws(ws, 1, {"type": "get_states"}, pending) or []) if isinstance(s, dict) and s.get("entity_id")}
                await _ask_ws(ws, 2, {"type": "subscribe_events", "event_type": "state_changed"}, pending)
                await _ask_ws(ws, 3, {"type": "subscribe_events", "event_type": NOTIFY_EVENT}, pending)
                rules.connected, delay, rules.since = True, 1, time.time()
                rules.link(True)
                await _loop(rules, ws, states, pending, env, check)
        except asyncio.CancelledError:
            rules.connected = False
            raise
        except Exception as err:  # noqa: BLE001 - must never stop the add-on
            rules.connected = False
            log.info("heating rules and routines interrupted (%s), again in %ss", err, delay)
            rules.link(False, f"{type(err).__name__}: {err}")
            _save_trace(rules, env)
            rules.since = None
            await asyncio.sleep(delay)
            delay = min(60, delay * 2)


def _save_trace(rules, env):
    if rules.dirty and hasattr(env, "save_trace"):
        rules.dirty = False
        env.save_trace(rules.trace)


async def _loop(rules: Rules, ws, states: dict, pending: list, env, check: float):
    q = rules.queue

    async def reader():
        while True:
            msg = await ws.receive()
            await q.put(("ws", msg))
            if msg.type != 1:                               # aiohttp.WSMsgType.TEXT; anything else: closed or an error
                return

    for m in pending:                                       # events that came while the states were asked for
        q.put_nowait(("ws", _Msg(json.dumps(m))))
    task = asyncio.create_task(reader())
    saved, sig, traced = 0.0, "", time.time()
    rules.states = states
    try:
        cache = {"rooms": await env.rooms(), "at": time.time()}
        cache["idx"], rules.rooms = hl.index(cache["rooms"]), cache["rooms"]
        await _look(rules, states, cache, env, clock=True)
        last_tick = time.time()
        while rules.active() or not q.empty():
            try:
                req = await asyncio.wait_for(q.get(), max(0.05, check - (time.time() - last_tick)))
            except asyncio.TimeoutError:
                req = None
            now = time.time()
            if now - cache["at"] > 60:                     # the plans change rarely: their rooms anew every minute
                cache.update(rooms=await env.rooms(), at=now)
                cache["idx"], rules.rooms = hl.index(cache["rooms"]), cache["rooms"]
            if req is None or now - last_tick >= check:
                last_tick = now
                await _look(rules, states, cache, env, clock=True)
            if req is not None:
                await _wish(rules, req, states, cache, env)
            st = {k: rules.status[k] for k in ("rooms", "lanes", "sensors", "cal", "plat")}
            s = json.dumps(st, sort_keys=True, default=str)
            if s != sig:
                sig = s
                await env.publish(st)
            if time.time() - saved > SAVE_EVERY:
                saved = time.time()
                env.save(rules.mem)
            if time.time() - traced > TRACE_EVERY:
                traced = time.time()
                _save_trace(rules, env)
    finally:
        task.cancel()
        env.save(rules.mem)
        _save_trace(rules, env)


def _ctx(states, cache, env, now, local):
    rooms = cache["rooms"]
    idx = rm.room_index(rooms)
    return {"states": states, "now": now, "local": local, "weather": env.weather(states),
            "names": {e: (s.get("attributes") or {}).get("friendly_name") or e for e, s in states.items()},
            "room_of": lambda e: idx.get(e, ""), "in_room": lambda key, dom: rm.in_room(rooms, key, dom),
            "room_names": {r["key"]: r["name"] for r in rooms}}


async def _heat(rules, states, cache, env, now, local):
    """the heating rules, then the sensors in the rooms: a thermostat whose target is moved by its sensor shows the rules its wish, and a
    target of the rules for it becomes the wish (roomsensors.virtual, route); one the window rule holds is the rules' alone (#577)"""
    smem = rules.mem["sensors"]
    mem, calls, status, lines = hr.step(rules.cfg["heat"], cache["rooms"], rs.virtual(states, smem, hr.held(rules.mem["heat"])), now, local,
                                        rules.mem["heat"], guard_armed=env.guard_armed(), weather=env.weather(states))
    rules.journal(hl.rooms(rules.status["rooms"], status, now) + [{"t": round(now), "k": "rule", **x} for x in lines])
    rules.mem["heat"], rules.status["rooms"] = mem, status
    rules.note([{"src": "heat", **x} for x in lines], now)
    hold = hr.held(mem)
    for e, svc, data in rs.route(calls, smem, hold):
        await _call(rules, env, "climate", svc, {"entity_id": e, **data}, "heat", now)
    await _sensors(rules, states, env, now, hold)


async def _call(rules, env, dom, svc, data, src, now):
    """a call of the heating rules or the room sensors to Home Assistant, kept in the journal with whether it was taken"""
    e = data.get("entity_id")
    if dom == "climate":
        hl.remember(rules.sent, e, svc, data, now)
    ok = await env.call(dom, svc, data)
    v = next((data[k] for k in ("temperature", "hvac_mode", "value", "option") if k in data), None)
    rules.journal([{"t": round(now), "k": "call", "ent": e, "dom": dom, "svc": svc, "v": v, "ok": ok is not False, "src": src}])
    return ok


async def _sensors(rules, states, env, now, hold=()):
    """🌡 Raumfühler (#573): the thermostats with a sensor in the room (hold: those the window rule holds, #577)"""
    parts = rs.parts_of(env.parts() if hasattr(env, "parts") else {})
    rules.mem["sensors"], calls, status, lines = rs.step(rules.cfg["heat"]["sensors"], states, parts, rules.mem["sensors"], now, hold)
    plat = env.platforms() if hasattr(env, "platforms") else {}
    rules.status.update(sensors=status, cal=rs.caps(states, parts), plat={e: p for e, p in plat.items() if e in states})
    rules.note([{"src": "sensor", **x} for x in lines], now)
    rules.journal([{"t": round(now), "k": "sensor", "ent": x.get("ent"), "act": x["act"], "v": x.get("v"), "why": x.get("why")}
                   for x in lines if x.get("act") in ("wish", "back")])
    for dom, svc, data in calls:
        await _call(rules, env, dom, svc, data, "sensor", now)


async def _do(rules, calls, lines, now, env):
    rules.note(lines, now)
    for dom, svc, data in calls:
        if dom == "notify":
            await env.notify(data.get("message", ""))
        else:
            await env.call(dom, svc, data)


async def _look(rules, states, cache, env, clock=False, changed=None):
    now, local = time.time(), env.local()
    ctx = _ctx(states, cache, env, now, local)
    if changed:
        eid, old, new = changed
        rules.mem["flows"], calls, lines = fl.changed(rules.local(), rules.mem["flows"], eid, old, new, ctx)
        await _do(rules, calls, lines, now, env)
    if clock:
        rules.mem["flows"], calls, lines = fl.tick(rules.local(), rules.mem["flows"], ctx)
        await _do(rules, calls, lines, now, env)
    if clock or changed and _heat_cares(changed[0], cache["rooms"], rules):
        await _heat(rules, states, cache, env, now, local)
    rules.status["lanes"] = fl.view(rules.local(), rules.mem["flows"], now)


def _journal(rules, cache, eid, old, new, states):
    """🩺 (#579): a contact or thermostat of a room changed"""
    now, uses = time.time(), cache["idx"][eid]
    x = hl.contact(eid, old, new, uses, now, {r["key"]: r for r in cache["rooms"]}, rules.cfg["heat"]["window"])
    room = next((u[0] for u in uses if u[1] == "climate"), None)
    if x is None and room:
        x = hl.climate(eid, old, new, rules.sent, now, room, lambda: hl.users(states), rules.me)
        uid = ((new or {}).get("context") or {}).get("user_id")
        if x and x["by"] == "addon" and x.get("ago") is not None and x["ago"] <= 5 and uid:
            rules.me = uid                                  # its own call came back at once: this is the add-on's user
    if x:
        rules.journal([x])


def _heat_cares(eid, rooms, rules) -> bool:
    sens = rules.cfg["heat"]["sensors"]["map"]
    return (eid.startswith(HEAT_DOMAINS) or any(eid in r["windows"] or eid in r["outer"] for r in rooms)
            or any(eid == x["s"] for x in sens.values()) or any(eid in (t.get("ent"), t.get("sel")) for t in rules.mem["sensors"]["t"].values()))


async def _wish(rules, req, states, cache, env):
    kind = req[0]
    if kind == "ws":
        msg = req[1]
        if msg.type != 1:
            raise ConnectionError("websocket closed")
        data = json.loads(msg.data)
        ev = (data.get("event") or {}) if data.get("type") == "event" else {}
        d = ev.get("data") or {}
        if ev.get("event_type") == NOTIFY_EVENT and isinstance(d.get("message"), str) and d["message"].strip():
            text = d["message"].strip()[:300]
            rules.note([{"src": "flow", "act": "notify", "name": "Home Assistant", "v": text}], time.time())
            await env.notify(text)
            return
        eid = d.get("entity_id")
        if ev.get("event_type") != "state_changed" or not isinstance(eid, str):
            return
        old_state = states.get(eid)
        old = (old_state or {}).get("state")
        new_state = d.get("new_state")
        if new_state:
            states[eid] = new_state
        else:
            states.pop(eid, None)
        new = (new_state or {}).get("state")
        if eid in cache["idx"]:
            _journal(rules, cache, eid, old_state, new_state, states)
        await _look(rules, states, cache, env, changed=(eid, old, new))
    elif kind == "room":
        _, key, act = req
        now = time.time()
        if act == "boost":
            rules.mem["heat"] = hr.boost(rules.mem["heat"], key, now, rules.cfg["heat"])
        elif act == "skip":
            rules.mem["heat"] = hr.skip(rules.mem["heat"], key)
        await _heat(rules, states, cache, env, now, env.local())
    elif kind == "run":
        _, fid, lane, test = req
        now = time.time()
        out = fl.run_now(rules.cfg["flows"], rules.mem["flows"], fid, lane, _ctx(states, cache, env, now, env.local()), test)
        if out:
            rules.mem["flows"], calls, lines = out
            await _do(rules, calls, lines, now, env)
            rules.status["lanes"] = fl.view(rules.local(), rules.mem["flows"], now)
    elif kind == "cfg":
        await _look(rules, states, cache, env, clock=True)
    elif kind == "wish":                                    # a page set a thermostat whose target is moved by its sensor (#573)
        _, e, temp = req
        if rs.set_wish(rules.mem["sensors"], e, temp):
            await _heat(rules, states, cache, env, time.time(), env.local())
