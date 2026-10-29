"""Room sensors for the thermostats (roomsensors.py, #573): the card's settings, finding the calibration of a thermostat's device (Zigbee2MQTT,
ZHA, Matter, an external input with its select, Danfoss in hundredths), and what the add-on does: 🎯 the offset or the external input set
from the sensor, ↕ the target moved while the wish stays, a target set by somebody else as the new wish, the heating rules' targets as
wishes, back as before when the sensor is taken away, the thermostat on its own while the sensor does not report; a target it sent
itself and a sleepy thermostat reports late is no wish, and the window rule holds a moved thermostat alone (#577)."""
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import heatrules as hr  # noqa: E402
import roomsensors as rs  # noqa: E402


def trv(target=21.0, meas=25.1, mode="heat", step=0.5):
    return {"state": mode, "attributes": {"temperature": target, "current_temperature": meas, "hvac_modes": ["off", "heat"], "min_temp": 5,
                                          "max_temp": 30, "target_temp_step": step, "friendly_name": "Heizung Wohnzimmer"}}


def number(v, lo=-9, hi=9, step=0.1, name=""):
    return {"state": str(v), "attributes": {"min": lo, "max": hi, "step": step, "unit_of_measurement": "°C", "friendly_name": name}}


def sensor(v):
    return {"state": str(v), "attributes": {"unit_of_measurement": "°C", "device_class": "temperature"}}


def done(states, calls):
    """Home Assistant does what the calls say"""
    for dom, svc, data in calls:
        e = data["entity_id"]
        if svc == "set_value":
            states[e]["state"] = str(data["value"])
        elif svc == "select_option":
            states[e]["state"] = data["option"]
        elif svc == "set_temperature":
            states[e]["attributes"]["temperature"] = data["temperature"]


class Run:
    def __init__(self, cfg, states, parts):
        self.cfg, self.states, self.parts, self.mem, self.now = rs.clean(cfg), states, parts, {}, 1_000_000.0

    def look(self, minutes=0, apply=True):
        self.now += minutes * 60
        self.mem, calls, self.status, self.log = rs.step(self.cfg, self.states, self.parts, self.mem, self.now)
        if apply:
            done(self.states, calls)
        return calls


def wz(way="auto"):
    return {"map": {"climate.wz": {"s": "sensor.wz", "way": way}}}


def test_settings_are_cleaned():
    assert rs.clean(None) == {"on": True, "every": 10, "min": 0.5, "map": {}}
    c = rs.clean({"on": False, "every": 999, "min": 0.04, "map": {"climate.a": {"s": "sensor.t", "way": "cal"}, "climate.b": {"s": "sensor.t", "way": "x"},
                                                                  "light.c": {"s": "sensor.t"}, "climate.d": {"s": "binary_sensor.x"}, "climate.e": "sensor.t"}})
    assert c == {"on": False, "every": 60, "min": 0.1, "map": {"climate.a": {"s": "sensor.t", "way": "cal"}, "climate.b": {"s": "sensor.t", "way": "auto"}}}
    assert rs.clean({"every": 1, "min": 9})["every"] == 2 and rs.clean({"min": 9})["min"] == 3.0
    assert not rs.any_on(rs.clean({})) and rs.any_on(rs.clean(wz())) and not rs.any_on(rs.clean({**wz(), "on": False}))


