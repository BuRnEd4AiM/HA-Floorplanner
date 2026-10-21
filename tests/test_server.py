import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import server  # noqa: E402


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path))


def glb(size=32):
    return b"glTF" + b"\x00" * size


async def test_layout_default_and_roundtrip(client):
    r = await client.get("/api/layout")
    assert r.status == 200
    assert (await r.json())["floors"][0]["name"] == "Erdgeschoss"

    layout = {"version": 1, "floors": [{"id": "a", "name": "OG", "walls": [], "rooms": [], "devices": []}]}
    assert (await client.put("/api/layout", json=layout)).status == 200
    assert (await (await client.get("/api/layout")).json()) == layout


async def test_layout_refuses_a_save_over_a_plan_changed_on_another_screen(client):
    """#403: two screens open the plan; the second one saving its older state gets 409 instead of overwriting the first one's work."""
    first = await client.get("/api/layout")
    tag = first.headers["ETag"]
    a = {"version": 1, "floors": [{"id": "a", "name": "A", "walls": [], "rooms": [], "devices": []}]}
    b = {"version": 1, "floors": [{"id": "b", "name": "B", "walls": [], "rooms": [], "devices": []}]}
    r = await client.put("/api/layout", json=a, headers={"If-Match": tag})          # screen 1 saves: fine, a new tag comes back
    assert r.status == 200 and r.headers["ETag"] != tag
    tag1 = r.headers["ETag"]
    r = await client.put("/api/layout", json=b, headers={"If-Match": tag})          # screen 2 still has the old tag
    assert r.status == 409 and (await r.json())["conflict"] is True
    assert (await (await client.get("/api/layout")).json()) == a                     # screen 1's work is kept
    assert (await client.get("/api/layout")).headers["ETag"] == tag1
    r = await client.put("/api/layout", json=a, headers={"If-Match": f"W/{tag1}"})   # a proxy may mark the tag as weak
    assert r.status == 200 and r.headers["ETag"] == tag1                            # same content, same tag
    assert (await client.put("/api/layout", json=b)).status == 200                 # no tag ("keep my version", older browsers): saved
    assert (await (await client.get("/api/layout")).json()) == b


async def test_layout_tags_are_per_house(client):
    h = await (await client.post("/api/houses", json={"name": "Zwei"})).json()
    t_main = (await client.get("/api/layout")).headers["ETag"]
    t_two = (await client.get(f"/api/layout?house={h['id']}")).headers["ETag"]
    plan = {"version": 1, "floors": [{"id": "x", "name": "X", "walls": [], "rooms": [], "devices": []}]}
    assert (await client.put(f"/api/layout?house={h['id']}", json=plan, headers={"If-Match": t_two})).status == 200
    assert (await client.put("/api/layout", json=plan, headers={"If-Match": t_main})).status == 200   # the other house did not change


async def test_layout_rejects_garbage(client):
    assert (await client.put("/api/layout", data="not json")).status == 400
    assert (await client.put("/api/layout", json={"nope": 1})).status == 400
    assert (await client.put("/api/layout", json=[1, 2])).status == 400


async def test_settings_defaults_and_validation(client):
    s = await (await client.get("/api/settings")).json()
    assert s["language"] == "auto" and s["theme"] == "dark" and s["grid"] == 0.25      # a new install follows the browser language and starts dark

    r = await client.put("/api/settings", json={"language": "en", "grid": 0.5, "theme": "neon", "evil": 1, "shadows": "yes"})
    s = await r.json()
    assert s["language"] == "en"
    assert s["grid"] == 0.5
    assert s["theme"] == "dark"       # invalid value falls back to the default
    assert s["shadows"] is True       # wrong type ignored
    assert "evil" not in s
    assert (await (await client.get("/api/settings")).json()) == s


async def test_model_upload_list_get_delete(client):
    from aiohttp import FormData
    fd = FormData()
    fd.add_field("file", glb(), filename="My Sofa!.glb", content_type="model/gltf-binary")
    r = await client.post("/api/models", data=fd)
    assert r.status == 201
    name = (await r.json())["name"]
    assert name == "my-sofa"

    fd = FormData()
    fd.add_field("file", glb(), filename="My Sofa!.glb")
    assert (await (await client.post("/api/models", data=fd)).json())["name"] == "my-sofa-2"

    assert len([m for m in await (await client.get("/api/models")).json() if not m.get("builtin")]) == 2
    r = await client.get(f"/api/models/{name}")
    assert r.status == 200 and (await r.read()).startswith(b"glTF")
    assert (await client.delete(f"/api/models/{name}")).status == 200
    assert (await client.get(f"/api/models/{name}")).status == 404


async def test_shipped_models_listed_readable_not_deletable(client):
    items = await (await client.get("/api/models")).json()
    shipped = [m for m in items if m.get("builtin")]
    assert len(shipped) > 50 and all(server.MODEL_NAME.match(m["name"]) for m in shipped)
    name = shipped[0]["name"]
    r = await client.get(f"/api/models/{name}")
    assert r.status == 200 and (await r.read()).startswith(b"glTF")
    assert (await client.delete(f"/api/models/{name}")).status == 404       # not in the user's folder

    from aiohttp import FormData
    fd = FormData()
    fd.add_field("file", glb(), filename=f"{name}.glb")                      # own upload of the same name wins
    assert (await (await client.post("/api/models", data=fd)).json())["name"] == name
    items = await (await client.get("/api/models")).json()
    assert [m for m in items if m["name"] == name] == [{"name": name, "size": 36, "url": f"api/models/{name}"}]


async def test_model_upload_validation(client):
    from aiohttp import FormData
    fd = FormData(); fd.add_field("file", b"hello", filename="x.glb")
    assert (await client.post("/api/models", data=fd)).status == 400       # no glTF magic
    fd = FormData(); fd.add_field("file", glb(), filename="x.obj")
    assert (await client.post("/api/models", data=fd)).status == 400       # wrong extension


async def test_model_path_traversal_blocked(client):
    assert (await client.get("/api/models/..%2Fsettings")).status == 404
    assert (await client.delete("/api/models/..%2Flayout")).status == 404


async def test_entities_and_service_without_supervisor(client):
    assert await (await client.get("/api/entities")).json() == []
    r = await client.post("/api/service", json={"domain": "light", "service": "toggle", "entity_id": "light.x"})
    assert r.status == 503
    assert await (await client.get("/api/areas")).json() == []


def test_area_list_leaves_out_the_side_entities():
    data = [{"id": "kueche", "name": "Küche", "entities": ["switch.h1_ku_sw01", "sensor.h1_ku_sw01_ssid", "sensor.h1_ku_sw01_ip", 5]},
            {"id": "bad", "entities": ["light.bad"]}, "junk"]
    assert server.area_list(data, {"sensor.h1_ku_sw01_ssid", "sensor.h1_ku_sw01_ip"}) == [
        {"id": "bad", "name": "bad", "entities": ["light.bad"], "side": [], "parts": {}},
        {"id": "kueche", "name": "Küche", "entities": ["switch.h1_ku_sw01"], "side": ["sensor.h1_ku_sw01_ssid", "sensor.h1_ku_sw01_ip"], "parts": {}}]   # #368
    parts = {"switch.h1_ku_sw01": "climate.kueche", "switch.elsewhere": "climate.x"}                                   # #370: only the area's own
    assert server.area_list(data, (), parts)[1]["parts"] == {"switch.h1_ku_sw01": "climate.kueche"}
    assert server.area_list(data)[1]["entities"] == ["switch.h1_ku_sw01", "sensor.h1_ku_sw01_ssid", "sensor.h1_ku_sw01_ip"]
    assert server.area_list(None) == []


async def test_areas_leave_out_what_the_registry_keeps_off_the_dashboards(client, aiohttp_server, monkeypatch):
    from aiohttp import web

    async def template(request):              # Home Assistant's template API: the areas with all their entities
        return web.Response(text='[{"id": "kueche", "name": "Küche", "entities": ["switch.sw01", "sensor.sw01_ip"]}]')
    fake = web.Application()
    fake.router.add_post("/template", template)
    ha = await aiohttp_server(fake)
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "HA_API", str(ha.make_url("")).rstrip("/"))
    assert (await (await client.get("/api/areas")).json())[0]["entities"] == ["switch.sw01", "sensor.sw01_ip"]   # the registry not read yet
    client.app[server.KEY_RENAMES]["side"] = {"sensor.sw01_ip"}                                              # what the watcher keeps (#368)
    client.app[server.KEY_RENAMES]["parts"] = {"switch.sw01": "climate.kueche"}                                       # #370
    assert await (await client.get("/api/areas")).json() == [{"id": "kueche", "name": "Küche", "entities": ["switch.sw01"], "side": ["sensor.sw01_ip"],
                                                              "parts": {"switch.sw01": "climate.kueche"}}]


async def test_batteries_are_what_the_registry_watcher_found(client):
    assert await (await client.get("/api/batteries")).json() == {}                       # registry not read (no Home Assistant)
    client.app[server.KEY_RENAMES]["battery"] = {"binary_sensor.door": "sensor.door_battery"}                     # #376
    assert await (await client.get("/api/batteries")).json() == {"binary_sensor.door": "sensor.door_battery"}


