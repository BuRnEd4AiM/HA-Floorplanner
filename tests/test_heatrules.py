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


def test_a_target_reported_late_is_no_turn_by_hand_and_is_sent_again_when_not_taken():
    """#579, the owner: "von selbst gedreht … er selbst und er weiß es nicht": the schedule sends 21° at 6:00, a sleepy radiator
    thermostat reports it some minutes later; until then Home Assistant shows the old 18°, which is no turn by hand"""
    plan = {"days": [[[0, "night"], [360, "comfort"], [480, "eco"]]] * 7}
    st = house(**{"climate.wz": thermostat(temp=18.0)})
    run = Run({"schedule": {"on": True, "rooms": {"h/wz": plan}}}, st, at=MON.replace(hour=5, minute=59))
    run.look()
    late = []                                                               # the thermostat does nothing yet

    def look(minutes=0):
        run.now += minutes * 60
        run.local += datetime.timedelta(minutes=minutes)
        run.mem, calls, run.status, run.log = hr.step(run.rules, ROOMS, st, run.now, run.local, run.mem)
        late.extend(calls)
        return calls

    assert look(1) == [("climate.wz", "set_temperature", {"temperature": 21.0})]
    assert look(0.25) == [] and run.status["h/wz"]["hand"] is None and run.status["h/wz"]["sent"] == 21.0   # waiting, not "✋"
    assert look(2) == [] and run.status["h/wz"]["hand"] is None
    assert look(1) == [("climate.wz", "set_temperature", {"temperature": 21.0})] and run.log[-1]["again"]    # 3 minutes: not taken
    st["climate.wz"]["attributes"]["temperature"] = 21.0                    # now it reports it
    assert look(0.25) == [] and run.status["h/wz"]["sent"] is None and run.status["h/wz"]["hand"] is None
    st["climate.wz"]["attributes"]["temperature"] = 23.0                    # turned by hand later: that counts
    assert look(1) == [] and run.status["h/wz"]["hand"] == run.now + 600
    assert look(10) == [("climate.wz", "set_temperature", {"temperature": 21.0})]
    st["climate.wz"]["attributes"]["temperature"] = 22.0                    # turned again before the 21° came: by hand after 3 minutes
    assert look(1) == [] and run.status["h/wz"]["hand"] is None
    assert look(3) == [] and run.status["h/wz"]["hand"] == run.now + 600 and run.status["h/wz"]["sent"] is None
    sent = len(late)
    for _ in range(12):                                                     # a thermostat that never takes it: not asked for ever
        st["climate.wz"]["attributes"]["temperature"] = 18.0
        run.mem["t"]["climate.wz"]["sent"] = [21.0, run.now, 18.0, hr.TRIES]
        look(4)
    assert all(c[2]["temperature"] == 21.0 for c in late[sent:]) and len(late) - sent <= 3


def test_an_open_window_whose_contact_does_not_report_for_a_moment_stays_open():
    """#579: Home Assistant or Zigbee2MQTT starting again: the contact is unavailable a moment; the pause goes on, not the heating"""
    st = house()
    run = Run({"window": {"on": True, "delay": 0}}, st)
    st["binary_sensor.fenster"] = {"state": "on"}
    assert run.look() == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})]
    at = datetime.datetime.fromtimestamp(run.now, datetime.timezone.utc).isoformat()
    st["binary_sensor.fenster"] = {"state": "unavailable", "last_changed": at}
    assert run.look(1) == [] and run.status["h/wz"]["why"] == "window"
    st["binary_sensor.fenster"] = {"state": "on"}
    assert run.look(1) == [] and run.status["h/wz"]["why"] == "window"
    st["binary_sensor.fenster"] = {"state": "unknown", "last_changed": datetime.datetime.fromtimestamp(run.now, datetime.timezone.utc).isoformat()}
    assert run.look(14) == [] and run.status["h/wz"]["why"] == "window"
    assert run.look(2)[0] == ("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"})    # 16 minutes without a word: closed
    st["binary_sensor.fenster"] = {"state": "unavailable", "last_changed": datetime.datetime.fromtimestamp(run.now, datetime.timezone.utc).isoformat()}
    assert run.look(1) == [] and run.status["h/wz"]["why"] is None          # one that was shut stays shut


