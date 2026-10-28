"""Room sensors for the thermostats (#573, the owner: "jedem Thermostat einfach einen Temperatursensor gebe … wie bei Better Thermostat";
pictures docs/ideen-4.38/, his choice: the add-on regulates itself, with every kind of thermostat). A thermostat on the radiator measures
the warm radiator and stops too early (his living room: the thermostat 25,1°, the room 20,5°). An admin gives it a sensor in the room
(🌡 Klima → 📋 Heiz-Regeln → 🌡 Raumfühler) and the add-on regulates by that sensor, also with no screen open:
- 🎯 "cal" (Ausgleich): the thermostat's device has a setting for it, found among the entities of its device (find_cal): a temperature
  offset ("local temperature calibration" of Zigbee2MQTT, "local temperature offset" of ZHA, "temperature offset" of Matter …), set to
  what it is plus the difference between the sensor and what the thermostat measures; or an input for an external temperature (Sonoff
  TRVZB, Aqara E1, Bosch, Danfoss Ally …) that gets the sensor's value, its select "sensor" put to external. The thermostat itself then
  uses (and shows in Home Assistant) the room's temperature, its target stays the target.
- ↕ "shift" (Wunsch verschieben): any other thermostat (Homematic IP, tado …). The add-on keeps the wish (the temperature wanted in the
  room) and sets the thermostat to wish + (what it measures − the sensor), so it heats until the room is as warm as wished. A target set by
  somebody else (Home Assistant, an automation, the device) becomes the new wish; the add-on's heating rules and pages set the wish
  directly (route, set_wish), and the rules see the wish as the thermostat's target (virtual).
- "show" (Nur anzeigen): the pages show the sensor, nothing is regulated.  "auto": cal when the device has one, else shift.
Writing to a thermostat costs battery: at most every "every" minutes, and only from a difference of "min" degrees. A sensor taken away (or
the card switched off) puts the thermostat back as it was: its offset as before, its select as before, its target the wish. While the
sensor does not report, the thermostat regulates itself (the target is the wish; an external input goes back to its own sensor).

Pure (unit test: tests/test_roomsensors.py): clean, find_cal, step, virtual, route, set_wish; rulesrun.py runs it with the heating rules."""
import math
import re

WAYS = ("auto", "cal", "shift", "show")
CLIMATE = re.compile(r"^climate\.[a-z0-9_]{1,120}$")
SENSOR = re.compile(r"^sensor\.[a-z0-9_]{1,120}$")
MAX = 100                  # thermostats with a sensor
PENDING = 180              # s: a target or offset just sent, not reported back yet (a sleepy radiator thermostat)
KEEP = 30 * 60             # s: an external temperature input is sent again at least this often (some forget it after a while)
MAX_SHIFT = 8.0            # ° a target is moved at most
DEFAULT = {"on": True, "every": 10, "min": 0.5, "map": {}}
GONE = (None, "unavailable", "unknown")

_OFFSET = re.compile(r"calibrat|kalibrier|offset|versatz|korrektur")
_TEMP = re.compile(r"temp|calibrat|kalibrier")
_EXT = re.compile(r"external|extern|remote")
_EXT_WHAT = re.compile(r"temp|sensor|measured|fuhler|fuehler|fühler")
_NOT = re.compile(r"valve|ventil|humid|feucht|motor|position|batter|hysteres|window|fenster")
_SEL = re.compile(r"sensor|source|quelle|fuhler|fuehler|fühler|temp")


def _num(v):
    """a number of a state or attribute (states are text), None when it is none"""
    if isinstance(v, bool):
        return None
    if isinstance(v, str):
        try:
            v = float(v)
        except ValueError:
            return None
    return float(v) if isinstance(v, (int, float)) and math.isfinite(v) else None


def _int(v, lo, hi, default):
    v = _num(v)
    return max(lo, min(hi, int(round(v)))) if v is not None else default


def clean(v) -> dict:
    """the card as an admin set it: {on, every (minutes between two writes), min (° of difference), map: {thermostat: {s: sensor, way}}}"""
    d = v if isinstance(v, dict) else {}
    out = {}
    for e, x in (d.get("map") if isinstance(d.get("map"), dict) else {}).items():
        if len(out) >= MAX:
            break
        if isinstance(e, str) and CLIMATE.match(e) and isinstance(x, dict) and isinstance(x.get("s"), str) and SENSOR.match(x["s"]):
            out[e] = {"s": x["s"], "way": x.get("way") if x.get("way") in WAYS else "auto"}
    m = _num(d.get("min"))
    return {"on": d.get("on") if isinstance(d.get("on"), bool) else DEFAULT["on"], "every": _int(d.get("every"), 2, 60, DEFAULT["every"]),
            "min": max(0.1, min(3.0, round(m * 10) / 10)) if m is not None else DEFAULT["min"], "map": out}


