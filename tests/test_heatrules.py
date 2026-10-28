"""The add-on's own heating rules (heatrules.py, #546): the settings, the schedule, and what happens to a thermostat when a window opens,
everybody leaves, the night comes, the schedule moves on, it is warm outside, somebody taps boost or the holidays start."""
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import heatrules as hr  # noqa: E402

ROOMS = [{"key": "h/wz", "name": "Wohnzimmer", "climates": ["climate.wz"], "windows": ["binary_sensor.fenster"], "doors": [], "outer": ["binary_sensor.terrasse"],
          "entities": ["climate.wz"]},
         {"key": "h/bad", "name": "Bad", "climates": ["climate.bad"], "windows": ["binary_sensor.bad_fenster"], "doors": [], "outer": [], "entities": ["climate.bad"]}]
MON = datetime.datetime(2026, 10, 26, 7, 0)          # a Monday, 7:00


def thermostat(mode="heat", temp=21.0, modes=("off", "heat", "auto")):
    return {"state": mode, "attributes": {"temperature": temp, "hvac_modes": list(modes), "min_temp": 7, "max_temp": 28, "current_temperature": 20.5}}


def house(**more):
    st = {"climate.wz": thermostat(), "climate.bad": thermostat(temp=23.0), "binary_sensor.fenster": {"state": "off"}, "binary_sensor.terrasse": {"state": "off"},
          "binary_sensor.bad_fenster": {"state": "off"}, "person.anna": {"state": "home"}, "weather.home": {"state": "sunny", "attributes": {"temperature": 12}}}
    st.update(more)
    return st


def done(states, calls):
    """Home Assistant does what the calls say"""
    for e, svc, data in calls:
        if svc == "set_hvac_mode":
            states[e]["state"] = data["hvac_mode"]
        if svc == "set_temperature":
            states[e]["attributes"]["temperature"] = data["temperature"]


class Run:
    """the add-on looking at the house again and again"""
    def __init__(self, rules, states, at=MON, **kw):
        self.rules, self.states, self.local, self.now, self.mem, self.kw, self.all = hr.clean_rules(rules), states, at, 1_000_000.0, {}, kw, []

    def look(self, minutes=0):
        self.now += minutes * 60
        self.local += datetime.timedelta(minutes=minutes)
        self.mem, calls, self.status, self.log = hr.step(self.rules, ROOMS, self.states, self.now, self.local, self.mem, weather="weather.home", **self.kw)
        done(self.states, calls)
        self.all += calls
        return calls


def test_settings_are_cleaned():
    r = hr.clean_rules({"window": {"on": True, "delay": 999, "skip": ["h/wz", "bad key", 3]}, "away": {"temp": 99}, "night": {"from": "25:00", "rooms": {"h/bad": 16.3, "x": 4}},
                        "schedule": {"on": True, "levels": {"eco": 18.24}, "rooms": {"h/wz": {"days": [[[480, "comfort"], [0, "night"], [480, "eco"], [2000, "eco"], ["x", "eco"]], "junk"]},
                                                                                     "h/leer": {"days": [[], []]}}},
                        "holiday": {"until": "2026-11-02", "back": "9:00"}, "boost": "x"})
    assert r["window"] == {"on": True, "delay": 60, "doors": True, "skip": ["h/wz"]}
    assert r["away"]["temp"] == 30.0 and r["night"]["from"] == "22:30" and r["night"]["rooms"] == {"h/bad": 16.5}
    assert r["schedule"]["levels"] == {"night": 17.0, "eco": 18.0, "comfort": 21.0}
    assert r["schedule"]["rooms"] == {"h/wz": {"days": [[[0, "night"], [480, "eco"], [1439, "eco"]], [], [], [], [], [], []]}}   # an empty plan is dropped
    assert r["holiday"]["until"] == "2026-11-02" and r["holiday"]["back"] == "14:00" and r["boost"] == hr.DEFAULT["boost"]
    assert hr.clean_rules(None) == hr.clean_rules({}) and not hr.any_on(hr.clean_rules({})) and hr.any_on(r)


