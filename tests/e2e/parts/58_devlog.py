"""4.40.0: the tab 📜 Protokoll (devlog.py, pagelog.js). The recording (🛡 Sicherheit) writes who switched a device of the plan: a page's
command through the add-on (its user), then a change from outside (at the device); api/log has the command and both changes; the tab
lists them with who it was, the filter "Befehle", a tap shows the device's day on the side, "⬇ Exportieren" gives a .csv; a user who
may not edit has no such tab and api/log says no.
"""
st_lg = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric"); set_setting("timelineOn", True)
own_lg = []
def wait_lg(fn, n=60, ms=500):
    for _ in range(n):
        v = fn()
        if v: return v
        time.sleep(ms / 1000)
    return fn()
log_lg = lambda: api_admin("api/log")
rec_lg = wait_lg(lambda: log_lg()["recording"])
check("log: the recording runs (it keeps the log)", rec_lg, log_lg())
urllib.request.urlopen(HA + "/_set?e=light.wohnzimmer&s=off").read()
time.sleep(1)
pgL = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}, accept_downloads=True)
pgL.on("console", lambda m: own_lg.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgL.on("pageerror", lambda e: own_lg.append("PAGEERROR " + str(e)))
pgL.goto(BASE + "?debug=1"); pgL.wait_for_timeout(1500)
if pgL.is_visible("#modeSwitch [data-mode=live]"): pgL.click("#modeSwitch [data-mode=live]"); pgL.wait_for_timeout(800)
ok_lg = pgL.evaluate("() => fetch('api/service', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({domain: 'light', service: 'turn_on', entity_id: 'light.wohnzimmer'})}).then((r) => r.status)")
cmd_lg = wait_lg(lambda: [x for x in log_lg()["events"] if x["k"] == "c" and "light.wohnzimmer" in x["e"] and x["sv"] == "light.turn_on"])
check("log: a page's command is there, taken, with who tapped", ok_lg == 200 and cmd_lg and cmd_lg[-1]["ok"] and cmd_lg[-1]["src"] == "page" and cmd_lg[-1]["u"], cmd_lg)
mine_lg = wait_lg(lambda: [x for x in log_lg()["events"] if x["k"] == "s" and x["e"] == "light.wohnzimmer" and x["b"].get("state") == "on"])
check("log: the light going on is the add-on's (the page's command)", mine_lg and mine_lg[-1]["w"]["k"] == "addon" and mine_lg[-1]["w"]["src"] == "page", mine_lg)
time.sleep(1)
urllib.request.urlopen(HA + "/_set?e=light.wohnzimmer&s=off").read()        # at the wall switch
other_lg = wait_lg(lambda: [x for x in log_lg()["events"] if x["k"] == "s" and x["e"] == "light.wohnzimmer" and x["b"].get("state") == "off" and x["t"] > mine_lg[-1]["t"]])
check("log: switched off at the wall right after is not the add-on's", other_lg and other_lg[-1]["w"]["k"] == "dev", other_lg)

tabs_lg = pgL.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")
check("log: an admin has the tab 📜 Protokoll", "log" in tabs_lg, tabs_lg)
pgL.click("#tabBar [data-tab=log]"); pgL.wait_for_timeout(1500)
rows_lg = wait_lg(lambda: pgL.locator("[data-page=log] .lgRow[data-entity='light.wohnzimmer']").count() >= 3, n=20)
txt_lg = pgL.inner_text("[data-page=log] .lgTable") if pgL.locator("[data-page=log] .lgTable").count() else ""
check("log: the tab lists the command and the changes with who it was", rows_lg and "Befehl an" in txt_lg and "angenommen" in txt_lg and "Add-on" in txt_lg, txt_lg[:600])
pgL.click("[data-page=log] [data-kind=commands]"); pgL.wait_for_timeout(400)
kinds_lg = pgL.evaluate("[...document.querySelectorAll('[data-page=log] .lgRow[data-kind]')].map((r) => r.dataset.kind)")
check("log: the filter 'Befehle' shows only commands", kinds_lg and set(kinds_lg) == {"c"}, kinds_lg)
pgL.click("[data-page=log] [data-kind=all]"); pgL.wait_for_timeout(400)
pgL.locator("[data-page=log] .lgRow[data-entity='light.wohnzimmer']").first.click(); pgL.wait_for_timeout(500)
side_lg = pgL.locator("[data-page=log] .lgSide[data-device='light.wohnzimmer']")
check("log: a tap on a row shows the device's day on the side, the table stays whole",
      side_lg.count() == 1 and "light.wohnzimmer" in side_lg.inner_text() and pgL.locator("[data-page=log] .lgRow[data-entity]").count() >= 3)
pgL.click("[data-page=log] [data-act=export]"); pgL.wait_for_timeout(300)
pgL.click(".lgDlg [data-group=what] [data-opt=all]"); pgL.click(".lgDlg [data-group=as] [data-opt=csv]"); pgL.wait_for_timeout(200)
with pgL.expect_download() as dl_lg:
    pgL.click(".lgDlg [data-act=exportGo]")
csv_lg = open(dl_lg.value.path(), encoding="utf-8-sig").read()
check("log: '⬇ Exportieren' as a table (.csv) with the entity ids", csv_lg.startswith("Datum;Zeit;Gerät;Entität") and "light.wohnzimmer" in csv_lg, csv_lg[:300])
check("log: no errors on the page", not own_lg, own_lg[:3])
pgL.close()

pgT = b.new_page(viewport={"width": 1280, "height": 850}, extra_http_headers={"X-Remote-User-Name": "tablet_lg"})
pgT.goto(BASE + "?debug=1"); pgT.wait_for_timeout(1800)
if pgT.is_visible("#modeSwitch [data-mode=live]"): pgT.click("#modeSwitch [data-mode=live]"); pgT.wait_for_timeout(800)
tabs_t = pgT.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")
st_t = pgT.evaluate("() => fetch('api/log').then((r) => r.status)")
check("log: a user who may not edit has no tab 📜 Protokoll, api/log says no", "log" not in tabs_t and st_t == 403, (tabs_t, st_t))
pgT.close()
for k, d in (("language", ""), ("units", "metric"), ("timelineOn", True)):
    set_setting(k, st_lg.get(k, d))
