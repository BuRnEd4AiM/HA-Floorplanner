"""The add-on's own heating rules (#546, the owner: "Heizungssteuerung … wenn Fenster offen, dann wird Heizung deaktiviert"; pictures
docs/ideen-4.28/3-heiz-regeln.jpg, 4-heizplan.jpg): ready-made rules an admin switches on in 🌡 Klima → 📋 Heiz-Regeln, run by the add-on
itself (also with no screen open), so no automation in Home Assistant is needed.

Two kinds of rules decide what a thermostat should do:
- a *level* (the normal temperature of the moment), the first that applies: holiday (🏖 Urlaub, or while the holiday alarm is armed),
  summer pause (☀ warm outside for some hours: off), nobody at home (🚶 after some minutes: cooler), the schedule of the room (📅 Heizplan:
  night / eco / comfort per day, warmer a little earlier with "Vorheizen") or else the night setback (🌙 between two times).
- an *override* for a while: a window of the room open for some minutes (🪟: off), or 🚀 boost (warm for some minutes), or the room
  too warm (🔥 Zu warm, the owner: "wenn es zu warm ist das dann die heizung runter geht ka so 5 grad das es nicht die ganze zeit heizt";
  his choice: 5° below the wish from 1° too warm, measured by the thermostat's room sensor, else by the thermostat; back at the wish;
  turned by hand meanwhile: lowered again after the minutes of "hand", like the schedule, #592).
  Who goes first (the owner: "beachte die Prio von den ganzen Karten das die sich nicht gegenseitig überschreiben"): the window, then
  the boost, then too warm, then the level, as the list ORDER says; a level that changes meanwhile is the new wish, an override that
  ends puts back what was. Every rule decides on how a thermostat will be once it has reported what it was sent (expect, #588).
A level is set when it changes (a new block of the schedule, everybody left), not again and again: a thermostat turned by hand keeps its
value until the next change; under the schedule only for some minutes ("hand", the owner: "wenn man von Hand dreht nach 10 min wieder
zurück, aber das kann eingestellt werden"; 0: until the next block), then the schedule's temperature comes back. An override remembers the thermostat as it was and puts it back when it ends ("wie vorher"); if the level
changed meanwhile (the schedule moved on while the window was open), the new level is set instead. When a passing level (away, holiday,
summer, night) ends without another one, the thermostat goes back to how it was before.

Everything that decides is pure (unit test: tests/test_heatrules.py): clean_rules, plan_level, step. The server (server.py, run by
rulesrun.py) feeds it the states and the clock and makes the calls it returns."""
import datetime
import re

import roomsensors as rs

LEVELS = ("night", "eco", "comfort")
# Who goes first (the owner: "beachte die Prio von den ganzen Karten das die sich nicht gegenseitig überschreiben"; "die Reihenfolge der
# heizungsteureung muss stabiler sein"): this one list decides, step and room_level only go through it; the page says it in 📋 Heiz-Regeln
# → "Wer hat Vorrang?" (hr.prio.text, tests/test_heatorder.py checks that it is the same order).
OVERRIDES = ("window", "boost", "warm")                          # for a while, the first that applies: 🪟 window open, 🚀 boost, 🔥 too warm
LEVEL_ORDER = ("holiday", "summer", "away", "schedule", "night")  # then the first level: ✈️ holiday, ☀️ summer, 🚶 away, 📅 schedule, 🌙 night
ORDER = OVERRIDES + LEVEL_ORDER
ROOM_KEY = re.compile(r"^[A-Za-z0-9_-]{1,40}/[A-Za-z0-9_-]{1,40}$")
HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
OPEN = {"on", "open", "opening"}
HOME = "home"
PASSING = ("away", "holiday", "summer", "night")   # levels of a passing situation: when they end, the thermostat goes back (the schedule
                                                  # never ends by itself: switched off, it leaves the thermostats as they are)
MAX_ROOMS = 200
MAX_POINTS = 12                                  # blocks of a day in the schedule
RETRY = 180                                      # s: a thermostat still heating while its window is open gets the call again (a sleepy
                                                 # radiator thermostat may take a minute or two to say it is off)
TRIES = 5                                        # then the page says that it does not go off
PENDING = 180                                    # s: a target the rules sent that the thermostat has not reported yet is no turn by hand
                                                 # (a sleepy radiator thermostat reports some minutes later, #579)
MODE_WAIT = 600                                  # s: a mode the rules sent counts as on its way until reported, at most this long
                                                 # (an older call that comes late may show another one meanwhile: expect)
GONE = ("unavailable", "unknown")
GRACE = 15 * 60                                  # s: an open window's contact that does not report for a moment still counts as open

DEFAULT = {
    "window": {"on": False, "delay": 2, "doors": True, "skip": []},
    "away": {"on": False, "delay": 30, "temp": 17.0},
    "night": {"on": False, "from": "22:30", "to": "06:00", "temp": 17.0, "rooms": {}},
    "schedule": {"on": False, "levels": {"night": 17.0, "eco": 19.0, "comfort": 21.0}, "pre": 0, "hand": 10, "rooms": {}},
    "summer": {"on": False, "above": 18.0, "hours": 6},
    "boost": {"on": True, "minutes": 30, "temp": 24.0},
    "holiday": {"on": False, "temp": 15.0, "until": "", "back": "14:00", "guard": False},
    "warm": {"on": False, "above": 1.0, "down": 5.0, "skip": []},
}


