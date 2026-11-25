"""5.36.0 📱 the phone app, the owner's feedback (2026-11-25): the room tiles on Start see every light (a lamp on a relay, a wall lamp on the
edge; every room with a light on shows, before a 7th lit room was simply missing), rooms can be pinned on Start, the round button of a
tile opens a list (all on, all off, the room's scenes, 📌, open), the chips wrap instead of being swiped sideways, 📷 is a chip on Start,
and ✎ on a page edits it in the app view too (🗂 Reiter shows the whole bar to order the tabs). The rules: appshell.test.mjs, roomtiles.test.mjs.
"""
st_pr = api("api/settings")
set_setting("language", "de")
was_pr = next((x["state"] for x in json.load(urllib.request.urlopen(HA + "/states")) if x["entity_id"] == "light.wohnzimmer"), "on")
urllib.request.urlopen(HA + "/_set?e=light.wohnzimmer&s=on"); urllib.request.urlopen(HA + "/_set?e=switch.garage&s=off")
pgQ = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, extra_http_headers={"X-Remote-User-Name": "admin"})
own_pr = []
pgQ.on("pageerror", lambda e: own_pr.append("PAGEERROR " + str(e)))
pgQ.goto(BASE + "?debug=1"); pgQ.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgQ.wait_for_timeout(1500)
pgQ.evaluate("localStorage.removeItem('fp.appPins')")
# eight rooms far away from the test house, in this page only (nothing saved): seven with the (lit) light.wohnzimmer, one with a lamp on a relay
fi_pr = pgQ.evaluate("""() => { const L = window.__fp.layout, fi = Math.max(0, L.floors.findIndex((f) => f.devices.some((d) => d.entity === 'light.wohnzimmer'))), f = L.floors[fi];
  for (let i = 0; i < 7; i++) {
    const x = 200 + i * 6, z = 200;
    f.rooms.push({ id: `e2e_r${i}`, name: `E2E Licht ${i + 1}`, points: [[x, z], [x + 4, z], [x + 4, z + 4], [x, z + 4]] });
    f.devices.push({ id: `e2e_l${i}`, type: i === 0 ? 'walllamp' : 'light', entity: 'light.wohnzimmer', x: x + 2, z: i === 0 ? z - 0.1 : z + 2, y: 2 });   // 1: a wall lamp on the edge
  }
  f.rooms.push({ id: 'e2e_relay', name: 'E2E Relais', points: [[200, 220], [204, 220], [204, 224], [200, 224]] });
  f.devices.push({ id: 'e2e_sw', type: 'pendant', entity: 'switch.garage', x: 202, z: 222, y: 2.4 });                // a lamp on a relay
  f.rooms.push({ id: 'e2e_dark', name: 'E2E Dunkel', points: [[210, 220], [214, 220], [214, 224], [210, 224]] });
  f.devices.push({ id: 'e2e_cam', type: 'camera', entity: 'camera.flur', x: 212, z: 222, y: 2.4 });               // a camera: the page 📷 is there
  return fi; }""")
urllib.request.urlopen(HA + "/_set?e=sensor.temp&s=21.6")                                          # a pushed change: the pages are brought up to date
pgQ.wait_for_function("document.querySelectorAll('[data-page=start] .apRoom.lit').length >= 7", timeout=15000)
names_pr = pgQ.evaluate("[...document.querySelectorAll('[data-page=start] .apRoom b')].map((b) => b.textContent)")
lit_pr = pgQ.evaluate("[...document.querySelectorAll('[data-page=start] .apRoom.lit b')].map((b) => b.textContent)")
check("📱 5.36.0: every room with a light on is on Start, also a 7th (the owner: „nicht zuverlässig, dass die Kacheln das erkennen“), the wall lamp on the edge too",
      all(f"E2E Licht {i}" in lit_pr for i in range(1, 8)) and len(names_pr) >= 7, (names_pr, lit_pr))
chips_pr = pgQ.evaluate("""() => { const c = document.querySelector('[data-page=start] .apChips'); const r = c.getBoundingClientRect();
  return [getComputedStyle(c).flexWrap, c.scrollWidth <= c.clientWidth + 1, [...c.children].every((x) => x.getBoundingClientRect().right <= innerWidth + 1), r.width]; }""")