async def test_service_whitelist(client, monkeypatch):
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    bad = [
        {"domain": "shell_command", "service": "toggle", "entity_id": "shell_command.x"},
        {"domain": "light", "service": "reload", "entity_id": "light.x"},
        {"domain": "light", "service": "toggle", "entity_id": "switch.x"},
        {"domain": "light", "service": "toggle"},
    ]
    for body in bad:
        assert (await client.post("/api/service", json=body)).status == 400


async def test_index_served(client):
    r = await client.get("/")
    assert r.status == 200 and "3D Floorplan" in await r.text()


async def test_service_data_validation(client, monkeypatch):
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    bad = [
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"brightness_pct": 150}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"evil": 1}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"position": 5}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"rgb_color": [300, 0, 0]}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"rgb_color": [1, 2]}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"color_temp_kelvin": 100}},
        {"domain": "cover", "service": "turn_on", "entity_id": "cover.x", "data": {"rgb_color": [1, 2, 3]}},
        {"domain": "cover", "service": "set_cover_position", "entity_id": "cover.x"},
        {"domain": "cover", "service": "set_cover_position", "entity_id": "cover.x", "data": {"position": True}},
    ]
    for body in bad:
        assert (await client.post("/api/service", json=body)).status == 400


async def test_climate_service_validation(client, monkeypatch):
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    bad = [
        {"domain": "climate", "service": "set_temperature", "entity_id": "climate.x"},
        {"domain": "climate", "service": "set_temperature", "entity_id": "climate.x", "data": {"temperature": 100}},
        {"domain": "climate", "service": "set_temperature", "entity_id": "climate.x", "data": {"temperature": True}},
        {"domain": "climate", "service": "set_temperature", "entity_id": "climate.x", "data": {"temperature": "21"}},
        {"domain": "climate", "service": "set_hvac_mode", "entity_id": "climate.x"},
        {"domain": "climate", "service": "set_hvac_mode", "entity_id": "climate.x", "data": {"hvac_mode": "explode"}},
        {"domain": "light", "service": "set_temperature", "entity_id": "light.x", "data": {"temperature": 20}},
        {"domain": "light", "service": "turn_on", "entity_id": "light.x", "data": {"temperature": 20}},
        {"domain": "light", "service": "set_hvac_mode", "entity_id": "light.x", "data": {"hvac_mode": "heat"}},
    ]
    for body in bad:
        assert (await client.post("/api/service", json=body)).status == 400, body


def test_slim_state_climate_fields():
    st = {"entity_id": "climate.wohnzimmer", "state": "heat", "attributes": {
        "friendly_name": "Wohnzimmer", "current_temperature": 20.5, "temperature": 21, "hvac_action": "heating",
        "min_temp": 7, "max_temp": 30, "target_temp_step": 0.5, "hvac_modes": ["off", "heat", {"x": 1}]}}
    s = server.slim_state(st)
    assert s["hvac"] == "heating" and s["tt"] == 21 and s["tmin"] == 7 and s["tmax"] == 30 and s["tstep"] == 0.5
    assert s["modes"] == ["off", "heat"] and s["ct"] == 20.5
    lamp = server.slim_state({"entity_id": "light.x", "state": "on", "attributes": {"temperature": 5}})
    assert "hvac" not in lamp and "tt" not in lamp          # only thermostats carry the heating fields


def test_slim_state_sun_and_weather():
    """the sky (#418, #419): sun.sun with its elevation and next sunrise / sunset, a weather entity with temperature and wind"""
    sun = server.slim_state({"entity_id": "sun.sun", "state": "above_horizon", "attributes": {
        "elevation": 12.3, "rising": False, "next_rising": "2026-10-18T05:30:00+00:00", "next_setting": "2026-10-17T16:20:00+00:00"}})
    assert sun["sun"] == {"elev": 12.3, "rising": False, "rise": "2026-10-18T05:30:00+00:00", "set": "2026-10-17T16:20:00+00:00"}
    odd = server.slim_state({"entity_id": "sun.sun", "state": "above_horizon", "attributes": {"elevation": "high", "rising": "yes", "next_rising": 5}})
    assert odd["sun"] == {"elev": None, "rising": None, "rise": None, "set": None}
    wx = server.slim_state({"entity_id": "weather.home", "state": "rainy", "attributes": {
        "temperature": 11.4, "temperature_unit": "°C", "wind_speed": 23.6, "wind_speed_unit": "km/h", "humidity": 90}})
    assert wx["wx"] == {"t": 11.4, "tu": "°C", "w": 23.6, "wu": "km/h"}
    lamp = server.slim_state({"entity_id": "light.x", "state": "on", "attributes": {"elevation": 3, "temperature": 5}})
    assert "sun" not in lamp and "wx" not in lamp


async def test_settings_sky_cards_tiles(client):
    """the sky, the energy picture and the room tiles can be switched off (#418, #420, #421); anything else falls back"""
    s = await (await client.put("/api/settings", json={"sky": "off", "energyCard": False, "roomTiles": False})).json()
    assert s["sky"] == "off" and s["energyCard"] is False and s["roomTiles"] is False
    s = await (await client.put("/api/settings", json={"sky": "rainbow", "energyCard": "no", "roomTiles": 0})).json()
    assert s["sky"] == "time" and s["energyCard"] is True and s["roomTiles"] is True


async def test_settings_room_labels_and_window_frames(client):
    """the labels over the rooms can be switched off (#430), the window frames are white or anthracite (#428); anything else falls back"""
    s = await (await client.put("/api/settings", json={"roomLabels": False, "windowFrames": "anthracite"})).json()
    assert s["roomLabels"] is False and s["windowFrames"] == "anthracite"
    s = await (await client.put("/api/settings", json={"roomLabels": "no", "windowFrames": "pink"})).json()
    assert s["roomLabels"] is True and s["windowFrames"] == "white"


async def test_settings_favorites_and_light_groups(client):
    """favourites and light groups (#471): only entities one tap may switch or start, each once; groups with a name, unique ids and room ids"""
    s = await (await client.get("/api/settings")).json()
    assert s["favorites"] == [] and s["lightGroups"] == []
    s = await (await client.put("/api/settings", json={
        "favorites": ["scene.kino", "lock.tuer", "scene.kino", "light.a", "Light.B", 5, "alarm_control_panel.haus"] + [f"light.l{i}" for i in range(30)],
        "lightGroups": [{"id": "kids", "name": "  Kinder ", "rooms": ["k1", "k1", "", 7, "k2"]}, {"id": "kids", "name": "", "rooms": "x"}, "junk",
                        {"name": "x" * 90, "rooms": ["r" * 200]}]})).json()
    assert s["favorites"][:2] == ["scene.kino", "light.a"] and len(s["favorites"]) == 16
    assert s["lightGroups"][0] == {"id": "kids", "name": "Kinder", "rooms": ["k1", "k2"]}
    assert s["lightGroups"][1] == {"id": "kids_", "name": "#2", "rooms": []}
    assert s["lightGroups"][2]["id"] == "g3" and len(s["lightGroups"][2]["name"]) == 40 and s["lightGroups"][2]["rooms"] == []
    assert len(s["lightGroups"]) == 3
    s = await (await client.put("/api/settings", json={"favorites": "light.a", "lightGroups": {"a": 1}})).json()
    assert s["favorites"] == [] and s["lightGroups"] == []
    assert len(server.clean_light_groups([{"id": f"g{i}", "name": "n", "rooms": []} for i in range(20)])) == 12


def test_favorite_domains_match_the_browser():
    """server.FAV_DOMAINS and FAV_SERVICE in static/favorites.js list the same domains (#471)"""
    src = (Path(server.__file__).parent / "static" / "favorites.js").read_text()
    block = src[src.index("export const FAV_SERVICE = {"):src.index("};", src.index("export const FAV_SERVICE = {"))]
    assert set(server.re.findall(r"(\w+): '", block)) == set(server.FAV_DOMAINS)


async def test_settings_facade(client):
    """the outside of the walls (#448): none as always, or a facade pattern with its own colour; woodchip or a bad colour fall back"""
    s = await (await client.get("/api/settings")).json()
    assert s["facade"] == "" and s["facadeColor"] == ""
    s = await (await client.put("/api/settings", json={"facade": "brick", "facadeColor": "#AA3322"})).json()
    assert s["facade"] == "brick" and s["facadeColor"] == "#aa3322"
    s = await (await client.put("/api/settings", json={"facade": "woodchip", "facadeColor": "red"})).json()
    assert s["facade"] == "" and s["facadeColor"] == ""
    s = await (await client.put("/api/settings", json={"facade": "woodCladding", "facadeColor": "red"})).json()
    assert s["facade"] == "woodCladding" and s["facadeColor"] == ""


async def test_settings_look_and_stops(client):
    r = await client.put("/api/settings", json={
        "wallOpacity": 5, "glowRadius": 0.01, "bgTop": "#ABCDEF", "bgBottom": "red",
        "tempStops": [{"v": 25, "c": "#ff0000"}, {"v": 10, "c": "#0000ff"}, {"v": "x", "c": "#000000"}],
        "humidStops": [{"v": 1, "c": "#ffffff"}],
    })
    s = await r.json()
    assert s["wallOpacity"] == 1.0 and s["glowRadius"] == 0.5
    assert s["bgTop"] == "#abcdef" and s["bgBottom"] == "#031547"
    assert [x["v"] for x in s["tempStops"]] == [10.0, 25.0]
    assert len(s["humidStops"]) == 4            # too few valid stops -> defaults