def any_on(cfg: dict) -> bool:
    return bool(cfg["on"] and cfg["map"])


def _attrs(states, e) -> dict:
    return (states.get(e) or {}).get("attributes") or {}


def _words(states, e) -> str:
    """an entity's id and name as one lower-case text to look for words in"""
    return re.sub(r"[^a-z0-9äöüß]+", "_", f"{e.split('.', 1)[-1]} {_attrs(states, e).get('friendly_name') or ''}".lower())


def _ext_option(states, sel):
    """the option of a select that means "the external sensor" ("external", "Extern" …), None when it has none"""
    return next((o for o in _attrs(states, sel).get("options") or [] if isinstance(o, str) and re.search(r"extern|remote", o.lower())), None)


def find_cal(parts, states) -> dict | None:
    """The setting of a thermostat's device for another temperature, among the entities of its device (parts): {"ent", "kind": "off"
    (an offset) | "ext" (an external temperature), "sel": the select to put to external or None, "opt": its option}; an offset first
    (nothing to switch, and it keeps working when the add-on stops), None when the device has neither."""
    offs, exts, sels = [], [], []
    for p in sorted(x for x in parts or [] if isinstance(x, str)):
        if p not in states:
            continue
        w = _words(states, p)
        unit = _attrs(states, p).get("unit_of_measurement")
        if p.startswith("number.") and not _NOT.search(w) and unit not in ("%", "s", "min", "h"):
            if _EXT.search(w) and _EXT_WHAT.search(w):
                exts.append(p)
            elif _OFFSET.search(w) and _TEMP.search(w):
                offs.append(p)
        elif p.startswith("select.") and _SEL.search(w) and not _NOT.search(w) and _ext_option(states, p):
            sels.append(p)
    if offs:
        return {"ent": offs[0], "kind": "off", "sel": None, "opt": None}
    if exts:
        sel = sels[0] if sels else None
        return {"ent": exts[0], "kind": "ext", "sel": sel, "opt": _ext_option(states, sel) if sel else None}
    return None


def parts_of(parts) -> dict:
    """{thermostat: [the entities of its device]} out of {entity: the thermostat of its device} (renames.climate_parts)"""
    out = {}
    for p, e in (parts or {}).items():
        out.setdefault(e, []).append(p)
    return out


def caps(states, parts_of) -> dict:
    """{thermostat: its calibration entity} for every thermostat whose device has one (the page says what "Automatisch" does)"""
    out = {}
    for e in states:
        if e.startswith("climate."):
            c = find_cal(parts_of.get(e), states)
            if c:
                out[e] = c["ent"]
    return out


def _step_of(states, e, key, default):
    s = _num(_attrs(states, e).get(key))
    return s if s and s > 0 else default


def _round(v, step):
    return round(round(v / step) * step, 2)


def _clamp(v, lo, hi):
    if lo is not None:
        v = max(lo, v)
    if hi is not None:
        v = min(hi, v)
    return v


def shifted(wish, meas, room, lo, hi, step) -> float:
    """the target that makes the room as warm as wished: wish + (what the thermostat measures − the room), rounded to the thermostat's
    step, within what it takes; a wish at its lowest (the window rule: as cold as it goes) or highest stays as it is"""
    if (lo is not None and wish <= lo + 0.01) or (hi is not None and wish >= hi - 0.01) or meas is None or room is None:
        return wish
    return _clamp(_round(wish + max(-MAX_SHIFT, min(MAX_SHIFT, meas - room)), step), lo, hi)


def clean_mem(m) -> dict:
    m = m if isinstance(m, dict) else {}
    t = m.get("t") if isinstance(m.get("t"), dict) else {}
    return {"t": {k: v for k, v in t.items() if isinstance(k, str) and isinstance(v, dict)}}


def _way(x, cal) -> tuple:
    """the way a thermostat is regulated now and whether a wished "cal" has none (then only shown)"""
    if x["way"] == "auto":
        return ("cal" if cal else "shift"), False
    if x["way"] == "cal" and not cal:
        return "show", True
    return x["way"], False


def _sensor(states, s):
    """the sensor's temperature, None while it does not report"""
    st = states.get(s) or {}
    v = _num(st.get("state")) if st.get("state") not in GONE else None
    return v if v is not None and -40 <= v <= 80 else None


