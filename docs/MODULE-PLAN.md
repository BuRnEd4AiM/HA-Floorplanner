# Aufteilung des Codes: Stand und Plan

Stand: Version 3.56.1. Hintergrund: Issue #137 (geschlossen; die Aufteilung geht nach der Regel unten Schritt für Schritt weiter). Die Hauptdatei `floorplan3d/rootfs/app/static/app.js` hatte am Anfang gut **5.100 Zeilen**, jetzt sind es noch etwa **1.500**. Das Ziel ist, sie in kleine Module mit klarer Schnittstelle und eigenen Unit-Tests zu zerlegen, damit neue Funktionen einfacher und sicherer dazukommen.

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
| `stairs.js` | ~410 | Treppengeometrie (gerade, L, U, Wendel, Wandtreppe mit Podesten, mehrere Etagen; `splitStoreys`: Teil über der offenen Etage, #246) |
| `rooms.js` | 146 | Automatische Raumerkennung |
| `dormer.js` | ~80 | Dachgauben (Geometrie, Größe des Fensters) |
| `dormerwin.js` | ~110 | Fenster der Dachgauben als echte Fenster (Kontakt, offen/zu, Raum, Liste): nie gespeicherte Wand pro Gaubenfenster an der richtigen Etage, in der Wand des Raums darunter, wenn eine direkt hinter der Gaube steht (#275), „Vorderseite auf die Wand“; `openingWalls(f)` für alles, was Türen/Fenster sucht; reine Logik mit Unit-Tests |
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
| `bridge.js` | ~35 | Metallbrücke / Übergang (#189): Lauffläche, Träger, Geländer (reine Geometrie, Unit-Tests) |
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
| `sheetview.js` | ~45 | Handy: Raum über der Raum-Karte zeigen statt dahinter, Kamera-Abstand bei schmalem Bild (Unit-Tests) |
| `phonemenu.js` | ~25 | Handy: obere Leiste als ☰-Menü (Live-Ansicht) |
| `stairtool.js` | ~175 | Treppen-Werkzeug (Platzieren, Treppenhaus, Wandtreppe zeichnen, Eigenschaften, 3D-Treppe) |
| `blocks.js` | ~80 | Platzhalter-Blöcke, Bodenöffnungen, Grundstück, Boden mit Aussparungen |
| `palettes.js` | ~105 | Paletten (Geräte, eigene Modelle, Suche) |
| `background.js` | ~120 | Hintergrundbild (Vorlage zum Nachzeichnen, Eichen) |
| `settingsui.js` | ~115 | Einstellungen: Tablet-Zuordnung und Farbskalen |
| `houses.js` | ~95 | Häuser (Liste, Auswahl, Neu/Kopieren/Umbenennen/Löschen) |
| `floorrail.js` | ~115 | Etagen-Leiste (Vorschaubilder) |
| `floorcards.js` | ~110 | Etagenkarten (Ganzes Haus) |
| `cameras.js` | ~190 | Kameras (Sichtkegel, Übersicht, Standbilder) |
| `neighbor.js` | ~120 | Nachbarhaus (#220): anderes Haus daneben zeigen (3D und Umriss im Plan), Einstellungen; Geometrie mit Unit-Tests |
| `multisel.js` | ~90 | Mehrfachauswahl (#211, #247): Shift / Strg + Klick, Rahmen aufziehen im 2D-Plan (`boxItems`), alle löschen in einem Schritt, Rahmen in 3D, Kasten im Panel |
| `tapballs.js` | ~85 | Kugeln zum Antippen im Live-Modus (#238): Lage über/unter dem Gerät, Farbe nach Zustand; reine Regeln mit Unit-Tests |
| `entitystate.js` | ~25 | Was von einer Entität gemerkt wird, Farbe eines Lichteffekts (Schritt 23); reine Logik mit Unit-Tests |
| `layoutnorm.js` | ~25 | Geladenen Plan vervollständigen, „Erdgeschoss“ in der Sprache des Nutzers (Schritt 23); reine Logik mit Unit-Tests |
| `roomclip.js` | ~45 | Raum freistellen: Punkt im Raum, Wand auf den Raum zuschneiden, Punkt-im-Polygon (Schritt 24); reine Geometrie mit Unit-Tests |
| `modelfx.js` | ~70 | Trefferboxen eines Modells, Hologramm-Darstellung, Flaches unter den Böden (Schritt 24) |
| `labels.js` | ~50 | Text im 3D-Bild: Raumname, Wert-Pille am Gerät, leuchtendes Strom-Schild (Schritt 24) |
| `pickrules.js` | ~50 | Was ein Tipp im Live-Modus treffen darf (#234): keine Türen/Fenster, kein Kamera-Kegel, keine Anwesenheit; Geräte mit Kugel nur über die Kugel (#262); welcher von mehreren Treffern gewinnt; reine Logik mit Unit-Tests |
| `viewprefs.js` | ~75 | Voreinstellungen pro Benutzer/Tablet (#250: starten, nie als allgemeine Einstellung speichern) und Schilder der Etagen darunter (#249); reine Logik mit Unit-Tests |
| `livechannel.js` | ~75 | Live-Kanal (Schritt 22, Teil 1): vom Add-on geschobene Zustände, Abfrage alle 4 s solange er fehlt, sonst einmal pro Minute; Zusammenführen und Fingerabdruck mit Unit-Tests |
| `persist.js` | ~40 | Rückgängig (letzte 60 Stände) und automatisches Speichern des offenen Hauses (Schritt 22, Teil 2); Rückgängig-Liste mit Unit-Tests |
| `floorbuild.js` | ~210 | 3D-Aufbau einer Etage (Schritt 21): Raumböden mit Lichtschichten, Warn-Puls und Namen, Ränder der Bodenöffnungen, Platzhalter-Blöcke, Treppen, Wände mit Türen/Fenstern, Geräte mit Tipp-Kugeln, Kamera-Kegeln und Werte-Schildern; Raumname und Werte-Schild-Regel mit Unit-Tests |
| `edititems.js` | ~130 | Löschen, Pfeiltasten (Wände nehmen die Ecken mit), Q / E drehen, Tastenkürzel (Schritt 20, Teil 1); Tastenregeln und Listenänderungen mit Unit-Tests |
| `picking.js` | ~55 | Treffer im 3D-Bild (Schritt 20, Teil 2): Strahl vom Zeiger, Punkt auf dem Boden, was ein Klick trifft; die Regeln (wer gewinnt, was im Live antippbar ist) in `pickrules.js` mit Unit-Tests |
| `picture.js` | ~40 | Bild an der Wand (Schritt 20, Teil 3): Rahmen, Bild, Hochladen; Bildgröße mit Unit-Test |
| `draw3d.js` | ~210 | Zeichnen und Ziehen im 3D-Bild (Schritt 20, Teil 4): Auswählen, Geräte und Türen/Fenster ziehen, Wände und Räume zeichnen, Öffnungen und Geräte setzen, Kabel/Löschen, Doppelklick; Lage einer Öffnung mit Unit-Tests |
| `appstate.js` | ~45 | Startzustand (Schritt 22): Standard-Einstellungen, wie ein Bildschirm startet (Wand-Tablet, Raum-Tablet, nur lesen, Live), Längen in m / ft; alles mit Unit-Tests (auch: jede Einstellung kennt das Add-on) |
| `frameloop.js` | ~20 | Wie oft das Bild gezeichnet wird (Schritt 22): flüssig bei Bewegung, sparsam im Leerlauf und auf schwachen Tablets; mit Unit-Tests |
| `houseload.js` | ~55 | Haus öffnen (Schritt 22): wechseln (vorher speichern), Import und Beispielhaus öffnen, Sicherung einspielen |
| `roofmove.js` | ~65 | Dächer verschieben (#255): Dächer der Dach-Etage als Rechtecke, welches unter dem Zeiger liegt, verschieben (Solarpanels wandern mit, `panelsOn`; beim Ziehen wandert nur das gezeichnete Dach, #257), Größe an Ecken und Seiten ziehen (`roofHandles`, `resizeBox`, `setRoofBox`, #259), Ziehen in 5-cm-Schritten; mit Unit-Tests |
| `attic.js` | ~110 | Ausgebauter Dachstuhl (#260, #265): Kniestock, auf welcher Etage das Dach beginnt, welches Dach welche Etage abschneidet, Ebenen der Dachflächen, Räume in den Gauben (dort wird nicht abgeschnitten), Firsthöhe ↔ Neigung; reine Logik mit Unit-Test |
| `atticclip.js` | ~70 | Schneidet die Wand-Materialien per Shader am Dach ab, außer in Gauben (die Rechnung steht getestet in attic.js) |
| `planview.js` | ~50 | 2D-Plan dreht mit der 3D-Ansicht (#212): Winkel aus der Kamera, Punkte drehen, lesbare Schrift; Schalter |
| `placement.js` | ~60 | Platzieren (Schritt 22): Einrasten an Raster und Wandecken, Wandgeräte flach an die Wand, LED-Ring um den Raum; Wandgeräte-Liste; reine Rechnung mit Unit-Tests |
| `nav.js` | ~150 | Navigation (Schritt 21): Etagen-Knöpfe, Zimmer-Menü, Scroll-Pfeile, Raum-Knopf am Tablet, Bildausschnitt für Etage / Haus / Wandmitte; reine Teile mit Unit-Tests |
| `collide.js` | ~60 | Wandstopp (Schritt 20): Dinge lassen sich nicht in die Wand schieben, gleiten an ihr entlang, Türen lassen durch; reine Rechnung mit Unit-Tests |
| `roofs.js` | ~170 | Dächer (Schritt 19): Dachgröße, Dachflächen mit Gauben und weiteren Dächern, Geländer der Dachterrasse, Solarpanels auf dem Dach, Ausblenden aus der Nähe; Dachgrößen mit Unit-Tests |

## Noch in `app.js`

Alle geplanten Schritte (1 bis 24) sind erledigt. `app.js` hält nur noch den Zustand des offenen Plans (Etage, Werkzeug, Auswahl, Modus …),
die three.js-Grundlage (Szene, Kamera, Licht) und verbindet die Module (`init…({ … })`). Neues kommt weiterhin in ein neues oder passendes
Modul, nie als großer Block nach `app.js` (siehe „Regel für alles Neue“).

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
