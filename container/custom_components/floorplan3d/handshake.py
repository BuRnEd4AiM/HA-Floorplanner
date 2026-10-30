"""The plan's own login, driven server side.

The container version of 3D Floorplan logs in with Home Assistant's login page (halogin.py there): it redirects to
``/auth/authorize`` with its own address as the client id, Home Assistant sends the browser back with a code, and the container
exchanges it at ``/auth/token``. When the plan is served under ``/floorplan/`` the browser would come back to Home Assistant's
``/auth/callback`` instead, which Home Assistant does not serve.

So this integration walks the same login itself: it asks the plan for the login cookie and the state it would have sent the browser
with, creates the authorization code with Home Assistant's own store, and hands the code to the plan's regular callback. The plan
then does its usual exchange and returns a session cookie — no new endpoint in the plan, no shared secret, and the identity is Home
Assistant's user.

aiohttp only, no Home Assistant, so tests/test_container_dashboard.py runs it against a fake plan.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass

import aiohttp

from . import boundary, const


class PlanError(Exception):
    """the plan did not answer its own login the way the container version does; `reason` says which part"""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


@dataclass(frozen=True)
class Login:
    """what the plan needs to finish a login for this browser"""
    cookie: str                 # fp3d_login: state and client id, signed by the plan
    client_id: str              # the plan's own address, as it announced it
    state: str


@dataclass(frozen=True)
class Session:
    """the plan's session cookie, ready to be set on Home Assistant's address"""
    value: str
    max_age: int | None         # seconds, as the plan set them


def _max_age(cookie) -> int | None:
    try:
        seconds = int(cookie["max-age"])
    except (KeyError, TypeError, ValueError):
        return None
    return seconds if seconds > 0 else None


async def begin(session: aiohttp.ClientSession, address: str) -> Login:
    """GET /auth/login (not followed): the plan's login cookie and the client id/state it would send the browser with"""
    async with session.get(f"{address}/auth/login", allow_redirects=False) as answer:
        cookie = answer.cookies.get(const.LOGIN_COOKIE)
        location = answer.headers.get("Location", "")
    if cookie is None:
        raise PlanError("cannot_start_login")
    parameters = boundary.login_parameters(location)
    if parameters is None:
        raise PlanError("login_incomplete")
    return Login(cookie.value, parameters[0], parameters[1])


async def exchange(session: aiohttp.ClientSession, address: str, code: str, state: str, login_cookie: str) -> Session:
    """the plan's own callback with Home Assistant's code: what it hands back is the session cookie"""
    async with session.get(f"{address}/auth/callback", params={"code": code, "state": state},
                           cookies={const.LOGIN_COOKIE: login_cookie}, allow_redirects=False) as answer:
        cookie = answer.cookies.get(const.SESSION_COOKIE)
    if cookie is None:
        raise PlanError("no_session")
    return Session(cookie.value, _max_age(cookie))


async def probe(address: str) -> str | None:
    """None when the address answers the plan's login (what the dialog needs to know), else the reason for the dialog"""
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=const.HANDSHAKE_TIMEOUT)) as session:
            await begin(session, address)
    except PlanError as err:
        return err.reason
    except (aiohttp.ClientError, asyncio.TimeoutError, OSError):
        return "cannot_connect"
    return None
