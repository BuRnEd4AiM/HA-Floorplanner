import copy
import json
import re
import sys
from pathlib import Path

import pytest

APP = Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"
sys.path.insert(0, str(APP))
import importer  # noqa: E402
import server  # noqa: E402


def example(name):
    return json.loads((APP / "examples" / f"{name}.json").read_text(encoding="utf-8"))


def square_flat(**floor):
    return {"schemaVersion": 1, "building": {"floors": [{"name": "EG", "kind": "floor", **floor}]}}


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path))


# ---------- interpreter
@pytest.mark.parametrize("name", ["flat", "house"])
def test_examples_import_cleanly(name):
    layout, plot, rep, summary = importer.build_layout(example(name))
    assert layout is not None and not rep.errors and not rep.warnings, (rep.errors, rep.warnings)
    assert summary["rooms"] >= 4 and summary["walls"] >= 10 and summary["openings"] >= 10


def test_device_types_parsed_from_models_js():
    models = (APP / "static" / "models.js").read_text(encoding="utf-8")
    declared = set(re.findall(r"^  (\w+):\s*\{ label:", models, re.M))
    assert importer.DEVICE_TYPES and set(importer.DEVICE_TYPES) | {"door", "window"} == declared


def test_shared_walls_are_one_wall_and_outer_walls_are_thick():
    two = [{"name": "A", "points": [[0, 0], [4, 0], [4, 3], [0, 3]]}, {"name": "B", "points": [[4, 0], [8, 0], [8, 3], [4, 3]]}]
    layout, _, rep, _ = importer.build_layout(square_flat(rooms=two, footprint=[[0, 0], [8, 0], [8, 3], [0, 3]]))
    walls = layout["floors"][0]["walls"]
    middle = [w for w in walls if w["a"][0] == 4 and w["b"][0] == 4]
    assert len(middle) == 1 and middle[0]["thickness"] == 0.12           # shared edge: one inner wall
    outer = [w for w in walls if w is not middle[0]]
    assert len(outer) == 6 and all(w["thickness"] == 0.3 for w in outer)   # the long outer walls are split where the inner wall meets them


def test_walls_without_footprint_use_edge_sharing():
    two = [{"points": [[0, 0], [4, 0], [4, 3], [0, 3]]}, {"points": [[4, 0], [8, 0], [8, 3], [4, 3]]}]
    layout, _, _, _ = importer.build_layout(square_flat(rooms=two))
    thick = sorted(w["thickness"] for w in layout["floors"][0]["walls"])
    assert thick.count(0.12) == 1 and thick.count(0.3) == 6


def test_opening_snaps_to_nearest_wall_and_stays_inside():
    room = [{"points": [[0, 0], [4, 0], [4, 3], [0, 3]]}]
    f = square_flat(rooms=room, openings=[{"preset": "door", "at": [0.1, 0.02]}, {"preset": "window", "at": [2, 3.05]}])
    layout, _, rep, summary = importer.build_layout(f)
    assert not rep.errors and summary["openings"] == 2
    door = next(o for w in layout["floors"][0]["walls"] for o in w["openings"] if o["type"] == "door")
    assert door["pos"] >= 0.5                                              # moved away from the corner
    assert door["width"] == 0.9


def test_opening_far_from_walls_is_skipped_with_warning():
    f = square_flat(rooms=[{"points": [[0, 0], [4, 0], [4, 3], [0, 3]]}], openings=[{"preset": "door", "at": [2, 1.5]}])
    layout, _, rep, summary = importer.build_layout(f)
    assert summary["openings"] == 0 and rep.warnings and "no wall near" in rep.warnings[0]["message"]


def test_overlapping_openings_are_skipped():
    f = square_flat(rooms=[{"points": [[0, 0], [6, 0], [6, 3], [0, 3]]}],
                    openings=[{"preset": "window2", "at": [3, 0]}, {"preset": "window2", "at": [3.5, 0]}])
    _, _, rep, summary = importer.build_layout(f)
    assert summary["openings"] == 1 and any("overlaps" in w["message"] for w in rep.warnings)


def test_errors_carry_json_paths():
    bad = square_flat(rooms=[{"name": "bow tie", "points": [[0, 0], [4, 3], [4, 0], [0, 3]]}, {"points": [[0, 0], [1, 1]]}])
    layout, _, rep, _ = importer.build_layout(bad)
    paths = [e["path"] for e in rep.errors]
    assert layout is None
    assert "building.floors[0].rooms[0].points" in paths and "building.floors[0].rooms[1].points" in paths


def test_version_and_shape_checks():
    assert importer.build_layout({"schemaVersion": 2, "building": {}})[0] is None
    assert importer.build_layout([1])[0] is None
    assert importer.build_layout({"schemaVersion": 1})[0] is None
    assert importer.build_layout({"schemaVersion": 1, "building": {"floors": []}})[0] is None
    _, _, rep, _ = importer.build_layout({"building": {"floors": [{"rooms": [{"points": [[0, 0], [3, 0], [3, 3]]}]}]}})
    assert any(w["path"] == "schemaVersion" for w in rep.warnings)        # missing version is only a warning


