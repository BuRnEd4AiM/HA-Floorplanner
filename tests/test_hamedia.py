"""🖼 a picture in a notification of the Home Assistant app (5.35.0): names, the address for the app, which old pictures go"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import alarmnotify as an  # noqa: E402
import hamedia as hm  # noqa: E402


def test_names_and_address():
    assert hm.file_name(1764000000.1234) == "karte-1764000000123.png" and hm.file_name(1.0, jpg=True) == "karte-1000.jpg"
    assert hm.url("karte-1.png") == "/media/local/3d-floorplan/karte-1.png"
    assert hm.FOLDER_ID == "media-source://media_source/local/3d-floorplan"
    assert hm.app_service("mobile_app_pixel") and not hm.app_service("whatsapp") and not hm.app_service(None)


def test_only_the_newest_of_our_own_pictures_stay():
    kids = [{"media_content_id": f"{hm.FOLDER_ID}/karte-{n}.png"} for n in (1000, 3000, 2000, 4000)]
    kids += [{"media_content_id": f"{hm.FOLDER_ID}/urlaub.jpg"}, {"media_content_id": "media-source://media_source/local/other/karte-5.png"}, "x"]
    assert hm.old(kids, keep=2) == [f"{hm.FOLDER_ID}/karte-2000.png", f"{hm.FOLDER_ID}/karte-1000.png"]   # someone else's file stays
    assert hm.old(kids) == [] and hm.old(None) == []


def test_which_ways_carry_a_picture():
    assert an.pictures({"via": "tgbot"})
    assert an.pictures({"via": "ha", "services": ["whatsapp", "mobile_app_pixel"]})
    assert not an.pictures({"via": "ha", "services": ["whatsapp"], "entities": ["notify.tablet"]})   # no Companion app: text only
    assert not an.pictures({"via": "whatsapp"}) and not an.pictures({"via": "telegram"})