def test_finds_the_calibration_of_every_kind_of_thermostat():
    st = {"number.wz_local_temperature_calibration": number(0), "number.wz_valve_opening_degree": number(50, 0, 100, 1),
          "switch.wz_child_lock": {"state": "off"}}
    assert rs.find_cal(list(st), st) == {"ent": "number.wz_local_temperature_calibration", "kind": "off", "sel": None, "opt": None}     # Zigbee2MQTT
    st = {"number.bad_local_temperature_offset": number(0, -2.5, 2.5, 0.1)}
    assert rs.find_cal(list(st), st)["kind"] == "off"                                                                                    # ZHA
    st = {"number.kinderzimmer_heizung": number(0, -5, 5, 0.5, "Heizung Kinderzimmer Temperaturversatz")}
    assert rs.find_cal(list(st), st)["ent"] == "number.kinderzimmer_heizung"                                                             # Matter, by its (German) name
    st = {"number.trv_external_temperature_input": number(0, 0, 99.9), "select.trv_temperature_sensor_select":
          {"state": "internal", "attributes": {"options": ["internal", "external", "external_2"]}}}
    assert rs.find_cal(list(st), st) == {"ent": "number.trv_external_temperature_input", "kind": "ext", "sel": "select.trv_temperature_sensor_select", "opt": "external"}   # Sonoff TRVZB
    st["number.trv_local_temperature_calibration"] = number(0, -7, 7, 0.2)
    assert rs.find_cal(list(st), st)["kind"] == "off"                                                                                    # an offset first
    st = {"number.ally_external_measured_room_sensor": number(-8000, -8000, 3500, 1)}
    assert rs.find_cal(list(st), st)["kind"] == "ext"                                                                                    # Danfoss Ally
    st = {"number.x_valve_offset": number(0), "number.x_window_open_temperature_offset": number(0), "number.x_boost_time": number(300, 0, 900, 1),
          "number.x_regulation_setpoint_offset": number(0)}
    assert rs.find_cal(list(st), st) is None                                                                                              # not a temperature
    assert rs.find_cal(["number.gone_local_temperature_calibration"], {}) is None and rs.find_cal(None, {}) is None                      # Homematic IP, tado …
    assert rs.caps({"climate.wz": trv(), "climate.hm": trv(), "number.wz_cal": number(0, name="Temperature calibration")},
                   {"climate.wz": ["number.wz_cal"]}) == {"climate.wz": "number.wz_cal"}


def test_offset_follows_the_room_sensor_and_waits_for_the_thermostat():
    st = {"climate.wz": trv(meas=25.1), "sensor.wz": sensor(20.5), "number.wz_local_temperature_calibration": number(0)}
    r = Run(wz(), st, {"climate.wz": ["number.wz_local_temperature_calibration"]})
    assert r.look() == [("number", "set_value", {"entity_id": "number.wz_local_temperature_calibration", "value": -4.6})]
    s = r.status["climate.wz"]
    assert s["way"] == "cal" and s["kind"] == "off" and s["v"] == 20.5 and s["meas"] == 25.1 and s["wait"] and s["want"] == -4.6 and s["raw"] == 25.1
    assert r.look(minutes=15) == []                       # the thermostat has not measured with the new offset yet: no second write
    assert r.status["climate.wz"]["wait"]
    st["climate.wz"]["attributes"]["current_temperature"] = 20.6
    assert r.look(minutes=1) == [] and not r.status["climate.wz"]["wait"]      # now the thermostat says the room's temperature
    assert r.status["climate.wz"]["raw"] == 25.2                                 # at the radiator: without the offset
    st["sensor.wz"] = sensor(21.5)                       # the room warms up: a whole degree
    assert r.look(minutes=1) == [("number", "set_value", {"entity_id": "number.wz_local_temperature_calibration", "value": -3.7})]
    st["climate.wz"]["attributes"]["current_temperature"] = 21.4
    st["sensor.wz"] = sensor(20.4)
    assert r.look(minutes=2) == []                        # at most every 10 minutes (battery)
    assert r.look(minutes=8)[0][2]["value"] == -4.7
    st["climate.wz"]["attributes"]["current_temperature"] = 20.6
    st["sensor.wz"] = sensor(20.4)
    assert r.look(minutes=20) == []                       # less than half a degree apart: left alone


def test_offset_at_its_limit_and_while_the_thermostat_is_off():
    st = {"climate.wz": trv(meas=28.0, mode="off"), "sensor.wz": sensor(20.0), "number.wz_temperature_offset": number(0, -5, 5, 0.5)}
    r = Run(wz(), st, {"climate.wz": ["number.wz_temperature_offset"]})
    assert r.look() == [] and r.status["climate.wz"]["want"] == -5     # off: nothing written
    st["climate.wz"]["state"] = "heat"
    assert r.look()[0][2]["value"] == -5 and r.status["climate.wz"]["edge"]