def _int(v, lo, hi, default):
    return max(lo, min(hi, int(round(v)))) if isinstance(v, (int, float)) and not isinstance(v, bool) and v == v else default


def _temp(v, default):
    return max(5.0, min(30.0, round(float(v) * 2) / 2)) if isinstance(v, (int, float)) and not isinstance(v, bool) and v == v else default


def _deg(v, lo, hi, default):
    """a number of degrees in half steps from lo to hi"""
    return max(lo, min(hi, round(float(v) * 2) / 2)) if isinstance(v, (int, float)) and not isinstance(v, bool) and v == v else default


def _bool(v, default):
    return v if isinstance(v, bool) else default


def _time(v, default):
    return v if isinstance(v, str) and HHMM.match(v) else default


def _rooms(v):
    return [k for k in v if isinstance(k, str) and ROOM_KEY.match(k)][:MAX_ROOMS] if isinstance(v, list) else []


def clean_day(day) -> list:
    """one day of a schedule: [[minute of the day, level]] sorted, each minute once, at most MAX_POINTS"""
    pts = {}
    for p in day if isinstance(day, list) else []:
        if isinstance(p, list) and len(p) == 2 and p[1] in LEVELS:
            m = _int(p[0], 0, 1439, None)
            if m is not None:
                pts[m] = p[1]
    return [[m, pts[m]] for m in sorted(pts)][:MAX_POINTS]


def clean_plan(v) -> dict | None:
    """the schedule of one room: {"days": [7 days, Monday first]}; None when no day has a block"""
    days = v.get("days") if isinstance(v, dict) else None
    days = [clean_day(d) for d in (days if isinstance(days, list) else [])][:7]
    days += [[] for _ in range(7 - len(days))]
    return {"days": days} if any(days) else None


def clean_rules(data) -> dict:
    """the heating rules as an admin set them, every value checked; what is missing or wrong takes its default"""
    d = data if isinstance(data, dict) else {}
    g = lambda k: d.get(k) if isinstance(d.get(k), dict) else {}   # noqa: E731
    w, a, n, s, su, b, h, wa = g("window"), g("away"), g("night"), g("schedule"), g("summer"), g("boost"), g("holiday"), g("warm")
    D = DEFAULT
    levels = s.get("levels") if isinstance(s.get("levels"), dict) else {}
    plans = {}
    for k, v in (s.get("rooms") if isinstance(s.get("rooms"), dict) else {}).items():
        p = clean_plan(v) if isinstance(k, str) and ROOM_KEY.match(k) else None
        if p and len(plans) < MAX_ROOMS:
            plans[k] = p
    night_rooms = {k: _temp(v, None) for k, v in (n.get("rooms") if isinstance(n.get("rooms"), dict) else {}).items()
                   if isinstance(k, str) and ROOM_KEY.match(k) and _temp(v, None) is not None}
    return {
        "window": {"on": _bool(w.get("on"), False), "delay": _int(w.get("delay"), 0, 60, D["window"]["delay"]), "doors": _bool(w.get("doors"), True),
                   "skip": _rooms(w.get("skip"))},
        "away": {"on": _bool(a.get("on"), False), "delay": _int(a.get("delay"), 0, 240, D["away"]["delay"]), "temp": _temp(a.get("temp"), D["away"]["temp"])},
        "night": {"on": _bool(n.get("on"), False), "from": _time(n.get("from"), D["night"]["from"]), "to": _time(n.get("to"), D["night"]["to"]),
                  "temp": _temp(n.get("temp"), D["night"]["temp"]), "rooms": dict(list(night_rooms.items())[:MAX_ROOMS])},
        "schedule": {"on": _bool(s.get("on"), False), "levels": {k: _temp(levels.get(k), D["schedule"]["levels"][k]) for k in LEVELS},
                     "pre": _int(s.get("pre"), 0, 120, 0), "hand": _int(s.get("hand"), 0, 240, D["schedule"]["hand"]), "rooms": plans},
        "summer": {"on": _bool(su.get("on"), False), "above": _temp(su.get("above"), D["summer"]["above"]), "hours": _int(su.get("hours"), 0, 72, D["summer"]["hours"])},
        "boost": {"on": _bool(b.get("on"), True), "minutes": _int(b.get("minutes"), 5, 240, D["boost"]["minutes"]), "temp": _temp(b.get("temp"), D["boost"]["temp"])},
        "holiday": {"on": _bool(h.get("on"), False), "temp": _temp(h.get("temp"), D["holiday"]["temp"]),
                    "until": h.get("until") if isinstance(h.get("until"), str) and DATE.match(h["until"]) else "",
                    "back": _time(h.get("back"), D["holiday"]["back"]), "guard": _bool(h.get("guard"), False)},
        "warm": {"on": _bool(wa.get("on"), False), "above": _deg(wa.get("above"), 0.5, 5.0, D["warm"]["above"]),
                 "down": _deg(wa.get("down"), 1.0, 15.0, D["warm"]["down"]), "skip": _rooms(wa.get("skip"))},
        "sensors": rs.clean(d.get("sensors")),            # 🌡 Raumfühler: a sensor in the room for each thermostat (roomsensors.py, #573)
    }