async def test_settings_co2_labels_and_floors_below(client):
    s = await (await client.get("/api/settings")).json()
    assert [x["v"] for x in s["co2Stops"]] == [400.0, 800.0, 1200.0, 2000.0]
    assert s["labelMode"] == "important" and s["belowMode"] == "dim"
    r = await client.put("/api/settings", json={"labelMode": "all", "belowMode": "hidden",
                                                 "co2Stops": [{"v": 500, "c": "#00ff00"}, {"v": 1500, "c": "#ff0000"}]})
    s = await r.json()
    assert s["labelMode"] == "all" and s["belowMode"] == "hidden"
    assert [x["v"] for x in s["co2Stops"]] == [500.0, 1500.0]
    s = await (await client.put("/api/settings", json={"labelMode": "bogus", "belowMode": "bogus"})).json()
    assert s["labelMode"] == "important" and s["belowMode"] == "dim"       # unknown values fall back


async def test_settings_old_show_labels_off_becomes_label_mode_none(client):
    s = await (await client.put("/api/settings", json={"showLabels": False})).json()
    assert s["labelMode"] == "none"
    assert "showLabels" not in s


async def test_camera_image_is_checked_before_anything_is_asked(client, monkeypatch):
    assert (await client.get("/api/camera/light.kueche")).status == 400          # only cameras
    assert (await client.get("/api/camera/camera.../x")).status in (400, 404)
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "")
    assert (await client.get("/api/camera/camera.flur")).status == 503           # no Home Assistant behind it
    await client.put("/api/settings", json={"cameraImages": False})
    assert (await client.get("/api/camera/camera.flur")).status == 403           # switched off in the settings
    assert (await client.get("/api/camera/camera.flur/hls")).status == 403       # the live picture too (#381, #383)
    assert (await client.get("/api/camera/light.kueche/hls")).status == 400
    assert (await client.get("/api/hls/0123456789abcdef/playlist.m3u8")).status == 403


async def test_camera_hls_asks_home_assistant_and_passes_its_files_through(client, monkeypatch, aiohttp_server):
    """#383: the live picture is Home Assistant's HLS stream (websocket camera/stream); its files are complete answers, which the
    Supervisor passes on (an endless MJPEG stream it never did)"""
    from aiohttp import web
    token, asked = "ab" * 16, []

    async def ws(request):
        w = web.WebSocketResponse(); await w.prepare(request)
        await w.send_json({"type": "auth_required"}); await w.receive_json(); await w.send_json({"type": "auth_ok"})
        m = await w.receive_json()
        ok = m["type"] == "camera/stream" and m["entity_id"] == "camera.flur" and m["format"] == "hls"
        await w.send_json({"id": m["id"], "type": "result", "success": ok, "result": {"url": f"/api/hls/{token}/master_playlist.m3u8"} if ok else None,
                           "error": None if ok else {"code": "start_stream_failed", "message": "no stream"}})
        await w.close()
        return w

    async def hls(request):
        asked.append((request.match_info["name"], dict(request.query), request.headers.get("Authorization")))
        if request.match_info["name"] == "init.mp4":
            return web.Response(body=b"\x00\x00\x00\x18ftyp", content_type="video/mp4")
        if request.match_info["name"] == "segment/9.0.m4s":
            return web.Response(status=404)
        return web.Response(text="#EXTM3U\n", content_type="application/vnd.apple.mpegurl")
    fake = web.Application(); fake.router.add_get("/websocket", ws); fake.router.add_get("/hls/{token}/{name:.+}", hls)
    srv = await aiohttp_server(fake)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    r = await client.get("/api/camera/camera.flur/hls")
    assert r.status == 200 and await r.json() == {"url": f"api/hls/{token}/master_playlist.m3u8"}
    assert (await client.get("/api/camera/camera.garten/hls")).status == 404      # no stream: the page shows still images
    r = await client.get(f"/api/hls/{token}/playlist.m3u8?_HLS_msn=12&_HLS_part=3&evil=1")
    assert r.status == 200 and r.headers["Content-Type"].startswith("application/vnd.apple.mpegurl") and await r.text() == "#EXTM3U\n"
    assert asked[-1] == ("playlist.m3u8", {"_HLS_msn": "12", "_HLS_part": "3"}, "Bearer t")       # only the low latency reload is passed on
    r = await client.get(f"/api/hls/{token}/init.mp4")
    assert r.status == 200 and r.headers["Content-Type"] == "video/mp4" and r.headers["Cache-Control"] == "no-store"
    assert (await client.get(f"/api/hls/{token}/segment/9.0.m4s")).status == 404  # a part that is not there yet
    n = len(asked)
    for bad in (f"/api/hls/{token}/../states", f"/api/hls/{token}/states", "/api/hls/XYZ/playlist.m3u8", f"/api/hls/{token}/segment/1.m4s.x"):
        assert (await client.get(bad)).status in (400, 404), bad
    assert len(asked) == n                                                          # nothing else is asked from Home Assistant


async def test_editors_permissions(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["Admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    server._admin_cache.update(at=float("-inf"), ids=None)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    layout = {"version": 1, "floors": []}
    tablet, admin = {"X-Remote-User-Name": "tablet_wz"}, {"X-Remote-User-Name": "admin"}
    assert (await client.put("/api/layout", json=layout, headers=tablet)).status == 403
    assert (await client.put("/api/settings", json={"grid": 0.5}, headers=tablet)).status == 403
    assert (await client.put("/api/layout", json=layout)).status == 403                 # no user header at all
    assert (await client.put("/api/layout", json=layout, headers=admin)).status == 200
    assert (await client.get("/api/layout", headers=tablet)).status == 200              # reading is always allowed
    me = await (await client.get("/api/me", headers=tablet)).json()
    assert me["canEdit"] is False and me["user"] == "tablet_wz"
    assert (await (await client.get("/api/me", headers=admin)).json())["canEdit"] is True


async def _no_admins():
    return None


async def test_admins_may_edit_everyone_else_is_read_only(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": []}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)

    async def admins():
        return {"abc123", "admin"}
    monkeypatch.setattr(server, "load_admin_ids", admins)
    layout = {"version": 1, "floors": []}
    by_id, by_name, tablet = {"X-Remote-User-Id": "ABC123"}, {"X-Remote-User-Name": "Admin"}, {"X-Remote-User-Name": "tablet_wz", "X-Remote-User-Id": "zzz"}
    assert (await client.put("/api/layout", json=layout, headers=by_id)).status == 200
    assert (await client.put("/api/layout", json=layout, headers=by_name)).status == 200
    assert (await client.put("/api/layout", json=layout, headers=tablet)).status == 403
    assert (await client.put("/api/layout", json=layout)).status == 403
    assert (await (await client.get("/api/me", headers=tablet)).json())["canEdit"] is False


async def test_unknown_admins_fail_closed_but_editors_still_work(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    layout = {"version": 1, "floors": []}
    assert (await client.put("/api/layout", json=layout, headers={"X-Remote-User-Name": "admin"})).status == 200
    assert (await client.put("/api/layout", json=layout, headers={"X-Remote-User-Name": "other"})).status == 403


async def test_room_mapping(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    admin = {"X-Remote-User-Name": "admin"}
    r = await client.put("/api/settings", json={"userRooms": {"Tablet_WZ": "Wohnzimmer", "x": 5}}, headers=admin)
    assert (await r.json())["userRooms"] == {"Tablet_WZ": "Wohnzimmer"}
    me = await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet_wz"})).json()
    assert me["room"] == "Wohnzimmer" and me["canEdit"] is False
    assert (await (await client.get("/api/me", headers=admin)).json())["room"] is None


async def test_load_admin_ids_via_websocket(aiohttp_server, monkeypatch):
    from aiohttp import web

    async def ws_handler(request):
        ws = web.WebSocketResponse(); await ws.prepare(request)
        await ws.send_json({"type": "auth_required"})
        auth = await ws.receive_json()
        assert auth["access_token"] == "tok"
        await ws.send_json({"type": "auth_ok"})
        msg = await ws.receive_json()
        assert msg["type"] == "config/auth/list"
        await ws.send_json({"id": msg["id"], "type": "result", "success": True, "result": [
            {"id": "AAA", "username": "Admin", "group_ids": ["system-admin"], "is_owner": False},
            {"id": "bbb", "username": "tablet", "group_ids": ["system-users"], "is_owner": False},
            {"id": "ccc", "username": "owner", "group_ids": [], "is_owner": True}]})
        await ws.close(); return ws
    app = web.Application(); app.add_routes([web.get("/websocket", ws_handler)])
    srv = await aiohttp_server(app)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "tok")
    server._admin_cache.update(at=float("-inf"), ids=None)
    ids = await server.load_admin_ids()
    assert ids == {"aaa", "admin", "ccc", "owner"}


async def test_load_admin_ids_unreachable_is_none(monkeypatch):
    monkeypatch.setattr(server, "HA_API", "http://localhost:9")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "tok")
    server._admin_cache.update(at=float("-inf"), ids=None)
    assert await server.load_admin_ids() is None


async def test_user_views_validation_and_me_view(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    admin = {"X-Remote-User-Name": "admin"}
    r = await client.put("/api/settings", json={"userViews": {"tablet_wz": "split", "kid": "hologram", "x": 5}}, headers=admin)
    assert (await r.json())["userViews"] == {"tablet_wz": "split"}
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet_wz"})).json())["view"] == "split"
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "someone"})).json())["view"] == "3d"


