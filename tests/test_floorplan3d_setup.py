"""The Home Assistant part of the Container integration (container/custom_components/floorplan3d/__init__.py).

The repository's normal environment has no Home Assistant installed, so this test puts the few Home Assistant names the integration
imports into sys.modules and drives the real module. It pins the behaviour that used to need a restart (routes, static card path and
card URL are registered from async_setup_entry), the session view's authentication/cookie path and the address validation.

The pure/aiohttp parts stay in tests/test_container_dashboard.py; this file is deliberately only about the Home Assistant wiring.
"""
import importlib
import sys
import types
from pathlib import Path
from types import SimpleNamespace

from aiohttp import web
import pytest

PKG = Path(__file__).parent.parent / "container" / "custom_components" / "floorplan3d"


def _module(name, **attrs):
    module = types.ModuleType(name)
    module.__dict__.update(attrs)
    sys.modules[name] = module
    return module


def _install_home_assistant():
    """the names __init__.py imports, nothing more"""
    if "homeassistant" in sys.modules:
        pytest.skip("this test uses a minimal Home Assistant stub; a real Home Assistant is already imported",
                    allow_module_level=True)

    class HomeAssistantView:
        requires_auth = True
        url = None
        name = ""

        def json(self, data, status_code=200, headers=None):
            return web.json_response(data, status=status_code, headers=headers)

        def json_message(self, message, status_code=200, message_code=None, headers=None):
            data = {"message": message}
            if message_code is not None:
                data["code"] = message_code
            return self.json(data, status_code, headers=headers)

    class StaticPathConfig:
        def __init__(self, url_path, path, cache_headers=True):
            self.url_path, self.path, self.cache_headers = url_path, path, cache_headers

    ha = _module("homeassistant")
    ha.__path__ = []
    components = _module("homeassistant.components")
    components.__path__ = []
    auth = _module("homeassistant.components.auth", create_auth_code=lambda hass, client_id, credential: "code")
    components.auth = auth

    def add_extra_js_url(hass, url, es5=False):
        hass.data.setdefault("frontend_extra_module_url", set()).add(url)

    def remove_extra_js_url(hass, url, es5=False):
        hass.data.get("frontend_extra_module_url", set()).discard(url)

    frontend = _module("homeassistant.components.frontend", add_extra_js_url=add_extra_js_url,
                       remove_extra_js_url=remove_extra_js_url)
    components.frontend = frontend
    _module("homeassistant.components.http", KEY_HASS="hass", KEY_HASS_USER="hass_user",
            HomeAssistantView=HomeAssistantView, StaticPathConfig=StaticPathConfig)
    _module("homeassistant.config_entries", ConfigEntry=type("ConfigEntry", (), {}))
    _module("homeassistant.const", EVENT_HOMEASSISTANT_STOP="homeassistant_stop")
    _module("homeassistant.exceptions", ConfigEntryError=type("ConfigEntryError", (Exception,), {}))

    def callback(func):
        return func

    _module("homeassistant.core", HomeAssistant=type("HomeAssistant", (), {}), callback=callback)
    helpers = _module("homeassistant.helpers")
    helpers.__path__ = []
    _module("homeassistant.helpers.typing", ConfigType=dict)

    async def async_get_integration(hass, domain):
        return SimpleNamespace(version="1.2.3")

    _module("homeassistant.loader", async_get_integration=async_get_integration)


_install_home_assistant()

if "floorplan3d" not in sys.modules:
    package = types.ModuleType("floorplan3d")
    package.__path__ = [str(PKG)]
    sys.modules["floorplan3d"] = package

integration = importlib.import_module("floorplan3d.__init__")
const = importlib.import_module("floorplan3d.const")
handshake = importlib.import_module("floorplan3d.handshake")


class Router:
    def __init__(self):
        self.routes = []

    def add_route(self, *args):
        self.routes.append(args)


class HTTP:
    def __init__(self):
        self.app = SimpleNamespace(router=Router())
        self.views = []
        self.static = []

    def register_view(self, view):
        self.views.append(view)

    async def async_register_static_paths(self, configs):
        self.static.extend(configs)


class Bus:
    def __init__(self):
        self.listeners = []

    def async_listen_once(self, event, callback):
        self.listeners.append((event, callback))


class Hass:
    def __init__(self):
        self.data = {}
        self.http = HTTP()
        self.bus = Bus()
        self.config = SimpleNamespace(components={"frontend"})


def entry(address="http://127.0.0.1:1"):
    return SimpleNamespace(data={const.CONF_ADDRESS: address})


