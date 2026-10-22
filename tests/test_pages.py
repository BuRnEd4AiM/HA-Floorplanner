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
    assert pages.agenda_window("2026-09-28T00:00:00+02:00", "2026-11-09T00:00:00+01:00", 42)        # a calendar card's month (#495)
    assert pages.agenda_window("2026-09-28T00:00:00+02:00", "2026-11-12T00:00:00+01:00", 42) is None
    many = [{"start": {"date": "2026-10-01"}, "summary": str(i)} for i in range(200)]
    assert len(pages.slim_events(many, "calendar.a")) == 50 and len(pages.slim_events(many, "calendar.a", 150)) == 150


def test_the_people_with_the_battery_of_their_phone():
    """#483: the battery sensor of the device of the person's tracker in use, else its first tracker, else the tracker's own attribute"""
    states = [
        {"entity_id": "person.anna", "state": "home", "last_changed": "2026-10-21T09:02:00+00:00",
         "attributes": {"friendly_name": "Anna", "source": "device_tracker.anna_handy", "device_trackers": ["device_tracker.anna_handy"],
                        "entity_picture": "/api/image/serve/0123abcd/512x512"}},
        {"entity_id": "person.max", "state": "Arbeit", "last_changed": "bad",
         "attributes": {"friendly_name": "Max", "device_trackers": ["device_tracker.max_alt", "device_tracker.max_handy"], "entity_picture": "https://evil.example/x.png"}},
        {"entity_id": "person.oma", "state": "not_home", "attributes": {"source": "device_tracker.oma", "entity_picture": "/local/../secrets.yaml"}},
        {"entity_id": "device_tracker.anna_handy", "state": "home", "attributes": {}},
        {"entity_id": "sensor.anna_handy_battery_level", "state": "78", "attributes": {"device_class": "battery", "unit_of_measurement": "%"}},
        {"entity_id": "sensor.anna_handy_battery_state", "state": "Charging", "attributes": {}},
        {"entity_id": "device_tracker.max_handy", "state": "not_home", "attributes": {"battery_level": 45}},
        {"entity_id": "device_tracker.oma", "state": "not_home", "attributes": {}},
        {"entity_id": "sensor.oma_battery", "state": "unavailable", "attributes": {"device_class": "battery"}},
        "junk",
    ]
    registry = [{"entity_id": "device_tracker.anna_handy", "device_id": "d1"}, {"entity_id": "sensor.anna_handy_battery_level", "device_id": "d1"},
                {"entity_id": "sensor.anna_handy_battery_state", "device_id": "d1"}, {"entity_id": "device_tracker.oma", "device_id": "d3"},
                {"entity_id": "sensor.oma_battery", "device_id": "d3"}, {"entity_id": "light.x"}, "junk"]
    people = {p["id"]: p for p in pages.family(states, registry)}
    assert list(people) == ["person.anna", "person.max", "person.oma"]
    assert people["person.anna"] == {"id": "person.anna", "name": "Anna", "state": "home", "since": "2026-10-21T09:02:00+00:00", "picture": True,
                                     "battery": 78, "charging": True, "sources": [{"kind": "other", "entity": "device_tracker.anna_handy", "state": "home", "since": None}]}
    assert people["person.max"]["battery"] == 45 and people["person.max"]["since"] is None and people["person.max"]["picture"] is False   # not from elsewhere
    assert people["person.oma"]["battery"] is None and people["person.oma"]["picture"] is False and people["person.oma"]["name"] == "oma"
    assert pages.family(None, None) == [] and pages.family([], "x") == []


