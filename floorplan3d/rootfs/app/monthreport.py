"""📊 Monatsbericht (5.26.0, the owner's choice docs/ideen-5.15 picture 11, "wie im Bild"): once a month a message with what the house
used the month before: heating and power in euros, per room, a picture of the plan with each room's amounts and bars, and the change to
the same month a year before.

Where the numbers come from (Home Assistant's long-term statistics, the energy dashboard's meters and prices):
- power: the grid meter (drawn) of the month × the price per kWh; per room the devices of the energy dashboard ("individual devices")
  that stand in the room (an entity of the same device in the room or its area);
- heating: the gas meter of the month × its price, split over the rooms by how long their thermostats heated (hvac_action "heating",
  without it: on and colder than wished); no gas meter: no heating line (a heat pump counts in power);
- no price in Home Assistant: kWh / m³ instead of euros;
- "Wohnzimmer war 1,5° wärmer als eingestellt": the room whose thermostat measured most above its target while on (1° and more).

Pure but for Pillow (unit test: tests/test_monthreport.py); server.py asks Home Assistant and sends it (month_reporter)."""
import datetime as dt
import io
import math

from alarmpic import _bounds, _font, _plain

HEAT, POWER = (226, 87, 60), (240, 178, 30)
SIZE = 900
MONTHS = {
    "de": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "fr": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
    "es": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    "it": ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
    "nl": ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
    "pl": ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"],
    "zh": [f"{i}月" for i in range(1, 13)],
}
WORDS = {
    "de": {"title": "Dein Haus im {month}", "heat": "Heizung", "power": "Strom", "less": "{n} % weniger als {month} {year}",
           "more": "{n} % mehr als {month} {year}", "same": "so viel wie {month} {year}", "warm": "{room} war {d}° wärmer als eingestellt",
           "none": "Für {month} hat Home Assistant keine Zählerstände.", "test": "(Vorschau)"},
    "en": {"title": "Your house in {month}", "heat": "Heating", "power": "Power", "less": "{n} % less than {month} {year}",
           "more": "{n} % more than {month} {year}", "same": "as much as {month} {year}", "warm": "{room} was {d}° warmer than set",
           "none": "Home Assistant has no meter readings for {month}.", "test": "(preview)"},
    "fr": {"title": "Ta maison en {month}", "heat": "Chauffage", "power": "Électricité", "less": "{n} % de moins qu’en {month} {year}",
           "more": "{n} % de plus qu’en {month} {year}", "same": "autant qu’en {month} {year}", "warm": "{room} était {d}° plus chaud que réglé",
           "none": "Home Assistant n’a pas de relevés pour {month}.", "test": "(aperçu)"},
    "es": {"title": "Tu casa en {month}", "heat": "Calefacción", "power": "Electricidad", "less": "{n} % menos que en {month} {year}",
           "more": "{n} % más que en {month} {year}", "same": "igual que en {month} {year}", "warm": "{room} estuvo {d}° más caliente de lo ajustado",
           "none": "Home Assistant no tiene lecturas para {month}.", "test": "(vista previa)"},
    "it": {"title": "La tua casa a {month}", "heat": "Riscaldamento", "power": "Corrente", "less": "{n} % in meno di {month} {year}",
           "more": "{n} % in più di {month} {year}", "same": "come {month} {year}", "warm": "{room} era {d}° più calda dell’impostazione",
           "none": "Home Assistant non ha letture per {month}.", "test": "(anteprima)"},
    "nl": {"title": "Je huis in {month}", "heat": "Verwarming", "power": "Stroom", "less": "{n} % minder dan {month} {year}",
           "more": "{n} % meer dan {month} {year}", "same": "evenveel als {month} {year}", "warm": "{room} was {d}° warmer dan ingesteld",
           "none": "Home Assistant heeft geen meterstanden voor {month}.", "test": "(voorbeeld)"},
    "pl": {"title": "Twój dom: {month}", "heat": "Ogrzewanie", "power": "Prąd", "less": "{n} % mniej niż {month} {year}",
           "more": "{n} % więcej niż {month} {year}", "same": "tyle co {month} {year}", "warm": "{room}: {d}° cieplej niż ustawiono",
           "none": "Home Assistant nie ma odczytów za {month}.", "test": "(podgląd)"},
    "zh": {"title": "{month}的房屋", "heat": "供暖", "power": "电", "less": "比 {year} 年{month}少 {n} %", "more": "比 {year} 年{month}多 {n} %",
           "same": "与 {year} 年{month}相同", "warm": "{room} 比设定温度高 {d}°", "none": "Home Assistant 没有{month}的读数。", "test": "（预览）"},
}


