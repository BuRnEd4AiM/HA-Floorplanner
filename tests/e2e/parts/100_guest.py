"""5.21.0 👥 Gäste-Zugang (the owner, 2026-11-20: a Home Assistant user "gast", a QR code, then a card of the chosen room to control; his
choices: log in once as "gast", light, shutters, heating, music / TV of that room, until a date): ⚙ → 👥 Benutzer & Tablets has it (on,
user, room, bis, the QR code); the guest's screen shows only that room's card with "👥 Willkommen …"; the server lets the guest switch only
that room's devices, nothing once it is over. The rules: tests/test_guest.py, tests/test_server.py; the pure page part: guestaccess.test.mjs.
"""
import datetime as _dt
st_gu = api("api/settings")
set_setting("language", "de")
lay_gu = api_admin("api/layout")
house_gu = api("api/houses")[0]["id"]


def inside(d, r):
    pts, x, z, n, hit = r.get("points") or [], d.get("x"), d.get("z"), 0, False
    n = len(pts)
    for i in range(n):
        (xi, zi), (xj, zj) = pts[i], pts[i - 1]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi:
            hit = not hit
    return hit


pick_gu = None
for f in lay_gu["floors"]:
    for r in f.get("rooms") or []:
        lights = [d["entity"] for d in f.get("devices") or [] if str(d.get("entity", "")).startswith("light.") and isinstance(d.get("x"), (int, float)) and inside(d, r)]
        if r.get("name") and lights and not pick_gu:
            pick_gu = (r, lights[0])
check("👥 the test house has a named room with a light in it", pick_gu is not None)
room_gu, light_gu = pick_gu
others_gu = [d["entity"] for f in lay_gu["floors"] for d in f.get("devices") or [] if str(d.get("entity", "")).startswith("light.") and d["entity"] != light_gu]

pgA = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_gu = []
pgA.on("pageerror", lambda e: own_gu.append("PAGEERROR " + str(e)))
pgA.goto(BASE + "?debug=1&mode=edit"); pgA.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgA.wait_for_timeout(600)
pgA.click("#settingsBtn"); open_setting(pgA, "#guestBox"); pgA.wait_for_timeout(600)
check("👥 ⚙ → Benutzer & Tablets has „Gäste-Zugang“, off at first, user „gast“", "Gäste scannen einen QR-Code" in pgA.inner_text("#guestBox")
      and not pgA.is_checked("#guestOn") and pgA.input_value("#guestUser") == "gast",
      (pgA.is_checked("#guestOn"), pgA.input_value("#guestUser"), pgA.inner_text("#guestBox")[:300]))
pgA.check("#guestOn"); pgA.wait_for_timeout(300)
pgA.select_option("#guestRoom", f"{house_gu}/{room_gu['id']}"); pgA.wait_for_timeout(300)
pgA.click("#guestBox [data-days='3']"); pgA.wait_for_timeout(800)
g_gu = {}
for _ in range(30):
    g_gu = api_admin("api/settings").get("guest") or {}
    if g_gu.get("on") and g_gu.get("room") and g_gu.get("until"):
        break
    pgA.wait_for_timeout(200)
until_gu = _dt.datetime.fromisoformat(g_gu.get("until") or "2000-01-01T00:00+00:00")
check("👥 saved: on, gast, the room, bis in 3 days at 12:00", g_gu.get("on") is True and g_gu.get("user") == "gast" and g_gu.get("room") == f"{house_gu}/{room_gu['id']}"
      and until_gu.hour == 12 and 2 <= (until_gu - _dt.datetime.now(until_gu.tzinfo)).days <= 3, g_gu)
check("👥 the QR code of the add-on's address and „Karte drucken“", pgA.locator("#guestBox .guQr svg path").count() == 1
      and pgA.locator("#guestBox [data-act=guestPrint]").count() == 1 and "Läuft:" in pgA.inner_text("#guestBox .guState"), pgA.inner_text("#guestBox .guState"))
pgA.close()

pgG = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, extra_http_headers={"X-Remote-User-Name": "gast"})
pgG.on("pageerror", lambda e: own_gu.append("PAGEERROR " + str(e)))
pgG.goto(BASE + "?debug=1"); pgG.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgG.wait_for_timeout(1500)
me_gu = pgG.evaluate("fetch('api/me').then((r) => r.json())")
check("👥 the guest: api/me says their room and that it runs; they cannot edit", (me_gu.get("guest") or {}).get("room") == room_gu["name"]
      and me_gu["guest"]["active"] is True and me_gu["canEdit"] is False, me_gu.get("guest"))
check("👥 the guest's screen: „👥 Willkommen“ bar, only the card of their room, no tab bar, no ✕",
      pgG.evaluate("document.body.classList.contains('guestview')") and room_gu["name"] in pgG.inner_text(".guBar")
      and pgG.is_visible("#roomPanel") and room_gu["name"] in pgG.inner_text("#roomPanel") and not pgG.is_visible("#tabBar") and not pgG.is_visible("#settingsBtn"),
      pgG.inner_text(".guBar") if pgG.locator(".guBar").count() else "")


def call_gu(entity):
    return pgG.evaluate("(e) => fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: 'light', service: 'turn_on', entity_id: e }) }).then((r) => r.status)", entity)


check("👥 the guest may switch the light of their room", call_gu(light_gu) == 200)
check("👥 … but not a light of another room (403)", not others_gu or call_gu(others_gu[0]) == 403, others_gu[:1])
set_setting("guest", {**g_gu, "until": "2026-01-01T12:00+00:00"})
pgG.reload(); pgG.wait_for_timeout(2500)
check("👥 over: „Der Gäste-Zugang ist beendet“ and nothing may be switched", pgG.is_visible(".guOver") and "beendet" in pgG.inner_text(".guOver") and call_gu(light_gu) == 403)
check("👥 no errors on the pages", not own_gu, own_gu)
pgG.close()
set_setting("guest", {"on": False})
set_setting("language", st_gu["language"])
