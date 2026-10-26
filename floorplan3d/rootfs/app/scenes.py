"""Scenes for lights, LED strips, switches and roller shutters made in the dashboard as real scenes of Home Assistant (#549, the owner:
"dass auch die Szenen von LED-Streifen und LEDs auch verwaltbar sind über unsere App, aber dann wirkliche … Szenen in Home Assistant").

The page edits a scene as a small model: {name, icon, ents: {entity: {on, pct (brightness 1–100), rgb [r, g, b], kelvin, fx (effect),
pos (0–100)}}}; to_ha turns it into what Home Assistant's scene editor keeps (scenes.yaml: {id, name, icon, entities: {entity: {state,
brightness, color_mode, rgb_color | color_temp_kelvin, effect, current_position}}}), from_ha reads such a scene back for the editor.
server.py writes it through Home Assistant's editor API and only ever touches ids fp3d_… (haflows.ours). Pure (tests/test_scenes.py)."""
import re
import secrets

ENTITY = re.compile(r"^[a-z_]{1,32}\.[a-z0-9_]{1,100}$")
ICON = re.compile(r"^mdi:[a-z0-9-]{1,60}$")
DOMAINS = ("light", "switch", "fan", "input_boolean", "cover")
MAX_ENTS = 40


def new_id() -> str:
    """the id of a new scene of the add-on"""
    return "fp3d_s" + secrets.token_hex(4)


def _num(v, lo, hi):
    return max(lo, min(hi, int(round(v)))) if isinstance(v, (int, float)) and not isinstance(v, bool) and v == v else None


def _rgb(v):
    if isinstance(v, (list, tuple)) and len(v) == 3 and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in v):
        return [max(0, min(255, int(round(x)))) for x in v]
    return None


def clean_model(data) -> dict | None:
    """the scene as the page sends it, every value checked; None when it is no scene (no name or no device)"""
    if not isinstance(data, dict):
        return None
    name = data.get("name").strip()[:60] if isinstance(data.get("name"), str) else ""
    ents = {}
    for e, v in list((data.get("ents") if isinstance(data.get("ents"), dict) else {}).items())[:MAX_ENTS]:
        if not isinstance(e, str) or not ENTITY.match(e) or e.split(".")[0] not in DOMAINS or not isinstance(v, dict):
            continue
        dom, on = e.split(".")[0], v.get("on") is not False
        x = {"on": on}
        if dom == "light" and on:
            for k, lo, hi in (("pct", 1, 100), ("kelvin", 1500, 9000)):
                n = _num(v.get(k), lo, hi)
                if n is not None:
                    x[k] = n
            rgb = _rgb(v.get("rgb"))
            if rgb and "kelvin" not in x:
                x["rgb"] = rgb
            if isinstance(v.get("fx"), str) and v["fx"].strip():
                x["fx"] = v["fx"].strip()[:64]
        if dom == "cover":
            n = _num(v.get("pos"), 0, 100)
            if n is not None:
                x["pos"] = n
                x["on"] = n > 0
        ents[e] = x
    if not name or not ents:
        return None
    icon = data.get("icon") if isinstance(data.get("icon"), str) and ICON.match(data["icon"]) else None
    return {"name": name, **({"icon": icon} if icon else {}), "ents": ents}


def to_ha(cid: str, model: dict) -> dict:
    """the model (clean_model) -> Home Assistant's scene config"""
    entities = {}
    for e, x in model["ents"].items():
        dom = e.split(".")[0]
        if dom == "cover":
            st = {"state": "open" if x["on"] else "closed"}
            if "pos" in x:
                st["current_position"] = x["pos"]
        else:
            st = {"state": "on" if x["on"] else "off"}
        if dom == "light" and x["on"]:
            if "pct" in x:
                st["brightness"] = round(x["pct"] * 255 / 100)
            if "kelvin" in x:
                st.update(color_mode="color_temp", color_temp_kelvin=x["kelvin"])
            elif "rgb" in x:
                st.update(color_mode="rgb", rgb_color=x["rgb"])
            elif "pct" in x:
                st["color_mode"] = "brightness"
            if "fx" in x:
                st["effect"] = x["fx"]
        entities[e] = st
    out = {"id": cid, "name": model["name"], "entities": entities}
    if model.get("icon"):
        out["icon"] = model["icon"]
    return out


def from_ha(cfg) -> dict | None:
    """a scene of Home Assistant's editor -> the model for the page (what it cannot show is left out; None when it is no scene)"""
    if not isinstance(cfg, dict) or not isinstance(cfg.get("entities"), dict):
        return None
    ents = {}
    for e, st in cfg["entities"].items():
        if not isinstance(e, str) or not ENTITY.match(e) or e.split(".")[0] not in DOMAINS:
            continue
        st = st if isinstance(st, dict) else {"state": st}
        dom, s = e.split(".")[0], str(st.get("state", "on"))
        x = {"on": s in ("on", "open", "opening")}
        if dom == "light" and x["on"]:
            b = st.get("brightness")
            if isinstance(b, (int, float)) and not isinstance(b, bool):
                x["pct"] = max(1, min(100, round(b * 100 / 255)))
            if isinstance(st.get("color_temp_kelvin"), (int, float)) and st.get("color_mode") in (None, "color_temp"):
                x["kelvin"] = int(st["color_temp_kelvin"])
            elif _rgb(st.get("rgb_color")):
                x["rgb"] = _rgb(st["rgb_color"])
            if isinstance(st.get("effect"), str) and st["effect"] not in ("", "none", "None"):
                x["fx"] = st["effect"][:64]
        if dom == "cover" and isinstance(st.get("current_position"), (int, float)):
            x["pos"] = int(st["current_position"])
        ents[e] = x
    name = cfg.get("name") if isinstance(cfg.get("name"), str) else ""
    return {"name": name[:60] or "Szene", **({"icon": cfg["icon"]} if isinstance(cfg.get("icon"), str) and ICON.match(cfg["icon"]) else {}),
            "ents": ents}


def apply_data(model: dict) -> dict:
    """what scene.apply needs to show the scene at once without saving it (▶ Ausprobieren)"""
    return {"entities": to_ha("x", model)["entities"]}
