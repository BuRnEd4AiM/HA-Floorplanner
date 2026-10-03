#!/usr/bin/env python3
"""Draw floorplan3d/icon.png (128 x 128) and floorplan3d/logo.png (the images Home Assistant shows in the add-on store).
Needs: pip install playwright pillow, a Chromium (CHROME env var optional). Usage: python3 tools/make_addon_icons.py"""
import io
import os
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent.parent / "floorplan3d"

# an isometric house in the colours of the dark design: two walls with lit windows, a hip roof, a blue glow behind
HOUSE = """
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2f4b"/><stop offset="1" stop-color="#0b1320"/></linearGradient>
  <radialGradient id="glow" cx="50%" cy="55%" r="50%"><stop offset="0" stop-color="#3d9bff" stop-opacity=".45"/><stop offset="1" stop-color="#3d9bff" stop-opacity="0"/></radialGradient>
</defs>
"""
MARK = """
<g transform="translate(%(x)s,%(y)s) scale(%(s)s)">
  <ellipse cx="256" cy="400" rx="190" ry="60" fill="url(#glow)"/>
  <polygon points="256,150 376,290 256,230" fill="#8f372f"/>
  <polygon points="256,150 136,290 256,230" fill="#7d2f28"/>
  <polygon points="136,290 256,350 256,460 136,400" fill="#2b4a73"/>
  <polygon points="376,290 256,350 256,460 376,400" fill="#3f73ad"/>
  <polygon points="256,150 136,290 256,350" fill="#b4483c"/>
  <polygon points="256,150 376,290 256,350" fill="#d85b4b"/>
  <polygon points="152,322 192,344 192,384 152,362" fill="#ffd37a"/>
  <polygon points="210,353 236,368 236,404 210,389" fill="#ffd37a" opacity=".75"/>
  <polygon points="280,368 306,353 306,389 280,404" fill="#ffe9b0"/>
  <polygon points="324,344 364,322 364,362 324,384" fill="#ffd37a" opacity=".85"/>
  <polyline points="136,290 256,350 376,290" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="3"/>
</g>
"""


def html(w, h, body):
    return f"<!doctype html><meta charset=utf-8><style>html,body{{margin:0;background:transparent}}</style><svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}'>{body}</svg>"


def render(p, w, h, body):
    pg = p.new_page(viewport={"width": w, "height": h})
    pg.set_content(html(w, h, body))
    png = pg.screenshot(omit_background=True)
    pg.close()
    return Image.open(io.BytesIO(png)).convert("RGBA")


def main():
    chrome = os.environ.get("CHROME")
    with sync_playwright() as p:
        b = p.chromium.launch(**({"executable_path": chrome} if chrome else {}))
        icon = render(b, 512, 512, HOUSE + "<rect width='512' height='512' rx='104' fill='url(#bg)'/>" + MARK % {"x": 0, "y": 6, "s": 1})
        icon.resize((128, 128), Image.LANCZOS).save(OUT / "icon.png", optimize=True)
        text = ("<text x='240' y='112' font-family='DejaVu Sans, Arial, sans-serif' font-weight='800' font-size='78' fill='#ffffff'>3D Floorplan</text>"
                "<text x='244' y='162' font-family='DejaVu Sans, Arial, sans-serif' font-size='34' letter-spacing='6' fill='#7ad0ff'>FOR HOME ASSISTANT</text>")
        logo = render(b, 1000, 220, HOUSE + "<rect width='1000' height='220' rx='40' fill='url(#bg)'/>" + MARK % {"x": -43, "y": -76, "s": 0.61} + text)
        logo.resize((500, 110), Image.LANCZOS).save(OUT / "logo.png", optimize=True)
        b.close()
    print("written", OUT / "icon.png", OUT / "logo.png")


if __name__ == "__main__":
    main()
