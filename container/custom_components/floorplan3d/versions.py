"""Do this integration and the 3D Floorplan container belong together? (#744)

Both come from the same release of HA-Floorplanner and carry its version: the integration in its manifest.json (written by
tools/make_manifest.py), the container in its own manifest, which it tells at ``/auth/version`` without a login (a container before
5.9.0 has no such address: it answers 404). Same version: nothing to say. Different: Settings → Repairs in Home Assistant says
which of the two to update, instead of a login that fails or a 502 nobody can explain.

Pure: no aiohttp, no Home Assistant (tests/test_container_dashboard.py).
"""
from __future__ import annotations

import re

# The container answers, but has no /auth/version: it is older than the first version that tells it.
TOO_OLD = "<5.9.0"

_VERSION = re.compile(r"^\d{1,4}(\.\d{1,4}){1,3}([-+][0-9A-Za-z.-]{1,20})?$")

SAME = "same"
UPDATE_CONTAINER = "update_container"       # the container is older than this integration
UPDATE_CONNECTOR = "update_connector"       # this integration is older than the container
UNKNOWN = "unknown"                         # the container does not answer, or says nothing usable: nothing to conclude


def clean(value) -> str | None:
    """a version string as both sides write it ("5.9.0"), or None for anything else (it ends up in a text in Home Assistant)"""
    text = str(value).strip() if isinstance(value, (str, int, float)) else ""
    text = text[1:] if text[:1] in ("v", "V") else text
    return text if _VERSION.match(text) else None


def parse(value) -> tuple[int, ...] | None:
    """the numbers of a version, for comparing: "5.9.0" -> (5, 9, 0); a suffix ("-beta") is ignored"""
    text = clean(value)
    if text is None:
        return None
    numbers = tuple(int(part) for part in re.split(r"[-+]", text, maxsplit=1)[0].split("."))
    return numbers + (0,) * (4 - len(numbers))


def compare(connector, container) -> str:
    """which side has to be updated: SAME, UPDATE_CONTAINER, UPDATE_CONNECTOR or UNKNOWN"""
    if container == TOO_OLD:
        return UPDATE_CONTAINER
    mine, theirs = parse(connector), parse(container)
    if mine is None or theirs is None:
        return UNKNOWN
    if mine == theirs:
        return SAME
    return UPDATE_CONTAINER if theirs < mine else UPDATE_CONNECTOR


def placeholders(connector, container) -> dict:
    """the two versions for the text in Settings → Repairs ("< 5.9.0" reads the same in every language)"""
    return {"connector": clean(connector) or "?", "container": "< 5.9.0" if container == TOO_OLD else (clean(container) or "?")}
