"""Own routines "Wenn … dann …" (#546, the owner: "dass man sich dann da selbst diese Abläufe machen kann, so ähnlich wie Node-RED, bloß
halt in unserem Dashboard"; picture docs/ideen-4.28/5-wenn-dann.jpg), run by the add-on itself (also with no screen open).

A routine has one to four lanes. A lane is a chain of blocks: first a trigger ("Wenn": a window opens, motion, a time, sunset, somebody
comes or goes, a value over or under a limit, a button on the page), then in any order conditions ("Nur wenn": between two times, on
some days, somebody at home, a device is on, colder outside than …), waits ("Warten": a while, or "bleibt so" — the trigger must stay
true that long, else the lane stops) and actions ("Dann": switch, dim, heating, roller shutters, a scene or script, a message, "wie
vorher" — back to how the devices were before this routine changed them). A trigger while its lane still runs starts it again (a new
motion: the light stays on 2 more minutes).

Everything that decides is pure (unit test: tests/test_flows.py): clean_flows, changed (a state changed), tick (the clock), run_now (a
button, "Jetzt ausprobieren"). They return the new memory, the calls for Home Assistant and lines for the log; rulesrun.py makes the
calls."""
import datetime
import re

ENTITY = re.compile(r"^[a-z_]{1,32}\.[a-z0-9_]{1,100}$")
FLOW_ID = re.compile(r"^f_[a-z0-9]{1,16}$")
LANE_ID = re.compile(r"^l[a-z0-9]{1,8}$")
HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
MAX_FLOWS, MAX_LANES, MAX_BLOCKS, MAX_ENTS = 40, 4, 12, 20
OPEN, CLOSED, GONE = {"on", "open", "opening"}, {"off", "closed"}, {None, "unavailable", "unknown"}

TRIGGERS = ("state", "num", "time", "sun", "presence", "button")
CONDS = ("if_time", "if_days", "if_home", "if_state", "if_num", "if_outside", "if_sun")
WAITS = ("hold", "wait")
ACTIONS = ("switch", "heat", "cover", "run", "notify", "restore")
SWITCHABLE = ("light", "switch", "fan", "input_boolean", "media_player")
DOMAINS = {"switch": SWITCHABLE, "heat": ("climate",), "cover": ("cover",), "run": ("scene", "script"),
           "restore": (*SWITCHABLE, "climate", "cover")}
SAME = {"switch": "light", "heat": "climate", "cover": "cover"}       # "im selben Raum": which devices of the trigger's room


def _ents(v, domains=None):
    out = []
    for e in v if isinstance(v, list) else []:
        if isinstance(e, str) and ENTITY.match(e) and e not in out and (domains is None or e.split(".")[0] in domains):
            out.append(e)
    return out[:MAX_ENTS]


def _ent(v, domains=None):
    return (_ents([v], domains) or [""])[0]


def _num(v, lo, hi, default=None):
    return max(lo, min(hi, v)) if isinstance(v, (int, float)) and not isinstance(v, bool) and v == v else default


def _days(v):
    return sorted({d for d in v if isinstance(d, int) and not isinstance(d, bool) and 0 <= d <= 6}) if isinstance(v, list) else []


def _pick(v, allowed, default):
    return v if v in allowed else default


def _time(v, default):
    return v if isinstance(v, str) and HHMM.match(v) else default


