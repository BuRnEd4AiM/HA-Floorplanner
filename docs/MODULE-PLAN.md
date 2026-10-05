# Aufteilung des Codes: Stand und Plan

Stand: Version 3.42.0. Hintergrund: Issue #137. Die Hauptdatei `floorplan3d/rootfs/app/static/app.js` hatte am Anfang gut **5.100 Zeilen**, jetzt sind es noch etwa **2.420**. Das Ziel ist, sie in kleine Module mit klarer Schnittstelle und eigenen Unit-Tests zu zerlegen, damit neue Funktionen einfacher und sicherer dazukommen.

## Regel für alles Neue

1. **Neue Funktionen kommen in ein neues Modul** (eigene Datei in `static/`) **oder in ein passendes bestehendes Modul**. In `app.js` steht nur der „Klebstoff": ein Import, ein `init…({...})`-Aufruf und die Verdrahtung mit dem Rest.
2. Reine Rechen- und Geometrie-Teile (ohne three.js und ohne DOM) werden separat gehalten und mit einem **Node-Unit-Test** (`tests/<name>.test.mjs`) geprüft, so wie `kitchen.js` und `heatpanel.js`.
3. Pro neuem Modul: Schritt in `.github/workflows/ci.yml` ergänzen, `python3 tools/make_manifest.py` ausführen, Eintrag in `CHANGELOG.md` (beide Dateien gleich).
4. Wird `app.js` angefasst, um etwas Bestehendes zu ändern, wandert der berührte Abschnitt nach Möglichkeit gleich in ein Modul (Pfadfinder-Regel: den Platz sauberer verlassen, als man ihn vorgefunden hat).

## Schon getrennt

