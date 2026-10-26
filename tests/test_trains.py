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
