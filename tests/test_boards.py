"""boards.py (#484): own pages, the order of the tab bar, the layout of a page with own cards, the history of a card "Verlauf"; the
same rules as static/tabs.js, static/pagelayout.js and static/cards.js."""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import boards  # noqa: E402
import server  # noqa: E402

STATIC = Path(server.__file__).parent / "static"


def js_list(src, name):
    block = src[src.index(f"export const {name} = ["):]
    return re.findall(r"'([^']+)'", block[:block.index("];")])


def test_the_lists_match_the_browser():
    cards = (STATIC / "cards.js").read_text()
    assert tuple(js_list(cards, "CARD_TYPES")) == boards.CARD_TYPES
    assert tuple(js_list(cards, "BUILTINS")) == boards.BUILTINS
    assert tuple(js_list(cards, "COLORS")) == boards.COLORS
    hours = re.search(r"export const HOURS = \[([^\]]+)\]", cards).group(1)
    assert tuple(int(x) for x in hours.split(",")) == boards.HOURS
    block = cards[cards.index("export const TYPE_DOMAINS = {"):cards.index("};", cards.index("export const TYPE_DOMAINS = {"))]
    js = {k: (None if v.strip() == "null" else tuple(re.findall(r"'([^']+)'", v))) for k, v in re.findall(r"(\w+): (\[[^\]]*\]|null)", block)}
    assert js == boards.TYPE_DOMAINS
    assert boards.TABS == server.TABS
    assert tuple(js_list((STATIC / "thermostat.js").read_text(), "SIZES")) == boards.SIZES
    assert "p_[a-z0-9]{3,16}" in (STATIC / "tabs.js").read_text() and "c_[a-z0-9]{3,16}" in cards


def test_own_pages_and_the_order_of_the_bar():
    tabs = boards.clean_custom_tabs([{"id": "p_garten", "name": "  Garten  ", "icon": "🌱"}, {"id": "p_garten", "name": "again"}, {"id": "bad"},
                                     {"id": "p_pool", "name": "", "icon": "x" * 20}, "junk"] + [{"id": f"p_s{i:03d}", "name": "n"} for i in range(20)])
    assert tabs[0] == {"id": "p_garten", "name": "Garten", "icon": "🌱"} and tabs[1] == {"id": "p_pool", "name": "?", "icon": "⭐"}
    assert len(tabs) == boards.MAX_CUSTOM
    assert boards.clean_tab_order(["family", "house", "p_garten", "family", "bogus", 5]) == ["family", "p_garten"]
    assert boards.clean_custom_tabs(None) == [] and boards.clean_tab_order("x") == []


def test_cards_are_checked_by_their_kind():
    ok = lambda c: boards.clean_card({"id": "c_abc123", **c})
    assert ok({"type": "switch", "entity": "switch.pumpe", "name": " Pumpe ", "width": 9}) == {"id": "c_abc123", "type": "switch", "name": "Pumpe", "width": 1, "entity": "switch.pumpe"}
    assert ok({"type": "switch", "entity": "sensor.x"}) is None                       # a sensor cannot be switched
    assert ok({"type": "graph", "entity": "sensor.t", "hours": 168, "color": "red"})["hours"] == 168
    assert ok({"type": "graph", "entity": "sensor.t", "hours": 5})["hours"] == 24 and ok({"type": "graph", "entity": "sensor.t"})["width"] == 2
    assert ok({"type": "value", "entity": "binary_sensor.door", "color": "pink"})["color"] == "blue"
    assert ok({"type": "entities", "entities": ["light.a", "light.a", "bad", "sensor.b"]})["entities"] == ["light.a", "sensor.b"]
    assert ok({"type": "entities", "entities": []}) is None
    assert ok({"type": "room", "room": "r1"})["room"] == "r1" and ok({"type": "room"}) is None
    assert ok({"type": "text", "text": "Hallo\x07"})["text"] == "Hallo" and ok({"type": "text"}) is None
    assert ok({"type": "builtin", "builtin": "today:weather"})["builtin"] == "today:weather" and ok({"type": "builtin", "builtin": "x"}) is None
    assert boards.clean_card({"id": "bad", "type": "text", "text": "x"}) is None and boards.clean_card({"id": "c_abc", "type": "nope"}) is None
    assert ok({"type": "thermostat", "entity": "climate.bad", "size": "small"})["size"] == "small"                # #495: the circle big or small
    assert ok({"type": "thermostat", "entity": "climate.bad", "size": "x"})["size"] == "big" and "size" not in ok({"type": "light", "entity": "light.a"})