def test_external_input_with_its_select_and_without_sensor():
    st = {"climate.wz": trv(meas=24.0), "sensor.wz": sensor(20.5), "number.trv_external_temperature_input": number(0, 0, 99.9),
          "select.trv_temperature_sensor_select": {"state": "internal", "attributes": {"options": ["internal", "external"]}}}
    r = Run(wz(), st, {"climate.wz": ["number.trv_external_temperature_input", "select.trv_temperature_sensor_select"]})
    calls = r.look()
    assert ("select", "select_option", {"entity_id": "select.trv_temperature_sensor_select", "option": "external"}) in calls
    assert ("number", "set_value", {"entity_id": "number.trv_external_temperature_input", "value": 20.5}) in calls
    st["sensor.wz"] = sensor(20.7)
    assert r.look(minutes=11) == [("number", "set_value", {"entity_id": "number.trv_external_temperature_input", "value": 20.7})]
    assert r.look(minutes=11) == []                       # nothing new
    assert r.look(minutes=25) != []                       # sent again after half an hour, some thermostats forget it
    st["sensor.wz"] = {"state": "unavailable"}
    assert r.look(minutes=1) == [("select", "select_option", {"entity_id": "select.trv_temperature_sensor_select", "option": "internal"})]
    assert r.status["climate.wz"]["lost"]
    st["sensor.wz"] = sensor(20.9)
    assert ("select", "select_option", {"entity_id": "select.trv_temperature_sensor_select", "option": "external"}) in r.look(minutes=4)


def test_danfoss_counts_in_hundredths():
    st = {"climate.wz": trv(meas=24.0), "sensor.wz": sensor(20.53), "number.ally_external_measured_room_sensor": number(-8000, -8000, 3500, 1)}
    r = Run(wz(), st, {"climate.wz": ["number.ally_external_measured_room_sensor"]})
    assert r.look() == [("number", "set_value", {"entity_id": "number.ally_external_measured_room_sensor", "value": 2053})]
    assert r.status["climate.wz"]["sent"] == 20.53


def test_target_moved_for_a_thermostat_without_calibration():
    st = {"climate.wz": trv(target=21.0, meas=25.0), "sensor.wz": sensor(21.0)}
    r = Run(wz(), st, {})
    assert r.look() == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 25.0})]
    s = r.status["climate.wz"]
    assert s["way"] == "shift" and s["wish"] == 21.0 and s["want"] == 25.0
    assert rs.virtual(st, r.mem)["climate.wz"]["attributes"]["temperature"] == 21.0   # the rules see the wish
    assert st["climate.wz"]["attributes"]["temperature"] == 25.0                     # the states themselves stay
    st["climate.wz"]["attributes"]["current_temperature"] = 25.2
    assert r.look(minutes=12) == []                       # 0,2° more: not worth a write
    st["sensor.wz"] = sensor(22.5)                        # warmer than wished
    assert r.look(minutes=1) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 23.5})]
    # somebody sets 23° in Home Assistant: that is what the room should get
    st["climate.wz"]["attributes"]["temperature"] = 23.0
    assert r.look(minutes=1) == []                        # just sent: the thermostat may not have reported yet
    calls = r.look(minutes=3)
    assert r.mem["t"]["climate.wz"]["wish"] == 23.0 and calls == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 25.5})]


def test_target_set_by_hand_before_the_add_on_sent_anything():
    st = {"climate.wz": trv(target=21.0, meas=21.0), "sensor.wz": sensor(21.0)}
    r = Run(wz(), st, {})
    assert r.look() == []
    st["climate.wz"]["attributes"]["temperature"] = 22.0
    st["sensor.wz"] = sensor(20.0)
    assert r.look(minutes=1) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 23.0})]
    assert r.mem["t"]["climate.wz"]["wish"] == 22.0


