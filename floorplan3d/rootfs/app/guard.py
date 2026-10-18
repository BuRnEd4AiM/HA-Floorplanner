"""The add-on's own alarm, e.g. for the holidays ("Urlaubs-Alarm", #456): the owner picks the door, window and motion sensors that set it off,
arms and disarms it with a code on the lock screen of a tablet, and when it goes off the add-on sends a message (WhatsApp, Telegram or
notify services, the settings of alarmnotify.py) and switches on sirens or lights. It needs no alarm panel in Home Assistant (no Alarmo).

The phases: off -> arming (time to leave the house) -> armed -> entry (a sensor opened: time to type the code) -> alarm. A sensor counts when
it opens ("on" / "open"); with "offline" ticked also when it stays unavailable for OFFLINE_GRACE seconds (a battery, the radio), but not
while Home Assistant starts again (QUIET seconds after the connection is made). Sensors that are open when it gets armed only count once
they shut and open again.

Everything that decides is pure (unit tests: tests/test_guard.py): clean_cfg, the code (salted PBKDF2, never stored as such), arm, disarm,
sensor, tick, view, texts. run_guard keeps a websocket to Home Assistant only while it is armed and never raises.
"""
import asyncio
import hashlib
import hmac
import json
import logging
import re
import secrets
import time

log = logging.getLogger("floorplan3d.guard")

ENTITY = re.compile(r"^[a-z_]{1,32}\.[a-z0-9_]{1,100}$")
CODE = re.compile(r"^[0-9]{4,8}$")
ACTION_DOMAINS = ("siren", "light", "switch", "input_boolean", "script", "scene")
OFF_DOMAINS = ("siren", "light", "switch", "input_boolean")        # what is switched off again when it is disarmed after an alarm
OPEN = {"on", "open"}
OFFLINE = {"unavailable", "unknown"}
OFFLINE_GRACE = 300.0     # a sensor must stay offline this long to count
QUIET = 600.0             # after (re)connecting, offline does not count for so long (Home Assistant starting, Zigbee coming up)
MAX_DELAY = 300
TRIES = 5                 # wrong codes ...
TRIES_WINDOW = 300.0      # ... within this many seconds: wait
DEFAULT = {"sensors": [], "offline": True, "delay": 30, "actions": [], "notify": True, "report": True}
STATE = {"phase": "off", "since": 0.0, "due": 0.0, "by": "", "what": None, "fired": [], "offline": {}, "quiet": 0.0}