def test_unknown_device_types_are_skipped_not_fatal():
    f = square_flat(rooms=[{"points": [[0, 0], [4, 0], [4, 3], [0, 3]]}], devices=[{"type": "sofa", "x": 1, "z": 1}, {"type": "hoverboard", "x": 1, "z": 1}])
    layout, _, rep, summary = importer.build_layout(f)
    assert summary["devices"] == 1 and layout["floors"][0]["devices"][0]["y"] == 0 and any("hoverboard" in w["message"] for w in rep.warnings)


def test_floor_order_roof_and_origin():
    data = example("house")
    layout, plot, rep, _ = importer.build_layout(data)
    kinds = [f["kind"] for f in layout["floors"]]
    assert kinds == ["basement", "floor", "floor", "roof"] and layout["floors"][-1]["roof"]["pitch"] == 38
    assert plot["boundary"][2] == [22, 30]
    xs = [p[0] for r in layout["floors"][1]["rooms"] for p in r["points"]]
    assert min(xs) == 5.5                                                  # origin [5.5, 8] applied to the building
    objs = [d for d in layout["floors"][1]["devices"] if d["type"] in ("lawn", "tree")]
    assert objs and min(d["x"] for d in objs) == 3                         # plot objects keep plot coordinates


def test_nanoleaf_panels_and_flags_survive():
    f = square_flat(rooms=[{"points": [[0, 0], [4, 0], [4, 3], [0, 3]]}],
                    devices=[{"type": "nanoleaf", "x": 1, "z": 1, "hideModel": True, "ledEntity": "light.x",
                              "panels": [{"s": "tri", "x": 0, "y": 0, "r": 0}, {"s": "bogus", "x": 0, "y": 0}]}])
    d = importer.build_layout(f)[0]["floors"][0]["devices"][0]
    assert d["hideModel"] is True and d["ledEntity"] == "light.x" and len(d["panels"]) == 1


def test_ledring_sections_survive_import_and_export():
    f = square_flat(rooms=[{"points": [[0, 0], [4, 0], [4, 3], [0, 3]]}],
                    devices=[{"type": "ledring", "x": 2, "z": 1.5, "entity": "light.main", "closed": True, "inset": 0.15,
                              "pts": [[-1.8, -1.3], [1.8, -1.3], [1.8, 1.3], [-1.8, 1.3]],
                              "segs": [{"entity": "light.a"}, {"entity": 5}, {}, {}, {"entity": "light.extra"}]}])
    layout = importer.build_layout(f)[0]
    d = layout["floors"][0]["devices"][0]
    assert d["y"] == 2.5 and d["closed"] is True and len(d["pts"]) == 4
    assert d["segs"] == [{"entity": "light.a"}, {}, {}, {}]                 # one entry per section, bad ones emptied
    again = importer.build_layout(importer.layout_to_property(layout, "x"))[0]["floors"][0]["devices"][0]
    assert {k: again[k] for k in ("pts", "closed", "segs", "inset", "entity")} == {k: d[k] for k in ("pts", "closed", "segs", "inset", "entity")}


def test_ledring_sections_with_ranges_survive_and_bad_ones_are_skipped():
    f = square_flat(devices=[{"type": "ledring", "x": 0, "z": 0, "pts": [[-2, -1], [2, -1], [2, 1], [-2, 1]],
                              "segs": [{"from": 0, "to": 1.5, "entity": "light.a"}, {"from": 1.6, "to": 4}, {"from": 5, "to": 4}, {"entity": "light.x"}]}])
    layout, _, rep, _ = importer.build_layout(f)
    d = layout["floors"][0]["devices"][0]
    assert d["segs"] == [{"entity": "light.a", "from": 0.0, "to": 1.5}, {"from": 1.6, "to": 4.0}]
    assert any(w["path"].endswith(".segs") for w in rep.warnings)
    again = importer.build_layout(importer.layout_to_property(layout, "x"))[0]["floors"][0]["devices"][0]
    assert again["segs"] == d["segs"]


def test_ledring_without_points_gets_a_square_and_a_warning():
    layout, _, rep, _ = importer.build_layout(square_flat(devices=[{"type": "ledring", "x": 0, "z": 0, "closed": False}]))
    d = layout["floors"][0]["devices"][0]
    assert len(d["pts"]) == 4 and len(d["segs"]) == 3 and any(w["path"].endswith(".pts") for w in rep.warnings)


# ---------- GeoJSON
def test_geojson_plot_and_building():
    plot = [[8.60, 49.40], [8.6005, 49.40], [8.6005, 49.4004], [8.60, 49.4004], [8.60, 49.40]]
    house = [[8.60015, 49.40015], [8.60035, 49.40015], [8.60035, 49.40025], [8.60015, 49.40025], [8.60015, 49.40015]]
    gj = {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [plot]}},
        {"type": "Feature", "properties": {"building": "house"}, "geometry": {"type": "Polygon", "coordinates": [house]}}]}
    prop = importer.geojson_to_property(gj)
    assert prop["plot"]["boundary"] and prop["building"]["footprint"]
    w = max(p[0] for p in prop["plot"]["boundary"])
    assert 30 < w < 50                                                     # 0.0005 deg of longitude at 49 N is about 36 m
    layout, _, rep, summary = importer.build_layout(prop)
    assert layout is not None and not rep.errors and summary["walls"] == 4


