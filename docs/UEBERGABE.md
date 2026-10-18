# Übergabe: so geht es in einem neuen Chat weiter

Stand: 2026-10-18, Version **3.99.2**. Diese Datei ist für den nächsten Chat (auch auf einem anderen Zugang) geschrieben: erst diese Datei lesen, dann `.claude/CLAUDE.md`, dann bei den **Entscheidungen des Besitzers** unten weitermachen.

## Der Besitzer

- Kein Entwickler: einfach und auf Deutsch erklären, kurze Sätze, keine Fachwörter.
- Er testet in der **Demo** (https://burned4aim.github.io/HA-Floorplanner/) und schickt Ergebnisse als Nummern aus `docs/TESTPROTOKOLL.md`, z. B. „65.1 bis 65.8 geht“. Eintragen: nur die Ergebnis-Zellen ändern (`✅ (Datum)`), dann `python3 tools/testprotokoll.py`, die „Kurze Prüfliste“ oben und „Ältere offene Punkte“ nachziehen (siehe `.claude/CLAUDE.md`).
- Er mag **Beispielbilder vor dem Bauen**: Ideen erst als Bild zeigen (die Demo mit eingespieltem Skript fotografieren, siehe unten), dann bauen, was er auswählt.
- Zu jedem Pull Request erklären, wie er mergt (Link öffnen, „Merge pull request“, „Confirm merge“). Er hat Claude schon mehrmals gebeten, selbst zu mergen, sobald alles grün ist („mache den merge wenn er bereit ist“, „gerne“). Das gilt pro Pull Request: kurz fragen, wenn er es nicht schon gesagt hat.
- Er hat die Reihenfolge seiner Werkzeugleiste früher selbst angepasst („Gerät“ steht bei ihm vorne). Das ist kein Fehler; ✎ → „Zurücksetzen“ stellt die normale Reihenfolge her (schon gesagt).

## Was fertig ist

| Version | Pull Request | Inhalt |
|---|---|---|
| 3.98.0 | #423 (gemergt) | Himmel nach Uhrzeit (#418), Wetter im Bild und Regen-Warnung pro Fenster (#419), Strom als Bild (#420), Raum-Kacheln (#421), Werkzeugleiste mit Symbolen und Gruppen (#422). Plan und Entscheidungen: `docs/PLAN-3.98.md`, Beispielbilder: `docs/ideen-3.98/` |
| 3.98.1 | #424 (gemergt) | „Strom als Bild“ auch im Bearbeiten-Modus statt der kleinen Zahlenzeile (Wunsch des Besitzers) |
| 3.98.2 | #426 (gemergt) | Batterie im Strom-Bild: „ruht · 0 W“, wenn sie weder lädt noch entlädt, „kein Leistungs-Sensor“, wenn ihre Leistung unbekannt ist (Wunsch des Besitzers nach seinem Nachtbild: 9 %, alles kam aus dem Netz). Testprotokoll 65.17 (nur im Add-on) |

| 3.99.0 | #431 (gemergt) | Zweite Runde Aussehen, vom Besitzer ausgewählt: echte Böden pro Raum (#427, `floorcover.js`, `floortex.js`), Fensterrahmen weiß / anthrazit (#428, `facade.js`), Glas-Optik für Etagen-Karten und Knöpfe (#429, nur CSS), Raum-Schilder im 3D-Bild (#430, `roomlabels.js`): auf Wunsch des Besitzers **entweder Raum-Schilder oder Geräte** (Schalter „Im Bild: Raum-Schilder / Geräte“ in „Ansicht“, Normalfall Raum-Schilder; ein Schild antippen öffnet den Raum mit seinen Geräten). Die älteren Browser-Test-Teile laufen mit „Geräte“ (`base.py`), `26_look` prüft die Schilder. Browser-Test-Teil `26_look`. Die Demo hat Böden und anthrazitfarbene Rahmen eingestellt |
| 3.99.1 | #432 (gemergt) | Nach Bildern des Besitzers: Raum-Schilder, die von der Seite übereinander lagen, rücken auseinander (`stackLabels` in `roomtiles.js`); die Zähler (Wasser, Gas, Wärme) stehen in der Karte „Strom jetzt“ statt oben links (`meterChips` in `energyflow.js`). Testprotokoll 66.12, 66.13 |
| 3.99.2 | Branch `claude/bold-cannon-9w2m0w` | Nach einem Test des Besitzers mit dem Musterhaus: die Raum-Kacheln, die nicht alle hinpassen, bekommen Pfeile, einen weichen Rand und Mausrad-Scrollen (`stripEnds` in `roomtiles.js`); die Etagen-Karten weichen der Karte „Strom jetzt“ aus. Testprotokoll 66.14, 66.15 |

Testprotokoll: Abschnitte **65** (65.1 bis 65.17) und **66** (66.1 bis 66.15) sind neu und noch ❓; der Besitzer prüft sie in der Demo. 65.14, 65.15, 65.17 und 66.11 gehen nur im Add-on.

## Entscheidungen des Besitzers (2026-10-17) und was als Nächstes kommt

- **Mergen:** Claude darf die Pull Requests dieser Sitzung selbst mergen, sobald alles grün ist (Methode „merge“).
- **Batterie-Text:** ja, so gebaut (3.98.2, siehe oben).
- **Zweite Runde Ideen fürs Aussehen** (Bilder in `docs/ideen-3.99/`), ausgewählt und gebaut in **3.99.0** (siehe oben):
  1. **Echte Böden** (`1-boeden.jpg`): Parkett, Fliesen, Beton je Raum, pro Raum wählbar.
  2. **Dunkle Fensterrahmen, hellere Wände** (`2-fassade.jpg`).
  3. **Glas-Optik** für die Etagen-Karten links und die Knöpfe (`4-glas.jpg`), passend zu den Karten aus 3.98.
  4. **Raum-Schilder im 3D-Bild** (`5-raumschilder.jpg`): Name, Temperatur, Lichter, grüner Punkt bei Anwesenheit. Wunsch: **muss abschaltbar sein**.
  - Nicht gewählt: **Rasen mit Mähstreifen** (`3-garten.jpg`).
- Außerdem offen: Testprotokoll Abschnitt 65 in der Demo prüfen.

### Technische Notizen zu den Ideen (Runde 2)

- **Böden:** Der Boden eines Raums ist ein Mesh mit `userData.kind === 'room'` (gebaut in `floorbuild.js`, Farbe `room.color`, `MeshStandardMaterial`). Darüber liegen flache Licht-Ebenen (`ShaderMaterial`, Raumlicht aus `roomlight.js`), die eine Textur verdecken würden: die Textur muss in diese Darstellung mit hinein (oder die Licht-Ebene wird durchsichtiger). Die UV-Koordinaten der Grundfläche sind Meter (ShapeGeometry), also Textur-Wiederholung pro Meter. Neues Feld am Raum (z. B. `floor: 'parquet' | 'tiles' | 'concrete' | …`), Auswahl in den Eigenschaften, Import/Export/Schema (`importer.py`, `property.schema.json`) wie bei `rainWarn`. Texturen im Browser gezeichnet (Canvas, wie `soilTexture` in `earth.js`), keine Bilddateien. Im Sparmodus („Schnell“) einfarbig lassen (#138).
- **Fensterrahmen:** `walls.js` Zeile ~227 `frame: makeMat('#f4f4f4', …)`; Wände `floorbuild.js` `'#d9d4cc'`. Am besten eine Einstellung „Farbe der Fensterrahmen“ (weiß / anthrazit).
- **Rasen** (nicht gewählt): `earth.js`, `lawnMat` (`MeshBasicMaterial`, `0x6fa858`); Streifen-Textur per Canvas; die Himmel-Tönung (`setTint`) multipliziert die Farbe weiter, also Farbe weiß lassen und die Tönung über `color` wirken lassen.
- **Glas:** nur CSS; die Klasse `.glass` und die Werte gibt es seit 3.98 in `style.css` (Abschnitt „Sky and weather“). Im Sparmodus ohne `backdrop-filter` (`body.low`).
- **Raum-Schilder:** die Daten liefert schon `roomSummary` in `roomtiles.js`. Darstellung als Sprite in 3D (wie `labels.js`) oder als HTML über dem Bild (Raummitte jedes Bild projizieren). Die heutigen Raumnamen auf dem Boden dann weglassen.

## Beispielbilder machen (so entstanden alle Bilder in `docs/ideen-3.98/` und `docs/ideen-3.99/`)

1. Demo lokal bauen: `cd demo && npm ci && node build.mjs` (schreibt `demo/floorplan3d-demo.html`; diese Datei **nicht** committen, nach dem Merge baut sie die CI selbst: „Rebuild demo [skip ci]“; vor dem Commit `git checkout demo/floorplan3d-demo.html`).
2. Playwright: `pip install playwright==1.56.0` (passt zum vorinstallierten Chromium 1194; neuere Versionen finden den Browser nicht). In eigenen Skripten `executable_path="/opt/pw-browsers/chromium"`, `args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]`, `locale="de-DE"`, `timezone_id="Europe/Berlin"`.
3. Demo mit `?debug=1` öffnen: `window.__fp` hat u. a. `scene`, `renderer`, `camAt(x, y, z, tx, tz)`, `layout`, `states()`, `select(kind, id)`, `switchFloor(i)`, `alerts()`, `powerInfo()`, `frame()`. Dazu `?skytime=21:30` (Uhrzeit des Himmels) und `?weather=rainy` (Wetter der Demo).
4. Ein Skript in die Seite spielen, das die Idee nur für das Foto malt (`docs/ideen-3.99/mockup2.js`, `docs/ideen-3.98/mockup.js`), dann `page.screenshot`. Beispiel: `python3 docs/ideen-3.99/make_pictures.py /tmp/bilder 1-boeden`.
5. Die Bilder als JPG (Qualität 80) in `docs/ideen-<version>/` legen und dem Besitzer schicken.

## Stolperfallen (aus dieser Sitzung)

- `body` trägt `data-tool` (das gewählte Werkzeug): ein Selektor wie `[data-tool=wall] svg` trifft auch den `body`. Immer auf `#tools` einschränken.
- Browser-Test: `parts/base.py` hinterlässt das Design „holo“, evtl. englische Sprache und imperiale Einheiten. Ein Teil, der Texte oder Temperaturen prüft, setzt `language`, `units`, `theme` selbst und stellt sie am Ende zurück (Vorbild `tests/e2e/parts/25_sky_tiles.py`). Die Seite öffnet nicht unbedingt Etage 0: `window.__fp.switchFloor(0)`.
- Lokal nur die betroffenen Teile laufen lassen: `tests/e2e/run.sh 05_power 25_sky_tiles` (Basis-Haus + Teile, ein paar Minuten). Die CI startet bei jedem Push alle Teile neu; ein roter Lauf zu einem älteren Commit ist nach einem neueren Push egal.
- Neue Texte: `python3 tools/add_i18n.py texts.json` (alle 7 Sprachen auf einmal), danach `python3 -m pytest -q tests/test_i18n.py`.
- Neues reines Modul mit Test: in `.github/workflows/ci.yml` in die lange Zeile `for t in … toolicons; do` eintragen.
- Nach jeder Änderung in `floorplan3d/`: `python3 tools/make_manifest.py` (sonst schlägt `tests/test_manifest.py` fehl); danach `graphify update .`.
- Ist der Pull Request des Branches gemergt: den Branch neu von `main` starten (`git fetch origin main && git checkout -B <branch> origin/main`) und einen **neuen** Pull Request aufmachen.