async def test_setup_entry_registers_everything_without_a_restart():
    hass = Hass()
    await integration.async_setup(hass, {})
    assert hass.http.app.router.routes == []                  # nothing to serve before an entry exists
    assert await integration.async_setup_entry(hass, entry()) is True

    paths = [route[1] for route in hass.http.app.router.routes]
    assert paths == [f"{const.PATH}/{{path:.*}}", const.PATH]
    assert len(hass.http.views) == 1 and isinstance(hass.http.views[0], integration.SessionView)
    assert hass.http.static and hass.http.static[0].url_path == const.FRONTEND_PATH
    store = hass.data[const.DOMAIN]
    assert store["card_url"] == f"{const.FRONTEND_PATH}/{const.CARD_FILE}?v=1.2.3"
    assert store["card_url"] in hass.data["frontend_extra_module_url"]

    # a second setup (e.g. the entry is reloaded) must not register duplicate routes or card URLs
    await integration.async_setup_entry(hass, entry())
    assert len(hass.http.app.router.routes) == 2
    assert len(hass.http.views) == 1
    assert len(hass.http.static) == 1
    assert len(hass.data["frontend_extra_module_url"]) == 1

    assert await integration.async_unload_entry(hass, entry()) is True
    assert store.get("plan") is None


async def test_setup_entry_refuses_an_entry_without_an_address():
    hass = Hass()
    try:
        await integration.async_setup_entry(hass, SimpleNamespace(data={}))
    except Exception as err:  # ConfigEntryError from the stubbed homeassistant.exceptions
        assert type(err).__name__ == "ConfigEntryError"
    else:
        raise AssertionError("an entry without an address must fail setup")


class Request:
    def __init__(self, hass, user, host="ha.example.org", scheme="http"):
        self.app = {"hass": hass}
        self._user = user
        self.host = host
        self.scheme = scheme

    def get(self, key, default=None):
        return self._user if key == "hass_user" else default


async def test_create_code_awaits_an_async_home_assistant(monkeypatch):
    async def creator(hass, client_id, credential):
        return "async-code"

    monkeypatch.setattr(integration.ha_auth, "create_auth_code", creator)
    assert await integration.create_code(None, "client", object()) == "async-code"


async def test_create_code_says_so_when_the_internal_api_is_gone(monkeypatch):
    monkeypatch.delattr(integration.ha_auth, "create_auth_code", raising=False)
    try:
        await integration.create_code(None, "client", object())
    except RuntimeError as err:
        assert "create_auth_code" in str(err)
    else:
        raise AssertionError("a missing create_auth_code must be an explicit error")


async def test_the_session_view_logs_the_user_in_and_sets_the_plan_cookie(monkeypatch):
    hass = Hass()
    plan = SimpleNamespace(address="http://192.168.1.10:8100")
    hass.data[const.DOMAIN] = {"plan": plan}
    credential = SimpleNamespace(auth_provider_type="homeassistant")
    user = SimpleNamespace(name="Anna", credentials=[credential])
    calls = []

    async def begin(session, address):
        return handshake.Login("login-cookie", "http://192.168.1.10:8100/", "state")

    async def exchange(session, address, code, state, login_cookie):
        calls.append((address, code, state, login_cookie))
        return handshake.Session("plan-session", 2592000)

    async def create_code(hass, client_id, cred):
        calls.append((client_id, cred))
        return "the-code"

    monkeypatch.setattr(integration.handshake, "begin", begin)
    monkeypatch.setattr(integration.handshake, "exchange", exchange)
    monkeypatch.setattr(integration, "create_code", create_code)

    answer = await integration.SessionView().post(Request(hass, user))
    assert answer.status == 200
    assert (answer.cookies[const.SESSION_COOKIE].value) == "plan-session"
    assert answer.cookies[const.SESSION_COOKIE]["path"] == "/"
    assert answer.cookies[const.SESSION_COOKIE]["httponly"] is True
    assert calls[0] == ("http://192.168.1.10:8100/", credential)
    assert calls[1] == ("http://192.168.1.10:8100", "the-code", "state", "login-cookie")


async def test_the_session_view_refuses_a_code_for_another_client(monkeypatch):
    hass = Hass()
    hass.data[const.DOMAIN] = {"plan": SimpleNamespace(address="http://192.168.1.10:8100")}
    user = SimpleNamespace(name="Anna", credentials=[SimpleNamespace(auth_provider_type="homeassistant")])
    made = []

    async def begin(session, address):
        return handshake.Login("login-cookie", "https://evil.example.org/", "state")

    async def create_code(hass, client_id, cred):
        made.append(client_id)
        return "the-code"

    monkeypatch.setattr(integration.handshake, "begin", begin)
    monkeypatch.setattr(integration, "create_code", create_code)
    answer = await integration.SessionView().post(Request(hass, user))
    assert answer.status == 502
    assert made == []
