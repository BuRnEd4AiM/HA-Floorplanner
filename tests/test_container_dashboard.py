"""The 3D Floorplan (Container) integration and the dashboard card it brings itself (container/custom_components/floorplan3d): the
boundary between Home Assistant and the plan, the reverse proxy against a fake plan, the plan's own login driven server side, the
pages the integration serves itself, and the contract with the container it drives.

const.py, boundary.py and pages.py are pure, handshake.py and web_proxy.py need aiohttp only, so all of them run here; __init__.py and
config_flow.py need Home Assistant and cannot. The package is put into sys.modules without its __init__.py for that reason.
"""
import importlib
import json
import re
import socket
import sys
import types
from pathlib import Path
from types import SimpleNamespace

import aiohttp
import pytest
from aiohttp import web

ROOT = Path(__file__).parent.parent
PKG = ROOT / "container" / "custom_components" / "floorplan3d"

if "floorplan3d" not in sys.modules:
    package = types.ModuleType("floorplan3d")
    package.__path__ = [str(PKG)]        # the package, without running its __init__.py (that one imports Home Assistant)
    sys.modules["floorplan3d"] = package
boundary = importlib.import_module("floorplan3d.boundary")
const = importlib.import_module("floorplan3d.const")
handshake = importlib.import_module("floorplan3d.handshake")
pages = importlib.import_module("floorplan3d.pages")
web_proxy = importlib.import_module("floorplan3d.web_proxy")
CARD = PKG / "frontend" / const.CARD_FILE


def free_port() -> int:
    with socket.socket() as free:
        free.bind(("127.0.0.1", 0))
        return free.getsockname()[1]      # bound and closed again: nothing listens there


# ---------- the boundary: what may cross it ----------

def test_the_prefix_goes_and_the_rest_stays():
    assert boundary.plan_path("/floorplan") == "/"
    assert boundary.plan_path("/floorplan/") == "/"
    assert boundary.plan_path("/floorplan/app.js") == "/app.js"
    assert boundary.plan_path("/floorplan/api/layout") == "/api/layout"
    assert boundary.plan_path("/floorplan/a%20b.glb") == "/a%20b.glb"      # encoded stays encoded


def test_the_address_of_the_plan():
    assert boundary.plan_url("http://127.0.0.1:8100/", "/floorplan/api/layout", "x=1") == \
        "http://127.0.0.1:8100/api/layout?x=1"
    assert boundary.plan_url("http://127.0.0.1:8100", "/floorplan/") == "http://127.0.0.1:8100/"
    assert boundary.plan_url("http://127.0.0.1:8100", "/floorplan/", "card=1&theme=dark") == \
        "http://127.0.0.1:8100/?card=1&theme=dark"
    # the live channel keeps the transport's security
    assert boundary.plan_url("http://127.0.0.1:8100", "/floorplan/api/live", scheme="ws") == \
        "ws://127.0.0.1:8100/api/live"
    assert boundary.plan_url("https://plan.example.org/", "/floorplan/api/live", "a=1", "ws") == \
        "wss://plan.example.org/api/live?a=1"


def test_home_assistants_session_cookie_and_the_token_never_go_to_the_plan():
    """the plan has its own login; handing it Home Assistant's session cookie or Bearer token would let it act as the user, and
    X-Remote-User-* would count as a login if the plan ever ran behind the Supervisor"""
    sent = boundary.headers_to_plan({
        "Host": "ha.example.org",
        "Cookie": "hassio_session=SECRET; fp3d_session=fp-session; fp3d_login=fp-login; ingress_session=OTHER",
        "Authorization": "Bearer TOKEN",
        "X-Remote-User-Name": "admin",
        "X-Remote-User-Id": "abc",
        "X-Hassio-Key": "supervisor",
        "X-Forwarded-For": "1.2.3.4",
        "X-Forwarded-Proto": "http",
        "Referer": "https://ha.example.org/lovelace/0",
        "Content-Type": "application/json",
        "Origin": "https://ha.example.org",
        "Accept-Encoding": "gzip, br",
    }, "https")
    assert sent["Host"] == "ha.example.org"
    assert sent["Origin"] == "https://ha.example.org"
    assert sent["Content-Type"] == "application/json"
    assert sent["Cookie"] == "fp3d_session=fp-session; fp3d_login=fp-login"
    # the plan builds its client id from the scheme, and identity keeps a forwarded Content-Length true
    assert sent["X-Forwarded-Proto"] == "https"
    assert sent["Accept-Encoding"] == "identity"
    joined = " ".join(f"{name}: {value}" for name, value in sent.items())
    for secret in ("SECRET", "TOKEN", "admin", "1.2.3.4", "OTHER", "lovelace"):
        assert secret not in joined, f"{secret} went to the plan"
    assert "Authorization" not in sent and "X-Forwarded-For" not in sent