def clean_cfg(val) -> dict:
    """the settings of the report: {on, day (1–28: the day of the month it is sent), hour (0–23)}"""
    v = val if isinstance(val, dict) else {}
    day, hour = v.get("day"), v.get("hour")
    return {"on": v.get("on") is True,
            "day": day if isinstance(day, int) and not isinstance(day, bool) and 1 <= day <= 28 else 1,
            "hour": hour if isinstance(hour, int) and not isinstance(hour, bool) and 0 <= hour <= 23 else 8}


def month_span(now: dt.datetime, back: int = 1):
    """the month `back` months before the one of `now` (local, with its time zone): ('YYYY-MM', start, end)"""
    y, m = now.year, now.month - back
    while m < 1:
        y, m = y - 1, m + 12
    start = now.replace(year=y, month=m, day=1, hour=0, minute=0, second=0, microsecond=0)
    end = start.replace(year=y + (m == 12), month=1 if m == 12 else m + 1)
    return f"{y:04d}-{m:02d}", start, end


def due(cfg: dict, now: dt.datetime, last: str):
    """the month to send now ('YYYY-MM') or None: on, the day and hour reached, not sent for that month yet"""
    if not cfg.get("on") or now.day < cfg["day"] or (now.day == cfg["day"] and now.hour < cfg["hour"]):
        return None
    key = month_span(now)[0]
    return None if key == last else key


def stat_sum(res, ids):
    """the sum of the "change" of the statistics `ids` in an answer of recorder/statistics_during_period; None when none of them has any"""
    total, seen = 0.0, False
    for i in ids or []:
        for row in (res or {}).get(i) or []:
            c = row.get("change") if isinstance(row, dict) else None
            if isinstance(c, (int, float)) and not isinstance(c, bool) and math.isfinite(c):
                total += c
                seen = True
    return total if seen else None


def _num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def climate_use(rows, end_ts: float):
    """a thermostat's month from its history (the compact form of history/history_during_period: [{s, a?, lu}], attributes carried on):
    (seconds it heated, the mean of measured − wished while it was on, weighted by time; None when never on with both)"""
    attrs, heat, warm_sum, warm_t = {}, 0.0, 0.0, 0.0
    rows = [r for r in rows or [] if isinstance(r, dict) and _num(r.get("lu")) is not None]
    for i, r in enumerate(rows):
        if isinstance(r.get("a"), dict):
            attrs = {**attrs, **r["a"]}
        t0 = _num(r["lu"])
        t1 = _num(rows[i + 1]["lu"]) if i + 1 < len(rows) else end_ts
        span = max(0.0, (t1 or end_ts) - t0)
        s = r.get("s")
        cur, want = _num(attrs.get("current_temperature")), _num(attrs.get("temperature"))
        action = attrs.get("hvac_action")
        on = s not in ("off", "unavailable", "unknown", None)
        if action is not None:
            heating = action == "heating"
        else:
            heating = on and s in ("heat", "auto", "heat_cool") and cur is not None and want is not None and cur < want
        if heating:
            heat += span
        if on and cur is not None and want is not None:
            warm_sum += (cur - want) * span
            warm_t += span
    return heat, (warm_sum / warm_t if warm_t > 0 else None)


def build(rooms, use: dict, room_kwh: dict, totals: dict, price: dict, key: str):
    """The report of month `key` ('YYYY-MM'). rooms: roommap.rooms_of; use: {climate: (seconds heating, warm)}; room_kwh: {room key: kWh
    of its devices}; totals: {power (kWh drawn), gas (m³ or kWh), power_ly, gas_ly (the same month a year before), gasUnit}; price:
    {buy (per kWh), gas (per unit)}. -> {month, heat, power, heatUnit, powerUnit, change (%, + = more), rooms: [{name, heat, power}],
    warm: {room, d} | None}"""
    buy, gas_price = _num(price.get("buy")), _num(price.get("gas"))
    power_kwh, gas = _num(totals.get("power")), _num(totals.get("gas"))
    p_unit = "€" if buy is not None else "kWh"
    h_unit = "€" if gas_price is not None else (totals.get("gasUnit") or "m³")
    p_f = buy if buy is not None else 1.0
    h_f = gas_price if gas_price is not None else 1.0
    secs = {r["key"]: sum((use.get(c) or (0, None))[0] for c in r.get("climates") or []) for r in rooms}
    all_secs = sum(secs.values())
    out_rooms = []
    for r in rooms:
        h = gas * h_f * secs[r["key"]] / all_secs if gas and all_secs > 0 else 0.0
        p = (room_kwh.get(r["key"]) or 0.0) * p_f
        if (h >= 0.5 or p >= 0.5) and r.get("name"):
            out_rooms.append({"name": r["name"], "heat": round(h), "power": round(p)})
    out_rooms.sort(key=lambda x: -(x["heat"] + x["power"]))
    now_e = (power_kwh or 0.0) * p_f + (gas or 0.0) * h_f if power_kwh is not None or gas is not None else None
    ly_p, ly_g = _num(totals.get("power_ly")), _num(totals.get("gas_ly"))
    ly_e = (ly_p or 0.0) * p_f + (ly_g or 0.0) * h_f if ly_p is not None or ly_g is not None else None
    change = round((now_e - ly_e) / ly_e * 100) if now_e is not None and ly_e else None
    warm = None
    for r in rooms:
        ds = [use[c][1] for c in r.get("climates") or [] if c in use and use[c][1] is not None]
        if ds and r.get("name"):
            d = sum(ds) / len(ds)
            if d >= 1.0 and (warm is None or d > warm["d"]):
                warm = {"room": r["name"], "d": round(d, 1)}
    return {"month": key, "heat": round(gas * h_f) if gas is not None else None, "power": round(power_kwh * p_f) if power_kwh is not None else None,
            "heatUnit": h_unit, "powerUnit": p_unit, "change": change, "rooms": out_rooms[:12], "warm": warm}


