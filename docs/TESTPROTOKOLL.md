# Testprotokoll

Hier steht, was getestet wurde, wann und von wem. Der Besitzer testet in der **Demo-Datei** (`demo/floorplan3d-demo.html`, erfundene Daten, ohne Home Assistant). Die automatischen Tests laufen bei jeder Änderung.

Legende: ✅ geht · ❌ geht nicht · ❓ noch nicht getestet · ➖ in der Demo nicht prüfbar (nur im Add-on)

## Kurze Prüfliste: das Wichtigste zuerst (Stand 3.99.6)

Die **Demo** öffnen: https://burned4aim.github.io/HA-Floorplanner/ und neu laden (am PC Strg+F5). Oben in der Leiste muss **v3.99.6** stehen. Punkte mit „nur im Add-on“ gehen nur in Home Assistant. Ergebnis gern hier oder im Chat: Nummer + „geht“ oder „geht nicht, weil …“ (ein Bild hilft). Die Nummern in Klammern führen zu den Tabellen unten, dort steht jeder Schritt genau.

1. **Neu in 3.99: Böden, Fensterrahmen, Glas-Optik, Raum-Schilder oder Geräte** (66.1 bis 66.10, 66.12 bis 66.20, 66.23, 66.24): „Live“ ansehen und nah heranzoomen, auch flach von der Seite; ein Raum-Schild und einen Punkt antippen; nachts die Sterne ansehen; auf dem Tablet eine Raum-Kachel antippen; am Handy die Raum-Kacheln wischen (flüssig, ohne Hängen) und unten „Strom“ drücken (die Karte „Strom jetzt“ erscheint); „Ansicht“ → „Im Bild: Raum-Schilder“ auf „Geräte“ umschalten und zurück; im Bearbeiten einem Raum einen anderen Boden geben.
2. **Neu: Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste** (65.1 bis 65.13, 65.16): „Live“ ansehen, mit `?skytime=21:30` und `?weather=rainy`; die Karte „Strom jetzt“ und die Raum-Kacheln antippen; im Bearbeiten die neue Werkzeugleiste ausprobieren.
3. **Alles wie immer** (Abschnitt 9): Wände und Räume zeichnen, Geräte setzen und ziehen, Türen setzen, Entf, Pfeiltasten, Q/E, Strg+Z, in „Live“ eine Lampe antippen. Es soll sich **nichts** anders anfühlen.
4. **Kein Überschreiben beim Speichern** (60.10 bis 60.12, nur im Add-on): den Plan auf zwei Geräten im Bearbeiten öffnen, auf dem einen etwas ändern, dann auf dem anderen: es kommt die Frage „Plan wurde woanders geändert“.
5. **Wiederholen, Kopieren, Einfügen** (60.1 bis 60.8): Strg+Z, dann Strg+Y; eine Lampe anklicken, Strg+C, Strg+V; Strg+D verdoppelt.
6. **Mehrere Gebäude in einem Plan** (61.1 bis 61.9, 61.12): rechts „🏘 Gebäude in diesem Plan“, zwei Gebäude anlegen, Räume zuordnen, oben umschalten, „🏠 Jedes Gebäude bekommt sein eigenes Dach“.
7. **Neu: mehr Geräte steuern** (63.1 bis 63.8, im Add-on 63.9 bis 63.11): in „Live“ den Lautsprecher, den Saugroboter, den Standventilator, die Alarmanlage (Code 1234) und den Hausmodus antippen und die neuen Knöpfe ausprobieren.
8. **Energie einrichten und Strom-Rechnung** (62.1 bis 62.4, im Add-on 62.5 bis 62.7, dazu 50.1 bis 50.8): „Strom-Editor“ → „⚡ Rechnung“ → „⤵ Aus dem Energie-Dashboard übernehmen“ → „✓ Übernehmen“; in der Checkliste „+ Wasserzähler in den Plan setzen“; die Rechnung geht auf, „Vorzeichen umdrehen“ ändert „lädt“ / „entlädt“.
9. **Nochmal prüfen, war ❌** (46.3, nur im Add-on): die Dashboard-Karte findet das Add-on wieder (behoben in 3.77.1; in HACS die Karte aktualisieren, Strg+F5).
10. **Neu: Alarm per WhatsApp** (64.1 bis 64.6, nur im Add-on): ⚙ → „🚨 Benachrichtigung bei Alarm (WhatsApp)“ einrichten, „Test senden“; dann einen Rauchmelder auslösen (Testknopf am Melder): die WhatsApp kommt mit Ort im Plan.
11. **Etagen aufeinander, flüssig auf dem iPad** (55.1 bis 55.7, 56.1 bis 56.6): „Ganzes Haus“ → „Ansicht“ → „Aufeinander“; das Musterhaus auf dem iPad drehen und zoomen.
12. **Messen** (58.1 bis 58.8): Taste **M**, zwei Punkte anklicken; zwei Wände anklicken und den lichten Abstand setzen.
13. **Benutzer sperren** (37.6, 61.10, 61.11): „Benutzer“ → ⚙ → „🔒 Gesperrt“: Haken setzen, schließen, wieder öffnen; „Gebäude“ pro Benutzer.
14. **Neue Möbel kurz durchblättern** (51 bis 54, 57, 59): Gruppen „Sauna & Wellness“, „Bar“, „Klima & Lüftung“, „Fahrzeuge“, „Werkstatt“: ein paar Stücke setzen, sehen sie richtig aus?
15. **Warnbanner am Wandtablet** (8.5, nur mit echtem Gerät): Rauch, Wasser oder offenes Fenster bei Regen; ein Tipp aufs Banner springt in den Raum.

