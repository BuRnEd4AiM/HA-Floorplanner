"""A message when something goes off in the house: the alarm panel, a smoke, gas, carbon monoxide or water sensor (#414).

The add-on keeps its own websocket to Home Assistant (like the security recorder), also with no browser open, and sends a short message
the moment one of them goes off: by WhatsApp directly through CallMeBot (free: a phone number and the key CallMeBot sends back), or
through any notify service of Home Assistant (a WhatsApp, Telegram or Signal integration, the Companion app on the phone ...). The text
says what went off and where it is in the plan (house · floor · room). The same sensor is reported again only after a pause; when the
add-on (re)connects, what is already going off is not sent again. Optionally a second message when it is back to normal.

The same rules as the warnings in the browser (static/alerts.js): binary sensors of device class smoke, gas, carbon_monoxide or moisture
that report "on", an alarm panel that is "triggered". Which state change is a message, its text and where it is are pure (unit tests:
tests/test_alarmnotify.py); run_watch keeps the connection and never raises.
"""
import asyncio
import json
import logging
import re
import time

log = logging.getLogger("floorplan3d.alarmnotify")

KINDS = ("alarm", "smoke", "gas", "co", "water")
CLASSES = {"smoke": "smoke", "gas": "gas", "carbon_monoxide": "co", "moisture": "water"}
COOLDOWN = 600.0          # seconds before the same sensor is reported again
BURST = 10                # at most this many messages ...
BURST_WINDOW = 600.0      # ... within this many seconds (a broken sensor flapping must not send a hundred messages)
SERVICE = re.compile(r"^[a-z0-9_]{1,64}$")
PHONE = re.compile(r"^\+?[0-9]{6,16}$")
APIKEY = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
DEFAULT = {"on": False, "kinds": list(KINDS), "via": "whatsapp", "phone": "", "service": "", "clear": False}

TEXTS = {
    "de": {"alarm": "🚨 ALARM: {name}", "smoke": "🔥 Rauch erkannt: {name}", "gas": "⚠️ Gas erkannt: {name}", "co": "☠️ Kohlenmonoxid erkannt: {name}",
           "water": "💧 Wasser erkannt: {name}", "clear": "✅ Wieder normal: {name}", "test": "✅ Test: die Alarm-Benachrichtigung vom 3D Floorplan funktioniert."},
    "en": {"alarm": "🚨 ALARM: {name}", "smoke": "🔥 Smoke detected: {name}", "gas": "⚠️ Gas detected: {name}", "co": "☠️ Carbon monoxide detected: {name}",
           "water": "💧 Water detected: {name}", "clear": "✅ Back to normal: {name}", "test": "✅ Test: the alarm message of 3D Floorplan works."},
    "fr": {"alarm": "🚨 ALARME : {name}", "smoke": "🔥 Fumée détectée : {name}", "gas": "⚠️ Gaz détecté : {name}", "co": "☠️ Monoxyde de carbone détecté : {name}",
           "water": "💧 Eau détectée : {name}", "clear": "✅ Retour à la normale : {name}", "test": "✅ Test : l’alerte de 3D Floorplan fonctionne."},
    "es": {"alarm": "🚨 ALARMA: {name}", "smoke": "🔥 Humo detectado: {name}", "gas": "⚠️ Gas detectado: {name}", "co": "☠️ Monóxido de carbono detectado: {name}",
           "water": "💧 Agua detectada: {name}", "clear": "✅ De nuevo normal: {name}", "test": "✅ Prueba: el aviso de alarma de 3D Floorplan funciona."},
    "it": {"alarm": "🚨 ALLARME: {name}", "smoke": "🔥 Fumo rilevato: {name}", "gas": "⚠️ Gas rilevato: {name}", "co": "☠️ Monossido di carbonio rilevato: {name}",
           "water": "💧 Acqua rilevata: {name}", "clear": "✅ Di nuovo normale: {name}", "test": "✅ Prova: l’avviso di allarme di 3D Floorplan funziona."},
    "nl": {"alarm": "🚨 ALARM: {name}", "smoke": "🔥 Rook gedetecteerd: {name}", "gas": "⚠️ Gas gedetecteerd: {name}", "co": "☠️ Koolmonoxide gedetecteerd: {name}",
           "water": "💧 Water gedetecteerd: {name}", "clear": "✅ Weer normaal: {name}", "test": "✅ Test: de alarmmelding van 3D Floorplan werkt."},
    "pl": {"alarm": "🚨 ALARM: {name}", "smoke": "🔥 Wykryto dym: {name}", "gas": "⚠️ Wykryto gaz: {name}", "co": "☠️ Wykryto tlenek węgla: {name}",
           "water": "💧 Wykryto wodę: {name}", "clear": "✅ Znowu w normie: {name}", "test": "✅ Test: powiadomienie o alarmie z 3D Floorplan działa."},
}


