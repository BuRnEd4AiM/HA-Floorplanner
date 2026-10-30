"""The boundary between Home Assistant and the floor plan: what may cross it, in which direction, and which address a request gets.

Pure: no aiohttp, no Home Assistant, so the tests (tests/test_container_dashboard.py) run without either.

Two crossings need care:

* Home Assistant's own cookies and the user's token must not reach the plan. The plan has its own login; handing it Home Assistant's
  session cookie (or the Bearer token) would let it act as this user against Home Assistant, and X-Remote-User-* would count as a
  login if the plan ever ran behind the Supervisor.
* The plan's answer is a page on Home Assistant's address: it may set its own cookies there, not Home Assistant's, and not for a
  whole domain; and its HSTS header must not apply to Home Assistant's host.
"""
import re
from urllib.parse import parse_qs, urlsplit

from . import const

# What the plan may see of a request, by name. "host" and "origin" are the ones its own login needs (it builds its client id from
# Host and only accepts changes and the live channel from the page's Origin), so they are forwarded unchanged.
REQUEST_HEADERS = {
    "host", "origin", "accept", "accept-language", "content-type", "content-length", "user-agent",
    "cache-control", "pragma", "range", "if-range", "if-none-match", "if-modified-since", "if-unmodified-since",
}
# Belt and braces: these never go to the plan, even when a name is added to REQUEST_HEADERS by mistake.
REQUEST_DENIED = ("authorization", "x-remote-user-", "x-hassio-", "x-supervisor-", "x-ingress-", "x-forwarded-", "forwarded")

# Response headers that belong to this hop, to the proxy, or to Home Assistant's address. Set-Cookie and Content-Length are handled
# separately (only the plan's own cookies, and a length only while the body is passed on unchanged).
RESPONSE_SKIP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding",
    "upgrade", "content-encoding", "server", "date", "alt-svc",
    "strict-transport-security",          # the plan must not set HSTS for Home Assistant's host
}

_COOKIE_NAME = re.compile(r"^\s*([A-Za-z0-9_.-]+)\s*=")


def plan_path(path: str) -> str:
    """the plan's path for a request this integration got: '/floorplan/api/layout' -> '/api/layout', '/floorplan/' -> '/'"""
    rest = str(path or "")
    if rest.startswith(const.PATH):
        rest = rest[len(const.PATH):]
    return rest if rest.startswith("/") else "/" + rest


def plan_base(address: str, scheme: str = "http") -> str:
    """the plan's address without a trailing '/', with ws/wss for the live channel"""
    base = str(address or const.DEFAULT_ADDRESS).rstrip("/")
    if scheme == "ws":
        return "wss" + base[5:] if base.startswith("https") else "ws" + base[4:]
    return base


def plan_url(address: str, path: str, query: str = "", scheme: str = "http") -> str:
    """'/floorplan/api/layout' + 'house=main' -> '<address>/api/layout?house=main'"""
    url = plan_base(address, scheme) + plan_path(path)
    return f"{url}?{query}" if query else url


def _origin(url: str):
    """(scheme, host, port) of an http(s) URL, or None; used to keep an authorization code on the plan or Home Assistant"""
    try:
        parts = urlsplit(str(url or ""))
        port = parts.port
    except ValueError:
        return None
    if parts.scheme not in ("http", "https") or not parts.hostname:
        return None
    if port is None:
        port = 443 if parts.scheme == "https" else 80
    return parts.scheme, parts.hostname.lower().rstrip("."), port


def login_client_id_allowed(address: str, client_id: str, ha_host: str = "") -> bool:
    """Home Assistant must not mint a code for a client the plan just made up. The plan's own login announces either its own
    address (the handshake talks to it directly) or the Home Assistant address the browser used (through /floorplan/); both are
    accepted, anything else is refused before an authorization code exists."""
    client = _origin(client_id)
    if client is None:
        return False
    if client == _origin(address):
        return True
    if ha_host:
        try:
            ha = urlsplit("//" + str(ha_host))
            port = ha.port
        except ValueError:
            return False
        if ha.hostname and client[1] == ha.hostname.lower().rstrip("."):
            expected = port if port is not None else (443 if client[0] == "https" else 80)
            return client[2] == expected
    return False


def proxy_location(location: str, address: str) -> str:
    """an absolute redirect to the plan's own address -> the same path under /floorplan/, so the browser stays on Home Assistant"""
    target = _origin(location)
    if target is None or target != _origin(address):
        return location
    try:
        parts = urlsplit(str(location))
    except ValueError:
        return location
    path = parts.path or "/"
    query = f"?{parts.query}" if parts.query else ""
    fragment = f"#{parts.fragment}" if parts.fragment else ""
    return f"{const.PATH}{path}{query}{fragment}"


