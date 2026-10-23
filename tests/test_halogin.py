"""halogin.py: the login with Home Assistant when the add-on runs without the Supervisor (Home Assistant as a Docker container, #489)."""
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import halogin as hl  # noqa: E402

KEY = b"k" * 32


def test_a_signed_cookie_comes_back_only_unchanged_and_in_time():
    v = hl.sign({"id": "u1", "exp": 2000}, KEY)
    assert hl.unsign(v, KEY, now=1000) == {"id": "u1", "exp": 2000}
    assert hl.unsign(v, KEY, now=2000) is None                       # ran out
    assert hl.unsign(v, b"x" * 32, now=1000) is None                 # another add-on's key
    body, sig = v.split(".")
    forged = hl.sign({"id": "admin", "exp": 2000}, b"x" * 32).split(".")[0]
    assert hl.unsign(forged + "." + sig, KEY, now=1000) is None      # somebody else's data under this signature
    for junk in (None, "", "abc", "a.b.c", body, "x" * 5000, hl.sign({"id": "u1"}, KEY), hl.sign([1], KEY), "Zm9v.YmFy"):
        assert hl.unsign(junk, KEY, now=1000) is None


def test_home_assistants_address_for_the_browser():
    # an address only the container knows: the host the page was opened with, Home Assistant's port
    assert hl.browser_ha("http://homeassistant:8123", "", "192.168.1.10:8100") == "http://192.168.1.10:8123"
    assert hl.browser_ha("http://localhost:8123/api", "", "nas.local:8100") == "http://nas.local:8123"
    assert hl.browser_ha("http://127.0.0.1:8123", "", "[fd00::5]:8100") == "http://[fd00::5]:8123"
    # an address the browser knows too, or one set for it
    assert hl.browser_ha("http://192.168.1.10:8123/", "", "nas.local:8100") == "http://192.168.1.10:8123"
    assert hl.browser_ha("http://homeassistant:8123", "https://ha.example.org/", "x:1") == "https://ha.example.org"
    assert hl.browser_ha("https://ha.example.org", "", "192.168.1.10:8100") == "https://ha.example.org"


def test_the_pages_address_and_the_login_link():
    assert hl.app_base("", "http", "192.168.1.10:8100") == "http://192.168.1.10:8100/"
    assert hl.app_base("https://home.example.org/plan", "http", "x") == "https://home.example.org/plan/"
    assert hl.app_base("", "javascript", "x") == "http://x/"
    u = urlsplit(hl.authorize_url("http://192.168.1.10:8123/", "http://192.168.1.10:8100/", "s" * 20))
    q = {k: v[0] for k, v in parse_qs(u.query).items()}
    assert (u.netloc, u.path) == ("192.168.1.10:8123", "/auth/authorize")
    assert q == {"response_type": "code", "client_id": "http://192.168.1.10:8100/", "redirect_uri": "http://192.168.1.10:8100/auth/callback",
                 "state": "s" * 20}
    assert hl.ha_base("http://ha:8123/api/") == "http://ha:8123" and hl.ha_base(" http://ha:8123 ") == "http://ha:8123"


def test_who_logged_in():
    s = hl.new_session({"id": "abc123", "name": "Anna Muster", "is_admin": False}, "anna", 1000)
    assert s == {"id": "abc123", "name": "Anna Muster", "user": "anna", "admin": False, "exp": 1000 + 30 * 86400}
    assert hl.who(s) == {"name": "anna", "display": "Anna Muster", "ids": {"abc123", "anna", "anna muster"}}
    assert hl.new_session({"id": "o", "name": "Owner", "is_owner": True}, None, 0)["admin"] is True
    assert hl.who(hl.new_session({"id": "o", "name": "Owner"}, None, 0))["name"] == "Owner"
    for bad in (None, {}, {"id": ""}, {"id": 5}, "x"):
        assert hl.new_session(bad, "x", 0) is None
    assert hl.who(None) == {"name": "", "display": "", "ids": set()}


def test_a_session_gets_a_new_end_when_it_runs_low():
    s = hl.new_session({"id": "a"}, "", 0)
    assert hl.renewed(s, 5 * 86400) is None                          # 25 days left: the cookie stays
    r = hl.renewed(s, 15 * 86400)                                    # 15 days left: 30 again
    assert r["exp"] == 45 * 86400 and r["id"] == "a"


def test_page_or_data():
    assert hl.is_page("GET", "/") and hl.is_page("GET", "/index.html") and hl.is_page("GET", "/plan/")
    assert not hl.is_page("GET", "/api/me") and not hl.is_page("POST", "/") and not hl.is_page("GET", "/app.js")


def test_a_change_only_from_the_page_itself():
    assert hl.same_origin(None, "192.168.1.10:8100")                                      # no browser page sent it
    assert hl.same_origin("http://192.168.1.10:8100", "192.168.1.10:8100")
    assert hl.same_origin("https://plan.example.org", "floorplan3d:8099", "https://plan.example.org/")   # behind a proxy
    assert not hl.same_origin("http://192.168.1.10:8123", "192.168.1.10:8100")            # another port of the same computer
    assert not hl.same_origin("https://evil.example", "192.168.1.10:8100")
    assert not hl.same_origin("null", "192.168.1.10:8100") and not hl.same_origin("", "x:1")


def test_back_to_the_page_with_its_options():
    assert hl.back_to("") == "../" and hl.back_to(None) == "../"
    assert hl.back_to("kiosk=1&room=Bad") == "../?kiosk=1&room=Bad"
    assert hl.back_to("a=1\r\nSet-Cookie:x") == "../" and hl.back_to("x" * 1001) == "../"
