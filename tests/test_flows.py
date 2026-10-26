"""Own routines "Wenn … dann …" (flows.py, #546): the blocks are checked, triggers go off, waits and "bleibt so", conditions, actions and
"wie vorher", the clock and the sun, a button and "Jetzt ausprobieren"."""
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import flows as fl  # noqa: E402

WINDOW = {"id": "f_window", "name": "Fenster offen → Heizung aus", "lanes": [
    {"id": "l1", "blocks": [{"k": "state", "ents": ["binary_sensor.fenster_wz", "binary_sensor.fenster_bad"], "to": "open"},
                            {"k": "hold", "s": 120}, {"k": "if_outside", "op": "below", "v": 15},
                            {"k": "heat", "same": True, "do": "off"}, {"k": "notify", "text": "Fenster {room} offen, Heizung aus ({name})"}]},
    {"id": "l2", "blocks": [{"k": "state", "ents": ["binary_sensor.fenster_wz", "binary_sensor.fenster_bad"], "to": "closed"},
                            {"k": "restore", "same": True}]}]}
LIGHT = {"id": "f_flur", "name": "Flurlicht nachts", "lanes": [
    {"id": "l1", "blocks": [{"k": "state", "ents": ["binary_sensor.bewegung_flur"], "to": "on"}, {"k": "if_sun", "is": "dark"},
                            {"k": "switch", "ents": ["light.flur"], "do": "on", "pct": 20}, {"k": "wait", "s": 120}, {"k": "switch", "ents": ["light.flur"], "do": "off"}]}]}
ROOMS = {"binary_sensor.fenster_wz": "h/wz", "climate.wz": "h/wz", "binary_sensor.fenster_bad": "h/bad", "climate.bad": "h/bad"}


def house():
    return {"binary_sensor.fenster_wz": {"state": "off"}, "binary_sensor.fenster_bad": {"state": "off"}, "binary_sensor.bewegung_flur": {"state": "off"},
            "climate.wz": {"state": "heat", "attributes": {"temperature": 21.5, "hvac_modes": ["off", "heat"]}},
            "climate.bad": {"state": "heat", "attributes": {"temperature": 23, "hvac_modes": ["off", "heat"]}},
            "light.flur": {"state": "off", "attributes": {}}, "sun.sun": {"state": "below_horizon", "attributes": {"next_setting": "2026-10-26T16:43:00+00:00"}},
            "weather.home": {"state": "cloudy", "attributes": {"temperature": 9}}, "person.anna": {"state": "home"}, "person.max": {"state": "not_home"}}


class House:
    def __init__(self, flows, at=datetime.datetime(2026, 10, 26, 7, 42)):
        self.flows, self.states, self.local, self.now, self.mem, self.calls, self.log = fl.clean_flows(flows), house(), at, at.timestamp(), {}, [], []

    def ctx(self):
        return {"states": self.states, "now": self.now, "local": self.local, "weather": "weather.home", "names": {"binary_sensor.fenster_wz": "Fenster Wohnzimmer"},
                "room_of": lambda e: ROOMS.get(e, ""), "room_names": {"h/wz": "Wohnzimmer", "h/bad": "Bad"},
                "in_room": lambda room, dom: [e for e, r in ROOMS.items() if r == room and e.startswith(dom + ".")]}

    def done(self, calls):
        for dom, svc, data in calls:
            e = data.get("entity_id")
            if svc == "set_hvac_mode":
                self.states[e]["state"] = data["hvac_mode"]
            elif svc == "set_temperature":
                self.states[e]["attributes"]["temperature"] = data["temperature"]
            elif svc in ("turn_on", "turn_off") and e in self.states:
                self.states[e]["state"] = "on" if svc == "turn_on" else "off"
        self.calls += calls

    def set(self, e, s):
        old = self.states[e]["state"]
        self.states[e]["state"] = s
        self.mem, calls, log = fl.changed(self.flows, self.mem, e, old, s, self.ctx())
        self.log += log
        self.done(calls)
        return calls

    def wait(self, seconds):
        self.now += seconds
        self.local += datetime.timedelta(seconds=seconds)
        self.mem, calls, log = fl.tick(self.flows, self.mem, self.ctx())
        self.log += log
        self.done(calls)
        return calls