TEXTS = {
    "de": {"open": "🚨 EINBRUCH-ALARM: {name} wurde geöffnet", "offline": "🚨 ALARM: {name} ist offline (Batterie, Funk?)",
           "armed": "🛡 Urlaubs-Alarm ist scharf ({n} Melder)", "disarmed": "🔓 Urlaubs-Alarm ausgeschaltet ({by})",
           "ended": "✅ Alarm beendet, ausgeschaltet von {by}", "tries": "⚠ Urlaubs-Alarm: {n}× falscher Code eingegeben"},
    "en": {"open": "🚨 BURGLAR ALARM: {name} was opened", "offline": "🚨 ALARM: {name} is offline (battery, radio?)",
           "armed": "🛡 Holiday alarm is armed ({n} sensors)", "disarmed": "🔓 Holiday alarm switched off ({by})",
           "ended": "✅ Alarm over, switched off by {by}", "tries": "⚠ Holiday alarm: wrong code typed {n} times"},
    "fr": {"open": "🚨 ALARME INTRUSION : {name} a été ouvert", "offline": "🚨 ALARME : {name} est hors ligne (pile, radio ?)",
           "armed": "🛡 L’alarme vacances est activée ({n} détecteurs)", "disarmed": "🔓 Alarme vacances désactivée ({by})",
           "ended": "✅ Alarme terminée, désactivée par {by}", "tries": "⚠ Alarme vacances : code faux saisi {n} fois"},
    "es": {"open": "🚨 ALARMA DE INTRUSIÓN: se abrió {name}", "offline": "🚨 ALARMA: {name} está sin conexión (pila, radio?)",
           "armed": "🛡 La alarma de vacaciones está activada ({n} sensores)", "disarmed": "🔓 Alarma de vacaciones desactivada ({by})",
           "ended": "✅ Alarma terminada, desactivada por {by}", "tries": "⚠ Alarma de vacaciones: código incorrecto {n} veces"},
    "it": {"open": "🚨 ALLARME INTRUSIONE: {name} è stato aperto", "offline": "🚨 ALLARME: {name} è offline (batteria, radio?)",
           "armed": "🛡 L’allarme vacanze è inserito ({n} sensori)", "disarmed": "🔓 Allarme vacanze disinserito ({by})",
           "ended": "✅ Allarme finito, disinserito da {by}", "tries": "⚠ Allarme vacanze: codice sbagliato {n} volte"},
    "nl": {"open": "🚨 INBRAAKALARM: {name} is geopend", "offline": "🚨 ALARM: {name} is offline (batterij, radio?)",
           "armed": "🛡 Vakantie-alarm staat aan ({n} melders)", "disarmed": "🔓 Vakantie-alarm uitgeschakeld ({by})",
           "ended": "✅ Alarm voorbij, uitgeschakeld door {by}", "tries": "⚠ Vakantie-alarm: {n}× verkeerde code ingetoetst"},
    "pl": {"open": "🚨 ALARM WŁAMANIOWY: otwarto {name}", "offline": "🚨 ALARM: {name} jest offline (bateria, radio?)",
           "armed": "🛡 Alarm urlopowy jest uzbrojony ({n} czujników)", "disarmed": "🔓 Alarm urlopowy wyłączony ({by})",
           "ended": "✅ Alarm zakończony, wyłączył {by}", "tries": "⚠ Alarm urlopowy: {n}× zły kod"},
}


def _entities(v, domains=None, most=100) -> list:
    out = []
    for e in v if isinstance(v, list) else []:
        if isinstance(e, str) and ENTITY.match(e) and e not in out and (domains is None or e.split(".")[0] in domains):
            out.append(e)
    return out[:most]


