"""Data for the pages of the tab bar (#481): what the add-on asks Home Assistant for the pages ⚡ Energie (the meters of its energy
dashboard and their long-term statistics) and ☀ Heute (the weather forecast and the calendars), checked and cut down to what the pages
show; for 👨‍👩‍👧 Familie (#483) the people with the battery of their phone, and the notes of the pinboard the add-on keeps. Pure
functions (unit test: tests/test_pages.py); server.py does the asking and the storing."""
import math
import re
from datetime import datetime, timezone

import controls

STAT_ID = re.compile(r"^[a-z0-9_]+[.:][a-z0-9_]{1,200}$")      # an entity ("sensor.x") or an external statistic ("domain:x")
CALENDAR_ID = re.compile(r"^calendar\.[a-z0-9_]{1,200}$")
WEATHER_ID = re.compile(r"^weather\.[a-z0-9_]{1,200}$")
PERIODS = ("hour", "day", "week", "month")
METER_KEYS = ("from", "to", "solar", "batIn", "batOut", "gas", "water")   # grid import, export, solar, into / out of the battery, gas, water
MAX_IDS = 60
MAX_SPAN_DAYS = {"hour": 8, "day": 70, "week": 800, "month": 800}   # the page asks for a period and the one before: 2 days, 2 months, 2 years


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else None


def _stat(v):
    return v if isinstance(v, str) and STAT_ID.match(v) else None


def energy_meters(prefs) -> dict:
    """What Home Assistant's energy dashboard counts with, by kind: {"meters": {from, to, solar, batIn, batOut, gas, water: [ids]},
    "devices": [{"id", "name"}], "price": {"buy", "sell"} (fixed prices per kWh, when it has them)}. Both the flat form of the sources
    (stat_energy_from / stat_energy_to on the grid itself) and the older one (flow_from / flow_to) are read."""
    meters = {k: [] for k in METER_KEYS}
    price, devices = {}, []

    def add(kind, v):
        s = _stat(v)
        if s and s not in meters[kind]:
            meters[kind].append(s)
    for src in (prefs or {}).get("energy_sources") or []:
        if not isinstance(src, dict):
            continue
        kind = src.get("type")
        if kind == "grid":
            flows_in = [src] + [f for f in src.get("flow_from") or [] if isinstance(f, dict)]
            flows_out = [src] + [f for f in src.get("flow_to") or [] if isinstance(f, dict)]
            for f in flows_in:
                add("from", f.get("stat_energy_from"))
                if "buy" not in price and _num(f.get("number_energy_price")) is not None and f.get("stat_energy_from"):
                    price["buy"] = f["number_energy_price"]
            for f in flows_out:
                add("to", f.get("stat_energy_to"))
            sell = _num(src.get("number_energy_price_export"))
            if sell is None:
                sell = next((_num(f.get("number_energy_price")) for f in flows_out[1:] if _num(f.get("number_energy_price")) is not None), None)
            if sell is not None:
                price["sell"] = sell
        elif kind == "solar":
            add("solar", src.get("stat_energy_from"))
        elif kind == "battery":
            add("batOut", src.get("stat_energy_from"))                 # out of the battery into the house
            add("batIn", src.get("stat_energy_to"))
        elif kind in ("gas", "water"):
            add(kind, src.get("stat_energy_from"))
    for d in (prefs or {}).get("device_consumption") or []:
        s = _stat(d.get("stat_consumption")) if isinstance(d, dict) else None
        if s and all(x["id"] != s for x in devices):
            devices.append({"id": s, "name": (d.get("name") or "")[:80] if isinstance(d.get("name"), str) else ""})
    return {"meters": meters, "devices": devices[:40], "price": price}


def _when(v):
    """an ISO date and time with its time zone -> datetime, else None"""
    if not isinstance(v, str) or len(v) > 40:
        return None
    try:
        d = datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        return None
    return d if d.tzinfo else None


