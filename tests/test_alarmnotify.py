"""A message when something goes off (alarmnotify.py, #414): the settings, which state change is a message, its text and where it is."""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import alarmnotify as an  # noqa: E402


def st(eid, state, dc=None, name=None):
    attrs = {**({"device_class": dc} if dc else {}), **({"friendly_name": name} if name else {})}
    return {"entity_id": eid, "state": state, "attributes": attrs}


def test_settings_are_cleaned_and_the_key_stays_in_the_add_on():
    c = an.clean({"on": True, "via": "whatsapp", "phone": "+49 170 / 123-4567", "apikey": "123456", "kinds": ["smoke", "bogus", "alarm"], "clear": True})
    assert c == {"on": True, "kinds": ["alarm", "smoke"], "via": "whatsapp", "phone": "+491701234567", "services": [], "entities": [], "tgMode": "user",
                 "tgUsers": [], "clear": True, "apikey": "123456", "tgkey": ""}
    assert an.public(c) == {"on": True, "kinds": ["alarm", "smoke"], "via": "whatsapp", "phone": "+491701234567", "services": [], "entities": [],
                            "tgMode": "user", "tgUsers": [], "clear": True, "hasKey": True, "hasTgKey": False}
    kept = an.clean({"phone": "+491701234567"}, c)
    assert kept["apikey"] == "123456" and kept["on"] is True              # a save without the key keeps it
    assert an.clean({"apikey": ""}, c)["apikey"] == ""                    # "" removes it
    assert an.clean({"apikey": None}, c)["apikey"] == ""
    assert an.clean({"apikey": "a b<script>"}, c)["apikey"] == "123456"   # junk is not taken
    assert an.clean({"service": "notify.mobile_app_pixel"})["services"] == ["mobile_app_pixel"]          # one service as before 4.0.3
    assert an.clean({"service": "../evil"})["services"] == []
    assert an.clean({}, {"service": "whatsapp"})["services"] == ["whatsapp"]                            # an old file: its one service is kept
    assert an.clean({"phone": "abc"})["phone"] == ""
    assert an.clean({"via": "sms"})["via"] == "whatsapp"
    assert an.clean("junk") == {**an.DEFAULT, "apikey": "", "tgkey": ""}


def test_several_services_and_telegram_by_callmebot():
    """#456: notify services picked from Home Assistant's list (several); Telegram to users or into a group with the group's key"""
    assert an.clean({"services": ["notify.telegram_familie", "mobile_app_pixel", "telegram_familie", "bad name", 7]})["services"] == ["telegram_familie", "mobile_app_pixel"]
    assert an.clean({"services": "a, b c|a"})["services"] == ["a", "b", "c"]
    assert an.clean({"services": [f"s{i}" for i in range(20)]})["services"] == [f"s{i}" for i in range(10)]
    c = an.clean({"via": "telegram", "tgMode": "group", "tgkey": "AbC-123_x", "tgUsers": "flo_weber, @anna_m |+491701234567 x <b>"})
    assert c["via"] == "telegram" and c["tgMode"] == "group" and c["tgkey"] == "AbC-123_x" and c["tgUsers"] == ["@flo_weber", "@anna_m", "+491701234567"]
    assert an.public(c)["hasTgKey"] is True and "tgkey" not in an.public(c)
    assert an.clean({"tgUsers": []}, c)["tgkey"] == "AbC-123_x"                                         # a save without the key keeps it
    assert an.clean({"tgkey": ""}, c)["tgkey"] == "" and an.clean({"tgMode": "bot"}, c)["tgMode"] == "group"


def test_notify_entities_and_where_each_target_comes_from():
    """#460: notify entities (set up in Home Assistant's UI, e.g. one per chat of its Telegram bot) can be ticked too; the list says where
    each one comes from: the phone app, an integration (with its name from the entity registry) or the old way (configuration.yaml)"""
    c = an.clean({"via": "ha", "entities": ["notify.telegram_bot_familie", "notify.telegram_bot_familie", "light.flur", "notify.Böse", 5]})
    assert c["entities"] == ["notify.telegram_bot_familie"]
    assert an.clean({"services": []}, c)["entities"] == ["notify.telegram_bot_familie"]                 # a save without them keeps them
    assert an.clean({"entities": [f"notify.c{i}" for i in range(20)]})["entities"] == [f"notify.c{i}" for i in range(10)]
    assert an.ready({"on": True, "via": "ha", "services": [], "entities": ["notify.telegram_bot_familie"]}) is None
    services = [{"domain": "light", "services": {"turn_on": {}}},
                {"domain": "notify", "services": {"telegram_alt": {}, "mobile_app_pixel": {}, "send_message": {}, "persistent_notification": {}, "bad name": {}}}]
    states = [st("notify.telegram_bot_familie", "unknown", name="Familie"), st("notify.signal_flo", "unknown"), st("light.flur", "on"), "junk"]
    registry = [{"entity_id": "notify.telegram_bot_familie", "platform": "telegram_bot"}, {"entity_id": "light.flur", "platform": "hue"}, None]
    assert an.notify_targets(services, states, registry) == [
        {"id": "mobile_app_pixel", "name": "mobile_app_pixel", "origin": "app", "platform": ""},
        {"id": "notify.telegram_bot_familie", "name": "Familie", "origin": "integration", "platform": "telegram_bot"},
        {"id": "notify.signal_flo", "name": "notify.signal_flo", "origin": "integration", "platform": ""},
        {"id": "telegram_alt", "name": "telegram_alt", "origin": "yaml", "platform": ""}]
    assert an.notify_targets(None, None, None) == [] and an.notify_targets("junk", [], []) == []