def clean_block(b) -> dict | None:
    """one block, every value checked; None when it is no block"""
    if not isinstance(b, dict):
        return None
    k = b.get("k")
    if k == "state":
        ents = _ents(b.get("ents"))
        return {"k": k, "ents": ents, "to": _pick(b.get("to"), ("open", "closed", "on", "off", "any"), "any")} if ents else None
    if k == "num":
        ent, v = _ent(b.get("ent")), _num(b.get("v"), -1e6, 1e6)
        return {"k": k, "ent": ent, "op": _pick(b.get("op"), ("above", "below"), "above"), "v": v} if ent and v is not None else None
    if k == "time":
        return {"k": k, "at": _time(b.get("at"), "07:00"), "days": _days(b.get("days"))}
    if k == "sun":
        return {"k": k, "ev": _pick(b.get("ev"), ("set", "rise"), "set"), "off": int(_num(b.get("off"), -180, 180, 0))}
    if k == "presence":
        return {"k": k, "ev": _pick(b.get("ev"), ("arrive", "leave", "all_away", "first_home"), "arrive"), "who": _ent(b.get("who"), ("person",))}
    if k == "button":
        return {"k": k}
    if k == "if_time":
        return {"k": k, "from": _time(b.get("from"), "22:00"), "to": _time(b.get("to"), "06:00")}
    if k == "if_days":
        return {"k": k, "days": _days(b.get("days"))}
    if k == "if_home":
        who = b.get("who")
        return {"k": k, "who": who if who in ("", "nobody") else _ent(who, ("person",))}
    if k == "if_state":
        ent, is_ = _ent(b.get("ent")), b.get("is")
        return {"k": k, "ent": ent, "is": is_[:40] if isinstance(is_, str) and is_.strip() else "on"} if ent else None
    if k == "if_num":
        ent, v = _ent(b.get("ent")), _num(b.get("v"), -1e6, 1e6)
        return {"k": k, "ent": ent, "op": _pick(b.get("op"), ("above", "below"), "above"), "v": v} if ent and v is not None else None
    if k == "if_outside":
        return {"k": k, "op": _pick(b.get("op"), ("above", "below"), "below"), "v": _num(b.get("v"), -50, 60, 15)}
    if k == "if_sun":
        return {"k": k, "is": _pick(b.get("is"), ("dark", "light"), "dark")}
    if k in WAITS:
        return {"k": k, "s": int(_num(b.get("s"), 1 if k == "wait" else 5, 86400, 120))}
    if k in ("switch", "heat", "cover", "restore"):
        same = b.get("same") is True and k in SAME or (k == "restore" and b.get("same") is True)
        ents = [] if same else _ents(b.get("ents"), DOMAINS[k])
        if not same and not ents and k != "restore":
            return None
        out = {"k": k, "ents": ents, "same": same}
        if k == "switch":
            out["do"] = _pick(b.get("do"), ("on", "off", "toggle"), "on")
            pct = _num(b.get("pct"), 1, 100)
            if pct is not None and out["do"] == "on":
                out["pct"] = int(pct)
        if k == "heat":
            out["do"] = _pick(b.get("do"), ("off", "temp", "heat"), "off")
            if out["do"] == "temp":
                out["v"] = round(_num(b.get("v"), 5, 30, 21) * 2) / 2
        if k == "cover":
            out["do"] = _pick(b.get("do"), ("open", "close", "pos"), "close")
            if out["do"] == "pos":
                out["v"] = int(_num(b.get("v"), 0, 100, 50))
        return out
    if k == "run":
        ent = _ent(b.get("ent"), DOMAINS["run"])
        return {"k": k, "ent": ent} if ent else None
    if k == "notify":
        text = b.get("text")
        return {"k": k, "text": text.strip()[:200]} if isinstance(text, str) and text.strip() else None
    return None


def clean_lane(lane, n: int) -> dict | None:
    if not isinstance(lane, dict):
        return None
    blocks = [x for x in (clean_block(b) for b in (lane.get("blocks") if isinstance(lane.get("blocks"), list) else [])[:MAX_BLOCKS]) if x]
    if not blocks or blocks[0]["k"] not in TRIGGERS or any(b["k"] in TRIGGERS for b in blocks[1:]):
        return None
    lid = lane.get("id") if isinstance(lane.get("id"), str) and LANE_ID.match(lane["id"]) else f"l{n + 1}"
    return {"id": lid, "blocks": blocks}


def clean_flows(data) -> list:
    """the routines as they are kept: [{id, name, on, ha, lanes}] (ha: it is an automation of Home Assistant, haflows.py, and the add-on
    does not run it itself); a lane without a trigger at its start is dropped, a routine without lanes too"""
    out, ids = [], set()
    for f in (data if isinstance(data, list) else [])[:MAX_FLOWS]:
        if not isinstance(f, dict) or not isinstance(f.get("id"), str) or not FLOW_ID.match(f["id"]) or f["id"] in ids:
            continue
        lanes, lids = [], set()
        for n, lane in enumerate((f.get("lanes") if isinstance(f.get("lanes"), list) else [])[:MAX_LANES]):
            c = clean_lane(lane, n)
            if c and c["id"] not in lids:
                lids.add(c["id"])
                lanes.append(c)
        if not lanes:
            continue
        ids.add(f["id"])
        name = f.get("name").strip()[:60] if isinstance(f.get("name"), str) and f["name"].strip() else "Ablauf"
        out.append({"id": f["id"], "name": name, "on": f.get("on") is not False, "ha": f.get("ha") is True, "lanes": lanes})
    return out


