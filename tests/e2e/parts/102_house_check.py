"""5.24.0 🩺 Haus-Check with 🔧 Wartung (the owner's choice, docs/ideen-5.21 picture 1): a page of the tab bar with what needs a look
(urgent: empty batteries, devices offline, maintenance due; soon: weak radio, updates, maintenance in two weeks), suggestions from the
devices of the plan, "＋ Erinnerung", "✓ Erledigt" (saved in settings.maintenance, checked by maintenance.py). The rules: housecheck.test.mjs.
"""
st_hc = api("api/settings")
set_setting("language", "de")
set_setting("maintenance", [])
pgC = b.new_page(viewport={"width": 1280, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_hc = []
pgC.on("pageerror", lambda e: own_hc.append("PAGEERROR " + str(e)))
pgC.goto(BASE + "?debug=1"); pgC.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgC.wait_for_timeout(800)
if pgC.is_visible("#modeSwitch [data-mode=live]"):
    pgC.click("#modeSwitch [data-mode=live]"); pgC.wait_for_timeout(800)
check("🩺 the tab bar has „Haus-Check“", pgC.locator("#tabBar [data-tab=check]").count() == 1)
pgC.click("#tabBar [data-tab=check]"); pgC.wait_for_timeout(800)
txt_hc = pgC.inner_text("[data-page=check]")
check("🩺 the page: Dringend, Bald, Wartung, „＋ Erinnerung“", all(w in txt_hc for w in ("Haus-Check", "DRINGEND", "BALD", "WARTUNG", "Erinnerung")), txt_hc[:300])
pgC.click("[data-page=check] .hcAdd .bdBtn.primary"); pgC.wait_for_timeout(300)
pgC.fill("#hcName", "Dunstabzug Filter"); pgC.select_option("#hcEvery", "30")
pgC.click("[data-page=check] [data-act=hcSave]"); pgC.wait_for_timeout(800)
m_hc = []
for _ in range(20):
    m_hc = api_admin("api/settings").get("maintenance") or []
    if m_hc:
        break
    pgC.wait_for_timeout(250)
check("🩺 „＋ Erinnerung“ saves it (every 30 days, done today) and lists it under Wartung", len(m_hc) == 1 and m_hc[0]["name"] == "Dunstabzug Filter"
      and m_hc[0]["every"] == 30 and m_hc[0]["last"] and "Dunstabzug Filter" in pgC.inner_text("[data-page=check]"), m_hc)
set_setting("maintenance", [{**m_hc[0], "last": "2020-01-01"}] if m_hc else [])
pgC.reload(); pgC.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgC.wait_for_timeout(800)
if pgC.is_visible("#modeSwitch [data-mode=live]"):
    pgC.click("#modeSwitch [data-mode=live]"); pgC.wait_for_timeout(800)
pgC.click("#tabBar [data-tab=check]"); pgC.wait_for_timeout(800)
urgent_hc = pgC.inner_text("[data-page=check] .hcSec >> nth=0")
check("🩺 a reminder that is due is urgent („fällig“), with a number on the tab", "Dunstabzug Filter" in urgent_hc and "fällig" in urgent_hc
      and pgC.locator("#tabBar [data-tab=check] .tbBadge").count() == 1, urgent_hc)
pgC.click("[data-page=check] .hcRow.care [data-act=done]"); pgC.wait_for_timeout(800)
last_hc = ""
for _ in range(20):
    last_hc = ((api_admin("api/settings").get("maintenance") or [{}])[0]).get("last", "")
    if last_hc != "2020-01-01":
        break
    pgC.wait_for_timeout(250)
check("🩺 „✓ Erledigt“ starts it anew (done today, not urgent any more)", last_hc not in ("", "2020-01-01")
      and "Dunstabzug" not in pgC.inner_text("[data-page=check] .hcSec >> nth=0"), last_hc)
check("🩺 no errors on the page", not own_hc, own_hc)
pgC.close()
set_setting("maintenance", [])
set_setting("language", st_hc["language"])
