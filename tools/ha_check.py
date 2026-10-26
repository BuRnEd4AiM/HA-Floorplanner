"""Let a real Home Assistant check the automations haflows.py writes (#548): its own validation of every block, and a run with stand-in
devices (a window switches the heating off after it stayed open 5 s and closing it puts it back through scene.create; motion switches a
light on and off); and a scene of scenes.py (#549) played with scene.turn_on and scene.apply. Not in CI (Home Assistant is big); run it
after changing haflows.py or scenes.py:

    python3.13 -m venv /tmp/havenv && /tmp/havenv/bin/pip install homeassistant==2026.2.3
    /tmp/havenv/bin/python -I tools/ha_check.py

It ends with "ALL OK" or names what Home Assistant did not take."""
import asyncio
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "floorplan3d" / "rootfs" / "app"))
sys.path.insert(0, str(ROOT / "tests"))
import flows as fl  # noqa: E402
import haflows as hf  # noqa: E402
import scenes as sc  # noqa: E402
from homeassistant import config_entries, core, loader  # noqa: E402
from homeassistant.components.automation import config as acfg  # noqa: E402
from homeassistant.helpers import area_registry as ar, category_registry as cr, device_registry as dr, entity_registry as er  # noqa: E402
from homeassistant.helpers import floor_registry as flr, issue_registry as ir, label_registry as lr  # noqa: E402
from homeassistant.setup import async_setup_component  # noqa: E402


async def make_hass(folder):
    hass = core.HomeAssistant(folder)
    loader.async_setup(hass)
    await hass.config.async_set_time_zone("Europe/Berlin")
    hass.config_entries = config_entries.ConfigEntries(hass, {})
    await hass.config_entries.async_initialize()
    for reg in (ar, cr, flr, lr, dr, er, ir):
        if hasattr(reg, "async_load"):
            await reg.async_load(hass)
    return hass


async def validate(hass) -> int:
    import test_haflows as t
    flows = [t.WINDOW, t.LIGHT] + fl.clean_flows([
        {"id": "f_t", "name": "T", "lanes": [
            {"id": "l1", "blocks": [{"k": "time", "at": "06:30", "days": [0, 4]}, {"k": "if_time", "from": "22:00", "to": "06:00"},
                                    {"k": "if_home", "who": "nobody"}, {"k": "if_home", "who": ""}, {"k": "if_home", "who": "person.anna"},
                                    {"k": "if_state", "ent": "binary_sensor.tuer", "is": "closed"}, {"k": "if_state", "ent": "light.x", "is": "on"},
                                    {"k": "cover", "ents": ["cover.wz"], "do": "pos", "v": 30}, {"k": "cover", "ents": ["cover.wz"], "do": "open"}]},
            {"id": "l2", "blocks": [{"k": "sun", "ev": "rise", "off": -45}, {"k": "run", "ent": "scene.morgen"}, {"k": "run", "ent": "script.x"}]},
            {"id": "l3", "blocks": [{"k": "button"}, {"k": "heat", "ents": ["climate.wz"], "do": "temp", "v": 21.5}, {"k": "heat", "ents": ["climate.wz"], "do": "heat"},
                                    {"k": "hold", "s": 30}, {"k": "restore"}]},
            {"id": "l4", "blocks": [{"k": "presence", "ev": "all_away"}, {"k": "if_num", "ent": "sensor.t", "op": "above", "v": 3},
                                    {"k": "switch", "ents": ["light.flur", "switch.kaffee"], "do": "off"}, {"k": "hold", "s": 90},
                                    {"k": "switch", "ents": ["light.flur", "switch.kaffee"], "do": "on", "pct": 40}, {"k": "if_sun", "is": "light"}]}]},
        {"id": "f_p", "name": "P", "lanes": [
            {"id": "l1", "blocks": [{"k": "presence", "ev": "arrive"}, {"k": "hold", "s": 60}, {"k": "notify", "text": "{name} ist da {state} {room}"}]},
            {"id": "l2", "blocks": [{"k": "presence", "ev": "leave", "who": "person.ben"}, {"k": "if_outside", "op": "above", "v": 20}, {"k": "notify", "text": "weg"}]},
            {"id": "l3", "blocks": [{"k": "presence", "ev": "first_home"}, {"k": "hold", "s": 60}, {"k": "switch", "ents": ["fan.x"], "do": "toggle"}]},
            {"id": "l4", "blocks": [{"k": "num", "ent": "sensor.co2", "op": "above", "v": 1000}, {"k": "hold", "s": 300}, {"k": "if_days", "days": [5, 6]},
                                    {"k": "switch", "same": True, "do": "on"}]}]},
        {"id": "f_s", "name": "S", "lanes": [
            {"id": "l1", "blocks": [{"k": "state", "ents": ["binary_sensor.fenster_wz"], "to": "any"}, {"k": "if_sun", "is": "dark"}, {"k": "hold", "s": 10},
                                    {"k": "switch", "same": True, "do": "on", "pct": 50}, {"k": "cover", "same": True, "do": "close"}, {"k": "heat", "same": True, "do": "temp", "v": 18},
                                    {"k": "wait", "s": 3700}, {"k": "restore", "same": True}, {"k": "restore", "ents": ["light.wz"]}]},
            {"id": "l2", "blocks": [{"k": "state", "ents": ["switch.a"], "to": "off"}, {"k": "hold", "s": 5}, {"k": "notify", "text": "aus"}]}]}])
    bad = 0
    for notify in (None, {"services": ["mobile_app_anna"], "entities": ["notify.tablet"]}):
        rooms = t.ROOMS + [{"key": "main/flur", "name": "Flur", "entities": ["light.flur", "cover.flur"], "windows": [], "doors": []}]
        ctx = hf.context(rooms, {**t.STATES, "sensor.co2": {}}, weather="weather.home", notify=notify)
        ctx["idx"]["sensor.co2"] = "main/flur"
        for f in flows:
            c = hf.compile_flow(f, ctx)
            assert c["ok"], (f["id"], c["problems"])
            for a in c["autos"]:
                try:
                    await acfg.async_validate_config_item(hass, a["id"], a)
                except Exception as err:  # noqa: BLE001 - said, then the next one
                    bad += 1
                    print("NOT TAKEN", a["id"], err)
                    print(json.dumps(a, ensure_ascii=False, indent=1)[:3000])
    print("validated, not taken:", bad)
    return bad


