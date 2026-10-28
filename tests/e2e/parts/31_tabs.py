"""4.3.0 (#479): the tab bar at the bottom of the live view (the add-on as the only dashboard): 🏠 the house and 📷 the cameras as a page
of its own, a camera big and back to the plan, the 3D picture resting while a page is open; per user in ⚙ → Users & tablets which tabs
and which one a screen starts with (api/me), a camera lock takes the page away too, the setting switches the bar off, the dashboard card
only with its option "tabs".
"""
saved_tb = api_admin("api/layout")              # put back at the end
st_tb = api("api/settings")
set_setting("language", "de")
lay = json.loads(json.dumps(saved_tb))
lay["floors"][0].setdefault("devices", []).append(
    {"id": "tb_cam", "type": "camera", "x": 110, "z": 110, "y": 2.3, "rot": 0, "scale": 1, "name": "Kamera Tor", "entity": "camera.flur", "fov": 90, "range": 4})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
own_tb = []
def watch_tb(pg_):
    # script errors only: a tablet without editing rights is refused api/version/remote (403), as always
    pg_.on("console", lambda m: own_tb.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_tb.append("PAGEERROR " + str(e)))
    return pg_
tabs_of = lambda pg_: pg_.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")
active_of = lambda pg_: pg_.evaluate("document.querySelector('#tabBar [data-tab].active')?.dataset.tab || ''")

