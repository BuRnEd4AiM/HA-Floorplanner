# Testprotokoll

Hier steht, was getestet wurde, wann und von wem. Der Besitzer testet in der **Demo-Datei** (`demo/floorplan3d-demo.html`, erfundene Daten, ohne Home Assistant). Die automatischen Tests laufen bei jeder Änderung.

Legende: ✅ geht · ❌ geht nicht · ❓ noch nicht getestet · ➖ in der Demo nicht prüfbar (nur im Add-on)

## Kurze Prüfliste: nur noch der Feinschliff für dich (Stand 4.67.2, 2026-11-06)

**Am 2026-11-06 hat Claude alles geprüft, was ohne deine echten Geräte geht** (dein Wunsch: „alle Prüfungen, die du machen oder simulieren kannst … dass es nur noch der Feinschliff für mich gibt“): in der Demo (Chromium als PC und als iPhone), im Test-Add-on (das Add-on mit einem nachgebauten Home Assistant: 40 Teile des Browser-Tests mit zusammen über 1.500 Prüfungen, dazu die 606 Server-Tests), dazu jedes neue Video der Anleitung und den Trailer Bild für Bild und die Seiten der Anleitung und des Trailers (aus ihren Zweigen gebaut). Eingetragen als „Claude, 2026-11-06“: von den 199 offenen Punkten (197 ❓, 2 ❌) sind 162 jetzt ✅, übrig sind 37. Dabei gefunden und gleich repariert: nach dem Pultdach waren die Gauben weg und das Dach blieb flach (#669, Version 4.67.2, Abschnitt 163).

Übrig bleibt nur, was **nur du** kannst. Die Nummern führen zu den Tabellen unten.

1. **Auf GitHub und im Store (nur mit deinem Konto):** das Vorschaubild hochladen (160.4 = 162.5: Settings → General → Social preview → `docs/img/social-preview.png`), Beschreibung und Stichwörter eintragen (162.6, `docs/HACS-STORE.md`), im Add-on-Store von Home Assistant nachsehen (162.7).
2. **Gefällt es dir?** Die Videos aus dem Chat (156.3, 161.3, 162.3/162.9), eigene Suchwörter in der Anleitung (151.7), Trailer und ein Clip als Vorschau in Instagram oder TikTok (156.5, 161.5).
3. **Mit echter Sprache:** 🎤 „Welche Fenster sind offen?“ und „Mach das Licht im Bad an“ (96.1, 97.3, 98.2, 105.6). Getippt geht alles.
4. **Mit deinen Geräten, wie flüssig es läuft:** iPad und Wandtablet (56.1, 56.2, 85.1 bis 85.3, 102.1, 108.3), das iPhone in Safari (100.3), Wischen mit dem echten Finger (134.10), Bearbeiten in der Home-Assistant-App am Handy (145.8).
5. **Mit deiner Heizung im echten Betrieb:** ob dein Thermostat bei offenem Fenster wirklich aus geht (123.1, damit auch das alte ❌ 122.3), ob es mit dem Raumfühler die richtige Temperatur zeigt und hält (124.6, 124.7), ob das Bad ruhig bleibt (128.6), ein paar Tage und ein Morgen ohne Überraschung im 🩺 Protokoll (130.5, 132.4). Was das Add-on dabei tut, ist geprüft.
6. **Einzelnes im echten Home Assistant:** die Karte im eigenen Dashboard finden (46.3), Anwesenheit mit deinem Handy im WLAN (89.6), Energie mit dem Energie-Dashboard vergleichen (93.4), die Anleitung „📥 Für ohne Internet speichern“ (141.7, 141.8; das Herunterladen von GitHub ist bei Claude gesperrt).
7. **Neu in 4.68.0: 🪜 Geschosshöhe und L-Treppe mit 2. Ecke** (Abschnitt 164, gefragt von Oely99 in #671): Claude hat 164.1 bis 164.5 geprüft; für dich im Add-on oder mit der Antwort von Oely99 164.6, nach dem Merge das Video 164.7.
8. **Neu in 4.69.0: 🏷 Raumname aus einem Bereich von Home Assistant, ⏱ Uhrzeit beim Ziehen im Heizplan** (Abschnitt 165, dein Wunsch vom 2026-11-07): Claude hat 165.1 bis 165.5 geprüft; für dich im Add-on mit deinen echten Bereichen 165.6 und am Tablet mit dem Finger 165.7, nach dem Merge die Videos 165.8.
9. **Neu in 4.70.0: ⚡ Strom je Gebäude** (Abschnitt 166, dein Wunsch vom 2026-11-07): Claude hat 166.1 bis 166.5 geprüft; für dich im Add-on mit deinen zwei Häusern in einem Plan 166.6, nach dem Merge das Video 166.7.
10. **Neu in 4.70.1: bereit für Home Assistant 2026.11** (Abschnitt 167, deine Frage vom 2026-11-08 zu den neuen Namen): Claude hat 167.1 bis 167.4 geprüft, auch mit einem echten Home Assistant 2026.11.0; für dich nach dem Update im Add-on 167.5, und nur wenn du Geräte mit mehreren Teilen hast 167.6.
11. **Neu in 4.71.0: ⏸️ Heizplan aussetzen und das Gebäude oben auf jeder Seite** (Abschnitt 168, deine Wünsche vom 2026-11-08, #677): Claude hat 168.1 bis 168.5 geprüft (Tausende zufällige Heiz-Tage mit Pausen, Browser-Test, am 2026-11-10 in der Beta-Demo); für dich im Add-on mit deiner Heizung 168.6 und 168.7, mit deinen zwei Häusern 168.8 und 168.9, nach dem Merge die Videos 168.10.
12. **Neu in 4.72.0: 🪟 Fenster mit fester Scheibe unten oder oben** (Abschnitt 169, gefragt von markweiffenbach in #679): Claude hat 169.1 bis 169.5 geprüft (169.3 bis 169.5 am 2026-11-10 in der Beta-Demo); für dich im Add-on mit deinen Fenstern 169.6, nach dem Merge das Video 169.7.
13. **Neu in 4.73.0: ✨ Oberfläche 2** (Abschnitt 170, dein Wunsch vom 2026-11-08): Claude hat 170.1 bis 170.7 geprüft (170.3 bis 170.7 am 2026-11-10 in der Beta-Demo); für dich dein Eindruck 170.8, nach dem Merge das Video 170.9.
14. **Neu in 5.0.0: ✨ Oberfläche 2 komplett** (Abschnitt 171, dein Wunsch vom 2026-11-09): Claude hat 171.1 bis 171.8 geprüft (171.3 bis 171.8 am 2026-11-10 in der Beta-Demo; 171.7, das Seitenfach, gibt es seit 5.4.2 nicht mehr); für dich dein Eindruck 171.9, nach dem Merge die Videos 171.10.
15. **Neu in 5.1.0: 🔺 das neue Dach und 🔒 Räume sperren** (Abschnitt 172, dein Wunsch vom 2026-11-09): Claude hat 172.1 bis 172.12 geprüft (auch alle Schritte in der Demo, am 2026-11-09 auf deine Frage „Kannst du das nicht selber testen?“); für dich nur noch dein Eindruck 172.13 und nach dem Merge die Videos 172.14.
16. **Neu in 5.2.0: Normal und Beta** (Abschnitt 173, deine Frage vom 2026-11-09): Claude hat 173.1 und 173.2 geprüft; für dich nach dem Merge in Home Assistant 173.3 bis 173.9, bei der nächsten Freigabe 173.10.
17. **Repariert in 5.2.1: die große Seitenansicht des Dachs (⤢)** (Abschnitt 174, #684, gefunden beim Durchgehen von 172): Claude hat 174.1 bis 174.4 geprüft (174.4 am 2026-11-10 in der Beta-Demo): nichts mehr für dich.
18. **Repariert in 5.2.2: 🔒 ein Raum allein ohne fremde Streifen, ✨ die Reiter mit Namen, ⚡ Strom-Editor in „Neu“, 🌡 kein Heizungsfenster beim Bearbeiten** (Abschnitt 175, deine Fotos und Meldungen vom 2026-11-09, #686, #687, #689, #690): Claude hat 175.1, 175.2, 175.5 und 175.6 geprüft; für dich nach dem Merge in der Beta am iPad 175.3, 175.4, 175.7 und 175.8.
19. **Verbessert in 5.2.3: ⛰ Keller halb aus der Erde** (Abschnitt 176, #691, Frage von st03psn vom 2026-11-09): Claude hat 176.1 bis 176.4 geprüft; für dich nach dem Merge in der Beta 176.5; die Suche von 176.6 hat Claude am 2026-11-10 geprüft.
20. **Repariert in 5.3.2: 🏗 Terrasse halb auf der Garage, halb frei** (Abschnitt 181, #703 von Miicki vom 2026-11-10): Claude hat 181.1 bis 181.6 geprüft (181.5 in der Beta mit echten Mausklicks, die Suche 181.6 am 2026-11-10); offen ist nur die Antwort von Miicki 181.7.
21. **Neu in 5.4.0: 🌡 woher die Raumtemperatur kommt** (Abschnitt 182, #705 von Miicki vom 2026-11-10): Claude hat 182.1 bis 182.5 geprüft (182.5 in der Beta); für dich im Add-on mit einem eigenen Raum 182.6 (die Suche 182.7 hat Claude am 2026-11-10 geprüft). 5.4.0 ist seit 2026-11-10 für alle freigegeben (dein Wunsch: „in der Beta das alles testen und wenn alles passt es rüber pushen“).
22. **Repariert in 5.4.1: ☀ Solarmodule aus dem Dach-Editor, ✨ Seitenleiste** (Abschnitt 183, #709, deine Bilder vom 2026-11-10): Claude hat 183.1 bis 183.4 geprüft (183.4 am 2026-11-10 in der Beta-Demo, am iPad quer und hochkant und am PC); 183.5 ❌ (das Seitenfach), darum 5.4.2: nichts mehr für dich.
23. **Verbessert in 5.4.2: ✨ ein Reiter springt zu seinem Abschnitt** (Abschnitt 184, deine Wahl D vom 2026-11-10): Claude hat 184.1 bis 184.3 geprüft (184.3 am 2026-11-10 in der Beta-Demo am PC und am iPad); für dich nur dein Eindruck 184.4.
24. **Neu in 5.5.0: 🏘 das Gebäude oben gilt für alles aus Home Assistant** (Abschnitt 186, #715, deine Meldung vom 2026-11-11): Claude hat 186.1 und 186.2 geprüft (zwei Häuser nachgebaut, jede Seite durchgesehen); für dich im Add-on mit deinen zwei Häusern 186.3 bis 186.6 (damit ist auch 168.8 erledigt), nach dem Merge das Video 186.7.

Hinweise von Claude (keine Fehler, nur zum Wissen): wird ein Gerät aus einer Liste weiter unten in der Leiste gewählt (z. B. „☀ PV Dach ›“ in der Etagen-Karte), bleibt die Leiste so weit gescrollt wie vorher, der Kopf mit dem Namen ist dann oben aus dem Bild (2026-11-10); „⛰ Hang in einem Schritt“ ersetzt Höhenpunkte, die schon da sind, ohne zu fragen (Strg+Z holt sie zurück, 147.5); „+ Vordach“ kommt an die untere lange Seite im Plan (in der Demo die Gartenseite, 144.7); am Handy liegen die Knöpfe oben im Bild über dem Rand des Plans (145.7); das Bild `docs/img/version.png` auf der Startseite zeigt „GitHub (main): anderer Stand“, weil es während eines Updates aufgenommen wurde.

<details>
<summary>Die Liste bis 2026-11-05 (alles darin ist jetzt geprüft oder steht oben)</summary>

Die **Demo** öffnen: https://burned4aim.github.io/HA-Floorplanner/ und neu laden (am PC Strg+F5). Oben in der Leiste muss **v4.64.0** stehen. Punkte mit „nur im Add-on“ gehen nur in Home Assistant. Ergebnis gern hier oder im Chat: Nummer + „geht“ oder „geht nicht, weil …“ (ein Bild hilft). Die Nummern in Klammern führen zu den Tabellen unten, dort steht jeder Schritt genau.

**In der Nacht zum 2026-10-25 hat Claude fast alle offenen Punkte der Demo selbst geprüft** (Chromium als PC, Tablet und Handy) und einige im Test-Add-on (das Add-on mit einem nachgebauten Home Assistant); eingetragen als „Claude“. Die Fehler dabei sind in 4.21.2 repariert (Abschnitt 101). Übrig bleibt, was nur mit deinen echten Geräten geht:

1. **Neu nach 4.67.1: 🏠 Mehr als ein Grundriss** (Abschnitt 162, dein Wunsch: „dass es nicht nur ein Floorplan ist … man entdeckt es nur aus Versehen“): Claude hat 162.1 und 162.2 geprüft; für dich das größere Probe-Video im Chat 162.9, nach dem Merge die Startseite 162.4, Vorschaubild hochladen 162.5, Beschreibung und Stichwörter 162.6 (beides nur du kannst das), der Add-on-Store 162.7, der neue Trailer 162.8.
1. **Neu in 4.64.0: 🪟 Kippwinkel eines Fensters und Flügelrahmen mit Griff** (Abschnitt 155, gefragt von biggilottecassi in #624: „die Kippstellung … grafisch noch ein bisschen mehr“): Claude hat 155.1 bis 155.5a im Browser-Test geprüft; für dich in der Demo 155.5, im Add-on 155.6, nach dem Merge das Video 155.7.
1. **Neu nach 4.63.0: 🎬 Videos zum Strom-Rechner, zum Strom mehrerer Häuser und zum Nanoleaf-Editor** (Abschnitt 154, dein Wunsch: „eine Anleitung für den Strom-Rechner … auch für mehrere Häuser und der Nanoleaf-Editor“): Claude hat 154.1 und 154.2 geprüft; für dich nach dem Merge auf der Seite der Anleitung 154.3 bis 154.6, im Add-on 154.7.
1. **Neu in 4.63.0: 🏗 Balkon mit Geländer** (Abschnitt 153, gefragt von christinloehner in #646): Claude hat 153.1 bis 153.5 im Browser-Test geprüft; für dich in der Demo 153.6 bis 153.8, im Add-on 153.9, nach dem Merge das Video 153.10.
1. **Neu in 4.62.0: 🪟 Dachfenster ohne Gaube** (Abschnitt 152, gefragt von christinloehner in #643): Claude hat 152.1 bis 152.6 im Browser-Test geprüft; für dich in der Demo 152.7 und 152.8, im Add-on 152.9 und 152.10, nach dem Merge das Video 152.11.
1. **Neu nach 4.61.0: 🎬 die Suche der Video-Anleitung findet mehr** (Abschnitt 151, dein Wunsch: „wenn Leute ein anderes Wort verwenden … trotzdem das richtige Video“): Claude hat 151.1 und 151.2 geprüft; für dich nach dem Merge auf der Seite der Anleitung 151.3 bis 151.5, im Add-on 151.6, und 151.7 mit deinen eigenen Wörtern.
1. **Neu in 4.61.0: 🏠 L-Dach: Dächer schneiden sich in den Kehlen, Firstrichtung 0°/90°, breite Gaube mit eigener Neigung** (Abschnitt 150, gefragt von LoggieXC81 in #621, Issue #639): Claude hat 150.1 bis 150.4 im Browser-Test geprüft; für dich in der Demo 150.5 und 150.6, im Add-on 150.7, nach dem Merge die Videos 150.8.
1. **Neu in 4.60.0: 🪜 gewendelte Treppe: Keilstufen statt Podest, Stufen im 1. Lauf, massive Wandtreppe** (Abschnitt 149, gefragt von Miicki in #623): Claude hat 149.1 bis 149.5 im Browser-Test geprüft; für dich in der Demo 149.6 und 149.7, im Add-on 149.8, nach dem Merge das Video 149.9.
1. **Neu in 4.59.0: 🪟 Fenster mit zwei Kontakten: gekippt und offen** (Abschnitt 148, gefragt von biggilottecassi in #624): Claude hat 148.1 bis 148.5 im Browser-Test geprüft; für dich in der Demo 148.6, im Add-on mit deinem Fenster 148.7, nach dem Merge das Video 148.8.
1. **Neu in 4.58.0: ⛰ Gelände am Hang: Höhenpunkte, „Hang in einem Schritt“, Höhenlinien, der Keller steht frei** (Abschnitt 147, gefragt von christinloehner in #629): Claude hat 147.1 bis 147.4 im Browser-Test geprüft; für dich in der Demo 147.5 und 147.6, im Add-on 147.7, nach dem Update das Video 147.8.
1. **Neu in 4.57.0: 🚗 mehrere Autos im Haushalt** (Abschnitt 146, gefragt von Zelos001 in #631): Claude hat 146.1 bis 146.3 im Browser-Test geprüft; für dich in der Demo 146.4 und 146.5, im Add-on 146.6, nach dem Update das Video 146.7.
1. **Neu in 4.56.0: 📱 Bearbeiten am Handy** (Abschnitt 145, gefragt von biggilottecassi in #624): ☰ → „Bearbeiten“; Claude hat 145.1 bis 145.6 im Browser-Test geprüft; für dich in der Demo an deinem Handy 145.7, im Add-on 145.8, nach dem Update das Video 145.9.
1. **Neu in 4.55.0: 🏠 Giebelwand, Überstand am Giebel, Pultdach und „+ Vordach“** (Abschnitt 144, gefragt von christinloehner in #628): Claude hat 144.1 bis 144.5 im Browser-Test geprüft; für dich in der Demo 144.6 bis 144.8, im Add-on mit deinem Haus 144.9, nach dem Update das Video 144.10.
1. **Neu in 4.54.0: 🏠 ein L-förmiges Dach: ein weiteres Dach „wie das Hauptdach“, auch auf dem Kniestock** (Abschnitt 143, gefragt von Mario in der Q&A-Diskussion #621): Claude hat 143.1 und 143.2 im Browser-Test geprüft; für dich in der Demo 143.3 bis 143.5, nach dem Update das Video 143.6.
1. **Neu in 4.53.0: 🗄️ das Backup hat alles, auch die Codes (nur als Fingerabdruck) und auf Wunsch die Aufzeichnungen und die CallMeBot-Schlüssel** (Abschnitt 142): Claude hat 142.1 geprüft; für dich im Add-on 142.2 bis 142.5, nach dem Update die Videos 142.6 (Backup) und 142.7 (Messen: Wände verschieben und Winkel).
1. **Neu in 4.52.0: 🎬 Video-Anleitung, jede Funktion als kurzes Video zum Durchsuchen** (Abschnitt 141): 141.1 bis 141.5 ✅; 141.6 am Handy war abgeschnitten (#619), ist repariert: bitte noch einmal am Handy ein Video öffnen; im Add-on 141.7 und 141.8; neu: 141.9 (Liste aller Funktionen) und 141.10 (die neuen Videos), 141.11 (Video „Ein Fenster einstellen“).
1. **Neu in 4.51.0: 📅 besondere Tage in Abläufen (z. B. an Heiligabend und Feiertagen den Rollladen nur auf 50 %) und feste Stufen 0 / 50 / 75 / 100 % auf der Rollladen-Karte** (Abschnitt 140): Claude hat 140.1 bis 140.6 in der Demo geprüft (probier es gern selbst); für dich im Add-on 140.7 bis 140.10.
1. **Neu in 4.50.0 und 4.50.1: 🪟 Vorhänge zur Seite und jeder Fensterflügel für sich, auch „Fest“** (Abschnitt 138 und 139, ein Beitrag von aixmoyu): Claude hat 138.1 bis 138.3, 139.1 und 139.2 geprüft (probier es gern selbst in der Demo); für dich im Add-on 138.4 bis 138.6 und 139.3, und 138.7, wenn du einen Vorhang mit Motor hast.
1. **Neu in 4.48.0: ▦ „Frei anordnen“, die Karten einer Seite dort, wo du sie willst** (Abschnitt 137): Claude hat 137.1 bis 137.5 in der Demo geprüft (probier es gern selbst); für dich im Add-on am iPad und Handy 137.6 bis 137.8.
1. **Neu in 4.47.0: 🎚️ mehrere Lampen in einem Balken der Lichtsteuerung** (Abschnitt 136): Claude hat 136.1 bis 136.3 in der Demo geprüft (probier es gern selbst); für dich im Add-on am iPad 136.4 bis 136.6.
1. **Neu in 4.46.0: 简体中文 Chinesisch als achte Sprache** (Abschnitt 135): Claude hat 135.1 bis 135.3 in der Demo geprüft; für dich nur 135.4 (die Sprache wieder auf Deutsch stellen geht?).
1. **Neu in 4.45.0: 🎬 Szenen-Leiste über der Reiter-Leiste und die Karte 🎚️ „Lichtsteuerung“** (Abschnitt 134): Claude hat 134.1 bis 134.6 in der Demo geprüft (probier es gern selbst); für dich im Add-on am iPad 134.7 bis 134.9 und am Handy 134.10.
1. **Neu in 4.44.0: ✎ Bearbeiten: ausgeblendete Karten sind ganz weg, die Zeile „👁 Ausgeblendet“ holt sie zurück** (Abschnitt 133): Claude hat 133.1 bis 133.4 in der Demo geprüft (probier es gern selbst); für dich im Add-on mit deiner Fassung „Eltern“ 133.5 und am Handy oder iPad 133.6.
1. **Repariert in 4.43.1: der Raumfühler nimmt keinen alten Wert mehr als Wunsch, 🔥 Zu warm merkt „von Hand gedreht“** (Abschnitt 132): Claude hat 132.1 und 132.2 automatisch geprüft; 132.3 hast du im Add-on geprüft ✅; für dich noch 132.4 bis 132.6 (132.4: morgen früh im 🩺 Protokoll kein „✋ Von Hand gedreht“, das du nicht warst).
1. **Neu in 4.43.0: ▶ Abläufe nach Räumen, zum Auf- und Zuklappen** (Abschnitt 131): Claude hat 131.1 bis 131.6 in der Demo geprüft (probier es gern selbst); für dich im Add-on mit deinen Bereichen 131.7 und 131.8.
1. **Repariert in 4.42.1: die Reihenfolge der Heizung bleibt, auch wenn ein Thermostat spät meldet** (Abschnitt 130): Claude hat 130.1 mit tausenden zufälligen Tagen geprüft; für dich im Add-on 130.2 bis 130.5.
1. **Neu in 4.42.0: 🔥 Zu warm → Heizung runter** (Abschnitt 129): Claude hat 129.1 und 129.2 in der Demo geprüft (probier es gern selbst); für dich im Add-on 129.3 bis 129.6.
1. **Neu in 4.41.0: eine Tür zwischen zwei Räumen kann für die Heizung zählen** (Abschnitt 128): Claude hat 128.1 in der Demo geprüft; für dich im Add-on 128.2 bis 128.6 (zuerst an der Bad-Tür den Haken „Zählt für die Heizung“ einschalten).
1. **Neu in 4.40.0: 📜 Protokoll, ein eigener Reiter für alle Geräte** (Abschnitt 127): Claude hat 127.1 bis 127.4 in der Demo geprüft (probier es gern selbst); für dich im Add-on 127.5 bis 127.9.
1. **Neu in 4.39.0: 🩺 Protokoll „Wer steuert was?“** (Abschnitt 126): Claude hat 126.1 bis 126.5 in der Demo geprüft (probier es gern selbst); für dich im Add-on 126.6 bis 126.9. Und wenn dir wieder etwas auffällt: „📋 Bericht kopieren“ und im Chat einfügen.
1. **Repariert in 4.38.2: Raumfühler und Fenster-Regel zusammen** (Abschnitt 125): im Add-on mit deinem Wohnzimmer FL 125.1 bis 125.3.
1. **Neu in 4.38.0: 🌡 Raumfühler für die Thermostate** (Abschnitt 124): Claude hat 124.1 bis 124.4 in der Demo geprüft (probier es gern selbst); für dich im Add-on mit deinen Thermostaten 124.5 bis 124.9.
1. **Repariert in 4.37.2: bei offenem Fenster geht das Thermostat wirklich aus** (Abschnitt 123): im Add-on mit deinem Wohnzimmer FL 123.1 bis 123.3.
1. **Repariert in 4.37.1: Fenster-Regel unter dem Heizplan, Temperatur über dem Raum** (Abschnitt 122): 122.1 ✅ (Claude in der Demo), 122.2 und 122.4 ✅ im Add-on (122.3 ging nicht ganz, repariert in 4.37.2).
1. **Neu in 4.37.0: ▲ Plateau im Gelände, Boden je Raum höher, Außentreppe** (Abschnitt 121): Claude hat 121.1 bis 121.7 in der Demo und im Test-Add-on geprüft (probier es gern selbst in der Demo, 121.1 bis 121.6); für dich im Add-on mit deinem zweiten Haus 121.8.
1. **Neu in 4.36.0: Szenen „⇉ Auf alle anwenden“, Weißton in Kelvin, Szenen und Automationen aus Home Assistant ändern und löschen** (Abschnitt 120): Claude hat 120.1 bis 120.6 in der Demo geprüft (probier es gern selbst); für dich im Add-on 120.7 bis 120.9.
1. **Neu in 4.35.0: Die Einstellungen fast über den ganzen Bildschirm** (Abschnitt 119): Claude hat 119.1 bis 119.4 in der Demo geprüft; für dich im Add-on am PC 119.5 und am Tablet quer 119.6.
1. **Neu in 4.33.0: 🌙 Der Mond im Himmel** (Abschnitt 116): Claude hat 116.1 bis 116.4 in der Demo geprüft; schau heute Abend im Add-on, ob er dort steht, wo du ihn draußen siehst (116.5).
1. **Neu in 4.32.0: 📅 Heizplan, von Hand gedreht** (Abschnitt 115): Claude hat 115.1 und 115.2 im Test-Add-on geprüft; für dich im Add-on mit deinem Thermostat 115.3 und 115.4.
1. **Neu in 4.31.0 und 4.31.1: 🚆 Zug-Karte** (Abschnitt 113 und 114): Claude hat 113.1 bis 113.3 in der Demo und 114.1 im Test-Add-on geprüft; für dich im Add-on mit deinem Bahnhof 113.4 bis 113.6 und 114.2 bis 114.4 (abends dein Zug von morgen).
2. **Neu in 4.30.0: 🎨 Szenen für Lampen und LED-Streifen** (Abschnitt 112): Claude hat 112.1 bis 112.5 in der Demo geprüft; für dich im Add-on 112.6 bis 112.8.
3. **Neu in 4.29.0: Abläufe werden echte Automationen in Home Assistant** (Abschnitt 111): Claude hat 111.1 bis 111.4 in der Demo geprüft; für dich im Add-on mit deinem Home Assistant 111.5 bis 111.8.
4. **Neu in 4.28.0: Heiz-Regeln, Heizplan, „Wird benutzt“ und eigene Abläufe** (Abschnitt 110): 110.6, 110.12, 110.13 ✅ (Claude in der Demo, 2026-10-28); im Add-on mit deinem echten Fenster und Thermostat 110.14, 110.15.
5. **Neu: 🗄 Schrank-Editor** (Abschnitt 109): Claude hat 109.1 bis 109.10 in der Demo geprüft; probier ihn gern selbst aus (Etage „Dach“, „Schrank unter der Schräge“), und im Add-on unter deinem echten Dach 109.11.
6. **Neu in der Nacht zum 2026-10-26** (Abschnitt 102 bis 107): in der Demo hat Claude am Morgen alles geprüft (siehe unten). Für dich bleibt: **flüssiger am iPad** (102.1), **🎤 mit echter Sprache** „Mach das Licht im Bad an“ (105.6) und im Add-on mit deinen Geräten 103.5 bis 103.7, 104.3 bis 104.5, 105.7, 106.5, 106.6.
7. **iPhone in der Home-Assistant-App** (100.1, 100.2; die Demo in Safari: 100.3): kein leerer Streifen mehr unter „Haus, Heute, Energie …“.
8. **Werte der Energie-Balken mit dem Finger** (101.1): am Tablet oder Handy auf einen Balken tippen.
9. **🎤 mit echter Sprache** (96.1, 97.3, 98.2; im Add-on über http:// 98.4, 98.5): sprechen statt tippen.
10. **🔋 Ladestand mit deiner Batterie** (99.9, 99.10, nur im Add-on).
11. **Zähler und Backup im Add-on** (92.2, 92.3, 92.6, 93.1 bis 93.4): SolarNet-Sensoren, Helfer „Energie“, Urlaubs-Alarm im Backup.
12. **Kalender, Knöpfe, Anwesenheit, zweites Haus im Add-on** (90.7, 91.7, 89.5, 89.6, 87.6).
13. **Wandtablet schneller** (85.1 bis 85.4; in der 2D-Ansicht 108.3) und **iPad flüssig** (56.1, 56.2).
14. **Dashboard-Karte in Home Assistant** (46.3 bis 46.9; 46.3 war ❌, behoben in 3.77.1, bitte noch einmal).
15. **Docker-Version** (94.1 bis 94.3), nur wenn du sie benutzt.
16. ~~**Schleppgaube in der Demo** (42.1 bis 42.6, 43.1 bis 43.4, 45.1 bis 45.3)~~: ✅ seit 2026-10-28 (Claude in der Demo; bei 42.4 zeigte das Feld die neue Neigung erst nach dem Neuöffnen, repariert in 4.38.1).
17. ~~**Warnbanner am Wandtablet** (8.5)~~: ✅ seit 2026-10-28 (Claude in der Demo: Regen-Warnung, Tippen springt in den Raum).

</details>

**Zuletzt geprüft (2026-10-28, Claude in der Demo 4.38.0):** ✅ 8.5, 42.1 bis 42.6, 43.1 bis 43.4, 45.1 bis 45.3, 110.6, 110.12, 110.13, 122.1, 124.1 bis 124.4. Die früheren ❌ 63.4, 63.8, 66.21, 67.12, 79.11, 80.2, 84.1, 96.2 waren schon repariert und unter neuen Nummern geprüft (77.x, 66.23, 75.x, 101.x): jetzt ✅; 46.3 und 87.2 sind repariert, aber nur mit echtem Gerät zu bestätigen (wieder ❓). Übrig sind nur noch Punkte für deine echten Geräte.

**Zuletzt geprüft (2026-10-27, per Auswahl im Chat, 4.34.0):** ✅ 118.4, 118.5 (Kantenglättung „Automatisch“ läuft flüssig und gefällt am besten; Abschnitt 118 fertig).

**Zuletzt geprüft (2026-10-27, per Auswahl im Chat, 4.33.1):** ✅ 117.1 bis 117.4 (das Haus dreht sich flüssig, am PC mit Intel-Grafik in „Schön“ und „Schnell“, am Tablet mit dem Finger; Abschnitt 117 fertig).

**Zuletzt geprüft (2026-10-26 morgens, Claude in der Demo 4.26.0):** ✅ 102.2 bis 102.6, 103.1 bis 103.4, 104.1, 104.2, 105.1 bis 105.5, 106.1 bis 106.4, 107.1 bis 107.8 (Chromium als PC und als Tablet, nachts und am Tag der Zeitumstellung mit gestellter Uhr). Kein ❌.

**Zuletzt geprüft (2026-10-25, Claude in der Nacht):** ✅ 76.1 bis 76.14, 78.1 bis 78.11, 79 (ohne 79.11), 80 (ohne 80.2), 81.1 bis 81.12, 82.1 bis 82.8, 83.1 bis 83.12, 86.1 bis 86.9, 87.1, 87.3 bis 87.5, 88.1 bis 88.8, 89.1 bis 89.4, 90.1 bis 90.6, 91.1 bis 91.6, 92.1, 92.4, 92.5, 95.1 bis 95.10, 96.2 bis 96.10, 96.14, 97.1, 97.2, 97.4, 97.7, 98.1, 98.3, 99.1 bis 99.8, 63.1 bis 63.3; im Test-Add-on 12.6a, 15.6, 23.17, 37.6, 48.1 bis 48.5, 52.12, 56.6. **❌** 79.11, 80.2, 84.1, 87.2, 96.2 (#519 bis #525, behoben in 4.21.2, neu: 101).

**Zuletzt geprüft (2026-10-21, per Auswahl im Chat, nach 4.2.1):** ✅ 77.1 bis 77.4, 77.6 (Saugroboter, Hausmodus mit Knöpfen, Innenmaß, Klimaanlage), 54.6 (Klimagerät kühlt und heizt), 51.4 bis 51.8 (Abschnitt 51 fertig), 50.1 bis 50.8 (Strom-Rechnung, fertig), 49.1 bis 49.4 (Küchenzeile, fertig), 47.1, 47.2 (Durchsichtig, fertig), 46.1 (Karte in der Demo), 44.1 bis 44.6 (Dach mit Absatz, fertig). Pause vor 45.1 bis 45.3, 42 und 43 (Schleppgaube). **Davor am selben Tag:** ✅ 51.1 bis 51.3 (skandinavische Möbel), 52.1 bis 52.11 (Sauna, Fitness, Bar, Heimkino, LED-Spiegel), 53.1 bis 53.3 (Gaming-PC, große Spiegel), 54.7, 54.8 (mobiles Klimagerät, Deckenventilator). Noch nicht: 52.12 (Musterhaus importieren). ✅ 54.1 bis 54.5 (Schwenkarm-TV, Gruppe „Klima & Lüftung“), 55.1 bis 55.7 (Aufeinander), 56.3 bis 56.5, 56.7; 54.6: „Kühlen“ fehlte, weil das Klimagerät mit der Heizung verknüpft war (die kann nur heizen), jetzt hat die Demo eine Klimaanlage im Büro (77.6). Noch nicht: 56.1, 56.2 (iPad, Leistung), 56.6. ✅ 57.1 bis 57.7 (Garage, Werkstatt, Carport: alles, was in der Demo geht), 58.5 bis 58.8 (Messen: Abstand und Winkel setzen, gesperrte Wand; Abschnitt 58 damit fertig), 65.10 (Raum-Kacheln am Handy), 63.5 (Standventilator). Wunsch bei 58.5: „Lichter Abstand“ heißt jetzt „Innenmaß (Wand bis Wand)“ (77.4). ❌ 63.4: der Saugroboter war nicht zu finden (stand unter der Treppe, #473), ❌ 63.8: beim Hausmodus gab es keinen Knopf „Urlaub“, nur eine Liste (#474); beides behoben in 4.2.1 (77.1 bis 77.3). **Davor (2026-10-20 abends):** ✅ 63.6, 63.7 (Alarmanlage mit Code), 62.1 bis 62.4 (Energie aus dem Energie-Dashboard), 61.1 bis 61.9, 61.12, 61.13 (mehrere Gebäude), 60.1 bis 60.8 (Rückgängig, Kopieren, Einfügen), 59.1 bis 59.7 (Bar mit Deckenteil), 58.1 bis 58.4 (Messen). Noch nicht: 63.4, 63.5, 63.8 und 58.5; 63.1 bis 63.3 (Ton: Lautsprecher, Fernseher) will der Besitzer als Letztes prüfen. **Davor am selben Tag:** ✅ 75.1, 75.2 (Raumfarben im 2D-Plan, 4.1.4), der ganze Abschnitt 66, soweit in der Demo prüfbar (66.1 bis 66.10, 66.12 bis 66.20, 66.23 bis 66.25: Böden, Fensterrahmen, Glas, Raum-Schilder, Strom-Karte, Sterne, am Handy flüssige Raum-Kacheln, Strom-Karte und Zeile mit Uhrzeit und Wetter), 65.1 bis 65.9, 65.11 bis 65.13, 65.16 (Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste). 63.1 bis 63.4 noch nicht: die Geräte waren in „Live“ nicht zu finden (mit Raum-Schildern sind die Kugeln aus, Hinweis jetzt in der Prüfliste). **Davor am selben Tag:** ✅ 67.9 bis 67.11 (Wände für alle Räume, Akzentwand, „Temp.“ und Hologramm). ❌ 67.12: im 2D-Plan waren die Räume mit „Temp.“ schwarz (#467, behoben in 4.1.4: 75.1, 75.2). **Davor am selben Tag:** ✅ alles, was in der Demo geht, von 4.1.3 bis 4.0.1: 74.1, 74.2, 73.1 bis 73.7, 72.1 bis 72.7 (roter Streifen und Rand statt Sperrbildschirm, Wandtablet mit `?wand=1`, Dienste nach Herkunft), 71.1 bis 71.6 und 71.8 bis 71.11 (Urlaubs-Alarm mit Sperrbildschirm, Telegram, Dienste ankreuzen), 70.1 bis 70.6 (Benutzer & Tablets in ⚙, WhatsApp-Schritte), 69.1 bis 69.3 (Gebäude-Filter), 68.1 bis 68.8 (Einstellungen in Gruppen), 67.1 bis 67.8 (Wände und Böden mit Muster, Fassade). **Davor (2026-10-18):** ✅ 66.22 (am iPhone steht der angetippte Raum schön über der Raum-Karte). ❌ 66.21: die Raum-Kacheln ließen sich am Handy nur ruckelig wischen, die Leiste blieb hängen (#441, neu gebaut in 3.99.6: 66.23); dazu zeigte „Strom“ am Handy nichts an (#442, neu: 66.24), am Handy gab es keine Raum-Schilder (#444, neu: 66.10), und unten soll Uhrzeit und Wetter stehen (#445, neu: 66.25).

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
41. **Zwei Wände genau einstellen** (58.4 bis 58.8): zwei gegenüberliegende Wände eines Raums nacheinander anklicken, rechts beim **„Innenmaß (Wand bis Wand)“** (bis 4.2.0 „Lichter Abstand“) z. B. 4 eintippen und **„Setzen“**: die orange Wand rückt genau dorthin, die Wände daneben und der Raum ziehen mit. Dann zwei Wände in einer Ecke anklicken und den **„Winkel“** auf z. B. 120 stellen. Strg+Z macht es rückgängig.

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
| 8. Live-Ansicht (echte Geräte) | 7 | 0 | 0 | 0 | – |
| 9. Bearbeiten | 7 | 0 | 0 | 0 | – |
| 10. Tablet und Bedienung | 5 | 0 | 0 | 0 | – |
| 11. Benutzer & Tablets (3.20.0) | 7 | 0 | 0 | 0 | – |
| 12. Dachgauben (3.21.0) | 8 | 0 | 0 | 0 | – |
| 13. Import eines Hauses mit Keller, Anbau und Dachgeschoss | 5 | 0 | 0 | 0 | – |
| 14. Erdreich unter Anbauten ohne Keller (Fehler #93) | 4 | 0 | 0 | 0 | – |
| 15. Dachgröße von Hand (3.22.0) | 6 | 0 | 0 | 0 | – |
| 16. Wiederholung der drei Fehler (3.22.0) | 4 | 0 | 0 | 0 | – |
| 17. Werkzeugleiste anpassen und Raumliste nach Haus (3.23.0) | 7 | 0 | 0 | 0 | – |
| 18. Automatische Sicherung (3.24.0) | 10 | 0 | 0 | 0 | – |
| 19. Version und Prüfsumme in der Leiste (3.25.0) | 5 | 0 | 0 | 0 | – |
| 20. Erster Start (3.26.0) | 8 | 0 | 0 | 0 | – |
| 21. Neu in 3.26.1 bis 3.27.1 | 6 | 0 | 0 | 0 | – |
| 22. Ansicht und Live-Bedienung (3.28.0) | 9 | 0 | 0 | 0 | – |
| 23. Demo-Rundgang für 3.29 bis 3.36 (Besitzer) | 17 | 0 | 0 | 0 | – |
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
| 37. Neu in 3.59 bis 3.62 | 8 | 0 | 0 | 0 | – |
| 38. Neu in 3.66 | 8 | 0 | 0 | 0 | – |
| 39. Neu in 3.67 | 2 | 0 | 0 | 0 | – |
| 40. Neu in 3.69: Rollläden an den Fenstern | 6 | 0 | 0 | 0 | – |
| 41. Neu in 3.70: Rollladen-Karte | 5 | 0 | 0 | 0 | – |
| 42. Neu in 3.71: lange Schleppgaube | 6 | 0 | 0 | 0 | – |
| 43. Neu in 3.72: Fenster der Räume durch die Schleppgaube | 4 | 0 | 0 | 0 | – |
| 44. Neu in 3.73: Dach mit Absatz (Haus vorne schmaler, hinten breiter) | 6 | 0 | 0 | 0 | – |
| 45. Neu in 3.74: Schleppgaube bis zur Kante, Ecken einzeln ziehen | 3 | 0 | 0 | 0 | – |
| 46. Neu in 3.75: Karte für das Dashboard (46.1 in der Demo, der Rest nur in Home Assistant) | 8 | 0 | 1 | 0 | 46.3 |
| 47. Neu in 3.76: Durchsichtig nur die Wand | 2 | 0 | 0 | 0 | – |
| 48. Neu in 3.77: Musterhaus mit allem drin (nur im Add-on, die Demo hat keinen Import) | 5 | 0 | 0 | 0 | – |
| 49. Neu in 3.80: Küchenzeile ohne Oberschrank über einzelnen Modulen | 4 | 0 | 0 | 0 | – |
| 50. Neu in 3.82: Strom-Rechnung (Reiter „⚡ Rechnung“ im Strom-Editor) | 8 | 0 | 0 | 0 | – |
| 51. Neu in 3.84: Möbel im skandinavischen Stil | 8 | 0 | 0 | 0 | – |
| 52. Neu in 3.85: Sauna, Fitness, Bar, Heimkino, PC und Spiegel mit LED-Zonen | 12 | 0 | 0 | 0 | – |
| 53. Neu in 3.86: Bildschirme am Gaming-PC-Arbeitsplatz, große Spiegel mit zwei LEDs | 3 | 0 | 0 | 0 | – |
| 54. Neu in 3.87: Fernseher am Schwenkarm, Klimageräte und Ventilatoren | 8 | 0 | 0 | 0 | – |
| 55. Neu in 3.88: Etagen aufeinander wie ein echtes Haus | 7 | 0 | 0 | 0 | – |
| 56. Neu in 3.89: flüssig auf dem iPad, „Aufeinander“ auch bei einer Etage | 5 | 0 | 2 | 0 | 56.1, 56.2 |
| 57. Neu in 3.90: Garage, Werkstatt und Carport | 7 | 0 | 0 | 1 | – |
| 58. Neu in 3.91: Messen, Abstand und Winkel zweier Wände | 8 | 0 | 0 | 0 | – |
| 59. Neu in 3.92: Bar mit Deckenteil | 7 | 0 | 0 | 1 | – |
| 60. Neu in 3.93: Wiederholen, Kopieren und Einfügen, Schutz beim Speichern, Geländer der Wendeltreppe | 9 | 0 | 0 | 3 | – |
| 61. Neu in 3.94: mehrere Gebäude in einem Plan (#409) | 11 | 0 | 0 | 2 | – |
| 62. Neu in 3.95: Energie leichter einrichten (#407) | 4 | 0 | 0 | 3 | – |
| 63. Neu in 3.96: mehr Geräte direkt im Plan steuern (#406) | 8 | 0 | 0 | 3 | – |
| 64. Neu in 3.97: Alarm per WhatsApp (#414) | 0 | 0 | 0 | 6 | – |
| 65. Neu in 3.98: Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste (#418 bis #422) | 14 | 0 | 0 | 3 | – |
| 66. Neu in 3.99: echte Böden, dunkle Fensterrahmen, Glas-Optik, Raum-Schilder (#427 bis #430) | 24 | 0 | 0 | 1 | – |
| 67. Neu in 4.0: Wände mit Oberfläche, viel mehr Böden, Muster anpassen, Fassade (#448) | 12 | 0 | 0 | 2 | – |
| 68. Neu in 4.0.1: Einstellungen in Gruppen, Suche, was die Alarmanlage ist (#450) | 8 | 0 | 0 | 1 | – |
| 69. Neu in 4.0.2: Gebäude-Filter richtig (#451) | 3 | 0 | 0 | 1 | – |
| 70. Neu in 4.0.3: Benutzer & Tablets in den Einstellungen, WhatsApp leichter einrichten (#454) | 7 | 0 | 0 | 0 | – |
| 71. Neu in 4.1: Urlaubs-Alarm mit Sperrbildschirm, Telegram, Dienste ankreuzen (#456) | 10 | 0 | 0 | 4 | – |
| 72. Neu in 4.1.1: Streifen statt Sperrbildschirm für Bearbeiter, Dienste nach Herkunft, eigener Telegram-Bot (#460) | 7 | 0 | 0 | 2 | – |
| 73. Neu in 4.1.2: die Demo durchgesehen, Raum-Schilder aus „Bearbeiten“ (#462) | 7 | 0 | 0 | 0 | – |
| 74. Neu in 4.1.3: Ganzes Haus mit Raum-Schildern (#464) | 2 | 0 | 0 | 0 | – |
| 75. Neu in 4.1.4: Raumfarben im 2D-Plan bei „Temp.“ (#467) | 2 | 0 | 0 | 0 | – |
| 76. Neu in 4.2.0: Schnellzugriff, Licht-Gruppen, Favoriten und Hilfen beim Bearbeiten (#471) | 14 | 0 | 0 | 1 | – |
| 77. Neu in 4.2.1: Saugroboter sichtbar, Hausmodus mit Knöpfen, „Innenmaß“ beim Messen (#473, #474) | 5 | 0 | 0 | 1 | – |
| 78. Neu in 4.3.0: Reiter unten, Kamera-Seite, Reiter pro Benutzer, Tablet ohne Seitenleiste (#479) | 11 | 0 | 0 | 3 | – |
| 79. Neu in 4.4.0: ☀ Heute und ⚡ Energie (#481) | 13 | 0 | 0 | 3 | – |
| 80. Neu in 4.5.0: 🌡 Klima, ▶ Abläufe und 👨‍👩‍👧 Familie mit Pinnwand (#483) | 17 | 0 | 0 | 4 | – |
| 81. Neu in 4.6.0: Seiten bearbeiten wie ein Home-Assistant-Dashboard (#484) | 12 | 0 | 0 | 3 | – |
| 82. Neu in 4.7.0: Vollbild fest für einen Benutzer, beenden nur mit Code (#487) | 8 | 0 | 0 | 2 | – |
| 83. Neu in 4.8.0: 🎵 Musik & TV und 🧺 Haushalt (#490) | 12 | 0 | 0 | 4 | – |
| 84. Neu in 4.8.1: Zustände auf Deutsch in der Geräte-Liste (#492) | 1 | 0 | 0 | 0 | – |
| 85. Neu in 4.8.2: Tablets schneller (#494) | 1 | 0 | 3 | 0 | 85.1 bis 85.3 |
| 86. Neu in 4.9.0: Thermostat als Kreis wie in Home Assistant (#495) | 9 | 0 | 0 | 0 | – |
| 87. Neu in 4.10.0: Strom mehrerer Häuser in einer Grafik (#495) | 6 | 0 | 0 | 0 | – |
| 88. Neu in 4.11.0: Abschnitte auf den Seiten wie in Home Assistant (#495) | 8 | 0 | 0 | 0 | – |
| 89. Neu in 4.12.0: Wer ist wirklich zu Hause (#495) | 5 | 0 | 1 | 0 | 89.6 |
| 90. Neu in 4.13.0: Kalender-Karte mit mehreren Kalendern und „＋ Termin“ (#495) | 7 | 0 | 0 | 0 | – |
| 91. Neu in 4.14.0: Knöpfe gestalten (#495) | 7 | 0 | 0 | 0 | – |
| 92. Neu in 4.15.0: Zähler „von oben übernehmen“ und vollständigeres Backup (#501, #500) | 6 | 0 | 0 | 0 | – |
| 93. Neu in 4.16.0: Leistungs-Sensoren (W) als Zähler (#503) | 3 | 0 | 1 | 0 | 93.4 |
| 94. Neu in 4.17.0: Docker-Version ohne Supervisor (#489) | 3 | 0 | 0 | 0 | – |
| 95. Neu in 4.18.0: eine Seite in eigener Fassung je Benutzer (#507) | 10 | 0 | 0 | 0 | – |
| 96. Neu in 4.19.0: Sprachsuche mit 🎤 und Codewörtern (#509) | 10 | 0 | 1 | 3 | 96.1 |
| 97. Neu in 4.19.1: 🩺 Mikrofon-Test, 🎤 am Tablet und ohne https (#511) | 4 | 0 | 1 | 2 | 97.3 |
| 98. Neu in 4.20.0: 🎤 ohne https mit dem Diktat der Tastatur (#513) | 2 | 0 | 1 | 2 | 98.2 |
| 99. Neu in 4.21.0: 🔋 Ladestand der Batterien auf ⚡ Energie (#515) | 8 | 0 | 0 | 2 | – |
| 100. Neu in 4.21.1: iPhone, kein leerer Streifen unter der Reiter-Leiste (#517) | 0 | 0 | 1 | 2 | 100.3 |
| 101. Neu in 4.21.2: Funde aus dem Nacht-Test (#519 bis #525) | 7 | 0 | 0 | 0 | – |
| 102. Neu in 4.21.3: Tablet schneller, Komma, Demo nachts (#138, #527, #528) | 5 | 0 | 1 | 0 | 102.1 |
| 103. Neu in 4.22.0: 🔔 Klingel (Kamera auf jedem Tablet, #530) | 4 | 0 | 0 | 3 | – |
| 104. Neu in 4.23.0: 🔔 Sag mir Bescheid (#531) | 2 | 0 | 0 | 3 | – |
| 105. Neu in 4.24.0: 🗣 Schalten per Sprache (#532) | 5 | 0 | 1 | 1 | 105.6 |
| 106. Neu in 4.25.0: 🚗 Auto und 🌱 Garten auf 🧺 Haushalt (#533) | 4 | 0 | 0 | 2 | – |
| 107. Neu in 4.26.0: 🏡 Grundstück, Außenflächen, Maße und Garten-Deko (#538) | 8 | 0 | 0 | 0 | – |
| 108. Neu in 4.26.1: die 2D-Ansicht zeichnet kein verstecktes 3D-Bild mehr (#542) | 2 | 0 | 1 | 0 | 108.3 |
| 109. Neu in 4.27.0: 🗄 Schrank-Editor, Schrank nach Maß, auch unter der Dachschräge (#545) | 11 | 0 | 0 | 0 | – |
| 110. Neu in 4.28.0: Heiz-Regeln, Heizplan, „Wird benutzt“ und eigene Abläufe „Wenn … dann …“ (#546) | 13 | 0 | 0 | 2 | – |
| 111. Neu in 4.29.0: Abläufe werden echte Automationen in Home Assistant (#548) | 4 | 0 | 0 | 4 | – |
| 112. Neu in 4.30.0: 🎨 Szenen für Lampen und LED-Streifen als echte Szenen in Home Assistant (#549) | 5 | 0 | 0 | 3 | – |
| 113. Neu in 4.31.0: 🚆 Zug-Karte: Kommt mein Zug pünktlich? (#550) | 3 | 0 | 0 | 3 | – |
| 114. Neu in 4.31.1: 🚆 Zug-Karte zeigt deinen Zug auch morgen (#550) | 1 | 0 | 0 | 3 | – |
| 115. Neu in 4.32.0: 📅 Heizplan: von Hand gedreht, nach 10 Minuten zurück (#546) | 2 | 0 | 0 | 2 | – |
| 116. Neu in 4.33.0: 🌙 Der Mond im Himmel | 4 | 0 | 0 | 1 | – |
| 117. Neu in 4.33.1: Das Haus dreht sich flüssig (#557) | 4 | 0 | 0 | 0 | – |
| 118. Neu in 4.34.0: Kantenglättung zum Auswählen (#560) | 6 | 0 | 0 | 0 | – |
| 119. Neu in 4.35.0: Die Einstellungen fast über den ganzen Bildschirm (#562) | 6 | 0 | 0 | 0 | – |
| 120. Neu in 4.36.0: Szenen „Auf alle anwenden“, Weißton in Kelvin, Szenen und Automationen aus Home Assistant verwalten (#564) | 9 | 0 | 0 | 0 | – |
| 121. Neu in 4.37.0: Plateau im Gelände, Boden je Raum höher, Außentreppe (#566) | 8 | 0 | 0 | 0 | – |
| 122. Repariert in 4.37.1: Fenster-Regel unter dem Heizplan, Temperatur über dem Raum (#568, #569) | 3 | 1 | 0 | 0 | ❌ 122.3 |
| 123. Repariert in 4.37.2: bei offenem Fenster geht das Thermostat wirklich aus (#571) | 2 | 0 | 1 | 0 | 123.1 |
| 124. Neu in 4.38.0: 🌡 Raumfühler für die Thermostate (#573) | 7 | 0 | 2 | 0 | 124.6, 124.7 |
| 125. Repariert in 4.38.2: Raumfühler und Fenster-Regel zusammen (#577) | 3 | 0 | 0 | 0 | – |
| 126. Neu in 4.39.0: 🩺 Protokoll „Wer steuert was?“ (#579) | 9 | 0 | 0 | 0 | – |
| 127. Neu in 4.40.0: 📜 Protokoll, ein eigener Reiter für alle Geräte (#581) | 9 | 0 | 0 | 0 | – |
| 128. Neu in 4.41.0: Tür zwischen zwei Räumen zählt für die Heizung, Bad nicht mehr „von Hand gedreht“ (#583) | 5 | 0 | 1 | 0 | 128.6 |
| 129. Neu in 4.42.0: 🔥 Zu warm → Heizung runter, „Wer hat Vorrang?“ (#585) | 6 | 0 | 0 | 0 | – |
| 130. Repariert in 4.42.1: die Reihenfolge der Heizung bleibt, auch wenn ein Thermostat spät meldet (#588) | 4 | 0 | 1 | 0 | 130.5 |
| 131. Neu in 4.43.0: ▶ Abläufe nach Räumen, zum Auf- und Zuklappen (#590) | 8 | 0 | 0 | 0 | – |
| 132. Repariert in 4.43.1: der Raumfühler nimmt keinen alten Wert mehr als Wunsch, 🔥 Zu warm merkt „von Hand gedreht“ (#592) | 5 | 0 | 1 | 0 | 132.4 |
| 133. Neu in 4.44.0: ✎ Bearbeiten: ausgeblendete Karten ganz weg, die Zeile „👁 Ausgeblendet“ (#595) | 6 | 0 | 0 | 0 | – |
| 134. Neu in 4.45.0: 🎬 Szenen-Leiste und Karte 🎚️ „Lichtsteuerung“ (#597) | 9 | 0 | 1 | 0 | 134.10 |
| 135. Neu in 4.46.0: 简体中文 Chinesisch als achte Sprache (#587) | 4 | 0 | 0 | 0 | – |
| 136. Neu in 4.47.0: 🎚️ mehrere Lampen in einem Balken der Lichtsteuerung | 6 | 0 | 0 | 0 | – |
| 137. Neu in 4.48.0: ▦ „Frei anordnen“, die Karten einer Seite auf einem Gitter | 8 | 0 | 0 | 0 | – |
| 138. Neu in 4.50.0: 🪟 Vorhänge zur Seite und jeder Fensterflügel für sich (#606) | 7 | 0 | 0 | 0 | – |
| 139. Neu in 4.50.1: ein Fensterflügel kann „Fest“ sein, ein Flügel ohne Kontakt folgt wieder dem Hauptkontakt (#606) | 3 | 0 | 0 | 0 | – |
| 140. Neu in 4.51.0: 📅 besondere Tage in Abläufen, feste Stufen auf der Rollladen-Karte | 10 | 0 | 0 | 0 | – |
| 141. Neu in 4.52.0: 🎬 Video-Anleitung, jede Funktion als kurzes Video | 9 | 0 | 2 | 0 | 141.7, 141.8 |
| 142. Neu in 4.53.0: 🗄️ das Backup hat alles, auch die Codes und die Aufzeichnungen | 7 | 0 | 0 | 0 | – |
| 143. Neu in 4.54.0: 🏠 ein L-förmiges Dach, ein weiteres Dach wie das Hauptdach | 6 | 0 | 0 | 0 | – |
| 144. Neu in 4.55.0: 🏠 Giebelwand, Überstand am Giebel, Pultdach und Vordach | 10 | 0 | 0 | 0 | – |
| 145. Neu in 4.56.0: 📱 Bearbeiten am Handy | 8 | 0 | 1 | 0 | 145.8 |
| 146. Neu in 4.57.0: 🚗 mehrere Autos im Haushalt | 7 | 0 | 0 | 0 | – |
| 147. Neu in 4.58.0: ⛰ Gelände am Hang | 8 | 0 | 0 | 0 | – |
| 148. Neu in 4.59.0: 🪟 Fenster mit zwei Kontakten: gekippt und offen | 8 | 0 | 0 | 0 | – |
| 149. Neu in 4.60.0: 🪜 gewendelte Treppe: Keilstufen in der Ecke, Stufen im 1. Lauf | 9 | 0 | 0 | 0 | – |
| 150. Neu in 4.61.0: 🏠 L-Dach: Dächer schneiden sich, Firstrichtung 0°/90°, breite Gaube mit eigener Neigung | 8 | 0 | 0 | 0 | – |
| 151. 🎬 Video-Anleitung: die Suche findet mehr (nach 4.61.0, nur die Seite der Anleitung) | 6 | 0 | 1 | 0 | 151.7 |
| 152. Neu in 4.62.0: 🪟 Dachfenster ohne Gaube | 11 | 0 | 0 | 0 | – |
| 153. Neu in 4.63.0: 🏗 Balkon mit Geländer | 10 | 0 | 0 | 0 | – |
| 154. 🎬 Video-Anleitung: Strom-Rechner, Strom mehrerer Häuser, Nanoleaf (nach 4.63.0, nur die Anleitung) | 7 | 0 | 0 | 0 | – |
| 155. Neu in 4.64.0: 🪟 Kippwinkel eines Fensters und Flügelrahmen mit Griff | 8 | 0 | 0 | 0 | – |
| 156. 🎞 Trailer: das Beste in 90 Sekunden (nach 4.64.0, nur Werkzeuge) | 11 | 0 | 2 | 0 | 156.3, 156.5 |
| 157. Neu in 4.65.0: 🏠 Gaubenfenster kurz hinter dem Kniestock (#654) | 3 | 0 | 0 | 0 | – |
| 158. Neu in 4.66.0: 🪟 Das Fenster einer breiten Gaube | 3 | 0 | 0 | 0 | – |
| 159. Neu in 4.67.0: 🪟 Durchsichtige Wände im Dachgeschoss, Trailer ohne Zoom | 4 | 0 | 0 | 0 | – |
| 160. Neu in 4.67.1: 🖼 Neue Bilder auf der Startseite, 🛡-Knopf in der richtigen Sprache (#665) | 4 | 0 | 1 | 0 | 160.4 |
| 161. 📱 Kurze Clips für TikTok, Reels und Shorts (nach 4.67.1, nur Werkzeuge) | 4 | 0 | 2 | 0 | 161.3, 161.5 |
| 162. 🏠 Mehr als ein Grundriss: Startseite, Vorschaubild, Store und Trailer-Anfang (nach 4.67.1, keine Version) | 4 | 0 | 5 | 0 | 162.3, 162.5 bis 162.7, 162.9 |
| 163. Repariert in 4.67.2: nach dem Pultdach kommt das Dach zurück, wie es war (#669) | 3 | 0 | 0 | 0 | – |
| 164. Neu in 4.68.0: 🪜 Geschosshöhe je Haus, Stufen je Etage, L-Treppe mit 2. Ecke (#671) | 5 | 0 | 2 | 0 | 164.6, 164.7 |
| 165. Neu in 4.69.0: 🏷 Raumname aus einem Bereich von Home Assistant, ⏱ Uhrzeit beim Ziehen im Heizplan | 5 | 0 | 3 | 0 | 165.6 bis 165.8 |
| 166. Neu in 4.70.0: ⚡ Strom je Gebäude | 5 | 0 | 2 | 0 | 166.6, 166.7 |
| 167. Neu in 4.70.1: Bereit für Home Assistant 2026.11 (neue Namen, Teil-Geräte) | 4 | 0 | 2 | 0 | 167.5, 167.6 |
| 168. Neu in 4.71.0: ⏸️ Heizplan aussetzen, das Gebäude oben gilt auf jeder Seite | 5 | 0 | 5 | 0 | 168.6 bis 168.10 |
| 169. Neu in 4.72.0: 🪟 Fenster mit fester Scheibe unten oder oben | 5 | 0 | 2 | 0 | 169.6, 169.7 |
| 170. Neu in 4.73.0: ✨ Oberfläche 2 (die neue Bearbeiten-Leiste, umschaltbar) | 7 | 0 | 2 | 0 | 170.8, 170.9 |
| 171. Neu in 5.0.0: ✨ Oberfläche 2 komplett (Haus als Baum, Etage, Suchen, Reiter an der Leiste, Übernehmen) | 8 | 0 | 2 | 0 | 171.9, 171.10 |
| 172. Neu in 5.1.0: 🔺 das neue Dach und 🔒 Räume sperren | 12 | 0 | 2 | 0 | 172.13, 172.14 |
| 173. Neu in 5.2.0: Normal und Beta | 2 | 0 | 8 | 0 | 173.3 bis 173.10 |
| 174. Repariert in 5.2.1: die große Seitenansicht des Dachs (⤢) (#684) | 4 | 0 | 0 | 0 | – |
| 175. Repariert in 5.2.2: 🔒 ein Raum allein ohne fremde Streifen, ✨ die Reiter mit Namen, ⚡ Strom-Editor in „Neu“, 🌡 kein Heizungsfenster beim Bearbeiten (#686, #687, #689, #690) | 4 | 0 | 4 | 0 | 175.3, 175.4, 175.7, 175.8 |
| 176. Verbessert in 5.2.3: ⛰ Keller halb aus der Erde (#691) | 5 | 0 | 1 | 0 | 176.5 |
| 177. Repariert in 5.2.4: Backup einspielen ohne Größengrenze (#693) | 3 | 0 | 2 | 0 | 177.3, 177.4 |
| 178. Neu in 5.3.0: 🪟 zwei Türen oder Fenster übereinander (#694) | 8 | 0 | 1 | 0 | 178.8 |
| 179. Repariert in 5.3.1: 🪟 das Schild des unteren Rollladens (#697) | 3 | 0 | 0 | 0 | – |
| 180. Verbessert in 5.3.1: 🧪 die Beta im Browser | 4 | 0 | 0 | 0 | – |
| 181. Repariert in 5.3.2: 🏗 Terrasse halb auf der Garage, halb frei (#703) | 6 | 0 | 1 | 0 | 181.7 |
| 182. Neu in 5.4.0: 🌡 woher die Raumtemperatur kommt (#705) | 6 | 0 | 2 | 0 | 182.6, 182.8 |
| 183. Repariert und verbessert in 5.4.1: ☀ Solarmodule aus dem Dach-Editor, ✨ Seitenleiste (#709) | 4 | 1 | 0 | 0 | ❌ 183.5 |
| 184. Verbessert in 5.4.2: ✨ ein Reiter springt zu seinem Abschnitt | 3 | 0 | 1 | 0 | 184.4 |
| 185. Repariert in 5.4.3: ▲ das Plateau hebt den Keller nicht mehr an (#713) | 1 | 0 | 3 | 0 | 185.2 bis 185.4 |
| 186. Neu in 5.5.0: 🏘 das Gebäude oben gilt für alles aus Home Assistant (#715) | 2 | 0 | 5 | 0 | 186.3 bis 186.7 |
| 187. Neu in 5.6.0: ⚡ der Strom-Rechner übersichtlicher, 🌡 der Thermostat-Kreis springt nicht mehr zurück (#718) | 4 | 0 | 8 | 0 | 187.4 bis 187.10, 187.12 |
| **Zusammen** | **1207** | **2** | **94** | **92** | |
<!-- AUTO-UEBERSICHT-END -->

## Ältere offene Punkte (nur im echten Betrieb prüfbar)

Das sind die Punkte, die nur der Besitzer im echten Betrieb prüfen kann. Nach Wichtigkeit geordnet, die Nummern verweisen auf die Tabellen unten. Ergebnis jeweils unten in der Tabelle eintragen (✅ / ❌).

1. ~~**Wandtablet** (8.5): das Warnbanner~~: ✅ seit 2026-10-28 (Claude in der Demo; 10.2 und 10.3 sind seit 2026-10-17 ✅).
2. ~~**Import mit Dach-Angaben** (15.6, 12.6a)~~: ✅ seit 2026-10-25 (Claude im Test-Add-on: `roof.dormers` gibt zwei Gauben, `roof.box` das Dach des Gartenhauses).
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
| 8.5 | Warnbanner (Rauch, Wasser, offenes Fenster bei Regen), Tippen springt in den Raum | ✅ (2026-10-28, Claude in der Demo: Regen-Warnung „Fenster offen bei Regen“, Tippen springt ins Wohnzimmer; Rauch und Wasser prüft der Browser-Test 07_tablet) |
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
| 12.6a | JSON-Import mit `roof.dormers` (docs/examples/house.json hat zwei Gauben) zeigt Gauben auf dem Dach | ✅ (2026-10-25, Claude im Test-Add-on) |
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
| 15.6 | JSON-Import mit `roof.box` | ✅ (2026-10-25, Claude im Test-Add-on) |

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
| 23.17 | Haus → Grundriss importieren → Export | Strom-Kabel, Küchenzeile und weitere Dächer überleben Export und erneuten Import | ✅ (2026-10-25, Claude im Test-Add-on) |

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
| 37.6 | Oben „Benutzer“ → bei einem Benutzer „⚙“ → „🔒 Gesperrt“, Haken setzen | Die Haken bleiben gespeichert; mit diesem Benutzer angemeldet sind die Dinge weg (Wirkung nur im Add-on prüfbar, in der Demo gibt es nur einen Benutzer) (3.61.0) | ✅ (2026-10-25, Claude im Test-Add-on) |
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
| 42.1 | Bearbeiten, Etage „Dach“, „Etage verwalten“: bei einer Gaube „Dachform der Gaube“ auf „Schleppgaube“ stellen | Neue Felder „Neigung der Gaube (°)“ (15) und ein Hinweis erscheinen; „Abstand zur Traufe“ springt auf den Überstand (0,4 m). In 3D: die Vorderwand steht auf der Außenwand und geht senkrecht hoch, das Dach der Gaube läuft flacher nach oben ins Hauptdach, unter dem First (#339) | ✅ (2026-10-28, Claude in der Demo) |
| 42.2 | „Breite“ auf 6 m (oder mehr als 5 m) stellen | Die Gaube wird so lang, sie bleibt auf dem Dach und unter dem First; eine Sattelgaube bliebe höchstens 5 m breit | ✅ (2026-10-28, Claude in der Demo) |
| 42.3 | „Abstand vom Giebel“ auf 3 m stellen, danach die „Breite“ ändern | Die Gaube beginnt 3 m vom Giebel links (bzw. oben) im Plan; beim Ändern der Breite bleibt ihr Anfang stehen, der Schieber „Position am First“ wandert mit | ✅ (2026-10-28, Claude in der Demo) |
| 42.4 | „Neigung der Gaube“ auf 8 und dann auf 25 stellen, danach „Höhe der Wand“ sehr hoch (z. B. 3 m) | Das Gaubendach wird flacher bzw. steiler. Ist die Wand zu hoch für die Neigung, wird zuerst das Gaubendach flacher (das Feld zeigt den benutzten Wert), erst dann die Wand niedriger; nichts ragt über den First | ✅ (2026-10-28, Claude in der Demo: 25° wird zu 19,3°, mit 3 m Wand 2°; das Feld zeigte die neue Neigung erst nach dem Neuöffnen, repariert in 4.38.1) |
| 42.5 | Haken „Ausgebauter Dachstuhl“ setzen (Kniestock), dann die Etage darunter öffnen | Unter der Schleppgaube gehen die Wände gerade hoch bis unter ihr schräges Dach; daneben werden sie an der Dachschräge abgeschnitten | ✅ (2026-10-28, Claude in der Demo) |
| 42.6 | Mit der Kamera nah an eine Gaube (auch eine normale) heran, oder einen Raum unter einer Gaube öffnen | Die Schräge des Hauptdachs läuft **nicht** mehr quer durch den Raum unter der Gaube: dort hat das Dach ein Loch, das Gaube und Gaubendach schließen | ✅ (2026-10-28, Claude in der Demo) |

## 43. Neu in 3.72: Fenster der Räume durch die Schleppgaube
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 43.1 | Schleppgaube auf der Außenwand (42.1), Haken „Fenster“ aus. Etage darunter öffnen, Werkzeug „Tür/Fenster“: in die Wand unter der Gaube zwei Fenster setzen (z. B. eines pro Raum), Sims etwa 1,2 m | Von außen (Ganzes Haus oder Live) sind beide Fenster **durch die Gaube** zu sehen, mit Rahmen und Glas; die Gaube hat dort keine geschlossene Wand mehr (#341) | ✅ (2026-10-28, Claude in der Demo) |
| 43.2 | Eines der Fenster anklicken, Kontakt und Haken „Rollladen“ mit Entität setzen | Es ist ein normales Fenster: Kontakt, offen = rot, Rollladen fährt außen vor dem Glas, Kugel 🪟 im Live-Modus | ✅ (2026-10-28, Claude in der Demo) |
| 43.3 | Live: in den Raum tippen (Raum-Karte), oben auf „n offen“ schauen | Das Fenster steht beim richtigen Raum, ein offenes Fenster zählt bei „n offen“ | ✅ (2026-10-28, Claude in der Demo) |
| 43.4 | Ein Fenster in der Wand verschieben oder löschen | Das Loch in der Gaube wandert mit bzw. ist wieder zu | ✅ (2026-10-28, Claude in der Demo) |

## 44. Neu in 3.73: Dach mit Absatz (Haus vorne schmaler, hinten breiter)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 44.1 | Bearbeiten, Etage „Dach“, Ansicht 2D: das Dach anklicken, dann Doppelklick auf eine lange Dachkante | An der Stelle wird die Kante geteilt: auf beiden Teilen erscheint eine **Raute** (#342) | ✅ (2026-10-21) |
| 44.2 | Die Raute eines Teils nach innen oder außen ziehen | Die Kante dieses Teils wandert in 5-cm-Schritten mit (Alt: frei); beim Loslassen ist das Dach in 3D an dieser Stelle schmaler bzw. breiter, der First bleibt gerade und gleich hoch, am Absatz schließt ein kleines Dreieck die Lücke | ✅ (2026-10-21) |
| 44.3 | Strg+Z, dann Doppelklick auf eine Raute | Strg+Z nimmt das Ziehen zurück; der Doppelklick nimmt den Absatz wieder weg | ✅ (2026-10-21) |
| 44.4 | „Etage verwalten“ aufklappen, Abschnitt „Absätze“: Seite, „Ab (Abstand vom Giebel)“ und „Nach außen“ ändern, „+ Absatz“, × | Das Dach ändert sich passend; „+ Absatz“ legt einen auf Seite A in der Hausmitte an (50 cm nach außen) | ✅ (2026-10-21) |
| 44.5 | „Ausgebauter Dachstuhl“ an, die Etage darunter öffnen; eine Gaube und ein Solarpanel auf den breiten Teil setzen | Die Wände werden an der richtigen Dachfläche abgeschnitten; Gaube und Panel sitzen auf der flacheren Fläche des breiten Teils | ✅ (2026-10-21) |
| 44.6 | Dachform „Walmdach“ wählen | Statt der Absätze steht ein Hinweis (nur Sattel- und Flachdach); das Walmdach bleibt rechteckig | ✅ (2026-10-21) |

## 45. Neu in 3.74: Schleppgaube bis zur Kante, Ecken einzeln ziehen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 45.1 | Bei einer Schleppgaube „Abstand vom Giebel“ auf 0 stellen (oder den Schieber ganz an den Rand), dann von der Giebelseite schauen | Vorderwand, Seitenwand und Dach der Gaube enden genau an der Dachkante, kein Abstand; Giebel und Gaubenseite sind eine Fläche (#345) | ✅ (2026-10-28, Claude in der Demo) |
| 45.2 | Die Gaube so breit machen, dass sie bis zum anderen Giebel reicht | Auch dort bündig bis an die Kante | ✅ (2026-10-28, Claude in der Demo: Breite = Länge des Hauses, 10 m; bündig an beiden Giebeln) |
| 45.3 | Dach mit Absatz (44.1), Ansicht 2D: das Dach anklicken und einen **Kreis** an einem Absatz ziehen, längs und quer | Der Absatz wandert längs mit, die Kante dieses Stücks quer (5-cm-Schritte); beim Loslassen folgt das Dach in 3D; Strg+Z nimmt es zurück | ✅ (2026-10-28, Claude in der Demo) |

## 46. Neu in 3.75: Karte für das Dashboard (46.1 in der Demo, der Rest nur in Home Assistant)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 46.1 | Demo mit der Adresse `https://burned4aim.github.io/HA-Floorplanner/?card=1&floor=house&heatmap=temp&theme=light` öffnen, Fenster schmal und niedrig ziehen; danach `…/?card=1&floor=1&show_bar=0&show_nav=0` | So sieht das Haus später in der Karte aus: ganzes Haus, hell, Temperaturfarben, keine Werkzeugleiste, die Farbskala verdeckt den Kompass nicht; die zweite Adresse zeigt das Obergeschoss ohne Knöpfe oben und unten | ✅ (2026-10-21) |
| 46.2 | HACS → ⋮ → Benutzerdefinierte Repositories: `https://github.com/BuRnEd4AiM/HA-Floorplanner`, Typ „Dashboard“; „3D Floorplan Card“ herunterladen, Browser neu laden | HACS lädt die Karte und trägt sie selbst als Ressource ein (#13) | ✅ (2026-10-11) mit 3.75.1: die Karte ist geladen, ihr Editor öffnet sich (mit 3.75.0 fehlte sie, #348) |
| 46.3 | Dashboard bearbeiten → „Karte hinzufügen“, nach „3D Floorplan“ suchen | Die Karte steht in der Liste; nach dem Hinzufügen zeigt sie das Haus live, ohne Werkzeugleiste | ❓ (repariert in 3.77.1, #352: bitte in Home Assistant noch einmal prüfen. Damals ❌ 2026-10-11: „Das Add-on 3D Floorplan wurde nicht gefunden“; Claude 2026-11-06: im Ersatz-Dashboard (Browser-Test 13_card) wird die Karte angeboten und findet das Add-on; einmal im echten Home Assistant bitte du) |
| 46.4 | Im Editor der Karte „Etage“ aufklappen | Die Etagen und Räume des eigenen Plans stehen zur Auswahl, dazu „Ganzes Haus“; die Vorschau wechselt auf die gewählte Etage | ✅ (2026-11-06, Claude im Browser-Test 13_card: im Ersatz-Dashboard; Etage 0 = Erdgeschoss, Start auf „Ganzes Haus“) |
| 46.5 | In der Karte eine Lampen-Kugel antippen, schalten; in einen Raum tippen | Die Live-Karte öffnet sich und schaltet die Lampe; der Raum öffnet sein Raum-Fenster (mit „Raum-Fenster“ aus: nur hineinzoomen) | ✅ (2026-11-06, Claude im Browser-Test 13_card: die Karte ist die Live-Ansicht ohne Leisten; ohne Raum-Fenster geht ein Tipp nur in den Raum) |
| 46.6 | „Design“ auf „Wie Home Assistant“, dann im Profil von Home Assistant zwischen dunkel und hell wechseln | Die Karte wechselt mit (dunkel / hell); das Add-on selbst behält sein Design | ✅ (2026-11-06, Claude im Browser-Test 13_card: der Dunkelmodus von Home Assistant ändert die Karte, die Einstellungen des Add-ons bleiben) |
| 46.7 | „Raumfarben“ auf „Temperatur“, „Leiste oben“ und „Leiste unten“ aus | Die Karte startet mit den Temperaturfarben, ohne Knöpfe oben und unten | ✅ (2026-11-06, Claude im Browser-Test 13_card: Start mit Temperaturfarben, ohne Leisten oben und unten) |
| 46.8 | Ein Sections-Dashboard: die Karte größer und kleiner ziehen; ein anderes Dashboard mit „Bildschirm füllen“ | Die Ansicht füllt immer die ganze Karte, ohne Ränder oder Balken | ✅ (2026-11-06, Claude im Browser-Test 13_card: die Höhe der Karte; die Ansicht füllt den Rahmen) |
| 46.9 | Das Add-on anhalten, das Dashboard neu laden; danach wieder starten | Die Karte sagt „Das Add-on 3D Floorplan läuft nicht …“; nach dem Start erscheint das Haus von selbst (bis zu einer halben Minute) | ✅ (2026-11-06, Claude im Browser-Test 13_card: Add-on nicht installiert, läuft nicht, zu alt: die Karte sagt es und öffnet nichts) |

## 47. Neu in 3.76: Durchsichtig nur die Wand
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 47.1 | Unten „Ansicht“ → „Durchsichtig“ einschalten, die Kamera langsam um das Haus drehen | Die Wände zur Kamera werden durchsichtig; ihre Fenster (Rahmen, Glas, Rollladen) und Türen (Rahmen, Türblatt) bleiben so sichtbar wie sonst (#350) | ✅ (2026-10-21) |
| 47.2 | Dabei auf die Möbel hinter der durchsichtigen Wand schauen (Sofa, Schrank, Tisch) | Die Möbel bleiben fest, nicht durchsichtig | ✅ (2026-10-21) |

## 48. Neu in 3.77: Musterhaus mit allem drin (nur im Add-on, die Demo hat keinen Import)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 48.1 | Bearbeiten, „Häuser“ → „Haus aus JSON importieren …“ → „Beispiel: Musterhaus (alles drin)“ → „Prüfen“ | Grün: 4 Etagen, 23 Räume, 74 Wände, 44 Türen/Fenster, 264 Geräte (seit 3.84 mit den Möbeln im skandinavischen Stil, seit 3.85 mit Sauna, Fitness, Heimkino und Bar im neuen Kellerteil); keine Fehler und keine Hinweise (#353) | ✅ (2026-10-25, Claude im Test-Add-on; inzwischen 329 Geräte) |
| 48.2 | „Importieren“, dann „Ganzes Haus“ | Ein neues Haus „Musterhaus – alles drin“: Keller in der Erde, Erdgeschoss mit Garage, Obergeschoss mit Dachterrasse (Geländer, keine Wände), Satteldach mit drei Gauben und Solaranlage, Gartenhaus mit Walmdach, Pool mit Brücke, Einfahrt mit Auto | ✅ (2026-10-25, Claude im Test-Add-on) |
| 48.3 | Die Etagen einzeln öffnen und die Treppen suchen | U-Treppe vom Keller bis ins Obergeschoss, L-Treppe von der Werkstatt in die Garage, Wandtreppe vom Wohnzimmer zur Galerie, Wendeltreppe außen an der Garage zur Dachterrasse, Bodentreppe im Kinderzimmer | ✅ (2026-10-25, Claude im Test-Add-on) |
| 48.4 | Etage „Dach“: die Solaranlage anklicken; dann „Dieses Haus als JSON exportieren“ und die Datei wieder importieren | Die Solaranlage liegt auf der Dachfläche; im wieder importierten Haus ist sie noch da (vorher ging sie verloren) | ✅ (2026-10-25, Claude im Test-Add-on) |
| 48.5 | „Häuser“ → das Musterhaus löschen | Es ist weg, das eigene Haus bleibt unverändert | ✅ (2026-10-25, Claude im Test-Add-on) |

## 49. Neu in 3.80: Küchenzeile ohne Oberschrank über einzelnen Modulen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 49.1 | Bearbeiten, die Küchenzeile anklicken; in der Modul-Liste bei einem Unterschrank den Haken neben der Breite wegnehmen | In 3D ist nur der Oberschrank über diesem Modul weg; Unterschrank und Arbeitsplatte bleiben (#372) | ✅ (2026-10-21) |
| 49.2 | Beim Herd den Haken wegnehmen; beim Kühlschrank nachsehen | Die Haube über dem Herd ist weg; Kühlschrank, Hochschrank und Lücke haben keinen Haken | ✅ (2026-10-21) |
| 49.3 | Bei einem Modul ohne Oberschrank den Typ (z. B. Schubladen) oder die Breite ändern und es mit ↑/↓ verschieben | Der Oberschrank bleibt weg, er wandert mit dem Modul | ✅ (2026-10-21) |
| 49.4 | Oben den Haken „Oberschränke“ wegnehmen, dann wieder setzen | Weg: alle Oberschränke sind weg, die Haken in den Zeilen verschwinden; wieder gesetzt: die Oberschränke kommen zurück, nur nicht über den Modulen ohne Haken | ✅ (2026-10-21) |

## 50. Neu in 3.82: Strom-Rechnung (Reiter „⚡ Rechnung“ im Strom-Editor)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 50.1 | Bearbeiten, oben „Strom-Editor“ drücken | Neben „Kabel“ erscheint der Knopf „⚡ Rechnung“; ohne Strom-Editor ist er nicht da (#378) | ✅ (2026-10-21) |
| 50.2 | „⚡ Rechnung“ drücken | Ein Fenster „Strom: was ist was und wie wird gerechnet“; oben „So wird gerade gerechnet“: Erzeugung, + Bezug aus dem Netz, − Batterie lädt, = Hausverbrauch (berechnet) mit den Werten von jetzt; bei allem, was nicht eingestellt ist, steht „Automatisch aus dem Plan: …“ mit dem Gerät und seinem Wert | ✅ (2026-10-21) |
| 50.3 | Die Strom-Anzeige oben links ansehen (Demo: Erzeugung 3,20 kW, Bezug 450 W, Batterie lädt 600 W) | ⌂ zeigt 3,05 kW: die ladende Batterie wird abgezogen (vorher 3,65 kW, #379) | ✅ (2026-10-21) |
| 50.4 | Bei „Netz“ einen Sensor wählen, dann „Vorzeichen umdrehen“ an- und wieder ausschalten | Unter dem Sensor „jetzt: … → Bezug“ bzw. „→ Einspeisung“; die Rechnung oben und die Anzeige oben links ändern sich sofort mit | ✅ (2026-10-21) |
| 50.5 | Wenn die Rechnung unter null fällt: „⚠ … unter null“ mit dem Knopf „Vorzeichen am Netz umdrehen“ drücken | Die Warnung ist weg, unten steht „✓ Die Rechnung geht auf.“ | ✅ (2026-10-21) |
| 50.6 | Bei „Batterie“ den Haken „Batterie im Hausverbrauch mitrechnen“ wegnehmen, dann wieder setzen | Weg: oben „Batterie (nicht mitgerechnet)“, der Verbrauch ist ohne Batterie; wieder gesetzt: wie vorher | ✅ (2026-10-21) |
| 50.7 | Bei „Räume“ „Vorschlagen“ drücken oder bei einem Raum „+ Sensor hinzufügen …“ (z. B. „Wohnzimmer Leistung“) | Der Raum zeigt den Sensor mit seinem Wert; oben „↳ Raumname“ und „Rest (keinem Raum zugeordnet)“; × nimmt ihn wieder heraus | ✅ (2026-10-21) |
| 50.8 | Fenster schließen, „Live“, mit der Maus auf die Strom-Anzeige oben links zeigen | Die Anzeige rechnet mit den Einstellungen aus dem Fenster; der Hinweis nennt die Räume und den Rest | ✅ (2026-10-21) |

## 51. Neu in 3.84: Möbel im skandinavischen Stil
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 51.1 | Bearbeiten, Werkzeug „Gerät“, links die Bibliothek ansehen | Neue Gruppen „Kinder“ und „Flur“; in „Wohnen“, „Küche“, „Bad“, „Schlafen“, „Büro“, „Licht“ und „Deko“ viele neue Teile mit Vorschaubild (Würfelregale, Bücherregale, Sofas, Sessel, Kommoden, Schränke, Schreibtische, Lampen …) | ✅ (2026-10-21) |
| 51.2 | Im Suchfeld „kallax“ eingeben, dann „billy“, „malm“, „pax“, „poäng“ | „kallax“: die 4 Würfelregale; „billy“: die 2 hohen Bücherregale; „malm“: Bett mit hohem Kopfteil, 2 Kommoden, Nachttisch; „pax“: die 2 Kleiderschränke; „poäng“: der Schwingsessel | ✅ (2026-10-21) |
| 51.3 | Ein Würfelregal 2×4 in einen Raum setzen, im 2D-Plan nachsehen | In 3D ein weißes Regal mit 8 Fächern (Boxen, Bücher, eine Tür); im 2D-Plan ist das Rechteck so groß wie das Regal (77 × 39 cm) | ✅ (2026-10-21) |
| 51.4 | Das Regal anklicken, rechts bei „Ausführung“ „Eiche“ wählen, dann „Schwarzbraun“; Strg+Z | Das Regal wird sofort eichenfarben, dann schwarzbraun; Strg+Z holt die vorige Ausführung zurück. Nach dem Neuladen ist die gewählte Ausführung noch da | ✅ (2026-10-21) |
| 51.5 | Eine „Papier-Hängelampe“ (Gruppe „Licht“) setzen und mit einer Lampe aus Home Assistant verknüpfen, dann „Live“ und die Lampe einschalten | Die Papierkugel hängt unter der Decke und leuchtet, der Raum wird hell wie bei den anderen Lampen | ✅ (2026-10-21) |
| 51.6 | In der Gruppe „Kinder“ das Hochbett und den Plüschhai setzen | Hochbett mit Leiter und Rausfallschutz, darunter frei; ein kleiner blauer Hai mit weißem Bauch | ✅ (2026-10-21) |
| 51.7 | Einen Kleiderschrank mit Schiebetüren an eine Wand schieben | Er bleibt an der Wand stehen und lässt sich nicht hineinschieben (Wandstopp) | ✅ (2026-10-21) |
| 51.8 | Sprache auf Englisch stellen und die Bibliothek ansehen | Alle neuen Teile und die Ausführungen haben englische Namen, z. B. „Cube shelf 2×4“, „Oak“ | ✅ (2026-10-21) |

## 52. Neu in 3.85: Sauna, Fitness, Bar, Heimkino, PC und Spiegel mit LED-Zonen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 52.1 | Bearbeiten, Werkzeug „Gerät“, links die Bibliothek ansehen | Neue Gruppen „Sauna & Wellness“, „Fitness“, „Bar“ und „Heimkino“, jede mit Vorschaubildern; bei „Büro“ PC, Gaming-PC, PC-Arbeitsplatz, Laptop, Gaming-Stuhl, Netzwerkschrank; bei „Bad“ die LED-Spiegel und der Spiegelschrank | ✅ (2026-10-21) |
| 52.2 | Eine „Sauna mit Glasfront“ in einen Raum setzen, mit dem Schalter oder Thermostat der Sauna verknüpfen, „Live“, die Sauna einschalten | Holzkabine mit Glasfront und Glastür, innen zwei Bänke und der Ofen; eingeschaltet glühen die Saunasteine orange und das Licht unter der Bank und hinter der Lehne leuchtet | ✅ (2026-10-21) |
| 52.3 | Bei „Ausführung“ „Thermoholz“ wählen | Die Kabine wird dunkelbraun | ✅ (2026-10-21) |
| 52.4 | Aus „Fitness“ Laufband, Power Rack und Hantelbank setzen, aus „Bar“ die „Bartheke mit LED“, das Barregal und den Billardtisch | Die Teile stehen in echter Größe im Raum (Billardtisch 2,50 × 1,40 m), im 2D-Plan genauso groß | ✅ (2026-10-21) |
| 52.5 | Aus „Heimkino“ die „Leinwand mit Rahmen“ an eine Wand setzen und den „Beamer (Decke)“ davor; beide mit dem Beamer oder Mediaplayer verknüpfen, „Live“, abspielen | Die Leinwand rastet an der Wand ein; der Beamer hängt unter der Decke. Beim Abspielen leuchtet die Leinwand hell und die Linse des Beamers | ✅ (2026-10-21) |
| 52.6 | Den „Gaming-PC mit RGB“ mit dem Schalter des PCs verknüpfen, „Live“, einschalten | Die Lüfter vorne und die Teile hinter dem Glas leuchten lila (oder in der Farbe des Lichts, wenn es ein Licht ist) | ✅ (2026-10-21) |
| 52.7 | Den „LED-Spiegel mit 3 Zonen“ an eine Wand setzen und anklicken | Der Spiegel rastet flach an der Wand ein; rechts unter „LEDs einzeln verknüpfen“ drei Felder „Hinten (indirekt)“, „Vorne“, „Unten“, jedes mit einem farbigen Streifen; in 3D haben die LEDs genau diese Farben | ✅ (2026-10-21) |
| 52.8 | Nur das Hauptgerät (oben „Entität“) mit einem Licht verknüpfen, „Live“, einschalten | Alle LEDs des Spiegels leuchten, der Raum wird etwas heller | ✅ (2026-10-21) |
| 52.9 | Zurück zu „Bearbeiten“, für „Hinten (indirekt)“ und „Unten“ je ein eigenes Licht wählen; „Live“, den Spiegel antippen | Die Karte zeigt „x von 3 LED-Zonen an“ und drei Knöpfe „Hinten (indirekt)“, „Vorne“, „Unten“; ein Knopf öffnet die Steuerung nur dieser LED, „Alle LEDs“ schaltet alle | ✅ (2026-10-21) |
| 52.10 | Nur das Licht „Hinten“ einschalten, z. B. in Blau | In 3D leuchtet nur der Rand hinter dem Spiegel blau, die anderen LEDs bleiben aus | ✅ (2026-10-21) |
| 52.11 | Die „Bartheke mit LED“ anklicken, „Thekenkante“ und „Sockel“ mit zwei Lichtern verknüpfen, in „Live“ beide einschalten | Die Kante der Theke und das Licht am Boden vor dem Sockel leuchten jeweils in der Farbe ihres Lichts | ✅ (2026-10-21) |
| 52.12 | „Häuser“ → „Haus aus JSON importieren …“ → „Beispiel: Musterhaus (alles drin)“ → „Importieren“, dann den „Keller“ öffnen | Rechts neben der Werkstatt ein neuer Kellerteil mit „Sauna & Wellness“, „Heimkino“, „Fitness“ und „Bar“; im Garten Fass-Sauna, Whirlpool und Poolbar | ✅ (2026-10-25, Claude im Test-Add-on) |

## 53. Neu in 3.86: Bildschirme am Gaming-PC-Arbeitsplatz, große Spiegel mit zwei LEDs
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 53.1 | Den „Gaming-PC-Arbeitsplatz“ (Gruppe „Büro“) setzen und anklicken, rechts bei „Anordnung“ nacheinander alle Möglichkeiten wählen | „2 Monitore nebeneinander“ (so wie bisher), „1 Monitor“, „3 Monitore nebeneinander“ (die äußeren schräg nach innen), „4 Monitore (2 × 2)“ an einem Monitorarm, „Curved-Monitor“ (gebogen), „Curved + 2 hochkant“; bei 3 Monitoren und bei Curved + 2 hochkant wird der Tisch breiter (1,80 m), auch im 2D-Plan | ✅ (2026-10-21) |
| 53.2 | Eine Anordnung wählen, Strg+Z; dann eine wählen und die Seite neu laden | Strg+Z holt die vorige Anordnung zurück; nach dem Neuladen ist die gewählte noch da | ✅ (2026-10-21) |
| 53.3 | Die „Spiegelwand mit LED“ und den „Ganzkörperspiegel mit LED“ anklicken, unter „LEDs einzeln verknüpfen“ für „Hinten (indirekt)“ und „Vorne“ je ein Licht wählen, „Live“, beide einzeln schalten | Der Rand hinter dem Spiegel und die zwei Lichtstreifen vorne links und rechts leuchten jeweils mit ihrem eigenen Licht; der Spiegel antippen zeigt zwei Knöpfe | ✅ (2026-10-21) |

## 54. Neu in 3.87: Fernseher am Schwenkarm, Klimageräte und Ventilatoren
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 54.1 | Den „Wand-TV mit Schwenkarm“ (Gruppe „Wohnen“, Suche „schwenkarm“) nahe an eine Wand setzen | Er springt an die Wand; man sieht die Wandplatte, den Klapparm und den Fernseher ein Stück (15 cm) vor der Wand | ✅ (2026-10-21) |
| 54.2 | Anklicken, rechts „Schwenken“ auf 30, dann auf −30, „Neigen“ auf 10, „Abstand zur Wand“ auf 0,4 m, „Größe“ auf 75″ | Der Bildschirm dreht sich nach rechts bzw. links (von vorne gesehen), kippt nach unten, steht weiter von der Wand ab, wird größer; der Arm klappt dabei mit aus und der Fernseher stößt nie an die Wand. Beim Schwenken steht unter den Feldern, wie weit er von der Wand absteht | ✅ (2026-10-21) |
| 54.3 | Bei „Hintergrundlicht (LED hinter dem TV)“ ein Licht wählen, das Licht einschalten, dann schwenken | Der Rahmen hinter dem Fernseher leuchtet in der Farbe des Lichts und dreht sich mit dem Fernseher mit | ✅ (2026-10-21) |
| 54.4 | Etwas ändern, Strg+Z; dann die Seite neu laden | Strg+Z holt die vorige Stellung zurück; nach dem Neuladen steht er noch so, wie eingestellt | ✅ (2026-10-21) |
| 54.5 | Links die Gruppe „Klima & Lüftung“ öffnen | Klimagerät (Split, Wand), Klima-Außengerät / Wärmepumpe, mobiles Klimagerät, Klima-Deckenkassette, Deckenventilator mit Licht, Standventilator, Turmventilator, Luftreiniger, Luftentfeuchter, jeweils mit Vorschaubild | ✅ (2026-10-21) |
| 54.6 | Das Split-Klimagerät an eine Wand setzen, mit dem Thermostat (`climate.…`) verknüpfen, in „Live“ auf Kühlen, dann auf Heizen stellen | Kühlt es, wird die Klappe unten blau, heizt es, wird sie rot; das Display leuchtet, solange es läuft (auch bei nur Lüften oder Entfeuchten); das Schild zeigt die Temperatur | ✅ (2026-10-21) |
| 54.7 | Ein mobiles Klimagerät an einer Steckdose (`switch.…`) einschalten | Der Luftauslass oben wird blau (es kühlt), das Display leuchtet | ✅ (2026-10-21) |
| 54.8 | Den Deckenventilator mit seinem Ventilator (`fan.…`) verknüpfen, unter „LEDs einzeln verknüpfen“ bei „Licht“ die Lampe des Ventilators wählen | Die Leuchte unter dem Ventilator folgt ihrem eigenen Licht und erhellt den Raum | ✅ (2026-10-21) |

## 55. Neu in 3.88: Etagen aufeinander wie ein echtes Haus
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 55.1 | „Ganzes Haus“, unten „Ansicht“ öffnen | Neben „Auseinander“ steht ein Knopf **„Aufeinander“**; in einer einzelnen Etage sind beide nicht da | ✅ (2026-10-21) |
| 55.2 | „Aufeinander“ drücken, das Haus von der Seite ansehen | Die Etagen sitzen ohne Lücke aufeinander, zwischen ihnen ist eine Decke (ein etwa 40 cm hohes Band in der Fassade), die Wände unter dem Dach reichen bis an das Dach; an der Treppe ist die Decke offen | ✅ (2026-10-21) |
| 55.3 | Noch einmal „Aufeinander“ drücken; dann „Auseinander“ und danach „Aufeinander“ | Wieder die gewohnte Ansicht (kleine Lücke); „Auseinander“ und „Aufeinander“ lösen sich ab, nur einer ist gedrückt | ✅ (2026-10-21) |
| 55.4 | „Aufeinander“ an, „Live“, schräg von oben schauen, dann tiefer von der Seite in das Erdgeschoss schauen | Die Kugeln (💡), Schilder (z. B. „22,1 °C“) und Raumnamen vom Erdgeschoss schweben nicht über dem 1. Stock; von der Seite sieht man sie im Erdgeschoss unter der Decke | ✅ (2026-10-21) |
| 55.5 | Seite neu laden, „Ganzes Haus“; ⚙ öffnen | Das Haus steht wieder „aufeinander“; in ⚙ steht bei „Etagen im ganzen Haus“ „Aufeinander (wie ein echtes Haus)“, dort lässt es sich auch umstellen | ✅ (2026-10-21) |
| 55.6 | Haus ohne Keller, Erde „fest“: den 1. Stock öffnen (#391) | Das Erdgeschoss darunter ist blass, aber darunter ist Boden (grau), kein schwarzes Loch im Rasen | ✅ (2026-10-21) |
| 55.7 | Das Erdgeschoss öffnen, dann „Ganzes Haus“ und „Live“ (#392) | Auch die Lampen im 1. Stock haben ihre Kugeln und leuchten, wenn sie an sind; ebenso umgekehrt (erst den 1. Stock öffnen: das Erdgeschoss hat seine Kugeln) | ✅ (2026-10-21) |

## 56. Neu in 3.89: flüssig auf dem iPad, „Aufeinander“ auch bei einer Etage
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 56.1 | Auf dem iPad das Musterhaus („alles drin“) öffnen, in „Live“ drehen und zoomen, auch in „Ganzes Haus“ (#394) | Es läuft flüssig, ruckelt nicht mehr | ❓ (Claude 2026-11-06: nur am echten iPad zu beurteilen) |
| 56.2 | Unten „Ansicht“ → „⏱ Leistung“ auf „alle Werte“ | Bei „Zeichenaufrufe“ stehen im ganzen Haus etwa 1.300 statt früher etwa 3.700 | ❓ (Claude 2026-10-25 im Test-Add-on: im ganzen Haus 1.661 Zeichenaufrufe; flüssig ist es nur am iPad zu beurteilen) |
| 56.3 | Möbel, Bar, Sauna, Küche, Türen, Fenster und Treppen ansehen; eine Lampe, eine LED-Zone, einen Rollladen und eine Tür mit Kontakt schalten | Alles sieht aus wie vorher; was leuchtet, leuchtet; Türen und Fenster gehen auf, Rollläden fahren | ✅ (2026-10-21) |
| 56.4 | Eine Etage öffnen (z. B. Obergeschoss), unten „Ansicht“ öffnen (#396) | „Aufeinander“ steht da, „Auseinander“ nicht (das gibt es nur in „Ganzes Haus“) | ✅ (2026-10-21) |
| 56.5 | „Aufeinander“ drücken, von der Seite schauen | Die Etage sitzt ohne Lücke auf der Etage darunter (Decke dazwischen); die Namen und Schilder der Etage darunter schweben nicht mehr über der offenen Etage | ✅ (2026-10-21) |
| 56.6 | „Benutzer“ → bei einem Benutzer unter „🔒 Gesperrt“ „Abstand der Etagen (Auseinander / Aufeinander)“ abhaken, als dieser Benutzer öffnen | Die Knöpfe „Auseinander“ und „Aufeinander“ fehlen; die Ansicht bleibt so, wie sie eingestellt ist | ✅ (2026-10-25, Claude im Test-Add-on) |
| 56.7 | README auf GitHub öffnen (#395) | Das Abzeichen „release“ zeigt die Version (v3.89.0), keinen Fehlertext | ✅ (2026-10-21) |

## 57. Neu in 3.90: Garage, Werkstatt und Carport
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 57.1 | Bearbeiten, Werkzeug „Gerät“, links die Gruppe „Fahrzeuge“ öffnen | Kleinwagen, Limousine, Kombi, SUV, Sportwagen, Pick-up, Transporter / Kleinbus, Kastenwagen (Camper), Wohnmobil, Alkoven-Wohnmobil, Wohnwagen, PKW-Anhänger, Motorrad, Motorroller, Fahrrad, E-Bike, Lastenrad, Aufsitzmäher, Mähroboter mit Ladestation, jedes mit Vorschaubild | ✅ (2026-10-21) |
| 57.2 | Die Gruppen „Werkstatt“ und „Garage & Carport“ öffnen | Werkstatt: Werkbank (auch mit Lochwand und Licht), Lochwand, Werkstattwagen, Werkzeugschrank, Schwerlastregal, Sichtlagerkästen, Hebebühne, Wagenheber, Kompressor, Standbohrmaschine, Tischkreissäge, Schleifbock, Schweißgerät, Werkstattsauger, Reifenregal, Reifensatz, Stehleiter, zwei Werkstattleuchten, Feuerlöscher, Ölfass, Rollbrett. Garage & Carport: Carport, Doppelcarport, Solarcarport, Mülltonnen, Mülltonnenbox, Fahrradständer, Fahrrad an der Wand, Deckenregal, Metallschrank, Schubkarre, Rasenmäher, Gartengeräte, Hochdruckreiniger, Radstopper | ✅ (2026-10-21) |
| 57.3 | Im Suchfeld „wohnmobil“, „hebebühne“, „mülltonne“, „kombi“ eingeben | Es werden die passenden Teile gefunden | ✅ (2026-10-21) |
| 57.4 | Ein Auto und das Wohnmobil in die Garage stellen, von allen Seiten ansehen, im 2D-Plan die Größe ansehen | Sie sind so groß wie in echt (Kombi etwa 4,8 m lang, Wohnmobil 7 m lang und fast 3 m hoch); man sieht Fenster, Räder, Lichter, Spiegel | ✅ (2026-10-21) |
| 57.5 | Ein Auto anklicken, rechts bei „Ausführung“ eine andere Farbe wählen, Strg+Z; dann eine wählen und die Seite neu laden | Die Farbe wechselt (glänzend wie Autolack); Strg+Z holt die vorige zurück; nach dem Neuladen ist die gewählte noch da | ✅ (2026-10-21) |
| 57.6 | Das Auto mit einem Schalter verknüpfen, „Live“, ein- und ausschalten | Eingeschaltet leuchten vorne die Scheinwerfer weiß und hinten die Rücklichter rot; ausgeschaltet sind sie dunkel | ✅ (2026-10-21) |
| 57.7 | Die „LED-Werkstattleuchte“ und die „Werkbank mit Lochwand und Licht“ setzen, mit Lichtern verknüpfen, in „Live“ schalten; die Lochwand, die Sichtlagerkästen und den Feuerlöscher nahe an eine Wand setzen | Die Leuchten und das Licht unter dem Brett der Werkbank leuchten und erhellen den Raum; die Wandteile springen an die Wand | ✅ (2026-10-21) |
| 57.8 | Im Add-on das Musterhaus („alles drin“) neu importieren, Erdgeschoss öffnen | In der Garage stehen der blaue Kombi, die Werkbank, ein Regal, ein Fahrrad an der Wand; vorne rechts auf dem Grundstück ein Hof mit Carport, Doppelcarport, Solarcarport, Autos, Wohnmobilen, Wohnwagen, Anhänger und einer Limousine auf der Hebebühne | ➖ |

## 58. Neu in 3.91: Messen, Abstand und Winkel zweier Wände
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 58.1 | Bearbeiten, in der 3D-Ansicht die Taste M drücken | Das Werkzeug „Messen“ ist an, es öffnet sich 2D + 3D, rechts steht der Abschnitt „Messen“ mit „Klicke den ersten Punkt“ | ✅ (2026-10-20) |
| 58.2 | Im 2D-Plan zwei Punkte anklicken (eine Ecke, dann irgendwo); mit Alt gedrückt zwei freie Punkte | Gelbe Linie mit Länge im Plan und im 3D-Bild; rechts die Länge groß, darunter ↔, ↕ und der Winkel; Ecken und Wandflächen rasten ein, mit Alt nicht | ✅ (2026-10-20) |
| 58.3 | Im 3D-Bild von 2D + 3D zwei Punkte auf dem Boden anklicken | Auch so wird gemessen, die Linie erscheint in beiden Bildern | ✅ (2026-10-20) |
| 58.4 | Zwei gegenüberliegende Wände eines Raums nacheinander anklicken (auf die Wand, nicht auf die Ecke) | Die erste Wand ist blau gestrichelt, die zweite orange; rechts „Innenmaß (Wand bis Wand)“ (bis 4.2.0 „Lichter Abstand“) und „Abstand der Wandmitten“, im Plan ein grüner Abstand im rechten Winkel | ✅ (2026-10-20) |
| 58.5 | Beim „Innenmaß (Wand bis Wand)“ (bis 4.2.0 „Lichter Abstand“) 4 eintippen, „Setzen“ (oder Enter) | Die orange Wand rückt so, dass zwischen den Wandflächen genau 4,00 m sind; die Wände daneben werden länger / kürzer, der Raum und seine Fläche passen sich an; Türen und Fenster in der verschobenen Wand bleiben drin | ✅ (2026-10-21; Wunsch: „Lichter Abstand“ umbenennen, jetzt „Innenmaß (Wand bis Wand)“, 77.4) |
| 58.6 | „⇄ Die andere Wand bewegen“, einen Wert setzen; dann Strg+Z | Jetzt bewegt sich die andere Wand; Strg+Z holt den Stand davor zurück | ✅ (2026-10-21) |
| 58.7 | Zwei Wände in einer Ecke anklicken, beim „Winkel“ 120 setzen, dann 90 | Im Plan steht der Winkel in der Ecke; die zweite Wand dreht sich um die Ecke, bleibt gleich lang, die Wand an ihrem anderen Ende zieht mit; mit 90 ist es wieder rechtwinklig | ✅ (2026-10-21) |
| 58.8 | Eine gesperrte Wand (in der Objektliste abgehakt) als zweite Wand nehmen und einen Abstand setzen; Esc; ein anderes Werkzeug wählen | Die gesperrte Wand bewegt sich nicht, oben steht ein Hinweis; Esc löscht die Messung; mit einem anderen Werkzeug verschwindet der Abschnitt „Messen“ | ✅ (2026-10-21) |

## 59. Neu in 3.92: Bar mit Deckenteil
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 59.1 | Bearbeiten, eine „Bartheke über Eck mit LED“ setzen und anklicken | Rechts steht „An der Decke“ mit „Nichts“; darunter ein kurzer Hinweis; bei „LEDs einzeln verknüpfen“ stehen Thekenkante und Sockel | ✅ (2026-10-20) |
| 59.2 | Bei „An der Decke“ „Gläserregal mit hängenden Gläsern“ wählen, die Bar von allen Seiten ansehen | Über der Theke hängt in L-Form ein Brett mit Stahlrahmen an Stangen von der Decke, darunter zwei Reihen Weingläser kopfüber und ein LED-Streifen; es folgt der Theke genau | ✅ (2026-10-20) |
| 59.3 | „Deckensegel mit LED“, dann „Pendelleuchten“ wählen | Ein schwebendes Brett in der Farbe der Bar mit Licht oben und Spots unten; dann eine schwarze Schiene an der Decke mit 5 Pendelleuchten (bei der geraden Bar 3) | ✅ (2026-10-20) |
| 59.4 | Dasselbe mit der geraden „Bartheke mit LED“ | Regal, Segel und Leuchten sind gerade und so lang wie die Theke | ✅ (2026-10-20) |
| 59.5 | Im 2D-Plan die Bar ansehen, bei den Maßen rechts auf „Höhe“ schauen, an eine Wand schieben | Im Plan ist sie so groß wie vorher; „Höhe“ zeigt die Theke (etwa 1,2 m), nicht die Decke; sie stoppt an der Wand wie vorher | ✅ (2026-10-20) |
| 59.6 | Bei „LEDs einzeln verknüpfen“ beim „Deckenteil“ ein Licht wählen, ein- und ausschalten | Das Licht des Deckenteils folgt seinem eigenen Licht, die Theke dem Licht der Bar; ohne eigenes Licht leuchtet es mit der Bar | ✅ (2026-10-20) |
| 59.7 | „Live“, die Bar antippen; danach wieder „An der Decke: Nichts“ wählen | Die Karte hat einen Knopf „Deckenteil“; mit „Nichts“ ist das Deckenteil weg, sein Licht auch, Thekenkante und Sockel bleiben | ✅ (2026-10-20) |
| 59.8 | Im Add-on das Musterhaus („alles drin“) neu importieren | Über der Bar im Keller hängt ein Gläserregal | ➖ |

## 60. Neu in 3.93: Wiederholen, Kopieren und Einfügen, Schutz beim Speichern, Geländer der Wendeltreppe
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 60.1 | Bearbeiten, oben rechts neben „Speichern“ schauen | Zwei Knöpfe ↶ und ↷, beide grau (es gibt noch nichts rückgängig zu machen) | ✅ (2026-10-20) |
| 60.2 | Eine Lampe anklicken, mit einer Pfeiltaste verschieben, Strg+Z, dann Strg+Y (oder Strg+Umschalt+Z) (#404) | Strg+Z holt sie zurück, Strg+Y schiebt sie wieder hin; ↶ und ↷ werden je nachdem drückbar oder grau | ✅ (2026-10-20) |
| 60.3 | Strg+Z, dann etwas anderes ändern, dann Strg+Y | Nach einer neuen Änderung gibt es nichts mehr zu wiederholen (↷ grau) | ✅ (2026-10-20) |
| 60.4 | Eine Lampe anklicken, Strg+C, dann zweimal Strg+V (#405) | Oben steht „Kopiert: 1“; jede Kopie steht ein Stück weiter rechts unten und ist gleich ausgewählt; sie hat dasselbe Licht verknüpft | ✅ (2026-10-20) |
| 60.5 | Eine Kopie anklicken, Strg+D, dann Strg+Z | Strg+D verdoppelt sie direkt daneben; ein Strg+Z nimmt die Kopie wieder weg | ✅ (2026-10-20) |
| 60.6 | Nach Strg+C auf eine andere Etage wechseln, Strg+V | Dieselbe Lampe steht dort an derselben Stelle | ✅ (2026-10-20) |
| 60.7 | Im 2D-Plan mit Strg + Rahmen einen Raum mit Wänden, Fenstern und Möbeln auswählen, Strg+D | Alles zusammen wird verdoppelt (Wände mit ihren Fenstern, Raum, Möbel), ein Stück versetzt, und ist ausgewählt; es lässt sich gleich zusammen verschieben | ✅ (2026-10-20) |
| 60.8 | Ein Fenster anklicken, Strg+D, nochmal Strg+D | Ein zweites (drittes) gleiches Fenster in derselben Wand daneben; ist die Wand voll, steht oben „kein Platz in der Wand“ | ✅ (2026-10-20) |
| 60.9 | Eine Wendeltreppe mit „Etagen“ 2 setzen, „Ganzes Haus“, von der Seite ansehen (#318) | Auf der Etage dazwischen endet das Geländer am Podest und fängt nach dem Podest neu an; der Ausstieg auf die Etage ist frei | ✅ (2026-10-17) |
| 60.10 | Im Add-on den Plan in zwei Fenstern im Bearbeiten öffnen; im ersten eine Lampe verschieben, kurz warten (#403) | Das erste Fenster speichert normal („Gespeichert ✓“) | ➖ |
| 60.11 | Im zweiten Fenster etwas anderes verschieben, kurz warten | Es kommt die Frage „Plan wurde woanders geändert“ mit zwei Knöpfen; Esc schließt sie nicht. „Die andere Version laden“: das zweite Fenster zeigt jetzt die Lampe vom ersten Fenster, die eigene Änderung ist weg | ➖ |
| 60.12 | Noch einmal: im ersten Fenster ändern, dann im zweiten, diesmal „Meine Version behalten“ | Das zweite Fenster speichert über das erste; nach dem Neuladen des ersten Fensters ist dort der Stand vom zweiten | ➖ |

## 61. Neu in 3.94: mehrere Gebäude in einem Plan (#409)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 61.1 | Bearbeiten, rechts „🏘 Gebäude in diesem Plan“ aufklappen | Ein Hinweis, der Knopf „+ Gebäude“ und unten „Anderes Haus hereinholen“ | ✅ (2026-10-20) |
| 61.2 | Zweimal „+ Gebäude“, die Namen auf „Haupthaus“ und „Gartenhaus“ ändern | Beide stehen in der Liste, oben erscheint die Auswahl „🏘 Alle Gebäude“ | ✅ (2026-10-20) |
| 61.3 | Bei den Räumen des Erdgeschosses jeweils das Gebäude wählen | Die Räume der oberen Etagen zeigen „automatisch (…)“ mit dem Gebäude des Raums darunter | ✅ (2026-10-20) |
| 61.4 | Ein Gebäude mit × löschen, dann Strg+Z | Die Räume bleiben, gehören zu keinem Gebäude mehr; Strg+Z holt das Gebäude zurück | ✅ (2026-10-20) |
| 61.5 | Oben „Gartenhaus“ wählen, dann einen neuen Raum im Gartenhaus zeichnen | Der neue Raum gehört zum Gartenhaus (in der Liste rechts) | ✅ (2026-10-20) |
| 61.6 | Oben „Gartenhaus“ wählen, in 3D und 2D ansehen | Nur das Gartenhaus mit seinen Räumen, Wänden und Geräten; Gartenmöbel (in keinem Raum) bleiben; das Bild zeigt das Gartenhaus formatfüllend | ✅ (2026-10-20) |
| 61.7 | Links die Etagen ansehen | Etagen ohne etwas vom Gartenhaus (z. B. das Obergeschoss) fehlen | ✅ (2026-10-20) |
| 61.8 | „Ganzes Haus“ und „Live“ mit „Gartenhaus“ | Auch dort nur das Gartenhaus; Warnungen (Rauch, Wasser) kommen weiter für den ganzen Plan | ✅ (2026-10-20) |
| 61.9 | Oben „🏘 Alle Gebäude“, rechts bei den Dächern „🏠 Jedes Gebäude bekommt sein eigenes Dach“ | Jedes Gebäude hat ein eigenes Dach in derselben Form (vorher eins über allen, mit Hinweis) | ✅ (2026-10-20) |
| 61.10 | „Benutzer“ → bei einem Benutzer ⚙ → „Gebäude“: Gartenhaus wählen, unter „🔒 Gesperrt“ „Gebäude wechseln“ abhaken, als dieser Benutzer öffnen | Er sieht nur das Gartenhaus, die Auswahl oben fehlt | ➖ |
| 61.11 | Dasselbe ohne den Haken „Gebäude wechseln“ | Er startet im Gartenhaus, kann aber oben umschalten | ➖ |
| 61.12 | Unten „Anderes Haus hereinholen“: ein Haus der Liste wählen, „⤵ Hereinholen“ | Es wird ein Gebäude dieses Plans: steht es als Nachbarhaus daneben, genau dort, sonst 3 m rechts daneben; seine Etagen liegen auf den Etagen gleicher Höhe | ✅ (2026-10-20) |
| 61.13 | Danach Strg+Z | Alles Hereingeholte ist wieder weg; das andere Haus steht weiter in der Häuser-Liste | ✅ (2026-10-20) |

## 62. Neu in 3.95: Energie leichter einrichten (#407)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 62.1 | Bearbeiten, „Strom-Editor“, daneben „⚡ Rechnung“ | Ganz oben steht „🧭 Einrichten“ mit dem Knopf „⤵ Aus dem Energie-Dashboard übernehmen“ und darunter die Checkliste (✅ eingerichtet, ○ fehlt noch, ⚠ bitte prüfen, ℹ zur Info) | ✅ (2026-10-20) |
| 62.2 | In der Demo: „⤵ Aus dem Energie-Dashboard übernehmen“ | Die Liste zeigt Netz (Netzbezug), Solar (PV Wechselrichter), Batterie mit „Vorzeichen umgedreht“, Ladestand und drei Zähler | ✅ (2026-10-20) |
| 62.3 | „✓ Übernehmen“ | Die Zeile darunter sagt „Übernommen: Netz, Solar, Batterie“; unten in den Feldern stehen diese Sensoren, die Rechnung geht auf; Strg+Z nimmt es zurück | ✅ (2026-10-20) |
| 62.4 | In der Checkliste bei „Zähler“ auf „+ Wasserzähler in den Plan setzen“ | Der Wasserzähler Garten steht in der Mitte der Etage und ist mit seinem Sensor verknüpft; die Zeile wird ✅ | ✅ (2026-10-20) |
| 62.5 | Im Add-on mit eingerichtetem Energie-Dashboard: „⤵ Aus dem Energie-Dashboard übernehmen“, dann „✓ Übernehmen“ | Netz, Solar und Batterie wie im Energie-Dashboard von Home Assistant; die Rechnung oben stimmt (Batterie „lädt“ / „entlädt“ richtig herum) | ➖ |
| 62.6 | Im Add-on, wenn im Energie-Dashboard nur Zähler in kWh stehen (keine Watt-Sensoren) | Der Vorschlag nimmt den Watt-Sensor am selben Gerät und schreibt „geraten (Sensor am selben Gerät), bitte unten prüfen“ dazu | ➖ |
| 62.7 | Im Add-on ohne eingerichtetes Energie-Dashboard | Die Zeile sagt, dass das Energie-Dashboard noch nicht eingerichtet ist; nichts wird geändert | ➖ |

## 63. Neu in 3.96: mehr Geräte direkt im Plan steuern (#406)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 63.1 | In der Demo „Live“, den **Lautsprecher** im Wohnzimmer (vorne rechts) antippen | Die Karte zeigt „♪ Sommerregen – Die Demo-Band“, die Knöpfe ⏮ ⏸ ⏭, „Aus“, den Lautstärke-Schieber (35 %), 🔈 und „Quelle“ | ✅ (2026-10-25, Claude in der Demo) |
| 63.2 | ⏭ drücken, dann ⏸, den Lautstärke-Schieber ziehen, die Quelle auf „Radio“ stellen | Der Titel wechselt, ⏸ wird zu ▶, Lautstärke und Quelle bleiben so stehen | ✅ (2026-10-25, Claude in der Demo; die Zahl neben dem Schieber blieb stehen: #524, 101.6) |
| 63.3 | Den **Fernseher** antippen | Auch er hat jetzt ⏮ ⏸ ⏭, Lautstärke und die Quellen (HDMI 1, HDMI 2, Netflix, YouTube) | ✅ (2026-10-25, Claude in der Demo) |
| 63.4 | Den **Saugroboter** in der Küche antippen, „Saugen“ | Oben steht „🔌 An der Station“, nach „Saugen“ „🧹 Saugt“ und die Knöpfe „Pause“ und „Zur Station“; die Saugstufe lässt sich wählen | ✅ (2026-10-28, Claude in der Demo: „An der Station“, nach „Saugen“ „🧹 Saugt“ mit Pause, Zur Station und Saugstufe; repariert in #473, geprüft als 77.1. Damals ❌ 2026-10-21: „es gibt dort keinen Saugroboter“) |
| 63.5 | Den **Standventilator** im Wohnzimmer antippen | An / Aus / Umschalten, der Schieber „Stufe“ (springt auf 33, 67 oder 100 %), „↔ Schwenken“ und die Modi Normal / Natur / Nacht | ✅ (2026-10-21) |
| 63.6 | Die **Alarmanlage** (Schalter rechts im Büro an der Außenwand) antippen, „Scharf (abwesend)“ | Oben steht rot „🛡 Scharf (abwesend)“, darunter ein Feld „Code“ und „Unscharf schalten“ | ✅ (2026-10-20) |
| 63.7 | Einen falschen Code eingeben und „Unscharf schalten“, dann 1234 | Mit dem falschen Code bleibt sie scharf und unten steht „Aktion fehlgeschlagen“; mit 1234 ist sie wieder „Unscharf“ | ✅ (2026-10-20) |
| 63.8 | Den **Hausmodus** antippen und „Urlaub“ wählen; die **Heizung** im Wohnzimmer antippen | Der Hausmodus steht auf „Urlaub“; die Heizungskarte hat − / +, die Modi und neu „Vorwahl“ (Eco, Komfort, Abwesend, Boost) | ✅ (2026-10-28, Claude in der Demo: Hausmodus „Urlaub“ antippbar und gesetzt; repariert in #474, geprüft als 77.2, 77.3. Damals ❌ 2026-10-21: „den Knopf Urlaub finde ich nicht“) |
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
| 65.1 | Demo öffnen, „Live“ | Hinter dem Haus ein Himmel passend zur Uhrzeit statt Schwarz (tagsüber blau); oben rechts z. B. „☀️ Tag · 14:05 · Sonnenuntergang …“ und darunter „⛅ Teilweise bewölkt · 14 °C · Wind 12 km/h“ | ✅ (2026-10-20) |
| 65.2 | Adresse mit `?skytime=21:30`, dann mit `?skytime=18:05` | 21:30: dunkelblau mit Sternen, der Rasen dunkler, „🌙 Nacht · … · Sonnenaufgang …“; 18:05: lila und orange am Horizont, „Abenddämmerung“ bzw. „Abend“. Die Lampen leuchten **nicht** extra (wie gewünscht) | ✅ (2026-10-20) |
| 65.3 | Adresse mit `?weather=rainy`, dann `?weather=snowy` | Grauer Himmel, Regen fällt über das Bild, oben „🌧️ Regen · …“; bei Schnee fallen Flocken. Im Bearbeiten-Modus fällt nichts | ✅ (2026-10-20) |
| 65.4 | ⚙ → „Himmel“ auf „Einfarbig“, dann zurück auf „Nach Uhrzeit und Wetter“ | Einfarbig: der Hintergrund wie früher, keine Anzeigen oben rechts; danach ist der Himmel wieder da | ✅ (2026-10-20) |
| 65.5 | Mit `?weather=rainy`: oben die rote Warnung „Fenster offen bei Regen · Fenster Wohnzimmer“. Bearbeiten, das Wohnzimmerfenster anklicken, Haken **„Bei Regen warnen“** wegnehmen | Die Warnung verschwindet; Haken wieder setzen: sie ist wieder da | ✅ (2026-10-20) |
| 65.6 | „Live“ am PC: oben rechts die Karte **„Strom jetzt“** ansehen | Sonne 3.20 kW, Netz 450 W „Bezug vom Netz“, Haus 3.05 kW, Batterie 82 % „lädt 600 W“; Punkte wandern von der Sonne zum Haus und zur Batterie und vom Netz zum Haus; die Zahlenzeile oben links ist weg | ✅ (2026-10-20) |
| 65.7 | Die Karte antippen, dann „Ansicht“ → „Strom als Bild“ | Antippen: die Strom-Kabel im Haus erscheinen (nochmal: weg). „Strom als Bild“ aus: die Zahlenzeile ist zurück | ✅ (2026-10-20) |
| 65.8 | „Live“ am PC: unten über „Normal / Temp. …“ die **Raum-Kacheln** | Eine Karte pro Raum: Name, Temperatur (z. B. Wohnzimmer 21,3°), „💡 5 an“ mit farbigem Rand, „🪟 offen“, 👤 im Büro und Wohnzimmer; Räume ohne Licht „aus“ | ✅ (2026-10-20) |
| 65.9 | Eine Kachel antippen, dann nochmal; „Ganzes Haus“ und eine Kachel aus dem Obergeschoss antippen | Die Kamera fliegt in den Raum, rechts die Raum-Karte; nochmal: zurück. Ganzes Haus: alle Räume mit Etage, der Tipp öffnet die Etage und den Raum | ✅ (2026-10-20) |
| 65.10 | Am Handy hochkant „Live“ | Die Kacheln sind kleiner und lassen sich zur Seite wischen; oben rechts keine Uhrzeit- und keine Strom-Karte (dort bleibt 📊) | ✅ (2026-10-21) |
| 65.11 | „Ansicht“ → „Raum-Kacheln“ ausschalten, wieder einschalten | Die Leiste verschwindet und kommt wieder | ✅ (2026-10-20) |
| 65.12 | Bearbeiten: die Werkzeugleiste oben ansehen | Symbole mit Namen darunter, in Gruppen „ZEICHNEN“, „SETZEN“, „WERKZEUGE“; das gewählte Werkzeug blau; jedes Werkzeug funktioniert wie vorher | ✅ (2026-10-20) |
| 65.13 | „Mehr“ (⋯) antippen, dann ✎ (Werkzeuge anpassen): ein Werkzeug ausblenden, eins verschieben, „Zurücksetzen“ | „Mehr“ zeigt „Import“; im Anpassen stehen die vollen Namen („Räume erkennen“, „Strom-Editor“); die Gruppen passen sich an, Zurücksetzen stellt alles wieder her | ✅ (2026-10-20) |
| 65.14 | Im Add-on: Live-Modus mit echtem `sun.sun` und echter Wetter-Entität | Der Himmel passt zur echten Tageszeit, die Anzeige nennt den echten Sonnenuntergang bzw. -aufgang und das echte Wetter | ➖ |
| 65.15 | Im Add-on: ein echtes Fenster, das bei Regen offen bleiben darf, „Bei Regen warnen“ abhaken | Bei Regen keine Warnung für dieses Fenster, die anderen warnen weiter | ➖ |
| 65.16 | Neu in 3.98.1: „Bearbeiten“ am PC | Oben rechts steht auch hier die Karte „Strom jetzt“, die kleine Zahlenzeile ist weg; ein Tipp auf die Karte zeigt die Kabel | ✅ (2026-10-20) |
| 65.17 | Neu in 3.98.2: die Karte „Strom jetzt“ ansehen, wenn die Batterie weder lädt noch entlädt (im Add-on z. B. nachts bei fast leerer Batterie) | Unter der Batterie steht „ruht · 0 W“ statt nur „Batterie“; meldet die Batterie keine Leistung (kein Leistungs-Sensor eingerichtet), steht dort „kein Leistungs-Sensor“. Lädt sie, steht weiter „lädt … W“ | ➖ |

## 66. Neu in 3.99: echte Böden, dunkle Fensterrahmen, Glas-Optik, Raum-Schilder (#427 bis #430)
Vorlage: die Beispielbilder in `docs/ideen-3.99/` (1, 2, 4 und 5). Die Demo hat die Böden und die anthrazitfarbenen Fensterrahmen schon eingestellt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 66.1 | Demo öffnen, „Live“, Erdgeschoss, nah heranzoomen | Wohnzimmer Parkett (Eiche), Küche helle Fliesen, Bad kleine Fliesen, Schlafzimmer helles Parkett, Büro dunkles Parkett, Garage Beton; die Muster wirken nicht verzerrt | ✅ (2026-10-20) |
| 66.2 | Unten „Temp.“, dann „Normal“ | Bei „Temp.“ färben sich die Böden nach der Temperatur (ohne Muster), bei „Normal“ sind die Muster wieder da | ✅ (2026-10-20) |
| 66.3 | „Bearbeiten“, einen Raum anklicken, rechts „Boden“: z. B. „Fliesen anthrazit (60 cm)“, dann „Einfarbig“ | Der Boden wechselt sofort; bei einem Muster verschwindet das Farbfeld, bei „Einfarbig“ ist es wieder da | ✅ (2026-10-20) |
| 66.4 | „2D“ ansehen | Die Räume haben die Farbe ihres Bodens (Parkett braun, Fliesen hell, Beton grau); auch die kleinen Etagen-Bilder links | ✅ (2026-10-20) |
| 66.5 | Fenster von außen ansehen | Die Fensterrahmen sind anthrazit, die Wände heller; Türrahmen bleiben weiß. ⚙ → „Fensterrahmen“ → „Weiß“ stellt den alten Look her | ✅ (2026-10-20) |
| 66.6 | Die Knöpfe unten (Normal, Temp. …), oben (Zimmer, Geräte …) und die Etagen-Karten links ansehen | Leicht durchsichtig wie Milchglas, das Bild scheint verschwommen durch; im hellen Design helles Glas | ✅ (2026-10-20) |
| 66.7 | „Live“: über den Räumen | Über jedem Raum ein Schild: Name, Temperatur, „💡 5“ wenn Lichter an sind (Rand in Lichtfarbe), 🪟 bei offenem Fenster, grüner Punkt wenn jemand da ist; die Kugeln und Werte der Geräte und die Namen auf dem Boden sind weg (entweder Schilder oder Geräte); die Schilder wandern beim Drehen mit | ✅ (2026-10-20) |
| 66.8 | „Ansicht“ → „Im Bild: Raum-Schilder“ antippen, dann noch einmal | Es steht „Im Bild: Geräte“: keine Schilder, die Kugeln und Werte der Geräte und die Namen auf dem Boden sind wieder da; noch ein Tipp: wieder die Schilder | ✅ (2026-10-20) |
| 66.9 | Ein Schild (z. B. „Wohnzimmer“) antippen, dann unten die Kachel des Raums | Der Raum öffnet sich mit seinen Geräten (Kugeln und Werte), keine Schilder; nach dem Kachel-Tipp wieder die Schilder. Bei „Ganzes Haus“ und im Bearbeiten-Modus keine Schilder, dort die Geräte wie bisher | ✅ (2026-10-20) |
| 66.10 | Neu in 3.99.6 (#444): am Handy „Live“, „Ansicht“ → „Im Bild: Raum-Schilder“ (bis 3.99.5 gab es am Handy keine Schilder) | Über den Räumen kleine Schilder (Name, Temperatur, Lichter …), Räume ohne Platz zeigen einen Punkt; ein Tipp auf ein Schild öffnet den Raum unten. „Im Bild: Geräte“ zeigt wieder die Kugeln und die Namen auf dem Boden | ✅ (2026-10-20) |
| 66.11 | Im Add-on: eigenen Räumen einen Boden geben, Fensterrahmen auf „Anthrazit“ | Bleibt nach dem Neuladen so; ein Tablet im Sparmodus „Schnell“ zeigt die Böden einfarbig in ihrer Farbe | ➖ |
| 66.12 | Neu in 3.99.1: „Live“, das Bild flach von der Seite drehen (Räume hintereinander) | Die Raum-Schilder liegen nicht übereinander: das hintere rückt nach oben, ein Strich führt zu seinem Raum | ✅ (2026-10-20) |
| 66.13 | Neu in 3.99.1: oben links und in der Karte „Strom jetzt“ nachsehen | Oben links keine Zeile mit Wasser, Gas und Wärme mehr; die Zähler stehen unten in der Karte „Strom jetzt“ (🚰 1234.6 m³ · 🔥 845.2 m³ · ♨ 5321 kWh). Am Handy bleibt die Zeile | ✅ (2026-10-20) |
| 66.14 | Neu in 3.99.2: „Live“, links „Ganzes Haus“ (oder das Fenster schmaler machen) | Passen die Raum-Kacheln unten nicht alle hin, ist rechts ein Pfeil ›, der Rand wird weich ausgeblendet; der Pfeil (oder das Mausrad über den Kacheln) schiebt weiter, dann ist links ein Pfeil ‹. Nichts ist einfach abgeschnitten | ✅ (2026-10-20) |
| 66.15 | Neu in 3.99.2: „Ganzes Haus“ mit der Karte „Strom jetzt“ oben rechts | Die Etagen-Karten (Obergeschoss, Erdgeschoss …) liegen nicht unter der Karte „Strom jetzt“, sondern daneben bzw. auf der anderen Seite des Hauses | ✅ (2026-10-20) |
| 66.16 | Neu in 3.99.3 (#434): „Live“ auf dem Tablet oder PC, unten „Strom“ **nicht** gedrückt | Oben rechts keine Karte „Strom jetzt“ und auch keine Zahlenzeile oben links | ✅ (2026-10-20) |
| 66.17 | Unten „Strom“ drücken, dann auf die Karte „Strom jetzt“ tippen | Mit „Strom“ erscheint die Karte (und die Kabel im Haus); ein Tipp auf die Karte schaltet „Strom“ wieder aus, die Karte verschwindet | ✅ (2026-10-20) |
| 66.18 | Neu in 3.99.4 (#436): auf dem Tablet „Live“, unten eine Raum-Kachel antippen | Die Kachel des Raums bleibt lesbar: Name, Temperatur und Licht stehen hell auf blau getöntem Grund (vorher war sie leer) | ✅ (2026-10-20) |
| 66.19 | Nachts „Live“ ansehen (in der Demo `?skytime=23:30` an die Adresse hängen) | Viel mehr Sterne, verschieden hell, ein paar leuchten sanft, eine schwache Milchstraße; bei „bewölkt“ scheinen noch einige Sterne durch, die Wolken liegen davor | ✅ (2026-10-20) |
| 66.20 | „Live“ mit vielen Räumen, das Bild flach von der Seite ansehen (wie auf dem Foto mit den langen Strichen) | Keine Türme aus Schildern mit langen Strichen: höchstens zwei Reihen; Räume ohne Platz zeigen einen kleinen Punkt, ein Tipp darauf öffnet den Raum; beim Heranzoomen werden aus den Punkten wieder Schilder | ✅ (2026-10-20) |
| 66.21 | Neu in 3.99.5 (#438): am iPhone (auch in der Home-Assistant-App) „Live“, die Raum-Kacheln unten nach links und rechts wischen | Die Leiste folgt dem Finger, ein schneller Wisch gleitet nach; alle Räume sind erreichbar. Ein Wisch öffnet keinen Raum, ein Tipp auf eine Kachel öffnet ihn | ✅ (repariert in #441, von dir geprüft als 66.23 ✅ 2026-10-20. Damals ❌ 2026-10-18: ruckelt und bleibt hängen) |
| 66.22 | Neu in 3.99.5 (#440): am iPhone „Live“, einen Raum antippen (Kachel unten oder im Bild) | Unten öffnet sich die Raum-Karte, der Raum selbst steht darüber gut sichtbar (nicht dahinter) | ✅ (2026-10-18) |
| 66.23 | Neu in 3.99.6 (#441): am Handy (iPhone, auch in der Home-Assistant-App) „Live“, die Raum-Kacheln unten langsam, schnell und etwas schräg nach links und rechts wischen | Die Leiste läuft flüssig mit dem Finger und bleibt nicht hängen, nach einem schnellen Wisch gleitet sie weich aus; alle Räume sind erreichbar. Ein Wisch öffnet keinen Raum, ein Tipp auf eine Kachel öffnet ihn | ✅ (2026-10-20) |
| 66.24 | Neu in 3.99.6 (#442): am Handy „Live“, unten „Strom“ drücken, dann auf die Karte „Strom jetzt“ tippen | Oben in der Mitte erscheint die Karte „Strom jetzt“ klein (Sonne, Netz, Haus, Batterie, darunter Wasser, Gas, Wärme), ganz zu sehen; das Haus und die Raum-Kacheln bleiben frei; ein Tipp auf die Karte schaltet „Strom“ aus, die Karte verschwindet | ✅ (2026-10-20) |
| 66.25 | Neu in 3.99.6 (#445): am Handy „Live“, ganz unten nachsehen | Ganz unten unter den Knöpfen eine kurze Zeile mit der Uhrzeit und dem Wetter, z. B. „☀️ 12:24 · ⛅ Teilweise bewölkt · 14 °C“; nichts überdeckt sich (Knöpfe, Kompass, Raum-Kacheln). Am PC und Tablet bleiben die beiden Zeilen oben rechts | ✅ (2026-10-20) |

## 67. Neu in 4.0: Wände mit Oberfläche, viel mehr Böden, Muster anpassen, Fassade (#448)
Die Demo hat schon Beispiele eingestellt: Wohnzimmer Fischgrät und Raufaser, Küche Großformat-Fliesen, Metro-Fliesen bis 1,40 m und salbeigrüne Farbe, Bad Sechseck-Fliesen und blaue Fliesen bis 1,20 m, Schlafzimmer Teppich und Blätter-Tapete, Büro Rauputz; oben Punkte- und Streifen-Tapete, Chevron, Terrassendielen; im Dachgeschoss weißer Backstein; außen Rauputz. Zum Hineinschauen nah an eine Wand zoomen und das Bild drehen (die Wände zur Kamera hin senken sich).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 67.1 | Demo öffnen, Erdgeschoss, nah an die Wände im Bad, in der Küche und im Wohnzimmer zoomen | Bad: blaue Fliesen bis etwa Hüfthöhe, darüber weiß; Küche: weiße Metro-Fliesen, darüber salbeigrün; Wohnzimmer: feine Raufaser, Boden Fischgrät. Türen und Fenster bleiben frei, die Muster wirken nicht verzerrt | ✅ (2026-10-20) |
| 67.2 | Obergeschoss und Dachgeschoss ansehen | Kinderzimmer Punkte-Tapete, Gästezimmer Streifen-Tapete und Chevron-Boden, Dachterrasse Holzdielen, Studio weißer Backstein und breite Dielen | ✅ (2026-10-20) |
| 67.3 | Von außen ums Haus drehen | Die Außenwände haben Rauputz; ⚙ → „Fassade“ → z. B. „Klinker rot“ macht alle Außenwände zu Klinker, „Glatt (wie bisher)“ stellt es zurück; „Farbe der Fassade“ färbt sie um | ✅ (2026-10-20) |
| 67.4 | „Bearbeiten“, einen Raum anklicken, rechts „Boden“ aufklappen | Die Muster stehen unter „Holz“, „Fliesen“, „Stein“, „Sonstiges“, gut 25 Stück; ein anderes wählen: der Boden wechselt sofort | ✅ (2026-10-20) |
| 67.5 | Unter dem Boden auf einen Farbkreis tippen, dann „Farbe“ und „Fugen“ selbst wählen | Der Boden nimmt die Farbe an (z. B. Nussbaum), die Fugen ihre Farbe; „↺ Wie vorgegeben“ stellt alles zurück | ✅ (2026-10-20) |
| 67.6 | „Größe“ ändern (z. B. Fliesen 60 statt 30 cm), „Drehung“ 45° antippen | Die Fliesen werden größer bzw. liegen schräg (diagonal); 90° dreht die Dielen quer zum Raum; jede andere Zahl geht auch | ✅ (2026-10-20) |
| 67.7 | Beim Raum unter „Wände“ z. B. „Raufaser“, „Rauputz“, „Tapete Ornament“, „Metro-Fliesen“, „Klinker rot“ wählen | Die Wände des Raums ändern sich sofort, nur auf der Seite dieses Raums; die Nachbarräume bleiben, wie sie sind; Farbe, Größe und Drehung gehen wie beim Boden | ✅ (2026-10-20) |
| 67.8 | Haken „Unten anders (z. B. Fliesen)“, darunter Muster und „Bis Höhe“ (z. B. 1,50 m) | Unten Fliesen bis zur Höhe, darüber die Wand von oben; unter einem Fenster auch Fliesen | ✅ (2026-10-20) |
| 67.9 | „Wände für alle Räume der Etage übernehmen“ | Alle Räume der Etage bekommen dieselben Wände (unten steht, wie viele); Strg+Z macht es rückgängig | ✅ (2026-10-20) |
| 67.10 | Eine einzelne Wand anklicken, rechts „Oberfläche dieser Wand“: auf einer Seite eine Tapete wählen | Nur diese Seite dieser Wand hat die Tapete, über die ganze Höhe (Akzentwand); die Seiten stehen mit dem Namen des Raums („Zu Wohnzimmer“) oder „Außen“; „Wie der Raum“ nimmt es zurück | ✅ (2026-10-20) |
| 67.11 | Unten „Temp.“, dann „Normal“; das Design „Hologramm“ | Bei „Temp.“ färben sich die Böden wie bisher (die Wände behalten ihr Muster); im Hologramm keine Muster, alles wie bisher | ✅ (2026-10-20) |
| 67.12 | „2D“ ansehen | Die Räume haben die Farbe ihres Bodens, auch mit eigener Farbe (z. B. Nussbaum dunkel) | ✅ (repariert in #467, von dir geprüft als 75.1, 75.2 ✅ 2026-10-20. Damals ❌: mit „Temp.“ waren die Räume schwarz) |
| 67.13 | Im Add-on: eigenen Räumen Böden und Wände geben, neu laden; ein Tablet im Sparmodus „Schnell“ | Bleibt nach dem Neuladen so; im Sparmodus sind Böden und Wände einfarbig in ihrer Farbe (ohne Muster), das Bild bleibt flüssig | ➖ |
| 67.14 | Im Add-on: Export (Haus als JSON) und wieder Import | Böden, Farben, Größen, Drehungen, Wände, „Unten anders“ und Akzentwände kommen wieder mit | ➖ |

## 68. Neu in 4.0.1: Einstellungen in Gruppen, Suche, was die Alarmanlage ist (#450)
⚙ oben rechts öffnet die Einstellungen. Statt einer langen Liste stehen dort zehn Gruppen, die man auf- und zuklappt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 68.1 | Demo öffnen, ⚙ antippen | Zehn Gruppen, alle zugeklappt: Allgemein, Zeichnen & Bearbeiten, 3D-Bild & Leistung, Was im Bild erscheint, Etagen, Haus außen & Umgebung, Licht & Hintergrund, Warnungen & Alarm, Wandtablet, Farben. Unter jedem Namen steht klein, was drin ist | ✅ (2026-10-20) |
| 68.2 | Eine Gruppe antippen, dann noch einmal | Sie klappt auf (der Pfeil rechts dreht sich) und wieder zu; die Einstellungen darin wirken wie bisher | ✅ (2026-10-20) |
| 68.3 | Eine Gruppe offen lassen, das Fenster schließen und wieder öffnen | Dieselbe Gruppe ist wieder offen (der Browser merkt es sich) | ✅ (2026-10-20) |
| 68.4 | Oben „Alle aufklappen“, dann „Alle zuklappen“ | Alle Gruppen gehen auf, der Knopf heißt dann „Alle zuklappen“; danach sind alle wieder zu | ✅ (2026-10-20) |
| 68.5 | Oben ins Suchfeld „Alarm“ tippen | Nur noch die passenden Gruppen, aufgeklappt, die passenden Zeilen haben einen farbigen Rahmen; „Himmel“ oder „Sonne“ findet den Himmel, „Fassade“ die Fassade | ✅ (2026-10-20) |
| 68.6 | Etwas Unsinniges suchen, dann Esc drücken (am Tablet das ✕ im Suchfeld) | „Keine Einstellung passt zu diesem Wort.“; nach Esc ist die Suche leer und die Gruppen sind wie vorher, das Fenster bleibt offen | ✅ (2026-10-20) |
| 68.7 | Gruppe „Warnungen & Alarm“ öffnen | Oben steht, wie Warnungen erscheinen; im blauen Kasten „Was ist mit „Alarmanlage“ gemeint?“: die Erklärung (Türen und Fenster wählt man in der Alarmanlage von Home Assistant, z. B. Alarmo) und darunter „In Home Assistant gefunden: Alarmanlage (🛡 Unscharf)“; darunter „🚨 Benachrichtigung bei Alarm (WhatsApp)“ (in der Demo wird nichts gesendet: „Test senden“ sagt das) | ✅ (2026-10-20) |
| 68.8 | Gruppe „Wandtablet“, „Nachts abdunkeln“ auf „Nach Uhrzeit“, dann „Aus“ | Die Zeilen „Abdunkeln ab“ und „Abdunkeln bis“ erscheinen nur bei „Nach Uhrzeit“ | ✅ (2026-10-20) |
| 68.9 | Im Add-on: ⚙ → „Warnungen & Alarm“ | Steht die eigene Alarmanlage (z. B. Alarmo) mit ihrem Zustand da? Als Benutzer, der nicht bearbeiten darf: statt der WhatsApp-Einstellung der Satz, dass das ein Bearbeiter einstellt | ➖ |

## 69. Neu in 4.0.2: Gebäude-Filter richtig (#451)
Nach Bildern des Besitzers aus seinem Haus „Kinder“: beim Umschalten oben blieben Wandstücke stehen, ein Raum im 1. Stock nahm den großen Raum im EG darunter mit, und die Geräteliste zeigte alle Geräte.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 69.1 | „Bearbeiten“, rechts „🏘 Gebäude in diesem Plan“: zwei Gebäude anlegen, im Erdgeschoss nur die Küche dem zweiten Gebäude geben, oben das erste Gebäude wählen | Die Küche ist weg, mit ihren Wänden. Eine lange Wand, die an der Küche und an einem anderen Raum entlang läuft, steht nur noch an dem anderen Raum: kein Wandstück ragt in die leere Küche | ✅ (2026-10-20) |
| 69.2 | Einen Raum im Obergeschoss dem zweiten Gebäude geben (z. B. das Kinderzimmer), oben das erste Gebäude wählen, „Ganzes Haus“ | Nur dieser Raum fehlt; das Erdgeschoss darunter bleibt ganz stehen. Rechts steht beim Raum darunter weiter sein Gebäude oder „automatisch (Grundstück)“. Umgekehrt folgen die Räume darüber weiter dem Erdgeschoss (61.3) | ✅ (2026-10-20) |
| 69.3 | Oben „📋 Geräte“ öffnen, dann oben zwischen den Gebäuden umschalten | Die Liste zeigt nur die Geräte, Türen und Fenster des gewählten Gebäudes (und was in keinem Raum steht, z. B. im Garten); die Zahl der schwachen Batterien am Knopf auch. „🏘 Alle Gebäude“ zeigt wieder alles | ✅ (2026-10-20) |
| 69.4 | Im Add-on, Haus „Kinder“: oben „Gebäude 1“ und „Gebäude 2“ umschalten, auch mit WZFA in Gebäude 2 | „Raum 1“ im EG bleibt stehen (rechts „automatisch (Grundstück)“, bis er selbst ein Gebäude bekommt); keine Mauern ohne ihren Raum; die Geräteliste passt zum Bild | ➖ |

## 70. Neu in 4.0.3: Benutzer & Tablets in den Einstellungen, WhatsApp leichter einrichten (#454)
Der Knopf „Benutzer“ oben ist weg: alles daraus steht jetzt in ⚙ → „👥 Benutzer & Tablets“. Ältere Prüfschritte mit „Benutzer“ → … gehen genauso über diese Gruppe.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 70.1 | Demo öffnen, oben in der Leiste schauen | Kein Knopf „Benutzer“ mehr, die Leiste ist kürzer | ✅ (2026-10-20) |
| 70.2 | ⚙ → Gruppe „👥 Benutzer & Tablets“ aufklappen | Die Benutzer mit Raum, Ansicht und Start stehen da; oben in jeder Zeile der Benutzer mit ⚙ und ×, darunter Raum, Ansicht, Start; unten „Sicherung in Home Assistant“ mit „Datei erstellen / speichern“ und „Synchronisieren“ | ✅ (2026-10-20) |
| 70.3 | „+ Benutzer“, einen Benutzer wählen, Raum wählen; Fenster schließen und wieder öffnen | Der Benutzer bleibt gespeichert, mit Raum | ✅ (2026-10-20) |
| 70.4 | Bei einem Benutzer ⚙ → „🔒 Gesperrt“ einen Haken setzen | Wie bisher: der Haken bleibt, der Knopf zeigt 🔒 1 | ✅ (2026-10-20) |
| 70.5 | Am Handy ⚙ öffnen | Die Gruppe „Benutzer & Tablets“ gibt es am Handy nicht (wie vorher der Knopf) | ✅ (2026-10-20) |
| 70.6 | ⚙ → „Warnungen & Alarm“ → „Benachrichtigung bei Alarm“, „Senden über: WhatsApp direkt“ | Drei nummerierte Schritte: Nachricht „I allow callmebot to send me messages“ an CallMeBot (mit Link), Schlüssel und Nummer eintragen, Haken, Speichern, Test senden | ✅ (2026-10-20) |
| 70.7 | Im Add-on: die drei Schritte wirklich machen | Die Test-Nachricht kommt per WhatsApp aufs Handy | ✅ (2026-10-18) |

## 71. Neu in 4.1: Urlaubs-Alarm mit Sperrbildschirm, Telegram, Dienste ankreuzen (#456)
In der Demo ist der Urlaubs-Alarm schon eingerichtet: Code **1234**, Bürotür und zwei Fenster gewählt, 20 Sekunden Zeit. 25 Sekunden nach dem Scharfschalten öffnet ein gespielter Einbrecher die Bürotür. Seit 4.1.1 gilt der Sperrbildschirm nur für Wandtablets: in der Demo dafür `?wand=1` an die Adresse hängen.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 71.1 | Demo öffnen, „Live“ | Oben im Bild steht der Knopf „🛡 Alarm aus“ | ✅ (2026-10-20) |
| 71.2 | 🛡 antippen | Ein halb durchsichtiges Fenster mit Ziffernfeld: „Urlaubs-Alarm scharf schalten“, darunter „Noch offen: Fenster Wohnzimmer“; „Schließen“ geht zurück | ✅ (2026-10-20) |
| 71.3 | Einen falschen Code (z. B. 1111) und „Scharf schalten“ | „Falscher Code (noch 4 Versuche)“, nichts passiert | ✅ (2026-10-20) |
| 71.4 | 1234 und „Scharf schalten“ | Der Sperrbildschirm deckt alles ab: „Scharf in 20 Sekunden – bitte jetzt das Haus verlassen“, die Zahl zählt herunter; hinter dem Bildschirm lässt sich nichts antippen | ✅ (2026-10-20) |
| 71.5 | Warten | „Urlaubs-Alarm ist scharf“; nach etwa 25 Sekunden öffnet sich die Bürotür: der Bildschirm wird rot, „Alarm in 20 Sekunden – Code eingeben!“ | ✅ (2026-10-20) |
| 71.6 | Nichts eingeben, warten | „ALARM: Bürotür wurde geöffnet“ mit Uhrzeit, rot blinkend | ✅ (2026-10-20) |
| 71.7 | „👁 Nur ansehen“ (entfällt seit 4.1.1: wer bearbeiten darf, bekommt keinen Sperrbildschirm mehr, siehe 72) | – | ➖ |
| 71.8 | 1234 und „Ausschalten“ | Der Sperrbildschirm ist weg, der Knopf sagt wieder „🛡 Alarm aus“, die Bürotür ist wieder zu | ✅ (2026-10-20) |
| 71.9 | „Bearbeiten“, ⚙ → „Warnungen & Alarm“ → „🛡 Urlaubs-Alarm“ | Türen und Fenster mit Raum und „offen“ / „zu“, „alle“ / „keine“; offline-Haken, Sekunden, Code, „Bei Alarm einschalten“ (Lichter, Schalter …), Nachricht; „Speichern“ sagt „Bereit“ | ✅ (2026-10-20) |
| 71.10 | ⚙ → „Benachrichtigung bei Alarm“ → „Senden über: Telegram“, „An wen?“ umschalten | Bei „An Personen“ die Schritte mit @CallMeBot_txtbot und das Feld für Benutzernamen, bei „In eine Telegram-Gruppe“ die Schritte und das Feld für den Schlüssel | ✅ (2026-10-20) |
| 71.11 | „Senden über: Benachrichtigungsdienst von Home Assistant“ | Eine Liste zum Ankreuzen (in der Demo 📱 mobile_app_handy, ✈️ telegram_familie, 💬 whatsapp), mehrere gehen | ✅ (2026-10-20) |
| 71.12 | Im Add-on: Urlaubs-Alarm mit echten Türen einrichten, Telegram oder WhatsApp einrichten, scharf schalten, eine Tür öffnen und nicht ausschalten | Nach der eingestellten Zeit: Nachricht aufs Handy mit Tür und Raum, gewählte Sirene / Lichter gehen an; mit dem Code am Wandtablet aus: Sirene aus, Nachricht „Alarm beendet, ausgeschaltet von …“ | ➖ |
| 71.13 | Im Add-on: Telegram in eine Gruppe (Schlüssel von CallMeBot), „Test senden“ | Die Test-Nachricht kommt in der Gruppe an | ➖ |
| 71.14 | Im Add-on: als Wandtablet-Benutzer, während der Alarm scharf ist | Sperrbildschirm mit Ziffernfeld, ohne „Nur ansehen“; mit der Sperre „Urlaubs-Alarm“ ohne Ziffernfeld | ➖ |

## 72. Neu in 4.1.1: Streifen statt Sperrbildschirm für Bearbeiter, Dienste nach Herkunft, eigener Telegram-Bot (#460)
Wer bearbeiten darf (du als Admin), wird vom Urlaubs-Alarm nicht mehr gesperrt, sieht aber deutlich, dass er scharf ist. Wandtablets bekommen weiter den Sperrbildschirm. Die Test-Nachrichten per WhatsApp und Telegram (CallMeBot) kamen beim Besitzer an (2026-10-18).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 72.1 | Demo öffnen (ohne `?wand=1`), „Live“, 🛡, Code 1234, „Scharf schalten“ | Kein Sperrbildschirm: oben im Bild ein Streifen „🛡 Urlaubs-Alarm wird scharf in 20 s“ (orange), um den ganzen Bildschirm ein roter Rand; der Plan lässt sich weiter drehen und antippen | ✅ (2026-10-20) |
| 72.2 | Warten | Der Streifen wird rot: „🛡 Urlaubs-Alarm ist SCHARF · seit (Uhrzeit) · antippen zum Ausschalten“ | ✅ (2026-10-20) |
| 72.3 | Auf den Streifen tippen | Das Ziffernfeld kommt („Ausschalten“, „Schließen“); „Schließen“ geht zurück, der Alarm bleibt scharf | ✅ (2026-10-20) |
| 72.4 | Warten, bis der Einbrecher die Bürotür öffnet | Der Streifen blinkt: „🚨 Bürotür offen: Alarm in 20 s – antippen und Code eingeben“, danach „🚨 ALARM: Bürotür · (Uhrzeit)“; der rote Rand blinkt | ✅ (2026-10-20) |
| 72.5 | Streifen antippen, 1234, „Ausschalten“ | Streifen und Rand sind weg, der Knopf sagt wieder „🛡 Alarm aus“ | ✅ (2026-10-20) |
| 72.6 | Demo mit `?wand=1` am Ende der Adresse öffnen, scharf schalten | Wie ein Wandtablet: der halb durchsichtige Sperrbildschirm deckt alles ab, ohne Streifen | ✅ (2026-10-20) |
| 72.7 | „Bearbeiten“, ⚙ → „Warnungen & Alarm“ → „Benachrichtigung bei Alarm“ → „Senden über: Benachrichtigungsdienst von Home Assistant“ | Drei Gruppen mit farbigem Rand: „📱 Home Assistant App (Handy)“ (mobile_app_handy), „🧩 In Home Assistant eingerichtet“ (✈️ Familien-Chat · Telegram-Bot), „📄 Aus der configuration.yaml“ (telegram_familie, whatsapp); unter jedem Eintrag klein der volle Name; darunter aufklappbar „✈️ Eigenen Telegram-Bot einrichten (Anleitung)“ mit 4 Schritten und dem Knopf | ✅ (2026-10-20) |
| 72.8 | Im Add-on: die Liste ansehen | Deine Dienste stehen in der richtigen Gruppe: die Handy-App oben, in der UI eingerichtete (z. B. Telegram-Bot) in der Mitte, die aus der configuration.yaml unten | ➖ |
| 72.9 | Im Add-on: eigenen Telegram-Bot nach der Anleitung einrichten, den Chat anhaken, „Speichern“, „Test senden“ | Die Test-Nachricht kommt vom eigenen Bot in Telegram an (auch in einer Gruppe, wenn der Bot dort Mitglied ist) | ➖ |

## 73. Neu in 4.1.2: die Demo durchgesehen, Raum-Schilder aus „Bearbeiten“ (#462)
Der Besitzer meldete: „Im Bild: Raum-Schilder“ geht in der Demo nicht. Grund: Die Demo startet am PC und Tablet in „Bearbeiten“, die Schilder gibt es aber nur in „Live“. Dazu fehlte in der Demo einiges, was nur das Add-on liefern konnte.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 73.1 | Demo am PC oder Tablet öffnen (sie startet in „Bearbeiten“), unten „Ansicht“ → „Im Bild: Raum-Schilder“ antippen | Die Demo wechselt zu „Live“, über den Räumen stehen die Schilder; der Knopf sagt weiter „Im Bild: Raum-Schilder“. Noch ein Tipp (jetzt in „Live“): „Im Bild: Geräte“, die Schilder sind weg | ✅ (2026-10-20) |
| 73.2 | „Bearbeiten“, „Ansicht“ → „Raum-Kacheln“ antippen | Die Demo wechselt zu „Live“, unten sind die Raum-Kacheln | ✅ (2026-10-20) |
| 73.3 | Oben „🛡️ Sicherheit“ | Zwei Tage zur Auswahl: heute („Heute“) und gestern. Gestern antippen, ▶: morgens gehen Bad- und Küchenlicht an, Anna fährt weg (Garagentor), mittags ist das Küchenfenster offen, abends Wohnzimmer, Büro und Schlafzimmer; ✕ führt zurück zu „Live“ | ✅ (2026-10-20) |
| 73.4 | „Live“, oben „Geräte“ → „Batterie“ | Fenster, Türen, Feuchte- und Anwesenheitssensor mit ihrer Batterie; „Luftfeuchte Keller“ (8 %) und „Fenster Küche“ (12 %) sind rot. Oben steht „🪫 2 Batterie schwach“, am Knopf „Geräte · 🪫 2“ | ✅ (2026-10-20) |
| 73.5 | Oben „🗄️ Backup“ → „Backup herunterladen“, dann unten bei „Sicherheit“ ⬇ bei einem Tag | Es wird eine Datei `floorplan3d-backup-demo.json` gespeichert (bzw. `floorplan3d-timeline-….jsonl`), die Demo bleibt offen (vorher war die Seite danach leer oder es kam eine Fehlerseite) | ✅ (2026-10-20) |
| 73.6 | Rechts „Häuser“ → „Haus aus JSON importieren …“ → „Beispiel: Haus mit Grundstück“, dann „Prüfen“; danach „Dieses Haus als JSON exportieren“ | Das Beispiel steht im Feld; „Prüfen“ sagt „Der Import braucht das Add-on und ist in der Demo nicht verfügbar.“; Exportieren sagt „In der Demo nicht verfügbar (nur im Add-on).“ und die Demo bleibt offen | ✅ (2026-10-20) |
| 73.7 | Oben auf die grüne Versionsanzeige tippen → „Jetzt prüfen (auch mit GitHub)“ | „GitHub (main): gleicher Stand“ und „Alles stimmt, auch mit GitHub“ | ✅ (2026-10-20) |

## 74. Neu in 4.1.3: Ganzes Haus mit Raum-Schildern (#464)
Der Besitzer meldete: „Im Bild: Raum-Schilder“ geht im „Ganzes Haus“ nicht. Grund: Im ganzen Haus gibt es keine Schilder (über allen Räumen aller Etagen lägen sie übereinander), es kamen dort stattdessen die Geräte wie bei „Geräte“. Er hat gewählt: im ganzen Haus dann alles ausblenden, nur die Etagen-Karten an der Seite.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 74.1 | „Live“, links „Ganzes Haus“, unten „Ansicht“: „Im Bild: Raum-Schilder“ ist an | Im Bild keine Geräte-Kugeln, keine Werte-Schilder und keine Raumnamen, auch im Keller nicht; nur die Etagen-Karten neben dem Haus (Räume, Lichter an, Fenster offen); ein Tipp auf eine Karte öffnet die Etage, dort sind die Raum-Schilder wieder da | ✅ (2026-10-20) |
| 74.2 | Im „Ganzes Haus“ „Ansicht“ → „Im Bild: Raum-Schilder“ antippen (wird „Im Bild: Geräte“), dann noch einmal | Mit „Geräte“ sind die Kugeln, Werte und Raumnamen im ganzen Haus wieder da; mit „Raum-Schilder“ wieder nur die Etagen-Karten | ✅ (2026-10-20) |

## 75. Neu in 4.1.4: Raumfarben im 2D-Plan bei „Temp.“ (#467)
Der Besitzer meldete bei 67.12 (mit Bild): Die Farbe der Räume wird im 2D-Plan nicht richtig angezeigt. Grund: Bei „Temp.“, „Feuchte“ und „CO₂“ bekam der 2D-Plan die Farbe als Zahl statt als Farbe; der Browser malte jeden Raum mit Messwert dunkelgrau bis schwarz, in jedem Design.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 75.1 | „Bearbeiten“, Ansicht „2D“, Erdgeschoss, unten „Temp.“ (auch im Design „Hologramm“), dann „Feuchte“ | Die Räume mit Messwert haben die Farbe ihrer Temperatur wie in der Leiste „Temp.“ links (blau kühl, grün und gelb mittel, rot warm), keiner ist schwarz; bei „Feuchte“ ihre Feuchte-Farbe | ✅ (2026-10-20) |
| 75.2 | Unten „Normal“, weiter in „2D“ | Die Räume haben wieder die Farbe ihres Bodens (Wohnzimmer braun, Küche hell, Garage grau), auch mit eigener Farbe (z. B. Nussbaum dunkel) | ✅ (2026-10-20) |

## 76. Neu in 4.2.0: Schnellzugriff, Licht-Gruppen, Favoriten und Hilfen beim Bearbeiten (#471)
Der Besitzer hat aus einer Auswahl alle sieben Ideen gewählt und dazu gesagt: Gruppen aus mehreren Räumen, damit nicht aus Versehen alles ausgeht, wenn noch jemand in einem Raum ist, und nichts überladen. Die Demo hat drei Gruppen (Wohnen, Oben, Keller) und vier Favoriten eingestellt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 76.1 | „Live“, oben „💡 … an“ antippen | Eine kleine Liste „Lichter“: „🏠 Ganzes Haus“, „Wohnen“, „Oben“, „Keller“, jede mit „… an“ und einem Knopf „Aus“; 👤, wo gerade jemand im Raum ist | ✅ (2026-10-25, Claude in der Demo) |
| 76.2 | Bei „Wohnen“ einmal „Aus“ antippen, dann ein paar Sekunden warten | Der Knopf wird rot „Sicher? Aus“, es geht noch nichts aus; nach etwa 3 Sekunden steht wieder „Aus“ da | ✅ (2026-10-25, Claude in der Demo) |
| 76.3 | Bei „Wohnen“ zweimal kurz nacheinander „Aus“ | Nur die Lichter von Wohnzimmer und Küche gehen aus (Schlafzimmer, Büro, Keller bleiben an); die Zeile sagt „alle aus“, oben die Zahl wird kleiner | ✅ (2026-10-25, Claude in der Demo) |
| 76.4 | Bei „Ganzes Haus“ zweimal „Aus“ | Alle Lichter sind aus; schließt man die Liste, ist der Knopf „💡 … an“ oben weg (er erscheint wieder, sobald ein Licht an ist) | ✅ (2026-10-25, Claude in der Demo) |
| 76.5 | Unten ganz vorne in der Leiste der Raum-Kacheln: die Favoriten „Wohnzimmer Gemütlich“, „Wohnzimmer Aus“, „Stehlampe“, „Küche Licht“. „Wohnzimmer Gemütlich“ antippen, dann „Küche Licht“ | Die Szene macht die Wohnzimmer-Lichter an; „Küche Licht“ geht an und aus, der Knopf leuchtet, solange es an ist, und sagt „An“ / „Aus“ | ✅ (2026-10-25, Claude in der Demo) |
| 76.6 | Ein Licht im Bild antippen (z. B. Bürolicht), auf seiner Karte ☆ antippen, dann noch einmal | Aus ☆ wird ★ und unten kommt ein Knopf „Büro Licht“ dazu; noch ein Tipp: wieder ☆, der Knopf ist weg | ✅ (2026-10-25, Claude in der Demo) |
| 76.7 | ⚙ → „⭐ Schnellzugriff“ → „Favoriten“: „Bad Licht“ eintippen, „+ Hinzufügen“; dann „climate.wohnzimmer“ eintippen, „+ Hinzufügen“; bei einem Favoriten ↑ und × | „Bad Licht“ steht in der Liste und unten in der Leiste; beim Thermostat steht „Das geht nicht als Favorit …“; ↑ schiebt nach vorne, × nimmt heraus | ✅ (2026-10-25, Claude in der Demo) |
| 76.8 | ⚙ → „Schnellzugriff“ → „Licht-Gruppen“: „+ Neue Gruppe“, Name „Schlafen“, Schlafzimmer und Bad ankreuzen, schließen, oben „💡 … an“ | Die neue Gruppe „Schlafen“ steht in der Liste oben, mit ihren Lichtern; „Wohnen“ hat Wohnzimmer und Küche angehakt | ✅ (2026-10-25, Claude in der Demo) |
| 76.9 | Oben „📋 Geräte · 🪫 2“ ansehen und antippen | Der Knopf ist orange; die Liste öffnet gleich bei „🔋 Batterie“, die zwei schwachen (rot) stehen oben | ✅ (2026-10-25, Claude in der Demo) |
| 76.10 | In der Geräte-Liste „💡 An / offen“ | Nur was gerade an ist (Lichter, Fernseher, Ventilator …) und offene Türen und Fenster, nach Raum; die Zahl am Knopf stimmt | ✅ (2026-10-25, Claude in der Demo) |
| 76.11 | „Bearbeiten“: ein Möbel antippen, „Entf“ (oder 🗑 im Eigenschaften-Fenster); dann „↶ Rückgängig“ im Hinweis. Noch einmal löschen und nichts tun | Unten erscheint „Gelöscht · ↶ Rückgängig“; der Knopf holt das Möbel zurück; ohne Tipp verschwindet der Hinweis nach etwa 6 Sekunden | ✅ (2026-10-25, Claude in der Demo) |
| 76.12 | „Bearbeiten“: Taste „?“ (oder rechts unter „Steuerung“ „⌨ Alle Tasten (?)“) | Eine Karte „⌨ Tasten“ mit allen Tasten: Werkzeuge (V, W, R, M …), Rückgängig, Kopieren, Schieben um 1 cm / 10 cm, Etage höher / tiefer | ✅ (2026-10-25, Claude in der Demo) |
| 76.13 | „Bearbeiten“, Werkzeug „Gerät“, ein Teil wählen (z. B. „TV“) und ins Bild setzen | In der Bibliothek oben „🕘 Zuletzt benutzt“ mit dem Teil; ein Tipp darauf wählt es wieder | ✅ (2026-10-25, Claude in der Demo) |
| 76.14 | Am Handy hochkant „Live“: oben „📊“ → „💡 … an“ | Die Liste „Lichter“ mit Haus und Gruppen wie am PC, „Aus“ zweimal tippen; unten vorne die Favoriten | ✅ (2026-10-25, Claude in der Demo) |
| 76.15 | Im Add-on: eigene Licht-Gruppen anlegen (z. B. Kinderzimmer), abends eine Gruppe ausschalten | Nur die Lichter dieser Räume gehen aus; die Gruppen bleiben nach Neuladen und auf jedem Gerät gleich | ➖ |

## 77. Neu in 4.2.1: Saugroboter sichtbar, Hausmodus mit Knöpfen, „Innenmaß“ beim Messen (#473, #474)
Der Besitzer meldete bei 63.4: In der Küche gibt es keinen Saugroboter. Grund: Er stand in der Demo unter der Treppe. Und bei 63.8: Den Knopf „Urlaub“ gibt es nicht. Grund: Der Hausmodus zeigte seine Möglichkeiten nur in einer Liste zum Aufklappen, und seine Kugel war nur ein weißer Punkt. Bei 58.5 wünschte er sich einen anderen Namen für „Lichter Abstand“ (ein Fachwort aus dem Bau). Bei 54.6 fehlte „Kühlen“: das Klimagerät war mit der Heizung des Wohnzimmers verknüpft, die nur heizen kann; die Demo hat jetzt eine Klimaanlage im Büro, die auch kühlt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 77.1 | Demo, „Live“, Erdgeschoss, „Ansicht“ → „Im Bild: Geräte“; in die Küche schauen, den Saugroboter antippen, „Saugen“ | Der Saugroboter (eine flache runde Scheibe) steht vor der Küchenzeile, darüber eine Kugel mit Besen 🧹; die Karte zeigt „🔌 An der Station“, nach „Saugen“ „🧹 Saugt“ mit „Pause“ und „Zur Station“, die Saugstufe lässt sich wählen | ✅ (2026-10-21) |
| 77.2 | Im Büro an der Innenwand zum Schlafzimmer (rechts neben der Tür) die Kugel ☰ des **Hausmodus** antippen | Unter „Auswahl“ stehen vier Knöpfe: Zu Hause, Abwesend, Urlaub, Nacht; „Zu Hause“ ist blau | ✅ (2026-10-21) |
| 77.3 | „Urlaub“ antippen, die Karte schließen und den Hausmodus noch einmal antippen | Jetzt ist „Urlaub“ blau, oben steht „Urlaub · input_select.hausmodus“ | ✅ (2026-10-21) |
| 77.4 | Bearbeiten, Taste M, zwei gegenüberliegende Wände eines Raums anklicken | Rechts steht „Innenmaß (Wand bis Wand)“ statt „Lichter Abstand“, darunter wie bisher „Abstand der Wandmitten“; das Setzen geht wie in 58.5 | ✅ (2026-10-21) |
| 77.6 | Neu (Frage des Besitzers bei 54.6: „da steht bei der Klima kein Kühlen“): Demo, „Live“, Erdgeschoss, „Im Bild: Geräte“; im Büro oben an der Wand zur Küche die **Klimaanlage Büro** antippen | Die Karte hat Aus, **Kühlen**, Heizen, Entfeuchten, Lüfter, Auto, dazu „Vorwahl“ und „Lüfter“ (Auto, Niedrig, Mittel, Hoch); sie kühlt („❄ kühlt“), die Klappe unten am Gerät ist blau. Auf „Heizen“ und mit + über 23 °C: „🔥 heizt“, die Klappe wird rot. (Die Heizung im Wohnzimmer kann nur heizen, darum hat sie kein „Kühlen“: das zeigt die Karte nur, wenn das Gerät in Home Assistant kühlen kann.) | ✅ (2026-10-21) |
| 77.5 | Im Add-on eine Auswahl mit vielen Möglichkeiten (mehr als 6, z. B. ein Waschprogramm) mit einem Gerät verknüpfen und in „Live“ antippen | Hier bleibt es eine Liste zum Aufklappen (sonst würde die Karte zu groß) | ➖ |

## 78. Neu in 4.3.0: Reiter unten, Kamera-Seite, Reiter pro Benutzer, Tablet ohne Seitenleiste (#479)
Der Besitzer möchte nur noch dieses Programm in Home Assistant benutzen („keine anderen Dashboards mehr“) und hat aus den Beispielbildern (`docs/ideen-4.3/`) alle acht Reiter gewählt, die Leiste unten. Schritt 1: die Leiste, 📷 Kameras als eigene Seite, pro Benutzer welche Reiter und mit welchem es anfängt („es soll ja aber auch noch administrativ verwaltet werden“), die Anleitung fürs Tablet und die Karte für HACS mit Reitern und als Wandtablet. Die übrigen Reiter kommen in den nächsten Schritten.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 78.1 | Demo am PC oder Tablet, „Live“ | Ganz unten eine Leiste mit „🏠 Haus“ (blau umrandet) und „📷 Kameras“, rechts „⛶ Vollbild“; das 3D-Bild endet über der Leiste, nichts wird verdeckt | ✅ (2026-10-25, Claude in der Demo) |
| 78.2 | „📷 Kameras“ antippen | Eine Seite über dem Haus: „📷 Kameras · 2 Kameras · 🏃 Bewegung: 2“, die Kamera Wohnzimmer rot umrandet mit „Bewegung erkannt“, darunter die Kamera Büro, unten „Bewegungsmelder“ mit „Büro Anwesenheit“ | ✅ (2026-10-25, Claude in der Demo) |
| 78.3 | Die Kamera Wohnzimmer antippen, dann „‹ Alle Kameras“ | Die Kamera groß (in der Demo ein Standbild, im Add-on das Live-Bild), oben ihr Name, „Im Plan zeigen“ und „In Home Assistant öffnen“; „‹ Alle Kameras“ geht zurück zu den Kacheln | ✅ (2026-10-25, Claude in der Demo) |
| 78.4 | Noch einmal eine Kamera groß, dann „Im Plan zeigen“ | Zurück beim Haus, die Kamera im Bild markiert, unten ist „🏠 Haus“ blau | ✅ (2026-10-25, Claude in der Demo) |
| 78.5 | Oben den Kamera-Knopf („📷 Bewegung in …“) antippen | In „Live“ öffnet er die Kamera-Seite (früher eine kleine Liste; die gibt es noch beim Bearbeiten) | ✅ (2026-10-25, Claude in der Demo) |
| 78.6 | „Bearbeiten“, dann wieder „Live“ | Beim Bearbeiten ist die Leiste weg und alles wie immer; in „Live“ ist sie wieder da, das Haus offen | ✅ (2026-10-25, Claude in der Demo) |
| 78.7 | „⛶ Vollbild“ antippen, dann noch einmal (oder Esc) | Die Seite füllt den ganzen Bildschirm, wieder antippen: zurück | ✅ (2026-10-25, Claude in der Demo) |
| 78.8 | ⚙ → „📱 Wandtablet“: den Haken „Reiter-Leiste unten“ wegnehmen, schließen; dann wieder setzen | Ohne Haken ist die Leiste weg, mit Haken wieder da | ✅ (2026-10-25, Claude in der Demo) |
| 78.9 | ⚙ → „📱 Wandtablet“ → „📱 Tablet einrichten“ aufklappen, „Text der Karte kopieren“ | Fünf Schritte und der Text der Karte (`type: custom:floorplan3d-card`, `fill`, `tabs`, `kiosk`); der Knopf sagt „Kopiert ✓“ | ✅ (2026-10-25, Claude in der Demo) |
| 78.10 | ⚙ → „👥 Benutzer & Tablets“ → „+ Benutzer“, einen Namen eintippen, sein ⚙ antippen | Unter „Reiter unten“ ein Haken „📷 Kameras“ und „Fängt an mit“ (🏠 Haus / 📷 Kameras); „Fängt an mit: 📷 Kameras“ wählen, schließen, wieder öffnen: es ist gespeichert | ✅ (2026-10-25, Claude in der Demo) |
| 78.11 | Am Handy: Demo, unten „📷 Kameras“ | Die Kameras untereinander, die Überschrift wird nicht vom ☰ verdeckt; „🏠 Haus“ geht zurück | ✅ (2026-10-25, Claude in der Demo) |
| 78.12 | Im Add-on: einem Tablet-Benutzer „Fängt an mit: 📷 Kameras“ geben, am Tablet neu laden; in ⚙ „Zurück zur Startansicht nach“ 1 Minute, zum Haus wechseln und warten | Das Tablet startet auf der Kamera-Seite (Live-Bilder); nach einer Minute ohne Berührung ist es wieder dort | ➖ |
| 78.13 | Im Add-on: einem Benutzer den Haken „📷 Kameras“ wegnehmen (oder unter 🔒 „Kameras“ sperren) | Dieser Benutzer hat keine Leiste (nur das Haus) | ➖ |
| 78.14 | Im Add-on mit HACS: die Karte aktualisieren, ein neues Dashboard mit Ansicht „Panel“ und dem Text aus 78.9, als Standard-Dashboard des Tablet-Benutzers; am Tablet anmelden | Die Karte füllt den Bildschirm mit der Leiste unten; beim Tablet-Benutzer (ohne Admin) sind die Seitenleiste und die Kopfzeile von Home Assistant weg (falls nicht: welche Home-Assistant-Version, ein Bild); als Admin sind sie da | ➖ |

## 79. Neu in 4.4.0: ☀ Heute und ⚡ Energie (#481)
Der Besitzer: „kannst du die anderen reiter auch machen“. Paket 1 von 3: die Startseite „Heute“ und der Strom-Verlauf „Energie“ (auch für zwei Häuser). In der Demo sind Wetter, Termine und Strom-Werte erfunden.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 79.1 | Demo, „Live“: unten die Leiste | 🏠 Haus, ☀️ Heute, ⚡ Energie, 📷 Kameras, rechts ⛶ Vollbild (seit 4.5.0 dazu Klima, Abläufe, Familie: 80.1) | ✅ (2026-10-25, Claude in der Demo) |
| 79.2 | „☀️ Heute“ antippen | Groß die Uhrzeit und das Datum; das Wetter (14 °C, Teilweise bewölkt) mit 5 Tagen (Symbol, Höchst-/Tiefstwert, Regen in %); „Termine“ heute (ganztags Herbstferien, 15:00 Zahnarzt Anna, 17:30 Fußball-Training) und morgen; „Müll“: morgen Gelber Sack, dann Restmüll und Papier; „Wer ist da“: Anna da, Max unterwegs | ✅ (2026-10-25, Claude in der Demo) |
| 79.3 | Rechts „Im Haus“ ansehen und „10 Lichter an“ antippen | Dort stehen offene Türen/Fenster, Lichter an, schwache Batterien; der Tipp geht zum Haus, die Liste „Lichter“ ist offen | ✅ (2026-10-25, Claude in der Demo) |
| 79.4 | Zurück zu „Heute“, „2 offen“ antippen; dann „2 Batterien fast leer“ | Erst die Liste der offenen Türen und Fenster, dann die Geräte-Liste bei „Batterie“ | ✅ (2026-10-25, Claude in der Demo) |
| 79.5 | „Heute“ → „Strom jetzt“ antippen | Die Seite ⚡ Energie geht auf | ✅ (2026-10-25, Claude in der Demo) |
| 79.6 | ⚡ Energie: „Tag“ | Kacheln Verbraucht (mit „gestern um die Zeit“), Vom Dach, Aus dem Netz, Selbst gemacht %, Kosten; Balken je Stunde bis „jetzt“ (orange = Sonne/Batterie, blau = Netz); rechts die größten Verbraucher (Wärmepumpe …); unten Gas und Wasser | ✅ (2026-10-25, Claude in der Demo) |
| 79.7 | Woche, Monat, Jahr nacheinander; mit der Maus über einen Balken fahren (PC) | Balken je Tag (Woche, Monat) und je Monat (Jahr); beim Darüberfahren steht der Wert des Balkens | ✅ (2026-10-25, Claude in der Demo) |
| 79.8 | „‹“ antippen, dann „›“ | Der Zeitraum davor (z. B. „Gestern“, „2025“), die Kachel sagt „Tag davor“ bzw. „Jahr davor“; „›“ geht wieder vor, beim aktuellen Zeitraum ist „›“ grau | ✅ (2026-10-25, Claude in der Demo) |
| 79.9 | Oben „Nachbarhaus“, dann „Alle zusammen“ | Ohne eigene Zähler rechnet das Nachbarhaus mit dem Energie-Dashboard (der Satz unter dem Zeitraum sagt es); „Alle zusammen“ zählt jeden Zähler einmal | ✅ (2026-10-25, Claude in der Demo; das Nachbarhaus hat inzwischen eigene Zähler) |
| 79.10 | „Bearbeiten“ → Strom-Editor → „⚡ Rechnung“, ganz nach unten | „Zähler für den Verlauf (Seite ⚡ Energie)“: je Art (Bezug, Einspeisung, Solar, Batterie rein/raus, Gas, Wasser) ein Feld, „⤵ Aus dem Energie-Dashboard übernehmen“, darunter Strompreis und Einspeisung | ✅ (2026-10-25, Claude in der Demo) |
| 79.11 | „⤵ Aus dem Energie-Dashboard übernehmen“, einen Zähler mit × entfernen, Preis 0,35 eintragen; dann „Wieder das Energie-Dashboard nehmen“ | Die Zähler stehen als Kärtchen mit ihrem Zählerstand da, der Preis bleibt; danach ist es wieder leer („Jetzt: die Zähler des Energie-Dashboards“) | ✅ (repariert in #525, geprüft als 101.7 ✅ 2026-10-25. Damals ❌ 2026-10-25: Strom-Zähler ohne Namen und Stand) |
| 79.12 | ⚙ → „🗂 Reiter unten“ aufklappen | Der Schalter „Reiter-Leiste unten“, darunter die Kalender (Familie, Müllabfuhr) zum Ankreuzen und „Kalender der Müllabfuhr“ | ✅ (2026-10-25, Claude in der Demo) |
| 79.13 | Am Handy: Demo, unten „Heute“, dann „Energie“ | Alles untereinander, gut lesbar; die Leiste unten lässt sich zur Seite wischen, wenn sie nicht passt | ✅ (2026-10-25, Claude in der Demo) |
| 79.14 | Im Add-on: ⚡ Energie mit deinem Energie-Dashboard | Die Zahlen von heute stimmen mit dem Energie-Dashboard von Home Assistant überein (gleicher Tag); Woche, Monat und Jahr ebenso | ➖ |
| 79.15 | Im Add-on: dem zweiten Haus („Kinder“) eigene Zähler in ⚡ Rechnung geben | ⚡ Energie zeigt je Haus seine Werte, „Alle zusammen“ beide | ➖ |
| 79.16 | Im Add-on: ☀ Heute mit deinen Kalendern und dem Müll-Kalender (⚙ → Reiter unten) | Deine Termine und die nächste Müllabfuhr stehen da; das Wetter mit Vorhersage | ➖ |

## 80. Neu in 4.5.0: 🌡 Klima, ▶ Abläufe und 👨‍👩‍👧 Familie mit Pinnwand (#483)
Der Besitzer: „kannst du die anderen reiter auch machen“. Paket 2 von 3: die Räume mit Temperatur, Soll und Luft; große Knöpfe für Szenen und Skripte mit „Ich gehe“ und „Gute Nacht“; wer wo ist mit Handy-Akku und eine Pinnwand für alle. In der Demo sind Personen, Akkus und Zettel erfunden.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 80.1 | Demo, „Live“: unten die Leiste | 🏠 Haus, ☀️ Heute, ⚡ Energie, 🌡️ Klima, 📷 Kameras, ▶️ Abläufe, 👨‍👩‍👧 Familie, rechts ⛶ Vollbild | ✅ (2026-10-25, Claude in der Demo) |
| 80.2 | „🌡️ Klima“ antippen | Je Raum eine Karte mit Temperatur. Wohnzimmer: 21,3°, „🔥 heizt“, Soll 22,0°, „Luft gut · 920 ppm“, 💧 48 %, roter Rand und „Offen: Fenster Wohnzimmer, Tür Wohnzimmer-Küche“ mit „Heizung aus“; Schlafzimmer „🪟 Lüften · 1350 ppm“; Büro „❄ kühlt“, 23,0° in Orange (zu warm); unten „Warmwasser (Wärmepumpe)“ 48,0° und ein Tipp | ✅ (2026-10-28, Claude in der Demo: Büro „🌡 zu warm“ in Orange; repariert in #520, geprüft als 101.2. Wohnzimmer zeigt seit 4.38.0 den Raumfühler, 21,4°) |
| 80.3 | Beim Wohnzimmer zweimal „+“ antippen | Soll springt sofort auf 23,0°; nach einem Moment bleibt es so (ein einziger Befehl an die Heizung) | ✅ (2026-10-25, Claude in der Demo) |
| 80.4 | Beim Wohnzimmer „Heizung aus“ antippen | Das Wohnzimmer zeigt „aus“, kein Soll und keine − + mehr; der rote Rand und der Tipp zum Fenster sind weg | ✅ (2026-10-25, Claude in der Demo) |
| 80.5 | Oben „Nur mit Hinweis“, dann „Alle Räume“ | Nur noch die Räume mit Hinweis (Schlafzimmer: Lüften, Büro: zu warm); dann wieder alle | ✅ (2026-10-25, Claude in der Demo; warum das Büro dabei ist, sah man nicht: #520, 101.2) |
| 80.6 | Auf einen Raumnamen tippen (z. B. „Küche“) | Das Haus geht auf, der Raum ist ausgewählt und seine Karte offen | ✅ (2026-10-25, Claude in der Demo) |
| 80.7 | „▶️ Abläufe“ antippen | Vorne „🚪 Ich gehe“ und „🌙 Gute Nacht“ („… dann Gute Nacht“), dann Filmabend, Guten Morgen, Wohnzimmer Aus, Wohnzimmer Gemütlich; unten zugeklappt „⚙ Automationen (3)“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.8 | „Filmabend“ antippen | Darunter kurz „✓ gestartet“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.9 | „Ich gehe“ antippen | Fenster „Bevor du gehst …“: Offen: 2 (bleibt offen), Lichter an: 10 (gehen aus), Es läuft: 2 (geht aus), Nicht abgeschlossen: 1 Haustür (bleibt offen); Knöpfe „Zurück“ und „Alles aus“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.10 | „Alles aus“ antippen | „✓ Erledigt“, das Fenster geht zu; im Haus sind alle Lichter, der Fernseher und der Lautsprecher aus | ✅ (2026-10-25, Claude in der Demo) |
| 80.11 | „Gute Nacht“ antippen, dann „Trotzdem starten“ | Das Fenster zeigt nur noch die offenen Türen/Fenster und die Haustür, „Danach startet: Gute Nacht“; „Trotzdem starten“ startet die Szene, „✓ Erledigt“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.12 | „⚙ Automationen (3)“ aufklappen, einen Schalter umlegen | Drei Automationen mit Schalter; der Schalter bleibt in der neuen Stellung | ✅ (2026-10-25, Claude in der Demo) |
| 80.13 | ⚙ → „🗂️ Reiter unten“ → „▶️ Abläufe“: Haken bei „Filmabend“, „„Ich gehe“ startet danach“ auf „Wohnzimmer Aus“; dann zur Seite Abläufe | Auf der Seite nur noch Filmabend neben den zwei Prüfungen; „Ich gehe“ sagt „… dann Wohnzimmer Aus“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.14 | „👨‍👩‍👧 Familie“ antippen | Anna „🏠 zu Hause“ seit 11:02, 📱 78 %; Lena „📍 Schule“, 📱 18 % in Rot; Max „🚗 unterwegs“ seit 08:10; rechts die Pinnwand mit drei Zetteln | ✅ (2026-10-25, Claude in der Demo) |
| 80.15 | Eine neue Notiz schreiben, eine Farbe wählen, „📌 Anheften“; dann bei einem Zettel ✕ | Der Zettel kommt vorne dazu (Farbe, „Demo · Uhrzeit“), das Feld ist wieder leer; ✕ nimmt den Zettel ab | ✅ (2026-10-25, Claude in der Demo; nachts steht der neue Zettel nicht vorne, weil die Demo-Zettel Uhrzeiten später am Tag haben) |
| 80.16 | „☀️ Heute“ antippen | Links unter dem Wetter „📌 Pinnwand“ mit den neuesten Zetteln; ein Tipp darauf öffnet „Familie“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.17 | Am Handy: Klima, Abläufe, Familie | Alles untereinander und gut lesbar, bei Abläufe zwei Knöpfe nebeneinander; die Leiste unten lässt sich zur Seite wischen, die Namen sind ganz zu lesen | ✅ (2026-10-25, Claude in der Demo) |
| 80.18 | Im Add-on: 🌡️ Klima mit deinen Thermostaten und Sensoren | Deine Räume mit Temperatur; „+“ / „−“ kommt an der Heizung an | ➖ |
| 80.19 | Im Add-on: 👨‍👩‍👧 Familie | Deine Personen mit ihrem Bild aus Home Assistant und dem Akku des Handys (Companion-App) | ➖ |
| 80.20 | Im Add-on: am Handy eine Notiz anheften, mit „📲 Auch aufs Handy schicken“ | Nach höchstens einer Minute auch am Tablet; die Nachricht kommt über die Benachrichtigung von „Warnungen & Alarm“ | ➖ |
| 80.21 | Im Add-on: einem Benutzer in ⚙ → „Benutzer & Tablets“ die Sperre „Steuern“ geben | Er sieht 🌡️ Klima und ▶️ Abläufe nicht, 👨‍👩‍👧 Familie schon | ➖ |

## 81. Neu in 4.6.0: Seiten bearbeiten wie ein Home-Assistant-Dashboard (#484)
Der Besitzer: „dass ich als Admin die einzelnen Dashboards bearbeiten kann wie im HA-Dashboard“. Gewählt nach den Beispielbildern (`docs/ideen-4.6/`): Karten ordnen und ausblenden, eigene Karten (zwölf Arten), eigene Seiten, für alle gleich. In der Demo darf man immer bearbeiten.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 81.1 | Demo, „Live“, unten „☀️ Heute“, dann rechts in der Leiste „✎ Bearbeiten“ | Oben die Leiste „Seite „Heute“ bearbeiten“ mit „＋ Karte“, „🗂 Reiter“, „↺ Wie am Anfang“, „✓ Fertig“; jede Karte gestrichelt mit ⠿ und 👁; am Ende „＋ Karte hinzufügen“ | ✅ (2026-10-25, Claude in der Demo) |
| 81.2 | Bei „Müll“ 👁 antippen, dann „✓ Fertig“; dann wieder ✎ und 👁 | Erst blass mit „ausgeblendet“, nach „Fertig“ ist die Karte weg; mit 👁 kommt sie zurück | ✅ (2026-10-25, Claude in der Demo) |
| 81.3 | Die Pinnwand an ⠿ greifen und vor die Uhr ziehen, loslassen | Die anderen Karten machen Platz, die Pinnwand bleibt vorne (auch nach „Fertig“ und neu Laden) | ✅ (2026-10-25, Claude in der Demo; nach dem neu Laden fängt die Demo wieder von vorne an, im Add-on bleibt es) |
| 81.4 | „＋ Karte hinzufügen“ → „Verlauf“ → im Suchfeld „wohnzimmer temp“ → „Wohnzimmer Temperatur“ → „7 Tage“, Farbe „Orange“ → „✓ Karte hinzufügen“ | Zwölf Arten zur Auswahl; die Liste zeigt nur passende Geräte; rechts die Vorschau mit Linie; danach steht die Karte auf der Seite („eigene Karte“) | ✅ (2026-10-25, Claude in der Demo; inzwischen 13 Arten) |
| 81.5 | Bei der neuen Karte ⚙️ → Breite „ganze Zeile“ → „Speichern“; dann 🗑 | Die Karte geht über die ganze Breite; 🗑 fragt nach und nimmt sie weg | ✅ (2026-10-25, Claude in der Demo) |
| 81.6 | Weitere Arten anlegen: Schalter (Flur Schalter), Licht (Stehlampe), Thermostat (Heizung Wohnzimmer), Rollladen (Wohnzimmer), Kamera, Raum (Küche), Text, Fertige Karte (Wetter) | Jede Karte zeigt ihr Gerät und lässt sich bedienen (Schalter, Helligkeit, − +, ▲ ■ ▼; Kamera antippen: groß; Raum antippen: im Haus) | ✅ (2026-10-25, Claude in der Demo) |
| 81.7 | „↺ Wie am Anfang“ | Fragt nach; die Karten stehen wieder wie vorher und alle sichtbar, die eigenen bleiben hinten | ✅ (2026-10-25, Claude in der Demo) |
| 81.8 | Auf „Klima“, „Abläufe“, „Familie“, „Energie“, „Kameras“ jeweils „✎ Bearbeiten“ | Überall dieselbe Leiste und dieselben Werkzeuge; z. B. bei Klima die Küche ausblenden, bei Abläufe „Gute Nacht“ nach vorne ziehen | ✅ (2026-10-25, Claude in der Demo) |
| 81.9 | Im Bearbeiten „🗂 Reiter“, dann einen Reiter unten seitlich ziehen (z. B. Familie nach vorn) | Über der Leiste „Reiter bearbeiten“, die Reiter gestrichelt; die neue Reihenfolge bleibt | ✅ (2026-10-25, Claude in der Demo) |
| 81.10 | „＋ Seite“ → Name „Garten“, Symbol 🌱, „Anfangen mit: Geräten eines Bereichs“ → Wohnzimmer → „Seite anlegen“ | Unten der neue Reiter „🌱 Garten“, die Seite mit den Geräten des Wohnzimmers als Karten (Lichter, Heizung, Rollladen, Szenen …), gleich im Bearbeiten | ✅ (2026-10-25, Claude in der Demo) |
| 81.11 | Wieder „🗂 Reiter“, auf „Garten“ tippen: Namen ändern; dann „🗑 Seite löschen“ | Erst heißt der Reiter anders, dann ist er weg | ✅ (2026-10-25, Claude in der Demo) |
| 81.12 | Am Handy: eine Seite bearbeiten, eine Karte mit dem Finger am ⠿ verschieben | Die Karte folgt dem Finger, die Seite rollt mit, wenn man an den Rand kommt | ✅ (2026-10-25, Claude in der Demo) |
| 81.13 | Im Add-on: als Admin eine Seite einrichten, dann am Wandtablet (Benutzer ohne Bearbeiten) ansehen | Dieselbe Anordnung, aber kein „✎ Bearbeiten“ | ➖ |
| 81.14 | Im Add-on: Verlauf-Karte mit einem echten Sensor, 24 Std. und 7 Tage | Die Linie passt zum Verlauf in Home Assistant | ➖ |
| 81.15 | Im Add-on: eine eigene Seite einem Benutzer abwählen (⚙ → Benutzer & Tablets → ⚙ des Benutzers → Reiter unten) | Dieser Benutzer sieht die Seite nicht, alle anderen schon | ➖ |

## 82. Neu in 4.7.0: Vollbild fest für einen Benutzer, beenden nur mit Code (#487)
Der Besitzer: „dass der Benutzer den Vollbildmodus sozusagen dauerhaft anhat und ihn selbst nicht deaktivieren kann … nur mit einem Code“. In der Demo spielt die Adresse mit `?vollbild=1` so ein Tablet (Code **1234**).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 82.1 | Demo mit der Adresse https://burned4aim.github.io/HA-Floorplanner/?vollbild=1&mode=live öffnen | Über allem eine dunkle Fläche „Tippen für Vollbild“; dahinter lässt sich nichts antippen | ✅ (2026-10-25, Claude in der Demo) |
| 82.2 | Auf die Fläche tippen | Die Seite füllt den ganzen Bildschirm; unten rechts steht „🔒 Vollbild beenden“ | ✅ (2026-10-25, Claude in der Demo) |
| 82.3 | „🔒 Vollbild beenden“ antippen, dann 1111 und „Beenden“ | Das Vollbild bleibt, es kommt ein Zahlenfeld; bei 1111 „Falscher Code“ | ✅ (2026-10-25, Claude in der Demo) |
| 82.4 | 1234 und „Beenden“; danach „⛶ Vollbild“ noch einmal | Das Vollbild ist aus, unten rechts wieder „⛶ Vollbild“; nach dem Antippen wieder Vollbild mit 🔒 | ✅ (2026-10-25, Claude in der Demo) |
| 82.5 | Im Vollbild Esc drücken (PC) oder vom Rand wischen bzw. Zurück (Tablet, Handy) | Sofort wieder die Fläche „Das Vollbild wurde verlassen“, ein Tipp: zurück ins Vollbild (Chrome am PC: Esc muss man lange halten) | ✅ (2026-10-25, Claude in der Demo) |
| 82.6 | Auf der Fläche „🔒 Mit Code beenden“ → 1234 → „Beenden“ | Die Fläche ist weg, die Seite geht ohne Vollbild | ✅ (2026-10-25, Claude in der Demo) |
| 82.7 | Nach 82.6 zehn Minuten nichts berühren | Die Fläche „Tippen für Vollbild“ kommt wieder | ✅ (2026-10-25, Claude in der Demo; die Fläche sagt dann „Das Vollbild wurde verlassen“) |
| 82.8 | Demo ohne `?vollbild=1`: ⚙ → „👥 Benutzer & Tablets“, bei einem Benutzer ⚙ → „🔒 Gesperrt“; darunter „🔒 Code für das Vollbild“ | Neuer Haken „Vollbild verlassen (⛶ bleibt an, beenden nur mit Code)“; „✓ Ein Code ist eingerichtet.“; ein Code mit 3 Ziffern wird abgelehnt, mit 4 bis 8 Ziffern „✓ Code gespeichert.“ | ✅ (2026-10-25, Claude in der Demo; erst mit „+“ einen Benutzer anlegen, die Demo hat keinen) |
| 82.9 | Im Add-on: als Admin beim Tablet-Benutzer „Vollbild verlassen“ ankreuzen und einen Code setzen; am Tablet (Fully Kiosk oder Chrome) öffnen | Die Fläche, nach einem Tipp Vollbild; beenden nur mit dem Code | ➖ |
| 82.10 | Im Add-on am Tablet fünfmal einen falschen Code | „Zu viele falsche Versuche. Bitte … Sekunden warten.“ | ➖ |

## 83. Neu in 4.8.0: 🎵 Musik & TV und 🧺 Haushalt (#490)
Paket 3 der Reiter („kannst du die anderen Reiter auch machen“), so wie auf den Bildern `docs/ideen-4.3/7-musik.jpg` und `8-haushalt.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 83.1 | Demo, „Live“: unten die Leiste | Nach „📷 Kameras“ stehen „🎵 Musik & TV“ und „🧺 Haushalt“; am Haushalt eine rote 1 (die Spülmaschine ist fertig) | ✅ (2026-10-25, Claude in der Demo) |
| 83.2 | „🎵 Musik & TV“ antippen | Karten: Fernseher (Netflix), Lautsprecher Wohnzimmer (Sommerregen), Kinderzimmer (Pause), Küchenradio (aus); ⏯, ⏭ und die Lautstärke gehen | ✅ (2026-10-25, Claude in der Demo) |
| 83.3 | Unten bei „Radiosender“ auf „SWR3“, dann „Küchenradio“ | Ein Fenster fragt „Wo soll der Sender laufen?“; danach spielt das Küchenradio SWR3 | ✅ (2026-10-25, Claude in der Demo) |
| 83.4 | Oben „🔗 Räume zusammen“, Häkchen setzen, „Zusammen spielen“; danach wieder öffnen, „Alle trennen“ | Die Karten zeigen „zusammen mit …“; nach dem Trennen ist das wieder weg | ✅ (2026-10-25, Claude in der Demo) |
| 83.5 | Oben „Alles stopp“ | Alles, was spielt, steht auf Pause | ✅ (2026-10-25, Claude in der Demo) |
| 83.6 | „🧺 Haushalt“ antippen | Waschmaschine: Programm, „fertig um …“, „noch … min“ und ein Balken; Trockner „zuletzt gestern 19:40“; Spülmaschine „fertig ✓“, „bitte ausräumen“ | ✅ (2026-10-25, Claude in der Demo) |
| 83.7 | Bei der Spülmaschine „✓ Ausgeräumt“ | Die Karte sagt „zuletzt …“, die rote 1 am Reiter ist weg | ✅ (2026-10-25, Claude in der Demo) |
| 83.8 | Beim Saugroboter „Saugen“, dann „Zur Station“ | Er saugt (Knopf „Pause“), dann fährt er zurück | ✅ (2026-10-25, Claude in der Demo) |
| 83.9 | Einkaufsliste: „Milch“ abhaken, unten „Butter“ eintippen und Enter, dann „Erledigte löschen“ | Milch wird durchgestrichen und rutscht nach unten, Butter kommt dazu, die abgehakten verschwinden | ✅ (2026-10-25, Claude in der Demo) |
| 83.10 | ⚙ → „🗂 Reiter unten“ → „🎵 Musik & TV: Radiosender“: „＋ Sender“, Name und Adresse eintippen, schließen; dann mit × wieder entfernen | Der neue Sender steht als Knopf auf der Seite; nach × ist er weg | ✅ (2026-10-25, Claude in der Demo) |
| 83.11 | Auf beiden Seiten „✎ Bearbeiten“ | Karten lassen sich verschieben und ausblenden wie auf den anderen Seiten | ✅ (2026-10-25, Claude in der Demo) |
| 83.12 | Am Handy beide Seiten ansehen | Alles lesbar, Knöpfe groß genug, nichts abgeschnitten | ✅ (2026-10-25, Claude in der Demo) |
| 83.13 | Im Add-on: echte Lautsprecher und Fernseher | Bild, Titel, Knöpfe und Lautstärke stimmen; ein Sender mit echter Stream-Adresse spielt | ➖ |
| 83.14 | Im Add-on: echte Waschmaschine (Home Connect o. Ä.) oder eine Steckdose mit Leistungsmessung | „läuft seit …“ während sie läuft, danach „fertig“ bis „Ausgeräumt“ | ➖ |
| 83.15 | Im Add-on: die Einkaufsliste von Home Assistant | Was hier abgehakt oder eingetragen wird, steht auch in der Home-Assistant-App | ➖ |
| 83.16 | Im Add-on: „Räume zusammen“ mit Sonos o. Ä. | Die Räume spielen zusammen, „Alle trennen“ trennt sie | ➖ |

## 84. Neu in 4.8.1: Zustände auf Deutsch in der Geräte-Liste (#492)
Beim Selbsttest der Demo gefunden: In der Geräte-Liste stand beim Saugroboter „docked“ und beim Bewegungsmelder „on“.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 84.1 | Demo, „Live“, oben „📋 Geräte“ antippen und die Liste durchsehen | Beim Saugroboter steht „An der Station“, bei „Büro Anwesenheit“ „An“, nirgends „on“, „off“ oder „docked“ | ✅ (2026-10-28, Claude in der Demo: nirgends on/off/docked/playing; repariert in #521, geprüft als 101.3) |

## 85. Neu in 4.8.2: Tablets schneller (#494)
Der Besitzer merkte, dass die Tablets langsamer wurden. Das 3D-Bild lief bei jeder Meldung eines Sensors 15 Sekunden mit voller Bildrate, und die Seiten wurden bei jeder Änderung ganz neu gebaut.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 85.1 | Im Add-on am Wandtablet ☀ Heute offen lassen, ein paar Minuten warten, dann zwischen den Reitern wechseln | Alles reagiert flüssig, das Tablet wird nicht mehr warm; „Strom jetzt“ zeigt neue Werte, die anderen Karten flackern nicht | ❓ (Claude 2026-11-06: nur am echten Wandtablet (flüssig, warm)) |
| 85.2 | Im Add-on 🏠 Haus offen lassen, nichts berühren (ein Strom-Sensor meldet sich weiter) | Lampen und Werte ändern sich weiter wie gewohnt; das Tablet bleibt kühl | ❓ (Claude 2026-11-06: nur am echten Wandtablet) |
| 85.3 | Im Add-on im 🏠 Haus eine Tür oder ein Rollo über Home Assistant bewegen | Tür bzw. Rollo bewegt sich flüssig bis zum Ende, nicht ruckelnd | ❓ (Claude 2026-11-06: nur am echten Gerät (wie flüssig)) |
| 85.4 | Auf einer Seite (z. B. 🌡 Klima) ein Licht über Home Assistant einschalten, dann auf 🏠 Haus wechseln | Im Haus ist das Licht sofort an (Raum-Kachel, Schild und Lampe) | ✅ (2026-11-06, Claude im Test-Add-on (nachgebauter Home Assistant): Licht in Home Assistant eingeschaltet, während 🌡 Klima offen war; auf 🏠 Haus sofort an (Lampe leuchtet, „💡 1 an“)) |

## 86. Neu in 4.9.0: Thermostat als Kreis wie in Home Assistant (#495)
Wunsch des Besitzers: „wie in Home Assistant selbst mit so einem Kreis, wo man Plus und Minus machen kann … Heizen, Auto und Aus“. Bild `docs/ideen-4.9/1-thermostat.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 86.1 | Demo, „Live“, unten 🌡 Klima | Wohnzimmer und Büro haben einen Kreis: in der Mitte das Soll (groß), darunter „jetzt …“, der Ring ist orange (Heizen) bzw. blau (Kühlen) | ✅ (2026-10-25, Claude in der Demo) |
| 86.2 | Beim Wohnzimmer zweimal auf + tippen | Das Soll steigt sofort um 1,0°, kurz danach wird es an Home Assistant geschickt (bleibt stehen) | ✅ (2026-10-25, Claude in der Demo) |
| 86.3 | Den weißen Knopf am Ring mit dem Finger ziehen | Die Zahl in der Mitte folgt dem Finger; beim Loslassen wird der Wert gesendet | ✅ (2026-10-25, Claude in der Demo) |
| 86.4 | Unter dem Kreis „Auto“, dann wieder „Heizen“ antippen | Der getippte Knopf wird farbig, das Gerät wechselt den Modus | ✅ (2026-10-25, Claude in der Demo) |
| 86.5 | Beim Büro (Klimagerät) „Kühlen“, „Entfeuchten“, „Lüfter“ und die Lüfterstufen antippen | Alle Knöpfe gibt es, der gewählte ist markiert | ✅ (2026-10-25, Claude in der Demo) |
| 86.6 | Bei Wohnzimmer eine Vorwahl antippen (Eco, Komfort …) | Die Vorwahl ist markiert | ✅ (2026-10-25, Claude in der Demo) |
| 86.7 | Unten ✎ Bearbeiten, bei einer Klima-Karte ⤡ antippen, dann ✓ Fertig | Die Karte zeigt einen kleinen Kreis mit − / + und den Modi als Symbole daneben; ⤢ macht sie wieder groß | ✅ (2026-10-25, Claude in der Demo) |
| 86.8 | ☀ Heute, ✎, „＋ Karte hinzufügen“, „Thermostat“, ein Thermostat wählen, „Größe des Kreises: Klein“ | Die Vorschau und die Karte zeigen den kleinen Kreis; mit „Groß“ den großen mit allen Knöpfen | ✅ (2026-10-25, Claude in der Demo) |
| 86.9 | Am Handy 🌡 Klima öffnen und am Ring ziehen | Der Kreis passt auf den Bildschirm, beim Ziehen am Ring scrollt die Seite nicht | ✅ (2026-10-25, Claude in der Demo) |

## 87. Neu in 4.10.0: Strom mehrerer Häuser in einer Grafik (#495)
Wunsch des Besitzers: „wenn man mehrere Häuser hat mit unterschiedlichen Stromsensoren, dass es dann auch in einer Grafik irgendwie zu sehen ist“. Bild `docs/ideen-4.9/2-strom-haeuser.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 87.1 | Demo, „Live“, ⚡ Energie, oben „⚖ Vergleichen“ | Je eine Kachel für Demo-Haus und Nachbarhaus (kWh heute, „jetzt …“) und „Σ alle Häuser“; die Grafik hat eine blaue und eine orange Linie bis „jetzt“ | ✅ (2026-10-25, Claude in der Demo) |
| 87.2 | „Woche“, „Monat“, „Jahr“ antippen | Pro Tag bzw. Monat ein blauer und ein oranger Balken nebeneinander; mit dem Finger auf einem Balken stehen beide Werte | ✅ (2026-11-06, Claude mit nachgemachtem Finger (2026-10-25) und im Browser-Test 32_today_energy: Woche, ein Balken je Haus und Tag, im Kästchen beide Werte) |
| 87.3 | Die Karten „Leistung jetzt“ und „Kosten“ ansehen | Jedes Haus mit seiner Farbe, Balken und Wert; bei Kosten unten die Summe | ✅ (2026-10-25, Claude in der Demo) |
| 87.4 | ☀ Heute, ✎, „＋ Karte hinzufügen“, „Verlauf“, nach „leistung“ suchen und „Netzbezug“ und „Nachbarhaus Verbrauch“ antippen | Beide sind markiert (farbiges Quadrat), die Vorschau zeigt zwei Linien mit Legende | ✅ (2026-10-25, Claude in der Demo) |
| 87.5 | Die Karte speichern und „✓ Fertig“ | Die Karte heißt „Verlauf“, zeigt zwei farbige Linien und oben beide Werte von jetzt | ✅ (2026-10-25, Claude in der Demo) |
| 87.6 | Im Add-on: bei jedem Haus in ⚡ Rechnung die eigenen Zähler eintragen, dann ⚡ Energie → „⚖ Vergleichen“ | Jedes Haus zeigt seine eigenen Werte; ein Haus ohne eigene Zähler zeigt „keine eigenen Zähler“ (außer dem ersten, das die Zähler aus dem Energie-Dashboard nimmt) | ✅ (2026-11-06, Claude im Browser-Test 32_today_energy: „⚖ Vergleichen“ mit den Zählern jedes Hauses, eine Kachel je Haus, die Summe) |

## 88. Neu in 4.11.0: Abschnitte auf den Seiten wie in Home Assistant (#495)
Wunsch des Besitzers: „dass ich so Kartenabschnitte frei auf dem Dashboard platzieren kann mit so Abschnitten“. Bild `docs/ideen-4.9/3-abschnitte.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 88.1 | Demo, „Live“, ☀ Heute, unten ✎ Bearbeiten, oben „＋ Abschnitt“ | Ein Fenster „Abschnitt einstellen“ mit Name, Symbol und Breite; nach „Speichern“ steht der Abschnitt unter den Karten, leer mit „Karten mit ⠿ hierher ziehen“ | ✅ (2026-10-25, Claude in der Demo) |
| 88.2 | Eine Karte am ⠿ in den Abschnitt ziehen, eine zweite daneben | Beide stehen im Abschnitt, oben fehlen sie | ✅ (2026-10-25, Claude in der Demo) |
| 88.3 | Die blaue Ecke ↘ unten rechts einer Karte nach rechts ziehen | Die Karte wird breiter (über zwei oder drei Spalten), nach links wieder schmaler | ✅ (2026-10-25, Claude in der Demo) |
| 88.4 | Am Abschnitt ✏️: anderer Name, „Breit (zwei Spalten)“ | Der Abschnitt heißt anders und ist doppelt so breit | ✅ (2026-10-25, Claude in der Demo) |
| 88.5 | Zweiten Abschnitt anlegen, mit ‹ › die Reihenfolge ändern | Die Abschnitte tauschen den Platz | ✅ (2026-10-25, Claude in der Demo) |
| 88.6 | „✓ Fertig“ | Die Überschriften bleiben, alle Werkzeuge (⠿, ↘, ✏️) sind weg | ✅ (2026-10-25, Claude in der Demo) |
| 88.7 | Wieder ✎, am Abschnitt 🗑 | Nach der Rückfrage ist der Abschnitt weg, seine Karten stehen wieder oben | ✅ (2026-10-25, Claude in der Demo) |
| 88.8 | Dasselbe auf 🌡 Klima oder einer eigenen Seite | Geht genauso | ✅ (2026-10-25, Claude in der Demo) |

## 89. Neu in 4.12.0: Wer ist wirklich zu Hause (#495)
Wunsch des Besitzers: „ob jetzt wirklich eine Person im Haus ist … mit dem Handy, dass es sich mit dem WLAN verbindet“. Bild `docs/ideen-4.9/4-anwesenheit.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 89.1 | Demo, „Live“, unten 👨‍👩‍👧 Familie | Oben „1 Person zu Hause – Anna (Wohnzimmer)“; bei Anna „zu Hause · Wohnzimmer“ | ✅ (2026-10-25, Claude in der Demo) |
| 89.2 | Bei Anna die Liste unter dem Namen ansehen | GPS, Raum, WLAN „Zuhause-5G“ (Handy-App) und „Handy im WLAN (Router)“, jeweils mit Uhrzeit, grün markiert | ✅ (2026-10-25, Claude in der Demo) |
| 89.3 | Bei Lena und Max | „nicht im WLAN (Router)“ grau markiert, GPS sagt Schule / unterwegs | ✅ (2026-10-25, Claude in der Demo) |
| 89.4 | Karte „Wer ist wo im Haus“ | Wohnzimmer – Anna; Räume mit Bewegungsmelder stehen mit „Bewegung / Anwesenheit“ da | ✅ (2026-10-25, Claude in der Demo) |
| 89.5 | Im Add-on: ⚙ → „Reiter unten“ → „Wer ist zu Hause“: „Zu Hause, wenn“ und „WLAN-Name(n) zu Hause“ | Drei Möglichkeiten (Home Assistant / eine Quelle / zwei Quellen); der eigene WLAN-Name lässt sich eintragen | ✅ (2026-11-06, Claude im Browser-Test 33_climate_routines_family: ⚙ → „Reiter unten“: Regel und WLAN-Name gespeichert; „eine Quelle reicht“ zählt das Handy im Heim-WLAN als zu Hause) |
| 89.6 | Im Add-on mit dem eigenen Handy (Home-Assistant-App, WLAN-Sensor an) auf 👨‍👩‍👧 Familie | Bei dir stehen dein WLAN-Name und, wenn vorhanden, das Handy im Router; mit „eine Quelle“ zählst du zu Hause, sobald das Handy im WLAN ist | ❓ (Claude 2026-11-06: die Regel geht (Browser-Test 33); mit deinem Handy und WLAN nur du) |

## 90. Neu in 4.13.0: Kalender-Karte mit mehreren Kalendern und „＋ Termin“ (#495)
Wunsch des Besitzers: „verschiedene Kalender … zusätzlich eine Karte einfach mit Terminkalendern“. Bilder `docs/ideen-4.9/5-kalender.jpg` und `6-kalender-einstellen.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 90.1 | Demo, „Live“, ☀ Heute | Unter Uhr und Wetter die Karte „Diese Woche“: oben die Kalender als farbige Punkte (Familie blau, Arbeit Anna orange, Schule grün, Geburtstage rot), darunter eine Spalte pro Tag mit farbigen Terminen, heute umrandet | ✅ (2026-10-25, Claude in der Demo) |
| 90.2 | Auf der Karte „＋ Termin“, Titel „Test“, Uhrzeit wählen, „✓ Eintragen“ | Das Fenster geht zu, der Termin steht sofort in der Karte | ✅ (2026-10-25, Claude in der Demo) |
| 90.3 | Noch einmal „＋ Termin“, „Ganztägig“ anhaken | „Von / Bis“ verschwinden, dafür „Bis (letzter Tag)“; ohne Titel sagt das Fenster „Bitte einen Titel eingeben.“ | ✅ (2026-10-25, Claude in der Demo) |
| 90.4 | ✎ Bearbeiten, an der Karte ⚙️ | Fenster „Karte ‚Kalender‘ einstellen“: alle Kalender mit Haken und sechs Farbpunkten, Zeitraum, Ansicht, „Termin eintragen“; rechts die Vorschau | ✅ (2026-10-25, Claude in der Demo) |
| 90.5 | Ansicht „☰ Liste“, dann „🗓 Monat“, dann „Nur nächster Termin“ (jeweils speichern, „✓ Fertig“) | Liste nach Tagen („Heute“, „Morgen“, …); Monat mit Punkten, Tippen auf einen Tag zeigt seine Termine darunter; nächster Termin groß, darunter „Danach“ mit zwei weiteren | ✅ (2026-10-25, Claude in der Demo) |
| 90.6 | ✎ → „＋ Karte“ → „📅 Kalender“, nur einen Kalender anhaken, Farbe ändern, „Hinzufügen“ | Eine zweite Kalender-Karte nur mit diesem Kalender in der gewählten Farbe | ✅ (2026-10-25, Claude in der Demo) |
| 90.7 | Im Add-on: eine Kalender-Karte mit deinen Kalendern, „＋ Termin“ in einen Kalender, der Termine annimmt (z. B. Lokaler Kalender, Google) | Der Termin steht danach auch im Kalender von Home Assistant | ✅ (2026-11-06, Claude im Browser-Test 38_calendar_card: „＋ Termin“ geht als calendar.create_event an Home Assistant, auch ganztägig) |

## 91. Neu in 4.14.0: Knöpfe gestalten (#495)
Wunsch des Besitzers: „mehr Möglichkeiten, Buttons anzupassen“. Bild `docs/ideen-4.9/7-knoepfe.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 91.1 | Demo, „Live“, unten die neue Seite „🔘 Knöpfe“ | Knöpfe als Kachel, rund, als Pille und nur mit Symbol, in verschiedenen Farben; „Wohnzimmer“ in der Farbe der Lampe mit Helligkeits-Balken, „Schlafzimmer“ mit „seit … Std.“ | ✅ (2026-10-25, Claude in der Demo) |
| 91.2 | Auf „Küche“ tippen | Das Licht geht an, der Knopf wird farbig | ✅ (2026-10-25, Claude in der Demo) |
| 91.3 | „Wohnzimmer“ lange drücken (etwa eine halbe Sekunde) | Ein Fenster mit Reglern: An/Aus, Helligkeit, Farben | ✅ (2026-10-25, Claude in der Demo) |
| 91.4 | Auf „Heizung“ tippen, dann auf „Haustür“ | Heizung: Fenster mit dem Thermostat-Kreis; Haustür: Fenster mit „🔒 Abschließen“ / „🔓 Aufschließen“ | ✅ (2026-10-25, Claude in der Demo) |
| 91.5 | ✎ Bearbeiten, an einem Knopf ⚙️ | Symbol, „Farbe, wenn an“ (auch „oder die Farbe der Lampe“), „Form und Größe“, „Zeigen“, „Tippen“, „Lange drücken“; die Vorschau rechts ändert sich sofort | ✅ (2026-10-25, Claude in der Demo) |
| 91.6 | Bei „Tippen“ „Seite öffnen“ wählen, eine Seite aussuchen, speichern, „✓ Fertig“, dann auf den Knopf tippen | Die gewählte Seite geht auf | ✅ (2026-10-25, Claude in der Demo) |
| 91.7 | Im Add-on: einen eigenen Knopf für eine Lampe anlegen und gestalten | Sieht aus wie gewählt, Tippen und lange Drücken tun, was eingestellt ist | ✅ (2026-11-06, Claude im Browser-Test 39_buttons) |

## 92. Neu in 4.15.0: Zähler „von oben übernehmen“ und vollständigeres Backup (#501, #500)
Wünsche des Besitzers: „einen Knopf …, dass es von oben, was ich eingestellt habe, nach unten auch übernommen wird“ und „sichert das Backup auch alles …?“
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 92.1 | Demo, Bearbeiten → Strom-Editor (⚡) → unten „Zähler für den Verlauf“ → „⤵ Von oben übernehmen“ | Für Netz, Solar und Batterie je eine grüne Zeile „… übernommen“; die Zähler stehen darunter | ✅ (2026-10-25, Claude in der Demo) |
| 92.2 | Im Add-on: dasselbe mit deinen Sensoren (SolarNet) | Wo dein Gerät einen kWh-Zähler hat, wird er übernommen; sonst steht dort „misst nur die Leistung (W) …“ mit dem Knopf „＋ Zähler anlegen“ | ✅ (2026-11-06, Claude im Browser-Test 40_energy_counters: der Gesamtzähler des Wechselrichters wird übernommen; ein Sensor ohne Zähler sagt es, mit „＋ Zähler anlegen“) |
| 92.3 | Im Add-on: bei einem Sensor ohne Zähler „＋ Zähler anlegen“ | Grüne Zeile „… angelegt und übernommen“; in Home Assistant unter Einstellungen → Geräte & Dienste → Helfer steht ein neuer Helfer „… Energie“ (Integral) | ✅ (2026-11-06, Claude im Browser-Test 40_energy_counters: „＋ Zähler anlegen“ legt den Integral-Helfer an und übernimmt ihn, ein zweites Mal nichts doppelt) |
| 92.4 | Noch einmal „⤵ Von oben übernehmen“ | Alles „war schon eingetragen“, nichts doppelt | ✅ (2026-10-25, Claude in der Demo) |
| 92.5 | Eine Notiz an die Pinnwand, dann „Backup herunterladen“, die Notiz löschen, das Backup einspielen | Die Notiz ist wieder da | ✅ (2026-10-25, Claude im Test-Add-on; in der Demo geht das Einspielen nicht, nur im Add-on) |
| 92.6 | Im Add-on: Urlaubs-Alarmanlage eingerichtet (Sensoren, Code), Backup einspielen | Sensoren und Einstellungen stimmen, der Code ist noch derselbe | ✅ (2026-11-06, Claude in tests/test_server.py: das Backup bringt Sensoren, Einstellungen und den alten Code der Urlaubs-Alarmanlage zurück) |

## 93. Neu in 4.16.0: Leistungs-Sensoren (W) als Zähler (#503)
Nachfrage des Besitzers: „kannst du es nicht einfach so machen, dass es egal ist ob W oder kWh?“
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 93.1 | Im Add-on: Bearbeiten → ⚡ Strom-Editor → „Zähler für den Verlauf“ → „⤵ Von oben übernehmen“ | Bei Solar und Batterie grüne Zeilen „… übernommen: die Seite ⚡ Energie rechnet aus den Watt die kWh“; beim Netzbezug „steht schon: Strom-HD_Strasse-Bezug, nichts doppelt eingetragen“ | ✅ (2026-11-06, Claude im Browser-Test 40_energy_counters: „⤵ Von oben übernehmen“) |
| 93.2 | Unten bei „Solar erzeugt“ in „＋ Sensor hinzufügen …“ tippen | Auch Sensoren in W (z. B. SolarNet PV-Leistung) stehen in der Liste | ✅ (2026-11-06, Claude im Browser-Test 40_energy_counters: ein Leistungs-Sensor (W) mit Statistik wird selbst genommen) |
| 93.3 | Unten auf ⚡ Energie, „Woche“ oder „Monat“ | Solar und Batterie zeigen kWh, auch für die Tage vor heute | ✅ (2026-11-06, Claude im Browser-Test 40_energy_counters: die Statistik eines W-Sensors kommt als kWh (0,5 kW eine Stunde = 0,5 kWh)) |
| 93.4 | Zum Vergleich in Home Assistants eigenem Energie-Dashboard denselben Tag ansehen | Die Werte liegen nah beieinander (aus dem Mittelwert gerechnet, darum nicht aufs Komma gleich) | ❓ (Claude 2026-11-06: nur mit deinen Daten im Energie-Dashboard) |

## 94. Neu in 4.17.0: Docker-Version ohne Supervisor (#489)
Wunsch eines Nutzers (#489): 3D Floorplan auch für Home Assistant als Docker-Container. Im Add-on ändert sich nichts; 94.2 und 94.3 kann nur prüfen, wer Home Assistant als Docker-Container hat (der Nutzer aus #489).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 94.1 | Im Add-on wie immer öffnen, oben rechts schauen, etwas bearbeiten und speichern | Kein Knopf „Abmelden“; Bearbeiten und Speichern gehen wie vorher | ✅ (2026-11-06, Claude in tests/test_login.py: mit dem Supervisor keine Anmeldung und kein „Abmelden“) |
| 94.2 | Docker: nach `container/README.md` starten und `http://<Rechner>:8100` öffnen | Die Anmeldeseite von Home Assistant kommt; nach dem Anmelden der Grundriss, als Administrator mit Bearbeiten | ✅ (2026-11-06, Claude in tests/test_login.py und tests/test_container.py mit nachgebauter Anmeldung von Home Assistant; das Docker-Image baut und startet der CI-Job „container“) |
| 94.3 | Docker: oben rechts „Abmelden“ | „Abgemeldet.“; „Wieder anmelden“ führt wieder zur Anmeldeseite von Home Assistant | ✅ (2026-11-06, Claude in tests/test_login.py: „Abmelden“, danach führt der Weg wieder zur Anmeldung) |

## 95. Neu in 4.18.0: eine Seite in eigener Fassung je Benutzer (#507)
Wunsch des Besitzers: „bei unterschiedlichen Benutzern unterschiedliche Sachen anzeigen“. Beispielbilder `docs/ideen-4.18/`. In der Demo gibt es die Benutzer Admin, Tablet Wohnzimmer und Familie.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 95.1 | 🌡 Klima öffnen, unten rechts ✎ Bearbeiten | Unter der blauen Leiste eine lila Leiste „🗂 Fassung“ mit „👪 Für alle“, „＋ Neue Fassung“, „👁 Ansehen als …“, „👥 Wer sieht was“ | ✅ (2026-10-25, Claude in der Demo) |
| 95.2 | „＋ Neue Fassung“: Name „Kinder“, ein Symbol, „Kopie von „Für alle““, Haken bei „Familie“, „Anlegen und bearbeiten“ | Die Leiste zeigt „🧒 Kinder“ gewählt, daneben „Sehen diese Fassung: Familie“ | ✅ (2026-10-25, Claude in der Demo) |
| 95.3 | In „Kinder“ bei zwei Räumen 👁 tippen, dann oben „👪 Für alle“ tippen | In „Kinder“ sind die zwei Räume blass (ausgeblendet), in „Für alle“ sind sie normal da | ✅ (2026-10-25, Claude in der Demo) |
| 95.4 | „👁 Ansehen als …“ → „Familie“ | Oben lila „Du siehst alles wie Familie · ✕ Zurück“; Klima ohne die zwei Räume; kein ✎ in der Leiste | ✅ (2026-10-25, Claude in der Demo) |
| 95.5 | „✕ Zurück“ | Alles wieder wie vorher, die zwei Räume da, ✎ wieder da | ✅ (2026-10-25, Claude in der Demo) |
| 95.6 | ✎ → „👥 Wer sieht was“: bei Familie unter ⚡ Energie „aus“, „Speichern“; dann „Ansehen als …“ → Familie | Bei Familie fehlt der Reiter ⚡ Energie; „Zurück“ | ✅ (2026-10-25, Claude in der Demo) |
| 95.7 | ⚙ → 👥 Benutzer & Tablets → bei Familie ⚙ → „Reiter unten“ | Neben 🌡 Klima eine Auswahl „🧒 Kinder“; der Haken bei ⚡ Energie ist weg | ✅ (2026-10-25, Claude in der Demo) |
| 95.8 | ✎ auf Klima → Chip „🧒 Kinder“ → „⚙ Einstellen“ → „🗑 Fassung löschen“ → OK | Die Fassung ist weg, nur noch „👪 Für alle“; Familie sieht Klima wieder normal | ✅ (2026-10-25, Claude in der Demo) |
| 95.9 | Dasselbe auf einer anderen Seite (z. B. ☀ Heute) mit „Leer“ | Die neue Fassung startet ohne Karten (alle blass), „＋ Karte“ fügt nur dort etwas hinzu | ✅ (2026-10-25, Claude in der Demo) |
| 95.10 | Handy: ✎ auf Klima, „👥 Wer sieht was“ | Die lila Leiste bricht sauber um, die Tabelle lässt sich seitwärts schieben | ✅ (2026-10-25, Claude in der Demo) |

## 96. Neu in 4.19.0: Sprachsuche mit 🎤 und Codewörtern (#509)
Wunsch des Besitzers: „Sprachsuche … welche Fenster sind offen … Codewörter … Wohnzimmer von den Eltern … pro Benutzer einschränken“. In der Demo gibt es die Codewörter „Stube“ (Wohnzimmer), „Werkstatt“ (Hobbyraum), „Schlafräume“ (drei Räume) und „beim Nachbarn“ (Nachbarhaus). Das 🎤 geht in der Demo mit Chrome, Edge oder Safari (die Erkennung des Browsers), Home Assistant Assist nur im Add-on.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 96.1 | Unten links neben 🔍 auf 🎤 tippen, Mikrofon erlauben, „Welche Fenster sind offen?“ sagen | Das Suchfeld zeigt den Satz, darüber „🪟 Fenster · offen: …“ und die offenen Fenster; im Bild blaue Ringe an diesen Fenstern | ❓ (Claude 2026-11-06: nur mit echter Sprache) |
| 96.2 | 🔍 tippen und „Ist oben noch Licht an?“ eintippen (ohne Mikrofon) | Oben in der Liste eine Zeile „💬 Lichter · an · Obergeschoss“; Enter: das Obergeschoss, die Lichter, die an sind, mit Ringen | ✅ (repariert in #522, geprüft als 101.4 ✅ 2026-10-25, Claude in der Demo. Damals ❌: der Ring lag unter dem Raum-Schild) |
| 96.3 | „Wie sieht es in der Stube aus?“ (Codewort der Demo) | Die Ansicht fliegt ins Wohnzimmer (in „Live“ geht die Raum-Karte auf) | ✅ (2026-10-25, Claude in der Demo) |
| 96.4 | „Wie warm ist es im Kinderzimmer?“ | Das Kinderzimmer, oben „🌡 Kinderzimmer: … °C“ | ✅ (2026-10-25, Claude in der Demo) |
| 96.5 | „Wie warm ist es?“ | Die Räume werden nach Temperatur gefärbt (wie „Temp.“), darunter alle Räume mit ihrer Temperatur | ✅ (2026-10-25, Claude in der Demo) |
| 96.6 | „Sind alle Fenster zu?“ | Entweder „✓ Fenster: alle zu“ oder die Fenster, die noch offen sind | ✅ (2026-10-25, Claude in der Demo) |
| 96.7 | „Wie sieht es beim Nachbarn aus?“ | Das Nachbarhaus wird geöffnet, oben „🏠 Nachbarhaus“ | ✅ (2026-10-25, Claude in der Demo) |
| 96.8 | Einen Eintrag der Antwort-Liste antippen | Die Ansicht fliegt zu diesem Fenster / Licht, ein Ring markiert es | ✅ (2026-10-25, Claude in der Demo) |
| 96.9 | ⚙ → 🎤 Sprachsuche öffnen | Was dieses Gerät kann (✓/✗ Browser, Mikrofon, Home Assistant Assist), die Anleitung für Assist, die Codewörter der Demo | ✅ (2026-10-25, Claude in der Demo; der Link zu Home Assistant war dunkelblau: #523, 101.5) |
| 96.10 | „＋ Codewort“: „Kinder“ eintippen, bei „＋ Ort …“ Kinderzimmer und Gästezimmer wählen, dann fragen „Wie sieht es bei den Kindern aus?“ | Das Codewort hat zwei Chips; die Frage zeigt beide Räume zum Antippen | ✅ (2026-10-25, Claude in der Demo) |
| 96.11 | Bei einem Codewort ins Feld „für alle (oder Benutzer)“ einen Benutzer schreiben | Das Codewort gilt nur noch für diesen Benutzer | ➖ |
| 96.12 | ⚙ → 👥 Benutzer & Tablets → bei einem Benutzer 🔒 „Sprachsuche (🎤)“ abhaken, als dieser Benutzer öffnen | Kein 🎤 mehr (die Suche 🔍 bleibt) | ➖ |
| 96.13 | Im Add-on mit der Home-Assistant-App auf dem Handy (Android) oder am Wandtablet: 🔍 → 🎤 | Ohne Assist: „Home Assistant kann noch keine Sprache erkennen …“ bzw. kein 🎤; nach der Anleitung in ⚙ → 🎤 (Whisper) geht es | ➖ |
| 96.14 | Handy: 🔍 tippen | Das 🎤 ist im Suchfeld rechts neben dem Eingabefeld | ✅ (2026-10-25, Claude in der Demo) |


## 97. Neu in 4.19.1: 🩺 Mikrofon-Test, 🎤 am Tablet und ohne https (#511)
Der Besitzer: „wenn ich aufs Mikrofon drauf drücke, dann hört er nichts … weder auf dem Tablet noch auf dem PC“. Ursache am Tablet: Apps mit eingebautem Browser (Fully Kiosk, die Home-Assistant-App) haben die Spracherkennung von Chrome, sie tut darin aber nichts. Über http:// gibt kein Browser das Mikrofon frei. Der Test geht auch in der Demo (dort ist es https).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 97.1 | ⚙ → 🎤 Sprachsuche öffnen | Oben eine Liste, was dieses Gerät ist: „Sichere Verbindung (https)“ oder „Unsichere Verbindung (http://…)“, „Gerät: …“ (z. B. „Chrome 130 · Windows“), ob das Mikrofon erlaubt ist, welche Erkennung das 🎤 nimmt (oder warum keine, mit „→ was zu tun ist“) | ✅ (2026-10-25, Claude in der Demo) |
| 97.2 | Darunter „🎤 1. Mikrofon prüfen“, „Zulassen“, etwas sagen | Der Balken bewegt sich und wird grün; nach 6 Sekunden „✓ Das Mikrofon „…“ hört dich“ (oder ✗ mit dem Grund und „→ …“); darunter eine Auswahl „Mikrofon“ | ✅ (2026-10-25, Claude in der Demo mit einem nachgemachten Mikrofon) |
| 97.3 | „🗣 2. Erkennung prüfen“, „Welche Fenster sind offen?“ sagen | „✓ Erkannt mit …: „Welche Fenster sind offen““ oder ✗ mit dem Grund und was zu tun ist | ❓ (Claude 2026-11-06: nur mit echter Sprache) |
| 97.4 | „📋 Ergebnis kopieren“ | Unten ein Kasten mit dem ganzen Ergebnis (Version, Browser, alle Zeilen); in den Chat einfügen geht | ✅ (2026-10-25, Claude in der Demo) |
| 97.5 | Am PC (Chrome oder Edge) unten links 🎤 tippen | Über https: es hört zu. Über http:// seit 4.20.0: das Diktat der Tastatur (siehe 98.5) | ➖ |
| 97.6 | Am Wandtablet (Fully Kiosk) oder in der Home-Assistant-App 🎤 tippen | Nie mehr endlos „Ich höre zu …“. Ohne Assist seit 4.20.0: das Diktat der Tastatur (siehe 98.4); mit Assist (Whisper, nur über https) hört es selbst zu | ➖ |
| 97.7 | Nach einer Warnung beim 🎤 die Zeile „🩺 Mikrofon-Test öffnen“ antippen | Die Einstellungen gehen bei 🎤 Sprachsuche auf, beim Mikrofon-Test | ✅ (2026-10-25, Claude in der Demo; die Überschrift lag unter der Kopfzeile: #523, behoben in 4.21.2, 101.5) |

## 98. Neu in 4.20.0: 🎤 ohne https mit dem Diktat der Tastatur (#513)
Der Besitzer: „das muss ja einfach Plug and Play funktionieren … man kann ja nicht erwarten, dass jemand, der das installiert, noch eine HTTPS-Verbindung drauf macht“. Browser geben einer Seite das Mikrofon nur über https; das 🎤 der Tastatur gehört aber dem Gerät und tippt in jedes Feld. Wo die Seite nicht selbst zuhören darf (http://, eine App ohne Assist), nimmt das 🎤 deshalb von selbst das Diktat der Tastatur. Die Demo ist https: dort mit der Einstellung „Nur das Diktat der Tastatur“ testen.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 98.1 | In der Demo ⚙ → 🎤 Sprachsuche → Spracherkennung „Nur das Diktat der Tastatur (geht auch ohne https)“ wählen, schließen, unten links 🎤 tippen | Das Suchfeld geht auf (am Tablet und Handy mit der Tastatur), darüber „🎤 Tippe ins Suchfeld, dann auf das 🎤 der Tastatur, und sprich …“ (am PC: „Drücke die Windows-Taste + H …“) | ✅ (2026-10-25, Claude in der Demo: Tablet und Handy „Tippe ins Suchfeld …“, Windows-PC „Windows-Taste + H“) |
| 98.2 | Auf das 🎤 der Tastatur tippen (am PC Windows-Taste + H) und „Welche Fenster sind offen?“ sagen, dann kurz still sein | Nach etwa 2 Sekunden kommt von selbst „🪟 Fenster · offen: …“ mit der Liste, ohne Enter; am Tablet geht die Tastatur weg | ❓ (Claude 2026-10-25: mit nachgestelltem Diktat kommt die Antwort nach etwa 2 Sekunden ohne Enter; das echte 🎤 der Tastatur bitte selbst; Claude 2026-11-06: nur mit echter Sprache) |
| 98.3 | ⚙ → 🎤 Sprachsuche ansehen | In der Liste „✓ Auf diesem Gerät: 🎤 mit dem Diktat der Tastatur“ und wie man diktiert; danach wieder „Automatisch“ wählen | ✅ (2026-10-25, Claude in der Demo) |
| 98.4 | Im Add-on über http:// (z. B. http://homeassistant.local:8123) am Wandtablet (Fully Kiosk) oder in der Home-Assistant-App, Einstellung „Automatisch“: 🎤 tippen, dann das 🎤 der Tastatur, fragen | Ohne etwas einzurichten (kein https, kein Whisper) wird die Frage beantwortet | ➖ |
| 98.5 | Im Add-on über http:// am PC (Chrome oder Edge): 🎤 tippen, dann Windows-Taste + H, fragen | Wie 98.4 | ➖ |

## 99. Neu in 4.21.0: 🔋 Ladestand der Batterien auf ⚡ Energie (#515)
Der Besitzer: „dass man den Batterieladezustand nachvollziehen kann in einer Art Diagramm … alles zusammen sehen oder nur einzeln … auch für unterschiedliche Häuser“. In der Demo hat das Demo-Haus die „Hausbatterie“, das Nachbarhaus einen „Hausspeicher“.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 99.1 | In der Demo unten „⚡ Energie“, oben „Demo-Haus“ | Eine Karte „🔋 Ladestand“ mit einer Linie durch den Tag bis „jetzt“, oben ein Knopf „Hausbatterie 82 %“, darunter „tiefster Stand … · höchster …“ | ✅ (2026-10-25, Claude in der Demo; am Tag der Zeitumstellung macht die Demo-Linie am Ende einen kleinen Sprung) |
| 99.2 | Oben „Alle Häuser“ | In der Karte zwei Knöpfe „Demo-Haus · Hausbatterie“ (blau) und „Nachbarhaus · Hausspeicher“ (orange), zwei Linien, rechts oben „Zusammen“ und „Einzeln“ | ✅ (2026-10-25, Claude in der Demo) |
| 99.3 | Mit der Maus über die Linien fahren (am Tablet auf die Grafik tippen) | Ein Kästchen mit der Uhrzeit und dem Ladestand jeder Batterie an dieser Stelle | ✅ (2026-10-25, Claude in der Demo) |
| 99.4 | „Einzeln“ antippen | Je Batterie ein eigenes kleines Bild mit Name, tiefstem und höchstem Stand | ✅ (2026-10-25, Claude in der Demo) |
| 99.5 | Den Knopf „Nachbarhaus · Hausspeicher“ antippen, dann noch einmal | Erst durchgestrichen und sein Bild ist weg, dann wieder da | ✅ (2026-10-25, Claude in der Demo) |
| 99.6 | „Einzeln“ lassen, die Seite neu laden (Strg+F5), wieder „⚡ Energie“ → „Alle Häuser“ | Immer noch „Einzeln“: das Gerät hat sich die Wahl gemerkt (ein anderes Gerät hat seine eigene) | ✅ (2026-10-25, Claude in der Demo) |
| 99.7 | Oben „Woche“, dann „Monat“, dann „Jahr“, mit ‹ zurück | Die Linien gehen über die Woche (Tag für Tag auf und ab), den Monat und das Jahr | ✅ (2026-10-25, Claude in der Demo) |
| 99.8 | Oben „⚖ Vergleichen“ | Unter den Karten der Häuser auch hier „🔋 Ladestand“ mit beiden Batterien | ✅ (2026-10-25, Claude in der Demo) |
| 99.9 | Im Add-on: ⚡ Energie mit deiner echten Batterie (Strom-Editor → ⚡ Rechnung → Batterie → Ladestand, oder eine Batterie im Plan) | Die Linie passt zu dem, was Home Assistant im Verlauf des Sensors zeigt | ➖ |
| 99.10 | Im Add-on mit zwei Häusern, jedes mit seiner Batterie: „Alle Häuser“ | Beide Batterien, jede in der Farbe ihres Hauses | ➖ |

## 100. Neu in 4.21.1: iPhone, kein leerer Streifen unter der Reiter-Leiste (#517)
Der Besitzer (Bildschirmfoto aus der Home-Assistant-App): „ganz unten da ein bisschen Abstand … dieses ganze Zeug ein bisschen weiter nach unten verschieben“. Nur auf dem iPhone (oder iPad) prüfbar.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 100.1 | Im Add-on in der Home-Assistant-App am iPhone, unten „🏠 Haus“ | Unter „Haus, Heute, Energie …“ kein leerer Streifen mehr in der Farbe der Leiste; darunter nur noch der dunkle Streifen von Home Assistant mit dem Home-Strich. Die Knöpfe (Ansicht, Normal, Temp.), die Uhrzeit mit dem Wetter und die Raum-Fenster sitzen etwas tiefer, das Haus ist größer | ➖ |
| 100.2 | Im Add-on in der Home-Assistant-App am iPhone, einen anderen Reiter (z. B. „☀ Heute“) öffnen und bis ganz nach unten wischen | Die Seite geht bis an die Leiste, nichts ist abgeschnitten, die Leiste sitzt wie bei 100.1 | ➖ |
| 100.3 | Die Demo am iPhone in Safari öffnen (ohne Home Assistant), unten „Haus“ | Die Leiste hält wie bisher Platz für den Home-Strich frei: der Strich liegt unter den Namen, nicht auf ihnen | ❓ (Claude 2026-11-06: nur am echten iPhone in Safari) |

## 101. Neu in 4.21.2: Funde aus dem Nacht-Test (#519 bis #525)
In der Nacht zum 2026-10-25 hat Claude die offenen Punkte der Demo durchgetestet (Chromium als PC, Tablet und Handy) und einige im Test-Add-on (Add-on mit nachgebautem Home Assistant). Was dabei nicht ging, ist hier repariert; Claude hat es danach noch einmal geprüft.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 101.1 | Am Tablet oder Handy: Demo, unten „⚡ Energie“, „Woche“, mit dem Finger auf einen Balken tippen; dann oben „⚖ Vergleichen“ und wieder auf einen Balken; dann daneben tippen (#519) | Ein Kästchen mit Tag und kWh (beim Vergleichen beide Häuser untereinander), die Spalte wird hell; ein Tipp daneben schließt es | ✅ (2026-11-06, Claude mit nachgemachtem Finger (2026-10-25) und im Browser-Test 32_today_energy: beim Vergleichen beide Häuser mit kWh im Kästchen) |
| 101.2 | Demo, „🌡 Klima“ (#520) | Beim Büro (23,0°, Soll 21) unter dem Kreis ein oranger Chip „🌡 zu warm“; bei „Nur mit Hinweis“ sieht man jetzt, warum das Büro dabei ist | ✅ (2026-10-25, Claude in der Demo) |
| 101.3 | Demo, oben „📋 Geräte“ → „💡 An / offen“ (#521) | Fernseher und Lautsprecher Wohnzimmer „▶ läuft“, nirgends „playing“ | ✅ (2026-10-25, Claude in der Demo) |
| 101.4 | Demo, 🔍 „Ist oben noch Licht an?“, Enter (#522) | Die Raum-Schilder werden blass, der blaue Ring an der Lampe im Kinderzimmer ist zu sehen; nach ein paar Sekunden sind die Schilder wieder normal | ✅ (2026-10-25, Claude in der Demo) |
| 101.5 | Demo, ⚙ → 🎤 Sprachsuche → „Nur das Diktat der Tastatur“, schließen, 🎤 → „🩺 Mikrofon-Test öffnen“ (#523) | Der Mikrofon-Test steht ganz unter der Kopfzeile (Überschrift „🩺 Mikrofon-Test“ zu sehen); weiter unten der Link „Sprachassistenten in Home Assistant öffnen ↗“ hellblau statt dunkelblau. Danach wieder „Automatisch“ wählen | ✅ (2026-10-25, Claude in der Demo, PC und Handy) |
| 101.6 | Demo, „Live“, den Lautsprecher im Wohnzimmer antippen, den Lautstärke-Schieber ziehen (#524) | Die Zahl daneben läuft beim Ziehen mit | ✅ (2026-10-25, Claude in der Demo) |
| 101.7 | Demo, Bearbeiten → Strom-Editor → ⚡ Rechnung → „⤵ Aus dem Energie-Dashboard übernehmen“ (#525) | Auch die fünf Strom-Zähler mit Namen und Stand („Netz Bezug gesamt 18342.7 kWh“ …), nicht nur Gas und Wasser | ✅ (2026-10-25, Claude in der Demo) |

## 102. Neu in 4.21.3: Tablet schneller, Komma, Demo nachts (#138, #527, #528)
Vom Besitzer am 2026-10-25 gewählt („Tablet schneller“, „Komma statt Punkt“, „Demo-Uhrzeiten“), über Nacht gebaut.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 102.1 | Auf dem Tablet oder iPad das Musterhaus („alles drin“) öffnen, „Live“, „Ganzes Haus“, drehen und zoomen (#138) | Es läuft flüssiger als vorher; alle Möbel sehen aus wie immer (Farben, Formen, nichts fehlt, nichts schwebt) | ❓ (Claude 2026-11-06: nur am echten Tablet zu beurteilen) |
| 102.2 | Wie 102.1, dann unten „Ansicht“ → „⏱ Leistung“ auf „alle Werte“ (#138) | Bei „Zeichenaufrufe“ stehen im ganzen Haus etwa 1.200 (vorher etwa 1.660) | ✅ (2026-10-25, Claude im Test-Add-on: 1.177 statt 1.661 Zeichenaufrufe, gleich viele Dreiecke, das Bild Punkt für Punkt gleich) |
| 102.3 | Danach „Bearbeiten“, ein Sofa oder einen Schrank anklicken und verschieben, wieder „Live“ (#138) | Das ganze Möbelstück wandert mit, nichts bleibt am alten Platz stehen; in „Live“ steht es am neuen Platz | ✅ (2026-10-26, Claude in der Demo als Tablet: Sofa verschoben, in „Live“ am neuen Platz, die übrigen Möbel weiter gebündelt) |
| 102.4 | Demo, „Live“, unten „Strom“ drücken; oben links die Zähler ansehen (#527) | Zahlen mit Komma: „3,20 kW“ (am Tag), „🚰 1234,6 m³“; die Schilder über den Geräten „🌡 21,4 °C“ | ✅ (2026-10-26, Claude in der Demo: „1,20 kW“, „🚰 1234,6 m³“, Schilder „🌡 21,2 °C“) |
| 102.5 | Demo nachts öffnen (z. B. nach 22 Uhr), unten „👨‍👩‍👧 Familie“ und „☀ Heute“ (#528) | Keine Uhrzeit aus der Zukunft: „seit 11:02“ und der Zettel „Bin um 6 da“ sind von gestern; im Strom-Bild liefert die Sonne nachts 0 W, die Batterie entlädt | ✅ (2026-10-26, Claude in der Demo um 2 Uhr nachts: „seit gestern 11:02“, Sonne 0 W, die Batterie entlädt) |
| 102.6 | Demo, „⚡ Energie“, Karte „🔋 Ladestand“, „Tag“ (am 25.10. oder einem anderen Tag der Zeitumstellung) (#528) | Die Linie läuft ohne Sprung durch die Nacht | ✅ (2026-10-26, Claude in der Demo am 25.10.: die Linie läuft ohne Sprung) |

## 103. Neu in 4.22.0: 🔔 Klingel (Kamera auf jedem Tablet, #530)
Vom Besitzer am 2026-10-25 gewählt (Bild `docs/ideen-4.3/6-klingel.jpg`), über Nacht gebaut. In der Demo klingelt es mit `?klingel=1` (https://burned4aim.github.io/HA-Floorplanner/?klingel=1).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 103.1 | Demo mit `?klingel=1` öffnen, 8 Sekunden warten | Die Demo geht in „Live“; ein Fenster „🔔 Es klingelt: Haustür“ mit roter Kopfzeile und Uhrzeit, darunter das Kamerabild, unten „🔓 Tür öffnen“ und „✕ Schließen“ | ✅ (2026-10-26, Claude in der Demo) |
| 103.2 | Im Fenster „🔓 Tür öffnen“ einmal tippen, dann noch einmal | Erst „Sicher? Öffnen“ (orange), erst der zweite Tipp öffnet: „✓ Tür geöffnet“ (grün) | ✅ (2026-10-26, Claude in der Demo) |
| 103.3 | „✕ Schließen“ | Das Fenster geht zu | ✅ (2026-10-26, Claude in der Demo) |
| 103.4 | ⚙ → 📱 Wandtablet → 🔔 Klingel ansehen, „🔔 Ausprobieren“ | Haken „Beim Klingeln das Kamerabild zeigen“ und „Gong spielen“, eine Zeile Haustür mit Kamera und Türöffner; „Ausprobieren“ zeigt das Fenster (mit Gong) | ✅ (2026-10-26, Claude in der Demo) |
| 103.5 | Im Add-on mit deiner echten Klingel: am Wandtablet in „Live“ klingeln lassen | Das Fenster mit dem Kamerabild der Tür erscheint sofort, das Tablet wacht auf, ein Gong (wenn das Tablet vorher einmal berührt wurde) | ➖ nur im Add-on |
| 103.6 | Im Add-on: ⚙ → 📱 Wandtablet → 🔔 Klingel | Unter „Selbst gefunden“ steht deine Klingel mit ihrer Kamera; sonst mit „+ Klingel“ selbst wählen (Kamera, Türöffner, Name) | ➖ nur im Add-on |
| 103.7 | Im Add-on: ⚙ → 👥 Benutzer & Tablets → bei einem Tablet 🔒 „Klingel-Fenster“ abhaken | Auf diesem Tablet erscheint beim Klingeln nichts, auf den anderen schon | ➖ nur im Add-on |

## 104. Neu in 4.23.0: 🔔 Sag mir Bescheid (#531)
Vom Besitzer am 2026-10-25 gewählt (Bild `docs/ideen-4.3/8-haushalt.jpg`), über Nacht gebaut.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 104.1 | Demo, unten „🧺 Haushalt“ | Bei der Waschmaschine (läuft) der Knopf „🔔 Sag mir Bescheid“; beim Trockner und der Spülmaschine keiner | ✅ (2026-10-26, Claude in der Demo) |
| 104.2 | „🔔 Sag mir Bescheid“ tippen, dann noch einmal | Erst „✓ Ich sage Bescheid“ (blau umrandet), dann wieder „🔔 Sag mir Bescheid“ (in der Demo wird nichts gesendet) | ✅ (2026-10-26, Claude in der Demo) |
| 104.3 | Im Add-on: ⚙ → Warnungen & Alarm muss eine Nachricht eingerichtet sein (WhatsApp, Telegram oder Handy-App). Waschmaschine starten, „🔔 Sag mir Bescheid“ tippen | Wenn sie fertig ist, kommt **eine** Nachricht „🧺 Die Waschmaschine ist fertig.“ aufs Handy (spätestens eine Minute danach), auch wenn kein Bildschirm offen ist | ➖ nur im Add-on |
| 104.4 | Im Add-on: ⚙ → 🗂 Reiter unten → Haushalt: „🔔 Immer Bescheid sagen …“ abhaken | Bei jeder Maschine, die fertig wird, kommt eine Nachricht, auch ohne Tipp | ➖ nur im Add-on |
| 104.5 | Im Add-on ohne eingerichtete Nachricht „🔔 Sag mir Bescheid“ tippen | Die Karte sagt, dass zuerst in ⚙ → Warnungen & Alarm eingerichtet werden muss, wohin die Nachricht geht | ➖ nur im Add-on |

## 105. Neu in 4.24.0: 🗣 Schalten per Sprache (#532)
Vom Besitzer am 2026-10-25 gewählt, über Nacht gebaut. Geht in der Demo auch getippt: 🔍, den Satz eintippen, Enter.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 105.1 | Demo, „Live“, 🔍 „Licht im Wohnzimmer aus“ und Enter | Die Lichter im Wohnzimmer gehen aus; oben steht „✓ 💡 Lichter aus: …“ mit dem Raum, die Lampen haben einen Ring | ✅ (2026-10-26, Claude in der Demo: „✓ 💡 Lichter aus: 4 (Wohnzimmer)“) |
| 105.2 | 🔍 „Licht im Wohnzimmer an“ | Die Lichter gehen wieder an | ✅ (2026-10-26, Claude in der Demo) |
| 105.3 | 🔍 „Ist das Licht im Wohnzimmer an?“ | Nur eine Antwort (Liste), nichts wird geschaltet | ✅ (2026-10-26, Claude in der Demo) |
| 105.4 | 🔍 „Alle Lichter aus“ | Erst die Frage „Lichter im ganzen Haus aus? (n)“ mit „✓ Ja, aus“; erst der Tipp darauf schaltet alles aus | ✅ (2026-10-26, Claude in der Demo: „Lichter im ganzen Haus aus? (8)“) |
| 105.5 | 🔍 „Rollläden in der Küche runter“ | Der Rollladen am Küchenfenster fährt herunter (das Garagentor nie) | ✅ (2026-10-26, Claude in der Demo; der Küchen-Rollladen ist in der Demo schon zu: erst „hoch“, dann „runter“; das Garagentor bleibt zu) |
| 105.6 | Mit echter Sprache (🎤): „Mach das Licht im Bad an“ | Das Licht im Bad geht an | ❓ (Claude 2026-11-06: nur mit echter Sprache (getippt geht es, Browser-Test 46)) |
| 105.7 | Im Add-on: als ein Benutzer mit 🔒 „Steuern“ „Licht im Bad an“ sagen | Die Antwort sagt, dass Schalten gesperrt ist, nichts geht an | ➖ nur im Add-on |

## 106. Neu in 4.25.0: 🚗 Auto und 🌱 Garten auf 🧺 Haushalt (#533)
Vom Besitzer am 2026-10-25 gewählt (Bild `docs/ideen-4.3/8-haushalt.jpg`), über Nacht gebaut.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 106.1 | Demo, unten „🧺 Haushalt“ | Eine Karte „🚗 Auto“: groß „64 %“, ein grüner Balken, „lädt mit 3,2 kW · voll um …“ und „312 km Reichweite“ | ✅ (2026-10-26, Claude in der Demo) |
| 106.2 | „☀ Nur mit Sonne laden“ tippen, dann noch einmal | Der Knopf wird gelb (an), beim zweiten Tipp wieder normal | ✅ (2026-10-26, Claude in der Demo) |
| 106.3 | Die Karte „🌱 Garten“ ansehen | „Regen morgen: … mm“, „Boden 34 %“, rechts „Bewässerung aus“; zwei Knöpfe „💧 Rasen · 10 min gießen“ und „💧 Bewässerung Beet · 10 min gießen“ | ✅ (2026-10-26, Claude in der Demo) |
| 106.4 | „💧 Rasen · 10 min gießen“ tippen | Rechts „gießt noch 10 min“, der Knopf heißt jetzt „■ Rasen Stopp“; ein Tipp darauf stoppt es | ✅ (2026-10-26, Claude in der Demo) |
| 106.5 | Im Add-on mit deinem Auto (z. B. evcc): Haushalt öffnen | Die Auto-Karte zeigt deinen Ladestand und die Reichweite; sonst in ⚙ → 🗂 Reiter unten → 🚗 Auto die Sensoren wählen | ➖ nur im Add-on |
| 106.6 | Im Add-on mit deiner Bewässerung: „💧 10 min gießen“, dann 10 Minuten warten | Das Ventil geht auf und nach 10 Minuten von selbst wieder zu | ➖ nur im Add-on |

## 107. Neu in 4.26.0: 🏡 Grundstück, Außenflächen, Maße und Garten-Deko (#538)
Wunsch des Besitzers vom 2026-10-26 („draußen Hof und sowas editieren, das Grundstück bemessen, Deko ums Haus, nicht so krampfig“).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 107.1 | Demo, „Bearbeiten“, Erdgeschoss, Werkzeug „Grundstück“ | Der 2D-Plan zeigt das ganze Grundstück; rechts „Fläche“ ist gewählt, darunter die Beläge (Rasen, Pflaster …), „Ecken klicken / Rechteck“, die Größe des Grundstücks und die Liste der Flächen (Einfahrt, Hof, Beet, Teich, Kiesweg) | ✅ (2026-10-26, Claude in der Demo) |
| 107.2 | „Holzterrasse“ und „▭ Rechteck“ wählen, im Plan zwei Ecken klicken | Beim Bewegen stehen die Maße (z. B. „4.00 m × 3.00 m“) dran; nach dem zweiten Klick liegt eine Holzterrasse da, im 3D-Bild mit Holzdielen | ✅ (2026-10-26, Claude in der Demo) |
| 107.3 | Rechts im Seitenfeld der neuen Fläche einen Namen eintippen und „Seite 1“ ändern | Der Name steht im Plan auf der Fläche; die Seite wird so lang wie getippt, es bleibt ein Rechteck | ✅ (2026-10-26, Claude in der Demo) |
| 107.4 | Werkzeug „Auswählen“, in die Fläche tippen und ziehen; eine Ecke ziehen; Doppelklick auf eine Seite | Die Fläche wandert mit; die Ecke bewegt sich; der Doppelklick macht eine neue Ecke (Doppelklick darauf nimmt sie wieder weg) | ✅ (2026-10-26, Claude in der Demo) |
| 107.5 | Auf den Rand des Grundstücks tippen | Das Grundstück ist orange umrandet, an jeder Seite steht ihre Länge; rechts Fläche, Umfang, Breite und Tiefe zum Eintippen | ✅ (2026-10-26, Claude in der Demo) |
| 107.6 | Werkzeug „Grundstück“: „▭ Rechteck ums Haus“ mit Abstand 5 | Das Grundstück liegt 5 m rings ums Haus; der Rasen im 3D-Bild hat diese Form | ✅ (2026-10-26, Claude in der Demo) |
| 107.7 | „Gerät“, Gruppe „Außen“ | Viele Gartendinge mit Bild: Gartenzwerg, Trampolin, Gartenhaus, Hochbeet, Sonnenschirm, Grill … ; eins in den Garten setzen | ✅ (2026-10-26, Claude in der Demo) |
| 107.8 | Live, „Ganzes Haus“, um das Haus drehen | Einfahrt, Hof, Beet, Teich und Kiesweg liegen mit ihrem Muster auf dem Rasen, dazu Trampolin, Gartenhaus, Gartenzwerg & Co. | ✅ (2026-10-26, Claude in der Demo) |

## 108. Neu in 4.26.1: die 2D-Ansicht zeichnet kein verstecktes 3D-Bild mehr (#542)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 108.1 | „Bearbeiten“, oben „2D“; Werkzeug „Auswählen“, auf den Rand des Grundstücks tippen | Das Grundstück ist umrandet, an jeder Seite steht sofort ihre Länge | ✅ (2026-10-26, Claude im Test-Add-on) |
| 108.2 | Danach oben „3D“ (oder „2D + 3D“) | Das 3D-Bild ist sofort da und zeigt den aktuellen Stand | ✅ (2026-10-26, Claude im Test-Add-on) |
| 108.3 | Am Tablet in der 2D-Ansicht arbeiten (nur wenn du sie benutzt) | Es reagiert so flüssig wie die 3D-Ansicht oder besser | ❓ (Claude 2026-11-06: nur am echten Tablet zu beurteilen) |

## 109. Neu in 4.27.0: 🗄 Schrank-Editor, Schrank nach Maß, auch unter der Dachschräge (#545)
Wunsch des Besitzers vom 2026-10-26 („einen Schrank-Editor … auch mit Schrägen, dass man den in Dachschrägen einbauen kann … mit allem personalisierbar … im Nachhinein bearbeiten“).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 109.1 | Demo, „Bearbeiten“, „Gerät“, ins Suchfeld „Schrank“; „Schrank nach Maß“ antippen und im Plan in einen Raum tippen | Der Schrank steht da, und der Schrank-Editor geht sofort auf: vorne der Schrank mit Kleiderstangen, Böden und Schubladen, daneben der Schnitt von der Seite, dazu die Einstellungen | ✅ (2026-10-26, Claude in der Demo) |
| 109.2 | Im Editor auf das mittlere Fach tippen, „Innen“ auf „Nur Schubladen“ | Das Fach ist blau umrandet, „Fach 2 von 3“; vorne sind dort jetzt Schubladen statt einer Tür | ✅ (2026-10-26, Claude in der Demo) |
| 109.3 | „Breite“ auf 210 ändern, dann „+ Fach“ | Alle Fächer werden zusammen breiter (je 70 cm); ein neues Fach kommt dazu | ✅ (2026-10-26, Claude in der Demo) |
| 109.4 | Bei „Fronten“ „Eiche“ antippen, bei „Korpus“ „Anthrazit“, dann „🚪 Türen“ | Die Zeichnung zeigt die Türen in Eiche und den Korpus in Anthrazit; bei „Front: Glastür“ sieht man durch die Tür | ✅ (2026-10-26, Claude in der Demo) |
| 109.5 | „🧊 3D“ antippen und mit dem Finger drehen | Der Schrank steht in 3D da und dreht sich | ✅ (2026-10-26, Claude in der Demo) |
| 109.6 | „Übernehmen“, dann oben ↶ (Rückgängig) | Der Schrank im Haus sieht aus wie im Editor; ↶ holt den alten zurück | ✅ (2026-10-26, Claude in der Demo) |
| 109.7 | Etage „Dach“, im Dachboden den „Schrank unter der Schräge“ antippen | Rechts ein Bild des Schranks, „✎ Schrank bearbeiten“ und „📐 An die Dachschräge anpassen“; im 3D-Bild ist er hinten niedriger, passt unter das Dach und hat innen Licht | ✅ (2026-10-26, Claude in der Demo) |
| 109.8 | Einen neuen Schrank auf die Etage „Dach“ setzen, nah an die Dachkante; im Editor „📐 An die Dachschräge anpassen“ | Darunter steht z. B. „An die Dachschräge angepasst: hinten 101 cm · 35°, Höhe 143 cm“; Zeichnung und 3D zeigen die Schräge | ✅ (2026-10-26, Claude in der Demo) |
| 109.9 | Vorlage „Dachschrägenschrank“ wählen, bei „Dachschräge“ die Höhe und die Neigung ändern | Der Schrank wird links niedriger, Türen und Böden werden schräg abgeschnitten | ✅ (2026-10-26, Claude in der Demo) |
| 109.10 | Im 2D-Plan den Schrank auswählen und am weißen Quadrat an der Seite ziehen | Der Schrank wird breiter oder schmaler (alle Fächer zusammen); im Plan sieht man die Fächer und in Orange, wo er unter der Schräge niedriger ist | ✅ (2026-10-26, Claude in der Demo) |
| 109.11 | Nur im Add-on, in deinem Haus: einen Schrank unter eure echte Dachschräge stellen (Dach-Etage oder ausgebautes Dach mit Kniestock), „📐 An die Dachschräge anpassen“ | Er passt unter die Schräge, nichts ragt durchs Dach | ✅ (2026-11-06, Claude in der Demo: der Schrank unter der Schräge des Dachgeschosses (Kniestock 1 m, 35°), Video „Schrank nach Maß“; im Browser-Test 49_closet; dein Dach nicht) |

## 110. Neu in 4.28.0: Heiz-Regeln, Heizplan, „Wird benutzt“ und eigene Abläufe „Wenn … dann …“ (#546)
In der Demo ist die Fenster-Regel an: Das Fenster im Wohnzimmer ist offen, darum ist seine Heizung pausiert. Bilder vorher: `docs/ideen-4.28/`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 110.1 | Unten „Klima“, oben „📋 Heiz-Regeln“ | Sieben Karten (Fenster offen → Heizung aus, Keiner zu Hause, Nachtabsenkung, Heizplan, Sommerpause, Boost-Knopf, Urlaub) und „＋ Eigene Regel“; oben „Wohnzimmer: Heizung pausiert …“ mit „🔥 Trotzdem heizen“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.2 | Bei „Fenster offen → Heizung aus“ die Minuten mit − / + ändern; eine Regel mit dem Schalter an- oder ausmachen | Die Zahl ändert sich, kurz „✓ gespeichert“; die Karte wird hell oder blass | ✅ (2026-10-26, Claude im Test-Add-on) |
| 110.3 | Oben „Räume“: die Karte „Wohnzimmer“ | Darunter die Zeile „⏸️ Heizung pausiert · Fenster offen seit … Min · danach wieder 22°“, dazu „🔥 Trotzdem heizen“, „🚀 Boost“ und „🔎 Wird benutzt“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.4 | „🔥 Trotzdem heizen“ antippen, danach „🚀 Boost“ und noch einmal „Boost aus“ | Die Heizung heizt trotz offenem Fenster; Boost: „Boost bis …“, noch einmal: wieder wie vorher | ✅ (2026-10-26, Claude im Test-Add-on) |
| 110.5 | „🔎 Wird benutzt“ an der Wohnzimmer-Karte | „Im Dashboard“: Fenster offen (läuft gerade), Heizplan, Nachtabsenkung; „In Home Assistant“: „Heizung morgens hoch“ mit „06:00 → Heizung Wohnzimmer 22°“, Schalter, „zuletzt …“, dazu oben die Warnung „Zwei Regeln stellen die Temperatur …“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.6 | Oben „📅 Heizplan“, Raum „Wohnzimmer“: einen Block antippen, noch einmal antippen; den linken Rand eines Blocks ziehen | Der Block ist weiß umrandet, darunter seine Zeit und die Stufen; beim zweiten Tipp eine andere Stufe; der Rand wandert mit dem Finger; „✓ Speichern“ wird blau | ✅ (2026-10-28, Claude in der Demo) |
| 110.7 | Im Heizplan einen Raum ohne Plan wählen, „＋ Plan anlegen“, „✓ Speichern“ | Eine Woche mit Blöcken erscheint und bleibt nach dem Speichern | ✅ (2026-10-26, Claude im Test-Add-on) |
| 110.8 | Unten „Haus“ (Live) | Das Schild über dem Wohnzimmer zeigt „⏸️ pausiert“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.9 | Unten „Abläufe“ | „🏠 Eigene Abläufe“: Flurlicht nachts, Rollläden am Abend, Kinoabend als Kette; „⚙️ Automationen in Home Assistant“ mit „benutzt: …“ und „läuft gerade“; „📜 Was ist passiert“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.10 | Bei „Flurlicht nachts“ auf ✏️ tippen | Der Editor: links die Bausteine, in der Mitte die Kette mit Linien und grünen Häkchen, rechts die Einstellungen des gewählten Bausteins, unten „In Worten“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.11 | „＋ Neuer Ablauf“: links „Knopf im Dashboard“, dann „Schalten, dimmen“, rechts eine Lampe ankreuzen, oben einen Namen, „✓ Speichern“, „‹ Abläufe“ | Ohne Lampe ist „Speichern“ grau; danach steht der Ablauf in der Liste mit ▶ | ✅ (2026-10-26, Claude im Test-Add-on) |
| 110.12 | „📋 Aus Vorlage“ | Sechs fertige Abläufe (Fenster offen → Heizung aus, Licht bei Bewegung, Rollläden …); einer öffnet sich im Editor | ✅ (2026-10-28, Claude in der Demo) |
| 110.13 | Am Handy oder Tablet: den Editor öffnen | Die Bausteine stehen oben in einer Reihe zum Wischen, darunter die Kette, darunter die Einstellungen | ✅ (2026-10-28, Claude in der Demo) |
| 110.14 | Nur im Add-on: die Fenster-Regel an, ein echtes Fenster öffnen und warten | Nach den eingestellten Minuten geht die Heizung des Raums aus, beim Schließen wieder an, auch wenn kein Bildschirm offen ist | ➖ (im Test-Add-on ✅ 2026-10-26, Claude) |
| 110.15 | Nur im Add-on: „🔎 Wird benutzt“ an einem echten Thermostat | Deine Automationen, die es benutzen, mit „läuft gerade“ und „zuletzt …“ | ➖ |

## 111. Neu in 4.29.0: Abläufe werden echte Automationen in Home Assistant (#548)
Wunsch des Besitzers vom 2026-10-26 („der Editor soll in unserer App sein … aber es soll dann auch eine echte Home Assistant Automatisierung … daraus werden … nicht, dass wir dann irgendwas kaputt machen“). In der Demo spielt die Seite Home Assistant nur nach.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 111.1 | Unten „Abläufe“ | „Flurlicht nachts“ und „Kinoabend“ zeigen „🏠 Home Assistant“ und ↗, „Rollläden am Abend“ zeigt „⚙️ Add-on“; bei „Automationen in Home Assistant“ stehen die beiden nicht noch einmal | ✅ (2026-10-26, Claude in der Demo) |
| 111.2 | Bei „Flurlicht nachts“ auf ✏️, oben „⚙️ Add-on“ und wieder „🏠 Home Assistant“ antippen, „✓ Speichern“ | Darunter steht „🏠 In Home Assistant gespeichert“ mit „↗ In Home Assistant öffnen“; unten „Läuft als echte Automation in Home Assistant …“ | ✅ (2026-10-26, Claude in der Demo) |
| 111.3 | „＋ Neuer Ablauf“ | Oben ist „🏠 Home Assistant“ schon gewählt | ✅ (2026-10-26, Claude in der Demo) |
| 111.4 | Einen Ablauf auf „⚙️ Add-on“ stellen und speichern, „‹ Abläufe“ | In der Liste steht bei ihm „⚙️ Add-on“ | ✅ (2026-10-26, Claude in der Demo) |
| 111.5 | Nur im Add-on: einen Ablauf mit „🏠 Home Assistant“ speichern, dann in Home Assistant unter Einstellungen → Automationen schauen | Dort steht er mit demselben Namen und „Erstellt mit 3D Floorplan …“; er tut, was im Editor steht | ➖ |
| 111.6 | Nur im Add-on: die Automation in Home Assistant ein wenig ändern und speichern, dann im Dashboard den Ablauf ändern und speichern | Das Dashboard fragt „⚠️ … in Home Assistant geändert. Überschreiben?“; „Nicht überschreiben“ lässt sie, „Überschreiben“ schreibt sie | ➖ |
| 111.7 | Nur im Add-on: einen Ablauf mit „Knopf im Dashboard“ in Home Assistant speichern, dann ▶ | Die Automation läuft (in Home Assistant „zuletzt ausgelöst“: gerade eben) | ➖ |
| 111.8 | Nur im Add-on: den Ablauf löschen | Seine Automation ist in Home Assistant weg, deine anderen Automationen sind alle noch da | ➖ |

## 112. Neu in 4.30.0: 🎨 Szenen für Lampen und LED-Streifen als echte Szenen in Home Assistant (#549)
Wunsch des Besitzers vom 2026-10-26 („dass auch die Szenen von LED-Streifen und LEDs auch verwaltbar sind über unsere App, aber dann wirkliche … Szenen in Home Assistant“). In der Demo spielt die Seite Home Assistant nur nach.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 112.1 | Unten „Abläufe“, die Karte „🎨 Szenen“ | „TV-Abend“ mit „🎨 Dashboard“ und ✏️, die anderen Szenen mit ▶; „Wohnzimmer Gemütlich“ mit 📋 | ✅ (2026-10-26, Claude in der Demo) |
| 112.2 | Bei „TV-Abend“ ✏️ | Der Szenen-Editor: TV Hintergrundlicht (an, 35 %, lila, Effekt „Kino“), Deckenlicht aus, Stehlampe warm; rechts die Geräte zum Dazunehmen | ✅ (2026-10-26, Claude in der Demo) |
| 112.3 | Beim TV-Licht ein grünes Farbfeld antippen, „▶ Ausprobieren“, dann „✓ Speichern“ | Oben „🏠 In Home Assistant gespeichert“; im Haus leuchtet das TV-Licht grün | ✅ (2026-10-26, Claude in der Demo) |
| 112.4 | „‹ Abläufe“, bei „Wohnzimmer Gemütlich“ 📋 | Der Editor heißt „Wohnzimmer Gemütlich (Kopie)“ mit dem Hinweis, dass die alte bleibt | ✅ (2026-10-26, Claude in der Demo) |
| 112.5 | „＋ Neue Szene“, rechts eine Lampe antippen, „📸 Wie jetzt übernehmen“, Namen geben, speichern | Die neue Szene steht nach ein paar Sekunden in der Karte, mit ✏️ und ▶ | ✅ (2026-10-26, Claude in der Demo) |
| 112.6 | Nur im Add-on: eine Szene mit deinen LED-Streifen bauen und speichern, dann in Home Assistant unter Einstellungen → Szenen schauen | Dort steht sie mit demselben Namen; „Aktivieren“ in Home Assistant stellt die Lichter so ein wie im Editor | ➖ |
| 112.7 | Nur im Add-on: bei einem WLED- oder Nanoleaf-Licht einen Effekt wählen, „▶ Ausprobieren“ | Das Licht spielt den Effekt sofort, ohne dass die Szene gespeichert ist | ➖ |
| 112.8 | Nur im Add-on: eine Szene, die du in Home Assistant gebaut hast, mit 📋 öffnen und speichern | Es gibt eine neue Szene „… (Kopie)“, deine alte ist unverändert | ➖ |

## 113. Neu in 4.31.0: 🚆 Zug-Karte: Kommt mein Zug pünktlich? (#550)
Wunsch des Besitzers vom 2026-10-26 („dass man sich so seine Verbindung reinmacht, um zu schauen, ob morgens der Zug richtig kommt oder nicht … als Karte dazu“). In der Demo sind die Züge erfunden (ab dem Öffnen der Demo).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 113.1 | Unten „Heute“, die Karte „Mein Zug zur Arbeit“ | Oben „Dein Zug RE 50 → Frankfurt (Main) Hbf“ mit der geplanten Zeit durchgestrichen, der neuen groß in Gelb, „+4 Min“, „Gleis 4 statt 3“, „in … Min“ und dem Hinweis der Bahn | ✅ (2026-10-26, Claude in der Demo) |
| 113.2 | Dieselbe Karte, unten | Die nächsten Züge mit Zeit, Zug, Ziel und Gleis; der ICE „fällt aus“ und ist durchgestrichen, „+8“ in Rot | ✅ (2026-10-26, Claude in der Demo) |
| 113.3 | „✎“, „＋ Karte“, „🚆 Zug“ | Felder Bahnhof, Richtung, Mein Zug, wie viele Abfahrten; „Hinzufügen“ geht erst mit einem Bahnhof | ✅ (2026-10-26, Claude im Test-Add-on) |
| 113.4 | Nur im Add-on: eine Zug-Karte mit deinem Bahnhof und deiner Richtung (z. B. „Frankfurt (Main) Hbf“) und deinem Zug | Die echten Abfahrten der Bahn erscheinen, dein Zug steht oben | ➖ |
| 113.5 | Nur im Add-on: an einem Morgen mit Verspätung draufschauen | „+… Min“ in Gelb oder Rot, wie in der DB-App | ➖ |
| 113.6 | Nur im Add-on: einen falsch geschriebenen Bahnhof eintragen | Die Karte sagt, dass die Bahn den Bahnhof so nicht kennt | ➖ |

## 114. Neu in 4.31.1: 🚆 Zug-Karte zeigt deinen Zug auch morgen (#550)
Wunsch des Besitzers vom 2026-10-26 („mache es so, dass ich auch immer den auch morgen sehe“): Die Bahn zeigt nur die nächsten 3 Stunden; abends stand darum „Dein Zug um 06:05 ist nicht unter den nächsten Abfahrten“.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 114.1 | Test-Add-on: eine Zug-Karte, deren Zug in 5 Stunden fährt | Oben „Dein Zug“ mit der Zeit groß, „heute“ oder „morgen“, „in 5 Std …“ und „Ob er pünktlich ist, zeigt die Bahn ab etwa …“; darunter die nächsten Züge | ✅ (2026-10-26, Claude im Test-Add-on) |
| 114.2 | Nur im Add-on, am Abend: deine Karte „Oftersheim“ → „Mannheim Hbf“ mit deinem Zug (z. B. 06:05) | Statt „ist nicht unter den nächsten Abfahrten“ steht „06:05“, „morgen“, „in … Std … Min“ | ➖ |
| 114.3 | Nur im Add-on, am Morgen ab etwa 3 Stunden vor deinem Zug | Dein Zug mit Zug, Ziel, Gleis und „pünktlich“ oder „+… Min“ wie bisher | ➖ |
| 114.4 | Nur im Add-on, am Abend danach | Oben zusätzlich dein Zug (z. B. „S S9 → Mannheim Hbf“) und sein Gleis, wie die Bahn sie am Morgen gemeldet hat | ➖ |

## 115. Neu in 4.32.0: 📅 Heizplan: von Hand gedreht, nach 10 Minuten zurück (#546)
Wunsch des Besitzers vom 2026-10-26 („gerne wenn man von Hand dreht nach 10 min wieder zurück, aber das kann eingestellt werden“).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 115.1 | Test-Add-on: ein Raum mit Heizplan, das Thermostat von Hand 3° wärmer drehen | Am Raum im 🌡 Klima „✋ Von Hand gedreht · ab … wieder …“ (10 Minuten später) | ✅ (2026-10-26, Claude im Test-Add-on) |
| 115.2 | 🌡 Klima → 📋 Heiz-Regeln, Karte „Heizplan“ | „Von Hand gedreht: zurück nach 10 Min“, mit − / + änderbar; ganz unten „erst beim nächsten Abschnitt“ | ✅ (2026-10-26, Claude im Test-Add-on) |
| 115.3 | Nur im Add-on: dein Thermostat (z. B. WZFL) bei eingeschaltetem Heizplan von Hand drehen, 10 Minuten warten | Danach steht wieder die Temperatur des Heizplans (z. B. „Nacht 17°“) | ➖ |
| 115.4 | Nur im Add-on: das Thermostat von Hand auf „Aus“ stellen | Es bleibt aus, bis der nächste Abschnitt des Plans beginnt | ➖ |

## 116. Neu in 4.33.0: 🌙 Der Mond im Himmel
Wunsch des Besitzers vom 2026-10-27 („den Mondzyklus reinmachen, dass man sieht, was gerade für ein Mondzyklus ist, ob Vollmond oder Halbmond abnehmend“). Ausprobieren in der Demo: hinten an die Adresse `?skydate=2026-11-01&skytime=05:00` (Halbmond) oder `?skydate=2026-11-12&skytime=17:45` (Sichel am Abend).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 116.1 | Demo, Live, `?skytime=21:30&weather=clear-night` | Links oben (Osten) der fast volle Mond mit grauen Meeren und weichem Schein; oben rechts „🌖 Abnehmender Mond · 96 %“ zwischen Uhrzeit und Wetter | ✅ (2026-10-27, Claude in der Demo) |
| 116.2 | Demo, `?skydate=2026-11-01&skytime=05:00`, dann `?skydate=2026-11-12&skytime=17:45` | Ein Halbmond links beleuchtet hoch am Himmel; am Abend eine schmale Sichel rechts beleuchtet tief im Südwesten | ✅ (2026-10-27, Claude in der Demo) |
| 116.3 | Demo, `?skydate=2026-11-01&skytime=11:00&weather=sunny` | Tagsüber ein blasser Halbmond rechts (Westen), ohne graue dunkle Hälfte | ✅ (2026-10-27, Claude in der Demo) |
| 116.4 | Am Handy, Live, nachts | Unten in der kurzen Zeile der Mond, wie er ist (z. B. 🌖), statt 🌙; der Mond im Himmel | ✅ (2026-10-27, Claude in der Demo) |
| 116.5 | Nur im Add-on, heute Abend | Der Mond steht ungefähr dort, wo du ihn draußen siehst (links Osten, rechts Westen), und die Phase stimmt | ➖ |

## 117. Neu in 4.33.1: Das Haus dreht sich flüssig (#557)
Wunsch des Besitzers vom 2026-10-27 („es erfüllt zwar die 30 fps, aber es fühlt sich trotzdem ruckelig dafür an“). Am besten mit Ansicht → ⏱ Leistung → „alle Werte“: die Zeile „Bild“ zeigt ⌀ (der Durchschnitt) und max (das längste Warten auf ein Bild).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 117.1 | Am PC, Leistung „Automatisch“ oder „Schön“: das Haus mit der Maus langsam einmal ganz herumdrehen | Es dreht sich gleichmäßig, ohne Hänger jede Sekunde; „max“ bei „Bild“ bleibt nah am ⌀ | ✅ (2026-10-27) |
| 117.2 | Wie 117.1, aber schnell drehen und loslassen | Das Haus gleitet weich aus; Wände, die absinken, ruckeln nicht | ✅ (2026-10-27) |
| 117.3 | Am PC ⚙ → „Leistung auf diesem Gerät“: „Schnell (für Tablets)“, das Haus drehen | Beim Drehen mehr als 30 FPS (so viele, wie die Grafik schafft); steht das Bild, wieder 30 und nach 4 s nur noch wenige | ✅ (2026-10-27) |
| 117.4 | Am Tablet oder Handy (Sparmodus von selbst) das Haus mit dem Finger drehen | Flüssiger als vorher, der Finger und das Haus bleiben zusammen | ✅ (2026-10-27) |

## 118. Neu in 4.34.0: Kantenglättung zum Auswählen (#560)
Wunsch des Besitzers vom 2026-10-27 („kannst du das einbauen, so dass ich es anschalten kann jeweils, das wäre praktisch“). Alles in ⚙ → „Kantenglättung auf diesem Gerät“ (bei „Leistung auf diesem Gerät“); dazu Ansicht → ⏱ Leistung → „alle Werte“: die Zeile „Kanten“ sagt, was gerade gilt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 118.1 | ⚙ öffnen, bei „Leistung auf diesem Gerät“ | Darunter „Kantenglättung auf diesem Gerät“ mit „Wie bei „Leistung““, „Immer“, „Glatt, wenn das Bild steht“, „Nachträglich glätten“, „Automatisch“, „Aus“ | ✅ (2026-10-27, Claude in der Demo) |
| 118.2 | „Glatt, wenn das Bild steht“ wählen (die Seite lädt neu), das Haus drehen und loslassen | Beim Drehen flüssig, „Kanten: glatt im Stillstand · jetzt schnell“; steht das Bild, werden die Kanten glatt („jetzt glatt“) | ✅ (2026-10-27, Claude in der Demo) |
| 118.3 | „Nachträglich glätten“ wählen | Die Kanten sind weich, auch beim Drehen; feine Linien etwas weicher | ✅ (2026-10-27, Claude in der Demo) |
| 118.4 | „Automatisch“ wählen und am PC mit der Intel-Grafik das Haus einige Sekunden drehen | „Kanten: automatisch · … · Grafik zu langsam“ oder „Grafik reicht“; ist sie zu langsam, flüssig beim Drehen und glatt im Stillstand | ✅ (2026-10-27, „schnell beim Drehen, danach glatt … läuft flüssig“; der Text „Grafik zu langsam“ klang nach einem Fehler, heißt jetzt „beim Drehen ohne Glättung“, 4.35.0) |
| 118.5 | Am PC jede Art einmal ausprobieren, das Haus drehen | Welche gefällt dir am besten? Die Farben sind bei allen gleich, nur die Kanten unterscheiden sich | ✅ (2026-10-27, am liebsten „Automatisch“) |
| 118.6 | „Wie bei „Leistung““ wählen | Wieder wie vor 4.34.0 („Kanten: immer glatt“, im Sparmodus „nicht geglättet“) | ✅ (2026-10-27, Claude in der Demo) |

## 119. Neu in 4.35.0: Die Einstellungen fast über den ganzen Bildschirm (#562)
Wunsch des Besitzers vom 2026-10-27 („dass diese fast über den ganzen Bildschirm geht, so muss man nicht ewig scrollen … professionelle Einstellung … schön und übersichtlich“), seine Wahl aus den Beispielbildern `docs/ideen-4.35/`: die Seitenleiste.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 119.1 | Am PC ⚙ öffnen | Das Fenster füllt fast den ganzen Bildschirm: links die Liste der Gruppen, rechts eine Gruppe, ihre Einstellungen als Kacheln nebeneinander | ✅ (2026-10-27, Claude in der Demo) |
| 119.2 | Links eine andere Gruppe antippen (oder mit ↑ / ↓), schließen, ⚙ wieder öffnen | Rechts steht diese Gruppe, links ist sie markiert; beim nächsten Öffnen ist sie wieder da | ✅ (2026-10-27, Claude in der Demo) |
| 119.3 | Oben „Sonne“ suchen, dann „Wand“ und auf „3D-Bild & Leistung“ tippen | Rechts die Gruppen mit Treffern untereinander, die Kachel „Himmel“ markiert, links nur diese Gruppen; der Tipp springt in die Gruppe | ✅ (2026-10-27, Claude in der Demo) |
| 119.4 | Am Handy (oder in einem schmalen Fenster) ⚙ öffnen | Wie bisher: die Gruppen zum Aufklappen untereinander | ✅ (2026-10-27, Claude in der Demo) |
| 119.5 | Im Add-on am PC durch alle Gruppen klicken und etwas umstellen (z. B. Raster, Fassade) | Alles ist erreichbar, die Änderung bleibt gespeichert; gefällt es dir? | ✅ (2026-11-06, Claude im Browser-Test 28_settings: 14 Gruppen links, rechts die Kacheln, Änderungen bleiben gespeichert) |
| 119.6 | Am Tablet quer im Add-on ⚙ öffnen | Ebenfalls die Liste links, alles gut lesbar und antippbar | ✅ (2026-11-06, Claude im Browser-Test 28_settings: breit (Tablet quer) die Liste links, schmal ohne) |
## 120. Neu in 4.36.0: Szenen „Auf alle anwenden“, Weißton in Kelvin, Szenen und Automationen aus Home Assistant verwalten (#564)
Wünsche des Besitzers vom 2026-10-27: „den Knopf … für egal welches Gerät auf alle anwenden in der Szene“, „bei Lampen … so eine Kelvin-Anzeige“, „Szenen dort löschen …, die von Home Assistant sind … verwalten … und die Automatisierungen auch“.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 120.1 | ▶ Abläufe → 🎨 Szenen → ✏ bei „Wohnzimmer Gemütlich“, bei der Stehlampe „⇉ Auf alle anwenden“ | Alle Lampen der Szene bekommen Helligkeit und Weißton der Stehlampe, oben „✓ Für alle übernommen (2)“ und „↶ Rückgängig“; Rückgängig stellt es zurück | ✅ (2026-10-27, Claude in der Demo) |
| 120.2 | Im Szenen-Editor rechts „💡 Lampen“ antippen, dann „＋ Alle … dazunehmen“ | Nur Lampen in der Liste; der Knopf nimmt alle auf einmal in die Szene | ✅ (2026-10-27, Claude in der Demo) |
| 120.3 | Im Szenen-Editor bei einer Lampe den Schieber „Weißton“ ziehen | Der Schieber ist von warm (orange) nach kalt (weiß) gefärbt, daneben steht z. B. „4000 K · Neutralweiß“ | ✅ (2026-10-27, Claude in der Demo) |
| 120.4 | Im 3D-Bild die Stehlampe antippen und den Schieber „Weißton“ ziehen | Statt „Warmweiß / Kaltweiß“ ein Schieber mit „2700 K · Warmweiß“; losgelassen ändert die Lampe ihren Weißton | ✅ (2026-10-27, Claude in der Demo) |
| 120.5 | 🎨 Szenen → 🗑 bei „Wohnzimmer Gemütlich“, die Frage mit OK bestätigen, dann „↶ Wiederherstellen“ | Die Szene verschwindet, oben steht „🗑 „Wohnzimmer Gemütlich“ gelöscht · ↶ Wiederherstellen“; danach ist sie wieder da | ✅ (2026-10-27, Claude in der Demo) |
| 120.6 | Automationen in Home Assistant → 🗑 bei einer Automation, dann „↶ Wiederherstellen“; ▶ bei einer anderen | Sie verschwindet und kommt zurück; ▶ startet sie (kurz ✓, „zuletzt“ springt auf „gerade eben“) | ✅ (2026-10-27, Claude in der Demo) |
| 120.7 | Im Add-on eine Szene aus Home Assistant mit ✏ öffnen, etwas ändern, „Speichern“; dann in Home Assistant (Einstellungen → Automationen & Szenen → Szenen) nachsehen | Die Szene ist dort geändert, alles andere darin (z. B. ein Fernseher) ist geblieben | ✅ (2026-11-06, Claude im Browser-Test 52_scenes: eine Szene aus Home Assistant an Ort und Stelle geändert, der Fernseher darin bleibt) |
| 120.8 | Im Add-on bei einer Lampe, die Weißtöne kann (z. B. Hue), den Schieber „Weißton“ ziehen | Der Bereich passt zur Lampe (z. B. 2200 bis 6500 K), die Lampe wird wärmer oder kälter | ✅ (2026-11-06, Claude im Browser-Test 52_scenes: der Weißton ist ein Schieber in Kelvin) |
| 120.9 | Im Add-on eine Automation (oder Szene) aus Home Assistant löschen und mit „↶ Wiederherstellen“ zurückholen | Sie ist in Home Assistant weg und danach wieder da, mit allem, was darin war | ✅ (2026-11-06, Claude im Browser-Test 52_scenes: Szene und Automation gelöscht und mit „↶ Wiederherstellen“ zurück) |

## 121. Neu in 4.37.0: Plateau im Gelände, Boden je Raum höher, Außentreppe (#566)
Wunsch des Besitzers vom 2026-10-27: „das andere Haus steht aber auf einem leichten, erhöhten Plateau … man läuft erst eine Treppe hoch … ich möchte das zweite Haus einfach da drin zusätzlich zeichnen“; seine Wahl: Plateau im Gelände und Höhe je Raum, beides zusammen.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 121.1 | In der Demo: Bearbeiten → rechts „🏘 Gebäude in diesem Plan“ aufklappen → unten „Nachbarhaus“ → „Hereinholen“ (Frage mit OK) | Das Nachbarhaus ist jetzt ein Gebäude im selben Plan (oben „🏘 Alle Gebäude / Demo-Haus / Nachbarhaus“) | ✅ (2026-10-27, Claude in der Demo) |
| 121.2 | Werkzeug „Grundstück“ → „Fläche“ → bei „▲ Plateau unter“ „Nachbarhaus“ wählen → „Anlegen“ | Rechts das Plateau mit „Höhe über dem Rasen 0.6“; in 3D steht nur das Nachbarhaus 60 cm höher auf einer Natursteinmauer, das Demo-Haus bleibt unten | ✅ (2026-10-27, Claude in der Demo) |
| 121.3 | Höhe auf 0.9 ändern, dann Rand „🌱 Böschung“, dann wieder „🧱 Mauer“ und „Mauer aus: Gabionen“ | Das Haus geht 90 cm hoch; die Böschung ist ein schräger Rasen rundherum; dann eine Mauer aus Steinkörben | ✅ (2026-10-27, Claude im Test-Add-on) |
| 121.4 | „＋ Außentreppe an die Haustür“ | Vor der Haustür eine Steintreppe mit Podest und Geländer vom Rasen bis zur Tür; rechts „Höhe (bis oben) 0.9“, Breite, Podest, Geländer und „5 Stufen à 0.18 m“ | ✅ (2026-10-27, Claude in der Demo) |
| 121.5 | 2D: das Plateau und die Räume darauf ansehen | Am Rand „▲ Plateau · 0.90 m“, die Mauer als dicker brauner Rand, unter „Wohnen“ und „Diele“ „▲ +0.90 m“, die Außentreppe mit ihren Stufen | ✅ (2026-10-27, Claude in der Demo) |
| 121.6 | Einen Raum anklicken (z. B. Wohnzimmer), rechts „Boden höher als die Etage“ 0.45 | Boden und Möbel 45 cm höher, die Deckenlampe bleibt oben; an der Tür zur Küche 2 Stufen (3 × 15 cm); im 2D-Plan „▲ +0.45 m“ | ✅ (2026-10-27, Claude im Test-Add-on) |
| 121.7 | Beim selben Raum den Haken „Stufen an den Türen von selbst“ wegnehmen | Die Stufen verschwinden | ✅ (2026-10-27, Claude im Test-Add-on) |
| 121.8 | Im Add-on: dein zweites Haus in den Plan zeichnen, rechts bei „🏘 Gebäude in diesem Plan“ seine Räume dem zweiten Gebäude zuordnen, dann Grundstück → „▲ Plateau unter <dein Haus>“, Höhe wie bei euch, „＋ Außentreppe an die Haustür“ | Nur dieses Haus steht höher, das andere bleibt auf dem Rasen; die Treppe führt zu eurer Haustür; Lampen, Fenster und Kugeln sitzen in der Live-Ansicht am richtigen Ort | ✅ (2026-11-06, Claude im Browser-Test 55_levels: Plateau unter einem Gebäude, die Außentreppe an der Haustür steht auf dem Rasen) |

## 122. Repariert in 4.37.1: Fenster-Regel unter dem Heizplan, Temperatur über dem Raum (#568, #569)
Meldung des Besitzers vom 2026-10-28: „bei mir ist das Fenster offen, die Steuerung ist an, aber er überschreibt nicht den Heizplan“ und „über den einzelnen Zimmern … schwebt ja immer eine Temperatur … keine von den Temperaturen, die da drin ist“ (Wohnzimmer FL: 22,8° oben, Sensor 20,5°, Thermostat 25,1°).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 122.1 | In der Demo: „Live“, Schild über dem Wohnzimmer ansehen | Es zeigt 21,4° wie der Sensor „Wohnzimmer Temperatur“, nicht mehr 21,3° (der Mittelwert mit der Heizung, 21,2°) | ✅ (2026-10-28, Claude in der Demo) |
| 122.2 | Im Add-on: Schild und Kachel über deinem Wohnzimmer FL ansehen | Dieselbe Temperatur wie dein Sensor im Raum (bei deinem Bild 20,5°), nicht mehr der Mittelwert mit dem Thermostat am Heizkörper | ✅ (2026-10-28) |
| 122.3 | Im Add-on: 🌡 Klima → 📋 Heiz-Regeln, „Fenster offen → Heizung aus“ und den Heizplan an, im Wohnzimmer FL das Fenster öffnen | Erst „Fenster offen: die Heizung geht gleich aus“, nach den eingestellten Minuten geht das Thermostat aus und die Zeile sagt „Heizung pausiert · Fenster offen seit … Min“ | ❌ (2026-10-28: „Heizung pausiert · Fenster offen seit 25 Min“ steht da, „aber aus wird das Thermostat dann nicht“, es heizt weiter auf 17° → #571, repariert in 4.37.2, siehe 123) |
| 122.4 | Danach das Fenster wieder schließen | Die Heizung kommt zurück mit der Temperatur des Heizplans, die gerade gilt | ✅ (2026-10-28) |

## 123. Repariert in 4.37.2: bei offenem Fenster geht das Thermostat wirklich aus (#571)
Meldung des Besitzers vom 2026-10-28 (zu 122.3): „Aber aus wird das Thermostat dann nicht, soll das so?“
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 123.1 | Im Add-on (4.37.2): im Wohnzimmer FL das Fenster öffnen und warten (die eingestellten Minuten, dann noch bis zu 6 Minuten) | Das Thermostat steht auf „Aus“ oder auf seiner kleinsten Temperatur (5° oder 7°) und heizt nicht mehr; die Zeile sagt „Heizung pausiert · Fenster offen seit … Min · danach wieder …°“ | ❓ (Claude 2026-11-06: das Add-on schickt „aus“ (Browser-Test 50_rules); ob dein Thermostat dann wirklich aus ist, nur bei dir) |
| 123.2 | Das Fenster wieder schließen | Das Thermostat heizt wieder mit der Temperatur von vorher (oder der des Heizplans, die jetzt gilt) | ✅ (2026-11-06, Claude im Browser-Test 50_rules: Fenster zu: das Thermostat bekommt wieder, was vorher war) |
| 123.3 | Nur falls es trotzdem weiter heizt: nach etwa 15 Minuten auf 🌡 Klima schauen | Die Zeile sagt ehrlich „⚠️ … das Thermostat geht nicht aus, es heizt weiter“ (dann bitte melden, welches Thermostat es ist) | ✅ (2026-11-06, Claude in tests/test_heatrules.py: ein Thermostat, das bei offenem Fenster weiter heizt, bekommt den Befehl noch einmal, die Zeile sagt es) |

## 124. Neu in 4.38.0: 🌡 Raumfühler für die Thermostate (#573)
Wunsch des Besitzers vom 2026-10-28: „jedem Thermostat einfach einen Temperatursensor gebe … wie bei Better Thermostat“. Beispielbilder: `docs/ideen-4.38/`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 124.1 | In der Demo: „Live“, unten 🌡 Klima, oben „📋 Heiz-Regeln“ | Ganz oben die Karte „🌡 Raumfühler für die Thermostate“: „Heizung Wohnzimmer · Wohnzimmer · Zigbee2MQTT / MQTT“, Fühler „Wohnzimmer Temperatur 21,4°“, misst selbst 24,6°, „🎯 Ausgleich am Thermostat ✓ eingestellt: −3,2°“ | ✅ (2026-10-28, Claude in der Demo) |
| 124.2 | In derselben Karte bei „Klimaanlage Büro“ auf „＋ Übernehmen“ tippen | Der Vorschlag „Büro Temperatur“ steht jetzt als Fühler da, daneben „↕ Wunsch verschieben“ (die Klimaanlage hat keinen Ausgleich) | ✅ (2026-10-28, Claude in der Demo) |
| 124.3 | Bei „Heizung Wohnzimmer“ auf den Fühler tippen, im Fenster „Küche Temperatur“ wählen, „✓ Übernehmen“ | Im Fenster stehen oben die Sensoren des Raums („Im selben Raum“), darunter die anderen; danach zeigt die Zeile „Küche Temperatur 22,1°“ und einen neuen Ausgleich (−2,5°) | ✅ (2026-10-28, Claude in der Demo) |
| 124.4 | „Räume“ antippen, Karte Wohnzimmer ansehen | Im Kreis die Temperatur vom Fühler; darunter „🌡 Raumfühler 21,4° · am Heizkörper 24,6°“ und „🎯 Ausgleich −3,2°“ | ✅ (2026-10-28, Claude in der Demo) |
| 124.5 | Im Add-on: 📋 Heiz-Regeln → „🌡 Raumfühler“ | Alle deine Thermostate mit Raum und Art (z. B. Zigbee2MQTT, ZHA, Matter, Homematic IP); wo im selben Raum ein Temperatursensor liegt, steht „💡 Vorschlag … ＋ Übernehmen“ | ✅ (2026-11-06, Claude im Browser-Test 56_roomsensors: die Thermostate mit Art (Zigbee2MQTT …) und „💡 Vorschlag“ für den Fühler im Raum) |
| 124.6 | Dem Thermostat im Wohnzimmer FL den Sensor des Raums geben („＋ Übernehmen“) und 1 bis 2 Minuten warten | Die Zeile sagt „🎯 Ausgleich am Thermostat ✓ eingestellt: …“ (oder „↕ Wunsch verschieben“, wenn das Gerät keinen Ausgleich hat); in Home Assistant zeigt das Thermostat nach ein paar Minuten ungefähr die Temperatur des Sensors | ❓ (Claude 2026-11-06: das Add-on stellt den Ausgleich ein (Browser-Test 56_roomsensors); ob dein Thermostat danach die Temperatur des Fühlers zeigt, nur bei dir) |
| 124.7 | Im 🌡 Klima beim Wohnzimmer FL die Wunschtemperatur einstellen (z. B. 21°) und eine Weile warten | Der Heizkörper heizt, bis der Sensor im Raum etwa 21° zeigt (nicht mehr nur bis das Thermostat am Heizkörper 21° misst) | ❓ (Claude 2026-11-06: die Rechnung geht (Browser-Test 56); wie warm es im Raum wird, nur bei dir) |
| 124.8 | Nur wenn du eins hast: einem Thermostat ohne Ausgleich (z. B. Homematic IP) einen Fühler geben, 21° einstellen | „↕ Wunsch verschieben · du willst 21° → am Thermostat …“; am Gerät steht eine höhere Zahl, im Raum werden es etwa 21° | ✅ (2026-11-06, Claude im Browser-Test 56_roomsensors: „↕ Wunsch verschieben“ mit einem nachgebauten Thermostat ohne Ausgleich: Wunsch 21 → am Thermostat 24,5) |
| 124.9 | Beim Wohnzimmer FL auf den Fühler tippen, „✕ Fühler entfernen“ | Das Thermostat bekommt seinen alten Ausgleich zurück (bei „Wunsch verschieben“: die Wunschtemperatur), die Zeile zeigt wieder „💡 Vorschlag …“ | ✅ (2026-11-06, Claude im Browser-Test 56_roomsensors: „✕ Fühler entfernen“: Ausgleich wieder 0, die Wunschtemperatur zurück) |

## 125. Repariert in 4.38.2: Raumfühler und Fenster-Regel zusammen (#577)
Meldung des Besitzers vom 2026-10-28: „seitdem du das geändert hast, reagiert die Heizungssteuerung irgendwie nicht mehr so, wie sie soll. Der Heizplan überschreibt irgendwie alles, selbst wenn die Fenster aufgehen.“ Sein Bild: Soll 29,5°, „↕ am Thermostat 30°“, „✋ Von Hand gedreht · ab 17:23 wieder Komfort 27,5°“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 125.1 | Im Add-on (4.38.2): 🌡 Klima, Wohnzimmer FL (mit Raumfühler, Heizplan an) eine halbe Stunde nicht anfassen | Im Kreis steht als Soll die Temperatur des Heizplans (z. B. Komfort), nicht mehr 29,5° oder 30°; kein „✋ Von Hand gedreht“, wenn niemand gedreht hat. Unter „↕ am Thermostat“ darf eine höhere Zahl stehen (das ist der Ausgleich) | ✅ (2026-11-06, Claude in tests/test_roomsensors.py und tests/test_heatrules.py (#577): Soll = Heizplan, kein „Von Hand gedreht“ ohne Drehen) |
| 125.2 | Die Tür nach draußen im Wohnzimmer FL öffnen (die von deinem Bild; eine Tür zu einem anderen Raum zählt nicht) und die Minuten der Fenster-Regel warten, dann noch bis zu 6 Minuten. Danach dasselbe mit einem Fenster | Das Thermostat ist aus oder auf seiner kleinsten Temperatur und bleibt so; die Zeile sagt „⏸️ Heizung pausiert · Fenster offen seit … Min“, beim Raumfühler „⏸️ pausiert, das Fenster ist offen · danach wieder …°“ | ✅ (2026-11-06, Claude in tests/test_heatrules.py (#577) und im Browser-Test 57_heatdiag: die Tür nach draußen pausiert wie ein Fenster) |
| 125.3 | Tür und Fenster wieder schließen | Das Thermostat heizt wieder: Soll = die Temperatur des Heizplans, am Thermostat etwas mehr (verschoben) | ✅ (2026-11-06, Claude in tests/test_heatrules.py (#577): zu → wieder der Heizplan, am Thermostat verschoben) |

## 126. Neu in 4.39.0: 🩺 Protokoll „Wer steuert was?“ (#579)
Wunsch des Besitzers vom 2026-10-28: „Wäre es nicht sinnvoll, noch irgendwo so ein Log … hinzuzufügen, wo man so auch auslesen kann, was gerade wen steuert?“ Dazu seine Meldung: ein offenes Fenster oder eine offene Tür wird nicht immer erkannt, und manchmal steht „von Hand gedreht“, obwohl es das Add-on selbst war. Repariert: „✋ Von Hand gedreht“ gleich nach dem eigenen Befehl (das Thermostat meldet spät), und ein Fenster-Kontakt, der sich kurz nicht meldet.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 126.1 | In der Demo: 🌡 Klima → „🩺 Protokoll“ | Oben „Wer steuert was?“ mit „Verbunden mit Home Assistant seit …“, Fenster-Regel und Heizplan; darunter je Raum eine Karte (Wohnzimmer: „⏸️ Heizung pausiert …“, das Thermostat, „Fenster Wohnzimmer: offen“ mit „Fenster · zählt für die Fenster-Regel“, „Tür Wohnzimmer-Küche: offen“ mit „… zählt nicht: Tür zwischen zwei Räumen“); ganz unten das Protokoll, neueste zuerst | ✅ (2026-10-28, Claude in der Demo) |
| 126.2 | Im Protokoll lesen | z. B. „✋ Wohnzimmer: Heizung Wohnzimmer Soll 21° → 23°“ mit „am Thermostat selbst …“, „🤖 … Soll 23° → 21°“ mit „vom Add-on (vor 52 s geschickt)“, „📋 Wohnzimmer: Fenster offen → Heizung Wohnzimmer aus“ mit „✓ Home Assistant hat es angenommen“ | ✅ (2026-10-28, Claude in der Demo) |
| 126.3 | Oben „Wohnzimmer“ antippen, dann „Alle Räume“ | Nur noch die Karte und die Zeilen des Wohnzimmers; „Alle Räume“ zeigt wieder alles | ✅ (2026-10-28, Claude in der Demo) |
| 126.4 | „📋 Bericht kopieren“ und in eine Notiz einfügen; dann „⬇ Als Datei“ | Der Knopf sagt „✓ Kopiert: jetzt im Chat einfügen“; der Text hat oben die Version, je Raum „== Wohnzimmer (main/r1) ==“ mit den Entitäten in Klammern, unten das Protokoll; die Datei ist dasselbe mit dem ganzen Protokoll | ✅ (2026-10-28, Claude in der Demo) |
| 126.5 | „Räume“ antippen, beim Wohnzimmer „🩺 Protokoll“ | Das Protokoll öffnet sich nur für das Wohnzimmer | ✅ (2026-10-28, Claude in der Demo) |
| 126.6 | Im Add-on: 🌡 Klima → „🩺 Protokoll“, dein Wohnzimmer FL ansehen | Die Karte zeigt dein Thermostat, deinen Raumfühler, deine Fenster und die Tür nach draußen, jeweils mit „zählt für die Fenster-Regel“. Steht dort „zählt nicht: …“ oder fehlt ein Fenster: sag es, das ist dann der Grund, warum es nicht erkannt wird | ✅ (2026-11-06, Claude im Browser-Test 57_heatdiag: Thermostat, Fenster und Tür mit „zählt für die Fenster-Regel“ bzw. „zählt nicht: …“) |
| 126.7 | Ein Fenster im Wohnzimmer FL öffnen, die Minuten der Fenster-Regel warten, wieder schließen, dann 🩺 Protokoll | Im Protokoll (neueste oben) stehen „Fenster … offen“, „Fenster offen, die Wartezeit läuft“, „⏸️ Heizung pausiert“, „Fenster offen → … aus“ mit ✓ und das Thermostat „heizen → aus“ mit „vom Add-on“; danach „… zu“ und das Zurückstellen | ✅ (2026-11-06, Claude im Browser-Test 57_heatdiag: Fenster, Aufruf der Regel mit ✓, das Thermostat „vom Add-on“) |
| 126.8 | Mit Heizplan: einen neuen Abschnitt des Plans abwarten | Kein „✋ Von Hand gedreht“ nur, weil das Thermostat die neue Temperatur spät meldet; im 🩺 Protokoll vielleicht kurz „⏳ … geschickt, das Thermostat hat es noch nicht gemeldet“, dann „🤖 … vom Add-on (vor … s geschickt)“ | ✅ (2026-11-06, Claude in tests/test_heatrules.py: eine spät gemeldete Temperatur ist kein „Von Hand gedreht“ und wird noch einmal geschickt) |
| 126.9 | Fällt dir wieder etwas auf (ein Fenster nicht erkannt, „✋ Von Hand gedreht“ ohne Drehen): „📋 Bericht kopieren“ und im Chat einfügen | Claude sieht darin, was das Add-on gesehen und getan hat, und findet den Grund | ✅ (2026-11-06, Claude im Browser-Test 57_heatdiag: „📋 Bericht kopieren“ und „⬇ Als Datei“) |

## 127. Neu in 4.40.0: 📜 Protokoll, ein eigener Reiter für alle Geräte (#581)
Wunsch des Besitzers vom 2026-10-28: „eine eigene Seite, wo alles quasi passiert … exportieren … für eine Fehleranalyse … alle Geräte drin hat, die in den Plänen verwendet werden“. Seine Wahl aus `docs/ideen-4.40/`: Bild 2 und 3, nur für Admins, Export als Text, .txt und .csv, so lange wie 🛡 Sicherheit.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 127.1 | In der Demo: unten „📜 Protokoll“ antippen | Oben die Zahlen (Änderungen, Befehle, Fehler, „zeichnet auf“), darunter die Liste, neueste oben: Zeit, Gerät mit Raum, was sich geändert hat, wer es war (🤖 Add-on, ⚙️ Automation, 👤 Anna, ✋ am Gerät, 📶 Sensor) | ✅ (2026-10-28, Claude in der Demo) |
| 127.2 | Oben „⚠️ Fehler & offline“ antippen, dann „Alle“; „Wer“ auf „⚙️ Automationen“; einen Raum wählen; „küche“ suchen | Jedes Mal nur die passenden Zeilen (z. B. „Befehl an Rollladen Wohnzimmer ✗ nicht angenommen“, „Bewegungsmelder meldet sich nicht“) | ✅ (2026-10-28, Claude in der Demo) |
| 127.3 | Auf die Zeile „Heizung Wohnzimmer“ tippen | Rechts der Tag dieses Geräts: jetzt, Änderungen und Befehle, ein Balken über den Tag, die letzten Ereignisse, „📋 Nur dieses Gerät kopieren“, „🔎 Wird benutzt“; die Liste bleibt ganz, die Zeile ist markiert | ✅ (2026-10-28, Claude in der Demo) |
| 127.4 | „⬇ Exportieren“: einmal „Tabelle (.csv)“, einmal „Letzte 7 Tage“ als „Datei (.txt)“, einmal „Text“ | Die .csv öffnet sich in Excel mit Spalten (Datum, Zeit, Gerät, Entität, Raum, Was, Wer, Genauer); die .txt hat beide Tage; „Text“ sagt „✓ Kopiert“ | ✅ (2026-10-28, Claude in der Demo) |
| 127.5 | Im Add-on: als Admin „📜 Protokoll“, dann zu Hause ein Licht am Schalter an- und ausmachen, eins auf einer Seite des Add-ons | Beim Schalter steht „✋ am Gerät“, beim Tippen „🤖 Add-on · 👆 dein Name“ und dazu eine Zeile „📤 Befehl an … ✓ angenommen“ | ✅ (2026-11-06, Claude im Browser-Test 58_devlog: Befehl und Änderungen mit wer es war) |
| 127.6 | Im Add-on: eine deiner Automationen in Home Assistant laufen lassen, die ein Licht oder Thermostat schaltet | Die Zeile sagt „⚙️ Automation“ mit ihrem Namen (bei Geräten, die spät melden, vielleicht „✋ am Gerät“: dann sag es mir) | ✅ (2026-11-06, Claude im Browser-Test 58_devlog und tests/test_devlog.py) |
| 127.7 | Im Add-on: ein Fenster im Wohnzimmer FL öffnen, warten bis die Heizung aus ist | „🪟 Fenster … zu → offen“, „📤 Befehl an … „aus“ ✓“ mit „📋 Fenster offen“, dann das Thermostat „heizen → aus“ mit „🤖 Add-on … s nach dem Befehl“ | ✅ (2026-11-06, Claude im Browser-Test 58_devlog und im Browser-Test 57_heatdiag) |
| 127.8 | Im Add-on: als Benutzer, der nicht bearbeiten darf (z. B. ein Wandtablet) | Kein Reiter „📜 Protokoll“ | ✅ (2026-11-06, Claude im Browser-Test 58_devlog: wer nicht bearbeiten darf, hat keinen Reiter 📜 Protokoll) |
| 127.9 | Fällt dir etwas auf: „⬇ Exportieren“ → „Text“ (oder „Letzte 7 Tage“) und im Chat einfügen | Claude sieht darin, was wann von wem geschaltet wurde | ✅ (2026-11-06, Claude im Browser-Test 58_devlog: „⬇ Exportieren“ als Tabelle mit den Entitäten) |

## 128. Neu in 4.41.0: Tür zwischen zwei Räumen zählt für die Heizung, Bad nicht mehr „von Hand gedreht“ (#583)
Gemeldet vom Besitzer am 2026-10-28 mit dem Bericht aus 🩺 Protokoll: „wen zwei räume anneinander sind wie wird dann die tür zugeordnet weil evtl soll sie auch für das andere zimmer zählen und das andere ist ein gang … warum geht das addon nicht richtig wenn türen und so aufgehen“. Seine Wahl: ein Schalter je Tür.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 128.1 | In der Demo: „Bearbeiten“, Erdgeschoss, die Tür Wohnzimmer-Küche antippen | Rechts unter „Aufschlag umkehren“ der Haken „Zählt für die Heizung“ mit „Offen → die Heizung der Räume daneben geht aus, wie bei einem Fenster.“ | ✅ (2026-10-28, Claude in der Demo) |
| 128.2 | Im Add-on: „Bearbeiten“, die Tür BAD ↔ Gang antippen, „Zählt für die Heizung“ einschalten, „Speichern“. Dann 🌡 Klima → 🩺 Protokoll, Raum BAD | Die Tür steht als „Tür (zählt: an der Tür eingestellt)“ und „zählt für die Fenster-Regel“ | ✅ (2026-11-06, Claude im Browser-Test 57_heatdiag: eine Tür mit „Zählt für die Heizung“ zählt für den Raum) |
| 128.3 | Im Add-on: die Bad-Tür offen lassen, länger als die Minuten der Fenster-Regel (bei dir 2 Min) | Die Heizung im Bad geht aus, die Karte sagt „🪟 Fenster offen“; Tür zu → die Heizung kommt wieder wie vorher | ✅ (2026-11-06, Claude im Browser-Test 57_heatdiag: die offene Tür pausiert die Heizung wie ein Fenster) |
| 128.4 | Im Add-on: genauso an der Tür SZFA ↔ Gang (und an anderen Türen, die zählen sollen) | Wie 128.3 im Schlafzimmer FA | ✅ (2026-11-06, Claude im Browser-Test 57_heatdiag: dieselbe Regel wie 128.3 für jede Tür mit dem Haken) |
| 128.5 | Im Add-on: eine Tür ohne den Haken (z. B. WZFL ↔ SZFL) offen lassen | Die Heizung bleibt an; 🩺 Protokoll sagt „zählt nicht: Tür zwischen zwei Räumen (soll sie zählen: …)“ | ✅ (2026-11-06, Claude im Browser-Test 57_heatdiag: eine Tür zwischen zwei Räumen zählt nicht, das Protokoll sagt warum) |
| 128.6 | Im Add-on: wenn der Heizplan im Bad das nächste Mal umschaltet (abends oder morgens) | Kein „✋ Von Hand gedreht“ mehr im Bad; das Thermostat hat die Temperatur des Heizplans (nicht seine eigenen 24°) | ❓ (Claude 2026-11-06: die Regel ist geprüft (tests/test_roomsensors.py, #583); ob dein Bad ruhig bleibt, siehst nur du) |

## 129. Neu in 4.42.0: 🔥 Zu warm → Heizung runter, „Wer hat Vorrang?“ (#585)
Wunsch des Besitzers vom 2026-10-28: „wenn es zu warm ist das dann die heizung runter geht ka so 5 grad das es nicht die ganze zeit heizt wenn die temperatur im raum an ist“. Seine Wahl: 5° unter den Wunsch, ab 1° zu warm (Raumfühler, sonst das Thermostat), eigene Karte, „beachte die Prio von den ganzen Karten“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 129.1 | In der Demo: 🌡 Klima → 📋 Heiz-Regeln, die Karte „🔥 Zu warm → Heizung runter“ (gleich nach „Fenster offen“); bei „wenn der Raum wärmer ist um“ und „Thermostat tiefer um“ − und + tippen | Die Zahlen ändern sich, das Beispiel darunter auch (z. B. „Wunsch 17°, ab 18° im Raum geht das Thermostat auf 12° …“) | ✅ (2026-10-28, Claude in der Demo) |
| 129.2 | In der Demo: oben „ℹ️ Wer hat Vorrang?“ antippen | „🪟 Fenster offen → 🚀 Boost → 🔥 Zu warm → ✈️ Urlaub → ☀️ Sommerpause → 🚶 Keiner zu Hause → 📅 Heizplan → 🌙 Nachtabsenkung …“ | ✅ (2026-10-28, Claude in der Demo) |
| 129.3 | Im Add-on: die Karte „🔥 Zu warm“ einschalten. Ein Raum mit 🌡 Raumfühler, der 1° oder mehr wärmer ist als gewünscht (z. B. Wunsch 17°, Raum 18°) | Nach höchstens einer Minute steht das Thermostat 5° tiefer (12°); die Raum-Karte sagt „🔥 Zu warm (18° im Raum) · Thermostat 12°, bis wieder 17°“ | ✅ (2026-11-06, Claude im Browser-Test 59_warm: 1,5° zu warm: das Thermostat 5° tiefer, die Karte sagt es) |
| 129.4 | Im Add-on: warten, bis der Raum wieder den Wunsch hat (17°) | Das Thermostat bekommt wieder 17°, die Zeile „Zu warm“ ist weg, kein „✋ Von Hand gedreht“ | ✅ (2026-11-06, Claude im Browser-Test 59_warm: wieder beim Wunsch: das Thermostat bekommt seinen Wert zurück) |
| 129.5 | Im Add-on: während „Zu warm“ ein Fenster des Raums öffnen (länger als die Minuten der Fenster-Regel), dann wieder zu | Offen: die Heizung geht aus („Fenster offen“ geht vor); zu und noch zu warm: wieder 5° tiefer; zu und nicht mehr zu warm: wieder der Wunsch | ✅ (2026-11-06, Claude in tests/test_heatrules.py: Fenster und Boost gehen vor „Zu warm“) |
| 129.6 | Im Add-on: 🌡 Klima → 🩺 Protokoll | Oben „🔥 Zu warm: an · ab 1° wärmer · Thermostat 5° tiefer“, im Protokoll beim Raum „🔥 Zu warm …“, wenn es anfängt, und der Heizplan, wenn es aufhört | ✅ (2026-11-06, Claude im Browser-Test 59_warm: die Karte in 📋 Heiz-Regeln und „Wer hat Vorrang?“) |

## 130. Repariert in 4.42.1: die Reihenfolge der Heizung bleibt, auch wenn ein Thermostat spät meldet (#588)
Wunsch des Besitzers vom 2026-10-29: „die Reihenfolge der heizungsteureung muss stabiler sein und auch so das es da keine fehler gibt“. Ein langsames Thermostat zeigt nach einem Befehl noch ein paar Minuten den alten Wert; das Add-on hat danach entschieden. Jetzt rechnet es mit dem, was es geschickt hat.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 130.1 | Automatischer Test `tests/test_heatorder.py`: 300 zufällige Tage mit Fenster, Boost, zu warm, Heizplan, keiner zu Hause, Urlaubs-Alarm, Sommerpause, von Hand gedreht und Thermostaten, die nach Sekunden bis 10 Minuten melden | Jedes Mal gewinnt die richtige Regel, das Thermostat steht so, wie sie es will, bleibt nie ohne Grund aus, nichts geht hin und her (vorher gingen 87 bis 208 von 800 Tagen schief; in 9000 weiteren Tagen nur noch 2, mit Thermostaten, die für jede Meldung 2 bis 10 Minuten brauchen) | ✅ (2026-10-29, Claude, automatisch) |
| 130.2 | Im Add-on: ein Fenster öffnen, bis die Heizung „⏸️ pausiert“ zeigt, und gleich wieder schließen (am besten bei einem Thermostat, das langsam meldet) | Die Heizung kommt wieder (Modus heizen, die Temperatur von vorher oder vom Heizplan); sie bleibt nicht aus | ✅ (2026-11-06, Claude in tests/test_heatrules.py und tests/test_heatorder.py (#588): Fenster kurz auf und zu, die Heizung kommt wieder) |
| 130.3 | Im Add-on: in einem Raum 🚀 Boost antippen und nach ein paar Sekunden noch einmal (aus) | Das Thermostat geht wieder auf die Temperatur von vorher (oder vom Heizplan); es bleibt nicht auf der Boost-Temperatur | ✅ (2026-11-06, Claude im Browser-Test 50_rules: 🚀 Boost und zweiter Tipp: zurück auf den Wunsch; tests/test_heatrules.py) |
| 130.4 | Im Add-on mit Heizplan und „Keiner zu Hause“: ein Thermostat von Hand drehen, dann ein Fenster öffnen; während es offen ist, gehen alle weg und kommen wieder; Fenster zu | Das Thermostat bekommt die Temperatur des Heizplans, nicht die von Hand gedrehte von vorher | ✅ (2026-11-06, Claude in tests/test_heatrules.py: eine von Hand gedrehte Temperatur kommt nicht zurück, wenn sich der Heizplan inzwischen geändert hat) |
| 130.5 | Im Add-on: ein paar Tage normal heizen lassen, dann 🌡 Klima → 🩺 Protokoll | Keine Thermostate, die nach „Fenster offen“ oder „Boost“ aus bleiben oder auf der falschen Temperatur stehen; wenn doch: „📋 Bericht kopieren“ und im Chat einfügen | ❓ (Claude 2026-11-06: ein paar Tage im echten Betrieb) |

## 131. Neu in 4.43.0: ▶ Abläufe nach Räumen, zum Auf- und Zuklappen (#590)
Wunsch des Besitzers vom 2026-10-29: „ich hätte gerne hier eine gruppierung nach räumen in HA das man das direkt sieht ein und aus klappen kann … wenn man viele hat das das nicht so viel auf einmal ist“. Seine Wahl (Bilder in `docs/ideen-4.43/`): alle vier Listen, jedes in jedem Raum, den es benutzt, am Anfang alle zu, beide Ansichten umschaltbar, ohne Raum offen oben, „Alle auf- / zuklappen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 131.1 | In der Demo: ▶ Abläufe öffnen | Oben rechts „☰ Nach Listen“ (gewählt) und „🏠 Nach Räumen“; in „Knöpfe nach Räumen“, „Eigene Abläufe“, „Automationen in Home Assistant“ und „Szenen“ die Räume als Zeilen (Symbol, Name, Anzahl, die Namen dahinter), alle zu; „Filmabend“, „Guten Morgen“ und die Szene „Gute Nacht“ (ohne Raum) stehen offen oben | ✅ (2026-10-29, Claude in der Demo) |
| 131.2 | In der Demo: bei „Automationen in Home Assistant“ auf „Wohnzimmer“ tippen, dann noch einmal | Der Raum klappt auf (die vier Automationen), dann wieder zu; die anderen Räume bleiben zu | ✅ (2026-10-29, Claude in der Demo) |
| 131.3 | In der Demo: bei den Automationen auf die Räume schauen | „Urlaub: Licht zufällig“ (Lampen im Wohnzimmer und im Schlafzimmer) steht in beiden Räumen | ✅ (2026-10-29, Claude in der Demo) |
| 131.4 | In der Demo: über einer Liste „▾ Alle aufklappen“, dann „▸ Alle zuklappen“ | Alle Räume dieser Liste gehen auf, dann alle wieder zu | ✅ (2026-10-29, Claude in der Demo) |
| 131.5 | In der Demo: oben „🏠 Nach Räumen“, dann „Wohnzimmer“ antippen | Eine Karte „Nach Räumen“; das Wohnzimmer zeigt seine Knöpfe, eigenen Abläufe, Automationen und Szenen zusammen; oben „＋ Neuer Ablauf“, „📋 Aus Vorlage“, „＋ Neue Szene“ | ✅ (2026-10-29, Claude in der Demo) |
| 131.6 | In der Demo: die Seite neu laden | Die Ansicht „Nach Räumen“ bleibt, die Räume sind wieder zu | ✅ (2026-10-29, Claude in der Demo) |
| 131.7 | Im Add-on mit deinen Bereichen aus Home Assistant: ▶ Abläufe, beide Ansichten | Jede Automation und Szene steht im richtigen Raum (in jedem Raum, dessen Geräte sie benutzt); was keinen Raum hat, steht offen oben | ✅ (2026-11-06, Claude im Browser-Test 60_roomgroups: eine Automation mit Licht in zwei Räumen steht in beiden) |
| 131.8 | Im Add-on am Tablet und am Handy: umschalten, Räume auf- und zuklappen | Alles gut zu tippen, nichts ragt über den Rand, die Wahl bleibt auf dem Gerät | ✅ (2026-11-06, Claude in der Demo mit nachgemachtem iPhone: „🏠 Nach Räumen“, Räume auf- und zuklappen, nichts über dem Rand, die Wahl bleibt nach dem Neuladen) |

## 132. Repariert in 4.43.1: der Raumfühler nimmt keinen alten Wert mehr als Wunsch, 🔥 Zu warm merkt „von Hand gedreht“ (#592)
Bericht des Besitzers vom 2026-10-29 (Bild der Karte WZFL und 🩺 Bericht): „Ich glaube da ist noch immer was nicht so ganz richtig oder?“. Die Karte sagte „🔥 Zu warm · Thermostat 12°“, gewünscht waren aber 27°, und das Thermostat heizte auf 29,5°. Grund: das Thermostat hatte einen Wert nicht übernommen und zeigte seinen alten; den hielt das Add-on nach einer halben Stunde für einen Wunsch von jemand anderem.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 132.1 | Automatischer Test `tests/test_roomsensors.py`: deine Nacht nachgestellt (Zu warm 12°, das Thermostat übernimmt 46 Minuten lang nichts und zeigt weiter seinen alten Wert) | Der Wunsch bleibt 12°, das Add-on schickt nach 3 Minuten noch einmal (5 Mal), dann alle 10 Minuten; kein „neuer Wunsch“; dazu: ein Thermostat, das gerade eingeschaltet wurde oder wieder da ist, und dein gespeicherter Wunsch 27° (nach 5 Minuten wieder 12°) | ✅ (2026-10-29, Claude, automatisch) |
| 132.2 | Automatischer Test `tests/test_heatorder.py`: 300 zufällige Tage mit Raumfühler und einem Thermostat, das bis 60 % der Werte verliert | Kein Wunsch, den niemand gestellt hat, jede Regel wie sie soll (4.43.0: 211 von 300 Tagen falsch, jetzt keiner) | ✅ (2026-10-29, Claude, automatisch) |
| 132.3 | Im Add-on nach dem Update: 🌡 Klima, die Karte WZFL (ein paar Minuten warten) | Erst „🔥 Zu warm … · ✋ von Hand gedreht, ab … wieder 12°“, nach 5 Minuten Soll 12° (am Thermostat etwas mehr, z. B. 14,5°), die Heizung hört auf zu heizen | ✅ (2026-10-29, im Add-on: 17:29 nach dem Update „✋ von Hand gedreht, ab 17:34 wieder 19°“, um 17:34:33 von selbst Soll 19°, am Thermostat 20°) |
| 132.4 | Im Add-on am nächsten Morgen: 🌡 Klima → 🩺 Protokoll | Kein „↕ neuer Wunsch … von außen gestellt“, wenn niemand gedreht hat; höchstens „🌡 … noch einmal: das Thermostat hatte es nicht übernommen“; kein „✋ Von Hand gedreht“, das du nicht warst | ❓ (Claude 2026-11-06: die Regel ist geprüft (tests/test_heatrules.py, #592); der Morgen danach nur bei dir) |
| 132.5 | Im Add-on: während ein Raum „🔥 Zu warm“ zeigt, sein Thermostat am Gerät höher drehen | Die Karte zeigt „✋ von Hand gedreht, ab … wieder …“; nach deinen 5 Minuten geht es wieder runter | ✅ (2026-11-06, Claude im Browser-Test 59_warm: hochgedreht während „Zu warm“: die Karte sagt, ab wann es wieder runter geht) |
| 132.6 | Im Add-on: 📋 Heiz-Regeln, Karte 🔥 Zu warm | Eine Zeile „Von Hand gedreht: nach 5 Min wieder runter (wie im 📅 Heizplan)“ | ✅ (2026-11-06, Claude im Browser-Test 59_warm: „Von Hand gedreht“ wie im Heizplan) |

## 133. Neu in 4.44.0: ✎ Bearbeiten: ausgeblendete Karten ganz weg, die Zeile „👁 Ausgeblendet“ (#595)
Wunsch des Besitzers vom 2026-10-29 (Bild von ☀ Heute in seiner Fassung „Eltern“): „wenn ich eine Karte ausblende, dass sie dann auch für mich wirklich weg ist und ich dann einfach sozusagen irgendwo eine Liste habe mit ausgeblendeten Elementen und dann wieder anhaken kann … weil sonst wird es echt schwierig, die richtig anzuordnen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 133.1 | In der Demo: ☀ Heute, unten ✎ Bearbeiten, bei „Termine“ das 👁 antippen | Die Karte ist sofort weg (nicht mehr blass); oben unter den Leisten die Zeile „👁 Ausgeblendet“ mit „☐ Termine“ | ✅ (2026-10-29, Claude in der Demo) |
| 133.2 | In der Demo: noch „Uhr“ und „Pinnwand“ ausblenden, dann eine andere Karte mit ⠿ an einen neuen Platz ziehen, dann in der Zeile „Termine“ antippen | Die Zeile zeigt die drei Karten beim Namen; nach dem Tipp ist „Termine“ wieder da, an seinem alten Platz, und steht nicht mehr in der Zeile | ✅ (2026-10-29, Claude in der Demo) |
| 133.3 | In der Demo: in der Zeile „Alle zeigen“ antippen | Alle Karten sind wieder da; die Zeile sagt „keine. 👁 an einer Karte blendet sie aus, dann steht sie hier.“ | ✅ (2026-10-29, Claude in der Demo) |
| 133.4 | In der Demo: 🌡 Klima, ✎ Bearbeiten, „＋ Neue Fassung“ (Kopie von „Für alle“), darin zwei Räume ausblenden, dann oben „👪 Für alle“ antippen | In der neuen Fassung sind die zwei Räume weg und stehen mit ihrem Namen in der Zeile; in „Für alle“ sind sie da und die Zeile ist leer | ✅ (2026-10-29, Claude in der Demo) |
| 133.5 | Im Add-on am Tablet: ☀ Heute, ✎, deine Fassung „Eltern“: Termine, Wer ist da und Pinnwand ausblenden, die übrigen Karten anordnen, „✓ Fertig“ | Beim Bearbeiten sieht die Seite schon so aus wie danach; nach „Fertig“ und am Tablet tablet_S2_WE (Fassung „Eltern“) steht alles genau so | ✅ (2026-11-06, Claude im Browser-Test 41_variants: eine Fassung je Benutzer, beim Bearbeiten wie danach) |
| 133.6 | Im Add-on am Handy oder iPad: die Zeile „👁 Ausgeblendet“ mit mehreren Karten | Die Zeile bricht um, alles gut zu tippen, nichts ragt über den Rand | ✅ (2026-11-06, Claude in der Demo mit nachgemachtem iPhone: fünf Karten ausgeblendet, die Zeile „👁 Ausgeblendet“ bricht in vier Reihen um, nichts über dem Rand) |

## 134. Neu in 4.45.0: 🎬 Szenen-Leiste und Karte 🎚️ „Lichtsteuerung“ (#597)
Wunsch des Besitzers vom 2026-10-29 (Bild von ☀ Heute auf dem iPad und Bild der slider-button-card „Light Control“): „über dieser Leiste, die wir da unten haben, … Szenen reinmachen, die man auch, wenn es mehrere Szenen sind, … scrollen kann“ und „diese Lichtkarte … mit diesem Schieberegler … dass man da Gruppen oder auch nur einzelne Lampen hinzufügen kann“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 134.1 | In der Demo (Live): unten über „Haus, Heute, Energie …“ schauen, am Handy die Leiste mit dem Finger seitwärts wischen | Eine Reihe Kacheln (Wohnzimmer gemütlich, TV-Abend, Filmabend …); „Wohnzimmer gemütlich“ hat einen kleinen Punkt (lief zuletzt); am Handy wischt sie seitwärts, der Rand läuft blass aus; die Seite darüber wird nicht verdeckt | ✅ (2026-10-29, Claude in der Demo, iPad und Handy) |
| 134.2 | In der Demo: „Wohnzimmer aus“ antippen | Die Kachel zeigt kurz ✓ grün, danach hat „Wohnzimmer aus“ den Punkt | ✅ (2026-10-29, Claude in der Demo) |
| 134.3 | In der Demo: ☀ Heute, in „Im Haus“ auf „💡 … Lichter an“ tippen | Das Fenster „Lichtsteuerung“ geht auf: je Lampe ein Balken in ihrer Farbe mit „45 %“, „Aus“, „Nicht verfügbar“ (Terrasse, grau), rechts Schalter, oben „Alle aus“ | ✅ (2026-10-29, Claude in der Demo) |
| 134.4 | In der Demo, im Fenster: „Küche Licht“ (aus) mit dem Finger oder der Maus nach rechts bis zur Mitte ziehen, loslassen; dann „TV“ kurz antippen | Beim Ziehen läuft die Zahl mit (z. B. „60 %“), nach dem Loslassen bleibt die Küche bei 60 % an; „TV“ geht aus | ✅ (2026-10-29, Claude in der Demo) |
| 134.5 | In der Demo, im Fenster: bei „Wohnzimmer“ das ▸ antippen | Darunter klappen die drei Lampen der Gruppe auf (Deckenlicht, Stehlampe, LED Sofa), jede mit eigenem Balken | ✅ (2026-10-29, Claude in der Demo) |
| 134.6 | In der Demo: Seite 🔘 Knöpfe, ✎ Bearbeiten: oben „🎬 Szenen-Leiste“, dann bei der Karte „Lichter“ das ⚙ | Fenster „Szenen-Leiste“: Haken „anzeigen“, „Gilt für“ (Alle Seiten oder eine Seite: Wie alle Seiten / Eigene Szenen / Keine Leiste), Kacheln mit Symbol, Name, Farbe, ⠿, ✕, Suche. Karte „Lichtsteuerung“: Lampen mit ⠿ und Suche, „Alle aus“, Gruppen aufklappbar, „Als Karte auf der Seite“ oder „Als Fenster (Popup)“ | ✅ (2026-10-29, Claude in der Demo) |
| 134.7 | Im Add-on am iPad: ✎ Bearbeiten auf ☀ Heute, „🎬 Szenen-Leiste“, deine Szenen (z. B. TV schauen, Wohnzimmer Hell, Esszimmer, Couch) hinzufügen, Namen und Symbole geben, „Speichern“; dann eine Szene antippen und eine gedrückt halten | Die Leiste steht über den Reitern, in der Reihenfolge, die du gezogen hast; der Tipp startet die Szene (✓), gedrückt halten öffnet das Fenster von Home Assistant; die zuletzt gestartete hat den Punkt | ✅ (2026-11-06, Claude im Browser-Test 61_scenebar_lights) |
| 134.8 | Im Add-on am iPad: ✎, „＋ Karte hinzufügen“ → „Lichtsteuerung“, deine Lampen und eine Lichtgruppe dazu (auch eine Zigbee2MQTT-Gruppe), speichern; dann ziehen, tippen, halten | Balken in der Farbe der Lampe; ziehen stellt die Helligkeit erst beim Loslassen; eine Gruppe von Home Assistant hat ▸ mit ihren Lampen (eine Zigbee2MQTT-Gruppe bleibt ein Balken); eine Lampe, die nur schaltet, hat keinen Schieber | ✅ (2026-11-06, Claude im Browser-Test 61_scenebar_lights: Gruppe mit ▸, eine Lampe, die nur schaltet, ohne Schieber, „Alle aus“) |
| 134.9 | Im Add-on am iPad: in der Karte „Als Fenster (Popup)“ und den Haken „Öffnet sich über „💡 … Lichter an““ setzen, speichern, „Fertig“; dann in „Im Haus“ auf „12 Lichter an“ tippen | Das Fenster „Lichtsteuerung“ geht auf; die Karte selbst steht nur beim Bearbeiten (mit „↗ Fenster“) auf der Seite | ✅ (2026-11-06, Claude im Browser-Test 61_scenebar_lights: die Karte als Fenster über „💡 … Lichter an“) |
| 134.10 | Im Add-on am Handy: die Szenen-Leiste wischen, im Lichtfenster ziehen und die Seite hoch und runter scrollen | Wischen geht flüssig, ziehen seitwärts stellt die Helligkeit, hoch und runter scrollt die Seite (ohne eine Lampe zu ändern) | ❓ (Claude 2026-11-06: nur mit dem echten Finger (Wischen gegen Ziehen)) |

## 135. Neu in 4.46.0: 简体中文 Chinesisch als achte Sprache (#587)
Beitrag von aixmoyu (Pull Request #587, vom Stand 4.42.0); der Besitzer am 2026-10-29: „checke mal diesen pull request“, seine Wahl per Auswahl: „Ich übernehme ihn“. Claude hat ihn auf den heutigen Stand gebracht und die 83 neueren Texte übersetzt.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 135.1 | In der Demo: ⚙ → Allgemein → Sprache: „简体中文“ | Die ganze Oberfläche ist auf Chinesisch (Leisten, Reiter „今天“, Karten, Einstellungen), nirgends ein Schlüssel wie „sb.title“ | ✅ (2026-10-29, Claude in der Demo) |
| 135.2 | In der Demo, auf Chinesisch: ☀ 今天, die Szenen-Leiste und „💡 … 盏灯亮着“ (das Lichtfenster) | Auch die neuen Teile aus 4.43 bis 4.45 sind übersetzt („灯光控制“, „全部关闭“, „不可用“) | ✅ (2026-10-29, Claude in der Demo) |
| 135.3 | Ein Browser auf Chinesisch, Sprache „Auto“ | Die Seite kommt gleich auf Chinesisch | ✅ (2026-10-29, Claude in der Demo mit einem chinesischen Browser) |
| 135.4 | Im Add-on: ⚙ → Sprache auf „简体中文“ und gleich wieder auf „Deutsch“ | Alles wieder auf Deutsch, nichts bleibt chinesisch | ✅ (2026-11-06, Claude im Test-Add-on (nachgebauter Home Assistant): Sprache 简体中文 und zurück auf Deutsch, nichts bleibt chinesisch, auch nicht nach dem Neuladen) |

## 136. Neu in 4.47.0: 🎚️ mehrere Lampen in einem Balken der Lichtsteuerung
Der Besitzer am 2026-10-30 mit einem Bild von „Karte „Lichtsteuerung“ einstellen“: „ich kann nicht pro Karte mehrere Lampen hinzufügen … pro Kachel einfach mehrere Lampen verknüpfen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 136.1 | In der Demo (Live): Seite 🔘 Knöpfe, Karte „Lichter“, ganz unten der Balken „✨ Voute“ | „Voute 60 %“ in Lila; ▸ klappt die zwei Lampen auf (Voute Bettseite, Voute Fensterseite, je 60 %) | ✅ (2026-10-30, Claude in der Demo) |
| 136.2 | In der Demo: „Voute“ kurz antippen, dann noch einmal | Erst gehen beide Lampen aus (der Balken grau, „Aus“), dann beide wieder an | ✅ (2026-10-30, Claude in der Demo) |
| 136.3 | In der Demo: ✎ Bearbeiten, bei der Karte „Lichter“ das ⚙; bei „Küche Licht“ auf „＋ Lampe dazu“, „wohn“ tippen, „Wohnzimmer Deckenlicht“ antippen, „Fertig“, Namen „Unten“ geben; dann bei einer Lampe des Balkens das ✕ | Unter „Küche Licht“ stehen die Lampen mit ✕, die Vorschau rechts zeigt „Unten“ mit ▸; nach dem ✕ ist die Lampe weg, der Name „Unten“ bleibt | ✅ (2026-10-30, Claude in der Demo) |
| 136.4 | Im Add-on am iPad: ✎ Bearbeiten, deine Karte „Lichtsteuerung“ ⚙, bei einem Balken „＋ Lampe dazu“ und zwei, drei Lampen eines Raums dazu, Namen geben, „Speichern“, „Fertig“ | Der Balken steht mit deinem Namen auf der Karte; an, wenn eine der Lampen an ist; ▸ zeigt die Lampen einzeln | ✅ (2026-11-06, Claude im Browser-Test 62_light_bars) |
| 136.5 | Im Add-on: den Balken aus 136.4 antippen, dann seitwärts auf etwa die Hälfte ziehen und loslassen | Der Tipp schaltet alle seine Lampen aus (bzw. an); nach dem Ziehen gehen alle auf etwa 50 % (eine Lampe, die nur schaltet, geht an) | ✅ (2026-11-06, Claude im Browser-Test 62_light_bars) |
| 136.6 | Im Add-on: oben in der Karte „Alle aus“ | Alle Lampen gehen aus, auch die in einem Balken mit mehreren Lampen | ✅ (2026-11-06, Claude im Browser-Test 62_light_bars) |

## 137. Neu in 4.48.0: ▦ „Frei anordnen“, die Karten einer Seite auf einem Gitter
Der Besitzer am 2026-10-30 mit einem Bild von 🔘 Knöpfe: „das man die karte platzieren kann wo man will … ein unsichtbares gitter im hintergrund … wenn ich will das eine karte unten rechts ist“. Seine Wahl nach den Beispielbildern `docs/ideen-4.48/`: je Seite einschaltbar, Breite und Höhe, eine andere Karte rutscht nach unten, am Handy untereinander.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 137.1 | In der Demo: Seite 🔘 Knöpfe, ✎ Bearbeiten, oben „▦ Frei anordnen“ | Der Knopf leuchtet, hinter den Karten zeigen sich blasse Felder (12 Spalten), die Karten stehen noch genau dort, wo sie vorher waren; „＋ Abschnitt“ ist weg | ✅ (2026-10-30, Claude in der Demo) |
| 137.2 | In der Demo: „Haustür“ am ⠿ ganz nach unten rechts ziehen und loslassen | Beim Ziehen leuchtet ein blaues Feld, wo sie einrastet; danach steht sie unten rechts, darüber bleibt die Lücke frei | ✅ (2026-10-30, Claude in der Demo) |
| 137.3 | In der Demo: bei „Küche“ die Ecke ↘ nach unten ziehen | Die Karte wird höher (der Knopf füllt sie), „Gute Nacht“ und die Karten darunter rutschen nach unten | ✅ (2026-10-30, Claude in der Demo) |
| 137.4 | In der Demo: „✓ Fertig“, dann die Seite am Handy (oder das Fenster ganz schmal) | Am PC/iPad stehen die Karten auf ihren Plätzen, das Gitter ist unsichtbar; am Handy untereinander, von oben links nach unten rechts | ✅ (2026-10-30, Claude in der Demo, PC, iPad hochkant, Handy) |
| 137.5 | In der Demo: ✎ Bearbeiten, „▦ Frei anordnen“ wieder antippen (aus), dann noch einmal (an) | Aus: die Karten rücken zusammen wie vorher; an: sie stehen wieder auf den Plätzen von eben | ✅ (2026-10-30, Claude in der Demo) |
| 137.6 | Im Add-on am iPad: ✎ auf deiner Seite 🔘 Knöpfe, „▦ Frei anordnen“, ein paar Karten verschieben (auch unten rechts) und größer/kleiner ziehen, „✓ Fertig“ | Alles bleibt dort, wo du es hingesetzt hast, auch nach dem Neuladen und auf einem anderen Gerät | ✅ (2026-11-06, Claude im Browser-Test 63_free_grid) |
| 137.7 | Im Add-on: eine Karte auf eine andere ziehen | Die andere rutscht nach unten, sonst bewegt sich nichts | ✅ (2026-11-06, Claude im Browser-Test 63_free_grid) |
| 137.8 | Im Add-on am Handy: dieselbe Seite ansehen | Die Karten stehen untereinander, nichts ist abgeschnitten oder überlappt | ✅ (2026-11-06, Claude im Browser-Test 63_free_grid: am Handy stehen die Karten untereinander) |

## 138. Neu in 4.50.0: 🪟 Vorhänge zur Seite und jeder Fensterflügel für sich (#606)
Ein Beitrag von aixmoyu (#606). Der Besitzer am 2026-10-31: „Schau dir mal #606 an“, dann „Ich übernehme ihn“. Die Felder stehen beim Bearbeiten im Seitenfenster eines Fensters: „Anzahl Flügel“ und „Fenster öffnet“ (je Flügel) unter „Ausführung“, „Vorhangart“ unter dem Haken „Vorhang / Rollladen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 138.1 | In der Demo: ✎ Bearbeiten, Erdgeschoss, ein Fenster im Wohnzimmer antippen, Haken „Vorhang / Rollladen“, bei „Vorhangart“ „Nach links aufziehen“, als Entität `cover.wohnzimmer`; dann Live und das 🪟 am Fenster antippen | Innen hängt ein Vorhang an einer Stange, links zusammengeschoben, so weit der Rollladen offen ist; über dem Fenster „← … % offen“; die Karte heißt „Vorhang / Rollladen“ mit „Nach links aufziehen“, „Stopp“, „Nach rechts schließen“ | ✅ (2026-10-31, Claude in der Demo) |
| 138.2 | In der Demo: beim selben Fenster „Vorhangart“: „Mittig nach beiden Seiten“ | Zwei Vorhanghälften: offen an beiden Seiten zusammengeschoben, zu treffen sie sich in der Mitte; über dem Fenster „⇔“; die Karte hat „Mittig nach beiden Seiten“ und „Zur Mitte schließen“ | ✅ (2026-10-31, Claude in der Demo) |
| 138.3 | In der Demo: beim selben Fenster „Anzahl Flügel“ 3, bei „Flügel 1 · Fenster öffnet“ „Links angeschlagen“, bei Flügel 3 „Rechts angeschlagen“; unter „Einzelne Flügel“ jedem Flügel `binary_sensor.fenster_wohnzimmer` geben (meldet in der Demo „offen“) | Drei Felder, eins je Flügel; die offenen Flügel: Flügel 1 dreht sich um seine linke Kante, Flügel 3 um seine rechte Kante wie eine Tür in den Raum, Flügel 2 kippt oben nach innen | ✅ (2026-10-31, Claude in der Demo, mit ausgedachten Kontakten) |
| 138.4 | Im Add-on: ein Fenster mit deinem Rollladen ansehen und in Live bedienen | Alles wie vorher: der Rollladen fährt außen hoch und runter, über dem Fenster „↕ … % offen“, die Karte hat „Hoch“, „Stopp“, „Runter“ | ✅ (2026-11-06, Claude im Browser-Test 03_houses: der Rollladen fährt außen, „↕ … %“ über dem Fenster, die Karte mit Hoch, Stopp, Runter) |
| 138.5 | Im Add-on: ein Fenster, bei dem nur manche Flügel einen eigenen Kontakt haben (falls du so eins hast), Fenster öffnen | (seit 4.50.1) Ein Flügel mit eigenem Kontakt folgt diesem, ein Flügel ohne Kontakt dem Hauptkontakt des Fensters, wie vor 4.50.0; der Rahmen wird rot, und das Raum-Fenster zeigt jeden Flügel mit Kontakt | ✅ (2026-11-06, Claude im Browser-Test 03_houses: ein Flügel mit Kontakt folgt diesem, einer ohne dem Hauptkontakt) |
| 138.6 | Im Add-on: ein gekipptes Fenster in 3D ansehen (Kontakt meldet „offen“) | Der Flügel kippt in den Raum hinein, nicht nach außen | ✅ (2026-11-06, Claude im Browser-Test 69_window_tilt: der gekippte Flügel lehnt sich in den Raum, um die Unterkante) |
| 138.7 | Im Add-on, nur wenn du einen Vorhang mit Motor hast: ihm die passende „Vorhangart“ geben und in Live auf- und zufahren | Der Vorhang in 3D geht zur richtigen Seite auf (links und rechts so, wie man im Raum steht und hinausschaut) | ✅ (2026-11-06, Claude im Browser-Test 03_houses: „Vorhangart“ mit 4 Arten, „Mittig nach beiden Seiten“ gespeichert, ⇔ über dem Fenster; mit einem echten Motor-Vorhang nur du) |

## 139. Neu in 4.50.1: ein Fensterflügel kann „Fest“ sein, ein Flügel ohne Kontakt folgt wieder dem Hauptkontakt (#606)
aixmoyu hat #606 kurz vor dem Merge von 4.50.0 noch verbessert. Der Besitzer am 2026-10-31: „Ja, als 4.50.1“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 139.1 | In der Demo: ✎ Bearbeiten, ein Fenster mit „Anzahl Flügel“ 3, bei „Flügel 2 · Fenster öffnet“ „Fest (öffnet nicht)“ | Flügel 2 hat unter „Einzelne Flügel“ kein Kontaktfeld mehr (dort steht „Flügel 2 · Fest (öffnet nicht)“); meldet der Hauptkontakt „offen“, gehen Flügel 1 und 3 auf, Flügel 2 bleibt zu | ✅ (2026-10-31, Claude im Test-Add-on) |
| 139.2 | In der Demo: Live, das 🪟 an einem Fenster mit Rollladen (ohne Vorhangart) antippen | Die Karte heißt „Rollladen“ (nicht „Vorhang / Rollladen“), mit „Hoch“, „Stopp“, „Runter“ | ✅ (2026-10-31, Claude im Test-Add-on) |
| 139.3 | Im Add-on: dein Dreifachfenster (falls du eins hast) mit festem Mittelteil: Flügel 2 auf „Fest“, dann das Fenster öffnen | Nur die Flügel, die wirklich aufgehen, drehen sich in 3D; der Mittelteil bleibt zu | ✅ (2026-11-06, Claude im Browser-Test 03_houses: ein Flügel „Fest“ geht nie auf, die anderen folgen ihrem Kontakt) |

## 140. Neu in 4.51.0: 📅 besondere Tage in Abläufen, feste Stufen auf der Rollladen-Karte
Der Besitzer am 2026-11-01: „an Heiligabend soll zum Beispiel der Rollladen nicht ganz hochfahren, obwohl die Rollladensteuerung sagt, dass jeden Tag 7 Uhr etwas gesteuert wird“ und „bei der Rollladensteuerungskarte … eine Voreinstellung mit 50 %, 75 %, 100 % und 0 %“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 140.1 | In der Demo: ▶ Abläufe, bei „Eigene Abläufe“ auf „📅 Besondere Tage“ tippen | Ein Fenster mit drei Tagen: „Feiertage Baden-Württemberg“ (mit dem nächsten Feiertag und Bundesland-Auswahl), „🎄 Heiligabend“, „🎃 Halloween“; oben „Heute: …“ oder „Heute ist kein besonderer Tag“; unten Vorschläge zum Antippen (Heiligabend und Halloween sind schon da und darum blass) | ✅ (2026-11-02, Claude in der Demo) |
| 140.2 | Im selben Fenster „🏖️ Urlaub“ und „🗓️ Kalender“ antippen, beim Kalender einen wählen, dann „✓ Speichern“ | Urlaub hat „Von“ und „Bis“ (heute bis in 13 Tagen) und sagt „nächstes Mal heute“; „Speichern“ geht erst, wenn beim Kalender einer gewählt ist; danach steht „📅 Besondere Tage (5)“ auf dem Knopf | ✅ (2026-11-02, Claude in der Demo) |
| 140.3 | In der Demo: den Ablauf „Rollläden am Morgen“ öffnen (✏️), den blauen Baustein „heute ist nicht …“ antippen | Zwei Wege um 07:00: Weg 1 „heute ist nicht Heiligabend, Feiertage …“ → Rollläden hoch, Weg 2 „heute ist Heiligabend, Feiertage …“ → 50 %; rechts „Nur wenn heute …“, die Tage zum Antippen und „📅 Tage verwalten …“ | ✅ (2026-11-02, Claude in der Demo) |
| 140.4 | In der Demo: „＋ Neuer Ablauf“, links „Uhrzeit“ und „Rollladen“ (ein Rollladen, „hoch“), dann den gelben Baustein 07:00 antippen, rechts unter „An besonderen Tagen anders“ „Heiligabend“ und „＋ Weg für diese Tage anlegen“; beim neuen Rollladen-Baustein „Position“ 50 | Aus einem Weg werden zwei: „heute ist nicht Heiligabend“ → hoch, „heute ist Heiligabend“ → 50 %; unten „In Worten“ steht genau das | ✅ (2026-11-02, Claude in der Demo) |
| 140.5 | In der Demo: ☀ Heute, ✎ Bearbeiten, „＋ Karte hinzufügen“, „Rollladen“, „Rollladen Wohnzimmer“ | Unter „Feste Stufen“ sind 0 %, 50 %, 75 %, 100 % markiert; die Vorschau zeigt unter ▲ ■ ▼ die Knöpfe 0 % · 50 % · 75 % · 100 %; antippen nimmt eine Stufe dazu oder weg (höchstens 6) | ✅ (2026-11-02, Claude in der Demo) |
| 140.6 | Die Karte speichern, „Fertig“, auf der Karte „75 %“ antippen | Der Rollladen fährt auf 75 %, die Karte zeigt groß „75 %“, der Knopf „75 %“ ist blau umrandet | ✅ (2026-11-02, Claude in der Demo) |
| 140.7 | Im Add-on: auf einer Seite eine Rollladen-Karte mit deinem Rollladen, die Stufen antippen | Dein Rollladen fährt auf 0 %, 50 %, 75 % und 100 %; die Karte zeigt, wo er steht | ✅ (2026-11-06, Claude im Browser-Test 64_special_days: die Rollladen-Karte hat 0 · 50 · 75 · 100 %; in der Demo am 2026-11-01 (140.4)) |
| 140.8 | Im Add-on: ▶ Abläufe → „📅 Besondere Tage“ → „Feiertage“, Bundesland Baden-Württemberg, und „📌 Morgen (einmal)“, speichern | Bei den Feiertagen steht der nächste Feiertag (z. B. „1. Weihnachtstag“); morgen steht mit Datum da | ✅ (2026-11-06, Claude im Browser-Test 64_special_days: Feiertage Baden-Württemberg nennen den nächsten, gespeichert für alle Abläufe) |
| 140.9 | Im Add-on: deinen Ablauf für die Rollläden am Morgen öffnen, den Auslöser (Uhrzeit) antippen, „An besonderen Tagen anders“ mit „Morgen“ und „Feiertage“, im neuen Weg den Rollladen auf „Position“ 50, speichern (🏠 Home Assistant) | Gespeichert ohne Fehler; in Home Assistant (↗) haben die Automationen eine Bedingung „Vorlage“ mit den Daten; am nächsten Morgen fährt der Rollladen nur auf 50 % | ✅ (2026-11-06, Claude im Browser-Test 64_special_days: die Automation in Home Assistant beginnt mit der Bedingung „Vorlage“ für den Tag) |
| 140.10 | Im Add-on: dasselbe mit einem Ablauf „⚙️ Add-on“ (läuft im Add-on statt in Home Assistant) | Am besonderen Tag läuft der Weg mit 50 %, an den anderen Tagen der normale; im 📜 Protokoll von ▶ Abläufe steht, welcher Weg lief | ✅ (2026-11-06, Claude in tests/test_flows.py: an einem besonderen Tag läuft der andere Weg) |

## 141. Neu in 4.52.0: 🎬 Video-Anleitung, jede Funktion als kurzes Video
Der Besitzer am 2026-11-02: „ein Programm …, das mir automatisch jede Funktion in einem kleinen Kurzvideo aufnimmt, so dass man es durchsuchen kann … wie eine riesige Anleitung … hochwertig“; dazu: der Knopf nur für Admins, das Add-on nicht groß machen, für ein Haus ohne Internet die Videos auf Knopfdruck speichern. Die Videos gibt es erst nach dem Merge (der Workflow „Video guide“ nimmt sie auf, etwa eine halbe Stunde).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 141.1 | Im Test-Add-on als Admin und als Tablet ohne Bearbeiten | Als Admin steht oben „🎬 Anleitung“; ein Tipp öffnet ein großes Fenster mit der Seite der Anleitung, „📥 Für ohne Internet speichern (… MB)“ und „Die Videos kommen aus dem Internet (GitHub)“; das Tablet hat keinen Knopf | ✅ (2026-11-02, Claude im Browser-Test 65_guide, mit einer nachgebauten Seite) |
| 141.2 | Die Seite https://burned4aim.github.io/HA-Floorplanner/guide/ öffnen | Oben „Alles, was dein 3D-Grundriss kann, in kurzen Videos“, eine große Suche, darunter die Bereiche (Erste Schritte, Bedienen, Seiten, Plan zeichnen, Seiten gestalten, Einstellungen, Handy und Tablet) mit je einem Bild pro Video; mit der Maus über einem Bild spielt eine kleine Vorschau | ✅ (2026-11-02) |
| 141.3 | In die Suche „Rollladen“ schreiben | Nur passende Videos, das Wort gelb markiert; unter einem Video die Schritte mit Sekunde (z. B. „0:07 … Rollladen …“); ein Tipp darauf spielt das Video genau ab dort | ✅ (2026-11-02) |
| 141.4 | Ein Video abspielen | Scharfes Bild, ein weicher Mauszeiger mit blauem Kreis bei jedem Klick; unten der Untertitel zum Schritt, rechts alle Schritte (der aktuelle blau, antippen springt); „Untertitel aus“, „1×“ (Tempo), „‹ ›“ zum nächsten Video, am Ende „Weiter: …“ | ✅ (2026-11-02) |
| 141.5 | Oben rechts „EN“ antippen | Alles auf Englisch, auch die Untertitel; die Videos zeigen die englische Oberfläche | ✅ (2026-11-02) |
| 141.6 | Die Seite am Handy öffnen | Eine Spalte, die Suche passt, das Video füllt die Breite, die Schritte stehen darunter | ✅ (2026-11-06, Claude in der Demo mit nachgemachtem iPhone: die Seite der Anleitung (aus dem Zweig guide-videos gebaut) ist eine Spalte, 390 px breit wie der Bildschirm, das Video 370 px, die Schritte darunter (#619 repariert)) |
| 141.7 | Im Add-on: „🎬 Anleitung“, dann „📥 Für ohne Internet speichern“ | Oben „Wird gespeichert … x von y Dateien“, nach ein paar Minuten „Im Add-on gespeichert (… MB, Datum), geht auch ohne Internet“; die Videos spielen weiter (jetzt aus dem Add-on), der Knopf heißt „↻ Gespeicherte Videos erneuern“ | ❓ (Claude 2026-11-06: die Knöpfe gehen (Browser-Test 65_guide); das Herunterladen von GitHub ist von hier aus gesperrt) |
| 141.8 | Im Add-on: „🗑 Gespeicherte löschen“, bestätigen | Wieder „Die Videos kommen aus dem Internet (GitHub)“; das Add-on hat die Kopie nicht mehr | ❓ (Claude 2026-11-06: wie 141.7) |
| 141.9 | Auf der Seite der Anleitung ganz nach unten | „📋 Alle Funktionen von A bis Z“: jede Funktion mit ▶ zu ihrem Video, ein paar mit „📄 ohne Video“ und dem Grund; ein Tipp auf ▶ spielt das Video ab | ✅ (2026-11-06, Claude auf der Seite der Anleitung: „Alle Funktionen von A bis Z“, 96 Funktionen, 91 mit ▶, 5 „ohne Video“; ▶ spielt es ab) |
| 141.10 | Ein paar der neuen Videos anschauen, z. B. „Einen Grundriss nachzeichnen“, „Dach und Gauben“, „Schrank nach Maß“, „Türklingel mit Kamera“ | Jedes zeigt die Funktion von Anfang bis Ende, mit Untertiteln und Schritten | ✅ (2026-11-06, Claude hat das Video „Grundriss nachzeichnen, Dach und Gauben, Schrank nach Maß, Türklingel“ Bild für Bild angesehen (Aufnahme mit 4.67.1): jedes von Anfang bis Ende mit Untertiteln und Schritten) |
| 141.11 | Nach dem Update auf der Seite der Anleitung das Video „Ein Fenster einstellen: Flügel, Rollladen, Vorhang“ ansehen | Ein Fenster wird angeklickt, bekommt zwei Flügel (links und rechts angeschlagen), mit dem Kontakt gehen sie im Bild auf; dann „Vorhang / Rollladen“, ein Vorhang, der sich in der Mitte teilt und zu 60 % offen steht | ✅ (2026-11-06, Claude hat das Video „Ein Fenster einstellen“ Bild für Bild angesehen (Aufnahme mit 4.67.1): zwei Flügel links und rechts, mit dem Kontakt rot und offen, Vorhang „60 % offen“) |

## 142. Neu in 4.53.0: 🗄️ das Backup hat alles, auch die Codes und die Aufzeichnungen
Der Besitzer am 2026-11-02: „ein Backup sollte ja immer alles sein“; seine Wahl: die Codes immer (nur als Fingerabdruck), die CallMeBot-Schlüssel und die Aufzeichnungen mit je einem Häkchen. Die Videos der Anleitung werden ab jetzt bei jeder Änderung mit geprüft.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 142.1 | Oben „🗄️ Backup“ öffnen | Der Text oben sagt „Sichert alles …“ mit den Codes „nur als unlesbarer Fingerabdruck“; unter den Knöpfen zwei Häkchen: „Aufzeichnungen mitsichern …“ (an) und „CallMeBot-Schlüssel mitsichern …“ (aus) | ✅ (2026-11-02, Claude im Browser-Test 02_tools) |
| 142.2 | Im Add-on: im Backup-Fenster „Jetzt sichern“, dann „Neueste prüfen“ | „Sicherung in Ordnung: … Häuser, … Bilder, … Modelle (… MB). Dazu … Tage Aufzeichnung.“ | ✅ (2026-11-06, Claude in tests/test_backups.py und tests/test_server.py: sichern, prüfen, mit Aufzeichnung) |
| 142.3 | Im Add-on: das Häkchen „CallMeBot-Schlüssel mitsichern“ setzen, „Jetzt sichern“, „Neueste prüfen“; danach das Häkchen wieder raus | Die Meldung endet mit „Mit den CallMeBot-Schlüsseln.“ (nur wenn du WhatsApp oder Telegram über CallMeBot eingerichtet hast) | ✅ (2026-11-06, Claude in tests/test_server.py: die CallMeBot-Schlüssel nur mit dem Häkchen) |
| 142.4 | Im Add-on: „Backup herunterladen“. Dann in ⚙ → Urlaubs-Alarmanlage einen neuen Code setzen. Danach „Backup einspielen…“ mit der Datei | Der alte Code gilt wieder (die Alarmanlage lässt sich mit dem alten Code scharf und wieder aus schalten, nicht mit dem neuen) | ✅ (2026-11-06, Claude in tests/test_server.py: nach dem Einspielen gilt der alte Code wieder, nicht der neue) |
| 142.5 | Im Add-on: nach 142.4 oben „🛡️ Sicherheit“ öffnen | Alle aufgezeichneten Tage sind noch da, auch der heutige läuft weiter | ✅ (2026-11-06, Claude in tests/test_server.py: aufgezeichnete Tage werden nur ergänzt) |
| 142.6 | Nach dem Update auf der Seite der Anleitung das Video „Backup: alles sichern und zurückholen“ ansehen | Es zeigt die zwei Häkchen und sagt, was in der Datei steht | ✅ (2026-11-06, Claude hat das Video „Backup: alles sichern und zurückholen“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |
| 142.7 | Nach dem Update das Video „Messen, Wände genau verschieben und drehen“ ansehen | Erst zwei Punkte gemessen; dann zwei Wände angeklickt, das Innenmaß 5 m eingetippt: die Wand rückt, die Küche wird größer; dann zwei Wände an einer Ecke auf 75° gedreht, Strg+Z nimmt es zurück | ✅ (2026-11-06, Claude hat das Video „Messen, Wände genau verschieben und drehen“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 143. Neu in 4.54.0: 🏠 ein L-förmiges Dach, ein weiteres Dach wie das Hauptdach
Mario (LoggieXC81) in der Q&A-Diskussion #621: Fügt er ein zweites Dach hinzu, wird der Kniestock vom Hauptdach nicht übernommen; beide Dächer kamen nicht auf die gleiche Höhe (Issue #625). Jetzt hat „Sitzt auf“ eines weiteren Dachs die Wahl „wie das Hauptdach“, und die Wände unter dem zweiten Dach folgen seinen Schrägen.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 143.1 | Dach-Etage mit „Ausgebauter Dachstuhl“ (Kniestock 1 m) und „Größe selbst festlegen“ über einem Teil des Hauses; „+ Weiteres Dach“ | Ein Satteldach „Sitzt auf: wie das Hauptdach“ über dem Rest des Hauses, bis zum First des Hauptdachs; in „Sitzt auf“ steht „wie das Hauptdach“ ganz oben | ✅ (2026-11-02, Claude im Browser-Test 10_roofs) |
| 143.2 | Wie 143.1, dann „Sitzt auf“ zwischen „wie das Hauptdach“ und „ganz oben“ wechseln | „wie das Hauptdach“: beide Dächer gleich hoch, die Wände des Geschosses darunter an beiden Dächern abgeschnitten; „ganz oben“: das zweite Dach höher | ✅ (2026-11-02, Claude im Browser-Test 10_roofs) |
| 143.3 | Demo: „Bearbeiten“, links die Etage „Dach“, rechts „Etage verwalten“: „Ausgebauter Dachstuhl“ anhaken, „Größe selbst festlegen“ anhaken und die „Breite“ halbieren (10 → 5); dann unten „+ Weiteres Dach“ | Das Hauptdach liegt nur noch über der linken Hälfte; das neue „Dach 1“ liegt quer dazu über dem Rest, mit der gleichen Traufhöhe, „Sitzt auf: wie das Hauptdach“; beide Dächer treffen sich | ✅ (2026-11-06, Claude in der Demo: Breite 10 → 5, „+ Weiteres Dach“: „Dach 1“ quer über der rechten Hälfte, gleiche Traufhöhe, „Sitzt auf: wie das Hauptdach“) |
| 143.4 | Nach 143.3 die Etage unter dem Dach (z. B. Dachgeschoss) antippen | Die Wände unter dem zweiten Flügel sind da: niedrig (Kniestock) an den langen Seiten, ein Giebel am Ende; nicht mehr ganz weg | ✅ (2026-11-06, Claude in der Demo: im Dachgeschoss folgen die Wände beiden Dächern, Giebel am Ende) |
| 143.5 | Nach 143.3 bei „Dach 1“ „Sitzt auf“ auf „ganz oben (auf dem Haus)“ und zurück auf „wie das Hauptdach“ stellen | „ganz oben“: das zweite Dach springt höher; „wie das Hauptdach“: wieder gleich hoch | ✅ (2026-11-06, Claude in der Demo: „ganz oben“ springt 2 m höher, „wie das Hauptdach“ wieder gleich hoch) |
| 143.6 | Nach dem Update auf der Seite der Anleitung das Video „Ein L-förmiges Dach (zweiter Flügel)“ ansehen | Ein L-Haus, das Dach nur über einem Flügel; „+ Weiteres Dach“ legt das zweite darüber; „wie das Hauptdach“; im Dachgeschoss folgen die Wände beiden Schrägen | ✅ (2026-11-06, Claude hat das Video „Ein L-förmiges Dach (zweiter Flügel)“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 144. Neu in 4.55.0: 🏠 Giebelwand, Überstand am Giebel, Pultdach und Vordach
christinloehner in #628: Das Satteldach lag an der Giebelseite als rotes Dreieck vor der Wand, abgeschnittene Wände waren oben offen, und ein schräges Vordach an einer Seite ging nicht. Jetzt geht die Wand unter dem Giebel bis unters Dach (in der Farbe der Wände), der Überstand am Giebel hat ein eigenes Feld, es gibt die Dachform „Pultdach“ und den Knopf „+ Vordach“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 144.1 | Ein Haus mit Satteldach ansehen | Unter jedem Giebel eine Wand in der Farbe der Wände, auf der Hauswand (nicht mehr ein rotes Dreieck außen am Überstand) | ✅ (2026-11-02, Claude im Browser-Test 66_gables) |
| 144.2 | Dach-Etage, „Etage verwalten“: „Überstand am Giebel (Ortgang)“ auf 0,1 m | Das Dach steht am Giebel nur noch 10 cm über, an der Traufe weiter 40 cm | ✅ (2026-11-02, Claude im Browser-Test 66_gables) |
| 144.3 | Das Häkchen „Giebelwand (die Wand geht bis unters Dach)“ weg und wieder an | Ohne Häkchen: wieder das Dreieck in Dachfarbe; mit: die Wand | ✅ (2026-11-02, Claude im Browser-Test 66_gables) |
| 144.4 | „Dachform“ → „Pultdach“, dann „Hohe Seite“ auf „rechts im Plan“ | 10° Neigung, „Hohe Seite“ statt „Firstrichtung“, keine Gauben; rechts kein Überstand, die Wände gehen an den Seiten und rechts bis unters Dach; im 2D-Plan ist die hohe Seite eine durchgezogene Linie | ✅ (2026-11-02, Claude im Browser-Test 66_gables) |
| 144.5 | Unten bei „Weitere Dächer“ „+ Vordach“ | Ein Pultdach vor der langen Seite, so lang wie das Haus, 2,5 m tief, gleich unter der Traufe, ohne Wände darunter | ✅ (2026-11-02, Claude im Browser-Test 66_gables) |
| 144.6 | Demo: „Bearbeiten“, links die Etage „Dach“, das Haus von der Giebelseite ansehen; rechts in „Etage verwalten“ „Überstand am Giebel“ auf 0,1 stellen | Am Giebel eine Wand in Wandfarbe, kein rotes Dreieck mehr; mit 0,1 endet das Dach dort kurz hinter der Wand | ✅ (2026-11-06, Claude in der Demo: Giebelwand in Wandfarbe, Überstand am Giebel 0,1 m) |
| 144.7 | Demo: nach 144.6 unten „+ Vordach“, dann in seiner Karte „Höher setzen“ auf -1 und „Neigung“ auf 15 | Ein schräges Vordach vor dem Haus unter der Traufe; mit -1 sitzt es 1 m tiefer, mit 15° ist es steiler | ✅ (2026-11-06, Claude in der Demo: Vordach unter der Traufe, -1 m tiefer, 15° steiler. Es kommt an die untere lange Seite im Plan, in der Demo die Gartenseite) |
| 144.8 | Demo: „Dachform“ des Hauptdachs auf „Pultdach“ und „Hohe Seite“ durchprobieren, dann zurück auf „Satteldach“ | Das ganze Dach hat eine Schräge, die hohe Seite wechselt; zurück: wieder das Satteldach mit den Gauben | ✅ (2026-11-06, Claude in der Demo: Pultdach und „Hohe Seite“ gingen; zurück auf Satteldach waren in 4.67.1 die Gauben weg und das Dach blieb auf 10° → #669, repariert in 4.67.2, siehe 163) |
| 144.9 | Im Add-on mit deinem Haus: die Giebel ansehen und die Etage unter dem Dach (Dachgeschoss) | Die Giebel sind Wände (in deiner Fassade), die Wände unter den Schrägen sind oben geschlossen, nicht hohl | ✅ (2026-11-06, Claude in der Demo (Dachgeschoss mit Kniestock): die Giebel sind Wände, die Wände unter den Schrägen oben geschlossen; im Browser-Test 66_gables; dein Haus nicht) |
| 144.10 | Nach dem Update auf der Seite der Anleitung das Video „Giebelwand, Pultdach und Vordach“ ansehen | Die Giebelwand, der Überstand am Giebel (15 cm), „+ Vordach“, das ganze Dach als Pultdach und zurück | ✅ (2026-11-06, Claude hat das Video „Giebelwand, Pultdach und Vordach“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 145. Neu in 4.56.0: 📱 Bearbeiten am Handy
biggilottecassi in #624: „Was auch noch schön wäre, wenn man am Handy auch was bearbeiten könnte.“ Seit 3.63.0 (#299) zeigte das Handy nur das Haus. Jetzt bietet das ☰-Menü wieder „Bearbeiten“ an; der Editor hat am Handy eine eigene Aufteilung (oben eine Leiste, die Werkzeuge zum Wischen, unten die Einstellungen).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 145.1 | Am Handy öffnen, oben links ☰ | Es startet wie bisher mit dem Haus (Live, 3D); im Menü steht wieder „Bearbeiten“ | ✅ (2026-11-02, Claude im Browser-Test 67_phone_edit) |
| 145.2 | ☰ → „Bearbeiten“ | Oben ☰, „2D“ / „3D“, ↶ ↷ und „Speichern“; darunter die Werkzeuge in einer Reihe, die man zur Seite wischt; unten die Seitenleiste ohne die Hilfe zu Tasten und Maus | ✅ (2026-11-02, Claude im Browser-Test 67_phone_edit) |
| 145.3 | „2D“, „Wand“, mit dem Finger zwei Punkte tippen, am zweiten zweimal tippen; dann ↶ | Eine Wand ist gezeichnet, zweimal tippen beendet sie; ↶ nimmt sie wieder weg | ✅ (2026-11-02, Claude im Browser-Test 67_phone_edit) |
| 145.4 | „Auswählen“, eine Wand oder ein Fenster antippen; dann „Mehr“ in der Werkzeugleiste | Unten stehen zuerst seine Einstellungen; „Mehr“ klappt unter dem Knopf auf und bleibt im Bildschirm | ✅ (2026-11-02, Claude im Browser-Test 67_phone_edit) |
| 145.5 | Im Editor ☰ öffnen, dann „Live“ | Die Liste mit Live, 2D + 3D, Einpassen, + Etage, Haus, ⚙; das Bild springt dabei nicht; „Live“ zeigt wieder das Haus in 3D | ✅ (2026-11-02, Claude im Browser-Test 67_phone_edit) |
| 145.6 | Das Handy quer halten und bearbeiten | Werkzeuge, 2D / 3D und „Speichern“ stehen in einer Reihe | ✅ (2026-11-02, Claude im Browser-Test 67_phone_edit) |
| 145.7 | Demo an deinem Handy: ☰ → „Bearbeiten“, ein paar Werkzeuge ausprobieren (Wand zeichnen, ein Gerät setzen, ein Fenster antippen und seinen Kontakt sehen) | Geht mit dem Finger, nichts ist verdeckt oder zu klein | ✅ (2026-11-06, Claude in der Demo mit nachgemachtem iPhone: ☰ → Bearbeiten, mit zwei Fingern zoomen, eine Wand mit dem Finger, ein Gerät gesetzt, ein Fenster angetippt (Kontakt steht da). Hinweis: die Knöpfe oben im Bild („Etagen im Plan“, ⚠, 🔍) liegen über dem oberen Rand des Plans; dort den Plan etwas schieben) |
| 145.8 | Im Add-on am Handy (Home-Assistant-App): ☰ → „Bearbeiten“, etwas ändern, „Speichern“, dann am PC ansehen | Die Änderung ist auch am PC da | ❓ (Claude 2026-11-06: Bearbeiten am Handy geht (nachgemachtes iPhone, 145.7); in der echten Home-Assistant-App bitte du) |
| 145.9 | Nach dem Update auf der Seite der Anleitung das Video „Am Handy bearbeiten“ ansehen | ☰ → Bearbeiten, die Leiste wird gewischt, eine Wand mit dem Finger, ein Fenster mit seinem Kontakt, zurück zu Live | ✅ (2026-11-06, Claude hat das Video „Am Handy bearbeiten“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 146. Neu in 4.57.0: 🚗 mehrere Autos im Haushalt
Zelos001 in #631: Im Haushalt ging nur ein Auto, er hat zwei Elektroautos. Jetzt gibt es in ⚙ → Reiter unten → Haushalt den Knopf „＋ Weiteres Auto“, und jedes Auto hat seine eigene Karte.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 146.1 | ⚙ → Reiter unten → „＋ Weiteres Auto“, beim Ladestand einen Sensor wählen, einen Namen tippen | Ein Kasten „🚗 Auto 2“, die Wahl wird gleich gespeichert | ✅ (2026-11-02, Claude im Browser-Test 47_car_garden) |
| 146.2 | Danach den Reiter „Haushalt“ öffnen | Zwei Auto-Karten: das erste Auto wie bisher, das zweite mit seinem Namen und seinem Ladestand (ohne die Reichweite des ersten) | ✅ (2026-11-02, Claude im Browser-Test 47_car_garden) |
| 146.3 | In ⚙ beim zweiten Auto auf × tippen | Der Kasten ist weg, im Haushalt nur noch ein Auto | ✅ (2026-11-02, Claude im Browser-Test 47_car_garden) |
| 146.4 | Demo: ⚙ → „Reiter unten“ → „＋ Weiteres Auto“, bei „Ladestand“ „Zweitwagen Ladestand“ wählen, Name „Zweitwagen“; dann den Reiter „Haushalt“ | Eine zweite Karte „Zweitwagen“ mit 82 % neben „Auto“ mit 64 % | ✅ (2026-11-06, Claude in der Demo: „＋ Weiteres Auto“, Zweitwagen Ladestand: zweite Karte „Zweitwagen“ 82 % neben „Auto“ 64 %) |
| 146.5 | Demo: im Haushalt „✎ Bearbeiten“, die Karte „Zweitwagen“ verschieben oder ausblenden | Sie lässt sich wie jede andere Karte verschieben und ausblenden | ✅ (2026-11-06, Claude in der Demo: ✎ Bearbeiten, mit ⠿ nach vorn gezogen, mit 👁 ausgeblendet (steht dann in „👁 Ausgeblendet“)) |
| 146.6 | Im Add-on mit deinem Auto (oder einem zweiten, falls du eins hast): „＋ Weiteres Auto“ mit seinen Sensoren | Jedes Auto hat im Haushalt seine Karte mit Ladestand, Reichweite, „lädt“ | ✅ (2026-11-06, Claude im Browser-Test 47_car_garden: „＋ Weiteres Auto“ mit eigenen Sensoren und Namen, zwei Karten (64 % und 41 %)) |
| 146.7 | Nach dem Update auf der Seite der Anleitung das Video „Mehrere Autos im Haushalt“ ansehen | „＋ Weiteres Auto“, Ladestand und Name wählen, danach zwei Auto-Karten | ✅ (2026-11-06, Claude hat das Video „Mehrere Autos im Haushalt“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 147. Neu in 4.58.0: ⛰ Gelände am Hang
christinloehner in #629: Ihr Grundstück fällt zur Straße um ein ganzes Geschoss; das Garagentor ist im Keller, der Balkon im Erdgeschoss liegt vorne 2,5 m hoch. Im Programm war der Rasen überall flach, der Keller ganz in der Erde. Jetzt hat das Werkzeug „Grundstück“ den Modus „⛰ Gelände“ mit Höhenpunkten, „Hang in einem Schritt“ und Höhenlinien; im 3D-Bild folgen Rasen, Erde, Wege und Gartendinge dem Boden, vorne steht der Keller frei.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 147.1 | „Grundstück“ → „⛰ Gelände“ → „Tiefe Seite antippen“ und vor das Haus in den Plan tippen | Zwei Höhenpunkte: hinten ±0,00 m, vorne −3,00 m, rechtwinklig zum Haus; Höhenlinien alle 0,5 m mit ihrer Höhe | ✅ (2026-11-02, Claude im Browser-Test 68_terrain) |
| 147.2 | Danach das 3D-Bild ansehen | Vorne liegt der Boden 3 m tiefer, der Keller steht frei, der Teil ohne Keller steht auf einem Sockel; ein Baum vorne steht unten, die Lampe an der Fassade und das Sofa drinnen bleiben; der Weg geht den Hang hinunter, die Terrasse (Plateau) bleibt eben | ✅ (2026-11-02, Claude im Browser-Test 68_terrain) |
| 147.3 | Höhe eines Punkts eintippen, einen Punkt in den Plan tippen, ihn ziehen, mit ✕ entfernen, „Höhenlinien“ auf 1 m, „Gelände entfernen“ | Alles wirkt sofort; nach „Gelände entfernen“ ist der Boden wieder eben | ✅ (2026-11-02, Claude im Browser-Test 68_terrain) |
| 147.4 | „Ganzes Haus“ von vorne (der tiefen Seite) und von hinten ansehen | Vorne kein Schnitt durch die Erde (der Vorgarten bleibt), hinten der Schnitt mit den Erdschichten | ✅ (2026-11-02, Claude im Browser-Test 68_terrain) |
| 147.5 | Demo: „Bearbeiten“, Erdgeschoss, „Grundstück“ → „⛰ Gelände“ → „Tiefe Seite antippen“, oben vor dem Haus (beim Beet) in den Plan tippen, dann „3D“ und „Ganzes Haus“ | Der Keller steht vorne frei, Hof, Beet, Zaun und Bäume liegen unten auf Straßenhöhe, hinten ist der Garten auf der Höhe des Erdgeschosses | ✅ (2026-11-06, Claude in der Demo: „Hang angelegt: vorne 3.00 m tiefer“, der Keller steht vorne frei. Hinweis: „Hang in einem Schritt“ ersetzt die Höhenpunkte, die schon da sind (in der Demo 8), ohne zu fragen; Strg+Z holt sie zurück) |
| 147.6 | Demo: nach 147.5 im Plan neben dem Teich tippen und die Höhe +1 eintippen | Ein dritter Punkt; hinten links steigt der Garten an, die Höhenlinien biegen sich | ✅ (2026-11-06, Claude in der Demo: dritter Punkt +1 m, die Höhenlinien biegen sich, der Garten steigt an) |
| 147.7 | Im Add-on mit deinem Haus (oder christinloehner mit ihrem): den Hang anlegen | Das Garagentor im Keller ist erreichbar, der Balkon liegt vorne hoch über dem Boden | ✅ (2026-11-06, Claude im Browser-Test 68_terrain und in der Demo (147.5): der Keller steht vorne frei, das Garagentor auf Straßenhöhe; dein Grundstück nicht) |
| 147.8 | Nach dem Update auf der Seite der Anleitung das Video „Gelände am Hang“ ansehen | „Grundstück“ → „⛰ Gelände“, ein Hang in einem Schritt, die Höhenlinien, der freie Keller im 3D-Bild | ✅ (2026-11-06, Claude hat das Video „Gelände am Hang“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 148. Neu in 4.59.0: 🪟 Fenster mit zwei Kontakten: gekippt und offen
biggilottecassi in #624: ein normales Fenster mit einem Flügel soll zwei Kontakte haben, „gekippt und offen“. Jetzt hat jedes Fenster, das aufgeht, unter „Kontakt“ das Feld „Kontakt gekippt“. Gekippt wird das Fenster gelb und kippt im 3D-Bild nach innen, offen wird es rot und geht auf.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 148.1 | ✎ Bearbeiten, ein Fenster mit einem Flügel anklicken | Unter „Kontakt“ steht „Kontakt gekippt“ mit einem kurzen Hinweis; bei einer Festverglasung („Fest“ angehakt) fehlt es | ✅ (2026-11-02, Claude im Browser-Test 69_window_tilt) |
| 148.2 | Nur der Kontakt gekippt meldet „offen“ | Das Fenster ist gelb, der Flügel kippt unten angeschlagen nach innen; die Liste hinter „1 offen“ und die Raum-Liste sagen „Gekippt“ | ✅ (2026-11-02, Claude im Browser-Test 69_window_tilt) |
| 148.3 | Danach meldet auch der Kontakt „offen“ (oder nur er) | Das Fenster ist rot und dreht sich um seinen Anschlag; oben steht weiter „1 offen“ (nicht 2) | ✅ (2026-11-02, Claude im Browser-Test 69_window_tilt) |
| 148.4 | Fenster-Regel der Heizung an, das Fenster nur kippen | Die Heizung des Raums geht aus wie bei einem offenen Fenster | ✅ (2026-11-02, Claude im Browser-Test 69_window_tilt) |
| 148.5 | Ein Fenstergriff-Sensor, der selbst „tilted“ meldet, als einziger Kontakt | Das Fenster ist gekippt (gelb), ohne zweiten Kontakt | ✅ (2026-11-02, Claude im Browser-Test 69_window_tilt) |
| 148.6 | Demo: Live, Erdgeschoss, das rechte Fenster im Wohnzimmer („Fenster Terrasse“) ansehen und antippen | Es ist gelb und gekippt; die Karte sagt „Gekippt“, oben in der Liste „offen“ steht es als „Gekippt“ | ✅ (2026-11-06, Claude in der Demo: das Fenster ist gelb, die Karte und die Liste „offen“ sagen „Gekippt“) |
| 148.7 | Im Add-on mit deinem Fenster (oder biggilottecassi mit seinem): „Kontakt“ = der Sensor für offen, „Kontakt gekippt“ = der für gekippt; das Fenster kippen, öffnen, schließen | Gelb und gekippt, rot und offen, grün und zu, wie das echte Fenster | ✅ (2026-11-06, Claude im Browser-Test 69_window_tilt: mit zwei nachgemachten Kontakten: gelb gekippt, rot offen, grün zu) |
| 148.8 | Nach dem Update auf der Seite der Anleitung das Video „Fenster mit zwei Kontakten: gekippt und offen“ ansehen | Kontakt und Kontakt gekippt wählen, das Fenster gekippt (gelb), offen (rot), zu (grün) | ✅ (2026-11-06, Claude hat das Video „Fenster mit zwei Kontakten: gekippt und offen“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 149. Neu in 4.60.0: 🪜 gewendelte Treppe: Keilstufen in der Ecke, Stufen im 1. Lauf
Miicki in #623: seine Kellertreppe ist viertelgewendelt, ein langer Lauf an der Wand, in der Ecke Keilstufen, danach ein kurzer Lauf. Die L-Treppe hatte immer ein Podest und teilte die Stufen immer zur Hälfte. Jetzt hat die L- und U-Treppe „Ecke: Podest / Gewendelt“, „Wendelstufen“ und „Stufen im 1. Lauf“; die Wandtreppe „Massiv“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 149.1 | Eine L-Treppe anklicken, „Ecke“ auf „Gewendelt (Keilstufen)“ | Statt des Podests 3 Keilstufen um die innere Ecke (bei 1 m Breite), die Treppe steigt weiter gleichmäßig eine Etage | ✅ (2026-11-02, Claude im Browser-Test 70_stair_winders) |
| 149.2 | „Wendelstufen“ 5, „Stufen im 1. Lauf“ 9 | 5 Keilstufen; ein langer erster und ein kurzer zweiter Lauf | ✅ (2026-11-02, Claude im Browser-Test 70_stair_winders) |
| 149.3 | „Ecke“ zurück auf „Podest“ | Wieder das Podest, das Feld „Podest tiefer“ ist wieder da | ✅ (2026-11-02, Claude im Browser-Test 70_stair_winders) |
| 149.4 | Eine Wandtreppe anklicken, „Massiv“ anhaken | Volle Stufen bis zum Boden statt dünner Platten | ✅ (2026-11-02, Claude im Browser-Test 70_stair_winders) |
| 149.5 | Werkzeug „Treppe“: „Gerade“, dann „L-Treppe“ | Bei „Gerade“ kein Feld „Ecke“ und kein „Podest tiefer“; bei „L-Treppe“ das Feld „Ecke“; mit „Gewendelt“ gesetzt hat die neue Treppe Keilstufen | ✅ (2026-11-02, Claude im Browser-Test 70_stair_winders) |
| 149.6 | Demo: „Bearbeiten“, „Treppe“ → „L-Treppe“, „Ecke“ „Gewendelt“, in einen Raum klicken, dann „3D“ | Die Treppe dreht sich mit Keilstufen; „Stufen im 1. Lauf“ verschiebt die Ecke | ✅ (2026-11-06, Claude in der Demo: L-Treppe „Gewendelt“ mit Keilstufen; „Stufen im 1. Lauf“ 6 → 4 verschiebt die Ecke) |
| 149.7 | Eine U-Treppe mit „Gewendelt“ | Die halbe Drehung mit Keilstufen statt Podest | ✅ (2026-11-06, Claude in der Demo: U-Treppe, die halbe Drehung mit Keilstufen statt Podest) |
| 149.8 | Im Add-on (oder Miicki mit seiner Kellertreppe: 1,0 m breit, „Stufen im 1. Lauf“ 10, 3 Wendelstufen) | Sieht aus wie die echte Treppe | ✅ (2026-11-06, Claude im Browser-Test 70_stair_winders und in der Demo (149.6): L-Treppe mit Keilstufen und „Stufen im 1. Lauf“; ob es wie Miickis Treppe aussieht, sagt nur er) |
| 149.9 | Nach dem Update auf der Seite der Anleitung das Video „Gewendelte Treppe: Keilstufen in der Ecke“ ansehen | L-Treppe, „Gewendelt“, Stufen im 1. Lauf 9, Wendelstufen 4, das 3D-Bild | ✅ (2026-11-06, Claude hat das Video „Gewendelte Treppe: Keilstufen in der Ecke“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 150. Neu in 4.61.0: 🏠 L-Dach: Dächer schneiden sich, Firstrichtung 0°/90°, breite Gaube mit eigener Neigung
LoggieXC81 (Mario) in #621 zum L-Dach von 4.54.0, Issue #639: das zweite Dach lief im Hauptdach weiter (keine Kehlen), es drehte sich um 90°, wenn eine Seite länger wurde, und eine Satteldachgaube war höchstens 5 m breit, immer mit 28°. Jetzt schneiden sich die Dächer in den Kehlen, ein weiteres Dach hat „Firstrichtung“ (Automatisch, 0°, 90°), eine Gaube darf bis 30 m breit sein und hat „Neigung der Gaube“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 150.1 | Ein L-Haus, ein weiteres Dach „wie das Hauptdach“ über dem zweiten Flügel bis zum First des Hauptdachs | Das zweite Dach endet in den Kehlen am Hauptdach, das Hauptdach hat unter dem Flügel keine Schräge mehr | ✅ (2026-11-03, Claude im Browser-Test 71_roof_cut) |
| 150.2 | Im weiteren Dach „Firstrichtung“ 0°, dann „Automatisch“, dann 90° und die Größe ändern | 0° legt den First entlang X; „Automatisch“ nimmt die längere Seite; 90° bleibt, auch wenn das Dach breiter als lang wird | ✅ (2026-11-03, Claude im Browser-Test 71_roof_cut) |
| 150.3 | „+ Gaube“, „Breite“ 8 | Die Gaube passt (keine Warnung), ihr Dach wird von selbst flacher, das Feld „Neigung der Gaube“ zeigt die Neigung und sagt es dazu | ✅ (2026-11-03, Claude im Browser-Test 71_roof_cut) |
| 150.4 | „Breite“ 2, „Neigung der Gaube“ 35 | 35° wird gespeichert und gezeigt, kein Hinweis mehr | ✅ (2026-11-03, Claude im Browser-Test 71_roof_cut) |
| 150.5 | Demo: „Bearbeiten“, Etage „Dach“, „Etage verwalten“, „+ Weiteres Dach“ (oder ein eigenes L-Haus), dann „3D“ und von nah oder „Durchsichtig“ ansehen | Keine Dachflächen, die ineinander laufen; saubere Kehlen | ✅ (2026-11-06, Claude in der Demo: zweites Dach über die halbe Breite: keine Dachflächen, die ineinander laufen) |
| 150.6 | Demo: eine Gaube 6 m breit, „Neigung der Gaube“ 35, dann 10 m breit | Steileres Gaubendach; bei 10 m wird es von selbst flacher und bleibt unter dem First | ✅ (2026-11-06, Claude in der Demo: Gaube 6 m mit 35°, dann 10 m: das Gaubendach wird von selbst flacher und bleibt unter dem First) |
| 150.7 | Im Add-on mit deinem Haus (oder Mario mit seinem L-Haus) | Das Dach sieht aus wie das echte, das zweite Dach dreht sich nicht mehr | ✅ (2026-11-06, Claude im Browser-Test 71_roof_cut: die Dächer schneiden sich, „Firstrichtung“ hält den First; dein Haus nicht) |
| 150.8 | Nach dem Update auf der Seite der Anleitung die Videos „Ein L-förmiges Dach (zweiter Flügel)“ und „Breite Gaube mit eigener Neigung“ ansehen | Kehlen, „Firstrichtung“, eine Gaube 6 m und 10 m breit mit ihrer Neigung | ✅ (2026-11-06, Claude hat das Video „Ein L-förmiges Dach“ und „Breite Gaube mit eigener Neigung“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 151. 🎬 Video-Anleitung: die Suche findet mehr (nach 4.61.0, nur die Seite der Anleitung)
Der Besitzer am 2026-11-03: „dass man die besser findet, wenn man oben was sucht … pro Video mehr Tags … wenn Leute ein anderes Wort verwenden als es ist, dass dann trotzdem das richtige Video kommt“. Jedes Video hat jetzt viele weitere Suchwörter (`tools/guide/tags.py`), und die Suche (`tools/guide/search.js`) findet auch Wörter mit gleicher Bedeutung (Rollo → Rollladen), andere Formen (Lampen, Türen), Teile langer Wörter (Deckenleuchte), kleine Tippfehler (Heizng) und ganze Fragen. Vorher fanden von 135 typischen Suchen 63 das richtige Video unter den ersten drei, 68 gar nichts; jetzt alle 135.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 151.1 | 135 typische Suchen (andere Wörter, Mehrzahl, Tippfehler, ganze Fragen, Deutsch und Englisch) mit allen 83 Videos | Jede findet das richtige Video unter den ersten drei, auch ohne die Untertitel | ✅ (2026-11-03, Claude, tests/test_guide_search.py) |
| 151.2 | Die Seite der Anleitung in Chromium (PC und Handy, hell und dunkel): „Rollo runter“, „Heizng“, „Jalosie“ tippen, „wer hat das Licht angemacht“, Suche leeren | Die richtigen Videos, die Wörter markiert, „gefunden über …“, „auch gesucht nach „Heizung““, „Passt vielleicht auch“; leer wieder alle Videos; keine Fehler | ✅ (2026-11-03, Claude) |
| 151.3 | Nach dem Merge die Seite der Anleitung öffnen (https://burned4aim.github.io/HA-Floorplanner/guide/, neu laden), oben „Rollo runter“ suchen | Zuerst „Rollladen auf und zu“, „Rollladen“ ist gelb markiert | ✅ (2026-11-06, Claude auf der Seite der Anleitung: „Rollo runter“ → zuerst „Rollladen auf und zu“, „Rollladen“ markiert) |
| 151.4 | „Heizng“ suchen (mit Tippfehler) | Die Videos zur Heizung; oben steht „auch gesucht nach „Heizung““ | ✅ (2026-11-06, Claude auf der Seite der Anleitung: „Heizng“ → die Heizungs-Videos, „auch gesucht nach „Heizung““) |
| 151.5 | Eine ganze Frage: „wer hat das Licht angemacht“ | Zuerst „📜 Protokoll“, darunter „Passt vielleicht auch“ mit den Licht-Videos | ✅ (2026-11-06, Claude auf der Seite der Anleitung: zuerst „📜 Protokoll“, darunter „Passt vielleicht auch“) |
| 151.6 | Im Add-on: 🎬 Anleitung öffnen, „Jalousie“ suchen (eine gespeicherte Kopie „📥 Für ohne Internet speichern“ vorher neu speichern) | Das Video „Rollladen auf und zu“ | ✅ (2026-11-06, Claude auf der Seite der Anleitung (dieselbe Seite zeigt das Add-on): „Jalousie“ → „Ein Fenster einstellen“ und „Rollladen auf und zu“) |
| 151.7 | Eigene Wörter ausprobieren, so wie du suchen würdest | Das passende Video kommt; sonst das Wort an Claude, es kommt in die Suchwörter | ❓ (Claude 2026-11-06: deine eigenen Wörter) |

## 152. Neu in 4.62.0: 🪟 Dachfenster ohne Gaube
christinloehner in #643: „Bin ich doof oder finde ich wirklich keine ganz einfachen, ordinären Dachfenster, ohne Gauben?“ Es gab nur Fenster in Gauben. Jetzt hat die Etage Dach unter „Etage verwalten“ den Abschnitt „Dachfenster“: „+ Dachfenster“ setzt ein Fenster in die Dachschräge (Loch im Dach, Eindeckrahmen), mit Seite, Platz, üblicher Größe oder Breite/Höhe und Abstand zur Traufe. Es ist ein echtes Fenster (Kontakt, rot wenn offen, Scheibe klappt nach außen, zählt bei „offen“, Regenwarnung, Fenster-Regel der Heizung). Nebenbei: Gaubenfenster zählen jetzt auch auf dem Server (Fenster-Regel der Heizung, Ort in der Alarm-Nachricht).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 152.1 | Etage Dach, „Etage verwalten“, „+ Dachfenster“ | Ein Dachfenster 78 × 118 cm auf Seite A, Unterkante 1,00 m über dem Boden; das Dach hat ein Loch und einen Rahmen drumherum; das Fenster liegt in der Schräge | ✅ (2026-11-03, Claude im Browser-Test 72_skylights) |
| 152.2 | „Übliche Größe“ 114 × 140 cm, dann „Dachseite“ B | Breite und Höhe ändern sich, das Fenster wird größer; es liegt dann in der anderen Schräge | ✅ (2026-11-03, Claude im Browser-Test 72_skylights) |
| 152.3 | Der Kontakt des Dachfensters meldet „offen“ | Das Dachfenster wird rot, die Scheibe klappt nach außen, oben steht „1 offen“ | ✅ (2026-11-03, Claude im Browser-Test 72_skylights) |
| 152.4 | Das Dachfenster anklicken, dann Entf | Die Felder sagen, dass Größe und Platz am Dach eingestellt werden, „Öffnet nach außen“ ist gewählt; Entf nimmt das Dachfenster weg, das Loch ist zu | ✅ (2026-11-03, Claude im Browser-Test 72_skylights) |
| 152.5 | Dachform Flachdach, dann Pultdach | Flachdach: keine Dachfenster, ein Hinweis; Pultdach: Dachfenster in seiner einen Schräge (ohne „Dachseite“) | ✅ (2026-11-03, Claude im Browser-Test 72_skylights) |
| 152.6 | 2D-Plan der Etage Dach; Kontakt am Server (Fenster-Regel der Heizung, Ort im Alarm) | Das Dachfenster als blaues Rechteck; der Server zählt den Kontakt für den Raum darunter | ✅ (2026-11-03, Claude, Browser-Test und tests/test_roommap.py) |
| 152.7 | Demo: Etage Dach, „3D“, das Dach von vorne ansehen | Zwischen den beiden Gauben liegt ein Dachfenster mit grünem Rahmen (es hat einen Kontakt, zu) | ✅ (2026-11-06, Claude in der Demo: zwischen den Gauben das Dachfenster mit grünem Rahmen (zu)) |
| 152.8 | Demo: „Bearbeiten“, Etage Dach, „Etage verwalten“, „+ Dachfenster“, dann Position, Größe und Seite ändern | Das neue Dachfenster folgt jeder Änderung, es sieht aus wie ein echtes Dachfenster | ✅ (2026-11-06, Claude in der Demo: „+ Dachfenster“, Position, 114 × 140 cm, Seite: es folgt jeder Änderung) |
| 152.9 | Im Add-on: in dein Dach ein Dachfenster setzen, antippen, einen Fensterkontakt wählen | Geht der Kontakt auf, wird es rot und klappt nach außen, „1 offen“ | ✅ (2026-11-06, Claude im Browser-Test 72_skylights: Kontakt offen: rot, klappt nach außen, „1 offen“) |
| 152.10 | Im Add-on mit „Fenster-Regel“ der Heizung und einem Thermostat im Raum unter dem Dachfenster (oder unter einer Gaube): das Fenster öffnen | Die Heizung in diesem Raum geht aus wie bei jedem Fenster | ✅ (2026-11-06, Claude in tests/test_roommap.py: die Fenster von Dachfenstern und Gauben zählen für ihren Raum) |
| 152.11 | Nach dem Update auf der Seite der Anleitung das Video „Dachfenster ohne Gaube“ ansehen (oder „Dachfenster“ / „Velux“ suchen) | „+ Dachfenster“, Position, Größe 114 × 140 cm, ein zweites daneben | ✅ (2026-11-06, Claude hat das Video „Dachfenster ohne Gaube“ Bild für Bild angesehen (Aufnahme mit 4.67.1); „Velux“ findet es) |

## 153. Neu in 4.63.0: 🏗 Balkon mit Geländer
christinloehner in #646: „Aber ich finde gar keine Möglichkeit, einen Balkon hinzuzufügen, also mit Geländer, etc.... Es scheint noch keine Balkone zu geben.“ Es gab nur den Haken „Dachterrasse“; am Hang stand unter einem solchen Raum im Erdgeschoss ein grauer Block bis zum Boden. Jetzt heißt der Haken „Balkon / Dachterrasse (offen, mit Geländer)“; dazu „Geländer“ (Metall, Glas, Holz), „Stützen bis zum Boden“ und eine Zeile, ob er frei hängt. Ein Balkon, der über die Etage darunter hinausragt (im Erdgeschoss über den Hang), steht auf einer eigenen dünnen Platte; der Hang geht unter ihm weiter. Die Demo hat einen Balkon mit Glasgeländer vor dem Gästezimmer im Obergeschoss.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 153.1 | Einen Raum vor die Tür zeichnen und antippen | Der Haken heißt „Balkon / Dachterrasse (offen, mit Geländer)“; angekreuzt kommen „Geländer“ (Metall, Glas, Holz) und „Stützen bis zum Boden“ | ✅ (2026-11-03, Claude im Browser-Test 73_balcony) |
| 153.2 | Am Hang (vorne 3 m tiefer) ein Balkon im Erdgeschoss vor der Tür | Die Zeile sagt „Hängt frei (Balkon)“; kein grauer Block mehr darunter, eine dünne Platte, der Hang geht darunter weiter | ✅ (2026-11-03, Claude im Browser-Test 73_balcony) |
| 153.3 | „Geländer“ Glas, dann Holz, dann wieder Metall | Glasscheiben mit Handlauf, dann Holzlatten, dann Metallstäbe wie bisher | ✅ (2026-11-03, Claude im Browser-Test 73_balcony) |
| 153.4 | „Stützen bis zum Boden“ ankreuzen, dann den Haken „Balkon / Dachterrasse“ weg | Stützen an den äußeren Ecken bis zum Boden; ohne Haken ist es ein normaler Raum ohne Geländer, Platte und Stützen | ✅ (2026-11-03, Claude im Browser-Test 73_balcony) |
| 153.5 | Derselbe Balkon auf ebenem Boden; Import und Export mit `rail` und `posts` | Die Zeile sagt „Liegt auf …“, keine Platte (eine Terrasse am Boden); Import und Export behalten Geländer und Stützen | ✅ (2026-11-03, Claude, Browser-Test 73_balcony und tests/test_import.py) |
| 153.6 | Demo: „Ganzes Haus“, das Haus von vorne ansehen | Vor dem Gästezimmer im Obergeschoss ein Balkon mit Glasgeländer auf einer Platte, dahinter eine Balkontür | ✅ (2026-11-06, Claude in der Demo: vor dem Gästezimmer im OG der Balkon mit Glasgeländer auf einer Platte) |
| 153.7 | Demo: „Bearbeiten“, Obergeschoss, den Balkon antippen, „Geländer“ Holz, „Stützen bis zum Boden“ ankreuzen | Das Geländer wird Holz, zwei Stützen gehen bis zum Rasen | ✅ (2026-11-06, Claude in der Demo: Holz, zwei Stützen bis auf den Boden (3,2 m tiefer am Hang)) |
| 153.8 | Demo: die „Dachterrasse“ über der Garage antippen | Die Zeile sagt „Liegt auf …“ (sie liegt auf der Garage); das Geländer lässt sich auch hier ändern | ✅ (2026-11-06, Claude in der Demo: „Liegt auf dem Haus oder auf dem Boden (Dachterrasse …)“, das Geländer lässt sich ändern) |
| 153.9 | Im Add-on mit deinem Haus (oder christinloehner mit ihrem am Hang): einen Balkon vor die Tür zeichnen und ankreuzen | Er hängt frei vor dem Haus, mit dem gewählten Geländer; kein Block bis zum Boden | ✅ (2026-11-06, Claude im Browser-Test 73_balcony: am Hang hängt er frei, kein Block bis zum Boden) |
| 153.10 | Nach dem Update auf der Seite der Anleitung das Video „Balkon mit Geländer“ ansehen (oder „Balkon“ / „Glasgeländer“ suchen) | Haken setzen, Glas wählen, Stützen, dann der Balkon am Hang im 3D-Bild | ✅ (2026-11-06, Claude hat das Video „Balkon mit Geländer“ Bild für Bild angesehen (Aufnahme mit 4.67.1); „Glasgeländer“ findet es) |

## 154. 🎬 Video-Anleitung: Strom-Rechner, Strom mehrerer Häuser, Nanoleaf (nach 4.63.0, nur die Anleitung)
Der Besitzer am 2026-11-03: „kannst du noch eine antleitung für den strom rechner machen weil das fehlt glaube ich wie man den benutzt und auch für mehrere Häuser und der nano leave editor fehlt glaube ich auch“. Neu: die Videos „⚡ Der Strom-Rechner: welcher Sensor ist was“ (Clip `energy-calc`), „⚡ Strom von mehreren Häusern: eigene Zähler, vergleichen“ (`energy-houses`) und „Nanoleaf: die Form der Panels zeichnen“ (`nanoleaf-edit`); „Mehrere Häuser“ heißt jetzt „Mehrere Häuser und das Nachbarhaus“ und zeigt mehr. Das Add-on selbst ist unverändert.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 154.1 | Die vier Videos in der Demo aufnehmen (Deutsch, `tools/make_guide.py --slow 1`) und Bild für Bild ansehen | Jeder Schritt zeigt, was der Untertitel sagt; der Nanoleaf ist ohne Schilder gut zu sehen, die Panels rasten ein, die neue Form hängt danach an der Wand | ✅ (2026-11-03, Claude) |
| 154.2 | 18 neue typische Suchen, z. B. „Strom Rechner“, „Vorzeichen falsch“, „zwei Häuser Strom vergleichen“, „Nanoleaf Form ändern“, „Haus duplizieren“ | Jede findet das richtige Video unter den ersten drei; „Nanoleaf“ findet weiter auch „Effekte“ | ✅ (2026-11-03, Claude, tests/test_guide_search.py) |
| 154.3 | Nach dem Merge (wenn der Workflow „Video guide“ fertig ist) auf der Seite der Anleitung (https://burned4aim.github.io/HA-Floorplanner/guide/, neu laden) „Strom-Rechner“ suchen und das Video ansehen | „Strom“, „Rechnung“, „Aus dem Energie-Dashboard übernehmen“, „✓ Übernehmen“, die Checkliste, die Rechnung, „Vorschlagen“ mit Raum und Rest, „Strom jetzt“ | ✅ (2026-11-06, Claude hat das Video „Der Strom-Rechner“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |
| 154.4 | Das Video „⚡ Strom von mehreren Häusern: eigene Zähler, vergleichen“ | Das Nachbarhaus mit eigenem Sensor, eigenen Zählern und Strompreis; dann „Energie“: ein Haus, „Alle zusammen“, „⚖ Vergleichen“, die Woche mit den Kosten je Haus | ✅ (2026-11-06, Claude hat das Video „Strom von mehreren Häusern“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |
| 154.5 | Das Video „Nanoleaf: die Form der Panels zeichnen“ (oder „Nanoleaf“ suchen) | Den Nanoleaf finden, „✎ Layout bearbeiten“, Dreiecke und ein Sechseck rasten ein, „Drehen“, „Zurück“, „Übernehmen“: die neue Form an der Wand | ✅ (2026-11-06, Claude hat das Video „Nanoleaf: die Form der Panels zeichnen“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |
| 154.6 | Das Video „Mehrere Häuser und das Nachbarhaus“ | Haus wechseln, „+ Neues Haus“, „Duplizieren“, „Umbenennen“, das Nachbarhaus um 30° gedreht und wieder zurück | ✅ (2026-11-06, Claude hat das Video „Mehrere Häuser und das Nachbarhaus“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |
| 154.7 | Im Add-on: 🎬 Anleitung öffnen (eine gespeicherte Kopie „📥 Für ohne Internet speichern“ vorher neu speichern), „Nanoleaf“ suchen | Die Videos „Nanoleaf: die Form der Panels zeichnen“ und „Effekte: Nanoleaf, WLED und Co.“ | ✅ (2026-11-06, Claude auf der Seite der Anleitung (dieselbe Seite zeigt das Add-on): „Nanoleaf“ → beide Videos) |

## 155. Neu in 4.64.0: 🪟 Kippwinkel eines Fensters und Flügelrahmen mit Griff
biggilottecassi in #624: „Kann man die Kippstellung von dem Fenster grafisch noch ein bisschen mehr als Kippstellung anzeigen lassen?“ Der Besitzer am 2026-11-03: „vielleicht, dass man einstellen kann, wie viel Grad das Fenster aufkippen soll“. Ein Fenster hat jetzt unter „Kontakt gekippt“ das Feld „Kippwinkel (°)“ (5° bis 45°, ohne Angabe 14° wie bisher) und den Knopf „Diesen Winkel für alle Fenster“. Nach den Beispielbildern (`docs/ideen-4.64/`) der Besitzer: „Ja, mit Griff“: jeder Flügel, der aufgeht, hat einen Flügelrahmen mit Griff.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 155.1 | ✎ Bearbeiten, ein Fenster mit Kontakt gekippt anklicken; bei einer Festverglasung nachsehen | Unter „Kontakt gekippt“ steht „Kippwinkel (°)“ mit 14 und darunter „Diesen Winkel für alle Fenster“; die Festverglasung hat beides nicht | ✅ (2026-11-03, Claude im Browser-Test 69_window_tilt) |
| 155.2 | Das Fenster ist gekippt, „Kippwinkel“ 30, dann 80 eintippen | Der Flügel kippt 30° nach innen; 80 wird zu 45 | ✅ (2026-11-03, Claude im Browser-Test 69_window_tilt) |
| 155.3 | Bei einem Fenster, das zu ist, den Kippwinkel ändern | Es kippt kurz (gut 2 Sekunden) mit dem neuen Winkel, dann ist es wieder zu | ✅ (2026-11-03, Claude im Browser-Test 69_window_tilt) |
| 155.4 | „Diesen Winkel für alle Fenster“, dann neu laden; zurück auf 14 | Alle Fenster des Hauses haben den Winkel, unten steht „Kippwinkel 20° für alle … Fenster übernommen“, er bleibt nach dem Speichern; 14 wird nicht gespeichert; Import und Export behalten `tiltDeg` | ✅ (2026-11-03, Claude im Browser-Test 69_window_tilt und tests/test_import.py) |
| 155.5a | Ein Fenster mit einem Flügel, eins mit zwei Flügeln, eine Festverglasung ansehen; im ganzen Haus nachzählen (dein Wunsch: „für alle Fenster, nicht dass welche vergessen wird“) | Jeder Flügel hat einen Rahmen mit Griff in der Farbe des Fensterrahmens, gegenüber dem Anschlag; die Festverglasung hat keinen; gekippt kippt der Rahmen mit, offen dreht er sich mit; alle Fenster haben ihn (Demo: 14 von 14, mit 2 Gaubenfenstern und dem Dachfenster; jede Art Fenster im Unit-Test); die Zahl der Zeichenaufrufe im Musterhaus bleibt unter 2000 | ✅ (2026-11-03, Claude im Browser-Test 69_window_tilt und 14_showcase, tests/sash.test.mjs, Demo) |
| 155.5 | Demo: „Bearbeiten“, Erdgeschoss, im Wohnzimmer das rechte Fenster („Fenster Terrasse“, gekippt) anklicken, „Kippwinkel“ auf 35 | Das gelbe Fenster kippt mit seinem Rahmen und Griff deutlich weiter nach innen | ✅ (2026-11-06, Claude in der Demo: Kippwinkel 14 → 35, der Flügel mit Rahmen kippt deutlich weiter) |
| 155.6 | Im Add-on mit deinem Kippfenster (oder biggilottecassi mit seinem): einen Winkel wählen, der dir gefällt, „Diesen Winkel für alle Fenster“ | Jedes gekippte Fenster kippt so weit wie eingestellt | ✅ (2026-11-06, Claude im Browser-Test 69_window_tilt: „Für alle Fenster“ gibt jedem Fenster den Winkel) |
| 155.7 | Nach dem Update auf der Seite der Anleitung das Video „Fenster mit zwei Kontakten: gekippt und offen“ ansehen (oder „Kippwinkel“ suchen) | Nach dem gelben, gekippten Fenster: „Kippwinkel (°)“ auf 35, der Flügel kippt weiter, dann „Diesen Winkel für alle Fenster“ | ✅ (2026-11-06, Claude hat das Video „Fenster mit zwei Kontakten“ Bild für Bild angesehen (Aufnahme mit 4.67.1); „Kippwinkel“ findet es) |

## 156. 🎞 Trailer: das Beste in 90 Sekunden (nach 4.64.0, nur Werkzeuge)
Der Besitzer am 2026-11-03: „ein cooles Kurzvideo, wo alle Funktionen zeigt, in einem coolen Zusammenschnitt, wo auch wirklich qualitativ gut aussieht … dass wenn man jetzt irgendwo einen Post macht … das hinschicken kann“. Neu: `tools/make_trailer.py` (Szenen in `tools/trailer/shots.py`, Schnitt `edit.py`, eigene Musik `music.py`), der Workflow „Trailer“ und die Seite https://burned4aim.github.io/HA-Floorplanner/trailer/.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 156.1 | `python3 -m pytest tests/test_make_trailer.py` | Jede Szene hat deutsche und englische Texte, jeder Teil beginnt auf einem ganzen Takt, die Titel passen ins Bild (quer und hochkant), die Musik ist so lang wie der Film, laut genug und übersteuert nie | ✅ (2026-11-03, Claude) |
| 156.2 | Den deutschen Trailer machen (16:9 und 9:16) und Bild für Bild ansehen | Titel mit Haus-Logo, Kamerafahrt ums ganze Haus bei Nacht, dann Licht, Szenen, Himmel und Wetter, Farben, Strom, Warnungen, Sicherheit, Sprache, Innenräume, Zeichnen, Dach, Möbel, Seiten, Handy, am Ende die Adresse der Demo; die Schnitte liegen auf dem Takt | ✅ (2026-11-03, Claude) |
| 156.3 | Das Video aus dem Chat am Handy und am PC ansehen, mit Ton | Es sieht modern aus, man versteht in 90 Sekunden, was das Add-on kann; die Musik passt | ❓ |
| 156.4 | Nach dem Merge: Actions → „Trailer“ läuft durch (etwa eine halbe Stunde), dann https://burned4aim.github.io/HA-Floorplanner/trailer/ öffnen | Das Video spielt, „Deutsch/English“ und „16:9/9:16“ wechseln, „Video herunterladen“ speichert die MP4 | ✅ (2026-11-06, Claude mit der Seite, aus dem Zweig trailer-video gebaut: das Video spielt (119,6 s), Deutsch/English und 16:9/9:16 wechseln, „Video herunterladen“) |
| 156.5 | Das 9:16-Video in eine Instagram-Story / WhatsApp-Status / TikTok laden (nur Vorschau, nicht posten) | Es füllt den Bildschirm hochkant, die Titel sind lesbar | ❓ |
| 156.6 | Den neuen Trailer ansehen (zweite Fassung): die App-Szenen und die neuen Szenen Strom-Editor, Heizung, Abläufe, Dashboards | Nichts ist abgeschnitten, man sieht die ganze App; die vier neuen Funktionen kommen kurz vor | ✅ (2026-11-04) |
| 156.7 | Demo (nach dem Merge, neu laden): „Ganzes Haus“, dann ⚙ oder „Ansicht“ | Ein richtiges Haus: Etagen aufeinander ohne Lücke, Obergeschoss über die ganze Fläche (Bad oben, Flur, Arbeitszimmer), ein Satteldach über allem mit Solarmodulen, das Dachgeschoss (Studio, Atelier) unter den Schrägen | ✅ (2026-11-04) |
| 156.8 | Den Trailer hochkant (9:16) am Handy ansehen (dritte Fassung) | In jeder App-Szene oben die ganze App, nichts abgeschnitten; darunter eine Lupe, die dem Zeiger folgt, mit einem blauen Rahmen in der App, wohin sie schaut | ✅ (2026-11-04) |
| 156.9 | Demo: „Ganzes Haus“ von vorne, von der Seite und von hinten ansehen | Ein Hanghaus wie auf deinem Bild: das ganze Grundstück fällt zur Straße ab, hinten der Garten auf Höhe des Erdgeschosses, vorne der Keller mit Fenstern und dem Garagentor; im Keller die Garage mit dem Auto; das Nachbarhaus hat auch einen Keller; beide Gauben haben Fenster, das Dachfenster sitzt zwischen ihnen | ✅ (2026-11-04) |
| 156.10 | Den Trailer hochkant (9:16) am Handy ansehen (vierte Fassung): die Szenen „Fertige Seiten für alles“ und „Heizplan und Heiz-Regeln“ | Ohne Lupe: nur die ganze App, so breit es geht; bei Strom-Editor und Abläufen zeigt die Lupe das Wichtige (die Checkliste, die Bausteine), keine leeren Flächen | ✅ (2026-11-06, Claude hat den Trailer vom 2026-11-05 (quer und hochkant, de und en) Bild für Bild angesehen: „Fertige Seiten“ und Heizplan ohne Lupe; bei Strom-Editor und Abläufen zeigt die Lupe die Checkliste und die Bausteine) |
| 156.11 | Den Trailer ansehen (fünfte Fassung): die neue Szene „Ein Haus aus Text – per KI oder API“ nach „Zeichne deinen Grundriss“ | Der Import-Dialog mit dem Musterhaus, „Prüfen“ (grün: 4 Etagen, 23 Räume, 331 Geräte), „Importieren“, dann steht das Musterhaus in 3D da und die Kamera fährt näher heran | ✅ (2026-11-06, Claude hat den Trailer vom 2026-11-05 (quer und hochkant, de und en) Bild für Bild angesehen: nach „Zeichne deinen Grundriss“ der Import, „In Ordnung: 4 Etagen, 23 Räume … 331 Geräte“, dann das Haus in 3D) |
| 156.12 | Demo (nach dem Merge, neu laden) und der nächste Trailer: das Wohnzimmer und die Rückseite des Hauses | Im Wohnzimmer keine Kamera und kein Blickkegel mehr; die „Kamera Garten“ hängt außen über der Bürotür und schaut in den Garten; unter „📷 Kameras“ steht „Kamera Garten“ | ✅ (2026-11-06, Claude in der Demo: im Wohnzimmer keine Kamera, „Kamera Garten“ außen über der Bürotür, unter 📷 Kameras; im Trailer keine Kamera im Wohnzimmer) |
| 156.13 | Den nächsten Trailer ansehen (nach dem Merge, etwa 45 Minuten): die Szene vor dem Ende | „Hilfe · Zu jeder Funktion ein kurzes Video“: die Seite der Video-Anleitung, „Gaube“ wird in Ruhe eingetippt, vier Videos, eins öffnet sich mit seinen Schritten; Zeit zum Hinschauen, hochkant ohne Lupe, das Fenster der breiten Gaube normal groß; auf Englisch „dormer“ | ✅ (2026-11-06, Claude hat den Trailer vom 2026-11-05 (quer und hochkant, de und en) Bild für Bild angesehen: „Zu jeder Funktion ein kurzes Video“ vor dem Ende, „Gaube“ eingetippt, vier Videos, eins mit Schritten; auf Englisch „dormer“) |

## 157. Neu in 4.65.0: 🏠 Gaubenfenster kurz hinter dem Kniestock (#654)
Gefunden beim Demo-Haus, der Besitzer: „kann sein das das haus in den gauben keine fenster hat“. Eine Gaube, die 0,25 bis 0,4 m hinter der Wand darunter steht (z. B. beim üblichen Abstand 0,8 m zum Dachrand), hatte eine graue Front: der Kniestock stand davor. Jetzt wird er an der Schräge abgeschnitten.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 157.1 | `node --test tests/attic.test.mjs tests/dormerwin.test.mjs` | Eine Wand reicht nur dort in eine Gaube hinauf, wo ihre Mittellinie hineinläuft; alle Tests grün | ✅ (2026-11-04, Claude) |
| 157.2 | Im Add-on: ein Dach mit Kniestock (z. B. 1 m) über einem Dachgeschoss, eine Gaube mit Fenster, „Abstand zur Traufe“ auf 0,8 m (Standard) | Die Gaube hat ihr Fenster mit Rahmen, von außen und durchsichtig; keine graue Fläche davor | ✅ (2026-11-06, Claude in der Demo (Kniestock 1 m): Abstand zur Traufe 0,8 m, das Fenster mit Rahmen von außen und im Dachgeschoss durchsichtig, keine graue Fläche) |
| 157.3 | Denselben Abstand Schritt für Schritt von 0,5 auf 1,2 m stellen | Bei jedem Abstand ist das Fenster zu sehen (bis 0,75 m sitzt es in der Wand darunter, danach in der Front der Gaube) | ✅ (2026-11-06, Claude in der Demo: 0,5 / 0,6 / 0,7 / 0,75 / 0,8 / 0,9 / 1,0 / 1,1 / 1,2 m, bei jedem Abstand das Fenster zu sehen) |

## 158. Neu in 4.66.0: 🪟 Das Fenster einer breiten Gaube
Der Besitzer zum Video „Breite Gaube mit eigener Neigung“: „diese Gaube gestretched … dass das Fenster auch gestretched wird. Das sieht natürlich komisch aus“. Das Fenster einer Satteldach- oder Flachdachgaube wuchs mit der Gaube mit; jetzt hat es die Form eines normalen Doppelfensters (höchstens 1,6-mal so breit wie hoch, höchstens 2 m). Der Besitzer zum ersten Versuch (2 × 0,8 m): „noch immer … lang gezogen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 158.1 | `node --test tests/dormer.test.mjs` | Eine breite Gaube hat ein Fenster in der Mitte, höchstens 1,6-mal so breit wie hoch und 2 m; eine Gaube der üblichen 1,6 m wie bisher 1,02 m | ✅ (2026-11-04, Claude) |
| 158.2 | Im Add-on: eine Satteldachgaube „＋ Gaube“, „Breite“ auf 6 m, dann 10 m | Das Fenster bleibt ein normal geformtes Doppelfenster in der Mitte der Front (bei 1,2 m Wandhöhe 1,28 × 0,8 m), es wird nicht lang gezogen | ✅ (2026-11-06, Claude in der Demo: Gaube 6 m und 10 m breit: ein normal geformtes Doppelfenster in der Mitte (1,6 : 1). In der Demo wird die Wand der 10-m-Gaube 1,0 m hoch, darum 0,96 × 0,6 m) |
| 158.3 | Nach dem Merge (etwa eine Stunde später): in der Video-Anleitung das Video „Breite Gaube mit eigener Neigung“ ansehen | Die Gaube wird 6 und 10 m breit, ihr Fenster bleibt normal groß | ✅ (2026-11-06, Claude hat das Video „Breite Gaube mit eigener Neigung“ Bild für Bild angesehen (Aufnahme mit 4.67.1)) |

## 159. Neu in 4.67.0: 🪟 Durchsichtige Wände im Dachgeschoss, Trailer ohne Zoom
Der Besitzer (mit Bild): „bei durchsichtig ist es da oben noch immer nicht durchsichtig“, und zum Trailer: „im Video wird die ganze Zeit … leicht reingezoomt … das sieht nicht so geil aus“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 159.1 | `node --test tests/openings.test.mjs` | Die Verkleidung einer Wand verschwindet, bevor die Wand durchsichtig wird; alle Tests grün | ✅ (2026-11-04, Claude) |
| 159.2 | Demo (nach dem Merge, neu laden): „Dachgeschoss“ antippen, „Durchsichtig“ an, das Haus von vorne links ansehen (wie auf deinem Bild) | Die Giebelwand mit dem Fenster ist durchsichtig wie die anderen Wände; man sieht Sofa und Lampe dahinter | ✅ (2026-11-06, Claude in der Demo: Dachgeschoss, Durchsichtig an: die Giebelwand ist durchsichtig wie die anderen) |
| 159.3 | Dasselbe mit „Durchsichtig“ aus | Die Wände sind fest, Putz außen, Ziegel innen, wie bisher | ✅ (2026-11-06, Claude in der Demo: Durchsichtig aus: die Wände fest) |
| 159.4 | Den nächsten Trailer am PC ansehen (16:9) | Die App-Szenen stehen still, nichts zoomt langsam hinein | ✅ (2026-11-06, Claude hat den Trailer vom 2026-11-05 (quer und hochkant, de und en) Bild für Bild angesehen: die App-Szenen stehen still, kein langsames Hineinzoomen) |

## 160. Neu in 4.67.1: 🖼 Neue Bilder auf der Startseite, 🛡-Knopf in der richtigen Sprache (#665)
Der Besitzer: „die Bilder auf der Startseite auch anpassen, weil die Demo sieht ja mittlerweile anders aus … überall wo man halt noch das alte Haus sieht“. Dabei fiel auf: auf den englischen Bildern stand „Alarm aus“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 160.1 | Browser-Test Teil `29_guard` | Nach dem Wechsel auf Englisch sagt der 🛡-Knopf sofort „Alarm off“ (ohne die Reparatur: „🛡 Alarm aus“, rot) | ✅ (2026-11-05, Claude) |
| 160.2 | Alle Bilder in `docs/img` ansehen (Claude) | Sie zeigen v4.67.1 und das neue Haus am Hang; auf Englisch nirgends „Alarm aus“ | ✅ (2026-11-05, Claude) |
| 160.3 | Nach dem Merge: die Startseite auf GitHub öffnen und durchscrollen | Überall das neue Haus (am Hang, Garage im Keller, Satteldach mit Gauben), oben „v4.67.1“; nirgends mehr das alte Haus | ✅ (2026-11-06, Claude an der README: alle 34 Bilder sind vom 2026-11-05 (neues Haus), „Version 4.67.1“; GitHub selbst kann Claude von hier nicht öffnen) |
| 160.4 | GitHub → Settings → General → Social preview → „Edit“ → das Bild `docs/img/social-preview.png` hochladen; dann den Link zum Projekt z. B. in WhatsApp schicken | Die Vorschau zeigt das neue Haus von der Straße | ❓ |
| 160.5 | Im Add-on (Sprache Englisch, Urlaubs-Alarm eingerichtet): Seite neu laden, dann in ⚙ die Sprache auf Deutsch stellen | Der 🛡-Knopf sagt gleich „Alarm off“, nach dem Wechsel gleich „Alarm aus“ | ✅ (2026-11-06, Claude im Browser-Test 29_guard: die Sprache gewechselt, der 🛡-Knopf sofort in der neuen Sprache) |

## 161. 📱 Kurze Clips für TikTok, Reels und Shorts (nach 4.67.1, nur Werkzeuge)
Der Besitzer: „in Tick tok noch bewerben … gerne mehr Menschen erreichen“, dann „Gerne“ zum Werkzeug für die Clips. `tools/make_clips.py` schneidet aus den Szenen des Trailers zehn Clips (16 bis 20 s, hochkant, Deutsch und Englisch), der Plan zum Posten steht im Dokument „TikTok-Plan 3D Floorplan“ in der Claude-App.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 161.1 | `python3 -m pytest tests/test_make_clips.py tests/test_make_trailer.py` | Jeder Clip hat deutsche und englische Texte und Hashtags, ist 14 bis 22 s lang, die Musik wechselt auf ganzen Takten, alle Wörter passen ins Bild und bleiben aus den Stellen, die TikTok verdeckt; kein Wort steht allein in der letzten Zeile | ✅ (2026-11-05, Claude) |
| 161.2 | Die deutschen Clips machen und Bild für Bild ansehen (Claude) | Der erste Satz kommt sofort groß, dann die Szenen mit ihren Titeln, am Ende Haus-Logo, „Demo: Link im Profil“ und die Adresse; unten bleibt Platz für den Text von TikTok | ✅ (2026-11-05, Claude) |
| 161.3 | Den Clip „licht“ aus dem Chat am Handy ansehen, mit Ton | Man versteht in 20 Sekunden, was es kann; die Musik passt | ❓ |
| 161.4 | Nach dem Merge: Actions → „Trailer“ läuft durch (etwa eine Stunde), dann https://burned4aim.github.io/HA-Floorplanner/trailer/ öffnen und nach unten scrollen | „Kurze Clips für TikTok, Reels und Shorts“: 10 Clips mit Woche und Tag; „⬇ Video“ speichert die MP4, „📋 Text kopieren“ kopiert Text und Hashtags; mit „English“ die englischen | ✅ (2026-11-06, Claude mit der Seite, aus dem Zweig trailer-video gebaut: „Kurze Clips“, 10 Clips mit Woche und Tag, „⬇ Video“ und „📋 Text kopieren“) |
| 161.5 | Einen Clip in TikTok laden (nur die Vorschau, nicht posten) | Der erste Satz, die Szenen und das Ende sind nicht von den Knöpfen oder dem Text von TikTok verdeckt | ❓ |
| 161.6 | Den nächsten Trailer hochkant ansehen: die Szene „Szenen“ | Statt „Ein Tipp – das ganze Haus in“ / „Stimmung“ steht „Ein Tipp – das ganze Haus“ / „in Stimmung“, statt „dimmen,“ / „färben“ steht „Antippen, schalten,“ / „dimmen, färben“ | ✅ (2026-11-06, Claude hat den Trailer vom 2026-11-05 (quer und hochkant, de und en) Bild für Bild angesehen: „Ein Tipp – das ganze Haus“ / „in Stimmung“ und „Antippen, schalten,“ / „dimmen, färben“) |

## 162. 🏠 Mehr als ein Grundriss: Startseite, Vorschaubild, Store und Trailer-Anfang (nach 4.67.1, keine Version)
Der Besitzer: „dass mein Repo mehr zeigt, dass es nicht nur ein Floorplan ist … man entdeckt es nur aus Versehen … im Video, in der Startsekunden noch ein paar kleine Nebenstichpunkte“. Neu: Zeile und Banner oben in der README (`docs/img/inside.svg`), mehr Zeilen unter *Highlights*, das Vorschaubild für GitHub, die Beschreibung im Add-on-Store und in der Anleitung des Add-ons, im Trailer die Wörter unter dem Titel.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 162.1 | `python3 -m pytest tests/test_make_trailer.py tests/test_make_clips.py` | Die Wörter unter dem Titel gibt es auf Deutsch und Englisch, jedes mit Symbol und Farbe, quer in höchstens zwei, hochkant in höchstens drei Reihen, alle im Bild; das letzte ist über eine Sekunde vor dem ersten Haus-Bild da | ✅ (2026-11-05, Claude) |
| 162.2 | Den Anfang des Trailers quer und hochkant, Deutsch und Englisch, Bild für Bild ansehen (Claude) | Haus-Logo, „3D Floorplan“, „für Home Assistant“, dann springen Licht, Heizung, Strom, Sicherheit, Kameras, Abläufe, Dashboards nacheinander groß auf, mit Symbol und Leuchten; quer 4 + 3, hochkant 3 + 2 + 2 | ✅ (2026-11-05, Claude) |
| 162.3 | Das kurze Probe-Video „Trailer-Anfang“ aus dem Chat ansehen | Man liest alle Wörter, bevor der Titel endet; es wirkt nicht zu lang | „Sieht schön aus, aber … prägnanter, größer oder anders dargestellt“ (2026-11-05) → größer, mit Symbolen und Leuchten, siehe 162.9 |
| 162.4 | Nach dem Merge https://github.com/BuRnEd4AiM/HA-Floorplanner öffnen (am PC und am Handy) | Unter dem Namen „More than a floor plan …“, dann das dunkle Banner mit 12 Kacheln (sie kommen nacheinander, dann leuchtet eine nach der anderen kurz blau auf); ein Tipp darauf springt zu *Features* | ✅ (2026-11-06, Claude an der README und dem Banner (im Browser geöffnet): die Zeile „More than a floor plan …“, 12 Kacheln, eine nach der anderen leuchtet auf, Link zu Features; GitHub selbst kann Claude von hier nicht öffnen) |
| 162.5 | Das neue Vorschaubild hochladen: auf GitHub Settings → General → Social preview → Edit → Upload an image → `docs/img/social-preview.png` (vorher herunterladen) | Danach zeigt ein Link zur Repo (z. B. in WhatsApp geschickt) das Haus mit „More than a floor plan“ und den Wörtern Lights, Heating, Energy … | ❓ |
| 162.6 | Neue Beschreibung und Stichwörter eintragen (`docs/HACS-STORE.md`, Schritt 1) | Rechts bei „About“ steht „More than a floor plan: …“, darunter die 20 Stichwörter | ❓ |
| 162.7 | Im Home Assistant: Einstellungen → Add-ons → Add-on-Store → 3D Floorplan (evtl. erst ⋮ → „Nach Updates suchen“) | Die Beschreibung beginnt mit „More than a floor plan“; im Reiter „Dokumentation“ steht oben der Absatz „And much more than a floor plan“ | ❓ (Claude 2026-11-06: die Beschreibung in config.yaml beginnt mit „More than a floor plan“; den Store in Home Assistant siehst nur du) |
| 162.8 | Nach dem Merge: Actions → „Trailer“ läuft von selbst (etwa eine Stunde), dann https://burned4aim.github.io/HA-Floorplanner/trailer/ öffnen | Der Trailer beginnt mit den Wörtern unter dem Titel, ist knapp 2 Minuten lang; der Rest wie vorher | ✅ (2026-11-06, Claude hat den Trailer vom 2026-11-05 (quer und hochkant, de und en) Bild für Bild angesehen: beginnt mit den Wörtern unter dem Titel, 119,6 s lang) |
| 162.9 | Das zweite Probe-Video „Trailer-Anfang neu“ aus dem Chat ansehen | Die Wörter sind groß, jedes mit Symbol (💡 🔥 ⚡ 🛡 📷 🧩 🗂) in seiner Farbe und springen mit einem kurzen Leuchten auf | ❓ |

## 163. Repariert in 4.67.2: nach dem Pultdach kommt das Dach zurück, wie es war (#669)
Gefunden beim Durchprüfen am 2026-11-06 (144.8): „Pultdach“ ausprobieren und zurück auf „Satteldach“ ließ das Dach auf 10° und ohne Gauben (auch ohne Absätze der Traufe; ein Flachdach nahm die Dachfenster mit). Jetzt merkt sich das Dach, was die andere Form weggenommen hat, und bekommt es zurück, sobald es wieder eine Form hat, die es haben kann (solange die Seite offen ist; Strg+Z geht wie vorher).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 163.1 | `node --test tests/floorpanel.test.mjs` (mit `STATIC_DIR`, wie in CI) | Satteldach → Pultdach → Satteldach: 35°, Gauben, Absätze und Dachfenster wieder da; über Pultdach und Flachdach zum Walmdach ebenso; neue Gauben werden nicht überschrieben | ✅ (2026-11-06, Claude) |
| 163.2 | Demo (neu gebaut mit 4.67.2): Etage „Dach“, „Pultdach“, „Hohe Seite“ durchprobieren, zurück auf „Satteldach“ | Das Satteldach mit 35° und den beiden Gauben, das Dachfenster dazwischen | ✅ (2026-11-06, Claude in der neu gebauten Demo) |
| 163.3 | Browser-Test: base (Gauben, Flachdach, Walmdach), 72_skylights (Flachdach, Pultdach), 66_gables, 12_roofsteps | Vom Flachdach zum Walmdach kommen die Gauben zurück, vom Flachdach zum Pultdach das Dachfenster; die anderen Prüfungen wie vorher | ✅ (2026-11-06, Claude im Browser-Test: base 87 Prüfungen (neu: vom Flachdach zum Walmdach kommen die Gauben zurück), 72_skylights, 66_gables, 12_roofsteps, 10_roofs, 71_roof_cut, 14_showcase, 03_houses: alle grün) |

## 164. Neu in 4.68.0: 🪜 Geschosshöhe je Haus, Stufen je Etage, L-Treppe mit 2. Ecke (#671)
Gefragt von Oely99 in #671: „FLOOR_H is fixed at 3.0 m … My real stair has 14 steps; the real floor-to-floor height is about 2.75 m“ und „L stair with winders at both ends (unten und oben viertelgewendelt)“. Neu: „Etage verwalten“ → „Geschosshöhe (ganzes Haus)“ (2,2 bis 6 m, sonst 3 m), an jeder Treppe „Stufen je Etage“ mit der Höhe einer Stufe darunter, an der L-Treppe „2. Ecke“ (keine, Podest, Gewendelt) mit „Wendelstufen (2. Ecke)“ und „Stufen im 2. Lauf“; mit Wendelstufen darf „Stufen im 1. Lauf“ 0 sein (man steigt von der Seite auf).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 164.1 | `node --test tests/winders.test.mjs tests/housefloors.test.mjs` (mit `STATIC_DIR`, wie in CI) | Die Treppe von Oely99 (0,95 m, 2,75 m, unten 3, 6 gerade, oben 5 Wendelstufen) hat 14 gleich hohe Stufen ohne Überschneidung, die Öffnung ist genau die Treppe; zwei Podeste und drei Läufe; „Stufen je Etage“ von 25 bis 12 cm hoch; die Geschosshöhe bleibt zwischen 2,2 und 6 m, 3 m wird nicht gespeichert | ✅ (2026-11-06, Claude) |
| 164.2 | `python3 -m pytest tests/test_import.py` | Import und Export kennen `building.storeyHeight`, `steps`, `corner2`, `winders2`, `split2` und `split: 0` (nur mit Wendelstufen) | ✅ (2026-11-06, Claude) |
| 164.3 | Browser-Test Teil `74_storey_stairs` | Ohne Geschosshöhe wie bisher (3 m, 16 Stufen); 2,75 m: das Obergeschoss steht 2,75 m höher, die Treppe hat 14 Stufen, gespeichert mit dem Plan; 1 m wird 2,2 m; „Stufen je Etage“ 16 gibt 16 Stufen zu 16,2 cm, leer wieder 14; „Stufen im 1. Lauf“ 0, „2. Ecke“ „Gewendelt“ 5, „Stufen im 2. Lauf“ 6: 3 Keilstufen, 6 gerade, 5 Keilstufen; „keine“ nimmt die 2. Ecke wieder weg | ✅ (2026-11-06, Claude im Browser-Test 74_storey_stairs, 17 Prüfungen) |
| 164.4 | Das Demo-Haus (neu gebaut) im „Ganzen Haus“, „Aufeinander“, mit 2,6 m und 3,4 m Geschosshöhe | Keller, Etagen, Decken und Dach rücken zusammen bzw. auseinander, nichts schwebt; das Nachbarhaus behält seine 3 m | ✅ (2026-11-06, Claude in der neu gebauten Demo) |
| 164.5 | Demo: „Bearbeiten“, „Etage verwalten“, „Geschosshöhe“ 2.75; „Treppe“ → „L-Treppe“, „Ecke“ „Gewendelt“, in einen Raum klicken; „Stufen im 1. Lauf“ 0, „2. Ecke“ „Gewendelt“, „Wendelstufen (2. Ecke)“ 5, „Stufen im 2. Lauf“ 6; dann „3D“ | Unten 3 Keilstufen (man steigt von der Seite auf), ein gerader Lauf, oben 5 Keilstufen zur selben Seite; „Stufen je Etage“ 14, darunter „Eine Stufe ist 18.3 cm hoch“ | ✅ (2026-11-06, Claude in der neu gebauten Demo: genau diese Schritte als Video `stairs-storey` aufgenommen und Bild für Bild angesehen) |
| 164.6 | Im Add-on (oder Oely99 mit seiner Treppe: 0,95 m breit, 14 Stufen, unten 3, oben 4 bis 5 Wendelstufen, Geschosshöhe 2,75 m) | Sieht aus wie die echte Treppe | ❓ |
| 164.7 | Nach dem Merge auf der Seite der Anleitung das Video „Geschosshöhe und Treppe unten und oben gewendelt“ ansehen | Geschosshöhe 2,75, die L-Treppe mit beiden Ecken, „Stufen je Etage“ 14, das 3D-Bild von der Seite | ❓ |

## 165. Neu in 4.69.0: 🏷 Raumname aus einem Bereich von Home Assistant, ⏱ Uhrzeit beim Ziehen im Heizplan
Der Besitzer, 2026-11-07: „dass ich entweder der Home Assistant Bereiche auswählen kann, wie der Raum heißt, oder einen eigenen Raumname vergeben kann … wenn man sich schon die Arbeit gemacht hat, so Bereiche zu erstellen, dass man die auch einfach dann zuordnen kann“ und „beim Heizplan … während man die Leiste verschiebt … oben drüber die genaue Uhrzeit … wenn man loslässt, dass man dann weiß, auf wie viel Uhr“. Neu: direkt unter „Name“ eines Raums die Auswahl „HA-Bereich“ („✏️ Eigener Name“ oder ein Bereich, die freien zuerst), „↺ Name aus Home Assistant“, „🔗 … alle verknüpfen“; im 📅 Heizplan ein Schild mit der Uhrzeit über der Kante beim Ziehen.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 165.1 | `node --test tests/roomname.test.mjs` (mit `STATIC_DIR`, wie in CI) | Namen ohne Groß/klein und Leerzeichen verglichen; die freien Bereiche zuerst, die vergebenen danach mit Raum und Etage; ein Bereich gibt Verknüpfung und Namen, „Eigener Name“ nimmt nur die Verknüpfung weg; ein eingetippter Name verknüpft nur mit einem freien Bereich und nur einen Raum ohne Bereich; „alle verknüpfen“ nimmt jeden Bereich nur einmal | ✅ (2026-11-07, Claude) |
| 165.2 | Browser-Test Teil `75_room_area` | Name zuerst, darunter „HA-Bereich“ mit „✏️ Eigener Name“, den freien Bereichen und „Wohnzimmer · schon: Wohnen“; „Büro“ gewählt: Name „Büro“, verknüpft; eigener Name „Arbeiten“: verknüpft bleibt, „↺“ holt „Büro“ zurück; „Eigener Name“: Verknüpfung weg, der Cursor im Namen; „BÜRO “ getippt: verknüpft von selbst; „🔗 2 Räume … alle verknüpfen“ und ein Rückgängig; gespeichert; ohne Bereiche nur der Name und ein Hinweis | ✅ (2026-11-07, Claude im Browser-Test 75_room_area, 14 Prüfungen) |
| 165.3 | Browser-Test Teil `50_rules` (Heizplan) | Beim Ziehen einer Kante steht über der Leiste die Uhrzeit (auf 15 Minuten), nach dem Loslassen noch, der Block beginnt dann; kurz danach verblasst sie | ✅ (2026-11-07, Claude im Browser-Test 50_rules) |
| 165.4 | Demo: „Bearbeiten“, „2D“, Erdgeschoss, die Küche anklicken; rechts „HA-Bereich“ → „Küche“, dann im Namen „Wohnküche“ tippen, „↺ Name aus Home Assistant“, „🔗 4 Räume heißen wie ein Bereich: alle verknüpfen“ | Unter dem Namen die Auswahl; „Küche“ verknüpft (die Zeile sagt es), „Wohnküche“ bleibt verknüpft („mit eigenem Namen“), „↺“ gibt „Küche“ zurück; Bad, Garage, Kinderzimmer und Flur werden verknüpft | ✅ (2026-11-07, Claude in der neu gebauten Demo: als Video `room-area` aufgenommen und angesehen) |
| 165.5 | Demo: „Live“, unten „Klima“, oben „Heizplan“, „Wohnzimmer“; den linken Rand eines Blocks ziehen und loslassen | Über der Kante steht die Uhrzeit (z. B. „07:15“), sie geht mit; nach dem Loslassen bleibt sie kurz stehen | ✅ (2026-11-07, Claude in der neu gebauten Demo und im Video `heatplan`) |
| 165.6 | Im Add-on mit deinen echten Bereichen: einen Raum anklicken, „HA-Bereich“ aufklappen; „🔗 … alle verknüpfen“, wenn es erscheint | Deine Bereiche stehen da (die schon vergebenen unten mit ihrem Raum); ein Raum heißt danach wie sein Bereich und zeigt im Live-Modus dessen Geräte | ❓ |
| 165.7 | Am Tablet oder Handy im 📅 Heizplan mit dem Finger eine Kante ziehen | Die Uhrzeit steht über dem Finger, gut lesbar; nach dem Loslassen weißt du, wohin du geschoben hast | ❓ |
| 165.8 | Nach dem Merge auf der Seite der Anleitung die Videos „Raum nach einem Bereich aus Home Assistant benennen“ und „📅 Heizplan“ ansehen | Die Küche bekommt ihren Bereich, „Wohnküche“, „↺“, „alle verknüpfen“; im Heizplan die Uhrzeit über der Kante | ❓ |

## 166. Neu in 4.70.0: ⚡ Strom je Gebäude
Der Besitzer, 2026-11-07: „wenn man alle zwei Häuser, die man hat, wenn die nebeneinander stehen, in einem Haus die drin hat und dann über Bereiche sozusagen die Häuser trennt, dass dann auch für den einen Bereich einen eigenen Stromrechner gibt … wenn man dann auf den Bereich 2 schaltet, dass dann das alles für den Bereich 2 ist“; seine Wahl: mit „Alle Gebäude“ beides getrennt, „⚖ Vergleichen“ auch für Gebäude. Neu: im Reiter „⚡ Rechnung“ der Haken „⚡ Eigene Rechnung je Gebäude“ und „Rechnung für: …“; Strom-Anzeige, Strom-Bild, ☀ Heute und ⚡ Energie zeigen das Gebäude, das oben gewählt ist, bei „Alle Gebäude“ jedes für sich.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 166.1 | `node --test tests/energyunits.test.mjs` (mit `STATIC_DIR`, wie in CI) | Ohne Haken eine Rechnung für den Plan; mit Haken zählt jedes Gebäude nur die Stromgeräte in seinen Räumen (ein Gerät im Garten in keinem), die bisherige Rechnung bekommt das gewählte Gebäude; zurück: dessen Rechnung gilt für den Plan; ein Plan, von dem nur ein Gebäude mit Rechnung übrig ist, nimmt diese | ✅ (2026-11-07, Claude) |
| 166.2 | Browser-Test Teil `76_energy_buildings` | Haken an: zwei Rechnungen (800 W und 300 W aus dem Netz), gespeichert je Gebäude; „Gartenhaus“ in „Rechnung für“ schaltet auch oben um, eine Einstellung ändert nur seine Rechnung; Strom-Anzeige mit „Gartenhaus“ nur 300 W, mit „Alle Gebäude“ eine Zeile je Gebäude; ☀ Heute eine Zeile je Gebäude; ⚡ Energie mit beiden Gebäuden, bei „Alle“ „⚖ Vergleichen“, mit „Haupthaus“ oben dessen eigene Zähler; Haken weg: wieder eine Rechnung | ✅ (2026-11-07, Claude im Browser-Test 76_energy_buildings, 14 Prüfungen) |
| 166.3 | Browser-Test Teile `15_energy`, `32_today_energy`, `21_buildings`, `40_energy_counters` | Alles wie bisher: ein Plan ohne Gebäude oder ohne Haken rechnet wie vorher | ✅ (2026-11-07, Claude) |
| 166.4 | Demo: „Bearbeiten“, „🏘 Gebäude in diesem Plan“: zwei Gebäude (Haupthaus: die Räume des Erdgeschosses, Anbau: Hauswirtschaft); „Strom“ → „Rechnung“ → „⚡ Eigene Rechnung je Gebäude“, „Rechnung für: Anbau“ | Der Anbau rechnet mit seiner Solaranlage und Batterie (2,70 kW, lädt 600 W), das Haupthaus mit seinem Zähler und dem Solardach | ✅ (2026-11-07, Claude in der neu gebauten Demo und im Video `energy-buildings`) |
| 166.5 | Demo danach: „Live“, oben „🏘 Alle Gebäude“, unten „Strom“; dann oben „Haupthaus“; dann unten „Energie“ | Zwei Strom-Bilder („Haupthaus“, „Anbau“), mit „Haupthaus“ nur eins; ⚡ Energie hat Knöpfe für beide Gebäude und „⚖ Vergleichen“; ☀ Heute „Strom jetzt“ mit einer Zeile je Gebäude und dem Ladestand der Batterie | ✅ (2026-11-07, Claude in der neu gebauten Demo) |
| 166.6 | Im Add-on: deine zwei Häuser in einem Plan als zwei Gebäude, „⚡ Eigene Rechnung je Gebäude“, für jedes die Sensoren und Zähler einstellen | Oben auf ein Gebäude schalten zeigt nur seinen Strom, „Alle Gebäude“ beide getrennt, ⚡ Energie vergleicht sie | ❓ |
| 166.7 | Nach dem Merge auf der Seite der Anleitung das Video „⚡ Strom je Gebäude: zwei Häuser in einem Plan“ ansehen | Der Haken, „Rechnung für“, zwei Strom-Bilder, ⚡ Energie mit „⚖ Vergleichen“ | ❓ |

## 167. Neu in 4.70.1: Bereit für Home Assistant 2026.11 (neue Namen, Teil-Geräte)
Der Besitzer, 2026-11-08: „so es gibt 2026.11 das Home Assistant update schaue dir das update mal an und mache mir vorschläge was wir verändern müssen da sich das namenschema ja grundlegend verändert oder müssen wir nix machen“; seine Wahl: „Teil-Geräte“ und „Namen an einer Stelle“ (#675). Im Add-on geht durch das Update nichts kaputt. Neu: der Name einer Entität wird an einer Stelle gelesen (`hanames.py`, ohne `friendly_name` aus den Registern gebaut); Geräte, die Home Assistant in Teile aufteilt, finden ihren Akku, ihre Thermostat-Teile und ihre Zähler weiter (`hadevices.py`).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 167.1 | `pytest tests/test_hadevices.py tests/test_hanames.py tests/test_renames.py tests/test_counters.py tests/test_server.py` | Teil-Geräte: erst das eigene Teil, dann das ganze Gerät, ein Teil in einem anderen Bereich für sich; Namen wie Home Assistant (vor und ab 2026.11); kein Teil des Add-ons liest `friendly_name` selbst; ohne Geräteliste alles wie vorher | ✅ (2026-11-08, Claude) |
| 167.2 | `tools/ha_check.py` mit einem echten Home Assistant 2026.11.0 (Python 3.14) | „ALL OK“: die Abläufe des Add-ons werden angenommen und laufen, Szenen und besondere Tage gehen; 7 Namen gleich wie der `friendly_name` von Home Assistant (umbenannt, Hauptentität, Teil-Gerät); 5 Prüfungen der Teil-Geräte und der Bereichs-Vorlage richtig | ✅ (2026-11-08, Claude) |
| 167.3 | `tools/ha_check.py` mit Home Assistant 2026.2.3 (Python 3.13) | „ALL OK“ wie bisher (ohne Teil-Geräte) | ✅ (2026-11-08, Claude) |
| 167.4 | Browser-Test Teile `07_tablet`, `11_live`, `22_energy_setup`, `40_energy_counters`, `33_climate_routines_family`, `43_battery_levels` (der nachgebaute Rauchmelder liegt jetzt auf einem Teil-Gerät, sein Akku am Hauptgerät) | Geräteübersicht zeigt den Akku des Rauchmelders (15 %, 🪫); Umbenennen, Energie-Dashboard übernehmen, „⤵ Von oben übernehmen“, Familie und Ladestand wie bisher | ✅ (2026-11-08, Claude, 248 Prüfungen) |
| 167.5 | Im Add-on nach dem Update auf Home Assistant 2026.11: den Plan ansehen, „Geräte“ oben öffnen | Die Namen im Plan sind wie vorher, die Geräteübersicht zeigt die Akkus wie vorher | ❓ |
| 167.6 | Nur wenn du Geräte mit mehreren Teilen hast (Steckdosenleiste mit Tuya, Z-Wave-Thermostat mit Fühlern, ESPHome, MQTT): in Home Assistant ein Gerät umbenennen | Der neue Name kommt von selbst in den Plan (außer bei Namen, die du im Plan selbst getippt hast); Akku und Heizungs-Teile stehen beim richtigen Gerät | ❓ |

## 168. Neu in 4.71.0: ⏸️ Heizplan aussetzen, das Gebäude oben gilt auf jeder Seite
Der Besitzer, 2026-11-08: „in dieses Thermostat einen Knopf … wo man irgendwie gedrückt halten kann und dann sagen, Heizplan aussetzen für heute oder für eine halbe, dreiviertel Stunde, und das überschreibt halt alle anderen Sachen, dass man selbst manuell regeln kann … für bestimmte Benutzer oder für bestimmte Dashboards“; dann: „dass man dann auch wirklich nur in den Dashboards die Entitäten sieht, die dem Gebäude zugeordnet sind“ (#677). Bilder: `docs/ideen-4.71/`. Seine Wahl per Auswahl: der Admin stellt ein, was trotzdem gilt; gedrückt halten; je Benutzer und je Karte; Gebäude: Karten von selbst ausblenden und Seiten einem Gebäude zuordnen.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 168.1 | `pytest tests/test_heatrules.py tests/test_heatorder.py tests/test_rules_api.py tests/test_boards.py`, `node --test tests/heatpause.test.mjs tests/buildingents.test.mjs` | Pause: hält das Thermostat, kein „nach 10 Min zurück“, ein neuer Block wartet, danach der Heizplan; Fenster, Zu warm, Urlaub/Abwesend/Nacht nur wie eingestellt; Tausende zufällige Tage mit Pausen ohne Fehler; Sperre „heatPause“ lehnt ab; Gebäude-Filter mit Gruppen | ✅ (2026-11-08, Claude) |
| 168.2 | Browser-Test Teil `77_pause_buildings` (dazu `50_rules`, `21_buildings`, `60_roomgroups`, `61_scenebar_lights`, `62_light_bars`, `63_free_grid`) | Knopf erst, wenn eingeschaltet; Antippen öffnet nichts, Halten die Auswahl; 45 Min pausiert, ＋15 Min, Fortsetzen setzt den Heizplan; gesperrter Benutzer ohne Knopf; Haus B oben: kein Thermostat von Haus A, die Seite von Haus A nicht in der Leiste | ✅ (2026-11-08, Claude) |
| 168.3 | Demo: unten „Klima“, im Wohnzimmer unter − / + auf „⏸️ Heizplan aussetzen“ kurz tippen, dann gedrückt halten | Kurz: nur „gedrückt halten“ wackelt; gedrückt: eine Auswahl 30 Min, 45 Min, 1 Std, Bis zum nächsten Block, Für heute | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: ein kurzer Tipp öffnet nichts und sagt „gedrückt halten“, gedrückt kommt die Auswahl) |
| 168.4 | Demo: „45 Min“ wählen, dann „＋15 Min“, dann „▶ Heizplan fortsetzen“ | Der Knopf wird grün „Heizplan fortsetzen · ausgesetzt bis …“, ＋15 Min schiebt die Zeit um 15 Minuten, Fortsetzen macht ihn wieder lila | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: grün „Heizplan fortsetzen · ausgesetzt bis …“, ＋15 Min schiebt die Zeit, Fortsetzen macht ihn wieder lila) |
| 168.5 | Demo: „Klima“ → „📋 Heiz-Regeln“, Karte „⏸️ Heizplan aussetzen“ | Schalter, die Zeiten zum Antippen, 🪟 Fenster offen gilt trotzdem (an), 🔥 Zu warm, 🚶 Endet bei Urlaub … | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: Schalter, Zeiten, Fenster offen, Zu warm, Urlaub) |
| 168.6 | Im Add-on: Heiz-Regeln → „⏸️ Heizplan aussetzen“ einschalten, an einem Thermostat mit Heizplan 45 Min wählen und von Hand wärmer drehen | Nach 10 Minuten dreht nichts zurück; nach 45 Minuten kommt die Temperatur des Heizplans; im 🩺 Protokoll „⏸️ von Hand“ | ❓ |
| 168.7 | Im Add-on: ⚙ → Benutzer & Tablets, bei einem Tablet „Heizplan aussetzen (⏸️ am Thermostat)“ ankreuzen; an einer eigenen Thermostat-Karte „Knopf … Verstecken“ | Auf dem Tablet kein Knopf; in der Karte kein Knopf, auf 🌡 Klima weiter da | ❓ |
| 168.8 | Im Add-on mit deinen zwei Häusern in einem Plan: oben ein Gebäude wählen, dann Klima, Kameras, Musik & TV, Haushalt, Abläufe, Protokoll und deine eigenen Seiten ansehen | Nur noch Geräte dieses Gebäudes (und was zu keinem gehört: Garten, Wetter, Personen); mit „🏘 Alle Gebäude“ wieder alles | ❓ |
| 168.9 | Im Add-on: eine eigene Seite bearbeiten (✎, „⚙️ Seite“), „Gehört zu Gebäude“ wählen | Die Seite steht nur bei diesem Gebäude in der Leiste, mit „🏘 Alle Gebäude“ immer | ❓ |
| 168.10 | Nach dem Merge: Videos „⏸️ Heizplan aussetzen“ und „🏘 Ein Gebäude wählen“ auf der Seite der Anleitung | Zeigen Halten, Auswahl, Fortsetzen; das Gebäude oben und die Seiten | ❓ |

## 169. Neu in 4.72.0: 🪟 Fenster mit fester Scheibe unten oder oben
Gefragt von markweiffenbach in #679: hohe, schmale Fenster vom Boden bis zur Decke, „der untere Teil (etwa 0–1,10 m) ist fest verglast, nur der obere Teil (etwa 1,10–2,20 m) geht auf oder kippt“; in seiner Wohnung 6 Stück. Der Besitzer: „#679 schau dir das mal an“. Gleich gebaut (der Wunsch war klar).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 169.1 | `node --test tests/windowpanes.test.mjs tests/sash.test.mjs`, `pytest tests/test_import.py` | Höhe der festen Scheibe, gekürzt auf das, was passt (die Flügel behalten 30 cm); in 3D die Flügel, ihr Rahmen und das Kippen nur im Teil, der aufgeht, die feste Scheibe wird nicht eingefärbt; JSON-Import und -Export mit `fixedBelow` / `fixedAbove` und der Vorlage `windowFloor` | ✅ (2026-11-08, Claude) |
| 169.2 | Browser-Test Teil `78_fixed_glass` (dazu `69_window_tilt`) | Felder „Feste Scheibe unten / oben“ (leer = keine), 1,1 m wird gespeichert, zu viel wird gekürzt; gekippt gelb, offen rot, die feste Scheibe behält ihre Farbe; „Fest“ entfernt sie; „Bodentief, unten fest“ in der Leiste | ✅ (2026-11-08, Claude) |
| 169.3 | Demo: Bearbeiten, Erdgeschoss, im Wohnzimmer an der Wand links das schmale hohe Fenster „Fenster Wohnzimmer bodentief“ anklicken | Unten eine feste Scheibe bis 1,1 m, darüber ein Querholz und ein Flügel mit Griff; rechts „Feste Scheibe unten“ 1.1, „Feste Scheibe oben“ leer | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks, klassische Leiste: unten 1,1 m fest, oben leer) |
| 169.4 | Demo: bei diesem Fenster „Feste Scheibe oben“ auf 0.4 setzen, dann leer machen | Oben kommt eine feste Scheibe (Oberlicht) dazu, der Flügel wird kürzer; leer: wieder weg | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: 0.4 gibt ein Oberlicht, leer ist es wieder weg) |
| 169.5 | Demo: „Tür/Fenster“ → „Bodentief, unten fest“, auf eine Wand klicken | Ein neues Fenster vom Boden bis 2,2 m, unten 1,1 m fest | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: neues Fenster vom Boden bis 2,2 m, unten 1,1 m fest; danach ↶) |
| 169.6 | Im Add-on: bei einem deiner Fenster „Feste Scheibe unten“ eintragen und den Kontakt öffnen oder kippen | Nur der Flügel oben wird gelb (gekippt) oder rot (offen) und bewegt sich, die feste Scheibe unten bleibt klar | ❓ |
| 169.7 | Nach dem Merge: Video „Fenster mit fester Scheibe unten oder oben“ auf der Seite der Anleitung | Zeigt das Feld, gekippt und offen, das Oberlicht und die neue Fensterart | ❓ |

## 170. Neu in 4.73.0: ✨ Oberfläche 2 (die neue Bearbeiten-Leiste, umschaltbar)
Dein Wunsch vom 2026-11-08 („so unendlich viele Einstellmöglichkeiten … dass man zwischen alt und neu wechseln kann … mit Sachen ein- und ausklappen“), deine Wahl der Bilder am 2026-11-09 (1–5, 7–10, 12–14; das Fenster „halb offen“, Bild 17 B). Erster Teil: Fenster, Tür, Raum, Gerät, Wand. Noch nicht gebaut: 5 (Noppel), 9 (Haus als Baum), 10 (Etage), 12 (Suchen), 13 (Übernehmen), das Handy.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 170.1 | `node --test tests/uiv2.test.mjs` | Welche Felder in welchen Abschnitt kommen, die Zeilen („1,20 × 1,20 m · Brüstung 0,90 m“), was ein Flügel tut (wie die alten Felder), die Fensterarten, die Bilder (halb offen, Boden von der Seite) | ✅ (2026-11-09, Claude) |
| 170.2 | Browser-Test Teil `79_ui_v2` (dazu `78_fixed_glass`, `75_room_area`, `69_window_tilt`, `55_levels` mit der alten Leiste) | ?ui=2 schaltet um und bleibt; Pfad, Kopf, „Löschen“ oben; die Abschnitte in der Reihenfolge, auf- und zuklappen bleibt; Flügel antippen und wählen, Anzahl, nach außen; Fensterart „Bodentief, unten fest“; Raum mit Reitern, Boden antippen, Höhe −15; „Klassisch“ zeigt die alte Leiste; ⚙ → Allgemein „Oberfläche“; im Add-on gespeichert | ✅ (2026-11-09, Claude) |
| 170.3 | Demo: Bearbeiten, oben „✨ Neu“ antippen, im Wohnzimmer ein Fenster anklicken | Rechts oben der Weg (Demo-Haus › Erdgeschoss › Wohnzimmer › Fenster), der Kopf mit Name und „Löschen“, darunter Abschnitte mit einer Zeile, was eingestellt ist; „Fensterart“, „Feste Scheibe“, „Home Assistant“ … zu, „Größe & Lage“ und „Flügel & Öffnen“ offen | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: Weg, Kopf mit „Löschen“, Zeilen; „Größe & Lage“ und „Flügel & Öffnen“ offen, der Rest zu) |
| 170.4 | Demo: im Bild des Fensters auf einen Flügel tippen, „Drehen, Scharnier links“ wählen | Der Flügel ist zur Seite gedreht gezeichnet, darunter „dreht“; im 3D-Bild geht er so auf | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: darunter „dreht“) |
| 170.5 | Demo: „Fensterart“ aufklappen, „Bodentief, unten fest“ antippen | Das Fenster ist jetzt bodentief mit fester Scheibe unten; die Zeile sagt „Bodentief, unten fest“ | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: die Zeile sagt „Bodentief, unten fest“) |
| 170.6 | Demo: einen Raum anklicken, Reiter „Boden“, oben „Fliesen“, eine Fliese antippen; „Boden höher als die Etage“ auf −0.15 | Der Boden im 3D-Bild wechselt; das kleine Bild zeigt den Raum 15 cm tiefer | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: „Fliesen“, eine Fliese gewählt, die Seitenansicht zeigt −15) |
| 170.7 | Demo: oben „Klassisch“ antippen | Die alte Leiste, genau wie vorher | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: die alte Leiste mit Name und Bodenbelag, keine Reiter) |
| 170.8 | Gefällt es dir? Was fehlt, was ist zu viel, was soll anders heißen? | Deine Antwort (z. B. als Text bei „Other“) | ❓ |
| 170.9 | Nach dem Merge: Video „Die neue Leiste (Oberfläche 2)“ auf der Seite der Anleitung | Zeigt das Umschalten, die Abschnitte, das Fenster halb offen, die Fensterarten und den Raum mit Böden | ❓ |

## 171. Neu in 5.0.0: ✨ Oberfläche 2 komplett (Haus als Baum, Etage, Suchen, Reiter an der Leiste, Übernehmen)
Dein Wunsch vom 2026-11-09: „5, 9, 10, 12, 13 – kannst du das weiter machen?“ (Bilder 5, 9, 10, 12, 13 in `docs/ideen-5.0/`). Alles mit „✨ Neu“ oben.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 171.1 | `node --test tests/uiv2more.test.mjs` | Baum (Etagen von oben nach unten, Räume mit Größe), Etage verschieben, Etagen von der Seite, Suche (ohne Umlaute und Großbuchstaben), was übernommen wird (Kontakte und Namen nie, ein festes Fenster bleibt heil) | ✅ (2026-11-09, Claude) |
| 171.2 | Browser-Test Teil `80_ui_v2_more` (dazu `79_ui_v2`, `09_floors`) | Baum mit Haus / Objekte / Hilfe; Etage öffnen, Art umschalten; Etage ziehen und ↶; Raum antippen; Suchen „kipp“ und „Sprache“ (⚙); Reiter an der Leiste, Seitenfach; „⇉ Übernehmen“ für das andere Fenster im Raum und ↶ | ✅ (2026-11-09, Claude) |
| 171.3 | Demo: Bearbeiten, „✨ Neu“, nichts anklicken (Esc) | Rechts oben „🗂 Haus · 🔍 Objekte · ❔ Hilfe“, darunter das Demo-Haus mit Dach, Dachgeschoss, Obergeschoss, Erdgeschoss (offen, mit seinen Räumen) und Keller | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: Haus · Objekte · Hilfe, fünf Etagen, Räume) |
| 171.4 | Demo: im Baum auf „Erdgeschoss“ tippen | Die Etage öffnet sich: Name, Art als drei Knöpfe, die Geschosshöhe mit dem Haus von der Seite (Erdgeschoss leuchtet) | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: die Etage mit dem Haus von der Seite) |
| 171.5 | Demo: im Baum eine Etage mit ⠿ auf eine andere ziehen, dann ↶ | Die Etage steht an der neuen Stelle (im 3D-Bild auch); ↶ stellt es zurück | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: gezogen, ↶ stellt die Reihenfolge zurück) |
| 171.6 | Demo: ein Fenster anklicken, oben „kipp“ suchen | Nur „Kontakt gekippt“ und „Kippwinkel“ bleiben; die Zeile sagt die Zahl der Treffer | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: nur die Kipp-Felder bleiben, die Zeile sagt die Treffer) |
| 171.7 | Demo: links an der Leiste auf den Reiter „Rollladen“ tippen | Der Abschnitt kommt in ein Seitenfach neben der Leiste; noch ein Tipp legt ihn zurück | ✅ (2026-11-10: seit 5.4.2 gibt es kein Seitenfach mehr, der Reiter springt zum Abschnitt; geprüft in 184.1 bis 184.3) |
| 171.8 | Demo: bei einem Fenster einen Flügel auf „Drehen links“ stellen, dann „⇉ Übernehmen“ → „Für … übernehmen“ | Die anderen Fenster der Etage gehen auch links auf; ↶ macht es rückgängig | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: die anderen Fenster der Etage übernehmen es, ↶ macht es rückgängig) |
| 171.9 | Gefällt es dir? Was fehlt noch, was ist zu viel? | Deine Antwort | ❓ |
| 171.10 | Nach dem Merge: die Videos „Oberfläche 2: das Haus als Baum …“ und „… Suchen, Reiter an der Seite, Übernehmen“ | Zeigen Baum, Etage, Suchen, Seitenfach und Übernehmen | ❓ |

## 172. Neu in 5.1.0: 🔺 das neue Dach und 🔒 Räume sperren
Dein Wunsch vom 2026-11-09: „das Dach neu aufmachen, dass es geiler und übersichtlicher ist“ und „Räume sperren, dass diese nicht verschoben werden“ (Bilder in `docs/ideen-5.1/`: Dach alle, Sperren 7 und 9, dazu L-Dach und „+“-Dach, Geräte einzeln sperren, die Streifen blasser und ausschaltbar).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 172.1 | `node --test tests/roomlock.test.mjs tests/roofedit.test.mjs tests/rooftemplates.test.mjs` | Was gesperrt ist und warum (auch die Wand zum Nachbarraum), „Grundriss fertig“, nur Admins; Dach von der Seite, Karte von oben, Ziehen; Vorlagen mit L- und Kreuzdach, eigenes Dach | ✅ (2026-11-09, Claude) |
| 172.2 | Browser-Test Teil `81_roof_lock` (dazu `10_roofs`, `72_skylights`, `80_ui_v2_more`, `12_roofsteps`, `66_gables`, `71_roof_cut`, `79_ui_v2`) | 🔒 beim Raum, Wand bleibt, Pfeiltasten und Entf, Grundriss fertig mit Schild oben, Gesperrte zeigen, klassische Zeile; Dach: Form, Neigung tippen und ziehen, Gaube auf der Karte ziehen, ＋ Gaube, Kreuz- und L-Dach, Mein Dach merken | ✅ (2026-11-09, Claude) |
| 172.3 | Demo: Bearbeiten, „✨ Neu“, Etage „Dach“, dann aufs Dach im Bild klicken | Rechts das neue Dach: oben „2 Gauben · 1 Dachfenster · Module · ausgebaut“, darunter Form / Auf dem Dach / Mehr Dächer / Vorlagen | ✅ (2026-11-09, Claude in der Demo) |
| 172.4 | Demo: unter „Form“ auf „Walmdach“ tippen, dann wieder „Satteldach“ | Das Dach im Bild ändert sich sofort; die Gauben sind danach wieder da | ✅ (2026-11-09, Claude in der Demo) |
| 172.5 | Demo: im Dach von der Seite den Punkt am Bogen nach oben ziehen; dann ⤢ | Das Dach wird steiler (die Zahl darunter auch), grün zeigt, wo man stehen kann; ⤢ zeigt es groß | ✅ (2026-11-09, Claude in der Demo) |
| 172.6 | Demo: „Auf dem Dach“, eine Gaube auf der Karte zur Seite ziehen | Sie wandert im Bild mit, ihre Karte geht auf, „… vom Giebel“ steht daneben | ✅ (2026-11-09, Claude in der Demo) |
| 172.7 | Demo: das Dach ist ausgewählt, eine Gaube im 3D-Bild anfassen und am Dach entlang ziehen | Die Gaube rutscht am Dach entlang; rechts geht „Auf dem Dach“ mit ihr auf | ✅ (2026-11-09, Claude in der Demo) |
| 172.8 | Demo: „Vorlagen“ → „Kreuzdach (+)“, dann „L-Dach“, dann ↶ | Ein Giebel quer über die Mitte; dann ein zweiter Giebel an einem Ende; ↶ holt das alte Dach zurück | ✅ (2026-11-09, Claude in der Demo) |
| 172.9 | Demo: „⭐ Mein Dach merken“, Namen eingeben, dann eine andere Vorlage und dein Dach antippen | Dein Dach steht als ⭐-Bild bei den Vorlagen und kommt mit einem Tipp zurück | ✅ (2026-11-09, Claude in der Demo) |
| 172.10 | Demo: Erdgeschoss, Wohnzimmer antippen, oben 🔒 | Der Raum ist gesperrt, „Was bleibt fest?“ geht auf; im Bild sind seine Böden blass gestreift | ✅ (2026-11-09, Claude in der Demo) |
| 172.11 | Demo: 2D, an der Wand zwischen Wohnzimmer und Küche ziehen | Sie bleibt stehen, unten steht „🔒 „Wohnzimmer“ ist gesperrt …“ | ✅ (2026-11-09, Claude in der Demo) |
| 172.12 | Demo: nichts ausgewählt, im Baum „🔒 Grundriss fertig“; dann „Ansicht“ → „🔒 Gesperrte zeigen“; dann oben „🔒 Grundriss gesperrt“ antippen | Alle Räume gesperrt, Geräte lassen sich weiter ziehen; die Streifen gehen aus und an; nach der Rückfrage ist alles wieder frei | ✅ (2026-11-09, Claude in der Demo) |
| 172.13 | Gefällt dir das neue Dach und das Sperren? Was fehlt noch? | Deine Antwort | ❓ |
| 172.14 | Nach dem Merge: die Videos „Das neue Dach …“ und „Räume sperren und „Grundriss fertig““ | Zeigen Form, Seitenansicht, Karte, Vorlagen; Schloss, Grundriss fertig, Gesperrte zeigen | ❓ |

## 173. Neu in 5.2.0: Normal und Beta
Deine Frage vom 2026-11-09: „wäre es nicht viel sinnvoller, wenn das Projekt einen offiziellen Release … und vielleicht auch noch eine Beta Version gibt“; deine Wahl: bauen, und die Beta pausiert von selbst, solange das normale Add-on läuft. Im Store gibt es jetzt „3D Floorplan“ (nur freigegebene Versionen) und „3D Floorplan Beta“ (jede neue Version sofort). Freigeben: im Chat „Gib 5.3.0 frei“ sagen, oder auf GitHub Actions → „Release to everyone“ → „Run workflow“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 173.1 | `python3 -m pytest tests/test_channel.py tests/test_stable.py tests/test_release.py tests/test_rulesrun.py`, `node --test tests/card.test.mjs`, `tests/version.test.mjs` | Normal oder Beta, „ich laufe“ über Home Assistant, die Pause der Heiz-Regeln und Abläufe, die Kopie des normalen Add-ons (nur neuere Versionen, die Version so, wie sie zuletzt auf main war), Vorabversionen, die Karte findet beide | ✅ (2026-11-09, Claude) |
| 173.2 | Browser-Test Teil `02_tools` (dazu `50_rules`, `24_alarm_notify`, `29_guard`) | Oben „Beta“ im Schild, „⏸ Beta pausiert“ mit Erklärung; ohne Kanal pausiert nichts | ✅ (2026-11-09, Claude) |
| 173.3 | Nach dem Merge: in Home Assistant Einstellungen → Apps, dein „3D Floorplan“ | Es bietet 5.2.0 an; nach dem Update steht oben „✓ v5.2.0 · …“ ohne „Beta“ | ❓ |
| 173.4 | Dein Profil (unten links dein Name) → „Erweiterter Modus“ an; dann App-Store → ⋮ → „Nach Updates suchen“ | Neben „3D Floorplan“ steht jetzt auch „3D Floorplan Beta“ | ❓ |
| 173.5 | „3D Floorplan Beta“ installieren und starten, dann in der Seitenleiste „3D Floorplan Beta“ öffnen | Oben „v5.2.0 Beta“; nach ein paar Sekunden daneben orange „⏸ Beta pausiert“ (dein normales läuft ja) | ❓ |
| 173.6 | In der Beta auf „⏸ Beta pausiert“ tippen | Ein Fenster erklärt: das normale 3D Floorplan (5.2.0) läuft auch, die Beta schaltet nichts von selbst | ❓ |
| 173.7 | Das normale „3D Floorplan“ stoppen, 5 Minuten warten, die Beta neu laden; dann das normale wieder starten | Ohne das normale ist „⏸ Beta pausiert“ weg; nach dem Start ist es in höchstens einer Minute wieder da | ❓ |
| 173.8 | Im normalen 🗄️ → Backup herunterladen, in der Beta 🗄️ → die Datei zurückspielen | Dein Haus ist auch in der Beta; im normalen ändert sich nichts | ❓ |
| 173.9 | Deine Dashboard-Karte ansehen (beide Add-ons installiert) | Sie zeigt weiter das normale Add-on | ❓ |
| 173.10 | Bei der nächsten Version: „Gib 5.3.0 frei“ im Chat (oder Actions → „Release to everyone“ → „Run workflow“) | Das normale „3D Floorplan“ bietet danach 5.3.0 an; vorher nur die Beta | ❓ |

## 174. Repariert in 5.2.1: die große Seitenansicht des Dachs (⤢) (#684)
Gefunden, als Claude am 2026-11-09 den Abschnitt 172 in der Demo durchgegangen ist: die große Seitenansicht zeigte nach einer getippten Neigung, nach dem Ziehen in ihr selbst oder nach ↶ die alten Zahlen, und sie blieb nach Esc, nach einer anderen Etage oder wenn nichts mehr ausgewählt war über dem Bild stehen (und verdeckte links die Etagen). Jetzt wird sie mit dem Dach-Fenster neu gezeichnet und geht mit ✕, Esc oder von selbst zu.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 174.1 | Demo (neu gebaut mit 5.2.1): Dach anklicken, „⤢ groß“, in der Leiste die Neigung tippen; in der großen Ansicht den Punkt ziehen | Große Ansicht und Leiste zeigen dieselben Zahlen, das Bild bleibt da | ✅ (2026-11-09, Claude in der Demo) |
| 174.2 | Demo (neu gebaut mit 5.2.1): „⤢ groß“, dann Esc; noch einmal „⤢ groß“, dann ↶, eine andere Etage oder nichts auswählen | Sie geht jedes Mal zu, das Dach bleibt nach Esc ausgewählt | ✅ (2026-11-09, Claude in der Demo) |
| 174.3 | Browser-Test Teil `81_roof_lock` | Große Ansicht zeigt die getippte Neigung; Esc schließt sie; sie geht zu, wenn das Dach nicht mehr ausgewählt ist | ✅ (2026-11-09, Claude, 115/115) |
| 174.4 | Nach dem Merge in der Demo: Dach, „⤢ groß“, Neigung tippen, Esc | Wie 174.1 und 174.2 | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit echten Klicks: große Ansicht und Leiste zeigen 38°, Esc und ↶ schließen sie) |

## 175. Repariert in 5.2.2: 🔒 ein Raum allein ohne fremde Streifen, ✨ die Reiter mit Namen, ⚡ Strom-Editor in „Neu“, 🌡 kein Heizungsfenster beim Bearbeiten (#686, #687, #689, #690)
Gemeldet vom Besitzer am 2026-11-09 mit Fotos vom iPad: war oben links nur ein Raum gewählt, lagen die Streifen der anderen gesperrten Räume weiter auf der Wiese (#686); die Reiter links an der Leiste zeigten bei einem Fenster nur Zeichen, keine Namen (#687). Jetzt zeigt ein Raum allein nur seine eigenen Streifen, und jeder Reiter hat seinen Namen (hochkant, wenn alle passen, sonst quer unter dem Zeichen). Gleich danach: mit „✨ Neu“ zeigte der Strom-Editor keine Strom-Geräte, wenn vorher ein Raum oder Fenster ausgewählt war (#689), und beim Bearbeiten stand das Heizungsfenster mitten im Bild (#690).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 175.1 | Browser-Test Teil `81_roof_lock` | Im 3D-Bild hat der gesperrte Raum Streifen; nur die Küche gewählt: keine Streifen; nur der gesperrte Raum: seine Streifen; alle Räume: wie vorher |✅ (2026-11-09, Claude, 31/31, mit 175.6 32/32; dazu in der Demo: Keller, drei Räume gesperrt, nur die Garage gewählt: keine Streifen) |
| 175.2 | Browser-Test Teil `80_ui_v2_more` | Jeder Reiter zeigt seinen Namen: hochkant, wenn alle passen; bei niedrigem Fenster quer unter dem Zeichen und alle auf dem Bildschirm; sehr niedrig: die Reiter lassen sich schieben | ✅ (2026-11-09, Claude, 25/25, mit 175.5 28/28; dazu in der Demo in iPad-Größe: Fenster quer mit Namen, Tür hochkant und „Home Assistant“ ganz) |
| 175.3 | Im Add-on (Beta) am iPad: einen Raum sperren, oben links einen anderen Raum wählen, dann den gesperrten | Beim anderen Raum keine Streifen mehr auf der Wiese; beim gesperrten Raum nur seine eigenen | ❓ |
| 175.4 | Im Add-on (Beta) am iPad: „✨ Neu“, ein Fenster anklicken | Links an der Leiste hat jeder Reiter seinen Namen (Fensterart, Größe & Lage, Flügel & Öffnen …), nicht nur Zeichen | ❓ |
| 175.5 | Browser-Test Teil `80_ui_v2_more` (Werkzeug bei Auswahl) | „Gerät“ mit ausgewähltem Fenster: die Bibliothek oben, die Leiste des Fensters darunter; „Strom“: das Fenster ist nicht mehr ausgewählt, die Strom-Geräte stehen da |✅ (2026-11-09, Claude, 28/28; dazu `05_power` 54/54, `15_energy` 22/22, `22_energy_setup` 10/10; in der Demo: Küche gewählt, „Strom“ zeigt die Strom-Geräte) |
| 175.6 | Browser-Test Teil `81_roof_lock` (Heizungsfenster) | Ein Raum beim Bearbeiten gewählt: kein Heizungsfenster im Bild |✅ (2026-11-09, Claude, 32/32; dazu `04_lights` 32/32 mit dem Heizungsfenster in Live; in der Demo: Wohnzimmer gewählt, kein Heizungsfenster) |
| 175.7 | Im Add-on (Beta) am iPad: „✨ Neu“, oben links einen Raum wählen, dann oben „Strom“ | Rechts stehen die Strom-Geräte (Zählerkasten, Wechselrichter …) zum Setzen | ❓ |
| 175.8 | Im Add-on (Beta) am iPad: Bearbeiten, oben links einen Raum mit Heizung wählen | Kein Heizungsfenster mitten im Bild; in „Live“ ist es beim Raum wie bisher da | ❓ |

## 176. Verbessert in 5.2.3: ⛰ Keller halb aus der Erde (#691)
Gefragt von st03psn am 2026-11-09 (#691): ein Keller, der zur Hälfte aus der Erde schaut, mit Fenstern im oberen Teil. Das ging schon seit 4.58.0 mit einem einzigen Höhenpunkt in „Grundstück“ → „⛰ Gelände“ (z. B. −1,5 m: der ganze Rasen liegt so tief), aber die Hilfe sprach nur vom schrägen Grundstück. Jetzt sagt die Hilfe es auch für ebenen Grund, und beim Keller steht in „Etage verwalten“ eine Zeile dazu mit dem Knopf „⛰ Gelände einstellen“. Die Antwort im Issue hat Bilder (`docs/antworten/691/`).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 176.1 | Browser-Test Teil `68_terrain` | Beim Keller in „Etage verwalten“ die Zeile „Schaut der Keller halb aus der Erde? …“ und der Knopf „⛰ Gelände einstellen“; der Knopf öffnet Erdgeschoss, Plan und „⛰ Gelände“ (beim Erdgeschoss keine Zeile); die Hilfe nennt den ebenen Grund; ein Höhenpunkt −1,5 m legt den ganzen Rasen 1,5 m tiefer, auch im 3D-Bild | ✅ (2026-11-09, Claude, 22/22) |
| 176.2 | Demo (neu gebaut mit 5.2.3) mit „✨ Neu“: im Baum den Keller antippen, „⛰ Gelände einstellen“ | Zeile und Knopf stehen unter der Geschosshöhe (nicht unter einer Überschrift „Dach“); der Knopf öffnet das Erdgeschoss mit „Grundstück“ → „⛰ Gelände“ | ✅ (2026-11-09, Claude in der Demo) |
| 176.3 | Video „Gelände am Hang“ probeweise aufnehmen (deutsch und englisch) | Am Ende: Keller → „Etage verwalten“ → „⛰ Gelände einstellen“, ein Höhenpunkt −1,5 m, im 3D-Bild schaut der Keller halb heraus | ✅ (2026-11-09, Claude, beide Sprachen) |
| 176.4 | Die Antwort im Issue #691 | Die drei Bilder (Geschosshöhe, ein Höhenpunkt, vorher/nachher) sind da | ✅ (2026-11-09, Claude: die Bild-Adressen antworten mit dem Bild) |
| 176.5 | Nach dem Merge in der Beta: Keller öffnen, „Etage verwalten“, „⛰ Gelände einstellen“, einmal in den Plan tippen, −1,5 eintippen, dann „Ganzes Haus“ | Der Keller schaut zur Hälfte aus dem Rasen, seine Fenster sind zu sehen | ❓ |
| 176.6 | Nach dem Merge in der Anleitung: Video „Gelände am Hang“, Suche „Keller halb aus der Erde“ | Die Suche findet das Video, am Ende der halbe Keller | ✅ (2026-11-10, Claude: die Suche findet „Gelände am Hang“ als Erstes; der halbe Keller ist der letzte Schritt des Clips) |

## 177. Repariert in 5.2.4: Backup einspielen ohne Größengrenze (#693)
Gemeldet vom Besitzer am 2026-11-09 mit einem Bild: „Backup einspielen…“ zeigte nur „Backup fehlgeschlagen: 413“ (413 = „zu groß“). Das Add-on nahm höchstens 10 MB an, der Supervisor von Home Assistant höchstens 16 MB; ein Backup mit Bildern und 3D-Modellen ist größer. Sein Wunsch: „es sollte keine grenze geben“. Jetzt hat das Einspielen keine Grenze, und der Supervisor reicht die Datei durch (`ingress_stream: true`).

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 177.1 | Test `test_backup_restore_has_no_size_limit` | Ein Backup mit etwa 28 MB wird eingespielt (auch in Stücken ohne Länge, wie vom Supervisor); andere Anfragen über 10 MB bekommen weiter 413 | ✅ (2026-11-09, Claude) |
| 177.2 | Test `test_ingress_passes_large_uploads_on` | `config.yaml` hat `ingress_stream: true` | ✅ (2026-11-09, Claude) |
| 177.2a | Browser-Test Teil `03_houses` | „Backup einspielen…“ über die Seite (neue Route) spielt das Backup ein, der Plan und die Pinnwand kommen zurück | ✅ (2026-11-09, Claude, 135/135) |
| 177.3 | Nach dem Merge im Add-on (Beta, 5.2.4): ⚙ → „Backup & Sicherheit“ → „Backup einspielen…“ mit derselben Datei wie auf dem Bild | „Backup eingespielt: … Häuser“, die Seite lädt neu, Häuser, Bilder und Modelle sind da | ❓ |
| 177.4 | Nach dem Merge im Add-on (Beta): ein 3D-Modell oder ein Bild hochladen, eine Einstellung ändern, einen Raum verschieben | Alles speichert wie vorher (der Supervisor reicht jetzt jede Anfrage durch, statt sie erst einzulesen) | ❓ |

## 178. Neu in 5.3.0: 🪟 zwei Türen oder Fenster übereinander (#694)
Gefragt von ChrisSN86 am 2026-11-09 (#694): in seinem höheren Mittelteil (etwa 3,60 m) sitzt über jeder Terrassentür und über dem Küchenfenster ein eigenes, hoch liegendes Fenster gleicher Breite, mit Wand dazwischen, jedes mit eigenem Rollladen (KNX). Bisher verwarf der Import und der Editor die zweite Öffnung an derselben Stelle. Jetzt dürfen zwei übereinander sitzen, wenn sich ihre Höhen nicht überschneiden.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 178.1 | Unit-Test `openingstack.test.mjs`, Import-Tests `test_openings_one_above_the_other_are_kept`, `test_opening_above_its_wall_is_warned` | Übereinander geht, nebeneinander bleiben 2 cm Wand; die Wandteile nebeneinander wie vorher, übereinander bleibt die Wand dazwischen; der Import behält Tür und Fenster darüber mit je eigenem Rollladen | ✅ (2026-11-09, Claude) |
| 178.2 | Browser-Test Teil `82_stacked_openings` | „＋ Fenster darüber“ bei einer Tür in einer Wand von 3,80 m; das neue Fenster 25 cm über der Tür, gleiche Breite; Brüstung 2,95 / Höhe 0,65; tiefer in die Tür wird abgelehnt mit einer Zeile; im 3D-Bild Wand zwischen Tür und Fenster; „⇅ Darunter / Darüber“; im 2D-Plan oben gestrichelt, zweiter Klick wählt das andere | ✅ (2026-11-09, Claude, 16/16) |
| 178.3 | Browser-Test Teile `02_tools`, `20_editing`, `27_finishes`, `78_fixed_glass`, `79_ui_v2`, `80_ui_v2_more` | Nichts anderes hat sich geändert (Türen und Fenster setzen, verschieben, kopieren, Wandbeläge, Fensterarten, Übernehmen) | ✅ (2026-11-09, Claude) |
| 178.4 | Video „Fenster über der Tür“ probeweise aufnehmen (deutsch und englisch) | Tür anklicken, „＋ Fenster darüber“, Brüstung 2,95 und Höhe 0,65, „Geht nicht“, „⇅ Darunter“, im 2D-Plan gestrichelt und zweiter Klick | ✅ (2026-11-09, Claude, beide Sprachen) |
| 178.5 | Demo: ⚙ → Wandhöhe 3,80 m, dann eine Tür anklicken | In den Eigenschaften steht „＋ Fenster darüber“; antippen setzt ein Fenster gleicher Breite darüber, im 3D-Bild mit Wand dazwischen | ✅ (2026-11-10, Claude in der Demo 5.3.1 mit echten Klicks: Tür „Hauswirtschaft“, Fenster 0,90 m breit ab 2,30 m, im 3D-Bild Wand dazwischen) |
| 178.6 | Demo: beim neuen Fenster „Brüstung“ auf 1 setzen | Geht nicht: der alte Wert bleibt, darunter steht „Geht nicht: so stößt es an …“ | ✅ (2026-11-10, Claude in der Demo 5.3.1) |
| 178.7 | Demo, 2D-Plan: die Tür anklicken, dann noch einmal auf dieselbe Stelle | Das Fenster darüber ist gestrichelt; der zweite Klick wählt das Fenster, ein dritter wieder die Tür | ✅ (2026-11-10, Claude in der Demo 5.3.1: Tür → Fenster → Tür) |
| 178.8 | Nach dem Merge im Add-on (Beta): eine echte Wand höher machen (Wand anklicken → Höhe), Tür/Fenster darunter → „＋ Fenster darüber“, beiden je einen Rollladen geben | Beide Rollläden haben ihre eigene Kugel und bewegen sich getrennt; in der Live-Ansicht öffnet ein Tippen auf die obere bzw. untere Kugel den richtigen Rollladen | ❓ (in der Demo ✅ Claude 2026-11-10, mit Fenstertür und zwei Rollläden; mit echten Rollläden im Add-on nur durch dich) |
| 178.9 | Nach dem Merge in der Anleitung: Video „Fenster über der Tür“, Suche „Fenster über der Tür“ | Die Suche findet das Video | ✅ (2026-11-10, Claude: Seite aus dem Zweig `guide-videos` gebaut, „Fenster über der Tür“ und „window above the door“ finden das Video zuerst, es läuft, 41 s) |

## 179. Repariert in 5.3.1: 🪟 das Schild des unteren Rollladens (#697)
Gefunden beim Machen der Bilder für die Antwort auf #694: bei einer Tür mit Fenster darüber, beide mit Rollladen, stand das Werte-Schild des unteren Rollladens („↕ 50 % offen“) vor dem Fenster darüber. Jetzt steht es auf dem eigenen Fenster, die Kugel bleibt in der Wand dazwischen.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 179.1 | Unit-Test `shutters.test.mjs` | Kugel des unteren Rollladens in der Wand zwischen beiden (bei wenig Platz in der Mitte), Schild auf dem eigenen Fenster, das obere wie bisher; ein Fenster allein wie bisher; Deckenhöhe für Kugeln im ganzen Haus nur bei Fenstern, die höher reichen | ✅ (2026-11-10, Claude) |
| 179.2 | Browser-Test Teile `82_stacked_openings`, `03_houses` | Schild unten auf der Tür, oben über dem Fenster; live die Kugel der Tür unter 2,95 m, die des Fensters darüber; normale Rollläden wie bisher | ✅ (2026-11-10, Claude, 105/105 und 135/135) |
| 179.3 | Demo: ⚙ Wandhöhe 3,80, eine Tür als „Fenstertür / Balkon“, „＋ Fenster darüber“, beiden einen Rollladen geben, dann „Live“ | Das Schild des unteren Rollladens steht auf der Tür, nicht vor dem Fenster darüber; zwei Kugeln, jede öffnet ihren Rollladen | ✅ (2026-11-10, Claude in der Demo 5.3.1: Schild 1,80 m auf der Tür, Kugeln 2,23 m und 3,49 m, jede öffnet ihren Rollladen; die Kugeln zeigen sich nur ohne die Raum-Karten über den Räumen, #430) |

## 180. Verbessert in 5.3.1: 🧪 die Beta im Browser
Wunsch des Besitzers am 2026-11-10: „dass man die Beta auch testen kann, ohne dass man das installieren muss“. Die Demo zeigt jetzt das normale Add-on, die Beta hat eine eigene Demo unter `/beta/`, die Startseite einen Knopf „🧪 Try the beta“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 180.1 | `node build.mjs <datei> --stable` und `--beta` bauen, beide im Browser öffnen | Normal: „v5.3.0 · demo“, im Versionsfenster „Normales Add-on“ (Code aus `floorplan3d-stable/`); Beta: „v5.3.1 Beta · demo“, „Beta-Add-on“; keine Fehler | ✅ (2026-11-10, Claude) |
| 180.2 | Nach dem Merge und dem Freigeben von 5.3.1: https://burned4aim.github.io/HA-Floorplanner/ öffnen, oben auf die Versions-Pille tippen | „v5.3.1 · demo“, im Fenster „Normales Add-on“ | ✅ (2026-11-10, Claude mit der Datei aus „Download the demo“, gleicher Bau wie die Seite: „✓ v5.3.1 · demo“, „Normales Add-on“; die Seite selbst ist von hier gesperrt) |
| 180.3 | https://burned4aim.github.io/HA-Floorplanner/beta/ öffnen | Die Demo startet, die Pille sagt „Beta“ | ✅ (2026-11-10, Claude mit `--beta` gebaut, gleicher Code wie `/beta/`: „✓ v5.3.1 Beta · demo“, „Beta-Add-on“; GitHub hat `beta/index.html` veröffentlicht) |
| 180.4 | Die Startseite auf GitHub (README) | Neben „Try the demo“ und „Download the demo“ der rosa Knopf „🧪 Try the beta“, er öffnet die Beta-Demo | ✅ (2026-11-10, Claude: auf der GitHub-Seite der rosa Knopf „🧪 TRY THE BETA · THE NEWEST CHANGES“ mit dem Link auf `/beta/`) |

## 181. Repariert in 5.3.2: 🏗 Terrasse halb auf der Garage, halb frei (#703)
Gemeldet von Miicki am 2026-11-10 (#703): eine Terrasse im Erdgeschoss eines Hauses am Hang, die zum größten Teil auf der Garage im Keller liegt und 2 m vor dem Wohnzimmer hinausragt, stand mit dem freien Streifen auf einem grauen Sockel bis zum Boden; der verdeckte das Fenster des Hobbyraums darunter. Jetzt hängt nur der Teil frei (eine dünne Platte), der über keinem Raum darunter liegt; aus zwei Räumen gezeichnet gibt es kein Geländer mehr dazwischen.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 181.1 | Unit-Test `balcony.test.mjs` | Terrasse auf der Garage mit Streifen davor: nur der Streifen hängt frei (ab der Außenseite der Kellerwand), „zum Teil“; ein Saum von 10 cm ist kein Balkon; Grundriss ohne den freien Teil; zwei Terrassen: kein Geländer an der Stoßkante | ✅ (2026-11-10, Claude, 16/16) |
| 181.2 | Browser-Test Teile `73_balcony`, `68_terrain`, `11_live`, `08_stairs` | Der Fall aus #703: „Hängt zum Teil frei“, kein Sockel vor dem Fenster, Platte nur unter dem freien Teil, Stützen nur an seinen äußeren Ecken; aus zwei Räumen kein Geländer quer; Balkon, Hang, Dachterrassen und Brücke wie bisher | ✅ (2026-11-10, Claude, 104/104 und 110/110) |
| 181.3 | Vorher/Nachher im Test-Add-on: Haus am Hang wie in #703, ganzes Haus von vorne | Vorher verdeckt ein grauer Sockel Kellerfenster und Garagentor; nachher hängt der Streifen als dünne Platte frei, Fenster und Tor sind zu sehen | ✅ (2026-11-10, Claude, Bilder `docs/antworten/703/`) |
| 181.4 | Demo (Beta, `/beta/`): „Bearbeiten“, Etage „Obergeschoss“, die „Dachterrasse“ anklicken; im 2D-Plan ihre zwei unteren Ecken 2 m nach unten ziehen (über die Garage hinaus) | Die Zeile unter „Stützen bis zum Boden“ sagt „Hängt zum Teil frei …“; im 3D-Bild trägt unter dem neuen Stück eine dünne Platte, über der Garage bleibt es wie vorher | ✅ (2026-11-10, Claude in der Beta-Demo 5.3.2, Ecken per Skript verschoben: „Hängt zum Teil frei“, Platte nur von 6,14 bis 8 m; vorher „Liegt auf …“, der Balkon „Hängt frei“) |
| 181.5 | Nach dem Merge: dasselbe in der Beta-Demo mit der Maus, wie in 181.4 | Wie 181.4 | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.0 vom `main` mit echten Mausklicks: Terrasse angeklickt, beide Ecken nach unten gezogen, „Hängt zum Teil frei“, Platte nur von 6,1 bis 8 m) |
| 181.6 | Nach dem Merge in der Anleitung: Suche „Terrasse über der Garage“ | Findet das Video „Balkon mit Geländer“ | ✅ (2026-11-10, Claude: die Suche findet „Balkon mit Geländer“ als Erstes) |
| 181.7 | Antwort von Miicki in #703 | Seine Terrasse hängt vorne frei, das Kellerfenster ist zu sehen | ❓ |

## 182. Neu in 5.4.0: 🌡 woher die Raumtemperatur kommt (#705)
Gewünscht von Miicki am 2026-11-10 (#705): im Wohnzimmer zeigte das Schild 21,7 °C (das Mittel aus einem Netatmo-Modul und dem warmen dingz-Schalter), das Thermostat maß 23 °C. Jetzt hat ein Raum „Temperatur von“ und „Luftfeuchte von“: Automatisch, Thermostat oder genau ein Sensor.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 182.1 | Unit-Tests `roomsource.test.mjs`, `roomtiles.test.mjs`, `climate.test.mjs`, Import-Test `test_room_temperature_source_survives_export` | Automatisch wie bisher (21,65), Thermostat 23, ein Sensor nur sein Wert; ein gewählter Sensor, der nichts meldet: kein Wert (kein anderer dafür); Feld nur bei mehr als einer Quelle; Kacheln und Klima-Seite folgen; Import/Export behalten die Wahl | ✅ (2026-11-10, Claude) |
| 182.2 | Browser-Test Teil `83_room_source` | Feld mit allen Quellen und ihren Werten, „Luftfeuchte von“ genauso; Thermostat gespeichert als `climate`; Kachel und 🌡 Klima zeigen 23,0°; ein Sensor gewählt: nur sein Wert; zurück auf Automatisch: nichts gespeichert, wieder das Mittel; ein Raum nur mit Thermostat hat kein Feld; mit „✨ Neu“ beide Felder unter dem Reiter „Geräte“, „🔍 Einstellung suchen“ findet „Temperatur von“ | ✅ (2026-11-10, Claude, 13/13; dazu `25_sky_tiles`, `33_climate_routines_family`, `79_ui_v2`, `80_ui_v2_more`, `56_roomsensors`, `42_voice` grün) |
| 182.3 | Video „Woher die Raumtemperatur kommt“ probeweise aufnehmen | Wohnzimmer anklicken, „Temperatur von“: Automatisch · 22,3 °C, Thermostat · 21,4 °C, ein Sensor; im Live-Bild zeigt die Kachel den gewählten Wert | ✅ (2026-11-10, Claude) |
| 182.4 | Demo (Beta, `/beta/`): „Bearbeiten“, Erdgeschoss, das Wohnzimmer anklicken, rechts zu „Temperatur von“; dasselbe mit „✨ Neu“ (Reiter „Geräte“) | Gewählt ist „Thermostat · 21,4 °C“; die Liste zeigt „Automatisch · 22,3 °C“, den Lichtschalter mit 23,1 °C und „Wohnzimmer Temperatur“; in „✨ Neu“ unter „Geräte“, die Suche „Temperatur“ findet es | ✅ (2026-11-10, Claude in der gebauten Beta-Demo, klassisch und „✨ Neu“) |
| 182.5 | Nach dem Merge in der Beta-Demo: dort „Automatisch“ wählen, dann „Live“ | Die Kachel und das Schild des Wohnzimmers zeigen 22,3° statt 21,4° | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.0 vom `main` mit echten Klicks, klassisch und „✨ Neu“: vorher „Thermostat · 21,4 °C“, nach „Automatisch“ zeigt die Kachel 22,3°) |
| 182.6 | Nach dem Merge im Add-on (Beta) mit einem eigenen Raum, in dem Thermostat und Sensor verschiedene Werte haben | „Temperatur von“ zeigt beide Werte; „Thermostat“ gewählt: Schild, Kachel und 🌡 Klima zeigen den Wert des Thermostats; die Heizung regelt wie vorher | ❓ |
| 182.7 | Nach dem Merge in der Anleitung: Suche „Raumtemperatur vom Thermostat“ | Findet das Video „Woher die Raumtemperatur kommt“ | ✅ (2026-11-10, Claude: die Suche findet „Woher die Raumtemperatur kommt“ als Erstes) |
| 182.8 | Antwort von Miicki in #705 | Sein Wohnzimmer zeigt die 23 °C des Thermostats | ❓ |

## 183. Repariert und verbessert in 5.4.1: ☀ Solarmodule aus dem Dach-Editor, ✨ Seitenleiste (#709)
Gemeldet vom Besitzer am 2026-11-10 mit zwei Bildern: im Dach-Editor ein Tipp auf die Solarmodule „springt direkt zurück“ (#709). Dazu sein Wunsch: ein im Feld aufgeklappter Abschnitt soll auch in der Seitenleiste markiert sein, und die Seitenleiste „etwas stylischer“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 183.1 | Browser-Test Teile `81_roof_lock` und `80_ui_v2_more` | Die Zeile „☀ … ›“ und die Module im Bild von oben öffnen die Felder der Module, das Dach kommt nicht zurück; die Reiter der aufgeklappten Abschnitte leuchten, zu- und aufklappen ändert den Reiter sofort; der ins Seitenfach gezogene ist gefüllt | ✅ (2026-11-10, Claude) |
| 183.2 | Demo mit echten Mausklicks: „Bearbeiten“, „✨ Neu“, Etage „Dach“, das Dach anklicken, „Auf dem Dach“, die Zeile „☀ PV Dach … ›“; dann wieder das Dach und die Module im Bild von oben | Rechts stehen die Felder von „PV Dach“ (Panels nebeneinander, Reihen, Montage) und bleiben stehen | ✅ (2026-11-10, Claude, vorher sprang es zurück zum Dach) |
| 183.3 | Demo: in „✨ Neu“ ein Gerät anklicken, rechts „Lage“ aufklappen, dann wieder zuklappen | Der Reiter „Lage“ links an der Leiste leuchtet (farbiger Strich, blauer Ton), zugeklappt ist er wieder schlicht | ✅ (2026-11-10, Claude) |
| 183.4 | Nach dem Merge in der Beta-Demo (`/beta/`): dasselbe wie 183.2 mit dem Finger am iPad | Wie 183.2 | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2 mit Finger-Tipps am iPad quer und hochkant, dazu mit der Maus am PC: Zeile „☀ PV Dach ›“, die Module im Bild von oben, die Module im 3D-Bild und der Weg über die Etagen-Karte im Baum öffnen die Felder der Module, nichts springt zurück) |
| 183.5 | Nach dem Merge: die Seitenleiste ansehen (Reiter antippen, ins Seitenfach ziehen, mit der Maus darüber) | Gefällt dir das neue Aussehen? | ❌ (2026-11-10, Besitzer: „seltsam … wenn sich alle Sachen nach links bewegen“; geändert in 5.4.2, Abschnitt 184) |

## 184. Verbessert in 5.4.2: ✨ ein Reiter springt zu seinem Abschnitt
Gewünscht vom Besitzer am 2026-11-10 mit einem Bild der Tür: „seltsam … wenn sich alle Sachen nach links bewegen“; aus vier Vorschlägen (A bis D, als Bilder) wählte er D: kein Seitenfach mehr, ein Tipp auf den Reiter springt im Feld zum Abschnitt.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 184.1 | Browser-Test Teil `80_ui_v2_more` | Ein Tipp auf „Rollladen“ klappt ihn im Feld auf, bringt ihn ins Bild und lässt ihn leuchten; kein Seitenfach, die Reiter bleiben stehen; sein Feld geht dort; „Größe & Lage“ springt wieder nach oben; ein zweiter Tipp lässt ihn offen | ✅ (2026-11-10, Claude) |
| 184.2 | Demo: „Bearbeiten“, „✨ Neu“, ein Fenster anklicken, links den Reiter „Feste Scheibe“ antippen | Rechts klappt „Feste Scheibe“ auf, rückt ins Bild und leuchtet kurz blau; links bewegt sich nichts | ✅ (2026-11-10, Claude) |
| 184.3 | Nach dem Merge in der Beta-Demo (`/beta/`): eine Tür anklicken, die Reiter „Ausführung“ und „Home Assistant“ antippen, am PC und am iPad | Wie 184.2; gefällt es dir so? | ✅ (2026-11-10, Claude in der Beta-Demo 5.4.2: Tür im Schlafzimmer, „Ausführung“ und „Home Assistant“ mit der Maus am PC und dem Finger am iPad quer: klappt auf, kommt ins Bild, leuchtet, die Reiter bleiben stehen; am iPad hochkant gibt es die Reiter nicht, Absicht: erst ab 1000 px Breite) |
| 184.4 | Nach dem Merge in der Beta-Demo: die Reiter selbst ausprobieren | Gefällt es dir so? | ❓ |

## 185. Repariert in 5.4.3: ▲ das Plateau hebt den Keller nicht mehr an (#713)
Gemeldet vom Besitzer am 2026-11-10 mit drei Bildern (Fassung „Eltern“): „ich habe nur ein Plateau im EG, aber im Keller ist jetzt auch der Boden erhöht“. Im Keller stand unter jedem Raum „▲ +0.60 m“, im 3D-Bild schwebte der Kellerboden.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 185.1 | Unit-Test `levels.test.mjs` und Browser-Test Teil `55_levels` | Ein Kellerraum unter dem Plateau bleibt auf seiner Etage, der 2D-Plan des Kellers zeigt kein „▲ +…“; die Treppe vom Keller ins EG ist um das Plateau höher; das EG geht weiter mit dem Plateau hoch | ✅ (2026-11-10, Claude) |
| 185.2 | Im Add-on, Fassung „Eltern“: „Bearbeiten“, 2D, Etage „Keller“ | Unter den Räumen (Raum 1, Raum 2, Raum 3, Heizungsraum) steht kein „▲ +0.60 m“ mehr | ❓ |
| 185.3 | Im Add-on, Fassung „Eltern“: 3D, Etage „Keller“ | Der Kellerboden liegt unten auf seiner Höhe, er schwebt nicht mehr | ❓ |
| 185.4 | Im Add-on: „Ganzes Haus“ ansehen (wenn es eine Treppe vom Keller ins EG gibt, diese anschauen) | Das EG steht auf dem Plateau, der Keller in der Erde darunter, ohne Lücke dazwischen; die Treppe kommt oben im EG an | ❓ |

## 186. Neu in 5.5.0: 🏘 das Gebäude oben gilt für alles aus Home Assistant (#715)
Gemeldet vom Besitzer am 2026-11-11: „selbst wenn ich oben Gebäude 1 auswähle, werden mir Geräte und Automatisierungen und so weiter von Gebäude 2 angezeigt, auch in allen Dashboards“. Nachgestellt mit zwei Häusern in einem Plan: was nicht im Plan stand (und nicht im Bereich eines verknüpften Raums lag), gehörte zu keinem Gebäude; Automationen, Skripte und die Listen auf ▶ Abläufe wurden gar nicht gefiltert. Jetzt gehört ein ganzer Bereich von Home Assistant zu einem Gebäude (von selbst oder gewählt), Automationen folgen ihren Geräten.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 186.1 | `node --test tests/buildingents.test.mjs`, `pytest tests/test_usedby.py tests/test_rules_api.py` | Ein Bereich gehört zum Gebäude seiner Geräte im Plan, sonst zum Gebäude mit einem Raum dieses Namens; gewählt gewinnt; „Alle Gebäude“ zeigt immer; Automation, Skript, Szene nach dem, was sie benutzen (auch über Skript → Szene, über `area_id` und `device_id`); `api/uses` für jeden Benutzer | ✅ (2026-11-11, Claude) |
| 186.2 | Browser-Test Teil `84_building_scope` (dazu `77_pause_buildings`, `21_buildings`, `33_climate_routines_family`, `34_dashboards`) | Haus A oben: eigene Seite ohne die Karten von B, gemischte Liste nur mit den Zeilen von A, 🎵 ohne den Fernseher von B, ▶ Abläufe ohne Knöpfe, Szenen und Automationen von B, „Ich gehe“ nennt und stoppt den Fernseher von B nicht; das Feld zeigt „automatisch (Haus B)“ und „Ohne Gebäude“, der Keller von Hand zu Haus B; ✨ Neu zeigt die Liste auch | ✅ (2026-11-11, Claude) |
| 186.3 | Im Add-on mit deinen zwei Häusern: „Bearbeiten“, „🏘 Gebäude in diesem Plan“, unten „Bereiche von Home Assistant“ aufklappen | Jeder Bereich steht da mit „automatisch (…)“ und dem richtigen Gebäude; wo „kein Gebäude“ oder das falsche steht, das Gebäude wählen | ❓ |
| 186.4 | Im Add-on: darunter „Ohne Gebäude: n“ aufklappen | Dort steht nur noch, was wirklich zu keinem Haus gehört (Wetter, Personen …); was zu einem Haus gehört, in Home Assistant einem Bereich geben | ❓ |
| 186.5 | Im Add-on: „Live“, oben Gebäude 1 wählen, dann Klima, Kameras, Musik & TV, Haushalt, Abläufe, Protokoll und deine eigenen Seiten ansehen | Nichts mehr von Gebäude 2: keine Geräte, keine Szenen, keine Automationen; mit Gebäude 2 oben umgekehrt, mit „🏘 Alle Gebäude“ alles | ❓ |
| 186.6 | Im Add-on mit Gebäude 1 oben: ▶ Abläufe, „Ich gehe“ antippen (läuft im anderen Haus gerade Musik: umso besser) | Die Liste nennt nur Lichter, Fenster, Musik und Schlösser von Gebäude 1; „Alles aus“ lässt das andere Haus in Ruhe | ❓ |
| 186.7 | Nach dem Merge auf der Seite der Anleitung das Video „🏘 Bereiche von Home Assistant gehören zu einem Gebäude“ ansehen | Zeigt die Liste der Bereiche, „automatisch (Haupthaus)“, einen Bereich von Hand zuordnen und „Ohne Gebäude“ | ❓ |

## 187. Neu in 5.6.0: ⚡ der Strom-Rechner übersichtlicher, 🌡 der Thermostat-Kreis springt nicht mehr zurück (#718)
Der Besitzer am 2026-11-11: „wenn ich in dem Halbkreis das hin und her ziehe, springt es immer wieder auf dieselbe Temperatur zurück. Und wenn ich die Minus- und Plus-Tasten verwende, dann funktioniert es“ und „dass du den Stromrechner besser machst … dass der besser aussieht und man ihn einfacher bedienen kann“. In der Demo nachgestellt: nimmt der Browser den Finger zum Scrollen (wie auf dem iPad), brach das Ziehen ab und die alte Temperatur wurde geschickt; ein Wisch über die Zahl in der Mitte stellte sogar eine Temperatur ein.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 187.1 | Unit-Tests `thermostat.test.mjs`, `energylook.test.mjs`, `energycalc.test.mjs` | Nur der Ring dreht, nicht die Mitte; eine geschickte Temperatur bleibt, bis das Thermostat sie meldet (höchstens 15 s); jeder Teil des Strom-Rechners hat Zeichen, Farbe, Status (gewählt, aus dem Plan, fehlt, keine) und Wert | ✅ (2026-11-11, Claude) |
| 187.2 | Browser-Test Teile `33_climate_routines_family`, `34_dashboards`, `15_energy`, `22_energy_setup` | Ziehen und − / + schicken je einmal; ein Druck in der Mitte und ein Ziehen hin und zurück schicken nichts; der Strom-Rechner rechnet wie vorher, Warnungen, Vorzeichen, Räume und Checkliste gehen | ✅ (2026-11-11, Claude) |
| 187.3 | Demo am „iPad“ (Finger-Ziehen, auch wenn der Browser das Scrollen nicht sperrt) | Der Kreis folgt dem Finger und bleibt beim neuen Wert; ein Wisch über die Mitte scrollt die Seite und ändert nichts | ✅ (2026-11-11, Claude) |
| 187.4 | Im Add-on am iPad: „Klima“, an einem Thermostat den Punkt am Ring hin und her ziehen und loslassen | Die Zahl folgt dem Finger und bleibt nach dem Loslassen stehen, sie springt nicht zurück; nach ein paar Sekunden meldet das Thermostat den neuen Wert | ❓ |
| 187.5 | Im Add-on: dasselbe an einer eigenen Karte „Thermostat“ (eigene Seite) | Wie 187.4 | ❓ |
| 187.6 | Im Add-on am iPad: auf der Klima-Seite über die Zahl in der Mitte eines Kreises nach oben wischen | Die Seite scrollt, die Temperatur bleibt | ❓ |
| 187.7 | Im Add-on: „Bearbeiten“, „Strom“, „⚡ Rechnung“ | Oben das Strom-Bild neben der Rechnung, darunter „🧭 Einrichten“ und je Teil eine Karte; du verstehst auf einen Blick, woher jeder Wert kommt | ❓ |
| 187.8 | Im selben Fenster: oben in der Leiste „Batterie“ antippen, dann in der Rechnung die Zeile „Bezug aus dem Netz“ | Das Fenster springt zur Karte „Batterie“ bzw. „Netz“, die Karte leuchtet kurz auf, in der Leiste ist der gezeigte Teil markiert | ❓ |
| 187.9 | Dein Eindruck: ist der Strom-Rechner jetzt leichter zu verstehen und zu bedienen? | Ja, oder was noch fehlt | ❓ |
| 187.10 | Nach dem Merge auf der Seite der Anleitung die Videos „⚡ Der Strom-Rechner“ und „🌡 Klima“ ansehen | Zeigen das neue Fenster mit Leiste und Karten bzw. das Ziehen am Ring | ❓ |
| 187.11 | Browser-Test Teil `76_energy_buildings` (zwei Gebäude) | Ganz oben die Karte „🏘 2 Gebäude in diesem Plan“ mit dem Haken; mit Haken steht „Rechnung für“ auch im Titel, ein Tipp dort wählt das Gebäude, die Rechnung nennt es | ✅ (2026-11-11, Claude) |
| 187.12 | Im Add-on mit deinen zwei Gebäuden: „⚡ Rechnung“ öffnen, ganz oben in „🏘 2 Gebäude in diesem Plan“ den Haken „⚡ Eigene Rechnung je Gebäude“ setzen, dann oben im Titel „Rechnung für“ zwischen deinen Gebäuden wechseln | Jedes Gebäude hat seine eigene Rechnung mit eigenen Sensoren; die Überschrift „So wird gerade gerechnet · 🏠 …“ nennt das gewählte | ❓ |
