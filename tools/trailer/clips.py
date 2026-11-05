"""The short clips for TikTok, Instagram Reels and YouTube Shorts (tools/make_clips.py), the owner's wish (2026-11-05): "in TikTok
noch bewerben … gerne mehr Menschen erreichen", then "das Werkzeug für die Clips bauen".

A clip shows ONE thing the add-on does, upright (9:16), 14 to 22 seconds. It is cut from the shots of the trailer (shots.py), so the
shots are filmed once for both and a clip needs nothing filmed of its own:
  - the hook: big words at once over the first shot, instead of its caption (they must stop the thumb in the first two seconds)
  - then the shots, each with its caption from the trailer
  - at the end the name, "Demo: Link im Profil" and the address of the demo
Every clip also has the text for under the video and its hashtags, German and English: the page of the trailer shows them with a
button to copy them (clips.json), and `python3 tools/make_clips.py --texts` prints them for the plan of the posts.

In the hook's big words "|" says where the second line begins ("Mein ganzes Zuhause | in der Hosentasche"; at most two lines).
To add a clip: a dict in CLIPS. Its shots are ids of shots.SHOTS, or (id, beats) to give one another length (a beat is half a second;
a recording that is longer than its place runs faster, at most 2.4 times). Then python3 tools/make_clips.py <id> and look at it.
WHEN says in which week and on which day the plan posts it.

Pure data and a little logic (no picture, no browser): tests/test_make_clips.py checks it.
"""
import copy
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "guide"))

import shots as S  # noqa: E402

END_BEATS = 8                     # the end (name, "Demo: Link im Profil", address): 4 seconds
END_TEXT = {
    "de": {"line": "Kostenlos · Open Source", "pill": "Demo: Link im Profil"},
    "en": {"line": "Free · Open source", "pill": "Demo: link in bio"},
}
DAYS = {"de": ["Dienstag", "Donnerstag", "Sonntag"], "en": ["Tuesday", "Thursday", "Sunday"]}