check("📱 5.36.0: the chips wrap into lines, none beyond the edge („ohne dass man scrollen muss nach links“)", chips_pr[0] == "wrap" and chips_pr[1] and chips_pr[2], chips_pr)
check("📱 5.36.0: 📷 the cameras as a chip on Start (on the phone the page is under „Mehr“)", pgQ.locator("[data-page=start] [data-chip=cams]").count() == 1)
pgQ.tap("[data-page=start] [data-chip=cams]"); pgQ.wait_for_timeout(700)
check("📱 5.36.0: … a tap opens the page 📷", pgQ.is_visible("[data-page=cameras]"))
pgQ.tap("#tabBar [data-tab=rooms]"); pgQ.wait_for_timeout(600)
relay_pr = pgQ.locator("[data-page=rooms] .apRoom[data-room=e2e_relay]")
check("📱 5.36.0: a lamp on a relay (switch) is the room's light: „aus“, its button ⏻", relay_pr.count() == 1 and "aus" in relay_pr.inner_text()
      and relay_pr.locator(".apToggle").inner_text().strip() == "⏻", relay_pr.inner_text() if relay_pr.count() else "")
calls_pr = len(ha_calls())
relay_pr.locator(".apToggle").tap(); pgQ.wait_for_timeout(500)
acts_pr = pgQ.evaluate("[...document.querySelectorAll('.apSheetBack[data-sheet=room] .apItem')].map((b) => b.dataset.act)")
check("📱 5.36.0: the round button opens the room's list: Licht an, 📌, Raum öffnen, Abbrechen; nothing switched yet",
      acts_pr == ["roomOn", "roomPin", "roomOpen", "confirmCancel"] and len(ha_calls()) == calls_pr, acts_pr)
pgQ.tap(".apSheet [data-act=roomOn]"); pgQ.wait_for_timeout(800)
check("📱 5.36.0: „Licht an“ switches the relay lamp on", ["switch", "turn_on", "switch.garage"] in ha_calls()[calls_pr:], ha_calls()[calls_pr:])
pgQ.locator("[data-page=rooms] .apRoom[data-room=e2e_r1] .apToggle").tap(); pgQ.wait_for_timeout(500)
items_pr = pgQ.evaluate("[...document.querySelectorAll('.apSheetBack[data-sheet=room] .apItem')].map((b) => [b.dataset.act, b.textContent])")
check("📱 5.36.0: a lit room: „Alle Lichter aus“ (red) and its scene „Gaming“ (it sets the room's light)",
      items_pr[0][0] == "roomOff" and any(a == "roomScene" and "Gaming" in x for a, x in items_pr), items_pr)
calls_pr = len(ha_calls())
pgQ.tap(".apSheet [data-act=roomScene]"); pgQ.wait_for_timeout(800)
check("📱 5.36.0: … a tap on the scene turns it on", ["scene", "turn_on", "scene.gaming"] in ha_calls()[calls_pr:], ha_calls()[calls_pr:])
calls_pr = len(ha_calls())
pgQ.locator("[data-page=rooms] .apRoom[data-room=e2e_r1] .apToggle").tap(); pgQ.wait_for_timeout(400)
pgQ.tap(".apSheet [data-act=confirmCancel]"); pgQ.wait_for_timeout(400)
check("📱 5.36.0: „Abbrechen“ switches nothing", pgQ.locator(".apSheetBack").count() == 0 and len(ha_calls()) == calls_pr)
# 📌 pin the dark room: on Start, on top, kept on this phone
pgQ.locator("[data-page=rooms] .apRoom[data-room=e2e_dark] .apToggle").tap(); pgQ.wait_for_timeout(400)
pgQ.tap(".apSheet [data-act=roomPin]"); pgQ.wait_for_timeout(500)
pgQ.tap("#tabBar [data-tab=start]"); pgQ.wait_for_timeout(600)
first_pr = pgQ.evaluate("document.querySelector('[data-page=start] .apRoom').dataset.room")
check("📱 5.36.0: a pinned room stands on Start first, with 📌, though its light is off", first_pr == "e2e_dark"
      and "📌" in pgQ.inner_text("[data-page=start] .apRoom >> nth=0") and "e2e_dark" in (pgQ.evaluate("localStorage.getItem('fp.appPins')") or ""), first_pr)