def any_on(rules: dict) -> bool:
    """does any rule do something (the boost only does something when somebody taps it)"""
    return any(rules[k]["on"] for k in ("window", "away", "night", "schedule", "summer", "holiday", "warm")) or rules["holiday"]["guard"]


def _mins(hhmm: str) -> int:
    return int(hhmm[:2]) * 60 + int(hhmm[3:])


def plan_at(plan: dict, weekday: int, minute: int):
    """the level of a schedule at a weekday (0 = Monday) and minute; before the first block of a day the last one of the days before"""
    days = plan["days"]
    for back in range(8):
        day = days[(weekday - back) % 7]
        pts = [p for p in day if back > 0 or p[0] <= minute]
        if pts:
            return pts[-1][1]
    return None


def plan_level(plan: dict, local: datetime.datetime, levels: dict, pre: int = 0):
    """the level (night / eco / comfort) of a room's schedule now; with pre minutes of preheating a warmer level that starts within
    them already counts"""
    if not plan:
        return None
    now = plan_at(plan, local.weekday(), local.hour * 60 + local.minute)
    if pre and now:
        soon = local + datetime.timedelta(minutes=pre)
        later = plan_at(plan, soon.weekday(), soon.hour * 60 + soon.minute)
        if later and levels[later] > levels[now]:
            return later
    return now


def between(local: datetime.datetime, a: str, b: str) -> bool:
    """is the time of day from a (inclusive) to b (exclusive), over midnight when b is earlier"""
    m, x, y = local.hour * 60 + local.minute, _mins(a), _mins(b)
    return x <= m < y if x <= y else (m >= x or m < y)


def holiday_on(rules: dict, local: datetime.datetime, guard_armed: bool) -> bool:
    h = rules["holiday"]
    if h["guard"] and guard_armed:
        return True
    if not h["on"]:
        return False
    if not h["until"]:
        return True
    today = local.date().isoformat()
    return today < h["until"] or (today == h["until"] and local.hour * 60 + local.minute < _mins(h["back"]))


def _attr(states, e, k):
    return ((states.get(e) or {}).get("attributes") or {}).get(k)


def snap(states, e) -> dict:
    """a thermostat as it is: its mode and target"""
    st = states.get(e) or {}
    t = _attr(states, e, "temperature")
    return {"mode": st.get("state"), "temp": t if isinstance(t, (int, float)) and not isinstance(t, bool) else None}


def heats(states, e) -> bool:
    """a thermostat that can heat, and is there"""
    st = states.get(e) or {}
    modes = _attr(states, e, "hvac_modes")
    return st.get("state") not in (None, "unavailable", "unknown") and isinstance(modes, list) and any(m in modes for m in ("heat", "auto", "heat_cool"))


def cools(states, e) -> bool:
    """an air conditioner (it can cool too): only the window rule switches it (off while the window is open); levels and boost would
    turn it to heating, in summer too"""
    modes = _attr(states, e, "hvac_modes")
    return isinstance(modes, list) and "cool" in modes


def _clamp(states, e, t):
    lo, hi = _attr(states, e, "min_temp"), _attr(states, e, "max_temp")
    if isinstance(lo, (int, float)):
        t = max(lo, t)
    if isinstance(hi, (int, float)):
        t = min(hi, t)
    return t


def _set(states, e, mode, temp=None) -> list:
    """the calls that bring thermostat e to mode (off / heat …) and temp, only what differs from now"""
    st, calls = states.get(e) or {}, []
    modes = _attr(states, e, "hvac_modes") or []
    if mode == "off":
        if st.get("state") != "off":
            if "off" in modes:
                calls.append((e, "set_hvac_mode", {"hvac_mode": "off"}))
            else:                                          # cannot be switched off: as cold as it goes
                calls.append((e, "set_temperature", {"temperature": _clamp(states, e, 5.0)}))
        return calls
    if mode and st.get("state") != mode and mode in modes:
        calls.append((e, "set_hvac_mode", {"hvac_mode": mode}))
    if temp is not None:
        t = _clamp(states, e, temp)
        if _attr(states, e, "temperature") != t or calls:
            calls.append((e, "set_temperature", {"temperature": t}))
    return calls


def _heat_mode(states, e, cur=None):
    modes = _attr(states, e, "hvac_modes") or []
    if cur in ("heat", "auto", "heat_cool"):
        return cur
    return "heat" if "heat" in modes else "heat_cool" if "heat_cool" in modes else "auto"


def apply_level(states, e, level) -> list:
    if level.get("off"):
        return _set(states, e, "off")
    return _set(states, e, _heat_mode(states, e, "heat"), level["temp"])


