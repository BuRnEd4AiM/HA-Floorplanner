"""The reverse proxy: /floorplan/ on Home Assistant's own HTTP service, the plan's live channel, and the page for a browser without
a session.

aiohttp only, no Home Assistant (that is __init__.py), so tests/test_container_dashboard.py runs this against a fake plan: what
reaches the plan, what reaches the browser, streaming, redirects and the websocket relay. Which headers and cookies cross is decided
in boundary.py.
"""
from __future__ import annotations

import asyncio
import logging

import aiohttp
from aiohttp import web
from multidict import CIMultiDict

from . import boundary, const, pages

_LOGGER = logging.getLogger(__name__)

REDIRECTS = (301, 302, 303, 307, 308)
NO_BODY = (204, 304)
# The plan is a web application, not a proxy endpoint: CONNECT/TRACE have no meaning here and must not be passed on.
METHODS = frozenset({"GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"})


def is_page_request(request: web.Request) -> bool:
    """a navigation of the browser, not a call of the plan's own scripts"""
    return request.method == "GET" and "text/html" in request.headers.get("Accept", "")


def starts_login(answer: aiohttp.ClientResponse) -> bool:
    """the plan's answer for a browser without its session: its login_gate sends it to auth/login"""
    return answer.status in REDIRECTS and "auth/login" in answer.headers.get("Location", "")


