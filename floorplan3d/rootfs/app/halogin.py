"""The add-on without the Supervisor: Home Assistant as a plain Docker container (Home Assistant Container, #489). There is no Ingress
then, which in the add-on lets only logged-in Home Assistant users in and says who they are: the page runs on its own port, so whoever
opens it logs in with Home Assistant (its login page, "IndieAuth": the page's address is the client id) and gets a signed cookie of the
add-on with who they are. The add-on itself talks to Home Assistant with a long-lived access token (HA_TOKEN).

Pure (no aiohttp, no Home Assistant): unit tests in tests/test_halogin.py; server.py has the routes and the middleware.
"""
import base64
import hashlib
import hmac
import ipaddress
import json
import re
import time
from urllib.parse import urlencode, urlsplit

SESSION_COOKIE = "fp3d_session"
LOGIN_COOKIE = "fp3d_login"
SESSION_DAYS = 30
RENEW_DAYS = 20                    # a session with fewer days left gets a new cookie on the next request (a wall tablet stays logged in)
LOGIN_SECONDS = 600                # from "log in" to coming back from Home Assistant
STATE = re.compile(r"^[A-Za-z0-9_-]{16,128}$")


def ha_base(url: str) -> str:
    """Home Assistant's address without a trailing "/" and without "/api": "http://ha:8123/api/" -> "http://ha:8123" """
    u = str(url or "").strip().rstrip("/")
    return u[:-4] if u.endswith("/api") else u


def _local_name(host: str) -> bool:
    """an address only the add-on's own computer or Docker network knows: localhost, 127.x, ::1, a name without a dot ("homeassistant")"""
    h = (host or "").strip("[]").lower()
    if h in ("localhost", "") or h.endswith(".localhost"):
        return True
    try:
        return ipaddress.ip_address(h).is_loopback
    except ValueError:
        return "." not in h


def browser_ha(ha_url: str, public_url: str, request_host: str) -> str:
    """Home Assistant's address for the browser (where its login page is): HA_PUBLIC_URL when set; else HA_URL, but when that is an
    address only the container knows (http://homeassistant:8123, http://localhost:8123) the host the page was opened with (request_host,
    "192.168.1.10:8100") and Home Assistant's port"""
    if public_url:
        return ha_base(public_url)
    base = ha_base(ha_url)
    p = urlsplit(base)
    try:
        host = urlsplit("//" + str(request_host or "")).hostname
    except ValueError:
        host = None
    if p.hostname and _local_name(p.hostname) and host:
        return f"{p.scheme}://{f'[{host}]' if ':' in host else host}" + (f":{p.port}" if p.port else "")
    return base


def app_base(app_url: str, scheme: str, host: str) -> str:
    """the page's own address with a trailing "/" (Home Assistant's client id): APP_URL when set (behind a proxy, in a folder), else
    how the browser asked for it"""
    if app_url:
        return str(app_url).strip().rstrip("/") + "/"
    return f"{'https' if scheme == 'https' else 'http'}://{host}/"


def authorize_url(ha: str, client_id: str, state: str) -> str:
    """Home Assistant's login page; it sends the browser back to <page>/auth/callback with a code"""
    return f"{ha_base(ha)}/auth/authorize?" + urlencode({"response_type": "code", "client_id": client_id,
                                                         "redirect_uri": client_id + "auth/callback", "state": state})


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def sign(data: dict, key: bytes) -> str:
    """a cookie value: the data (JSON) and its signature with the add-on's key; nobody can change it without the key"""
    body = _b64(json.dumps(data, separators=(",", ":"), sort_keys=True).encode())
    return body + "." + _b64(hmac.new(key, body.encode(), hashlib.sha256).digest())


def unsign(value, key: bytes, now: float | None = None):
    """the data of a cookie value when the signature fits and it has not run out ("exp"), else None"""
    if not isinstance(value, str) or value.count(".") != 1 or len(value) > 4096:
        return None
    body, sig = value.split(".")
    if not hmac.compare_digest(sig, _b64(hmac.new(key, body.encode(), hashlib.sha256).digest())):
        return None
    try:
        data = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
    except ValueError:
        return None
    if not isinstance(data, dict) or not isinstance(data.get("exp"), (int, float)) or data["exp"] <= (time.time() if now is None else now):
        return None
    return data


def new_session(user: dict, username: str | None, now: float) -> dict | None:
    """who logged in, from Home Assistant's auth/current_user (id, name, is_admin) and the login name from its user list: None when
    Home Assistant said nothing usable"""
    if not isinstance(user, dict) or not isinstance(user.get("id"), str) or not user["id"].strip():
        return None
    name = user.get("name") if isinstance(user.get("name"), str) else ""
    return {"id": user["id"].strip()[:64], "name": name.strip()[:80], "user": (username or "").strip()[:80],
            "admin": bool(user.get("is_admin") or user.get("is_owner")), "exp": int(now + SESSION_DAYS * 86400)}


def renewed(sess: dict, now: float) -> dict | None:
    """the session with a new end when it has fewer than RENEW_DAYS left, else None (the cookie stays)"""
    if sess["exp"] - now >= RENEW_DAYS * 86400:
        return None
    return {**sess, "exp": int(now + SESSION_DAYS * 86400)}


def who(sess: dict | None) -> dict:
    """like the add-on's Ingress headers: {"name" (login name, else the name), "display", "ids" (id, login name, name; lower case)}"""
    if not sess:
        return {"name": "", "display": "", "ids": set()}
    vals = (sess.get("id"), sess.get("user"), sess.get("name"))
    return {"name": sess.get("user") or sess.get("name") or "", "display": sess.get("name") or sess.get("user") or "",
            "ids": {str(v).strip().lower() for v in vals if isinstance(v, str) and v.strip()}}


def same_origin(origin, host: str, app_url: str = "") -> bool:
    """may a request that changes something (or opens the live channel) come from there: the browser names the page that sends it
    (Origin); another page, also one on another port of the same computer, may not use the login cookie. No Origin: not a browser's
    request from another page."""
    if origin is None:
        return True
    try:
        o = urlsplit(str(origin)).netloc.lower()
    except ValueError:
        return False
    return bool(o) and (o == str(host or "").lower() or (bool(app_url) and o == urlsplit(app_url).netloc.lower()))


def back_to(query: str) -> str:
    """where the browser goes after the login: the page with the address' options it was opened with (?kiosk=1 …), relative to
    auth/callback, never elsewhere"""
    q = str(query or "")
    return "../" + (f"?{q}" if q and len(q) <= 1000 and not any(c in q for c in "\r\n#") else "")


def is_page(method: str, path: str) -> bool:
    """a request of the page itself (the browser is sent to the login), not of its data (that gets 401)"""
    return method == "GET" and (path.endswith("/") or path.endswith(".html"))