def apply_override(states, e, ov, rules, warm_to=None) -> list:
    if ov == "window":
        return _set(states, e, "off")
    if ov == "warm":                                   # too warm: lower, in the mode it has (auto stays auto)
        return _set(states, e, _heat_mode(states, e, (states.get(e) or {}).get("state")), warm_to)
    return _set(states, e, _heat_mode(states, e, "heat"), rules["boost"]["temp"])     # boost


def paused(states, e, ac=False) -> bool:
    """is thermostat e off, or (one that only heats) set as cold as it goes: what the window rule wants"""
    t = _attr(states, e, "temperature")
    return (states.get(e) or {}).get("state") == "off" or (not ac and isinstance(t, (int, float)) and not isinstance(t, bool)
                                                           and t <= _clamp(states, e, 5.0) + 0.01)


def keep_off(states, e, t, now, ac=False) -> list:
    """While its window is open: a thermostat that is not off (it took no "off", or went back to heating by itself, the owner: "aber aus
    wird das Thermostat dann nicht") gets the call again after RETRY seconds; from the second try as cold as it goes instead, which every
    thermostat takes (an air conditioner only "off": cold would make it cool), at most TRIES times (t["offN"]), then the page says so.
    The tries count while the window is open: one that was off a moment and heats again by itself gets as cold as it goes next, not
    "off" again and again (#577). t: what the rules remember of the thermostat."""
    if paused(states, e, ac):
        t["offT"] = now
        return []
    if now - t.setdefault("offT", now) < RETRY or t.get("offN", 0) >= TRIES:   # offT: the last call (unset: a boost before, an older add-on)
        return []
    t["offT"], t["offN"] = now, t.get("offN", 0) + 1
    if t["offN"] == 1 or ac:
        return _set(states, e, "off")
    return [(e, "set_temperature", {"temperature": _clamp(states, e, 5.0)})]


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _tstep(states, e) -> float:
    """the steps a thermostat's target goes in (0.5° unless it says)"""
    s = _num(_attr(states, e, "target_temp_step"))
    return s if s and s > 0 else 0.5


def by_hand(states, e, level, keep=False) -> list:
    """the calls that bring thermostat e back to level when only its temperature was turned (by hand, at the device or on a page); []
    when it is as the level wants, or when its mode was changed (off, auto: chosen on purpose, left alone). A thermostat that rounds
    (whole degrees) does not count as turned. keep: in the mode it has (too warm: auto stays auto)."""
    if not level or level.get("off"):
        return []
    calls = _set(states, e, _heat_mode(states, e, (states.get(e) or {}).get("state")), level["temp"]) if keep else apply_level(states, e, level)
    if not calls or any(c[1] != "set_temperature" for c in calls):
        return []
    cur = _num(_attr(states, e, "temperature"))
    if cur is not None and abs(cur - calls[0][2]["temperature"]) <= _tstep(states, e) / 2:
        return []
    return calls


def _older(t, now) -> list:
    """the targets the rules sent before the last one, a few minutes ago (t["sentOld"]: [[target, when]]): a sleepy thermostat reports
    the calls in their order, so one of them may still come while the last is on its way (#588)"""
    return [x[0] for x in t.get("sentOld") or [] if isinstance(x, list) and len(x) == 2 and _num(x[0]) is not None and _num(x[1]) is not None
            and now - x[1] < MODE_WAIT]


def _own(t, v, now, half) -> bool:
    """is target v an older one the rules sent (_older): it comes late, it is no turn by hand"""
    return v is not None and any(abs(v - x) <= half for x in _older(t, now))


def pending(states, e, t, now) -> tuple:
    """(calls, waiting) for a target the rules sent a moment ago (t["sent"]: [target, when, the target before, tries, mode]; mode: it went
    with a change of the mode, off → heating). Reported: done. Switched on, but with a target of its own (the owner's bathroom, 2026-10-28:
    "aus → heizen", then 24° instead of the 17° sent: the thermostat took the one it remembered): the target once more at once.
    Not yet: waiting, it is no turn by hand (the owner, #579: "von selbst gedreht … er selbst und er weiß es nicht": a sleepy radiator
    thermostat reports the new target some minutes later, until then Home Assistant shows the old one). After PENDING seconds still the
    old one (or an older one the rules sent: _own): sent once more (at most TRIES times). Another one: turned by somebody, the rules go on
    as usual. t: what the rules remember of the thermostat."""
    s = t.get("sent")
    if not (isinstance(s, list) and len(s) in (4, 5) and all(_num(x) is not None for x in (s[0], s[1], s[3]))):
        t.pop("sent", None)
        return [], False
    cur, step = _num(_attr(states, e, "temperature")), _tstep(states, e)
    old, half = _num(s[2]), step / 2 + 0.001
    if cur is not None and abs(cur - s[0]) <= half:
        if old is not None and abs(cur - old) <= half and any(abs(x - s[0]) > half for x in _older(t, now)):
            return [], True                                    # it showed this already: an older call may still come first (#588)
        t.pop("sent")
        return [], False
    on, own = (states.get(e) or {}).get("state") not in ("off", *GONE), _own(t, cur, now, half)
    if len(s) == 5 and s[4] and on and cur is not None and (old is None or abs(cur - old) > step / 2 + 0.001) and not own and s[3] < TRIES:
        s[1], s[2], s[3], s[4] = now, cur, s[3] + 1, False       # its own target came with the mode: from now on that is the old one
        return [(e, "set_temperature", {"temperature": s[0]})], True
    if now - s[1] < PENDING:
        return [], True
    if cur is not None and (old is not None and abs(cur - old) <= step / 2 + 0.001 or own) and s[3] < TRIES:
        if on:
            s[1], s[3] = now, s[3] + 1
            return [(e, "set_temperature", {"temperature": s[0]})], True
        if t.get("sentM"):                                     # still off: the mode it was sent with is on its way too (#588)
            return [], True
    t.pop("sent")
    return [], False


