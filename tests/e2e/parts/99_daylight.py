"""5.20.0 🌗 Abläufe nach der Helligkeit (the owner, 2026-11-19: "dass sich das addon an der helligkeit orientiert", without changing the
time in winter; his choices: by the sun, as "Wenn", as "Nur wenn" and a tick at the time): the editor's new block "Es wird dunkel / hell"
with its levels, "Nur wenn → Dunkel / hell" with a level, the time's tick "An der Helligkeit orientieren" (its distance to today's sunset
from Home Assistant's sun.sun); saved as a Home Assistant automation they become numeric_state of the sun's elevation and a sun trigger
with an offset. When they go off is tested in tests/test_flows.py, the automation in tests/test_haflows.py.
"""
import datetime as _dt
st_dl = api("api/settings")
set_setting("language", "de")


def post_dl(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()


def rules_dl(body):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/rules", data=json.dumps(body).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()


sunset_dl = (_dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(hours=3)).replace(second=0, microsecond=0)
post_dl("/_extra", {"sun.sun": {"state": "above_horizon", "attributes": {"elevation": 12.5, "rising": False, "next_setting": sunset_dl.isoformat(),
                                                                         "next_rising": (sunset_dl + _dt.timedelta(hours=14)).isoformat()}}})
rules_dl({"heat": {}, "flows": []})
pgD = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_dl = []
pgD.on("pageerror", lambda e: own_dl.append("PAGEERROR " + str(e)))
pgD.on("dialog", lambda d: d.accept())
pgD.goto(BASE + "?debug=1"); pgD.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgD.wait_for_timeout(800)
if pgD.is_visible("#modeSwitch [data-mode=live]"):
    pgD.click("#modeSwitch [data-mode=live]"); pgD.wait_for_timeout(800)
pgD.click("#tabBar [data-tab=routines]"); pgD.wait_for_timeout(800)
pgD.click("[data-page=routines] [data-act=newFlow]"); pgD.wait_for_timeout(500)
pgD.fill(".feDlg .feName", "Dämmerung"); pgD.press(".feDlg .feName", "Tab")
check("🌗 the blocks on the left have „Es wird dunkel / hell“", pgD.locator(".feDlg [data-add=light]").count() == 1)
pgD.click(".feDlg [data-add=light]"); pgD.wait_for_timeout(300)
levels_dl = pgD.evaluate("[...document.querySelectorAll('.feDlg [data-field=e] [data-value]')].map((b) => b.dataset.value)")
check("🌗 „Es wird dunkel“ with the levels low sun, horizon, dusk, almost dark; dusk at first",
      levels_dl == ["6", "0", "-3", "-6"] and pgD.locator(".feDlg [data-field=e] [data-value='-3'].on").count() == 1
      and pgD.locator(".feDlg [data-field=to] [data-value=dark].on").count() == 1, levels_dl)
pgD.click(".feDlg [data-field=e] [data-value='-6']"); pgD.wait_for_timeout(200)
pgD.click(".feDlg [data-add=if_sun]"); pgD.wait_for_timeout(200)
pgD.click(".feDlg [data-field=e] [data-value='-3']"); pgD.wait_for_timeout(200)
pgD.click(".feDlg [data-add=cover]"); pgD.wait_for_timeout(200)
pgD.click(".feDlg .fePickRow[data-entity='cover.rollo'] input"); pgD.wait_for_timeout(200)
words_dl = pgD.inner_text(".feDlg .feWords")
check("🌗 in words: „Es wird dunkel: fast dunkel“, „dunkler als „Dämmerung““", "Es wird dunkel: fast dunkel" in words_dl and "dunkler als „Dämmerung“" in words_dl, words_dl)
pgD.click(".feDlg [data-act=newLane]") if pgD.locator(".feDlg [data-act=newLane]").count() else None
pgD.wait_for_timeout(300)
pgD.click(".feDlg [data-add=time]"); pgD.wait_for_timeout(300)
at_dl = (sunset_dl.astimezone() + _dt.timedelta(minutes=90)).strftime("%H:%M")       # the browser and the add-on share the clock here
pgD.fill(".feDlg input[data-field=at]", at_dl); pgD.dispatch_event(".feDlg input[data-field=at]", "change"); pgD.wait_for_timeout(200)
pgD.check(".feDlg [data-field=season]"); pgD.wait_for_timeout(300)
panel_dl = pgD.inner_text(".feDlg")
check("🌗 the time's tick „An der Helligkeit orientieren“: „dann immer 1 Std 30 Min nach Sonnenuntergang“ (or before sunrise in the morning)",
      "An der Helligkeit orientieren" in panel_dl and ("1 Std 30 Min nach Sonnenuntergang" in panel_dl or "vor Sonnenaufgang" in panel_dl
                                                       or "nach Sonnenaufgang" in panel_dl), panel_dl[-700:])
pgD.click(".feDlg [data-add=cover]"); pgD.wait_for_timeout(200)
pgD.click(".feDlg .fePickRow[data-entity='cover.rollo'] input"); pgD.wait_for_timeout(200)
pgD.click(".feDlg [data-act=feSave]")
flow_dl = {}
for _ in range(40):
    flow_dl = (api_admin("api/rules").get("flows") or [{}])[0]
    if flow_dl.get("name") == "Dämmerung":
        break
    pgD.wait_for_timeout(250)
blocks_dl = [lane["blocks"] for lane in flow_dl.get("lanes", [])]
check("🌗 saved: „Es wird dunkel“ at almost dark, „Nur wenn“ darker than dusk",
      blocks_dl and blocks_dl[0][0] == {"k": "light", "to": "dark", "e": -6} and blocks_dl[0][1] == {"k": "if_sun", "is": "dark", "e": -3}, blocks_dl)
t_dl = blocks_dl[1][0] if len(blocks_dl) > 1 else {}
ref_dl = sunset_dl.astimezone() if t_dl.get("anchor") == "set" else (sunset_dl + _dt.timedelta(hours=14)).astimezone()
check("🌗 saved: the time with season, anchored at today's sunset (sunrise before 12:00) as Home Assistant says it",
      t_dl.get("season") is True and t_dl.get("at") == at_dl and t_dl.get("ref") == ref_dl.hour * 60 + ref_dl.minute, t_dl)
mine_dl = {}
for _ in range(40):                                    # the add-on writes one automation per lane, one after the other
    autos_dl = json.load(urllib.request.urlopen(HA + "/_autos"))
    mine_dl = {k: v for k, v in autos_dl.items() if k.startswith("fp3d_" + flow_dl.get("id", "f_")[2:])}
    if len(mine_dl) >= 2:
        break
    pgD.wait_for_timeout(250)
trig_dl = [v.get("triggers") for _, v in sorted(mine_dl.items())]
check("🌗 in Home Assistant: the sun's elevation below −6 and a sun trigger with the offset",
      [{"trigger": "numeric_state", "entity_id": "sun.sun", "attribute": "elevation", "below": -6}] in trig_dl
      and any(t and t[0].get("trigger") == "sun" and "offset" in t[0] for t in trig_dl), trig_dl)
check("🌗 no errors on the page", not own_dl, own_dl)
pgD.close()
rules_dl({"heat": {}, "flows": []})
post_dl("/_extra", {})
set_setting("language", st_dl["language"])
