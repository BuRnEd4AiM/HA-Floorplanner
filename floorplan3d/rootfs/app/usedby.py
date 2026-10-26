"""Who uses a device (#546, the owner: "dass man sieht, wenn das Thermostat in irgendeiner Automatisierung benutzt wird und ob diese gerade
verwendet wird"; picture docs/ideen-4.28/1-wird-benutzt.jpg): the automations, scripts and scenes of Home Assistant that name it (its
search "related", the same as the tab "Related" of an entity there), each with whether it is on, runs right now, when it last ran and
what it does in a few words; the add-on's own heating rules and routines that use it; and every automation with the devices it uses
(page ▶ Abläufe, picture 2-ablaeufe.jpg).

What an automation does is given as data (summary), the page puts it into words in the user's language. Pure (unit test:
tests/test_usedby.py); server.py asks Home Assistant."""
import re

import flows as fl

ENTITY = re.compile(r"^[a-z_]{1,32}\.[a-z0-9_]{1,100}$")
MAX_ROWS = 30
MAX_PARTS = 4


def _list(v):
    return v if isinstance(v, list) else [v] if v is not None else []


def entities_in(cfg, out=None) -> list:
    """every entity an automation or script names (entity_id anywhere, a scene to turn on), each once, in order"""
    out = [] if out is None else out
    if isinstance(cfg, dict):
        for k, v in cfg.items():
            if k in ("entity_id", "entity", "scene") or (k == "action" and isinstance(v, str) and v.startswith(("scene.", "script."))):
                for e in _list(v):
                    if isinstance(e, str) and ENTITY.match(e) and e not in out:
                        out.append(e)
            elif k == "service" and isinstance(v, str) and v.startswith("script.") and ENTITY.match(v):
                if v not in out:
                    out.append(v)
            else:
                entities_in(v, out)
    elif isinstance(cfg, list):
        for x in cfg:
            entities_in(x, out)
    return out


def _ents(x):
    tgt = x.get("target") if isinstance(x.get("target"), dict) else {}
    data = x.get("data") if isinstance(x.get("data"), dict) else {}
    ents = [e for e in _list(x.get("entity_id")) + _list(tgt.get("entity_id")) + _list(data.get("entity_id")) if isinstance(e, str) and ENTITY.match(e)]
    return list(dict.fromkeys(ents))[:6]


def _time(v):
    return v[:5] if isinstance(v, str) and re.match(r"^\d{2}:\d{2}", v) else (v if isinstance(v, str) and ENTITY.match(v) else None)


def trigger_part(t) -> dict:
    """one trigger as data: {k: time | state | num | sun | start | pattern | zone | other, …}"""
    if not isinstance(t, dict):
        return {"k": "other"}
    p = t.get("platform") or t.get("trigger")
    if p == "time":
        ats = [x for x in (_time(a) for a in _list(t.get("at"))) if x]
        return {"k": "time", "at": ats[:3]}
    if p == "state":
        to = t.get("to")
        return {"k": "state", "ents": _ents(t), "to": to if isinstance(to, str) else None, "for": bool(t.get("for"))}
    if p == "numeric_state":
        out = {"k": "num", "ents": _ents(t)}
        for side in ("above", "below"):
            if isinstance(t.get(side), (int, float)) and not isinstance(t.get(side), bool):
                out[side] = t[side]
        return out
    if p == "sun":
        return {"k": "sun", "ev": t.get("event") if t.get("event") in ("sunset", "sunrise") else "sunset"}
    if p == "homeassistant":
        return {"k": "start"}
    if p == "time_pattern":
        return {"k": "pattern"}
    if p == "zone":
        return {"k": "zone", "ents": _ents(t), "ev": t.get("event") if t.get("event") in ("enter", "leave") else "enter"}
    if p == "device":
        return {"k": "device"}
    return {"k": "other", "p": p if isinstance(p, str) else ""}


def action_part(a) -> dict:
    """one step as data: {k: call | delay | scene | wait | logic | other, …}"""
    if not isinstance(a, dict):
        return {"k": "other"}
    svc = a.get("action") or a.get("service")
    if isinstance(svc, str) and "." in svc:
        if svc.startswith("scene.") or svc == "scene.turn_on":
            return {"k": "scene", "ents": _ents(a)}
        data = a.get("data") if isinstance(a.get("data"), dict) else {}
        out = {"k": "call", "svc": svc[:64], "ents": _ents(a)}
        for key in ("temperature", "hvac_mode", "brightness_pct", "position", "message"):
            v = data.get(key)
            if isinstance(v, (int, float, str)) and not isinstance(v, bool):
                out[key] = v if not isinstance(v, str) else v[:80]
        return out
    if "scene" in a:
        return {"k": "scene", "ents": [e for e in _list(a["scene"]) if isinstance(e, str)][:3]}
    if "delay" in a:
        return {"k": "delay"}
    if "wait_template" in a or "wait_for_trigger" in a:
        return {"k": "wait"}
    if any(k in a for k in ("choose", "if", "repeat", "parallel", "sequence")):
        return {"k": "logic"}
    if "condition" in a:
        return {"k": "check"}
    return {"k": "other"}