def _undo(states, e, t) -> list:
    """the calls that put a thermostat back as it was before its sensor (the offset, the select, the target = the wish)"""
    out = []
    if t.get("way") == "cal":
        if t.get("kind") == "off" and _num(t.get("cal0")) is not None and _num((states.get(t["ent"]) or {}).get("state")) != t["cal0"]:
            out.append(("number", "set_value", {"entity_id": t["ent"], "value": t["cal0"]}))
        if t.get("sel") and isinstance(t.get("sel0"), str) and (states.get(t["sel"]) or {}).get("state") != t["sel0"]:
            out.append(("select", "select_option", {"entity_id": t["sel"], "option": t["sel0"]}))
    elif t.get("way") == "shift":
        wish, tgt = _num(t.get("wish")), _num(_attrs(states, e).get("temperature"))
        if wish is not None and tgt is not None and (states.get(e) or {}).get("state") not in ("off", *GONE) and abs(wish - tgt) > 0.01:
            out.append(("climate", "set_temperature", {"entity_id": e, "temperature": wish}))
    return out


def _log(e, act, v, why="sensor"):
    return {"ent": e, "act": act, "v": v, "why": why}


def _cal(cfg, states, e, t, room, meas, now, calls, log, st):
    """🎯: the offset or the external input of the thermostat's device brought to the room's temperature"""
    ent, every, on = t["ent"], cfg["every"] * 60, (states.get(e) or {}).get("state") not in ("off", *GONE)
    a = _attrs(states, ent)
    lo, hi, step = _num(a.get("min")), _num(a.get("max")), _step_of(states, ent, "step", 0.1)
    cur = _num((states.get(ent) or {}).get("state"))
    due = now - t.get("calT", -1e12) >= every
    st.update(kind=t["kind"], ent=ent, name=a.get("friendly_name") or ent)
    if t["kind"] == "off":
        if "cal0" not in t:
            t["cal0"] = cur                                   # how it was: back to it when the sensor is taken away
        st["off"] = cur
        if meas is not None and cur is not None:
            st["raw"] = round(meas - cur, 1)                  # what it measures at the radiator (it reports with its offset)
        if room is None or meas is None or cur is None:
            return
        raw = cur + (room - meas)
        want = _clamp(_round(raw, step), lo, hi)
        st["edge"] = abs(want - raw) > step                    # the offset it takes is not enough
        st["want"] = want
        # just written: wait until the thermostat has the new offset and has measured with it (a sleepy one reports its temperature
        # some minutes later; before that the old measurement with the new offset would count the difference twice)
        st["wait"] = t.get("calV") is not None and now - t.get("calT", 0) < KEEP and (
            (abs(cur - t["calV"]) > step / 2 and now - t.get("calT", 0) < PENDING) or (cur == t["calV"] and meas == t.get("calM") and cur != t.get("calC")))
        if on and abs(room - meas) >= cfg["min"] and abs(want - cur) >= step / 2 and due and not st["wait"]:
            calls.append(("number", "set_value", {"entity_id": ent, "value": want}))
            t["calT"], t["calV"], t["calM"], t["calC"] = now, want, meas, cur
            log.append(_log(e, "cal", want))
            st["wait"] = True
        return
    # an external temperature input (Danfoss counts in hundredths: 2050 = 20,5°)
    scale = 100 if hi is not None and hi > 500 else 1
    sel, opt = t.get("sel"), t.get("opt")
    if sel and "sel0" not in t:
        t["sel0"] = (states.get(sel) or {}).get("state")
    st["sent"] = cur / scale if cur is not None else None
    if room is None:                                            # no sensor: the thermostat's own one again
        if sel and isinstance(t.get("sel0"), str) and (states.get(sel) or {}).get("state") == opt and t["sel0"] != opt:
            calls.append(("select", "select_option", {"entity_id": sel, "option": t["sel0"]}))
            log.append(_log(e, "sel", t["sel0"], "lost"))
        return
    if sel and opt and (states.get(sel) or {}).get("state") != opt and now - t.get("selT", -1e12) >= PENDING:
        calls.append(("select", "select_option", {"entity_id": sel, "option": opt}))
        t["selT"] = now
        log.append(_log(e, "sel", opt))
    want = _clamp(_round(room * scale, step if scale == 1 else 1), lo, hi)
    changed = cur is None or abs(want / scale - cur / scale) >= 0.1
    if (changed and due) or now - t.get("calT", -1e12) >= KEEP:
        calls.append(("number", "set_value", {"entity_id": ent, "value": want}))
        t["calT"], t["calV"] = now, want
        log.append(_log(e, "cal", room))
        st["sent"] = room


