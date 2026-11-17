"""🏠 Urlaubs-Licht (vacation.py, 5.18.0): learned from the history of the evenings, played back while the holiday alarm is armed, a
different evening each night; only its own lamps, nothing it did not switch on goes off; shutters after sunset and in the morning."""
import datetime
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import vacation as vac  # noqa: E402

TZ = ZoneInfo("Europe/Berlin")
CFG = vac.clean_vac({"on": True, "lights": ["light.wz", "light.kueche", "light.neu"], "covers": ["cover.wz"]})


def at(h, m=0, day=17):
    return datetime.datetime(2026, 11, day, h, m)


def st(**on):
    return {**{e: {"state": "on" if on.get(e.split(".")[1]) else "off"} for e in ("light.wz", "light.kueche", "light.neu")},
            "cover.wz": {"state": "open"}}


def test_settings_and_evening_minutes():
    c = vac.clean_vac({"on": True, "lights": ["light.a", "light.a", "switch.b", "sensor.x"], "covers": ["cover.a", "light.z"]})
    assert c == {"on": True, "lights": ["light.a", "switch.b"], "covers": ["cover.a"], "jitter": 30}
    assert vac.clean_vac(None) == {"on": False, "lights": [], "covers": [], "jitter": 30}
    assert vac.clean_vac({"jitter": 60})["jitter"] == 60 and vac.clean_vac({"jitter": 300})["jitter"] == 30   # only the offered ones
    assert vac.evening(at(18, 30)) == ("2026-11-17", 390)
    assert vac.evening(at(1, 15, day=18)) == ("2026-11-17", 795)          # after midnight: still yesterday's evening
    assert vac.evening(at(12, 0)) == ("2026-11-17", 0)


def test_the_history_of_the_evenings():
    now = datetime.datetime(2026, 11, 17, 12, 0, tzinfo=TZ)
    hist = [[{"entity_id": "light.wz", "state": "off", "last_changed": "2026-11-15T10:00:00+00:00"},
             {"state": "on", "last_changed": "2026-11-15T17:30:00+00:00"},            # 18:30 local
             {"state": "off", "last_changed": "2026-11-15T21:45:00+00:00"},           # 22:45
             {"state": "on", "last_changed": "2026-11-16T22:30:00+00:00"},            # 23:30 … 01:00 the next day
             {"state": "off", "last_changed": "2026-11-17T00:00:00+00:00"},
             {"state": "on", "last_changed": "2026-11-17T07:00:00+00:00"}]]           # morning: outside the evening
    spans = vac.on_spans(hist, TZ, now)
    assert spans == {"light.wz": {"2026-11-15": [[390, 645]], "2026-11-16": [[690, 780]]}}


def test_a_plan_is_one_real_evening_shifted_a_little_and_another_one_each_night():
    spans = {"light.wz": {"2026-11-10": [[390, 645]], "2026-11-11": [[420, 600], [660, 700]]}}
    p1 = vac.plan(spans, "2026-11-17", ["light.wz", "light.neu"])
    p2 = vac.plan(spans, "2026-11-17", ["light.wz", "light.neu"])
    assert p1 == p2                                                       # the same night: the same plan
    plans = {str(vac.plan(spans, f"2026-11-{d:02d}", ["light.wz"])["light.wz"]) for d in range(1, 29)}
    assert len(plans) > 5                                                 # every night a bit different
    for a, b in p1["light.wz"]:
        assert vac.WINDOW[0] <= a < b <= vac.WINDOW[1]
    (a, b), = p1["light.neu"]                                              # no history: a plain evening
    assert 360 <= a <= 420 and 600 <= b <= 660


def test_it_plays_only_while_armed_and_turns_off_only_its_own_lamps():
    mem = {"learned": {"day": "2026-11-17", "spans": {"light.wz": {"2026-11-10": [[390, 645]]}, "light.kueche": {"2026-11-10": [[400, 430]]}}}}
    mem, calls, status, _l = vac.step(CFG, mem, st(), False, at(19, 0))
    assert calls == [] and status["armed"] is False and "light.wz" in status["plan"]
    mem, calls, status, lines = vac.step(CFG, mem, st(kueche=True), True, at(19, 0))   # the kitchen light is on already (someone)
    on = [e for _d, s, e in calls if s == "turn_on"]
    assert "light.wz" in on and "light.kueche" not in on and "light.kueche" in status["left"] and "light.wz" in status["ours"]
    # the planned end: our lamp goes off, the kitchen light (not ours) stays on
    mem, calls, status, _l = vac.step(CFG, mem, st(wz=True, kueche=True), True, at(23, 30))
    assert ("light", "turn_off", "light.wz") in calls and not any(e == "light.kueche" for _d, _s, e in calls)


