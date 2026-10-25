"""🧺 Haushalt (#490): the washing machine, the dryer and the dishwasher found among Home Assistant's entities (by their names, or as an
admin chose them in ⚙), what each does now (its own integration's state, remaining time and progress; without one a power sensor and its
history: running since, done since), and the shopping list (todo.*). Pure functions (unit test: tests/test_household.py); server.py asks
Home Assistant and keeps everybody's "✓ Ausgeräumt"."""
import math
import re
from datetime import datetime, timezone

KINDS = ("washer", "dryer", "dishwasher")
ROLES = ("status", "running", "power", "finish", "remaining", "progress", "program")
ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]{1,200}$")
TODO_ID = re.compile(r"^todo\.[a-z0-9_]{1,200}$")
# looked for in the entity id and the name; the dishwasher first ("dishwasher" holds "washer"), then the dryer ("Waschtrockner" dries)
WORDS = (
    ("dishwasher", ("dishwasher", "spülmaschine", "spuelmaschine", "spulmaschine", "geschirrspüler", "geschirrspueler", "geschirrspuler",
                    "lave_vaisselle", "lave-vaisselle", "lavastoviglie", "vaatwasser", "lavavajillas", "zmywarka")),
    ("dryer", ("dryer", "trockner", "tumble", "seche_linge", "sèche-linge", "asciugatrice", "droger", "secadora", "suszarka")),
    ("washer", ("washer", "washing", "waschmaschine", "lave_linge", "lave-linge", "lavatrice", "wasmachine", "lavadora", "pralka")),
)
FINISH = ("finish", "end", "fertig", "ende", "completion", "done")
REMAIN = ("remaining", "rest", "verbleib", "left", "remain")
PROGRESS = ("progress", "fortschritt")
PROGRAM = ("program", "programm", "programme")
STATUS = ("operation", "status", "state", "zustand", "betrieb", "phase", "machine")
RUN = ("running", "run", "läuft", "laeuft", "betrieb", "active", "aktiv", "in_use")
NOT_RUN = ("door", "opening", "window", "problem", "connectivity", "lock", "safety", "moisture", "battery", "plug")
# the states of the integrations (Home Connect, Miele, SmartThings, LG ThinQ ...), with spaces and dashes as "_"
RUNNING = {"run", "running", "in_use", "inuse", "washing", "drying", "rinsing", "rinse", "spinning", "spin", "wash", "dry", "main_wash",
           "pre_wash", "prewash", "steam", "cooling", "heating", "in_progress", "active", "on", "läuft", "laeuft", "programm_läuft",
           "cleaning", "wäscht", "trocknet", "spült"}
WAITING = {"delayed_start", "delayedstart", "waiting_to_start", "programmed", "pause", "paused", "action_required", "actionrequired",
           "reserved", "pausiert", "startzeitvorwahl"}
DONE = {"finished", "finish", "end", "ended", "done", "complete", "completed", "program_ended", "programended", "fertig", "beendet",
        "anti_crease", "anticrease", "knitterschutz"}
OFF = {"off", "idle", "ready", "inactive", "standby", "power_off", "initial", "stop", "stopped", "aus", "bereit", "unknown", "none"}
ERROR = {"error", "failure", "fault", "fehler", "aborting", "abgebrochen"}
GONE = {"unavailable"}
RUN_W = 5.0                  # watts: above this the machine runs (standby of a smart plug and a machine is below)
MIN_RUN = 10 * 60            # a run lasts at least this long (a short pump-out or a door light is none)
QUIET = 5 * 60               # a pause in the program (soaking, the dishwasher drying) shorter than this does not end a run
DONE_HOURS = 12              # "fertig" is shown this long after a run ended, unless somebody said "✓ Ausgeräumt"
MAX_TEXT = 40
MAX_ITEMS = 100
MAX_ITEM = 200
CONTROL = re.compile(r"[\x00-\x1f\x7f]")


def _num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def _ts(v):
    """an ISO time of Home Assistant -> seconds, None for anything else"""
    if not isinstance(v, str) or not v:
        return None
    try:
        d = datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        return None
    return (d if d.tzinfo else d.replace(tzinfo=timezone.utc)).timestamp()


def _iso(t):
    return datetime.fromtimestamp(t, timezone.utc).isoformat().replace("+00:00", "Z") if t is not None else None


def _norm(s) -> str:
    return re.sub(r"[\s-]+", "_", str(s).strip().lower()) if isinstance(s, str) else ""


def _text(st) -> str:
    a = st.get("attributes") or {}
    return f"{st.get('entity_id', '')} {a.get('friendly_name') or ''}".lower()


def kind_of(text: str):
    """the kind of machine an entity belongs to by its id and name, None for none"""
    for kind, words in WORDS:
        if any(w in text for w in words):
            return kind
    return None


