"""Entities renamed in Home Assistant (renames.py) and how the add-on applies them (server.py)."""
import asyncio
import contextlib
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import renames as rn  # noqa: E402
import server  # noqa: E402

T = 1_700_000_000.0


def entry(eid, uid, platform="mqtt"):
    return {"entity_id": eid, "unique_id": uid, "platform": platform}


def st(eid, name, state="on", **attrs):
    return {"entity_id": eid, "state": state, "attributes": {"friendly_name": name, **attrs}}


# ---------- comparing the registry ----------
def test_compare_first_look_knows_nothing_to_rename():
    renames, known = rn.compare(None, [entry("light.a", "1"), {"entity_id": "light.yaml"}], T)
    assert renames == {} and known == {"at": T, "ids": {"mqtt\x1f1": ["light.a", T]}}


def test_compare_finds_a_renamed_entity_by_its_unique_id():
    _, known = rn.compare(None, [entry("light.a", "1"), entry("sensor.t", "2")], T)
    renames, known = rn.compare(known, [entry("light.b", "1"), entry("sensor.t", "2")], T + 10)
    assert renames == {"light.a": "light.b"}
    assert known["ids"]["mqtt\x1f1"] == ["light.b", T + 10]


def test_compare_same_unique_id_of_another_integration_is_another_entity():
    _, known = rn.compare(None, [entry("light.a", "1", "mqtt")], T)
    renames, _ = rn.compare(known, [entry("light.b", "1", "zha")], T + 10)
    assert renames == {}


def test_compare_deleted_and_created_again_counts_as_renamed():
    """Zigbee2MQTT's "update Home Assistant entity ID": the entity is deleted, a moment later created again with the new id."""
    _, known = rn.compare(None, [entry("sensor.old_temperature", "0xa4_temperature")], T)
    renames, known = rn.compare(known, [], T + 1)                       # looked in the gap: gone, but remembered
    assert renames == {} and "mqtt\x1f0xa4_temperature" in known["ids"]
    renames, _ = rn.compare(known, [entry("sensor.new_temperature", "0xa4_temperature")], T + 4)
    assert renames == {"sensor.old_temperature": "sensor.new_temperature"}


def test_compare_old_deletions_and_taken_ids_are_not_renames():
    _, known = rn.compare(None, [entry("light.a", "1")], T)
    _, gone = rn.compare(known, [], T + 1)
    renames, known2 = rn.compare(gone, [entry("light.a_2", "1")], T + rn.GONE_KEEP + 10)   # deleted long ago
    assert renames == {} and known2["ids"]["mqtt\x1f1"] == ["light.a_2", T + rn.GONE_KEEP + 10]
    renames, _ = rn.compare(gone, [entry("light.a_2", "1"), entry("light.a", "other")], T + 5)   # its old id is another entity's now
    assert renames == {}


def test_compare_swapped_ids():
    _, known = rn.compare(None, [entry("light.a", "1"), entry("light.b", "2")], T)
    renames, _ = rn.compare(known, [entry("light.b", "1"), entry("light.a", "2")], T + 1)
    assert renames == {"light.a": "light.b", "light.b": "light.a"}


# ---------- names ----------
def test_friendly_names_keep_the_name_while_an_entity_is_unavailable_or_restored():
    before = {"light.a": "Lampe", "sensor.t": "Temperatur"}
    states = [st("light.a", "light.a", "unavailable"), st("sensor.t", "x", restored=True), st("switch.s", "Schalter")]
    assert rn.friendly_names(states, before) == {"light.a": "Lampe", "sensor.t": "Temperatur", "switch.s": "Schalter"}


def test_name_changes_follow_a_rename():
    before = {"sensor.old_temperature": "H1-AZFA-TEM01 Temperatur", "light.a": "Lampe"}
    after = {"sensor.new_temperature": "H1-BUE-TEM01 Temperatur", "light.a": "Lampe"}
    assert rn.name_changes(before, after, {"sensor.old_temperature": "sensor.new_temperature"}) == {
        "sensor.new_temperature": ["H1-AZFA-TEM01 Temperatur", "H1-BUE-TEM01 Temperatur"]}


# ---------- rewriting a plan ----------
def plan():
    return {"version": 1, "floors": [{"id": "f1", "devices": [
        {"id": "d1", "type": "sensor", "name": "H1-AZFA-TEM01 Temperatur", "entity": "sensor.old_temperature"},
        {"id": "d2", "type": "lamp", "name": "Leselampe", "entity": "light.a", "model": "lamp.glb"},
        {"id": "d3", "type": "ledring", "name": "light.a", "entity": "light.a", "segs": [{"entity": "light.a"}, {"entity": "light.z"}]},
        {"id": "d4", "type": "tv", "name": "TV", "entity": "media_player.tv", "ledEntity": "light.a"},
    ], "walls": [{"openings": [{"entity": "binary_sensor.door", "paneEntities": ["binary_sensor.door", "binary_sensor.p2"]}]}]}],
        "labels": {"light.a": "oben"}}


