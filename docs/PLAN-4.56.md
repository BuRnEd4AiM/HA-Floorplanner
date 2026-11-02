# Plan 4.56: Gelände am Hang (#629)

**Stand: Vorschlag, noch nicht gebaut** (2026-11-02, Branch `claude/laughing-johnson-ywzr01`). Beispielbilder: `docs/ideen-4.56/` (`make_pictures.py`, `mockup.js`). Wartet auf die Wahl des Besitzers.

## Der Wunsch (#629 von christinloehner, gekürzt)

> Mein Grundstück ist sehr schräg … Auf der zur Straße zeigenden Seite ist das Garagentor im Keller, der Keller ist dort ebenerdig, der Balkon im Erdgeschoss ist auf der Straßenseite erst bei 2,50 m Höhe. Auf der anderen Seite ist die Haustür im Erdgeschoss. Das Gelände neigt sich um ein ganzes Stockwerk, ebenso der Weg zur Straße und die Blumenbeete. Aktuell ist der Balkon ebenerdig und das Garagentor unerreichbar unter der Erde.

## Heute

- Der Rasen ist überall flach auf Höhe 0 = Boden des Erdgeschosses (`earth.js`: Rasen `ShapeGeometry`, Erde als `ExtrudeGeometry` um den Keller, `-0.02` bis `-depth`). Der Keller ist ganz in der Erde.
- Flächen (`yard3d.js`) liegen flach auf `y`; Plateaus (`levels.js`, `plateau3d.js`, #566) heben nur nach oben (`rise` 0,01 bis 5 m) und sind eben.
- `lifter(f, areas).ground(x, z)` hebt alles auf einem Plateau, auch Räume und Wände: das Gelände darf das **nicht** (das Haus steht fest, nur der Boden um es herum ändert sich).

## Vorschlag

**Daten:** `layout.plot.terrain = { points: [{ id, x, z, h }], contours: 0.5 }`; `h` in m über dem Boden des Erdgeschosses (dieselbe 0 wie heute der Rasen). Ohne Punkte ist alles wie heute.

**Höhe an einem Ort (rein, `terrain.js`, Unit-Test `tests/terrain.test.mjs`):**
- 0 Punkte: 0. 1 Punkt: überall seine Höhe.
- 2 Punkte: ein gleichmäßiger Hang zwischen ihnen (quer dazu gleich hoch), davor und dahinter eben (so sieht ein Hanggrundstück meist aus: oben Garten, unten Straße).
- 3 und mehr: Dreiecke zwischen den Punkten (Delaunay), linear darin; außerhalb die Höhe des nächsten Randpunkts.
- Dazu: ein Gitter für den Rasen (Zellen etwa 0,5 m, am Rand des Grundstücks, um das Haus und die Plateaus geschnitten), Höhenlinien für den 2D-Plan, `terrainAt(x, z)`.

**3D:**
1. `earth.js`: Rasen als Gitter auf dem Gelände (beleuchtetes Material, sonst sieht man die Neigung nicht), die Erde vom Gelände bis unter den Keller; wo der Boden tiefer als 0 liegt, steht der Keller frei (Garagentor, Kellertür, Fenster). Der Schnitt im „Ganzes Haus“ folgt dem Gelände (`capGeometry` mit Oberkante je Stück).
2. Ein Teil des Erdgeschosses ohne Keller darunter (Garage, Anbau) bekommt einen **Sockel** bis zum Boden.
3. `yard3d.js`: Wege, Beete, Einfahrt liegen auf dem Gelände (dasselbe Gitter, auf die Fläche geschnitten).
4. Gartendinge stehen auf dem Gelände: in `lifter` ein eigenes `terrain(x, z)`, nur für Geräte außerhalb der Räume, die am Boden stehen (Garten-Typen aus `OUTDOOR`/`YARD`, sonst ab 0,5 m Abstand vom Haus und niedriger als 0,5 m). Lampen an der Fassade bleiben, wo sie sind.
5. Plateau am Hang = **ebene Fläche** (Terrasse, Einfahrt vor der Kellergarage): oben eben auf seiner Höhe (dann auch unter 0 erlaubt), die Mauer vom Gelände bis oben, bergseitig hält sie den Hang; der Rasen hat dort ein Loch. Die Böschung (`edge: 'slope'`) läuft bis zum Gelände.

**2D und Bedienung:** im Werkzeug „Grundstück“ ein Abschnitt „⛰ Gelände“: „＋ Höhenpunkt“ (antippen, Höhe eintragen, ziehen), Höhenlinien alle 0,5 m (an/aus), ein Knopf „Hang in einem Schritt“ (zwei Punkte: hinten 0, vorne ein Geschoss tiefer). Neues Modul `terrainui.js`, `plan2d.js` zeichnet Punkte und Linien.

**Was sonst dazugehört:** Demo (ein Beispiel-Hang abschaltbar oder ein zweites Demo-Haus?), Browser-Test (neuer Teil `tests/e2e/parts/`), Video (`tools/guide/clips_*.py`, Zeile in `features.py`), Testprotokoll, CHANGELOG de/en, Zeitstrahl-Bild. Kein Server-Teil (Docker unberührt), der JSON-Import kennt `plot.terrain` nicht (später).

**Später (nicht im ersten Schritt):** eine Außentreppe vom Erdgeschoss den Hang hinunter, Stufen im Weg, eine Rampe; das Nachbarhaus am Hang; Höhenlinien auch in 3D.

## Offene Fragen

- An den Besitzer: so bauen (Höhenpunkte) oder nur „ein gleichmäßiger Hang“? Antwort an christinloehner im Issue posten?
- An christinloehner: wie viele Meter es ungefähr fällt und in welche Richtung; gleichmäßig oder in Stufen (Mauern)? Ist der Balkon im Plan des Erdgeschosses gezeichnet? Hat der Weg Stufen?
