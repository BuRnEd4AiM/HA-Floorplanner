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
