"""counters.py: the kWh counters of the power editor's sensors ("⤵ Von oben übernehmen" of the meters of the page ⚡ Energie)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import counters  # noqa: E402


def st(unit, name, sc=None, **more):
    return {"attributes": {"unit_of_measurement": unit, "friendly_name": name, **({"state_class": sc} if sc else {}), **more}}


STATES = {
    "sensor.wr_leistung": st("W", "Wechselrichter Leistung"),
    "sensor.wr_energie_gesamt": st("kWh", "Wechselrichter Energie gesamt", "total_increasing"),
    "sensor.wr_energie_heute": st("kWh", "Wechselrichter Energie heute", "total_increasing"),
    "sensor.zaehler_leistung": st("W", "Zähler Leistung"),
    "sensor.zaehler_bezug": st("kWh", "Zähler Energie Bezug", "total_increasing"),
    "sensor.zaehler_einspeisung": st("kWh", "Zähler Energie Einspeisung", "total_increasing"),
    "sensor.akku_laden": st("W", "Akku Ladeleistung"),
    "sensor.akku_entladen": st("W", "Akku Entladeleistung"),
    "sensor.akku_geladen": st("kWh", "Akku Energie geladen", "total_increasing"),
    "sensor.akku_entladen_kwh": st("kWh", "Akku Energie entladen", "total_increasing"),
    "sensor.template_pv": st("W", "PV Leistung"),
    "sensor.template_pv_energie": st("kWh", "PV Energie", "total", source="sensor.template_pv"),
    "sensor.lonely": st("W", "Pumpe Leistung"),
}
REG = [{"entity_id": e, "device_id": d} for e, d in (
    ("sensor.wr_leistung", "wr"), ("sensor.wr_energie_gesamt", "wr"), ("sensor.wr_energie_heute", "wr"),
    ("sensor.zaehler_leistung", "z"), ("sensor.zaehler_bezug", "z"), ("sensor.zaehler_einspeisung", "z"),
    ("sensor.akku_laden", "a"), ("sensor.akku_entladen", "a"), ("sensor.akku_geladen", "a"), ("sensor.akku_entladen_kwh", "a"))]


def test_a_counter_of_the_same_device_that_fits():
    assert counters.counter_for("sensor.wr_leistung", "solar", STATES, REG) == {
        "entity_id": "sensor.wr_energie_gesamt", "name": "Wechselrichter Energie gesamt", "how": "device"}       # not the one of today
    assert counters.counter_for("sensor.zaehler_leistung", "from", STATES, REG)["entity_id"] == "sensor.zaehler_bezug"
    assert counters.counter_for("sensor.zaehler_leistung", "to", STATES, REG)["entity_id"] == "sensor.zaehler_einspeisung"
    assert counters.counter_for("sensor.akku_laden", "batIn", STATES, REG)["entity_id"] == "sensor.akku_geladen"
    assert counters.counter_for("sensor.akku_entladen", "batOut", STATES, REG)["entity_id"] == "sensor.akku_entladen_kwh"
    assert counters.counter_for("sensor.zaehler_leistung", "solar", STATES, REG) is None      # the grid meter's counters are not the sun's


def test_a_helper_made_from_it_and_none():
    assert counters.counter_for("sensor.template_pv", "solar", STATES, REG) == {"entity_id": "sensor.template_pv_energie", "name": "PV Energie", "how": "helper"}
    assert counters.counter_for("sensor.lonely", "solar", STATES, REG) is None                 # no device, no helper
    two = dict(STATES, **{"sensor.wr_x": st("kWh", "Wechselrichter X", "total_increasing")})
    reg = REG + [{"entity_id": "sensor.wr_x", "device_id": "wr"}]
    assert counters.counter_for("sensor.wr_leistung", "solar", two, reg)["entity_id"] == "sensor.wr_energie_gesamt"   # "gesamt" wins


def test_several_without_a_word_are_not_guessed():
    s = {"sensor.p": st("W", "Gerät Leistung"), "sensor.a": st("kWh", "Gerät A"), "sensor.b": st("kWh", "Gerät B")}
    assert counters.counter_for("sensor.p", "solar", s, [{"entity_id": e, "device_id": "d"} for e in s]) is None
    one = {"sensor.p": st("W", "Gerät Leistung"), "sensor.a": st("kWh", "Gerät A", "total_increasing")}
    assert counters.counter_for("sensor.p", "solar", one, [{"entity_id": e, "device_id": "d"} for e in one])["entity_id"] == "sensor.a"


def test_the_question_and_the_answer():
    q = counters.clean_sources({"solar": "sensor.wr_leistung,sensor.wr_leistung,light.x,sensor.lonely", "from": "", "batIn": "sensor.akku_laden", "x": "sensor.y"})
    assert q == {"solar": ["sensor.wr_leistung", "sensor.lonely"], "batIn": ["sensor.akku_laden"]}
    f = counters.find_counters(q, STATES, REG)
    assert [x["counter"] and x["counter"]["entity_id"] for x in f["solar"]] == ["sensor.wr_energie_gesamt", None]
    assert f["solar"][1] == {"power": "sensor.lonely", "power_name": "Pumpe Leistung", "unit": "W", "stats": False, "counter": None}
    assert counters.has_stats(st("W", "x", "measurement")) and not counters.has_stats(st("W", "x")) and not counters.has_stats(None)


def test_the_helper_made():
    assert counters.helper_input("sensor.a", "A Energie") == {"name": "A Energie", "source": "sensor.a", "method": "left", "round": 3, "unit_prefix": "k", "unit_time": "h"}
    assert counters.helper_name("SolarNet Ladeleistung") == "SolarNet Ladeleistung Energie"
    assert counters.helper_name("PV Leistung") == "PV Energie" and counters.helper_name("Solar Power") == "Solar Energie" and counters.helper_name("") == "Zähler Energie"
