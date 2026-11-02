"""📅 Besondere Tage for the routines (the owner, 2026-11-01: "dass man jetzt zum Beispiel sagen kann, diese Automatisierung soll aber am
folgenden Tag, keine Ahnung, lass es Feiertag sein oder einen vordefinierten Tag, soll sie an diesem Tag anders sein, wie zum Beispiel an
Halloween, an Heiligabend soll zum Beispiel der Rollladen nicht ganz hochfahren").

One list of days for all routines (rules.json "days"), each of one kind:
  date      the same day every year (Heiligabend 12-24), or from … to (12-24 … 12-26, also over the new year: 12-27 … 01-06)
  once      one day or a few in a row, once (tomorrow, the holidays 2026-12-21 … 2027-01-03)
  easter    a day before or after Easter Sunday (Rosenmontag: -48)
  holidays  the public holidays of Germany or of one German state (BW …); another country: a calendar of Home Assistant's "Holiday"
  calendar  a calendar of Home Assistant: the day counts while it has an event (an event of the whole day: all day)
A routine asks with the block "Nur wenn: besonderer Tag" (flows.py if_special): today is (not) one of these days, or one of them at all.
Home Assistant gets the same as one template condition (haflows.py): the dates of the next ten years written out.

Pure (unit test: tests/test_specialdays.py; static/specialdays.js is the same for the page, tests/specialdays.test.mjs)."""
import datetime
import re

DAY_ID = re.compile(r"^d_[a-z0-9]{1,16}$")
CAL = re.compile(r"^calendar\.[a-z0-9_]{1,100}$")
MD = re.compile(r"^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")
YMD = re.compile(r"^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")
KINDS = ("date", "once", "easter", "holidays", "calendar")
REGIONS = ("DE", "BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH")
MAX_DAYS, MAX_ONCE, YEARS = 30, 366, 10
# the public holidays of Germany: key, the day (MM-DD, days after Easter Sunday, or "bbt": Buß- und Bettag), the states ("*": all)
HOLIDAYS = (
    ("newyear", "01-01", "*"),
    ("epiphany", "01-06", "BW BY ST"),
    ("womensday", "03-08", "BE MV"),
    ("goodfriday", -2, "*"),
    ("eastersunday", 0, "BB HE"),
    ("eastermonday", 1, "*"),
    ("mayday", "05-01", "*"),
    ("ascension", 39, "*"),
    ("whitsunday", 49, "BB HE"),
    ("whitmonday", 50, "*"),
    ("corpuschristi", 60, "BW BY HE NW RP SL"),
    ("assumption", "08-15", "SL"),
    ("childrensday", "09-20", "TH"),
    ("unity", "10-03", "*"),
    ("reformation", "10-31", "BB HB HH MV NI SN ST SH TH"),
    ("allsaints", "11-01", "BW BY NW RP SL"),
    ("repentance", "bbt", "SN"),
    ("xmas1", "12-25", "*"),
    ("xmas2", "12-26", "*"),
)


def _date(s):
    try:
        return datetime.date.fromisoformat(s)
    except (TypeError, ValueError):
        return None


def _md_ok(s) -> bool:
    return isinstance(s, str) and bool(MD.match(s)) and _date(f"2024-{s}") is not None      # 2024: a leap year, 02-29 is a day


def _text(v, n) -> str:
    return re.sub(r"[\x00-\x1f\x7f]", "", v).strip()[:n] if isinstance(v, str) else ""


def clean_day(d) -> dict | None:
    """one day made safe, None when it is none"""
    if not isinstance(d, dict) or not isinstance(d.get("id"), str) or not DAY_ID.match(d["id"]) or d.get("kind") not in KINDS:
        return None
    k = d["kind"]
    out = {"id": d["id"], "kind": k, "name": _text(d.get("name"), 40), "icon": _text(d.get("icon"), 8)}
    if k == "date":
        if not _md_ok(d.get("md")):
            return None
        out["md"] = d["md"]
        if _md_ok(d.get("to")) and d["to"] != d["md"]:
            out["to"] = d["to"]
    elif k == "once":
        a = _date(d.get("from")) if isinstance(d.get("from"), str) and YMD.match(d["from"]) else None
        if not a:
            return None
        b = _date(d.get("to")) if isinstance(d.get("to"), str) and YMD.match(d["to"]) else None
        b = b if b and a <= b <= a + datetime.timedelta(days=MAX_ONCE) else a
        out.update({"from": a.isoformat(), "to": b.isoformat()})
    elif k == "easter":
        off = d.get("off")
        out["off"] = max(-70, min(70, off)) if isinstance(off, int) and not isinstance(off, bool) else 0
    elif k == "holidays":
        out["region"] = d["region"] if d.get("region") in REGIONS else "DE"
    elif k == "calendar":
        if not isinstance(d.get("ent"), str) or not CAL.match(d["ent"]):
            return None
        out["ent"] = d["ent"]
    return out