def test_someone_comes_home_it_stops_at_once():
    mem = {"learned": {"day": "2026-11-17", "spans": {"light.wz": {"2026-11-10": [[390, 645]]}}}}
    mem, calls, *_ = vac.step(CFG, mem, st(), True, at(19, 0))
    assert ("light", "turn_on", "light.wz") in calls
    ours = list(mem["ours"])
    on_now = st(wz=True, kueche=True, neu=True)
    on_now["light.tv"] = {"state": "on"}                                     # something it never touched
    mem, calls, status, lines = vac.step(CFG, mem, on_now, False, at(19, 30))   # disarmed: home
    assert set(calls) == {("light", "turn_off", e) for e in ours} and "light.wz" in ours and all(x["why"] == "home" for x in lines)
    assert status["armed"] is False
    assert mem["ours"] == []


def test_a_lamp_switched_off_by_someone_else_is_left_alone_for_the_night():
    mem = {"learned": {"day": "2026-11-17", "spans": {"light.wz": {"2026-11-10": [[390, 645]]}}}}
    mem, calls, *_ = vac.step(CFG, mem, st(), True, at(19, 0))
    mem, calls, status, _l = vac.step(CFG, mem, st(), True, at(19, 5))       # our lamp is off now (someone, another rule)
    assert not any(e == "light.wz" for _d, _s, e in calls) and "light.wz" in status["left"]
    mem, calls, *_ = vac.step(CFG, mem, st(), True, at(19, 30))
    assert not any(e == "light.wz" for _d, _s, e in calls)                  # not switched on again tonight


def test_the_shutters_after_sunset_and_in_the_morning():
    mem = {"learned": {"day": "2026-11-17", "spans": {}}}
    mem, calls, *_ = vac.step(CFG, mem, st(), True, at(16, 0), sun_elev=5)
    assert not any(d == "cover" for d, _s, _e in calls)
    downs = []
    for minute in range(0, 40, 5):
        mem, calls, *_ = vac.step(CFG, mem, st(), True, at(17, minute), sun_elev=-3)
        downs += [c for c in calls if c[0] == "cover"]
    assert downs == [("cover", "close_cover", "cover.wz")]                  # once, within 20 minutes
    ups = []
    for h, mi in ((6, 30), (7, 0), (7, 30), (7, 50), (8, 30)):
        mem, calls, *_ = vac.step(CFG, mem, st(), True, at(h, mi, day=18), sun_elev=10)
        ups += [c for c in calls if c[0] == "cover"]
    assert ups == [("cover", "open_cover", "cover.wz")]


def test_switched_off_forgets_the_night_and_learns_once_a_day():
    mem, calls, status, _l = vac.step(vac.clean_vac({}), {"ours": ["light.wz"], "learned": {"day": "2026-11-17", "spans": {"x": {}}}}, st(), True, at(19))
    assert status == {"on": False} and calls == [] and mem["learned"]["day"] == "2026-11-17" and mem["ours"] == []
    assert vac.needs_learning(mem, "2026-11-18") and not vac.needs_learning(mem, "2026-11-17")


def test_a_garage_door_or_gate_is_never_moved():
    cfg = vac.clean_vac({"on": True, "lights": [], "covers": ["cover.garage", "cover.wz"]})
    states = {"cover.garage": {"state": "closed", "attributes": {"device_class": "garage"}}, "cover.wz": {"state": "open", "attributes": {"device_class": "shutter"}}}
    mem, calls = {"learned": {"day": "2026-11-17", "spans": {}}}, []
    for minute in range(0, 40, 5):
        mem, c, *_ = vac.step(cfg, mem, states, True, at(17, minute), sun_elev=-3)
        calls += c
    assert calls == [("cover", "close_cover", "cover.wz")]


def test_a_shutter_is_told_from_a_garage_door_by_its_name_too():
    assert vac.shutter_ok("cover.rollladen_wz", {"attributes": {"friendly_name": "Rollladen Wohnzimmer"}})
    assert vac.shutter_ok("cover.jalousie_buero", {"attributes": {"friendly_name": "Jalousie Büro"}})
    assert not vac.shutter_ok("cover.rolltor", {"attributes": {"friendly_name": "Rolltor"}})            # a roller gate: rather not
    for e, name in (("cover.garagentor", ""), ("cover.hof", "Hof Tor"), ("cover.einfahrt_tor", ""), ("cover.x", "Haustür"), ("cover.gate", ""), ("cover.y", "Front door")):
        assert not vac.shutter_ok(e, {"attributes": {"friendly_name": name}}), (e, name)


def test_the_spielraum_shifts_the_times_more():
    """the owner: "dass es nicht immer zu genau der selben Zeit passiert … 1 Stunde Spielraum": up to ± 60 minutes"""
    spans = {"light.wz": {"2026-11-10": [[450, 600]]}}
    small = [vac.plan(spans, f"2026-11-{d:02d}", ["light.wz"], 15)["light.wz"][0] for d in range(1, 29)]
    big = [vac.plan(spans, f"2026-11-{d:02d}", ["light.wz"], 60)["light.wz"][0] for d in range(1, 29)]
    assert all(435 <= a <= 465 and 585 <= b <= 615 for a, b in small)
    assert all(390 <= a <= 510 and 540 <= b <= 660 for a, b in big)
    assert max(a for a, _b in big) - min(a for a, _b in big) > 60            # really spread