def role_of(st):
    """what an entity of a machine tells: status, running (on / off), power, finish (a time), remaining (a duration), progress (%),
    program; None for anything else (its energy, its door, its switch ...)"""
    eid = st.get("entity_id", "")
    domain, a, text = eid.split(".")[0], st.get("attributes") or {}, _text(st)
    dc, unit = a.get("device_class"), a.get("unit_of_measurement")
    has = lambda words: any(w in text for w in words)            # noqa: E731
    if domain == "sensor":
        if dc == "power" or unit in ("W", "kW"):
            return "power"
        if dc == "energy" or unit in ("kWh", "Wh", "MWh"):
            return None
        if dc == "timestamp":                                       # Home Connect's "remaining program time" is the time it ends
            return "finish" if has(FINISH) or has(REMAIN) else None
        if dc == "duration" or unit in ("min", "h", "s"):
            return "remaining" if has(REMAIN) else None
        if unit == "%":
            return "progress" if has(PROGRESS) else None
        if has(PROGRAM):
            return "program"
        if dc == "enum" or has(STATUS):
            return "status"
        return None
    if domain == "binary_sensor" and dc not in NOT_RUN and not has(NOT_RUN) and (dc == "running" or has(RUN)):
        return "running"
    return None


def clean_chosen(val) -> dict:
    """what an admin chose in ⚙ (settings.appliances): {kind: {"power": entity, "status": entity}}, only known kinds, entities each a
    sensor / binary_sensor; empty ones left out"""
    out = {}
    for kind in KINDS:
        v = val.get(kind) if isinstance(val, dict) else None
        if not isinstance(v, dict):
            continue
        e = {r: v[r] for r in ("power", "status") if isinstance(v.get(r), str) and ENTITY.match(v[r]) and v[r].split(".")[0] in ("sensor", "binary_sensor")}
        if e:
            out[kind] = e
    return out


def find_appliances(states, chosen=None) -> dict:
    """{kind: {role: entity}} of the machines found by their names; what an admin chose wins (a chosen status of a binary_sensor counts as
    "running"). Kinds with nothing that tells whether they run are left out."""
    found = {}
    for st in states if isinstance(states, list) else []:
        if not isinstance(st, dict) or not ENTITY.match(str(st.get("entity_id", ""))):
            continue
        kind = kind_of(_text(st))
        role = role_of(st) if kind else None
        if role and role not in found.setdefault(kind, {}):
            found[kind][role] = st["entity_id"]
    for kind, c in clean_chosen(chosen).items():
        roles = found.setdefault(kind, {})
        if c.get("power"):
            roles["power"] = c["power"]
        if c.get("status"):
            roles.pop("status", None); roles.pop("running", None)
            roles["running" if c["status"].startswith("binary_sensor.") else "status"] = c["status"]
    return {k: found[k] for k in KINDS if k in found and any(r in found[k] for r in ("status", "running", "power", "finish", "remaining"))}


def history_points(data) -> dict:
    """Home Assistant's /api/history/period answer for several entities (minimal_response: only the first row of each has the entity)
    -> {entity: [(seconds, number or None)]}, oldest first"""
    out = {}
    for series in data if isinstance(data, list) else []:
        if not isinstance(series, list) or not series or not isinstance(series[0], dict):
            continue
        eid = series[0].get("entity_id")
        if not isinstance(eid, str):
            continue
        rows = []
        for r in series:
            t = _ts(r.get("last_changed") or r.get("last_updated")) if isinstance(r, dict) else None
            if t is not None:
                rows.append((t, _num(r.get("state"))))
        out[eid] = sorted(rows)
    return out


def last_run(points, now: float, run_w=RUN_W, min_run=MIN_RUN, quiet=QUIET):
    """The last run in the power readings [(seconds, watts)] (each holds until the next one): {"running", "start", "end"} (end: when the
    power went down, None while it runs); pauses shorter than `quiet` belong to the run, runs shorter than `min_run` are none (unless the
    power is up right now). None when there was no run."""
    on = []
    for i, (t, w) in enumerate(points):
        nxt = points[i + 1][0] if i + 1 < len(points) else now
        if w is not None and w > run_w:
            if on and t - on[-1][1] <= quiet:
                on[-1][1] = nxt
            else:
                on.append([t, nxt])
    up = bool(points) and points[-1][1] is not None and points[-1][1] > run_w
    runs = [r for r in on if r[1] - r[0] >= min_run or (up and r is on[-1])]
    if not runs:
        return None
    start, end = runs[-1]
    if up or now - end < quiet:
        return {"running": True, "start": start, "end": None}
    return {"running": False, "start": start, "end": end}


