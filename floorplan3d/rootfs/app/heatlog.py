"""🩺 Wer steuert was (#579, the owner: "nicht immer erkannt, dass … ein Fenster oder eine Tür offen ist … manchmal … von selbst gedreht
… er selbst und er weiß es irgendwie nicht … ein Log …, wo man auslesen kann, was gerade wen steuert … praktisch für dich, dass du so
Fehler … auswerten kannst"): a journal of what the heating rules saw and did, kept by the add-on (rulesrun.py) also with no screen open,
and every room as the add-on sees it. The page 🌡 Klima → 🩺 Protokoll shows both and copies them as a report (static/heatdiag.js).

Entries (each with t, the time in seconds, and k, the kind):
- contact: a window's or door's contact of a room changed {ent, s, was, rooms: [[room, use, why not]]}; use: window | outer (a door to
  the outside) | counted (a door with the switch "Zählt für die Heizung") | inner (a door between two rooms); why not: why the window rule
  does not count it there (why_not), None when it does
- climate: a thermostat's mode or target changed {ent, room, mode: [before, now] | None, temp: [before, now] | None, by, who, ago}; by:
  addon (it reports what the add-on sent ago seconds before), auto (an automation or script of Home Assistant), user (somebody in Home
  Assistant, who: the person), device (at the thermostat itself or by its integration: Home Assistant does not say who)
- room: what a room's rules do changed {room, why, was, level, temp, waiting, hand, skip, stuck, sent, first, warm (too warm: wish,
  room, to)}
- rule: what a heating rule decided (a line of heatrules.step) {ent, act, v, why, room, again}
- call: a call the add-on made {ent, dom, svc, v, ok (Home Assistant took it), src: heat | sensor}
- sensor: the room sensor took a target somebody else set as the wish, or put a thermostat back {ent, act, v}
- link: the connection to Home Assistant {on, err, n (times in a row), t2 (the last time)}
- start: the add-on started {v: its version}

Pure (unit test: tests/test_heatlog.py)."""
import datetime

MAX = 500                  # entries kept
OWN = 30 * 60              # s: a target the thermostat reports this long after the add-on sent it is the add-on's own
KINDS = ("window", "outer", "counted", "inner")


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _attrs(st) -> dict:
    return (st or {}).get("attributes") or {}


def _since(v):
    try:
        return round(datetime.datetime.fromisoformat(v).timestamp()) if isinstance(v, str) else None
    except ValueError:
        return None


def inner(room) -> list:
    """the door contacts of a room the window rule leaves out: doors between two rooms (without the switch "Zählt für die Heizung")"""
    return [e for e in room.get("doors") or [] if e not in (room.get("outer") or []) and e not in (room.get("counted") or [])]


def counted(room) -> list:
    """the doors of a room with the switch "Zählt für die Heizung" that are not doors to the outside anyway"""
    return [e for e in room.get("counted") or [] if e not in (room.get("outer") or [])]


def index(rooms) -> dict:
    """{entity: [[room key, use]]} for the contacts (use: window, outer, inner) and thermostats (use: climate) of every room"""
    idx = {}
    for r in rooms:
        for use, ents in (("window", r.get("windows")), ("outer", r.get("outer")), ("counted", counted(r)), ("inner", inner(r)), ("climate", r.get("climates"))):
            for e in ents or []:
                if [r["key"], use] not in idx.setdefault(e, []):
                    idx[e].append([r["key"], use])
    return idx


def why_not(key, use, rooms, window) -> str | None:
    """why the window rule does not count a contact of room key (use: window, outer, inner; rooms: {key: room}; window: the rule's
    settings): inner (a door between two rooms), off (the rule is off), doors (doors to the outside are switched off), skip (the room is
    left out), noclimate (no thermostat in the room); None when it counts"""
    if use == "inner":
        return "inner"
    if not window.get("on"):
        return "off"
    if use == "outer" and not window.get("doors", True):
        return "doors"
    if key in (window.get("skip") or []):
        return "skip"
    if not (rooms.get(key) or {}).get("climates"):
        return "noclimate"
    return None