def test_the_websocket_handshake_is_the_proxys_own():
    """aiohttp replaces Sec-WebSocket-Key but not the browser's Sec-WebSocket-Extensions: forwarding them would leave the proxy with
    compressed frames it never agreed to decode"""
    sent = boundary.headers_to_plan({"Upgrade": "websocket", "Connection": "Upgrade", "Sec-WebSocket-Key": "key",
                                     "Sec-WebSocket-Version": "13", "Sec-WebSocket-Extensions": "permessage-deflate",
                                     "Origin": "https://ha.example.org"}, "https")
    for header in ("Upgrade", "Connection", "Sec-WebSocket-Key", "Sec-WebSocket-Version", "Sec-WebSocket-Extensions"):
        assert header not in sent
    assert sent["Origin"] == "https://ha.example.org"                       # the plan's own same-origin check needs it


def test_only_the_plans_own_cookies_come_back_and_never_for_a_whole_domain():
    """a forwarded Set-Cookie is a cookie on Home Assistant's address: the plan may set its own, not Home Assistant's, and not for
    every host of the domain"""
    out = boundary.headers_to_browser([
        ("Content-Type", "text/html"),
        ("Content-Length", "5"),
        ("ETag", '"x"'),
        ("Cache-Control", "no-cache"),
        ("Connection", "keep-alive"),
        ("Strict-Transport-Security", "max-age=31536000; includeSubDomains"),
        ("Set-Cookie", "fp3d_session=abc; Path=/; HttpOnly"),
        ("Set-Cookie", "hassio_session=evil; Path=/"),
        ("Set-Cookie", "fp3d_login=x; Domain=.example.org; Path=/"),
        ("Set-Cookie", "other=1; Path=/"),
    ])
    names = [name for name, _ in out]
    assert ("Content-Type", "text/html") in out and ("ETag", '"x"') in out
    assert ("Content-Length", "5") in out                 # identity: the length is the length of the bytes
    assert "Connection" not in names
    assert "Strict-Transport-Security" not in names       # not for Home Assistant's host
    cookies = [value for name, value in out if name == "Set-Cookie"]
    assert cookies == ["fp3d_session=abc; Path=/; HttpOnly", "fp3d_login=x; Path=/"]
    # a body that is not forwarded as it came (HEAD, 204, 304) has no length
    assert ("Content-Length", "5") not in boundary.headers_to_browser([("Content-Length", "5")], keep_length=False)
    assert boundary.plan_set_cookie("sessionid=1") is None
    assert boundary.plan_set_cookie("") is None


def test_the_plan_sees_the_browser_host_not_the_internal_one():
    """behind Home Assistant's reverse-proxy middleware request.host is the browser's host while the raw Host header still names
    the internal address; the plan checks Origin and websocket requests against Host"""
    sent = boundary.headers_to_plan({"Host": "127.0.0.1:8123", "Origin": "https://ha.example.org"}, "https",
                                    host="ha.example.org")
    assert sent["Host"] == "ha.example.org"
    assert sent["Origin"] == "https://ha.example.org"
    # without a resolved host the raw header is still better than nothing
    assert boundary.headers_to_plan({"Host": "ha.example.org"}, "http")["Host"] == "ha.example.org"


def test_an_authorization_code_only_goes_to_the_plan_or_home_assistant():
    assert boundary.login_client_id_allowed("http://192.168.1.10:8100", "http://192.168.1.10:8100/")
    assert boundary.login_client_id_allowed("https://ha.example.org", "https://ha.example.org/")
    assert boundary.login_client_id_allowed("http://192.168.1.10:8100", "https://ha.example.org/", "ha.example.org")
    for other in ("https://evil.example.org/", "http://192.168.1.10:8101/", "file:///etc/passwd", "",
                  "https://ha.example.org:8443/"):
        assert not boundary.login_client_id_allowed("http://192.168.1.10:8100", other, "ha.example.org"), other


