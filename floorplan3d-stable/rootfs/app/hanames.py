"""The name Home Assistant shows for an entity, read in one place (#675).

Today it is the state attribute friendly_name. Home Assistant 2026.11 builds names from parts (the entity's own name, its device, its
area) and plans to deprecate friendly_name and to remove it later (announced ahead). So every part of the add-on reads an entity's name
through name(). When friendly_name is missing, the name is built from the registries the way Home Assistant builds friendly_name: the
device's name and the entity's own name ("Kaffeemaschine Leistung"); an entity without a name of its own (the main entity of its device)
goes by its device's name. renames.run_watch remembers these names whenever the registries change (remember). Pure but for that one
remembered map (tests/test_hanames.py).
"""

_FROM_REGISTRY: dict = {}          # {entity id: the name built from the registries}, renames.run_watch keeps it


def name(st, default=None):
    """The name of an entity from its state ({"entity_id", "attributes"}): friendly_name; without one the name built from the registries;
    else default."""
    a = st.get("attributes") if isinstance(st, dict) else None
    n = a.get("friendly_name") if isinstance(a, dict) else None
    if isinstance(n, str) and n.strip():
        return n
    eid = st.get("entity_id") if isinstance(st, dict) else None
    return _FROM_REGISTRY.get(eid, default) if isinstance(eid, str) else default


def device_names(devices) -> dict:
    """{device id: its name} from the device registry list (config/device_registry/list): the name given in Home Assistant, else the
    integration's"""
    out = {}
    for d in devices if isinstance(devices, list) else []:
        if isinstance(d, dict) and isinstance(d.get("id"), str):
            n = next((x for x in (d.get("name_by_user"), d.get("name")) if isinstance(x, str) and x.strip()), None)
            if n:
                out[d["id"]] = n.strip()
    return out


def registry_name(entry: dict, devices: dict) -> str | None:
    """What Home Assistant shows as friendly_name, built from an entry of the entity registry list and {device id: name}. Before 2026.11
    the list says "has_entity_name": a name given in Home Assistant is the whole name, an integration's name gets the device's name in
    front only with has_entity_name. From 2026.11 on every name is the entity's own and the device's name goes in front."""
    if not isinstance(entry, dict):
        return None

    def text(v):
        return v.strip() if isinstance(v, str) else None
    own, original = text(entry.get("name")), text(entry.get("original_name"))
    device = devices.get(entry.get("device_id")) if isinstance(entry.get("device_id"), str) else None
    if "has_entity_name" in entry:                                    # Home Assistant before 2026.11
        if own:
            return own
        parts = (device, original) if entry.get("has_entity_name") else (original,)
    else:
        parts = (device, own if own is not None else original)       # "": no name of its own, the main entity of its device
    return " ".join(p for p in parts if p) or None


def registry_names(entries, devices) -> dict:
    """{entity id: registry_name} for the entity registry list and the device registry list; entities without a name are left out"""
    names = device_names(devices)
    out = {}
    for e in entries if isinstance(entries, list) else []:
        n = registry_name(e, names)
        if n and isinstance(e.get("entity_id"), str):
            out[e["entity_id"]] = n
    return out


def remember(names: dict) -> None:
    """keep the names built from the registries (renames.run_watch, after every change of the registries)"""
    global _FROM_REGISTRY
    _FROM_REGISTRY = dict(names) if isinstance(names, dict) else {}