def clean(data, old=None) -> dict:
    """The settings of the messages, checked; the CallMeBot key ("apikey") is taken over from `old` unless a new one is given ("" or null
    removes it). Never raises."""
    data = data if isinstance(data, dict) else {}
    old = old if isinstance(old, dict) else {}
    out = {**DEFAULT, **{k: old[k] for k in DEFAULT if k in old}}
    if isinstance(data.get("on"), bool):
        out["on"] = data["on"]
    if isinstance(data.get("clear"), bool):
        out["clear"] = data["clear"]
    if isinstance(data.get("kinds"), list):
        out["kinds"] = [k for k in KINDS if k in data["kinds"]]
    if data.get("via") in ("whatsapp", "ha"):
        out["via"] = data["via"]
    if isinstance(data.get("phone"), str):
        p = re.sub(r"[\s/()-]", "", data["phone"])
        out["phone"] = p if PHONE.match(p) else ""
    if isinstance(data.get("service"), str):
        s = data["service"].strip()
        s = s[7:] if s.startswith("notify.") else s
        out["service"] = s if SERVICE.match(s) else ""
    key = old.get("apikey", "")
    if "apikey" in data:
        v = data["apikey"]
        key = v.strip() if isinstance(v, str) and APIKEY.match(v.strip()) else ("" if v in ("", None) else key)
    out["apikey"] = key if isinstance(key, str) and APIKEY.match(key) else ""
    return out


def public(cfg: dict) -> dict:
    """the settings as the browser sees them: the key itself stays in the add-on, only whether there is one"""
    return {**{k: v for k, v in cfg.items() if k != "apikey"}, "hasKey": bool(cfg.get("apikey"))}


def ready(cfg: dict):
    """None when the messages can be sent, else why not ('off', 'phone', 'apikey', 'service')"""
    if not cfg.get("on"):
        return "off"
    if cfg.get("via") == "ha":
        return None if cfg.get("service") else "service"
    if not cfg.get("phone"):
        return "phone"
    return None if cfg.get("apikey") else "apikey"


def kind_of(st):
    """what a Home Assistant state ({entity_id, state, attributes}) is going off as ('alarm' | 'smoke' | 'gas' | 'co' | 'water'), or None"""
    if not isinstance(st, dict):
        return None
    eid, s = str(st.get("entity_id", "")), st.get("state")
    domain = eid.split(".")[0]
    if domain == "alarm_control_panel":
        return "alarm" if s == "triggered" else None
    if domain == "binary_sensor" and s == "on":
        return CLASSES.get((st.get("attributes") or {}).get("device_class"))
    return None


class Watcher:
    """Which sensors are going off now, and which state change is a message. snapshot() takes what is going off at (re)connect without a
    message; change() gives [(event, kind, entity, name)] with event 'start' or 'clear'."""

    def __init__(self, cooldown: float = COOLDOWN, burst: int = BURST, window: float = BURST_WINDOW):
        self.active = {}          # entity -> kind going off now
        self.sent = {}            # entity -> when its last 'start' was sent
        self.times = []           # when the recent messages were sent (burst limit)
        self.cooldown, self.burst, self.window = cooldown, burst, window

    def snapshot(self, states):
        self.active = {s["entity_id"]: k for s in states or [] if isinstance(s, dict) and (k := kind_of(s))}

    def _room(self, now):
        self.times = [t for t in self.times if now - t < self.window]
        return len(self.times) < self.burst

    def change(self, eid, new, now, kinds=KINDS, clear=False):
        out, k, was = [], kind_of(new) if new else None, self.active.get(eid)
        name = ((new or {}).get("attributes") or {}).get("friendly_name") or eid
        if k and not was:
            self.active[eid] = k
            if k in kinds and now - self.sent.get(eid, -1e18) >= self.cooldown and self._room(now):
                self.sent[eid] = now
                self.times.append(now)
                out.append(("start", k, eid, name))
        elif not k and was:
            del self.active[eid]
            gone = not new or new.get("state") in ("unavailable", "unknown")          # gone or not reporting is no "back to normal"
            if clear and was in kinds and not gone and self._room(now):
                self.times.append(now)
                out.append(("clear", was, eid, name))
        return out