def test_schedule_level_at_a_time_with_preheating():
    plan = hr.clean_plan({"days": [[[360, "comfort"], [480, "eco"], [930, "comfort"], [1350, "night"]], [], [], [], [], [[480, "comfort"]], [[600, "comfort"], [1350, "night"]]]})
    lv = {"night": 17, "eco": 19, "comfort": 21}
    at = lambda d, h, m=0: hr.plan_level(plan, datetime.datetime(2026, 10, 26, h, m) + datetime.timedelta(days=d), lv)   # noqa: E731
    assert at(0, 5) == "night" and at(0, 6) == "comfort" and at(0, 7, 59) == "comfort" and at(0, 8) == "eco" and at(0, 23) == "night"   # Monday 5:00: Sunday's last block
    assert at(1, 12) == "night" and at(5, 9) == "comfort" and at(6, 9) == "comfort" and at(6, 12) == "comfort"   # a day without blocks: the last one before it
    assert hr.plan_level(plan, datetime.datetime(2026, 10, 26, 5, 40), lv, 30) == "comfort"     # comfort from 6:00, heated 30 min early
    assert hr.plan_level(plan, datetime.datetime(2026, 10, 26, 7, 40), lv, 30) == "comfort"     # eco from 8:00 is not warmer: not early
    assert hr.between(datetime.datetime(2026, 1, 1, 23, 0), "22:30", "06:00") and hr.between(datetime.datetime(2026, 1, 1, 5, 59), "22:30", "06:00")
    assert not hr.between(datetime.datetime(2026, 1, 1, 6, 0), "22:30", "06:00") and hr.between(datetime.datetime(2026, 1, 1, 12, 0), "08:00", "13:00")


def test_window_open_switches_off_after_the_delay_and_back_when_shut():
    st = house()
    run = Run({"window": {"on": True, "delay": 2}}, st)
    assert run.look() == []
    st["binary_sensor.fenster"]["state"] = "on"
    assert run.look() == [] and run.status["h/wz"]["waiting"] and run.status["h/wz"]["why"] is None
    assert run.look(1) == []
    assert run.look(1) == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})]
    assert run.status["h/wz"]["why"] == "window" and run.status["h/wz"]["back"] == 21.0 and run.status["h/wz"]["open"] == ["binary_sensor.fenster"]
    assert run.log == [{"ent": "climate.wz", "act": "off", "v": "off", "why": "window", "room": "h/wz"}]
    assert run.look(5) == []                                                   # nothing again and again
    st["binary_sensor.fenster"]["state"] = "off"
    assert run.look(1) == [("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"}), ("climate.wz", "set_temperature", {"temperature": 21.0})]
    assert run.status["h/wz"]["why"] is None and st["climate.bad"]["state"] == "heat"   # the bathroom never noticed


def test_a_short_airing_does_nothing_and_the_terrace_door_counts_too():
    st = house()
    run = Run({"window": {"on": True, "delay": 2}}, st)
    st["binary_sensor.fenster"]["state"] = "on"
    run.look()
    st["binary_sensor.fenster"]["state"] = "off"
    assert run.look(1) == [] and run.look(5) == []
    st["binary_sensor.terrasse"]["state"] = "on"
    run.look()
    assert run.look(2)[0] == ("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})
    run2 = Run({"window": {"on": True, "delay": 0, "doors": False}}, house(**{"binary_sensor.terrasse": {"state": "on"}}))
    assert run2.look() == []                                                   # doors to the outside not watched


def test_heat_anyway_until_the_window_shuts_and_rooms_left_alone():
    st = house(**{"binary_sensor.fenster": {"state": "on"}})
    run = Run({"window": {"on": True, "delay": 0}}, st)
    run.look()
    assert st["climate.wz"]["state"] == "off"
    run.mem = hr.skip(run.mem, "h/wz")
    assert run.look()[0] == ("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"}) and run.status["h/wz"]["skip"]   # "Trotzdem heizen"
    assert run.look(10) == []
    st["binary_sensor.fenster"]["state"] = "off"
    run.look()
    st["binary_sensor.fenster"]["state"] = "on"
    assert run.look()[0][2] == {"hvac_mode": "off"}                            # the next airing is watched again
    st2 = house(**{"binary_sensor.fenster": {"state": "on"}, "binary_sensor.bad_fenster": {"state": "on"}})
    run2 = Run({"window": {"on": True, "delay": 0, "skip": ["h/wz"]}}, st2)
    assert run2.look() == [("climate.bad", "set_hvac_mode", {"hvac_mode": "off"})]   # the room switched off at the rule stays as it is