async def run(hass) -> int:
    calls = []

    async def fake(call):
        calls.append((call.domain, call.service, dict(call.data)))
        e = call.data.get("entity_id")
        for x in (e if isinstance(e, list) else [e]):
            st = hass.states.get(x)
            if not st:
                continue
            attrs = dict(st.attributes)
            if call.service == "set_hvac_mode":
                hass.states.async_set(x, call.data["hvac_mode"], attrs)
            elif call.service == "set_temperature":
                attrs["temperature"] = call.data["temperature"]
                hass.states.async_set(x, st.state, attrs)
            elif call.service in ("turn_on", "turn_off"):
                if "brightness_pct" in call.data:
                    attrs["brightness"] = round(call.data["brightness_pct"] * 2.55)
                if "brightness" in call.data:
                    attrs["brightness"] = call.data["brightness"]
                hass.states.async_set(x, "on" if call.service == "turn_on" else "off", attrs)
    for dom, svcs in {"climate": ["set_hvac_mode", "set_temperature", "turn_on"], "light": ["turn_on", "turn_off", "toggle"]}.items():
        for s in svcs:
            hass.services.async_register(dom, s, fake)
    hass.states.async_set("climate.wz", "heat", {"temperature": 22, "hvac_modes": ["off", "heat"], "supported_features": 1})
    hass.states.async_set("binary_sensor.fenster_wz", "off", {})
    hass.states.async_set("light.flur", "off", {})
    hass.states.async_set("binary_sensor.bewegung_flur", "off", {})
    hass.states.async_set("sun.sun", "below_horizon", {})
    hass.states.async_set("weather.home", "cloudy", {"temperature": 8})
    rooms = [{"key": "main/wz", "name": "Wohnzimmer", "entities": ["climate.wz"], "windows": ["binary_sensor.fenster_wz"], "doors": []}]
    flows = fl.clean_flows([
        {"id": "f_window", "name": "Fenster", "ha": True, "lanes": [
            {"id": "l1", "blocks": [{"k": "state", "ents": ["binary_sensor.fenster_wz"], "to": "open"}, {"k": "hold", "s": 1},
                                    {"k": "if_outside", "op": "below", "v": 15}, {"k": "heat", "same": True, "do": "off"}]},
            {"id": "l2", "blocks": [{"k": "state", "ents": ["binary_sensor.fenster_wz"], "to": "closed"}, {"k": "restore", "same": True}]}]},
        {"id": "f_flur", "name": "Flur", "ha": True, "lanes": [
            {"id": "l1", "blocks": [{"k": "state", "ents": ["binary_sensor.bewegung_flur"], "to": "on"}, {"k": "if_sun", "is": "dark"},
                                    {"k": "switch", "ents": ["light.flur"], "do": "on", "pct": 20}, {"k": "wait", "s": 1},
                                    {"k": "switch", "ents": ["light.flur"], "do": "off"}]}]}])
    ctx = hf.context(rooms, {}, weather="weather.home")
    autos = [a for f in flows for a in hf.compile_flow(f, ctx)["autos"]]
    assert await async_setup_component(hass, "homeassistant", {})
    assert await async_setup_component(hass, "scene", {})
    assert await async_setup_component(hass, "automation", {"automation": autos})
    await hass.async_start()
    await hass.async_block_till_done()
    print("automations:", sorted(s.entity_id for s in hass.states.async_all("automation")))
    print("scene.create there:", hass.services.has_service("scene", "create"), "scene.delete:", hass.services.has_service("scene", "delete"))
    hass.states.async_set("binary_sensor.fenster_wz", "on", {})
    await hass.async_block_till_done()
    await asyncio.sleep(0.3)
    print("after 0.3 s open:", hass.states.get("climate.wz").state, "(still heat: it waits 5 s)")
    await asyncio.sleep(5.5)
    await hass.async_block_till_done()
    print("fenster_1:", hass.states.get("automation.fenster_1").attributes.get("last_triggered"))
    print("after 5.8 s open:", hass.states.get("climate.wz").state, "scenes:", [s.entity_id for s in hass.states.async_all("scene")])
    hass.states.async_set("binary_sensor.fenster_wz", "off", {})
    await hass.async_block_till_done()
    await asyncio.sleep(0.5)
    await hass.async_block_till_done()
    st = hass.states.get("climate.wz")
    print("closed again:", st.state, st.attributes.get("temperature"), "scenes left:", [s.entity_id for s in hass.states.async_all("scene")])
    hass.states.async_set("binary_sensor.bewegung_flur", "on", {})
    await hass.async_block_till_done()
    await asyncio.sleep(0.2)
    print("motion: light", hass.states.get("light.flur").state, hass.states.get("light.flur").attributes.get("brightness"))
    await asyncio.sleep(1.3)
    await hass.async_block_till_done()
    print("1.5 s later: light", hass.states.get("light.flur").state)
    print("calls:", calls)
    want = [("climate", "set_hvac_mode", {"hvac_mode": "off", "entity_id": ["climate.wz"]}),
            ("climate", "set_hvac_mode", {"hvac_mode": "heat", "entity_id": "climate.wz"}),
            ("climate", "set_temperature", {"entity_id": "climate.wz", "temperature": 22}),
            ("light", "turn_on", {"brightness_pct": 20, "entity_id": ["light.flur"]}), ("light", "turn_off", {"entity_id": ["light.flur"]})]
    return 0 if calls == want else 1