def clean_mem(m) -> dict:
    m = m if isinstance(m, dict) else {}
    d = lambda k: m.get(k) if isinstance(m.get(k), dict) else {}   # noqa: E731
    return {"runs": {k: v for k, v in d("runs").items() if isinstance(v, dict)}, "saved": {k: v for k, v in d("saved").items() if isinstance(v, dict)},
            "fired": {k: v for k, v in d("fired").items() if isinstance(v, str)}, "last": {k: v for k, v in d("last").items() if isinstance(v, dict)},
            "sun": {k: [x for x in v if isinstance(x, str)][-2:] for k, v in d("sun").items() if isinstance(v, list)}}


# ---------- what the house says ----------
def _state(ctx, e):
    return (ctx["states"].get(e) or {}).get("state")


def _attr(ctx, e, k):
    return ((ctx["states"].get(e) or {}).get("attributes") or {}).get(k)


def _float(v):
    try:
        f = float(v)
        return f if f == f else None
    except (TypeError, ValueError):
        return None


def _klass(s):
    return "open" if s in OPEN else "closed" if s in CLOSED else s


def _home(ctx):
    return [e for e in ctx["states"] if e.startswith("person.") and _state(ctx, e) == "home"]


def _between(local, a, b):
    m, x, y = local.hour * 60 + local.minute, int(a[:2]) * 60 + int(a[3:]), int(b[:2]) * 60 + int(b[3:])
    return x <= m < y if x <= y else (m >= x or m < y)


def matches(trig: dict, eid: str, old, new, ctx) -> bool:
    """does a change of entity eid from old to new (states as text) set off the trigger"""
    k = trig["k"]
    if old in GONE or new in GONE or old == new:
        return False
    if k == "state":
        if eid not in trig["ents"]:
            return False
        to = trig["to"]
        if to == "any":
            return True
        if to in ("open", "closed"):
            return _klass(new) == to and _klass(old) != to
        return new == to
    if k == "num":
        if eid != trig["ent"]:
            return False
        a, b = _float(old), _float(new)
        if a is None or b is None:
            return False
        return a <= trig["v"] < b if trig["op"] == "above" else a >= trig["v"] > b
    if k == "presence":
        if not eid.startswith("person.") or (trig["who"] and eid != trig["who"]):
            return False
        came, went = new == "home" and old != "home", old == "home" and new != "home"
        ev = trig["ev"]
        if ev == "arrive":
            return came
        if ev == "leave":
            return went
        if ev == "all_away":
            return went and not _home(ctx)
        return came and _home(ctx) == [eid]                  # first_home: nobody else was home
    return False


def holds(trig: dict, run: dict, ctx) -> bool:
    """is what set the lane off still true (for "bleibt so")"""
    k, e = trig["k"], run.get("ent")
    if k == "state" and e:
        to, s = trig["to"], _state(ctx, e)
        if to == "any":
            return s == run.get("val")
        return _klass(s) == to if to in ("open", "closed") else s == to
    if k == "num":
        v = _float(_state(ctx, trig["ent"]))
        return v is not None and (v > trig["v"] if trig["op"] == "above" else v < trig["v"])
    if k == "presence" and e:
        ev = trig["ev"]
        if ev == "all_away":
            return not _home(ctx)
        return (_state(ctx, e) == "home") == (ev in ("arrive", "first_home"))
    return True


def check(cond: dict, run: dict, ctx) -> bool:
    k, local = cond["k"], ctx["local"]
    if k == "if_time":
        return _between(local, cond["from"], cond["to"])
    if k == "if_days":
        return not cond["days"] or local.weekday() in cond["days"]
    if k == "if_home":
        home = _home(ctx)
        return (not home) if cond["who"] == "nobody" else bool(home) if not cond["who"] else cond["who"] in home
    if k == "if_state":
        s, want = _state(ctx, cond["ent"]), cond["is"]
        return _klass(s) == want if want in ("open", "closed") else s == want
    if k in ("if_num", "if_outside"):
        v = _float(_state(ctx, cond["ent"])) if k == "if_num" else _float(_attr(ctx, ctx.get("weather"), "temperature")) if ctx.get("weather") else None
        return v is not None and (v > cond["v"] if cond["op"] == "above" else v < cond["v"])
    if k == "if_sun":
        dark = _state(ctx, "sun.sun") == "below_horizon"
        return dark if cond["is"] == "dark" else not dark
    return True


