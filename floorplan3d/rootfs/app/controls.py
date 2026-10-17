"""What a browser may switch in Home Assistant, and what the live card needs to know for it (#406).

Every call of `POST /api/service` is checked here: the domain, the service of that domain and every value it carries. Only what the
floor plan's buttons send gets through (lights, switches, covers, locks, scenes, scripts, thermostats with their presets and fan modes,
music players and TVs, robot vacuums, fans, alarm panels, buttons and choice lists); anything else is refused before it reaches Home
Assistant. `extras` picks the few attributes of a state the live card needs for these controls (volume, track, fan speed, presets,
choices ...), sent as the field `ctl` of each entity.

Pure (no aiohttp, no Home Assistant): unit tests in tests/test_controls.py.
"""
import math

HVAC_MODES = {"off", "heat", "cool", "heat_cool", "auto", "dry", "fan_only"}
ON_OFF = ("turn_on", "turn_off", "toggle")
MAX_TEXT = 100            # a preset, fan speed, source or option named longer than this is not one


def _pct(v):
    """0 to 100, whole numbers"""
    return int(v) if _num(v) and 0 <= v <= 100 else None


def _num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _text(v):
    """a name out of a list Home Assistant gave (preset, fan speed, source, option): a short string"""
    return v if isinstance(v, str) and 0 < len(v) <= MAX_TEXT else None


def _code(v):
    """the code of an alarm panel: what was typed, up to 32 characters (Home Assistant checks it)"""
    return v if isinstance(v, str) and 0 < len(v) <= 32 and v.isprintable() else None


def _flag(v):
    return v if isinstance(v, bool) else None


def _rgb(v):
    if isinstance(v, list) and len(v) == 3 and all(_num(x) and 0 <= x <= 255 for x in v):
        return [int(x) for x in v]
    return None


def _kelvin(v):
    return int(v) if _num(v) and 1500 <= v <= 9000 else None


def _temp(v):
    return round(float(v), 1) if _num(v) and 4 <= v <= 40 else None


def _hvac(v):
    return v if v in HVAC_MODES else None


def _volume(v):
    """0.0 to 1.0, as Home Assistant wants it"""
    return round(float(v), 2) if _num(v) and 0 <= v <= 1 else None


def _effect(v):
    return v if isinstance(v, str) and 0 < len(v) <= 64 else None


# domain -> service -> (the values it may carry: name -> check, the values it must carry)
SERVICES = {
    "light": {"turn_on": ({"brightness_pct": _pct, "rgb_color": _rgb, "color_temp_kelvin": _kelvin, "effect": _effect}, ()),
              "turn_off": ({}, ()), "toggle": ({}, ())},
    "switch": {s: ({}, ()) for s in ON_OFF},
    "input_boolean": {s: ({}, ()) for s in ON_OFF},
    "cover": {"open_cover": ({}, ()), "close_cover": ({}, ()), "stop_cover": ({}, ()), "toggle": ({}, ()),
              "set_cover_position": ({"position": _pct}, ("position",))},
    "lock": {"lock": ({}, ()), "unlock": ({}, ())},
    "scene": {"turn_on": ({}, ())},
    "script": {s: ({}, ()) for s in ON_OFF},
    "climate": {**{s: ({}, ()) for s in ON_OFF},
                "set_temperature": ({"temperature": _temp}, ("temperature",)),
                "set_hvac_mode": ({"hvac_mode": _hvac}, ("hvac_mode",)),
                "set_preset_mode": ({"preset_mode": _text}, ("preset_mode",)),
                "set_fan_mode": ({"fan_mode": _text}, ("fan_mode",))},
    "fan": {**{s: ({}, ()) for s in ON_OFF},
            "set_percentage": ({"percentage": _pct}, ("percentage",)),
            "oscillate": ({"oscillating": _flag}, ("oscillating",)),
            "set_preset_mode": ({"preset_mode": _text}, ("preset_mode",))},
    "media_player": {**{s: ({}, ()) for s in ON_OFF},
                     **{s: ({}, ()) for s in ("media_play_pause", "media_play", "media_pause", "media_stop", "media_next_track",
                                              "media_previous_track", "volume_up", "volume_down")},
                     "volume_set": ({"volume_level": _volume}, ("volume_level",)),
                     "volume_mute": ({"is_volume_muted": _flag}, ("is_volume_muted",)),
                     "select_source": ({"source": _text}, ("source",))},
    "vacuum": {**{s: ({}, ()) for s in ("start", "pause", "stop", "return_to_base", "locate")},
               "set_fan_speed": ({"fan_speed": _text}, ("fan_speed",))},
    "alarm_control_panel": {s: ({"code": _code}, ()) for s in ("alarm_disarm", "alarm_arm_home", "alarm_arm_away", "alarm_arm_night",
                                                                "alarm_arm_vacation")},
    "button": {"press": ({}, ())},
    "input_button": {"press": ({}, ())},
    "select": {"select_option": ({"option": _text}, ("option",))},
    "input_select": {"select_option": ({"option": _text}, ("option",))},
}
DOMAINS = set(SERVICES)