def summary(cfg) -> dict:
    """what an automation or script does: {when: [triggers], checks: number of conditions, do: [steps]}, each list short"""
    cfg = cfg if isinstance(cfg, dict) else {}
    trig = _list(cfg.get("triggers", cfg.get("trigger")))
    cond = _list(cfg.get("conditions", cfg.get("condition")))
    acts = _list(cfg.get("actions", cfg.get("action", cfg.get("sequence"))))
    return {"when": [trigger_part(t) for t in trig[:MAX_PARTS]], "more": max(0, len(trig) - MAX_PARTS) + max(0, len(acts) - MAX_PARTS),
            "checks": len(cond), "do": [action_part(a) for a in acts[:MAX_PARTS]]}


def _epoch(v):
    import datetime
    try:
        return int(datetime.datetime.fromisoformat(v.replace("Z", "+00:00")).timestamp()) if isinstance(v, str) else None
    except ValueError:
        return None


def row(e: str, st: dict | None, cfg=None) -> dict:
    """one automation, script or scene: {entity, kind, name, on, running, last, sum}"""
    st = st or {}
    a = st.get("attributes") or {}
    kind = e.split(".")[0]
    cur = a.get("current")
    return {"entity": e, "kind": kind, "name": str(a.get("friendly_name") or e)[:80], "on": st.get("state") == "on" if kind == "automation" else None,
            "running": (cur if isinstance(cur, int) and not isinstance(cur, bool) else 0) > 0 or (kind == "script" and st.get("state") == "on"),
            "last": _epoch(a.get("last_triggered")) if kind != "scene" else _epoch(st.get("state")) or _epoch(st.get("last_changed")),
            "gone": not st or st.get("state") in ("unavailable", "unknown") and kind == "automation",
            "sum": summary(cfg) if cfg is not None else None}


def related_ids(result) -> list:
    """the automations, scripts and scenes of Home Assistant's search "related" (search/related), automations first"""
    r = result if isinstance(result, dict) else {}
    out = []
    for k in ("automation", "script", "scene"):
        out += [e for e in _list(r.get(k)) if isinstance(e, str) and ENTITY.match(e) and e.startswith(k + ".")]
    return out[:MAX_ROWS]


def own_uses(entity: str, heat: dict, flows: list, rooms: list) -> list:
    """the add-on's own rules that use a device: [{kind: "heat", rule, room} | {kind: "flow", id, name, on}]"""
    out = []
    room_keys = [r["key"] for r in rooms if entity in r["climates"] or entity in r["windows"] or entity in r["outer"]]
    if entity.startswith("climate.") or any(entity in r["windows"] + r["outer"] for r in rooms):
        for key in room_keys:
            room = next(r for r in rooms if r["key"] == key)
            if not room["climates"]:
                continue
            for rule in ("window", "schedule", "night", "away", "summer", "holiday"):
                rc = heat.get(rule) or {}
                on = rc.get("on") or (rule == "holiday" and rc.get("guard"))
                if not on or (rule == "window" and key in rc.get("skip", [])) or (rule == "schedule" and key not in rc.get("rooms", {})):
                    continue
                if rule != "window" and not entity.startswith("climate."):
                    continue
                out.append({"kind": "heat", "rule": rule, "room": key})
    in_room = {r["key"] for r in rooms if entity in r["entities"] or entity in r["windows"] or entity in r["doors"]}
    for f in flows:
        used = False
        for lane in f["lanes"]:
            trig_room = set()
            trig = lane["blocks"][0]
            for b in lane["blocks"]:
                if entity in (b.get("ents") or []) or entity in (b.get("ent"), b.get("who")):
                    used = True
            dom = entity.split(".")[0]
            if any(b.get("same") and (fl.SAME.get(b["k"]) == dom or (b["k"] == "restore" and dom in fl.DOMAINS["restore"])) for b in lane["blocks"][1:]):
                for e in trig.get("ents") or [trig.get("ent")]:
                    trig_room |= {r["key"] for r in rooms if e in r["entities"] or e in r["windows"] or e in r["doors"]}
                if trig_room & in_room:
                    used = True
        if used:
            out.append({"kind": "flow", "id": f["id"], "name": f["name"], "on": f["on"]})
    return out
