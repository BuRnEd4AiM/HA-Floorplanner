"""👥 Gäste-Zugang (the owner, 2026-11-20: "es gibt im Home Assistant einen benutzer … gast und mit einem qr code … bekommt man eine karte
dann zu gesicht die man steuern kann von dem raum den man vorher ausgewählt hat"; his choices: the guest logs in once as that Home
Assistant user, may switch light, roller shutters, heating and music / TV of the chosen room, until a chosen date).

Kept in the settings under "guest": {on, user (the Home Assistant user name, "gast" at first), room ("<house>/<room id>"), until (ISO date
and time with its offset, "" = no end)}. While it is on and not over, the guest user sees only the card of that room and may switch only
the entities of that room (devices inside it, its Home Assistant area, the shutters of its windows) of the domains below; everything else
of the page is locked for them like for a user with every lock. Over or switched off: they see "Der Gäste-Zugang ist beendet" and may
switch nothing. Pure (unit test: tests/test_guest.py); server.py applies it."""
import datetime
import re

DOMAINS = ("light", "scene", "cover", "climate", "media_player")   # 💡 Licht (with the room's scenes), 🪟 Rollladen, 🌡 Heizung, 📺 Musik / TV (his choice)
USER = re.compile(r"^[^\s/\\]{1,64}$")
ROOM = re.compile(r"^[A-Za-z0-9_-]{1,40}/[A-Za-z0-9_-]{1,40}$")


def _when(v):
    if not isinstance(v, str) or not v or len(v) > 40:
        return None
    try:
        d = datetime.datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        return None
    return d if d.tzinfo else None


def clean_guest(v) -> dict:
    """the settings of the guest access, every value checked"""
    v = v if isinstance(v, dict) else {}
    user = v.get("user").strip() if isinstance(v.get("user"), str) else ""
    room = v.get("room") if isinstance(v.get("room"), str) and ROOM.match(v["room"]) else ""
    until = _when(v.get("until"))
    return {"on": v.get("on") is True, "user": user if USER.match(user) else "gast", "room": room,
            "until": until.isoformat(timespec="minutes") if until else ""}


def is_guest(cfg: dict, ids) -> bool:
    """is the user looking (ids: their name and id, lower case) the guest user; only while the access is switched on"""
    return bool(cfg.get("on") and cfg.get("user") and cfg["user"].lower() in ids)


def active(cfg: dict, now: float) -> bool:
    """may the guest switch now: on, a room chosen, not over"""
    if not cfg.get("on") or not cfg.get("room"):
        return False
    until = _when(cfg.get("until"))
    return until is None or now < until.timestamp()


def allowed(entities, room_entities, domains=DOMAINS) -> bool:
    """may the guest switch these entities: every one in their room and of a domain they may switch"""
    ents = [entities] if isinstance(entities, str) else list(entities or [])
    mine = set(room_entities or ())
    return bool(ents) and all(isinstance(e, str) and e in mine and e.split(".")[0] in domains for e in ents)


def room_entities(room: dict) -> list:
    """the entities of a room of roommap.rooms_of the guest may see and switch: its devices and area, the shutters of its windows"""
    out = [e for e in room.get("entities") or [] if isinstance(e, str)]
    out += [s["cover"] for s in room.get("shutters") or [] if isinstance(s, dict) and s.get("cover") not in out]
    return [e for e in out if e.split(".")[0] in DOMAINS]