def contact(eid, old, new, uses, now, rooms=None, window=None) -> dict | None:
    """the entry for a contact of a room that changed (old, new: Home Assistant's states, None when there was none; rooms: {key: room} and
    window: the window rule's settings, to say whether it counts)"""
    a, b = (old or {}).get("state"), (new or {}).get("state")
    where = [[x[0], x[1], why_not(x[0], x[1], rooms or {}, window or {}) if window is not None else None] for x in uses or [] if x[1] in KINDS]
    if a == b or not where:
        return None
    return {"t": round(now), "k": "contact", "ent": eid, "s": b, "was": a, "rooms": where}


def users(states) -> dict:
    """{user id of Home Assistant: the name of its person}"""
    out = {}
    for e, st in states.items():
        if e.startswith("person.") and isinstance(_attrs(st).get("user_id"), str):
            out[_attrs(st)["user_id"]] = _attrs(st).get("friendly_name") or e
    return out


def remember(sent: dict, e, svc, data, now):
    """keep what the add-on sent to a thermostat (set_temperature, set_hvac_mode) to know it when it reports it"""
    if svc == "set_temperature" and _num(data.get("temperature")) is not None:
        x = ["temp", data["temperature"], now]
    elif svc == "set_hvac_mode" and isinstance(data.get("hvac_mode"), str):
        x = ["mode", data["hvac_mode"], now]
    else:
        return
    sent[e] = [y for y in sent.get(e) or [] if now - y[2] < OWN][-7:] + [x]


def climate(eid, old, new, sent, now, room=None, people=None, me=None) -> dict | None:
    """The entry for a thermostat whose mode or target changed, with who did it: the add-on when it is what it sent within OWN seconds
    (sent: remember), else what Home Assistant's context says (parent_id: an automation or script; user_id: somebody in Home Assistant,
    people: {user id: name} or a function that gives it; me: the add-on's own user id); else the device itself or its integration. None
    when neither changed."""
    if not new:
        return None
    m0, m1 = (old or {}).get("state"), new.get("state")
    t0, t1 = _num(_attrs(old).get("temperature")), _num(_attrs(new).get("temperature"))
    mode, temp = ([m0, m1] if m0 != m1 else None), ([t0, t1] if t0 != t1 else None)
    if not mode and not temp:
        return None
    step = _num(_attrs(new).get("target_temp_step")) or 0.5
    own = [x for x in sent.get(eid) or [] if now - x[2] < OWN and (
        (x[0] == "temp" and temp and t1 is not None and abs(t1 - x[1]) <= step / 2 + 0.001) or (x[0] == "mode" and mode and m1 == x[1]))]
    out = {"t": round(now), "k": "climate", "ent": eid, "room": room, "mode": mode, "temp": temp}
    ctx = new.get("context") or {}
    if own:
        out.update(by="addon", ago=round(now - own[-1][2]))
    elif ctx.get("user_id") and ctx["user_id"] == me:
        out["by"] = "addon"
    elif ctx.get("parent_id"):
        out["by"] = "auto"
    elif ctx.get("user_id"):
        out.update(by="user", who=((people() if callable(people) else people) or {}).get(ctx["user_id"]))
    else:
        out["by"] = "device"
    return out


ROOM_KEYS = ("why", "level", "temp", "waiting", "skip", "stuck")


def _room_sig(s):
    return [s.get(k) for k in ROOM_KEYS] + [bool(s.get("hand")), s.get("sent") is not None]


