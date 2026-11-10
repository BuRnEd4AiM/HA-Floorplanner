"""Before/after pictures of #703: start the mock HA and two add-on servers (old = origin/main, new = this branch), put the same layout, photograph."""
import json, os, subprocess, sys, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright
REPO = "/home/user/HA-Floorplanner"; L = sys.argv[1]; OUT = sys.argv[2]
def ring(p, x1, z1, ops=None):
    sides = (([0, 0], [x1, 0]), ([x1, 0], [x1, z1]), ([x1, z1], [0, z1]), ([0, z1], [0, 0]))
    return [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": (ops or {}).get(i, [])} for i, (a, c) in enumerate(sides)]
lay = {"version": 1, "plot": {"boundary": [[-6, -6], [20, -6], [20, 16], [-6, 16]], "areas": [],
       "terrain": {"points": [{"id": "t1", "x": 7, "z": 0, "h": 0}, {"id": "t2", "x": 7, "z": 6.6, "h": -3.15}]}},
       "floors": [
  {"id": "kg", "name": "Keller", "kind": "basement", "walls": ring("k", 14.5, 6.25, {2: [
      {"id": "w1", "type": "window", "pos": 8.5, "width": 1.2, "height": 1.0, "sill": 1.0},
      {"id": "gt", "type": "door", "style": "garage", "pos": 3.25, "width": 2.6, "height": 2.2, "sill": 0}]}),
   "rooms": [{"id": "hobby", "name": "Hobbyraum", "points": [[0, 0], [8, 0], [8, 6.25], [0, 6.25]]},
             {"id": "garage", "name": "Garage", "raise": -0.5, "points": [[8, 0], [14.5, 0], [14.5, 6.25], [8, 6.25]]}],
   "devices": [], "blocks": [], "stairs": []},
  {"id": "eg", "name": "EG", "kind": "floor", "walls": ring("e", 8, 6.25, {2: [{"id": "w2", "type": "window", "style": "double", "pos": 2.5, "width": 1.8, "height": 2.1, "sill": 0}]}),
   "rooms": [{"id": "wohnen", "name": "Wohnen", "points": [[0, 0], [8, 0], [8, 6.25], [0, 6.25]]},
             {"id": "ter", "name": "Terrasse", "terrace": True, "color": "#a58a63", "rail": "glass",
              "points": [[8, 0], [14.5, 0], [14.5, 8.25], [3.75, 8.25], [3.75, 6.25], [8, 6.25]]}],
   "devices": [], "blocks": [], "stairs": []}]}
procs = []
def start(name, root, port, mport):
    data = tempfile.mkdtemp(); logs = tempfile.mkdtemp()
    open(f"{logs}/opts.json", "w").write('{"editors": ["admin"]}')
    env = dict(os.environ, PORT=str(port), DATA_DIR=data, SUPERVISOR_TOKEN="x", HA_API=f"http://localhost:{mport}", OPTIONS_FILE=f"{logs}/opts.json")
    procs.append(subprocess.Popen([sys.executable, f"{root}/floorplan3d/rootfs/app/server.py"], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
mock = subprocess.Popen([sys.executable, f"{REPO}/tests/e2e/mock_ha.py"], env=dict(os.environ, MOCK_PORT="8130"), cwd=f"{REPO}/tests/e2e", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
procs.append(mock)
start("old", f"{L}/old", 8131, 8130); start("new", REPO, 8132, 8130)
try:
    for port in (8131, 8132):
        for _ in range(40):
            try: urllib.request.urlopen(f"http://localhost:{port}/"); break
            except Exception: time.sleep(0.5)
        urllib.request.urlopen(urllib.request.Request(f"http://localhost:{port}/api/layout", data=json.dumps(lay).encode(), method="PUT",
                               headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        for name, port in (("vorher", 8131), ("nachher", 8132)):
            pg = b.new_page(viewport={"width": 1200, "height": 800}, device_scale_factor=2, locale="de-DE", extra_http_headers={"X-Remote-User-Name": "admin"})
            pg.goto(f"http://localhost:{port}/?debug=1&mode=live&skytime=13:00")
            pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pg.wait_for_timeout(1500)
            pg.evaluate("() => { const s = window.__fp.settings && window.__fp.settings(); if (s) { s.seeThrough = false; s.cutaway = false; } }")
            pg.evaluate("() => window.__fp.setHouseMode(true)")
            pg.wait_for_timeout(800)
            pg.evaluate("() => window.__fp.camAt(1.5, 2.0, 19.5, 8.5, 5)"); pg.wait_for_timeout(2500)
            pg.screenshot(path=f"{OUT}/{name}.png")
            pg.close()
        b.close()
finally:
    for pr in procs: pr.terminate()
