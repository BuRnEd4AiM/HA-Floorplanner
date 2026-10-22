"""4.15.0 (#501): "⤵ Von oben übernehmen" in ⚡ Rechnung → "Zähler für den Verlauf": for the power sensors set above (W) the counters
(kWh) are taken: one of the same device that fits (the inverter's total), else the power sensor itself when Home Assistant keeps its
statistics (4.16.0, #503: the page counts its mean as kWh), else "＋ Zähler anlegen" makes Home Assistant's "Integral" helper (config flow).
A second time everything is "war schon eingetragen".
"""
st_ec = api("api/settings")
set_setting("language", "de")
lay0_ec = api_admin("api/layout")
def put_layout_ec(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps({
    "sensor.e2e_wr_leistung": {"state": "2400", "device": "d_wr", "attributes": {"friendly_name": "WR Leistung", "unit_of_measurement": "W"}},
    "sensor.e2e_wr_gesamt": {"state": "9123.4", "device": "d_wr", "attributes": {"friendly_name": "WR Energie gesamt", "unit_of_measurement": "kWh", "state_class": "total_increasing"}},
    "sensor.e2e_wr_heute": {"state": "12.1", "device": "d_wr", "attributes": {"friendly_name": "WR Energie heute", "unit_of_measurement": "kWh", "state_class": "total_increasing"}},
    "sensor.e2e_akku_laden": {"state": "0", "attributes": {"friendly_name": "Akku Ladeleistung", "unit_of_measurement": "W"}},
    "sensor.e2e_akku_entladen": {"state": "854", "attributes": {"friendly_name": "Akku Entladeleistung", "unit_of_measurement": "W", "state_class": "measurement"}},
}).encode(), headers={"Content-Type": "application/json"}, method="POST")).read()
lay_ec = json.loads(json.dumps(lay0_ec))
lay_ec["energy"] = {"solar": {"entities": ["sensor.e2e_wr_leistung"]}, "battery": {"split": True, "charge": "sensor.e2e_akku_laden", "discharge": "sensor.e2e_akku_entladen"}}
put_layout_ec(lay_ec)
own_ec = []
pgN = b.new_page(viewport={"width": 1400, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgN.on("console", lambda m: own_ec.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgN.on("pageerror", lambda e: own_ec.append("PAGEERROR " + str(e)))
meters_ec = lambda: (api_admin("api/layout").get("energy") or {}).get("meters") or {}
def until_ec(fn, n=25, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgN.wait_for_timeout(ms)
    return fn()
line_ec = lambda kind: pgN.inner_text(f"#energyBody .emCounter[data-kind={kind}]") if pgN.locator(f"#energyBody .emCounter[data-kind={kind}]").count() else ""

pgN.goto(BASE + "?debug=1"); pgN.wait_for_timeout(1500)
pgN.click("#modeSwitch [data-mode=edit]"); pgN.wait_for_timeout(600)
pgN.evaluate("document.getElementById('energyBtn').click()"); pgN.wait_for_timeout(800)
check("counters (#501): 'Zähler für den Verlauf' has '⤵ Von oben übernehmen'", pgN.is_visible("#emFromPower"))
pgN.click("#emFromPower"); pgN.wait_for_timeout(1500)
check("counters: the inverter's total counter (not the one of today) is taken for the sun, saved with the house",
      until_ec(lambda: meters_ec().get("solar") == ["sensor.e2e_wr_gesamt"]) and "WR Energie gesamt" in line_ec("solar") and "übernommen" in line_ec("solar"), [meters_ec(), line_ec("solar")])
check("counters: a power sensor with statistics (W) is taken itself: the page counts its mean as kWh",
      until_ec(lambda: meters_ec().get("batOut") == ["sensor.e2e_akku_entladen"]) and "rechnet aus den Watt" in line_ec("batOut")
      and pgN.locator("#energyBody .emCounter[data-kind=batOut] [data-act=emMake]").count() == 0, [meters_ec(), line_ec("batOut")])
check("counters: a battery sensor without statistics says so and offers '＋ Zähler anlegen'",
      "keinen Verlauf" in line_ec("batIn") and pgN.locator("#energyBody .emCounter[data-kind=batIn] [data-act=emMake]").count() == 1, line_ec("batIn"))
pgN.click("#energyBody .emCounter[data-kind=batIn] [data-act=emMake]"); pgN.wait_for_timeout(2000)
flows = json.load(urllib.request.urlopen(HA + "/_flows"))
check("counters: '＋ Zähler anlegen' makes Home Assistant's Integral helper from the power sensor (kWh from W)",
      ["start", "integration"] in flows and any(f[0] == "step" and f[1].get("source") == "sensor.e2e_akku_laden" and f[1].get("unit_prefix") == "k"
                                                 and f[1].get("unit_time") == "h" and f[1].get("name") == "Akku Ladeleistung Energie" for f in flows), flows)
check("counters: the new counter is taken for 'In die Batterie geladen' and said so",
      until_ec(lambda: meters_ec().get("batIn") == ["sensor.akku_ladeleistung_energie"]) and "angelegt" in line_ec("batIn"), [meters_ec(), line_ec("batIn")])
pgN.click("#emFromPower"); pgN.wait_for_timeout(1500)
check("counters: a second time the helper is found as the counter of its sensor, nothing twice",
      "war schon" in line_ec("solar") and "war schon" in line_ec("batIn") and "war schon" in line_ec("batOut") and meters_ec().get("solar") == ["sensor.e2e_wr_gesamt"]
      and meters_ec().get("batIn") == ["sensor.akku_ladeleistung_energie"] and meters_ec().get("batOut") == ["sensor.e2e_akku_entladen"],
      [line_ec("solar"), line_ec("batIn"), line_ec("batOut"), meters_ec()])
import datetime as _dt
h0 = _dt.datetime.now(_dt.timezone.utc).replace(minute=0, second=0, microsecond=0) - _dt.timedelta(hours=3)
st_w = json.load(urllib.request.urlopen(urllib.request.Request(BASE + "api/energy/stats", method="POST", headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"},
       data=json.dumps({"ids": ["sensor.e2e_akku_entladen"], "start": h0.isoformat(), "end": (h0 + _dt.timedelta(hours=3)).isoformat(), "period": "hour"}).encode())))
check("counters: the statistics of a power meter come as kWh (its mean 0.5 kW for an hour: 0.5 kWh)",
      [v for _, v in st_w["stats"].get("sensor.e2e_akku_entladen", [])] == [0.5, 0.5, 0.5] and st_w["units"].get("sensor.e2e_akku_entladen") == "kWh", st_w)
check("counters: no errors on the page", not own_ec, own_ec[:3])
pgN.close()
put_layout_ec(lay0_ec)
urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")).read()
set_setting("language", st_ec.get("language", ""))
