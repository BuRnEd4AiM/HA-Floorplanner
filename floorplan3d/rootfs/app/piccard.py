"""🖼 Bildkarten fürs Handy (5.33.0, the owner's choice 2026-11-23, docs/ideen-5.33: idea 1 "Bausteine untereinander", a new card starts
from a template; "eigene Bilderkarten designen für spezielle Alarme … hier oben soll das Bild von dem Raum hin, hier die Informationen, hier
die Uhrzeit"): a card is a list of building blocks from top to bottom (a heading, the room's plan, a camera, the time, rows of information,
values of Home Assistant, a text, a line, a foot); two can sit side by side ("half"). The add-on draws it as ONE picture with Pillow (no
browser: also at night with no screen open) and sends it through its own Telegram bot (tgbot.py): for an alarm of a kind (notify settings
"cards") or from the block "🔔 Nachricht" of a routine (flows.py "card").

clean_cards checks what the page sends; render(card, ctx) draws it. ctx (server.py card_ctx): kind ('alarm', 'smoke', 'gas', 'co', 'water',
'flow', 'test'), title (a routine's name), name (the sensor or device), text (the message), place (alarmpic.place_of), floors (the house's,
when there is no place), house, states ({entity id: state}), lang, now / since (datetime), camera (bytes of a picture) and camera_name,
preview (the editor: empty parts are shown as such). Pure but for Pillow (unit test: tests/test_piccard.py); the demo draws the same with a
canvas (demo/piccard.js)."""
import datetime
import io
import math
import re

import hanames
from alarmnotify import _inside