class Proxy:
    """serves one plan; created by async_setup_entry and closed when the entry is unloaded"""

    def __init__(self, address: str) -> None:
        self.address = str(address or const.DEFAULT_ADDRESS).rstrip("/")
        self._unreachable_logged = False
        # A download may take minutes (models, backups): only a dead connection or a stalled one ends it.
        # No cookie jar: this session is shared by every browser, so a cookie the plan sets for one request must never be
        # replayed with the next browser's request. The browser's own fp3d_* cookies are forwarded explicitly in boundary.py.
        self.upstream = aiohttp.ClientSession(
            cookie_jar=aiohttp.DummyCookieJar(),
            timeout=aiohttp.ClientTimeout(total=None, sock_connect=const.CONNECT_TIMEOUT, sock_read=const.READ_TIMEOUT))
        self.live = aiohttp.ClientSession(
            cookie_jar=aiohttp.DummyCookieJar(),
            timeout=aiohttp.ClientTimeout(total=None, sock_connect=const.CONNECT_TIMEOUT, sock_read=None))

    def _unreachable(self, message: str, *args) -> None:
        """one warning per outage; later failures of the same outage are debug (a stopped plan must not flood the log)"""
        if self._unreachable_logged:
            _LOGGER.debug(message, *args)
        else:
            self._unreachable_logged = True
            _LOGGER.warning(message, *args)

    def _reachable(self) -> None:
        self._unreachable_logged = False

    async def close(self) -> None:
        await self.upstream.close()
        await self.live.close()

    async def handle(self, request: web.Request) -> web.StreamResponse:
        if request.method not in METHODS:
            return web.json_response({"error": "method not allowed"}, status=405,
                                     headers={"Allow": ", ".join(sorted(METHODS))})
        if request.path == const.PATH:
            query = f"?{request.query_string}" if request.query_string else ""
            raise web.HTTPFound(const.PATH + "/" + query)
        if boundary.needs_session(request.path, request.headers.get("Cookie", "")):
            # Second lock besides the plan's own login: without its session nothing reaches the plan (#601).
            if is_page_request(request):
                return self._sign_in(request)
            return web.json_response({"error": "login required"}, status=401,
                                     headers={"X-Login": "1", "Cache-Control": "no-store"})
        if request.headers.get("Upgrade", "").lower() == "websocket":
            return await self._live_channel(request)
        if is_page_request(request) and request.path == const.PATH + "/auth/login":
            # The plan would send this browser to Home Assistant's login page and back to /auth/callback on Home Assistant, which
            # does not serve that. The integration signs the browser in instead (server side, with the user's token).
            return self._sign_in(request)

        # raw_path keeps %2F and %20 as the plan's own router saw them; request.path is already decoded by aiohttp.
        url = boundary.plan_url(self.address, request.rel_url.raw_path, request.query_string)
        try:
            answer = await self.upstream.request(
                request.method, url,
                headers=boundary.headers_to_plan(request.headers, request.scheme, request.host),
                data=request.content if request.can_read_body else None, allow_redirects=False)
        except (aiohttp.ClientError, asyncio.TimeoutError, OSError) as err:
            self._unreachable("3D Floorplan: the plan is not reachable at %s: %s", url.split("?", 1)[0], err)
            return web.json_response({"error": "plan unreachable"}, status=502)
        self._reachable()

        try:
            if is_page_request(request) and starts_login(answer):
                answer.release()
                return self._sign_in(request)
            # Identity encoding was asked for, so a forwarded length is the length of the bytes that follow.
            headers = CIMultiDict()
            for name, value in boundary.headers_to_browser(
                    answer.headers.items(),
                    keep_length=answer.status not in NO_BODY and "content-encoding" not in answer.headers):
                if name.lower() == "location":
                    value = boundary.proxy_location(value, self.address)
                headers.add(name, value)
        except Exception:  # noqa: BLE001 - an odd answer must not become a traceback in Home Assistant
            answer.close()
            _LOGGER.exception("3D Floorplan: the plan sent an answer the proxy could not read")
            return web.json_response({"error": "plan answer unreadable"}, status=502)

        response = web.StreamResponse(status=answer.status, headers=headers)
        try:
            await response.prepare(request)
        except BaseException:
            answer.close()                      # the browser is gone or the answer could not be started
            raise
        try:
            async for chunk in answer.content.iter_chunked(const.CHUNK):
                await response.write(chunk)
            await response.write_eof()
        except (aiohttp.ClientError, ConnectionError, asyncio.TimeoutError) as err:
            # after prepare() the browser already has the headers: the connection just ends
            _LOGGER.warning("3D Floorplan: the plan's answer broke off (%s)", err)
        finally:
            answer.close()
        return response

    def _sign_in(self, request: web.Request) -> web.Response:
        """the browser has no session yet: sign in with Home Assistant's token, then load the page it asked for again"""
        path = request.rel_url.raw_path
        if path == const.PATH + "/auth/login":          # the plan's login page: come back to the page the browser wanted
            path = const.PATH + "/"
        target = path + (f"?{request.query_string}" if request.query_string else "")
        return web.Response(text=pages.sign_in_page(target, const.SESSION_PATH), content_type="text/html",
                            headers={"Cache-Control": "no-store"})

    async def _live_channel(self, request: web.Request) -> web.StreamResponse:
        """the plan's live channel, connected before the browser's handshake so a dead plan is a 502 and not a socket that closes
        at once"""
        url = boundary.plan_url(self.address, request.rel_url.raw_path, request.query_string, "ws")
        try:
            plan_ws = await self.live.ws_connect(
                url, headers=boundary.headers_to_plan(request.headers, request.scheme, request.host), heartbeat=30)
        except (aiohttp.ClientError, asyncio.TimeoutError, OSError) as err:
            self._unreachable("3D Floorplan: the plan's live channel is not reachable at %s: %s", url.split("?", 1)[0], err)
            return web.json_response({"error": "plan unreachable"}, status=502)
        self._reachable()
        browser_ws = web.WebSocketResponse(heartbeat=30)
        try:
            await browser_ws.prepare(request)
            up = asyncio.create_task(self._pump(browser_ws, plan_ws))
            down = asyncio.create_task(self._pump(plan_ws, browser_ws))
            _, pending = await asyncio.wait({up, down}, return_when=asyncio.FIRST_COMPLETED)
            for task in pending:
                task.cancel()
            await asyncio.gather(*pending, return_exceptions=True)
            return browser_ws
        finally:
            await plan_ws.close()
            await browser_ws.close()

    @staticmethod
    async def _pump(source, sink) -> None:
        """one direction of the live channel until either side closes"""
        try:
            async for message in source:
                if message.type == aiohttp.WSMsgType.TEXT:
                    await sink.send_str(message.data)
                elif message.type == aiohttp.WSMsgType.BINARY:
                    await sink.send_bytes(message.data)
                elif message.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.CLOSING,
                                      aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                    break
        except (aiohttp.ClientError, ConnectionError, asyncio.CancelledError):
            pass
