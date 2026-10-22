"""The meters of the page ⚡ Energie taken from the power sensors of the power editor (#501, the owner: "einen Knopf …, dass es von oben, was ich
eingestellt habe, nach unten auch übernommen wird"). The meters count kWh (they only go up), the power editor's sensors measure W: for
each power sensor the add-on looks for its counter, an integral helper of Home Assistant made from it (attribute "source") or a counter
in kWh on the same device whose name fits (solar: produced, grid: drawn / fed in, battery: charged / discharged). Where there is none,
a helper can be made: Home Assistant's "Integral" (Riemann sum), W -> kWh, through its config flow.

Pure (no aiohttp, no Home Assistant): unit tests in tests/test_counters.py; server.py asks Home Assistant and makes the helper.
"""
import re

KINDS = ("from", "to", "solar", "batIn", "batOut")
ENERGY_UNITS = {"Wh", "kWh", "MWh"}
POWER_UNITS = {"W", "kW"}
SENSOR = re.compile(r"^sensor\.[a-z0-9_]{1,200}$")
MAX_SOURCES = 12
# what the name of a counter says it counts (entity id and name, any language the integrations use)
WORDS = {
    "from": re.compile(r"import|bezug|bezogen|from_grid|consum|verbrauch|purchas|bought|einkauf", re.I),
    "to": re.compile(r"export|einspeis|eingespeist|feed|return|to_grid|liefer|sold|sell|verkauf", re.I),
    "solar": re.compile(r"produc|erzeug|ertrag|yield|generat|pv|solar|photovolt", re.I),
    "batIn": re.compile(r"(?<!dis)charg|(?<!ent)lade|(?<!ent)laden|battery_in|bat_in|to_battery", re.I),
    "batOut": re.compile(r"discharg|entlade|entladen|battery_out|bat_out|from_battery", re.I),
}
TOTAL = re.compile(r"total|gesamt|lifetime|summe", re.I)
PERIOD = re.compile(r"today|heute|daily|t[aä]glich|_day|_tag|tages|week|woche|month|monat|year|jahr|hour|stunde", re.I)


def _unit(st):
    return ((st or {}).get("attributes") or {}).get("unit_of_measurement")


def _name(st, eid):
    n = ((st or {}).get("attributes") or {}).get("friendly_name")
    return n if isinstance(n, str) and n else eid


def counter_for(power: str, kind: str, states: dict, registry: list):
    """The kWh counter of the power sensor `power` for a meter of `kind`, or None: {"entity_id", "name", "how": "helper" | "device"}.
    An integral helper made from it comes first; then a counter on the same device: in kWh, not one of a day or a month, its name
    fitting the kind (a total counter and one Home Assistant keeps as total_increasing are preferred); a solar inverter's only counter
    fits solar too. states: {entity: state}, registry: Home Assistant's entity registry list."""
    for eid, st in sorted(states.items()):
        a = (st or {}).get("attributes") or {}
        if eid.startswith("sensor.") and a.get("source") == power and _unit(st) in ENERGY_UNITS:
            return {"entity_id": eid, "name": _name(st, eid), "how": "helper"}
    device = next((r.get("device_id") for r in registry or [] if isinstance(r, dict) and r.get("entity_id") == power), None)
    if not device:
        return None
    mates = [r["entity_id"] for r in registry if isinstance(r, dict) and r.get("device_id") == device and isinstance(r.get("entity_id"), str)
             and r["entity_id"] != power and r["entity_id"].startswith("sensor.") and _unit(states.get(r["entity_id"])) in ENERGY_UNITS]
    if not mates:
        return None
    others = [k for k in KINDS if k != kind]

    def score(eid):
        st = states.get(eid)
        text = f"{eid} {_name(st, eid)}"
        if PERIOD.search(text):
            return None                                   # a counter of the day or the month starts again at 0
        fits = bool(WORDS[kind].search(text))
        if not fits and (kind != "solar" or any(WORDS[k].search(text) for k in others)):
            return None                                   # only an inverter's counter without a word for it may be the sun's
        sc = ((st or {}).get("attributes") or {}).get("state_class")
        return (2 if fits else 0) + (1 if TOTAL.search(text) else 0) + (1 if sc in ("total_increasing", "total") else 0)
    ranked = sorted((s, e) for e in mates if (s := score(e)) is not None)
    ranked.sort(key=lambda x: (-x[0], x[1]))
    if not ranked or (ranked[0][0] < 2 and len(ranked) > 1):
        return None                                       # none fits, or several without a word for it: not guessed
    best = ranked[0][1]
    return {"entity_id": best, "name": _name(states.get(best), best), "how": "device"}


def clean_sources(query) -> dict:
    """the power sensors asked about: {kind: [sensor ids]} from ?from=a,b&solar=c …, each kind at most MAX_SOURCES"""
    out = {}
    for k in KINDS:
        ids = []
        for x in str(query.get(k) or "").split(","):
            if SENSOR.match(x) and x not in ids:
                ids.append(x)
        if ids:
            out[k] = ids[:MAX_SOURCES]
    return out


def has_stats(st) -> bool:
    """does Home Assistant keep long-term statistics of it (its state_class): then the page can count a power sensor's mean as kWh"""
    return ((st or {}).get("attributes") or {}).get("state_class") in ("measurement", "total", "total_increasing")


def find_counters(sources: dict, states: dict, registry: list) -> dict:
    """{kind: [{"power", "power_name", "unit", "stats", "counter"}]} for the power sensors per kind (counter: counter_for or None; stats:
    has_stats, the power sensor itself can be the meter)"""
    return {k: [{"power": p, "power_name": _name(states.get(p), p), "unit": _unit(states.get(p)), "stats": has_stats(states.get(p)),
                 "counter": counter_for(p, k, states, registry)} for p in ids] for k, ids in sources.items()}


def helper_input(source: str, name: str) -> dict:
    """what Home Assistant's "Integral" helper is made with: from a power sensor (W or kW) a counter in kWh, the left sum (right for
    sensors that only report on change), rounded to 3 places"""
    return {"name": name, "source": source, "method": "left", "round": 3, "unit_prefix": "k", "unit_time": "h"}


def helper_name(power_name: str) -> str:
    """the name of a new counter: the power sensor's name with "Energie" (the word "Leistung" in it becomes "Energie")"""
    n = re.sub(r"\s+", " ", str(power_name or "")).strip()[:80] or "Zähler"
    swapped = re.sub(r"\b(leistung|power)\b", "Energie", n, flags=re.I)
    return swapped if swapped != n else f"{n} Energie"