pgQ.tap("[data-page=start] [data-act=appPins]"); pgQ.wait_for_timeout(500)
on_pr = pgQ.evaluate("[...document.querySelectorAll('.apSheetBack[data-sheet=pins] .apItem.on')].map((b) => b.dataset.pin)")
check("📱 5.36.0: „📌 Anheften“ lists the rooms, the pinned one marked", any(k.endswith("/e2e_dark") for k in on_pr), on_pr)
pgQ.tap(".apSheet [data-pin$='/e2e_relay']"); pgQ.wait_for_timeout(300)
check("📱 5.36.0: … a tap pins another one, the list stays open", pgQ.locator(".apSheetBack[data-sheet=pins] [data-pin$='/e2e_relay'].on").count() == 1)
pgQ.mouse.click(200, 30); pgQ.wait_for_timeout(500)
order_pr = pgQ.evaluate("[...document.querySelectorAll('[data-page=start] .apRoom')].slice(0, 2).map((x) => x.dataset.room)")
check("📱 5.36.0: the pinned rooms in the order they were pinned", order_pr == ["e2e_dark", "e2e_relay"], order_pr)
# ✎ on a page of the app (the owner: „dass man dort auch die Dashboards richtig bearbeiten kann in der App-Ansicht“)
check("📱 5.36.0: no ✎ on Start", not pgQ.is_visible("#appEdit"))
pgQ.tap("#tabBar [data-tab=more]"); pgQ.wait_for_timeout(400)
pgQ.tap(".apSheet [data-tab=today]"); pgQ.wait_for_timeout(900)
check("📱 5.36.0: a page from Mehr has „✎ Bearbeiten“ at its top", pgQ.is_visible("#appEdit") and "Bearbeiten" in pgQ.inner_text("#appEdit"))
pgQ.tap("#appEdit"); pgQ.wait_for_timeout(900)
check("📱 5.36.0: … which starts the page's edit mode (＋ Karte, ✓ Fertig), the button goes away", pgQ.locator("[data-page=today] .bdStrip").count() == 1
      and not pgQ.is_visible("#appEdit") and pgQ.evaluate("document.body.classList.contains('bdEditing')"))
pgQ.locator("[data-page=today] .bdStrip button", has_text="Reiter").tap(); pgQ.wait_for_timeout(700)
bar_pr = pgQ.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")
wrap_pr = pgQ.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].every((b) => b.getBoundingClientRect().right <= innerWidth + 1)")
check("📱 5.36.0: 🗂 Reiter shows the whole bar to order the tabs and „＋ Seite“, in lines on the phone", "start" not in bar_pr and "today" in bar_pr
      and pgQ.locator("#tabBar [data-act=newPage]").count() == 1 and wrap_pr, bar_pr)
pgQ.tap("#tabEditBar button.primary"); pgQ.wait_for_timeout(600)
check("📱 5.36.0: ✓ Fertig: the app's bar again", pgQ.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")[:2] == ["start", "rooms"])
done_pr = pgQ.locator("[data-page=today] .bdStrip button.primary")
if done_pr.count():
    done_pr.first.tap(); pgQ.wait_for_timeout(600)
check("📱 5.36.0: ✓ Fertig of the page: ✎ is back", pgQ.is_visible("#appEdit") and not pgQ.evaluate("document.body.classList.contains('bdEditing')"))
check("📱 5.36.0: no errors on the page", not own_pr, own_pr)
pgQ.evaluate("localStorage.removeItem('fp.appPins')")
pgQ.close()
urllib.request.urlopen(HA + f"/_set?e=light.wohnzimmer&s={was_pr}"); urllib.request.urlopen(HA + "/_set?e=switch.garage&s=off"); urllib.request.urlopen(HA + "/_set?e=sensor.temp&s=21.5")
set_setting("language", st_pr["language"])