async def test_user_building_and_its_lock_reach_the_user(client, monkeypatch, tmp_path):
    """#409: the building of a plan a user / tablet sees (users dialog), and the lock that keeps it there."""
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    admin = {"X-Remote-User-Name": "admin"}
    r = await client.put("/api/settings", json={"userBuildings": {"tablet_gh": "b123", "bad": 5}, "userLocks": {"tablet_gh": ["building", "nope"]}}, headers=admin)
    s = await r.json()
    assert s["userBuildings"] == {"tablet_gh": "b123"} and s["userLocks"] == {"tablet_gh": ["building"]}
    me = await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet_gh"})).json()
    assert me["building"] == "b123" and me["locks"] == ["building"]
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "someone"})).json())["building"] is None


async def test_a_users_file_from_before_the_buildings_keeps_them(aiohttp_client, tmp_path):
    import json
    (tmp_path / "cfg").mkdir()
    c = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    await c.put("/api/settings", json={"userBuildings": {"tab": "b1"}, "userRooms": {"tab": "Flur"}})
    (tmp_path / "cfg" / "users.json").write_text(json.dumps({"userRooms": {"tab": "Bad"}}), "utf-8")   # written by an older version
    s = await (await c.post("/api/users-file/sync", json={})).json()
    assert s["userRooms"] == {"tab": "Bad"} and s["userBuildings"] == {"tab": "b1"}


