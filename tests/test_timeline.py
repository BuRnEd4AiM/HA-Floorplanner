"""Time travel recorder (timeline.py) and its endpoints in server.py."""
import datetime
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import server  # noqa: E402
import timeline as tl  # noqa: E402

UTC = datetime.timezone.utc
T0 = datetime.datetime(2026, 10, 7, 21, 0, tzinfo=UTC).timestamp()      # 21:00 on the 7th (UTC)


def slim(eid, state, **kw):
    return {"entity_id": eid, "name": eid, "domain": eid.split(".")[0], "state": state, "fx": ["a"], "members": None, **kw}


def lines(folder, day):
    return [json.loads(x) for x in (folder / f"{day}.jsonl").read_text().splitlines()]


def test_layout_entities_finds_ids_of_recorded_domains_only():
    layout = {"floors": [{"devices": [{"entity": "light.kitchen", "ledEntity": "switch.led", "model": "lamp.glb"},
                                      {"entity": "sensor.temp"}, {"entity": "scene.movie"}],
                          "openings": [{"entity": "binary_sensor.door", "panes": [{"entity": "binary_sensor.pane_1"}]}]}]}
    assert tl.layout_entities(layout) == {"light.kitchen", "switch.led", "sensor.temp", "binary_sensor.door", "binary_sensor.pane_1"}


def test_compact_keeps_what_is_drawn():
    assert tl.compact(slim("light.a", "on", brightness=40, rgb=[1, 2, 3], unit=None)) == {"state": "on", "brightness": 40, "rgb": [1, 2, 3]}
    assert tl.compact(None) == {"state": "unavailable"}


def test_snapshot_then_changes_in_one_day_file(tmp_path):
    rec = tl.Recorder(tmp_path, UTC)
    rec.set_tracked({"light.a", "light.b"})
    rec.snapshot([slim("light.a", "off"), slim("light.b", "on"), slim("light.other", "on")], T0)
    rec.change("light.a", slim("light.a", "on", brightness=80), T0 + 5)
    rec.change("light.a", slim("light.a", "on", brightness=80), T0 + 6)      # nothing drawn changed: no line
    rec.change("light.zzz", slim("light.zzz", "on"), T0 + 7)                 # not in the plan: no line
    rec.change("light.b", None, T0 + 8)                                      # removed from Home Assistant
    assert rec.flush() == 3
    got = lines(tmp_path, "2026-10-07")
    assert got[0] == {"t": T0, "snap": {"light.a": {"state": "off"}, "light.b": {"state": "on"}}}
    assert got[1] == {"t": T0 + 5, "e": "light.a", "s": {"state": "on", "brightness": 80}}
    assert got[2] == {"t": T0 + 8, "e": "light.b", "s": {"state": "unavailable"}}


def test_midnight_starts_a_new_file_with_the_states_at_midnight(tmp_path):
    rec = tl.Recorder(tmp_path, UTC)
    rec.set_tracked({"light.a"})
    rec.snapshot([slim("light.a", "on")], T0)
    midnight = T0 + 3 * 3600
    rec.change("light.a", slim("light.a", "off"), midnight + 60)
    rec.flush()
    day2 = lines(tmp_path, "2026-10-08")
    assert day2[0] == {"t": midnight, "snap": {"light.a": {"state": "on"}}}     # the state before the change
    assert day2[1]["e"] == "light.a" and day2[1]["s"] == {"state": "off"}
    assert len(lines(tmp_path, "2026-10-07")) == 1


def test_tick_rolls_the_day_without_any_change(tmp_path):
    rec = tl.Recorder(tmp_path, UTC)
    rec.set_tracked({"light.a"})
    rec.snapshot([slim("light.a", "on")], T0)
    rec.tick(T0 + 4 * 3600)
    rec.flush()
    assert lines(tmp_path, "2026-10-08")[0]["snap"] == {"light.a": {"state": "on"}}


def test_sensors_are_throttled(tmp_path):
    rec = tl.Recorder(tmp_path, UTC)
    rec.set_tracked({"sensor.temp"})
    rec.snapshot([slim("sensor.temp", "20.0", unit="°C")], T0)
    rec.change("sensor.temp", slim("sensor.temp", "20.1", unit="°C"), T0 + 10)
    rec.change("sensor.temp", slim("sensor.temp", "20.2", unit="°C"), T0 + 20)
    rec.tick(T0 + 100)
    assert rec.flush() == 1                        # only the snapshot so far
    rec.tick(T0 + tl.THROTTLE + 1)
    rec.flush()
    got = lines(tmp_path, "2026-10-07")
    assert len(got) == 2 and got[1]["s"]["state"] == "20.2"