def test_a_page_layout():
    lay = boards.clean_layout({"order": ["clock", "clock", "c_abc", "BAD KEY"], "hidden": ["waste"], "cards": [
        {"id": "c_abc", "type": "text", "text": "x"}, {"id": "c_abc", "type": "text", "text": "y"}, {"id": "c_def", "type": "light", "entity": "switch.x"}]})
    assert lay == {"order": ["clock", "c_abc"], "hidden": ["waste"], "sizes": {}, "cards": [{"id": "c_abc", "type": "text", "name": "", "width": 2, "text": "x"}]}
    sized = boards.clean_layout({"sizes": {"room:r1": "small", "room:r2": "huge", "BAD KEY": "small", "room:r3": "big"}})   # #495: a built-in card big or small
    assert sized["sizes"] == {"room:r1": "small", "room:r3": "big"}
    assert set(boards.clean_page_layouts({"climate": {"sizes": {"room:r1": "small"}}}, [])) == {"climate"}
    pages = boards.clean_page_layouts({"today": {"hidden": ["waste"]}, "house": {"hidden": ["x"]}, "p_gone": {"order": ["a"]}, "p_garten": {"order": ["a"]},
                                       "climate": {}}, [{"id": "p_garten"}])
    assert set(pages) == {"today", "p_garten"}
    assert boards.clean_page_layouts([1], []) == {}


def test_history_of_a_card():
    data = [[{"entity_id": "sensor.t", "state": "10.5", "last_changed": "2026-10-21T10:00:00+00:00"},
             {"state": "unavailable", "last_changed": "2026-10-21T10:05:00+00:00"},
             {"state": "11", "last_changed": "2026-10-21T10:10:00Z"}]]
    from datetime import datetime, timezone
    ms = lambda m: int(datetime(2026, 10, 21, 10, m, tzinfo=timezone.utc).timestamp() * 1000)
    assert boards.slim_history(data, "sensor.t") == [[ms(0), 10.5], [ms(10), 11.0]]
    assert boards.slim_history([[{"entity_id": "sensor.other", "state": "1", "last_changed": "2026-10-21T10:00:00+00:00"}]], "sensor.t") == []
    many = [[{"entity_id": "sensor.t", "state": str(i), "last_changed": f"2026-10-21T{i // 60:02d}:{i % 60:02d}:00+00:00"} for i in range(1000)]]
    pts = boards.slim_history(many, "sensor.t")
    assert len(pts) == boards.MAX_POINTS and pts[-1][1] == 999 and pts[0][1] == 0
    assert boards.slim_history(None, "sensor.t") == []


async def test_settings_keep_pages_tabs_and_users(aiohttp_client, tmp_path):
    client = await aiohttp_client(server.make_app(tmp_path))
    body = {"customTabs": [{"id": "p_garten", "name": "Garten", "icon": "🌱"}], "tabOrder": ["p_garten", "today"],
            "pageLayouts": {"p_garten": {"cards": [{"id": "c_abc", "type": "switch", "entity": "switch.pumpe"}]}, "today": {"hidden": ["waste"]}, "p_x": {"order": ["a"]}},
            "userTabs": {"kid": {"hide": ["p_garten", "p_nope_long_name_too_long_for_it"], "start": "p_garten"}, "tab": {"start": "p_garten"}}}
    s = await (await client.put("/api/settings", json=body)).json()
    assert s["customTabs"] == body["customTabs"] and s["tabOrder"] == ["p_garten", "today"]
    assert set(s["pageLayouts"]) == {"p_garten", "today"} and s["pageLayouts"]["p_garten"]["cards"][0]["entity"] == "switch.pumpe"
    assert s["userTabs"] == {"kid": {"hide": ["p_garten"]}, "tab": {"hide": [], "start": "p_garten"}}
    assert (await (await client.get("/api/history?entity=sensor.t&hours=24")).json()) == {"points": []}
    assert (await client.get("/api/history?entity=bad&hours=24")).status == 400
    assert (await client.get("/api/history?entity=sensor.t&hours=5")).status == 400
    json.dumps(s)