async def test_users_endpoint_editors_only(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    server._admin_cache["users"] = [{"username": "admin", "name": "Admin", "admin": True}]
    assert (await client.get("/api/users", headers={"X-Remote-User-Name": "tablet"})).status == 403
    us = await (await client.get("/api/users", headers={"X-Remote-User-Name": "admin"})).json()
    assert us == [{"username": "admin", "name": "Admin", "admin": True}]
    server._admin_cache["users"] = []


async def test_light_effect_is_whitelisted(client, monkeypatch, aiohttp_server):
    from aiohttp import web
    seen = []

    async def svc(request):
        seen.append(await request.json()); return web.json_response([])
    app = web.Application(); app.add_routes([web.post("/services/{d}/{s}", svc)])
    srv = await aiohttp_server(app)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    ok = await client.post("/api/service", json={"domain": "light", "service": "turn_on", "entity_id": "light.a", "data": {"effect": "Nordlicht"}})
    assert ok.status == 200 and seen[0]["effect"] == "Nordlicht"
    bad = await client.post("/api/service", json={"domain": "switch", "service": "turn_on", "entity_id": "switch.a", "data": {"effect": "x"}})
    assert bad.status == 400
    bad2 = await client.post("/api/service", json={"domain": "light", "service": "turn_on", "entity_id": "light.a", "data": {"effect": 5}})
    assert bad2.status == 400


# ---------- background images ----------
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
WEBP = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 16


async def test_background_upload_get_delete(client):
    from aiohttp import FormData
    for data, ctype in ((PNG, "image/png"), (JPG, "image/jpeg"), (WEBP, "image/webp")):
        fd = FormData(); fd.add_field("file", data, filename="plan.whatever")
        r = await client.post("/api/backgrounds", data=fd)
        assert r.status == 201
        name = (await r.json())["name"]
        assert server.BG_NAME.match(name)
        g = await client.get(f"/api/backgrounds/{name}")
        assert g.status == 200 and g.headers["Content-Type"].startswith(ctype) and await g.read() == data
        assert (await client.delete(f"/api/backgrounds/{name}")).status == 200
        assert (await client.get(f"/api/backgrounds/{name}")).status == 404


async def test_background_validation_and_traversal(client):
    from aiohttp import FormData
    fd = FormData(); fd.add_field("file", b"<svg onload=alert(1)></svg>", filename="x.png")
    assert (await client.post("/api/backgrounds", data=fd)).status == 400       # SVG / not an image
    fd = FormData(); fd.add_field("file", PNG + b"0" * (server.MAX_BG_BYTES + 1), filename="big.png")
    assert (await client.post("/api/backgrounds", data=fd)).status == 413
    assert (await client.get("/api/backgrounds/..%2Flayout.json")).status == 404
    assert (await client.get("/api/backgrounds/aaaaaaaaaaaa.png")).status == 404
    assert (await client.delete("/api/backgrounds/..%2Fsettings.json")).status == 404


async def test_background_upload_needs_editor(client, monkeypatch, tmp_path):
    from aiohttp import FormData
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    fd = FormData(); fd.add_field("file", PNG, filename="a.png")
    assert (await client.post("/api/backgrounds", data=fd, headers={"X-Remote-User-Name": "tablet"})).status == 403
    fd = FormData(); fd.add_field("file", PNG, filename="a.png")
    r = await client.post("/api/backgrounds", data=fd, headers={"X-Remote-User-Name": "admin"})
    assert r.status == 201
    name = (await r.json())["name"]
    assert (await client.delete(f"/api/backgrounds/{name}", headers={"X-Remote-User-Name": "tablet"})).status == 403


async def test_houses_create_rename_delete(client):
    hs = await (await client.get("/api/houses")).json()
    assert len(hs) == 1 and hs[0]["id"] == "main"
    # the original plan stays the first house
    layout = {"version": 1, "floors": [{"id": "a", "name": "Mein Haus EG", "walls": [], "rooms": [], "devices": []}]}
    assert (await client.put("/api/layout", json=layout)).status == 200
    r = await client.post("/api/houses", json={"name": "Eltern"})
    assert r.status == 200
    hid = (await r.json())["id"]
    other = await (await client.get(f"/api/layout?house={hid}")).json()
    assert other["floors"][0]["name"] == "Erdgeschoss"                                  # new house starts empty
    other["floors"][0]["name"] = "Eltern EG"
    assert (await client.put(f"/api/layout?house={hid}", json=other)).status == 200
    assert (await (await client.get("/api/layout")).json()) == layout                    # the other house is untouched
    assert (await (await client.get(f"/api/layout?house={hid}")).json())["floors"][0]["name"] == "Eltern EG"
    assert (await client.patch(f"/api/houses/{hid}", json={"name": "Bei den Eltern"})).status == 200
    assert {h["name"] for h in await (await client.get("/api/houses")).json()} == {"Haus", "Bei den Eltern"}
    cp = await (await client.post("/api/houses", json={"name": "Kopie", "copyFrom": hid})).json()
    assert (await (await client.get(f"/api/layout?house={cp['id']}")).json())["floors"][0]["name"] == "Eltern EG"
    assert (await client.get("/api/layout?house=nope")).status == 404
    assert (await client.delete(f"/api/houses/{hid}")).status == 200
    assert (await client.get(f"/api/layout?house={hid}")).status == 404
    assert (await client.post("/api/houses", json={"name": " "})).status == 400


async def test_houses_cannot_delete_last(client):
    assert (await client.delete("/api/houses/main")).status == 400


async def test_houses_need_editor(client, monkeypatch, tmp_path):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["Admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    server._admin_cache.update(at=float("-inf"), ids=None)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    tablet = {"X-Remote-User-Name": "tablet_wz"}
    assert (await client.post("/api/houses", json={"name": "X"}, headers=tablet)).status == 403
    assert (await client.delete("/api/houses/main", headers=tablet)).status == 403


async def test_backup_roundtrip(client):
    import base64
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 32
    layout = {"version": 1, "floors": [{"id": "a", "name": "Mein EG", "walls": [], "rooms": [], "devices": []}]}
    assert (await client.put("/api/layout", json=layout)).status == 200
    hid = (await (await client.post("/api/houses", json={"name": "Eltern"})).json())["id"]
    import aiohttp
    fd = aiohttp.FormData(); fd.add_field("file", png, filename="a.png")
    bg = (await (await client.post("/api/backgrounds", data=fd)).json())["name"]
    r = await client.get("/api/backup")
    assert r.status == 200 and "attachment" in r.headers["Content-Disposition"]
    backup = await r.json()
    assert backup["format"] == "floorplan3d-backup" and len(backup["houses"]) == 2 and bg in backup["backgrounds"]
    # wreck the data, then restore
    assert (await client.delete(f"/api/houses/{hid}")).status == 200
    assert (await client.delete(f"/api/backgrounds/{bg}")).status == 200
    assert (await client.put("/api/layout", json={"version": 1, "floors": []})).status == 200
    r = await client.post("/api/backup", json=backup)
    assert r.status == 200 and (await r.json())["houses"] == 2
    assert {h["name"] for h in await (await client.get("/api/houses")).json()} == {"Haus", "Eltern"}
    assert (await (await client.get("/api/layout")).json()) == layout
    assert (await client.get(f"/api/backgrounds/{bg}")).status == 200


async def test_backup_rejects_bad_input(client):
    assert (await client.post("/api/backup", json={"format": "x"})).status == 400
    bad = {"format": "floorplan3d-backup", "houses": [{"id": "main", "name": "H", "layout": {"floors": []}}], "backgrounds": {"../../etc.png": "AAAA"}}
    assert (await client.post("/api/backup", json=bad)).status == 400
    bad["backgrounds"] = {}
    bad["models"] = {"evil.glb": "AAAA"}
    assert (await client.post("/api/backup", json=bad)).status == 400


async def test_settings_stale_write_rejected_and_backup(client):
    r = await client.get("/api/settings")
    etag = r.headers["ETag"]
    body = await r.json()
    body["userRooms"] = {"tablet": "WZFL"}
    r = await client.put("/api/settings", json=body, headers={"If-Match": etag})
    assert r.status == 200
    new_etag = r.headers["ETag"]
    # a browser that still has the old state must not overwrite the newer settings
    stale = await client.put("/api/settings", json={"userRooms": {}}, headers={"If-Match": etag})
    assert stale.status == 409
    assert (await (await client.get("/api/settings")).json())["userRooms"] == {"tablet": "WZFL"}
    ok = await client.put("/api/settings", json=body | {"userViews": {"tablet": "2d"}}, headers={"If-Match": new_etag})
    assert ok.status == 200


async def test_settings_restored_from_backup_when_file_damaged(client, tmp_path):
    body = await (await client.get("/api/settings")).json()
    body["userRooms"] = {"tablet": "WZFL"}
    assert (await client.put("/api/settings", json=body)).status == 200
    for p in tmp_path.rglob("settings.json"):
        p.write_text("{ broken")
    assert (await (await client.get("/api/settings")).json())["userRooms"] == {"tablet": "WZFL"}


def test_addon_changelog_is_current():
    """Home Assistant shows floorplan3d/CHANGELOG.md in the update dialog - it must equal the root changelog."""
    root = Path(__file__).resolve().parent.parent
    assert (root / "floorplan3d" / "CHANGELOG.md").read_text() == (root / "CHANGELOG.md").read_text()


def test_effect_colors_setting_is_kept_and_cleaned():
    out = server.validate_settings({"effectColors": {"Gaming": "#aa50ff", "": "x", "Bad": 5}})
    assert out["effectColors"] == {"Gaming": "#aa50ff"}


async def test_language_setting_accepts_known_codes_only(client):
    for code, expected in (("fr", "fr"), ("auto", "auto"), ("klingon", "auto")):
        r = await client.put("/api/settings", json={"language": code})
        assert r.status == 200
        assert (await (await client.get("/api/settings")).json())["language"] == expected


async def test_background_glow_is_off_by_default_and_clamped(client):
    s = await (await client.get("/api/settings")).json()
    assert s["bgGlowStrength"] == 0
    await client.put("/api/settings", json={"bgGlowStrength": 5})
    assert (await (await client.get("/api/settings")).json())["bgGlowStrength"] == 1.0


async def test_live_channel_without_home_assistant_says_so(client):
    ws = await client.ws_connect("/api/live")
    assert await ws.receive_json() == {"type": "upstream", "ok": False}
    await ws.close()


async def test_live_channel_pushes_state_changes(aiohttp_client, aiohttp_server, monkeypatch, tmp_path):
    import asyncio
    from aiohttp import web
    go = asyncio.Event()

    async def ha_ws(request):
        ws = web.WebSocketResponse(); await ws.prepare(request)
        await ws.send_json({"type": "auth_required"})
        assert (await ws.receive_json())["access_token"] == "tok"
        await ws.send_json({"type": "auth_ok"})
        sub = await ws.receive_json()
        assert sub["type"] == "subscribe_events" and sub["event_type"] == "state_changed"
        await ws.send_json({"id": sub["id"], "type": "result", "success": True, "result": None})
        await go.wait()
        ev = lambda eid, new: {"id": sub["id"], "type": "event", "event": {"event_type": "state_changed", "data": {"entity_id": eid, "new_state": new}}}
        await ws.send_json(ev("light.a", {"entity_id": "light.a", "state": "on", "attributes": {"friendly_name": "A", "brightness": 128, "rgb_color": [255, 0, 0]}}))
        await ws.send_json(ev("light.a", {"entity_id": "light.a", "state": "on", "attributes": {"friendly_name": "A", "brightness": 255}}))   # same entity twice: last one wins
        await ws.send_json(ev("sensor.gone", None))
        await asyncio.sleep(1)
        await ws.close(); return ws
    ha = web.Application(); ha.add_routes([web.get("/websocket", ha_ws)])
    srv = await aiohttp_server(ha)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "tok")
    client = await aiohttp_client(server.make_app(tmp_path))
    ws = await client.ws_connect("/api/live")
    assert await ws.receive_json() == {"type": "upstream", "ok": False}
    assert await asyncio.wait_for(ws.receive_json(), 5) == {"type": "upstream", "ok": True}
    go.set()
    msg = await asyncio.wait_for(ws.receive_json(), 5)
    assert msg["type"] == "states" and msg["removed"] == ["sensor.gone"]
    assert [(e["entity_id"], e["state"], e["brightness"], e["rgb"]) for e in msg["list"]] == [("light.a", "on", 100, None)]
    assert await asyncio.wait_for(ws.receive_json(), 5) == {"type": "upstream", "ok": False}   # HA went away: browsers poll again
    await ws.close()


async def test_house_floors_setting_accepts_known_modes_only(client):
    s = await (await client.get("/api/settings")).json()
    assert s["houseFloors"] == "normal"                                       # the whole-house view as built
    for mode in ("apart", "stacked", "normal"):
        assert (await (await client.put("/api/settings", json={**s, "houseFloors": mode})).json())["houseFloors"] == mode
        s = await (await client.get("/api/settings")).json()
    assert (await (await client.put("/api/settings", json={**s, "houseFloors": "sideways"})).json())["houseFloors"] == "normal"


async def test_earth_setting_accepts_known_modes_only(client):
    s = await (await client.get("/api/settings")).json()
    assert s["earth"] == "solid"
    for mode in ("off", "glass", "solid"):
        assert (await (await client.put("/api/settings", json={**s, "earth": mode})).json())["earth"] == mode
        s = await (await client.get("/api/settings")).json()
    assert (await (await client.put("/api/settings", json={**s, "earth": "mud"})).json())["earth"] == "solid"


async def test_earth_margin_is_a_clamped_length(client):
    s = await (await client.get("/api/settings")).json()
    assert s["earthMargin"] == 5.0
    assert (await (await client.put("/api/settings", json={**s, "earthMargin": 12})).json())["earthMargin"] == 12.0
    s = await (await client.get("/api/settings")).json()
    assert (await (await client.put("/api/settings", json={**s, "earthMargin": 5000})).json())["earthMargin"] == 100.0


def test_slim_state_battery_level_of_its_own():
    assert server.slim_state({"entity_id": "vacuum.robbi", "state": "docked", "attributes": {"battery_level": 87}})["bat"] == 87
    assert server.slim_state({"entity_id": "vacuum.robbi", "state": "docked", "attributes": {"battery_level": "87"}})["bat"] is None
    assert server.slim_state({"entity_id": "light.x", "state": "on", "attributes": {}})["bat"] is None


def test_slim_state_says_since_when_an_entity_is_offline():
    st = {"entity_id": "light.a", "state": "unavailable", "last_changed": "2026-10-01T10:00:00+00:00", "attributes": {}}
    assert server.slim_state(st)["since"] == "2026-10-01T10:00:00+00:00"
    assert server.slim_state({**st, "state": "on"})["since"] is None


def test_kiosk_and_alert_settings_are_validated():
    s = server.validate_settings({"idleReturn": 5, "nightDim": "time", "nightFrom": "23:30", "nightTo": "6:00",
                                  "weatherEntity": "weather.home", "alerts": False, "alertJump": True})
    assert s["idleReturn"] == 5.0 and s["nightDim"] == "time" and s["nightFrom"] == "23:30"
    assert s["nightTo"] == "06:00"            # not HH:MM: back to the default
    assert s["weatherEntity"] == "weather.home" and s["alerts"] is False and s["alertJump"] is True
    s = server.validate_settings({"idleReturn": 0, "nightDim": "always", "weatherEntity": "sensor.x", "idleReturn2": 1})
    assert s["idleReturn"] == 0.0 and s["nightDim"] == "off" and s["weatherEntity"] == ""
    assert server.validate_settings({"idleReturn": 999})["idleReturn"] == 240.0


async def test_start_views_are_cleaned_and_reach_the_right_user(client, tmp_path):
    """#315: a saved start view for everybody ("*") and per user; junk is dropped, a user without one gets everybody's."""
    admin = {"X-Remote-User-Name": "admin"}
    all_v = {"house": "main", "floor": "f1", "idx": 1, "whole": False, "room": "r1", "cam": [1.23456, 2, 3], "target": [0, 0, 0], "x": 1}
    own = {"whole": True, "cam": [5, 6, 7], "target": [1, 1, 1]}
    r = await client.put("/api/settings", json={"startViews": {"*": all_v, "Tablet_WZ": own, "bad": {"cam": [1, 2]}, "worse": 3}}, headers=admin)
    s = await r.json()
    assert set(s["startViews"]) == {"*", "Tablet_WZ"}
    assert s["startViews"]["*"] == {"house": "main", "floor": "f1", "idx": 1, "whole": False, "room": "r1", "cam": [1.235, 2.0, 3.0], "target": [0.0, 0.0, 0.0]}
    assert s["startViews"]["Tablet_WZ"]["whole"] is True and s["startViews"]["Tablet_WZ"]["idx"] == -1
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet_wz"})).json())["start"]["cam"] == [5.0, 6.0, 7.0]
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "someone"})).json())["start"]["room"] == "r1"
    st = await (await client.get("/api/users-file")).json()
    assert st["inSync"] and st["users"] == 1                          # "*" is not a user


