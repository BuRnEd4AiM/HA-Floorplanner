"""Entities renamed in Home Assistant: the floor plans follow.

Home Assistant knows an entity by its registry entry (integration + unique id); the entity id is only its current name. The add-on keeps
its own websocket (like the security recorder) and remembers which entity id every registry entry had and which name (friendly name)
every entity showed. When an entity id changes – renamed in Home Assistant, by Zigbee2MQTT ("update Home Assistant entity ID" deletes the
entity and creates it again with the same unique id) or by another add-on such as the Zigbee Devices Manager – every floor plan, the
settings and users.json get the new id. A device of the plan that still carries Home Assistant's old name gets the new name; a name typed
by hand stays. What was renamed while the add-on was stopped is caught up at the next start (the remembered state is a file).

The comparison and the rewriting are pure (tests/test_renames.py); run_watch keeps the connection and never raises.
"""
import asyncio
import itertools
import json
import logging
import re
import time

log = logging.getLogger("floorplan3d.renames")

ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
EVENTS = ("entity_registry_updated", "device_registry_updated")   # a device name changes the names of its entities
QUIET = 2.0               # seconds without a registry event before looking (one rename comes as several events)
GONE_KEEP = 3600.0        # a deleted entry is remembered this long: created again with the same unique id, it counts as renamed
HISTORY_KEEP = 7 * 86400.0  # how long a plan saved by a browser that missed a rename (asleep, offline) is still corrected
NOT_REAL = ("unavailable", "unknown")


def entry_key(entry: dict):
    """What identifies a registry entry (integration + unique id); None for an entry without a unique id."""
    platform, uid = entry.get("platform"), entry.get("unique_id")
    return f"{platform}\x1f{uid}" if isinstance(platform, str) and platform and uid not in (None, "") else None


def compare(known: dict | None, entries: list, now: float) -> tuple[dict, dict]:
    """known: {"at": time of the last look, "ids": {key: [entity id, last seen]}} (also entries deleted a moment ago).
    Returns ({old id: new id}, the known state for the next look)."""
    known = known or {}
    ids, last = known.get("ids") or {}, known.get("at", 0)
    seen = {}
    for e in entries:
        k, eid = entry_key(e), e.get("entity_id")
        if k and isinstance(eid, str) and ENTITY.match(eid):
            seen[k] = eid
    current = set(seen.values())
    renames = {}
    for k, eid in seen.items():
        was = ids.get(k)
        if not was or was[0] == eid:
            continue
        if was[1] < last and (now - was[1] > GONE_KEEP or was[0] in current):
            continue            # deleted long ago, or its old id belongs to another entity by now: not a rename
        renames[was[0]] = eid
    out = {k: v for k, v in ids.items() if k not in seen and now - v[1] <= GONE_KEEP}
    out.update({k: [eid, now] for k, eid in seen.items()})
    return renames, {"at": now, "ids": out}


def friendly_names(states: list, before: dict | None = None) -> dict:
    """{entity id: name shown in Home Assistant}. An entity that is unavailable or restored (Home Assistant starting) keeps the name
    it had before: its name may be a stand-in for a moment."""
    out = dict(before or {})
    for s in states:
        eid, attrs = s.get("entity_id"), s.get("attributes") or {}
        name = attrs.get("friendly_name")
        if isinstance(eid, str) and isinstance(name, str) and name and s.get("state") not in NOT_REAL and not attrs.get("restored"):
            out[eid] = name
    return out


def name_changes(before: dict, after: dict, renames: dict) -> dict:
    """{entity id (the new one): [old name, new name]} for every entity whose name in Home Assistant changed."""
    back = {new: old for old, new in renames.items()}
    out = {}
    for eid, name in after.items():
        old = before.get(back.get(eid, eid))
        if old and old != name:
            out[eid] = [old, name]
    return out


def rewrite(obj, ids: dict, names: dict | None = None) -> int:
    """New entity ids (exact strings, also as keys) and new names into a floor plan, the settings or users.json, in place.
    names: {entity id: [old name, new name]}: an object with that `entity` whose `name` is still the old name gets the new one.
    Returns the number of changes."""
    names = names or {}
    count = 0

    def walk(o):
        nonlocal count
        if isinstance(o, dict):
            for k, v in o.items():
                if isinstance(v, str):
                    if v in ids:
                        o[k] = ids[v]
                        count += 1
                else:
                    walk(v)
            hits = [k for k in o if k in ids]
            if hits:
                items = [(ids.get(k, k), v) for k, v in o.items()]
                o.clear()
                o.update(items)
                count += len(hits)
            ent = o.get("entity")
            if isinstance(ent, str) and ent in names and o.get("name") == names[ent][0]:
                o["name"] = names[ent][1]
                count += 1
        elif isinstance(o, list):
            for i, v in enumerate(o):
                if isinstance(v, str):
                    if v in ids:
                        o[i] = ids[v]
                        count += 1
                else:
                    walk(v)

    walk(obj)
    return count