def test_the_window_counts_also_when_the_thermostat_has_a_window_detection_of_its_own():
    """the owner: the window open, the rule on, but the schedule stayed: his thermostat's switch "window detection" is on (its default),
    which only says it may guess an open window from a drop of the temperature; the contact in the plan knows"""
    plan = {"days": [[[0, "comfort"]]] * 7}
    st = house(**{"switch.wz_window_detection": {"state": "on"}})
    run = Run({"window": {"on": True, "delay": 2}, "schedule": {"on": True, "rooms": {"h/wz": plan}}}, st)
    run.look()
    assert run.status["h/wz"]["why"] == "schedule"
    st["binary_sensor.fenster"]["state"] = "on"
    run.look()
    assert run.status["h/wz"]["waiting"] and st["climate.wz"]["state"] == "heat"
    run.look(2)
    assert st["climate.wz"]["state"] == "off" and run.status["h/wz"]["why"] == "window"
    st["binary_sensor.fenster"]["state"] = "off"
    run.look()
    assert st["climate.wz"]["state"] == "heat" and st["climate.wz"]["attributes"]["temperature"] == 21.0


def test_a_thermostat_that_stays_on_with_the_window_open_gets_the_call_again():
    """the owner (#571): "Heizung pausiert · Fenster offen seit 25 Min", but the thermostat still heated at 17°: it took no "off" (or went
    back to heating by itself) and the rule sent it only once"""
    plan = {"days": [[[0, "night"]]] * 7}
    st = house(**{"climate.wz": thermostat(temp=17.0)})
    run = Run({"window": {"on": True, "delay": 2}, "schedule": {"on": True, "rooms": {"h/wz": plan}}}, st)
    run.look()
    st["binary_sensor.fenster"]["state"] = "on"
    run.look()
    assert run.look(2) == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})]
    st["climate.wz"]["state"] = "heat"                                          # it does not stay off
    assert run.look(1) == [] and run.look(1) == []                              # a sleepy thermostat gets time to say so
    assert run.look(1) == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})]   # 3 minutes: once more
    st["climate.wz"]["state"] = "heat"
    assert run.look(3) == [("climate.wz", "set_temperature", {"temperature": 7})]   # then as cold as it goes (its minimum 7°)
    assert st["climate.wz"]["attributes"]["temperature"] == 7 and run.look(3) == [] and not run.status["h/wz"]["stuck"]
    assert run.status["h/wz"]["why"] == "window" and run.status["h/wz"]["back"] == 17.0
    st["binary_sensor.fenster"]["state"] = "off"
    run.look()
    assert st["climate.wz"]["state"] == "heat" and st["climate.wz"]["attributes"]["temperature"] == 17.0   # shut: as before


def test_a_thermostat_off_a_moment_that_heats_again_by_itself_gets_cold_next():
    """#577: it took "off", then went back to heating by itself, again and again: the tries count on (before: "off" every 3 minutes for
    ever, heating in between), so the next one is as cold as it goes"""
    st = house()
    run = Run({"window": {"on": True, "delay": 0}}, st)
    st["binary_sensor.fenster"]["state"] = "on"
    assert run.look() == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})]
    assert run.look(1) == [] and st["climate.wz"]["state"] == "off"                # off a moment
    st["climate.wz"]["state"] = "heat"                                             # then heating again by itself
    assert run.look(3) == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})]
    assert run.look(1) == []
    st["climate.wz"]["state"] = "heat"
    assert run.look(3) == [("climate.wz", "set_temperature", {"temperature": 7})]
    assert run.look(10) == [] and not run.status["h/wz"]["stuck"] and run.status["h/wz"]["back"] == 21.0


def test_a_thermostat_that_takes_nothing_shows_it_and_is_not_asked_for_ever():
    st = house()
    run = Run({"window": {"on": True, "delay": 0}}, st)
    st["binary_sensor.fenster"]["state"] = "on"
    calls = []
    for _ in range(12):
        calls += run.look(3)
        st["climate.wz"]["state"], st["climate.wz"]["attributes"]["temperature"] = "heat", 21.0   # back to heating, always
    assert len(calls) == 1 + hr.TRIES and run.status["h/wz"]["stuck"] and run.status["h/wz"]["why"] == "window"
    st["climate.wz"]["state"] = "off"                                              # off by hand: fine again
    run.look()
    assert not run.status["h/wz"]["stuck"]


def test_an_air_conditioner_with_the_window_open_only_gets_off_never_cold():
    st = house(**{"climate.wz": thermostat(mode="cool", temp=22.0, modes=("off", "cool", "heat"))})
    run = Run({"window": {"on": True, "delay": 0}}, st)
    st["binary_sensor.fenster"]["state"] = "on"
    calls = []
    for _ in range(4):
        calls += run.look(3)
        st["climate.wz"]["state"] = "cool"
    assert calls and all(c == ("climate.wz", "set_hvac_mode", {"hvac_mode": "off"}) for c in calls)