pgT = watch_tb(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgT.goto(BASE + "?debug=1"); pgT.wait_for_timeout(1500)
if pgT.is_visible("#modeSwitch [data-mode=edit]"): pgT.click("#modeSwitch [data-mode=edit]"); pgT.wait_for_timeout(500)
check("tabs (#479): no tab bar while editing", pgT.is_hidden("#tabBar"))
pgT.click("#modeSwitch [data-mode=live]"); pgT.wait_for_timeout(800)
check("tabs: in live mode the bar at the bottom has 🏠 Haus, ☀ Heute, 🌡 Klima (a thermostat), 📷 Kameras, 🧺 Haushalt (the power of the washing machine, #490), ▶ Abläufe (a scene) and for an admin 📜 Protokoll (4.40.0), the house open, under the 3D picture (not over it)",
      pgT.is_visible("#tabBar") and tabs_of(pgT) == ["house", "today", "climate", "cameras", "household", "routines", "log"] and active_of(pgT) == "house" and pgT.is_hidden("#tabPages")
      and pgT.evaluate("document.querySelector('#tabBar').getBoundingClientRect().top >= document.querySelector('#view').getBoundingClientRect().bottom - 1"),
      (tabs_of(pgT), active_of(pgT)))
pgT.click("#tabBar [data-tab=cameras]"); pgT.wait_for_timeout(1500)
f0 = pgT.evaluate("window.__fp.renderer.info.render.frame"); pgT.wait_for_timeout(1200)
f1 = pgT.evaluate("window.__fp.renderer.info.render.frame")
check("tabs: 📷 opens the camera page over the house, a tile with the camera's still image, its name and room; the 3D picture rests",
      pgT.is_visible("#tabPages") and active_of(pgT) == "cameras" and pgT.locator(".tpCam[data-entity='camera.flur']").count() == 1
      and pgT.locator(".tpCam img[data-cam='camera.flur']").count() == 1 and "Kamera Tor" in pgT.inner_text(".tpCam") and f1 == f0, (f0, f1))
pgT.click(".tpCam[data-entity='camera.flur']"); pgT.wait_for_timeout(800)
check("tabs: a tap on a tile shows the camera big (live or still image), with 'Alle Kameras' and 'Im Plan zeigen', no dialog of Home Assistant",
      pgT.is_visible(".tpBig .camLive") and pgT.is_visible(".tpBack") and "Kamera Tor" in pgT.inner_text(".tpHead h2"))
pgT.click(".tpTools button:first-child"); pgT.wait_for_timeout(1500)
check("tabs: 'Im Plan zeigen' goes back to the house and marks the camera; the 3D picture draws again",
      pgT.is_hidden("#tabPages") and active_of(pgT) == "house" and pgT.evaluate("window.__fp.renderer.info.render.frame") > f1)
pgT.click("#tabBar [data-tab=cameras]"); pgT.wait_for_timeout(600)
check("tabs: the camera page starts with all cameras again", pgT.locator(".tpCam").count() >= 1 and pgT.is_hidden(".tpBig"))
pgT.click("#modeSwitch [data-mode=edit]"); pgT.wait_for_timeout(600)
check("tabs: editing closes the page and the bar", pgT.is_hidden("#tabBar") and pgT.is_hidden("#tabPages"))

# --- per user: the users dialog writes userTabs, api/me hands it over, the screen starts there
open_users(pgT)
pgT.click("#addTablet"); pgT.fill("#tabletRows .tablet:last-child [data-role=user]", "tablet_tabs")
pgT.press("#tabletRows .tablet:last-child [data-role=user]", "Tab"); pgT.wait_for_timeout(800)
pgT.click("#tabletRows .tablet:last-child .presetBtn"); pgT.wait_for_timeout(300)
check("tabs: the user row's ⚙ box has a tick per page and 'Fängt an mit'",
      pgT.is_visible("#tabletRows .tablet:last-child [data-tab-show=cameras]") and pgT.is_visible("#tabletRows .tablet:last-child [data-role=tabStart]"))
pgT.select_option("#tabletRows .tablet:last-child [data-role=tabStart]", "cameras"); pgT.wait_for_timeout(1500)
check("tabs: the start tab is saved for that user", api("api/settings")["userTabs"].get("tablet_tabs") == {"hide": [], "start": "cameras"}, api("api/settings")["userTabs"])
pgT.keyboard.press("Escape"); pgT.close()
me = json.load(urllib.request.urlopen(urllib.request.Request(BASE + "api/me", headers={"X-Remote-User-Name": "tablet_tabs"})))
check("tabs: api/me hands the user its tabs", me.get("tabs") == {"hide": [], "start": "cameras"}, me)
pgK = watch_tb(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_tabs"}))
pgK.goto(BASE + "?debug=1"); pgK.wait_for_timeout(1800)
check("tabs: that tablet starts on its start tab, the cameras", pgK.is_visible("#tabPages") and active_of(pgK) == "cameras", active_of(pgK))
set_setting("idleReturn", 1)
pgK.reload(); pgK.wait_for_timeout(1500)
pgK.click("#tabBar [data-tab=house]"); pgK.wait_for_timeout(300)
pgK.evaluate("window.__fp.kioskIdle(2 * 60000)"); pgK.evaluate("window.__fp.kioskTick()"); pgK.wait_for_timeout(500)
check("tabs: after a while without a touch the tablet goes back to its start tab", active_of(pgK) == "cameras", active_of(pgK))
set_setting("idleReturn", st_tb.get("idleReturn", 0))
pgK.close()

set_setting("userTabs", {"tablet_tabs": {"hide": ["cameras"]}})
pgH = watch_tb(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_tabs"}))
pgH.goto(BASE + "?debug=1"); pgH.wait_for_timeout(1500)
check("tabs: a user without the camera page has the others but not that one", "cameras" not in tabs_of(pgH) and tabs_of(pgH)[:2] == ["house", "today"], tabs_of(pgH))
pgH.close()
set_setting("userTabs", {})
set_setting("userLocks", {"tablet_tabs": ["cameras"]})
pgL = watch_tb(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_tabs"}))
pgL.goto(BASE + "?debug=1"); pgL.wait_for_timeout(1500)
check("tabs: a user who may not see the cameras (lock) gets no camera page either", "cameras" not in tabs_of(pgL), tabs_of(pgL))
pgL.close()
set_setting("userLocks", st_tb.get("userLocks", {}))
set_setting("tabBar", False)
pgO = watch_tb(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_tabs"}))
pgO.goto(BASE + "?debug=1"); pgO.wait_for_timeout(1500)
check("tabs: ⚙ 'Reiter-Leiste unten' off: no bar", pgO.is_hidden("#tabBar"))
pgO.close()
set_setting("tabBar", True)
pgC = watch_tb(b.new_page(viewport={"width": 1000, "height": 700}, extra_http_headers={"X-Remote-User-Name": "tablet_tabs"}))
pgC.goto(BASE + "?debug=1&card=1"); pgC.wait_for_timeout(1500)
no_bar = pgC.is_hidden("#tabBar")
pgC.goto(BASE + "?debug=1&card=1&tabs=1"); pgC.wait_for_timeout(1500)
check("tabs: the dashboard card has the bar only with its option tabs", no_bar and pgC.is_visible("#tabBar") and tabs_of(pgC) == ["house", "today", "climate", "cameras", "household", "routines"], tabs_of(pgC))
pgC.close()
# the Home Assistant app on an iPhone: the panel is a frame of the same address and Home Assistant keeps the home bar strip clear below
# it; iOS still gives the frame the strip (here 30 px, set by hand: Chromium has none), so it was kept clear twice (safearea.js)
SIM = ":root { --safe-b: max(0px, 30px - var(--frame-gap)); }"
pad_of = lambda f: f.evaluate("getComputedStyle(document.querySelector('#tabBar')).paddingBottom")
pgF = watch_tb(b.new_page(viewport={"width": 375, "height": 760}, is_mobile=True, has_touch=True, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgF.route(BASE + "_ha_frame.html", lambda r: r.fulfill(content_type="text/html", body=(
    '<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    '<body style="margin:0;height:100vh;display:flex;flex-direction:column;padding-bottom:30px;box-sizing:border-box">'
    f'<div style="height:56px">3D Floorplan</div><iframe src="{BASE}?debug=1" style="flex:1;border:0"></iframe></body>')))
pgF.goto(BASE + "_ha_frame.html")
fr = pgF.wait_for_selector("iframe").content_frame()
fr.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgF.wait_for_timeout(1500)
fr.add_style_tag(content=SIM); pgF.wait_for_timeout(200)
gap_f = fr.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--frame-gap').trim()")
check("tabs (iPhone, Home Assistant app): in a frame that ends 30 px above the bottom the bar does not keep the home bar strip clear a second time",
      gap_f in ("29px", "30px", "31px") and fr.is_visible("#tabBar") and pad_of(fr) == "6px", (gap_f, pad_of(fr)))
pgF.goto(BASE + "?debug=1"); pgF.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgF.wait_for_timeout(1500)
pgF.add_style_tag(content=SIM); pgF.wait_for_timeout(200)
check("tabs (iPhone, page on its own): the bar keeps the strip clear, the view buttons above it do not",
      pgF.is_visible("#tabBar") and pad_of(pgF) == "36px" and pgF.evaluate("getComputedStyle(document.body).getPropertyValue('--stage-b').trim()") == "0px", pad_of(pgF))
pgF.close()
check("tabs: no errors on the page", not own_tb, own_tb[:3])

urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_tb).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("userTabs", st_tb.get("userTabs", {}))
set_setting("language", st_tb["language"])