def _with(states, e, mode=None, temp=None) -> dict:
    """the states with thermostat e in mode and at target temp (None: as it is)"""
    st = states.get(e) or {}
    attrs = {**(st.get("attributes") or {}), **({"temperature": temp} if temp is not None else {})}
    return {**states, e: {**st, **({"state": mode} if mode is not None else {}), "attributes": attrs}}


def expect(states, e, t, now) -> dict:
    """The states with thermostat e as it will be once it has reported what the rules sent it (#588): a sleepy radiator thermostat
    shows the old mode or target for some minutes. Every rule decides on this, not on what Home Assistant shows: the window shut before
    the thermostat said "off", the rule put back nothing (it still looked heating), then the late "off" came and it stayed off; a boost
    that ended before its 24° was reported, its 24° stayed. A target counts as on its way while the thermostat still shows the one
    before it or an older one the rules sent (another one: somebody turned it, that one counts); a mode until it is reported, or longer while an older mode the rules
    sent may still come after it, at most MODE_WAIT seconds. While the window rule holds it, it counts as paused (off, or as cold as it
    goes), also when it does not show it yet (keep_off makes it so). t: what the rules remember of the thermostat."""
    st, mode, temp = states.get(e) or {}, None, None
    cur, step = _num(_attr(states, e, "temperature")), _tstep(states, e) / 2 + 0.001
    s = t.get("sent")
    if isinstance(s, list) and len(s) >= 3 and _num(s[0]) is not None and (cur is None or abs(cur - s[0]) > step) and (
            cur is None or _num(s[2]) is None or abs(cur - s[2]) <= step or (len(s) == 5 and s[4]) or _own(t, cur, now, step)):
        temp = s[0]
    m = t.get("sentM")                                      # [mode, when, when the mode before it was sent or None]
    if isinstance(m, list) and len(m) == 3 and isinstance(m[0], str) and _num(m[1]) is not None:
        older = _num(m[2]) is not None and now - m[2] < MODE_WAIT
        if now - m[1] >= MODE_WAIT or (st.get("state") == m[0] and not older):
            t.pop("sentM")                                  # reported (and nothing older on its way), or long ago
        else:
            mode = m[0]
    if t.get("ov") == "window" and not paused(states, e, cools(states, e)):
        if "off" in (_attr(states, e, "hvac_modes") or []):
            mode = "off"
        elif not cools(states, e):
            temp = _clamp(states, e, 5.0)
    return _with(states, e, mode, temp) if mode is not None or temp is not None else states


def room_temp(rules, states, e):
    """the temperature of the room of thermostat e: its room sensor (🌡 Raumfühler) when it has one, else what the thermostat measures;
    None while that does not report (a thermostat with a sensor that does not report: None too, at the radiator it measures too warm)"""
    cfg = rules.get("sensors") or {}
    x = (cfg.get("map") or {}).get(e) if cfg.get("on") else None
    if x:
        return rs.sensor_temp(states, x["s"])
    v = _num(_attr(states, e, "current_temperature"))
    return v if v is not None and -40 <= v <= 80 else None


def too_warm(rules, states, e, level, t, key):
    """(wish, target) when the room of thermostat e is too warm (🔥 Zu warm): from wish + above on, until the room is back at the wish;
    wish: the level's temperature, without one the thermostat's own target (while it is lowered: the one before); target: wish − down.
    None when the rule is off for the room, the level is off, the thermostat is off, or nothing measures (lowered already, it stays so
    while the sensor does not report). t: what the rules remember."""
    w = rules.get("warm") or {}
    if not w.get("on") or key in (w.get("skip") or []) or (level or {}).get("off"):
        return None
    was = t.get("ov") == "warm"
    if level:
        wish = _num(level.get("temp"))
    elif was:
        wish = _num((t.get("under") or {}).get("temp"))
    else:
        wish = snap(states, e)["temp"] if (states.get(e) or {}).get("state") not in ("off", None, *GONE) else None
    meas = room_temp(rules, states, e)
    if wish is None or (meas is None and not was):
        return None
    if meas is None or (meas > wish + 0.001 if was else meas >= wish + w["above"] - 0.001):   # a sensor gone for a moment: stays lowered
        return wish, _clamp(states, e, wish - w["down"])
    return None


def restore(states, e, s) -> list:
    if not s or not s.get("mode") or s["mode"] in ("unavailable", "unknown"):
        return []
    if s["mode"] == "off":
        return _set(states, e, "off")
    return _set(states, e, s["mode"], s.get("temp"))