# ---------- doing ----------
def snapshot(ctx, e) -> dict:
    """a device as it is now, to put it back later ("wie vorher")"""
    s, dom = _state(ctx, e), e.split(".")[0]
    out = {"s": s}
    if dom == "light" and s == "on" and isinstance(_attr(ctx, e, "brightness"), (int, float)):
        out["b"] = _attr(ctx, e, "brightness")
    if dom == "climate":
        out["t"] = _attr(ctx, e, "temperature")
    if dom == "cover" and isinstance(_attr(ctx, e, "current_position"), (int, float)):
        out["p"] = _attr(ctx, e, "current_position")
    return out


def back_calls(e, snap) -> list:
    """the calls that put device e back as snap says"""
    dom, s = e.split(".")[0], snap.get("s")
    if s in GONE:
        return []
    if dom == "climate":
        calls = [("climate", "set_hvac_mode", {"entity_id": e, "hvac_mode": s})]
        if s != "off" and isinstance(snap.get("t"), (int, float)):
            calls.append(("climate", "set_temperature", {"entity_id": e, "temperature": snap["t"]}))
        return calls
    if dom == "cover":
        if isinstance(snap.get("p"), (int, float)):
            return [("cover", "set_cover_position", {"entity_id": e, "position": snap["p"]})]
        return [("cover", "open_cover" if s in OPEN else "close_cover", {"entity_id": e})]
    if dom == "light" and s == "on" and isinstance(snap.get("b"), (int, float)):
        return [("light", "turn_on", {"entity_id": e, "brightness": snap["b"]})]
    return [(dom, "turn_on" if s in ("on", "playing", "paused", "idle") else "turn_off", {"entity_id": e})]


def targets(block, run, ctx) -> list:
    if block.get("same"):
        room = ctx["room_of"](run.get("ent") or "")
        if not room:
            return []
        if block["k"] == "restore":
            return [e for d in DOMAINS["restore"] for e in ctx["in_room"](room, d)]
        return ctx["in_room"](room, SAME[block["k"]])
    return block.get("ents") or []


def action_calls(block, run, ctx, saved: dict) -> list:
    """the calls of one action; what it changes is remembered first (once per routine) for "wie vorher\""""
    k, calls = block["k"], []
    if k == "notify":
        return [("notify", "", {"message": fill(block["text"], run, ctx)})]
    if k == "run":
        return [(block["ent"].split(".")[0], "turn_on", {"entity_id": block["ent"]})]
    ents = [e for e in targets(block, run, ctx) if _state(ctx, e) not in GONE or k == "restore"]
    if k == "restore":
        for e in ents or list(saved):
            if e in saved:
                calls += back_calls(e, saved.pop(e))
        return calls
    for e in ents:
        saved.setdefault(e, snapshot(ctx, e))
        dom = e.split(".")[0]
        if k == "switch":
            svc = {"on": "turn_on", "off": "turn_off", "toggle": "toggle"}[block["do"]]
            data = {"entity_id": e}
            if dom == "light" and "pct" in block:
                data["brightness_pct"] = block["pct"]
            calls.append((dom, svc, data))
        elif k == "heat":
            if block["do"] == "off":
                calls.append(("climate", "set_hvac_mode", {"entity_id": e, "hvac_mode": "off"}))
            else:
                modes = _attr(ctx, e, "hvac_modes") or []
                if _state(ctx, e) not in ("heat", "auto", "heat_cool"):
                    calls.append(("climate", "set_hvac_mode", {"entity_id": e, "hvac_mode": "heat" if "heat" in modes or not modes else modes[0]}))
                if block["do"] == "temp":
                    calls.append(("climate", "set_temperature", {"entity_id": e, "temperature": block["v"]}))
        elif k == "cover":
            if block["do"] == "pos":
                calls.append(("cover", "set_cover_position", {"entity_id": e, "position": block["v"]}))
            else:
                calls.append(("cover", "open_cover" if block["do"] == "open" else "close_cover", {"entity_id": e}))
    return calls


