"""3D Floorplan (Container): the floor plan container on Home Assistant's own address, without a second login.

Home Assistant Container has no add-on store (#489), so 3D Floorplan runs as a second container. This integration gives it a home on
Home Assistant:

- ``/floorplan/`` proxies the container (websocket relay included) under Home Assistant's own address, so the plan is reachable at
  every address Home Assistant itself is reachable at — LAN IP, reverse-proxied domain, Tailscale — always same-origin with the
  dashboard. The browser's resolved Host (not an internal Host behind a reverse proxy) and scheme are forwarded, so the container
  sees the address the browser used (web_proxy.py).
- ``POST /api/floorplan3d/session`` logs the browser in without the plan's second login: Home Assistant itself authenticates the
  request (the logged-in user's bearer token), then the integration walks the container's *existing* OAuth login server side — the
  login cookie and state from the plan, the authorization code from Home Assistant's own store, the exchange at the plan's regular
  callback — and hands the session cookie to the browser (handshake.py).
- A browser that opens ``/floorplan/`` without that session does not follow the plan's redirect to Home Assistant's login page (which
  would come back to ``/auth/callback`` on Home Assistant — a page it does not serve): it gets a small sign-in page that asks for the
  session with the token Home Assistant's own frontend keeps, then loads the plan again (pages.py).

The container itself is untouched; its own login still protects everything it serves. What may cross between Home Assistant and the
plan is decided in boundary.py: Home Assistant's cookies and the user's token stay here, only the plan's own cookies go to it, and
only its own cookies come back.

- Integration and container come from the same release and carry its version. The container tells its own at ``/auth/version``; when
  the two differ, Settings → Repairs says which one to update (#744, versions.py), checked at the start, every hour and after a
  failed sign-in.

Layers: const.py, boundary.py, versions.py and pages.py are pure; handshake.py and web_proxy.py need aiohttp only; this file and config_flow.py
are the Home Assistant part. tests/test_container_dashboard.py covers the pure and proxy layers, tests/test_floorplan3d_setup.py the
Home Assistant wiring (setup with and without an entry, the session view and its cookie, unload).
"""
from __future__ import annotations

import asyncio
import inspect
import logging
import time
from datetime import timedelta
from pathlib import Path

import aiohttp
from aiohttp import web

from homeassistant.components import auth as ha_auth, frontend
from homeassistant.components.http import KEY_HASS, KEY_HASS_USER, HomeAssistantView, StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryError
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from . import boundary, const, handshake, pages, versions, web_proxy

_LOGGER = logging.getLogger(__name__)

CARD_DIR = Path(__file__).parent / "frontend"


async def create_code(hass: HomeAssistant, client_id: str, credential):
    """Home Assistant's own authorization code for exactly this client id (an internal API: say so clearly when it is gone)"""
    creator = getattr(ha_auth, "create_auth_code", None)
    if creator is None:
        raise RuntimeError("this Home Assistant has no auth.create_auth_code")
    code = creator(hass, client_id, credential)
    if inspect.isawaitable(code):
        code = await code
    if not isinstance(code, str) or not code:
        raise RuntimeError("this Home Assistant did not return an authorization code")
    return code


def _store(hass: HomeAssistant) -> dict:
    return hass.data.setdefault(const.DOMAIN, {})


async def _serve_card(hass: HomeAssistant) -> bool:
    """the card comes with the integration: served from here, nothing to copy into /config/www.

    Immutable caching on purpose: the address carries the version (``?v=``), so a browser that has the card once never has to ask
    again — and Home Assistant only waits about two seconds for a custom element before it shows “Custom element doesn't exist”.
    With a forced revalidation every load, an unstable connection alone could push the card past that window."""
    store = _store(hass)
    if store.get("card_served"):
        return True
    await hass.http.async_register_static_paths(
        [StaticPathConfig(const.FRONTEND_PATH, str(CARD_DIR), cache_headers=True)])
    store["card_served"] = True
    return True


async def _own_version(hass: HomeAssistant) -> str:
    """this integration's version (its manifest.json: the release's version, tools/make_manifest.py)"""
    integration = await async_get_integration(hass, const.DOMAIN)
    return str(integration.version or "0")


