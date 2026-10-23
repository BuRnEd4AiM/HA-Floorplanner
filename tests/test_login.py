"""The add-on without the Supervisor (Home Assistant as a Docker container, #489): only who logged in with Home Assistant gets the page and
its data, the Ingress headers count for nothing, the login comes back only to the browser that started it."""
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import pytest
from aiohttp import web

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import halogin as hl  # noqa: E402
import server  # noqa: E402


@pytest.fixture
async def ha(aiohttp_server, monkeypatch):
    """a Home Assistant with the add-on's token (an administrator's) and two users: u1 admin, u2 Anna"""
    seen = {"revoked": [], "codes": []}
    users = [{"id": "u1", "username": "admin", "name": "Admin", "group_ids": ["system-admin"], "is_owner": False, "is_active": True},
             {"id": "u2", "username": "anna", "name": "Anna Muster", "group_ids": ["system-users"], "is_owner": False, "is_active": True}]

    async def token(request):
        f = await request.post()
        seen["codes"].append(dict(f))
        if f.get("grant_type") != "authorization_code" or f.get("code") != "good" or f.get("client_id") != seen.get("cid"):
            return web.json_response({"error": "invalid_request"}, status=400)
        return web.json_response({"access_token": "user-tok", "refresh_token": "r1", "expires_in": 1800, "token_type": "Bearer"})

    async def revoke(request):
        seen["revoked"].append((await request.post()).get("token"))
        return web.Response(status=200)

    async def websocket(request):
        ws = web.WebSocketResponse(); await ws.prepare(request)
        await ws.send_json({"type": "auth_required"})
        tok = (await ws.receive_json())["access_token"]
        await ws.send_json({"type": "auth_ok"})
        msg = await ws.receive_json()
        if tok == "user-tok" and msg["type"] == "auth/current_user":
            await ws.send_json({"id": msg["id"], "type": "result", "success": True, "result": {"id": "u2", "name": "Anna Muster", "is_admin": False}})
        elif tok == "admin-tok" and msg["type"] == "config/auth/list":
            await ws.send_json({"id": msg["id"], "type": "result", "success": True, "result": users})
        else:
            await ws.send_json({"id": msg["id"], "type": "result", "success": False})
        await ws.close(); return ws
    app = web.Application()
    app.add_routes([web.post("/auth/token", token), web.post("/auth/revoke", revoke), web.get("/api/websocket", websocket)])
    srv = await aiohttp_server(app)
    url = f"http://localhost:{srv.port}"
    monkeypatch.setattr(server, "HA_LOGIN", True)
    monkeypatch.setattr(server, "HA_URL", url)
    monkeypatch.setattr(server, "HA_API", url + "/api")
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "admin-tok")
    monkeypatch.setattr(server, "OPTIONS_FILE", Path("/nonexistent/options.json"))
    monkeypatch.delenv("EDITORS", raising=False)
    server._admin_cache.update(at=float("-inf"), ids=None, users=[], active=None, byid={})
    seen.update(port=srv.port, users=users)
    yield seen
    server._admin_cache.update(at=float("-inf"), ids=None, users=[], active=None, byid={})


async def login(c, ha, code="good", query=""):
    r = await c.get("/auth/login" + query, allow_redirects=False)
    assert r.status == 302
    u = urlsplit(r.headers["Location"])
    q = {k: v[0] for k, v in parse_qs(u.query).items()}
    assert u.path == "/auth/authorize" and u.port == ha["port"] and q["redirect_uri"] == q["client_id"] + "auth/callback"
    ha["cid"] = q["client_id"]
    return await c.get(f"/auth/callback?code={code}&state={q['state']}", allow_redirects=False)


async def test_without_a_login_nothing_but_the_way_to_it(aiohttp_client, tmp_path, ha):
    c = await aiohttp_client(server.make_app(tmp_path))
    r = await c.get("/", allow_redirects=False)
    assert r.status == 302 and r.headers["Location"] == "auth/login"
    r = await c.get("/api/layout")
    assert r.status == 401 and r.headers["X-Login"] == "1"
    forged = {"X-Remote-User-Name": "admin", "X-Remote-User-Id": "u1"}                   # anybody could send these
    assert (await c.get("/api/me", headers=forged)).status == 401
    assert (await c.post("/api/service", json={"domain": "light", "service": "turn_on"}, headers=forged)).status == 401
    assert (await c.post("/api/backup", json={}, headers=forged)).status == 401                    # also the restore (its own sub-app)
    assert (await c.get("/api/live")).status == 401
    c.session.cookie_jar.update_cookies({hl.SESSION_COOKIE: hl.sign({"id": "u1", "exp": 9e9}, b"x" * 32)})
    assert (await c.get("/api/me")).status == 401                                        # a cookie not signed by this add-on


