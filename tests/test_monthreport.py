"""📊 Monatsbericht (monthreport.py, 5.26.0): the month, when it is due, the sums of the statistics, how long a thermostat heated, the
report per room, its text and picture."""
import datetime as dt
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "floorplan3d", "rootfs", "app"))
import monthreport as mr  # noqa: E402

TZ = dt.timezone(dt.timedelta(hours=1))


def test_clean_cfg():
    assert mr.clean_cfg(None) == {"on": False, "day": 1, "hour": 8}
    assert mr.clean_cfg({"on": True, "day": 3, "hour": 19}) == {"on": True, "day": 3, "hour": 19}
    assert mr.clean_cfg({"on": "yes", "day": 31, "hour": True}) == {"on": False, "day": 1, "hour": 8}


def test_month_span_and_due():
    key, a, b = mr.month_span(dt.datetime(2026, 1, 5, 9, 30, tzinfo=TZ))
    assert key == "2025-12" and a == dt.datetime(2025, 12, 1, tzinfo=TZ) and b == dt.datetime(2026, 1, 1, tzinfo=TZ)
    assert mr.month_span(dt.datetime(2026, 11, 20, tzinfo=TZ))[0] == "2026-10"
    assert mr.month_span(dt.datetime(2026, 3, 2, tzinfo=TZ), back=3)[0] == "2025-12"
    cfg = {"on": True, "day": 1, "hour": 8}
    assert mr.due(cfg, dt.datetime(2026, 11, 1, 7, 59, tzinfo=TZ), "") is None          # before the hour
    assert mr.due(cfg, dt.datetime(2026, 11, 1, 8, 0, tzinfo=TZ), "") == "2026-10"
    assert mr.due(cfg, dt.datetime(2026, 11, 3, 2, 0, tzinfo=TZ), "2026-09") == "2026-10"  # the add-on was off on the 1st: later
    assert mr.due(cfg, dt.datetime(2026, 11, 20, tzinfo=TZ), "2026-10") is None           # sent already
    assert mr.due({**cfg, "on": False}, dt.datetime(2026, 11, 2, tzinfo=TZ), "") is None


def test_stat_sum():
    res = {"sensor.grid": [{"change": 120.5}, {"change": 10}], "sensor.gas": [{"change": None}]}
    assert mr.stat_sum(res, ["sensor.grid"]) == 130.5
    assert mr.stat_sum(res, ["sensor.gas", "sensor.none"]) is None


def test_climate_use():
    rows = [{"s": "heat", "a": {"hvac_action": "heating", "current_temperature": 19, "temperature": 21}, "lu": 0},
            {"s": "heat", "a": {"hvac_action": "idle", "current_temperature": 23}, "lu": 3600},
            {"s": "off", "lu": 7200}]
    secs, warm = mr.climate_use(rows, 10800)
    assert secs == 3600 and warm == 0.0                     # an hour heating; −2 for an hour and +2 for an hour
    old = [{"s": "heat", "a": {"current_temperature": 18, "temperature": 20}, "lu": 0}]   # no hvac_action: on and colder than wished
    assert mr.climate_use(old, 1800)[0] == 1800


ROOMS = [{"key": "h/r1", "name": "Wohnzimmer", "climates": ["climate.wz"]}, {"key": "h/r2", "name": "Bad", "climates": ["climate.bad"]},
         {"key": "h/r3", "name": "Küche", "climates": []}]


def test_build():
    use = {"climate.wz": (30 * 3600, 1.6), "climate.bad": (10 * 3600, 0.2)}
    rep = mr.build(ROOMS, use, {"h/r3": 100.0}, {"power": 300, "gas": 100, "power_ly": 360, "gas_ly": 120}, {"buy": 0.3, "gas": 1.2}, "2026-10")
    assert rep["heat"] == 120 and rep["power"] == 90 and rep["heatUnit"] == "€" and rep["powerUnit"] == "€"
    assert rep["rooms"] == [{"name": "Wohnzimmer", "heat": 90, "power": 0}, {"name": "Bad", "heat": 30, "power": 0}, {"name": "Küche", "heat": 0, "power": 30}]
    assert rep["change"] == -17                              # 210 € against 252 €
    assert rep["warm"] == {"room": "Wohnzimmer", "d": 1.6}
    bare = mr.build(ROOMS, {}, {}, {"power": 250}, {}, "2026-10")   # no prices, no gas, nothing a year before
    assert bare["power"] == 250 and bare["powerUnit"] == "kWh" and bare["heat"] is None and bare["change"] is None and bare["warm"] is None


def test_text_and_picture():
    rep = mr.build(ROOMS, {"climate.wz": (3600, 1.5)}, {"h/r3": 40.0}, {"power": 200, "gas": 50, "power_ly": 220, "gas_ly": 60},
                   {"buy": 0.4, "gas": 1.0}, "2026-10")
    txt = mr.text(rep, "de")
    assert txt.splitlines()[0] == "📊 Dein Haus im Oktober"
    assert "🔥 Heizung 50 €" in txt and "⚡ Strom 80 €" in txt and "% weniger als Oktober 2025" in txt
    assert "Wohnzimmer: 🔥 50 €" in txt and "Küche: ⚡ 16 €" in txt and "Wohnzimmer war 1,5° wärmer als eingestellt" in txt
    assert mr.text(rep, "en", preview=True).startswith("📊 Your house in October (preview)")
    assert "keine Zählerstände" in mr.text(mr.build([], {}, {}, {}, {}, "2026-10"), "de")
    houses = [("h", {"floors": [{"rooms": [{"id": "r1", "name": "Wohnzimmer", "points": [[0, 0], [5, 0], [5, 4], [0, 4]]},
                                           {"id": "r3", "name": "Küche", "points": [[5, 0], [9, 0], [9, 4], [5, 4]]}],
                                 "walls": [{"a": [0, 0], "b": [9, 0], "thickness": 0.2}]}]})]
    png = mr.picture(rep, houses, "de")
    assert png[:8] == b"\x89PNG\r\n\x1a\n" and len(png) > 2000