def test_prune_keeps_today_and_the_days_before(tmp_path):
    for d in ("2026-09-29", "2026-09-30", "2026-10-01", "2026-10-08"):
        (tmp_path / f"{d}.jsonl").write_text("{}\n")
    (tmp_path / "notes.txt").write_text("x")
    assert tl.prune_days(tmp_path, "2026-10-08", 7) == ["2026-09-30", "2026-09-29"]
    assert [i["day"] for i in tl.list_days(tmp_path)] == ["2026-10-08", "2026-10-01"]
    assert (tmp_path / "notes.txt").exists()


def test_read_day_skips_a_damaged_line(tmp_path):
    (tmp_path / "2026-10-08.jsonl").write_text('{"t": 1, "snap": {}}\n{"t": 2, "e": "light.a", "s"\n{"t": 3, "e": "light.a", "s": {"state": "on"}}\n')
    assert [x["t"] for x in tl.read_day(tmp_path, "2026-10-08")] == [1, 3]


def test_day_start_in_a_time_zone():
    berlin = datetime.timezone(datetime.timedelta(hours=2))
    assert tl.day_start("2026-10-08", berlin) == datetime.datetime(2026, 10, 7, 22, 0, tzinfo=UTC).timestamp()
    assert tl.next_day("2026-12-31") == "2027-01-01"


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "config"))


async def test_timeline_endpoints(client, tmp_path):
    r = await client.get("/api/timeline")
    body = await r.json()
    assert r.status == 200 and body["days"] == [] and body["on"] is True and body["keepDays"] == 7
    folder = tmp_path / "config" / "timeline"
    folder.mkdir(parents=True)
    (folder / "2026-10-08.jsonl").write_text('{"t": 5, "snap": {"light.a": {"state": "on"}}}\n')
    assert (await (await client.get("/api/timeline")).json())["days"] == [{"day": "2026-10-08", "size": 47}]
    day = await (await client.get("/api/timeline/2026-10-08")).json()
    assert day["lines"] == [{"t": 5, "snap": {"light.a": {"state": "on"}}}] and day["end"] - day["start"] in (82800, 86400, 90000)
    dl = await client.get("/api/timeline/2026-10-08?download=1")
    assert dl.status == 200 and "attachment" in dl.headers["Content-Disposition"]
    assert (await client.get("/api/timeline/2026-10-09")).status == 404
    assert (await client.get("/api/timeline/..%2Fsettings")).status in (400, 404)


async def test_timeline_settings_are_validated():
    s = server.validate_settings({"timelineOn": False, "timelineKeepDays": 400})
    assert s["timelineOn"] is False and s["timelineKeepDays"] == 31
    assert "timeline" in server.LOCKS


class FakeMsg:
    type = 1

    def __init__(self, data):
        self.data = json.dumps(data)


class FakeWs:
    """Answers get_states, then sends two events, then goes quiet."""
    def __init__(self):
        self.sent, self.queue = [], []

    async def send_json(self, obj):
        self.sent.append(obj)
        if obj.get("type") == "get_states":
            self.queue.append(FakeMsg({"id": obj["id"], "type": "result", "success": True,
                                       "result": [{"entity_id": "light.a", "state": "off", "attributes": {}}]}))
            self.queue.append(FakeMsg({"type": "event", "event": {"data": {"entity_id": "light.a",
                                       "new_state": {"entity_id": "light.a", "state": "on", "attributes": {"brightness": 255}}}}}))

    async def receive(self):
        import asyncio
        if self.queue:
            return self.queue.pop(0)
        await asyncio.sleep(3600)


async def test_run_recorder_writes_snapshot_and_events(tmp_path):
    import asyncio
    import contextlib
    ws = FakeWs()

    @contextlib.asynccontextmanager
    async def connect():
        yield ws

    rec = tl.Recorder(tmp_path, UTC)
    task = asyncio.create_task(tl.run_recorder(rec, connect=connect, slim_state=server.slim_state, tracked=lambda: {"light.a"},
                                               settings=lambda: (True, 7), check=0.05))
    await asyncio.sleep(0.3)
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    got = [json.loads(x) for f in tmp_path.glob("*.jsonl") for x in f.read_text().splitlines()]
    assert got[0]["snap"] == {"light.a": {"state": "off"}}
    assert got[1]["e"] == "light.a" and got[1]["s"] == {"state": "on", "brightness": 100}