async def test_login_with_home_assistant(aiohttp_client, tmp_path, ha, monkeypatch):
    c = await aiohttp_client(server.make_app(tmp_path))
    r = await login(c, ha)
    assert r.status == 302 and r.headers["Location"] == "../"
    assert ha["revoked"] == ["r1"]                                                       # Home Assistant's token for the login is given back
    me = await (await c.get("/api/me", headers={"X-Remote-User-Name": "admin"})).json()   # the header counts for nothing
    assert me["user"] == "anna" and me["login"] is True and me["canEdit"] is False
    assert (await c.put("/api/layout", json={"version": 1, "floors": []})).status == 403
    assert (await c.get("/api/layout")).status == 200
    r = await c.post("/api/pinboard", json={"text": "Bin um 6 da"})
    assert (await r.json())["notes"][0]["by"] == "Anna Muster"
    monkeypatch.setenv("EDITORS", "Anna")                                                # editors in a container: the variable EDITORS
    assert (await (await c.get("/api/me")).json())["canEdit"] is True
    assert (await (await c.get("/")).text()).startswith("<!")
    # switched off in Home Assistant: out at once (the user list is asked again after a minute)
    ha["users"][1]["is_active"] = False
    server._admin_cache["at"] = float("-inf")
    assert (await c.get("/api/me")).status == 401


async def test_the_page_keeps_its_options_and_changes_come_only_from_it(aiohttp_client, tmp_path, ha):
    c = await aiohttp_client(server.make_app(tmp_path))
    r = await c.get("/?kiosk=1&room=Bad", allow_redirects=False)
    assert r.headers["Location"] == "auth/login?kiosk=1&room=Bad"
    r = await login(c, ha, query="?kiosk=1&room=Bad")
    assert r.status == 302 and r.headers["Location"] == "../?kiosk=1&room=Bad"                # the wall tablet stays a wall tablet
    plan = {"version": 1, "floors": []}
    here = f"http://{c.server.host}:{c.server.port}"
    r = await c.post("/api/pinboard", json={"text": "x"}, headers={"Origin": "http://evil.example"})
    assert r.status == 403 and (await r.json())["error"] == "not from this page"
    assert (await c.post("/api/pinboard", json={"text": "x"}, headers={"Origin": f"http://{c.server.host}:{ha['port']}"})).status == 403
    assert (await c.get("/api/live", headers={"Origin": "http://evil.example", "Upgrade": "websocket", "Connection": "Upgrade"})).status == 403
    assert (await c.post("/api/pinboard", json={"text": "x"}, headers={"Origin": here})).status == 200
    r = await c.put("/api/layout", json=plan, headers={"Origin": here})
    assert r.status == 403 and (await r.json())["error"] == "editing is not allowed for this user"     # from the page, but Anna is no editor
    assert (await c.get("/api/layout", headers={"Origin": "http://evil.example"})).status == 200     # reading: the browser keeps it from the other page


async def test_the_login_comes_back_only_to_where_it_started(aiohttp_client, tmp_path, ha):
    c = await aiohttp_client(server.make_app(tmp_path))
    r = await c.get("/auth/callback?code=good&state=" + "s" * 32, allow_redirects=False)   # no login started in this browser
    assert r.status == 400 and hl.SESSION_COOKIE not in r.cookies
    r = await login(c, ha, code="bad")                                                   # Home Assistant does not take the code
    assert r.status == 502 and hl.SESSION_COOKIE not in r.cookies
    assert (await c.get("/api/me")).status == 401


async def test_logout_and_a_cookie_that_runs_low(aiohttp_client, tmp_path, ha, monkeypatch):
    c = await aiohttp_client(server.make_app(tmp_path))
    assert (await login(c, ha)).status == 302
    r = await c.get("/api/me")
    assert r.status == 200 and hl.SESSION_COOKIE not in r.cookies                       # 30 days left: no new cookie
    now = server.time.time()
    monkeypatch.setattr(server.time, "time", lambda: now + 15 * 86400)
    r = await c.get("/api/me")
    assert r.status == 200 and hl.SESSION_COOKIE in r.cookies                           # 15 days left: 30 again
    r = await c.get("/auth/logout")
    assert r.status == 200 and "Abgemeldet" in await r.text()
    assert (await c.get("/api/me")).status == 401


async def test_with_the_supervisor_no_login(client, monkeypatch):
    monkeypatch.setattr(server, "HA_LOGIN", False)
    assert (await client.get("/auth/login", allow_redirects=False)).status == 404
    assert (await client.get("/api/me")).status == 200


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path))
