"""Who uses a device (usedby.py, #546): what an automation does as data, a row with on / running / last, Home Assistant's related search,
and the add-on's own rules that use it."""
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import usedby as ub  # noqa: E402
import flows as fl  # noqa: E402
import heatrules as hr  # noqa: E402

MORNING = {"alias": "Heizung morgens hoch", "trigger": [{"platform": "time", "at": "06:00:00"}],
           "condition": [{"condition": "time", "weekday": ["mon", "tue"]}],
           "action": [{"service": "climate.set_temperature", "target": {"entity_id": "climate.wz"}, "data": {"temperature": 22}},
                      {"delay": "00:01:00"}, {"service": "scene.turn_on", "target": {"entity_id": "scene.morgen"}}]}
NEW_STYLE = {"triggers": [{"trigger": "state", "entity_id": ["binary_sensor.bewegung"], "to": "on", "for": {"minutes": 1}},
                          {"trigger": "numeric_state", "entity_id": "sensor.temp", "above": 25}, {"trigger": "sun", "event": "sunrise"},
                          {"trigger": "homeassistant"}, {"trigger": "template"}],
             "actions": [{"action": "light.turn_on", "entity_id": "light.flur", "data": {"brightness_pct": 20}}, {"choose": []},
                         {"wait_for_trigger": []}, {"scene": "scene.abend"}, {"condition": "state"}, {"if": []}]}


def test_what_an_automation_does_as_data():
    s = ub.summary(MORNING)
    assert s == {"when": [{"k": "time", "at": ["06:00"]}], "more": 0, "checks": 1,
                 "do": [{"k": "call", "svc": "climate.set_temperature", "ents": ["climate.wz"], "temperature": 22}, {"k": "delay"}, {"k": "scene", "ents": ["scene.morgen"]}]}
    n = ub.summary(NEW_STYLE)
    assert n["when"] == [{"k": "state", "ents": ["binary_sensor.bewegung"], "to": "on", "for": True}, {"k": "num", "ents": ["sensor.temp"], "above": 25},
                         {"k": "sun", "ev": "sunrise"}, {"k": "start"}] and n["more"] == 3
    assert n["do"] == [{"k": "call", "svc": "light.turn_on", "ents": ["light.flur"], "brightness_pct": 20}, {"k": "logic"}, {"k": "wait"}, {"k": "scene", "ents": ["scene.abend"]}]
    assert ub.summary(None) == {"when": [], "more": 0, "checks": 0, "do": []}
    assert ub.entities_in(MORNING) == ["climate.wz", "scene.morgen"] and ub.entities_in(NEW_STYLE) == ["binary_sensor.bewegung", "sensor.temp", "light.flur", "scene.abend"]


def test_rows_say_on_running_and_last():
    r = ub.row("automation.morgen", {"state": "on", "attributes": {"friendly_name": "Heizung morgens hoch", "last_triggered": "2026-10-26T05:00:00+00:00", "current": 1}}, MORNING)
    assert r["on"] is True and r["running"] is True and r["last"] == int(datetime.datetime(2026, 10, 26, 5, tzinfo=datetime.timezone.utc).timestamp()) and r["name"] == "Heizung morgens hoch" and r["sum"]["when"][0]["k"] == "time"
    off = ub.row("automation.weg", {"state": "off", "attributes": {"current": 0}})
    assert off["on"] is False and off["running"] is False and off["last"] is None and off["sum"] is None and not off["gone"]
    sc = ub.row("scene.nacht", {"state": "2026-10-25T21:05:00+00:00", "attributes": {"friendly_name": "Gute Nacht"}})
    assert sc["on"] is None and sc["last"] == int(datetime.datetime(2026, 10, 25, 21, 5, tzinfo=datetime.timezone.utc).timestamp())
    assert ub.row("script.x", {"state": "on", "attributes": {}})["running"] and ub.row("automation.y", None)["gone"]
    assert ub.related_ids({"scene": ["scene.a"], "automation": ["automation.b", "bad"], "script": "script.c", "device": ["d"]}) == ["automation.b", "script.c", "scene.a"]


def test_own_rules_that_use_a_device():
    rooms = [{"key": "h/wz", "climates": ["climate.wz"], "windows": ["binary_sensor.fenster"], "doors": ["binary_sensor.tuer"], "outer": [], "entities": ["climate.wz", "light.wz"]},
             {"key": "h/bad", "climates": ["climate.bad"], "windows": [], "doors": [], "outer": [], "entities": ["climate.bad"]}]
    heat = hr.clean_rules({"window": {"on": True, "skip": ["h/bad"]}, "night": {"on": True}, "schedule": {"on": True, "rooms": {"h/bad": {"days": [[[0, "eco"]]]}}}})
    flows = fl.clean_flows([{"id": "f_a", "name": "Fenster", "lanes": [{"blocks": [{"k": "state", "ents": ["binary_sensor.fenster"], "to": "open"}, {"k": "heat", "same": True, "do": "off"}]}]},
                            {"id": "f_b", "name": "Licht", "on": False, "lanes": [{"blocks": [{"k": "button"}, {"k": "switch", "ents": ["light.wz"], "do": "on"}]}]}])
    assert ub.own_uses("climate.wz", heat, flows, rooms) == [{"kind": "heat", "rule": "window", "room": "h/wz"}, {"kind": "heat", "rule": "night", "room": "h/wz"},
                                                             {"kind": "flow", "id": "f_a", "name": "Fenster", "on": True}]
    assert ub.own_uses("climate.bad", heat, flows, rooms) == [{"kind": "heat", "rule": "schedule", "room": "h/bad"}, {"kind": "heat", "rule": "night", "room": "h/bad"}]
    assert ub.own_uses("binary_sensor.fenster", heat, flows, rooms) == [{"kind": "heat", "rule": "window", "room": "h/wz"}, {"kind": "flow", "id": "f_a", "name": "Fenster", "on": True}]
    assert ub.own_uses("light.wz", heat, flows, rooms) == [{"kind": "flow", "id": "f_b", "name": "Licht", "on": False}]