def fill(text: str, run, ctx) -> str:
    """{name} the device that set it off, {room} its room, {state} its state now"""
    e = run.get("ent") or ""
    room = ctx["room_of"](e) if e else ""
    return (text.replace("{name}", ctx["names"].get(e, e) if e else "").replace("{room}", ctx["room_names"].get(room, "") if room else "")
            .replace("{state}", str(_state(ctx, e) or "") if e else ""))


def _key(f, lane):
    return f"{f['id']}/{lane['id']}"


def _log(f, lane, act, **more):
    return {"src": "flow", "id": f["id"], "name": f["name"], "lane": lane["id"], "act": act, **more}


def advance(f, lane, run, ctx, mem, test=False):
    """go along the lane from where the run stands: conditions, waits, actions; (calls, log). The run waits at a wait (run["until"]),
    is over at the end or at a condition not met (it is taken out of mem["runs"])"""
    calls, log, now = [], [], ctx["now"]
    key, blocks = _key(f, lane), lane["blocks"]
    last = mem["last"].setdefault(key, {"t0": run["t0"], "passed": {}, "end": None, "stop": None})
    saved = mem["saved"].setdefault(f["id"], {})
    while run["i"] < len(blocks):
        i, b = run["i"], blocks[run["i"]]
        if b["k"] in CONDS and not test:
            if not check(b, run, ctx):
                last.update(end=now, stop=i)
                mem["runs"].pop(key, None)
                log.append(_log(f, lane, "stop", block=i))
                return calls, log
        elif b["k"] in WAITS and not test:
            if run.get("until") is None:
                run["until"] = now + b["s"]
                mem["runs"][key] = run
                return calls, log
            if now < run["until"]:
                return calls, log
            if b["k"] == "hold" and not holds(blocks[0], run, ctx):
                last.update(end=now, stop=i)
                mem["runs"].pop(key, None)
                log.append(_log(f, lane, "stop", block=i))
                return calls, log
            run["until"] = None
        elif b["k"] in ACTIONS:
            out = action_calls(b, run, ctx, saved)
            calls += out
            lines = {}                                       # one line per device (a thermostat gets its mode and its target)
            for c in out:
                d = c[2]
                v = d.get("temperature", d.get("brightness_pct", d.get("position", d.get("message", d.get("hvac_mode")))))
                lines[d.get("entity_id", "")] = _log(f, lane, b["k"], ent=d.get("entity_id", ""), do=c[1], v=v if v is not None else lines.get(d.get("entity_id", ""), {}).get("v"))
            log += lines.values()
        last["passed"][str(i)] = now
        run["i"] = i + 1
    last["end"] = now
    mem["runs"].pop(key, None)
    if not saved:
        mem["saved"].pop(f["id"], None)
    return calls, log


def start(f, lane, ent, val, ctx, mem, test=False):
    """the trigger of a lane went off: a new run from its second block (a run of the same lane is replaced)"""
    key = _key(f, lane)
    run = {"i": 1, "until": None, "ent": ent, "val": val, "t0": ctx["now"]}
    mem["runs"][key] = run
    mem["last"][key] = {"t0": ctx["now"], "passed": {"0": ctx["now"]}, "end": None, "stop": None, **({"test": True} if test else {})}
    calls, log = advance(f, lane, run, ctx, mem, test)
    return calls, [_log(f, lane, "start", ent=ent or "", test=test)] + log


def changed(flows, mem, eid: str, old, new, ctx):
    """a state changed (old and new as text): lanes it sets off start, waits "bleibt so" it breaks stop; (mem, calls, log)"""
    mem = clean_mem(mem)
    calls, log = [], []
    for f in flows:
        if not f["on"]:
            continue
        for lane in f["lanes"]:
            key, trig = _key(f, lane), lane["blocks"][0]
            run = mem["runs"].get(key)
            about = eid == (run or {}).get("ent"), eid == trig.get("ent"), trig["k"] == "presence" and eid.startswith("person.")
            if run and run.get("until") is not None and lane["blocks"][run["i"]]["k"] == "hold" and any(about):
                if not holds(trig, run, ctx):
                    mem["runs"].pop(key, None)
                    mem["last"].setdefault(key, {"t0": run["t0"], "passed": {}}).update(end=ctx["now"], stop=run["i"])
                    log.append(_log(f, lane, "stop", block=run["i"]))
            if matches(trig, eid, old, new, ctx):
                c, lg = start(f, lane, eid, new, ctx, mem)
                calls += c
                log += lg
    return mem, calls, log


