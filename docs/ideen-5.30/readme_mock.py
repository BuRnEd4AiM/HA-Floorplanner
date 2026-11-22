"""Der Kopf der GitHub-Seite (README.md) nachgebaut, heute und mit dem neuen Hinweis „Fastest start: let an AI build your house“ (Idee 1,
docs/ideen-5.30, #779). Nur fürs Foto: make_pictures.py öffnet die HTML-Datei, die diese Funktion schreibt."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def badge(label, msg, color, label_color='#555'):
    return (f'<span class="b"><span style="background:{label_color}">{label}</span><span style="background:{color}">{msg}</span></span>')


def big(label, msg, color, new=False):
    ring = ' style="outline:3px solid #2ea057;outline-offset:3px"' if new else ''
    return f'<span class="bb"{ring}><span style="background:#0a3ba8">{label}</span><span style="background:{color};color:#111">{msg}</span></span>'


def page(new: bool) -> str:
    svg = (ROOT / "docs/img/inside.svg").as_uri()
    tip = """
<div class="alert"><p class="at">💡 Tip</p>
<p><b>Fastest start: let an AI build your house from the building plan.</b> No drawing needed:</p>
<ol>
<li>In the add-on: <b>Import house from JSON → 📋 Copy AI prompt</b> (or take the <a>prompt from the guide</a>)</li>
<li>Paste it into <b>Claude, ChatGPT or Gemini</b> and attach a <b>photo or PDF of your floor plan</b></li>
<li>Paste the answer back → <b>Check</b> → <b>Import</b>. A few minutes later the whole house is there, then you link your devices.</li>
</ol></div>""" if new else ""
    ai_badge = big("🤖 HOUSE FROM YOUR FLOOR PLAN", "BY AI IN MINUTES", "#7dff9a", True) if new else ""
    return f"""<!doctype html><meta charset="utf-8"><style>
body {{ margin:0; background:#fff; font: 16px/1.5 -apple-system, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; color:#1f2328 }}
.top {{ height:62px; background:#f6f8fa; border-bottom:1px solid #d1d9e0; display:flex; align-items:center; padding:0 24px; gap:10px; font-size:14px }}
.top b {{ font-weight:600 }}
.md {{ max-width:900px; margin:24px auto; border:1px solid #d1d9e0; border-radius:6px; padding:8px 40px 32px }}
.md .file {{ margin:0 -40px 16px; padding:10px 16px; border-bottom:1px solid #d1d9e0; font-weight:600; font-size:14px }}
h1 {{ font-size:2em; border-bottom:1px solid #d1d9e0; padding-bottom:.3em; margin:.3em 0 .6em; font-weight:600 }}
h3 {{ font-size:1.25em; margin:0 0 .8em; font-weight:600 }}
.c {{ text-align:center }}
.b {{ display:inline-flex; font: 11px Verdana, sans-serif; color:#fff; margin:2px; border-radius:3px; overflow:hidden }}
.b span {{ padding:3px 6px }}
.bb {{ display:inline-flex; font: bold 11px Verdana, sans-serif; letter-spacing:1px; color:#fff; margin:4px; border-radius:4px; overflow:hidden }}
.bb span {{ padding:8px 12px }}
sub {{ font-size:12px; color:#59636e; display:block; margin:4px 40px 12px }}
.alert {{ text-align:left; border-left:4px solid #1a7f37; padding:4px 16px; margin:16px 0; }}
.alert .at {{ color:#1a7f37; font-weight:600; margin:4px 0 }}
.alert p {{ margin:6px 0 }} .alert ol {{ margin:6px 0 8px; padding-left:22px }} .alert li {{ margin:3px 0 }}
a {{ color:#0969da }}
</style>
<div class="top"><b>BuRnEd4AiM / HA-Floorplanner</b><span style="color:#59636e">· Public</span></div>
<div class="md"><div class="file">README.md</div><div class="c">
<h1>🏠 3D Floorplan for Home Assistant</h1>
<h3>More than a floor plan: your whole smart home in one place, in 3D.</h3>
<p>Draw your home (or let an AI build it), then run lights, heating, energy, security, cameras and your own routines right where things are, with ready-made dashboard pages, on the phone, the PC and the wall tablet.</p>
</div>{tip}<div class="c">
<img src="{svg}" width="700">
<p>{badge('CI', 'passing', '#4c1')}{badge('release', 'v5.29.0', '#007ec6')}{badge('license', 'GPLv3', '#007ec6')}{badge('Home Assistant', 'add-on', '#41BDF5')}{badge('Ingress', 'yes', '#4c1')}{badge('made with', '❤', '#e0245e')}{badge('timeline', '📈 version by version', '#6250d6')}</p>
<p>{ai_badge}{big('▶ TRY THE DEMO', 'OPEN IN THE BROWSER', '#7dff9a')}{big('⬇ DOWNLOAD THE DEMO', 'ALWAYS THE LATEST', '#23e0ff')}{big('🧪 TRY THE BETA', 'THE NEWEST CHANGES', '#ff7ad9')}</p>
</div></div>"""


def write(path: Path, new: bool) -> Path:
    path.write_text(page(new), encoding="utf-8")
    return path
