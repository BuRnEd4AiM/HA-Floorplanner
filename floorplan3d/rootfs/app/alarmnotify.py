"""A message when something goes off in the house: the alarm panel, a smoke, gas, carbon monoxide or water sensor (#414).

The add-on keeps its own websocket to Home Assistant (like the security recorder), also with no browser open, and sends a short message
the moment one of them goes off: by WhatsApp directly through CallMeBot (free: a phone number and the key CallMeBot sends back), by
Telegram through CallMeBot (to Telegram users, or into a group with the group's key, #456), or through notify services of Home Assistant
(picked from the ones it has, also those of configuration.yaml: a WhatsApp, Telegram or Signal integration, the Companion app ...). The text
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
TG_USER = re.compile(r"^(@[A-Za-z0-9_]{5,32}|\+[0-9]{6,16})$")   # a Telegram user name or a phone number (CallMeBot text.php)
VIA = ("whatsapp", "telegram", "ha")
SECRETS = ("apikey", "tgkey")      # the CallMeBot keys of WhatsApp and of a Telegram group: stay in the add-on
DEFAULT = {"on": False, "kinds": list(KINDS), "via": "whatsapp", "phone": "", "services": [], "tgMode": "user", "tgUsers": [], "clear": False}

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
    """The settings of the messages, checked; the CallMeBot keys ("apikey" of WhatsApp, "tgkey" of a Telegram group) are taken over from
    `old` unless a new one is given ("" or null removes it). Never raises."""
    data = data if isinstance(data, dict) else {}
    old = old if isinstance(old, dict) else {}
    if isinstance(old.get("service"), str) and "services" not in old:                  # one service until 4.0.3
        old = {**old, "services": [old["service"]] if old["service"] else []}
    out = {**DEFAULT, **{k: old[k] for k in DEFAULT if k in old}}
    if isinstance(data.get("on"), bool):
        out["on"] = data["on"]
    if isinstance(data.get("clear"), bool):
        out["clear"] = data["clear"]
    if isinstance(data.get("kinds"), list):
        out["kinds"] = [k for k in KINDS if k in data["kinds"]]
    if data.get("via") in VIA:
        out["via"] = data["via"]
    if data.get("tgMode") in ("user", "group"):
        out["tgMode"] = data["tgMode"]
    if isinstance(data.get("phone"), str):
        p = re.sub(r"[\s/()-]", "", data["phone"])
        out["phone"] = p if PHONE.match(p) else ""
    svc = data.get("services", [data["service"]] if isinstance(data.get("service"), str) else None)
    if isinstance(svc, (list, str)):
        out["services"] = services_of(svc)
    if isinstance(data.get("tgUsers"), (list, str)):
        out["tgUsers"] = tg_users(data["tgUsers"])
    for name in SECRETS:
        key = old.get(name, "")
        if name in data:
            v = data[name]
            key = v.strip() if isinstance(v, str) and APIKEY.match(v.strip()) else ("" if v in ("", None) else key)
        out[name] = key if isinstance(key, str) and APIKEY.match(key) else ""
    return out


def _items(v):
    """a list, or a text with commas, spaces or | between the items"""
    return [x for x in (v if isinstance(v, list) else re.split(r"[\s,;|]+", v)) if isinstance(x, str) and x.strip()]


def services_of(v) -> list:
    """notify services of Home Assistant without "notify.", checked, each once, at most 10"""
    out = []
    for s in _items(v):
        s = s.strip()
        s = s[7:] if s.startswith("notify.") else s
        if SERVICE.match(s) and s not in out:
            out.append(s)
    return out[:10]


def tg_users(v) -> list:
    """Telegram users for CallMeBot: "@name" ("name" gets its @) or "+phone", checked, each once, at most 10"""
    out = []
    for u in _items(v):
        u = u.strip()
        u = u if u[:1] in "@+" else f"@{u}"
        if TG_USER.match(u) and u not in out:
            out.append(u)
    return out[:10]


def public(cfg: dict) -> dict:
    """the settings as the browser sees them: the keys themselves stay in the add-on, only whether there are some"""
    return {**{k: v for k, v in cfg.items() if k not in SECRETS}, "hasKey": bool(cfg.get("apikey")), "hasTgKey": bool(cfg.get("tgkey"))}


def ready(cfg: dict):
    """None when the messages can be sent, else why not ('off', 'phone', 'apikey', 'service', 'tguser', 'tgkey')"""
    if not cfg.get("on"):
        return "off"
    if cfg.get("via") == "ha":
        return None if cfg.get("services") else "service"
    if cfg.get("via") == "telegram":
        if cfg.get("tgMode") == "group":
            return None if cfg.get("tgkey") else "tgkey"
        return None if cfg.get("tgUsers") else "tguser"
    if not cfg.get("phone"):
        return "phone"
    return None if cfg.get("apikey") else "apikey"


def callmebot_failed(status: int, page: str, message: str):
    """what CallMeBot answered, as an error text, or None when it took the message (it answers with a short HTML page)"""
    said = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", page[:2000])).replace(message, "").strip()
    if status != 200 or re.search(r"invalid|error|wrong|not (valid|found|allowed|authori[sz]ed)|unauthori[sz]ed|denied", said, re.I):
        return f"CallMeBot ({status}): {said[:160]}"
    return None


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


def _spots(f, eid):
    """the points where entity eid is on floor f: a device, or a door / window with it as contact (then a point on either side of the wall)"""
    for d in f.get("devices") or []:
        if isinstance(d, dict) and d.get("entity") == eid:
            yield [(d.get("x", 0), d.get("z", 0))]
    for w in f.get("walls") or []:
        if not isinstance(w, dict) or len(w.get("a") or []) < 2 or len(w.get("b") or []) < 2:
            continue
        for o in w.get("openings") or []:
            if not isinstance(o, dict) or eid not in [o.get("entity"), *(o.get("paneEntities") or [])]:
                continue
            (ax, az), (bx, bz) = w["a"][:2], w["b"][:2]
            length = ((bx - ax) ** 2 + (bz - az) ** 2) ** 0.5 or 1
            ux, uz = (bx - ax) / length, (bz - az) / length
            x, z = ax + ux * (o.get("pos") or 0), az + uz * (o.get("pos") or 0)
            yield [(x - uz * 0.3, z + ux * 0.3), (x + uz * 0.3, z - ux * 0.3)]


def where_of(houses, eid) -> str:
    """where entity eid is placed in the plans: 'house · floor · room' (the house only when there are several), '' when not placed. A door
    or window contact (#456) is in the room on either side of its wall. houses: [(house name, layout)]"""
    for hname, lay in houses:
        for f in (lay or {}).get("floors") or []:
            for pts in _spots(f, eid):
                room = next((r.get("name") for x, z in pts for r in f.get("rooms") or [] if isinstance(r, dict) and r.get("name")
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