| Datei | Zeilen | Aufgabe |
| --- | ---: | --- |
| `walls.js` | 226 | Wandgeometrie mit Türen und Fenstern |
| `models.js` | 715 | Eingebaute 3D-Modelle (Möbel, Geräte, Küchenzeile, Strom), GLB laden |
| `plan2d.js` | 1.111 | 2D-Editor (SVG) |
| `i18n.js` und `lang/*.js` | 213 + je Sprache | Übersetzungen (7 Sprachen) |
| `stairs.js` | ~330 | Treppengeometrie (gerade, L, U, Wendel, Wandtreppe mit Podesten, mehrere Etagen) |
| `rooms.js` | 146 | Automatische Raumerkennung |
| `dormer.js` | 70 | Dachgauben |
| `ledring.js` | 195 | LED-Ring |
| `nanoleaf.js` | 179 | Nanoleaf-Formen und kleiner Editor |
| `autoplace.js` | 179 | Automatisches Platzieren der Entitäten eines Bereichs |
| `alerts.js` | 62 | Warnungen und Nachtabdunklung (Rechenteil) |
| `kitchen.js` | 63 | Küchenzeile: Geometrie aus Modulen (mit Breiten) |
| `heatpanel.js` | 74 | Heizungs-Panel (Schritt 1 von #137) |
| `compass.js` | ~40 | Kompass (Nadel zählt über 360° weiter), mit Unit-Tests |
| `alertsui.js` | ~75 | Warnungen: Banner, roter Raum, Sprung in den Raum (Schritt 3 von #137) |
| `search.js` | ~70 | „Wo ist …?“-Suche mit Ring (Schritt 3) |
| `kitchenui.js` | ~60 | Küchenzeile: Eigenschaften im Panel (Schritt 3) |
| `power.js` | ~250 | Strom: Kabel in 3D, Strom-Editor, Energie-Übersicht, Eigenschaften (Schritt 2 von #137) |
| `powerlogic.js` | ~100 | Strom: Rechenteil (Watt, Kabelarten, Übersicht, Batterie), mit Unit-Tests |
| `toolbar.js` | 88 | Anpassbare Werkzeugleiste |
| `backups.js` | 70 | Automatische Sicherung (Oberfläche) |
| `version.js` | 122 | Versionsanzeige und Datei-Prüfung |
| `welcome.js` | 21 | Willkommenskarte |
| `import.js` | 112 | Import-Dialog |
| `moreinfo.js` | 27 | Home-Assistant-Dialog |
| `offline.js` | ~100 | Offline-Liste |
| `kiosk.js` | ~70 | Wandtablet (Bildschirmschoner, Nacht) |
| `badges.js` | ~50 | Wertplaketten entzerren |
| `roomlight.js` | ~95 | Raumlicht-Shader (Lichtflecken, Wandschein), Farbskalen |
| `earth.js` | ~150 | Erde, Rasen, Grundstücksform, Schnitt durch den Boden |
| `badgetext.js` | ~35 | Texte der Wert-Anzeigen über den Geräten (Sensoren, Zähler, Licht, Rollo …), mit Unit-Tests |
| `solarroof.js` | ~80 | Solarpanels auf dem Dach (#176): Dachfläche an einer Stelle (Höhe, Neigung), Kippung des Panels, Panel-Feld (reine Rechnung, Unit-Tests) |
| `floorpanel.js` | ~185 | Etagen-Verwaltung: Name, Art, Reihenfolge, Keller/Dach, Dach mit Gauben und weiteren Dächern |
| `settings.js` | ~165 | Einstellungen: Formular, Laden (mit Wiederholung), Speichern (ETag), Benutzer-Dialog |
| `openings.js` | ~110 | Türen, Tore, Fenster mit Kontakt: offen/zu, Liste „n offen", Bewegung der Flügel |
| `cutaway.js` | ~90 | Wände zur Kamera hin absenken oder durchsichtig machen |
| `props.js` | ~260 | Eigenschaften-Panel (Wand, Raum, Block, Bodenöffnung, Tür/Fenster, Gerät, LED-Ring) |
| `objlist.js` | ~100 | Objektliste der Etage (nach Raum gruppiert) |
| `roomentities.js` | ~110 | Entitäten des gewählten Raums (Bearbeiten), automatisch platzieren |
| `propfields.js` | ~30 | Eingabefelder der Seitenleiste (Länge in m/ft) |
| `entitypicker.js` | ~95 | Entitäten-Auswahl mit Suche, nach Bereich gruppiert |
| `livecontrols.js` | ~190 | Live-Steuerung: Schalten, Licht (Helligkeit, Farbe, Effekte), Szenen, ganzer Raum |
| `livepopup.js` | ~110 | Live-Karte beim Antippen (Gerät, Tür/Fenster, LED-Ring) |
| `roompanel.js` | ~190 | Raum-Panel mit Heizungs-Panel |
| `stairtool.js` | ~175 | Treppen-Werkzeug (Platzieren, Treppenhaus, Wandtreppe zeichnen, Eigenschaften, 3D-Treppe) |
| `blocks.js` | ~80 | Platzhalter-Blöcke, Bodenöffnungen, Grundstück, Boden mit Aussparungen |
| `palettes.js` | ~105 | Paletten (Geräte, eigene Modelle, Suche) |
| `background.js` | ~120 | Hintergrundbild (Vorlage zum Nachzeichnen, Eichen) |
| `settingsui.js` | ~115 | Einstellungen: Tablet-Zuordnung und Farbskalen |
| `houses.js` | ~95 | Häuser (Liste, Auswahl, Neu/Kopieren/Umbenennen/Löschen) |
| `floorrail.js` | ~115 | Etagen-Leiste (Vorschaubilder) |
| `floorcards.js` | ~110 | Etagenkarten (Ganzes Haus) |
| `cameras.js` | ~190 | Kameras (Sichtkegel, Übersicht, Standbilder) |

## Noch in `app.js` (Reihenfolge = Empfehlung)

Die Zeilen sind ungefähre Größen. „Risiko“ sagt, wie eng der Abschnitt mit dem Rest verwoben ist.

| Nr. | Abschnitt | Zeilen | Vorschlag für das Modul | Risiko |
| ---: | --- | ---: | --- | --- |
| 20 | **Zeichnen, Auswählen, Zeigerereignisse** (Fangen, Ziehen, Werkzeuge) | ~475 | `pointer.js`, `tools.js` | hoch |
| 21 | **3D-Aufbau**: Dächer und Geländer (~140), Hologramm-Darstellung (~60), `build` selbst (~210) | ~410 | `roofs.js`, `scene.js` | hoch |
| 22 | **Zustand, Rückgängig, Speichern, Datenladen, Live-Kanal** | ~80 + ~25 + ~150 | `state.js`, `data.js` | hoch |
| 23 | **Etagen und Räume wechseln, Navigation, Bewegen mit Wandstopp** | ~200 | `nav.js`, `collide.js` | mittel |

## Vorgehen je Schritt

1. Abschnitt auswählen, nach Möglichkeit den Rechenteil von der Oberfläche trennen.
2. Neues Modul mit `init…({ t, states, … })`-Schnittstelle, ohne globale Zustände, die nur `app.js` kennt.
3. Unit-Test für den reinen Teil schreiben, Browser-Tests (`tests/e2e`) bleiben unverändert und müssen grün bleiben.
4. Ein Schritt = ein Pull Request, Verhalten darf sich nicht ändern.

## Stolperfallen (aus Erfahrung)

- `node --check app.js` prüft eine `.js`-Datei ohne `"type": "module"` **nicht** wirklich auf Syntaxfehler: immer eine Kopie als `.mjs` prüfen (`cp app.js /tmp/a.mjs && node --check /tmp/a.mjs`), und die Browser-Tests laufen lassen.
- `let`/`const` weiter unten in `app.js` sind beim Aufruf noch nicht gesetzt („Cannot access … before initialization“): `init…` dort aufrufen, wo alles Nötige schon steht, oder Funktionen übergeben statt Werte.
- Während eines Browser-Testlaufs keine ausgelieferten Dateien ändern.
- Nach jeder Änderung in `floorplan3d/` `python3 tools/make_manifest.py` ausführen.
