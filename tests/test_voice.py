"""voice.py (#509): the settings of the voice search, Home Assistant's Assist pipelines, speech-to-text over the websocket; and the
endpoints api/voice and api/voice/stt against a fake Home Assistant."""
import json
import re
import sys
from pathlib import Path

import pytest

APP = Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"
sys.path.insert(0, str(APP))
import server  # noqa: E402
import voice as vc  # noqa: E402


def test_clean_voice_keeps_code_words_with_a_place():
    v = vc.clean_voice({"engine": "nope", "aliases": [
        {"say": "  Stube ", "rooms": ["wz", "wz", 5, ""]}, {"say": "leer"}, {"say": "", "rooms": ["a"]}, "junk",
        {"say": "Oma", "house": "el", "user": "lena"}, {"say": "x" * 99, "floor": "f1"}]})
    assert v["engine"] == "auto"
    assert v["aliases"][:2] == [{"say": "Stube", "house": "", "floor": "", "rooms": ["wz"], "user": ""},
                                {"say": "Oma", "house": "el", "floor": "", "rooms": [], "user": "lena"}]
    assert v["aliases"][2]["say"] == "x" * 60
    assert vc.clean_voice(None) == {"engine": "auto", "aliases": []}
    assert vc.clean_voice({"engine": "assist"})["engine"] == "assist"
    many = vc.clean_voice({"aliases": [{"say": f"w{i}", "floor": "f"} for i in range(99)]})["aliases"]
    assert len(many) == vc.MAX_ALIASES
    assert server.validate_settings({"voice": {"engine": "off", "aliases": [{"say": "Stube", "rooms": ["wz"]}]}})["voice"]["engine"] == "off"
    assert server.validate_settings({})["voice"] == {"engine": "auto", "aliases": []}


def test_the_lists_are_the_same_as_in_the_browser():
    js = (APP / "static" / "voicequery.js").read_text("utf-8")
    assert re.search(r"ENGINES = \[([^\]]*)\]", js).group(1).replace("'", '"').replace(" ", "") == ",".join(f'"{e}"' for e in vc.ENGINES)
    assert int(re.search(r"MAX_ALIASES = (\d+)", js).group(1)) == vc.MAX_ALIASES
    locks = re.findall(r"^  \['([a-zA-Z]+)',", (APP / "static" / "userlocks.js").read_text("utf-8"), re.M)
    assert tuple(locks) == server.LOCKS


def test_pipeline_info_the_preferred_pipeline_with_speech_to_text():
    assert vc.pipeline_info(None) == {"assist": False, "pipeline": "", "name": "", "language": "", "pipelines": 0}
    res = {"pipelines": [{"id": "a", "name": "Ohne", "stt_engine": None}, {"id": "b", "name": "Whisper", "stt_engine": "stt.faster_whisper", "stt_language": "de"},
                         {"id": "c", "name": "Cloud", "stt_engine": "stt.home_assistant_cloud", "language": "de"}], "preferred_pipeline": "c"}
    assert vc.pipeline_info(res) == {"assist": True, "pipeline": "c", "name": "Cloud", "language": "de", "pipelines": 3}
    assert vc.pipeline_info({**res, "preferred_pipeline": "a"})["pipeline"] == "b"        # the preferred one cannot listen: the first that can
    assert not vc.pipeline_info({"pipelines": [{"id": "a", "stt_engine": None}], "preferred_pipeline": "a"})["assist"]


def test_audio_ok():
    assert vc.audio_ok(b"\0" * 16000)
    assert not vc.audio_ok(b"\0" * 16001)                 # not 16-bit
    assert not vc.audio_ok(b"\0" * 100)                   # too short
    assert not vc.audio_ok(b"\0" * (vc.MAX_AUDIO + 2))    # too long
    assert not vc.audio_ok("text")


class FakeWs:
    """The websocket of an Assist run: answers the start, takes the audio, then says the text (or an error)."""
    def __init__(self, events):
        self.sent, self.bytes, self.inbox, self.events = [], [], [], events

    async def send_json(self, data):
        self.sent.append(data)
        self.inbox += [{"id": 7, "type": "event", "event": {"type": "other"}}, {"id": data["id"], "type": "result", "success": True},
                       {"id": data["id"], "type": "event", "event": {"type": "run-start", "data": {"runner_data": {"stt_binary_handler_id": 3}}}}]

    async def send_bytes(self, data):
        self.bytes.append(data)
        if len(data) == 1:
            self.inbox += [{"id": 1, "type": "event", "event": e} for e in self.events]

    async def receive(self):
        class M:
            type = 1
        m = M()
        m.data = json.dumps(self.inbox.pop(0))
        return m