def test_where_a_person_is_seen():                                  # #495: Wi-Fi, GPS, the phone's network and room
    states = [
        {"entity_id": "person.anna", "state": "home", "attributes": {"source": "device_tracker.anna_gps", "device_trackers": ["device_tracker.anna_gps", "device_tracker.anna_fritz"]}},
        {"entity_id": "device_tracker.anna_gps", "state": "home", "last_changed": "2026-10-22T09:00:00+00:00", "attributes": {"source_type": "gps"}},
        {"entity_id": "device_tracker.anna_fritz", "state": "home", "attributes": {"source_type": "router"}},
        {"entity_id": "sensor.anna_handy_wifi_connection", "state": "Zuhause-5G", "attributes": {}},
        {"entity_id": "sensor.anna_handy_area", "state": "Wohnzimmer", "attributes": {}},
        {"entity_id": "sensor.anna_handy_battery_level", "state": "60", "attributes": {"device_class": "battery"}},
    ]
    registry = [{"entity_id": e, "device_id": "d1"} for e in ("device_tracker.anna_gps", "sensor.anna_handy_wifi_connection", "sensor.anna_handy_area", "sensor.anna_handy_battery_level")]
    src = pages.family(states, registry)[0]["sources"]
    assert [(x["kind"], x["state"]) for x in src] == [("gps", "home"), ("room", "Wohnzimmer"), ("ssid", "Zuhause-5G"), ("wifi", "home")]
    assert src[0]["since"] == "2026-10-22T09:00:00+00:00" and src[3]["since"] is None
    assert pages.clean_presence({"rule": "two", "ssids": [" Zuhause-5G ", "Zuhause-5G", "", 5, "x" * 99]}) == {"rule": "two", "ssids": ["Zuhause-5G", "x" * 64]}
    assert pages.clean_presence("junk") == {"rule": "ha", "ssids": []}


def test_a_persons_picture_only_from_home_assistant():
    pic = lambda p: pages.person_picture({"attributes": {"entity_picture": p}})
    assert pic("/api/image/serve/abc123/512x512") == "/api/image/serve/abc123/512x512"
    assert pic("/local/people/anna.jpg?v=2") == "/local/people/anna.jpg?v=2"
    for bad in ("https://example.com/a.png", "/local/../secrets.yaml", "/api/states", "//evil/x", None, 5):
        assert pic(bad) is None, bad
    assert pages.person_picture(None) is None and pages.person_picture("x") is None


def test_the_notes_of_the_pinboard():
    from datetime import datetime, timezone, timedelta
    now = datetime(2026, 10, 21, 11, 48, tzinfo=timezone.utc)
    note, err = pages.new_note({"text": "  Bin um 6 da 🚗\x07\n\n\n\nbis dann ", "color": "green"}, " Max ", now, "a1b2c3d4e5f6a7b8")
    assert err is None and note == {"id": "a1b2c3d4e5f6a7b8", "text": "Bin um 6 da 🚗\n\nbis dann", "by": "Max", "at": "2026-10-21T11:48:00+00:00", "color": "green"}
    assert pages.new_note({"text": "x", "color": "red"}, "", now, "a1b2c3d4")[0]["color"] == "yellow"
    assert pages.new_note({"text": " \x07 "}, "", now, "a1b2c3d4") == (None, "the note is empty")
    assert pages.new_note("x", "", now, "a1b2c3d4")[1] == "invalid request"
    assert len(pages.new_note({"text": "y" * 500}, "", now, "a1b2c3d4")[0]["text"]) == pages.MAX_NOTE
    stored = [{"id": f"{i:08x}", "text": f"n{i}", "by": "x", "at": (now - timedelta(hours=i)).isoformat(), "color": "blue"} for i in range(40)]
    stored += [{"id": "bad id", "text": "x", "at": now.isoformat()}, {"id": "abcdef12", "text": "", "at": now.isoformat()}, {"id": "abcdef13", "text": "x", "at": "never"}, "junk"]
    kept = pages.clean_notes(stored)
    assert len(kept) == pages.MAX_NOTES and kept[0]["text"] == "n0" and kept[-1]["text"] == "n29"
    newer = pages.add_note(kept, note)
    assert newer[0]["id"] == note["id"] and len(newer) == pages.MAX_NOTES and newer[-1]["text"] == "n28"   # a full pinboard lets its oldest note go
    mixed = pages.clean_notes([{"id": "aaaaaaaa", "text": "a", "at": "2026-10-21T13:00:00+02:00"}, {"id": "bbbbbbbb", "text": "b", "at": "2026-10-21T11:30:00+00:00"}])
    assert [n["id"] for n in mixed] == ["bbbbbbbb", "aaaaaaaa"]                  # 11:30 UTC is after 11:00 UTC
    assert pages.clean_notes(None) == [] and pages.clean_notes([{"id": "aaaaaaaa", "text": "a", "at": now.isoformat()}] * 2)[0]["id"] == "aaaaaaaa"