def test_a_redirect_to_the_plans_own_address_stays_under_the_prefix():
    assert boundary.proxy_location("http://192.168.1.10:8100/login?x=1", "http://192.168.1.10:8100") == \
        "/floorplan/login?x=1"
    assert boundary.proxy_location("https://plan.example.org/", "https://plan.example.org") == "/floorplan/"
    # another host, a relative redirect and Home Assistant's own address are left alone
    assert boundary.proxy_location("https://evil.example.org/x", "http://192.168.1.10:8100") == "https://evil.example.org/x"
    assert boundary.proxy_location("login", "http://192.168.1.10:8100") == "login"
    assert boundary.proxy_location("https://ha.example.org/auth/callback", "http://192.168.1.10:8100") == \
        "https://ha.example.org/auth/callback"


def test_the_login_is_read_out_of_the_plans_redirect():
    location = ("https://ha.example.org/auth/authorize?response_type=code"
                "&client_id=https%3A%2F%2Fha.example.org%2F"
                "&redirect_uri=https%3A%2F%2Fha.example.org%2Fauth%2Fcallback&state=abc123")
    assert boundary.login_parameters(location) == ("https://ha.example.org/", "abc123")
    for junk in ("", "/auth/login", "https://ha.example.org/", "https://ha/?state=s", "https://ha/?client_id=x&state=s",
                 "https://ha/?client_id=https://ha/&state=", "https://ha/?client_id=https://ha/&state=" + "s" * 600, None):
        assert boundary.login_parameters(junk) is None


def test_the_credential_the_code_is_signed_with():
    """a user may have a long-lived token, a trusted network or a legacy password as well: the Home Assistant login is preferred,
    any other still works (the plan only needs who it is)"""
    password = SimpleNamespace(auth_provider_type="homeassistant")
    token = SimpleNamespace(auth_provider_type="long_lived_access_token")
    assert boundary.login_credential([token, password]) is password
    assert boundary.login_credential([token]) is token
    assert boundary.login_credential([]) is None
    assert boundary.login_credential(None) is None


def test_the_session_cookie_takes_the_plans_lifetime_but_not_its_attributes():
    """the plan renews its session itself, so its Max-Age is kept; the cookie is set on Home Assistant's address instead: hardened,
    path / — and without a max-age it stays a browser-session cookie instead of inventing a lifetime"""
    https = boundary.session_cookie_attributes(2592000, True)
    assert https == {"path": "/", "httponly": True, "samesite": "Lax", "secure": True, "max_age": 2592000}
    assert boundary.session_cookie_attributes(None, False) == {"path": "/", "httponly": True, "samesite": "Lax", "secure": False}
    assert "max_age" not in boundary.session_cookie_attributes("", False)


def test_the_address_in_the_dialog_is_normalised():
    assert boundary.normalise_address("192.168.1.10:8100") == "http://192.168.1.10:8100"
    assert boundary.normalise_address("  http://192.168.1.10:8100/  ") == "http://192.168.1.10:8100"
    assert boundary.normalise_address("https://plan.example.org") == "https://plan.example.org"
    assert boundary.normalise_address("http://[fd00::5]:8100") == "http://[fd00::5]:8100"
    assert boundary.normalise_address("plan.example.org/plan") == "http://plan.example.org/plan"
    for junk in ("", "   ", "ftp://x", "http://", "http://x/?a=1", "http://x/#a", "http://user:pw@x", "://x"):
        assert boundary.normalise_address(junk) == "", junk


# ---------- the two pages the integration serves itself ----------

def test_a_browser_without_a_session_gets_a_sign_in_page_and_comes_back_to_the_plan():
    page = pages.sign_in_page("/floorplan/?card=1&theme=dark", const.SESSION_PATH)
    target = json.loads(re.search(r'const target = (".*?");', page)[1])
    assert target == "/floorplan/?card=1&theme=dark"                  # where the browser goes on after the sign-in
    assert const.SESSION_PATH in page                                 # ... and posts the session itself
    assert "hassTokens" in page                                       # the token Home Assistant's own frontend keeps
    assert 'tokens.clientId || location.origin + "/"' in page         # refresh with the token's own client id
    assert "/auth/authorize" not in page                              # no redirect that would end on a page Home Assistant does not serve


