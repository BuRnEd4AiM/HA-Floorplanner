"""🏠 Urlaubs-Licht (5.18.0, the owner's choice 2026-11-17, docs/ideen-5.15 picture 7; his choices: while the holiday alarm is armed,
lamps and roller shutters, set up with the holiday alarm): while nobody is at home the lamps go on and off in the evening the way they do
when the family is there. The add-on learns from Home Assistant's history when each chosen lamp was on in the evenings of the last 14
days; every evening it plays one of those real evenings back, each time a different one and shifted by up to 15 minutes, so it is never the
same twice. A lamp with no history gets a plain evening (on about 18:00 – 19:00, off about 22:00 – 23:00). The roller shutters go down
after sunset and up in the morning, each at a slightly different minute.

It does not fight other rules (the owner, 2026-11-17: "pass auf das die regeln sich dann nicht beißen"): it switches only the lamps chosen
here, only what it switched on itself goes off again; a lamp already on, or one someone else switches meanwhile, is left alone for the
night; disarmed (somebody came home), it stops at once and turns off only its own lamps that are still on.

Time is counted in "evening minutes": minutes since 12:00 local time (0 … 1439), so an evening that goes on past midnight is one stretch.
Pure (unit test: tests/test_vacation.py): clean_vac, clean_mem, on_spans, learn, plan, step. rulesrun.py runs it, server.py fetches the
history."""
import datetime
import random
import re

import hanames

WINDOW = (300, 870)            # the evening the lamps play in: 17:00 … 02:30 (evening minutes)
JITTER = 30                    # minutes a start or an end is shifted at most, unless the owner chose another "Spielraum" (the owner,
JITTERS = (15, 30, 45, 60, 90)   # 2026-11-17: "dass es nicht immer zu genau der selben Zeit passiert … 1 Stunde Spielraum")
DAYS = 14
MAX = 30                       # lamps and shutters each
COVER_DOWN = -1.0              # ° of the sun: after sunset the shutters go down (plus up to 20 minutes)
COVER_UP = (420, 465)          # 7:00 … 7:45 the shutters go up (an evening minute of the next morning: + 1440 - 720)
DEFAULT = {"on": False, "lights": [], "covers": [], "jitter": JITTER}
NOT_SHUTTERS = ("garage", "gate", "door", "damper")   # a garage door, a gate, a door is never moved by the holiday light
NOT_NAMES = re.compile(r"garag|gate|(tor|t[uü]e?r|door)($|[\s_.-])", re.I)   # … also when it does not say so: a name or word ending in
                                                                              # "tor", "tür", "door" (Hoftor, Haustür, Rolltor)


def shutter_ok(e, st) -> bool:
    """may the holiday light move cover e: a roller shutter, never a garage door, gate or door (by its device class or its name)"""
    a = (st or {}).get("attributes") or {}
    return a.get("device_class") not in NOT_SHUTTERS and not NOT_NAMES.search(f"{e} {hanames.name(st, '') if st else ''}")


def clean_vac(data) -> dict:
    d = data if isinstance(data, dict) else {}
    pick = lambda k, dom: list(dict.fromkeys(e for e in (d.get(k) or []) if isinstance(e, str) and e.startswith(dom)))[:MAX] if isinstance(d.get(k), list) else []   # noqa: E731
    return {"on": d.get("on") is True, "lights": pick("lights", ("light.", "switch.")), "covers": pick("covers", ("cover.",)),
            "jitter": d.get("jitter") if d.get("jitter") in JITTERS else JITTER}


def clean_mem(m) -> dict:
    m = m if isinstance(m, dict) else {}
    learned = m.get("learned") if isinstance(m.get("learned"), dict) else {}
    return {"night": m.get("night") if isinstance(m.get("night"), str) else "", "plan": m.get("plan") if isinstance(m.get("plan"), dict) else {},
            "ours": [e for e in m.get("ours") or [] if isinstance(e, str)], "left": [e for e in m.get("left") or [] if isinstance(e, str)],
            "down": m.get("down") is True, "up": m.get("up") is True, "jitter": m.get("jitter") if isinstance(m.get("jitter"), int) else None, "downAt": m.get("downAt") if isinstance(m.get("downAt"), int) else None,
            "learned": {"day": learned.get("day") if isinstance(learned.get("day"), str) else "", "spans": learned.get("spans") if isinstance(learned.get("spans"), dict) else {}}}


def evening(dt: datetime.datetime) -> tuple:
    """(the date of the evening as YYYY-MM-DD, evening minute): before noon it is still yesterday's evening"""
    m = dt.hour * 60 + dt.minute - 720
    day = dt.date() if m >= 0 else dt.date() - datetime.timedelta(days=1)
    return day.isoformat(), m % 1440