def status_phase(state):
    """what a machine's own state means: running | waiting | done | off | error | gone, None for a state not known"""
    s = _norm(state)
    for phase, words in (("running", RUNNING), ("waiting", WAITING), ("done", DONE), ("error", ERROR), ("gone", GONE), ("off", OFF)):
        if s in words:
            return phase
    return None


def _state_text(st):
    s = st.get("state") if st else None
    return s[:MAX_TEXT] if isinstance(s, str) and s and s not in ("unknown", "unavailable") else None


def appliance(kind: str, roles: dict, by_id: dict, history: dict, ack, now: float) -> dict:
    """What a machine does now, for its card: {"kind", "phase" (running | waiting | done | off | error | gone | unknown), "since"
    (running: started, done / off: ended; ISO), "endsAt" (running: the end its integration expects), "progress" (%), "program",
    "state" (its own state as Home Assistant says it), "power" (W now)}"""
    st = lambda role: by_id.get(roles.get(role)) if roles.get(role) else None      # noqa: E731
    status, running, power = st("status"), st("running"), st("power")
    ack = _num(ack)
    phase, since = None, None
    if status:
        phase = status_phase(status.get("state"))
        since = _ts(status.get("last_changed"))
    if phase in (None, "gone") and running and running.get("state") in ("on", "off"):
        since = _ts(running.get("last_changed"))
        phase = "running" if running["state"] == "on" else "done" if since and now - since < DONE_HOURS * 3600 else "off"
    watts = _num(power.get("state")) if power else None
    run = last_run(history.get(roles.get("power"), []), now) if power else None
    if power and phase in (None, "off", "gone"):
        if run and run["running"]:
            phase, since = "running", run["start"]
        elif run and now - run["end"] < DONE_HOURS * 3600 and phase != "off":
            phase, since = "done", run["end"]
        elif watts is not None:
            phase, since = ("running", None) if watts > RUN_W else ("off", run["end"] if run else None)
    elif phase == "running" and run and run["running"]:
        since = run["start"]                                       # the power knows when it started, the state only its last change
    if phase == "done" and ack is not None and since is not None and ack >= since - 1:
        phase = "off"                                              # somebody emptied it: "zuletzt fertig um …"
    ends = None
    if phase in ("running", "waiting"):
        fin, rem = st("finish"), st("remaining")
        ends = _ts(fin.get("state")) if fin else None
        if ends is None and rem:
            v, unit = _num(rem.get("state")), (rem.get("attributes") or {}).get("unit_of_measurement")
            if v is not None and v >= 0:
                ends = now + v * {"h": 3600, "s": 1}.get(unit, 60)
    prog = _num(st("progress").get("state")) if st("progress") else None
    return {"kind": kind, "phase": phase or "unknown", "since": _iso(since), "endsAt": _iso(ends) if ends and ends > now else None,
            "progress": round(prog) if phase == "running" and prog is not None and 0 <= prog <= 100 else None,
            "program": _state_text(st("program")), "state": _state_text(status) if status else None,
            "power": round(watts) if watts is not None else None}


def clean_acks(val) -> dict:
    """{kind: seconds} of the last "✓ Ausgeräumt" per machine"""
    return {k: float(val[k]) for k in KINDS if isinstance(val, dict) and _num(val.get(k)) is not None and val[k] > 0}


# ---------- "🔔 Sag mir Bescheid" (#531): a message when a machine is done ----------
TELL_KEEP = 24 * 3600        # a wish to be told that never came true is forgotten after a day
TELL_RECENT = 15 * 60        # "always tell": only a run that ended in the last 15 minutes (not an old one after a restart)
TELL_TEXT = {
    "de": {"washer": "🧺 Die Waschmaschine ist fertig.", "dryer": "🧺 Der Trockner ist fertig.", "dishwasher": "🧺 Die Spülmaschine ist fertig."},
    "en": {"washer": "🧺 The washing machine is done.", "dryer": "🧺 The dryer is done.", "dishwasher": "🧺 The dishwasher is done."},
    "fr": {"washer": "🧺 Le lave-linge a terminé.", "dryer": "🧺 Le sèche-linge a terminé.", "dishwasher": "🧺 Le lave-vaisselle a terminé."},
    "es": {"washer": "🧺 La lavadora ha terminado.", "dryer": "🧺 La secadora ha terminado.", "dishwasher": "🧺 El lavavajillas ha terminado."},
    "it": {"washer": "🧺 La lavatrice ha finito.", "dryer": "🧺 L'asciugatrice ha finito.", "dishwasher": "🧺 La lavastoviglie ha finito."},
    "nl": {"washer": "🧺 De wasmachine is klaar.", "dryer": "🧺 De droger is klaar.", "dishwasher": "🧺 De vaatwasser is klaar."},
    "pl": {"washer": "🧺 Pralka skończyła.", "dryer": "🧺 Suszarka skończyła.", "dishwasher": "🧺 Zmywarka skończyła."},
}


