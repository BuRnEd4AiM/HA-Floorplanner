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


def test_what_an_automation_uses_for_its_building():
    """5.5.0 (static/buildingents.js): every entity it names, the entities of the devices it names, a device trigger's entity by the id of
    the registry, the areas it names as "area:<id>"."""
    reg = [{"entity_id": "light.flur", "id": "0123456789abcdef0123456789abcdef", "device_id": "dev1"}, {"entity_id": "sensor.flur_power", "id": "r2", "device_id": "dev1"},
           {"entity_id": "switch.pumpe", "id": "r3", "device_id": "dev2"}, {"entity_id": "bad id", "device_id": "dev2"}, {"entity_id": "sun.sun", "id": "r5"}, "junk"]
    by_device, by_regid = ub.registry_maps(reg)
    assert by_device == {"dev1": ["light.flur", "sensor.flur_power"], "dev2": ["switch.pumpe"]}
    assert by_regid == {"0123456789abcdef0123456789abcdef": "light.flur", "r2": "sensor.flur_power", "r3": "switch.pumpe", "r5": "sun.sun"}
    assert ub.registry_maps(None) == ({}, {})
    cfg = {"triggers": [{"trigger": "device", "device_id": "dev2", "entity_id": "0123456789abcdef0123456789abcdef", "type": "turned_on"},
                        {"trigger": "state", "entity_id": "binary_sensor.tuer"}],
           "actions": [{"action": "light.turn_on", "target": {"area_id": ["keller", "wohnzimmer"], "device_id": "dev1", "entity_id": "light.decke"}},
                       {"action": "script.gute_nacht"}, {"service": "light.turn_off", "target": {"area_id": "keller"}}, {"device_id": "weg"}, {"area_id": "Not An Id"}]}
    assert ub.uses_of(cfg, by_device, by_regid) == ["binary_sensor.tuer", "light.decke", "script.gute_nacht", "light.flur", "switch.pumpe", "sensor.flur_power",
                                                    "area:keller", "area:wohnzimmer"]
    assert ub.uses_of(cfg) == ["binary_sensor.tuer", "light.decke", "script.gute_nacht", "area:keller", "area:wohnzimmer"]   # without the registry
    assert ub.uses_of(MORNING) == ["climate.wz", "scene.morgen"] and ub.uses_of(None) == [] and ub.uses_of("x") == []
    many = {"action": [{"service": "light.turn_on", "entity_id": [f"light.l{i}" for i in range(60)]}]}
    assert len(ub.uses_of(many)) == ub.MAX_USES