def test_geojson_without_polygons_is_rejected():
    with pytest.raises(ValueError):
        importer.geojson_to_property({"type": "Feature", "properties": {}, "geometry": {"type": "Point", "coordinates": [1, 2]}})


# ---------- export round trip
def test_export_then_import_reproduces_the_plan():
    layout, plot, _, summary = importer.build_layout(example("house"))
    again = importer.layout_to_property(layout, "x")
    layout2, plot2, rep, summary2 = importer.build_layout(again)
    assert layout2 is not None and not rep.errors
    for k in ("floors", "rooms", "walls", "openings", "devices"):
        assert summary[k] == summary2[k], k
    assert plot2 == plot


# ---------- API
async def test_api_dry_run_writes_nothing_and_import_creates_a_new_house(client):
    before = await (await client.get("/api/houses")).json()
    r = await client.post("/api/import?dryRun=1", json=example("flat"))
    j = await r.json()
    assert r.status == 200 and j["ok"] and j["dryRun"] and j["summary"]["rooms"] == 4
    assert await (await client.get("/api/houses")).json() == before
    r = await client.post("/api/import?name=Mein%20Test", json=example("house"))
    j = await r.json()
    assert r.status == 200 and j["name"] == "Mein Test" and j["summary"]["floors"] == 4
    houses = await (await client.get("/api/houses")).json()
    assert len(houses) == len(before) + 1
    lay = await (await client.get(f"/api/layout?house={j['id']}")).json()
    assert len(lay["floors"]) == 4 and lay["plot"]["boundary"]
    # the other house is untouched
    assert (await (await client.get("/api/layout")).json())["floors"][0]["name"] == "Erdgeschoss"


async def test_api_rejects_bad_input_with_paths(client):
    r = await client.post("/api/import", data="nope")
    assert r.status == 400
    r = await client.post("/api/import", json={"schemaVersion": 1, "building": {"floors": [{"rooms": [{"points": [[0, 0]]}]}]}})
    j = await r.json()
    assert r.status == 400 and j["errors"][0]["path"].endswith("points")
    assert len(await (await client.get("/api/houses")).json()) == 1


async def test_api_geojson_and_export_and_helpers(client):
    gj = {"type": "Polygon", "coordinates": [[[8.6, 49.4], [8.6003, 49.4], [8.6003, 49.4002], [8.6, 49.4002], [8.6, 49.4]]]}
    r = await client.post("/api/import?dryRun=1", json=gj)
    j = await r.json()
    assert r.status == 200 and j["fromGeoJSON"] and j["summary"]["walls"] == 4
    exp = await client.get("/api/export/property")
    assert exp.status == 200 and "attachment" in exp.headers["Content-Disposition"]
    assert (await exp.json())["schemaVersion"] == 1
    assert (await client.get("/api/import/schema")).status == 200
    assert (await client.get("/api/import/examples/flat")).status == 200
    assert (await client.get("/api/import/examples/..%2Fserver")).status in (404, 400)
    assert (await client.get("/api/import/examples/nope")).status == 404


async def test_api_house_limit(client):
    for i in range(server.MAX_HOUSES - 1):
        assert (await client.post("/api/import", json=example("flat"))).status == 200
    r = await client.post("/api/import", json=example("flat"))
    assert r.status == 400


# ---------- roof dormers (Gauben) through the import / export API
def roof_house(dormers, roof_type="gable"):
    return {"schemaVersion": 1, "building": {"roof": {"type": roof_type, "pitch": 38, "dormers": dormers},
                                             "floors": [{"name": "EG", "kind": "floor", "rooms": [{"name": "R", "points": [[0, 0], [8, 0], [8, 5], [0, 5]]}]}]}}


def roof_of(layout):
    return next(f for f in layout["floors"] if f["kind"] == "roof")["roof"]


def test_dormers_are_imported_and_cleaned():
    layout, _, rep, _ = importer.build_layout(roof_house([
        {"side": "b", "pos": 0.25, "w": 2, "type": "flat", "win": False}, {"side": 0}, {"side": 7, "type": "round", "w": 99}, "junk"]))
    d = roof_of(layout)["dormers"]
    assert len(d) == 3 and [x["side"] for x in d] == [1, 0, 0]
    assert d[0] == {"id": "dm1", "side": 1, "type": "flat", "win": False, "pos": 0.25, "w": 2.0, "hw": 1.2, "eave": 0.8}
    assert d[1]["type"] == "gable" and d[1]["win"] is True and d[1]["pos"] == 0.5          # defaults
    assert d[2]["type"] == "gable" and d[2]["w"] == 1.6 and d[2]["side"] == 0               # bad values fall back
    paths = [w["path"] for w in rep.warnings]
    assert any(p.endswith("[2].side") for p in paths) and any(p.endswith("[2].type") for p in paths) and any(p.endswith("[2].w") for p in paths)
    assert any(p.endswith("dormers[3]") for p in paths) and not rep.errors