def test_a_crafted_address_cannot_break_out_of_the_sign_in_page():
    """the target comes from the request's query string"""
    for target in ('</script><script>alert(1)</script>', 'a";alert(1);//', 'x</SCRIPT >y'):
        page = pages.sign_in_page(target, const.SESSION_PATH)
        assert page.count("</script>") == 1
        assert "<script>alert(1)</script>" not in page


def test_the_not_ready_page_says_what_to_do():
    page = pages.not_ready_page()
    assert "Geräte" in page and "Devices" in page
    assert "neu starten" not in page and "restart Home Assistant" not in page


# ---------- the HTTP part, against a fake plan ----------

def plan_app(*routes):
    app = web.Application()
    app.add_routes(list(routes))
    return app


async def serve(aiohttp_client, address, session=True):
    """the proxy as a browser sees it, pointed at `address` (a fake plan); session: the browser has the plan's session cookie"""
    app = web.Application()
    plan = web_proxy.Proxy(address)
    app.router.add_route("*", f"{const.PATH}/{{path:.*}}", plan.handle)
    app.router.add_route("*", const.PATH, plan.handle)

    async def close(_app):
        await plan.close()

    app.on_cleanup.append(close)
    return await aiohttp_client(app, headers={"Cookie": "fp3d_session=browser"} if session else None)


async def test_a_request_reaches_the_plan_as_a_request_of_this_address(aiohttp_client):
    seen = {}

    async def layout(request):
        seen["path"], seen["query"] = request.path, request.query_string
        seen["headers"] = dict(request.headers)
        return web.Response(text="ok")

    upstream = await aiohttp_client(plan_app(web.get("/api/layout", layout)))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"))
    answer = await plan.get("/floorplan/api/layout?house=main", headers={
        "Host": "ha.example.org",
        "Cookie": "hassio_session=SECRET; fp3d_session=sess",
        "Authorization": "Bearer TOKEN",
        "X-Remote-User-Name": "admin",
        "Origin": "https://ha.example.org",
    })
    assert answer.status == 200 and await answer.text() == "ok"
    assert seen["path"] == "/api/layout" and seen["query"] == "house=main"
    assert seen["headers"]["Host"] == "ha.example.org"                 # the plan builds its own address from it
    assert seen["headers"]["Cookie"] == "fp3d_session=sess"
    assert seen["headers"]["Origin"] == "https://ha.example.org"
    assert "Authorization" not in seen["headers"] and "X-Remote-User-Name" not in seen["headers"]


async def test_the_answer_is_streamed_and_stays_the_plans(aiohttp_client):
    body = b"x" * 300_000

    async def big(request):
        answer = web.Response(body=body, headers={"Content-Type": "application/octet-stream",
                                                  "Strict-Transport-Security": "max-age=31536000"})
        answer.headers.add("Set-Cookie", "fp3d_session=abc; Path=/")
        answer.headers.add("Set-Cookie", "hassio_session=evil; Path=/")
        return answer

    upstream = await aiohttp_client(plan_app(web.get("/big", big)))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"))
    answer = await plan.get("/floorplan/big")
    assert answer.status == 200
    assert len(await answer.read()) == 300_000
    assert answer.headers["Content-Length"] == "300000"                 # not buffered, and the length is true
    assert list(answer.headers.getall("Set-Cookie")) == ["fp3d_session=abc; Path=/"]
    assert "Strict-Transport-Security" not in answer.headers


async def test_head_and_not_modified_pass_through(aiohttp_client):
    async def big(request):
        return web.Response(body=b"y" * 4096, headers={"Content-Type": "application/octet-stream"})

    async def fresh(request):
        return web.Response(status=304, headers={"ETag": '"v1"'})

    upstream = await aiohttp_client(plan_app(web.get("/big", big), web.get("/fresh", fresh)))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"))
    head = await plan.head("/floorplan/big")
    assert head.status == 200 and head.headers["Content-Length"] == "4096" and await head.read() == b""
    fresh_answer = await plan.get("/floorplan/fresh")
    assert fresh_answer.status == 304 and fresh_answer.headers["ETag"] == '"v1"' and await fresh_answer.read() == b""


async def test_an_upload_goes_through_without_being_buffered(aiohttp_client):
    """the plan's backups are up to 200 MB: they are streamed, so Home Assistant's own request size limit does not apply"""
    async def restore(request):
        return web.json_response({"n": len(await request.read())})

    upstream = await aiohttp_client(plan_app(web.post("/api/backups/restore", restore)))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"))
    answer = await plan.post("/floorplan/api/backups/restore", data=b"z" * 500_000,
                             headers={"Content-Type": "application/octet-stream"})
    assert (await answer.json())["n"] == 500_000


