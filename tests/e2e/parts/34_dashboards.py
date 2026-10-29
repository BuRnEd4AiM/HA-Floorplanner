"""4.6.0 (#484): the pages of the tab bar arranged like a Home Assistant dashboard. ✎ in the bar (editors only) starts the edit mode of
the open page: 👁 hides a card (gone while editing too, in the row "👁 Ausgeblendet", a tap there shows it again, #595), ⠿ drags it to another place, "＋ Karte" adds an own card (a switch, a history with Home Assistant's
history), "Wie am Anfang" puts the cards back; "🗂 Reiter" edits the bar: "＋ Seite" makes an own page (with the cards of ☀ Heute),
a tap on it deletes it again. Everything for everybody in the settings (pageLayouts, customTabs, tabOrder); a user may have an own
page hidden like any other; who may not edit has no ✎.
"""
st_db = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
for k, v in (("pageLayouts", {}), ("customTabs", []), ("tabOrder", []), ("userTabs", {})):
    set_setting(k, v)
own_db = []
def watch_db(pg_):
    pg_.on("console", lambda m: own_db.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_db.append("PAGEERROR " + str(e)))
    return pg_
keys_db = lambda pg_, page: pg_.evaluate(f"[...document.querySelectorAll('[data-page={page}] .bdItem')].map((x) => x.dataset.key)")
tabs_db = lambda pg_: pg_.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")
def until(fn, n=20, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgD.wait_for_timeout(ms)
    return fn()

pgD = watch_db(b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgD.on("dialog", lambda d: d.accept())                              # "Wie am Anfang?", "Seite löschen?": yes
pgD.goto(BASE + "?debug=1"); pgD.wait_for_timeout(1500)
if pgD.is_visible("#modeSwitch [data-mode=live]"): pgD.click("#modeSwitch [data-mode=live]"); pgD.wait_for_timeout(1000)
pgD.click("#tabBar [data-tab=today]"); pgD.wait_for_timeout(1500)
before = keys_db(pgD, "today")
check("dashboards (#484): ☀ Heute's cards are keyed (clock, agenda, house …) and an editor has ✎ Bearbeiten in the bar",
      {"clock", "agenda", "house"} <= set(before) and pgD.is_visible("#tabBar .tbEdit"), before)
pgD.click("#tabBar .tbEdit"); pgD.wait_for_timeout(800)
check("dashboards: the edit mode: the strip at the top, every card with ⠿ and 👁, '＋ Karte hinzufügen' at the end",
      pgD.is_visible("[data-page=today] .bdStrip") and pgD.locator("[data-page=today] .bdItem .bdGrip").count() == len(before) and pgD.is_visible("[data-page=today] .bdAdd"))
pgD.click("[data-page=today] .bdItem[data-key=house] .bdTool[data-act=hide]"); pgD.wait_for_timeout(800)
lay = lambda: api("api/settings").get("pageLayouts", {}).get("today", {})
hid_db = lambda: pgD.evaluate("[...document.querySelectorAll('[data-page=today] .bdHidden .bdHidChip')].map((x) => [x.dataset.key, x.textContent])")
check("dashboards: 👁 hides 'Im Haus' (saved for everybody); gone while editing too, by name in the row '👁 Ausgeblendet' under the strip (#595)",
      until(lambda: lay().get("hidden") == ["house"]) and "house" not in keys_db(pgD, "today") and hid_db() == [["house", "Im Haus"]]
      and "Ausgeblendet" in pgD.inner_text("[data-page=today] .bdHidden"), (lay(), hid_db()))
g = pgD.locator("[data-page=today] .bdItem[data-key=agenda] .bdGrip").bounding_box()
c = pgD.locator("[data-page=today] .bdItem[data-key=clock]").bounding_box()
pgD.mouse.move(g["x"] + 12, g["y"] + 12); pgD.mouse.down()
pgD.mouse.move(c["x"] + 20, c["y"] + 30, steps=12); pgD.mouse.up(); pgD.wait_for_timeout(1000)
check("dashboards: ⠿ dragged 'Termine' in front of the clock: the order is saved, the hidden 'Im Haus' keeps its place in it (#595)",
      until(lambda: (lay().get("order") or [""])[0] == "agenda") and keys_db(pgD, "today")[0] == "agenda"
      and lay()["order"].index("house") == lay()["order"].index(before[before.index("house") - 1]) + 1, lay())

# --- own cards: a switch and a history
pgD.click("[data-page=today] .bdAdd"); pgD.wait_for_timeout(500)
check("cards: '＋ Karte hinzufügen' offers fourteen kinds (the calendar since #495, the train since #550)", pgD.locator(".ceDlg .ceType").count() == 14)
pgD.click(".ceDlg [data-type=switch]"); pgD.wait_for_timeout(400)
pgD.fill(".ceDlg .ceSearch", "garage"); pgD.wait_for_timeout(300)
offered = pgD.evaluate("[...document.querySelectorAll('.ceDlg .ceItem')].map((x) => x.dataset.entity)")
check("cards: the device list only has what fits a switch and is searched while typing", offered == ["switch.garage"], offered)
pgD.click(".ceDlg .ceItem[data-entity='switch.garage']"); pgD.wait_for_timeout(300)
check("cards: the preview shows the card", pgD.locator(".ceDlg .cePrev .oc-switch").count() == 1)
pgD.click(".ceDlg [data-act=save]"); pgD.wait_for_timeout(1200)
cards = lambda: lay().get("cards") or []
check("cards: the switch card is saved and on the page", until(lambda: [x["entity"] for x in cards()] == ["switch.garage"])
      and pgD.locator("[data-page=today] .oc-switch").count() == 1, cards())
pgD.click("[data-page=today] .bdAdd"); pgD.click(".ceDlg [data-type=graph]"); pgD.wait_for_timeout(300)
pgD.fill(".ceDlg .ceSearch", "temperatur"); pgD.wait_for_timeout(300)
pgD.click(".ceDlg .ceItem[data-entity='sensor.temp']"); pgD.click(".ceDlg .ceSeg button[data-v='168']"); pgD.wait_for_timeout(300)
pgD.click(".ceDlg [data-act=save]"); pgD.wait_for_timeout(2000)
asked = json.load(urllib.request.urlopen(HA + "/_history"))
check("cards: a history card (7 days) asks Home Assistant for the history and draws a line",
      any(a[0] == "sensor.temp" for a in asked) and until(lambda: pgD.locator("[data-page=today] .oc-graph .ocChart path").count() == 2)
      and [x.get("hours") for x in cards() if x["type"] == "graph"] == [168], (asked[-1:], cards()))
pgD.click("[data-page=today] .bdAdd"); pgD.click(".ceDlg [data-type=thermostat]"); pgD.wait_for_timeout(300)
pgD.click(".ceDlg .ceItem[data-entity='climate.wohnzimmer']"); pgD.click(".ceDlg .ceSeg button[data-v='small']"); pgD.wait_for_timeout(300)
prev_db = pgD.locator(".ceDlg .cePrev .th.small").count()
pgD.click(".ceDlg [data-act=save]"); pgD.wait_for_timeout(1000)
check("cards (#495): a thermostat card as a small circle (the preview too), its size saved",
      prev_db == 1 and until(lambda: [x.get("size") for x in cards() if x["type"] == "thermostat"] == ["small"])
      and pgD.locator("[data-page=today] .oc-thermostat .th.small").count() == 1, (prev_db, cards()))
pgD.click("[data-page=today] .bdStrip [data-act=done]"); pgD.wait_for_timeout(800)
check("dashboards: 'Fertig' ends the edit mode: 'Im Haus' is gone, the own cards stay",
      pgD.is_hidden("[data-page=today] .bdStrip") and "house" not in keys_db(pgD, "today") and pgD.locator("[data-page=today] .oc-switch").count() == 1)
pgD.click("[data-page=today] .oc-switch .sw input")
check("cards: the switch card switches", until(lambda: ["switch", "turn_on", "switch.garage"] in ha_calls()))
pgD.click("#tabBar .tbEdit"); pgD.wait_for_timeout(600)
pgD.click("[data-page=today] .bdHidden .bdHidChip[data-key=house]"); pgD.wait_for_timeout(800)
check("dashboards: a tap on 'Im Haus' in the row 'Ausgeblendet' shows it again at its place, the row says there is none (#595)",
      until(lambda: not lay().get("hidden")) and "house" in keys_db(pgD, "today") and hid_db() == []
      and keys_db(pgD, "today").index("house") == keys_db(pgD, "today").index(before[before.index("house") - 1]) + 1, (lay(), keys_db(pgD, "today")))
pgD.click("[data-page=today] .bdStrip [data-act=reset]"); pgD.wait_for_timeout(1000)
check("dashboards: 'Wie am Anfang' shows every card in its usual order again, the own cards stay at the end",
      until(lambda: not lay().get("hidden") and not lay().get("order")) and len(cards()) == 3 and keys_db(pgD, "today")[:len(before)] == before, (lay(), keys_db(pgD, "today")))

# --- own pages and the order of the bar
pgD.click("[data-page=today] .bdStrip [data-act=tabs]"); pgD.wait_for_timeout(500)
check("tabs: '🗂 Reiter' turns the bar into an editor with '＋ Seite'", pgD.is_visible("#tabEditBar") and pgD.is_visible("#tabBar [data-act=newPage]"))
pgD.click("#tabBar [data-act=newPage]"); pgD.wait_for_timeout(400)
pgD.fill(".teDlg [data-role=name]", "Garten"); pgD.click(".teDlg [data-start=today]")
pgD.click(".teDlg [data-act=create]"); pgD.wait_for_timeout(1500)
s = api("api/settings")
gid = (s.get("customTabs") or [{}])[0].get("id", "")
check("tabs: '＋ Seite' makes the page 'Garten' (saved for everybody) and opens it in the edit mode with the cards of ☀ Heute",
      s.get("customTabs", [{}])[0].get("name") == "Garten" and gid in tabs_db(pgD) and pgD.evaluate("document.querySelector('#tabBar [data-tab].active')?.dataset.tab") == gid
      and pgD.locator(f"[data-page={gid}] .tdTime").count() == 1 and pgD.is_visible(f"[data-page={gid}] .bdStrip") and len(s["pageLayouts"].get(gid, {}).get("cards", [])) == 8, (s.get("customTabs"), tabs_db(pgD)))
check("tabs: the new page came after the last tab", tabs_db(pgD)[-1] == gid and gid in s.get("tabOrder", []), (tabs_db(pgD), s.get("tabOrder")))
pgD.click(f"[data-page={gid}] .bdStrip [data-act=done]"); pgD.wait_for_timeout(400)
pgD.close()

set_setting("userTabs", {"tablet_db": {"hide": [gid]}})
pgT = watch_db(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_db"}))
pgT.goto(BASE + "?debug=1"); pgT.wait_for_timeout(2000)
check("tabs: a user with the own page hidden does not have it; who may not edit has no ✎", gid not in tabs_db(pgT) and pgT.locator("#tabBar .tbEdit").count() == 0, tabs_db(pgT))
set_setting("userTabs", {})
pgT.reload(); pgT.wait_for_timeout(2000)
check("tabs: everybody else sees the own page", gid in tabs_db(pgT), tabs_db(pgT))
pgT.close()

pgE = watch_db(b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgE.on("dialog", lambda d: d.accept())
pgE.goto(BASE + "?debug=1"); pgE.wait_for_timeout(1500)
if pgE.is_visible("#modeSwitch [data-mode=live]"): pgE.click("#modeSwitch [data-mode=live]"); pgE.wait_for_timeout(1000)
pgE.click(f"#tabBar [data-tab={gid}]"); pgE.wait_for_timeout(800)
pgE.click("#tabBar .tbEdit"); pgE.wait_for_timeout(500)
pgE.click(f"[data-page={gid}] .bdStrip [data-act=tabs]"); pgE.wait_for_timeout(400)
pgE.click(f"#tabBar [data-tab={gid}]"); pgE.wait_for_timeout(500)
pgE.click(".teDlg [data-act=delete]"); pgE.wait_for_timeout(1200)
s = api("api/settings")
check("tabs: a tap on the own page while editing the bar, '🗑 Seite löschen': gone with its cards", not s.get("customTabs") and gid not in s.get("pageLayouts", {})
      and gid not in tabs_db(pgE), (s.get("customTabs"), tabs_db(pgE)))
pgE.close()
check("dashboards: no errors on the page", not own_db, own_db[:3])

for k, v in (("pageLayouts", {}), ("customTabs", []), ("tabOrder", []), ("userTabs", {}), ("language", st_db.get("language", "")), ("units", st_db.get("units", "metric"))):
    set_setting(k, v)