def test_a_door_between_two_rooms_counts_with_its_switch():
    """the owner: the bathroom's door to the corridor is open, the heating stayed on; with "Zählt für die Heizung" it pauses like a
    window, also with "Türen nach draußen" off"""
    rooms = [{**ROOMS[0], "doors": ["binary_sensor.flur"], "counted": ["binary_sensor.flur"]}]
    st = house(**{"binary_sensor.flur": {"state": "on"}})
    run = Run({"window": {"on": True, "delay": 0, "doors": False}}, st)
    run.mem, calls, run.status, _ = hr.step(run.rules, rooms, st, run.now, run.local, run.mem)
    assert calls == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})] and run.status["h/wz"]["open"] == ["binary_sensor.flur"]
    plain = [{**ROOMS[0], "doors": ["binary_sensor.flur"]}]                           # without the switch: a door between two rooms
    _, calls, status, _ = hr.step(run.rules, plain, house(**{"binary_sensor.flur": {"state": "on"}}), run.now, run.local, {})
    assert calls == [] and status["h/wz"]["open"] == []


def test_a_thermostat_switched_on_with_a_target_of_its_own_gets_the_plans():
    """the owner's bathroom (2026-10-28, 🩺 Protokoll): the schedule switched it on ("aus → heizen") and sent 17°, the thermostat took
    heating and then its own 24° it remembered; that was no turn by hand, the 17° goes again at once"""
    plan = {"days": [[[0, "night"], [360, "comfort"], [1290, "night"]]] * 7}
    st = house(**{"climate.wz": thermostat(mode="off", temp=5.0)})
    run = Run({"schedule": {"on": True, "hand": 5, "rooms": {"h/wz": plan}}}, st, at=MON.replace(hour=21, minute=29))
    run.mem, calls, run.status, _ = hr.step(run.rules, ROOMS, st, run.now, run.local, run.mem)

    def look(minutes):
        run.now += minutes * 60
        run.local += datetime.timedelta(minutes=minutes)
        run.mem, calls, run.status, run.log = hr.step(run.rules, ROOMS, st, run.now, run.local, run.mem)
        return calls

    assert look(1) == [("climate.wz", "set_temperature", {"temperature": 17.0})]          # "heizen" from 21:29 is still on its way
    assert look(0.1) == [] and run.status["h/wz"]["sent"] == 17.0                     # nothing reported yet: waiting
    st["climate.wz"]["state"] = "heat"                                                 # it took heating ...
    st["climate.wz"]["attributes"]["temperature"] = 24.0                               # ... with the 24° it remembered
    assert look(0.1) == [("climate.wz", "set_temperature", {"temperature": 17.0})] and run.log[-1]["again"]
    assert run.status["h/wz"]["hand"] is None
    assert look(1) == [] and run.status["h/wz"]["hand"] is None                       # waiting for the 17°
    st["climate.wz"]["attributes"]["temperature"] = 17.0
    assert look(0.25) == [] and run.status["h/wz"]["sent"] is None and run.status["h/wz"]["hand"] is None


# ---- 🔥 Zu warm (the owner: "wenn es zu warm ist das dann die heizung runter geht ka so 5 grad das es nicht die ganze zeit heizt";
# his choice: 5° below the wish from 1° too warm, back at the wish; "beachte die Prio von den ganzen Karten")
NIGHT = {"days": [[[0, "night"]]] * 7}


def warm_house(room=20.5, **more):
    st = house(**more)
    st["climate.wz"]["attributes"]["current_temperature"] = room
    return st


def measure(st, v, e="climate.wz"):
    st[e]["attributes"]["current_temperature"] = v