async def test_the_plans_cookies_do_not_leak_between_browsers(aiohttp_client):
    """the proxy's ClientSession is shared by every browser; a session cookie the plan set for one request must not be replayed
    with another browser's request. Use a hostname: aiohttp's CookieJar ignores IP hosts, which hid this bug."""
    seen = []

    async def set_cookie(request):
        answer = web.Response(text="set")
        answer.headers.add("Set-Cookie", "fp3d_session=LEAK; Path=/")
        return answer

    async def echo(request):
        seen.append(request.headers.get("Cookie"))
        return web.Response(text="ok")

    upstream = await aiohttp_client(plan_app(web.get("/set", set_cookie), web.get("/echo", echo)))
    address = str(upstream.make_url("")).replace("127.0.0.1", "localhost").rstrip("/")
    plan = await serve(aiohttp_client, address)
    first = await plan.get("/floorplan/set", headers={"Cookie": "fp3d_session=USERA"})
    assert first.status == 200 and await first.text() == "set"
    plan.session.cookie_jar.clear()                       # the test client also has a jar; it must not rewrite the next header
    second = await plan.get("/floorplan/echo", headers={"Cookie": "fp3d_session=USERB"})
    assert second.status == 200
    assert seen == ["fp3d_session=USERB"]                 # not LEAK from the shared jar


async def test_the_proxy_forwards_the_resolved_host(aiohttp_client):
    """Home Assistant's forwarded middleware clones the request with X-Forwarded-Host; the plan must see that host, not the raw
    internal Host header, or its same-origin check rejects writes and the websocket."""
    seen = {}

    async def echo(request):
        seen["host"] = request.headers.get("Host")
        return web.Response(text="ok")

    upstream = await aiohttp_client(plan_app(web.get("/x", echo)))
    address = str(upstream.make_url("")).rstrip("/")

    @web.middleware
    async def forwarded(request, handler):
        return await handler(request.clone(host="ha.example.org"))

    app = web.Application(middlewares=[forwarded])
    plan = web_proxy.Proxy(address)
    app.router.add_route("*", f"{const.PATH}/{{path:.*}}", plan.handle)

    async def close(_app):
        await plan.close()

    app.on_cleanup.append(close)
    client = await aiohttp_client(app)
    answer = await client.get("/floorplan/x", headers={"Host": "internal.example.org:8123", "Cookie": "fp3d_session=s"})
    assert answer.status == 200
    assert seen["host"] == "ha.example.org"


async def test_an_encoded_path_reaches_the_plan_as_it_was_sent(aiohttp_client):
    seen = {}

    async def echo(request):
        seen["raw_path"] = request.raw_path
        return web.Response(text="ok")

    upstream = await aiohttp_client(plan_app(web.get("/{path:.*}", echo)))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"))
    answer = await plan.get("/floorplan/a%2Fb.glb")
    assert answer.status == 200
    assert seen["raw_path"] == "/a%2Fb.glb"               # request.path would have turned it into /a/b.glb


async def test_a_redirect_to_the_plans_own_address_is_rewritten(aiohttp_client):
    address = None

    async def go(request):
        return web.Response(status=302, headers={"Location": f"{address}/next?x=1"})

    upstream = await aiohttp_client(plan_app(web.get("/go", go)))
    address = str(upstream.make_url("")).rstrip("/")
    plan = await serve(aiohttp_client, address)
    answer = await plan.get("/floorplan/go", allow_redirects=False)
    assert answer.status == 302
    assert answer.headers["Location"] == "/floorplan/next?x=1"


async def test_only_web_methods_are_forwarded(aiohttp_client):
    upstream = await aiohttp_client(plan_app(web.get("/x", lambda request: web.Response(text="ok"))))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"))
    answer = await plan.request("TRACE", "/floorplan/x")
    assert answer.status == 405
    assert "GET" in answer.headers["Allow"]


