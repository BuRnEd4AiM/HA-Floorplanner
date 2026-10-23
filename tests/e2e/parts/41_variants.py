"""4.18.0 (#507): a page in own versions per user. In ✎ on 🌡 Klima the purple strip "🗂 Fassung": "＋ Neue Fassung" (name, a copy of
"Für alle", who gets it) makes "Kinder" for one user and edits it; a card hidden there stays in "Für alle"; "👁 Ansehen als …" shows the
screen as that user sees it (his version, his tabs, no ✎) until "Zurück"; api/me hands him his version; "👥 Wer sieht was" switches his
tab off; "⚙ Einstellen" deletes the version again, its user sees "Für alle".
"""
st_pv = api("api/settings")
set_setting("language", "de")
for k, v in (("pageLayouts", {}), ("pageVariants", {}), ("customTabs", []), ("tabOrder", []), ("userTabs", {"kid_pv": {"hide": ["family"]}})):
    set_setting(k, v)
own_pv = []
def watch_pv(pg_):
    pg_.on("console", lambda m: own_pv.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_pv.append("PAGEERROR " + str(e)))
    return pg_
keys_pv = lambda: pgV.evaluate("[...document.querySelectorAll('[data-page=climate] .bdItem')].map((x) => x.dataset.key)")
off_pv = lambda: pgV.evaluate("[...document.querySelectorAll('[data-page=climate] .bdItem.bdOff')].map((x) => x.dataset.key)")
def until_pv(fn, n=20, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgV.wait_for_timeout(ms)
    return fn()

pgV = watch_pv(b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgV.on("dialog", lambda d: d.accept())                              # "Fassung löschen?": yes
pgV.goto(BASE + "?debug=1"); pgV.wait_for_timeout(1500)
if pgV.is_visible("#modeSwitch [data-mode=live]"): pgV.click("#modeSwitch [data-mode=live]"); pgV.wait_for_timeout(1000)
pgV.click("#tabBar [data-tab=climate]"); pgV.wait_for_timeout(1200)
pgV.click("#tabBar .tbEdit"); pgV.wait_for_timeout(800)
all_keys = keys_pv()
check("versions (#507): in ✎ the purple strip 'Fassung' under the edit strip, 'Für alle' chosen, '＋ Neue Fassung', 'Ansehen als', 'Wer sieht was'",
      pgV.is_visible("[data-page=climate] .pvBar") and pgV.locator("[data-page=climate] .pvChip.on[data-variant=all]").count() == 1
      and pgV.is_visible(".pvBar [data-act=newVariant]") and pgV.is_visible(".pvBar [data-act=viewAs]") and pgV.is_visible(".pvBar [data-act=whoSees]") and all_keys, all_keys)

pgV.click(".pvBar [data-act=newVariant]"); pgV.wait_for_timeout(500)
check("versions: the window 'Neue Fassung': name, symbols, 'Anfangen mit' (a copy of 'Für alle' or empty), the user known from the settings",
      pgV.is_visible(".pvDlg [data-role=name]") and pgV.locator(".pvDlg .teIcons button").count() >= 10
      and pgV.locator(".pvDlg [data-start=all].on").count() == 1 and pgV.locator(".pvDlg [data-start=empty]").count() == 1
      and pgV.locator(".pvDlg [data-user=kid_pv]").count() == 1)
pgV.fill(".pvDlg [data-role=name]", "Kinder"); pgV.check(".pvDlg [data-user=kid_pv]")
pgV.click(".pvDlg [data-act=variantCreate]"); pgV.wait_for_timeout(1000)
vs = lambda: api("api/settings").get("pageVariants", {}).get("climate", [])
vid = (until_pv(lambda: vs()) or [{}])[0].get("id", "")
check("versions: 'Anlegen und bearbeiten' stores 'Kinder' (a copy of 'Für alle'), gives it to kid_pv (his hidden tab stays hidden) and edits it now",
      vid and vs()[0]["name"] == "Kinder" and api("api/settings")["userTabs"].get("kid_pv") == {"hide": ["family"], "variants": {"climate": vid}}
      and pgV.locator(f"[data-page=climate] .pvChip.on[data-variant={vid}]").count() == 1 and keys_pv() == all_keys
      and "kid_pv" in pgV.inner_text("[data-page=climate] .pvWho"), (vs(), api("api/settings")["userTabs"]))
key = all_keys[0]
pgV.click(f"[data-page=climate] .bdItem[data-key='{key}'] .bdTools .bdTool:not([data-act=size])"); pgV.wait_for_timeout(800)
check("versions: 👁 in 'Kinder' hides a card only there; 'Für alle' keeps it",
      until_pv(lambda: (vs() or [{}])[0].get("layout", {}).get("hidden") == [key]) and not api("api/settings").get("pageLayouts", {}).get("climate")
      and off_pv() == [key], (vs(), off_pv()))
pgV.click("[data-page=climate] .pvChip[data-variant=all]"); pgV.wait_for_timeout(600)
check("versions: a tap on the chip 'Für alle' edits that one: the card is there", off_pv() == [] and key in keys_pv(), off_pv())

pgV.click(".pvBar [data-act=viewAs]"); pgV.wait_for_timeout(500)
pgV.click(".pvDlg [data-user=kid_pv]"); pgV.wait_for_timeout(1000)
tabs_pv = pgV.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((x) => x.dataset.tab)")
check("versions: 'Ansehen als kid_pv': a bar at the top, the edit mode ends, Klima in his version (without the card), his tabs (no Familie), no ✎",
      pgV.is_visible("#pvAsBar") and "kid_pv" in pgV.inner_text("#pvAsBar") and pgV.is_hidden("[data-page=climate] .pvBar")
      and key not in keys_pv() and "family" not in tabs_pv and "climate" in tabs_pv and pgV.locator("#tabBar .tbEdit").count() == 0, (keys_pv(), tabs_pv))
pgV.click("#pvAsBar [data-act=viewAsEnd]"); pgV.wait_for_timeout(800)
check("versions: 'Zurück': the bar goes, the page as before (the card there), ✎ back",
      pgV.locator("#pvAsBar").count() == 0 and key in keys_pv() and pgV.is_visible("#tabBar .tbEdit"), keys_pv())
me_pv = json.load(urllib.request.urlopen(urllib.request.Request(BASE + "api/me", headers={"X-Remote-User-Name": "kid_pv"})))
check("versions: api/me hands kid_pv his version", me_pv.get("tabs", {}).get("variants") == {"climate": vid}, me_pv.get("tabs"))

pgV.click("#tabBar .tbEdit"); pgV.wait_for_timeout(600)
pgV.click(".pvBar [data-act=whoSees]"); pgV.wait_for_timeout(500)
check("versions: 'Wer sieht was': a row per user, a choice per page; kid_pv has 'Kinder' on Klima",
      pgV.locator(".pvDlg select[data-user=kid_pv][data-page=climate]").count() == 1
      and pgV.eval_on_selector(".pvDlg select[data-user=kid_pv][data-page=climate]", "(s) => s.value") == vid)
pgV.select_option(".pvDlg select[data-user=kid_pv][data-page=climate]", "off")
pgV.click(".pvDlg [data-act=whoSave]"); pgV.wait_for_timeout(1000)
check("versions: 'aus' and 'Speichern': kid_pv does not see Klima any more",
      until_pv(lambda: api("api/settings")["userTabs"].get("kid_pv") == {"hide": ["climate", "family"]}), api("api/settings")["userTabs"])

pgV.click(f"[data-page=climate] .pvChip[data-variant={vid}]"); pgV.wait_for_timeout(500)
pgV.click(".pvBar [data-act=variantSet]"); pgV.wait_for_timeout(500)
check("versions: '⚙ Einstellen' opens the window of 'Kinder' with its name and '🗑 Fassung löschen'",
      pgV.input_value(".pvDlg [data-role=name]") == "Kinder" and pgV.is_visible(".pvDlg [data-act=variantDelete]"))
pgV.click(".pvDlg [data-act=variantDelete]"); pgV.wait_for_timeout(1000)
check("versions: deleted: no version left, the strip has 'Für alle' again",
      until_pv(lambda: not api("api/settings").get("pageVariants")) and pgV.locator("[data-page=climate] .pvChip.on[data-variant=all]").count() == 1,
      api("api/settings").get("pageVariants"))
pgV.close()
check("versions: no errors on the page", not own_pv, own_pv[:3])

for k, v in (("pageLayouts", {}), ("pageVariants", {}), ("customTabs", []), ("tabOrder", []), ("userTabs", {}), ("language", st_pv.get("language", ""))):
    set_setting(k, v)
