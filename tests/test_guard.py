"""The add-on's own holiday alarm (guard.py, #456): the settings and the code, the phases, the messages."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import guard as g  # noqa: E402

CFG = g.clean_cfg({"sensors": ["binary_sensor.haustuer", "binary_sensor.fenster"], "delay": 30, "code": "1234", "actions": ["siren.flur"]})


def test_settings_are_cleaned_and_the_code_is_never_stored_as_such():
    c = g.clean_cfg({"sensors": ["binary_sensor.haustuer", "light.x", "binary_sensor.haustuer", "bad id", 3], "delay": 999, "offline": False,
                     "actions": ["siren.flur", "light.wohnzimmer", "lock.tuer", "script.alarm"], "code": " 4711 ", "notify": False})
    assert c["sensors"] == ["binary_sensor.haustuer"] and c["delay"] == 300 and c["offline"] is False and c["notify"] is False and c["report"] is True
    assert c["actions"] == ["siren.flur", "light.wohnzimmer", "script.alarm"]                         # a lock is no siren
    assert "4711" not in str(c) and g.check_code(c, "4711") and not g.check_code(c, "4712") and not g.check_code(c, None)
    assert g.public(c)["hasCode"] is True and "code" not in g.public(c)
    kept = g.clean_cfg({"delay": -5}, c)
    assert kept["delay"] == 0 and g.check_code(kept, "4711")                                             # a save without a code keeps it
    assert g.check_code(g.clean_cfg({"code": "12"}, c), "4711")                                          # too short: not taken
    assert g.check_code(g.clean_cfg({"code": ""}, c), "4711")                                            # empty field: kept
    assert g.clean_cfg({"code": "", "removeCode": True}, c)["code"] is None
    assert g.clean_cfg({"code": "4711"})["code"]["salt"] != g.clean_cfg({"code": "4711"})["code"]["salt"]   # salted each time
    assert g.clean_cfg("junk") == {**g.DEFAULT, "code": None}
    assert g.ready(g.clean_cfg({})) == "sensors" and g.ready(g.clean_cfg({"sensors": ["binary_sensor.a"]})) == "code" and g.ready(CFG) is None


def test_arming_leaving_and_coming_home_in_time():
    st = g.clean_state({})
    st, ev = g.arm(st, CFG, 100, "flo")
    assert st["phase"] == "arming" and st["due"] == 130 and ev == []
    st, ev = g.sensor(st, CFG, "binary_sensor.haustuer", "on", "Haustür", 110)                         # leaving through the door: fine
    assert st["phase"] == "arming" and ev == []
    st, ev = g.tick(st, CFG, 129)
    assert st["phase"] == "arming" and g.view(st, 129)["left"] == 1
    st, ev = g.tick(st, CFG, 130)
    assert st["phase"] == "armed" and ev == [("armed", None)]
    st, ev = g.sensor(st, CFG, "binary_sensor.other", "on", "Anders", 200)                              # not chosen
    assert st["phase"] == "armed" and ev == []
    st, ev = g.sensor(st, CFG, "binary_sensor.haustuer", "on", "Haustür", 500)                         # coming home: the time to type the code
    assert st["phase"] == "entry" and st["due"] == 530 and ev == [] and g.view(st, 510)["left"] == 20 and g.view(st, 510)["what"]["name"] == "Haustür"
    st, ev = g.disarm(st, 520, "flo")
    assert st["phase"] == "off" and ev == [("disarmed", {"alarm": False, "by": "flo"})]
    assert g.disarm(st, 521)[1] == [] and g.arm({**st, "phase": "armed"}, CFG, 1)[1] == []             # off stays off, armed stays armed


def test_the_alarm_goes_off_and_another_door_sends_again():
    st, _ = g.arm(g.clean_state({}), {**CFG, "delay": 0}, 0)
    assert st["phase"] == "armed"
    st, ev = g.sensor(st, CFG, "binary_sensor.fenster", "on", "Fenster", 10)
    st, ev = g.tick(st, CFG, 41)
    assert st["phase"] == "alarm" and ev[0][0] == "alarm" and ev[0][1]["entity"] == "binary_sensor.fenster" and ev[0][1]["why"] == "open"
    st, ev = g.sensor(st, CFG, "binary_sensor.fenster", "off", "Fenster", 50)
    st, ev = g.sensor(st, CFG, "binary_sensor.fenster", "on", "Fenster", 60)
    assert ev == []                                                                                     # the same window: no second message
    st, ev = g.sensor(st, CFG, "binary_sensor.haustuer", "on", "Haustür", 70)
    assert ev and ev[0][1]["entity"] == "binary_sensor.haustuer"
    st, ev = g.disarm(st, 80, "anna")
    assert ev == [("disarmed", {"alarm": True, "by": "anna"})]
    st, ev = g.arm(g.clean_state({}), {**CFG, "delay": 0}, 0)
    assert ev == [("armed", None)]
    st, ev = g.sensor(st, {**CFG, "delay": 0}, "binary_sensor.haustuer", "open", "Haustür", 5)          # no delay: at once
    assert st["phase"] == "alarm" and ev[0][0] == "alarm"


def test_offline_counts_only_when_it_lasts_and_not_while_home_assistant_starts():
    cfg = {**CFG, "delay": 0}
    st, _ = g.arm(g.clean_state({}), cfg, 0)
    st = g.reconnected(st, 0)                                                                           # quiet until 600
    st, ev = g.sensor(st, cfg, "binary_sensor.fenster", "unavailable", "Fenster", 10)
    assert ev == [] and g.tick(st, cfg, 400)[1] == []                                                   # Home Assistant may be starting
    st2, ev = g.tick(st, cfg, 610)
    assert st2["phase"] == "alarm" and ev[0][1]["why"] == "offline" and ev[0][1]["entity"] == "binary_sensor.fenster"
    st3, _ = g.sensor(st, cfg, "binary_sensor.fenster", "off", "Fenster", 300)                         # back before the grace is over
    assert g.tick(st3, cfg, 700)[1] == []
    assert g.tick(st, {**cfg, "offline": False}, 1000)[1] == []                                         # offline not ticked: never


def test_messages_and_texts():
    assert g.message("alarm", {"name": "Haustür", "why": "open"}, CFG, "de", "Erdgeschoss · Flur", "18.10. 14:05") == \
        "🚨 EINBRUCH-ALARM: Haustür wurde geöffnet\nErdgeschoss · Flur · 18.10. 14:05"
    assert g.message("alarm", {"name": "Fenster", "why": "offline"}, CFG, "en").startswith("🚨 ALARM: Fenster is offline")
    assert g.message("armed", None, CFG, "de") == "🛡 Urlaubs-Alarm ist scharf (2 Melder)"
    assert g.message("armed", None, {**CFG, "report": False}, "de") == ""
    assert g.message("disarmed", {"alarm": True, "by": "flo"}, {**CFG, "report": False}, "de") == "✅ Alarm beendet, ausgeschaltet von flo"
    assert g.message("disarmed", {"alarm": False, "by": ""}, CFG, "xx") == "🔓 Holiday alarm switched off (?)"
    assert all(set(t) == set(g.TEXTS["de"]) for t in g.TEXTS.values())


def test_wrong_codes_make_it_wait():
    t = g.Tries(n=3, window=100)
    assert t.wrong(0) == 1 and t.wrong(1) == 2 and t.wait(2) == 0
    t.wrong(2)
    assert t.wait(3) == 98 and t.wait(101) == 0
    t.right()
    assert t.wait(102) == 0


def test_state_from_a_file():
    assert g.clean_state({"phase": "bogus"}) == g.STATE
    st = g.clean_state({"phase": "armed", "since": 5, "fired": ["a", 3], "offline": {"x": 1, "y": "z"}})
    assert st["phase"] == "armed" and st["fired"] == ["a"] and st["offline"] == {"x": 1}