def clean_days(data) -> list:
    """the list of special days as it is kept (each id once, at most MAX_DAYS)"""
    out, ids = [], set()
    for d in data if isinstance(data, list) else []:
        c = clean_day(d)
        if c and c["id"] not in ids and len(out) < MAX_DAYS:
            ids.add(c["id"])
            out.append(c)
    return out


def clean_ids(v) -> list:
    """the days a block of a routine asks for (empty: any special day)"""
    out = []
    for x in v if isinstance(v, list) else []:
        if isinstance(x, str) and DAY_ID.match(x) and x not in out:
            out.append(x)
    return out[:MAX_DAYS]


# ---------- the dates ----------
def easter(year: int) -> datetime.date:
    """Easter Sunday (Gregorian calendar, the "anonymous" rule)"""
    a, b, c = year % 19, year // 100, year % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    m = (32 + 2 * e + 2 * i - h - k) % 7
    n = (a + 11 * h + 22 * m) // 451
    month = (h + m - 7 * n + 114) // 31
    day = (h + m - 7 * n + 114) % 31 + 1
    return datetime.date(year, month, day)


def holidays(region: str, year: int) -> list:
    """the public holidays of a year in Germany (DE: only those of the whole country) or one state: [(date, key)] by date"""
    out, e = [], easter(year)
    for key, when, where in HOLIDAYS:
        if where != "*" and region not in where.split():
            continue
        if isinstance(when, int):
            d = e + datetime.timedelta(days=when)
        elif when == "bbt":                              # the Wednesday before 23 November
            nov22 = datetime.date(year, 11, 22)
            d = nov22 - datetime.timedelta(days=(nov22.weekday() - 2) % 7)
        else:
            d = datetime.date(year, int(when[:2]), int(when[3:]))
        out.append((d, key))
    return sorted(out)


def _in_md(md: str, a: str, b: str) -> bool:
    return a <= md <= b if a <= b else (md >= a or md <= b)


def on_day(day: dict, d: datetime.date, states=None) -> bool:
    """is date d one of this special day (a calendar: is it on now)"""
    k, md = day["kind"], d.strftime("%m-%d")
    if k == "date":
        return _in_md(md, day["md"], day.get("to", day["md"]))
    if k == "once":
        return day["from"] <= d.isoformat() <= day["to"]
    if k == "easter":
        return d == easter(d.year) + datetime.timedelta(days=day["off"])
    if k == "holidays":
        return any(x == d for x, _ in holidays(day["region"], d.year))
    if k == "calendar":
        return ((states or {}).get(day["ent"]) or {}).get("state") == "on"
    return False


def which(days: list, d: datetime.date, states=None) -> list:
    """the ids of the special days date d is"""
    return [x["id"] for x in days if on_day(x, d, states)]


def is_special(days: list, ids: list, d: datetime.date, states=None) -> bool:
    """is date d one of the days ids (empty: any of the list)"""
    return any(on_day(x, d, states) for x in days if not ids or x["id"] in ids)


# ---------- the same for Home Assistant ----------
def _q(s: str) -> str:
    return "'" + s + "'"


def ha_template(days: list, ids: list, year: int, years: int = YEARS) -> str:
    """a Jinja expression of Home Assistant that is true on the days ids (empty: any of the list): fixed days by month and day, Easter
    and the holidays as dates of the years year … year + years - 1, a calendar by its state; "false" when there is no such day"""
    parts, dates = [], set()
    md, ymd = "now().strftime('%m-%d')", "now().strftime('%Y-%m-%d')"
    for x in days:
        if ids and x["id"] not in ids:
            continue
        k = x["kind"]
        if k == "date":
            a, b = x["md"], x.get("to", x["md"])
            if a == b:
                parts.append(f"{md} == {_q(a)}")
            elif a < b:
                parts.append(f"{_q(a)} <= {md} <= {_q(b)}")
            else:
                parts.append(f"({md} >= {_q(a)} or {md} <= {_q(b)})")
        elif k == "once":
            parts.append(f"{ymd} == {_q(x['from'])}" if x["from"] == x["to"] else f"{_q(x['from'])} <= {ymd} <= {_q(x['to'])}")
        elif k == "easter":
            dates |= {(easter(y) + datetime.timedelta(days=x["off"])).isoformat() for y in range(year, year + years)}
        elif k == "holidays":
            dates |= {d.isoformat() for y in range(year, year + years) for d, _ in holidays(x["region"], y)}
        elif k == "calendar":
            parts.append(f"is_state('{x['ent']}', 'on')")
    if dates:
        parts.insert(0, f"{ymd} in [{', '.join(_q(d) for d in sorted(dates))}]")
    return " or ".join(parts) if parts else "false"


def calendars(days: list, ids: list) -> list:
    """the calendars of Home Assistant the days ids look at"""
    return [x["ent"] for x in days if x["kind"] == "calendar" and (not ids or x["id"] in ids)]
