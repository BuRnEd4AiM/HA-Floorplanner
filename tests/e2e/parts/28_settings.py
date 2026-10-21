"""4.0.1 (#450): the settings dialog in groups that fold open and shut, with a search at the top; the group "Warnings & alarm" says what the
alarm panel is and which one Home Assistant has.
"""
lang_st, dim_st = api("api/settings")["language"], api("api/settings").get("nightDim", "off")
set_setting("language", "de")                   # the texts below are the German ones
def extra(d):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(d).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
extra({"alarm_control_panel.e2e": {"state": "armed_away", "attributes": {"friendly_name": "Alarmo Haus"}}})

pgG = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgG.goto(BASE + "?debug=1&mode=edit"); pgG.wait_for_timeout(1500)
pgG.click("#settingsBtn"); pgG.wait_for_timeout(600)
GROUPS = "() => [...document.querySelectorAll('#settingsDialog details.setGroup')].map((d) => [d.dataset.group, d.open, !d.hidden])"
g0 = pgG.evaluate(GROUPS)
check("settings in groups: thirteen groups (with users & tablets, #454, quick access, #471, and the tabs, #481), all shut at first, the fields out of sight",
      len(g0) == 13 and not any(o for _, o, _ in g0) and all(v for _, _, v in g0) and not pgG.is_visible("#setLanguage") and pgG.is_visible("#setSearch"), g0)
check("settings in groups: each group says what is in it", "Fassade" in pgG.inner_text("details[data-group=outside] > summary")
      and "Alarmanlage" in pgG.inner_text("details[data-group=alarm] > summary"), pgG.inner_text("details[data-group=outside] > summary"))
pgG.click("details[data-group=outside] > summary"); pgG.wait_for_timeout(300)
check("settings in groups: a tap on a group opens it", pgG.is_visible("#setFacade") and not pgG.is_visible("#setLanguage"))
pgG.keyboard.press("Escape"); pgG.wait_for_timeout(300)
pgG.click("#settingsBtn"); pgG.wait_for_timeout(400)
check("settings in groups: the group stays open the next time", dict((g, o) for g, o, _ in pgG.evaluate(GROUPS)).get("outside") is True, pgG.evaluate(GROUPS))

pgG.fill("#setSearch", "alarm"); pgG.wait_for_timeout(300)
g1 = dict((g, (o, v)) for g, o, v in pgG.evaluate(GROUPS))
HITS = "() => [...document.querySelectorAll('#settingsDialog .sgHit')].map((e) => e.textContent.trim().slice(0, 40))"
check("search: 'alarm' leaves the group 'Warnungen & Alarm' open, the others away (its name fits: no marks all over it)",
      g1["alarm"] == (True, True) and not g1["general"][1] and not g1["outside"][1]
      and pgG.evaluate("() => document.querySelectorAll('details[data-group=alarm] .sgHit').length") == 0, (g1, pgG.evaluate(HITS)))
check("alarm (#owner question): the group explains the alarm panel and names the one Home Assistant has",
      "Alarmo" in pgG.inner_text("details[data-group=alarm] .sgInfo") and "Alarmo Haus" in pgG.inner_text("#alarmPanels")
      and "Scharf (abwesend)" in pgG.inner_text("#alarmPanels") and pgG.is_visible("#alarmNotify"), pgG.inner_text("#alarmPanels"))
pgG.press("#setSearch", "Enter"); pgG.wait_for_timeout(300)
check("search: Enter does not close the settings", pgG.evaluate("document.querySelector('#settingsDialog').open"))
pgG.fill("#setSearch", "sonne"); pgG.wait_for_timeout(300)
check("search: the tooltip counts too ('Sonne' finds the sky), the row is marked", pgG.is_visible("#setSky") and not pgG.is_visible("#setLanguage")
      and any(h.startswith("Himmel") for h in pgG.evaluate(HITS)), pgG.evaluate(HITS))
pgG.fill("#setSearch", "qqqxxy"); pgG.wait_for_timeout(300)
check("search: nothing found says so", pgG.is_visible("#sgNone") and not any(v for _, _, v in pgG.evaluate(GROUPS)))
pgG.press("#setSearch", "Escape"); pgG.wait_for_timeout(300)
g2 = dict((g, (o, v)) for g, o, v in pgG.evaluate(GROUPS))
check("search: Escape empties it, the groups are back as they were, the settings stay open",
      pgG.input_value("#setSearch") == "" and g2["outside"] == (True, True) and g2["alarm"] == (False, True) and not pgG.is_visible("#sgNone")
      and pgG.evaluate("document.querySelector('#settingsDialog').open"), g2)

pgG.click("#sgAll"); pgG.wait_for_timeout(300)
check("'Alle aufklappen' opens every group", all(o for _, o, _ in pgG.evaluate(GROUPS)) and pgG.inner_text("#sgAll") == "Alle zuklappen", pgG.inner_text("#sgAll"))
pgG.select_option("#setNightDim", "time"); pgG.wait_for_timeout(500)
shown = pgG.is_visible("#setNightFrom")
pgG.select_option("#setNightDim", "off"); pgG.wait_for_timeout(500)
check("tablet: the night times only show when dimming goes by the clock", shown and not pgG.is_visible("#setNightFrom"))
pgG.click("#sgAll"); pgG.wait_for_timeout(300)
check("'Alle zuklappen' shuts them again", not any(o for _, o, _ in pgG.evaluate(GROUPS)) and pgG.inner_text("#sgAll") == "Alle aufklappen")
pgG.close()

pgT = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "tablet_e2e"})
pgT.goto(BASE + "?debug=1"); pgT.wait_for_timeout(1200)
pgT.evaluate("document.querySelector('#settingsBtn').click()"); pgT.wait_for_timeout(800)
open_setting(pgT, "#alarmNotifyOff")
check("alarm: who may not edit sees why the message part is missing", pgT.is_visible("#alarmNotifyOff") and not pgT.is_visible("#alarmNotify"))
pgT.close()

extra({})
set_setting("nightDim", dim_st)
set_setting("language", lang_st)
