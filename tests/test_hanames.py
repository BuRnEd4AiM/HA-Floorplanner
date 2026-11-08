"""hanames.py: the name Home Assistant shows for an entity, read in one place; built from the registries when friendly_name is gone (#675)."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import hanames  # noqa: E402

APP = Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"


@pytest.fixture(autouse=True)
def forget():
    hanames.remember({})
    yield
    hanames.remember({})


DEVICES = [{"id": "kaffee", "name": "Smart plug 3", "name_by_user": "Kaffeemaschine"}, {"id": "tv", "name": "TV", "name_by_user": None},
           {"id": "blank", "name": " ", "name_by_user": ""}, {"name": "no id"}, "junk"]


def test_name_is_friendly_name_or_the_default():
    assert hanames.name({"entity_id": "light.a", "attributes": {"friendly_name": "Decke"}}) == "Decke"
    assert hanames.name({"entity_id": "light.a", "attributes": {"friendly_name": "  "}}, "light.a") == "light.a"
    assert hanames.name({"entity_id": "light.a", "attributes": {"friendly_name": 7}}, "x") == "x"
    assert hanames.name({"entity_id": "light.a", "attributes": {}}) is None
    assert hanames.name(None, "d") == hanames.name("junk", "d") == hanames.name({"attributes": None}, "d") == "d"


def test_without_friendly_name_the_name_from_the_registries():
    hanames.remember({"sensor.p": "Kaffeemaschine Leistung"})
    assert hanames.name({"entity_id": "sensor.p", "attributes": {}}, "sensor.p") == "Kaffeemaschine Leistung"
    assert hanames.name({"entity_id": "sensor.p", "attributes": {"friendly_name": "Alt"}}) == "Alt"     # friendly_name still first
    assert hanames.name({"entity_id": "sensor.q", "attributes": {}}, "sensor.q") == "sensor.q"
    hanames.remember(None)
    assert hanames.name({"entity_id": "sensor.p", "attributes": {}}, "d") == "d"


def test_device_names():
    assert hanames.device_names(DEVICES) == {"kaffee": "Kaffeemaschine", "tv": "TV"}
    assert hanames.device_names(None) == {}


def test_registry_name_from_home_assistant_2026_11_on():
    """the entity's own name with its device's name in front, like Home Assistant builds friendly_name (no "has_entity_name" in the list)"""
    dev = hanames.device_names(DEVICES)

    def e(**kw):
        return {"entity_id": "sensor.x", "device_id": "kaffee", "name": None, "original_name": None, "next_name_part": "device", **kw}
    assert hanames.registry_name(e(original_name="Power"), dev) == "Kaffeemaschine Power"
    assert hanames.registry_name(e(name="Leistung", original_name="Power"), dev) == "Kaffeemaschine Leistung"   # renamed in HA
    assert hanames.registry_name(e(name="", original_name="Switch"), dev) == "Kaffeemaschine"   # the main entity of its device
    assert hanames.registry_name(e(original_name=None), dev) == "Kaffeemaschine"
    assert hanames.registry_name(e(device_id=None, original_name="Sonne"), dev) == "Sonne"
    assert hanames.registry_name(e(device_id="gone", name="Zähler"), dev) == "Zähler"
    assert hanames.registry_name(e(device_id=None), dev) is None
    assert hanames.registry_name("junk", dev) is None


def test_registry_name_before_home_assistant_2026_11():
    """the list says "has_entity_name": a name given in Home Assistant is the whole name"""
    dev = hanames.device_names(DEVICES)

    def e(**kw):
        return {"entity_id": "sensor.x", "device_id": "kaffee", "name": None, "original_name": "Power", "has_entity_name": True, **kw}
    assert hanames.registry_name(e(), dev) == "Kaffeemaschine Power"
    assert hanames.registry_name(e(name="Kaffee Leistung"), dev) == "Kaffee Leistung"
    assert hanames.registry_name(e(has_entity_name=False, original_name="Smart plug 3 Power"), dev) == "Smart plug 3 Power"
    assert hanames.registry_name(e(original_name=None), dev) == "Kaffeemaschine"


def test_registry_names():
    entries = [{"entity_id": "sensor.p", "device_id": "kaffee", "name": None, "original_name": "Power"},
               {"entity_id": "light.none", "device_id": None, "name": None, "original_name": None}, {"device_id": "tv", "name": "x"}]
    assert hanames.registry_names(entries, DEVICES) == {"sensor.p": "Kaffeemaschine Power"}
    assert hanames.registry_names(None, None) == {}


def test_friendly_name_is_read_only_through_hanames():
    """every part of the add-on reads an entity's name through hanames.name, so the day Home Assistant removes friendly_name only
    hanames.py changes (#675)"""
    readers = sorted(p.name for p in APP.glob("*.py") if p.name != "hanames.py" and ('"friendly_name"' in p.read_text() or "'friendly_name'" in p.read_text()))
    assert readers == []
