"""4.47.0: several lamps in one bar of the light card (the owner: "ich kann nicht pro Karte mehrere Lampen hinzufügen … pro Kachel einfach
mehrere Lampen verknüpfen"). A bar with lamps of its own: on when one is, as bright as they are on average, ▸ opens to them, a tap, the
switch and dragging go to all of them, "Alle aus" takes the lamps that are on. In "Karte einstellen": "＋ Lampe dazu" under a bar with its
own search, a lamp's ✕, the name kept, saved with `more`.
"""
st_lb = api("api/settings")
set_setting("language", "de")
def post_lb(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
post_lb("/_extra", {
    "light.lb_decke": {"state": "on", "attributes": {"friendly_name": "Decke", "brightness": 204, "rgb_color": [255, 120, 40], "supported_color_modes": ["rgb"]}},
    "light.lb_spots": {"state": "on", "attributes": {"friendly_name": "Spots", "brightness": 102, "supported_color_modes": ["brightness"]}},
    "light.lb_regal": {"state": "off", "attributes": {"friendly_name": "Regal", "supported_color_modes": ["brightness"]}},
    "switch.lb_kette": {"state": "off", "attributes": {"friendly_name": "Lichterkette"}},
    "light.lb_flur": {"state": "off", "attributes": {"friendly_name": "Flur", "supported_color_modes": ["brightness"]}},
})
set_setting("pageLayouts", {"today": {"cards": [{"id": "c_lbbars", "type": "lights", "name": "Licht", "width": 2, "allOff": True, "rows": [
    {"e": "light.lb_decke", "more": ["light.lb_spots", "light.lb_regal"], "name": "Wohnzimmer", "icon": "🛋"}, {"e": "light.lb_flur"}]}]}})
own_lb = []
pgL = b.new_page(viewport={"width": 1400, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgL.on("console", lambda m: own_lb.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgL.on("pageerror", lambda e: own_lb.append("PAGEERROR " + str(e)))
data_lb = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
def wait_lb(fn, n=40, ms=250):
    for _ in range(n):
        v = fn()
        if v: return v
        pgL.wait_for_timeout(ms)
    return fn()
pgL.goto(BASE + "?debug=1"); pgL.wait_for_timeout(1500)
if pgL.is_visible("#modeSwitch [data-mode=live]"): pgL.click("#modeSwitch [data-mode=live]"); pgL.wait_for_timeout(800)
pgL.click("#tabBar [data-tab=today]"); pgL.wait_for_timeout(1200)
C = "[data-page=today] [data-card=c_lbbars] "
BAR = C + ".lcRow[data-e='light.lb_decke,light.lb_spots,light.lb_regal']"
wait_lb(lambda: pgL.locator(BAR).count() == 1)
look_lb = pgL.evaluate(f"""(() => {{ const r = document.querySelector("{BAR}"); return r && [r.className, r.querySelector('.lcName').textContent,
    r.querySelector('.lcState').textContent, r.style.getPropertyValue('--lc'), !!r.querySelector('.lcMore'), r.querySelector('input').checked]; }})()""")
check("light bars: a bar with three lamps of its own is on with their average (80 % and 40 % → 60 %), the colour of the first one on, its name and ▸",
      look_lb and "lc-on" in look_lb[0] and " many" in look_lb[0] and look_lb[1] == "Wohnzimmer" and look_lb[2] == "60 %" and "255, 120, 40" in look_lb[3]
      and look_lb[4] and look_lb[5], look_lb)
pgL.click(BAR + " .lcMore")
check("light bars: ▸ opens the bar to its three lamps (Decke 80 %, Spots 40 %, Regal Aus)",
      wait_lb(lambda: pgL.locator(C + ".lcRow.sub").count() == 3)
      and [pgL.inner_text(C + f".lcRow.sub[data-e='light.lb_{x}'] .lcState") for x in ("decke", "spots", "regal")] == ["80 %", "40 %", "Aus"])
n_lb = len(data_lb())
pgL.click(BAR + " .lcName")
check("light bars: a tap switches off the lamps of the bar that are on (not the one that is off)",
      wait_lb(lambda: sorted(x[1] for x in data_lb()[n_lb:] if x[0] == "turn_off") == ["light.lb_decke", "light.lb_spots"])
      and not [x for x in data_lb()[n_lb:] if x[1] == "light.lb_regal"], data_lb()[n_lb:])
wait_lb(lambda: "lc-off" in pgL.get_attribute(BAR, "class"))
n_lb = len(data_lb())
r_lb = pgL.locator(BAR).bounding_box()
pgL.mouse.move(r_lb["x"] + r_lb["width"] * 0.05, r_lb["y"] + r_lb["height"] / 2); pgL.mouse.down()
for i in range(1, 11):
    pgL.mouse.move(r_lb["x"] + r_lb["width"] * (0.05 + 0.025 * i), r_lb["y"] + r_lb["height"] / 2)
pgL.mouse.up()
sent_lb = wait_lb(lambda: sorted([x[1], x[2].get("brightness_pct")] for x in data_lb()[n_lb:] if x[0] == "turn_on") if len(data_lb()) - n_lb >= 3 else None)
check("light bars: dragging the bar to 30 % sends that brightness to all three lamps",
      sent_lb == [["light.lb_decke", 30], ["light.lb_regal", 30], ["light.lb_spots", 30]], sent_lb)
check("light bars: 'Alle aus' switches off every lamp of the bar that is on",
      (pgL.click(C + "[data-act=lcAllOff]") or True)
      and wait_lb(lambda: {"light.lb_decke", "light.lb_spots", "light.lb_regal"} <= {x[1] for x in data_lb()[n_lb:] if x[0] == "turn_off"}), data_lb()[n_lb:])

# ---- "Karte einstellen": ＋ Lampe dazu, a lamp's ✕, the name kept ----
pgL.click("#tabBar .tbEdit"); pgL.wait_for_timeout(600)
pgL.locator(C + ".bdTools .bdTool").first.click(); pgL.wait_for_timeout(600)
D = ".ceDlg[open] "
FLUR = D + ".sbRow[data-key='light.lb_flur'] "
check("light bars: in 'Karte einstellen' the bar with several lamps shows them each with ✕, the other one its id and '＋ Lampe dazu'",
      wait_lb(lambda: pgL.locator(D + ".sbRow[data-key='light.lb_decke,light.lb_spots,light.lb_regal'] .lcLamp").count() == 3)
      and pgL.locator(FLUR + "[data-act=lcLampAdd]").count() == 1 and pgL.inner_text(FLUR + ".sbId") == "light.lb_flur")
pgL.click(FLUR + "[data-act=lcLampAdd]"); pgL.wait_for_timeout(200)
pgL.fill(FLUR + ".lcLampFind .ceSearch", "lb_"); pgL.wait_for_timeout(200)
offer_lb = pgL.evaluate(f"[...document.querySelectorAll(\"{FLUR}.lcLampFind .ceItem\")].map((b) => b.dataset.entity)")
check("light bars: '＋ Lampe dazu' opens a search for this bar, without its own lamp", "switch.lb_kette" in offer_lb and "light.lb_flur" not in offer_lb, offer_lb)
pgL.click(FLUR + ".lcLampFind .ceItem[data-entity='switch.lb_kette']"); pgL.wait_for_timeout(200)
NEW = D + ".sbRow[data-key='light.lb_flur,switch.lb_kette'] "
pgL.click(NEW + ".lcLampFind .ceItem[data-entity='light.lb_regal']"); pgL.wait_for_timeout(200)
NEW = D + ".sbRow[data-key='light.lb_flur,switch.lb_kette,light.lb_regal'] "
check("light bars: two lamps added one after the other, the search stays open with what was typed",
      pgL.locator(NEW + ".lcLamp").count() == 3 and pgL.input_value(NEW + ".lcLampFind .ceSearch") == "lb_")
pgL.click(NEW + "[data-act=lcLampDone]"); pgL.wait_for_timeout(200)
pgL.fill(NEW + ".sbNameIn", "Flur & mehr")
pgL.click(NEW + ".lcLamp[data-entity='light.lb_regal'] .lcLampDel"); pgL.wait_for_timeout(200)
NEW = D + ".sbRow[data-key='light.lb_flur,switch.lb_kette'] "
check("light bars: a lamp's ✕ takes it out, the name typed before stays; the preview shows the new bar",
      pgL.locator(NEW + ".lcLamp").count() == 2 and pgL.input_value(NEW + ".sbNameIn") == "Flur & mehr"
      and "Flur & mehr" in pgL.inner_text(D + ".cePrev .lcRow[data-e='light.lb_flur,switch.lb_kette']"))
pgL.click(D + "[data-act=save]"); pgL.wait_for_timeout(600)
saved_lb = wait_lb(lambda: next((c for c in api("api/settings")["pageLayouts"]["today"]["cards"] if c["id"] == "c_lbbars"), {}).get("rows"))
check("light bars: saved with the lamps of each bar (`more`)",
      saved_lb == [{"e": "light.lb_decke", "more": ["light.lb_spots", "light.lb_regal"], "name": "Wohnzimmer", "icon": "🛋"},
                   {"e": "light.lb_flur", "more": ["switch.lb_kette"], "name": "Flur & mehr", "icon": ""}], saved_lb)
pgL.click("[data-page=today] [data-act=done]"); pgL.wait_for_timeout(400)
check("light bars: no errors on the page", not own_lb, own_lb)
pgL.close()
post_lb("/_extra", {})
set_setting("pageLayouts", st_lb.get("pageLayouts", {}))
set_setting("language", st_lb.get("language", "auto"))
