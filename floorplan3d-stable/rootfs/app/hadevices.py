"""Which entities belong to the same device in Home Assistant (#675, Home Assistant 2026.11).

Since Home Assistant 2026.11 a device made of parts is split into its main device and one "child device" per part: each socket of a
power strip, each sensor of a Z-Wave thermostat, each clamp of an energy meter (Z-Wave, MQTT, ESPHome and some Tuya devices so far, more
to follow). An entity of a part names the child device as its device_id (config/entity_registry/list); the device registry
(config/device_registry/list) names the main device as the child's "parent_device_id".

What the add-on looks for "on the same device" (the battery of a device #376, the other entities of a thermostat #370, the kWh counter
next to a power sensor, the power sensor next to an energy meter #407) is looked for on the entity's own device first, then on the whole
device: the main device with all its parts, as it was one device before. A part put into another area than its main device (a socket of
the power strip in the dining room) counts as a device of its own. Older versions of Home Assistant have no child devices: "own" and
"whole" are the same, nothing changes. Pure (tests/test_hadevices.py).
"""


def parents(devices) -> dict:
    """{child device id: its main device id} from the device registry list; {} for older versions (no "parent_device_id"). A part with an
    area of its own, other than its main device's, is left out: it counts as a device of its own."""
    rows = [d for d in devices if isinstance(d, dict) and isinstance(d.get("id"), str)] if isinstance(devices, list) else []
    area = {d["id"]: d.get("area_id") for d in rows}
    out = {}
    for d in rows:
        main = d.get("parent_device_id")
        if isinstance(main, str) and main and main != d["id"] and d.get("area_id") in (None, area.get(main)):
            out[d["id"]] = main
    return out


class Devices:
    """The devices of the entities of the entity registry list (entries), with the parts of the device registry list (devices)."""

    def __init__(self, entries, devices=None):
        self.parent = parents(devices)
        self.device_of, self._own, self._whole = {}, {}, {}
        for e in entries if isinstance(entries, list) else []:
            dev, eid = (e.get("device_id"), e.get("entity_id")) if isinstance(e, dict) else (None, None)
            if isinstance(dev, str) and dev and isinstance(eid, str):
                self.device_of[eid] = dev
                self._own.setdefault(dev, []).append(eid)
                self._whole.setdefault(self.parent.get(dev, dev), []).append(eid)

    def own(self, eid) -> list:
        """the entities of the entity's own device (of a part: only that part), the entity itself among them; [] without a device"""
        return list(self._own.get(self.device_of.get(eid), []))

    def whole(self, eid) -> list:
        """the entities of the whole device, those of its own device first, then the main device's and its other parts'"""
        dev = self.device_of.get(eid)
        if dev is None:
            return []
        own = self._own[dev]
        rest = self._whole[self.parent.get(dev, dev)]
        if len(rest) == len(own):
            return list(own)
        mine = set(own)
        return [*own, *(x for x in rest if x not in mine)]

    def near(self, eid, fits) -> list:
        """the other entities that fit (fits(entity) -> bool) on the entity's own device, sorted; none there: those of the whole device"""
        own = self.own(eid)
        hits = sorted(x for x in own if x != eid and fits(x))
        return hits or sorted(x for x in self.whole(eid) if x != eid and x not in own and fits(x))
