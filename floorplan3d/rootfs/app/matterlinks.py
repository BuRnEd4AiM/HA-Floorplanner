"""📡 Matter in the Funk-Karte (5.28.3, the owner: "das ist nur per Zigbee. Ich habe aber auch Matter").

A Matter device over Thread has no sensor for its reception in Home Assistant at all; one over Wi-Fi has "Wi-Fi RSSI", switched off
(renames.py finds that one by its translation_key "wifi_rssi" too). Since Home Assistant 2026.11 the Matter integration hands out the
Matter server's network map (websocket "matter/network_topology", admins only, OHF Matter Server schema 13+):

    {"collected_at": …, "nodes": [{"id", "kind": "matter" | "border_router" | "thread_unknown" | "wifi_ap", "network_type", "node_id",
     "available", "ha_device_id", …}], "connections": [{"source", "target", "network": "thread" | "wifi",
     "strength": "strong" | "medium" | "weak" | "none", "source_to_target": {"strength", "lqi", "rssi"}, "target_to_source": {…}}]}

Here each Matter device of the map gets its best link (a Thread device talks through its best neighbour, a Wi-Fi one through its access
point): the strength of the connection, and the best LQI and RSSI either side saw on it. Every entity of the device points to it, so the
radio map shows it over the lamp or the sensor of the plan. Pure but for fetch (tests/test_matterlinks.py).
"""
import renames as rn
import hadevices

RANK = {"strong": 3, "medium": 2, "weak": 1, "none": 0}
QUALITY = {"strong": "good", "medium": "mid", "weak": "bad", "none": "bad"}


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _best(*vals):
    got = [v for v in vals if v is not None]
    return max(got) if got else None


def device_links(topology) -> dict:
    """{Home Assistant device id: {"q": "good" | "mid" | "bad", "strength", "network", "rssi", "lqi"}}: the best link of each Matter device
    of the map that Home Assistant knows (ha_device_id) and that is not unavailable"""
    nodes = topology.get("nodes") if isinstance(topology, dict) else None
    conns = topology.get("connections") if isinstance(topology, dict) else None
    dev = {n["id"]: n["ha_device_id"] for n in (nodes if isinstance(nodes, list) else []) if isinstance(n, dict) and n.get("kind") == "matter"
           and isinstance(n.get("ha_device_id"), str) and n.get("id") is not None and n.get("available") is not False}
    best = {}
    for c in conns if isinstance(conns, list) else []:
        s = c.get("strength") if isinstance(c, dict) else None
        if s not in RANK:
            continue
        a, b = (c.get(k) if isinstance(c.get(k), dict) else {} for k in ("source_to_target", "target_to_source"))
        rssi, lqi = _best(_num(a.get("rssi")), _num(b.get("rssi"))), _best(_num(a.get("lqi")), _num(b.get("lqi")))
        link = {"q": QUALITY[s], "strength": s, "network": c.get("network") or "", "rssi": rssi, "lqi": lqi}
        key = (RANK[s], rssi if rssi is not None else -999, lqi if lqi is not None else -1)
        for end in (c.get("source"), c.get("target")):
            d = dev.get(end)
            if d and (d not in best or key > best[d][0]):
                best[d] = (key, link)
    return {d: link for d, (_, link) in best.items()}


def entity_links(links: dict, entries: list, devices=None) -> dict:
    """{entity id: the link of its device} for every entity of a Matter device of the map (a part of a device, Home Assistant 2026.11:
    the link of its main device)"""
    d = hadevices.Devices(entries, devices)
    out = {}
    for eid, dev in d.device_of.items():
        link = links.get(dev) or links.get(d.parent.get(dev))
        if link:
            out[eid] = link
    return out


async def fetch(ws, first_id: int) -> tuple[str, dict]:
    """ask Home Assistant on the websocket ws (authenticated): ("ok", {entity: link}); ("old", {}) when the Matter server is too old for the
    map; ("none", {}) without Matter (or when Home Assistant does not let the add-on ask)"""
    more = []
    try:
        topo = await rn.ask(ws, first_id, {"type": "matter/network_topology"}, more)
    except LookupError as err:
        return ("old" if "not_supported" in str(err) else "none"), {}
    links = device_links(topo)
    if not links:
        return "ok", {}
    entries = await rn.ask(ws, first_id + 1, {"type": "config/entity_registry/list"}, more)
    devices = await rn.device_list(ws, first_id + 2, more)
    return "ok", entity_links(links, entries if isinstance(entries, list) else [], devices)