def test_the_too_warm_settings_are_cleaned():
    r = hr.clean_rules({"warm": {"on": True, "above": 0.7, "down": 40, "skip": ["h/bad", "bad key"]}})
    assert r["warm"] == {"on": True, "above": 0.5, "down": 15.0, "skip": ["h/bad"]}
    assert hr.clean_rules({})["warm"] == {"on": False, "above": 1.0, "down": 5.0, "skip": []} and hr.any_on(hr.clean_rules({"warm": {"on": True}}))


def test_a_room_too_warm_gets_5_degrees_less_until_it_is_back_at_the_wish():
    st = warm_house(room=17.5)
    run = Run({"warm": {"on": True}, "schedule": {"on": True, "rooms": {"h/wz": NIGHT}}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 17.0})]           # the schedule: night 17°
    measure(st, 17.9)
    assert run.look(1) == []                                                                  # not yet 1° too warm
    measure(st, 18.0)
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 12.0})] and run.log[-1]["why"] == "warm"
    s = run.status["h/wz"]
    assert s["why"] == "warm" and s["warm"] == {"wish": 17.0, "room": 18.0, "to": 12.0} and s["back"] == 17.0 and s["temp"] == 17.0
    measure(st, 17.4)
    assert run.look(5) == [] and run.status["h/wz"]["why"] == "warm"                            # still warmer than wished
    measure(st, 17.0)
    assert run.look(5) == [("climate.wz", "set_temperature", {"temperature": 17.0})] and run.status["h/wz"]["why"] == "schedule"
    assert run.look(5) == [] and run.status["h/wz"]["hand"] is None                            # no turn by hand


def test_too_warm_without_a_rule_takes_the_thermostats_own_target_and_keeps_its_mode():
    st = warm_house(room=22.5, **{"climate.wz": thermostat(mode="auto", temp=21.0)})
    st["climate.wz"]["attributes"]["current_temperature"] = 22.5
    run = Run({"warm": {"on": True}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 16.0})]            # 21° − 5°, auto stays auto
    assert st["climate.wz"]["state"] == "auto" and run.status["h/wz"]["warm"]["wish"] == 21.0
    measure(st, 21.0)
    assert run.look(10) == [("climate.wz", "set_temperature", {"temperature": 21.0})] and run.status["h/wz"]["why"] is None


def test_too_warm_measures_with_the_room_sensor_and_waits_while_it_is_gone():
    st = warm_house(room=25.0, **{"sensor.wz": {"state": "17.2"}})                            # at the radiator 25°, in the room 17,2°
    run = Run({"warm": {"on": True}, "sensors": {"map": {"climate.wz": {"s": "sensor.wz", "way": "show"}}},
               "schedule": {"on": True, "rooms": {"h/wz": NIGHT}}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 17.0})] and run.status["h/wz"]["why"] == "schedule"
    st["sensor.wz"]["state"] = "unavailable"
    assert run.look(1) == []                                                                  # nothing measures the room: nothing
    st["sensor.wz"]["state"] = "18.4"
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 12.0})]
    st["sensor.wz"]["state"] = "unavailable"
    assert run.look(1) == [] and run.status["h/wz"]["why"] == "warm"                            # gone for a moment: stays lowered
    st["sensor.wz"]["state"] = "16.9"
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 17.0})]


def test_the_window_and_the_boost_go_before_too_warm():
    st = warm_house(room=19.0)
    run = Run({"warm": {"on": True}, "window": {"on": True, "delay": 0}, "schedule": {"on": True, "rooms": {"h/wz": NIGHT}}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 12.0})]            # warm at once: 17° − 5°
    st["binary_sensor.fenster"]["state"] = "on"
    assert run.look(1) == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})] and run.status["h/wz"]["why"] == "window"
    st["binary_sensor.fenster"]["state"] = "off"
    calls = run.look(1)                                                                       # shut, still too warm: lowered again
    assert ("climate.wz", "set_temperature", {"temperature": 12.0}) in calls and st["climate.wz"]["state"] == "heat" and run.status["h/wz"]["why"] == "warm"
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)
    assert run.look(0) == [("climate.wz", "set_temperature", {"temperature": 24.0})] and run.status["h/wz"]["why"] == "boost"
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)                                      # boost off again: still too warm
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 12.0})] and run.status["h/wz"]["why"] == "warm"
    measure(st, 16.5)
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 17.0})] and run.status["h/wz"]["why"] == "schedule"


