"""What a browser may switch in Home Assistant, and what the live card learns of a state for it (controls.py, #406)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import controls  # noqa: E402


def ok(domain, service, entity=None, data=None):
    body = {"domain": domain, "service": service, "entity_id": entity or f"{domain}.x", **({"data": data} if data is not None else {})}
    d, s, payload, err = controls.check(body)
    assert err is None, (body, err)
    return payload


def bad(domain, service, entity=None, data=None):
    body = {"domain": domain, "service": service, "entity_id": entity or f"{domain}.x", **({"data": data} if data is not None else {})}
    assert controls.check(body)[3], body


def test_what_worked_before_still_works():
    assert ok("light", "turn_on", data={"brightness_pct": 40, "rgb_color": [255, 0, 10.5], "color_temp_kelvin": 2700, "effect": "Nordlicht"}) == {
        "entity_id": "light.x", "brightness_pct": 40, "rgb_color": [255, 0, 10], "color_temp_kelvin": 2700, "effect": "Nordlicht"}
    for d in ("light", "switch", "input_boolean", "fan", "script", "climate", "media_player"):
        for s in ("turn_on", "turn_off", "toggle"):
            ok(d, s)
    for s in ("open_cover", "close_cover", "stop_cover"):
        ok("cover", s)
    assert ok("cover", "set_cover_position", data={"position": 30})["position"] == 30
    ok("lock", "lock"); ok("lock", "unlock"); ok("scene", "turn_on")
    assert ok("climate", "set_temperature", data={"temperature": 21.25})["temperature"] == 21.2
    assert ok("climate", "set_hvac_mode", data={"hvac_mode": "heat"})["hvac_mode"] == "heat"


def test_new_controls():
    assert ok("climate", "set_preset_mode", data={"preset_mode": "eco"})["preset_mode"] == "eco"
    assert ok("climate", "set_fan_mode", data={"fan_mode": "high"})["fan_mode"] == "high"
    assert ok("fan", "set_percentage", data={"percentage": 66})["percentage"] == 66
    assert ok("fan", "oscillate", data={"oscillating": True})["oscillating"] is True
    assert ok("fan", "set_preset_mode", data={"preset_mode": "Nacht"})["preset_mode"] == "Nacht"
    for s in ("media_play_pause", "media_play", "media_pause", "media_stop", "media_next_track", "media_previous_track", "volume_up", "volume_down"):
        ok("media_player", s)
    assert ok("media_player", "volume_set", data={"volume_level": 0.455})["volume_level"] == 0.46
    assert ok("media_player", "volume_mute", data={"is_volume_muted": False})["is_volume_muted"] is False
    assert ok("media_player", "select_source", data={"source": "Spotify"})["source"] == "Spotify"
    for s in ("start", "pause", "stop", "return_to_base", "locate"):
        ok("vacuum", s)
    assert ok("vacuum", "set_fan_speed", data={"fan_speed": "Turbo"})["fan_speed"] == "Turbo"
    for s in ("alarm_disarm", "alarm_arm_home", "alarm_arm_away", "alarm_arm_night", "alarm_arm_vacation"):
        ok("alarm_control_panel", s)
    assert ok("alarm_control_panel", "alarm_disarm", data={"code": "1234"})["code"] == "1234"
    ok("button", "press"); ok("input_button", "press")
    assert ok("select", "select_option", data={"option": "Eco"})["option"] == "Eco"
    assert ok("input_select", "select_option", data={"option": "Kino"})["option"] == "Kino"


def test_refused():
    bad("shell_command", "turn_on")
    bad("light", "reload")
    bad("light", "toggle", entity="switch.x")
    bad("light", "turn_on", data={"temperature": 20})          # a value of another domain
    bad("light", "turn_on", data={"brightness_pct": 150})
    bad("light", "turn_on", data={"brightness_pct": True})
    bad("light", "turn_on", data={"brightness_pct": float("nan")})
    bad("light", "turn_on", data=[1])
    bad("cover", "set_cover_position")                          # a value it needs is missing
    bad("cover", "turn_on")
    bad("scene", "turn_off")
    bad("climate", "set_temperature", data={"temperature": "21"})
    bad("climate", "set_hvac_mode", data={"hvac_mode": "explode"})
    bad("climate", "set_preset_mode")
    bad("climate", "set_preset_mode", data={"preset_mode": "x" * 101})
    bad("climate", "set_fan_mode", data={"fan_mode": 3})
    bad("fan", "set_percentage", data={"percentage": 101})
    bad("fan", "oscillate", data={"oscillating": 1})
    bad("media_player", "volume_set", data={"volume_level": 2})
    bad("media_player", "volume_set", data={"volume_level": 50})
    bad("media_player", "play_media", data={"media_content_id": "x"})
    bad("media_player", "select_source", data={"source": ""})
    bad("vacuum", "send_command", data={"command": "x"})
    bad("vacuum", "set_fan_speed")
    bad("alarm_control_panel", "alarm_trigger")
    bad("alarm_control_panel", "alarm_disarm", data={"code": "1\n2"})
    bad("alarm_control_panel", "alarm_disarm", data={"code": "1" * 33})
    bad("alarm_control_panel", "alarm_disarm", data={"code": 1234})
    bad("button", "turn_on")
    bad("select", "select_option")
    bad("select", "select_next")
    assert controls.check("x")[3] and controls.check({"domain": 1, "service": "toggle", "entity_id": "1.x"})[3]


def test_extras_for_the_live_card():
    st = lambda eid, state="on", **a: {"entity_id": eid, "state": state, "attributes": a}
    m = controls.extras(st("media_player.tv", "playing", volume_level=0.355, is_volume_muted=False, media_title="Song",
                           media_artist="Band", source_list=["TV", "Spotify", 5, ""], source="Spotify", supported_features=152463))
    assert m == {"vol": 36, "muted": False, "title": "Song", "artist": "Band", "sources": ["TV", "Spotify"], "source": "Spotify", "sf": 152463}
    assert controls.extras(st("media_player.x", "off")) is None              # nothing known: nothing sent
    assert controls.extras(st("vacuum.robo", "docked", fan_speed_list=["Leise", "Turbo"], fan_speed="Leise", supported_features=13436)) == {
        "speeds": ["Leise", "Turbo"], "speed": "Leise", "sf": 13436}
    assert controls.extras(st("fan.decke", percentage=50, percentage_step=33.33, oscillating=True, preset_modes=["Nacht"], preset_mode=None,
                              supported_features=11)) == {"pct": 50, "step": 33.33, "osc": True, "presets": ["Nacht"], "sf": 11}
    assert controls.extras(st("climate.wz", "heat", preset_modes=["eco", "comfort"], preset_mode="eco", fan_modes=["auto", "high"], fan_mode="auto")) == {
        "presets": ["eco", "comfort"], "preset": "eco", "fans": ["auto", "high"], "fan": "auto"}
    assert controls.extras(st("alarm_control_panel.haus", "disarmed", code_format="number", code_arm_required=False, supported_features=3)) == {
        "code": "number", "codeArm": False, "sf": 3}
    assert controls.extras(st("alarm_control_panel.h", "armed_away")) == {"codeArm": True}  # no code: Home Assistant's default says arming needs one
    assert controls.extras(st("input_select.modus", "Eco", options=["Eco", "Komfort"])) == {"options": ["Eco", "Komfort"]}
    assert controls.extras(st("light.x", brightness=10)) is None
    assert controls.extras(st("media_player.y", "playing", media_title="x" * 300))["title"] == "x" * 100


def test_music_page_stations_rooms_together_and_pictures():
    """#490: a radio station of ⚙ is played, players join and part, the picture of a player through the add-on or from the internet"""
    ok = lambda svc, data=None: controls.check({"domain": "media_player", "service": svc, "entity_id": "media_player.kueche", **({"data": data} if data else {})})  # noqa: E731
    assert ok("play_media", {"media_content_id": "https://stream.example/swr3.mp3", "media_content_type": "music"})[2] == {
        "entity_id": "media_player.kueche", "media_content_id": "https://stream.example/swr3.mp3", "media_content_type": "music"}
    assert ok("play_media", {"media_content_id": "media-source://radio_browser/abc-123", "media_content_type": "music"})[3] is None
    for data in ({"media_content_id": "file:///etc/passwd", "media_content_type": "music"}, {"media_content_id": "https://x y", "media_content_type": "music"},
                 {"media_content_id": "https://x.example/a", "media_content_type": "video"}, {"media_content_id": "https://x.example/a"}):
        assert ok("play_media", data)[3], data
    assert ok("join", {"group_members": ["media_player.bad", "media_player.wz"]})[3] is None
    for g in ([], ["light.x"], ["media_player.a", "media_player.a"], ["media_player.p%d" % i for i in range(21)], "media_player.a"):
        assert ok("join", {"group_members": g})[3], g
    assert ok("unjoin")[3] is None
    st = {"entity_id": "media_player.tv", "state": "playing", "attributes": {"entity_picture": "/api/media_player_proxy/media_player.tv?token=abc&cache=9",
                                                                            "group_members": ["media_player.tv", "media_player.kueche"], "supported_features": 524288}}
    m = controls.extras(st)
    assert m["pic"].startswith("p") and len(m["pic"]) == 13 and m["grp"] == ["media_player.tv", "media_player.kueche"]
    assert controls.picture_key("https://i.scdn.co/image/ab67616d") == "https://i.scdn.co/image/ab67616d"
    for v in ("/local/x.png", "http://insecure.example/a.jpg", "https://a.example/\"onerror", "/api/media_player_proxy/media_player.tv/../x", None):
        assert controls.picture_key(v) is None, v
    assert controls.extras({"entity_id": "media_player.s", "state": "on", "attributes": {"group_members": ["media_player.s"]}}) is None   # alone: nothing