def _inside(x, z, pts):
    """point (x, z) inside the polygon pts ([[x, z], ...])"""
    hit, n = False, len(pts)
    for i in range(n):
        (x1, z1), (x2, z2) = pts[i][:2], pts[(i + 1) % n][:2]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / ((z2 - z1) or 1e-12) + x1:
            hit = not hit
    return hit


def where_of(houses, eid) -> str:
    """where entity eid is placed in the plans: 'house · floor · room' (the house only when there are several), '' when not placed.
    houses: [(house name, layout)]"""
    for hname, lay in houses:
        for f in (lay or {}).get("floors") or []:
            for d in f.get("devices") or []:
                if not isinstance(d, dict) or d.get("entity") != eid:
                    continue
                x, z = d.get("x", 0), d.get("z", 0)
                room = next((r.get("name") for r in f.get("rooms") or [] if isinstance(r, dict) and r.get("name")
                             and len(r.get("points") or []) >= 3 and _inside(x, z, r["points"])), "")
                parts = ([hname] if len(houses) > 1 and hname else []) + [f.get("name") or "", room or ""]
                return " · ".join(p for p in parts if p)
    return ""


def text(event, kind, name, where="", lang="de", when="") -> str:
    """the message: what (with a sign), where in the plan, when"""
    t = TEXTS.get(lang) or TEXTS["en"]
    line = t["clear" if event == "clear" else kind].format(name=name)
    rest = " · ".join(p for p in (where, when) if p)
    return f"{line}\n{rest}" if rest else line


def test_text(lang="de") -> str:
    return (TEXTS.get(lang) or TEXTS["en"])["test"]


async def run_watch(*, connect, config, send, places=lambda: [], lang=lambda: "de", clock=lambda: "", check: float = 5.0):
    """Keep a websocket to Home Assistant and send a message when something goes off. connect(): async context manager of an
    authenticated websocket; config(): the settings (clean()); send(text) -> (ok, error): sends one message; places(): [(house, layout)]
    for where_of; lang(): the language of the texts; clock(): the time to put in. Waits while the messages are off. Never raises."""
    delay = 1
    watcher = Watcher()
    while True:
        try:
            cfg = await asyncio.to_thread(config)
            if ready(cfg):
                await asyncio.sleep(check)              # off or not set up: look again in a moment
                continue
            async with connect() as ws:
                await ws.send_json({"id": 1, "type": "subscribe_events", "event_type": "state_changed"})
                await ws.send_json({"id": 2, "type": "get_states"})
                delay, last = 1, time.monotonic()
                while True:
                    try:
                        msg = await asyncio.wait_for(ws.receive(), check)
                    except asyncio.TimeoutError:
                        msg = None
                    if msg is not None:
                        if msg.type != 1:                          # aiohttp.WSMsgType.TEXT; anything else: closed or an error
                            raise ConnectionError("websocket closed")
                        data = json.loads(msg.data)
                        if data.get("id") == 2 and data.get("type") == "result" and isinstance(data.get("result"), list):
                            watcher.snapshot(data["result"])       # what is going off already: no message for it now
                        elif data.get("type") == "event":
                            d = (data.get("event") or {}).get("data") or {}
                            eid = d.get("entity_id")
                            if eid and (eid.startswith("binary_sensor.") or eid.startswith("alarm_control_panel.")):
                                for ev, kind, e, name in watcher.change(eid, d.get("new_state"), time.time(), cfg.get("kinds", KINDS), cfg.get("clear")):
                                    where = where_of(await asyncio.to_thread(places), e)
                                    ok, err = await send(text(ev, kind, name, where, lang(), clock()))
                                    log.info("alarm message (%s %s, %s): %s", ev, kind, e, "sent" if ok else f"not sent: {err}")
                    if time.monotonic() - last >= check:
                        last = time.monotonic()
                        cfg = await asyncio.to_thread(config)
                        if ready(cfg):
                            break
        except asyncio.CancelledError:
            raise
        except Exception as err:  # noqa: BLE001 - must never stop the add-on
            log.info("watching for alarms interrupted (%s), retrying in %ss", err, delay)
            await asyncio.sleep(delay)
            delay = min(60, delay * 2)
