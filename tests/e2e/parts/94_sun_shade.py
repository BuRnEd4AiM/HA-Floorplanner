"""5.15.0 ☀ Sonnenschutz (the owner's choice 2026-11-17, docs/ideen-5.15 pictures 1 and 2): 🌡 Klima → ☀ Sonnenschutz lists the windows
with a roller shutter and which way each looks; switched on, the add-on sends the shutter the sun shines on down (sunshade.py, run by
rulesrun.py like the heating rules). "Wo ist Norden?" turns the compass for a plan not drawn with north up (the owner: "die Ausrichtung am
Kompass anpassen ohne das Haus neu zu zeichnen"): the windows and the compass of the 3D view follow, nothing is drawn anew.
"""
saved_ss = api_admin("api/layout")                 # put back at the end
st_ss = api("api/settings")
set_setting("language", "de")


def post_ha(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()


def put_admin(path, body):
    return json.load(urllib.request.urlopen(urllib.request.Request(BASE + path, data=json.dumps(body).encode(), method="PUT",
                                                                   headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})))


def cover_calls():
    return [c for c in json.load(urllib.request.urlopen(HA + "/_calldata")) if c[0] == "set_cover_position" and c[1] == "cover.rollo"]


post_ha("/_extra", {"sun.sun": {"state": "above_horizon", "attributes": {"friendly_name": "Sun", "azimuth": 180, "elevation": 40}}})
post_ha("/services/cover/set_cover_position", {"entity_id": "cover.rollo", "position": 100})     # open, with a position
lay_ss = json.loads(json.dumps(saved_ss))
lay_ss.pop("north", None)
f0_ss = lay_ss["floors"][0]
f0_ss.setdefault("rooms", []).append({"id": "ss_room", "name": "Sonnenzimmer", "color": "#777777", "points": [[140, 90], [144, 90], [144, 94], [140, 94]]})
f0_ss.setdefault("walls", []).append({"id": "ss_wall", "a": [144, 94], "b": [140, 94], "thickness": 0.2, "height": 2.6, "openings": [   # its south wall
    {"id": "ss_w", "type": "window", "style": "single", "pos": 2, "width": 1.2, "height": 1.2, "sill": 0.9, "name": "Südfenster", "shutter": True, "shutterEntity": "cover.rollo"}]})
put_admin("api/layout", lay_ss)
put_admin("api/rules", {"sun": {"on": False, "out": None, "inside": None}})                     # warm or not: the sun alone decides here
n0 = len(cover_calls())

pgSS = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_ss = []
pgSS.on("pageerror", lambda e: own_ss.append("PAGEERROR " + str(e)))
pgSS.goto(BASE + "?debug=1&mode=live"); pgSS.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgSS.wait_for_timeout(1200)
compass0 = pgSS.inner_text("#compassFrom")
pgSS.click("[data-tab=climate]"); pgSS.wait_for_timeout(800)
pgSS.click("[data-page=climate] [data-view=sun]")


def wait_ss(fn, n=60, ms=250):
    for _ in range(n):
        if fn():
            return True
        pgSS.wait_for_timeout(ms)
    return fn()


row = lambda: pgSS.evaluate("""(() => { const r = document.querySelector('.ssWin[data-cover="cover.rollo"]');
  return r ? { state: r.dataset.state, text: r.textContent } : null; })()""")
wait_ss(lambda: row() is not None)
r0 = row()
check("☀ the card lists the window with its shutter, it looks south and has the sun now", r0 is not None and r0["state"] == "sun" and "Süden" in r0["text"]
      and "Sonnenzimmer" in r0["text"], r0)
check("☀ the card says where the sun is (sun.sun of Home Assistant)", "Süden (180°), 40° hoch" in pgSS.inner_text("[data-sun=windows]"), pgSS.inner_text("[data-sun=windows]")[:200])
check("☀ switched off: nothing is sent", len(cover_calls()) == n0)
pgSS.click("[data-sun=on]", force=True)
check("☀ switched on (saved): the add-on sends the shutter in the sun to 30 %", wait_ss(lambda: len(cover_calls()) > n0 and cover_calls()[-1][2] == 30, n=120), cover_calls()[-3:])
check("☀ the setting is saved", api_admin("api/rules")["sun"]["on"] is True)
check("☀ the card then says the shutter is down", wait_ss(lambda: (row() or {}).get("state") == "down", n=80), row())
check("☀ the log of ▶ Abläufe has the line of the sun rule", any(x.get("src") == "sun" and x.get("act") == "down" for x in api_admin("api/rules")["log"]),
      api_admin("api/rules")["log"][-3:])
# − / + of a number
pgSS.click("[data-sun=card] [data-field=pos] button:last-child"); pgSS.wait_for_timeout(1500)
check("☀ „Rollladen fährt auf“ + makes it 40 %", wait_ss(lambda: api_admin("api/rules")["sun"]["pos"] == 40, n=20), api_admin("api/rules")["sun"])
# 🧭 where north is: the top of the plan looks east
pgSS.click("[data-sun=north] [data-turn='45']"); pgSS.wait_for_timeout(400)
pgSS.click("[data-sun=north] [data-turn='45']")
check("🧭 two taps on +45: the top of the plan is east (90°), the window looks west at once", wait_ss(lambda: "Westen" in (row() or {}).get("text", ""), n=20)
      and "Osten (90°)" in pgSS.inner_text("[data-sun=north]"), [row(), pgSS.inner_text("[data-sun=north]")])
check("🧭 saved with the plan, nothing else changed", wait_ss(lambda: api_admin("api/layout").get("north") == 90, n=40)
      and len(api_admin("api/layout")["floors"][0]["walls"]) == len(lay_ss["floors"][0]["walls"]), api_admin("api/layout").get("north"))
pgSS.click("[data-tab=house]"); pgSS.wait_for_timeout(1200)
compass1 = pgSS.inner_text("#compassFrom")
check("🧭 the compass of the 3D view turns with it (the same camera, another side)", compass1 != compass0, [compass0, compass1])
check("☀ no errors on the page", not own_ss, own_ss)
pgSS.close()
put_admin("api/rules", {"sun": {"on": False}})
put_admin("api/layout", saved_ss)
post_ha("/_extra", {})
set_setting("language", st_ss.get("language", "de"))
