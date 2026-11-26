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

Dritte Runde (seine Rückmeldung zu Bild 7 und 15): Szenen-Kacheln und Raum-Kacheln weniger durchsichtig, Schrift darin voll lesbar; die Schilder über
den Zimmern mit mehr Kontrast; Suche, Mikrofon und Kompass zusammen in einem Glas-Kästchen unten links; die Etagen-Namen ohne den schwarzen,
verschwommenen Schatten (Glas hell).

## Teil 3: die Leisten unten schweben (nach 5.37.0)

Seine Rückmeldung (2026-11-26, Bild vom Haus in Glas): der Streifen unten (Szenen und Reiter) „verkleinert komplett das Bild … macht den
Bildschirm noch kleiner“; besser „dass dieser Balken sich als Hintergrund an die Icons schmiegt, so dass ein kleiner Überstand ist und die nur
so groß ist, wie es gebraucht wird, und leicht durchsichtig“. Nur fürs Foto in die Demo 5.37.0 gemalt (`make_dock.cjs`).

| Bild | Was |
| --- | --- |
| 16 | Heute (5.37.0, Glas dunkel): unter dem 3D-Bild ein dunkler Streifen über die ganze Breite für Szenen und Reiter |
| 17 | Neu: das 3D-Bild läuft bis ganz nach unten; Szenen und Reiter je eine leicht durchsichtige Kapsel, nur so breit wie die Knöpfe, mit kleinem Rand |
| 18 | Dasselbe in Glas hell |
| 19 | Am Tablet. Dabei gesehen (auch im normalen Design „Dunkel“): am Tablet liegen die Raumkacheln über „Normal / Temp. / Feuchte …“ |

    node docs/ideen-5.37/make_dock.cjs <ordner>
    python3 docs/ideen-5.37/to_jpg.py <ordner> docs/ideen-5.37

Seine Antwort zu Bild 17–19: „Szenen und Reiter in eine Kapsel“.

| Bild | Was |
| --- | --- |
| 20 | Eine einzige schwebende Kapsel um Szenen und Reiter, nur so breit wie die längere der beiden Reihen, leicht durchsichtig; das 3D-Bild läuft darunter bis ganz unten |
| 21 | Dasselbe in Glas hell |
| 22 | Am Tablet (Kacheln über „Normal / Temp.“: der Fehler von Bild 19, wird beim Bauen repariert) |
