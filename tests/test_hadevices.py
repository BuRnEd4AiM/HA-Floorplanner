"""hadevices.py: which entities belong to the same device, also when Home Assistant 2026.11 splits a device into parts (#675)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import hadevices as hd  # noqa: E402


def ent(eid, dev):
    return {"entity_id": eid, "device_id": dev, "platform": "zwave_js", "unique_id": eid}


# A Z-Wave thermostat split into its main device and two sensor parts; a power strip whose second socket is in another area.
DEVICES = [
    {"id": "trv", "name": "Thermostat", "area_id": "bad", "parent_device_id": None},
    {"id": "trv_s1", "name": "Room Sensor", "area_id": None, "parent_device_id": "trv"},
    {"id": "trv_s2", "name": "Floor Sensor", "area_id": "bad", "parent_device_id": "trv"},        # its own area, the same as the main's
    {"id": "strip", "name": "Steckdosenleiste", "area_id": "wz"},                                     # no "parent_device_id" at all
    {"id": "strip_1", "name": "Channel 1", "area_id": None, "parent_device_id": "strip"},
    {"id": "strip_2", "name": "Lampe", "area_id": "essen", "parent_device_id": "strip"},             # put into the dining room
]
ENTRIES = [ent("climate.bad", "trv"), ent("sensor.bad_battery", "trv"), ent("sensor.room_temp", "trv_s1"), ent("sensor.floor_temp", "trv_s2"),
           ent("switch.strip_1", "strip_1"), ent("sensor.strip_1_power", "strip_1"), ent("switch.strip_2", "strip_2"),
           ent("sensor.strip_power", "strip"), {"entity_id": "light.yaml", "device_id": None}, {"entity_id": "x"}, "junk"]


def test_parents_of_the_parts():
    assert hd.parents(DEVICES) == {"trv_s1": "trv", "trv_s2": "trv", "strip_1": "strip"}    # the lamp's socket is a device of its own
    assert hd.parents(None) == {} and hd.parents([{"id": "a"}, "junk", {"parent_device_id": "x"}]) == {}
    assert hd.parents([{"id": "a", "parent_device_id": "a"}]) == {}                           # never its own main device


def test_own_and_whole_device():
    d = hd.Devices(ENTRIES, DEVICES)
    assert d.own("sensor.room_temp") == ["sensor.room_temp"]
    assert d.whole("sensor.room_temp") == ["sensor.room_temp", "climate.bad", "sensor.bad_battery", "sensor.floor_temp"]   # own first
    assert d.whole("climate.bad") == ["climate.bad", "sensor.bad_battery", "sensor.room_temp", "sensor.floor_temp"]
    assert d.whole("switch.strip_2") == ["switch.strip_2"]                                    # in another area: on its own
    assert d.own("light.yaml") == d.whole("light.yaml") == [] and d.whole("sensor.unknown") == []
    assert "x" not in d.device_of and "light.yaml" not in d.device_of


def test_near_looks_on_the_own_part_first_then_on_the_whole_device():
    d = hd.Devices(ENTRIES, DEVICES)

    def power(x):
        return x.endswith("_power")
    assert d.near("switch.strip_1", power) == ["sensor.strip_1_power"]                       # the socket's own, not the strip's
    assert d.near("sensor.room_temp", lambda x: x.startswith("climate.")) == ["climate.bad"]  # the main device's thermostat
    assert d.near("climate.bad", lambda x: x.startswith("climate.")) == []                    # never itself
    assert d.near("switch.strip_2", power) == []
    assert d.near("light.yaml", power) == []


def test_without_parts_everything_is_as_before():
    """Home Assistant before 2026.11 (no device list, no "parent_device_id"): own and whole are the same device"""
    d = hd.Devices(ENTRIES)
    for e in d.device_of:
        assert d.whole(e) == d.own(e)
    assert d.near("sensor.room_temp", lambda x: x.startswith("climate.")) == []