def test_too_warm_follows_the_schedule_and_ends_when_the_wish_is_warmer():
    plan = {"days": [[[0, "night"], [480, "comfort"]]] * 7}                                    # comfort 21° from 8:00
    st = warm_house(room=23.0)
    run = Run({"warm": {"on": True}, "schedule": {"on": True, "rooms": {"h/wz": plan}}}, st)   # 7:00: night 17°, the room 23°
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 12.0})]
    assert run.look(60) == [("climate.wz", "set_temperature", {"temperature": 16.0})]          # 8:00 comfort: 21° − 5°
    assert run.status["h/wz"]["warm"]["wish"] == 21.0 and run.status["h/wz"]["level"] == "comfort"
    measure(st, 20.0)
    assert run.look(10) == [("climate.wz", "set_temperature", {"temperature": 21.0})] and run.status["h/wz"]["why"] == "schedule"


def test_turned_by_hand_while_too_warm_stays_and_a_late_report_is_waited_for():
    st = warm_house(room=22.5)
    run = Run({"warm": {"on": True}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 16.0})]
    st["climate.wz"]["attributes"]["temperature"] = 23.0                                      # somebody wants it warmer
    measure(st, 20.0)
    assert run.look(5) == [] and st["climate.wz"]["attributes"]["temperature"] == 23.0        # stays as turned
    # lowered, but the thermostat did not report it yet when the room is cool again: the wish goes again
    st2 = warm_house(room=22.5)
    run2 = Run({"warm": {"on": True}}, st2)
    run2.mem, calls, run2.status, _ = hr.step(run2.rules, ROOMS, st2, run2.now, run2.local, run2.mem)
    assert calls == [("climate.wz", "set_temperature", {"temperature": 16.0})]                 # sent, not reported (21° still)
    measure(st2, 20.5)
    run2.mem, calls, run2.status, _ = hr.step(run2.rules, ROOMS, st2, run2.now + 30, run2.local, run2.mem)
    assert calls == [("climate.wz", "set_temperature", {"temperature": 21.0})] and run2.status["h/wz"]["why"] is None


def test_turned_while_still_too_warm_goes_down_again_after_the_minutes_of_hand():
    """the owner's report (#592): the card said "🔥 Zu warm · Thermostat 12°", the thermostat stood at 27° and heated, so the room never
    got cool enough for too warm to end. Turned while the room is still too warm: lowered again after the minutes of "Von Hand gedreht:
    zurück nach" (as under the schedule; the minutes count from the last turn), the card says when; with "erst beim nächsten
    Abschnitt" (0) it stays as turned."""
    st = warm_house(room=23.0)
    run = Run({"warm": {"on": True}, "schedule": {"on": True, "hand": 5, "rooms": {"h/wz": NIGHT}}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 12.0})]
    st["climate.wz"]["attributes"]["temperature"] = 27.0                         # somebody turns it up
    assert run.look(1) == [] and run.status["h/wz"]["why"] == "warm"           # a late report of the 12° is waited for (#579)
    assert run.look(3) == [] and run.status["h/wz"]["hand"] == run.now + 300
    st["climate.wz"]["attributes"]["temperature"] = 26.0                         # and again
    assert run.look(1) == [] and run.look(4) == [] and run.status["h/wz"]["hand"] == run.now + 60
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 12.0})] and run.log[-1]["why"] == "warm"
    assert run.look(10) == [] and run.status["h/wz"]["hand"] is None and run.status["h/wz"]["warm"]["to"] == 12.0
    st["climate.wz"]["state"] = "auto"                                            # another mode chosen at the device: left alone
    assert run.look(10) == [] and run.status["h/wz"]["hand"] is None
    st2 = warm_house(room=23.0)
    run2 = Run({"warm": {"on": True}, "schedule": {"on": True, "hand": 0, "rooms": {"h/wz": NIGHT}}}, st2)
    assert run2.look() == [("climate.wz", "set_temperature", {"temperature": 12.0})]
    st2["climate.wz"]["attributes"]["temperature"] = 27.0
    assert run2.look(1) == [] and run2.look(60) == [] and run2.status["h/wz"]["hand"] is None


