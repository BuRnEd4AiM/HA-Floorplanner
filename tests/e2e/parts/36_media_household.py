"""4.8.0 (#490): the pages 🎵 Musik & TV and 🧺 Haushalt of the tab bar. Musik: a card per player (playing first, its picture through the
add-on, ⏯, the volume), a radio station of ⚙ played on the player picked, "Räume zusammen" (media_player.join), "Alles stopp". Haushalt:
the washing machine by its own state (program, minutes left), the dishwasher by its power history (done, the number on the tab, "✓
Ausgeräumt" for every screen), the robot vacuum, the shopping list (tick off, add, clear the ticked ones); a user who may not switch has no
music page and no vacuum buttons; the stations in ⚙.
"""
import datetime as _dt
st_mh = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
set_setting("radioStations", [{"name": "SWR3", "url": "https://radio.example/swr3.mp3"}, {"name": "Klassik", "url": "https://radio.example/klassik.mp3"}])
def post_mh(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
iso_mh = lambda minutes: (_dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(minutes=minutes)).isoformat()
SPK = 1 | 4 | 8 | 16 | 32 | 128 | 256 | 512 | 2048 | 16384 | 524288
post_mh("/_extra", {
    "media_player.hh_sonos": {"state": "playing", "attributes": {"friendly_name": "Sonos Küche", "media_title": "Feel It Still", "media_artist": "Portugal. The Man",
                              "volume_level": 0.35, "supported_features": SPK, "group_members": ["media_player.hh_sonos"],
                              "entity_picture": "/api/media_player_proxy/media_player.hh_sonos?token=abc&cache=1"}},
    "media_player.hh_bad": {"state": "idle", "attributes": {"friendly_name": "Lautsprecher Bad", "volume_level": 0.2, "supported_features": SPK, "group_members": ["media_player.hh_bad"]}},
    "media_player.hh_tv": {"state": "on", "attributes": {"friendly_name": "Fernseher", "app_name": "Netflix", "supported_features": 128 | 256 | 4 | 2048,
                           "source_list": ["HDMI 1", "Netflix"], "source": "Netflix", "volume_level": 0.22}},
    "sensor.waschmaschine_operation_state": {"state": "run", "last_changed": iso_mh(-50), "attributes": {"friendly_name": "Waschmaschine Operation state"}},
    "sensor.waschmaschine_finish_time": {"state": iso_mh(40), "attributes": {"friendly_name": "Waschmaschine Finish time", "device_class": "timestamp"}},
    "sensor.waschmaschine_selected_program": {"state": "Baumwolle 40°", "attributes": {"friendly_name": "Waschmaschine Programm"}},
    "sensor.spuelmaschine_leistung": {"state": "1", "attributes": {"friendly_name": "Spülmaschine Leistung", "unit_of_measurement": "W", "device_class": "power"}},
    "vacuum.hh_robo": {"state": "docked", "attributes": {"friendly_name": "Robbi", "battery_level": 88, "supported_features": 8192 | 4 | 16}},
    "todo.einkauf": {"state": "2", "attributes": {"friendly_name": "Einkaufsliste"}},
})
post_mh("/_hist", {"sensor.spuelmaschine_leistung": [[iso_mh(-240), "1"], [iso_mh(-150), "1900"], [iso_mh(-30), "1.2"]]})
post_mh("/_todo", {"todo.einkauf": [{"uid": "m1", "summary": "Milch", "status": "needs_action"}, {"uid": "m2", "summary": "Brot", "status": "needs_action"}]})
call_data = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
own_mh = []
def watch_mh(pg_):
    pg_.on("console", lambda m: own_mh.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_mh.append("PAGEERROR " + str(e)))
    return pg_
tabs_mh = lambda pg_: pg_.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")
def until_mh(pg_, fn, n=20, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pg_.wait_for_timeout(ms)
    return fn()

pgM = watch_mh(b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgM.on("dialog", lambda d: d.accept())
pgM.goto(BASE + "?debug=1"); pgM.wait_for_timeout(1500)
if pgM.is_visible("#modeSwitch [data-mode=live]"): pgM.click("#modeSwitch [data-mode=live]"); pgM.wait_for_timeout(1000)
tb = until_mh(pgM, lambda: "household" in tabs_mh(pgM) and tabs_mh(pgM))
check("4.8 (#490): 🎵 Musik & TV and 🧺 Haushalt are in the bar side by side, after ☀ Heute, before ▶ Abläufe",
      tb and tb.index("media") == tb.index("household") - 1 and tb.index("media") > tb.index("today") and tb.index("household") < tb.index("routines"), tb)
badge = until_mh(pgM, lambda: pgM.evaluate("document.querySelector('#tabBar [data-tab=household] .tbBadge')?.textContent || ''"))
check("household: the dishwasher is done (by its power history): the tab carries a 1", badge == "1", badge)

# --- 🎵 Musik & TV
pgM.click("#tabBar [data-tab=media]"); pgM.wait_for_timeout(1200)
cards = pgM.evaluate("[...document.querySelectorAll('[data-page=media] .mpCard')].map((c) => c.dataset.player)")
check("media: a card per player, the one playing first", cards[:1] == ["media_player.hh_sonos"] and {"media_player.hh_bad", "media_player.hh_tv"} <= set(cards), cards)
son = "[data-page=media] [data-player='media_player.hh_sonos']"
check("media: what plays, by whom, the buttons the player can do", "Feel It Still" in pgM.inner_text(son) and "Portugal. The Man" in pgM.inner_text(son)
      and pgM.locator(f"{son} [data-svc=media_play_pause]").count() == 1 and pgM.locator(f"{son} [data-svc=media_next_track]").count() == 1)
check("media: the picture comes through the add-on", until_mh(pgM, lambda: pgM.evaluate(f"(() => {{ const i = document.querySelector(\"{son} .mpArt img\"); return !!i && i.complete && i.naturalWidth > 0 && i.src.includes('api/media/'); }})()")))
check("media: the TV shows its app and its source", "Netflix" in pgM.inner_text("[data-player='media_player.hh_tv']") and pgM.locator("[data-player='media_player.hh_tv'] .mpSource").count() == 1)
pgM.evaluate(f"(() => {{ const s = document.querySelector(\"{son} .mpRange\"); s.value = 60; s.dispatchEvent(new Event('change')); }})()"); pgM.wait_for_timeout(800)
check("media: the volume slider sets the volume", until_mh(pgM, lambda: any(c[0] == "volume_set" and c[1] == "media_player.hh_sonos" and c[2].get("volume_level") == 0.6 for c in call_data())))
pgM.click("[data-page=media] .mpStation[data-station='https://radio.example/swr3.mp3']"); pgM.wait_for_timeout(500)
picks = pgM.evaluate("[...document.querySelectorAll('.mpDlg .mpPick')].map((x) => x.dataset.entity)")
check("media: a station asks on which player (only those that can play one)", set(picks) == {"media_player.hh_sonos", "media_player.hh_bad"}, picks)
pgM.click(".mpDlg .mpPick[data-entity='media_player.hh_bad']"); pgM.wait_for_timeout(800)
check("media: ... and plays it there", until_mh(pgM, lambda: any(c[0] == "play_media" and c[1] == "media_player.hh_bad" and c[2] == {"media_content_id": "https://radio.example/swr3.mp3", "media_content_type": "music"} for c in call_data())))
pgM.click("[data-page=media] [data-act=together]"); pgM.wait_for_timeout(500)
ticks = pgM.evaluate("[...document.querySelectorAll('.mpDlg .mpTick input')].map((x) => x.dataset.entity)")
check("media: 'Räume zusammen' lists the players that can play together", set(ticks) == {"media_player.hh_sonos", "media_player.hh_bad"}, ticks)
pgM.evaluate("document.querySelectorAll('.mpDlg .mpTick input').forEach((x) => { x.checked = true; })")
pgM.click(".mpDlg [data-act=join]"); pgM.wait_for_timeout(800)
check("media: ... one that plays leads, the other joins it", until_mh(pgM, lambda: any(c[0] == "join" and {c[1], *c[2].get("group_members", [])} == {"media_player.hh_sonos", "media_player.hh_bad"}
                                                                    and len(c[2]["group_members"]) == 1 for c in call_data())))
pgM.click(f"{son} [data-svc=media_play_pause]"); pgM.wait_for_timeout(800)
check("media: ⏯ pauses", until_mh(pgM, lambda: ["media_player", "media_play_pause", "media_player.hh_sonos"] in ha_calls()))
pgM.click(f"{son} [data-svc=media_play_pause]"); pgM.wait_for_timeout(1200)
until_mh(pgM, lambda: pgM.locator("[data-page=media] [data-act=stopAll]").count() == 1)
pgM.click("[data-page=media] [data-act=stopAll]"); pgM.wait_for_timeout(1000)
check("media: 'Alles stopp' pauses what plays", until_mh(pgM, lambda: ["media_player", "media_pause", "media_player.hh_sonos"] in ha_calls()))

# --- 🧺 Haushalt
pgM.click("#tabBar [data-tab=household]"); pgM.wait_for_timeout(1500)
wm = until_mh(pgM, lambda: pgM.locator("[data-page=household] [data-kind=washer]").count() and pgM.inner_text("[data-page=household] [data-kind=washer]"))
check("household: the washing machine by its own state: program, when it ends, the minutes left, a bar",
      wm and "Baumwolle 40°" in wm and "fertig um" in wm and ("noch 40 min" in wm or "noch 39 min" in wm) and pgM.locator("[data-kind=washer] .hhBar").count() == 1, wm)
dw = pgM.inner_text("[data-page=household] [data-kind=dishwasher]")
check("household: the dishwasher by its power alone: done since, please empty it, 'Ausgeräumt'", "fertig" in dw and "bitte ausräumen" in dw
      and pgM.locator("[data-kind=dishwasher] [data-act=ack]").count() == 1, dw)
pgM.click("[data-kind=dishwasher] [data-act=ack]"); pgM.wait_for_timeout(1200)
check("household: 'Ausgeräumt' for everybody: the card says when it last ran, the tab has no number any more",
      until_mh(pgM, lambda: "zuletzt" in pgM.inner_text("[data-kind=dishwasher]") and pgM.locator("#tabBar [data-tab=household] .tbBadge").count() == 0)
      and api("api/household")["appliances"][-1]["phase"] == "off", pgM.inner_text("[data-kind=dishwasher]"))
vac = "[data-page=household] [data-vacuum='vacuum.hh_robo']"
check("household: the robot vacuum with its battery and its buttons", "Akku 88 %" in pgM.inner_text(vac) and pgM.locator(f"{vac} [data-svc=start]").count() == 1)
pgM.click(f"{vac} [data-svc=start]")
check("household: ... start", until_mh(pgM, lambda: ["vacuum", "start", "vacuum.hh_robo"] in ha_calls()))
items = lambda: pgM.evaluate("[...document.querySelectorAll('[data-page=household] .hhItem')].map((x) => (x.classList.contains('done') ? '✓' : '') + x.innerText.trim())")
check("household: the shopping list of Home Assistant", until_mh(pgM, lambda: items() == ["Milch", "Brot"]), items())
pgM.click("[data-page=household] .hhItem:has-text('Milch') input"); pgM.wait_for_timeout(1000)
check("household: ticking off an item", until_mh(pgM, lambda: items() == ["Brot", "✓Milch"]) and any(c[0] == "update_item" and c[2] == {"item": "m1", "status": "completed"} for c in call_data()), items())
pgM.fill("[data-page=household] .hhAdd input", "Butter"); pgM.keyboard.press("Enter"); pgM.wait_for_timeout(1000)
check("household: a new item (Enter), the field is empty again and keeps the cursor", until_mh(pgM, lambda: "Butter" in items())
      and pgM.input_value("[data-page=household] .hhAdd input") == "" and pgM.evaluate("document.activeElement?.closest('.hhAdd') != null"), items())
pgM.click("[data-page=household] [data-act=clear]"); pgM.wait_for_timeout(1000)
check("household: 'Erledigte löschen'", until_mh(pgM, lambda: items() == ["Brot", "Butter"]), items())

# --- ⚙: the stations
pgM.click("#settingsBtn"); pgM.wait_for_timeout(400)
open_setting(pgM, "#setStations"); pgM.wait_for_timeout(300)
rows = pgM.locator("#setStations .mpStationEdit").count()
pgM.click("#addStation")
pgM.fill("#setStations .mpStationEdit >> nth=2 >> [data-role=name]", "1LIVE")
pgM.fill("#setStations .mpStationEdit >> nth=2 >> [data-role=url]", "https://radio.example/1live.mp3"); pgM.keyboard.press("Tab")   # the dialog saves on a change
pgM.wait_for_timeout(1500)
check("settings: the stations in ⚙ → Reiter unten, a new one is saved", rows == 2 and until_mh(pgM, lambda: [s_["name"] for s_ in api("api/settings").get("radioStations", [])] == ["SWR3", "Klassik", "1LIVE"]),
      api("api/settings").get("radioStations"))
pgM.click("#setStations .mpStationEdit >> nth=2 >> button"); pgM.wait_for_timeout(1500)
check("settings: × takes a station away again", until_mh(pgM, lambda: [s_["name"] for s_ in api("api/settings").get("radioStations", [])] == ["SWR3", "Klassik"]))
pgM.keyboard.press("Escape")
pgM.close()

# --- a user who may not switch
set_setting("userLocks", {**(st_mh.get("userLocks") or {}), "hh_kid": ["control"]})
pgK = watch_mh(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "hh_kid"}))
pgK.goto(BASE + "?debug=1"); pgK.wait_for_timeout(2000)
tk = until_mh(pgK, lambda: "household" in tabs_mh(pgK) and tabs_mh(pgK))
pgK.click("#tabBar [data-tab=household]"); pgK.wait_for_timeout(1200)
check("household: who may not switch has no music page; the household stays, the vacuum without buttons, the list can be used",
      tk and "media" not in tk and pgK.locator(f"{vac} [data-svc]").count() == 0 and until_mh(pgK, lambda: pgK.locator("[data-page=household] .hhItem").count() == 2), tk)
pgK.close()
check("media/household: no errors on the page", not own_mh, own_mh[:3])

post_mh("/_extra", {}); post_mh("/_hist", {}); post_mh("/_todo", {})
for k in ("radioStations", "userLocks", "language", "units"):
    set_setting(k, st_mh.get(k, [] if k == "radioStations" else {} if k == "userLocks" else "metric" if k == "units" else ""))