def clean_stats_request(body):
    """The page's question for statistics: ({ids, start, end, period}, None) or (None, why it is refused)."""
    if not isinstance(body, dict):
        return None, "invalid request"
    ids = []
    for v in body.get("ids") if isinstance(body.get("ids"), list) else []:
        s = _stat(v)
        if s and s not in ids:
            ids.append(s)
    if not ids:
        return None, "no statistics asked for"
    if len(ids) > MAX_IDS:
        return None, "too many statistics"
    start, end = _when(body.get("start")), _when(body.get("end"))
    if not start or not end or end <= start:
        return None, "start and end must be dates with a time zone, end after start"
    period = body.get("period")
    if period not in PERIODS:
        return None, "unknown period"
    if (end - start).days > MAX_SPAN_DAYS[period]:
        return None, "too long a span"
    return {"ids": ids, "start": start.isoformat(), "end": end.isoformat(), "period": period}, None


def _ms(v):
    """the start of a statistic row in ms since 1970 (Home Assistant sends ms, older versions seconds or an ISO text)"""
    n = _num(v)
    if n is not None:
        return int(n if n > 1e11 else n * 1000)
    d = _when(v)
    return int(d.timestamp() * 1000) if d else None


POWER_FACTOR = {"W": 0.001, "kW": 1.0, "MW": 1000.0}          # a power sensor's mean -> kW (Home Assistant converts to kW when asked)
PERIOD_HOURS = {"hour": 1, "day": 24, "week": 168, "month": 730}


def slim_stats(result, metadata=None, period: str = "hour") -> dict:
    """Home Assistant's answer to recorder/statistics_during_period (types: change, mean) -> {"stats": {id: [[start ms, kWh or m³], ...]},
    "units": {id: unit}} (the unit after the conversion asked for: kWh for energy, m³ for volume). A meter that is a power sensor (W,
    #503, the owner: "dass es egal ist ob W oder kWh") counts the energy of its time-weighted mean: kW × the hours of the row (kWh)."""
    units, power = {}, {}
    for m in metadata or []:
        if isinstance(m, dict) and _stat(m.get("statistic_id")):
            cls, u = m.get("unit_class"), m.get("statistics_unit_of_measurement")
            if cls == "power" or u in POWER_FACTOR:
                power[m["statistic_id"]] = 1.0 if cls == "power" else POWER_FACTOR[u]   # converted to kW by Home Assistant, else as stored
                units[m["statistic_id"]] = "kWh"
            else:
                units[m["statistic_id"]] = "kWh" if cls == "energy" else "m³" if cls == "volume" else (u[:12] if isinstance(u, str) else "")
    out = {}
    for sid, rows in (result or {}).items():
        if not _stat(sid) or not isinstance(rows, list):
            continue
        pts = []
        for r in rows:
            a = _ms(r.get("start")) if isinstance(r, dict) else None
            if a is None:
                continue
            if sid in power:
                b, mean = _ms(r.get("end")), _num(r.get("mean"))
                hours = (b - a) / 3600000 if b and b > a else PERIOD_HOURS.get(period, 1)
                v = mean * power[sid] * hours if mean is not None else None
            else:
                v = _num(r.get("change"))
            pts.append([a, round(v, 4) if v is not None else None])
        out[sid] = pts[:800]
    return {"stats": out, "units": units}


def slim_forecast(response, entity: str) -> list:
    """weather.get_forecasts with return_response -> [{t, c, hi, lo, p, pp, day}] (time, condition, temperature, low, precipitation,
    its probability, daytime), at most 48 rows. The answer comes as {service_response: {entity: {forecast: [...]}}} or without the
    outer key."""
    resp = response.get("service_response", response) if isinstance(response, dict) else {}
    rows = ((resp or {}).get(entity) or {}).get("forecast") if isinstance(resp, dict) else None
    out = []
    for r in rows if isinstance(rows, list) else []:
        if not isinstance(r, dict) or not _when(r.get("datetime")):
            continue
        out.append({"t": r["datetime"], "c": r.get("condition")[:24] if isinstance(r.get("condition"), str) else "",
                    "hi": _num(r.get("temperature")), "lo": _num(r.get("templow")), "p": _num(r.get("precipitation")),
                    "pp": _num(r.get("precipitation_probability")), "day": r.get("is_daytime") if isinstance(r.get("is_daytime"), bool) else None})
    return out[:48]


