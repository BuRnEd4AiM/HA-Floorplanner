"""4.21.0 (#515): the card "🔋 Ladestand" on ⚡ Energie. The batteries of the house (the charge of ⚡ Rechnung and every battery of the plan
whose sensor is in %) through the day from Home Assistant's statistics (mean, min, max per 5 minutes; a sensor without statistics from its
history), "Zusammen" (a line each) or "Einzeln" (a chart each), a chip per battery to leave it out, the device remembers the choice; a week
by hours, a year by days; the values under the mouse; a second house: "Alle Häuser" and "⚖ Vergleichen" show the batteries of both, the
name of the house in front. A house with only a battery (no meters) gets the page too.
"""
import datetime as _dt
saved_bl = api_admin("api/layout")              # put back at the end
st_bl = api("api/settings")
set_setting("language", "de")
def post_bl(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def send_bl(method, path, body=None):
    r = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, method=method,
                               headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r))
post_bl("/_energy", {})                         # no energy dashboard: the house has no meters, only its batteries
post_bl("/_extra", {
    "sensor.e2e_soc": {"state": "77", "attributes": {"friendly_name": "Hausspeicher Ladung", "unit_of_measurement": "%", "device_class": "battery"}},
    "sensor.e2e_nostat_soc": {"state": "40", "attributes": {"friendly_name": "Gartenakku", "unit_of_measurement": "%"}},
    "sensor.e2e_zweit_soc": {"state": "55", "attributes": {"friendly_name": "Speicher Zweithaus", "unit_of_measurement": "%"}},
})
now_bl = _dt.datetime.now(_dt.timezone.utc)
post_bl("/_hist", {"sensor.e2e_nostat_soc": [[(now_bl - _dt.timedelta(minutes=50)).isoformat(), "35"], [(now_bl - _dt.timedelta(minutes=20)).isoformat(), "45"]]})
lay_bl = json.loads(json.dumps(saved_bl))
lay_bl["energy"] = {**(lay_bl.get("energy") or {}), "battery": {"level": "sensor.e2e_soc"}}
lay_bl["energy"].pop("meters", None)
lay_bl["floors"][0].setdefault("devices", []).append({"id": "bl_bat", "type": "battery", "x": 1, "z": 1, "y": 0, "rot": 0, "scale": 1, "name": "Gartenakku", "entity": "sensor.e2e_nostat_soc"})
send_bl("PUT", "api/layout", lay_bl)
levels_asked = lambda: json.load(urllib.request.urlopen(HA + "/_levels"))
own_bl = []
pgB = b.new_page(viewport={"width": 1280, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgB.on("console", lambda m: own_bl.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgB.on("pageerror", lambda e: own_bl.append("PAGEERROR " + str(e)))
def open_energy_bl():
    pgB.goto(BASE + "?debug=1"); pgB.wait_for_timeout(1500)
    if pgB.is_visible("#modeSwitch [data-mode=live]"): pgB.click("#modeSwitch [data-mode=live]"); pgB.wait_for_timeout(800)
    pgB.click("#tabBar [data-tab=energy]"); pgB.wait_for_timeout(2500)
open_energy_bl()
card_bl = "[data-page=energy] .pbCard"
chips_bl = lambda: pgB.evaluate(f"[...document.querySelectorAll('{card_bl} .pbBat')].map((c) => [c.dataset.battery, c.innerText.replace(/\\s+/g, ' ').trim(), c.classList.contains('off')])")
lines_bl = lambda: pgB.evaluate(f"[...document.querySelectorAll('{card_bl} .pbLine')].map((l) => l.dataset.battery)")
asked = levels_asked()
check("battery (#515): a house with only batteries has the page ⚡ Energie with the card '🔋 Ladestand' alone",
      pgB.locator(card_bl).count() == 1 and pgB.locator("[data-page=energy] .peChartCard").count() == 1 and "ladestand" in pgB.inner_text(card_bl).lower(), pgB.inner_text("[data-page=energy]")[:300])
check("battery: today is asked for in 5 minutes (mean, min, max) for both batteries", asked and asked[-1][1] == "5minute"
      and set(asked[-1][0]) == {"sensor.e2e_soc", "sensor.e2e_nostat_soc"}, asked[-2:])
c = chips_bl()
check("battery: a chip per battery with its charge now (⚡ Rechnung first, then the battery of the plan)",
      [x[0] for x in c] == ["sensor.e2e_soc", "sensor.e2e_nostat_soc"] and "77 %" in c[0][1] and "Gartenakku" in c[1][1] and "40 %" in c[1][1], c)
check("battery: 'Zusammen': one chart, a line per battery (the one without statistics from its history)",
      sorted(lines_bl()) == ["sensor.e2e_nostat_soc", "sensor.e2e_soc"] and pgB.locator(f"{card_bl} .pbChart").count() == 1
      and pgB.evaluate(f"document.querySelector('{card_bl} [data-mode=together]').classList.contains('on')"), lines_bl())
box = pgB.locator(f"{card_bl} .pbChart .peNow").bounding_box()
pgB.mouse.move(box["x"] - 2, box["y"] + box["height"] / 2); pgB.wait_for_timeout(200)   # just before now: the values of both batteries
tip_bl = pgB.inner_text(f"{card_bl} .pbTip") if pgB.is_visible(f"{card_bl} .pbTip") else ""
check("battery: the mouse on the chart shows the time and the charge of the battery there", "%" in tip_bl and "Hausspeicher" in tip_bl and ":" in tip_bl, tip_bl)
pgB.mouse.move(5, 5)

pgB.click(f"{card_bl} [data-mode=single]"); pgB.wait_for_timeout(300)
check("battery: 'Einzeln': a chart for each battery, with its lowest and highest charge",
      pgB.locator(f"{card_bl} .pbOne").count() == 2 and pgB.locator(f"{card_bl} .pbBand").count() >= 1 and "tiefster Stand" in pgB.inner_text(f"{card_bl} .pbOne"), pgB.inner_text(card_bl)[:300])
pgB.click(f"{card_bl} .pbBat[data-battery='sensor.e2e_nostat_soc']"); pgB.wait_for_timeout(300)
c = chips_bl()
check("battery: a tap on a chip leaves the battery out (struck through), its chart goes", c[1][2] is True and pgB.locator(f"{card_bl} .pbOne").count() == 1
      and pgB.evaluate(f"document.querySelector('{card_bl} .pbOne').dataset.battery") == "sensor.e2e_soc", c)
open_energy_bl()
check("battery: the device remembers the choice ('Einzeln', the battery left out) after a reload",
      pgB.evaluate(f"document.querySelector('{card_bl} [data-mode=single]')?.classList.contains('on')") and chips_bl()[1][2] is True
      and pgB.locator(f"{card_bl} .pbOne").count() == 1, chips_bl())
pgB.click(f"{card_bl} .pbBat[data-battery='sensor.e2e_soc']"); pgB.wait_for_timeout(300)
check("battery: all left out: the card says how to show them again", "Tippe oben" in pgB.inner_text(card_bl), pgB.inner_text(card_bl))
pgB.click(f"{card_bl} .pbBat[data-battery='sensor.e2e_soc']"); pgB.click(f"{card_bl} .pbBat[data-battery='sensor.e2e_nostat_soc']")
pgB.click(f"{card_bl} [data-mode=together]"); pgB.wait_for_timeout(300)
pgB.click("[data-page=energy] [data-kind=week]"); pgB.wait_for_timeout(1500)
check("battery: a week is asked for by hours", levels_asked()[-1][1] == "hour" and len(lines_bl()) >= 1, levels_asked()[-1:])
pgB.click("[data-page=energy] [data-kind=year]"); pgB.wait_for_timeout(1500)
check("battery: a year by days", levels_asked()[-1][1] == "day", levels_asked()[-1:])
pgB.click("[data-page=energy] [data-kind=day]"); pgB.wait_for_timeout(800)

# --- a second house with a battery of its own
h2_bl = send_bl("POST", "api/houses", {"name": "Akkuhaus"})["id"]
send_bl("PUT", f"api/layout?house={h2_bl}", {"version": 1, "energy": {"battery": {"level": "sensor.e2e_zweit_soc"}},
                                            "floors": [{"id": "a0", "name": "EG", "kind": "floor", "walls": [], "rooms": [], "devices": []}]})
open_energy_bl()
check("battery: one house chosen: only its batteries", [x[0] for x in chips_bl()] == ["sensor.e2e_soc", "sensor.e2e_nostat_soc"], chips_bl())
pgB.click("[data-page=energy] [data-house='*']"); pgB.wait_for_timeout(2000)
c = chips_bl()
colors_bl = pgB.evaluate(f"[...document.querySelectorAll('{card_bl} .pbBat .pbSwatch line')].map((l) => l.getAttribute('stroke'))")
check("battery: 'Alle Häuser': the batteries of both houses, the house in front, the colour of the house (its second battery dashed)",
      [x[0] for x in c] == ["sensor.e2e_soc", "sensor.e2e_nostat_soc", "sensor.e2e_zweit_soc"] and "Akkuhaus" in c[2][1] and "55 %" in c[2][1]
      and colors_bl[0] == colors_bl[1] != colors_bl[2] and len(lines_bl()) == 3, (c, colors_bl))
pgB.click("[data-page=energy] [data-house=cmp]"); pgB.wait_for_timeout(2000)
check("battery: '⚖ Vergleichen' has the card too, with the batteries of both houses",
      pgB.locator(card_bl).count() == 1 and len(chips_bl()) == 3, pgB.inner_text("[data-page=energy]")[:300])
pgB.close()
urllib.request.urlopen(urllib.request.Request(BASE + f"api/houses/{h2_bl}", method="DELETE", headers={"X-Remote-User-Name": "admin"})).read()

# --- the server
bad = urllib.request.Request(BASE + "api/energy/levels", data=b'{"ids": ["sensor.e2e_soc"], "start": "x", "end": "y", "period": "5minute"}', method="POST", headers={"Content-Type": "application/json"})
try: code = urllib.request.urlopen(bad).status
except urllib.error.HTTPError as e: code = e.code
check("battery: a question without real dates is refused (400)", code == 400, code)
set_setting("userLocks", {"tablet_bl": ["energy"]})
q_bl = json.dumps({"ids": ["sensor.e2e_soc"], "start": (now_bl - _dt.timedelta(hours=2)).isoformat(), "end": now_bl.isoformat(), "period": "5minute"}).encode()
try: lock = urllib.request.urlopen(urllib.request.Request(BASE + "api/energy/levels", data=q_bl, method="POST", headers={"X-Remote-User-Name": "tablet_bl", "Content-Type": "application/json"})).status
except urllib.error.HTTPError as e: lock = e.code
check("battery: a user locked out of the energy gets no charge either (403)", lock == 403, lock)
check("battery: no errors on the page", not own_bl, own_bl[:3])

send_bl("PUT", "api/layout", saved_bl)
for k in ("userLocks", "language"):
    set_setting(k, st_bl.get(k, {} if k == "userLocks" else ""))
post_bl("/_extra", {}); post_bl("/_hist", {})