**Zuletzt geprüft (2026-10-18):** ✅ 66.22 (am iPhone steht der angetippte Raum schön über der Raum-Karte). ❌ 66.21: die Raum-Kacheln ließen sich am Handy nur ruckelig wischen, die Leiste blieb hängen (#441, neu gebaut in 3.99.6: 66.23); dazu zeigte „Strom“ am Handy nichts an (#442, neu: 66.24).

**Davor geprüft (2026-10-17): ✅** 10.2 und 10.3 (Wandtablet: zurück zur Startansicht, Bildschirmschoner), 13.3 bis 13.5 (Import mit Keller und Anbau), der ganze Abschnitt 20 (erster Start), 21.4 (Hinweis auf neue Version), die ganzen Abschnitte 24 bis 27 (Treppen über mehrere Etagen, Solarpanels, Wasser-, Gas- und Wärmezähler, Brücke und die Nachträge 27.5 bis 27.8), 29 (Treppenhaus) und 30 (weniger aus Versehen antippen), 31.1 und 31.3 (Abschnitt 31 damit fertig; 31.1 war ❌, geht jetzt), 60.9 (Geländer der Wendeltreppe pro Etage, #318), die ganzen Abschnitte 38 (Kugeln, Startansicht, Backup-Fenster), 39 (LED-Ring-Abschnitte farbig), 40 und 41 (Rollläden und Rollladen-Karte).

<details>
<summary>Ältere Prüflisten bis 3.94 (ausführlich, zum Nachschlagen)</summary>

**Davor geprüft (2026-10-10): ✅** der ganze Abschnitt 28 (Nachbarhaus und Brücke), 21.5, 21.6, 18.3, 18.7, 18.8 (Abschnitt 18 damit fertig), 9.6, 9.7 (Backup, automatisches Speichern) und 6.1 bis 6.3 (Kameras). 10.1 entfällt: die Raum-Zuordnung fürs Wandtablet läuft jetzt über „Benutzer & Tablets“.

**Am Vortag geprüft (2026-10-09): ✅** 36.11 (Handy quer), der ganze Abschnitt 32 (Dächer verschieben und Größe ziehen), 31.2 und 31.4 bis 31.7. **❌ 31.1**: bei der Wandtreppe mit „Etagen“ 2 ist noch ein langer Lauf vorhanden (#318, vorerst nur notiert). Ebenso am selben Tag ✅: 10.4 und 10.5 (Leistungsmodus, Benutzer sehen nur ihren Raum), 37.1 bis 37.5 (Handy hochkant, Leistungsanzeige), 37.7 und 37.8 (mehrere zusammen verschieben). Ebenso am selben Tag: der ganze Abschnitt 33 (nur die Kugel zählt im Live-Modus) und der ganze Abschnitt 34 (ausgebauter Dachstuhl). Am selben Tag davor ebenso ✅: 7.1a, 11.6, 14.4, 16.4, 17.4, 18.1, 18.2, 18.4 bis 18.6, 18.9, 18.10, 19.1 bis 19.5, 21.2, 21.3, der ganze Abschnitt 22 (22.1 bis 22.9) und 23.1 bis 23.16: Öffnungs-Auswahl gruppiert, Benutzer nach Update wieder da, Haus ohne Keller, Gauben in der Demo, Werkzeugleiste, automatische Sicherung, Versionsanzeige mit Prüfsumme, Ansicht-Knopf, Halbschnitt, durchsichtige Wände, Zurück-Zoomen im Live, Heizungs-Panel, weitere Dächer, Küchenzeile, Strom-Editor mit Kabeln und Kamera-Sichtkegel.

**Davor geprüft (2026-10-08): ✅** 36.1 bis 36.10 und 36.12 bis 36.14: Gaubenfenster (Name, Kontakt, löschen, in der Wand, „Vorderseite auf die Wand“), Dach über dem Raum durchsichtig, Handy-Menü ☰, kein Hineinzoomen bei der Suche, Raum-Karte, Tablet/PC unverändert, Etagen- und Zimmer-Listen, alles auf einen Blick. Ebenso ✅ das Löschen mehrerer Dinge (Punkt 15 unten). Daraus kam der Wunsch „mehrere zusammen verschieben“, eingebaut in 3.62.0 (37.7, 37.8). Später am selben Tag ebenso ✅: 36.15 (Wand teilen), der ganze Abschnitt 35 (Gauben im ausgebauten Dachstuhl, „Dach beginnt auf Etage“, Firsthöhe, Haken weg) und 34.1 bis 34.3 (Kniestock).

**Prüfen ab 3.62** (ausführlich in Abschnitt **37** unten)
2. ✅ (2026-10-09) **Neu: mehrere zusammen verschieben** (3.62.0, 37.7 und 37.8): Bearbeiten, Werkzeug „Auswählen“, Ansicht **2D** oder **2D + 3D**. Mit **Strg/Shift + Klick** (oder Strg/Shift + Rahmen ziehen) mehrere Dinge auswählen, z. B. Raum, Wände, Lampe und Sofa. Dann **ohne** Strg/Shift auf eins davon drücken und **ziehen**: **alle** wandern zusammen und bleiben ausgewählt (grüner Rahmen). Wände, die an einer mitgezogenen Wand hängen, werden länger/kürzer und bleiben verbunden; Türen und Fenster wandern mit ihrer Wand. **Strg+Z** holt alles in einem Schritt zurück. Nur **klicken** (nicht ziehen) auf eins davon: nur dieses ist dann ausgewählt.
3. ✅ (2026-10-09) **Leistungsanzeige** (3.60.0, 37.5): unten „Ansicht“ → „⏱ Leistung“ auf „FPS“, dann „alle Werte“, dann „aus“.
4. ✅ (2026-10-09) **Handy hochkant** (3.59.0 bis 3.60.1, 37.1 bis 37.4): Knopf 📊 oben; in „Ganzes Haus“ kleine Etagen-Karten rechts neben dem Haus, auch beim Hineinzoomen.
5. **Benutzer sperren** (3.61.0, 37.6): „Benutzer“ → „⚙“ → „🔒 Gesperrt“: Haken setzen, schließen, wieder öffnen, die Haken sind noch da.

**Neu in 3.66** (ausführlich in Abschnitt **38** unten)
8. ✅ (2026-10-17) **Kugeln verdecken sich nicht mehr** (38.1): Live, schräg von oben auf Lampen schauen, drehen.
9. ✅ (2026-10-17) **Startansicht wählen** (38.2, 38.3): Ansicht einstellen, ⚙ → „📌 Aktuelle Ansicht übernehmen“, neu laden.
10. ✅ (2026-10-17) **Sicherheit über die ganze Breite** (38.5) und **„🗄️ Backup“ oben** (38.6).
11. ✅ (2026-10-17) **Keine dunkle Fläche beim Platzieren** (38.8): „2D + 3D“, Werkzeug „Treppe“.

**Neu in 3.67** (ausführlich in Abschnitt **39** unten)
12. ✅ (2026-10-17) **LED-Ring-Abschnitte farbig** (39.1, 39.2): Bearbeiten, LED-Ring in mehrere Abschnitte teilen, in 2D und 3D schauen.

**Neu in 3.69** (ausführlich in Abschnitt **40** unten)
13. ✅ (2026-10-17) **Rollladen an jedem Fenster, auch an der Gaube** (40.1 bis 40.6): Bearbeiten, ein Fenster anklicken, Haken „Rollladen“. Live: die Kugel 🪟 über dem Küchenfenster antippen, „Hoch“ / „Runter“ und Schieber ausprobieren.

**Neu in 3.70** (ausführlich in Abschnitt **41** unten)
14. ✅ (2026-10-17) **Rollladen-Karte wie in Home Assistant** (41.1 bis 41.5): Live, am Handy die Kugel 🪟 **über** einem Fenster mit Rollladen antippen. Die Karte zeigt **nur den Rollladen** (nicht den Fensterkontakt), einen großen Schieber, Hoch / Stopp / Runter und 0 / 25 / 50 / 75 / 100 %; den Schieber ziehen oder eine Stufe antippen.

**Neu in 3.71** (ausführlich in Abschnitt **42** unten)
15. **Lange Schleppgaube** (42.1 bis 42.6, #339): Bearbeiten, Etage „Dach“, „Etage verwalten“ aufklappen. Bei einer Gaube „Dachform der Gaube“ auf **„Schleppgaube“** stellen, „Breite“ z. B. 6 m, **„Abstand vom Giebel“** z. B. 3 m. In 3D: die Wand geht vorne senkrecht hoch, das Dach der Gaube läuft flacher bis ins Hauptdach, links und rechts davon ist wieder normale Schräge.
16. **Neu in 3.72: ein Fenster pro Raum unter der Schleppgaube** (43.1 bis 43.4, #341): bei der Schleppgaube den Haken „Fenster“ aus. Dann die Etage darunter öffnen und mit dem Werkzeug „Tür/Fenster“ in die Wand jedes Raums unter der Gaube ein Fenster setzen. Von außen sind die Fenster jetzt **durch die Gaube** zu sehen.

**Neu in 3.73** (ausführlich in Abschnitt **44** unten)
17. **Dach mit Absatz** (44.1 bis 44.6, #342): Bearbeiten, Etage „Dach“, Ansicht **2D**. Das Dach anklicken, dann **Doppelklick auf die Dachkante** an der Stelle, wo das Haus breiter wird. Die **Raute** des vorderen Teils nach innen ziehen. In 3D: das Dach ist vorne schmaler, der First bleibt gerade.

**Neu in 3.74** (ausführlich in Abschnitt **45** unten)
18. **Schleppgaube bis zur Kante, Ecken einzeln ziehen** (45.1 bis 45.3, #345): bei der Schleppgaube „Abstand vom Giebel“ auf **0** stellen: sie geht bündig bis an die Dachkante. Im 2D-Plan beim Dach mit Absatz die **Kreise** an einem Absatz einzeln ziehen.

**Neu in 3.75** (ausführlich in Abschnitt **46** unten)
19. **So sieht die Karte aus, schon in der Demo** (46.1, #13): `https://burned4aim.github.io/HA-Floorplanner/?card=1&floor=house&heatmap=temp&theme=light` öffnen: das ganze Haus, hell, mit Temperaturfarben, ohne Werkzeugleiste.
20. **Das Haus auf dem Dashboard, nur in Home Assistant** (46.3 bis 46.9, #13): Add-on auf 3.77.1 aktualisieren. **Wichtig:** bis 3.77.0 fand die Karte das Add-on in neuen Home-Assistant-Versionen nicht (#352). In HACS bei „3D Floorplan Card“ auf **3.77.1** aktualisieren (oder ⋮ → „Erneut herunterladen“) und den Browser mit Strg+F5 neu laden. In HACS → ⋮ → **Benutzerdefinierte Repositories** `https://github.com/BuRnEd4AiM/HA-Floorplanner` mit Typ **Dashboard** hinzufügen, **3D Floorplan Card** herunterladen, Browser neu laden. Dann ein Dashboard bearbeiten → **Karte hinzufügen** → **3D Floorplan**. Im Editor eine Etage wählen und speichern: das Haus erscheint in der Karte, ein Tipp auf eine Lampen-Kugel schaltet sie.

**Neu in 3.76** (ausführlich in Abschnitt **47** unten)
21. **Durchsichtig: nur die Wand, nicht Fenster und Türen** (47.1, 47.2, #350): unten „Ansicht“ → **„Durchsichtig“** einschalten, die Kamera um das Haus drehen. Die Wände zur Kamera werden durchsichtig, **Fenster, Türen und Möbel bleiben normal sichtbar**.

**Neu in 3.77** (ausführlich in Abschnitt **48** unten, nur im Add-on: die Demo hat keinen Import)
22. **Musterhaus mit allem drin** (48.1 bis 48.5, #353): Bearbeiten, links „Häuser“ aufklappen, **„Haus aus JSON importieren …“**, dann **„Beispiel: Musterhaus (alles drin)“**, **Prüfen**, **Importieren**. Danach „Ganzes Haus“ und jede Etage ansehen. Zum Schluss das Musterhaus wieder löschen, wenn du es nicht behalten willst.

**Neu in 3.80** (ausführlich in Abschnitt **49** unten)
23. **Küchenzeile ohne Oberschrank über einzelnen Modulen** (49.1 bis 49.4, #372): Bearbeiten, die Küchenzeile anklicken. In der Modul-Liste steht in jeder Zeile neben der Breite ein Haken: beim gewünschten Modul wegnehmen. In 3D ist nur dort der Oberschrank weg, Unterschrank und Arbeitsplatte bleiben.

**Neu in 3.82** (ausführlich in Abschnitt **50** unten)
24. **Strom-Rechnung: welcher Sensor ist was** (50.1 bis 50.8, #378, #379): Bearbeiten, **„Strom-Editor“** drücken, dann daneben **„⚡ Rechnung“**. Oben steht die Rechnung mit den Werten von jetzt. In der Demo: Erzeugung 3,20 kW, + Bezug 450 W, − Batterie lädt 600 W, **= Hausverbrauch 3,05 kW** (vorher stand oben links fälschlich 3,65 kW, weil die Batterie fehlte). Darunter Netz, Erzeugung, Batterie, Hausverbrauch und Räume einstellen und sehen, wie sich die Rechnung und die Strom-Anzeige oben links ändern.

**Neu in 3.84** (ausführlich in Abschnitt **51** unten)
25. **Über 50 neue Möbel im Stil der bekannten skandinavischen Klassiker** (51.1 bis 51.8): Bearbeiten, Werkzeug **„Gerät“**, links in der Bibliothek blättern (neue Gruppen **„Kinder“** und **„Flur“**) oder im Suchfeld z. B. **„kallax“**, **„billy“**, **„poäng“** oder **„blåhaj“** eingeben. Ein Teil setzen, anklicken und rechts bei **„Ausführung“** z. B. Eiche oder Schwarzbraun wählen.

**Neu in 3.85** (ausführlich in Abschnitt **52** unten)
26. **Sauna, Fitness, Bar, Heimkino, PC und Spiegel mit LED** (52.1 bis 52.6): Bearbeiten, Werkzeug **„Gerät“**, links die neuen Gruppen **„Sauna & Wellness“**, **„Fitness“**, **„Bar“** und **„Heimkino“** ansehen (die PCs stehen bei **„Büro“**, die LED-Spiegel bei **„Bad“**), oder im Suchfeld z. B. **„sauna“**, **„laufband“**, **„beamer“**, **„spiegel“** eingeben.
27. **Spiegel mit mehreren LEDs, jede einzeln verknüpft** (52.7 bis 52.10): den **„LED-Spiegel mit 3 Zonen“** an eine Wand setzen, anklicken, rechts unter **„LEDs einzeln verknüpfen“** für „Hinten (indirekt)“, „Vorne“ und „Unten“ je ein Licht wählen. Dann **„Live“** und den Spiegel antippen: ein Knopf pro LED.

**Neu in 3.86** (ausführlich in Abschnitt **53** unten)
28. **Gaming-PC-Arbeitsplatz mit anderen Bildschirmen** (53.1, 53.2): den „Gaming-PC-Arbeitsplatz“ (Gruppe „Büro“) setzen, anklicken, rechts bei **„Anordnung“** z. B. „Curved + 2 hochkant“ wählen.
29. **Große Spiegel mit zwei LEDs** (53.3): die „Spiegelwand mit LED“ (Gruppe „Fitness“) oder den „Ganzkörperspiegel mit LED“ (Gruppe „Flur“) anklicken: unter „LEDs einzeln verknüpfen“ stehen „Hinten (indirekt)“ und „Vorne“.

**Neu in 3.87** (ausführlich in Abschnitt **54** unten)
30. **Fernseher am Schwenkarm** (54.1 bis 54.4): im Suchfeld **„schwenkarm“** eingeben, den **„Wand-TV mit Schwenkarm“** an eine Wand setzen, anklicken und rechts **„Schwenken“**, **„Abstand zur Wand“** und **„Neigen“** ändern; bei **„Hintergrundlicht“** ein Licht wählen.
31. **Klimageräte und Ventilatoren** (54.5 bis 54.8): links die neue Gruppe **„Klima & Lüftung“**; ein Klimagerät mit seinem Thermostat (`climate.…`) verknüpfen und in „Live“ auf Kühlen und Heizen stellen.

**Neu in 3.88** (ausführlich in Abschnitt **55** unten)
32. **Etagen aufeinander wie ein echtes Haus** (55.1 bis 55.5): „Ganzes Haus“, unten „Ansicht“ → **„Aufeinander“**. Die Etagen sitzen ohne Lücke aufeinander, dazwischen eine Decke. In „Live“ bleiben die Kugeln und Schilder vom Erdgeschoss im Erdgeschoss und schweben nicht mehr über dem 1. Stock.
33. **Kein schwarzes Loch unter dem Erdgeschoss** (55.6, #391): den 1. Stock öffnen: das Erdgeschoss darunter ist blass, steht aber auf Boden, nicht über einem schwarzen Loch.
34. **Ganzes Haus: alle Etagen zeigen ihre Lampen** (55.7, #392): erst das Erdgeschoss öffnen, dann „Ganzes Haus“ und „Live“: auch die Lampen im 1. Stock haben ihre Kugeln und leuchten.

**Neu in 3.89** (ausführlich in Abschnitt **56** unten)
35. **Flüssig auf dem iPad, auch mit dem Musterhaus** (56.1 bis 56.3, #394): das Musterhaus („alles drin“) öffnen, auf dem iPad drehen und zoomen, auch „Ganzes Haus“: es soll nicht mehr ruckeln. Alles sieht aus wie vorher.
36. **„Aufeinander“ auch bei einer Etage** (56.4 bis 56.6, #396): eine Etage öffnen (z. B. Obergeschoss), unten „Ansicht“ → **„Aufeinander“**: die Etage sitzt direkt auf der Etage darunter, deren Schilder schweben nicht mehr darüber. Im Benutzer-Fenster lässt es sich pro Benutzer vorgeben und sperren.

**Neu in 3.90** (ausführlich in Abschnitt **57** unten)
37. **Garage, Werkstatt und Carport einrichten** (57.1 bis 57.5): Bearbeiten, Werkzeug **„Gerät“**, links die neuen Gruppen **„Fahrzeuge“**, **„Werkstatt“** und **„Garage & Carport“** ansehen. Ein Auto, das Wohnmobil und die Werkbank in die Garage stellen: passt alles hinein? Ein Auto anklicken und rechts bei **„Ausführung“** die Farbe ändern.
38. **Licht am Auto und in der Werkstatt** (57.6, 57.7): das Auto mit einem Schalter verknüpfen, in „Live“ einschalten: Scheinwerfer und Rücklichter leuchten. Die „LED-Werkstattleuchte“ an die Decke setzen und schalten: sie erhellt die Garage.
39. **Musterhaus mit Garage und Hof** (57.8, nur im Add-on): das Musterhaus neu importieren: in der Garage stehen der blaue Kombi, die Werkbank und ein Fahrrad an der Wand, vorne rechts ist ein Hof mit drei Carports, Wohnmobilen, Wohnwagen und einer Hebebühne.

**Neu in 3.91** (ausführlich in Abschnitt **58** unten)
40. **Messen mit der Taste M** (58.1 bis 58.3, #399): Bearbeiten, Taste **M** drücken (oder oben **„Messen“**): es öffnet sich 2D + 3D. Zwei Punkte im Plan anklicken: die Linie mit ihrer Länge erscheint, rechts stehen die Maße.
41. **Zwei Wände genau einstellen** (58.4 bis 58.8): zwei gegenüberliegende Wände eines Raums nacheinander anklicken, rechts beim **„Lichter Abstand“** z. B. 4 eintippen und **„Setzen“**: die orange Wand rückt genau dorthin, die Wände daneben und der Raum ziehen mit. Dann zwei Wände in einer Ecke anklicken und den **„Winkel“** auf z. B. 120 stellen. Strg+Z macht es rückgängig.

**Neu in 3.92** (ausführlich in Abschnitt **59** unten)
42. **Bar mit Deckenteil** (59.1 bis 59.5, #401): Bearbeiten, die Bar über Eck anklicken (oder eine neue aus der Gruppe „Bar“ setzen), rechts bei **„An der Decke“** z. B. **„Gläserregal mit hängenden Gläsern“** wählen: über der Theke hängt jetzt ein Regal in L-Form mit Gläsern. Probiere auch **„Deckensegel mit LED“** und **„Pendelleuchten“**.
43. **Eigenes Licht für das Deckenteil** (59.6, 59.7): unten bei **„LEDs einzeln verknüpfen“** beim **„Deckenteil“** ein Licht wählen, dann in „Live“ die Bar antippen: das Deckenteil hat einen eigenen Knopf.

**Neu in 3.93** (ausführlich in Abschnitt **60** unten)
44. **Wiederholen** (60.1 bis 60.3, #404): Bearbeiten, eine Lampe anklicken und mit den Pfeiltasten verschieben, **Strg+Z** (zurück), dann **Strg+Y** (wieder vor). Oben neben „Speichern“ gibt es dafür auch die Knöpfe **↶** und **↷**.
45. **Kopieren und Einfügen** (60.4 bis 60.8, #405): eine Lampe anklicken, **Strg+C**, dann **Strg+V**: eine zweite Lampe steht etwas daneben. **Strg+D** verdoppelt direkt. Auf eine andere Etage wechseln und **Strg+V**: dieselbe Lampe steht dort an derselben Stelle. Ein Fenster anklicken und **Strg+D**: ein zweites Fenster in derselben Wand.
46. ✅ (2026-10-17) **Wendeltreppe: Geländer pro Etage** (60.9, #318): eine Wendeltreppe mit „Etagen“ 2 setzen und von der Seite ansehen: auf der Etage dazwischen hört das Geländer am Podest auf und fängt danach neu an, man kann dort aussteigen.
47. **Schutz beim Speichern** (60.10 bis 60.12, #403, nur im Add-on): den Plan auf zwei Geräten (oder in zwei Fenstern) im Bearbeiten öffnen, auf dem einen etwas ändern, dann auf dem anderen: es kommt die Frage **„Plan wurde woanders geändert“**.

**Neu in 3.94** (ausführlich in Abschnitt **61** unten, #409)
48. **Mehrere Gebäude in einem Plan** (61.1 bis 61.5): Bearbeiten, rechts **„🏘 Gebäude in diesem Plan“** aufklappen, zweimal **„+ Gebäude“**, z. B. „Haupthaus“ und „Gartenhaus“ eintippen. Bei den Räumen des Erdgeschosses jeweils das Gebäude wählen: die Räume darüber zeigen „automatisch (Haupthaus)“.
49. **Umschalten** (61.6 bis 61.9): oben erscheint **„🏘 Alle Gebäude“**. „Gartenhaus“ wählen: nur das Gartenhaus ist zu sehen (3D und 2D), die Etagen ohne Gartenhaus verschwinden links. Dann **„🏠 Jedes Gebäude bekommt sein eigenes Dach“** drücken.
50. **Pro Benutzer / Tablet** (61.10, 61.11): „Benutzer“ → bei einem Benutzer ⚙ → **„Gebäude“** wählen und bei „🔒 Gesperrt“ **„Gebäude wechseln“** abhaken: dieser Benutzer sieht nur sein Gebäude.
51. **Anderes Haus hereinholen** (61.12, 61.13): im selben Abschnitt unten ein anderes Haus der Liste wählen, **„⤵ Hereinholen“**: es wird ein Gebäude dieses Plans.

**Noch offen aus Abschnitt 36**
6. ✅ (2026-10-09) **Handy quer** (36.11): die Etagen-Knöpfe stehen oben als kleine Pillen und verdecken den Kompass nicht; die Knöpfe unten rutschen nicht aus dem Bild.
7. **Demo-Hinweis** (3.55.0): der Hinweis „Demo · changes are not saved“ unten verschwindet nach ein paar Sekunden und verdeckt die Knöpfe unten nicht.

**Noch von 3.53.0 offen** (falls schon geprüft: bitte kurz Bescheid geben, dann trage ich es ein)

**A. Live-Modus** (oben „Live“ drücken)
2. Über jeder Lampe, Kamera, dem Fernseher, Rollladen-Schalter usw. schwebt eine **größere Kugel mit kleinem Symbol** (💡 🪟 📷 📺 🌡 …). Unter Deckenlampen hängt sie **darunter**. Kugeln, die dicht beieinander liegen, rücken etwas auseinander und **verdecken sich nicht** (auch nicht die Wert-Schilder).
3. Lampe an: die Kugel leuchtet in der **Lichtfarbe**, aus: grau-blau. Ein **Tipp auf die Kugel** öffnet bzw. schaltet das Gerät.
2a. ✅ (2026-10-09) **Neu: nur die Kugel zählt** (3.51.0, #262): die Kugeln sind **größer**. Auf eine **Lampe selbst** (nicht auf ihre Kugel) tippen: es passiert **nichts** am Gerät, der Tipp geht in den Raum (wie ein Tipp ins Leere). Auf die **Kugel** tippen: das Gerät öffnet bzw. schaltet sich. Ein LED-Ring lässt sich weiter **Abschnitt für Abschnitt** antippen. Geräte **ohne** Kugel verhalten sich wie bisher.
4. ✅ (2026-10-17, 30.1 bis 30.4) Auf die **Anwesenheits-Figur**, einen **Temperatur-/CO₂-Sensor** und den **Sichtkegel der Kamera** tippen: es passiert **nichts**. Auf die **Kamera selbst** tippen: das Kamerabild öffnet sich.
5. Oben die **Energie-Anzeige** zeigt nur Strom. **Daneben ein eigenes Feld** „🚰 1234.6 m³ · 🔥 845.2 m³ · ♨ 5321 kWh“. Unten „Strom“ drücken: nur das Strom-Feld leuchtet blau.
4a. ✅ (2026-10-17, 31.3) Treppe über 2 Etagen (z. B. Wendeltreppe mit „Etagen“ 2): im **Live** endet sie auf der gewählten Etage, **nichts darüber**. Im **Bearbeiten** ist der obere Teil durchsichtig zu sehen.

**B. Treppen** (oben „Bearbeiten“, Werkzeug „Treppe“)
6. ✅ (2026-10-17, 29.1, 29.2) **Treppenhaus** mit „Etagen“ 2 im Garten setzen: auf jeder Etage Wände, Raum, **Podest vor der Treppe mit Tür**; in 3D kommt die U-Treppe auf jeder Etage an.
7. ✅ (2026-10-17, 29.6, 31.3) Nur **eine Etage** ansehen (nicht „Ganzes Haus“): im Bearbeiten ist der obere Teil der Treppe **durchsichtig** zu sehen, im Live fehlt er (Punkt 4a), nichts Festes schwebt.
8. ✅ (2026-10-17, 29.3) **L- oder U-Treppe**: in den Eigenschaften „Podest nach dem Knick“ z. B. 0,8 → das Podest an der Wende wird tiefer.
9. ✅ (2026-10-17, 29.7, 31.1) **Wandtreppe** um eine Ecke zeichnen, an der Ecke ruhig zweimal klicken: **ebenes Podest**, keine Stufe mittendrin. Mit „Etagen“ 2: dieselbe Treppe **noch einmal eine Etage höher**. ❌ (2026-10-09, 31.1): noch ein langer Lauf vorhanden, #318. Gemeint war die **Wendeltreppe**: ihr Geländer lief über alle Etagen durch, repariert in 3.93; Nachtest 2026-10-17 ✅.
10. ✅ (2026-10-17, 29.8) **Wendeltreppe** (in der Demo von der Garage auf die Dachterrasse): oben ein **Viertelkreis-Podest** zum Aussteigen; mit „Etagen“ 2 auf **jeder Etage** eines.

**C. Zwei Häuser und Brücke**
11. ✅ (2026-10-10, 28) Oben in der Auswahl gibt es **„Demo-Haus“ und „Nachbarhaus“**. „Ganzes Haus“: beide stehen nebeneinander, die **Brücke** führt von Dachterrasse zu Dachterrasse, das **Geländer ist an beiden Enden offen**.
12. ✅ (2026-10-10, 28.8) Brücke anklicken (Etage Obergeschoss), „Höhenunterschied am Ende“ auf **1,2** stellen: die Brücke bekommt **Stufen**.
13. ✅ (2026-10-10, 28.2) „Häuser & Backup“ → Nachbarhaus: „Höhe“ oder „Lage X“ ändern → es rückt mit (Abschnitt 28).

**D. Sonstiges**
14. ✅ (2026-10-09, 31.7) **Strom-Editor** einschalten, dann ein anderes Werkzeug wählen: der Knopf „Strom-Editor“ **bleibt blau**.
15. ✅ (2026-10-17, 27.5) Im Kamera-/Offline-Menü oder bei „n offen“ einen Eintrag wählen: die Kamera **fliegt hin** (wie bei der Suche).
16. ✅ (2026-10-08) **Mehrere löschen** (Bearbeiten, Werkzeug „Auswählen“, 2D oder 2D + 3D): **Strg** (oder Shift) gedrückt halten und mehrere Dinge anklicken, sie bekommen einen grünen Rahmen. Oder **Strg/Shift gedrückt halten und ziehen**: ein grüner Rahmen, alles darin wird ausgewählt. Dann **Entf** drücken (oder rechts „Alle n löschen“): alles weg. **Strg+Z** holt alles zurück.
17. **Schilder der Etagen darunter** (#249): eine obere Etage öffnen, unten „Ansicht“ → **„Schilder darunter“** ausschalten: die Raumnamen und Werte-Schilder der Etagen darunter verschwinden. „Ganzes Haus“ zeigt trotzdem alles. Wieder einschalten: sie sind zurück. (Auch im Zahnrad unter „Aussehen“.)
18. **Voreinstellungen pro Benutzer/Tablet** (#250): oben „Benutzer“ → bei einem Benutzer **„⚙ Voreinstellungen“** → z. B. „Wände zur Kamera: Durchsichtig“ wählen. Der Knopf zeigt dann „⚙ 1 gesetzt“. Mit diesem Benutzer (Tablet) angemeldet startet die Ansicht so. Bei dir selbst ändert sich nichts. (In der Demo-Datei gibt es nur einen Benutzer: hier nur prüfen, dass das Kästchen aufgeht und sich merkt, was du wählst.)
19. **Doppelklick schaltet** (#251): im Bearbeiten (3D oder 2D) doppelt auf eine Lampe klicken: sie geht an bzw. aus (das ging zuletzt nicht).
20. **Alles wie immer**: Wände/Räume zeichnen, Geräte setzen und ziehen, Türen setzen, Entf/Pfeiltasten/Q/E, Strg+Z, Live-Antippen. Hinter den Kulissen wurde viel umgebaut (die Hauptdatei ist von gut 2.000 auf knapp 1.500 Zeilen geschrumpft); es soll sich **nichts** anders anfühlen. Wenn doch: bitte melden.
21. **Dach verschieben** (#255): Bearbeiten, links die Etage **„Dach“** wählen. Aufs Dach klicken: rechts steht „Dach“ mit der Lage. **Noch einmal drücken und ziehen**: das Dach wandert mit, die Solarpanels darauf auch. Im **2D-Plan** (und 2D + 3D) sind die Dächer gestrichelt zu sehen und lassen sich genauso ziehen. Pfeiltasten schieben in kleinen Schritten, Strg+Z holt es zurück.
20a. **Neu: Dach ziehen ruckelt nicht mehr** (3.49.1, #257): wie bei 20 das Dach ziehen, einmal in **3D** und einmal im **2D-Plan**. Es soll **flüssig** mitwandern, ohne Hänger. Beim **Loslassen** sitzt das Dach genau dort, wo es beim Ziehen zu sehen war, die Solarpanels liegen weiter darauf.
20b. **Neu: Dachgröße ziehen** (3.50.0, #259): Etage „Dach“, **2D-Plan**, aufs Dach klicken. An den **4 Ecken und 4 Seitenmitten** erscheinen **weiße Kästchen**.
   - An einer **Ecke** ziehen: das Dach wird breiter/schmaler und tiefer/flacher, die **gegenüberliegende Ecke bleibt** stehen.
   - An einer **Seitenmitte** ziehen: nur diese Seite wandert.
   - Sehr weit nach innen ziehen: das Dach wird **nicht kleiner als 1 m**.
   - Mit gedrückter **Alt**-Taste ziehen: frei statt in 5-cm-Schritten.
   - **Loslassen**: das 3D-Dach hat die neue Größe, rechts stehen die neuen Maße.
   - **Strg+Z**: die alte Größe ist zurück.
   - Unter „Etage verwalten“ ist danach „Größe selbst festlegen“ angehakt und die Zahlen passen zum Plan.
20c. ✅ (2026-10-09) **Neu: ausgebauter Dachstuhl** (3.52.0, #260): Etage **„Dach“** wählen, rechts **„Etage verwalten“** öffnen, Haken bei **„Ausgebauter Dachstuhl“** setzen.
   - Das Dach rutscht nach unten und sitzt jetzt **im Dachgeschoss** auf einer 1 m hohen Wand (Kniestock).
   - Etage **„Dachgeschoss“** ansehen: die Wände sind **schräg abgeschnitten**, wo das Dach sie trifft (von der Giebelseite sieht man die Dachform).
   - Feld **„Kniestock“** auf z. B. 1,5 ändern: das Dach geht höher, die Schrägen schneiden weniger ab.
   - Gauben und Solarpanels wandern mit dem Dach mit.
   - Die Etage „Dach“ ist jetzt der **Spitzboden**: dort einen kleinen Raum zeichnen und etwas hinstellen (z. B. Kisten).
   - Haken wieder weg: alles wie vorher.
20d. ✅ (2026-10-08) **Neu: Gauben, mehrere Etagen, Firsthöhe** (3.53.0, #265): wie bei 20c den ausgebauten Dachstuhl einschalten.
   - **Gauben**: wo eine Gaube ist, geht die Wand darunter **bis unter die Gaube** hoch (bei einer Giebelgaube bis in die Spitze); daneben bleibt sie an der Schräge abgeschnitten. Gut zu sehen, wenn unten „Ansicht“ → „Auto“ aus ist.
   - **„Dach beginnt auf Etage“**: z. B. „Obergeschoss“ wählen: das Dach rutscht eine Etage tiefer, jetzt liegen Obergeschoss **und** Dachgeschoss unter der Schräge, beide werden abgeschnitten.
   - **„Firsthöhe“**: z. B. 4 eintippen: das Dach wird so hoch (über der Wand bzw. dem Kniestock), die Neigung passt sich an.
22. **Flüssiger** (#253): die Demo beim Drehen der Kamera: sollte spürbar weniger ruckeln.

Ausführlicher stehen die Punkte in den Abschnitten **28 bis 37** weiter unten.

</details>

## Übersicht: was ist geprüft?

Diese Tabelle **rechnet sich selbst aus** den Tabellen unten aus (`python3 tools/testprotokoll.py`). Sie wird bei jeder Änderung automatisch geprüft. Ergebnisse also nur unten eintragen, die Übersicht folgt. ❓ heißt: noch nicht getestet (oder kein Ergebnis eingetragen).

<!-- AUTO-UEBERSICHT-START: wird von tools/testprotokoll.py erzeugt, nicht von Hand ändern -->
| Abschnitt | ✅ geht | ❌ geht nicht | ❓ offen | ➖ nur Add-on | noch offen (❌ zuerst) |
|---|---:|---:|---:|---:|---|
| 1. Start und Grundansicht | 4 | 0 | 0 | 0 | – |
| 2. Etagen (linke Leiste) | 7 | 0 | 0 | 0 | – |
| 3. Etagen im 2D-Plan (3.19.1) | 7 | 0 | 0 | 0 | – |
| 4. Räume | 7 | 0 | 0 | 0 | – |
| 5. Farbansichten und Messwerte | 3 | 0 | 0 | 0 | – |
| 6. Kameras | 3 | 0 | 0 | 0 | – |
| 7. Türen, Fenster, Garage | 6 | 0 | 0 | 0 | – |
| 8. Live-Ansicht (echte Geräte) | 6 | 0 | 1 | 0 | 8.5 |
| 9. Bearbeiten | 7 | 0 | 0 | 0 | – |
| 10. Tablet und Bedienung | 5 | 0 | 0 | 0 | – |
| 11. Benutzer & Tablets (3.20.0) | 7 | 0 | 0 | 0 | – |
| 12. Dachgauben (3.21.0) | 7 | 0 | 1 | 0 | 12.6a |
| 13. Import eines Hauses mit Keller, Anbau und Dachgeschoss | 5 | 0 | 0 | 0 | – |
| 14. Erdreich unter Anbauten ohne Keller (Fehler #93) | 4 | 0 | 0 | 0 | – |
| 15. Dachgröße von Hand (3.22.0) | 5 | 0 | 1 | 0 | 15.6 |
| 16. Wiederholung der drei Fehler (3.22.0) | 4 | 0 | 0 | 0 | – |
| 17. Werkzeugleiste anpassen und Raumliste nach Haus (3.23.0) | 7 | 0 | 0 | 0 | – |
| 18. Automatische Sicherung (3.24.0) | 10 | 0 | 0 | 0 | – |
| 19. Version und Prüfsumme in der Leiste (3.25.0) | 5 | 0 | 0 | 0 | – |
| 20. Erster Start (3.26.0) | 8 | 0 | 0 | 0 | – |
| 21. Neu in 3.26.1 bis 3.27.1 | 6 | 0 | 0 | 0 | – |
| 22. Ansicht und Live-Bedienung (3.28.0) | 9 | 0 | 0 | 0 | – |
| 23. Demo-Rundgang für 3.29 bis 3.36 (Besitzer) | 16 | 0 | 1 | 0 | 23.17 |
| 24. Treppen: mehrere Etagen, Wandtreppe, Außen-Wendeltreppe (3.40.x) | 13 | 0 | 0 | 0 | – |
| 25. Solarpanels auf dem Dach (3.41.0) | 9 | 0 | 0 | 0 | – |
| 26. Wasser-, Gas- und Wärmezähler (3.42.0) | 4 | 0 | 0 | 0 | – |
| 27. Metallbrücke / Übergang (3.43.0) | 8 | 0 | 0 | 0 | – |
| 28. Nachbarhaus und Brücke zur Dachterrasse (3.44.0) | 8 | 0 | 0 | 0 | – |
| 29. Treppenhaus, Podest an der Wende, Ausgang auf jeder Etage (3.45.0) | 8 | 0 | 0 | 0 | – |
| 30. Live-Modus: weniger aus Versehen antippen (3.45.1) | 4 | 0 | 0 | 0 | – |
| 31. Treppen über mehrere Etagen, Zähler in der Übersicht (3.46.0) | 7 | 0 | 0 | 0 | – |
| 32. Dächer verschieben und ihre Größe ziehen (3.49.0 bis 3.50.0) | 9 | 0 | 0 | 0 | – |
| 33. Live-Modus: nur über die Kugel antippen (3.51.0) | 6 | 0 | 0 | 0 | – |
| 34. Ausgebauter Dachstuhl (3.52.0) | 8 | 0 | 0 | 0 | – |
| 35. Ausgebauter Dachstuhl: Gauben, mehrere Etagen, Firsthöhe (3.53.0) | 6 | 0 | 0 | 0 | – |
| 36. Gaubenfenster, Dach über dem Raum, Handy (3.54.0 bis 3.57.0) | 15 | 0 | 0 | 0 | – |
| 37. Neu in 3.59 bis 3.62 | 7 | 0 | 1 | 0 | 37.6 |
| 38. Neu in 3.66 | 8 | 0 | 0 | 0 | – |
| 39. Neu in 3.67 | 2 | 0 | 0 | 0 | – |
| 40. Neu in 3.69: Rollläden an den Fenstern | 6 | 0 | 0 | 0 | – |
| 41. Neu in 3.70: Rollladen-Karte | 5 | 0 | 0 | 0 | – |
| 42. Neu in 3.71: lange Schleppgaube | 0 | 0 | 6 | 0 | 42.1 bis 42.6 |
| 43. Neu in 3.72: Fenster der Räume durch die Schleppgaube | 0 | 0 | 4 | 0 | 43.1 bis 43.4 |
| 44. Neu in 3.73: Dach mit Absatz (Haus vorne schmaler, hinten breiter) | 0 | 0 | 6 | 0 | 44.1 bis 44.6 |
| 45. Neu in 3.74: Schleppgaube bis zur Kante, Ecken einzeln ziehen | 0 | 0 | 3 | 0 | 45.1 bis 45.3 |
| 46. Neu in 3.75: Karte für das Dashboard (46.1 in der Demo, der Rest nur in Home Assistant) | 1 | 1 | 7 | 0 | ❌ 46.3, 46.1, 46.4 bis 46.9 |
| 47. Neu in 3.76: Durchsichtig nur die Wand | 0 | 0 | 2 | 0 | 47.1, 47.2 |
| 48. Neu in 3.77: Musterhaus mit allem drin (nur im Add-on, die Demo hat keinen Import) | 0 | 0 | 5 | 0 | 48.1 bis 48.5 |
| 49. Neu in 3.80: Küchenzeile ohne Oberschrank über einzelnen Modulen | 0 | 0 | 4 | 0 | 49.1 bis 49.4 |
| 50. Neu in 3.82: Strom-Rechnung (Reiter „⚡ Rechnung“ im Strom-Editor) | 0 | 0 | 8 | 0 | 50.1 bis 50.8 |
| 51. Neu in 3.84: Möbel im skandinavischen Stil | 0 | 0 | 8 | 0 | 51.1 bis 51.8 |
| 52. Neu in 3.85: Sauna, Fitness, Bar, Heimkino, PC und Spiegel mit LED-Zonen | 0 | 0 | 12 | 0 | 52.1 bis 52.12 |
| 53. Neu in 3.86: Bildschirme am Gaming-PC-Arbeitsplatz, große Spiegel mit zwei LEDs | 0 | 0 | 3 | 0 | 53.1 bis 53.3 |
| 54. Neu in 3.87: Fernseher am Schwenkarm, Klimageräte und Ventilatoren | 0 | 0 | 8 | 0 | 54.1 bis 54.8 |
| 55. Neu in 3.88: Etagen aufeinander wie ein echtes Haus | 0 | 0 | 7 | 0 | 55.1 bis 55.7 |
| 56. Neu in 3.89: flüssig auf dem iPad, „Aufeinander“ auch bei einer Etage | 0 | 0 | 7 | 0 | 56.1 bis 56.7 |
| 57. Neu in 3.90: Garage, Werkstatt und Carport | 0 | 0 | 7 | 1 | 57.1 bis 57.7 |
| 58. Neu in 3.91: Messen, Abstand und Winkel zweier Wände | 0 | 0 | 8 | 0 | 58.1 bis 58.8 |
| 59. Neu in 3.92: Bar mit Deckenteil | 0 | 0 | 7 | 1 | 59.1 bis 59.7 |
| 60. Neu in 3.93: Wiederholen, Kopieren und Einfügen, Schutz beim Speichern, Geländer der Wendeltreppe | 1 | 0 | 8 | 3 | 60.1 bis 60.8 |
| 61. Neu in 3.94: mehrere Gebäude in einem Plan (#409) | 0 | 0 | 11 | 2 | 61.1 bis 61.9, 61.12, 61.13 |
| 62. Neu in 3.95: Energie leichter einrichten (#407) | 0 | 0 | 4 | 3 | 62.1 bis 62.4 |
| 63. Neu in 3.96: mehr Geräte direkt im Plan steuern (#406) | 0 | 0 | 8 | 3 | 63.1 bis 63.8 |
| 64. Neu in 3.97: Alarm per WhatsApp (#414) | 0 | 0 | 0 | 6 | – |
| 65. Neu in 3.98: Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste (#418 bis #422) | 0 | 0 | 14 | 3 | 65.1 bis 65.13, 65.16 |
| 66. Neu in 3.99: echte Böden, dunkle Fensterrahmen, Glas-Optik, Raum-Schilder (#427 bis #430) | 1 | 1 | 21 | 1 | ❌ 66.21, 66.1 bis 66.10, 66.12 bis 66.20, 66.23, 66.24 |
| **Zusammen** | **284** | **2** | **183** | **23** | |
<!-- AUTO-UEBERSICHT-END -->

## Ältere offene Punkte (nur im echten Betrieb prüfbar)

Das sind die Punkte, die nur der Besitzer im echten Betrieb prüfen kann. Nach Wichtigkeit geordnet, die Nummern verweisen auf die Tabellen unten. Ergebnis jeweils unten in der Tabelle eintragen (✅ / ❌).

1. **Wandtablet** (8.5): das Warnbanner. Nur mit echtem Gerät möglich (10.2 und 10.3 sind seit 2026-10-17 ✅).
2. **Import mit Dach-Angaben** (15.6, 12.6a): JSON-Import mit `roof.box` bzw. `roof.dormers` (13.3 bis 13.5 sind seit 2026-10-17 ✅).
3. **Batterie im Strom-Bild** (65.17, neu in 3.98.2): nachts im Add-on ansehen, was unter der Batterie steht („ruht · 0 W“ oder „kein Leistungs-Sensor“).

Fertig seit 2026-10-17: 21.4 (Hinweis auf neue Version) und der ganze Abschnitt 20 (erster Start).

## Automatische Tests

| Datum | Stand | Python-Tests | Browser-Test (E2E) | Bemerkung |
|---|---|---|---|---|
| 2026-10-02 | 3.21.0 | 80 bestanden + 8 Gauben-Tests | 208 von 208 bestanden | Dachgauben |
| 2026-10-03 | 3.22.0 | 80 bestanden | die 3 neuen Prüfungen bestanden; ein Lauf mit 93 Prüfungen ohne Fehler wurde vorzeitig abgebrochen (Zeitlimit), kein vollständiger Lauf | Dachgröße, Erdreich, Pfeiltasten, Menü Ansicht, Benutzer-Dialog |
| 2026-10-03 | 3.23.0 | 80 bestanden + 5 Werkzeugleisten-Tests | 222 von 222 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Werkzeugleiste anpassbar, Raumliste nach Haus gruppiert |
| 2026-10-03 | 3.24.0 | 91 bestanden + Tests für Werkzeugleiste und Sicherungsliste | 235 von 235 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Wand teilen, Öffnungen gruppiert, Gerät bleibt ausgewählt, automatische Sicherung |
| 2026-10-03 | 3.25.0 | 98 bestanden + Tests für Version und Sicherungsliste | 240 von 240 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Versionsanzeige mit Prüfsumme, Doppelklick auf Wand großzügiger |
| 2026-10-03 | 3.25.1 | 98 bestanden | 242 von 242 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Doppelklick auf Wand neben Türen, Fenstern und Möbeln |
| 2026-10-03 | 3.26.0 | 98 bestanden + Tests für Willkommenskarte | 249 von 249 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Erster Start: Sprache Auto, dunkles Design, Willkommenskarte |

E2E-Ergebnis 3.21.0: alle 208 Prüfungen bestanden (frischer Server, Headless-Chromium, 2026-10-02).

## Handtest in der Demo (Besitzer)

### 1. Start und Grundansicht
| Nr. | Prüfpunkt | Ergebnis | Datum |
|---|---|---|---|
| 1.1 | Demo öffnet ohne Fehlermeldung, Haus in 3D | ✅ | 2026-10-02 |
| 1.2 | Drehen, Zoomen, Verschieben | ✅ | 2026-10-02 |
| 1.3 | Schalter 3D / 2D / 2D+3D | ✅ | 2026-10-02 |
| 1.4 | Sprache und Design umstellbar | ✅ (der gemeldete „Rasen über dem Boden" war ein Irrtum, kein Fehler) | 2026-10-02 |

### 2. Etagen (linke Leiste)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 2.1 | Karten mit Vorschaubild je Etage | ✅ |
| 2.2 | Klick auf Etage wechselt, Karte hervorgehoben | ✅ |
| 2.3 | Pfeiltasten wechseln die Etage | ✅ ab 3.22.0 im Add-on (vorher ❌, #98) |
| 2.4 | „Haus auseinanderziehen" | ✅ |
| 2.5 | Halbschnitt (Wände halb hoch) | ✅ |
| 2.6 | Automatisches Wände-Ausblenden funktioniert weiter | ✅ |
| 2.7 | In 2D+3D keine Etagen-Beschriftungen, wo sie nicht hingehören | ✅ |

### 3. Etagen im 2D-Plan (3.19.1)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 3.1 | Feld „Etagen im Plan" oben rechts im Plan, von nichts verdeckt | ✅ |
| 3.2 | Legende: eine Zeile je Etage mit Farbe | ✅ |
| 3.3 | Klick schaltet unten → alle → aus | ✅ |
| 3.4 | Gleicher Schalter im Menü „Ansicht" | ✅ |
| 3.5 | Nicht sichtbar in der reinen 3D-Ansicht | ✅ ab 3.22.0 im Add-on (vorher ❌, #99) |
| 3.6 | Einstellung bleibt nach dem Neuladen | ✅ |
| 3.7 | Umrisse stören das Zeichnen nicht | ✅ |

### 4. Räume
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 4.1 | Raum zeichnen (Werkzeug „Raum“), die erste Ecke schließt den Raum | ✅ im Add-on (2026-10-03) |
| 4.2 | „Räume erkennen“ legt Räume aus geschlossenen Wänden an | ✅ im Add-on (2026-10-03) |
| 4.3 | Raum benennen, Farbe wählen, Ecken verschieben, Ecke an der Raumkante per Doppelklick hinzufügen oder entfernen | ✅ im Add-on (2026-10-03) |
| 4.3a | Doppelklick auf eine Wand fügt eine Ecke hinzu, die Wand wird zu zwei Wänden (Wunsch aus dem Test) | ✅ ab 3.25.1 im Add-on (vorher ❌: Türen, Fenster und Möbel in der Nähe nahmen den Doppelklick weg) |
| 4.4 | Dropdown „Zimmer ▾“ oben: Raum anwählen, die Kamera fährt hin | ✅ im Add-on (2026-10-03) |
| 4.5 | Raum mit einem Home-Assistant-Bereich verknüpfen, „Alle … sinnvoll platzieren“ | ✅ im Add-on (2026-10-03) |
| 4.6 | Objektliste im Seitenpanel nach Räumen gruppiert, Suchfeld findet Objekte | ✅ im Add-on (2026-10-03) |

### 5. Farbansichten und Messwerte
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 5.1 | Normal / Temp. / Feuchte / CO₂ färbt die Räume nach Sensorwerten, die Legende erscheint | ✅ im Add-on (2026-10-03) |
| 5.2 | Wertplaketten auf Geräten (wichtige / alle / keine) | ✅ im Add-on (2026-10-03) |
| 5.3 | Funktioniert auf jeder Etage und in jedem Raum | ✅ im Add-on (2026-10-03) |

### 6. Kameras
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 6.1 | Kamera-Gerät zeigt einen Sichtkegel am Boden (Sichtwinkel, Reichweite) | ✅ |
| 6.2 | Mit Bewegungssensor färbt sich der Kegel rot | ✅ |
| 6.3 | Knopf 📷 oben öffnet die Kameraübersicht | ✅ |

### 7. Türen, Fenster, Garage
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 7.1 | Tür oder Fenster in eine Wand setzen, Ausführung später ändern | ✅ im Add-on (2026-10-03) |
| 7.1a | Die Auswahl „Öffnung“ ist gruppiert (Türen / Durchgänge und Tore / Fenster) (Wunsch aus dem Test) | ✅ |
| 7.2 | Verschieben entlang der Wand, Überlappung wird verhindert | ✅ im Add-on (2026-10-03) |
| 7.3 | Fenster mit mehreren Scheiben: je Scheibe ein eigener Kontaktsensor | ✅ im Add-on (2026-10-03) |
| 7.4 | Garagentor in eine Wand setzen, bei „Auf“ rollen die Lamellen hoch | ✅ im Add-on (2026-10-03) |
| 7.5 | Offene Fenster und Türen zeigt die Plakette „open“ | ✅ im Add-on (2026-10-03) |

### 8. Live-Ansicht (echte Geräte)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 8.1 | Gerät antippen: Zustand und Steuerung erscheinen | ✅ im Add-on (2026-10-03) |
| 8.2 | Raumblock „Ganzer Raum“: alle Lichter schalten, Szenen starten | ✅ im Add-on (2026-10-03) |
| 8.3 | Sensorwerte neben den Geräten | ✅ im Add-on (2026-10-03) |
| 8.4 | Änderungen in Home Assistant erscheinen live ohne Neuladen | ✅ im Add-on (2026-10-03) |
| 8.5 | Warnbanner (Rauch, Wasser, offenes Fenster bei Regen), Tippen springt in den Raum | ❓ |
| 8.6 | Plakette „offline“ zeigt nicht erreichbare Geräte und springt zum Gerät | ✅ im Add-on (2026-10-03) |
| 8.7 | Suche 🔍 „Wo ist …?“ springt zum Gerät | ✅ im Add-on (2026-10-03) |

### 9. Bearbeiten
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 9.1 | Wände zeichnen und verschieben, Rückgängig (Strg+Z) | ✅ im Add-on (2026-10-03) |
| 9.2 | Möbel aus der Bibliothek setzen, drehen, strecken, sperren | ✅ im Add-on (2026-10-03) |
| 9.3 | Bild an die Wand hängen (PNG/JPG hochladen) | ✅ im Add-on (2026-10-03) |
| 9.4 | Hintergrundbild als Vorlage zum Nachzeichnen | ✅ im Add-on (2026-10-03) |
| 9.5 | Mehrere Häuser: anlegen, kopieren, umbenennen, löschen, Hausauswahl | ✅ im Add-on (2026-10-03) |
| 9.6 | Backup herunterladen und wiederherstellen | ✅ |
| 9.7 | Automatisches Speichern, nach dem Neuladen ist alles noch da | ✅ |

### 10. Tablet und Bedienung
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 10.1 | Wandtablet mit ?kiosk=1 oder ?room=…: zeigt nur den Raum | ✅ entfällt (2026-10-10): die Raum-Zuordnung fürs Wandtablet läuft jetzt über „Benutzer & Tablets“ (Abschnitt 11, geprüft); `?kiosk=1` / `?room=…` gibt es weiter als Notlösung |
| 10.2 | Zurück zur Startansicht nach einigen Minuten ohne Berührung | ✅ (2026-10-17) |
| 10.3 | Bildschirmschoner und Nachtabsenkung, die erste Berührung weckt nur | ✅ (2026-10-17) |
| 10.4 | Leistungsmodus: Automatisch / Schön / Schnell | ✅ |
| 10.5 | Benutzer sehen nur ihren Raum und ihre Ansicht | ✅ |

### 11. Benutzer & Tablets (3.20.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 11.1 | Oben in der Leiste gibt es den Knopf „Benutzer" (nur für Admins) | ✅ |
| 11.2 | Im Zahnrad (⚙) ist der Abschnitt „Benutzer & Tablets" nicht mehr | ✅ |
| 11.3 | Benutzer hinzufügen, Raum und Ansicht wählen, wird gespeichert | ✅ |
| 11.4 | Unter dem Dialog steht, ob Datei und Add-on gleich sind | ✅ |
| 11.4a | Knopf „💾 Datei erstellen / speichern“ legt `users.json` an, auch wenn es sie noch nicht gibt | ✅ ab 3.22.0 im Add-on: das Design bleibt unverändert (vorher schaltete der Klick auf Hologramm, #100) |
| 11.5 | „↻ Synchronisieren" liest `users.json` und übernimmt die Benutzer | ✅ |
| 11.6 | Nach einem Update/Neuinstallation sind Benutzer und Tablets wieder da | ✅ |

### 12. Dachgauben (3.21.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 12.1 | Dachstuhl wählen → Abschnitt „Dachgauben" mit „+ Gaube" | ✅ (3.23.0, im Add-on) |
| 12.2 | Eine Gaube erscheint in 3D auf dem Dach, mit Fenster | ✅ (3.23.0, im Add-on) |
| 12.3 | Seite A/B, Position, Breite, Höhe, Abstand zur Traufe lassen sich ändern | ✅ (3.23.0, im Add-on) |
| 12.4 | Gaube mit Satteldach und mit Flachdach | ✅ (3.23.0, im Add-on) |
| 12.5 | Gaube entfernen (×) | ✅ (3.23.0, im Add-on) |
| 12.6 | Bei Flachdach erscheint ein Hinweis statt der Gauben | ✅ (3.23.0, im Add-on) |
| 12.6a | JSON-Import mit `roof.dormers` (docs/examples/house.json hat zwei Gauben) zeigt Gauben auf dem Dach | ❓ |
| 12.7 | Nach dem Neuladen sind die Gauben noch da (nur im Add-on, Demo speichert nicht) | ✅ (3.23.0, im Add-on) |

### 13. Import eines Hauses mit Keller, Anbau und Dachgeschoss
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 13.1 | JSON-Import (Prüfen, dann Importieren) läuft ohne Fehler und ohne Warnungen durch | ✅ |
| 13.2 | Es entsteht ein neues Haus mit allen Etagen (Keller, Erdgeschoss, Obergeschoss, Dachgeschoss) | ✅ |
| 13.3 | Räume, Türen und Fenster liegen an den richtigen Stellen | ✅ (2026-10-17) |
| 13.4 | Das bestehende Haus bleibt unverändert, Umschalten über die Hausauswahl geht | ✅ (2026-10-17) |
| 13.5 | Treppen fehlen beim Import und lassen sich im Editor zeichnen | ✅ (2026-10-17) |

### 14. Erdreich unter Anbauten ohne Keller (Fehler #93)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 14.1 | Gesamtansicht, Kamera so drehen, dass der Erdschnitt sichtbar ist | ✅ (3.22.0, im Add-on) |
| 14.2 | Unter einem Anbau ohne Keller (z. B. Garage) ist kein Hohlraum im Boden, darunter ist Erde | ✅ (3.22.0, im Add-on) |
| 14.3 | Der Keller wird im Schnitt weiterhin richtig angezeigt | ✅ (3.22.0, im Add-on) |
| 14.4 | Ein Haus ohne Keller zeigt weiterhin den Boden ohne Schnitt | ✅ |

### 15. Dachgröße von Hand (3.22.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 15.1 | Im Panel des Dach-Stockwerks gibt es den Haken „Größe selbst festlegen" | ✅ |
| 15.2 | Mit dem Haken erscheinen Links, Oben, Breite und Tiefe, das Dach ändert sich sofort in 3D | ✅ |
| 15.3 | Das Dach lässt sich so verkleinern, dass der Anbau (Garage) nicht mehr darunter liegt | ✅ |
| 15.4 | Haken entfernen: die Größe ist wieder automatisch | ✅ |
| 15.5 | Nach dem Neuladen bleibt die Größe erhalten (nur im Add-on) | ✅ |
| 15.6 | JSON-Import mit `roof.box` | ❓ |

### 16. Wiederholung der drei Fehler (3.22.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 16.1 | Pfeiltasten ohne Auswahl wechseln die Etage, mit Auswahl verschieben sie das Objekt (#98) | ✅ |
| 16.2 | Schalter „Etagen im Plan" im Menü „Ansicht": in reinem 3D nicht da, in 2D und 2D+3D da (#99) | ✅ |
| 16.3 | „Datei erstellen / speichern" ändert das Design nicht (#100) | ✅ |
| 16.4 | Demo mit zwei Dachgauben im Beispielhaus | ✅ |

### 17. Werkzeugleiste anpassen und Raumliste nach Haus (3.23.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 17.1 | Knopf ✎ am Ende der Werkzeugleiste öffnet „Werkzeuge anpassen" | ✅ |
| 17.2 | Werkzeuge ausblenden, umsortieren (▲ / ▼) und ins Menü „Mehr ▾" einklappen | ✅ |
| 17.3 | Die Auswahl bleibt nach dem Neuladen erhalten | ✅ |
| 17.4 | „Auswählen" lässt sich nicht ausblenden, „Zurücksetzen" stellt den Standard wieder her | ✅ |
| 17.5 | Knopf „Gauben" springt zum Dach-Stockwerk und zum Abschnitt Dachgauben | ✅ |
| 17.6 | Knopf „Haus importieren" liegt standardmäßig im Menü „Mehr" | ✅ |
| 17.7 | Benutzer & Tablets: Raumliste nach Haus gruppiert, mit Etage dahinter | ✅ |

### 18. Automatische Sicherung (3.24.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 18.1 | „Häuser & Backup“ zeigt den Abschnitt „Automatische Sicherung“ | ✅ |
| 18.2 | „Jetzt sichern“ legt eine Datei an, sie steht in der Liste (Art „von Hand“) | ✅ |
| 18.3 | Die Datei liegt im Ordner `addon_configs/…_floorplan3d/backups` | ✅ |
| 18.4 | „Neueste prüfen“ meldet, wie viele Häuser, Bilder und Modelle die Sicherung enthält | ✅ |
| 18.5 | „Automatisch sichern“ einschalten, Abstand, Tage und Anzahl einstellen, nach dem Neuladen stehen die Werte noch | ✅ |
| 18.6 | Mit kurzem Abstand (1 Stunde) entsteht nach der Zeit eine automatische Sicherung (Art „automatisch“) | ✅ |
| 18.7 | Alte automatische Sicherungen werden nach den eingestellten Tagen / der Anzahl gelöscht, die neueste und die von Hand bleiben | ✅ |
| 18.8 | „Zurückspielen“ ersetzt Häuser und Einstellungen durch die Sicherung, die Seite lädt neu | ✅ |
| 18.9 | Herunterladen (⬇) und Löschen (×) in der Liste | ✅ |
| 18.10 | Der Schalter „Auto“ im Menü „Ansicht“ lässt die anderen Einstellungen unverändert (Design bleibt) | ✅ |

### 19. Version und Prüfsumme in der Leiste (3.25.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 19.1 | Oben rechts steht die Version mit kurzer Prüfsumme, zum Beispiel „✓ v3.25.0 · a1b2c3d“ | ✅ |
| 19.2 | Die Anzeige ist grün, wenn Add-on und Browser zur Prüfsumme passen | ✅ |
| 19.3 | Ein Klick öffnet die Einzelheiten (Version, Prüfsumme, Add-on, Browser) | ✅ |
| 19.4 | „Jetzt prüfen (auch mit GitHub)“ meldet: gleicher Stand / neuere Version / anderer Stand | ✅ |
| 19.5 | Nach einem Update zeigt sie die neue Version; zeigt der Browser noch alte Dateien, ist sie orange und „Neu laden“ hilft | ✅ |

### 20. Erster Start (3.26.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 20.1 | Auf einer Neuinstallation folgt die Oberfläche der Browsersprache (Einstellung „Auto") | ✅ (2026-10-17) |
| 20.2 | Das Design ist standardmäßig „Dunkel" | ✅ (2026-10-17) |
| 20.3 | Ein leeres Haus zeigt die Willkommenskarte mit drei Knöpfen | ✅ (2026-10-17) |
| 20.4 | „Wände zeichnen" schließt die Karte und wählt das Wand-Werkzeug (2D + 3D) | ✅ (2026-10-17) |
| 20.5 | „Beispielhaus ausprobieren" legt ein neues Haus an und öffnet es | ✅ (2026-10-17) |
| 20.6 | „Haus aus JSON importieren" öffnet den Importdialog | ✅ (2026-10-17) |
| 20.7 | Die Etage heißt je nach Sprache „Ground floor", „Erdgeschoss" und so weiter | ✅ (2026-10-17) |
| 20.8 | Bestehende Installationen behalten Sprache und Design | ✅ (2026-10-17) |

### 21. Neu in 3.26.1 bis 3.27.1

| Nr. | Prüfpunkt | Ergebnis |
| --- | --- | --- |
| 21.1 | Etagen auseinander (Ganzes Haus, „auseinander"): jede Etage hat ihre Lücke, auch das Erdgeschoss hebt sich vom Keller ab (#146) | ✅ (Besitzer, 3.26.1) |
| 21.2 | Versionsanzeige: im Fenster steht „Browser: zeigt genau diese Dateien", auch bei `http://` (#144) | ✅ |
| 21.3 | Einstellungen ⚙ zeigt das Kästchen „Alle 5 Minuten bei GitHub nachsehen …" (#140) | ✅ |
| 21.4 | Sobald es eine neuere Version gibt, wird die Anzeige im Bearbeiten-Modus nach spätestens 5 Minuten blau: „⬆ Neue Version verfügbar" (#140) | ✅ (2026-10-17) |
| 21.5 | Backup-Panel: die Beschriftungen der Zahlenfelder stehen über den Feldern, nicht in einer schmalen Spalte | ✅ |
| 21.6 | Im Protokoll des Add-ons steht beim Start „Starting 3D Floorplan on port 8099 ..." | ✅ |

### 22. Ansicht und Live-Bedienung (3.28.0)

| Nr. | Prüfpunkt | Ergebnis |
| --- | --- | --- |
| 22.1 | Der Knopf „Ansicht" steht unten bei Normal / Temp. / Feuchte / CO₂, sein Menü öffnet sich nach oben (#132) | ✅ |
| 22.2 | Auf dem Handy und Tablet ist unten nichts verdeckt, alle Knöpfe sind erreichbar | ✅ |
| 22.3 | „Halbschnitt": Deckenlampen, LED-Ringe und hoch hängende Bilder verschwinden mit, nichts schwebt über den Wänden (#131) | ✅ |
| 22.4 | Halbschnitt wieder aus: alles ist wieder da | ✅ |
| 22.5 | Einstellungen ⚙ „Wände zur Kamera durchsichtig machen statt absenken": die Wände zur Kamera werden leicht durchsichtig, man sieht den Raum (#129) | ✅ |
| 22.6 | Beim Drehen der Kamera wechseln die durchsichtigen Wände mit (von hinten normal) | ✅ |
| 22.7 | Option aus: die Wände senken sich wie bisher | ✅ |
| 22.8 | Live-Modus: Tippen in einen Raum zoomt hinein, ein zweites Tippen in den Raum geht zurück zur Ansicht davor, zum Beispiel zur Etage (#128) | ✅ |
| 22.9 | Das gilt auch aus der Ganzes-Haus-Ansicht: zurück zeigt wieder das ganze Haus | ✅ |

## 23. Demo-Rundgang für 3.29 bis 3.36 (Besitzer)

Alles lässt sich in der Demo im Browser prüfen: https://burned4aim.github.io/HA-Floorplanner/ . Ergebnis jeweils eintragen (✅ / ❌). Die Demo hat dafür eine Heizung mit Zieltemperatur, ein Stromnetz (Hausanschluss, Zähler, Zählerkasten, Wechselrichter, drei Solarmodule im Garten, rechts neben der Garage) und eine Küchenzeile.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 23.1 | Version oben anschauen | zeigt 3.36.x mit grünem Haken | ✅ |
| 23.2 | Live: Wohnzimmer antippen | Raum-Panel und daneben das **Heizungs-Panel** (21,2 °C, Ziel 22 °C, „heating") | ✅ |
| 23.3 | Im Heizungs-Panel zweimal „+" | Ziel springt auf 23, nach einer kurzen Pause wird gesetzt; „Off" macht die Anzeige grau, Heizkörper links glüht nur bei „heating" | ✅ |
| 23.4 | Ansicht ▴ → „Durchsichtig", dann „Auto" | die beiden schließen sich gegenseitig aus; Wände werden durchsichtig, Dach auch von weitem | ✅ |
| 23.5 | Haus von allen Seiten drehen, unten Kompass ansehen | Kompass dreht mit, jede Außenwand der Erdgeschoss-Seite zur Kamera senkt sich ab | ✅ |
| 23.6 | Bearbeiten: Dachgeschoss öffnen, Gaube setzen | Dach bleibt gut sichtbar, nicht fast unsichtbar | ✅ |
| 23.7 | Bearbeiten: Dachgeschoss → „Weitere Dächer" → „+ Weiteres Dach", Form „Flach", Etage „Erdgeschoss" | ein eigenes Dach über dem Anbau, tiefer als das Hauptdach | ✅ |
| 23.8 | Küche ansehen (3D und 2D) | Küchenzeile aus Modulen (Unterschrank, Spüle, Geschirrspüler, Herd, Kühlschrank) mit Oberschränken | ✅ |
| 23.9 | Küchenzeile anklicken → Form „L-Form", „+ Modul", ein Modul mit ↑/↓ verschieben, „×" | zweiter Schenkel erscheint, Module ändern sich in 2D und 3D | ✅ |
| 23.10 | Werkzeug „Tür/Fenster", in ein sehr kurzes Wandstück klicken | Öffnung wird kleiner gemacht statt abgelehnt (mind. 10 cm) | ✅ |
| 23.11 | Unten „Strom" antippen (Knopf neben CO₂) | orange/grüne Kabel mit fließenden Punkten und Watt-Zahlen (z. B. 1100 W an den Solarmodulen, 3,20 kW am Wechselrichter) | ✅ |
| 23.12 | Werkzeugleiste „Strom-Editor" | nur Strom-Sachen sichtbar und anklickbar, alles andere ausgeblendet; Bibliothek zeigt Kategorie „Strom" | ✅ |
| 23.13 | Strom-Editor: Werkzeug „Kabel", ein Stromgerät, dann ein anderes anklicken | neues Kabel; an einem Gerät lassen sich mehrere Kabel haben | ✅ |
| 23.14 | Stromgerät anklicken → Eigenschaften: Verlauf „Am Boden entlang" / „Durch den Boden" / „Frei in der Luft", „×" | Kabel ändert den Weg, „×" löscht es; unten steht „Kommt von: …" | ✅ |
| 23.15 | 2D-Ansicht im Strom-Editor | orange Linien zwischen den Geräten | ✅ |
| 23.16 | Kamera im Wohnzimmer ansehen | Sichtkegel; rot mit „Bewegung", wenn der Bewegungsmelder an ist (in der Demo ist er an) | ✅ |
| 23.17 | Haus → Grundriss importieren → Export | Strom-Kabel, Küchenzeile und weitere Dächer überleben Export und erneuten Import | ❓ |

**Hinweis zur Kamera und Bewegung:** Der Sichtkegel mit Bewegungsanzeige ist im echten Add-on genauso vorhanden wie in der Demo. Die Demo liefert nur Beispielwerte. Im echten Haus wählst du bei der Kamera in den Eigenschaften „Bewegungsmelder" aus (ein `binary_sensor`), dann färbt sich der Kegel rot.

## Automatisch geprüft (zusätzlich)
- Python: Benutzer werden in `users.json` gespiegelt; Synchronisieren lädt/speichert; frische Installation holt sich Benutzer aus der Datei zurück.
- Browser-Test: Benutzer-Reiter sichtbar für Admins, versteckt für Nur-Lese-Benutzer; nicht mehr im Zahnrad; Tablet speichern; Synchronisieren.

## 24. Treppen: mehrere Etagen, Wandtreppe, Außen-Wendeltreppe (3.40.x)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 24.1 | Bearbeiten, Werkzeug „Treppe" → Typ „Wandtreppe", Feld „Etagen" auf 2 | Hinweis „Weiter an der Wand entlang klicken …" | ✅ (2026-10-17) |
| 24.2 | In der 2D-Ansicht an einer Wand entlang klicken, an der Ecke weiter an der nächsten Wand, zuletzt **Enter** (oder Doppelklick) | Eine Treppe entsteht; ihr Weg liegt genau auf der Wandfläche, in der Ecke ist ein **Podest**; „Esc" bricht ab | ✅ (2026-10-17) |
| 24.3 | 3D ansehen | Dünne Stufenplatten an der Wand, darunter frei; Podest in der Ecke | ✅ (2026-10-17) |
| 24.4 | Eine Etage höher und zwei höher schauen | In jeder Etage, durch die die Treppe geht, ist die Aussparung im Boden (orange gestrichelt), dort darüber nicht mehr | ✅ (2026-10-17) |
| 24.5 | Treppe anklicken → Eigenschaften: „Etagen" auf 1 stellen | nur noch die Etage direkt darüber hat die Aussparung | ✅ (2026-10-17) |
| 24.6 | Treppe anklicken, das weiße Quadrat am Rand der Stufen ziehen | Breite ändert sich | ✅ (2026-10-17) |
| 24.7 | „Stufen nach" links/rechts umstellen | Die Stufen stehen auf der anderen Seite des Wegs | ✅ (2026-10-17) |
| 24.8 | Wandtreppe mit **zwei Knicken** zeichnen (U-förmiger Weg, Podest dazwischen) | Zwei Podeste, die Stufen verteilen sich nach Länge der Abschnitte | ✅ (2026-10-17) |
| 24.9 | Typ „Wendel", „Etagen" auf 2, im Garten neben dem Haus platzieren | Wendeltreppe mit zwei Umdrehungen (eine pro Etage), kein Treppenhaus drumherum | ✅ (2026-10-17) |
| 24.10 | „Gerade", „L" oder „U" mit „Etagen" 2 | Eine lange Treppe über zwei Etagen | ✅ (2026-10-17) |
| 24.11 | Alte Treppen im bestehenden Haus ansehen | Unverändert (Etagen = 1) | ✅ (2026-10-17) |
| 24.12 | Haus → „Dieses Haus als JSON exportieren“, Datei ansehen | Treppen stehen mit `"type": "wall"`, `"floors"` und `"path"` in der Datei, ebenso Blöcke und Bodenöffnungen (3.40.1) | ✅ (2026-10-17) |
| 24.13 | Diese Datei wieder importieren (neues Haus) | Die Treppen sind genauso wieder da | ✅ (2026-10-17) |

## 25. Solarpanels auf dem Dach (3.41.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 25.1 | Bearbeiten, Etage „Dach“ öffnen (gibt es keine: im Etagen-Panel „+ Dach“) | Das Dach ist zu sehen | ✅ (2026-10-17) |
| 25.2 | Aus der Bibliothek (Strom) ein **Solarpanel** auf eine Dachseite setzen | Das Panel liegt flach auf der Dachfläche, schräg wie das Dach, ohne Ständer | ✅ (2026-10-17) |
| 25.3 | Das Panel verschieben, z. B. Richtung Dachrinne oder auf die andere Dachseite | Es bleibt auf dem Dach und kippt auf der anderen Seite mit | ✅ (2026-10-17) |
| 25.4 | Eigenschaften: „Panels nebeneinander“ 4, „Reihen“ 2 | Ein Feld aus 8 Panels mit Montageschienen | ✅ (2026-10-17) |
| 25.5 | Das Panel drehen (Drehung in den Eigenschaften) | Es bleibt flach auf dem Dach liegen | ✅ (2026-10-17) |
| 25.6 | Im Etagen-Panel die Dachform auf „Flachdach“ stellen | Die Panels stehen aufgeständert (schräg zur Sonne) oben auf dem Flachdach | ✅ (2026-10-17) |
| 25.7 | „Montage“ auf „Flach auf dem Dach“ bzw. „Aufgeständert“ | Das Panel liegt flach bzw. steht auf Ständern | ✅ (2026-10-17) |
| 25.8 | Ein Solarpanel in einer normalen Etage (Garten) | Wie bisher auf einem Ständer am Boden; in den Eigenschaften steht, wie man es aufs Dach legt | ✅ (2026-10-17) |
| 25.9 | Haus → Export, Datei ansehen und wieder importieren | `cols`, `rows`, `mount` stehen in der Datei und sind nach dem Import wieder da | ✅ (2026-10-17) |

## 26. Wasser-, Gas- und Wärmezähler (3.42.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 26.1 | Bearbeiten, Bibliothek, im Suchfeld „zähler“ eingeben | Stromzähler, Wasserzähler, Gaszähler, Wärmemengenzähler | ✅ (2026-10-17) |
| 26.2 | Einen Wasserzähler in den Keller setzen | Blauer Zähler mit runder Anzeige auf einem Messingrohr | ✅ (2026-10-17) |
| 26.3 | Gaszähler und Wärmemengenzähler an eine Wand setzen | Beiger Gaszähler mit Zählwerk; kleiner weißer Wärmezähler mit rotem und blauem Rohr | ✅ (2026-10-17) |
| 26.4 | Beim Zähler in den Eigenschaften den passenden Sensor wählen (z. B. `sensor.wasserzaehler`) | Über dem Zähler steht der Stand, z. B. „🚰 1234.6 m³“, „🔥 845.2 m³“, „♨ 5321 kWh“ | ✅ (2026-10-17) |

## 27. Metallbrücke / Übergang (3.43.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 27.1 | Bearbeiten, obere Etage öffnen, Bibliothek „Außen“ → „Brücke / Übergang“ zwischen zwei Gebäudeteile setzen | Eine 3 m lange Metallbrücke mit Gitterboden und Geländer auf beiden Seiten, auf Höhe der Etage | ✅ (2026-10-17) |
| 27.2 | Mit „Drehung“ ausrichten, in den Eigenschaften „Länge“ und „Breite“ ändern | Die Brücke wird länger / breiter, das Geländer passt sich an | ✅ (2026-10-17) |
| 27.3 | Haken „Geländer“ wegnehmen | Nur noch Boden und Träger | ✅ (2026-10-17) |
| 27.4 | Haus → Export und wieder importieren | `len`, `w`, `noRail` stehen in der Datei und sind wieder da | ✅ (2026-10-17) |

**Hinweis:** Zwischen zwei **getrennten** Häusern (zwei Grundrisse in der Häuser-Liste) geht das noch nicht, weil das Programm nicht weiß, wie die Häuser zueinander liegen. Innerhalb eines Grundrisses (Haupthaus und Anbau) funktioniert es.

**Nachtest 3.43.5:** 25.6 bis 25.8 (Ständer enden unter dem Panel; auf dem Schrägdach reichen sie bis aufs Dach), 26.1 bis 26.4 und 27.1 bis 27.4 (Zähler und Brücke sichtbar). Ist der Strom-Editor an und du setzt etwas anderes als ein Stromgerät oder einen Zähler, schaltet er sich aus, und unten steht ein Hinweis.

**Nachtest 3.43.6 (24.9, #209):** Die Wendeltreppe hat eine Stange in der Mitte, dünne Stufen ohne etwas darunter und einen Handlauf außen.

**Nachträge 3.43.7 bis 3.43.10** (gehören nicht zur Brücke, stehen aber hier, weil sie in diesen Versionen kamen):

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 27.5 | Pille „n offen“ antippen und einen Eintrag wählen; ebenso in der Liste „offline“ und bei „Im Plan zeigen“ in der Kamera-Übersicht (3.43.7, #215) | Die Kamera fliegt zum Fenster bzw. zur Tür, ein Ring zeigt die Stelle (wie bei der Suche) | ✅ (2026-10-17) |
| 27.6 | Ansicht „2D + 3D“, oben rechts im Plan „↻ Plan dreht mit“ einschalten, dann die 3D-Ansicht drehen; noch einmal drücken (3.43.8, #212) | Der Plan dreht mit, oben ist immer die Blickrichtung; Schrift lesbar, Klicken und Zeichnen gehen weiter; der zweite Druck stellt den Plan wieder gerade | ✅ (2026-10-17) |
| 27.7 | Ein Ding anklicken, mit **Shift** weitere anklicken (2D und 3D); **Esc**; Shift + Klick auf ein schon ausgewähltes Ding (3.43.9, #211) | Grüner Rahmen um alle, rechts „n ausgewählt“; Esc hebt die Auswahl auf; Shift + Klick nimmt ein Ding wieder heraus (Löschen mit Entf und Strg+Z ist schon mit Punkt 15 oben ✅) | ✅ (2026-10-17) |
| 27.8 | Wandtreppe anklicken, „Podest nach dem Knick“ z. B. 1 m; beim Zeichnen einer Wandtreppe mitten auf einer Geraden einmal zusätzlich klicken (3.43.10, #210) | Nach jeder Ecke bleibt die Treppe 1 m eben; an der zusätzlichen Stelle entsteht ein flaches Podest, danach geht die Treppe weiter | ✅ (2026-10-17) |

## 28. Nachbarhaus und Brücke zur Dachterrasse (3.44.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 28.1 | Im ersten Haus: Bearbeiten → „Häuser & Backup“ aufklappen → „+ Nachbarhaus“ | Eine Karte mit Haus, Lage X, Lage Z, Drehung, Höhe erscheint; das andere Haus steht in 3D da | ✅ |
| 28.2 | Lage X / Z (und falls nötig Drehung) so einstellen, dass das Nachbarhaus wie in echt steht | Es rückt an die richtige Stelle | ✅ |
| 28.3 | „Ganzes Haus“ | Beide Häuser sind ganz zu sehen; die Dachterrasse des Nachbarhauses hat ein Geländer | ✅ |
| 28.4 | Ins 1. OG wechseln, Ansicht „2D + 3D“ | Im Plan ist der Umriss des Nachbarhauses auf dieser Höhe lila gestrichelt | ✅ |
| 28.5 | Die Brücke (Bibliothek „Außen“) im 1. OG zwischen beide Häuser setzen, drehen und Länge einstellen | Sie führt vom eigenen 1. OG auf die Dachterrasse | ✅ |
| 28.6 | Zum Nachbarhaus wechseln (Häuser-Liste) | Es lässt sich dort ganz normal bearbeiten; zurück im ersten Haus ist die Änderung nach dem Neuladen zu sehen | ✅ |
| 28.7 | „Nachbarhaus entfernen“ | Es verschwindet wieder | ✅ |
| 28.8 | Das 1. OG des Nachbarhauses liegt höher/tiefer: beim Nachbarhaus „Höhe“ z. B. 0,40 eintragen, bei der Brücke „Höhenunterschied am Ende“ ebenfalls 0,40 | Die Terrasse rückt hoch, die Brücke steigt gleichmäßig zu ihr an; im Plan zeigt der lila Pfeil auf das Ende mit „+0,40 m“ (3.44.1) | ✅ |

**Jetzt auch in der Demo (3.44.2):** Die Demo hat zwei Häuser. Neben dem Demo-Haus steht das „Nachbarhaus“ (oben in der Häuser-Auswahl), sein 1. OG liegt 0,40 m höher. Von der Dachterrasse des Demo-Hauses führt schon eine Brücke mit „+0,40 m“ hinüber, das Geländer ist an beiden Enden offen. So lassen sich 28.3 bis 28.8 direkt im Browser ausprobieren. Bei 28.6 gilt: Die Demo speichert nichts, nach dem Neuladen ist alles wieder wie am Anfang. Außerdem neu im Demo-Haus: Wasser-, Gas- und Wärmezähler im Keller (26), 10 Solarpanels auf dem Dach (25), eine Wendeltreppe von der Garage hoch auf die Dachterrasse (24.9). Im Nachbarhaus gibt es eine Wandtreppe mit Podest nach dem Knick (24.1, 24.8).

## 29. Treppenhaus, Podest an der Wende, Ausgang auf jeder Etage (3.45.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 29.1 | Bearbeiten, Werkzeug „Treppe“ → „Treppenhaus“, „Etagen“ auf 2, im Plan klicken | Vier Wände mit Raum „Treppenhaus“; vor der Treppe ein Podest, dort die Tür. Dasselbe (Wände, Raum, Tür) auch in den beiden Etagen darüber | ✅ (2026-10-17) |
| 29.2 | 3D ansehen | Auf jeder Etage kommt die U-Treppe an, man kann aufs Podest aussteigen; danach geht es mit der nächsten U-Treppe weiter nach oben | ✅ (2026-10-17) |
| 29.3 | U- oder L-Treppe setzen, in den Eigenschaften „Podest nach dem Knick“ z. B. 0,8 | Das Podest an der Wende wird 0,8 m tiefer, der zweite Lauf rückt weiter | ✅ (2026-10-17) |
| 29.4 | Gerade Treppe mit „Etagen“ 2 | Zwei Läufe übereinander, auf der Etage dazwischen kommt man an (nicht mehr ein langer Lauf) | ✅ (2026-10-17) |
| 29.5 | Haus → Export und wieder importieren | `landing` bleibt bei L- und U-Treppen erhalten | ✅ (2026-10-17) |
| 29.6 | Treppenhaus mit „Etagen“ 2 im Keller setzen, nur den Keller ansehen (nicht „Ganzes Haus“) | Nur der Teil bis zur nächsten Etage ist zu sehen, nichts schwebt darüber; im EG kommt die Treppe an und geht weiter (3.45.1) | ✅ (2026-10-17) |
| 29.7 | Wandtreppe um eine Ecke zeichnen und an der Ecke zweimal knapp hintereinander klicken, „Podest nach dem Knick“ 1 | An der Ecke ein ebenes Podest ohne Stufe dazwischen, die Treppe geht erst danach weiter (3.45.1) | ✅ (2026-10-17) |
| 29.8 | Wendeltreppe (in der Demo: von der Garage auf die Dachterrasse) von oben ansehen | Nach der letzten Stufe ein Viertelkreis-Podest auf Bodenhöhe bis zum Rand der Öffnung, dort steigt man aus; mit der Drehung zeigt es in die gewünschte Richtung (3.45.1) | ✅ (2026-10-17) |

## 30. Live-Modus: weniger aus Versehen antippen (3.45.1)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 30.1 | Live-Modus, auf eine Anwesenheits-Figur tippen | Nichts passiert (kein Fenster), ein Tipp daneben trifft den Raum | ✅ (2026-10-17) |
| 30.2 | Live-Modus, in den roten/blauen Sichtkegel einer Kamera tippen | Die Kamera öffnet sich nicht; ein Licht oder der Raum darunter wird getroffen | ✅ (2026-10-17) |
| 30.3 | Live-Modus, direkt auf die Kamera tippen | Das Kamera-Fenster öffnet sich wie bisher | ✅ (2026-10-17) |
| 30.4 | Live-Modus, auf einen Temperatur- oder CO₂-Sensor tippen (3.46.0) | Nichts passiert; ein Thermostat lässt sich weiter antippen | ✅ (2026-10-17) |

## 31. Treppen über mehrere Etagen, Zähler in der Übersicht (3.46.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 31.1 | Wandtreppe mit „Etagen“ 2 zeichnen | Dieselbe Wandtreppe noch einmal eine Etage höher; auf der Etage dazwischen kommt sie an (kein langer Lauf mehr) | ✅ (2026-10-17) Nachtest nach 3.93.0: geht. Vorher (2026-10-09) war noch ein langer Lauf zu sehen, #318 (gemeint war die Wendeltreppe, ihr Geländer lief durch) |
| 31.2 | Wendeltreppe mit „Etagen“ 2 | Pro Etage eine Umdrehung, auf jeder Etage ein Viertelkreis-Podest zum Aussteigen | ✅ |
| 31.3 | Eine Treppe über 2 Etagen, nur die untere Etage ansehen | Der obere Teil ist durchsichtig zu sehen (ganze Höhe), nicht fest in der Luft | ✅ (2026-10-17) |
| 31.4 | Wasser- und Gaszähler mit Sensor im Haus, oben die Energie-Anzeige ansehen | In einer zweiten Zeile: „🚰 … m³ · 🔥 … m³“ | ✅ |
| 31.5 | Live-Modus ansehen | Über jeder Lampe, Kamera, jedem Schalter usw. schwebt eine kleine Kugel (unter Deckenlampen hängt sie darunter); sie leuchtet in der Lichtfarbe, wenn an. Antippen der Kugel schaltet bzw. öffnet das Gerät | ✅ |
| 31.6 | Brücke: „Höhenunterschied am Ende“ groß machen, z. B. 1,2 m bei 4 m Länge | Statt einer steilen Rampe hat die Brücke Stufen | ✅ |
| 31.7 | Strom-Editor einschalten, dann ein anderes Werkzeug wählen | Der Knopf „Strom-Editor“ bleibt blau, solange er an ist | ✅ |

## 32. Dächer verschieben und ihre Größe ziehen (3.49.0 bis 3.50.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 32.1 | Etage „Dach“, in 3D aufs Dach klicken | Rechts steht „Dach“ mit Ecke und Größe | ✅ |
| 32.2 | Das ausgewählte Dach noch einmal drücken und ziehen (3D) | Es wandert flüssig mit, ohne Ruckeln; die Solarpanels darauf auch (3.49.1) | ✅ |
| 32.3 | Dasselbe im 2D-Plan | Flüssig; das gestrichelte Dach und in 2D + 3D auch das 3D-Dach wandern mit | ✅ |
| 32.4 | Loslassen | Das Dach sitzt genau dort, wo es beim Ziehen war | ✅ |
| 32.5 | Im 2D-Plan an einer Ecke des ausgewählten Dachs ziehen (3.50.0) | Es wird größer/kleiner, die gegenüberliegende Ecke bleibt | ✅ |
| 32.6 | An einer Seitenmitte ziehen | Nur diese Seite wandert | ✅ |
| 32.7 | Eine Seite weit über die andere hinaus ziehen | Das Dach bleibt mindestens 1 m breit/tief | ✅ |
| 32.8 | Strg+Z | Die alte Größe ist zurück | ✅ |
| 32.9 | Ein weiteres Dach (unter „Etage verwalten“ → „+ Weiteres Dach“) auswählen und an den Ecken ziehen | Geht genauso; das Hauptdach bleibt unverändert | ✅ |

## 33. Live-Modus: nur über die Kugel antippen (3.51.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 33.1 | Live-Modus ansehen | Die Kugeln über den Geräten sind deutlich größer als vorher | ✅ |
| 33.2 | Auf eine Lampe selbst tippen (nicht auf die Kugel) | Die Lampe schaltet nicht, es öffnet sich nichts für sie; der Tipp wirkt wie ein Tipp in den Raum | ✅ |
| 33.3 | Auf die Kugel der Lampe tippen | Die Lampe öffnet bzw. schaltet sich wie bisher | ✅ |
| 33.4 | Dasselbe mit Fernseher, Rollladen, Kamera | Nur die Kugel reagiert | ✅ |
| 33.5 | LED-Ring mit mehreren Abschnitten: auf einen Abschnitt tippen | Dieser Abschnitt öffnet sich wie bisher | ✅ |
| 33.6 | Ins Bearbeiten wechseln, auf eine Lampe klicken | Sie wird wie immer ausgewählt (die Regel gilt nur im Live-Modus) | ✅ |

## 34. Ausgebauter Dachstuhl (3.52.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 34.1 | Etage „Dach“, „Etage verwalten“, Haken „Ausgebauter Dachstuhl“ | Feld „Kniestock“ mit 1 m erscheint, das Dach sitzt tiefer (im Dachgeschoss) | ✅ 2026-10-08 |
| 34.2 | Etage „Dachgeschoss“ ansehen, von der Giebelseite | Die Wände enden schräg unter dem Dach, nichts sticht oben heraus | ✅ 2026-10-08 |
| 34.3 | Kniestock auf 1,5 m, dann auf 0,5 m | Das Dach geht hoch bzw. runter, die Schrägen schneiden weniger bzw. mehr ab | ✅ 2026-10-08 |
| 34.4 | Dachform „Walmdach“ | Auch an den Stirnseiten werden die Wände schräg abgeschnitten | ✅ |
| 34.5 | „Ganzes Haus“ | Das Dach sitzt sauber auf dem Dachgeschoss, Gauben und Solarpanels mit | ✅ |
| 34.6 | Etage „Dach“ (Spitzboden): einen Raum zeichnen, ein Gerät hinstellen | Liegt über dem Dachgeschoss, unter dem First | ✅ |
| 34.7 | Haken wieder entfernen | Das Dach sitzt wieder oben drauf, die Wände sind wieder ganz | ✅ |
| 34.8 | Im echten Haus: Kniestock wie bei euch einstellen, Wohnzimmer mit Gauben ansehen | Sieht aus wie in echt (Rückmeldung gern mit Bild) | ✅ |

## 35. Ausgebauter Dachstuhl: Gauben, mehrere Etagen, Firsthöhe (3.53.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 35.1 | Ausgebauter Dachstuhl an, eine Gaube über einer Wand des Dachgeschosses, „Auto“ aus | Die Wand geht unter der Gaube hoch bis unter das Gaubendach, daneben ist sie schräg abgeschnitten | ✅ 2026-10-08 |
| 35.2 | Gaube als „Giebel“ | Unter der Gaube reicht die Wand in der Mitte höher (Spitze) | ✅ 2026-10-08 |
| 35.3 | „Dach beginnt auf Etage“ = Obergeschoss | Das Dach sitzt eine Etage tiefer; Obergeschoss und Dachgeschoss sind an der Schräge abgeschnitten | ✅ 2026-10-08 |
| 35.4 | Wieder das Geschoss direkt darunter wählen | Wie vorher (nur das Dachgeschoss liegt unter der Schräge) | ✅ 2026-10-08 |
| 35.5 | „Firsthöhe“ auf 4 m | Das Dach ist 4 m hoch über der Wand/dem Kniestock, die Neigung wurde angepasst | ✅ 2026-10-08 |
| 35.6 | Haken „Ausgebauter Dachstuhl“ weg | Alles wie vorher: Dach oben drauf, keine abgeschnittenen Wände | ✅ 2026-10-08 |

## 36. Gaubenfenster, Dach über dem Raum, Handy (3.54.0 bis 3.57.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 36.1 | Bearbeiten, Etage „Dachgeschoss“: auf das Fenster einer Gaube klicken | Rechts: Name, Fensterkontakt (auch je Flügel), Fensterart | ✅ 2026-10-08 |
| 36.2 | Kontakt verknüpfen, im echten Haus das Fenster öffnen | Das Gaubenfenster wird rot und kippt auf; es steht in „n offen“, im Raum-Fenster und in der Suche | ✅ 2026-10-08 |
| 36.3 | Gaubenfenster löschen | Die Gaube hat kein Fenster mehr (die Gaube selbst bleibt) | ✅ 2026-10-08 |
| 36.4 | Wand des Raums direkt hinter der Gaube | Das Fenster sitzt in dieser Wand, mit Loch, im Raum sichtbar; die Gaube zeigt von außen ihr Glas | ✅ 2026-10-08 |
| 36.5 | Wand weiter weg: Gaube anklicken, „Vorderseite auf die Wand setzen“ | Die Gaube rutscht an die Wand, das Fenster sitzt darin; die Karte sagt, wo das Fenster sitzt | ✅ 2026-10-08 |
| 36.6 | Live: Raum unter dem Dach antippen | Dachschräge und Gaube über diesem Raum durchsichtig, nur über dem Raum | ✅ 2026-10-08 |
| 36.7 | Live: Etage direkt unter dem Dach öffnen | Das Dach darüber ist durchsichtig zu sehen, mit Gauben | ✅ 2026-10-08 |
| 36.8 | Handy, Live: ☰ oben links antippen, etwas wählen | Liste klappt auf und nach der Wahl wieder zu | ✅ 2026-10-08 |
| 36.9 | iPhone: in die Suche tippen | Kein Hineinzoomen | ✅ 2026-10-08 |
| 36.10 | Handy: Raum antippen | Raum über der Raum-Karte sichtbar, Heizung in der Karte, kein dunkler Kasten | ✅ 2026-10-08 |
| 36.11 | Handy quer | Etagen-Pillen oben, Kompass frei, Knöpfe unten vollständig | ✅ |
| 36.12 | Tablet und PC | Alles wie vorher (die Handy-Änderungen gelten nur für schmale Bildschirme) | ✅ 2026-10-08 |
| 36.13 | Handy: oben ☰, Etagen-Knopf und Zimmer-Knopf; Etage wählen, dann Zimmer wählen | Zwei eigene Listen; die Wahl schließt die Liste, das Zimmer öffnet sich (3.57.1, #281) | ✅ 2026-10-08 |
| 36.14 | Handy hochkant: oben und unten alles ansehen | Alle Anzeigen und Ansichts-Knöpfe sichtbar, in mehreren Reihen, nichts zum Seitwärtsschieben (3.57.2, #284) | ✅ 2026-10-08 |
| 36.15 | Wand anklicken, rechts „Wand teilen“: 0,30 m, dann „3 Teile“; Doppelklick auf die ausgewählte Wand | Ecke genau dort; drei gleiche Stücke; Doppelklick teilt an der Klickstelle, auch über Rasen/Zaun (3.58.0, #286) | ✅ 2026-10-08 |

## 37. Neu in 3.59 bis 3.62

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 37.1 | Handy hochkant, Live | Oben neben Etage und Zimmer ein Knopf **📊**; Antippen zeigt Strom, Wasser/Gas, offline, offen, Kameras als Liste; ist etwas offen oder offline, fällt der Knopf auf (3.59.0, #288) | ✅ |
| 37.2 | Handy hochkant, „Ganzes Haus“ | Die Etagen-Karten sind klein: Name und eine Zeile mit ▦ 💡 🪟 (3.59.1, #290) | ✅ |
| 37.3 | Handy hochkant, „Ganzes Haus“ | Die Karten stehen rechts neben dem Haus, nicht davor (3.59.2, #292) | ✅ |
| 37.4 | Handy, „Ganzes Haus“, weit hineinzoomen und wieder heraus | Die Karten bleiben neben dem Haus (dürfen aus dem Bild rutschen), beim Herauszoomen kommen sie zurück (3.60.1, #294) | ✅ |
| 37.5 | Unten „Ansicht“ → „⏱ Leistung“: aus / FPS / alle Werte | FPS oben rechts im 3D-Bild (💤 in Ruhe); „alle Werte“ zeigt mehr Zahlen; die Anzeige stört kein Antippen; bleibt nach Neuladen so (3.60.0) | ✅ |
| 37.6 | Oben „Benutzer“ → bei einem Benutzer „⚙“ → „🔒 Gesperrt“, Haken setzen | Die Haken bleiben gespeichert; mit diesem Benutzer angemeldet sind die Dinge weg (Wirkung nur im Add-on prüfbar, in der Demo gibt es nur einen Benutzer) (3.61.0) | ❓ |
| 37.7 | Bearbeiten, „Auswählen“, Ansicht **2D** oder **2D + 3D**: mehrere Dinge mit Strg/Shift + Klick (oder Strg/Shift + Rahmen) wählen, dann eins davon **ohne** Strg/Shift ziehen | Alle wandern zusammen und bleiben ausgewählt; angehängte Wände dehnen sich mit, Türen/Fenster wandern mit ihrer Wand; in 2D + 3D zieht das 3D-Bild mit (3.62.0) | ✅ |
| 37.8 | Danach Strg+Z; dann nur auf eins der Ausgewählten **klicken** (nicht ziehen) | Strg+Z holt alles in einem Schritt zurück; der Klick wählt nur dieses eine | ✅ |

## 38. Neu in 3.66

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 38.1 | Live, schräg von oben auf einen Raum mit vielen Lampen schauen (Stehlampe vor einer Deckenlampe), dann drehen und zoomen | Die runden Kugeln liegen nicht mehr aufeinander, sie rücken auf dem Bildschirm auseinander und bleiben nahe bei ihrem Gerät (#314) | ✅ (2026-10-17) |
| 38.2 | Ansicht einstellen (z. B. „Ganzes Haus“ oder ein Raum, Blickwinkel), dann ⚙ → „Wandtablet“ → „📌 Aktuelle Ansicht übernehmen“; Seite neu laden | Daneben steht „Gespeichert: …“; nach dem Neuladen öffnet sich genau diese Ansicht (#315) | ✅ (2026-10-17) |
| 38.3 | ⚙ → „Automatisch“, neu laden | Wieder der alte Start (Erdgeschoss bzw. Raum des Benutzers) | ✅ (2026-10-17) |
| 38.4 | „Benutzer“ → bei einem Benutzer „Start: aktuelle Ansicht übernehmen“ | Steht danach auf „Start: gespeicherte Ansicht“; dieser Benutzer startet dort und das Wandtablet kehrt dorthin zurück (Wirkung nur im Add-on) | ✅ (2026-10-17) |
| 38.5 | Oben 🛡️ Sicherheit, einen Tag abspielen | Die Leiste unten geht über die ganze Breite (#316) | ✅ (2026-10-17) |
| 38.6 | Oben „🗄️ Backup“ | Ein Fenster mit Backup, automatischer Sicherung und Sicherheit; in der Seitenleiste heißt der Abschnitt nur noch „Häuser“ (#321) | ✅ (2026-10-17) |
| 38.7 | Im Backup-Fenster unter „Sicherheit“ | Liste der aufgezeichneten Tage, je Tag ▶ (abspielen) und ⬇ (Datei herunterladen); „Tage behalten“ ändern bleibt gespeichert (#317, nur im Add-on mit Aufzeichnung) | ✅ (2026-10-17) |
| 38.8 | Bearbeiten, „2D + 3D“, Werkzeug „Treppe“ oder „Gerät“ | Rechts in 3D keine große dunkle Fläche mehr; Rasen sichtbar mit leichtem Raster darüber (#320) | ✅ (2026-10-17) |

## 39. Neu in 3.67
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 39.1 | Bearbeiten, einen LED-Ring (indirekt) auswählen, „Anzahl Abschnitte“ z. B. 4, „Gleichmäßig verteilen“ | Im 2D-Plan hat jeder Abschnitt eine eigene, helle Farbe (Linie und Nummer); in den Eigenschaften hat jeder Abschnitt links einen Rand in derselben Farbe (#325) | ✅ (2026-10-17) |
| 39.2 | Dasselbe in 3D anschauen, dann einen Abschnitt einschalten und in den Live-Modus wechseln | In 3D sind die ausgeschalteten Abschnitte leicht in ihrer Farbe getönt; der eingeschaltete leuchtet in seiner Lichtfarbe; im Live-Modus sind keine Markierungsfarben zu sehen | ✅ (2026-10-17) |

## 40. Neu in 3.69: Rollläden an den Fenstern
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 40.1 | Bearbeiten, Erdgeschoss, ein Fenster ohne Rollladen anklicken (z. B. im Bad); in den Eigenschaften den Haken „Rollladen“ setzen, dann wieder entfernen | Mit Haken erscheint darunter das Feld „Rollladen-Entität“ (zeigt die Rollläden aus Home Assistant), im 2D-Plan eine gestrichelte Linie außen am Fenster; ohne Haken ist beides wieder weg (#331) | ✅ (2026-10-17) |
| 40.2 | Erdgeschoss in 3D: Küchenfenster und Schlafzimmerfenster anschauen (von innen und von außen) | Küche: der Rollladen ist ganz unten (zu); Schlafzimmer: gut zur Hälfte unten (40 % offen); der Rollladen hängt außen vor dem Glas. Über jedem dieser Fenster steht ein Schild „↕ Geschlossen“ bzw. „↕ 40 % offen“ | ✅ (2026-10-17) |
| 40.3 | Live, Erdgeschoss: die Kugel 🪟 unter dem Küchenfenster antippen, „Hoch“ drücken, danach den Schieber in die Mitte ziehen | Eine Karte „Fenster Küche“ mit „🪟 Rollladen“, Hoch / Stopp / Runter und Schieber; nach „Hoch“ fährt der Rollladen in 3D sichtbar hoch, die Karte und das Schild über dem Fenster zeigen „Offen“; mit dem Schieber in der Mitte fährt er bis zur Hälfte runter und das Schild zeigt „↕ 50 % offen“ | ✅ (2026-10-17) |
| 40.4 | Live, in die Küche tippen (Raum-Karte) | Unter „ROLLLÄDEN“ steht „Fenster Küche“ mit Öffnen / Stopp / Schließen; unter „FENSTER“ steht weiter der Fensterkontakt. Oben bei „n offen“ zählt ein offener Rollladen nicht als offenes Fenster | ✅ (2026-10-17) |
| 40.5 | Etage „Dach“: das Gaubenfenster anklicken (Bearbeiten), dann im Live-Modus seine Kugel 🪟 antippen und „Runter“ drücken | Bearbeiten: Haken „Rollladen“ ist gesetzt, Entität „Rollladen Gaube“. Live: die Karte „Gaubenfenster“ öffnet sich, der Rollladen der Gaube fährt herunter | ✅ (2026-10-17) |
| 40.6 | Live, Ansicht 2D, Erdgeschoss | Außen an Küche und Schlafzimmer steht „↕ Geschlossen“ bzw. „↕ 40 % offen“; beim Küchenfenster steht der Text des Fensterkontakts darunter, nichts liegt übereinander; ein Tipp aufs Fenster öffnet die Karte mit dem Rollladen | ✅ (2026-10-17) |

## 41. Neu in 3.70: Rollladen-Karte
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 41.1 | Live, Erdgeschoss, schräg von oben auf das Küchenfenster schauen | Die Kugel 🪟 sitzt **über** dem Fenster (dort, wo der Rollladen sitzt), nicht darunter; das Schild „↕ Geschlossen“ steht über der Kugel (#335) | ✅ (2026-10-17) |
| 41.2 | Die Kugel 🪟 über dem Küchenfenster antippen | Eine Karte „🪟 Rollladen · Fenster Küche“ öffnet sich: groß „Geschlossen“, daneben ein hoher Schieber mit dem Panzer, Hoch / Stopp / Runter und darunter 0 % / 25 % / 50 % / 75 % / 100 %. **Kein** Fensterkontakt („Fenster · Offen · binary_sensor…“) in der Karte | ✅ (2026-10-17) |
| 41.3 | Am Schieber mit dem Finger den Panzer nach oben bis etwa zur Mitte ziehen und loslassen | Beim Ziehen zeigt die Karte groß die Prozent („50 % offen“); nach dem Loslassen fährt der Rollladen in 3D bis dorthin, das Schild über dem Fenster zeigt dasselbe | ✅ (2026-10-17) |
| 41.4 | „75 %“ antippen, dann „100 %“, dann „▼ Runter“ | Der Rollladen fährt jeweils dorthin; die gewählte Stufe ist blau markiert; nach „Runter“ ist er ganz zu | ✅ (2026-10-17) |
| 41.5 | Am Handy hochkant: die Karte offen lassen und unten auf „Ansicht ▴“ schauen | Die Karte steht **über** den Knöpfen unten (Normal, Temp., Feuchte, CO₂), nichts davon verdeckt die Karte | ✅ (2026-10-17) |

## 42. Neu in 3.71: lange Schleppgaube
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 42.1 | Bearbeiten, Etage „Dach“, „Etage verwalten“: bei einer Gaube „Dachform der Gaube“ auf „Schleppgaube“ stellen | Neue Felder „Neigung der Gaube (°)“ (15) und ein Hinweis erscheinen; „Abstand zur Traufe“ springt auf den Überstand (0,4 m). In 3D: die Vorderwand steht auf der Außenwand und geht senkrecht hoch, das Dach der Gaube läuft flacher nach oben ins Hauptdach, unter dem First (#339) | ❓ |
| 42.2 | „Breite“ auf 6 m (oder mehr als 5 m) stellen | Die Gaube wird so lang, sie bleibt auf dem Dach und unter dem First; eine Sattelgaube bliebe höchstens 5 m breit | ❓ |
| 42.3 | „Abstand vom Giebel“ auf 3 m stellen, danach die „Breite“ ändern | Die Gaube beginnt 3 m vom Giebel links (bzw. oben) im Plan; beim Ändern der Breite bleibt ihr Anfang stehen, der Schieber „Position am First“ wandert mit | ❓ |
| 42.4 | „Neigung der Gaube“ auf 8 und dann auf 25 stellen, danach „Höhe der Wand“ sehr hoch (z. B. 3 m) | Das Gaubendach wird flacher bzw. steiler. Ist die Wand zu hoch für die Neigung, wird zuerst das Gaubendach flacher (das Feld zeigt den benutzten Wert), erst dann die Wand niedriger; nichts ragt über den First | ❓ |
| 42.5 | Haken „Ausgebauter Dachstuhl“ setzen (Kniestock), dann die Etage darunter öffnen | Unter der Schleppgaube gehen die Wände gerade hoch bis unter ihr schräges Dach; daneben werden sie an der Dachschräge abgeschnitten | ❓ |
| 42.6 | Mit der Kamera nah an eine Gaube (auch eine normale) heran, oder einen Raum unter einer Gaube öffnen | Die Schräge des Hauptdachs läuft **nicht** mehr quer durch den Raum unter der Gaube: dort hat das Dach ein Loch, das Gaube und Gaubendach schließen | ❓ |

## 43. Neu in 3.72: Fenster der Räume durch die Schleppgaube
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 43.1 | Schleppgaube auf der Außenwand (42.1), Haken „Fenster“ aus. Etage darunter öffnen, Werkzeug „Tür/Fenster“: in die Wand unter der Gaube zwei Fenster setzen (z. B. eines pro Raum), Sims etwa 1,2 m | Von außen (Ganzes Haus oder Live) sind beide Fenster **durch die Gaube** zu sehen, mit Rahmen und Glas; die Gaube hat dort keine geschlossene Wand mehr (#341) | ❓ |
| 43.2 | Eines der Fenster anklicken, Kontakt und Haken „Rollladen“ mit Entität setzen | Es ist ein normales Fenster: Kontakt, offen = rot, Rollladen fährt außen vor dem Glas, Kugel 🪟 im Live-Modus | ❓ |
| 43.3 | Live: in den Raum tippen (Raum-Karte), oben auf „n offen“ schauen | Das Fenster steht beim richtigen Raum, ein offenes Fenster zählt bei „n offen“ | ❓ |
| 43.4 | Ein Fenster in der Wand verschieben oder löschen | Das Loch in der Gaube wandert mit bzw. ist wieder zu | ❓ |

## 44. Neu in 3.73: Dach mit Absatz (Haus vorne schmaler, hinten breiter)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 44.1 | Bearbeiten, Etage „Dach“, Ansicht 2D: das Dach anklicken, dann Doppelklick auf eine lange Dachkante | An der Stelle wird die Kante geteilt: auf beiden Teilen erscheint eine **Raute** (#342) | ❓ |
| 44.2 | Die Raute eines Teils nach innen oder außen ziehen | Die Kante dieses Teils wandert in 5-cm-Schritten mit (Alt: frei); beim Loslassen ist das Dach in 3D an dieser Stelle schmaler bzw. breiter, der First bleibt gerade und gleich hoch, am Absatz schließt ein kleines Dreieck die Lücke | ❓ |
| 44.3 | Strg+Z, dann Doppelklick auf eine Raute | Strg+Z nimmt das Ziehen zurück; der Doppelklick nimmt den Absatz wieder weg | ❓ |
| 44.4 | „Etage verwalten“ aufklappen, Abschnitt „Absätze“: Seite, „Ab (Abstand vom Giebel)“ und „Nach außen“ ändern, „+ Absatz“, × | Das Dach ändert sich passend; „+ Absatz“ legt einen auf Seite A in der Hausmitte an (50 cm nach außen) | ❓ |
| 44.5 | „Ausgebauter Dachstuhl“ an, die Etage darunter öffnen; eine Gaube und ein Solarpanel auf den breiten Teil setzen | Die Wände werden an der richtigen Dachfläche abgeschnitten; Gaube und Panel sitzen auf der flacheren Fläche des breiten Teils | ❓ |
| 44.6 | Dachform „Walmdach“ wählen | Statt der Absätze steht ein Hinweis (nur Sattel- und Flachdach); das Walmdach bleibt rechteckig | ❓ |

## 45. Neu in 3.74: Schleppgaube bis zur Kante, Ecken einzeln ziehen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 45.1 | Bei einer Schleppgaube „Abstand vom Giebel“ auf 0 stellen (oder den Schieber ganz an den Rand), dann von der Giebelseite schauen | Vorderwand, Seitenwand und Dach der Gaube enden genau an der Dachkante, kein Abstand; Giebel und Gaubenseite sind eine Fläche (#345) | ❓ |
| 45.2 | Die Gaube so breit machen, dass sie bis zum anderen Giebel reicht | Auch dort bündig bis an die Kante | ❓ |
| 45.3 | Dach mit Absatz (44.1), Ansicht 2D: das Dach anklicken und einen **Kreis** an einem Absatz ziehen, längs und quer | Der Absatz wandert längs mit, die Kante dieses Stücks quer (5-cm-Schritte); beim Loslassen folgt das Dach in 3D; Strg+Z nimmt es zurück | ❓ |

## 46. Neu in 3.75: Karte für das Dashboard (46.1 in der Demo, der Rest nur in Home Assistant)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 46.1 | Demo mit der Adresse `https://burned4aim.github.io/HA-Floorplanner/?card=1&floor=house&heatmap=temp&theme=light` öffnen, Fenster schmal und niedrig ziehen; danach `…/?card=1&floor=1&show_bar=0&show_nav=0` | So sieht das Haus später in der Karte aus: ganzes Haus, hell, Temperaturfarben, keine Werkzeugleiste, die Farbskala verdeckt den Kompass nicht; die zweite Adresse zeigt das Obergeschoss ohne Knöpfe oben und unten | ❓ |
| 46.2 | HACS → ⋮ → Benutzerdefinierte Repositories: `https://github.com/BuRnEd4AiM/HA-Floorplanner`, Typ „Dashboard“; „3D Floorplan Card“ herunterladen, Browser neu laden | HACS lädt die Karte und trägt sie selbst als Ressource ein (#13) | ✅ (2026-10-11) mit 3.75.1: die Karte ist geladen, ihr Editor öffnet sich (mit 3.75.0 fehlte sie, #348) |
| 46.3 | Dashboard bearbeiten → „Karte hinzufügen“, nach „3D Floorplan“ suchen | Die Karte steht in der Liste; nach dem Hinzufügen zeigt sie das Haus live, ohne Werkzeugleiste | ❌ (2026-10-11) die Karte steht in der Liste, sagt aber „Das Add-on 3D Floorplan wurde nicht gefunden“ (#352, Home Assistant 2026.2 und neuer). Behoben in 3.77.1: in HACS die Karte auf 3.77.1 aktualisieren, Strg+F5, noch einmal prüfen |
| 46.4 | Im Editor der Karte „Etage“ aufklappen | Die Etagen und Räume des eigenen Plans stehen zur Auswahl, dazu „Ganzes Haus“; die Vorschau wechselt auf die gewählte Etage | ❓ |
| 46.5 | In der Karte eine Lampen-Kugel antippen, schalten; in einen Raum tippen | Die Live-Karte öffnet sich und schaltet die Lampe; der Raum öffnet sein Raum-Fenster (mit „Raum-Fenster“ aus: nur hineinzoomen) | ❓ |
| 46.6 | „Design“ auf „Wie Home Assistant“, dann im Profil von Home Assistant zwischen dunkel und hell wechseln | Die Karte wechselt mit (dunkel / hell); das Add-on selbst behält sein Design | ❓ |
| 46.7 | „Raumfarben“ auf „Temperatur“, „Leiste oben“ und „Leiste unten“ aus | Die Karte startet mit den Temperaturfarben, ohne Knöpfe oben und unten | ❓ |
| 46.8 | Ein Sections-Dashboard: die Karte größer und kleiner ziehen; ein anderes Dashboard mit „Bildschirm füllen“ | Die Ansicht füllt immer die ganze Karte, ohne Ränder oder Balken | ❓ |
| 46.9 | Das Add-on anhalten, das Dashboard neu laden; danach wieder starten | Die Karte sagt „Das Add-on 3D Floorplan läuft nicht …“; nach dem Start erscheint das Haus von selbst (bis zu einer halben Minute) | ❓ |

## 47. Neu in 3.76: Durchsichtig nur die Wand
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 47.1 | Unten „Ansicht“ → „Durchsichtig“ einschalten, die Kamera langsam um das Haus drehen | Die Wände zur Kamera werden durchsichtig; ihre Fenster (Rahmen, Glas, Rollladen) und Türen (Rahmen, Türblatt) bleiben so sichtbar wie sonst (#350) | ❓ |
| 47.2 | Dabei auf die Möbel hinter der durchsichtigen Wand schauen (Sofa, Schrank, Tisch) | Die Möbel bleiben fest, nicht durchsichtig | ❓ |

## 48. Neu in 3.77: Musterhaus mit allem drin (nur im Add-on, die Demo hat keinen Import)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 48.1 | Bearbeiten, „Häuser“ → „Haus aus JSON importieren …“ → „Beispiel: Musterhaus (alles drin)“ → „Prüfen“ | Grün: 4 Etagen, 23 Räume, 74 Wände, 44 Türen/Fenster, 264 Geräte (seit 3.84 mit den Möbeln im skandinavischen Stil, seit 3.85 mit Sauna, Fitness, Heimkino und Bar im neuen Kellerteil); keine Fehler und keine Hinweise (#353) | ❓ |
| 48.2 | „Importieren“, dann „Ganzes Haus“ | Ein neues Haus „Musterhaus – alles drin“: Keller in der Erde, Erdgeschoss mit Garage, Obergeschoss mit Dachterrasse (Geländer, keine Wände), Satteldach mit drei Gauben und Solaranlage, Gartenhaus mit Walmdach, Pool mit Brücke, Einfahrt mit Auto | ❓ |
| 48.3 | Die Etagen einzeln öffnen und die Treppen suchen | U-Treppe vom Keller bis ins Obergeschoss, L-Treppe von der Werkstatt in die Garage, Wandtreppe vom Wohnzimmer zur Galerie, Wendeltreppe außen an der Garage zur Dachterrasse, Bodentreppe im Kinderzimmer | ❓ |
| 48.4 | Etage „Dach“: die Solaranlage anklicken; dann „Dieses Haus als JSON exportieren“ und die Datei wieder importieren | Die Solaranlage liegt auf der Dachfläche; im wieder importierten Haus ist sie noch da (vorher ging sie verloren) | ❓ |
| 48.5 | „Häuser“ → das Musterhaus löschen | Es ist weg, das eigene Haus bleibt unverändert | ❓ |

## 49. Neu in 3.80: Küchenzeile ohne Oberschrank über einzelnen Modulen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 49.1 | Bearbeiten, die Küchenzeile anklicken; in der Modul-Liste bei einem Unterschrank den Haken neben der Breite wegnehmen | In 3D ist nur der Oberschrank über diesem Modul weg; Unterschrank und Arbeitsplatte bleiben (#372) | ❓ |
| 49.2 | Beim Herd den Haken wegnehmen; beim Kühlschrank nachsehen | Die Haube über dem Herd ist weg; Kühlschrank, Hochschrank und Lücke haben keinen Haken | ❓ |
| 49.3 | Bei einem Modul ohne Oberschrank den Typ (z. B. Schubladen) oder die Breite ändern und es mit ↑/↓ verschieben | Der Oberschrank bleibt weg, er wandert mit dem Modul | ❓ |
| 49.4 | Oben den Haken „Oberschränke“ wegnehmen, dann wieder setzen | Weg: alle Oberschränke sind weg, die Haken in den Zeilen verschwinden; wieder gesetzt: die Oberschränke kommen zurück, nur nicht über den Modulen ohne Haken | ❓ |

## 50. Neu in 3.82: Strom-Rechnung (Reiter „⚡ Rechnung“ im Strom-Editor)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 50.1 | Bearbeiten, oben „Strom-Editor“ drücken | Neben „Kabel“ erscheint der Knopf „⚡ Rechnung“; ohne Strom-Editor ist er nicht da (#378) | ❓ |
| 50.2 | „⚡ Rechnung“ drücken | Ein Fenster „Strom: was ist was und wie wird gerechnet“; oben „So wird gerade gerechnet“: Erzeugung, + Bezug aus dem Netz, − Batterie lädt, = Hausverbrauch (berechnet) mit den Werten von jetzt; bei allem, was nicht eingestellt ist, steht „Automatisch aus dem Plan: …“ mit dem Gerät und seinem Wert | ❓ |
| 50.3 | Die Strom-Anzeige oben links ansehen (Demo: Erzeugung 3,20 kW, Bezug 450 W, Batterie lädt 600 W) | ⌂ zeigt 3,05 kW: die ladende Batterie wird abgezogen (vorher 3,65 kW, #379) | ❓ |
| 50.4 | Bei „Netz“ einen Sensor wählen, dann „Vorzeichen umdrehen“ an- und wieder ausschalten | Unter dem Sensor „jetzt: … → Bezug“ bzw. „→ Einspeisung“; die Rechnung oben und die Anzeige oben links ändern sich sofort mit | ❓ |
| 50.5 | Wenn die Rechnung unter null fällt: „⚠ … unter null“ mit dem Knopf „Vorzeichen am Netz umdrehen“ drücken | Die Warnung ist weg, unten steht „✓ Die Rechnung geht auf.“ | ❓ |
| 50.6 | Bei „Batterie“ den Haken „Batterie im Hausverbrauch mitrechnen“ wegnehmen, dann wieder setzen | Weg: oben „Batterie (nicht mitgerechnet)“, der Verbrauch ist ohne Batterie; wieder gesetzt: wie vorher | ❓ |
| 50.7 | Bei „Räume“ „Vorschlagen“ drücken oder bei einem Raum „+ Sensor hinzufügen …“ (z. B. „Wohnzimmer Leistung“) | Der Raum zeigt den Sensor mit seinem Wert; oben „↳ Raumname“ und „Rest (keinem Raum zugeordnet)“; × nimmt ihn wieder heraus | ❓ |
| 50.8 | Fenster schließen, „Live“, mit der Maus auf die Strom-Anzeige oben links zeigen | Die Anzeige rechnet mit den Einstellungen aus dem Fenster; der Hinweis nennt die Räume und den Rest | ❓ |

## 51. Neu in 3.84: Möbel im skandinavischen Stil
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 51.1 | Bearbeiten, Werkzeug „Gerät“, links die Bibliothek ansehen | Neue Gruppen „Kinder“ und „Flur“; in „Wohnen“, „Küche“, „Bad“, „Schlafen“, „Büro“, „Licht“ und „Deko“ viele neue Teile mit Vorschaubild (Würfelregale, Bücherregale, Sofas, Sessel, Kommoden, Schränke, Schreibtische, Lampen …) | ❓ |
| 51.2 | Im Suchfeld „kallax“ eingeben, dann „billy“, „malm“, „pax“, „poäng“ | „kallax“: die 4 Würfelregale; „billy“: die 2 hohen Bücherregale; „malm“: Bett mit hohem Kopfteil, 2 Kommoden, Nachttisch; „pax“: die 2 Kleiderschränke; „poäng“: der Schwingsessel | ❓ |
| 51.3 | Ein Würfelregal 2×4 in einen Raum setzen, im 2D-Plan nachsehen | In 3D ein weißes Regal mit 8 Fächern (Boxen, Bücher, eine Tür); im 2D-Plan ist das Rechteck so groß wie das Regal (77 × 39 cm) | ❓ |
| 51.4 | Das Regal anklicken, rechts bei „Ausführung“ „Eiche“ wählen, dann „Schwarzbraun“; Strg+Z | Das Regal wird sofort eichenfarben, dann schwarzbraun; Strg+Z holt die vorige Ausführung zurück. Nach dem Neuladen ist die gewählte Ausführung noch da | ❓ |
| 51.5 | Eine „Papier-Hängelampe“ (Gruppe „Licht“) setzen und mit einer Lampe aus Home Assistant verknüpfen, dann „Live“ und die Lampe einschalten | Die Papierkugel hängt unter der Decke und leuchtet, der Raum wird hell wie bei den anderen Lampen | ❓ |
| 51.6 | In der Gruppe „Kinder“ das Hochbett und den Plüschhai setzen | Hochbett mit Leiter und Rausfallschutz, darunter frei; ein kleiner blauer Hai mit weißem Bauch | ❓ |
| 51.7 | Einen Kleiderschrank mit Schiebetüren an eine Wand schieben | Er bleibt an der Wand stehen und lässt sich nicht hineinschieben (Wandstopp) | ❓ |
| 51.8 | Sprache auf Englisch stellen und die Bibliothek ansehen | Alle neuen Teile und die Ausführungen haben englische Namen, z. B. „Cube shelf 2×4“, „Oak“ | ❓ |

## 52. Neu in 3.85: Sauna, Fitness, Bar, Heimkino, PC und Spiegel mit LED-Zonen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 52.1 | Bearbeiten, Werkzeug „Gerät“, links die Bibliothek ansehen | Neue Gruppen „Sauna & Wellness“, „Fitness“, „Bar“ und „Heimkino“, jede mit Vorschaubildern; bei „Büro“ PC, Gaming-PC, PC-Arbeitsplatz, Laptop, Gaming-Stuhl, Netzwerkschrank; bei „Bad“ die LED-Spiegel und der Spiegelschrank | ❓ |
| 52.2 | Eine „Sauna mit Glasfront“ in einen Raum setzen, mit dem Schalter oder Thermostat der Sauna verknüpfen, „Live“, die Sauna einschalten | Holzkabine mit Glasfront und Glastür, innen zwei Bänke und der Ofen; eingeschaltet glühen die Saunasteine orange und das Licht unter der Bank und hinter der Lehne leuchtet | ❓ |
| 52.3 | Bei „Ausführung“ „Thermoholz“ wählen | Die Kabine wird dunkelbraun | ❓ |
| 52.4 | Aus „Fitness“ Laufband, Power Rack und Hantelbank setzen, aus „Bar“ die „Bartheke mit LED“, das Barregal und den Billardtisch | Die Teile stehen in echter Größe im Raum (Billardtisch 2,50 × 1,40 m), im 2D-Plan genauso groß | ❓ |
| 52.5 | Aus „Heimkino“ die „Leinwand mit Rahmen“ an eine Wand setzen und den „Beamer (Decke)“ davor; beide mit dem Beamer oder Mediaplayer verknüpfen, „Live“, abspielen | Die Leinwand rastet an der Wand ein; der Beamer hängt unter der Decke. Beim Abspielen leuchtet die Leinwand hell und die Linse des Beamers | ❓ |
| 52.6 | Den „Gaming-PC mit RGB“ mit dem Schalter des PCs verknüpfen, „Live“, einschalten | Die Lüfter vorne und die Teile hinter dem Glas leuchten lila (oder in der Farbe des Lichts, wenn es ein Licht ist) | ❓ |
| 52.7 | Den „LED-Spiegel mit 3 Zonen“ an eine Wand setzen und anklicken | Der Spiegel rastet flach an der Wand ein; rechts unter „LEDs einzeln verknüpfen“ drei Felder „Hinten (indirekt)“, „Vorne“, „Unten“, jedes mit einem farbigen Streifen; in 3D haben die LEDs genau diese Farben | ❓ |
| 52.8 | Nur das Hauptgerät (oben „Entität“) mit einem Licht verknüpfen, „Live“, einschalten | Alle LEDs des Spiegels leuchten, der Raum wird etwas heller | ❓ |
| 52.9 | Zurück zu „Bearbeiten“, für „Hinten (indirekt)“ und „Unten“ je ein eigenes Licht wählen; „Live“, den Spiegel antippen | Die Karte zeigt „x von 3 LED-Zonen an“ und drei Knöpfe „Hinten (indirekt)“, „Vorne“, „Unten“; ein Knopf öffnet die Steuerung nur dieser LED, „Alle LEDs“ schaltet alle | ❓ |
| 52.10 | Nur das Licht „Hinten“ einschalten, z. B. in Blau | In 3D leuchtet nur der Rand hinter dem Spiegel blau, die anderen LEDs bleiben aus | ❓ |
| 52.11 | Die „Bartheke mit LED“ anklicken, „Thekenkante“ und „Sockel“ mit zwei Lichtern verknüpfen, in „Live“ beide einschalten | Die Kante der Theke und das Licht am Boden vor dem Sockel leuchten jeweils in der Farbe ihres Lichts | ❓ |
| 52.12 | „Häuser“ → „Haus aus JSON importieren …“ → „Beispiel: Musterhaus (alles drin)“ → „Importieren“, dann den „Keller“ öffnen | Rechts neben der Werkstatt ein neuer Kellerteil mit „Sauna & Wellness“, „Heimkino“, „Fitness“ und „Bar“; im Garten Fass-Sauna, Whirlpool und Poolbar | ❓ |

## 53. Neu in 3.86: Bildschirme am Gaming-PC-Arbeitsplatz, große Spiegel mit zwei LEDs
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 53.1 | Den „Gaming-PC-Arbeitsplatz“ (Gruppe „Büro“) setzen und anklicken, rechts bei „Anordnung“ nacheinander alle Möglichkeiten wählen | „2 Monitore nebeneinander“ (so wie bisher), „1 Monitor“, „3 Monitore nebeneinander“ (die äußeren schräg nach innen), „4 Monitore (2 × 2)“ an einem Monitorarm, „Curved-Monitor“ (gebogen), „Curved + 2 hochkant“; bei 3 Monitoren und bei Curved + 2 hochkant wird der Tisch breiter (1,80 m), auch im 2D-Plan | ❓ |
| 53.2 | Eine Anordnung wählen, Strg+Z; dann eine wählen und die Seite neu laden | Strg+Z holt die vorige Anordnung zurück; nach dem Neuladen ist die gewählte noch da | ❓ |
| 53.3 | Die „Spiegelwand mit LED“ und den „Ganzkörperspiegel mit LED“ anklicken, unter „LEDs einzeln verknüpfen“ für „Hinten (indirekt)“ und „Vorne“ je ein Licht wählen, „Live“, beide einzeln schalten | Der Rand hinter dem Spiegel und die zwei Lichtstreifen vorne links und rechts leuchten jeweils mit ihrem eigenen Licht; der Spiegel antippen zeigt zwei Knöpfe | ❓ |

## 54. Neu in 3.87: Fernseher am Schwenkarm, Klimageräte und Ventilatoren
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 54.1 | Den „Wand-TV mit Schwenkarm“ (Gruppe „Wohnen“, Suche „schwenkarm“) nahe an eine Wand setzen | Er springt an die Wand; man sieht die Wandplatte, den Klapparm und den Fernseher ein Stück (15 cm) vor der Wand | ❓ |
| 54.2 | Anklicken, rechts „Schwenken“ auf 30, dann auf −30, „Neigen“ auf 10, „Abstand zur Wand“ auf 0,4 m, „Größe“ auf 75″ | Der Bildschirm dreht sich nach rechts bzw. links (von vorne gesehen), kippt nach unten, steht weiter von der Wand ab, wird größer; der Arm klappt dabei mit aus und der Fernseher stößt nie an die Wand. Beim Schwenken steht unter den Feldern, wie weit er von der Wand absteht | ❓ |
| 54.3 | Bei „Hintergrundlicht (LED hinter dem TV)“ ein Licht wählen, das Licht einschalten, dann schwenken | Der Rahmen hinter dem Fernseher leuchtet in der Farbe des Lichts und dreht sich mit dem Fernseher mit | ❓ |
| 54.4 | Etwas ändern, Strg+Z; dann die Seite neu laden | Strg+Z holt die vorige Stellung zurück; nach dem Neuladen steht er noch so, wie eingestellt | ❓ |
| 54.5 | Links die Gruppe „Klima & Lüftung“ öffnen | Klimagerät (Split, Wand), Klima-Außengerät / Wärmepumpe, mobiles Klimagerät, Klima-Deckenkassette, Deckenventilator mit Licht, Standventilator, Turmventilator, Luftreiniger, Luftentfeuchter, jeweils mit Vorschaubild | ❓ |
| 54.6 | Das Split-Klimagerät an eine Wand setzen, mit dem Thermostat (`climate.…`) verknüpfen, in „Live“ auf Kühlen, dann auf Heizen stellen | Kühlt es, wird die Klappe unten blau, heizt es, wird sie rot; das Display leuchtet, solange es läuft (auch bei nur Lüften oder Entfeuchten); das Schild zeigt die Temperatur | ❓ |
| 54.7 | Ein mobiles Klimagerät an einer Steckdose (`switch.…`) einschalten | Der Luftauslass oben wird blau (es kühlt), das Display leuchtet | ❓ |
| 54.8 | Den Deckenventilator mit seinem Ventilator (`fan.…`) verknüpfen, unter „LEDs einzeln verknüpfen“ bei „Licht“ die Lampe des Ventilators wählen | Die Leuchte unter dem Ventilator folgt ihrem eigenen Licht und erhellt den Raum | ❓ |

## 55. Neu in 3.88: Etagen aufeinander wie ein echtes Haus
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 55.1 | „Ganzes Haus“, unten „Ansicht“ öffnen | Neben „Auseinander“ steht ein Knopf **„Aufeinander“**; in einer einzelnen Etage sind beide nicht da | ❓ |
| 55.2 | „Aufeinander“ drücken, das Haus von der Seite ansehen | Die Etagen sitzen ohne Lücke aufeinander, zwischen ihnen ist eine Decke (ein etwa 40 cm hohes Band in der Fassade), die Wände unter dem Dach reichen bis an das Dach; an der Treppe ist die Decke offen | ❓ |
| 55.3 | Noch einmal „Aufeinander“ drücken; dann „Auseinander“ und danach „Aufeinander“ | Wieder die gewohnte Ansicht (kleine Lücke); „Auseinander“ und „Aufeinander“ lösen sich ab, nur einer ist gedrückt | ❓ |
| 55.4 | „Aufeinander“ an, „Live“, schräg von oben schauen, dann tiefer von der Seite in das Erdgeschoss schauen | Die Kugeln (💡), Schilder (z. B. „22,1 °C“) und Raumnamen vom Erdgeschoss schweben nicht über dem 1. Stock; von der Seite sieht man sie im Erdgeschoss unter der Decke | ❓ |
| 55.5 | Seite neu laden, „Ganzes Haus“; ⚙ öffnen | Das Haus steht wieder „aufeinander“; in ⚙ steht bei „Etagen im ganzen Haus“ „Aufeinander (wie ein echtes Haus)“, dort lässt es sich auch umstellen | ❓ |
| 55.6 | Haus ohne Keller, Erde „fest“: den 1. Stock öffnen (#391) | Das Erdgeschoss darunter ist blass, aber darunter ist Boden (grau), kein schwarzes Loch im Rasen | ❓ |
| 55.7 | Das Erdgeschoss öffnen, dann „Ganzes Haus“ und „Live“ (#392) | Auch die Lampen im 1. Stock haben ihre Kugeln und leuchten, wenn sie an sind; ebenso umgekehrt (erst den 1. Stock öffnen: das Erdgeschoss hat seine Kugeln) | ❓ |

## 56. Neu in 3.89: flüssig auf dem iPad, „Aufeinander“ auch bei einer Etage
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 56.1 | Auf dem iPad das Musterhaus („alles drin“) öffnen, in „Live“ drehen und zoomen, auch in „Ganzes Haus“ (#394) | Es läuft flüssig, ruckelt nicht mehr | ❓ |
| 56.2 | Unten „Ansicht“ → „⏱ Leistung“ auf „alle Werte“ | Bei „Zeichenaufrufe“ stehen im ganzen Haus etwa 1.300 statt früher etwa 3.700 | ❓ |
| 56.3 | Möbel, Bar, Sauna, Küche, Türen, Fenster und Treppen ansehen; eine Lampe, eine LED-Zone, einen Rollladen und eine Tür mit Kontakt schalten | Alles sieht aus wie vorher; was leuchtet, leuchtet; Türen und Fenster gehen auf, Rollläden fahren | ❓ |
| 56.4 | Eine Etage öffnen (z. B. Obergeschoss), unten „Ansicht“ öffnen (#396) | „Aufeinander“ steht da, „Auseinander“ nicht (das gibt es nur in „Ganzes Haus“) | ❓ |
| 56.5 | „Aufeinander“ drücken, von der Seite schauen | Die Etage sitzt ohne Lücke auf der Etage darunter (Decke dazwischen); die Namen und Schilder der Etage darunter schweben nicht mehr über der offenen Etage | ❓ |
| 56.6 | „Benutzer“ → bei einem Benutzer unter „🔒 Gesperrt“ „Abstand der Etagen (Auseinander / Aufeinander)“ abhaken, als dieser Benutzer öffnen | Die Knöpfe „Auseinander“ und „Aufeinander“ fehlen; die Ansicht bleibt so, wie sie eingestellt ist | ❓ |
| 56.7 | README auf GitHub öffnen (#395) | Das Abzeichen „release“ zeigt die Version (v3.89.0), keinen Fehlertext | ❓ |

## 57. Neu in 3.90: Garage, Werkstatt und Carport
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 57.1 | Bearbeiten, Werkzeug „Gerät“, links die Gruppe „Fahrzeuge“ öffnen | Kleinwagen, Limousine, Kombi, SUV, Sportwagen, Pick-up, Transporter / Kleinbus, Kastenwagen (Camper), Wohnmobil, Alkoven-Wohnmobil, Wohnwagen, PKW-Anhänger, Motorrad, Motorroller, Fahrrad, E-Bike, Lastenrad, Aufsitzmäher, Mähroboter mit Ladestation, jedes mit Vorschaubild | ❓ |
| 57.2 | Die Gruppen „Werkstatt“ und „Garage & Carport“ öffnen | Werkstatt: Werkbank (auch mit Lochwand und Licht), Lochwand, Werkstattwagen, Werkzeugschrank, Schwerlastregal, Sichtlagerkästen, Hebebühne, Wagenheber, Kompressor, Standbohrmaschine, Tischkreissäge, Schleifbock, Schweißgerät, Werkstattsauger, Reifenregal, Reifensatz, Stehleiter, zwei Werkstattleuchten, Feuerlöscher, Ölfass, Rollbrett. Garage & Carport: Carport, Doppelcarport, Solarcarport, Mülltonnen, Mülltonnenbox, Fahrradständer, Fahrrad an der Wand, Deckenregal, Metallschrank, Schubkarre, Rasenmäher, Gartengeräte, Hochdruckreiniger, Radstopper | ❓ |
| 57.3 | Im Suchfeld „wohnmobil“, „hebebühne“, „mülltonne“, „kombi“ eingeben | Es werden die passenden Teile gefunden | ❓ |
| 57.4 | Ein Auto und das Wohnmobil in die Garage stellen, von allen Seiten ansehen, im 2D-Plan die Größe ansehen | Sie sind so groß wie in echt (Kombi etwa 4,8 m lang, Wohnmobil 7 m lang und fast 3 m hoch); man sieht Fenster, Räder, Lichter, Spiegel | ❓ |
| 57.5 | Ein Auto anklicken, rechts bei „Ausführung“ eine andere Farbe wählen, Strg+Z; dann eine wählen und die Seite neu laden | Die Farbe wechselt (glänzend wie Autolack); Strg+Z holt die vorige zurück; nach dem Neuladen ist die gewählte noch da | ❓ |
| 57.6 | Das Auto mit einem Schalter verknüpfen, „Live“, ein- und ausschalten | Eingeschaltet leuchten vorne die Scheinwerfer weiß und hinten die Rücklichter rot; ausgeschaltet sind sie dunkel | ❓ |
| 57.7 | Die „LED-Werkstattleuchte“ und die „Werkbank mit Lochwand und Licht“ setzen, mit Lichtern verknüpfen, in „Live“ schalten; die Lochwand, die Sichtlagerkästen und den Feuerlöscher nahe an eine Wand setzen | Die Leuchten und das Licht unter dem Brett der Werkbank leuchten und erhellen den Raum; die Wandteile springen an die Wand | ❓ |
| 57.8 | Im Add-on das Musterhaus („alles drin“) neu importieren, Erdgeschoss öffnen | In der Garage stehen der blaue Kombi, die Werkbank, ein Regal, ein Fahrrad an der Wand; vorne rechts auf dem Grundstück ein Hof mit Carport, Doppelcarport, Solarcarport, Autos, Wohnmobilen, Wohnwagen, Anhänger und einer Limousine auf der Hebebühne | ➖ |

## 58. Neu in 3.91: Messen, Abstand und Winkel zweier Wände
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 58.1 | Bearbeiten, in der 3D-Ansicht die Taste M drücken | Das Werkzeug „Messen“ ist an, es öffnet sich 2D + 3D, rechts steht der Abschnitt „Messen“ mit „Klicke den ersten Punkt“ | ❓ |
| 58.2 | Im 2D-Plan zwei Punkte anklicken (eine Ecke, dann irgendwo); mit Alt gedrückt zwei freie Punkte | Gelbe Linie mit Länge im Plan und im 3D-Bild; rechts die Länge groß, darunter ↔, ↕ und der Winkel; Ecken und Wandflächen rasten ein, mit Alt nicht | ❓ |
| 58.3 | Im 3D-Bild von 2D + 3D zwei Punkte auf dem Boden anklicken | Auch so wird gemessen, die Linie erscheint in beiden Bildern | ❓ |
| 58.4 | Zwei gegenüberliegende Wände eines Raums nacheinander anklicken (auf die Wand, nicht auf die Ecke) | Die erste Wand ist blau gestrichelt, die zweite orange; rechts „Lichter Abstand“ und „Abstand der Wandmitten“, im Plan ein grüner Abstand im rechten Winkel | ❓ |
| 58.5 | Beim „Lichter Abstand“ 4 eintippen, „Setzen“ (oder Enter) | Die orange Wand rückt so, dass zwischen den Wandflächen genau 4,00 m sind; die Wände daneben werden länger / kürzer, der Raum und seine Fläche passen sich an; Türen und Fenster in der verschobenen Wand bleiben drin | ❓ |
| 58.6 | „⇄ Die andere Wand bewegen“, einen Wert setzen; dann Strg+Z | Jetzt bewegt sich die andere Wand; Strg+Z holt den Stand davor zurück | ❓ |
| 58.7 | Zwei Wände in einer Ecke anklicken, beim „Winkel“ 120 setzen, dann 90 | Im Plan steht der Winkel in der Ecke; die zweite Wand dreht sich um die Ecke, bleibt gleich lang, die Wand an ihrem anderen Ende zieht mit; mit 90 ist es wieder rechtwinklig | ❓ |
| 58.8 | Eine gesperrte Wand (in der Objektliste abgehakt) als zweite Wand nehmen und einen Abstand setzen; Esc; ein anderes Werkzeug wählen | Die gesperrte Wand bewegt sich nicht, oben steht ein Hinweis; Esc löscht die Messung; mit einem anderen Werkzeug verschwindet der Abschnitt „Messen“ | ❓ |

## 59. Neu in 3.92: Bar mit Deckenteil
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 59.1 | Bearbeiten, eine „Bartheke über Eck mit LED“ setzen und anklicken | Rechts steht „An der Decke“ mit „Nichts“; darunter ein kurzer Hinweis; bei „LEDs einzeln verknüpfen“ stehen Thekenkante und Sockel | ❓ |
| 59.2 | Bei „An der Decke“ „Gläserregal mit hängenden Gläsern“ wählen, die Bar von allen Seiten ansehen | Über der Theke hängt in L-Form ein Brett mit Stahlrahmen an Stangen von der Decke, darunter zwei Reihen Weingläser kopfüber und ein LED-Streifen; es folgt der Theke genau | ❓ |
| 59.3 | „Deckensegel mit LED“, dann „Pendelleuchten“ wählen | Ein schwebendes Brett in der Farbe der Bar mit Licht oben und Spots unten; dann eine schwarze Schiene an der Decke mit 5 Pendelleuchten (bei der geraden Bar 3) | ❓ |
| 59.4 | Dasselbe mit der geraden „Bartheke mit LED“ | Regal, Segel und Leuchten sind gerade und so lang wie die Theke | ❓ |
| 59.5 | Im 2D-Plan die Bar ansehen, bei den Maßen rechts auf „Höhe“ schauen, an eine Wand schieben | Im Plan ist sie so groß wie vorher; „Höhe“ zeigt die Theke (etwa 1,2 m), nicht die Decke; sie stoppt an der Wand wie vorher | ❓ |
| 59.6 | Bei „LEDs einzeln verknüpfen“ beim „Deckenteil“ ein Licht wählen, ein- und ausschalten | Das Licht des Deckenteils folgt seinem eigenen Licht, die Theke dem Licht der Bar; ohne eigenes Licht leuchtet es mit der Bar | ❓ |
| 59.7 | „Live“, die Bar antippen; danach wieder „An der Decke: Nichts“ wählen | Die Karte hat einen Knopf „Deckenteil“; mit „Nichts“ ist das Deckenteil weg, sein Licht auch, Thekenkante und Sockel bleiben | ❓ |
| 59.8 | Im Add-on das Musterhaus („alles drin“) neu importieren | Über der Bar im Keller hängt ein Gläserregal | ➖ |

## 60. Neu in 3.93: Wiederholen, Kopieren und Einfügen, Schutz beim Speichern, Geländer der Wendeltreppe
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 60.1 | Bearbeiten, oben rechts neben „Speichern“ schauen | Zwei Knöpfe ↶ und ↷, beide grau (es gibt noch nichts rückgängig zu machen) | ❓ |
| 60.2 | Eine Lampe anklicken, mit einer Pfeiltaste verschieben, Strg+Z, dann Strg+Y (oder Strg+Umschalt+Z) (#404) | Strg+Z holt sie zurück, Strg+Y schiebt sie wieder hin; ↶ und ↷ werden je nachdem drückbar oder grau | ❓ |
| 60.3 | Strg+Z, dann etwas anderes ändern, dann Strg+Y | Nach einer neuen Änderung gibt es nichts mehr zu wiederholen (↷ grau) | ❓ |
| 60.4 | Eine Lampe anklicken, Strg+C, dann zweimal Strg+V (#405) | Oben steht „Kopiert: 1“; jede Kopie steht ein Stück weiter rechts unten und ist gleich ausgewählt; sie hat dasselbe Licht verknüpft | ❓ |
| 60.5 | Eine Kopie anklicken, Strg+D, dann Strg+Z | Strg+D verdoppelt sie direkt daneben; ein Strg+Z nimmt die Kopie wieder weg | ❓ |
| 60.6 | Nach Strg+C auf eine andere Etage wechseln, Strg+V | Dieselbe Lampe steht dort an derselben Stelle | ❓ |
| 60.7 | Im 2D-Plan mit Strg + Rahmen einen Raum mit Wänden, Fenstern und Möbeln auswählen, Strg+D | Alles zusammen wird verdoppelt (Wände mit ihren Fenstern, Raum, Möbel), ein Stück versetzt, und ist ausgewählt; es lässt sich gleich zusammen verschieben | ❓ |
| 60.8 | Ein Fenster anklicken, Strg+D, nochmal Strg+D | Ein zweites (drittes) gleiches Fenster in derselben Wand daneben; ist die Wand voll, steht oben „kein Platz in der Wand“ | ❓ |
| 60.9 | Eine Wendeltreppe mit „Etagen“ 2 setzen, „Ganzes Haus“, von der Seite ansehen (#318) | Auf der Etage dazwischen endet das Geländer am Podest und fängt nach dem Podest neu an; der Ausstieg auf die Etage ist frei | ✅ (2026-10-17) |
| 60.10 | Im Add-on den Plan in zwei Fenstern im Bearbeiten öffnen; im ersten eine Lampe verschieben, kurz warten (#403) | Das erste Fenster speichert normal („Gespeichert ✓“) | ➖ |
| 60.11 | Im zweiten Fenster etwas anderes verschieben, kurz warten | Es kommt die Frage „Plan wurde woanders geändert“ mit zwei Knöpfen; Esc schließt sie nicht. „Die andere Version laden“: das zweite Fenster zeigt jetzt die Lampe vom ersten Fenster, die eigene Änderung ist weg | ➖ |
| 60.12 | Noch einmal: im ersten Fenster ändern, dann im zweiten, diesmal „Meine Version behalten“ | Das zweite Fenster speichert über das erste; nach dem Neuladen des ersten Fensters ist dort der Stand vom zweiten | ➖ |

## 61. Neu in 3.94: mehrere Gebäude in einem Plan (#409)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 61.1 | Bearbeiten, rechts „🏘 Gebäude in diesem Plan“ aufklappen | Ein Hinweis, der Knopf „+ Gebäude“ und unten „Anderes Haus hereinholen“ | ❓ |
| 61.2 | Zweimal „+ Gebäude“, die Namen auf „Haupthaus“ und „Gartenhaus“ ändern | Beide stehen in der Liste, oben erscheint die Auswahl „🏘 Alle Gebäude“ | ❓ |
| 61.3 | Bei den Räumen des Erdgeschosses jeweils das Gebäude wählen | Die Räume der oberen Etagen zeigen „automatisch (…)“ mit dem Gebäude des Raums darunter | ❓ |
| 61.4 | Ein Gebäude mit × löschen, dann Strg+Z | Die Räume bleiben, gehören zu keinem Gebäude mehr; Strg+Z holt das Gebäude zurück | ❓ |
| 61.5 | Oben „Gartenhaus“ wählen, dann einen neuen Raum im Gartenhaus zeichnen | Der neue Raum gehört zum Gartenhaus (in der Liste rechts) | ❓ |
| 61.6 | Oben „Gartenhaus“ wählen, in 3D und 2D ansehen | Nur das Gartenhaus mit seinen Räumen, Wänden und Geräten; Gartenmöbel (in keinem Raum) bleiben; das Bild zeigt das Gartenhaus formatfüllend | ❓ |
| 61.7 | Links die Etagen ansehen | Etagen ohne etwas vom Gartenhaus (z. B. das Obergeschoss) fehlen | ❓ |
| 61.8 | „Ganzes Haus“ und „Live“ mit „Gartenhaus“ | Auch dort nur das Gartenhaus; Warnungen (Rauch, Wasser) kommen weiter für den ganzen Plan | ❓ |
| 61.9 | Oben „🏘 Alle Gebäude“, rechts bei den Dächern „🏠 Jedes Gebäude bekommt sein eigenes Dach“ | Jedes Gebäude hat ein eigenes Dach in derselben Form (vorher eins über allen, mit Hinweis) | ❓ |
| 61.10 | „Benutzer“ → bei einem Benutzer ⚙ → „Gebäude“: Gartenhaus wählen, unter „🔒 Gesperrt“ „Gebäude wechseln“ abhaken, als dieser Benutzer öffnen | Er sieht nur das Gartenhaus, die Auswahl oben fehlt | ➖ |
| 61.11 | Dasselbe ohne den Haken „Gebäude wechseln“ | Er startet im Gartenhaus, kann aber oben umschalten | ➖ |
| 61.12 | Unten „Anderes Haus hereinholen“: ein Haus der Liste wählen, „⤵ Hereinholen“ | Es wird ein Gebäude dieses Plans: steht es als Nachbarhaus daneben, genau dort, sonst 3 m rechts daneben; seine Etagen liegen auf den Etagen gleicher Höhe | ❓ |
| 61.13 | Danach Strg+Z | Alles Hereingeholte ist wieder weg; das andere Haus steht weiter in der Häuser-Liste | ❓ |

## 62. Neu in 3.95: Energie leichter einrichten (#407)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 62.1 | Bearbeiten, „Strom-Editor“, daneben „⚡ Rechnung“ | Ganz oben steht „🧭 Einrichten“ mit dem Knopf „⤵ Aus dem Energie-Dashboard übernehmen“ und darunter die Checkliste (✅ eingerichtet, ○ fehlt noch, ⚠ bitte prüfen, ℹ zur Info) | ❓ |
| 62.2 | In der Demo: „⤵ Aus dem Energie-Dashboard übernehmen“ | Die Liste zeigt Netz (Netzbezug), Solar (PV Wechselrichter), Batterie mit „Vorzeichen umgedreht“, Ladestand und drei Zähler | ❓ |
| 62.3 | „✓ Übernehmen“ | Die Zeile darunter sagt „Übernommen: Netz, Solar, Batterie“; unten in den Feldern stehen diese Sensoren, die Rechnung geht auf; Strg+Z nimmt es zurück | ❓ |
| 62.4 | In der Checkliste bei „Zähler“ auf „+ Wasserzähler in den Plan setzen“ | Der Wasserzähler Garten steht in der Mitte der Etage und ist mit seinem Sensor verknüpft; die Zeile wird ✅ | ❓ |
| 62.5 | Im Add-on mit eingerichtetem Energie-Dashboard: „⤵ Aus dem Energie-Dashboard übernehmen“, dann „✓ Übernehmen“ | Netz, Solar und Batterie wie im Energie-Dashboard von Home Assistant; die Rechnung oben stimmt (Batterie „lädt“ / „entlädt“ richtig herum) | ➖ |
| 62.6 | Im Add-on, wenn im Energie-Dashboard nur Zähler in kWh stehen (keine Watt-Sensoren) | Der Vorschlag nimmt den Watt-Sensor am selben Gerät und schreibt „geraten (Sensor am selben Gerät), bitte unten prüfen“ dazu | ➖ |
| 62.7 | Im Add-on ohne eingerichtetes Energie-Dashboard | Die Zeile sagt, dass das Energie-Dashboard noch nicht eingerichtet ist; nichts wird geändert | ➖ |

## 63. Neu in 3.96: mehr Geräte direkt im Plan steuern (#406)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 63.1 | In der Demo „Live“, den **Lautsprecher** im Wohnzimmer (vorne rechts) antippen | Die Karte zeigt „♪ Sommerregen – Die Demo-Band“, die Knöpfe ⏮ ⏸ ⏭, „Aus“, den Lautstärke-Schieber (35 %), 🔈 und „Quelle“ | ❓ |
| 63.2 | ⏭ drücken, dann ⏸, den Lautstärke-Schieber ziehen, die Quelle auf „Radio“ stellen | Der Titel wechselt, ⏸ wird zu ▶, Lautstärke und Quelle bleiben so stehen | ❓ |
| 63.3 | Den **Fernseher** antippen | Auch er hat jetzt ⏮ ⏸ ⏭, Lautstärke und die Quellen (HDMI 1, HDMI 2, Netflix, YouTube) | ❓ |
| 63.4 | Den **Saugroboter** in der Küche antippen, „Saugen“ | Oben steht „🔌 An der Station“, nach „Saugen“ „🧹 Saugt“ und die Knöpfe „Pause“ und „Zur Station“; die Saugstufe lässt sich wählen | ❓ |
| 63.5 | Den **Standventilator** im Wohnzimmer antippen | An / Aus / Umschalten, der Schieber „Stufe“ (springt auf 33, 67 oder 100 %), „↔ Schwenken“ und die Modi Normal / Natur / Nacht | ❓ |
| 63.6 | Die **Alarmanlage** (Schalter rechts im Büro an der Außenwand) antippen, „Scharf (abwesend)“ | Oben steht rot „🛡 Scharf (abwesend)“, darunter ein Feld „Code“ und „Unscharf schalten“ | ❓ |
| 63.7 | Einen falschen Code eingeben und „Unscharf schalten“, dann 1234 | Mit dem falschen Code bleibt sie scharf und unten steht „Aktion fehlgeschlagen“; mit 1234 ist sie wieder „Unscharf“ | ❓ |
| 63.8 | Den **Hausmodus** antippen und „Urlaub“ wählen; die **Heizung** im Wohnzimmer antippen | Der Hausmodus steht auf „Urlaub“; die Heizungskarte hat − / +, die Modi und neu „Vorwahl“ (Eco, Komfort, Abwesend, Boost) | ❓ |
| 63.9 | Im Add-on einen echten Lautsprecher / Fernseher, Saugroboter oder Ventilator mit einem Gerät im Plan verknüpfen und in „Live“ bedienen | Die Knöpfe tun, was sie sagen; Geräte, die etwas nicht können (z. B. kein „Weiter“), zeigen den Knopf nicht | ➖ |
| 63.10 | Im Add-on die echte Alarmanlage verknüpfen, scharf und mit Code unscharf schalten | Wie in Home Assistant; ein falscher Code wird abgelehnt | ➖ |
| 63.11 | „Benutzer“ → bei einem Tablet ⚙ → „🔒 Gesperrt“: „Alarmanlage bedienen“ abhaken, auf dem Tablet die Alarmanlage antippen | Die Knöpfe der Alarmanlage fehlen, alles andere lässt sich weiter schalten | ➖ |

## 64. Neu in 3.97: Alarm per WhatsApp (#414)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 64.1 | Im Add-on ⚙ öffnen, nach unten zu „🚨 Benachrichtigung bei Alarm (WhatsApp)“ | Der Teil ist da (nur für Bearbeiter), aus, alle fünf Melder angehakt | ➖ |
| 64.2 | Auf der Seite von CallMeBot (Link im Teil) den Schlüssel holen; „WhatsApp direkt“, die eigene Nummer mit +49 und den Schlüssel eintragen, „Nachricht bei Alarm senden“ anhaken, „Speichern“ | „Gespeichert. Bereit: bei Alarm kommt eine Nachricht.“ | ➖ |
| 64.3 | „Test senden“ | Nach ein paar Sekunden kommt die WhatsApp „✅ Test: die Alarm-Benachrichtigung vom 3D Floorplan funktioniert.“ | ➖ |
| 64.4 | Einen Rauchmelder mit seinem Testknopf auslösen (oder in Home Assistant den Zustand eines Wassermelders auf „an“ setzen) | Eine WhatsApp „🔥 Rauch erkannt: …“ mit Etage, Raum und Uhrzeit, auch wenn kein Bildschirm offen ist; ein zweites Auslösen gleich danach schickt keine zweite | ➖ |
| 64.5 | Statt WhatsApp „Benachrichtigungsdienst von Home Assistant“ wählen, z. B. die Companion-App (mobile_app_…), „Test senden“ | Die Nachricht kommt auf dem Handy über die App | ➖ |
| 64.6 | Auf einem Tablet, das nicht bearbeiten darf, ⚙ öffnen | Der Teil „Benachrichtigung bei Alarm“ fehlt | ➖ |

## 65. Neu in 3.98: Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste (#418 bis #422)
Vorlage: die Beispielbilder in `docs/ideen-3.98/`. In der Demo zeigt `?skytime=21:30` eine andere Uhrzeit und `?weather=rainy` (oder `snowy`, `cloudy`, `pouring`) ein anderes Wetter, z. B. https://burned4aim.github.io/HA-Floorplanner/?skytime=21:30&weather=snowy
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 65.1 | Demo öffnen, „Live“ | Hinter dem Haus ein Himmel passend zur Uhrzeit statt Schwarz (tagsüber blau); oben rechts z. B. „☀️ Tag · 14:05 · Sonnenuntergang …“ und darunter „⛅ Teilweise bewölkt · 14 °C · Wind 12 km/h“ | ❓ |
| 65.2 | Adresse mit `?skytime=21:30`, dann mit `?skytime=18:05` | 21:30: dunkelblau mit Sternen, der Rasen dunkler, „🌙 Nacht · … · Sonnenaufgang …“; 18:05: lila und orange am Horizont, „Abenddämmerung“ bzw. „Abend“. Die Lampen leuchten **nicht** extra (wie gewünscht) | ❓ |
| 65.3 | Adresse mit `?weather=rainy`, dann `?weather=snowy` | Grauer Himmel, Regen fällt über das Bild, oben „🌧️ Regen · …“; bei Schnee fallen Flocken. Im Bearbeiten-Modus fällt nichts | ❓ |
| 65.4 | ⚙ → „Himmel“ auf „Einfarbig“, dann zurück auf „Nach Uhrzeit und Wetter“ | Einfarbig: der Hintergrund wie früher, keine Anzeigen oben rechts; danach ist der Himmel wieder da | ❓ |
| 65.5 | Mit `?weather=rainy`: oben die rote Warnung „Fenster offen bei Regen · Fenster Wohnzimmer“. Bearbeiten, das Wohnzimmerfenster anklicken, Haken **„Bei Regen warnen“** wegnehmen | Die Warnung verschwindet; Haken wieder setzen: sie ist wieder da | ❓ |
| 65.6 | „Live“ am PC: oben rechts die Karte **„Strom jetzt“** ansehen | Sonne 3.20 kW, Netz 450 W „Bezug vom Netz“, Haus 3.05 kW, Batterie 82 % „lädt 600 W“; Punkte wandern von der Sonne zum Haus und zur Batterie und vom Netz zum Haus; die Zahlenzeile oben links ist weg | ❓ |
| 65.7 | Die Karte antippen, dann „Ansicht“ → „Strom als Bild“ | Antippen: die Strom-Kabel im Haus erscheinen (nochmal: weg). „Strom als Bild“ aus: die Zahlenzeile ist zurück | ❓ |
| 65.8 | „Live“ am PC: unten über „Normal / Temp. …“ die **Raum-Kacheln** | Eine Karte pro Raum: Name, Temperatur (z. B. Wohnzimmer 21,3°), „💡 5 an“ mit farbigem Rand, „🪟 offen“, 👤 im Büro und Wohnzimmer; Räume ohne Licht „aus“ | ❓ |
| 65.9 | Eine Kachel antippen, dann nochmal; „Ganzes Haus“ und eine Kachel aus dem Obergeschoss antippen | Die Kamera fliegt in den Raum, rechts die Raum-Karte; nochmal: zurück. Ganzes Haus: alle Räume mit Etage, der Tipp öffnet die Etage und den Raum | ❓ |
| 65.10 | Am Handy hochkant „Live“ | Die Kacheln sind kleiner und lassen sich zur Seite wischen; oben rechts keine Uhrzeit- und keine Strom-Karte (dort bleibt 📊) | ❓ |
| 65.11 | „Ansicht“ → „Raum-Kacheln“ ausschalten, wieder einschalten | Die Leiste verschwindet und kommt wieder | ❓ |
| 65.12 | Bearbeiten: die Werkzeugleiste oben ansehen | Symbole mit Namen darunter, in Gruppen „ZEICHNEN“, „SETZEN“, „WERKZEUGE“; das gewählte Werkzeug blau; jedes Werkzeug funktioniert wie vorher | ❓ |
| 65.13 | „Mehr“ (⋯) antippen, dann ✎ (Werkzeuge anpassen): ein Werkzeug ausblenden, eins verschieben, „Zurücksetzen“ | „Mehr“ zeigt „Import“; im Anpassen stehen die vollen Namen („Räume erkennen“, „Strom-Editor“); die Gruppen passen sich an, Zurücksetzen stellt alles wieder her | ❓ |
| 65.14 | Im Add-on: Live-Modus mit echtem `sun.sun` und echter Wetter-Entität | Der Himmel passt zur echten Tageszeit, die Anzeige nennt den echten Sonnenuntergang bzw. -aufgang und das echte Wetter | ➖ |
| 65.15 | Im Add-on: ein echtes Fenster, das bei Regen offen bleiben darf, „Bei Regen warnen“ abhaken | Bei Regen keine Warnung für dieses Fenster, die anderen warnen weiter | ➖ |
| 65.16 | Neu in 3.98.1: „Bearbeiten“ am PC | Oben rechts steht auch hier die Karte „Strom jetzt“, die kleine Zahlenzeile ist weg; ein Tipp auf die Karte zeigt die Kabel | ❓ |
| 65.17 | Neu in 3.98.2: die Karte „Strom jetzt“ ansehen, wenn die Batterie weder lädt noch entlädt (im Add-on z. B. nachts bei fast leerer Batterie) | Unter der Batterie steht „ruht · 0 W“ statt nur „Batterie“; meldet die Batterie keine Leistung (kein Leistungs-Sensor eingerichtet), steht dort „kein Leistungs-Sensor“. Lädt sie, steht weiter „lädt … W“ | ➖ |

## 66. Neu in 3.99: echte Böden, dunkle Fensterrahmen, Glas-Optik, Raum-Schilder (#427 bis #430)
Vorlage: die Beispielbilder in `docs/ideen-3.99/` (1, 2, 4 und 5). Die Demo hat die Böden und die anthrazitfarbenen Fensterrahmen schon eingestellt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 66.1 | Demo öffnen, „Live“, Erdgeschoss, nah heranzoomen | Wohnzimmer Parkett (Eiche), Küche helle Fliesen, Bad kleine Fliesen, Schlafzimmer helles Parkett, Büro dunkles Parkett, Garage Beton; die Muster wirken nicht verzerrt | ❓ |
| 66.2 | Unten „Temp.“, dann „Normal“ | Bei „Temp.“ färben sich die Böden nach der Temperatur (ohne Muster), bei „Normal“ sind die Muster wieder da | ❓ |
| 66.3 | „Bearbeiten“, einen Raum anklicken, rechts „Boden“: z. B. „Fliesen anthrazit (60 cm)“, dann „Einfarbig“ | Der Boden wechselt sofort; bei einem Muster verschwindet das Farbfeld, bei „Einfarbig“ ist es wieder da | ❓ |
| 66.4 | „2D“ ansehen | Die Räume haben die Farbe ihres Bodens (Parkett braun, Fliesen hell, Beton grau); auch die kleinen Etagen-Bilder links | ❓ |
| 66.5 | Fenster von außen ansehen | Die Fensterrahmen sind anthrazit, die Wände heller; Türrahmen bleiben weiß. ⚙ → „Fensterrahmen“ → „Weiß“ stellt den alten Look her | ❓ |
| 66.6 | Die Knöpfe unten (Normal, Temp. …), oben (Zimmer, Geräte …) und die Etagen-Karten links ansehen | Leicht durchsichtig wie Milchglas, das Bild scheint verschwommen durch; im hellen Design helles Glas | ❓ |
| 66.7 | „Live“: über den Räumen | Über jedem Raum ein Schild: Name, Temperatur, „💡 5“ wenn Lichter an sind (Rand in Lichtfarbe), 🪟 bei offenem Fenster, grüner Punkt wenn jemand da ist; die Kugeln und Werte der Geräte und die Namen auf dem Boden sind weg (entweder Schilder oder Geräte); die Schilder wandern beim Drehen mit | ❓ |
| 66.8 | „Ansicht“ → „Im Bild: Raum-Schilder“ antippen, dann noch einmal | Es steht „Im Bild: Geräte“: keine Schilder, die Kugeln und Werte der Geräte und die Namen auf dem Boden sind wieder da; noch ein Tipp: wieder die Schilder | ❓ |
| 66.9 | Ein Schild (z. B. „Wohnzimmer“) antippen, dann unten die Kachel des Raums | Der Raum öffnet sich mit seinen Geräten (Kugeln und Werte), keine Schilder; nach dem Kachel-Tipp wieder die Schilder. Bei „Ganzes Haus“ und im Bearbeiten-Modus keine Schilder, dort die Geräte wie bisher | ❓ |
| 66.10 | Am Handy „Live“ | Keine Schilder (dort gibt es die Kacheln), die Namen liegen auf dem Boden | ❓ |
| 66.11 | Im Add-on: eigenen Räumen einen Boden geben, Fensterrahmen auf „Anthrazit“ | Bleibt nach dem Neuladen so; ein Tablet im Sparmodus „Schnell“ zeigt die Böden einfarbig in ihrer Farbe | ➖ |
| 66.12 | Neu in 3.99.1: „Live“, das Bild flach von der Seite drehen (Räume hintereinander) | Die Raum-Schilder liegen nicht übereinander: das hintere rückt nach oben, ein Strich führt zu seinem Raum | ❓ |
| 66.13 | Neu in 3.99.1: oben links und in der Karte „Strom jetzt“ nachsehen | Oben links keine Zeile mit Wasser, Gas und Wärme mehr; die Zähler stehen unten in der Karte „Strom jetzt“ (🚰 1234.6 m³ · 🔥 845.2 m³ · ♨ 5321 kWh). Am Handy bleibt die Zeile | ❓ |
| 66.14 | Neu in 3.99.2: „Live“, links „Ganzes Haus“ (oder das Fenster schmaler machen) | Passen die Raum-Kacheln unten nicht alle hin, ist rechts ein Pfeil ›, der Rand wird weich ausgeblendet; der Pfeil (oder das Mausrad über den Kacheln) schiebt weiter, dann ist links ein Pfeil ‹. Nichts ist einfach abgeschnitten | ❓ |
| 66.15 | Neu in 3.99.2: „Ganzes Haus“ mit der Karte „Strom jetzt“ oben rechts | Die Etagen-Karten (Obergeschoss, Erdgeschoss …) liegen nicht unter der Karte „Strom jetzt“, sondern daneben bzw. auf der anderen Seite des Hauses | ❓ |
| 66.16 | Neu in 3.99.3 (#434): „Live“ auf dem Tablet oder PC, unten „Strom“ **nicht** gedrückt | Oben rechts keine Karte „Strom jetzt“ und auch keine Zahlenzeile oben links | ❓ |
| 66.17 | Unten „Strom“ drücken, dann auf die Karte „Strom jetzt“ tippen | Mit „Strom“ erscheint die Karte (und die Kabel im Haus); ein Tipp auf die Karte schaltet „Strom“ wieder aus, die Karte verschwindet | ❓ |
| 66.18 | Neu in 3.99.4 (#436): auf dem Tablet „Live“, unten eine Raum-Kachel antippen | Die Kachel des Raums bleibt lesbar: Name, Temperatur und Licht stehen hell auf blau getöntem Grund (vorher war sie leer) | ❓ |
| 66.19 | Nachts „Live“ ansehen (in der Demo `?skytime=23:30` an die Adresse hängen) | Viel mehr Sterne, verschieden hell, ein paar leuchten sanft, eine schwache Milchstraße; bei „bewölkt“ scheinen noch einige Sterne durch, die Wolken liegen davor | ❓ |
| 66.20 | „Live“ mit vielen Räumen, das Bild flach von der Seite ansehen (wie auf dem Foto mit den langen Strichen) | Keine Türme aus Schildern mit langen Strichen: höchstens zwei Reihen; Räume ohne Platz zeigen einen kleinen Punkt, ein Tipp darauf öffnet den Raum; beim Heranzoomen werden aus den Punkten wieder Schilder | ❓ |
| 66.21 | Neu in 3.99.5 (#438): am iPhone (auch in der Home-Assistant-App) „Live“, die Raum-Kacheln unten nach links und rechts wischen | Die Leiste folgt dem Finger, ein schneller Wisch gleitet nach; alle Räume sind erreichbar. Ein Wisch öffnet keinen Raum, ein Tipp auf eine Kachel öffnet ihn | ❌ (2026-10-18, ruckelt und bleibt hängen, #441; neu: 66.23) |
| 66.22 | Neu in 3.99.5 (#440): am iPhone „Live“, einen Raum antippen (Kachel unten oder im Bild) | Unten öffnet sich die Raum-Karte, der Raum selbst steht darüber gut sichtbar (nicht dahinter) | ✅ (2026-10-18) |
| 66.23 | Neu in 3.99.6 (#441): am Handy (iPhone, auch in der Home-Assistant-App) „Live“, die Raum-Kacheln unten langsam, schnell und etwas schräg nach links und rechts wischen | Die Leiste läuft flüssig mit dem Finger und bleibt nicht hängen, nach einem schnellen Wisch gleitet sie weich aus; alle Räume sind erreichbar. Ein Wisch öffnet keinen Raum, ein Tipp auf eine Kachel öffnet ihn | ❓ |
| 66.24 | Neu in 3.99.6 (#442): am Handy „Live“, unten „Strom“ drücken, dann auf die Karte „Strom jetzt“ tippen | Oben in der Mitte erscheint die Karte „Strom jetzt“ (Sonne, Netz, Haus, Batterie, darunter Wasser, Gas, Wärme), ganz zu sehen, die Raum-Kacheln bleiben frei; ein Tipp auf die Karte schaltet „Strom“ aus, die Karte verschwindet | ❓ |