def _level(v, why):
    return {**v, "why": why}


def _schedule(rules, room, local):
    s = rules["schedule"]
    lv = plan_level(s["rooms"][room["key"]], local, s["levels"], s["pre"]) if s["on"] and room["key"] in s["rooms"] else None
    return {"temp": s["levels"][lv], "level": lv} if lv else None


def _night(rules, room, local):
    n = rules["night"]
    return {"temp": n["rooms"].get(room["key"], n["temp"])} if n["on"] and between(local, n["from"], n["to"]) else None


_LEVEL = {                                                         # what each level wants now (None: it does not apply)
    "holiday": lambda rules, room, local, ctx: {"temp": rules["holiday"]["temp"]} if ctx["holiday"] else None,
    "summer": lambda rules, room, local, ctx: {"off": True} if ctx["summer"] else None,
    "away": lambda rules, room, local, ctx: {"temp": rules["away"]["temp"]} if ctx["away"] else None,
    "schedule": lambda rules, room, local, ctx: _schedule(rules, room, local),
    "night": lambda rules, room, local, ctx: _night(rules, room, local),
}


def room_level(rules, room, local, ctx):
    """the level of a room now: {"temp" | "off", "why"} or None; the first in LEVEL_ORDER that applies"""
    for why in LEVEL_ORDER:
        v = _LEVEL[why](rules, room, local, ctx)
        if v:
            return _level(v, why)
    return None


def _same(a, b) -> bool:
    """two levels set the thermostat alike (night 17° and away 17°: nothing to send)"""
    if a is None or b is None:
        return a is b
    return bool(a.get("off")) == bool(b.get("off")) and a.get("temp") == b.get("temp")


def clean_mem(m) -> dict:
    m = m if isinstance(m, dict) else {}
    d = lambda k: m.get(k) if isinstance(m.get(k), dict) else {}   # noqa: E731
    t = lambda k: m.get(k) if isinstance(m.get(k), (int, float)) and not isinstance(m.get(k), bool) else None   # noqa: E731
    return {"t": {k: v for k, v in d("t").items() if isinstance(v, dict)}, "open": {k: v for k, v in d("open").items() if isinstance(v, (int, float))},
            "boost": {k: v for k, v in d("boost").items() if isinstance(v, (int, float))}, "skip": {k: True for k, v in d("skip").items() if v},
            "away": t("away"), "warm": t("warm")}


def _since(st):
    """when a state began (its last_changed) in seconds, None when it does not say"""
    v = st.get("last_changed") if isinstance(st, dict) else None
    try:
        return datetime.datetime.fromisoformat(v).timestamp() if isinstance(v, str) else None
    except ValueError:
        return None


def window_open(states, room, rules, was=False, now=None) -> list:
    """the open windows (and doors to the outside, and doors with the switch "Zählt für die Heizung": counted) of a room the window rule
    watches. was: the room was open at the last look; then a
    contact that does not report for a moment (unavailable or unknown: Home Assistant or Zigbee2MQTT starting again) still counts as open
    for GRACE seconds, the pause goes on (#579: it ended, the heating went on, and paused again after the delay)"""
    ents = list(dict.fromkeys(room["windows"] + room.get("counted", []) + (room["outer"] if rules["window"]["doors"] else [])))
    out = [e for e in ents if (states.get(e) or {}).get("state") in OPEN]
    if out or not was or now is None:
        return out
    return [e for e in ents if (states.get(e) or {}).get("state") in GONE and (_since(states.get(e)) or -1e12) > now - GRACE]