def test_blocks_are_checked_and_bad_lanes_dropped():
    out = fl.clean_flows([
        {"id": "f_a", "name": "  A  ", "lanes": [{"id": "l1", "blocks": [{"k": "time", "at": "25:00", "days": [1, 9, 1]}, {"k": "wait", "s": -3},
                                                                          {"k": "switch", "ents": ["light.a", "lock.tuer", "bad"], "do": "dim"},
                                                                          {"k": "heat", "ents": ["climate.x"], "do": "temp", "v": 33.3}, {"k": "notify", "text": " "}]},
                                                 {"blocks": [{"k": "switch", "ents": ["light.a"]}]},             # no trigger first
                                                 {"blocks": [{"k": "button"}, {"k": "state", "ents": ["light.a"]}]}]},   # a second trigger
        {"id": "f_a", "lanes": [{"blocks": [{"k": "button"}]}]},                                                   # the same id twice
        {"id": "bad id", "lanes": [{"blocks": [{"k": "button"}]}]},
        {"id": "f_b", "on": False, "lanes": [{"blocks": [{"k": "state", "ents": []}]}]},                          # no lane left
        "junk"])
    assert out == [{"id": "f_a", "name": "A", "on": True, "ha": False, "lanes": [{"id": "l1", "blocks": [
        {"k": "time", "at": "07:00", "days": [1]}, {"k": "wait", "s": 1}, {"k": "switch", "ents": ["light.a"], "same": False, "do": "on"},
        {"k": "heat", "ents": ["climate.x"], "same": False, "do": "temp", "v": 30.0}]}]}]
    assert fl.clean_flows(None) == [] and fl.clean_block({"k": "restore"}) == {"k": "restore", "ents": [], "same": False}