def test_dormers_on_a_flat_roof_are_dropped_with_a_warning():
    layout, _, rep, _ = importer.build_layout(roof_house([{"side": 0}], "flat"))
    assert "dormers" not in roof_of(layout) and any(w["path"].endswith("roof.dormers") for w in rep.warnings)


def test_at_most_twenty_dormers():
    layout, _, rep, _ = importer.build_layout(roof_house([{"pos": i / 30} for i in range(25)]))
    assert len(roof_of(layout)["dormers"]) == 20 and any("first 20" in w["message"] for w in rep.warnings)


def test_the_house_example_has_dormers():
    layout, _, rep, _ = importer.build_layout(example("house"))
    assert len(roof_of(layout)["dormers"]) == 2 and not rep.warnings


async def test_dormers_survive_import_and_export_over_the_api(client):
    r = await client.post("/api/import?name=Gauben", json=roof_house([{"side": "a", "pos": 0.3, "w": 1.8}]))
    assert r.status == 200, await r.text()
    hid = (await r.json())["id"]
    exp = await (await client.get(f"/api/export/property?house={hid}")).json()
    d = next(f for f in exp["building"]["floors"] if f["kind"] == "roof")["roof"]["dormers"]
    assert d[0]["pos"] == 0.3 and d[0]["w"] == 1.8
    again, _, rep, _ = importer.build_layout(exp)
    assert roof_of(again)["dormers"][0]["w"] == 1.8 and not rep.errors


def test_schema_describes_dormers():
    schema = json.loads((APP / "property.schema.json").read_text(encoding="utf-8"))
    assert {"side", "pos", "w", "hw", "eave", "type", "win"} <= set(schema["$defs"]["roof"]["properties"]["dormers"]["items"]["properties"])


# ---------- further roofs on one house (#125)
def two_roofs(parts):
    return {"schemaVersion": 1, "building": {"roof": {"type": "gable", "pitch": 35, "box": {"x0": 0, "x1": 8, "z0": 0, "z1": 5}, "parts": parts},
            "floors": [{"name": "EG", "kind": "floor", "rooms": [{"name": "R", "points": [[0, 0], [8, 0], [8, 5], [0, 5]]}]},
                       {"name": "Anbau", "kind": "floor", "rooms": [{"name": "A", "points": [[8, 0], [11, 0], [11, 4], [8, 4]]}]}]}}


def test_further_roofs_are_imported_with_their_floor():
    layout, _, rep, _ = importer.build_layout(two_roofs([
        {"name": "Anbau", "type": "flat", "box": {"x0": 8, "x1": 11, "z0": 0, "z1": 4}, "level": 1},
        {"type": "hip", "pitch": 20, "box": {"x0": 0, "x1": 3, "z0": 5, "z1": 7}}, {"type": "flat"}, "junk"]))
    parts = roof_of(layout)["parts"]
    assert len(parts) == 2 and not rep.errors
    assert parts[0]["name"] == "Anbau" and parts[0]["type"] == "flat" and parts[0]["id"] == "rp1"
    assert parts[0]["level"] == next(f["id"] for f in layout["floors"] if f["name"] == "Anbau")        # the index became the floor id
    assert "level" not in parts[1] and parts[1]["type"] == "hip" and parts[1]["pitch"] == 20.0
    assert sum("needs a box" in w["message"] for w in rep.warnings) == 2        # the two without a usable box are dropped


def test_further_roofs_bad_level_and_limit():
    layout, _, rep, _ = importer.build_layout(two_roofs([{"box": {"x0": 0, "x1": 2, "z0": 0, "z1": 2}, "level": 9}] +
                                                        [{"box": {"x0": i, "x1": i + 1, "z0": 0, "z1": 1}} for i in range(10)]))
    parts = roof_of(layout)["parts"]
    assert len(parts) == 8 and "level" not in parts[0] and any("not a floor" in w["message"] for w in rep.warnings)


async def test_further_roofs_survive_import_and_export(client):
    r = await client.post("/api/import?name=Dach2", json=two_roofs([{"name": "Anbau", "type": "flat", "box": {"x0": 8, "x1": 11, "z0": 0, "z1": 4}, "level": 1}]))
    assert r.status == 200, await r.text()
    hid = (await r.json())["id"]
    exp = await (await client.get(f"/api/export/property?house={hid}")).json()
    roof = next(f for f in exp["building"]["floors"] if f["kind"] == "roof")["roof"]
    assert roof["parts"][0]["level"] == 1 and roof["parts"][0]["name"] == "Anbau" and "id" not in roof["parts"][0]
    r2 = await client.post("/api/import?name=Dach3", json=exp)
    assert r2.status == 200, await r2.text()


def _prop(devs):
    return square_flat(rooms=[{"name": "R", "points": [[0, 0], [5, 0], [5, 4], [0, 4]]}], devices=devs)


