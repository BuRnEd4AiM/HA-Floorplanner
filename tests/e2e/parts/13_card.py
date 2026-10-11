"""Dashboard card (#13): the Lovelace card dist/floorplan3d-card.js on a stand-in dashboard, the add-on page in it (?card=1), errors of the card.
"""
# The card runs on a stand-in page of the add-on's own address with a fake `hass`: the Supervisor answers with the add-on (Ingress address
# "/", the add-on itself) and a session. The add-on page in the card is the real one.
CARD_JS = (Path(S).parent.parent / "dist" / "floorplan3d-card.js").read_text(encoding="utf-8")
HOST = """<!doctype html><html><head><meta charset="utf-8"><script src="/__card.js"></script></head><body style="margin:0;width:900px">
<script>
window.calls = [];
window.fakeHass = (answer, panel = true) => ({ language: 'en', locale: { language: 'en' }, themes: { darkMode: false },
  panels: { lovelace: { url_path: 'lovelace', config: {} }, ...(panel ? { abcd1234_floorplan3d: { url_path: 'abcd1234_floorplan3d', config: { ingress: 'abcd1234_floorplan3d' } } } : {}) },
  callWS: async (m) => { window.calls.push(m.endpoint); return answer(m); } });
window.okHass = window.fakeHass((m) => {
  if (m.endpoint === '/addons/abcd1234_floorplan3d/info') return { state: 'started', version: '3.75.0', ingress_url: '/' };
  if (m.endpoint === '/ingress/session') return { session: 'sess1' };
  if (m.endpoint === '/ingress/validate_session') return {};
  throw { code: 'unknown_error', message: 'Addon does not exist' };
});
window.addCard = (config, hass) => { const c = document.createElement('floorplan3d-card'); c.setConfig(config); c.hass = hass; document.body.append(c); return c; };
window.cardMsg = (c) => { const m = c.shadowRoot.querySelector('.msg'); return m.hidden ? '' : m.textContent; };
window.cardSrc = (c) => c.shadowRoot.querySelector('iframe').getAttribute('src') || '';
</script></body></html>"""
pgC = b.new_page(viewport={"width": 900, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgC.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgC.route("**/cardhost.html", lambda r: r.fulfill(body=HOST, content_type="text/html"))
pgC.route("**/__card.js", lambda r: r.fulfill(body=CARD_JS, content_type="text/javascript"))
pgC.goto(BASE + "cardhost.html")
check("card (#13): the card is defined and offered in the card picker", pgC.evaluate("!!customElements.get('floorplan3d-card') && window.customCards.some(c => c.type === 'floorplan3d-card')"))
before = api_admin("api/settings")
pgC.evaluate("window.c1 = addCard({ floor: 'house', theme: 'auto', heatmap: 'temp', room_panel: false, idle_return: 1, title: 'Haus' }, okHass)")
pgC.wait_for_function("cardSrc(window.c1) !== ''", timeout=10000)
src = pgC.evaluate("cardSrc(window.c1)")
calls = pgC.evaluate("window.calls")
check("card (#13): it finds the add-on by its sidebar panel and opens an Ingress session", calls[:2] == ["/addons/abcd1234_floorplan3d/info", "/ingress/session"], calls)
check("card (#13): the frame opens the add-on with ?card=1 and the options", src.startswith("/?card=1") and all(x in src for x in ["floor=house", "theme=light", "heatmap=temp", "room_panel=0", "idle_return=1"]), src)
check("card (#13): the height and the title", pgC.evaluate("window.c1.shadowRoot.querySelector('.box').style.height") == "400px"
      and pgC.evaluate("window.c1.shadowRoot.querySelector('ha-card').getAttribute('header')") == "Haus")
fr = next(f for f in pgC.frames if "card=1" in f.url)
fr.goto(fr.url + "&debug=1")                 # the test hooks of the add-on page (the card itself never asks for them)
fr.wait_for_function("window.__fp && window.__fp.ready && window.__fp.ready()", timeout=30000)
fr.wait_for_timeout(800)
cls = fr.evaluate("[...document.body.classList]")
check("card (#13): the page in the card is a live view without editing bars", all(c in cls for c in ["card", "kiosk", "live"]) and fr.locator("#toolbar").is_hidden(), cls)
check("card (#13): it starts on the whole house with the temperature colours", fr.evaluate("window.__fp.houseMode()") is True
      and fr.locator('#modeBar button[data-vm="temp"].active').count() == 1)
st = fr.evaluate("window.__fp.settings()")
check("card (#13): the look of the card for this screen (theme like Home Assistant, idle return)", st["theme"] == "light" and st["idleReturn"] == 1, (st["theme"], st["idleReturn"]))
fl = fr.evaluate("window.__fp.layout.floors.findIndex(f => f.rooms.some(r => r.name))")
rid = fr.evaluate(f"window.__fp.layout.floors[{fl}].rooms.find(r => r.name).id")
fr.evaluate(f"window.__fp.switchFloor({fl})"); fr.wait_for_timeout(400)
fr.evaluate(f"window.__fp.liveTapRoom('{rid}')"); fr.wait_for_timeout(500)
check("card (#13): without the room panel a tap on a room only goes into the room", fr.evaluate("window.__fp.focusedRoom()") == rid and fr.locator("#roomPanel").is_hidden())
fr.evaluate("window.__fp.kioskIdle(2 * 60000); window.__fp.kioskTick()"); fr.wait_for_timeout(1200)
check("card (#13): after the idle time it goes back to the card's start (the whole house)", fr.evaluate("window.__fp.houseMode()") is True)
fr.evaluate("document.getElementById('autoToggle').click()"); fr.wait_for_timeout(2500)     # a setting changed in the card is saved ...
after = api_admin("api/settings")
check("card (#13): ... but the card's own look never becomes everybody's settings", after["theme"] == before["theme"] and after["idleReturn"] == before["idleReturn"]
      and after["cutaway"] != before["cutaway"], (before["theme"], after["theme"], before["idleReturn"], after["idleReturn"]))
fr.evaluate("document.getElementById('autoToggle').click()"); fr.wait_for_timeout(2500)
# another config and Home Assistant in dark mode: the frame follows; without the bars
pgC.evaluate("window.c1.setConfig({ floor: '0', theme: 'auto', show_nav: false, show_bar: false, height: 300 }); window.c1.hass = { ...okHass, themes: { darkMode: true } }")
pgC.wait_for_function("cardSrc(window.c1).includes('show_bar=0')", timeout=10000)
src2 = pgC.evaluate("cardSrc(window.c1)")
check("card (#13): a new config and the dark mode of Home Assistant change the frame", "theme=dark" in src2 and "floor=0" in src2 and "heatmap" not in src2, src2)
pgC.wait_for_timeout(500)
fr = next(f for f in pgC.frames if "show_bar=0" in f.url)
fr.goto(fr.url + "&debug=1")
fr.wait_for_function("window.__fp && window.__fp.ready && window.__fp.ready()", timeout=30000)
fr.wait_for_timeout(500)
gi = fr.evaluate("window.__fp.layout.floors.findIndex(f => f.kind !== 'basement')")
check("card (#13): floor 0 is the ground floor", fr.evaluate("window.__fp.floorIdx()") == gi and fr.evaluate("window.__fp.houseMode()") is False)
check("card (#13): without the bars at the top and the bottom", fr.locator("#navBar").is_hidden() and fr.locator("#modeBar").is_hidden() and fr.locator("#findBtn").is_hidden()
      and fr.locator("#compass").is_hidden())
check("card (#13): the height option", pgC.evaluate("window.c1.shadowRoot.querySelector('.box').style.height") == "300px")
pgC.screenshot(path=os.path.join(S, "card.png"))
# the card tells what is wrong (a fresh page: the add-on found above is kept for every card of a page; each card here its own add-on name)
pgC.goto(BASE + "cardhost.html")
pgC.evaluate("""window.c2 = addCard({}, fakeHass(() => { throw { code: 'unknown_error', message: 'Addon is not installed' }; }, false));
  window.c3 = addCard({ addon: 'stopped_floorplan3d' }, fakeHass((m) => m.endpoint.endsWith('/info') ? { state: 'stopped', version: '3.75.0', ingress_url: '/x/' } : {}));
  window.c4 = addCard({ addon: 'old_floorplan3d' }, fakeHass((m) => m.endpoint.endsWith('/info') ? { state: 'started', version: '3.60.0', ingress_url: '/x/' } : { session: 's' }));
  window.c5 = addCard({ addon: 'mine_floorplan3d' }, fakeHass(() => { throw { code: 'unauthorized', message: 'Unauthorized' }; }));""")
pgC.wait_for_timeout(1500)
msgs = pgC.evaluate("[c2, c3, c4, c5].map(c => [cardMsg(c), cardSrc(c)])")
check("card (#13): add-on not installed, not running, too old, no access: the card says so and opens nothing",
      "not found" in msgs[0][0] and "not running" in msgs[1][0] and "3.60.0" in msgs[2][0] and "does not let this user" in msgs[3][0]
      and all(s == "" for _, s in msgs), msgs)
pgC.close()
