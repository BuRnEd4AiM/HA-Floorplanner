"""4.70.0 (the owner, 2026-11-07: "dass es nicht nur pro Gebäude ist … wenn man alle zwei Häuser … in einem Haus die drin hat und dann über
Bereiche die Häuser trennt, dass dann auch für den einen Bereich einen eigenen Stromrechner gibt"; with all buildings: „Beides getrennt“):
power per building. Two buildings in one plan, each with its grid meter in its rooms. „⚡ Eigene Rechnung je Gebäude“ in the tab
„⚡ Rechnung“ gives each building its own calculation (the plan's goes to the first), „Rechnung für“ switches the building like the switch at
the top, a setting changes only that building; the power overview, ☀ Heute and ⚡ Energie show the building chosen at the top, with
„🏘 Alle Gebäude“ each one apart (⚡ Energie: ⚖ Vergleichen); off again: one calculation for the plan.
"""
saved_eb = api_admin("api/layout")              # put back at the end
st_eb = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_eb(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_layout_eb(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
post_eb("/_extra", {
    "sensor.eb_netz_haupt": {"state": "800", "attributes": {"friendly_name": "Netz Haupthaus", "unit_of_measurement": "W"}},
    "sensor.eb_netz_garten": {"state": "300", "attributes": {"friendly_name": "Netz Gartenhaus", "unit_of_measurement": "W"}},
    "sensor.eb_pv": {"state": "1500", "attributes": {"friendly_name": "PV Haupthaus", "unit_of_measurement": "W"}},
    "sensor.eb_haupt_kwh": {"state": "1200.5", "attributes": {"friendly_name": "Haupthaus Bezug", "unit_of_measurement": "kWh", "state_class": "total_increasing"}},
})
sq_eb = lambda x0, z0, x1, z1: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
put_layout_eb({"version": 1, "buildings": [{"id": "ebMain", "name": "Haupthaus"}, {"id": "ebGarden", "name": "Gartenhaus"}],
               "energy": {"solar": {"entities": ["sensor.eb_pv"]}, "meters": {"from": ["sensor.eb_haupt_kwh"]}},
               "floors": [{"id": "ebEG", "name": "EG", "kind": "floor", "walls": [], "blocks": [], "stairs": [],
                           "rooms": [{"id": "ebWz", "name": "Wohnen", "points": sq_eb(0, 0, 8, 6), "building": "ebMain"},
                                     {"id": "ebGr", "name": "Gartenraum", "points": sq_eb(14, 0, 18, 4), "building": "ebGarden"}],
                           "devices": [{"id": "ebM1", "type": "powermeter", "x": 1, "z": 1, "y": 1.4, "rot": 0, "scale": 1, "entity": "sensor.eb_netz_haupt"},
                                       {"id": "ebM2", "type": "powermeter", "x": 15, "z": 1, "y": 1.4, "rot": 0, "scale": 1, "entity": "sensor.eb_netz_garten"}]}]})
own_eb = []
pgEb = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgEb.on("console", lambda m: own_eb.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgEb.on("pageerror", lambda e: own_eb.append("PAGEERROR " + str(e)))
pgEb.on("dialog", lambda d: d.accept())
def open_eb(mode):
    pgEb.goto(BASE + f"?debug=1&mode={mode}"); pgEb.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgEb.wait_for_timeout(1500)
    pgEb.evaluate("() => window.__fp.switchFloor(0)"); pgEb.wait_for_timeout(300)
units_eb = lambda: pgEb.evaluate("window.__fp.energyUnits().map((u) => [u.bid, u.bal.grid, u.bal.prod])")
def wait_eb(fn, n=30, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgEb.wait_for_timeout(ms)
    return fn()
lay_eb = lambda: api_admin("api/layout")
open_eb("edit")
pgEb.select_option("#buildingSelect", ""); pgEb.wait_for_timeout(600)
check("power per building: off at first, one calculation for the plan (both meters, the plan's solar)", units_eb() == [[None, 1100, 1500]], units_eb())
pgEb.evaluate("document.getElementById('energyBtn').click()"); pgEb.wait_for_selector("#enPerBuilding", timeout=10000)
check("power per building: the tab has „⚡ Eigene Rechnung je Gebäude“ (two buildings), not ticked", not pgEb.is_checked("#enPerBuilding"))
check("5.6.0: the buildings are a card of their own at the top („🏘 2 Gebäude in diesem Plan“), no building switch in the title while it is off",
      "2 Gebäude" in pgEb.inner_text("#energyUnits .euHead") and pgEb.is_hidden("#energyBld"), pgEb.inner_text("#energyUnits"))
pgEb.check("#enPerBuilding"); pgEb.wait_for_timeout(600)
check("power per building: on: with all buildings shown each one apart, each with the meter in its rooms; the plan's solar went to the first",
      units_eb() == [["ebMain", 800, 1500], ["ebGarden", 300, None]], units_eb())
check("power per building: „Rechnung für“ offers both buildings and asks to pick one",
      pgEb.locator("#energyUnits .euChip").count() == 2 and pgEb.is_visible("#energyUnits .euPick") and pgEb.locator("#energyBody > *").count() == 0)
l_eb = wait_eb(lambda: (lambda l: l if all("energy" in x for x in l.get("buildings", [])) else None)(lay_eb()))
check("power per building: saved: each building has its calculation, the plan none",
      l_eb and "energy" not in l_eb and l_eb["buildings"][0]["energy"].get("solar") == {"entities": ["sensor.eb_pv"]} and l_eb["buildings"][1]["energy"] == {},
      l_eb and (l_eb.get("energy"), [x.get("energy") for x in l_eb["buildings"]]))
check("5.6.0: ticked, the title of the window has „Rechnung für“ with both buildings too (in sight while scrolling)",
      pgEb.is_visible("#energyBld") and pgEb.locator("#energyBld .euChip").count() == 2)
pgEb.click("#energyBld .euChip[data-building=ebGarden]"); pgEb.wait_for_timeout(800)
check("power per building: a tap on „Gartenhaus“ shows it at the top too, and its calculation (300 W from the grid)",
      pgEb.input_value("#buildingSelect") == "ebGarden" and units_eb() == [["ebGarden", 300, None]] and "300 W" in pgEb.inner_text("#energyResult"),
      (pgEb.input_value("#buildingSelect"), units_eb()))
check("5.6.0: the calculation names the building and its button is lit in the title and in the card",
      "Gartenhaus" in (pgEb.text_content("#energyResult h3") or "") and pgEb.locator("#energyBld .euChip.on[data-building=ebGarden]").count() == 1
      and pgEb.locator("#energyUnits .euChip.on[data-building=ebGarden]").count() == 1, pgEb.text_content("#energyResult h3"))
pgEb.check("#enGridInvert"); pgEb.wait_for_timeout(500)
check("power per building: a setting of the garden house changes only its calculation (grid turned round: −300 W)",
      units_eb() == [["ebGarden", -300, None]] and wait_eb(lambda: (lay_eb()["buildings"][1]["energy"].get("grid") or {}).get("invert") is True)
      and not (lay_eb()["buildings"][0]["energy"].get("grid") or {}).get("invert"), (units_eb(), lay_eb()["buildings"]))
pgEb.uncheck("#enGridInvert"); pgEb.wait_for_timeout(500)
pgEb.click("#energyClose"); pgEb.wait_for_timeout(300)

open_eb("live")
pgEb.select_option("#buildingSelect", "ebGarden"); pgEb.wait_for_timeout(800)
pill_g = wait_eb(lambda: pgEb.evaluate("document.getElementById('energyPill').innerText") or None)
check("power per building: the overview at the top shows the garden house alone", pill_g and "300 W" in pill_g and "800" not in pill_g and "1,50" not in pill_g, pill_g)
pgEb.select_option("#buildingSelect", ""); pgEb.wait_for_timeout(800)
lines_eb = pgEb.evaluate("[...document.querySelectorAll('#energyPill .epUnit')].map((e) => e.innerText)")
check("power per building: „🏘 Alle Gebäude“: a line per building with its name", len(lines_eb) == 2 and lines_eb[0].startswith("Haupthaus") and "800 W" in lines_eb[0]
      and lines_eb[1].startswith("Gartenhaus") and "300 W" in lines_eb[1], lines_eb)
pgEb.click("#tabBar [data-tab=today]"); pgEb.wait_for_timeout(1500)
rows_eb = pgEb.evaluate("[...document.querySelectorAll('[data-page=today] .tdPowerRow')].map((e) => e.dataset.unit)")
check("power per building: ☀ Heute „Strom jetzt“: a row per building", rows_eb == ["ebMain", "ebGarden"], rows_eb)
pgEb.click("#tabBar [data-tab=energy]"); pgEb.wait_for_timeout(2500)
chips_eb = pgEb.evaluate("[...document.querySelectorAll('[data-page=energy] .peChips [data-house]')].map((e) => [e.dataset.building || e.dataset.house, e.classList.contains('on')])")
check("power per building: ⚡ Energie offers both buildings, with all buildings shown „⚖ Vergleichen“ is on (each apart)",
      ["ebMain", False] in chips_eb and ["ebGarden", False] in chips_eb and ["cmp", True] in chips_eb, chips_eb)
pgEb.select_option("#buildingSelect", "ebMain"); pgEb.wait_for_timeout(2500)
on_eb = pgEb.evaluate("[...document.querySelectorAll('[data-page=energy] .peChips [data-house].on')].map((e) => e.dataset.building || e.dataset.house)")
check("power per building: the main house at the top: ⚡ Energie shows it, with its own meters", on_eb == ["ebMain"]
      and "Zähler dieses Gebäudes" in pgEb.inner_text("[data-page=energy]"), (on_eb, pgEb.inner_text("[data-page=energy]")[:300]))

open_eb("edit")
pgEb.select_option("#buildingSelect", "ebMain"); pgEb.wait_for_timeout(600)
pgEb.evaluate("document.getElementById('energyBtn').click()"); pgEb.wait_for_selector("#enPerBuilding", timeout=10000)
pgEb.uncheck("#enPerBuilding"); pgEb.wait_for_timeout(600)
l_eb = wait_eb(lambda: (lambda l: l if not any("energy" in x for x in l.get("buildings", [])) else None)(lay_eb()))
check("power per building: off again: the main house's calculation is the plan's, one calculation (both meters)",
      l_eb and l_eb.get("energy", {}).get("solar") == {"entities": ["sensor.eb_pv"]} and units_eb() == [[None, 1100, 1500]], (l_eb and l_eb.get("energy"), units_eb()))
check("power per building: no errors on the page", not own_eb, own_eb[:5])
pgEb.close()
put_layout_eb(saved_eb)
post_eb("/_extra", {})
set_setting("language", st_eb.get("language", "de")); set_setting("units", st_eb.get("units", "metric"))