async def test_a_browser_without_a_session_does_not_end_on_a_page_home_assistant_does_not_serve(aiohttp_client):
    """the plan redirects to auth/login for every page request (here: its session ran out); following that ends on Home Assistant's
    /auth/callback (404)"""
    asked = []

    async def root(request):
        asked.append(request.path)
        return web.Response(status=302, headers={"Location": "auth/login?card=1"})

    upstream = await aiohttp_client(plan_app(web.get("/", root)))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"))

    page = await plan.get("/floorplan/?card=1", headers={"Accept": "text/html"})
    assert page.status == 200 and 'const target = "/floorplan/?card=1"' in await page.text()
    # a script's request gets the plan's own answer: only a navigation is turned into the sign-in page
    data = await plan.get("/floorplan/?card=1", headers={"Accept": "application/json"}, allow_redirects=False)
    assert data.status == 302 and data.headers["Location"] == "auth/login?card=1"

    # the plan's own login page (the page's login.js goes there) is not forwarded either: the browser is signed in instead
    asked.clear()
    login = await plan.get("/floorplan/auth/login?card=1", headers={"Accept": "text/html"}, allow_redirects=False)
    assert login.status == 200 and 'const target = "/floorplan/?card=1"' in await login.text()
    assert asked == []


async def test_nothing_reaches_the_plan_without_its_session(aiohttp_client):
    """a second lock besides the plan's own login: a plan started without HA_TOKEN (no login) is still not open to everybody who
    can reach Home Assistant"""
    asked = []

    async def anything(request):
        asked.append(request.path)
        return web.Response(text="open")

    upstream = await aiohttp_client(plan_app(web.get("/{path:.*}", anything)))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"), session=False)
    page = await plan.get("/floorplan/", headers={"Accept": "text/html"})
    assert page.status == 200 and 'const target = "/floorplan/"' in await page.text()
    data = await plan.get("/floorplan/api/layout", headers={"Cookie": "fp3d_login=x; hassio_session=y"})
    assert data.status == 401 and data.headers["X-Login"] == "1"
    with pytest.raises(aiohttp.WSServerHandshakeError) as refused:
        await plan.ws_connect("/floorplan/api/live")
    assert refused.value.status == 401
    assert await (await plan.get("/floorplan/auth/logout")).text() == "open"      # the plan's own login pages stay reachable
    assert asked == ["/auth/logout"]


def test_only_the_plans_login_pages_go_without_its_session():
    assert boundary.needs_session("/floorplan/api/layout", "")
    assert boundary.needs_session("/floorplan/", "fp3d_login=x; fp3d_session_old=y")
    assert not boundary.needs_session("/floorplan/api/layout", "a=1; fp3d_session=s")
    assert not boundary.needs_session("/floorplan/auth/callback", "")


async def test_a_dead_plan_is_a_502(aiohttp_client):
    plan = await serve(aiohttp_client, f"http://127.0.0.1:{free_port()}")
    answer = await plan.get("/floorplan/api/version")
    assert answer.status == 502 and (await answer.json())["error"] == "plan unreachable"