def test_cables_and_kitchen_run_import_and_round_trip():
    spec = _prop([{"type": "solarpanel", "x": 1, "z": 1, "id": "p", "feeds": "w", "entity": "sensor.pv"},
                  {"type": "inverter", "x": 2, "z": 1, "id": "w"},
                  {"type": "kitchenrun", "x": 3, "z": 3, "legs": [["base", "nonsense", "sink"], ["stove"]], "upper": False, "depth": 0.7}])
    layout, _, rep, _ = importer.build_layout(spec)
    pv, inv, kit = layout["floors"][0]["devices"]
    assert pv["cables"] == [{"id": pv["cables"][0]["id"], "to": inv["id"], "route": "air"}] and "_key" not in pv and "_cables" not in pv and "_key" not in inv
    assert kit["legs"] == [["base", "sink"], ["stove"]] and kit["upper"] is False and kit["depth"] == 0.7
    back = importer.layout_to_property(layout)
    bd = back["building"]["floors"][0]["devices"]
    assert bd[0]["cables"] == [{"to": bd[1]["id"], "route": "air"}] and bd[1]["id"] and bd[2]["legs"] == [["base", "sink"], ["stove"]]
    assert importer.build_layout(back)[0]["floors"][0]["devices"][0]["cables"]


def test_cable_to_unknown_device_is_dropped_with_a_warning():
    layout, _, rep, _ = importer.build_layout(_prop([{"type": "inverter", "x": 1, "z": 1, "feeds": "nope"}]))
    assert "cables" not in layout["floors"][0]["devices"][0]
    assert any("cable" in str(w) for w in rep.warnings)


def test_kitchen_modules_match_kitchen_js():
    js = (APP / "static" / "kitchen.js").read_text(encoding="utf-8")
    mods = re.search(r"MOD_W = \{(.*?)\}", js).group(1)
    assert tuple(re.findall(r"(\w+):", mods)) == importer.KITCHEN_MODULES


def test_several_cables_with_routes_and_a_cable_to_another_floor():
    spec = {"schemaVersion": 1, "building": {"floors": [
        {"name": "EG", "kind": "floor", "rooms": [{"name": "R", "points": [[0, 0], [5, 0], [5, 4], [0, 4]]}], "devices": [
            {"type": "houseentry", "x": 1, "z": 1, "id": "in", "cables": [{"to": "box", "route": "floor"}]},
            {"type": "fusebox", "x": 2, "z": 1, "id": "box", "cables": [{"to": "wr", "route": "through"}, {"to": "in", "route": "bogus"}, {"to": "nope"}]}]},
        {"name": "OG", "kind": "floor", "rooms": [{"name": "O", "points": [[0, 0], [5, 0], [5, 4], [0, 4]]}], "devices": [
            {"type": "inverter", "x": 2, "z": 1, "id": "wr"}]}]}}
    layout, _, rep, _ = importer.build_layout(spec)
    entry, box = layout["floors"][0]["devices"]
    wr = layout["floors"][1]["devices"][0]
    assert [c["route"] for c in box["cables"]] == ["through", "floor"] and box["cables"][0]["to"] == wr["id"] and box["cables"][1]["to"] == entry["id"]
    assert any("nope" in str(w) for w in rep.warnings)
    back = importer.layout_to_property(layout)["building"]["floors"]
    assert back[0]["devices"][1]["cables"][0] == {"to": back[1]["devices"][0]["id"], "route": "through"}


def test_kitchen_module_with_own_width_survives_import_and_export():
    spec = _prop([{"type": "kitchenrun", "x": 3, "z": 3, "legs": [["base", {"m": "dish", "w": 0.45}, {"m": "sink", "w": 9}, {"m": "nonsense", "w": 1}]]}])
    layout, _, _, _ = importer.build_layout(spec)
    assert layout["floors"][0]["devices"][0]["legs"] == [["base", {"m": "dish", "w": 0.45}]]
    back = importer.layout_to_property(layout)["building"]["floors"][0]["devices"][0]
    assert back["legs"] == [["base", {"m": "dish", "w": 0.45}]]


def test_cable_kind_and_own_sensor_survive_import_and_export():
    spec = _prop([{"type": "battery", "x": 1, "z": 1, "id": "b", "cables": [{"to": "f", "kind": "battery", "entity": "sensor.bat_w"}, {"to": "f", "kind": "bogus"}]},
                  {"type": "fusebox", "x": 2, "z": 1, "id": "f"}])
    layout, _, _, _ = importer.build_layout(spec)
    bat = layout["floors"][0]["devices"][0]
    assert bat["cables"][0]["kind"] == "battery" and bat["cables"][0]["entity"] == "sensor.bat_w" and "kind" not in bat["cables"][1]
    out = importer.layout_to_property(layout)["building"]["floors"][0]["devices"][0]["cables"]
    assert out[0] == {"to": out[0]["to"], "route": "floor", "kind": "battery", "entity": "sensor.bat_w"} and "kind" not in out[1]