async def test_transcribe_sends_the_audio_in_pieces_with_the_handler_byte():
    ws = FakeWs([{"type": "stt-start"}, {"type": "stt-end", "data": {"stt_output": {"text": " Welche Fenster sind offen "}}}])
    audio = bytes(range(256)) * 30                        # 7680 bytes: three pieces
    assert await vc.transcribe(ws, audio, "p1") == "Welche Fenster sind offen"
    assert ws.sent == [{"id": 1, "type": "assist_pipeline/run", "start_stage": "stt", "end_stage": "stt", "input": {"sample_rate": 16000}, "pipeline": "p1"}]
    assert [len(b) for b in ws.bytes] == [vc.CHUNK + 1, vc.CHUNK + 1, len(audio) - 2 * vc.CHUNK + 1, 1]
    assert all(b[0] == 3 for b in ws.bytes) and b"".join(b[1:] for b in ws.bytes) == audio
    assert await vc.transcribe(FakeWs([{"type": "run-end"}]), audio) == ""
    with pytest.raises(LookupError, match="stt-no-text-recognized"):
        await vc.transcribe(FakeWs([{"type": "error", "data": {"code": "stt-no-text-recognized"}}]), audio)


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path))


async def fake_ha(aiohttp_server, monkeypatch, stt=True, heard="Ist oben Licht an"):
    """a Home Assistant with one Assist pipeline (with or without speech-to-text) that hears `heard`"""
    from aiohttp import WSMsgType, web
    got = {"bytes": 0, "runs": 0}

    async def ws(request):
        w = web.WebSocketResponse(); await w.prepare(request)
        await w.send_json({"type": "auth_required"}); await w.receive_json(); await w.send_json({"type": "auth_ok"})
        async for msg in w:
            if msg.type == WSMsgType.BINARY:
                got["bytes"] += len(msg.data) - 1
                if len(msg.data) == 1:
                    await w.send_json({"id": got["id"], "type": "event", "event": {"type": "stt-end", "data": {"stt_output": {"text": heard}}}})
                continue
            m = json.loads(msg.data)
            if m["type"] == "assist_pipeline/pipeline/list":
                await w.send_json({"id": m["id"], "type": "result", "success": True, "result": {
                    "pipelines": [{"id": "p1", "name": "Whisper", "language": "de", "stt_engine": "stt.whisper" if stt else None}], "preferred_pipeline": "p1"}})
            elif m["type"] == "assist_pipeline/run":
                got["runs"] += 1; got["id"] = m["id"]
                await w.send_json({"id": m["id"], "type": "result", "success": True, "result": None})
                await w.send_json({"id": m["id"], "type": "event", "event": {"type": "run-start", "data": {"runner_data": {"stt_binary_handler_id": 1}}}})
        return w
    app = web.Application(); app.router.add_get("/websocket", ws)
    srv = await aiohttp_server(app)
    monkeypatch.setattr(server, "HA_API", f"http://localhost:{srv.port}")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    return got


async def test_api_voice_says_whether_assist_can_listen(client, aiohttp_server, monkeypatch):
    assert await (await client.get("/api/voice")).json() == {"assist": False, "locked": False}          # no Home Assistant
    await fake_ha(aiohttp_server, monkeypatch)
    body = await (await client.get("/api/voice")).json()
    assert body["assist"] and body["pipeline"] == "p1" and body["name"] == "Whisper" and not body["locked"]


async def test_api_voice_stt_turns_audio_into_text(client, aiohttp_server, monkeypatch):
    got = await fake_ha(aiohttp_server, monkeypatch)
    audio = b"\1\0" * 16000                                                     # one second
    r = await client.post("/api/voice/stt", data=audio)
    assert r.status == 200 and await r.json() == {"text": "Ist oben Licht an"}
    assert got == {"bytes": len(audio), "runs": 1, "id": 1}
    assert (await client.post("/api/voice/stt", data=b"\0" * 7)).status == 400  # not audio


async def test_api_voice_stt_without_speech_to_text_and_for_a_locked_user(client, aiohttp_server, monkeypatch):
    assert (await client.put("/api/settings", json={**server.DEFAULT_SETTINGS, "userLocks": {"lena": ["voice"]}})).status == 200   # standalone: may edit
    got = await fake_ha(aiohttp_server, monkeypatch, stt=False)
    r = await client.post("/api/voice/stt", data=b"\0" * 16000)
    assert r.status == 409 and (await r.json())["error"] == "no_assist" and got["runs"] == 0
    r = await client.post("/api/voice/stt", data=b"\0" * 16000, headers={"X-Remote-User-Name": "Lena"})
    assert r.status == 403
    assert (await (await client.get("/api/voice", headers={"X-Remote-User-Name": "lena"})).json()) == {"assist": False, "locked": True}