def _event_time(v):
    """a calendar event's start or end: ({"dateTime": ...} or {"date": "YYYY-MM-DD"}) -> (text, all day)"""
    if isinstance(v, dict):
        if _when(v.get("dateTime")):
            return v["dateTime"], False
        if isinstance(v.get("date"), str) and re.match(r"^\d{4}-\d{2}-\d{2}$", v["date"]):
            return v["date"], True
    if isinstance(v, str):
        if _when(v):
            return v, False
        if re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            return v, True
    return None, False


def slim_events(events, cal: str, limit: int = 50) -> list:
    """the events of one calendar (GET /api/calendars/<id>) -> [{s, e, allDay, title, cal}], at most `limit` (50; a calendar card's month 150)"""
    out = []
    for ev in events if isinstance(events, list) else []:
        if not isinstance(ev, dict):
            continue
        s, all_day = _event_time(ev.get("start"))
        e, _ = _event_time(ev.get("end"))
        if not s:
            continue
        title = ev.get("summary") if isinstance(ev.get("summary"), str) else ""
        out.append({"s": s, "e": e, "allDay": all_day, "title": title[:120], "cal": cal})
    return out[:limit]


def clean_calendars(val) -> list:
    """the calendars chosen for the page ☀ Heute: calendar entity ids, each once, at most 20"""
    out = []
    for v in val if isinstance(val, list) else []:
        if isinstance(v, str) and CALENDAR_ID.match(v) and v not in out:
            out.append(v)
    return out[:20]


def agenda_window(start, end, days: int = 14):
    """the days asked for by the page (ISO with time zone, at most `days` apart: 14, a calendar card's month 42) -> (start, end) as UTC
    texts for Home Assistant, or None"""
    a, b = _when(start), _when(end)
    if not a or not b or b <= a or (b - a).days > days:
        return None
    return a.astimezone(timezone.utc).isoformat(), b.astimezone(timezone.utc).isoformat()


# ---------- 👨‍👩‍👧 Familie (#483): the people and the pinboard ----------
PERSON_ID = re.compile(r"^person\.[a-z0-9_]{1,200}$")
# a person's picture lies in Home Assistant: an uploaded one (image/serve) or one in its www folder (/local); nothing from elsewhere
PICTURE = re.compile(r"^/(?:api/image/serve/[A-Za-z0-9_-]{1,64}/[0-9x]{1,12}|local/[A-Za-z0-9_./ -]{1,200})(?:\?[A-Za-z0-9=&_.-]{0,200})?$")
MAX_PEOPLE = 30


def person_picture(state):
    """the path of a person's picture in Home Assistant (its entity_picture), or None"""
    pic = ((state or {}).get("attributes") or {}).get("entity_picture") if isinstance(state, dict) else None
    return pic if isinstance(pic, str) and PICTURE.match(pic) and ".." not in pic else None


def _level(v):
    try:
        n = float(v)
    except (TypeError, ValueError):
        return None
    return round(n) if math.isfinite(n) and 0 <= n <= 100 else None


def phone_battery(tracker, by_id, device_of, on_device):
    """(battery %, charging) of the phone behind a device_tracker: the battery sensor of the same device (the companion app has
    sensor.<phone>_battery_level and _battery_state), else the tracker's own battery_level; (None, None) when nothing says it"""
    level, charging = None, None
    dev = device_of.get(tracker)
    for e in sorted(on_device.get(dev, [])) if dev else []:
        st = by_id.get(e) or {}
        a, val = st.get("attributes") or {}, st.get("state")
        if e.startswith("sensor.") and a.get("device_class") == "battery" and level is None:
            level = _level(val)
        elif e.startswith("binary_sensor.") and a.get("device_class") == "battery_charging":
            charging = val == "on"
        elif e.startswith("sensor.") and e.endswith("battery_state") and charging is None and isinstance(val, str):
            charging = val.lower().replace(" ", "_") in ("charging", "full")
    if level is None:
        a = (by_id.get(tracker) or {}).get("attributes") or {}
        level = _level(a.get("battery_level", a.get("battery")))
    return level, charging


