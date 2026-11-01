"""Own routines "Wenn … dann …" as real automations of Home Assistant (#548, the owner: "der Editor soll in unserer App sein … aber es
soll dann auch eine echte Home Assistant Automatisierung … daraus werden … Aber nicht, dass wir dann irgendwas kaputt machen").

Every lane of a routine with ha: true becomes one automation: id fp3d_<routine>_<lane>, mode restart (a new trigger starts the lane
again, as in flows.py), the conditions and waits as steps in the order of the chain. The routine itself stays in rules.json (the editor
opens it from there; an automation cannot be read back for sure); server.py writes the automations through Home Assistant's own editor
API and only ever touches ids that start with fp3d_ (ours). "Wie vorher": before a lane first changes a device it is kept with
scene.create (one scene fp3d_<routine>_<device> per device, only if there is none yet), "wie vorher" plays it back and deletes it.
"Im selben Raum" is looked up when saving: which trigger device is in which room of the plan.

"Nur wenn: besonderer Tag" (📅, specialdays.py) becomes one template condition with the dates of the next ten years; it is written anew
when the routine or the list of days is saved.

Pure (unit test: tests/test_haflows.py): compile_flow (one routine -> its automations and what cannot be done), sync_plan (what to write
and what to delete), sig (to see whether somebody changed an automation in Home Assistant)."""
import datetime
import hashlib
import json
import re

import flows as fl
import roommap as rm
import specialdays as sd

PREFIX = "fp3d_"
OURS = re.compile(r"^fp3d_[a-z0-9_]{1,80}$")
GONE = ["unavailable", "unknown"]
OPEN, CLOSED = ["on", "open", "opening"], ["off", "closed"]
DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
HEATING = "['heat', 'auto', 'heat_cool']"
WHO = "trigger.entity_id | default('')"                    # the device that set the lane off ('' for a time, the sun, a button)
NOTE = {"de": "Erstellt mit 3D Floorplan aus dem Ablauf „{name}“. Bitte im Dashboard unter ▶ Abläufe ändern; wurde sie hier geändert, "
              "fragt das Dashboard vor dem Überschreiben nach.",
        "en": "Made by 3D Floorplan from the routine \"{name}\". Please change it in the dashboard (▶ Routines); if it was changed here, "
              "the dashboard asks before it overwrites it."}


def auto_id(fid: str, lid: str) -> str:
    """the id of a lane's automation (f_abc, l1 -> fp3d_abc_l1)"""
    return f"{PREFIX}{fid[2:]}_{lid}"


def ours(cid) -> bool:
    """an automation (or scene) the add-on made and may change or delete; every other one it leaves alone"""
    return isinstance(cid, str) and bool(OURS.match(cid))


def sig(cfg) -> str:
    """a short fingerprint of an automation (its id left out)"""
    body = {k: v for k, v in cfg.items() if k != "id"} if isinstance(cfg, dict) else cfg
    return hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()[:16]


def context(rooms: list, states: dict, *, weather=None, notify=None, lang: str = "de", days=None, year=None) -> dict:
    """what compile_flow needs to know of the house: the rooms of the plan (roommap.rooms_of), the persons, the weather entity, where
    messages go ({services, entities} of Home Assistant's notify; None: the add-on sends them itself, see fp3d_notify), the language
    of the description, the special days (specialdays.clean_days) and the year their dates start with (now)"""
    return {"rooms": rooms, "idx": rm.room_index(rooms), "room_names": {r["key"]: r["name"] for r in rooms},
            "persons": sorted(e for e in states if e.startswith("person.")), "weather": weather, "notify": notify,
            "lang": lang if lang in NOTE else "en", "days": days or [], "year": year or datetime.date.today().year}