def check(body):
    """(domain, service, payload for Home Assistant, None) for an allowed call `body` of the browser, or (.., .., None, error text)"""
    if not isinstance(body, dict):
        return None, None, None, "domain/service/entity not allowed"
    domain, service, entity = body.get("domain"), body.get("service"), body.get("entity_id")
    spec = SERVICES.get(domain, {}).get(service) if isinstance(domain, str) and isinstance(service, str) else None
    if spec is None or not isinstance(entity, str) or entity.split(".")[0] != domain:
        return domain, service, None, "domain/service/entity not allowed"
    allowed, needed = spec
    payload = {"entity_id": entity}
    data = body.get("data")
    if data is not None:
        if not isinstance(data, dict):
            return domain, service, None, "data must be an object"
        for key, val in data.items():
            ok = allowed.get(key)
            v = ok(val) if ok else None
            if v is None:
                return domain, service, None, "data not allowed"
            payload[key] = v
    if any(k not in payload for k in needed):
        return domain, service, None, "value missing"
    return domain, service, payload, None


def _texts(v, n=40):
    """a list of names out of an attribute (presets, sources, options ...): only short strings, at most n"""
    return [x for x in v if _text(x)][:n] if isinstance(v, list) else None


def _clip(v, n=MAX_TEXT):
    return v[:n] if isinstance(v, str) and v else None


def _int(v):
    return int(v) if _num(v) else None


def extras(st):
    """the attributes of state `st` the live card needs for its controls, or None for a domain without any (sent as `ctl`)"""
    eid = st.get("entity_id", "")
    domain, a = eid.split(".")[0], st.get("attributes") or {}
    if domain == "media_player":
        vol = a.get("volume_level")
        out = {"vol": round(vol * 100) if _num(vol) and 0 <= vol <= 1 else None, "muted": _flag(a.get("is_volume_muted")),
               "title": _clip(a.get("media_title")), "artist": _clip(a.get("media_artist") or a.get("media_series_title")),
               "sources": _texts(a.get("source_list")), "source": _text(a.get("source")), "sf": _int(a.get("supported_features"))}
    elif domain == "vacuum":
        out = {"speeds": _texts(a.get("fan_speed_list")), "speed": _text(a.get("fan_speed")), "sf": _int(a.get("supported_features"))}
    elif domain == "fan":
        step = a.get("percentage_step")
        out = {"pct": _pct(a.get("percentage")), "step": step if _num(step) and 0 < step <= 100 else None,
               "osc": _flag(a.get("oscillating")), "presets": _texts(a.get("preset_modes")), "preset": _text(a.get("preset_mode")),
               "sf": _int(a.get("supported_features"))}
    elif domain == "climate":
        out = {"presets": _texts(a.get("preset_modes")), "preset": _text(a.get("preset_mode")),
               "fans": _texts(a.get("fan_modes")), "fan": _text(a.get("fan_mode"))}
    elif domain == "alarm_control_panel":
        cf = a.get("code_format")
        out = {"code": cf if cf in ("number", "text") else None, "codeArm": a.get("code_arm_required") is not False,
               "sf": _int(a.get("supported_features"))}
    elif domain in ("select", "input_select"):
        out = {"options": _texts(a.get("options"), 100)}
    else:
        return None
    out = {k: v for k, v in out.items() if v is not None}
    return out or None