# hook: (small word above, the big words, a line under them) per language; text: under the video; tags: the hashtags
CLIPS = [
    dict(id="haus", when=(1, 0), shots=[("hero", 12), "close", "inside"],
         hook={"de": ("Home Assistant", "Mein Haus in 3D – | und alles darin ist echt", ""),
               "en": ("Home Assistant", "My house in 3D – | and it's all real", "")},
         text={"de": "Mein Zuhause als 3D-Modell in Home Assistant: Lampen, Fenster und Sensoren live, genau da, wo sie sind. "
                     "Kostenlos, die Demo läuft ohne Installation im Browser: Link im Profil.",
               "en": "My home as a 3D model in Home Assistant: lamps, windows and sensors live, right where they are. "
                     "Free, the demo runs in your browser without installing anything: link in bio."},
         tags={"de": ["homeassistant", "smarthome", "hausautomation", "3d", "opensource"],
               "en": ["homeassistant", "smarthome", "homeautomation", "3d", "opensource"]}),
    dict(id="licht", when=(1, 1), shots=["light", "scenes", "close"],
         hook={"de": ("Home Assistant", "Diese Lampen sind echt", "Antippen im 3D-Haus – zu Hause geht das Licht an."),
               "en": ("Home Assistant", "These lamps are real", "Tap one in the 3D house – the light at home goes on.")},
         text={"de": "Ich tippe auf die Lampe im 3D-Haus, und zu Hause geht das Licht an. Dimmen, Farbe, Szenen für das ganze Haus. "
                     "Home Assistant mit 3D Floorplan, kostenlos. Demo: Link im Profil.",
               "en": "I tap the lamp in the 3D house and the light at home goes on. Dim, colour, scenes for the whole house. "
                     "Home Assistant with 3D Floorplan, free. Demo: link in bio."},
         tags={"de": ["homeassistant", "smarthome", "licht", "hausautomation", "diy"],
               "en": ["homeassistant", "smarthome", "smartlights", "homeautomation", "diy"]}),
    dict(id="fenster", when=(1, 2), shots=["warnings", "voice", "security"],
         hook={"de": ("", "Regen – und welches Fenster ist noch offen?", "Ein Blick aufs 3D-Haus reicht."),
               "en": ("", "Rain – which window is still open?", "One look at the 3D house.")},
         text={"de": "Es regnet und ein Fenster ist offen? Mein 3D-Haus zeigt sofort, welches, und ich kann es auch fragen. "
                     "Home Assistant mit 3D Floorplan, kostenlos. Demo: Link im Profil.",
               "en": "It rains and a window is open? My 3D house shows which one at once, and I can just ask it. "
                     "Home Assistant with 3D Floorplan, free. Demo: link in bio."},
         tags={"de": ["homeassistant", "smarthome", "fenster", "sicherheit", "hausautomation"],
               "en": ["homeassistant", "smarthome", "homesecurity", "windows", "homeautomation"]}),
    dict(id="zeichnen", when=(2, 0), shots=["build", "roof", ("hero", 12)],
         hook={"de": ("", "Ich zeichne meinen Grundriss …", "… und das 3D-Haus entsteht dabei."),
               "en": ("", "I draw my floor plan …", "… and the 3D house builds itself.")},
         text={"de": "Grundriss zeichnen, und das 3D-Haus entsteht live: Wände, Fenster, Dach, Gauben, Treppen, Balkon. "
                     "Für Home Assistant, kostenlos. Die Demo läuft ohne Installation: Link im Profil.",
               "en": "Draw the floor plan and the 3D house appears live: walls, windows, roof, dormers, stairs, balcony. "
                     "For Home Assistant, free. The demo runs without installing: link in bio."},
         tags={"de": ["grundriss", "homeassistant", "hausbau", "3d", "smarthome"],
               "en": ["floorplan", "homeassistant", "3d", "smarthome", "diy"]}),
    dict(id="klima", when=(2, 1), shots=["colors", "heat", "flow"],
         hook={"de": ("", "Wo ist es zu warm – | und wo zu kalt?", "Temperatur als Farbe, in jedem Raum."),
               "en": ("", "Which room is too warm – and which too cold?", "Temperature as colour, in every room.")},
         text={"de": "Temperatur, Feuchte und CO₂ als Farbe in jedem Raum, dazu Heizplan und Regeln wie „Fenster auf, Heizung aus“. "
                     "Home Assistant mit 3D Floorplan, kostenlos. Demo: Link im Profil.",
               "en": "Temperature, humidity and CO₂ as colour in every room, plus a heating schedule and rules like \"window open, "
                     "heating off\". Home Assistant with 3D Floorplan, free. Demo: link in bio."},
         tags={"de": ["heizung", "homeassistant", "smarthome", "energiesparen", "hausautomation"],
               "en": ["heating", "homeassistant", "smarthome", "energysaving", "homeautomation"]}),
    dict(id="ki", when=(3, 0), shots=["import", ("hero", 12)],
         hook={"de": ("KI", "Foto vom Grundriss → 3D-Haus", "ChatGPT & Co. bauen es, ganz ohne Zeichnen."),
               "en": ("AI", "Floor plan photo → 3D house", "ChatGPT & co. build it, no drawing at all.")},
         text={"de": "Grundriss fotografieren, an ChatGPT geben, die Antwort einfügen: fertig ist das 3D-Haus in Home Assistant. "
                     "Kostenlos. Demo: Link im Profil.",
               "en": "Take a photo of the floor plan, give it to ChatGPT, paste the answer: the 3D house in Home Assistant is done. "
                     "Free. Demo: link in bio."},
         tags={"de": ["ki", "chatgpt", "grundriss", "homeassistant", "smarthome"],
               "en": ["ai", "chatgpt", "floorplan", "homeassistant", "smarthome"]}),
    dict(id="strom", when=(3, 1), shots=["power", "power-edit", "pages"],
         hook={"de": ("", "Wohin fließt mein Strom gerade?", "Solar, Netz, Batterie – live im 3D-Haus."),
               "en": ("", "Where is my power going right now?", "Solar, grid, battery – live in the 3D house.")},
         text={"de": "Solar, Netz, Batterie und jedes Gerät: Ich sehe live im 3D-Haus, wohin mein Strom fließt. "
                     "Home Assistant mit 3D Floorplan, kostenlos. Demo: Link im Profil.",
               "en": "Solar, grid, battery and every device: I see live in the 3D house where my power goes. "
                     "Home Assistant with 3D Floorplan, free. Demo: link in bio."},
         tags={"de": ["photovoltaik", "solar", "homeassistant", "strom", "smarthome"],
               "en": ["solar", "solarpower", "homeassistant", "energy", "smarthome"]}),
    dict(id="wetter", when=(4, 0), shots=["sky-day", "sky-dusk", "sky-night", "sky-snow", "close"],
         hook={"de": ("", "Mein 3D-Haus hat | das Wetter von draußen", "Sonne, Abend, Nacht und Schnee – live."),
               "en": ("", "My 3D house has the weather from outside", "Sun, dusk, night and snow – live.")},
         text={"de": "Sonne, Regen, Schnee und Nacht: Mein 3D-Haus hat den Himmel von draußen, zur echten Uhrzeit. "
                     "Home Assistant mit 3D Floorplan, kostenlos. Demo: Link im Profil.",
               "en": "Sun, rain, snow and night: my 3D house has the sky from outside, at the real time of day. "
                     "Home Assistant with 3D Floorplan, free. Demo: link in bio."},
         tags={"de": ["homeassistant", "smarthome", "wetter", "3d", "hausautomation"],
               "en": ["homeassistant", "smarthome", "weather", "3d", "homeautomation"]}),
    dict(id="handy", when=(4, 1), shots=["phone", "dash", "voice"],
         hook={"de": ("", "Mein ganzes Zuhause | in der Hosentasche", "Am Handy, am Tablet, an der Wand."),
               "en": ("", "My whole home | in my pocket", "On the phone, the tablet, the wall.")},
         text={"de": "Mein ganzes Zuhause in 3D am Handy, am Tablet oder an der Wand, und fragen kann ich es auch. "
                     "Home Assistant mit 3D Floorplan, kostenlos. Demo: Link im Profil.",
               "en": "My whole home in 3D on the phone, the tablet or the wall, and I can ask it too. "
                     "Home Assistant with 3D Floorplan, free. Demo: link in bio."},
         tags={"de": ["homeassistant", "smarthome", "dashboard", "tablet", "hausautomation"],
               "en": ["homeassistant", "smarthome", "dashboard", "tablet", "homeautomation"]}),
    dict(id="ohne-yaml", when=(4, 2), shots=["flow", "dash", "pages"],
         hook={"de": ("Home Assistant", "Smart Home | ganz ohne YAML", "Fertige Seiten und Abläufe zum Klicken."),
               "en": ("Home Assistant", "Smart home | without any YAML", "Ready-made pages, routines by clicking.")},
         text={"de": "Fertige Seiten, eigene Dashboards und Abläufe aus Bausteinen, ganz ohne YAML. "
                     "Home Assistant mit 3D Floorplan, kostenlos. Demo: Link im Profil.",
               "en": "Ready-made pages, your own dashboards and routines from blocks, without any YAML. "
                     "Home Assistant with 3D Floorplan, free. Demo: link in bio."},
         tags={"de": ["homeassistant", "smarthome", "nodered", "dashboard", "hausautomation"],
               "en": ["homeassistant", "smarthome", "nodered", "dashboard", "homeautomation"]}),
]
BY_ID = {c["id"]: c for c in CLIPS}

