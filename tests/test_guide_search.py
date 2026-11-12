"""🎬 The search of the video guide (tools/guide/search.js) with the real clips: what people type finds the right video, also with
other words, other forms, typing mistakes and whole questions (the owner, 2026-11-03: "dass man die besser findet, wenn man oben was
sucht … wenn Leute ein anderes Wort verwenden als es ist, dass dann trotzdem das richtige Video kommt").

The texts are the clips' titles, descriptions, search words (keys, tools/guide/tags.py) and feature names; the steps of the recorded
videos are not here (no videos in the test), so the search must find the right clip without them. Runs search.js in node."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import make_guide as mg  # noqa: E402

# (what is typed, language of the page, the clip that must be among the first three; several ids: one of them)
QUERIES = [
    ("Etagen umsortieren", "de", "ui-v2-house"), ("reorder floors", "en", "ui-v2-house"), ("alle Fenster gleich einstellen", "de", "ui-v2-tools"),
    ("copy settings to other windows", "en", "ui-v2-tools"), ("wo ist die Einstellung", "de", "ui-v2-tools"),
    ("neue Oberfläche einschalten", "de", "ui-v2"), ("Leiste einklappen", "de", "ui-v2"), ("zurück zur alten Ansicht", "de", "ui-v2"), ("new interface", "en", "ui-v2"),
    ("Beta Version", "de", "version"), ("beta paused", "en", "version"),
    ("Heizplan pausieren", "de", "heat-pause"), ("Heizung von Hand regeln", "de", "heat-pause"), ("override heating schedule", "en", "heat-pause"),
    ("nur ein Gebäude anzeigen", "de", "buildings-pages"), ("Seite für den Anbau", "de", "buildings-pages"),
    ("Bereich einem Gebäude zuordnen", "de", "building-areas"), ("Automationen vom anderen Haus", "de", "building-areas"), ("assign area to building", "en", "building-areas"),
    # other words for the same thing
    ("Rollo runter", "de", "shutter"), ("Jalousie schließen", "de", "shutter"), ("Rolladen", "de", "shutter"),
    ("Rollladen auf 50 Prozent", "de", "shutter"), ("shutter half open", "en", "shutter"),
    ("Markise", "de", "shutter"), ("roller blind", "en", "shutter"), ("Gardine", "de", "window-setup"),
    ("Lampe heller machen", "de", "light"), ("Licht dimmen", "de", "light"), ("Lampe Farbe ändern", "de", "light"),
    ("dim the lights", "en", "light"), ("Glühbirne", "de", "light"), ("Licht im Wohnzimmer dimmen", "de", "light"),
    ("alle Lichter aus", "de", "lightgroups"), ("brennt noch Licht", "de", "lightgroups"),
    ("Heizung wärmer stellen", "de", "heating climate"), ("Heizkörper", "de", "heating climate"),
    ("Nachtabsenkung", "de", "heatplan"), ("heating schedule", "en", "heatplan"),
    ("Heizplan Uhrzeit verschieben", "de", "heatplan"),
    ("Strom je Gebäude", "de", "energy-buildings"), ("Stromrechner für das Gartenhaus getrennt", "de", "energy-buildings"),
    ("power per building", "en", "energy-buildings"), ("Bereich aus Home Assistant als Raumname", "de", "room-area"),
    ("Raum einem Bereich zuordnen", "de", "room-area"), ("room name from Home Assistant area", "en", "room-area"),
    ("Raumtemperatur vom Thermostat statt Sensor", "de", "room-temp-source"), ("warum zeigt der Raum eine andere Temperatur", "de", "room-temp-source"),
    ("room temperature from the thermostat", "en", "room-temp-source"),
    ("Fenster auf Heizung aus", "de", "heatrules"), ("warum heizt es nicht", "de", "heatdiag"),
    ("Wand malen", "de", "walls"), ("Haus zeichnen", "de", "walls"), ("draw walls", "en", "walls"),
    ("Bauplan hochladen", "de", "background"), ("Foto vom Grundriss abzeichnen", "de", "background"),
    ("Tür einbauen", "de", "openings"), ("Terrassentür", "de", "openings"), ("Fenster gekippt", "de", "window-tilt"),
    ("Kippwinkel", "de", "window-tilt"), ("Fenster weiter kippen", "de", "window-tilt"), ("tilt angle", "en", "window-tilt"),
    ("Fenstergriff Sensor", "de", "window-tilt"), ("zweiflügeliges Fenster", "de", "window-setup"),
    ("bodentiefes Fenster", "de", "window-fixed"), ("Fenster unten fest oben kippen", "de", "window-fixed"), ("Oberlicht", "de", "window-fixed"),
    ("transom", "en", "window-fixed"), ("window fixed glazing below", "en", "window-fixed"),
    ("Fenster über der Tür", "de", "window-stacked"), ("zwei Fenster übereinander", "de", "window-stacked"), ("Fenster über Terrassentür mit eigenem Rollladen", "de", "window-stacked"),
    ("window above the door", "en", "window-stacked"), ("overlaps another opening on the same wall", "en", "window-stacked"), ("clerestory", "en", "window-stacked"),
    ("Sofa", "de", "library devices-place move"), ("Möbel einfügen", "de", "library"), ("add furniture", "en", "library"),
    ("Kleiderschrank Dachschräge", "de", "closet"), ("Wendeltreppe", "de", "stairs"), ("Treppe mit Kurve", "de", "stairs-winder stairs"), ("Geschosshöhe", "de", "stairs-storey"),
    ("Treppe hat zu viele Stufen", "de", "stairs-storey"), ("storey height", "en", "stairs-storey"), ("Etagenhöhe ändern", "de", "stairs-storey"),
    ("Garten anlegen", "de", "plot"), ("Pool", "de", "plot"), ("Hanglage", "de", "plot-terrain"),
    ("Grundstück am Hang", "de", "plot-terrain"), ("Keller halb aus der Erde", "de", "plot-terrain"),
    ("basement partially below ground", "en", "plot-terrain"), ("Keller hinzufügen", "de", "floors-add"), ("neues Stockwerk", "de", "floors-add"),
    ("Parkett", "de", "finishes"), ("Wandfarbe", "de", "finishes"), ("Satteldach", "de", "roof"), ("Dachgaube", "de", "roof dormer-pitch"),
    ("Winkelhaus Dach", "de", "roof-wing"), ("Carport", "de", "roof-gable"), ("Wandlänge messen", "de", "measure"),
    ("Dachfenster", "de", "skylight"), ("Velux", "de", "skylight"), ("Dachfenster ohne Gaube", "de", "skylight"),
    ("Balkon", "de", "balcony"), ("Balkongeländer aus Glas", "de", "balcony"), ("wie mache ich einen Balkon", "de", "balcony"),
    ("Balkon mit Stützen", "de", "balcony"), ("add a balcony", "en", "balcony"), ("glass railing", "en", "balcony"),
    ("Fenster in der Dachschräge", "de", "skylight"), ("skylight", "en", "skylight"), ("roof window", "en", "skylight"),
    ("rückgängig", "de", "move"), ("löschen", "de", "move"), ("Ferienwohnung", "de", "houses"), ("ChatGPT", "de", "import"),
    ("Haus mit KI bauen", "de", "import"), ("Symbolleiste", "de", "toolbar"),
    ("Filmabend", "de", "scenes"), ("Szene erstellen", "de", "sceneedit"), ("Lieblingsgeräte", "de", "tiles"),
    ("Batterie leer", "de", "devices"), ("Sensor offline", "de", "devices"), ("welche Fenster sind offen", "de", "open voice"),
    ("Alarmanlage scharf schalten", "de", "alarm"), ("Einbrecher", "de", "alarm security"), ("was war gestern los", "de", "security log"),
    ("Alexa", "de", "voice"), ("Rauchmelder", "de", "warnings notify"), ("Wasserschaden", "de", "warnings"),
    ("LED Streifen", "de", "ledring"), ("Nanoleaf", "de", "effects"), ("Gegensprechanlage", "de", "doorbell"),
    ("welche Automation schaltet die Lampe", "de", "usedby"), ("Müllabfuhr", "de", "today"), ("garbage", "en", "today"),
    ("Stromkosten", "de", "energy"), ("Photovoltaik", "de", "energy power"), ("Schimmel", "de", "colors"),
    ("Luftfeuchtigkeit", "de", "colors climate"), ("Überwachungskamera", "de", "cameras"), ("Spotify", "de", "media"),
    ("Radio hören", "de", "media"), ("Waschmaschine fertig", "de", "household"), ("Staubsauger", "de", "household"),
    ("vacuum robot", "en", "household"), ("Elektroauto", "de", "cars"), ("zweites Auto", "de", "cars"),
    ("Automation erstellen", "de", "flow"), ("wenn dann", "de", "flow"), ("wer ist zu Hause", "de", "family"),
    ("Notiz", "de", "family"), ("wer hat das Licht angemacht", "de", "log"), ("who turned on the light", "en", "log"),
    ("eigene Knöpfe", "de", "buttons"), ("Weihnachten", "de", "specialdays"), ("Feiertag", "de", "specialdays"),
    ("Widget", "de", "addcard"), ("Karte verstecken", "de", "arrange"), ("Reiter sortieren", "de", "tabs"),
    ("Kinder sollen eine andere Seite sehen", "de", "variants"), ("Dark Mode", "de", "language"), ("Sprache ändern", "de", "language"),
    ("Einstellung suchen", "de", "settings-search"), ("Benutzerrechte", "de", "users"), ("Datensicherung", "de", "backup"),
    ("Kioskmodus", "de", "fullscreen kiosk"), ("Bildschirmschoner", "de", "kiosk"), ("Push Nachricht", "de", "notify"),
    ("WhatsApp", "de", "notify"), ("Update", "de", "version"), ("Cache leeren", "de", "version"),
    ("iPhone", "de", "phone-house phone-pages phone-edit"), ("am Handy zeichnen", "de", "phone-edit"),
    ("Ansicht drehen", "de", "orbit"), ("rauszoomen", "de", "orbit"), ("Obergeschoss anzeigen", "de", "floors"),
    ("Draufsicht", "de", "views"), ("Wände durchsichtig", "de", "viewmenu"), ("Dach ausblenden", "de", "viewmenu"),
    ("Raum öffnen", "de", "room"), ("Stehlampe finden", "de", "search"), ("Stromfluss", "de", "power"),
    ("Sonnenuntergang", "de", "sky"), ("Mond", "de", "sky"),
    # the power bookkeeping, several houses, the Nanoleaf layout (the owner, 2026-11-03: "eine Anleitung für den Strom-Rechner …
    # wie man den benutzt und auch für mehrere Häuser und der Nanoleaf-Editor")
    ("Strom Rechner", "de", "energy-calc"), ("Stromrechner einrichten", "de", "energy-calc"),
    ("welcher Sensor ist das Netz", "de", "energy-calc"), ("Vorzeichen falsch", "de", "energy-calc"),
    ("Balkonkraftwerk Sensor", "de", "energy-calc"), ("Zwischenstecker Raum zuordnen", "de", "energy-calc"),
    ("power bookkeeping", "en", "energy-calc"), ("which sensor is the grid", "en", "energy-calc"),
    ("zwei Häuser Strom vergleichen", "de", "energy-houses"), ("Strompreis Ferienhaus", "de", "energy-houses"),
    ("Stromverbrauch mehrere Häuser", "de", "energy-houses"), ("compare houses", "en", "energy-houses"),
    ("Nanoleaf Form ändern", "de", "nanoleaf-edit"), ("Nanoleaf Dreiecke anordnen", "de", "nanoleaf-edit"),
    ("Nanoleaf Layout", "de", "nanoleaf-edit"), ("nanoleaf shape", "en", "nanoleaf-edit"),
    ("Nachbarhaus daneben stellen", "de", "houses"), ("Haus duplizieren", "de", "houses"),
    # other forms of a word
    ("Lampen", "de", "light lightgroups devices-place"), ("Treppen", "de", "stairs stairs-winder"), ("Rollläden", "de", "shutter"),
    ("Tuer", "de", "openings open doorbell"), ("Fenstern", "de", "openings open window-setup window-tilt"),
    # typing mistakes
    ("Jalosie", "de", "shutter"), ("Heizng", "de", "heating climate heatplan heatrules"), ("Wendeltrepe", "de", "stairs"),
    ("Thermostad", "de", "heating climate"), ("Waschmaschiene", "de", "household"), ("Terasse", "de", "plot"),
    ("doorbel", "en", "doorbell"), ("Rauchmelda", "de", "warnings notify"),
]


def run(items, syn, queries):
    js = """
