"""☀ Sonnenschutz (sunshade.py, 5.15.0): roller shutters go down only where the sun shines on their window, back up when it has gone;
and the way every window looks, from the plan (roommap.rooms_of)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import roommap as rm  # noqa: E402
import sunshade as ss  # noqa: E402

# one room 0..6 x 0..4 (z grows to the south): a window with a shutter in each wall, the south one with a contact
WIN = lambda c, **k: {"type": "window", "pos": 2, "width": 1, "shutter": True, "shutterEntity": c, **k}   # noqa: E731
LAYOUT = {"floors": [{
    "walls": [
        {"a": [0, 0], "b": [6, 0], "openings": [WIN("cover.nord")]},
        {"a": [6, 0], "b": [6, 4], "openings": [WIN("cover.ost")]},
        {"a": [6, 4], "b": [0, 4], "openings": [WIN("cover.sued", entity="binary_sensor.fenster_sued")]},   # drawn the other way round
        {"a": [0, 4], "b": [0, 0], "openings": [WIN("cover.west"), {"type": "window", "pos": 3}]},           # a window without a shutter
    ],
    "rooms": [{"id": "r1", "name": "Wohnzimmer", "points": [[0, 0], [6, 0], [6, 4], [0, 4]]}],
    "devices": [{"id": "t", "type": "thermostat", "x": 1, "z": 1, "entity": "climate.wz"}],
}]}
ROOMS = rm.rooms_of([("h", LAYOUT)])
CFG = ss.clean_sun({"on": True})


def states(az=200, elev=35, out=26, inside=25, weather="sunny", pos=100, open_=False):
    st = {"sun.sun": {"state": "above_horizon", "attributes": {"azimuth": az, "elevation": elev}},
          "weather.home": {"state": weather, "attributes": {"temperature": out}},
          "climate.wz": {"state": "heat", "attributes": {"current_temperature": inside}},
          "binary_sensor.fenster_sued": {"state": "on" if open_ else "off"}}
    for c in ("cover.nord", "cover.ost", "cover.sued", "cover.west"):
        st[c] = {"state": "open", "attributes": {"current_position": pos}}
    return st


def test_every_window_knows_which_way_it_looks():
    sh = {x["cover"]: x for x in ROOMS[0]["shutters"]}
    assert {c: x["bearing"] for c, x in sh.items()} == {"cover.nord": 0.0, "cover.ost": 90.0, "cover.sued": 180.0, "cover.west": 270.0}
    assert sh["cover.sued"]["contacts"] == ["binary_sensor.fenster_sued"]
    assert [ss.compass(b) for b in (0, 44, 90, 135, 180, 200, 270, 330)] == ["N", "NO", "O", "SO", "S", "S", "W", "NW"]
    assert ss.window_bearing(0, 0, 6, 0, -1) == 0.0 and ss.window_bearing(0, 0, 6, 0, 1) == 180.0 and ss.window_bearing(0, 0, 0, 0, 1) is None


def test_a_wall_that_says_where_outside_is_wins():
    lay = {"floors": [{**LAYOUT["floors"][0], "walls": [{"a": [0, 0], "b": [6, 0], "outside": 1, "openings": [WIN("cover.x")]}]}]}
    assert rm.rooms_of([("h", lay)])[0]["shutters"][0]["bearing"] == 180.0       # +1: the normal (-dz, dx) = south


def test_settings_are_checked():
    c = ss.clean_sun({"on": True, "elev": 99, "angle": 5, "out": None, "inside": "x", "pos": 100, "back": 0, "skip": ["cover.a", "light.b", "cover.a"]})
    assert c["elev"] == 60 and c["angle"] == 30 and c["out"] is None and c["inside"] == 24.0 and c["pos"] == 90 and c["back"] == 1
    assert c["skip"] == ["cover.a"]
    assert ss.clean_sun(None)["on"] is False and ss.clean_sun({})["out"] == 22.0


def test_only_the_shutters_in_the_sun_go_down():
    mem, calls, status, lines = ss.step(CFG, ROOMS, states(az=200), {}, 1000, "weather.home")
    assert calls == [("set_cover_position", {"entity_id": "cover.sued", "position": 30}), ("set_cover_position", {"entity_id": "cover.west", "position": 30})]
    assert set(mem) == {"cover.sued", "cover.west"} and mem["cover.sued"]["before"] == 100
    assert status["cover.nord"]["why"] == "shade" and status["cover.sued"]["why"] == "sun" and status["cover.sued"]["down"] is True
    assert [x["act"] for x in lines] == ["down", "down"]
    # the next look: nothing again
    mem2, calls2, *_ = ss.step(CFG, ROOMS, states(az=200, pos=30), mem, 1010, "weather.home")
    assert calls2 == [] and set(mem2) == {"cover.sued", "cover.west"}


def test_low_sun_cool_day_clouds_and_an_open_window_keep_them_up():
    assert ss.step(CFG, ROOMS, states(elev=8), {}, 0, "weather.home")[1] == []
    assert ss.step(CFG, ROOMS, states(out=15, inside=21), {}, 0, "weather.home")[1] == []
    _m, calls, status, _l = ss.step(CFG, ROOMS, states(out=15, inside=25), {}, 0, "weather.home")
    assert len(calls) == 2                                                     # warm in the room is enough
    _m, calls, status, _l = ss.step(CFG, ROOMS, states(weather="cloudy"), {}, 0, "weather.home")
    assert calls == [] and status["cover.sued"]["why"] == "clouds"
    _m, calls, status, _l = ss.step(CFG, ROOMS, states(open_=True), {}, 0, "weather.home")
    assert [d["entity_id"] for _s, d in calls] == ["cover.west"] and status["cover.sued"]["why"] == "open"
    nolim = ss.clean_sun({"on": True, "out": None, "inside": None})
    assert len(ss.step(nolim, ROOMS, states(out=5, inside=15), {}, 0, "weather.home")[1]) == 2


def test_back_up_when_the_sun_has_gone_for_the_minutes():
    mem, *_ = ss.step(CFG, ROOMS, states(az=180), {}, 0, "weather.home")
    assert set(mem) == {"cover.sued"}
    mem, calls, status, _l = ss.step(CFG, ROOMS, states(az=300, pos=30), mem, 600, "weather.home")
    assert calls == [] and status["cover.sued"]["down"] and status["cover.sued"]["until"] == 20 * 60
    mem, calls, _s, lines = ss.step(CFG, ROOMS, states(az=300, pos=30), mem, 1300, "weather.home")
    assert ("set_cover_position", {"entity_id": "cover.sued", "position": 100}) in calls and "cover.sued" not in mem
    assert any(x["act"] == "up" and x["why"] == "gone" for x in lines)


def test_an_open_window_brings_its_shutter_up_at_once():
    mem, *_ = ss.step(CFG, ROOMS, states(az=180), {}, 0, "weather.home")
    mem, calls, _s, lines = ss.step(CFG, ROOMS, states(az=180, pos=30, open_=True), mem, 30, "weather.home")
    assert calls == [("set_cover_position", {"entity_id": "cover.sued", "position": 100})] and lines[0]["why"] == "open"


def test_turned_by_hand_it_is_left_alone():
    mem, *_ = ss.step(CFG, ROOMS, states(az=180), {}, 0, "weather.home")
    st = states(az=180, pos=30)
    st["cover.sued"]["attributes"]["current_position"] = 0                    # closed by hand
    mem, calls, status, lines = ss.step(CFG, ROOMS, st, mem, 300, "weather.home")
    assert calls == [] and mem["cover.sued"]["hand"] and status["cover.sued"]["hand"] and lines[0]["act"] == "hand"
    st = states(az=300, elev=5)                                               # evening: the sun is low
    st["cover.sued"]["attributes"]["current_position"] = 0
    mem, calls, *_ = ss.step(CFG, ROOMS, st, mem, 3000, "weather.home")
    assert calls == [] and mem == {}                                           # not put back


def test_already_low_skipped_without_position_and_switched_off():
    assert ss.step(CFG, ROOMS, states(az=180, pos=20), {}, 0, "weather.home")[1] == []
    st = states(az=180)
    del st["cover.sued"]["attributes"]["current_position"]
    _m, calls, status, _l = ss.step(CFG, ROOMS, st, {}, 0, "weather.home")
    assert calls == [] and status["cover.sued"]["why"] == "nopos"
    skip = ss.clean_sun({"on": True, "skip": ["cover.sued"]})
    assert ss.step(skip, ROOMS, states(az=180), {}, 0, "weather.home")[1] == []
    assert ss.step(ss.clean_sun({}), ROOMS, states(az=180), {"cover.sued": {"at": 0}}, 0, "weather.home") == ({}, [], {}, [])


def test_memory_is_checked_and_forgets_shutters_no_longer_in_a_plan():
    m = ss.clean_mem({"cover.a": {"at": 5, "set": 30, "before": 100}, "light.x": {"at": 1}, "cover.b": {"set": 3}})
    assert list(m) == ["cover.a"] and m["cover.a"]["last"] == 5.0 and m["cover.a"]["hand"] is False
    mem, *_ = ss.step(CFG, ROOMS, states(az=0, elev=40), m, 10, "weather.home")
    assert "cover.a" not in mem


def test_a_house_drawn_turned_says_where_north_is():
    """the owner, 2026-11-17: the plan was not drawn with north up; layout.north turns every window without a new drawing"""
    sh = {x["cover"]: x for x in rm.rooms_of([("h", {**LAYOUT, "north": 90})])[0]["shutters"]}
    assert {c: x["bearing"] for c, x in sh.items()} == {"cover.nord": 90.0, "cover.ost": 180.0, "cover.sued": 270.0, "cover.west": 0.0}
    assert sh["cover.nord"]["plan"] == 0.0
    assert rm.north_of({"north": -45}) == 315.0 and rm.north_of({"north": "x"}) == 0.0 and rm.north_of(None) == 0.0


def test_the_rules_do_not_fight():
    """the owner: "pass auf das die regeln sich dann nicht beißen": what another rule did wins, the sun rule never moves it back and forth"""
    # a routine closed the shutter in the evening before: lower than 30 %, the sun rule does nothing
    st = states(az=180, pos=0)
    assert ss.step(CFG, ROOMS, st, {}, 0, "weather.home")[1] == []
    # the sun sent it down, then a routine ("Guten Morgen") opened it again in the sun: left open, not sent down again while the sun is on it
    mem, *_ = ss.step(CFG, ROOMS, states(az=180), {}, 0, "weather.home")
    for t in (200, 400, 900):
        mem, calls, status, _l = ss.step(CFG, ROOMS, states(az=180, pos=100), mem, t, "weather.home")
        assert [d["entity_id"] for _s, d in calls if d["entity_id"] == "cover.sued"] == [] and status["cover.sued"]["hand"]
    # the sun gone for the minutes: forgotten without a call, the next sunny day it may go down again
    mem, calls, *_ = ss.step(CFG, ROOMS, states(az=180, elev=5, pos=100), mem, 900 + 21 * 60, "weather.home")
    assert calls == [] and "cover.sued" not in mem
    mem, calls, *_ = ss.step(CFG, ROOMS, states(az=180, pos=100), mem, 90000, "weather.home")
    assert ("set_cover_position", {"entity_id": "cover.sued", "position": 30}) in calls