def test_window_open_for_two_minutes_switches_the_room_off_and_back():
    h = House([WINDOW])
    assert h.set("binary_sensor.fenster_wz", "on") == []                       # waits whether it stays open
    assert h.wait(60) == []
    assert h.wait(60) == [("climate", "set_hvac_mode", {"entity_id": "climate.wz", "hvac_mode": "off"}),
                          ("notify", "", {"message": "Fenster Wohnzimmer offen, Heizung aus (Fenster Wohnzimmer)"})]
    assert h.states["climate.bad"]["state"] == "heat"                          # only the room of that window
    assert h.set("binary_sensor.fenster_wz", "off") == [("climate", "set_hvac_mode", {"entity_id": "climate.wz", "hvac_mode": "heat"}),
                                                        ("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 21.5})]
    assert h.mem["saved"] == {} and [x["act"] for x in h.log] == ["start", "heat", "notify", "start", "restore"]


def test_shut_again_in_time_stops_the_lane_and_a_condition_can_stop_it():
    h = House([WINDOW])
    h.set("binary_sensor.fenster_wz", "on")
    h.set("binary_sensor.fenster_wz", "off")                                   # "bleibt offen" broken
    assert h.wait(300) == [] and h.states["climate.wz"]["state"] == "heat"
    assert any(x["act"] == "stop" for x in h.log) and fl.view(h.flows, h.mem, h.now)["f_window/l1"]["stop"] == 1
    h.states["weather.home"]["attributes"]["temperature"] = 18                 # warm outside: not colder than 15°
    h.set("binary_sensor.fenster_bad", "on")
    assert h.wait(130) == [] and h.states["climate.bad"]["state"] == "heat"


def test_motion_light_restarts_its_wait_and_needs_the_dark():
    h = House([LIGHT])
    assert h.set("binary_sensor.bewegung_flur", "on") == [("light", "turn_on", {"entity_id": "light.flur", "brightness_pct": 20})]
    v = fl.view(h.flows, h.mem, h.now)["f_flur/l1"]
    assert v["running"] and v["wait"] == 3 and v["until"] == h.now + 120 and set(v["passed"]) == {"0", "1", "2"}
    h.set("binary_sensor.bewegung_flur", "off")
    assert h.wait(100) == []
    h.set("binary_sensor.bewegung_flur", "on")                                 # moving again: 2 more minutes
    assert h.wait(100) == []
    assert h.wait(30) == [("light", "turn_off", {"entity_id": "light.flur"})] and not fl.view(h.flows, h.mem, h.now)["f_flur/l1"]["running"]
    h.states["sun.sun"]["state"] = "above_horizon"
    h.set("binary_sensor.bewegung_flur", "off")
    assert h.set("binary_sensor.bewegung_flur", "on") == []                     # daylight: nothing


def test_nothing_from_or_to_unavailable_and_switched_off_routines():
    h = House([LIGHT])
    assert h.set("binary_sensor.bewegung_flur", "unavailable") == [] and h.set("binary_sensor.bewegung_flur", "on") == []
    h2 = House([{**LIGHT, "on": False}])
    assert h2.set("binary_sensor.bewegung_flur", "on") == []


def test_time_sun_numbers_and_people():
    flows = [{"id": "f_t", "name": "Morgen", "lanes": [{"id": "l1", "blocks": [{"k": "time", "at": "07:43", "days": [0]}, {"k": "if_home", "who": ""}, {"k": "run", "ent": "script.morgen"}]}]},
             {"id": "f_s", "name": "Abend", "lanes": [{"id": "l1", "blocks": [{"k": "sun", "ev": "set", "off": 15}, {"k": "cover", "ents": ["cover.wz"], "do": "close"}]}]},
             {"id": "f_n", "name": "Warm", "lanes": [{"id": "l1", "blocks": [{"k": "num", "ent": "sensor.temp", "op": "above", "v": 25}, {"k": "cover", "ents": ["cover.wz"], "do": "pos", "v": 30}]}]},
             {"id": "f_p", "name": "Alle weg", "lanes": [{"id": "l1", "blocks": [{"k": "presence", "ev": "all_away"}, {"k": "switch", "ents": ["light.flur"], "do": "off"}]}]}]
    h = House(flows)
    h.states.update({"sensor.temp": {"state": "24"}, "cover.wz": {"state": "open", "attributes": {"current_position": 100}}})
    assert h.wait(30) == [] and h.wait(30) == [("script", "turn_on", {"entity_id": "script.morgen"})]   # 7:43 on a Monday, once
    assert h.wait(20) == []
    h.set("sensor.temp", "24.5")
    assert h.set("sensor.temp", "25.5") == [("cover", "set_cover_position", {"entity_id": "cover.wz", "position": 30})]
    assert h.set("sensor.temp", "26") == []                                    # only when it crosses the limit
    assert h.set("person.anna", "not_home") == [("light", "turn_off", {"entity_id": "light.flur"})]
    sunset = datetime.datetime(2026, 10, 26, 16, 43, tzinfo=datetime.timezone.utc).timestamp()
    h.now = sunset + 14 * 60
    assert h.wait(30) == []
    h.states["sun.sun"]["attributes"]["next_setting"] = "2026-10-27T16:41:00+00:00"   # after sunset Home Assistant names tomorrow's
    assert h.wait(60) == [("cover", "close_cover", {"entity_id": "cover.wz"})] and h.wait(60) == []


def test_button_and_trying_it_now():
    flows = [{"id": "f_b", "name": "Kino", "lanes": [{"id": "l1", "blocks": [{"k": "button"}, {"k": "if_time", "from": "18:00", "to": "23:00"},
                                                                             {"k": "switch", "ents": ["light.flur"], "do": "off"}]}]}]
    h = House(flows)
    h.mem, calls, log = fl.run_now(h.flows, h.mem, "f_b", "l1", h.ctx())
    assert calls == [] and log[-1]["act"] == "stop"                             # 7:42: not between 18 and 23 o'clock
    h.mem, calls, log = fl.run_now(h.flows, h.mem, "f_b", "l1", h.ctx(), test=True)
    assert calls == [("light", "turn_off", {"entity_id": "light.flur"})] and fl.view(h.flows, h.mem, h.now)["f_b/l1"]["test"]
    h2 = House([WINDOW])
    h2.mem, calls, _ = fl.run_now(h2.flows, h2.mem, "f_window", "l1", h2.ctx(), test=True)   # the room of the first window
    assert calls[0] == ("climate", "set_hvac_mode", {"entity_id": "climate.wz", "hvac_mode": "off"})
    assert fl.run_now(h.flows, h.mem, "f_x", "l1", h.ctx()) is None


def test_removed_lanes_are_forgotten():
    h = House([LIGHT])
    h.set("binary_sensor.bewegung_flur", "on")
    h.flows = []
    h.wait(1)
    assert h.mem["runs"] == {} and h.mem["last"] == {} and h.mem["saved"] == {}