def test_rewrite_puts_new_ids_everywhere_and_follows_names_not_typed_by_hand():
    p = plan()
    n = rn.rewrite(p, {"light.a": "light.b", "sensor.old_temperature": "sensor.new_temperature", "binary_sensor.door": "binary_sensor.tuer"},
                   {"sensor.new_temperature": ["H1-AZFA-TEM01 Temperatur", "H1-BUE-TEM01 Temperatur"], "light.b": ["Lampe", "Lampe neu"]})
    devs = p["floors"][0]["devices"]
    assert devs[0] == {"id": "d1", "type": "sensor", "name": "H1-BUE-TEM01 Temperatur", "entity": "sensor.new_temperature"}
    assert devs[1]["entity"] == "light.b" and devs[1]["name"] == "Leselampe" and devs[1]["model"] == "lamp.glb"   # typed by hand: stays
    assert devs[2]["name"] == "light.b" and devs[2]["segs"] == [{"entity": "light.b"}, {"entity": "light.z"}]       # the id as name
    assert devs[3]["ledEntity"] == "light.b"
    assert p["floors"][0]["walls"][0]["openings"][0] == {"entity": "binary_sensor.tuer", "paneEntities": ["binary_sensor.tuer", "binary_sensor.p2"]}
    assert p["labels"] == {"light.b": "oben"}
    assert n == 10


def test_rewrite_nothing_to_do():
    p = plan()
    assert rn.rewrite(p, {"light.other": "light.x"}, {}) == 0 and p == plan()


def test_rewrite_swap_keys():
    o = {"light.a": 1, "light.b": 2, "list": ["light.a", "light.b"]}
    assert rn.rewrite(o, {"light.a": "light.b", "light.b": "light.a"}) == 4
    assert o == {"light.b": 1, "light.a": 2, "list": ["light.b", "light.a"]}


# ---------- a browser that missed a rename ----------
def test_history_follows_chains_and_forgets():
    h = rn.remember({}, {"light.a": "light.b"}, T)
    h = rn.remember(h, {"light.b": "light.c"}, T + 10)
    assert h == {"light.a": ["light.c", T], "light.b": ["light.c", T + 10]}
    assert rn.remember(h, {}, T + rn.HISTORY_KEEP + 5) == {"light.b": ["light.c", T + 10]}
    assert rn.remember(h, {"light.c": "light.a"}, T + 20) == {"light.b": ["light.a", T + 10], "light.c": ["light.a", T + 20]}


def test_fix_stale_only_touches_ids_that_no_longer_exist():
    hist = {"light.a": ["light.b", T], "light.x": ["light.y", T]}
    p = {"floors": [{"devices": [{"entity": "light.a"}, {"entity": "light.x"}]}]}
    assert rn.fix_stale(p, hist, {"light.b", "light.y", "light.x"}, T + 60) == 1     # light.x exists again (another entity): kept
    assert p == {"floors": [{"devices": [{"entity": "light.b"}, {"entity": "light.x"}]}]}
    assert rn.fix_stale(p, hist, {"light.b"}, T + rn.HISTORY_KEEP + 1) == 0


def test_look_first_time_only_remembers():
    renames, changes, state = rn.look({}, [entry("light.a", "1")], [st("light.a", "Lampe")], T)
    assert renames == {} and changes == {}
    assert state["names"] == {"light.a": "Lampe"} and state["current"] == ["light.a"] and state["history"] == {}


def test_look_rename_and_new_name_together():
    _, _, state = rn.look({}, [entry("sensor.old_temperature", "u")], [st("sensor.old_temperature", "Alt Temperatur", "21")], T)
    renames, changes, state = rn.look(state, [entry("sensor.new_temperature", "u")], [st("sensor.new_temperature", "Neu Temperatur", "21")], T + 5)
    assert renames == {"sensor.old_temperature": "sensor.new_temperature"}
    assert changes == {"sensor.new_temperature": ["Alt Temperatur", "Neu Temperatur"]}
    assert state["history"] == {"sensor.old_temperature": ["sensor.new_temperature", T + 5]}
    assert state["names"] == {"sensor.new_temperature": "Neu Temperatur"}


# ---------- the websocket loop ----------
class Msg:
    type = 1

    def __init__(self, data):
        self.data = json.dumps(data)


class FakeHa:
    """Home Assistant's websocket: subscriptions, the entity registry and the states; rename() changes an id and sends the events."""
    def __init__(self, entries, states):
        self.entries, self.states, self.sent, self.queue = entries, states, [], asyncio.Queue()

    async def send_json(self, obj):
        self.sent.append(obj)
        result = {"subscribe_events": None, "config/entity_registry/list": self.entries, "get_states": self.states}[obj["type"]]
        await self.queue.put(Msg({"id": obj["id"], "type": "result", "success": True, "result": result}))

    async def receive(self):
        return await self.queue.get()

    async def rename(self, old, new, name):
        for e in self.entries:
            if e["entity_id"] == old:
                e["entity_id"] = new
        self.states = [st(new, name) if s["entity_id"] == old else s for s in self.states]
        for _ in range(2):          # one rename comes as several events
            await self.queue.put(Msg({"type": "event", "event": {"event_type": "entity_registry_updated", "data": {"action": "update"}}}))
        await self.queue.put(Msg({"type": "event", "event": {"event_type": "state_changed", "data": {}}}))