def test_a_target_it_sent_reported_late_is_no_wish():
    """the owner (#577): "Soll 29,5°", "↕ am Thermostat 30°", "Von Hand gedreht · ab 17:23 wieder Komfort 27,5°": the moved target, reported
    by a sleepy thermostat more than 3 minutes later, became the wish, and the difference came on top again (27,5 → 29 → 30)"""
    st = {"climate.wz": trv(target=27.5, meas=26.5), "sensor.wz": sensor(24.8)}
    r = Run(wz(), st, {})
    assert r.look(apply=False) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 29.0})]
    assert r.look(minutes=4, apply=False) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 29.0})]   # once more (#592)
    assert r.mem["t"]["climate.wz"]["wish"] == 27.5 and r.log[0]["why"] == "again"   # no answer yet: still 27,5 at the thermostat
    st["climate.wz"]["attributes"]["current_temperature"] = 27.2                     # the radiator warmer: 30° now
    assert r.look(minutes=7, apply=False) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 30.0})]
    st["climate.wz"]["attributes"]["temperature"] = 29.0                             # the 29° of before comes now
    assert r.look(minutes=1) == [] and r.mem["t"]["climate.wz"]["wish"] == 27.5
    assert r.status["climate.wz"]["wish"] == 27.5 and not r.log
    assert r.look(minutes=3) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 30.0})]   # the 30° once more
    st["climate.wz"]["attributes"]["temperature"] = 22.0                             # somebody turns it at the device: that is a wish
    assert r.look(minutes=4) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 24.5})]
    assert r.mem["t"]["climate.wz"]["wish"] == 22.0


def test_a_target_the_thermostat_did_not_take_is_no_wish():
    """the owner's report (#592, his WZFL on 2026-10-29): 🔥 Zu warm set the wish 12°, the add-on sent 13,5°, the thermostat did not take
    it and went on showing the 24,5° the add-on itself had sent before; 30 minutes later these 24,5° counted as "neuer Wunsch von außen",
    the room was heated to 26° while the card said "Thermostat 12°". A target that stays is no wish: it is sent again after 3 minutes (at
    most 5 times, then every 10 minutes as usual), the wish stays 12°."""
    st = {"climate.wz": trv(target=23.0, meas=25.0), "sensor.wz": sensor(23.5)}
    r = Run(wz("shift"), st, {})
    assert r.look() == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 24.5})]   # 23 + (25 − 23,5), taken
    assert rs.set_wish(r.mem, "climate.wz", 12.0)                                    # 🔥 Zu warm
    sent = []
    for minutes in [1] + [3] * 15:                                                   # 46 minutes: the thermostat takes nothing
        sent += [c[2]["temperature"] for c in r.look(minutes, apply=False)]
        assert r.mem["t"]["climate.wz"]["wish"] == 12.0 and not [x for x in r.log if x["act"] == "wish"]
    assert sent == [13.5] * 8 and r.status["climate.wz"]["wait"]                    # at once, 5 times again, then every 10 minutes
    assert r.look(10) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 13.5})]  # and now it takes it
    assert r.look(3) == [] and r.look(10) == [] and not r.status["climate.wz"]["wait"]
    st["climate.wz"]["attributes"]["temperature"] = 22.0                             # somebody turns it: that is a wish
    assert r.look(1) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 23.5})]
    assert r.mem["t"]["climate.wz"]["wish"] == 22.0


def test_a_wish_set_somewhere_else_is_said_once():
    """the owner's report (#592): "↕ neuer Wunsch 23°" every 15 seconds for four minutes: the wish was taken, nothing had to be sent (the
    thermostat measured what the room had), and at the next look it was taken again"""
    st = {"climate.wz": trv(target=21.0, meas=21.0), "sensor.wz": sensor(21.0)}
    r = Run(wz("shift"), st, {})
    assert r.look() == []
    st["climate.wz"]["attributes"]["temperature"] = 23.0
    wishes = []
    for _ in range(6):
        assert r.look(0.25) == []
        wishes += [x for x in r.log if x["act"] == "wish"]
    assert [x["v"] for x in wishes] == [23.0] and r.mem["t"]["climate.wz"]["wish"] == 23.0


