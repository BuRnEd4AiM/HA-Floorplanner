"""The voice search (#509): its settings (which recognition, the code words such as "Wohnzimmer der Eltern") and Home Assistant's Assist
turning spoken words into text (an Assist pipeline with speech-to-text, e.g. Whisper or Home Assistant Cloud, websocket
assist_pipeline/run from the stage stt to the stage stt). The browser records 16-bit mono at 16 kHz and sends it in one piece; the
sentence is understood in the browser (static/voicequery.js). Unit test: tests/test_voice.py; server.py does the asking."""
import asyncio
import json

ENGINES = ("auto", "browser", "assist", "keyboard", "off")      # the same list as ENGINES in static/voicequery.js
MAX_ALIASES = 60                                    # the same as MAX_ALIASES in static/voicequery.js
SAMPLE_RATE = 16000
MAX_AUDIO = SAMPLE_RATE * 2 * 15                    # 15 seconds of 16-bit mono
CHUNK = SAMPLE_RATE * 2 // 10                       # sent to Home Assistant in pieces of 0.1 s
TIMEOUT = 40                                        # seconds for the whole recognition (Whisper on a small computer is slow)


def _text(val, n: int) -> str:
    return val.strip()[:n] if isinstance(val, str) else ""


def clean_voice(val) -> dict:
    """{"engine", "aliases": [{"say", "house", "floor", "rooms", "user"}]} like cleanVoice in static/voicequery.js: a known engine (else
    auto), at most MAX_ALIASES code words, each with a word and a place (a house, a floor or rooms), at most 20 rooms."""
    src = val if isinstance(val, dict) else {}
    aliases = []
    for a in src.get("aliases") if isinstance(src.get("aliases"), list) else []:
        if not isinstance(a, dict):
            continue
        rooms = []
        for r in a.get("rooms") if isinstance(a.get("rooms"), list) else []:
            if isinstance(r, str) and r and len(r) <= 80 and r not in rooms:
                rooms.append(r)
        out = {"say": _text(a.get("say"), 60), "house": _text(a.get("house"), 40), "floor": _text(a.get("floor"), 80), "rooms": rooms[:20],
               "user": _text(a.get("user"), 80)}
        if out["say"] and (out["house"] or out["floor"] or out["rooms"]):
            aliases.append(out)
    return {"engine": src.get("engine") if src.get("engine") in ENGINES else "auto", "aliases": aliases[:MAX_ALIASES]}


def pipeline_info(res) -> dict:
    """What assist_pipeline/pipeline/list says, cut down: {"assist": a pipeline can turn speech into text, "pipeline": its id, "name",
    "language"}. The preferred pipeline when it has speech-to-text, else the first one that has."""
    pipes = [p for p in (res or {}).get("pipelines") or [] if isinstance(p, dict)] if isinstance(res, dict) else []
    with_stt = [p for p in pipes if p.get("stt_engine")]
    pref = (res or {}).get("preferred_pipeline") if isinstance(res, dict) else None
    pick = next((p for p in with_stt if p.get("id") == pref), with_stt[0] if with_stt else None)
    if not pick:
        return {"assist": False, "pipeline": "", "name": "", "language": "", "pipelines": len(pipes)}
    return {"assist": True, "pipeline": str(pick.get("id") or ""), "name": str(pick.get("name") or "")[:80],
            "language": str(pick.get("stt_language") or pick.get("language") or "")[:20], "pipelines": len(pipes)}


def audio_ok(audio: bytes) -> bool:
    """16-bit samples (an even length), at least a quarter of a second, at most MAX_AUDIO"""
    return isinstance(audio, (bytes, bytearray)) and SAMPLE_RATE // 2 <= len(audio) <= MAX_AUDIO and len(audio) % 2 == 0


async def transcribe(ws, audio: bytes, pipeline: str = "", msg_id: int = 1, timeout: float = TIMEOUT) -> str:
    """Run Assist from speech-to-text to speech-to-text on an authenticated websocket (aiohttp): start the run, send the audio with the
    handler id of the run as the first byte, then that byte alone (the end), and wait for the text. '' when nothing was heard;
    LookupError with Home Assistant's code when it fails (e.g. no speech-to-text in the pipeline)."""
    loop = asyncio.get_running_loop()
    end = loop.time() + timeout
    await ws.send_json({"id": msg_id, "type": "assist_pipeline/run", "start_stage": "stt", "end_stage": "stt",
                        "input": {"sample_rate": SAMPLE_RATE}, **({"pipeline": pipeline} if pipeline else {})})
    while True:
        msg = await asyncio.wait_for(ws.receive(), max(0.1, end - loop.time()))
        if msg.type != 1:                                   # aiohttp.WSMsgType.TEXT; anything else: closed or an error
            raise ConnectionError("websocket closed")
        data = json.loads(msg.data)
        if data.get("id") != msg_id:
            continue
        if data.get("type") == "result":
            if not data.get("success"):
                raise LookupError((data.get("error") or {}).get("code") or "refused")
            continue
        ev = data.get("event") or {}
        kind, body = ev.get("type"), ev.get("data") or {}
        if kind == "run-start":
            handler = ((body.get("runner_data") or {}).get("stt_binary_handler_id"))
            if not isinstance(handler, int):
                raise LookupError("no_audio_handler")
            head = bytes([handler])
            for i in range(0, len(audio), CHUNK):
                await ws.send_bytes(head + bytes(audio[i:i + CHUNK]))
            await ws.send_bytes(head)                       # the end of the audio
        elif kind == "stt-end":
            return str(((body.get("stt_output") or {}).get("text")) or "").strip()[:500]
        elif kind == "error":
            raise LookupError(str(body.get("code") or "error"))
        elif kind == "run-end":
            return ""
