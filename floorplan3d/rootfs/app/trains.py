"""🚆 The departures of a train station for the card "Zug" (#550, the owner: "dass man sich so seine Verbindung reinmacht, um zu schauen,
ob morgens der Zug richtig kommt oder nicht … als Karte dazu").

The add-on asks the free service the Home Assistant integration "DB Infoscreen" uses (dbf.finalrewind.org, data of Deutsche Bahn, no
key): GET <base>/<station>.json?via=<station> -> {"departures": [{scheduledDeparture "07:12", delayDeparture (minutes), platform,
scheduledPlatform, train "RE 4711", destination, isCancelled, messages, via}]}. With "DB Infoscreen" in Home Assistant the card reads its
sensor instead (attribute next_departures, the same fields). rows makes one list out of either; pure (unit test: tests/test_trains.py),
server.py fetches and keeps an answer a minute.

The service lists only the next 3 hours: in the evening "mein Zug" of tomorrow morning is not among them (the owner: "mache es so, dass ich
auch immer den auch morgen sehe"). remember keeps what the railway said of it when it was (train, destination, platform), so the card shows
it while it is still hours away."""
import datetime
import re
from urllib.parse import quote, urlencode

DBF = "https://dbf.finalrewind.org"
HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
MAX_ROWS = 20
SEEN_MAX = 40            # "mein Zug" of this many cards remembered (trains-seen.json), the oldest go


def clean_text(v, n=60) -> str:
    """a station's name as typed (no control characters, no slash)"""
    return re.sub(r"[\x00-\x1f\x7f/\\?#]", "", v).strip()[:n] if isinstance(v, str) else ""


def url(base: str, station: str, via: str = "") -> str:
    """the address of the departures of a station (towards via)"""
    q = urlencode({"via": via}) if via else ""
    return f"{base.rstrip('/')}/{quote(station, safe='-:,')}.json" + (f"?{q}" if q else "")


def _hhmm(v) -> str:
    """"07:12", an ISO time or seconds since 1970 -> "07:12" ('' when it is none)"""
    if isinstance(v, str):
        v = v.strip()
        if HHMM.match(v):
            return v
        if re.match(r"^\d:[0-5]\d$", v):
            return "0" + v
        try:
            return datetime.datetime.fromisoformat(v.replace("Z", "+00:00")).strftime("%H:%M")
        except ValueError:
            return ""
    if isinstance(v, (int, float)) and not isinstance(v, bool) and v > 10 ** 8:
        return datetime.datetime.fromtimestamp(v).strftime("%H:%M")
    return ""


def _int(v):
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return int(v)
    if isinstance(v, str) and re.match(r"^[+-]?\d{1,4}$", v.strip()):
        return int(v)
    return None


def _str(v, n=40) -> str:
    return str(v).strip()[:n] if isinstance(v, (str, int, float)) and not isinstance(v, bool) else ""


def _notes(m) -> list:
    """the remarks of Deutsche Bahn (delays, changes): {"delay": [{"text"}], "qos": [...]} or a list, at most three, each once"""
    out = []
    items = [x for v in m.values() for x in (v if isinstance(v, list) else [v])] if isinstance(m, dict) else m if isinstance(m, list) else []
    for x in items:
        text = x.get("text") if isinstance(x, dict) else x if isinstance(x, str) else None
        if isinstance(text, str) and text.strip() and text.strip()[:120] not in out:
            out.append(text.strip()[:120])
    return out[:3]


def rows(data) -> list:
    """the departures as the card shows them: [{at "07:12" (as planned), delay (minutes or None when not known), platform, planned (the
    planned platform), train, dest, cancelled, notes [text], via [station]}]; data: the answer of the service, or a list (a sensor)"""
    deps = data.get("departures") if isinstance(data, dict) else data
    out = []
    for d in deps if isinstance(deps, list) else []:
        if not isinstance(d, dict):
            continue
        at = _hhmm(d.get("scheduledDeparture") or d.get("sched_dep") or d.get("scheduledTime") or d.get("dep") or d.get("datetime"))
        if not at:
            continue
        delay = _int(d.get("delayDeparture", d.get("dep_delay", d.get("delay"))))
        via = [_str(x, 60) for x in d.get("via") if _str(x, 60)][:4] if isinstance(d.get("via"), list) else []
        out.append({"at": at, "delay": delay, "platform": _str(d.get("platform"), 8), "planned": _str(d.get("scheduledPlatform"), 8),
                    "train": _str(d.get("train") or d.get("line"), 30), "dest": _str(d.get("destination") or d.get("direction"), 60),
                    "cancelled": bool(d.get("isCancelled") or d.get("cancelled") or d.get("is_cancelled")), "notes": _notes(d.get("messages")),
                    "via": via})
        if len(out) >= MAX_ROWS:
            break
    return out


def from_sensor(attrs) -> list:
    """the departures of a sensor of the integration "DB Infoscreen" (its attribute next_departures)"""
    a = attrs if isinstance(attrs, dict) else {}
    return rows(a.get("next_departures") or a.get("departures") or [])


def error_of(data) -> str:
    """what the service says went wrong ('' for nothing): an unknown station, a station with several names"""
    if isinstance(data, dict) and data.get("error"):
        return _str(data["error"], 200)
    return ""


def _min(v):
    return int(v[:2]) * 60 + int(v[3:]) if isinstance(v, str) and HHMM.match(v) else None


def mine_of(rows, mine: str):
    """"mein Zug": the departure planned at mine ("07:12"), else the first planned up to 10 minutes later (as mineOf in trains.js); None"""
    m = _min(mine)
    if m is None or not isinstance(rows, list):
        return None
    rows = [r for r in rows if isinstance(r, dict)]
    return next((r for r in rows if r.get("at") == mine), None) or next(
        (r for r in rows if _min(r.get("at")) is not None and 0 < _min(r.get("at")) - m <= 10), None)


def remember(seen: dict, key: str, row, now: float) -> bool:
    """keeps "mein Zug" of key as the railway listed it ({key: {at, train, dest, platform (the planned one), t}}); True when seen changed.
    The same train again is written once a day only (t keeps the oldest last)."""
    if not isinstance(row, dict) or not row.get("at"):
        return False
    e = {"at": row["at"], "train": _str(row.get("train"), 30), "dest": _str(row.get("dest"), 60),
         "platform": _str(row.get("planned") or row.get("platform"), 8)}
    old = seen.get(key) if isinstance(seen.get(key), dict) else {}
    if all(old.get(k) == v for k, v in e.items()) and now - (old.get("t") or 0) < 86400:
        return False
    seen[key] = {**e, "t": round(now)}
    for k in sorted(seen, key=lambda k: seen[k].get("t") or 0 if isinstance(seen[k], dict) else 0)[:-SEEN_MAX]:
        seen.pop(k, None)
    return True
