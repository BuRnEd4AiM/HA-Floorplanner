"""4.14.0 (#495): the look of a button card. In "Karte einstellen" of a button: a symbol, the colour when on (or the lamp's own), the
shape (tile, round, pill, only the symbol) and size (S–XL), what it shows (name, state, brightness as a bar, since when), what a tap and
a long press do (switch, the window with the controls, open a page, Home Assistant's window). The window with the controls shows on /
off, a lamp's brightness, a thermostat's circle …
"""
import datetime as _dt
st_bt = api("api/settings")
set_setting("language", "de"); set_setting("pageLayouts", {})
two_h = (_dt.datetime.now(_dt.timezone.utc) - _dt.timedelta(hours=2, minutes=5)).isoformat()
urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps({
    "light.e2e_lampe": {"state": "on", "last_changed": two_h, "attributes": {"friendly_name": "Stehlampe", "brightness": 128, "rgb_color": [255, 0, 0]}},
}).encode(), headers={"Content-Type": "application/json"}, method="POST")).read()
own_bt = []
pgB = b.new_page(viewport={"width": 1400, "height": 1200}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgB.on("console", lambda m: own_bt.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgB.on("pageerror", lambda e: own_bt.append("PAGEERROR " + str(e)))
lay_bt = lambda: api("api/settings").get("pageLayouts", {}).get("today", {})
calldata_bt = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
def until_bt(fn, n=20, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgB.wait_for_timeout(ms)
    return fn()
def hold_bt(sel, ms=800):
    bb = pgB.locator(sel).bounding_box()
    pgB.mouse.move(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2); pgB.mouse.down(); pgB.wait_for_timeout(ms); pgB.mouse.up(); pgB.wait_for_timeout(500)
def edit_bt(card_id):
    pgB.click("#tabBar .tbEdit"); pgB.wait_for_timeout(500)
    pgB.locator(f"[data-page=today] [data-card={card_id}] .bdTools .bdTool").first.click(); pgB.wait_for_timeout(600)
def done_bt():
    pgB.click(".ceDlg [data-act=save]"); pgB.wait_for_timeout(500)
    pgB.click("[data-page=today] [data-act=done]"); pgB.wait_for_timeout(1000)

pgB.goto(BASE + "?debug=1"); pgB.wait_for_timeout(1500)
if pgB.is_visible("#modeSwitch [data-mode=live]"): pgB.click("#modeSwitch [data-mode=live]"); pgB.wait_for_timeout(1000)
pgB.click("#tabBar [data-tab=today]"); pgB.wait_for_timeout(1200)
pgB.click("#tabBar .tbEdit"); pgB.wait_for_timeout(500)
pgB.click("[data-page=today] .bdAdd"); pgB.wait_for_timeout(400)
pgB.click(".ceDlg [data-type=button]"); pgB.wait_for_timeout(500)
pgB.fill(".ceDlg .ceSearch", "stehlampe"); pgB.wait_for_timeout(300)
pgB.click(".ceDlg .ceItem[data-entity='light.e2e_lampe']"); pgB.wait_for_timeout(200)
check("buttons (#495): 'Karte einstellen' of a button has symbol, colour, shape and size, what it shows, tap and long press",
      all(pgB.locator(f".ceDlg {s}").count() >= 1 for s in (".obIcons", ".obColors", ".ceSeg [data-v=round]", ".ceSeg [data-v=xl]", ".obShow", ".obTap", ".ceSeg [data-v=details]")))
pgB.click(".ceDlg .obIcons [data-v='🛋']"); pgB.click(".ceDlg .obColors [data-v=lamp]"); pgB.click(".ceDlg .ceSeg [data-v=round]"); pgB.click(".ceDlg .ceSeg [data-v=l]")
pgB.click(".ceDlg .obShow [data-v=bar]"); pgB.click(".ceDlg .obShow [data-v=since]"); pgB.wait_for_timeout(300)
check("buttons: the preview is round and large with the sofa", pgB.locator(".ceDlg .cePrev .ob-round.ob-l").count() == 1 and "🛋" in pgB.inner_text(".ceDlg .cePrev"))
pgB.click(".ceDlg [data-act=save]"); pgB.wait_for_timeout(600)
cs = until_bt(lambda: lay_bt().get("cards"))
c0 = cs[0] if cs else {}
check("buttons: saved for everybody with its look", c0.get("type") == "button" and c0.get("icon") == "🛋" and c0.get("onColor") == "lamp"
      and c0.get("shape") == "round" and c0.get("bsize") == "l" and c0.get("show") == ["name", "state", "bar", "since"] and c0.get("tap") == "toggle"
      and c0.get("hold") == "more", c0)
cid = c0.get("id", "x")
pgB.click("[data-page=today] [data-act=done]"); pgB.wait_for_timeout(1000)
card = f"[data-page=today] [data-card={cid}]"
col = pgB.evaluate(f"getComputedStyle(document.querySelector('{card} .obBtn')).getPropertyValue('--obc')")
check("buttons: on, in the lamp's own colour, the brightness as a bar (50 %), since when", pgB.locator(f"{card} .obBtn.on").count() == 1
      and "255, 0, 0" in col and pgB.evaluate(f"document.querySelector('{card} .obBar i')?.style.width") == "50%"
      and "seit 2 Std." in pgB.inner_text(card), [col, pgB.inner_text(card)])
pgB.click(f"{card} [data-act=tap]"); pgB.wait_for_timeout(800)
check("buttons: a tap switches it (toggle)", until_bt(lambda: ["light", "toggle", "light.e2e_lampe"] in ha_calls()), ha_calls()[-3:])
check("buttons: off it has no colour and no bar", until_bt(lambda: pgB.locator(f"{card} .obBtn.on").count() == 0 and pgB.locator(f"{card} .obBar").count() == 0))
hold_bt(f"{card} [data-act=tap]")
check("buttons: a long press opens the window with the controls (name, on / off) and does not switch",
      pgB.evaluate("document.querySelector('.ctlDlg')?.open") is True and "Stehlampe" in pgB.inner_text(".ctlDlg")
      and pgB.locator(".ctlDlg [data-act=ctlToggle]").count() == 1 and ha_calls().count(["light", "toggle", "light.e2e_lampe"]) == 1, ha_calls()[-3:])
pgB.click(".ctlDlg .sw"); pgB.wait_for_timeout(800)
check("buttons: the window's switch turns it on, the window shows its brightness then", until_bt(lambda: ["light", "turn_on", "light.e2e_lampe"] in ha_calls())
      and until_bt(lambda: pgB.locator(".ctlDlg .lightctl input[type=range]").count() == 1), ha_calls()[-3:])
pgB.click(".ctlDlg [data-act=ctlClose]"); pgB.wait_for_timeout(300)

# --- a tap opens a page; a thermostat's button opens its circle
edit_bt(cid)
pgB.click(".ceDlg .obTap [data-v=page]"); pgB.wait_for_timeout(200)
pgB.select_option(".ceDlg [data-act=obPage]", "climate"); pgB.click(".ceDlg .ceSeg [data-v=pill]"); pgB.wait_for_timeout(200)
done_bt()
check("buttons: 'Seite öffnen' saved with its page, the button a pill", until_bt(lambda: (lay_bt().get("cards") or [{}])[0].get("page") == "climate")
      and pgB.locator(f"{card}.ob-pill").count() == 1, lay_bt().get("cards"))
pgB.click(f"{card} [data-act=tap]"); pgB.wait_for_timeout(800)
check("buttons: a tap opens the page 🌡 Klima", pgB.evaluate("document.querySelector('#tabBar [data-tab].active')?.dataset.tab") == "climate")
pgB.click("#tabBar [data-tab=today]"); pgB.wait_for_timeout(800)
pgB.click("#tabBar .tbEdit"); pgB.wait_for_timeout(500)
pgB.click("[data-page=today] .bdAdd"); pgB.wait_for_timeout(400)
pgB.click(".ceDlg [data-type=button]"); pgB.wait_for_timeout(400)
pgB.fill(".ceDlg .ceSearch", "climate.wohnzimmer"); pgB.wait_for_timeout(300)
check("buttons: a thermostat can be a button too", pgB.locator(".ceDlg .ceItem[data-entity='climate.wohnzimmer']").count() == 1)
pgB.click(".ceDlg .ceItem[data-entity='climate.wohnzimmer']"); pgB.click(".ceDlg .ceSeg [data-v=icon]"); pgB.wait_for_timeout(200)
done_bt()
cs = lay_bt().get("cards") or []
cid2 = cs[-1]["id"] if cs else "x"
check("buttons: 'Nur Symbol' shows no text", pgB.locator(f"[data-page=today] [data-card={cid2}].ob-icon").count() == 1
      and pgB.locator(f"[data-page=today] [data-card={cid2}] .obText").count() == 0)
pgB.click(f"[data-page=today] [data-card={cid2}] [data-act=tap]"); pgB.wait_for_timeout(800)
check("buttons: a thermostat's tap opens the window with its circle", pgB.evaluate("document.querySelector('.ctlDlg')?.open") is True
      and pgB.locator(".ctlDlg .th").count() == 1)
pgB.keyboard.press("Escape"); pgB.wait_for_timeout(300)
check("buttons: no errors on the page", not own_bt, own_bt[:3])
pgB.close()
urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")).read()
set_setting("pageLayouts", st_bt.get("pageLayouts", {})); set_setting("language", st_bt.get("language", ""))