def remember(history: dict, renames: dict, now: float) -> dict:
    """{old id: [new id, when]} of the last days; a chain (a -> b, later b -> c) points at the newest id."""
    out = {old: v for old, v in history.items() if now - v[1] <= HISTORY_KEEP}
    for old, v in out.items():
        if v[0] in renames:
            out[old] = [renames[v[0]], v[1]]
    for old, new in renames.items():
        out[old] = [new, now]
    return {old: v for old, v in out.items() if old != v[0]}


def fix_stale(obj, history: dict, current: set, now: float) -> int:
    """A plan saved by a browser that missed a rename: ids that no longer exist and were renamed lately get their new id."""
    ids = {old: v[0] for old, v in history.items() if old not in current and v[0] in current and now - v[1] <= HISTORY_KEEP}
    return rewrite(obj, ids) if ids else 0


def look(state: dict, entries: list, states: list, now: float) -> tuple[dict, dict, dict]:
    """One comparison: (renames {old: new}, name changes {id: [old, new]}, the state to keep)."""
    renames, known = compare(state.get("known"), entries, now)
    names = friendly_names(states, {renames.get(k, k): v for k, v in (state.get("names") or {}).items()})
    changes = name_changes(state.get("names") or {}, names, renames) if state.get("names") else {}
    current = {x.get("entity_id") for x in (*entries, *states) if isinstance(x.get("entity_id"), str)}
    new_state = {"known": known, "names": {k: v for k, v in names.items() if k in current},
                 "history": remember(state.get("history") or {}, renames, now), "current": sorted(current)}
    return renames, changes, new_state


def is_registry_event(data: dict) -> bool:
    return data.get("type") == "event" and (data.get("event") or {}).get("event_type") in EVENTS


async def ask(ws, msg_id: int, cmd: dict, more: list):
    """Send a command and wait for its result; registry events that arrive meanwhile are noted in `more`."""
    await ws.send_json({"id": msg_id, **cmd})
    while True:
        msg = await asyncio.wait_for(ws.receive(), 60)
        if msg.type != 1:                          # aiohttp.WSMsgType.TEXT; anything else: closed or an error
            raise ConnectionError("websocket closed")
        data = json.loads(msg.data)
        if data.get("id") == msg_id and data.get("type") == "result":
            if not data.get("success"):
                raise LookupError(f"{cmd['type']}: {(data.get('error') or {}).get('code', 'refused')}")
            return data.get("result")
        if is_registry_event(data):
            more.append(1)


async def run_watch(*, connect, load, save, apply, quiet: float = QUIET):
    """Keep a websocket to Home Assistant: look at once, and again a moment after registry changes; apply(ids, names) rewrites the
    files and tells the browsers. connect(): async context manager of an authenticated websocket; load()/save(state): the remembered
    state. Never raises."""
    state = await asyncio.to_thread(load)
    delay = 1
    while True:
        refused = False
        try:
            async with connect() as ws:
                ids = itertools.count(1)
                for ev in EVENTS:
                    await ask(ws, next(ids), {"type": "subscribe_events", "event_type": ev}, [])
                due = 0.0                          # at once: catch up on what changed while not connected
                while True:
                    if due is None or due > time.monotonic():
                        wait = None if due is None else due - time.monotonic()
                        try:
                            msg = await asyncio.wait_for(ws.receive(), wait)
                        except asyncio.TimeoutError:
                            continue
                        if msg.type != 1:
                            raise ConnectionError("websocket closed")
                        if is_registry_event(json.loads(msg.data)):
                            due = time.monotonic() + quiet
                        continue
                    more = []
                    entries = await ask(ws, next(ids), {"type": "config/entity_registry/list"}, more)
                    states = await ask(ws, next(ids), {"type": "get_states"}, more)
                    renames, changes, state = look(state, entries or [], states or [], time.time())
                    if renames or changes:
                        await apply(renames, changes)
                    await asyncio.to_thread(save, state)
                    delay = 1                          # a look worked: after a later interruption try again soon
                    due = time.monotonic() + quiet if more else None
        except asyncio.CancelledError:
            raise
        except Exception as err:  # noqa: BLE001 - must never stop the add-on
            refused = isinstance(err, LookupError)          # Home Assistant does not answer the registry: no need to ask often
            log.info("watching for renamed entities interrupted (%s), retrying in %ss", err, delay)
        await asyncio.sleep(delay)
        delay = min(600 if refused else 60, delay * 2)
