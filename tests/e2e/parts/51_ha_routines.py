"""4.29.0 (#548): an own routine "Wenn … dann …" saved as a real automation of Home Assistant. The editor's "🏠 Home Assistant" (the
default): saving writes fp3d_<routine>_<lane> through Home Assistant's editor API (the stand-in keeps it in /_autos); ▶ Abläufe shows it
with "🏠 Home Assistant" and ↗, not a second time among Home Assistant's automations; its ▶ starts the automation; changed in Home
Assistant, saving asks "Überschreiben?" first; switched off with the routine; deleted with it. Automations of others are never written.
"""
st_ha = api("api/settings")
set_setting("language", "de")
def post_ha(path, body):
    return json.load(urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})))
def rules_ha(body):
    r = urllib.request.urlopen(urllib.request.Request(BASE + "api/rules", data=json.dumps(body).encode(), method="PUT",
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
    return json.load(r)
autos_ha = lambda: json.load(urllib.request.urlopen(HA + "/_autos"))
calldata_ha = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
rules_ha({"heat": {}, "flows": []})
post_ha("/_extra", {"automation.fremd": {"state": "on", "attributes": {"friendly_name": "Fremde Automation", "id": "fremd_1", "current": 0}}})
errs_ha = []
pgH = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgH.on("console", lambda m: errs_ha.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgH.on("pageerror", lambda e: errs_ha.append("PAGEERROR " + str(e)))
def wait_ha(fn, n=30, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgH.wait_for_timeout(ms)
    return fn()
pgH.goto(BASE + "?debug=1"); pgH.wait_for_timeout(1500)
if pgH.is_visible("#modeSwitch [data-mode=live]"): pgH.click("#modeSwitch [data-mode=live]"); pgH.wait_for_timeout(800)
pgH.click("#tabBar [data-tab=routines]"); pgH.wait_for_timeout(800)
pgH.click("[data-page=routines] [data-act=newFlow]"); pgH.wait_for_timeout(500)
pgH.fill(".feDlg .feName", "Flur HA"); pgH.press(".feDlg .feName", "Tab")
pgH.click(".feDlg [data-add=button]"); pgH.wait_for_timeout(200)
pgH.click(".feDlg [data-add=switch]"); pgH.wait_for_timeout(200)
pgH.click(".feDlg .fePickRow[data-entity='light.wohnzimmer'] input"); pgH.wait_for_timeout(200)
pgH.click(".feDlg [data-act=feSave]")
sync_ha = wait_ha(lambda: pgH.locator(".feDlg .feSync[data-sync=ok]").count() == 1)
flow_ha = (api("api/rules")["flows"] or [{}])[0]
cid_ha = "fp3d_" + flow_ha.get("id", "f_")[2:] + "_l1"
written = autos_ha().get(cid_ha) or {}
check("ha routine: '✓ Speichern' writes it as an automation of Home Assistant (fp3d_…, mode restart, the light switched on)",
      sync_ha and flow_ha.get("ha") is True and written.get("alias") == "Flur HA" and written.get("mode") == "restart" and written.get("triggers") == []
      and written.get("actions", [{}])[0].get("action") == "light.turn_on", (flow_ha, written))
check("ha routine: the editor says '🏠 In Home Assistant gespeichert' with 'In Home Assistant öffnen'",
      "In Home Assistant gespeichert" in pgH.inner_text(".feDlg .feSync") and pgH.get_attribute(".feDlg .feHaLink", "href") == f"/config/automation/edit/{cid_ha}")
pgH.click(".feDlg [data-act=feBack]"); pgH.wait_for_timeout(500)
row_ha = f"[data-page=routines] [data-flow={flow_ha.get('id')}]"
check("ha routine: ▶ Abläufe shows it with '🏠 Home Assistant' and ↗ to open it there", wait_ha(lambda: pgH.locator(f"{row_ha} [data-where=ha]:not(.bad)").count() == 1)
      and pgH.locator(f"{row_ha} [data-ha-open]").count() == 1)
autos_listed = pgH.evaluate("() => [...document.querySelectorAll('[data-page=routines] .roAutos [data-auto]')].map((x) => x.dataset.auto)")
check("ha routine: not a second time among Home Assistant's automations (another one still there)",
      "automation.fremd" in autos_listed and not any(a.startswith("automation.flur_ha") for a in autos_listed), autos_listed)
n_ha = len(calldata_ha())
pgH.click(f"{row_ha} [data-run-flow]")
check("ha routine: its ▶ starts the automation in Home Assistant (automation.trigger)",
      wait_ha(lambda: any(c[0] == "trigger" and c[1].startswith("automation.flur_ha") for c in calldata_ha()[n_ha:])), calldata_ha()[n_ha:])
post_ha("/_autos", {cid_ha: {**written, "alias": "In HA geändert"}})        # somebody changes it in Home Assistant
pgH.click(f"{row_ha} [data-edit-flow]"); pgH.wait_for_timeout(500)
pgH.fill(".feDlg .feName", "Flur HA 2"); pgH.press(".feDlg .feName", "Tab")
pgH.click(".feDlg [data-act=feSave]")
ask_ha = wait_ha(lambda: pgH.locator(".feDlg .feSync[data-sync=ask]").count() == 1)
check("ha routine: changed in Home Assistant, saving asks 'Überschreiben?' and leaves it as it is", ask_ha and autos_ha()[cid_ha]["alias"] == "In HA geändert",
      pgH.inner_text(".feDlg .feSync") if ask_ha else autos_ha().get(cid_ha))
pgH.click(".feDlg [data-act=feOverwrite]")
check("ha routine: 'Überschreiben' writes it", wait_ha(lambda: autos_ha()[cid_ha]["alias"] == "Flur HA 2"))
pgH.locator(".feDlg input[data-field=on]").uncheck(force=True); pgH.wait_for_timeout(200)
pgH.click(".feDlg [data-act=feSave]")
check("ha routine: switched off in the editor, the automation is switched off", wait_ha(lambda: any(c[0] == "turn_off" and c[1].startswith("automation.flur_ha") for c in calldata_ha())))
pgH.once("dialog", lambda d: d.accept())
pgH.click(".feDlg [data-act=feDelete]")
check("ha routine: '🗑 Löschen' deletes the automation, the other one stays", wait_ha(lambda: cid_ha not in autos_ha()) and "fremd_1" not in autos_ha())
check("ha routine: no errors on the page", not errs_ha, errs_ha[:3])
pgH.close()
rules_ha({"heat": {}, "flows": []})
post_ha("/_extra", {})
set_setting("language", st_ha.get("language", ""))
