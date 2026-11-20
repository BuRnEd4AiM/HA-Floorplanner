"""👥 Gäste-Zugang (guest.py, 5.21.0): the settings checked, who is the guest, while it runs, what they may switch."""
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import guest as gs  # noqa: E402

NOW = datetime.datetime(2026, 11, 20, 12, 0, tzinfo=datetime.timezone.utc).timestamp()


def test_settings_are_checked():
    assert gs.clean_guest(None) == {"on": False, "user": "gast", "room": "", "until": ""}
    c = gs.clean_guest({"on": True, "user": " Gast ", "room": "h1/r_gast", "until": "2026-11-23T12:00+01:00", "x": 1})
    assert c == {"on": True, "user": "Gast", "room": "h1/r_gast", "until": "2026-11-23T12:00+01:00"}
    bad = gs.clean_guest({"on": "yes", "user": "a b", "room": "../x", "until": "2026-11-23T12:00"})   # no time zone: no end
    assert bad == {"on": False, "user": "gast", "room": "", "until": ""}


def test_who_and_when():
    c = gs.clean_guest({"on": True, "user": "Gast", "room": "h1/r", "until": "2026-11-23T12:00+00:00"})
    assert gs.is_guest(c, {"gast", "abc123"}) and not gs.is_guest(c, {"florian"})
    assert not gs.is_guest({**c, "on": False}, {"gast"})                       # switched off: an ordinary user again
    assert gs.active(c, NOW) and not gs.active(c, NOW + 4 * 86400)            # over after Sunday 12:00
    assert gs.active({**c, "until": ""}, NOW + 1e8)                            # no end
    assert not gs.active({**c, "room": ""}, NOW)                               # no room chosen


def test_only_their_room():
    room = {"entities": ["light.gast", "switch.heizdecke", "media_player.gast_tv", "climate.gast", "sensor.gast_temp"],
            "shutters": [{"cover": "cover.gast"}]}
    mine = gs.room_entities(room)
    assert mine == ["light.gast", "media_player.gast_tv", "climate.gast", "cover.gast"]
    assert gs.allowed("light.gast", mine) and gs.allowed(["light.gast", "cover.gast"], mine)
    assert not gs.allowed(["light.gast", "light.wohnzimmer"], mine)             # one of another room: refused
    assert not gs.allowed("switch.heizdecke", mine) and not gs.allowed(None, mine) and not gs.allowed([], mine)
