"""🖼 Bildkarten fürs Handy (piccard.py, 5.33.0, docs/ideen-5.33 idea 1 with templates): a card's blocks are checked, sit in rows (two
side by side), fill their placeholders and values from Home Assistant and are drawn as one picture; the alarm settings pick a card per
kind, a routine's message block carries one (also as an automation of Home Assistant)."""
import datetime
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import alarmnotify as an  # noqa: E402
import flows as fl  # noqa: E402
import haflows as hf  # noqa: E402
import piccard as pc  # noqa: E402

FLOOR = {"id": "eg", "name": "Erdgeschoss", "kind": "floor",
         "rooms": [{"id": "r1", "name": "Waschküche", "points": [[0, 0], [5, 0], [5, 3], [0, 3]]},
                   {"id": "r2", "name": "Küche", "points": [[5, 0], [9, 0], [9, 3], [5, 3]]}],
         "walls": [{"a": [0, 0], "b": [9, 0], "thickness": 0.2, "openings": [{"type": "window", "pos": 7, "width": 1, "entity": "binary_sensor.fenster_kueche", "name": "Küchenfenster"}]},
                   {"a": [0, 3], "b": [9, 3], "thickness": 0.2}],
         "devices": [{"x": 1, "z": 1, "entity": "binary_sensor.wasser", "name": "Wassermelder"},
                     {"x": 1.5, "z": 1, "entity": "sensor.wk_temp"}, {"x": 1.6, "z": 1, "entity": "sensor.wk_hum"},
                     {"x": 7, "z": 2, "entity": "light.kueche", "name": "Küchenlicht"}, {"x": 7.5, "z": 2, "entity": "climate.kueche"}]}
PLACE = {"house": "Haus", "floor": FLOOR, "room": FLOOR["rooms"][0], "x": 1.0, "z": 1.0}
STATES = {"sensor.wk_temp": {"entity_id": "sensor.wk_temp", "state": "17.46", "attributes": {"device_class": "temperature", "unit_of_measurement": "°C"}},
          "sensor.wk_hum": {"entity_id": "sensor.wk_hum", "state": "81", "attributes": {"device_class": "humidity", "unit_of_measurement": "%"}},
          "binary_sensor.fenster_kueche": {"state": "on"}, "light.kueche": {"state": "on"},
          "climate.kueche": {"state": "heat", "attributes": {"current_temperature": 21.5}},
          "person.anna": {"entity_id": "person.anna", "state": "home", "attributes": {"friendly_name": "Anna"}},
          "person.ben": {"entity_id": "person.ben", "state": "not_home", "attributes": {"friendly_name": "Ben"}},
          "weather.home": {"state": "partlycloudy", "attributes": {"temperature": 4.0}}, "alarm_control_panel.haus": {"state": "armed_away"}}
NOW = datetime.datetime(2026, 11, 23, 7, 41)


def ctx(**kw):
    return {"kind": "water", "name": "Wassermelder", "text": "Wasser!", "place": PLACE, "floors": [FLOOR], "house": "Haus", "states": STATES,
            "lang": "de", "now": NOW, "since": NOW, "camera": None, "camera_name": "", "preview": False, **kw}


def test_blocks_are_checked():
    assert pc.clean_block({"k": "head"}) == {"k": "head", "text": "{kind}", "clock": True}
    assert pc.clean_block({"k": "head", "half": True})["k"] == "head" and "half" not in pc.clean_block({"k": "head", "half": True})
    assert pc.clean_block({"k": "plan", "show": "x", "marks": 1, "half": True}) == {"k": "plan", "show": "floor", "marks": False, "half": True}
    assert pc.clean_block({"k": "camera", "ent": "light.x"}) == {"k": "camera", "ent": ""}
    assert pc.clean_block({"k": "camera", "ent": "camera.flur"}) == {"k": "camera", "ent": "camera.flur"}
    assert pc.clean_block({"k": "info", "rows": ["temp", "x", "temp", "who"]}) == {"k": "info", "rows": ["temp", "who"]}
    assert pc.clean_block({"k": "values", "ents": ["sensor.a", "bad", "sensor.a"]}) == {"k": "values", "ents": ["sensor.a"]}
    assert len(pc.clean_block({"k": "text", "text": "x" * 500})["text"]) == 200
    assert pc.clean_block({"k": "nope"}) is None and pc.clean_block("x") is None