def test_a_thermostat_switched_on_shows_a_target_it_remembered():
    """off (not by the window rule) or not reporting, then on again: a Zigbee radiator thermostat shows the target it had (the owner's
    bathroom, #583: 24° instead of the 17° sent): no wish, the add-on's target once more"""
    st = {"climate.wz": trv(target=21.0, meas=22.0), "sensor.wz": sensor(21.0)}
    r = Run(wz("shift"), st, {})
    assert r.look() == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 22.0})]
    st["climate.wz"]["state"], st["climate.wz"]["attributes"]["temperature"] = "off", 5.0
    assert r.look(20) == [] and r.mem["t"]["climate.wz"]["wish"] == 21.0          # off: its 5° are no wish
    assert rs.set_wish(r.mem, "climate.wz", 17.0)                                    # a rule turns it on to 17°
    assert r.look(apply=False) == []                                                 # still off: nothing to send yet
    st["climate.wz"]["state"] = "heat"
    assert r.look(0.25, apply=False) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 18.0})]
    st["climate.wz"]["attributes"]["temperature"] = 24.0                             # on with the target it remembered
    assert r.look(1) == [] and r.look(2.5) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 18.0})]
    assert r.mem["t"]["climate.wz"]["wish"] == 17.0
    st["climate.wz"]["state"] = "unavailable"                                        # gone a while, back with a target of its own
    assert r.look(30) == [] and r.status["climate.wz"]["gone"]
    st["climate.wz"]["state"], st["climate.wz"]["attributes"]["temperature"] = "heat", 20.0
    assert r.look(1) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 18.0})]   # sent long ago: at once
    assert r.mem["t"]["climate.wz"]["wish"] == 17.0 and not [x for x in r.log if x["act"] == "wish"]


def test_the_window_rule_holds_a_moved_thermostat_alone():
    """#577 (the owner: "der Heizplan überschreibt irgendwie alles, selbst wenn die Fenster aufgehen"): while the window is open nothing
    moves the thermostat (a warm target to one that went back to heating by itself), as cold as it goes stays that; shut, the wish of
    before comes back, moved. Run as rulesrun._heat does it."""
    rules = hr.clean_rules({"window": {"on": True, "delay": 0}, "schedule": {"on": True, "levels": {"comfort": 21.0}, "rooms": {"h/wz": {"days": [[[0, "comfort"]]] * 7}}},
                            "sensors": wz()})
    rooms = [{"key": "h/wz", "name": "Wohnzimmer", "climates": ["climate.wz"], "windows": ["binary_sensor.fenster"], "doors": [], "outer": []}]
    st = {"climate.wz": trv(target=21.0, meas=24.0), "sensor.wz": sensor(21.0), "binary_sensor.fenster": {"state": "off"}}
    run = {"heat": {}, "sensors": rs.clean_mem({}), "now": 1_000_000.0}

    def look(minutes=0):
        run["now"] += minutes * 60
        heat, calls, _, _ = hr.step(rules, rooms, rs.virtual(st, run["sensors"], hr.held(run["heat"])), run["now"], datetime.datetime(2026, 10, 28, 12), run["heat"])
        run["heat"], hold = heat, hr.held(heat)
        out = [("climate", svc, {"entity_id": e, **data}) for e, svc, data in rs.route(calls, run["sensors"], hold)]
        run["sensors"], more, run["status"], _ = rs.step(rules["sensors"], st, {}, run["sensors"], run["now"], hold)
        out += more
        done(st, out)
        for _, svc, data in out:
            if svc == "set_hvac_mode":
                st["climate.wz"]["state"] = data["hvac_mode"]
        return out

    assert look() == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 24.0})]
    st["binary_sensor.fenster"]["state"] = "on"
    assert look() == [("climate", "set_hvac_mode", {"entity_id": "climate.wz", "hvac_mode": "off"})]
    st["climate.wz"]["state"], st["sensor.wz"] = "heat", sensor(18.0)                  # it heats again by itself, the room gets cold
    assert look(11) == [("climate", "set_hvac_mode", {"entity_id": "climate.wz", "hvac_mode": "off"})]   # not 27° (21 + 6)
    assert look(1) == [] and run["status"]["climate.wz"]["hold"]
    st["climate.wz"]["state"] = "heat"                                                 # and again: now as cold as it goes
    assert look(3) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 5})]
    assert look(5) == [] and run["sensors"]["t"]["climate.wz"]["wish"] == 21.0
    assert rs.virtual(st, run["sensors"], hr.held(run["heat"]))["climate.wz"]["attributes"]["temperature"] == 5   # the rules see it is cold
    st["binary_sensor.fenster"]["state"], st["sensor.wz"] = "off", sensor(20.0)
    assert look(1) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 25.0})]   # the wish 21 + (24 − 20)
    assert not run["status"]["climate.wz"].get("hold") and run["sensors"]["t"]["climate.wz"]["wish"] == 21.0


