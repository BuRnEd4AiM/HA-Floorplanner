"""🩺 Wer steuert was (heatlog.py, #579): the journal of the heating rules: which contacts and thermostats belong to a room, a window
opening (and a door between two rooms that does not count), a thermostat changed by the add-on itself, an automation, somebody in Home
Assistant or the device, what a room's rules do, the connection, and what the page gets."""
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import heatlog as hl  # noqa: E402

ROOMS = [{"key": "h/wz", "house": "h", "id": "wz", "name": "Wohnzimmer", "floor": 0, "climates": ["climate.wz"], "windows": ["binary_sensor.fenster"],
          "doors": ["binary_sensor.terrasse", "binary_sensor.flurtuer"], "outer": ["binary_sensor.terrasse"], "entities": ["climate.wz"]},
         {"key": "h/flur", "house": "h", "id": "flur", "name": "Flur", "floor": 0, "climates": [], "windows": [], "doors": ["binary_sensor.flurtuer"],
          "outer": [], "entities": []},
         {"key": "h/abstell", "house": "h", "id": "abstell", "name": "Abstellraum", "floor": 0, "climates": [], "windows": [], "doors": [], "outer": [],
          "entities": []}]


def climate(state="heat", temp=21.0, **ctx):
    return {"state": state, "attributes": {"temperature": temp, "hvac_modes": ["off", "heat"], "friendly_name": "Heizung WZ"}, "context": ctx}


def test_the_contacts_and_thermostats_of_every_room():
    idx = hl.index(ROOMS)
    assert idx["binary_sensor.fenster"] == [["h/wz", "window"]] and idx["binary_sensor.terrasse"] == [["h/wz", "outer"]]
    assert idx["binary_sensor.flurtuer"] == [["h/wz", "inner"], ["h/flur", "inner"]] and idx["climate.wz"] == [["h/wz", "climate"]]
    assert hl.inner(ROOMS[0]) == ["binary_sensor.flurtuer"]


def test_a_window_opens_and_a_door_between_two_rooms_is_seen_too():
    idx = hl.index(ROOMS)
    rooms, on = {r["key"]: r for r in ROOMS}, {"on": True, "delay": 2, "doors": True, "skip": []}
    x = hl.contact("binary_sensor.fenster", {"state": "off"}, {"state": "on"}, idx["binary_sensor.fenster"], 100.4, rooms, on)
    assert x == {"t": 100, "k": "contact", "ent": "binary_sensor.fenster", "s": "on", "was": "off", "rooms": [["h/wz", "window", None]]}
    door = hl.contact("binary_sensor.flurtuer", None, {"state": "on"}, idx["binary_sensor.flurtuer"], 1, rooms, on)
    assert door["rooms"] == [["h/wz", "inner", "inner"], ["h/flur", "inner", "inner"]]          # a door between two rooms: not counted
    assert hl.contact("binary_sensor.terrasse", None, {"state": "on"}, idx["binary_sensor.terrasse"], 1)["rooms"] == [["h/wz", "outer", None]]
    assert hl.why_not("h/wz", "outer", rooms, {**on, "doors": False}) == "doors" and hl.why_not("h/wz", "window", rooms, {**on, "on": False}) == "off"
    assert hl.why_not("h/wz", "window", rooms, {**on, "skip": ["h/wz"]}) == "skip" and hl.why_not("h/flur", "window", rooms, on) == "noclimate"
    assert hl.contact("binary_sensor.fenster", {"state": "on"}, {"state": "on"}, idx["binary_sensor.fenster"], 1) is None   # only its name
    assert hl.contact("climate.wz", climate(), climate("off"), idx["climate.wz"], 1) is None


def test_who_changed_a_thermostat():
    """the owner: "manchmal … von selbst gedreht … er selbst und er weiß es irgendwie nicht": the add-on knows what it sent"""
    sent = {}
    hl.remember(sent, "climate.wz", "set_temperature", {"temperature": 21.0}, 1000)
    hl.remember(sent, "climate.wz", "set_hvac_mode", {"hvac_mode": "off"}, 1000)
    hl.remember(sent, "climate.wz", "turn_on", {}, 1000)
    assert [x[0] for x in sent["climate.wz"]] == ["temp", "mode"]
    x = hl.climate("climate.wz", climate(temp=18.0), climate(temp=21.0), sent, 1100, "h/wz")
    assert x == {"t": 1100, "k": "climate", "ent": "climate.wz", "room": "h/wz", "mode": None, "temp": [18.0, 21.0], "by": "addon", "ago": 100}
    assert hl.climate("climate.wz", climate(), climate("off"), sent, 1100)["by"] == "addon"
    assert hl.climate("climate.wz", climate(temp=18.0), climate(temp=21.0), sent, 1000 + hl.OWN + 1)["by"] == "device"    # long ago
    assert hl.climate("climate.wz", climate(temp=18.0), climate(temp=23.0), sent, 1100)["by"] == "device"                 # at the thermostat
    assert hl.climate("climate.wz", climate(temp=18.0), climate(temp=23.0, parent_id="p1"), sent, 1100)["by"] == "auto"   # an automation
    people = {"u1": "Anna"}
    x = hl.climate("climate.wz", climate(temp=18.0), climate(temp=23.0, user_id="u1"), sent, 1100, people=lambda: people)
    assert x["by"] == "user" and x["who"] == "Anna"
    assert hl.climate("climate.wz", climate(temp=18.0), climate(temp=23.0, user_id="me"), sent, 1100, me="me")["by"] == "addon"
    assert hl.climate("climate.wz", climate(temp=21.0), climate(temp=21.0), sent, 1100) is None   # only what it measures changed
    assert hl.users({"person.anna": {"state": "home", "attributes": {"user_id": "u1", "friendly_name": "Anna"}}, "light.x": {}}) == {"u1": "Anna"}