# the end of every clip: drawn, nothing filmed; its id "outro" gives it the logo's hit in the music (music.py)
END = S.Shot("outro", "card", lambda r: None, END_BEATS, part="outro")


def shot_ids(clip):
    """the ids of the trailer's shots a clip needs"""
    return [s if isinstance(s, str) else s[0] for s in clip["shots"]]


def order(clip):
    """the clip's shots as Shot objects (a copy where it has another length) and the end: for edit.plan"""
    out = []
    for s in clip["shots"]:
        sid, beats = (s, None) if isinstance(s, str) else s
        sh = S.SHOTS[sid]
        if beats is not None and beats != sh.beats:
            sh = copy.copy(sh)
            sh.beats = beats
        out.append(sh)
    return out + [END]


def seconds(clip):
    return sum(sh.seconds for sh in order(clip))


def hashtags(clip, lang):
    return " ".join("#" + t for t in clip["tags"][lang])


def post_text(clip, lang):
    """what goes under the video: the text and the hashtags"""
    return f"{clip['text'][lang]}\n\n{hashtags(clip, lang)}"


def hook_line(clip, lang):
    """the first words as one line: "Ich zeichne meinen Grundriss … und das 3D-Haus entsteht dabei.", "Diese Lampen sind echt. Antippen …" """
    kicker, title, sub = clip["hook"][lang]
    title = " ".join(w for w in title.split() if w != "|")            # "|": where the big words break into the second line
    if not sub:
        return title
    if title.endswith("…") and sub.startswith("…"):
        return f"{title[:-1].rstrip()} … {sub[1:].lstrip()}"
    return f"{title}{'' if title[-1] in '?!.…' else '.'} {sub}"


def when(clip, lang="de"):
    week, day = clip["when"]
    return (f"Woche {week}, {DAYS['de'][day]}" if lang == "de" else f"Week {week}, {DAYS['en'][day]}")


def meta(clip):
    """one clip for clips.json (the page of the trailer)"""
    return {"id": clip["id"], "week": clip["when"][0], "day": clip["when"][1], "seconds": round(seconds(clip), 1),
            "hook": {lang: hook_line(clip, lang) for lang in ("de", "en")},
            "text": {lang: post_text(clip, lang) for lang in ("de", "en")}}


def texts_markdown(lang="de"):
    """the plan of the posts as Markdown: every clip in its week, with its first words, its text and its hashtags"""
    rows = []
    for c in sorted(CLIPS, key=lambda c: c["when"]):
        rows.append(f"### {when(c, lang)}: {c['id']} ({seconds(c):.0f} s)\n\n"
                    f"{'Erste Worte' if lang == 'de' else 'First words'}: {hook_line(c, lang)}\n\n{post_text(c, lang)}\n")
    return "\n".join(rows)