def _words(lang):
    return WORDS.get(lang) or WORDS["en"]


def month_name(key: str, lang="de", year=False) -> str:
    y, m = (int(x) for x in key.split("-"))
    name = (MONTHS.get(lang) or MONTHS["en"])[m - 1]
    return f"{name} {y}" if year else name


def _amount(v, unit, lang):
    s = f"{v:,}".replace(",", "." if lang in ("de", "es", "it", "nl", "pl") else ",") if isinstance(v, int) else str(v)
    return f"{s} {unit}"


def text(rep: dict, lang="de", preview=False) -> str:
    """the message"""
    w, month = _words(lang), month_name(rep["month"], lang)
    head = f"📊 {w['title'].format(month=month)}" + (f" {w['test']}" if preview else "")
    if rep.get("heat") is None and rep.get("power") is None:
        return f"{head}\n{w['none'].format(month=month)}"
    parts = []
    if rep.get("heat") is not None:
        parts.append(f"🔥 {w['heat']} {_amount(rep['heat'], rep['heatUnit'], lang)}")
    if rep.get("power") is not None:
        parts.append(f"⚡ {w['power']} {_amount(rep['power'], rep['powerUnit'], lang)}")
    ch = rep.get("change")
    if ch is not None:
        year = int(rep["month"][:4]) - 1
        parts.append(w["same" if ch == 0 else "less" if ch < 0 else "more"].format(n=abs(ch), month=month, year=year))
    lines = [head, " · ".join(parts), ""]
    for r in rep.get("rooms") or []:
        bits = ([f"🔥 {_amount(r['heat'], rep['heatUnit'], lang)}"] if r["heat"] else []) + ([f"⚡ {_amount(r['power'], rep['powerUnit'], lang)}"] if r["power"] else [])
        lines.append(f"{r['name']}: {' · '.join(bits)}")
    if rep.get("warm"):
        d = str(rep["warm"]["d"]).replace(".", "," if lang != "en" and lang != "zh" else ".")
        lines += ["", f"🌡 {w['warm'].format(room=rep['warm']['room'], d=d)}"]
    return "\n".join(lines).strip()


def _centre(pts):
    return sum(float(p[0]) for p in pts) / len(pts), sum(float(p[1]) for p in pts) / len(pts)