def test_the_schedule_moves_on_while_the_window_is_open():
    plan = {"days": [[[0, "night"], [360, "comfort"], [480, "eco"]]] * 7}
    st = house()
    run = Run({"window": {"on": True, "delay": 0}, "schedule": {"on": True, "rooms": {"h/wz": plan}}}, st, at=MON.replace(hour=7, minute=50))
    assert run.look() == []                                                    # comfort 21° is what it has
    assert run.status["h/wz"]["why"] == "schedule" and run.status["h/wz"]["level"] == "comfort"
    st["binary_sensor.fenster"]["state"] = "on"
    run.look()
    assert st["climate.wz"]["state"] == "off"
    run.look(15)                                                               # 8:05: eco now, the window still open
    assert st["climate.wz"]["state"] == "off" and run.status["h/wz"]["why"] == "window"
    st["binary_sensor.fenster"]["state"] = "off"
    run.look()
    assert st["climate.wz"]["state"] == "heat" and st["climate.wz"]["attributes"]["temperature"] == 19.0   # eco, not the comfort before


def test_a_turn_by_hand_stays_until_the_next_block():
    plan = {"days": [[[0, "night"], [360, "comfort"], [480, "eco"]]] * 7}
    st = house(**{"climate.wz": thermostat(temp=18.0)})
    run = Run({"schedule": {"on": True, "hand": 0, "rooms": {"h/wz": plan}}}, st, at=MON.replace(hour=6, minute=30))
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 21.0})]
    st["climate.wz"]["attributes"]["temperature"] = 23.0                        # by hand
    assert run.look(10) == [] and st["climate.wz"]["attributes"]["temperature"] == 23.0
    assert run.look(80) == [("climate.wz", "set_temperature", {"temperature": 19.0})]   # 8:00
    run.rules = hr.clean_rules({})                                              # switched off: left as it is
    assert run.look(1) == []


def test_a_turn_by_hand_goes_back_to_the_schedule_after_some_minutes():
    """the owner: "wenn man von Hand dreht nach 10 min wieder zurück, aber das kann eingestellt werden" (10 minutes unless set)"""
    plan = {"days": [[[0, "night"], [360, "comfort"], [480, "eco"]]] * 7}
    st = house(**{"climate.wz": thermostat(temp=18.0)})
    run = Run({"schedule": {"on": True, "rooms": {"h/wz": plan}}}, st, at=MON.replace(hour=6, minute=30))
    assert run.rules["schedule"]["hand"] == 10 and hr.clean_rules({"schedule": {"hand": 999}})["schedule"]["hand"] == 240
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 21.0})]
    assert run.look(1) == [] and run.status["h/wz"]["hand"] is None
    st["climate.wz"]["attributes"]["temperature"] = 23.0                        # by hand
    assert run.look() == [] and run.status["h/wz"]["hand"] == run.now + 600       # the page says when it goes back
    assert run.look(9) == [] and st["climate.wz"]["attributes"]["temperature"] == 23.0
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 21.0})] and run.status["h/wz"]["hand"] is None
    st["climate.wz"]["attributes"]["temperature"] = 22.5                        # turned, and again 8 minutes later: 10 from the last turn
    run.look()
    run.look(8)
    st["climate.wz"]["attributes"]["temperature"] = 23.5
    assert run.look(1) == [] and run.status["h/wz"]["hand"] == run.now + 600
    assert run.look(9) == [] and run.look(1) == [("climate.wz", "set_temperature", {"temperature": 21.0})]
    assert run.log[-1]["why"] == "schedule"
    st["climate.wz"]["attributes"]["temperature"] = 22.0                        # turned again, and back to 21 by hand before the time
    run.look(5)
    st["climate.wz"]["attributes"]["temperature"] = 21.0
    assert run.look(1) == [] and run.status["h/wz"]["hand"] is None
    assert run.look(20) == []                                                   # nothing pending any more
    st["climate.wz"]["state"] = "off"                                           # switched off on purpose: left alone
    assert run.look(30) == [] and st["climate.wz"]["state"] == "off"
    st["climate.wz"].update(state="heat", attributes={**st["climate.wz"]["attributes"], "temperature": 21.0, "target_temp_step": 1})
    run.rules = hr.clean_rules({"schedule": {"on": True, "levels": {"comfort": 20.5}, "rooms": {"h/wz": plan}}})
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 20.5})]
    st["climate.wz"]["attributes"]["temperature"] = 21.0                        # a thermostat of whole degrees rounds: not by hand
    assert run.look(2) == [] and run.status["h/wz"]["hand"] is None                  # (7:59: the plan moves on at 8:00)


