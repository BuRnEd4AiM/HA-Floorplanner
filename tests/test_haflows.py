"""Own routines as real automations of Home Assistant (haflows.py, #548): every block becomes Home Assistant's trigger, condition or
step, "im selben Raum" is looked up in the plan, "wie vorher" keeps the devices with scene.create, what cannot be done is said, and only
ids that start with fp3d_ are ever written or deleted."""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import flows as fl  # noqa: E402
import haflows as hf  # noqa: E402

ROOMS = [{"key": "main/wz", "name": "Wohnzimmer", "entities": ["climate.wz", "light.wz"], "windows": ["binary_sensor.fenster_wz"], "doors": []},
         {"key": "main/bad", "name": "Bad", "entities": ["climate.bad"], "windows": ["binary_sensor.fenster_bad"], "doors": []}]
STATES = {"person.anna": {}, "person.ben": {}, "weather.home": {}, "light.flur": {}}
WINDOW = fl.clean_flows([{"id": "f_window", "name": "Fenster offen → Heizung aus", "ha": True, "lanes": [
    {"id": "l1", "blocks": [{"k": "state", "ents": ["binary_sensor.fenster_wz", "binary_sensor.fenster_bad"], "to": "open"},
                            {"k": "hold", "s": 120}, {"k": "if_outside", "op": "below", "v": 15},
                            {"k": "heat", "same": True, "do": "off"}, {"k": "notify", "text": "Fenster {room} offen ({name}) {{bad}}"}]},
    {"id": "l2", "blocks": [{"k": "state", "ents": ["binary_sensor.fenster_wz", "binary_sensor.fenster_bad"], "to": "closed"},
                            {"k": "restore", "same": True}]}]}])[0]
LIGHT = fl.clean_flows([{"id": "f_flur", "name": "Flurlicht nachts", "ha": True, "lanes": [
    {"id": "l1", "blocks": [{"k": "state", "ents": ["binary_sensor.bewegung_flur"], "to": "on"}, {"k": "if_sun", "is": "dark"},
                            {"k": "switch", "ents": ["light.flur"], "do": "on", "pct": 20}, {"k": "wait", "s": 150},
                            {"k": "switch", "ents": ["light.flur"], "do": "off"}]}]}])[0]


def ctx(**kw):
    return hf.context(ROOMS, STATES, **{"weather": "weather.home", **kw})


def templates(cfg):
    return re.findall(r"\{\{.*?\}\}", json.dumps(cfg, ensure_ascii=False))


def test_ids_only_ours():
    assert hf.auto_id("f_window", "l2") == "fp3d_window_l2"
    assert hf.ours("fp3d_window_l2") and not hf.ours("automation.fp3d_x") and not hf.ours("heizung_morgens") and not hf.ours(None)
    assert hf.sig({"id": "a", "alias": "x"}) == hf.sig({"alias": "x", "id": "b"}) != hf.sig({"alias": "y"})


def test_window_lane():
    out = hf.compile_flow(WINDOW, ctx())
    assert out["ok"] and not out["problems"]
    a, b = out["autos"]
    assert a["id"] == "fp3d_window_l1" and a["alias"] == "Fenster offen → Heizung aus · 1" and a["mode"] == "restart"
    assert "3D Floorplan" in a["description"] and a["conditions"] == []
    assert a["triggers"] == [{"trigger": "state", "entity_id": ["binary_sensor.fenster_wz", "binary_sensor.fenster_bad"],
                              "to": ["on", "open", "opening"], "not_from": ["on", "open", "opening", "unavailable", "unknown"],
                              "for": {"hours": 0, "minutes": 2, "seconds": 0}}]          # "bleibt so" right after the trigger
    steps = a["actions"]
    assert steps[0] == {"condition": "numeric_state", "entity_id": "weather.home", "attribute": "temperature", "below": 15}
    assert steps[1] == {"variables": {"room_3": '{{ {"binary_sensor.fenster_wz": ["climate.wz"], "binary_sensor.fenster_bad": ["climate.bad"]}'
                                                ".get(trigger.entity_id | default(''), []) }}"}}
    guard = steps[2]
    assert guard["if"] == [{"condition": "template", "value_template": "{{ room_3 | count > 0 }}"}]
    keep, off = guard["then"]
    assert keep["repeat"]["for_each"] == "{{ room_3 }}"                              # the window lane 2 puts back: kept first
    create = keep["repeat"]["sequence"][0]["then"][0]
    assert create["action"] == "scene.create" and create["data"]["scene_id"] == "fp3d_window_{{ repeat.item | replace('.', '_') }}"
    assert off == {"action": "climate.set_hvac_mode", "target": {"entity_id": "{{ room_3 }}"}, "data": {"hvac_mode": "off"}, "continue_on_error": True}
    msg = steps[3]
    assert msg["event"] == "fp3d_notify"                                            # no notify service: the add-on sends it
    text = msg["event_data"]["message"]
    assert text.startswith("Fenster {{ ") and "Wohnzimmer" in text and text.endswith(") bad")    # typed braces are taken out
    assert b["alias"].endswith("· 2") and b["triggers"][0]["to"] == ["off", "closed"]
    back = b["actions"][1]["repeat"]
    assert back["for_each"] == "{{ room_1 }}"
    assert [s["action"] for s in back["sequence"][0]["then"]] == ["scene.turn_on", "scene.delete"]
    for cfg in out["autos"]:
        for x in templates(cfg):
            assert x.count("{{") == 1 and x.count("}}") == 1