def _card_url(version: str) -> str:
    """the card's address, with the integration's version to get a fresh copy after an update"""
    return f"{const.FRONTEND_PATH}/{const.CARD_FILE}?v={version}"


async def check_versions(hass: HomeAssistant, address: str, connector: str) -> str:
    """compare this integration's version with the container's (#744). A difference is an issue in Settings → Repairs that says which
    of the two to update (and one line in the log); the same version removes it. A container that does not answer changes nothing:
    the page says that already. Returns what versions.compare found."""
    store = _store(hass)
    store["checked"] = time.monotonic()
    async with aiohttp.ClientSession(cookie_jar=aiohttp.DummyCookieJar(),
                                     timeout=aiohttp.ClientTimeout(total=const.HANDSHAKE_TIMEOUT)) as session:
        container = await handshake.container_version(session, address)
    result = versions.compare(connector, container)
    if result == versions.UNKNOWN:
        return result
    if result == versions.SAME:
        if store.pop("mismatch", None) is not None:
            _LOGGER.info("3D Floorplan: the integration and the container both have version %s again", connector)
        ir.async_delete_issue(hass, const.DOMAIN, const.VERSION_ISSUE)
        return result
    texts = versions.placeholders(connector, container)
    if store.get("mismatch") != (result, texts["container"]):
        store["mismatch"] = (result, texts["container"])
        _LOGGER.warning("3D Floorplan: the integration has version %s, the container at %s %s. They belong together: update the %s "
                        "(Settings → Repairs says how)", texts["connector"], address, texts["container"],
                        "container" if result == versions.UPDATE_CONTAINER else "integration")
    ir.async_create_issue(hass, const.DOMAIN, const.VERSION_ISSUE, is_fixable=False, severity=ir.IssueSeverity.WARNING,
                          translation_key=result, translation_placeholders=texts,
                          learn_more_url=const.CONTAINER_DOCS if result == versions.UPDATE_CONTAINER else None)
    return result


def _check_soon(hass: HomeAssistant, plan) -> None:
    """after a failed sign-in: perhaps one of the two was updated and the other not (at most once a minute)"""
    if time.monotonic() - _store(hass).get("checked", -1e9) < 60:
        return
    _store(hass)["checked"] = time.monotonic()
    hass.async_create_background_task(check_versions(hass, plan.address, plan.version), f"{const.DOMAIN} version check")


def _load_card(hass: HomeAssistant) -> None:
    """load the card on every Home Assistant page, so it is in the card picker without a dashboard resource.

    Twice, under two addresses: Home Assistant imports these with a plain import() and only logs a failure — the browser then
    keeps the failed module for this page, and the dashboard shows “Custom element doesn't exist” until a reload. The second
    address is an independent request (and an independent module), so one bad answer on an unstable connection costs nothing."""
    store = _store(hass)
    url = store.get("card_url")
    if url is None:
        return
    if "frontend" not in hass.config.components:
        _LOGGER.warning("3D Floorplan: Home Assistant has no frontend, so the card is not loaded")
        return
    try:
        frontend.add_extra_js_url(hass, url)
        frontend.add_extra_js_url(hass, f"{url}&f=1")
    except KeyError:                    # frontend is listed but its extra-module store did not come up
        _LOGGER.warning("3D Floorplan: Home Assistant's frontend is not ready, so the card is not loaded")
        return
    store["card_added"] = [url, f"{url}&f=1"]