def test_heating_rules_and_pages_set_the_wish():
    st = {"climate.wz": trv(target=21.0, meas=24.0), "sensor.wz": sensor(21.0), "climate.bad": trv()}
    r = Run(wz(), st, {})
    r.look()
    rest = rs.route([("climate.wz", "set_temperature", {"temperature": 17.0}), ("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"}),
                     ("climate.bad", "set_temperature", {"temperature": 17.0})], r.mem)
    assert rest == [("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"}), ("climate.bad", "set_temperature", {"temperature": 17.0})]
    assert r.look(minutes=1) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 20.0})]   # at once, not after 10 min
    assert rs.set_wish(r.mem, "climate.wz", 22) and not rs.set_wish(r.mem, "climate.bad", 22) and not rs.set_wish(r.mem, "climate.wz", "x")
    assert r.look(minutes=1)[0][2]["temperature"] == 25.0
    # the window rule: as cold as it goes stays as cold as it goes
    rs.route([("climate.wz", "set_temperature", {"temperature": 5.0})], r.mem)
    assert r.look()[0][2]["temperature"] == 5.0


def test_sensor_lost_the_thermostat_on_its_own():
    st = {"climate.wz": trv(target=21.0, meas=24.0), "sensor.wz": sensor(21.0)}
    r = Run(wz(), st, {})
    assert r.look()[0][2]["temperature"] == 24.0
    st["sensor.wz"] = {"state": "unavailable"}
    assert r.look(minutes=11) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 21.0})]
    assert r.status["climate.wz"]["lost"]


def test_auto_cal_show_and_nocal():
    st = {"climate.wz": trv(), "sensor.wz": sensor(20.0)}
    r = Run(wz("cal"), st, {})
    assert r.look() == [] and r.status["climate.wz"]["way"] == "show" and r.status["climate.wz"]["nocal"]
    r = Run(wz("show"), st, {"climate.wz": []})
    assert r.look() == [] and r.status["climate.wz"] == {"s": "sensor.wz", "v": 20.0, "meas": 25.1, "way": "show", "lost": False}
    st["climate.wz"]["state"] = "unavailable"
    r = Run(wz(), st, {})
    assert r.look() == [] and r.status["climate.wz"]["gone"]


def test_taken_away_puts_it_back():
    st = {"climate.wz": trv(meas=25.1), "sensor.wz": sensor(20.5), "number.wz_local_temperature_calibration": number(-1.0),
          "climate.hm": trv(target=20.0, meas=23.0), "sensor.hm": sensor(20.0)}
    cfg = {"map": {"climate.wz": {"s": "sensor.wz", "way": "auto"}, "climate.hm": {"s": "sensor.hm", "way": "auto"}}}
    r = Run(cfg, st, {"climate.wz": ["number.wz_local_temperature_calibration"]})
    r.look()
    assert st["number.wz_local_temperature_calibration"]["state"] == "-5.6" and st["climate.hm"]["attributes"]["temperature"] == 23.0
    r.cfg = rs.clean({**cfg, "map": {"climate.hm": {"s": "sensor.wz", "way": "auto"}}})    # wz without sensor, hm with another one
    calls = r.look(minutes=1)
    assert ("number", "set_value", {"entity_id": "number.wz_local_temperature_calibration", "value": -1.0}) in calls    # the offset as before
    assert "climate.wz" not in r.mem["t"] and r.mem["t"]["climate.hm"]["wish"] == 20.0                                 # the wish stays
    r.cfg = rs.clean({**cfg, "on": False})
    assert r.look(minutes=1) == [("climate", "set_temperature", {"entity_id": "climate.hm", "temperature": 20.0})]     # switched off: the wish
    assert r.mem == {"t": {}} and r.status == {}