def _sun_times(mem, ctx):
    """the sunrise / sunset times Home Assistant says and the one before it (sun.sun names the next one: after sunset tomorrow's)"""
    for ev, attr in (("set", "next_setting"), ("rise", "next_rising")):
        v = _attr(ctx, "sun.sun", attr)
        if isinstance(v, str):
            seen = mem["sun"].setdefault(ev, [])
            if not seen or seen[-1] != v:
                seen.append(v)
                del seen[:-2]


def _when(iso):
    try:
        return datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).timestamp()
    except (ValueError, AttributeError):
        return None


def tick(flows, mem, ctx):
    """the clock: time and sun triggers, waits that are over; (mem, calls, log)"""
    mem = clean_mem(mem)
    calls, log, now, local = [], [], ctx["now"], ctx["local"]
    _sun_times(mem, ctx)
    live = set()
    for f in flows:
        for lane in f["lanes"]:
            key, trig = _key(f, lane), lane["blocks"][0]
            live.add(key)
            if not f["on"]:
                mem["runs"].pop(key, None)
                continue
            run = mem["runs"].get(key)
            if run and run.get("until") is not None and now >= run["until"]:
                c, lg = advance(f, lane, run, ctx, mem)
                calls += c
                log += lg
            mark = None
            if trig["k"] == "time" and local.strftime("%H:%M") == trig["at"] and (not trig["days"] or local.weekday() in trig["days"]):
                mark = local.strftime("%Y-%m-%d ") + trig["at"]
            if trig["k"] == "sun":
                for iso in mem["sun"].get(trig["ev"], []):
                    t = _when(iso)
                    if t is not None and 0 <= now - (t + trig["off"] * 60) < 600:
                        mark = iso
            if mark and mem["fired"].get(key) != mark:
                mem["fired"][key] = mark
                c, lg = start(f, lane, "", None, ctx, mem)
                calls += c
                log += lg
    for k in [k for k in (*mem["runs"], *mem["last"], *mem["fired"]) if k not in live]:   # lanes taken away
        for part in ("runs", "last", "fired"):
            mem[part].pop(k, None)
    ids = {f["id"] for f in flows}
    for fid in [fid for fid in mem["saved"] if fid not in ids]:
        mem["saved"].pop(fid)
    return mem, calls, log


def run_now(flows, mem, fid: str, lane_id: str, ctx, test=False):
    """a lane started from the page: its button ("Knopf im Dashboard"), or "Jetzt ausprobieren" (test: every action at once, without the
    conditions and waits; "im selben Raum" means the room of the trigger's first device); (mem, calls, log), None when there is no
    such lane"""
    mem = clean_mem(mem)
    for f in flows:
        if f["id"] != fid:
            continue
        for lane in f["lanes"]:
            if lane["id"] == lane_id:
                trig = lane["blocks"][0]
                ent = (trig.get("ents") or [trig.get("ent") or trig.get("who") or ""])[0] if test else ""
                calls, log = start(f, lane, ent, _state(ctx, ent) if ent else None, ctx, mem, test)
                return mem, calls, log
    return None


def view(flows, mem, now: float) -> dict:
    """what the pages show of every lane: {flow id/lane id: {running, wait (block), until, passed {block: time}, stop, end}}"""
    mem = clean_mem(mem)
    out = {}
    for f in flows:
        for lane in f["lanes"]:
            key = _key(f, lane)
            run, last = mem["runs"].get(key), mem["last"].get(key) or {}
            out[key] = {"running": bool(run), "wait": run["i"] if run and run.get("until") else None, "until": (run or {}).get("until"),
                        "passed": last.get("passed") or {}, "stop": last.get("stop"), "end": last.get("end"), "t0": last.get("t0"), "test": bool(last.get("test"))}
    return out