def test_too_warm_leaves_alone_a_thermostat_that_is_off_a_room_left_out_and_an_air_conditioner():
    st = warm_house(room=25.0, **{"climate.wz": thermostat(mode="off")})
    st["climate.wz"]["attributes"]["current_temperature"] = 25.0
    st["climate.bad"]["attributes"]["current_temperature"] = 26.0
    run = Run({"warm": {"on": True, "skip": ["h/bad"]}}, st)
    assert run.look() == []
    ac = warm_house(room=25.0, **{"climate.wz": thermostat(modes=("off", "heat", "cool"))})
    ac["climate.wz"]["attributes"]["current_temperature"] = 25.0
    assert Run({"warm": {"on": True}, "summer": {"on": True}}, ac).look() == []


# ---- #588 (the owner: "die Reihenfolge der heizungsteureung muss stabiler sein und auch so das es da keine fehler gibt"): a sleepy
# radiator thermostat reports what it was sent some minutes later; the rules decide on what it will be, not on what it still shows
class Slow(Run):
    """a thermostat that reports what it was sent only when told (done(run.states, run.waiting))"""
    def look(self, minutes=0):
        self.now += minutes * 60
        self.local += datetime.timedelta(minutes=minutes)
        self.mem, calls, self.status, self.log = hr.step(self.rules, ROOMS, self.states, self.now, self.local, self.mem, weather="weather.home", **self.kw)
        self.waiting = getattr(self, "waiting", []) + calls
        return calls

    def reported(self, n=None):
        """the first n calls (all) come, in the order they were sent"""
        n = len(self.waiting) if n is None else n
        done(self.states, self.waiting[:n])
        self.waiting = self.waiting[n:]


def test_the_window_shut_before_the_thermostat_said_off_heats_again():
    st = house()
    run = Slow({"window": {"on": True, "delay": 0}}, st)
    st["binary_sensor.fenster"]["state"] = "on"
    assert run.look() == [("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})]
    st["binary_sensor.fenster"]["state"] = "off"                                  # shut again: it still shows heating, "off" is on its way
    assert run.look(1) == [("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"}), ("climate.wz", "set_temperature", {"temperature": 21.0})]
    run.reported()                                                                # "off", then heating at 21°
    assert st["climate.wz"]["state"] == "heat" and st["climate.wz"]["attributes"]["temperature"] == 21.0 and run.look(1) == []


def test_a_boost_that_ends_before_its_temperature_was_reported_goes_back():
    st = house(**{"climate.wz": thermostat(temp=17.0)})
    run = Slow({"schedule": {"on": True, "rooms": {"h/wz": NIGHT}}}, st)
    assert run.look() == [] and run.status["h/wz"]["why"] == "schedule"
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 24.0})]
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)                     # tapped again at once: it still shows 17°, 24° on its way
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 17.0})]
    run.reported()
    assert st["climate.wz"]["attributes"]["temperature"] == 17.0 and run.look(5) == []


