"""pages.py (#481): the meters of the energy dashboard, the statistics asked for and their answer, the weather forecast, calendar events."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import pages  # noqa: E402


def test_meters_from_the_flat_energy_dashboard():
    prefs = {"energy_sources": [
        {"type": "grid", "stat_energy_from": "sensor.bezug", "stat_energy_to": "sensor.einspeisung", "number_energy_price": 0.32,
         "number_energy_price_export": 0.08},
        {"type": "solar", "stat_energy_from": "sensor.pv"}, {"type": "solar", "stat_energy_from": "sensor.balkon"},
        {"type": "battery", "stat_energy_from": "sensor.bat_out", "stat_energy_to": "sensor.bat_in"},
        {"type": "gas", "stat_energy_from": "sensor.gas"}, {"type": "water", "stat_energy_from": "sensor.wasser"}, "junk"],
        "device_consumption": [{"stat_consumption": "sensor.waschmaschine_kwh", "name": "Waschmaschine"}, {"stat_consumption": "bad id"}]}
    m = pages.energy_meters(prefs)
    assert m["meters"] == {"from": ["sensor.bezug"], "to": ["sensor.einspeisung"], "solar": ["sensor.pv", "sensor.balkon"], "batIn": ["sensor.bat_in"],
                           "batOut": ["sensor.bat_out"], "gas": ["sensor.gas"], "water": ["sensor.wasser"]}
    assert m["devices"] == [{"id": "sensor.waschmaschine_kwh", "name": "Waschmaschine"}]
    assert m["price"] == {"buy": 0.32, "sell": 0.08}


def test_meters_from_the_older_nested_form_and_nothing():
    prefs = {"energy_sources": [{"type": "grid", "flow_from": [{"stat_energy_from": "sensor.t1", "number_energy_price": 0.3}, {"stat_energy_from": "sensor.t2"}],
                                 "flow_to": [{"stat_energy_to": "sensor.out", "number_energy_price": 0.07}]},
                                {"type": "solar", "stat_energy_from": "solar:external"}]}
    m = pages.energy_meters(prefs)
    assert m["meters"]["from"] == ["sensor.t1", "sensor.t2"] and m["meters"]["to"] == ["sensor.out"] and m["meters"]["solar"] == ["solar:external"]
    assert m["price"] == {"buy": 0.3, "sell": 0.07}
    empty = pages.energy_meters(None)
    assert all(v == [] for v in empty["meters"].values()) and empty["devices"] == [] and empty["price"] == {}


def test_a_question_for_statistics_is_checked():
    ok, err = pages.clean_stats_request({"ids": ["sensor.a", "sensor.a", "bad id", "x:y"], "start": "2026-10-21T00:00:00+02:00",
                                         "end": "2026-10-22T00:00:00+02:00", "period": "hour"})
    assert err is None and ok["ids"] == ["sensor.a", "x:y"] and ok["period"] == "hour"
    two_years = {"ids": ["sensor.a"], "start": "2025-01-01T00:00:00+01:00", "end": "2027-01-01T00:00:00+01:00", "period": "month"}
    assert pages.clean_stats_request(two_years)[1] is None                      # a year and the one before it
    for bad in [{"ids": [], "start": "2026-10-21T00:00:00+02:00", "end": "2026-10-22T00:00:00+02:00", "period": "hour"},
                {"ids": ["sensor.a"], "start": "2026-10-21T00:00:00", "end": "2026-10-22T00:00:00+02:00", "period": "hour"},     # no time zone
                {"ids": ["sensor.a"], "start": "2026-10-22T00:00:00+02:00", "end": "2026-10-21T00:00:00+02:00", "period": "hour"},
                {"ids": ["sensor.a"], "start": "2023-01-01T00:00:00+00:00", "end": "2026-01-01T00:00:00+00:00", "period": "month"},   # too long
                {"ids": ["sensor.a"], "start": "2026-10-01T00:00:00+00:00", "end": "2026-10-21T00:00:00+00:00", "period": "hour"},    # too many hours
                {"ids": ["sensor.a"], "start": "2026-10-21T00:00:00+02:00", "end": "2026-10-22T00:00:00+02:00", "period": "minute"},
                {"ids": [f"sensor.s{i}" for i in range(61)], "start": "2026-10-21T00:00:00+02:00", "end": "2026-10-22T00:00:00+02:00", "period": "hour"},
                "junk"]:
        assert pages.clean_stats_request(bad)[0] is None, bad


def test_statistics_answer_is_cut_down_and_units_come_with_it():
    res = {"sensor.a": [{"start": 1761000000000, "change": 0.51234}, {"start": 1761003600.0, "change": None}, {"start": "2026-10-21T02:00:00+00:00", "change": 1}],
           "bad id": [{"start": 1, "change": 2}], "sensor.b": "junk"}
    meta = [{"statistic_id": "sensor.a", "unit_class": "energy", "statistics_unit_of_measurement": "Wh"},
            {"statistic_id": "sensor.w", "unit_class": "volume", "statistics_unit_of_measurement": "L"},
            {"statistic_id": "sensor.x", "unit_class": None, "statistics_unit_of_measurement": "€"}]
    out = pages.slim_stats(res, meta)
    assert out["stats"]["sensor.a"][0] == [1761000000000, 0.5123]
    assert out["stats"]["sensor.a"][1] == [1761003600000, None]                     # seconds become ms
    assert out["stats"]["sensor.a"][2][0] == 1792548000000                       # an ISO text
    assert "bad id" not in out["stats"] and "sensor.b" not in out["stats"]
    assert out["units"] == {"sensor.a": "kWh", "sensor.w": "m³", "sensor.x": "€"}


def test_forecast_and_events():
    resp = {"changed_states": [], "service_response": {"weather.home": {"forecast": [
        {"datetime": "2026-10-22T00:00:00+00:00", "condition": "rainy", "temperature": 11.5, "templow": 6, "precipitation": 3.2, "precipitation_probability": 80},
        {"datetime": "nonsense", "condition": "sunny"}, "junk"]}}}
    f = pages.slim_forecast(resp, "weather.home")
    assert f == [{"t": "2026-10-22T00:00:00+00:00", "c": "rainy", "hi": 11.5, "lo": 6, "p": 3.2, "pp": 80, "day": None}]
    assert pages.slim_forecast({"weather.home": {"forecast": [{"datetime": "2026-10-22T00:00:00+00:00"}]}}, "weather.home")[0]["c"] == ""
    assert pages.slim_forecast(None, "weather.home") == []
    ev = pages.slim_events([{"start": {"dateTime": "2026-10-21T15:00:00+02:00"}, "end": {"dateTime": "2026-10-21T16:00:00+02:00"}, "summary": "Zahnarzt"},
                            {"start": {"date": "2026-10-22"}, "end": {"date": "2026-10-23"}, "summary": "Gelber Sack"},
                            {"start": {"date": "22.10.2026"}, "summary": "kaputt"}, 5], "calendar.familie")
    assert ev == [{"s": "2026-10-21T15:00:00+02:00", "e": "2026-10-21T16:00:00+02:00", "allDay": False, "title": "Zahnarzt", "cal": "calendar.familie"},
                  {"s": "2026-10-22", "e": "2026-10-23", "allDay": True, "title": "Gelber Sack", "cal": "calendar.familie"}]


def test_calendars_and_the_window_of_days():
    assert pages.clean_calendars(["calendar.a", "calendar.a", "sensor.x", 5, "calendar.b"]) == ["calendar.a", "calendar.b"]
    assert pages.clean_calendars("calendar.a") == []
    assert pages.agenda_window("2026-10-21T00:00:00+02:00", "2026-10-23T00:00:00+02:00") == ("2026-10-20T22:00:00+00:00", "2026-10-22T22:00:00+00:00")
    assert pages.agenda_window("2026-10-21T00:00:00", "2026-10-23T00:00:00+02:00") is None
    assert pages.agenda_window("2026-10-01T00:00:00+02:00", "2026-10-30T00:00:00+02:00") is None