ID = re.compile(r"^[a-z0-9_-]{1,24}$")
COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]{1,100}$")
KINDS = ("head", "plan", "camera", "clock", "info", "values", "text", "line", "foot")
ROWS = ("sensor", "since", "room", "temp", "hum", "open", "lights", "who", "weather", "alarm")
NO_HALF = ("head", "line", "foot")          # always the whole width
MAX_CARDS, MAX_BLOCKS = 20, 12
W_PT = {"tall": 480, "wide": 640}           # the width of a card in points; the picture has 2 pixels per point
S = 2
FONT = ("DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = ("DejaVuSans-Bold.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
RED, YELLOW = (226, 62, 52), (242, 180, 22)

WORDS = {   # what the picture says (no emoji: the plain font of the server has none)
    "de": {"alarm": "ALARM", "smoke": "RAUCH", "gas": "GAS", "co": "KOHLENMONOXID", "water": "WASSER", "test": "TEST", "flow": "NACHRICHT",
           "sensor": "Melder", "since": "Seit", "room": "Raum", "temp": "Temperatur", "hum": "Feuchte", "open": "Offen", "lights": "Licht an",
           "who": "Zu Hause", "weather": "Draußen", "alarmp": "Alarmanlage", "allShut": "alles zu", "allOff": "alles aus", "nobody": "niemand",
           "armed": "scharf", "disarmed": "aus", "triggered": "ausgelöst", "camera": "KAMERA", "noCamera": "keine Kamera im Raum", "card": "Karte",
           "oclock": "Uhr", "days": "Montag Dienstag Mittwoch Donnerstag Freitag Samstag Sonntag",
           "months": "Januar Februar März April Mai Juni Juli August September Oktober November Dezember", "open1": "offen", "on1": "AN",
           "sample": "Beispiel"},
    "en": {"alarm": "ALARM", "smoke": "SMOKE", "gas": "GAS", "co": "CARBON MONOXIDE", "water": "WATER", "test": "TEST", "flow": "MESSAGE",
           "sensor": "Sensor", "since": "Since", "room": "Room", "temp": "Temperature", "hum": "Humidity", "open": "Open", "lights": "Lights on",
           "who": "At home", "weather": "Outside", "alarmp": "Alarm", "allShut": "all shut", "allOff": "all off", "nobody": "nobody",
           "armed": "armed", "disarmed": "off", "triggered": "triggered", "camera": "CAMERA", "noCamera": "no camera in the room", "card": "Card",
           "oclock": "", "days": "Monday Tuesday Wednesday Thursday Friday Saturday Sunday",
           "months": "January February March April May June July August September October November December", "open1": "open", "on1": "ON",
           "sample": "Sample"},
    "fr": {"alarm": "ALARME", "smoke": "FUMÉE", "gas": "GAZ", "co": "MONOXYDE DE CARBONE", "water": "EAU", "test": "TEST", "flow": "MESSAGE",
           "sensor": "Capteur", "since": "Depuis", "room": "Pièce", "temp": "Température", "hum": "Humidité", "open": "Ouvert", "lights": "Lumière",
           "who": "À la maison", "weather": "Dehors", "alarmp": "Alarme", "allShut": "tout fermé", "allOff": "tout éteint", "nobody": "personne",
           "armed": "armée", "disarmed": "désarmée", "triggered": "déclenchée", "camera": "CAMÉRA", "noCamera": "pas de caméra dans la pièce",
           "card": "Carte", "oclock": "", "days": "lundi mardi mercredi jeudi vendredi samedi dimanche",
           "months": "janvier février mars avril mai juin juillet août septembre octobre novembre décembre", "open1": "ouvert", "on1": "ALLUMÉ",
           "sample": "Exemple"},
    "es": {"alarm": "ALARMA", "smoke": "HUMO", "gas": "GAS", "co": "MONÓXIDO DE CARBONO", "water": "AGUA", "test": "PRUEBA", "flow": "MENSAJE",
           "sensor": "Sensor", "since": "Desde", "room": "Habitación", "temp": "Temperatura", "hum": "Humedad", "open": "Abierto",
           "lights": "Luz encendida", "who": "En casa", "weather": "Fuera", "alarmp": "Alarma", "allShut": "todo cerrado", "allOff": "todo apagado",
           "nobody": "nadie", "armed": "armada", "disarmed": "desarmada", "triggered": "disparada", "camera": "CÁMARA",
           "noCamera": "sin cámara en la habitación", "card": "Tarjeta", "oclock": "", "days": "lunes martes miércoles jueves viernes sábado domingo",
           "months": "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre", "open1": "abierto",
           "on1": "ENCENDIDO", "sample": "Ejemplo"},
    "it": {"alarm": "ALLARME", "smoke": "FUMO", "gas": "GAS", "co": "MONOSSIDO DI CARBONIO", "water": "ACQUA", "test": "PROVA", "flow": "MESSAGGIO",
           "sensor": "Sensore", "since": "Da", "room": "Stanza", "temp": "Temperatura", "hum": "Umidità", "open": "Aperto", "lights": "Luci accese",
           "who": "A casa", "weather": "Fuori", "alarmp": "Allarme", "allShut": "tutto chiuso", "allOff": "tutto spento", "nobody": "nessuno",
           "armed": "inserito", "disarmed": "disinserito", "triggered": "scattato", "camera": "TELECAMERA", "noCamera": "nessuna telecamera nella stanza",
           "card": "Scheda", "oclock": "", "days": "lunedì martedì mercoledì giovedì venerdì sabato domenica",
           "months": "gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre", "open1": "aperto",
           "on1": "ACCESO", "sample": "Esempio"},
    "nl": {"alarm": "ALARM", "smoke": "ROOK", "gas": "GAS", "co": "KOOLMONOXIDE", "water": "WATER", "test": "TEST", "flow": "BERICHT",
           "sensor": "Melder", "since": "Sinds", "room": "Kamer", "temp": "Temperatuur", "hum": "Vochtigheid", "open": "Open", "lights": "Licht aan",
           "who": "Thuis", "weather": "Buiten", "alarmp": "Alarm", "allShut": "alles dicht", "allOff": "alles uit", "nobody": "niemand",
           "armed": "ingeschakeld", "disarmed": "uit", "triggered": "afgegaan", "camera": "CAMERA", "noCamera": "geen camera in de kamer",
           "card": "Kaart", "oclock": "uur", "days": "maandag dinsdag woensdag donderdag vrijdag zaterdag zondag",
           "months": "januari februari maart april mei juni juli augustus september oktober november december", "open1": "open", "on1": "AAN",
           "sample": "Voorbeeld"},
    "pl": {"alarm": "ALARM", "smoke": "DYM", "gas": "GAZ", "co": "TLENEK WĘGLA", "water": "WODA", "test": "TEST", "flow": "WIADOMOŚĆ",
           "sensor": "Czujnik", "since": "Od", "room": "Pokój", "temp": "Temperatura", "hum": "Wilgotność", "open": "Otwarte", "lights": "Światło",
           "who": "W domu", "weather": "Na zewnątrz", "alarmp": "Alarm", "allShut": "wszystko zamknięte", "allOff": "wszystko wyłączone",
           "nobody": "nikt", "armed": "uzbrojony", "disarmed": "wyłączony", "triggered": "włączony", "camera": "KAMERA",
           "noCamera": "brak kamery w pokoju", "card": "Karta", "oclock": "", "days": "poniedziałek wtorek środa czwartek piątek sobota niedziela",
           "months": "stycznia lutego marca kwietnia maja czerwca lipca sierpnia września października listopada grudnia", "open1": "otwarte",
           "on1": "WŁ.", "sample": "Przykład"},
}
WEATHER = {"de": {"sunny": "sonnig", "clear-night": "klar", "cloudy": "bewölkt", "partlycloudy": "teils bewölkt", "rainy": "Regen", "pouring": "Starkregen",
                  "snowy": "Schnee", "fog": "Nebel", "windy": "windig", "lightning": "Gewitter", "lightning-rainy": "Gewitter"},
           "en": {"partlycloudy": "partly cloudy", "clear-night": "clear", "lightning-rainy": "thunderstorm"}}

# the three cards a new house starts with (the pictures 6 to 8 of docs/ideen-5.33; "Test 1" is the owner's name instead of his own)
DEFAULT_NAMES = {"de": ("Wasser-Alarm", "Test 1", "Gute Nacht"), "en": ("Water alarm", "Test 1", "Good night"),
                 "fr": ("Alarme eau", "Test 1", "Bonne nuit"), "es": ("Alarma de agua", "Test 1", "Buenas noches"),
                 "it": ("Allarme acqua", "Test 1", "Buonanotte"), "nl": ("Wateralarm", "Test 1", "Goedenacht"),
                 "pl": ("Alarm wody", "Test 1", "Dobranoc")}


def defaults(lang="de") -> list:
    a, b, c = DEFAULT_NAMES.get(lang, DEFAULT_NAMES["en"])
    return [
        {"id": "wasser", "name": a, "color": "#d63c31", "theme": "light", "width": "tall", "blocks": [
            {"k": "head", "text": "{kind}", "clock": True}, {"k": "plan", "show": "floor", "marks": False},
            {"k": "camera", "ent": "", "half": True}, {"k": "info", "rows": ["sensor", "since", "temp", "hum"]}, {"k": "foot"}]},
        {"id": "test1", "name": b, "color": "#d63c31", "theme": "dark", "width": "tall", "blocks": [
            {"k": "camera", "ent": ""}, {"k": "clock", "date": True}, {"k": "text", "text": "{text}", "big": True},
            {"k": "plan", "show": "floor", "marks": False, "half": True}, {"k": "info", "rows": ["who", "weather", "alarm"]}, {"k": "foot"}]},
        {"id": "gutenacht", "name": c, "color": "#2d3f7a", "theme": "dark", "width": "tall", "blocks": [
            {"k": "head", "text": c, "clock": True}, {"k": "plan", "show": "floor", "marks": True},
            {"k": "info", "rows": ["open", "lights", "temp", "alarm"]}, {"k": "foot"}]},
    ]


def _bool(v, default):
    return v if isinstance(v, bool) else default


def _text(v, n, default=""):
    return v.strip()[:n] if isinstance(v, str) else default


def clean_block(b):
    """one building block as it is kept, None when it is none"""
    if not isinstance(b, dict) or b.get("k") not in KINDS:
        return None
    k = b["k"]
    out = {"k": k}
    if k == "head":
        out.update(text=_text(b.get("text"), 60, "{kind}") or "{kind}", clock=_bool(b.get("clock"), True))
    elif k == "plan":
        out.update(show=b.get("show") if b.get("show") in ("floor", "room") else "floor", marks=_bool(b.get("marks"), False))
    elif k == "camera":
        e = b.get("ent")
        out["ent"] = e if isinstance(e, str) and e.startswith("camera.") and ENTITY.match(e) else ""
    elif k == "clock":
        out["date"] = _bool(b.get("date"), True)
    elif k == "info":
        rows = b.get("rows") if isinstance(b.get("rows"), list) else ["sensor", "since"]
        out["rows"] = [r for r in dict.fromkeys(rows) if r in ROWS][:8]
    elif k == "values":
        ents = b.get("ents") if isinstance(b.get("ents"), list) else []
        out["ents"] = [e for e in dict.fromkeys(ents) if isinstance(e, str) and ENTITY.match(e)][:8]
    elif k == "text":
        out.update(text=_text(b.get("text"), 200), big=_bool(b.get("big"), False))
    if b.get("half") is True and k not in NO_HALF:
        out["half"] = True
    return out


def clean_card(c, n=0):
    if not isinstance(c, dict):
        return None
    blocks = [x for x in (clean_block(b) for b in (c.get("blocks") if isinstance(c.get("blocks"), list) else [])[:MAX_BLOCKS]) if x]
    cid = c.get("id") if isinstance(c.get("id"), str) and ID.match(c["id"]) else f"k{n + 1}"
    return {"id": cid, "name": _text(c.get("name"), 40) or f"{n + 1}", "color": c["color"].lower() if isinstance(c.get("color"), str) and COLOR.match(c["color"]) else "#d63c31",
            "theme": "dark" if c.get("theme") == "dark" else "light", "width": "wide" if c.get("width") == "wide" else "tall", "blocks": blocks}


def clean_cards(data) -> list:
    """the cards as they are kept: [{id, name, color, theme, width, blocks}], each id once, at most 20"""
    out, seen = [], set()
    for n, c in enumerate((data if isinstance(data, list) else [])[:MAX_CARDS]):
        card = clean_card(c, n)
        if card and card["id"] not in seen:
            seen.add(card["id"])
            out.append(card)
    return out


def rows_of(blocks) -> list:
    """the blocks in rows: a block with "half" shares its row with the next one (two columns); [[block], [block, block], …]"""
    out, i = [], 0
    while i < len(blocks):
        b = blocks[i]
        if b.get("half") and i + 1 < len(blocks) and blocks[i + 1]["k"] not in NO_HALF:
            out.append([b, blocks[i + 1]])
            i += 2
        else:
            out.append([b])
            i += 1
    return out


# ---------- what the picture says ----------
def words(lang):
    return {**WORDS["en"], **WORDS.get(lang, {})}


def fill(text, ctx) -> str:
    """the placeholders of a text: {kind}, {name}, {room}, {floor}, {house}, {time}, {text}, {title} (German too: {art}, {melder}, {raum},
    {etage}, {haus}, {zeit})"""
    w, place = words(ctx.get("lang")), ctx.get("place") or {}
    kind = ctx.get("kind") or "test"
    vals = {"kind": ctx.get("title") if kind == "flow" and ctx.get("title") else w.get(kind, kind.upper()), "name": ctx.get("name") or "",
            "room": (place.get("room") or {}).get("name") or "", "floor": (place.get("floor") or {}).get("name") or "",
            "house": ctx.get("house") or "", "time": _hm(ctx.get("now")), "text": ctx.get("text") or "", "title": ctx.get("title") or ""}
    for de, en in (("art", "kind"), ("melder", "name"), ("raum", "room"), ("etage", "floor"), ("haus", "house"), ("zeit", "time")):
        vals[de] = vals[en]
    return re.sub(r"\{(\w+)\}", lambda m: str(vals.get(m.group(1), m.group(0))), text or "").strip()


def _hm(t):
    return t.strftime("%H:%M") if isinstance(t, datetime.datetime) else ""


def date_words(t, lang) -> str:
    """"Montag, 23. November" (English "Monday, 23 November")"""
    if not isinstance(t, datetime.datetime):
        return ""
    w = words(lang)
    day, month = w["days"].split()[t.weekday()], w["months"].split()[t.month - 1]
    return f"{day}, {t.day}. {month}" if lang in ("de", "nl", "pl") else f"{day}, {t.day} {month}"


def _num(st):
    try:
        return float(st.get("state"))
    except (TypeError, ValueError, AttributeError):
        return None


def dec(n, lang, places=1) -> str:
    """a number with one place, a comma where the language writes one ("17,5")"""
    v = f"{n:.{places}f}".rstrip("0").rstrip(".") if abs(n) < 1000 else f"{n:.0f}"
    return v.replace(".", ",") if lang != "en" else v


def _value(st, lang="de") -> str:
    """a state as it is read: "17,5 °C", "on" … (a number rounded to one place)"""
    if not isinstance(st, dict):
        return "–"
    v, unit = st.get("state"), (st.get("attributes") or {}).get("unit_of_measurement") or ""
    n = _num(st)
    if n is not None:
        v = dec(n, lang)
    return f"{v} {unit}".strip()


def _room_devices(place):
    room, f = (place or {}).get("room"), (place or {}).get("floor") or {}
    if not room or len(room.get("points") or []) < 3:
        return []
    return [d for d in f.get("devices") or [] if isinstance(d, dict) and d.get("entity") and _inside(float(d.get("x") or 0), float(d.get("z") or 0), room["points"])]


def room_value(place, states, cls, lang="de") -> str:
    """the temperature or humidity of the place's room: the first sensor of that kind placed in it (or a climate's current temperature)"""
    for d in _room_devices(place):
        st = states.get(d["entity"])
        a = (st or {}).get("attributes") or {}
        if d["entity"].startswith("sensor.") and a.get("device_class") == cls and _num(st) is not None:
            return _value(st, lang)
        if cls == "temperature" and d["entity"].startswith("climate.") and isinstance(a.get("current_temperature"), (int, float)):
            return f"{dec(a['current_temperature'], lang)} °C"
    return ""


def _floors(ctx):
    place = ctx.get("place")
    return [place["floor"]] if place else [f for f in ctx.get("floors") or [] if isinstance(f, dict)]


def opened(ctx) -> list:
    """the doors and windows that are open now on the place's floor (else the house): [(x, z, name, floor id)]"""
    states, out = ctx.get("states") or {}, []
    for f in _floors(ctx):
        for w in f.get("walls") or []:
            if not isinstance(w, dict) or len(w.get("a") or []) < 2 or len(w.get("b") or []) < 2:
                continue
            (ax, az), (bx, bz) = w["a"][:2], w["b"][:2]
            length = ((bx - ax) ** 2 + (bz - az) ** 2) ** 0.5 or 1
            for o in w.get("openings") or []:
                e = o.get("entity") if isinstance(o, dict) else None
                if isinstance(e, str) and (states.get(e) or {}).get("state") in ("on", "open", "opening"):
                    k = float(o.get("pos") or 0) / length
                    x, z = ax + (bx - ax) * k, az + (bz - az) * k
                    room = next((r.get("name") for r in f.get("rooms") or [] if isinstance(r, dict) and len(r.get("points") or []) >= 3
                                 and any(_inside(x + dx, z + dz, r["points"]) for dx, dz in ((0.3, 0), (-0.3, 0), (0, 0.3), (0, -0.3)))), "")
                    out.append((x, z, o.get("name") or room or hanames.name(states.get(e), e), f.get("id")))
    return out


def lit(ctx) -> list:
    """the lamps that are on now on the place's floor (else the house): [(x, z, name, floor id)]"""
    states, out = ctx.get("states") or {}, []
    for f in _floors(ctx):
        for d in f.get("devices") or []:
            e = d.get("entity") if isinstance(d, dict) else None
            if isinstance(e, str) and e.startswith("light.") and (states.get(e) or {}).get("state") == "on":
                out.append((float(d.get("x") or 0), float(d.get("z") or 0), d.get("name") or hanames.name(states.get(e), e), f.get("id")))
    return out


def _names(items, n=3):
    names = list(dict.fromkeys(x[2] for x in items if x[2]))
    return ", ".join(names[:n]) + (f" +{len(names) - n}" if len(names) > n else "")


def row_value(key, ctx) -> str:
    """the value of an information row ('' when there is none: the row is left out)"""
    lang = ctx.get("lang") or "en"
    w, states, place = words(lang), ctx.get("states") or {}, ctx.get("place") or {}
    if key == "sensor":
        return ctx.get("name") or ""
    if key == "since":
        t = ctx.get("since") or ctx.get("now")
        return f"{_hm(t)} {w['oclock']}".strip() if t else ""
    if key == "room":
        return " · ".join(x for x in ((place.get("room") or {}).get("name"), (place.get("floor") or {}).get("name")) if x)
    if key == "temp":
        if place:
            return room_value(place, states, "temperature", lang)
        vals = [_num(s) for e, s in states.items() if e.startswith("sensor.") and (s.get("attributes") or {}).get("device_class") == "temperature"]
        vals = [v for v in vals if v is not None and -30 < v < 60]
        return f"Ø {dec(sum(vals) / len(vals), lang)} °C" if vals else ""
    if key == "hum":
        return room_value(place, states, "humidity", lang) if place else ""
    if key == "open":
        return _names(opened(ctx)) or w["allShut"]
    if key == "lights":
        return _names(lit(ctx)) or w["allOff"]
    if key == "who":
        home = [hanames.name(s, e) for e, s in sorted(states.items()) if e.startswith("person.") and s.get("state") == "home"]
        if not any(e.startswith("person.") for e in states):
            return ""
        return ", ".join(home[:3]) + (f" +{len(home) - 3}" if len(home) > 3 else "") if home else w["nobody"]
    if key == "weather":
        st = next((s for e, s in sorted(states.items()) if e.startswith("weather.")), None)
        if not st:
            return ""
        a, cond = st.get("attributes") or {}, st.get("state") or ""
        cond = {**WEATHER["en"], **WEATHER.get(ctx.get("lang"), {})}.get(cond, cond.replace("-", " "))
        t = a.get("temperature")
        return " · ".join(x for x in (f"{dec(t, lang)} {a.get('temperature_unit') or '°C'}" if isinstance(t, (int, float)) else "", cond) if x)
    if key == "alarm":
        st = next((s for e, s in sorted(states.items()) if e.startswith("alarm_control_panel.")), None)
        if not st:
            return ""
        s = st.get("state") or ""
        return w["triggered"] if s == "triggered" else w["disarmed"] if s == "disarmed" else w["armed"] if s.startswith("armed") else s
    return ""


# ---------- drawing ----------
_FONTS: dict = {}


def font(size, bold=False):
    key = (round(size), bold)
    if key not in _FONTS:
        from PIL import ImageFont
        f = None
        for name in BOLD if bold else FONT:
            try:
                f = ImageFont.truetype(name, key[0])
                break
            except OSError:
                continue
        if f is None:
            try:
                f = ImageFont.load_default(key[0])
            except TypeError:
                f = ImageFont.load_default()
        _FONTS[key] = f
    return _FONTS[key]


def _plain(s) -> str:
    """a text the plain font can draw: no emoji"""
    return re.sub(r"[\U0001F000-\U0001FFFF☀-➿️‍]", "", str(s or "")).strip()


def _rgb(hexcolor):
    return tuple(int(hexcolor[i:i + 2], 16) for i in (1, 3, 5))


def _on(color):
    """white or dark text on a colour"""
    r, g, b = color[:3]
    return (27, 34, 48) if 0.299 * r + 0.587 * g + 0.114 * b > 170 else (255, 255, 255)


def theme(card):
    if card.get("theme") == "dark":
        return {"bg": (20, 26, 37), "text": (238, 242, 248), "muted": (148, 161, 182), "line": (44, 52, 66), "chip": (35, 44, 60),
                "plan_bg": (24, 29, 40), "room": (44, 52, 68), "room_line": (78, 88, 108), "wall": (196, 204, 220), "plan_text": (186, 196, 214),
                "win": (96, 170, 236)}
    return {"bg": (255, 255, 255), "text": (27, 34, 48), "muted": (107, 116, 134), "line": (233, 236, 241), "chip": (238, 241, 246),
            "plan_bg": (246, 247, 250), "room": (214, 219, 227), "room_line": (150, 156, 166), "wall": (52, 58, 70), "plan_text": (60, 66, 78),
            "win": (110, 175, 230)}


def _fit(d, text, size, maxw, bold=False, smallest=10):
    """the font size (points) at which text fits into maxw pixels"""
    while size > smallest and d.textlength(text, font=font(size * S, bold)) > maxw:
        size -= 1
    return size


def _wrap(d, text, f, maxw) -> list:
    lines = []
    for para in text.split("\n"):
        line = ""
        for word in para.split():
            t = f"{line} {word}".strip()
            if d.textlength(t, font=f) <= maxw or not line:
                line = t
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def icon(d, kind, x, y, size, color):
    """a small sign drawn from shapes (the server's font has no emoji)"""
    c, s = color, size
    cx, cy = x + s / 2, y + s / 2
    if kind in ("water", "hum"):
        d.polygon([(cx, y + s * .08), (cx - s * .3, cy + s * .05), (cx + s * .3, cy + s * .05)], fill=c)
        d.ellipse([cx - s * .3, cy - s * .12, cx + s * .3, cy + s * .42], fill=c)
    elif kind == "smoke":
        d.polygon([(cx, y + s * .05), (cx + s * .32, cy + s * .1), (cx + s * .25, y + s * .9), (cx - s * .25, y + s * .9), (cx - s * .32, cy + s * .1)], fill=c)
    elif kind in ("gas", "co"):
        d.polygon([(cx, y + s * .08), (x + s * .95, y + s * .9), (x + s * .05, y + s * .9)], fill=c)
        d.rectangle([cx - s * .05, y + s * .38, cx + s * .05, y + s * .66], fill=_on(c))
        d.ellipse([cx - s * .06, y + s * .72, cx + s * .06, y + s * .84], fill=_on(c))
    elif kind in ("alarm", "flow", "test"):
        d.pieslice([cx - s * .32, y + s * .1, cx + s * .32, y + s * .8], 180, 360, fill=c)
        d.rectangle([cx - s * .32, y + s * .44, cx + s * .32, y + s * .72], fill=c)
        d.rectangle([cx - s * .42, y + s * .7, cx + s * .42, y + s * .78], fill=c)
        d.ellipse([cx - s * .1, y + s * .8, cx + s * .1, y + s * .96], fill=c)
    elif kind in ("since", "clock"):
        d.ellipse([x + s * .1, y + s * .1, x + s * .9, y + s * .9], outline=c, width=max(2, int(s * .1)))
        d.line([(cx, cy), (cx, y + s * .28)], fill=c, width=max(2, int(s * .09)))
        d.line([(cx, cy), (cx + s * .2, cy + s * .12)], fill=c, width=max(2, int(s * .09)))
    elif kind == "temp":
        d.rounded_rectangle([cx - s * .1, y + s * .08, cx + s * .1, y + s * .7], radius=s * .1, fill=c)
        d.ellipse([cx - s * .2, y + s * .58, cx + s * .2, y + s * .95], fill=c)
    elif kind in ("who", "sensor"):
        d.ellipse([cx - s * .2, y + s * .08, cx + s * .2, y + s * .48], fill=c)
        d.pieslice([cx - s * .38, y + s * .55, cx + s * .38, y + s * 1.3], 180, 360, fill=c)
    elif kind == "camera":
        d.rounded_rectangle([x + s * .08, y + s * .28, x + s * .92, y + s * .86], radius=s * .1, fill=c)
        d.rectangle([cx - s * .16, y + s * .16, cx + s * .16, y + s * .3], fill=c)
        d.ellipse([cx - s * .17, cy - s * .08, cx + s * .17, cy + s * .26], fill=_on(c))
    elif kind == "lights":
        d.ellipse([cx - s * .3, y + s * .06, cx + s * .3, y + s * .66], fill=c)
        d.rectangle([cx - s * .15, y + s * .6, cx + s * .15, y + s * .78], fill=c)
        d.rectangle([cx - s * .12, y + s * .82, cx + s * .12, y + s * .92], fill=c)
    elif kind == "open":
        d.rectangle([x + s * .12, y + s * .12, x + s * .88, y + s * .88], outline=c, width=max(2, int(s * .09)))
        d.line([(cx, y + s * .12), (cx, y + s * .88)], fill=c, width=max(2, int(s * .08)))
        d.line([(x + s * .12, cy), (x + s * .88, cy)], fill=c, width=max(2, int(s * .08)))
    elif kind == "weather":
        d.ellipse([cx - s * .22, cy - s * .22, cx + s * .22, cy + s * .22], fill=c)
        for i in range(8):
            a = i * math.pi / 4
            d.line([(cx + math.cos(a) * s * .3, cy + math.sin(a) * s * .3), (cx + math.cos(a) * s * .44, cy + math.sin(a) * s * .44)], fill=c, width=max(2, int(s * .07)))
    elif kind == "alarmp":
        d.polygon([(cx, y + s * .06), (x + s * .88, y + s * .22), (x + s * .8, y + s * .7), (cx, y + s * .95), (x + s * .2, y + s * .7), (x + s * .12, y + s * .22)], fill=c)
    elif kind == "room":
        d.polygon([(cx, y + s * .08), (x + s * .92, cy), (x + s * .8, cy), (x + s * .8, y + s * .9), (x + s * .2, y + s * .9), (x + s * .2, cy), (x + s * .08, cy)], fill=c)
    else:
        d.ellipse([x + s * .1, y + s * .1, x + s * .9, y + s * .9], fill=c)
        d.rectangle([cx - s * .05, cy - s * .05, cx + s * .05, y + s * .72], fill=_on(c))
        d.ellipse([cx - s * .06, y + s * .22, cx + s * .06, y + s * .34], fill=_on(c))


def _bounds(floors, room=None, pad=0.8):
    xs, zs = [], []
    if room:
        for p in room.get("points") or []:
            xs.append(float(p[0])); zs.append(float(p[1]))
        pad = 1.6
    else:
        for f in floors:
            for r in f.get("rooms") or []:
                for p in (r.get("points") or []) if isinstance(r, dict) else []:
                    xs.append(float(p[0])); zs.append(float(p[1]))
            for w in f.get("walls") or []:
                for k in ("a", "b"):
                    p = w.get(k) if isinstance(w, dict) else None
                    if isinstance(p, list) and len(p) >= 2:
                        xs.append(float(p[0])); zs.append(float(p[1]))
    if not xs:
        return None
    return min(xs) - pad, min(zs) - pad, max(xs) + pad, max(zs) + pad


def plan_floor(ctx, marks=False):
    """the floor the plan shows: the place's; else (marks) the one with the most open doors, windows and lamps that are on, else the ground
    floor (the first that is no basement)"""
    if ctx.get("place"):
        return ctx["place"]["floor"]
    floors = [f for f in ctx.get("floors") or [] if isinstance(f, dict) and f.get("rooms")]
    if marks:
        count = {}
        for x in opened(ctx) + lit(ctx):
            count[x[3]] = count.get(x[3], 0) + 1
        if count:
            return max(floors, key=lambda f: count.get(f.get("id"), 0), default=None)
    return next((f for f in floors if f.get("kind") not in ("basement", "roof")), floors[0] if floors else None)   # the ground floor


def draw_plan(ctx, th, width_px, show="floor", marks=False, lang="de"):
    """the floor from above as a picture width_px wide: the place's room in red, a ring with the word of the kind where the sensor is;
    marks: open doors and windows red, lamps that are on yellow"""
    from PIL import Image, ImageDraw
    f = plan_floor(ctx, marks)
    if not f:
        return None
    place = ctx.get("place") or {}
    room = place.get("room")
    b = _bounds([f], room if show == "room" else None)
    if not b:
        return None
    x0, z0, x1, z1 = b
    w_m, h_m = max(x1 - x0, 3.0), max(z1 - z0, 3.0)
    if h_m / w_m < 0.45:                                     # a long thin house: the picture is not flatter than this
        m = (0.45 * w_m - h_m) / 2; z0, z1, h_m = z0 - m, z1 + m, 0.45 * w_m
    if h_m / w_m > 0.95:
        h_m = 0.95 * w_m                                     # a tall house: cut (seldom; the middle stays)
        mz = (z0 + z1) / 2; z0, z1 = mz - h_m / 2, mz + h_m / 2
    s = width_px / w_m
    W, H = int(width_px), int(h_m * s)
    im = Image.new("RGB", (W, H), th["plan_bg"])
    d = ImageDraw.Draw(im, "RGBA")
    P = lambda x, z: ((x - x0) * s, (z - z0) * s)   # noqa: E731
    for r in f.get("rooms") or []:
        pts = [P(float(p[0]), float(p[1])) for p in (r.get("points") or [])] if isinstance(r, dict) else []
        if len(pts) < 3:
            continue
        mine = room is not None and r is room
        d.polygon(pts, fill=RED + (110,) if mine else th["room"], outline=RED if mine else th["room_line"], width=max(2, int(s * (0.08 if mine else 0.04))))
    for w in f.get("walls") or []:
        try:
            a, c = P(float(w["a"][0]), float(w["a"][1])), P(float(w["b"][0]), float(w["b"][1]))
        except (KeyError, TypeError, ValueError, IndexError):
            continue
        d.line([a, c], fill=th["wall"], width=max(3, int(float(w.get("thickness") or 0.2) * s * 0.8)))
        L = ((w["b"][0] - w["a"][0]) ** 2 + (w["b"][1] - w["a"][1]) ** 2) ** 0.5 or 1
        for o in w.get("openings") or []:
            if not isinstance(o, dict):
                continue
            k0 = max(0.0, (float(o.get("pos") or 0) - float(o.get("width") or 0.9) / 2) / L)
            k1 = min(1.0, (float(o.get("pos") or 0) + float(o.get("width") or 0.9) / 2) / L)
            p0 = (a[0] + (c[0] - a[0]) * k0, a[1] + (c[1] - a[1]) * k0)
            p1 = (a[0] + (c[0] - a[0]) * k1, a[1] + (c[1] - a[1]) * k1)
            d.line([p0, p1], fill=th["win"] if o.get("type") == "window" else th["plan_bg"], width=max(3, int(0.13 * s)))
    small = font(max(14, min(30, s * 0.34)), True)
    ring = (place.get("x"), place.get("z")) if place and place.get("x") is not None else None
    for r in f.get("rooms") or []:
        pts = (r.get("points") or []) if isinstance(r, dict) else []
        name = _plain(r.get("name")) if isinstance(r, dict) else ""
        if len(pts) < 3 or not name:
            continue
        cx, cz = sum(float(p[0]) for p in pts) / len(pts), sum(float(p[1]) for p in pts) / len(pts)
        tx, tz = P(cx, cz)
        if ring:
            sx, sz = P(*ring)
            if abs(tx - sx) < s * 1.6 and abs(tz - sz) < s * 0.9:
                tz += s * 0.9 if tz <= sz else -s * 0.9
        if 0 < tx < W and 0 < tz < H and d.textlength(name, font=small) < W * 0.9:
            mine = room is not None and r is room
            d.text((tx, tz), name, font=small, fill=((150, 20, 20) if th["bg"][0] > 128 else (255, 235, 232)) if mine else th["plan_text"], anchor="mm")
    w = words(lang)
    if marks:
        fid = f.get("id")
        for items, col, word in ((opened(ctx), RED, w["open1"].upper()), (lit(ctx), YELLOW, w["on1"])):
            for x, z, _n, flid in items:
                if flid != fid:
                    continue
                px, pz = P(x, z)
                rr = max(10, s * 0.26)
                d.ellipse([px - rr - 6, pz - rr - 6, px + rr + 6, pz + rr + 6], fill=col + (70,))
                d.ellipse([px - rr, pz - rr, px + rr, pz + rr], fill=col, outline=(255, 255, 255), width=3)
                f2 = font(max(12, min(24, s * 0.24)), True)
                l, t, r_, bt = d.textbbox((0, 0), word, font=f2)
                bx, by = px - (r_ - l) / 2 - 7, max(2, pz - rr - (bt - t) - 20)
                d.rounded_rectangle([bx, by, bx + r_ - l + 14, by + bt - t + 10], radius=6, fill=col)
                d.text((bx + 7 - l, by + 5 - t), word, font=f2, fill=(255, 255, 255))
    if ring:
        px, pz = P(*ring)
        rr = max(22, min(70, s * 0.7))
        d.ellipse([px - rr - 10, pz - rr - 10, px + rr + 10, pz + rr + 10], outline=RED + (90,), width=10)
        d.ellipse([px - rr, pz - rr, px + rr, pz + rr], outline=RED, width=6)
        kind = ctx.get("kind") or "test"
        word = w.get(kind, "") if kind not in ("flow",) else ""
        if word and len(word) <= 12:
            f2 = font(max(16, min(30, s * 0.34)), True)
            l, t, r_, bt = d.textbbox((0, 0), word, font=f2)
            bx, by = min(max(4, px - (r_ - l) / 2 - 11), W - (r_ - l) - 26), max(4, pz - rr - (bt - t) - 32)
            d.rounded_rectangle([bx, by, bx + r_ - l + 22, by + bt - t + 14], radius=9, fill=RED)
            d.text((bx + 11 - l, by + 7 - t), word, font=f2, fill=(255, 255, 255))
    return im


def _paste_cover(im, pic, box, radius=0):
    """the picture pic cut to fill box (x, y, w, h), with round corners"""
    from PIL import Image, ImageDraw
    x, y, w, h = (int(v) for v in box)
    pw, ph = pic.size
    k = max(w / pw, h / ph)
    pic = pic.resize((max(1, int(pw * k)), max(1, int(ph * k))))
    l, t = (pic.width - w) // 2, (pic.height - h) // 2
    pic = pic.crop((l, t, l + w, t + h)).convert("RGB")
    mask = None
    if radius:
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    im.paste(pic, (x, y), mask)


def _camera_pic(ctx):
    from PIL import Image
    data = ctx.get("camera")
    if not data:
        return None
    try:
        pic = Image.open(io.BytesIO(data))
        pic.load()
        return pic
    except Exception:  # noqa: BLE001 - a broken picture: none
        return None


def _block(card, b, ctx, th, im, d, x, y, w, full_w, col):
    """draws block b at (x, y), w pixels wide, and says how high it is (0: left out); full_w: the whole card"""
    lang, w_ = ctx.get("lang") or "en", words(ctx.get("lang"))
    k = b["k"]
    color = _rgb(card["color"])
    pad = 16 * S
    if k == "head":
        h = 74 * S
        d.rectangle([0, y, full_w, y + h], fill=color)
        fg = _on(color)
        kind = ctx.get("kind") or "test"
        d.ellipse([18 * S, y + 14 * S, 64 * S, y + 60 * S], fill=fg + (46,))
        icon(d, kind, 27 * S, y + 23 * S, 28 * S, fg)
        right = 0
        if b.get("clock"):
            t, dt = _hm(ctx.get("now")), ctx.get("now")
            ft = font(30 * S, True)
            tw = d.textlength(t, font=ft)
            d.text((full_w - 18 * S, y + 32 * S), t, font=ft, fill=fg, anchor="rs")
            if isinstance(dt, datetime.datetime):
                short = f"{w_['days'].split()[dt.weekday()][:2]}, {dt.day}. {w_['months'].split()[dt.month - 1][:3]}."
                d.text((full_w - 18 * S, y + 52 * S), short, font=font(12.5 * S), fill=fg, anchor="rs")
            right = tw + 30 * S
        title = _plain(fill(b.get("text") or "{kind}", ctx)) or w_.get(kind, "")
        maxw = full_w - 76 * S - right
        size = _fit(d, title, 27, maxw, True, 14)
        d.text((76 * S, y + 36 * S), title, font=font(size * S, True), fill=fg, anchor="ls")
        place = ctx.get("place") or {}
        sub = " · ".join(x for x in ((place.get("room") or {}).get("name"), (place.get("floor") or {}).get("name")) if x) or ctx.get("house") or ""
        sub = _plain(sub)
        if sub:
            size = _fit(d, sub, 15, maxw, False, 10)
            d.text((76 * S, y + 57 * S), sub, font=font(size * S), fill=fg, anchor="ls")
        return h
    if k == "plan":
        whole = not b.get("half") and col == "full"
        pic = draw_plan(ctx, th, full_w if whole else w, b.get("show", "floor"), b.get("marks"), lang)
        if pic is None:
            return 0
        if whole:
            im.paste(pic, (0, int(y)))
            return pic.height
        _paste_cover(im, pic, (x, y, w, pic.height), radius=10 * S)
        return pic.height
    if k == "camera":
        pic = _camera_pic(ctx)
        whole = col == "full"
        bx, bw = (0, full_w) if whole else (x, w)
        h = int(bw * (9 / 16 if whole else 3 / 4))
        if pic is None:
            if not ctx.get("preview"):
                return 0
            d.rounded_rectangle([bx, y, bx + bw, y + h], radius=0 if whole else 10 * S, fill=th["chip"])
            icon(d, "camera", bx + bw / 2 - 18 * S, y + h / 2 - 26 * S, 36 * S, th["muted"])
            msg = w_["noCamera"]
            d.text((bx + bw / 2, y + h / 2 + 24 * S), msg, font=font(_fit(d, msg, 12, bw - 16 * S) * S), fill=th["muted"], anchor="mm")
            return h
        _paste_cover(im, pic, (bx, y, bw, h), radius=0 if whole else 10 * S)
        label = _plain(f"{w_['camera']} {ctx.get('camera_name') or ''}".strip().upper())
        fl = font((11.5 if whole else 10) * S, True)
        lw = d.textlength(label, font=fl)
        lx, ly = bx + (10 if whole else 6) * S, y + (10 if whole else 6) * S
        d.rounded_rectangle([lx, ly, lx + lw + 22 * S, ly + 20 * S], radius=6 * S, fill=(0, 0, 0, 175))
        d.ellipse([lx + 6 * S, ly + 7 * S, lx + 12 * S, ly + 13 * S], fill=(255, 77, 64))
        d.text((lx + 16 * S, ly + 10 * S), label, font=fl, fill=(255, 255, 255), anchor="lm")
        return h
    if k == "clock":
        t, dt = _hm(ctx.get("now")), ctx.get("now")
        big = font(_fit(d, t, 64, w * 0.62, True, 30) * S, True)
        d.text((x, y + 8 * S), t, font=big, fill=th["text"], anchor="lt")
        l, tp, r, bt = d.textbbox((x, y + 8 * S), t, font=big, anchor="lt")
        h = bt - y + 6 * S
        if b.get("date") and isinstance(dt, datetime.datetime):
            words_ = date_words(dt, lang)
            fd = font(_fit(d, words_, 14, max(40, x + w - r - 14 * S)) * S)
            d.text((r + 14 * S, bt - 4 * S), words_, font=fd, fill=th["muted"], anchor="ls")
        return h
    if k in ("info", "values"):
        rows = []
        if k == "info":
            for key in b.get("rows") or []:
                v = row_value(key, ctx)
                if v or ctx.get("preview"):
                    rows.append((key, w_["alarmp"] if key == "alarm" else w_[key], v or "–"))
        else:
            states = ctx.get("states") or {}
            for e in b.get("ents") or []:
                st = states.get(e)
                dom = e.split(".")[0]
                ic = "temp" if (st or {}).get("attributes", {}).get("device_class") == "temperature" else "lights" if dom in ("light", "switch") else \
                    "open" if dom in ("binary_sensor", "cover") else "sensor" if dom == "person" else "info"
                rows.append((ic, hanames.name(st, e) if st else e, _value(st, lang)))
        if not rows:
            return 0
        rh = 34 * S
        for i, (key, label, value) in enumerate(rows):
            ry = y + i * rh
            d.rounded_rectangle([x, ry + 4 * S, x + 26 * S, ry + 30 * S], radius=8 * S, fill=th["chip"])
            icon(d, key, x + 5 * S, ry + 9 * S, 16 * S, th["muted"] if key not in ("open", "lights") else (RED if key == "open" else YELLOW))
            label, value = _plain(label), _plain(value)
            fl = font(13 * S)
            lw = min(d.textlength(label, font=fl), w * 0.42)
            label = label if d.textlength(label, font=fl) <= w * 0.42 else label[:max(3, int(len(label) * w * 0.42 / d.textlength(label, font=fl)) - 1)] + "…"
            d.text((x + 35 * S, ry + 17 * S), label, font=fl, fill=th["muted"], anchor="lm")
            vmax = w - 35 * S - lw - 10 * S
            fv = font(_fit(d, value, 14, vmax, True, 9) * S, True)
            if d.textlength(value, font=fv) > vmax:
                while value and d.textlength(value + "…", font=fv) > vmax:
                    value = value[:-1]
                value += "…"
            d.text((x + w, ry + 17 * S), value, font=fv, fill=th["text"], anchor="rm")
            d.line([(x, ry + rh - 1), (x + w, ry + rh - 1)], fill=th["line"], width=max(1, S))
        return len(rows) * rh
    if k == "text":
        text = _plain(fill(b.get("text") or "", ctx))
        if not text:
            return 0
        f = font((23 if b.get("big") else 15) * S, bool(b.get("big")))
        lines = _wrap(d, text, f, w)[:6]
        lh = (30 if b.get("big") else 21) * S
        for i, line in enumerate(lines):
            d.text((x, y + i * lh + 2 * S), line, font=f, fill=th["text"], anchor="lt")
        return len(lines) * lh + 4 * S
    if k == "line":
        d.line([(pad, y + 6 * S), (full_w - pad, y + 6 * S)], fill=th["line"], width=2 * S)
        return 12 * S
    if k == "foot":
        d.line([(0, y), (full_w, y)], fill=th["line"], width=max(1, S))
        fs = font(11.5 * S)
        d.text((pad, y + 16 * S), _plain(ctx.get("house") or ""), font=fs, fill=th["muted"], anchor="lm")
        d.text((full_w - pad, y + 16 * S), _plain(f"{w_['card']} „{card['name']}“ · 3D Floorplan"), font=fs, fill=th["muted"], anchor="rm")
        return 32 * S
    return 0


def render(card, ctx) -> bytes:
    """the card as a PNG picture (2 pixels per point, 960 or 1280 wide)"""
    from PIL import Image, ImageDraw
    card = clean_card(card) or clean_card({"blocks": [{"k": "head"}]})
    th = theme(card)
    W = W_PT[card["width"]] * S
    im = Image.new("RGB", (W, 6000), th["bg"])
    d = ImageDraw.Draw(im, "RGBA")
    pad, gap = 16 * S, 10 * S
    y, last = 0, None
    for row in rows_of(card["blocks"]):
        edge = row[0]["k"] in ("head", "foot") or (len(row) == 1 and row[0]["k"] == "camera") or (len(row) == 1 and row[0]["k"] == "plan")
        if not edge and last != "edge":
            y += gap if y else pad
        elif not edge:
            y += gap + 2 * S
        if len(row) == 1:
            h = _block(card, row[0], ctx, th, im, d, pad, y, W - 2 * pad, W, "full")
        else:
            cw = (W - 2 * pad - 14 * S) // 2
            h = max(_block(card, row[0], ctx, th, im, d, pad, y, cw, W, "left"),
                    _block(card, row[1], ctx, th, im, d, pad + cw + 14 * S, y, cw, W, "right"))
        if h:
            y += h
            last = "edge" if edge else "inner"
        if y > 5200:
            break
    if last == "inner":
        y += pad
    out = io.BytesIO()
    im.crop((0, 0, W, max(int(y), 40 * S))).save(out, "PNG", optimize=True)
    return out.getvalue()