def test_light_lane_without_restore():
    a = hf.compile_flow(LIGHT, ctx())["autos"][0]
    assert a["alias"] == "Flurlicht nachts" and a["id"] == "fp3d_flur_l1"
    assert a["triggers"] == [{"trigger": "state", "entity_id": ["binary_sensor.bewegung_flur"], "to": "on", "not_from": ["unavailable", "unknown"]}]
    assert a["actions"] == [
        {"condition": "state", "entity_id": "sun.sun", "state": "below_horizon"},
        {"action": "light.turn_on", "target": {"entity_id": ["light.flur"]}, "data": {"brightness_pct": 20}, "continue_on_error": True},
        {"delay": {"hours": 0, "minutes": 2, "seconds": 30}},
        {"action": "light.turn_off", "target": {"entity_id": ["light.flur"]}, "continue_on_error": True}]
    assert "scene.create" not in json.dumps(a)                                      # nothing to put back: nothing kept


def test_what_cannot_be_done():
    out = hf.compile_flow(WINDOW, ctx(weather=None))
    assert not out["ok"] and out["problems"] == [{"lane": "l1", "block": 2, "why": "weather"}]
    away = fl.clean_flows([{"id": "f_k", "name": "Kommt", "lanes": [{"id": "l1", "blocks": [{"k": "presence", "ev": "arrive"}, {"k": "notify", "text": "Da"}]}]}])[0]
    nobody = hf.compile_flow(away, hf.context(ROOMS, {}))
    assert not nobody["ok"] and nobody["problems"][0]["why"] == "persons"
    trig = hf.compile_flow(away, ctx())["autos"][0]["triggers"]
    assert trig == [{"trigger": "state", "entity_id": ["person.anna", "person.ben"], "to": "home", "not_from": ["unavailable", "unknown"]}]
    room = fl.clean_flows([{"id": "f_r", "name": "R", "lanes": [{"id": "l1", "blocks": [{"k": "time", "at": "07:00"}, {"k": "switch", "same": True, "do": "on"}]}]}])[0]
    soft = hf.compile_flow(room, ctx())
    assert soft["ok"] and soft["problems"] == [{"lane": "l1", "block": 1, "why": "room", "soft": True}] and soft["autos"][0]["actions"] == []


def test_triggers_and_conditions():
    f = fl.clean_flows([{"id": "f_t", "name": "T", "lanes": [
        {"id": "l1", "blocks": [{"k": "time", "at": "06:30", "days": [0, 4]}, {"k": "if_time", "from": "22:00", "to": "06:00"},
                                {"k": "if_home", "who": "nobody"}, {"k": "if_state", "ent": "binary_sensor.tuer", "is": "closed"},
                                {"k": "cover", "ents": ["cover.wz"], "do": "pos", "v": 30}]},
        {"id": "l2", "blocks": [{"k": "sun", "ev": "rise", "off": -45}, {"k": "run", "ent": "scene.morgen"}]},
        {"id": "l3", "blocks": [{"k": "button"}, {"k": "heat", "ents": ["climate.wz"], "do": "temp", "v": 21.5}]},
        {"id": "l4", "blocks": [{"k": "presence", "ev": "all_away"}, {"k": "if_num", "ent": "sensor.t", "op": "above", "v": 3},
                                {"k": "switch", "ents": ["light.flur", "switch.kaffee"], "do": "off"}]}]}])[0]
    l1, l2, l3, l4 = hf.compile_flow(f, ctx())["autos"]
    assert l1["triggers"] == [{"trigger": "time", "at": "06:30:00"}]
    assert l1["actions"][:4] == [{"condition": "time", "weekday": ["mon", "fri"]}, {"condition": "time", "after": "22:00:00", "before": "06:00:00"},
                                 {"condition": "numeric_state", "entity_id": "zone.home", "below": 1},
                                 {"condition": "state", "entity_id": "binary_sensor.tuer", "state": ["off", "closed"]}]
    assert l1["actions"][4]["action"] == "cover.set_cover_position" and l1["actions"][4]["data"] == {"position": 30}
    assert l2["triggers"] == [{"trigger": "sun", "event": "sunrise", "offset": "-00:45:00"}]
    assert l2["actions"] == [{"action": "scene.turn_on", "target": {"entity_id": "scene.morgen"}, "continue_on_error": True}]
    assert l3["triggers"] == []                                                       # a button: the page calls automation.trigger
    heat = l3["actions"][0]["repeat"]
    assert heat["for_each"] == ["climate.wz"] and heat["sequence"][1]["data"] == {"temperature": 21.5}
    assert l4["triggers"] == [{"trigger": "numeric_state", "entity_id": "zone.home", "below": 1}]
    assert l4["actions"][1]["action"] == "homeassistant.turn_off"                    # a light and a switch: one call for both


