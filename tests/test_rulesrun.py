"""The loop that runs the heating rules and routines (rulesrun.py, #546) against a stand-in websocket of Home Assistant: idle while nothing
is on, a window opens and shuts, 🚀 boost from the page, a routine's button."""
import asyncio
import contextlib
import datetime
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import rulesrun as rr  # noqa: E402

ROOM = {"key": "h/wz", "name": "Wohnzimmer", "climates": ["climate.wz"], "windows": ["binary_sensor.fenster"], "doors": [], "outer": [],
        "entities": ["climate.wz", "light.wz"]}


class Msg:
    type = 1

    def __init__(self, data):
        self.data = json.dumps(data)


class FakeHa:
    def __init__(self):
        self.states = {"climate.wz": {"entity_id": "climate.wz", "state": "heat", "attributes": {"temperature": 21.0, "hvac_modes": ["off", "heat"]}},
                       "binary_sensor.fenster": {"entity_id": "binary_sensor.fenster", "state": "off", "attributes": {}},
                       "light.wz": {"entity_id": "light.wz", "state": "off", "attributes": {}}}
        self.queue, self.connects = asyncio.Queue(), 0

    async def send_json(self, obj):
        result = {"get_states": list(self.states.values()), "subscribe_events": None}[obj["type"]]
        await self.queue.put({"id": obj["id"], "type": "result", "success": True, "result": result})

    async def receive_json(self):
        return await self.queue.get()

    async def receive(self):
        return Msg(await self.queue.get())

    async def set(self, e, s):
        new = {**self.states[e], "state": s}
        self.states[e] = new
        await self.queue.put({"type": "event", "event": {"event_type": "state_changed", "data": {"entity_id": e, "new_state": new}}})


class Env:
    def __init__(self, ha):
        self.ha, self.calls, self.told, self.published, self.saved = ha, [], [], [], []

    async def rooms(self):
        return [ROOM]

    def local(self):
        return datetime.datetime(2026, 10, 26, 7, 42)

    async def call(self, dom, svc, data):
        self.calls.append((dom, svc, data))
        e = data.get("entity_id")
        if svc == "set_hvac_mode":
            await self.ha.set(e, data["hvac_mode"])
        return True

    async def notify(self, text):
        self.told.append(text)

    def save(self, mem):
        self.saved.append(mem)

    async def publish(self, st):
        self.published.append(st)

    def guard_armed(self):
        return False

    def weather(self, states):
        return None

    def own_window(self, states):
        return set()


async def until(cond, seconds=2.0):
    for _ in range(int(seconds / 0.02)):
        if cond():
            return True
        await asyncio.sleep(0.02)
    return cond()


async def test_nothing_on_no_connection_then_a_window_switches_the_heating():
    ha = FakeHa()

    @contextlib.asynccontextmanager
    async def connect():
        ha.connects += 1
        yield ha

    rules, env = rr.Rules(), Env(ha)
    task = asyncio.create_task(rr.run_rules(rules, connect=connect, env=env, check=0.2, idle=0.05))
    await asyncio.sleep(0.2)
    assert ha.connects == 0 and not rules.connected                           # nothing on: Home Assistant is left alone
    rules.cfg = rr.Rules({"heat": {"window": {"on": True, "delay": 0}}}).cfg
    rules.ask("cfg")
    assert await until(lambda: rules.connected)
    await ha.set("binary_sensor.fenster", "on")
    assert await until(lambda: ("climate", "set_hvac_mode", {"entity_id": "climate.wz", "hvac_mode": "off"}) in env.calls)
    assert await until(lambda: any(p["rooms"].get("h/wz", {}).get("why") == "window" for p in env.published))
    assert rules.mem["log"][-1]["src"] == "heat" and rules.mem["log"][-1]["why"] == "window" and rules.mem["log"][-1]["t"] > 0
    await ha.set("binary_sensor.fenster", "off")
    assert await until(lambda: ("climate", "set_hvac_mode", {"entity_id": "climate.wz", "hvac_mode": "heat"}) in env.calls)   # as before
    rules.ask("room", "h/wz", "boost")
    assert await until(lambda: env.calls[-1] == ("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 24.0}))
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    assert env.saved and env.saved[-1]["heat"]["boost"]


async def test_a_routines_button_and_a_message():
    ha = FakeHa()

    @contextlib.asynccontextmanager
    async def connect():
        yield ha

    rules = rr.Rules({"flows": [{"id": "f_kino", "name": "Kino", "lanes": [{"id": "l1", "blocks": [
        {"k": "button"}, {"k": "switch", "ents": ["light.wz"], "do": "on", "pct": 30}, {"k": "notify", "text": "Kino an"}]}]}]})
    env = Env(ha)
    task = asyncio.create_task(rr.run_rules(rules, connect=connect, env=env, check=0.2, idle=0.05))
    assert await until(lambda: rules.connected)
    rules.ask("run", "f_kino", "l1", False)
    assert await until(lambda: env.told == ["Kino an"])
    assert ("light", "turn_on", {"entity_id": "light.wz", "brightness_pct": 30}) in env.calls
    assert [x["act"] for x in rules.mem["log"]] == ["start", "switch", "notify"]
    assert await until(lambda: env.published and env.published[-1]["lanes"]["f_kino/l1"]["end"])
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task


async def test_a_routine_in_home_assistant_is_left_to_it_but_its_message_is_sent():
    ha = FakeHa()

    @contextlib.asynccontextmanager
    async def connect():
        yield ha

    rules = rr.Rules({"flows": [{"id": "f_licht", "name": "Licht", "ha": True, "lanes": [{"id": "l1", "blocks": [
        {"k": "state", "ents": ["binary_sensor.fenster"], "to": "open"}, {"k": "switch", "ents": ["light.wz"], "do": "on"},
        {"k": "notify", "text": "Fenster offen"}]}]}]})
    assert rules.local() == [] and rules.listen() and rules.active()       # Home Assistant runs it; the add-on listens for its message
    env = Env(ha)
    task = asyncio.create_task(rr.run_rules(rules, connect=connect, env=env, check=0.2, idle=0.05))
    assert await until(lambda: rules.connected)
    await ha.set("binary_sensor.fenster", "on")
    await asyncio.sleep(0.3)
    assert env.calls == [] and "f_licht/l1" not in rules.status["lanes"]   # not switched a second time by the add-on
    await ha.queue.put({"type": "event", "event": {"event_type": "fp3d_notify", "data": {"message": "  Fenster offen  "}}})
    assert await until(lambda: env.told == ["Fenster offen"])
    assert rules.mem["log"][-1] == {"t": rules.mem["log"][-1]["t"], "src": "flow", "act": "notify", "name": "Home Assistant", "v": "Fenster offen"}
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
