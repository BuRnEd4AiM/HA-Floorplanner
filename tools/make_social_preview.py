#!/usr/bin/env python3
"""Draw docs/img/social-preview.png (GitHub social preview, 1280 x 640) in the dark design: the whole house of the demo
(dark theme) on a plain dark card. Needs: pip install playwright, a Chromium (PLAYWRIGHT_BROWSERS_PATH or CHROME env var).
Usage: python3 tools/make_social_preview.py [output.png]"""
import base64
import io
import os
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DEMO = ROOT / "demo" / "floorplan3d-demo.html"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs" / "img" / "social-preview.png"
HIDE = "body *{visibility:hidden!important} #view{visibility:visible!important}"          # only the 3D canvas stays

CARD = """<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box} body{margin:0;width:1280px;height:640px;overflow:hidden;font-family:'DejaVu Sans',system-ui,sans-serif;color:#e8eef5;
background:@@BG@@;position:relative}
.bar{position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,#3d9bff,#7ad0ff)}
.k{position:absolute;left:72px;top:100px;letter-spacing:.32em;font-weight:700;font-size:20px;color:#7ad0ff}
h1{position:absolute;left:68px;top:140px;margin:0;font-size:104px;line-height:.98;font-weight:800;color:#fff}
.s{position:absolute;left:72px;top:372px;width:520px;font-size:28px;line-height:1.4;color:#b9c7d6}
.chips{position:absolute;left:72px;top:482px;display:flex;gap:12px}
.chip{border:1px solid #33465c;background:#17212d;border-radius:999px;padding:12px 20px;font-weight:700;font-size:19px;color:#e8eef5}
.house{position:absolute;right:24px;top:70px;width:580px;height:500px;object-fit:contain}
.tag{position:absolute;background:#17212dee;border:1px solid #33465c;border-radius:12px;padding:10px 16px;font-size:13px;letter-spacing:.08em;color:#9fb2c6;text-transform:uppercase}
.tag b{display:block;margin-top:4px;font-size:19px;letter-spacing:0;text-transform:none;color:#fff}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffc95e;margin-right:8px}
</style>
<div class="k">HOME ASSISTANT ADD-ON</div><h1>3D<br>Floorplan</h1>
<div class="s">Draw your home, see it in 3D and control it right where things are.</div>
<div class="chips"><span class="chip">Live control</span><span class="chip">JSON &amp; AI import</span><span class="chip">7 languages</span></div>
<img class="house" src="data:image/png;base64,@@SHOT@@">
<div class="tag" style="left:775px;top:64px">Living room<b><span class="dot"></span>5 lights on</b></div>
<div class="tag" style="left:1085px;top:300px">Kitchen<b>21.4 °C</b></div>
<div class="tag" style="left:690px;top:490px">Windows<b>2 open</b></div>
<div class="bar"></div>"""


def main():
    chrome = os.environ.get("CHROME")
    with sync_playwright() as p:
        b = p.chromium.launch(**({"executable_path": chrome} if chrome else {}),
                              args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1400, "height": 1000}, device_scale_factor=2)
        pg.goto(DEMO.as_uri() + "?mode=live&debug=1"); pg.wait_for_timeout(3500)
        assert pg.evaluate("document.documentElement.dataset.theme") == "dark", "the demo must start in the dark design"
        pg.evaluate("window.__fp.setHouseMode(true)"); pg.wait_for_timeout(2500)
        pg.add_style_tag(content=HIDE); pg.wait_for_timeout(600)
        raw = Image.open(io.BytesIO(pg.locator("#view").screenshot())).convert("RGB")
        bg = raw.getpixel((4, 4))                                                         # the colour of the 3D scene: the card gets the same, so it blends
        box = ImageChops.difference(raw, Image.new("RGB", raw.size, bg)).point(lambda v: 255 if v > 12 else 0).getbbox()
        pad = 30
        crop = raw.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(raw.width, box[2] + pad), min(raw.height, box[3] + pad)))
        buf = io.BytesIO(); crop.save(buf, "PNG"); shot = buf.getvalue()
        card = b.new_page(viewport={"width": 1280, "height": 640})
        card.set_content(CARD.replace("@@SHOT@@", base64.b64encode(shot).decode("ascii")).replace("@@BG@@", "rgb(%d,%d,%d)" % bg)); card.wait_for_timeout(500)
        card.screenshot(path=str(OUT))
        b.close()
    print("written", OUT)


if __name__ == "__main__":
    main()
