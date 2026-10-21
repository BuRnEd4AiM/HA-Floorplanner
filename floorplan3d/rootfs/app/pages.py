"""Data for the pages of the tab bar (#481): what the add-on asks Home Assistant for the pages ⚡ Energie (the meters of its energy
dashboard and their long-term statistics) and ☀ Heute (the weather forecast and the calendars), checked and cut down to what the pages
show. Pure functions (unit test: tests/test_pages.py); server.py does the asking."""
import math
import re
from datetime import datetime, timezone

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


def slim_stats(result, metadata=None) -> dict:
    """Home Assistant's answer to recorder/statistics_during_period (types: change) -> {"stats": {id: [[start ms, change], ...]},
    "units": {id: unit}} (the unit after the conversion asked for: kWh for energy, m³ for volume)."""
    out = {}
    for sid, rows in (result or {}).items():
        if not _stat(sid) or not isinstance(rows, list):
            continue
        out[sid] = [[_ms(r.get("start")), round(_num(r.get("change")), 4) if _num(r.get("change")) is not None else None]
                    for r in rows if isinstance(r, dict) and _ms(r.get("start")) is not None][:800]
    units = {}
    for m in metadata or []:
        if isinstance(m, dict) and _stat(m.get("statistic_id")):
            cls, u = m.get("unit_class"), m.get("statistics_unit_of_measurement")
            units[m["statistic_id"]] = "kWh" if cls == "energy" else "m³" if cls == "volume" else (u[:12] if isinstance(u, str) else "")
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


def slim_events(events, cal: str) -> list:
    """the events of one calendar (GET /api/calendars/<id>) -> [{s, e, allDay, title, cal}], at most 50"""
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
    return out[:50]


def clean_calendars(val) -> list:
    """the calendars chosen for the page ☀ Heute: calendar entity ids, each once, at most 20"""
    out = []
    for v in val if isinstance(val, list) else []:
        if isinstance(v, str) and CALENDAR_ID.match(v) and v not in out:
            out.append(v)
    return out[:20]


def agenda_window(start, end):
    """the days asked for by the page (ISO with time zone, at most 14 days apart) -> (start, end) as UTC texts for Home Assistant, or None"""
    a, b = _when(start), _when(end)
    if not a or not b or b <= a or (b - a).days > 14:
        return None
    return a.astimezone(timezone.utc).isoformat(), b.astimezone(timezone.utc).isoformat()