def plan_cookies(cookie_header: str) -> str:
    """only the plan's own cookies out of the browser's Cookie header"""
    keep = []
    for part in str(cookie_header or "").split(";"):
        name = part.split("=", 1)[0].strip()
        if name in (const.LOGIN_COOKIE, const.SESSION_COOKIE) and part.strip():
            keep.append(part.strip())
    return "; ".join(keep)


def needs_session(path: str, cookie_header: str) -> bool:
    """a request of the plan without the plan's session cookie (its own login pages under /auth/ aside): the integration answers it
    itself, so a plan that runs without its login (no HA_TOKEN) is never open to everybody who can reach Home Assistant"""
    if plan_path(path).startswith("/auth/"):
        return False
    names = {part.split("=", 1)[0].strip() for part in str(cookie_header or "").split(";")}
    return const.SESSION_COOKIE not in names


def headers_to_plan(headers, scheme: str = "http", host: str = "") -> dict:
    """what goes to the plan: its own cookies, the address the browser used, and nothing that says who asks in Home Assistant"""
    out = {}
    for name, value in headers.items():
        low = name.lower()
        if low not in REQUEST_HEADERS or low.startswith(REQUEST_DENIED):
            continue
        out[name] = value
    # Host is the browser's resolved host, not the raw header: behind a reverse proxy Home Assistant clones the request with
    # X-Forwarded-Host in request.host while the raw Host header still names the internal address. The plan builds its client id
    # and checks Origin/websocket requests against Host, so both must be the browser's address.
    if host:
        out["Host"] = host
    cookies = plan_cookies(headers.get("Cookie", ""))
    if cookies:
        out["Cookie"] = cookies
    # The plan builds its client id (and its session cookie) from the scheme; asking for no compression keeps a forwarded
    # Content-Length true.
    out["X-Forwarded-Proto"] = "https" if scheme == "https" else "http"
    out["Accept-Encoding"] = "identity"
    return out


def plan_set_cookie(value: str):
    """one of the plan's Set-Cookie headers, without a Domain: the plan may set its own cookie for Home Assistant's address, not for
    a whole domain, and never Home Assistant's cookies"""
    match = _COOKIE_NAME.match(str(value or ""))
    if not match or match[1] not in (const.LOGIN_COOKIE, const.SESSION_COOKIE):
        return None
    parts = [part for part in str(value).split(";") if not part.strip().lower().startswith("domain=")]
    return ";".join(parts)


def headers_to_browser(headers, keep_length: bool = True):
    """the plan's answer without the headers of this hop, without HSTS for Home Assistant's host, and with only the plan's cookies"""
    out = []
    for name, value in headers:
        low = name.lower()
        if low == "content-length":
            if keep_length:
                out.append((name, value))
            continue
        if low == "set-cookie":
            cookie = plan_set_cookie(value)
            if cookie:
                out.append(("Set-Cookie", cookie))
            continue
        if low in RESPONSE_SKIP:
            continue
        out.append((name, value))
    return out


def login_parameters(location: str):
    """(client_id, state) out of the plan's redirect to Home Assistant's login page, else None (no login started, or a redirect this
    integration does not understand)"""
    try:
        query = parse_qs(urlsplit(str(location or "")).query)
    except ValueError:
        return None
    client_id = (query.get("client_id") or [""])[0].strip()
    state = (query.get("state") or [""])[0].strip()
    if not client_id.startswith(("http://", "https://")) or not state or len(state) > 512:
        return None
    return client_id, state


def login_credential(credentials):
    """the credential an authorization code is made with: a Home Assistant login, else the first one the user has (a long-lived
    token, a trusted network or a legacy API password works too)"""
    items = list(credentials or [])
    for credential in items:
        if getattr(credential, "auth_provider_type", "") == "homeassistant":
            return credential
    return items[0] if items else None


def session_cookie_attributes(max_age, secure: bool) -> dict:
    """the attributes of the session cookie the browser gets: the plan's own lifetime (it renews the session itself), hardened and
    on Home Assistant's address"""
    try:
        seconds = int(max_age)
    except (TypeError, ValueError):
        seconds = 0
    return {"path": "/", "httponly": True, "samesite": "Lax", "secure": bool(secure),
            **({"max_age": seconds} if seconds > 0 else {})}


def normalise_address(value) -> str:
    """the address the dialog accepted, as the proxy uses it: '192.168.1.10:8100/' -> 'http://192.168.1.10:8100', '' when it is not
    an http(s) address"""
    text = str(value or "").strip()
    if not text:
        return ""
    if "://" not in text:
        text = "http://" + text
    try:
        parts = urlsplit(text)
        port = parts.port
    except ValueError:
        return ""
    if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
        return ""
    if parts.query or parts.fragment:
        return ""
    host = f"[{parts.hostname}]" if ":" in parts.hostname else parts.hostname
    return f"{parts.scheme}://{host}{f':{port}' if port else ''}{parts.path.rstrip('/')}"