def test_cards_are_checked():
    cards = pc.clean_cards([{"id": "a", "name": "Eins", "color": "#ABCDEF", "theme": "dark", "width": "wide", "blocks": [{"k": "foot"}, {"k": "x"}]},
                            {"id": "a", "name": "doppelt"}, {"id": "Bad Id!", "color": "red"}, "junk"])
    assert cards[0] == {"id": "a", "name": "Eins", "color": "#abcdef", "theme": "dark", "width": "wide", "blocks": [{"k": "foot"}]}
    assert len(cards) == 2 and cards[1]["id"] == "k3" and cards[1]["color"] == "#d63c31" and cards[1]["theme"] == "light"
    assert len(pc.clean_cards([{"id": f"c{i}"} for i in range(30)])) == pc.MAX_CARDS
    assert pc.clean_cards(None) == []


def test_the_cards_a_house_starts_with():
    """the pictures 6 to 8 of docs/ideen-5.33; the one with the big camera is "Test 1" (the owner's wish, not his own name)"""
    d = pc.defaults("de")
    assert [c["name"] for c in d] == ["Wasser-Alarm", "Test 1", "Gute Nacht"] and pc.clean_cards(d) == d
    assert [c["name"] for c in pc.defaults("en")][0] == "Water alarm" and pc.defaults("xx")[0]["name"] == "Water alarm"


def test_rows_two_side_by_side():
    bl = [{"k": "head"}, {"k": "camera", "half": True}, {"k": "info"}, {"k": "plan", "half": True}, {"k": "foot"}, {"k": "text", "half": True}]
    assert [[b["k"] for b in r] for r in pc.rows_of(bl)] == [["head"], ["camera", "info"], ["plan"], ["foot"], ["text"]]


def test_placeholders():
    assert pc.fill("{kind} in {raum} ({etage}) {name} {zeit} {x}", ctx()) == "WASSER in Waschküche (Erdgeschoss) Wassermelder 07:41 {x}"
    assert pc.fill("{kind}", ctx(kind="flow", title="Gute Nacht")) == "Gute Nacht"
    assert pc.fill("{kind}", ctx(lang="en", kind="smoke")) == "SMOKE"
    assert pc.date_words(NOW, "de") == "Montag, 23. November" and pc.date_words(NOW, "en") == "Monday, 23 November"


def test_the_rows_of_information():
    c = ctx()
    assert pc.row_value("sensor", c) == "Wassermelder" and pc.row_value("since", c) == "07:41 Uhr"
    assert pc.row_value("room", c) == "Waschküche · Erdgeschoss"
    assert pc.row_value("temp", c) == "17,5 °C" and pc.row_value("hum", c) == "81 %"
    assert pc.row_value("temp", ctx(lang="en")) == "17.5 °C"
    assert pc.row_value("open", c) == "Küchenfenster" and pc.row_value("lights", c) == "Küchenlicht"
    assert pc.row_value("who", c) == "Anna" and pc.row_value("weather", c) == "4 °C · teils bewölkt" and pc.row_value("alarm", c) == "scharf"
    quiet = ctx(states={"person.ben": {"state": "not_home"}})
    assert pc.row_value("open", quiet) == "alles zu" and pc.row_value("lights", quiet) == "alles aus" and pc.row_value("who", quiet) == "niemand"
    assert pc.row_value("weather", quiet) == "" and pc.row_value("alarm", quiet) == "" and pc.row_value("temp", quiet) == ""
    kitchen = ctx(place={**PLACE, "room": FLOOR["rooms"][1], "x": 7, "z": 2})
    assert pc.row_value("temp", kitchen) == "21,5 °C"                                 # a thermostat's own temperature