async def test_view_presets_per_user_are_cleaned_and_reach_that_user_only(client, tmp_path):
    """#250: a user / tablet gets its own start values for the look; junk fields, values and empty presets are dropped."""
    admin = {"X-Remote-User-Name": "admin"}
    body = {"userPresets": {"Tablet_WZ": {"seeThrough": True, "labelMode": "none", "belowLabels": False, "theme": "dark", "cutaway": 1},
                            "kid": {"belowMode": "bogus"}, "x": "nope"}, "belowLabels": False}
    r = await client.put("/api/settings", json=body, headers=admin)
    s = await r.json()
    assert s["userPresets"] == {"Tablet_WZ": {"seeThrough": True, "labelMode": "none", "belowLabels": False}}
    assert s["belowLabels"] is False
    me = await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet_wz"})).json()
    assert me["preset"] == {"seeThrough": True, "labelMode": "none", "belowLabels": False}
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "someone"})).json())["preset"] == {}
    import json
    assert json.loads((tmp_path / "addon_config" / "users.json").read_text("utf-8"))["userPresets"] == s["userPresets"]   # mirrored too
    st = await (await client.get("/api/users-file")).json()
    assert st["inSync"] and st["users"] == 1


async def test_locks_per_user_are_cleaned_reach_that_user_and_are_enforced(client, monkeypatch, tmp_path):
    """A user can be locked out of things; switching and camera images are refused by the server too."""
    body = {"userLocks": {"Kid": ["control", "cameras", "bogus", "control"], "empty": ["nope"], "x": "control"}}
    s = await (await client.put("/api/settings", json=body)).json()
    assert s["userLocks"] == {"Kid": ["control", "cameras"]}
    kid, other = {"X-Remote-User-Name": "kid"}, {"X-Remote-User-Name": "someone"}
    assert (await (await client.get("/api/me", headers=kid)).json())["locks"] == ["control", "cameras"]
    assert (await (await client.get("/api/me", headers=other)).json())["locks"] == []
    assert (await client.get("/api/camera/camera.flur", headers=kid)).status == 403
    assert (await client.get("/api/camera/camera.flur", headers=other)).status == 503         # not locked: only no Home Assistant behind it
    import json
    assert json.loads((tmp_path / "addon_config" / "users.json").read_text("utf-8"))["userLocks"] == s["userLocks"]   # mirrored too
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    r = await client.post("/api/service", json={"domain": "light", "service": "toggle", "entity_id": "light.x"}, headers=kid)
    assert r.status == 403


async def test_the_alarm_panel_can_be_locked_for_a_user(client, monkeypatch):
    """#406: arming and disarming the alarm can be taken away from a tablet on its own; the server refuses it"""
    s = await (await client.put("/api/settings", json={"userLocks": {"Flur": ["alarm"]}})).json()
    assert s["userLocks"] == {"Flur": ["alarm"]}
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    flur = {"X-Remote-User-Name": "flur"}
    r = await client.post("/api/service", json={"domain": "alarm_control_panel", "service": "alarm_disarm", "entity_id": "alarm_control_panel.haus",
                                                "data": {"code": "1234"}}, headers=flur)
    assert r.status == 403
    r = await client.post("/api/service", json={"domain": "alarm_control_panel", "service": "alarm_trigger", "entity_id": "alarm_control_panel.haus"})
    assert r.status == 400                                    # not a service the plan offers, for anybody


def test_slim_state_carries_what_the_live_card_controls():
    s = server.slim_state({"entity_id": "media_player.tv", "state": "playing", "attributes": {"volume_level": 0.5, "media_title": "Song"}})
    assert s["ctl"] == {"vol": 50, "title": "Song"}
    assert server.slim_state({"entity_id": "light.x", "state": "on", "attributes": {}})["ctl"] is None


async def test_users_and_tablets_are_mirrored_into_the_config_folder_and_synced_back(client, tmp_path):
    cfg = tmp_path / "addon_config" / "users.json"
    assert (await (await client.get("/api/users-file")).json())["exists"] is False
    await client.put("/api/settings", json={"userRooms": {"tablet_kueche": "Küche"}, "userViews": {"tablet_kueche": "2d", "tv": "bogus"}})
    import json
    assert json.loads(cfg.read_text("utf-8")) == {"version": 1, "userRooms": {"tablet_kueche": "Küche"}, "userViews": {"tablet_kueche": "2d"}, "userPresets": {}, "userLocks": {}, "startViews": {}, "userBuildings": {}, "userTabs": {}}
    st = await (await client.get("/api/users-file")).json()
    assert st["exists"] and st["inSync"] and st["users"] == 1

    # the file in the HA folder is edited / restored: the sync button loads it into the add-on
    cfg.write_text(json.dumps({"userRooms": {"tablet_bad": "Bad"}, "userViews": {"tablet_bad": "3d", "x": "evil"}}), "utf-8")
    assert (await (await client.get("/api/users-file")).json())["inSync"] is False
    s = await (await client.post("/api/users-file/sync", json={})).json()
    assert s["userRooms"] == {"tablet_bad": "Bad"} and s["userViews"] == {"tablet_bad": "3d"} and s["language"]       # other settings stay
    assert (await (await client.get("/api/settings")).json())["userRooms"] == {"tablet_bad": "Bad"}

    # the other way: the add-on state is written into the folder
    await client.put("/api/settings", json={"userRooms": {"a": "Büro"}})
    cfg.unlink()
    assert (await client.post("/api/users-file/sync", json={"direction": "load"})).status == 404
    assert (await client.post("/api/users-file/sync", json={"direction": "save"})).status == 200
    assert json.loads(cfg.read_text("utf-8"))["userRooms"] == {"a": "Büro"}


async def test_fresh_install_gets_users_and_tablets_back_from_the_config_folder(aiohttp_client, tmp_path):
    import json
    (tmp_path / "cfg").mkdir()
    (tmp_path / "cfg" / "users.json").write_text(json.dumps({"userRooms": {"tab": "Flur"}, "userViews": {"tab": "split"}}), "utf-8")
    c = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    s = await (await c.get("/api/settings")).json()
    assert s["userRooms"] == {"tab": "Flur"} and s["userViews"] == {"tab": "split"}


async def test_update_from_an_older_version_creates_users_json_at_startup(aiohttp_client, tmp_path):
    import json
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "settings.json").write_text(json.dumps({"userRooms": {"tab": "WZ"}, "userViews": {"tab": "2d"}}), "utf-8")
    c = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    assert json.loads((tmp_path / "cfg" / "users.json").read_text("utf-8"))["userRooms"] == {"tab": "WZ"}
    st = await (await c.get("/api/users-file")).json()
    assert st["exists"] and st["inSync"]


async def test_startup_never_overwrites_an_existing_users_json(aiohttp_client, tmp_path):
    import json
    (tmp_path / "data").mkdir(); (tmp_path / "cfg").mkdir()
    (tmp_path / "data" / "settings.json").write_text(json.dumps({"userRooms": {"new": "A"}}), "utf-8")
    (tmp_path / "cfg" / "users.json").write_text(json.dumps({"userRooms": {"kept": "B"}}), "utf-8")
    await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    assert json.loads((tmp_path / "cfg" / "users.json").read_text("utf-8"))["userRooms"] == {"kept": "B"}


async def test_language_follows_the_browser_until_somebody_picks_one(aiohttp_client, tmp_path):
    """Settings stored before "auto" was the default (language "de" nobody chose) start with auto; a picked language stays."""
    import json
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "settings.json").write_text(json.dumps({"language": "de", "theme": "dark"}), "utf-8")
    client = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "cfg"))
    get = lambda: client.get("/api/settings")
    assert (await (await get()).json())["language"] == "auto"
    r = await client.put("/api/settings", json={"grid": 0.5})                  # saving something else does not count as a choice
    assert r.status == 200 and (await (await get()).json())["language"] == "auto"
    r = await client.put("/api/settings", json={"language": "fr"})
    s = await (await get()).json()
    assert s["language"] == "fr" and s["langChosen"] is True
    r = await client.put("/api/settings", json={"language": "fr", "grid": 0.25})      # the page sends everything it knows: the choice stays
    assert (await (await get()).json())["language"] == "fr"


async def test_live_channel_a_stuck_browser_does_not_hold_up_the_others(monkeypatch):
    """#323: a tablet asleep that takes no messages used to delay every other browser until the heartbeat noticed it (up to 30 s)."""
    import asyncio
    monkeypatch.setattr(server.LiveHub, "SEND_TIMEOUT", 0.2)

    class Browser:
        def __init__(self, stuck=False):
            self.stuck, self.got, self.closed = stuck, [], False

        async def send_json(self, msg):
            if self.stuck:
                await asyncio.sleep(3600)
            self.got.append(msg)

        async def close(self):
            self.closed = True

    hub = server.LiveHub()
    asleep, awake = Browser(stuck=True), Browser()
    await hub.add(asleep)
    await hub.add(awake)
    hub.queue("light.a", {"entity_id": "light.a", "state": "on"})
    await asyncio.sleep(server.LiveHub.BATCH + 0.05)
    assert awake.got[-1]["type"] == "states" and awake.got[-1]["list"][0]["state"] == "on"   # at once, not after the stuck one
    await asyncio.sleep(0.4)
    assert asleep not in hub.clients and asleep.closed                                       # dropped: it reconnects and catches up
    assert awake in hub.clients
    hub.remove(awake)