def rooms(old: dict, new: dict, now) -> list:
    """the entries for the rooms whose rules do something else now (old, new: the status of heatrules.step); a room seen the first time
    (the add-on started) gets one too, with first"""
    out = []
    for key, s in new.items():
        o = old.get(key)
        if o is not None and _room_sig(o) == _room_sig(s):
            continue
        x = {"t": round(now), "k": "room", "room": key, **{k: s.get(k) for k in ROOM_KEYS}, "hand": s.get("hand"), "sent": s.get("sent")}
        if s.get("warm"):
            x["warm"] = s["warm"]                            # 🔥 too warm: {wish, room, to}
        if o is None:
            x["first"] = True
        elif o.get("why") != s.get("why"):
            x["was"] = o.get("why")
        out.append(x)
    return out


def add(trace: list, entries, now=None) -> bool:
    """entries put at the end of the journal (at most MAX kept); True when something was added"""
    n = 0
    for x in entries or []:
        if isinstance(x, dict) and x.get("k"):
            trace.append(x)
            n += 1
    del trace[:-MAX]
    return n > 0


def link(trace: list, on: bool, now, err=None, quick=False) -> bool:
    """the connection to Home Assistant: up (after the add-on started or the connection was down), or down with its error; down again with
    the same error right after coming up (quick) counts the old entry up instead of two new ones"""
    last = next((x for x in reversed(trace) if x.get("k") in ("link", "start")), None)
    up = last is not None and last.get("k") == "link" and last.get("on")
    if on:
        if up:
            return False
        trace.append({"t": round(now), "k": "link", "on": True})
        del trace[:-MAX]
        return True
    err = str(err or "").strip()[:200] or None
    if up and quick:
        i = len(trace) - 1 - trace[::-1].index(last)
        before = next((x for x in reversed(trace[:i]) if x.get("k") in ("link", "start")), None)
        if before is not None and before.get("k") == "link" and not before.get("on") and before.get("err") == err:
            trace.pop(i)
            before["n"], before["t2"] = before.get("n", 1) + 1, round(now)
            return True
    if last is not None and last.get("k") == "link" and not last.get("on") and last.get("err") == err:
        last["n"], last["t2"] = last.get("n", 1) + 1, round(now)
        return True
    trace.append({"t": round(now), "k": "link", "on": False, "err": err})
    del trace[:-MAX]
    return True


def compact(st) -> dict | None:
    """what the page needs of a state: s (state), n (name), t (target), c (measured), m (modes), a (action), lc (since when)"""
    if not st:
        return None
    a = _attrs(st)
    out = {"s": st.get("state"), "n": a.get("friendly_name")}
    for k, key in (("t", "temperature"), ("c", "current_temperature"), ("m", "hvac_modes"), ("a", "hvac_action")):
        if a.get(key) is not None:
            out[k] = a[key]
    lc = _since(st.get("last_changed"))
    if lc is not None:
        out["lc"] = lc
    return out


def view(rooms_, states, trace, sensors=None) -> dict:
    """what the page 🩺 Protokoll gets: every room with a thermostat or a contact as the add-on sees it {key, house, name, floor, climates,
    windows, outer, counted, inner}, the states of those entities and of the room sensors (sensors: {thermostat: {s: sensor}}), the journal"""
    out, ents = [], set()
    for r in rooms_:
        row = {"key": r["key"], "house": r.get("house"), "name": r.get("name") or r.get("id"), "floor": r.get("floor"),
               "climates": list(r.get("climates") or []), "windows": list(r.get("windows") or []), "outer": list(r.get("outer") or []), "counted": counted(r),
               "inner": inner(r)}
        if row["climates"] or row["windows"] or row["outer"] or row["counted"] or row["inner"]:
            out.append(row)
            ents.update(row["climates"], row["windows"], row["outer"], row["counted"], row["inner"])
    for e, x in (sensors or {}).items():
        ents.update([e, x.get("s")] if isinstance(x, dict) else [e])
    loose = sorted(e for e in states if e.startswith("climate.") and e not in ents)    # thermostats in no room of the plans
    ents.update(loose)
    return {"rooms": out, "loose": loose, "states": {e: compact(states.get(e)) for e in sorted(x for x in ents if isinstance(x, str))},
            "trace": list(trace[-MAX:])}