def picture(rep: dict, houses, lang="de") -> bytes:
    """a PNG: on top the floor with most rooms of the report from above, each of those rooms tinted by its amount with its 🔥 / ⚡ amounts
    on a label; below a bar per room (red heating, yellow power) with the sum, like docs/ideen-5.15 picture 11"""
    from PIL import Image, ImageDraw
    w = _words(lang)
    names = {r["name"]: r for r in rep.get("rooms") or []}
    best, best_n = None, 0
    for _hid, layout in houses or []:
        for f in (layout or {}).get("floors") or []:
            n = sum(1 for r in f.get("rooms") or [] if isinstance(r, dict) and r.get("name") in names)
            if n > best_n:
                best, best_n = f, n
    top = max((r["heat"] + r["power"] for r in names.values()), default=0) or 1
    head, plan_h = 76, 0
    plan = None
    if best is not None and _bounds(best):
        x0, z0, x1, z1 = _bounds(best)
        pad = 0.8
        x0, z0, x1, z1 = x0 - pad, z0 - pad, x1 + pad, z1 + pad
        scale = SIZE / max(x1 - x0, 4.0)
        plan_h = int(min(max(z1 - z0, 3.0) * scale, SIZE * 0.85))
        scale = min(scale, plan_h / max(z1 - z0, 3.0))
        plan = (x0, z0, scale)
    rows = rep.get("rooms") or []
    bar_h = 46 * len(rows) + (60 if rows else 0)
    H = head + plan_h + bar_h + 20
    im = Image.new("RGB", (SIZE, max(H, head + 120)), (245, 246, 248))
    d = ImageDraw.Draw(im, "RGBA")
    small, mid = _font(18), _font(22)
    if plan:
        x0, z0, scale = plan
        P = lambda x, z: ((x - x0) * scale, (z - z0) * scale + head)   # noqa: E731
        for r in best.get("rooms") or []:
            pts = [P(float(p[0]), float(p[1])) for p in (r.get("points") or [])] if isinstance(r, dict) else []
            if len(pts) < 3:
                continue
            hit = names.get(r.get("name"))
            k = (hit["heat"] + hit["power"]) / top if hit else 0
            fill = (HEAT + (int(40 + 120 * k),)) if hit else (210, 214, 222, 255)
            d.polygon(pts, fill=fill, outline=(150, 156, 166), width=2)
        for wl in best.get("walls") or []:
            try:
                a, c = P(float(wl["a"][0]), float(wl["a"][1])), P(float(wl["b"][0]), float(wl["b"][1]))
            except (KeyError, TypeError, ValueError, IndexError):
                continue
            d.line([a, c], fill=(55, 60, 70), width=max(3, int(float(wl.get("thickness") or 0.2) * scale * 0.7)))
        for r in best.get("rooms") or []:
            pts = (r.get("points") or []) if isinstance(r, dict) else []
            hit = names.get(r.get("name")) if isinstance(r, dict) else None
            if len(pts) < 3 or not hit:
                continue
            cx, cz = P(*_centre(pts))
            parts = [(v, col, f"{v} {u}") for v, col, u in ((hit["heat"], HEAT, rep["heatUnit"]), (hit["power"], POWER, rep["powerUnit"])) if v]
            tw = 12 + sum(28 + d.textlength(txt, font=small) for _v, _c, txt in parts)
            d.rounded_rectangle([cx - tw / 2, cz - 16, cx + tw / 2, cz + 16], radius=12, fill=(255, 255, 255, 235), outline=(120, 120, 120))
            x = cx - tw / 2 + 12
            for _v, col, txt in parts:
                d.ellipse([x, cz - 6, x + 12, cz + 6], fill=col)
                d.text((x + 16, cz), txt, font=small, fill=(30, 34, 44), anchor="lm")
                x += 28 + d.textlength(txt, font=small)
            d.text((cx, cz + 28), _plain(r.get("name")), font=small, fill=(40, 44, 54), anchor="mm")
    y = head + plan_h + 24
    biggest = max((r["heat"] + r["power"] for r in rows), default=1) or 1
    for r in rows:
        d.text((24, y + 14), _plain(r["name"]), font=mid, fill=(30, 34, 44), anchor="lm")
        bx, bw = 260, SIZE - 260 - 130
        d.rounded_rectangle([bx, y + 4, bx + bw, y + 24], radius=10, fill=(222, 225, 232))
        hw, pw = bw * r["heat"] / biggest, bw * r["power"] / biggest
        if hw:
            d.rounded_rectangle([bx, y + 4, bx + max(hw, 20), y + 24], radius=10, fill=HEAT)
        if pw:
            d.rounded_rectangle([bx + hw, y + 4, bx + hw + max(pw, 20), y + 24], radius=10, fill=POWER)
        unit = rep["heatUnit"] if rep["heatUnit"] == rep["powerUnit"] else ""
        d.text((SIZE - 24, y + 14), f"{r['heat'] + r['power']} {unit}".strip(), font=mid, fill=(30, 34, 44), anchor="rm")
        y += 46
    if rows:
        d.ellipse([24, y + 8, 38, y + 22], fill=HEAT)
        d.text((44, y + 15), _plain(w["heat"]), font=small, fill=(60, 66, 78), anchor="lm")
        x = 52 + d.textlength(_plain(w["heat"]), font=small) + 20
        d.ellipse([x, y + 8, x + 14, y + 22], fill=POWER)
        d.text((x + 20, y + 15), _plain(w["power"]), font=small, fill=(60, 66, 78), anchor="lm")
    d.rectangle([0, 0, SIZE, head], fill=(28, 34, 46))
    d.text((22, head / 2), _plain(w["title"].format(month=month_name(rep["month"], lang, year=True))), font=_font(30), fill=(255, 255, 255), anchor="lm")
    out = io.BytesIO()
    im.save(out, "PNG", optimize=True)
    return out.getvalue()