async def test_interface_files_are_always_revalidated(client):
    """#328: without Cache-Control the browser kept an old modelfx.js next to a new app.js after an update and the page stayed empty."""
    for path in ("/", "/app.js", "/bootguard.js", "/style.css"):
        r = await client.get(path)
        assert r.status == 200 and r.headers.get("Cache-Control") == "no-cache", path
    assert "bootguard.js" in await (await client.get("/")).text()
    assert (await client.get("/api/settings")).headers.get("Cache-Control") is None     # the API keeps its own headers


async def test_camera_pictures_and_hls_files_are_read_to_their_end(client, monkeypatch, aiohttp_server):
    """A still image or a video piece comes from Home Assistant in several pieces (through the Supervisor). The whole answer must be
    passed on, not only what had arrived at the first look: a cut JPEG shows black, a cut video piece never plays."""
    import asyncio
    from aiohttp import web
    pic = b"\xff\xd8" + bytes(range(256)) * 1200 + b"\xff\xd9"            # about 300 KB

    async def slowly(request, ctype):
        r = web.StreamResponse()
        r.content_type = ctype
        await r.prepare(request)
        for i in range(0, len(pic), 40000):
            await r.write(pic[i:i + 40000])
            await asyncio.sleep(0.02)
        return r

    async def proxy(request): return await slowly(request, "image/jpeg")
    async def hls(request): return await slowly(request, "video/iso.segment")
    fake = web.Application(); fake.router.add_get("/camera_proxy/{e}", proxy); fake.router.add_get("/hls/{token}/{name:.+}", hls)
    srv = await aiohttp_server(fake)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    r = await client.get("/api/camera/camera.flur")
    assert r.status == 200 and await r.read() == pic
    r = await client.get(f"/api/hls/{'ab' * 16}/segment/3.1.m4s")
    assert r.status == 200 and await r.read() == pic
    monkeypatch.setattr(server, "MAX_CAMERA_BYTES", 100000)
    assert (await client.get("/api/camera/camera.flur")).status == 502              # too big: refused, not cut


def test_energy_dashboard_sensors_and_their_devices():
    """#407: the entities the energy dashboard names (flat and older nested form, no external statistics), and the other sensors of
    each one's device (where its power sensor usually is)."""
    prefs = {"energy_sources": [
        {"type": "grid", "flow_from": [{"stat_energy_from": "sensor.imp_kwh"}], "flow_to": [{"stat_energy_to": "sensor.exp_kwh"}],
         "power": [{"stat_rate": "sensor.grid_w", "power_config": {"stat_rate_inverted": "sensor.grid_raw"}}]},
        {"type": "solar", "stat_energy_from": "sensor.pv_kwh"}, {"type": "gas", "stat_energy_from": "external:gas_total"},
        {"type": "battery", "stat_energy_from": "sensor.bout", "stat_soc": "sensor.soc"}],
        "device_consumption": [{"stat_consumption": "sensor.wm_kwh", "stat_rate": "sensor.wm_w"}]}
    assert server.energy_stat_ids(prefs) == {"sensor.imp_kwh", "sensor.exp_kwh", "sensor.grid_w", "sensor.grid_raw", "sensor.pv_kwh", "sensor.bout",
                                             "sensor.soc", "sensor.wm_kwh", "sensor.wm_w"}
    reg = [{"entity_id": "sensor.pv_kwh", "device_id": "inv"}, {"entity_id": "sensor.pv_w", "device_id": "inv"}, {"entity_id": "switch.inv", "device_id": "inv"},
           {"entity_id": "sensor.imp_kwh", "device_id": "meter"}, {"entity_id": "sensor.meter_w", "device_id": "meter"}, {"entity_id": "sensor.lonely", "device_id": None}]
    assert server.energy_siblings(prefs, reg) == {"sensor.imp_kwh": ["sensor.meter_w"], "sensor.pv_kwh": ["sensor.pv_w"]}
    assert server.energy_stat_ids(None) == set() and server.energy_siblings(None, reg) == {}


async def test_energy_prefs_needs_home_assistant_and_an_editor(client, monkeypatch, tmp_path):
    assert (await client.get("/api/energy/prefs")).status == 503            # standalone: there is no Home Assistant to ask
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    assert (await client.get("/api/energy/prefs", headers={"X-Remote-User-Name": "tablet"})).status == 403


async def test_alarm_messages_settings_stay_in_the_add_on(client, monkeypatch, tmp_path):
    """#414: the phone number and the CallMeBot key are kept in their own file, the key is never handed out; only editors see them"""
    r = await (await client.get("/api/notify")).json()
    assert r["on"] is False and r["hasKey"] is False and r["services"] == [] and r["available"] == [] and r["ready"] == "off"
    r = await (await client.put("/api/notify", json={"on": True, "via": "whatsapp", "phone": "+49 170 1234567", "apikey": "987654", "kinds": ["alarm", "smoke"]})).json()
    assert r["hasKey"] is True and "apikey" not in r and r["phone"] == "+491701234567" and r["ready"] is None
    import json
    stored = json.loads(next(tmp_path.rglob("notify.json")).read_text("utf-8"))
    assert stored["apikey"] == "987654"
    assert "987654" not in await (await client.get("/api/settings")).text()                        # not in the settings every tablet reads
    r = await (await client.put("/api/notify", json={"kinds": ["water"]})).json()
    assert r["hasKey"] is True and r["kinds"] == ["water"] and r["on"] is True                       # a save without the key keeps it
    r = await (await client.put("/api/notify", json={"via": "ha", "service": ""})).json()
    assert r["ready"] == "service"
    t = await client.post("/api/notify/test")
    assert t.status == 502 and "service" in (await t.json())["error"]                                # not set up: said, nothing sent
    await client.put("/api/notify", json={"service": "notify.mobile_app_x"})
    t = await client.post("/api/notify/test")
    assert t.status == 502 and "Home Assistant" in (await t.json())["error"]                         # standalone: no Home Assistant to ask
    r = await (await client.put("/api/notify", json={"via": "telegram", "tgMode": "group", "tgkey": "group-key-1"})).json()   # Telegram group (#456)
    assert r["hasTgKey"] is True and "tgkey" not in r and r["ready"] is None and r["services"] == ["mobile_app_x"]
    r = await (await client.put("/api/notify", json={"via": "ha", "services": [], "entities": ["notify.telegram_bot_familie", "light.x"]})).json()
    assert r["entities"] == ["notify.telegram_bot_familie"] and r["ready"] is None                    # a notify entity alone is enough (#460)
    assert "group-key-1" not in await (await client.get("/api/notify")).text()
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")                   # in Home Assistant: who may edit is decided by the options
    tab = {"X-Remote-User-Name": "tablet"}
    assert (await client.get("/api/notify", headers=tab)).status == 403
    assert (await client.put("/api/notify", json={"on": False}, headers=tab)).status == 403
    assert (await client.post("/api/notify/test", headers=tab)).status == 403


async def test_holiday_alarm_arm_and_disarm_only_with_the_code(client, monkeypatch, tmp_path):
    """#456: the add-on's own alarm: editors set it up (the code is stored hashed), everybody arms and disarms with the code, a lock and
    wrong codes stop it"""
    import json
    r = await (await client.get("/api/guard")).json()
    assert r["view"]["phase"] == "off" and r["ready"] == "sensors" and r["cfg"]["hasCode"] is False
    assert (await client.post("/api/guard/arm", json={"code": "1234"})).status == 409                      # not set up yet
    r = await (await client.put("/api/guard", json={"sensors": ["binary_sensor.haustuer"], "code": "1234", "delay": 0})).json()
    assert r["ready"] is None and r["cfg"]["hasCode"] is True and "code" not in r["cfg"]
    stored = next(tmp_path.rglob("guard.json")).read_text("utf-8")
    assert "1234" not in stored and json.loads(stored)["cfg"]["code"]["hash"]
    assert "1234" not in await (await client.get("/api/settings")).text()
    bad = await client.post("/api/guard/arm", json={"code": "9999"})
    assert bad.status == 403 and (await bad.json())["left"] == 4
    r = await (await client.post("/api/guard/arm", json={"code": "1234"})).json()
    assert r["view"]["phase"] == "armed"
    assert (await (await client.get("/api/guard")).json())["view"]["phase"] == "armed"
    assert (await client.post("/api/guard/disarm", json={})).status == 403
    for _ in range(4):
        await client.post("/api/guard/disarm", json={"code": "0000"})
    r = await client.post("/api/guard/disarm", json={"code": "1234"})
    assert r.status == 429 and (await r.json())["wait"] > 0                                                # five wrong codes: wait, even with the right one
    server_store = client.server.app[server.KEY_GUARD]
    server_store["tries"].right()
    r = await (await client.post("/api/guard/disarm", json={"code": "1234"})).json()
    assert r["view"]["phase"] == "off" and json.loads(next(tmp_path.rglob("guard.json")).read_text("utf-8"))["state"]["phase"] == "off"
    await client.put("/api/guard", json={"delay": 30})
    r = await (await client.post("/api/guard/arm", json={"code": "1234"})).json()
    assert r["view"]["phase"] == "arming" and 29 <= r["view"]["left"] <= 30                                # time to leave the house
    r = await (await client.put("/api/guard", json={"code": "", "removeCode": True, "sensors": []})).json()
    assert r["ready"] is None and r["cfg"]["hasCode"] is True                                             # armed: the code and the sensors stay
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    tab = {"X-Remote-User-Name": "tablet"}
    r = await (await client.get("/api/guard", headers=tab)).json()
    assert r["view"]["phase"] == "arming" and "cfg" not in r and r["canEdit"] is False and r["locked"] is False   # the state, not the settings
    assert (await client.put("/api/guard", json={"delay": 0}, headers=tab)).status == 403
    r = await (await client.post("/api/guard/disarm", json={"code": "1234"}, headers=tab)).json()
    assert r["view"]["phase"] == "off"                                                                     # a tablet may, with the code
    await client.put("/api/settings", json={**(await (await client.get("/api/settings")).json()), "userLocks": {"tablet": ["guard"]}},
                     headers={"X-Remote-User-Name": "admin", "If-Match": (await client.get("/api/settings")).headers.get("ETag", "")})
    assert (await client.post("/api/guard/arm", json={"code": "1234"}, headers=tab)).status == 403         # ... unless it is locked for it


