"""📜 Protokoll (devlog.py, the owner: "eine eigene Seite, wo alles quasi passiert … exportieren … für eine Fehleranalyse … alle Geräte drin
hat, die in den Plänen verwendet werden"): who switched a device (the add-on, an automation, a person, the device), the add-on's commands
in the day file, the day's lines as events for the page, and api/log for admins only."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import devlog as dl  # noqa: E402
import server  # noqa: E402
import timeline as tl  # noqa: E402


def st(state, ctx=None, **attrs):
    return {"state": state, "attributes": attrs, "context": ctx or {}}


def test_who_switched_a_device():
    w = dl.Who()
    w.set_people([{"entity_id": "person.anna", "state": "home", "attributes": {"user_id": "u_anna", "friendly_name": "Anna"}}])
    w.own(["light.flur"], "turn_on", {"entity_id": "light.flur", "brightness_pct": 20}, "flow", "Flurlicht nachts", 100)
    assert w.who("light.flur", st("on"), 102) == {"k": "addon", "src": "flow", "n": "Flurlicht nachts", "ago": 2}
    assert w.who("light.flur", st("off"), 100 + dl.WINDOW + 1) == {"k": "dev"}                       # long after: at the switch
    assert w.who("light.flur", st("off"), 110) == {"k": "dev"}                                       # off right after "on": at the wall
    w.own(["cover.k"], "close_cover", {"entity_id": "cover.k"}, "flow", "Abend", 100)
    assert w.who("cover.k", st("closing"), 101)["n"] == "Abend" and w.who("cover.k", st("open"), 102) == {"k": "dev"}
    w.started({"data": {"name": "Licht morgens", "entity_id": "automation.licht"}, "context": {"id": "c1"}})
    w.service({"data": {"domain": "light", "service": "turn_on", "service_data": {"entity_id": ["light.kueche"]}}, "context": {"id": "c1"}}, 200)
    assert w.who("light.kueche", st("on"), 201)["n"] == "Licht morgens" and w.who("light.kueche", st("on"), 201)["k"] == "auto"
    w.service({"data": {"domain": "switch", "service": "turn_on", "service_data": {"entity_id": "switch.kaffee"}}, "context": {"user_id": "u_anna"}}, 300)
    assert w.who("switch.kaffee", st("on"), 301) == {"k": "user", "n": "Anna", "ago": 1}
    w.service({"data": {"domain": "cover", "service": "close_cover", "service_data": {"entity_id": "cover.x"}}, "context": {}}, 400)
    assert w.who("cover.x", st("closing"), 401)["k"] == "ha"                                        # Home Assistant itself
    assert w.who("light.bad", st("on", {"user_id": "u_anna"}), 500) == {"k": "user", "n": "Anna"}   # only the state's context
    assert w.who("light.bad", st("on", {"parent_id": "p9"}), 500) == {"k": "auto", "n": None}
    assert w.who("light.bad", st("on", {"id": "c1"}), 500) == {"k": "auto", "n": "Licht morgens"}
    assert w.who("light.bad", st("unavailable"), 500) == {"k": "off"}                               # stops reporting: nobody's


def test_the_add_ons_own_echo_and_a_sleepy_thermostat():
    w = dl.Who()
    w.own(["climate.wz"], "set_temperature", {"entity_id": "climate.wz", "temperature": 21}, "heat", "schedule", 1000)
    w.service({"data": {"domain": "climate", "service": "set_temperature", "service_data": {"entity_id": "climate.wz", "temperature": 21}},
               "context": {"user_id": "u_addon"}}, 1001)
    assert w.me == "u_addon" and len(w.calls["climate.wz"]) == 1                                    # its own echo: learnt, not twice
    assert w.who("climate.wz", st("heat", temperature=19), 1060)["k"] == "dev"                       # another value: not the add-on's
    assert w.who("climate.wz", st("heat", temperature=21), 1000 + 600) == {"k": "addon", "src": "heat", "n": "schedule", "ago": 600}
    assert w.who("light.x", st("on", {"user_id": "u_addon"}), 1700) == {"k": "addon"}                # its user in a state's context
    w.own(["climate.wz"], "set_hvac_mode", {"entity_id": "climate.wz", "hvac_mode": "off"}, "heat", "window", 2000)
    assert w.who("climate.wz", st("off", temperature=21), 2100)["n"] == "window"


def test_a_command_and_the_days_events():
    c = dl.command("page", None, "light", "turn_on", {"entity_id": "light.a", "brightness_pct": 80, "rgb_color": [1, 2, 3], "x": {"y": 1}}, True, "?", "Anna")
    assert c == {"src": "page", "n": None, "e": ["light.a"], "sv": "light.turn_on", "v": {"brightness_pct": 80, "rgb_color": [1, 2, 3]}, "ok": True, "err": None, "u": "Anna"}
    assert dl.command("flow", "Abend", "cover", "close_cover", {"entity_id": "cover.k"}, False, "500 Gerät nicht verfügbar")["err"] == "500 Gerät nicht verfügbar"
    lines = [{"t": 1, "snap": {"light.a": {"state": "off"}, "sensor.t": {"state": "20"}, "climate.wz": {"state": "heat", "tt": 20, "ct": 19}}},
             {"t": 2, "e": "light.a", "s": {"state": "on", "brightness": 80}, "w": {"k": "addon", "src": "page", "n": "Anna"}},
             {"t": 3, "e": "sensor.t", "s": {"state": "21"}},                                          # a reading: no line
             {"t": 4, "e": "sensor.t", "s": {"state": "unavailable"}},                                 # stops reporting: a line
             {"t": 5, "e": "climate.wz", "s": {"state": "heat", "tt": 20, "ct": 20}},                  # only measured: no line
             {"t": 6, "e": "climate.wz", "s": {"state": "heat", "tt": 22, "ct": 20}, "w": {"k": "dev"}},
             {"t": 7, "c": c},
             {"t": 8, "x": "off", "err": "ConnectionError: closed"},
             {"t": 9, "snap": {"light.a": {"state": "off"}, "sensor.t": {"state": "unavailable"}, "climate.wz": {"state": "heat", "tt": 22}}}]
    ev = dl.events(lines)
    assert [(x["t"], x["k"]) for x in ev] == [(2, "s"), (4, "s"), (6, "s"), (7, "c"), (8, "x"), (9, "s")]
    assert ev[0] == {"t": 2, "k": "s", "e": "light.a", "a": {"state": "off"}, "b": {"state": "on", "brightness": 80}, "w": {"k": "addon", "src": "page", "n": "Anna"}}
    assert ev[2]["a"] == {"state": "heat", "tt": 20} and ev[2]["b"] == {"state": "heat", "tt": 22}
    assert ev[3]["sv"] == "light.turn_on" and ev[3]["ok"] and ev[4]["err"] == "ConnectionError: closed"
    assert ev[5]["e"] == "light.a" and ev[5]["w"] == {"k": "gap"}                                  # switched off while the connection was lost


def test_the_recorder_writes_who_and_the_commands(tmp_path):
    rec = tl.Recorder(tmp_path)
    rec.set_tracked({"light.a"})
    rec.command(5, {"src": "page"})                                                                # not recording yet: nothing
    rec.snapshot([{"entity_id": "light.a", "state": "off"}], 10)
    rec.who.own(["light.a"], "turn_on", {}, "page", "Anna", 11)
    rec.command(11, dl.command("page", None, "light", "turn_on", {"entity_id": "light.a"}, True, user="Anna"))
    rec.change("light.a", {"entity_id": "light.a", "state": "on"}, 12, {"state": "on", "attributes": {}, "context": {}})
    rec.gap(13, "ConnectionError: closed")
    rec.flush()
    got = [json.loads(x) for f in tmp_path.glob("*.jsonl") for x in f.read_text().splitlines()]
    assert [list(x)[1] for x in got] == ["snap", "c", "e", "x"]
    assert got[2]["w"] == {"k": "addon", "src": "page", "n": "Anna", "ago": 1}


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "config"))


async def test_api_log_for_admins_with_a_day_or_the_last_days(client, tmp_path, monkeypatch):
    folder = tmp_path / "config" / "timeline"
    folder.mkdir(parents=True)
    (folder / "2026-10-27.jsonl").write_text('{"t": 1, "snap": {"light.a": {"state": "off"}}}\n{"t": 2, "e": "light.a", "s": {"state": "on"}, "w": {"k": "dev"}}\n')
    (folder / "2026-10-28.jsonl").write_text('{"t": 90000, "snap": {"light.a": {"state": "on"}}}\n'
                                             '{"t": 90005, "c": {"src": "flow", "n": "Abend", "e": ["light.a"], "sv": "light.turn_off", "v": {}, "ok": false, "err": "500"}}\n')
    one = await (await client.get("/api/log?day=2026-10-28")).json()
    assert [x["k"] for x in one["events"]] == ["c"] and one["events"][0]["ok"] is False and [d["day"] for d in one["days"]] == ["2026-10-28", "2026-10-27"]
    two = await (await client.get("/api/log?day=2026-10-28&days=7")).json()
    assert [x["k"] for x in two["events"]] == ["s", "c"] and two["from"] == "2026-10-27" and two["on"] is True
    assert (await (await client.get("/api/log?day=2026-10-26")).json())["events"] == []
    assert (await client.get("/api/log?day=..")).status == 400
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    server._admin_cache.update(at=float("-inf"), ids=None)

    async def no_admins():
        return None
    monkeypatch.setattr(server, "load_admin_ids", no_admins)
    assert (await client.get("/api/log", headers={"X-Remote-User-Name": "tablet_flur"})).status == 403    # only who may edit
    assert (await client.get("/api/log?day=2026-10-28", headers={"X-Remote-User-Name": "admin"})).status == 200


async def test_cmd_log_writes_the_command_only_while_recording(tmp_path):
    app = server.make_app(tmp_path / "data", tmp_path / "config")
    rec = tl.Recorder(tmp_path / "tl")
    app[server.KEY_TIMELINE]["rec"] = rec
    ctx = server._AppCtx(app)
    server.cmd_log(ctx, "flow", "Abend", "cover", "close_cover", {"entity_id": "cover.k"}, True)
    assert rec.lines == []                                                                         # not recording: nothing
    rec.set_tracked({"cover.k"})
    rec.snapshot([{"entity_id": "cover.k", "state": "open"}], 100)
    server.cmd_before(ctx, "flow", "Abend", "close_cover", {"entity_id": "cover.k"})                # before it goes out
    server.cmd_log(ctx, "flow", "Abend", "cover", "close_cover", {"entity_id": "cover.k"}, False, "500 nicht verfügbar")
    line = json.loads(rec.lines[-1][1])
    assert line["c"] == {"src": "flow", "n": "Abend", "e": ["cover.k"], "sv": "cover.close_cover", "v": {}, "ok": False, "err": "500 nicht verfügbar", "u": None}
    assert rec.who.calls["cover.k"][0][1] == {"k": "addon", "src": "flow", "n": "Abend"}