SOURCE_KIND = {"gps": "gps", "router": "wifi", "bluetooth": "bluetooth", "bluetooth_le": "bluetooth"}
MAX_SOURCES = 8


def person_sources(trackers, by_id, device_of, on_device) -> list:
    """Where the add-on can see that a person is at home (#495, the owner: "ob jetzt wirklich eine Person im Haus ist … mit dem Handy, dass es
    sich mit dem WLAN verbindet"): every device_tracker of the person with its kind (source_type: gps, router = wifi, bluetooth), and of
    the phone behind it (the same device in the entity registry) the Wi-Fi it is connected to (the companion app's
    sensor.<phone>_wifi_connection or _ssid) and its room (Bermuda / ESPresense: sensor.<phone>_area or _room).
    [{"kind": "gps" | "wifi" | "bluetooth" | "other" | "ssid" | "room", "entity", "state", "since"}], at most MAX_SOURCES"""
    out, seen = [], set()

    def add(kind, e):
        st = by_id.get(e)
        if not st or e in seen:
            return
        seen.add(e)
        since = st.get("last_changed") if isinstance(st.get("last_changed"), str) and _when(st.get("last_changed")) else None
        out.append({"kind": kind, "entity": e, "state": str(st.get("state") or "")[:80], "since": since})
    for tr in dict.fromkeys(trackers):
        a = (by_id.get(tr) or {}).get("attributes") or {}
        add(SOURCE_KIND.get(a.get("source_type"), "other"), tr)
        dev = device_of.get(tr)
        for e in sorted(on_device.get(dev, [])) if dev else []:
            if not e.startswith("sensor."):
                continue
            if e.endswith("_wifi_connection") or e.endswith("_ssid"):
                add("ssid", e)
            elif e.endswith("_area") or e.endswith("_room"):
                add("room", e)
    return out[:MAX_SOURCES]


def clean_presence(val) -> dict:
    """the settings of "wer ist wirklich zu Hause" (#495): {"rule": "ha" (as Home Assistant's person says) | "any" (one source says home) |
    "two" (two do), "ssids": the names of the home Wi-Fi (the phone's network counts as home), at most 6}"""
    v = val if isinstance(val, dict) else {}
    ssids = []
    for x in v.get("ssids") if isinstance(v.get("ssids"), list) else []:
        if isinstance(x, str) and x.strip() and x.strip()[:64] not in ssids:
            ssids.append(x.strip()[:64])
    return {"rule": v.get("rule") if v.get("rule") in ("ha", "any", "two") else "ha", "ssids": ssids[:6]}


def family(states, registry) -> list:
    """Home Assistant's people (GET /api/states) with what the page shows: [{"id", "name", "state", "since" (last_changed), "picture"
    (it has one), "battery", "charging", "sources" (person_sources: Wi-Fi, GPS, room …)}]. The phone: the person's device_tracker in use (its "source"), else its first one; its device
    from the entity registry (config/entity_registry/list)."""
    by_id = {s["entity_id"]: s for s in states if isinstance(s, dict) and isinstance(s.get("entity_id"), str)} if isinstance(states, list) else {}
    device_of, on_device = {}, {}
    for e in registry if isinstance(registry, list) else []:
        if isinstance(e, dict) and isinstance(e.get("entity_id"), str) and isinstance(e.get("device_id"), str) and e["device_id"]:
            device_of[e["entity_id"]] = e["device_id"]
            on_device.setdefault(e["device_id"], []).append(e["entity_id"])
    out = []
    for eid in sorted(by_id):
        if not PERSON_ID.match(eid):
            continue
        s = by_id[eid]
        a = s.get("attributes") or {}
        trackers = [x for x in [a.get("source"), *(a.get("device_trackers") if isinstance(a.get("device_trackers"), list) else [])]
                    if isinstance(x, str) and x.startswith("device_tracker.")]
        battery, charging = None, None
        for tr in dict.fromkeys(trackers):
            battery, charging = phone_battery(tr, by_id, device_of, on_device)
            if battery is not None:
                break
        name = a.get("friendly_name") if isinstance(a.get("friendly_name"), str) and a.get("friendly_name") else eid[7:]
        out.append({"id": eid, "name": name[:80], "state": str(s.get("state") or "")[:80],
                    "since": s.get("last_changed") if isinstance(s.get("last_changed"), str) and _when(s.get("last_changed")) else None,
                    "picture": person_picture(s) is not None, "battery": battery, "charging": charging,
                    "sources": person_sources(trackers, by_id, device_of, on_device)})
    return out[:MAX_PEOPLE]


