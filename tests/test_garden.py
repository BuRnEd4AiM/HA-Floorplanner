"""🚗 the car and 🌱 the garden (#533, garden.py): the choices kept in the settings, the zones found, the timers of "💧 gießen"."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import garden as gn  # noqa: E402


def test_the_cars_choices_and_the_gardens_are_cleaned():
    assert gn.clean_car({"battery": "sensor.auto_soc", "range": "light.x y", "mode": "select.evcc_mode", "fridge": "sensor.x", "name": "  Zoe "}) == \
        {"battery": "sensor.auto_soc", "mode": "select.evcc_mode", "name": "Zoe"}
    assert gn.clean_car("junk") == {}
    assert gn.clean_garden({"zones": ["valve.rasen", "switch.beet", "valve.rasen", "light.x", 5], "minutes": 15}) == {"zones": ["valve.rasen", "switch.beet"], "minutes": 15}
    assert gn.clean_garden({"zones": [f"valve.z{i}" for i in range(9)], "minutes": 7})["zones"] == [f"valve.z{i}" for i in range(6)]
    assert gn.clean_garden({"minutes": 7})["minutes"] == 10 and gn.clean_garden({"minutes": True})["minutes"] == 10


def test_zones_are_found_by_their_names_valves_always():
    states = [{"entity_id": "valve.gartenventil", "attributes": {}}, {"entity_id": "switch.bewasserung_rasen", "attributes": {}},
              {"entity_id": "switch.garten_licht", "attributes": {"friendly_name": "Gartenlicht"}}, {"entity_id": "switch.kaffee", "attributes": {}},
              {"entity_id": "switch.zone_2", "attributes": {"friendly_name": "Sprinkler Beet"}}]
    assert gn.find_zones(states, []) == ["valve.gartenventil", "switch.bewasserung_rasen", "switch.zone_2"]
    assert gn.find_zones(states, ["switch.kaffee"]) == ["switch.kaffee"]       # an admin's choice wins


def test_watering_requests_services_and_timers():
    zones = ["valve.rasen", "switch.beet"]
    assert gn.water_request({"entity": "valve.rasen", "minutes": 10}, zones) == ("valve.rasen", 10, None)
    assert gn.water_request({"entity": "switch.beet", "stop": True}, zones) == ("switch.beet", 0, None)
    assert gn.water_request({"entity": "switch.kaffee", "minutes": 10}, zones)[2]          # not a zone of the garden
    assert gn.water_request({"entity": "valve.rasen", "minutes": 500}, zones)[2]
    assert gn.water_request({"entity": "valve.rasen", "minutes": True}, zones)[2]
    assert gn.water_request("junk", zones)[2]
    assert gn.service("valve.rasen", True) == ("valve", "open_valve") and gn.service("valve.rasen", False) == ("valve", "close_valve")
    assert gn.service("switch.beet", True) == ("switch", "turn_on") and gn.service("switch.beet", False) == ("switch", "turn_off")
    now = 1_793_000_000.0
    t = gn.clean_timers({"valve.rasen": now - 5, "switch.beet": now + 300, "light.x": now, "valve.weit": now + 99999, "valve.b": True}, now)
    assert t == {"valve.rasen": now - 5, "switch.beet": now + 300}
    assert gn.due(t, now) == ["valve.rasen"]