def test_callmebot_answer():
    assert an.callmebot_failed(200, "<p>Message queued. You will receive it in a few seconds.</p>", "Hi") is None
    assert "APIKey is invalid" in an.callmebot_failed(200, "<p>APIKey is invalid. You need to get a new one.</p>", "Hi")
    assert an.callmebot_failed(200, "<p>User @flo has not authorized CallMeBot</p>", "Hi")
    assert an.callmebot_failed(200, "Sent to @flo: error 12", "x")
    assert an.callmebot_failed(500, "oops", "x").startswith("CallMeBot (500)")
    assert an.callmebot_failed(200, "<b>Text sent: Rauch wrong?</b>", "Rauch wrong?") is None                # the message itself does not count


def test_ready_says_what_is_missing():
    assert an.ready({"on": False}) == "off"
    assert an.ready({"on": True, "via": "whatsapp", "phone": "", "apikey": "1"}) == "phone"
    assert an.ready({"on": True, "via": "whatsapp", "phone": "+491", "apikey": ""}) == "apikey"
    assert an.ready({"on": True, "via": "whatsapp", "phone": "+491", "apikey": "1"}) is None
    assert an.ready({"on": True, "via": "ha", "services": []}) == "service"
    assert an.ready({"on": True, "via": "ha", "services": ["whatsapp"]}) is None
    assert an.ready({"on": True, "via": "telegram", "tgMode": "user", "tgUsers": []}) == "tguser"
    assert an.ready({"on": True, "via": "telegram", "tgMode": "user", "tgUsers": ["@flo_weber"]}) is None
    assert an.ready({"on": True, "via": "telegram", "tgMode": "group", "tgUsers": ["@flo_weber"], "tgkey": ""}) == "tgkey"
    assert an.ready({"on": True, "via": "telegram", "tgMode": "group", "tgkey": "k"}) is None


def test_what_goes_off():
    assert an.kind_of(st("alarm_control_panel.haus", "triggered")) == "alarm"
    assert an.kind_of(st("alarm_control_panel.haus", "pending")) is None          # the entry delay: not yet
    assert an.kind_of(st("alarm_control_panel.haus", "armed_away")) is None
    assert an.kind_of(st("binary_sensor.rauch", "on", "smoke")) == "smoke"
    assert an.kind_of(st("binary_sensor.gas", "on", "gas")) == "gas"
    assert an.kind_of(st("binary_sensor.co", "on", "carbon_monoxide")) == "co"
    assert an.kind_of(st("binary_sensor.keller", "on", "moisture")) == "water"
    assert an.kind_of(st("binary_sensor.rauch", "off", "smoke")) is None
    assert an.kind_of(st("binary_sensor.tuer", "on", "door")) is None
    assert an.kind_of(st("sensor.rauch", "on", "smoke")) is None
    assert an.kind_of(None) is None


def test_watcher_sends_once_with_a_pause_and_not_what_was_going_off_at_start():
    w = an.Watcher(cooldown=600)
    w.snapshot([st("binary_sensor.keller", "on", "moisture"), st("binary_sensor.rauch", "off", "smoke")])
    assert w.change("binary_sensor.keller", st("binary_sensor.keller", "on", "moisture"), 10) == []       # already going off at connect
    assert w.change("binary_sensor.rauch", st("binary_sensor.rauch", "on", "smoke", "Rauchmelder Küche"), 20) == [("start", "smoke", "binary_sensor.rauch", "Rauchmelder Küche")]
    assert w.change("binary_sensor.rauch", st("binary_sensor.rauch", "on", "smoke"), 25) == []           # still on: no second message
    assert w.change("binary_sensor.rauch", st("binary_sensor.rauch", "off", "smoke"), 30) == []          # back to normal: only when asked for
    assert w.change("binary_sensor.rauch", st("binary_sensor.rauch", "on", "smoke"), 100) == []          # again within the pause
    w.change("binary_sensor.rauch", st("binary_sensor.rauch", "off", "smoke"), 110)
    assert w.change("binary_sensor.rauch", st("binary_sensor.rauch", "on", "smoke"), 700)[0][0] == "start"   # after the pause