def test_hold_later_in_the_lane():
    f = fl.clean_flows([{"id": "f_h", "name": "H", "lanes": [{"id": "l1", "blocks": [
        {"k": "state", "ents": ["binary_sensor.fenster_wz"], "to": "open"}, {"k": "if_sun", "is": "dark"}, {"k": "hold", "s": 60},
        {"k": "notify", "text": "noch offen"}]}]}])[0]
    a = hf.compile_flow(f, ctx(notify={"services": ["mobile_app_anna"], "entities": ["notify.tablet"]}))["autos"][0]
    assert "for" not in a["triggers"][0]
    wait, still = a["actions"][1:3]
    assert wait == {"wait_template": "{{ not (states(trigger.entity_id | default('')) in [\"on\", \"open\", \"opening\"]) }}",
                    "timeout": {"hours": 0, "minutes": 1, "seconds": 0}, "continue_on_timeout": True}
    assert still == {"condition": "template", "value_template": "{{ not wait.completed }}"}
    assert [x.get("action") for x in a["actions"][3:]] == ["notify.mobile_app_anna", "notify.send_message"]


def test_restore_without_devices_puts_back_all_it_changed():
    f = fl.clean_flows([{"id": "f_k", "name": "Kino", "lanes": [
        {"id": "l1", "blocks": [{"k": "button"}, {"k": "switch", "ents": ["light.wz"], "do": "off"}, {"k": "cover", "ents": ["cover.wz"], "do": "close"}]},
        {"id": "l2", "blocks": [{"k": "button"}, {"k": "restore"}]}]}])[0]
    l1, l2 = hf.compile_flow(f, ctx())["autos"]
    assert l1["actions"][0]["repeat"]["for_each"] == ["light.wz"] and l1["actions"][2]["repeat"]["for_each"] == ["cover.wz"]
    assert l2["actions"][0]["repeat"]["for_each"] == ["light.wz", "cover.wz"]


def test_sync_plan():
    a, b = {"id": "fp3d_a_l1", "alias": "A"}, {"id": "fp3d_b_l1", "alias": "B"}
    record = {"fp3d_a_l1": {"flow": "f_a", "sent": hf.sig(a)}, "fp3d_old_l1": {"flow": "f_old", "sent": "x"}, "heizung": {"sent": "y"}}
    plan = hf.sync_plan({"fp3d_a_l1": a, "fp3d_b_l1": b, "nicht_unsere": {"alias": "N"}}, record)
    assert plan == {"write": ["fp3d_b_l1"], "delete": ["fp3d_old_l1"]}                # unchanged a not sent again, others never touched
    assert hf.sync_plan({"fp3d_a_l1": {**a, "alias": "A2"}}, record)["write"] == ["fp3d_a_l1"]


def test_special_days_as_a_template():
    """📅 "Nur wenn: besonderer Tag" (specialdays.py): one template condition with the dates written out; a deleted day or none: never
    (not: always)"""
    import specialdays as sd
    days = sd.clean_days([{"id": "d_xmas", "kind": "date", "md": "12-24"}, {"id": "d_ft", "kind": "holidays", "region": "BW"},
                          {"id": "d_cal", "kind": "calendar", "ent": "calendar.urlaub"}])
    flow = fl.clean_flows([{"id": "f_m", "name": "Rollladen", "ha": True, "lanes": [
        {"id": "l1", "blocks": [{"k": "time", "at": "07:00", "days": []}, {"k": "if_special", "is": "no", "days": ["d_xmas"]}, {"k": "cover", "ents": ["cover.wz"], "do": "open"}]},
        {"id": "l2", "blocks": [{"k": "time", "at": "07:00", "days": []}, {"k": "if_special", "is": "yes", "days": ["d_xmas", "d_cal"]},
                                {"k": "cover", "ents": ["cover.wz"], "do": "pos", "v": 50}]},
        {"id": "l3", "blocks": [{"k": "button"}, {"k": "if_special", "days": ["d_gone"]}, {"k": "cover", "ents": ["cover.wz"], "do": "close"}]},
        {"id": "l4", "blocks": [{"k": "button"}, {"k": "if_special", "days": []}, {"k": "cover", "ents": ["cover.wz"], "do": "close"}]}]}])[0]
    out = hf.compile_flow(flow, ctx(days=days, year=2026))
    assert out["ok"] and not out["problems"]
    a, b, c, d = (x["actions"][0] for x in out["autos"])
    assert a == {"condition": "template", "value_template": "{{ not (now().strftime('%m-%d') == '12-24') }}"}
    assert b == {"condition": "template", "value_template": "{{ (now().strftime('%m-%d') == '12-24' or is_state('calendar.urlaub', 'on')) }}"}
    assert c == {"condition": "template", "value_template": "{{ (false) }}"}
    assert d["value_template"].startswith("{{ (now().strftime('%Y-%m-%d') in ['2026-01-01', ") and "'2035-12-26'" in d["value_template"]
    assert hf.compile_flow(flow, ctx(days=days, year=2027)) != out                     # another year: other dates (written anew when saved)
    assert ctx()["days"] == [] and ctx()["year"] >= 2026