def tell_text(kind: str, lang: str) -> str:
    """the message for a machine that is done, in Home Assistant's language (English for one not known)"""
    return TELL_TEXT.get(str(lang or "")[:2].lower(), TELL_TEXT["en"]).get(kind, "")


def clean_tell(val, now: float) -> dict:
    """{kind: {"at": seconds, "by": user}}: who wants to be told when that machine is done; older than a day: forgotten"""
    out = {}
    for k in KINDS:
        v = val.get(k) if isinstance(val, dict) else None
        at = _num(v.get("at")) if isinstance(v, dict) else None
        if at is not None and 0 < at and now - at < TELL_KEEP:
            out[k] = {"at": at, "by": str(v.get("by") or "")[:80]}
    return out


def clean_told(val) -> dict:
    """{kind: seconds}: the end of the last run a message was sent for (never twice for the same run)"""
    return {k: float(val[k]) for k in KINDS if isinstance(val, dict) and _num(val.get(k)) is not None and val[k] > 0}


def due_tells(apps, tell: dict, told: dict, always: bool, now: float):
    """Which machines to tell about now: ([kind], tell left, told). A machine is done (phase "done", ended at `since`) and was not told
    about for that run; it was asked for (the run ended after the wish, give or take a minute) or "always tell" is on and the run ended in
    the last TELL_RECENT seconds. apps: appliance() of each machine."""
    tell, told, out = dict(tell), dict(told), []
    for a in apps if isinstance(apps, list) else []:
        kind = a.get("kind") if isinstance(a, dict) else None
        since = _ts(a.get("since")) if kind in KINDS else None
        if a.get("phase") != "done" or since is None or since <= told.get(kind, 0) + 1:
            continue
        wished = kind in tell and since >= tell[kind]["at"] - 60
        if wished or (always and now - since <= TELL_RECENT):
            out.append(kind)
            told[kind] = since
            tell.pop(kind, None)
    return out, tell, told


# ---------- the shopping list: todo.* of Home Assistant ----------
SHOP = ("einkauf", "shopping", "grocer", "courses", "spesa", "boodschap", "compra", "zakupy")


def todo_lists(states) -> list:
    """the to-do lists of Home Assistant [{"entity", "name"}], a shopping list first"""
    out = []
    for st in states if isinstance(states, list) else []:
        eid = st.get("entity_id") if isinstance(st, dict) else None
        if isinstance(eid, str) and TODO_ID.match(eid) and st.get("state") != "unavailable":
            out.append({"entity": eid, "name": str((st.get("attributes") or {}).get("friendly_name") or eid)[:60]})
    shop = lambda x: any(w in f"{x['entity']} {x['name']}".lower() for w in SHOP)      # noqa: E731
    return sorted(out, key=lambda x: (not shop(x), x["name"].lower()))


def pick_list(lists: list, wanted, chosen) -> str:
    """the list to show: the one asked for, else the one chosen in ⚙, else the first (a shopping list); '' without any"""
    ids = [x["entity"] for x in lists]
    for e in (wanted, chosen):
        if isinstance(e, str) and e in ids:
            return e
    return ids[0] if ids else ""


def slim_items(result) -> list:
    """the answer of todo/item/list -> [{"uid", "summary", "done"}], open ones first, at most MAX_ITEMS"""
    items = (result or {}).get("items") if isinstance(result, dict) else None
    out = []
    for it in items if isinstance(items, list) else []:
        if isinstance(it, dict) and isinstance(it.get("uid"), str) and isinstance(it.get("summary"), str) and it["summary"].strip():
            out.append({"uid": it["uid"][:100], "summary": it["summary"].strip()[:MAX_ITEM], "done": it.get("status") == "completed"})
    return sorted(out, key=lambda x: x["done"])[:MAX_ITEMS]


def todo_call(body):
    """a change of the list from the page -> (entity, service, data) or None: add an item, tick one off or back, clear the ticked ones"""
    if not isinstance(body, dict) or not isinstance(body.get("entity"), str) or not TODO_ID.match(body["entity"]):
        return None
    action, entity = body.get("action"), body["entity"]
    if action == "add":
        item = CONTROL.sub(" ", body.get("item")).strip()[:MAX_ITEM] if isinstance(body.get("item"), str) else ""
        return (entity, "add_item", {"item": item}) if item else None
    if action in ("done", "undo"):
        uid = body.get("uid")
        if isinstance(uid, str) and 0 < len(uid) <= 100:
            return entity, "update_item", {"item": uid, "status": "completed" if action == "done" else "needs_action"}
        return None
    if action == "clear":
        return entity, "remove_completed_items", {}
    return None
