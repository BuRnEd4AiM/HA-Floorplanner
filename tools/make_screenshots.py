#!/usr/bin/env python3
"""Take the README pictures that show the editor: docs/img/library.png, toolbar.png, welcome.png, backup.png, version.png
(from the demo file and from a throw-away add-on server), and rebuild docs/img/overview.gif from the demo.
Needs: pip install playwright pillow aiohttp, a Chromium (CHROME env var optional).
Usage: python3 tools/make_screenshots.py [name ...]   (names: library toolbar welcome backup version tour; default: all)"""
import io
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "docs" / "img"
DEMO = (ROOT / "demo" / "floorplan3d-demo.html").as_uri()
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
PORT = 8197


def browser(p):
    chrome = os.environ.get("CHROME")
    return p.chromium.launch(**({"executable_path": chrome} if chrome else {}), args=ARGS)


def demo_page(b, query="mode=live", w=1600, h=900, dsf=2):
    pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=dsf)
    pg.goto(f"{DEMO}?{query}&debug=1"); pg.wait_for_timeout(3500)
    return pg


def shot_library(b):
    pg = demo_page(b, "mode=edit")
    pg.click("#view3d"); pg.click("[data-tool=device]"); pg.wait_for_timeout(1200)
    pg.screenshot(path=str(IMG / "library.png"))


def shot_toolbar(b):
    pg = demo_page(b, "mode=edit", w=1400, h=860)
    pg.click("#toolsEditBtn"); pg.wait_for_timeout(500)
    pg.screenshot(path=str(IMG / "toolbar.png"))


class Server:
    """a throw-away add-on server (standalone mode: no Home Assistant, everybody may edit)"""
    def __enter__(self):
        self.data = tempfile.mkdtemp()
        env = {**os.environ, "DATA_DIR": self.data, "CONFIG_DIR": os.path.join(self.data, "config"), "PORT": str(PORT)}
        env.pop("SUPERVISOR_TOKEN", None)
        self.proc = subprocess.Popen([sys.executable, str(ROOT / "floorplan3d" / "rootfs" / "app" / "server.py")], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(40):
            try:
                urllib.request.urlopen(f"http://localhost:{PORT}/api/layout", timeout=1); return self
            except OSError:
                time.sleep(0.25)
        raise RuntimeError("server did not start")

    def __exit__(self, *a):
        self.proc.terminate()


def app_page(b, query="mode=edit", w=1400, h=860):
    pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1.5, locale="en-US")
    pg.goto(f"http://localhost:{PORT}/?{query}")
    pg.wait_for_function("document.querySelector('[data-tool=select]')?.textContent.trim().length > 0", timeout=60000)   # the interface is translated
    pg.wait_for_timeout(2500)
    return pg


def shot_welcome(b):
    pg = app_page(b)
    pg.screenshot(path=str(IMG / "welcome.png"))


def shot_backup(b):
    pg = app_page(b)
    pg.evaluate("localStorage.setItem('fp3d.welcome','1')")
    pg.click("#housePanel summary"); pg.wait_for_timeout(800)
    pg.click("#abNow"); pg.wait_for_timeout(1500); pg.click("#abNow"); pg.wait_for_timeout(1500)
    pg.check("#setAutoBackup"); pg.wait_for_timeout(600)
    pg.click("#abTest"); pg.wait_for_timeout(1000)
    pg.locator("#autoBackup").scroll_into_view_if_needed()
    pg.locator("#panel").screenshot(path=str(IMG / "backup.png"))


def shot_version(b):
    pg = app_page(b, w=1100, h=700)
    pg.wait_for_function("document.querySelector('#versionPill')?.className.includes('ver-ok')", timeout=60000)
    pg.click("#versionPill"); pg.wait_for_timeout(600)
    pg.locator("#versionDialog").screenshot(path=str(IMG / "version.png"))


def shot_tour(b):
    """the quick tour GIF: live view, room panel, heat, humidity, whole house, 2D, split view, device library"""
    frames = []
    def grab(pg, ms=900):
        pg.wait_for_timeout(ms)
        im = Image.open(io.BytesIO(pg.screenshot())).convert("RGB").resize((900, 506), Image.LANCZOS)
        frames.append(im)
    pg = demo_page(b, "mode=live", w=1600, h=900, dsf=1)
    grab(pg, 600)
    pg.evaluate("window.__fp.openRoomPanel(window.__fp.layout.floors.find((f) => f.rooms.length).rooms[0].id)"); grab(pg, 1200)
    pg.keyboard.press("Escape")
    pg.click("#modeBar [data-vm=temp]"); grab(pg, 1000)
    pg.click("#modeBar [data-vm=humid]"); grab(pg, 1000)
    pg.click("#modeBar [data-vm=normal]")
    pg.evaluate("window.__fp.setHouseMode(true)"); grab(pg, 1800)
    pg.evaluate("window.__fp.setHouseMode(false)")
    pg.click("#view2d"); grab(pg, 1200)
    pg.click("#viewSplit"); grab(pg, 1400)
    pg.click("[data-mode=edit]"); pg.click("#view3d"); pg.click("[data-tool=device]"); grab(pg, 1400)
    pal = frames[0].quantize(256, method=Image.Quantize.MEDIANCUT)
    out = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    out[0].save(IMG / "overview.gif", save_all=True, append_images=out[1:], duration=1600, loop=0, optimize=True)


SHOTS = {"library": shot_library, "toolbar": shot_toolbar, "tour": shot_tour}
SERVER_SHOTS = {"welcome": shot_welcome, "backup": shot_backup, "version": shot_version}


def main():
    want = sys.argv[1:] or [*SHOTS, *SERVER_SHOTS]
    with sync_playwright() as p:
        b = browser(p)
        for n in want:
            if n in SHOTS:
                SHOTS[n](b); print("written", n)
        if any(n in SERVER_SHOTS for n in want):
            with Server():
                for n in want:
                    if n in SERVER_SHOTS:
                        SERVER_SHOTS[n](b); print("written", n)
        b.close()


if __name__ == "__main__":
    main()
