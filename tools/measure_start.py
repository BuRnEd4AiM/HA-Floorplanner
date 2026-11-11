#!/usr/bin/env python3
"""How fast does the add-on start on a wall tablet? Measures before and after a change that should make the start faster
(the idea list of 2026-11-11: load only the chosen language, bundle the files, load rare parts only when needed).

Starts the add-on like the browser test (tests/e2e/run.sh: mock Home Assistant + server.py with an empty data folder) and opens it in
Chromium as a tablet: a touch screen (so the add-on starts in its low mode like on a real tablet), the processor 4× slower and every
request 20 ms later (the way through Home Assistant's ingress). Each run opens the page twice:

  first  = a new browser, nothing in its cache (the first start after an update)
  again  = the same browser reloads the page (the daily case: the files are in the cache, the browser only asks whether they changed)

and reports per run: requests for the interface files (.js/.css/.html), their size as sent (MB, unpacked: the add-on does not pack
them, Home Assistant's ingress does), how many came back as "unchanged" (304), the time until every module was loaded
(window.fp3dBooted, see bootguard.js) and until the house was built (window.__fp.ready()). The median of --runs runs.

    python3 tools/measure_start.py                 # 3 runs, the language of the settings (German)
    python3 tools/measure_start.py --lang fr       # with the language set to French first
    python3 tools/measure_start.py --url http://localhost:8099/   # an add-on that is already running
    python3 tools/measure_start.py --json

Needs aiohttp and Playwright (pip install -r requirements-dev.txt playwright==1.63.0; Chromium from /opt/pw-browsers or Playwright's own).
"""
import argparse
import json
import os
import socket
import statistics
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
E2E = ROOT / "tests" / "e2e"
SERVER = ROOT / "floorplan3d" / "rootfs" / "app" / "server.py"
UI = (".js", ".css", ".html", ".mjs")

# records when every module is loaded: app.js sets window.fp3dBooted = true (bootguard.js stands down then)
BOOT_HOOK = """
try { localStorage.setItem('fp3d.welcome', '1'); } catch (e) {}
(() => { let v; Object.defineProperty(window, 'fp3dBooted', { configurable: true,
  get: () => v, set: (x) => { v = x; if (x && !window.__bootAt) window.__bootAt = performance.now(); } }); })();
"""


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_addon():
    """mock Home Assistant + the add-on, like tests/e2e/run.sh; returns (url, stop)"""
    port, mport = free_port(), free_port()
    logs, data = Path(tempfile.mkdtemp()), Path(tempfile.mkdtemp())
    (logs / "opts.json").write_text('{"editors": ["admin"]}')
    env = dict(os.environ, MOCK_PORT=str(mport))
    mock = subprocess.Popen([sys.executable, "mock_ha.py"], cwd=E2E, env=env, stdout=open(logs / "mock.log", "w"), stderr=subprocess.STDOUT)
    env = dict(os.environ, PORT=str(port), DATA_DIR=str(data), SUPERVISOR_TOKEN="x", HA_API=f"http://localhost:{mport}",
               CALLMEBOT_URL=f"http://localhost:{mport}/_callmebot", CALLMEBOT_TG=f"http://localhost:{mport}/_cmb",
               DBF_URL=f"http://localhost:{mport}/_dbf", OPTIONS_FILE=str(logs / "opts.json"))
    server = subprocess.Popen([sys.executable, str(SERVER)], cwd=E2E, env=env, stdout=open(logs / "server.log", "w"), stderr=subprocess.STDOUT)
    url = f"http://localhost:{port}/"
    for _ in range(60):
        try:
            urllib.request.urlopen(url, timeout=1)
            break
        except OSError:
            time.sleep(0.5)
    else:
        server.kill(); mock.kill()
        sys.exit(f"the add-on did not start, see {logs / 'server.log'}")

    def stop():
        for p in (server, mock):
            p.terminate()
            try:
                p.wait(5)
            except subprocess.TimeoutExpired:
                p.kill()
    return url, stop


def set_language(url, lang):
    req = urllib.request.Request(url + "api/settings")
    cur = json.load(urllib.request.urlopen(req))
    cur["language"] = lang
    put = urllib.request.Request(url + "api/settings", data=json.dumps(cur).encode(), method="PUT",
                                 headers={"Content-Type": "application/json"})
    urllib.request.urlopen(put)


def launch(p):
    args = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
    try:
        return p.chromium.launch(args=args)
    except Exception:
        return p.chromium.launch(args=args, executable_path="/opt/pw-browsers/chromium")


