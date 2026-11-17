"""📸 The add-on's own Telegram bot (tgbot.py, 5.16.0): its key and chats checked, the chats found in what was written to it."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import tgbot  # noqa: E402

TOKEN = "123456789:AAH" + "x" * 32


def test_the_key_of_a_bot():
    assert tgbot.check_token(f" {TOKEN}\n") == TOKEN
    assert tgbot.check_token("123:abc") == "" and tgbot.check_token(None) == "" and tgbot.check_token("abc:" + "x" * 35) == ""


def test_chats():
    assert tgbot.chats_of([{"id": 5, "name": "A"}, "-100123", {"id": "@kanal_name"}, {"id": "a b"}, 5]) == [
        {"id": "5", "name": "A"}, {"id": "-100123", "name": ""}, {"id": "@kanal_name", "name": ""}]
    assert len(tgbot.chats_of([str(i) for i in range(10)])) == 5
    assert tgbot.chats_of("x") == []


def test_the_chats_that_wrote_to_the_bot_newest_first():
    res = [{"update_id": 1, "message": {"chat": {"id": 11, "first_name": "Flo", "last_name": "W"}, "text": "Hallo"}},
           {"update_id": 2, "my_chat_member": {"chat": {"id": -100, "title": "Familie"}}},
           {"update_id": 3, "message": {"chat": {"id": 11, "first_name": "Flo"}, "text": "noch mal"}},
           {"update_id": 4, "weird": 1}, "x"]
    assert tgbot.updates_chats(res) == [{"id": "11", "name": "Flo"}, {"id": "-100", "name": "Familie"}]
    assert tgbot.updates_chats(None) == []