async def _register_lovelace_resource(hass: HomeAssistant, url: str):
    """Also keep the card in Lovelace's resource list. add_extra_js_url() is added to the index HTML only while the integration sets
    up; a dashboard opened during startup can otherwise render before the module is listed. A resource is persisted and fetched with
    the dashboard, so the loader is there on the first render too. YAML resource mode keeps the extra-JS fallback."""
    try:
        from homeassistant.components.lovelace.const import LOVELACE_DATA  # noqa: PLC0415
    except ImportError:                  # older Home Assistant / lovelace not installed
        return None
    data = hass.data.get(LOVELACE_DATA)
    resources = getattr(data, "resources", None)
    if resources is None or not hasattr(resources, "async_create_item"):
        return None                      # YAML mode: only add_extra_js_url is available
    try:
        await resources.async_get_info()  # loads the storage collection
        path = url.split("?", 1)[0]
        existing = None
        for item in list(resources.async_items() or []):
            item_url = str(item.get("url", ""))
            if item_url.split("?", 1)[0] != path:
                continue
            if item_url == url:
                existing = item.get("id")
            else:
                await resources.async_delete_item(item["id"])  # an older ?v=...
        if existing:
            return existing
        created = await resources.async_create_item({"res_type": "module", "url": url})
        return created.get("id")
    except Exception:  # noqa: BLE001 - the extra-JS fallback still loads the card
        _LOGGER.exception("3D Floorplan: could not register the card as a Lovelace resource")
        return None


async def _remove_lovelace_resource(hass: HomeAssistant, resource_id) -> None:
    if not resource_id:
        return
    try:
        from homeassistant.components.lovelace.const import LOVELACE_DATA  # noqa: PLC0415
        data = hass.data.get(LOVELACE_DATA)
        resources = getattr(data, "resources", None)
        if resources is not None and hasattr(resources, "async_delete_item"):
            await resources.async_delete_item(resource_id)
    except Exception:  # noqa: BLE001 - a resource the user removed meanwhile is not an error
        _LOGGER.debug("3D Floorplan: could not remove the Lovelace resource", exc_info=True)


async def _handle(request: web.Request) -> web.StreamResponse:
    """/floorplan/ and everything under it, or a page saying that the integration has no entry yet"""
    plan = request.app[KEY_HASS].data.get(const.DOMAIN, {}).get("plan")
    if plan is None:
        return web.Response(text=pages.not_ready_page(), content_type="text/html",
                            headers={"Cache-Control": "no-store"}, status=503)
    return await plan.handle(request)


class SessionView(HomeAssistantView):
    """log the browser in: Home Assistant says who asks, the plan's own OAuth login runs server side"""

    name = f"api:{const.DOMAIN}:session"
    url = const.SESSION_PATH
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        hass = request.app[KEY_HASS]
        plan = hass.data.get(const.DOMAIN, {}).get("plan")
        if plan is None:
            return self.json_message("the integration is not ready", status_code=503)
        user = request.get(KEY_HASS_USER)
        credential = boundary.login_credential(getattr(user, "credentials", None))
        if credential is None:
            return self.json_message("the user has no credentials", status_code=400)

        async with aiohttp.ClientSession(
                cookie_jar=aiohttp.DummyCookieJar(),
                timeout=aiohttp.ClientTimeout(total=const.HANDSHAKE_TIMEOUT)) as session:
            try:
                login = await handshake.begin(session, plan.address)
            except handshake.PlanError as err:
                _check_soon(hass, plan)
                return self.json_message(err.reason, status_code=502)
            except (aiohttp.ClientError, asyncio.TimeoutError, OSError) as err:
                _LOGGER.warning("3D Floorplan: the plan is not reachable at %s: %s", plan.address, err)
                return self.json_message("cannot_connect", status_code=502)

            if not boundary.login_client_id_allowed(plan.address, login.client_id, request.host):
                _LOGGER.warning("3D Floorplan: the plan asked Home Assistant for a code for %s, not for itself",
                                login.client_id)
                return self.json_message("login_incomplete", status_code=502)

            try:
                code = await create_code(hass, login.client_id, credential)
            except Exception:  # noqa: BLE001 - a failed login is an answer, not a crash of Home Assistant
                _LOGGER.exception("3D Floorplan: Home Assistant did not create an authorization code")
                return self.json_message("cannot_create_code", status_code=500)

            try:
                plan_session = await handshake.exchange(session, plan.address, code, login.state, login.cookie)
            except (handshake.PlanError, aiohttp.ClientError, asyncio.TimeoutError, OSError) as err:
                _LOGGER.warning("3D Floorplan: the login at %s did not go through: %s", plan.address, err)
                _check_soon(hass, plan)
                return self.json_message("no_session", status_code=502)

        response = self.json({"ok": True})
        response.headers["Cache-Control"] = "no-store"
        response.set_cookie(const.SESSION_COOKIE, plan_session.value,
                            **boundary.session_cookie_attributes(plan_session.max_age, request.scheme == "https"))
        _LOGGER.debug("3D Floorplan: logged %s in", getattr(user, "name", "?"))
        return response


