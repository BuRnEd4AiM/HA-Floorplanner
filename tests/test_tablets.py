"""Unit tests for tablets.py: a tablet's own wall tablet values, rights per kind of device, Fully Kiosk (5.12.0)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import tablets as tb  # noqa: E402


def test_own_values_keep_only_what_the_page_understands():
    assert tb.clean_kiosk({"saver": "clock", "nightLevel": 99, "reloadAt": "", "wakeSensor": "light.x", "cleanBtn": "yes", "brightNight": 0}) == {
        "saver": "clock", "reloadAt": "", "brightNight": 0}
    assert tb.clean_kiosk("junk") == {}
    assert tb.clean_user_kiosk({"tab": {"saver": "black"}, "empty": {"x": 1}, " ": {"saver": "off"}}) == {"tab": {"saver": "black"}}


def test_the_same_fields_as_the_page():
    js = (Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app" / "static" / "kioskprefs.js").read_text("utf-8")
    block = js[js.index("export const KIOSK_FIELDS = {"):js.index("export const KIOSK_KEYS")]
    for key in tb.KIOSK_FIELDS:
        assert f"{key}:" in block, key
    rights = (Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app" / "static" / "userrights.js").read_text("utf-8")
    for kind, n in tb.KINDS:
        assert f"['{kind}', " in rights and f", {n}]" in rights, kind


def test_rights_per_kind_of_device():
    r = {"light": "onoff", "cover": "view", "climate": "onoff"}
    assert tb.allows(r, "light", "toggle", {"entity_id": "light.a"})
    assert not tb.allows(r, "light", "turn_on", {"entity_id": "light.a", "brightness_pct": 20})
    assert not tb.allows(r, "cover", "open_cover", {"entity_id": "cover.a"})
    assert tb.allows(r, "cover", "open_cover", {"entity_id": "cover.g"}, "garage")    # a garage door is a gate: not limited here
    assert tb.allows(r, "climate", "set_hvac_mode", {"entity_id": "climate.a", "hvac_mode": "off"})
    assert not tb.allows(r, "climate", "set_temperature", {"entity_id": "climate.a", "temperature": 22})
    assert tb.allows(r, "calendar", "create_event", {"entity_id": "calendar.a", "summary": "x"})
    assert tb.needs_class(r, "cover") and not tb.needs_class({"cover": "view", "gate": "view"}, "cover") and not tb.needs_class(r, "light")
    assert tb.clean_user_rights({"k": {"gate": "onoff", "light": "view", "x": "view"}, "all": {"light": "all"}}) == {"k": {"light": "view"}}


def test_fully_kiosk_calls():
    e = {"fullyBright": "number.t_screen_brightness", "fullyScreen": "switch.t_screen", "brightDay": 100, "brightNight": 10}
    assert tb.fully_calls(e, "day") == [("switch", "turn_on", {"entity_id": "switch.t_screen"}), ("number", "set_value", {"entity_id": "number.t_screen_brightness", "value": 255})]
    assert tb.fully_calls(e, "night", 100)[-1] == ("number", "set_value", {"entity_id": "number.t_screen_brightness", "value": 10})
    assert tb.fully_calls(e, "off") == [("switch", "turn_off", {"entity_id": "switch.t_screen"})]
    assert tb.fully_calls({"fullyBright": "number.b"}, "off") == [("number", "set_value", {"entity_id": "number.b", "value": 26})]   # no switch: as dim as at night
    assert tb.fully_calls({}, "day") == [] and tb.fully_calls(e, "party") == []