const GS = require(process.argv[1]);
const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const idx = GS.index(d.items, d.syn);
const out = d.queries.map(([q, lang]) => { const r = GS.search(idx, q, lang); return { ids: r.list.concat(r.more).map((x) => x.id), fixed: r.fixed }; });
process.stdout.write(JSON.stringify(out));
"""
    p = subprocess.run(["node", "-e", js, str(mg.SEARCH)], input=json.dumps({"items": items, "syn": syn, "queries": queries}),
                       capture_output=True, text=True, check=True)
    return json.loads(p.stdout)


def items_of(clips):
    more = mg.search_meta(clips)
    return [{**c.meta(), **more[c.id], "steps": []} for c in clips.values()]


@pytest.mark.skipif(not shutil.which("node"), reason="needs node")
def test_people_find_the_right_video():
    clips = mg.load_clips()
    for q, _, want in QUERIES:
        assert all(w in clips for w in want.split()), (q, want)
    res = run(items_of(clips), mg.load_tags()[1], [[q, lang] for q, lang, _ in QUERIES])
    bad = [f"{q!r} ({lang}): wanted {want}, got {r['ids'][:5]}" for (q, lang, want), r in zip(QUERIES, res)
           if not set(want.split()) & set(r["ids"][:3])]
    assert not bad, "\n".join(bad)


@pytest.mark.skipif(not shutil.which("node"), reason="needs node")
def test_a_typing_mistake_says_what_was_searched():
    res = run(items_of(mg.load_clips()), mg.load_tags()[1], [["Heizng", "de"], ["Licht", "de"]])
    assert res[0]["fixed"] == {"heizng": "Heizung"} and res[1]["fixed"] == {}


def test_every_clip_has_many_search_words():
    """every clip has a line in tools/guide/tags.py with words in both languages (a new clip too), and none for a clip that is gone"""
    clips = mg.load_clips()
    tags, syn = mg.load_tags()
    assert set(tags) == set(clips), f"tools/guide/tags.py: missing {sorted(set(clips) - set(tags))}, unknown {sorted(set(tags) - set(clips))}"
    for cid, t in tags.items():
        assert len(t["de"].split()) >= 12 and len(t["en"].split()) >= 12, f"{cid}: at least 12 search words in each language"
    seen = {}
    for g in syn:
        assert len(g) >= 2, g
        for w in g:
            assert w == w.lower(), w
            assert w not in seen, f"{w!r} is in two groups of SYN: {seen.get(w)} and {g}"
            seen[w] = g