def test_nobody_at_home_then_back_as_before():
    st = house(**{"climate.wz": thermostat(temp=22.0)})
    run = Run({"away": {"on": True, "delay": 30, "temp": 17}}, st)
    st["person.anna"]["state"] = "not_home"
    assert run.look() == [] and run.look(29) == []
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 17.0}), ("climate.bad", "set_temperature", {"temperature": 17.0})]
    assert run.status["h/wz"]["why"] == "away"
    st["person.anna"]["state"] = "home"
    assert run.look(60) == [("climate.wz", "set_temperature", {"temperature": 22.0}), ("climate.bad", "set_temperature", {"temperature": 23.0})]


def test_night_setback_and_the_morning():
    st = house()
    run = Run({"night": {"on": True, "from": "22:30", "to": "06:00", "temp": 17, "rooms": {"h/bad": 16}}}, st, at=MON.replace(hour=22, minute=0))
    assert run.look() == []
    assert run.look(30) == [("climate.wz", "set_temperature", {"temperature": 17.0}), ("climate.bad", "set_temperature", {"temperature": 16.0})]
    assert run.look(7 * 60) == []                                              # 5:30
    assert run.look(30) == [("climate.wz", "set_temperature", {"temperature": 21.0}), ("climate.bad", "set_temperature", {"temperature": 23.0})]


def test_summer_pause_after_some_warm_hours():
    st = house(**{"weather.home": {"state": "sunny", "attributes": {"temperature": 22}}})
    run = Run({"summer": {"on": True, "above": 18, "hours": 6}}, st)
    assert run.look() == [] and run.look(5 * 60) == []
    calls = run.look(60)
    assert ("climate.wz", "set_hvac_mode", {"hvac_mode": "off"}) in calls and run.status["h/wz"]["why"] == "summer"
    st["weather.home"]["attributes"]["temperature"] = 17.5                     # a little cooler: not yet (no flapping)
    assert run.look(60) == []
    st["weather.home"]["attributes"]["temperature"] = 15
    assert ("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"}) in run.look(60) and st["climate.wz"]["attributes"]["temperature"] == 21.0


def test_boost_for_some_minutes_or_until_tapped_again():
    st = house()
    run = Run({"boost": {"minutes": 30, "temp": 26}}, st)
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 26.0})] and run.status["h/wz"]["until"] == run.now + 1800
    assert run.look(29) == []
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 21.0})]
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)
    run.look()
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)                     # tapped again: over
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 21.0})]


def test_holidays_until_the_day_back_and_with_the_holiday_alarm():
    st = house()
    run = Run({"holiday": {"on": True, "temp": 15, "until": "2026-10-27", "back": "14:00"}}, st)
    assert run.look()[0] == ("climate.wz", "set_temperature", {"temperature": 15.0}) and run.status["h/wz"]["why"] == "holiday"
    assert run.look(24 * 60) == []                                             # Tuesday 7:00, the day back: still holidays
    assert run.look(7 * 60)[0] == ("climate.wz", "set_temperature", {"temperature": 21.0})   # 14:00: warm when they come
    run2 = Run({"holiday": {"guard": True, "temp": 15}}, house(), guard_armed=True)
    assert run2.look()[0][2] == {"temperature": 15.0}


def test_a_thermostat_without_off_and_one_that_is_gone():
    st = house(**{"climate.wz": thermostat(modes=("heat",)), "climate.bad": {"state": "unavailable", "attributes": {}}, "binary_sensor.fenster": {"state": "on"},
                  "binary_sensor.bad_fenster": {"state": "on"}})
    run = Run({"window": {"on": True, "delay": 0}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 7})]   # as cold as it goes
    assert "h/bad" not in run.status and "climate.bad" not in run.mem["t"]


def test_an_air_conditioner_only_gets_the_window_rule():
    st = house(**{"climate.wz": thermostat(mode="cool", temp=22.0, modes=("off", "cool", "heat", "dry"))})
    run = Run({"window": {"on": True, "delay": 0}, "night": {"on": True, "from": "00:00", "to": "23:59", "temp": 17}}, st)
    assert run.look() == [("climate.bad", "set_temperature", {"temperature": 17.0})]   # the night: only the heating thermostat
    assert run.status["h/wz"]["why"] is None
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)
    assert run.look() == []                                                    # no boost: it would heat
    st["binary_sensor.fenster"]["state"] = "on"
    assert run.look() == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})] and run.status["h/wz"]["why"] == "window"
    st["binary_sensor.fenster"]["state"] = "off"
    assert run.look()[0] == ("climate.wz", "set_hvac_mode", {"hvac_mode": "cool"})   # back to cooling
