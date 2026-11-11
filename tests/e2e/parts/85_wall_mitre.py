"""5.6.5 (#724, Miicki: "an der Ecke entsteht eine sichtbare Kerbe … die rechteckigen Wandenden stehen über die Aussenfläche der anderen
Wand hinaus"): two walls meeting at a slanted corner end in a mitre (wallmiter.js). A gallery outline far off the test house: at the 135°
corner the wall reaches only t / 2 · tan(22.5°) past the corner (before: a square end t / 2 past it, its corner sticking out); at the 90°
corner and where three walls meet, the square end stays. The 2D plan draws the same outline.
"""
saved_wm = api_admin("api/layout")              # put back at the end
def put_wm(body):
    r = urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(body).encode(), method="PUT",
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
    return json.load(r)
lay_wm = json.loads(json.dumps(saved_wm))
P_wm = [[90, 90], [94, 90], [96, 92], [96, 95], [93, 98], [90, 95]]          # 135° at (94, 90) and (96, 92), 90° at (90, 90)
walls_wm = [{"id": f"wm{i}", "a": list(a), "b": list(P_wm[(i + 1) % len(P_wm)]), "thickness": 0.24, "height": 2.6, "openings": []} for i, a in enumerate(P_wm)]
walls_wm.append({"id": "wm9", "a": [90, 95], "b": [87, 98], "thickness": 0.24, "height": 2.6, "openings": []})   # a third wall at (90, 95)
lay_wm["floors"][0].setdefault("walls", []).extend(walls_wm)
put_wm(lay_wm)
pgM = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgM.goto(BASE + "?debug=1&mode=edit"); pgM.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000)
pgM.evaluate("window.__fp.switchFloor(0)"); pgM.wait_for_timeout(1500)
EXT_WM = """(id) => { let g = null;
  window.__fp.scene.traverse((o) => { if (!g && o.userData?.kind === 'wall' && o.userData.id === id) g = o; });
  if (!g) return null;
  g.updateMatrixWorld(true);
  const out = [1e9, -1e9, 1e9, -1e9];                           // min x, max x, min z, max z of the wall in the world
  g.traverse((o) => { if (!o.isMesh || !o.geometry?.attributes?.position) return;
    const p = o.geometry.attributes.position, e = o.matrixWorld.elements;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const wx = e[0] * x + e[4] * y + e[8] * z + e[12], wz = e[2] * x + e[6] * y + e[10] * z + e[14];
      out[0] = Math.min(out[0], wx); out[1] = Math.max(out[1], wx); out[2] = Math.min(out[2], wz); out[3] = Math.max(out[3], wz); } });
  return out; }"""
e0 = pgM.evaluate(EXT_WM, "wm0")
k_wm = 0.12 * 0.41421356                                                     # t / 2 · tan(22.5°)
check("mitre (#724): the wall at the 135° corner reaches only to the mitre, not half its thickness past the corner",
      e0 is not None and abs(e0[1] - (94 + k_wm)) < 0.01, e0)
check("mitre (#724): at the 90° corner the square end stays (half the thickness past the corner)", e0 is not None and abs(e0[0] - 89.88) < 0.01, e0)
e1 = pgM.evaluate(EXT_WM, "wm1")
check("mitre (#724): the slanted wall meets it there: no corner sticking out below the other wall", e1 is not None and e1[2] > 90 - 0.121 and e1[2] < 90 - 0.11, e1)
e5 = pgM.evaluate(EXT_WM, "wm5")
check("mitre (#724): where three walls meet, the square ends stay", e5 is not None and abs(e5[3] - 95.12) < 0.01, e5)
pgM.click("#view2d"); pgM.wait_for_timeout(800)
# the plan draws the wall at the 135° corner to the same mitre point: its outline reaches no further right than the 3D wall
far_wm = pgM.evaluate("""() => { const p = window.__fp.plan(), [xr] = p.toClient(94 + 0.0497, 90), [xs] = p.toClient(94.12, 90);
  const pts = [...document.querySelectorAll('#plan2d polygon')].flatMap((g) => (g.getAttribute('points') || '').trim().split(/\\s+/).map((q) => q.split(',').map(Number)));
  const box = document.querySelector('#plan2d svg').getBoundingClientRect();
  return { xr, xs, n: pts.length, left: box.left, near: pts.filter(([x, y]) => Number.isFinite(x)).map(([x]) => x + box.left).filter((x) => x > xr - 30 && x < xs + 30) }; }""")
check("mitre (#724): the 2D plan draws the walls with the mitre too (nothing reaches past the mitre point)",
      far_wm["n"] > 0 and far_wm["near"] and max(far_wm["near"]) < far_wm["xr"] + 1.5, far_wm)
pgM.close()
put_wm(saved_wm)
