"""Which thermostats, windows and devices belong to which room (roommap.py, #546): the same rules as the page (roomtiles.js, roompanel.js)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import roommap as rm  # noqa: E402

# two rooms side by side: the living room 0..6 x 0..4, the kitchen 6..10 x 0..4; a window in the living room's outer wall, a door
# between both rooms, a terrace door in the kitchen's outer wall, a window with two panes in the kitchen
LAYOUT = {"floors": [{
    "walls": [
        {"a": [0, 0], "b": [6, 0], "openings": [{"type": "window", "pos": 3, "width": 1.2, "entity": "binary_sensor.fenster_wz"}]},
        {"a": [6, 0], "b": [6, 4], "openings": [{"type": "door", "pos": 2, "width": 0.9, "entity": "binary_sensor.tuer_wz_kueche"}]},
        {"a": [6, 4], "b": [10, 4], "openings": [{"type": "door", "pos": 2, "width": 1, "entity": "binary_sensor.terrasse"},
                                                {"type": "window", "pos": 3.5, "width": 1, "entity": "binary_sensor.k1", "paneEntities": ["binary_sensor.k2", "binary_sensor.k1"]}]},
        {"a": [0, 4], "b": [6, 4], "openings": [{"type": "window", "pos": 1}]},                     # no sensor
    ],
    "rooms": [{"id": "r1", "name": "Wohnzimmer", "points": [[0, 0], [6, 0], [6, 4], [0, 4]]},
              {"id": "r2", "name": "Küche", "points": [[6, 0], [10, 0], [10, 4], [6, 4]], "area": "kueche"},
              {"id": "bad", "name": "kaputt", "points": [[0, 0]]}],
    "devices": [{"id": "d1", "type": "thermostat", "x": 0.3, "z": 2, "entity": "climate.wohnzimmer"},
                {"id": "d2", "type": "light", "x": 3, "z": 2, "entity": "light.wohnzimmer"},
                {"id": "d3", "type": "radiator", "x": 0.3, "z": 3, "entity": "climate.wohnzimmer"},
                {"id": "d4", "type": "chair", "x": 8, "z": 2},
                {"id": "d5", "type": "light", "x": 20, "z": 20, "entity": "light.draussen"}],
}]}


def test_rooms_get_their_devices_area_and_openings():
    rooms = rm.rooms_of([("h1", LAYOUT)], {"kueche": ["climate.kueche", "light.kueche", 7]})
    assert [r["key"] for r in rooms] == ["h1/r1", "h1/r2"]                          # a room without an outline is left out
    wz, k = rooms
    assert wz["climates"] == ["climate.wohnzimmer"] and wz["entities"] == ["climate.wohnzimmer", "light.wohnzimmer"]
    assert wz["windows"] == ["binary_sensor.fenster_wz"] and wz["doors"] == ["binary_sensor.tuer_wz_kueche"] and wz["outer"] == []
    assert k["climates"] == ["climate.kueche"] and k["entities"] == ["climate.kueche", "light.kueche"]   # from its area of Home Assistant
    assert k["windows"] == ["binary_sensor.k1", "binary_sensor.k2"]                 # both panes, each once
    assert k["doors"] == ["binary_sensor.tuer_wz_kueche", "binary_sensor.terrasse"] and k["outer"] == ["binary_sensor.terrasse"]   # the inner door is no way out


def test_index_and_same_room():
    rooms = rm.rooms_of([("h1", LAYOUT)], {"kueche": ["climate.kueche"]})
    idx = rm.room_index(rooms)
    assert idx["binary_sensor.fenster_wz"] == "h1/r1" and idx["binary_sensor.terrasse"] == "h1/r2" and "light.draussen" not in idx
    assert rm.in_room(rooms, "h1/r1", "climate") == ["climate.wohnzimmer"] and rm.in_room(rooms, "h1/r9", "climate") == []


def test_broken_layouts_give_nothing():
    assert rm.rooms_of([("h", None), ("h", {"floors": "x"}), ("h", {"floors": [None, {"rooms": [{"id": "r", "points": [[0, 0], ["a", 1], [2, 2]]}]}]})]) == []
    walls = {"floors": [{"walls": [{"a": [0, 0]}, {"a": [0, 0], "b": [1, 0], "openings": [{"type": "window"}, "x"]}],
                         "rooms": [{"id": "r", "points": [[0, 0], [1, 0], [1, 1]]}]}]}
    assert rm.rooms_of([("h", walls)])[0]["windows"] == []


def test_a_door_to_a_terrace_drawn_as_a_room_leads_outside():
    """#577: the owner's door to the outside did not switch the heating off: beyond it lies a room too (a terrace, an open area), so the
    door was "between two rooms". Now a door with a side in no room, or only in an open area, leads outside; one to a closed room not."""
    def plan(terrace):
        return {"floors": [{
            "walls": [{"a": [0, 4], "b": [6, 4], "thickness": 0.3, "openings": [{"type": "door", "pos": 3, "width": 1, "entity": "binary_sensor.tuer"}]},
                      {"a": [6, 0], "b": [6, 4], "openings": [{"type": "door", "pos": 3.75, "width": 0.4, "entity": "binary_sensor.ecke"}]}],
            "rooms": [{"id": "wz", "name": "Wohnzimmer", "points": [[0, 0], [6, 0], [6, 4], [0, 4]]},
                      {"id": "t", "name": "Terrasse", "points": [[0, 4], [6, 4], [6, 7], [0, 7]], "terrace": terrace}]}]}
    wz = rm.rooms_of([("h1", plan(True))])[0]
    assert wz["doors"] == ["binary_sensor.tuer", "binary_sensor.ecke"] and wz["outer"] == ["binary_sensor.tuer", "binary_sensor.ecke"]
    wz = rm.rooms_of([("h1", plan(False))])[0]                  # a closed room beyond it (a winter garden): a door between two rooms
    assert wz["outer"] == ["binary_sensor.ecke"]                # the door near the corner of the other room still leads outside
