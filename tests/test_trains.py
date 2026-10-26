"""🚆 The departures of a station for the card "Zug" (trains.py, #550): the service's answer and a sensor of "DB Infoscreen" read the same
way, odd values left out, the address of a station."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import trains as tr  # noqa: E402

ANSWER = {"departures": [
    {"scheduledDeparture": "07:12", "delayDeparture": 5, "platform": "4", "scheduledPlatform": "3", "train": "RE 4711", "destination": "Frankfurt (Main) Hbf",
     "isCancelled": 0, "messages": {"delay": [{"text": "Verspätung eines vorausfahrenden Zuges", "timestamp": "2026-10-27T07:00"}], "qos": [{"text": "Verspätung eines vorausfahrenden Zuges"}]},
     "via": ["Hanau Hbf", "Offenbach Hbf"]},
    {"scheduledDeparture": "07:20", "delayDeparture": None, "platform": "1", "scheduledPlatform": "1", "train": "ICE 1576", "destination": "Hamburg", "isCancelled": 1},
    {"scheduledDeparture": "2026-10-27T07:31:00+01:00", "delayDeparture": "0", "train": "RB 15", "destination": "Gelnhausen"},
    {"scheduledDeparture": "", "train": "kaputt"}, "nonsense"]}


def test_the_departures_are_read():
    r = tr.rows(ANSWER)
    assert r[0] == {"at": "07:12", "delay": 5, "platform": "4", "planned": "3", "train": "RE 4711", "dest": "Frankfurt (Main) Hbf", "cancelled": False,
                    "notes": ["Verspätung eines vorausfahrenden Zuges"], "via": ["Hanau Hbf", "Offenbach Hbf"]}
    assert r[1]["cancelled"] is True and r[1]["delay"] is None
    assert r[2]["at"] == "07:31" and r[2]["delay"] == 0 and r[2]["platform"] == ""
    assert len(r) == 3 and tr.rows({"x": 1}) == [] and tr.rows(None) == []


def test_a_sensor_of_db_infoscreen_and_errors():
    assert tr.from_sensor({"next_departures": ANSWER["departures"][:1]})[0]["train"] == "RE 4711"
    assert tr.from_sensor(None) == []
    assert tr.error_of({"error": "Unknown station 'Fuldaa'"}) == "Unknown station 'Fuldaa'" and tr.error_of(ANSWER) == ""


def test_the_address_of_a_station():
    assert tr.url("https://dbf.finalrewind.org/", "Frankfurt (Main) Hbf") == "https://dbf.finalrewind.org/Frankfurt%20%28Main%29%20Hbf.json"
    assert tr.url(tr.DBF, "Fulda", "Hanau Hbf") == "https://dbf.finalrewind.org/Fulda.json?via=Hanau+Hbf"
    assert tr.clean_text(" Fulda/../x?\n ") == "Fulda..x" and tr.clean_text(None) == ""


def test_mein_zug_is_remembered_for_when_it_is_hours_away():
    """the service lists the next 3 hours: in the evening the card shows tomorrow's train from what was seen of it (the owner: "mache es
    so, dass ich auch immer den auch morgen sehe")"""
    r = tr.rows(ANSWER)
    assert tr.mine_of(r, "07:12") is r[0] and tr.mine_of(r, "07:05") is r[0]            # up to 10 minutes later, as mineOf in trains.js
    assert tr.mine_of(r, "06:40") is None and tr.mine_of(r, "7:12") is None and tr.mine_of(None, "07:12") is None
    seen = {}
    assert tr.remember(seen, "fulda|hanau|07:12", r[0], 1000)
    assert seen["fulda|hanau|07:12"] == {"at": "07:12", "train": "RE 4711", "dest": "Frankfurt (Main) Hbf", "platform": "3", "t": 1000}
    assert not tr.remember(seen, "fulda|hanau|07:12", r[0], 1060)                      # the same again: nothing to write
    assert tr.remember(seen, "fulda|hanau|07:12", r[0], 1000 + 86400)                  # once a day, so the oldest go first
    assert not tr.remember(seen, "fulda|hanau|07:12", None, 2000) and not tr.remember(seen, "x", {"train": "no time"}, 2000)
    for i in range(tr.SEEN_MAX + 5):
        tr.remember(seen, f"k{i}", r[1], 100000 + i)
    assert len(seen) == tr.SEEN_MAX and "fulda|hanau|07:12" not in seen and "k0" not in seen and f"k{tr.SEEN_MAX + 4}" in seen
    assert seen["k5"]["platform"] == "1" and tr.remember({}, "k", r[2], 1) and tr.remember({"k": "kaputt"}, "k", r[0], 1)