@callback
def _register(hass: HomeAssistant) -> bool:
    """register the address and the session endpoint once. Home Assistant keeps its router open after start (it explicitly
    overrides aiohttp's freeze), so this works both at startup and when the first entry is added at runtime."""
    store = _store(hass)
    if store.get("registered"):
        return True
    app = hass.http.app
    app.router.add_route("*", f"{const.PATH}/{{path:.*}}", _handle)
    app.router.add_route("*", const.PATH, _handle)
    hass.http.register_view(SessionView())
    store["registered"] = True
    _LOGGER.info("3D Floorplan served at %s", const.PATH)
    return True


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """set up the process-wide part only; the routes are registered with the first config entry, so adding the integration in
    the UI takes effect at once instead of after another restart."""
    _store(hass)

    async def stop(_event) -> None:
        plan = hass.data.get(const.DOMAIN, {}).pop("plan", None)
        if plan is not None:
            await plan.close()

    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, stop)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """the address from the dialog (config_flow.py): one plan at a time. Setup stays lazy: the proxy is useful as soon as the plan
    comes back, and the card reports an unreachable plan instead of Home Assistant holding the whole entry in retry."""
    address = entry.data.get(const.CONF_ADDRESS)
    if not isinstance(address, str) or not address.strip():
        raise ConfigEntryError("the 3D Floorplan integration has no address")
    store = _store(hass)
    previous = store.pop("plan", None)
    if previous is not None:
        await previous.close()
    version = await _own_version(hass)
    store["plan"] = web_proxy.Proxy(address, version)
    _register(hass)
    _LOGGER.info("3D Floorplan: integration %s, container at %s", version, address)

    async def _check(_now=None) -> None:
        await check_versions(hass, address, version)

    # the container may be updated without Home Assistant restarting: look again every hour (#744)
    entry.async_on_unload(async_track_time_interval(hass, _check, timedelta(seconds=const.VERSION_CHECK_SECONDS)))
    entry.async_create_background_task(hass, _check(), f"{const.DOMAIN} version check")
    if await _serve_card(hass):
        store["card_url"] = _card_url(version)
        _load_card(hass)
        # a third, independent address for Lovelace's own resource loader — Home Assistant also rebuilds the card as soon as the
        # element appears, so any one of the three attempts is enough
        store["resource_id"] = await _register_lovelace_resource(hass, f"{store['card_url']}&r=1")
        if store["resource_id"] is None:
            # Lovelace (and its resource storage) can be set up after the config entry. Register then too; a dashboard opened
            # before this still has the extra-JS URL, and the resource covers the next start.
            async def _when_lovelace_ready(_hass, _component) -> None:
                url = store.get("card_url")
                if url and store.get("resource_id") is None and store.get("plan") is not None:
                    store["resource_id"] = await _register_lovelace_resource(hass, f"{url}&r=1")

            try:
                from homeassistant.setup import async_when_setup  # noqa: PLC0415
                async_when_setup(hass, "lovelace", _when_lovelace_ready)
            except ImportError:
                pass
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    store = hass.data.get(const.DOMAIN, {})
    plan = store.pop("plan", None)
    if plan is not None:
        await plan.close()
    urls = store.pop("card_added", None) or []
    if isinstance(urls, str):               # an older unload left one address
        urls = [urls]
    for url in urls:
        try:
            frontend.remove_extra_js_url(hass, url)
        except KeyError:
            pass
    await _remove_lovelace_resource(hass, store.pop("resource_id", None))
    store.pop("card_url", None)
    store.pop("mismatch", None)
    ir.async_delete_issue(hass, const.DOMAIN, const.VERSION_ISSUE)
    return True