def png_size(data):
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    return im.size


def test_drawn_as_one_picture():
    for card in pc.defaults("de"):
        w, h = png_size(pc.render(card, ctx(preview=True)))
        assert w == 960 and 300 < h < 2000, (card["name"], w, h)
    wide = {**pc.defaults("de")[0], "width": "wide"}
    assert png_size(pc.render(wide, ctx()))[0] == 1280
    # no camera in the room: left out when sent, shown as missing in the editor
    cam = {"id": "c", "name": "Kamera", "blocks": [{"k": "camera"}, {"k": "foot"}]}
    assert png_size(pc.render(cam, ctx()))[1] < png_size(pc.render(cam, ctx(preview=True)))[1]
    # with a camera picture, in the language of the messages, without a place (a routine that runs at a time)
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (64, 48), (90, 90, 90)).save(buf, "JPEG")
    full = {"id": "f", "name": "Alles", "theme": "dark", "blocks": [{"k": k} for k in pc.KINDS] + [{"k": "values", "ents": ["sensor.wk_temp", "light.kueche"]}]}
    for lang in pc.WORDS:
        assert png_size(pc.render(full, ctx(lang=lang, camera=buf.getvalue(), camera_name="Flur", place=None, kind="flow", title="Abend")))[0] == 960
    assert png_size(pc.render({"blocks": []}, ctx()))[0] == 960                                         # nothing: a heading
    assert png_size(pc.render({"blocks": [{"k": "plan", "marks": True}]}, ctx(floors=[], place=None)))[1] > 0   # no house: no plan


def test_an_alarm_of_a_kind_with_a_card():
    c = an.clean({"cards": {"water": "wasser", "smoke": "", "gas": "Bad!", "x": "a"}}, {})
    assert c["cards"] == {"water": "wasser"} and an.public(c)["cards"] == {"water": "wasser"}
    assert an.clean({}, c)["cards"] == {"water": "wasser"} and an.clean({"cards": {}}, c)["cards"] == {}
    assert "bottoken" in an.BACKUP_SECRETS                                           # the bot's key only in a backup with the keys


def test_a_routine_sends_a_card():
    f = fl.clean_flows([{"id": "f_t", "name": "Tür", "lanes": [{"id": "l1", "blocks": [
        {"k": "state", "ents": ["binary_sensor.tuer"], "to": "open"}, {"k": "notify", "text": "Tür {name}", "card": "test1"},
        {"k": "notify", "text": "ohne", "card": "Bad Id!"}]}]}])[0]
    blocks = f["lanes"][0]["blocks"]
    assert blocks[1] == {"k": "notify", "text": "Tür {name}", "card": "test1"} and "card" not in blocks[2]
    run = {"ent": "binary_sensor.tuer"}
    c = {"names": {"binary_sensor.tuer": "Haustür"}, "room_names": {}, "room_of": lambda e: None, "in_room": lambda r, d: [], "states": {}}
    calls = fl.action_calls(blocks[1], run, c, {})
    assert calls[0][0] == "notify" and calls[0][2]["card"] == "test1" and calls[0][2]["ent"] == "binary_sensor.tuer"
    assert "card" not in fl.action_calls(blocks[2], run, c, {})[0][2]
    rooms = [{"key": "main/f", "name": "Flur", "entities": [], "windows": [], "doors": ["binary_sensor.tuer"]}]
    out = hf.compile_flow({**f, "ha": True}, hf.context(rooms, {}))
    ev = next(s for s in out["autos"][0]["actions"] if s.get("event") == "fp3d_notify")
    assert ev["event_data"]["card"] == "test1" and "trigger.entity_id" in ev["event_data"]["entity"]