def test_watcher_back_to_normal_kinds_and_the_burst_limit():
    w = an.Watcher(cooldown=0)
    w.change("alarm_control_panel.haus", st("alarm_control_panel.haus", "triggered", name="Alarm"), 1, clear=True)
    assert w.change("alarm_control_panel.haus", st("alarm_control_panel.haus", "disarmed", name="Alarm"), 2, clear=True) == [("clear", "alarm", "alarm_control_panel.haus", "Alarm")]
    w.change("binary_sensor.rauch", st("binary_sensor.rauch", "on", "smoke"), 3, clear=True)
    assert w.change("binary_sensor.rauch", st("binary_sensor.rauch", "unavailable", "smoke"), 4, clear=True) == []   # gone is no "back to normal"
    assert w.change("binary_sensor.gas", st("binary_sensor.gas", "on", "gas"), 5, kinds=["smoke"]) == []             # gas not chosen
    b = an.Watcher(cooldown=0, burst=3, window=600)
    sent = 0
    for i in range(10):                           # a flapping sensor
        sent += len(b.change("binary_sensor.x", st("binary_sensor.x", "on", "smoke"), 10 + 2 * i))
        b.change("binary_sensor.x", st("binary_sensor.x", "off", "smoke"), 11 + 2 * i)
    assert sent == 3
    assert len(b.change("binary_sensor.x", st("binary_sensor.x", "on", "smoke"), 1000)) == 1   # later again


def test_where_and_the_text():
    lay = {"floors": [{"name": "Erdgeschoss", "rooms": [{"name": "Küche", "points": [[0, 0], [4, 0], [4, 3], [0, 3]]}],
                       "devices": [{"type": "smoke", "x": 2, "z": 1, "entity": "binary_sensor.rauch"}, {"type": "smoke", "x": 9, "z": 9, "entity": "binary_sensor.flur"}]}]}
    assert an.where_of([("Haus", lay)], "binary_sensor.rauch") == "Erdgeschoss · Küche"
    assert an.where_of([("Haus", lay), ("Garten", {})], "binary_sensor.rauch") == "Haus · Erdgeschoss · Küche"   # several houses: the house too
    assert an.where_of([("Haus", lay)], "binary_sensor.flur") == "Erdgeschoss"                                   # in no room
    assert an.where_of([("Haus", lay)], "binary_sensor.nirgends") == ""
    lay["floors"][0]["walls"] = [{"a": [0, 3], "b": [4, 3], "openings": [{"type": "door", "pos": 2, "entity": "binary_sensor.tuer"},
                                                                     {"type": "window", "pos": 1, "paneEntities": ["binary_sensor.fluegel"]}]}]
    assert an.where_of([("Haus", lay)], "binary_sensor.tuer") == "Erdgeschoss · Küche"                          # a door contact (#456): the room beside it
    assert an.where_of([("Haus", lay)], "binary_sensor.fluegel") == "Erdgeschoss · Küche"                       # ... or one pane's contact
    assert an.text("start", "smoke", "Rauchmelder", "Erdgeschoss · Küche", "de", "17.10. 18:22") == "🔥 Rauch erkannt: Rauchmelder\nErdgeschoss · Küche · 17.10. 18:22"
    assert an.text("start", "alarm", "Alarm", lang="en") == "🚨 ALARM: Alarm"
    assert an.text("clear", "water", "Keller", lang="xx").startswith("✅ Back to normal")
    assert all(set(t) == set(an.TEXTS["de"]) for t in an.TEXTS.values())
    assert "3D Floorplan" in an.test_text("de")


class FakeWs:
    """a websocket that hands out the given messages, then waits"""
    def __init__(self, msgs):
        self.msgs, self.sent = list(msgs), []

    async def send_json(self, m):
        self.sent.append(m)

    async def receive(self):
        if self.msgs:
            return type("M", (), {"type": 1, "data": json.dumps(self.msgs.pop(0))})()
        await asyncio.sleep(3600)


def test_run_watch_sends_what_goes_off():
    ws = FakeWs([{"id": 2, "type": "result", "success": True, "result": [st("binary_sensor.rauch", "off", "smoke")]},
                 {"type": "event", "event": {"data": {"entity_id": "binary_sensor.rauch", "new_state": st("binary_sensor.rauch", "on", "smoke", "Rauch Küche")}}},
                 {"type": "event", "event": {"data": {"entity_id": "light.x", "new_state": st("light.x", "on")}}}])

    class Conn:
        async def __aenter__(self):
            return ws

        async def __aexit__(self, *a):
            return False

    out = []

    async def send(msg):
        out.append(msg)
        return True, None

    async def go():
        cfg = {**an.DEFAULT, "on": True, "phone": "+491", "apikey": "k"}
        t = asyncio.create_task(an.run_watch(connect=Conn, config=lambda: cfg, send=send, lang=lambda: "de", clock=lambda: "18:22", check=0.05))
        for _ in range(100):
            await asyncio.sleep(0.02)
            if out:
                break
        t.cancel()
    asyncio.run(go())
    assert out == ["🔥 Rauch erkannt: Rauch Küche\n18:22"]
    assert ws.sent[0] == {"id": 1, "type": "subscribe_events", "event_type": "state_changed"}