def test_what_a_rooms_rules_do_and_when_it_changes():
    a = {"h/wz": {"why": "schedule", "level": "comfort", "temp": 21.0, "waiting": False, "skip": False, "stuck": False, "hand": None, "sent": None}}
    first = hl.rooms({}, a, 10)
    assert first[0]["first"] and first[0]["why"] == "schedule"
    assert hl.rooms(a, a, 20) == []
    b = {"h/wz": {**a["h/wz"], "hand": 1600}}
    assert hl.rooms(a, b, 30)[0]["hand"] == 1600 and "was" not in hl.rooms(a, b, 30)[0]
    assert hl.rooms(b, {"h/wz": {**b["h/wz"], "hand": 1700}}, 40) == []    # turned again: still by hand
    c = {"h/wz": {**a["h/wz"], "why": "window", "level": None, "temp": None}}
    assert hl.rooms(a, c, 50)[0]["was"] == "schedule"


def test_the_journal_keeps_the_last_entries_and_the_connection_once():
    tr = []
    assert hl.add(tr, [{"t": 1, "k": "rule"}, {"x": 1}, None]) and len(tr) == 1
    hl.add(tr, [{"t": i, "k": "rule"} for i in range(hl.MAX + 5)])
    assert len(tr) == hl.MAX and tr[-1]["t"] == hl.MAX + 4
    tr = [{"t": 0, "k": "start", "v": "4.39.0"}]
    assert hl.link(tr, True, 1) and not hl.link(tr, True, 2)                # up once
    assert hl.link(tr, False, 3, "ConnectionError: closed")
    assert hl.link(tr, True, 4)
    assert hl.link(tr, False, 5, "ConnectionError: closed", quick=True)     # up and down again at once: counted
    assert [x["k"] + str(x.get("on")) for x in tr] == ["startNone", "linkTrue", "linkFalse"] and tr[-1]["n"] == 2 and tr[-1]["t2"] == 5
    assert hl.link(tr, False, 6, "ConnectionError: closed") and tr[-1]["n"] == 3
    assert hl.link(tr, False, 7, "TimeoutError: ") and tr[-1]["err"] == "TimeoutError:" and len(tr) == 4
    tr.append({"t": 8, "k": "start"})
    assert hl.link(tr, True, 9) and tr[-1]["on"]                            # the add-on started again


def test_what_the_page_gets():
    lc = datetime.datetime(2026, 10, 28, 17, 0, tzinfo=datetime.timezone.utc)
    states = {"climate.wz": {**climate(), "last_changed": lc.isoformat()}, "binary_sensor.fenster": {"state": "on", "attributes": {"friendly_name": "Fenster"}},
              "climate.keller": climate(), "sensor.wz": {"state": "20.5", "attributes": {}}}
    v = hl.view(ROOMS, states, [{"t": 1, "k": "rule"}], {"climate.wz": {"s": "sensor.wz", "way": "auto"}})
    assert [r["key"] for r in v["rooms"]] == ["h/wz", "h/flur"]             # the store room has nothing for the heating
    assert v["rooms"][0]["inner"] == ["binary_sensor.flurtuer"] and v["loose"] == ["climate.keller"]
    assert v["states"]["climate.wz"] == {"s": "heat", "n": "Heizung WZ", "t": 21.0, "m": ["off", "heat"], "lc": round(lc.timestamp())}
    assert v["states"]["binary_sensor.fenster"] == {"s": "on", "n": "Fenster"} and v["states"]["binary_sensor.terrasse"] is None
    assert v["states"]["sensor.wz"]["s"] == "20.5" and v["trace"] == [{"t": 1, "k": "rule"}]


def test_a_door_with_the_switch_is_counted_not_inner():
    room = {"key": "h/bad", "house": "h", "name": "Bad", "floor": 0, "climates": ["climate.bad"], "windows": [], "doors": ["binary_sensor.badtuer"],
            "outer": [], "counted": ["binary_sensor.badtuer"]}
    assert hl.index([room])["binary_sensor.badtuer"] == [["h/bad", "counted"]] and hl.inner(room) == []
    on = {"on": True, "doors": False, "skip": []}
    assert hl.why_not("h/bad", "counted", {"h/bad": room}, on) is None                 # counts, also with doors to the outside off
    assert hl.view([room], {}, [])["rooms"][0]["counted"] == ["binary_sensor.badtuer"]
