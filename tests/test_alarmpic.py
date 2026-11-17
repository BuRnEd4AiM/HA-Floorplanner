"""📸 Bild bei Alarm (alarmpic.py, 5.16.0): where a sensor is, the camera of its room, and the floor from above as a PNG with the room red."""
import io
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import alarmpic as ap  # noqa: E402

PIL = pytest.importorskip("PIL.Image")

FLOOR = {"id": "k", "name": "Keller", "rooms": [{"id": "w", "name": "Waschküche 🫧", "points": [[0, 0], [4, 0], [4, 3], [0, 3]]},
                                                 {"id": "h", "name": "Hobbyraum", "points": [[4, 0], [10, 0], [10, 3], [4, 3]]}],
         "walls": [{"a": [0, 0], "b": [10, 0], "thickness": 0.24, "openings": [{"type": "window", "pos": 2, "width": 1}]},
                   {"a": [4, 0], "b": [4, 3], "openings": [{"type": "door", "pos": 1.5, "width": 0.9, "entity": "binary_sensor.tuer"}]}],
         "devices": [{"id": "s", "type": "sensor", "x": 1, "z": 1, "entity": "binary_sensor.wasser"},
                     {"id": "c", "type": "camera", "x": 3, "z": 2.5, "entity": "camera.waschkueche"},
                     {"id": "c2", "type": "camera", "x": 8, "z": 1, "entity": "camera.hobby"}]}
HOUSES = [("Haus", {"floors": [{"id": "eg", "name": "EG", "rooms": [], "walls": [], "devices": []}, FLOOR]})]


def test_where_the_sensor_is_and_the_camera_of_its_room():
    p = ap.place_of(HOUSES, "binary_sensor.wasser")
    assert p["floor"]["name"] == "Keller" and p["room"]["id"] == "w" and (p["x"], p["z"]) == (1.0, 1.0)
    assert ap.cameras_near(p) == ["camera.waschkueche"]                   # not the one next door
    door = ap.place_of(HOUSES, "binary_sensor.tuer")                       # a door contact: the middle of the wall
    assert abs(door["x"] - 4) < 1e-9 and door["room"] is not None
    assert ap.place_of(HOUSES, "binary_sensor.nirgends") is None and ap.cameras_near(None) == []


def test_the_plan_is_a_png_with_the_room_red():
    p = ap.place_of(HOUSES, "binary_sensor.wasser")
    png = ap.plan_png(p, "water", "de", "Keller · Waschküche")
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    im = PIL.open(io.BytesIO(png)).convert("RGB")
    assert max(im.size) <= 1100 and im.size[1] > 300
    w, h = im.size
    reds = sum(1 for x in range(0, w, 7) for y in range(0, h, 7) if (lambda c: c[0] > 200 and c[1] < 120 and c[2] < 120)(im.getpixel((x, y))))
    assert reds > 20                                                       # the ring and the word are there
    assert ap._plain("Waschküche 🫧") == "Waschküche"