def open_once(page, cdp, url, reload=False):
    """one start of the page: requests, bytes, 304s, time to every module loaded and to the house built (ms)"""
    reqs = {}

    def on_sent(e):
        if e["request"]["url"].split("?")[0].endswith(UI) or e["request"]["url"].rstrip("/") + "/" == url:
            reqs[e["requestId"]] = {"status": None, "bytes": 0}

    def on_resp(e):
        if e["requestId"] in reqs:
            reqs[e["requestId"]]["status"] = e["response"]["status"]
            reqs[e["requestId"]]["cache"] = e["response"].get("fromDiskCache") or e["response"].get("fromMemoryCache")

    def on_done(e):
        if e["requestId"] in reqs:
            reqs[e["requestId"]]["bytes"] = e.get("encodedDataLength", 0)

    cdp.on("Network.requestWillBeSent", on_sent)
    cdp.on("Network.responseReceived", on_resp)
    cdp.on("Network.loadingFinished", on_done)
    if reload:
        page.reload(wait_until="commit")
    else:
        page.goto(url + "?debug=1", wait_until="commit")
    page.wait_for_function("window.__fp && window.__fp.ready && window.__fp.ready()", timeout=180000, polling=50)
    ready = page.evaluate("performance.now()")                      # since this page started loading
    boot = page.evaluate("window.__bootAt || null")
    page.wait_for_timeout(300)
    for ev in ("Network.requestWillBeSent", "Network.responseReceived", "Network.loadingFinished"):
        cdp.remove_listener(ev, {"Network.requestWillBeSent": on_sent, "Network.responseReceived": on_resp,
                                 "Network.loadingFinished": on_done}[ev])
    r = list(reqs.values())
    # a file the browser takes from its cache without asking is no request on the wire
    wire = [x for x in r if not x.get("cache") or x["status"] == 304]
    return {"requests": len(wire), "mb": round(sum(x["bytes"] for x in wire) / 1e6, 2),
            "unchanged_304": sum(1 for x in wire if x["status"] == 304), "from_cache": sum(1 for x in r if x.get("cache") and x["status"] != 304),
            "modules_ms": round(boot) if boot else None, "ready_ms": round(ready)}


def measure(url, runs, cpu, latency):
    from playwright.sync_api import sync_playwright
    out = {"first": [], "again": []}
    with sync_playwright() as p:
        b = launch(p)
        for _ in range(runs):
            ctx = b.new_context(viewport={"width": 1280, "height": 800}, has_touch=True, locale="de-DE", timezone_id="Europe/Berlin")
            ctx.add_init_script(BOOT_HOOK)
            page = ctx.new_page()
            cdp = ctx.new_cdp_session(page)
            cdp.send("Network.enable")
            cdp.send("Emulation.setCPUThrottlingRate", {"rate": cpu})
            cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": latency,
                                                           "downloadThroughput": 50e6 / 8, "uploadThroughput": 20e6 / 8})
            out["first"].append(open_once(page, cdp, url))
            out["again"].append(open_once(page, cdp, url, reload=True))
            ctx.close()
        b.close()
    med = {}
    for k, rows in out.items():
        med[k] = {f: (statistics.median([r[f] for r in rows if r[f] is not None]) if any(r[f] is not None for r in rows) else None) for f in rows[0]}
    return med, out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--url", help="an add-on that is already running (default: start one like the browser test)")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--lang", help="set this language in ⚙ first (de, en, fr, es, it, nl, pl, zh, auto)")
    ap.add_argument("--cpu", type=float, default=4, help="processor slower by this factor (default 4, a tablet)")
    ap.add_argument("--latency", type=float, default=20, help="extra ms per request (default 20, Home Assistant's ingress)")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    stop = None
    url = a.url
    if not url:
        url, stop = start_addon()
    elif not url.endswith("/"):
        url += "/"
    try:
        if a.lang:
            set_language(url, a.lang)
        med, raw = measure(url, a.runs, a.cpu, a.latency)
    finally:
        if stop:
            stop()
    if a.json:
        print(json.dumps({"median": med, "runs": raw}, indent=1))
        return
    print(f"tablet: CPU {a.cpu:g}x slower, +{a.latency:g} ms per request; median of {a.runs} runs")
    print(f"{'':7} {'requests':>9} {'MB':>6} {'304':>5} {'cache':>6} {'modules ms':>11} {'ready ms':>9}")
    for k in ("first", "again"):
        m = med[k]
        print(f"{k:7} {m['requests']:>9g} {m['mb']:>6.2f} {m['unchanged_304']:>5g} {m['from_cache']:>6g} "
              f"{(m['modules_ms'] or 0):>11.0f} {m['ready_ms']:>9.0f}")


if __name__ == "__main__":
    main()
