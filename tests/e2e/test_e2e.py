"""Browser end-to-end test: drives the real interface in Chromium against the real server and a mock Home Assistant.

The checks are split into parts (tests/e2e/parts/). Every run first builds the test house (parts/base.py, the other parts
work in it), then runs the chosen parts, one after the other, each on its own: a part sees the helpers below and what
base.py made, never what another part made, so every part also passes when it runs alone.
  python test_e2e.py              the whole test: the house and every part
  python test_e2e.py power roofs  the house and only these parts (the number in front of the file name can be left out)
  python test_e2e.py --list       the parts and what each one checks
CI runs every part as its own job at the same time. run.sh starts the mock Home Assistant and the add-on for a run.
"""
import os
import json, sys, time, traceback, urllib.request
from pathlib import Path

S = str(Path(__file__).parent)
PARTS_DIR = Path(S) / "parts"
BASE = os.environ.get("E2E_URL", "http://localhost:8099/")          # the add-on (other ports: run.sh)
HA = os.environ.get("MOCK_HA_URL", "http://localhost:8123")         # the mock Home Assistant

def api(path):
    return json.load(urllib.request.urlopen(BASE + path))
def api_admin(path):
    """GET as the admin user (the editing endpoints refuse everybody else)"""
    return json.load(urllib.request.urlopen(urllib.request.Request(BASE + path, headers={"X-Remote-User-Name": "admin"})))
def set_setting(key, val):
    """change one stored setting through the API (as the admin user)"""
    h = {"X-Remote-User-Name": "admin"}
    r = urllib.request.urlopen(urllib.request.Request(BASE + "api/settings", headers=h))
    etag, cur = r.headers.get("ETag"), json.load(r)
    cur[key] = val
    urllib.request.urlopen(urllib.request.Request(BASE + "api/settings", data=json.dumps(cur).encode(), method="PUT", headers={**h, "Content-Type": "application/json", "If-Match": etag})).read()
def ha_calls():
    return json.load(urllib.request.urlopen(HA + "/_calls"))

def status_open(pg):
    """upright phones fold the values at the top (offline, open, cameras ...) into the 📊 drop-down (phonestatus.js): open it"""
    if pg.locator("#phoneStatusBtn").is_visible() and pg.locator("#phoneStatus").is_hidden():
        pg.click("#phoneStatusBtn"); pg.wait_for_timeout(200)

def view_menu(pg):
    """the view buttons (Auto, half section, pull apart, walls) sit in a drop-down at the top"""
    if not pg.locator("#viewMenu").is_visible():
        pg.click("#viewMenuBtn")

errors, results = [], []
def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra and not cond else ""), flush=True)

def parts():
    """name -> (file, first line of its description), in the order of the file names"""
    out = {}
    for f in sorted(PARTS_DIR.glob("[0-9]*.py")):
        doc = f.read_text(encoding="utf-8").split('"""')
        out[f.stem] = (f, doc[1].strip().splitlines()[0] if len(doc) > 2 else "")
    return out

def pick(args):
    """the parts named on the command line ('power' finds 07_power.py), all of them when none is named"""
    known = parts()
    if not args:
        return list(known)
    short = {n.split("_", 1)[-1]: n for n in known}
    bad = [a for a in args if a not in known and a not in short]
    if bad:
        sys.exit("unknown part(s): %s\nthe parts are: %s" % (", ".join(bad), ", ".join(short)))
    return [a if a in known else short[a] for a in args]

def run(name, path, ns):
    """run one part file in the namespace ns; a part that stops with an error is one failed check, the next part still runs"""
    t0, n0 = time.time(), len(results)
    print(f"\n=== {name}", flush=True)
    try:
        exec(compile(path.read_text(encoding="utf-8"), str(path), "exec"), ns)
        ok = True
    except Exception:
        traceback.print_exc()
        check(f"{name}: the part runs to its end", False, traceback.format_exc().strip().splitlines()[-1])
        ok = False
    print(f"=== {name}: {len(results) - n0} checks, {time.time() - t0:.0f} s", flush=True)
    return ok

if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] in ("--list", "--json"):
        if args[0] == "--json":
            print(json.dumps(list(parts())))
        else:
            for n, (_, doc) in parts().items():
                print(f"{n:16} {doc}")
        sys.exit(0)
    chosen = pick(args)
    from playwright.sync_api import sync_playwright      # only here: --list and --json work without it (the CI job that lists the parts)
    t_start = time.time()
    p = sync_playwright().start()
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    _new_page = b.new_page
    def new_page(*a, welcome=False, **k):
        pg_ = _new_page(*a, **k)
        if not welcome:                         # the welcome card of an empty house would cover the canvas of the older checks
            pg_.add_init_script("try { localStorage.setItem('fp3d.welcome', '1'); } catch (e) {}")
        def ready(go):                          # wait until the page has loaded its layout and built the scene; a fixed wait alone was too short on a slow CI runner
            def run(*a, **k):
                r = go(*a, **k)
                if "debug=1" in pg_.url:
                    try: pg_.wait_for_function("window.__fp && window.__fp.ready && window.__fp.ready()", timeout=30000)
                    except Exception: pass      # pages that never finish starting keep the old behaviour (the checks after it say what is wrong)
                return r
            return run
        pg_.goto, pg_.reload = ready(pg_.goto), ready(pg_.reload)
        return pg_
    b.new_page = new_page
    ns = dict(S=S, BASE=BASE, HA=HA, api=api, api_admin=api_admin, set_setting=set_setting, ha_calls=ha_calls, status_open=status_open, view_menu=view_menu,
              check=check, errors=errors, results=results, json=json, os=os, sys=sys, time=time, urllib=urllib, Path=Path, p=p, b=b)
    if not run("base", PARTS_DIR / "base.py", ns):
        print("\nthe test house could not be built: the parts are not run")
    else:
        shared = dict(ns)                       # what every part starts with: the helpers and the house of base.py
        for name in chosen:
            keep = set(b.contexts)
            run(name, parts()[name][0], dict(shared))
            for c in b.contexts:                # pages a part left open (it stopped early) would go on drawing and slow the next part down
                if c not in keep: c.close()
    b.close(); p.stop()
    bad = [e for e in errors if "favicon" not in e]
    check("no console errors", not bad, bad)
    print("\n%d/%d passed (%s, %.0f s)" % (sum(ok for _, ok in results), len(results), "all parts" if len(chosen) == len(parts()) else ", ".join(chosen), time.time() - t_start))
    sys.exit(0 if all(ok for _, ok in results) else 1)