def test_a_boost_while_heating_is_on_its_way_comes_back_to_heating():
    st = house(**{"climate.wz": thermostat(mode="off", temp=5.0)})
    run = Slow({"schedule": {"on": True, "rooms": {"h/wz": {"days": [[[0, "comfort"]]] * 7}}}}, st)
    assert run.look() == [("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"}), ("climate.wz", "set_temperature", {"temperature": 21.0})]
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)                     # boost before the thermostat said "heizen"
    assert run.look(0.5) == [("climate.wz", "set_temperature", {"temperature": 24.0})]
    run.reported()
    assert run.look(30) == [("climate.wz", "set_temperature", {"temperature": 21.0})]   # as it was: heating at 21°, not off
    run.reported()
    assert st["climate.wz"]["state"] == "heat" and st["climate.wz"]["attributes"]["temperature"] == 21.0


def test_a_turn_by_hand_does_not_come_back_when_the_level_changed_meanwhile():
    st = house()
    run = Run({"window": {"on": True, "delay": 0}, "away": {"on": True, "delay": 0, "temp": 17},
               "schedule": {"on": True, "hand": 0, "rooms": {"h/wz": {"days": [[[0, "comfort"]]] * 7}}}}, st)
    run.look()
    st["climate.wz"]["attributes"]["temperature"] = 25.0                         # by hand: stays until the next change
    st["binary_sensor.fenster"]["state"] = "on"
    assert run.look(1)[0] == ("climate.wz", "set_hvac_mode", {"hvac_mode": "off"})
    st["person.anna"]["state"] = "not_home"                                       # nobody at home and back, while the window is open
    run.look(30)
    st["person.anna"]["state"] = "home"
    run.look(30)
    st["binary_sensor.fenster"]["state"] = "off"
    assert run.look(1) == [("climate.wz", "set_hvac_mode", {"hvac_mode": "heat"}), ("climate.wz", "set_temperature", {"temperature": 21.0})]


def test_a_turn_while_too_warm_gives_way_to_a_block_that_starts():
    st = warm_house(room=23.0)
    run = Run({"warm": {"on": True}, "schedule": {"on": True, "rooms": {"h/wz": {"days": [[[0, "night"], [480, "comfort"]]] * 7}}}}, st,
              at=MON.replace(hour=7, minute=50))
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 12.0})]
    st["climate.wz"]["attributes"]["temperature"] = 20.0                         # somebody turns it while it is too warm
    measure(st, 20.5)
    assert run.look(10) == [("climate.wz", "set_temperature", {"temperature": 21.0})]   # 8:00 comfort, not cool enough for too warm


def test_a_turn_while_too_warm_keeps_how_it_was_before_the_rules():
    st = warm_house(room=23.0)
    run = Run({"warm": {"on": True}, "away": {"on": True, "delay": 0, "temp": 17}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 16.0})]   # its own 21° − 5°
    st["person.anna"]["state"] = "not_home"
    assert ("climate.wz", "set_temperature", {"temperature": 12.0}) in run.look(1)   # nobody at home: 17° − 5°
    st["climate.wz"]["attributes"]["temperature"] = 19.0                         # turned, and the room cools down
    measure(st, 17.0)
    assert run.look(1) == []
    st["person.anna"]["state"] = "home"                                           # back home: as it was before nobody was home
    assert ("climate.wz", "set_temperature", {"temperature": 21.0}) in run.look(1)


def test_an_older_call_that_comes_late_is_no_turn_by_hand():
    st = warm_house(room=23.0)
    run = Slow({"warm": {"on": True}, "schedule": {"on": True, "rooms": {"h/wz": NIGHT}}}, st)
    assert run.look() == [("climate.wz", "set_temperature", {"temperature": 12.0})]   # too warm: 17° − 5°, on its way
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 24.0})]
    run.reported(1)                                                               # the 12° comes now, the 24° is still on its way
    assert run.look(1) == [] and run.status["h/wz"]["hand"] is None and run.status["h/wz"]["why"] == "boost"
    run.mem = hr.boost(run.mem, "h/wz", run.now, run.rules)                     # boost off: too warm again
    assert run.look(1) == [("climate.wz", "set_temperature", {"temperature": 12.0})]
    run.reported()
    assert st["climate.wz"]["attributes"]["temperature"] == 12.0 and run.look(5) == []