NOTE_COLORS = ("yellow", "green", "blue", "pink")
MAX_NOTES = 30
MAX_NOTE = 300
NOTE_ID = re.compile(r"^[a-f0-9]{8,32}$")
CONTROL = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")


def note_text(v) -> str:
    """the text of a note (like cleanNote in static/family.js): control characters out, at most two empty lines in a row, trimmed, at
    most MAX_NOTE characters"""
    if not isinstance(v, str):
        return ""
    return re.sub(r"\n{3,}", "\n\n", CONTROL.sub("", v)).strip()[:MAX_NOTE]


def clean_notes(val) -> list:
    """the stored notes made safe: [{"id", "text", "by", "at", "color"}], newest first, at most MAX_NOTES"""
    out, seen = [], set()
    for n in val if isinstance(val, list) else []:
        if not isinstance(n, dict) or not isinstance(n.get("id"), str) or not NOTE_ID.match(n["id"]) or n["id"] in seen:
            continue
        text, at = note_text(n.get("text")), _when(n.get("at"))
        if not text or not at:
            continue
        seen.add(n["id"])
        out.append({"id": n["id"], "text": text, "by": n["by"][:80] if isinstance(n.get("by"), str) else "", "at": at.astimezone(timezone.utc).isoformat(),
                    "color": n.get("color") if n.get("color") in NOTE_COLORS else NOTE_COLORS[0]})
    out.sort(key=lambda n: n["at"], reverse=True)
    return out[:MAX_NOTES]


def new_note(body, by: str, now: datetime, nid: str):
    """(a new note, None) from what the page sent ({"text", "color"}), or (None, why not)"""
    if not isinstance(body, dict):
        return None, "invalid request"
    text = note_text(body.get("text"))
    if not text:
        return None, "the note is empty"
    color = body.get("color") if body.get("color") in NOTE_COLORS else NOTE_COLORS[0]
    return {"id": nid, "text": text, "by": (by or "").strip()[:80], "at": now.astimezone(timezone.utc).isoformat(), "color": color}, None


def add_note(notes: list, note: dict) -> list:
    """the note in front of the others; a full pinboard lets its oldest note go"""
    return clean_notes([note, *notes])


# ---------- 🎵 Musik & TV (#490) ----------
MAX_STATIONS = 20


def clean_stations(val) -> list:
    """The radio stations of ⚙ (cleanStations in static/media.js): [{"name", "url"}], a stream (http/https) or one of Home Assistant's
    media (media-source://), each address once, at most MAX_STATIONS; a name of 40 characters at most (the address when it has none)."""
    out, seen = [], set()
    for v in val if isinstance(val, list) else []:
        url = v.get("url").strip() if isinstance(v, dict) and isinstance(v.get("url"), str) else ""
        if not controls.STATION.match(url) or url in seen:
            continue
        name = v.get("name").strip() if isinstance(v.get("name"), str) else ""
        seen.add(url)
        out.append({"name": (CONTROL.sub(" ", name) or url)[:40], "url": url})
    return out[:MAX_STATIONS]


def media_picture(state):
    """the address of a player's picture at Home Assistant (its media proxy), never anything else"""
    a = state.get("attributes") if isinstance(state, dict) else None
    v = a.get("entity_picture") if isinstance(a, dict) else None
    return v if isinstance(v, str) and controls.MEDIA_PICTURE.match(v) else None