async def scene(hass) -> int:
    calls = []

    async def fake(call):
        calls.append((call.domain, call.service, dict(call.data)))
    for dom, svcs in {"light": ["turn_on", "turn_off"], "cover": ["set_cover_position", "open_cover", "close_cover"], "switch": ["turn_on", "turn_off"]}.items():
        for s in svcs:
            hass.services.async_register(dom, s, fake)
    hass.states.async_set("light.led_tv", "off", {"supported_color_modes": ["rgb"], "effect_list": ["Rainbow", "Solid"]})
    hass.states.async_set("light.stehlampe", "off", {"supported_color_modes": ["color_temp"]})
    hass.states.async_set("light.decke", "on", {"brightness": 200})
    hass.states.async_set("cover.wz", "closed", {"current_position": 0, "supported_features": 15})
    hass.states.async_set("switch.kaffee", "off", {})
    m = sc.clean_model({"name": "Kino", "icon": "mdi:movie", "ents": {"light.led_tv": {"on": True, "pct": 30, "rgb": [120, 0, 255], "fx": "Rainbow"},
                        "light.decke": {"on": False}, "light.stehlampe": {"on": True, "pct": 40, "kelvin": 2700}, "cover.wz": {"pos": 20},
                        "switch.kaffee": {"on": True}}})
    assert await async_setup_component(hass, "homeassistant", {})
    assert await async_setup_component(hass, "scene", {"scene": [sc.to_ha("fp3d_skino", m)]})
    await hass.async_start()
    await hass.async_block_till_done()
    await hass.services.async_call("scene", "turn_on", {"entity_id": "scene.kino"}, blocking=True)
    await hass.async_block_till_done()
    played = sorted(calls, key=str)
    print("scene played:", played)
    calls.clear()
    await hass.services.async_call("scene", "apply", sc.apply_data(m), blocking=True)
    await hass.async_block_till_done()
    want = sorted([("switch", "turn_on", {"entity_id": "switch.kaffee"}),
                   ("light", "turn_on", {"entity_id": "light.led_tv", "brightness": 76, "effect": "Rainbow", "rgb_color": [120, 0, 255]}),
                   ("light", "turn_off", {"entity_id": "light.decke"}),
                   ("light", "turn_on", {"entity_id": "light.stehlampe", "brightness": 102, "color_temp_kelvin": 2700}),
                   ("cover", "set_cover_position", {"entity_id": "cover.wz", "position": 20})], key=str)
    return 0 if played == want and sorted(calls, key=str) == want else 1


async def main():
    with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b, tempfile.TemporaryDirectory() as c:
        hass = await make_hass(a)
        bad = await validate(hass)
        await hass.async_stop(force=True)
        hass = await make_hass(b)
        bad += await run(hass)
        await hass.async_stop(force=True)
        hass = await make_hass(c)
        bad += await scene(hass)
        await hass.async_stop(force=True)
    print("ALL OK" if not bad else f"{bad} PROBLEM(S)")
    sys.exit(1 if bad else 0)


asyncio.run(main())