async def test_run_watch_catches_up_at_start_and_follows_renames():
    ha = FakeHa([entry("light.a", "1"), entry("sensor.old", "2")], [st("light.a", "Lampe"), st("sensor.old", "Alt")])
    saved, applied = [], []

    @contextlib.asynccontextmanager
    async def connect():
        yield ha

    async def apply(ids, names):
        applied.append((ids, names))

    stored = rn.look({}, [entry("light.old", "1"), entry("sensor.old", "2")], [st("light.old", "Lampe"), st("sensor.old", "Alt")], T)[2]
    task = asyncio.create_task(rn.run_watch(connect=connect, load=lambda: stored, save=saved.append, apply=apply, quiet=0.05))
    await asyncio.sleep(0.2)
    assert applied == [({"light.old": "light.a"}, {})]                     # renamed while the add-on was stopped
    assert [m["event_type"] for m in ha.sent[:2]] == list(rn.EVENTS)
    await ha.rename("sensor.old", "sensor.new", "Neu")
    await asyncio.sleep(0.3)
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    assert applied[1] == ({"sensor.old": "sensor.new"}, {"sensor.new": ["Alt", "Neu"]})
    assert len(applied) == 2 and saved[-1]["names"] == {"light.a": "Lampe", "sensor.new": "Neu"}


async def test_run_watch_survives_a_home_assistant_without_the_registry(monkeypatch):
    class Refusing(FakeHa):
        async def send_json(self, obj):
            if obj["type"] == "config/entity_registry/list":
                await self.queue.put(Msg({"id": obj["id"], "type": "result", "success": False, "error": {"code": "unknown_command"}}))
            else:
                await super().send_json(obj)

    @contextlib.asynccontextmanager
    async def connect():
        yield Refusing([], [])

    slept = []

    async def fake_sleep(s):
        slept.append(s)
        if len(slept) > 2:
            raise asyncio.CancelledError

    monkeypatch.setattr(rn.asyncio, "sleep", fake_sleep)
    with contextlib.suppress(asyncio.CancelledError):
        await rn.run_watch(connect=connect, load=dict, save=lambda s: None, apply=None)
    assert slept == [1, 2, 4]


# ---------- the add-on: files and browsers ----------
async def test_apply_renames_rewrites_every_house_settings_and_users_file(aiohttp_client, tmp_path):
    app = server.make_app(tmp_path, tmp_path / "cfg")
    client = await aiohttp_client(app)
    assert (await client.put("/api/layout", json=plan())).status == 200
    other = await (await client.post("/api/houses", json={"name": "Garten"})).json()
    garden = {"version": 1, "floors": [{"id": "g", "devices": [{"id": "x", "name": "Lampe", "entity": "light.a"}]}]}
    assert (await client.put(f"/api/layout?house={other['id']}", json=garden)).status == 200
    assert (await client.put("/api/settings", json={"weatherEntity": "weather.home", "startViews": {"*": {"house": "main"}}})).status == 200
    (tmp_path / "cfg" / "users.json").write_text(json.dumps({"version": 1, "userRooms": {"tab": "r1"}, "note": "weather.home"}))

    done = server.apply_renames(app, {"light.a": "light.b", "weather.home": "weather.haus"}, {"light.b": ["Lampe", "Lampe neu"]})
    assert sorted(done["houses"]) == sorted(["main", other["id"]]) and done["settings"] is True
    main = await (await client.get("/api/layout")).json()
    assert main["floors"][0]["devices"][1]["entity"] == "light.b" and main["floors"][0]["devices"][1]["name"] == "Leselampe"
    g = await (await client.get(f"/api/layout?house={other['id']}")).json()
    assert g["floors"][0]["devices"][0] == {"id": "x", "name": "Lampe neu", "entity": "light.b"}
    assert (await (await client.get("/api/settings")).json())["weatherEntity"] == "weather.haus"
    assert json.loads((tmp_path / "cfg" / "users.json").read_text())["note"] == "weather.haus"
    assert server.apply_renames(app, {"light.nothing": "light.x"}, {}) == {"houses": [], "settings": False}


async def test_put_layout_corrects_ids_renamed_meanwhile(aiohttp_client, tmp_path):
    app = server.make_app(tmp_path)
    client = await aiohttp_client(app)
    app[server.KEY_RENAMES].update(history={"light.a": ["light.b", time.time()]}, current={"light.b"})
    assert (await client.put("/api/layout", json=plan())).status == 200
    devs = (await (await client.get("/api/layout")).json())["floors"][0]["devices"]
    assert devs[1]["entity"] == "light.b" and devs[3]["ledEntity"] == "light.b"
