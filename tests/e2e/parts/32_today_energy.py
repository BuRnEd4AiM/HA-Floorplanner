"""4.4.0 (#481): the pages ☀ Heute and ⚡ Energie of the tab bar. Heute: the time, the weather with its forecast (weather.get_forecasts),
the events of today and tomorrow and the waste calendar (api/agenda), who is at home, "Im Haus" leading to the house. Energie: the
meters of the energy dashboard (api/energy/meters), their statistics per hour / day / month (api/energy/stats), the periods back and
forth, the house's own meters and prices in ⚡ Rechnung; the calendars in ⚙ → "Reiter unten"; a user locked out of the energy.
"""
saved_te = api_admin("api/layout")              # put back at the end
st_te = api("api/settings")
set_setting("language", "de")
set_setting("wasteCalendar", "calendar.muell")
def post_te(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
post_te("/_extra", {
    "weather.home": {"state": "rainy", "attributes": {"friendly_name": "Zuhause", "temperature": 11.5, "temperature_unit": "°C", "wind_speed": 20, "wind_speed_unit": "km/h"}},
    "person.anna": {"state": "home", "attributes": {"friendly_name": "Anna"}},
    "person.max": {"state": "Arbeit", "attributes": {"friendly_name": "Max"}},
})
post_te("/_energy", {"prefs": {"energy_sources": [
    {"type": "grid", "stat_energy_from": "sensor.netz_bezug", "stat_energy_to": "sensor.netz_einspeisung", "number_energy_price": 0.3},
    {"type": "solar", "stat_energy_from": "sensor.pv_ertrag"}, {"type": "water", "stat_energy_from": "sensor.wasser"}],
    "device_consumption": [{"stat_consumption": "sensor.waschmaschine_kwh", "name": "Waschmaschine"}]}})
own_te = []
def watch_te(pg_):
    pg_.on("console", lambda m: own_te.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_te.append("PAGEERROR " + str(e)))
    return pg_
tabs_te = lambda pg_: pg_.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")
stats_asked = lambda: json.load(urllib.request.urlopen(HA + "/_stats"))

pgE = watch_te(b.new_page(viewport={"width": 1280, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgE.goto(BASE + "?debug=1"); pgE.wait_for_timeout(1500)
if pgE.is_visible("#modeSwitch [data-mode=live]"): pgE.click("#modeSwitch [data-mode=live]"); pgE.wait_for_timeout(1200)
check("today/energy (#481): the bar has 🏠, ☀ Heute, ⚡ Energie (the energy dashboard has meters)", tabs_te(pgE)[:3] == ["house", "today", "energy"], tabs_te(pgE))

# --- ☀ Heute
pgE.click("#tabBar [data-tab=today]"); pgE.wait_for_timeout(2500)
today = pgE.inner_text("[data-page=today]")
check("today: the time and the date", pgE.evaluate("/^\\d{2}:\\d{2}$/.test(document.querySelector('.tdTime')?.textContent || '')") and pgE.is_visible(".tdDate"), today[:80])
check("today: the weather now (Regen, 12 °C) and five days of forecast from Home Assistant",
      "Regen" in today and pgE.locator(".tdDay").count() == 5 and "12 °C" in pgE.inner_text(".tdWxTemp"), (pgE.locator(".tdDay").count(), today[:200]))
check("today: the events of the calendars (Zahnarzt) and the waste calendar apart (Gelber Sack)",
      "Zahnarzt" in pgE.inner_text(".tdAgenda") and "Gelber Sack" in pgE.inner_text(".tdWaste") and "Gelber Sack" not in pgE.inner_text(".tdAgenda"), today)
check("today: who is at home: Anna da, Max in Arbeit", "Anna" in pgE.inner_text(".tdPeople") and "Arbeit" in pgE.inner_text(".tdPeople"), pgE.inner_text(".tdPeople") if pgE.locator(".tdPeople").count() else "")
rows = pgE.evaluate("[...document.querySelectorAll('.tdHouse [data-act]')].map((b) => b.dataset.act)")
if "lights" in rows:
    pgE.click(".tdHouse [data-act=lights]"); pgE.wait_for_timeout(800)
    check("today: 'Lichter an' leads to the house with the list of lights", pgE.is_hidden("#tabPages") and pgE.is_visible("#lightsMenu"), rows)
    pgE.keyboard.press("Escape")
else:
    check("today: 'Im Haus' says all is well or what needs a look", pgE.locator(".tdHouse .tdAllOk").count() == 1 or rows, rows)

# --- ⚡ Energie
before = len(stats_asked())
pgE.click("#tabBar [data-tab=energy]"); pgE.wait_for_timeout(2500)
asked = stats_asked()[before:]
energy = pgE.inner_text("[data-page=energy]")
check("energy: today by hours from Home Assistant's statistics (the meters of the energy dashboard and the devices)",
      asked and asked[-1][1] == "hour" and set(asked[-1][0]) >= {"sensor.netz_bezug", "sensor.netz_einspeisung", "sensor.pv_ertrag", "sensor.waschmaschine_kwh"}, asked)
bars = pgE.evaluate("document.querySelectorAll('.peChart g').length")
check("energy: tiles (Verbraucht, Vom Dach, Aus dem Netz, Kosten), 24 bars, the biggest users and water",
      all(x in energy for x in ["Verbraucht", "Vom Dach", "Aus dem Netz", "Kosten", "Waschmaschine", "Wasser", "Heute"]) and bars == 24, (bars, energy[:300]))
pgE.click("[data-page=energy] [data-kind=year]"); pgE.wait_for_timeout(2000)
check("energy: 'Jahr' asks by months and draws 12 bars", stats_asked()[-1][1] == "month" and pgE.evaluate("document.querySelectorAll('.peChart g').length") == 12)
pgE.click("[data-page=energy] [data-kind=day]"); pgE.wait_for_timeout(1500)
fwd_off = pgE.evaluate("document.querySelector('[data-page=energy] [data-nav=fwd]').disabled")
pgE.click("[data-page=energy] [data-nav=back]"); pgE.wait_for_timeout(1500)
check("energy: ‹ goes back to yesterday, › is off while it is today", fwd_off and "Gestern" in pgE.inner_text(".pePeriod")
      and not pgE.evaluate("document.querySelector('[data-page=energy] [data-nav=fwd]').disabled"), pgE.inner_text(".pePeriod"))

# --- the house's own meters and price in ⚡ Rechnung
pgE.click("#modeSwitch [data-mode=edit]"); pgE.wait_for_timeout(600)
pgE.evaluate("document.getElementById('energyBtn').click()"); pgE.wait_for_timeout(600)
check("meters: ⚡ Rechnung has 'Zähler für den Verlauf' with a row per kind", pgE.locator("#energyBody .emKind").count() == 7 and pgE.is_visible("#emTake"))
pgE.click("#emTake")
for _ in range(20):                             # saved after the autosave delay
    pgE.wait_for_timeout(300)
    lay_e = api_admin("api/layout").get("energy") or {}
    if lay_e.get("meters"): break
check("meters: 'Aus dem Energie-Dashboard übernehmen' keeps its meters and price with the house",
      lay_e.get("meters", {}).get("from") == ["sensor.netz_bezug"] and lay_e.get("meters", {}).get("solar") == ["sensor.pv_ertrag"] and lay_e.get("price", {}).get("buy") == 0.3, lay_e)
pgE.fill("#emPrice_sell", "0.08"); pgE.locator("#emPrice_sell").dispatch_event("change")
for _ in range(20):
    pgE.wait_for_timeout(300)
    if (api_admin("api/layout").get("energy") or {}).get("price", {}).get("sell") == 0.08: break
check("meters: the price fed in is saved too", (api_admin("api/layout").get("energy") or {}).get("price", {}).get("sell") == 0.08)
pgE.keyboard.press("Escape"); pgE.wait_for_timeout(300)
pgE.click("#modeSwitch [data-mode=live]"); pgE.wait_for_timeout(800)
pgE.click("#tabBar [data-tab=energy]"); pgE.wait_for_timeout(2000)
check("energy: now with the house's own meters (said under the period)", "Zähler dieses Hauses" in pgE.inner_text("[data-page=energy]"))

# --- ⚙ → "Reiter unten": the calendars of the page ☀ Heute
pgE.click("#tabBar [data-tab=house]"); pgE.wait_for_timeout(300)
pgE.click("#settingsBtn"); pgE.wait_for_timeout(300)
open_setting(pgE, "#setAgendaCals"); pgE.wait_for_timeout(1200)
cals = pgE.evaluate("[...document.querySelectorAll('#setAgendaCals [data-cal]')].map((c) => c.dataset.cal)")
check("settings: 'Reiter unten' lists Home Assistant's calendars and the waste calendar", cals == ["calendar.familie", "calendar.muell"]
      and pgE.evaluate("document.querySelector('#setWasteCal').value") == "calendar.muell", cals)
pgE.click("#setAgendaCals [data-cal='calendar.familie']"); pgE.wait_for_timeout(1200)
check("settings: a ticked calendar is saved", api("api/settings")["agendaCalendars"] == ["calendar.familie"], api("api/settings")["agendaCalendars"])
pgE.keyboard.press("Escape"); pgE.close()

# --- the server: bad questions, a user locked out of the energy
bad = urllib.request.Request(BASE + "api/energy/stats", data=b'{"ids": ["sensor.a"], "start": "x", "end": "y", "period": "hour"}', method="POST", headers={"Content-Type": "application/json"})
try: code = urllib.request.urlopen(bad).status
except urllib.error.HTTPError as e: code = e.code
check("energy: a question without real dates is refused (400)", code == 400, code)
set_setting("userLocks", {"tablet_te": ["energy"]})
try: lock = urllib.request.urlopen(urllib.request.Request(BASE + "api/energy/meters", headers={"X-Remote-User-Name": "tablet_te"})).status
except urllib.error.HTTPError as e: lock = e.code
pgL = watch_te(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_te"}))
pgL.goto(BASE + "?debug=1"); pgL.wait_for_timeout(2000)
check("energy: a user locked out of the energy gets no page ⚡ Energie (the server refuses it too)", lock == 403 and "energy" not in tabs_te(pgL) and "today" in tabs_te(pgL), (lock, tabs_te(pgL)))
pgL.close()
check("today/energy: no errors on the page", not own_te, own_te[:3])

urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_te).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
for k in ("userLocks", "agendaCalendars", "wasteCalendar", "language"):
    set_setting(k, st_te.get(k, {} if k == "userLocks" else [] if k == "agendaCalendars" else ""))
post_te("/_extra", {}); post_te("/_energy", {})