def hash_code(code: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", code.encode(), bytes.fromhex(salt), 100_000).hex()


def clean_cfg(data, old=None) -> dict:
    """The settings of the alarm, checked. A new code (4 to 8 digits) is stored salted and hashed; without one the old code stays (""
    or null removes it, then it cannot be armed). Never raises."""
    data = data if isinstance(data, dict) else {}
    old = old if isinstance(old, dict) else {}
    out = {**DEFAULT, **{k: old[k] for k in DEFAULT if k in old}}
    if isinstance(data.get("sensors"), list):
        out["sensors"] = _entities(data["sensors"], ("binary_sensor",))
    if isinstance(data.get("actions"), list):
        out["actions"] = _entities(data["actions"], ACTION_DOMAINS, 30)
    for k in ("offline", "notify", "report"):
        if isinstance(data.get(k), bool):
            out[k] = data[k]
    if isinstance(data.get("delay"), (int, float)) and not isinstance(data.get("delay"), bool):
        out["delay"] = int(max(0, min(MAX_DELAY, data["delay"])))
    code = old.get("code") if isinstance(old.get("code"), dict) else None
    if "code" in data:
        v = data["code"]
        if isinstance(v, str) and CODE.match(v.strip()):
            salt = secrets.token_hex(16)
            code = {"salt": salt, "hash": hash_code(v.strip(), salt)}
        elif v in ("", None) and data.get("removeCode") is True:
            code = None
    out["code"] = code if isinstance(code, dict) and isinstance(code.get("salt"), str) and isinstance(code.get("hash"), str) else None
    return out


def check_code(cfg: dict, code) -> bool:
    c = cfg.get("code")
    if not c or not isinstance(code, str) or not CODE.match(code):
        return False
    try:
        return hmac.compare_digest(hash_code(code, c["salt"]), c["hash"])
    except (ValueError, KeyError, TypeError):
        return False


def public(cfg: dict) -> dict:
    """the settings as the browser of an editor sees them: whether there is a code, never the code"""
    return {**{k: v for k, v in cfg.items() if k != "code"}, "hasCode": bool(cfg.get("code"))}


def ready(cfg: dict):
    """None when it can be armed, else what is missing ('sensors', 'code')"""
    if not cfg.get("sensors"):
        return "sensors"
    return None if cfg.get("code") else "code"


def clean_state(st) -> dict:
    st = st if isinstance(st, dict) else {}
    out = {**STATE, **{k: st[k] for k in STATE if k in st}}
    if out["phase"] not in ("off", "arming", "armed", "entry", "alarm"):
        out = dict(STATE)
    out["fired"] = [e for e in out["fired"] if isinstance(e, str)] if isinstance(out["fired"], list) else []
    out["offline"] = {k: v for k, v in out["offline"].items() if isinstance(v, (int, float))} if isinstance(out["offline"], dict) else {}
    return out


def arm(st: dict, cfg: dict, now: float, by: str = ""):
    """(state, events): arming starts the time to leave (none: armed at once). Armed already: nothing changes."""
    if st["phase"] != "off":
        return st, []
    d = cfg.get("delay", 0)
    nst = {**STATE, "phase": "arming" if d > 0 else "armed", "since": now, "due": now + d if d > 0 else 0.0, "by": by, "quiet": st.get("quiet", 0.0)}
    return nst, ([] if d > 0 else [("armed", None)])


def disarm(st: dict, now: float, by: str = ""):
    """(state, events): off; after an alarm the event says so (switch the sirens off again)"""
    if st["phase"] == "off":
        return st, []
    return {**STATE, "since": now, "by": by, "quiet": st.get("quiet", 0.0)}, [("disarmed", {"alarm": st["phase"] == "alarm", "by": by})]


def _trigger(st: dict, cfg: dict, what: dict, now: float):
    if st["phase"] == "armed":
        d = cfg.get("delay", 0)
        if d > 0:
            return {**st, "phase": "entry", "due": now + d, "what": what, "fired": [what["entity"]]}, []
        return {**st, "phase": "alarm", "due": 0.0, "what": what, "fired": [what["entity"]]}, [("alarm", what)]
    if st["phase"] == "alarm" and what["entity"] not in st["fired"]:
        return {**st, "fired": st["fired"] + [what["entity"]]}, [("alarm", what)]     # another door: another message
    return st, []


def sensor(st: dict, cfg: dict, eid: str, state, name: str, now: float):
    """(state, events) for a new state of a sensor: opened -> the entry time or the alarm; offline -> noted (tick decides)"""
    if eid not in cfg.get("sensors", []):
        return st, []
    off = dict(st["offline"])
    if state in OFFLINE:
        off.setdefault(eid, now)
    else:
        off.pop(eid, None)
    st = {**st, "offline": off}
    if state in OPEN:
        return _trigger(st, cfg, {"entity": eid, "name": name or eid, "why": "open", "at": now}, now)
    return st, []


def reconnected(st: dict, now: float) -> dict:
    """the connection to Home Assistant was (re)made: offline does not count for a while, what was offline is forgotten"""
    return {**st, "quiet": now + QUIET, "offline": {}}


def tick(st: dict, cfg: dict, now: float, names=None):
    """(state, events) as time goes on: the time to leave is over -> armed; the entry time is over -> alarm; a sensor offline long enough"""
    if st["phase"] == "arming" and now >= st["due"]:
        return {**st, "phase": "armed", "due": 0.0, "offline": {}}, [("armed", None)]
    if st["phase"] == "entry" and now >= st["due"]:
        return {**st, "phase": "alarm", "due": 0.0}, [("alarm", st["what"])]
    if cfg.get("offline") and st["phase"] in ("armed", "alarm") and now >= st.get("quiet", 0.0):
        for eid, since in sorted(st["offline"].items(), key=lambda kv: kv[1]):
            if now - since >= OFFLINE_GRACE and eid not in st["fired"]:
                return _trigger(st, cfg, {"entity": eid, "name": (names or {}).get(eid) or eid, "why": "offline", "at": now}, now)
    return st, []


def view(st: dict, now: float) -> dict:
    """what the screens show: the phase, seconds left (leaving / typing the code), what set it off"""
    left = max(0, round(st["due"] - now)) if st["phase"] in ("arming", "entry") else 0
    w = st.get("what") or None
    return {"phase": st["phase"], "left": left, "since": st["since"], "by": st.get("by", ""),
            "what": {"entity": w["entity"], "name": w["name"], "why": w["why"], "at": w.get("at", 0)} if w else None}


def text(kind: str, lang="de", **kw) -> str:
    t = TEXTS.get(lang) or TEXTS["en"]
    return t[kind].format(**kw)


def message(event, data, cfg: dict, lang="de", where="", when="") -> str:
    """the message of an event, '' when there is none to send ('armed' and 'disarmed' only when "report" is on)"""
    if event == "alarm":
        line = text(data["why"], lang, name=data["name"])
    elif event == "armed" and cfg.get("report"):
        line = text("armed", lang, n=len(cfg.get("sensors", [])))
    elif event == "disarmed" and (cfg.get("report") or data.get("alarm")):
        line = text("ended" if data.get("alarm") else "disarmed", lang, by=data.get("by") or "?")
    else:
        return ""
    rest = " · ".join(p for p in (where, when) if p)
    return f"{line}\n{rest}" if rest else line


class Tries:
    """wrong codes: after TRIES within TRIES_WINDOW seconds no more tries until the window is over"""

    def __init__(self, n=TRIES, window=TRIES_WINDOW):
        self.n, self.window, self.times = n, window, []

    def wait(self, now: float) -> int:
        self.times = [t for t in self.times if now - t < self.window]
        return int(self.window - (now - self.times[0])) + 1 if len(self.times) >= self.n else 0

    def wrong(self, now: float) -> int:
        """note a wrong code; how many there were in the window"""
        self.times = [t for t in self.times if now - t < self.window] + [now]
        return len(self.times)

    def right(self):
        self.times = []


async def run_guard(*, connect, get, put, act, check: float = 1.0):
    """While the alarm is armed, keep a websocket to Home Assistant and feed the state changes of the chosen sensors and the clock into the
    rules. get() -> (cfg, state); put(state) stores a new state; act(events) does what they say (messages, sirens). Never raises."""
    delay = 1
    while True:
        try:
            cfg, st = get()
            if st["phase"] == "off":
                await asyncio.sleep(check)
                continue
            async with connect() as ws:
                await ws.send_json({"id": 1, "type": "subscribe_events", "event_type": "state_changed"})
                put(reconnected(get()[1], time.time()))
                delay, names = 1, {}
                while True:
                    try:
                        msg = await asyncio.wait_for(ws.receive(), check)
                    except asyncio.TimeoutError:
                        msg = None
                    cfg, st = get()
                    if st["phase"] == "off":
                        break
                    events = []
                    if msg is not None:
                        if msg.type != 1:                          # aiohttp.WSMsgType.TEXT; anything else: closed or an error
                            raise ConnectionError("websocket closed")
                        data = json.loads(msg.data)
                        d = (data.get("event") or {}).get("data") or {} if data.get("type") == "event" else {}
                        eid, new = d.get("entity_id"), d.get("new_state") or {}
                        if eid in cfg["sensors"]:
                            names[eid] = (new.get("attributes") or {}).get("friendly_name") or eid
                            st, events = sensor(st, cfg, eid, new.get("state"), names[eid], time.time())
                    if not events:
                        st, events = tick(st, cfg, time.time(), names)
                    if st is not get()[1]:
                        put(st)
                    if events:
                        await act(events)
        except asyncio.CancelledError:
            raise
        except Exception as err:  # noqa: BLE001 - must never stop the add-on
            log.info("watching for the holiday alarm interrupted (%s), retrying in %ss", err, delay)
            await asyncio.sleep(delay)
            delay = min(30, delay * 2)