def test_too_warm_lowers_the_wish_of_a_moved_thermostat():
    """🔥 Zu warm with a room sensor that moves the target (the owner's thermostats): the room 1,5° warmer than the comfort 21° → the wish
    16°, moved by what the thermostat measures too much at the radiator; back at 21° in the room the wish 21° again. Run as rulesrun._heat does."""
    rules = hr.clean_rules({"warm": {"on": True}, "schedule": {"on": True, "levels": {"comfort": 21.0}, "rooms": {"h/wz": {"days": [[[0, "comfort"]]] * 7}}},
                            "sensors": wz("shift")})
    rooms = [{"key": "h/wz", "name": "Wohnzimmer", "climates": ["climate.wz"], "windows": [], "doors": [], "outer": []}]
    st = {"climate.wz": trv(target=21.0, meas=24.0), "sensor.wz": sensor(20.0)}
    run = {"heat": {}, "sensors": rs.clean_mem({}), "now": 1_000_000.0}

    def look(minutes=0):
        run["now"] += minutes * 60
        heat, calls, run["hs"], _ = hr.step(rules, rooms, rs.virtual(st, run["sensors"], hr.held(run["heat"])), run["now"], datetime.datetime(2026, 10, 28, 12), run["heat"])
        run["heat"], hold = heat, hr.held(heat)
        out = [("climate", svc, {"entity_id": e, **data}) for e, svc, data in rs.route(calls, run["sensors"], hold)]
        run["sensors"], more, _, _ = rs.step(rules["sensors"], st, {}, run["sensors"], run["now"], hold)
        out += more
        done(st, out)
        return out

    assert look() == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 25.0})]   # 21 + (24 − 20)
    st["sensor.wz"] = sensor(22.0)
    assert look(11) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 18.0})]  # too warm: 16 + (24 − 22)
    assert run["sensors"]["t"]["climate.wz"]["wish"] == 16.0 and run["hs"]["h/wz"]["warm"] == {"wish": 21.0, "room": 22.0, "to": 16.0}
    st["sensor.wz"] = sensor(21.0)
    assert look(11) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 24.0})]  # back: 21 + (24 − 21)
    assert run["sensors"]["t"]["climate.wz"]["wish"] == 21.0 and run["hs"]["h/wz"]["why"] == "schedule"


def test_the_owners_wish_of_27_while_too_warm_goes_back_to_12():
    """the owner's report (#592, 10:57): what 4.43.0 left in rules-state.json: too warm wants 12° (17° − 5°), but the wish of the moved
    thermostat is 27° (a target it had not taken) and the room 26,1° is heated on. After the update: seen as turned by hand, after his 5
    minutes the wish is 12° again, the thermostat 12° + (28,5° − 26,1°)."""
    rules = hr.clean_rules({"warm": {"on": True, "above": 2}, "schedule": {"on": True, "hand": 5, "levels": {"night": 17.0},
                                                                            "rooms": {"h/wz": {"days": [[[0, "night"]]] * 7}}}, "sensors": wz("shift")})
    rooms = [{"key": "h/wz", "name": "WZFL", "climates": ["climate.wz"], "windows": [], "doors": [], "outer": []}]
    st = {"climate.wz": trv(target=28.5, meas=28.5), "sensor.wz": sensor(26.1)}
    run = {"heat": {}, "sensors": rs.clean_mem({}), "now": 1_000_000.0}

    def look(minutes=0):
        run["now"] += minutes * 60
        heat, calls, run["hs"], _ = hr.step(rules, rooms, rs.virtual(st, run["sensors"], hr.held(run["heat"])), run["now"], datetime.datetime(2026, 10, 29, 11), run["heat"])
        run["heat"], hold = heat, hr.held(heat)
        out = [("climate", svc, {"entity_id": e, **data}) for e, svc, data in rs.route(calls, run["sensors"], hold, rs.moved(rules["sensors"], st, {}))]
        run["sensors"], more, _, _ = rs.step(rules["sensors"], st, {}, run["sensors"], run["now"], hold)
        out += more
        done(st, out)
        return out

    assert look() == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 14.5})]   # too warm: 12 + 2,4, rounded
    t = run["sensors"]["t"]["climate.wz"]
    t["wish"], t["sentT"] = 27.0, t["sentT"] - 3600                              # as 4.43.0 left it
    assert look(1) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 29.5})]   # the sensor moves to its wish
    assert run["hs"]["h/wz"]["why"] == "warm" and look(3) == [] and run["hs"]["h/wz"]["hand"] == run["now"] + 300   # the card: turned
    assert look(4) == []                                                         # by hand, back at … (after a late report of the 12°)
    assert look(1) == [("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 14.5})]
    assert run["sensors"]["t"]["climate.wz"]["wish"] == 12.0 and not run["hs"]["h/wz"]["hand"]
