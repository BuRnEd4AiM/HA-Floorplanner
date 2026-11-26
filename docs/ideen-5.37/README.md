# Ideen 5.37: die Seite ⚡ Energie fotorealistischer und moderner

Anlass: der Besitzer (2026-11-26): „Beispielbilder, wie man das Strom-Dashboard einfach fotorealistischer und moderner machen könnte, erst mal Beispielbilder“.
Nur fürs Foto in die echte Demo gemalt (`mockup.js`); die Zahlen sind die der Demo (Tag, Demo-Haus). Rot = heute, grün = neu.

| Bild | Für | Was |
| --- | --- | --- |
| 1 | heute | Die Seite ⚡ Energie heute am PC: flache Kacheln, Balken, Listen |
| 2 | Idee 1 | **Haus mit Stromfluss:** oben groß das eigene Haus aus der 3D-Ansicht, leuchtende Linien Sonne → Haus, Netz → Haus, Haus → Batterie; schwebende Glas-Schilder mit den Werten von jetzt; rechts „heute verbraucht“ groß mit Anteil Sonne/Netz |
| 3 | Idee 2 | **Glas-Look:** das Haus verschwommen als Hintergrund, Kacheln aus „Milchglas“, Ring für „selbst gemacht“, weiche Fläche statt Balken, Batterie als echte Batterie, Geräte mit Bildchen |
| 4 | heute | Dieselbe Seite heute am Handy |
| 5 | Idee 3 | Idee 1 am Handy: Haus mit Stromfluss oben, darunter „heute verbraucht“ |

Neu machen (Demo vorher bauen: `cd demo && npm ci && node build.mjs`, danach `git checkout demo/floorplan3d-demo.html`). `house.jpg` = Foto der Demo
„Ganzes Haus“ (1600 × 1000, Faktor 2, alle Bedienelemente versteckt, roter Kamera-Kegel ausgeblendet), ausgeschnitten (1080, 500, 2280, 1300):

    node docs/ideen-5.37/make_pictures.cjs <ordner>
    python3 docs/ideen-5.37/to_jpg.py <ordner> docs/ideen-5.37

## Teil 2: Design „Glas (Apple-Stil)“ für die ganze App

Seine Antwort (2026-11-26): „Nur Idee 2 (Bild 3)“, dazu eine Einstellung für die ganze App: „klassisch so wie jetzt“ und ein Design, „als wäre es
von Apple … die Hintergründe und so“, „auch unten die Leiste und alles drum und dran“. Nur fürs Foto in die echte Demo gemalt (`theme.js`):
das eigene Haus ganz verschwommen unter den Seiten (wie Bild 3, das ihm gefiel; `make_wall.py`), Karten, Leisten, Knöpfe und die Reiter unten aus Milchglas, runde Knöpfe, schwebende Leiste unten.

| Bild | Was |
| --- | --- |
| 6 | ⚙ Einstellungen → Allgemein → Design: neben Hologramm / Dunkel / Hell zwei neue: „🍏 Glas dunkel“ und „🍏 Glas hell“ (als Bildchen zum Antippen) |
| 7 | 🏠 Haus (3D) in Glas dunkel: Etagen links, Kacheln, Schilder, Szenen und die Leiste unten aus Glas |
| 8 | ☀ Heute in Glas dunkel |
| 9 | ⚡ Energie in Glas dunkel (Idee 2 aus Bild 3, jetzt mit Kopfleiste und Leiste unten im selben Stil) |
| 10 | ☀ Heute in Glas hell |
| 11 | Handy-App (Start) in Glas dunkel |
| 12 | Handy-App (Start) in Glas hell |
| 13 | ⚙ Einstellungen selbst als Glas-Fenster |
| 14 | Raumkarte (Wohnzimmer) als Glas-Fenster, dunkel |
| 15 | Raumkarte in Glas hell |

Zweite Runde (seine Rückmeldung): „Bild 7 … bei den Kacheln wo man scrollen kann“ sah man noch einen Kasten (auch links bei den Etagen und oben bei den
Schildern): das waren Schatten und Unschärfe der Kacheln, die der Browser in einer Leiste zum Schieben abschneidet; dort jetzt ohne Schatten und Unschärfe.
„Bild 3 gefällt mir, den Hintergrund“: das verschwommene Haus ist jetzt der Hintergrund der ganzen App.

    python3 docs/ideen-5.37/make_wall.py <ordner>
    node docs/ideen-5.37/make_theme.cjs <ordner>
    python3 docs/ideen-5.37/to_jpg.py <ordner> docs/ideen-5.37