def test_battery_charge_sensor_survives_import_and_export():
    spec = _prop([{"type": "battery", "x": 1, "z": 1, "entity": "sensor.bat_pct", "batPower": "sensor.bat_w", "batInvert": True}])
    layout, _, _, _ = importer.build_layout(spec)
    bat = layout["floors"][0]["devices"][0]
    assert bat["batPower"] == "sensor.bat_w" and bat["batInvert"] is True
    back = importer.layout_to_property(layout)["building"]["floors"][0]["devices"][0]
    assert back["batPower"] == "sensor.bat_w" and back["batInvert"] is True


# ---------- solar panel field on the roof (#176)
def test_solar_field_and_mount_survive_import_and_export():
    spec = _prop([{"type": "solarpanel", "x": 1, "z": 1, "cols": 4, "rows": 2, "mount": "flat"},
                  {"type": "solarpanel", "x": 5, "z": 1, "cols": 99, "rows": 1, "mount": "sideways"}])
    layout, _, rep, _ = importer.build_layout(spec)
    a, b = layout["floors"][0]["devices"]
    assert a["cols"] == 4 and a["rows"] == 2 and a["mount"] == "flat"
    assert "cols" not in b and "rows" not in b and "mount" not in b              # 1 is the default, a bad mount means auto
    assert any("cols" in str(w) for w in rep.warnings)
    back = importer.layout_to_property(layout)["building"]["floors"][0]["devices"][0]
    assert back["cols"] == 4 and back["rows"] == 2 and back["mount"] == "flat"


