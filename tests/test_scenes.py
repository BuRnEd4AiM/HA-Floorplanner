"""Scenes of the dashboard as real scenes of Home Assistant (scenes.py, #549): the model is checked, turned into Home Assistant's scene
config and read back from it, and what ▶ Ausprobieren sends."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import haflows as hf  # noqa: E402
import scenes as sc  # noqa: E402

KINO = {"name": "  Kino  ", "icon": "mdi:movie", "ents": {
    "light.led_tv": {"on": True, "pct": 30, "rgb": [120, 0, 255.4], "fx": "Rainbow"},
    "light.decke": {"on": False, "pct": 80},
    "light.stehlampe": {"on": True, "pct": 0.4, "kelvin": 2700, "rgb": [1, 2, 3]},
    "cover.wz": {"pos": 20},
    "switch.kaffee": {"on": True},
    "climate.wz": {"on": True}, "Light.X": {"on": True}, "light.y": "an"}}


def test_the_model_is_cleaned():
    m = sc.clean_model(KINO)
    assert m == {"name": "Kino", "icon": "mdi:movie", "ents": {
        "light.led_tv": {"on": True, "pct": 30, "rgb": [120, 0, 255], "fx": "Rainbow"},
        "light.decke": {"on": False},
        "light.stehlampe": {"on": True, "pct": 1, "kelvin": 2700},                     # a white tone wins over a colour
        "cover.wz": {"on": True, "pos": 20},
        "switch.kaffee": {"on": True}}}
    assert sc.clean_model({"name": "", "ents": {"light.a": {}}}) is None and sc.clean_model({"name": "X", "ents": {"climate.a": {}}}) is None
    assert sc.clean_model({"name": "X", "icon": "<b>", "ents": {"light.a": {}}}) == {"name": "X", "ents": {"light.a": {"on": True}}}
    assert hf.ours(sc.new_id()) and sc.new_id() != sc.new_id()


def test_to_home_assistant_and_back():
    m = sc.clean_model(KINO)
    cfg = sc.to_ha("fp3d_skino", m)
    assert cfg == {"id": "fp3d_skino", "name": "Kino", "icon": "mdi:movie", "entities": {
        "light.led_tv": {"state": "on", "brightness": 76, "color_mode": "rgb", "rgb_color": [120, 0, 255], "effect": "Rainbow"},
        "light.decke": {"state": "off"},
        "light.stehlampe": {"state": "on", "brightness": 3, "color_mode": "color_temp", "color_temp_kelvin": 2700},
        "cover.wz": {"state": "open", "current_position": 20},
        "switch.kaffee": {"state": "on"}}}
    back = sc.from_ha(cfg)
    assert back["name"] == "Kino" and back["ents"]["light.led_tv"] == {"on": True, "pct": 30, "rgb": [120, 0, 255], "fx": "Rainbow"}
    assert back["ents"]["light.stehlampe"] == {"on": True, "pct": 1, "kelvin": 2700} and back["ents"]["cover.wz"] == {"on": True, "pos": 20}
    assert sc.apply_data(m)["entities"]["switch.kaffee"] == {"state": "on"}


def test_a_scene_made_in_home_assistant_is_read():
    cfg = {"id": "1700000000", "name": "Abend", "entities": {
        "light.wz": {"state": "on", "brightness": 255, "color_mode": "hs", "hs_color": [30, 50], "rgb_color": [255, 191, 127], "friendly_name": "WZ"},
        "light.flur": "off", "media_player.tv": {"state": "on"}, "cover.rollo": {"state": "closed", "current_position": 0}}}
    assert sc.from_ha(cfg) == {"name": "Abend", "ents": {"light.wz": {"on": True, "pct": 100, "rgb": [255, 191, 127]}, "light.flur": {"on": False},
                                                         "cover.rollo": {"on": False, "pos": 0}}}
    assert sc.from_ha({"name": "x"}) is None
