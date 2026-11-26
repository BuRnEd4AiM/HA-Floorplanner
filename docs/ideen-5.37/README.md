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