async def test_the_live_channel_relays_both_ways(aiohttp_client):
    async def live(request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        async for message in ws:
            if message.type == aiohttp.WSMsgType.TEXT:
                await ws.send_str(f"echo:{message.data}")
            elif message.type == aiohttp.WSMsgType.BINARY:
                await ws.send_bytes(message.data)
        return ws

    upstream = await aiohttp_client(plan_app(web.get("/api/live", live)))
    plan = await serve(aiohttp_client, str(upstream.make_url("")).rstrip("/"))
    browser = await plan.ws_connect("/floorplan/api/live", headers={"Cookie": "fp3d_session=s",
                                                                    "Origin": "https://ha.example.org"})
    try:
        await browser.send_str("hello")
        answer = await browser.receive(timeout=5)
        assert answer.type == aiohttp.WSMsgType.TEXT and answer.data == "echo:hello"
        await browser.send_bytes(b"\x00\x01")
        binary = await browser.receive(timeout=5)
        assert binary.type == aiohttp.WSMsgType.BINARY and binary.data == b"\x00\x01"
    finally:
        await browser.close()


async def test_the_live_channel_of_a_dead_plan_is_a_502(aiohttp_client):
    plan = await serve(aiohttp_client, f"http://127.0.0.1:{free_port()}")
    with pytest.raises(aiohttp.WSServerHandshakeError) as failure:
        await plan.ws_connect("/floorplan/api/live")
    assert failure.value.status == 502


# ---------- the plan's own login, driven server side ----------

GOOD_REDIRECT = ("https://ha.example.org/auth/authorize?response_type=code"
                 "&client_id=https%3A%2F%2Fha.example.org%2F&state=state123")


async def fake_login(aiohttp_client, redirect=GOOD_REDIRECT, login_cookie="signed-login", session=True, seen=None):
    """a plan that logs in like the container version"""
    async def login(request):
        answer = web.Response(status=302, headers={"Location": redirect})
        if login_cookie:
            answer.set_cookie(const.LOGIN_COOKIE, login_cookie)
        return answer

    async def callback(request):
        if seen is not None:
            seen.update(request.query)
            seen["cookie"] = request.cookies.get(const.LOGIN_COOKIE)
        answer = web.Response(status=302)
        if session:
            answer.set_cookie(const.SESSION_COOKIE, "session-value", max_age=2592000, path="/")
        return answer

    client = await aiohttp_client(plan_app(web.get("/auth/login", login), web.get("/auth/callback", callback)))
    return str(client.make_url("")).rstrip("/")


async def test_the_login_starts_where_the_plan_says(aiohttp_client):
    base = await fake_login(aiohttp_client)
    async with aiohttp.ClientSession() as session:
        login = await handshake.begin(session, base)
    assert login.cookie == "signed-login"
    assert login.client_id == "https://ha.example.org/"      # what Home Assistant must sign the code for
    assert login.state == "state123"


async def test_the_session_comes_from_the_plans_own_callback(aiohttp_client):
    seen = {}
    base = await fake_login(aiohttp_client, seen=seen)
    async with aiohttp.ClientSession() as session:
        plan_session = await handshake.exchange(session, base, "the-code", "state123", "signed-login")
    assert seen == {"code": "the-code", "state": "state123", "cookie": "signed-login"}
    assert plan_session.value == "session-value"
    assert plan_session.max_age == 2592000                    # the plan's own lifetime, not one this integration invents


async def test_the_dialog_checks_the_address_against_the_plans_login(aiohttp_client):
    assert await handshake.probe(await fake_login(aiohttp_client)) is None
    # an add-on style container: no HA_LOGIN, /auth/login is 404
    assert await handshake.probe(await fake_login(aiohttp_client, login_cookie=None)) == "cannot_start_login"
    # something else answers, or a plan that does not announce a login
    assert await handshake.probe(await fake_login(aiohttp_client, redirect="/auth/login")) == "login_incomplete"
    assert await handshake.probe(f"http://127.0.0.1:{free_port()}") == "cannot_connect"


async def test_a_plan_without_a_session_cookie_is_an_error(aiohttp_client):
    base = await fake_login(aiohttp_client, session=False)
    async with aiohttp.ClientSession() as session:
        with pytest.raises(handshake.PlanError) as failure:
            await handshake.exchange(session, base, "code", "state123", "signed-login")
    assert failure.value.reason == "no_session"


# ---------- the contract with the container, the packaging and the card ----------

def test_the_login_this_integration_walks_is_still_the_containers():
    """the integration depends on the plan's own login: the cookie names, the routes and the redirect it reads client id and state
    from. This test fails when that changes, instead of the login failing silently at a user's dashboard."""
    app = ROOT / "floorplan3d" / "rootfs" / "app"
    halogin = (app / "halogin.py").read_text("utf-8")
    server = (app / "server.py").read_text("utf-8")
    assert f'LOGIN_COOKIE = "{const.LOGIN_COOKIE}"' in halogin
    assert f'SESSION_COOKIE = "{const.SESSION_COOKIE}"' in halogin
    assert '"client_id": client_id' in halogin and '"state": state' in halogin
    assert 'web.get("/auth/login", auth_login)' in server
    assert 'web.get("/auth/callback", auth_callback)' in server
    assert 'request.query.get("code"' in server and 'request.query.get("state"' in server
    assert 'cookies.get(hl.LOGIN_COOKIE)' in server                   # the callback needs the login cookie the proxy passes on


def test_the_integration_is_a_plain_home_assistant_custom_component():
    manifest = json.loads((PKG / "manifest.json").read_text("utf-8"))
    assert manifest["domain"] == const.DOMAIN
    assert manifest["config_flow"] is True                            # added in the UI, not configured in YAML
    assert manifest["dependencies"] == ["auth", "http"]               # both before the first request is served
    assert manifest["version"]
    for name in ("__init__.py", "config_flow.py", "const.py", "boundary.py", "handshake.py", "web_proxy.py", "pages.py"):
        assert (PKG / name).is_file()


def nested_keys(value, prefix=""):
    if isinstance(value, dict):
        return {f"{prefix}{key}" for key in value} | {
            nested for key, item in value.items() for nested in nested_keys(item, f"{prefix}{key}.")}
    return set()


def test_the_dialog_texts_exist_and_say_the_same_in_english():
    """a missing key is an empty dialog message; the error keys are the ones the code really returns"""
    flow = (PKG / "config_flow.py").read_text("utf-8")
    flow_errors = set(re.findall(r'errors\["base"\] = "(\w+)"', flow))
    flow_aborts = set(re.findall(r'async_abort\(reason="(\w+)"\)', flow))
    plan_errors = set(re.findall(r'PlanError\("(\w+)"\)',
                                 (PKG / "handshake.py").read_text("utf-8"))) - {"no_session"}
    strings = json.loads((PKG / "strings.json").read_text("utf-8"))["config"]
    english = json.loads((PKG / "translations" / "en.json").read_text("utf-8"))
    german = json.loads((PKG / "translations" / "de.json").read_text("utf-8"))
    chinese = json.loads((PKG / "translations" / "zh-Hans.json").read_text("utf-8"))
    assert english == {"config": strings}
    assert set(flow_errors | plan_errors | {"cannot_connect"}) <= set(strings["error"]), strings["error"]
    assert set(flow_aborts) <= set(strings["abort"]), strings["abort"]
    assert set(strings["error"]) <= set(english["config"]["error"])
    assert nested_keys(german) == nested_keys(english)
    assert nested_keys(chinese) == nested_keys(english)
    for step in ("user", "reconfigure"):
        assert strings["step"][step]["data"]["address"]


def test_the_pure_parts_stay_pure():
    """const, boundary and pages run in the tests without aiohttp and Home Assistant, like halogin.py"""
    for name in ("const.py", "boundary.py", "pages.py"):
        text = (PKG / name).read_text("utf-8")
        assert "import aiohttp" not in text and "from aiohttp" not in text, name
        assert "from homeassistant" not in text and "import homeassistant" not in text, name


def test_the_card_a_dashboard_loads_twice_still_works():
    """a resource URL with ?v=N next to the old one loads this file twice: defining the element twice throws, and without
    getCardSize()/customCards the card is sized wrong and missing from the card picker"""
    js = CARD.read_text("utf-8")
    assert "if (!customElements.get(TAG)) customElements.define(TAG" in js
    assert "getCardSize()" in js
    assert "window.customCards" in js
    assert f'callApi("POST", "{const.DOMAIN}/session")' in js          # the same endpoint the integration registers
    assert "getStubConfig() { return {}; }" in js                      # adding it from the picker needs no options


def test_the_integration_brings_its_own_card():
    """nothing to copy into /config/www and no dashboard resource by hand: the integration serves the card and loads it on every
    page, so it is in the card picker after Home Assistant has started once with the integration"""
    init = (PKG / "__init__.py").read_text("utf-8")
    manifest = json.loads((PKG / "manifest.json").read_text("utf-8"))
    assert "await hass.http.async_register_static_paths(" in init and "StaticPathConfig" in init
    assert "frontend.add_extra_js_url(" in init and "frontend.remove_extra_js_url(" in init
    assert "frontend" in manifest["after_dependencies"]              # the frontend is set up before the card is loaded
    assert const.FRONTEND_PATH == "/floorplan3d-card"
    assert CARD.is_file()


def test_the_card_and_the_integration_carry_one_name():
    """the tag and the picker entry are what a user sees: they follow the integration's domain"""
    js = CARD.read_text("utf-8")
    manifest = json.loads((PKG / "manifest.json").read_text("utf-8"))
    assert f'const TAG = "{const.DOMAIN}-container-card";' in js
    assert f'const DEFAULT_BASE = "{const.PATH}/";' in js                # the plan this integration serves
    assert manifest["name"] == "3D Floorplan (Container)"
    # the options of the add-on's card work here too: the plan reads them from its address (cardmode.js)
    for option in ("title", "house", "floor", "room", "view", "theme", "quality", "walls", "labels", "heatmap", "night",
                   "alerts", "idle_return", "room_panel", "show_nav", "show_bar", "tabs", "kiosk", "fill", "height", "url"):
        assert re.search(rf"\b{option}\b", js), f"the card option {option} is missing"