def step(rules, rooms, states, now: float, local: datetime.datetime, mem, *, guard_armed=False, weather=None):
    """One look at every room: (mem, calls, status, log). rules: clean_rules; rooms: roommap.rooms_of; states: {entity: Home Assistant's
    state with attributes}; now: seconds; local: the time of day in Home Assistant's zone; mem: what the last look remembered (clean_mem).
    A window contact of the plan counts even when the thermostat has a window detection of its own: that one only guesses from a quick
    drop of the temperature, and its switch is on by default (the owner: the window open, the rule on, the schedule stayed).
    calls: [(thermostat, service, data)]; status: {room key: {why, since, until, back, open, stuck …}} for the pages; log: [{ent, act, v, why}]."""
    mem = clean_mem(mem)
    calls, status, log = [], {}, []
    persons = [e for e in states if e.startswith("person.")]
    if rules["away"]["on"] and persons and not any((states.get(p) or {}).get("state") == HOME for p in persons):
        mem["away"] = mem["away"] or now
    else:
        mem["away"] = None
    outside = _attr(states, weather, "temperature") if weather else None
    if rules["summer"]["on"] and isinstance(outside, (int, float)):
        if outside > rules["summer"]["above"]:
            mem["warm"] = mem["warm"] or now
        elif outside < rules["summer"]["above"] - 1:
            mem["warm"] = None
    elif not rules["summer"]["on"]:
        mem["warm"] = None
    ctx = {"holiday": holiday_on(rules, local, guard_armed),
           "summer": rules["summer"]["on"] and mem["warm"] is not None and now - mem["warm"] >= rules["summer"]["hours"] * 3600,
           "away": mem["away"] is not None and now - mem["away"] >= rules["away"]["delay"] * 60}
    seen, placed = set(), {c for r in rooms for c in r["climates"]}
    for room in rooms:
        key = room["key"]
        climates = [e for e in room["climates"] if heats(states, e) and e not in seen]
        seen.update(climates)
        opened = window_open(states, room, rules, key in mem["open"], now)
        if opened:
            mem["open"][key] = mem["open"].get(key) or now
        else:
            mem["open"].pop(key, None)
            mem["skip"].pop(key, None)                    # "Trotzdem heizen" lasts until the window is shut
        if mem["boost"].get(key, 0) <= now:
            mem["boost"].pop(key, None)
        if not climates:
            continue
        watched = rules["window"]["on"] and key not in rules["window"]["skip"]
        due = watched and opened and not mem["skip"].get(key) and now - mem["open"][key] >= rules["window"]["delay"] * 60
        room_lv = room_level(rules, room, local, ctx)
        for e in climates:
            ac = cools(states, e)                            # an air conditioner: only the window (levels, boost, too warm would heat)
            level = None if ac else room_lv
            t = mem["t"].get(e) or {}
            old_level, old_ov = t.get("level"), t.get("ov")
            view = expect(states, e, t, now)                 # as it will be once it reported what was sent: every rule decides on this
            ov_e, warm = None, None
            for k in OVERRIDES:                              # the first override that applies (ORDER)
                if k == "window":
                    ov_e = k if due else None
                elif k == "boost":
                    ov_e = k if not ac and key in mem["boost"] else None
                elif k == "warm" and not ac:
                    warm = too_warm(rules, view, e, level, t, key)
                    ov_e = k if warm else None
                if ov_e:
                    break
            cur0, out, half = _num(_attr(states, e, "temperature")), [], _tstep(states, e) / 2 + 0.001
            same_lv = _same(level, old_level) and (level or {}).get("why") == (old_level or {}).get("why")
            low = _num(t.get("warmTo")) if old_ov == "warm" else None      # what too warm set; still on its way (not reported yet)?
            sent = t.get("sent") if isinstance(t.get("sent"), list) and len(t["sent"]) >= 3 else [None, None, None]
            on_way = (low is not None and _num(sent[0]) is not None and abs(sent[0] - low) <= half      # it still shows the target before
                      and (cur0 is None or (_num(sent[2]) is not None and abs(cur0 - sent[2]) <= half) or _own(t, cur0, now, half)))
            if ov_e != old_ov:
                if ov_e and not old_ov:                      # an override starts: remember the thermostat as it is
                    t["under"], t["lvAtOv"] = snap(view, e), old_level
                    t["offT"], t["offN"] = now, 0
                    t.pop("moved", None)
                    out = apply_override(view, e, ov_e, rules, warm and warm[1])
                elif ov_e:                                   # one override follows another (the window opened during a boost)
                    out = apply_override(view, e, ov_e, rules, warm and warm[1])
                    t["moved"] = t.get("moved") or not same_lv
                elif low is not None and not on_way and cur0 is not None and abs(cur0 - low) > half and same_lv:
                    if level and t.get("lvAtOv") is None:   # turned by somebody while it was too warm: stays as turned (until the next
                        t["before"] = t.get("under")         # block: one that starts now goes first)
                    t.pop("under", None)
                    t.pop("lvAtOv", None)
                    t.pop("sent", None)
                else:                                      # it ends: as it was, or the level that came meanwhile
                    at = t.get("lvAtOv")                     # moved: the level changed meanwhile (and came back): no "as it was"
                    if _same(level, at) and (level or {}).get("why") == (at or {}).get("why") and same_lv and not t.get("moved"):
                        out = restore(view, e, t.get("under"))
                    elif level:
                        if at is None:
                            t["before"] = t.get("under")
                        out = apply_level(view, e, level)
                    else:
                        out = restore(view, e, (t.get("before") if (at or {}).get("why") in PASSING else None) or t.get("under"))
                        t.pop("before", None)
                    t.pop("under", None)
                    t.pop("lvAtOv", None)
                if not ov_e:
                    t.pop("moved", None)
            elif ov_e and not same_lv:
                t["moved"] = True                            # the level changed during the override (#588)
            elif not ov_e and not same_lv:
                if level and not old_level:                # rules take over: remember how it was
                    t["before"] = snap(view, e)
                    out = apply_level(view, e, level)
                elif level:
                    out = [] if _same(level, old_level) else apply_level(view, e, level)
                else:                                      # no rule any more: back after a passing situation, else left as it is
                    if old_level.get("why") in PASSING:
                        out = restore(view, e, t.get("before"))
                    t.pop("before", None)
            if ov_e == "warm" and old_ov == "warm" and not out and t.get("warmTo") != warm[1]:
                out = apply_override(view, e, "warm", rules, warm[1])     # still too warm, but the wish changed (the schedule moved on)
            if ov_e == "warm":
                t["warmTo"], t["warm"] = warm[1], [warm[0], room_temp(rules, states, e)]
            else:
                t.pop("warmTo", None)
                t.pop("warm", None)
            if ov_e == "window":
                out = out or keep_off(states, e, t, now, ac)
            else:
                t.pop("offT", None)
                t.pop("offN", None)
            waiting, again, cur = False, False, _attr(states, e, "temperature")
            if ov_e == "window":
                t.pop("sent", None)
            elif not out:                                  # a target sent a moment ago, not reported yet: no turn by hand (#579)
                out, waiting = pending(states, e, t, now)
                again = bool(out)
            hand, back = rules["schedule"]["hand"], []
            if not out and not waiting and hand:
                if not ov_e and (level or {}).get("why") == "schedule":
                    back = by_hand(states, e, level)
                elif ov_e == "warm" and old_ov == "warm":     # turned while too warm (#592: it heated on, the card said "Thermostat
                    back = by_hand(states, e, {"temp": warm[1]}, keep=True)   # 12°" and too warm never ended): lowered again the same way
            if back:
                h0 = t.get("hand")                             # turned by hand under the schedule: back some minutes after the last turn
                if not isinstance(h0, (int, float)) or isinstance(h0, bool) or t.get("handT") != cur:
                    t["hand"], t["handT"] = now, cur
                if now - t["hand"] >= hand * 60:
                    out = back
                    t.pop("hand", None)
                    t.pop("handT", None)
            else:
                t.pop("hand", None)
                t.pop("handT", None)
            sets = [c[2]["temperature"] for c in out if c[1] == "set_temperature"]
            if sets and ov_e != "window" and not again:      # what was sent, to know it when the thermostat reports it late
                p = t.get("sent")
                old = [x for x in t.get("sentOld") or [] if isinstance(x, list) and len(x) == 2 and _num(x[1]) is not None and now - x[1] < MODE_WAIT]
                t["sentOld"] = (old + ([[p[0], p[1]]] if isinstance(p, list) and len(p) >= 2 else []))[-4:]
                t["sent"] = [sets[-1], now, _num(cur), 0, any(c[1] == "set_hvac_mode" for c in out) or bool(t.get("sentM"))]
            modes = [c[2]["hvac_mode"] for c in out if c[1] == "set_hvac_mode"]
            if modes:                                        # the mode too (expect)
                t["sentM"] = [modes[-1], now, t["sentM"][1] if isinstance(t.get("sentM"), list) and len(t["sentM"]) == 3 else None]
            t["level"], t["ov"] = level, ov_e
            mem["t"][e] = t
            for c in out:
                calls.append(c)
                log.append({"ent": e, "act": "off" if c[2].get("hvac_mode") == "off" else "temp" if c[1] == "set_temperature" else "mode",
                            "v": c[2].get("temperature", c[2].get("hvac_mode")), "why": ov_e or (level or {}).get("why") or "back", "room": key,
                            **({"again": True} if again else {})})
        first = mem["t"].get(climates[0]) or {}                # what its (first) thermostat does: an air conditioner only the window
        lv, ov1 = first.get("level") or {}, first.get("ov")
        status[key] = {"why": ov1 or lv.get("why"), "temp": lv.get("temp"), "level": lv.get("level"),
                       "since": mem["open"].get(key) if ov1 == "window" else None, "until": mem["boost"].get(key) if ov1 == "boost" else None,
                       "back": (first.get("under") or {}).get("temp") if ov1 else None, "open": opened,
                       "waiting": bool(watched and opened and not due and not mem["skip"].get(key)), "skip": bool(mem["skip"].get(key)),
                       "hand": first["hand"] + rules["schedule"]["hand"] * 60 if first.get("hand") else None,
                       "stuck": ov1 == "window" and not paused(states, climates[0], cools(states, climates[0])) and first.get("offN", 0) >= TRIES,
                       "sent": (first.get("sent") or [None])[0], "climates": climates,
                       "warm": {"wish": first["warm"][0], "room": first["warm"][1], "to": first.get("warmTo")} if ov1 == "warm" and first.get("warm") else None}
    for e in list(mem["t"]):                                # thermostats no longer in a room: forgotten
        if e not in seen and e not in placed:
            mem["t"].pop(e)
    return mem, calls, status, log


def held(mem) -> set:
    """the thermostats the window rule holds now (off, or as cold as it goes): a sensor in the room moves nothing there (roomsensors, #577)"""
    return {e for e, t in (mem.get("t") or {}).items() if isinstance(t, dict) and t.get("ov") == "window"}


def boost(mem, key: str, now: float, rules) -> dict:
    """🚀 on a room: warm for the boost's minutes (a second tap stops it)"""
    mem = clean_mem(mem)
    if mem["boost"].get(key, 0) > now:
        mem["boost"].pop(key)
    else:
        mem["boost"][key] = now + rules["boost"]["minutes"] * 60
    return mem


def skip(mem, key: str) -> dict:
    """"Trotzdem heizen": the window rule leaves the room alone until its window is shut"""
    mem = clean_mem(mem)
    mem["skip"][key] = True
    return mem
