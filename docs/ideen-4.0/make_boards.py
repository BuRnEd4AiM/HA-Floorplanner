"""The pattern boards of this folder (8-boeden, 9-waende, 10-fassade): every finish of finishes.js on a floor or wall in the light of
the 3D view, with its German name. Serves static/ and board.html on a local port and photographs the page (Playwright 1.56, see
docs/UEBERGABE.md).
    python3 docs/ideen-4.0/make_boards.py <output folder>
board.html takes: where=floor|wall|facade (or keys=a,b,c), wall=1 (a wall seen from the front), m=metres of the view, cols, title."""
import asyncio, http.server, shutil, sys, tempfile, threading
from pathlib import Path
from playwright.async_api import async_playwright
HERE = Path(__file__).resolve().parent
STATIC = HERE.parents[1] / "floorplan3d" / "rootfs" / "app" / "static"
OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
BOARDS = [("8-boeden", "where=floor&cols=6&title=Böden (29, jede Farbe, Größe und Drehung einstellbar)"),
          ("9-waende", "where=wall&cols=6&wall=1&m=1.6&title=Wände (30, jede Farbe, Größe und Drehung einstellbar)"),
          ("10-fassade", "where=facade&cols=6&wall=1&m=3&title=Fassade außen (12)")]
async def main():
    root = Path(tempfile.mkdtemp()); shutil.copy(HERE / "board.html", root / "board.html"); (root / "static").symlink_to(STATIC)
    handler = lambda *a, **k: http.server.SimpleHTTPRequestHandler(*a, directory=str(root), **k)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8765), handler); threading.Thread(target=srv.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        for name, query in BOARDS:
            pg = await (await b.new_context(viewport={"width": 1800, "height": 900})).new_page()
            await pg.goto("http://127.0.0.1:8765/board.html?" + query)
            await pg.wait_for_function("window.done === true", timeout=300000)
            await pg.screenshot(path=str(OUT / f"{name}.png"), full_page=True)
            print(name)
        await b.close()
    srv.shutdown()
asyncio.run(main())