def test_solar_limits_match_solarroof_js_and_schema():
    js = (Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app" / "static" / "solarroof.js").read_text(encoding="utf-8")
    assert int(re.search(r"MAX_FIELD = (\d+)", js).group(1)) == importer.SOLAR_MAX_FIELD
    assert re.search(r"MOUNTS = \[([^\]]*)\]", js).group(1).replace("'", "").replace(" ", "").split(",") == list(importer.SOLAR_MOUNTS)
    schema = json.loads((Path(importer.__file__).parent / "property.schema.json").read_text(encoding="utf-8"))
    dev = schema["$defs"]["device"]["properties"]
    assert dev["cols"]["maximum"] == importer.SOLAR_MAX_FIELD and dev["mount"]["enum"] == list(importer.SOLAR_MOUNTS)


# ---------- metal bridge (#189)
def test_bridge_length_width_and_railing_survive_import_and_export():
    spec = _prop([{"type": "bridge", "x": 4, "z": 2, "y": 2.8, "len": 3.5, "w": 1.4, "noRail": True}])
    layout, _, rep, _ = importer.build_layout(spec)
    d = layout["floors"][0]["devices"][0]
    assert not rep.errors and d["type"] == "bridge" and d["len"] == 3.5 and d["w"] == 1.4 and d["noRail"] is True and d["y"] == 2.8
    back = importer.layout_to_property(layout)["building"]["floors"][0]["devices"][0]
    assert back["len"] == 3.5 and back["w"] == 1.4 and back["noRail"] is True
    schema = json.loads((Path(importer.__file__).parent / "property.schema.json").read_text(encoding="utf-8"))
    assert {"len", "noRail"} <= set(schema["$defs"]["device"]["properties"])


# ---------- stairs, blocks and floor openings (#191)
def _stairs_spec(stairs, **floor):
    return {"schemaVersion": 1, "building": {"floors": [{"rooms": [{"name": "A", "points": [[0, 0], [8, 0], [8, 6], [0, 6]]}], "stairs": stairs, **floor}]}}


def test_stair_types_match_stairs_js():
    js = (Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app" / "static" / "stairs.js").read_text(encoding="utf-8")
    assert re.search(r"STAIR_TYPES = \[([^\]]*)\]", js).group(1).replace("'", "").replace(" ", "").split(",") == list(importer.STAIR_TYPES)
    assert int(re.search(r"MAX_FLOORS = (\d+)", js).group(1)) == importer.STAIR_MAX_FLOORS
    assert [float(x) for x in re.search(r"MIN_TREAD = ([\d.]+), MAX_TREAD = ([\d.]+)", js).groups()] == list(importer.STAIR_TREAD)


def test_stairs_are_imported_with_defaults_and_counted():
    layout, _, rep, summary = importer.build_layout(_stairs_spec([{"type": "U", "x": 1, "z": 2}, {"type": "spiral", "x": 7, "z": 1, "floors": 2, "turn": "left", "dir": "down", "name": "Garten"}]))
    assert layout is not None and not rep.errors and summary["stairs"] == 2
    u, sp = layout["floors"][0]["stairs"]
    assert u["type"] == "U" and u["floors"] == 1 and u["w"] == 1.0 and u["tread"] == 0.27 and u["turn"] == "right" and u["dir"] == "up" and u["id"]
    assert sp["w"] == 0.9 and sp["floors"] == 2 and sp["turn"] == "left" and sp["dir"] == "down" and sp["name"] == "Garten" and sp["id"] != u["id"]


def test_stair_bad_values_are_ignored_with_warnings_and_unknown_types_skipped():
    layout, _, rep, summary = importer.build_layout(_stairs_spec([
        {"type": "straight", "x": 1, "z": 1, "floors": 9, "w": 99, "tread": 1, "turn": "up", "dir": "sideways", "rot": "x"},
        {"type": "ladder", "x": 1, "z": 1}]))
    s = layout["floors"][0]["stairs"]
    assert len(s) == 1 and summary["stairs"] == 1 and not rep.errors
    assert (s[0]["floors"], s[0]["w"], s[0]["tread"], s[0]["turn"], s[0]["dir"], s[0]["rot"]) == (1, 1.0, 0.27, "right", "up", 0.0)
    paths = " ".join(w["path"] for w in rep.warnings)
    for key in ("floors", "w", "tread", "turn", "dir", "rot", "stairs[1]"):
        assert key in paths, key


def test_stair_needs_a_position_and_floors_is_a_whole_number():
    _, _, rep, _ = importer.build_layout(_stairs_spec([{"type": "straight", "x": "a", "z": 1}]))
    assert rep.errors and "stairs[0]" in rep.errors[0]["path"]
    layout, _, rep, _ = importer.build_layout(_stairs_spec([{"type": "straight", "x": 1, "z": 1, "floors": 2.5}, {"type": "straight", "x": 1, "z": 1, "floors": True}]))
    assert [s["floors"] for s in layout["floors"][0]["stairs"]] == [1, 1] and len(rep.warnings) == 2


def test_wall_stair_path_is_relative_and_a_path_not_starting_at_zero_is_moved():
    layout, _, rep, _ = importer.build_layout(_stairs_spec([{"type": "wall", "x": 1.6, "z": 0.1, "path": [[0, 0], [2.3, 0], [2.3, 4.9]], "floors": 2},
                                                           {"type": "wall", "x": 0, "z": 0, "path": [[1, 1], [3, 1], [3, 4]]}]))
    a, b = layout["floors"][0]["stairs"]
    assert not rep.errors and a["path"] == [[0, 0], [2.3, 0], [2.3, 4.9]] and a["floors"] == 2 and (a["x"], a["z"]) == (1.6, 0.1)
    assert b["path"] == [[0, 0], [2, 0], [2, 3]] and (b["x"], b["z"]) == (1, 1)


def test_wall_stair_without_a_usable_path_is_an_error():
    for bad in (None, [], [[0, 0]], [[0, 0], [0, 0]], [[0, 0], ["a", 1]], [[0, 0]] + [[i, 0] for i in range(1, 40)]):
        spec = {"type": "wall", "x": 1, "z": 1}
        if bad is not None:
            spec["path"] = bad
        layout, _, rep, _ = importer.build_layout(_stairs_spec([spec]))
        assert layout is None and any("path" in e["path"] for e in rep.errors), bad


def test_stairs_shift_with_the_building_origin_but_the_path_does_not():
    spec = _stairs_spec([{"type": "wall", "x": 1, "z": 1, "path": [[0, 0], [2, 0]]}])
    spec["building"]["origin"] = [10, 20]
    layout, _, _, _ = importer.build_layout(spec)
    st = layout["floors"][0]["stairs"][0]
    assert (st["x"], st["z"], st["path"]) == (11, 21, [[0, 0], [2, 0]])


def test_blocks_and_holes_are_imported_and_shifted_by_the_origin():
    spec = _stairs_spec([], blocks=[{"name": "Anbau", "points": [[8, 0], [11, 0], [11, 4], [8, 4]], "h": 3}, {"points": [[0, 0], [2, 0], [2, 2]]}],
                        holes=[{"points": [[2, 1], [4, 1], [4, 3], [2, 3]]}])
    spec["building"]["origin"] = [1, 2]
    layout, _, rep, _ = importer.build_layout(spec)
    f = layout["floors"][0]
    assert f["blocks"][0]["name"] == "Anbau" and f["blocks"][0]["h"] == 3.0 and f["blocks"][0]["points"][0] == [9, 2]
    assert not rep.errors and f["blocks"][1]["name"] == "Block 2" and f["blocks"][1]["points"][0] == [1, 2]      # a block without a name is numbered
    assert f["holes"][0]["points"][0] == [3, 3]


def test_stairs_blocks_and_holes_survive_export_and_import():
    spec = _stairs_spec([{"type": "L", "x": 1, "z": 1, "rot": 90, "w": 1.1, "turn": "left", "floors": 2},
                         {"type": "wall", "x": 1.6, "z": 0.1, "turn": "right", "floors": 2, "path": [[0, 0], [2.3, 0], [2.3, 4.9]], "name": "Haupttreppe"}],
                        blocks=[{"name": "Anbau", "points": [[8, 0], [11, 0], [11, 4], [8, 4]], "h": 3}], holes=[{"points": [[2, 1], [4, 1], [4, 3], [2, 3]]}])
    layout, _, _, summary = importer.build_layout(spec)
    out = importer.layout_to_property(layout)
    fl = out["building"]["floors"][0]
    assert len(fl["stairs"]) == 2 and fl["stairs"][1]["path"] == [[0, 0], [2.3, 0], [2.3, 4.9]] and "id" not in fl["stairs"][0]
    assert fl["blocks"][0]["h"] == 3.0 and fl["holes"][0]["points"][0] == [2, 1]
    layout2, _, rep, summary2 = importer.build_layout(out)
    assert layout2 is not None and not rep.errors and summary2["stairs"] == summary["stairs"] == 2
    strip = lambda s: {k: v for k, v in s.items() if k != "id"}
    assert [strip(s) for s in layout2["floors"][0]["stairs"]] == [strip(s) for s in layout["floors"][0]["stairs"]]
    assert [{k: v for k, v in b.items() if k != "id"} for b in layout2["floors"][0]["blocks"]] == [{k: v for k, v in b.items() if k != "id"} for b in layout["floors"][0]["blocks"]]
    assert layout2["floors"][0]["holes"][0]["points"] == layout["floors"][0]["holes"][0]["points"]


def test_export_of_a_layout_made_in_the_editor_keeps_its_stairs():
    editor = {"version": 1, "floors": [{"id": "f1", "name": "EG", "kind": "floor", "walls": [], "devices": [], "blocks": [], "holes": [],
              "rooms": [{"id": "r", "name": "A", "color": "#b89b74", "points": [[0, 0], [4, 0], [4, 4], [0, 4]]}],
              "stairs": [{"id": "s1", "name": "Wall stair", "type": "wall", "w": 0.9, "tread": 0.27, "turn": "right", "dir": "up", "floors": 2, "rot": 0, "x": 1.6, "z": 0.1, "path": [[0, 0], [2.3, 0], [2.3, 3.9]]}]}]}
    st = importer.layout_to_property(editor)["building"]["floors"][0]["stairs"][0]
    assert st["type"] == "wall" and st["floors"] == 2 and st["path"][-1] == [2.3, 3.9] and st["name"] == "Wall stair"
    assert "holes" not in importer.layout_to_property(editor)["building"]["floors"][0]


def test_schema_describes_stairs_blocks_and_holes():
    schema = json.loads((Path(importer.__file__).parent / "property.schema.json").read_text(encoding="utf-8"))
    d = schema["$defs"]
    assert d["stair"]["properties"]["type"]["enum"] == list(importer.STAIR_TYPES)
    assert d["stair"]["properties"]["floors"]["maximum"] == importer.STAIR_MAX_FLOORS
    assert {"stairs", "blocks", "holes"} <= set(d["floor"]["properties"])
    assert "path" in d["stair"]["properties"] and "block" in d and "hole" in d


def test_a_block_or_hole_that_is_too_small_is_an_error_with_its_path():
    layout, _, rep, _ = importer.build_layout(_stairs_spec([], holes=[{"points": [[0, 0], [0.3, 0], [0.3, 0.3]]}]))
    assert layout is None and any("holes[0]" in e["path"] for e in rep.errors)


async def test_stairs_survive_import_and_export_over_the_api(client):
    spec = _stairs_spec([{"type": "wall", "x": 1.6, "z": 0.1, "floors": 2, "path": [[0, 0], [2.3, 0], [2.3, 4.9]]}, {"type": "spiral", "x": 7, "z": 1, "floors": 2}],
                        holes=[{"points": [[2, 1], [4, 1], [4, 3], [2, 3]]}])
    r = await client.post("/api/import?dryRun=1", json=spec)
    j = await r.json()
    assert r.status == 200 and j["ok"] and j["summary"]["stairs"] == 2
    r = await client.post("/api/import?name=Treppen", json=spec)
    assert r.status == 200, await r.text()
    hid = (await r.json())["id"]
    lay = await (await client.get(f"/api/layout?house={hid}")).json()
    assert [s["type"] for s in lay["floors"][0]["stairs"]] == ["wall", "spiral"] and lay["floors"][0]["holes"]
    exp = await (await client.get(f"/api/export/property?house={hid}")).json()
    assert [s["type"] for s in exp["building"]["floors"][0]["stairs"]] == ["wall", "spiral"] and exp["building"]["floors"][0]["stairs"][0]["path"][1] == [2.3, 0]
    bad = await client.post("/api/import?dryRun=1", json=_stairs_spec([{"type": "wall", "x": 1, "z": 1}]))
    assert bad.status == 400 and any("path" in e["path"] for e in (await bad.json())["errors"])


def test_wall_stair_landing_length_survives_import_and_export_and_matches_stairs_js():
    js = (Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app" / "static" / "stairs.js").read_text(encoding="utf-8")
    assert int(re.search(r"MAX_LANDING = (\d+)", js).group(1)) == importer.STAIR_MAX_LANDING
    layout, _, rep, _ = importer.build_layout(_stairs_spec([{"type": "wall", "x": 0, "z": 0, "path": [[0, 0], [3, 0], [3, 3]], "landing": 1.2},
                                                           {"type": "wall", "x": 4, "z": 0, "path": [[0, 0], [2, 0]], "landing": 7}]))
    a, b = layout["floors"][0]["stairs"]
    assert a["landing"] == 1.2 and "landing" not in b and any("landing" in str(w) for w in rep.warnings)
    back = importer.layout_to_property(layout)["building"]["floors"][0]["stairs"][0]
    assert back["landing"] == 1.2
