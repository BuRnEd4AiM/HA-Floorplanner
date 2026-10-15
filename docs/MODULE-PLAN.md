# Aufteilung des Codes: Stand und Plan

Stand: Version 3.75.0. Hintergrund: Issue #137 (geschlossen; die Aufteilung geht nach der Regel unten Schritt für Schritt weiter). Die Hauptdatei `floorplan3d/rootfs/app/static/app.js` hatte am Anfang gut **5.100 Zeilen**, jetzt sind es noch etwa **1.500**. Das Ziel ist, sie in kleine Module mit klarer Schnittstelle und eigenen Unit-Tests zu zerlegen, damit neue Funktionen einfacher und sicherer dazukommen.

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
| `dormer.js` | ~150 | Dachgauben (Geometrie, Größe des Fensters): Sattel-, Flach- und lange Schleppgaube (#339), bündig bis zur Dachkante (#345), Anfang in Metern vom Giebel (`dormerStart`, `posForStart`), Hauptdach mit Loch unter jeder Gaube (`roofSurface`); mit Unit-Tests |
| `shutters.js` | ~120 | Rollläden an Fenstern, auch an Gaubenfenstern (#331): Haken und eigene Entität (`shutter`, `shutterEntity`), wie weit der Panzer unten ist, Text („60 % offen“), außen an der Wand (`shutterSide`), alle Entitäten eines Fensters (`linkedEntities`), Kugel und Schild über dem Fenster (`shutterBallY`, `shutterLabelY`, #335), Regeln der Rollladen-Karte (`sliderPosition`, `shownPosition`, `shutterCardText`); den Panzer baut `walls.js`, bewegt `openings.js`, die Kugel setzt `floorbuild.js`; reine Logik mit Unit-Tests |
| `shuttercard.js` | ~100 | Rollladen-Karte im Live-Modus (#335): nur der Rollladen, großer senkrechter Schieber mit dem Panzer, Hoch / Stopp / Runter, feste Stufen 0–100 %; neu gezeichnet nur, wenn sich am Rollladen etwas ändert |
| `dormerwin.js` | ~110 | Fenster der Dachgauben als echte Fenster (Kontakt, offen/zu, Raum, Liste): nie gespeicherte Wand pro Gaubenfenster an der richtigen Etage, in der Wand des Raums darunter, wenn eine direkt hinter der Gaube steht (#275), „Vorderseite auf die Wand“; `openingWalls(f)` für alles, was Türen/Fenster sucht; reine Logik mit Unit-Tests; Türen/Fenster einer Wand, auf der die Vorderseite einer Gaube steht, durch die Gaube zeigen (`frontHoles`, #341) |
| `ledring.js` | 195 | LED-Ring |
| `nanoleaf.js` | 179 | Nanoleaf-Formen und kleiner Editor |
| `autoplace.js` | 179 | Automatisches Platzieren der Entitäten eines Bereichs |
| `alerts.js` | 62 | Warnungen und Nachtabdunklung (Rechenteil) |
| `kitchen.js` | ~80 | Küchenzeile: Geometrie aus Modulen (mit Breiten), Oberschrank über einzelnen Modulen weglassen (`withUpper`, `hasUpper`, #372) |
| `heatpanel.js` | ~115 | Heizungs-Panel (Schritt 1 von #137); die übrigen Entitäten des Thermostat-Geräts (Kindersicherung …) unter dem Thermostat statt bei den Schaltern des Raums (`splitHeatParts`, `partName`, #370); Knopf „In Home Assistant öffnen“ je Thermostat (#374) |
| `heating.js` | ~70 | Heizkörper in 3D (#374): welche Geräte Heizungen sind (`isHeater`), was sie gerade tun (`heatMode`), Farbe des Temperatur-Schilds (rot heizt, blau nicht, `pillTone`), roter / blauer Heizkörper (`heatLook`, `paintHeat`, auch im Hologramm); Heizungen haben keine Kugel, das Schild ist zum Antippen; reine Logik mit Unit-Tests |
| `devicelist.js` | ~170 | Geräte-Übersicht (#376): Knopf „📋 Geräte“ oben, Liste aller verknüpften Geräte und Türen/Fenster mit Sensor nach Etage und Raum, mit Zustand, Batteriestand (Batterie-Sensor desselben Geräts, Server `battery_of`, `/api/batteries`) und offline; Filter Alle / Batterie / Offline; Zeilen, Filter und Zählung (`deviceRows`, `filterRows`, `summary`, `batteryInfo`) reine Logik mit Unit-Tests |
| `offlinemarks.js` | ~110 | Offline in 3D (#375): Kugel mit durchgestrichenem Blitz über allem, was die Offline-Liste nennt (rot offline, gelb ohne Entität), über dem Gerät, auf seinem Werte-Schild oder in der Mitte der Tür / des Fensters; eine Tipp-Kugel zeigt das Zeichen selbst (`tapballs.js`); Auswahl und Platz (`offlineMarks`, `markCenterY`) mit Unit-Tests |
| `compass.js` | ~40 | Kompass (Nadel zählt über 360° weiter), mit Unit-Tests |
| `alertsui.js` | ~75 | Warnungen: Banner, roter Raum, Sprung in den Raum (Schritt 3 von #137) |
| `search.js` | ~70 | „Wo ist …?“-Suche mit Ring (Schritt 3) |
| `kitchenui.js` | ~65 | Küchenzeile: Eigenschaften im Panel (Schritt 3), Haken „Oberschrank“ in jeder Zeile (#372) |
| `power.js` | ~250 | Strom: Kabel in 3D, Strom-Editor, Energie-Übersicht, Eigenschaften (Schritt 2 von #137) |
| `powerlogic.js` | ~60 | Strom: Rechenteil der Kabel (Watt, Kabelarten, Verlauf) und der Zähler, mit Unit-Tests |
| `energycalc.js` | ~230 | Strom-Rechnung (#378, #379): welcher Sensor was ist (`energySources`: Einstellung des Reiters „⚡ Rechnung“, sonst die Stromgeräte des Plans), die Rechnung (`energyBalance`: Erzeugung, Netz, Batterie, Hausverbrauch, Räume, Rest), was nicht aufgeht (`energyChecks`, `signFixes`), Vorschlag für die Räume (`suggestRooms`), die Zeilen im Fenster (`balanceRows`) und der Text der Strom-Anzeige (`energyText`); reine Logik mit Unit-Tests |
| `energyui.js` | ~200 | Reiter „⚡ Rechnung“ im Strom-Editor (#378): das Fenster mit Netz, Erzeugung, Batterie, Hausverbrauch und Räumen, oben die Rechnung live mit Warnungen und Knopf zum Umdrehen des Vorzeichens |
| `toolbar.js` | 88 | Anpassbare Werkzeugleiste |
| `backups.js` | ~80 | Backup-Fenster oben (🗄️, #321): ganzes Backup, automatische Sicherung, Einstellungen der Sicherheit |
| `version.js` | 122 | Versionsanzeige und Datei-Prüfung |
| `welcome.js` | 21 | Willkommenskarte |
| `import.js` | 112 | Import-Dialog |
| `moreinfo.js` | 27 | Home-Assistant-Dialog |
| `offline.js` | ~100 | Offline-Liste |
| `kiosk.js` | ~70 | Wandtablet (Bildschirmschoner, Nacht) |
| `cardmode.js` | ~110 | Dashboard-Karte (#13): die Seite in der Lovelace-Karte (`?card=1`): Optionen aus der Adresse (`cardOptions`), Etage oder ganzes Haus zum Start und nach der Ruhezeit (`cardFloor`), Raumfarben, ohne Raum-Fenster oder Leisten; Karte für einen Raum (#356, `view`): nur der Raum in 3D, ohne ihn zu verlassen (`room`), oder nur sein Raum-Fenster ohne 3D (`panel`, `alone()` in `roompanel.js`); das Aussehen der Karte nur für diesen Bildschirm (über die Vorgaben in `viewprefs.js`); reine Logik mit Unit-Tests. Die Karte selbst ist `dist/floorplan3d-card.js` (außerhalb des Add-ons, eine Datei ohne Build, Unit-Tests `tests/card.test.mjs`) |
| `badges.js` | ~50 | Wertplaketten entzerren |
| `roomlight.js` | ~85 | Raumlicht-Shader (Lichtflecken, Wandschein), Farbskalen |
| `lamplight.js` | ~75 | Welche Lampen ihren Raum beleuchten, wie weit und in welcher Farbe (`lampLights`, aus `app.js` geholt): eine Lampe an einem Relais (`switch.…`) wie jede Lampe, eigene Lichtfarbe einer Lampe, die keine Farbe meldet (`lightColor`, Feld in `props.js`), eine Lampe an der Wand knapp außerhalb des Umrisses (#367); reine Logik mit Unit-Tests |
| `earth.js` | ~150 | Erde, Rasen, Grundstücksform, Schnitt durch den Boden |
| `badgetext.js` | ~35 | Texte der Wert-Anzeigen über den Geräten (Sensoren, Zähler, Licht, Rollo …), mit Unit-Tests |
| `bridge.js` | ~35 | Metallbrücke / Übergang (#189): Lauffläche, Träger, Geländer (reine Geometrie, Unit-Tests) |
| `solarroof.js` | ~80 | Solarpanels auf dem Dach (#176): Dachfläche an einer Stelle (Höhe, Neigung), Kippung des Panels, Panel-Feld (reine Rechnung, Unit-Tests) |
| `floorpanel.js` | ~185 | Etagen-Verwaltung: Name, Art, Reihenfolge, Keller/Dach, Dach mit Gauben und weiteren Dächern |
| `settings.js` | ~165 | Einstellungen: Formular, Laden (mit Wiederholung), Speichern (ETag), Benutzer-Dialog |
| `openings.js` | ~130 | Türen, Tore, Fenster mit Kontakt: offen/zu, Liste „n offen", Bewegung der Flügel; zu mit Sensor: grüner Rahmen, Sensor offline: gelber Rahmen (`contactLook`, `partHex`, #375) |
| `cutaway.js` | ~90 | Wände zur Kamera hin absenken oder durchsichtig machen |
| `props.js` | ~260 | Eigenschaften-Panel (Wand, Raum, Block, Bodenöffnung, Tür/Fenster, Gerät, LED-Ring) |
| `objlist.js` | ~100 | Objektliste der Etage (nach Raum gruppiert) |
| `roomentities.js` | ~110 | Entitäten des gewählten Raums (Bearbeiten), automatisch platzieren |
| `propfields.js` | ~30 | Eingabefelder der Seitenleiste (Länge in m/ft) |
| `entitypicker.js` | ~95 | Entitäten-Auswahl mit Suche, nach Bereich gruppiert |
| `livecontrols.js` | ~180 | Live-Steuerung: Schalten, Licht (Helligkeit, Farbe, Effekte), Szenen, ganzer Raum (`roomIds`: Lampen und Szenen eines Raums) |
| `livepopup.js` | ~170 | Live-Karte beim Antippen (Gerät, Tür/Fenster, LED-Ring; Rollladen über `shuttercard.js`), bleibt über der Leiste unten; wird nur neu gebaut, wenn sich etwas ändert, das sie zeigt, und nicht, solange ein Schieber, Farbwähler oder eine Liste darin bedient wird (#336, `popupKey` ist reine Logik mit Unit-Tests) |
| `roompanel.js` | ~190 | Raum-Panel mit Heizungs-Panel; welche Türen und Fenster zu einem Raum gehören (`roomOpenings`: am Rand oder innerhalb des Umrisses, z. B. die Tür einer Kammer im Raum, #362) |
| `sheetview.js` | ~45 | Handy: Raum über der Raum-Karte zeigen statt dahinter, Kamera-Abstand bei schmalem Bild; Bild nach links schieben für die Spalte der Etagen-Karten (#292) (Unit-Tests) |
| `phonemenu.js` | ~50 | Handy: obere Leiste als ☰-Menü (Live-Ansicht); am Handy nur Live + 3D, kein Bearbeiten, keine Benutzer (#299); `isPhoneScreen`/`phoneView` sind reine Logik mit Unit-Tests |
| `phonenav.js` | ~45 | Handy: die Etagen als Klappliste neben ☰ und dem Zimmer-Knopf statt der Etagen-Knöpfe (#281); `phoneFloorModel` ist reine Logik mit Unit-Tests |
| `phonestatus.js` | ~60 | Handy hochkant (#288): Strom, Wasser/Gas, offline, offen, Kameras als Klappliste „📊“ (rot mit „⚠️ n“ bei Warnungen); Suche oben rechts, Raum-Fenster über die volle Breite; `phoneStatusModel` ist reine Logik mit Unit-Tests |
| `wallsplit.js` | ~60 | Wand teilen: an einer Stelle (Doppelklick im 2D-Plan, genaue Eingabe in den Eigenschaften) oder in gleiche Teile, Türen/Fenster und Räume ziehen mit (#286); reine Logik mit Unit-Tests |
| `stairtool.js` | ~175 | Treppen-Werkzeug (Platzieren, Treppenhaus, Wandtreppe zeichnen, Eigenschaften, 3D-Treppe) |
| `blocks.js` | ~80 | Platzhalter-Blöcke, Bodenöffnungen, Grundstück, Boden mit Aussparungen |
| `palettes.js` | ~105 | Paletten (Geräte, eigene Modelle, Suche) |
| `background.js` | ~120 | Hintergrundbild (Vorlage zum Nachzeichnen, Eichen) |
| `settingsui.js` | ~115 | Einstellungen: Tablet-Zuordnung und Farbskalen |
| `houses.js` | ~95 | Häuser (Liste, Auswahl, Neu/Kopieren/Umbenennen/Löschen) |
| `floorrail.js` | ~115 | Etagen-Leiste (Vorschaubilder) |
| `floorcards.js` | ~110 | Etagenkarten (Ganzes Haus); auf dem Handy kleine Karten mit Symbolen (#290, `compactParts`) in einer freien Spalte rechts neben dem Haus (#292, `cardColumn`, `columnZoom`; alle mit Unit-Tests) |
| `cameras.js` | ~190 | Kameras (Sichtkegel, Übersicht, Standbilder) |
| `neighbor.js` | ~120 | Nachbarhaus (#220): anderes Haus daneben zeigen (3D und Umriss im Plan), Einstellungen; Geometrie mit Unit-Tests |
| `multisel.js` | ~120 | Mehrfachauswahl (#211, #247): Shift / Strg + Klick, Rahmen aufziehen im 2D-Plan (`boxItems`), alle löschen in einem Schritt, Rahmen in 3D, Kasten im Panel, alle zusammen verschieben (`groupTargets`, `moveGroup`) |
| `tapballs.js` | ~140 | Kugeln zum Antippen im Live-Modus (#238): Lage über/unter dem Gerät, Farbe nach Zustand, Symbol (ein Schalter bekommt einen gezeichneten Lichtschalter, eine Steckdose den Stecker, #366, eine Lampe am Relais die Glühbirne, #367), auf dem Bildschirm auseinanderschieben (#314, `spreadScreen`); reine Regeln mit Unit-Tests |
| `startview.js` | ~95 | Startansicht (#315): aktuelle Ansicht speichern (für alle und pro Benutzer), beim Start und am Wandtablet dorthin zurück; reine Regeln mit Unit-Tests |
| `renames.js` | ~50 | In Home Assistant umbenannte Entitäten: neue Entity-IDs und HA-Namen (nicht von Hand vergebene) in den Plan und die Rückgängig-Liste einer offenen Ansicht; Gegenstück im Add-on ist `renames.py` (Wächter über die Registry, schreibt alle Häuser, Einstellungen und users.json um); reine Logik mit Unit-Tests |
| `bootguard.js` | ~60 | Startschutz (#328): klassisches Skript vor `app.js`; startet `app.js` nicht (alte Dateien im Browser-Cache), holt es alle Dateien neu und lädt einmal neu, sonst eine Meldung statt leerer Seite; Unit-Tests mit nachgebautem Fenster |
| `entitystate.js` | ~25 | Was von einer Entität gemerkt wird, Farbe eines Lichteffekts (Schritt 23); reine Logik mit Unit-Tests |
| `timeline.js` | ~140 | Sicherheit (Wiedergabe): Zustände zu jedem Zeitpunkt, Ereignisliste, von Ereignis zu Ereignis, Zoom der Zeitleiste (`follow`), Symbole der Ereignisse (`markers`, `eventIcon`); reine Logik mit Unit-Tests |
| `timelineui.js` | ~190 | Sicherheit (Oberfläche): 🛡️-Knopf, Liste der Tage (mit Download), Leiste unten mit Abspielen, Geschwindigkeit, Schieber und Ereignissen |
| `layoutnorm.js` | ~25 | Geladenen Plan vervollständigen, „Erdgeschoss“ in der Sprache des Nutzers (Schritt 23); reine Logik mit Unit-Tests |
| `userlocks.js` | ~55 | Sperren pro Benutzer / Tablet: was ein Benutzer nicht benutzen darf (Schalten, Kameras, Einstellungen, Ansicht wechseln …), ausblenden per CSS; Schalten und Kameras verweigert auch der Server; reine Logik mit Unit-Tests |
| `roomclip.js` | ~55 | Raum freistellen: Punkt im Raum, welche Geräte zum Raum gehören (`deviceInIso`: nicht die hinter einer gemeinsamen Wand im Nachbarraum, #358), Wand auf den Raum zuschneiden (auch eine Wand mitten im Raum bleibt mit ihrer Tür, #362), Punkt-im-Polygon (Schritt 24); reine Geometrie mit Unit-Tests |
| `modelfx.js` | ~90 | Trefferboxen eines Modells, Hologramm-Darstellung, Flaches unter den Böden (Schritt 24), Aussehen der LED-Ring-Abschnitte (`ringLook`, #325) |
| `labels.js` | ~50 | Text im 3D-Bild: Raumname, Wert-Pille am Gerät, leuchtendes Strom-Schild (Schritt 24) |
| `pickrules.js` | ~50 | Was ein Tipp im Live-Modus treffen darf (#234): keine Türen/Fenster, kein Kamera-Kegel, keine Anwesenheit; nur was verknüpft ist (`linkedDevice`, auch die Regel für die Kugeln; ein Fernseher nur mit Hintergrundlicht nicht, #364); Geräte mit Kugel nur über die Kugel (#262); welcher von mehreren Treffern gewinnt; reine Logik mit Unit-Tests |
| `viewprefs.js` | ~75 | Voreinstellungen pro Benutzer/Tablet (#250: starten, nie als allgemeine Einstellung speichern) und Schilder der Etagen darunter (#249); reine Logik mit Unit-Tests |
| `livechannel.js` | ~75 | Bereiche: die Nebensachen eines Bereichs (`side`: Diagnose-, Konfigurations- und versteckte Entitäten, #368) nur für die Entitäten-Auswahl. Live-Kanal (Schritt 22, Teil 1): vom Add-on geschobene Zustände, Abfrage alle 4 s solange er fehlt, sonst einmal pro Minute; Zusammenführen und Fingerabdruck mit Unit-Tests |
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
| `roofsteps.js` | ~150 | Dach mit Absätzen (#342): Traufe einer Seite ab einer Stelle weiter außen/innen (`sectionsOf`, `outAt`, `intervals`), Umriss und Rauten-Anfasser im 2D-Plan (`outline`, `stepHandles`), Absatz per Doppelklick, Ziehen, Entfernen (`addStepAt`, `moveSection`, `removeStep`), Ecken einzeln ziehen (`cornerHandles`, `moveCorner`, #345), Rahmen einer Dachfläche (`sectionFrame`); reine Logik mit Unit-Tests |
| `attic.js` | ~110 | Ausgebauter Dachstuhl (#260, #265): Kniestock, auf welcher Etage das Dach beginnt, welches Dach welche Etage abschneidet, Ebenen der Dachflächen, Räume in den Gauben (dort wird nicht abgeschnitten, unter einer Schleppgaube bis unter ihr schräges Dach, #339), Firsthöhe ↔ Neigung; reine Logik mit Unit-Test |
| `atticclip.js` | ~70 | Schneidet die Wand-Materialien per Shader am Dach ab, außer in Gauben (die Rechnung steht getestet in attic.js) |
| `planview.js` | ~50 | 2D-Plan dreht mit der 3D-Ansicht (#212): Winkel aus der Kamera, Punkte drehen, lesbare Schrift; Schalter |
| `placement.js` | ~60 | Platzieren (Schritt 22): Einrasten an Raster und Wandecken, Wandgeräte flach an die Wand, LED-Ring um den Raum; Wandgeräte-Liste; reine Rechnung mit Unit-Tests |
| `nav.js` | ~150 | Navigation (Schritt 21): Etagen-Knöpfe, Zimmer-Menü, Scroll-Pfeile, Raum-Knopf am Tablet, Bildausschnitt für Etage / Haus / Wandmitte; reine Teile mit Unit-Tests |
| `collide.js` | ~60 | Wandstopp (Schritt 20): Dinge lassen sich nicht in die Wand schieben, gleiten an ihr entlang, Türen lassen durch; reine Rechnung mit Unit-Tests |
| `roofs.js` | ~170 | Dächer (Schritt 19): Dachgröße, Dachflächen mit Gauben und weiteren Dächern, Geländer der Dachterrasse, Solarpanels auf dem Dach, Ausblenden aus der Nähe; Dachgrößen mit Unit-Tests |
| `perfhud.js` | ~140 | Leistungsanzeige: Bilder pro Sekunde und weitere Werte (Zeit pro Bild, Zeichenaufrufe, Dreiecke, Auflösung, Sparmodus, Grafikchip, Speicher) oben rechts im 3D-Bild, Auswahl im Menü „Ansicht“, pro Gerät gemerkt, `?fps=1` / `?fps=all`; Zählen und Textzeilen mit Unit-Tests |

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