async def test_kept_full_screen_ends_only_with_the_code(client, monkeypatch, tmp_path):
    """#487: the lock "fullscreen" keeps a user's screen in full screen; one code (set by editors, stored hashed, not in the settings)
    ends it, wrong codes make everybody wait"""
    import json
    assert (await (await client.get("/api/fullscreen")).json()) == {"hasCode": False}
    assert (await client.post("/api/fullscreen/unlock", json={"code": "1234"})).status == 409             # no code yet: nobody leaves
    assert (await client.put("/api/fullscreen", json={"code": "12a4"})).status == 400
    assert (await client.put("/api/fullscreen", json={"code": "123"})).status == 400
    assert (await (await client.put("/api/fullscreen", json={"code": "2468"})).json()) == {"hasCode": True}
    stored = next(tmp_path.rglob("fullscreen.json")).read_text("utf-8")
    assert "2468" not in stored and json.loads(stored)["code"]["hash"]
    assert "2468" not in await (await client.get("/api/settings")).text()
    bad = await client.post("/api/fullscreen/unlock", json={"code": "1111"})
    assert bad.status == 403 and (await bad.json())["left"] == 4
    assert (await client.post("/api/fullscreen/unlock", json={})).status == 403
    assert (await (await client.post("/api/fullscreen/unlock", json={"code": "2468"})).json()) == {"ok": True}
    for _ in range(5):
        await client.post("/api/fullscreen/unlock", json={"code": "0000"})
    r = await client.post("/api/fullscreen/unlock", json={"code": "2468"})
    assert r.status == 429 and (await r.json())["wait"] > 0                                              # five wrong codes: wait, even with the right one
    client.server.app[server.KEY_FULL]["tries"].right()
    s = await (await client.put("/api/settings", json={"userLocks": {"Tablet": ["fullscreen", "bogus"]}})).json()
    assert s["userLocks"] == {"Tablet": ["fullscreen"]}
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "tablet"})).json())["locks"] == ["fullscreen"]
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    monkeypatch.setattr(server, "load_admin_ids", _no_admins)
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    tab = {"X-Remote-User-Name": "tablet"}
    assert (await client.put("/api/fullscreen", json={"code": ""}, headers=tab)).status == 403              # only editors set it
    assert (await (await client.get("/api/fullscreen", headers=tab)).json()) == {"hasCode": True}
    assert (await (await client.post("/api/fullscreen/unlock", json={"code": "2468"}, headers=tab)).json()) == {"ok": True}
    r = await (await client.put("/api/fullscreen", json={"code": ""}, headers={"X-Remote-User-Name": "admin"})).json()
    assert r == {"hasCode": False} and json.loads(next(tmp_path.rglob("fullscreen.json")).read_text("utf-8")) == {"code": None}


async def test_tabs_per_user_are_cleaned_reach_that_user_and_go_into_users_json(client, tmp_path):
    """#479: the tab bar per user: only known tabs, the house never hidden, a hidden start tab dropped; api/me hands it to that user."""
    import json
    body = {"userTabs": {"Flur": {"hide": [], "start": "cameras"}, "kid": {"hide": ["cameras", "house", "bogus"], "start": "cameras"},
                         "empty": {"hide": [], "start": "house"}, "junk": "cameras", " ": {"start": "cameras"}}, "tabBar": False}
    s = await (await client.put("/api/settings", json=body)).json()
    assert s["userTabs"] == {"Flur": {"hide": [], "start": "cameras"}, "kid": {"hide": ["cameras"]}}
    assert s["tabBar"] is False
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "flur"})).json())["tabs"] == {"hide": [], "start": "cameras"}
    assert (await (await client.get("/api/me", headers={"X-Remote-User-Name": "someone"})).json())["tabs"] == {}
    assert json.loads((tmp_path / "addon_config" / "users.json").read_text("utf-8"))["userTabs"] == s["userTabs"]
    assert (await (await client.put("/api/settings", json={"userTabs": ["x"]})).json())["userTabs"] == {}


def test_tabs_match_the_browser():
    """server.TABS and TABS in static/tabs.js list the same tabs in the same order (#479)"""
    src = (Path(server.__file__).parent / "static" / "tabs.js").read_text()
    block = src[src.index("export const TABS = ["):src.index("];", src.index("export const TABS = ["))]
    assert tuple(server.re.findall(r"\['(\w+)'", block)) == server.TABS


async def test_settings_of_the_routines(client):
    """#483: the buttons of ▶ Abläufe (scenes, scripts, buttons, each once, at most 24) and the routines linked to the two checks"""
    s = await (await client.get("/api/settings")).json()
    assert s["routines"] == [] and s["routineLeave"] == "" and s["routineNight"] == ""
    s = await (await client.put("/api/settings", json={"routines": ["scene.kino", "light.a", "scene.kino", "script.x", "button.b", 5] + [f"scene.s{i}" for i in range(30)],
                                                        "routineLeave": "script.ich_gehe", "routineNight": "lock.tuer"})).json()
    assert s["routines"][:3] == ["scene.kino", "script.x", "button.b"] and len(s["routines"]) == 24
    assert s["routineLeave"] == "script.ich_gehe" and s["routineNight"] == ""
    s = await (await client.put("/api/settings", json={"routines": "scene.kino", "routineLeave": 5})).json()
    assert s["routines"] == [] and s["routineLeave"] == ""


def test_routine_domains_match_the_browser():
    """server.ROUTINE_DOMAINS and START in static/routines.js list the same domains (#483)"""
    src = (Path(server.__file__).parent / "static" / "routines.js").read_text()
    block = src[src.index("export const START = {"):src.index("};", src.index("export const START = {"))]
    assert set(server.re.findall(r"(\w+): '", block)) == set(server.ROUTINE_DOMAINS)


async def test_an_automation_is_switched_only_by_an_editor(client, monkeypatch):
    """#483: automation.turn_on / turn_off go through, but only for who may edit"""
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "x")
    async def no_admins():
        return set()
    monkeypatch.setattr(server, "load_admin_ids", no_admins)
    r = await client.post("/api/service", json={"domain": "automation", "service": "turn_off", "entity_id": "automation.flur"}, headers={"X-Remote-User-Name": "kid"})
    assert r.status == 403
    assert server.controls.check({"domain": "automation", "service": "turn_off", "entity_id": "automation.flur"})[3] is None
    assert server.controls.check({"domain": "automation", "service": "trigger", "entity_id": "automation.flur"})[3] is not None


async def test_the_pinboard(client):
    """#483: notes for everybody, newest first, with who wrote them; anybody may take one off; at most 30 (the oldest goes)"""
    r = await (await client.get("/api/pinboard")).json()
    assert r["notes"] == [] and r["canSend"] is False                       # no channel for messages set up
    r = await client.post("/api/pinboard", json={"text": " Katze füttern! 🐱 ", "color": "green"}, headers={"X-Remote-User-Display-Name": "Anna"})
    assert r.status == 200
    one = (await r.json())["notes"][0]
    assert one["text"] == "Katze füttern! 🐱" and one["by"] == "Anna" and one["color"] == "green" and len(one["id"]) == 16
    r = await (await client.post("/api/pinboard", json={"text": "Bin um 6 da", "send": True}, headers={"X-Remote-User-Name": "max"})).json()
    assert [n["text"] for n in r["notes"]] == ["Bin um 6 da", "Katze füttern! 🐱"] and r["notes"][0]["by"] == "max" and r["sent"] is False
    assert (await client.post("/api/pinboard", json={"text": "   "})).status == 400
    assert (await client.post("/api/pinboard", data="junk")).status == 400
    r = await (await client.delete(f"/api/pinboard/{one['id']}")).json()
    assert [n["text"] for n in r["notes"]] == ["Bin um 6 da"]
    assert [n["text"] for n in (await (await client.get("/api/pinboard")).json())["notes"]] == ["Bin um 6 da"]
    for i in range(31):
        await client.post("/api/pinboard", json={"text": f"n{i}"})
    notes = (await (await client.get("/api/pinboard")).json())["notes"]
    assert len(notes) == 30 and notes[0]["text"] == "n30" and "Bin um 6 da" not in [n["text"] for n in notes]


async def test_family_without_home_assistant(client):
    """#483: standalone the page has nobody; a person's picture is refused for anything but a person"""
    assert (await (await client.get("/api/family")).json()) == {"people": []}
    assert (await client.get("/api/family/light.x/picture")).status == 400
    assert (await client.get("/api/family/person.anna/picture")).status == 503