# ---------- small pieces ----------
def _dur(s: int) -> dict:
    return {"hours": s // 3600, "minutes": s % 3600 // 60, "seconds": s % 60}


def _offset(minutes: int) -> str:
    m = abs(minutes)
    return f"{'-' if minutes < 0 else '+'}{m // 60:02d}:{m % 60:02d}:00"


def _js(v) -> str:
    """a value written into a template (a dict or list of entities is valid Jinja as JSON)"""
    return json.dumps(v, ensure_ascii=False)


def _tpl(cond: str) -> dict:
    return {"condition": "template", "value_template": "{{ " + cond + " }}"}


def _plain(text: str) -> str:
    """text a user typed, without anything Home Assistant would read as a template"""
    return re.sub(r"[{}]", "", text)


def _trig_ents(trig: dict, ctx) -> list:
    k = trig["k"]
    if k == "state":
        return trig["ents"]
    if k == "num":
        return [trig["ent"]]
    if k == "presence" and trig["ev"] in ("arrive", "leave"):
        return [trig["who"]] if trig["who"] else ctx["persons"]
    return []


def _same(block: dict, trig_ents: list, ctx) -> dict:
    """"im selben Raum": trigger device -> the devices of its room this block changes"""
    doms = fl.DOMAINS["restore"] if block["k"] == "restore" else (fl.SAME[block["k"]],)
    out = {}
    for e in trig_ents:
        room = ctx["idx"].get(e)
        ents = [x for d in doms for x in rm.in_room(ctx["rooms"], room, d)] if room else []
        if ents:
            out[e] = ents
    return out


# ---------- the trigger ----------
def _trigger(trig: dict, ctx, problems: list, lane: str):
    """(Home Assistant's triggers, steps that go first: the days of a time)"""
    k = trig["k"]
    if k == "state":
        t = {"trigger": "state", "entity_id": trig["ents"]}
        to = trig["to"]
        if to == "open":
            t.update(to=OPEN, not_from=OPEN + GONE)
        elif to == "closed":
            t.update(to=CLOSED, not_from=CLOSED + GONE)
        elif to in ("on", "off"):
            t.update(to=to, not_from=GONE)
        else:
            t.update(not_from=GONE, not_to=GONE)
        return [t], []
    if k == "num":
        return [{"trigger": "numeric_state", "entity_id": trig["ent"], ("above" if trig["op"] == "above" else "below"): trig["v"]}], []
    if k == "time":
        pre = [{"condition": "time", "weekday": [DAYS[d] for d in trig["days"]]}] if trig["days"] else []
        return [{"trigger": "time", "at": f"{trig['at']}:00"}], pre
    if k == "sun":
        t = {"trigger": "sun", "event": "sunset" if trig["ev"] == "set" else "sunrise"}
        if trig["off"]:
            t["offset"] = _offset(trig["off"])
        return [t], []
    if k == "presence":
        ev = trig["ev"]
        if ev == "all_away":
            return [{"trigger": "numeric_state", "entity_id": "zone.home", "below": 1}], []
        if ev == "first_home":
            return [{"trigger": "numeric_state", "entity_id": "zone.home", "above": 0}], []
        who = _trig_ents(trig, ctx)
        if not who:
            problems.append({"lane": lane, "block": 0, "why": "persons"})
            return [], []
        if ev == "arrive":
            return [{"trigger": "state", "entity_id": who, "to": "home", "not_from": GONE}], []
        return [{"trigger": "state", "entity_id": who, "from": "home", "not_to": GONE}], []
    return [], []                                       # a button on the page: no trigger, the page calls automation.trigger


def _holds(trig: dict) -> str | None:
    """a template: is what set the lane off still so ("bleibt so"); None when there is nothing to break"""
    k = trig["k"]
    if k == "state":
        to = trig["to"]
        if to in ("open", "closed"):
            return f"states({WHO}) in {_js(OPEN if to == 'open' else CLOSED)}"
        if to in ("on", "off"):
            return f"is_state({WHO}, '{to}')"
        return f"states({WHO}) == trigger.to_state.state"
    if k == "num":
        return f"states('{trig['ent']}') | float(0) {'>' if trig['op'] == 'above' else '<'} {trig['v']}"
    if k == "presence":
        ev = trig["ev"]
        if ev == "all_away":
            return "states('zone.home') | int(0) == 0"
        if ev == "first_home":
            return "states('zone.home') | int(0) > 0"
        return f"{'' if ev == 'arrive' else 'not '}is_state({WHO}, 'home')"
    return None


# ---------- conditions ----------
def _cond(b: dict, ctx, problems: list, lane: str, i: int) -> list:
    k = b["k"]
    if k == "if_time":
        return [{"condition": "time", "after": f"{b['from']}:00", "before": f"{b['to']}:00"}]
    if k == "if_days":
        return [{"condition": "time", "weekday": [DAYS[d] for d in b["days"]]}] if b["days"] else []
    if k == "if_home":
        if b["who"] == "nobody":
            return [{"condition": "numeric_state", "entity_id": "zone.home", "below": 1}]
        if not b["who"]:
            return [{"condition": "numeric_state", "entity_id": "zone.home", "above": 0}]
        return [{"condition": "state", "entity_id": b["who"], "state": "home"}]
    if k == "if_state":
        want = OPEN if b["is"] == "open" else CLOSED if b["is"] == "closed" else b["is"]
        return [{"condition": "state", "entity_id": b["ent"], "state": want}]
    if k == "if_num":
        return [{"condition": "numeric_state", "entity_id": b["ent"], ("above" if b["op"] == "above" else "below"): b["v"]}]
    if k == "if_outside":
        if not ctx["weather"]:
            problems.append({"lane": lane, "block": i, "why": "weather"})
            return []
        return [{"condition": "numeric_state", "entity_id": ctx["weather"], "attribute": "temperature",
                 ("above" if b["op"] == "above" else "below"): b["v"]}]
    if k == "if_sun":
        return [{"condition": "state", "entity_id": "sun.sun", "state": "below_horizon" if b["is"] == "dark" else "above_horizon"}]
    if k == "if_special":                                # 📅 the dates of the next ten years written out (specialdays.ha_template)
        hit = sd.ha_template(ctx.get("days") or [], b["days"], ctx.get("year") or datetime.date.today().year)
        return [_tpl(f"({hit})" if b["is"] == "yes" else f"not ({hit})")]
    return []


# ---------- actions ----------
def _call(service: str, target, data=None) -> dict:
    out = {"action": service, "target": {"entity_id": target}}
    if data:
        out["data"] = data
    out["continue_on_error"] = True                    # a device that is gone does not stop the rest (flows.py skips it)
    return out


def _each(target, steps: list) -> dict:
    return {"repeat": {"for_each": target, "sequence": steps}}


def _scene(base: str) -> str:
    return f"'scene.{base}' ~ (repeat.item | replace('.', '_'))"


def _keep(base: str, target) -> dict:
    """remember the devices as they are now, each once (for "wie vorher")"""
    return _each(target, [{"if": [_tpl(f"expand({_scene(base)}) | count == 0")],
                           "then": [{"action": "scene.create", "data": {"scene_id": base + "{{ repeat.item | replace('.', '_') }}",
                                                                         "snapshot_entities": "{{ repeat.item }}"}, "continue_on_error": True}]}])


def _back(base: str, target) -> dict:
    """put the devices back as they were remembered and forget it"""
    scene = "scene." + base + "{{ repeat.item | replace('.', '_') }}"
    return _each(target, [{"if": [_tpl(f"expand({_scene(base)}) | count > 0")],
                           "then": [{"action": "scene.turn_on", "target": {"entity_id": scene}, "continue_on_error": True},
                                    {"action": "scene.delete", "target": {"entity_id": scene}, "continue_on_error": True}]}])


def _switch(b: dict, target, static: list | None) -> list:
    svc = {"on": "turn_on", "off": "turn_off", "toggle": "toggle"}[b["do"]]
    data = {"brightness_pct": b["pct"]} if "pct" in b and svc == "turn_on" else None
    if static is None:                                  # "im selben Raum": the lights of the room
        return [_call(f"light.{svc}", target, data)]
    lights = [e for e in static if e.startswith("light.")] if data else []
    rest = [e for e in static if e not in lights]
    out = [_call("light.turn_on", lights, data)] if lights else []
    if rest:
        doms = {e.split(".")[0] for e in rest}
        out.append(_call(f"{doms.pop()}.{svc}" if len(doms) == 1 else f"homeassistant.{svc}", rest))
    return out


def _heat(b: dict, target) -> list:
    if b["do"] == "off":
        return [_call("climate.set_hvac_mode", target, {"hvac_mode": "off"})]
    modes = "(state_attr(repeat.item, 'hvac_modes') or ['heat'])"
    steps = [{"if": [_tpl(f"states(repeat.item) not in {HEATING}")],
              "then": [_call("climate.set_hvac_mode", "{{ repeat.item }}", {"hvac_mode": "{{ 'heat' if 'heat' in " + modes + " else " + modes + "[0] }}"})]}]
    if b["do"] == "temp":
        steps.append(_call("climate.set_temperature", "{{ repeat.item }}", {"temperature": b["v"]}))
    return [_each(target, steps)]


def _cover(b: dict, target) -> list:
    if b["do"] == "pos":
        return [_call("cover.set_cover_position", target, {"position": b["v"]})]
    return [_call("cover.open_cover" if b["do"] == "open" else "cover.close_cover", target)]


def _message(text: str, ctx) -> str:
    """{name}, {room}, {state} as templates of the trigger; anything else as typed"""
    rooms = {e: ctx["room_names"].get(key, "") for e, key in ctx["idx"].items() if ctx["room_names"].get(key)}
    parts = {"{name}": "{{ trigger.to_state.name if trigger.to_state is defined and trigger.to_state else '' }}",
             "{room}": "{{ " + _js(rooms) + ".get(" + WHO + ", '') }}",
             "{state}": "{{ trigger.to_state.state if trigger.to_state is defined and trigger.to_state else '' }}"}
    return "".join(parts.get(p, _plain(p)) for p in re.split(r"(\{name\}|\{room\}|\{state\})", text))


def _notify(b: dict, ctx) -> list:
    msg, to = _message(b["text"], ctx), ctx["notify"]
    if not to or not (to.get("services") or to.get("entities")):
        return [{"event": "fp3d_notify", "event_data": {"message": msg}}]          # the add-on sends it its own way (WhatsApp, Telegram)
    data = {"title": "3D Floorplan", "message": msg}
    out = [{"action": f"notify.{s}", "data": data, "continue_on_error": True} for s in to.get("services") or []]
    if to.get("entities"):
        out.append(_call("notify.send_message", to["entities"], data))
    return out


def _changes(flow: dict, ctx) -> list:
    """every device a routine may change (what "wie vorher" without devices puts back)"""
    out = []
    for lane in flow["lanes"]:
        ents = _trig_ents(lane["blocks"][0], ctx)
        for b in lane["blocks"]:
            if b["k"] in ("switch", "heat", "cover"):
                found = [x for v in _same(b, ents, ctx).values() for x in v] if b.get("same") else b["ents"]
                out += [e for e in found if e not in out]
    return out


def _lane(flow: dict, lane: dict, n: int, ctx, problems: list) -> dict:
    fid, blocks, trig = flow["id"], lane["blocks"], lane["blocks"][0]
    base, ents = f"{PREFIX}{fid[2:]}_", _trig_ents(trig, ctx)
    keeps = any(b["k"] == "restore" for x in flow["lanes"] for b in x["blocks"])
    triggers, steps = _trigger(trig, ctx, problems, lane["id"])
    start = 1
    if len(blocks) > 1 and blocks[1]["k"] == "hold" and trig["k"] in ("state", "num") and triggers:
        triggers[0]["for"] = _dur(blocks[1]["s"])       # "bleibt so" right after the trigger: Home Assistant's own "for"
        start = 2
    for i in range(start, len(blocks)):
        b, k = blocks[i], blocks[i]["k"]
        if k in fl.CONDS:
            steps += _cond(b, ctx, problems, lane["id"], i)
        elif k == "wait":
            steps.append({"delay": _dur(b["s"])})
        elif k == "hold":
            held = _holds(trig)
            if held is None:
                steps.append({"delay": _dur(b["s"])})
            else:
                steps += [{"wait_template": "{{ not (" + held + ") }}", "timeout": _dur(b["s"]), "continue_on_timeout": True},
                          _tpl("not wait.completed")]
        elif k in ("switch", "heat", "cover", "restore"):
            static = None
            if b.get("same"):
                found = _same(b, ents, ctx)
                if not found:
                    problems.append({"lane": lane["id"], "block": i, "why": "room", "soft": True})
                    continue
                var = f"room_{i}"
                steps.append({"variables": {var: "{{ " + _js(found) + ".get(" + WHO + ", []) }}"}})
                target = "{{ " + var + " }}"
            elif k == "restore" and not b["ents"]:
                static = _changes(flow, ctx)
                target = static
            else:
                static = b["ents"]
                target = static
            if k == "restore":
                if target:
                    steps.append(_back(base, target))
                continue
            group = []
            if keeps:
                group.append(_keep(base, target))
            group += _switch(b, target, static) if k == "switch" else _heat(b, target) if k == "heat" else _cover(b, target)
            if static is None:                          # the room has nothing of this: skip quietly
                steps.append({"if": [_tpl(f"room_{i} | count > 0")], "then": group})
            else:
                steps += group
        elif k == "run":
            steps.append({"action": f"{b['ent'].split('.')[0]}.turn_on", "target": {"entity_id": b["ent"]}, "continue_on_error": True})
        elif k == "notify":
            steps += _notify(b, ctx)
    alias = flow["name"] if len(flow["lanes"]) == 1 else f"{flow['name']} · {n + 1}"
    return {"id": auto_id(fid, lane["id"]), "alias": alias, "description": NOTE[ctx["lang"]].format(name=flow["name"]),
            "mode": "restart", "triggers": triggers, "conditions": [], "actions": steps}


def compile_flow(flow: dict, ctx) -> dict:
    """one routine (as flows.clean_flows keeps it) -> {autos: [automation config], problems: [{lane, block, why, soft?}], ok}; ok is
    False when a lane cannot be done in Home Assistant (no weather for "draußen", no person for "jemand kommt"): nothing of it is
    written then. A soft problem ("im selben Raum" found nothing) only leaves that block out."""
    problems = []
    autos = [_lane(flow, lane, n, ctx, problems) for n, lane in enumerate(flow["lanes"])]
    return {"autos": autos, "problems": problems, "ok": not any(not p.get("soft") for p in problems)}


def sync_plan(desired: dict, record: dict) -> dict:
    """desired {id: config} (all routines with ha: true), record {id: {flow, sent, seen}} (what the add-on wrote last): {write: [ids]
    new or changed since they were last sent, delete: [ids] the add-on wrote and that are no longer wanted}"""
    write = [cid for cid, cfg in desired.items() if ours(cid) and (record.get(cid) or {}).get("sent") != sig(cfg)]
    delete = [cid for cid in record if ours(cid) and cid not in desired]
    return {"write": sorted(write), "delete": sorted(delete)}