def _shift(cfg, states, e, t, room, meas, now, calls, log, st):
    """↕: the thermostat's target moved so that the room gets the wish"""
    a = _attrs(states, e)
    tgt, step = _num(a.get("temperature")), _step_of(states, e, "target_temp_step", 0.5)
    lo, hi = _num(a.get("min_temp")), _num(a.get("max_temp"))
    on = (states.get(e) or {}).get("state") not in ("off", *GONE)
    if _num(t.get("wish")) is None:                         # the first look: the target now is the wish
        t["wish"], t["sent"], t["sentT"] = tgt, tgt, -1e12
    sent = _num(t.get("sent"))                              # the target the thermostat should have: what was sent (or found)
    if tgt is not None and sent is not None and abs(tgt - sent) > step / 2 + 0.001 and now - t.get("sentT", 0) >= PENDING:
        t["wish"], t["new"] = tgt, True                       # set by somebody else (Home Assistant, an automation, the device)
        log.append(_log(e, "wish", tgt, "other"))
    wish = _num(t.get("wish"))
    st.update(wish=wish, set=tgt)
    if wish is None or tgt is None or not on:
        return
    want = shifted(wish, meas, room, lo, hi, step)
    st["want"] = want
    st["wait"] = sent is not None and abs(tgt - sent) > step / 2 + 0.001
    new = t.pop("new", False)
    if abs(want - tgt) > step / 2 + 0.001 and (new or (now - t.get("sentT", -1e12) >= cfg["every"] * 60
                                                       and abs(want - tgt) >= max(step, cfg["min"]) - 0.001)):
        calls.append(("climate", "set_temperature", {"entity_id": e, "temperature": want}))
        t["sent"], t["sentT"] = want, now
        log.append(_log(e, "temp", want))
        st["wait"] = True


def step(cfg, states, parts_of, mem, now: float):
    """One look at every thermostat with a sensor: (mem, calls, status, log). cfg: clean; states: {entity: Home Assistant's state};
    parts_of: {thermostat: [the entities of its device]}; mem: clean_mem. calls: [(domain, service, data)]; status: {thermostat: {s, v
    (the sensor now), meas (what the thermostat reports), raw (… without its offset), way, kind, ent, name, off, want, wait, edge, sent, wish,
    set, lost, nocal, gone}};
    log: [{ent, act: cal | sel | temp | wish | back, v, why}]."""
    mem = clean_mem(mem)
    calls, status, log = [], {}, []
    active = cfg["map"] if cfg["on"] else {}
    plan = {}
    for e, x in active.items():
        cal = find_cal(parts_of.get(e), states)
        way, nocal = _way(x, cal)
        plan[e] = (x, cal, way, nocal)
    for e in list(mem["t"]):                                  # taken away or another way: back as it was first (another sensor: goes on)
        t, p = mem["t"][e], plan.get(e)
        if p is None or p[2] != t.get("way") or (p[2] == "cal" and p[1]["ent"] != t.get("ent")):
            out = _undo(states, e, t)
            calls += out
            if out:
                log.append(_log(e, "back", None, "removed"))
            mem["t"].pop(e)
    for e, (x, cal, way, nocal) in plan.items():
        st = states.get(e) or {}
        room, meas = _sensor(states, x["s"]), _num(_attrs(states, e).get("current_temperature"))
        s = status[e] = {"s": x["s"], "v": room, "meas": meas, "way": way, "lost": room is None}
        if nocal:
            s["nocal"] = True
        if st.get("state") in GONE:
            s["gone"] = True
            continue
        t = mem["t"].setdefault(e, {})
        t.update(s=x["s"], way=way)
        if way == "cal":
            t.update(ent=cal["ent"], kind=cal["kind"], sel=cal["sel"], opt=cal["opt"])
            _cal(cfg, states, e, t, room, meas, now, calls, log, s)
        elif way == "shift":
            _shift(cfg, states, e, t, room, meas, now, calls, log, s)
    return mem, calls, status, log


def _shifting(mem, e) -> dict | None:
    t = mem["t"].get(e)
    return t if t and t.get("way") == "shift" else None


def virtual(states, mem) -> dict:
    """the states as the heating rules should see them: a thermostat whose target is moved has the wish as its target"""
    out = states
    for e, t in mem["t"].items():
        wish = _num(t.get("wish"))
        if t.get("way") == "shift" and wish is not None and e in states:
            if out is states:
                out = dict(states)
            st = states[e]
            out[e] = {**st, "attributes": {**(st.get("attributes") or {}), "temperature": wish}}
    return out


def set_wish(mem, e: str, temp) -> bool:
    """somebody wants this temperature in the room of a thermostat whose target is moved (a page, a heating rule): True when taken"""
    t, v = _shifting(mem, e), _num(temp)
    if t is None or v is None:
        return False
    t["wish"], t["new"] = v, True
    return True


def route(calls, mem) -> list:
    """the calls of the heating rules [(thermostat, service, data)]: a target for a thermostat whose target is moved becomes its wish
    (step sends the moved one); the others as they are"""
    return [c for c in calls if not (c[1] == "set_temperature" and set_wish(mem, c[0], c[2].get("temperature")))]
