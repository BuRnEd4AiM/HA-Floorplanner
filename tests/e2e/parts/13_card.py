"""Dashboard card (#13): the Lovelace card dist/floorplan3d-card.js on a stand-in dashboard, the add-on page in it (?card=1), errors of the card.
"""
# The card runs on a stand-in page of the add-on's own address with a fake `hass`: the Supervisor answers with the add-on (Ingress address
# "/", the add-on itself) and a session. The add-on page in the card is the real one.
CARD_JS = (Path(S).parent.parent / "dist" / "floorplan3d-card.js").read_text(encoding="utf-8")
HOST = """<!doctype html><html><head><meta charset="utf-8"><script src="/__card.js"></script></head><body style="margin:0;width:900px">
<script>
window.calls = [];
window.fakeHass = (answer, panel = true) => ({ language: 'en', locale: { language: 'en' }, themes: { darkMode: false },
  panels: { lovelace: { url_path: 'lovelace', config: {} }, ...(panel ? { abcd1234_floorplan3d: { component_name: 'app', url_path: 'abcd1234_floorplan3d', config: { addon: 'abcd1234_floorplan3d' } } } : {}) },
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
# a card for one room (#356): only the room in 3D and never leave it, only its room panel without 3D, and the hint without a room
rr = fr.evaluate("(() => { const fs = window.__fp.layout.floors; for (let i = 0; i < fs.length; i++) { const r = fs[i].rooms.find(x => x.name); if (r) return [i, r.id, r.name]; } })()")
pgC.evaluate(f"window.c1.setConfig({{ room: {json.dumps(rr[2])}, view: 'room' }})")
pgC.wait_for_function("cardMsg(window.c1).includes('3.78.0')", timeout=10000)
check("card (#356): one room only needs add-on 3.78.0: with an older one the card says so and opens nothing", pgC.evaluate("cardSrc(window.c1)") == "", pgC.evaluate("cardMsg(window.c1)"))
pgC.goto(BASE + "cardhost.html")
pgC.evaluate("""window.newHass = fakeHass((m) => {
  if (m.endpoint === '/addons/abcd1234_floorplan3d/info') return { state: 'started', version: '3.78.0', ingress_url: '/' };
  if (m.endpoint === '/ingress/session') return { session: 'sess3' };
  if (m.endpoint === '/ingress/validate_session') return {};
  throw { code: 'unknown_error', message: 'Addon does not exist' };
})""")
def card_frame(part):
    """the add-on page in the card whose address has `part`, opened again with the test hooks"""
    f = None
    for _ in range(40):
        f = next((x for x in pgC.frames if part in x.url and "debug=1" not in x.url), None)
        if f: break
        pgC.wait_for_timeout(250)
    f.goto(f.url + "&debug=1")
    f.wait_for_function("window.__fp && window.__fp.ready && window.__fp.ready()", timeout=30000)
    f.wait_for_timeout(800)
    return f
pgC.evaluate(f"window.c7 = addCard({{ room: {json.dumps(rr[2])}, view: 'room', idle_return: 1 }}, newHass)")
pgC.wait_for_function("cardSrc(window.c7).includes('view=room')", timeout=10000)
fr = card_frame("view=room")
cls = fr.evaluate("[...document.body.classList]")
check("card (#356): only the room: it starts in the room, without the room panel, the bar at the top or the search",
      all(c in cls for c in ["card-room", "card-nonav", "roomtablet"]) and fr.evaluate("window.__fp.focusedRoom()") == rr[1] and fr.evaluate("window.__fp.floorIdx()") == rr[0]
      and fr.locator("#roomPanel").is_hidden() and fr.locator("#navBar").is_hidden() and fr.locator("#findBtn").is_hidden() and fr.locator("#view").is_visible(), cls)
fr.evaluate(f"window.__fp.liveTapRoom('{rr[1]}')"); fr.wait_for_timeout(500)
check("card (#356): only the room: a tap into the room does not leave it", fr.evaluate("window.__fp.focusedRoom()") == rr[1] and fr.locator("#roomPanel").is_hidden())
fr.evaluate("window.__fp.kioskIdle(2 * 60000); window.__fp.kioskTick()"); fr.wait_for_timeout(1200)
check("card (#356): only the room: after the idle time it is still in the room", fr.evaluate("window.__fp.focusedRoom()") == rr[1] and fr.evaluate("window.__fp.houseMode()") is False)
pgC.evaluate(f"window.c7.setConfig({{ room: {json.dumps(rr[2])}, view: 'panel', idle_return: 1 }})")
pgC.wait_for_function("cardSrc(window.c7).includes('view=panel')", timeout=10000)
fr = card_frame("view=panel")
box = fr.evaluate("(() => { const r = document.getElementById('roomPanel').getBoundingClientRect(); return [r.left, r.top, r.width, r.height, innerWidth, innerHeight]; })()")
check("card (#356): only the controls: the room panel of the room fills the card, no 3D picture, no close button, the heating inside it",
      "card-panel" in fr.evaluate("[...document.body.classList]") and fr.locator("#roomPanel").is_visible() and fr.locator("#view").is_hidden()
      and fr.locator("#roomPanel .rp-head b").inner_text().strip() == rr[2].strip() and fr.locator("#roomPanel .rp-x").count() == 0
      and fr.evaluate("document.getElementById('heatPanel').parentNode.id") == "roomPanel"
      and box[0] == 0 and box[1] == 0 and abs(box[2] - box[4]) <= 2 and abs(box[3] - box[5]) <= 2, box)
fr.evaluate("window.__fp.kioskIdle(2 * 60000); window.__fp.kioskTick()"); fr.wait_for_timeout(1200)
check("card (#356): only the controls: the room panel stays open after the idle time", fr.locator("#roomPanel").is_visible()
      and fr.locator("#roomPanel .rp-head b").inner_text().strip() == rr[2].strip())
pgC.screenshot(path=os.path.join(S, "card-panel.png"))
pgC.evaluate("window.c7.setConfig({ view: 'panel' })")
pgC.wait_for_function("cardSrc(window.c7).includes('view=panel') && !cardSrc(window.c7).includes('room=')", timeout=10000)
fr = card_frame("view=panel")
check("card (#356): only the controls without a room: the card says to choose one", fr.locator("#cardHint").is_visible() and fr.locator("#roomPanel").is_hidden(),
      fr.evaluate("document.getElementById('cardHint')?.textContent"))
# not in the sidebar and installed under another name (#352): an administrator's card finds it in the list of installed add-ons
pgC.goto(BASE + "cardhost.html")
pgC.evaluate("""window.c6 = addCard({}, fakeHass((m) => {
  if (m.endpoint === '/addons') return { addons: [{ slug: 'core_ssh' }, { slug: '9f8e7d6c_floorplan3d' }] };
  if (m.endpoint === '/addons/9f8e7d6c_floorplan3d/info') return { state: 'started', version: '3.76.1', ingress_url: '/' };
  if (m.endpoint === '/ingress/session') return { session: 'sess2' };
  throw { code: 'unknown_error', message: 'Addon does not exist' };
}, false))""")
pgC.wait_for_function("cardSrc(window.c6) !== ''", timeout=10000)
check("card (#352): not in the sidebar, the repository added under another address: found in the list of installed add-ons",
      pgC.evaluate("cardSrc(window.c6)").startswith("/?card=1") and "/addons/9f8e7d6c_floorplan3d/info" in pgC.evaluate("window.calls"), pgC.evaluate("window.calls"))
# the card tells what is wrong (a fresh page: the add-on found above is kept for every card of a page; each card here its own add-on name)
pgC.goto(BASE + "cardhost.html")
pgC.evaluate("""window.c2 = addCard({}, fakeHass(() => { throw { code: 'unknown_error', message: 'Addon is not installed' }; }, false));
  window.c3 = addCard({ addon: 'stopped_floorplan3d' }, fakeHass((m) => m.endpoint.endsWith('/info') ? { state: 'stopped', version: '3.75.0', ingress_url: '/x/' } : {}));
  window.c4 = addCard({ addon: 'old_floorplan3d' }, fakeHass((m) => m.endpoint.endsWith('/info') ? { state: 'started', version: '3.60.0', ingress_url: '/x/' } : { session: 's' }));
  window.c5 = addCard({ addon: 'mine_floorplan3d' }, fakeHass(() => { throw { code: 'unauthorized', message: 'Unauthorized' }; }));""")
pgC.wait_for_timeout(1500)
msgs = pgC.evaluate("[c2, c3, c4, c5].map(c => [cardMsg(c), cardSrc(c)])")
check("card (#13): add-on not installed, not running, too old, no access: the card says so and opens nothing",
      "not found" in msgs[0][0] and "local_floorplan3d" in msgs[0][0] and "not running" in msgs[1][0] and "3.60.0" in msgs[2][0] and "does not let this user" in msgs[3][0]
      and all(s == "" for _, s in msgs), msgs)
pgC.close()