def on_spans(history, tz, now) -> dict:
    """{entity: {evening date: [[start, end], …]}} from Home Assistant's history (a list per entity of {state, last_changed}), in evening
    minutes, cut to the evening WINDOW; tz: the time zone of the house"""
    out = {}
    for rows in history if isinstance(history, list) else []:
        if not isinstance(rows, list) or not rows:
            continue
        eid = next((r.get("entity_id") for r in rows if isinstance(r, dict) and r.get("entity_id")), None)
        if not eid:
            continue
        pts = []
        for r in rows:
            try:
                t = datetime.datetime.fromisoformat(str(r.get("last_changed") or r.get("last_updated")).replace("Z", "+00:00")).astimezone(tz)
            except (TypeError, ValueError):
                continue
            pts.append((t, r.get("state") == "on"))
        pts.append((now.astimezone(tz), pts[-1][1] if pts else False))
        days = out.setdefault(eid, {})
        for (t0, on), (t1, _n) in zip(pts, pts[1:]):
            if not on or t1 <= t0:
                continue
            cur = t0
            while cur < t1:                                            # split at noon: one evening each
                day, m0 = evening(cur)
                noon = datetime.datetime.combine(datetime.date.fromisoformat(day) + datetime.timedelta(days=1), datetime.time(12), tz)
                end = min(t1, noon)
                m1 = m0 + int((end - cur).total_seconds() // 60)
                a, b = max(m0, WINDOW[0]), min(m1, WINDOW[1])
                if b - a >= 5:
                    days.setdefault(day, []).append([a, b])
                cur = end
    return out


def plan(spans: dict, night: str, lights, jitter=JITTER) -> dict:
    """tonight's plan: {lamp: [[on, off], …]} — one real evening of each lamp (a different one each night), every start and end shifted by
    up to `jitter` minutes (the "Spielraum"); a lamp without history a plain evening, shifted the same way"""
    out = {}
    for e in lights:
        rng = random.Random(f"{night}|{e}")
        days = [v for _d, v in sorted((spans.get(e) or {}).items()) if v]
        if days:
            pick = rng.choice(days)
            out[e] = sorted([[max(WINDOW[0], a + rng.randint(-jitter, jitter)), min(WINDOW[1], b + rng.randint(-jitter, jitter))]
                             for a, b in pick if b > a])
            out[e] = [x for x in out[e] if x[1] - x[0] >= 5]
        else:
            out[e] = [[max(WINDOW[0], 390 + rng.randint(-jitter, jitter)), min(WINDOW[1], 630 + rng.randint(-jitter, jitter))]]
    return out


def _on(states, e):
    return (states.get(e) or {}).get("state") == "on"


def step(cfg, mem, states, armed, now, sun_elev=None):
    """one look: (mem, calls [(domain, service, entity)], status, lines); now: local datetime; sun_elev: the elevation of the sun (sun.sun)"""
    mem = clean_mem(mem)
    calls, lines = [], []
    night, m = evening(now)
    if not cfg["on"]:
        return clean_mem({"learned": mem["learned"]}), calls, {"on": False}, lines
    if mem["night"] != night or set(mem["plan"]) != set(cfg["lights"]) or mem.get("jitter") != cfg["jitter"]:
        mem.update(night=night, plan=plan(mem["learned"]["spans"], night, cfg["lights"], cfg["jitter"]), jitter=cfg["jitter"], ours=[e for e in mem["ours"] if _on(states, e)], left=[],
                   down=mem["down"] if mem["night"] == night else False, up=mem["up"] if mem["night"] == night else False,
                   downAt=mem["downAt"] if mem["night"] == night else None)
    if not armed:
        for e in mem["ours"]:                                         # somebody came home: only our own lamps go off
            if _on(states, e):
                calls.append(("light" if e.startswith("light.") else "switch", "turn_off", e))
                lines.append({"act": "off", "ent": e, "why": "home"})
        mem["ours"], mem["left"] = [], []
        return mem, calls, {"on": True, "armed": False, "plan": mem["plan"], "now": m,
                             "learned": {e: len((mem["learned"]["spans"].get(e) or {})) for e in cfg["lights"]}}, lines
    for e in cfg["lights"]:
        want = any(a <= m < b for a, b in mem["plan"].get(e) or [])
        if e in mem["left"] or (states.get(e) or {}).get("state") in (None, "unavailable", "unknown"):
            continue
        dom = "light" if e.startswith("light.") else "switch"
        if want and not _on(states, e) and e not in mem["ours"]:
            calls.append((dom, "turn_on", e))
            mem["ours"].append(e)
            lines.append({"act": "on", "ent": e})
        elif want and _on(states, e) and e not in mem["ours"] and not any(x[0] == "turn_on" and x[2] == e for x in calls):
            mem["left"].append(e)                                     # already on (someone, another rule): not ours tonight
        elif not want and e in mem["ours"]:
            if _on(states, e):
                calls.append((dom, "turn_off", e))
                lines.append({"act": "off", "ent": e})
            mem["ours"].remove(e)
        elif want and e in mem["ours"] and not _on(states, e) and (states.get(e) or {}).get("state") == "off":
            mem["ours"].remove(e)                                     # switched off by someone else: left alone tonight
            mem["left"].append(e)
    covers = [c for c in cfg["covers"] if shutter_ok(c, states.get(c))]
    if covers:
        rng = random.Random(f"{night}|covers")
        down_after, up_at = rng.randint(0, max(20, cfg["jitter"])), rng.randint(COVER_UP[0], COVER_UP[1] + max(0, cfg["jitter"] - 30)) + 720
        if not mem["down"] and sun_elev is not None and sun_elev < COVER_DOWN and WINDOW[0] - 60 <= m < 1080:
            if mem["downAt"] is None:
                mem["downAt"] = m + down_after
            if m >= mem["downAt"]:
                calls += [("cover", "close_cover", c) for c in covers]
                lines.append({"act": "down", "n": len(covers)})
                mem["down"] = True
        if not mem["up"] and up_at <= m < 1320:                         # the next morning (7:00 … 7:45, the same evening date until noon)
            calls += [("cover", "open_cover", c) for c in covers]
            lines.append({"act": "up", "n": len(covers)})
            mem["up"] = True
    status = {"on": True, "armed": True, "plan": mem["plan"], "now": m, "ours": list(mem["ours"]), "left": list(mem["left"]),
              "learned": {e: len((mem["learned"]["spans"].get(e) or {})) for e in cfg["lights"]}, "down": mem["down"], "up": mem["up"]}
    return mem, calls, status, lines


def needs_learning(mem, today: str) -> bool:
    """the history is read once a day"""
    return clean_mem(mem)["learned"]["day"] != today
