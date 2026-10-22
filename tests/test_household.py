"""household.py (#490): the machines of the page 🧺 Haushalt found by their names, what they do now (their own state or a power sensor
and its history), "✓ Ausgeräumt", and the shopping list."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import household as hh  # noqa: E402

T0 = 1_760_000_000.0             # a fixed "now" (seconds)


def S(eid, state, name="", dc=None, unit=None, changed=None):
    a = {"friendly_name": name}
    if dc:
        a["device_class"] = dc
    if unit:
        a["unit_of_measurement"] = unit
    return {"entity_id": eid, "state": state, "attributes": a, "last_changed": hh._iso(changed) if changed else "2025-01-01T00:00:00Z"}


def test_the_kind_by_name_dishwasher_before_washer_and_the_role_of_each_entity():
    assert hh.kind_of("sensor.dishwasher_power") == "dishwasher"
    assert hh.kind_of("sensor.geschirrspüler_status geschirrspüler") == "dishwasher"
    assert hh.kind_of("sensor.waschtrockner_leistung") == "dryer"
    assert hh.kind_of("switch.waschmaschine waschmaschine") == "washer"
    assert hh.kind_of("light.kueche") is None
    assert hh.role_of(S("sensor.wm_leistung", "3", dc="power", unit="W")) == "power"
    assert hh.role_of(S("sensor.wm_kwh", "100", dc="energy", unit="kWh")) is None
    assert hh.role_of(S("sensor.wm_finish_time", "2025-01-01T12:00:00Z", dc="timestamp")) == "finish"
    assert hh.role_of(S("sensor.wm_remaining", "42", unit="min")) == "remaining"
    assert hh.role_of(S("sensor.wm_program_progress", "40", unit="%")) == "progress"
    assert hh.role_of(S("sensor.wm_selected_program", "Baumwolle 40°")) == "program"
    assert hh.role_of(S("sensor.wm_operation_state", "run")) == "status"
    assert hh.role_of(S("binary_sensor.wm_running", "on")) == "running"
    assert hh.role_of(S("binary_sensor.wm_door", "off", dc="door")) is None
    assert hh.role_of(S("switch.wm_steckdose", "on")) is None


def test_machines_are_found_by_their_names_and_an_admins_choice_wins():
    states = [S("sensor.waschmaschine_leistung", "1", "Waschmaschine Leistung", "power", "W"), S("sensor.waschmaschine_kwh", "9", "", "energy", "kWh"),
              S("sensor.dishwasher_operation_state", "finished", "Dishwasher Operation state"), S("sensor.dishwasher_remaining_program_time", "x", dc="timestamp"),
              S("binary_sensor.dishwasher_door", "off", dc="door"), S("sensor.trockner_kwh", "3", unit="kWh"), S("light.kueche", "on"), "junk", {"entity_id": "bad id"}]
    found = hh.find_appliances(states)
    assert found == {"washer": {"power": "sensor.waschmaschine_leistung"},
                     "dishwasher": {"status": "sensor.dishwasher_operation_state", "finish": "sensor.dishwasher_remaining_program_time"}}
    assert "dryer" not in found                                    # only its energy: nothing that tells whether it runs
    chosen = {"dryer": {"power": "sensor.plug_3_power", "status": "light.x"}, "washer": {"status": "binary_sensor.wm_laeuft"}, "junk": {"power": "sensor.y"}}
    assert hh.clean_chosen(chosen) == {"dryer": {"power": "sensor.plug_3_power"}, "washer": {"status": "binary_sensor.wm_laeuft"}}
    found = hh.find_appliances(states, chosen)
    assert found["dryer"] == {"power": "sensor.plug_3_power"}
    assert found["washer"] == {"power": "sensor.waschmaschine_leistung", "running": "binary_sensor.wm_laeuft"}


def test_a_run_in_the_power_readings_with_short_pauses_and_no_short_blips():
    m = 60
    pts = [(T0 - 300 * m, 1), (T0 - 200 * m, 400), (T0 - 190 * m, 2), (T0 - 188 * m, 300), (T0 - 120 * m, 1.5)]
    assert hh.last_run(pts, T0) == {"running": False, "start": T0 - 200 * m, "end": T0 - 120 * m}   # the 2 min pause belongs to it
    assert hh.last_run([(T0 - 100 * m, 1), (T0 - 50 * m, 2000), (T0 - 49 * m, 1)], T0) is None     # one minute: a blip, no run
    assert hh.last_run([(T0 - 100 * m, 1), (T0 - 2 * m, 1800)], T0) == {"running": True, "start": T0 - 2 * m, "end": None}   # up right now
    assert hh.last_run([(T0 - 60 * m, 500), (T0 - 3 * m, 1)], T0) == {"running": True, "start": T0 - 60 * m, "end": None}   # a pause of 3 min
    assert hh.last_run([], T0) is None
    data = [[{"entity_id": "sensor.p", "state": "1", "last_changed": hh._iso(T0 - 600)}, {"state": "500", "last_changed": hh._iso(T0 - 300)},
             {"state": "unavailable", "last_changed": hh._iso(T0 - 100)}], [], "junk"]
    assert hh.history_points(data) == {"sensor.p": [(T0 - 600, 1.0), (T0 - 300, 500.0), (T0 - 100, None)]}


def test_what_a_machine_does_by_its_own_state():
    for s, p in (("Run", "running"), ("in use", "running"), ("finished", "done"), ("Program ended", "done"), ("ready", "off"),
                 ("DelayedStart", "waiting"), ("pause", "waiting"), ("error", "error"), ("unavailable", "gone"), ("Spülen läuft", None)):
        assert hh.status_phase(s) == p, s
    roles = {"status": "sensor.st", "finish": "sensor.fin", "progress": "sensor.pr", "program": "sensor.prog"}
    by = {"sensor.st": S("sensor.st", "run", changed=T0 - 1800), "sensor.fin": S("sensor.fin", hh._iso(T0 + 42 * 60), dc="timestamp"),
          "sensor.pr": S("sensor.pr", "61.4", unit="%"), "sensor.prog": S("sensor.prog", "Baumwolle 40°")}
    a = hh.appliance("washer", roles, by, {}, None, T0)
    assert a == {"kind": "washer", "phase": "running", "since": hh._iso(T0 - 1800), "endsAt": hh._iso(T0 + 42 * 60), "progress": 61,
                 "program": "Baumwolle 40°", "state": "run", "power": None}
    by["sensor.st"] = S("sensor.st", "finished", changed=T0 - 600)
    a = hh.appliance("washer", roles, by, {}, None, T0)
    assert (a["phase"], a["since"], a["endsAt"], a["progress"]) == ("done", hh._iso(T0 - 600), None, None)
    assert hh.appliance("washer", roles, by, {}, T0 - 60, T0)["phase"] == "off"        # "✓ Ausgeräumt" after it ended
    assert hh.appliance("washer", roles, by, {}, T0 - 3600, T0)["phase"] == "done"     # ... an older one does not count
    rem = {"status": "sensor.st", "remaining": "sensor.rem"}
    by2 = {"sensor.st": S("sensor.st", "run"), "sensor.rem": S("sensor.rem", "1.5", unit="h")}
    assert hh.appliance("washer", rem, by2, {}, None, T0)["endsAt"] == hh._iso(T0 + 5400)


def test_what_a_machine_does_by_its_power_alone():
    roles = {"power": "sensor.p"}
    run = [(T0 - 7200, 1), (T0 - 6000, 2100), (T0 - 2400, 1)]
    a = hh.appliance("dishwasher", roles, {"sensor.p": S("sensor.p", "1", unit="W")}, {"sensor.p": run}, None, T0)
    assert (a["phase"], a["since"], a["power"]) == ("done", hh._iso(T0 - 2400), 1)
    assert hh.appliance("dishwasher", roles, {"sensor.p": S("sensor.p", "1", unit="W")}, {"sensor.p": run}, T0 - 100, T0)["phase"] == "off"
    a = hh.appliance("dishwasher", roles, {"sensor.p": S("sensor.p", "1", unit="W")}, {"sensor.p": run}, None, T0 + 13 * 3600)
    assert (a["phase"], a["since"]) == ("off", hh._iso(T0 - 2400))  # long ago: off, "zuletzt …"
    now_on = run + [(T0 - 600, 1900)]
    a = hh.appliance("dishwasher", roles, {"sensor.p": S("sensor.p", "1900", unit="W")}, {"sensor.p": now_on}, None, T0)
    assert (a["phase"], a["since"]) == ("running", hh._iso(T0 - 600))
    a = hh.appliance("dishwasher", roles, {"sensor.p": S("sensor.p", "700", unit="W")}, {}, None, T0)
    assert (a["phase"], a["since"]) == ("running", None)            # no history: the power now
    assert hh.appliance("dryer", {}, {}, {}, None, T0)["phase"] == "unknown"
    assert hh.appliance("dryer", {"running": "binary_sensor.r"}, {"binary_sensor.r": S("binary_sensor.r", "off", changed=T0 - 900)}, {}, None, T0)["phase"] == "done"
    assert hh.clean_acks({"washer": T0, "dryer": "x", "junk": 1, "dishwasher": -1}) == {"washer": T0}


def test_the_shopping_list_first_and_its_items_and_the_changes_allowed():
    states = [S("todo.aufgaben", "2", "Aufgaben"), S("todo.einkaufsliste", "3", "Einkaufsliste"), S("todo.weg", "unavailable"), S("sensor.x", "1")]
    lists = hh.todo_lists(states)
    assert lists == [{"entity": "todo.einkaufsliste", "name": "Einkaufsliste"}, {"entity": "todo.aufgaben", "name": "Aufgaben"}]
    assert hh.pick_list(lists, "todo.aufgaben", "") == "todo.aufgaben"
    assert hh.pick_list(lists, "todo.bogus", "todo.aufgaben") == "todo.aufgaben"
    assert hh.pick_list(lists, None, None) == "todo.einkaufsliste" and hh.pick_list([], None, None) == ""
    res = {"items": [{"uid": "1", "summary": "Kaffee", "status": "completed"}, {"uid": "2", "summary": " Milch ", "status": "needs_action"},
                     {"uid": "3", "summary": "  "}, "junk", {"summary": "ohne uid"}]}
    assert hh.slim_items(res) == [{"uid": "2", "summary": "Milch", "done": False}, {"uid": "1", "summary": "Kaffee", "done": True}]
    assert hh.slim_items(None) == []
    assert hh.todo_call({"entity": "todo.e", "action": "add", "item": " Brot\n"}) == ("todo.e", "add_item", {"item": "Brot"})
    assert hh.todo_call({"entity": "todo.e", "action": "add", "item": "   "}) is None
    assert hh.todo_call({"entity": "todo.e", "action": "done", "uid": "2"}) == ("todo.e", "update_item", {"item": "2", "status": "completed"})
    assert hh.todo_call({"entity": "todo.e", "action": "undo", "uid": "2"}) == ("todo.e", "update_item", {"item": "2", "status": "needs_action"})
    assert hh.todo_call({"entity": "todo.e", "action": "clear"}) == ("todo.e", "remove_completed_items", {})
    assert hh.todo_call({"entity": "light.x", "action": "clear"}) is None
    assert hh.todo_call({"entity": "todo.e", "action": "rm"}) is None
